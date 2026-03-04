# SayMed – Pain Edition (BPRC) — Monorepo Starter

Stack (locked):
- Frontend: Next.js (App Router)
- Backend: FastAPI
- Database: PostgreSQL
- Auth: Email + Password (JWT) + RBAC (doctor/nurse/admin)
- Output: Premium Print-Form PDF (ID + EN placeholder)

## Quick start (local)

### 1) Setup Environment Variables
```bash
# Copy backend env example
cp backend/.env.example backend/.env

# Copy frontend env example
cp frontend/.env.local.example frontend/.env.local
```

### 2) Run Everything via Docker
From the root directory of the project, run:
```bash
docker compose build --no-cache
docker compose up -d
```

Backend will be on: http://localhost:8000  
Docs: http://localhost:8000/docs
Frontend will be on: http://localhost:3000

Frontend will be on: http://localhost:3000

## Default seeded users
When backend starts first time, it seeds 3 users (see `backend/app/seed.py`):
- admin: admin@bprc.local / Admin123!
- doctor: doctor@bprc.local / Doctor123!
- nurse: nurse@bprc.local / Nurse123!

> Change passwords immediately in production.

## Repository layout
- `frontend/` Next.js app (UI)
- `backend/` FastAPI app (API, DB, PDF)
- `docs/` product + API notes (extend as needed)

## Next steps
1) Implement Nursing & Medical forms (schema v1.0) in UI.
2) Implement voice pipeline (upload → STT → structure → apply).
3) Implement premium PDF renderer templates for Form-1 & Form-2.
4) Add audit diff details, signature assets, and file storage (S3/R2).
