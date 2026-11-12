"""Package the fourth potential source and this checkpoint's verified evidence."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import shutil
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation21 import PARENTS as PREVIOUS_PARENTS, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **PREVIOUS_PARENTS,
    "MathScope_Goal_Continuation21_Delta_20261112.zip":
        "e7dcd679af1fdd94bfe9951a6e67aa5f9dc7d968f9fa8d171bb39aa111a3fba6",
}
PARENT = "b0c58dfe5c80568f26466dffae2cdb63723601fd"
LABEL = "MathScope_Goal_Continuation22"
DATE = "20261112"
ARTIFACT_DIR = "inputs/original-whole-k-n4-primary-potential-C3"
GRAPH_DIR = "original-whole-k-primary-current-graph"
GRAPH_PINS = {
    "original-source-export-manifest.json": "5cadb9e7b4c780a056231d082351f23a17a47b47f4dcd54116778a8f9512cb17",
    "original-source-functions.json": "77c6a0bef59f24955753096a1ec211f112c86e4c2d65ba6f8eee3cbfc22031eb",
    "original-source-nodes.jsonl.gz": "d65357c9b12f7323ad91566e9bd4128386b1eb87e54d043ca94ab05d45ab44ee",
}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("workspace", "repo", "n4-artifact"):
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
    report = git("show", head + ":" + CURRENT + "/REPORT_KO.md")
    status = git("show", head + ":" + CURRENT + "/STATUS.json")
    acceptance = json.loads(status)
    assert acceptance["M3"]["accepted"] == 62
    assert acceptance["M4"]["accepted"] == 16 and acceptance["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert acceptance["jets"]["accepted"] == 0 and acceptance["release"] == "HOLD"

    delta = outputs / f"{LABEL}_Delta_{DATE}.zip"
    files = {}
    with ZipFile(delta, "w", compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(name, data):
            assert name not in files
            bundle.writestr(name, data)
            files[name] = entry(data)

        def add_input(name, expected_hash, expected_size=None):
            source = args.n4_artifact / name
            output = f"{ARTIFACT_DIR}/{name}"
            observed = {"sha256": file_sha(source), "bytes": source.stat().st_size}
            assert observed["sha256"] == expected_hash, source
            assert expected_size is None or observed["bytes"] == expected_size
            with source.open("rb") as contents, bundle.open(output, "w") as sink:
                shutil.copyfileobj(contents, sink, 1 << 20)
            files[output] = observed

        rows = git("diff", "--name-status", "--no-renames", PARENT, head).decode().splitlines()
        for line in rows:
            kind, path = line.split("\t")
            assert kind in {"A", "M"} and path.startswith((CURRENT + "/", "research-ide/mathscope-m3/p8/lean/"))
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            blob = git("show", head + ":" + path)
            alias = "lean/" + Path(path).name
            if kind == "M" and (path in older or alias in older):
                assert entry(git("show", PARENT + ":" + path)) == older.get(path, older.get(alias))
            add(path, blob)
            if alias in older:
                add(alias, blob)

        archived = f"{head}:{CURRENT}/whole-k-atlas/hosted-43219547189-N4/"
        for name in ("original-whole-k-prefix.json", "primary-C3-independent-readback.json"):
            receipt = git("show", archived + name)
            assert (args.n4_artifact / name).read_bytes() == receipt
            add(f"{ARTIFACT_DIR}/{name}", receipt)
        native = json.loads(git("show", archived + "original-whole-k-prefix.json"))["primaryC3Result"]
        assert native["nativeScope"]["actualFiniteDerivativeOrder"] == 2
        assert native["potentialOrderThree"]["power"] == 1283
        for name, expected in native["files"].items():
            add_input(name, expected["sha256"], expected["bytes"])
        for name, digest in GRAPH_PINS.items():
            add_input(f"{GRAPH_DIR}/{name}", digest)

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
            digest, size = sha256(), 0
            with bundle.open(path) as contents:
                for chunk in iter(lambda: contents.read(1 << 20), b""):
                    digest.update(chunk)
                    size += len(chunk)
            assert expected == {"bytes": size, "sha256": digest.hexdigest()}, path
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
