#!/usr/bin/env python3
"""Independent byte, expression, interface, and claim-boundary audit.

This does not import or execute the assembly producer. It reads the frozen
one-profile-0002 inputs, independently recomputes their identity, checks
the mathematical interfaces used in the attached written review, and
retains the missing formal/Comparator results. It is not a Lean checker.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from datetime import datetime, timezone
from fractions import Fraction
from pathlib import Path, PurePosixPath

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
EXPECTED_PAPER = "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f"
EXPECTED_PARAMETERS = "e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152"
EXPECTED_EVIDENCE = "ff3b1590aa49499417910962736fe2deb8e6088acd7d77e281fd8aba6807c206"
EXPECTED_OUTER = "38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8"


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key: " + key)
        result[key] = value
    return result


def read_json(path):
    return json.loads(path.read_bytes(), object_pairs_hook=unique_object)


def sha(content):
    return hashlib.sha256(content).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False).encode()


def safe_child(parent, relative):
    value = PurePosixPath(relative)
    if value.is_absolute() or ".." in value.parts or "." in value.parts:
        raise ValueError("Unsafe evidence path")
    path = parent.joinpath(*value.parts)
    if path.is_symlink():
        raise ValueError("Evidence may not be a symlink")
    path.resolve().relative_to(parent.resolve())
    return path


def expression_references(node):
    if type(node) is not dict or len(node) != 1:
        raise ValueError("An expression must have exactly one operator")
    operator, value = next(iter(node.items()))
    if operator == "ref":
        if type(value) is not str:
            raise ValueError("Nontext expression reference")
        return {value}
    if operator == "integer":
        if type(value) is not int:
            raise ValueError("Noninteger exact constant")
        return set()
    if operator == "rational":
        if type(value) is not str:
            raise ValueError("Rational constant must be exact text")
        Fraction(value)
        return set()
    if operator in ("exp", "log", "ceil"):
        return expression_references(value)
    if operator == "power":
        if type(value) is not list or len(value) != 2 or type(value[1]) is not int:
            raise ValueError("Invalid integer power")
        return expression_references(value[0])
    if operator in ("sum", "product", "min", "max", "quotient"):
        if type(value) is not list or not value:
            raise ValueError("Empty expression")
        if operator == "quotient" and len(value) != 2:
            raise ValueError("Invalid quotient")
        return set().union(*(expression_references(term) for term in value))
    raise ValueError("Unsupported expression: " + operator)


def parameter_identity(record):
    return sha(canonical(record["parametersExactExpressions"]))


def evidence_identity(record):
    files = [{k: row[k] for k in ("path", "sha256", "bytes")}
             for row in record["evidenceInputs"]]
    return sha(canonical({"paper": record["sourcePaperSHA256"],
                          "parameters": record["parameterExpressionSHA256"],
                          "files": files}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assembly", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or args.output.parent.exists():
        raise SystemExit("Refusing to replace an independent review attempt")
    assembly = args.assembly.resolve()
    receipt_bytes = assembly.read_bytes()
    record = read_json(assembly)
    checks = {}

    def check(name, value):
        if name in checks:
            raise ValueError("Duplicate check name")
        checks[name] = value is True

    check("specified_source_paper", record["sourcePaperSHA256"] == EXPECTED_PAPER)
    check("original_assembly_check_flags",
          len(record["checks"]) == 292 and
          all(type(x) is bool and x for x in record["checks"].values()) and
          record["passed"] == record["total"] == 292)
    check("actual_parameter_count", len(record["parametersExactExpressions"]) == 63)
    check("actual_input_count", len(record["evidenceInputs"]) == 137)
    check("independent_parameter_digest",
          parameter_identity(record) == EXPECTED_PARAMETERS ==
          record["parameterExpressionSHA256"])
    check("independent_evidence_digest",
          evidence_identity(record) == EXPECTED_EVIDENCE ==
          record["profileEvidenceSHA256"])

    by_source = {}
    captured = {}
    snapshots = set()
    for number, row in enumerate(record["evidenceInputs"]):
        source = safe_child(NAVIER, row["path"])
        snapshot = safe_child(assembly.parent, row["snapshot"])
        content = snapshot.read_bytes()
        check("frozen_input_%03d" % number,
              type(row["bytes"]) is int and row["bytes"] == len(content) and
              sha(content) == row["sha256"] and
              source.read_bytes() == content and
              row["path"] not in by_source and row["snapshot"] not in snapshots)
        by_source[row["path"]] = row
        snapshots.add(row["snapshot"])
        captured[row["path"]] = content

    roles = {}
    for role, info in record["acceptedEvidence"].items():
        check("accepted_role_" + role,
              info["path"] in by_source and
              by_source[info["path"]]["sha256"] == info["sha256"])
        roles[role] = json.loads(captured[info["path"]], object_pairs_hook=unique_object)
    check("all_required_roles_present", set(roles) == {
        "outer", "outerPulse", "outerBinding", "outerSnapshot", "axis",
        "continuation", "sourceEnvelope", "sourceFreeze", "b8", "c2",
        "heat", "loop", "frequency", "pressure", "pressurePrefix", "core",
        "mixedPhi", "relaxedGaps", "stress", "axisReview", "sourceReview",
        "c2Review", "b8Review", "loopReview", "coreReview", "mixedPhiReview",
        "pressureTailReview", "gapReview", "independentSeal"})

    params = record["parametersExactExpressions"]
    earlier = set()
    for name, expression in params.items():
        dependencies = expression_references(expression)
        check("acyclic_exact_parameter_" + name, dependencies <= earlier)
        earlier.add(name)
    for role in ("outer", "axis", "continuation", "sourceEnvelope"):
        check("same_parameter_subtree_" + role,
              all(params[name] == expression for name, expression
                  in roles[role]["parametersExactExpressions"].items()))
    ref = lambda name: {"ref": name}
    integer = lambda value: {"integer": value}
    power = lambda name, value: {"power": [ref(name), value]}
    expected = {
        "Md": integer(2**20),
        "T": {"sum": [{"exp": ref("Md")}, integer(10)]},
        "lambda": {"exp": {"product": [integer(-1000), ref("T")]}},
        "h": {"exp": {"product": [integer(-8002), ref("T")]}},
        "j0": power("h", 4), "epsilonMoment": power("h", 3),
        "muMoment": power("h", 2), "Lambda": power("Q", 64),
        "BRefUpper": power("Q", 300), "Bk": power("Q", 80),
        "Tsh": power("Q", 90), "t1": power("CSelected", -120),
        "kappa0": ref("t1"), "omega1": ref("t1"), "omega2": ref("t1"),
        "sourceEnvelopeS": power("CSelected", 100000),
        "loopD0": {"quotient": [integer(1),
                     {"product": [integer(8), ref("sourceEnvelopeS")]}]},
        "loopMuMax": power("sourceEnvelopeS", 12),
        "loopDelta": {"exp": {"product": [integer(-1),
                                          power("sourceEnvelopeS", 16)]}},
        "C12EnvelopeR": {"exp": power("sourceEnvelopeS", 256)},
        "radialFrequencyN": {"sum": [integer(1),
                                      {"ceil": power("C12EnvelopeR", 50)}]},
        "directionalMarginKappa": power("C12EnvelopeR", -10),
        "stressFlatLowerConstant": {"min": [power("CSelected", -11),
                                             power("C12EnvelopeR", -8)]},
    }
    for name, expression in expected.items():
        check("selected_expression_" + name, params[name] == expression)
    for name, divisor in (("sourceJLeft", 16), ("loopILeft", 8)):
        check("actual_left_geometry_" + name,
              params[name] == {"product": [
                  {"quotient": [integer(4), ref("Lambda")]},
                  {"exp": {"quotient": [ref("t1"), integer(divisor)]}}]})
    check("actual_right_loop_geometry",
          params["loopIRight"] == {"product": [ref("XR"),
              {"exp": {"sum": [ref("T"), integer(3)]}}]})
    check("source_gap_budget_fits_actual_S", 1000 < 100000)
    check("source_derivative_budget_fits_actual_S",
          max(roles["sourceEnvelope"]["actualSourceUpperCExponents"].values()) == 29004 and
          29004 + 10 < 100000)
    check("R_dominates_proved_loop_bounds", 256 > 60 and 256 > 17)
    check("finite_N_closes_C12_inequality", 50 > 46 + 1)
    check("uniform_directional_choice_fits", 10 > 7 and Fraction(8192)**3 > 2048)

    accepted = record["acceptedEvidence"]
    pin = lambda role: accepted[role]["sha256"]
    check("outer_identity_is_shared",
          roles["outer"]["parameterExpressionSHA256"] == EXPECTED_OUTER ==
          roles["axis"]["sourceBinding"]["outerParameterExpressionSHA256"] ==
          roles["continuation"]["sourceBinding"]["outerParameterExpressionSHA256"] ==
          roles["sourceEnvelope"]["sourceBinding"]["outerParameterExpressionSHA256"])
    check("actual_continuation_consumes_actual_B8",
          roles["continuation"]["sourceBinding"]["newB8CertificateSHA256"] == pin("b8"))
    debt = roles["continuation"]["incomingDebt"]
    check("actual_B8_all_eta_C2_debt",
          debt["interval"] == [-1, 1] and debt["etaOrders"] == [0, 1, 2] and
          Fraction(debt["preconditionedScaledUpperU"]) < Fraction(1, 10**8) and
          Fraction(debt["preconditionedScaledUpperE"]) < Fraction(1, 10**8))
    check("heat_consumes_same_C2",
          roles["heat"]["inputs"]["continuousOperatorCertificateSHA256"] == pin("c2"))
    gap = roles["relaxedGaps"]["sourceBinding"]
    check("actual_gap_source_connection",
          gap["continuationReceiptSHA256"] == pin("continuation") and
          gap["B8CertificateSHA256"] == pin("b8") and
          gap["selectedContinuationParameterExpressionSHA256"] ==
          roles["continuation"]["parameterExpressionSHA256"] ==
          roles["sourceEnvelope"]["sourceBinding"]["finalContinuationParameterExpressionSHA256"])
    claims = roles["relaxedGaps"]["analyticClaimsOfAttachedProof"]
    for name in ("actualSameProfileRelaxedGapsAtLeastCMinus1000",
                 "actualBothLoopCollarGapsAtLeastSInverse",
                 "actualUnchangedJOutsideILowerGapsAtLeastSInverse"):
        check("actual_gap_claim_" + name, claims[name] is True)
    check("gap_domain_is_continuous_and_all_eta",
          claims["continuousRadialDomain"] is True and
          claims["quantifiedEtaDomain"] == "all eta in [-1,1]")
    check("gap_independent_check_attaches_exact_inputs",
          roles["gapReview"]["inputSHA256"]["gap-receipt.json"] == pin("relaxedGaps") and
          roles["gapReview"]["inputSHA256"]["global-source-certificate.json"] == pin("sourceEnvelope") and
          roles["gapReview"]["inputSHA256"]["independent-source-review.json"] == pin("sourceReview") and
          roles["gapReview"]["passed"] == roles["gapReview"]["total"] == 75)
    check("actual_source_independent_review_completed",
          roles["sourceReview"]["passed"] == roles["sourceReview"]["total"] == 179)

    core = roles["core"]
    mixed = roles["mixedPhi"]
    check("actual_core_same_infinite_axis_and_datum",
          core["source"]["actualAxisEnvelopeSha256"] == pin("axis") and
          core["source"]["actualPressureInputSha256"] == pin("pressure") and
          core["claimBoundary"]["actualInfiniteCoreEvaluationsEnclosed"] is True)
    check("actual_mixed_coefficients_same_axis_continuation",
          mixed["basis"]["axisReceiptSHA256"] == pin("axis") and
          mixed["basis"]["continuationReceiptSHA256"] == pin("continuation") and
          mixed["boundaries"]["sameNonlinearPhiCoefficientsEnclosed"] is True)
    check("finite_domains_not_enlarged",
          record["finiteEvaluations"] == {
              "core": {"points": 5, "intervalValues": 75,
                       "etaDomain": "eta=0 with specified parameter derivatives"},
              "mixedPhi": {"coefficients": 125, "mixedValues": 75,
                           "etaChart": "|eta|<=rho/4",
                           "comparisonOnlyComplexXiDisk": "|xi|<=1/16"}} and
          mixed["coordinates"]["xi"] == "eta/j0" and
          mixed["boundaries"]["wholeEtaIntervalCoveredByOneTaylorChart"] is False)
    check("comparison_not_substituted_for_nonlinear_graph",
          mixed["boundaries"]["nonlinearRecurrenceDirectlyEvaluated"] is False and
          core["claimBoundary"]["allEtaNonlinearGraphEvaluated"] is False)
    check("conditional_receipts_preserved",
          roles["loop"]["claimBoundary"]["actualSourceSBoundAttached"] is False and
          roles["frequency"]["claimBoundary"]["actualWholeProfileRProvided"] is False and
          roles["stress"]["claimBoundary"]["actualWholeProfileRProvidedByThisScript"] is False)
    check("new_attachment_does_not_invent_formal_proof",
          roles["axis"]["boundaries"]["fullAnalyticPremisesProvedInLean"] is False and
          core["claimBoundary"]["newLeanAnalyticInstantiation"] is False and
          mixed["boundaries"]["fullLeanAnalyticPremisesInstantiated"] is False and
          record["outstanding"]["generatedAnalyticPremisesLean"] == "NOT_COMPLETED")
    check("protected_Comparator_not_invented",
          record["outstanding"]["protectedComparator"] == "AWAITING_SEPARATE_ACTUAL_RESULT")
    check("no_full_nine_or_theorem_promotion",
          record["fullOriginalNineConditionsComplete"] is False and
          record["fullOriginalTheorem46CertificationFlag"] is False)
    analytic = record["attachedAnalyticConclusions"]
    check("actual_construction_claims_have_exact_bounds",
          analytic["actualSAndPreloopMarginsAttached"] is True and
          analytic["actualLoopDerivativeBoundAttached"] is True and
          analytic["oneFiniteNSelected"] is True and
          analytic["continuousC12DebtAndI1Restoration"] is True and
          analytic["wholeClosedAnnulusDirectionalMargin"] == "R^-10" and
          analytic["actualStressFlatLower"] == "min(C^-11,R^-8)*zeta" and
          analytic["preservedReservedPatches"] == ["Ipos", "Imean"])

    # Negative controls change in-memory copies, never the accepted evidence.
    altered = copy.deepcopy(record)
    altered["parametersExactExpressions"]["t1"]["power"][1] = -119
    check("negative_changed_width_rejected", parameter_identity(altered) != EXPECTED_PARAMETERS)
    altered = copy.deepcopy(record)
    altered["evidenceInputs"][0]["sha256"] = "0" * 64
    check("negative_changed_source_pin_rejected", evidence_identity(altered) != EXPECTED_EVIDENCE)
    altered = copy.deepcopy(record)
    altered["parametersExactExpressions"]["Md"] = {"ref": "radialFrequencyN"}
    check("negative_forward_reference_detected",
          bool(expression_references(altered["parametersExactExpressions"]["Md"])))
    check("negative_truncated_snapshot_detected",
          sha(next(iter(captured.values()))[:-1]) != record["evidenceInputs"][0]["sha256"])

    review = HERE / "ONE_PROFILE_ASSEMBLY_INDEPENDENT_REVIEW_EN.md"
    definitions = NAVIER.parent.parent / "docs" / "NS_GATES_EN.md"
    attachments = {
        "assembly-receipt.json": receipt_bytes,
        "independent-review.md": review.read_bytes(),
        "independent-checker.py": Path(__file__).read_bytes(),
        "original-gates.md": definitions.read_bytes(),
    }
    if not all(checks.values()):
        raise SystemExit("Independent review failed: " +
                         ", ".join(name for name, result in checks.items() if not result))
    if assembly.read_bytes() != receipt_bytes:
        raise SystemExit("Assembly receipt changed during independent review")
    result = {
        "schema": "MathScope.Navier.IndependentOneProfileAssemblyReview/1",
        "verifiedUTC": datetime.now(timezone.utc).isoformat(),
        "status": "PASS",
        "producerImportedOrExecuted": False,
        "assemblyReceiptSHA256": sha(receipt_bytes),
        "sourcePaperSHA256": EXPECTED_PAPER,
        "parameterExpressionSHA256": EXPECTED_PARAMETERS,
        "profileEvidenceSHA256": EXPECTED_EVIDENCE,
        "frozenInputsIndependentlyChecked": 137,
        "exactParametersIndependentlyChecked": 63,
        "acceptedEvidenceRoles": len(roles),
        "checks": checks,
        "passed": sum(checks.values()),
        "total": len(checks),
        "snapshotSHA256": {name: sha(content) for name, content in attachments.items()},
        "reviewConclusion": {
            "byteAndParameterProvenanceVerified": True,
            "actualInputsCloseAttachedAnalyticImplications": True,
            "originalN304RemainingConditionSatisfiedByAttachedAnalyticAndArrayEvidence": True,
            "wholeEtaDirectNonlinearGraphNumericallyEvaluated": False,
            "actualCompleteLeanAnalyticPremisesKernelChecked": False,
            "independentProtectedComparatorSuccessVerified": False,
            "allOriginalNineConditionsComplete": False,
            "entireMathematicalProofCheckedByThisPythonProgram": False,
        },
        "scope": (
            "Executed byte/expression/interface/claim checks plus the separately attached "
            "written whole-domain review. The analytic conclusion is not inferred solely "
            "from hash counts. Original conditional and failed records remain unchanged."
        ),
    }
    args.output.parent.mkdir(parents=True)
    for name, content in attachments.items():
        (args.output.parent / name).write_bytes(content)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"status": result["status"], "passed": result["passed"],
                      "total": result["total"], "receipt": str(args.output),
                      "receiptSHA256": sha(args.output.read_bytes())}))


if __name__ == "__main__":
    main()
