# 3-Minute Demo Runbook (Frontend + Full E2E Pipeline)

## Goal
Show that JachaiX works end-to-end in real time and is production-grade enough for hackathon judging.

## Crawler hardening (important)
- Crawling is no longer notebook-only for operations.
- Automated crawler runner: `scripts/crawl_refresh.py`
- Refresh pipeline now invokes crawler automatically unless `-SkipCrawler` is used.
- Crawler status artifact: `backend/storage/app/crawler_refresh.json`

## One-command readiness + demo run
Run this before recording:

```powershell
powershell -ExecutionPolicy Bypass -File E:/jachaix/scripts/run_hackathon_ready.ps1
```

This generates:
- `scripts/hackathon_readiness_report.json`
- `scripts/demo_3min_report.json`
- `backend/storage/app/crawler_refresh.json`

## 3-minute video timeline

### 0:00-0:25 Architecture snapshot
- Frontend submits claim text/image.
- Backend queues job.
- OCR/normalization/retrieval/rerank/verdict/trust score.
- Result API returns verdict, confidence, explanation, sources.

### 0:25-1:20 Live frontend flow
- Submit one Banglish claim and one international claim from UI.
- Show status progression: pending -> processing -> completed.
- Open result panel showing verdict + confidence + sources.

### 1:20-2:10 Pipeline proof (terminal)
- Open `scripts/hackathon_readiness_report.json` and show all checks pass.
- Open `scripts/demo_3min_report.json` and show:
  - samples scored
  - accuracy
  - per-claim latency
  - total wall time under ~3 minutes

### 2:10-3:00 Judge close
- Explain why this is strong now:
  - multilingual/Banglish handling
  - conservative evidence-grounded verdicting
  - quality gate scripts for stricter CI checks
  - clear path to scale with more benchmark data + frontend polish

## Judge talking points (short)
- "This is not a toy classifier; it is a full claim-verification pipeline with explainable sources."
- "We already run readiness checks and a 3-minute E2E validation before demos."
- "The architecture is hackathon-ready today and extensible for production hardening."

## If a claim is slow during live demo
- Use the 4-claim demo suite first (`demo_3min_report.json`) as proof.
- Then run one live claim in UI while narrating previous measured latency.
- Keep `WHO microchip` and `Illinois explosion` claims as stable demo controls.
