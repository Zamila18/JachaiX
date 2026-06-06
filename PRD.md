# Product Requirements Document — JachaiX

**Version:** 1.0  
**Date:** 2026-06-05  
**Author:** Nasim Zamila (nasimzam@ualberta.ca)  
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary

JachaiX is a Bangla-first, AI-powered fake news detection and fact-checking platform. It accepts claims in text, image, or PDF format, retrieves relevant evidence from a curated knowledge base of trusted news sources, and produces a structured verdict with a confidence score and source citations. The platform is purpose-built for Bangladesh and South Asian content but handles international claims as well.

### 1.2 Problem Statement

Misinformation spreads rapidly in Bangladesh via social media, messaging apps, and news aggregators. Existing fact-checking tools are predominantly English-only, leaving Bangla, Banglish (romanized Bangla), and mixed-language content largely unchecked. Manual fact-checking by journalists is too slow to match the velocity of viral content. There is no accessible, automated, multilingual fact-checking service optimized for the region.

### 1.3 Solution

A multi-modal RAG (Retrieval-Augmented Generation) pipeline that:

1. Accepts claims in text, image, or PDF via a web interface or API.
2. Detects and normalizes language (Bangla / English / Banglish / mixed).
3. Retrieves semantically relevant evidence from a continuously refreshed knowledge base.
4. Reranks evidence with a cross-encoder and runs LLM inference to generate a verdict.
5. Calibrates confidence using heuristic quality gates and a trust scoring model.
6. Publishes verified fact-checks to a public hub with SEO-friendly URLs.

### 1.4 Target Audience

| Persona | Need |
|---|---|
| Everyday citizen (Bangladesh) | Quickly verify a viral WhatsApp/Facebook claim |
| Journalist / editor | Accelerate pre-publication fact verification |
| Researcher | Audit-logged, evidence-grounded verdicts with source links |
| Platform integrator | REST API or MCP server to embed fact-checking in a product |
| Site administrator | Manage published fact-checks and documentation pages |

---

## 2. Goals and Non-Goals

### 2.1 Goals

- **G1** Deliver a verdict for any text claim within 30 seconds end-to-end (SLA).
- **G2** Support all three input modalities: plain text, image (with OCR), and PDF.
- **G3** Handle Bangla, English, Banglish, and mixed-language claims natively.
- **G4** Retrieve evidence from a continuously refreshed knowledge base sourced from credible international and Bangladeshi outlets.
- **G5** Expose a public fact-check hub for browsable, published verdicts.
- **G6** Provide a REST API and MCP server interface for programmatic access.
- **G7** Surface human-review workflows for low-confidence verdicts.
- **G8** Maintain complete audit logs for every claim from submission to verdict.

### 2.2 Non-Goals

- Real-time video or audio fact-checking.
- User account management, registration, or social features.
- Fine-tuning or training the underlying LLM models.
- Manual journalist workflow tooling (JachaiX automates; human review is a fallback, not the primary path).
- Direct social media integration or browser extension (out of scope for v1).

---

## 3. System Architecture

### 3.1 High-Level Components

```
User / API Client
       │
       ▼
[Next.js 14 Frontend]  ←────→  [Laravel 13 Backend]
                                     │   │   │
                         ┌───────────┘   │   └─────────────────┐
                         ▼              ▼                       ▼
               [OCR Service]   [Embedder Service]   [Reranker Service]
               (EasyOCR)       (Sentence-Transformers  (Cross-Encoder
               port 5001        + Qdrant) port 5002     port 5003)
                                         │
                                         ▼
                                  [Qdrant Vector DB]
                                  (port 6333)
                         ┌────────────────────────────┐
                         │     MCP Servers (3x)       │
                         │  fact-check / ops / docs   │
                         │  ports 5004 / 5005 / 5006  │
                         └────────────────────────────┘
[MySQL 8]  [Redis 7]
(claims,   (queue,
 evidence,  cache)
 audit)
                ▲
                │
       [Corpus Pipeline]
       Crawler → Chunker → Embedder → Qdrant
```

### 3.2 Service Inventory

