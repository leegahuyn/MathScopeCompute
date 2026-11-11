import argparse
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

parser = argparse.ArgumentParser()
for name in ("checkout", "baseline", "fixture_manifest", "out"):
    parser.add_argument(name, type=Path)
args = parser.parse_args()
sys.dont_write_bytecode = True
source = args.checkout / "research-ide/mathscope-m4"
spec = importlib.util.spec_from_file_location("builder", source / "web/build-release-lab.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
observed = gzip.decompress(args.baseline.read_bytes())
assert hashlib.sha256(observed).hexdigest() == "e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784"
catalog = json.loads((source / "release-lab/catalog.json").read_bytes())
verification = json.loads(args.fixture_manifest.read_bytes())
assert verification["pass"] is True
_, candidate, manifest = module.build(observed.decode(), catalog, verification, {})
(args.out / "candidate.html").write_bytes(candidate.encode())
(args.out / "browser-build.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(manifest["candidateSHA256"])
