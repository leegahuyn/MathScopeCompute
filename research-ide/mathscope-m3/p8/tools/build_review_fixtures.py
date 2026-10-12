"""Summarize immutable recorded fixtures; do not run or promote mathematics.

All inputs are read with git show at one full commit, including sparse files.
Use --source-commit to deliberately advance the snapshot. Ordinary regeneration
and --check reuse the snapshot's pinned commit, avoiding self-referential HEADs.
"""
from pathlib import Path
import argparse
import gzip
import hashlib
import json
import re
import subprocess

P8 = Path(__file__).resolve().parents[1]
REPO = P8.parents[2]
OUTPUT = P8 / "review-fixture-evidence.json"
REPOSITORY = "https://github.com/leegahuyn/MathScopeCompute"
M1 = "research-ide/mathscope-m1/arithmetic/"
M2 = "research-ide/mathscope-m2/arithmetic/"
RESUME = "research-ide/mathscope-m3/evidence/resume-20261012/"
RECORDED = "EXISTING_EXECUTION_RECORD_NOT_FRESHLY_REEXECUTED_BY_SUMMARY"


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def sha(value):
    return hashlib.sha256(value if isinstance(value, bytes) else canonical(value)).hexdigest()


def counts(values, selection):
    """Only literal bools are outcomes; missing/null are never passes."""
    values = list(values)
    return {"total": len(values), "passed": sum(v is True for v in values),
            "failed": sum(v is False for v in values),
            "unresolved": sum(v is not True and v is not False for v in values),
            "selection": selection}


class Snapshot:
    def __init__(self, commit):
        if not re.fullmatch(r"[0-9a-f]{40}", commit):
            raise ValueError("Use a full immutable commit SHA")
        self.commit = commit
        self.raw_cache = {}

    def raw(self, path):
        if path not in self.raw_cache:
            self.raw_cache[path] = subprocess.check_output(["git", "show", self.commit + ":" + path], cwd=REPO)
        return self.raw_cache[path]

    def data(self, path):
        raw = self.raw(path)
        return json.loads(gzip.decompress(raw) if path.endswith(".gz") else raw)

    def source(self, path, field_path=None):
        raw = self.raw(path)
        value = {"commit": self.commit, "path": path, "fileSHA256": sha(raw),
                 "fileBytes": len(raw), "gitHubURL": REPOSITORY + "/blob/" + self.commit + "/" + path}
        if path.endswith(".gz"):
            value["decodedJSONSHA256"] = sha(gzip.decompress(raw))
        if field_path:
            value["fieldPath"] = field_path
        return value

    def verify(self, path, expected):
        if sha(self.raw(path)) != expected:
            raise ValueError("Recorded file hash mismatch: " + path)


def fixture(snap, path, identifier, status, **extra):
    return {"id": identifier, "status": status, "source": snap.source(path),
            "executionScope": RECORDED, "freshExecutionPerformed": False,
            "proofStatusPromoted": False, **extra}


def m1_group(snap):
    base = M1 + "evidence/"
    path = base + "validation-summary.json"
    summary = snap.data(path)
    node = summary["node"]
    snap.verify(M1 + node["log"], node["logSha256"])
    node_counts = {"total": node["tests"], "passed": node["pass"], "failed": node["fail"],
                   "unresolved": node["tests"] - node["pass"] - node["fail"],
                   "selection": "Recorded node test summary; log SHA256 checked"}
    fixtures = [fixture(snap, path, "m1-node-arithmetic", summary["status"], schema=summary["schema"],
                        checks=node_counts, checkedAt=summary["checkedAt"], scope=summary["scopeBoundary"],
                        logSource=snap.source(M1 + node["log"]))]
    independent_path = base + "independent-validation.json"
    snap.verify(independent_path, summary["independent"]["reportSha256"])
    independent = snap.data(independent_path)
    fixture_path = base + "independent-fixtures.json"
    snap.verify(fixture_path, independent["fixtureSha256"])
    source_fixtures = snap.data(fixture_path)
    fixtures.append(fixture(snap, independent_path, "m1-independent-validation", independent["status"],
                            schema=independent["schema"], checks=counts((x.get("pass") for x in independent["checks"]), "checks[].pass"),
                            scope=independent["scope"], fixtureSource=snap.source(fixture_path),
                            recordedComplexBounds=[x["D"] for x in source_fixtures["complexes"]],
                            methods=independent["methods"]))
    lean_path = base + "lean-audit.json"
    snap.verify(lean_path, summary["lean"]["auditSha256"])
    lean = snap.data(lean_path)
    fixtures.append(fixture(snap, lean_path, "m1-recorded-lean-audit", lean["status"], schema=lean["schema"],
                            checks=counts((x.get("exitCode") == 0 if "exitCode" in x else None for x in lean["builds"]), "builds[].exitCode == 0"),
                            targetCount=len(lean["targets"]), negativeControlCount=len(lean["negativeControls"]),
                            customAxioms=lean["customAxioms"], absenceOfSorry=lean["absenceOfSorry"],
                            sourceFilesDigest=sha(lean["sourceFiles"]), scope=lean["scope"], freshKernelExecuted=False))
    return {"id": "P1-P3", "fixtures": fixtures,
            "summary": {"recordedNodeTests": node_counts, "recordedIndependentChecks": len(independent["checks"]),
                        "recordedLeanTargets": len(lean["targets"]), "freshKernelExecuted": False}}


