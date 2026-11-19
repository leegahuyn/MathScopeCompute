"""Run isolated Python checks for the pinned batch and retain every receipt."""

from argparse import ArgumentParser
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess
import sys


parser = ArgumentParser()
parser.add_argument("graphs", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("flow", type=Path)
parser.add_argument("system", type=int, choices=(3, 5, 7))
parser.add_argument("--workers", type=int, default=3)
parser.add_argument("--caller", type=int, action="append")
parser.add_argument("--control", choices=("binders", "guards", "radial-frame"))
args = parser.parse_args()
assert 1 <= args.workers <= 4
args.output.mkdir(parents=True, exist_ok=True)
manifest = args.graphs / f"system-{args.system}-manifest.json"
manifest_data = json.loads(manifest.read_bytes())
rows = [row for row in manifest_data["manifest"] if not args.caller or row["caller"] in args.caller]
assert len(rows) == (len(args.caller) if args.caller else {3: 30, 5: 26, 7: 15}[args.system])
top = args.flow / "y-picard-callers" / "top-calls.json"
lower = args.flow / "y-picard-callers" / "lower-calls.json"
verifier = Path(__file__).with_name("verify_site.py")


def run(row):
    caller = row["caller"]
    suffix = "" if args.control is None else f"-no-{args.control}"
    destination = args.output / f"{caller}{suffix}.json"
    command = [sys.executable, "-B", str(verifier), str(args.graphs / row["file"]), str(destination),
               str(manifest), str(top), str(lower), "--include-native-ingress"]
    if args.control is not None:
        command.append(f"--drop-{args.control}")
    completed = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", check=False)
    if completed.returncode:
        return {"caller": caller, "error": completed.stderr, "exit_code": completed.returncode}
    raw = destination.read_bytes()
    record = json.loads(raw)
    assert record["source_caller"] == caller and record["graph_sha256"] == row["sha256"]
    output = {key: record[key] for key in (
        "source_caller", "source_system", "source_saved_args", "source_ingress_kind", "reached_nodes",
        "fresh_natural_targets", "inherited_natural_targets", "certified_natural_targets",
        "certified_fresh_natural_targets", "certified_inherited_natural_targets", "open_natural_targets",
        "fresh_native_ingress_targets", "certified_native_ingress_targets", "open_native_ingress_targets",
        "status",
    )}
    output["receipt_sha256"] = hashlib.sha256(raw).hexdigest()
    return output


with ThreadPoolExecutor(max_workers=args.workers) as pool:
    records = list(pool.map(run, rows))
failed = [r for r in records if "error" in r]
passed = [r for r in records if r.get("status") == "PASS_ALL_HIGHER_FAMILY_ARGUMENTS"]
control = args.control or "positive"
summary = {
    "system": args.system,
    "original_site_count": len(rows),
    "checks": control,
    "verified_sites": len(passed),
    "materialization_or_validator_errors": failed,
    "counts_by_ingress": dict(Counter(r["source_ingress_kind"] for r in passed)),
    "reached_nodes_summed_across_sites": sum(r.get("reached_nodes", 0) for r in records),
    "fresh_natural_sum": sum(r.get("certified_fresh_natural_targets", 0) for r in records),
    "inherited_natural_sum": sum(r.get("certified_inherited_natural_targets", 0) for r in records),
    "certified_explicit_native_sum": sum(sum(r.get("certified_native_ingress_targets", {}).values()) for r in records),
    "open_natural_sum": sum(r.get("open_natural_targets", 0) for r in records),
    "open_explicit_native_sum": sum(sum(r.get("open_native_ingress_targets", {}).values()) for r in records),
    "records": records,
}
name = f"system-{args.system}-{control}"
if args.caller:
    name += "-" + "-".join(map(str, args.caller))
(args.output / f"{name}.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in summary.items() if k != "records"}))
if failed:
    sys.exit(1)
