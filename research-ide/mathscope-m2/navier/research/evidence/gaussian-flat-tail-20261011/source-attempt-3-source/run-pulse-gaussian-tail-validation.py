#!/usr/bin/env python3
"""Run one bounded new-source validation and preserve exact logs/resources."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import signal
import subprocess
import sys
import time

navier = Path(__file__).resolve().parents[1]
repo = navier.parents[2]
evidence = navier / 'research/evidence/gaussian-flat-tail-20261011'
evidence.mkdir(parents=True, exist_ok=True)
case = sys.argv[1] if len(sys.argv) > 1 else 'kernel'
if case not in ('kernel', 'source'):
    raise SystemExit('Use kernel or source.')
attempt = sys.argv[2] if len(sys.argv) > 2 else '1'
if not attempt.isdigit():
    raise SystemExit('The attempt label must be a positive decimal integer.')
stem = ('source' if case == 'source' else 'power-kernel') + '-attempt-' + attempt
test_file = 'tests/actual-pulse-gaussian-tail-source.test.mjs' if case == 'source' else 'tests/actual-pulse-gaussian-power-kernel.test.mjs'
command = ['node', '--max-old-space-size=3072', '--test', '--test-reporter=tap', test_file]
new_modules = {
    navier / 'actual-pulse-gaussian-tail.mjs',
    navier / 'actual-gaussian-flat-tail-kernel.mjs',
    navier / 'actual-pulse-gaussian-power-kernel.mjs',
}

def dependency_hashes():
    pending = list(new_modules)
    seen = set()
    while pending:
        path = pending.pop().resolve()
        if path in seen:
            continue
        seen.add(path)
        for target in re.findall(r'(?:from\s*|import\s*)[\'\"](\.[^\'\"]+)[\'\"]', path.read_text()):
            dependency = (path.parent / target).resolve()
            if dependency.is_file():
                pending.append(dependency)
    return {str(path.relative_to(repo)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(seen)}

before = dependency_hashes()
snapshot = evidence / (stem + '-source')
snapshot.mkdir(exist_ok=False)
for path in [*new_modules, navier / test_file, Path(__file__).resolve()]:
    (snapshot / path.name).write_bytes(path.read_bytes())
environment = os.environ.copy()
if case == 'source':
    environment['M2_GAUSSIAN_TAIL_EVIDENCE'] = str(evidence / ('source-certificate-' + attempt + '.json'))
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
clock = time.monotonic()
timed_out = False
with (evidence / (stem + '.tap')).open('w') as output:
    process = subprocess.Popen(command, cwd=navier, env=environment, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
    try:
        code = process.wait(timeout=180 if case == 'source' else 30)
    except subprocess.TimeoutExpired:
        timed_out = True
        # Cancel this runner's own live child/session, never a discovered PID.
        os.killpg(process.pid, signal.SIGTERM)
        try:
            code = process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            code = process.wait()
after = dependency_hashes()
finished = datetime.datetime.now(datetime.timezone.utc).isoformat()
record = {
    'schema': 'MathScope.ActualPulseGaussianTailProcess/1',
    'case': case, 'attempt': int(attempt), 'command': command, 'cwd': str(navier),
    'startedAt': started, 'finishedAt': finished, 'elapsedSeconds': time.monotonic() - clock,
    'exitCode': code, 'timedOut': timed_out,
    'childProcessPeakRSSBytes': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
    'heapLimitMiB': 3072, 'timeoutSeconds': 180 if case == 'source' else 30,
    'dependencySHA256Before': before, 'dependencySHA256After': after,
    'allDependenciesUnchangedDuringExecution': before == after,
    'unchangedFrozenDependencyCount': sum((repo / key).resolve() not in new_modules for key in before),
    'testSHA256': hashlib.sha256((navier / test_file).read_bytes()).hexdigest(),
    'runnerSHA256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'tapSHA256': hashlib.sha256((evidence / (stem + '.tap')).read_bytes()).hexdigest(),
}
(evidence / (stem + '-process.json')).write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: value for key, value in record.items() if not key.startswith('dependencySHA')}, ensure_ascii=False))
raise SystemExit(0 if code == 0 and not timed_out else 1)
