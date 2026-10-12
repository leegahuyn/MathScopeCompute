#!/usr/bin/env python3
"""Observe the auxiliary inverse kernel and independently verify its algebra.

Python Fraction evaluates the emitted exact expression graph as a finite
Fourier polynomial over Q(sqrt(2), pi, i). Unit-torus integrals use exact
integer-frequency orthogonality. The actual source attachment is separate;
this test never certifies an arbitrary caller body as the N6 residual.
"""
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'research-ide/mathscope-m3/navier'
GENERATE = r"""
import {ActualConvergentExpressions} from './research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {exactAuxiliaryPi,exactAuxiliaryDivisor,finiteAuxiliaryInverse,auxiliaryInverseTail} from './research-ide/mathscope-m3/navier/source-auxiliary-fourier.mjs';
const G=new ActualConvergentExpressions(),Y=[G.fresh('independent_y0'),G.fresh('independent_y1')],pi=exactAuxiliaryPi(G),twoPi=G.mul(G.q(2),pi.value),
 body=G.add(G.q(5),G.mul(G.q(3),G.cosine(G.mul(twoPi,G.add(Y[0],Y[1])))),G.mul(G.q(-2),G.sine(G.mul(twoPi,G.sub(G.mul(G.q(2),Y[0]),Y[1]))))),
 finite=finiteAuxiliaryInverse(G,{body,Y,cutoff:2,derivativeOrders:[0,1,2]}),sqrtTwo=G.sqrt(G.q(2)),
 directN=G.add(G.mul(G.sub(sqrtTwo,G.one),G.derivative(finite.value,Y[0])),G.derivative(finite.value,Y[1])),divisors=[];
for(let a=-8;a<=8;a++)for(let b=-8;b<=8;b++)if(a||b)divisors.push(exactAuxiliaryDivisor(G,[a,b]));
let p=1n,q=1n;for(let n=0;n<90;n++){[p,q]=[p+2n*q,p+q];if(n%10===0)divisors.push(exactAuxiliaryDivisor(G,[String(q),String(q-p)]));}
const largerTail=auxiliaryInverseTail(G,{body:finite.centeredBody,Y,cutoff:4,derivativeOrder:0});
process.stdout.write(JSON.stringify({schema:'MathScope.N6.AuxiliaryFourierKernelObservation/1',nodes:G.nodes,Y,pi,body,finite,directN,divisors,largerTail,
 sourceAuthenticated:false,actualN6ResidualAttached:false,newLeanExecuted:false}));
"""


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def source_rows():
    seen = set()

    def visit(path):
        path = path.resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError('Source import escaped the repository')
        if path in seen:
            return
        seen.add(path)
        if path.suffix in ['.mjs', '.js']:
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', path.read_text()):
                visit(path.parent / spec)
    for path in [BASE / 'source-auxiliary-fourier.mjs', BASE / 'tests/auxiliary-fourier-kernel.test.mjs', Path(__file__)]:
        visit(path)
    return [{'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size, 'sha256': digest(path.read_bytes())}
            for path in sorted(seen)]


# Scalars are sparse Laurent polynomials in pi, with sqrt(2)^2=2 and i^2=-1.
def clean(values):
    return {key: value for key, value in values.items() if value}


def ring(value=0):
    return {(0, 0, 0): F(value)} if value else {}


def plus(a, b):
    out = dict(a)
    for key, value in b.items():
        out[key] = out.get(key, F(0)) + value
    return clean(out)


def times(a, b):
    out = {}
    for (p, s, i), x in a.items():
        for (q, t, j), y in b.items():
            key = p + q, (s + t) % 2, (i + j) % 2
            out[key] = out.get(key, F(0)) + x * y * 2 ** ((s + t) // 2) * (-1) ** ((i + j) // 2)
    return clean(out)


def inverse(a):
    powers = {key[0] for key in a}
    if len(powers) != 1 or any(key[2] for key in a):
        raise ValueError('Expected a real quadratic scalar times one power of pi')
    p = next(iter(powers))
    x, y = a.get((p, 0, 0), F(0)), a.get((p, 1, 0), F(0))
    norm = x * x - 2 * y * y
    if not norm:
        raise ValueError('Independent scalar inverse has zero quadratic norm')
    return clean({(-p, 0, 0): x / norm, (-p, 1, 0): -y / norm})


def fs_constant(value):
    return {(): value} if value else {}


def fs_plus(a, b):
    out = dict(a)
    for key, value in b.items():
        out[key] = plus(out.get(key, {}), value)
    return clean(out)


def frequency_sum(a, b):
    result = dict(a)
    for key, value in b:
        result[key] = result.get(key, 0) + value
    return tuple(sorted((key, value) for key, value in result.items() if value))


def fs_times(a, b):
    out = {}
    for first, x in a.items():
        for second, y in b.items():
            key = frequency_sum(first, second)
            out[key] = plus(out.get(key, {}), times(x, y))
    return clean(out)


def fs_scale(a, scalar):
    return clean({key: times(value, scalar) for key, value in a.items()})


def fs_derivative(a, coordinate, count=1):
    out = a
    for _ in range(count):
        out = clean({key: times(value, {(1, 0, 1): F(2 * dict(key).get(coordinate, 0))}) for key, value in out.items()})
    return out


class FourierInterpreter:
    def __init__(self, record):
        self.nodes = record['nodes']
        self.pi = record['pi']['value']
        self.cache, self.linear_cache = {}, {}

    def scalar(self, node):
        value = self.at(node)
        if any(key for key in value):
            raise ValueError('Expected a scalar independent of the torus')
        return value.get((), {})

    def linear(self, node):
        if node in self.linear_cache:
            return self.linear_cache[node]
        op, args = self.nodes[node]['op'], self.nodes[node]['args']
        if op == 'coordinate':
            out = {node: ring(1)}
        elif node == self.pi or op in ['rational', 'inverse', 'sqrt_positive']:
            out = {None: self.scalar(node)}
        elif op == 'add':
            out = {}
            for child in args:
                for key, value in self.linear(child).items():
                    out[key] = plus(out.get(key, {}), value)
        elif op == 'multiply':
            out = {None: ring(1)}
            for child in args:
                right, updated = self.linear(child), {}
                for first, x in out.items():
                    for second, y in right.items():
                        if first is not None and second is not None:
                            raise ValueError('A Fourier phase is not affine')
                        key = first if first is not None else second
                        updated[key] = plus(updated.get(key, {}), times(x, y))
                out = clean(updated)
        else:
            raise ValueError('Unsupported affine Fourier phase ' + op)
        self.linear_cache[node] = clean(out)
        return self.linear_cache[node]

    def at(self, node):
        if node in self.cache:
            return self.cache[node]
        op, args = self.nodes[node]['op'], self.nodes[node]['args']
        if node == self.pi:
            out = fs_constant({(1, 0, 0): F(1)})
        elif op == 'rational':
            out = fs_constant(ring(F(int(args[0]), int(args[1]))))
        elif op == 'sqrt_positive':
            if self.scalar(args[0]) != ring(2):
                raise ValueError('Only the exact sqrt(2) constant belongs to this Fourier test field')
            out = fs_constant({(0, 1, 0): F(1)})
        elif op == 'add':
            out = {}
            for child in args:
                out = fs_plus(out, self.at(child))
        elif op == 'multiply':
            out = fs_constant(ring(1))
            for child in args:
                out = fs_times(out, self.at(child))
        elif op == 'inverse':
            out = fs_constant(inverse(self.scalar(args[0])))
        elif op == 'integer_power':
            out = fs_constant(ring(1))
            for _ in range(args[1]):
                out = fs_times(out, self.at(args[0]))
        elif op in ['sine', 'cosine']:
            phase = self.linear(args[0])
            if phase.get(None):
                raise ValueError('Unexpected nonzero constant phase')
            frequencies = []
            for coordinate, value in phase.items():
                if coordinate is None:
                    continue
                coefficient = value.get((1, 0, 0), F(0)) / 2
                if set(value) - {(1, 0, 0)} or coefficient.denominator != 1:
                    raise ValueError('The phase frequency is not an exact integer')
                if coefficient:
                    frequencies.append((coordinate, int(coefficient)))
            positive = tuple(sorted(frequencies))
            negative = tuple((key, -value) for key, value in positive)
            a = ring(F(1, 2)) if op == 'cosine' else {(0, 0, 1): F(-1, 2)}
            b = ring(F(1, 2)) if op == 'cosine' else {(0, 0, 1): F(1, 2)}
            out = fs_plus({positive: a}, {negative: b})
        elif op == 'definite_integral':
            body, variable, left, right = args
            if self.scalar(left) or self.scalar(right) != ring(1):
                raise ValueError('Expected normalized unit-Haar integral')
            out = {key: value for key, value in self.at(body).items() if dict(key).get(variable, 0) == 0}
        else:
            raise ValueError('Unsupported finite Fourier test node ' + op)
        self.cache[node] = clean(out)
        return self.cache[node]


def verify(record):
    checks, interpreter = [], FourierInterpreter(record)
    nodes, pi = record['nodes'], record['pi']

    def check(name, value):
        checks.append({'id': name, 'pass': bool(value)})

    def shape(node):
        row = nodes[node]
        if row['op'] in ['rational', 'coordinate']:
            return row
        if row['op'] == 'integer_power':
            return {'op': row['op'], 'args': [shape(row['args'][0]), row['args'][1]]}
        return {'op': row['op'], 'args': [shape(child) for child in row['args']]}

    q = lambda n: {'op': 'rational', 'args': [str(n), '1']}
    variable = nodes[pi['variable']]
    integrand = shape(pi['integrand'])
    check('exact-pi-atan-integral-structure',
          nodes[pi['integral']] == {'op': 'definite_integral', 'args': [pi['integrand'], pi['variable'], 0, 1]}
          and integrand['op'] == 'inverse' and integrand['args'][0]['op'] == 'add'
          and q(1) in integrand['args'][0]['args']
          and {'op': 'integer_power', 'args': [variable, 2]} in integrand['args'][0]['args']
          and nodes[pi['value']]['op'] == 'multiply'
          and pi['integral'] in nodes[pi['value']]['args']
          and any(nodes[child] == q(4) for child in nodes[pi['value']]['args']))
    for index, row in enumerate(record['divisors']):
        k0, k1 = map(int, row['mode'])
        m, n = k1 - k0, k0
        norm = m * m - 2 * n * n
        expected = clean({(0, 0, 0): F(m), (0, 1, 0): F(n)})
        check('integer-quadratic-divisor-' + str(index),
              norm != 0 and row['quadratic']['integerNorm'] == str(norm)
              and interpreter.scalar(row['value']) == expected
              and times(interpreter.scalar(row['value']), interpreter.scalar(row['reciprocal'])) == ring(1))
        upper = clean({(0, 0, 0): F(2 * max(abs(k0), abs(k1))), (0, 1, 0): F(max(abs(k0), abs(k1)))})
        check('full-original-small-divisor-bound-' + str(index),
              abs(norm) >= 1 and abs(m) <= 2 * max(abs(k0), abs(k1)) and abs(n) <= max(abs(k0), abs(k1))
              and interpreter.scalar(row['inverseAbsUpper']) == upper)
    finite, Y = record['finite'], record['Y']
    source = interpreter.at(record['body'])
    mean = source.get((), {})
    centered = {key: value for key, value in source.items() if key}
    check('exact-Haar-mean-retained-not-inverted', interpreter.scalar(finite['haarMean']['C']) == mean == ring(5)
          and interpreter.scalar(finite['haarMean']['S']) == {} and finite['zeroMode']['inverted'] is False)
    check('actual-zero-mean-source-projection', interpreter.at(finite['centeredBody']) == centered)
    for index, row in enumerate(finite['rows']):
        k0, k1 = row['mode']
        frequency = tuple((coordinate, value) for coordinate, value in zip(Y, [k0, k1]) if value)
        coefficient = source.get(frequency, {})
        real = {key: value for key, value in coefficient.items() if key[2] == 0}
        minus_imaginary = {(p, s, 0): -value for (p, s, i), value in coefficient.items() if i == 1}
        check('independent-exact-Fourier-integrals-' + str(index),
              interpreter.scalar(row['coefficient']['C']) == real and interpreter.scalar(row['coefficient']['S']) == minus_imaginary)
    check('complete-known-polynomial-projection', interpreter.at(finite['sourceProjection']) == centered)
    check('exact-original-direction-on-finite-inverse', interpreter.at(record['directN']) == centered)
    inverse_expected = {}
    for frequency, coefficient in centered.items():
        k = dict(frequency)
        d = clean({(0, 0, 0): F(k.get(Y[1], 0) - k.get(Y[0], 0)), (0, 1, 0): F(k.get(Y[0], 0))})
        inverse_expected[frequency] = times(coefficient, times(inverse(d), {(-1, 0, 1): F(-1, 2)}))
    check('independent-reality-sign-and-two-pi-normalization', interpreter.at(finite['value']) == clean(inverse_expected))
    for tail in finite['tails']:
        m, r = tail['derivativeOrder'], tail['sourceDerivativeOrder']
        check('four-extra-derivatives-' + str(m), r == m + 4 and tail['sourceBound']['highestGeneratedTorusDerivativeTotalOrder'] == r + 2)
        for face in tail['sourceBound']['faces']:
            target = fs_derivative(centered, Y[face['axis']], r)
            check('actual-source-pure-and-mixed-FTC-derivatives-' + str(m) + '-' + str(face['axis']),
                  interpreter.at(face['derivative']) == target
                  and interpreter.at(face['first']) == fs_derivative(target, Y[0])
                  and interpreter.at(face['second']) == fs_derivative(target, Y[1])
                  and interpreter.at(face['mixed']) == fs_derivative(fs_derivative(target, Y[0]), Y[1]))
        check('entire-positive-tail-retained-' + str(m), tail['omittedModesSetToZero'] is False
              and tail['finiteCutoffDeclaredExact'] is False and tail['sourceAuthenticated'] is False
              and tail['exactFormula'] == '8*(2+sqrt(2))*C_(m+4)/((2*pi)^5*K)')
    for n in range(1, 33):
        count = sum(max(abs(a), abs(b)) == n for a in range(-n, n + 1) for b in range(-n, n + 1))
        check('exact-max-norm-shell-count-' + str(n), count == 8 * n)
    for cutoff in [1, 2, 4, 8, 32]:
        prefix = sum((F(1, n * n) for n in range(cutoff + 1, 2001)), F(0))
        check('independent-positive-tail-comparison-' + str(cutoff), prefix + F(1, 2000) <= F(1, cutoff))
    check('source-authority-and-full-residual-not-invented', record['sourceAuthenticated'] is False
          and record['actualN6ResidualAttached'] is False and record['newLeanExecuted'] is False
          and finite['finiteSumClaimedWholeInverse'] is False and finite['omittedTailRetained'] is True)
    return {'schema': 'MathScope.N6.AuxiliaryFourierIndependentExact/1',
            'status': 'PASS' if checks and all(row['pass'] for row in checks) else 'FAIL', 'checks': checks,
            'arithmetic': 'Python Fraction with exact Q(sqrt(2),pi,i) Fourier polynomials and normalized-Haar orthogonality',
            'sourceAuthenticated': False, 'actualN6ResidualAttached': False, 'newLeanExecuted': False}


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'[1-9][0-9]*', sys.argv[1]):
        raise SystemExit('Usage: run-auxiliary-fourier-kernel.py NEW_ATTEMPT_NUMBER')
    attempt = int(sys.argv[1])
    out = BASE / 'evidence/auxiliary-fourier-kernel-20261012' / ('attempt' + str(attempt))
    out.mkdir(parents=True, exist_ok=False)
    before = source_rows()
    for row in before:
        raw = (ROOT / row['path']).read_bytes()
        if len(raw) != row['bytes'] or digest(raw) != row['sha256']:
            raise ValueError('Source bytes changed before their observed snapshot')
        target = out / 'source-snapshot' / row['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
    started, start = datetime.now(timezone.utc).isoformat(), time.monotonic()
    tests = subprocess.run(['node', '--test', '--test-reporter=tap', 'research-ide/mathscope-m3/navier/tests/auxiliary-fourier-kernel.test.mjs'],
                           cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=30)
    (out / 'node.log').write_bytes(tests.stdout)
    run = subprocess.run(['node', '--input-type=module', '-e', GENERATE], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
    (out / 'kernel.json').write_bytes(run.stdout)
    (out / 'node.stderr').write_bytes(run.stderr)
    independent = {'status': 'NOT_RUN', 'checks': []}
    if run.returncode == 0:
        try:
            independent = verify(json.loads(run.stdout))
        except Exception as error:
            independent = {'status': 'FAIL', 'checks': [{'id': 'independent-parser', 'pass': False, 'errorType': type(error).__name__, 'message': str(error)}]}
    write(out / 'independent-exact.json', independent)
    after = source_rows()
    write(out / 'source-bytes.json', {'before': before, 'after': after, 'unchanged': before == after})
    log = tests.stdout.decode()
    counts = {name: int(re.findall(r'^# ' + name + r' (\d+)$', log, re.M)[-1]) for name in ['pass', 'fail', 'skipped']}
    paths = [out / name for name in ['node.log', 'kernel.json', 'node.stderr', 'independent-exact.json', 'source-bytes.json']]
    receipt = {'schema': 'MathScope.N6.AuxiliaryFourierKernelObservedExecution/1', 'attempt': attempt, 'startedAt': started,
               'finishedAt': datetime.now(timezone.utc).isoformat(), 'elapsedSeconds': time.monotonic() - start,
               'nodeTests': counts, 'nodeTestExitCode': tests.returncode, 'kernelGenerationExitCode': run.returncode,
               'sourceFilesUnchanged': before == after, 'sourceFileCount': len(before),
               'independentStatus': independent['status'], 'independentCheckCount': len(independent['checks']),
               'artifacts': [{'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size, 'sha256': digest(path.read_bytes())} for path in paths],
               'sourceAuthenticated': False, 'actualN6ResidualAttached': False, 'newLeanExecuted': False,
               'pass': tests.returncode == run.returncode == 0 and counts == {'pass': 5, 'fail': 0, 'skipped': 0}
                       and before == after and independent['status'] == 'PASS'}
    write(out / 'receipt.json', receipt)
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0 if receipt['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
