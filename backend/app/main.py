from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from pathlib import Path
import uuid

from .config import settings
from .db import get_db
from . import schemas
from .models import (
    User, Role, Patient, Encounter, PaymentType, EncounterStatus,
    NursingAssessment, MedicalAssessment, PhysicalExam,
    Therapy, DischargeSummary, Correspondence
)
from .security import verify_password, create_access_token
from .deps import get_current_user, require_role
from .pdf import render_placeholder_pdf
from openai import OpenAI
import json

# client initialized lazily in endpoints

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True, "env": settings.app_env}


# =========================
# Audio upload helpers
# =========================
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXT = {".webm", ".ogg", ".wav", ".mp3", ".m4a", ".aac"}

def _safe_ext(filename: str) -> str:
    ext = Path(filename or "").suffix.lower()
    if not ext:
        return ".webm"
    if ext not in ALLOWED_EXT:
        return ".webm"
    return ext

async def _save_audio_file(encounter_id: str, kind: str, audio: UploadFile) -> dict:
    ext = _safe_ext(audio.filename or "")
    fname = f"{kind}_{encounter_id}_{uuid.uuid4().hex}{ext}"
    out_path = UPLOAD_DIR / fname

    try:
        with out_path.open("wb") as f:
            while True:
                chunk = await audio.read(1024 * 1024)  # 1MB
                if not chunk:
                    break
                f.write(chunk)
    finally:
        await audio.close()

    return {
        "ok": True,
        "encounter_id": encounter_id,
        "kind": kind,
        "filename": fname,
        "stored_path": str(out_path),
        "note": "Audio saved. Next: STT + extraction to auto-fill form.",
    }


