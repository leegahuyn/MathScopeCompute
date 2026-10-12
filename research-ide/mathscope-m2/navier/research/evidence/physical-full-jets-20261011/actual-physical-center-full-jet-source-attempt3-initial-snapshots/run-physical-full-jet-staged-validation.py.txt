"""Observe the single private-source process and preserve every attempt.

The child initially freezes its original construction imports. Its numerical
attachment has a separate late import manifest, as documented in the child
receipt. This observer never supplies mathematical premises to the child.
"""
import datetime
import hashlib
import json
import os
from pathlib import Path
import resource
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'research-ide/mathscope-m2/navier'
EVIDENCE = BASE / 'research/evidence/physical-full-jets-20261011'
attempt = int(sys.argv[1])
assert attempt > 0 and len(sys.argv) == 2
EVIDENCE.mkdir(parents=True, exist_ok=True)
stem = 'actual-physical-center-full-jet-source-attempt' + str(attempt)
log_path = EVIDENCE / (stem + '-stdout.log')
source_path = EVIDENCE / (stem + '.json')
receipt_path = EVIDENCE / (stem + '-process.json')
assert not any(p.exists() for p in [log_path, source_path, receipt_path, EVIDENCE / (stem + '.log')])
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
snapshot = EVIDENCE / (stem + '-initial-snapshots')
snapshot.mkdir()
files = ['actual-program-array-snapshot.mjs', 'actual-physical-center-jet-bodies.mjs', 'actual-physical-center-full-curl-jet-kernel.mjs',
         'actual-physical-center-slow-slope-enclosure.mjs', 'actual-physical-center-slow-slope-kernel.mjs',
         'actual-physical-center-target-enclosure.mjs', 'actual-terminal-target-coefficient-kernel.mjs',
         'actual-common-selection-arithmetic-trace.mjs', 'tests/actual-physical-center-full-jet-staged-source-check.mjs',
         'tests/run-physical-full-jet-staged-validation.py']
snapshots = []
for name in files:
    original = BASE / name
    target = snapshot / (original.name + '.txt')
    target.write_bytes(original.read_bytes())
    snapshots.append({'source': str(original.relative_to(ROOT)), 'path': str(target.relative_to(ROOT)), 'sha256': sha(target)})
command = ['node', '--expose-gc', '--max-old-space-size=4608',
           str((BASE / 'tests/actual-physical-center-full-jet-staged-source-check.mjs').relative_to(ROOT)), str(EVIDENCE), stem]
started_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
tick = time.monotonic()
timed_out = False
with log_path.open('wb') as stream:
    child = subprocess.Popen(command, cwd=ROOT, stdout=stream, stderr=subprocess.STDOUT, start_new_session=True)
    try:
        child.wait(timeout=2460)
    except subprocess.TimeoutExpired:
        timed_out = True
        os.killpg(child.pid, signal.SIGTERM)
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(child.pid, signal.SIGKILL)
            child.wait()
elapsed = time.monotonic() - tick
result = json.loads(source_path.read_text()) if source_path.exists() else None
record = {'schema': 'MathScope.ObservedPhysicalFullJetStagedProcess/1', 'attempt': attempt,
          'startedAt': started_at, 'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'command': command, 'runnerSHA256AtExecution': sha(__file__), 'snapshots': snapshots,
          'exitCode': child.returncode, 'timeout': timed_out, 'timeoutSeconds': 2460,
          'elapsedSeconds': elapsed, 'peakRSSBytes': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
          'log': {'path': str(log_path.relative_to(ROOT)), 'sha256': sha(log_path)},
          'source': {'path': str(source_path.relative_to(ROOT)), 'exists': source_path.exists(), 'sha256': sha(source_path) if source_path.exists() else None},
          'checks': {'passed': len(result.get('checks', [])) if result else 0, 'failed': 0 if result and result.get('pass') else 1},
          'complete': bool(result and result.get('complete')), 'designedNegativeControl': False,
          'pass': child.returncode == 0 and bool(result and result.get('pass') and result.get('complete'))}
with receipt_path.open('x') as stream:
    stream.write(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in record.items() if k != 'snapshots'}, ensure_ascii=False, indent=2))
sys.exit(0 if record['pass'] else 1)
