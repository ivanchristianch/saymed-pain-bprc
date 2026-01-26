# API Contract (v1)

Base URL: `/api`

## Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

## Patients
- `POST /api/patients`
- `GET /api/patients?search=`
- `GET /api/patients/{id}`
- `PATCH /api/patients/{id}`

## Encounters
- `POST /api/encounters`
- `GET /api/encounters?patient_id=`
- `GET /api/encounters/{id}`
- `PATCH /api/encounters/{id}`
- `POST /api/encounters/{id}/finalize/nurse`
- `POST /api/encounters/{id}/finalize/doctor`
- `POST /api/encounters/{id}/unlock`

## Nursing / Medical / Exam
- `PUT /api/encounters/{id}/nursing`
- `PUT /api/encounters/{id}/medical`
- `PUT /api/encounters/{id}/exam`

## Voice (placeholders)
- `POST /api/encounters/{id}/voice/upload`
- `POST /api/encounters/{id}/voice/transcribe`
- `POST /api/encounters/{id}/voice/structure`
- `POST /api/encounters/{id}/voice/apply`

## PDF
- `POST /api/encounters/{id}/pdf?lang=id|en`
