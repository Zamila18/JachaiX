import argparse
import json
from pathlib import Path


def load_json(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def false_precision(report: dict) -> float:
    return float(report.get("metrics", {}).get("per_class", {}).get("false", {}).get("precision", 0.0))


def macro_f1(report: dict) -> float:
    return float(report.get("metrics", {}).get("macro_f1", 0.0))


def main() -> int:
    parser = argparse.ArgumentParser(description="Fail CI when quality floors are not met")
    parser.add_argument("--human-report", required=True)
    parser.add_argument("--multilingual-report", required=True)
    parser.add_argument("--false-precision-floor", type=float, default=0.75)
    parser.add_argument("--multilingual-false-precision-floor", type=float, default=0.70)
    parser.add_argument("--macro-f1-floor", type=float, default=0.45)
    args = parser.parse_args()

    human = load_json(args.human_report)
    multilingual = load_json(args.multilingual_report)

    human_false_precision = false_precision(human)
    multilingual_false_precision = false_precision(multilingual)
    human_macro_f1 = macro_f1(human)
    multilingual_macro_f1 = macro_f1(multilingual)

    print("=== Quality Gate ===")
    print(f"Human false precision         : {human_false_precision:.4f}")
    print(f"Multilingual false precision  : {multilingual_false_precision:.4f}")
    print(f"Human macro F1               : {human_macro_f1:.4f}")
    print(f"Multilingual macro F1        : {multilingual_macro_f1:.4f}")
    print(f"Required human false precision       >= {args.false_precision_floor:.4f}")
    print(f"Required multilingual false precision>= {args.multilingual_false_precision_floor:.4f}")
    print(f"Required macro F1                     >= {args.macro_f1_floor:.4f}")

    failures = []
    if human_false_precision < args.false_precision_floor:
        failures.append(
            f"Human false precision {human_false_precision:.4f} is below floor {args.false_precision_floor:.4f}"
        )
    if multilingual_false_precision < args.multilingual_false_precision_floor:
        failures.append(
            "Multilingual false precision "
            f"{multilingual_false_precision:.4f} is below floor {args.multilingual_false_precision_floor:.4f}"
        )
    if human_macro_f1 < args.macro_f1_floor:
        failures.append(f"Human macro F1 {human_macro_f1:.4f} is below floor {args.macro_f1_floor:.4f}")
    if multilingual_macro_f1 < args.macro_f1_floor:
        failures.append(
            f"Multilingual macro F1 {multilingual_macro_f1:.4f} is below floor {args.macro_f1_floor:.4f}"
        )

    if failures:
        print("\nQUALITY GATE FAILED")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nQUALITY GATE PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
