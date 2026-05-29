param(
    [string]$PythonExe = "E:/Python310/python.exe",
    [string]$BaseUrl = "http://127.0.0.1:8080/api/v1"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/6] Starting Docker stack" -ForegroundColor Cyan
docker compose up -d --build

Write-Host "[2/6] Waiting for backend readiness" -ForegroundColor Cyan
$maxChecks = 24
$ok = $false
for ($i = 1; $i -le $maxChecks; $i++) {
    try {
        $h = Invoke-RestMethod "$BaseUrl/health" -Method GET -TimeoutSec 10
        if ($h.status -eq "ok") {
            $ok = $true
            break
        }
    }
    catch {
        Start-Sleep -Seconds 5
    }
}
if (-not $ok) { throw "Backend health check failed after retries." }

Write-Host "[3/6] Seeding corpus and human benchmark" -ForegroundColor Cyan
& $PythonExe "e:/jachaix/scripts/seed_additional_bangla_sources.py"
if ($LASTEXITCODE -ne 0) { throw "Corpus and benchmark seeding failed." }

Write-Host "[4/6] Creating quick benchmark subset" -ForegroundColor Cyan
& $PythonExe -c "import json; d=json.load(open('e:/jachaix/scripts/benchmark_claims_human_v1.json', encoding='utf-8')); json.dump(d[:6], open('e:/jachaix/scripts/benchmark_claims_human_v1_quick.json','w',encoding='utf-8'), ensure_ascii=False, indent=2); print('quick_samples', len(d[:6]))"
if ($LASTEXITCODE -ne 0) { throw "Quick subset build failed." }

Write-Host "[5/6] Running quick evaluation" -ForegroundColor Cyan
& "e:/jachaix/scripts/run_eval.ps1" -PythonExe $PythonExe -BaseUrl $BaseUrl -Input "e:/jachaix/scripts/benchmark_claims_human_v1_quick.json" -Output "e:/jachaix/scripts/eval_human_quick_results.json" -PollInterval 5 -MaxPolls 72 -RequestTimeout 90

Write-Host "[6/6] Summarizing metrics" -ForegroundColor Cyan
& $PythonExe -c "import json; p='e:/jachaix/scripts/eval_human_quick_results.json'; r=json.load(open(p,encoding='utf-8')); m=r.get('metrics',{}); print('samples_scored=', m.get('samples_scored')); print('samples_total=', m.get('samples_total')); print('accuracy=', m.get('accuracy')); print('macro_precision=', m.get('macro_precision')); print('macro_recall=', m.get('macro_recall')); print('macro_f1=', m.get('macro_f1')); print('report=', p)"
if ($LASTEXITCODE -ne 0) { throw "Metrics summary failed." }

Write-Host "FASTLANE COMPLETE" -ForegroundColor Green
