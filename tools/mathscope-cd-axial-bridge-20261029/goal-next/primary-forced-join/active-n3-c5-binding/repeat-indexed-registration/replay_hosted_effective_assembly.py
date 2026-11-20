"""Reproduce the hosted raw/effective Forced mismatch in a disposable directory."""
import argparse
from hashlib import sha256
import json
import os
from pathlib import Path
import subprocess
import tempfile


ORIGINAL = {
    "source-global-forced-current.mjs": "03c3e125d93a5bd9e66d00c5f237b100c7b48b50",
    "source-harmonic-assembly.mjs": "cc8d24fdc2a7790d393aea86204b63c21a86f1b0",
}
CHECKOUT = "b41f298702238cf6170c16f31362e9429ebc659ca2a999d8d85cf2159ae01be3"
EFFECTIVE = "1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3"


def git_blob(repo, identity):
    return subprocess.check_output(["git","-c",f"safe.directory={repo.as_posix()}",
                                    "-C",str(repo),"cat-file","blob",identity])


def verify(repo, artifact, scratch):
    checkout = Path(__file__).resolve().parent
    loader = checkout.parent / "load_first_cycle_overlays.mjs"
    emitter = checkout / "emit_repeat_indexed_registration.mjs"
    archived = json.loads((artifact / "pr30-runtime-overlays.json").read_bytes())
    assert archived["schema"] == "MathScope.PR30OriginalVerifiedStorageOverlays/1"
    original_module = "research-ide/mathscope-m3/navier/source-global-forced-current.mjs"
    source_row, = [row for row in archived["files"] if row["original"] == original_module]
    assert source_row["gitBlobSHA"] == ORIGINAL["source-global-forced-current.mjs"]
    assert source_row["sha256"] == EFFECTIVE
    assert source_row["overlay"] == f"pr30-runtime-overlays/{EFFECTIVE}.mjs"

    with tempfile.TemporaryDirectory(prefix="repeat-effective-preflight-",dir=scratch) as folder:
        root = Path(folder)
        navier = root / "research-ide" / "mathscope-m3" / "navier"
        navier.mkdir(parents=True)
        for row in archived["files"]:
            original = root / row["original"]
            original.parent.mkdir(parents=True,exist_ok=True)
            original.write_bytes(git_blob(repo,row["gitBlobSHA"]))
            overlay = root / row["overlay"]
            overlay.parent.mkdir(parents=True,exist_ok=True)
            content = (artifact / row["overlay"]).read_bytes()
            assert sha256(content).hexdigest() == row["sha256"]
            overlay.write_bytes(content)
        for name, blob in ORIGINAL.items():
            (navier / name).write_bytes(git_blob(repo,blob))
        manifest = root / "pr30-runtime-overlays.json"
        manifest.write_bytes((artifact / "pr30-runtime-overlays.json").read_bytes())
        env = os.environ.copy()
        env["MATHSCOPE_FIRST_CYCLE_OVERLAY_MANIFEST"] = str(manifest)
        env["MATHSCOPE_FULL_REPEAT_REPLAY"] = "1"
        res = subprocess.run(["node","--import",loader.as_uri(),"--input-type=module","-e","void 0"],
                             cwd=root,env=env,capture_output=True,text=True)
        assert res.returncode == 0, res.stderr
        receipt, = [json.loads(line) for line in res.stdout.splitlines() if line.startswith("{")]
        assert receipt["status"] == "PASS_PINNED_REPEAT_EFFECTIVE_ASSEMBLY"
        assert receipt["originalForcedCheckoutSHA256"] == CHECKOUT
        assert receipt["originalForcedModuleSHA256"] == EFFECTIVE
        assert receipt["approvedOverlayManifestSHA256"] == sha256(manifest.read_bytes()).hexdigest()
        original_raw = (root / original_module).read_bytes()
        effective_raw = (root / source_row["overlay"]).read_bytes()

        def helper(content):
            start = content.index(b"function completeSourceField(")
            stop = content.index(b"\nfunction ", start+1)
            return content[start:stop]

        assert helper(original_raw) == helper(effective_raw)
        probe = (f"import {{readRepeatAssemblyInputs}} from {json.dumps(emitter.as_uri())}; "
                 "await readRepeatAssemblyInputs(process.argv[1],process.argv[2]);")
        controls = {}
        for name, path, fragment in (
            ("changedCheckout",root/original_module,"Unexpected Forced checkout bytes"),
            ("changedEffectiveOverlay",root/source_row["overlay"],"Unexpected effective Forced assembly bytes"),
        ):
            clean = path.read_bytes()
            path.write_bytes(clean + b"\n")
            check = subprocess.run(["node","--input-type=module","-e",probe,str(navier),str(manifest)],
                                   cwd=root,env=env,capture_output=True,text=True)
            assert check.returncode and fragment in check.stderr, name
            path.write_bytes(clean)
            controls[name] = True
        receipt.update(failClosedControls=controls, unchangedAssemblyHelperSHA256=sha256(helper(original_raw)).hexdigest(),
                       scope="Early loader checks only; live indexed registration is a separate run.")
        return receipt


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ("repo","artifact","scratch","output"):
        parser.add_argument(name,type=Path)
    options=parser.parse_args()
    outcome=verify(options.repo,options.artifact,options.scratch)
    options.output.write_text(json.dumps(outcome,indent=2,sort_keys=True)+"\n",encoding="utf-8",newline="\n")
