"""Package the fixed-slab mean and Primary evidence with pinned original runtimes."""

from argparse import ArgumentParser
from io import BytesIO
import json
from pathlib import Path, PurePosixPath
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation26 import PARENTS as PREVIOUS_PARENTS, ORIGINAL, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **PREVIOUS_PARENTS,
    "MathScope_Goal_Continuation26_Delta_20261113.zip":
        "fa818be2e2aa69e6bdd7be6ab8ab35b4c7be9245fe53ea600f2a82f0ca273e2b",
}
PARENT = "eebda44fd9458995b49e003944f816dc284c9820"
LABEL = "MathScope_Goal_Continuation27"
DATE = "20261113"
WORKFLOW = ".github/workflows/mathscope-original-primary-c5.yml"
RUNTIMES = {
    "original-primary-degree-runtime": (
        119, "4ed49674a762ecf54adaa8ddf9b5c0955c484b5442dc251d862f0156f502f066"),
    "original-radial-runtime": (
        132, "ba104452d70f327c00a1095d44031444869cf38711781154464fb844881c2824"),
}
MANIFEST = "GIT-SOURCE-SHA256.json"


def git_blobs(git, commit, paths):
    requests = "".join(f"{commit}:{path}\n" for path in paths).encode()
    stream = BytesIO(git("cat-file", "--batch", input=requests))
    for path in paths:
        _, kind, size = stream.readline().split()
        assert kind == b"blob", path
        data = stream.read(int(size))
        assert len(data) == int(size) and stream.read(1) == b"\n", path
        yield path, data
    assert not stream.read(1)


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("workspace", "repo", "runtime-root"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    outputs = args.workspace / "outputs"

    def git(*params, input=None):
        return subprocess.check_output(
            ["git", "-c", "core.longpaths=true", *params], cwd=args.repo, input=input
        )

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH
    assert git("ls-remote", "origin", "refs/heads/" + BRANCH).decode().split()[0] == head
    older = {}
    for name, digest in PARENTS.items():
        path = outputs / name
        assert file_sha(path) == digest, name
        with ZipFile(path) as ancestor:
            older.update(json.loads(ancestor.read("SHA256.json")))

    report, status = [
        git("show", f"{head}:{CURRENT}/{name}") for name in ("REPORT_KO.md", "STATUS.json")
    ]
    summary = json.loads(status)
    assert summary["M3"]["accepted"] == 62 and summary["jets"]["accepted"] == 0
    assert summary["M4"]["accepted"] == 16 and summary["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert summary["release"] == "HOLD"
    assert summary["continuation27"]["initializedMean"]["positiveLongitudinalNumericalUpperEndpoints"] == 57
    assert summary["continuation27"]["primaryC5"]["fixedSlabCoefficientRows"] == 25
    assert summary["continuation27"]["advancedOfficialCounts"] is False

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
            assert kind in {"A", "M"} and (path.startswith(CURRENT + "/") or path == WORKFLOW), path
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            if kind == "M" and path in older:
                assert entry(git("show", PARENT + ":" + path)) == older[path], path
            add(path, git("show", head + ":" + path))

        for name, (count, digest) in RUNTIMES.items():
            root = args.runtime_root / name
            manifest = (root / MANIFEST).read_bytes()
            assert entry(manifest)["sha256"] == digest
            expected = json.loads(manifest)
            assert len(expected) == count
            for path, data in git_blobs(git, ORIGINAL, sorted(expected)):
                assert path.startswith("research-ide/") and ".." not in PurePosixPath(path).parts
                assert entry(data)["sha256"] == expected[path] and (root / path).read_bytes() == data, path
                add(f"inputs/{name}/{path}", data)
            add(f"inputs/{name}/{MANIFEST}", manifest)

        add("REPORT_KO.md", report)
        add("STATUS.json", status)
        add("CHECKPOINT.json", encode({
            "schema": "MathScope.GoalEvidenceDelta/1", "parentsInOrder": PARENTS,
            "parentCommit": PARENT, "deltaCommit": head, "originalRuntimeCommit": ORIGINAL,
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
        "verifiedRuntimeFileCounts": {name: count for name, (count, _) in RUNTIMES.items()},
        "verifiedDeltaManifest": True,
    }
    (outputs / f"{LABEL}_Report_{DATE}_KO.md").write_bytes(report)
    (outputs / f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
