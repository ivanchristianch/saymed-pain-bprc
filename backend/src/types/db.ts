import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface BusinessTable {
  id: Generated<number>;
  business_name: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface UsersTable {
  id: Generated<number>;
  email: string;
  hashed_password: string;
  business_id: number | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface PatientsTable {
  id: Generated<number>;
  name: string;
  date_of_birth: number;
  medical_record_number: string;
  marital_status: string; // single | married | divorced | widowed
  blood_group: string; // A | B | AB | O
  address: string;
  business_id: number | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface EncountersTable {
  id: Generated<number>;
  patient_id: number;
  encounter_name: string | null;
  business_id: number | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface EncounterDetailsTable {
  id: Generated<number>;
  encounter_id: number;
  audio_file: string | null;
  // transcript_path removed in migration 003 — now lives in transcript_tab
  details: string; // JSONB stored as string
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface TranscriptTable {
  transcript_id: Generated<number>;
  encounter_details_id: number;
  audio_file: string; // snapshot of audio_file at submission time
  transcript_path: string | null;
  state: number; // 0=pending, 1=success, 2=error
  error_msg: string | null;
  started_at: number | null;
  ended_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface AnalysisTable {
  analysis_id: Generated<number>;
  encounter_details_id: number;
  transcript_id: number;
  result: string | null; // JSONB stored as string
  state: number; // 0=pending, 1=success, 2=error
  error_msg: string | null;
  started_at: number | null;
  ended_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface Database {
  business_tab: BusinessTable;
  users_tab: UsersTable;
  patients_tab: PatientsTable;
  encounters_tab: EncountersTable;
  encounter_details_tab: EncounterDetailsTable;
  transcript_tab: TranscriptTable;
  analysis_tab: AnalysisTable;
}

export type Business = Selectable<BusinessTable>;
export type NewBusiness = Insertable<BusinessTable>;
export type BusinessUpdate = Updateable<BusinessTable>;

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type Patient = Selectable<PatientsTable>;
export type NewPatient = Insertable<PatientsTable>;
export type PatientUpdate = Updateable<PatientsTable>;

export type Encounter = Selectable<EncountersTable>;
export type NewEncounter = Insertable<EncountersTable>;
export type EncounterUpdate = Updateable<EncountersTable>;

export type EncounterDetails = Selectable<EncounterDetailsTable>;
export type NewEncounterDetails = Insertable<EncounterDetailsTable>;
export type EncounterDetailsUpdate = Updateable<EncounterDetailsTable>;

export type Transcript = Selectable<TranscriptTable>;
export type NewTranscript = Insertable<TranscriptTable>;
export type TranscriptUpdate = Updateable<TranscriptTable>;

export type Analysis = Selectable<AnalysisTable>;
export type NewAnalysis = Insertable<AnalysisTable>;
export type AnalysisUpdate = Updateable<AnalysisTable>;
