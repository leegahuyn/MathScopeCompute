#!/usr/bin/env python3
"""Independent formal-h comparison audit; source norm fixtures stay explicit."""
from pathlib import Path
from fractions import Fraction as F
import argparse
import copy
import datetime
import hashlib
import json
import os
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[5]
PREFIX = 'research-ide/mathscope-m3/navier/final-summation/'


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')


def digest(path):
    raw = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


def source_files():
    seen = set()

    def visit(path):
        path = path.resolve()
        if path in seen:
            return
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise ValueError('Every source import must remain an existing repository file.')
        seen.add(path)
        if path.suffix in ('.mjs', '.js'):
            for name in re.findall(r'''(?:from\s*|import\s*)["'](\.[^"']+)["']''', path.read_text()):
                visit(path.parent/name)
    visit(ROOT/PREFIX/'tests/source-fixed-stage-scalar.test.mjs')
    seen.add(Path(__file__).resolve())
    return sorted(seen)


def formal(nodes, root, atoms=()):
    """Exact Laurent polynomials, independent of both JavaScript verifiers."""
    dim = len(atoms)
    unit = (0,)*dim
    memo = {}

    def add(a, b):
        out = dict(a)
        for k, v in b.items():
            out[k] = out.get(k, F())+v
        return {k: v for k, v in out.items() if v}

    def mul(a, b):
        out = {}
        for k, v in a.items():
            for l, w in b.items():
                key = tuple(x+y for x, y in zip(k, l))
                out[key] = out.get(key, F())+v*w
        return {k: v for k, v in out.items() if v}

    def visit(index):
        if index in memo:
            return memo[index]
        if index in atoms:
            out = {tuple(int(i == atoms.index(index)) for i in range(dim)): F(1)}
        else:
            node = nodes[index]
            op, args = node['op'], node['args']
            if op == 'rational':
                value = F(int(args[0]), int(args[1]))
                out = {unit: value} if value else {}
            elif op == 'add':
                out = {}
                for child in args:
                    out = add(out, visit(child))
            elif op == 'multiply':
                out = {unit: F(1)}
                for child in args:
                    out = mul(out, visit(child))
            elif op in ('integer_power', 'inverse'):
                exponent = args[1] if op == 'integer_power' else -1
                value = visit(args[0])
                if exponent < 0:
                    if len(value) != 1:
                        raise ValueError('Only an exact nonzero Laurent monomial may be inverted.')
                    k, v = next(iter(value.items()))
                    out = {tuple(x*exponent for x in k): v**exponent}
                else:
                    out = {unit: F(1)}
                    for _ in range(exponent):
                        out = mul(out, value)
            else:
                raise ValueError('Unexpected analytic node in the formal comparison identity: '+op)
        memo[index] = out
        return out
    return visit(root)


