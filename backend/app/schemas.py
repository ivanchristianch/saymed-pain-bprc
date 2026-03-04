import uuid
from datetime import datetime, date, time
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any, Literal

Role = Literal["admin","doctor","nurse"]
PaymentType = Literal["umum","asuransi"]
EncounterStatus = Literal["draft","final"]

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    full_name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserMe(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: Role

class PatientCreate(BaseModel):
    rm_number: Optional[str] = None
    full_name: str
    dob: Optional[date] = None
    age_years: int = Field(ge=0, le=130)
    sex: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    referral_source: Optional[str] = None
    blood_group: Optional[str] = None
    marital_status: Optional[str] = None

class PatientUpdate(BaseModel):
    rm_number: Optional[str] = None
    full_name: Optional[str] = None
    dob: Optional[date] = None
    age_years: Optional[int] = Field(None, ge=0, le=130)
    sex: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    referral_source: Optional[str] = None
    blood_group: Optional[str] = None
    marital_status: Optional[str] = None

class PatientOut(PatientCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

class EncounterCreate(BaseModel):
    patient_id: uuid.UUID
    visit_datetime: Optional[datetime] = None
    payment_type: PaymentType
    insurance_name: Optional[str] = None

class EncounterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    patient_id: uuid.UUID
    visit_datetime: datetime
    payment_type: PaymentType
    insurance_name: Optional[str]
    status_nurse: EncounterStatus
    status_doctor: EncounterStatus
    finalized_at: Optional[datetime]
    
    audio_nurse: Optional[str] = None
    audio_doctor: Optional[str] = None

    therapy: Optional["TherapyOut"] = None
    discharge_summary: Optional["DischargeSummaryOut"] = None
    correspondences: List["CorrespondenceOut"] = []

    created_at: datetime
    updated_at: datetime

class NursingUpsert(BaseModel):
    chief_complaint_nurse: str

    allergy_status: str
    allergy_details: Optional[str] = None

    education: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None
    religion: Optional[str] = None
    nationality_ethnicity: Optional[str] = None
    travel_abroad_last_2w: Optional[str] = None
    communication_barrier: Optional[str] = None
    cultural_belief_factor: Optional[str] = None
    cultural_belief_details: Optional[str] = None

    psychology_status: Optional[List[str]] = None

    vitals_hr: int
    vitals_rr: int
    vitals_bp_systolic: int
    vitals_bp_diastolic: int
    vitals_temp_c: float
    vitals_spo2: Optional[int] = None

    assistive_device: Optional[str] = None
    prosthesis: Optional[str] = None
    disability: Optional[str] = None
    adl_status: str

    unintentional_weight_loss_6mo: str
    reduced_appetite: str
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    head_circumference_cm: Optional[float] = None
    waist_circumference_cm: Optional[float] = None
    nutrition_score_total: Optional[int] = None
    nutrition_risk_label: Optional[str] = None

    pain_scale_type: str
    pain_score: int
    pain_location: str
    pain_duration: Optional[str] = None
    pain_frequency: Optional[str] = None
    pain_pattern: str
    pain_relief_factors: Optional[List[str]] = None
    pain_relief_other: Optional[str] = None

    fallrisk_a_imbalance: bool = False
    fallrisk_b_support_hold: bool = False
    fallrisk_level: Optional[str] = None

    nursing_problem: Optional[str] = None
    nursing_plan_action: Optional[str] = None

class MedicalUpsert(BaseModel):
    chief_complaint_doctor: str
    anamnesis: Optional[str] = None
    previous_diagnoses_treatments: Optional[str] = None
    post_op: Optional[bool] = None
    post_procedure: Optional[bool] = None
    symptom_duration_bucket: Optional[str] = None

    current_medications: Optional[str] = None
    pmh: Optional[List[str]] = None
    family_history: Optional[str] = None

    allergy_history: Optional[List[str]] = None
    allergy_history_details: Optional[str] = None

    symptom_flags: Optional[List[str]] = None
    sleep_quality: Optional[str] = None
    urination_issue: Optional[str] = None
    defecation_issue: Optional[str] = None
    appetite_issue: Optional[str] = None
    adl_description: Optional[str] = None
    or_notes: Optional[str] = None

    nutrition_status: Optional[str] = None
    walking_aid: Optional[str] = None

    labs: Optional[str] = None
    cbc: Optional[str] = None
    doppler: Optional[str] = None
    mri_ct: Optional[str] = None
    pet_scan: Optional[str] = None
    ihc: Optional[str] = None

    differential_diagnosis: Optional[str] = None
    working_diagnosis: str

    treatment_goal: Optional[str] = None
    plan_notes: str

    procedure_usg_ipm: Optional[bool] = None
    procedure_notes: Optional[str] = None

    followup_date: Optional[date] = None
    followup_time: Optional[time] = None

class ExamUpsert(BaseModel):
    physical_exam_json: Dict[str, Any] | None = None

class TherapyUpsert(BaseModel):
    treatment_plan: Optional[str] = None
    medications_json: Optional[List[Dict[str, Any]]] = None
    non_pharm_physio: Optional[str] = None
    non_pharm_lifestyle: Optional[str] = None
    non_pharm_education: Optional[str] = None
    procedures_performed: Optional[str] = None
    monitoring_notes: Optional[str] = None

class TherapyOut(TherapyUpsert):
    model_config = ConfigDict(from_attributes=True)
    encounter_id: uuid.UUID
    updated_at: datetime

class DischargeSummaryUpsert(BaseModel):
    admission_date: Optional[date] = None
    discharge_date: Optional[date] = None
    primary_diagnosis: Optional[str] = None
    secondary_diagnoses: Optional[str] = None
    clinical_course_summary: Optional[str] = None
    procedures_performed: Optional[str] = None
    medications_on_discharge: Optional[str] = None
    followup_plan: Optional[str] = None
    patient_education: Optional[str] = None

class DischargeSummaryOut(DischargeSummaryUpsert):
    model_config = ConfigDict(from_attributes=True)
    encounter_id: uuid.UUID
    updated_at: datetime

class CorrespondenceCreate(BaseModel):
    document_type: str
    recipient: Optional[str] = None
    subject: Optional[str] = None
    body_text: Optional[str] = None
    attachment_file_id: Optional[uuid.UUID] = None

class CorrespondenceUpdate(BaseModel):
    document_type: Optional[str] = None
    recipient: Optional[str] = None
    subject: Optional[str] = None
    body_text: Optional[str] = None
    attachment_file_id: Optional[uuid.UUID] = None

class CorrespondenceOut(CorrespondenceCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    encounter_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
