"""Package and verify changed evidence against the verified Continuation17 ZIP."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import subprocess
import zipfile


BASE_HEAD = "cf86a6057ad63c88f3734afd55b9a6c09b01d3f5"
BASE_SHA = "33b7bfeb485e1a1bbe6ead7fc0817086580634d85d6b9878124985a07220f657"
BRANCH = "mathscope-cd-axial-source-bridge-20261029"
CURRENT = "tools/mathscope-cd-axial-bridge-20261029/goal-next"


def file_sha(path):
    digest = sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2)+"\n").encode()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("workspace", "n3-reached", "n4-reached"):
        parser.add_argument("--"+name, type=Path, required=True)
    args = parser.parse_args()
    workspace = args.workspace.resolve()
    repo = workspace / "work/MathScopeCompute-CD"
    outputs = workspace / "outputs"
    base = outputs / "MathScope_Goal_Continuation17_20261111.zip"
    delta = outputs / "MathScope_Goal_Continuation18_Delta_20261111.zip"

    def git(*params):
        return subprocess.check_output(["git", "-c", "core.longpaths=true", *params], cwd=repo)

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH
    assert git("ls-remote", "origin", "refs/heads/"+BRANCH).decode().split()[0] == head
    assert file_sha(base) == BASE_SHA
    rows = git("diff", "--name-status", BASE_HEAD, head).decode().splitlines()
    changes = [row.split("\t") for row in rows]
    assert changes and all(len(row) == 2 and row[0] in {"A", "M"} for row in changes)
    files = {}
    report = git("show", head+":"+CURRENT+"/REPORT_KO.md")
    status = git("show", head+":"+CURRENT+"/STATUS.json")
    counts = json.loads(status)
    assert counts["M3"]["accepted"] == 62 and counts["M4"]["accepted"] == 16
    assert counts["jets"]["accepted"] == 0 and counts["release"] == "HOLD"
    with zipfile.ZipFile(base) as original, zipfile.ZipFile(
        delta, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=5
    ) as evidence:
        base_manifest = json.loads(original.read("SHA256.json"))

        def put(name, data):
            assert name not in files
            evidence.writestr(name, data)
            files[name] = {"sha256": sha256(data).hexdigest(), "bytes": len(data)}

        for kind, path in changes:
            assert path.startswith((CURRENT+"/", ".github/workflows/", "research-ide/mathscope-m3/p8/lean/"))
            if kind == "M":
                assert path in base_manifest and sha256(original.read(path)).hexdigest() == base_manifest[path]["sha256"]
            data = git("show", head+":"+path)
            assert (repo/path).read_bytes() == data
            put(path, data)
        for n, path, expected in (
            (3, args.n3_reached, "3de8ebed1c18e6d5ec3d104d82e2b5c65302c82865f0025015ba23b96cc886fa"),
            (4, args.n4_reached, "1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc"),
        ):
            data = path.read_bytes()
            assert sha256(data).hexdigest() == expected
            put(f"inputs/original-whole-k-n{n}-diagonal/y-reached.json", data)
        put("REPORT_KO.md", report)
        put("STATUS.json", status)
        put("CHECKPOINT.json", encode({
            "schema": "MathScope.GoalEvidenceDelta/1",
            "base": {"file": base.name, "sha256": BASE_SHA, "commit": BASE_HEAD},
            "deltaCommit": head,
            "applyOrder": "Extract the base ZIP, then this ZIP to the same folder. Use the newer REPORT_KO.md and STATUS.json.",
            "filesThatSupersedeBase": sorted(set(files)&set(base_manifest)),
            "M4": "16 accepted in the same isolated candidate. No M4 evaluator or candidate file changed.",
            "release": "HOLD",
        }))
        evidence.writestr("SHA256.json", encode(files))
    with zipfile.ZipFile(delta) as evidence:
        assert evidence.testzip() is None
        assert set(evidence.namelist()) == set(files)|{"SHA256.json"}
        assert json.loads(evidence.read("SHA256.json")) == files
        for name, expected in files.items():
            data = evidence.read(name)
            assert {"sha256": sha256(data).hexdigest(), "bytes": len(data)} == expected
    receipt = {
        "file": delta.name, "bytes": delta.stat().st_size, "files": len(files)+1,
        "sha256": file_sha(delta), "branchHead": head,
        "verifiedBaseSHA256": BASE_SHA, "verifiedDeltaManifest": True,
    }
    (outputs/"MathScope_Goal_Continuation18_Report_20261111_KO.md").write_bytes(report)
    (outputs/"MathScope_Goal_Continuation18_Receipt_20261111.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
