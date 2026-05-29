import argparse
import json
import time
from pathlib import Path

import requests


def check_health(base_url: str) -> dict:
    started = time.time()
    try:
        r = requests.get(f"{base_url}/health", timeout=10)
        ok = r.status_code == 200 and (r.json().get("status") == "ok")
        return {
            "name": "api_health",
            "ok": ok,
            "status_code": r.status_code,
            "elapsed_ms": int((time.time() - started) * 1000),
            "detail": r.json(),
        }
    except Exception as exc:
        return {
            "name": "api_health",
            "ok": False,
            "elapsed_ms": int((time.time() - started) * 1000),
            "error": str(exc),
        }


def check_kb_status(base_url: str) -> dict:
    started = time.time()
    try:
        r = requests.get(f"{base_url}/knowledge-base/status", timeout=10)
        payload = r.json()
        kb = payload.get("knowledge_base", {})
        status = kb.get("status")
        ok = r.status_code == 200 and status in {"fresh", "never_refreshed", "ingesting"}
        return {
            "name": "kb_status",
            "ok": ok,
            "status_code": r.status_code,
            "elapsed_ms": int((time.time() - started) * 1000),
            "detail": kb,
        }
    except Exception as exc:
        return {
            "name": "kb_status",
            "ok": False,
            "elapsed_ms": int((time.time() - started) * 1000),
            "error": str(exc),
        }


def check_quick_claim(base_url: str, text: str, language: str, max_wait: int) -> dict:
    started = time.time()
    out = {
        "name": "quick_claim",
        "ok": False,
        "elapsed_ms": None,
    }

    try:
        r = requests.post(
            f"{base_url}/analyze/text",
            json={"text": text, "language": language},
            timeout=20,
        )
        r.raise_for_status()
        data = r.json()
        claim_id = data.get("claim_id") or data.get("job", {}).get("id")
        if not claim_id:
            out["error"] = f"Missing claim id in submit response: {data}"
            return out

        claim_id = int(claim_id)
        status = "pending"
        start_poll = time.time()

        while (time.time() - start_poll) <= max_wait:
            s = requests.get(f"{base_url}/claims/{claim_id}/status", timeout=15)
            s.raise_for_status()
            status = (s.json().get("claim", {}).get("status") or "").lower()
            if status in {"completed", "failed"}:
                break
            time.sleep(1.5)

        out["claim_id"] = claim_id
        out["status"] = status

        if status == "completed":
            res = requests.get(f"{base_url}/claims/{claim_id}/result", timeout=15)
            res.raise_for_status()
            claim = res.json().get("claim", {})
            out["verdict"] = claim.get("verdict")
            out["confidence_score"] = claim.get("confidence_score")
            out["sources_count"] = len(claim.get("sources") or [])
            out["ok"] = True

        out["elapsed_ms"] = int((time.time() - started) * 1000)
        return out
    except Exception as exc:
        out["elapsed_ms"] = int((time.time() - started) * 1000)
        out["error"] = str(exc)
        return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Fast hackathon readiness check")
    parser.add_argument("--base-url", default="http://127.0.0.1:8080/api/v1")
    parser.add_argument("--output", default="e:/jachaix/scripts/hackathon_readiness_report.json")
    parser.add_argument("--max-wait", type=int, default=35)
    args = parser.parse_args()

    checks = [
        check_health(args.base_url),
        check_kb_status(args.base_url),
        check_quick_claim(
            args.base_url,
            text="WHO says COVID-19 vaccines do not contain microchips.",
            language="international",
            max_wait=args.max_wait,
        ),
    ]

    ok_count = sum(1 for c in checks if c.get("ok"))
    report = {
        "generated_at_unix": int(time.time()),
        "base_url": args.base_url,
        "checks_total": len(checks),
        "checks_passed": ok_count,
        "overall_ok": ok_count == len(checks),
        "checks": checks,
    }

    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))

    return 0 if report["overall_ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
