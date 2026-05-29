param(
    [int]$IntervalMinutes = 30,
    [switch]$ResetQdrantOnFirstRun
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$firstRun = $true
while ($true) {
    $started = Get-Date
    Write-Host "[$started] Starting knowledge base refresh..." -ForegroundColor Cyan

    $args = @()
    if ($firstRun -and $ResetQdrantOnFirstRun) {
        $args += '-ResetQdrant'
    }

    powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot 'scripts\refresh_knowledge_base.ps1') @args

    $finished = Get-Date
    Write-Host "[$finished] Refresh complete. Next run in $IntervalMinutes minutes." -ForegroundColor Green

    $firstRun = $false
    Start-Sleep -Seconds ($IntervalMinutes * 60)
}
