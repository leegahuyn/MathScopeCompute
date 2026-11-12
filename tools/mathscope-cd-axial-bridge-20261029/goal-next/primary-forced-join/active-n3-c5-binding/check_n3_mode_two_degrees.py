"""Read the actual N3 C5 receipt and replay the mode-two C4 majorant arithmetic."""

from argparse import ArgumentParser
from dataclasses import asdict, dataclass, replace
from hashlib import sha256
import json
from math import comb
from pathlib import Path
import subprocess


RAW_SHA = '7b02f41ac647238d5a885296940a7b3ad4c20fa4a271d24c4db54b1064836b68'
MODULE_SHA = '40b3f1220b7ad1b9b05a11ae1378c864351e77e8efe7134ae1b78921fbab47ea'
UNITS = 100_000
KAPPA = 1
ORDER = 4


@dataclass(frozen=True)
class Bound:
    power: int = 0
    pole: int = 0
    epsilon_units: int = 0
    zeta_half_units: int = 0
    gaussian: int = 0


def scale(coefficient, x):
    assert coefficient > 0
    return replace(x, power=x.power + (coefficient - 1).bit_length())


def product(*xs):
    return Bound(*(sum(getattr(x, field) for x in xs) for field in Bound.__dataclass_fields__))


def total(*xs):
    assert len({(x.zeta_half_units, x.gaussian) for x in xs}) == 1
    return Bound(max(x.power for x in xs) + (len(xs) - 1).bit_length(), max(x.pole for x in xs),
                 min(x.epsilon_units for x in xs), xs[0].zeta_half_units, xs[0].gaussian)


def leibniz(a, b, order):
    return [total(*(scale(comb(m, j), product(a[j], b[m - j])) for j in range(m + 1))) for m in range(order + 1)]


