"""Rebuild the C107 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation106 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "4e714f4d77bea3dc73d2ed893ae8bcc491b19e63"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation106_Delta_20261120.zip":
           "71ed92a0e3cc0b03f812b2be73823211d8c174721f5e2f963f2c60d95c9bced1"}
LEAN_PARENT = "7b8c07500c148d08d7657d36b4faf5e8844bf5a0"
LEAN_SHORT = "MathScope/M3/CD/SignedStressEnergyGate.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"post_signed_covariance_pair_rate"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation107"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION107_KO.md", "STATUS_CONTINUATION107.json"
PUBLIC = "preservation-continuation107.json"
PACKETS = {
    "c107/lean-github/": ("MANIFEST.json","producedFiles"),
    "c107/post-signed-gauge/": ("MANIFEST.json","producedFiles"),
    "c107/forced-mode-one-guards/": ("MANIFEST.json","producedFiles"),
    "c107/forced-mode-one-join/": ("MANIFEST.json","producedFiles"),
    "c107/higher-stress-c6/": ("MANIFEST.json","producedFiles"),
    "c107/n8-n8-05-audit/": ("MANIFEST.json","producedFiles"),
}


def verify_members(raw,parse,bound):
    result={}
    for root,(manifest,key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"]==bound[root]["manifestSHA256"],root
        result[root+manifest]="A"
        for leaf,digest in parse(root+manifest)[key].items():
            assert Path(leaf).name==leaf and leaf!=manifest
            assert entry(raw(root+leaf))["sha256"]==digest,(root,leaf)
            result[root+leaf]="A"
    base="c107/post-signed-gauge/"
    census=parse(base+"post-signed-gauge-requests.json")
    assert (census["covarianceCount"],census["pairedCases"],len(census["directions"]))==(127,4964,79)
    geometry=parse(base+"signed-gauge-cutoffs.json")
    assert geometry["pins"]["demand"]==entry(raw(base+"post-signed-gauge-requests.json"))["sha256"]
    assert max(r["logRank"] for r in geometry["rows"])==4173
    mode_two=parse(base+"forced-mode-two-late-directions.json")
    assert mode_two["directions"]==census["directions"]
    transfer=parse(base+"late-covariance-from-gauges.json")
    assert transfer["conditionalCovarianceGrade"]=="45999/50000"
    assert transfer["pins"]["modeTwoLate"]==entry(raw(base+"forced-mode-two-late-directions.json"))["sha256"]
    mode_one=parse(base+"mode-one-late-dependencies.json")
    assert (mode_one["ordinaryMeanRows"],mode_one["primaryCovarianceRows"],len(mode_one["newHighPrimaryDirections"]))==(432,1499,37)
    join=parse("c107/forced-mode-one-join/MANIFEST.json")
    assert join["directionCount"]==50 and join["modeOnePhaseFreeGaugeEpsilonAfterOneDebit"]=="149993/100000"
    n8=parse("c107/n8-n8-05-audit/MANIFEST.json")["checks"]
    assert (n8["exactZeroRationalNumerators"],n8["wrongTimeSignControlsRejected"],n8["sameFullFinalFieldObservedRefinements"])==(12,2,0)
    stress=parse("c107/higher-stress-c6/MANIFEST.json")
    assert stress["schema"]=="MathScope.C107.OriginalWeightedSignedStressThroughC6Packet/1"
    return result


def check_lean(raw, parse, git, head):
    root = "c107/lean-github/"
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation107.py"):
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
               "hostedLeanTheorems": 1, "postSignedCovarianceRows": 127, "signedGaugeDirections": 79,
               "newHighPrimaryCovarianceRows": 37, "samplingGeometryIdentities": 12, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
