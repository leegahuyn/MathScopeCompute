#!/usr/bin/env python3
"""Reproduce the scoped derivative audit without a platform-specific launcher."""

from __future__ import annotations

import argparse
import difflib
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def negative_control() -> int:
    tests = load_module("regression_tests", ROOT / "code/test_all_eight_items.py")
    tests.v8 = load_module("original_verifier", ROOT / "reference/verify_all_eight_items.py")
    suite = unittest.TestSuite([
        tests.AllEightItemsTests("test_n706_model_energy_balance_defect_converges_to_zero")
    ])
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


def main() -> int:
    (ROOT / "logs").mkdir(exist_ok=True)
    (ROOT / "evidence").mkdir(exist_ok=True)
    commands = [
        ("baseline_tests", ["reference/test_all_eight_items.py"], 0),
        ("baseline_evaluator", ["reference/verify_all_eight_items.py", "--root", ".", "--out", "evidence/BASELINE_VERIFICATION_RESULTS.json"], 0),
        ("old_formula_negative_control", ["code/run_derivative_audit.py", "--negative-control"], 1),
        ("corrected_tests", ["code/test_all_eight_items.py"], 0),
        ("corrected_evaluator", ["code/verify_all_eight_items.py", "--root", ".", "--out", "evidence/CORRECTED_VERIFICATION_RESULTS.json"], 0),
    ]
    receipts = []
    for name, args, expected_exit_code in commands:
        argv = [sys.executable, "-B", *args]
        run = subprocess.run(argv, cwd=ROOT, capture_output=True, text=True)
        stdout_path = Path("logs") / (name + ".stdout.log")
        stderr_path = Path("logs") / (name + ".stderr.log")
        (ROOT / stdout_path).write_text(run.stdout, encoding="utf-8")
        (ROOT / stderr_path).write_text(run.stderr, encoding="utf-8")
        receipts.append({
            "name": name, "argv": argv, "cwd": str(ROOT),
            "exit_code": run.returncode, "expected_exit_code": expected_exit_code,
            "expected_exit_observed": run.returncode == expected_exit_code,
            "stdout": str(stdout_path), "stderr": str(stderr_path),
        })

    baseline = json.loads((ROOT / "evidence/BASELINE_VERIFICATION_RESULTS.json").read_text())
    archived = json.loads((ROOT / "reference/EIGHT_ITEMS_VERIFICATION_RESULTS.json").read_text())
    corrected = json.loads((ROOT / "evidence/CORRECTED_VERIFICATION_RESULTS.json").read_text())
    old_runs = baseline["n706_n805_verification"]["n706_global_energy_balance"]["refinement_runs"]
    new_runs = corrected["n706_n805_verification"]["n706_global_energy_balance"]["refinement_runs"]
    comparison = []
    for old, new in zip(old_runs, new_runs):
        comparison.append({
            "n_t": new["n_t"], "n_x": new["n_x"],
            "old_energy_balance_defect": old["energy_balance_defect"],
            "corrected_energy_balance_defect": new["energy_balance_defect"],
            "corrected_normalized_defect": new["energy_balance_defect"] / (2 * new["E_final"]),
            "midpoint_normalized_error_bound": 4 / new["n_t"] ** 2,
        })
    diff = ""
    for filename in ("verify_all_eight_items.py", "test_all_eight_items.py"):
        old = (ROOT / "reference" / filename).read_text().splitlines(keepends=True)
        new = (ROOT / "code" / filename).read_text().splitlines(keepends=True)
        diff += "".join(difflib.unified_diff(old, new, fromfile="a/code/" + filename, tofile="b/code/" + filename))
    (ROOT / "DERIVATIVE_FIX.patch").write_text(diff, encoding="utf-8")

    hashes = {}
    for folder in ("code", "reference", "inputs"):
        for path in sorted((ROOT / folder).glob("*")):
            if path.is_file():
                hashes[str(path.relative_to(ROOT))] = hashlib.sha256(path.read_bytes()).hexdigest()
    manifest = json.loads((ROOT / "evidence/INPUT_HASHES.json").read_text())
    source_hashes_preserved_in_copy = all(
        hashes[("inputs/" if row["source_relative"].startswith("inputs/") else "reference/") + Path(row["source_relative"]).name]
        == row["sha256"] for row in manifest["files"]
    )
    negative_log = (ROOT / "logs/old_formula_negative_control.stderr.log").read_text()
    negative_failed_on_energy_assertion = "AssertionError:" in negative_log and "not less than or equal to" in negative_log and "ERROR:" not in negative_log
    receipt = {
        "schema": "mathscope.derivative-model-audit/1",
        "scope": "VERIFIER_MODEL_REPAIR_ONLY_NOT_ACTUAL_GLOBAL_FIELD_PROOF",
        "baseline_reproduces_archived_v5_results_exactly": baseline == archived,
        "input_and_reference_hashes_match_source_manifest": source_hashes_preserved_in_copy,
        "old_formula_negative_control_failed_on_energy_assertion": negative_failed_on_energy_assertion,
        "commands": receipts,
        "energy_comparison": comparison,
        "file_sha256": hashes,
        "original_m3_completed_count_changed": False,
        "actual_global_field_energy_certified": False,
    }
    passed = all(r["expected_exit_observed"] for r in receipts) and baseline == archived and source_hashes_preserved_in_copy and negative_failed_on_energy_assertion
    receipt["scoped_audit_passed"] = passed
    (ROOT / "evidence/EXECUTION_RECEIPT.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "scoped_audit_passed": passed,
        "baseline_reproduces_archived_v5_results_exactly": baseline == archived,
        "old_formula_negative_control_failed_on_energy_assertion": negative_failed_on_energy_assertion,
        "energy_comparison": comparison,
        "exit_codes": {r["name"]: r["exit_code"] for r in receipts},
    }, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--negative-control", action="store_true", help="Run new regression against preserved old evaluator; failure is expected.")
    options = parser.parse_args()
    raise SystemExit(negative_control() if options.negative_control else main())
