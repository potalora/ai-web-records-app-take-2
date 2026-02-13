# CLAUDE.md — MedTimeline: Personal Health Records Dashboard

## Project Overview

**MedTimeline** is a local-first, HIPAA-compliant personal health records app. It ingests structured records (FHIR R4 JSON bundles, Epic EHI Tables TSV exports) and unstructured documents (PDF, RTF, TIFF) into a unified FHIR R4B-compliant PostgreSQL database. Records display through an interactive timeline and categorized dashboard. Clinical entities are extracted via LangExtract, and AI summarization uses Google Gemini.

**AI Architecture — DUAL-MODE**:
- **Mode 1 (Prompt-Only)**: `/summary/build-prompt` constructs de-identified prompts. User reviews and executes externally. No API key needed.
- **Mode 2 (Live API)**: `/summary/generate` calls Gemini directly. Text extraction (PDF/TIFF) and entity extraction (LangExtract) also use Gemini. Requires `GEMINI_API_KEY`.

All health data is de-identified via the PHI scrubber (`services/ai/phi_scrubber.py`) before any AI operation in both modes.

**Critical constraint**: This app provides record organization and AI-ready prompts ONLY. It must NEVER generate diagnoses, treatment suggestions, medical advice, or clinical decision support. All AI output must include a disclaimer.

---

## Completion Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (auth, DB, API, frontend shell) | COMPLETE |
| 2 | Structured Ingestion (FHIR parser + 5 Epic mappers) | COMPLETE |
| 3 | Record Display & Timeline (unified Admin Console) | COMPLETE |
| 4 | AI Prompt Builder (prompt-only mode) | COMPLETE |
| 5 | Deduplication (detect + merge/dismiss + pagination) | COMPLETE |
| 6 | Unstructured Extraction + AI Summarization | COMPLETE |
| 7 | Polish & Testing | PARTIAL |
| 8 | HIPAA Compliance Audit Remediation | COMPLETE |

- **154 backend tests** (147 fast + 7 slow/Gemini API) across 13 test files. No frontend test automation yet.
- **Frontend theme**: Retro CRT "Nostromo Earth Terminal" — amber/sage/sienna palette, scanlines, phosphor glow, monospace fonts. 13 custom retro components in `components/retro/`.
- **API contract**: All endpoints match `docs/backend-handoff.md`.

---

## Tech Stack

### Backend
- **Python 3.12+** / FastAPI / Uvicorn / Pydantic v2
- **PostgreSQL 16** (pgcrypto) / SQLAlchemy 2.x async / Alembic migrations
- **FHIR**: `fhir.resources` R4B, `fhirpathpy`, `ijson` (streaming large bundles)
- **Auth**: `python-jose` JWT, `passlib[bcrypt]`
- **AI**: `google-genai` (Gemini), `langextract` (entity extraction), `striprtf`, `Pillow`
- **Testing**: pytest + pytest-asyncio + httpx + factory-boy
- **Background jobs**: `arq` + Redis (fallback: FastAPI BackgroundTasks)

### Frontend
- **Next.js 15** (App Router) / TypeScript / Tailwind CSS 4
- **UI**: shadcn/ui + Radix + 13 custom retro components (`components/retro/`)
- **State**: TanStack Query v5, Zustand
- **Auth**: NextAuth.js (credentials provider, local JWT)
- **Other**: Recharts, react-dropzone, lucide-react, sonner, next-themes

### Infrastructure (Local — No Docker)
- PostgreSQL 16 + Redis 7 via Homebrew, macOS Apple Silicon M4 16GB RAM

---

## Project Structure (Key Paths)

