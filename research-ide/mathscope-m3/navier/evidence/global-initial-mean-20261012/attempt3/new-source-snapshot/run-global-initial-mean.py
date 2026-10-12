#!/usr/bin/env python3
"""Observe a fresh N6 temporal-before-moment initialized mean execution without changing history.

Source bytes, the new implementation, all test output, failed attempts and
resource measurements are retained. An elapsed limit never counts as success.
Only this runner's owned Node workers and descendants may be terminated.
"""
from __future__ import annotations

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
MAX_RSS = 13 * 1024**3 // 2
MAX_AS = 7 * 1024**3
TIMEOUT = 1200
TEST_COUNT = 22
NEW_SOURCE = [BASE / "source-updated-mean-pressure.mjs", BASE / "source-global-initial-mean.mjs",
              BASE / "source-global-initial-mean-audit.mjs", BASE / "source-global-base-residual.mjs", BASE / "tests/updated-mean-pressure-kernel.test.mjs",
              BASE / "source-factored-auxiliary-closure.mjs", BASE / "tests/factored-auxiliary-closure.test.mjs",
              BASE / "tests/global-source-initial-mean.test.mjs", Path(__file__).resolve()]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def source_rows() -> list[dict]:
    seen: set[Path] = set()

    def closure(path: Path) -> None:
        path = path.resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise ValueError("Source import must remain an existing file in this repository.")
        if path in seen:
            return
        seen.add(path)
        if path.suffix in [".mjs", ".js"]:
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', path.read_text()):
                closure(path.parent / spec)

    for path in NEW_SOURCE:
        closure(path)
    return [{"path": str(path.relative_to(ROOT)), "sha256": digest(path), "bytes": path.stat().st_size}
            for path in sorted(seen)]


def family_memory(pid: int) -> tuple[int, int]:
    pending, seen = [pid], set()
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
            pending.extend(int(value) for value in Path(f"/proc/{here}/task/{here}/children").read_text().split())
        except (FileNotFoundError, ProcessLookupError):
            pass
    return rss, maximum_as


