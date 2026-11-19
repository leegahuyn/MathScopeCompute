"""Bind the phase-gradient reduction to the ten actual +2 source rows."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from itertools import product
import json
from math import comb
from pathlib import Path

HOSTED = '2d3f7fc8feb06757e5c6c1a75cea8ad5c4bd9945253ab7d39bf665c9fccaec85'
OVERLAY_MANIFEST = 'e15a1ffe404feb9a4939e20e9755fc8aca0f9cc2aaaf991f4e2648cd96b5ecfb'
BINDER = 'fa0e60771796b77a1fe37c17a4fe6f9271eae156dd6c1ba73ac2297990f9b20b'
SOURCE_PINS = {
    'source-initialized-angular.mjs': '4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e',
    'source-global-forced-current.mjs': '1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3',
    'source-global-angular.mjs': 'eb4e4ae44e9bb84713f89d36d1d7ae33cf1b072638d0a8e67e2a90f38d411010',
    'source-global-current.mjs': 'b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36',
}


def read(path, pin):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == pin, path
    return data


def require_fragments(text, *fragments):
    for fragment in fragments:
        assert fragment.encode() in text, fragment


def check_source(directory, binder_path):
    manifest = json.loads(read(directory / 'pr30-runtime-overlays.json', OVERLAY_MANIFEST))
    assert manifest['schema'] == 'MathScope.PR30OriginalVerifiedStorageOverlays/1'
    rows = {Path(row['original']).name: row for row in manifest['files']}
    texts = {}
    for filename, pin in SOURCE_PINS.items():
        row = rows[filename]
        assert row['sha256'] == pin
        assert row['overlay'] == 'pr30-runtime-overlays/' + pin + '.mjs'
        texts[filename] = read(directory / row['overlay'], pin)
    require_fragments(texts['source-initialized-angular.mjs'],
        'for(let delta=0;delta<=4;delta++)',
        'increment:waveRows,oldFlatResidual:oldFlat',
        'nonzeroAngularForcing=subtractVectorRows(G,waveResidual,primaryFlatResidual).filter',
        'source-lift-normalized-radial-coordinate',
        'source-lift-longitudinal-radial-derivative-zero',
        'original-integer-lift-pulse-at-Hw-is-w',
        'original-integer-lift-transverse-fixed',
        'expectedJacobian=vt.map',
        'factor=G.div(ci,G.pow(Tg,delta))',
        'Hw=Y.map((y,j)=>G.add(y,G.mul(factor,difference,vt[j])))')
    require_fragments(texts['source-global-forced-current.mjs'],
        'for(const m of [1,2])',
        'sourcePullbackComponent(G,z[part],path',
        'G.simultaneousSubstitute(value,path.Y,path.Hw)')
    require_fragments(texts['source-global-angular.mjs'], 'sourceFullCurl:row.curl.fullCoefficient')
    require_fragments(texts['source-global-current.mjs'], 'curl=exactCylindricalHarmonicCurl(G,')
    binder = read(binder_path, BINDER)
    require_fragments(binder,
        'assert.deepEqual(local.sourceFullCurl, primal.fullCoefficient)',
        'assert.deepEqual(raw2, quadratic,',
        'assert.equal(mode(old.primaryFlatResidual, 2), undefined)',
        'assert.equal(assertOriginalFixedLiftPulsePath(G, f.path), true)',
        'assert.equal(source, G.sub(raw[j][part], principal?.[j][part] ?? G.zero))',
        'assert.equal(pull.mapped, f.bound.originalSource[j][part])')


def check_live_rows(directory):
    live = json.loads(read(directory / 'same-family-mode-two.json', HOSTED))
    assert live['prefix'] == 3 and live['completeForcedSeal'] is True
    assert len(live['full']['checks']) == 805 and all(row['pass'] is True for row in live['full']['checks'])
    keys = {f'{delta}:{sign}' for delta in range(5) for sign in (-1, 1)}
    pairs = {(key, m) for key in keys for m in (1, 2)}
    rows = live['full']['rows']
    assert len(rows) == 20 and {(row['key'], row['harmonic']) for row in rows} == pairs
    assert {row['system'] for row in rows} == set(range(20))
    ids = {row['id'] for row in live['full']['checks']}
    selected = []
    for row in rows:
        if row['harmonic'] != 2:
            continue
        assert row['raw'] == row['supported'] and row['principal'] is None
        assert len(row['H_w']) == 2
        for j in range(3):
            for part in ('real', 'imaginary'):
                assert f"actual-forcing-conjugate-{row['key']}-2-{j}-{part}" in ids
        selected.append({key: row[key] for key in ('key', 'system', 'raw', 'H_w',
                                                   'originalSource', 'projected')})
    assert len(selected) == 10
    return selected


def rational_geometry():
    # Pairs encode a+b*sqrt(2) in the exact quadratic field.
    def q(a, b=0):
        return Fraction(a), Fraction(b)

    def add(left, right):
        return q(left[0] + right[0], left[1] + right[1])

    def multiply(left, right):
        a, b = left
        c, d = right
        return q(a * c + 2 * b * d, a * d + b * c)

    def divide(left, right):
        a, b = right
        norm = a * a - 2 * b * b
        assert norm
        return multiply(left, q(a / norm, -b / norm))

    def dot(left, right):
        return add(multiply(left[0], right[0]), multiply(left[1], right[1]))

    vt, vr = (q(-1, 1), q(1)), (q(1), q(1, -1))
    D, Tg, L = q(4, -2), q(4, 1), q(4, -1)
    J = ((q(3), q(1)), (q(1), q(5)))
    assert dot(vt, vt) == dot(vr, vr) == D and dot(vr, vt) == q(0)
    for basis, eigenvalue in ((vt, Tg), (vr, L)):
        image = basis
        power = q(1)
        for _ in range(5):
            assert image == tuple(multiply(power, x) for x in basis)
            image = tuple(dot(row, image) for row in J)
            power = multiply(power, eigenvalue)
    P = [[divide(multiply(vr[i], vr[j]), D) for j in range(2)] for i in range(2)]
    assert tuple(dot(row, vt) for row in P) == (q(0), q(0))
    assert tuple(dot(row, vr) for row in P) == vr
    assert all(add(P[i][j], divide(multiply(vt[i], vt[j]), D)) == q(int(i == j))
               for i in range(2) for j in range(2))
    # On 1 < sqrt(2) < 3/2, the diagonal is positive and the off-diagonal
    # is negative. Removing the absolute values gives the exact columns.
    assert add(P[0][0], multiply(q(-1), P[1][0])) == q('1/2', '1/2')
    assert add(multiply(q(-1), P[0][1]), P[1][1]) == q('1/2')
    assert 1 < 2 < Fraction(3, 2) ** 2
    return {'dYColumnSums': ['(1+sqrt(2))/2', '1/2'],
            'dwColumnSum': 'ci*Tg^(-delta)*sqrt(2)',
            'fixedWOrder4PullbackFactor': '625/256',
            'includingWOrder4PullbackFactor': '81/16',
            'sourcePulsePathPremises': 'ci in (0,1], fixed label and representative, delta=0,...,4; '
                                       'R,Z,T unchanged and pulse point w admitted.'}


def derivative_inventory():
    counts = {order: 0 for order in range(5)}
    for alpha in product(range(5), repeat=5):
        order = sum(alpha)
        if order > 4:
            continue
        counts[order] += 1
        binary, ternary = 1, 1
        for a in alpha:
            binary *= sum(comb(a, b) for b in range(a + 1))
            ternary *= sum(comb(a, b) * comb(a - b, c)
                           for b in range(a + 1) for c in range(a - b + 1))
        assert binary == 2 ** order and ternary == 3 ** order
    assert list(counts.values()) == [1, 5, 15, 35, 70]
    # In the frozen label epsilon is constant. The first two columns
    # therefore use two-factor Leibniz; the other three use three.
    return {'fiveParameterMultiIndices': counts, 'multipliersAtOrder4': {
        'radial': {'epsilon': 32, 'inverseRadiusC4': 162},
        'azimuthal': {'one': 32, 'epsilon': 32, 'radialFastVr1C4': 162,
                      'radialFastVr2C4': 162},
        'axial': {'one': 32, 'inverseRadiusC4': 81, 'radialFastVr1C4': 162,
                  'radialFastVr2C4': 162}},
        'multipliersBeforeOrder4': 'Replace 16 by 2^j and 81 by 3^j at total order j.',
        'remainingAmplitudeFactor': 'B_(j+1)^2 from the complete positive first harmonic.',
        'comparisonIfAllWeightsBoundedByC4': [194, 388, 437],
        'originalUniformCoefficientAtOrder4': 1053}


def main():
    if not __debug__:
        raise RuntimeError('Exact source verification requires assertions.')
    p = ArgumentParser(description=__doc__)
    for name in ('hosted', 'binder', 'output'):
        p.add_argument(name, type=Path)
    a = p.parse_args()
    check_source(a.hosted, a.binder)
    result = {'schema': 'MathScope.N7.OriginalModeTwoPhaseReduction/1',
              'status': 'CONDITIONAL_ACTUAL_TEN_MODE_TWO_SOURCE_BOUNDS',
              'hostedRun': 44528954587, 'positiveSecondHarmonicRows': check_live_rows(a.hosted),
              'originalSourceSHA256': SOURCE_PINS, 'forcedReceiptSHA256': HOSTED,
              'firstCycleOverlayManifestSHA256': OVERLAY_MANIFEST, 'binderSHA256': BINDER,
              'pulsePullback': rational_geometry(), 'sourceDerivatives': derivative_inventory(),
              'sourceConditions': 'On the smooth fixed-label annulus, the complete positive '
                                  'amplitude is a harmonic curl and its full cylindrical divergence '
                                  'vanishes. The original lift retains Dr, Dz and the radial metric; '
                                  'the physical/natural derivative and native substitution semantics '
                                  'are hypotheses. If divergence is not zero, restore 2*d*U.',
              'scope': 'Conditional raw and unprojected pulled-back +2 forcing derivative bounds '
                       'from the actual first-correction receipt. Projection derivatives, evaluated '
                       'amplitude norms, Duhamel, other modes and final jets remain open.',
              'release': 'HOLD'}
    with a.output.open('x', encoding='utf8', newline='\n') as out:
        json.dump(result, out, indent=2)
        out.write('\n')
    print('PASS 10 same-live +2 systems, 5 lift powers and 126 multi-indices')


if __name__ == '__main__':
    main()
