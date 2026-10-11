"""One actual Node constructor per process; never overwrite a past attempt."""
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import time

root = pathlib.Path(__file__).resolve().parents[4]
navier = root / 'research-ide/mathscope-m2/navier'
evidence = navier / 'research/evidence/centered-pulse-20261011'
stem = sys.argv[1] if len(sys.argv) == 2 else 'actual-centered-pulse-enclosure-source-attempt1'
if len(sys.argv) > 2 or not re.fullmatch('[a-z0-9-]+', stem):
    raise SystemExit('Use one new lowercase attempt stem.')
evidence.mkdir(parents=True, exist_ok=True)
record = evidence / (stem + '-process.json')
if record.exists() or (evidence / (stem + '.json')).exists() or (evidence / (stem + '.log')).exists():
    raise SystemExit('An earlier attempt exists; choose a new stem.')
command = ['node', '--expose-gc', '--max-old-space-size=3072',
           str(navier / 'tests/actual-centered-pulse-enclosure-source-check.mjs'), str(evidence), stem]
start = time.monotonic()
timeout = False
try:
    process = subprocess.run(command, cwd=root, timeout=180, check=False)
    code = process.returncode
except subprocess.TimeoutExpired:
    code = 124
    timeout = True
result = {
    'schema': 'MathScope.ObservedCenteredPulseSourceProcess/1',
    'command': command,
    'observedReturnCode': code,
    'timedOut': timeout,
    'externalTimeoutSeconds': 180,
    'elapsedSeconds': time.monotonic() - start,
    'sourceConstructorLimitSeconds': 150,
    'nodeHeapLimitMiB': 3072,
    'oneActualSourceProcess': True,
}
for kind, suffix in [('sourceReceipt', '.json'), ('sourceLog', '.log')]:
    file = evidence / (stem + suffix)
    if file.exists():
        result[kind] = {'path': str(file.relative_to(root)),
                        'sha256': hashlib.sha256(file.read_bytes()).hexdigest()}
with record.open('x') as out:
    json.dump(result, out, indent=2)
    out.write('\n')
print(json.dumps({'event': 'OBSERVED_PROCESS', **result}))
raise SystemExit(code)
