#!/usr/bin/env python3
"""Observed generic forced inverse gate with an independent Fraction check.

This does not execute an original N6 source constructor. It independently
checks complete polynomial coefficient maps, noncommuting ordered source
integrals and the full complex (7.13) pressure at exact rational inputs.
"""
from datetime import datetime, timezone
from fractions import Fraction as F
from functools import lru_cache
from pathlib import Path
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'research-ide/mathscope-m3/navier'


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def sources():
    found = set()

    def visit(path):
        path = path.resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError('Source import escaped the repository')
        if path in found:
            return
        found.add(path)
        if path.suffix in ['.mjs', '.js']:
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', path.read_text()):
                visit(path.parent / spec)
    for path in [BASE / 'source-forced-pulse.mjs', BASE / 'tests/forced-pulse-kernel.test.mjs', Path(__file__)]:
        visit(path)
    return [{'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size, 'sha256': digest(p.read_bytes())}
            for p in sorted(found)]


def clean(a):
    return {m: v for m, v in a.items() if v}


def constant(v):
    return {(): F(v)} if v else {}


def plus(*polynomials):
    out = {}
    for a in polynomials:
        for m, v in a.items():
            out[m] = out.get(m, F(0)) + v
    return clean(out)


def scale(a, factor):
    return clean({m: v * factor for m, v in a.items()})


def times(*polynomials):
    out = constant(1)
    for a in polynomials:
        next_value = {}
        for m, v in out.items():
            for n, w in a.items():
                powers = dict(m)
                for variable, exponent in n:
                    powers[variable] = powers.get(variable, 0) + exponent
                term = tuple(sorted((x, p) for x, p in powers.items() if p))
                next_value[term] = next_value.get(term, F(0)) + v * w
        out = clean(next_value)
    return out


def power(a, n):
    if n < 0:
        if len(a) != 1 or () not in a:
            raise ValueError('Polynomial control acquired a nonconstant denominator')
        return constant(a[()] ** n)
    out = constant(1)
    for _ in range(n):
        out = times(out, a)
    return out


def var(variable):
    return {((variable, 1),): F(1)}


def substitute(a, variable, value):
    out = {}
    for m, coefficient in a.items():
        terms = dict(m)
        exponent = terms.pop(variable, 0)
        out = plus(out, times({tuple(sorted(terms.items())): coefficient}, power(value, exponent)))
    return out


def derivative(a, variable):
    out = {}
    for m, coefficient in a.items():
        terms = dict(m)
        exponent = terms.get(variable, 0)
        if not exponent:
            continue
        terms[variable] = exponent - 1
        out[tuple(sorted((x, p) for x, p in terms.items() if p))] = coefficient * exponent
    return clean(out)


def coefficient(a, variable, exponent):
    out = {}
    for m, value in a.items():
        terms = dict(m)
        if terms.pop(variable, 0) == exponent:
            out[tuple(sorted(terms.items()))] = value
    return clean(out)


class Polynomial:
    def __init__(self, record):
        self.nodes = record['nodes']

    @lru_cache(maxsize=None)
    def at(self, node):
        op, args = self.nodes[node]['op'], self.nodes[node]['args']
        if op == 'rational':
            return constant(F(int(args[0]), int(args[1])))
        if op == 'coordinate':
            return var(node)
        if op == 'add':
            return plus(*(self.at(x) for x in args))
        if op == 'multiply':
            return times(*(self.at(x) for x in args))
        if op == 'integer_power':
            return power(self.at(args[0]), args[1])
        if op == 'inverse':
            return power(self.at(args[0]), -1)
        if op == 'definite_integral':
            body, variable, left, right = args
            primitive = {}
            for m, value in self.at(body).items():
                terms = dict(m)
                exponent = terms.get(variable, 0) + 1
                terms[variable] = exponent
                primitive[tuple(sorted(terms.items()))] = value / exponent
            return plus(substitute(primitive, variable, self.at(right)), scale(substitute(primitive, variable, self.at(left)), F(-1)))
        raise ValueError('Unsupported polynomial control operation ' + op)


class RationalValues:
    def __init__(self, record, assignments):
        self.nodes, self.assignments = record['nodes'], assignments

    @lru_cache(maxsize=None)
    def at(self, node):
        if node in self.assignments:
            return self.assignments[node]
        op, args = self.nodes[node]['op'], self.nodes[node]['args']
        if op == 'rational':
            return F(int(args[0]), int(args[1]))
        if op == 'add':
            return sum((self.at(x) for x in args), F(0))
        if op == 'multiply':
            return math.prod(self.at(x) for x in args)
        if op == 'integer_power':
            return self.at(args[0]) ** args[1]
        if op == 'inverse':
            return 1 / self.at(args[0])
        raise ValueError('An undeclared non-rational operand entered the independent principal calculation: ' + op)


def verify(polynomial, algebra):
    checks = []

    def check(name, truth):
        checks.append({'id': name, 'pass': bool(truth)})

    p = Polynomial(polynomial)
    coordinates = polynomial['coordinates']
    v, a, b, c = (coordinates[x] for x in ['v', 'a', 'b', 'c'])
    zero = {}
    expected_matrix = [[zero, times(var(a), var(v)), zero], [zero, zero, var(b)], [zero, zero, zero]]
    expected_sources = [
        [times(var(c), var(v)), times(var(a), power(var(v), 2))],
        [times(power(var(a), 2), var(v)), var(c)],
        [var(c), times(var(b), var(v))]
    ]
    matrix = [[p.at(x) for x in row] for row in polynomial['matrix']]
    sources = [[p.at(z[part]) for part in ['real', 'imaginary']] for z in polynomial['forcing']]
    check('entire-explicit-noncommuting-control-matrix', matrix == expected_matrix)
    check('all-six-explicit-control-source-bodies', sources == expected_sources)
    M0 = [[substitute(x, v, zero) for x in row] for row in matrix]
    M1 = [[substitute(x, v, constant(1)) for x in row] for row in matrix]
    product = lambda first, second: plus(*(times(first[0][j], second[j][2]) for j in range(3)))
    check('wrong-commuting-matrix-replacement-detected', product(M0, M1) != product(M1, M0))

    # Solve the finite polynomial control independently by coefficient
    # recursion, without importing the JS ordered-integral recurrence.
    solutions = [[{} for _ in range(2)] for _ in range(3)]
    for degree in range(7):
        next_coefficients = [[None for _ in range(2)] for _ in range(3)]
        for j in range(3):
            for part in range(2):
                rhs = plus(sources[j][part], *(times(matrix[j][k], solutions[k][part]) for k in range(3)))
                next_coefficients[j][part] = scale(coefficient(rhs, v, degree), F(1, degree + 1))
        for j in range(3):
            for part in range(2):
                solutions[j][part] = plus(solutions[j][part], times(next_coefficients[j][part], power(var(v), degree + 1)))
    for j in range(3):
        for part, name in enumerate(['real', 'imaginary']):
            actual = p.at(polynomial['partial']['velocity'][j][name])
            stated = p.at(polynomial['exact'][j][name])
            expected = solutions[j][part]
            check(f'whole-ordered-integral-coefficient-map-{j}-{name}', actual == expected)
            check(f'independent-closed-solution-coefficient-map-{j}-{name}', stated == expected)
            rhs = plus(sources[j][part], *(times(matrix[j][k], solutions[k][part]) for k in range(3)))
            check(f'independent-differentiated-ODE-{j}-{name}', derivative(expected, v) == rhs)
            check(f'independent-zero-initial-datum-{j}-{name}', substitute(expected, v, zero) == zero)
    check('special-finite-control-does-not-replace-generic-limit', not polynomial['partial']['finiteSumIsExactSolution']
          and not polynomial['partial']['omittedTermsDeclaredZero'] and not polynomial['definition']['sourceAuthenticated'])
    for N in range(9):
        factors = [math.factorial(N + k + 1) >= math.factorial(N + 1) * math.factorial(k) for k in range(15)]
        check(f'factorial-tail-coefficient-domination-N{N}', all(factors))

    # Independently construct every 3 by 3 principal coefficient and both
    # complex pressure components at exact rational parameters. The t
    # entries are independent values, not approximated Volterra solutions.
    # Full principal cancellation holds algebraically even before imposing
    # the constraint; the second check supplies its exact scalar evolution.
    dot = lambda x, y: sum((u * w for u, w in zip(x, y)), F(0))
    state_values = [[F(2, 3), F(-1, 6)], [F(-1, 5), F(3, 4)], [F(1, 7), F(-2, 9)]]
    for run, (time_value, a_value, b_value) in enumerate([(F(0), F(-2, 5), F(3, 7)), (F(1, 3), F(5, 3), F(-1, 4)), (F(3, 5), F(7, 6), F(2, 9))]):
        assignments = {algebra['coordinates'][name]: value for name, value in [('v', time_value), ('a', a_value), ('b', b_value), ('ell', F(7))]}
        for j, z in enumerate(algebra['velocity']):
            for part, name in enumerate(['real', 'imaginary']):
                assignments[z[name]] = state_values[j][part]
        r = RationalValues(algebra, assignments)
        n, np = [r.at(x) for x in algebra['normal']['value']], [r.at(x) for x in algebra['normal']['derivative']]
        K = [[r.at(x) for x in row] for row in algebra['K']]
        source = [[r.at(z[name]) for name in ['real', 'imaginary']] for z in algebra['source']]
        n2, k, epsilon, m = dot(n, n), r.at(algebra['k']), r.at(algebra['epsilon']), algebra['input']['m']
        d = epsilon * k * k * n2
        normal_row = [dot(n, [K[i][j] for i in range(3)]) - np[j] for j in range(3)]
        A = [[-K[i][j] + n[i] * normal_row[j] / n2 for j in range(3)] for i in range(3)]
        matrix = [[A[i][j] - (m * m * d if i == j else 0) for j in range(3)] for i in range(3)]
        projected = [[-source[i][part] + n[i] * dot(n, [source[j][part] for j in range(3)]) / n2 for part in range(2)] for i in range(3)]
        rhs = [[dot(matrix[i], [state_values[j][part] for j in range(3)]) + projected[i][part] for part in range(2)] for i in range(3)]
        numerator = [dot(normal_row, [state_values[j][part] for j in range(3)]) + dot(n, [source[j][part] for j in range(3)]) for part in range(2)]
        pressure = [-numerator[1] / (k * m * n2), numerator[0] / (k * m * n2)]
        check(f'full-moving-principal-matrix-{run}', [[r.at(x) for x in row] for row in algebra['matrix']] == matrix)
        check(f'full-projected-complex-source-{run}', [[r.at(z[name]) for name in ['real', 'imaginary']] for z in algebra['projectedSource']] == projected)
        check(f'algebraic-normal-complex-pressure-{run}', [r.at(algebra['pressure'][name]) for name in ['real', 'imaginary']] == pressure)
        check(f'zero-data-Volterra-RHS-body-{run}', [[r.at(z[name]) for name in ['real', 'imaginary']] for z in algebra['rhs']] == rhs)
        for part, name in enumerate(['real', 'imaginary']):
            constraint_derivative = dot(np, [state_values[j][part] for j in range(3)]) + dot(n, [rhs[j][part] for j in range(3)])
            check(f'full-moving-constraint-equation-{run}-{name}', constraint_derivative == -m * m * d * dot(n, [state_values[j][part] for j in range(3)]))
            for i in range(3):
                gradient = -k * m * n[i] * pressure[1] if part == 0 else k * m * n[i] * pressure[0]
                residual = rhs[i][part] + dot(K[i], [state_values[j][part] for j in range(3)]) + m * m * d * state_values[i][part] + source[i][part] + gradient
                check(f'full-pressure-principal-cancellation-{run}-{i}-{name}', residual == 0)
        check(f'omitting-normal-source-pressure-detected-{run}', any(dot(n, [source[j][part] for j in range(3)]) for part in range(2)))
        check(f'omitting-moving-normal-detected-{run}', any(dot(np, [state_values[j][part] for j in range(3)]) for part in range(2)))
        check(f'wrong-higher-harmonic-damping-detected-{run}', (m * m - 1) * d * state_values[0][0] != 0)
    check('generic-kernel-has-no-original-source-authority', algebra['sourceAuthenticated'] is False)
    return {'schema': 'MathScope.N6.ForcedPulseIndependentExactCheck/1', 'arithmetic': 'Python Fraction sparse polynomial coefficient maps and exact rational complex algebra',
            'checks': checks, 'passed': sum(x['pass'] for x in checks), 'failed': sum(not x['pass'] for x in checks),
            'allPass': all(x['pass'] for x in checks), 'actualOriginalSourceConstructorExecuted': False,
            'newLeanKernelExecuted': False, 'genericKernelProofExecuted': True}


def main():
    attempt = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    out = BASE / f'evidence/forced-pulse-kernel-20261012/attempt{attempt}'
    out.mkdir(parents=True, exist_ok=False)
    started, clock = datetime.now(timezone.utc), time.monotonic()
    before = sources()
    write(out / 'source-bytes-before.json', before)
    for row in before:
        target = out / 'source-snapshot' / row['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / row['path'], target)
    env = {**os.environ, 'MATHSCOPE_FORCED_PULSE_POLYNOMIAL_ARTIFACT': str(out / 'polynomial-control.json'),
           'MATHSCOPE_FORCED_PULSE_ALGEBRA_ARTIFACT': str(out / 'algebra-control.json')}
    result = subprocess.run(['node', '--test', '--test-reporter=tap', str(BASE / 'tests/forced-pulse-kernel.test.mjs')],
                            cwd=ROOT, env=env, capture_output=True, text=True, timeout=60)
    (out / 'node.log').write_text(result.stdout)
    (out / 'node.stderr').write_text(result.stderr)
    independent = verify(json.loads((out / 'polynomial-control.json').read_text()), json.loads((out / 'algebra-control.json').read_text()))
    write(out / 'independent-exact.json', independent)
    after = sources()
    unchanged = before == after
    write(out / 'source-bytes.json', {'before': before, 'after': after, 'allUnchanged': unchanged})
    node_tests = int(re.search(r'# tests (\d+)', result.stdout).group(1))
    node_passed = int(re.search(r'# pass (\d+)', result.stdout).group(1))
    ok = result.returncode == 0 and node_tests == node_passed == 14 and independent['allPass'] and unchanged
    files = {p.name: {'bytes': p.stat().st_size, 'sha256': digest(p.read_bytes())} for p in sorted(out.iterdir()) if p.is_file()}
    receipt = {'schema': 'MathScope.N6.ForcedPulseKernelObservedGate/1', 'attempt': attempt,
               'startedUTC': started.isoformat(), 'finishedUTC': datetime.now(timezone.utc).isoformat(),
               'elapsedSeconds': time.monotonic() - clock, 'nodeExitCode': result.returncode,
               'nodeTests': node_tests, 'nodePassed': node_passed, 'independentPassed': independent['passed'],
               'independentFailed': independent['failed'], 'sourceCount': len(before), 'sourceBytesUnchanged': unchanged,
               'files': files, 'genericKernelProofExecuted': True, 'actualOriginalSourceConstructorExecuted': False,
               'completeN6': False, 'newLeanKernelExecuted': False, 'verdict': 'PASS' if ok else 'FAIL'}
    write(out / 'receipt.json', receipt)
    print(json.dumps({'verdict': receipt['verdict'], 'path': str(out.relative_to(ROOT)), 'node': node_passed,
                      'independent': independent['passed'], 'sourceCount': len(before), 'elapsedSeconds': receipt['elapsedSeconds']}))
    if not ok:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
