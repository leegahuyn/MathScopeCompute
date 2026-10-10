#!/usr/bin/env python3
"""Issue a new 69/1 dated assessment after the actual N3-03 connection review.

The mathematical decision is in the attached independent written review.
This writer preserves the original criterion text and historical records.
It refuses to overwrite any previous assessment.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
REPO = HERE.parents[2]
AXIS = NAVIER / "followup-20261010-same-datum-axis"
GLUE = NAVIER / "followup-20261010-symbolic-gluing"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path, locator=None):
    path = path.resolve()
    try:
        label, kind = str(path.relative_to(REPO)), "repositoryFile"
    except ValueError:
        label, kind = str(path), "suppliedPDF"
    result = {"path": label, "kind": kind, "sha256": digest(path), "bytes": path.stat().st_size}
    if locator:
        result["locator"] = locator
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observation", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("Refusing to replace a dated assessment")
    old_path = HERE / "ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10.json"
    assert digest(old_path) == "913faa68844dc0f8108ea6b3e0a2144dfcd6e2d2213c4861954f67e99ab476a9"
    old = json.loads(old_path.read_text())
    result = copy.deepcopy(old)
    for key in ("original70AcceptanceJSON", "original70StatusRecord", "originalNsGates", "blueprintPDF", "handoffPDF"):
        item = old[key]
        p = Path(item["path"])
        p = p if p.is_absolute() else REPO / p
        assert digest(p) == item["sha256"], key
    original = json.loads((REPO / old["original70AcceptanceJSON"]["path"]).read_text())
    criteria = {x["id"]: x for x in original}
    baseline = json.loads((REPO / old["original70StatusRecord"]["path"]).read_text())

    review_path = HERE / "formal-connection-review/0001/receipt.json"
    review = json.loads(review_path.read_text())
    assert review["status"] == "PASS" and review["passed"] == review["total"] == 883
    assert all(x["pass"] for x in review["checks"])
    assert review["originalN303ConditionsSatisfied"] is True
    assert review["freshCompiledModules"] == 14 and review["auditedDeclarations"] == 110
    assert review["exactParameterExpressionSHA256"] == old["parameterExpressionSHA256"]
    assert review["all125NumericalRowsKernelEvaluated"] is False
    for label, value in review["inputsSHA256"].items():
        p = Path(label)
        p = p if p.is_absolute() else REPO / p
        assert digest(p) == value, label

    observation = json.loads(args.observation.read_text())
    jobs = [j for r in observation["results"] for j in r.get("structuredContent", {}).get("jobs", [])]
    job = next(j for j in jobs if j["id"] == 113984853927)
    assert job["run_id"] == 37979127351
    assert job["status"] == "in_progress" and job["conclusion"] is None
    assert observation["receivedUTC"] == "2026-10-10T00:10:05.202Z"

    row = next(x for x in result["gates"] if x["id"] == "N3-03")
    row["currentStatus"] = "PASS"
    row["finding"] = (
        "The actual pressure, fields, operators, amplitude and norm inputs instantiate the original "
        "invariant-ball and fixed-point theorem. Actual all-n/m recurrences, all-eta reference identities, "
        "the named 125-entry finite array and its separate radial/eta/rounding enclosures identify the "
        "same unique infinite profile and continuation. The original f0 fixture and actual Phi>1/4 are verified."
    )
    row["evidenceLevel"] = "ACTUAL_ORIGINAL_KERNEL_INPUT_AND_FIXED_POINT_WITH_EXACT_RATIONAL_FINITE_ARRAY_CONSUMER_AND_INDEPENDENT_REVIEW"
    row["remaining"] = []
    row["currentFormalWorkUnfinished"] = {
        "status": "COMPLETE_FOR_ORIGINAL_N303_CONNECTION",
        "description": "Actual analytic/norm premises and the selected fixed-point consumer, exact recurrence and finite radial/eta array connection have been independently verified; the global continuation/stress proof retains its separate analytic/interval scope.",
        "currentCompleteFormalReceipt": ref(review_path),
    }
    row["scopeDecision"] = {
        "actualAxisAnalyticPremisesInstantiated": True,
        "actualFixedPointSelectedAndUniqueInOriginalBall": True,
        "actualUniformMixedErrorAllOrders": True,
        "actualNonlinearRecurrenceAllNMAndEta": True,
        "actual125ArrayAndFiniteEtaChartConnected": True,
        "actualFiniteEtaChart": "0<=Y<=41/10, |eta|<=rho/4, xi=eta/j",
        "actual125MidpointPolynomialUniformErrorUpper": "2^-118",
        "all125NumericalRowsLeanKernelEvaluated": False,
        "wholeEtaDirectNonlinearGraphEvaluationAddedAsNewCriterion": False,
        "originalF0FixtureIndependentlyEnclosed": True,
        "actualPhiOverPhiStarLower": "1/4",
        "globalContinuationStressEntirelyLeanFormalized": False,
    }
    new_paths = [
        HERE / "FINAL_FORMAL_CONNECTION_REVIEW_2026_10_10_EN.md", review_path,
        GLUE / "formal-clean-replay/attempts/0001/receipt.json",
        GLUE / "formal-clean-replay/extension-attempts/0001/receipt.json",
        AXIS / "formal-input-producer/replay-independent-audit/attempts/0001/receipt.json",
        AXIS / "independent-review/actual-mixed-eta-binding-001.json",
        AXIS / "independent-review/ACTUAL_MIXED_ETA_BINDING.md",
        NAVIER / "evidence/high-precision-fixtures.json",
        NAVIER / "evidence/numerical-validation.json",
    ]
    row["sourceRefs"].extend(ref(p) for p in new_paths)
    comparator = next(x for x in result["gates"] if x["id"] == "N1-06")
    comparator["sourceRefs"].append(ref(args.observation))
    comparator["lastActualObservationUTC"] = observation["receivedUTC"]
    comparator["protectedJob"] = {"runId": job["run_id"], "jobId": job["id"],
                                  "status": job["status"], "conclusion": job["conclusion"]}

    for entry in result["gates"]:
        criterion = criteria[entry["id"]]
        assert entry["criterionText"] == criterion["accept"]
        assert entry["criterionDetailText"] == criterion["detail"]
        assert entry["criterionTextUnchanged"] is True
    current = {x["id"]: x["status"] for x in baseline["items"]}
    current.update({x["id"]: x["currentStatus"] for x in result["gates"]})
    assert Counter(current.values()) == {"PASS": 69, "PARTIAL": 1}

    result.update({
        "schema": "MathScope.OriginalNineGatesDatedIndependentAssessment/2",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "assessmentType": "NEW_DATED_DELTA_AFTER_ACTUAL_N303_CONNECTION_USING_UNCHANGED_ORIGINAL_CRITERIA",
        "historicalAssessment": ref(old_path),
        "historicalAssessmentSHA256Unchanged": True,
        "writtenAssessment": ref(HERE / "ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_3_KO.md"),
        "producer": ref(Path(__file__)),
        "formalCompletionReview": ref(review_path),
        "separateDatedDeltaCounts": {"PASS": 69, "PARTIAL": 1, "BLOCKED": 0, "total": 70},
        "requestedNineCounts": {"fulfilled": 8, "partial": 1, "blocked": 0, "total": 9},
        "newlyFulfilledInThisContinuation": ["N3-01", "N3-02", "N3-03", "N3-04", "N3-05", "N3-06", "N3-07"],
        "newlyFulfilledSinceHistoricalAssessment": ["N3-03"],
        "remainingGateIds": ["N1-06"],
        "currentFormalWorkUnfinished": False,
        "actualN303FormalAndFiniteConnectionComplete": True,
        "entireNewProfileLeanFormalized": False,
        "allOriginalNineConditionsComplete": False,
        "allOriginal70ConditionsComplete": False,
        "fullOriginalTheorem46CertificationFlag": False,
        "lastProtectedComparatorObservationUTC": observation["receivedUTC"],
        "laterComparatorObservationPolicy": "Append a separately dated observation; never rewrite this frozen observation or verdict.",
    })
    result["baselinePolicy"]["historical68_2AssessmentRewritten"] = False
    result["baselinePolicy"]["all125KernelNumericReplayAddedAsNewCriterion"] = False
    assert digest(old_path) == result["historicalAssessment"]["sha256"]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(json.dumps({"path": str(args.output), "sha256": digest(args.output),
                      "generatedUTC": result["generatedUTC"],
                      "counts": result["separateDatedDeltaCounts"], "remaining": result["remainingGateIds"]}))


if __name__ == "__main__":
    main()
