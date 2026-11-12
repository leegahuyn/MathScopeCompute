"""Package the initialized energy integrals and original Forced evidence."""

from argparse import ArgumentParser
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation25 import PARENTS as PREVIOUS_PARENTS, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **PREVIOUS_PARENTS,
    "MathScope_Goal_Continuation25_Delta_20261113.zip":
        "ad7b7bd93dc62cdf56e66223d97056b9d4cccf490e675a64b439f655065cbe39",
}
PARENT = "cf828979190e9f4b2a84eee6fd988c6a547c1d22"
LABEL = "MathScope_Goal_Continuation26"
DATE = "20261113"
ORIGINAL = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
MODE_ONE_INPUTS = {
    "mathscope-m3/navier/source-harmonic-assembly.mjs": (
        ORIGINAL, "339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20"),
    "mathscope-m3/navier/source-initialized-angular.mjs": (
        PARENT, "3e4f32a554e8e2ceccd3e003aa220c2f191c23b98cceb3b07f1f2d81e4bf2f1d"),
    "mathscope-m3/navier/source-global-band.mjs": (
        ORIGINAL, "babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60"),
    "mathscope-m3/navier/source-global-angular.mjs": (
        ORIGINAL, "4e9c3ea67b124a953856f83d0aca0dcfec4b01a245043424de2bb035b8d902ca"),
    "mathscope-m3/navier/source-global-pressure.mjs": (
        ORIGINAL, "fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d"),
    "mathscope-m2/navier/actual-covariance-source-certificate.mjs": (
        ORIGINAL, "c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681"),
    "mathscope-m2/navier/actual-covariance-matrix.mjs": (
        ORIGINAL, "7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26"),
    "mathscope-m2/navier/actual-full-curl.mjs": (
        ORIGINAL, "4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2"),
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
        assert file_sha(path) == digest
        with ZipFile(path) as ancestor:
            older.update(json.loads(ancestor.read("SHA256.json")))

    report = git("show", f"{head}:{CURRENT}/REPORT_KO.md")
    status = git("show", f"{head}:{CURRENT}/STATUS.json")
    summary = json.loads(status)
    assert summary["M3"]["accepted"] == 62 and summary["jets"]["accepted"] == 0
    assert summary["M4"]["accepted"] == 16 and summary["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert summary["release"] == "HOLD"
    assert summary["continuation26"]["movingAnnulusEnergy"]["additiveLayouts"] == 4
    assert summary["continuation26"]["forcedModeOne"]["archivedComponents"] == 60

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
            assert kind in {"A", "M"} and path.startswith(CURRENT + "/")
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            if kind == "M" and path in older:
                assert entry(git("show", PARENT + ":" + path)) == older[path], path
            add(path, git("show", head + ":" + path))

        for path, (commit, expected) in MODE_ONE_INPUTS.items():
            source = "research-ide/" + path
            data = git("show", commit + ":" + source)
            assert entry(data)["sha256"] == expected, source
            add("inputs/mode-one-source/" + source, data)
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
        "verifiedModeOneSourceFiles": len(MODE_ONE_INPUTS), "verifiedDeltaManifest": True,
    }
    (outputs / f"{LABEL}_Report_{DATE}_KO.md").write_bytes(report)
    (outputs / f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
