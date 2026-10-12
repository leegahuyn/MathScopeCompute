#!/usr/bin/env python3
"""Observed additive N6 source gate; each attempt is immutable.

This is a bounded child execution, not a mathematical timeout success.
The repository, historical evidence, M2 sources and unrelated processes
are never modified or terminated by this runner.
"""
from __future__ import annotations

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
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[4]
NAVIER = ROOT / "research-ide/mathscope-m3/navier"
MAX_RSS = 13 * 1024**3 // 2
MAX_AS = 7 * 1024**3
TIMEOUT = 1800


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_rows() -> list[dict]:
    paths = set((ROOT / "research-ide/mathscope-m2/navier").glob("*.mjs"))
    paths |= set((ROOT / "research-ide/mathscope-m1/navier").glob("*.mjs"))
    paths |= {ROOT / "research-ide/mathscope-m0/contracts.mjs"}
    paths |= {NAVIER / x for x in ["global-source-index.mjs", "source-global-band.mjs", "source-global-representative.mjs",
              "tests/global-source-index.test.mjs", "tests/global-source-band.test.mjs", "tests/global-source-representative.test.mjs", "tests/run-global-source.py"]}
    return [{"path": str(p.relative_to(ROOT)), "sha256": digest(p), "bytes": p.stat().st_size}
            for p in sorted(paths)]


def family_memory(pid: int) -> tuple[int, int]:
    pending = [pid]
    seen = set()
    rss = maximum_as = 0
    while pending:
        here = pending.pop()
        if here in seen:
            continue
        seen.add(here)
        try:
            status = Path(f"/proc/{here}/status").read_text()
            r = re.search(r"^VmRSS:\s+(\d+) kB$", status, re.M)
            a = re.search(r"^VmSize:\s+(\d+) kB$", status, re.M)
            rss += int(r[1]) * 1024 if r else 0
            maximum_as = max(maximum_as, int(a[1]) * 1024 if a else 0)
            pending.extend(int(x) for x in Path(f"/proc/{here}/task/{here}/children").read_text().split())
        except (FileNotFoundError, ProcessLookupError):
            pass
    return rss, maximum_as


def main() -> int:
    if len(sys.argv) != 2 or not re.fullmatch(r"[1-9][0-9]*", sys.argv[1]):
        raise SystemExit("Usage: run-global-source.py NEW_ATTEMPT_NUMBER")
    attempt = int(sys.argv[1])
    out = NAVIER / "evidence/global-source-20261012" / f"attempt{attempt}"
    out.mkdir(parents=True, exist_ok=False)
    before = source_rows()
    started = datetime.now(timezone.utc).isoformat()
    command = ["node", "--max-old-space-size=4608", "--test", "--test-concurrency=1", "--test-reporter=tap",
               "research-ide/mathscope-m3/navier/tests/global-source-index.test.mjs",
               "research-ide/mathscope-m3/navier/tests/global-source-band.test.mjs",
               "research-ide/mathscope-m3/navier/tests/global-source-representative.test.mjs"]
    env = os.environ.copy()
    env["M3_N6_GLOBAL_EVIDENCE"] = str(out / "global-band.json")

    def limit() -> None:
        resource.setrlimit(resource.RLIMIT_AS, (MAX_AS, MAX_AS))

    peak_rss = peak_as = 0
    stopped = None
    start = time.monotonic()
    with (out / "node.log").open("w") as log:
        child = subprocess.Popen(command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT,
                                 start_new_session=True, preexec_fn=limit)
        while child.poll() is None:
            # The runtime's process.pid/subprocess pid namespace differs
            # from mounted /proc PIDs. Only use host PIDs self-reported by
            # this owned Node child, rather than probing an unrelated PID.
            current_log = (out / "node.log").read_text(errors="replace")
            host_pids = {int(x) for x in re.findall(r'"hostPID":(\d+)', current_log)}
            readings = [family_memory(pid) for pid in host_pids]
            rss = sum(x[0] for x in readings)
            asize = max([x[1] for x in readings], default=0)
            peak_rss, peak_as = max(peak_rss, rss), max(peak_as, asize)
            if rss > MAX_RSS:
                stopped = "OBSERVED_CHILD_RSS_LIMIT"
            elif time.monotonic() - start > TIMEOUT:
                stopped = "OBSERVED_EXECUTION_TIME_LIMIT"
            if stopped:
                os.killpg(child.pid, signal.SIGTERM)
                try:
                    child.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(child.pid, signal.SIGKILL)
                break
            time.sleep(0.2)
        code = child.wait()
    elapsed = time.monotonic() - start
    after = source_rows()
    (out / "source-bytes.json").write_text(json.dumps({"before": before, "after": after, "unchanged": before == after}, indent=2) + "\n")
    raw = (out / "node.log").read_text()
    node_reported_rss = max([int(x) for x in re.findall(r'"rssBytes":(\d+)', raw)], default=0)
    node_resource_peak = max([int(x) for x in re.findall(r'"maxRSSBytes":(\d+)', raw)], default=0)
    node_reported_as = max([int(x) for x in re.findall(r'"vmSizeBytes":(\d+)', raw)], default=0)
    def count(name: str) -> int | None:
        values = re.findall(r"^# " + name + r" (\d+)$", raw, re.M)
        return int(values[-1]) if values else None
    paths = [out / "node.log", out / "source-bytes.json"]
    if (out / "global-band.json").exists():
        paths.append(out / "global-band.json")
    passed, failed = count("pass"), count("fail")
    receipt = {"schema": "MathScope.N6.GlobalSourceObservedExecution/1", "attempt": attempt,
               "startedAt": started, "finishedAt": datetime.now(timezone.utc).isoformat(),
               "command": command, "exitCode": code, "stoppedReason": stopped,
               "elapsedSeconds": elapsed, "timeoutSeconds": TIMEOUT,
               "observedPeakChildFamilyRSSBytes": peak_rss, "observedMaximumSingleProcessASBytes": peak_as,
               "nodeSelfReportedPeakRSSBytes": node_reported_rss,
               "nodeResourceUsagePeakRSSBytes": node_resource_peak,
               "nodeSelfReportedMaximumASBytes": node_reported_as,
               "memoryObservation": "Owned child's /proc/self/status host PID, Node resourceUsage and RSS checkpoints; virtual subprocess pid is not used as a mounted /proc PID.",
               "childFamilyRSSLimitBytes": MAX_RSS, "perProcessAddressSpaceLimitBytes": MAX_AS,
               "nodeTests": {"passed": passed, "failed": failed},
               "sourceFilesUnchanged": before == after, "sourceFileCount": len(before),
               "artifacts": [{"path": str(p.relative_to(ROOT)), "sha256": digest(p), "bytes": p.stat().st_size} for p in paths],
               "originalN604Complete": False, "allGlobalLabelsAndRadialIntegralsExecuted": False,
               "newLeanExecuted": False, "wholeM3Complete": False,
               "pass": code == 0 and stopped is None and before == after and passed == 19 and failed == 0
                       and max(peak_rss, node_resource_peak, node_reported_rss) <= MAX_RSS
                       and max(peak_as, node_reported_as) <= MAX_AS}
    (out / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt, indent=2), flush=True)
    return 0 if receipt["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
