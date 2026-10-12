#!/usr/bin/env python3
"""Observe cheap independent original-core refinements and exact Fraction checks.

This gate executes the same original leading core at independent numerical
controls. Its exact checks do not claim a full N6 final-field construction,
a uniform spatial bound, a Fourier tail, or a new nonlinear fixed point.
"""
from datetime import datetime, timezone
from fractions import Fraction
from pathlib import Path
import hashlib
import json
import math
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'research-ide/mathscope-m3/navier'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def sources():
    seen = set()

    def visit(path):
        path = path.resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError('Source import escaped the repository')
        if path in seen:
            return
        raw = path.read_bytes()
        seen.add(path)
        if path.suffix in ['.mjs', '.js']:
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', raw.decode()):
                visit(path.parent / spec)
    for path in [BASE / 'source-core-refinement.mjs', BASE / 'tests/source-core-refinement.test.mjs', Path(__file__)]:
        visit(path)
    return [{'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size, 'sha256': sha(path.read_bytes())}
            for path in sorted(seen)]


def verify(result):
    checks = []

    def check(name, value):
        checks.append({'id': name, 'pass': bool(value)})

    def bounds(interval):
        return Fraction(interval['lower']), Fraction(interval['upper'])

    def encloses(interval, expected):
        lo, hi = bounds(interval)
        return lo <= expected[0] <= expected[1] <= hi

    def shifted_small(row, power, base):
        lo, hi = bounds(row)
        scale = Fraction(1, 1 << power)
        values = [Fraction(0), lo * scale, hi * scale]
        return base + min(values), base + max(values)

    check('fresh-core-only-status-and-original-parameter-binding',
          result['schema'] == 'MathScope.N8.ActualCoreRefinement/1'
          and result['freshCoreComparisonsExecuted'] is True
          and result['freshSourceConstructorExecuted'] is False
          and result['source']['parameterExpressionSHA256'] == 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152')
    check('independent-family-names', [family['axis'] for family in result['families']]
          == ['spatialGrid', 'comparisonDegree', 'arithmeticBits'])
    baseline = result['baseline']
    unique = {}
    for family in result['families']:
        for variant in family['variants']:
            control = variant['onlyChangedControl']
            suffix = family['axis'] + '-' + str(variant['level'])
            check('one-independent-control-' + suffix,
                  all(value == baseline['controls'][key] for key, value in variant['controls'].items() if key != control)
                  and variant['controls'][control] == variant['level'])
            grid = variant['controls']['grid']
            check('exact-nested-physical-grid-' + suffix,
                  [Fraction(row['request']['Y']) for row in variant['samples']]
                  == [Fraction(2 * grid + i, grid) for i in range(grid + 1)])
            for row in variant['samples']:
                key = (row['request']['Y'], row['request']['degree'], row['request']['bits'])
                if key in unique:
                    check('same-source-values-reused-' + suffix + '-' + key[0], unique[key] == row)
                unique[key] = row
            common = {row['request']['Y']: row for row in baseline['samples']}
            current = {row['request']['Y']: row for row in variant['samples']}
            for comparison in variant['comparisons']:
                coordinate, quantity = comparison['Y'], comparison['quantity']
                a = bounds(common[coordinate]['quantities'][quantity]['interval'])
                b = bounds(current[coordinate]['quantities'][quantity]['interval'])
                check('independent-interval-comparison-' + suffix + '-' + coordinate + '-' + quantity,
                      max(a[0], b[0]) <= min(a[1], b[1])
                      and Fraction(comparison['baselineWidth']) == a[1] - a[0]
                      and Fraction(comparison['currentWidth']) == b[1] - b[0]
                      and Fraction(comparison['widthReduction']) == a[1] - a[0] - b[1] + b[0])
    for key, row in unique.items():
        Y, N = Fraction(key[0]), key[1]
        suffix = key[0] + '-degree' + str(N) + '-bits' + str(key[2])
        chi = Fraction(4_000_000, 4_000_001)
        total = sum(((-chi * Y / 2) ** n / (math.factorial(n) * math.factorial(n + 1))
                     for n in range(N + 1)), Fraction(0))
        next_term = (-chi * Y / 2) ** (N + 1) / (math.factorial(N + 1) * math.factorial(N + 2))
        nonlinear = Fraction(29, 1 << (260 * 53)) / (1 - Y / 20)
        tail = Y ** (N + 1) / (math.factorial(N + 1) * math.factorial(N + 2)) / (1 - Y / ((N + 2) * (N + 3)))
        exact = min(total, total + next_term) - nonlinear, max(total, total + next_term) + nonlinear
        check('independent-finite-comparison-' + suffix, encloses(row['comparison']['polynomial'], (total, total)))
        check('positive-original-comparison-tail-and-nonlinear-error-' + suffix,
              Fraction(row['comparison']['radialCauchyTailUpper']) == tail >= abs(next_term) > 0
              and Fraction(row['comparison']['positiveNonlinearErrorUpper']) == nonlinear > 0)
        check('independent-nonlinear-Phi-enclosure-' + suffix,
              encloses(row['quantities']['azimuthalCore']['interval'], exact))
        axial = row['pressureAndAxial']
        u = shifted_small(axial['rows'][0]['uOverK'], 16640, 1)
        derivative = shifted_small(axial['rows'][1]['averageUCorrectionOverK'], 16380, 4)
        check('positive-source-axial-and-radial-scales-' + suffix,
              encloses(row['quantities']['axialOverJ0']['interval'], u)
              and encloses(row['quantities']['radialAverageDerivative']['interval'], (-derivative[1], -derivative[0])))
        check('original-pressure-and-nonlinear-errors-retained-' + suffix,
              row['request']['eta'] == {'kind': 'J_SCALED', 'value': '0'}
              and axial['pressure']['actualPressureErrorRetained'] is True
              and all(Fraction(item['positiveNonlinearErrorUpper']) > 0 for item in axial['rows'])
              and all(Fraction(item['analyticErrorUpper']) > 0 for item in axial['pressure']['derivatives']))
    check('reported-unique-original-core-evaluations', len(unique) == result['execution']['uniqueCoreEvaluations'])
    axes = result['adaptationAxes']
    check('uniform-Fourier-nonlinear-and-final-field-limits-retained',
          result['lastResolvedTau'] is None and axes['spatialGrid']['uniformInterpolationError'] is None
          and axes['fourierCutoff']['executed'] is False
          and axes['coefficientSeries']['actualNonlinearRecurrenceRecomputed'] is False
          and all(value is False for value in result['scope'].values()))
    return {'schema': 'MathScope.N8.CoreRefinementIndependentFraction/1',
            'status': 'PASS' if checks and all(row['pass'] for row in checks) else 'FAIL',
            'checks': checks, 'uniqueOriginalCoreEvaluations': len(unique),
            'newLeanExecuted': False, 'wholeN8ReconstructionComputed': False,
            'scope': 'Independent exact finite-series, error, positive-scale and comparison checks on fresh leading-core refinements. No uniform field, annular Fourier tail, final N6/N7 field, or new nonlinear recurrence proof is inferred.'}


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'[1-9][0-9]*', sys.argv[1]):
        raise SystemExit('Usage: run-core-refinement.py NEW_ATTEMPT_NUMBER')
    attempt = int(sys.argv[1])
    out = BASE / 'evidence/source-core-refinement-20261012' / ('attempt' + str(attempt))
    out.mkdir(parents=True, exist_ok=False)
    before = sources()
    started, start = datetime.now(timezone.utc).isoformat(), time.monotonic()
    code = "import {evaluateSourceCoreRefinement} from './research-ide/mathscope-m3/navier/source-core-refinement.mjs';process.stdout.write(JSON.stringify(await evaluateSourceCoreRefinement()));"
    command = ['node', '--input-type=module', '-e', code]
    run = subprocess.run(command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
    (out / 'core-refinement.json').write_bytes(run.stdout)
    (out / 'node.stderr').write_bytes(run.stderr)
    independent = {'status': 'NOT_RUN', 'checks': []}
    if run.returncode == 0:
        independent = verify(json.loads(run.stdout))
    write(out / 'independent-fraction.json', independent)
    after = sources()
    write(out / 'source-bytes.json', {'before': before, 'after': after, 'unchanged': before == after})
    artifacts = [out / name for name in ['core-refinement.json', 'node.stderr', 'independent-fraction.json', 'source-bytes.json']]
    receipt = {'schema': 'MathScope.N8.CoreRefinementObservedExecution/1', 'attempt': attempt,
               'startedAt': started, 'finishedAt': datetime.now(timezone.utc).isoformat(), 'elapsedSeconds': time.monotonic() - start,
               'command': command, 'exitCode': run.returncode, 'independentStatus': independent['status'],
               'independentCheckCount': len(independent['checks']), 'sourceFilesUnchanged': before == after, 'sourceFileCount': len(before),
               'artifacts': [{'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size, 'sha256': sha(path.read_bytes())} for path in artifacts],
               'freshCoreComparisonsExecuted': run.returncode == 0, 'freshSourceConstructorExecuted': False,
               'originalN805CriterionComplete': False, 'wholeN8ReconstructionComputed': False, 'newLeanExecuted': False,
               'pass': run.returncode == 0 and independent['status'] == 'PASS' and before == after}
    write(out / 'receipt.json', receipt)
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0 if receipt['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
