#!/usr/bin/env python3
"""Observe one fresh original-source localization gate in a new attempt folder.

The child has explicit time, address-space and observed RSS limits. Its exact
source bytes, raw output and independent Fraction checks are preserved even
on failure. Neither the original criteria nor any historical receipt changes.
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from fractions import Fraction
import hashlib
import json
import math
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
TEST_COUNT = 10


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def source_rows() -> list[dict]:
    seen: set[Path] = set()

    def closure(path: Path) -> None:
        path = path.resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError("A source import escaped the repository root.")
        if path in seen:
            return
        if not path.is_file():
            raise ValueError("A source import is missing: " + str(path.relative_to(ROOT)))
        seen.add(path)
        if path.suffix in [".mjs", ".js"]:
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', path.read_text()):
                closure(path.parent / spec)

    for path in [BASE / "source-localization.mjs", BASE / "tests/source-localization.test.mjs", Path(__file__)]:
        closure(path)
    for path in [ROOT / "research-ide/mathscope-m2/navier/research/evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json",
                 ROOT / "research-ide/mathscope-m2/navier/actual-common-global-wave-bounds.mjs"]:
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


def independent_checks(record: dict) -> dict:
    """Use closed polynomial coefficients, rational algebra and Decimal pairs.

    These finite checks are independent of the JavaScript derivative engine.
    The elementary all-order flatness argument and external source theorems
    are retained as their stated mathematical dependencies, not new Lean.
    """
    checks: list[dict] = []

    def check(name: str, passed: bool) -> None:
        checks.append({"id": name, "pass": bool(passed)})

    try:
        program = record["formulaProgram"]
        nodes, roots = program["nodes"], program["roots"]

        def qvalue(index: int) -> Fraction:
            node = nodes[index]
            if node["op"] != "rational":
                raise ValueError("Expected a literal rational scalar.")
            return Fraction(*map(int, node["args"]))

        def algebra(index: int, atoms: dict[int, Fraction]) -> Fraction:
            if index in atoms:
                return atoms[index]
            node = nodes[index]
            op, args = node["op"], node["args"]
            if op == "rational":
                return qvalue(index)
            if op == "add":
                return sum((algebra(i, atoms) for i in args), Fraction(0))
            if op == "multiply":
                return math.prod(algebra(i, atoms) for i in args)
            if op == "inverse":
                return 1 / algebra(args[0], atoms)
            if op == "integer_power":
                return algebra(args[0], atoms) ** args[1]
            raise ValueError("Unexpected operation in the independent rational identity: " + op)

        def multiplicative_form(index: int) -> tuple[Fraction, dict[int, int]]:
            node = nodes[index]
            if node["op"] == "rational":
                return qvalue(index), {}
            if node["op"] != "multiply":
                return Fraction(1), {index: 1}
            scalar, factors = Fraction(1), {}
            for child in node["args"]:
                coefficient, extra = multiplicative_form(child)
                scalar *= coefficient
                for factor, power in extra.items():
                    factors[factor] = factors.get(factor, 0) + power
            return scalar, factors

        # The closed coefficients follow the unsigned Lah-number expression,
        # rather than reusing the derivative recurrence implemented in JS.
        order = record["regularity"]["derivativeRecurrence"]["order"]
        closed = [0] * (2 * order + 1)
        if order == 0:
            closed[0] = 1
        else:
            for k in range(1, order + 1):
                closed[order + k] = (-1) ** (order - k) * math.factorial(order) // math.factorial(k) * math.comb(order - 1, k - 1)
        check("flat-exponential-jet-independent-closed-coefficients",
              list(map(int, record["regularity"]["derivativeRecurrence"]["coefficients"])) == closed)

        primitive = nodes[roots["primitive"]]
        args = primitive["args"]
        check("actual-primitive-unit-and-zero-branches-retained",
              primitive["op"] == "smooth_piecewise" and args[0] == roots["primitiveArgument"]
              and qvalue(args[1]) == Fraction(1, 2) and qvalue(args[2]) == 1
              and qvalue(args[3]) == 1 and qvalue(args[5]) == 0)

        expressions = program["parametersExactExpressions"]
        h_upper = Fraction(1, 2**4096)
        tau_ratio = algebra(roots["tau0"], {roots["qStar"]: Fraction(1)})
        z_exp = nodes[roots["z0"]]
        z_product = nodes[z_exp["args"][0]]
        z_log_factors = [i for i in z_product["args"] if nodes[i]["op"] == "log_positive"
                         and nodes[i]["args"] == [roots["tau0"]]]
        check("exact-original-domain-margin-with-positive-h-and-D",
              expressions["h"] == {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}}
              and expressions["T"] == {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]}
              and expressions["Md"] == {"integer": 1048576}
              and Fraction(1, 2) - h_upper > Fraction(1, 4)
              and algebra(roots["D"], {roots["h"]: h_upper}) == Fraction(1, 2) - h_upper
              and tau_ratio == Fraction(1, 32) and 4 * (tau_ratio + tau_ratio) == Fraction(1, 4)
              and z_exp["op"] == "exp" and z_product["op"] == "multiply"
              and roots["D"] in z_product["args"] and len(z_log_factors) == 1
              and qvalue(roots["r0"]) == 1)

        cutoff, operator = record["cutoff"], record["operator"]
        permutations = [(1, 2), (2, 0), (0, 1)]
        source_to_program = {value: index for index, value in enumerate(program["sourceNodeIds"])}
        correct = True
        for i, (j, k) in enumerate(permutations):
            terms = operator["velocity"][i]["terms"]
            labels = [(row["field"], row["component"], row["derivative"]) for row in terms]
            correct &= labels == [("A", k, j), ("A", j, k), ("A", k, None), ("A", j, None), ("B_e_theta", i, None)]
            for row, original, sign in zip(terms, [cutoff["body"], cutoff["body"], cutoff["gradient"][j], cutoff["gradient"][k], cutoff["body"]], [1, -1, 1, -1, 1]):
                coefficient, factors = multiplicative_form(source_to_program[row["coefficient"]])
                original_coefficient, original_factors = multiplicative_form(source_to_program[original])
                correct &= factors == original_factors and coefficient == sign * original_coefficient
        check("curl-product-signs-and-same-pressure-cutoff",
              correct and operator["pressure"] == [{"field": "p_loc", "derivative": None, "coefficient": cutoff["body"]}]
              and operator["undefinedLocalFieldsMultipliedByZero"] is False)

        check("external-whole-field-identification-not-promoted-to-execution",
              record["fieldInputs"]["externalExistenceAndSmoothness"]["actualFinalN6FieldConstructedHere"] is False
              and record["fieldInputs"]["sharedInstance"] == operator["sharedFieldInstance"]
              and record["scope"]["externalSourceFinalFieldIdentificationRequired"] is True
              and record["scope"]["fullN6FinalPotentialsConstructed"] is False
              and record["scope"]["fullLocalizedForceConstructed"] is False
              and record["scope"]["wholeN8ReconstructionComputed"] is False
              and record["scope"]["newLeanKernelProof"] is False)

        # Decimal.as_tuple preserves the exact decimal coefficient/exponent;
        # neither a floating-point tau nor displayed t is used in this proof.
        for row in record["decimalSamples"]:
            dec = Decimal(row["input"])
            parts = dec.as_tuple()
            coefficient = int("".join(map(str, parts.digits)))
            K = -parts.exponent
            tau_node = nodes[source_to_program[row["sourceTau"]]]
            check("exact-positive-initial-zero-extension-" + row["input"],
                  parts.sign == 0 and coefficient > 0 and K >= 1
                  and str(coefficient) == row["coefficient"] and -K == row["powerOfTen"]
                  and 2**8204 > 4 * K and 10 < 2**4
                  and row["comparison"]["exactIntegerCheck"]["right"] == str(4 * K)
                  and row["comparison"]["sourceLocalDomainContainsThisPoint"] is False
                  and row["cutoffState"] == "EXACT_TEMPORAL_ZERO_EXTENSION"
                  and row["normalizedVelocity"]["components"] == ["0", "0", "0"]
                  and row["physicalVelocity"]["components"] == ["0", "0", "0"]
                  and row["localizedZeroBranchEvaluated"] is True
                  and row["sourceLocalVelocityEvaluated"] is False
                  and row["missingSourceValuesSetToZero"] is False
                  and row["underflowReplacedByZero"] is False
                  and row["internalTauReconstructedFromDisplayedTime"] is False
                  and tau_node == {"op": "exp", "args": [source_to_program[row["sourceLogTau"]]]}
                  and (not row["displayTimeRoundedToOne"] or row["displayTime"] == 1))

        check("active-inner-path-is-an-enclosure-with-external-bridge",
              record["innerPath"]["allSelectedPathsInUnitPlateau"] is True
              and len(record["innerPath"]["sourceTheoremBridge"]["dependencies"]) == 2
              and all(Fraction(row["interval"]["lower"]) > 0
                      and Fraction(row["interval"]["upper"]) > Fraction(row["interval"]["lower"])
                      and row["externalSourceTheoremBridgeRequired"] is True
                      and row["physicalVelocity"]["binary64"] is None
                      for row in record["innerPath"]["rows"]))
    except Exception as error:
        checks.append({"id": "independent-record-structure", "pass": False,
                       "errorType": type(error).__name__, "message": str(error)})
    return {"schema": "MathScope.N7.SourceLocalizationIndependentFraction/1",
            "status": "PASS" if checks and all(row["pass"] for row in checks) else "FAIL",
            "checks": checks, "newLeanExecuted": False,
            "scope": "Independent closed finite derivative coefficients, exact source-domain ratios, Cartesian curl signs, and positive decimal-time comparisons. Original final-field existence and identification remain external source theorems."}


def main() -> int:
    if len(sys.argv) != 2 or not re.fullmatch(r"[1-9][0-9]*", sys.argv[1]):
        raise SystemExit("Usage: run-localization-source.py NEW_ATTEMPT_NUMBER")
    attempt = int(sys.argv[1])
    before = source_rows()
    out = BASE / "evidence/source-localization-20261012" / f"attempt{attempt}"
    out.mkdir(parents=True, exist_ok=False)
    snapshot = out / "new-source-snapshot"
    snapshot.mkdir()
    for path in [BASE / "source-localization.mjs", BASE / "tests/source-localization.test.mjs", Path(__file__).resolve()]:
        (snapshot / path.name).write_bytes(path.read_bytes())
    write_json(out / "source-bytes-before.json", {"files": before, "fileCount": len(before)})
    certificate = out / "localization.json"
    log_path = out / "node.log"
    command = ["node", "--max-old-space-size=5120", "--test", "--test-reporter=tap", "--test-concurrency=1",
               "research-ide/mathscope-m3/navier/tests/source-localization.test.mjs"]
    env = dict(os.environ, M3_N7_LOCALIZATION_EVIDENCE=str(certificate))

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
            # The sandbox's virtual subprocess pid is not its mounted /proc
            # pid. Observe only host PIDs emitted by this owned source worker.
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
    independent = {"status": "NOT_RUN", "checks": [], "newLeanExecuted": False}
    if code == 0 and certificate.is_file():
        independent = independent_checks(json.loads(certificate.read_text()))
    write_json(out / "independent-fraction.json", independent)

    def count(name: str) -> int | None:
        matches = re.findall(r"^# " + name + r" (\d+)$", raw, re.M)
        return int(matches[-1]) if matches else None

    def observed(key: str) -> int:
        return max((int(value) for value in re.findall('"' + key + r'":(\d+)', raw)), default=0)

    passed, failed, skipped = count("pass"), count("fail"), count("skipped")
    node_rss, node_peak, node_as = observed("rssBytes"), observed("maxRSSBytes"), observed("vmSizeBytes")
    paths = [log_path, out / "source-bytes-before.json", out / "source-bytes.json", out / "independent-fraction.json"]
    if certificate.is_file():
        paths.append(certificate)
    receipt = {"schema": "MathScope.N7.SourceLocalizationObservedExecution/1", "attempt": attempt,
               "startedAt": started, "finishedAt": datetime.now(timezone.utc).isoformat(),
               "command": command, "exitCode": code, "stoppedReason": stopped,
               "elapsedSeconds": elapsed, "timeoutSeconds": TIMEOUT,
               "stdoutAndStderrCombined": True, "rawOutputPreserved": True,
               "observedPeakSourceWorkerFamilyRSSBytes": peak_rss,
               "observedMaximumSingleProcessASBytes": peak_as,
               "nodeSelfReportedPeakRSSBytes": node_rss, "nodeResourceUsagePeakRSSBytes": node_peak,
               "nodeSelfReportedMaximumASBytes": node_as,
               "runnerObservedChildResourceUsagePeakRSSBytes": resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
               "memoryObservation": "Only the owned Node source worker's self-reported mounted /proc PID and descendants are observed; virtual subprocess PIDs are not used to probe unrelated processes. Address-space limits apply to the launched process and descendants.",
               "sourceWorkerFamilyRSSLimitBytes": MAX_RSS, "perProcessAddressSpaceLimitBytes": MAX_AS,
               "nodeTests": {"passed": passed, "failed": failed, "skipped": skipped},
               "sourceFilesUnchanged": before == after, "sourceFileCount": len(before),
               "independentStatus": independent["status"], "independentCheckCount": len(independent["checks"]),
               "artifacts": [{"path": str(path.relative_to(ROOT)), "sha256": digest(path), "bytes": path.stat().st_size} for path in paths],
               "originalN701CriterionComplete": False, "originalFinalN6FieldsConstructed": False,
               "fullLocalizedForceConstructed": False, "wholeN8ReconstructionComputed": False,
               "newLeanExecuted": False, "wholeM3Complete": False,
               "pass": code == 0 and stopped is None and before == after
                       and passed == TEST_COUNT and failed == 0 and skipped == 0
                       and independent["status"] == "PASS" and certificate.is_file()
                       and max(peak_rss, node_rss, node_peak) <= MAX_RSS
                       and max(peak_as, node_as) <= MAX_AS}
    write_json(out / "receipt.json", receipt)
    print(json.dumps(receipt, ensure_ascii=False, indent=2), flush=True)
    return 0 if receipt["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
