#!/usr/bin/env python3
"""Observed exact (10.11)-(10.12) kernel gate; no source norm promotion."""
from pathlib import Path
from fractions import Fraction
from math import comb, factorial
import argparse
import datetime
import hashlib
import json
import os
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[4]
PREFIX = 'research-ide/mathscope-m3/navier/'
SOURCES = [PREFIX+'terminal-extension-kernel.mjs', PREFIX+'tests/terminal-extension-kernel.test.mjs',
           PREFIX+'tests/run-terminal-extension-kernel.py']


def digest(path):
    data = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')


def verify(data):
    checks = []

    def check(name, condition):
        checks.append({'id': name, 'pass': bool(condition)})

    # Expand a different, nonconstant cutoff polynomial directly. No
    # product-rule metadata or reported pass flag enters this derivative.
    polynomial = {0: 2, 1: 3, 2: 5, 4: 7}
    b = 7
    for rule in data['productRules']:
        j, m = rule['j'], rule['m']
        direct, expanded = {}, {}
        for d, coefficient in polynomial.items():
            if d+j >= m:
                power = d+j-m
                direct[power] = direct.get(power, Fraction()) + Fraction(
                    coefficient*b**d*factorial(d+j), factorial(j)*factorial(d+j-m))
        for term in rule['terms']:
            k = term['cutoffDerivative']
            for d, coefficient in polynomial.items():
                if d >= k:
                    power = d-k+term['sigmaPower']
                    expanded[power] = expanded.get(power, Fraction()) + Fraction(term['coefficient'])*Fraction(
                        coefficient*factorial(d)*b**(d-k+term['bPower']), factorial(d-k))
        check(f'independent-polynomial-derivative-j{j}-m{m}', direct == expanded)

    cutoff = data['cutoff']['rows']
    for label in ['schedule', 'hugeSchedule']:
        previous = 0
        for row in data[label]['rows']:
            j, b = row['j'], int(row['b'])
            norms = {r['a']: Fraction(r['bound']) for r in row['jetNorms']}
            required = [(a, m) for a in range(j//2+1) for m in range(j//2-a+1)] if j else []
            check(f'{label}-all-mixed-clauses-j{j}', {(c['a'], c['m']) for c in row['checks']} == set(required))
            predecessor_passes = True
            for clause in row['checks']:
                a, m = clause['a'], clause['m']
                Cjm = sum((Fraction(comb(m, k)*int(cutoff[k]['chi0DerivativeUpper']), factorial(j-m+k))
                           for k in range(max(0, m-j), m+1)), Fraction())
                value = Cjm*norms[a]/b**(j-m)
                check(f'{label}-exact-bound-j{j}-a{a}-m{m}', Cjm == Fraction(clause['Cjm']) and
                      value == Fraction(clause['actualBound']) and value <= Fraction(1, 2**j))
                if b > 1 and Cjm*norms[a]/(b-1)**(j-m) > Fraction(1, 2**j):
                    predecessor_passes = False
            check(f'{label}-minimal-integer-j{j}', b == 1 if j == 0 else b > previous and
                  (b == previous+1 or not predecessor_passes))
            previous = b
        check(label+'-norm-premises-not-original-source', data[label]['suppliedNormsAreExplicitPremises'] and
              not data[label]['sourceNormsAuthenticated'] and not data[label]['globalTerminalJetsAuthenticated'] and
              not data[label]['allOrderCompletion'])

    for k, tail in enumerate(data['tails']):
        N = tail['geometricTailStarts']
        check(f'exact-all-future-geometric-tail-{k}', Fraction(tail['geometricTailUpper']) == Fraction(2, 2**N) and
              N >= 2*(tail['spatialOrder']+tail['timeOrder']) and N >= 1 and
              tail['everyFutureSourceNormAndCutoffConstraintRequired'] and not tail['infiniteConvergenceEstablishedByFiniteData'])
    for identity in data['joining']:
        m = identity['timeOrder']
        check(f'exact-taylor-joining-{m}', all(Fraction(row['coefficient']) == int(row['j'] == m) for row in identity['rows']) and
              not identity['allOrderSourceCompatibilityConstructed'] and not identity['velocityExtendedPastOne'])
    check('global-force-and-original-criteria-not-invented', not data['sourceAuthenticated'] and not data['globalTerminalForceConstructed']
          and not data['originalN704Complete'] and not data['originalN705Complete'] and not data['wholeM3Complete'])
    return {'schema': 'MathScope.N7.IndependentTerminalExtensionChecks/1', 'arithmetic': 'Python exact Fraction and integer powers',
            'checkCount': len(checks), 'checks': checks, 'pass': all(x['pass'] for x in checks)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--attempt', type=int, default=1)
    args = parser.parse_args()
    if args.attempt < 1:
        raise ValueError('A positive new attempt number is required.')
    out = ROOT/PREFIX/'evidence/terminal-extension-kernel-20261012'/f'attempt{args.attempt}'
    out.mkdir(parents=True, exist_ok=False)
    before = [digest(ROOT/name) for name in SOURCES]
    write(out/'source-bytes-before.json', before)
    for name in SOURCES:
        target = out/'source-snapshot'/name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes((ROOT/name).read_bytes())
    env = os.environ.copy()
    env['MATHSCOPE_N7_EXTENSION_ARTIFACT'] = str(out/'terminal-extension-kernel.json')
    command = ['node', '--test', '--test-reporter=tap', '--test-concurrency=1', PREFIX+'tests/terminal-extension-kernel.test.mjs']
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tick = time.monotonic()
    completed = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True, timeout=60)
    elapsed = time.monotonic()-tick
    (out/'node.log').write_text(completed.stdout)
    (out/'node.stderr').write_text(completed.stderr)
    artifact = out/'terminal-extension-kernel.json'
    independent = verify(json.loads(artifact.read_text())) if artifact.exists() else {'pass': False, 'checkCount': 0, 'checks': []}
    write(out/'independent-fraction.json', independent)
    after = [digest(ROOT/name) for name in SOURCES]
    write(out/'source-bytes.json', {'before': before, 'after': after, 'unchanged': before == after})
    count = lambda key: int(re.search(r'^# '+key+r' (\d+)$', completed.stdout, re.MULTILINE)[1])
    receipt = {'schema': 'MathScope.N7.ObservedTerminalExtensionKernelGate/1', 'attempt': args.attempt,
               'startedAt': started, 'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'elapsedSeconds': elapsed, 'command': command, 'exitCode': completed.returncode, 'timeoutSeconds': 60,
               'nodeTests': {'passed': count('pass'), 'failed': count('fail'), 'skipped': count('skipped')},
               'sourceFilesUnchanged': before == after, 'sourceFileCount': len(SOURCES),
               'independentCheckCount': independent['checkCount'], 'independentPass': independent['pass'],
               'artifacts': [digest(p) for p in sorted(out.iterdir()) if p.is_file()],
               'sourceNormsAuthenticated': False, 'globalTerminalForceConstructed': False,
               'originalCriterionAssessmentEdited': False, 'wholeM3Complete': False,
               'pass': completed.returncode == 0 and before == after and independent['pass']}
    write(out/'receipt.json', receipt)
    print(json.dumps({'receipt': digest(out/'receipt.json'), 'nodeTests': receipt['nodeTests'],
                      'independentChecks': independent['checkCount'], 'pass': receipt['pass']}, indent=2))
    raise SystemExit(0 if receipt['pass'] else 1)


if __name__ == '__main__':
    main()
