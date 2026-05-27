$body = '{"input_type":"text","raw_input":"Bangladesh won the cricket world cup in 2024","language":"en"}'
$r = Invoke-RestMethod 'http://127.0.0.1:8080/api/v1/claims' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 30
Write-Host "Claim ID: $($r.claim_id)"
$cid = $r.claim_id
for ($i=1; $i -le 30; $i++) {
    Start-Sleep -Seconds 8
    try {
        $s = Invoke-RestMethod "http://127.0.0.1:8080/api/v1/claims/$cid/status" -TimeoutSec 20
        $st = $s.claim.status
        Write-Host "[$i] $st $(Get-Date -Format HH:mm:ss)"
        if ($st -in 'completed','failed') {
            $res = Invoke-RestMethod "http://127.0.0.1:8080/api/v1/claims/$cid/result" -TimeoutSec 20
            Write-Host "VERDICT: $($res.claim.verdict)"
            Write-Host "CONFIDENCE: $($res.claim.confidence_score)"
            Write-Host "EXPLANATION: $($res.claim.explanation)"
            break
        }
    } catch { Write-Host "[$i] ERR" }
}