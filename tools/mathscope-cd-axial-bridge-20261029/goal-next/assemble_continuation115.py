"""Rebuild the C115 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation114 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "9414188f128c1c505ae1670ca78109818828f713"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation114_Delta_20261120.zip":
           "252e8762bb476ded7ede0bb904bfda3f1e9e84384048af9ab4f395211e89624c"}
LABEL = "MathScope_Goal_Continuation115"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION115_KO.md", "STATUS_CONTINUATION115.json"
PUBLIC = "preservation-continuation115.json"
PACKETS = {
    "c115/first-cycle-pressure-modes/": ("MANIFEST.json", "producedFiles"),
    "c115/j2-radial-time/": ("MANIFEST.json", "filesSHA256"),
    "c115/j2-mixed-time-stencil/": ("MIXED-T-MANIFEST.json", "filesSHA256"),
    "c115/k2-first-forced-time-transfer/": ("MANIFEST.json", "files"),
    "c115/y-n5-mixed-eta-bank/": ("MANIFEST.json", "producedFiles"),
}


def verify_members(raw, parse, bound):
    files = {}
    for root, (manifest, key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"] == bound[root]["manifestSHA256"], root
        files[root+manifest] = "A"
        for leaf, digest in parse(root+manifest)[key].items():
            assert Path(leaf).name == leaf and leaf != manifest
            assert entry(raw(root+leaf))["sha256"] == digest, (root, leaf)
            files[root+leaf] = "A"
    pressure = parse("c115/first-cycle-pressure-modes/first-cycle-pressure-support.json")
    assert pressure["pressureRoot"] == 22153227 and pressure["authenticatedSourceRecords"] == 22155584
    assert len(pressure["angleFreePressureLeaves"]) == 9
    assert [x["sameVelocityRows"] for x in pressure["physicalPressureAngularFields"]] == [162, 162]
    assert [len(x["samePhaseArguments"]) for x in pressure["physicalPressureAngularFields"]] == [40, 20]
    bound = pressure["combinedFirstCycleBound"]
    assert (bound["pressureCandidateSupportAtMost"], bound["cylindricalCompleteForceCandidateSupportAtMost"],
            bound["horizontalCartesianCompleteForceCandidateSupportAtMost"]) == (193, 18497, 36994)
    radial = parse("c115/j2-radial-time/MANIFEST.json")
    assert (radial["reportedJetOperands"], radial["timeRows"], radial["storedPrimitivePulseNodesAtOrderZero"]) == (1760, 120, 1080)
    assert radial["actualRadialJointTrace"] == "OPEN" and radial["fullActiveAppend"] == "AWAITED"
    native = parse("c115/j2-mixed-time-stencil/MIXED-T-MANIFEST.json")
    assert (native["counts"]["nativeSystems"], native["counts"]["nativeCoefficientOrderPairs"]) == (20, 100)
    assert native["actualJointTrace"] == "OPEN"
    mode = parse("c115/k2-first-forced-time-transfer/MANIFEST.json")
    assert (mode["mixedRows"], mode["positiveTRows"], mode["originalModeTwoMonomials"]) == (20, 10, 1270)
    assert mode["byteIdenticalCompleteReplays"] == 2 and mode["modeOne"] == "OPEN_JOINT_MEAN_T"
    y = parse("c115/y-n5-mixed-eta-bank/MANIFEST.json")["checks"]
    assert (y["originalNodes"], y["leadingRadialOrder"], y["leadingEtaOrder"]) == (130926, 2, 9)
    assert [row["FU"] for row in y["wholeOrders"]] == [7, 5, 3] and y["pairedWholeN5"] == "OPEN"
    assert y["wrongN5SourceNumerators"] == [1, 1, 2, 2]
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
    assert state["lastVerifiedLeanRun"] == 44674625991 and state["newLeanRuns"] == []
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation115.py"):
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
               "sameWholeFieldConvergenceAxes": 0, "firstCyclePressureAngularRows": 324, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
