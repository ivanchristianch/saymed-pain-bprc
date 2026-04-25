import { PatientRepository } from '../repositories/patient.repository.js';
import { EncounterRepository } from '../repositories/encounter.repository.js';
import { Patient, Encounter } from '../types/db.js';

export class PatientService {
  constructor(
    private patientRepo: PatientRepository,
    private encounterRepo: EncounterRepository,
  ) {}

  async listPatients(businessId: number): Promise<Patient[]> {
    return this.patientRepo.findAllByBusiness(businessId);
  }

  async getPatient(id: number, businessId: number): Promise<Patient> {
    const patient = await this.patientRepo.findById(id, businessId);
    if (!patient) throw { status: 404, message: 'Patient not found' };
    return patient;
  }

  async createPatient(
    body: {
      name: string;
      date_of_birth: number;
      medical_record_number: string;
      marital_status: string;
      blood_group: string;
      address: string;
    },
    businessId: number,
  ): Promise<Patient | undefined> {
    return this.patientRepo.create({ ...body, business_id: businessId });
  }

  async updatePatient(
    id: number,
    businessId: number,
    body: {
      name?: string;
      date_of_birth?: number;
      medical_record_number?: string;
      marital_status?: string;
      blood_group?: string;
      address?: string;
    },
  ): Promise<Patient> {
    const result = await this.patientRepo.update(id, businessId, body);
    if (!result) throw { status: 404, message: 'Patient not found' };
    return result;
  }

  async deletePatient(id: number, businessId: number): Promise<void> {
    await this.patientRepo.softDelete(id, businessId);
  }

  async listEncounters(patientId: number, businessId: number): Promise<Encounter[]> {
    // Verify patient ownership first
    const patient = await this.patientRepo.findById(patientId, businessId);
    if (!patient) throw { status: 404, message: 'Patient not found' };

    return this.encounterRepo.findAllByPatient(patientId, businessId);
  }

  async createEncounter(
    patientId: number,
    businessId: number,
    encounterName: string,
  ): Promise<Encounter> {
    // Verify patient ownership first
    const patient = await this.patientRepo.findById(patientId, businessId);
    if (!patient) throw { status: 404, message: 'Patient not found' };

    return this.encounterRepo.create({
      patient_id: patientId,
      encounter_name: encounterName,
      business_id: businessId,
    });
  }
}
