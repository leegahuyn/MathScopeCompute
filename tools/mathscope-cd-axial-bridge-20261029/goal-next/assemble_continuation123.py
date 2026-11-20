"""Rebuild the C123 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation122 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "01d7692250e6fbe07e49e45394e0d92dd68dbd86"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation122_Delta_20261120.zip":
           "a52bbbb38573068a75f60228c6048e4326b5f62341e3c7c2ea8eff742ec7ac09"}
LABEL = "MathScope_Goal_Continuation123"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION123_KO.md", "STATUS_CONTINUATION123.json"
PUBLIC = "preservation-continuation123.json"
PACKETS = {
    "c123/repeat-postfive-mean/": "files",
    "c123/repeat-complete-eikonal/": "files",
    "c123/lean-github/": "files",
}
LEAN_PARENT = "8176b1e578d14b2165bc3b250e0221fc402ef107"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/RepeatEikonal.lean"
WORKFLOW_PATH = ".github/workflows/mathscope-cd-axial-bridge-20261029.yml"
LEAN_RUN = 44685389813


def verify_members(raw, parse, bound):
    members = {}
    for path, key in PACKETS.items():
        assert entry(raw(path+"MANIFEST.json"))["sha256"] == bound[path]["manifestSHA256"]
        report = parse(path+"MANIFEST.json")
        members[path+"MANIFEST.json"] = "A"
        for leaf, digest in report[key].items():
            assert Path(leaf).name == leaf and leaf != "MANIFEST.json"
            assert entry(raw(path+leaf))["sha256"] == digest
            members[path+leaf] = "A"

    root = "c123/repeat-postfive-mean/"
    report = parse(root+"postfive-mean-transport.json")
    assert report["exactLatePotentials"] == [22150943, 22151952] and report["exactLateDirectSwirl"] == 22154876
    assert report["protectedSource"] == "faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
    assert report["protectedNativeRegistry"] == "e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"
    assert report["lateCovarianceDonors"] == 127 and report["epsilonGradeAfterFinalDebit"] == "19997/50000"
    assert report["finalJets"] == 0 and report["release"] == "HOLD"
    eikonal = parse("c123/repeat-complete-eikonal/repeat-eikonal.json")
    assert eikonal["protectedStream"] == report["protectedSource"] and len(eikonal["charts"]) == 10
    assert eikonal["baseline"]["epsilonGrade"] == "49999/100000"
    assert eikonal["combined"]["epsilonGrade"] == "39993/100000"
    return members


def check_lean(raw, parse, git, head):
    root = "c123/lean-github/"
    ci = parse(root+"receipt.json")
    assert (ci["databaseId"],ci["headSha"],ci["conclusion"]) == (LEAN_RUN,LEAN_PARENT,"success")
    digest = ci["leanFileSHA256"]
    assert f"{digest}  MathScope/M3/CD/RepeatEikonal.lean" in raw(root+"source-sha256.txt").decode().splitlines()
    for ref in (head, LEAN_PARENT):
        assert entry(git("show", f"{ref}:{LEAN_PATH}"))["sha256"] == digest
    found = raw(root+"RepeatEikonal.log").decode()
    for name in ("repeat_background_transport", "repeat_transport_epsilon_bound"):
        assert f"'MathScope.M3.CD.{name}' depends on axioms:" in found
    assert "sorryAx" not in found and "error:" not in found
    first = parse(root+"first-attempt.json")
    assert first["databaseId"] == 44684834703 and first["conclusion"] == "failure"
    assert b"error: Type mismatch" in raw(root+"first-attempt.log")
    return ci["databaseId"]


def assemble(args):
    outputs = args.workspace/"outputs"

    def git(*params):
        return subprocess.check_output(["git", "-c", "core.longpaths=true", *params], cwd=args.repo)

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH
    git("merge-base", "--is-ancestor", PARENT, head)

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
    assert check_lean(raw, parse, git, head) == LEAN_RUN == state["lastVerifiedLeanRun"]
    assert state["newLeanRuns"] == [LEAN_RUN]
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation123.py"):
        groups[name] = "A"
    expected = {f"{CURRENT}/{name}": op for name, op in groups.items()}
    expected.update({LEAN_PATH: "A", WORKFLOW_PATH: "M"})
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
               "sha256": file_sha(delta), "branchHead": head, "lastVerifiedLeanRun": state["lastVerifiedLeanRun"],
               "newHostedLeanTheorems": 2, "conditionalFirstCorrectionEnergy": "<17*2^-33", "axialSourcePrefix": 12,
               "sameWholeFieldConvergenceAxes": 0, "structuralConservationForEachFixedAdmittedOrder": "CONDITIONAL", "repeatReadbackReady": True, "fullRepeatRetryRun": 44682703381, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
