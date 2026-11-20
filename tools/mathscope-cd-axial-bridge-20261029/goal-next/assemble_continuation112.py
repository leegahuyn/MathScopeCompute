"""Rebuild the C112 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation111 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "b41cdb00437b93cdd0019323757768beb7bb59ee"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation111_Delta_20261120.zip":
           "d5b60749b76a09ac8723eaa6c39524c3a0d0bbbbbef242864c71316225d6ac08"}
LABEL = "MathScope_Goal_Continuation112"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION112_KO.md", "STATUS_CONTINUATION112.json"
PUBLIC = "preservation-continuation112.json"
PACKETS = {
    f"c112/{name}/": ("MANIFEST.json", "producedFiles")
    for name in ("axial-n12", "y-native-n4", "y-native-n4-paired-local", "m4-r108-readback")
}
PACKETS["c112/j2-transverse/"] = ("TRANSVERSE-MANIFEST.json", "filesSHA256")
PACKETS["c112/j2-slow-radial/"] = ("MANIFEST.json", "filesSHA256")
PACKETS["c112/k1-leaf-joins/"] = ("MANIFEST.json", "files")


def verify_members(raw, parse, bound):
    files = {}
    for root, (manifest, key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"] == bound[root]["manifestSHA256"], root
        files[root+manifest] = "A"
        for leaf, digest in parse(root+manifest)[key].items():
            assert Path(leaf).name == leaf and leaf != manifest
            assert entry(raw(root+leaf))["sha256"] == digest, (root, leaf)
            files[root+leaf] = "A"
    axial = parse("c112/axial-n12/n12-exact-prefix.json")
    assert (axial["order"], axial["nodeCount"]) == (12, 191573)
    assert (axial["rows"][0]["density"], axial["rows"][0]["originalStoredTotal"]) == (117047, 117075)
    last = axial["rows"][-1]
    assert (last["density"], last["forwardIntegral"], last["backwardIntegral"],
            last["wholeIntegral"]) == (165589, 165602, 165616, 191549)
    assert all(row["sourceFTC"]["negativeWrongSign"]["pass"] is False for row in axial["rows"])
    free = parse("c112/axial-n12/free-coordinate-control.log")
    assert (free["nodes"], free["integralBinders"], free["formalSignatures"]) == (167274, 7315, 319)
    n4 = parse("c112/y-native-n4/MANIFEST.json")["checks"]
    assert (n4["originalN4Nodes"], n4["retainedN3BaselinePrefixNodes"]) == (127241, 123870)
    assert n4["wholeOmega3Terms"] == [11, 11] and n4["exactFiveMoments"] == [0] * 5
    assert n4["originalDensities"] == {"theta": 127211, "z": 127212}
    assert n4["fixedHistoryStrictUniformLimit"] == "2^-256" and n4["pairedN4"] == "OPEN"
    paired = parse("c112/y-native-n4-paired-local/MANIFEST.json")["checks"]
    assert paired["pairedExactForcingNumerators"] == [0] * 4
    assert paired["omittedViscosityNumerator"] == 312 and paired["unchangedMatrixSlots"] == 72
    assert paired["localStrictUniformLimit"] == "2^-256" and paired["wholePairedN4"] == "OPEN"
    m4 = parse("c112/m4-r108-readback/r108-authenticated-readback.json")
    assert m4["version"] == 137 and m4["versionHash"] == "9171eb0c" and m4["productionWrites"] == 0
    assert m4["seoSubstitutionSizeMatches"] is False and m4["operatingR108"] == "OPEN"
    leaves = parse("c112/k1-leaf-joins/MANIFEST.json")
    assert (leaves["sourcePrefixRecords"], leaves["positiveMomentIdentities"]) == (123870, 15)
    assert leaves["orders"] == [0, 1, 2, 3] and leaves["firstCorrectionWhole"] == "CONDITIONAL"
    transverse = parse("c112/j2-transverse/TRANSVERSE-MANIFEST.json")
    assert (transverse["protectedWaveBodies"], transverse["wrongXiProofRejections"]) == (160, 70)
    assert transverse["sameRunningAppendAttachment"] == "OPEN"
    slow = parse("c112/j2-slow-radial/MANIFEST.json")
    assert (slow["slowAxisFaces"], slow["seedBodyAxisChecks"], slow["waveBodyAxisChecks"]) == (8, 400, 640)
    assert slow["originalPositiveTargetSquareRoot"] == 17733826 and slow["actualRadialLimit"] == "OPEN"
    return files


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
    assert state["lastVerifiedLeanRun"] == 44671298882 and state["newLeanRuns"] == []
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation112.py"):
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
               "newHostedLeanTheorems": 0, "conditionalFirstCorrectionEnergy": "<2^-28", "axialSourcePrefix": 12,
               "sameWholeFieldConvergenceAxes": 0, "nativeN4FixedHistoryStressCap": "<2^-256", "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
