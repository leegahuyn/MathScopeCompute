"""Rebuild the C121 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation120 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "3ef871bf58b1d172572f5a29f67da22cdefa81c2"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation120_Delta_20261120.zip":
           "e01d71a77cdb5861275b342503743bb16b6ef343630bf26170503a4018f47ed5"}
LABEL = "MathScope_Goal_Continuation121"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION121_KO.md", "STATUS_CONTINUATION121.json"
PUBLIC = "preservation-continuation121.json"
PACKETS={
    "c121/repeat-source-time-limit/":("MANIFEST.json","filesSHA256"),
    "c121/repeat-joint-native-bracket/":("MANIFEST.json","producedFiles"),
    "c121/original-run-recovery/":("MANIFEST.json","producedFiles"),
    "c121/axis-reference-extension/":("MANIFEST.json","producedFiles"),
}
FULL_RETRY=[".github/workflows/mathscope-original-primary-c5.yml","tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-weights/live-c5/run_live_primary_c5.mjs","tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-join/active-n3-c5-binding/spatial-stage1/emit_first_spatial.mjs","tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-join/active-n3-c5-binding/repeat-candidate-preflight/emit_active_n3_repeat_candidate.mjs","tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-join/active-n3-c5-binding/run_anchored_repeat_candidate.mjs"]


def verify_members(raw,parse,bound):
    files={}
    for root,(manifest,key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"]==bound[root]["manifestSHA256"],root
        files[root+manifest]="A"
        for leaf,digest in parse(root+manifest)[key].items():
            assert Path(leaf).name==leaf and leaf!=manifest
            assert entry(raw(root+leaf))["sha256"]==digest,(root,leaf)
            files[root+leaf]="A"
    recovery=parse("c121/original-run-recovery/recovery.json")
    assert (recovery["failedRun"],recovery["retryRun"])==(44668251828,44682703381)
    assert recovery["failureClassification"]=="SOURCE_TIME_LIMIT" and recovery["activeAppendedRecordsEmitted"]==0
    assert recovery["verifiedProtectedSpatialRecords"]==22155584 and recovery["independentlyReproducedDirectSplitZeroPolynomials"]==4
    assert recovery["retryOwnedLimits"]=={"minutes":175,"jobMinutes":195,"rssGiB":12,"nodes":25000000}
    independent=parse("c121/repeat-source-time-limit/MANIFEST.json")
    assert independent["twoPassMatchedBytes"] and independent["protectedNodes"]==22155584
    guard=parse("c121/repeat-joint-native-bracket/MANIFEST.json")["checks"]
    assert guard["counterexample"]=={"b":"2","s":"3/4","sRef":"3/8"}
    assert guard["registeredPredecessorRows"]==162 and guard["activeRepeatRegistration"]=="OPEN"
    axis=parse("c121/axis-reference-extension/axis-reference-extension.json")
    assert axis["ordinaryRootDerivativeLower"]=="127/128"
    assert axis["namedActiveRepeatRegisterCalls"]=="OPEN"
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
    assert state["lastVerifiedLeanRun"] == 44681551627 and state["newLeanRuns"] == []
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation121.py"):
        groups[name] = "A"
    expected = {f"{CURRENT}/{name}": op for name, op in groups.items()}
    expected.update({name: "M" for name in FULL_RETRY})
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
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "protectedRepeatPredecessorReplayedNodes": 22155584, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
