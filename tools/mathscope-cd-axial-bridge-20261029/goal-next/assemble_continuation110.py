"""Rebuild the C110 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation109 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "87ad625f552093960af3de31a19c766ef69bd658"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation109_Delta_20261120.zip":
           "745eb6266458f288c29e27a76c370eaa850c60fdb23743b795bd4c04d9aa58fa"}
LEAN_PARENT = "857d612cd5d5fa41ab16517029bb1f85c454e7e5"
LEAN_SHORT = "MathScope/M3/CD/AxialMomentBridge.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"axial_fixed_interval_hasDerivAt_of_joint_continuity"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation110"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION110_KO.md", "STATUS_CONTINUATION110.json"
PUBLIC = "preservation-continuation110.json"
PACKETS = {
    f"c110/{name}/": ("MANIFEST.json", "producedFiles")
    for name in ("lean-github", "y-native-n3", "y-native-n3-stress", "y-native-n3-coupled", "axial-n7")
}
PACKETS["c110/k1-analytic-seams/"] = ("MANIFEST.json", "files")
PACKETS["c110/k1-path-compacts/"] = ("MANIFEST.json", "files")
PACKETS["c110/j2-checker-control/"] = ("PREPARED-MANIFEST.json", "filesSHA256")


def verify_members(raw, parse, bound):
    files = {}
    for root, (manifest, key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"] == bound[root]["manifestSHA256"], root
        files[root+manifest] = "A"
        for leaf, digest in parse(root+manifest)[key].items():
            assert Path(leaf).name == leaf and leaf != manifest
            assert entry(raw(root+leaf))["sha256"] == digest, (root, leaf)
            files[root+leaf] = "A"
    n3 = parse("c110/y-native-n3/MANIFEST.json")["checks"]
    assert (n3["originalN3Nodes"], n3["retainedN2Prefix"], n3["actualNativeReplacementCalls"]) == (123870, 120820, 19)
    assert n3["exactFiveMomentNumerators"] == [0] * 5
    assert n3["originalStressDensities"] == {"theta": 123840, "z": 123841}
    assert n3["generalY"] == "OPEN" and n3["finalJets"] == 0
    stress = parse("c110/y-native-n3-stress/MANIFEST.json")["checks"]
    assert stress["fixedHistoryStressIdentities"] == [0, 0]
    assert stress["wrongControls"] == [6, 24]
    assert stress["strictPointwiseAndAbsoluteL1Target"] == "2^-256"
    assert stress["generalY"] == "OPEN" and stress["finalJets"] == 0
    coupled = parse("c110/y-native-n3-coupled/MANIFEST.json")["checks"]
    assert coupled["actualSystems"] == [3, 5] and coupled["weightedSecondRadialResiduals"] == [0, 0]
    assert coupled["realEtaMixedDerivativeOrder"] == 3 and coupled["wholePairedN3"] == "OPEN"
    axial = parse("c110/axial-n7/n7-exact-prefix.json")
    assert axial["nodeCount"] == 159256 and axial["order"] == 7
    assert axial["rows"][0]["density"] == 117047 and axial["rows"][0]["originalStoredTotal"] == 117075
    seventh = axial["rows"][6]
    assert (seventh["density"], seventh["forwardIntegral"], seventh["backwardIntegral"]) == (139221, 139234, 139248)
    assert seventh["sourceFTC"]["negativeWrongSign"]["pass"] is False and axial["release"] == "HOLD"
    control = parse("c110/j2-checker-control/PREPARED-MANIFEST.json")
    assert control["archivedExactPullbacks"] == 240 and control["intendedGitHubRun"] == 44668251828
    assert control["negativeControlAccepted"] is False and control["globalSupportAndAllStageGate"] == "OPEN"
    k1 = parse("c110/k1-analytic-seams/MANIFEST.json")
    assert (k1["sourceRecords"], k1["forcedPulseSystems"], k1["pairedLateRows"]) == (22155584, 20, 13)
    assert k1["firstCorrectionWhole"] == "CONDITIONAL"
    assert k1["finalJets"] == 0 and k1["release"] == "HOLD"
    paths = parse("c110/k1-path-compacts/MANIFEST.json")
    assert (paths["sourceRecords"], paths["initialMeanRoles"], paths["lateCovarianceRoles"]) == (22155584, 223, 127)
    assert paths["firstCorrectionWhole"] == "CONDITIONAL" and paths["finalJets"] == 0
    return files


def check_lean(raw, parse, git, head):
    root = "c110/lean-github/"
    ci = parse(root + "receipt.json")
    assert ci["headSha"] == LEAN_PARENT and ci["conclusion"] == "success"
    digest = ci["leanFileSHA256"]
    assert f"{digest}  {LEAN_SHORT}" in raw(root + "source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    log = raw(root + "AxialMomentBridge.log").decode()
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation110.py"):
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
               "hostedLeanTheorems": 1, "conditionalFirstCorrectionEnergy": "<2^-28", "pairedLateFourierRows": 13,
               "sameWholeFieldConvergenceAxes": 0, "nativeN3FixedHistoryStressCap": "<2^-256", "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
