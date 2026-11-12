"""Package original annular initialization, directed bounds and replay evidence."""

from argparse import ArgumentParser
import json
from pathlib import Path
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation24 import PARENTS as PREVIOUS_PARENTS, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **PREVIOUS_PARENTS,
    "MathScope_Goal_Continuation24_Delta_20261113.zip":
        "f597848d79e7d3509f28453c19c81be11b6e98d6ae3a895fe51b07e85191bc1e",
}
PARENT = "b14e3092b89d2676f08b8a4d40917902bd6c2ed1"
LABEL = "MathScope_Goal_Continuation25"
DATE = "20261113"
RUNTIME = "inputs/annular-numerical-runtime/"
ORIGINAL = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
LOCALIZATION_ORIGINAL = "eab39dfb1028535b17b5878bc4a17d0de3358020"


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
        assert file_sha(path) == digest
        with ZipFile(path) as ancestor:
            older.update(json.loads(ancestor.read("SHA256.json")))
            if "Continuation24" in name:
                raw_pins = ancestor.read(RUNTIME + "GIT-SOURCE-SHA256.json")
                assert entry(raw_pins) == older[RUNTIME + "GIT-SOURCE-SHA256.json"]
                pins = json.loads(raw_pins)
                assert len(pins) == 94
                for source, digest in pins.items():
                    data = ancestor.read(RUNTIME + source)
                    assert entry(data) == older[RUNTIME + source]
                    assert entry(data)["sha256"] == digest
                    assert data == git("show", ORIGINAL + ":" + source), source

    report = git("show", f"{head}:{CURRENT}/REPORT_KO.md")
    status = git("show", f"{head}:{CURRENT}/STATUS.json")
    summary = json.loads(status)
    assert summary["M3"]["accepted"] == 62 and summary["jets"]["accepted"] == 0
    assert summary["M4"]["accepted"] == 16 and summary["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert summary["release"] == "HOLD"
    assert summary["continuation25"]["initializedAnnularNumerical"]["atoms"] == 67
    assert summary["continuation25"]["initializedAnnularNumerical"]["externalInputs"] == 108

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
            assert kind in {"A", "M"} and (
                path.startswith(CURRENT + "/") or path == ".github/workflows/mathscope-primary-forced-join.yml"
            )
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            if kind == "M" and path in older:
                assert entry(git("show", PARENT + ":" + path)) == older[path], path
            add(path, git("show", head + ":" + path))
        source_manifest = git(
            "show", f"{head}:{CURRENT}/whole-k-annular-initial/localized-force/SOURCE_INPUTS.md"
        ).decode().replace("\r\n", "\n")
        localization_inputs = re.findall(
            r"^\| `(research-ide/[^\n`]+)` \| `([a-f0-9]{64})` \| `([a-f0-9]{40})` \|$",
            source_manifest, re.MULTILINE,
        )
        assert len(localization_inputs) == 7
        for source, digest, blob in localization_inputs:
            assert git("rev-parse", LOCALIZATION_ORIGINAL + ":" + source).decode().strip() == blob
            data = git("cat-file", "blob", blob)
            assert entry(data)["sha256"] == digest
            name = "inputs/localization-source/" + source
            if name in older:
                assert older[name] == entry(data)
            else:
                add(name, data)
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
        "verifiedOriginalRuntimeFiles": len(pins), "verifiedDeltaManifest": True,
    }
    (outputs / f"{LABEL}_Report_{DATE}_KO.md").write_bytes(report)
    (outputs / f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
