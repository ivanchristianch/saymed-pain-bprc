import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  const now = Date.now();

  // 1. Create transcript_tab
  await db.schema
    .createTable('transcript_tab')
    .addColumn('transcript_id', 'serial', (col) => col.primaryKey())
    .addColumn('encounter_details_id', 'integer', (col) =>
      col.references('encounter_details_tab.id').onDelete('cascade').notNull(),
    )
    .addColumn('audio_file', 'varchar', (col) => col.notNull())
    .addColumn('transcript_path', 'varchar')
    .addColumn('state', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('error_msg', 'varchar')
    .addColumn('started_at', 'bigint')
    .addColumn('ended_at', 'bigint')
    .addColumn('created_at', 'bigint', (col) => col.notNull())
    .addColumn('updated_at', 'bigint', (col) => col.notNull())
    .execute();

  // 2. Create analysis_tab
  await db.schema
    .createTable('analysis_tab')
    .addColumn('analysis_id', 'serial', (col) => col.primaryKey())
    .addColumn('encounter_details_id', 'integer', (col) =>
      col.references('encounter_details_tab.id').onDelete('cascade').notNull(),
    )
    .addColumn('transcript_id', 'integer', (col) =>
      col.references('transcript_tab.transcript_id').onDelete('cascade').notNull(),
    )
    .addColumn('result', 'jsonb')
    .addColumn('state', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('error_msg', 'varchar')
    .addColumn('started_at', 'bigint')
    .addColumn('ended_at', 'bigint')
    .addColumn('created_at', 'bigint', (col) => col.notNull())
    .addColumn('updated_at', 'bigint', (col) => col.notNull())
    .execute();

  // 3. Data-migrate existing transcript_path values from encounter_details_tab
  //    into synthetic transcript_tab rows (state=1 = success) so existing users
  //    don't lose their transcripts.
  const existingDetails = await sql`SELECT id, audio_file, transcript_path FROM encounter_details_tab WHERE transcript_path IS NOT NULL`.execute(db) as { rows: Array<{ id: number; audio_file: string | null; transcript_path: string | null }> };

  for (const row of existingDetails.rows) {
    if (row.audio_file && row.transcript_path) {
      await db
        .insertInto('transcript_tab' as any)
        .values({
          encounter_details_id: row.id,
          audio_file: row.audio_file,
          transcript_path: row.transcript_path,
          state: 1,
          started_at: now,
          ended_at: now,
          created_at: now,
          updated_at: now,
        })
        .execute();
    }
  }

  // 4. Drop transcript_path column from encounter_details_tab
  await db.schema
    .alterTable('encounter_details_tab')
    .dropColumn('transcript_path')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore transcript_path column
  await db.schema
    .alterTable('encounter_details_tab')
    .addColumn('transcript_path', 'varchar')
    .execute();

  // Restore latest successful transcript_path back to encounter_details_tab
  await sql`
    UPDATE encounter_details_tab ed
    SET transcript_path = t.transcript_path
    FROM (
      SELECT DISTINCT ON (encounter_details_id)
        encounter_details_id,
        transcript_path
      FROM transcript_tab
      WHERE state = 1 AND transcript_path IS NOT NULL
      ORDER BY encounter_details_id, transcript_id DESC
    ) t
    WHERE ed.id = t.encounter_details_id
  `.execute(db);

  await db.schema.dropTable('analysis_tab').execute();
  await db.schema.dropTable('transcript_tab').execute();
}
