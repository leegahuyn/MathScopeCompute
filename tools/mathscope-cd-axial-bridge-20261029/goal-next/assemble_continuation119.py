"""Rebuild the C119 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation118 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "d8b60f14f8177bea74292af2eb840c6109a82972"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation118_Delta_20261120.zip":
           "46d86b222d915619929a1821e7dec029d7a965a2728260f933982edc29606974"}
LEAN_PARENT = "5dcdbcd4d4f25ecec09156fa47885992f96f2f0c"
LEAN_SHORT = "MathScope/M3/CD/AxialHigherOrderTransport.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"source_stress_eta_drift_commutator", "source_cutoff_second_euler"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation119"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION119_KO.md", "STATUS_CONTINUATION119.json"
PUBLIC = "preservation-continuation119.json"
PACKETS = {
    "c119/lean-github/": ("MANIFEST.json","producedFiles"),
    "c119/signed-local-mixed-time/": ("MANIFEST.json","producedFiles"),
    "c119/signed-time-covariance/": ("MANIFEST.json","files"),
    "c119/compact-beta-zzt2/": ("MANIFEST.json","producedFiles"),
    "c119/signed-curl-mixed-t/": ("MANIFEST.json","filesSHA256"),
    "c119/signed-mixed-native-time/": ("MANIFEST.json","producedFiles"),
}


def verify_members(raw, parse, bound):
    files = {}
    for root, (manifest, key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"] == bound[root]["manifestSHA256"], root
        files[root+manifest] = "A"
        for leaf, digest in parse(root+manifest)[key].items():
            assert Path(leaf).name == leaf and leaf != manifest
            assert entry(raw(root+leaf))["sha256"] == digest, (root, leaf)
            files[root+leaf] = "A"
    local=parse("c119/signed-local-mixed-time/signed-local-mixed-time.json")
    assert local["originalResiduals"]==[21999622,22000445]
    assert local["conditionalCap"]["directions"]==[[1,0,1],[0,1,1]]
    cov=parse("c119/signed-time-covariance/MANIFEST.json")
    assert (cov["sourceCovarianceRoles"],cov["newlyRequiredCovarianceRoles"],cov["gaugeDirections"],cov["meanRoles"])==(35,13,30,193)
    beta=parse("c119/compact-beta-zzt2/MANIFEST.json")["checks"]
    assert beta["originalRZTL"]==[0,2,2,0] and beta["bothCollarsExactlyZero"]
    assert (beta["originalC98CovarianceRoles"],beta["quadraticHaarProducts"],beta["oneGaussianLogChargeInHOver2Pow128"])==(267,60,36254)
    curl=parse("c119/signed-curl-mixed-t/MANIFEST.json")
    assert curl["twoPassMatchedBytes"] and (curl["protectedSignedAddends"],curl["nativeXiFactors"])==(60,6)
    mixed=parse("c119/signed-mixed-native-time/signed-mixed-sigma-time.json")
    assert len(mixed["exactOriginalCovarianceAll35"])==35
    assert mixed["nativeSigmaRoots"]==[22001223,22001224]
    assert mixed["mixedCommon"]=={"band":"107/2","epsilon":"1","gaussian":"zeta","collarPole":33,
                                 "logCoefficientUnitsHOver2Pow128":524584}
    physical=parse("c119/signed-mixed-native-time/signed-physical-time.json")
    assert physical["boundaryConditions"]["radialFastTimeDerivativeZero"]
    assert physical["physicalSlowTerm"]["band"]=="315/4" and physical["physicalSlowTerm"]["collarPole"]==54
    assert physical["physicalSlowTerm"]["logCoefficient"]=="H/2^106"
    return files


def check_lean(raw, parse, git, head):
    root = "c119/lean-github/"
    ci = parse(root + "receipt.json")
    assert ci["headSha"] == LEAN_PARENT and ci["conclusion"] == "success"
    digest = ci["leanFileSHA256"]
    assert f"{digest}  {LEAN_SHORT}" in raw(root + "source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    log = raw(root + "AxialHigherOrderTransport.log").decode()
    found = dict(re.findall(r"'MathScope\.M3\.CD\.AxialHigherOrderTransport\.([a-zA-Z0-9_]+)' depends on axioms: \[([^\]]*)\]", log))
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation119.py"):
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
               "hostedLeanTheorems": 2, "conditionalFirstCorrectionEnergy": "<17*2^-33", "axialSourcePrefix": 12,
               "sameWholeFieldConvergenceAxes": 0, "signedMixedTimeOriginalRoles": 35, "physicalSignedSlowTime": "CONDITIONAL", "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