def main() -> int:
    if len(sys.argv) != 2 or not re.fullmatch(r"[1-9][0-9]*", sys.argv[1]):
        raise SystemExit("Usage: run-global-initial-mean.py NEW_ATTEMPT_NUMBER")
    attempt = int(sys.argv[1])
    before = source_rows()
    out = BASE / "evidence/global-initial-mean-20261012" / f"attempt{attempt}"
    out.mkdir(parents=True, exist_ok=False)
    snapshot = out / "new-source-snapshot"
    snapshot.mkdir()
    for path in NEW_SOURCE:
        (snapshot / path.name).write_bytes(path.read_bytes())
    write_json(out / "source-bytes-before.json", {"files": before, "fileCount": len(before)})
    certificate = out / "global-initial-mean.json"
    partial = out / "global-initial-mean-construction.json"
    base_residual = out / "global-base-residual.json"
    log_path = out / "node.log"
    command = ["node", "--max-old-space-size=5120", "--expose-gc", "--test", "--test-reporter=tap", "--test-concurrency=1",
               "research-ide/mathscope-m3/navier/tests/factored-auxiliary-closure.test.mjs",
               "research-ide/mathscope-m3/navier/tests/updated-mean-pressure-kernel.test.mjs",
               "research-ide/mathscope-m3/navier/tests/global-source-initial-mean.test.mjs"]
    env = dict(os.environ, M3_N6_GLOBAL_INITIAL_MEAN_EVIDENCE=str(certificate),
               M3_N6_GLOBAL_INITIAL_MEAN_PARTIAL=str(partial),
               M3_N6_GLOBAL_BASE_RESIDUAL_EVIDENCE=str(base_residual))

    def limit() -> None:
        resource.setrlimit(resource.RLIMIT_AS, (MAX_AS, MAX_AS))

    started = datetime.now(timezone.utc).isoformat()
    start = time.monotonic()
    peak_rss = peak_as = 0
    stopped = None
    with log_path.open("wb") as log:
        child = subprocess.Popen(command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT,
                                 start_new_session=True, preexec_fn=limit)
        while child.poll() is None:
            # A virtual subprocess PID differs from mounted /proc. Observe
            # only host PIDs self-reported by this owned source execution.
            raw = log_path.read_text(errors="replace")
            host_pids = {int(value) for value in re.findall(r'"hostPID":(\d+)', raw)}
            readings = [family_memory(pid) for pid in host_pids]
            rss = sum(row[0] for row in readings)
            asize = max((row[1] for row in readings), default=0)
            peak_rss, peak_as = max(peak_rss, rss), max(peak_as, asize)
            if rss > MAX_RSS:
                stopped = "OBSERVED_SOURCE_WORKER_RSS_LIMIT"
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
    write_json(out / "source-bytes.json", {"before": before, "after": after, "unchanged": before == after})
    raw = log_path.read_text(errors="replace")

    def count(name: str) -> int | None:
        matches = re.findall(r"^# " + name + r" (\d+)$", raw, re.M)
        return int(matches[-1]) if matches else None

    def observed(key: str) -> int:
        return max((int(value) for value in re.findall('"' + key + r'":(\d+)', raw)), default=0)

    passed, failed, skipped = count("pass"), count("fail"), count("skipped")
    node_rss, node_peak, node_as = observed("rssBytes"), observed("maxRSSBytes"), observed("vmSizeBytes")
    construction_unchanged = (partial.is_file() and digest(partial) == "873d331724dadce29348434d444c8f2ab4bfa767d6a05ab0eae37747931dead7")
    base_unchanged = (base_residual.is_file() and digest(base_residual) == "05efda02e3f3a39fa7f57d2d416540411d2f8b9ac80e06a134d3410d682cb4b0")
    paths = [log_path, out / "source-bytes-before.json", out / "source-bytes.json"]
    paths.extend(sorted(snapshot.iterdir()))
    if certificate.is_file():
        paths.append(certificate)
    if partial.is_file():
        paths.append(partial)
    if base_residual.is_file():
        paths.append(base_residual)
    receipt = {"schema": "MathScope.N6.GlobalInitialMeanObservedExecution/1", "attempt": attempt,
               "startedAt": started, "finishedAt": datetime.now(timezone.utc).isoformat(),
               "command": command, "exitCode": code, "stoppedReason": stopped,
               "elapsedSeconds": elapsed, "timeoutSeconds": TIMEOUT,
               "upstreamSourceStageMaximumNodes": 3500000, "temporalSourceStageMaximumNodes": 5000000,
               "initializedMeanDerivativeAuditMaximumNodes": 6500000,
               "nodeMaximumOldSpaceMiB": 5120,
               "exactMultiIndexLeibnizSharing": True,
               "exactSourceRowGroupingAndDisposableCacheLifetime": True,
               "explicitGCAfterCompletedCacheRelease": True,
               "actualConstructionByteIdenticalToPriorAttempt": construction_unchanged,
               "actualBaseResidualByteIdenticalToPriorAttempt": base_unchanged,
               "previousAttemptAndResourceLimitPreserved": True,
               "stdoutAndStderrCombined": True, "rawOutputPreserved": True,
               "observedPeakSourceWorkerFamilyRSSBytes": peak_rss,
               "observedMaximumSingleProcessASBytes": peak_as,
               "nodeSelfReportedPeakRSSBytes": node_rss, "nodeResourceUsagePeakRSSBytes": node_peak,
               "nodeSelfReportedMaximumASBytes": node_as,
               "runnerObservedChildResourceUsagePeakRSSBytes": resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
               "memoryObservation": "Only the owned Node source worker's self-reported mounted /proc PID and descendants are observed. The address-space cap applies to this launched process and descendants.",
               "sourceWorkerFamilyRSSLimitBytes": MAX_RSS, "perProcessAddressSpaceLimitBytes": MAX_AS,
               "nodeTests": {"passed": passed, "failed": failed, "skipped": skipped},
               "sourceFilesUnchanged": before == after, "sourceFileCount": len(before),
               "artifacts": [{"path": str(path.relative_to(ROOT)), "sha256": digest(path), "bytes": path.stat().st_size} for path in paths],
               "completeOriginalBaseResidualProgramExported": base_residual.is_file(),
               "actualTemporalBeforeMomentMeanConstructed": partial.is_file(),
               "actualNewDefectsUsedForFiveMoments": partial.is_file(),
               "fullMeanPressureRecomputedAfterBothUpdates": partial.is_file(),
               "everyNewInverseDerivativeTailMaterialized": code == 0 and certificate.is_file(),
               "initialConstructionArtifactSavedBeforeDerivativeAudit": partial.is_file(),
               "temporalMeanInverseApplied": partial.is_file(),
               "fullNonzeroAngularResidualAttached": False,
               "originalProp9_5ClassBoundsEstablished": False,
               "initializedJ0": False, "allOrderSourceClassBoundCertified": False,
               "completeN6": False, "newLeanExecuted": False, "wholeM3Complete": False,
               "pass": code == 0 and stopped is None and before == after and construction_unchanged and base_unchanged
                       and passed == TEST_COUNT and failed == 0 and skipped == 0 and certificate.is_file()
                       and max(peak_rss, node_rss, node_peak) <= MAX_RSS
                       and max(peak_as, node_as) <= MAX_AS}
    write_json(out / "receipt.json", receipt)
    print(json.dumps(receipt, ensure_ascii=False, indent=2), flush=True)
    return 0 if receipt["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
