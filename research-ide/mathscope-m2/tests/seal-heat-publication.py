#!/usr/bin/env python3
"""Bind the observed v77 public page and browser checks to the 0.3.10 checkpoint."""
import datetime
import hashlib
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[3]
M2 = ROOT / "research-ide/mathscope-m2"
E = M2 / "navier/research/evidence/heat-runtime-20261011"
BASE = "2304e3b688045eb41200100220a20d8d90cb3e8f"


def read(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path):
    return {"path": str(path.relative_to(ROOT)), "sha256": sha(path)}


browser = read(E / "browser-verification.json")
publication = read(E / "publication-verification.json")
runtime = read(E / "runtime-release-review.json")
for key in ("mathematicalHash", "certificateSHA256", "graphSHA256"):
    assert browser[key] == runtime[key]
assert browser["sourceValueCellsCompared"] == 106 and browser["displayLabels"] == 11
assert browser["sourceWorkerBrowserCertificateHashesAgree"]
assert browser["pageVersion"] == 77 and browser["versionHash"] == "7d4d3fb4"
assert not browser["allCellsSourceBound"] and not browser["m3MayStart"]
for name, expected in browser["evidence"].items():
    assert sha(E / name) == expected
for item in browser["screenshots"]:
    assert sha(E / item["file"]) == item["sha256"]
for name, expected in runtime["runtimeSources"].items():
    assert sha(M2 / name) == expected
assert publication["httpStatus"] == 200 and publication["exactCandidateBytes"]
assert publication["implementationCommit"] == BASE
gate = json.loads(subprocess.check_output([
    "git", "show", BASE + ":research-ide/mathscope-m2/navier/research/M2_COMPLETION_GATE.json"
], cwd=ROOT))
gate["generatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
gate["assessmentRevision"] = "ACTUAL_HEAT_RUNTIME_0_3_10_PUBLIC_V77_VERIFIED"
gate["previousCheckpointCommit"] = BASE
gate["heatRuntimeImplementationCommit"] = BASE
gate["priorPublication"] = {"verifiedAtCommit": BASE, "record": gate["publication"]}
gate["priorBrowserQA"] = {"verifiedAtCommit": BASE, "record": gate["browserQA"]}
gate["publication"] = publication
gate["browserQA"] = browser
gate["currentRuntimeVerification"]["browserExecutionOfThisRuntimeVerified"] = True
gate["currentRuntimeVerification"]["publicPageVersion"] = 77
gate["currentRuntimeVerification"].pop("historicalPublicationRemainsVersion", None)
gate["currentRuntimeVerification"]["browserReview"] = ref(E / "browser-verification.json")
gate["currentRuntimeVerification"]["scope"] = "New heat example source/Worker/browser; old examples retain their separately pinned execution records."
gate["publicationEvidenceScope"] = "v77 and the new heat example were observed with runtime 0.3.10; v75/v76 evidence remains separately pinned history."
for key, path in {
    "currentHeatPublication": E / "publication-verification.json",
    "currentHeatBrowserQA": E / "browser-verification.json",
    "heatRuntimeDocumentation": E / "HEAT_RUNTIME_RELEASE_KO.md",
    "currentScopeDocumentation": M2 / "navier/research/M2_COMPLETION_GATE_KO.md",
    "heatBrowserVerifier": M2 / "tests/verify-heat-browser.mjs",
    "heatPublicationSealGenerator": pathlib.Path(__file__).resolve(),
}.items():
    gate["sourceRefs"][key] = ref(path)
for claim in gate["additionalClaims"]:
    if claim["id"] == "M2X-ACTUAL-HEAT-ENCLOSURE":
        claim["status"] = "SOURCE_GENERATED_WORKER_AND_PUBLIC_BROWSER_VERIFIED_SCOPED"
        claim["browserExecutionVerified"] = True
        claim["browserReview"] = ref(E / "browser-verification.json")
assert not gate["gate"]["userRequestedM2Complete"] and not gate["gate"]["m3MayStart"]
gate.pop("assessmentSHA256", None)
gate["assessmentSHA256"] = hashlib.sha256(json.dumps(gate, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
(M2 / "navier/research/M2_COMPLETION_GATE.json").write_text(json.dumps(gate, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"pass": True, "publicVersion": 77, "runtimeVersion": "0.3.10", "assessmentSHA256": gate["assessmentSHA256"], "wholeM2Complete": False, "m3MayStart": False}))
