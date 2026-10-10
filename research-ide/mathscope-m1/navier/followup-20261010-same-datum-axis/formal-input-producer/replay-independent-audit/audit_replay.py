#!/usr/bin/env python3
"""Independently audit the frozen 13-module replay and one-module extension.

This imports no helper from the reviewed runners. It re-reads the original
inventory, parses the actual axiom logs, hashes every accepted/replayed input
and object, and asks Lean's original dependency resolver for actual paths.
It does not rerun the mathematical compilations or the protected Comparator.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parents[2]
REPLAY = NAVIER / "followup-20261010-symbolic-gluing/formal-clean-replay"
DEFAULT_RUNTIME = Path("/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/official-validation")
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path):
    return json.loads(path.read_text())


def write_json(path: Path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def timestamp():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def tracked_inventory(repo: Path):
    raw = subprocess.check_output(["git", "ls-files", "-z"], cwd=repo)
    names = [x for x in raw.decode().split("\0") if x]
    return {name: sha(repo / name) if (repo / name).is_file() else None for name in names}


def axiom_entries(log: str):
    # Keep a list first so duplicate audit targets cannot silently disappear.
    return [(name, [x.strip() for x in values.split(",") if x.strip()])
            for name, values in re.findall(
                r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]", log, re.S)]


def environment(runtime: Path, custom_roots):
    env = os.environ.copy()
    for name in list(env):
        if name in {"GITHUB_TOKEN", "GH_TOKEN", "LEAN_PATH", "LEAN_SRC_PATH"} or name.startswith("COMPARATOR_"):
            env.pop(name)
    entry = runtime / "lean-entry-layout"
    if not entry.is_dir():
        entry = runtime / "lean-4.34.0-rc2-linux"
    env.update(PATH=str(entry / "bin") + os.pathsep + env.get("PATH", ""),
               LEAN_SYSROOT=str(entry), LAKE_HOME=str(runtime / "lake-home"),
               MATHLIB_CACHE_DIR=str(runtime / "mathlib-cache"),
               LAKE_CACHE_DIR=str(runtime / "lake-cache"),
               LEAN_PATH=os.pathsep.join(str(p) for p in custom_roots))
    return env


def run_logged(command, *, cwd, env, logfile):
    p = subprocess.run(command, cwd=cwd, env=env, text=True,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    logfile.write_text(p.stdout)
    return {"command": command, "exitCode": p.returncode,
            "log": logfile.name, "logSHA256": sha(logfile)}, p.stdout


def dependency_sections(log):
    sections = {}
    active = None
    for line in log.splitlines():
        if line.startswith("BEGIN "):
            if active is not None:
                raise ValueError("Nested dependency report")
            active = line[len("BEGIN "):]
            if active in sections:
                raise ValueError("Duplicate dependency report")
            sections[active] = []
        elif line.startswith("END "):
            if active != line[len("END "):]:
                raise ValueError("Unbalanced dependency report")
            active = None
        elif line:
            if active is None:
                raise ValueError("Unexpected dependency output: " + line)
            sections[active].append(line)
    if active is not None:
        raise ValueError("Unfinished dependency report")
    return sections


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runtime", type=Path, default=DEFAULT_RUNTIME)
    ap.add_argument("--prefix", type=Path, default=REPLAY / "attempts/0001")
    ap.add_argument("--extension", type=Path, default=REPLAY / "extension-attempts/0001")
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    output = args.output.resolve()
    if output.exists():
        raise ValueError("Refusing to overwrite an audit attempt")
    output.mkdir(parents=True)
    snapshots = output / "snapshots"
    snapshots.mkdir()
    checks = []

    def check(name, condition, **details):
        checks.append({"name": name, "passed": bool(condition), **details})

    runtime, prefix, extension = (x.resolve() for x in (args.runtime, args.prefix, args.extension))
    repo = runtime / "repo"
    distribution = runtime / "lean-4.34.0-rc2-linux"
    lake = str(distribution / "bin/lake")
    kernel = distribution / "lib/lean/libleanshared.so"
    before = tracked_inventory(repo)
    write_json(output / "original-source-hashes-before.json", before)
    kernel_before = sha(kernel)
    started = timestamp()
    prefix_receipt_path = prefix / "receipt.json"
    extension_receipt_path = extension / "receipt.json"
    prefix_receipt = read_json(prefix_receipt_path)
    extension_receipt = read_json(extension_receipt_path)
    manifest = read_json(prefix / "selected-chain.json")
    pins = []

    def pin(path, label, expected=None, snapshot=True):
        digest = sha(path)
        check("byte pin: " + label, not path.is_symlink() and (expected is None or digest == expected),
              sha256=digest, expectedSHA256=expected)
        pins.append({"path": str(path), "sha256": digest})
        if snapshot:
            (snapshots / label).write_bytes(path.read_bytes())
        return digest

    pin(Path(__file__), "audit_replay.py")
    pin(HERE / "DependencyProbe.lean", "DependencyProbe.lean")
    pin(REPLAY / "freeze_chain.py", "freeze_chain.py")
    pin(REPLAY / "replay_chain.py", "replay_chain.py", prefix_receipt["runnerSHA256"])
    pin(REPLAY / "extend_replay.py", "extend_replay.py", extension_receipt["runnerSHA256"])
    pin(prefix / "runner.py", "prefix-runner.py", prefix_receipt["runnerSHA256"])
    pin(extension / "runner.py", "extension-runner.py", extension_receipt["runnerSHA256"])
    pin(extension / "replay_chain.py", "extension-helper.py", extension_receipt["runnerHelperSHA256"])
    pin(prefix_receipt_path, "prefix-receipt.json", extension_receipt["freshPrefixReceiptSHA256"])
    pin(extension_receipt_path, "extension-receipt.json")
    pin(prefix / "selected-chain.json", "selected-chain.json", prefix_receipt["selectionManifestSHA256"])
    pin(REPLAY / "selected-chain.json", "canonical-selected-chain.json", prefix_receipt["selectionManifestSHA256"])
    for f in ["lean-rc2-entry.c", "lean-rc2-entry"]:
        pin(runtime / f, f, snapshot=f.endswith(".c"))
    pin(distribution / "src/lean/Lean/Elab/Import.lean", "OfficialImport.lean")
    pin(distribution / "src/lean/Lean/Shell.lean", "OfficialShell.lean")
    pin(distribution / "src/lean/Lean/Util/Path.lean", "OfficialPath.lean")

    check("original commit", subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=repo,
           text=True).strip() == manifest["originalCommit"])
    check("original kernel", kernel_before == manifest["kernelSHA256"])
    inventory = read_json(NAVIER / manifest["originalInventory"]["path"])
    pin(NAVIER / manifest["originalInventory"]["path"], "accepted-original-inventory.json",
        manifest["originalInventory"]["sha256"])
    check("all 2669 tracked original files present and unchanged", len(before) == 2669 and
          all(v is not None for v in before.values()) and before == inventory)
    for root, label in [(prefix, "prefix"), (extension, "extension")]:
        for stage in ["before", "after"]:
            p = root / f"original-source-hashes-{stage}.json"
            pin(p, f"{label}-original-{stage}.json")
            check(f"{label} original {stage} inventory", read_json(p) == inventory)
    check("prefix fresh compilation semantics", prefix_receipt["status"] == "PASS" and
          prefix_receipt["initialCustomOleanCount"] == 0 and
          prefix_receipt["existingCustomObjectsImported"] is False)
    check("extension compilation semantics", extension_receipt["status"] == "PASS" and
          extension_receipt["previousComponentAttemptObjectsImported"] is False and
          extension_receipt["thisConsumerObjectAbsentBeforeCompilation"] is True)

    rows = [dict(row, root=prefix) for row in prefix_receipt["modules"]]
    rows.append(dict(extension_receipt, root=extension))
    selections = {x["name"]: x for x in manifest["modules"]}
    ext_accepted_path = NAVIER / extension_receipt["acceptedReceipt"]
    ext_accepted = read_json(ext_accepted_path)
    selections[extension_receipt["module"]] = {
        "source": str((ext_accepted_path.parent / (extension_receipt["module"] + ".lean")).relative_to(NAVIER)),
        "sourceSHA256": ext_accepted["sourceSHA256"],
        "receipt": extension_receipt["acceptedReceipt"],
        "receiptSHA256": extension_receipt["acceptedReceiptSHA256"],
        "expectedDeclarations": sorted(ext_accepted["printedAxioms"]),
    }
    names = [row["module"] for row in rows]
    check("14 distinct modules", len(names) == len(set(names)) == 14)
    custom_imports = {}
    total_axioms = 0
    module_details = []
    for row in rows:
        name, root = row["module"], row["root"]
        selection = selections[name]
        check(name + " successful compilation", row["status"] == "PASS" and row["exitCode"] == 0)
        source = root / (name + ".lean")
        original = NAVIER / selection["source"]
        accepted_path = NAVIER / selection["receipt"]
        pin(original, name + "-accepted.lean", selection["sourceSHA256"])
        pin(accepted_path, name + "-accepted-receipt.json", selection["receiptSHA256"])
        accepted = read_json(accepted_path)
        check(name + " accepted exact source", accepted["status"] == "PASS" and
              accepted["sourceSHA256"] == selection["sourceSHA256"] and
              row["sourceSHA256"] == selection["sourceSHA256"])
        for suffix, field in [(".lean", "sourceSHA256"), (".log", "logSHA256"), (".olean", "oleanSHA256")]:
            pin(root / (name + suffix), name + suffix, row[field], snapshot=suffix != ".olean")
        log = (root / (name + ".log")).read_text()
        entries = axiom_entries(log)
        audited = dict(entries)
        check(name + " exact axiom targets", len(entries) == len(audited) and
              sorted(audited) == sorted(selection["expectedDeclarations"]) and
              audited == row["printedAxioms"] and audited == accepted["printedAxioms"])
        check(name + " standard axioms only", len(audited) > 0 and
              all(set(xs) <= STANDARD_AXIOMS for xs in audited.values()) and
              "sorryAx" not in log and ": error:" not in log)
        total_axioms += len(audited)
        lines = [l for l in source.read_text().splitlines()
                 if re.match(r"^\s*(?:public\s+)?(?:meta\s+)?import\b", l)]
        check(name + " actual header recognized by runner", bool(lines) and
              all(re.fullmatch(r"import\s+(\S+)\s*", l) is not None for l in lines))
        imports = [l.split()[1] for l in lines]
        custom_imports[name] = [x for x in imports if x in names]
        check(name + " source dependency order", all(names.index(x) < names.index(name)
              for x in custom_imports[name]))
        module_details.append({"module": name, "sourceSHA256": row["sourceSHA256"],
                               "oleanSHA256": row["oleanSHA256"], "axiomCount": len(audited),
                               "directCustomImports": custom_imports[name]})
    check("101 prefix plus 9 extension equals 110 declaration audits", total_axioms == 110 and
          prefix_receipt["auditedDeclarationCount"] == 101 and
          extension_receipt["combinedAuditedDeclarationCount"] == 110)
    check("13 plus 1 compilation count is accurately represented", len(rows) == 14 and
          prefix_receipt["moduleCount"] == 13 and extension_receipt["freshPrefixModuleCount"] == 13 and
          extension_receipt["combinedRecompiledModuleCount"] == 14)
    for i, binding in enumerate(manifest["evidenceBindings"]):
        pin(NAVIER / binding["path"], f"mathematical-binding-{i}.json", binding["sha256"])

    prefix_env = environment(runtime, [prefix])
    extension_env = environment(runtime, [extension, prefix])
    help_run, help_log = run_logged([lake, "env", "lean", "--help"], cwd=repo, env=prefix_env,
                                   logfile=output / "lean-help.log")
    deps_run, deps_log = run_logged([lake, "env", "lean", "--root", str(prefix), "--deps",
                                    str(prefix / "ConcreteProducer.lean")], cwd=repo, env=prefix_env,
                                   logfile=output / "direct-deps-option.log")
    check("preserved launcher dependency-option limitation recorded", help_run["exitCode"] == 0 and
          "--deps" in help_log and deps_run["exitCode"] == 1 and "unrecognized option '--deps'" in deps_log)
    official_shell = (distribution / "src/lean/Lean/Shell.lean").read_text()
    official_import = (distribution / "src/lean/Lean/Elab/Import.lean").read_text()
    check("probe invokes official dependency implementation", "if opts.onlyDeps then\n    Elab.printImports contents fileName" in official_shell and
          "let fname ← findOLean dep.module" in official_import and
          "Lean.Elab.printImports source (some filename)" in (HERE / "DependencyProbe.lean").read_text())
    probe = snapshots / "DependencyProbe.lean"

    def resolve_group(label, root, group_rows, env, expected_path):
        lp_run, lean_path = run_logged([lake, "env", "printenv", "LEAN_PATH"], cwd=repo, env=env,
                                      logfile=output / (label + "-effective-path.log"))
        sources = [str(r["root"] / (r["module"] + ".lean")) for r in group_rows]
        command = [lake, "env", "lean", "--root", str(snapshots), "--run", str(probe), *sources]
        run, log = run_logged(command, cwd=repo, env=env, logfile=output / (label + "-resolved-imports.log"))
        return label, group_rows, lp_run, lean_path.strip(), expected_path, run, log

    with ThreadPoolExecutor(max_workers=2) as pool:
        jobs = [pool.submit(resolve_group, "prefix", prefix, rows[:-1], prefix_env, prefix_receipt["effectiveLeanPath"]),
                pool.submit(resolve_group, "extension", extension, rows[-1:], extension_env, extension_receipt["effectiveLeanPath"])]
        results = [job.result() for job in jobs]
    dependency_details = []
    probe_runs = []
    row_by_name = {row["module"]: row for row in rows}
    for label, group_rows, lp_run, effective, expected, run, log in results:
        probe_runs.append(run)
        check(label + " actual import search path unchanged", lp_run["exitCode"] == 0 and effective == expected)
        check(label + " original Lean dependency resolver succeeded", run["exitCode"] == 0)
        sections = dependency_sections(log) if run["exitCode"] == 0 else {}
        check(label + " every requested source resolved", set(sections) ==
              {str(r["root"] / (r["module"] + ".lean")) for r in group_rows})
        search_roots = [Path(x).resolve() for x in effective.split(os.pathsep) if x]
        allowed_roots = {prefix, extension} if label == "extension" else {prefix}
        check(label + " no earlier custom object visible", all(
              not (p / (name + ".olean")).exists()
              for p in search_roots if p not in allowed_roots for name in names))
        for row in group_rows:
            name = row["module"]
            deps = sections.get(str(row["root"] / (name + ".lean")), [])
            found_custom = []
            detail = {"module": name, "dependencies": []}
            for dep in deps:
                path = Path(dep).resolve()
                check(name + " resolved dependency exists: " + path.stem, path.is_file())
                digest = sha(path)
                is_custom = path.stem in names
                item = {"path": str(path), "sha256": digest, "custom": is_custom}
                if is_custom:
                    found_custom.append(path.stem)
                    expected_row = row_by_name[path.stem]
                    exact = expected_row["root"] / (path.stem + ".olean")
                    check(name + " uses newly compiled " + path.stem,
                          path == exact and digest == expected_row["oleanSHA256"])
                else:
                    check(name + " dependency belongs to original runtime: " + path.stem,
                          path.is_relative_to(runtime))
                detail["dependencies"].append(item)
            check(name + " exact direct custom dependencies", sorted(found_custom) == sorted(custom_imports[name]))
            dependency_details.append(detail)

    # Each direct edge has been resolved by Lean. Closing this finite DAG checks
    # transitive custom dependencies without calling a second import algorithm.
    closures = {}
    for name in names:
        closure = set(custom_imports[name])
        for dep in custom_imports[name]:
            closure.update(closures[dep])
        closures[name] = sorted(closure)

    after = tracked_inventory(repo)
    write_json(output / "original-source-hashes-after.json", after)
    check("read-only audit preserves all original sources", after == before == inventory)
    check("read-only audit preserves original kernel", sha(kernel) == kernel_before)
    check("all frozen evidence source log and object bytes unchanged during audit",
          all(sha(Path(item["path"])) == item["sha256"] for item in pins))
    passed = all(x["passed"] for x in checks)
    receipt = {
        "schema": "MathScope.IndependentFreshAxisReplayAudit/1", "status": "PASS" if passed else "FAIL",
        "startedUTC": started, "finishedUTC": timestamp(),
        "prefixReceiptSHA256": sha(prefix_receipt_path), "extensionReceiptSHA256": sha(extension_receipt_path),
        "moduleCount": len(rows), "auditedDeclarationCount": total_axioms,
        "allModuleObjectsResolvedFromFreshOutputs": all(x["passed"] for x in checks if "uses newly compiled" in x["name"]),
        "directDependencyResolutionMechanism": "Original Lean.Elab.printImports API, the exact official Lean.Shell --deps implementation",
        "launcherDepsOptionAvailable": False,
        "launcherDepsAttempt": deps_run, "helpAttempt": help_run, "resolverRuns": probe_runs,
        "modules": module_details, "actualResolvedDependencies": dependency_details,
        "transitiveCustomDependencyClosure": closures,
        "checksPassed": sum(x["passed"] for x in checks), "checksTotal": len(checks), "checks": checks,
        "inputPins": pins, "originalTrackedFileCount": len(before),
        "originalTrackedFilesPreserved": before == after,
        "kernelSHA256Before": kernel_before, "kernelSHA256After": sha(kernel),
        "mathematicalCompilationsRepeatedByThisAudit": False,
        "protectedComparatorPerformed": False, "originalGateAssessmentPerformed": False,
        "scope": "Independent read-only verification of 13 fresh source compilations plus one consumer compiled against that immutable prefix. Actual paths come from Lean's original parser and object resolver. This audit adds no mathematical theorem and does not relabel a numerical expression graph as fully evaluated.",
    }
    write_json(output / "receipt.json", receipt)
    print(json.dumps({"status": receipt["status"], "checks": f'{receipt["checksPassed"]}/{len(checks)}',
                      "modules": len(rows), "declarations": total_axioms,
                      "receipt": str(output / "receipt.json"), "sha256": sha(output / "receipt.json")}))
    return int(not passed)


if __name__ == "__main__":
    raise SystemExit(main())
