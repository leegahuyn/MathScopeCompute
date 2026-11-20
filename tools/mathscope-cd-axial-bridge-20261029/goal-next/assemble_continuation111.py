"""Rebuild the C111 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation110 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "13dffe3cd774c4a24a891ede5d0a8c3adf6a5ef7"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation110_Delta_20261120.zip":
           "106f5f7023952fbf622ef433ca01cf8066f4559fcb6ffe17152ff6a6b15cf3f1"}
LEAN_PARENT = "67ab21fd111f49f5956820fd752d36666108130a"
LEAN_SHORT = "MathScope/M3/CD/ResidualPressureSquareTransfer.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"exterior_swirl_radial_energy_identity"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation111"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION111_KO.md", "STATUS_CONTINUATION111.json"
PUBLIC = "preservation-continuation111.json"
PACKETS = {
    f"c111/{name}/": ("MANIFEST.json", "producedFiles")
    for name in ("lean-github", "axial-n8", "y-n2-whole-mixed", "y-n3-paired-whole")
}
PACKETS["c111/n7-near-exterior-energy/"] = ("MANIFEST.json", "files")
PACKETS.update({
    f"c111/{name}/": (manifest, "filesSHA256")
    for name, manifest in (
        ("j2-protected-cutoffs", "UPSTREAM-MANIFEST.json"),
        ("j2-protected-wave-bodies", "PROTECTED-WAVE-MANIFEST.json"),
        ("j2-pulse-control", "PULSE-CONTROL-MANIFEST.json"),
    )
})


def verify_members(raw, parse, bound):
    files = {}
    for root, (manifest, key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"] == bound[root]["manifestSHA256"], root
        files[root+manifest] = "A"
        for leaf, digest in parse(root+manifest)[key].items():
            assert Path(leaf).name == leaf and leaf != manifest
            assert entry(raw(root+leaf))["sha256"] == digest, (root, leaf)
            files[root+leaf] = "A"
    axial = parse("c111/axial-n8/n8-exact-prefix.json")
    assert (axial["order"], axial["nodeCount"]) == (8, 165076)
    assert (axial["rows"][0]["density"], axial["rows"][0]["originalStoredTotal"]) == (117047, 117075)
    eighth = axial["rows"][-1]
    assert (eighth["density"], eighth["forwardIntegral"], eighth["backwardIntegral"],
            eighth["wholeIntegral"]) == (143862, 143875, 143889, 165056)
    assert all(row["sourceFTC"]["negativeWrongSign"]["pass"] is False for row in axial["rows"])
    free = parse("c111/axial-n8/free-coordinate-control.log")
    assert (free["nodes"], free["integralBinders"], free["formalSignatures"]) == (144907, 6817, 207)
    n2 = parse("c111/y-n2-whole-mixed/MANIFEST.json")["checks"]
    assert n2["leadingEtaOrder"] == 5 and n2["bumpDerivativeNumerators"] == [0] * 4
    assert (n2["wholeF2U2EtaOrder"], n2["wholeRadialV2EtaOrder"]) == (3, 2)
    n3 = parse("c111/y-n3-paired-whole/MANIFEST.json")
    assert n3["checks"]["generalY"] == "OPEN" and n3["checks"]["finalJets"] == 0
    assert n3["checks"]["coupledConservativeNumerators"] == [0, 0]
    assert n3["checks"]["lowerAndViscosityControls"] == [696, 936, 368, 354]
    assert n3["checks"]["bothGuardedStressPointwiseAndAbsoluteXTarget"] == "2^-256"
    assert n3["checks"]["numericalValuesEvaluated"] is False
    energy = parse("c111/n7-near-exterior-energy/MANIFEST.json")
    assert energy["byteIdenticalCompleteReplays"] == 2 and energy["nearPatchOnly"] is True
    assert energy["N7_06"] == energy["N8_05"] == "OPEN"
    cutoffs = parse("c111/j2-protected-cutoffs/UPSTREAM-MANIFEST.json")["counts"]
    assert cutoffs["remainingSourceFullyBoundSlots"] == cutoffs["cutoffDerivativeFullyBoundSlots"] == 120
    assert cutoffs["signedRealSlotsPendingActiveAppend"] == 30
    wave = parse("c111/j2-protected-wave-bodies/PROTECTED-WAVE-MANIFEST.json")
    assert wave["protectedBodiesWithTwoZeroCollars"] == wave["wrongChartProofRejections"] == 160
    pulse = parse("c111/j2-pulse-control/PULSE-CONTROL-MANIFEST.json")
    assert (pulse["archivedRawSourceSlots"], pulse["archivedNonzeroSignedTails"]) == (240, 30)
    assert pulse["activeClosedPulse"] == "AWAITING_FULL_SOURCE"
    return files


def check_lean(raw, parse, git, head):
    root = "c111/lean-github/"
    ci = parse(root + "receipt.json")
    assert ci["headSha"] == LEAN_PARENT and ci["conclusion"] == "success"
    digest = ci["leanFileSHA256"]
    assert f"{digest}  {LEAN_SHORT}" in raw(root + "source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    log = raw(root + "ResidualPressureSquareTransfer.log").decode()
    found = dict(re.findall(r"'MathScope\.M3\.CD\.([a-zA-Z0-9_]+)' depends on axioms: \[([^\]]*)\]", log))
    assert THEOREMS <= set(found) and "sorryAx" not in log and "error:" not in log
    assert all({entry.strip() for entry in found[name].split(",")} <= STANDARD_AXIOMS for name in THEOREMS)
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation111.py"):
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
               "hostedLeanTheorems": 1, "conditionalFirstCorrectionEnergy": "<2^-28", "axialSourcePrefix": 8,
               "sameWholeFieldConvergenceAxes": 0, "nativeN3PairedWholeStressCap": "<2^-256", "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