| Service | Language | Port | Responsibility |
|---|---|---|---|
| Frontend | Next.js / TypeScript | 3000 | Web UI (scan, hub, docs, admin) |
| Backend | PHP / Laravel | 80 (Nginx → 8080) | API, pipeline orchestration, business logic |
| OCR Service | Python / FastAPI | 5001 | Image & PDF text extraction (EasyOCR) |
| Embedder Service | Python / FastAPI | 5002 | Sentence-Transformer embeddings + Qdrant search |
| Reranker Service | Python / FastAPI | 5003 | Cross-encoder reranking of candidate evidence |
| MCP Fact-Check Server | Python | 5004 | LLM tool: check_claim(), search_evidence() |
| MCP Ops Server | Python | 5005 | LLM tool: health_check(), kb_status(), claim_result() |
| MCP Docs Server | Python | 5006 | LLM tool: get_docs(), set_visibility(), set_schedule() |
| MySQL | SQL | 3306 | Persistent relational data |
| Redis | In-memory | 6379 | Job queue + search/rerank cache |
| Qdrant | Vector DB | 6333 | Semantic similarity index |
| Nginx | Proxy | 8080 | Reverse proxy to backend + static assets |

---

## 4. User Flows

### 4.1 Claim Submission (Text)

1. User navigates to `/scan` → selects "Text" tab.
2. User types or pastes a claim (Bangla, English, or Banglish).
3. Optionally selects language hint (auto-detect / Bangla / English / Banglish).
4. Submits → backend returns `claim_id` immediately (async).
5. Frontend polls `GET /claims/{id}/status` with exponential backoff.
6. On `verdict_ready`, frontend fetches `GET /claims/{id}/result`.
7. Result page displays: verdict label, confidence score, trust label, explanation, and source cards.
8. If verdict is weak/uncertain, user sees a "Request Human Review" button.

### 4.2 Claim Submission (Image)

Same as 4.1 except step 2: user uploads an image file. OCR service extracts text before the analysis pipeline begins. Extraction confidence is shown alongside the final verdict.

### 4.3 Claim Submission (PDF)

Same as 4.2. PDF text extraction uses direct parse first; falls back to OCR page-by-page.

### 4.4 Public Fact-Check Hub

1. User visits `/facts` (the Fact Check Hub).
2. Browsable list of published, editor-approved fact-checks.
3. Filter by verdict, language, date.
4. Each fact-check has a slug URL (e.g., `/facts/dhaka-flood-2025-claim`).
5. Featured fact-checks appear highlighted.

### 4.5 Admin Workflow

1. Admin visits `/admin`.
2. Reviews completed claims from the queue.
3. Publishes a claim verdict as a public fact-check (adds title, slug, optional editorial note).
4. Manages documentation pages (create, schedule visibility windows, toggle public/private).

### 4.6 API / MCP Access (Integrators)

- REST: `POST /api/analyze/text` with claim body → poll status → fetch result.
- MCP: call `check_claim(claim_text)` tool from any MCP-compatible LLM client.
- Ops monitoring: `health_check()`, `knowledge_base_status()` via MCP ops server.

---

## 5. Feature Requirements

### 5.1 Claim Analysis Pipeline

| ID | Requirement | Priority |
|---|---|---|
| F-01 | Accept plain text claims up to 2,000 characters | P0 |
| F-02 | Accept image uploads (JPEG, PNG, WebP); extract text via EasyOCR | P0 |
| F-03 | Accept PDF uploads; extract text via direct parse + OCR fallback | P0 |
| F-04 | Auto-detect claim language: Bangla, English, Banglish, mixed, international | P0 |
| F-05 | Rewrite queries into 2 semantic variants for higher recall | P1 |
| F-06 | Expand queries with Banglish↔Bangla and Banglish↔English transliterations | P1 |
| F-07 | Retrieve top-K semantically similar evidence chunks from Qdrant | P0 |
| F-08 | Filter evidence by language, source reliability tier, and recency | P1 |
| F-09 | Rerank evidence with a cross-encoder model | P1 |
| F-10 | Generate verdict (TRUE / FALSE / UNVERIFIED / MISLEADING) via LLM | P0 |
| F-11 | Escalate to a stronger LLM model if fast model confidence is below threshold | P1 |
| F-12 | Calibrate LLM verdict against evidence using heuristic quality gates | P1 |
| F-13 | Compute trust score and label (Trustworthy / Uncertain / Suspicious) | P0 |
| F-14 | Return structured result: verdict, confidence, explanation, sources, trust breakdown | P0 |
| F-15 | Complete the full pipeline within 30-second SLA | P0 |
| F-16 | Cache search and rerank results in Redis (15-minute TTL) | P1 |
| F-17 | Apply canonical shortcuts for well-known facts to skip unnecessary LLM calls | P2 |

