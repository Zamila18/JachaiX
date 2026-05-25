# JachaiX — Bangla Fake News Detection System

**Infinity AI BuildFest 2026 | Team: Musketeers | Deadline: May 30, 2026**

JachaiX detects misinformation in Bangla text, images, and PDFs.
Users submit a claim → JachaiX returns a verdict (true / false / misleading / unverified) with evidence and explanation.

---

## Architecture

```
User → Laravel API (port 8080)
         ├── OCR Service     (port 5001) — PaddleOCR for images/PDFs
         ├── Embedder Service (port 5002) — sentence-transformers + Qdrant
         ├── Reranker Service (port 5003) — cross-encoder reranking
         ├── MySQL            (port 3306) — main database
         ├── Redis            (port 6379) — queue + cache
         └── Qdrant           (port 6333) — vector database for evidence
```

---

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Python | 3.10.x | https://www.python.org/downloads/release/python-31011/ |
| Git | Any | https://git-scm.com |

> **Python must be 3.10** — PaddleOCR does not support 3.11+.

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/Zamila18/JachaiX.git
cd JachaiX
```

---

## Step 2 — Set Up Environment Files

### Root `.env` (for Docker Compose — MySQL credentials)

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Open `.env` and set your passwords:

```env
MYSQL_ROOT_PASSWORD=any_root_password_you_choose
MYSQL_DATABASE=jachaix
MYSQL_USER=jachaix
MYSQL_PASSWORD=any_db_password_you_choose
```

### Backend `.env` (for Laravel)

```bash
# Windows
copy backend\.env.example backend\.env

# Mac/Linux
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in:

```env
DB_PASSWORD=same_password_as_MYSQL_PASSWORD_above

OPENAI_API_KEY=sk-your-openai-key-here
```

Then generate the Laravel app key:

```bash
# Windows
docker run --rm -v "%cd%/backend":/app -w /app php:8.3-cli php artisan key:generate

# Mac/Linux
docker run --rm -v "$(pwd)/backend":/app -w /app php:8.3-cli php artisan key:generate
```

---

## Step 3 — Start Docker Services

```bash
docker compose up -d --build
```

This starts: **nginx, Laravel app, MySQL, Redis, Qdrant**

Wait ~30 seconds for MySQL to be ready, then run migrations:

```bash
# Windows
docker exec jachaix-app-1 php artisan migrate --force

# If container name differs, find it with:
docker ps
```

---

## Step 4 — Set Up Python Services

The three Python services (OCR, Embedder, Reranker) run on your host machine.
You need **3 separate terminals** for this.

### Terminal 1 — OCR Service (port 5001)

```bash
cd services/ocr-service

# Windows
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5001

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5001
```

> First run downloads PaddleOCR models (~500MB). Wait for `Uvicorn running on http://0.0.0.0:5001`.

### Terminal 2 — Embedder Service (port 5002)

```bash
cd services/embedder-service

# Windows
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5002

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5002
```

> First run downloads the multilingual sentence transformer model (~1.1GB).

### Terminal 3 — Reranker Service (port 5003)

```bash
cd services/reranker-service

# Windows
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5003

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5003
```

> First run downloads the cross-encoder reranker model (~470MB).

---

## Step 5 — Verify Everything Is Running

Open a new terminal and run each check:

### Docker services

```bash
docker ps
```

You should see these containers all with status `Up`:
- `jachaix-nginx-1`
- `jachaix-app-1`
- `jachaix-mysql-1`
- `jachaix-redis-1`
- `jachaix-qdrant-1`

### Health checks

```bash
# Laravel API
curl http://localhost:8080/api/v1/health
# Expected: {"status":"ok","service":"JachaiX API","version":"1.0.0"}

# OCR service
curl http://localhost:5001/health
# Expected: {"status":"ok"}

# Embedder service
curl http://localhost:5002/health
# Expected: {"status":"ok"}

# Reranker service
curl http://localhost:5003/health
# Expected: {"status":"ok"}
```

### Test Embedder (Bangla text → vector)

```bash
curl -X POST http://localhost:5002/embed/text \
  -H "Content-Type: application/json" \
  -d '{"text": "মন্ত্রী পদত্যাগ করেছেন"}'
# Expected: {"embedding": [...], "dimensions": 768, "model": "paraphrase-multilingual-mpnet-base-v2"}
```

