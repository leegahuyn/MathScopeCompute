#!/usr/bin/env python3
"""Issue a new assessment only after actual protected Comparator acceptance.

This writer preserves every original criterion and every previously fulfilled
gate entry. It validates recorded evidence; it does not run a theorem prover or
turn an audit-predicate count into a mathematical completeness percentage.
Existing dated files are never replaced. No simulated successful input is used.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zipfile import ZipFile

HERE = Path(__file__).resolve().parent
EDITION = HERE.parents[2]
FINAL = HERE.parent / "followup-20261010-final-stress-audit"
FROZEN = FINAL / "ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_3.json"
FROZEN_SHA256 = "e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c"
BINDING = HERE / "terminal-auditor-inputs/actual-run-binding.json"
BINDING_SHA256 = "5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab"
AUDITOR = HERE / "verify_n106_terminal_artifact.py"
AUDITOR_SHA256 = "81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef"
RESOLUTION = HERE / "historical-criterion-inputs/reference-resolution.json"
RESOLUTION_SHA256 = "da4622e9307e3d062fed8e3d097e372406021af0148afd79e313cdbc6bd11bfc"
SCOPE_MAP_SHA256 = "af7021b5765feabf3d90ccc6ef77bc599b3215899755164e620421afd93dc583"
SCOPE_REVIEW_SHA256 = "e9d1164573ec501e4ad5fd7cb8b21a4ef7eb0086b4dcd3c609e35194766b3c1b"
SCOPE_MEMO_SHA256 = "4765a8379badf62453a25621e3288ade1652fd309f0110f5c0bb0534e1d8febe"
THEOREMS = {
    "NavierStokes.Comparator.navier_stokes_breakdown_R3",
    "NavierStokes.Comparator.navier_stokes_breakdown_periodic",
}
ALLOWED_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
KST = timezone(timedelta(hours=9))


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def digest(path: Path) -> str:
    return sha(path.read_bytes())


def require(condition, message: str):
    if not condition:
        raise ValueError(message)


def document(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def ref(path: Path, locator=None):
    path = path.resolve()
    relative = path.relative_to(EDITION.resolve()).as_posix()
    result = {"path": relative, "kind": "repositoryFile", "sha256": digest(path),
              "bytes": path.stat().st_size}
    if locator:
        result["locator"] = locator
    return result


def all_refs(value):
    if isinstance(value, dict):
        if isinstance(value.get("path"), str) and isinstance(value.get("sha256"), str):
            yield value
        for item in value.values():
            yield from all_refs(item)
    elif isinstance(value, list):
        for item in value:
            yield from all_refs(item)


def verify_historical_refs(old):
    require(digest(RESOLUTION) == RESOLUTION_SHA256, "Historical resolution map changed")
    resolution = document(RESOLUTION)
    aliases = {(item["historicalPath"], item["historicalSHA256"]): item
               for item in resolution["entries"]}
    verified = []
    seen = set()
    for item in all_refs(old):
        identity = item["path"], item["sha256"]
        if identity in seen:
            continue
        seen.add(identity)
        path = Path(item["path"])
        if not path.is_absolute():
            path = EDITION / path
        relocated = False
        if not path.is_file() or digest(path) != item["sha256"]:
            alias = aliases.get(identity)
            require(alias is not None, "Missing or changed historical reference: " + str(path))
            path = EDITION / alias["snapshotPath"]
            relocated = True
        require(path.is_file() and not path.is_symlink(), "Invalid historical input: " + str(path))
        require(digest(path) == item["sha256"], "Historical input hash differs: " + str(path))
        if "bytes" in item:
            require(path.stat().st_size == item["bytes"], "Historical input size differs: " + str(path))
        verified.append({"historicalPath": item["path"], "sha256": item["sha256"],
                         "bytes": path.stat().st_size, "resolvedFromHistoricalSnapshot": relocated,
                         "resolvedPath": str(path.relative_to(EDITION)) if not Path(item["path"]).is_absolute()
                                         else item["path"]})
    return verified


def passed_review(value, description, expected_status="PASS"):
    require(value.get("status") == expected_status, description + " did not pass")
    checks = value.get("checks", [])
    require(bool(checks) and all(item.get("pass") is True for item in checks),
            description + " has missing or failed checks")
    require(type(value.get("passed")) is int and value["passed"] == value.get("total") == len(checks),
            description + " predicate count differs")


def verify_terminal(audit, observation, artifact_path, binding):
    require(digest(AUDITOR) == AUDITOR_SHA256, "Reviewed terminal auditor changed")
    require(audit.get("schema") == "MathScope.OriginalProtectedComparatorTerminalAudit/1",
            "Expected actual terminal artifact auditor schema")
    passed_review(audit, "Actual terminal artifact audit")
    require(audit.get("N106Completed") is True and audit.get("postcheckOnlyFailure") is False,
            "Actual terminal acceptance without a wrapper exception is required")
    require(audit.get("actualJobStatus") == "completed" and audit.get("actualJobConclusion") == "success",
            "Actual successful GitHub job is required")
    require(audit.get("actualControllerStatus") == "PASS", "Actual controller must pass")
    for name in ("actualControllerExitCode", "actualProtectedComparatorExitCode"):
        require(type(audit.get(name)) is int and audit[name] == 0, "Actual integer exit zero required: " + name)
    require(audit.get("verifierSHA256") == AUDITOR_SHA256 and audit.get("actualRunBindingSHA256") == BINDING_SHA256,
            "Actual audit is not bound to the independently reviewed source")
    require(audit.get("runId") == binding["runId"] and audit.get("jobId") == binding["jobId"],
            "Actual audit run identity differs")
    require(audit.get("githubObservationSHA256") == digest(observation), "Final observation hash differs")
    archive = artifact_path.read_bytes()
    require(audit.get("archiveSHA256") == sha(archive) and audit.get("archiveBytes") == len(archive),
            "Actual downloaded artifact bytes differ")
    require(audit.get("trackedFileCount") == 2669, "Original 2,669 source files are required")
    axioms = audit.get("theoremAxioms", {})
    require(set(axioms) == THEOREMS and all(set(items) <= ALLOWED_AXIOMS for items in axioms.values()),
            "Both actual submitted theorem axiom audits are required")
    obs = document(observation)
    responses = [item.get("value", item).get("structuredContent", {})
                 for item in obs.get("results", []) if isinstance(item, dict)]
    jobs = [job for response in responses for job in response.get("jobs", [])]
    artifacts = [artifact for response in responses for artifact in response.get("artifacts", [])]
    selected = [job for job in jobs if job.get("id") == binding["jobId"]]
    require(len(selected) == 1, "Final observation must identify exactly one actual protected job")
    job = selected[0]
    require(job.get("run_id") == binding["runId"] and job.get("status") == "completed"
            and job.get("conclusion") == "success", "Actual observed protected job did not succeed")
    selected = [item for item in artifacts if item.get("id") == audit["artifactId"]]
    require(len(selected) == 1, "Actual artifact identity is absent or ambiguous")
    artifact = selected[0]
    require(artifact.get("workflow_run", {}).get("id") == binding["runId"]
            and artifact.get("workflow_run", {}).get("head_sha") == binding["mathscopeCommit"]
            and artifact.get("size_in_bytes") == len(archive)
            and artifact.get("digest") == "sha256:" + sha(archive),
            "Actual API artifact binding differs")
    with ZipFile(artifact_path) as zipped:
        require(zipped.testzip() is None, "Actual artifact has a CRC error")
        controller = json.loads(zipped.read("result.json"))
        require(controller["status"] == "PASS" and type(controller["exitCode"]) is int
                and controller["exitCode"] == 0, "Actual archived controller did not pass")
        steps = controller["steps"]
        require(len(steps) == 35 and all(type(s.get("exitCode")) is int and s["exitCode"] == 0
                                      and s.get("completedUTC") for s in steps),
                "All actual 35 command stages must have completed successfully")
        for member in audit["members"]:
            data = zipped.read(member["name"])
            require(len(data) == member["bytes"] and sha(data) == member["sha256"],
                    "Actual audit member differs: " + member["name"])
    return obs, job, artifact, controller


def verify_scope(scope, review, old):
    """The independent map's explicit schema is checked, never inferred from 70/70."""
    passed_review(review, "Original Theorem 4.6 scope review", "PASS_SOURCE_AND_SCOPE_MAPPING_REVIEW")
    require(scope.get("schema") == "mathscope.independent.theorem46-acceptance-scope-map.v1",
            "Expected the actual independent original-scope map")
    common = scope.get("sameFinalProfileBinding", {})
    require(common.get("parameterExpressionSHA256") == old["parameterExpressionSHA256"]
            and common.get("profileEvidenceSHA256") == old["profileEvidenceSHA256"]
            and common.get("sourcePaperSHA256") == old["sourcePaperSHA256"]
            and common.get("assemblyReceiptSHA256") == old["assemblyReceipt"]["sha256"]
            and common.get("formalCompletionReviewSHA256") == old["formalCompletionReview"]["sha256"]
            and review.get("sameFinalProfileBinding") == common,
            "The theorem clauses must refer to the exact same final profile")
    clauses = scope.get("clauses", [])
    require([item.get("clause") for item in clauses] == ["i", "ii", "iii", "iv", "v", "vi"],
            "An exact original six-clause scope map is required")
    flags = scope.get("flagInterpretation", {})
    meaning = "ORIGINAL_THEOREM_4_6_LEADING_PROFILE_ACCEPTANCE_SCOPE"
    require(scope.get("theoremScope") == meaning and flags.get("meaning") == meaning
            and flags.get("recommendedValueInANewAssessmentAfterEveryRequiredActualResult") is True
            and flags.get("currentValueChangedByThisReview") is False
            and flags.get("entireNewProfileLeanFormalized") is False
            and scope.get("executionBoundary", {}).get("currentTerminalCompletionClaimed") is False,
            "The original leading-profile scope must remain distinct from complete Lean formalization")
    for clause in clauses:
        require(bool(clause.get("sourceRefs")) and clause.get("sameFinalProfileBinding") == common,
                "Every original theorem clause requires the same actual profile evidence")
    verified = []
    seen = set()
    for item in all_refs(scope):
        identity = item["path"], item["sha256"]
        if identity in seen:
            continue
        seen.add(identity)
        path = Path(item["path"])
        if not path.is_absolute():
            path = EDITION / path
        require(path.is_file() and not path.is_symlink() and digest(path) == item["sha256"]
                and ("bytes" not in item or path.stat().st_size == item["bytes"]),
                "Same-profile clause input differs: " + str(path))
        verified.append({"path": item["path"], "sha256": item["sha256"]})
    return verified


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("audit", "observation", "artifact", "independent-comparator-review",
                 "scope-map", "scope-review", "scope-memo", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    written_path = args.output.with_name(args.output.stem + "_KO.md")
    require(not args.output.exists() and not written_path.exists(), "Refusing to replace a dated assessment")
    require(digest(FROZEN) == FROZEN_SHA256 and digest(BINDING) == BINDING_SHA256,
            "Frozen assessment or actual-run binding changed")
    old, binding = document(FROZEN), document(BINDING)
    historical_refs = verify_historical_refs(old)
    require(old["separateDatedDeltaCounts"] == {"PASS": 69, "PARTIAL": 1, "BLOCKED": 0, "total": 70}
            and old["remainingGateIds"] == ["N1-06"], "Unexpected frozen 69/1 baseline")
    audit = document(args.audit)
    observation, job, artifact, controller = verify_terminal(audit, args.observation, args.artifact, binding)
    independent = document(args.independent_comparator_review)
    passed_review(independent, "Independent actual protected Comparator review")
    require(independent.get("N106Completed") is True
            and independent.get("archiveSHA256") == audit["archiveSHA256"]
            and independent.get("runId") == binding["runId"]
            and independent.get("jobId") == binding["jobId"],
            "Independent review must concern this actual protected Comparator artifact")
    scope = document(args.scope_map)
    scope_review = document(args.scope_review)
    require(digest(args.scope_map) == SCOPE_MAP_SHA256 and digest(args.scope_review) == SCOPE_REVIEW_SHA256
            and digest(args.scope_memo) == SCOPE_MEMO_SHA256,
            "Frozen independent theorem scope memo/map/review changed")
    require(scope_review.get("outputSHA256") == {"theorem46-clause-map.json": SCOPE_MAP_SHA256,
                                                 "THEOREM46_SCOPE_REVIEW.md": SCOPE_MEMO_SHA256},
            "Scope review output hashes differ")
    scope_refs = verify_scope(scope, scope_review, old)

    original = document(EDITION / old["original70AcceptanceJSON"]["path"])
    criteria = {item["id"]: item for item in original}
    baseline = document(EDITION / old["original70StatusRecord"]["path"])
    require(len(criteria) == len(original) == len(baseline["items"]) == 70, "Original 70 criteria changed")
    result = copy.deepcopy(old)
    row = next(item for item in result["gates"] if item["id"] == "N1-06")
    row.update({
        "currentStatus": "PASS",
        "finding": "The actual independently checked protected Comparator completed successfully under the unchanged original source, kernel, configuration and security guards. Mandatory nanoda, the Lean default kernel and final Quot postcheck accepted; both submitted C/D types and axioms were printed, and all 2,669 tracked source files remained identical.",
        "evidenceLevel": "ACTUAL_PROTECTED_COMPARATOR_WITH_EXTERNAL_NANODA_AND_LEAN_KERNEL_ACCEPTANCE_AND_INDEPENDENT_ARTIFACT_REVIEW",
        "remaining": [],
        "lastActualObservationUTC": observation["receivedUTC"],
        "protectedJob": {"runId": binding["runId"], "jobId": binding["jobId"], "status": job["status"],
                         "conclusion": job["conclusion"], "mathscopeCommit": binding["mathscopeCommit"],
                         "artifactId": artifact["id"], "actualControllerExitCode": 0,
                         "actualProtectedComparatorExitCode": 0},
        "securityOptionsUnchanged": True,
        "transportOnlyAdaptationDisclosed": True,
        "historicalIncompleteRunsRemainUnchanged": True,
    })
    row["sourceRefs"].extend(ref(path) for path in (args.audit, args.observation, args.artifact,
                                                   args.independent_comparator_review, BINDING, AUDITOR))
    for before, after in zip(old["gates"], result["gates"]):
        require(before["id"] == after["id"], "Original gate order changed")
        if before["id"] != "N1-06":
            require(before == after and before["currentStatus"] == "PASS", "A previously fulfilled gate was rewritten")
        source = criteria[after["id"]]
        require(after["criterionText"] == source["accept"] and after["criterionDetailText"] == source["detail"]
                and after["criterionTextUnchanged"] is True,
                "Original criterion wording changed: " + after["id"])
        require(after["originalRecordSHA256"] == sha(json.dumps(source, ensure_ascii=False, sort_keys=True,
                                                               separators=(",", ":")).encode()),
                "Original criterion record hash changed: " + after["id"])
    statuses = {item["id"]: item["status"] for item in baseline["items"]}
    require(Counter(statuses.values()) == {"PASS": 61, "PARTIAL": 7, "BLOCKED": 2}, "Frozen v54 statuses changed")
    statuses.update({item["id"]: item["currentStatus"] for item in result["gates"]})
    require(Counter(statuses.values()) == {"PASS": 70}, "Actual criteria do not close to 70/0")
    now = datetime.now(timezone.utc)
    result.update({
        "schema": "MathScope.OriginalNineGatesDatedIndependentAssessment/3",
        "generatedUTC": now.isoformat(), "generatedKST": now.astimezone(KST).isoformat(),
        "assessmentDateKST": now.astimezone(KST).date().isoformat(),
        "assessmentType": "NEW_DATED_DELTA_AFTER_ACTUAL_PROTECTED_COMPARATOR_USING_UNCHANGED_ORIGINAL_CRITERIA",
        "historicalAssessment": ref(FROZEN), "historicalAssessmentSHA256Unchanged": True,
        "earlierHistoricalAssessment": copy.deepcopy(old["historicalAssessment"]),
        "producer": ref(Path(__file__)),
        "separateDatedDeltaCounts": {"PASS": 70, "PARTIAL": 0, "BLOCKED": 0, "total": 70},
        "requestedNineCounts": {"fulfilled": 9, "partial": 0, "blocked": 0, "total": 9},
        "newlyFulfilledSinceHistoricalAssessment": ["N1-06"],
        "newlyFulfilledInThisContinuation": ["N1-06", "N3-01", "N3-02", "N3-03", "N3-04", "N3-05", "N3-06", "N3-07"],
        "remainingGateIds": [], "allOriginalNineConditionsComplete": True,
        "allOriginal70ConditionsComplete": True, "fullOriginalTheorem46CertificationFlag": True,
        "fullOriginalTheorem46CertificationMeaning": "ORIGINAL_THEOREM_4_6_LEADING_PROFILE_ACCEPTANCE_SCOPE",
        "entireNewProfileLeanFormalized": False,
        "fullOriginalTheorem46CertificationFlagMeaning": "All original M0/M1 acceptance conditions for Theorem 4.6 leading profile and annular stress, with the same-profile six-clause evidence map and the independently verified original protected Comparator; not a claim that the entire new analytic construction is formalized in Lean, or that later full time-dependent Navier–Stokes stages are complete.",
        "originalTheorem46ClauseMap": ref(args.scope_map),
        "originalTheorem46ScopeReview": ref(args.scope_review),
        "originalTheorem46ScopeMemo": ref(args.scope_memo),
        "actualProtectedComparatorAudit": ref(args.audit),
        "independentProtectedComparatorReview": ref(args.independent_comparator_review),
        "actualProtectedComparatorBinding": ref(BINDING),
        "actualProtectedComparatorArtifact": ref(args.artifact),
        "lastProtectedComparatorObservationUTC": observation["receivedUTC"],
        "historicalReferenceResolution": ref(RESOLUTION),
        "verifiedHistoricalReferences": historical_refs,
        "verifiedSameProfileClauseReferences": scope_refs,
        "actualProtectedComparatorCompletedUTC": controller["completedUTC"],
        "laterComparatorObservationPolicy": "This assessment records one actual successful protected run. Preserve all earlier observations and conclusions without rewriting them.",
    })
    result["baselinePolicy"]["historical69_1AssessmentRewritten"] = False
    result["baselinePolicy"]["previousEightFulfilledGateEntriesRewritten"] = False
    rows = "\n".join(f"| {g['id']} | {g['title']} | PASS |" for g in result["gates"])
    text = f"""# 원래 9개 완료 조건의 최종 별도 판정

판정 시각: **{now.astimezone(KST).strftime('%Y-%m-%d %H:%M:%S KST')}**. 원시 UTC: `{now.isoformat()}`.

원래 70개 완료 기준을 유지한 새 판정은 **70 PASS / 0 PARTIAL / 0 BLOCKED**이며, 요청한 9개 항목은 모두 충족했다. 이전 v54의 61/7/2, 후속 68/2와 69/1 기록은 그대로 보존한다. 이번 판정이 새로 닫는 항목은 **N1-06**이다. 이미 충족한 나머지 8개 항목의 판정 항목과 근거 목록은 변경하지 않았다.

| 항목 | 원래 제목 | 새 판정 |
|---|---|---|
{rows}

## 실제 보호 Comparator 결과

GitHub run `{binding['runId']}`, job `{binding['jobId']}`, 실행 commit `{binding['mathscopeCommit']}`에서 실제 job은 `completed/success`, controller와 보호 Comparator 명령은 모두 종료 코드 `0`이다. 35개 실제 단계의 종료와 로그 해시를 확인했다. mandatory nanoda, Lean 기본 kernel, 마지막 Quot 후검사가 실제 수락했고, 제출 C/D 두 정리의 타입과 `#print axioms`가 보존되어 있다. 원문 2,669개 추적 파일의 전후 해시는 같으며 공식 Lean kernel, 원문 설정과 보안 옵션은 유지했다.

독립적으로 받은 artifact `{artifact['id']}`는 {audit['archiveBytes']:,} bytes, SHA-256 `{audit['archiveSHA256']}`이다. 이 ZIP과 실제 GitHub 최종 관측, 원시 단계 로그, 고정한 실행 소스, 별도 독립 검토를 함께 확인했다. 터미널 전송 수정은 실제 진단 결과에 근거하며, 취소된 과거 실행과 진단 전용 실행은 각각의 원래 결과로 남는다.

## 같은 최종 프로파일과 Theorem 4.6의 범위

Theorem 4.6 (i)–(vi)의 별도 절별 근거 지도는 동일한 매개변수 표현 SHA-256 `{old['parameterExpressionSHA256']}`와 프로파일 근거 SHA-256 `{old['profileEvidenceSHA256']}`에 연결된다. N3-01~07의 판정은 상수 계층, A.21 압력 datum, 무한 고정점과 유한 배열의 오차 연결, 정확 core 항등식, 모든 eta의 연속 모멘트 접합, 한 유한 주파수의 strict cone, 최종 stress 및 끝점 극한의 기존 증거를 유지한다.

새 `fullOriginalTheorem46CertificationFlag=true`는 인수인계와 Blueprint에 명시된 **Theorem 4.6 leading profile 및 annular stress의 원래 완료 범위**를 뜻한다. 전부 새 Lean 정리로 형식화했다는 뜻이 아니므로 `entireNewProfileLeanFormalized=false`는 유지한다. 이후 전체 시간 의존 Navier–Stokes 단계, `f=0`, `t=1`에서의 매끄러운 연장을 완료했다고 주장하지 않는다. 기존 61개 PASS 항목의 새 전수 재감사나 수학 증명률도 이 숫자로 주장하지 않는다.

## 원본과 과거 근거 보존

원래 70개 acceptance JSON, NS gate 문구, 각 criterion record 해시, v54 상태 및 이전 판정 JSON을 확인했다. 과거 판정이 인용한 이전 N1 README는 당시 Git commit의 정확한 바이트를 별도 보존하고 경로와 해시로 연결했다. 현재 README나 과거 판정은 다시 쓰지 않았다. 상세 파일 해시와 실행 결속은 동명 JSON에 기록한다.
"""
    written_bytes = text.encode("utf-8")
    require(written_path.resolve().is_relative_to(EDITION.resolve()), "Assessment must be in the preserved edition tree")
    result["writtenAssessment"] = {"path": written_path.resolve().relative_to(EDITION.resolve()).as_posix(),
                                   "kind": "repositoryFile", "sha256": sha(written_bytes), "bytes": len(written_bytes)}
    require(digest(FROZEN) == FROZEN_SHA256, "Frozen assessment changed during validation")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with written_path.open("xb") as handle:
        handle.write(written_bytes)
    with args.output.open("x", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(json.dumps({"path": str(args.output), "sha256": digest(args.output),
                      "generatedKST": result["generatedKST"], "counts": result["separateDatedDeltaCounts"],
                      "remaining": result["remainingGateIds"]}))


if __name__ == "__main__":
    main()
