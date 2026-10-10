#!/usr/bin/env python3
"""Read-only N1-05 evidence audit, with optional preserved runtime inspection.

This verifies the existing successful command receipt; it does not run Lean,
rewrite a historical receipt, or provide the separate Comparator result.
Every output must be an explicitly selected new file.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tomllib

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
BUILD = NAVIER / "followup-20261010-default-build-resume-2047"
CI = NAVIER / "followup-20261010-ci-audit"
SOURCE = "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
KERNEL = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"
RESULT = "96820a64bdb5a722901c7e8172e638a03b22854940dbbd0e038745fcc6672268"


def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def read(path: Path):
    return json.loads(path.read_text())


def canonical_sha(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verify(runtime_nav: Path | None):
    checks = []

    def check(name, value, detail=None):
        checks.append({"name": name, "passed": bool(value), "detail": detail})

    receipt = read(BUILD / "result.json")
    summary = read(BUILD / "N1-05-completion-summary.json")
    frozen = read(BUILD / "frozen-v50-inputs.json")
    manifest = read(BUILD / "manifest.json")
    pins = read(CI / "default-build-artifact/pins.json")
    check("original successful receipt digest", sha(BUILD / "result.json") == RESULT)
    check("actual completed exit zero", receipt["status"] == "FINISHED" and receipt["exitCode"] == 0
          and receipt["terminationReason"] is None and receipt["wholeDefaultBuildPassed"] is True)
    check("exact original default command", receipt["command"] == [receipt["cwd"].removesuffix("/repo")
          + "/lean-4.34.0-rc2-linux/bin/lake", "build"])
    check("original source and toolchain pins", receipt["repositoryCommit"] == SOURCE
          and receipt["toolchain"] == pins["toolchain"] == "leanprover/lean4:v4.34.0-rc2")
    check("complete local log bytes", sha(BUILD / "default-build.log") == receipt["logSHA256"]
          == summary["defaultBuild"]["logSHA256"])
    check("terminal local build success", (BUILD / "default-build.log").read_text().endswith(
          "Build completed successfully (11424 jobs).\n"))
    check("recorded environment hash", canonical_sha(receipt["environment"])
          == summary["defaultBuild"]["environmentCanonicalSHA256"])
    check("default targets and artifact inventory", receipt["defaultTargets"]
          == ["NavierStokes", "Euler", "ComparatorChallenges"] and all(
          receipt["finalModuleInventory"][name] == {"sourceFiles": count,
          "oleanArtifactsPresent": count, "oleanArtifactsMissing": 0}
          for name, count in [("NavierStokes", 817), ("Euler", 1840), ("ComparatorChallenges", 2)]))
    bad_members = [item["file"] for item in manifest["files"]
                   if not (BUILD / item["file"]).is_file()
                   or (BUILD / item["file"]).stat().st_size != item["bytes"]
                   or sha(BUILD / item["file"]) != item["sha256"]]
    check("all completion snapshot members intact", not bad_members,
          {"members": len(manifest["files"]), "mismatches": bad_members})
    frozen_bad = [name for name, expected in frozen["files"].items()
                  if not (NAVIER / name).is_file() or sha(NAVIER / name) != expected]
    check("all frozen delivery inputs intact", not frozen_bad,
          {"members": len(frozen["files"]), "mismatches": frozen_bad})
    prior_audit = read(BUILD / "independent-completion-verification.json")
    check("preserved 29-check runtime audit intact", sha(BUILD / "independent-completion-verification.json")
          == summary["independentVerification"]["sha256"] and prior_audit["passed"]
          == prior_audit["total"] == 29 and prior_audit["status"] == "PASSED")
    check("original guard unchanged in successful receipt", receipt["guardChanges"] is False
          and receipt["resourceStopThresholds"] == {"minimumFreeDiskBytes": 805306368,
                                                   "oomKillCountMayIncrease": False})
    check("no original input modifications recorded", receipt["sourceChanges"] is False
          and receipt["originalInputsUnchanged"] is True and receipt["originalTrackedSourcesUnchanged"] is True
          and receipt["snapshotRuntimeFilesUnchanged"] is True and receipt["changedFrozenPaths"] == [])
    prior = read(BUILD / "previous-interruption-observation.json")
    disk = NAVIER / "followup-20261010-default-build"
    lost = NAVIER / "followup-20261010-default-build-resume-2016"
    check("earlier disk interruption remains exit minus 15", read(disk / "result.json")["exitCode"] == -15
          and sha(disk / "result.json") == prior["originalDiskGuardFailure"]["resultSHA256"]
          and sha(disk / "default-build.log") == prior["originalDiskGuardFailure"]["logSHA256"])
    check("earlier unknown exit remains unknown", prior["previousActualExitCode"] is None
          and not (lost / "result.json").exists()
          and sha(lost / "current-stage.json") == prior["previousCurrentStageSHA256"]
          and sha(lost / "default-build.log") == prior["previousLogSHA256"]
          and sha(lost / "resource-progress.json") == prior["previousResourceProgressSHA256"])
    cache = read(BUILD / "cache-prerequisite-link.json")
    for index, item in enumerate(cache["literalCommandRuns"]):
        path = BUILD / item["receipt"]
        entry = read(path)[item["entryIndex"]]
        check(f"literal cache failure {index + 1} preserved with bytes and environment",
              sha(path) == item["receiptSHA256"] and sha(BUILD / item["completeLog"]) == item["logSHA256"]
              and entry["exitCode"] == item["actualExitCode"] == 1
              and entry["command"] == item["actualCommand"]
              and canonical_sha(entry["environment"]) == item["environmentCanonicalSHA256"])
    item = cache["explicitContextSuccess"]
    entry = read(BUILD / item["receipt"])
    check("separate explicit-context success preserved with bytes and environment",
          sha(BUILD / item["receipt"]) == item["receiptSHA256"]
          and sha(BUILD / item["completeLog"]) == item["logSHA256"]
          and entry["exitCode"] == item["actualExitCode"] == 0
          and entry["command"] == item["actualCommand"]
          and canonical_sha(entry["environment"]) == item["environmentCanonicalSHA256"])
    check("original acceptance unchanged", sha(NAVIER.parent / "evidence/original-acceptance.json")
          == summary["originalAcceptanceFileSHA256"] and summary["originalAcceptanceModified"] is False)
    check("Comparator and profile not promoted by default build", receipt["comparatorCompleted"] is False
          and summary["independentComparatorCompleted"] is False
          and summary["numericalLeadingProfileCertified"] is False)
    spec = importlib.util.spec_from_file_location("preserved_ci_default_audit", CI / "verify-default-build.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    github_audit = module.verify()
    check("independent portable original GitHub artifact audit", github_audit["passed"] is True
          and github_audit["independentChecksPassed"] == github_audit["independentChecksTotal"] == 43,
          {key: github_audit[key] for key in ["actualJobConclusion", "literalCacheGetActualExitCode",
          "wholeDefaultBuildActualExitCode", "trackedFileCount", "independentChecksPassed", "independentChecksTotal"]})
    runtime = {"checked": runtime_nav is not None, "freshBuildRun": False}
    if runtime_nav is not None:
        runtime_nav = runtime_nav.resolve()
        official = runtime_nav / "official-validation"
        repo = official / "repo"
        runtime["navierPath"] = str(runtime_nav)
        process_records = []

        def git(args, cwd=repo):
            proc = subprocess.run(["git", *args], cwd=cwd, capture_output=True, check=False)
            process_records.append({"command": ["git", *args], "cwd": str(cwd), "exitCode": proc.returncode,
                                    "stdout": proc.stdout.decode(errors="replace"),
                                    "stderr": proc.stderr.decode(errors="replace")})
            return proc

        head = git(["rev-parse", "HEAD"])
        check("runtime original source commit", head.returncode == 0 and head.stdout.decode().strip() == SOURCE)
        status = git(["status", "--porcelain", "--untracked-files=no"])
        check("runtime actual tracked Git status clean", status.returncode == 0 and status.stdout == b"")
        names = git(["ls-files", "-z"])
        if names.returncode != 0:
            raise RuntimeError("Cannot enumerate runtime tracked files")
        current = {os.fsdecode(name): sha(repo / os.fsdecode(name)) for name in names.stdout.split(b"\0") if name}
        trusted = read(CI / "default-build-artifact/source-hashes-before.json")
        mismatches = sorted(name for name in current.keys() | trusted.keys() if current.get(name) != trusted.get(name))
        check("all actual runtime original source files match independent CI snapshot", not mismatches
              and len(current) == len(trusted) == 2669,
              {"files": len(current), "mismatches": mismatches, "canonicalSHA256": canonical_sha(current)})
        check("runtime actual default targets", tomllib.loads((repo / "lakefile.toml").read_text())["defaultTargets"]
              == receipt["defaultTargets"])
        check("runtime actual pinned inputs", all(sha(repo / name) == expected
              for name, expected in pins["sourceFileSHA256"].items()))
        check("runtime actual pinned Comparator configuration", sha(repo / pins["configuration"])
              == pins["configurationSHA256"] and read(repo / pins["configuration"])["enable_nanoda"] is True)
        check("runtime actual official kernel bytes", sha(official / "lean-4.34.0-rc2-linux/lib/lean/libleanshared.so")
              == KERNEL)
        check("runtime actual documented explicit entry bytes", sha(official / "lean-rc2-entry")
              == "a187c5263205d221e47724bbaf729cd377f40683b2670a543e3b7e6495108682")
        dependency_heads = {}
        for name, key in [("Comparator", "comparatorCommit"), ("mathlib", "mathlibCommit"),
                          ("lean4export", "lean4exportCommit")]:
            proc = git(["rev-parse", "HEAD"], repo / ".lake/packages" / name)
            dependency_heads[name] = proc.stdout.decode().strip()
            check("runtime dependency pin " + name, proc.returncode == 0 and dependency_heads[name] == pins[key])
        inventory = {}
        for name in receipt["defaultTargets"]:
            sources = list((repo / name).rglob("*.lean"))
            if (repo / (name + ".lean")).is_file():
                sources.append(repo / (name + ".lean"))
            missing = [str(path.relative_to(repo)) for path in sources
                       if not (repo / ".lake/build/lib/lean" / path.relative_to(repo)).with_suffix(".olean").is_file()]
            inventory[name] = {"sourceFiles": len(sources), "missingOleans": missing}
            check("runtime full artifacts present " + name, not missing
                  and len(sources) == receipt["finalModuleInventory"][name]["sourceFiles"])
        # The NUL-delimited file listing is represented by its digest/count instead of
        # duplicating it in process records. The source dictionary comparison is above.
        for process in process_records:
            if process["command"] == ["git", "ls-files", "-z"]:
                process["stdoutCanonicalFileCount"] = len(current)
                process["stdoutSHA256"] = hashlib.sha256(process.pop("stdout").encode()).hexdigest()
        runtime.update(processes=process_records, dependencyHeads=dependency_heads, inventory=inventory)
    return {"schema": "MathScope.N105ReadOnlyFollowup/1", "checkedUTC": datetime.now(timezone.utc).isoformat(),
            "verifierSHA256": sha(Path(__file__).resolve()),
            "passed": all(x["passed"] for x in checks), "checksPassed": sum(x["passed"] for x in checks),
            "checksTotal": len(checks), "checks": checks, "runtime": runtime,
            "historicalLocalBuildExitCode": receipt["exitCode"], "historicalLocalResultSHA256": RESULT,
            "githubDefaultArtifactAudit": github_audit,
            "N105RequestedRemainingConditionSatisfied": all(x["passed"] for x in checks),
            "N106IndependentComparatorCompleted": False,
            "scope": "Read-only audit of preserved receipts and optional actual runtime bytes. No new Lean build, no new Comparator run, no numerical profile certification."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--runtime-navier", type=Path, help="Optional preserved runtime Navier directory; read only.")
    parser.add_argument("--output", type=Path, required=True, help="New report path; existing files are rejected.")
    args = parser.parse_args()
    report = verify(args.runtime_navier)
    with args.output.open("x") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    print(json.dumps({key: report[key] for key in ["passed", "checksPassed", "checksTotal",
          "historicalLocalBuildExitCode", "N105RequestedRemainingConditionSatisfied", "N106IndependentComparatorCompleted"]}))
    raise SystemExit(0 if report["passed"] else 1)
