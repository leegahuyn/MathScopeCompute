#!/usr/bin/env python3
"""Portable, read-only audit of two concrete original-kernel input receipts.

This verifies recorded executions and their exact dependencies. It does not
pretend that replaying JSON is another kernel execution or a new theorem.
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
PIN = "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
KERNEL = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"
ALLOWED = {"propext", "Classical.choice", "Quot.sound"}
COMPONENTS = [
    ("formal-pressure-selection", "0001", "PressureSelection", (
        "newTailDebt_bounds", "newTailDebt_small", "newDecayHold_pos", "newDecayHold_hits_target",
        "newClockWeight_ideal", "newShapeExponent_ideal", "newPressure_pressureData")),
    ("formal-amplitude-input", "0002", "AmplitudeInput", (
        "actualPhase_analytic", "actualPhase_derivative", "actualPhase_norm", "actualComplexAmplitude_norm",
        "actualAmplitudeInput_norm", "actualAmplitudeInput_coefficient", "actualAmplitudeInput_radial",
        "actualAmplitudeInput_value")),
]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def json_read(path):
    return json.loads(path.read_text())


def portable_path(recorded):
    """Map an archived executor path to its fixed sibling within this edition."""
    parts = Path(recorded).parts
    roots = [i for i, name in enumerate(parts) if name.startswith("followup-20261010-")]
    if len(roots) != 1 or ".." in parts:
        raise ValueError("Unexpected archived dependency location")
    target = NAVIER.joinpath(*parts[roots[0]:])
    if target.is_symlink() or not target.exists():
        raise ValueError("Missing or linked dependency")
    return target


def parse_axioms(log):
    return {name: [part.strip() for part in body.split(",") if part.strip()]
            for name, body in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]", log, re.S)}


def component_checks(folder, attempt, module, names):
    root = HERE / folder
    directory = root / "attempts" / attempt
    r = json_read(directory / "receipt.json")
    log = (directory / "lean.log").read_text()
    axioms = parse_axioms(log)
    expected = {"MathScope.SameDatumInputs." + name for name in names}
    before = json_read(directory / "original-source-hashes-before.json")
    after = json_read(directory / "original-source-hashes-after.json")
    checks = {
        "exit_zero": r["exitCode"] == 0,
        "status_pass": r["status"] == "PASS",
        "source_snapshot": sha(directory / (module + ".lean")) == r["sourceSHA256"],
        "current_source_same": sha(root / (module + ".lean")) == r["sourceSHA256"],
        "compiled_output": sha(directory / (module + ".olean")) == r["oleanSHA256"],
        "actual_log_hash": sha(directory / "lean.log") == r["logSHA256"],
        "runner_snapshot": sha(directory / "runner.py") == r["runnerSHA256"],
        "all_expected_axioms_printed": set(axioms) == expected,
        "axioms_match_receipt": axioms == r["printedAxioms"],
        "only_standard_axioms": all(set(values) <= ALLOWED for values in axioms.values()),
        "no_error_recovery": "sorryAx" not in log,
        "no_lean_error": ": error:" not in log,
        "original_commit": r["originalCommit"] == PIN,
        "original_kernel_before": r["kernelSHA256Before"] == KERNEL,
        "original_kernel_after": r["kernelSHA256After"] == KERNEL,
        "all_original_files_preserved": before == after and len(before) == 2669,
        "complete_source_digests": all(re.fullmatch("[0-9a-f]{64}", value) for value in before.values()),
        "finite_to_infinite_not_claimed_by_component": r["fullOriginalN303Completion"] is False,
    }
    base = r["base"]
    source = portable_path(base["source"])
    checks["actual_base_source"] = sha(source) == base["sourceSHA256"]
    checks["actual_base_object"] = sha(source.with_suffix(".olean")) == base["oleanSHA256"]
    checks["actual_base_receipt"] = sha(source.parent / "receipt.json") == base["receiptSHA256"]
    checks["actual_base_success"] = json_read(source.parent / "receipt.json")["status"] == "PASS"
    for d in r.get("dependencies", []):
        directory = portable_path(d["directory"])
        name = d["module"]
        checks[name + "_source"] = sha(directory / (name + ".lean")) == d["sourceSHA256"]
        checks[name + "_object"] = sha(directory / (name + ".olean")) == d["oleanSHA256"]
        checks[name + "_receipt"] = sha(directory / "receipt.json") == d["receiptSHA256"]
        checks[name + "_success"] = json_read(directory / "receipt.json")["status"] == "PASS"
    return checks, r


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    checks, accepted = {}, []
    for folder, attempt, module, names in COMPONENTS:
        result, r = component_checks(folder, attempt, module, names)
        checks.update({module + ":" + key: value for key, value in result.items()})
        accepted.append({"module": module, "receipt": folder + "/attempts/" + attempt + "/receipt.json",
                         "receiptSHA256": sha(HERE / folder / "attempts" / attempt / "receipt.json"),
                         "sourceSHA256": r["sourceSHA256"], "auditedDeclarations": len(names)})
    failed = HERE / "formal-amplitude-input/attempts/0001"
    failed_record = json_read(failed / "receipt.json")
    failed_log = (failed / "lean.log").read_text()
    checks["negative_control_failed_amplitude_exit"] = failed_record["exitCode"] != 0
    checks["negative_control_failed_amplitude_status"] = failed_record["status"] == "FAIL"
    checks["negative_control_detects_error_recovery"] = "sorryAx" in failed_log and ": error:" in failed_log
    result = {
        "schema": "MathScope.ActualInputReceiptAudit/1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "observedUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "passed": sum(checks.values()), "total": len(checks), "checks": checks,
        "accepted": accepted, "verifierSHA256": sha(Path(__file__)),
        "auditType": "RECORDED_EXECUTION_AND_INPUT_HASH_AUDIT_NOT_NEW_KERNEL_EXECUTION",
    }
    data = json.dumps(result, indent=2) + "\n"
    if args.output:
        if args.output.exists():
            raise ValueError("Refusing to overwrite an audit")
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(data)
    print(data)
    return int(result["status"] != "PASS")


if __name__ == "__main__":
    raise SystemExit(main())
