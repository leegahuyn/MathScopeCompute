"""Observe one actual full-jet process, preserving every distinct attempt."""
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import sys
import time

root = pathlib.Path(__file__).resolve().parents[4]
navier = root / 'research-ide/mathscope-m2/navier'
evidence = navier / 'research/evidence/centered-full-jets-20261011'
stem = sys.argv[1] if len(sys.argv) == 2 else 'actual-centered-full-jet-source-attempt1'
if len(sys.argv) > 2 or not re.fullmatch('[a-z0-9-]+', stem):
    raise SystemExit('Use one new lowercase attempt stem.')
evidence.mkdir(parents=True, exist_ok=True)
record = evidence / (stem + '-process.json')
snapshot = evidence / (stem + '-implementation-snapshot')
if snapshot.exists() or any((evidence / (stem + suffix)).exists() for suffix in ['-process.json', '-preflight.json', '.json', '.log']):
    raise SystemExit('A previous attempt exists; choose a new stem.')
owned = ['actual-centered-fast-jet-enclosure-kernel.mjs', 'actual-centered-pulse-full-jet-enclosure.mjs',
         'tests/actual-centered-fast-jet-kernel.test.mjs', 'tests/actual-centered-full-jet-source-check.mjs',
         'tests/run-centered-full-jet-validation.py']
snapshot_rows = []
for name in owned:
    source = navier / name
    target = snapshot / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    snapshot_rows.append({'source': str(source.relative_to(root)), 'snapshot': str(target.relative_to(root)),
                          'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
command = ['node', '--expose-gc', '--max-old-space-size=4096',
           str(navier / 'tests/actual-centered-full-jet-source-check.mjs'), str(evidence), stem]
start = time.monotonic()
timed_out = False
try:
    process = subprocess.run(command, cwd=root, timeout=600, check=False)
    code = process.returncode
except subprocess.TimeoutExpired:
    code = 124
    timed_out = True
result = {'schema': 'MathScope.ObservedCenteredFullJetSourceProcess/1',
          'command': command, 'observedReturnCode': code, 'timedOut': timed_out,
          'externalTimeoutSeconds': 600, 'elapsedSeconds': time.monotonic() - start,
          'sourceConstructorLimitSeconds': 540, 'nodeHeapLimitMiB': 4096,
          'oneActualSourceProcess': True, 'newImplementationSnapshot': snapshot_rows}
for kind, suffix in [('sourceReceipt', '.json'), ('sourceLog', '.log'), ('preflight', '-preflight.json')]:
    file = evidence / (stem + suffix)
    if file.exists():
        result[kind] = {'path': str(file.relative_to(root)), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()}
with record.open('x') as out:
    json.dump(result, out, indent=2)
    out.write('\n')
print(json.dumps({'event': 'OBSERVED_PROCESS', **result}))
raise SystemExit(code)
