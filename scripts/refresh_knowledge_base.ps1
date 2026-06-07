param(
    [switch]$ResetQdrant,
    [switch]$FullIngest,
    [switch]$SkipCrawler
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$statusPath = Join-Path $repoRoot 'backend\storage\app\knowledge_base_refresh.json'
$crawlerStatusPath = Join-Path $repoRoot 'backend\storage\app\crawler_refresh.json'

Set-Location $repoRoot

function Resolve-PythonExecutable {
    $pythonPath = "C:\Program Files\Python312\python.exe"
    if (Test-Path $pythonPath) {
        return $pythonPath
    }
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCommand) {
        return $pythonCommand.Source
    }
    throw 'No usable Python executable found.'
}
function Invoke-PythonScript {
    param(
        [Parameter(Mandatory=$true)][string]$PythonExe,
        [Parameter(Mandatory=$true)][string]$ScriptPath,
        [string[]]$Arguments = @()
    )

    & $PythonExe $ScriptPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Python script failed: $ScriptPath (exit code $LASTEXITCODE)"
    }
}

$pythonExe = Resolve-PythonExecutable
Write-Host "Using Python: $pythonExe" -ForegroundColor Cyan

$startedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
$statusStart = [ordered]@{
    status = 'ingesting'
    started_at_utc = $startedAtUtc
    refreshed_at_utc = $null
    repo_root = $repoRoot
    python_executable = $pythonExe
    raw_article_files = (Get-ChildItem -Path (Join-Path $repoRoot 'corpus\raw') -Filter '*.json' -File -ErrorAction SilentlyContinue | Measure-Object).Count
    reset_qdrant = [bool]$ResetQdrant
    chunker_pattern = '*.json'
}

[System.IO.File]::WriteAllText($statusPath, ($statusStart | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Wrote ingest manifest: $statusPath" -ForegroundColor Green

if (-not $SkipCrawler) {
    Write-Host "Running crawler refresh..." -ForegroundColor Cyan
    try {
        Invoke-PythonScript -PythonExe $pythonExe -ScriptPath (Join-Path $repoRoot 'scripts\crawl_refresh.py') -Arguments @('--max-per-source', '4', '--lookback-days', '3')
    }
    catch {
        Write-Warning "Crawler refresh failed: $($_.Exception.Message)"
    }
}

Invoke-PythonScript -PythonExe $pythonExe -ScriptPath (Join-Path $repoRoot 'scripts\seed_additional_bangla_sources.py')
Invoke-PythonScript -PythonExe $pythonExe -ScriptPath (Join-Path $repoRoot 'scripts\seed_trusted_international_sources.py')

$rawDir = Join-Path $repoRoot 'corpus\raw'
$allRawFiles = Get-ChildItem -Path $rawDir -Filter '*.json' -File -ErrorAction SilentlyContinue

if ($FullIngest) {
    $filesToProcess = $allRawFiles
    $chunkerPatterns = @('*.json')
}
else {
    # Keep non-full mode behavior predictable for demos: ingest the whole corpus so
    # retrieval always has complete coverage of available KB documents.
    $filesToProcess = $allRawFiles
    $chunkerPatterns = @('*.json')
}

foreach ($pattern in $chunkerPatterns) {
    $chunkerArgs = @('--pattern', $pattern)
    if ($ResetQdrant -and $pattern -eq $chunkerPatterns[0]) {
        $chunkerArgs += '--reset'
    }

    Invoke-PythonScript -PythonExe $pythonExe -ScriptPath (Join-Path $repoRoot 'corpus\chunker\run_chunker.py') -Arguments $chunkerArgs
}

$rawCount = $filesToProcess.Count
$status = [ordered]@{
    status = 'fresh'
    started_at_utc = $startedAtUtc
    refreshed_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    repo_root = $repoRoot
    python_executable = $pythonExe
    raw_article_files = $rawCount
    reset_qdrant = [bool]$ResetQdrant
    full_ingest = [bool]$FullIngest
    crawler_enabled = -not [bool]$SkipCrawler
    crawler_status = $(
        if (Test-Path $crawlerStatusPath) {
            try {
                Get-Content $crawlerStatusPath -Raw | ConvertFrom-Json
            }
            catch {
                [ordered]@{ status = 'unknown'; error = $_.Exception.Message }
            }
        }
        else {
            [ordered]@{ status = 'not_run' }
        }
    )
    chunker_pattern = '*.json'
}

[System.IO.File]::WriteAllText($statusPath, ($status | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Saved freshness manifest: $statusPath" -ForegroundColor Green