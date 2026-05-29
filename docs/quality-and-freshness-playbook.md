# Quality + Freshness Playbook

## 1) Continuous KB Freshness

### Fast start (local/VM)
Run this once and keep it alive:

```powershell
powershell -ExecutionPolicy Bypass -File E:\jachaix\scripts\run_refresh_daemon.ps1 -IntervalMinutes 30
```

### What it does
- Runs incremental source seeding via `scripts/refresh_knowledge_base.ps1`
- Re-chunks and upserts recent raw files into Qdrant
- Updates freshness manifest at `backend/storage/app/knowledge_base_refresh.json`

### Targets
- Refresh interval: 15-60 minutes
- Freshness SLA: 95% of top sources ingested within 60 minutes

## 2) Multilingual Normalization (Bangla/English/Banglish)

Implemented in `backend/app/Jobs/ProcessAnalysisJob.php`:
- Banglish query expansion to Bangla + English variants
- LLM-assisted Banglish paraphrases for retrieval
- Canonical fact checks for baseline truth families (capital, currency, independence)
- Numeric/polarity contradiction checks for precision-critical misinformation

### Targets
- Banglish baseline control pass rate: >= 95% on curated set
- False-class precision floor on multilingual benchmark: >= 0.70

## 3) Deployment Blocking Quality Gate

### Local gate run
```powershell
powershell -ExecutionPolicy Bypass -File E:\jachaix\scripts\run_regression_suite.ps1 `
  -PythonExe E:/Python310/python.exe `
  -BaseUrl http://127.0.0.1:8080/api/v1 `
  -FalsePrecisionFloor 0.75 `
  -MultilingualFalsePrecisionFloor 0.70 `
  -MacroF1Floor 0.45
```

### CI gate
- Workflow: `.github/workflows/quality-gate.yml`
- Blocks deployment when any floor is missed

## 4) Concrete Floors to Enforce

- Human benchmark false precision: >= 0.75
- Multilingual benchmark false precision: >= 0.70
- Macro F1 (both reports): >= 0.45
- If evidence relevance is weak: default to `unverified`

## 5) Fastest Implementation Path

1. Start daemon refresh (`run_refresh_daemon.ps1`) on your always-on host.
2. Run regression suite once and tune floors based on baseline.
3. Enable GitHub Action gate and require it for merge.
4. Expand Banglish dictionary weekly from failed real claims.
5. Keep authoritative sources weighted higher than noisy sources.
