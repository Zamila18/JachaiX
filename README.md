<div align="center">

# JachaiX

### Bilingual, evidence-first misinformation verification for Bangla & English

Submit a claim as **text, image, PDF, or URL** — JachaiX retrieves real evidence, runs a
multi-model consensus, and returns a **verdict with confidence, an explanation, and clickable sources.**

[**Live App**](https://jachai-x.vercel.app) · [Fact-Check Hub](https://jachai-x.vercel.app/facts) · [Documentation](https://jachai-x.vercel.app/docs)

`Next.js` · `Laravel` · `MySQL` · `Redis` · `Qdrant` · `Python AI services` · `Docker`

</div>

---

## Overview

Misinformation — deepfakes, fabricated screenshots, out-of-context media — spreads faster than
newsrooms can debunk it, and almost every automated tool is **English-only**. JachaiX is an
**evidence-first, Bangla-first** verification engine that makes fact-checking fast, transparent,
and source-grounded.

Every verdict is backed by retrieved evidence, scored by a **pool of independent LLMs that must
agree**, and — when evidence is weak — conservatively returned as *Unverified* and escalated for
human review.

## Key Features

- 🔎 **Multi-modal claims** — verify text, images/screenshots (OCR), PDFs, and URLs.
- 🌐 **Bilingual (Bangla + English)** — first-class support for a 200M+ speaker market.
- 🧠 **Hybrid Retrieval-Augmented Generation** — dense vector search (Qdrant) fused with BM25
  keyword search, then re-ranked by a cross-encoder.
- 🤝 **Multi-provider LLM consensus** — Groq, OpenRouter, Cerebras, and Hugging Face vote on a
  verdict, so no single model can bias or hallucinate the result.
- 🔁 **Self-learning knowledge base** — a nightly crawler ingests trusted outlets; an Auto-RAG web
  fallback fetches fresh evidence when the local KB lacks coverage.
- 🧾 **Transparent results** — verdict, confidence score, trust label, plain-language explanation,
  and source links on every claim.
- 👤 **User platform** — JWT auth, dashboards, claim history, bookmarks, saved searches, and notifications.
- 🛠️ **MCP server** — external AI agents can call JachaiX as a verification tool.

## Architecture

```
Browser ──► Next.js Frontend (Vercel) ──/api/v1/* proxy──► Laravel API (Nginx)
                                                              │
                                              Redis Queue ──► Worker (ProcessAnalysisJob) + Scheduler
                                                              │
        ┌───────────────────────────────────────────────────┴───────────────────────────┐
        │  OCR (EasyOCR)   Embedder (Jina v3, 1024d)   Reranker (BGE cross-encoder)        │
        │  MySQL (claims + BM25)   Qdrant (vector KB)   LLM Pool (Groq/OpenRouter/…)        │
        │  KB Crawler + Chunker (nightly)   Auto-RAG web fallback (GNews + Wikipedia)       │
        └───────────────────────────────────────────────────────────────────────────────┘
```

**Verification flow:** `Input → OCR + normalize → query expansion (HyDE / Banglish) → hybrid retrieval
→ cross-encoder rerank → multi-LLM consensus → trust scoring → verdict + sources` (low-confidence → human review).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, bilingual i18n |
| Backend | Laravel (PHP 8.3), Nginx + PHP-FPM, Supervisor (queue + scheduler) |
| Datastores | MySQL 8 (claims + BM25), Redis (queue/cache), Qdrant (vectors) |
| AI services | OCR (EasyOCR), Embedder (Jina v3 API), Reranker (BGE cross-encoder, FlagEmbedding) |
| LLMs | Multi-provider pool — Groq, OpenRouter, Cerebras, Hugging Face |
| Auth | JWT (`php-open-source-saver/jwt-auth`), role-based middleware |
| Infra | Docker Compose; frontend on Vercel, backend on a Linux VPS |

## Getting Started (local)

> Requires **Docker Desktop**, **Node.js 18+**, and **Git**.

```bash
git clone https://github.com/Zamila18/JachaiX.git
cd JachaiX

# 1. Backend + services (create backend/.env and root .env first — see .env.example)
docker compose up -d --build
docker exec jachaix-app-1 composer install
docker exec jachaix-app-1 php artisan key:generate
docker exec jachaix-app-1 php artisan jwt:secret --force
docker exec jachaix-app-1 php artisan migrate --force

# 2. Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000
```

The knowledge base **auto-bootstraps** on first run (the `kb-worker` crawls + chunks when the KB is
empty) and refreshes nightly. Backend API is served at `http://localhost:8080`.

### Required environment

Secrets live only in gitignored env files (`.env.example` holds placeholders):

- **Root `.env`** — `MYSQL_*`, `JINA_API_KEY`, `GNEWS_API_KEY`
- **`backend/.env`** — `APP_KEY`, `JWT_SECRET`, DB/Redis/Qdrant config, LLM provider keys
  (`GROQ_API_KEY`, `OPENROUTER_API_KEY`, `CEREBRAS_API_KEY`, `HUGGINGFACE_API_KEY`), and `ADMIN_*` accounts

## API (selected)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/analyze/text` · `/image` · `/pdf` · `/url` | Submit a claim |
| `GET` | `/api/v1/claims/{id}/status` · `/result` | Poll status / fetch verdict |
| `GET` | `/api/v1/public/fact-checks` | Public fact-check hub |
| `POST` | `/api/v1/auth/register` · `/login` | Authentication |

## Team — Musketeers

| Member | Role |
|---|---|
| **Zamila Mohammad** (Leader) | Presentation / Communication Lead · Business Analyst / Data Scientist |
| **Samanta Islam** | Backend / Database / Scraper Engineer · UI/UX / Frontend Developer |
| **Humayra Binte Kazal** | Backend / Database / Scraper Engineer · Team Leader / Project Coordinator |
| **Asmita Guha Thakurta** | UI/UX / Frontend Developer · Backend / Database / Scraper Engineer |

---

<div align="center">
<sub>JachaiX — making evidence-based truth as fast to access as the misinformation it answers.</sub>
</div>
