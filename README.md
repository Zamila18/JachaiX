# JachaiX

Bangla-first fake-news detection pipeline for text, image, and PDF claims.

## Pipeline

User submits claim -> Laravel API -> ProcessAnalysisJob -> embedder + Qdrant retrieval -> reranker -> verdict generation -> MySQL result -> user result API.

## Who This Guide Is For

This guide is for a teammate who clones the repo and wants to run the full pipeline end-to-end exactly as it works now.

Assumption: Docker, PHP, and Git are already installed.

## 1) Clone and Enter Project

```powershell
git clone https://github.com/Zamila18/JachaiX.git
cd JachaiX
```

## 2) Create Environment Files

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
```

Update root `.env`:

```env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=jachaix
MYSQL_USER=jachaix
MYSQL_PASSWORD=your_db_password
```

Update `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=jachaix
DB_USERNAME=jachaix
DB_PASSWORD=your_db_password

QUEUE_CONNECTION=database

OPENAI_API_KEY=ollama
OPENAI_MODEL=llama3.2
OPENAI_BASE_URL=http://host.docker.internal:11434/v1
```

## 3) Start All Containers

```powershell
docker compose up -d --build
docker ps
```

Expected running services include: `nginx`, `app`, `mysql`, `redis`, `qdrant`, `ocr-service`, `embedder-service`, `reranker-service`.

## 4) Run Laravel Setup Once

```powershell
docker exec jachaix-app-1 php artisan key:generate
docker exec jachaix-app-1 php artisan migrate --force
```

If container name differs, get it from:

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 5) Start Queue Worker (Required)

Run this in a separate terminal and keep it running:

```powershell
docker exec -it jachaix-app-1 php artisan queue:work --tries=3 --timeout=900
```

For faster throughput, run multiple workers in separate terminals:

```powershell
docker exec -it jachaix-app-1 php artisan queue:work --tries=3 --timeout=900 --sleep=1
docker exec -it jachaix-app-1 php artisan queue:work --tries=3 --timeout=900 --sleep=1
docker exec -it jachaix-app-1 php artisan queue:work --tries=3 --timeout=900 --sleep=1
```

## 5.1) Fast Mode (Demo Latency)

Use these values in `backend/.env` for faster claim turnaround during demos:

```env
OPENAI_MODEL=qwen2:0.5b
OPENAI_CLAIM_MODEL=qwen2:0.5b
OPENAI_QUERY_MODEL=qwen2:0.5b
OPENAI_VERDICT_MODEL=qwen2:0.5b
OPENAI_VERDICT_FAST_MODEL=qwen2:0.5b
OPENAI_VERDICT_STRONG_MODEL=qwen2:0.5b

RETRIEVAL_TOP_K_PER_QUERY=4
RETRIEVAL_MAX_CANDIDATES=6
RETRIEVAL_SIMILARITY_THRESHOLD=0.45

VERDICT_FAST_MODEL_TIMEOUT=8
VERDICT_STRONG_MODEL_TIMEOUT=12
VERDICT_ENABLE_STRONG_MODEL=false
```

After editing `backend/.env`, restart app and workers:

```powershell
docker compose restart app
```

## 6) Refresh Knowledge Base and Chunk Index

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\refresh_knowledge_base.ps1
```

This seeds/crawls raw corpus, chunks documents, embeds chunks, and upserts into Qdrant.

## 7) Verify Service Health

```powershell
curl http://127.0.0.1:8080/api/v1/health
curl http://127.0.0.1:5001/health
curl http://127.0.0.1:5002/health
curl http://127.0.0.1:5003/health
curl http://127.0.0.1:8080/api/v1/knowledge-base/status
```

All should return `200` and JSON with `status: ok` (or `knowledge_base.status: fresh`).

## 8) Full E2E Test (Automated)

```powershell
E:/Python310/python.exe .\scripts\hackathon_readiness_check.py --base-url http://127.0.0.1:8080/api/v1 --output .\scripts\hackathon_readiness_report.json --max-wait 35
E:/Python310/python.exe .\scripts\demo_run_3min.py --base-url http://127.0.0.1:8080/api/v1 --input .\scripts\benchmark_demo_3min.json --output .\scripts\demo_3min_report.json --max-wait 35 --poll-interval 1.5
```

Open reports:

```powershell
Get-Content .\scripts\hackathon_readiness_report.json
Get-Content .\scripts\demo_3min_report.json
```

## 9) Manual Claim Test (Single Claim)

Submit claim:

```powershell
$resp = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8080/api/v1/analyze/text" -ContentType "application/json" -Body '{"text":"WHO says COVID-19 vaccines do not contain microchips.","language":"international"}'
$claimId = $resp.claim_id
$claimId
```

Poll status:

```powershell
do {
  Start-Sleep -Seconds 2
  $s = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8080/api/v1/claims/$claimId/status"
  $s.claim.status
} while ($s.claim.status -notin @("completed", "failed"))
```

Get result:

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8080/api/v1/claims/$claimId/result" | ConvertTo-Json -Depth 8
```

## 10) Teardown

```powershell
docker compose down
```

If you want to remove volumes too:

```powershell
docker compose down -v
```

## Common Issues

- `queue worker not running`: claims remain pending/processing forever. Start step 5.
- `DB auth errors`: `MYSQL_PASSWORD` in root `.env` must match `DB_PASSWORD` in `backend/.env`.
- `slow first run`: model downloads and initial corpus ingestion can take significant time.
- `host.docker.internal LLM access`: ensure Ollama is running on host if using local LLM endpoint.

## Minimal API Surface Used By Frontend

- `POST /api/v1/analyze/text`
- `POST /api/v1/analyze/image`
- `POST /api/v1/analyze/pdf`
- `GET /api/v1/claims/{id}/status`
- `GET /api/v1/claims/{id}/result`
- `POST /api/v1/claims/{id}/review-request`

## 11) Frontend Run Guide

Current frontend state in this repo:

- Text claim flow is fully connected to backend.
- URL, image, audio, and video are visible as future roadmap only and are intentionally not connected yet.

Run frontend locally:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:3000
```

Optional proxy target override (if backend host differs):

```powershell
$env:NEXT_PUBLIC_API_PROXY_TARGET = "http://127.0.0.1:8080"
npm.cmd run dev
```

## 12) MCP Servers (Model Context Protocol)

JachaiX now includes three MCP servers:

- `services/mcp-server` (Fact Checker tools)
- `services/mcp-ops-server` (Ops + monitoring tools)
- `services/mcp-docs-server` (Docs/publication tools)

Start them with Docker Compose:

```powershell
docker compose up -d --build mcp-server mcp-ops-server mcp-docs-server
```

Detailed tool inventory and integration notes:

- `docs/mcp-servers.md`
