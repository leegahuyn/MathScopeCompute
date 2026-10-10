#!/usr/bin/env python3
"""Check v3 with actual running bindings and recorded historical failures only.

No successful future receipt or 70/0 assessment is fabricated. Negative
controls mutate copies in memory and never replace the actual input template.
"""
from __future__ import annotations

import argparse
import copy
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import runpy
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(2**20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ROOT) or output.exists():
        parser.error("Use a new output path inside this v3 directory")
    module = runpy.run_path(str(ROOT / "build_handoff_addendum.py"), run_name="preparation_guard_reader")
    validate = module["validate"]
    data = json.loads((ROOT / "input-template.json").read_text())
    checks = []

    def check(name, value, detail=None):
        row = {"name": name, "pass": bool(value)}
        if detail is not None:
            row["detail"] = detail
        checks.append(row)

    actual = validate(copy.deepcopy(data))
    pinned_inputs_at_actual_validation = dict(module["PINNED_INPUTS"])
    check("actual preparation remains pending with nine concrete missing conditions", len(actual["blockers"]) == 9, actual["blockers"])
    check("actual preparation remains 69/1 and N106 incomplete", actual["current"]["separateDatedDeltaCounts"] == module["COUNTS69"] and actual["N106Completed"] is False and actual["N106IndependentAuditComplete"] is False)
    gate = data["gateExecution"]
    check("actual run job and head populated from real initial observations", (gate["runId"], gate["jobId"], gate["headCommit"]) == (38014602021, 114101981614, "55dacb898f8c204bf0c5925ea901d75d6c2d0f46"))
    check("final status conclusion artifact and evidence are genuinely null", all(gate[k] is None for k in ["actualJobStatus", "actualJobConclusion", "artifactId", "finalObservation", "independentAudit", "artifactZIP"]))
    check("future publication and new gate assessment are genuinely null", data["publicationFollowup"] is None and data["newAssessmentAfterComparator"] is None)
    check("actual terminal schema and frozen reviewed auditor selected", gate["expectedAuditSchema"] == module["TERMINAL_AUDIT_SCHEMA"] and gate["auditVerifier"]["sha256"] == module["TERMINAL_VERIFIER_SHA"])
    check("historical manifest and actual runtime binding retain different hashes", gate["auditInputsManifest"]["sha256"] == module["HISTORICAL_TRUST_SHA"] and gate["actualRunBinding"]["sha256"] == module["ACTUAL_RUN_BINDING_SHA"] and module["HISTORICAL_TRUST_SHA"] != module["ACTUAL_RUN_BINDING_SHA"])
    terminal = actual["terminalBinding"]
    check("actual binding records only initial running state", terminal["binding"]["N106CompletedAtBinding"] is False and terminal["initialJob"]["status"] == "in_progress" and terminal["initialJob"]["conclusion"] is None)
    historical_manifest = json.loads(Path(gate["auditInputsManifest"]["path"]).read_text())
    check("historical source commit intentionally differs from actual new commit", historical_manifest["mathscopeCommit"] == module["HISTORICAL_TRUST_COMMIT"] and historical_manifest["mathscopeCommit"] != gate["headCommit"])
    for name in historical_manifest["files"]:
        path = Path(gate["auditInputsManifest"]["path"]).parent / name
        check("historical trusted input actually hashed: " + name, pinned_inputs_at_actual_validation.get(str(path.resolve())) == historical_manifest["files"][name]["sha256"])
    for name, path in terminal["runtimeFiles"].items():
        item = terminal["binding"]["files"][name]
        check("actual runtime bytes SHA and Git blob bound: " + name, pinned_inputs_at_actual_validation.get(str(path)) == item["sha256"] and path.stat().st_size == item["bytes"] and module["git_blob_sha"](path.read_bytes()) == item["gitBlobSHA1"])
    check("initial binding metadata and no-artifact observation hashed", all(str((Path(gate["actualRunBinding"]["path"]).parent / terminal["binding"][key]["path"]).resolve()) in pinned_inputs_at_actual_validation for key in ["initialObservation", "runMetadata"]))

    def rejected(name, modified, expected):
        try:
            validate(modified)
        except (ValueError, KeyError, TypeError) as exc:
            check(name, expected in str(exc), str(exc))
        else:
            check(name, False, "Unexpectedly accepted")

    old = copy.deepcopy(data)
    old["gateExecution"]["runId"] = data["oldFailedExecution"]["runId"]
    rejected("actual cancelled historical run cannot substitute for a new gate run", old, "historical failed run")
    diagnostic = copy.deepcopy(data)
    diagnostic["gateExecution"]["runId"] = data["diagnosticHistory"][0]["runId"]
    rejected("actual successful transport diagnostic cannot become a gate run", diagnostic, "diagnostic run")
    unsupported_assessment = copy.deepcopy(data)
    unsupported_assessment["newAssessmentAfterComparator"] = data["assessment69_1"]
    rejected("an existing assessment cannot replace missing actual Comparator audit", unsupported_assessment, "missing actual Comparator audit")
    premature = copy.deepcopy(data)
    premature["state"] = "FINAL_ACTUAL_RESULTS_VERIFIED"
    premature["finalizedUTC"] = actual["old"]["observation"]["receivedUTC"]
    rejected("setting FINAL alone cannot bypass absent actual artifact or status", premature, "Contract type mismatch")
    bad_hash = copy.deepcopy(data)
    bad_hash["baseReport"]["sha256"] = "0" * 64
    rejected("negative-control base hash cannot replace the frozen PDF", bad_hash, "Input hash changed")
    wrong_binding = copy.deepcopy(data)
    wrong_binding["gateExecution"]["headCommit"] = data["publication3Frozen"]["mainCommit"]
    rejected("actual binding cannot be moved to the older release commit", wrong_binding, "does not match gate run/job/commit")
    wrong_job = copy.deepcopy(data)
    wrong_job["gateExecution"]["jobId"] = data["oldFailedExecution"]["jobId"]
    rejected("actual binding cannot be moved to the cancelled job", wrong_job, "does not match gate run/job/commit")
    old_audit = copy.deepcopy(data)
    old_audit["gateExecution"]["independentAudit"] = data["oldFailedExecution"]["independentAudit"]
    rejected("actual historical audit cannot substitute for terminal audit schema", old_audit, "not the selected protected Comparator audit schema")
    wrong_manifest = copy.deepcopy(data)
    wrong_manifest["gateExecution"]["auditInputsManifest"] = gate["actualRunBinding"]
    rejected("actual binding cannot replace historical TRUST manifest", wrong_manifest, "Historical TRUST manifest hash changed")
    wrong_runtime = copy.deepcopy(data)
    wrong_runtime["gateExecution"]["actualRunBinding"] = gate["auditInputsManifest"]
    rejected("historical TRUST manifest cannot replace actual binding", wrong_runtime, "Actual run-binding hash differs")
    missing_runtime = copy.deepcopy(data)
    missing_runtime["gateExecution"]["actualRunBinding"] = None
    missing_checked = validate(missing_runtime)
    check("missing runtime binding remains blocked", any("actualRunBinding is missing" in x for x in missing_checked["blockers"]) and missing_checked["N106Completed"] is False)
    legacy = copy.deepcopy(data)
    legacy["gateExecution"]["expectedAuditSchema"] = module["AUDIT_SCHEMA"]
    legacy["gateExecution"]["actualRunBinding"] = None
    legacy_checked = validate(legacy)
    check("legacy portable-schema preparation remains separate and incomplete", legacy_checked["terminalBinding"] is None and legacy_checked["N106Completed"] is False and bool(legacy_checked["blockers"]))
    try:
        module["require_terminal_pass_outcome"](actual["old"]["audit"])
    except ValueError as exc:
        check("actual cancelled outcome cannot satisfy terminal PASS acceptance", "actual completed/success" in str(exc), str(exc))
    else:
        check("actual cancelled outcome cannot satisfy terminal PASS acceptance", False)
    expanded = copy.deepcopy(data)
    expanded["renderingPlan"]["appendixPages"] = 3
    expanded["renderingPlan"]["mergedPagesWhenFinalized"] = 18
    checked18 = validate(expanded)
    check("18-page plan remains guarded while actual evidence is absent", bool(checked18["blockers"]) and checked18["N106Completed"] is False)

    forbidden = ROOT / "no-pdf-should-be-created.pdf"
    before_pdf_paths = set(ROOT.rglob("*.pdf"))
    completed = subprocess.run([sys.executable, "-B", str(ROOT / "build_handoff_addendum.py"),
                                "--input", str(ROOT / "input-template.json"), "--finalize",
                                "--output", str(forbidden)], text=True, capture_output=True)
    cli = json.loads(completed.stdout)
    check("actual finalize call rejected before PDF generation", completed.returncode == 2 and cli.get("finalizationRefused") is True and cli["PDFGenerated"] is False, {"exitCode": completed.returncode, "stdout": cli, "stderr": completed.stderr})
    check("no new PDF or appendix exists", set(ROOT.rglob("*.pdf")) == before_pdf_paths and not forbidden.exists() and not forbidden.with_name(forbidden.stem + "_Addendum.pdf").exists())
    check("validation imported no PDF renderer", not any(name == "reportlab" or name.startswith("reportlab.") for name in sys.modules))

    source_review_path = ROOT.parent / "ns-guard-repair-20261010/independent-terminal-auditor-review/reviewer-receipt-0001.json"
    source_review = json.loads(source_review_path.read_text())
    check("actual terminal-auditor independent source review is frozen", sha(source_review_path) == "ec0f7b9c1f7c153262cc52a97cedfd8a530d5f33288ebdde74c48dfefb8054e0")
    check("recorded independent 74 checks bind exact auditor and actual runtime", source_review["status"] == "PASS" and source_review["checksPassed"] == source_review["checksTotal"] == len(source_review["checks"]) == 74 and all(x["passed"] is True for x in source_review["checks"]) and source_review["auditorSHA256"] == module["TERMINAL_VERIFIER_SHA"] and source_review["actualRunBindingSHA256"] == module["ACTUAL_RUN_BINDING_SHA"] and source_review["N106Completed"] is False)

    frozen = json.loads((ROOT / "unchanged-inputs-before.json").read_text())
    for record in frozen["files"]:
        path = Path(record["path"])
        check("frozen prior input unchanged: " + record["group"] + "/" + path.name,
              path.stat().st_size == record["bytes"] and sha(path) == record["sha256"])
    check("frozen original PDF unchanged", sha(data["baseReport"]["path"]) == module["BASE_SHA"])
    source_files = [ROOT / name for name in ["build_handoff_addendum.py", "input-schema.json", "input-template.json", "verify_preparation.py", "README.md", "VALIDATION_CONTRACT.md", "unchanged-inputs-before.json"]]
    passed = sum(x["pass"] for x in checks)
    result = {"schema": "MathScope.FinalHandoffAddendumPreparation/3", "verifiedUTC": datetime.now(timezone.utc).isoformat(),
              "status": "PREPARATION_PASS" if passed == len(checks) else "PREPARATION_FAIL",
              "scope": "Input schema integration, historical TRUST and actual runtime source/observation bindings, and refusal of premature finalization. No actual terminal artifact is available here, so runtime-versus-ZIP validation and positive final-render acceptance have not been executed. No PDF layout QA, Comparator execution or N106 promotion.",
              "passed": passed, "total": len(checks), "checks": checks,
              "N106Completed": False, "currentCounts": module["COUNTS69"],
              "actualGateRunId": gate["runId"], "actualGateJobId": gate["jobId"], "actualGateHeadCommit": gate["headCommit"],
              "actualFinalStatusConclusionArtifactAuditAndAssessmentNull": True, "followupPublicationNull": True,
              "terminalVerifierSHA256": module["TERMINAL_VERIFIER_SHA"],
              "historicalTrustManifestSHA256": module["HISTORICAL_TRUST_SHA"],
              "actualRunBindingSHA256": module["ACTUAL_RUN_BINDING_SHA"],
              "historicalTrustedFileCount": 8, "actualRuntimeSourceFileCount": 8,
              "actualRuntimeSourceToArtifactCheckPerformed": False,
              "actualTerminalPASSReceiptConsumed": False,
              "inputHashesAtActualPreparationValidation": pinned_inputs_at_actual_validation,
              "independentSourceReview": {"path": str(source_review_path), "sha256": sha(source_review_path), "passed": 74, "total": 74, "N106Completed": False},
              "successfulFutureEvidenceFabricated": False, "PDFGenerated": False,
              "rendererVisualQAPerformed": False, "frozenPriorInputFileCount": len(frozen["files"]),
              "sourceFiles": [{"path": str(p), "sha256": sha(p)} for p in source_files]}
    with output.open("x", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(json.dumps({"status": result["status"], "passed": passed, "total": len(checks), "PDFGenerated": False, "N106Completed": False, "receipt": str(output), "failed": [x for x in checks if not x["pass"]]}, ensure_ascii=False, indent=2))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
