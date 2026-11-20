"""Rebuild the C136 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation135 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "28bff58e121853aa211a04729866eaaea4add8f8"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation135_Delta_20261120.zip":
           "e63efa57627e534b2c5c83d1b2d229c2ebf8bced353f55c84f9a2407c9da5318"}
LABEL = "MathScope_Goal_Continuation136"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION136_KO.md", "STATUS_CONTINUATION136.json"
PUBLIC = "preservation-continuation136.json"
PACKETS = (
    "c136/radial-pulse-time/",
    "c136/radial-operator-hull/",
    "c136/radial-sigma-r2z2t/",
    "c136/radial-subtractions/",
    "c136/radial-mean-N/",
    "c136/radial-mean-ordinary/",
    "c136/radial-mean-reduced/",
    "c136/radial-mean-reduced-envelope/",
)
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/AnnularGaussianPole.lean"
LEAN_RECEIPT = "c136/hosted-lean.json"
LEAN_LOG = "c136/AnnularGaussianPole.log"
HOSTED_REGISTRATION = "c136/hosted-registration-status.json"


def verify_members(raw, parse, bound):
    members = {}
    for path in PACKETS:
        manifest = path + "MANIFEST.json"
        assert entry(raw(manifest))["sha256"] == bound[path]["manifestSHA256"]
        members[manifest] = "A"
        for leaf, digest in parse(manifest)["files"].items():
            assert Path(leaf).name == leaf and leaf != "MANIFEST.json"
            assert entry(raw(path + leaf))["sha256"] == digest
            members[path + leaf] = "A"
    for name in (LEAN_RECEIPT, LEAN_LOG, HOSTED_REGISTRATION):
        members[name] = "A"
    hosted = parse(HOSTED_REGISTRATION)
    assert hosted["databaseId"] == 44698543085 and hosted["status"] == "in_progress"
    return members


def verify_lean(raw, parse, git, commit, state):
    receipt = parse(LEAN_RECEIPT)
    assert receipt["conclusion"] == "success"
    assert receipt["status"] == "completed"
    assert receipt["databaseId"] == state["lastVerifiedLeanRun"]
    assert state["newLeanRuns"] == [receipt["databaseId"]]
    assert any(step["name"] == "Compile and record proof assumptions" and step["conclusion"] == "success"
               for job in receipt["jobs"] for step in job["steps"])
    proof = raw(LEAN_LOG)
    for theorem in (b"gaussianPole_face_quadratic", b"gaussianPole_face_quotient"):
        assert theorem in proof
    assert b"error:" not in proof and b"sorryAx" not in proof
    source = git("show", f"{commit}:{LEAN_PATH}")
    assert source == git("show", f'{receipt["headSha"]}:{LEAN_PATH}')
    assert entry(source)["sha256"] == receipt["provedSourceSHA256"]


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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation136.py"):
        groups[name] = "A"
    expected = {f"{CURRENT}/{name}": op for name, op in groups.items()}
    expected[LEAN_PATH] = "M"
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
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "conditionalProtectedEikonalFirstSpatialDerivatives": True, "activeNativeReadbackVerified": True, "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
