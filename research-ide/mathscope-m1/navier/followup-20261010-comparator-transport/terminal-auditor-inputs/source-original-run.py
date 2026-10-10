#!/usr/bin/env python3
"""Reproduce pinned original validation; never convert a failed stage to PASS."""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.request


def digest(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def capture_git_status(repo, evidence, env):
    """Preserve Git's two output streams; diagnostics are not porcelain entries."""
    label = "source-status-after"
    record = {"label": label,
              "command": ["git", "status", "--porcelain", "--untracked-files=no"],
              "cwd": str(repo), "startedUTC": utc()}
    stdout_path = evidence / (label + ".stdout.log")
    stderr_path = evidence / (label + ".stderr.log")
    log_path = evidence / (label + ".log")
    code = None
    with stdout_path.open("wb") as stdout, stderr_path.open("wb") as stderr:
        try:
            process = subprocess.run(record["command"], cwd=repo, env=env,
                                     stdout=stdout, stderr=stderr, check=False)
            code = process.returncode
        except OSError as exc:
            record["launchError"] = f"{type(exc).__name__}: {exc}"
    # Retain the customary complete log as well as the exact stream bytes.
    # This grouping does not claim to reproduce cross-stream event ordering.
    with log_path.open("wb") as log:
        for title, path in ((b"stdout", stdout_path), (b"stderr", stderr_path)):
            log.write(b"--- " + title + b" ---\n")
            with path.open("rb") as source:
                shutil.copyfileobj(source, log)
            log.write(b"\n")
    record.update(exitCode=code, completedUTC=utc(),
                  stdoutLog=stdout_path.name, stderrLog=stderr_path.name,
                  stdoutBytes=stdout_path.stat().st_size,
                  stderrBytes=stderr_path.stat().st_size,
                  stdoutSHA256=digest(stdout_path), stderrSHA256=digest(stderr_path),
                  logSHA256=digest(log_path))
    return record


def require_clean_git_status(record):
    """Fail closed on a failed Git command or any porcelain output."""
    if record["exitCode"] != 0:
        raise RuntimeError(f"source-status-after exited with {record['exitCode']}"
                           + (f": {record['launchError']}" if "launchError" in record else ""))
    if record["stdoutBytes"] != 0:
        raise RuntimeError("Original tracked source status is not clean")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["default-build", "comparator"], required=True)
    parser.add_argument("--work", type=Path, required=True)
    args = parser.parse_args()
    pins_path = Path(__file__).with_name("pins.json")
    pins = json.loads(pins_path.read_text())
    base = args.work.resolve()
    base.mkdir(parents=True, exist_ok=True)
    evidence = base / "evidence"
    evidence.mkdir()
    env = os.environ.copy()
    # No credentials are needed: all source repositories and archives are public.
    for name in ("GITHUB_TOKEN", "GH_TOKEN", "LEAN_PATH", "LEAN_SRC_PATH", "LEAN_SYSROOT"):
        env.pop(name, None)
    for name in list(env):
        if name.startswith("COMPARATOR_"):
            env.pop(name)
    result = {
        "schema": "MathScope.ProtectedOriginalCI/1", "status": "RUNNING",
        "mode": args.mode, "startedUTC": utc(), "pins": pins,
        "pinsSHA256": digest(pins_path), "steps": [],
        "sourceChanges": False, "guardChanges": False,
        "uid": os.getuid(), "euid": os.geteuid(),
        "kernel": os.uname().release, "exitCode": None,
    }

    def save():
        (evidence / "result.json").write_text(json.dumps(result, indent=2) + "\n")

    def run(label, command, cwd=base, check=True):
        record = {"label": label, "command": list(map(str, command)),
                  "cwd": str(cwd), "startedUTC": utc()}
        result["steps"].append(record)
        save()
        log_path = evidence / (label + ".log")
        print(f"::group::{label}", flush=True)
        with log_path.open("w") as log:
            process = subprocess.Popen(record["command"], cwd=cwd, env=env,
                                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                       text=True, errors="replace")
            for line in process.stdout:
                log.write(line)
                log.flush()
                print(line, end="", flush=True)
            code = process.wait()
        print("::endgroup::", flush=True)
        record.update(exitCode=code, completedUTC=utc(), logSHA256=digest(log_path))
        save()
        if check and code:
            raise RuntimeError(f"{label} exited with {code}")
        return log_path.read_text()

    def clone(label, url, commit):
        target = base / label
        run(label + "-init", ["git", "init", target])
        run(label + "-remote", ["git", "remote", "add", "origin", url], target)
        run(label + "-fetch", ["git", "fetch", "--depth=1", "origin", commit], target)
        run(label + "-checkout", ["git", "checkout", "--detach", "FETCH_HEAD"], target)
        actual = run(label + "-head", ["git", "rev-parse", "HEAD"], target).strip()
        if actual != commit:
            raise RuntimeError(f"Unexpected {label} commit")
        return target

    def source_hashes(repo):
        names = subprocess.check_output(["git", "ls-files", "-z"], cwd=repo).split(b"\0")
        return {os.fsdecode(name): digest(repo / os.fsdecode(name)) for name in names if name}

    try:
        if os.geteuid() == 0:
            raise RuntimeError("Validation must use an unprivileged user")
        run("identity", ["id"])
        run("system", ["uname", "-a"])
        archive = base / "lean.tar.zst"
        print("Downloading the pinned official Lean archive", flush=True)
        with urllib.request.urlopen(pins["leanArchive"], timeout=90) as src, archive.open("wb") as dst:
            shutil.copyfileobj(src, dst, 1024 * 1024)
        actual = digest(archive)
        result["downloadedArchiveSHA256"] = actual
        if actual != pins["leanArchiveSHA256"]:
            raise RuntimeError("Lean archive hash mismatch")
        run("extract-official-lean", ["tar", "--zstd", "-xf", archive])
        archive.unlink()
        lean_root = base / "lean-4.34.0-rc2-linux"
        kernel = lean_root / "lib/lean/libleanshared.so"
        if digest(kernel) != pins["leanKernelSHA256"]:
            raise RuntimeError("Original Lean kernel hash mismatch")
        result["leanKernelSHA256"] = digest(kernel)
        env["PATH"] = str(lean_root / "bin") + os.pathsep + env["PATH"]
        lake = str(lean_root / "bin/lake")
        run("lean-version", [lean_root / "bin/lean", "--version"])
        run("lean-prefix", [lean_root / "bin/lean", "--print-prefix"])
        repo = clone("original-source", pins["repository"], pins["commit"])
        before = source_hashes(repo)
        (evidence / "source-hashes-before.json").write_text(json.dumps(before, indent=2) + "\n")
        for name, expected in pins["sourceFileSHA256"].items():
            if before.get(name) != expected:
                raise RuntimeError(f"Original pinned file hash mismatch: {name}")
        if (repo / "lean-toolchain").read_text().strip() != pins["toolchain"]:
            raise RuntimeError("Original toolchain mismatch")
        if digest(repo / pins["configuration"]) != pins["configurationSHA256"]:
            raise RuntimeError("Original Comparator configuration mismatch")
        config = json.loads((repo / pins["configuration"]).read_text())
        if config.get("enable_nanoda") is not True:
            raise RuntimeError("Original external kernel requirement missing")
        run("cache-get", [lake, "exe", "cache", "get"], repo)
        dep_heads = {}
        for name, key in (("Comparator", "comparatorCommit"), ("mathlib", "mathlibCommit"),
                          ("lean4export", "lean4exportCommit")):
            package = repo / ".lake/packages" / name
            head = run("pin-" + name, ["git", "rev-parse", "HEAD"], package).strip()
            if head != pins[key]:
                raise RuntimeError(f"Unexpected {name} dependency commit")
            dep_heads[name] = head
        result["dependencyHeads"] = dep_heads
        if args.mode == "default-build":
            run("original-default-build", [lake, "build"], repo)
            result["scope"] = "Unmodified original default targets: NavierStokes, Euler, ComparatorChallenges"
        else:
            landrun_repo = clone("landrun-source", **{
                "url": pins["landrun"]["repository"], "commit": pins["landrun"]["commit"]})
            nanoda_repo = clone("nanoda-source", **{
                "url": pins["nanoda"]["repository"], "commit": pins["nanoda"]["commit"]})
            tool_bin = base / "tool-bin"
            tool_bin.mkdir()
            run("go-version", ["go", "version"])
            run("rust-version", ["rustc", "--version"])
            run("build-landrun", ["go", "build", "-mod=readonly", "-o", tool_bin / "landrun", "cmd/landrun/main.go"], landrun_repo)
            run("build-nanoda", ["cargo", "build", "--release", "--locked", "--jobs", "2"], nanoda_repo)
            shutil.copy2(nanoda_repo / "target/release/nanoda_bin", tool_bin / "nanoda_bin")
            # Only trusted Comparator and exporter tools are built outside their guard.
            run("build-comparator-tools", [lake, "build", "comparator", "lean4export"], repo)
            export_bin = repo / ".lake/packages/lean4export/.lake/build/bin/lean4export"
            shutil.copy2(export_bin, tool_bin / "lean4export")
            env["PATH"] = str(tool_bin) + os.pathsep + env["PATH"]
            prebuilt = []
            for module in ("NavierStokes", "Euler", "ComparatorChallenges"):
                library = repo / ".lake/build/lib/lean"
                prebuilt += list((library / module).glob("**/*.olean"))
                if (library / (module + ".olean")).exists():
                    prebuilt.append(library / (module + ".olean"))
            result["originalProjectOleansBeforeComparator"] = list(map(str, prebuilt))
            if prebuilt:
                raise RuntimeError("Independent Comparator checkout already contains original project builds")
            if source_hashes(repo) != before:
                raise RuntimeError("Original tracked sources changed before Comparator")
            result["verificationToolSHA256"] = {
                name: digest(tool_bin / name) for name in ("landrun", "nanoda_bin", "lean4export")}
            result["comparatorBinarySHA256"] = digest(repo / ".lake/packages/Comparator/.lake/build/bin/comparator")
            guard = ["systemd-run", "--user", "--pty", "--wait", "--collect",
                     "--property=RestrictAddressFamilies=~AF_UNIX", "-E", "PATH=" + env["PATH"],
                     "--working-directory=" + str(repo), "--"]
            # Exercise the original guard and Landlock, without relying on a flag alone.
            probe = Path(__file__).with_name("probe.py")
            run("guard-preflight", guard + ["/usr/bin/python3", probe, "unix-socket"], repo)
            run("landlock-preflight", guard + [str(tool_bin / "landrun"), "--best-effort",
                "--ro", "/", "--rw", "/dev", "-ldd", "-add-exec", "--",
                "/usr/bin/python3", probe, "write-outside", str(base / "forbidden-write")], repo)
            comparator = repo / ".lake/packages/Comparator/.lake/build/bin/comparator"
            run("protected-comparator", guard + [lake, "env", str(comparator), pins["configuration"]], repo)
            audit = base / "SubmittedAxioms.lean"
            audit.write_text("import NavierStokes.ComparatorSolution\n" + "".join(
                f"#check {name}\n#print axioms {name}\n" for name in pins["theorems"]))
            run("submitted-type-and-axiom-audit", [lake, "env", "lean", str(audit)], repo)
            result["scope"] = "Original NavierStokes Comparator configuration, Lean kernel and required nanoda kernel"
        after = source_hashes(repo)
        (evidence / "source-hashes-after.json").write_text(json.dumps(after, indent=2) + "\n")
        result["trackedSourceBytesUnchanged"] = before == after
        if before != after or digest(kernel) != pins["leanKernelSHA256"]:
            raise RuntimeError("Original source or kernel changed during validation")
        print("::group::source-status-after", flush=True)
        source_status = capture_git_status(repo, evidence, env)
        result["steps"].append(source_status)
        save()
        for stream, name in ((sys.stdout, source_status["stdoutLog"]),
                             (sys.stderr, source_status["stderrLog"])):
            stream.write((evidence / name).read_text(errors="replace"))
            stream.flush()
        print("::endgroup::", flush=True)
        require_clean_git_status(source_status)
        result.update(status="PASS", exitCode=0)
    except Exception as exc:
        result.update(status="FAILED", exitCode=1, error=f"{type(exc).__name__}: {exc}")
        print(result["error"], file=sys.stderr, flush=True)
    finally:
        result["completedUTC"] = utc()
        result["finalFreeDiskBytes"] = shutil.disk_usage(base).free
        save()
    return result["exitCode"]


if __name__ == "__main__":
    sys.exit(main())
