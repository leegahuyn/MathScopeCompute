"""Materialize the read-only inputs for the R1-07 walkthroughs from one Git commit."""
from hashlib import sha256
import json
from pathlib import Path
import subprocess
import sys

repo, directory = map(Path, sys.argv[1:3])
pin = sys.argv[3]
repo, directory = repo.resolve(), directory.resolve()
m4 = 'research-ide/mathscope-m4/'
m0 = 'research-ide/mathscope-m0/'
core = m4 + 'evidence/core-kernel-20261014-attempt4'

def git(*args):
    return subprocess.check_output(['git', '-c', 'core.longpaths=true', '-C', str(repo), *args])

paths = [
    m0 + 'contracts.mjs', m0 + 'proof.mjs', m0 + 'lean/shipped-proof-data.mjs',
    m0 + 'lean/MathScope/M0/Defs.lean', m0 + 'lean/MathScope/M0/Finite.lean',
    m4 + 'acceptance.mjs', m4 + 'criteria.mjs', m4 + 'research-boundaries.json',
    m4 + 'formal-claims.mjs', m4 + 'proof-jobs.mjs', m4 + 'kernel-evidence.mjs',
    m4 + 'tools/pinned-kernel-contract.mjs',
    m4 + 'recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json',
    m4 + 'release-lab/catalog.json', m4 + 'release-lab/runtime.mjs',
    m4 + 'release-lab/evidence/run-2026-10-13T175955318Z/manifest.json',
    m4 + 'web/build-release-lab.py', m4 + 'web/release-lab.js',
    m4 + 'web/release-lab.css', m4 + 'web/release-lab.html',
    *[m4 + 'web/formal-claim-view.' + ext for ext in ('mjs', 'js', 'html')],
    'docs/evidence/m4-evidence-panel-v103-20261013/public-v103.html.gz',
]
for phase in ('mathscope-m1', 'mathscope-m2'):
    for file in ('workspace.mjs', 'workspace.bundle.js'):
        paths.append('research-ide/' + phase + '/' + file)
paths.extend(git('ls-tree', '-r', '--name-only', pin, core, m4 + 'lean/MathScope/M4').decode().splitlines())
files = {}
for path in sorted(set(paths)):
    raw = git('show', pin + ':' + path)
    output = directory / 'source' / path
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(raw)
    files[path] = sha256(raw).hexdigest()
(directory / 'source-pin.json').write_text(json.dumps({'commit':pin,'files':files},indent=2)+'\n',encoding='utf8')
print(f'Materialized {len(files)} exact files')