```
backend/
├── app/
│   ├── main.py, config.py, database.py, dependencies.py
│   ├── middleware/          # auth.py, audit.py, encryption.py, security_headers.py, rate_limit.py
│   ├── models/              # user, patient, record, uploaded_file, ai_summary, deduplication, provenance, audit, token_blacklist
│   ├── schemas/             # auth, records, timeline, summary, upload, dedup
│   ├── api/                 # auth, records, timeline, upload, summary, dedup, dashboard
│   ├── services/
│   │   ├── ingestion/       # coordinator, fhir_parser, epic_parser, bulk_inserter, epic_mappers/
│   │   ├── ai/              # prompt_builder, summarizer, phi_scrubber
│   │   ├── extraction/      # text_extractor, entity_extractor, clinical_examples, entity_to_fhir
│   │   ├── dedup/           # detector
│   │   └── timeline_service, dashboard_service, encryption_service
│   └── utils/               # coding, date_utils, file_utils
├── tests/                   # 13 test files + conftest.py + fixtures/
└── alembic/                 # migrations

frontend/src/
├── app/
│   ├── (auth)/              # login, register
│   └── (dashboard)/         # home, timeline, summaries, admin (12-tab console), records/[id]
├── components/
│   ├── ui/                  # shadcn components
│   └── retro/               # 13 custom CRT-themed components
├── lib/                     # api.ts, utils.ts, constants.ts
└── types/                   # api.ts

scripts/                     # init-db.sql, setup-local.sh, pg-tuning.sql, seed_sample_data.py
docs/backend-handoff.md      # Canonical API contract
```

---

## Database Schema

All tables use UUID PKs, `created_at`/`updated_at` timestamps. PII fields encrypted via AES-256/pgcrypto. Full schema in Alembic migrations (`backend/alembic/versions/`).

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Auth accounts | email (encrypted), password_hash, is_active, failed_login_attempts, locked_until |
| `revoked_tokens` | JWT blacklist | jti (unique, indexed), user_id, token_type, expires_at, revoked_at |
| `patients` | Demographics | user_id (owner), mrn/name/dob/contact (all encrypted) |
| `health_records` | All clinical data (unified) | patient_id, record_type, fhir_resource (JSONB), effective_date, code_system/value/display, display_text, ai_extracted, confidence_score, deleted_at (soft delete) |
| `uploaded_files` | Upload tracking | ingestion_status/progress/errors (JSONB), file_category, extracted_text, extraction_entities |
| `ai_summary_prompts` | AI prompts + responses | summary_type, system/user_prompt, response_text, response_source (paste/api), de_identification_log |
| `dedup_candidates` | Duplicate pairs | record_a_id, record_b_id, similarity_score, status (pending/merged/dismissed) |
| `provenance` | Data lineage | record_id, action, agent, source_file_id |
| `audit_log` | HIPAA audit trail | user_id, action, resource_type/id, ip_address |

---

## HIPAA Compliance

1. **Encryption at rest**: AES-256 via pgcrypto for all PII. File uploads encrypted on disk.
2. **Encryption in transit**: TLS required for all API communication. HSTS header on HTTPS.
3. **Authentication**: bcrypt (cost >= 12). JWT access tokens (15 min) + refresh tokens (7 day, rotated). Password complexity: 8+ chars, uppercase, lowercase, digit, special char.
4. **Authorization**: Row-level security — every DB query MUST filter by `user_id`.
5. **Audit logging**: ALL 19+ data-access endpoints logged to `audit_log` (records, timeline, dashboard, summary, dedup). No plaintext email in audit details (only domain).
6. **Session management**: 30-min frontend idle timeout (`lib/api.ts`). Token revocation on logout via `revoked_tokens` table with JTI tracking. Refresh token rotation (old token revoked on use).
7. **Account lockout**: 5 failed login attempts → 15-min lockout. In-memory rate limiting: 5 login/60s, 3 register/60s per IP.
8. **Security headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Cache-Control: no-store`, `Content-Security-Policy`, HSTS (HTTPS).
9. **CORS hardening**: Explicit allowed methods (`GET/POST/PUT/DELETE/OPTIONS`) and headers (`Authorization/Content-Type/Accept`). No wildcards with credentials.
10. **Config hardening**: Production mode rejects default JWT secret and empty encryption key.
11. **Data minimization**: Only necessary data stored. All AI ops use de-identified data.
12. **Soft deletes**: Never hard-delete health records. Use `deleted_at`.
13. **Input validation**: Pydantic on all inputs. File upload path traversal prevention (UUID-based filenames). Magic byte validation for PDF/RTF/TIFF. Size limits (500MB/file, 5GB/export).
14. **Error handling**: Never expose stack traces or PII in responses. Background task errors log full details internally, expose only error type to client.

**AI-specific**: PHI scrubber (`services/ai/phi_scrubber.py`) strips all 18 HIPAA identifiers (SSN, phone, fax, email, MRN, IP, URL, ZIP, dates, accounts, licenses, VIN, device IDs, biometrics, health plan numbers) before any Gemini call — including entity extraction. De-identification log stored with each prompt. No-diagnosis constraints in all prompts. API keys in `.env` only.

---

## AI Integration

### Unstructured Extraction Pipeline
```
Upload (PDF/RTF/TIFF) → Text Extraction → PHI Scrubbing → Entity Extraction (LangExtract) → User Review → Confirm → FHIR Records
```
- **PDF/TIFF**: Gemini vision API. **RTF**: `striprtf` (local, no API).
- **Entity extraction**: LangExtract with 7 clinical entity types (meds, conditions, procedures, labs, vitals, allergies, providers). Few-shot examples in `services/extraction/clinical_examples.py`.
- **Entity → FHIR mapping**: `services/extraction/entity_to_fhir.py`. Records created with `ai_extracted=true`.

### Models
- `gemini-3-flash-preview` — summarization + text extraction
- `gemini-2.5-flash` — entity extraction via LangExtract

### Summary Types
- Full health summary, category summary, date range summary, single record summary

### Deduplication
- Exact match (type + code + date + value), fuzzy match (Levenshtein + date proximity), file-level SHA-256
- User resolves via merge/dismiss in Admin Console. All merges create provenance records.

---

## Frontend Design: "Nostromo Earth Terminal"

- **Palette**: Background `#0d0b08`/`#1a1612`, amber `#e09040`, gold `#b8956a`, sage `#7a8c5a`, terracotta `#c45a3c`, ochre `#d4a843`, sienna `#a0522d`
- **Fonts**: Berkeley Mono / Space Mono (headings/body), VT323 (terminal data)
- **Effects**: CRT scanlines, phosphor glow, vignette (all CSS in `globals.css`)
- **13 retro components**: CRTOverlay, GlowText, RetroCard, RetroButton, RetroTable, RetroTabs, RetroInput, RetroNav, RetroBadge, RetroLoadingState, StatusReadout, TerminalLog, RecordDetailSheet
- **Admin Console** (`/admin`): 12-tab interface (HOME, ALL, LABS, MEDS, COND, ENC, IMM, IMG, UPLOAD, DEDUP, SUMM, SET). Category pages redirect to admin tabs.

