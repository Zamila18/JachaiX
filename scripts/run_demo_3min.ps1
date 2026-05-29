param(
  [string]$PythonExe = "E:/Python310/python.exe",
  [string]$BaseUrl = "http://127.0.0.1:8080/api/v1"
)

$ErrorActionPreference = "Stop"

& $PythonExe "E:/jachaix/scripts/demo_run_3min.py" `
  --base-url $BaseUrl `
  --input "E:/jachaix/scripts/benchmark_demo_3min.json" `
  --output "E:/jachaix/scripts/demo_3min_report.json" `
  --max-wait 35 `
  --poll-interval 1.5

if ($LASTEXITCODE -ne 0) {
  throw "demo_run_3min.py failed with exit code $LASTEXITCODE"
}
