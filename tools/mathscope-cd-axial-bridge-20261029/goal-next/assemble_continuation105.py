"""Rebuild the C105 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation104 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "6b331b961d8e1192e2c71f06a8cc10b78fb6da25"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation104_Delta_20261120.zip":
           "f4a1d63ca90f106f08738ed2c4c8b8be919bc59b53d37d04075ea6a859deed01"}
LEAN_PARENT = "ce9046622f08a8c2aad2f80679ecad2f7d3b19ee"
LEAN_SHORT = "MathScope/M3/CD/ActualPicardNormEnvelope.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"finite_picard_shared_forcing_cap", "fixed_picard_shared_forcing_cap"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation105"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION105_KO.md", "STATUS_CONTINUATION105.json"
PUBLIC = "preservation-continuation105.json"
PACKETS = {
    "c105/lean-github/": ("MANIFEST.json", "producedFiles"),
    "c105/late-grade/": ("MANIFEST.json", "producedFiles"),
    "c105/forced-mode-one-high/": ("MANIFEST.json", "producedFiles"),
    "c105/forced-mode-two-high/": ("MANIFEST.json", "producedFiles"),
    "c105/y-coupled-n2/": ("manifest.json", "filesSHA256"),
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
    path = "c105/forced-mode-one-high/"
    gauge = parse(path+"forced-gauge-demand.json")
    mode_one = parse(path+"mode-one-high-dependencies.json")
    transfer = parse(path+"mode-one-high-transfer.json")
    assert gauge["pairedCases"] == 2970 and len(gauge["requests"]) == len(transfer["rows"]) == 50
    assert mode_one["upstream"]["primaryCovarianceRows"] == 1213
    assert mode_one["upstream"]["highestSlowPrimaryCovarianceRows"] == [
        ["W_rz",[0,14,0,0]],["W_rz",[0,14,0,2]]]
    mode_two = parse("c105/forced-mode-two-high/forced-mode-two-high.json")
    assert mode_two["directions"] == gauge["requests"] and mode_two["sourceMonomialCount"] == 1270
    assert len(mode_two["conditionalGaugeRows"]) == 50
    late = parse("c105/late-grade/late-grade.json")
    assert len(late["premise"]["componentDirections"]) == 127
    assert late["physicalGate"]["conditionalLateSliceEnergyRatioUpper"] == "<2^-32"
    y = parse("c105/y-coupled-n2/manifest.json")
    assert y["byteIdenticalNodeReplays"] == 2 == y["byteIdenticalPythonReplays"]
    assert parse("c105/y-coupled-n2/coupled-n2.json")["sourceStatus"] == (
        "VERIFIED_ORIGINAL_THREE_FORCING_ROWS_FIXED_MATRIX_WHOLE_OMEGA_AND_FIVE_MOMENT_RETARGETING")
    return release_files


def check_lean(raw, parse, git, head):
    root = "c105/lean-github/"
    ci = parse(root + "receipt.json")
    assert ci["headSha"] == LEAN_PARENT and ci["conclusion"] == "success"
    digest = ci["leanFileSHA256"]
    assert f"{digest}  {LEAN_SHORT}" in raw(root + "source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    log = raw(root + "ActualPicardNormEnvelope.log").decode()
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation105.py"):
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
               "sha256": file_sha(delta), "branchHead": head, "hostedLeanRun": state["leanRun"],
               "hostedLeanTheorems": 2, "forcedGaugeDirections": 50, "pairedCurlCases": 2970,
               "coupledN2CoefficientOutputs": 9, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
