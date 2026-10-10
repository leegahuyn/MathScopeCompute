#!/usr/bin/env python3
"""Read-only portable verification of the actual original-kernel receipt."""
import hashlib
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
EXPECTED = {"MathScope.ThresholdBridge." + name for name in (
    "coefficient_norm_bounds", "originalBound_le_polynomial", "originalLip_le_polynomial",
    "original_threshold_le", "original_sharp_error", "exists_unique_fixedPoint_at_Q64")}
ALLOWED = {"propext", "Classical.choice", "Quot.sound"}
PIN = "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
KERNEL = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit(directory):
    receipt = json.loads((directory / "receipt.json").read_text())
    log = (directory / "lean.log").read_text()
    parsed = {name: [value.strip() for value in values.split(",") if value.strip()]
              for name, values in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]", log, re.S)}
    before = json.loads((directory / "original-source-hashes-before.json").read_text())
    after = json.loads((directory / "original-source-hashes-after.json").read_text())
    checks = {
        "actual_exit_zero": receipt["exitCode"] == 0,
        "recorded_status_pass": receipt["status"] == "PASS",
        "source_snapshot_hash": sha(directory / "ThresholdBridge.lean") == receipt["sourceSHA256"],
        "all_six_actual_prints": EXPECTED <= set(parsed),
        "axiom_parse_matches_record": parsed == receipt["printedAxioms"],
        "only_three_standard_axioms": all(set(values) <= ALLOWED for values in parsed.values()),
        "no_error_recovery_axiom": "sorryAx" not in log,
        "no_kernel_error": ": error:" not in log,
        "official_commit_pin": receipt["originalCommit"] == PIN,
        "official_kernel_before": receipt["kernelSHA256"] == KERNEL,
        "official_kernel_after": receipt.get("kernelSHA256After") == KERNEL,
        "actual_source_dictionary_equal": before == after,
        "all_original_tracked_files": len(before) == 2669,
        "all_original_digests_well_formed": all(re.fullmatch(r"[0-9a-f]{64}", value) for value in before.values()),
        "record_retains_open_original_gate": receipt["fullOriginalN303Completion"] is False,
        "record_retains_open_actual_producer": receipt["fullAnalyticInputProducerCompleted"] is False,
    }
    return checks


def main():
    accepted = HERE / "attempts/0004"
    checks = audit(accepted)
    receipt = json.loads((accepted / "receipt.json").read_text())
    checks["current_source_is_checked_source"] = sha(HERE / "ThresholdBridge.lean") == receipt["sourceSHA256"]
    checks["current_runner_is_recorded_runner"] = sha(HERE / "run_check.py") == receipt["runnerSHA256"]
    for name in ("0002", "0003"):
        earlier = audit(HERE / "attempts" / name)
        checks["reject_failed_attempt_" + name] = not all(earlier.values()) and not earlier["no_error_recovery_axiom"]
    if not all(checks.values()):
        raise SystemExit(json.dumps({"status": "FAIL", "failed": [name for name, ok in checks.items() if not ok]}))
    print(json.dumps({"schema": "MathScope.ThresholdPortableAudit/1", "status": "PASS",
                      "passed": sum(checks.values()), "total": len(checks), "checks": checks,
                      "acceptedReceiptSHA256": sha(accepted / "receipt.json"),
                      "auditType": "RECORDED_EVIDENCE_ONLY_NOT_NEW_KERNEL_EXECUTION"}, indent=2))


if __name__ == "__main__":
    main()
