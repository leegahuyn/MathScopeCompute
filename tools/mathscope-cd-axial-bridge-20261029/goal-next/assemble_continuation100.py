"""Rebuild the C100 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation99 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "5106450dac7df3df4951afa0d4d20cfebaa936c9"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation99_Delta_20261120.zip":
           "cf0ac221b5298cab6f82b915f9956ce5e6623debeefa9acff9270cb80901bdbd"}
LEAN_PARENT = "b401f6956bd6c6e5104190509135aa5ffad508b4"
LEAN_SHORT = "MathScope/M3/CD/ShellGaussianPrimitive.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"signed_gaussian_pole_hasDerivAt", "signed_gaussian_pole_second_multiplier"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation100"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION100_KO.md", "STATUS_CONTINUATION100.json"
PUBLIC = "preservation-continuation100.json"
PACKETS = {
    "c100/leading-stress/": ("MANIFEST.json", "producedFiles"),
    "c100/chart11/": ("MANIFEST.json", "producedFiles"),
    "c100/axial-prefix/": ("MANIFEST.json", "producedFiles"),
    "c100/lean-github/": ("MANIFEST.json", "producedFiles"),
    "c100/mode-one-z5/": ("MANIFEST.json", "producedFiles"),
    "c100/mode-one-high-crop/": ("MANIFEST.json", "producedFiles"),
    "c100/y-n1-radial-seams/": ("manifest.json", "filesSHA256"),
}


def verify_members(raw, parse, bound):
    release_files = {}
    for root, (name, member_key) in PACKETS.items():
        root_manifest = raw(root + name)
        assert entry(root_manifest)["sha256"] == bound[root]["manifestSHA256"], root
        manifest = json.loads(root_manifest)
        for leaf, expected in manifest[member_key].items():
            assert Path(leaf).name == leaf and leaf != name, leaf
            assert entry(raw(root + leaf))["sha256"] == expected, (root, leaf)
            release_files[root + leaf] = "A"
        release_files[root + name] = "A"
    leading = parse("c100/leading-stress/leading-stress.json")
    assert leading["source"]["nodes"] == 22155584 and len(leading["actualLeading"]) == 2
    assert [item["E"] for item in leading["actualLeading"]] == [21999622, 22000445]
    assert [item["poleByOrdinaryOrder"] for item in leading["weightedLeadingC2"]["collars"]] == [[0, 3, 6], [3, 6, 9]]
    chart = parse("c100/chart11/chart11.json")
    assert chart["ordinaryDirections"] == 364 and chart["newOrderElevenDirections"] == 78
    axial = parse("c100/axial-prefix/n6-fixed-prefix.json")
    assert axial["order"] == 6 and [row["order"] for row in axial["rows"]] == list(range(1, 7))
    assert all(row["conservativeReduction"] == 0 and row["sourceFTC"]["negativeWrongSign"]["pass"] is False
               for row in axial["rows"])
    first = axial["rows"][0]
    assert (first["density"], first["forwardIntegral"], first["backwardIntegral"], first["originalStoredTotal"]) == (
        117047, 117057, 117066, 117075)
    mode = parse("c100/mode-one-z5/MANIFEST.json")
    assert mode["retainedOriginalMonomials"] == 2620 and mode["newMeanComponentRequests"] == 18
    high = parse("c100/mode-one-high-crop/MANIFEST.json")
    assert high["conservativeHigherCovarianceRoles"] == 14 and high["remainingSufficientNewTemporalCovarianceRows"] == 8
    assert high["highestOrdinaryAxialOrder"] == 9 and high["nonzeroKernelRationals"] == ["31/105", "13/35"]
    y = parse("c100/y-n1-radial-seams/n1-radial-seams.json")
    assert y["compensatedOutputCount"] == 9 and y["exactCompensatedMomentsZero"] == 5
    assert y["originalAxialDensityAndIntegrals"]["literalIntegrals"] == [117057, 117066, 117075]
    assert y["norms"]["rawF1U1WeightedXSecondDerivativeErrorOnDeltaOver16"] == "2^46 Q^-19"
    return release_files


def check_lean(raw, parse, git, head):
    root = "c100/lean-github/"
    ci = parse(root + "receipt.json")
    assert ci["headSha"] == LEAN_PARENT and ci["conclusion"] == "success"
    digest = ci["leanFileSHA256"]
    assert f"{digest}  {LEAN_SHORT}" in raw(root + "source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    log = raw(root + "ShellGaussianPrimitive.log").decode()
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation100.py"):
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
               "hostedLeanTheorems": 2, "nativeAxialOrders": 6, "nativeStressSourceRecords": 22155584,
               "C11ChartDirections": 364, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
