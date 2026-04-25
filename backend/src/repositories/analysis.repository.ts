import { db } from '../db.js';
import { Analysis } from '../types/db.js';
import { ANALYSIS_STATE } from '../constants.js';

export class AnalysisRepository {
  async findLatestForTranscript(
    encounterDetailsId: number,
    transcriptId: number,
  ): Promise<Analysis | undefined> {
    return db
      .selectFrom('analysis_tab')
      .selectAll()
      .where('encounter_details_id', '=', encounterDetailsId)
      .where('transcript_id', '=', transcriptId)
      .orderBy('analysis_id', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  async findLatestSuccessForTranscript(
    encounterDetailsId: number,
    transcriptId: number,
  ): Promise<Analysis | undefined> {
    return db
      .selectFrom('analysis_tab')
      .select('result')
      .where('encounter_details_id', '=', encounterDetailsId)
      .where('transcript_id', '=', transcriptId)
      .where('state', '=', ANALYSIS_STATE.SUCCESS)
      .orderBy('analysis_id', 'desc')
      .limit(1)
      .executeTakeFirst() as Promise<Analysis | undefined>;
  }

  async createJob(encounterDetailsId: number, transcriptId: number): Promise<{ analysis_id: number }> {
    const now = Date.now();
    return db
      .insertInto('analysis_tab')
      .values({
        encounter_details_id: encounterDetailsId,
        transcript_id: transcriptId,
        state: ANALYSIS_STATE.PENDING,
        started_at: now,
        created_at: now,
        updated_at: now,
      })
      .returning('analysis_id')
      .executeTakeFirstOrThrow();
  }

  async markSuccess(analysisId: number, result: string): Promise<void> {
    await db
      .updateTable('analysis_tab')
      .set({
        state: ANALYSIS_STATE.SUCCESS,
        result,
        ended_at: Date.now(),
        updated_at: Date.now(),
      })
      .where('analysis_id', '=', analysisId)
      .execute();
  }

  async markError(analysisId: number, errorMsg: string): Promise<void> {
    await db
      .updateTable('analysis_tab')
      .set({
        state: ANALYSIS_STATE.ERROR,
        error_msg: errorMsg,
        ended_at: Date.now(),
        updated_at: Date.now(),
      })
      .where('analysis_id', '=', analysisId)
      .execute();
  }
}
