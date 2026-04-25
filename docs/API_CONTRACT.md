# API Contract (v1)

Base URL: `http://localhost:8000/api`

All endpoints except `/auth/login` and `/health` require:
```
Authorization: Bearer <access_token>
```

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{ "status": "ok" }` |

---

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Authenticate and receive a JWT |

### POST `/auth/login`
Request:
```json
{ "email": "admin@saymed.id", "password": "Admin1234!" }
```
Response:
```json
{ "access_token": "<jwt>" }
```

---

## Patients

| Method | Path | Description |
|--------|------|-------------|
| GET | `/patients` | List all non-deleted patients |
| POST | `/patients` | Create a new patient |
| GET | `/patients/:id` | Get a single patient |
| PUT | `/patients/:id` | Update patient fields |
| DELETE | `/patients/:id` | Soft-delete patient |
| GET | `/patients/:id/encounters` | List encounters for a patient |
| POST | `/patients/:id/encounters` | Create a new encounter for a patient |

### Patient object
```json
{
  "id": 1,
  "name": "string",
  "date_of_birth": 0,
  "medical_record_number": "string",
  "marital_status": "single | married | divorced | widowed",
  "blood_group": "A | B | AB | O",
  "address": "string",
  "created_at": 0,
  "updated_at": 0,
  "deleted_at": null
}
```
> All timestamps are Unix milliseconds.

---

## Encounters

| Method | Path | Description |
|--------|------|-------------|
| GET | `/encounters/:id` | Get encounter + associated details |
| PUT | `/encounters/:id` | Update `encounter_name` |
| GET | `/encounters/:id/details` | Get SOAP JSONB details |
| PUT | `/encounters/:id/details` | Upsert SOAP JSONB details |
| POST | `/encounters/:id/transcribe` | Upload audio file → transcribe via WhisperX → save transcript |
| POST | `/encounters/:id/analyze` | Read transcript → call Gemini → deep-merge SOAP → save |

### GET `/encounters/:id` response
```json
{
  "encounter": { "id": 1, "patient_id": 1, "encounter_name": "string", "..." },
  "details": { "id": 1, "encounter_id": 1, "audio_file": "...", "transcript_path": "...", "details": {} }
}
```

### PUT `/encounters/:id/details` request body
```json
{
  "s": { ...SubjectiveFields },
  "o": { ...ObjectiveFields },
  "a": { "differentialDiagnosis": "", "workingDiagnosis": "" },
  "p": { ...PlanFields }
}
```

### POST `/encounters/:id/transcribe` request
- `Content-Type: multipart/form-data`
- Field: `audio` — audio file (any format supported by WhisperX)

Response:
```json
{ "transcript": "string" }
```

### POST `/encounters/:id/analyze` response
```json
{ "success": true, "details": { "s": {}, "o": {}, "a": {}, "p": {} } }
```
> Gemini output is deep-merged with any existing manually-saved `details`. Existing non-empty values are preserved.

---

## Planned (not yet implemented)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/me` | Get current authenticated user |
| POST | `/encounters/:id/finalize/nurse` | Nurse sign-off |
| POST | `/encounters/:id/finalize/doctor` | Doctor sign-off |
| POST | `/encounters/:id/unlock` | Unlock a finalized encounter |
| PUT | `/encounters/:id/nursing` | Save nursing form data |
| PUT | `/encounters/:id/medical` | Save medical form data |
| PUT | `/encounters/:id/exam` | Save exam form data |
| POST | `/encounters/:id/pdf` | Generate print-form PDF (`?lang=id\|en`) |