---

## API Endpoints

> Full contract with request/response schemas: `docs/backend-handoff.md`

Base URL: `/api/v1`

### Auth
```
POST   /auth/register, /auth/login, /auth/refresh, /auth/logout
```

### Records
```
GET    /records              # List (paginated, filterable)
GET    /records/:id          # Single record with FHIR resource
GET    /records/search       # Full-text search
DELETE /records/:id          # Soft delete
```

### Timeline
```
GET    /timeline             # Date-ordered, filterable
GET    /timeline/stats       # Aggregated stats
```

### Upload & Ingestion
```
POST   /upload                        # Structured file upload (JSON, ZIP, TSV)
POST   /upload/epic-export            # Epic EHI Tables export
POST   /upload/unstructured           # PDF/RTF/TIFF → text + entity extraction
GET    /upload/:id/status             # Ingestion progress (poll every 2s)
GET    /upload/:id/errors             # Row-level ingestion errors
GET    /upload/:id/extraction         # Extracted text + entities
POST   /upload/:id/confirm-extraction # Confirm entities → FHIR records
GET    /upload/history                # Upload history
DELETE /upload/:id                    # Cancel/delete upload
```

### AI Summary
```
POST   /summary/build-prompt    # Build de-identified prompt (no API call)
POST   /summary/generate        # Generate via Gemini API (NL, JSON, or both)
GET    /summary/prompts         # List prompts
GET    /summary/prompts/:id     # Get prompt detail
POST   /summary/paste-response  # Paste AI response for storage
GET    /summary/responses       # List responses
```

### Deduplication
```
GET    /dedup/candidates   # List (paginated: ?page=1&limit=20)
POST   /dedup/merge        # Merge two records
POST   /dedup/dismiss      # Dismiss candidate pair
```

### Dashboard
```
GET    /dashboard/overview, /dashboard/labs, /dashboard/patients
```

---

## Testing

### Test Suite: 154 Backend Tests