def m2_groups(snap):
    acceptance_path = M2 + "evidence/acceptance.json"
    acceptance = snap.data(acceptance_path)
    groups = {name: {"id": name, "fixtures": []} for name in ["P4", "P5-P6"]}
    p4_kinds = {"arithmetic.projective", "arithmetic.elliptic", "arithmetic.ellipticGlobal",
                "arithmetic.mwFrobenius", "arithmetic.unramifiedFrobenius", "arithmetic.residueReconstruction"}
    for entry in acceptance["examples"]:
        path = M2 + "evidence/" + entry["id"] + ".json"
        data = snap.data(path)
        if data["resultHash"] != entry["resultHash"] or data["provenance"]["sourceHash"] != entry["sourceHash"]:
            raise ValueError("M2 acceptance binding mismatch: " + path)
        if data["status"] != entry["status"] or data["checks"] != entry["checks"]:
            raise ValueError("M2 acceptance result differs: " + path)
        # Match the recorded fixture identity as well as kind for inherited names.
        group = "P4" if data["kind"] in p4_kinds or re.match(r"m2-(projective|elliptic|mw-|semilinear|residue)", entry["id"]) else "P5-P6"
        groups[group]["fixtures"].append(fixture(snap, path, entry["id"], data["status"], schema=data["schema"],
            kind=data["kind"], inputHash=data["provenance"]["inputHash"], sourceHash=data["provenance"]["sourceHash"],
            resultHash=data["resultHash"], checks=counts((x.get("pass") for x in data["checks"]), "checks[].pass"),
            precision=data["request"].get("precision"), objectKind=data["object"].get("kind"),
            scope={"recordedFiniteScope": data["scope"].get("finite"), "recordedEvidence": data["evidence"],
                   "scopeFieldPath": "scope", "externalComparisonsRemainAsRecorded": True}))
    for group in groups.values():
        group["summary"] = {"fixtureCount": len(group["fixtures"]),
                            "recordedChecksPassed": sum(x["checks"]["passed"] for x in group["fixtures"]),
                            "acceptanceSource": snap.source(acceptance_path),
                            "inheritedM2Assessment": {"status": "RECORDED_COMPLETED_M2_SCOPED_CRITERIA",
                                "tests": acceptance["tests"], "criteria": acceptance["criteria"],
                                "scope": acceptance["scope"], "M3CompletionInferred": False}}
    return list(groups.values())


def p7_check_values(result):
    selected = {}
    for key in ["pass", "toleranceMet"]:
        if key in result:
            selected[key] = result[key]
    for parent in ["invariantChecks"]:
        for key, value in result.get(parent, {}).items():
            selected[parent + "." + key] = value
    for key, value in result.get("finiteValidation", {}).get("checks", {}).items():
        selected["finiteValidation.checks." + key] = value
    for i, row in enumerate(result.get("negativeControls", [])):
        selected["negativeControls[" + str(i) + "].rejected"] = row.get("rejected")
    for i, row in enumerate(result.get("localRows", [])):
        if "hasseCheck" in row:
            selected["localRows[" + str(i) + "].hasseCheck.holds"] = row["hasseCheck"].get("holds")
    return selected


def p7_group(snap):
    base = RESUME + "attempt2/"
    manifest = snap.data(base + "manifest.json")
    fixtures = []
    for entry in manifest["runs"] + manifest["replays"]:
        path = base + entry["artifact"]
        snap.verify(path, entry["sha256"])
        stored = snap.data(path)
        replay = stored["schema"] == "MathScope.M3.P7Replay/1"
        record = stored["fresh"] if replay else stored
        result = record["result"]
        if not replay and (record["recordSHA256"] != entry["recordSHA256"] or record["mathematicalSHA256"] != entry["mathematicalSHA256"]):
            raise ValueError("P7 manifest binding mismatch: " + path)
        if record["sourceBinding"] != manifest["sourceBinding"]:
            raise ValueError("P7 run belongs to another source: " + path)
        checks = p7_check_values(result)
        fixtures.append(fixture(snap, path, entry["id"] + ("-replay" if replay else ""), stored["status"] if replay else record["execution"]["status"],
            schema=stored["schema"], kind=record["request"]["kind"], resultStatus=result.get("status", result.get("analyticRank", {}).get("status")),
            checks=counts(checks.values(), "Only explicit positive checks listed in selectedCheckOutcomes; not all nested booleans"),
            selectedCheckOutcomes=checks, inputHash=record["inputSHA256"], sourceHash=sha(record["sourceBinding"]),
            sourceHashMeaning="SHA256 of canonical sourceBinding object", sourceCLIHash=record["sourceBinding"]["files"][0]["sha256"],
            resultHash=record["mathematicalSHA256"], resultHashMeaning="Recorded mathematicalSHA256", recordSHA256=record["recordSHA256"],
            scope=result.get("scope", {}), importedProofStatusAdopted=stored.get("importedProofStatusAdopted", False)))
    return {"id": "P7", "fixtures": fixtures, "summary": {"runCount": len(manifest["runs"]), "replayCount": len(manifest["replays"]),
            "recordedReplaysMatch": sum(x["status"] == "MATCH" for x in manifest["replays"]),
            "manifestSource": snap.source(base + "manifest.json"), "wholeP7Complete": False, "wholeM3Complete": False}}


