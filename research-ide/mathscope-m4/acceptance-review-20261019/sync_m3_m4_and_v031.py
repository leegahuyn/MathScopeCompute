#!/usr/bin/env python3
"""Build and verify MathScope M3/M4 publication staging artifacts.

This script is deliberately NOT a WebsitePublisher API client. It never
publishes, edits acceptance rows, or copies the large live IDE page into a
stub file. The full v0.3.1.html source remains managed by WebsitePublisher;
this script maintains the Git-visible observation, staging bundle, and status
page from source-pinned repository evidence.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
M3_DIR = "research-ide/mathscope-m3/recovery-20261019"
M4_DIR = "research-ide/mathscope-m4/recovery-20261019"
M4_REVIEW = "research-ide/mathscope-m4/acceptance-review-20261019"
OBSERVATION = "public/v0.3.1-publisher-observation.json"
BUNDLE = "public/websitepublisher-v118-followup-bundle.json"
STATUS_PAGE = "public/v0.3.1-sync-status.html"


def load_json(relative: str):
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def blob_sha(path: Path) -> str:
    data = path.read_bytes()
    return hashlib.sha1(f"blob {len(data)}\0".encode("ascii") + data).hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def build_outputs():
    checkpoint = load_json("CHECKPOINT.json")
    observation = load_json(OBSERVATION)
    m3_path = ROOT / f"{M3_DIR}/M3_CURRENT_ORIGINAL_LEDGER.json"
    m4_path = ROOT / f"{M4_DIR}/M4_ORIGINAL_ACCEPTANCE_MATRIX.json"
    m3 = json.loads(m3_path.read_text(encoding="utf-8"))
    m4 = json.loads(m4_path.read_text(encoding="utf-8"))
    finite = load_json(f"{M3_DIR}/evidence/FINITE_VS_CONTINUUM_N706_N805_RECEIPT.json")
    cutoff = load_json(f"{M3_DIR}/evidence/OUTER_CUTOFF_RUN.json")
    m4_receipt = load_json(f"{M4_REVIEW}/evidence/followup-20261020/M4_FOLLOWUP_VERIFICATION_RECEIPT.json")

    m3_blob, m4_blob = blob_sha(m3_path), blob_sha(m4_path)
    rows = m4.get("rows", [])
    counts = Counter(row.get("status") for row in rows)
    open_rows = sorted(row["id"] for row in rows if row.get("status") == "OPEN")
    expected_ids = {*(f"I3-{i:02d}" for i in range(1, 9)), *(f"R1-{i:02d}" for i in range(1, 9))}

    require(checkpoint["m3"]["githubBlobSha"] == m3_blob, "M3 ledger blob differs from CHECKPOINT.json.")
    require(checkpoint["m4"]["githubBlobSha"] == m4_blob, "M4 matrix blob differs from CHECKPOINT.json.")
    require(m3.get("M3") == {"inherited_completed": 62, "total": 64, "newly_closed": 0, "open": ["N7-06", "N8-05"]}, "M3 frontier changed; review before staging.")
    require(m3.get("actual_last_resolved_tau") is None, "M3 actual_last_resolved_tau must remain null.")
    require(finite.get("sourceLedgerBlobSha") == m3_blob, "Finite-vs-continuum receipt is not pinned to the current M3 ledger.")
    require(finite.get("finiteComputation", {}).get("runHash") == cutoff.get("run_hash"), "Finite receipt and saved cutoff run disagree.")
    require(finite.get("N706Closed") is False and finite.get("N805Closed") is False and finite.get("actualLastResolvedTau") is None, "Finite receipt overstates continuum closure.")
    require(m4.get("originalCriteria") == 16 and len(rows) == 16 and {r.get("id") for r in rows} == expected_ids, "M4 original 16-row matrix is incomplete.")
    require(counts == Counter({"PARTIAL": 14, "OPEN": 2}), f"Unexpected M4 status counts: {dict(counts)}")
    require(m4.get("overallRelease") == "HOLD" and m4.get("finalAcceptance") == "UNCONFIRMED" and m4.get("acceptedCurrentRelease") is None, "M4 release/acceptance status changed.")
    require(m4_receipt.get("matrixBlobSha") == m4_blob, "M4 follow-up receipt is not pinned to the current matrix.")
    require(m4_receipt.get("originalCriteriaStatusCounts") == {"ACCEPTED": 0, "PARTIAL": 14, "OPEN": 2}, "M4 receipt counts do not match the original matrix.")
    require(observation.get("projectId") == 29770 and observation.get("page", {}).get("slug") == "v0.3.1.html", "Unexpected WebsitePublisher observation.")
    require(observation["page"].get("version") == 118 and observation["page"].get("versionHash") == "9a0eebc5", "Live page observation changed; refresh observation after a read-back.")
    require(observation["fragments"]["runtime"].get("version") == 8 and observation["fragments"]["runtime"].get("versionHash") == "abfa2a92", "Live runtime fragment observation changed; refresh after read-back.")
    require(observation["fragments"]["layout"].get("version") == 2 and observation["fragments"]["layout"].get("versionHash") == "460012fd", "Live layout fragment observation changed; refresh after read-back.")
    current_m4 = observation["currentM4Panel"]
    require(current_m4.get("sourceMatrixGitBlobSha") == m4_blob and current_m4.get("sourceReceiptGitBlobSha") == blob_sha(ROOT / f"{M4_REVIEW}/evidence/followup-20261020/M4_FOLLOWUP_VERIFICATION_RECEIPT.json"), "Live M4 panel is not pinned to current repository evidence.")
    require(current_m4.get("statusCounts") == {"ACCEPTED": 0, "PARTIAL": 14, "OPEN": 2} and current_m4.get("overallRelease") == "HOLD", "Live M4 panel status differs from source matrix.")
    require(observation["currentM3"].get("sourceLedgerGitBlobSha") == m3_blob, "Live M3 panel is not pinned to the current ledger.")
    require(observation["page"].get("fullPageSourceMirroredInGit") is False, "Do not mirror/replace the 26 MB live IDE page with a status-page stub.")

    bundle = {
        "schema": "MathScope.WebsitePublisherFollowupBundle/2",
        "generatedAt": observation["observedAt"],
        "repository": "leegahuyn/MathScopeCompute",
        "pullRequest": 30,
        "branch": "mathscope-m3-n6-cloud-20261014",
        "sourceHeadAtObservation": observation["sourceHeadAtObservation"],
        "intendedWebsitePublisherProjectId": 29770,
        "pageSlug": "v0.3.1.html",
        "liveBaseline": {
            "page": {"version": observation["page"]["version"], "versionHash": observation["page"]["versionHash"]},
            "runtime": {"name": observation["fragments"]["runtime"]["name"], "version": observation["fragments"]["runtime"]["version"], "versionHash": observation["fragments"]["runtime"]["versionHash"]},
            "layout": {"name": observation["fragments"]["layout"]["name"], "version": observation["fragments"]["layout"]["version"], "versionHash": observation["fragments"]["layout"]["versionHash"]},
            "dataFragments": observation["fragments"]["data"]
        },
        "evidencePins": {
            "m3LedgerGitBlobSha": m3_blob,
            "finiteReceiptGitBlobSha": blob_sha(ROOT / f"{M3_DIR}/evidence/FINITE_VS_CONTINUUM_N706_N805_RECEIPT.json"),
            "m4MatrixGitBlobSha": m4_blob,
            "m4FollowupReceiptGitBlobSha": blob_sha(ROOT / f"{M4_REVIEW}/evidence/followup-20261020/M4_FOLLOWUP_VERIFICATION_RECEIPT.json")
        },
        "m3": {
            "inheritedCompleted": 62, "total": 64, "newlyClosed": 0,
            "open": ["N7-06", "N8-05"], "actualLastResolvedTau": None,
            "actualNonzeroFieldEvaluated": False
        },
        "m4": {
            "originalCriteriaTotal": 16, "statusCounts": {"ACCEPTED": 0, "PARTIAL": 14, "OPEN": 2},
            "openRows": open_rows, "finalAcceptance": "UNCONFIRMED",
            "acceptedCurrentRelease": None, "overallRelease": "HOLD"
        },
        "stagedPayloads": {
            "publisherObservation": OBSERVATION,
            "statusPage": STATUS_PAGE,
            "finiteReceipt": f"{M3_DIR}/evidence/FINITE_VS_CONTINUUM_N706_N805_RECEIPT.json",
            "m4Receipt": f"{M4_REVIEW}/evidence/followup-20261020/M4_FOLLOWUP_VERIFICATION_RECEIPT.json",
            "syncScript": f"{M4_REVIEW}/sync_m3_m4_and_v031.py",
            "moduleVerifier": f"{M4_REVIEW}/verify_m4_modules.mjs"
        },
        "fullPageSource": {
            "path": "v0.3.1.html",
            "livePageVersion": observation["page"]["version"],
            "livePageVersionHash": observation["page"]["versionHash"],
            "mirroredInGit": False,
            "reason": "The live IDE source is approximately 26.3 million characters with embedded app/worker bundles. It remains managed in WebsitePublisher; do not substitute the status page for it."
        },
        "publication": {
            "status": "PARTIAL_RUNTIME_UPDATED_FULL_PAGE_UNCHANGED",
            "runtimeFragmentUpdated": True,
            "fullPageChanged": False,
            "currentBrowserInspection": False,
            "physicalMobileInspection": False,
            "overallRelease": "HOLD"
        },
        "limitation": "This bundle records verified live version/hash metadata and staged evidence. It is not a complete IDE HTML source archive, browser acceptance, physical mobile inspection, or mathematical proof."
    }
    bundle_text = json.dumps(bundle, ensure_ascii=False, indent=2) + "\n"

    status_html = f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MathScope 동기화 상태 — HOLD</title>
<style>body{{font:16px/1.65 system-ui,sans-serif;max-width:920px;margin:2rem auto;padding:0 1rem;color:#18322b}}h1{{line-height:1.2}}table{{border-collapse:collapse;width:100%}}td,th{{border:1px solid #bbb;padding:.6rem;text-align:left;vertical-align:top}}code{{overflow-wrap:anywhere}}.hold{{font-weight:700;color:#8a3f00}}.note{{padding:.8rem;border-left:4px solid #9a6b1e;background:#fff5dc}}</style></head><body>
<h1>MathScope M3/M4 동기화 상태</h1>
<p>이 문서는 동기화 상태를 설명하는 별도 정적 보고서입니다. 운영 중인 <code>v0.3.1.html</code>의 대체본이 아닙니다.</p>
<table><tr><th>영역</th><th>현재 관찰</th></tr>
<tr><td>WebsitePublisher 본 페이지</td><td><a href="https://project29770.websitepublisher.ai/v0.3.1.html">v{observation["page"]["version"]} · {observation["page"]["versionHash"]}</a>; 이번 작업에서 본 페이지 본문은 변경하지 않음</td></tr>
<tr><td>운영 런타임 fragment</td><td>v{observation["fragments"]["runtime"]["version"]} · {observation["fragments"]["runtime"]["versionHash"]}; M4 UI는 현재 GitHub 원장 0 ACCEPTED / 14 PARTIAL / 2 OPEN을 표시하고, 저장된 과거 payload를 과거 스냅샷으로 분리</td></tr>
<tr><td>M3</td><td>62/64 inherited; N7-06과 N8-05 OPEN; actual_last_resolved_tau=null; 새로 닫힌 원래 기준 0</td></tr>
<tr><td>M4</td><td>원래 16항목: 0 ACCEPTED, 14 PARTIAL, 2 OPEN (R1-05, R1-08); finalAcceptance=UNCONFIRMED; acceptedCurrentRelease=null</td></tr>
<tr><td>제한된 소프트웨어 검사</td><td>저장된 증거에 cutoff 9/9, native 입력 상자 19, M4 의미 계약 10/10, 증거 열람 6/6으로 기록. 이는 원래 수학적 인수나 브라우저/모바일 인수가 아님</td></tr>
<tr><td>전체 페이지 소스</td><td>운영 페이지는 약 {observation["page"]["sourceLengthCharacters"]:,} 문자이며 앱/worker 번들을 내장함. Git에 거대한 중복본을 추가하거나 이 상태 페이지로 대체하지 않고 WebsitePublisher에서 관리</td></tr>
</table>
<p class="note">일부 런타임은 갱신되었지만 본 페이지는 v{observation["page"]["version"]} 그대로입니다. 실제 브라우저 종단 간 검수와 물리 모바일 검수는 확인되지 않았습니다.</p>
<p class="hold">전체 릴리스: HOLD</p>
<p>유한 cutoff 성공은 실제 비영 장의 전체 K 에너지 balance를 증명하지 않으며, M4 소프트웨어 검사 통과는 원래 16개 인수 항목의 수락을 뜻하지 않습니다.</p>
<p>검증 근거: <a href="https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-n6-cloud-20261014/CHECKPOINT.json">CHECKPOINT</a> · <a href="https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-n6-cloud-20261014/{M3_DIR}/M3_CURRENT_ORIGINAL_LEDGER.json">M3 원장</a> · <a href="https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-n6-cloud-20261014/{M4_DIR}/M4_ORIGINAL_ACCEPTANCE_MATRIX.json">M4 원래 16개 행렬</a>.</p></body></html>
"""
    return bundle_text, status_html, {
        "schema": "MathScope.SyncStagingBuild/1",
        "result": "PASS_HOLD_PRESERVED",
        "sourcePins": {"m3LedgerGitBlobSha": m3_blob, "m4MatrixGitBlobSha": m4_blob},
        "m3": {"inheritedCompleted": 62, "total": 64, "open": ["N7-06", "N8-05"], "actualLastResolvedTau": None},
        "m4": {"statusCounts": {"ACCEPTED": 0, "PARTIAL": 14, "OPEN": 2}, "overallRelease": "HOLD"},
        "publisher": {"pageVersion": 118, "pageVersionHash": "9a0eebc5", "runtimeVersion": 8, "runtimeVersionHash": "abfa2a92"},
        "fullPageSourceMirroredInGit": False,
        "writes": [BUNDLE, STATUS_PAGE],
        "note": "Staging artifact generation only; this script does not publish to WebsitePublisher."
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="Regenerate the bundle and status page after validating source pins.")
    mode.add_argument("--check", action="store_true", help="Verify generated files match current source evidence (default).")
    parser.add_argument("--report", type=Path, help="Optional JSON report output.")
    args = parser.parse_args()
    try:
        bundle_text, status_html, report = build_outputs()
        expected = {BUNDLE: bundle_text, STATUS_PAGE: status_html}
        mismatches = []
        for relative, content in expected.items():
            path = ROOT / relative
            if args.write:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding="utf-8", newline="\n")
            elif not path.is_file() or path.read_text(encoding="utf-8") != content:
                mismatches.append(relative)
        report["mismatches"] = mismatches
        report["result"] = "PASS_HOLD_PRESERVED" if args.write or not mismatches else "FAIL_STAGING_ARTIFACT_DRIFT"
        serialized = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(serialized, encoding="utf-8")
        print(serialized, end="")
        return 0 if args.write or not mismatches else 1
    except Exception as exc:
        print(json.dumps({"result": "FAIL_STAGING_BUILD", "error": str(exc)}, ensure_ascii=False, indent=2))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
