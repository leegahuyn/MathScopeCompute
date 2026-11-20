"""Rebuild the C109 delta directly from the dedicated Git ref and verified CI artifacts."""

import json
from pathlib import Path
from io import BytesIO
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation108 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = "a5e54e222fe3c6b0e95bda97f287998e062da6e2"
PARENTS = {**EARLIER, "MathScope_Goal_Continuation108_Delta_20261120.zip":
           "17381e3771ed7441957556b5221903426f008fb22747784c0842d9b4ffec6e62"}
LEAN_PARENT = "2b29d471f81afabca63dcc16cca1cb3f969d528b"
LEAN_SHORT = "MathScope/M3/CD/ResidualPressureSquareTransfer.lean"
LEAN_PATH = "research-ide/mathscope-m3/p8/lean/" + LEAN_SHORT
THEOREMS = {"exterior_localized_radial_force", "exterior_localized_swirl_time_derivative"}
STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
LABEL = "MathScope_Goal_Continuation109"
DATE = "20261120"
REPORT, STATUS = "REPORT_CONTINUATION109_KO.md", "STATUS_CONTINUATION109.json"
PUBLIC = "preservation-continuation109.json"
PACKETS = {
    f"c109/{name}/": ("MANIFEST.json", "producedFiles")
    for name in ("lean-github", "n8-exterior-seam", "next-canonical-correction")
}
PACKETS["c109/fixed-n3-domain/"] = ("MANIFEST.json", "files")


def verify_members(raw, parse, bound):
    files = {}
    for root, (manifest, key) in PACKETS.items():
        assert entry(raw(root+manifest))["sha256"] == bound[root]["manifestSHA256"], root
        files[root+manifest] = "A"
        for leaf, digest in parse(root+manifest)[key].items():
            assert Path(leaf).name == leaf and leaf != manifest
            assert entry(raw(root+leaf))["sha256"] == digest, (root, leaf)
            files[root+leaf] = "A"
    base = "c109/n8-exterior-seam/"
    n8 = parse(base+"MANIFEST.json")["checks"]
    assert n8["sourceIdentifiedRestrictedAxes"] == 4
    assert n8["nestedPhysicalNodes"] == [225, 1377]
    assert n8["globalFourAxisComparisons"] == 0 and n8["wholeKLastResolvedTau"] is None
    patch = parse(base+"nonzero-exterior-seam.json")
    assert patch["finalJets"] == 0 and patch["release"] == "HOLD"
    base = "c109/next-canonical-correction/"
    j2 = parse(base+"MANIFEST.json")
    assert j2["reportedActiveCandidateAppendedNodes"] == 225012
    assert j2["activeRepeatedForcedSystems"] == 40 and j2["reportedTypedMappedPotentialCalls"] == 240
    assert j2["matchedUniqueAppendIds"] == 3544 and j2["missingArchiveToActiveMetadataPrefixMatches"] == 1705
    assert j2["activeAppendRegistry"] == j2["wholeSecondCorrection"] == "OPEN"
    fixed = parse("c109/fixed-n3-domain/fixed-n3-domain.json")
    assert fixed["fixedSlab"]["positiveRelativeLabels"] == [-1, 0, 1]
    assert fixed["fixedSlab"]["firstOmittedScaleTimesQ"] == ["1", "4"]
    assert fixed["firstCorrectionWhole"] == "CONDITIONAL"
    assert fixed["finalJets"] == 0 and fixed["release"] == "HOLD"
    return files


def check_lean(raw, parse, git, head):
    root = "c109/lean-github/"
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
    for name in (REPORT, STATUS, PUBLIC, "assemble_continuation109.py"):
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
               "hostedLeanTheorems": 2, "conditionalFirstCorrectionEnergy": "<2^-28", "activeFixedN3Rows": 162,
               "sameWholeFieldConvergenceAxes": 0, "restrictedNonzeroConvergenceAxes": 4, "M3": "62/64", "finalJets": "0/67", "release": "HOLD"}
    (outputs/f"{LABEL}_Report_{DATE}_KO.md").write_bytes(raw(REPORT))
    (outputs/f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    assemble(read_arguments(__doc__))