### 5.2 Frontend

| ID | Requirement | Priority |
|---|---|---|
| F-18 | Scan page with three modality tabs: text, image, PDF | P0 |
| F-19 | Real-time status polling with progress indicator | P0 |
| F-20 | Result display: verdict badge, confidence meter, explanation, source cards | P0 |
| F-21 | Bilingual UI — Bangla and English toggle, all labels localized | P0 |
| F-22 | "Request Human Review" button visible on uncertain/suspicious verdicts | P1 |
| F-23 | Fact Check Hub: paginated, filterable list of public fact-checks | P1 |
| F-24 | SEO-friendly slug-based URLs for each published fact-check | P1 |
| F-25 | Admin panel: publish claim as fact-check, manage docs pages | P1 |
| F-26 | Docs page: render public documentation with scheduled visibility | P2 |

### 5.3 Knowledge Base

| ID | Requirement | Priority |
|---|---|---|
| F-27 | Crawl trusted sources: Reuters, AP, BBC, WHO, UN News, local Bangla outlets | P0 |
| F-28 | Chunk articles into semantic units before embedding | P0 |
| F-29 | Embed chunks with Sentence-Transformers and upsert to Qdrant | P0 |
| F-30 | Support incremental refresh (crawl → chunk → embed → upsert) via script | P0 |
| F-31 | Track knowledge base refresh status (timestamp, article count) | P1 |
| F-32 | Assign credibility tiers to sources (tier-1: major wire services; tier-2: regional trusted) | P1 |

### 5.4 API & Integration

| ID | Requirement | Priority |
|---|---|---|
| F-33 | `POST /api/analyze/text` — submit text claim, return claim_id | P0 |
| F-34 | `POST /api/analyze/image` — submit image, return claim_id | P0 |
| F-35 | `POST /api/analyze/pdf` — submit PDF, return claim_id | P0 |
| F-36 | `GET /api/claims/{id}/status` — poll analysis progress | P0 |
| F-37 | `GET /api/claims/{id}/result` — fetch final verdict + evidence | P0 |
| F-38 | `POST /api/claims/{id}/review-request` — flag for human review | P1 |
| F-39 | Public fact-checks REST CRUD | P1 |
| F-40 | Docs pages REST CRUD with visibility scheduling | P2 |
| F-41 | MCP fact-check tools: check_claim(), search_evidence() | P1 |
| F-42 | MCP ops tools: health_check(), kb_status(), claim_status(), claim_result() | P1 |
| F-43 | MCP docs tools: get_docs(), set_visibility(), set_schedule() | P2 |

### 5.5 Observability & Operations

| ID | Requirement | Priority |
|---|---|---|
| F-44 | Write audit log entry at each pipeline stage per claim | P0 |
| F-45 | Capture IP address and timestamp on claim submission | P1 |
| F-46 | Expose health check endpoints for all microservices | P1 |
| F-47 | Persist knowledge base refresh metadata for ops monitoring | P1 |
| F-48 | Graceful fallback verdict if pipeline times out or a service is unavailable | P0 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Target |
|---|---|
| End-to-end claim analysis latency (P95) | ≤ 30 seconds |
| API response for claim submission | < 500 ms |
| Status poll response | < 200 ms |
| Semantic search (Qdrant query) | < 1 second |
| Cache hit rate for repeated queries | > 40% |

### 6.2 Scalability

- All services are containerized and independently scalable via Docker Compose or Kubernetes.
- Laravel job queue (Redis-backed) allows horizontal worker scaling.
- Qdrant supports distributed deployment for large vector indices.

### 6.3 Reliability

