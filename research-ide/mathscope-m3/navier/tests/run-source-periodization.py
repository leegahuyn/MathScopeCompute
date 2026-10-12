#!/usr/bin/env python3
"""Observe one fresh original-source periodization gate in a new attempt folder.

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

    for path in [BASE / "source-periodization.mjs", BASE / "tests/source-periodization.test.mjs", Path(__file__)]:
        closure(path)
    for path in [ROOT / "research-ide/mathscope-m2/navier/research/evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json",
                 ROOT / "research-ide/mathscope-m2/navier/actual-common-global-wave-bounds.mjs"]:
        closure(path)
    for path in [BASE / "evidence/source-localization-20261012/attempt1/localization.json",
                 BASE / "evidence/source-localization-20261012/attempt1/receipt.json"]:
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
    """Independently check exact transport arithmetic and the emitted source DAG.

    This uses Python Fractions and closed chain-rule factors, without importing
    the JavaScript graph engine. Final-field and comparison premises stay open.
    """
    checks: list[dict] = []

    def check(name: str, passed: bool) -> None:
        checks.append({"id": name, "pass": bool(passed)})

    try:
        program = record["formulaProgram"]
        nodes, roots = program["nodes"], program["roots"]
        prior = json.loads((BASE / "evidence/source-localization-20261012/attempt1/localization.json").read_text())
        original = prior["formulaProgram"]
        source_to_program = {value: index for index, value in enumerate(program["sourceNodeIds"])}
        canonical = json.dumps(program, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
        check("full-export-program-SHA256", hashlib.sha256(canonical).hexdigest() == record["graph"]["scalarProgramSHA256"])
        check("original-localization-program-preserved-as-an-exact-prefix",
              nodes[:len(original["nodes"])] == original["nodes"]
              and program["sourceNodeIds"][:len(original["sourceNodeIds"])] == original["sourceNodeIds"]
              and program["sourceLocalizationRoots"] == original["roots"]
              and program["sourceInnerProgramRoots"] == original["sourceInnerProgramRoots"]
              and program["parametersExactExpressions"] == original["parametersExactExpressions"])
        check("same-source-localization-and-inner-path-certificates",
              record["graph"]["sourceLocalization"] == prior["graph"]
              and record["sourceBinding"]["commonFamilyGraph"] == prior["sourceBinding"]["common6FamilyGraph"]
              and record["sourceBinding"]["innerPathGraph"] == prior["innerPath"]["sourceInnerCertificateGraph"]
              and record["sourceBinding"]["sameOriginalFieldInstance"] == prior["fieldInputs"]["sharedInstance"])

        def evaluate(index: int, atoms: dict[int, Fraction] | None = None) -> Fraction:
            atoms = atoms or {}
            cache: dict[int, Fraction] = {}

            def ev(i: int) -> Fraction:
                if i in atoms:
                    return atoms[i]
                if i in cache:
                    return cache[i]
                node = nodes[i]
                op, args = node["op"], node["args"]
                if op == "rational":
                    result = Fraction(*map(int, args))
                elif op == "add":
                    result = sum((ev(j) for j in args), Fraction(0))
                elif op == "multiply":
                    result = math.prod(ev(j) for j in args)
                elif op == "inverse":
                    result = 1 / ev(args[0])
                elif op == "integer_power":
                    result = ev(args[0]) ** args[1]
                elif op == "sqrt_positive":
                    value = ev(args[0])
                    a, b = math.isqrt(value.numerator), math.isqrt(value.denominator)
                    if a*a != value.numerator or b*b != value.denominator:
                        raise ValueError("This independent rational branch is not a perfect square.")
                    result = Fraction(a, b)
                elif op == "smooth_piecewise":
                    argument, lo, hi = map(ev, args[:3])
                    result = ev(args[3] if argument <= lo else args[5] if argument >= hi else args[4])
                elif op == "source_step_derivative":
                    argument = ev(args[0])
                    if not (argument <= Fraction(1, 2) or argument >= 1):
                        raise ValueError("This check is restricted to the actual constant cutoff branches.")
                    result = Fraction(0)
                else:
                    raise ValueError("Unexpected operation in the independently evaluated rational branch: " + op)
                cache[i] = result
                return result
            return ev(index)

        request = record["request"]
        nu = Fraction(int(request["viscosity"]["numerator"]), int(request["viscosity"]["denominator"]))
        lam = int(request["spatialScale"])
        margin = lam**2 * nu.denominator - 4 * nu.numerator
        check("exact-positive-viscosity-and-strict-integer-support-gap",
              nu > 0 and lam > 1 and margin > 0
              and str(margin) == request["support"]["strictSquaredMarginNumerator"]
              and Fraction(margin, int(request["support"]["denominator"])) == 1 - 4*nu/lam**2
              and request["support"]["strictlyPositive"] is True)
        check("same-exact-selected-scalars-in-the-actual-program",
              evaluate(roots["nu"]) == nu and evaluate(roots["lambda"]) == lam)
        t0 = 1 - Fraction(1, lam**2)
        end = 1 + Fraction(1, lam**2)
        check("time-shift-preserves-terminal-one-and-source-force-support",
              Fraction(int(request["t0"]["numerator"]), int(request["t0"]["denominator"])) == t0
              and Fraction(int(request["forceTimeUpper"]["numerator"]), int(request["forceTimeUpper"]["denominator"])) == end
              and evaluate(roots["t0"]) == t0 and evaluate(roots["forceEnd"]) == end
              and evaluate(roots["originalTime"], {roots["tau"]: Fraction(1, lam**2)}) == 0
              and evaluate(roots["originalTime"], {roots["tau"]: Fraction(0)}) == 1)
        sqrt_nu = evaluate(roots["sqrtNu"])
        spatial, temporal = Fraction(lam) / sqrt_nu, Fraction(lam**2)
        velocity, pressure, force = lam*sqrt_nu, lam**2*nu, lam**3*sqrt_nu
        actual_scales = {name:evaluate(roots[name]) for name in
                         ["spacePullback", "timePullback", "velocityScale", "pressureScale", "forceScale", "energyScale"]}
        check("actual-space-time-velocity-pressure-force-scales",
              actual_scales == {"spacePullback":spatial, "timePullback":temporal, "velocityScale":velocity,
                                "pressureScale":pressure, "forceScale":force, "energyScale":nu**2*sqrt_nu/lam})
        pde = [velocity*temporal, velocity**2*spatial, nu*velocity*spatial**2, pressure*spatial, force]
        check("independent-five-term-momentum-chain-rule", all(value == force for value in pde))
        poisson = [pressure*spatial**2, velocity**2*spatial**2, force*spatial]
        check("independent-pressure-Poisson-includes-force-divergence", all(value == lam**4 for value in poisson))
        volume, time_measure = spatial**-3, temporal**-1
        energy = [velocity**2*volume, nu*(velocity*spatial)**2*volume*time_measure,
                  force*velocity*volume*time_measure, force**2*volume*time_measure**2]
        check("independent-whole-space-and-time-energy-Jacobians",
              all(value == nu**2*sqrt_nu/lam for value in energy)
              and record["energy"]["timeIntegralJacobianRetained"] is True
              and record["energy"]["wholeSpaceJacobianRetained"] is True)

        # Exact test values for the open scalar coordinates; none is claimed
        # to be a numerical value of the microscopic original parameters.
        old = program["sourceLocalizationRoots"]
        atoms = {old["tau0"]:Fraction(1, 128), old["z0"]:Fraction(1, 16), old["r0"]:Fraction(1),
                 roots["x1"]:Fraction(0), roots["x2"]:Fraction(0), roots["x3"]:Fraction(0)}
        inside = atoms[old["tau0"]] / (4*temporal)
        outside = 2*atoms[old["tau0"]] / temporal
        unit = dict(atoms)
        unit[roots["tau"]] = inside
        zero = dict(atoms)
        zero[roots["tau"]] = outside
        check("actual-transported-cutoff-constant-branches-independent-evaluation",
              evaluate(roots["cutoff"], unit) == 1 and evaluate(roots["cutoff"], zero) == 0)
        check("actual-transformed-gradient-and-time-derivative-constant-branches",
              all(evaluate(roots[name], sample) == 0 for name in ["gradient_0", "gradient_1", "gradient_2", "dt"]
                  for sample in [unit, zero]))
        check("original-curl-product-components-and-pressure-retained",
              all(len(row["terms"]) == 5 for row in record["operator"]["velocity"])
              and len(record["operator"]["pressure"]) == 1
              and record["operator"]["originalCoordinateDerivativesRetained"] is True
              and record["operator"]["force"]["coefficient"] == program["sourceNodeIds"][roots["forceScale"]]
              and record["operator"]["arbitraryLerayProjectionApplied"] is False)
        check("original-unit-torus-and-disjoint-whole-support",
              record["support"]["periods"] == ["1", "1", "1"]
              and record["support"]["domain"] == "R^3/Z^3"
              and record["support"]["atMostNonzeroTranslatesAtOnePoint"] == 1
              and record["support"]["originalUnitTorusPreserved"] is True
              and record["support"]["N8TwoPiGalerkinDomainSubstituted"] is False
              and evaluate(roots["gap"]) == 1-2*sqrt_nu/lam > 0)
        check("same-force-pressure-initial-data-and-energy-premises-remain-explicit",
              record["comparison"]["wholeSpace"]["sameForceAndZeroDatumRequired"] is True
              and record["comparison"]["wholeSpace"]["boundedKineticEnergyRequired"] is True
              and record["comparison"]["wholeSpace"]["pressureGradientControlRequired"] is True
              and record["comparison"]["periodic"]["sameTransformedForceRequired"] is True
              and record["comparison"]["periodic"]["sameZeroDatumRequired"] is True
              and record["comparison"]["periodic"]["periodicPressureRequired"] is True
              and record["comparison"]["originalComparisonConclusionIssued"] is False
              and record["operator"]["force"]["sourceForceConstructed"] is False
              and record["energy"]["sourceWholeKEnergyAvailable"] is False
              and record["energy"]["finiteCoreEnergyUsedAsWholeEnergy"] is False
              and record["time"]["postTerminalVelocityExtensionClaimed"] is False
              and all(record["scope"][name] is False for name in ["originalFinalN6FieldConstructed", "fullLocalizedForceConstructed",
                  "wholeEnergyRefinementExecuted", "originalN708Complete", "wholeM3Complete", "newLeanExecuted"]))
    except Exception as error:
        checks.append({"id":"independent-record-structure", "pass":False,
                       "errorType":type(error).__name__, "message":str(error)})
    return {"schema":"MathScope.N7.SourcePeriodizationIndependentFraction/1",
            "status":"PASS" if checks and all(row["pass"] for row in checks) else "FAIL",
            "checks":checks, "newLeanExecuted":False,
            "scope":"Independent exact transport and support arithmetic, source-program preservation, and actual cutoff constant branches. Whole fields, force extension, energy and comparison hypotheses remain unresolved."}


def main() -> int:
    if len(sys.argv) != 2 or not re.fullmatch(r"[1-9][0-9]*", sys.argv[1]):
        raise SystemExit("Usage: run-source-periodization.py NEW_ATTEMPT_NUMBER")
    attempt = int(sys.argv[1])
    before = source_rows()
    out = BASE / "evidence/source-periodization-20261012" / f"attempt{attempt}"
    out.mkdir(parents=True, exist_ok=False)
    snapshot = out / "new-source-snapshot"
    snapshot.mkdir()
    for path in [BASE / "source-periodization.mjs", BASE / "tests/source-periodization.test.mjs", Path(__file__).resolve()]:
        (snapshot / path.name).write_bytes(path.read_bytes())
    write_json(out / "source-bytes-before.json", {"files": before, "fileCount": len(before)})
    certificate = out / "periodization.json"
    log_path = out / "node.log"
    command = ["node", "--max-old-space-size=5120", "--test", "--test-reporter=tap", "--test-concurrency=1",
               "research-ide/mathscope-m3/navier/tests/source-periodization.test.mjs"]
    env = dict(os.environ, M3_N7_PERIODIZATION_EVIDENCE=str(certificate))

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
    node_rss, node_peak, node_as = observed("rssBytes"), observed("maximumRSSBytes"), observed("addressSpaceBytes")
    paths = [log_path, out / "source-bytes-before.json", out / "source-bytes.json", out / "independent-fraction.json"]
    if certificate.is_file():
        paths.append(certificate)
    receipt = {"schema": "MathScope.N7.SourcePeriodizationObservedExecution/1", "attempt": attempt,
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
               "originalN708CriterionComplete": False, "originalFinalN6FieldsConstructed": False,
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
