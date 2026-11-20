"""Rebuild the C125 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation124 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "2ce60f9d26a9207f31c7224f67c00b1b0e1b2d71"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation124_Delta_20261120.zip":
           "542f4e2c56e42fbb8cbb6329b10e9f3ae38e15bf60ef9487399533a656ac0ad0"}
LABEL = "MathScope_Goal_Continuation125"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION125_KO.md", "STATUS_CONTINUATION125.json"
PUBLIC = "preservation-continuation125.json"
PACKETS = (
    "c125/forced-mixed-rzt-z4t/",
    "c125/sigma-extra-mean/",
    "c125/sigma-mixed-join/",
    "c125/sigma-rzt-zzt/",
    "c125/signed-local-rzt-zzt/",
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
    force = parse(PACKETS[0]+"forced-rzt-z4t.json")
    assert force["covarianceCommonLogRankHOver2Pow128"] == 258240
    assert len(force["covarianceRows"]) == 12 and force["finalJets"] == 0
    assert entry(raw(PACKETS[1]+"replay1.json")) == entry(raw(PACKETS[1]+"replay2.json"))
    joint = parse(PACKETS[2]+"sigma-mixed-join.json")
    assert joint["nativeSigmaRoots"] == [22001223, 22001224]
    assert joint["common"] == {"epsilon":"1", "band":"113/2", "pole":36,
                               "logCoefficientUnitsHOver2Pow128":524332, "gaussian":"zeta"}
    assert joint["status"] == "CONDITIONAL_AUTHENTICATED_ORIGINAL_MIXED_SIGMA" and joint["finalJets"] == 0
    assert entry(raw(PACKETS[3]+"sigma-rzt-zzt-dependencies.json"))["sha256"] == "569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b"
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation125.py"):
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
