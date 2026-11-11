"""Verify the actual mapped principal split and the exact four-family live ledger."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


PAPER_SHA = '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
FIRST_SHA = '1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3'
LOW_SHA = 'f6ba2421724e70caba338fa6483dcd399af1813aea3d33ebf8835bfeeb5eb697'
WAVE_SHA = '7ac31a18079dd4cabf9f190dfbca0559d1ade8ea779aa4866238cd7b935eba67'
SUPPLEMENT_SHA = 'aab167807858d46eaa7dad6b714d6c6af99f55271cc4a7ff081a2fd97acf427d'
LEDGER_SHA = '2570a6b98bf365e44629c40c4f406a4192b42f63acda67e08e1cd0e101b87181'
FUNCTIONAL_SHA = 'b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78'
PARTS = ('real', 'imaginary')
ZERO = {'real': 0, 'imaginary': 0}


def pin(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path.name
    return raw


def principal_cancellation(algebra):
    def variable(i):
        return {((i, 1),): Fraction(1)}
    source, primary, psi, forced_derivative, signed_derivative = (variable(i) for i in range(1, 6))
    raw = algebra.add(source, primary)
    leading_particular = algebra.add(algebra.neg(algebra.mul(psi, source)), forced_derivative)
    four_terms = algebra.add(algebra.mul(algebra.sub(algebra.one, psi), source),
                             forced_derivative, primary, signed_derivative)
    actual = algebra.add(raw, leading_particular, signed_derivative)
    assert actual == four_terms
    raw_solve = algebra.add(raw, algebra.neg(algebra.mul(psi, raw)), forced_derivative, signed_derivative)
    raw_ledger = algebra.add(algebra.mul(algebra.sub(algebra.one, psi), raw),
                             forced_derivative, primary, signed_derivative)
    assert algebra.sub(raw_solve, raw_ledger) == algebra.neg(primary)
    assert algebra.sub(raw_solve, four_terms) == algebra.neg(algebra.mul(psi, primary))
    return {'actualIdentity': 'R0-psi*g+psi_prime*t_F+psi_prime*t_S=P+(1-psi)*g+psi_prime*t_F+psi_prime*t_S',
            'oldRawAsSolveAndRemainingSourceControl': '-P',
            'oldRawAsSolveWithCorrectedRemainingSourceControl': '-psi*P'}


def check_actual_row(graph, exact, rational_identity, row, previous, low, signed):
    m = row['m']
    cut = previous['mappedCutoff']
    assert m == previous['m'] == low['mode']
    assert cut['psi'] == low['psi'] and cut['dpsi'] == low['dpsi']
    families = ['first-forced-remaining-source', 'first-forced-cutoff-derivative']
    if m == 1:
        families += ['primary-cutoff-derivative', 'signed-cutoff-derivative']
    assert [t['family'] for t in row['terms']] == families
    assert row['terms'][0]['value'] == cut['remainingSource'] == low['remaining']
    assert row['terms'][1]['value'] == cut['derivativeSource'] == low['derivative']
    result = []
    for c in previous['components']:
        j, part = c['j'], c['part']
        label = (low['key'], m, j, part)
        primary = c['primary']
        assert (primary != 0) == (m == 1 and part == 'real')
        assert exact.of(c['raw']) == exact.add(exact.of(c['supported']), exact.of(primary))
        # This is the actual mapped (9.1) expression including +g, not just
        # the separately recorded sum of the expected two cutoff pieces.
        residual = cut['residual'][j][part]
        expected = cut['expected'][j][part]
        rational_identity(exact, exact.of(residual), exact.of(expected), (*label, 'mapped (9.1)'))
        pieces = [t['value'][j][part] for t in row['terms']]
        if m == 1:
            assert pieces[2] == primary
            assert pieces[3] == (signed[j]['root'] if part == 'real' else 0)
        assert exact.of(row['subtraction'][j][part]) == exact.add(*(exact.of(i) for i in pieces))
        result.append({'j': j, 'part': part, 'initializedRaw': c['raw'], 'firstSupportedInput': c['supported'],
                       'mappedPrincipalPlusSupportedInput': residual,
                       'mappedExpectedCutoffPair': expected, 'flatFamilies': pieces,
                       'candidateFlatSubtraction': row['subtraction'][j][part]})
    return result


def main():
    parser = ArgumentParser(description=__doc__)
    for arg in ('repo', 'first-dir', 'candidate-dir', 'paper', 'source-functionals',
                'official-receipt', 'low-receipt', 'wave-receipt', 'supplemental-receipt', 'cycle-ledger', 'out'):
        parser.add_argument('--' + arg, type=Path, required=True)
    args = parser.parse_args()
    branch = args.repo.resolve() / 'tools/mathscope-cd-axial-bridge-20261029/goal-next'
    sys.path[:0] = [str(branch / name) for name in ('first-force-repair', 'y')]
    from check_repeat_forced_candidates import CANDIDATE_FILE, CANDIDATE_SCOPE, Exact, Graph, STREAM
    from bind_corrected_flat import BASE, FIRST_SCOPE, assert_rational_identity, compare_prefix, git_blob, verify_manifest
    from native_reference_scopes import actual_children

    pin(args.paper, PAPER_SHA)
    functionals = json.loads(pin(args.source_functionals, FUNCTIONAL_SHA))
    [functional] = [f for f in functionals['nodes'] if f['id'] == 'f_68465a2d86d9ee074ccccd4b']
    assert functional['operation'] == 'GroupedSupportedNonzeroResidual'
    assert functional['data']['all_generated_harmonics'] == '0<|m|<=2^2'
    assert functional['data']['all_conjugate_pairs']
    assert functional['data']['flat_terms'] == 'retained separately, never sent to supported pulse source'
    checked = json.loads(args.official_receipt.read_bytes())
    low = json.loads(pin(args.low_receipt, LOW_SHA))
    waves = json.loads(pin(args.wave_receipt, WAVE_SHA))
    supplemental = json.loads(pin(args.supplemental_receipt, SUPPLEMENT_SHA))
    cycle = json.loads(pin(args.cycle_ledger, LEDGER_SHA))['correctedFullCycle']
    prior = json.loads((args.first_dir / 'corrected-first-force.json').read_bytes())
    first, _ = verify_manifest(args.first_dir, FIRST_SCOPE, prior['commit'])
    final, _ = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, checked['commit'])
    assert first['node_stream_sha256'] == FIRST_SHA and prior['snapshot'] == first
    assert checked['graphSHA256'] == waves['graphSHA256'] == supplemental['graphSHA256'] == low['candidateGraphSHA256'] == final['node_stream_sha256']
    assert checked['registrySHA256'] == final['definitions_sha256']
    prefix = compare_prefix(args.first_dir, args.candidate_dir, first)
    assert prefix == low['firstPrefix']
    candidate = json.loads((args.candidate_dir / CANDIDATE_FILE).read_bytes())
    assert candidate['snapshot'] == final
    original = git_blob(args.repo, BASE, 'research-ide/mathscope-m3/navier/source-global-angular.mjs')
    assert b'oldFlat=[{m:0,value:base.conservativeResidual.map' in original
    assert b'originalHomogeneousPrimaryPressure' in original and b'nPrime[j]' in original
    old = {(r['key'], r['m']): r for r in prior['rows']}
    lows = {(r['key'], r['mode']): r for r in low['liveLowModeSubtractions']}
    signed = {(r['key'], r['component']): r for r in supplemental['independentSignedHalfAmplitudeProofs']}
    pure_mean = ('cor85SigmaCutoff_0', 'cor85SigmaCutoff_1', 'signedMeanPressureA0', 'temporalT1A1', 'fiveMeanPressureA0')
    results, mean = [], {}
    with TemporaryFile() as backing:
        graph = Graph(args.candidate_dir / STREAM, backing, final)
        angle = 622806

        def has_angle(start):
            stack, seen = [start], set()
            while stack:
                root = stack.pop()
                if root == angle:
                    return True
                if root in seen:
                    continue
                seen.add(root)
                op, operands = graph.node(root)
                if op == 'definite_integral':
                    integrand, binder, left, right = operands
                    stack.extend((left, right))
                    if binder != angle:
                        stack.append(integrand)
                else:
                    stack.extend(actual_children({'op': op, 'args': operands}))
            return False

        for name in pure_mean:
            root = cycle['angleZeroSources'][name]['node']
            assert not has_angle(root)
            mean[name] = root
        for template in candidate['templates']:
            key = template['key']
            exact = Exact(graph)
            cases = {j: signed[key, j] for j in range(3)}
            for row in template['rows']:
                m = row['m']
                if m in (1, 2):
                    results.append({'key': key, 'mode': m,
                                    'coefficients': check_actual_row(graph, exact, assert_rational_identity, row,
                                                                     old[key, m], lows[key, m], cases)})
                else:
                    assert m in (3, 4) and row['terms'] == [] and row['subtraction'] == [ZERO] * 3
            Exact.of.cache_clear()
        controls = principal_cancellation(Exact(graph))
    assert len(results) == 20 and sum(len(r['coefficients']) for r in results) == 120
    report = {'schema': 'MathScope.N6.ActualPrincipalFlatLedger/1', 'paperSHA256': PAPER_SHA,
              'sourceGraphSHA256': final['node_stream_sha256'], 'repairedFirstPrefix': prefix,
              'originalGroupedSourceFunctional': functional, 'pinnedOriginalAngularSourceSHA256': sha256(original).hexdigest(),
              'actualPrincipalRows': results, 'noPrincipalFlatTermsAtModes': [3, 4], 'actualModeZeroCutoffOperands': mean,
              'originalBaseOldFlatModes': [0], 'principalNoDoubleCountControls': controls,
              'scope': 'Exact designated nonzero principal flat ledger. Analytic flatness requires the actual W_alpha and derivative hypotheses.',
              'completeGlobalAnalyticSplit': 'CONDITIONAL', 'release': 'HOLD'}
    out = (json.dumps(report, indent=2) + '\n').encode()
    args.out.write_bytes(out)
    print('PASS 120 actual mapped principal residual components and the four-family live subtraction ledger')
    print(f'{sha256(out).hexdigest()}  {args.out.name}')


if __name__ == '__main__':
    main()
