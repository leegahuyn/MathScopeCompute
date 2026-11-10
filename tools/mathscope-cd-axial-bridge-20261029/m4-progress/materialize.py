"""Extract the exact original build inputs, leaving all existing checkouts untouched."""
from pathlib import Path
import subprocess, hashlib, json, os

ROOT = Path(__file__).resolve().parent
TREE = ROOT / 'source'
REPO = Path(os.environ.get('MATHSCOPE_SOURCE_REPO', r'C:/Users/사용자/Documents/Codex/2026-10-15/task/MathScopeCompute'))
REV = '9595b4de5a1065b694d225c0ad2a14d5aa4435a9'
paths = [
 'research-ide/mathscope-m4/web/build-release-lab.py',
 'research-ide/mathscope-m4/web/release-lab.html',
 'research-ide/mathscope-m4/web/release-lab.css',
 'research-ide/mathscope-m4/web/release-lab.js',
 'research-ide/mathscope-m4/release-lab/runtime.mjs',
 'research-ide/mathscope-m4/release-lab/catalog.json',
 'research-ide/mathscope-m4/proof-jobs.mjs',
 'research-ide/mathscope-m0/proof.mjs',
 'research-ide/mathscope-m0/lean/shipped-proof-data.mjs',
 'research-ide/mathscope-m1/workspace.mjs',
 'research-ide/mathscope-m1/workspace.bundle.js',
 'research-ide/mathscope-m2/workspace.mjs',
 'research-ide/mathscope-m2/workspace.bundle.js',
]
manifest={}
for path in paths:
    data=subprocess.check_output(['git','show',f'{REV}:{path}'],cwd=REPO)
    dest=TREE/path; dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
    manifest[path]=hashlib.sha256(data).hexdigest()
(ROOT/'original-hashes.json').write_text(json.dumps({'commit':REV,'files':manifest},indent=2),encoding='utf-8')
print(f'{len(paths)} original files extracted, original checkout untouched')
