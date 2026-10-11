"""Run one actual absolute-center source process without overwriting evidence."""
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import time

root = pathlib.Path(__file__).resolve().parents[4]
navier = root / 'research-ide/mathscope-m2/navier'
evidence = navier / 'research/evidence/adiabatic-pulse-center-20261011'
stem = sys.argv[1] if len(sys.argv) == 2 else 'actual-adiabatic-pulse-center-source-attempt1'
if len(sys.argv) > 2 or not re.fullmatch('[a-z0-9-]+', stem):
    raise SystemExit('Use one new lowercase attempt stem.')
evidence.mkdir(parents=True, exist_ok=True)
record = evidence / (stem + '-process.json')
if any((evidence / (stem + suffix)).exists() for suffix in ['-process.json', '.json', '.log']):
    raise SystemExit('A prior attempt exists; choose a new stem.')
command = ['node', '--expose-gc', '--max-old-space-size=3072',
           str(navier / 'tests/actual-adiabatic-pulse-center-source-check.mjs'), str(evidence), stem]
start = time.monotonic()
timed_out = False
try:
    process = subprocess.run(command, cwd=root, timeout=200, check=False)
    code = process.returncode
except subprocess.TimeoutExpired:
    code = 124
    timed_out = True
result = {'schema': 'MathScope.ObservedAdiabaticPulseCenterSourceProcess/1',
          'command': command, 'observedReturnCode': code, 'timedOut': timed_out,
          'externalTimeoutSeconds': 200, 'elapsedSeconds': time.monotonic() - start,
          'sourceConstructorLimitSeconds': 170, 'nodeHeapLimitMiB': 3072,
          'oneActualSourceProcess': True}
for kind, suffix in [('sourceReceipt', '.json'), ('sourceLog', '.log')]:
    file = evidence / (stem + suffix)
    if file.exists():
        result[kind] = {'path': str(file.relative_to(root)), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()}
with record.open('x') as out:
    json.dump(result, out, indent=2)
    out.write('\n')
print(json.dumps({'event': 'OBSERVED_PROCESS', **result}))
raise SystemExit(code)
