#!/usr/bin/env python3
"""Summarize recorded execution only; never reconstruct or rerun private state."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def read(name):
    return json.loads((ROOT / name).read_text())

def pin(name):
    data = (ROOT / name).read_bytes()
    return {"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}

receipt = read("ACTUAL_FINITE_CYCLE_RECEIPT.json")
process = read("ACTUAL_PROCESS.json")
integrity = read("ORIGINAL_INPUT_INTEGRITY.json")
boundary = read("PRIVATE_BOUNDARY_RESULT.json")
stage_order = ["post-forced", "signed", "temporal", "fresh-five"]
stages = []
for name in stage_order:
    state = receipt.get("stages", {}).get(name)
    event = next((e for e in receipt["events"] if e.get("stage") ==
                  "finite-cycle-" + name + "-latest-pressure-and-actual-all3-comparison"), {})
    if state is None:
        stages.append({"name": name, "executedAndPrivatelyRechecked": False})
        continue
    comparisons = state["comparison"]
    stages.append({
        "name": name, "executedAndPrivatelyRechecked": True,
        "nodeCount": state["nodeCount"], "actualVelocity": state["actualVelocity"],
        "actualPressure": state["actualPressure"], "latestMeanPressure": state["latestMeanPressure"],
        "allThreeExactComparisonsPass": len(comparisons) == 3 and all(c["pass"] for c in comparisons),
        "numeratorMonomials": [c["numeratorMonomials"] for c in comparisons],
        "directRoots": [c["direct"] for c in comparisons],
        "decomposedRoots": [c["decomposed"] for c in comparisons],
        "sourceDenominatorOperands": sorted(set(n for c in comparisons for n in c["denominatorOperands"])),
        "sourceNonzeroDenominatorPremisesStillRequired": any(c["nonzeroSourceDenominatorProofRequired"] for c in comparisons),
        "negativeControlsRejected": event.get("negativeControls"),
        "pressureA0HistoricalStageCount": len(state["ledger"]["pressureA0"]),
        "temporalFaxHistoricalStageCount": len(state["ledger"]["temporalFax"]),
        "sourceBinding": state["sourceBinding"], "correction": state["correction"]
    })

module = "source/research-ide/mathscope-m3/navier/source-finite-cycle-continuation.mjs"
module_pin = pin(module)
complete = process["exitCode"] == 0 and receipt["allMandatoryFiniteStagesConstructed"] and all(
    s.get("allThreeExactComparisonsPass", False) for s in stages)
result = {
    "schema": "MathScope.N602.ActualFiniteCycleEvidenceSummary/1",
    "actualFiniteCycleExecutedSuccessfully": complete,
    "executionStatus": receipt["status"], "process": process,
    "runtime": receipt["runtime"], "resourceLimits": receipt["resourceLimits"],
    "loadedModuleHashMatchesCurrentBytes": receipt["loadedSuccessorModuleSha256"] == module_pin["sha256"],
    "module": module_pin,
    "originalDependencyByteChecks": {"count": integrity["originalFiles"], "allMatched": integrity["allMatched"],
                                    "archiveSHA256": integrity["archiveSHA256"]},
    "privateBoundaryNegativeChecksPassed": boundary["passed"],
    "stages": stages,
    "scope": {
        "singleMandatoryCanonicalFiniteCycle": True,
        "serializedClonesAccepted": False, "privateSealsBypassed": False,
        "originalWindowsOr1260Rerun": False,
        "infiniteLiteralExecutionRequired": False,
        "rationalIdentityAloneProvesSourceDomain": False,
        "uniformAllOrderNumericalClassBoundsClaimed": False,
        "N706OrN805Discharged": False,
        "acceptanceDecision": "Separate independent review and parent ledger decision; receipt originalN602Complete remains false by design."
    },
    "evidencePins": [pin(n) for n in ["ACTUAL_FINITE_CYCLE_RECEIPT.json", "ACTUAL_PROCESS.json",
        "SOURCE_PROVENANCE.json", "ORIGINAL_INPUT_INTEGRITY.json", "PRIVATE_BOUNDARY_RESULT.json",
        "run_actual_finite_cycle.mjs", "run_actual_finite_cycle.py", "logs/actual.stdout.log",
        "logs/actual.stderr.log", "DOMAIN_AND_SOURCE_SCOPE.md", "NONZERO_MEAN_SIGMA_CHART_LAW.md"]]
}
(ROOT / "FINITE_CYCLE_RESULT.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
lines = ["# Actual finite cycle execution", "", f"Execution status: **{receipt['status']}**. Process exit {process['exitCode']}; elapsed {process['elapsedSeconds']} seconds.", "",
         "| Actual poststep | All 3 exact numerators | Stale pressure / omitted quadratic / omitted flat controls |",
         "|---|---|---|"]
for s in stages:
    values = s.get("numeratorMonomials", "not recorded")
    controls = s.get("negativeControlsRejected")
    controls_text = "not a new correction control" if controls is None and s["name"] == "post-forced" else str(controls)
    lines.append(f"| {s['name']} | {values} | {controls_text} |")
lines.extend(["", "The implementation starts from the genuine original forced private state, retains its nonzero mean and all angular modes, and reconstructs the full current pressure after each finite correction. Temporal inversion uses the exact limit and actual source-bound finite C1 tail checks. Fresh-five targets use the updated temporal pressure; its executed code checks three actual nonlinear expansions and retains the new remainder defects.", "",
              f"Original dependency bytes: {integrity['originalFiles']} checked; all matched = {integrity['allMatched']}. Private-boundary negative checks passed: {boundary['passed']}/{len(boundary['checks'])}. Loaded successor module hash matches preserved bytes = {result['loadedModuleHashMatchesCurrentBytes']}.", "",
              "Each rational identity still uses the authenticated original nonzero-denominator and support-domain premises, explained in DOMAIN_AND_SOURCE_SCOPE.md. The receipts do not export a full scalar graph; root numbers belong to this live execution and are not equated to historical graph IDs. Historical A0 entries are separate stage remainders, not a cumulative force sum. Existing pulse and Fax terms remain in the whole-field residual.", "",
              "This is one mandatory finite cycle. The original Windows test launch and separate 1,260 initial units were not rerun. No literal infinite execution is imposed. N6-03 uniform numerical bounds, N7-06 and N8-05 remain separate. Final N6-02 acceptance belongs to independent review and the parent ledger; the low-level receipt does not grant its own acceptance.", ""])
(ROOT / "FINITE_CYCLE_RESULT.md").write_text("\n".join(lines))
print(json.dumps({"actualFiniteCycleExecutedSuccessfully": complete, "stageCount": len(stages),
                  "moduleHashMatches": result["loadedModuleHashMatchesCurrentBytes"]}))
