param(
    [string]$PythonExe = "E:/Python310/python.exe",
  [string]$BaseUrl = "http://127.0.0.1:8080/api/v1",
  [double]$FalsePrecisionFloor = 0.75,
  [double]$MultilingualFalsePrecisionFloor = 0.70,
  [double]$MacroF1Floor = 0.45
)

$ErrorActionPreference = "Stop"

Write-Host "Running regression suite (human + multilingual)..." -ForegroundColor Cyan

& $PythonExe "e:/jachaix/scripts/evaluate_pipeline.py" `
  --base-url $BaseUrl `
  --input "e:/jachaix/scripts/benchmark_claims_human_v1.json" `
  --output "e:/jachaix/scripts/eval_human_latest.json" `
  --request-timeout 60

if ($LASTEXITCODE -ne 0) {
    throw "Human benchmark regression failed with exit code $LASTEXITCODE"
}

& $PythonExe "e:/jachaix/scripts/evaluate_pipeline.py" `
  --base-url $BaseUrl `
  --input "e:/jachaix/scripts/benchmark_claims_multilingual_slice.json" `
  --output "e:/jachaix/scripts/eval_multilingual_slice_results.json" `
  --request-timeout 60

if ($LASTEXITCODE -ne 0) {
    throw "Multilingual slice regression failed with exit code $LASTEXITCODE"
}

$EvalStorage = "e:/jachaix/backend/storage/app/evaluation"
New-Item -ItemType Directory -Force -Path $EvalStorage | Out-Null
Copy-Item -Force "e:/jachaix/scripts/eval_human_latest.json" "$EvalStorage/eval_human_latest.json"
Copy-Item -Force "e:/jachaix/scripts/eval_multilingual_slice_results.json" "$EvalStorage/eval_multilingual_slice_results.json"

Write-Host "Regression suite completed." -ForegroundColor Green

& $PythonExe "e:/jachaix/scripts/assert_quality_gate.py" `
  --human-report "e:/jachaix/scripts/eval_human_latest.json" `
  --multilingual-report "e:/jachaix/scripts/eval_multilingual_slice_results.json" `
  --false-precision-floor $FalsePrecisionFloor `
  --multilingual-false-precision-floor $MultilingualFalsePrecisionFloor `
  --macro-f1-floor $MacroF1Floor

if ($LASTEXITCODE -ne 0) {
    throw "Quality gate failed with exit code $LASTEXITCODE"
}

Write-Host "Quality gate passed." -ForegroundColor Green
