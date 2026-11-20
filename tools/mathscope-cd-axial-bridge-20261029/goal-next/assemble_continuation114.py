"""Rebuild the C114 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation113 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "3e70887569e01eed27230cfa4c03f37ac4f71c36"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation113_Delta_20261120.zip":
           "50f1778f06185f6db302180b105c3fa98298951a8ebb68b55625690640570eb1"}
LEAN_PARENT = "997f9fb914ae7279b29f0b6a2bcfd19551b69da5"
LEAN_SHORT = "MathScope/M3/CD/InitializedEnergyJoin.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"first_correction_energy_with_disjoint_forced_bounds"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation114"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION114_KO.md", "STATUS_CONTINUATION114.json"
PUBLIC = "preservation-continuation114.json"
PACKETS = {
    f"c114/{name}/": ("MANIFEST.json", "producedFiles")
    for name in ("lean-github", "first-cycle-angular-support", "y-native-n5")
}
PACKETS["c114/full-exterior-jets/"] = ("MANIFEST.json", "files")


def verify_members(raw, parse, bound):
    files = {}
    for root, (manifest, key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"] == bound[root]["manifestSHA256"], root
        files[root+manifest] = "A"
        for leaf, digest in parse(root+manifest)[key].items():
            assert Path(leaf).name == leaf and leaf != manifest
            assert entry(raw(root+leaf))["sha256"] == digest, (root, leaf)
            files[root+leaf] = "A"
    sparse = parse("c114/first-cycle-angular-support/first-cycle-angular-support.json")
    counts = sparse["counts"]
    assert counts["signedRowsPerStageAtPointAtMost"] == [32, 32]
    assert counts["cylindricalVelocitySupportAtMost"] == 193
    assert counts["cylindricalNonPressureForceSupportAtMost"] == 18497
    assert counts["aliasBeforeSquareControl"]["afterMerge"] == 0
    assert sparse["wholeN805"] == "OPEN" and sparse["wholeFinalJets"] == 0
    exterior = parse("c114/full-exterior-jets/MANIFEST.json")
    assert exterior["bareRows"] == exterior["localizedRows"] == 67
    assert (exterior["cutoffRows"], exterior["outputPolynomials"]) == (13, 16)
    assert exterior["directedCells"] == [200, 1296] and exterior["finalJets"] == 0
    n5 = parse("c114/y-native-n5/MANIFEST.json")["checks"]
    assert (n5["originalN5Nodes"], n5["retainedN4Nodes"]) == (130926, 127241)
    assert n5["originalOmegaBranchTerms"] == [7, 9, 11, 13]
    assert n5["N5Densities"] == {"theta": 130896, "z": 130897}
    assert n5["strictError"] == "2^-256" and n5["pairedWholeN5"] == "OPEN"
    return files


def check_lean(raw, parse, git, head):
    root = "c114/lean-github/"
    ci = parse(root + "receipt.json")
    assert ci["headSha"] == LEAN_PARENT and ci["conclusion"] == "success"
    digest = ci["leanFileSHA256"]
    assert f"{digest}  {LEAN_SHORT}" in raw(root + "source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    log = raw(root + "InitializedEnergyJoin.log").decode()
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation114.py"):
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
               "hostedLeanTheorems": 1, "conditionalFirstCorrectionEnergy": "<17*2^-33", "axialSourcePrefix": 12,
               "sameWholeFieldConvergenceAxes": 0, "originalWholeHeatExteriorJetEnclosures": 67, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
