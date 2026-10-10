#!/usr/bin/env python3
"""Append-only kernel execution of the actual new pressure mass bound."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
AXIS = HERE.parent.parent / "followup-20261010-same-datum-axis"
BASE = AXIS / "formal-input-producer/attempts/0012"
BASE_SHA = "9f80d62caa58f5b4076eda552286752ad598c7214c1bafaf01778f7a02a5f5af"
AUDIT = Path("/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/official-validation")
REPO = AUDIT / "repo"
COMMIT = "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
KERNEL = AUDIT / "lean-4.34.0-rc2-linux/lib/lean/libleanshared.so"
KERNEL_SHA = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def tracked_hashes():
    names = subprocess.check_output(["git", "ls-files", "-z"], cwd=REPO).decode().split("\0")
    return {n: sha(REPO/n) for n in names if n and (REPO/n).is_file()}


def main():
    assert sha(BASE / "SameDatumInputs.lean") == BASE_SHA
    assert (BASE / "SameDatumInputs.olean").is_file()
    assert json.loads((BASE / "receipt.json").read_text())["status"] == "PASS"
    assert sha(KERNEL) == KERNEL_SHA
    assert subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=REPO, text=True).strip() == COMMIT
    number = 1
    while (HERE / "attempts" / f"{number:04d}").exists():
        number += 1
    dest = HERE / "attempts" / f"{number:04d}"
    dest.mkdir(parents=True)
    source = dest / "PressureSelection.lean"
    source.write_bytes((HERE / "PressureSelection.lean").read_bytes())
    (dest / "SameDatumInputs.lean").write_bytes((BASE / "SameDatumInputs.lean").read_bytes())
    (dest / "base-receipt.json").write_bytes((BASE / "receipt.json").read_bytes())
    (dest / "runner.py").write_bytes(Path(__file__).read_bytes())
    before = tracked_hashes()
    env = os.environ.copy()
    for name in ("GITHUB_TOKEN", "GH_TOKEN", "LEAN_PATH", "LEAN_SRC_PATH"):
        env.pop(name, None)
    for name in list(env):
        if name.startswith("COMPARATOR_"):
            env.pop(name)
    env["PATH"] = str(AUDIT / "lean-entry-layout/bin") + os.pathsep + env.get("PATH", "")
    env["LEAN_SYSROOT"] = str(AUDIT / "lean-entry-layout")
    env["LAKE_HOME"] = str(AUDIT / "lake-home")
    env["MATHLIB_CACHE_DIR"] = str(AUDIT / "mathlib-cache")
    env["LAKE_CACHE_DIR"] = str(AUDIT / "lake-cache")
    env["LEAN_PATH"] = str(BASE)
    cmd = [str(AUDIT / "lean-4.34.0-rc2-linux/bin/lake"), "env", "lean",
           "--root", str(dest), "-o", str(dest / "PressureSelection.olean"), str(source)]
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with (dest / "lean.log").open("w") as log:
        p = subprocess.run(cmd, cwd=REPO, env=env, stdout=log, stderr=subprocess.STDOUT)
    after = tracked_hashes()
    output = (dest / "lean.log").read_text()
    axioms = {name: [a.strip() for a in body.split(",") if a.strip()]
              for name, body in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]", output, re.S)}
    allow = {"propext", "Classical.choice", "Quot.sound"}
    expected = {"MathScope.SameDatumInputs." + name for name in [
        "newTailDebt_bounds", "newTailDebt_small", "newDecayHold_pos", "newDecayHold_hits_target",
        "newClockWeight_ideal", "newShapeExponent_ideal", "newPressure_pressureData"]}
    ax_ok = set(axioms) == expected and all(set(a) <= allow for a in axioms.values())
    final_kernel = sha(KERNEL)
    current_base = sha(BASE / "SameDatumInputs.lean")
    passed = p.returncode == 0 and before == after and ax_ok and final_kernel == KERNEL_SHA and current_base == BASE_SHA
    for label, values in [("before", before), ("after", after)]:
        (dest / ("original-source-hashes-" + label + ".json")).write_text(json.dumps(values, indent=2) + "\n")
    receipt = {
        "schema": "MathScope.Navier.ActualNewPressureSelectionKernelCheck/1",
        "status": "PASS" if passed else "FAIL",
        "startedUTC": started, "finishedUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "command": cmd, "cwd": str(REPO), "exitCode": p.returncode,
        "sourceSHA256": sha(source), "runnerSHA256": sha(Path(__file__)),
        "logSHA256": sha(dest / "lean.log"),
        "base": {"source": str(BASE / "SameDatumInputs.lean"), "sourceSHA256": BASE_SHA,
                 "oleanSHA256": sha(BASE / "SameDatumInputs.olean"),
                 "receiptSHA256": sha(BASE / "receipt.json"), "unchanged": current_base == BASE_SHA},
        "originalCommit": COMMIT, "kernelSHA256Before": KERNEL_SHA, "kernelSHA256After": final_kernel,
        "originalTrackedFileCount": len(before), "originalTrackedFilesPreserved": before == after,
        "printedAxioms": axioms, "onlyExpectedStandardAxioms": ax_ok,
        "scope": "Actual selected Tf=128, co=1/256 tail debt, positive logarithmic wait, exact ideal prefix, and original PressureData for the new integral.",
        "originalFourKMathematicalEstimateReplaced": False,
        "fullAnalyticInputProducerCompleted": False,
        "fullOriginalN303Completion": False,
    }
    if (dest / "PressureSelection.olean").exists():
        receipt["oleanSHA256"] = sha(dest / "PressureSelection.olean")
    (dest / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"attempt": str(dest), "status": receipt["status"], "exitCode": p.returncode}))
    print(output)
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
