"""Rebuild the C128 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation127 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "44aee8c91a6be230e7f8efe981d4a5632c408cae"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation127_Delta_20261120.zip":
           "83e62d491ac9d2f11d247a605c0075123c2686890a76a8e92060cfdd4d09b6e4"}
LABEL = "MathScope_Goal_Continuation128"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION128_KO.md", "STATUS_CONTINUATION128.json"
PUBLIC = "preservation-continuation128.json"
PACKETS = (
    "c128/pressure-presigned/",
    "c128/compact-high-tt/",
    "c128/compact-pressure-coverage/",
    "c128/sigma-high-time/",
    "c128/post-signed-rz-z3t/",
    "c128/late-pressure-wave-inputs/",
    "c128/post-signed-rz-z3t-l2/",
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
    early = parse(PACKETS[0]+"pressure-covariance.json")
    assert early["covarianceCommonLogRankHOver2Pow128"] == 357940
    assert len(early["covarianceRows"]) == 18 and len(early["targetGaugeDirections"]) == 60
    assert entry(raw(PACKETS[1]+"compact-high-tt.json"))["sha256"] == "cb3c664e8c43e15b9dbe9fe0f290cdea881b7c01a557a0c62149ba1b275e2ef7"
    assert entry(raw(PACKETS[2]+"coverage.json"))["sha256"] == "3ac0131ed8c4082dd3be8b25797c818114b3c8a0cd81837927ae52066529aeb6"
    sigma = parse(PACKETS[3]+"sigma-high-time.json")
    assert sigma["common"] == {"epsilon":"1", "band":"125/2", "pole":42,
                               "logCoefficientUnitsHOver2Pow128":524338, "gaussian":"zeta"}
    later = parse(PACKETS[4]+"post-signed-wrz-z3t.json")
    assert later["wholePathEpsilonGrade"] == "99999/100000"
    assert later["finalJets"] == 0 and later["release"] == "HOLD"
    assert entry(raw(PACKETS[6]+"post-signed-wrz-z3t-l2.json"))["sha256"] == "a120c9485ad1baef7f5b64bbb3573dd93bac76381c8eda155e7e24058dd9e092"
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
    assert state["lastVerifiedLeanRun"] == 44689157294 and state["newLeanRuns"] == []
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation128.py"):
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
