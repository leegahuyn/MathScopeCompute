#!/usr/bin/env python3
"""Exact differentiated constraints, minimal integers, and complete force sums."""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal, localcontext
from math import comb, factorial
import argparse
import copy
import datetime
import hashlib
import importlib.util
import json
import os
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[5]
PREFIX = 'research-ide/mathscope-m3/navier/terminal-extension/'
FORMAL_SOURCE = ROOT/'research-ide/mathscope-m3/navier/final-summation/tests/run-source-fixed-stage-scalar.py'
spec = importlib.util.spec_from_file_location('fixed_stage_formal', FORMAL_SOURCE)
formal_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(formal_module)
formal = formal_module.formal


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')


def digest(path):
    raw = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


def source_files():
    seen = {Path(__file__).resolve(), FORMAL_SOURCE}

    def visit(path):
        path = path.resolve()
        if path in seen:
            return
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise ValueError('A source import leaves the captured repository.')
        seen.add(path)
        if path.suffix in ('.mjs', '.js'):
            for name in re.findall(r'''(?:from\s*|import\s*)["'](\.[^"']+)["']''', path.read_text()):
                visit(path.parent/name)
    visit(ROOT/PREFIX/'tests/source-terminal-cutoff-schedule.test.mjs')
    return sorted(seen)


def cutoff_bounds(order):
    """Differentiate v=1/u polynomials and bound v^k exp(-v) by k!."""
    polynomial, phi = {0: 1}, []
    for n in range(order+1):
        phi.append(sum(abs(v)*factorial(k) for k, v in polynomial.items()))
        after = {}
        for k, value in polynomial.items():
            after[k+2] = after.get(k+2, 0)+value
            if k:
                after[k+1] = after.get(k+1, 0)-k*value
        polynomial = {k: v for k, v in after.items() if v}
    inverse, chi = [9], [1]
    for n in range(1, order+1):
        inverse.append(9*sum(comb(n, k)*2*phi[k]*inverse[n-k] for k in range(1, n+1)))
        chi.append(2**n*sum(comb(n, k)*phi[k]*inverse[n-k] for k in range(n+1)))
    return [sum(comb(n, k)*chi[k]*chi[n-k] for k in range(n+1)) for n in range(order+1)]


def least_integer_root(value, exponent):
    if value <= 0 or exponent < 1:
        raise ValueError('Only positive roots enter the integer cutoff.')
    lo, hi = 1, 1
    while hi**exponent*value.denominator < value.numerator:
        hi *= 2
    while lo < hi:
        mid = (lo+hi)//2
        if mid**exponent*value.denominator >= value.numerator:
            hi = mid
        else:
            lo = mid+1
    return lo


def evaluate(nodes, index, values):
    """80-digit diagnostic for fixtures only; exact integer scales supplied."""
    memo = dict(values)

    def run(i):
        if i in memo:
            return memo[i]
        op, args = nodes[i]['op'], nodes[i]['args']
        if op == 'rational':
            v = Decimal(args[0])/Decimal(args[1])
        elif op == 'add':
            v = sum((run(j) for j in args), Decimal(0))
        elif op == 'multiply':
            v = Decimal(1)
            for j in args:
                v *= run(j)
        elif op == 'inverse':
            v = 1/run(args[0])
        elif op == 'integer_power':
            v = run(args[0])**args[1]
        elif op == 'exp':
            v = run(args[0]).exp()
        elif op == 'log_positive':
            v = run(args[0]).ln()
        elif op == 'smooth_piecewise':
            x, left, right = [run(j) for j in args[:3]]
            v = run(args[3] if x <= left else args[5] if x >= right else args[4])
        else:
            raise ValueError('A source parameter or unevaluated scale reached the fixture interpreter: '+op)
        memo[i] = v
        return v
    return run(index)


