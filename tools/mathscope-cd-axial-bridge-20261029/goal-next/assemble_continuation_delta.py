"""Package and verify changed evidence against the verified Continuation17 ZIP."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import shutil
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
    for name in ("workspace", "n2-reached", "n3-reached", "n4-reached"):
        parser.add_argument("--"+name, type=Path, required=True)
    parser.add_argument("--potential-artifacts", type=Path, required=True)
    parser.add_argument("--primary-artifacts", type=Path, required=True)
    parser.add_argument("--fourth-inputs", type=Path, required=True)
    args = parser.parse_args()
    workspace = args.workspace.resolve()
    repo = workspace / "work/MathScopeCompute-CD"
    outputs = workspace / "outputs"
    base = outputs / "MathScope_Goal_Continuation17_20261111.zip"
    label = "MathScope_Goal_Continuation20"
    delta = outputs / f"{label}_Delta_20261112.zip"

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

        def put_file(name, source, expected=None):
            assert name not in files
            observed = {"sha256": file_sha(source), "bytes": source.stat().st_size}
            if expected is not None:
                assert observed == expected, (name, observed)
            with source.open("rb") as incoming, evidence.open(name, "w") as outgoing:
                shutil.copyfileobj(incoming, outgoing, 1 << 20)
            files[name] = observed

        for kind, path in changes:
            assert path.startswith((CURRENT+"/", ".github/workflows/", "research-ide/mathscope-m3/p8/lean/"))
            if kind == "M":
                alias = path if path in base_manifest else "lean/"+Path(path).name
                assert alias in base_manifest
                old = original.read(alias)
                assert sha256(old).hexdigest() == base_manifest[alias]["sha256"]
                if alias != path:
                    assert old == git("show", BASE_HEAD+":"+path)
            data = git("show", head+":"+path)
            assert (repo/path).read_bytes() == data
            put(path, data)
            if kind == "M" and alias != path:
                put(alias, data)
        for group, path, expected in (
            ("original-axial-n2", args.n2_reached, "4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32"),
            ("original-whole-k-n3-diagonal", args.n3_reached, "3de8ebed1c18e6d5ec3d104d82e2b5c65302c82865f0025015ba23b96cc886fa"),
            ("original-whole-k-n4-diagonal", args.n4_reached, "1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc"),
        ):
            data = path.read_bytes()
            assert sha256(data).hexdigest() == expected
            put(f"inputs/{group}/y-reached.json", data)
        for n, run, group, artifact in (
            (2, 43066373460, "primary-potential-C3", args.potential_artifacts),
            (3, 43066373460, "primary-potential-C3", args.potential_artifacts),
            (2, 43065642858, "primary-C3", args.primary_artifacts),
        ):
            hosted = artifact / f"mathscope-whole-k-primary-C3-N{n}"
            original_prefix = (hosted/"original-whole-k-prefix.json").read_bytes()
            archived = head+":"+CURRENT+f"/whole-k-atlas/hosted-{run}-N{n}"
            assert original_prefix == git("show", archived+"/original-whole-k-prefix.json")
            native_files = json.loads(original_prefix)["primaryC3Result"]["files"]
            assert set(native_files) == {
                "primary-C3-certificate.json", "primary-C3-additive-program.json", "primary-C3-target-program.json",
            }
            files_prefix = f"inputs/original-whole-k-n{n}-{group}"
            for name, expected in native_files.items():
                put_file(f"{files_prefix}/{name}", hosted/name, expected)
            graph = "original-whole-k-primary-current-graph"
            for name in ("original-source-export-manifest.json", "original-source-functions.json", "original-source-nodes.jsonl.gz"):
                put_file(f"{files_prefix}/{graph}/{name}", hosted/graph/name)
            for name in ("original-whole-k-prefix.json", "primary-C3-independent-readback.json"):
                assert (hosted/name).read_bytes() == git("show", archived+"/"+name)
                put_file(f"{files_prefix}/{name}", hosted/name)
        localization = "research-ide/mathscope-m3/closure-evidence-20261023"
        for name, expected in (
            ("original_torus_fourier_interval.py", "a57677542de54d521d6ab72039b94fa869452f15637a586876e85c10af259499"),
            ("rigorous_rational_intervals.py", "e5f63a02a7cef384eafb697be14f1e9c8dccca973b8c51b6e296a592c0f87616"),
        ):
            path = f"{localization}/{name}"
            source = workspace/"work/goal-next/final67/source"/path
            put_file(f"inputs/localization-source/{path}", source,
                     {"sha256": expected, "bytes": source.stat().st_size})
        fourth_pins = {
            "fourth-ftc-prefix-capture.json": "758275f4cd1b23d38babfc91a3be3f961e073271a077db58523edbc22532c4b8",
            "fourth-ftc-exact-bodies.json.gz": "908cf614b88e1bd6c5f5ab9c49977d66fed82b57bbfcf60bc93cfc0c92606caa",
            "historical-c4-operands.json": "e1c782cbb6ea5670e618e41833a4d7f640d6ed50d02d6c4f73607e1b52f4790f",
            "fourth-ftc-all-upper-operands.json": "d1a32576780f3c10956d03aaca6f51a5cd408a1ae5558e31e04384bbccab33bd",
            "fourth-threshold-source.json": "1a5ce5577bd4c5d47975b89a1de4433eb37a46068ba388459d2821f8ddd0c69a",
            "fourth-archived-selector-stage.json": "0c7285a274b3442eca8cf2127c3d279f8a09ec0db48f5d444006f23d324b3cd8",
            "fourth-archived-selector-final.json": "88f7cf6fe5af934d6b3bcacc8ad975e86bd0b37fee2110b9db8c73e72acb129e",
            "historical-scale-arithmetic-input.json": "03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0",
            "historical-c4-relative-degree.json": "018af4f89ff5b43a3d6cd6a6096034070371e51170428991ec466c2e735b9497",
            "fourth-ftc-relative-degree.json": "49e6a71566c13cf22910d94fed5f9d75e7361d79e2fa381b3618404b14e29649",
            "historical-c4-relative-atoms.json": "48c7f9b4d051ae2ede6c568079daf9a53ebf960e8cc7884b4c01797ee14eef8b",
            "fourth-ftc-relative-atoms.json": "f647cffde45b05c896c59fbe96c0fc5789d8521ce8ad30b05ebfbbb712d25e26",
            "historical-c4-atoms-directed.json": "26932ce7c403658fed60c07733fedcd58953005c6b156f1e3e056946c0051844",
            "fourth-ftc-atoms-directed.json": "cab725cdeec1ce06d1ec20bad5b90ad1cb43219c2fc7a2368d896768fc32fc42",
        }
        for name, expected in fourth_pins.items():
            source = args.fourth_inputs/name
            put_file(f"inputs/fourth-selector/{name}", source,
                     {"sha256": expected, "bytes": source.stat().st_size})
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
            digest, count = sha256(), 0
            with evidence.open(name) as stream:
                for block in iter(lambda: stream.read(1 << 20), b""):
                    digest.update(block)
                    count += len(block)
            assert {"sha256": digest.hexdigest(), "bytes": count} == expected
    receipt = {
        "file": delta.name, "bytes": delta.stat().st_size, "files": len(files)+1,
        "sha256": file_sha(delta), "branchHead": head,
        "verifiedBaseSHA256": BASE_SHA, "verifiedDeltaManifest": True,
    }
    (outputs/f"{label}_Report_20261112_KO.md").write_bytes(report)
    (outputs/f"{label}_Receipt_20261112.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