| File | Count | Scope |
|------|-------|-------|
| test_auth | 10 | Register, login, tokens, logout, refresh |
| test_records | 12 | CRUD, pagination, search, soft delete |
| test_dashboard | 9 | Overview, labs, type counts |
| test_timeline | 8 | Data, filtering, stats |
| test_upload | 9 | Upload, status, errors, history |
| test_summary | 9 | Prompt build, de-identification, paste |
| test_dedup | 9 | Candidates, merge, dismiss, pagination |
| test_ingestion | 15 | FHIR parser, Epic mappers |
| test_text_extraction | 12 | File detection, RTF/PDF/TIFF |
| test_entity_extraction | 13 | Entity → FHIR mapping |
| test_summarization | 9 | AI summary, output formats |
| test_unstructured_upload | 8 | Unstructured flow, confirmation |
| test_hipaa_compliance | 28 | Token revocation, rate limiting, lockout, security headers, CORS, password complexity, config hardening, PHI scrubber expansion, path traversal, magic bytes, audit logging |

### Running Tests
```bash
cd backend && python -m pytest -x -v              # 147 fast tests
cd backend && python -m pytest -m slow -v          # 7 slow tests (needs GEMINI_API_KEY)
cd backend && python -m pytest -x -v --run-slow    # All 154 tests
cd backend && python -m pytest tests/test_hipaa_compliance.py -v  # HIPAA tests only
cd backend && python -m pytest tests/test_dedup.py -v  # Single file
```

Helpers in `conftest.py`: `auth_headers()`, `create_test_patient()`, `seed_test_records()`. Synthetic fixtures always available; user-provided fixtures (gitignored) preferred when present.

---

## Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://localhost:5432/medtimeline
DATABASE_ENCRYPTION_KEY=<32-byte-hex-key>
JWT_SECRET_KEY=<random-64-char-string>
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# AI (required for Mode 2; optional for prompt-only)
GEMINI_API_KEY=<google-ai-studio-key>
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_EXTRACTION_MODEL=gemini-2.5-flash
GEMINI_SUMMARY_TEMPERATURE=0.3
GEMINI_SUMMARY_MAX_TOKENS=8192

# Prompt-only mode
PROMPT_TARGET_MODEL=gemini-3-flash-preview
PROMPT_SUGGESTED_TEMPERATURE=0.3
PROMPT_SUGGESTED_MAX_TOKENS=4096
PROMPT_SUGGESTED_THINKING_LEVEL=low

