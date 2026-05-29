import argparse
import json
import time
from collections import Counter, defaultdict
from pathlib import Path

import requests
from requests import RequestException

ALLOWED_LABELS = ["true", "false", "misleading", "unverified"]


def safe_label(value: str) -> str:
    v = (value or "").strip().lower()
    return v if v in ALLOWED_LABELS else "unverified"


def _request_with_retry(method: str, url: str, *, timeout: int, retries: int = 2, **kwargs) -> requests.Response:
    last_exc = None
    for attempt in range(retries + 1):
        try:
            response = requests.request(method, url, timeout=timeout, **kwargs)
            return response
        except RequestException as exc:
            last_exc = exc
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    raise last_exc  # type: ignore[misc]


def submit_claim(base_url: str, text: str, language: str, request_timeout: int) -> int:
    # Preferred endpoint
    payload = {"text": text, "language": language}
    r = _request_with_retry("POST", f"{base_url}/analyze/text", json=payload, timeout=request_timeout)

    if r.status_code == 404:
        # Backward-compatible fallback
        payload = {"input_type": "text", "raw_input": text, "language": language}
        r = _request_with_retry("POST", f"{base_url}/claims", json=payload, timeout=request_timeout)

    r.raise_for_status()
    data = r.json()

    if isinstance(data.get("job"), dict) and data["job"].get("id"):
        return int(data["job"]["id"])
    if data.get("claim_id"):
        return int(data["claim_id"])

    raise ValueError(f"Could not parse job id from response: {data}")


def wait_for_completion(
    base_url: str,
    claim_id: int,
    poll_interval: int,
    max_polls: int,
    request_timeout: int,
) -> str:
    status = "pending"
    for _ in range(max_polls):
        time.sleep(poll_interval)
        r = _request_with_retry("GET", f"{base_url}/claims/{claim_id}/status", timeout=request_timeout)
        r.raise_for_status()
        status = (r.json().get("claim", {}).get("status") or "").lower()
        if status in {"completed", "failed"}:
            return status
    return status


def fetch_result(base_url: str, claim_id: int, request_timeout: int) -> dict:
    r = _request_with_retry("GET", f"{base_url}/claims/{claim_id}/result", timeout=request_timeout)
    r.raise_for_status()
    return r.json().get("claim", {})


def compute_metrics(rows: list[dict]) -> dict:
    # Ignore rows where pipeline failed
    scored_rows = [r for r in rows if r.get("status") == "completed"]
    if not scored_rows:
        return {
            "samples_total": len(rows),
            "samples_scored": 0,
            "accuracy": 0.0,
            "macro_precision": 0.0,
            "macro_recall": 0.0,
            "macro_f1": 0.0,
            "per_class": {},
            "confusion_matrix": {},
        }

    y_true = [safe_label(r.get("expected_verdict", "")) for r in scored_rows]
    y_pred = [safe_label(r.get("predicted_verdict", "")) for r in scored_rows]

    correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
    accuracy = correct / len(y_true)

    per_class = {}
    confusion = {label: {l: 0 for l in ALLOWED_LABELS} for label in ALLOWED_LABELS}
    for t, p in zip(y_true, y_pred):
        confusion[t][p] += 1

    macro_p = 0.0
    macro_r = 0.0
    macro_f1 = 0.0

    for label in ALLOWED_LABELS:
        tp = sum(1 for t, p in zip(y_true, y_pred) if t == label and p == label)
        fp = sum(1 for t, p in zip(y_true, y_pred) if t != label and p == label)
        fn = sum(1 for t, p in zip(y_true, y_pred) if t == label and p != label)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

        per_class[label] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "support": sum(1 for t in y_true if t == label),
        }

        macro_p += precision
        macro_r += recall
        macro_f1 += f1

    n_classes = len(ALLOWED_LABELS)

    return {
        "samples_total": len(rows),
        "samples_scored": len(scored_rows),
        "accuracy": round(accuracy, 4),
        "macro_precision": round(macro_p / n_classes, 4),
        "macro_recall": round(macro_r / n_classes, 4),
        "macro_f1": round(macro_f1 / n_classes, 4),
        "per_class": per_class,
        "confusion_matrix": confusion,
    }


def compute_group_metrics(rows: list[dict], key: str) -> dict:
    grouped: dict[str, list[dict]] = defaultdict(list)

    for row in rows:
        group = str(row.get(key) or "unknown")
        grouped[group].append(row)

    return {
        group: compute_metrics(group_rows)
        for group, group_rows in sorted(grouped.items())
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run end-to-end evaluation against JachaiX backend")
    parser.add_argument("--base-url", default="http://127.0.0.1:8080/api/v1", help="Backend API base URL")
    parser.add_argument("--input", default="scripts/benchmark_claims_human_v1.json", help="Benchmark JSON file")
    parser.add_argument("--output", default="scripts/eval_results_latest.json", help="Output JSON report file")
    parser.add_argument("--poll-interval", type=int, default=5, help="Seconds between status polls")
    parser.add_argument("--max-polls", type=int, default=36, help="Max number of polling attempts per claim")
    parser.add_argument("--request-timeout", type=int, default=45, help="Per-request timeout in seconds")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    claims = json.loads(input_path.read_text(encoding="utf-8"))

    rows = []
    print(f"Running evaluation on {len(claims)} claims against {args.base_url}...")

    for idx, item in enumerate(claims, start=1):
        cid = item.get("id", f"sample_{idx}")
        text = item.get("text", "")
        language = item.get("language", "bn")
        expected = safe_label(item.get("expected_verdict", "unverified"))

        row = {
            "id": cid,
            "text": text,
            "language": language,
            "expected_verdict": expected,
            "category": item.get("category"),
            "claim_id": None,
            "status": "failed",
            "predicted_verdict": "unverified",
            "predicted_confidence": 0.0,
            "error": None,
        }

        try:
            claim_id = submit_claim(args.base_url, text, language, args.request_timeout)
            row["claim_id"] = claim_id

            status = wait_for_completion(
                args.base_url,
                claim_id,
                args.poll_interval,
                args.max_polls,
                args.request_timeout,
            )
            row["status"] = status

            result = fetch_result(args.base_url, claim_id, args.request_timeout)
            row["predicted_verdict"] = safe_label(result.get("verdict", "unverified"))
            row["predicted_confidence"] = float(result.get("confidence_score") or 0.0)
            row["explanation"] = result.get("explanation")
            row["sources_count"] = len(result.get("sources") or [])
        except Exception as exc:
            row["error"] = str(exc)

        rows.append(row)
        print(
            f"[{idx}/{len(claims)}] id={row['id']} claim_id={row['claim_id']} "
            f"status={row['status']} expected={row['expected_verdict']} predicted={row['predicted_verdict']}"
        )

    metrics = compute_metrics(rows)
    metrics["by_language"] = compute_group_metrics(rows, "language")
    metrics["by_category"] = compute_group_metrics(rows, "category")

    report = {
        "base_url": args.base_url,
        "input": str(input_path),
        "generated_at_unix": int(time.time()),
        "metrics": metrics,
        "rows": rows,
    }

    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n=== Evaluation Summary ===")
    print(f"Scored samples: {metrics['samples_scored']}/{metrics['samples_total']}")
    print(f"Accuracy      : {metrics['accuracy']}")
    print(f"MacroPrecision: {metrics['macro_precision']}")
    print(f"MacroRecall   : {metrics['macro_recall']}")
    print(f"MacroF1       : {metrics['macro_f1']}")
    print(f"Saved report  : {output_path}")


if __name__ == "__main__":
    main()
