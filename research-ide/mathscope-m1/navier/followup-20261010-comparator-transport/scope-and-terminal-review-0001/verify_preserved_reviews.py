#!/usr/bin/env python3
"""Verify preserved reviews and repository-relative references without reruns.

Supplied PDFs remain external references and are not read by default. This
checker does not import or execute a preserved reviewer, auditor or producer.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath

HERE = Path(__file__).resolve().parent
IDE = HERE.parents[3]
MAPPING_SHA = "6b27c850c215191d75887af4f417c116be4d1215f2dbd061729125a6691234dc"
V1_SHA = "83dcdd2824792cb8cc4eb73045ff3aa22bf25589a0eeb84049e78bff195860b7"
V2_SHA = "81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef"
BINDING_SHA = "5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(relative):
    return json.loads((HERE / relative).read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.output and (args.output.exists() or not args.output.resolve().is_relative_to(HERE)):
        parser.error("Choose a new receipt path inside this directory")
    checks = []

    def check(name, ok, detail=None):
        row = {"name": name, "pass": bool(ok)}
        if detail is not None:
            row["detail"] = detail
        checks.append(row)

    mapping = read("source-mapping.json")
    check("exact preserved source mapping", sha(HERE / "source-mapping.json") == MAPPING_SHA)
    check("25 raw files in four complete requested source groups", mapping["copiedFileCount"] == len(mapping["copiedFiles"]) == 25 and [(x["sourceGroup"], x["copiedFiles"]) for x in mapping["sourceGroups"]] == [("theorem46-scope-review",4),("independent-terminal-auditor-review",4),("terminal-auditor-negative-controls-0001",9),("terminal-auditor-negative-controls-0002",8)] and mapping["requestedSourceGroupFilesOmitted"] == [])
    check("raw byte inventory is exactly 455419", mapping["copiedBytes"] == sum(x["bytes"] for x in mapping["copiedFiles"]) == 455419)
    check("raw inventory has no missing or additional files", {str(p.relative_to(HERE)) for p in (HERE / "raw").rglob("*") if p.is_file()} == {x["destinationRelativePath"] for x in mapping["copiedFiles"]})
    for row in mapping["copiedFiles"]:
        path = HERE / row["destinationRelativePath"]
        check("copied file bytes and hash: " + row["destinationRelativePath"], path.stat().st_size == row["bytes"] and sha(path) == row["sha256"] and row["sourceAndDestinationBytesEqualWhenCopied"] is True)
    refs = mapping["referenceBindings"]
    external = mapping["intentionallyUnbundledSuppliedPDFs"]
    check("three supplied PDFs deliberately remain external", len(external) == 3 and external == [x for x in refs if x["storage"] == "EXTERNAL_SUPPLIED_PDF_REFERENCE_ONLY"] and all(x["repositoryRelativePath"] is None and x["copiedOrRepublished"] is False and x["checkedAgainstAvailableOriginalWhenMapped"] is True for x in external))
    check("no uploaded PDF bytes copied into packet", not list(HERE.rglob("*.pdf")) and mapping["userPDFsCopiedOrRepublished"] is False)
    check("121 original-path and SHA-versioned references preserved", len(refs) == 121 and mapping["referencePathKeyIncludesSHA256"] is True)
    for row in refs:
        if row["storage"] == "EXTERNAL_SUPPLIED_PDF_REFERENCE_ONLY":
            continue
        relative = PurePosixPath(row["repositoryRelativePath"])
        path = IDE / relative
        check("portable source reference: " + row["context"], not relative.is_absolute() and ".." not in relative.parts and path.resolve().is_relative_to(IDE) and path.stat().st_size == row["bytes"] and sha(path) == row["sha256"])

    scope_prefix = "raw/theorem46-scope-review/"
    scope = read(scope_prefix + "reviewer-receipt-0001.json")
    clause = read(scope_prefix + "theorem46-clause-map.json")
    check("recorded source-and-scope review retains 428 of 428", scope["status"] == "PASS_SOURCE_AND_SCOPE_MAPPING_REVIEW" and scope["passed"] == scope["total"] == len(scope["checks"]) == 428 and all(x["pass"] is True for x in scope["checks"]))
    check("scope reviewer source and two outputs bind preserved bytes", scope["reviewerSourceSHA256"] == sha(HERE / scope_prefix / "write_scope_review.py") and all(sha(HERE / scope_prefix / name) == digest for name,digest in scope["outputSHA256"].items()))
    check("scope review executed no new proof kernel or Comparator", scope["mathematicalProofsReexecuted"] is False and scope["newKernelExecutions"] == scope["newComparatorExecutions"] == 0 and scope["currentN106CompletedClaimed"] is False and scope["existingGateVerdictsChanged"] is False and scope["entireNewProfileLeanFormalized"] is False)
    check("six-clause map retains actual same-profile identity", len(clause["clauses"]) == 6 and clause["sameFinalProfileBinding"] == scope["sameFinalProfileBinding"] and clause["sameFinalProfileBinding"]["parameterExpressionSHA256"] == "e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152" and clause["sameFinalProfileBinding"]["profileEvidenceSHA256"] == "ff3b1590aa49499417910962736fe2deb8e6088acd7d77e281fd8aba6807c206")
    check("future scope recommendation does not change current flags", clause["flagInterpretation"]["currentValueChangedByThisReview"] is False and clause["flagInterpretation"]["existingAssessmentValue"] is False and clause["flagInterpretation"]["entireNewProfileLeanFormalized"] is False and clause["executionBoundary"]["currentTerminalCompletionClaimed"] is False)
    for key, item in clause["sourceCatalog"].items():
        reference = next((r for r in refs if r["context"] == "theorem46.sourceCatalog." + key), None)
        check("scope catalog remains literal: " + key, reference is not None and reference["recordedPathUnchanged"] == item["path"] and reference["sha256"] == item["sha256"] and reference["bytes"] == item["bytes"] and scope["inputSourceHashesUnchanged"][reference["sourceAbsolutePath"]] == item["sha256"])

    review_prefix = "raw/independent-terminal-auditor-review/"
    review = read(review_prefix + "reviewer-receipt-0001.json")
    check("recorded independent terminal source review retains 74 of 74", review["status"] == "PASS" and review["checksPassed"] == review["checksTotal"] == len(review["checks"]) == 74 and all(x["passed"] is True for x in review["checks"]))
    check("review binds the actual frozen auditor and runtime binding", review["auditorSHA256"] == V2_SHA and review["actualRunBindingSHA256"] == BINDING_SHA and review["reviewerExecutedComparator"] is False and review["reviewerReranNegativeControls"] is False and review["N106Completed"] is False)
    for path, item in review["inputBindings"].items():
        reference = next((r for r in refs if r["context"] == "terminalReview.inputBindings." + path), None)
        check("source review recorded input mapping: " + Path(path).name, reference is not None and reference["recordedPathUnchanged"] == path and reference["sha256"] == item["sha256"] and reference["bytes"] == item["bytes"])
    reconstruction = read(review_prefix + "v1-byte-reconstruction.json")
    preservation = read("raw/terminal-auditor-negative-controls-0001/source-byte-preservation.json")
    check("v1 reconstructed bytes retain their precise provenance", reconstruction["sourceV2SHA256"] == V2_SHA and reconstruction["reconstructedV1SHA256"] == V1_SHA and reconstruction["originalSourceModified"] is False and "not described as a pre-execution snapshot" in reconstruction["scope"] and sha(HERE / review_prefix / "reconstructed-v1.py") == V1_SHA and preservation["sha256"] == V1_SHA and "Exact inverse" in preservation["method"])

    negative_counts = []
    for attempt, source_sha in [("0001", V1_SHA), ("0002", V2_SHA)]:
        prefix = "raw/terminal-auditor-negative-controls-" + attempt + "/"
        receipt = read(prefix + "receipt.json")
        check("negative control " + attempt + " source bytes preserved", sha(HERE / prefix / "auditor-source-tested.py") == source_sha)
        check("negative control " + attempt + " retains two actual rejection cases", receipt["status"] == "PASS" and len(receipt["cases"]) == 2)
        for case in receipt["cases"]:
            name = case["name"]
            audit = read(prefix + name + ".audit.json")
            check(attempt + " recorded rejection and exact audit bytes: " + name, case["exitCode"] == 1 and case["expectedRejection"] is True and case["status"] == audit["status"] == "FAIL_OR_INCOMPLETE" and case["N106Completed"] is audit["N106Completed"] is False and sha(HERE / prefix / (name + ".audit.json")) == case["auditSHA256"])
            check(attempt + " recorded stdout stderr hashes: " + name, all(sha(HERE / prefix / (name + "." + stream + ".log")) == case[stream + "SHA256"] for stream in ["stdout", "stderr"]))
            check(attempt + " actual negative audit bindings: " + name, audit["verifierSHA256"] == case["inputs"][0]["sha256"] == source_sha and audit["archiveSHA256"] == case["inputs"][1]["sha256"] and audit["githubObservationSHA256"] == case["inputs"][2]["sha256"] and audit["actualRunBindingSHA256"] == BINDING_SHA and audit["newComparatorRunPerformedByAuditor"] is False)
            check(attempt + " failure counts remain literal: " + name, audit["passed"] == case["checksPassed"] == sum(x["pass"] for x in audit["checks"]) and audit["total"] == case["checksTotal"] == len(audit["checks"]) and audit["passed"] < audit["total"])
            for item in case["inputs"]:
                wanted_context = "terminal-auditor-negative-controls-" + attempt + "." + name + ".input"
                matching = [r for r in refs if r["context"] == wanted_context and r["recordedPathUnchanged"] == item["path"] and r["sha256"] == item["sha256"]]
                check(attempt + " SHA-versioned actual input resolves: " + name + "/" + Path(item["path"]).name, len(matching) == 1)
            negative_counts.append({"attempt": attempt, "case": name, "exitCode": 1, "passed": audit["passed"], "total": audit["total"], "N106Completed": False})
        if attempt == "0002":
            check("v2 control receipt preserves its prior receipt and source", receipt["sourceSHA256"] == V2_SHA and receipt["priorControlReceiptSHA256"] == sha(HERE / "raw/terminal-auditor-negative-controls-0001/receipt.json"))
    check("old and new source hashes never alias by path alone", {r["sha256"] for r in refs if r["sourceAbsolutePath"].endswith("/verify_n106_terminal_artifact.py")} == {V1_SHA, V2_SHA})
    check("all preservation completion and mutation flags stay false", mapping["N106Completed"] is False and mapping["existingGateVerdictsChanged"] is False)
    passed = sum(x["pass"] for x in checks)
    receipt = {
        "schema": "MathScope.ScopeAndTerminalReviewPreservation/1",
        "verifiedUTC": datetime.now(timezone.utc).isoformat(),
        "status": "PRESERVATION_PASS" if passed == len(checks) else "PRESERVATION_FAIL",
        "passed": passed, "total": len(checks), "checks": checks,
        "sourceMappingSHA256": MAPPING_SHA, "verifierSHA256": sha(__file__),
        "copiedFiles": 25, "copiedBytes": 455419,
        "portableReferenceBindings": len(refs) - len(external),
        "unbundledSuppliedPDFReferences": len(external), "userPDFsCopiedOrRepublished": False,
        "suppliedPDFsReadByThisVerifier": False,
        "recordedScopeReview": {"passed": 428, "total": 428, "receiptSHA256": sha(HERE / scope_prefix / "reviewer-receipt-0001.json")},
        "recordedTerminalSourceReview": {"passed": 74, "total": 74, "receiptSHA256": sha(HERE / review_prefix / "reviewer-receipt-0001.json")},
        "recordedActualNegativeControlAudits": negative_counts,
        "N106Completed": False, "existingGateVerdictsChanged": False,
        "preservedReviewersExecuted": False, "negativeControlsRerun": False,
        "newKernelExecutions": 0, "newComparatorExecutions": 0,
        "scope": "Portable preservation and original-record consistency only. Repository-relative dependencies use the existing full repository and preserved old/diagnostic packets; uploaded PDFs remain unchanged path/hash references and are intentionally not distributed. No mathematical/source review or negative control is rerun."
    }
    if args.output:
        with args.output.open("x", encoding="utf-8") as handle:
            json.dump(receipt, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
    print(json.dumps({k: receipt[k] for k in ["status", "passed", "total", "copiedFiles", "copiedBytes", "portableReferenceBindings", "unbundledSuppliedPDFReferences", "N106Completed"]} | {"failed": [x for x in checks if not x["pass"]]}, ensure_ascii=False, indent=2))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
