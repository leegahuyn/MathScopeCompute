"""Rebuild the C131 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation130 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "d04a316ca1415d1751758106bf07295111046f14"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation130_Delta_20261120.zip":
           "3ed5187968eaeca042622b589a04d19e807c97558cf1c6819979374e38990fe7"}
LABEL = "MathScope_Goal_Continuation131"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION131_KO.md", "STATUS_CONTINUATION131.json"
PUBLIC = "preservation-continuation131.json"
PACKETS = (
    "c131/fivemap-velocity-time/",
    "c131/high-sigma/",
    "c131/fivemap-presigned-high/",
    "c131/high-sigma-join/",
    "c131/fivemap-postsigned-z4t/",
    "c131/lean-github/",
)
LEAN_PARENT = "f78d30c081ce66edc39e8b82fcb17057861bb398"
LEAN_RUN = 44692315167
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/RadialMomentChange.lean"
WORKFLOW_PATH = ".github/workflows/mathscope-cd-axial-bridge-20261029.yml"


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
    assert entry(raw(PACKETS[0]+"fivemap-velocity-time.json"))["sha256"] == "f91e6c15292c6970a95de7141d109e18ee5c0b57056e4a635faa6f23c9adddf7"
    assert entry(raw(PACKETS[0]+"protected-source-slice.json"))["sha256"] == "16ec39721dc4246515f99e5a997915db966c8d3f1a3ee244b91d1045848e1df1"
    assert entry(raw(PACKETS[1]+"compact.json"))["sha256"] == "e61537eec32ad24aebd7e77378f14d9e29fa2bbd9ae82b8a5e297708cc163273"
    assert entry(raw(PACKETS[1]+"local.json"))["sha256"] == "500cae19962ad0a9af7a9e82abec487d9c44192188791b701961bc9f67f6a5fa"
    assert entry(raw(PACKETS[2]+"fivemap-presigned-high.json"))["sha256"] == "6e1ad88c52194da61728f1985e2c0502b0008d62b4cc17543fa99089f8a2c663"
    assert entry(raw(PACKETS[3]+"join.json"))["sha256"] == "0018ec189d12d57e0d621b8e4dc4da9c67b2bfad3a57e9e09b9b28e969042297"
    assert entry(raw(PACKETS[4]+"fivemap-postsigned-z4t.json"))["sha256"] == "8176592c2b8ef55c5901e5d368fc5bbc00a7997c4e2f81dd2f087acdebf135c6"
    return members


def check_lean(raw, parse, git, head):
    root = "c131/lean-github/"
    ci = parse(root+"receipt.json")
    assert (ci["databaseId"],ci["headSha"],ci["conclusion"]) == (LEAN_RUN,LEAN_PARENT,"success")
    digest = ci["leanFileSHA256"]
    assert f"{digest}  MathScope/M3/CD/RadialMomentChange.lean" in raw(root+"source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    found = raw(root+"RadialMomentChange.log").decode()
    for name in ("radial_moment_change_of_variables","radial_moment_zero_of_profile_zero"):
        assert f"'MathScope.M3.CD.{name}' depends on axioms:" in found
    assert "sorryAx" not in found and "error:" not in found
    trial = parse(root+"cleanup-attempt.json")
    assert trial["databaseId"] == 44693131340 and trial["conclusion"] == "failure"
    assert b"error: unsolved goals" in raw(root+"cleanup-attempt.log")
    return ci["databaseId"]


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
    assert check_lean(raw, parse, git, head) == LEAN_RUN == state["lastVerifiedLeanRun"]
    assert state["newLeanRuns"] == [LEAN_RUN]
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation131.py"):
        groups[name] = "A"
    expected = {f"{CURRENT}/{name}": op for name, op in groups.items()}
    expected.update({LEAN_PATH: "A", WORKFLOW_PATH: "M"})
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
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "conditionalProtectedEikonalFirstSpatialDerivatives": True, "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
