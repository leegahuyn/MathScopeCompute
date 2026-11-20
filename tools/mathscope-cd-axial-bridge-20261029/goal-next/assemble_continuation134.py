"""Rebuild the C134 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation133 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "769a2d424013d4682a0c3e960b03923cabcc32f2"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation133_Delta_20261120.zip":
           "8e2e753b2583c5c9255c2813e114c33b8e528f585fdc1b76322137311e9e899f"}
LABEL = "MathScope_Goal_Continuation134"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION134_KO.md", "STATUS_CONTINUATION134.json"
PUBLIC = "preservation-continuation134.json"
PACKETS = (
    "c134/indexed-dispatch/",
    "c134/repeat-eikonal-fast-mean/",
    "c134/radial-c1-time-crop/",
    "c134/radial-time-gaussian/",
)


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
    dispatch = parse(PACKETS[0] + "indexed-dispatch.json")
    assert dispatch["signRows"] == 162 and dispatch["boxes"] == 81
    assert dispatch["modeInverseSystems"] == 40 and dispatch["conjugateScalarRows"] == 160
    assert dispatch["liveRepeatIndexedFields"] == 0 and dispatch["proposedRowInstallations"] == 648
    assert raw(PACKETS[0] + "indexed-dispatch.json") == raw(PACKETS[0] + "indexed-dispatch-replay.json")
    fast = PACKETS[1] + "protected-fast-mean"
    assert entry(raw(fast + ".json"))["sha256"] == "ad7ff7ce03985e2114a5881a8e8fc2bc2b576fe944c8d441b6b2468bca1a5221"
    assert raw(fast + ".json") == raw(fast + "-replay.json")
    for leaf, digest in {
        "frontier": "f18168fc7dc3e6183d9b4055c3a804a1657671e58eb004700e53606e908d11af",
        "nine-compact": "59448350deaad638240e80493f805825580ea932242c8d3c7c0aafb9c3a03528",
    }.items():
        assert entry(raw(PACKETS[2] + leaf + ".json"))["sha256"] == digest
        assert raw(PACKETS[2] + leaf + ".json") == raw(PACKETS[2] + leaf + "-replay.json")
    gaussian = PACKETS[3] + "radial-time-gaussian"
    scope = parse(gaussian + ".json")
    assert scope["status"] == "CONDITIONAL_FIXED_LABEL_ORIGINAL_RADIAL_WAVE_TT_TRACE"
    assert raw(gaussian + ".json") == raw(gaussian + "-repeat.json")
    assert scope["fullSupportedRepeatC1Claim"] is False and scope["uniformEpsilonClaim"] is False
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation134.py"):
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
