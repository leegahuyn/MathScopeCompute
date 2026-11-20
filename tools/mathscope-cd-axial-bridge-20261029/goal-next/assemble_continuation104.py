"""Rebuild the C104 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation103 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "a332462763eecc5b2254e7aeb9c6091e1bef6b36"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation103_Delta_20261120.zip":
           "9470482778aa4063b40066eff5e005c2d4eced3e8374e0a6ba4d90ad401d29c7"}
LEAN_PARENT = "f7e083b44b1e9ac864cad85845fa1ea5c5dcbf42"
LEAN_SHORT = "MathScope/M3/CD/SignedStressEnergyGate.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"late_centered_radial_derivative", "late_centered_fast_time_cancel"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation104"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION104_KO.md", "STATUS_CONTINUATION104.json"
PUBLIC = "preservation-continuation104.json"
PACKETS = {
    "c104/background14/": ("MANIFEST.json", "producedFiles"),
    "c104/inner-target13/": ("MANIFEST.json", "producedFiles"),
    "c104/middle-target13/": ("MANIFEST.json", "producedFiles"),
    "c104/frame13/": ("MANIFEST.json", "producedFiles"),
    "c104/high-compact-old/": ("MANIFEST.json", "producedFiles"),
    "c104/y-n2-stress/": ("manifest.json", "filesSHA256"),
}


def verify_members(raw, parse, bound):
    release_files = {}
    for root, (manifest, member_key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"] == bound[root]["manifestSHA256"], root
        release_files[root+manifest] = "A"
        for leaf, digest in parse(root+manifest)[member_key].items():
            assert Path(leaf).name == leaf and leaf != manifest, leaf
            assert entry(raw(root+leaf))["sha256"] == digest, (root, leaf)
            release_files[root+leaf] = "A"
    paths = {
        "background": "c104/background14/background-c14.json",
        "outer": "c104/background14/regular-outer-c13.json",
        "inner": "c104/inner-target13/regular-inner-c13.json",
        "middle": "c104/middle-target13/regular-middle-c13.json",
        "frame": "c104/frame13/selected-frame-c13.json",
        "compact": "c104/high-compact-old/high-compact-old.json",
    }
    joined = parse("c104/frame13/joined-c13.json")
    assert (joined["backgroundOrder"],joined["regularTargetOrder"]) == (14,13)
    assert joined["pins"] == {k:entry(raw(path))["sha256"] for k,path in paths.items()}
    assert parse(paths["background"])["comparison"]["sign"] == -1
    assert parse(paths["frame"])["frame"]["auditedDirections"] == 560
    assert parse(paths["compact"])["sizes"]["primaryCovariance"] == 963
    assert parse(paths["compact"])["sizes"]["primaryHighCovariance"] == 169
    assert parse(paths["compact"])["actualCompactProfile"]["compactChargeInHOver2Pow128"] == 54920
    stress = parse("c104/y-n2-stress/n2-absolute-stress.json")
    assert stress["sourceStatus"] == (
        "VERIFIED_ORIGINAL_N2_STRESS_BOTH_PRIMITIVES_AND_CONSERVATIVE_ERROR_IDENTITIES")
    stress_manifest = parse("c104/y-n2-stress/manifest.json")
    assert stress_manifest["byteIdenticalNodeReplays"] == 2 == stress_manifest["byteIdenticalPythonReplays"]
    return release_files


def check_lean(raw, parse, git, head):
    root = "c103/lean-github/"
    ci = parse(root + "receipt.json")
    assert ci["headSha"] == LEAN_PARENT and ci["conclusion"] == "success"
    digest = ci["leanFileSHA256"]
    assert f"{digest}  {LEAN_SHORT}" in raw(root + "source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    log = raw(root + "SignedStressEnergyGate.log").decode()
    found = dict(re.findall(r"'MathScope\.M3\.CD\.([a-zA-Z0-9_]+)' depends on axioms: \[([^\]]*)\]", log))
    assert THEOREMS <= set(found) and "sorryAx" not in log and "error:" not in log
    assert all(set(found[name].split(", ")) <= STANDARD_AXIOMS for name in THEOREMS)
    return ci["databaseId"]


def assemble(args):
    outputs = args.workspace/"outputs"

    def git(*params):
        return subprocess.check_output(["git", "-c", "core.longpaths=true", *params], cwd=args.repo)

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH
    git("merge-base", "--is-ancestor", PARENT, head)
    git("merge-base", "--is-ancestor", LEAN_PARENT, head)

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
    assert state["leanRun"] == check_lean(raw, parse, git, head)
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation104.py"):
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
               "sha256": file_sha(delta), "branchHead": head, "hostedLeanRun": state["leanRun"],
               "priorHostedLeanTheorems": 2, "leadingBackgroundOrder": 14, "regularTargetOrder": 13,
               "extendedPrimaryDirections": 169, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
