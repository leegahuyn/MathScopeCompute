"""Record bounded M4 software tests without granting mathematical acceptance."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import time
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]

SUITES = [
    ("semantic-session", "research-ide/mathscope-m4/recovery-20261019/tests/evidence-session.test.mjs"),
    ("observation-inspection", "research-ide/mathscope-m4/recovery-20261019/tests/inspect-evidence.test.mjs"),
    ("inherited-acceptance", "research-ide/mathscope-m4/tests/acceptance.test.mjs"),
    ("inherited-kernel-contract", "research-ide/mathscope-m4/tests/pinned-kernel-contract.test.mjs"),
    ("inherited-kernel-evidence", "research-ide/mathscope-m4/tests/kernel-evidence.test.mjs"),
    ("inherited-runtime", "research-ide/mathscope-m4/release-lab/runtime.test.mjs"),
]


def digest(path: Path) -> dict:
    content = path.read_bytes()
    return {"path": path.relative_to(ROOT).as_posix(), "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    out = Path(args.out).resolve()
    if not out.is_relative_to(HERE / "evidence"):
        raise ValueError("The output must be inside this recovery's evidence directory.")
    out.mkdir(parents=True, exist_ok=False)
    start = datetime.now(timezone.utc).isoformat()
    records = []
    for name, relative in SUITES:
        source = ROOT / relative
        expected = len(re.findall(r"^test\(", source.read_text(encoding="utf-8"), re.M))
        command = ["node", "--test-reporter=tap", relative]
        started = time.monotonic()
        try:
            completed = subprocess.run(command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120, check=False)
            stdout, stderr = completed.stdout, completed.stderr
            code, timeout = completed.returncode, False
        except subprocess.TimeoutExpired as error:
            stdout, stderr = error.stdout or b"", error.stderr or b""
            code, timeout = None, True
        stdout_path, stderr_path = out / (name + ".tap"), out / (name + ".stderr.log")
        stdout_path.write_bytes(stdout); stderr_path.write_bytes(stderr)
        text = stdout.decode("utf-8", errors="replace")
        counts = {key: int(values[-1]) if (values := re.findall(r"^# " + key + r" (\d+)$", text, re.M)) else None for key in ["tests", "pass", "fail", "cancelled", "skipped", "todo"]}
        ok = code == 0 and not timeout and counts["tests"] == expected and counts["pass"] == expected and counts["fail"] == 0 and counts["skipped"] == 0
        record = {"name": name, "command": command, "cwd": ".", "exitCode": code, "timeout": timeout, "elapsedSeconds": time.monotonic() - started, "expectedTestCount": expected, "counts": counts, "pass": ok, "source": digest(source), "stdout": digest(stdout_path), "stderr": digest(stderr_path), "scope": "Software contract/dated artifact readback only. No new Lean execution, browser inspection, or M3/M4 original acceptance."}
        records.append(record)
        (out / "execution.json").write_text(json.dumps({"schema": "MathScope.M4.RecoverySoftwareExecution/1", "startedAt": start, "suites": records, "complete": False}, indent=2) + "\n")
        print(json.dumps({"suite": name, "exitCode": code, "counts": counts, "pass": ok}), flush=True)
    source_commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    report = {"schema": "MathScope.M4.RecoverySoftwareExecution/1", "startedAt": start, "finishedAt": datetime.now(timezone.utc).isoformat(), "sourceCommit": source_commit, "nodeVersion": subprocess.check_output(["node", "--version"], text=True).strip(), "suites": records, "complete": True, "pass": all(x["pass"] for x in records), "tests": sum(x["counts"]["tests"] or 0 for x in records), "actualNewLeanExecution": False, "actualBrowserInspection": False, "grantsM4FinalAcceptance": False}
    (out / "execution.json").write_text(json.dumps(report, indent=2) + "\n")
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