# --------------------
# Auth
# --------------------
@app.post("/api/auth/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id), user.role.value, user.full_name)
    return schemas.TokenOut(access_token=token, role=user.role.value, full_name=user.full_name)

@app.get("/api/auth/me", response_model=schemas.UserMe)
def me(user: User = Depends(get_current_user)):
    return schemas.UserMe(id=user.id, email=user.email, full_name=user.full_name, role=user.role.value)


# --------------------
# Patients
# --------------------
@app.post("/api/patients", response_model=schemas.PatientOut)
def create_patient(
    p: schemas.PatientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    patient = Patient(**p.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@app.get("/api/patients", response_model=list[schemas.PatientOut])
def list_patients(
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    q = db.query(Patient)
    if search:
        like = f"%{search}%"
        q = q.filter(Patient.full_name.ilike(like))
    return q.order_by(Patient.updated_at.desc()).limit(50).all()

# --------------------
# Audio Serving
# --------------------
from fastapi.responses import FileResponse

@app.get("/api/audio/{filename}")
def get_audio_file(
    filename: str,
    db: Session = Depends(get_db),
    # Optional: require auth to play audio?
    # user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    # Security check: prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(400, "Invalid filename")
    
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(404, "Audio file not found")
    
    return FileResponse(file_path)

@app.get("/api/patients/{patient_id}", response_model=schemas.PatientOut)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient

@app.put("/api/patients/{patient_id}", response_model=schemas.PatientOut)
def update_patient(
    patient_id: str,
    payload: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(patient, k, v)
    
    patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(patient)
    return patient

@app.delete("/api/patients/{patient_id}")
def delete_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor)),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    
    # Optional: Check if patient has encounters and prevent delete?
    # For now, we allow delete, assuming cascade delete or manual cleanup is okay.
    db.delete(patient)
    db.commit()
    return {"ok": True}


# --------------------
# Encounters
# --------------------
@app.post("/api/encounters", response_model=schemas.EncounterOut)
def create_encounter(
    payload: schemas.EncounterCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    if payload.payment_type == "asuransi" and not payload.insurance_name:
        raise HTTPException(400, "insurance_name required for ASURANSI")

    enc = Encounter(
        patient_id=payload.patient_id,
        visit_datetime=payload.visit_datetime or datetime.utcnow(),
        payment_type=PaymentType(payload.payment_type),
        insurance_name=payload.insurance_name,
        created_by=user.id,
        updated_by=user.id,
    )
    db.add(enc)
    db.commit()
    db.refresh(enc)
    return enc

@app.get("/api/encounters", response_model=list[schemas.EncounterOut])
def list_encounters(
    patient_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    try:
        pid = uuid.UUID(patient_id)
    except ValueError:
        raise HTTPException(400, "Invalid patient_id UUID")
    return (
        db.query(Encounter)
        .filter(Encounter.patient_id == pid)
        .order_by(Encounter.visit_datetime.desc())
        .limit(50)
        .all()
    )

@app.get("/api/encounters/{encounter_id}", response_model=schemas.EncounterOut)
def get_encounter(
    encounter_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    enc = db.get(Encounter, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    return enc


# --------------------
# Nursing / Medical / Exam upserts
# --------------------
@app.put("/api/encounters/{encounter_id}/nursing")
def upsert_nursing(
    encounter_id: str,
    payload: schemas.NursingUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.nurse, Role.doctor)),
):
    enc = db.get(Encounter, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    if enc.status_nurse == EncounterStatus.final and user.role != Role.admin:
        raise HTTPException(409, "Nursing section is finalized")

    obj = db.get(NursingAssessment, encounter_id)
    data = payload.model_dump()

    # auto-calc fallrisk_level if not provided
    a = data.get("fallrisk_a_imbalance", False)
    b = data.get("fallrisk_b_support_hold", False)
    if a and b:
        data["fallrisk_level"] = "TINGGI"
    elif a or b:
        data["fallrisk_level"] = "RENDAH"
    else:
        data["fallrisk_level"] = "TIDAK_BERISIKO"

    # auto-calc BMI if weight+height
    wkg = data.get("weight_kg")
    hcm = data.get("height_cm")
    if wkg and hcm and hcm > 0:
        hm = float(hcm) / 100.0
        data["bmi"] = round(float(wkg) / (hm * hm), 2)

    if not obj:
        obj = NursingAssessment(encounter_id=encounter_id, **data)
        db.add(obj)
    else:
        for k, v in data.items():
            setattr(obj, k, v)

    enc.updated_by = user.id
    db.commit()
    return {"ok": True}

@app.put("/api/encounters/{encounter_id}/medical")
def upsert_medical(
    encounter_id: str,
    payload: schemas.MedicalUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor)),
):
    enc = db.get(Encounter, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    if enc.status_doctor == EncounterStatus.final and user.role != Role.admin:
        raise HTTPException(409, "Medical section is finalized")

    obj = db.get(MedicalAssessment, encounter_id)
    data = payload.model_dump()
    if not obj:
        obj = MedicalAssessment(encounter_id=encounter_id, **data)
        db.add(obj)
    else:
        for k, v in data.items():
            setattr(obj, k, v)

    enc.updated_by = user.id
    db.commit()
    return {"ok": True}

@app.put("/api/encounters/{encounter_id}/exam")
def upsert_exam(
    encounter_id: str,
    payload: schemas.ExamUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor)),
):
    try:
        enc_uuid = uuid.UUID(encounter_id)
    except ValueError:
        raise HTTPException(400, "Invalid UUID")

    enc = db.get(Encounter, enc_uuid)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    if enc.status_doctor == EncounterStatus.final and user.role != Role.admin:
        raise HTTPException(409, "Encounter is finalized")

    obj = db.get(PhysicalExam, enc_uuid)
    if not obj:
        obj = PhysicalExam(encounter_id=enc_uuid, physical_exam_json=payload.physical_exam_json)
        db.add(obj)
    else:
        obj.physical_exam_json = payload.physical_exam_json

    enc.updated_by = user.id
    db.commit()
    return {"ok": True}

@app.put("/api/encounters/{encounter_id}/therapy")
def upsert_therapy(
    encounter_id: str,
    payload: schemas.TherapyUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor)),
):
    try:
        enc_uuid = uuid.UUID(encounter_id)
    except ValueError:
        raise HTTPException(400, "Invalid UUID")

    enc = db.get(Encounter, enc_uuid)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    if enc.status_doctor == EncounterStatus.final and user.role != Role.admin:
        raise HTTPException(409, "Encounter is finalized")

    obj = db.get(Therapy, enc_uuid)
    data = payload.model_dump(exclude_unset=True)
    if not obj:
        obj = Therapy(encounter_id=enc_uuid, **data)
        db.add(obj)
    else:
        for k, v in data.items():
            setattr(obj, k, v)

    enc.updated_by = user.id
    db.commit()
    return {"ok": True}

@app.put("/api/encounters/{encounter_id}/discharge")
def upsert_discharge_summary(
    encounter_id: str,
    payload: schemas.DischargeSummaryUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor)),
):
    try:
        enc_uuid = uuid.UUID(encounter_id)
    except ValueError:
        raise HTTPException(400, "Invalid UUID")

    enc = db.get(Encounter, enc_uuid)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    if enc.status_doctor == EncounterStatus.final and user.role != Role.admin:
        raise HTTPException(409, "Encounter is finalized")

    obj = db.get(DischargeSummary, enc_uuid)
    data = payload.model_dump(exclude_unset=True)
    if not obj:
        obj = DischargeSummary(encounter_id=enc_uuid, **data)
        db.add(obj)
    else:
        for k, v in data.items():
            setattr(obj, k, v)

    enc.updated_by = user.id
    db.commit()
    return {"ok": True}

