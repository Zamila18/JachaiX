# JachaiX — Project Context File
> Attach this to every Copilot conversation

## What JachaiX Is
A Bangla-first multimodal FAKE NEWS / MISINFORMATION detection system.
Users upload text, image, or PDF → JachaiX returns a trust report.

## Hackathon
- Event: Infinity AI BuildFest 2026
- Team: Musketeers
- Deadline: May 30, 2026 11:59 PM GMT+6
- Phase: Preliminary Submission

## The User Promise
User submits → suspicious Bangla text / screenshot / PDF
JachaiX returns →
  - Extracted claim
  - Evidence from trusted sources
  - Trust score (0-100)
  - Verdict: true / false / misleading / unverified
  - Explanation in Bangla/English
  - Human review flag if needed

## Stack
| Layer | Technology |
|-------|-----------|
| Backend / Orchestrator | Laravel (PHP) |
| Database | MySQL |
| Vector DB | Qdrant (port 6333) |
| Cache / Queue | Redis |
| OCR Service | Python FastAPI (port 5001) |
| Embedder Service | Python FastAPI (port 5002) |
| Reranker Service | Python FastAPI (port 5003) |
| LLM | OpenAI GPT-4o-mini |
| Frontend | Not built yet |
| Container | Docker Compose |

## Current Build Status
- [x] Day 1 — Architecture locked
- [x] Day 2 — Laravel skeleton + OCR service built
- [ ] Day 3 — Local testing + push (IN PROGRESS)
- [ ] Day 4 — Knowledge base crawler (Bangla news)
- [ ] Day 5 — Prompt engineering + full pipeline test
- [ ] Day 6 — Trust score + final report
- [ ] Day 7 — Frontend + MCP server
- [ ] Day 8 — Video + submit

## Supported Input Types (MVP Scope)
- [x] Text
- [x] Image (OCR via PaddleOCR)
- [x] PDF (PyMuPDF + OCR fallback)
- [ ] Audio — SKIPPED for prelim
- [ ] Video — SKIPPED for prelim
- [ ] URL — after prelim if time allows

## Pipeline Flow (ProcessAnalysisJob.php)
1. Input received (text / image / pdf)
2. OCR if image or pdf → extracted_text
3. Claim extraction (OpenAI) → claim_text
4. Embed claim → search Qdrant → top 10 evidence
5. Rerank evidence → top 5
6. LLM verdict (OpenAI) → verdict + explanation + sources
7. Save trust report to DB

## Service URLs (Docker internal)
- OCR:      http://ocr-service:5001
- Embedder: http://embedder-service:5002
- Reranker: http://reranker-service:5003
- Qdrant:   http://qdrant:6333

## API Routes
- GET  /api/v1/health
- POST /api/v1/claims         (submit text/image/pdf)
- GET  /api/v1/claims/{id}/status
- GET  /api/v1/claims/{id}/result

## Key Files
- backend/app/Jobs/ProcessAnalysisJob.php  ← main pipeline
- backend/app/Http/Controllers/ClaimController.php
- backend/config/jachaix.php               ← service config
- services/ocr-service/                    ← port 5001
- services/embedder-service/               ← port 5002
- services/reranker-service/               ← port 5003
- docker-compose.yml

## What Still Needs to Be Built
1. Knowledge base crawler (Prothom Alo, Daily Star BD etc)
2. Chunking + embedding pipeline (store in Qdrant)
3. Frontend (upload UI + trust report page + /docs page)
4. MCP server (services/mcp-server) — 20 pts in submission
5. Trust score weighted formula
6. Test set of 20-30 Bangla claims

## Human Review Triggers
- OCR confidence < 60%
- Trust score between 40-60
- No evidence found in knowledge base
- LLM confidence low
- Contradictory sources

## Goals After Project Complete
1. Add MCP server
2. Fill submission form
3. Record demo video
4. Submit before deadline