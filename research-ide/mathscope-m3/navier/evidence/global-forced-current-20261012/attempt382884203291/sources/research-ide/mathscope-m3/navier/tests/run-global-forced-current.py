#!/usr/bin/env python3
"""Observed actual source forced-angular construction, without rewriting history.

The complete source pipeline and an independent exact Q(sqrt(2)) Laurent
polynomial audit are both required. A retained source formula is not a
numerical field enclosure or the unexecuted all-order iteration proof.
"""
from __future__ import annotations

from datetime import datetime, timezone
from fractions import Fraction as Q
import hashlib
import json
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
MAX_RSS = 13 * 1024**3 // 2
MAX_AS = 7 * 1024**3
TIMEOUT = 2100
TEST_COUNT = 58
TESTS = ['coupled-expressions.test.mjs', 'coupled-derivative-closure.test.mjs',
         'mapped-forced-curl-kernel.test.mjs', 'initialized-angular-lift-kernel.test.mjs', 'initialized-angular-update-kernel.test.mjs',
         'quadratic-source-identity.test.mjs', 'forced-current-kernel.test.mjs',
         'angular-coefficient-bodies.test.mjs', 'exact-stage-snapshot.test.mjs',
         'updated-mean-stress-kernel.test.mjs', 'global-source-forced-current.test.mjs']
OWNED = ['source-coupled-expressions.mjs', 'source-coupled-derivative-closure.mjs',
         'source-quadratic-identity.mjs', 'source-initialized-angular.mjs',
         'source-angular-update-verification.mjs', 'source-angular-coefficient-bodies.mjs',
         'source-global-forced-current.mjs', 'source-mapped-forced-curl.mjs',
         'source-global-updated-mean-stress.mjs', 'source-updated-mean-stress.mjs',
         'source-fixed-mean-majorants.mjs', 'source-initialized-mean-majorants.mjs']