@app.post("/api/encounters/{encounter_id}/correspondence", response_model=schemas.CorrespondenceOut)
def create_correspondence(
    encounter_id: str,
    payload: schemas.CorrespondenceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor)),
):
    try:
        enc_uuid = uuid.UUID(encounter_id)
    except ValueError:
        raise HTTPException(400, "Invalid UUID")

    enc = db.get(Encounter, enc_uuid)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    
    obj = Correspondence(encounter_id=enc_uuid, **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.put("/api/encounters/{encounter_id}/correspondence/{corr_id}", response_model=schemas.CorrespondenceOut)
def update_correspondence(
    encounter_id: str,
    corr_id: str,
    payload: schemas.CorrespondenceUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor)),
):
    obj = db.get(Correspondence, corr_id)
    if not obj or str(obj.encounter_id) != encounter_id:
        raise HTTPException(404, "Correspondence not found")
    
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
        
    db.commit()
    db.refresh(obj)
    return obj

@app.delete("/api/encounters/{encounter_id}/correspondence/{corr_id}")
def delete_correspondence(
    encounter_id: str,
    corr_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor)),
):
    obj = db.get(Correspondence, corr_id)
    if not obj or str(obj.encounter_id) != encounter_id:
        raise HTTPException(404, "Correspondence not found")
    
    db.delete(obj)
    db.commit()
    return {"ok": True}


