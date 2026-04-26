import { ProcessService } from './process.service.js';
import { getActiveEncounterIds, removeFromActiveSet, forceReleaseLock } from '../redis.js';
import { getLogger } from '../logger.js';

/**
 * Boot-time recovery service.
 *
 * DETECTION
 * ─────────
 * When a pipeline starts, the encounter ID is added to the Redis Set
 * `active_pipeline_encounters` (after acquiring the lock). It is removed in
 * the .finally() before the lock is released. If the process is killed
 * mid-pipeline, the set entry is never removed.
 *
 * On the next boot, SMEMBERS returns the orphaned encounter IDs — no DB scan needed.
 *
 * BEST-EFFORT
 * ───────────
 * If Redis itself crashes, the set is lost and those encounters will not be
 * recovered — they will time out naturally. This is acceptable.
 *
 * RECOVERY STEPS (per encounter)
 * ────────────────────────────────
 *   1. Remove from the active set (clean up the stale entry).
 *   2. Force-release the stale lock so triggerInternal can re-acquire it.
 *   3. Call triggerInternal(encounterId) — re-acquires lock, fires
 *      runPipelineBackground as fire-and-forget. Recovery returns immediately.
 *
 * runPipelineBackground will find the PENDING row, see started_at in the past
 * (well beyond TRANSCRIPT_TIMEOUT_MS / ANALYSIS_TIMEOUT_MS), treat it as
 * timed-out, and create a fresh job — identical to the normal timeout path.
 */
export class RecoveryService {
  constructor(private processService: ProcessService) {}

  async recoverPendingJobs(): Promise<void> {
    const logger = getLogger();
    logger.info({ msg: '[Recovery] Starting boot-time pipeline recovery scan' });

    const encounterIds = await getActiveEncounterIds();

    if (encounterIds.length === 0) {
      logger.info({ msg: '[Recovery] No active encounters in set — nothing to recover' });
      return;
    }

    logger.info({ msg: '[Recovery] Stale active encounters found', encounterIds });

    let recovered = 0;

    for (const encounterId of encounterIds) {
      try {
        // Clean up the set entry first, then release the stale lock.
        // triggerInternal will re-add to the set after acquiring a fresh lock.
        await removeFromActiveSet(encounterId);
        await forceReleaseLock(encounterId);
        await this.processService.triggerInternal(encounterId);

        recovered++;
        logger.info({ msg: '[Recovery] Pipeline re-triggered (background)', encounterId });
      } catch (err: any) {
        logger.error({
          msg: '[Recovery] Failed to recover encounter — skipping',
          encounterId,
          err: err?.message ?? String(err),
        });
      }
    }

    logger.info({ msg: '[Recovery] Boot-time recovery complete', recovered, total: encounterIds.length });
  }
}
