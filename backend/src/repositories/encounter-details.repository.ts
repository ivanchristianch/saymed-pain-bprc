import { db } from '../db.js';
import { EncounterDetails, EncounterDetailsUpdate } from '../types/db.js';

type CreateEncounterDetailsData = Omit<EncounterDetails, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;

export class EncounterDetailsRepository {
  async findById(id: number): Promise<EncounterDetails | undefined> {
    return db
      .selectFrom('encounter_details_tab')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByEncounter(encounterId: number): Promise<EncounterDetails | undefined> {
    return db
      .selectFrom('encounter_details_tab')
      .where('encounter_id', '=', encounterId)
      .selectAll()
      .executeTakeFirst();
  }

  async findByEncounterNotDeleted(encounterId: number): Promise<EncounterDetails | undefined> {
    return db
      .selectFrom('encounter_details_tab')
      .where('encounter_id', '=', encounterId)
      .where('deleted_at', 'is', null)
      .selectAll()
      .executeTakeFirst();
  }

  async create(data: CreateEncounterDetailsData): Promise<EncounterDetails> {
    const now = Date.now();
    return db
      .insertInto('encounter_details_tab')
      .values({ ...data, created_at: now, updated_at: now })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: number, data: EncounterDetailsUpdate): Promise<EncounterDetails | undefined> {
    return db
      .updateTable('encounter_details_tab')
      .set({ ...data, updated_at: Date.now() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
}
