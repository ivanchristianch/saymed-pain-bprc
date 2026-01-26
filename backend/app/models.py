import enum
import uuid
from datetime import datetime, date, time
from sqlalchemy import (
    String, DateTime, Enum, ForeignKey, Text, Integer, Boolean, Date, Time, Numeric
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

class Role(str, enum.Enum):
    admin = "admin"
    doctor = "doctor"
    nurse = "nurse"

class EncounterStatus(str, enum.Enum):
    draft = "draft"
    final = "final"

class PaymentType(str, enum.Enum):
    umum = "umum"
    asuransi = "asuransi"

class FileKind(str, enum.Enum):
    audio = "audio"
    pdf = "pdf"
    signature = "signature"

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role))
    signature_file_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("files.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rm_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), index=True)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    age_years: Mapped[int] = mapped_column(Integer)
    sex: Mapped[str | None] = mapped_column(String(8), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    referral_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    encounters = relationship("Encounter", back_populates="patient")

class Encounter(Base):
    __tablename__ = "encounters"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), index=True)
    visit_datetime: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    payment_type: Mapped[PaymentType] = mapped_column(Enum(PaymentType))
    insurance_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status_nurse: Mapped[EncounterStatus] = mapped_column(Enum(EncounterStatus), default=EncounterStatus.draft)
    status_doctor: Mapped[EncounterStatus] = mapped_column(Enum(EncounterStatus), default=EncounterStatus.draft)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="encounters")
    nursing = relationship("NursingAssessment", back_populates="encounter", uselist=False, cascade="all, delete-orphan")
    medical = relationship("MedicalAssessment", back_populates="encounter", uselist=False, cascade="all, delete-orphan")
    exam = relationship("PhysicalExam", back_populates="encounter", uselist=False, cascade="all, delete-orphan")

