"""Rebuild the C145 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation144 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "343d82fdb89e97b0805b99251bbd0a3a0deb1eb9"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation144_Delta_20261120.zip":
           "8c96cb7dc33695749a489cd2940209eeaecffda24be9f915599a45755a83f345"}
LABEL = "MathScope_Goal_Continuation145"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION145_KO.md", "STATUS_CONTINUATION145.json"
PUBLIC = "preservation-continuation145.json"
PACKETS = ("c145/y-ledger/",)
LEAN_FILES = []


def verify_members(raw, parse, bound):
    assert set(bound) == set(PACKETS)
    packet, = PACKETS
    manifest = packet + "MANIFEST.json"
    assert entry(raw(manifest))["sha256"] == bound[packet]["manifestSHA256"]
    members = {manifest:"A"}
    for leaf, fingerprint in parse(manifest)["files"].items():
        assert Path(leaf).name == leaf and leaf != "MANIFEST.json"
        assert entry(raw(packet + leaf))["sha256"] == fingerprint
        members[packet + leaf] = "A"
    key = packet + "admissions.json"
    assert raw(key) == raw(packet + "admissions-repeat.json")
    assert entry(raw(key))["sha256"] == "0c4e22f12545b2b6f2bdf20daa545b4a0e1b0ece485fd388977f20289c0b141f"
    admission = parse(key)
    assert admission["totalOriginalCallIds"] == 523 and admission["priorOfficialCount"] == 33
    old = {row["id"] for row in admission["priorOfficialRows"]}
    still_open = {row["id"] for row in admission["remainingOriginalRows"]}
    appendix = admission["evidenceBranchAdmissionAppendix"]
    additional = {row["id"] for row in appendix["newRows"]}
    assert len(old) == 33 and len(additional) == 109 and len(still_open) == 381
    assert sorted(additional) == appendix["newlyAdmissible"]
    assert len(old | additional | still_open) == 523 and appendix["locallyCertifiedCount"] == 142
    add = sorted(old | additional | still_open)
    from hashlib import sha256
    assert sha256(json.dumps(add,separators=(",",":")).encode()).hexdigest() == "962a016d25ad21fe54cf285ecd8192d2a7a47d9a6451a957c6bc9fac5b3d2b00"
    assert admission["negativeControl"] == {"addedUnboundRoot":10219,"openIds":[10219]}
    assert admission["requiresActualChartImageOrQWindowAssumptions"] is False
    assert admission["release"] == "HOLD" and admission["finalJets"] == 0
    hosted = "c145/hosted-registration-status.json"
    assert parse(hosted)["databaseId"] == 44698543085
    members[hosted] = "A"
    return members


def verify_lean(raw, parse, git, head, state):
    assert state["lastVerifiedLeanRun"] == 44713557375 and state["newLeanRuns"] == state["newLeanFailedRuns"] == []
    assert state["Y"]["originalFirstFiveMapRadialInputVerified"] == 142
    assert state["Y"]["unchangedPublishedRadialInputCount"] == 33


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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation145.py"):
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
               "newHostedLeanTheorems": 0, "conditionalFirstCorrectionEnergy": "<17*2^-33", "axialSourcePrefix": 12,
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "conditionalProtectedEikonalFirstSpatialDerivatives": True, "activeNativeReadbackVerified": True, "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
