#!/usr/bin/env python3
"""Actually check the conditional cone theorems in the pinned original kernel.

The original environment must already have been installed and built.
Every attempt has its own preserved source, log and result record.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parents[1]
AUDIT = NAVIER / "official-validation"
REPO = AUDIT / "repo"
KERNEL = AUDIT / "lean-4.34.0-rc2-linux/lib/lean/libleanshared.so"
KERNEL_SHA = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"
PIN = "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
THEOREMS = [
    "MathScope.OuterReselection.normalized_threshold_nine",
    "MathScope.OuterReselection.paper_relaxed_threshold_nine",
    "MathScope.OuterReselection.paper_admissible_threshold_nine",
    "MathScope.OuterReselection.zero_axial_shear_is_not_admissible",
    "MathScope.OuterReselection.normalized_outer_threshold",
    "MathScope.OuterReselection.paper_relaxed_outer_threshold",
    "MathScope.OuterReselection.paper_admissible_outer_threshold",
]
EXPECTED_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}


def sha(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for data in iter(lambda: f.read(1024 * 1024), b""):
            h.update(data)
    return h.hexdigest()


def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def tracked_hashes():
    names = subprocess.check_output(["git", "ls-files", "-z"], cwd=REPO).split(b"\0")
    return {os.fsdecode(n): sha(REPO/os.fsdecode(n)) for n in names if n}


def run():
    if not KERNEL.is_file() or not REPO.is_dir():
        raise FileNotFoundError("The pinned original Lean environment is not installed.")
    if sha(KERNEL) != KERNEL_SHA:
        raise ValueError("The original kernel hash does not match the pin.")
    if subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=REPO, text=True).strip() != PIN:
        raise ValueError("The original repository commit does not match the pin.")

    attempts = HERE/"attempts"
    attempts.mkdir(exist_ok=True)
    number = 1
    while (attempts/f"{number:04d}").exists():
        number += 1
    target = attempts/f"{number:04d}"
    target.mkdir()
    source = target/"ConeThreshold.lean"
    source.write_bytes((HERE/"ConeThreshold.lean").read_bytes())
    before = tracked_hashes()
    (target/"original-source-hashes-before.json").write_text(json.dumps(before, indent=2)+"\n")
    env = os.environ.copy()
    for name in ("GITHUB_TOKEN", "GH_TOKEN", "LEAN_PATH", "LEAN_SRC_PATH"):
        env.pop(name, None)
    for name in list(env):
        if name.startswith("COMPARATOR_"):
            env.pop(name)
    env["PATH"] = str(AUDIT/"lean-entry-layout/bin") + os.pathsep + env.get("PATH", "")
    env["LEAN_SYSROOT"] = str(AUDIT/"lean-entry-layout")
    env["LAKE_HOME"] = str(AUDIT/"lake-home")
    env["MATHLIB_CACHE_DIR"] = str(AUDIT/"mathlib-cache")
    env["LAKE_CACHE_DIR"] = str(AUDIT/"lake-cache")
    command = [str(AUDIT/"lean-4.34.0-rc2-linux/bin/lake"),
               "env", "lean", "--root", str(target), str(source)]
    result = {
        "schema": "MathScope.OriginalKernelConeThresholdCheck/1",
        "status": "RUNNING", "startedUTC": utc(), "command": command,
        "cwd": str(REPO), "originalCommit": PIN, "kernelSHA256": KERNEL_SHA,
        "sourceSHA256": sha(source), "theorems": THEOREMS, "exitCode": None,
        "executionProfile": "Previously audited explicit installation-path entry using the original rc2 kernel.",
        "analyticPremisesInstantiatedForAnExactProfile": False,
        "globalProfileCertified": False, "originalGateClosed": False,
    }
    receipt = target/"result.json"
    receipt.write_text(json.dumps(result, indent=2)+"\n")
    with (target/"lean.log").open("w") as log:
        process = subprocess.run(command, cwd=REPO, env=env, stdout=log,
                                 stderr=subprocess.STDOUT, text=True)
    after = tracked_hashes()
    (target/"original-source-hashes-after.json").write_text(json.dumps(after, indent=2)+"\n")
    output = (target/"lean.log").read_text()
    axioms = {}
    for theorem in THEOREMS:
        found = re.search(re.escape("'" + theorem + "'") +
                          r" depends on axioms:\s*\[([^\]]*)\]", output, re.S)
        if found:
            axioms[theorem] = [x.strip() for x in found.group(1).split(",") if x.strip()]
        elif re.search(re.escape("'" + theorem + "'") +
                       r" does not depend on any axioms", output):
            axioms[theorem] = []
        else:
            axioms[theorem] = None
    source_ok = before == after
    kernel_ok = sha(KERNEL) == KERNEL_SHA
    checked_source_ok = sha(source) == result["sourceSHA256"]
    audit_ok = all(v is not None and set(v) <= EXPECTED_AXIOMS for v in axioms.values())
    result.update({
        "status": "PASSED" if process.returncode == 0 and source_ok and kernel_ok and audit_ok and checked_source_ok else "FAILED",
        "exitCode": process.returncode, "completedUTC": utc(),
        "logSHA256": sha(target/"lean.log"), "axioms": axioms,
        "originalTrackedSourceBytesUnchanged": source_ok,
        "originalKernelBytesUnchanged": kernel_ok,
        "checkedSourceBytesUnchanged": checked_source_ok,
        "allExpectedAxiomAuditsPresentAndAllowed": audit_ok,
        "proofScope": "Conditional constant-box cone threshold in the original predicates, including the zero-shear distinction.",
    })
    receipt.write_text(json.dumps(result, indent=2)+"\n")
    (HERE/"latest-result.json").write_text(json.dumps({
        "attempt": target.relative_to(HERE).as_posix(),
        "resultSHA256": sha(receipt), "status": result["status"],
        "actualExitCode": process.returncode, "checkedTheorems": len(THEOREMS) if audit_ok else 0,
        "analyticPremisesInstantiated": False, "originalGateClosed": False,
    }, indent=2)+"\n")
    print(json.dumps({"status": result["status"], "exitCode": process.returncode,
                      "attempt": str(target), "axiomAuditsPassed": audit_ok,
                      "sourceUnchanged": source_ok, "kernelUnchanged": kernel_ok}, indent=2))
    return 0 if result["status"] == "PASSED" else 1


if __name__ == "__main__":
    raise SystemExit(run())
