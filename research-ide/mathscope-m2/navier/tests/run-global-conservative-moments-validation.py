#!/usr/bin/env python3
"""Bounded actual global conservative moment run, including source snapshots for each attempt."""
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

nav = Path(__file__).resolve().parents[1]
repo = nav.parents[2]
evidence = nav / 'research/evidence/global-conservative-moments-20261011'
evidence.mkdir(parents=True, exist_ok=True)
case = sys.argv[1] if len(sys.argv) > 1 else 'kernel'
attempt = sys.argv[2] if len(sys.argv) > 2 else '1'
if case not in ('source', 'kernel') or not attempt.isdigit():
    raise SystemExit('Use kernel/source and a positive decimal attempt number.')
stem = case + '-attempt-' + attempt
test_name = 'tests/actual-global-conservative-moments-' + ('kernel.test.mjs' if case == 'kernel' else 'source.test.mjs')
owned = [nav / name for name in ['actual-global-conservative-moments.mjs', 'actual-global-conservative-moments-kernel.mjs']]
command = ['node', '--max-old-space-size=3072', '--test', '--test-reporter=tap', test_name]
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()

def dependencies():
    pending = list(owned)
    seen = set()
    while pending:
        path = pending.pop().resolve()
        if path in seen:
            continue
        seen.add(path)
        for value in re.findall(r'(?:from\s*|import\s*)[\'\"](\.[^\'\"]+)[\'\"]', path.read_text()):
            target = (path.parent / value).resolve()
            if target.is_file():
                pending.append(target)
    return {str(p.relative_to(repo)): sha(p) for p in sorted(seen)}

snapshot = evidence / (stem + '-source')
snapshot.mkdir(exist_ok=True)
for p in [*owned, nav / test_name, Path(__file__)]:
    (snapshot / p.name).write_bytes(p.read_bytes())
before = dependencies()
env = os.environ.copy()
if case == 'source':
    env['M2_GLOBAL_CONSERVATIVE_EVIDENCE'] = str(evidence / (stem + '-certificate.json'))
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
clock = time.monotonic()
timed_out = False
with (evidence / (stem + '.tap')).open('w') as output:
    process = subprocess.Popen(command, cwd=nav, env=env, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
    try:
        code = process.wait(timeout=150 if case == 'source' else 30)
    except subprocess.TimeoutExpired:
        timed_out = True
        os.killpg(process.pid, signal.SIGTERM)
        try:
            code = process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            code = process.wait()
after = dependencies()
record = {'schema': 'MathScope.ActualGlobalConservativeMomentsProcess/1', 'case': case, 'attempt': int(attempt),
    'command': command, 'startedAt': started, 'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'elapsedSeconds': time.monotonic() - clock, 'exitCode': code, 'timedOut': timed_out,
    'childProcessPeakRSSBytes': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
    'heapLimitMiB': 3072, 'timeoutSeconds': 150 if case == 'source' else 30,
    'dependencySHA256Before': before, 'dependencySHA256After': after,
    'allDependenciesUnchangedDuringExecution': before == after,
    'unchangedFrozenDependencyCount': sum((repo / p).resolve() not in owned for p in before),
    'testSHA256': sha(nav / test_name), 'runnerSHA256': sha(Path(__file__)),
    'sourceSnapshotSHA256': {p.name: sha(p) for p in sorted(snapshot.iterdir())},
    'tapSHA256': sha(evidence / (stem + '.tap'))}
(evidence / (stem + '-process.json')).write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in record.items() if not k.startswith('dependencySHA')}, ensure_ascii=False))
raise SystemExit(0 if code == 0 and not timed_out else 1)
