"""Rebuild the C147 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation146 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "0b9cceb4ef8fef2537f14eef4abfe7638b12ba9a"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation146_Delta_20261120.zip":
           "8405db365098cd918dce244b0ba085e2772471af83fa5f1dd6838d3a3e15c0e0"}
LABEL = "MathScope_Goal_Continuation147"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION147_KO.md", "STATUS_CONTINUATION147.json"
PUBLIC = "preservation-continuation147.json"
PACKETS = ("c147/registration-recovery/",)
LEAN_FILES = []
REGISTRATION = f"{CURRENT}/primary-forced-join/active-n3-c5-binding"
SOURCE_CHANGES = {
    f"{REGISTRATION}/load_first_cycle_overlays.mjs":"M",
    f"{REGISTRATION}/repeat-indexed-registration/emit_repeat_indexed_registration.mjs":"M",
    f"{REGISTRATION}/repeat-indexed-registration/README.md":"M",
    f"{REGISTRATION}/repeat-indexed-registration/replay_hosted_effective_assembly.py":"A",
}


def verify_members(raw, parse, bound):
    packet, = PACKETS
    manifest = packet+"MANIFEST.json"
    assert entry(raw(manifest))["sha256"] == bound[packet]["manifestSHA256"]
    members={manifest:"A"}
    for leaf,pin in parse(manifest)["files"].items():
        assert Path(leaf).name==leaf and leaf!="MANIFEST.json"
        assert entry(raw(packet+leaf))["sha256"]==pin
        members[packet+leaf]="A"
    artifact=parse(packet+"archive-api.json")
    assert artifact["id"]==14620515097 and artifact["workflow_run"]["id"]==44698543085
    old=parse(packet+"original-source-export-manifest.json")
    assert old["node_count"]==22380596
    assert old["node_stream_sha256"]=="7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"
    assert raw(packet+"archived-pressure-readback.json")==raw("c144/postfive-pressure/pressure-readback.json")
    assert b"Unexpected original Forced assembly bytes" in raw(packet+"failure-excerpt.log")
    preflight=parse(packet+"corrected-preflight.json")
    assert preflight["status"]=="PASS_PINNED_REPEAT_EFFECTIVE_ASSEMBLY"
    assert preflight["failClosedControls"]=={"changedCheckout":True,"changedEffectiveOverlay":True}
    assert raw(packet+"corrected-preflight.json")==raw(packet+"corrected-preflight-repeat.json")
    retry=parse(packet+"retry-run.json")
    assert retry["databaseId"]==44717711039 and retry["headSha"]=="596ae9b0dceb65987f828b662f37f23a4306963c"
    for leaf in ("offline-append.jsonl","offline-definitions.json","offline-report.json"):
        assert raw(packet+"offline-replay1-"+leaf)==raw(packet+"offline-replay2-"+leaf)
    offline=parse(packet+"offline-replay1-offline-report.json")
    assert (offline["newFields"],offline["newTypedRows"],offline["newExpressions"])==(4,648,16)
    assert offline["endExclusive"]-offline["firstAppendNode"]==1994
    assert not offline["actualLiveRegistration"] and not offline["nativeHydrationPerformed"]
    assert offline["appendedNodeSHA256"]=="3d0538045a0927ac3389281222d346139fa8c9647a061372dd4177696bab859f"
    return members


def verify_lean(raw, parse, git, head, state):
    assert state["lastVerifiedLeanRun"]==44716395946 and state["newLeanRuns"]==state["newLeanFailedRuns"]==[]
    assert state["Y"]["originalFirstFiveMapRadialInputVerified"]==519


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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation147.py"):
        groups[name] = "A"
    expected = {f"{CURRENT}/{name}": op for name, op in groups.items()}
    expected.update(SOURCE_CHANGES)
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
