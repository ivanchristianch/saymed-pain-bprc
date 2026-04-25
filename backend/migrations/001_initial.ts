import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users_tab')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('email', 'varchar', (col) => col.notNull().unique())
    .addColumn('hashed_password', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'bigint', (col) => col.notNull())
    .addColumn('updated_at', 'bigint', (col) => col.notNull())
    .addColumn('deleted_at', 'bigint')
    .execute();

  await db.schema
    .createTable('patients_tab')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('date_of_birth', 'bigint', (col) => col.notNull())
    .addColumn('medical_record_number', 'varchar', (col) => col.notNull().unique())
    .addColumn('marital_status', 'varchar', (col) => col.notNull())
    .addColumn('blood_group', 'varchar', (col) => col.notNull())
    .addColumn('address', 'text', (col) => col.notNull())
    .addColumn('created_at', 'bigint', (col) => col.notNull())
    .addColumn('updated_at', 'bigint', (col) => col.notNull())
    .addColumn('deleted_at', 'bigint')
    .execute();

  await db.schema
    .createTable('encounters_tab')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('patient_id', 'integer', (col) => col.references('patients_tab.id').onDelete('cascade').notNull())
    .addColumn('encounter_name', 'varchar')
    .addColumn('created_at', 'bigint', (col) => col.notNull())
    .addColumn('updated_at', 'bigint', (col) => col.notNull())
    .addColumn('deleted_at', 'bigint')
    .execute();

  await db.schema
    .createTable('encounter_details_tab')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('encounter_id', 'integer', (col) => col.references('encounters_tab.id').onDelete('cascade').notNull().unique())
    .addColumn('audio_file', 'varchar')
    .addColumn('transcript_path', 'varchar')
    .addColumn('details', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'bigint', (col) => col.notNull())
    .addColumn('updated_at', 'bigint', (col) => col.notNull())
    .addColumn('deleted_at', 'bigint')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('encounter_details_tab').execute();
  await db.schema.dropTable('encounters_tab').execute();
  await db.schema.dropTable('patients_tab').execute();
  await db.schema.dropTable('users_tab').execute();
}
