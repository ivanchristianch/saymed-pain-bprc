import * as path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import { Kysely, Migrator, PostgresDialect, FileMigrationProvider } from 'kysely';
import dotenv from 'dotenv';
import { Database } from './types/db.js';
import { baseLogger } from './logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateToLatest() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '../migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      baseLogger.info({ msg: 'Migration executed successfully', migration: it.migrationName });
    } else if (it.status === 'Error') {
      baseLogger.error({ msg: 'Migration failed', migration: it.migrationName });
    }
  });

  if (error) {
    baseLogger.error({ msg: 'Migration runner failed', err: String(error) });
    process.exit(1);
  }

  await db.destroy();
}

migrateToLatest();
