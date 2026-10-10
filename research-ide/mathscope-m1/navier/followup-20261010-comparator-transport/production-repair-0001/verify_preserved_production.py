#!/usr/bin/env python3
"""Verify the copied repair/publication evidence without executing its code.

Default verification is portable and uses only this directory.  The optional
--verify-frozen-inputs switch also compares previously frozen workspace files.
Recorded local tests, code review and GitHub observations are read, not rerun.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
MAPPING_SHA = "150f8d74887097c6f7e1e16ce038d890558f7c878d43beb920af45e556ed63cd"
RUN = 38014602021
JOB = 114101981614
REMOTE = "55dacb898f8c204bf0c5925ea901d75d6c2d0f46"
TREE = "95a671fe81b64ed2303da01c4f6c887691fa8287"
LOCAL = "a2130ba975891e62dacba7572f137e704551341a"
PREVIOUS_REMOTE = "c61d35806bb3579131eb7ff8c55187ae26209ade"
PREVIOUS_LOCAL = "0056147e90bdd4fd4f575aa4df08aa5f937301fd"
CORRECTION = "Initial assertion expected local main at c61d358; actual retained local main was 0056147. Inspected it, proved ancestry, and performed only a fast-forward local ref update. Remote main and working files were unaffected by the assertion."


def digest(data):
    return hashlib.sha256(data).hexdigest()


def sha(path):
    return digest(Path(path).read_bytes())


def read(relative):
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--verify-frozen-inputs", action="store_true")
    args = parser.parse_args()
    if args.output and (args.output.exists() or not args.output.resolve().is_relative_to(ROOT)):
        parser.error("Choose a new receipt path within this directory; existing evidence is immutable")
    checks = []

    def check(name, value, detail=None):
        row = {"name": name, "pass": bool(value)}
        if detail is not None:
            row["detail"] = detail
        checks.append(row)

    mapping = read("source-mapping.json")
    check("exact source mapping snapshot", sha(ROOT / "source-mapping.json") == MAPPING_SHA)
    check("mapping scope is preservation and N106 incomplete", mapping["N106Completed"] is False and mapping["omissions"] == [])
    files = mapping["copiedFiles"]
    check("30 distinct raw files and 254339 recorded bytes", len(files) == mapping["copiedFileCount"] == 30 and sum(x["bytes"] for x in files) == mapping["copiedBytes"] == 254339)
    check("raw inventory has no missing or extra files", {str(p.relative_to(ROOT)) for p in (ROOT / "raw").rglob("*") if p.is_file()} == {r["destinationRelativePath"] for r in files})
    aliases = {}
    for row in files:
        relative = row["destinationRelativePath"]
        path = ROOT / relative
        check("copied bytes and SHA256: " + relative, path.is_relative_to(ROOT) and path.stat().st_size == row["bytes"] and sha(path) == row["sha256"] and row["sourceAndDestinationBytesEqualWhenCopied"] is True)
        aliases[row["sourceAbsolutePath"]] = path
    for row in mapping["reviewedOriginalSourceAliases"]:
        path = ROOT / row["destinationRelativePath"]
        check("reviewed original aliases exact frozen snapshot: " + Path(row["reviewedOriginalAbsolutePath"]).name,
              aliases[row["copiedSnapshotSourceAbsolutePath"]] == path and path.stat().st_size == row["bytes"] and sha(path) == row["sha256"] and row["actualOriginalAndSnapshotBytesEqualWhenCopied"] is True)
        aliases[row["reviewedOriginalAbsolutePath"]] = path
    check("ten original source aliases preserved without duplicate raw files", len(mapping["reviewedOriginalSourceAliases"]) == 10)

    local_dir = "raw/ns-guard-repair-20261010/protected-controller-local-0001/"
    local = read(local_dir + "receipt.json")
    check("original local receipt SHA256", sha(ROOT / local_dir / "receipt.json") == "eda3d58398ad407d3210addbda6d5911b8371bb0f07a50f5d49192d170e60ca3")
    check("recorded 12 actual local tests exited zero", local["status"] == "PASS" and local["exitCode"] == 0 and local["actualTestsRun"] == 12)
    check("local receipt never claimed actual guard or Comparator execution", local["actualGuardExecuted"] is False and local["actualComparatorExecuted"] is False and local["N106Completed"] is False)
    check("recorded literal original-preservation checks all true", local["inputBytesStillEqual"] is True and all(v is True for v in local["preservationChecks"].values()))
    for row in local["inputs"]:
        path = ROOT / local_dir / row["snapshot"]
        check("local test input snapshot: " + row["path"], path.stat().st_size == row["bytes"] and sha(path) == row["sha256"])
    check("local input count is ten", len(local["inputs"]) == 10)
    for stream in ("stdout", "stderr"):
        check("recorded local " + stream + " hash", sha(ROOT / local_dir / (stream + ".log")) == local[stream + "SHA256"])
    stderr = (ROOT / local_dir / "stderr.log").read_text()
    check("twelve named tests and literal OK preserved", len(re.findall(r"^test_.* \.\.\. ok$", stderr, re.M)) == 12 and "Ran 12 tests in 2.002s\n\nOK\n" in stderr)

    review_rel = "raw/ns-guard-repair-20261010/independent-production-review/reviewer-receipt-0001.json"
    review = read(review_rel)
    check("original 73-check review SHA256", sha(ROOT / review_rel) == "45c8d99c79010e4c36ea6ffb62980cb8c8571517edf26d28b25c8d0467e044ef")
    check("recorded independent review is exactly 73 of 73", review["status"] == "PASS" and review["checksPassed"] == review["checksTotal"] == len(review["checks"]) == 73 and all(r["passed"] is True for r in review["checks"]))
    check("independent code review scope is not N106", all(review[k] is False for k in ["reviewerReranTests", "reviewerExecutedActualGuard", "reviewerExecutedComparator", "N106Completed"]))
    check("all 29 independent-review inputs resolve portably", len(review["inputs"]) == 29 and set(review["inputs"]) <= set(aliases))
    for original, row in review["inputs"].items():
        path = aliases.get(original)
        check("independent review input binding: " + original.split("/workspace/scratch/9a6c38c54c2e/")[-1], path is not None and path.stat().st_size == row["bytes"] and sha(path) == row["sha256"])

    syntax = read("raw/ns-guard-repair-20261010/production-workflow-syntax-001.json")
    workflow = ROOT / "raw/additional-reviewed-source/.github/workflows/ns-comparator-verification.yml"
    check("recorded YAML and four shell syntax checks bind actual workflow", syntax["passed"] is True and len(syntax["bashBlocks"]) == 4 and all(r["exitCode"] == 0 for r in syntax["bashBlocks"]) and sha(workflow) == syntax["sha256"])
    commit = read("raw/ns-guard-repair-20261010/local-production-commit-001.json")
    check("local commit and unchanged scope retained", commit["headCommit"] == LOCAL and commit["tree"] == TREE and all(commit[k] is False for k in ["frozenOriginalSourcesChanged", "historicalAssessmentsChanged", "newComparatorExecuted"]))
    repo_prefix = str(Path(syntax["workflow"]).parents[2]) + "/"
    source_by_git = {path: aliases[repo_prefix + path] for path in commit["sourceSHA256"]}
    for git_path, expected in commit["sourceSHA256"].items():
        check("commit source SHA256: " + git_path, sha(source_by_git[git_path]) == expected)

    pub_dir = "raw/github-protected-transport-upload-20261010/"
    index = read(pub_dir + "upload-index.json")
    root_request = read(pub_dir + "root-tree-request.json")
    payload = read(pub_dir + "payloads/text-000.json")
    objects = read(pub_dir + "receipts/object-publication.json")
    publication = read(pub_dir + "receipts/publication.json")
    alignment = read(pub_dir + "receipts/local-alignment.json")
    check("upload index has five exact entries and the local source tree", index["entryCount"] == index["newBlobCount"] == 5 and index["headCommit"] == LOCAL and index["headTree"] == TREE and index == objects["index"])
    check("request and payload preserve repository and base", root_request["repository_full_name"] == payload["repository_full_name"] == index["repository"] == "leegahuyn/MathScopeCompute" and root_request["base_tree_sha"] == index["baseTree"])
    check("five source Git paths preserved in tree request", len(root_request["tree_elements"]) == 5 and {x["path"] for x in root_request["tree_elements"]} == set(source_by_git))
    blob_bytes = {}
    for row in payload["tree_elements"]:
        data = row["content"].encode("utf-8")
        blob = hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()
        check("actual upload content binds Git blob " + blob, row["path"] == "objects/" + blob and row["mode"] == "100644" and row["type"] == "blob")
        blob_bytes[blob] = data
    check("five unique raw upload blobs", len(blob_bytes) == len(payload["tree_elements"]) == 5)
    for row in root_request["tree_elements"]:
        check("published tree blob bytes equal reviewed source: " + row["path"], row["mode"] == "100644" and row["type"] == "blob" and blob_bytes[row["sha"]] == source_by_git[row["path"]].read_bytes())
    packet = index["packets"][0]
    check("raw packet size and response expected tree SHA agree", len(index["packets"]) == len(objects["packets"]) == 1 and aliases[packet["file"]].stat().st_size == packet["bytes"] and objects["packets"][0]["file"] == packet["file"] and objects["packets"][0]["response"]["structuredContent"]["sha"] == packet["expectedSha"])
    check("raw root request byte count retained", aliases[index["rootRequest"]].stat().st_size == index["rootRequestBytes"] == 789)
    check("actual object responses bind new remote commit and reviewed tree", objects["refUpdated"] is False and objects["rootTree"]["structuredContent"]["sha"] == TREE and objects["commit"]["structuredContent"]["sha"] == objects["remoteCommit"] == REMOTE)
    lease = json.loads(publication["lease"]["structuredContent"]["content"])
    check("actual remote main lease and successful ref update retained", lease["ref"] == "refs/heads/main" and lease["object"]["sha"] == publication["previousMain"] == PREVIOUS_REMOTE and publication["refUpdate"]["structuredContent"]["success"] is True and publication["remoteCommit"] == REMOTE and publication["tree"] == TREE)
    check("publication binds independent review and has no gate promotion", publication["reviewSHA256"] == sha(ROOT / review_rel) and all(publication[k] is False for k in ["originalWorkflowChanged", "originalControllerChanged", "historicalAssessmentChanged", "originalN106CompletedAtPublication", "liveSiteDeployed"]))
    check("same-tree local commit identity differs from remote metadata only", alignment["oldLocalCommit"] == LOCAL and alignment["remoteCommit"] == REMOTE and alignment["identicalTree"] == TREE and alignment["indexDiff"] == alignment["worktreeDiff"] == "")
    check("literal initial local-main correction preserved", alignment["localMainFastForwardFrom"] == PREVIOUS_LOCAL and alignment["initialLocalMainAssumptionCorrection"] == CORRECTION)

    obs_rel = "raw/ns-guard-repair-20261010/protected-run-0001/observation-002.json"
    observation = read(obs_rel)
    blocks = [r["value"]["structuredContent"] for r in observation["results"] if r["status"] == "fulfilled"]
    jobs = [j for b in blocks for j in b.get("jobs", [])]
    artifacts = [a for b in blocks for a in b.get("artifacts", [])]
    check("actual initial protected job is running and incomplete", len(jobs) == 1 and jobs[0]["id"] == JOB and jobs[0]["run_id"] == RUN and jobs[0]["status"] == "in_progress" and jobs[0]["conclusion"] is None and not artifacts)
    check("actual original Comparator step six has no final exit", any(s["number"] == 6 and s["status"] == "in_progress" and s["conclusion"] is None for s in jobs[0]["steps"]))
    metadata = read("raw/ns-guard-repair-20261010/protected-run-0001/run-metadata-001.json")
    run = json.loads(metadata["results"][0]["structuredContent"]["content"])
    check("actual GitHub run metadata binds published main", run["id"] == RUN and run["head_sha"] == REMOTE and run["head_branch"] == "main" and run["path"] == ".github/workflows/ns-comparator-verification.yml" and run["run_started_at"] == "2026-10-10T01:48:37Z")

    frozen = mapping["frozenPriorFilesCheckedBeforeAndAfter"]
    check("copy operation recorded all 124 old/diagnostic/v2 frozen files", len(frozen) == 124)
    if args.verify_frozen_inputs:
        for row in frozen:
            path = Path(row["path"])
            check("prior frozen file unchanged: " + str(path).split("/workspace/scratch/9a6c38c54c2e/")[-1], path.is_file() and path.stat().st_size == row["bytes"] and sha(path) == row["sha256"])
    passed = sum(row["pass"] for row in checks)
    receipt = {
        "schema": "MathScope.ProtectedTransportProductionPreservation/1",
        "recordedUTC": datetime.now(timezone.utc).isoformat(),
        "status": "PRESERVATION_PASS" if passed == len(checks) else "PRESERVATION_FAIL",
        "passed": passed, "total": len(checks), "checks": checks,
        "sourceMappingSHA256": MAPPING_SHA, "verifierSHA256": sha(__file__),
        "copiedFileCount": len(files), "copiedBytes": mapping["copiedBytes"],
        "reviewedOriginalAliasCount": 10, "omissions": [],
        "recordedLocalTests": {"exitCode": 0, "count": 12, "receiptSHA256": sha(ROOT / local_dir / "receipt.json")},
        "recordedIndependentReview": {"passed": 73, "total": 73, "receiptSHA256": sha(ROOT / review_rel)},
        "publishedCommit": REMOTE, "publishedTree": TREE,
        "initialProtectedRunId": RUN, "initialProtectedJobId": JOB,
        "initialObservationUTC": observation["receivedUTC"], "initialObservationSHA256": sha(ROOT / obs_rel),
        "actualJobStatusAtCopiedObservation": "in_progress", "actualJobConclusionAtCopiedObservation": None,
        "N106Completed": False, "currentSeparateCounts": {"PASS": 69, "PARTIAL": 1, "BLOCKED": 0},
        "testsExecutedByThisVerifier": False, "actualGuardExecutedByThisVerifier": False,
        "actualComparatorExecutedByThisVerifier": False, "reviewerRerunByThisVerifier": False,
        "publicationPerformedByThisVerifier": False,
        "frozenPriorInputCount": len(frozen), "frozenPriorInputsRechecked": args.verify_frozen_inputs,
        "scope": "Portable byte/hash/path mapping of actual reviewed repair and publication evidence. It reads recorded local tests, code review and initial GitHub observations; it does not execute those tests, run a Comparator, or prove N1-06."
    }
    if args.output:
        with args.output.open("x", encoding="utf-8") as handle:
            json.dump(receipt, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
    print(json.dumps({k: receipt[k] for k in ["status", "passed", "total", "copiedFileCount", "copiedBytes", "N106Completed"]} | {"failed": [r for r in checks if not r["pass"]]}, ensure_ascii=False, indent=2))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
