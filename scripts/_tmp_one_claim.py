import json
import time
import requests

base = "http://127.0.0.1:8080/api/v1"
claim = "বাংলাদেশের রাজধানী ঢাকা"

s = requests.Session()
r = s.post(base + "/analyze/text", data={"text": claim, "language": "bn"}, timeout=30)
r.raise_for_status()
cid = r.json()["claim_id"]
print(json.dumps({"claim_id": cid, "submitted": True}, ensure_ascii=False), flush=True)

status = "queued"
for i in range(45):
    status = s.get(f"{base}/claims/{cid}/status", timeout=20).json()["claim"]["status"]
    print(json.dumps({"tick": i, "status": status}, ensure_ascii=False), flush=True)
    if status in ("completed", "failed"):
        break
    time.sleep(1)

result = s.get(f"{base}/claims/{cid}/result", timeout=20).json()["claim"]
out = {
    "claim_id": cid,
    "status": result.get("status"),
    "verdict": result.get("verdict"),
    "cross_verification": result.get("cross_verification"),
    "human_verification": result.get("human_verification"),
}
print(json.dumps(out, ensure_ascii=False, indent=2), flush=True)
