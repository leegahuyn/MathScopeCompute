"""Rebuild the C140 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation139 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "9ff604c37c5eb16966ff6bfdb34f2740231d1be2"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation139_Delta_20261120.zip":
           "d30f3b472a577e55d95064f1e2f29fee0321b62b8eea83ed1278d1c4bef980b3"}
LABEL = "MathScope_Goal_Continuation140"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION140_KO.md", "STATUS_CONTINUATION140.json"
PUBLIC = "preservation-continuation140.json"
PACKETS = (
    "c140/reference-radial-envelope/",
    "c140/stress-support/",
    "c140/y-eta5/",
    "c140/y-natural-refinement/",
)
LEAN_FILES = ["research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/SignedStressEnergyGate.lean"]


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
    radial = parse(PACKETS[0] + "native-radial-envelopes.json")
    assert radial["sourceRecords"] == 22380596 and radial["nativeSignedRows"] == 4698
    assert len(radial["nativeGuardedFields"]) == 29 and len(radial["pairsInNativeAST"]) == 6
    assert radial["wrongUpperRejected"]
    support = parse(PACKETS[0] + "mean-support-replay.json")
    assert len(support["pdeSummands"]) == 6 and len(support["remainderSummands"]) == 11
    assert len(support["negativeControls"]) == 9 and support["abstractNodes"] == 393
    assert raw(PACKETS[1] + "verified-replay-1.json") == raw(PACKETS[1] + "verified-replay-2.json")
    phi = parse(PACKETS[3] + "phi-y4.json")
    assert phi["originalSourceCall"] == 4468 and phi["interval"]["widthExact"] == "2^-260"
    assert raw(PACKETS[3] + "phi-y4.json") == raw(PACKETS[3] + "phi-y4-repeat.json")
    receipt = parse("c140/hosted-registration-status.json")
    assert receipt["databaseId"] == 44698543085
    assert receipt["status"] in ("in_progress", "completed")
    for name in ("hosted-registration-status.json", "hosted-lean.json", "SignedStressEnergyGate.log"):
        members["c140/" + name] = "A"
    return members


def verify_lean(raw, parse, git, head, state):
    receipt = parse("c140/hosted-lean.json")
    assert receipt["conclusion"] == "success" and receipt["status"] == "completed"
    assert state["newLeanRuns"] == [receipt["databaseId"]] == [44707675038]
    assert state["lastVerifiedLeanRun"] == receipt["databaseId"]
    assert any(step["name"] == "Compile and record proof assumptions" and step["conclusion"] == "success"
               for job in receipt["jobs"] for step in job["steps"])
    path, = LEAN_FILES
    name = Path(path).stem
    source = git("show", f"{head}:{path}")
    assert source == git("show", f'{receipt["headSha"]}:{path}')
    assert entry(source)["sha256"] == receipt["verifiedSourceSHA256"][name]
    log = raw(f"c140/{name}.log")
    assert b"centered_radial_primitive_same_on_two_envelopes" in log
    assert b"sorryAx" not in log and b"error:" not in log
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation140.py"):
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
               "newHostedLeanTheorems": 1, "conditionalFirstCorrectionEnergy": "<17*2^-33", "axialSourcePrefix": 12,
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "conditionalProtectedEikonalFirstSpatialDerivatives": True, "activeNativeReadbackVerified": True, "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
