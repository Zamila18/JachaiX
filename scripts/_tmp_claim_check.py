import json
import time
import requests

base = "http://127.0.0.1:8080/api/v1"


def run_claim(text, language):
    s = requests.Session()
    r = s.post(base + "/analyze/text", data={"text": text, "language": language}, timeout=30)
    r.raise_for_status()
    cid = r.json()["claim_id"]
    status = "queued"
    for _ in range(120):
        status = s.get(f"{base}/claims/{cid}/status", timeout=20).json()["claim"]["status"]
        if status in ("completed", "failed"):
            break
        time.sleep(1)
    result = s.get(f"{base}/claims/{cid}/result", timeout=20).json()["claim"]
    return {
        "claim_id": cid,
        "status": result.get("status"),
        "verdict": result.get("verdict"),
        "confidence_score": result.get("confidence_score"),
        "sources_count": len(result.get("sources") or []),
        "cross_verification": result.get("cross_verification"),
        "human_verification": result.get("human_verification"),
    }


strong = run_claim("বাংলাদেশের রাজধানী ঢাকা", "bn")
weak = run_claim("bangladesh e haam e 2000 shishu nihoto hoise", "banglish")

review_resp = requests.post(
    f"{base}/claims/{weak['claim_id']}/review-request",
    data={
        "reason": "Weak evidence, please verify manually",
        "notes": "User requested human verification flow",
        "reporter_name": "demo_frontend",
    },
    timeout=20,
)

out = {
    "strong_claim": strong,
    "weak_claim": weak,
    "review_request_status": review_resp.status_code,
    "review_request_body": review_resp.json(),
}
print(json.dumps(out, ensure_ascii=False, indent=2))
