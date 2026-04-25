import { db } from '../db.js';
import { Transcript, NewTranscript } from '../types/db.js';
import { TRANSCRIPT_STATE } from '../constants.js';

export class TranscriptRepository {
  async findLatestForAudio(
    encounterDetailsId: number,
    audioFile: string,
  ): Promise<Transcript | undefined> {
    return db
      .selectFrom('transcript_tab')
      .selectAll()
      .where('encounter_details_id', '=', encounterDetailsId)
      .where('audio_file', '=', audioFile)
      .orderBy('transcript_id', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  async findLatestSuccessForAudio(
    encounterDetailsId: number,
    audioFile: string,
  ): Promise<Transcript | undefined> {
    return db
      .selectFrom('transcript_tab')
      .selectAll()
      .where('encounter_details_id', '=', encounterDetailsId)
      .where('audio_file', '=', audioFile)
      .where('state', '=', TRANSCRIPT_STATE.SUCCESS)
      .orderBy('transcript_id', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  async findById(transcriptId: number): Promise<Transcript | undefined> {
    return db
      .selectFrom('transcript_tab')
      .selectAll()
      .where('transcript_id', '=', transcriptId)
      .executeTakeFirst();
  }

  async createJob(encounterDetailsId: number, audioFile: string): Promise<{ transcript_id: number }> {
    const now = Date.now();
    return db
      .insertInto('transcript_tab')
      .values({
        encounter_details_id: encounterDetailsId,
        audio_file: audioFile,
        state: TRANSCRIPT_STATE.PENDING,
        started_at: now,
        created_at: now,
        updated_at: now,
      })
      .returning('transcript_id')
      .executeTakeFirstOrThrow();
  }

  async markSuccess(transcriptId: number, transcriptPath: string): Promise<void> {
    await db
      .updateTable('transcript_tab')
      .set({
        state: TRANSCRIPT_STATE.SUCCESS,
        transcript_path: transcriptPath,
        ended_at: Date.now(),
        updated_at: Date.now(),
      })
      .where('transcript_id', '=', transcriptId)
      .execute();
  }

  async markError(transcriptId: number, errorMsg: string): Promise<void> {
    await db
      .updateTable('transcript_tab')
      .set({
        state: TRANSCRIPT_STATE.ERROR,
        error_msg: errorMsg,
        ended_at: Date.now(),
        updated_at: Date.now(),
      })
      .where('transcript_id', '=', transcriptId)
      .execute();
  }
}