def independent(data, negative_controls=True):
    checks = []

    def check(name, value):
        checks.append({'id': name, 'pass': bool(value)})

    def const(value, dim=2):
        value = F(value)
        return {(0,)*dim: value} if value else {}

    for case_index, case in enumerate(data['cases']):
        m, N = case['m'], case['N']
        choice, comparison, inp = case['choice'], case['comparison'], case['input']
        roots, nodes = choice['roots'], case['program']['nodes']
        h, J = roots['h'], roots['fixedStage']
        p = lambda index, atoms=(h, J): formal(nodes, index, atoms)
        c = lambda name, value: check(f'case-{case_index}-{name}', value)
        # These coefficients are independently derived from 2A=1+2h.
        Kvc, Kvh = F(2*m+9, 2), F(3*m+13, 2)
        Krc, Krh = F(2*m+7, 2), F(3*m+10, 2)
        Ec, Eh = F(2*m+8), F(3*m+16, 2)
        affine = lambda a, b: {(0, 0): F(a), (1, 0): F(b)}
        c('full-velocity-loss', p(roots['velocityLoss']) == affine(Kvc, Kvh))
        c('full-residual-loss', p(roots['residualLoss']) == affine(Krc, Krh))
        c('full-m-plus-two-cutoff-loss', p(roots['tailDerivativeLoss']) == affine(Ec, Eh))
        c('nonnegative-all-order-loss-coefficients', min(Kvc, Kvh, Krc, Krh, Ec, Eh) > 0)
        c('tail-stage-lower', p(roots['tailStageLower']) == {(-1, 0): 20*(N+1+Kvc+Ec), (0, 0): 20*(Kvh+Eh)})
        c('residual-stage-lower', p(roots['residualStageLower']) == {(-1, 0): 10*(N+1+Krc), (0, 0): 10*Krh})
        lower_node = nodes[roots['stageLower']]
        c('all-stage-lower-arguments', lower_node['op'] == 'maximum' and len(lower_node['args']) == 3
          and lower_node['args'][1:] == [roots['tailStageLower'], roots['residualStageLower']]
          and p(lower_node['args'][0]) == const(m+2))
        c('exact-integer-ceiling', nodes[J] == {'op': 'ceiling', 'args': [roots['stageLower']]})
        c('whole-tail-exponent', p(roots['tailExponent']) == {(1, 1): F(1, 20), (1, 0): F(1, 20)-Eh, (0, 0): -Ec})
        c('whole-finite-residual-decay', p(roots['residualDecay']) == {(1, 1): F(1, 10), (1, 0): F(1, 5)})
        tm = {(1, 1): F(1, 20), (1, 0): F(1, 20)-Eh-Kvh, (0, 0): -N-1-Ec-Kvc}
        rm = {(1, 1): F(1, 10), (1, 0): F(1, 5)-Krh, (0, 0): -N-1-Krc}
        c('full-tail-margin', p(roots['tailMargin']) == tm)
        c('full-residual-margin', p(roots['residualMargin']) == rm)
        c('independent-tail-margin-factorization', p(roots['tailMarginDecomposed']) == tm)
        c('independent-residual-margin-factorization', p(roots['residualMarginDecomposed']) == rm)
        parameters = case['program']['parametersExactExpressions']
        c('unaltered-positive-original-h', parameters['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}}
          and parameters['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]}
          and parameters['Md'] == {'integer': 1048576})
        c('original-h-upper-argument', 8002*11 > 4 and 2**4 == 16)
        required = choice['requiredSourceEstimates']
        c('full-source-derivative-requests', required['finiteVelocity']['derivativeOrder'] == m+1
          and required['finiteResidual']['derivativeOrder'] == m and required['cutoffTail']['derivativeOrder'] == m+2)
        for name in ('velocity', 'residual', 'flatRemainder', 'cutoff'):
            premise = comparison['sameFixedStagePremises'][name]
            c('one-fixed-stage-'+name, premise['stageRoot'] == J)
        c('retained-one-flat-remainder-orders', comparison['sameFixedStagePremises']['flatRemainder']['derivativeOrder'] == m
          and comparison['sameFixedStagePremises']['flatRemainder']['decayOrder'] == N)
        for name, source in [('velocity', 'finiteState'), ('residual', 'finiteResidual')]:
            bound = comparison['absorption'][name]
            B, P = bound['positiveMajorant'], inp[source]['logPower']
            c('retained-norm-and-log-'+name, bound['coefficientNorm'] == inp[source]['constantRoot'] and bound['logPower'] == P)
            c('one-power-logarithm-absorption-'+name, p(bound['logarithmThreshold']) == const(4*P*P))
            c('constant-and-one-dyadic-power-absorption-'+name, p(bound['coefficientThreshold'], (B,)) == {(1,): F(2), (0,): F(2)})
            # B=1+sqrt(1+C^2)>|C| retains the supplied coefficient, never C=1.
            bn = nodes[B]
            sqrt_node = next(a for a in bn['args'] if nodes[a]['op'] == 'sqrt_positive')
            c('positive-norm-majorant-'+name, bn['op'] == 'add'
              and p(next(a for a in bn['args'] if a != sqrt_node)) == const(1)
              and p(nodes[sqrt_node]['args'][0]) == const(1+F(3 if name == 'velocity' else 5)**2))
        cr = comparison['roots']
        a, CE = cr['tailCoefficient'], cr['positiveFlatConstant']
        c('exact-tail-factor-stays-exponential', nodes[a]['op'] == 'exp')
        log2 = next(i for i, node in enumerate(nodes) if node['op'] == 'log_positive'
                    and nodes[node['args'][0]]['op'] == 'rational'
                    and F(*map(int, nodes[node['args'][0]]['args'])) == 2)
        c('dyadic-factor-full-stage', p(nodes[a]['args'][0], (J, log2)) == {(1, 1): F(-1)})
        c('complete-nonlinear-difference-constant', p(cr['differenceConstant'], (a, CE)) == {(1, 0): F(15*2**m)})
        c('single-flat-constant-only-once', p(cr['totalConstant'], (a, CE)) == {(1, 0): F(15*2**m), (0, 1): F(1), (0, 0): F(1, 2)})
        c('exact-cartesian-product-constant', int(comparison['exactNSDifferenceConstant']) == 6*2**m)
        dn = nodes[cr['logDelta']]
        c('comparison-neighborhood-retains-both-log-absorptions', dn['op'] == 'maximum'
          and comparison['absorption']['velocity']['logScale'] in dn['args']
          and comparison['absorption']['residual']['logScale'] in dn['args'])
        def one_plus_matches(actual, base):
            if nodes[base]['op'] == 'rational':
                return p(actual) == const(F(*map(int, nodes[base]['args']))+1)
            return p(actual, (base,)) == {(1,): F(1), (0,): F(1)}
        c('strict-first-J-plateau', one_plus_matches(dn['args'][2], cr['fixedCutoffLogScale']))
        c('strict-interior-common-domain', one_plus_matches(dn['args'][1], cr['commonLogQReciprocal']))
        c('exact-positive-neighborhood', nodes[cr['delta']]['op'] == 'exp'
          and p(nodes[cr['delta']]['args'][0], (cr['logDelta'],)) == {(1,): F(-1)})
        c('same-order-normalized-residual', comparison['normalizedResidualUpper'] == {'constantRoot': cr['totalConstant'], 'qExponent': N})
        c('unexecuted-source-premises-visible', not comparison['originalSourcePremisesAuthenticated']
          and not comparison['actualOriginalFiniteStageConstructed'] and not comparison['actualPositiveWindowIndicesEnumerated']
          and not comparison['numericOriginalHUsed'] and not comparison['numericStageIndexMaterialized']
          and not comparison['allFlatResidualsSummed'] and not comparison['wholeM3Complete'])
    if negative_controls:
        mutations = [
            ('omitted-cutoff-derivative-loss', lambda x: x['cases'][0]['program']['nodes'].__setitem__(x['cases'][0]['choice']['roots']['tailDerivativeLoss'], {'op': 'rational', 'args': ['0', '1']})),
            ('omitted-nonlinear-comparison-factor', lambda x: x['cases'][0]['program']['nodes'].__setitem__(x['cases'][0]['comparison']['roots']['differenceConstant'], {'op': 'rational', 'args': ['0', '1']})),
            ('different-flat-remainder-stage', lambda x: x['cases'][0]['comparison']['sameFixedStagePremises']['flatRemainder'].__setitem__('stageRoot', 0)),
            ('wrong-original-source-exponent', lambda x: x['cases'][0]['program']['parametersExactExpressions'].__setitem__('h', {'integer': 0})),
            ('omitted-logarithmic-power', lambda x: x['cases'][0]['comparison']['absorption']['velocity'].__setitem__('logPower', 0)),
            ('false-original-field-promotion', lambda x: x['cases'][0]['comparison'].__setitem__('actualOriginalFiniteStageConstructed', True))
        ]
        for name, mutate in mutations:
            wrong = copy.deepcopy(data)
            mutate(wrong)
            try:
                rejected = not independent(wrong, negative_controls=False)['pass']
            except (ValueError, KeyError, StopIteration):
                rejected = True
            check('independent-negative-'+name, rejected)
    return {'schema': 'MathScope.N6.IndependentOriginalFixedStageScalarAudit/1', 'arithmetic': 'Exact Fraction Laurent polynomials; h, J and the positive norm factors are formal operands.',
            'checkCount': len(checks), 'checks': checks, 'pass': all(x['pass'] for x in checks),
            'originalHNumericallySampled': False, 'originalSourceNormsEstablished': False, 'wholeM3Complete': False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--attempt', type=int, default=1)
    args = parser.parse_args()
    if args.attempt < 1:
        raise ValueError('Use a fresh positive attempt number.')
    out = ROOT/'research-ide/mathscope-m3/navier/evidence/source-fixed-stage-scalar-20261012'/f'attempt{args.attempt}'
    out.mkdir(parents=True, exist_ok=False)
    sources = source_files()
    before = [digest(p) for p in sources]
    write(out/'source-bytes-before.json', before)
    for path in sources:
        target = out/'sources'/path.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(path.read_bytes())
    env = dict(os.environ, M3_FIXED_STAGE_SCALAR_EVIDENCE=str(out/'fixed-stage-scalar.json'))
    command = ['node', '--max-old-space-size=384', '--test', '--test-reporter=tap', '--test-concurrency=1', PREFIX+'tests/source-fixed-stage-scalar.test.mjs']
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tick = time.monotonic()
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
        observed = independent(json.loads((out/'fixed-stage-scalar.json').read_text()))
    except Exception as error:
        observed = {'pass': False, 'checkCount': 0, 'checks': [], 'error': type(error).__name__+': '+str(error)}
    write(out/'independent-fraction.json', observed)
    after = [digest(p) for p in sources]
    write(out/'source-bytes.json', {'before': before, 'after': after, 'unchanged': before == after})
    def count(name):
        matches = re.findall(r'^# '+name+r' (\d+)$', stdout, re.M)
        return int(matches[-1]) if matches else None
    receipt = {'schema': 'MathScope.N6.OriginalFixedStageScalarObservedExecution/1', 'attempt': args.attempt,
               'startedAt': started, 'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'elapsedSeconds': elapsed,
               'command': command, 'exitCode': code, 'stoppedReason': stopped, 'timeoutSeconds': 60, 'v8OldSpaceMiB': 384,
               'nodeTests': {'passed': count('pass'), 'failed': count('fail'), 'skipped': count('skipped'), 'required': 8},
               'sourceFileCount': len(sources), 'sourceFilesUnchanged': before == after,
               'independentChecks': observed['checkCount'], 'independentPass': observed['pass'],
               'artifacts': [digest(p) for p in sorted(out.iterdir()) if p.is_file()],
               'originalSourceNormsEstablished': False, 'originalFinalFieldConstructed': False, 'originalCriterionAssessmentEdited': False,
               'wholeM3Complete': False, 'pass': code == 0 and stopped is None and count('pass') == 8 and count('fail') == 0
               and count('skipped') == 0 and before == after and observed['pass']}
    write(out/'receipt.json', receipt)
    print(json.dumps({'receipt': digest(out/'receipt.json'), 'nodeTests': receipt['nodeTests'], 'independentChecks': observed['checkCount'],
                      'failedIndependent': [x['id'] for x in observed['checks'] if not x['pass']], 'independentError': observed.get('error'),
                      'sourceFilesUnchanged': before == after, 'pass': receipt['pass']}, indent=2))
    raise SystemExit(0 if receipt['pass'] else 1)


if __name__ == '__main__':
    main()
