"""Rebuild the C126 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation125 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "7c2aa1b14b5e37f94fb70f487faf0907a51b616e"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation125_Delta_20261120.zip":
           "4565c5833e9ad76a3ddaae1facfc367f4a3fd372f44ed2513d959709e674e140"}
LABEL = "MathScope_Goal_Continuation126"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION126_KO.md", "STATUS_CONTINUATION126.json"
PUBLIC = "preservation-continuation126.json"
PACKETS = (
    "c126/post-signed-theta-z-zt/",
    "c126/late-wrz-mixed-frontier/",
    "c126/late-swirl-time/",
)


def verify_members(raw, parse, bound):
    members = {}
    for path in PACKETS:
        manifest = path+"MANIFEST.json"
        assert entry(raw(manifest))["sha256"] == bound[path]["manifestSHA256"]
        members[manifest] = "A"
        for leaf, digest in parse(manifest)["files"].items():
            assert Path(leaf).name == leaf and leaf != "MANIFEST.json"
            assert entry(raw(path+leaf))["sha256"] == digest
            members[path+leaf] = "A"
    full = parse(PACKETS[0]+"post-signed-theta-z-mixed.json")
    assert full["status"] == "CONDITIONAL_NARROW_ACTUAL_POST_SIGNED_COVARIANCE"
    assert full["RZTL"] == [[0,1,1,0],[0,1,1,2]]
    assert full["finalJets"] == 0 and full["release"] == "HOLD"
    assert entry(raw(PACKETS[0]+"post-signed-theta-z-mixed.json"))["sha256"] == "f8c5e82cad7a51693d979232216a40a8ba07e0e7eba4045a3fd4c353cb0d9f8b"
    assert entry(raw(PACKETS[1]+"late-wrz-mixed-frontier.json"))["sha256"] == "5db77c948687ee351a42ce0ac027513d6986c04e9a14b40b3ae181cf7c652f19"
    assert entry(raw(PACKETS[2]+"replay.json")) == entry(raw(PACKETS[2]+"replay2.json"))
    assert entry(raw(PACKETS[2]+"replay.json"))["sha256"] == "24591e84cd0c571fe18687b1884ea9def7945c3c6ece12dc51d3572b417dd34e"
    return members


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
    assert state["lastVerifiedLeanRun"] == 44685389813 and state["newLeanRuns"] == []
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation126.py"):
        groups[name] = "A"
    expected = {f"{CURRENT}/{name}": op for name, op in groups.items()}
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
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "conditionalProtectedEikonalFirstSpatialDerivatives": True, "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
