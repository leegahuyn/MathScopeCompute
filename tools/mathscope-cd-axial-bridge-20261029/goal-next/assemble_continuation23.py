"""Package the initialized jet operands and their replay evidence."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation22 import PARENTS as PREVIOUS_PARENTS, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **PREVIOUS_PARENTS,
    "MathScope_Goal_Continuation22_Delta_20261112.zip":
        "43038d500f3327bf3205970fd25f93ca211e9cc96f6ff96ee74b4bf4ecb52392",
}
PARENT = "0df39b5795491083b667249fa56cf3a91a1649d0"
LABEL = "MathScope_Goal_Continuation23"
DATE = "20261113"
WORKFLOW = ".github/workflows/mathscope-primary-forced-join.yml"
NATIVE_INPUTS = {
    "source-harmonic-assembly.mjs":
        "339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20",
    "source-global-temporal.mjs":
        "d5e20e78c119b678b61df35c1bf0f560826e7dddb74e70edd0c17a67d18a9759",
    "source-auxiliary-derivative-closure.mjs":
        "9541710d750b16d215b08d06384898ae63d77ade30c2cb93aaed1308505b039b",
}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("workspace", "repo", "m3-native"):
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
        assert file_sha(path) == digest
        with ZipFile(path) as ancestor:
            older.update(json.loads(ancestor.read("SHA256.json")))
    report = git("show", f"{head}:{CURRENT}/REPORT_KO.md")
    status = git("show", f"{head}:{CURRENT}/STATUS.json")
    summary = json.loads(status)
    assert summary["M3"]["accepted"] == 62
    assert summary["M4"]["accepted"] == 16 and summary["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert summary["jets"]["accepted"] == 0 and summary["release"] == "HOLD"
    assert summary["jets"]["annularInitializedStageZero"]["symbolicAtoms"] == 67
    assert summary["continuation23"]["originalRegisteredFinitePicardDomain"]["verifiedFiniteWordLeanRun"] == 43239867740

    delta = outputs / f"{LABEL}_Delta_{DATE}.zip"
    files = {}
    with ZipFile(delta, "w", compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(name, data):
            assert name not in files
            bundle.writestr(name, data)
            files[name] = entry(data)

        for row in git("diff", "--name-status", "--no-renames", PARENT, head).decode().splitlines():
            kind, path = row.split("\t")
            assert kind in {"A", "M"}
            assert path == WORKFLOW or path.startswith((CURRENT + "/", "research-ide/mathscope-m3/p8/lean/"))
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            source = git("show", head + ":" + path)
            alias = "lean/" + Path(path).name
            if kind == "M" and (path in older or alias in older):
                assert entry(git("show", PARENT + ":" + path)) == older.get(path, older.get(alias))
            add(path, source)
            if alias in older:
                add(alias, source)

        for name, digest in NATIVE_INPUTS.items():
            data = (args.m3_native / name).read_bytes()
            assert sha256(data).hexdigest() == digest, name
            archive_name = "inputs/original-core-runtime/research-ide/mathscope-m3/navier/" + name
            if archive_name in older:
                assert entry(data) == older[archive_name], archive_name
            else:
                add(archive_name, data)
        add("REPORT_KO.md", report)
        add("STATUS.json", status)
        add("CHECKPOINT.json", encode({
            "schema": "MathScope.GoalEvidenceDelta/1",
            "parentsInOrder": PARENTS,
            "parentCommit": PARENT, "deltaCommit": head,
            "filesThatSupersedeParents": sorted(set(files) & set(older)),
            "release": "HOLD",
        }))
        bundle.writestr("SHA256.json", encode(files))

    with ZipFile(delta) as bundle:
        assert bundle.testzip() is None
        assert set(bundle.namelist()) == set(files) | {"SHA256.json"}
        assert json.loads(bundle.read("SHA256.json")) == files
        for path, expected in files.items():
            assert entry(bundle.read(path)) == expected, path
    receipt = {
        "file": delta.name, "bytes": delta.stat().st_size, "files": len(files) + 1,
        "sha256": file_sha(delta), "branchHead": head, "verifiedParentsInOrder": PARENTS,
        "verifiedDeltaManifest": True,
    }
    (outputs / f"{LABEL}_Report_{DATE}_KO.md").write_bytes(report)
    (outputs / f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
