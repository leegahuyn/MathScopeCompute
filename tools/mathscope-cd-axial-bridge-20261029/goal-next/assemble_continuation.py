"""Archive the current branch and verify both evidence checkpoints."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--workspace", type=Path, default=Path.cwd())
args = parser.parse_args()
TASK = args.workspace.resolve()
REPO = TASK / "work/MathScopeCompute-CD"
OUT = TASK / "outputs"
PREVIOUS = OUT / "MathScope_Goal_Evidence_20261111.zip"
DEST = OUT / "MathScope_Goal_Continuation_20261111.zip"
PREFIX = "tools/mathscope-cd-axial-bridge-20261029"
CURRENT = PREFIX + "/goal-next"
AUDITOR = "research-ide/mathscope-m4/acceptance.mjs"
EXTRAS = [
    AUDITOR, ".github/workflows/mathscope-m4-generated-jobs.yml",
    ".github/workflows/mathscope-cd-axial-bridge-20261029.yml",
    "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ReferenceIngress.lean",
    "research-ide/mathscope-m4/research-boundaries.json",
    "research-ide/mathscope-m4/formal-claims.mjs",
    "research-ide/mathscope-m4/release-lab/catalog.json",
    *["research-ide/mathscope-m4/web/" + name for name in (
        "build-release-lab.py", "release-lab.html", "release-lab.js",
        "formal-claim-view.html", "formal-claim-view.js", "formal-claim-view.mjs",
    )],
]

def git(*args):
    return subprocess.check_output(["git", "-c", "core.longpaths=true", *args], cwd=REPO)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()

commit = git("rev-parse", "HEAD").decode().strip()
branch = git("branch", "--show-current").decode().strip()
assert branch == "mathscope-cd-axial-source-bridge-20261029"
remote = git("ls-remote", "origin", "refs/heads/" + branch).decode().split()
assert remote[0] == commit, "Branch head has not been pushed"
sha_manifest = {}
with zipfile.ZipFile(DEST, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=5) as target:
    def add(name, data):
        assert name not in sha_manifest, name
        sha_manifest[name] = {"sha256": digest(data), "bytes": len(data)}
        target.writestr(name, data)

    with zipfile.ZipFile(PREVIOUS) as previous:
        checks = json.loads(previous.read("SHA256.json"))
        assert set(previous.namelist()) == set(checks) | {"SHA256.json"}
        for path, entry in checks.items():
            data = previous.read(path)
            assert entry == {"sha256": digest(data), "bytes": len(data)}, path
            name = "history/20261111/" + path if path in ("REPORT_KO.md", "STATUS.json", AUDITOR) else path
            add(name, data)

    branch_entries = git("ls-tree", "-r", "--name-only", commit, CURRENT, PREFIX + "/m4-generated").decode().splitlines()
    candidate_paths = [name for name in branch_entries if "/m4/candidates/" in name]
    direct_artifacts = {
        item["path"] for path in candidate_paths
        for item in json.loads(git("show", commit + ":" + path))["artifacts"]
        if item["path"].startswith("research-ide/")
    }
    for path in sorted(set(branch_entries + EXTRAS) | direct_artifacts):
        data = git("show", commit + ":" + path)
        if path.startswith(CURRENT + "/"):
            assert (REPO / path).read_bytes() == data, path
        if path in sha_manifest:
            assert sha_manifest[path]["sha256"] == digest(data), path
        else:
            add(path, data)

    report = git("show", commit + ":" + CURRENT + "/REPORT_KO.md")
    status = git("show", commit + ":" + CURRENT + "/STATUS.json")
    add("REPORT_KO.md", report)
    add("STATUS.json", status)
    target.writestr("SHA256.json", encode(sha_manifest))

with zipfile.ZipFile(DEST) as archive:
    assert archive.testzip() is None
    assert set(archive.namelist()) == set(sha_manifest) | {"SHA256.json"}
    for name, entry in sha_manifest.items():
        data = archive.read(name)
        assert entry == {"sha256": digest(data), "bytes": len(data)}, name
    wanted = {name for name in sha_manifest if "/m4/candidates/" in name}
    assert wanted
    for candidate in wanted:
        for artifact in json.loads(archive.read(candidate))["artifacts"]:
            path = artifact["path"]
            wanted_artifact = sha_manifest[path]
            assert wanted_artifact["sha256"] == artifact["sha256"], path
    needed = wanted | {AUDITOR, "research-ide/mathscope-m4/criteria.mjs",
        "research-ide/mathscope-m0/proof.mjs", "research-ide/mathscope-m0/lean/shipped-proof-data.mjs",
        CURRENT + "/m4/verify_registration.mjs",
        "research-ide/mathscope-m4/research-boundaries.json"}
    for candidate in wanted:
        needed.update(row["path"] for row in json.loads(archive.read(candidate))["artifacts"])
    with tempfile.TemporaryDirectory(prefix="ms-readback-") as root:
        for name in needed:
            archive.extract(name, root)
        output = Path(root) / "verified-assessment.json"
        subprocess.run(["node", str(Path(root) / (CURRENT + "/m4/verify_registration.mjs")),
            root, str(output)], capture_output=True, check=True)
        assessment = json.loads(output.read_bytes())
        assert len(assessment["accepted"]) == json.loads(status)["M4"]["accepted"]
        assert assessment["publicationConfirmed"] is False
        assert assessment["canFreeze"] is False

(OUT / "MathScope_Goal_Continuation_Report_20261111_KO.md").write_bytes(report)
receipt = {"file": DEST.name, "files": len(sha_manifest) + 1, "bytes": DEST.stat().st_size,
    "sha256": digest(DEST.read_bytes()), "branch_head": commit,
    "verified_archive_manifest_and_assessment": True,
    "verified_M4": len(assessment["accepted"])}
(OUT / "MathScope_Goal_Continuation_Receipt_20261111.json").write_bytes(encode(receipt))
print(json.dumps(receipt))
