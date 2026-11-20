"""Rebuild the C102 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation101 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "3850afdfeabb1d11b0ffca234fb39ca3618aea28"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation101_Delta_20261120.zip":
           "d67e250597d08a04ab645eb0d3af5b04e179a67bdc565ac09837a133e77d2795"}
LEAN_PARENT = "35e1e42b27386b291340863eafda17765849a6e6"
LEAN_SHORT = "MathScope/M3/CD/SignedStressEnergyGate.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"signed_centered_tail_primitive", "signed_centered_stress_exterior_zero"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation102"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION102_KO.md", "STATUS_CONTINUATION102.json"
PUBLIC = "preservation-continuation102.json"
PACKETS = {
    "c102/lean-github/": ("MANIFEST.json","producedFiles"),
    "c102/higher-stress/": ("MANIFEST.json","producedFiles"),
    "c102/signed-pure-z5/": ("MANIFEST.json","producedFiles"),
    "c102/signed-curl-coverage/": ("MANIFEST.json","producedFiles"),
    "c102/signed-sigma/": ("MANIFEST.json","producedFiles"),
    "c102/compact-fivemap/": ("MANIFEST.json","producedFiles"),
    "c102/high-selective-18/": ("MANIFEST.json","producedFiles"),
    "c102/mode-one-attachment/": ("MANIFEST.json","producedFiles"),
    "c102/signed-weighted-mean/": ("MANIFEST.json","producedFiles"),
    "c102/signed-fixed-geometry/": ("manifest.json","filesSHA256"),
    "c102/phase-free-l2/": ("MANIFEST.json","producedFiles"),
    "c102/y-absolute-outer/": ("manifest.json","filesSHA256"),
    "c102/y-absolute-quantitative/": ("manifest.json","filesSHA256"),
}


def verify_members(raw, parse, bound):
    release_files={}
    for root,(name,member_key) in PACKETS.items():
        root_manifest=raw(root+name)
        assert entry(root_manifest)["sha256"]==bound[root]["manifestSHA256"],root
        manifest=json.loads(root_manifest)
        for leaf,expected in manifest[member_key].items():
            assert Path(leaf).name==leaf and leaf!=name
            assert entry(raw(root+leaf))["sha256"]==expected,(root,leaf)
            release_files[root+leaf]="A"
        release_files[root+name]="A"
    stress=parse("c102/higher-stress/higher-stress.json")
    assert stress["sourceRecords"]==22155584
    assert stress["source"]["sourcePhysicalOrder"]==[3,2,1]
    assert stress["source"]["linearHigherStressMonomialsMatched"]==12
    assert len(stress["source"]["rows"])==6
    assert all(x["pairedStructuralSubstitution"] and x["wholeConservativeReduction"]==0 for x in stress["source"]["rows"])
    assert [row["outerEndpoint"] for row in stress["source"]["rows"]].count(28826)==1
    fields=parse("c102/higher-stress/field-log-bounds.json")
    assert fields["traceNodeCount"]==64672 and fields["derivativeOrder"]==4
    assert fields["logCap"]=="H/2^288" and stress["caps"]["fullStressEpsilonMinimum"]=="1"
    with ZipFile(BytesIO(raw("c102/higher-stress/stress-norm-trace.zip"))) as trace:
        assert trace.namelist()==["stress-norm-trace.json"] and trace.testzip() is None
        with trace.open("stress-norm-trace.json") as stream:
            assert sha256_stream(stream)==fields["pins"]["traceSHA"]
    curl=parse("c102/signed-curl-coverage/signed-curl-coverage.json")
    assert curl["exactPairCases"]==608 and curl["remainingPhaseFreeGaugeDirectionsRZL"]==[[0,0,2]]
    phase=parse("c102/phase-free-l2/phase-free-l2.json")
    assert len(phase["phaseFreeDonor"]["gaugeRows"])==2
    highest=parse("c102/signed-pure-z5/signed-pure-z5.json")
    assert [row["pureExceptionalSigmaGradeBeforeRemainingDebit"] for row in highest["rows"]]==["249999/50000"]*2
    fixed=parse("c102/signed-fixed-geometry/signed-fixed-geometry.json")
    assert fixed["sumLogRankMax"]==1678 and fixed["numPhysicalWords"]==30
    sigma=parse("c102/signed-sigma/signed-sigma.json")
    assert sigma["sourceSigmaRoots"]==[22001223,22001224] and sigma["remainingUnattachedRZL"]==[]
    assert sigma["conditionalSignedSliceRelativeEnergy"]=="<2^-32"
    assert sigma["pins"]["higher_stress"]==entry(raw("c102/higher-stress/higher-stress.json"))["sha256"]
    assert sigma["pins"]["transverse_l2"]==entry(raw("c102/phase-free-l2/phase-free-l2.json"))["sha256"]
    assert sigma["pins"]["fixed_geometry"]==entry(raw("c102/signed-fixed-geometry/signed-fixed-geometry.json"))["sha256"]
    assert len(parse("c102/high-selective-18/high-18.json")["rows"])==18
    assert parse("c102/y-absolute-outer/manifest.json")["byteIdenticalPythonReplays"]==2
    assert parse("c102/y-absolute-quantitative/manifest.json")["byteIdenticalPythonReplays"]==2
    return release_files


def check_lean(raw, parse, git, head):
    root = "c102/lean-github/"
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation102.py"):
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
               "hostedLeanTheorems": 2, "originalStressRows": 6, "signedCurlCases": 608,
               "conditionalSignedSliceRelativeEnergy": "<2^-32", "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
