#!/usr/bin/env python3
"""Compile a final consumer using only the immediately rebuilt clean prefix.

The prefix remains immutable. Its source, object and log bytes are rechecked
before and after this compilation. No object from the original component
attempts is imported. The combined receipt distinguishes the 13-module clean
prefix from this one new compilation rather than claiming a second full run.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import re
import subprocess

from replay_chain import (ALLOWED_AXIOMS, DEFAULT_RUNTIME, NAVIER, json_read,
                          now, parse_axioms, require, sha, source_path,
                          tracked_hashes, write_json)


def verify_prefix(root, receipt):
    require(receipt["status"] == "PASS", "Clean prefix did not pass")
    require(receipt["initialCustomOleanCount"] == 0 and
            receipt["existingCustomObjectsImported"] is False,
            "Prefix was not compiled from empty custom output")
    for item in receipt["modules"]:
        name = item["module"]
        require(item["status"] == "PASS" and item["exitCode"] == 0, "Failed prefix module")
        for suffix, field in ((".lean", "sourceSHA256"), (".olean", "oleanSHA256"),
                              (".log", "logSHA256")):
            p = root / (name + suffix)
            require(p.is_file() and not p.is_symlink() and sha(p) == item[field],
                    "Clean prefix bytes changed: " + str(p))
        require(parse_axioms((root / (name + ".log")).read_text()) == item["printedAxioms"],
                "Prefix axiom report mismatch")
    require(sha(root / "selected-chain.json") == receipt["selectionManifestSHA256"],
            "Prefix selection changed")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prefix", type=Path, required=True)
    parser.add_argument("--module", required=True)
    parser.add_argument("--attempt", required=True, help="Accepted attempt, relative to Navier")
    parser.add_argument("--runtime", type=Path,
                        default=Path(os.environ.get("MATHSCOPE_ORIGINAL_RUNTIME", DEFAULT_RUNTIME)))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    prefix = args.prefix.resolve()
    prefix_receipt_path = prefix / "receipt.json"
    prefix_receipt_sha = sha(prefix_receipt_path)
    previous = json_read(prefix_receipt_path)
    verify_prefix(prefix, previous)
    selection = json_read(prefix / "selected-chain.json")
    name = args.module
    names = [row["module"] for row in previous["modules"]]
    require(name not in names and re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", name),
            "Invalid or duplicate new module")
    original_source = source_path(args.attempt + "/" + name + ".lean")
    accepted_receipt_path = source_path(args.attempt + "/receipt.json")
    accepted_receipt_sha = sha(accepted_receipt_path)
    accepted = json_read(accepted_receipt_path)
    require(accepted["status"] == "PASS" and sha(original_source) == accepted["sourceSHA256"],
            "Changed or unsuccessful final input")
    imports = re.findall(r"^import\s+(\S+)\s*$", original_source.read_text(), re.M)
    require(all(x in names or x.startswith(("NavierStokes.", "Mathlib.", "Lean.", "Std."))
                or x in {"Init", "Lean", "Std"} for x in imports), "Unrebuilt custom dependency")
    expected_axioms = accepted["printedAxioms"]
    require(bool(expected_axioms) and all(set(xs) <= ALLOWED_AXIOMS for xs in expected_axioms.values()),
            "Missing or unaccepted final axiom audit")
    runtime = args.runtime.resolve()
    repo = runtime / "repo"
    distribution = runtime / selection["toolchainDirectory"]
    lake = distribution / "bin/lake"
    kernel = distribution / "lib/lean/libleanshared.so"
    require(sha(kernel) == selection["kernelSHA256"], "Original kernel changed")
    require(subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=repo, text=True).strip()
            == selection["originalCommit"], "Original commit changed")
    before = tracked_hashes(repo)
    require(before == json_read(prefix / "original-source-hashes-after.json") and len(before) == 2669,
            "Original source inventory changed since fresh prefix")
    output = args.output.resolve()
    require(not output.exists(), "Refusing to replace a continuation attempt")
    output.mkdir(parents=True)
    (output / "runner.py").write_bytes(Path(__file__).read_bytes())
    (output / "replay_chain.py").write_bytes(Path(__file__).with_name("replay_chain.py").read_bytes())
    source = output / (name + ".lean")
    target = output / (name + ".olean")
    source.write_bytes(original_source.read_bytes())
    write_json(output / "original-source-hashes-before.json", before)
    env = os.environ.copy()
    for key in list(env):
        if key in {"GITHUB_TOKEN", "GH_TOKEN", "LEAN_PATH", "LEAN_SRC_PATH"} or key.startswith("COMPARATOR_"):
            env.pop(key)
    entry = runtime / "lean-entry-layout"
    if not entry.is_dir():
        entry = distribution
    env.update(PATH=str(entry / "bin") + os.pathsep + env.get("PATH", ""),
               LEAN_SYSROOT=str(entry), LAKE_HOME=str(runtime / "lake-home"),
               MATHLIB_CACHE_DIR=str(runtime / "mathlib-cache"),
               LAKE_CACHE_DIR=str(runtime / "lake-cache"),
               LEAN_PATH=os.pathsep.join((str(output), str(prefix))))
    lean_path = subprocess.check_output([str(lake), "env", "printenv", "LEAN_PATH"],
                                       cwd=repo, env=env, text=True).strip()
    paths = [(Path(p) if Path(p).is_absolute() else repo / p).resolve()
             for p in lean_path.split(os.pathsep) if p]
    require(prefix in paths and output in paths, "Clean chain import directories are absent")
    for path in paths:
        if path not in {prefix, output}:
            require(not any((path / (x + ".olean")).exists() for x in [*names, name]),
                    "An earlier component object is visible")
    require(not target.exists() and not (prefix / (name + ".olean")).exists(),
            "Final object exists before compilation")
    started = now()
    command = [str(lake), "env", "lean", "--root", str(output), "-o", str(target), str(source)]
    log_path = output / (name + ".log")
    with log_path.open("w") as log:
        process = subprocess.run(command, cwd=repo, env=env, stdout=log, stderr=subprocess.STDOUT)
    log = log_path.read_text()
    axioms = parse_axioms(log)
    after = tracked_hashes(repo)
    write_json(output / "original-source-hashes-after.json", after)
    verify_prefix(prefix, previous)
    inputs_unchanged = (sha(prefix_receipt_path) == prefix_receipt_sha and
                        sha(accepted_receipt_path) == accepted_receipt_sha and
                        sha(original_source) == accepted["sourceSHA256"] and
                        sha(source) == accepted["sourceSHA256"])
    passed = (process.returncode == 0 and target.is_file() and axioms == expected_axioms
              and "sorryAx" not in log and ": error:" not in log
              and before == after and sha(kernel) == selection["kernelSHA256"] and inputs_unchanged)
    receipt = {
        "schema": "MathScope.CleanConcreteAxisReplayExtension/1",
        "status": "PASS" if passed else "FAIL", "startedUTC": started, "finishedUTC": now(),
        "module": name, "command": command, "exitCode": process.returncode,
        "sourceSHA256": sha(source), "oleanSHA256": sha(target) if target.is_file() else None,
        "logSHA256": sha(log_path), "printedAxioms": axioms,
        "runnerSHA256": sha(Path(__file__)), "runnerHelperSHA256": sha(Path(__file__).with_name("replay_chain.py")),
        "acceptedReceipt": str(accepted_receipt_path.relative_to(NAVIER)),
        "acceptedReceiptSHA256": accepted_receipt_sha,
        "freshPrefix": str(prefix.relative_to(NAVIER)), "freshPrefixReceiptSHA256": prefix_receipt_sha,
        "freshPrefixModuleCount": len(names), "freshPrefixObjectsAvailable": len(names),
        "previousComponentAttemptObjectsImported": False,
        "thisConsumerObjectAbsentBeforeCompilation": True,
        "combinedRecompiledModuleCount": len(names) + 1,
        "combinedAuditedDeclarationCount": previous["auditedDeclarationCount"] + len(axioms),
        "originalCommit": selection["originalCommit"], "originalTrackedFileCount": len(before),
        "originalTrackedFilesPreserved": before == after,
        "kernelSHA256Before": selection["kernelSHA256"], "kernelSHA256After": sha(kernel),
        "acceptedInputsAndFreshPrefixUnchanged": inputs_unchanged, "effectiveLeanPath": lean_path,
        "protectedComparatorPerformed": False, "originalGateAssessmentPerformed": False,
        "scope": "The actual selected small parameters and eta chart are compiled against the immediately rebuilt 13-module same-datum chain. The combined result covers 14 source compilations; the prefix was not recompiled by this extension.",
    }
    write_json(output / "receipt.json", receipt)
    print(json.dumps({"status": receipt["status"], "receipt": str(output / "receipt.json"),
                      "combinedModules": receipt["combinedRecompiledModuleCount"],
                      "combinedDeclarations": receipt["combinedAuditedDeclarationCount"]}), flush=True)
    return int(not passed)


if __name__ == "__main__":
    raise SystemExit(main())