- Redis queue ensures no claim is lost during service restarts.
- Pipeline has a 30-second SLA with a timeout-triggered fallback verdict.
- Nginx acts as a reverse proxy with buffering to absorb request spikes.

### 6.4 Accuracy

| Signal | Target |
|---|---|
| Verdict precision on verifiable claims | ≥ 80% (against labeled test set) |
| False-positive rate (TRUE → FALSE) | ≤ 5% |
| UNVERIFIED rate for edge-case claims | < 20% of all claims |

### 6.5 Security

- No user PII stored beyond IP address in audit logs.
- File uploads stored server-side with no public URL exposure.
- API endpoints do not require authentication for v1 (rate limiting expected in v2).
- LLM API key stored only in environment variables, never in code.

### 6.6 Accessibility and Localization

- Full UI available in Bangla and English.
- All verdict labels, error messages, and instructions bilingual.
- Right-to-left rendering not required (Bangla script is left-to-right).

---

## 7. Data Model Summary

### 7.1 Database Tables (MySQL)

| Table | Key Fields |
|---|---|
| `claims` | id, input_type, raw_input, file_path, language, status, verdict, confidence_score, trust_label, trust_breakdown (JSON), sources (JSON), explanation, timestamps |
| `evidence` | id, claim_id, source_url, source_name, snippet, relevance_score, credibility_tier |
| `analysis_jobs` | id, claim_id, status, logs, timestamps |
| `knowledge_base` | id, title, content, source_url, language, credibility_tier, qdrant_id, tags |
| `audit_logs` | id, claim_id, event, metadata (JSON), ip_address, timestamps |
| `public_fact_checks` | id, claim_id, title, slug, verdict, explanation, published_at, featured |
| `docs_pages` | id, title, body, is_public, visibility_enabled, available_from, available_until |

### 7.2 Vector Store (Qdrant)

- **Collection:** `knowledge_base`
- **Vectors:** 384-dimensional embeddings (Sentence-Transformers)
- **Payload filters:** language, credibility_tier, source_url, published_at

### 7.3 Cache Keys (Redis)

- `kb:search:{hash}` — Semantic search results (900s TTL)
- `kb:rerank:{hash}` — Reranked results (900s TTL)

---

## 8. Pipeline Configuration

Key tunable parameters (from `backend/config/jachaix.php`):

| Parameter | Default | Purpose |
|---|---|---|
| `retrieval.top_k` | 10 | Candidates retrieved from Qdrant per query |
| `retrieval.similarity_threshold` | 0.62 | Minimum relevance score for evidence inclusion |
| `retrieval.enable_rerank` | true | Toggle cross-encoder reranking |
| `retrieval.cache_ttl` | 900s | Redis cache lifetime for search results |
| `llm.fast_model` | qwen2:0.5b | Model for low-latency first-pass verdict |
| `llm.strong_model` | (configurable) | Model for uncertain/escalated claims |
| `llm.confidence_threshold` | 0.55 | Minimum confidence to skip strong model |
| `llm.max_seconds` | 30 | Total SLA budget |
| `llm.strong_min_remaining` | 8s | Seconds reserved for strong model call |
| `trust.trustworthy_min` | 0.75 | Confidence floor for "Trustworthy" label |
| `trust.uncertain_min` | 0.45 | Confidence floor for "Uncertain" label |
| `trust.suspicious_min` | 0.20 | Confidence floor for "Suspicious" label |

---

## 9. Verdict Schema

Each completed claim result contains:

```json
{
  "id": "uuid",
  "verdict": "TRUE | FALSE | MISLEADING | UNVERIFIED",
  "confidence_score": 0.0–1.0,
  "trust_label": "Trustworthy | Uncertain | Suspicious",
  "trust_breakdown": {
    "evidence_quality": 0.0–1.0,
    "source_credibility": 0.0–1.0,
    "llm_confidence": 0.0–1.0
  },
  "explanation": "Human-readable explanation in detected claim language",
  "sources": [
    {
      "source_url": "...",
      "source_name": "...",
      "snippet": "...",
      "relevance_score": 0.0–1.0,
      "credibility_tier": 1 | 2
    }
  ],
  "language": "bn | en | banglish | mixed | international",
  "status": "verdict_ready"
}
```

