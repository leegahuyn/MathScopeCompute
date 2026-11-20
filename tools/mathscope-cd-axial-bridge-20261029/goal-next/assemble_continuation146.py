"""Rebuild the C146 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation145 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "e6cab5851e099e031a84c542762560375c1bfc8c"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation145_Delta_20261120.zip":
           "32bb1d7a0f7cac72460998cd42687648a2ea78862080e37973704f86f653c0d8"}
LABEL = "MathScope_Goal_Continuation146"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION146_KO.md", "STATUS_CONTINUATION146.json"
PUBLIC = "preservation-continuation146.json"
PACKETS = ("c146/y-branch/", "c146/original-inverse-domain/", "c146/reference-bracket-guard/",
           "c146/y-native-transfer/", "c146/covered-reference-selection/", "c146/y-conditional-four/")
LEAN_FILES = ["research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ReferenceIngress.lean"]


def verify_members(raw, parse, bound):
    members = {}
    for packet in PACKETS:
        manifest = packet+"MANIFEST.json"
        assert entry(raw(manifest))["sha256"] == bound[packet]["manifestSHA256"]
        members[manifest] = "A"
        for leaf,fingerprint in parse(manifest)["files"].items():
            assert Path(leaf).name == leaf and leaf != "MANIFEST.json"
            assert entry(raw(packet+leaf))["sha256"] == fingerprint
            members[packet+leaf] = "A"
    y = parse(PACKETS[0]+"forward-branch.json")
    assert y["localRadialEvidenceCount"] == 511 and y["newSourceBoundRows"] == 369
    assert not y["nativeActualTransportUsed"] and not y["slowInverseImageUsed"]
    assert len(y["remainingOriginalRows"]) == 12
    assert raw(PACKETS[0]+"forward-branch.json") == raw(PACKETS[0]+"forward-branch-repeat.json")
    previous = parse("c145/y-ledger/admissions.json")
    after = {row["id"] for row in y["rows"]}
    remain = {row["id"] for row in y["remainingOriginalRows"]}
    before = {row["id"] for row in previous["remainingOriginalRows"]}
    assert len(after) == 369 and len(remain) == 12 and after.isdisjoint(remain)
    assert before == after | remain
    assert raw(PACKETS[1]+"replay-1.json") == raw(PACKETS[1]+"replay-2.json")
    assert raw(PACKETS[2]+"bracket-guard.json") == raw(PACKETS[2]+"bracket-guard-repeat.json")
    assert raw(PACKETS[3]+"native-transfers.json") == raw(PACKETS[3]+"native-transfers-repeat.json")
    assert entry(raw(PACKETS[3]+"native-transfers.json"))["sha256"] == "4b2bd7263c3b0c77c39b72262f14715c20f8771b588a8316c77dbc98a27bae4b"
    native = parse(PACKETS[3]+"native-transfers.json")
    extra = {row["id"] for row in native["newlyAdmissibleRows"]}
    last = set(native["openNominalIds"])
    assert len(extra) == 8 and last == {4758,4784,5177,5299}
    assert extra.isdisjoint(last) and remain == extra | last
    assert native["localRadialEvidenceCount"] == 519 and not native["root2BracketSignUsed"]
    assert raw(PACKETS[4]+"selection-replay.json") == raw(PACKETS[4]+"selection-repeat.json")
    assert parse(PACKETS[4]+"selection-replay.json")["testedClosedIntervalCells"] == 13124
    conditional = PACKETS[5]+"conditional-four.json"
    assert entry(raw(conditional))["sha256"] == "d4a59008e17e8d57b6048532fe567bf62210e22504a211eafd628a49100841ba"
    assert raw(conditional) == raw(PACKETS[5]+"conditional-four-repeat.json")
    assert parse("c146/hosted-registration-status.json")["databaseId"] == 44698543085
    for leaf in ("hosted-registration-status.json","hosted-lean.json","ReferenceIngress.log","ReferenceIngress-failed-44715537018.log"):
        members["c146/"+leaf] = "A"
    return members


def verify_lean(raw, parse, git, head, state):
    receipt = parse("c146/hosted-lean.json")
    assert receipt["conclusion"] == "success" and receipt["status"] == "completed"
    assert state["newLeanRuns"] == [receipt["databaseId"]]
    assert state["lastVerifiedLeanRun"] == receipt["databaseId"] and state["newLeanFailedRuns"] == [44715537018]
    assert state["Y"]["originalFirstFiveMapRadialInputVerified"] == 519
    assert any(step["name"] == "Compile and record proof assumptions" and step["conclusion"] == "success"
               for job in receipt["jobs"] for step in job["steps"])
    path, = LEAN_FILES
    name = Path(path).stem
    source = git("show", f"{head}:{path}")
    assert source == git("show", f'{receipt["headSha"]}:{path}')
    assert entry(source)["sha256"] == receipt["verifiedSourceSHA256"][name]
    log = raw("c146/ReferenceIngress.log")
    assert b".CD.near_reference_strict_native_bracket'" in log
    assert b"sorryAx" not in log and b"error:" not in log
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation146.py"):
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
               "newHostedLeanTheorems": 1, "conditionalFirstCorrectionEnergy": "<17*2^-33", "axialSourcePrefix": 12,
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "conditionalProtectedEikonalFirstSpatialDerivatives": True, "activeNativeReadbackVerified": True, "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
