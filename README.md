# AI Web Records App Take 2

Local-first personal health records dashboard that ingests FHIR R4 bundles, Epic EHI exports, and unstructured clinical documents (PDF, RTF, TIFF) into a unified timeline.

![Dashboard](docs/screenshots/dashboard.png)

## What it does

- Parses FHIR R4 JSON bundles and Epic EHI Tables (TSV) into a normalized PostgreSQL database
- Extracts text from PDFs, RTFs, and TIFFs via Gemini vision, then identifies clinical entities (medications, conditions, labs, vitals, procedures, allergies)
- Displays records on an interactive timeline with category filtering
- Builds de-identified AI prompts for health summarization (prompt-only mode requires no API key)
- Optionally calls Gemini directly for live summarization
- Detects and resolves duplicate records (exact + fuzzy matching)
- Full HIPAA compliance: AES-256 encryption at rest, audit logging, JWT auth with token revocation, rate limiting, account lockout

## Tech stack

**Backend**: Python 3.12, FastAPI, SQLAlchemy 2 (async), PostgreSQL 16, Alembic, Gemini API, LangExtract

**Frontend**: Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query, Zustand, NextAuth.js

## Prerequisites

- macOS (tested on Apple Silicon)
- [Homebrew](https://brew.sh)
- PostgreSQL 16 and Redis 7 (`brew install postgresql@16 redis`)
- Python 3.12+ and Node.js 20+

## Quick start

### 1. Infrastructure

```bash
brew services start postgresql@16
brew services start redis
bash scripts/setup-local.sh
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_ENCRYPTION_KEY and JWT_SECRET_KEY
# Optionally add GEMINI_API_KEY for live AI features
```

### 3. Backend

```bash
cd backend
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](.env.example) for all options. The Gemini API key is only required for live summarization and text extraction — prompt-only mode works without it.

## Running tests

```bash
cd backend

# Fast tests (no API key needed)
python -m pytest -x -v

# All tests including Gemini API calls
python -m pytest -x -v --run-slow

# HIPAA compliance tests only
python -m pytest tests/test_hipaa_compliance.py -v
```

154 tests across 13 test files covering auth, records, ingestion, extraction, summarization, deduplication, and HIPAA compliance.

## License

[MIT](LICENSE)
