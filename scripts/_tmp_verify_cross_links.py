import json
import time
import requests

base = "http://127.0.0.1:8080/api/v1"

r = requests.post(base + "/analyze/text", data={"text": "বাংলাদেশের রাজধানী ঢাকা", "language": "bn"}, timeout=20)
r.raise_for_status()
cid = r.json()["claim_id"]

for _ in range(60):
    st = requests.get(f"{base}/claims/{cid}/status", timeout=20).json()["claim"]["status"]
    if st in ("completed", "failed"):
        break
    time.sleep(1)

claim = requests.get(f"{base}/claims/{cid}/result", timeout=20).json()["claim"]
print(json.dumps({
    "claim_id": cid,
    "status": claim.get("status"),
    "verdict": claim.get("verdict"),
    "cross_verification": claim.get("cross_verification"),
    "human_verification": claim.get("human_verification")
}, ensure_ascii=False, indent=2), flush=True)
