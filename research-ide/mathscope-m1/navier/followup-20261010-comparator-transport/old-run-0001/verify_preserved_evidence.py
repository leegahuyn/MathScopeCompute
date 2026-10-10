#!/usr/bin/env python3
"""Audit the old-run archival copy; never execute the Comparator or change gates.

With no arguments, verification is portable and prints a summary.  --source-root
also compares the original scratch files.  --check-frozen checks the historical
files at their original locations.  --output writes a NEW receipt exclusively.
This independent reader does not import the original controller or N106 auditor.
"""

from __future__ import annotations

import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import zipfile
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
RUN = 37979127351
JOB = 113984853927
ARTIFACT = 11654200401
ZIP_SHA = "1af31713f8f021605af509bab4634fed7ab041636f6f1670be2bd3e3c61788d2"
MAPPING_SHA = "be8fdbe37d5c26117c2f0d348f6d356d87a4be3bf1a8e967eaff1a8fc8730a2e"
FINAL_REL = "raw/final-artifact-0001"
ZIP_REL = FINAL_REL + "/original-comparator-37979127351-1.zip"
OBS_REL = "raw/github-observation-025.json"
EXPECTED_SOURCE_PINS = {
    "protected-controller.py": "03144d3692790deafd1b763feee5309144137dde60346335c59afbd094f77687",
    "protected-probe.py": "ed35362b4f1b4ede2271357d5cdc5258eb6d5c5cdef11ad5957827261043fb0e",
    "protected-workflow.yml": "e785e9e04dd0829c267e1afe4d866f96157f0330036aeca604bc586166f467c2",
    "pins.json": "e702d85ac8590d14c5ab131b6afaaab3ff56466b96da626739df4b0c364d4ae8",
    "original-configuration.json": "7610ecead7b390d80ff7f4229a3ff8f18d630e046f7ad1de4f92c7e8e76845b8",
    "original-Comparator-Main.lean": "b95ab1b6293f97fa16ecae548cf452b009ba035fc0273fe83b894769435ef6ef",
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def safe_relative(value: str) -> bool:
    p = PurePosixPath(value)
    return not p.is_absolute() and ".." not in p.parts and str(p) == value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path)
    parser.add_argument("--check-frozen", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.output is not None:
        output = args.output.resolve()
        if not output.is_relative_to(ROOT):
            parser.error("Receipt output must stay inside old-run-0001.")
        if output.exists():
            parser.error("An existing receipt will not be replaced.")
    else:
        output = None

    checks = []

    def check(name, ok, detail=None):
        item = {"name": name, "pass": bool(ok)}
        if detail is not None:
            item["detail"] = detail
        checks.append(item)

    mapping_bytes = (ROOT / "source-mapping.json").read_bytes()
    mapping = json.loads(mapping_bytes)
    check("exact frozen source mapping", sha(mapping_bytes) == MAPPING_SHA)
    rows = mapping["copiedFiles"]
    dest_names = [r["destinationRelativePath"] for r in rows]
    source_names = [r["sourceRelativePath"] for r in rows]
    check("62 unique copied paths", len(rows) == len(set(dest_names)) == len(set(source_names)) == 62)
    check("790215 copied bytes", sum(r["bytes"] for r in rows) == mapping["copiedBytes"] == 790215)
    check("source tree contains 63 files with one explicit omission", mapping["sourceFileCount"] == 63 and len(mapping["intentionalOmissions"]) == 1)
    check("safe relative mapping paths", all(safe_relative(p) for p in dest_names + source_names))
    check("all source relative paths preserved below raw", all(r["destinationRelativePath"] == "raw/" + r["sourceRelativePath"] for r in rows))
    actual_files = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "raw").rglob("*") if p.is_file())
    check("exact raw file set with no unlisted files", actual_files == sorted(dest_names))
    check("no raw symbolic links", all(not p.is_symlink() for p in (ROOT / "raw").rglob("*")))

    for row in rows:
        target = ROOT / row["destinationRelativePath"]
        data = target.read_bytes()
        check("preserved bytes: " + row["destinationRelativePath"], len(data) == row["bytes"] and sha(data) == row["sha256"])
        if args.source_root:
            source = args.source_root / row["sourceRelativePath"]
            check("independent source comparison: " + row["sourceRelativePath"], source.is_file() and not source.is_symlink() and source.read_bytes() == data)

    omitted = mapping["intentionalOmissions"][0]
    check("only redundant base64 omitted", omitted["sourceRelativePath"] == "final-artifact-0001/original-comparator-37979127351-1.base64" and omitted["zipRelativePath"] == ZIP_REL and omitted["decodedBytesExactlyEqualPreservedZIP"] is True)
    zipped = (ROOT / ZIP_REL).read_bytes()
    check("exact original archive bytes and SHA", len(zipped) == 135397 and sha(zipped) == ZIP_SHA)
    if args.source_root:
        encoded = (args.source_root / omitted["sourceRelativePath"]).read_bytes()
        check("omitted original base64 exactly encodes stored ZIP", len(encoded) == omitted["bytes"] and sha(encoded) == omitted["sha256"] and base64.b64decode(encoded) == zipped)
        source_inventory = sorted(p.relative_to(args.source_root).as_posix() for p in args.source_root.rglob("*") if p.is_file())
        check("source inventory completely accounted for", source_inventory == sorted(source_names + [omitted["sourceRelativePath"]]))

    observation = read_json(ROOT / OBS_REL)
    request_results = {q["label"]: r["structuredContent"] for q, r in zip(observation["requests"], observation["results"])}
    job = next(j for j in request_results["protected-jobs"]["jobs"] if j["id"] == JOB)
    artifact = next(a for a in request_results["protected-artifacts"]["artifacts"] if a["id"] == ARTIFACT)
    check("actual protected job completed with cancelled conclusion", job["run_id"] == RUN and job["status"] == "completed" and job["conclusion"] == "cancelled")
    check("actual validation step 5 cancelled", next(s for s in job["steps"] if s["number"] == 5)["conclusion"] == "cancelled")
    check("actual evidence collection and upload succeeded", all(next(s for s in job["steps"] if s["number"] == n)["conclusion"] == "success" for n in (6, 7)))
    check("actual artifact metadata matches complete archive", artifact["digest"] == "sha256:" + ZIP_SHA and artifact["size_in_bytes"] == len(zipped) and artifact["workflow_run"]["id"] == RUN and artifact["workflow_run"]["head_sha"] == "8c4271aa5a35b1d34c30279fb306a099944e4823")

    audit = read_json(ROOT / FINAL_REL / "comparator-portable-audit.json")
    original_receipt = read_json(ROOT / FINAL_REL / "receipt.json")
    portable_members = {m["name"]: m for m in audit["members"]}
    member_rows = []
    with zipfile.ZipFile(ROOT / ZIP_REL) as archive:
        infos = archive.infolist()
        names = [i.filename for i in infos]
        check("34 unique safe regular ZIP members", len(names) == len(set(names)) == 34 and all(safe_relative(i.filename) and not i.is_dir() and stat.S_IFMT(i.external_attr >> 16) != stat.S_IFLNK for i in infos))
        check("ZIP CRCs valid", archive.testzip() is None)
        extracted_names = sorted(p.relative_to(ROOT / FINAL_REL / "extracted").as_posix() for p in (ROOT / FINAL_REL / "extracted").rglob("*") if p.is_file())
        check("all extracted raw files exactly match ZIP membership", sorted(names) == extracted_names == sorted(portable_members))
        for info in infos:
            data = archive.read(info.filename)
            disk = (ROOT / FINAL_REL / "extracted" / info.filename).read_bytes()
            old = portable_members[info.filename]
            equal = data == disk and len(data) == old["bytes"] and sha(data) == old["sha256"]
            check("ZIP/extracted/original audit agree: " + info.filename, equal)
            member_rows.append({"archiveMember": info.filename, "destinationRelativePath": FINAL_REL + "/extracted/" + info.filename, "bytes": len(data), "sha256": sha(data), "archiveAndExtractedBytesEqual": data == disk})

    for rel, expected in original_receipt["fileHashes"].items():
        if rel == "original-comparator-37979127351-1.base64":
            check("original receipt accounts for deliberately omitted base64", expected["sha256"] == omitted["sha256"] and expected["bytes"] == omitted["bytes"])
        else:
            data = (ROOT / FINAL_REL / rel).read_bytes()
            check("original received receipt hash preserved: " + rel, len(data) == expected["bytes"] and sha(data) == expected["sha256"])
    check("original observation hash preserved in both receipts", sha((ROOT / OBS_REL).read_bytes()) == original_receipt["observation"]["sha256"] == audit["githubObservationSHA256"])
    check("original incomplete audit not promoted", audit["status"] == "FAIL_OR_INCOMPLETE" and audit["N106Completed"] is False and audit["passed"] == 138 and audit["total"] == 163 and len(audit["checks"]) == 163 and sum(c["pass"] for c in audit["checks"]) == 138)
    check("original receipt incomplete outcome preserved", original_receipt["status"] == "ACTUAL_JOB_CANCELLED_BEFORE_COMPARATOR" and original_receipt["N106Completed"] is False)
    check("no protected Comparator exit or submitted axioms invented", audit["actualProtectedComparatorExitCode"] is None and audit["theoremAxioms"] == {} and audit["postcheckOnlyFailure"] is False)

    result = read_json(ROOT / FINAL_REL / "extracted/result.json")
    stages = result["steps"]
    stage_names = [s["label"] for s in stages]
    last = stages[-1]
    check("29 completed zero-exit stages before the last preflight", len(stages) == 30 and all(s.get("exitCode") == 0 and "completedUTC" in s for s in stages[:-1]))
    check("guard preflight started but has no recorded completion", last["label"] == "guard-preflight" and last["startedUTC"] == "2026-10-09T19:20:20.282990+00:00" and "exitCode" not in last and "completedUTC" not in last)
    expected_guard = ["systemd-run", "--user", "--pty", "--wait", "--collect", "--property=RestrictAddressFamilies=~AF_UNIX", "-E", "PATH=/home/mathscopeverify/audit/tool-bin:/home/mathscopeverify/audit/lean-4.34.0-rc2-linux/bin:/opt/mathscope-ci/go/bin:/opt/mathscope-ci/rust/bin:/usr/local/bin:/usr/bin:/bin", "--working-directory=/home/mathscopeverify/audit/original-source", "--", "/usr/bin/python3", "/opt/mathscope-ci/probe.py", "unix-socket"]
    check("literal original PTY and AF_UNIX-restricted preflight command retained", last["command"] == expected_guard)
    guard_log = (ROOT / FINAL_REL / "extracted/guard-preflight.log").read_text()
    check("complete preflight log contains only the two recorded transport lines", guard_log == "Running as unit: run-u0.service; invocation ID: 04e83c81001c4a53a07ed478245d4347\nPress ^] three times within 1s to disconnect TTY.\n")
    absent_labels = ["landlock-preflight", "protected-comparator", "submitted-type-and-axiom-audit", "source-status-after"]
    check("later validation stages were never recorded", all(label not in stage_names for label in absent_labels))
    check("controller unfinished status retained", result["status"] == "RUNNING" and result["exitCode"] is None and "finishedUTC" not in result)
    check("after-source preservation evidence is absent, not inferred", not (ROOT / FINAL_REL / "extracted/source-hashes-after.json").exists() and "trackedSourceBytesUnchanged" not in result)
    before = read_json(ROOT / FINAL_REL / "extracted/source-hashes-before.json")
    check("2669-file before-source inventory present", len(before) == 2669 and sha((ROOT / FINAL_REL / "extracted/source-hashes-before.json").read_bytes()) == "1511e4398e2825776b1f1f6de35925b02cba19237b42d26bd13a9a65cd8b0f28")
    check("original pre-Comparator project object list empty", result["originalProjectOleansBeforeComparator"] == [])
    check("actual kernel hash recorded", result["leanKernelSHA256"] == "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5")
    for name, expected in EXPECTED_SOURCE_PINS.items():
        check("unchanged historical controller context: " + name, sha((ROOT / "raw/stage-analysis-001/inputs" / name).read_bytes()) == expected)

    response = read_json(ROOT / FINAL_REL / "job-log-response.json")
    log = (ROOT / FINAL_REL / f"job-{JOB}.log").read_bytes()
    check("raw job log exactly equals saved API response content", response["structuredContent"]["content"].encode("utf-8") == log)
    log_text = log.decode("utf-8")
    cancelled = re.findall(r"(?m)^([^\n ]+) ##\[error\]The operation was canceled\.$", log_text)
    check("one exact raw cancellation marker retained", cancelled == ["2026-10-10T01:07:03.2406010Z"])
    cancel_raw = cancelled[0]
    start = datetime.fromisoformat(last["startedUTC"])
    cancel_time = datetime.fromisoformat(cancel_raw.replace("Z", "+00:00"))
    elapsed = (cancel_time - start).total_seconds()
    check("start-to-cancellation-marker elapsed time", abs(elapsed - 20802.957611) < 1e-9)
    check("archive upload size and digest independently appear in job log", "Uploaded bytes 135397" in log_text and "SHA256 digest of uploaded artifact zip is " + ZIP_SHA in log_text)
    corrected = request_results["corrected-jobs"]["jobs"]
    check("observation 025 corrected jobs are recorded as running, not empty", {(j["id"], j["status"], j["conclusion"]) for j in corrected} == {(114093554886, "in_progress", None), (114093555036, "in_progress", None)})

    if args.check_frozen:
        for pin in mapping["frozenRepositoryFilesCheckedBeforeAndAfter"]:
            check("frozen file unchanged: " + pin["pathRelativeToResearchIDE"], sha((REPO / pin["pathRelativeToResearchIDE"]).read_bytes()) == pin["sha256"])
        pdf_pin = mapping["frozenPDFCheckedBeforeAndAfter"]
        check("frozen 15-page PDF unchanged", sha(Path(pdf_pin["absolutePath"]).read_bytes()) == pdf_pin["sha256"])

    passed = sum(c["pass"] for c in checks)
    kst = ZoneInfo("Asia/Seoul")
    receipt = {
        "schema": "MathScope.ComparatorOldRunPreservationAudit/1",
        "verifiedUTC": datetime.now(timezone.utc).isoformat(),
        "status": "PRESERVATION_PASS" if passed == len(checks) else "PRESERVATION_FAIL",
        "scope": "Independent path, byte, archive-member, API-log, and actual incomplete-outcome audit only. These counts are preservation checks, not N106 acceptance checks or mathematical theorems.",
        "sourceMappingPath": "source-mapping.json",
        "sourceMappingSHA256": sha(mapping_bytes),
        "verifierPath": Path(__file__).name,
        "verifierSHA256": sha(Path(__file__).read_bytes()),
        "sourceComparisonPerformed": args.source_root is not None,
        "sourceRootUsed": str(args.source_root) if args.source_root else None,
        "frozenFileCheckPerformed": args.check_frozen,
        "copiedFileCount": len(rows),
        "copiedBytes": sum(r["bytes"] for r in rows),
        "sourceToDestinationMapping": rows,
        "archivePath": ZIP_REL,
        "archiveBytes": len(zipped),
        "archiveSHA256": sha(zipped),
        "archiveMembers": member_rows,
        "runId": RUN,
        "jobId": JOB,
        "artifactId": ARTIFACT,
        "finalObservationPath": OBS_REL,
        "finalObservationSHA256": sha((ROOT / OBS_REL).read_bytes()),
        "finalObservationUTC": observation["receivedUTC"],
        "actualJobConclusion": job["conclusion"],
        "actualControllerStatus": result["status"],
        "actualControllerExitCode": result["exitCode"],
        "lastRecordedStage": "guard-preflight",
        "lastStageStartedUTC": last["startedUTC"],
        "lastStageStartedKST": start.astimezone(kst).isoformat(),
        "rawCancellationMarkerUTC": cancel_raw,
        "rawCancellationMarkerKST": cancel_time.astimezone(kst).isoformat(),
        "startToCancellationMarkerSeconds": elapsed,
        "durationInterpretation": "Elapsed wall time between the recorded stage start and the raw cancellation marker; not a measured child process completion time or proof of the internal cause.",
        "laterUnrecordedStages": absent_labels,
        "afterSourcePreservationProved": False,
        "nanodaSolutionAcceptanceProved": False,
        "leanSolutionAcceptanceProved": False,
        "submittedTheoremAuditFromThisRunPresent": False,
        "N106Completed": False,
        "N106CurrentStatus": "PARTIAL",
        "originalFrozenAssessmentStillApplicable": {"PASS": 69, "PARTIAL": 1, "BLOCKED": 0},
        "allOriginalNineConditionsComplete": False,
        "allOriginal70ConditionsComplete": False,
        "originalPortableAudit": {"path": FINAL_REL + "/comparator-portable-audit.json", "sha256": sha((ROOT / FINAL_REL / "comparator-portable-audit.json").read_bytes()), "status": audit["status"], "passed": audit["passed"], "total": audit["total"], "unfulfilledChecks": [c["name"] for c in audit["checks"] if not c["pass"]]},
        "newComparatorRunPerformed": False,
        "newMathematicalOrKernelCheckPerformed": False,
        "newPDFGenerated": False,
        "passed": passed,
        "total": len(checks),
        "checks": checks,
    }
    if output:
        with output.open("x", encoding="utf-8") as handle:
            json.dump(receipt, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
    print(json.dumps({"status": receipt["status"], "passed": passed, "total": len(checks), "copiedFiles": len(rows), "archiveMembers": len(member_rows), "N106Completed": False, "receipt": str(output) if output else None, "failedChecks": [c for c in checks if not c["pass"]]}, ensure_ascii=False, indent=2))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
