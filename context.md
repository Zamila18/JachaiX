# JachaiX — Project Context File
> Attach this to EVERY new Copilot conversation

## What JachaiX Is
A Bangla-first multimodal FAKE NEWS / MISINFORMATION detection system.
Users upload text, image, or PDF → JachaiX returns a full trust report.

## Hackathon
- Event: Infinity AI BuildFest 2026
- Team: Musketeers
- Deadline: May 30, 2026 11:59 PM GMT+6
- Phase: Preliminary Submission
- Repo: https://github.com/Zamila18/JachaiX

## The User Promise
User submits → suspicious Bangla text / screenshot / PDF
JachaiX returns →
  - Extracted claim (clean verifiable sentence)
  - Evidence from trusted Bangla news sources
  - Trust score (0-100)
  - Verdict: true / false / misleading / unverified
  - Explanation in Bangla/English
  - Human review flag if needed

## Scope for Prelim
- [x] Text input
- [x] Image input (OCR via PaddleOCR)
- [x] PDF input (PyMuPDF + OCR fallback)
- [ ] Audio — SKIPPED
- [ ] Video — SKIPPED
- [ ] URL — after prelim if time allows

## Stack
| Layer | Technology |
|-------|-----------|
| Backend / Orchestrator | Laravel (PHP) |
| Database | MySQL 8.0 |
| Vector DB | Qdrant (port 6333) |
| Cache / Queue | Redis 7 |
| OCR Service | Python FastAPI (port 5001) — PaddleOCR |
| Embedder Service | Python FastAPI (port 5002) — paraphrase-multilingual-mpnet-base-v2 |
| Reranker Service | Python FastAPI (port 5003) — mmarco-mMiniLMv2-L12-H384-v1 |
| LLM | Ollama (llama3.2) — local, no API cost |
| Frontend | Not built yet |
| Container | Docker Compose |

## LLM Setup (Ollama — NOT OpenAI)
- Ollama runs locally on Windows host
- Model: llama3.2
- Laravel reaches it via: http://host.docker.internal:11434/v1
- backend/.env:
    OPENAI_API_KEY=ollama
    OPENAI_MODEL=llama3.2
    OPENAI_BASE_URL=http://host.docker.internal:11434/v1

## Pipeline Flow (ProcessAnalysisJob.php)
1. Input received (text / image / pdf)
2. OCR if image/pdf → extracted_text
3. Claim extraction (Ollama) → claim_text (clean verifiable sentence)
4. Embed claim → search Qdrant → top 10 evidence chunks
5. Rerank evidence → top 5
6. LLM verdict (Ollama) → verdict + confidence + explanation + sources
7. Save trust report to DB → status: completed

## Service URLs
- Docker internal:
  OCR:      http://ocr-service:5001
  Embedder: http://embedder-service:5002
  Reranker: http://reranker-service:5003
  Qdrant:   http://qdrant:6333
- Host (for local testing):
  OCR:      http://localhost:5001
  Embedder: http://localhost:5002
  Reranker: http://localhost:5003
  Qdrant:   http://localhost:6333
  Laravel:  http://localhost:8080

## API Routes
- GET  /api/v1/health
- POST /api/v1/claims          (submit text/image/pdf)
- GET  /api/v1/claims/{id}/status
- GET  /api/v1/claims/{id}/result

## Key Files
- backend/app/Jobs/ProcessAnalysisJob.php       ← main pipeline (5 steps)
- backend/app/Http/Controllers/ClaimController.php
- backend/config/jachaix.php                    ← all service configs
- services/ocr-service/                         ← port 5001 ✅
- services/embedder-service/                    ← port 5002 ✅
- services/reranker-service/                    ← port 5003 ✅
- docker-compose.yml                            ← all 8 services

## Database Tables (all migrated)
- users, claims, evidences, analysis_jobs
- knowledge_base, audit_logs, cache, jobs

## Current Build Status
- [x] Day 1 — Architecture locked
- [x] Day 2 — Laravel skeleton + OCR service
- [x] Day 3 — All services built & tested locally
  - OCR ✅, Embedder ✅, Reranker ✅
  - Laravel API ✅, DB migrations ✅
  - docker-compose fixed ✅
- [ ] Day 4/5 — Ollama setup + queue worker + knowledge base (IN PROGRESS)
- [ ] Day 6 — Trust score formula + 15 claim tests
- [ ] Day 7 — Frontend + MCP server
- [ ] Day 8 — Video + submit

## What Still Needs Building
1. Ollama installed + pipeline switched from OpenAI → Ollama
2. Missing Python files filled (embedder/reranker routes & services)
3. Queue worker running (php artisan queue:work)
4. Knowledge base crawler (Prothom Alo, Daily Star BD)
5. Chunking + embedding into Qdrant
6. Trust score formula (0-100 weighted)
7. Frontend (upload + result + /docs pages)
8. MCP server (20 pts in submission)
9. Test set of 20-30 Bangla claims

## Human Review Triggers
- OCR confidence < 60%
- Trust score between 40-60
- No evidence found in Qdrant
- LLM confidence low
- Contradictory sources

## Submission Goals
1. Complete pipeline working end-to-end
2. Add MCP server (20 pts)
3. Fill submission form
4. Record demo video
5. Submit before May 30 11:59 PM GMT+6 