def p8_group(snap):
    path = RESUME + "p8/browser-local-qa.json"
    qa = snap.data(path)
    binding = qa["testedEngineSourceBinding"]
    fixtures = [fixture(snap, path, "p8-recorded-browser-workflows", "RECORDED_BROWSER_QA_ACROSS_ENGINE_REBUILDS", schema=qa["schema"],
        sourceHash=binding["manifestSHA256"], sourceHashMeaning="Last browser reload manifest only; not the source for all earlier observations",
        observedWorkflowEntryCount=len(qa["checks"]), checks=counts([], "Browser observations are not a homogeneous pass/fail test list"),
        recordedSummary=qa["summary"], limitations=qa["limitations"],
        scope={"currentSourceReexecutionClaimed": False, "knownExecutedExamples": qa["summary"]["actualExecutedExampleCount"],
               "singleSourceForAll17ExamplesAttested": False, "perObservationSourceNotAlwaysRetained": True,
               "thisReportDoesNotAttestLaterEngineRebuilds": True, "originalQACompletedAt": qa.get("completedAt")})]
    export_path = RESUME + "p8/browser-finite-export.json.gz"
    record = snap.data(export_path)
    finite_source = record["sourceBinding"]["manifestSHA256"]
    validation = record["result"]["validation"]
    fixtures.append(fixture(snap, export_path, "p8-finite-downloaded-record", record["execution"]["status"], schema=record["schema"],
        sourceHash=finite_source, inputHash=record["inputSHA256"], resultHash=record["resultSHA256"], recordSHA256=record["recordSHA256"],
        checks=counts([validation.get("valid")], "result.validation.valid"), recordedValidation=validation,
        recordedLeanStatus=record["result"]["lean"]["status"], scope=record["scope"], freshKernelExecuted=False))
    mutation = next(x for x in qa["checks"] if x["id"] == "mutation-all-controls-and-open-rows")["result"]
    fixtures.append(fixture(snap, path, "p8-recorded-mutation-controls", mutation["status"], schema=mutation["schema"],
        sourceHash=None, sourceHashMeaning="Per-observation engine manifest not retained; do not attribute the last reload source to this earlier run",
        checks=counts((x.get("negativeControlPassed") for x in mutation["cases"]), "checks[id=mutation-all-controls-and-open-rows].result.cases[].negativeControlPassed"),
        cases=[{k: x.get(k) for k in ["id", "negativeControlPassed", "mathematicalReplayStatus"]} for x in mutation["cases"]],
        scope={"zeroBoxAndRankUpperRemainOpen": True, "currentSourceReexecutionClaimed": False}))
    return {"id": "P8", "fixtures": fixtures, "summary": {"knownExecutedExamples": qa["summary"]["actualExecutedExampleCount"],
            "lastBrowserReloadSourceManifestSHA256": binding["manifestSHA256"], "finiteDownloadedRecordSourceManifestSHA256": finite_source,
            "sourceWasRebuiltDuringSession": finite_source != binding["manifestSHA256"],
            "singleSourceForAll17ExamplesAttested": False, "laterEngineRebuildsCovered": False,
            "wholeP8Complete": False, "wholeM3Complete": False}}


def build(commit):
    snap = Snapshot(commit)
    return {"schema": "MathScope.M3.P8.ReviewFixtureEvidence/1", "repository": REPOSITORY, "sourceCommit": commit,
            "generatedBy": "research-ide/mathscope-m3/p8/tools/build_review_fixtures.py",
            "groups": [m1_group(snap), *m2_groups(snap), p7_group(snap), p8_group(snap)],
            "freshExecutionPerformed": False, "authority": "RECORDED_EVIDENCE_SUMMARY_ONLY",
            "inputAuthority": "Git commit and file hashes bind historical data; they do not issue proof authority",
            "proofStatusPromoted": False, "wholeP8Complete": False, "wholeM3Complete": False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-commit")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    previous = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else None
    commit = args.source_commit or (previous["sourceCommit"] if previous else subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=REPO, text=True).strip())
    result = build(commit)
    output = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != output:
            raise ValueError("Recorded fixture summary is missing or stale")
    else:
        OUTPUT.write_text(output, encoding="utf-8", newline="\n")
    print(json.dumps({"sourceCommit": commit, "summarySHA256": sha(output.encode()), "bytes": len(output.encode()),
                      "groups": {group["id"]: len(group["fixtures"]) for group in result["groups"]},
                      "freshExecutionPerformed": False, "checkOnly": args.check}))


if __name__ == "__main__":
    main()
