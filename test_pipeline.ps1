param(
    [string]$BaseUrl = "http://127.0.0.1:8080/api/v1",
    [string]$Text = "বাংলাদেশ ২০২৪ ক্রিকেট বিশ্বকাপ জিতেছে",
    [string]$Language = "bn",
    [int]$PollIntervalSec = 5,
    [int]$MaxPolls = 72,
    [int]$RequestTimeoutSec = 90,
    [string]$OutFile = "e:\jachaix\scripts\last_smoke_result.json"
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

function Invoke-AnalyzeText {
    param(
        [string]$BaseUrl,
        [string]$Text,
        [string]$Language,
        [int]$TimeoutSec
    )

    $body = @{ text = $Text; language = $Language } | ConvertTo-Json -Depth 4
    $utf8Body = [System.Text.Encoding]::UTF8.GetBytes($body)

    try {
        return Invoke-RestMethod "$BaseUrl/analyze/text" -Method POST -ContentType "application/json; charset=utf-8" -Body $utf8Body -TimeoutSec $TimeoutSec
    }
    catch {
        # Backward-compatible endpoint fallback
        $legacyBody = @{ input_type = "text"; raw_input = $Text; language = $Language } | ConvertTo-Json -Depth 4
        $utf8LegacyBody = [System.Text.Encoding]::UTF8.GetBytes($legacyBody)
        return Invoke-RestMethod "$BaseUrl/claims" -Method POST -ContentType "application/json; charset=utf-8" -Body $utf8LegacyBody -TimeoutSec $TimeoutSec
    }
}

function Get-ClaimId {
    param([object]$Response)

    if ($null -ne $Response.job -and $null -ne $Response.job.id) {
        return [int]$Response.job.id
    }

    if ($null -ne $Response.claim_id) {
        return [int]$Response.claim_id
    }

    throw "Could not parse claim/job id from response: $($Response | ConvertTo-Json -Depth 10 -Compress)"
}

Write-Host "Submitting claim..." -ForegroundColor Cyan
$submit = Invoke-AnalyzeText -BaseUrl $BaseUrl -Text $Text -Language $Language -TimeoutSec $RequestTimeoutSec
$claimId = Get-ClaimId -Response $submit
Write-Host "Claim ID: $claimId" -ForegroundColor Green

$finalStatus = "pending"
$result = $null

for ($i = 1; $i -le $MaxPolls; $i++) {
    Start-Sleep -Seconds $PollIntervalSec

    try {
        $statusRes = Invoke-RestMethod "$BaseUrl/claims/$claimId/status" -TimeoutSec $RequestTimeoutSec
        $status = ("$($statusRes.claim.status)").ToLowerInvariant()
        $finalStatus = $status
        Write-Host "[$i/$MaxPolls] status=$status" -ForegroundColor Yellow

        if ($status -in @("completed", "failed")) {
            $result = Invoke-RestMethod "$BaseUrl/claims/$claimId/result" -TimeoutSec $RequestTimeoutSec
            break
        }
    }
    catch {
        Write-Host "[$i/$MaxPolls] status poll error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($null -eq $result) {
    try {
        $result = Invoke-RestMethod "$BaseUrl/claims/$claimId/result" -TimeoutSec $RequestTimeoutSec
    }
    catch {
        Write-Host "Final result fetch failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

$claimResult = $null
if ($null -ne $result -and $null -ne $result.claim) {
    $claimResult = $result.claim
}

Write-Host "\n=== Smoke Result ===" -ForegroundColor Cyan
Write-Host "Final Status : $finalStatus"
Write-Host "Verdict      : $($claimResult.verdict)"
Write-Host "Confidence   : $($claimResult.confidence_score)"
Write-Host "Sources      : $(@($claimResult.sources).Count)"
Write-Host "Explanation  : $($claimResult.explanation)"

$artifact = [ordered]@{
    generated_at = (Get-Date).ToString("s")
    base_url = $BaseUrl
    input = [ordered]@{
        text = $Text
        language = $Language
    }
    claim_id = $claimId
    final_status = $finalStatus
    result = $claimResult
}

$artifact | ConvertTo-Json -Depth 12 | Set-Content -Path $OutFile -Encoding UTF8
Write-Host "Saved smoke artifact: $OutFile" -ForegroundColor Green