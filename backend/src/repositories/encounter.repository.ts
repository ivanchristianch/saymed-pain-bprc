import { db } from '../db.js';
import { Encounter, EncounterUpdate } from '../types/db.js';

type CreateEncounterData = Omit<Encounter, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;

export class EncounterRepository {
  /**
   * Find an encounter by id, verifying it belongs to the given business and is not deleted.
   * Used as the shared ownership check (replaces the duplicated getOwnedEncounter helpers).
   */
  async findByIdAndBusiness(id: number, businessId: number): Promise<Encounter | null> {
    const encounter = await db
      .selectFrom('encounters_tab')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();

    if (!encounter || encounter.deleted_at !== null) return null;
    if (encounter.business_id !== businessId) return null;
    return encounter;
  }

  async findAllByPatient(patientId: number, businessId: number): Promise<Encounter[]> {
    return db
      .selectFrom('encounters_tab')
      .where('patient_id', '=', patientId)
      .where('deleted_at', 'is', null)
      .where('business_id', '=', businessId)
      .selectAll()
      .orderBy('updated_at', 'desc')
      .execute();
  }

  async create(data: CreateEncounterData): Promise<Encounter> {
    const now = Date.now();
    return db
      .insertInto('encounters_tab')
      .values({ ...data, created_at: now, updated_at: now })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: number, data: EncounterUpdate): Promise<Encounter | undefined> {
    return db
      .updateTable('encounters_tab')
      .set({ ...data, updated_at: Date.now() })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }
}
