#!/usr/bin/env python3
"""Record the generic exact Corollary8.5 stress controls, preserving source bytes.

This gate does not construct or authenticate a private original N6 current.
Its finite polynomial controls independently integrate all generic boundary,
torus, pressure and conservation remainders. No source completion is inferred.
"""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / "research-ide/mathscope-m3/navier"
NEW = [BASE / "source-updated-mean-stress.mjs", BASE / "tests/exact-polynomial-integral-control.mjs",
       BASE / "tests/updated-mean-stress-kernel.test.mjs", Path(__file__).resolve()]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def sources():
    seen = set()

    def visit(path):
        path = path.resolve()
        if not path.is_file() or not path.is_relative_to(ROOT):
            raise ValueError("Every imported source must exist inside this repository.")
        if path in seen:
            return
        seen.add(path)
        if path.suffix in [".mjs", ".js"]:
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', path.read_text()):
                visit(path.parent / spec)

    for path in NEW:
        visit(path)
    return [{"path": str(p.relative_to(ROOT)), "sha256": digest(p), "bytes": p.stat().st_size} for p in sorted(seen)]


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r"[1-9][0-9]*", sys.argv[1]):
        raise SystemExit("Usage: run-updated-mean-stress-kernel.py NEW_ATTEMPT_NUMBER")
    out = BASE / "evidence/updated-mean-stress-kernel-20261012" / ("attempt" + sys.argv[1])
    out.mkdir(parents=True, exist_ok=False)
    snapshot = out / "new-source-snapshot"
    snapshot.mkdir()
    before = sources()
    for path in NEW:
        (snapshot / path.name).write_bytes(path.read_bytes())
    save(out / "source-bytes-before.json", {"files": before, "fileCount": len(before)})
    command = ["node", "--max-old-space-size=256", "--test", "--test-reporter=tap",
               "research-ide/mathscope-m3/navier/tests/updated-mean-stress-kernel.test.mjs"]
    started = datetime.now(timezone.utc).isoformat()
    start = time.monotonic()
    stopped = None
    log_path = out / "node.log"
    with log_path.open("wb") as log:
        child = subprocess.Popen(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            code = child.wait(timeout=120)
        except subprocess.TimeoutExpired:
            stopped = "OBSERVED_GENERIC_CONTROL_TIME_LIMIT"
            os.killpg(child.pid, signal.SIGTERM)
            try:
                code = child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(child.pid, signal.SIGKILL)
                code = child.wait()
    after = sources()
    save(out / "source-bytes.json", {"before": before, "after": after, "unchanged": before == after})
    raw = log_path.read_text(errors="replace")

    def count(name):
        values = re.findall(r"^# " + name + r" (\d+)$", raw, re.M)
        return int(values[-1]) if values else None

    passed, failed, skipped = count("pass"), count("fail"), count("skipped")
    peak = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024
    paths = [log_path, out / "source-bytes-before.json", out / "source-bytes.json", *sorted(snapshot.iterdir())]
    receipt = {"schema": "MathScope.N6.UpdatedMeanStressKernelObservedExecution/1", "attempt": int(sys.argv[1]),
               "startedAt": started, "finishedAt": datetime.now(timezone.utc).isoformat(),
               "command": command, "exitCode": code, "stoppedReason": stopped,
               "elapsedSeconds": time.monotonic() - start, "timeoutSeconds": 120,
               "nodeMaximumOldSpaceMiB": 256, "ownedChildResourceUsagePeakRSSBytes": peak,
               "nodeTests": {"passed": passed, "failed": failed, "skipped": skipped},
               "sourceFilesUnchanged": before == after, "sourceFileCount": len(before),
               "artifacts": [{"path": str(p.relative_to(ROOT)), "sha256": digest(p), "bytes": p.stat().st_size} for p in paths],
               "independentExactPolynomialIntegrationExecuted": passed == 7 and failed == 0,
               "allGenericCompatibilityAndCutoffTermsRetained": passed == 7 and failed == 0,
               "actualOriginalSourceAttached": False, "sourceAuthenticated": False,
               "allOrderClassBoundsEstablished": False, "completeFourStepCycle": False,
               "initializedJ0": False, "completeN6": False, "wholeM3Complete": False,
               "pass": code == 0 and stopped is None and before == after and passed == 7 and failed == 0 and skipped == 0
                       and peak < 512 * 1024**2}
    save(out / "receipt.json", receipt)
    print(json.dumps(receipt, ensure_ascii=False, indent=2), flush=True)
    return 0 if receipt["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
