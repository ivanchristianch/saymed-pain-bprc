import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Create business_tab
  await db.schema
    .createTable('business_tab')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('business_name', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'bigint', (col) => col.notNull())
    .addColumn('updated_at', 'bigint', (col) => col.notNull())
    .addColumn('deleted_at', 'bigint')
    .execute();

  // 2. Seed the first business
  const now = Date.now();
  await sql`INSERT INTO business_tab (id, business_name, created_at, updated_at) VALUES (1, 'Saymed Company', ${now}, ${now})`.execute(db);

  // 3. Add business_id FK column (nullable first so backfill can run)
  await db.schema
    .alterTable('users_tab')
    .addColumn('business_id', 'integer', (col) =>
      col.references('business_tab.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .alterTable('patients_tab')
    .addColumn('business_id', 'integer', (col) =>
      col.references('business_tab.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .alterTable('encounters_tab')
    .addColumn('business_id', 'integer', (col) =>
      col.references('business_tab.id').onDelete('set null'),
    )
    .execute();

  // 4. Backfill existing rows to business_id = 1
  await sql`UPDATE users_tab SET business_id = 1`.execute(db);
  await sql`UPDATE patients_tab SET business_id = 1`.execute(db);
  await sql`UPDATE encounters_tab SET business_id = 1`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('encounters_tab').dropColumn('business_id').execute();
  await db.schema.alterTable('patients_tab').dropColumn('business_id').execute();
  await db.schema.alterTable('users_tab').dropColumn('business_id').execute();
  await db.schema.dropTable('business_tab').execute();
}