# --------------------
# Finalize workflow
# --------------------
@app.post("/api/encounters/{encounter_id}/finalize/nurse")
def finalize_nurse(
    encounter_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.nurse)),
):
    enc = db.get(Encounter, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    enc.status_nurse = EncounterStatus.final
    db.commit()
    return {"ok": True}

@app.post("/api/encounters/{encounter_id}/finalize/doctor")
def finalize_doctor(
    encounter_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor)),
):
    enc = db.get(Encounter, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    enc.status_doctor = EncounterStatus.final
    if enc.status_nurse == EncounterStatus.final:
        enc.finalized_at = datetime.utcnow()
    db.commit()
    return {"ok": True}

@app.post("/api/encounters/{encounter_id}/unlock")
def unlock_encounter(
    encounter_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin)),
):
    enc = db.get(Encounter, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    enc.status_nurse = EncounterStatus.draft
    enc.status_doctor = EncounterStatus.draft
    enc.finalized_at = None
    db.commit()
    return {"ok": True}


# --------------------
# PDF export
# --------------------
@app.post("/api/encounters/{encounter_id}/pdf")
def generate_pdf(
    encounter_id: str,
    lang: str = Query("id", pattern="^(id|en)$"),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    from .pdf import render_medical_record_pdf
    
    try:
        enc_uuid = uuid.UUID(encounter_id)
    except ValueError:
        raise HTTPException(400, "Invalid UUID")

    enc = db.get(Encounter, enc_uuid)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    
    # Fetch patient data
    patient = db.get(Patient, enc.patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    
    # Fetch assessments via relationship for consistency
    nursing = enc.nursing
    medical = enc.medical
    # Physical exam is inside medical dict usually, or separate model? 
    # In models.py: exam = relationship("PhysicalExam", ...)
    # In generate_pdf: we looked for db.get(PhysicalExam).
    # Using relationship is safer.
    exam = enc.exam
    
    # Prepare data dictionaries
    encounter_dict = {
        "id": str(enc.id),
        "visit_datetime": enc.visit_datetime.strftime("%Y-%m-%d %H:%M") if enc.visit_datetime else "-",
        "payment_type": enc.payment_type.value if enc.payment_type else "-",
        "insurance_name": enc.insurance_name or "-",
    }
    
    patient_dict = {
        "full_name": patient.full_name,
        "age_years": patient.age_years,
        "rm_number": patient.rm_number or "-",
        "sex": patient.sex or "-",
        "dob": str(patient.dob) if patient.dob else "-",
        "address": patient.address or "-",
    }
    
    # --- FALLBACK DEFAULTS ---
    default_nursing = {
        "chief_complaint_nurse": "-",
        "allergy_status": "-",
        "vitals_bp_systolic": "-",
        "vitals_bp_diastolic": "-",
        "vitals_hr": "-",
        "vitals_rr": "-",
        "vitals_temp_c": "-",
        "vitals_spo2": "-",
        "pain_score": "-",
        "pain_location": "-",
        "pain_duration": "-",
        "pain_scale_type": "-",
        "fallrisk_level": "-",
        "nutrition_risk_label": "-",
        "weight_kg": None,
        "height_cm": None,
        "bmi": None,
    }

    default_medical = {
        "chief_complaint_doctor": "-",
        "anamnesis": "-",
        "working_diagnosis": "-",
        "differential_diagnosis": "-",
        "plan_notes": "-",
        "current_medications": "-",
        "previous_diagnoses_treatments": "-",
        "rpd": "-",
        "rpk": "-",
        "allergy_history": "-",
        "physical_exam_json": None,
        "lab_results": "-",
        "radiology": "-",
        "followup_date": None,
        "followup_time": None,
    }

    nursing_dict = default_nursing.copy()
    if nursing:
        nursing_dict.update({
            "chief_complaint_nurse": nursing.chief_complaint_nurse or "-",
            "allergy_status": nursing.allergy_status or "-",
            "vitals_bp_systolic": nursing.vitals_bp_systolic,
            "vitals_bp_diastolic": nursing.vitals_bp_diastolic,
            "vitals_hr": nursing.vitals_hr,
            "vitals_rr": nursing.vitals_rr,
            "vitals_temp_c": nursing.vitals_temp_c,
            "vitals_spo2": nursing.vitals_spo2 or "-",
            "pain_score": nursing.pain_score,
            "pain_location": nursing.pain_location or "-",
            "pain_duration": nursing.pain_duration or "-",
            "pain_scale_type": nursing.pain_scale_type or "-",
            "fallrisk_level": nursing.fallrisk_level or "-",
            "nutrition_risk_label": nursing.nutrition_risk_label or "-",
            "weight_kg": float(nursing.weight_kg) if nursing.weight_kg is not None else None,
            "height_cm": float(nursing.height_cm) if nursing.height_cm is not None else None,
            "bmi": float(nursing.bmi) if nursing.bmi is not None else None,
        })
    
    medical_dict = default_medical.copy()
    if medical:
        # Helper for lists
        def fmt_list(val):
            if isinstance(val, list): return ", ".join(val)
            return str(val) if val else "-"

        medical_dict.update({
            "chief_complaint_doctor": medical.chief_complaint_doctor or "-",
            "anamnesis": medical.anamnesis or "-",
            "working_diagnosis": medical.working_diagnosis or "-",
            "differential_diagnosis": medical.differential_diagnosis or "-",
            "plan_notes": medical.plan_notes or "-",
            "current_medications": medical.current_medications or "-",
            "previous_diagnoses_treatments": medical.previous_diagnoses_treatments or "-",
            "rpd": fmt_list(medical.pmh),
            "rpk": medical.family_history or "-",
            "allergy_history": fmt_list(medical.allergy_history),
            "physical_exam_json": exam.physical_exam_json if exam else None,
            "lab_results": medical.labs or "-",
            "radiology": medical.mri_ct or "-",
            "followup_date": str(medical.followup_date) if medical.followup_date else None,
            "followup_time": str(medical.followup_time) if medical.followup_time else None,
        })
    
    pdf_bytes = render_medical_record_pdf(encounter_dict, patient_dict, nursing_dict, medical_dict)
    
    return {
        "mime_type": "application/pdf",
        "filename": f"BPRC_MedicalRecord_{encounter_id}_{lang}.pdf",
        "bytes_b64": pdf_bytes.hex(),
    }


# --------------------
# Voice endpoints (FIXED - removed duplicates, added auth)
# --------------------

# ✅ UNIFIED ENDPOINT - supports both nurse and doctor roles
@app.post("/api/encounters/{encounter_id}/voice/upload")
async def voice_upload(
    encounter_id: str,
    role: str = Query(..., pattern="^(doctor|nurse)$"),
    section: str = Query("interview"),
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    """
    ✅ FIXED: Now accepts 'audio' field and has proper authentication
    """
    enc = db.get(Encounter, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter not found")

    # 1️⃣ Save audio file
    result = await _save_audio_file(encounter_id, role, audio)
    saved_path = Path(result["stored_path"])
    filename = result["filename"]

    # UPDATE DB with filename
    if role == "doctor":
        enc.audio_doctor = filename
    elif role == "nurse":
        enc.audio_nurse = filename
    db.commit()

    # 2️⃣ TRANSCRIPTION (OpenAI Whisper)
    try:
        if not settings.openai_api_key:
             # Just warn, don't crash, so audio is still saved
             print("OPENAI_API_KEY not set in .env")
             transcript_text = "(API Key missing)"
        else:
            client = OpenAI(api_key=settings.openai_api_key)
            with open(saved_path, "rb") as audio_file:
                transcript_resp = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="id" 
                )
            transcript_text = transcript_resp.text
    except Exception as e:
        print(f"Transcription failed: {e}")
        transcript_text = f"(Transcription failed: {str(e)})"

    # 3️⃣ EXTRACTION (OpenAI GPT-4o)
    structured = {}
    try:
        if role == "nurse":
            system_prompt = """
            You are an expert medical scribe for a Pain Clinic (Bandung Pain Rehab Center).
            Extract information from the NURSE interview transcript into the following JSON structure:
            {
               "keluhan_utama": "string",
               "skrining_nutrisi": {
                  "berat_badan_kg": "string",
                  "tinggi_badan_cm": "string"
               },
               "tanda_vital": {
                  "tekanan_darah": "string",
                  "frekuensi_nadi": "string",
                  "suhu": "string"
               },
               "pengkajian_nyeri": {
                  "skala": "string (0-10)",
                  "lokasi": "string",
                  "durasi": "string"
               }
            }
            OUTPUT JSON ONLY.
            """
        else: # doctor
             system_prompt = """
            You are an expert medical scribe for a Pain Clinic.
            Extract information from the DOCTOR interview transcript into the following JSON structure.
            
            IMPORTANT RULES:
            1. RPD (Riwayat Penyakit Dahulu): Check CAREFULLY. If the doctor or patient mentions a history of a disease, set it to TRUE.
            2. Alat Bantu Jalan: If explicitly said "tidak ada" OR if the patient walks normally/no mention of aids, set to "Tidak ada".
            3. Neurologis: If the doctor says "Neurologis normal" or "Neuro dbn", you MUST fill the "neurologis" section. 
               - For C1-S4, use "dbn" or "5" (for motor) / "dbn" (for sensory).
               - For Reflexes, use "dbn" or "++".
               - Do NOT leave them empty if the general status is normal.

            JSON Structure:
            {
               "keluhan_utama": "string (chief complaint)",
               "riwayat_pengobatan_diagnosis_sebelumnya": "string (previous treatments/diagnoses)",
               "status_post_op": boolean (true if mentions post-operation/pasca operasi),
               "status_post_tindakan": boolean (true if mentions post-procedure/pasca tindakan),
               "onset_range": "string (1M, 1M-1B, 1B-3B, 3B-1T, 1T-5T, 5T-10T)",
               "obat_sedang_diminum": "string (current medications)",
               "rpd": {
                  "Hipertensi": boolean,
                  "DM": boolean,
                  "Gastritis": boolean,
                  "AsamUrat": boolean,
                  "Jantung": boolean,
                  "Ginjal": boolean,
                  "Liver": boolean,
                  "Kanker": boolean,
                  "Kolesterol": boolean,
                  "Stroke": boolean,
                  "Autoimun": boolean,
                  "Trauma": boolean
               },
               "rpk": "string (family history)",
               "riwayat_alergi": {
                  "Obat": boolean,
                  "Debu": boolean,
                  "Makanan": boolean,
                  "ZatKimia": boolean,
                  "Cuaca": boolean,
                  "SinarMatahari": boolean
               },
               "riwayat_alergi_lainnya": "string",
               "anamnesis": "string",
               "anamnesis_checkbox": {
                  "baal": boolean,
                  "kesemutan": boolean,
                  "sakit_kepala": boolean
               },
               "kualitas_tidur": "string",
               "gangguan_bak_bab": "string",
               "gangguan_makan": "string",
               "adl": "string",
               "or": "string",
               "status_gizi": "string (GiziKurangBuruk, GiziCukup, GiziLebih)",
               "alat_bantu_jalan": "string",
               "pemeriksaan_fisik": {
                  "cranial_nerve": "string",
                  "romberg_tandem": "string",
                  "pain_detect": {
                     "sensory_descriptors": "string",
                     "spatial_temporal": "string",
                     "score": "string",
                     "interpretasi": "string"
                  },
                  "phq9_score": "string"
               },
               "muskuloskeletal": {
                  "head_neck": "string",
                  "shoulder": "string",
                  "elbow": "string",
                  "wrist": "string",
                  "back": "string",
                  "genu": "string",
                  "pedis": "string"
               },
               "neurologis": {
                  "rows": {
                     "C1": { "motorik": "string", "sensorik": "string" },
                     "C2": { "motorik": "string", "sensorik": "string" },
                     "C3": { "motorik": "string", "sensorik": "string" },
                     "C4": { "motorik": "string", "sensorik": "string" },
                     "C5": { "motorik": "string", "sensorik": "string" },
                     "C6": { "motorik": "string", "sensorik": "string" },
                     "C7": { "motorik": "string", "sensorik": "string" },
                     "C8": { "motorik": "string", "sensorik": "string" },
                     "T1": { "motorik": "string", "sensorik": "string" },
                     "T2": { "motorik": "string", "sensorik": "string" },
                     "T3": { "motorik": "string", "sensorik": "string" },
                     "T4": { "motorik": "string", "sensorik": "string" },
                     "T5": { "motorik": "string", "sensorik": "string" },
                     "T6": { "motorik": "string", "sensorik": "string" },
                     "T7": { "motorik": "string", "sensorik": "string" },
                     "T8": { "motorik": "string", "sensorik": "string" },
                     "T9": { "motorik": "string", "sensorik": "string" },
                     "T10": { "motorik": "string", "sensorik": "string" },
                     "T11": { "motorik": "string", "sensorik": "string" },
                     "T12": { "motorik": "string", "sensorik": "string" },
                     "L1": { "motorik": "string", "sensorik": "string" },
                     "L2": { "motorik": "string", "sensorik": "string" },
                     "L3": { "motorik": "string", "sensorik": "string" },
                     "L4": { "motorik": "string", "sensorik": "string" },
                     "L5": { "motorik": "string", "sensorik": "string" },
                     "S1": { "motorik": "string", "sensorik": "string" },
                     "S2": { "motorik": "string", "sensorik": "string" },
                     "S3": { "motorik": "string", "sensorik": "string" },
                     "S4": { "motorik": "string", "sensorik": "string" },
                     "RefleksFisiologis": { "motorik": "string", "sensorik": "string" },
                     "RefleksPatologis": { "motorik": "string", "sensorik": "string" }
                  }
               },
               "lain_lain": {
                  "darah_rutin": "string",
                  "usg_doppler": "string",
                  "mri_ct": "string",
                  "pet_scan": "string",
                  "imunohistokimia": "string"
               },
               "lain_lain": {
                  "darah_rutin": "string (CBC results)",
                  "usg_doppler": "string (ultrasound/doppler findings)",
                  "mri_ct": "string (MRI/CT findings)",
                  "pet_scan": "string",
                  "imunohistokimia": "string (immunohistochemistry)"
               },
               "diagnosis_banding": "string (differential diagnosis)",
               "diagnosis_kerja": "string (working diagnosis)",
               "penatalaksanaan": {
                  "goal": "string (treatment goals)",
                  "pro_usg_ipm": "string (USG/IPM procedure plan)"
               },
               "jadwal_kontrol": {
                  "tanggal": "string (YYYY-MM-DD format if mentioned)",
                  "jam": "string (HH:MM format if mentioned)"
               }
            }
            
            OUTPUT JSON ONLY. Be thorough in extracting all mentioned information.
            """
        
        if not settings.openai_api_key:
             # Should be caught by previous block, but safety first
             client = OpenAI(api_key="needs_key_or_will_fail") 
        else:
             client = OpenAI(api_key=settings.openai_api_key)

        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Transcript:\n{transcript_text}"}
            ],
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content
        print(f"🔹 GPT RAW CONTENT: {content}") # Debug log

        if content:
            # Clean markdown code blocks if present
            cleaned = content.replace("```json", "").replace("```", "").strip()
            try:
                structured = json.loads(cleaned)
            except json.JSONDecodeError:
                print("❌ JSON Decode Error. Raw content was not valid JSON.")
                structured = {}

    except Exception as e:
        print(f"Extraction failed: {e}")
        structured = {"error": str(e)}

    return {
        "ok": True,
        "role": role,
        "transcript": transcript_text,
        "structured": structured,
        "raw_gpt_debug": content if 'content' in locals() else "No content", 
        **result,
    }


# ✅ SEPARATE NURSING ENDPOINT (optional - if you want dedicated routes)
@app.post("/api/encounters/{encounter_id}/nursing/audio")
async def upload_nursing_audio(
    encounter_id: str,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    """
    ✅ FIXED: Added authentication
    """
    enc = db.get(Encounter, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    return await _save_audio_file(encounter_id, "nursing", audio)


# ✅ SEPARATE DOCTOR ENDPOINT (optional)
@app.post("/api/encounters/{encounter_id}/doctor/audio")
async def upload_doctor_audio(
    encounter_id: str,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.admin, Role.doctor, Role.nurse)),
):
    """
    ✅ FIXED: Added authentication
    """
    enc = db.get(Encounter, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter not found")
    return await _save_audio_file(encounter_id, "doctor", audio)