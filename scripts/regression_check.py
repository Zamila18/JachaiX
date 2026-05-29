import json
import time
import requests

BASE = "http://127.0.0.1:8080/api/v1"
MAX_WAIT_SECONDS = 30
CASES = [
    ("Illinois chemical tank explosion leaves 1 dead.", "banglish", "true"),
    ("Illinois chemical tank explosion leaves 10 dead.", "banglish", "false"),
    ("WHO says COVID-19 vaccines do not contain microchips.", "international", "true"),
    ("COVID-19 vaccines contain microchips to track people.", "international", "false"),
]


def submit(text: str, language: str) -> int:
    last_error = None
    for attempt in range(4):
        try:
            r = requests.post(f"{BASE}/analyze/text", json={"text": text, "language": language}, timeout=60)
            r.raise_for_status()
            data = r.json()
            return int(data.get("claim_id") or data.get("job", {}).get("id"))
        except requests.RequestException as exc:
            last_error = exc
            if attempt < 3:
                time.sleep(2)
    raise last_error


def wait_for(cid: int) -> tuple[str, float]:
    start = time.time()
    for _ in range(MAX_WAIT_SECONDS // 2):
        time.sleep(2)
        r = requests.get(f"{BASE}/claims/{cid}/status", timeout=60)
        r.raise_for_status()
        status = (r.json().get("claim", {}).get("status") or "").lower()
        if status in {"completed", "failed"}:
            return status, round(time.time() - start, 3)
    return "timeout", round(time.time() - start, 3)


def result(cid: int) -> dict:
    r = requests.get(f"{BASE}/claims/{cid}/result", timeout=60)
    r.raise_for_status()
    return r.json().get("claim", {})


rows = []
for text, language, expected in CASES:
    cid = submit(text, language)
    status, elapsed = wait_for(cid)
    claim = result(cid) if status == "completed" else {}
    rows.append(
        {
            "id": cid,
            "text": text,
            "language": language,
            "expected": expected,
            "predicted": (claim.get("verdict") or "unverified").lower(),
            "status": status,
            "elapsed_seconds": elapsed,
            "sla_30s": elapsed <= 30,
            "confidence": claim.get("confidence_score"),
            "trust": claim.get("trust_label"),
            "sources_count": len(claim.get("sources") or []),
            "explanation": claim.get("explanation"),
        }
    )

scored = [r for r in rows if r["status"] == "completed"]
accuracy = (sum(1 for r in scored if r["expected"] == r["predicted"]) / len(scored)) if scored else 0.0
labels = ["true", "false", "misleading", "unverified"]
macro_p = macro_r = macro_f1 = 0.0

for label in labels:
    tp = sum(1 for r in scored if r["expected"] == label and r["predicted"] == label)
    fp = sum(1 for r in scored if r["expected"] != label and r["predicted"] == label)
    fn = sum(1 for r in scored if r["expected"] == label and r["predicted"] != label)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    macro_p += precision
    macro_r += recall
    macro_f1 += f1

report = {
    "samples_total": len(rows),
    "samples_scored": len(scored),
    "accuracy": round(accuracy, 4),
    "sla_30s_pass_rate": round((sum(1 for r in rows if r.get("sla_30s")) / len(rows)) if rows else 0.0, 4),
    "macro_precision": round(macro_p / len(labels), 4),
    "macro_recall": round(macro_r / len(labels), 4),
    "macro_f1": round(macro_f1 / len(labels), 4),
    "rows": rows,
}

print(json.dumps(report, ensure_ascii=False, indent=2))
