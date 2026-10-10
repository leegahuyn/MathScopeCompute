#!/usr/bin/env python3
"""Verify archived preparation records; execute no reviewer or producer.

Uses repository-relative byte versions. Uploaded PDFs remain reference-only.
Historical package-review observations are not reinterpreted as current state.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath

HERE = Path(__file__).resolve().parent
IDE = HERE.parents[3]
MAPPING_SHA = "c12d34fe851ca4a01e716267bb7d8761e70542da10c99d4c926cdc581287045d"
WRITER_SHA = "d471135f614fb3ec9d18020c7744433eb4646ad7793ba720a7f127fe9eceb314"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(relative):
    return json.loads((HERE / relative).read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.output and (args.output.exists() or not args.output.resolve().is_relative_to(HERE)):
        parser.error("Use a new receipt path within this directory")
    checks = []

    def check(name, ok, detail=None):
        row = {"name": name, "pass": bool(ok)}
        if detail is not None:
            row["detail"] = detail
        checks.append(row)

    mapping = read("source-mapping.json")
    check("exact preparation preservation mapping", sha(HERE / "source-mapping.json") == MAPPING_SHA)
    check("three requested directories copied completely", [(r["sourceGroup"],r["copiedFiles"]) for r in mapping["sourceGroups"]] == [("package-archive-review",10),("terminal-assessment-local-0001",4),("terminal-assessment-review-0001",18)] and mapping["requestedSourceGroupFilesOmitted"] == [])
    check("exact 32-file 648908-byte raw inventory", mapping["copiedFileCount"] == len(mapping["copiedFiles"]) == 32 and mapping["copiedBytes"] == sum(r["bytes"] for r in mapping["copiedFiles"]) == 648908)
    check("no missing or extra raw files", {str(p.relative_to(HERE)) for p in (HERE / "raw").rglob("*") if p.is_file()} == {r["destinationRelativePath"] for r in mapping["copiedFiles"]})
    for row in mapping["copiedFiles"]:
        path = HERE / row["destinationRelativePath"]
        check("original raw bytes and hash: " + row["destinationRelativePath"], path.stat().st_size == row["bytes"] and sha(path) == row["sha256"] and row["sourceAndDestinationBytesEqualWhenCopied"] is True)
    refs = mapping["referenceBindings"]
    pdf_refs = [r for r in refs if r["storage"] == "EXTERNAL_SUPPLIED_PDF_REFERENCE_ONLY"]
    check("209 references retain three external PDF identities", len(refs) == 209 and len(pdf_refs) == 8 and len(mapping["intentionallyUnbundledSuppliedPDFs"]) == 3 and len({(r["sourceAbsolutePath"], r["sha256"]) for r in pdf_refs}) == 3)
    check("uploaded PDFs are not copied or republished", not list(HERE.rglob("*.pdf")) and mapping["userPDFsCopiedOrRepublished"] is False and all(r["repositoryRelativePath"] is None and r["copiedOrRepublished"] is False for r in pdf_refs))
    for row in refs:
        if row["storage"] == "EXTERNAL_SUPPLIED_PDF_REFERENCE_ONLY":
            continue
        relative = PurePosixPath(row["repositoryRelativePath"])
        path = IDE / relative
        check("portable exact-version reference: " + row["context"], not relative.is_absolute() and ".." not in relative.parts and path.resolve().is_relative_to(IDE) and path.stat().st_size == row["bytes"] and sha(path) == row["sha256"])

    package_prefix = "raw/package-archive-review/"
    package = read(package_prefix + "reviewer-receipt-0001.json")
    snapshots = read(package_prefix + "source-snapshots.json")
    check("recorded package-selection review remains 37 of 37", package["status"] == "PASS" and package["checksPassed"] == package["checksTotal"] == len(package["checks"]) == 37 and all(r["pass"] is True for r in package["checks"]))
    check("package review source and input snapshot bytes bind", package["reviewerSHA256"] == sha(HERE / package_prefix / "review_package_archives.py") and package["sourceSnapshotManifestSHA256"] == sha(HERE / package_prefix / "source-snapshots.json"))
    check("package review did not build publish or certify N106", package["actualAllowedArchiveCount"] == 2 and package["actualAllowedArchiveBytes"] == 179412 and all(package[k] is False for k in ["mathematicalChecksExecuted","ComparatorExecuted","fullReleaseValidationExecuted","manifestRegenerated","packageBuilt","repositoryFilesModified","N106Completed"]))
    for i,row in enumerate(snapshots["inputs"]):
        path = HERE / package_prefix / row["snapshotRelativePath"]
        check("package review historical/current source snapshot: " + path.name, path.stat().st_size == row["bytes"] and sha(path) == row["sha256"])
    check("historical package observations are not rerun against a later manifest", mapping["historicalReviewRecordsNotReevaluatedAgainstLaterManifest"] is True)

    local_prefix = "raw/terminal-assessment-local-0001/"
    local = read(local_prefix + "receipt.json")
    negative = local["negativeExecution"]
    check("recorded actual writer preparation remains 5 of 5", local["status"] == "PREPARATION_PASS" and local["passed"] == local["total"] == len(local["checks"]) == 5 and all(r["pass"] is True for r in local["checks"]))
    check("actual tested writer source binds final reviewed SHA", local["writerSHA256"] == WRITER_SHA == sha(HERE / local_prefix / "writer-source-tested.py"))
    check("actual cancelled input was rejected with literal exit 1", negative["exitCode"] == 1 and "Actual terminal artifact audit did not pass" in (HERE / local_prefix / "cancelled-run.stderr.log").read_text() and (HERE / local_prefix / "cancelled-run.stdout.log").read_bytes() == b"")
    check("actual negative execution streams retain their SHA", all(sha(HERE / local_prefix / ("cancelled-run." + stream + ".log")) == negative[stream + "SHA256"] for stream in ["stdout","stderr"]))
    check("writer preparation issued no final assessment or positive fixture", all(local[k] is False for k in ["simulatedPositiveArtifactUsed","finalAssessmentIssued","N106CompletedByThisPreparation"]))
    for i,row in enumerate(local["historicalReferences"]):
        reference = next(r for r in refs if r["context"] == "local.historicalReferences." + str(i))
        check("literal historical criterion reference: " + str(i), reference["recordedPathUnchanged"] == row["historicalPath"] and reference["recordedResolvedPathUnchanged"] == row["resolvedPath"] and reference["sha256"] == row["sha256"] and reference["bytes"] == row["bytes"])
    for i,row in enumerate(local["scopeReferences"]):
        reference = next(r for r in refs if r["context"] == "local.scopeReferences." + str(i))
        check("literal scope reference: " + str(i), reference["recordedPathUnchanged"] == row["path"] and reference["sha256"] == row["sha256"])
    check("47 historical and 64 scope references retain exactly one historical alias", len(local["historicalReferences"]) == 47 and len(local["scopeReferences"]) == 64 and sum(r["resolvedFromHistoricalSnapshot"] for r in local["historicalReferences"]) == 1)
    for flag,key in [("--audit","actualAuditSHA256"),("--observation","actualObservationSHA256"),("--artifact","actualArchiveSHA256")]:
        reference = next(r for r in refs if r["context"] == "local.negativeExecution." + flag)
        command = negative["command"]
        check("actual negative command input: " + flag, reference["recordedPathUnchanged"] == command[command.index(flag)+1] and reference["sha256"] == negative[key])
    check("unavailable future review/output were not fabricated", len(mapping["recordedUnavailableCommandPaths"]) == 2 and all(r["existedWhenCopied"] is False and r["fileCreatedByPreservation"] is False and not list((HERE / "raw").rglob(Path(r["recordedPathUnchanged"]).name)) for r in mapping["recordedUnavailableCommandPaths"]))

    review_prefix = "raw/terminal-assessment-review-0001/"
    review = read(review_prefix + "source-review-receipt.json")
    check("source-only writer review remains 468 of 468", review["status"] == "PASS_SOURCE_REVIEW_ONLY" and review["passed"] == review["total"] == len(review["checks"]) == 468 and all(r["pass"] is True for r in review["checks"]))
    check("source-only reviewer source report and actual preparation receipt bind", review["reviewerSourceSHA256"] == sha(HERE / review_prefix / "review_source.py") and review["sourceReviewReportSHA256"] == sha(HERE / review_prefix / "SOURCE_REVIEW.md") and review["actualPreparationReceiptSHA256"] == sha(HERE / local_prefix / "receipt.json"))
    check("source-only review has no Comparator kernel or writer execution", review["newComparatorRuns"] == review["newKernelRuns"] == review["newAssessmentWriterInvocations"] == 0 and all(review[k] is False for k in ["simulatedPositiveArtifactUsed","actualTerminalCompletionClaimed","finalAssessmentIssued","existingEvidenceMutated"]))
    check("review preserves writer same-profile and prospective run identity", review["writerSHA256"] == WRITER_SHA and review["sameFinalProfileBinding"]["parameterExpressionSHA256"] == "e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152" and review["sameFinalProfileBinding"]["profileEvidenceSHA256"] == "ff3b1590aa49499417910962736fe2deb8e6088acd7d77e281fd8aba6807c206" and review["boundProspectiveProductionRun"] == {"runId":38014602021,"jobId":114101981614,"commit":"55dacb898f8c204bf0c5925ea901d75d6c2d0f46"})
    for name,digest in review["snapshotSHA256"].items():
        check("writer reviewer frozen input snapshot: " + name, sha(HERE / review_prefix / "inputs" / name) == digest)
    for path,row in review["inputs"].items():
        reference = next(r for r in refs if r["context"] == "review.inputs." + path)
        check("writer review original input reference: " + Path(path).name, reference["recordedPathUnchanged"] == path and reference["sha256"] == row["sha256"] and reference["bytes"] == row["bytes"])
    resolution = read(review_prefix + "inputs/reference-resolution.json")
    old_readme = (HERE / review_prefix / "inputs/N1_README_historical.md").read_bytes()
    historical = resolution["entries"][0]
    check("historical README alias uses exact contemporaneous Git bytes", len(resolution["entries"]) == 1 and historical["historicalBytesReproducedExactly"] is True and historical["historicalBytes"] == len(old_readme) and historical["historicalSHA256"] == hashlib.sha256(old_readme).hexdigest() and historical["sourceGitBlobSHA1"] == hashlib.sha1(b"blob " + str(len(old_readme)).encode() + b"\0" + old_readme).hexdigest() and old_readme == (HERE / review_prefix / "inputs/git-historical-readme.stdout").read_bytes())
    check("historical resolution preserves later README and assessments", all(resolution[k] is False for k in ["frozenAssessmentsRewritten","laterReadmeRewritten","gateStatusChanged"]))
    check("copy leaves N106 and final-assessment flags false", mapping["N106Completed"] is False and mapping["finalAssessmentIssuedByPreservation"] is False)
    passed = sum(r["pass"] for r in checks)
    receipt = {
        "schema":"MathScope.TerminalAssessmentPreparationPreservation/1",
        "verifiedUTC":datetime.now(timezone.utc).isoformat(),
        "status":"PRESERVATION_PASS" if passed == len(checks) else "PRESERVATION_FAIL",
        "passed":passed,"total":len(checks),"checks":checks,
        "sourceMappingSHA256":MAPPING_SHA,"verifierSHA256":sha(__file__),
        "copiedFileCount":32,"copiedBytes":648908,
        "portableReferenceBindings":len(refs)-len(pdf_refs),
        "externalPDFReferenceOccurrences":8,"uniqueUnbundledPDFs":3,
        "recordedPackageReview":{"passed":37,"total":37,"receiptSHA256":sha(HERE / package_prefix / "reviewer-receipt-0001.json")},
        "recordedWriterPreparation":{"passed":5,"total":5,"actualNegativeExitCode":1,"receiptSHA256":sha(HERE / local_prefix / "receipt.json")},
        "recordedWriterSourceReview":{"passed":468,"total":468,"status":"PASS_SOURCE_REVIEW_ONLY","receiptSHA256":sha(HERE / review_prefix / "source-review-receipt.json")},
        "writerSHA256":WRITER_SHA,"N106Completed":False,
        "finalAssessmentIssued":False,"userPDFsCopiedOrRepublished":False,
        "suppliedPDFsReadByThisVerifier":False,"reviewersReexecuted":False,
        "writerInvocations":0,"newComparatorExecutions":0,"newKernelExecutions":0,
        "manifestRegenerated":False,"packageBuilt":False,
        "scope":"Preservation and original-record consistency only. Read-only reviewers, source-only PASS and actual rejection are preserved without rerunning them or issuing a final assessment. PDF contents remain external; repository-relative references and exact captured versions preserve portability despite later manifest/source changes."
    }
    if args.output:
        with args.output.open("x",encoding="utf-8") as handle:
            json.dump(receipt,handle,ensure_ascii=False,indent=2);handle.write("\n")
    print(json.dumps({k:receipt[k] for k in ["status","passed","total","copiedFileCount","copiedBytes","portableReferenceBindings","uniqueUnbundledPDFs","N106Completed"]} | {"failed":[r for r in checks if not r["pass"]]},ensure_ascii=False,indent=2))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
