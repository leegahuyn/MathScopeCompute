"""Verify and package the archived C3 mean evidence and GitHub receipts."""

from argparse import ArgumentParser
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation27 import PARENTS as PREVIOUS_PARENTS, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **PREVIOUS_PARENTS,
    "MathScope_Goal_Continuation27_Delta_20261113.zip":
        "839bbb11d07499548d2d7e76af5a257ade6afea9d1d229cef346a373c6722157",
}
PARENT = "cb24ce481e0c297306eb3e73321abb932c06ee4b"
LABEL = "MathScope_Goal_Continuation28"
DATE = "20261113"
LEAN = "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/AnnularGaussianPole.lean"
ALLOWED = {
    ".github/workflows/mathscope-cd-axial-bridge-20261029.yml",
    ".github/workflows/mathscope-original-primary-c5.yml",
    LEAN,
}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("workspace", "repo"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    outputs = args.workspace / "outputs"

    def git(*params):
        return subprocess.check_output(["git", "-c", "core.longpaths=true", *params], cwd=args.repo)

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH
    assert git("ls-remote", "origin", "refs/heads/" + BRANCH).decode().split()[0] == head
    older = {}
    for name, digest in PARENTS.items():
        path = outputs / name
        assert file_sha(path) == digest, name
        with ZipFile(path) as ancestor:
            older.update(json.loads(ancestor.read("SHA256.json")))

    report, status = [git("show", f"{head}:{CURRENT}/{name}") for name in ("REPORT_KO.md", "STATUS.json")]
    summary = json.loads(status)
    assert summary["M3"]["accepted"] == 62 and summary["jets"]["accepted"] == 0
    assert summary["M4"]["accepted"] == 16 and summary["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert summary["release"] == "HOLD"
    scope = summary["continuation28"]
    assert scope["archivedInitializedMean"]["meanBindings"] == 156
    assert scope["advancedOfficialCounts"] is False
    proof = scope["annularGaussianPoleLean"]
    ci = f"{CURRENT}/ci-{proof['run']}"
    digest = entry(git("show", head + ":" + LEAN))["sha256"]
    assert digest == proof["sourceSHA256"]
    sha_list = git("show", f"{head}:{ci}/source-sha256.txt")
    assert (digest + "  MathScope/M3/CD/AnnularGaussianPole.lean\n").encode() in sha_list
    log = git("show", f"{head}:{ci}/AnnularGaussianPole.log")
    assert entry(log)["sha256"] == proof["cleanLogSHA256"]
    assert log == b"'MathScope.M3.CD.annularGaussianPole' depends on axioms: [propext, Classical.choice, Quot.sound]\n"
    native = scope["compactGraphStorage"]
    native_path = f"{CURRENT}/primary-forced-weights/live-c5/hosted-{native['hostedC8Retry']}/primary-c5-native.json"
    raw = git("show", head + ":" + native_path)
    assert entry(raw)["sha256"] == native["receiptSHA256"]
    native_receipt = json.loads(raw)
    last = native_receipt["progress"][-1]
    assert last["name"] == native["lastStage"] and last["nodeCount"] == native["nodes"]
    assert last["coefficientFTCCount"] == native["coefficientFTCCount"]
    assert native_receipt["error"]["message"] == "Invalid string length"

    delta = outputs / f"{LABEL}_Delta_{DATE}.zip"
    pending = delta.with_suffix(".zip.tmp")
    files = {}
    with ZipFile(pending, "w", compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(name, data):
            assert name not in files
            bundle.writestr(name, data)
            files[name] = entry(data)

        for row in git("diff", "--name-status", "--no-renames", PARENT, head).decode().splitlines():
            kind, path = row.split("\t")
            assert kind in {"A", "M"} and (path.startswith(CURRENT + "/") or path in ALLOWED), path
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            if kind == "M" and path in older:
                assert entry(git("show", PARENT + ":" + path)) == older[path], path
            add(path, git("show", head + ":" + path))

        add("REPORT_KO.md", report)
        add("STATUS.json", status)
        add("CHECKPOINT.json", encode({
            "schema": "MathScope.GoalEvidenceDelta/1", "parentsInOrder": PARENTS,
            "parentCommit": PARENT, "deltaCommit": head,
            "filesThatSupersedeParents": sorted(set(files) & set(older)),
            "release": "HOLD",
        }))
        bundle.writestr("SHA256.json", encode(files))

    with ZipFile(pending) as bundle:
        assert bundle.testzip() is None
        assert set(bundle.namelist()) == set(files) | {"SHA256.json"}
        assert json.loads(bundle.read("SHA256.json")) == files
        for path, expected in files.items():
            assert entry(bundle.read(path)) == expected, path
    pending.replace(delta)
    receipt = {
        "file": delta.name, "bytes": delta.stat().st_size, "files": len(files) + 1,
        "sha256": file_sha(delta), "branchHead": head, "verifiedParentsInOrder": PARENTS,
        "verifiedGitHubLeanSourceSHA256": digest, "verifiedC8StopNodeCount": native["nodes"],
        "verifiedDeltaManifest": True,
    }
    (outputs / f"{LABEL}_Report_{DATE}_KO.md").write_bytes(report)
    (outputs / f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
