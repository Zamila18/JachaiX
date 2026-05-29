param(
    [string]$PythonExe = "E:/Python310/python.exe",
    [string]$BaseUrl = "http://127.0.0.1:8080/api/v1",
  [Alias('Input')]
  [string]$BenchmarkInput = "e:/jachaix/scripts/benchmark_claims_human_v1.json",
  [Alias('Output')]
  [string]$BenchmarkOutput = "e:/jachaix/scripts/eval_results_latest.json",
    [int]$PollInterval = 5,
    [int]$MaxPolls = 72,
    [int]$RequestTimeout = 90
)

$ErrorActionPreference = "Stop"

Write-Host "Running evaluation..." -ForegroundColor Cyan
Write-Host "Python : $PythonExe"
Write-Host "Input  : $BenchmarkInput"
Write-Host "Output : $BenchmarkOutput"

& $PythonExe "e:/jachaix/scripts/evaluate_pipeline.py" `
  --base-url $BaseUrl `
  --input $BenchmarkInput `
  --output $BenchmarkOutput `
  --poll-interval $PollInterval `
  --max-polls $MaxPolls `
  --request-timeout $RequestTimeout

if ($LASTEXITCODE -ne 0) {
    throw "Evaluation failed with exit code $LASTEXITCODE"
}

Write-Host "Evaluation completed." -ForegroundColor Green
