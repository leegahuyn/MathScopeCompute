#!/usr/bin/env python3
"""Read-only verification of the preserved original GitHub default-build evidence.

Run from any working directory. All inputs are resolved beside this script.
The original ZIP can be absent in a source release: its explicit base64 copy
decodes to the exact GitHub-uploaded archive, whose members are compared with
every extracted evidence file. This does not change the failed job conclusion.
"""
from __future__ import annotations

import argparse
import base64
from datetime import datetime, timezone
from hashlib import sha1, sha256
from io import BytesIO
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parent
ARTIFACT = ROOT / "default-build-artifact"
EXPECTED_ZIP_SHA = "79d9b7eade3bd569a62b0a344eb0a1fd4fa37e07f6b4c10121565bd185ccf5d6"
EXPECTED_ZIP_BYTES = 282640
EXPECTED_SOURCE = "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
EXPECTED_KERNEL = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"
EXPECTED_CONTROLLER_BLOB = "c381c075256953aa7be37541c7984b6780623a09"


def digest(path: Path) -> str:
    return sha256(path.read_bytes()).hexdigest()


def verify() -> dict:
    result = json.loads((ARTIFACT / "result.json").read_text())
    pins = json.loads((ARTIFACT / "pins.json").read_text())
    before = json.loads((ARTIFACT / "source-hashes-before.json").read_text())
    after = json.loads((ARTIFACT / "source-hashes-after.json").read_text())
    checks = []

    def check(name, value, details=None):
        checks.append({"name": name, "pass": bool(value), "details": details})

    encoded = (ROOT / "original-default-build-artifact.base64").read_text(encoding="ascii")
    archive = base64.b64decode("".join(encoded.split()), validate=True)
    optional_zip = ROOT / "original-default-build-37979127351-1.zip"
    archive_matches = (len(archive) == EXPECTED_ZIP_BYTES
                       and sha256(archive).hexdigest() == EXPECTED_ZIP_SHA
                       and (not optional_zip.exists() or optional_zip.read_bytes() == archive))
    member_comparisons = []
    with ZipFile(BytesIO(archive)) as zipped:
        archive_matches = archive_matches and zipped.testzip() is None
        infos = zipped.infolist()
        archive_matches = archive_matches and len(infos) == 21
        for info in infos:
            member = PurePosixPath(info.filename)
            safe = (not member.is_absolute() and ".." not in member.parts
                    and not info.is_dir() and "\\" not in info.filename)
            actual_file = ARTIFACT.joinpath(*member.parts)
            same = safe and actual_file.is_file() and actual_file.read_bytes() == zipped.read(info)
            member_comparisons.append({"name": info.filename, "bytes": info.file_size,
                                       "extractedBytesMatch": same})
            archive_matches = archive_matches and same
    check("artifact bytes and SHA256 match GitHub receipt", archive_matches,
          {"representation": "explicit base64 of original GitHub artifact ZIP",
           "bytes": len(archive), "sha256": sha256(archive).hexdigest(),
           "members": member_comparisons})
    check("actual original CI failure preserved", result["status"] == "FAILED" and result["exitCode"] == 1)
    check("pinned original source head", (ARTIFACT / "original-source-head.log").read_text().strip()
          == pins["commit"] == EXPECTED_SOURCE)
    check("recorded pins match artifact pins", result["pins"] == pins and result["pinsSHA256"] == digest(ARTIFACT / "pins.json"))
    check("nonempty complete tracked-source hash dictionaries identical", before == after and len(before) > 2000,
          {"files": len(before), "beforeSHA256": digest(ARTIFACT / "source-hashes-before.json"),
           "afterSHA256": digest(ARTIFACT / "source-hashes-after.json")})
    check("trackedSourceBytesUnchanged matches independent comparison", result["trackedSourceBytesUnchanged"] is True and before == after)
    for name, expected in pins["sourceFileSHA256"].items():
        check("pinned tracked source " + name, before.get(name) == after.get(name) == expected)
    check("original Comparator config bytes preserved", before[pins["configuration"]] == after[pins["configuration"]] == pins["configurationSHA256"])
    check("official archive hash matches pin", result["downloadedArchiveSHA256"] == pins["leanArchiveSHA256"]
          == "3d011041203acacf300d343a39673f7d233743397993797c941346ae9e5df1a8")
    check("original shared kernel hash matches pin", result["leanKernelSHA256"] == pins["leanKernelSHA256"] == EXPECTED_KERNEL)
    for name, key in [("Comparator", "comparatorCommit"), ("mathlib", "mathlibCommit"), ("lean4export", "lean4exportCommit")]:
        check("dependency " + name, (ARTIFACT / ("pin-" + name + ".log")).read_text().strip() == result["dependencyHeads"][name] == pins[key])
    for stage in result["steps"]:
        check("full log digest " + stage["label"], digest(ARTIFACT / (stage["label"] + ".log")) == stage["logSHA256"])
    stages = {stage["label"]: stage for stage in result["steps"]}
    official_lake = "/home/mathscopeverify/audit/lean-4.34.0-rc2-linux/bin/lake"
    check("literal official cache-get actually exit 0", stages["cache-get"]["exitCode"] == 0 and stages["cache-get"]["command"] == [official_lake, "exe", "cache", "get"])
    check("unmodified default build actually exit 0", stages["original-default-build"]["exitCode"] == 0 and stages["original-default-build"]["command"] == [official_lake, "build"])
    check("whole default target build terminal success", (ARTIFACT / "original-default-build.log").read_text().endswith("Build completed successfully (11424 jobs).\n"))
    source_status = (ARTIFACT / "source-status-after.log").read_text()
    expected_warnings = ("warning: unable to access '/home/runner/.config/git/attributes': Permission denied\n"
                         "warning: unable to access '/home/runner/.config/git/ignore': Permission denied\n")
    check("source status command itself exits zero", stages["source-status-after"]["exitCode"] == 0)
    check("merged source status contains only two Git configuration warnings", source_status == expected_warnings)
    controller = (ROOT / "ci-controller-8c4271a.py").read_bytes()
    blob_header = b"blob " + str(len(controller)).encode() + b"\0"
    check("GitHub retrieved CI controller matches immutable blob SHA1", sha1(blob_header + controller).hexdigest() == EXPECTED_CONTROLLER_BLOB)
    check("controller merges stderr into stdout", b"stderr=subprocess.STDOUT" in controller)
    check("controller treats any merged status text as dirty", b'if run("source-status-after", ["git", "status", "--porcelain", "--untracked-files=no"], repo).strip():' in controller)
    check("specific postcheck failure message preserved", result["error"] == "RuntimeError: Original tracked source status is not clean")
    check("source and guard mutation flags remain false", result["sourceChanges"] is False and result["guardChanges"] is False)
    check("actual build user is unprivileged", result["uid"] == result["euid"] == 1002 and "mathscopeverify" in (ARTIFACT / "identity.log").read_text())
    check("no Comparator command claimed in default mode", "protected-comparator" not in stages and result["mode"] == "default-build")
    original_audit = json.loads((ROOT / "default-build-independent-audit.json").read_text())
    prior_checks = [(x["name"], x["pass"]) for x in original_audit["checks"]]
    current_checks = [(x["name"], x["pass"]) for x in checks]
    return {
        "schema": "MathScope.OriginalCIDefaultReverification/1",
        "checkedUTC": datetime.now(timezone.utc).isoformat(),
        "runId": 37979127351, "jobId": 113984854490, "artifactId": 11644582983,
        "actualJobConclusion": "failure", "actualControllerExitCode": result["exitCode"],
        "literalCacheGetActualExitCode": stages["cache-get"]["exitCode"],
        "wholeDefaultBuildActualExitCode": stages["original-default-build"]["exitCode"],
        "trackedSourceBytesUnchanged": before == after, "trackedFileCount": len(before),
        "checksMatchFrozen43CheckAudit": prior_checks == current_checks,
        "passed": len(checks) == 43 and all(x["pass"] for x in checks) and prior_checks == current_checks,
        "independentChecksPassed": sum(x["pass"] for x in checks), "independentChecksTotal": len(checks),
        "checks": checks,
        "scope": "Verify original artifact integrity and distinct command/controller outcomes; never promote the failed GitHub job or the separate running Comparator job.",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Optional path for a new verification report; existing files are never overwritten.")
    args = parser.parse_args()
    report = verify()
    if args.output is not None:
        with args.output.open("x") as handle:
            json.dump(report, handle, indent=2)
            handle.write("\n")
    print(json.dumps({key: report[key] for key in ["passed", "independentChecksPassed", "independentChecksTotal", "checksMatchFrozen43CheckAudit", "actualJobConclusion", "literalCacheGetActualExitCode", "wholeDefaultBuildActualExitCode", "trackedFileCount"]}))
    raise SystemExit(0 if report["passed"] else 1)
