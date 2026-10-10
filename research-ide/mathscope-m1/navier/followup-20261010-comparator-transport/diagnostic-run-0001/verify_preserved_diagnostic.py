#!/usr/bin/env python3
"""Read-only preservation audit. Does not rerun either diagnostic reviewer.

Checks copied bytes, original ZIP members, existing receipt input bindings and
the exact raw/display log distinction. All PASS counts here concern archival
integrity; N1-06 remains incomplete.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

ROOT = Path(__file__).resolve().parent
PACKET = ROOT / "raw/remote-diagnostic-0001"
REVIEW = ROOT / "raw/independent-remote-review"
MAPPING_SHA = "e54f2a4dce44d12ac58759ac8ce012d327946c346bbbe3b37ab216146f878ce9"
ZIP_SHA = "b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba"
MAIN_AUDIT_SHA = "ee855668fcd77dbe4d2304454a743f8cb3732872437729eafbf8779a6b60f0f7"
REVIEW_SHA = "fafd7b37117fdf81fda6bdf6e9ce4b7328ea50bd998306775ccba4fd8c058cad"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    output = args.output.resolve() if args.output else None
    if output is not None and (not output.is_relative_to(ROOT) or output.exists()):
        parser.error("Write a new receipt only inside diagnostic-run-0001")
    checks = []

    def check(name, ok, detail=None):
        row = {"name": name, "pass": bool(ok)}
        if detail is not None:
            row["detail"] = detail
        checks.append(row)

    mapping_bytes = (ROOT / "source-mapping.json").read_bytes()
    mapping = json.loads(mapping_bytes)
    check("exact copy mapping", digest(mapping_bytes) == MAPPING_SHA)
    rows = mapping["copiedFiles"]
    expected_paths = [r["destinationRelativePath"] for r in rows]
    actual_paths = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "raw").rglob("*") if p.is_file())
    check("44 unique raw files and exact inventory", len(rows) == len(set(expected_paths)) == 44 and sorted(expected_paths) == actual_paths)
    check("435692 raw bytes accounted for without omission", sum(r["bytes"] for r in rows) == mapping["copiedBytes"] == 435692 and mapping["omissions"] == [])
    check("no raw symlinks", all(not p.is_symlink() for p in (ROOT / "raw").rglob("*")))
    for row in rows:
        rel = PurePosixPath(row["destinationRelativePath"])
        check("copied input bytes: " + str(rel), not rel.is_absolute() and ".." not in rel.parts and len((ROOT / rel).read_bytes()) == row["bytes"] and digest((ROOT / rel).read_bytes()) == row["sha256"])

    archive = PACKET / "original-guard-diagnostic-38013278865-1.zip"
    archive_bytes = archive.read_bytes()
    check("original ZIP size and SHA", len(archive_bytes) == 44015 and digest(archive_bytes) == ZIP_SHA)
    member_rows = []
    with zipfile.ZipFile(archive) as zipped:
        infos = zipped.infolist()
        names = [i.filename for i in infos]
        check("25 unique ZIP members", len(names) == len(set(names)) == 25)
        extracted = sorted(p.relative_to(PACKET / "extracted").as_posix() for p in (PACKET / "extracted").rglob("*") if p.is_file())
        check("all extracted members preserved", sorted(names) == extracted)
        for info in infos:
            data = zipped.read(info.filename)
            stored = PACKET / "extracted" / info.filename
            check("ZIP/extracted bytes: " + info.filename, data == stored.read_bytes())
            member_rows.append({"archiveMember": info.filename, "destinationRelativePath": stored.relative_to(ROOT).as_posix(), "bytes": len(data), "sha256": digest(data)})

    audit = load(PACKET / "actual-diagnostic-audit.json")
    reviewer = load(REVIEW / "reviewer-receipt-0001.json")
    check("primary actual audit immutable", digest((PACKET / "actual-diagnostic-audit.json").read_bytes()) == MAIN_AUDIT_SHA)
    check("independent reviewer immutable", digest((REVIEW / "reviewer-receipt-0001.json").read_bytes()) == REVIEW_SHA)
    check("primary 136 checks remain diagnostic-only", audit["status"] == "DIAGNOSTIC_EVIDENCE_PASS" and audit["checksPassed"] == audit["checksTotal"] == len(audit["checks"]) == 136 and all(c["passed"] for c in audit["checks"]) and audit["N106Completed"] is False and audit["actualProtectedComparatorExitCode"] is None)
    check("independent 135 checks remain diagnostic-only", reviewer["status"] == "PASS" and reviewer["checksPassed"] == reviewer["checksTotal"] == len(reviewer["checks"]) == 135 and all(c["passed"] for c in reviewer["checks"]) and reviewer["N106Completed"] is False and reviewer["originalComparatorExecutedByReviewer"] is False)
    for item in audit["inputs"]:
        data = (PACKET / item["path"]).read_bytes()
        check("primary recorded input binding: " + item["path"], len(data) == item["bytes"] and digest(data) == item["sha256"])
    source_map = {row["sourceAbsolutePath"]: row for row in rows}
    for absolute, expected in reviewer["inputBindings"].items():
        row = source_map.get(absolute)
        check("reviewer input resolved by preserved path mapping: " + absolute,
              row is not None and row["bytes"] == expected["bytes"] and row["sha256"] == expected["sha256"])

    response = load(PACKET / "job-log-response.json")
    canonical = (PACKET / "job-114097893399.raw.log").read_bytes()
    initial = (PACKET / "job-114097893399.log").read_bytes()
    log_receipt = load(PACKET / "job-log-byte-receipt.json")
    check("canonical raw job bytes equal actual API content", canonical == response["structuredContent"]["content"].encode("utf-8"))
    check("initial text log retains its single additional newline", initial == canonical + b"\n" and len(initial) == 28234 and len(canonical) == 28233)
    check("newline-difference receipt unchanged and accurate", log_receipt["initialCopyHasOneAdditionalNewline"] is True and log_receipt["rawResponseLogSHA256"] == digest(canonical) and log_receipt["initialTextCopySHA256"] == digest(initial))
    observation = load(PACKET / "observation-004.json")
    structured = [(entry["value"] if "value" in entry else entry)["structuredContent"] for entry in observation["results"]]
    job = next(j for b in structured for j in b.get("jobs", []) if j["id"] == 114097893399)
    artifact = next(a for b in structured for a in b.get("artifacts", []) if a["id"] == 11655127117)
    check("actual diagnostic job completed successfully", job["run_id"] == 38013278865 and job["status"] == "completed" and job["conclusion"] == "success")
    check("actual diagnostic archive API identity and SHA", artifact["workflow_run"]["id"] == 38013278865 and artifact["workflow_run"]["head_sha"] == "d0543504ab3d923490f2e3cf94c968f3739558d8" and artifact["size_in_bytes"] == len(archive_bytes) and artifact["digest"] == "sha256:" + ZIP_SHA)
    result = load(PACKET / "extracted/result.json")
    check("raw producer says no original Comparator or Lean execution", result["N106Completed"] is False and result["originalComparatorExecuted"] is False and result["originalLeanKernelExecuted"] is False)
    check("five observed cases retained", len(result["cases"]) == len(audit["actualCaseSummaries"]) == len(reviewer["observedCases"]) == 5)
    for row in mapping["oldRunFilesCheckedBeforeAndAfter"]:
        path = ROOT.parent / "old-run-0001" / row["pathRelativeToOldRun"]
        check("old failed packet unchanged: " + row["pathRelativeToOldRun"], len(path.read_bytes()) == row["bytes"] and digest(path.read_bytes()) == row["sha256"])

    passed = sum(c["pass"] for c in checks)
    receipt = {"schema": "MathScope.GuardDiagnosticPreservationAudit/1", "verifiedUTC": datetime.now(timezone.utc).isoformat(),
               "status": "PRESERVATION_PASS" if passed == len(checks) else "PRESERVATION_FAIL",
               "scope": "One independent archive/copy/log/receipt-binding verification only. Existing 136/135 diagnostic audits were not rerun; no probe, protected Comparator, nanoda or Lean was executed.",
               "sourceMappingPath": "source-mapping.json", "sourceMappingSHA256": digest(mapping_bytes),
               "verifierPath": Path(__file__).name, "verifierSHA256": digest(Path(__file__).read_bytes()),
               "copiedFileCount": len(rows), "copiedBytes": sum(r["bytes"] for r in rows),
               "sourceToDestinationMapping": rows, "archiveMembers": member_rows,
               "archiveSHA256": ZIP_SHA, "archiveBytes": len(archive_bytes),
               "runId": 38013278865, "jobId": 114097893399, "artifactId": 11655127117,
               "actualJobConclusion": job["conclusion"], "actualObservationUTC": observation["receivedUTC"],
               "primaryDiagnosticAudit": {"path": "raw/remote-diagnostic-0001/actual-diagnostic-audit.json", "sha256": MAIN_AUDIT_SHA, "checksPassed": 136, "checksTotal": 136, "status": audit["status"]},
               "independentDiagnosticReview": {"path": "raw/independent-remote-review/reviewer-receipt-0001.json", "sha256": REVIEW_SHA, "checksPassed": 135, "checksTotal": 135, "status": reviewer["status"]},
               "canonicalJobLog": "raw/remote-diagnostic-0001/job-114097893399.raw.log",
               "displayCopyHasOneAdditionalNewline": True,
               "allReviewerInputsPreserved": True, "reviewerExternalSourceInputCount": 5,
               "old67FilesUnchanged": True, "N106Completed": False,
               "actualProtectedComparatorExitCode": None, "currentCounts": {"PASS": 69, "PARTIAL": 1, "BLOCKED": 0},
               "allOriginalNineConditionsComplete": False, "allOriginal70ConditionsComplete": False,
               "passed": passed, "total": len(checks), "checks": checks}
    if output:
        with output.open("x", encoding="utf-8") as handle:
            json.dump(receipt, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
    print(json.dumps({"status": receipt["status"], "passed": passed, "total": len(checks), "rawFiles": len(rows), "ZIPMembers": len(member_rows), "N106Completed": False, "receipt": str(output) if output else None, "failedChecks": [c for c in checks if not c["pass"]]}, ensure_ascii=False, indent=2))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