---

## 10. Language Detection Logic

| Detected Language | Criteria |
|---|---|
| **Bangla** | > 30% characters in Unicode block U+0980–U+09FF |
| **Banglish** | Romanized Bangla keywords detected (haam, hoise, mara, ache, etc.) |
| **English** | Default if no Bangla script and no Banglish signals |
| **Mixed** | Bangla script + significant English present |
| **International** | No regional signals; English query targeting global sources |

Banglish claims are expanded into both Bangla and English query variants before evidence retrieval, maximizing recall across the multilingual corpus.

---

## 11. Corpus Sources

### Trusted International (Tier 1)
Reuters, AP News, BBC News, WHO, UN News, AFP

### Trusted Bangladeshi (Tier 1–2)
Prothom Alo, Daily Star, Bdnews24, Bangla Tribune, Channel i, RTV, Somoy TV, Jugantor, Kaler Kantho, BBC Bangla, Voice of America Bangla

Sources are crawled via the Jupyter notebook crawler (`corpus/crawler/crawler.ipynb`) with a 3-day lookback window and a per-source cap to avoid duplication.

---

## 12. Known Limitations (v1)

| Limitation | Notes |
|---|---|
| Knowledge base freshness | Depends on manual or scheduled crawl refresh; not real-time |
| LLM hallucination risk | Heuristic calibration reduces but does not eliminate incorrect verdicts |
| Image quality dependence | Low-resolution or heavily compressed images may produce poor OCR |
| Banglish coverage | Banglish keyword list is hand-curated; novel slang may be missed |
| No authentication | v1 API is public; rate limiting and auth planned for v2 |
| Local LLM dependency | Requires Ollama or compatible endpoint; cloud LLM fallback not wired by default |
| Storage scalability | Uploaded files stored on local filesystem; S3/object storage not implemented |

---

## 13. Open Questions

1. **Crawl scheduling** — Should the knowledge base refresh run on a cron schedule automatically, or remain a manual/ops-triggered process?
2. **Rate limiting** — What request-per-minute limits are appropriate for the public API before v2 auth ships?
3. **Human review workflow** — Who receives the human review request notifications, and what is the expected SLA for human responses?
4. **Stronger LLM model** — What is the intended strong model (GPT-4o, Claude Sonnet, a larger Ollama model)? This affects latency and cost budgets.
5. **Multilingual verdict explanation** — Should the explanation always be in the claim's detected language, or should there be an option for English-only output for API consumers?
6. **Public API authentication** — Bearer token, API key, or OAuth for v2?
7. **File upload limits** — What are the max file size limits for image and PDF uploads?

---

## 14. Milestones

| Milestone | Deliverables |
|---|---|
| **M1 — Core Pipeline** | Text analysis end-to-end: detect language → retrieve → rerank → LLM verdict → store |
| **M2 — Multi-modal Input** | Image OCR and PDF text extraction integrated into pipeline |
| **M3 — Frontend v1** | Scan page (all three tabs), status polling, result display, bilingual UI |
| **M4 — Knowledge Base** | Crawler + chunker + embedder pipeline, initial corpus seeded |
| **M5 — Public Fact-Check Hub** | Admin publish workflow, public hub page, slug URLs |
| **M6 — API & MCP** | REST API documented, MCP servers operational |
| **M7 — Ops & Monitoring** | Audit logs, health checks, KB refresh tracking, human review queue |
| **M8 — Hardening** | Rate limiting, file upload limits, error handling, regression test suite |

---

## 15. Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| Laravel | 13.8 | Backend framework |
| Next.js | 14.2.5 | Frontend framework |
| Sentence-Transformers | 3.0.1 | Embedding model |
| Qdrant | 1.9.1 | Vector database |
| EasyOCR | latest | Text extraction from images/PDFs |
| Redis | 7 | Queue and cache |
| MySQL | 8.0 | Relational persistence |
| Ollama (or compatible) | latest | LLM inference endpoint |
| Docker Compose | v2 | Local and production deployment |

---

*This PRD reflects the current state of the JachaiX codebase as of 2026-06-05. It is intended to document what is built and clarify requirements for ongoing development.