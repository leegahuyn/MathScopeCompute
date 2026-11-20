"""Rebuild the C132 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation131 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "83816f01fba8d2accf46ec4dde5d05d8f6f26708"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation131_Delta_20261120.zip":
           "0280514a629afe21d6c572304d6079a55256df95e8bae688d5585e694a6ca541"}
LABEL = "MathScope_Goal_Continuation132"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION132_KO.md", "STATUS_CONTINUATION132.json"
PUBLIC = "preservation-continuation132.json"
PACKETS = (
    "c132/active-repeat-source/",
    "c132/fivemap-presigned-z4t-l2/",
    "c132/fivemap-vzt-wave/",
    "c132/fivemap-old-mean/",
    "c132/fivemap-wave-coverage/",
    "c132/fivemap-wave-coverage-update/",
    "c132/temporal-mixed-fivemap/",
)
DOCUMENTATION = "c131/fivemap-postsigned-z4t/"


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
    corrected = parse(DOCUMENTATION+"MANIFEST.json")
    assert corrected["supersedesDocumentationManifestSHA256"] == "10008745a8bfc22036a6a7269a7d8156e0371a998b75034d7dde863e15b37a2c"
    assert corrected["originalFrozenManifestSHA256"] == "eb0a906712953560e8834c4a00e67ff4cf3a7436988ffbcef8492fc42a4d2d48"
    assert corrected["files"]["fivemap-postsigned-z4t.json"] == "8176592c2b8ef55c5901e5d368fc5bbc00a7997c4e2f81dd2f087acdebf135c6"
    members.update({DOCUMENTATION+leaf:"M" for leaf in ("MANIFEST.json","README.md","replay.log")})
    live = parse(PACKETS[0]+"active-readback.json")
    assert live["terminalRun"]["run"] == 44682703381 and live["originalAppendNodes"] == 225012
    assert entry(raw(PACKETS[0]+"terminal-run.json"))["sha256"] == live["terminalRun"]["terminalSha256"]
    assert live["appendedRegistryCounts"] == [914,0,0,40,0]
    assert live["stream"]["nodes"] == 22380596 and live["stream"]["protectedPrefixNodes"] == 22155584
    assert live["stream"]["sha256"] == "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"
    assert live["mechanics"]["sourceScalars"] == 240 and live["mechanics"]["exactSourceSubtractIdentities"] == 480
    assert len(live["mechanics"]["candidatePulseSystems"]) == 40
    assert live["finalJets"] == 0 and live["release"] == "HOLD"
    pulse = parse(PACKETS[0]+"active-pulse.json")
    face = parse(PACKETS[0]+"active-nonradial.json")
    assert pulse["sourceStreamSHA256"] == face["streamSHA256"] == live["stream"]["sha256"]
    assert pulse["status"] == "CONDITIONAL_ACTIVE_ORIGINAL_CLOSED_PULSE_EQUALITY"
    assert face["status"] == "CONDITIONAL_ACTUAL_NONRADIAL_FACE_ATTACHMENTS"
    assert (face["checkedSignedBodies"], face["axisChecks"]) == (30,150)
    mean = parse(PACKETS[3]+"fivemap-old-mean.json")
    assert mean["requiredCount"] == 266 and mean["additionalAgainstPriorFrontierPins"] == 104
    assert entry(raw(PACKETS[6]+"mixed-temporal-bound.json"))["sha256"] == "800bc8a398af0d57504eafc205e8fbd6a79b31537de1d2fbf619bc6e4a8ec7d4"
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
    assert state["lastVerifiedLeanRun"] == 44692315167 and state["newLeanRuns"] == []
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation132.py"):
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
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "conditionalProtectedEikonalFirstSpatialDerivatives": True, "activeNativeReadbackVerified": True, "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
