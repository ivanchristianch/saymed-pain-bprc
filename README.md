# SayMed – Pain Edition (BPRC) — Monorepo

Stack:
- Frontend: Vite + React (TypeScript) + MUI v5 + i18n (Indonesian)
- Backend: Node.js (Express/TypeScript) + Kysely + PostgreSQL + Redis
- Auth: Email + Password (JWT, 12h) — single role (admin) in v1
- SOAP Form: Full S/O/A/P with AI-assisted extraction via WhisperX + Gemini
- Pipeline: Async transcription + analysis with Redis-backed deduplication lock and DB-persisted job state

---

## Quick start (local)

### 1) Set up environment variables
```bash
cp .env.example backend/.env
# Fill in GEMINI_API_KEY and WHISPERX_API_URL
```

### 2) Run everything via Docker
```bash
docker-compose build --no-cache
docker-compose up -d
```

Services started:
- PostgreSQL — internal only (port 5432 exposed to host for dev tools)
- Redis — internal only (port 6379 exposed to host for dev tools)
- Backend API: http://localhost:8000
- Health check: http://localhost:8000/api/health
- Frontend: http://localhost:3000

On first start the API container automatically runs `npm install`, then migrations, then seeds the admin user, then starts the dev server.

---

## Logging

The backend uses [Pino](https://getpino.io/) for structured JSON logging. All `console.*` calls have been replaced. Every log line is a single JSON object.

### Log shape

```json
{
  "level": "info",
  "time": 1713600000000,
  "requestId": "a1b2c3d4-...",
  "method": "POST",
  "path": "/api/encounters/5/process",
  "msg": "Transcript job created",
  "transcriptId": 42
}
```

### How `x-request-id` flows

1. **Frontend** — `frontend/src/api.ts` calls `crypto.randomUUID()` for every `fetchApi()` call and attaches it as the `x-request-id` request header.
2. **Backend middleware** — `backend/src/middleware/requestLogger.ts` reads `x-request-id` from the header (or generates a UUID fallback if not present), creates a Pino child logger bound with `{ requestId, method, path }`, and echoes the id back in the `x-request-id` response header.
3. **All downstream code** — services and repositories call `getLogger()` (`backend/src/logger.ts`) which uses Node's `AsyncLocalStorage` to automatically return the per-request child logger without any manual threading. Every log line from that request — including background pipeline logs — carries the same `requestId`.

### Log level

Controlled by the `LOG_LEVEL` environment variable. Defaults to `info` in production.

Valid values: `trace` | `debug` | `info` | `warn` | `error` | `fatal`

```bash
# docker-compose.prod.yml / .env
LOG_LEVEL=info
```

### Non-request contexts

Code that runs outside a request (startup, Redis events, migration scripts, seed script) falls back to the base logger — logs are still structured JSON but without `requestId`/`method`/`path` fields.

---

## Production deployment

### Repository layout

```
frontend/                        Vite React app (UI + SOAP forms)
backend/                         Node.js Express app (API, DB, AI pipeline)
nginx/
  nginx.conf                     Reverse proxy config (TLS termination, ACME challenge)
  nginx.no-tls.conf              Reverse proxy config (HTTP only, no domain required)
docs/                            API contract and product notes
docker-compose.yml               Development compose (live-reload, no TLS)
docker-compose.prod.yml          Production compose (multi-stage builds, TLS, Certbot)
docker-compose.prod-no-tls.yml   Production compose (HTTP only, no domain/cert required)
.env.example                     Documented environment variable template
```

### Production Docker files

| File | Purpose |
|---|---|
| `backend/Dockerfile.prod` | Two-stage: `tsc` build → lean Node runtime (`--omit=dev`) |
| `frontend/Dockerfile.prod` | Two-stage: Vite build → Nginx static server |
| `frontend/nginx.conf` | SPA `try_files` fallback, gzip, immutable asset cache headers |
| `nginx/nginx.conf` | Reverse proxy: HTTP→HTTPS redirect, ACME challenge pass-through, TLS termination, `/api/*` → `api:8000`, `/*` → `web:80` |
| `nginx/nginx.no-tls.conf` | Reverse proxy: HTTP only on port 80, catch-all `server_name _`, same upstream routing — no domain or certs needed |
| `docker-compose.prod.yml` | Orchestrates db, redis, api, web, nginx + certbot (on-demand profile) |
| `docker-compose.prod-no-tls.yml` | Same as above but HTTP only — no certbot, no TLS volumes, no `DOMAIN` variable |
| `.env.example` | All required environment variables with descriptions |

---

## Production deployment (no domain / no TLS)

Use this path when you are deploying to a server IP before a domain name is available.
Traffic is served over plain HTTP on port 80.

> When your domain is ready, follow the [full TLS deployment](#step-by-step-deployment) below and switch to `docker-compose.prod.yml`.

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
POSTGRES_DB=saymed
POSTGRES_USER=saymed
POSTGRES_PASSWORD=<strong password>
DATABASE_URL=postgres://saymed:<password>@db:5432/saymed

REDIS_PASSWORD=<strong password>
REDIS_URL=redis://:<password>@redis:6379

JWT_SECRET=<run: openssl rand -hex 32>

GEMINI_API_KEY=<your key>
WHISPERX_API_URL=<your modal endpoint>

# Point to your server's public IP
VITE_API_BASE=http://<SERVER_IP>/api
CORS_ORIGINS=http://<SERVER_IP>

LOG_LEVEL=info
```

`DOMAIN` and `CERTBOT_EMAIL` are **not required** for this compose file.

### 2. Start all services

```bash
docker compose -f docker-compose.prod-no-tls.yml up -d --build
```

The API container automatically runs database migrations on startup before serving traffic.

### 3. Verify

```bash
# Health check (replace with your server IP)
curl http://<SERVER_IP>/api/health

# Frontend should be reachable at
http://<SERVER_IP>
```

### Useful no-TLS commands

```bash
# View live API logs
docker compose -f docker-compose.prod-no-tls.yml logs -f api

# Restart only the API (e.g. after an env change)
docker compose -f docker-compose.prod-no-tls.yml restart api

# Pull latest code and redeploy
git pull
docker compose -f docker-compose.prod-no-tls.yml build api web
docker compose -f docker-compose.prod-no-tls.yml up -d
```

### Upgrading to TLS when your domain is ready

1. Add `DOMAIN`, update `VITE_API_BASE=https://<domain>/api` and `CORS_ORIGINS=https://<domain>` in `.env`.
2. Stop the no-TLS stack: `docker compose -f docker-compose.prod-no-tls.yml down`
3. Follow the full TLS deployment steps below.

---

## Production deployment (with TLS)

### Step-by-step deployment

#### 1. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in every value, especially:
#   DOMAIN, POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET,
#   GEMINI_API_KEY, WHISPERX_API_URL, VITE_API_BASE,
#   CORS_ORIGINS=https://<DOMAIN>
```

#### 2. Point your domain's DNS A record to the server IP

Certbot requires port 80 to be publicly reachable before issuing a certificate.

#### 3. Bootstrap Nginx for the ACME challenge

On first run Nginx refuses to start because the TLS certificate files don't exist yet.
The solution is to temporarily run Nginx with the no-TLS config (HTTP only), obtain the cert, then switch back.

**3a. Swap the Nginx config mount in `docker-compose.prod.yml`:**

```yaml
# Change this line in the nginx service volumes:
- ./nginx/nginx.no-tls.conf:/etc/nginx/templates/default.conf.template:ro
```

**3b. Start Nginx:**

```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

#### 4. Issue the TLS certificate

```bash
docker compose -f docker-compose.prod.yml \
  --profile certbot run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d <DOMAIN> \
  --email <YOUR_EMAIL> \
  --agree-tos --no-eff-email
```

**Revert the Nginx config mount back to the TLS config:**

```yaml
- ./nginx/nginx.conf:/etc/nginx/templates/default.conf.template:ro
```

#### 5. Start all services

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate nginx
docker compose -f docker-compose.prod.yml up -d
```

The API container runs `node dist/src/migrate.js` automatically on startup before serving traffic.

#### 6. Set up certificate auto-renewal (host cron)

```bash
# Run every 12 hours; certbot renew is a no-op when cert is not due
0 0,12 * * * docker compose -f /srv/saymed/docker-compose.prod.yml \
  --profile certbot run --rm certbot renew --quiet \
  && docker compose -f /srv/saymed/docker-compose.prod.yml exec nginx nginx -s reload
```

### Useful TLS production commands

```bash
# View live API logs
docker compose -f docker-compose.prod.yml logs -f api

# Run migrations manually
docker compose -f docker-compose.prod.yml exec api node dist/src/migrate.js

# Run seed (creates admin user and default business)
docker compose -f docker-compose.prod.yml exec api node dist/src/seed.js

# Restart only the API (e.g. after an env change)
docker compose -f docker-compose.prod.yml restart api

# Pull latest code and redeploy
git pull
docker compose -f docker-compose.prod.yml build api web
docker compose -f docker-compose.prod.yml up -d
```

---

## Migrations

The project uses [Kysely](https://kysely.dev/) migrations. Files live in `backend/migrations/` and are named `001_`, `002_`, etc. The runner tracks which have run in a `kysely_migration` table and only runs new ones — safe to call repeatedly.

### Run migrations

```bash
# Inside the container (production — compiled JS)
docker compose -f docker-compose.prod.yml exec api node dist/src/migrate.js

# From your host machine (development — uses tsx, localhost:5432 via backend/.env)
cd backend && npm run migrate
```

### Check migration status

```bash
docker exec saymed_db psql -U postgres -d saymed \
  -c "SELECT name FROM kysely_migration ORDER BY name;"
```

### Add a new migration

1. Create `backend/migrations/004_your_change.ts` with `up()` and `down()` functions.
2. Either restart the container (migrations run automatically on startup) or run manually:

```bash
docker exec saymed_api npm run migrate
# or
docker-compose restart api
```

### Migration files

| File | What it does |
|---|---|
| `001_initial.ts` | Core tables: `users_tab`, `patients_tab`, `encounters_tab`, `encounter_details_tab` |
| `002_business.ts` | `business_tab`, `business_id` FK on users/patients/encounters |
| `003_transcript_analysis.ts` | `transcript_tab` + `analysis_tab` for async pipeline state; removes `transcript_path` from `encounter_details_tab` |

---

## AI pipeline

The transcription + analysis pipeline is **async and persistent** — jobs survive page refreshes and server restarts.

### Flow

```
POST /encounters/:id/upload      → saves audio file to disk
POST /encounters/:id/process     → fires pipeline in background, returns 202 immediately
GET  /encounters/:id/status      → poll this every 5s to track progress
GET  /encounters/:id/transcript  → fetch transcript text once done
GET  /encounters/:id/details     → fetch SOAP JSON once done
```

### Status response shape

```json
{ "stage": "transcript" | "analysis" | null,
  "status": "pending" | "success" | "error" | null,
  "error_msg": "..." | null }
```

Derived UI stages:

| stage | status | UI state |
|---|---|---|
| `null` | `null` | No audio / pipeline not started |
| `"transcript"` | `"pending"` | Transcribing |
| `"transcript"` | `"error"` | Transcript failed — retry available |
| `"analysis"` | `"pending"` / `null` | Analyzing |
| `"analysis"` | `"error"` | Analysis failed — retry available |
| `"analysis"` | `"success"` | Done — SOAP available |

### Deduplication lock

`POST /process` acquires a Redis lock (`SET NX PX`) per encounter before starting the pipeline. A second request while the pipeline is running returns `202` immediately without spawning a duplicate job. The lock auto-expires after the maximum pipeline timeout in case of a crash.

### SOAP data fallback chain

`GET /details` returns SOAP in this priority order:
1. `encounter_details_tab.details` — if it contains `s`/`o`/`a`/`p` keys (doctor manually saved)
2. `analysis_tab.result` — latest successful AI analysis for the current audio
3. Empty `{}`

---

## Default seeded user

When the backend starts for the first time it automatically runs migrations and then you can seed the admin user manually (see `backend/src/seed.ts`):

```bash
# Development
cd backend && npm run seed

# Production (inside container)
docker compose -f docker-compose.prod.yml exec api node dist/src/seed.js
```

| Role  | Email               | Password    |
|-------|---------------------|-------------|
| admin | admin@saymed.id     | Admin1234!  |

> Change the password before deploying to production.

---

## Verification

```bash
# Backend health
curl http://localhost:8000/api/health

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@saymed.id","password":"Admin1234!"}'

# Check pipeline status for encounter 1
TOKEN=<paste token here>
curl http://localhost:8000/api/encounters/1/status \
  -H "Authorization: Bearer $TOKEN"

# Verify request-id is echoed back
curl -v http://localhost:8000/api/health \
  -H "x-request-id: test-id-123" 2>&1 | grep x-request-id
```

---

## Remaining work (not yet implemented)

1. PDF renderer — premium print-form for Form-1 & Form-2 (ID + EN).
2. Nursing & Medical forms (separate from doctor SOAP form).
3. RBAC — doctor / nurse / admin roles with per-route guards.
4. Audit log — diff history and signature assets.
5. File storage — move uploads/transcripts to S3/R2.
6. English (`en`) i18n translation file.
