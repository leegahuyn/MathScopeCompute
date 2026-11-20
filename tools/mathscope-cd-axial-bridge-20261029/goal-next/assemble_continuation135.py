"""Rebuild the C135 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation134 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "42f5ef7c32ea60958a61ec19bc08ccec7bdb1d50"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation134_Delta_20261120.zip":
           "267a3ae92bd69bd7c7c197a81e4ce147f2292f8ce5eb4fb4a4d1b9b4d25fc3c4"}
LABEL = "MathScope_Goal_Continuation135"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION135_KO.md", "STATUS_CONTINUATION135.json"
PUBLIC = "preservation-continuation135.json"
PACKETS = (
    "c135/radial-all-tt/",
    "c135/radial-pulse-vv/",
    "c135/radial-sigma-mixed/",
    "c135/radial-mean-cofactors/",
)
RUNNER = "primary-forced-join/active-n3-c5-binding/"
HOOK = RUNNER + "repeat-indexed-registration/"


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
    for path, first, replay, pin in (
        (PACKETS[0], "all-wave-tt.json", "all-wave-tt-replay.json", "0b2bc4cb556d2fcf45f2cc513f3e3fad2753bc01b256aa8226c6c5fe4037171d"),
        (PACKETS[1], "radial-pulse-vv.json", "radial-pulse-vv-replay.json", "21f501d7ebcb63a32871a992b15c95d31ed4abdb18240f311295e9e2032b5824"),
        (PACKETS[2], "replay1.json", "replay2.json", "847609b8d145c6ae52f9b6a96c7aa0764531f8c8767c97be619f0969f73d6184"),
        (PACKETS[3], "native-mean-cofactors.json", "native-mean-cofactors-replay.json", "d8e7199c846f822c554f569e555d2718ec38810851cd8ba8e224f7cc837d8cb3"),
        (PACKETS[3], "late-ordinary.json", "late-ordinary-replay.json", "3c9cf3fbf41b554761a6cc195d183f5035b25065425473059bf25134db414e80"),
    ):
        assert entry(raw(path + first))["sha256"] == pin
        assert raw(path + first) == raw(path + replay)
    for leaf in ("README.md", "build_repeat_indexed_increments.mjs", "emit_repeat_indexed_registration.mjs",
                 "native-indexed-registration-fixture.json", "test_native_indexed_registration.mjs",
                 "verify_repeat_indexed_attachment.py"):
        members[HOOK + leaf] = "A"
    fixture = parse(HOOK + "native-indexed-registration-fixture.json")
    assert fixture["installedRows"] == 648 and not fixture["activeRepeatFieldsRegistered"]
    members[RUNNER + "repeat-candidate-preflight/emit_active_n3_repeat_candidate.mjs"] = "M"
    members[RUNNER + "run_anchored_repeat_candidate.mjs"] = "M"
    hosted = "c135/hosted-registration-dispatch.json"
    candidate = parse(hosted)
    assert candidate["databaseId"] == 44698543085
    assert candidate["headSha"] == "7075c1c0d06805ff39d4417cc977d74b580d0cb9"
    assert candidate["status"] == "in_progress"
    members[hosted] = "A"
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation135.py"):
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
