#!/usr/bin/env python3
"""Source-bound N6 audit plus the prior eight bounded tests, without promotion.

The old replay implementation and all pinned mathematical producers are read-only.
Test execution success is separate from analytical acceptance. Each output contains
the exact commit, source hashes, resource stops and unchanged original ledgers.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
from pathlib import Path
import sys
import time

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("remaining8_replay", HERE / "remaining8_replay.py")
replay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(replay)

N6 = (
    ("N6-02", "navier/tests/saved-monotone-implicit-derivatives.test.mjs", "CONDITIONAL_MONOTONE_BRANCH"),
    ("N6-02", "navier/tests/saved-quadratic-implicit-derivatives.test.mjs", "CONDITIONAL_QUADRATIC_BRANCH"),
    ("N6-02", "navier/tests/saved-radius-monotone-audit.test.mjs", "SOURCE_BRANCH_OBLIGATIONS"),
    ("N6-02", "navier/tests/saved-quadratic-series-audit.test.mjs", "SOURCE_SERIES_CONDITIONAL_DERIVATIVE"),
    ("N6-02", "navier/tests/saved-whole-mean-conditional-audit.test.mjs", "CONDITIONAL_UPDATED_WHOLE_MEAN"),
)
EXTRA_SOURCE = (
    "navier/source-saved-radius-monotone-audit.mjs",
    "navier/source-saved-quadratic-series-audit.mjs",
    "navier/source-saved-whole-mean-conditional-audit.mjs",
    "cloud/n6_source_audit.py",
    "cloud/N6_ANALYTICAL_CONDITIONS_KO.md",
)


def inventory(selected):
    result = replay.source_inventory(selected)
    for relative in EXTRA_SOURCE:
        path = replay.ROOT / replay.BASE / relative
        result[replay.BASE + relative] = {"sha256": replay.digest(path), "bytes": path.stat().st_size}
    return result


def classify_stop(row, output):
    text = (output / row["tap"]["path"]).read_text(encoding="utf-8")
    text += (output / row["stderr"]["path"]).read_text(encoding="utf-8")
    if row["status"] != "PASS_FINITE_TEST":
        if "heap out of memory" in text or "Allocation failed" in text:
            row["resourceFailure"] = "NODE_HEAP_EXHAUSTED"
        elif row["stopReason"] == "TIME_LIMIT":
            row["resourceFailure"] = "WALL_TIME_LIMIT"
        else:
            row["resourceFailure"] = None
    row["analyticalAcceptanceInferredFromExitCode"] = False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--wall-seconds", type=int, default=600)
    parser.add_argument("--node-heap-mib", type=int, default=4096)
    parser.add_argument("--job-wall-seconds", type=int, default=2400)
    args = parser.parse_args()
    if not (10 <= args.wall_seconds <= 600 and 256 <= args.node_heap_mib <= 5120):
        parser.error("Use 10..600 seconds and 256..5120 MiB per sequential test.")
    if not (60 <= args.job_wall_seconds <= 2700):
        parser.error("Use a 60..2700 second job budget, leaving time for artifact upload.")
    deadline = time.monotonic() + args.job_wall_seconds
    per_test_wall = args.wall_seconds
    out = args.output.resolve()
    if out == replay.ROOT or replay.ROOT in out.parents:
        parser.error("Outputs must be outside the tracked repository.")
    out.mkdir(parents=True, exist_ok=True)
    selected = list(replay.SMOKE) + list(N6)
    replay.EVIDENCE_ENV.update({
        "saved-radius-monotone-audit.test.mjs": ("MATHSCOPE_RADIUS_MONOTONE_EVIDENCE_DIR", "radius-monotone", True),
        "saved-quadratic-series-audit.test.mjs": ("MATHSCOPE_QUADRATIC_SERIES_EVIDENCE_DIR", "quadratic-series", True),
        "saved-whole-mean-conditional-audit.test.mjs": ("MATHSCOPE_CONDITIONAL_WHOLE_MEAN_EVIDENCE_DIR", "conditional-whole-mean", True),
    })
    ledger = replay.ledger_snapshot()
    before = inventory(selected)
    report = {
        "schema": "MathScope.M3.N6SourceAudit/1", "startedAt": replay.utc(),
        "sourceCommit": replay.cmd_output("git", "rev-parse", "HEAD"),
        "sourceTree": replay.cmd_output("git", "rev-parse", "HEAD^{tree}"),
        "priorRun": {"id": 38480202315, "commit": "bdaf007e2de1cb8bf310ef0efb1b799e6c977711",
                     "conclusion": "failure", "specificStop": "N7-04 NODE_HEAP_EXHAUSTED at 1536 MiB"},
        "environment": {"python": sys.version.split()[0], "node": replay.cmd_output("node", "--version"),
                        "githubRunId": os.environ.get("GITHUB_RUN_ID"),
                        "githubRunAttempt": os.environ.get("GITHUB_RUN_ATTEMPT")},
        "limits": {"perTestWallSeconds": args.wall_seconds, "nodeHeapMiB": args.node_heap_mib,
                   "nodeHeapNotAnRSSLimit": True, "parallelTestProcesses": 1,
                   "jobWallSeconds": args.job_wall_seconds},
        "criteria": ledger, "sourceInventory": before, "testRuns": [],
        "mathematicalAcceptanceChanged": False, "allEightOriginalCriteriaProved": False,
        "originalN601Complete": False, "originalN602Complete": False, "wholeM3Complete": False,
    }
    def save(name):
        (out / name).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    save("started.json")
    for index, (cid, relative, classification) in enumerate(selected):
        remaining = int(deadline - time.monotonic())
        if remaining < 10:
            row = {"criterion": cid, "script": replay.BASE + relative, "classification": classification,
                   "status": "NOT_RUN_JOB_WALL_BUDGET", "stopReason": "JOB_WALL_BUDGET", "seconds": 0,
                   "tap": {"tests": None}, "resourceFailure": "JOB_WALL_BUDGET",
                   "originalCriterionCertifiedByThisTest": False, "theoremProvedByThisTest": False,
                   "analyticalAcceptanceInferredFromExitCode": False,
                   "globalFinalNavierStokesFieldReconstructed": False}
        else:
            args.wall_seconds = min(per_test_wall, remaining)
            row = replay.run_one(index, cid, relative, classification, args, out)
            classify_stop(row, out)
        report["testRuns"].append(row)
        (out / ("%02d-receipt.json" % index)).write_text(json.dumps(row, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        save("partial-result.json")
        print("N6_SOURCE_TEST", json.dumps({"script": relative, "status": row["status"],
              "tests": row["tap"]["tests"], "seconds": row["seconds"],
              "resourceFailure": row.get("resourceFailure")}), flush=True)
    after = inventory(selected)
    report["finishedAt"] = replay.utc()
    report["sourceTreeUnmodifiedByTests"] = after == before
    report["originalCriteriaUnmodifiedByTests"] = ledger == replay.ledger_snapshot()
    report["executionChecksPassed"] = all(r["status"] == "PASS_FINITE_TEST" for r in report["testRuns"]) and report["sourceTreeUnmodifiedByTests"] and report["originalCriteriaUnmodifiedByTests"]
    report["conclusion"] = ("FINITE_AUDIT_EXECUTED__ORIGINAL_N6_OPEN" if report["executionChecksPassed"] else "FINITE_AUDIT_INCOMPLETE__ORIGINAL_N6_OPEN")
    save("result.json")
    print("N6_SOURCE_SUMMARY", json.dumps({"commit": report["sourceCommit"], "checksPassed": report["executionChecksPassed"],
          "criterionPromotion": False, "wholeM3Complete": False}), flush=True)
    return 0 if report["executionChecksPassed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
