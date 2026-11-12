"""Write and replay the small evidence overlay on Continuation17 and Continuation20."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    "MathScope_Goal_Continuation17_20261111.zip":
        "33b7bfeb485e1a1bbe6ead7fc0817086580634d85d6b9878124985a07220f657",
    "MathScope_Goal_Continuation20_Delta_20261112.zip":
        "edce8b917f23878aee2f3a5bfd0bf7d0616e2af17c4ff7a4a9ec481949427496",
}
PARENT_COMMIT = "d3508953f2bb66b9de3b3eb2cdac3dd1cc1959d9"
LABEL = "MathScope_Goal_Continuation21"
DATE = "20261112"


def entry(data):
    return {"bytes": len(data), "sha256": sha256(data).hexdigest()}


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("workspace", type=Path)
    workspace = parser.parse_args().workspace.resolve()
    outputs = workspace / "outputs"
    repo = workspace / "work/MathScopeCompute-CD"

    def git(*params):
        return subprocess.check_output(["git", "-c", "core.longpaths=true", *params], cwd=repo)

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH
    assert git("ls-remote", "origin", "refs/heads/" + BRANCH).decode().split()[0] == head

    older = {}
    for filename, digest in PARENTS.items():
        path = outputs / filename
        assert file_sha(path) == digest
        with ZipFile(path) as previous:
            older.update(json.loads(previous.read("SHA256.json")))

    report = git("show", head + ":" + CURRENT + "/REPORT_KO.md")
    status = git("show", head + ":" + CURRENT + "/STATUS.json")
    counts = json.loads(status)
    assert counts["M3"]["accepted"] == 62 and counts["M4"]["accepted"] == 16
    assert counts["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert counts["jets"]["accepted"] == 0 and counts["release"] == "HOLD"

    delta = outputs / f"{LABEL}_Delta_{DATE}.zip"
    files = {}
    with ZipFile(delta, "w", compression=ZIP_DEFLATED, compresslevel=6) as bundle:
        def add(path, data):
            assert path not in files
            bundle.writestr(path, data)
            files[path] = entry(data)

        changes = git("diff", "--name-status", "--no-renames", PARENT_COMMIT, head).decode().splitlines()
        for row in changes:
            kind, path = row.split("\t")
            assert kind in {"A", "M"}
            assert path.startswith((CURRENT + "/", "research-ide/mathscope-m3/p8/lean/", ".github/workflows/"))
            data = git("show", head + ":" + path)
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            alias = "lean/" + Path(path).name
            if kind == "M" and (path in older or alias in older):
                before = git("show", PARENT_COMMIT + ":" + path)
                assert entry(before) == older.get(path, older.get(alias)), path
            add(path, data)
            if alias in older:
                add(alias, data)
        add("REPORT_KO.md", report)
        add("STATUS.json", status)
        add("CHECKPOINT.json", encode({
            "schema": "MathScope.GoalEvidenceDelta/1",
            "parentsInOrder": PARENTS,
            "parentCommit": PARENT_COMMIT,
            "deltaCommit": head,
            "filesThatSupersedeParents": sorted(set(files) & set(older)),
            "release": "HOLD",
        }))
        bundle.writestr("SHA256.json", encode(files))
    with ZipFile(delta) as bundle:
        assert bundle.testzip() is None
        assert len(bundle.namelist()) == len(files) + 1
        assert json.loads(bundle.read("SHA256.json")) == files
        for path, expected in files.items():
            assert entry(bundle.read(path)) == expected, path

    receipt = {
        "file": delta.name,
        "bytes": delta.stat().st_size,
        "files": len(files) + 1,
        "sha256": file_sha(delta),
        "branchHead": head,
        "verifiedParentsInOrder": PARENTS,
        "verifiedDeltaManifest": True,
    }
    (outputs / f"{LABEL}_Report_{DATE}_KO.md").write_bytes(report)
    (outputs / f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
