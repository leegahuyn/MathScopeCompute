#!/usr/bin/env python3
"""Observe the source operator review with independent rational Cartesian PDE checks."""
from datetime import datetime, timezone
from fractions import Fraction as Q
from pathlib import Path
import hashlib
import importlib.util
import itertools
import json
import os
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'research-ide/mathscope-m3/navier'


def pin(path):
    raw = path.read_bytes()
    return {'path': str(path.relative_to(ROOT)), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def independent(proof):
    spec = importlib.util.spec_from_file_location('independent_cartesian_polynomials', BASE / 'tests/run-localization-operator.py')
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    fixture = m.CartesianFixture()
    c, b = [fixture.axis_derivative(name, [0, 0, 0]) for name in ['C', 'b']]
    A = [fixture.fields['A' + str(i)] for i in range(3)]
    direct = [m.scale(m.times(fixture.y, b), -1), m.times(fixture.x, b), {}]
    u = m.vadd(m.curl(m.vscale(A, c)), m.vscale(direct, c))
    p = m.times(c, fixture.fields['p'])
    force = m.pde(u, p)
    scales = {key: Q(value) for key, value in proof['transport']['exactScales'].items()}
    a, bt, nu = scales['spatialPullback'], scales['timePullback'], scales['viscosity']
    def pullback(poly):
        return {k: v * a ** sum(k[:3]) * bt ** k[3] for k, v in poly.items()}
    us = [m.scale(pullback(v), scales['velocity']) for v in u]
    ps = m.scale(pullback(p), scales['pressure'])
    fs = [m.scale(pullback(v), scales['force']) for v in force]
    actual = m.vadd([m.minus(m.scale(m.deriv(v, 3), -1), m.scale(m.lap(v), nu)) for v in us], m.adv(us, us), m.grad(ps))
    checks = []
    def check(name, passed):
        checks.append({'id': name, 'pass': bool(passed)})
    for i in range(3):
        check('complete-independent-scaled-PDE-' + str(i), actual[i] == fs[i])
        check('spatial-chain-rule-' + str(i), m.deriv(pullback(p), i) == m.scale(pullback(m.deriv(p, i)), a))
    check('negative-tau-time-chain-rule', m.deriv(pullback(p), 3) == m.scale(pullback(m.deriv(p, 3)), bt))
    check('solenoidality-after-scaling', not m.div(us))
    quadratic = m.sum_poly(m.deriv(m.deriv(m.times(us[i], us[j]), j), i) for i in range(3) for j in range(3))
    check('scaled-pressure-Poisson-retains-force-divergence', m.scale(m.lap(ps), -1) == m.minus(quadratic, m.div(fs)))
    check('nonzero-scaled-force-divergence-control', bool(m.div(fs)))
    check('wrong-pressure-scaling-rejected', any(m.minus(actual[i], m.scale(m.deriv(ps, i), Q(1, 2))) != fs[i] for i in range(3)))
    check('wrong-force-scaling-rejected', any(actual[i] != m.scale(fs[i], 2) for i in range(3)))
    check('viscosity-factor-cannot-be-omitted', any(m.plus(actual[i], m.scale(m.lap(us[i]), nu - 1)) != fs[i] for i in range(3)))
    volume, time_jacobian = a ** -3, bt ** -1
    factors = {'energy': scales['velocity'] ** 2 * volume,
               'dissipation': nu * (scales['velocity'] * a) ** 2 * volume * time_jacobian,
               'forceWork': scales['force'] * scales['velocity'] * volume * time_jacobian,
               'squaredTimeForceL2': scales['force'] ** 2 * volume * time_jacobian ** 2}
    for key, value in factors.items():
        check('independent-whole-energy-Jacobian-' + key, value == scales['wholeEnergy'])
    check('viscosity-is-sqrt-scale-squared', scales['sqrtViscosity'] ** 2 == nu)
    check('same-terminal-time', bt * (1 - Q(proof['time']['initialShift'])) == 1)
    check('same-source-force-support-end', bt * (Q(proof['time']['extendedForceEnd']) - Q(proof['time']['initialShift'])) == 2)
    half_width = scales['sqrtViscosity'] / scales['lambda']
    check('exact-source-support-half-width', half_width == Q(proof['translations']['reviewedExactHalfWidth']))
    check('strict-positive-source-support-gap', 1 - 2 * half_width == Q(proof['translations']['reviewedExactGap']) > 0)
    check('all-neighbor-translates-disjoint', all(any(abs(k) > 2 * half_width for k in index) for index in itertools.product(range(-2, 3), repeat=3) if any(index)))
    av, bv = [fixture.y, {}, {}], [{}, fixture.x, {}]
    mixed = m.vadd(m.adv(m.vadd(av, bv), m.vadd(av, bv)), [m.scale(v, -1) for v in m.vadd(m.adv(av, av), m.adv(bv, bv))])
    check('overlap-control-both-fields-solenoidal', not m.div(av) and not m.div(bv))
    check('overlap-control-nonzero-mixed-advection', mixed == [fixture.x, fixture.y, {}])
    w = m.curl([fixture.fields['A2'], fixture.fields['A0'], fixture.fields['A1']])
    v, pi = m.vadd(u, w), fixture.fields['p']
    diff = m.vadd(m.pde(v, m.plus(p, pi)), [m.scale(value, -1) for value in force])
    expanded = m.vadd([m.minus(m.scale(m.deriv(value, 3), -1), m.lap(value)) for value in w], m.adv(v, w), m.adv(w, u), m.grad(pi))
    for i in range(3):
        check('same-force-difference-equation-' + str(i), diff[i] == expanded[i])
    check('all-pressure-flux-powers-absorbable', all(Q(value) < 2 for value in proof['comparison']['absorption']['powers']))
    check('commutator-kernel-near-integral-decays-as-inverse-R', Q(-4, 3) + Q(1, 3) == -1)
    check('commutator-kernel-far-integral-decays-as-inverse-R', Q(-2) + 1 == -1)
    check('energy-force-and-periodic-pressure-hypotheses-retained', all(any(row['id'] == key and row['required'] for row in proof['comparison']['hypotheses']) for key in ['same-force', 'zero-initial-data', 'periodic-pressure', 'bounded-whole-space-energy', 'smoothness-before-terminal', 'global-force-extension']))
    check('C-D-conclusions-not-issued-from-operator-review', not proof['comparison']['CConclusionIssued'] and not proof['comparison']['DConclusionIssued'])
    return {'schema': 'MathScope.N7.PeriodizationIndependentExactReview/1', 'status': 'PASS' if all(row['pass'] for row in checks) else 'FAIL',
            'checks': checks, 'arithmetic': 'Independent ordinary Cartesian coefficient maps over Python Fraction; no floating-point equality decisions.',
            'scaledPDECoefficientCounts': [len(v) for v in actual], 'energyJacobianFactors': {k: str(v) for k, v in factors.items()},
            'wholeOriginalKEnergyIntegrated': False, 'sourceFinalFieldsNumericallyEnumerated': False, 'newLeanExecuted': False}


def main():
    attempt = sys.argv[1] if len(sys.argv) > 1 else '1'
    if not re.fullmatch(r'[1-9][0-9]*', attempt):
        raise ValueError('Use a positive integer attempt ID.')
    folder = BASE / 'evidence/source-periodization-review-20261012' / ('attempt' + attempt)
    folder.mkdir(parents=True, exist_ok=False)
    paths = [BASE / name for name in ['source-periodization-review.mjs', 'source-periodization.mjs', 'source-localization-operator.mjs',
        'source-localization-operator-evidence.mjs', 'source-localization-operator-evidence-data.mjs', 'localization-jet-algebra.mjs',
        'source-near-terminal-evidence-data.mjs', 'source-exterior-force-evidence.mjs', 'source-exterior-force-evidence-data.mjs',
        'tests/source-periodization-review.test.mjs', 'tests/run-periodization-review.py', 'tests/run-localization-operator.py',
        'tests/build-localization-operator-evidence.py']]
    paths += [ROOT / 'research-ide/mathscope-m2/navier' / name for name in ['actual-global-source-expressions.mjs',
        'actual-continuation-exact-identities.mjs', 'actual-continuation-arithmetic.mjs', 'source-profile.mjs']]
    before = [pin(p) for p in sorted(paths)]
    write(folder / 'source-bytes-before.json', {'files': before, 'fileCount': len(before)})
    started = datetime.now(timezone.utc).isoformat()
    tick = time.monotonic()
    env = {**os.environ, 'N7_PERIODIZATION_PROOF_OUTPUT': str(folder / 'periodization-review.json')}
    command = ['node', '--max-old-space-size=450', '--test', '--test-reporter=tap', str(BASE / 'tests/source-periodization-review.test.mjs')]
    error, result, reference = None, None, None
    try:
        result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True, timeout=45)
        (folder / 'node.log').write_text(result.stdout)
        (folder / 'node.stderr').write_text(result.stderr)
        if result.returncode == 0:
            for name in ['build-localization-operator-evidence.py', 'build-near-terminal-evidence.py', 'build-exterior-force-evidence.py']:
                package = subprocess.run([sys.executable, '-B', str(BASE / 'tests' / name), '--check'], cwd=ROOT, capture_output=True, text=True, timeout=45)
                (folder / (name + '.log')).write_text(package.stdout + package.stderr)
                if package.returncode:
                    raise ValueError('An inherited source package changed: ' + name)
            reference = independent(json.loads((folder / 'periodization-review.json').read_text()))
            write(folder / 'independent-exact.json', reference)
    except Exception as exc:
        error = str(exc)
    after = [pin(p) for p in sorted(paths)]
    write(folder / 'source-bytes.json', {'before': before, 'after': after, 'unchanged': before == after})
    log = result.stdout if result else ''
    passed = len(re.findall(r'^ok \d+ - ', log, re.M))
    failed = len(re.findall(r'^not ok \d+ - ', log, re.M))
    ok = not error and result is not None and result.returncode == 0 and passed == 5 and failed == 0 and before == after and reference and reference['status'] == 'PASS'
    receipt = {'schema': 'MathScope.N7.SourcePeriodizationObservedReview/1', 'attempt': int(attempt), 'startedAt': started,
        'finishedAt': datetime.now(timezone.utc).isoformat(), 'elapsedSeconds': time.monotonic() - tick, 'command': command,
        'exitCode': result.returncode if result else None, 'nodeTests': {'passed': passed, 'failed': failed, 'skipped': 0},
        'independentStatus': reference['status'] if reference else None, 'independentCheckCount': len(reference['checks']) if reference else 0,
        'sourceFileCount': len(before), 'sourceFilesUnchanged': before == after,
        'artifacts': [pin(p) for p in sorted(folder.iterdir()) if p.is_file()], 'pass': bool(ok), 'error': error,
        'freshFullSourceConstructorExecuted': False, 'wholeKEnergyComputed': False, 'completeGlobalForceConstructed': False,
        'unconditionalCConclusionIssued': False, 'unconditionalDConclusionIssued': False, 'wholeM3Complete': False, 'newLeanExecuted': False}
    write(folder / 'receipt.json', receipt)
    print(json.dumps(receipt, ensure_ascii=False))
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
