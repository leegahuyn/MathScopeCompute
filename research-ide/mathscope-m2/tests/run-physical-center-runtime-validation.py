"""Observe the fresh module and real Worker without relabeling source execution."""
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

root = Path(__file__).resolve().parents[3]
directory = root / 'research-ide/mathscope-m2/navier/research/evidence/physical-center-runtime-20261011'
if len(sys.argv) != 2 or not sys.argv[1].replace('-', '').isalnum():
    raise ValueError('Supply a fresh alphanumeric attempt stem.')
stem = sys.argv[1]
directory.mkdir(parents=True, exist_ok=True)
digest = lambda filename: hashlib.sha256(Path(filename).read_bytes()).hexdigest()
case = root / 'research-ide/mathscope-m2/tests/physical-center-runtime-case.mjs'
case_hash = digest(case)

for mode in ['module', 'worker']:
    log = directory / f'{stem}-{mode}-process.log'
    receipt = directory / f'{stem}-{mode}-process.json'
    result = directory / f'{stem}-{mode}-runtime.json'
    if any(p.exists() for p in [log, receipt, result]):
        raise RuntimeError('Earlier executions are immutable; use a new attempt stem.')
    command = ['node', '--max-old-space-size=768', str(case.relative_to(root)), mode, stem]
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tick = time.monotonic()
    timed_out = False
    with log.open('xb') as output:
        child = subprocess.Popen(command, cwd=root, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            child.wait(timeout=180)
        except subprocess.TimeoutExpired:
            timed_out = True
            os.killpg(child.pid, signal.SIGTERM)
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(child.pid, signal.SIGKILL)
                child.wait()
    data = json.loads(result.read_text()) if result.exists() else {}
    record = {
        'schema': 'MathScope.ObservedPhysicalCenterRuntime/1',
        'mode': mode,
        'startedAt': started,
        'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'elapsedSeconds': time.monotonic() - tick,
        'command': command,
        'observedExitCode': child.returncode,
        'timedOut': timed_out,
        'peakChildRSSBytesThroughThisMode': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
        'sourceCommitAtExecution': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
        'runnerSHA256': digest(__file__),
        'caseSHA256': case_hash,
        'caseUnchangedDuringRun': digest(case) == case_hash,
        'runtimeResult': {'path': str(result.relative_to(root)), 'exists': result.exists(), 'sha256': digest(result) if result.exists() else None},
        'log': {'path': str(log.relative_to(root)), 'sha256': digest(log)},
        'pass': child.returncode == 0 and data.get('pass') is True and not timed_out and digest(case) == case_hash,
        'originalSourceGraphReconstructedInThisRun': False,
        'wholeM2CompletionIssuedByThisObserver': False,
    }
    with receipt.open('x') as output:
        json.dump(record, output, ensure_ascii=False, indent=2)
        output.write('\n')
    print(json.dumps(record, ensure_ascii=False), flush=True)
    if not record['pass']:
        sys.exit(1)