def bind_receipt(path, source):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == RAW_SHA
    receipt = json.loads(raw)
    assert receipt['status'] == 'VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS'
    assert receipt['requested'] == {'prefix': 3, 'selectorThroughOrder': 4, 'familyC': 8, 'weightedTargetC': 6, 'primaryC': 5}
    assert receipt['stages'][-1]['nodeCount'] == 18_310_172
    assert receipt['source']['allConstantsFromSamePrivateFamily'] is True
    assert receipt['domain']['prefixOrder'] == 3 and receipt['domain']['prefixSharedByWholeRadialIntegral'] is True
    assert receipt['scope']['actualForcedInputWClassCertified'] is False
    assert len(receipt['nativeChecks']) == 9 and all(row['pass'] for row in receipt['nativeChecks'])
    assert source['sourceSHA256'] == MODULE_SHA
    assert [row['pole'] for row in receipt['targetRows']] == [3, 6, 9, 12, 15, 18, 21]
    primary, curl = [], []
    fields = {'primary': '1/2', 'potential': '1', 'curlRemainder': '1-kappa_s', 'homogeneousPressure': '1'}
    for j, row in enumerate(receipt['classRows']):
        assert row['order'] == j and row['inputBackgroundOrder'] == 8 and row['inputTargetOrder'] == 6
        for name, epsilon in fields.items():
            f = row['fields'][name]
            assert {key: f[key] for key in ('power', 'pole')} == source[name][j]
            assert f['epsilonExponent'] == epsilon and f['weight'] == 'sqrt(zeta)' and f['gaussian'] == 'P(v)'
            assert f['sourceStage'] == 'LOCAL_COEFFICIENT_BEFORE_AUXILIARY_HAAR_AVERAGE'
            assert type(f['constant']) is int and receipt['normRoot'] < f['constant'] < 18_310_172
        for name, epsilon, rows in (('primary', UNITS // 2, primary), ('curlRemainder', UNITS - KAPPA, curl)):
            f = row['fields'][name]
            rows.append(Bound(f['power'], f['pole'], epsilon, 1, 1))
    return receipt, primary, curl


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('receipt', type=Path)
    parser.add_argument('runtime', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    script = Path(__file__).with_name('read_degree.mjs')
    source = json.loads(subprocess.check_output(['node', str(script), str(args.runtime)]))
    receipt, leading, curl = bind_receipt(args.receipt, source)
    normal = [Bound(max(row['powers'][j] for row in source['normal'])) for j in range(ORDER + 1)]
    inv_normal = [Bound(**x) for x in source['invNormal'][:ORDER + 1]]
    assert [x.power for x in normal] == [16, 17, 18, 19, 20]
    assert [x.power for x in inv_normal] == [4, 44, 86, 130, 174]
    assert UNITS // 2 < UNITS - KAPPA
    amplitude = [total(l, r) for l, r in zip(leading, curl, strict=True)]
    tensor = leibniz(amplitude, amplitude, ORDER + 1)
    radial = [Bound(1, epsilon_units=-KAPPA) for _ in range(ORDER + 1)]
    radius = [Bound(1) for _ in range(ORDER + 1)]
    derivative = [leibniz(radial, tensor[1:], ORDER), leibniz(radius, tensor, ORDER)]
    tangent_remainder = leibniz(normal, curl, ORDER)
    carrier = leibniz(amplitude, tangent_remainder, ORDER)
    raw = []
    for j in range(ORDER + 1):
        radial_fast, radius_connection = [x[j] for x in derivative]
        # 2 from m, 2 from k <= 2*eps^-1/2, 3 from the normal contraction.
        phase = scale(12, product(carrier[j], Bound(epsilon_units=-UNITS // 2)))
        raw.append(total(tensor[j + 1], radial_fast, product(Bound(epsilon_units=UNITS), tensor[j + 1]),
                         scale(2, radius_connection), phase))
    projection = leibniz(leibniz(normal, normal, ORDER), inv_normal, ORDER)
    projection[0] = total(Bound(), projection[0])
    projected = [scale(3, x) for x in leibniz(projection, raw, ORDER)]
    # With delta=0 or 1, J_g has maximal column 1-norm 6 and D_geom>1.
    # On the pulse path xi(H_w)=xi(Y), v(H_w)=w. A Y derivative adds
    # only one constant xi chain factor, with no longitudinal contribution.
    assert 2 * 2 < 3 * 3 and max(3 + 1, 1 + 5) == 6
    pulled = [scale(6 ** j, x) for j, x in enumerate(projected)]
    assert all((x.epsilon_units, x.zeta_half_units, x.gaussian) == (UNITS - KAPPA, 2, 2) for x in raw + projected)
    result = {'schema': 'MathScope.N3PrimaryC5ModeTwoDegreeReadback/1',
              'status': 'VERIFIED_EXACT_DEGREE_PROPAGATION_CONDITIONAL_ACTIVE_SOURCE_APPLICATION',
              'rawNativeC5ReceiptSHA256': RAW_SHA, 'sourceDegreeModuleSHA256': MODULE_SHA,
              'normGraph': {'K': receipt['normRoot'], 'classRoots': [row['fields'] for row in receipt['classRows']]},
              'boundFormula': '(K*S_label)^power * delta_star^(-pole) * epsilon^(epsilon_units/100000) * zeta^(zeta_half_units/2) * P(v)^gaussian',
              'ownCoordinates': ['R', 'Z', 'T', 'xi', 'v'], 'orders': list(range(ORDER + 1)),
              'raw': list(map(asdict, raw)), 'projected': list(map(asdict, projected)),
              'selectedDeltaCases': [0, 1], 'pullbackCoordinates': ['R', 'Z', 'T', 'Y_0', 'Y_1', 'w'],
              'projectedAfterHw': list(map(asdict, pulled)),
              'pullbackWeight': 'P(w)^2 replaces P(v)^2 after the exact v(H_w)=w identity.',
              'phaseIdentity': '2*i*k*(n dot w_plus)*w_plus = -k*(n dot J)*w_plus, w_plus=(L+iJ)/2 and n dot L=0.',
              'assumptions': ['Actual same private current, target and Primary C5 objects; symbolic norm roots retain their graph namespace.',
                              'On the actual fixed-label chart and pulse, the checked source normal, radius, radial-fast and carrier bounds use the same K.',
                              'Bind the actual initialized supported m=2 root to its entire conservative own positive-pair quadratic before H_w, and bind H_w to unchanged xi and v=w.',
                              'The common-Y derivative conversion uses the two selected J_g cases, fixed nearest copy, and the exact original H_w transverse invariance. Inverse propagator integration and mapped gauge/curl are separate.'],
              'modeOne': 'Requires actual first-harmonic linear source and initialized mean-wave mixed derivatives; these bounds do not follow from the primary certificate alone.',
              'finalJets': '0/67', 'release': 'HOLD'}
    with args.output.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'rawC4': result['raw'][-1], 'projectedC4': result['projected'][-1],
                      'projectedAfterHwC4': result['projectedAfterHw'][-1],
                      'outputSHA256': sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
