import argparse
import json
import time
from pathlib import Path

import requests


def submit(base_url: str, text: str, language: str, timeout: int = 30) -> int:
    r = requests.post(
        f"{base_url}/analyze/text",
        json={"text": text, "language": language},
        timeout=timeout,
    )
    r.raise_for_status()
    data = r.json()
    claim_id = data.get("claim_id") or data.get("job", {}).get("id")
    if not claim_id:
        raise ValueError(f"No claim id in response: {data}")
    return int(claim_id)


def get_status(base_url: str, claim_id: int, timeout: int = 20) -> str:
    r = requests.get(f"{base_url}/claims/{claim_id}/status", timeout=timeout)
    r.raise_for_status()
    return (r.json().get("claim", {}).get("status") or "").lower()


def get_result(base_url: str, claim_id: int, timeout: int = 20) -> dict:
    r = requests.get(f"{base_url}/claims/{claim_id}/result", timeout=timeout)
    r.raise_for_status()
    return r.json().get("claim", {})


def main() -> int:
    parser = argparse.ArgumentParser(description="3-minute demo runner for JachaiX")
    parser.add_argument("--base-url", default="http://127.0.0.1:8080/api/v1")
    parser.add_argument("--input", default="e:/jachaix/scripts/benchmark_demo_3min.json")
    parser.add_argument("--output", default="e:/jachaix/scripts/demo_3min_report.json")
    parser.add_argument("--max-wait", type=int, default=35, help="Max wait per claim in seconds")
    parser.add_argument("--poll-interval", type=float, default=1.5)
    args = parser.parse_args()

    cases = json.loads(Path(args.input).read_text(encoding="utf-8"))

    started = time.time()
    rows = []

    # Submit all claims first so backend can process them concurrently in queue workers.
    for c in cases:
        cid = submit(args.base_url, c["text"], c.get("language", "auto"))
        rows.append(
            {
                "id": c.get("id"),
                "claim_id": cid,
                "text": c.get("text"),
                "language": c.get("language"),
                "expected": (c.get("expected_verdict") or "unverified").lower(),
                "status": "pending",
                "predicted": "unverified",
                "elapsed_seconds": None,
                "confidence": None,
                "sources_count": 0,
            }
        )

    # Poll all claims in round-robin until done or timeout.
    claim_start = {row["claim_id"]: time.time() for row in rows}
    pending = {row["claim_id"] for row in rows}

    while pending:
        now = time.time()
        done_this_round = []

        for cid in list(pending):
            elapsed = now - claim_start[cid]
            if elapsed > args.max_wait:
                done_this_round.append(cid)
                continue

            st = get_status(args.base_url, cid)
            if st in {"completed", "failed"}:
                done_this_round.append(cid)

        for cid in done_this_round:
            pending.discard(cid)

        if pending:
            time.sleep(args.poll_interval)

    # Collect final results.
    for row in rows:
        cid = row["claim_id"]
        elapsed = round(time.time() - claim_start[cid], 3)
        row["elapsed_seconds"] = elapsed

        st = get_status(args.base_url, cid)
        row["status"] = st

        if st == "completed":
            claim = get_result(args.base_url, cid)
            row["predicted"] = (claim.get("verdict") or "unverified").lower()
            row["confidence"] = claim.get("confidence_score")
            row["sources_count"] = len(claim.get("sources") or [])

    scored = [r for r in rows if r["status"] == "completed"]
    accuracy = (
        sum(1 for r in scored if r["predicted"] == r["expected"]) / len(scored)
        if scored
        else 0.0
    )
    sla_30_rate = (
        sum(1 for r in rows if (r["elapsed_seconds"] or 1e9) <= 30) / len(rows)
        if rows
        else 0.0
    )

    report = {
        "generated_at_unix": int(time.time()),
        "base_url": args.base_url,
        "samples_total": len(rows),
        "samples_scored": len(scored),
        "accuracy": round(accuracy, 4),
        "sla_30s_pass_rate": round(sla_30_rate, 4),
        "total_wall_seconds": round(time.time() - started, 3),
        "rows": rows,
    }

    Path(args.output).write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
