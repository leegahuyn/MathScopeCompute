#!/usr/bin/env python3
"""Observe a new small support proof against the unchanged actual source archives.

This gate does not rerun the common6/core/near-terminal constructors. It first
verifies their original source captures and artifacts, then executes the new
support kernel and independent exact algebra. Every attempt is preserved.
"""
from __future__ import annotations
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import resource
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'research-ide/mathscope-m3/navier'
TEST_COUNT = 16
TIMEOUT = 60
BUILDERS = {
    'inner': BASE / 'tests/build-inner-growth-evidence.py',
    'domain': BASE / 'tests/build-exterior-force-evidence.py',
    'nearTerminal': BASE / 'tests/build-near-terminal-evidence.py',
}
ENTRY = [BASE / 'source-core-restriction.mjs', BASE / 'source-near-terminal-evidence.mjs',
         BASE / 'tests/core-restriction-proof.test.mjs', BASE / 'tests/near-terminal-archive.test.mjs', Path(__file__).resolve()]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pin(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': digest(path), 'bytes': path.stat().st_size}


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def load_builder(name, path):
    spec = importlib.util.spec_from_file_location('core_restriction_' + name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def source_archives():
    records, manifests, paths = {}, {}, set()
    for name, path in BUILDERS.items():
        builder = load_builder(name, path)
        records[name] = builder.archive(ROOT)
        manifests[name] = builder.build(ROOT, check=True)
        paths.update(p.resolve() for p in builder.source_paths(ROOT))
        paths.add(path.resolve())
    return records, manifests, paths


def source_rows(archive_paths):
    paths = set(archive_paths)

    def visit(path):
        path = path.resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise ValueError('A support-proof import escapes or is missing: ' + str(path))
        if path in paths:
            return
        paths.add(path)
        if path.suffix in ['.mjs', '.js']:
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', path.read_text()):
                visit(path.parent / spec)

    for path in ENTRY:
        visit(path)
    return [pin(path) for path in sorted(paths)]


def polynomial(terms):
    out = {}
    for coefficient, factors in terms:
        key = tuple(sorted(factors))
        out[key] = out.get(key, Fraction(0)) + Fraction(coefficient)
    return {key: value for key, value in out.items() if value}


def imported_polynomial(terms):
    return polynomial((term['coefficient'], term['factors']) for term in terms)


def differential_atom(name, axis=None, order=1):
    orders = [0, 0, 0, 0]
    if axis is not None:
        orders[axis] = order
    return name + '|' + ','.join(map(str, orders))


def expected_ns_component(j, increment=False):
    velocity = 'du' if increment else 'u'
    pressure = 'dp' if increment else 'p'
    terms = [(1, [differential_atom(velocity + str(j), 3)]), (1, [differential_atom(pressure, j)])]
    terms += [(-1, [differential_atom(velocity + str(j), k, 2)]) for k in range(3)]
    pairs = [('u', 'du'), ('du', 'u'), ('du', 'du')] if increment else [('u', 'u')]
    terms += [(1, [differential_atom(left + str(k)), differential_atom(right + str(j), k)])
              for left, right in pairs for k in range(3)]
    return polynomial(terms)


def p_add(left, right):
    return polynomial([(v, k) for p in [left, right] for k, v in p.items()])


def p_mul(left, right):
    return polynomial((a * b, x + y) for x, a in left.items() for y, b in right.items())


def rational(value):
    return (polynomial([(Fraction(value), [])]), polynomial([(1, [])]))


def variable(name):
    return (polynomial([(1, [name])]), polynomial([(1, [])]))


def rf_add(a, b):
    return p_add(p_mul(a[0], b[1]), p_mul(b[0], a[1])), p_mul(a[1], b[1])


def rf_mul(a, b):
    return p_mul(a[0], b[0]), p_mul(a[1], b[1])


def rf_inverse(a):
    return a[1], a[0]


def rf_equal(a, b):
    return p_mul(a[0], b[1]) == p_mul(b[0], a[1])


def scalar_parser(program, atoms):
    memo = {}

    def parse(index):
        if index in atoms:
            return variable(atoms[index])
        if index in memo:
            return memo[index]
        node = program['nodes'][index]
        op, args = node['op'], node['args']
        if op == 'rational':
            value = rational(Fraction('/'.join(args)))
        elif op == 'add':
            value = rational(0)
            for child in args:
                value = rf_add(value, parse(child))
        elif op == 'multiply':
            value = rational(1)
            for child in args:
                value = rf_mul(value, parse(child))
        elif op == 'inverse':
            value = rf_inverse(parse(args[0]))
        elif op == 'integer_power' and abs(args[1]) <= 512:
            value, base = rational(1), parse(args[0])
            if args[1] < 0:
                base = rf_inverse(base)
            for _ in range(abs(args[1])):
                value = rf_mul(value, base)
        else:
            value = variable('node_' + str(index))
        memo[index] = value
        return value
    return parse


def independent_checks(proof, records):
    checks = []

    def check(name, condition):
        checks.append({'id': name, 'pass': bool(condition)})

    try:
        inner = records['inner']['certificate']
        domain = records['domain']['domain']
        near = records['nearTerminal']['certificate']
        support = proof['supportInduction']
        recipe = support['recipe']
        check('all-three-original-archives-have-one-parameter-profile-common-source',
              proof['sourceBinding'] == inner['sourceBinding'] == domain['sourceBinding'] == near['sourceBinding'])
        check('the-actual-inner-point-and-qstar-source-identities-agree',
              inner['point']['Xin'] == near['point']['Xin'] and inner['point']['eta'] == near['point']['eta'] == 0
              and proof['sourceDomain']['qStar'] == inner['localization']['qStar'] == domain['constants']['qBig'])
        check('strict-open-collar-separates-the-point-from-the-annular-shell',
              Fraction(0) < Fraction(recipe['core']['openCollar'][0]) < Fraction(recipe['core']['point'])
              < Fraction(recipe['core']['openCollar'][1]) < Fraction(recipe['core']['shellInner'])
              and Fraction(recipe['core']['point']) == Fraction(1, 2))
        p = inner['formulaProgram']['parametersExactExpressions']
        check('actual-mean-support-is-separated-by-positive-original-parameter-exponents',
              p['Xa'] == {'quotient': [{'integer': 4}, {'ref': 'Lambda'}]}
              and p['X0Imean'] == {'product': [{'ref': 'XR'}, {'exp': {'sum': [{'ref': 'T'}, {'integer': 2}, {'product': [{'integer': 60}, {'ref': 'BOuter'}]}, {'integer': -8}]}}]}
              and int(p['Q']['quotient'][0]['product'][0]['integer']) > 2 ** 240 > 4
              and int(p['XR']['product'][0]['integer']) > 1
              and (1 + 60 * int(p['BOuter']['product'][0]['integer'])) * 11 - 6 > 0)
        check('all-five-executed-original-profile-and-potential-supports-remain-inside-Imean',
              domain['fixedMeanMap']['source']['actualImportedSourceExecuted']
              and domain['fixedMeanMap']['profiles']['potentialHullIncluded']
              and domain['fixedMeanMap']['profiles']['smoothZeroExtension']
              and domain['fixedMeanMap']['profiles']['dExact'] == '1/5'
              and 1 + Fraction(4, 5) + 2 * Fraction(1, 10) == 2 < 5)

        expanded = next(row['evidence'] for row in support['checks'] if row['id'] == 'literal-full-NS-increment-and-base-residual-separation')
        for component in range(3):
            original = expected_ns_component(component)
            delta = expected_ns_component(component, increment=True)
            actual = imported_polynomial(expanded['fullIncrement'][component])
            check('literal-NS-component-' + str(component) + '-independent-full-quadratic-expansion', actual == delta)
            check('literal-NS-component-' + str(component) + '-retains-nonzero-base-and-zero-restriction',
                  imported_polynomial(expanded['baseResidualRetained'][component]) == original
                  and len(original) > 0 and expanded['restrictedIncrement'][component] == []
                  and all(any(factor.startswith(('du0|', 'du1|', 'du2|', 'dp|')) for factor in key) for key in actual))

        curl = next(row['evidence'] for row in support['checks'] if row['id'] == 'all-potential-cutoff-curl-products-retained')
        for component in range(3):
            j, k = (component + 1) % 3, (component + 2) % 3
            expected = polynomial([(1, [differential_atom('chi'), differential_atom('A' + str(k), j)]),
                                   (-1, [differential_atom('chi'), differential_atom('A' + str(j), k)]),
                                   (1, [differential_atom('chi', j), differential_atom('A' + str(k))]),
                                   (-1, [differential_atom('chi', k), differential_atom('A' + str(j))])])
            row = curl['cartesianProductRules'][component]
            check('full-curl-product-component-' + str(component) + '-has-both-cutoff-derivative-terms',
                  imported_polynomial(row['direct']) == imported_polynomial(row['expanded']) == expected and len(expected) == 4)

        zero_origins = {'PRIMARY_SUPPORTED_WAVE_POTENTIAL', 'INITIAL_ZERO_MEAN', 'ORIGINAL_SUPPORTED_BASE_STRESS',
                        'INDUCTION_HYPOTHESIS', 'PHASE_FOLLOWING_PREFIX_ZERO', 'ORIGINAL_CHI_M_INNER_ZERO',
                        'ORIGINAL_IMEAN_PROFILE', 'SIGNED_CORRECTION_OPEN_SHELL_THEN_ZERO_EXTENSION'}
        unknown_origins = {'ORIGINAL_PSI', 'FULL_RADIAL_MOMENT'}
        products = {'CHI_M_TIMES_FULL_MOMENT', 'FINAL_RECTANGLE_CUTOFF', 'PROFILE_TIMES_CURRENT_GLOBAL_DEFECT'}
        passthrough = {'PRIMARY_FULL_CURL', 'RESIDUAL_OF_SUPPORTED_INCREMENT', 'FULL_DIFFERENTIAL_AND_PRODUCT_INCREMENT',
                       'ZERO_DATA_PULSE_INVERSE', 'EXACT_ZERO_MEAN_TEMPORAL_INVERSE', 'FULL_MERIDIONAL_CURL', 'FIVE_MOMENT_MERIDIONAL_CURL'}
        sums = {'SUPPORTED_NONBASE_RESIDUAL', 'STAGE_J_SUPPORTED_INPUT', 'ZERO_MOMENT_SUPPORTED_STRESS_SOURCE',
                'SUPPORTED_RADIAL_PRIMITIVE', 'PRESSURE_SOURCE_GR_MINUS_RHO_P', 'ALL_FOUR_ORDERED_CORRECTIONS_AND_RECONSTRUCTED_PRESSURE'}
        values, valid = [], True
        for row in support['trace']:
            if row['id'] != len(values) or any(index < 0 or index >= len(values) for index in row['inputs']):
                valid = False
                break
            inputs, operator = [values[index] for index in row['inputs']], row['operator']
            if operator in unknown_origins:
                expected = False
            elif operator in zero_origins:
                expected = True
            elif operator in products:
                expected = bool(inputs) and any(inputs)
            elif operator in sums:
                expected = bool(inputs) and all(inputs)
            elif operator in passthrough:
                expected = len(inputs) == 1 and inputs[0]
            else:
                valid = False
                break
            valid = valid and row['zeroOnOpenCore'] is expected
            values.append(expected)
        check('independent-topological-support-evaluation-retains-every-nonzero-possible-full-moment',
              valid and len(values) == len(support['trace']) and values[-1]
              and all(row['zeroOnOpenCore'] is False for row in support['trace'] if row['operator'] == 'FULL_RADIAL_MOMENT'))
        check('radial-path-remains-inner-for-every-auxiliary-shift',
              recipe['radial']['path'] == '0<=r_prime<=r' and recipe['radial']['fixedPhysicalZT']
              and recipe['radial']['qIndependentOfRadius'] and recipe['radial']['torusShiftChangesOnlyY']
              and recipe['radial']['sourceZeroForEveryY'] and recipe['radial']['innerCutoffValue'] == '0'
              and recipe['radial']['fullIntegralRetained'])
        check('temporal-inverse-fixes-all-slow-coordinates-and-no-homogeneous-mode-is-added',
              recipe['temporal'] == {'inverseCoordinates': ['y0', 'y1'], 'fixedSlowCoordinates': ['R', 'Z', 'T'],
                                     'zeroFourierMode': '0', 'exactLimit': True})

        program = inner['formulaProgram']
        roots, nodes = program['roots'], program['nodes']
        parse = scalar_parser(program, {roots[key]: key for key in ['Lambda', 'h', 'C', 'eScale', 'tau0', 'Xin']})
        v = variable
        product = lambda *args: __import__('functools').reduce(rf_mul, args, rational(1))
        summation = lambda *args: __import__('functools').reduce(rf_add, args, rational(0))
        plateau_denominator = summation(rational(4), product(rational(4), rf_inverse(v('tau0'))), product(rational(32), v('Xin')))
        check('actual-source-plateau-is-the-strict-positive-three-margin-formula', rf_equal(parse(roots['plateau']), rf_inverse(plateau_denominator)))
        shrink = nodes[roots['shrinkLog']]
        check('actual-source-log-shrink-retains-the-complete-remainder-coefficient',
              shrink['op'] == 'log_positive' and rf_equal(parse(shrink['args'][0]), summation(rational(1), product(rational(4), v('C'), rf_inverse(v('eScale'))))))
        threshold_parse = scalar_parser(program, {roots['h']: 'h', roots['shrinkLog']: 'L', roots['plateau']: 'plateau'})
        plateau_log = next(index for index, node in enumerate(nodes) if node == {'op': 'log_positive', 'args': [roots['plateau']]})
        threshold_parse = scalar_parser(program, {roots['h']: 'h', roots['shrinkLog']: 'L', plateau_log: 'logPlateau'})
        log_formula = summation(v('logPlateau'), product(rational('-1/2'), v('L'), rf_inverse(v('h'))))
        check('the-same-recorded-tau-root-is-the-positive-uniform-threshold',
              nodes[roots['tau_0']] == {'op': 'exp', 'args': [roots['logTau_0']]}
              and rf_equal(threshold_parse(roots['logTau_0']), log_formula)
              and program['sourceNodeIds'][roots['tau_0']] == proof['analyticGrowth']['uniformThreshold']['sourceRoot'])
        # This exact rational identity proves a STRICT positive residual margin
        # for every C>0 and eScale>0; no actual tiny parameter is sampled.
        gap = summation(product(v('eScale'), rational('1/4')),
                        product(rational(-1), v('C'), rf_inverse(summation(rational(1), product(rational(4), v('C'), rf_inverse(v('eScale')))))))
        positive_gap = product(v('eScale'), v('eScale'), rf_inverse(product(rational(4), summation(v('eScale'), product(rational(4), v('C'))))))
        check('uniform-error-margin-is-exactly-positive-eScale-squared-over-positive-denominator', rf_equal(gap, positive_gap))
        scale_parse = scalar_parser(program, {roots['Lambda']: 'Lambda'})
        check('actual-Xin-root-is-exactly-two-over-the-original-Lambda', rf_equal(scale_parse(roots['Xin']), product(rational(2), rf_inverse(v('Lambda')))))
        check('actual-positive-leading-lower-is-half-the-original-eScale',
              rf_equal(scale_parse(roots['eLower']), product(rational('1/2'), scale_parse(roots['eScale']))))
        phi = inner['leading']['freshCore']['phi']['rows'][0]['actualNonlinearInterval']
        check('actual-core-leading-interval-is-strictly-above-one-half', Fraction(phi['lower']) > Fraction(1, 2) and Fraction(phi['upper']) > Fraction(phi['lower']))
        check('positive-h-and-A-and-complete-all-order-tail-are-retained',
              p['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}}
              and inner['remainder']['allCutoffTermsAndUnboundedTailRetained']
              and inner['remainder']['positiveExponentRetained']
              and proof['analyticGrowth']['remainder']['unboundedTailStarts'] == 3
              and proof['analyticGrowth']['uniformThreshold']['on'] == 'every 0<tau<=tau_*')

        check('same-near-terminal-source-all-three-leading-field-restrictions-are-exact',
              all(near['leadingBinding']['parameterChecks'].values())
              and all(row['pass'] for row in near['leadingBinding']['checks'])
              and all(row['pass'] for row in near['leadingBinding']['exactChecks'].values())
              and not near['leadingBinding']['noncoreMassIntegralsDiscarded'])
        for row in near['rows']:
            error = Fraction(1, 2 ** (row['depth'] + 2))
            check('near-terminal-depth-' + str(row['depth']) + '-keeps-one-positive-time-and-all-component-tails',
                  row['tau']['exactSign'] == 'POSITIVE' and row['tau']['binary64'] is None
                  and row['samePointAndTimeForAllComponents'] and row['unitLocalizationPlateau']
                  and [c['sourceTailPower'] for c in row['components']] == ['3h', '2h', '2h']
                  and all(Fraction(c['interval']['lower']) == Fraction(c['leadingInterval']['lower']) - error
                          and Fraction(c['interval']['upper']) == Fraction(c['leadingInterval']['upper']) + error
                          and c['physicalVelocity']['binary64'] is None for c in row['components']))
        check('the-four-required-decimal-times-and-smaller-precision-mode-are-recorded',
              [r['input'] for r in near['decimalSamples'][:4]] == ['1e-2', '1e-4', '1e-8', '1e-12']
              and any(r['powerOfTen'] <= -1000 for r in near['decimalSamples']))
        for row in near['decimalSamples']:
            check('decimal-' + row['input'] + '-has-proven-localized-zero-extension-and-positive-internal-tau',
                  int(row['coefficient']) > 0 and row['exactSign'] == 'POSITIVE'
                  and 2 ** 8204 > 4 * row['comparison']['K']
                  and row['cutoffState'] == 'EXACT_TEMPORAL_ZERO_EXTENSION'
                  and row['physicalScalingAppliedAfterNormalizedEvaluation']
                  and not row['underflowReplacedByZero'] and not row['internalTauReconstructedFromDisplayedTime']
                  and row['physicalVelocity']['components'] == row['normalizedVelocity']['components'] == ['0', '0', '0'])
        check('historical-external-identification-flags-were-not-rewritten',
              inner['claims']['originalLocalizedPath']['status'] == 'CONDITIONAL_ON_EXTERNAL_SOURCE_THEOREM_IDENTIFICATION'
              and near['claims']['finalLocalizedVelocity']['status'] == 'EXTERNAL_SOURCE_THEOREM_IDENTIFICATION_REQUIRED'
              and not records['nearTerminal']['historicalExecutionAssessment']['originalN804CriterionComplete'])
        check('new-proof-has-only-the-restricted-field-and-analytic-growth-scope',
              proof['newSupportProofExecuted'] and not proof['freshSourceConstructorExecuted'] and not proof['newLeanExecuted']
              and all(proof['scope'][key] is False for key in ['fullFinalN6FieldConstructed', 'nonzeroCorrectionFieldsConstructed',
                  'allSpaceVelocityEvaluator', 'wholeLocalizedForceConstructed', 'wholeKEnergyNearTerminalComputed', 'globalForceExtensionConstructed', 'wholeM3Complete']))
        unhashed = {key: value for key, value in proof.items() if key != 'proofSHA256'}
        canonical = json.dumps(unhashed, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
        check('independent-canonical-new-proof-content-hash', hashlib.sha256(canonical.encode()).hexdigest() == proof['proofSHA256'])
    except Exception as error:
        checks.append({'id': 'independent-proof-artifact-structure', 'pass': False, 'errorType': type(error).__name__, 'message': str(error)})
    return {'schema': 'MathScope.N7.CoreRestrictionIndependentExact/1',
            'status': 'PASS' if checks and all(row['pass'] for row in checks) else 'FAIL', 'checks': checks,
            'freshSourceConstructorExecuted': False, 'newLeanExecuted': False,
            'scope': 'Independent exact NS/curl polynomials, support trace, source scalar identities, uniform analytic growth inequality, and same-source N8 component/time linkage. Original analytic operator and realization theorems are explicitly applied; their nonzero field is not reconstructed.'}


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'[1-9][0-9]*', sys.argv[1]):
        raise SystemExit('Usage: run-core-restriction-proof.py NEW_ATTEMPT_NUMBER')
    attempt = int(sys.argv[1])
    out = BASE / 'evidence/source-core-restriction-20261012' / ('attempt' + str(attempt))
    out.mkdir(parents=True, exist_ok=False)
    started, start = datetime.now(timezone.utc).isoformat(), time.monotonic()
    records, manifests, archive_paths = source_archives()
    before = source_rows(archive_paths)
    write_json(out / 'inherited-archive-verification.json', {'manifests': manifests, 'freshSourceConstructorsExecuted': False, 'allOriginalSourceBytesVerified': True})
    write_json(out / 'source-bytes-before.json', {'files': before, 'fileCount': len(before)})
    snapshot = out / 'new-source-snapshot'
    snapshot.mkdir()
    for path in ENTRY:
        (snapshot / path.name).write_bytes(path.read_bytes())
    artifact, log = out / 'core-restriction.json', out / 'node.log'
    command = ['node', '--test', '--test-reporter=tap', '--test-concurrency=1',
               'research-ide/mathscope-m3/navier/tests/core-restriction-proof.test.mjs',
               'research-ide/mathscope-m3/navier/tests/near-terminal-archive.test.mjs']
    env = dict(os.environ, M3_N7_CORE_RESTRICTION_EVIDENCE=str(artifact))
    timeout = False
    with log.open('wb') as stream:
        try:
            completed = subprocess.run(command, cwd=ROOT, env=env, stdout=stream, stderr=subprocess.STDOUT, timeout=TIMEOUT)
            code = completed.returncode
        except subprocess.TimeoutExpired:
            timeout, code = True, None
    independent = independent_checks(json.loads(artifact.read_text()), records) if code == 0 and artifact.is_file() else {'status': 'NOT_RUN', 'checks': []}
    write_json(out / 'independent-exact.json', independent)
    after = source_rows(archive_paths)
    write_json(out / 'source-bytes.json', {'before': before, 'after': after, 'unchanged': before == after})
    # Verify the complete inherited captures again, including proof-time use.
    _, after_manifests, after_paths = source_archives()
    inherited_unchanged = manifests == after_manifests and archive_paths == after_paths
    raw = log.read_text()

    def count(name):
        matches = re.findall(r'^# ' + name + r' (\d+)$', raw, re.M)
        return int(matches[-1]) if matches else None

    passed, failed, skipped = count('pass'), count('fail'), count('skipped')
    artifacts = [out / 'inherited-archive-verification.json', out / 'source-bytes-before.json', out / 'source-bytes.json', log, out / 'independent-exact.json']
    if artifact.is_file():
        artifacts.append(artifact)
    receipt = {'schema': 'MathScope.N7.CoreRestrictionObservedProof/1', 'attempt': attempt,
               'startedAt': started, 'finishedAt': datetime.now(timezone.utc).isoformat(), 'elapsedSeconds': time.monotonic() - start,
               'command': command, 'exitCode': code, 'timeout': timeout, 'timeoutSeconds': TIMEOUT,
               'nodeTests': {'passed': passed, 'failed': failed, 'skipped': skipped},
               'sourceFilesUnchanged': before == after, 'sourceFileCount': len(before),
               'inheritedArchiveBytesVerifiedBeforeAndAfter': inherited_unchanged,
               'inheritedArchiveNames': list(BUILDERS), 'independentStatus': independent['status'], 'independentCheckCount': len(independent['checks']),
               'artifacts': [pin(path) for path in artifacts], 'proofSHA256': json.loads(artifact.read_text())['proofSHA256'] if artifact.is_file() else None,
               'maximumObservedChildRSSKiB': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss,
               'newSupportProofExecuted': code == 0, 'freshSourceConstructorExecuted': False, 'sourceMeasurementsReused': True,
               'newLeanExecuted': False, 'fullFinalN6FieldConstructed': False, 'allSpaceVelocityEvaluator': False,
               'wholeLocalizedForceConstructed': False, 'wholeKEnergyNearTerminalComputed': False,
               'globalForceExtensionConstructed': False, 'criterionAssessmentEdited': False, 'wholeM3Complete': False,
               'pass': code == 0 and not timeout and before == after and inherited_unchanged
                       and passed == TEST_COUNT and failed == 0 and skipped == 0 and independent['status'] == 'PASS'}
    write_json(out / 'receipt.json', receipt)
    print(json.dumps(receipt, ensure_ascii=False, indent=2), flush=True)
    return 0 if receipt['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
