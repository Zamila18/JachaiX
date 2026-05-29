$BASE = "http://127.0.0.1:8080/api/v1"

$payload = @{
    input_type = "text"
    raw_input  = "AI generated fake image of SSC exam student is being shared as real"
    language   = "en"
} | ConvertTo-Json

$r = Invoke-RestMethod -Uri "$BASE/claims" -Method POST -ContentType "application/json" -Body $payload
$id = $r.claim_id
Write-Host "Submitted claim ID: $id"
Write-Host "Initial status: $($r.status)"

$status = "pending"
for ($i = 1; $i -le 25; $i++) {
    Start-Sleep -Seconds 5
    try {
        $s = Invoke-RestMethod -Uri "$BASE/claims/$id/status" -Method GET
        $status = $s.claim.status
        Write-Host "[$i] Status: $status"
        if ($status -eq "completed" -or $status -eq "failed") { break }
    } catch {
        Write-Host "[$i] Status check transient error; retrying..."
    }
}

$result = Invoke-RestMethod -Uri "$BASE/claims/$id/result" -Method GET
$c = $result.claim
Write-Host "`n=== RESULT ==="
Write-Host "Verdict   : $($c.verdict)"
Write-Host "Confidence: $($c.confidence_score)"
Write-Host "Explanation: $($c.explanation)"
Write-Host "Sources   : $($c.sources.Count) found"
if ($c.sources.Count -gt 0) {
    $c.sources | ForEach-Object { Write-Host "  - $($_.title) [$($_.source)]" }
}
