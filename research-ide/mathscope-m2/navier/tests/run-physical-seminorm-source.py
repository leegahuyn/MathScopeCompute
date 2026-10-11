"""Run the genuine physical seminorm source check with bounded memory.

The written certificate and TAP describe their actual finite scope. Historical
evidence is not overwritten; this continuation has its own evidence directory.
"""
from pathlib import Path
import hashlib
import json
import os
import re
import resource
import subprocess
import time
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[4]
TEST = Path(__file__).with_name('actual-background-physical-seminorms-source.test.mjs')
OUT = TEST.parent.parent / 'research' / 'evidence' / 'm2-continuation-20261011'
OUT.mkdir(parents=True, exist_ok=True)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def closure(entry):
    seen = set()
    def visit(path):
        path = path.resolve()
        if path in seen:
            return
        seen.add(path)
        for spec in re.findall(r'''(?:from|import)\s*["']([^"']+)["']''', path.read_text()):
            if spec.startswith('.'):
                visit(path.parent / spec)
    visit(entry)
    seen.add(Path(__file__).resolve())
    return {str(p.relative_to(ROOT)): digest(p) for p in sorted(seen)}


before = closure(TEST)
started = datetime.now(timezone.utc).isoformat()
clock = time.monotonic()
env = os.environ.copy()
env['M2_PHYSICAL_NORM_EVIDENCE'] = str(OUT / 'actual-background-physical-seminorms-source.json')
command = ['node', '--max-old-space-size=2048', '--test', '--test-reporter=tap', str(TEST)]
log = OUT / 'actual-background-physical-seminorms-source.tap'
timed_out = False
with log.open('w') as output:
    child = subprocess.Popen(command, cwd=ROOT, env=env, stdout=output, stderr=subprocess.STDOUT)
    try:
        code = child.wait(timeout=300)
    except subprocess.TimeoutExpired:
        timed_out = True
        child.kill()
        code = child.wait()
elapsed = time.monotonic() - clock
after = closure(TEST)
tap = log.read_text()
counts = {key: int(value) for key, value in re.findall(r'^# (tests|pass|fail|skipped|cancelled) (\d+)$', tap, re.M)}
record = {
    'schema': 'MathScope.ActualPhysicalSeminormValidation/1',
    'startedAt': started,
    'finishedAt': datetime.now(timezone.utc).isoformat(),
    'command': command,
    'nodeHeapLimitMiB': 2048,
    'timeoutSeconds': 300,
    'timedOut': timed_out,
    'exitCode': code,
    'elapsedSeconds': elapsed,
    'peakRSSBytes': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
    'counts': counts,
    'sourceFilesBefore': before,
    'sourceFilesAfter': after,
    'sourceClosureUnchangedDuringRun': before == after,
    'tapSHA256': digest(log),
    'pass': code == 0 and not timed_out and counts.get('fail') == 0 and counts.get('pass') == 8 and before == after,
    'scope': 'Two actual completed coefficient orders; physical derivatives through order two; finite exact FTC constants and a separate strengthened cutoff selector. No full residual, numerical derivative or M3 claim.'
}
certificate = OUT / 'actual-background-physical-seminorms-source.json'
if certificate.exists():
    record['sourceCertificateFileSHA256'] = digest(certificate)
(OUT / 'actual-background-physical-seminorms-validation.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({k: v for k, v in record.items() if k not in ('sourceFilesBefore', 'sourceFilesAfter', 'command')}, indent=2))
raise SystemExit(0 if record['pass'] else 1)
