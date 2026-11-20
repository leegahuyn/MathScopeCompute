"""Rebuild the C101 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation100 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "c8175564ba7082804acd2c51fda36558362f8717"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation100_Delta_20261120.zip":
           "de786f74f7b89b85e6b0f9ed0ab4a93d8100ce04ec95bec47a9173054f1f58a2"}
LEAN_PARENT = "c3d00ad56881858c4aacced6bb0ab83a8328ca74"
LEAN_SHORT = "MathScope/M3/CD/FiveMapMeanGauge.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"five_map_compact_square_weight", "five_map_compact_pressure_witness"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation101"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION101_KO.md", "STATUS_CONTINUATION101.json"
PUBLIC = "preservation-continuation101.json"
PACKETS = {
    "c101/axial-budget/": ("MANIFEST.json", "producedFiles"),
    "c101/compact-z10/": ("MANIFEST.json", "producedFiles"),
    "c101/lean-github/": ("MANIFEST.json", "producedFiles"),
    "c101/chart12/": ("MANIFEST.json", "producedFiles"),
    "c101/high-frame/": ("MANIFEST.json", "producedFiles"),
    "c101/high-inner-target/": ("MANIFEST.json", "producedFiles"),
    "c101/high-outer-target/": ("MANIFEST.json", "producedFiles"),
    "c101/high-middle-target/": ("MANIFEST.json", "producedFiles"),
    "c101/background12/": ("MANIFEST.json", "producedFiles"),
    "c101/y-taper/": ("manifest.json", "filesSHA256"),
    "c101/y-outer/": ("manifest.json", "filesSHA256"),
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
    axial = parse("c101/axial-budget/n8-diagnostic.json")
    budget = parse("c101/axial-budget/budget-only.json")
    assert (axial["order"],axial["nodeCount"]) == (8,165076)
    assert (budget["originalMaxVisits"],budget["diagnosticMaxVisits"]) == (300000,1200000)
    assert [row["order"] for row in axial["rows"]] == list(range(1,9))
    for row in axial["rows"]:
        assert row["conservativeReduction"] == 0
        assert row["sourceFTC"]["negativeWrongSign"]["pass"] is False
    compact = parse("c101/compact-z10/compact-z10.json")["witness"]
    assert compact["P_Z6PerEpsilonSquared"] == "64/315" and compact["Jz_Z6PerEpsilonSquared"] == "32/77"
    chart = parse("c101/chart12/chart12.json")
    assert chart["totalDirections"] == 455 and len(chart["degreeTwelveDirections"]) == 91
    frame = parse("c101/high-frame/high-frame.json")
    assert len(frame["selectedRows"]) == 10 and frame["cutoff"]["maximumOrder"] == 15
    assert frame["frame"]["auditedDirections"] == 364
    bg = parse("c101/background12/background-c12.json")
    assert bg["traceNodeCount"] == 321895 and bg["derivativeOrder"] == 12
    assert bg["comparison"]["sign"] == -1 and bg["leading"]["leadingLogCapSign"] == -1
    assert bg["leading"]["leadingLogCap"] == "H/2^300" and bg["leading"]["rejectedTighterRenvPowerSign"] == 1
    middle = parse("c101/high-middle-target/regular-middle-c11.json")
    assert middle["ordinaryCapRows"][-1]["order"] == 11 and all(row["literalMatch"] for row in middle["sourceRows"])
    joined = parse("c101/high-frame/joined-high.json")
    assert joined["selectedCovarianceCount"] == 10 and joined["regularTargetOrdinaryOrder"] == 11
    assert joined["targetThreeRegions"]["middle"] == "log <=3 H/2^300 < H/2^256"
    with ZipFile(BytesIO(raw("c101/background12/trace-source-c12.zip"))) as trace:
        assert trace.namelist() == ["positive-c12-trace.json"] and trace.testzip() is None
        with trace.open("positive-c12-trace.json") as stream:
            assert sha256_stream(stream) == bg["inputs"]["traceSHA"]
    assert parse("c101/high-outer-target/regular-outer-c11.json")["outputDerivativeOrder"] == 11
    assert parse("c101/high-inner-target/regular-inner-c11.json")["outputDerivativeOrder"] == 11
    assert parse("c101/y-taper/manifest.json")["byteIdenticalPythonReplays"] == 2
    assert parse("c101/y-outer/manifest.json")["byteIdenticalPythonReplays"] == 2
    return release_files


def check_lean(raw, parse, git, head):
    root = "c101/lean-github/"
    ci = parse(root + "receipt.json")
    assert ci["headSha"] == LEAN_PARENT and ci["conclusion"] == "success"
    digest = ci["leanFileSHA256"]
    assert f"{digest}  {LEAN_SHORT}" in raw(root + "source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    log = raw(root + "FiveMapMeanGauge.log").decode()
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation101.py"):
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
               "hostedLeanTheorems": 2, "diagnosticAxialOrders": 8, "nativeBackgroundTraceRecords": 321895,
               "C12ChartDirections": 455, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
