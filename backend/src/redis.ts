import { Redis } from 'ioredis';
import { PIPELINE_LOCK_TTL_MS } from './constants.js';
import { getLogger } from './logger.js';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  // Queue commands while reconnecting instead of failing immediately
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => Math.min(times * 200, 2000),
});

redis.on('error', (err: Error) => {
  getLogger().error({ msg: 'Redis error', err: err.message });
});

redis.on('connect', () => {
  getLogger().info({ msg: 'Redis connected', url: process.env.REDIS_URL || 'redis://localhost:6379' });
});

/**
 * Attempt to acquire a distributed lock for a given encounter pipeline.
 * Uses Redis SET NX PX to atomically set only if not already set.
 * Returns true if the lock was acquired, false if already held.
 */
export async function acquireLock(encounterId: number): Promise<boolean> {
  const key = `process_lock:encounter:${encounterId}`;
  
  // Use the options object syntax to satisfy TypeScript overloads
  const result = await redis.set(
    key, 
    '1', 
    'PX', PIPELINE_LOCK_TTL_MS, 
    'NX'
  );

  return result === 'OK';
}

/**
 * Release the distributed lock for a given encounter pipeline.
 */
export async function releaseLock(encounterId: number): Promise<void> {
  const key = `process_lock:encounter:${encounterId}`;
  await redis.del(key);
}

/**
 * Forcibly release a stale lock left by a crashed/killed process.
 * Semantically identical to releaseLock but intent is made explicit for recovery context.
 */
export async function forceReleaseLock(encounterId: number): Promise<void> {
  const key = `process_lock:encounter:${encounterId}`;
  await redis.del(key);
}

/**
 * Check whether a pipeline lock currently exists for the given encounter.
 * Used by the boot-time recovery scanner to identify in-flight jobs that were
 * abandoned when the previous process was killed.
 */
export async function hasLock(encounterId: number): Promise<boolean> {
  const key = `process_lock:encounter:${encounterId}`;
  const result = await redis.exists(key);
  return result === 1;
}

// ─── Active pipeline set ──────────────────────────────────────────────────────
// Tracks which encounter IDs currently have a pipeline running.
// Used by boot-time recovery: SMEMBERS gives the full list of in-flight
// encounters without any DB scan.
//
// Best-effort: if Redis crashes the set is lost, and those encounters will not
// be recovered on the next boot — they will time out naturally instead.

const ACTIVE_SET_KEY = 'active_pipeline_encounters';

/**
 * Add an encounter to the active-pipeline set.
 * Called immediately after acquireLock succeeds.
 */
export async function addToActiveSet(encounterId: number): Promise<void> {
  await redis.sadd(ACTIVE_SET_KEY, String(encounterId));
}

/**
 * Remove an encounter from the active-pipeline set.
 * Called in the pipeline .finally() before releaseLock.
 */
export async function removeFromActiveSet(encounterId: number): Promise<void> {
  await redis.srem(ACTIVE_SET_KEY, String(encounterId));
}

/**
 * Return all encounter IDs currently in the active-pipeline set.
 * Called once at boot by RecoveryService.
 */
export async function getActiveEncounterIds(): Promise<number[]> {
  const members = await redis.smembers(ACTIVE_SET_KEY);
  return members.map(Number);
}
