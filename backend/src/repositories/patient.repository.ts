import { db } from '../db.js';
import { Patient, PatientUpdate } from '../types/db.js';

type CreatePatientData = Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;

export class PatientRepository {
  async findAllByBusiness(businessId: number): Promise<Patient[]> {
    return db
      .selectFrom('patients_tab')
      .where('deleted_at', 'is', null)
      .where('business_id', '=', businessId)
      .selectAll()
      .orderBy('updated_at', 'desc')
      .execute();
  }

  async findById(id: number, businessId: number): Promise<Patient | undefined> {
    return db
      .selectFrom('patients_tab')
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .where('business_id', '=', businessId)
      .selectAll()
      .executeTakeFirst();
  }

  async create(data: CreatePatientData): Promise<Patient | undefined> {
    const now = Date.now();
    return db
      .insertInto('patients_tab')
      .values({ ...data, created_at: now, updated_at: now })
      .returningAll()
      .executeTakeFirst();
  }

  async update(id: number, businessId: number, data: PatientUpdate): Promise<Patient | undefined> {
    return db
      .updateTable('patients_tab')
      .set({ ...data, updated_at: Date.now() })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .where('business_id', '=', businessId)
      .returningAll()
      .executeTakeFirst();
  }

  async softDelete(id: number, businessId: number): Promise<void> {
    await db
      .updateTable('patients_tab')
      .set({ deleted_at: Date.now() })
      .where('id', '=', id)
      .where('business_id', '=', businessId)
      .execute();
  }
}