REDIS_URL=redis://localhost:6379/0
UPLOAD_DIR=./data/uploads
TEMP_EXTRACT_DIR=./data/tmp
MAX_FILE_SIZE_MB=500
MAX_EPIC_EXPORT_SIZE_MB=5000
INGESTION_BATCH_SIZE=100
INGESTION_WORKER_CONCURRENCY=1
APP_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
```

---

## Coding Standards

### Python
- Type hints on all functions. `from __future__ import annotations` in every file.
- Async/await throughout. Pydantic v2 validation. Google-style docstrings.
- No bare `except:`. Use `logging`, never `print()`. Ruff formatting (100 char lines).

### TypeScript
- Strict mode. Functional components only. Named exports (except pages).
- Tailwind only (no CSS modules). Server components preferred; `'use client'` only when needed.
- All API calls through `lib/api.ts`.

### Ingestion Performance (16GB machine)
- **Stream, never slurp**: Never `.read()` or `list(reader)` on large files. Use iterators.
- **Batch 100 records**, commit per batch. One file at a time.
- **Background processing** for imports > 5s. Frontend polls `upload/:id/status`.
- Large FHIR bundles (>10MB) use `ijson` streaming parser.

---

## Absolute Rules

1. **NEVER generate diagnoses, treatment suggestions, or medical advice in any code, prompt template, or UI text.**
2. **ALWAYS de-identify all health data via PHI scrubber before any Gemini API call.** Never send raw PII/PHI to external services. This applies to summarization, text extraction, and entity extraction.
3. **AI SDKs (`google-genai`, `langextract`) are installed and used.** Do NOT add additional AI providers (OpenAI, Anthropic, etc.) without explicit user approval. No `openai`, `anthropic`, or other AI SDKs.
4. **`GEMINI_API_KEY` provided via `.env` only.** Never hardcode API keys in source code. Never commit `.env` to git. No `OPENAI_API_KEY` or other provider keys.
5. **NEVER include raw PII/PHI in any constructed prompt.** All health data in prompts must pass through the PHI scrubber first. Write tests that verify this.
6. **NEVER hard-delete health records.** Always soft-delete with `deleted_at`.
7. **NEVER expose stack traces or internal errors in API responses.**
8. **NEVER store passwords in plaintext.** Always bcrypt with cost >= 12.
9. **NEVER skip audit logging** on data access or mutation endpoints.
10. **NEVER commit user-provided test fixtures to git.** They may contain real PHI. Gitignore them.
11. **ALWAYS enforce user-scoped data access** — every DB query MUST filter by `user_id`.
12. **ALWAYS include the AI disclaimer** component wherever AI prompts or pasted-back responses are displayed.
13. **ALWAYS validate and sanitize file uploads** before processing.
14. **ALWAYS write tests** alongside new features — no untested code in services or parsers.
15. **ALWAYS build and test parsers against user-provided real files first** (with synthetic fallback for CI).
16. **Use `gemini-3-flash-preview`** for summarization and text extraction. **Use `gemini-2.5-flash`** for entity extraction via LangExtract. No other models or providers.
17. **Use ONLY open-source, permissively-licensed libraries** (MIT, Apache 2.0, BSD). No GPL in runtime dependencies.

---

## HIPAA Audit Remediation (Phase 8)

Full security audit remediation completed. 16 findings addressed (8 Critical, 6 High, 2 Medium):

| ID | Finding | Fix | Files |
|----|---------|-----|-------|
| C1 | No token revocation on logout | JWT JTI tracking, `revoked_tokens` table, check on every authenticated request | `middleware/auth.py`, `dependencies.py`, `api/auth.py`, `services/auth_service.py` |
| C2 | No rate limiting / account lockout | In-memory sliding window (5 login/60s, 3 register/60s), 5-attempt lockout (15 min) | `middleware/rate_limit.py`, `services/auth_service.py`, `api/auth.py` |
| C3 | 13+ endpoints missing audit logging | All 19 data-access endpoints now log to `audit_log` | `api/records.py`, `timeline.py`, `dashboard.py`, `summary.py`, `dedup.py` |
| C4 | PHI not scrubbed before entity extraction | `scrub_phi()` called before `extract_entities_async()` | `api/upload.py:_process_unstructured()` |
| C5 | File upload path traversal | UUID-based filenames via `_safe_file_path()`, resolved path validation | `api/upload.py` |
| C6 | No file size check on epic-export | Size validation against `max_epic_export_size_mb` | `api/upload.py:upload_epic_export()` |
| C7 | No security headers | `SecurityHeadersMiddleware` (X-Frame-Options, CSP, HSTS, etc.) | `middleware/security_headers.py`, `main.py` |
| C8 | CORS wildcard with credentials | Explicit `allow_methods` and `allow_headers` lists | `main.py` |
| H1 | Weak password policy | `@field_validator` requiring uppercase, lowercase, digit, special char | `schemas/auth.py` |
| H2 | No idle timeout | 30-min frontend idle timeout, clears auth + redirects to login | `frontend/src/lib/api.ts` |
| H3 | JWT secret defaults to insecure value | `model_validator` rejects defaults in non-development environments | `config.py` |
| H4 | Background task errors leak `str(e)` | Log full error internally, expose only error type to client | `api/upload.py:_process_unstructured()` |
| H5 | Plaintext email in audit log | Only log email domain (`email.split("@")[1]`) | `api/auth.py` |
| H6 | PHI scrubber covers ~8 of 18 identifiers | Added fax, VIN, device ID, biometric, health plan number patterns; word-boundary matching for short names | `services/ai/phi_scrubber.py` |
| M1 | File type validated by extension only | Magic byte validation for PDF (`%PDF`), RTF (`{\rtf`), TIFF (LE/BE) | `api/upload.py` |
| M2 | Entity extraction error exposed to client | Generic error message instead of raw extraction error | `api/upload.py:_process_unstructured()` |

**New files**: `models/token_blacklist.py`, `middleware/security_headers.py`, `middleware/rate_limit.py`, `tests/test_hipaa_compliance.py`
**Migration**: `alembic/versions/9ac4081003fc_hipaa_compliance_fields.py` (revoked_tokens table + user lockout fields)

---

## Quick Start

```bash
# Prerequisites (user handles before Claude Code starts):
# brew services start postgresql@16 && brew services start redis
# createdb medtimeline && psql medtimeline < scripts/init-db.sql

# Backend
cd backend && pip install -e ".[dev]" && alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev

# Environment: cp .env.example .env, add GEMINI_API_KEY for Mode 2
```
