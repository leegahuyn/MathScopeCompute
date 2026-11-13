"""Check fixed-label physical operator scaling and generate a symbolic Cartesian factor."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    'mathscope-m3/navier/source-global-angular.mjs': '4e9c3ea67b124a953856f83d0aca0dcfec4b01a245043424de2bb035b8d902ca',
    'mathscope-m3/navier/source-global-band.mjs': 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
    'mathscope-m3/navier/source-harmonic-assembly.mjs': '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20',
}


def sha(path):
    return sha256(path.read_bytes()).hexdigest()


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument('endpoint_bounds', type=Path)
    p.add_argument('endpoint_bounds_sha256')
    p.add_argument('original_runtime', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    assert sha(args.endpoint_bounds) == args.endpoint_bounds_sha256
    bounds = json.loads(args.endpoint_bounds.read_bytes())
    assert bounds['status'] == 'VERIFIED_AFFINE_ENDPOINT_DEGREE_PROPAGATION_CONDITIONAL_SOURCE_NORM_JOIN'
    assert all(sha(args.original_runtime / path) == digest for path, digest in PINS.items())
    A, D, h, half, one = (Q(1, 2), Q(1)), (Q(1, 2), -Q(1)), (Q(0), Q(1)), (Q(1, 2), Q(0)), (Q(1), Q(0))
    add = lambda a, b: tuple(x + y for x, y in zip(a, b, strict=True))
    minus = lambda a, b: tuple(x - y for x, y in zip(a, b, strict=True))
    assert minus(half, h) == D and add(half, h) == A
    assert minus(half, h) == D  # Q^-1/2 epsilon equals Q^-D.
    assert minus(add(one, h), h) == one  # normalized time slow coefficient epsilon.
    assert minus(minus(half, A), half) == minus((Q(0), Q(0)), A)  # Potential curl has velocity scale.

    # Bound the physical differential operator after stripping the exact
    # Q prefactors. U is one source-dependent upper bound on each required
    # ordinary coefficient derivative through degree 3. Its inventory below
    # distinguishes phase terms, basis terms, and slowly varying factors.
    # Five nonzero coefficient derivatives at each step; up to eleven scalar
    # summands after trigonometric and phase/basis connections are expanded.
    terms, directions = 12, 6
    rows = []
    for order in range(1, 5):
        # After j products there are at most j coefficient factors and one
        # differentiated input. The next partial can hit any existing one.
        multiplicity = 1
        for j in range(order):
            multiplicity *= terms * (j + 1)
        rows.append({'totalOrder': order, 'maximumTerms': multiplicity,
                     'operatorCoefficientPower': order, 'maxInputDerivativeOrder': order})
    assert rows[-1]['maximumTerms'] == 12 ** 4 * 24
    result = {
        'schema': 'MathScope.ActiveN3ModeTwoFixedLabelPhysicalTransport/1',
        'status': 'VERIFIED_EXACT_PHYSICAL_SCALES_AND_CONDITIONAL_CARTESIAN_TRANSPORT_FORMULA',
        'sourcePins': PINS, 'endpointBoundsSHA256': args.endpoint_bounds_sha256,
        'coordinateCount': directions, 'coordinates': ['R', 'Z', 'T', 'Y0', 'Y1', 'theta'],
        'normalizedOperators': {
            'Dx1': 'cos(theta) Dr - sin(theta) (1/R) partial_theta',
            'Dx2': 'sin(theta) Dr + cos(theta) (1/R) partial_theta',
            'Dx3': 'Dz', 'Dt': 'Time',
            'Dr': 'partial_R + a_fast*(vr0*partial_Y0+vr1*partial_Y1)', 'Dz': 'epsilon*partial_Z',
            'Time': '-epsilon*partial_T + ci*(vt0*partial_Y0+vt1*partial_Y1)',
        },
        'physicalScale': 'Q^(-j_space/2-j_time)*epsilon^(-j_time) times the fixed label physical field scale',
        'phaseAndBasisRule': 'For e^(2ik Phi) times cylindrical coefficient use D+i*2k*(D Phi). For vector components also differentiate e_r,e_theta using partial_theta e_r=e_theta and partial_theta e_theta=-e_r.',
        'coefficientSupremumU': {
            'definition': 'max(1, sup of absolute ordinary derivatives through order 3 of every scalar term coefficient)',
            'operands': ['1', 'a_fast*vr0', 'a_fast*vr1', 'R^-1', 'epsilon', 'ci*vt0', 'ci*vt1',
                         '2k*n_r', '2k*n_theta', '2k*n_z', '2k*Time(Phi)'],
            'trigonometry': 'Each cos(theta) and sin(theta) ordinary derivative is bounded by one. U is taken for the scalar coefficients with the trigonometric factor already attached where present.',
            'status': 'OPEN_SOURCE_BOUND_FOR_TIME_PHASE_AND_FINAL_CARTESIAN_COEFFICIENT_SUPREMA',
        },
        'rows': rows,
        'sufficientLocalMajorant': 'For order j use maximum endpoint bound over orders 0..j times maximumTerms*U^j, then multiply by the exact Q/epsilon and field factors. A real signed pair costs at most a further factor 4 in component magnitude.',
        'domain': 'One smooth fixed own-label/nearest-copy chart on admitted annulus and pulse. The physical chart is fixed during derivatives. Indexed joins and all other sources remain separate.',
        'activeFrameBoundChecked': False, 'finalCartesianJetIntervals': 0, 'finalJets': '0/67', 'release': 'HOLD',
    }
    with args.output.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'SHA256': sha(args.output)}))


if __name__ == '__main__':
    main()