def independent(data, negative_controls=True, deadline=None):
    checks = []

    def check(name, value):
        checks.append({'id': name, 'pass': bool(value)})

    def q(nodes, root):
        p = formal(nodes, root)
        return p.get((), F())

    for ci, case in enumerate(data['cases']):
        if deadline is not None and time.monotonic() > deadline:
            raise TimeoutError('The complete Node and independent gate exceeded 60 seconds.')
        schedule, window, extension = case['schedule'], case['window'], case['extension']
        nodes, J = case['program']['nodes'], case['J']
        checkcase = lambda name, value: check(f'case{ci}-{name}', value)
        symbolic = case['sourceValued']
        bounds = cutoff_bounds(J//2)
        integer_scales = []
        for row in schedule['rows']:
            j, b_root = row['j'], row['bRoot']
            norm_inputs = {r['a']: r['boundRoot'] for r in case['normInputs'][j]['norms']}
            required = {(a, m) for a in range(j//2+1) for m in range(j//2-a+1)} if j else set()
            checkcase(f'all-mixed-pairs-{j}', {(c['a'], c['m']) for c in row['clauses']} == required
                      and len(row['clauses']) == len(required))
            checkcase(f'all-separate-norms-{j}', {r['a'] for r in row['norms']} == set(range(j//2+1)))
            if not j:
                checkcase('original-b0-one', q(nodes, b_root) == 1)
                integer_scales.append(1)
            else:
                strict_value_correct = q(nodes, row['strictLowerRoot']) == 2 if j == 1 else formal(
                    nodes, row['strictLowerRoot'], (row['previousRoot'],)) == {(0,): F(1), (1,): F(1)}
                checkcase(f'previous-integer-scale-{j}', row['previousRoot'] == schedule['rows'][j-1]['bRoot'] and strict_value_correct)
                checkcase(f'exact-minimum-ceiling-{j}', nodes[b_root] == {'op': 'ceiling', 'args': [row['maximumRoot']]}
                          and nodes[row['maximumRoot']] == {'op': 'maximum', 'args': [row['strictLowerRoot']]+[c['positiveRoot'] for c in row['clauses']]})
            needed_integers = []
            for clause in row['clauses']:
                a, m, power = clause['a'], clause['m'], clause['power']
                label = f'{j}-{a}-{m}'
                Cjm = sum((F(comb(m, k)*bounds[k], factorial(j-m+k)) for k in range(max(0, m-j), m+1)), F())
                N = norm_inputs[a]
                checkcase('retained-norm-'+label, clause['sourceNormRoot'] == N)
                checkcase('full-leibniz-constant-'+label, F(clause['constant']['value']) == Cjm)
                checkcase('negative-support-power-'+label, power == j-m and power > 0)
                if symbolic:
                    expected = {(0,): F(1), (2,): F(1)}
                    checkcase('positive-majorant-'+label, formal(nodes, clause['positiveMajorantRoot'], (N,)) == expected)
                    checkcase('complete-threshold-'+label, formal(nodes, clause['thresholdRoot'], (N,)) == {k: v*2**j*Cjm for k, v in expected.items()})
                else:
                    upper = 1+q(nodes, N)**2
                    threshold = 2**j*Cjm*upper
                    checkcase('positive-majorant-'+label, q(nodes, clause['positiveMajorantRoot']) == upper)
                    checkcase('complete-coefficient-'+label, q(nodes, clause['coefficientRoot']) == Cjm*upper)
                    checkcase('complete-threshold-'+label, q(nodes, clause['thresholdRoot']) == threshold)
                    needed_integers.append(least_integer_root(threshold, power))
                positive = nodes[clause['positiveRoot']]
                logarithms = [i for i, n in enumerate(nodes) if n == {'op': 'log_positive', 'args': [clause['thresholdRoot']]}]
                checkcase('positive-real-root-'+label, positive['op'] == 'exp' and len(logarithms) == 1
                          and formal(nodes, positive['args'][0], (logarithms[0],)) == {(1,): F(1, power)})
                checkcase('original-dyadic-target-'+label, F(clause['requiredUpper']) == F(1, 2**j))
            if j and not symbolic:
                bj = max(integer_scales[-1]+1, *needed_integers)
                predecessor_valid = bj-1 > integer_scales[-1]
                for clause in row['clauses']:
                    coefficient = q(nodes, clause['coefficientRoot'])
                    checkcase(f'full-differentiated-bound-{j}-{clause["a"]}-{clause["m"]}', coefficient/F(bj**clause['power']) <= F(1, 2**j))
                    predecessor_valid &= coefficient/F((bj-1)**clause['power']) <= F(1, 2**j)
                checkcase(f'least-integer-not-numeric-log-{j}', not predecessor_valid)
                integer_scales.append(bj)
        wr = window['roots']
        bJ, bprev = schedule['rows'][J]['bRoot'], schedule['rows'][J-1]['bRoot']
        atoms = (bJ,) if J == 1 else (bJ, bprev)
        inverse_last = (-1,) if J == 1 else (-1, 0)
        inverse_previous = (0,) if J == 1 else (0, -1)
        checkcase('positive-window-lower', formal(nodes, wr['lower'], atoms) == {inverse_last: F(1)})
        checkcase('positive-window-upper', formal(nodes, wr['upper'], atoms) == {inverse_last: F(1, 2), inverse_previous: F(1, 2)})
        checkcase('full-positive-window-width', formal(nodes, wr['width'], atoms) == {inverse_last: F(-1, 2), inverse_previous: F(1, 2)})
        checkcase('complete-positive-window-active-set', window['possibleActiveOrders'] == list(range(J)) and window['inactiveOrdersStart'] == J
                  and [r['j'] for r in extension['rows']] == list(range(J)))
        coordinates = extension['coordinates']
        cutoff_atoms = tuple(r['cutoffRoot'] for r in extension['rows'])
        all_atoms = cutoff_atoms+tuple(coordinates)
        dim = len(all_atoms)
        expected_vectors = [{} for _ in range(3)]
        for row in extension['rows']:
            j = row['j']
            checkcase('retained-full-force-'+str(j), row['forceRoots'] == case['forceInputs']['jets'][j]['forceRoots'])
            checkcase('exact-factorial-'+str(j), int(row['factorial']) == factorial(j))
            for component, pairs in enumerate([[(j+1, {0: 1}), (1, {1: 2})], [(j+2, {1: 1}), (1, {0: 1, 2: 1})], [(j+3, {2: 1}), (1, {0: 2})]]):
                for coefficient, powers in pairs:
                    exponents = [0]*dim
                    exponents[j] = 1
                    exponents[J+3] = j
                    for k, power in powers.items():
                        exponents[J+k] = power
                    key = tuple(exponents)
                    expected_vectors[component][key] = expected_vectors[component].get(key, F())+F(coefficient, factorial(j))
        for k in range(3):
            checkcase('independent-complete-force-polynomial-'+str(k), formal(nodes, extension['forceRoots'][k], all_atoms) == expected_vectors[k])
        if not symbolic:
            with localcontext() as context:
                context.prec = 80
                scale_values = {r['bRoot']: Decimal(integer_scales[r['j']]) for r in schedule['rows']}
                low, high = F(1, integer_scales[J]), (F(1, integer_scales[J])+F(1, integer_scales[J-1]))/2
                checkcase('independently-resolved-positive-window', 0 < low < high < F(1, integer_scales[J-1]) <= 1)
                for si, sigma in enumerate([low, (low+high)/2, high, F(1)]):
                    value = Decimal(sigma.numerator)/Decimal(sigma.denominator)
                    env = {**scale_values, **dict(zip(coordinates, [Decimal(2), Decimal(3), Decimal(5), value]))}
                    expected = [Decimal(0)]*3
                    for j in range(J):
                        argument = Decimal(integer_scales[j])*value
                        if argument <= Decimal('0.5'):
                            cutoff = Decimal(1)
                        elif argument >= 1:
                            cutoff = Decimal(0)
                        else:
                            u = 2*argument-1
                            # Independent logistic form of right/(left+right).
                            cutoff = 1/(1+(1/(1-u)-1/u).exp())
                        force = [2*(j+1)+9, 3*(j+2)+10, 5*(j+3)+4]
                        for k in range(3):
                            expected[k] += cutoff*value**j*Decimal(force[k])/Decimal(factorial(j))
                    for k in range(3):
                        actual = evaluate(nodes, extension['forceRoots'][k], env)
                        checkcase(f'full-piecewise-fixture-evaluation-{si}-{k}', abs(actual-expected[k]) <= Decimal('1e-65')*(1+abs(expected[k])))
                    checkcase('all-omitted-modes-exactly-zero-'+str(si), integer_scales[J]*sigma >= 1)
        parameters = case['program']['parametersExactExpressions']
        checkcase('same-original-positive-h', parameters['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}}
                  and parameters['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]}
                  and parameters['Md'] == {'integer': 1048576})
        checkcase('source-provenance-and-all-orders-not-invented', schedule['suppliedNormsAreExplicitPremises'] and not schedule['sourceNormsAuthenticated']
                  and not schedule['globalTerminalJetsAuthenticated'] and not schedule['allOrderCompletion']
                  and not extension['originalLocalizedForceJetsAuthenticated'] and not extension['allOrderJoiningEstablished']
                  and not extension['velocityExtendedPastOne'] and not extension['originalN704Complete'] and not extension['originalN705Complete'])
    check('all-exercised-values-declared-fixtures', data['sourceNormsAndForceJetsAreFixtures'] and not data['globalOriginalTerminalJetsComputed']
          and not data['originalN704Complete'] and not data['originalN705Complete'] and not data['wholeM3Complete'])
    if negative_controls:
        controls = [
            ('omitted-mixed-constraint', lambda d: d['cases'][1]['schedule']['rows'][4]['clauses'].pop()),
            ('changed-support-power', lambda d: d['cases'][1]['schedule']['rows'][3]['clauses'][0].update(power=4)),
            ('missing-active-order', lambda d: d['cases'][1]['window']['possibleActiveOrders'].pop()),
            ('missing-force-component', lambda d: d['cases'][1]['extension']['forceRoots'].__setitem__(0, 0)),
            ('changed-original-h', lambda d: d['cases'][1]['program']['parametersExactExpressions'].__setitem__('h', {'integer': 0})),
            ('invented-source-authority', lambda d: d['cases'][1]['extension'].update(originalLocalizedForceJetsAuthenticated=True)),
        ]
        for name, mutate in controls:
            changed = copy.deepcopy(data)
            mutate(changed)
            try:
                rejected = not independent(changed, False, deadline)['pass']
            except (ValueError, KeyError, IndexError, ZeroDivisionError):
                rejected = True
            check('negative-control-'+name, rejected)
    return {'schema': 'MathScope.N7.IndependentSourceTerminalWindowChecks/1', 'checks': checks, 'checkCount': len(checks),
            'arithmetic': 'Exact Fraction polynomials and integer root inequalities; 80-digit Decimal only for declared polynomial fixtures',
            'originalSourceParameterNumericEvaluation': False, 'globalOriginalForceConstructed': False, 'pass': all(x['pass'] for x in checks)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--attempt', type=int, default=1)
    args = parser.parse_args()
    if args.attempt < 1:
        raise ValueError('Use a fresh positive attempt number.')
    out = ROOT/'research-ide/mathscope-m3/navier/evidence/source-terminal-cutoff-schedule-20261012'/f'attempt{args.attempt}'
    out.mkdir(parents=True, exist_ok=False)
    sources = source_files()
    before = [digest(p) for p in sources]
    write(out/'source-before.json', before)
    for p in sources:
        target = out/'sources'/p.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(p.read_bytes())
    env = dict(os.environ, M3_SOURCE_TERMINAL_EVIDENCE=str(out/'source-terminal-window.json'))
    command = ['node', '--max-old-space-size=384', '--test', '--test-reporter=tap', '--test-concurrency=1', PREFIX+'tests/source-terminal-cutoff-schedule.test.mjs']
    started, tick = datetime.datetime.now(datetime.timezone.utc).isoformat(), time.monotonic()
    stopped = None
    try:
        child = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True, timeout=60)
        stdout, stderr, code = child.stdout, child.stderr, child.returncode
    except subprocess.TimeoutExpired as error:
        stdout = (error.stdout or b'').decode() if isinstance(error.stdout, bytes) else error.stdout or ''
        stderr = (error.stderr or b'').decode() if isinstance(error.stderr, bytes) else error.stderr or ''
        code, stopped = None, 'OBSERVED_EXECUTION_TIME_LIMIT'
    elapsed = time.monotonic()-tick
    (out/'node.log').write_text(stdout)
    (out/'node.stderr').write_text(stderr)
    try:
        observed = independent(json.loads((out/'source-terminal-window.json').read_text()), deadline=tick+60)
    except Exception as error:
        observed = {'pass': False, 'checks': [], 'checkCount': 0, 'error': type(error).__name__+': '+str(error)}
    total_elapsed = time.monotonic()-tick
    write(out/'independent-exact.json', observed)
    after = [digest(p) for p in sources]
    write(out/'source-after.json', {'before': before, 'after': after, 'unchanged': before == after})

    def count(name):
        matches = re.findall(r'^# '+name+r' (\d+)$', stdout, re.M)
        return int(matches[-1]) if matches else None
    receipt = {'schema': 'MathScope.N7.SourceTerminalWindowObservedExecution/1', 'attempt': args.attempt, 'command': command,
               'startedAt': started, 'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'elapsedSeconds': total_elapsed,
               'nodeElapsedSeconds': elapsed,
               'exitCode': code, 'stoppedReason': stopped, 'timeoutSeconds': 60, 'v8OldSpaceMiB': 384,
               'nodeTests': {'passed': count('pass'), 'failed': count('fail'), 'skipped': count('skipped'), 'required': 7},
               'sourceFileCount': len(sources), 'sourceFilesUnchanged': before == after, 'independentChecks': observed['checkCount'],
               'independentPass': observed['pass'], 'artifacts': [digest(p) for p in sorted(out.iterdir()) if p.is_file()],
               'globalOriginalTerminalJetsComputed': False, 'originalN704Complete': False, 'originalN705Complete': False,
               'originalCriterionAssessmentEdited': False, 'wholeM3Complete': False,
               'pass': code == 0 and stopped is None and total_elapsed <= 60 and count('pass') == 7 and count('fail') == 0 and count('skipped') == 0
               and before == after and observed['pass']}
    write(out/'receipt.json', receipt)
    print(json.dumps({'receipt': digest(out/'receipt.json'), 'nodeTests': receipt['nodeTests'], 'sourceFilesUnchanged': before == after,
                      'independentChecks': observed['checkCount'], 'independentError': observed.get('error'),
                      'failedIndependent': [x['id'] for x in observed['checks'] if not x['pass']], 'pass': receipt['pass']}, indent=2))
    raise SystemExit(0 if receipt['pass'] else 1)


if __name__ == '__main__':
    main()
