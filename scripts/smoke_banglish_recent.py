import json
import time
import requests

BASE = "http://127.0.0.1:8080/api/v1"

r = requests.post(
    f"{BASE}/analyze/text",
    json={"text": "illinois chemical tank explosion leaves 1 dead", "language": "banglish"},
    timeout=60,
)
r.raise_for_status()
data = r.json()
claim_id = int(data.get("claim_id") or data.get("job", {}).get("id"))

status = "pending"
for _ in range(80):
    time.sleep(2)
    s = requests.get(f"{BASE}/claims/{claim_id}/status", timeout=60)
    s.raise_for_status()
    status = s.json()["claim"]["status"]
    if status in {"completed", "failed"}:
        break

claim = {}
if status == "completed":
    res = requests.get(f"{BASE}/claims/{claim_id}/result", timeout=60)
    res.raise_for_status()
    claim = res.json().get("claim", {})

out = {
    "claim_id": claim_id,
    "status": status,
    "verdict": claim.get("verdict"),
    "confidence": claim.get("confidence_score"),
    "trust": claim.get("trust_label"),
    "explanation": claim.get("explanation"),
}

with open("E:/jachaix/scripts/smoke_banglish_recent_result.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print(json.dumps(out, ensure_ascii=False))
