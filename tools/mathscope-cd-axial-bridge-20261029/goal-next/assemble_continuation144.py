"""Rebuild the C144 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation143 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "dca01827495038a88eac2468a2b6b9f26c824884"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation143_Delta_20261120.zip":
           "366a757e017df288e4648ae72b3d127fd3da2aaf17b34502b9879e8ff5ada447"}
LABEL = "MathScope_Goal_Continuation144"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION144_KO.md", "STATUS_CONTINUATION144.json"
PUBLIC = "preservation-continuation144.json"
PACKETS = ("c144/postfive-pressure/", "c144/reference-followup/", "c144/y-certificate/", "c144/m4/")
LEAN_FILES = ["research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/SignedStressEnergyGate.lean"]


def verify_members(raw, parse, bound):
    members = {}
    for packet in PACKETS:
        manifest = packet + "MANIFEST.json"
        assert entry(raw(manifest))["sha256"] == bound[packet]["manifestSHA256"]
        members[manifest] = "A"
        for leaf, fingerprint in parse(manifest)["files"].items():
            assert Path(leaf).name == leaf
            assert entry(raw(packet + leaf))["sha256"] == fingerprint
            members[packet + leaf] = "A"
    pressure = parse(PACKETS[0] + "pressure-readback.json")
    assert pressure["oldRefreshedMeanPressureRoot"] == 22152569 and pressure["dropChiDerivativeDistinct"]
    assert pressure["originalSourceRecords"] == 22380596
    assert raw(PACKETS[0] + "pressure-readback.json") == raw(PACKETS[0] + "pressure-readback-repeat.json")
    assert raw(PACKETS[1] + "fixture-replay-1.json") == raw(PACKETS[1] + "fixture-replay-2.json")
    for name in ("a21-boundary", "a21-operands"):
        assert raw(PACKETS[2] + name + ".json") == raw(PACKETS[2] + name + "-repeat.json")
    assert parse("c144/hosted-registration-status.json")["databaseId"] == 44698543085
    for name in ("hosted-registration-status.json","hosted-lean.json","SignedStressEnergyGate.log"):
        members["c144/" + name] = "A"
    return members


def verify_lean(raw, parse, git, head, state):
    receipt = parse("c144/hosted-lean.json")
    assert receipt["conclusion"] == "success" and receipt["status"] == "completed"
    assert state["newLeanRuns"] == [receipt["databaseId"]] == [44713557375]
    assert state["lastVerifiedLeanRun"] == receipt["databaseId"] and state["newLeanFailedRuns"] == []
    assert any(step["name"] == "Compile and record proof assumptions" and step["conclusion"] == "success"
               for job in receipt["jobs"] for step in job["steps"])
    path, = LEAN_FILES
    name = Path(path).stem
    source = git("show", f"{head}:{path}")
    assert source == git("show", f'{receipt["headSha"]}:{path}')
    assert entry(source)["sha256"] == receipt["verifiedSourceSHA256"][name]
    log = raw(f"c144/{name}.log")
    for theorem in (b"centered_radial_pressure_increment",b"centered_radial_pressure_increment_abs_le"):
        assert b".CD." + theorem + b"'" in log
    assert b"error:" not in log and b"sorryAx" not in log
    assert entry(log)["sha256"] == receipt["compiledProofLogSHA256"][name]


def assemble(args):
    outputs = args.workspace/"outputs"

    def git(*params):
        return subprocess.check_output(["git", "-c", "core.longpaths=true", *params], cwd=args.repo)

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH
    git("merge-base", "--is-ancestor", PARENT, head)

    def raw(path):
        return git("show", f"{head}:{CURRENT}/{path}")

    def parse(path):
        return json.loads(raw(path))

    preserve = parse(PUBLIC)
    assert preserve["authenticatedPageIndex"]["version"] == preserve["authenticatedCurrentVersion"]["version"] == 137
    assert preserve["authenticatedPageIndex"]["version_hash"] == preserve["authenticatedCurrentVersion"]["hash"] == "9171eb0c"
    refs = {f"refs/heads/{name}": sha for name, sha in preserve["protectedRemoteRefs"].items()}
    refs[f"refs/heads/{BRANCH}"] = head
    checked = {ref: sha for sha, ref in (line.split() for line in git("ls-remote", "origin", *refs).decode().splitlines())}
    assert checked == refs
    assert preserve["bytes"] == 30707818 == args.public_copy.stat().st_size
    assert preserve["sha256"] == PUBLIC_SHA == file_sha(args.public_copy)
    state = parse(STATUS)
    assert state["M3"] == {"accepted": 62, "total": 64, "open": ["N7-06", "N8-05"]}
    assert state["finalJets"] == "0/67" and state["release"] == "HOLD"
    assert state["operatingR108"] == "OPEN" and state["wholeK1"] == "OPEN"
    assert set(state["packets"]) == set(PACKETS)
    groups = verify_members(raw, parse, state["packets"])
    verify_lean(raw, parse, git, head, state)
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation144.py"):
        groups[name] = "A"
    expected = {f"{CURRENT}/{name}": op for name, op in groups.items()}
    expected.update({path: "M" for path in LEAN_FILES})
    changed = {path: operation for operation, path in
               (row.split("\t") for row in git("diff", "--name-status", "--no-renames", PARENT, head).decode().splitlines())}
    assert changed == expected, (set(changed)-set(expected), set(expected)-set(changed))

    previous = {}
    for name, digest in PARENTS.items():
        package = outputs/name
        assert file_sha(package) == digest, name
        with ZipFile(package) as bundle:
            previous.update(json.loads(bundle.read("SHA256.json")))
    delta = outputs/f"{LABEL}_Delta_{DATE}.zip"
    pending = delta.with_suffix(".zip.tmp")
    files = {}
    with ZipFile(pending, "w", compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(path, data):
            assert path not in files, path
            bundle.writestr(path, data)
            files[path] = entry(data)

        for path, operation in changed.items():
            if operation == "M" and path in previous:
                assert entry(git("show", f"{PARENT}:{path}")) == previous[path], path
            add(path, git("show", f"{head}:{path}"))
        add("REPORT_KO.md", raw(REPORT))
        add("STATUS.json", raw(STATUS))
        add("CHECKPOINT.json", encode({
            "schema": "MathScope.GoalEvidenceDelta/1", "parentsInOrder": PARENTS,
            "parentCommit": PARENT, "deltaCommit": head, "verifiedRemoteRefs": refs,
            "priorReadOnlyPublicSnapshotSHA256": PUBLIC_SHA,
            "filesThatSupersedeParents": sorted(set(files) & set(previous)), "release": "HOLD",
        }))
        bundle.writestr("SHA256.json", encode(files))
    with ZipFile(pending) as bundle:
        assert bundle.testzip() is None and len(bundle.namelist()) == len(files) + 1
        assert json.loads(bundle.read("SHA256.json")) == files
        for path, record in files.items():
            with bundle.open(path) as stream:
                assert sha256_stream(stream) == record["sha256"], path
            assert bundle.getinfo(path).file_size == record["bytes"], path
    pending.replace(delta)
    receipt = {"file": delta.name, "bytes": delta.stat().st_size, "files": len(files)+1,
               "sha256": file_sha(delta), "branchHead": head, "lastVerifiedLeanRun": state["lastVerifiedLeanRun"],
               "newHostedLeanTheorems": 2, "conditionalFirstCorrectionEnergy": "<17*2^-33", "axialSourcePrefix": 12,
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "conditionalProtectedEikonalFirstSpatialDerivatives": True, "activeNativeReadbackVerified": True, "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
