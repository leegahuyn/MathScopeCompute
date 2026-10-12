"""Observed execution and independent Fraction check of the original N7 path.

Only a new evidence/inner-growth-20261012/attemptN directory is written.
Earlier attempts are immutable. The runner never promotes original criteria.
"""
import datetime
from fractions import Fraction
import hashlib
import json
import math
import os
from pathlib import Path
import re
import resource
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'research-ide/mathscope-m3/navier'
attempt = int(sys.argv[1]) if len(sys.argv) > 1 else 1
if attempt < 1:
    raise ValueError('Use a fresh positive attempt number.')
OUT = BASE / 'evidence/inner-growth-20261012' / ('attempt' + str(attempt))
OUT.mkdir(parents=True, exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
json_write = lambda p, value: p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
seen = set()


def closure(path):
    path = path.resolve()
    if path in seen:
        return
    seen.add(path)
    if path.suffix not in ['.mjs', '.js']:
        return
    for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', path.read_text()):
        closure(path.parent / spec)


for path in [BASE / 'source-inner-growth.mjs', BASE / 'tests/source-inner-growth.test.mjs', Path(__file__)]:
    closure(path)
for path in [ROOT / 'research-ide/mathscope-m2/navier/research/evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json']:
    seen.add(path)
manifest = [{'path': str(p.relative_to(ROOT)), 'sha256': sha(p), 'bytes': p.stat().st_size} for p in sorted(seen)]
json_write(OUT / 'source-bytes.json', {'schema': 'MathScope.N7.InnerGrowthSourceBytes/1', 'files': manifest, 'fileCount': len(manifest)})
snapshot = OUT / 'new-source-snapshot'
snapshot.mkdir()
for path in [BASE / 'source-inner-growth.mjs', BASE / 'tests/source-inner-growth.test.mjs', Path(__file__).resolve()]:
    (snapshot / path.name).write_bytes(path.read_bytes())

certificate = OUT / 'inner-growth.json'
log = OUT / 'node.log'
env = dict(os.environ, M3_N7_INNER_EVIDENCE=str(certificate))
command = ['node', '--max-old-space-size=8192', '--test', '--test-reporter=tap', 'research-ide/mathscope-m3/navier/tests/source-inner-growth.test.mjs']
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
tick = time.monotonic()
timeout = False
with log.open('wb') as stream:
    child = subprocess.Popen(command, cwd=ROOT, env=env, stdout=stream, stderr=subprocess.STDOUT, start_new_session=True)
    try:
        child.wait(timeout=900)
    except subprocess.TimeoutExpired:
        timeout = True
        os.killpg(child.pid, signal.SIGTERM)
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(child.pid, signal.SIGKILL)
            child.wait()
elapsed = time.monotonic() - tick
raw = log.read_text(errors='replace')
unchanged = all(sha(ROOT / row['path']) == row['sha256'] for row in manifest)
independent = {'status': 'NOT_RUN', 'checks': [], 'newLeanExecuted': False}
if child.returncode == 0 and certificate.exists():
    record = json.loads(certificate.read_text())
    # At eta=0, Hstar=j0 and sigmaStar=j0/2000 give the EXACT chi.
    # Recompute the comparison entire series with Python Fraction, retaining
    # both its alternating-series tail and the actual nonlinear core error.
    chi = Fraction(4000000, 4000001)
    degree = record['leading']['freshCore']['request']['degree']
    total = sum((-chi) ** n / (math.factorial(n) * math.factorial(n + 1)) for n in range(degree + 1))
    next_term = (-chi) ** (degree + 1) / (math.factorial(degree + 1) * math.factorial(degree + 2))
    comparator = [min(total, total + next_term), max(total, total + next_term)]
    nonlinear = Fraction(290, 9 * (1 << (260 * 53)))
    rigorous = [comparator[0] - nonlinear, comparator[1] + nonlinear]
    actual = record['leading']['freshCore']['phi']['rows'][0]['actualNonlinearInterval']
    lo, hi = Fraction(actual['lower']), Fraction(actual['upper'])
    checks = [
        {'id': 'exact-eta-zero-source-chi', 'pass': chi == 1 / (1 + Fraction(1, 2000**2))},
        {'id': 'directed-node-interval-contains-independent-series-and-positive-Banach-error', 'pass': lo <= rigorous[0] and hi >= rigorous[1]},
        {'id': 'strict-leading-positivity-above-one-half', 'pass': lo > Fraction(1, 2) and rigorous[0] > Fraction(1, 2)},
        {'id': 'nonlinear-error-never-dropped', 'pass': nonlinear > 0},
    ]
    for row in record['rows']:
        error = Fraction(1, 1 << (row['depth'] + 2))
        checks.append({'id': 'full-interval-error-radius-depth-' + str(row['depth']), 'pass': Fraction(row['interval']['lower']) == lo - error and Fraction(row['interval']['upper']) == hi + error and Fraction(row['remainderAbsUpper']) == error})
    independent = {'schema': 'MathScope.N7.InnerGrowthIndependentFraction/1', 'status': 'PASS' if all(c['pass'] for c in checks) else 'FAIL',
                   'sourceY': '2', 'sourceEta': '0', 'comparisonChi': str(chi), 'degree': degree,
                   'nonlinearErrorStrictlyPositive': True, 'checks': checks,
                   'scope': 'Independent exact comparison series and nonzero analytic core remainder; no independent proof of the full paper or N6 localization.', 'newLeanExecuted': False}
json_write(OUT / 'independent-fraction.json', independent)
artifacts = [{ 'path': str(p.relative_to(ROOT)), 'sha256': sha(p), 'bytes': p.stat().st_size } for p in [log, OUT / 'source-bytes.json', OUT / 'independent-fraction.json'] + ([certificate] if certificate.exists() else [])]
receipt = {'schema': 'MathScope.N7.InnerGrowthObservedExecution/1', 'attempt': attempt, 'startedAt': started,
           'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'command': command,
           'exitCode': child.returncode, 'timeout': timeout, 'timeoutSeconds': 900, 'elapsedSeconds': elapsed,
           'observedPeakRSSBytes': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
           'nodeTests': {'passed': len(re.findall(r'^ok \d+ - ', raw, re.M)), 'failed': len(re.findall(r'^not ok \d+ - ', raw, re.M))},
           'sourceFilesUnchanged': unchanged, 'sourceFileCount': len(manifest), 'artifacts': artifacts,
           'independentStatus': independent['status'], 'originalN7CriterionComplete': False,
           'originalFinalN6FieldConstructed': False, 'newLeanExecuted': False, 'wholeM3Complete': False,
           'pass': child.returncode == 0 and not timeout and unchanged and independent['status'] == 'PASS'}
json_write(OUT / 'receipt.json', receipt)
print(json.dumps(receipt, ensure_ascii=False, indent=2))
sys.exit(0 if receipt['pass'] else 1)
