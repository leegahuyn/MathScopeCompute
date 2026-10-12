#!/usr/bin/env python3
"""Bind the observed heat source/Worker runs without promoting the analytic gates."""
import datetime
import hashlib
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[3]
M2 = ROOT / "research-ide/mathscope-m2"
EVIDENCE = M2 / "navier/research/evidence/heat-runtime-20261011"
BASE = "3bb5b122322e80b8a8fbb86526047813a9bb00ce"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(name):
    return json.loads((EVIDENCE / name).read_text())


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def ref(path):
    return {"path": str(path.relative_to(ROOT)), "sha256": sha(path)}


source = read("attempt1-source-runtime.json")
worker = read("attempt1-worker-runtime.json")
regression = read("adapter-regression-attempt1.json")
patch = read("page-patch-audit.json")
for observed in (source, worker):
    assert observed["pass"] and observed["exitCode"] == 0
    assert observed["sourceFilesUnchangedDuringRun"]
    assert observed["environment"]["version"] == "0.3.10"
    for name, expected in observed["runtimeSHA256"].items():
        assert sha(M2 / name) == expected, name
    assert observed["panelCount"] == 4
    assert observed["checkedSourcePathCells"] == 106
    assert observed["unboundDisplayLabels"] == 11
    assert not observed["allCellsSourceBound"]
    assert not observed["scope"]["wholeGNUMComplete"]
    assert not observed["scope"]["m3MayStart"]
for field in ("request", "mathematicalHash", "certificateSHA256", "graphSHA256", "panelRows"):
    assert source[field] == worker[field], field
assert worker["sourceWorkerParity"] and source["sourceCompilerParity"]
assert regression["pass"] and regression["exitCode"] == 0
assert regression["counts"] == {"tests": 20, "pass": 20, "fail": 0, "cancelled": 0, "skipped": 0}
for name, expected in regression["sourceSHA256"].items():
    assert sha(ROOT / name) == expected, name
assert sha(EVIDENCE / "adapter-regression-attempt1.tap") == regression["logSHA256"]
assert patch["builtRuntimeExact"] and patch["originalM1WorkerUnchanged"]
assert not patch["publicationExecutedByThisScript"]

observed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
summary = {
    "schema": "MathScope.M2.HeatRuntimeReleaseReview/1",
    "reviewedAt": observed_at,
    "baseCommit": BASE,
    "runtimeVersion": "0.3.10",
    "status": "SOURCE_AND_GENERATED_WORKER_VERIFIED_PUBLICATION_PENDING",
    "mathematicalHash": source["mathematicalHash"],
    "certificateSHA256": source["certificateSHA256"],
    "graphSHA256": source["graphSHA256"],
    "workerSHA256": sha(M2 / "m2.worker.js"),
    "bundleSHA256": sha(M2 / "workspace.bundle.js"),
    "sourceWorkerMathematicalAndCertificateParity": True,
    "independentInitialSourceCertificateParity": True,
    "adapterRegression": {"pass": 20, "fail": 0, "exitCode": 0},
    "executionExitCodes": {"source": 0, "worker": 0},
    "panelCount": 4,
    "sourcePathValueCellsCheckedPerExecution": 106,
    "unboundDisplayLabelsPerExecution": 11,
    "allCellsSourceBound": False,
    "allValueCellsSourceBound": True,
    "browserRunExecutedByThisReview": False,
    "livePageVersionVerifiedByThisReview": None,
    "scope": source["scope"],
    "observedEvidence": {name: ref(EVIDENCE / name) for name in (
        "attempt1-source-runtime.json", "attempt1-worker-runtime.json",
        "attempt1-source-replay.json", "attempt1-worker-replay.json",
        "adapter-regression-attempt1.json", "adapter-regression-attempt1.tap",
        "page-patch-audit.json")},
    "runtimeSources": source["runtimeSHA256"],
    "verificationLimit": "Receipt and byte comparison; no new analytic or Lean proof is inferred from execution counts or hashes.",
}
save(EVIDENCE / "runtime-release-review.json", summary)

gate_path = M2 / "navier/research/M2_COMPLETION_GATE.json"
gate = json.loads(subprocess.check_output([
    "git", "show", BASE + ":research-ide/mathscope-m2/navier/research/M2_COMPLETION_GATE.json"
], cwd=ROOT))
gate["generatedAt"] = observed_at
gate["assessmentRevision"] = "ACTUAL_HEAT_RUNTIME_0_3_10_SOURCE_AND_WORKER_VERIFIED"
gate["previousCheckpointCommit"] = BASE
gate["priorRuntimeVerification"] = {
    "verifiedAtCommit": BASE,
    "record": gate["currentRuntimeVerification"],
    "isCurrentRuntimeExecution": False,
}
gate["currentRuntimeVerification"] = {
    "version": "0.3.10",
    "workerSha256": summary["workerSHA256"],
    "bundleSha256": summary["bundleSHA256"],
    "executions": [ref(EVIDENCE / "attempt1-source-runtime.json"), ref(EVIDENCE / "attempt1-worker-runtime.json")],
    "sourceWorkerPairsAgree": True,
    "sourcePathValueCellsCheckedPerExecution": 106,
    "unboundDisplayLabelsPerExecution": 11,
    "allCellsSourceBound": False,
    "browserExecutionOfThisRuntimeVerified": False,
    "historicalPublicationRemainsVersion": 76,
}
gate["sourceRefs"]["heatRuntimeReview"] = ref(EVIDENCE / "runtime-release-review.json")
gate["sourceRefs"]["heatRuntimeSealGenerator"] = ref(pathlib.Path(__file__).resolve())
gate["sourceRefs"]["heatRuntimeDocumentation"] = ref(EVIDENCE / "HEAT_RUNTIME_RELEASE_KO.md")
gate["sourceRefs"]["heatPanelRenderer"] = ref(M2 / "visualization/actual-heat-panels.mjs")
gate["sourceRefs"]["heatRuntimeRunner"] = ref(M2 / "tests/heat-runtime-case.mjs")
gate["sourceRefs"]["heatRuntimeViewTests"] = ref(M2 / "tests/actual-heat-views.test.mjs")
for claim in gate["additionalClaims"]:
    if claim["id"] == "M2X-ACTUAL-HEAT-ENCLOSURE":
        claim["status"] = "SOURCE_AND_GENERATED_WORKER_VERIFIED_SCOPED"
        claim["runtimeReview"] = ref(EVIDENCE / "runtime-release-review.json")
        claim["browserExecutionVerified"] = False
gate["threeComponentSourceReview"]["initialNodeSourceOnly"] = gate["threeComponentSourceReview"].pop("nodeSourceOnly")
gate["threeComponentSourceReview"]["subsequentHeatRuntimeReview"] = ref(EVIDENCE / "runtime-release-review.json")
gate["publicationEvidenceScope"] = "The stored v76 publication/browser record is historical runtime 0.3.9. It is not evidence of a public 0.3.10 run."
gate["finalProvenanceReview"]["heatRuntimeCurrentFilesMatchObservedRuns"] = True
assert not gate["gate"]["userRequestedM2Complete"] and not gate["gate"]["m3MayStart"]
gate.pop("assessmentSHA256", None)
gate["assessmentSHA256"] = hashlib.sha256(json.dumps(gate, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
save(gate_path, gate)
print(json.dumps({"pass": True, "sourceWorkerParity": True, "panels": 4, "sourceCellsPerRun": 106, "displayLabelsPerRun": 11, "assessmentSHA256": gate["assessmentSHA256"], "wholeM2Complete": False, "m3MayStart": False}))
