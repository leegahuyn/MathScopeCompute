#!/usr/bin/env python3
"""Rebuild the M0 theorem modules with the official Lean frontend/kernel.

This environment uses an explicit-root frontend driver because the normal CLI
cannot discover /proc/<pid>/exe.  The unchanged shared library and driver are
hashed.  Normal installations may instead use the Lake commands in the notes.
This script never changes the proof engine's shipped authority whitelist.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time

STANDARDS = {"propext", "Classical.choice", "Quot.sound"}
MODULES = ["Defs", "Finite", "Analytic", "Conditional", "Comparison", "Open"]

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def digest(value) -> str:
    return sha(json.dumps(value, ensure_ascii=False, sort_keys=True,
                          separators=(",", ":")).encode())

def strip_comments(source: str) -> str:
    """Remove nested Lean comments while preserving line boundaries."""
    out, i, depth = [], 0, 0
    while i < len(source):
        if source.startswith("/-", i):
            depth += 1; i += 2
        elif depth and source.startswith("-/", i):
            depth -= 1; i += 2
        elif depth:
            if source[i] == "\n": out.append("\n")
            i += 1
        elif source.startswith("--", i):
            j = source.find("\n", i)
            i = len(source) if j < 0 else j
        else:
            out.append(source[i]); i += 1
    return "".join(out)

def imports(source: str):
    source = strip_comments(source)
    result = [] if re.search(r"^\s*prelude\b", source, re.M) else ["Init"]
    # Imports are header commands.  Do not interpret JavaScript imports inside
    # downstream widget string literals as Lean dependencies.
    for line in source.splitlines():
        line = line.strip()
        if not line or line in {"module", "prelude"}: continue
        match = re.fullmatch(r"(?:(?:public|private|meta)\s+)*import\s+(.+)", line)
        if not match: break
        result.extend(x for x in match[1].split() if x != "all" and re.fullmatch(r"[A-Za-z_][\w.]*", x))
    return sorted(set(result))

def parse_targets(log: str):
    result = []
    pattern = r"'([^']+)' (does not depend on any axioms|depends on axioms:\s*\[([^]]*)\])"
    for match in re.finditer(pattern, log):
        name = match[1]
        axioms = [] if match[3] is None else [x.strip() for x in match[3].split(",") if x.strip()]
        before = log[:match.start()]
        start = before.rfind(name)
        statement = before[start:].strip() if start >= 0 else "MISSING_TARGET_TYPE"
        result.append({"target": name, "targetType": statement,
                       "axioms": {"all": axioms,
                                  "standard": [a for a in axioms if a in STANDARDS],
                                  "custom": [a for a in axioms if a not in STANDARDS]},
                       "sorry": any(a.endswith("sorryAx") for a in axioms)})
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--driver", type=Path, default=Path("/tmp/mathscope-lean-embed"))
    args = parser.parse_args()
    root = args.workspace.resolve()
    local = root / "mathscope-m0/lean"
    evidence = root / "mathscope-m0/evidence"
    evidence.mkdir(parents=True, exist_ok=True)
    build = local / ".lake/build/lib/lean"
    build.mkdir(parents=True, exist_ok=True)
    lean_root = root / "lean-4.34.1-linux"
    mathlib = root / "mathlib-ym-check"
    package_dirs = sorted((mathlib / ".lake/packages").iterdir())
    paths = [build, mathlib / ".lake/build/lib/lean"] + [p / ".lake/build/lib/lean" for p in package_dirs]
    env = os.environ.copy()
    env["LEAN_PATH"] = ":".join(str(p) for p in paths if p.exists())
    env["LEAN_SYSROOT"] = str(lean_root)
    version = subprocess.run([str(args.driver), str(lean_root), "--version"], env=env,
                             capture_output=True, text=True, check=True).stdout.strip()
    records = []
    for module in MODULES:
        source = local / f"MathScope/M0/{module}.lean"
        output = build / f"MathScope/M0/{module}.olean"
        output.parent.mkdir(parents=True, exist_ok=True)
        command = [str(args.driver), str(lean_root), "-o", str(output), str(source)]
        start = time.monotonic()
        run = subprocess.run(command, env=env, stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, text=True)
        elapsed = time.monotonic() - start
        log_path = evidence / f"lean-{module.lower()}-audit.txt"
        log_path.write_text(run.stdout)
        record = {"module": f"MathScope.M0.{module}", "sourceFile": f"MathScope/M0/{module}.lean",
                  "sourceSha256": sha(source.read_bytes()), "exitCode": run.returncode,
                  "elapsedSeconds": round(elapsed, 6), "command": command,
                  "standardCommand": f"lake env lean MathScope/M0/{module}.lean",
                  "logFile": log_path.name, "logSha256": sha(run.stdout.encode()),
                  "log": run.stdout, "targets": parse_targets(run.stdout),
                  "warnings": [line for line in run.stdout.splitlines() if "warning:" in line],
                  "sourceSorryToken": bool(re.search(r"\b(?:sorry|admit)\b", strip_comments(source.read_text()))),
                  "outputOleanSha256": sha(output.read_bytes()) if output.exists() and not run.returncode else None}
        records.append(record)
        print(f"{module}: exit={run.returncode}, targets={len(record['targets'])}, seconds={elapsed:.3f}")
        if run.returncode:
            print(run.stdout)
            raise SystemExit(1)

    negative = []
    for name in ["NegativeFalse", "NegativeMatrix"]:
        source = local / f"{name}.lean"
        command = [str(args.driver), str(lean_root), str(source)]
        start = time.monotonic()
        run = subprocess.run(command, env=env, stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, text=True)
        log_path = evidence / f"lean-{name.lower()}-audit.txt"
        log_path.write_text(run.stdout)
        negative.append({"name": name, "sourceFile": source.name,
                         "sourceSha256": sha(source.read_bytes()), "exitCode": run.returncode,
                         "elapsedSeconds": round(time.monotonic()-start, 6),
                         "expectedRejected": True, "rejected": run.returncode != 0,
                         "command": command, "log": run.stdout,
                         "logFile": log_path.name, "logSha256": sha(run.stdout.encode())})
        print(f"{name}: expected rejection, exit={run.returncode}")
        if run.returncode == 0:
            raise SystemExit("A required negative control unexpectedly compiled")

    source_roots = [local, mathlib, lean_root / "src/lean"] + package_dirs
    artifact_roots = paths + [lean_root / "lib/lean"]
    pending = [f"MathScope.M0.{x}" for x in MODULES]
    closure = {}
    missing = []
    while pending:
        module = pending.pop()
        if module in closure: continue
        relative = Path(*module.split("."))
        source = next((r / relative.with_suffix(".lean") for r in source_roots
                       if (r / relative.with_suffix(".lean")).exists()), None)
        artifact = next((r / relative.with_suffix(".olean") for r in artifact_roots
                         if (r / relative.with_suffix(".olean")).exists()), None)
        if not source or not artifact:
            missing.append({"module": module, "source": bool(source), "olean": bool(artifact)})
            closure[module] = {"module": module, "missing": True}
            continue
        next_imports = [x for x in imports(source.read_text()) if x != module]
        artifacts = []
        for extension in [".olean", ".olean.private", ".ir"]:
            path = artifact.with_suffix(extension)
            if path.exists(): artifacts.append({"kind": extension, "sha256": sha(path.read_bytes())})
        closure[module] = {"module": module, "sourceSha256": sha(source.read_bytes()),
                           "imports": next_imports, "artifacts": artifacts}
        pending.extend(next_imports)
    imported_closure = [closure[k] for k in sorted(closure)]
    environment_manifest = {"schemaVersion": 1, "sourceAndCompiledImportClosure": imported_closure,
                            "closureMethod": "Recursive import declarations, resolving explicit source and LEAN_PATH roots; compiler target axioms audited independently.",
                            "unresolved": missing}
    manifest_bytes = json.dumps(environment_manifest, ensure_ascii=False, indent=2).encode() + b"\n"
    (evidence / "lean-environment.json").write_bytes(manifest_bytes)
    environment = {"leanVersion": version,
                   "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
                   "mathlibCommit": (mathlib / ".git/HEAD").read_text().strip(),
                   "mathlibLakeManifestSha256": sha((mathlib / "lake-manifest.json").read_bytes()),
                   "runtimeLibrarySha256": sha((lean_root / "lib/lean/libleanshared.so").read_bytes()),
                   "driverSha256": sha(args.driver.read_bytes()),
                   "driverSourceSha256": sha((local / "lean-embed-check.c").read_bytes()),
                   "importClosureDigest": digest(imported_closure),
                   "importManifestSha256": sha(manifest_bytes),
                   "importModuleCount": len(imported_closure), "unresolvedImportCount": len(missing),
                   "kernelModified": False, "runtimeModified": False, "verifierGuardModified": False,
                   "frontend": "official shared-library frontend with explicit installation root"}
    validation = {"schemaVersion": 1, "checkedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
                  "status": "KERNEL_CHECKED_WITH_EXPLICIT_SCOPES", "environment": environment,
                  "environmentDigest": digest(environment), "builds": records, "negativeControls": negative,
                  "absenceOfSorry": all(not r["sourceSorryToken"] and all(not t["sorry"] for t in r["targets"]) for r in records),
                  "scope": "Fixed finite integer complex, conditional real spectral implications and explicitly isolated user assumptions. No general quantum construction or global RH/BSD bridge.",
                  "localPaths": {"LEAN_PATH": env["LEAN_PATH"], "LEAN_SYSROOT": str(lean_root)}}
    (evidence / "lean-validation.json").write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n")
    print(f"Import closure modules: {len(imported_closure)}, unresolved: {len(missing)}")
    if missing:
        print(json.dumps(missing, ensure_ascii=False))
        raise SystemExit(1)
    if not validation["absenceOfSorry"]:
        raise SystemExit("Unexpected sorry in successful target")

if __name__ == "__main__":
    main()
