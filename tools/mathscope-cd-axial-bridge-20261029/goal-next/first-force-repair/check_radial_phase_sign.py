"""Authenticate the actual phase sign and refute the unit bound on N1."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from math import comb, factorial, prod
from pathlib import Path
import gzip
import json
import sys


FULL_SHA = 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
MEAN_SHA = 'd0548a8520f7363294fd330aa332a79f32cb7a366c149b03a918ad3966915725'
NODES = 4456994
PHASE = {
    635059: ('multiply', [624061, 635058]),
    635058: ('exp', [635057]), 635057: ('multiply', [624041, 635056]),
    635056: ('multiply', [20, 635055]), 635055: ('ceiling', [635054]),
    635054: ('multiply', [20, 635053]), 635053: ('multiply', [623016, 635052]),
    635052: ('add', [635048, 635051]), 635048: ('multiply', [127, 635047]),
    635047: ('multiply', [135988, 635046]), 635046: ('add', [190, 622791]),
    635051: ('multiply', [20, 635050]), 635050: ('multiply', [24, 635049]),
    635049: ('log_positive', [635046]), 127: ('log_positive', [24]),
    624061: ('exp', [624060]), 624060: ('multiply', [624048, 624059]),
    624059: ('log_positive', [624050]), 624050: ('multiply', [622802, 624049]),
    624049: ('sqrt_positive', [622794]), 622794: ('exp', [622793]),
    622793: ('multiply', [20, 622792]), 622792: ('multiply', [127, 622791]),
    622798: ('exp', [622797]), 622797: ('multiply', [9, 622796]),
    622796: ('log_positive', [622794]),
    624048: ('multiply', [24, 624047]), 624047: ('add', [624044, 624046]),
    624044: ('multiply', [135988, 624042]), 624046: ('multiply', [20, 624045]),
    624045: ('multiply', [9, 624043]), 624043: ('rational', ['1', '100000']),
    135988: ('add', [1, 9]), 9: ('source_parameter', ['h']),
    624042: ('multiply', [623016, 624041]), 623016: ('inverse', [623015]),
    624041: ('log_positive', [624040]), 623015: ('log_positive', [300172]),
    624040: ('add', [474, 623065]), 623065: ('multiply', [20, 3622]),
    300172: ('add', [474, 3622]), 3622: ('sqrt_positive', [24]),
    623066: ('add', [1, 623065]), 1: ('rational', ['1', '1']),
    190: ('rational', ['-2', '1']), 24: ('rational', ['2', '1']),
    474: ('rational', ['4', '1']), 20: ('rational', ['-1', '1']),
    635060: ('multiply', [625153, 635058]), 625153: ('multiply', [624061, 625152]),
    625152: ('multiply', [624048, 625151]), 625151: ('multiply', [624049, 625150]),
    625150: ('inverse', [624050]),
}


def read_phase(first_dir):
    digest = sha256()
    selected = {}
    wanted = set(PHASE) | {622791, 622802}
    with gzip.open(first_dir / 'original-source-nodes.jsonl.gz', 'rb') as stream:
        header = stream.readline()
        digest.update(header)
        assert json.loads(header) == {'schema': 'MathScope.M3.FullNodesJSONL/1', 'node_count': NODES}
        for i, line in enumerate(stream):
            digest.update(line)
            if i in wanted:
                record = json.loads(line)
                selected[i] = record['op'], record['args']
    assert i + 1 == NODES and digest.hexdigest() == FULL_SHA
    assert wanted == selected.keys()
    for i, expected in PHASE.items():
        assert selected[i] == expected, (i, expected, selected[i])
    assert selected[622791][0] == selected[622802][0] == 'coordinate'
    return selected


def exact_comparisons():
    F = Fraction
    # Write log M's log(2) coefficient as n*(ell-2) - (n-h*kappa)*ell,
    # with n=(1+h)*rho_g. The surviving ell*h*kappa term has the opposite
    # sign when rewritten using log(Q)=-ell*log(2).
    log2_coefficients = { 'n*ell': 1 - 1, 'n': -2, 'h*kappa*ell': -(-1) }
    assert log2_coefficients == {'n*ell': 0, 'n': -2, 'h*kappa*ell': 1}
    assert 14**2 > 2 * 9**2 and 70**2 < 2 * 58**2
    assert 1 + 8002 * 10 > 4096  # H=exp(8002*T_*) > 1+8002*T_*.
    assert 2 * F(4097, 4096) * F(2, 3) < F(3, 2)
    # f(ell,H)=ell/(200000H) -(4/3)log(ell)-4 increases with ell
    # on ell>=4096H^2. Its value at that endpoint increases with H.
    assert F(1, 200000) - F(4, 3 * 4096**2) > 0
    assert F(4096, 200000) - F(8, 3 * 4096) > 0
    lower = F(4096**2, 200000) - F(4, 3) * 36 - 4
    assert lower > 31
    return {'strictLogCoefficientLowerBound': str(lower), 'logCoefficientExceeds': 31,
            'logQExponent': '-h/100000', 'positiveBandCoefficientAtMostOne': False}


def fixed_u_majorants():
    # Each term encodes a product of b and its first three derivatives,
    # times one radial derivative of f. Apply D_U=b*d/dr formally.
    terms = {((1, 0, 0, 0), 0): 1}
    normalized = []
    for order in range(4):
        bound = 0
        next_terms = {}
        for (powers, f_order), coefficient in terms.items():
            assert sum((j + 1) * p for j, p in enumerate(powers)) - 1 <= 2 * order
            assert f_order <= order
            bound += coefficient * prod(factorial(j)**p for j, p in enumerate(powers))
            if order == 3:
                continue
            increment = ((powers[0] + 1, *powers[1:]), f_order + 1)
            next_terms[increment] = next_terms.get(increment, 0) + coefficient
            for j, p in enumerate(powers):
                if p:
                    differentiated = list(powers)
                    differentiated[0] += 1
                    differentiated[j] -= 1
                    differentiated[j + 1] += 1
                    key = tuple(differentiated), f_order
                    next_terms[key] = next_terms.get(key, 0) + p * coefficient
        normalized.append(bound)
        terms = next_terms
    assert normalized == [1, 2, 7, 37]
    _, a, b, c = normalized
    ordinary = [1, 2 * a, 4 * b + 2 * a, 8 * c + 12 * b + 2 * a]
    assert ordinary == [1, 4, 32, 384]
    chi = [1, 2**17, 2**36, 2**55]
    rho = [2**15, 2**25, 2**38, 2**51]
    primitive = [2, 2**18, 2**37, 2**56]
    pressure = [2**17, 2**44, 2**76, 2**108]
    potential = [2**3, 2**21, 2**41, 2**62]
    for k in range(4):
        primitive_bound = sum(comb(k, j) * chi[j] * ordinary[k-j] for j in range(k+1))
        assert primitive_bound <= primitive[k]
        normalization = 1 + sum(comb(k, j) * rho[j] for j in range(k+1))
        assert normalization * primitive[k] <= pressure[k]
        radial_division = sum(comb(k, j) * factorial(j) for j in range(k+1))
        assert radial_division * (k+1) * primitive[k] <= potential[k]
    a1 = 3 * 5 * sum(comb(2, j) * chi[j+1] * ordinary[2-j] for j in range(3))
    assert a1 <= 2**60 and 1 + a1 <= 2**61
    return {'shellEnvelope': 'E=max(1,R_o,1/R_i)', 'ordinaryJConstants': ordinary,
            'primitiveT0': [[p, 3*k+1] for k, p in enumerate(primitive)],
            'normalizedPressureDifference': [[p, 3*k+2] for k, p in enumerate(pressure)],
            'TemporalPotential': [[p, 4*k+3] for k, p in enumerate(potential)],
            'C2RadialVelocity': 'epsilon*E^11*(2^41*||d_Z gamma_d||_C2 + 2^60*||gamma_d||_C2)',
            'C2AxialVelocity': '2^61*E^11*||gamma_d||_C2',
            'scope': 'Assumes ordinary smooth zero extensions of the actual inputs through the stated orders.'}


def main():
    parser = ArgumentParser(description=__doc__)
    for flag in ('repo', 'first-dir', 'mean-receipt', 'out'):
        parser.add_argument('--' + flag, type=Path, required=True)
    args = parser.parse_args()
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'first-scale-closure'))
    from check_first_scale_closure import LOCALIZATION_SHA, exact_parameter_tree, verify_qbig

    original, qbig = verify_qbig(args.repo)
    exact_parameter_tree(original)
    mean_bytes = args.mean_receipt.read_bytes()
    assert sha256(mean_bytes).hexdigest() == MEAN_SHA
    mean = json.loads(mean_bytes)
    assert mean['graphSHA256'] == FULL_SHA and mean['originalConservativeRoots'] == [4456772, 4456774, 4456776]
    phase = read_phase(args.first_dir)
    result = {
        'schema': 'MathScope.N6.RadialPhaseSignAndModeZeroScope/1',
        'graphSHA256': FULL_SHA, 'graphNodeCount': NODES, 'modeZeroIdentitySHA256': MEAN_SHA,
        'originalLocalizationSHA256': LOCALIZATION_SHA, 'localizationRoots': qbig,
        'phaseSourceRoots': {'Phi': 635059, 'dr': 624048, 'LambdaPower': 635058,
                             'epsilonExponentSubtraction': 624046, 'bandQ': 622794, 'epsilon': 622798,
                             'fastRadialDerivative': 635060,
                             'ell': [622791, phase[622791]], 'R': [622802, phase[622802]]},
        'literalSourceRecordsChecked': len(PHASE),
        'exactCoefficient': 'Lambda_g^(-delta) 2^(-2(1+h)rho_g) (ell-2)^(-2rho_g) Q^(-h/100000)',
        'domain': ['Q=2^(-ell)', '1/2<=q/Q<=2', '0<q<qBig', 'H=1/h>4096',
                   'qBig=2^(-(ellMinimum+10))', 'ell>=4096*H^2'],
        'inequalityReplay': exact_comparisons(),
        'inversePhaseEstimate': 'M^(-1)<=12*epsilon^(1/100000)*S_star^rho_g',
        'fixedUConditionalMajorants': fixed_u_majorants(),
        'uniformModeZeroLemma82Flatness': 'CONDITIONAL on actual all-order smooth weighted inputs and ordinary joins',
    }
    output = (json.dumps(result, indent=2) + '\n').encode()
    args.out.write_bytes(output)
    print('PASS actual signed radial exponent and fixed-N1 refutation: log(M) > 31')
    print(f'{sha256(output).hexdigest()}  {args.out.name}')


if __name__ == '__main__':
    main()
