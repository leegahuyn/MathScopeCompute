#!/usr/bin/env python3
"""Compile the frozen concrete axis/finite-jet chain from an empty output directory.

Original project objects come from the separately completed original build.
Every custom MathScope module is compiled again, in dependency order, from its
pinned source. No precompiled custom object is imported from an earlier attempt.
"""
from __future__ import annotations
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent.parent
DEFAULT_RUNTIME = "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/official-validation"
ALLOWED_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def json_read(path):
    return json.loads(path.read_text())


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def tracked_hashes(repo):
    names = subprocess.check_output(["git", "ls-files", "-z"], cwd=repo).decode().split("\0")
    return {name: sha(repo / name) for name in names if name and (repo / name).is_file()}


def parse_axioms(log):
    return {name: [part.strip() for part in body.split(",") if part.strip()]
            for name, body in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]", log, re.S)}


def source_path(relative):
    path = Path(relative)
    require(not path.is_absolute() and ".." not in path.parts, "Unsafe manifest path")
    result = NAVIER / path
    require(result.is_file() and not result.is_symlink(), "Missing or linked frozen input")
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=HERE / "selected-chain.json")
    parser.add_argument("--runtime", type=Path,
                        default=Path(os.environ.get("MATHSCOPE_ORIGINAL_RUNTIME", DEFAULT_RUNTIME)))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    manifest = json_read(args.manifest)
    runtime = args.runtime.resolve()
    repo = runtime / "repo"
    distribution = runtime / manifest["toolchainDirectory"]
    lake = distribution / "bin/lake"
    kernel = distribution / "lib/lean/libleanshared.so"
    output = args.output.resolve()
    require(not output.exists(), "Refusing to reuse a replay directory")
    require(sha(kernel) == manifest["kernelSHA256"], "Original kernel pin mismatch")
    require(subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=repo, text=True).strip()
            == manifest["originalCommit"], "Original source commit mismatch")
    inventory_file = source_path(manifest["originalInventory"]["path"])
    require(sha(inventory_file) == manifest["originalInventory"]["sha256"], "Inventory pin mismatch")
    before = tracked_hashes(repo)
    require(before == json_read(inventory_file) and len(before) == 2669,
            "Original tracked sources differ from the accepted original inventory")
    modules = manifest["modules"]
    names = [item["name"] for item in modules]
    require(len(names) == len(set(names)), "Duplicate module names")
    require(manifest["finalModule"] == names[-1], "Final concrete consumer must be last")
    prior = set()
    for item in modules:
        source = source_path(item["source"])
        receipt = source_path(item["receipt"])
        require(sha(source) == item["sourceSHA256"] and sha(receipt) == item["receiptSHA256"],
                "Accepted source or receipt changed: " + item["name"])
        require(json_read(receipt)["status"] == "PASS", "An input receipt is unsuccessful")
        imports = re.findall(r"^import\s+(\S+)\s*$", source.read_text(), re.M)
        custom = {name for name in imports if name in names}
        require(custom <= prior, "Custom imports are not ordered: " + item["name"])
        require(all(name in names or name.startswith(("NavierStokes.", "Mathlib.", "Lean.", "Std."))
                    or name in {"Init", "Lean", "Std"} for name in imports), "Unpinned custom import")
        require(bool(item["expectedDeclarations"]), "Missing declaration audit targets")
        prior.add(item["name"])
    for item in manifest.get("evidenceBindings", []):
        require(sha(source_path(item["path"])) == item["sha256"], "Mathematical input binding changed")
    output.mkdir(parents=True)
    (output / "runner.py").write_bytes(Path(__file__).read_bytes())
    (output / "selected-chain.json").write_bytes(args.manifest.read_bytes())
    write_json(output / "original-source-hashes-before.json", before)
    for item in modules:
        (output / (item["name"] + ".lean")).write_bytes(source_path(item["source"]).read_bytes())
    require(not list(output.glob("*.olean")), "Output did not start without custom objects")
    env = os.environ.copy()
    for name in ("GITHUB_TOKEN", "GH_TOKEN", "LEAN_PATH", "LEAN_SRC_PATH"):
        env.pop(name, None)
    for name in list(env):
        if name.startswith("COMPARATOR_"):
            env.pop(name)
    entry = runtime / "lean-entry-layout"
    if not entry.is_dir():
        entry = distribution
    env["PATH"] = str(entry / "bin") + os.pathsep + env.get("PATH", "")
    env["LEAN_SYSROOT"] = str(entry)
    env["LAKE_HOME"] = str(runtime / "lake-home")
    env["MATHLIB_CACHE_DIR"] = str(runtime / "mathlib-cache")
    env["LAKE_CACHE_DIR"] = str(runtime / "lake-cache")
    env["LEAN_PATH"] = str(output)
    lean_path = subprocess.check_output([str(lake), "env", "printenv", "LEAN_PATH"],
                                        cwd=repo, env=env, text=True).strip()
    paths = [(Path(p) if Path(p).is_absolute() else repo / p).resolve()
             for p in lean_path.split(os.pathsep) if p]
    require(output in paths, "Fresh output is absent from Lean import search paths")
    for path in paths:
        if path != output:
            require(not any((path / (name + ".olean")).exists() for name in names),
                    "An earlier custom object is visible outside the fresh output")
    results = []
    started = now()
    try:
        for item in modules:
            name = item["name"]
            source = output / (name + ".lean")
            target = output / (name + ".olean")
            require(not target.exists(), "A custom object existed before its compilation")
            command = [str(lake), "env", "lean", "--root", str(output), "-o", str(target), str(source)]
            step_started = now()
            with (output / (name + ".log")).open("w") as log:
                process = subprocess.run(command, cwd=repo, env=env, stdout=log, stderr=subprocess.STDOUT)
            log = (output / (name + ".log")).read_text()
            axioms = parse_axioms(log)
            ok = (process.returncode == 0 and target.is_file()
                  and set(axioms) == set(item["expectedDeclarations"])
                  and all(set(values) <= ALLOWED_AXIOMS for values in axioms.values())
                  and "sorryAx" not in log and ": error:" not in log
                  and sha(source) == item["sourceSHA256"])
            row = {"module": name, "status": "PASS" if ok else "FAIL",
                   "startedUTC": step_started, "finishedUTC": now(), "command": command,
                   "exitCode": process.returncode, "sourceSHA256": sha(source),
                   "logSHA256": sha(output / (name + ".log")), "printedAxioms": axioms,
                   "oleanSHA256": sha(target) if target.exists() else None,
                   "customOutputAbsentBeforeCompilation": True}
            results.append(row)
            write_json(output / "progress.json", {"startedUTC": started, "modules": results})
            print(json.dumps({"module": name, "status": row["status"],
                              "completed": len(results), "total": len(modules)}), flush=True)
            if not ok:
                break
    finally:
        after = tracked_hashes(repo)
        write_json(output / "original-source-hashes-after.json", after)
    kernel_after = sha(kernel)
    unchanged = all(sha(source_path(item["source"])) == item["sourceSHA256"] and
                    sha(source_path(item["receipt"])) == item["receiptSHA256"] for item in modules)
    complete = len(results) == len(modules) and all(row["status"] == "PASS" for row in results)
    passed = complete and before == after and kernel_after == manifest["kernelSHA256"] and unchanged
    receipt = {
        "schema": "MathScope.CleanConcreteAxisFiniteJetReplay/1",
        "status": "PASS" if passed else "FAIL", "startedUTC": started, "finishedUTC": now(),
        "selectionManifestSHA256": sha(args.manifest), "runnerSHA256": sha(Path(__file__)),
        "originalCommit": manifest["originalCommit"], "originalTrackedFileCount": len(before),
        "originalTrackedFilesPreserved": before == after,
        "kernelSHA256Before": manifest["kernelSHA256"], "kernelSHA256After": kernel_after,
        "acceptedInputsUnchanged": unchanged, "initialCustomOleanCount": 0,
        "existingCustomObjectsImported": False, "effectiveLeanPath": lean_path,
        "modules": results, "moduleCount": len(results),
        "auditedDeclarationCount": sum(len(row["printedAxioms"]) for row in results),
        "actualInputChainAndFiniteJetKernelPassed": passed,
        "protectedComparatorPerformed": False, "originalGateAssessmentPerformed": False,
        "scope": manifest["scope"], "evidenceBindings": manifest.get("evidenceBindings", []),
    }
    write_json(output / "receipt.json", receipt)
    print(json.dumps({"status": receipt["status"], "receipt": str(output / "receipt.json"),
                      "modules": len(results), "auditedDeclarations": receipt["auditedDeclarationCount"]}), flush=True)
    return int(not passed)


if __name__ == "__main__":
    raise SystemExit(main())
