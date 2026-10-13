#!/usr/bin/env python3
"""Read-only, bounded GitHub Actions replay of the eight OPEN M3 criteria.

A passing finite test NEVER promotes originalCriterionComplete.
The final field, analytic domain obligations, and error enclosures remain distinct.
Run from any working directory, with Python >=3.12 and Node >=24 installed.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
BASE = "research-ide/mathscope-m3/"
CRITERIA = (
    "N6-01", "N6-02", "N6-07", "N6-08",
    "N7-04", "N7-05", "N7-06", "N8-05",
)
# These are real, checked-in tests. N7-06 tests a GENERIC finite model only;
# its success is explicitly not evidence of whole-K paper energy.
SMOKE = (
    ("N6-01", "navier/tests/saved-five-mean-change-norms.test.mjs", "SOURCE_PARTIAL"),
    ("N6-02", "navier/tests/saved-whole-mean-direct-audit.test.mjs", "SOURCE_CONDITIONAL"),
    ("N6-07", "navier/tests/iteration-decay.test.mjs", "THEOREM_IMPLICATION_ONLY"),
    ("N6-08", "navier/final-summation/tests/source-final-summation.test.mjs", "CONDITIONAL_CUTOFF"),
    ("N7-04", "navier/tests/source-exterior-force-jets.test.mjs", "EXTERIOR_ONLY"),
    ("N7-05", "navier/terminal-extension/tests/source-terminal-cutoff-schedule.test.mjs", "CONDITIONAL_JETS"),
    ("N7-06", "navier/tests/flow-interface.test.mjs", "GENERIC_MODEL_ONLY"),
    ("N8-05", "navier/tests/temporal-cutoff-refinement.test.mjs", "PRE_TEMPORAL_TAIL_ONLY"),
)
EXTENDED = (
    ("N6-01", "navier/tests/saved-five-mean-change-integrated.test.mjs", "SOURCE_PARTIAL"),
    ("N6-02", "navier/tests/saved-monotone-implicit-derivatives.test.mjs", "CONDITIONAL_BRANCH"),
    ("N6-02", "navier/tests/saved-quadratic-implicit-derivatives.test.mjs", "CONDITIONAL_BRANCH"),
    ("N6-07", "navier/tests/source-localization.test.mjs", "SOURCE_DOMAIN_ONLY"),
    ("N7-06", "navier/tests/flow-observations.test.mjs", "GENERIC_MODEL_ONLY"),
    ("N8-05", "navier/tests/source-core-refinement.test.mjs", "CORE_ONLY"),
)
EVIDENCE_ENV = {
    "saved-five-mean-change-norms.test.mjs": ("M3_SAVED_FIVE_CHANGE_EVIDENCE", "saved-five-norms.json", False),
    "saved-five-mean-change-integrated.test.mjs": ("M3_SAVED_FIVE_INTEGRATED_EVIDENCE", "saved-five-integrated.json", False),
    "saved-whole-mean-direct-audit.test.mjs": ("MATHSCOPE_WHOLE_MEAN_AUDIT_EVIDENCE_DIR", "whole-mean", True),
    "saved-monotone-implicit-derivatives.test.mjs": ("MATHSCOPE_MONOTONE_AUDIT_EVIDENCE_DIR", "monotone", True),
    "saved-quadratic-implicit-derivatives.test.mjs": ("MATHSCOPE_QUADRATIC_IMPLICIT_EVIDENCE_DIR", "quadratic", True),
    "temporal-cutoff-refinement.test.mjs": ("M3_TEMPORAL_CUTOFF_REFINEMENT_EVIDENCE", "temporal-tail.json", False),
}

def utc() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()

def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def cmd_output(*args: str) -> str:
    return subprocess.check_output(args, cwd=ROOT, text=True, stderr=subprocess.STDOUT).strip()

def tap_number(key: str, value: str):
    matches = re.findall(r"^# " + re.escape(key) + r" (\d+)$", value, flags=re.M)
    return int(matches[-1]) if matches else None

def ledger_snapshot():
    original = json.loads((ROOT / BASE / "ORIGINAL_M3_M4_CRITERIA.json").read_text(encoding="utf-8"))
    stated = {entry["id"]: entry for entry in original["criteria"]}
    states = {}
    for module in ("N6", "N7", "N8"):
        data = json.loads((ROOT / BASE / (module + "_PROGRESS.json")).read_text(encoding="utf-8"))
        for entry in data["criteria"]:
            if entry["id"] in CRITERIA:
                states[entry["id"]] = {
                    "id": entry["id"],
                    "title": entry.get("title"),
                    "assessmentStatus": entry.get("status"),
                    "originalCriterionComplete": entry.get("originalCriterionComplete"),
                    "remainingObligations": entry.get("remainingObligations", []),
                    "criterionText": stated[entry["id"]]["text"],
                    "blueprintPage": stated[entry["id"]]["page"],
                    "entryWasReadOnly": True,
                }
    if set(states) != set(CRITERIA):
        raise ValueError("The eight original M3 acceptance criteria changed or went missing.")
    return [states[k] for k in CRITERIA]

def source_inventory(selected):
    # Source hash manifest is independent of passing assertions in any old receipt.
    candidates = [str(ROOT / BASE / x) for _, x, _ in selected]
    candidates += [
        str(ROOT / BASE / "ORIGINAL_M3_M4_CRITERIA.json"),
        str(ROOT / BASE / "N6_PROGRESS.json"),
        str(ROOT / BASE / "N7_PROGRESS.json"),
        str(ROOT / BASE / "N8_PROGRESS.json"),
        str(Path(__file__).resolve()),
    ]
    for component in ("source-saved-initialized-authority.mjs",
                      "source-saved-whole-mean-direct-audit.mjs",
                      "source-saved-monotone-implicit-derivatives.mjs",
                      "source-saved-quadratic-implicit-derivatives.mjs",
                      "source-global-initial-mean.mjs",
                      "source-global-pressure.mjs",
                      "source-iteration-decay.mjs",
                      "shrinking-cutoff-summation.mjs",
                      "source-localization-domain.mjs",
                      "source-exterior-force-jets.mjs",
                      "source-core-refinement.mjs"):
        candidates.append(str(ROOT / BASE / "navier" / component))
    inventory = {}
    for value in sorted(set(candidates)):
        path = Path(value).resolve()
        if ROOT not in path.parents or not path.is_file():
            raise ValueError("Missing or unexpected original source file: " + value)
        inventory[path.relative_to(ROOT).as_posix()] = {
            "sha256": digest(path), "bytes": path.stat().st_size,
        }
    return inventory

def run_one(index, cid, relative, classification, args, output: Path):
    test = ROOT / BASE / relative
    evidence_dir = output / ("evidence-%02d" % index)
    evidence_dir.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    name = test.name
    if name in EVIDENCE_ENV:
        key, item, is_dir = EVIDENCE_ENV[name]
        dest = evidence_dir / item
        if is_dir:
            dest.mkdir()
        env[key] = str(dest)
    command = [
        "node", "--max-old-space-size=%d" % args.node_heap_mib,
        "--test", "--test-reporter=tap", "--test-concurrency=1", str(test)
    ]
    started = time.monotonic()
    began = utc()
    out = ""
    err = ""
    code = None
    stop_reason = None
    try:
        proc = subprocess.Popen(command, cwd=ROOT, env=env, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, text=True, errors="replace",
                                start_new_session=os.name != "nt")
        try:
            out, err = proc.communicate(timeout=args.wall_seconds)
        except subprocess.TimeoutExpired:
            stop_reason = "TIME_LIMIT"
            if os.name != "nt":
                os.killpg(proc.pid, signal.SIGKILL)
            else:
                proc.kill()
            out, err = proc.communicate()
        code = proc.returncode
    except Exception as exc:
        stop_reason = "HARNESS_ERROR"
        err += "\n" + repr(exc)
    log = output / ("%02d.tap" % index)
    stderr = output / ("%02d.stderr.txt" % index)
    log.write_text(out, encoding="utf-8")
    stderr.write_text(err, encoding="utf-8")
    count = tap_number("tests", out)
    passed = tap_number("pass", out)
    failed = tap_number("fail", out)
    skipped = tap_number("skipped", out)
    status = ("PASS_FINITE_TEST" if code == 0 and stop_reason is None
              and count is not None and count > 0 and passed == count
              and failed == 0 and (skipped in (0, None))
              else "TIME_LIMIT" if stop_reason == "TIME_LIMIT" else "FAIL_OR_UNVERIFIED")
    evidence = []
    for file in sorted(evidence_dir.rglob("*")):
        if file.is_file():
            evidence.append({
                "path": file.relative_to(output).as_posix(),
                "bytes": file.stat().st_size, "sha256": digest(file)
            })
    return {
        "criterion": cid, "script": (BASE + relative), "classification": classification,
        "startedAt": began, "finishedAt": utc(),
        "command": command, "exitCode": code, "stopReason": stop_reason,
        "seconds": round(time.monotonic() - started, 3), "status": status,
        "tap": {"tests": count, "passed": passed, "failed": failed, "skipped": skipped,
                "path": log.name, "sha256": digest(log)},
        "stderr": {"path": stderr.name, "sha256": digest(stderr)},
        "evidence": evidence,
        "originalCriterionCertifiedByThisTest": False,
        "theoremProvedByThisTest": False,
        "globalFinalNavierStokesFieldReconstructed": False,
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", choices=("smoke", "extended"), default="smoke")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--wall-seconds", type=int, default=180)
    parser.add_argument("--node-heap-mib", type=int, default=1536)
    args = parser.parse_args()
    if not (10 <= args.wall_seconds <= 600 and 256 <= args.node_heap_mib <= 4096):
        parser.error("Use 10..600 wall seconds per test and 256..4096 MiB of Node heap.")
    selected = list(SMOKE) + (list(EXTENDED) if args.profile == "extended" else [])
    out = args.output.resolve()
    if out == ROOT or ROOT in out.parents:
        parser.error("Outputs must be outside the tracked repository.")
    out.mkdir(parents=True, exist_ok=True)
    ledger = ledger_snapshot()
    before = source_inventory(selected)
    report = {
        "schema": "MathScope.M3.RemainingEightCloudReplay/1",
        "startedAt": utc(),
        "sourceCommit": cmd_output("git", "rev-parse", "HEAD"),
        "sourceTree": cmd_output("git", "rev-parse", "HEAD^{tree}"),
        "profile": args.profile,
        "environment": {
            "python": sys.version.split()[0], "node": cmd_output("node", "--version"),
            "platform": platform.platform(), "architecture": platform.machine(),
            "githubRunId": os.environ.get("GITHUB_RUN_ID"),
            "githubRunAttempt": os.environ.get("GITHUB_RUN_ATTEMPT"),
        },
        "limits": {"perTestWallSeconds": args.wall_seconds, "nodeHeapMiB": args.node_heap_mib,
                   "nodeHeapNotAnRSSLimit": True, "parallelTestProcesses": 1},
        "sourceInventory": before, "criteria": ledger, "testRuns": [],
        "mathematicalAcceptanceChanged": False,
        "allEightOriginalCriteriaProved": False, "wholeM3Complete": False,
    }
    (out / "started.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for index, (cid, relative, classification) in enumerate(selected):
        row = run_one(index, cid, relative, classification, args, out)
        report["testRuns"].append(row)
        (out / ("%02d-receipt.json" % index)).write_text(
            json.dumps(row, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("M3_TEST", json.dumps({
            "criterion": cid, "script": relative, "status": row["status"],
            "tests": row["tap"]["tests"], "seconds": row["seconds"],
        }, ensure_ascii=False), flush=True)
    after = source_inventory(selected)
    report["finishedAt"] = utc()
    report["sourceTreeUnmodifiedByTests"] = after == before
    report["executionChecksPassed"] = all(
        row["status"] == "PASS_FINITE_TEST" for row in report["testRuns"]
    ) and report["sourceTreeUnmodifiedByTests"]
    report["conclusion"] = (
        "FINITE_REPLAY_PASS__ORIGINAL_M3_PROOF_STILL_OPEN"
        if report["executionChecksPassed"]
        else "FINITE_REPLAY_INCOMPLETE__ORIGINAL_M3_PROOF_STILL_OPEN"
    )
    (out / "result.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("M3_SUMMARY", json.dumps({
        "commit": report["sourceCommit"], "profile": args.profile,
        "checksPassed": report["executionChecksPassed"],
        "criterionPromotion": False, "wholeM3Complete": False,
        "artifact": str(out),
    }, ensure_ascii=False), flush=True)
    return 0 if report["executionChecksPassed"] else 1

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print("M3_CLOUD_HARNESS_ERROR:", repr(error), file=sys.stderr)
        raise SystemExit(2)