SOURCES = [BASE / p for p in OWNED] + [BASE / 'tests' / p for p in TESTS] + [Path(__file__).resolve()]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def row(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': digest(path), 'bytes': path.stat().st_size}


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def source_paths():
    seen = set()

    def visit(path):
        path = path.resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise ValueError('Every retained source import must be an existing repository file.')
        if path in seen:
            return
        seen.add(path)
        if path.suffix in ['.mjs', '.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', path.read_text()):
                visit(path.parent / ref)

    for path in SOURCES:
        visit(path)
    return sorted(seen)


# This algebra is independent of the JS expression graph, its rewrite
# rules and both JS rational verifiers. No floating point occurs here.
ZERO, ONE, RADICAL = (Q(0), Q(0)), (Q(1), Q(0)), (Q(0), Q(1))


def zadd(*xs):
    return sum((x[0] for x in xs), Q(0)), sum((x[1] for x in xs), Q(0))


def zneg(x):
    return -x[0], -x[1]


def zmul(x, y):
    return x[0]*y[0]+2*x[1]*y[1], x[0]*y[1]+x[1]*y[0]


def zinv(x):
    norm = x[0]**2 - 2*x[1]**2
    if not norm:
        raise ZeroDivisionError('A retained exact quadratic denominator is zero.')
    return x[0]/norm, -x[1]/norm


def zpow(x, n):
    if n < 0:
        return zpow(zinv(x), -n)
    value = ONE
    for _ in range(n):
        value = zmul(value, x)
    return value


VARS = ['Y0', 'Y1', 'w', 'r0', 'ci', 'center0', 'center1', 'copy0', 'copy1']
EXP0 = (0,) * len(VARS)


def constant(c):
    c = c if isinstance(c, tuple) else (Q(c), Q(0))
    return {} if c == ZERO else {EXP0: c}


def variable(i, power=1):
    exponents = list(EXP0)
    exponents[i] = power
    return {tuple(exponents): ONE}


def add(*ps):
    result = {}
    for p in ps:
        for exponent, coefficient in p.items():
            value = zadd(result.get(exponent, ZERO), coefficient)
            if value == ZERO:
                result.pop(exponent, None)
            else:
                result[exponent] = value
    return result


def scale(p, c):
    c = c if isinstance(c, tuple) else (Q(c), Q(0))
    return {e: value for e, coefficient in p.items() if (value := zmul(coefficient, c)) != ZERO}


def mul(*ps):
    result = constant(1)
    for p in ps:
        next_value = {}
        for e, c in result.items():
            for f, d in p.items():
                power = tuple(a+b for a, b in zip(e, f))
                value = zadd(next_value.get(power, ZERO), zmul(c, d))
                if value == ZERO:
                    next_value.pop(power, None)
                else:
                    next_value[power] = value
        result = next_value
    return result


def power(p, n):
    if n < 0:
        if len(p) != 1:
            raise ValueError('Only an actual nonzero Laurent monomial may have a negative power.')
        e, c = next(iter(p.items()))
        return {tuple(n*j for j in e): zpow(c, n)}
    result = constant(1)
    for _ in range(n):
        result = mul(result, p)
    return result


def derivative(p, i):
    result = {}
    for e, c in p.items():
        if e[i]:
            exponent = list(e)
            exponent[i] -= 1
            result[tuple(exponent)] = zmul(c, (Q(e[i]), Q(0)))
    return result


def substitute(p, mapping):
    return add(*(mul(constant(c), *(power(mapping.get(i, variable(i)), exponent)
                                    for i, exponent in enumerate(e) if exponent)) for e, c in p.items()))


def normalized(p):
    return [{'powers': list(e), 'a': str(c[0]), 'b': str(c[1])} for e, c in sorted(p.items())]


def independent(certificate=None):
    checks, branch_rows = [], []

    def check(name, value, **extra):
        checks.append({'id': name, 'pass': bool(value), **extra})

    vr = [ONE, (Q(1), Q(-1))]
    vt = [(Q(-1), Q(1)), ONE]
    D = Q(4), Q(-2)
    lam, tg = (Q(4), Q(-1)), (Q(4), Q(1))
    dot = lambda a, b: zadd(*(zmul(x, y) for x, y in zip(a, b)))
    check('original-orthogonal-equal-length-basis', dot(vr, vt) == ZERO and dot(vr, vr) == D and dot(vt, vt) == D)
    check('original-positive-quadratic-norm-product', zmul(lam, tg) == (Q(14), Q(0)))
    check('original-literal-radical-square', zmul(RADICAL, RADICAL) == (Q(2), Q(0)))
    J = [[1, 0], [0, 1]]
    matrices = []
    Y, w, r0, ci = [variable(0), variable(1)], variable(2), variable(3), variable(4)
    c, k = [variable(5), variable(6)], [variable(7), variable(8)]
    for delta in range(5):
        matrices.append([[str(v) for v in r] for r in J])
        left_r = [zadd(*(zmul(vr[i], (Q(J[i][j]), Q(0))) for i in range(2))) for j in range(2)]
        left_t = [zadd(*(zmul(vt[i], (Q(J[i][j]), Q(0))) for i in range(2))) for j in range(2)]
        check(f'whole-integer-cover-determinant-{delta}', J[0][0]*J[1][1]-J[0][1]*J[1][0] == 14**delta)
        check(f'exact-radial-eigen-row-{delta}', left_r == [zmul(zpow(lam, delta), x) for x in vr])
        check(f'exact-time-eigen-row-{delta}', left_t == [zmul(zpow(tg, delta), x) for x in vt])
        offset = [add(*(scale(Y[j], J[i][j]) for j in range(2)), scale(c[i], -1), scale(k[i], -1)) for i in range(2)]
        xi = scale(add(*(scale(offset[i], vr[i]) for i in range(2))), zinv(D))
        eta = scale(add(*(scale(offset[i], vt[i]) for i in range(2))), zinv(D))
        pulse = mul(add(eta, r0), variable(4, -1))
        Hw = [add(Y[i], scale(mul(ci, add(w, scale(pulse, -1))), zmul(vt[i], zpow(tg, -delta)))) for i in range(2)]
        pulse_at = substitute(pulse, {0: Hw[0], 1: Hw[1]})
        xi_at = substitute(xi, {0: Hw[0], 1: Hw[1]})
        check(f'full-symbolic-pulse-Hw-identity-{delta}', pulse_at == w)
        check(f'full-symbolic-transverse-Hw-identity-{delta}', xi_at == xi)
        jac = [[derivative(Hw[i], j) for j in range(2)] for i in range(2)]
        for i in range(2):
            for j in range(2):
                expected = zadd(ONE if i == j else ZERO, zneg(zmul(vt[i], zmul(vt[j], zinv(D)))))
                check(f'whole-Hw-Jacobian-{delta}-{i}-{j}', jac[i][j] == constant(expected))
            check(f'full-N-basepoint-zero-{delta}-{i}', not add(*(scale(jac[i][j], vt[j]) for j in range(2))))
        N = lambda p: add(*(scale(derivative(p, j), vt[j]) for j in range(2)))
        L = lambda p: add(*(scale(derivative(p, j), vr[j]) for j in range(2)))
        check(f'own-original-normalized-time-one-{delta}', scale(mul(ci, N(pulse)), zpow(tg, -delta)) == constant(1))
        check(f'own-original-radial-fast-factor-{delta}', scale(L(xi), zpow(lam, -delta)) == constant(1))
        # A nonconstant complete coefficient with every source label left
        # symbolic. Its entire polynomial follows H_w; no sample proves it.
        F = add(mul(power(Y[0], 2), Y[1]), scale(mul(Y[0], power(Y[1], 2)), 3),
                scale(mul(r0, Y[0]), 2), mul(ci, Y[1]))
        pulled = substitute(F, {0: Hw[0], 1: Hw[1]})
        check(f'nonconstant-whole-source-Hw-invariant-{delta}', bool(pulled) and not N(pulled))
        check(f'wrong-only-pulse-replacement-control-{delta}', bool(N(F)))
        wrong = [add(Y[i], scale(mul(ci, add(w, scale(pulse, -1))), vt[i])) for i in range(2)]
        if delta:
            check(f'omitted-time-cover-factor-negative-{delta}', substitute(pulse, {0: wrong[0], 1: wrong[1]}) != w)
            check(f'omitted-radial-cover-factor-negative-{delta}', L(xi) != constant(1))
        branch_rows.append({'delta': delta, 'matrix': matrices[-1], 'wholePulsePolynomial': normalized(pulse),
                            'wholeHwPolynomials': [normalized(p) for p in Hw],
                            'nonconstantPulledSourcePolynomial': normalized(pulled),
                            'allCenterCopyAndSourceScaleParametersSymbolic': True})
        J = [[3*J[i][0]+J[i][1], J[i][0]+5*J[i][1]] for i in range(2)]
    modes = [-2, -1, 1, 2]
    state = [0] + modes
    generated = sorted(set(state + [m+n for m in state for n in state]))
    check('complete-next-finite-mode-inventory', generated == list(range(-4, 5)))
    check('third-harmonics-require-distinct-current-modes', {(m, n) for m in modes for n in modes if m+n == 3} == {(1, 2), (2, 1)})
    check('fourth-harmonic-retains-second-mode-square', [(m, n) for m in modes for n in modes if m+n == 4] == [(2, 2)])
    check('all-four-full-covariance-pairs', [(m, n) for m in modes for n in modes if m+n == 0] == [(-2, 2), (-1, 1), (1, -1), (2, -2)])
    if certificate is not None:
        check('actual-source-all-ten-fixed-lift-bindings', len(certificate['templates']) == 10)
        for t in certificate['templates']:
            tag = t['key']
            check('actual-source-complete-cover-matrices-'+tag, t['lift']['matrix']['matrices'] == matrices)
            check('actual-source-all-current-input-modes-'+tag, [r['m'] for r in t['originalSourceRows']] == modes)
            check('actual-source-all-next-generated-modes-'+tag, [r['m'] for r in t['waveResidual']] == generated)
            check('actual-source-no-finite-mode-discard-'+tag, t['sourceFiniteInventory']['discarded'] == [])
            for f in t['forced']:
                m = f['m']
                check(f'actual-full-negative-conjugate-pressure-{tag}-{m}', [s['m'] for s in f['signedSolutions']] == [m, -m]
                      and all(x['pass'] for x in f['signedSolutions'][1]['checks']))
                check(f'actual-source-pulse-normalization-{tag}-{m}', f['path']['levelDifference'] == t['levelDifference']
                      and all(x['pass'] for x in f['path']['checks']) and not f['path']['preimagesIdentified'])
        check('actual-source-all162-covariance-and-residual', certificate['assembly']['signedSourceContributions'] == 162
              and certificate['assembly']['allOriginalSourceLabels'] == 81)
        check('actual-source-limits-not-replaced-by-samples', not certificate['scope']['numericalWholeFieldEnclosure']
              and not certificate['scope']['sourceDerivativeClosureAudited'] and not certificate['scope']['originalProp9_5ClassBoundsEstablished']
              and not certificate['scope']['initializedJ0'] and not certificate['scope']['originalN602Complete'] and not certificate['scope']['completeN6'])
    return {'schema': 'MathScope.N6.IndependentOriginalForcedCurrentGeometry/1',
            'arithmetic': 'Exact Python Fraction pairs in Q(sqrt(2)); full nine-variable Laurent polynomial coefficient equality.',
            'variables': VARS, 'branches': branch_rows, 'checks': checks, 'checkCount': len(checks),
            'actualSourceCertificateBound': certificate is not None, 'floatingPointUsed': False,
            'allOrderSourceClassOrNumericalEnclosureProved': False, 'pass': all(x['pass'] for x in checks)}


def family_memory(pid):
    pending, seen, rss, maximum_as = [pid], set(), 0, 0
    while pending:
        here = pending.pop()
        if here in seen:
            continue
        seen.add(here)
        try:
            status = Path(f'/proc/{here}/status').read_text()
            r = re.search(r'^VmRSS:\s+(\d+) kB$', status, re.M)
            a = re.search(r'^VmSize:\s+(\d+) kB$', status, re.M)
            rss += int(r[1])*1024 if r else 0
            maximum_as = max(maximum_as, int(a[1])*1024 if a else 0)
            pending.extend(int(v) for v in Path(f'/proc/{here}/task/{here}/children').read_text().split())
        except (FileNotFoundError, ProcessLookupError):
            pass
    return rss, maximum_as


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'[1-9][0-9]*', sys.argv[1]):
        raise SystemExit('Usage: run-global-forced-current.py NEW_ATTEMPT_NUMBER')
    attempt = int(sys.argv[1])
    paths = source_paths()
    before = [row(p) for p in paths]
    out = BASE/'evidence/global-forced-current-20261012'/f'attempt{attempt}'
    out.mkdir(parents=True, exist_ok=False)
    for p in paths:
        destination = out/'sources'/p.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(p.read_bytes())
    write(out/'source-bytes-before.json', {'files': before, 'fileCount': len(before)})
    independent_result = independent()
    write(out/'independent-preflight.json', independent_result)
    if not independent_result['pass']:
        raise ValueError('The independent full polynomial preflight failed before any source process was launched.')
    certificate = out/'global-forced-current.json'
    partial_mean, majorant = out/'initialized-mean-construction.json', out/'actual-fixed-mean-majorant.json'
    partial_angular, stress = out/'initialized-angular-construction.json', out/'latest-mean-stress.json'
    initial_stress = out/'initialized-mean-stress.json'
    command = ['node', '--max-old-space-size=5120', '--expose-gc', '--test', '--test-reporter=tap', '--test-concurrency=1']
    command.extend(str((BASE/'tests'/p).relative_to(ROOT)) for p in TESTS)
    env = dict(os.environ, M3_FORCED_CURRENT_MEAN_PARTIAL=str(partial_mean), M3_FORCED_CURRENT_MAJORANT_PARTIAL=str(majorant),
               M3_FORCED_CURRENT_MAJORANT_FAILURE=str(out/'actual-fixed-mean-majorant-failure.json'),
               M3_FORCED_CURRENT_INITIAL_STRESS_EVIDENCE=str(initial_stress),
               M3_FORCED_CURRENT_INITIALIZED_PARTIAL=str(partial_angular), M3_FORCED_CURRENT_EVIDENCE=str(certificate),
               M3_FORCED_CURRENT_STRESS_EVIDENCE=str(stress),
               M3_FORCED_CURRENT_CHECKPOINT_DIR=str(out/'checkpoints'),
               M3_FORCED_CURRENT_CHECKPOINT_INDEX=str(out/'checkpoint-index.json'),
               M3_FORCED_CURRENT_INVERSE_PARTIAL=str(out/'forced-inverses-pressure-construction.json'))
    log_path = out/'node.log'

    def limit():
        resource.setrlimit(resource.RLIMIT_AS, (MAX_AS, MAX_AS))

    started, tick, stopped, peak_rss, peak_as = datetime.now(timezone.utc).isoformat(), time.monotonic(), None, 0, 0
    with log_path.open('wb') as log:
        child = subprocess.Popen(command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT,
                                 start_new_session=True, preexec_fn=limit)
        while child.poll() is None:
            raw = log_path.read_text(errors='replace')
            pids = {int(v) for v in re.findall(r'"hostPID":(\d+)', raw)}
            readings = [family_memory(pid) for pid in pids]
            rss, asize = sum(r[0] for r in readings), max((r[1] for r in readings), default=0)
            peak_rss, peak_as = max(peak_rss, rss), max(peak_as, asize)
            if rss > MAX_RSS:
                stopped = 'OBSERVED_SOURCE_WORKER_RSS_LIMIT'
            elif time.monotonic()-tick > TIMEOUT:
                stopped = 'OBSERVED_EXECUTION_TIME_LIMIT'
            if stopped:
                os.killpg(child.pid, signal.SIGTERM)
                try:
                    child.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(child.pid, signal.SIGKILL)
                break
            time.sleep(0.2)
        code = child.wait()
    elapsed = time.monotonic()-tick
    after = [row(p) for p in paths]
    write(out/'source-bytes.json', {'before': before, 'after': after, 'unchanged': before == after})
    raw = log_path.read_text(errors='replace')

    def count(name):
        matches = re.findall(r'^# '+name+r' (\d+)$', raw, re.M)
        return int(matches[-1]) if matches else None

    def observed(key):
        return max((int(v) for v in re.findall('"'+key+r'":(\d+)', raw)), default=0)

    bound = False
    try:
        if certificate.is_file():
            independent_result = independent(json.loads(certificate.read_text()))
            bound = independent_result['actualSourceCertificateBound']
    except Exception as error:
        independent_result = {'pass': False, 'checkCount': 0, 'checks': [], 'error': type(error).__name__+': '+str(error)}
    write(out/'independent-fraction.json', independent_result)
    passed, failed, skipped = count('pass'), count('fail'), count('skipped')
    node_rss, node_peak, node_as = observed('rssBytes'), observed('maxRSSBytes'), observed('vmSizeBytes')
    artifacts = [row(p) for p in sorted(out.rglob('*')) if p.is_file() and 'sources' not in p.relative_to(out).parts]
    success = code == 0 and stopped is None and before == after and passed == TEST_COUNT and failed == 0 and skipped == 0
    success = success and all(p.is_file() for p in [partial_mean, majorant, initial_stress, partial_angular, certificate, stress])
    checkpoint_index = out/'checkpoint-index.json'
    checkpoints = json.loads(checkpoint_index.read_text()) if checkpoint_index.is_file() else None
    exact_checkpoints = bool(checkpoints and len(checkpoints.get('checkpoints', [])) == 11 and
                             checkpoints.get('actualSourceBytesRetained') and not checkpoints.get('privateSourceAuthorityHydrated') and
                             all(x['allSourceBytesUnchanged'] for x in checkpoints['checkpoints']))
    success = success and exact_checkpoints and (out/'forced-inverses-pressure-construction.json').is_file()
    success = success and independent_result['pass'] and bound and max(peak_rss, node_rss, node_peak) <= MAX_RSS and max(peak_as, node_as) <= MAX_AS
    receipt = {'schema': 'MathScope.N6.GlobalForcedCurrentObservedExecution/1', 'attempt': attempt,
               'startedAt': started, 'finishedAt': datetime.now(timezone.utc).isoformat(), 'command': command,
               'exitCode': code, 'stoppedReason': stopped, 'elapsedSeconds': elapsed, 'timeoutSeconds': TIMEOUT,
               'stdoutAndStderrCombined': True, 'rawOutputPreserved': True, 'allCapturedSourceBytesRetained': True,
               'observedPeakSourceWorkerFamilyRSSBytes': peak_rss, 'observedMaximumSingleProcessASBytes': peak_as,
               'nodeSelfReportedPeakRSSBytes': node_rss, 'nodeResourceUsagePeakRSSBytes': node_peak,
               'nodeSelfReportedMaximumASBytes': node_as, 'sourceWorkerFamilyRSSLimitBytes': MAX_RSS,
               'perProcessAddressSpaceLimitBytes': MAX_AS,
               'runnerObservedChildResourceUsagePeakRSSBytes': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024,
               'memoryObservation': 'Only this source worker self-reported mounted /proc PID and its descendants are observed and bounded.',
               'nodeTests': {'passed': passed, 'failed': failed, 'skipped': skipped, 'required': TEST_COUNT},
               'independentChecks': independent_result['checkCount'], 'independentPass': independent_result['pass'],
               'independentActualSourceBound': bound, 'sourceFileCount': len(before), 'sourceFilesUnchanged': before == after,
               'artifacts': artifacts, 'partialConstructionArtifactsPreservedEvenOnFailure': True,
               'actualInitializedMeanConstructed': partial_mean.is_file(), 'actualFixedMeanOperatorAttachmentConstructed': majorant.is_file(),
               'actualInitializedMeanStressConstructed': initial_stress.is_file(),
               'actualCompleteInitializedAngularSourceConstructed': partial_angular.is_file(),
               'actualAll20InversesAndFreshPressureCheckpointed': (out/'forced-inverses-pressure-construction.json').is_file(),
               'all11ExactSourceGraphCheckpointsSaved': exact_checkpoints,
               'actualCompleteForcedCurrentConstructed': certificate.is_file(), 'actualLatestMeanStressConstructed': stress.is_file(),
               'actualConstructionArtifactsAreNotAnAutomaticCriterionPromotion': True,
               'actualSourceDerivativeClosureAudited': False, 'allOrderSourceClassBoundCertified': False,
               'numericalWholeFieldEnclosure': False, 'initializedJ0': False, 'completeFourStepCycle': False,
               'allCorrectionStagesConstructed': False, 'originalN602Complete': False, 'originalN603Complete': False,
               'completeN6': False, 'wholeM3Complete': False, 'pass': bool(success)}
    write(out/'receipt.json', receipt)
    print(json.dumps({'receipt': row(out/'receipt.json'), 'nodeTests': receipt['nodeTests'],
                      'independentChecks': receipt['independentChecks'], 'sourceFilesUnchanged': before == after,
                      'elapsedSeconds': elapsed, 'pass': receipt['pass']}, ensure_ascii=False, indent=2), flush=True)
    return 0 if success else 1


if __name__ == '__main__':
    raise SystemExit(main())