**Windows cmd:**
```cmd
curl -X POST http://localhost:5002/embed/text -H "Content-Type: application/json" -d "{\"text\": \"minister resigned\"}"
```

### Test Reranker

```bash
curl -X POST http://localhost:5003/rerank \
  -H "Content-Type: application/json" \
  -d '{
    "query": "minister resigned yesterday",
    "documents": [
      {"text": "The minister stepped down from office", "url": "https://example.com/1"},
      {"text": "Today is a sunny day in Dhaka", "url": "https://example.com/2"}
    ],
    "top_k": 2
  }'
# Expected: results sorted by rerank_score — first doc scores higher
```

### Test Laravel claim submission

```bash
curl -X POST http://localhost:8080/api/v1/claims \
  -H "Content-Type: application/json" \
  -d '{"input_type":"text","raw_input":"Sheikh Hasina resigned in August 2024","language":"bn"}'
# Expected: {"success":true,"claim_id":1,"status":"pending"}
```

**Windows cmd:**
```cmd
curl -X POST http://localhost:8080/api/v1/claims -H "Content-Type: application/json" -d "{\"input_type\":\"text\",\"raw_input\":\"Sheikh Hasina resigned in August 2024\",\"language\":\"bn\"}"
```

Check claim status:
```bash
curl http://localhost:8080/api/v1/claims/1/status
# Expected: {"success":true,"claim":{"id":1,"status":"pending",...}}
```

---

## What's Working So Far

| Feature | Status |
|---------|--------|
| Laravel API (health, submit, status, result routes) | ✅ Done |
| MySQL schema (claims, evidence, audit_logs, etc.) | ✅ Done |
| OCR service — image + PDF text extraction | ✅ Done |
| Embedder service — 768-dim multilingual vectors | ✅ Done |
| Reranker service — cross-encoder scoring | ✅ Done |
| Full analysis pipeline (`ProcessAnalysisJob.php`) | ✅ Done |
| Queue worker to process jobs | ⬜ Not started |
| Knowledge base (crawled Bangla news in Qdrant) | ⬜ Not started |
| Frontend UI | ⬜ Not started |
| MCP server | ⬜ Not started |

---

## Common Issues

**`docker exec jachaix-app-1` — container not found**
Run `docker ps` to find the exact container name and replace `jachaix-app-1`.

**OCR service crashes on first start (Windows)**
PaddleOCR downloads models on first request, not on startup. Just wait for uvicorn to say `running`, then hit the health endpoint.

**`Access denied for user 'jachaix'`**
Your `backend/.env` `DB_PASSWORD` doesn't match `MYSQL_PASSWORD` in root `.env`. Make sure they're identical.

**Python venv activation fails on Windows**
Run this first in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Models downloading slowly / disk space**
Embedder model: ~1.1GB, Reranker: ~470MB, PaddleOCR: ~500MB. Make sure you have at least 5GB free.

---

## Project Structure

```
JachaiX/
├── backend/                  ← Laravel 13 (PHP 8.3)
│   ├── app/
│   │   ├── Http/Controllers/ClaimController.php
│   │   ├── Jobs/ProcessAnalysisJob.php   ← main analysis pipeline
│   │   └── Models/
│   ├── database/migrations/
│   └── routes/api.php
├── services/
│   ├── ocr-service/          ← Python FastAPI (port 5001)
│   ├── embedder-service/     ← Python FastAPI (port 5002)
│   └── reranker-service/     ← Python FastAPI (port 5003)
├── corpus/
│   ├── crawler/              ← (to be built) Bangla news scraper
│   └── chunker/              ← (to be built) chunk + embed → Qdrant
├── frontend/                 ← (to be built)
├── docker-compose.yml
└── .env.example
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/claims` | Submit text/image/pdf claim |
| GET | `/api/v1/claims/{id}/status` | Check processing status |
| GET | `/api/v1/claims/{id}/result` | Get full verdict + explanation |

**POST `/api/v1/claims` — text input:**
```json
{
  "input_type": "text",
  "raw_input": "Your claim text here",
  "language": "bn"
}
```

**POST `/api/v1/claims` — image/pdf input:**
```
multipart/form-data
  input_type = image   (or pdf)
  file       = <your file>
```
