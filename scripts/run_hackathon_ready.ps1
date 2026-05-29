param(
  [string]$PythonExe = "E:/Python310/python.exe",
  [string]$BaseUrl = "http://127.0.0.1:8080/api/v1"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/2] Running fast readiness checks" -ForegroundColor Cyan
& $PythonExe "E:/jachaix/scripts/hackathon_readiness_check.py" `
  --base-url $BaseUrl `
  --output "E:/jachaix/scripts/hackathon_readiness_report.json" `
  --max-wait 35

if ($LASTEXITCODE -ne 0) {
  throw "Readiness check failed. Open scripts/hackathon_readiness_report.json"
}

Write-Host "[2/2] Running 3-minute E2E demo suite" -ForegroundColor Cyan
& $PythonExe "E:/jachaix/scripts/demo_run_3min.py" `
  --base-url $BaseUrl `
  --input "E:/jachaix/scripts/benchmark_demo_3min.json" `
  --output "E:/jachaix/scripts/demo_3min_report.json" `
  --max-wait 35 `
  --poll-interval 1.5

if ($LASTEXITCODE -ne 0) {
  throw "Demo runner failed"
}

Write-Host "Hackathon-ready run completed" -ForegroundColor Green