class NursingAssessment(Base):
    __tablename__ = "nursing_assessments"
    encounter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("encounters.id"), primary_key=True)

    chief_complaint_nurse: Mapped[str] = mapped_column(Text)

    allergy_status: Mapped[str] = mapped_column(String(32))
    allergy_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    education: Mapped[str | None] = mapped_column(String(255), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    marital_status: Mapped[str | None] = mapped_column(String(64), nullable=True)
    religion: Mapped[str | None] = mapped_column(String(64), nullable=True)
    nationality_ethnicity: Mapped[str | None] = mapped_column(String(64), nullable=True)
    travel_abroad_last_2w: Mapped[str | None] = mapped_column(String(8), nullable=True)
    communication_barrier: Mapped[str | None] = mapped_column(String(16), nullable=True)
    cultural_belief_factor: Mapped[str | None] = mapped_column(String(8), nullable=True)
    cultural_belief_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    psychology_status: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    vitals_hr: Mapped[int] = mapped_column(Integer)
    vitals_rr: Mapped[int] = mapped_column(Integer)
    vitals_bp_systolic: Mapped[int] = mapped_column(Integer)
    vitals_bp_diastolic: Mapped[int] = mapped_column(Integer)
    vitals_temp_c: Mapped[float] = mapped_column(Numeric(4,2))
    vitals_spo2: Mapped[int | None] = mapped_column(Integer, nullable=True)

    assistive_device: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prosthesis: Mapped[str | None] = mapped_column(String(255), nullable=True)
    disability: Mapped[str | None] = mapped_column(String(255), nullable=True)
    adl_status: Mapped[str] = mapped_column(String(16))

    unintentional_weight_loss_6mo: Mapped[str] = mapped_column(String(8))
    reduced_appetite: Mapped[str] = mapped_column(String(8))
    weight_kg: Mapped[float | None] = mapped_column(Numeric(5,2), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Numeric(5,2), nullable=True)
    bmi: Mapped[float | None] = mapped_column(Numeric(5,2), nullable=True)
    head_circumference_cm: Mapped[float | None] = mapped_column(Numeric(5,2), nullable=True)
    waist_circumference_cm: Mapped[float | None] = mapped_column(Numeric(5,2), nullable=True)
    nutrition_score_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nutrition_risk_label: Mapped[str | None] = mapped_column(String(32), nullable=True)

    pain_scale_type: Mapped[str] = mapped_column(String(32))
    pain_score: Mapped[int] = mapped_column(Integer)
    pain_location: Mapped[str] = mapped_column(Text)
    pain_duration: Mapped[str | None] = mapped_column(String(128), nullable=True)
    pain_frequency: Mapped[str | None] = mapped_column(String(128), nullable=True)
    pain_pattern: Mapped[str] = mapped_column(String(32))
    pain_relief_factors: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    pain_relief_other: Mapped[str | None] = mapped_column(Text, nullable=True)

    fallrisk_a_imbalance: Mapped[bool] = mapped_column(Boolean, default=False)
    fallrisk_b_support_hold: Mapped[bool] = mapped_column(Boolean, default=False)
    fallrisk_level: Mapped[str | None] = mapped_column(String(32), nullable=True)

    nursing_problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    nursing_plan_action: Mapped[str | None] = mapped_column(Text, nullable=True)

    signed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    signed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    encounter = relationship("Encounter", back_populates="nursing")

class MedicalAssessment(Base):
    __tablename__ = "medical_assessments"
    encounter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("encounters.id"), primary_key=True)

    chief_complaint_doctor: Mapped[str] = mapped_column(Text)
    anamnesis: Mapped[str | None] = mapped_column(Text, nullable=True)

    previous_diagnoses_treatments: Mapped[str | None] = mapped_column(Text, nullable=True)
    post_op: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    post_procedure: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    symptom_duration_bucket: Mapped[str | None] = mapped_column(String(32), nullable=True)

    current_medications: Mapped[str | None] = mapped_column(Text, nullable=True)
    pmh: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    family_history: Mapped[str | None] = mapped_column(Text, nullable=True)

    allergy_history: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    allergy_history_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    symptom_flags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    sleep_quality: Mapped[str | None] = mapped_column(Text, nullable=True)
    urination_issue: Mapped[str | None] = mapped_column(Text, nullable=True)
    defecation_issue: Mapped[str | None] = mapped_column(Text, nullable=True)
    appetite_issue: Mapped[str | None] = mapped_column(Text, nullable=True)
    adl_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    or_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    nutrition_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    walking_aid: Mapped[str | None] = mapped_column(String(255), nullable=True)

    labs: Mapped[str | None] = mapped_column(Text, nullable=True)
    cbc: Mapped[str | None] = mapped_column(Text, nullable=True)
    doppler: Mapped[str | None] = mapped_column(Text, nullable=True)
    mri_ct: Mapped[str | None] = mapped_column(Text, nullable=True)
    pet_scan: Mapped[str | None] = mapped_column(Text, nullable=True)
    ihc: Mapped[str | None] = mapped_column(Text, nullable=True)

    differential_diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    working_diagnosis: Mapped[str] = mapped_column(Text)

    treatment_goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    plan_notes: Mapped[str] = mapped_column(Text)

    procedure_usg_ipm: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    procedure_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    followup_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    followup_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    signed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    signed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    encounter = relationship("Encounter", back_populates="medical")

class PhysicalExam(Base):
    __tablename__ = "physical_exams"
    encounter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("encounters.id"), primary_key=True)
    physical_exam_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    encounter = relationship("Encounter", back_populates="exam")

class File(Base):
    __tablename__ = "files"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind: Mapped[FileKind] = mapped_column(Enum(FileKind))
    storage_key: Mapped[str] = mapped_column(String(512))
    mime_type: Mapped[str] = mapped_column(String(128))
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[str] = mapped_column(String(64))
    action: Mapped[str] = mapped_column(String(64))
    diff: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
