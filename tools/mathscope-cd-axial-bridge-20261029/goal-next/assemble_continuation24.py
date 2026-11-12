"""Package the actual slow-field numerical intervals and verification inputs."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation23 import PARENTS as PREVIOUS_PARENTS, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **PREVIOUS_PARENTS,
    "MathScope_Goal_Continuation23_Delta_20261113.zip":
        "34f8b3ab201210a1534985c736ae91ab4f03f4514964a7642c77087583132582",
}
PARENT = "479388c9a23ee3de0f9eb8f06996e0ac6e9f3140"
LABEL = "MathScope_Goal_Continuation24"
DATE = "20261113"
ORIGINAL = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
PRODUCTION_SHA = "a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48"
FORCED_PULSE_SHA = "129423c917b3b8b1aae72b242f802e9f9934f17569fa895c669708785dbff924"


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("workspace", "repo", "runtime", "runtime-pins", "operational-html", "forced-pulse"):
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
    assert summary["M3"]["accepted"] == 62 and summary["jets"]["accepted"] == 0
    assert summary["M4"]["accepted"] == 16 and summary["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert summary["release"] == "HOLD"
    assert summary["continuation24"]["annularSlowNumerical"]["slowAtoms"] == 67

    delta = outputs / f"{LABEL}_Delta_{DATE}.zip"
    files = {}
    with ZipFile(delta, "w", compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(name, data):
            assert name not in files
            bundle.writestr(name, data)
            files[name] = entry(data)

        for row in git("diff", "--name-status", "--no-renames", PARENT, head).decode().splitlines():
            kind, path = row.split("\t")
            assert kind in {"A", "M"} and path.startswith(CURRENT + "/")
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            if kind == "M" and path in older:
                assert entry(git("show", PARENT + ":" + path)) == older[path]
            add(path, git("show", head + ":" + path))

        pins = json.loads(args.runtime_pins.read_bytes())
        assert len(pins) == 94
        for path, digest in pins.items():
            assert path.startswith("research-ide/") and ".." not in Path(path).parts
            data = (args.runtime / path).read_bytes()
            assert sha256(data).hexdigest() == digest
            assert data == git("show", ORIGINAL + ":" + path), path
            add("inputs/annular-numerical-runtime/" + path, data)
        add("inputs/annular-numerical-runtime/GIT-SOURCE-SHA256.json", encode(pins))
        for path, expected, name in (
            (args.operational_html, PRODUCTION_SHA, "inputs/operational-m4/production-v137.html"),
            (args.forced_pulse, FORCED_PULSE_SHA, "inputs/original-core-runtime/research-ide/mathscope-m3/navier/source-forced-pulse.mjs"),
        ):
            data = path.read_bytes()
            assert sha256(data).hexdigest() == expected, path
            if name in older:
                assert entry(data) == older[name]
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
