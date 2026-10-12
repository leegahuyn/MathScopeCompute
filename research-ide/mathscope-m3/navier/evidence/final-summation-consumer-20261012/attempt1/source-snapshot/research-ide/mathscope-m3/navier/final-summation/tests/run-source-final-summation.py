#!/usr/bin/env python3
"""Independent finite-window/curl/cutoff check; original norm premises stay open."""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal as D, localcontext
from math import comb, factorial
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
    data = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}


def source_files():
    seen = set()

    def visit(path):
        if path in seen:
            return
        if not path.is_relative_to(ROOT):
            raise ValueError('An imported source escaped the repository.')
        seen.add(path)
        for name in re.findall(r'''(?:from\s*|import\s*)["']([^"']+)["']''', path.read_text()):
            if name.startswith('.'):
                visit((path.parent/name).resolve())
    visit(ROOT/PREFIX/'tests/source-final-summation.test.mjs')
    seen.add(Path(__file__).resolve())
    return sorted(seen)


def independent(data):
    checks = []

    def check(name, condition):
        checks.append({'id': name, 'pass': bool(condition)})

    thresholds = list(data['thresholds'])
    for schedule_index, schedule in enumerate([data['example']['plan']['schedule'], *data['variedSchedules']]):
        previous = F(schedule['logQ0Reciprocal'])
        for row in schedule['stages']:
            j = row['stage']
            check(f'schedule-{schedule_index}-all-orders-{j}', [x['order'] for x in row['thresholds']] == list(range(j+1)))
            expected = max(F(1), previous+1, F(schedule['logQ0Reciprocal'])+1,
                           *(max(F(1), (2*x['logPower']/F(x['gain']))**2,
                                 2*(F(x['constant'])+j)/F(x['gain'])) for x in row['thresholds']))
            check(f'schedule-{schedule_index}-exact-scale-{j}', F(row['logScale']) == expected and
                  F(row['doublingLogGap']) == expected-previous and expected-previous >= 1)
            check(f'schedule-{schedule_index}-half-source-gain-{j}',
                  all(F(x['gain']) == F(row['gain'])/2 for x in row['thresholds']))
            thresholds.extend(row['thresholds'])
            previous = expected
        check(f'schedule-{schedule_index}-majorants-remain-premises', not schedule['sourceAuthenticated'] and
              not schedule['actualSourceCoefficientBoundsVerified'] and schedule['callerMajorantsArePremisesOnly'])

    for index, row in enumerate(thresholds):
        c, p, g, j, threshold = F(row['constant']), row['logPower'], F(row['gain']), row['stage'], F(row['logReciprocalThreshold'])
        expected = max(F(1), (2*p/g)**2, 2*(c+j)/g)
        check(f'fraction-threshold-{index}', threshold == expected and g*g*threshold >= 4*p*p and g*threshold/2 >= c+j)
        # Log-space evaluations are independent high-precision diagnostics;
        # exact inequalities above carry the all-q threshold proof.
        with localcontext() as ctx:
            ctx.prec = 80
            dec = lambda x: D(x.numerator)/D(x.denominator)
            for factor in [1, 2, 10]:
                x = dec(threshold)*factor
                log_bound = dec(c).ln()+D(p)*(1+x).ln()-dec(g)*x
                check(f'decimal-log-bound-{index}-{factor}', log_bound <= -D(j)*D(2).ln())

    example, plan = data['example'], data['example']['plan']
    low, high = map(F, plan['window']['logQReciprocal'])
    active = [row['stage'] for row in plan['schedule']['stages'] if F(row['logScale']) < high]
    first_zero = next((row['stage'] for row in plan['schedule']['stages'] if F(row['logScale']) >= high), None)
    check('independent-complete-active-set', plan['requiredIncrementIndices'] == active and plan['firstExcludedIndex'] == first_zero)
    check('independent-inactive-future-window', first_zero is not None and
          plan['omittedFutureCutoffTerms']['firstIndex'] == first_zero and plan['omittedFutureCutoffTerms']['identicallyZero'])
    for row in plan['window']['classifications']:
        check('exact-classification-'+str(row['stage']), row['zero'] == (F(row['logScale']) >= high) and
              row['plateau'] == (low >= F(row['logScale'])+1))

    nodes = example['program']['nodes']
    for identity in example['result']['checks']:
        for node_id in identity['identicalPiecewiseBranchReductions']:
            node = nodes[node_id]
            check(f'exact-piecewise-branch-reduction-{identity["id"]}-{node_id}',
                  node['op'] == 'smooth_piecewise' and node['args'][3] == node['args'][4] == node['args'][5])

    omitted_commutator_detected = False
    uncut_pressure_detected = False
    with localcontext() as ctx:
        ctx.prec = 80
        scale = D(2).exp()
        for index, point in enumerate(example['points']):
            x, y, z, t = (D(str(point['coordinates'][key])) for key in ['x', 'y', 'z', 't'])
            q = z*z+1-t
            argument = scale*q
            if argument <= D('0.5'):
                cutoff, derivative = D(1), D(0)
            elif argument >= 1:
                cutoff, derivative = D(0), D(0)
            else:
                u = 2*argument-1
                left, right = (-1/u).exp(), (-1/(1-u)).exp()
                cutoff = right/(left+right)
                derivative = -2*left*right*(1/u**2+1/(1-u)**2)/(left+right)**2
            b = x*x+y*y+z+t*t
            unit = [1-2*x*z-y*b, y-2*x*t+x*b, z*z-z]
            comm = [-6*z*scale*derivative*x*z*z, 6*z*scale*derivative*y*z, D(0)]
            expected = {'q': q, 'transitionCutoff': cutoff, 'pressure': (3+3*cutoff)*(x*y*z+t*t)}
            for component in range(3):
                expected['velocity_'+str(component)] = (3+3*cutoff)*unit[component]+comm[component]
                expected['uncut_'+str(component)] = 3*unit[component]
                expected['difference_'+str(component)] = 3*cutoff*unit[component]+comm[component]
                expected['commutator_'+str(component)] = comm[component]
            for name, value in expected.items():
                actual = D(str(point['values'][name]['value']))
                check(f'independent-full-curl-value-{index}-{name}', abs(actual-value) <= D('2e-10')*(1+abs(value)))
            omitted_commutator_detected |= max(map(abs, comm)) > D('0.01')
            uncut_pressure_detected |= abs(expected['pressure']-6*(x*y*z+t*t)) > D('0.01')
    check('negative-control-omitting-transition-curl-fails', omitted_commutator_detected)
    check('negative-control-omitting-pressure-cutoff-fails', uncut_pressure_detected)

    comparison = data['comparison']
    m, j = comparison['derivativeOrder'], comparison['fixedStage']
    c = 6*2**m
    coefficient = F(c, 2**j)*F(5, 2)+F(1, 2)+F(comparison['onlyFlatRemainderPremise']['constant'])
    check('single-fixed-stage-exact-nonlinear-constant', F(comparison['exactNSDifferenceConstant']) == c and
          F(comparison['normalizedResidualUpper']['coefficient']) == coefficient == F(131, 28))
    check('one-fixed-flat-remainder-is-retained', all(comparison[key]['stage'] == j for key in
          ['fixedStateBoundPremise', 'fixedResidualBoundPremise', 'onlyFlatRemainderPremise']) and
          F(comparison['onlyFlatRemainderPremise']['constant']) > 0 and not comparison['allFlatResidualsSummed'])
    check('finite-state-advection-derivative-premise-retained', comparison['fixedStateBoundPremise']['derivativeOrder'] >= m+1)
    # Independent combinatorial proof of the Cartesian derivative bound:
    # sum_{beta<=alpha} binomial(alpha,beta)=2^|alpha|. There are three
    # transport directions for each product and five linear derivatives.
    for order in range(9):
        for a in range(order+1):
            for b in range(order-a+1):
                for d in range(order-a-b+1):
                    alpha = (a, b, d, order-a-b-d)
                    total = 1
                    for n in alpha:
                        total *= sum(comb(n, k) for k in range(n+1))
                    check('all-multi-index-product-constant-'+','.join(map(str, alpha)),
                          total == 2**order and 5 <= 6*2**order and 3*total <= 6*2**order)
    check('no-original-source-authority-from-generic-fixtures', not data['sourceNormsAuthenticated'] and
          not data['actualOriginalFinalFieldConstructed'] and not data['originalCriterionPromoted'] and
          not data['wholeM3Complete'] and not comparison['allOriginalSourcePremisesAuthenticated'])
    return {'schema': 'MathScope.N6.IndependentFinalSummationConsumerChecks/1',
            'arithmetic': 'Python exact Fraction and independent 80-digit Decimal analytic cutoff/curl formulas',
            'checkCount': len(checks), 'checks': checks, 'pass': all(row['pass'] for row in checks),
            'originalSourceNormsProved': False, 'numericalDiagnosticsAreIntervalCertificates': False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--attempt', type=int, default=1)
    args = parser.parse_args()
    if args.attempt < 1:
        raise ValueError('Use a fresh positive attempt number.')
    output = ROOT/'research-ide/mathscope-m3/navier/evidence/final-summation-consumer-20261012'/f'attempt{args.attempt}'
    output.mkdir(parents=True, exist_ok=False)
    sources = source_files()
    before = [digest(path) for path in sources]
    write(output/'source-bytes-before.json', before)
    for source in sources:
        target = output/'source-snapshot'/source.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source.read_bytes())
    env = os.environ.copy()
    env['MATHSCOPE_FINAL_SUMMATION_ARTIFACT'] = str(output/'final-summation-consumer.json')
    command = ['node', '--max-old-space-size=768', '--test', '--test-reporter=tap', '--test-concurrency=1',
               PREFIX+'tests/source-final-summation.test.mjs']
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tick = time.monotonic()
    result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True, timeout=60)
    elapsed = time.monotonic()-tick
    (output/'node.log').write_text(result.stdout)
    (output/'node.stderr').write_text(result.stderr)
    artifact = output/'final-summation-consumer.json'
    observed = independent(json.loads(artifact.read_text())) if artifact.exists() else {'pass': False, 'checkCount': 0, 'checks': []}
    write(output/'independent-fraction-decimal.json', observed)
    after = [digest(path) for path in sources]
    write(output/'source-bytes.json', {'before': before, 'after': after, 'unchanged': before == after})
    def count(key):
        match = re.search(r'^# '+key+r' (\d+)$', result.stdout, re.MULTILINE)
        return int(match[1]) if match else None
    receipt = {'schema': 'MathScope.N6.ObservedFinalSummationConsumerGate/1', 'attempt': args.attempt,
               'startedAt': started, 'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'elapsedSeconds': elapsed, 'command': command, 'exitCode': result.returncode, 'timeoutSeconds': 60,
               'nodeTests': {'passed': count('pass'), 'failed': count('fail'), 'skipped': count('skipped')},
               'sourceFilesUnchanged': before == after, 'sourceFileCount': len(sources),
               'independentCheckCount': observed['checkCount'], 'independentPass': observed['pass'],
               'artifacts': [digest(path) for path in sorted(output.iterdir()) if path.is_file()],
               'sourceNormsAuthenticated': False, 'actualOriginalFinalFieldConstructed': False,
               'originalCriterionAssessmentEdited': False, 'wholeM3Complete': False,
               'pass': result.returncode == 0 and before == after and observed['pass']}
    write(output/'receipt.json', receipt)
    print(json.dumps({'receipt': digest(output/'receipt.json'), 'nodeTests': receipt['nodeTests'],
                      'independentChecks': observed['checkCount'], 'failedIndependentChecks': [r['id'] for r in observed['checks'] if not r['pass']],
                      'pass': receipt['pass']}, indent=2))
    raise SystemExit(0 if receipt['pass'] else 1)


if __name__ == '__main__':
    main()
