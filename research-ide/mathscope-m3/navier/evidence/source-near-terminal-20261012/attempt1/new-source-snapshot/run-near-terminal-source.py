#!/usr/bin/env python3
"""Observe one fresh original-source three-component near-terminal gate in a new attempt folder.

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

    for path in [BASE / "source-near-terminal.mjs", BASE / "tests/source-near-terminal.test.mjs", Path(__file__)]:
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
    """Recompute the comparison series and exact three-component enclosures.

    Python Fraction performs the independent interval operations. This gate
    retains the positive nonlinear and pressure errors supplied by the pinned
    source evaluator. It does not re-prove the paper's final-field theorem or
    adopt a serialized object as a source-construction authority.
    """
    checks: list[dict] = []

    def check(name: str, passed: bool) -> None:
        checks.append({"id": name, "pass": bool(passed)})

    def bounds(row: dict) -> tuple[Fraction, Fraction]:
        return Fraction(row["lower"]), Fraction(row["upper"])

    def contains(outer: dict, inner: tuple[Fraction, Fraction]) -> bool:
        lower, upper = bounds(outer)
        return lower <= inner[0] <= inner[1] <= upper

    def positive_small_product(row: dict, exponent: int, base: int) -> tuple[Fraction, Fraction]:
        lower, upper = bounds(row)
        endpoint = Fraction(1, 1 << exponent)
        products = [Fraction(0), endpoint * lower, endpoint * upper]
        return Fraction(base) + min(products), Fraction(base) + max(products)

    try:
        core, leading = record["leading"]["freshCore"], record["leading"]["intervals"]
        degree = core["request"]["degree"]
        # Hstar=j0 and sigmaStar=j0/2000 at the exact original eta=0.
        chi = Fraction(4000000, 4000001)
        total = sum(((-chi) ** n / (math.factorial(n) * math.factorial(n + 1))
                     for n in range(degree + 1)), Fraction(0))
        next_term = (-chi) ** (degree + 1) / (math.factorial(degree + 1) * math.factorial(degree + 2))
        comparison = min(total, total + next_term), max(total, total + next_term)
        nonlinear = Fraction(290, 9 * (1 << (260 * 53)))
        rigorous = comparison[0] - nonlinear, comparison[1] + nonlinear
        phi = core["phi"]["rows"][0]
        check("exact-source-eta-zero-comparison-and-positive-Banach-error",
              chi == 1 / (1 + Fraction(1, 2000**2)) and nonlinear > 0
              and Fraction(phi["positiveNonlinearErrorUpper"]) == nonlinear
              and core["request"]["Y"] == "2"
              and core["request"]["eta"] == {"kind": "J_SCALED", "value": "0"})
        check("directed-Phi-enclosure-contains-independent-alternating-series-and-nonlinear-error",
              contains(phi["actualNonlinearInterval"], rigorous)
              and bounds(leading["azimuthal"]) == bounds(phi["actualNonlinearInterval"]))

        axial = core["axial"]
        u, du = axial["actualValues"]
        u_interval = positive_small_product(axial["rows"][0]["uOverK"], 16640, 1)
        average_eta_interval = positive_small_product(axial["rows"][1]["averageUCorrectionOverK"], 16380, 4)
        check("independent-U-divided-by-j0-uses-positive-K-over-Lambda-j0",
              u["etaDerivativeOrder"] == 0 and u["normalization"] == "DIVIDE_BY_POSITIVE_J0"
              and u["positiveCorrectionScale"] == "K/(Lambda*j0)"
              and contains(u["U"], u_interval)
              and bounds(leading["axial"]) == bounds(u["U"]))
        check("independent-ordinary-average-eta-derivative-uses-positive-K-over-Lambda",
              du["etaDerivativeOrder"] == 1 and du["normalization"] == "ORDINARY_ETA_DERIVATIVE"
              and du["positiveCorrectionScale"] == "K/Lambda"
              and contains(du["averageU"], average_eta_interval))
        average_eta = bounds(du["averageU"])
        check("actual-radial-leading-coefficient-negates-both-ordinary-average-eta-endpoints",
              bounds(leading["radial"]) == (-average_eta[1], -average_eta[0]))
        check("pressure-and-nonlinear-errors-retained-before-three-component-scaling",
              core["scope"]["positiveBanachErrorRetained"] is True
              and core["scope"]["actualPressureAnalyticErrorRetained"] is True
              and axial["pressure"]["actualPressureErrorRetained"] is True
              and all(Fraction(row["positiveNonlinearErrorUpper"]) > 0 for row in axial["rows"])
              and all(Fraction(row["analyticErrorUpper"]) > 0 for row in axial["pressure"]["derivatives"]))
        check("strict-leading-three-component-signs",
              bounds(leading["radial"])[1] < -3
              and bounds(leading["azimuthal"])[0] > Fraction(1, 2)
              and bounds(leading["axial"])[0] > Fraction(3, 4))

        program = record["formulaProgram"]
        nodes, roots = program["nodes"], program["roots"]
        source_to_program = {value: index for index, value in enumerate(program["sourceNodeIds"])}

        def qvalue(index: int) -> Fraction:
            node = nodes[index]
            if node["op"] != "rational":
                raise ValueError("Expected a literal rational scalar.")
            return Fraction(*map(int, node["args"]))

        def form(index: int) -> tuple[Fraction, dict[int, int]]:
            """Exact Laurent monomial normal form; other nodes remain atoms."""
            node = nodes[index]
            op, args = node["op"], node["args"]
            if op == "rational":
                return qvalue(index), {}
            if op == "multiply":
                scalar, factors = Fraction(1), {}
                for child in args:
                    coefficient, extra = form(child)
                    scalar *= coefficient
                    for factor, power in extra.items():
                        factors[factor] = factors.get(factor, 0) + power
                return scalar, {factor: power for factor, power in factors.items() if power}
            if op in ["inverse", "integer_power"]:
                scalar, factors = form(args[0])
                exponent = -1 if op == "inverse" else args[1]
                return scalar ** exponent, {factor: power * exponent for factor, power in factors.items() if power * exponent}
            return Fraction(1), {index: 1}

        def product(*values: tuple[tuple[Fraction, dict[int, int]], int]) -> tuple[Fraction, dict[int, int]]:
            scalar, factors = Fraction(1), {}
            for (coefficient, extra), exponent in values:
                scalar *= coefficient ** exponent
                for factor, power in extra.items():
                    factors[factor] = factors.get(factor, 0) + power * exponent
            return scalar, {factor: power for factor, power in factors.items() if power}

        tail, block = record["tail"], record["tail"]["actualFiniteBlock"]
        h_form = form(roots["h"])
        def scaled_h(power: int) -> tuple[Fraction, dict[int, int]]:
            return power * h_form[0], h_form[1]
        check("separate-original-radial-3h-and-tangential-2h-source-estimates",
              block["derivativeOrder"] == 0
              and [row["order"] for row in block["finite"]] == [1, 2]
              and block["tailStarts"] == 3
              and block["tangentialAxialBound"]["coefficient"] == block["physicalRadialNormalizedBound"]["coefficient"] == tail["C"]
              and form(source_to_program[block["tangentialAxialBound"]["power"]]) == scaled_h(2)
              and form(source_to_program[block["physicalRadialNormalizedBound"]["power"]]) == scaled_h(3)
              and block["scope"]["unboundedDiagonalInductionCertified"] is False
              and tail["actualPrivateAllOrderSourceInductionConsumed"] is True
              and tail["finitePrefixOnlyUsedAsInfiniteTail"] is False)
        C, sqrt_lambda, e_scale, j0 = (form(roots[name]) for name in ["C", "sqrtLambda", "eScale", "j0"])
        check("same-source-Cstar-retains-every-component-normalization",
              nodes[roots["sqrtLambda"]] == {"op": "sqrt_positive", "args": [roots["Lambda"]]}
              and form(roots["tail_radial"]) == product((C, 1), (sqrt_lambda, 1))
              and form(roots["tail_azimuthal"]) == product((C, 1), (e_scale, -1))
              and form(roots["tail_axial"]) == product((C, 1), (j0, -1))
              and nodes[roots["Cstar"]]["op"] == "maximum"
              and set(nodes[roots["Cstar"]]["args"]) == {roots["tail_radial"], roots["tail_azimuthal"], roots["tail_axial"]})
        check("original-inner-ray-and-radial-normalization-are-the-same-exact-geometry",
              product((form(roots["Xin"]), 1), (form(roots["Lambda"]), 1)) == (Fraction(2), {})
              and product((form(roots["R"]), 1), (sqrt_lambda, 1)) == (Fraction(2), {})
              and product((form(roots["radialScale"]), 1), (sqrt_lambda, 1)) == (Fraction(1), {}))

        for row in record["rows"]:
            depth = row["depth"]
            error = Fraction(1, 1 << (depth + 2))
            tau, s = roots["tau_" + str(depth)], roots["s_" + str(depth)]
            tau_node = nodes[tau]
            s_coefficient, s_factors = form(s)
            same_positive_tau = (tau_node["op"] == "exp"
                and form(tau_node["args"][0]) == (-s_coefficient, s_factors)
                and row["primaryTime"]["s"] == program["sourceNodeIds"][s]
                and row["tau"]["expression"] == program["sourceNodeIds"][tau]
                and row["tau"]["exactSign"] == "POSITIVE"
                and row["samePointAndTimeForAllComponents"] is True
                and row["unitLocalizationPlateau"] is True)
            check("single-exact-positive-source-time-depth-" + str(depth), same_positive_tau)
            for component in row["components"]:
                name = component["name"]
                lower, upper = bounds(leading[name])
                common_scale = form(roots["commonPhysicalScale_" + str(depth)])
                normalized_scale = form(roots["normalized_" + name + "_" + str(depth)])
                physical_scale = form(roots["physical_" + name + "_" + str(depth)])
                check("independent-full-interval-and-physical-scale-" + name + "-depth-" + str(depth),
                      bounds(component["leadingInterval"]) == (lower, upper)
                      and bounds(component["interval"]) == (lower - error, upper + error)
                      and Fraction(component["interval"]["remainderAbsUpper"]) == error
                      and component["interval"]["midpointUsed"] is False
                      and physical_scale == product((common_scale, 1), (normalized_scale, 1))
                      and component["physicalVelocity"]["binary64"] is None
                      and component["sourceLimitIdentificationExternal"] is True)

        for index, row in enumerate(record["decimalSamples"]):
            parts = Decimal(row["input"]).as_tuple()
            coefficient = int("".join(map(str, parts.digits)))
            K = -parts.exponent
            s = roots["decimal_s_" + str(index)]
            tau_node = nodes[roots["decimal_tau_" + str(index)]]
            s_coefficient, s_factors = form(s)
            check("exact-positive-initial-zero-extension-" + row["input"],
                  parts.sign == 0 and coefficient > 0 and K >= 1
                  and str(coefficient) == row["coefficient"] and -K == row["powerOfTen"]
                  and 2**8204 > 4 * K and 10 < 2**4
                  and row["comparison"]["sourceLocalDomainContainsThisPoint"] is False
                  and row["cutoffState"] == "EXACT_TEMPORAL_ZERO_EXTENSION"
                  and row["normalizedVelocity"]["components"] == ["0", "0", "0"]
                  and row["physicalVelocity"]["components"] == ["0", "0", "0"]
                  and row["localizedZeroBranchEvaluated"] is True
                  and row["missingSourceValuesSetToZero"] is False
                  and row["underflowReplacedByZero"] is False
                  and row["physicalScalingAppliedAfterNormalizedEvaluation"] is True
                  and row["internalTauReconstructedFromDisplayedTime"] is False
                  and tau_node["op"] == "exp"
                  and form(tau_node["args"][0]) == (-s_coefficient, s_factors)
                  and (not row["displayTimeRoundedToOne"] or row["displayTime"] == 1))

        check("source-branch-restriction-is-bound-without-dropping-noncore-mass-integrals",
              record["leadingBinding"]["noncoreMassIntegralsDiscarded"] is False
              and record["leadingBinding"]["fullLeadingFunctionReplacedByToy"] is False
              and {row["bump"] for row in record["leadingBinding"]["trace"] if "bump" in row} == {0, 1}
              and all(row["pass"] for row in record["leadingBinding"]["exactChecks"].values()))
        check("path-enclosure-remains-separate-from-final-N6-field-and-all-space-evaluation",
              record["claims"]["finalLocalizedVelocity"]["sameOriginalFinalN6InstanceConstructed"] is False
              and len(record["claims"]["finalLocalizedVelocity"]["dependencies"]) == 2
              and record["scope"]["sourceFinalFieldIdentificationExternal"] is True
              and record["scope"]["allSpaceSourceVelocityEvaluator"] is False
              and record["scope"]["pressureEvaluated"] is False
              and record["scope"]["fullN6FinalFieldConstructed"] is False
              and record["scope"]["fullLocalizedForceConstructed"] is False
              and record["scope"]["wholeN8ReconstructionComputed"] is False
              and record["scope"]["originalN804CriterionComplete"] is False
              and record["scope"]["newLeanKernelProof"] is False)
    except Exception as error:
        checks.append({"id": "independent-record-structure", "pass": False,
                       "errorType": type(error).__name__, "message": str(error)})
    return {"schema": "MathScope.N8.SourceNearTerminalIndependentFraction/1",
            "status": "PASS" if checks and all(row["pass"] for row in checks) else "FAIL",
            "checks": checks, "newLeanExecuted": False,
            "scope": "Independent exact eta-zero comparison series, positive analytic-error reconstruction, original radial/tangential source tail powers, shared positive logarithmic times, three full component intervals, exact physical scaling, and prescribed decimal zero-extension checks. Final-field identification and source all-order theorems remain external mathematical dependencies."}


def main() -> int:
    if len(sys.argv) != 2 or not re.fullmatch(r"[1-9][0-9]*", sys.argv[1]):
        raise SystemExit("Usage: run-near-terminal-source.py NEW_ATTEMPT_NUMBER")
    attempt = int(sys.argv[1])
    before = source_rows()
    out = BASE / "evidence/source-near-terminal-20261012" / f"attempt{attempt}"
    out.mkdir(parents=True, exist_ok=False)
    snapshot = out / "new-source-snapshot"
    snapshot.mkdir()
    for path in [BASE / "source-near-terminal.mjs", BASE / "tests/source-near-terminal.test.mjs", Path(__file__).resolve()]:
        (snapshot / path.name).write_bytes(path.read_bytes())
    write_json(out / "source-bytes-before.json", {"files": before, "fileCount": len(before)})
    certificate = out / "near-terminal.json"
    log_path = out / "node.log"
    command = ["node", "--max-old-space-size=5120", "--test", "--test-reporter=tap", "--test-concurrency=1",
               "research-ide/mathscope-m3/navier/tests/source-near-terminal.test.mjs"]
    env = dict(os.environ, M3_N8_NEAR_TERMINAL_EVIDENCE=str(certificate))

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
    receipt = {"schema": "MathScope.N8.SourceNearTerminalObservedExecution/1", "attempt": attempt,
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
               "originalN804CriterionComplete": False, "originalFinalN6FieldsConstructed": False,
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
