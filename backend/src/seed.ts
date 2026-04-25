import bcrypt from 'bcrypt';
import { db } from './db.js';
import { baseLogger } from './logger.js';

async function seed() {
  baseLogger.info({ msg: 'Seeding business...' });
  const now = Date.now();

  // Seed business_tab (id=1, Saymed Company) if not present
  const existingBusiness = await db
    .selectFrom('business_tab')
    .where('id', '=', 1)
    .selectAll()
    .executeTakeFirst();

  if (!existingBusiness) {
    await db.insertInto('business_tab').values({
      business_name: 'Saymed Company',
      created_at: now,
      updated_at: now,
    }).execute();
    baseLogger.info({ msg: 'Business seeded: Saymed Company' });
  } else {
    baseLogger.info({ msg: 'Business already exists, skipping' });
  }

  baseLogger.info({ msg: 'Seeding initial user...' });
  const email = 'admin@saymed.id';

  const existing = await db.selectFrom('users_tab').where('email', '=', email).selectAll().executeTakeFirst();
  if (existing) {
    // Ensure the admin user has business_id = 1
    if (!existing.business_id) {
      await db.updateTable('users_tab')
        .set({ business_id: 1 })
        .where('email', '=', email)
        .execute();
      baseLogger.info({ msg: 'Updated admin user business_id to 1' });
    } else {
      baseLogger.info({ msg: 'User already exists, skipping' });
    }
    await db.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin1234!', 10);

  await db.insertInto('users_tab').values({
    email,
    hashed_password: hashedPassword,
    business_id: 1,
    created_at: now,
    updated_at: now,
  }).execute();

  baseLogger.info({ msg: 'Seed completed successfully' });
  await db.destroy();
}

seed().catch((err) => {
  baseLogger.error({ msg: 'Error seeding data', err: String(err) });
  process.exit(1);
});
