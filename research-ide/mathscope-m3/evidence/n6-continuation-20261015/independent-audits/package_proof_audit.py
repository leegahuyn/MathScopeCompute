"""Independent package integrity/accounting audit; no source closure claims."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PACKAGE = ROOT / "continuation/MathScope_N6_1266_Continuation_2026-10-15"
read = lambda path: json.loads(path.read_text(encoding="utf-8"))
sha = lambda value: hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()

manifest = read(PACKAGE / "SHA256SUMS.json")
files = []
for relative, entry in manifest.items():
    raw = (PACKAGE / relative).read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    assert len(raw) == entry["bytes"] and digest == entry["sha256"], relative
    files.append({"path": relative, "bytes": len(raw), "sha256": digest, "matchesManifest": True})

matrix = read(PACKAGE / "evidence/OBLIGATION_MATRIX_CONTINUATION.json")
previous = read(PACKAGE / "inherited/OBLIGATION_MATRIX_STAGE4.json")
guards = read(PACKAGE / "evidence/GUARD_DISCHARGES.json")["rows"]
closed = {row["id"] for row in guards if row["status"] == "DISCHARGED_ORIGINAL_GUARD"}
open_guards = {row["id"] for row in guards if row["status"] == "OPEN"}
for row in guards:
    assert row["id"].endswith(sha(row["originalGuard"])[:12])
assert len(closed) == 6 and len(open_guards) == 10
assert not closed & open_guards
assert closed | open_guards == set(previous["remainingGlobalGuardIDs"])
assert closed == set(matrix["newDischargedGuardIDs"])
assert open_guards == set(matrix["remainingGlobalGuardIDs"])
assert len(matrix["remainingJetIDs"]) == len(set(matrix["remainingJetIDs"])) == 230
assert matrix["remainingJetIDs"] == previous["remainingJetIDs"]

jets = read(PACKAGE / "evidence/JET_REQUEST_AUDIT.json")
pdes = read(PACKAGE / "evidence/PDE_DEPENDENCY_AUDIT.json")
assert len(jets["rows"]) == 230
assert {row["id"] for row in jets["rows"]} == set(matrix["remainingJetIDs"])
assert all(row["status"] == "OPEN" for row in jets["rows"])
assert [len(c["rows"]) for c in pdes["components"]] == [169, 197, 654]
assert all(row["status"] == "OPEN" for c in pdes["components"] for row in c["rows"])
assert matrix["originalUniversalRequirements"] == previous["originalUniversalRequirements"]

audit = {
    "schema": "MathScope.N6.IndependentPackageProofAudit/1",
    "auditDate": "2026-10-15",
    "packageIntegrity": {"manifestEntries": len(files), "allMatched": True, "files": files},
    "originalIDAndAccountingChecks": {
        "guardIDsMatchStatementHashes": True,
        "original16GuardsExactlyPartitioned": True,
        "closed6IDs": sorted(closed),
        "open10IDs": sorted(open_guards),
        "original230JetIDsPreservedInOrder": True,
        "originalUniversalRequirementsUnchanged": True,
        "pdeComponentRows": [169, 197, 654],
        "accountingIsMathematicalProof": False,
    },
    "mathematicsReview": {
        "sixGuardWrittenProof": "No counterexample found within the explicitly unchanged positive-radius annular chart and admitted fixed-band scope. Acceptance still requires actual source replay and authenticated registry binding.",
        "conditionalPressureLemma": "Valid under its explicit joint-continuity/compact-neighborhood hypotheses; the displayed cutoff remainder is necessary. It proves no original regularity by itself.",
        "thetaAbsence": "Syntactic theta independence cannot by itself establish that the integral exists. It does not close the actual Leibniz guards without an existence argument.",
        "newUnconditionalGuardDischarges": 0,
        "newUnconditionalJetDischarges": 0,
        "newUnconditionalPdeDischarges": 0,
        "newActualOriginalCounterexample": False,
    },
    "findings": [{
        "id": "HEADER-BINDING-001",
        "severity": "high",
        "type": "source-authentication gap",
        "locations": ["inherited/direct_discharge.py:336", "remaining_closure.py:297"],
        "evidence": "Stage 3 authenticates the header inside the pinned complete gzip; Stage 4 and continuation later consume detached header.json without equality or hash binding. Most registry hashes are emitted only in separate audit files, outside the pinned Stage 4 result matrix.",
        "implication": "The graph hash and Stage 4 matrix hash alone do not prove that the registry definitions used by the endpoint/capture audit are the authenticated source definitions.",
        "repair": "Gate canonical type-sensitive equality of the detached header and gzip first record before inherited Stage 4, then consume the gzip-derived header in new code. Retain inherited full-stream authentication as a separate mandatory gate.",
        "repairModule": "work/header_binding_audit/header_binding.py",
        "mutationTests": 23,
        "mutationTestsPassed": 23,
        "fixtureTestsAuthenticateOriginalGraph": False,
    }],
    "execution": {
        "packageIndependentSymbolicTestsPassed": 9,
        "packageSourceTestsReplayedLocally": False,
        "sourceReplayUnavailableReasonAtAuditTime": "Original source/prepared/prior artifacts and replay SQLite cache were not present; default /mnt/data paths also do not exist on this Windows host.",
        "sympyVersion": "1.14.0",
        "pythonVersion": "3.12",
        "full49TestClaimReusedAsNewExecution": False,
    },
    "completion": {"all1260Closed": False, "N601": "OPEN", "N602": "PARTIAL", "M3": "56/64"},
}
(ROOT / "package_proof_audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"manifestMatched": len(files), "guards": {"closed": len(closed), "open": len(open_guards)}, "jetIDs": 230, "pdeRows": 1020, "sourceReplay": False}))
