#!/usr/bin/env python3
"""Write a dated nine-gate delta with verbatim original criteria and source pins.

The verdict is the attached independent written assessment. This program
binds it to the unchanged original records and actual evidence; it does not
infer mathematical completion from a test count or alter a baseline.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
NAVIER = HERE.parent
WORKSPACE = REPO.parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False).encode()


def reference(path, locator=None):
    path = path.resolve()
    try:
        name = str(path.relative_to(REPO))
        kind = "repositoryFile"
    except ValueError:
        name = str(path)
        kind = "suppliedPDF"
    result = {"path": name, "kind": kind, "sha256": digest(path),
              "bytes": path.stat().st_size}
    if locator:
        result["locator"] = locator
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observation", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("Refusing to replace a dated gate assessment")
    original_path = REPO / "mathscope-m1/evidence/original-acceptance.json"
    baseline_path = REPO / "mathscope-m1/report/M0_M1_normalized-report-data.json"
    gates_path = REPO / "docs/NS_GATES_EN.md"
    original = json.loads(original_path.read_text())
    baseline = json.loads(baseline_path.read_text())
    original_by_id = {row["id"]: row for row in original}
    baseline_by_id = {row["id"]: row for row in baseline["items"]}
    baseline_hashes = {str(path.relative_to(REPO)): digest(path)
                       for path in (original_path, baseline_path, gates_path)}
    assert len(original) == len(original_by_id) == len(baseline_by_id) == 70
    assert baseline["counts"]["Total"] == {
        "total": 70, "PASS": 61, "PARTIAL": 7, "BLOCKED": 2, "PENDING_DATA": 0}

    assembly_path = NAVIER / "followup-20261010-symbolic-gluing/attempts/one-profile-0002/receipt.json"
    review_path = HERE / "assembly-review/0001/receipt.json"
    assembly = json.loads(assembly_path.read_text())
    review = json.loads(review_path.read_text())
    assert review["assemblyReceiptSHA256"] == digest(assembly_path)
    assert review["status"] == "PASS" and review["passed"] == review["total"] == 295
    assert review["reviewConclusion"]["allOriginalNineConditionsComplete"] is False
    assert assembly["fullOriginalNineConditionsComplete"] is False
    assert assembly["fullOriginalTheorem46CertificationFlag"] is False
    for key in ("parameterExpressionSHA256", "profileEvidenceSHA256"):
        assert review[key] == assembly[key]
    roles = assembly["acceptedEvidence"]

    def accepted(role, locator=None):
        result = reference(NAVIER / roles[role]["path"], locator)
        assert result["sha256"] == roles[role]["sha256"]
        result["assemblyRole"] = role
        return result

    blueprint = WORKSPACE / "upload/MathScope_Research_IDE_Blueprint_v1_KO(1)(4).pdf"
    handoff = WORKSPACE / "upload/MathScope_Handoff_2026-10-10_KO(1).pdf"
    assert digest(blueprint) == "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac"
    assert digest(handoff) == "d898fe8e28e4b85e0a666ef98cf10fc611e8b1035c5deb50bec338992a8cb166"

    observation = json.loads(args.observation.read_text())
    jobs = [job for result in observation["results"]
            for job in result.get("structuredContent", {}).get("jobs", [])]
    job = next(job for job in jobs if job["id"] == 113984853927)
    assert job["run_id"] == 37979127351
    assert job["status"] == "in_progress" and job["conclusion"] is None

    ids = ["N1-05", "N1-06", "N3-01", "N3-02", "N3-03",
           "N3-04", "N3-05", "N3-06", "N3-07"]
    open_ids = {"N1-06", "N3-03"}
    inherited = {
        "N1-05": "원문 전체 기본 빌드의 성공 종료 확인",
        "N1-06": "원문 보호 조건을 유지한 독립 Comparator 실행",
        "N3-01": "하나의 완성 프로파일에 대한 전체 매개변수 계층",
        "N3-02": "보정된 장의 압력과 A.21 목표 압력의 동일성, 모든 η의 정확 모멘트",
        "N3-03": "무한 고정점·유한 jet·반올림 오차·Lean 전제의 연결",
        "N3-04": "같은 무한 프로파일의 정확한 선도 항등식",
        "N3-05": "연속 적분의 엄밀한 포위와 전체 η의 interval Newton 인증",
        "N3-06": "같은 최종 프로파일의 전 영역 strict cone 및 균일 복원",
        "N3-07": "같은 최종 장의 stress·flat factorization·끝점 극한",
    }
    selected_roles = {
        "N3-01": ["outer", "axis", "continuation", "sourceEnvelope", "relaxedGaps", "loop", "frequency"],
        "N3-02": ["outer", "outerPulse", "pressure", "pressurePrefix", "pressureTailReview", "heat", "b8", "c2"],
        "N3-03": ["axis", "continuation", "core", "mixedPhi"],
        "N3-04": ["axis", "core", "mixedPhi", "coreReview", "mixedPhiReview"],
        "N3-05": ["continuation", "b8", "b8Review", "relaxedGaps", "gapReview"],
        "N3-06": ["sourceEnvelope", "sourceReview", "relaxedGaps", "gapReview", "loop", "loopReview", "frequency", "c2"],
        "N3-07": ["stress", "heat", "frequency", "relaxedGaps"],
    }
    reasons = {
        "N1-05": "Actual pinned original whole-default lake build exit 0 at 2026-10-09T20:59:06.787843+00:00; complete log and source/kernel/environment evidence independently verified.",
        "N1-06": "The protected Comparator job is still in progress in the attached actual observation; no final protected/nanoda/Comparator artifact is available.",
        "N3-01": "One actual acyclic parameter hierarchy and source identity includes proved widths, S=C^100000, R=exp(S^256), one finite N=1+ceil(R^50), and all exact corrections.",
        "N3-02": "The same actual A.21 integral and all five moments are preserved by continuous B8, heat/I2, and modulation/I1 corrections; both infinite ends and positive fields are controlled.",
        "N3-03": "The same infinite solution, actual finite coefficient/value enclosures and continuation are connected, but the complete actual Lean analytic-premise production and application remain unfinished.",
        "N3-04": "The same infinite core satisfies exact Cartesian regularity and leading identities; actual finite core/mixed-Phi arrays and derivatives are connected by positive nonlinear, tail and rounding enclosures on their stated domains.",
        "N3-05": "Actual same-source incoming continuous debt and every quadratic moment term meet a uniform all-eta B8 preconditioned inclusion in the accepted small root box.",
        "N3-06": "Actual source derivative and lower-gap inputs instantiate the original loop/C12 implications; one finite N gives strict kappa=R^-10 on the entire closed annulus after uniform I1 restoration.",
        "N3-07": "The actual final stress is zero outside the prescribed annulus and has lower bound min(C^-11,R^-8)*zeta inside, with exact flat factorizations, edge limits and reserved power-law patches.",
    }
    rows = []
    for identifier in ids:
        criterion = original_by_id[identifier]
        old = baseline_by_id[identifier]
        assert old["detail"] == criterion["detail"] and old["accept"] == criterion["accept"]
        current = "PARTIAL" if identifier in open_ids else "PASS"
        refs = []
        if identifier.startswith("N3"):
            refs.extend(accepted(role) for role in selected_roles[identifier])
            refs.extend([reference(assembly_path), reference(review_path)])
        elif identifier == "N1-05":
            refs.extend(reference(NAVIER / ("followup-20261010-n1-final/" + name))
                        for name in ("n105-portable-audit.json", "n105-runtime-audit.json", "README.md"))
        else:
            refs.extend([reference(args.observation),
                         reference(NAVIER / "followup-20261010-n1-final/README.md")])
        remaining = []
        if identifier == "N1-06":
            remaining = [
                "Actual final protected Comparator and mandatory nanoda outcomes, logs and exit codes.",
                "Same original challenge/solution/kernel/protections, exact submitted C/D declarations and axiom audit, and unchanged before/after source evidence in the final artifact.",
            ]
        if identifier == "N3-03":
            remaining = [
                "Complete concrete Lean producers and proof terms for the new A.21 datum and actual AxisSpace source functions, their all-order weighted bounds and compatible-data identities.",
                "Instantiate the original analytic/fixed-point hypotheses and transport the resulting exact object to this same finite-array/continuation data with actual kernel receipts.",
            ]
        row = {
            "id": identifier,
            "title": criterion["title"],
            "originalStatus": old["status"],
            "currentStatus": current,
            "criterionText": criterion["accept"],
            "criterionDetailText": criterion["detail"],
            "criterionTextUnchanged": True,
            "originalRecordSHA256": hashlib.sha256(canonical(criterion)).hexdigest(),
            "inheritedUserRemainingConditionText": inherited[identifier],
            "originalCriterionSource": reference(original_path, identifier),
            "originalNsGatesSource": reference(gates_path, identifier + " closure checklist"),
            "blueprintPages": [52] if identifier.startswith("N1") else [55, 56],
            "handoffPages": [1, 4, 10],
            "finding": reasons[identifier],
            "evidenceLevel": ("ACTUAL_EXECUTION_AND_SOURCE_KERNEL_AUDIT"
                              if identifier.startswith("N1") else
                              "WRITTEN_ANALYTIC_PROOF_WITH_EXECUTED_CONTINUOUS_INTERVAL_AND_INDEPENDENT_EXACT_CHECKS"),
            "sourceRefs": refs,
            "remaining": remaining,
            "fullNewAnalyticLeanVerificationClaimed": False,
        }
        if identifier == "N3-03":
            row["currentFormalWorkUnfinished"] = {
                "status": "IN_PROGRESS_NOT_COMPLETE",
                "description": "Concrete-input and controlledRemainder/threshold bridges are being developed. A later partial formal receipt may be attached without changing this open gate unless all original analytic-premise connections are actually complete.",
                "currentCompleteFormalReceipt": None,
                "source": reference(NAVIER / "followup-20261010-same-datum-axis/FORMAL_BRIDGE_REMAINING.md"),
            }
            row["separateKnownEvaluatorLimit"] = "The full nonlinear eta recurrence graph is not directly numerically evaluated over all [-1,1]."
        if identifier == "N3-04":
            row["scopeDecision"] = {
                "exactIdentitiesQuantifiedAllEta": True,
                "coreFiniteEvaluationEtaDomain": "eta=0 with stated derivatives",
                "actualFiniteEtaChart": "|eta|<=rho/4",
                "comparisonOnlyComplexChart": "|xi|<=1/16, xi=eta/j0",
                "finiteArraysConnectedToSameNonlinearSolution": True,
                "wholeEtaDirectNonlinearGraphEvaluationAddedAsNewCriterion": False,
                "formalN303CompletionImpliedByThisPass": False,
            }
        if identifier == "N1-06":
            row["lastActualObservationUTC"] = observation["receivedUTC"]
            row["protectedJob"] = {"runId": job["run_id"], "jobId": job["id"],
                                   "status": job["status"], "conclusion": job["conclusion"]}
        rows.append(row)

    delta = {identifier: row["status"] for identifier, row in baseline_by_id.items()}
    delta.update({row["id"]: row["currentStatus"] for row in rows})
    counts = Counter(delta.values())
    assert counts == {"PASS": 68, "PARTIAL": 2}
    assert all(row["criterionText"] == original_by_id[row["id"]]["accept"] for row in rows)
    assert all(digest(REPO / path) == value for path, value in baseline_hashes.items())
    result = {
        "schema": "MathScope.OriginalNineGatesDatedIndependentAssessment/1",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "assessmentDateKST": "2026-10-10",
        "assessmentType": "DATED_DELTA_USING_UNCHANGED_ORIGINAL_CRITERIA",
        "original70AcceptanceJSON": reference(original_path),
        "original70StatusRecord": reference(baseline_path),
        "originalNsGates": reference(gates_path),
        "blueprintPDF": reference(blueprint, "pp.52,55-56,78,81"),
        "handoffPDF": reference(handoff, "pp.1,4,10,13,18"),
        "sourcePaperSHA256": assembly["sourcePaperSHA256"],
        "parameterExpressionSHA256": assembly["parameterExpressionSHA256"],
        "profileEvidenceSHA256": assembly["profileEvidenceSHA256"],
        "assemblyReceipt": reference(assembly_path),
        "independentAssemblyReview": reference(review_path),
        "writtenAssessment": reference(HERE / "ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_KO.md"),
        "producer": reference(Path(__file__)),
        "frozenBaselineCounts": {"PASS": 61, "PARTIAL": 7, "BLOCKED": 2, "total": 70},
        "separateDatedDeltaCounts": {"PASS": 68, "PARTIAL": 2, "BLOCKED": 0, "total": 70},
        "requestedNineCounts": {"fulfilled": 7, "partial": 2, "blocked": 0, "total": 9},
        "alreadyFulfilledAtHandoff": ["N1-05"],
        "newlyFulfilledInThisContinuation": ["N3-01", "N3-02", "N3-04", "N3-05", "N3-06", "N3-07"],
        "remainingGateIds": ["N1-06", "N3-03"],
        "gates": rows,
        "baselinePolicy": {
            "originalCriteriaChanged": False,
            "frozenBaselineRewritten": False,
            "historicalFailureOrConditionalReceiptsRewritten": False,
            "other61OriginalPassItemsReauditedByThisAssessment": False,
            "deltaCountsAreMathematicalCompletionPercentage": False,
            "partialFormalWorkMayBeAttachedWithoutFullPromotion": True,
        },
        "currentFormalWorkUnfinished": True,
        "allOriginalNineConditionsComplete": False,
        "allOriginal70ConditionsComplete": False,
        "fullOriginalTheorem46CertificationFlag": False,
        "entireNewProfileLeanFormalized": False,
        "lastProtectedComparatorObservationUTC": observation["receivedUTC"],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x") as handle:
        json.dump(result, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(json.dumps({"path": str(args.output), "sha256": digest(args.output),
                      "separateDatedDeltaCounts": result["separateDatedDeltaCounts"],
                      "remaining": result["remainingGateIds"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
