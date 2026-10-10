#!/usr/bin/env python3
"""Independently bind the actual N3-03 consumers and recompute their finite errors.

This is a source/record/rational audit, not another Lean execution. The
mathematical interpretation is in the companion independent review.
No producer, interval helper or replay runner is imported.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from datetime import datetime, timezone
from decimal import Decimal, localcontext
from fractions import Fraction as F
from pathlib import Path

sys.set_int_max_str_digits(1000000)
HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
REPO = HERE.parents[2]
GLUE = NAVIER / "followup-20261010-symbolic-gluing"
AXIS = NAVIER / "followup-20261010-same-datum-axis"
KERNEL = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"
STANDARD = {"propext", "Classical.choice", "Quot.sound"}
CHECKS = []
INPUTS = {}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def bind(path):
    path = path.resolve()
    try:
        label = str(path.relative_to(REPO))
    except ValueError:
        label = str(path)
    INPUTS[label] = digest(path)
    return path


def load(path):
    return json.loads(bind(path).read_text())


def check(name, condition):
    CHECKS.append({"name": name, "pass": bool(condition)})
    if not condition:
        raise AssertionError(name)


def rational(value):
    return F(int(value["numerator"]), int(value["denominator"]))


def interval(value):
    denominator = 2 ** value["denominatorPowerOfTwo"]
    return (F(int(value["lowerNumerator"]), denominator),
            F(int(value["upperNumerator"]), denominator))


def serial(value):
    return {"numerator": str(value.numerator), "denominator": str(value.denominator)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--deps-review", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("Refusing to overwrite an independent review")
    previous_path = HERE / "ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10.json"
    previous = load(previous_path)
    check("historical 68/2 assessment unchanged", digest(previous_path) ==
          "913faa68844dc0f8108ea6b3e0a2144dfcd6e2d2213c4861954f67e99ab476a9")
    for field in ("original70AcceptanceJSON", "originalNsGates"):
        reference = previous[field]
        path = bind(REPO / reference["path"])
        check("original criterion pin: " + field, digest(path) == reference["sha256"])
    check("unchanged original N303 remaining condition", next(
        row for row in previous["gates"] if row["id"] == "N3-03"
    )["inheritedUserRemainingConditionText"] == "무한 고정점·유한 jet·반올림 오차·Lean 전제의 연결")

    prefix_path = GLUE / "formal-clean-replay/attempts/0001/receipt.json"
    extension_path = GLUE / "formal-clean-replay/extension-attempts/0001/receipt.json"
    prefix = load(prefix_path)
    extension = load(extension_path)
    check("fresh 13-module prefix", prefix["status"] == "PASS" and prefix["moduleCount"] == 13)
    check("no preexisting custom objects in prefix", prefix["initialCustomOleanCount"] == 0
          and prefix["existingCustomObjectsImported"] is False)
    check("extension uses exact successful prefix", extension["status"] == "PASS"
          and extension["freshPrefixReceiptSHA256"] == digest(prefix_path))
    check("extension did not import old component objects", extension["previousComponentAttemptObjectsImported"] is False
          and extension["thisConsumerObjectAbsentBeforeCompilation"] is True)
    for name, receipt in (("prefix", prefix), ("extension", extension)):
        check(name + " preserved original source", receipt["originalTrackedFileCount"] == 2669
              and receipt["originalTrackedFilesPreserved"] is True)
        check(name + " preserved original kernel", receipt["kernelSHA256Before"] == KERNEL
              and receipt["kernelSHA256After"] == KERNEL)
        check(name + " scope retains independent Comparator", receipt["protectedComparatorPerformed"] is False)

    modules = prefix["modules"] + [extension]
    check("14 distinct actual source modules", len(modules) == len({m["module"] for m in modules}) == 14)
    declarations = {}
    for module in modules:
        name = module["module"]
        check(name + " actual successful compile", module["status"] == "PASS" and module["exitCode"] == 0)
        source = bind(Path(module["command"][-1]))
        check(name + " exact source bytes", digest(source) == module["sourceSHA256"])
        output = bind(source.with_suffix(".olean"))
        check(name + " exact compiled object", digest(output) == module["oleanSHA256"])
        log = bind(source.with_suffix(".log"))
        check(name + " actual log bytes", digest(log) == module["logSHA256"])
        content = log.read_text()
        check(name + " no proof recovery or error", "sorryAx" not in content and ": error:" not in content)
        check(name + " only standard printed axioms", bool(module["printedAxioms"])
              and all(set(value) <= STANDARD for value in module["printedAxioms"].values()))
        for declaration in module["printedAxioms"]:
            check("actual printed declaration: " + declaration, declaration in content)
            declarations[declaration] = name
    check("110 actual audited declarations", len(declarations) == 110
          and prefix["auditedDeclarationCount"] == 101
          and extension["combinedAuditedDeclarationCount"] == 110)
    for declaration in (
        "MathScope.SameDatumInputs.selectedInputNormBounds",
        "MathScope.SameDatumInputs.selectedFixedPoint_spec",
        "MathScope.SameDatumInputs.selected_scaled_solution",
        "MathScope.SameDatumInputs.selected_uniform_mixed_error",
        "MathScope.SameDatumInputs.selectedPhi_N24_M4_recurrence",
        "MathScope.SameDatumInputs.selectedReference_derivative_all_eta",
        "MathScope.SameDatumInputs.selected_normalized_xi_jet_error",
        "MathScope.ConcreteFiniteJet.actual_profile_finite_enclosure",
        "MathScope.MixedEtaBindings.actual_positive_interval_inputs",
        "MathScope.MixedEtaBindings.actual_chi_normalized_coordinate",
        "MathScope.MixedEtaBindings.actual_chart_xi_small",
    ):
        check("required actual connection: " + declaration, declaration in declarations)

    deps = load(args.deps_review)
    check("independent dependency resolution review passed", deps["status"] == "PASS"
          and deps["checksPassed"] == deps["checksTotal"] == 343
          and all(row["passed"] for row in deps["checks"]))
    check("dependency review binds this exact prefix and extension",
          deps["prefixReceiptSHA256"] == digest(prefix_path)
          and deps["extensionReceiptSHA256"] == digest(extension_path))
    check("all fourteen actual object resolutions", deps["moduleCount"] == 14
          and deps["auditedDeclarationCount"] == 110
          and deps["allModuleObjectsResolvedFromFreshOutputs"] is True)
    check("dependency audit preserves scope", deps["mathematicalCompilationsRepeatedByThisAudit"] is False
          and deps["protectedComparatorPerformed"] is False
          and deps["originalGateAssessmentPerformed"] is False)
    check("dependency audit preserves source and kernel", deps["originalTrackedFileCount"] == 2669
          and deps["originalTrackedFilesPreserved"] is True
          and deps["kernelSHA256Before"] == deps["kernelSHA256After"] == KERNEL)
    check("unsupported launcher option not misreported as success",
          deps["launcherDepsOptionAvailable"] is False
          and deps["launcherDepsAttempt"]["exitCode"] == 1
          and "Lean.Elab.printImports" in deps["directDependencyResolutionMechanism"])
    fresh_objects = {str(Path(m["command"][-1]).with_suffix(".olean")): m["oleanSHA256"] for m in modules}
    for item in deps["inputPins"]:
        path = bind(Path(item["path"]))
        check("dependency source pin: " + path.name, digest(path) == item["sha256"])
    for item in deps["modules"]:
        module = next(m for m in modules if m["module"] == item["module"])
        check("dependency module source and object: " + item["module"],
              item["sourceSHA256"] == module["sourceSHA256"]
              and item["oleanSHA256"] == module["oleanSHA256"])
    for item in deps["actualResolvedDependencies"]:
        for dependency in item["dependencies"]:
            path = bind(Path(dependency["path"]))
            check("actual resolved dependency: " + item["module"] + " -> " + path.name,
                  digest(path) == dependency["sha256"])
            if dependency["custom"]:
                check("custom dependency is a fresh compiled object: " + item["module"] + " -> " + path.name,
                      fresh_objects.get(str(path)) == dependency["sha256"])
    for run in deps["resolverRuns"]:
        log = bind(args.deps_review.parent / run["log"])
        check("original Lean parser and resolver execution: " + log.name,
              run["exitCode"] == 0 and digest(log) == run["logSHA256"])
    binding_path = AXIS / "independent-review/actual-mixed-eta-binding-001.json"
    binding = load(binding_path)
    check("actual mixed binding passed all 812 checks", binding["status"] == "PASS"
          and binding["passed"] == binding["total"] == 812
          and all(row["pass"] for row in binding["checks"]))
    check("no arbitrary rounding premises remain", binding["actualNumericalRoundingPremisesResolved"] is True
          and binding["unspecifiedCOrDeltaOrHround"] is False)
    check("continuous domain with correct chart", binding["actualChart"] == {
        "radial": "0<=Y<=41/10", "parameter": "|eta|<=rho/4",
        "coordinate": "xi=eta/j, j=h^4>0", "positiveRadius": True, "xiUpper": "2^-16000"})
    check("mixed interval evidence not relabeled kernel replay",
          binding["all125NumericalRowsReevaluatedByLeanKernel"] is False
          and binding["all125RowsValidatedByExactRationalArithmetic"] is True
          and binding["wholeParameterIntervalCoveredByThisFiniteChart"] is False)
    for label, item in binding["snapshots"].items():
        path = bind(Path(item["source"]))
        check("binding source: " + label, digest(path) == item["sha256"])
    for module in modules:
        check("fresh module matches actual mixed proof: " + module["module"],
              binding["kernelModules"][module["module"]]["sourceSHA256"] == module["sourceSHA256"])

    midpoint_path = bind(Path(binding["actualMidpoints"]["path"]))
    check("actual midpoint hash", digest(midpoint_path) == binding["actualMidpoints"]["sha256"])
    midpoints = load(midpoint_path)["rows"]
    values_path = AXIS / "evaluated-phi-mixed-comparison.json"
    values = load(values_path)
    check("actual coefficient array hash", digest(values_path) == binding["coefficientArraySHA256"])
    array = {(n["radialDegree"], m["xiTaylorDegree"]): m
             for n in values["coefficients"] for m in n["etaTaylorCoefficients"]}
    check("actual 25-by-5 rectangular block", set(array) == {(n, m) for n in range(25) for m in range(5)}
          and len(midpoints) == 125)
    R, eps = F(41, 10), F(1, 2**16000)
    block, rounded = F(0), F(0)
    for row in midpoints:
        n, m = row["n"], row["m"]
        actual = array[n, m]
        low, high = interval(actual["actualNonlinearCoefficientInterval"])
        ref_low, ref_high = interval(actual["comparisonInterval"])
        midpoint, radius = rational(row["midpoint"]), rational(row["radius"])
        error = F(0) if n == 0 else F(29 * math.comb(n + m, m),
            2 ** (260 * (53-m)) * 20**n * (n+1)**2 * (m+1)**2)
        check(f"actual midpoint/radius n={n},m={m}", midpoint == (low+high)/2 and radius == (high-low)/2)
        check(f"actual normalized error n={n},m={m}", error == rational(row["positiveNonlinearBudget"])
              == rational(actual["positiveBanachCoefficientError"]))
        check(f"reference plus positive error is enclosed n={n},m={m}", low <= ref_low-error and ref_high+error <= high)
        block += error * R**n * eps**m
        rounded += radius * R**n * eps**m
    value = F(4,3) / 2**512
    eta = F(243) * (16*eps)**5 / (1-16*eps)
    radial = R**25 / (math.factorial(25)*math.factorial(26)) / (1-R/(26*27)) / (1-16*eps)
    check("nonlinear value budget", value < F(1, 2**511))
    check("actual eta Taylor tail budget", eta < F(1, 2**79000))
    check("actual radial tail budget", radial < F(1, 2**120))
    check("actual nonlinear finite-block budget", block < F(1, 2**512))
    check("actual 125-entry rounding budget", rounded < F(1, 2**190))
    check("combined continuous-chart enclosure", value+eta+radial+block+rounded < F(1, 2**119) < F(1, 2**118))

    fixture = load(NAVIER / "evidence/high-precision-fixtures.json")
    finite = load(NAVIER / "evidence/numerical-validation.json")
    legacy = next(x for x in finite["checks"] if x["name"] == "entire_comparison_f0_4p1")
    check("original f0 fixture retained", legacy["pass"] and fixture["comparison"]["z"] == "4.1")
    terms = [(-R/2)**n / (math.factorial(n)*math.factorial(n+1)) for n in range(41)]
    lower, upper = sum(terms[:40], F(0)), sum(terms, F(0))
    check("alternating comparison tail decreases", R/(2*41*42) < 1)
    check("original decimal fixture confirmed exactly", F(2711140554,10**10) < lower < upper < F(2711140555,10**10))
    enclosure = legacy["observed"]["enclosure"]
    check("new exact fixture lies in preserved outward interval", F(str(enclosure["lower"])) < lower
          and upper < F(str(enclosure["upper"])))
    positive = F(1)-R/4+R**2/48-R**3/1152
    check("uniform comparison lower polynomial", positive == F(305719,1152000))
    check("comparison tail after cubic decreases", R/(2*5*6) < 1)
    check("lower cubic derivative is strictly negative", F(32,384) > 0)
    check("actual Phi=phi/phi-star remains above 1/4", positive - F(1,2**100) > F(1,4)
          and value < F(1,2**100))
    with localcontext() as context:
        context.prec = 42
        fixture_display = str(Decimal(lower.numerator)/Decimal(lower.denominator))
    proof_path = HERE / "FINAL_FORMAL_CONNECTION_REVIEW_2026_10_10_EN.md"
    bind(proof_path)
    bind(Path(__file__))
    receipt = {
        "schema": "MathScope.IndependentFinalN303ConnectionReview/1",
        "status": "PASS", "reviewedUTC": datetime.now(timezone.utc).isoformat(),
        "passed": len(CHECKS), "total": len(CHECKS), "checks": CHECKS,
        "auditType": "INDEPENDENT_WRITTEN_PROOF_AND_RECORDED_EXECUTION_AND_EXACT_RATIONAL_REVIEW_NOT_NEW_LEAN_RUN",
        "freshPrefixReceiptSHA256": digest(prefix_path),
        "freshExtensionReceiptSHA256": digest(extension_path),
        "dependencyReviewSHA256": digest(args.deps_review),
        "actualMixedBindingSHA256": digest(binding_path),
        "exactParameterExpressionSHA256": previous["parameterExpressionSHA256"],
        "fixture": {"name": "f0(4.1)", "lower": serial(lower), "upper": serial(upper),
                    "decimalDisplayOnly": fixture_display,
                    "method": "40 exact rational terms plus the first omitted alternating term",
                    "notTheActualSelectedPhiValue": True},
        "actualPositivity": {"referenceLower": "305719/1152000", "actualPhiLower": "1/4",
                             "domain": "0<=Y<=41/10 and eta in the actual real source window"},
        "actualMixedChart": binding["actualChart"],
        "actualSelectedPhiMinusNamed125MidpointPolynomialUpper": "2^-118",
        "freshCompiledModules": 14, "auditedDeclarations": 110,
        "newKernelRunsPerformedByThisVerifier": 0,
        "originalN303ConditionsSatisfied": True,
        "all125NumericalRowsKernelEvaluated": False,
        "allOriginalNineConditionsSatisfied": False,
        "protectedComparatorPerformed": False,
        "historicalAssessmentsChanged": False,
        "inputsSHA256": INPUTS,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x") as handle:
        json.dump(receipt, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(json.dumps({"status": "PASS", "checks": len(CHECKS), "output": str(args.output),
                      "sha256": digest(args.output)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
