"""Rebuild the C139 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation138 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "af03cb7819e1dae9bc97ea78f9a40489ad9a5d06"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation138_Delta_20261120.zip":
           "a830cb799f65d52b472c9369a6a7bf981b87efd9bd7ccd0892d201d5f320345d"}
LABEL = "MathScope_Goal_Continuation139"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION139_KO.md", "STATUS_CONTINUATION139.json"
PUBLIC = "preservation-continuation139.json"
PACKETS = (
    "c139/fixed-reference-stencil/",
    "c139/reference-seam/",
    "c139/y-active-live/",
    "c139/y-python-stream/",
    "c139/m4-r108/",
    "c139/window-transition/",
)
LEAN_FILES = [
    "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/FrozenMesh.lean",
    "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ReferenceIngress.lean",
]


def verify_members(raw, parse, bound):
    members = {}
    for path in PACKETS:
        manifest = path + "MANIFEST.json"
        assert entry(raw(manifest))["sha256"] == bound[path]["manifestSHA256"]
        members[manifest] = "A"
        for leaf, fingerprint in parse(manifest)["files"].items():
            assert Path(leaf).name == leaf and leaf != "MANIFEST.json"
            assert entry(raw(path + leaf))["sha256"] == fingerprint
            members[path + leaf] = "A"
    stencil = parse(PACKETS[0] + "fixed-reference-stencil.json")
    assert stencil["exactTrials"] == 1536 and stencil["signedRegistryRows"] == 162
    assert raw(PACKETS[0] + "fixed-reference-stencil.json") == raw(PACKETS[0] + "fixed-reference-stencil-replay.json")
    y = parse("c139/y-active-live/result.json")
    assert y["actualTransportCount"] == 1694 and y["structuralReach"]["afterLiteralCalls"] == 567
    independent = parse("c139/y-python-stream/python-stream.json")
    assert independent["allOriginalNodes"] == 22380596 and independent["verifiedReachableRecords"] == 379603
    assert independent["reachedLiteralCalls"] == 567 and independent["streamSHA256"] == y["streamSHA256"]
    assert parse("c139/window-transition/window-transition.json")["rationalTransitionChecks"] == 81
    hosted = "c139/hosted-registration-status.json"
    receipt = parse(hosted)
    assert receipt["databaseId"] == 44698543085 and receipt["status"] == "in_progress"
    members[hosted] = "A"
    for name in ("hosted-lean.json", "FrozenMesh.log", "ReferenceIngress.log"):
        members["c139/" + name] = "A"
    for run in (44703316076, 44703846267):
        failure = f"c139/FrozenMesh-failed-{run}.log"
        assert b"Application type mismatch" in raw(failure)
        assert b"has type" in raw(failure) and b"f j" in raw(failure)
        members[failure] = "A"
    return members


def verify_lean(raw, parse, git, head, state):
    receipt = parse("c139/hosted-lean.json")
    assert receipt["conclusion"] == "success" and receipt["status"] == "completed"
    assert state["newLeanRuns"] == [receipt["databaseId"]]
    assert state["newLeanFailedRuns"] == [44703316076, 44703846267]
    assert state["lastVerifiedLeanRun"] == receipt["databaseId"]
    assert any(step["name"] == "Compile and record proof assumptions" and step["conclusion"] == "success"
               for job in receipt["jobs"] for step in job["steps"])
    names = ("adjacent_nearest_stencils_agree", "positive_physical_scale_exists_unique")
    for path, theorem in zip(LEAN_FILES, names, strict=True):
        source = git("show", f"{head}:{path}")
        assert source == git("show", f'{receipt["headSha"]}:{path}')
        name = Path(path).stem
        assert entry(source)["sha256"] == receipt["verifiedSourceSHA256"][name]
        log = raw(f"c139/{name}.log")
        assert theorem.encode() in log and b"sorryAx" not in log and b"error:" not in log
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation139.py"):
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
               "newHostedLeanTheorems": 2, "conditionalFirstCorrectionEnergy": "<17*2^-33", "axialSourcePrefix": 12,
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "conditionalProtectedEikonalFirstSpatialDerivatives": True, "activeNativeReadbackVerified": True, "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
