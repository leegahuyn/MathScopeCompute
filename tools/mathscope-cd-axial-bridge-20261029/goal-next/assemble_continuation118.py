"""Rebuild the C118 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation117 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "045addc946f314d03d3b72b66c59bb6e2d1d60e3"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation117_Delta_20261120.zip":
           "b38f42c1b7cf695a4228e1e2912a11a394822d187b3718817f310d4dc0da6c60"}
LABEL = "MathScope_Goal_Continuation118"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION118_KO.md", "STATUS_CONTINUATION118.json"
PUBLIC = "preservation-continuation118.json"
PACKETS = {
    "c118/mode-one-signed-time/": ("MANIFEST.json", "files"),
    "c118/pure-sigma-time-join/": ("MANIFEST.json", "producedFiles"),
    "c118/moment-eta-materialization/": ("MANIFEST.json", "producedFiles"),
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
    m = parse("c118/mode-one-signed-time/MANIFEST.json")
    assert (m["gaugeDirections"],m["meanRoles"],m["covarianceDirections"],m["covarianceComponents"]) == (26,156,6,6)
    assert m["newSelectivePrimaryRoles"] == 10 and m["byteIdenticalCompleteReplays"] == 2
    p = parse("c118/pure-sigma-time-join/pure-sigma-time.json")
    assert p["actualNativeSigma"] == [22001223, 22001224] and len(p["exactCovarianceRoles"]) == 22
    assert p["status"] == "ORIGINAL_PURE_SIGMA_T_ATTACHED_CONDITIONAL_WEIGHTED_ENVELOPE"
    assert p["absoluteBound"] == {"epsilon":"1","gaussian":"zeta","band":"101/2","collarPole":35,
                                  "logCoefficientUnitsHOver2Pow128":524581}
    phase = parse("c118/pure-sigma-time-join/signed-pure-time-gauge.json")
    assert phase["pureTimeGauge"] == {"gaussian":"sqrt(zeta)","epsilon":"1","band":"275/4","collarPole":51,
                                    "middlePole":0,"logCoefficient":"H/2^107"}
    eta = parse("c118/moment-eta-materialization/MANIFEST.json")["checks"]
    assert eta["originalGraphUnchanged"] and eta["originalProtectedNodes"] == 135015
    assert (eta["originalMomentFamiliesThirdEta"],eta["originalCompactFixedEndpointIntegrals"]) == (12,11)
    assert eta["callerChosenOrders"] == [7,16,17] and eta["materializedCallerOrders"] == [7,16]
    assert eta["acceptedTopButNestedLimitAt"] == 17
    assert eta["nodeReplaysWithIdenticalThirdEtaBank"] == 3 and eta["byteIdenticalPythonReplays"] == 2
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
    assert state["lastVerifiedLeanRun"] == 44677599005 and state["newLeanRuns"] == []
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation118.py"):
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
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "pureSigmaTimeNativeRoles": 22, "pureSignedGaugeTime": "CONDITIONAL", "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
