"""Exact sharp cutoff-energy transfer using first derivatives of velocity and potential."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


LATE_SHA = '1fa33500726728505f74ed51aae5e113f4c10c452c5faa7a4f823d5a6d2d6a36'


def plus(*exponents):
    """Add affine powers (constant, coefficient of h)."""
    return tuple(sum(ps) for ps in zip(*exponents, strict=True))


def times(factor, exponent):
    return tuple(factor * part for part in exponent)


def proof(source_bytes):
    assert sha256(source_bytes).hexdigest() == LATE_SHA
    source = json.loads(source_bytes)
    assert source['status'] == 'VERIFIED_SOURCE_BINDERS_AND_EXACT_CONDITIONAL_LATE_SPATIAL_GATE'
    assert source['cutoffConstants']['first'] == 60 and source['cutoffConstants']['second'] == 5100
    assert all(row['actualK'] is None for row in source['stages'])

    h = (Q(0), Q(1))
    half = (Q(1, 2), Q(0))
    A = plus(half, h)
    D = plus(half, times(-1, h))
    spatial = plus(half, times(Q(1, 2), h))
    loss = plus(spatial, times(-1, D))
    assert loss == (0, Q(3, 2))
    assert times(2, loss) == (0, 3)
    # After keeping the normalized axial measure (32), dyadic conversion
    # of q to tau0 (4)^2, and lower force scale with 4A<3, B_h>1.
    energy_coefficient = 32 * 4**2 * 3
    assert energy_coefficient == 1536
    assert 120 == 2 * source['cutoffConstants']['first']
    assert 10200 == 2 * source['cutoffConstants']['second']
    assert 120 > Q(10200, 120) == 85
    normalized_energy_factor = energy_coefficient * (Q(3, 4) + 18)
    assert normalized_energy_factor == 28800 < 2**15
    assert Q(normalized_energy_factor, 2**42) < Q(1, 2**27) < Q(1, 2**26)

    stages = []
    for j in range(1, 5):
        gain = times(Q(j, 10), h)
        potential = plus(half, times(-1, A), gain)
        velocity = plus(potential, times(-1, spatial))
        gradient = plus(velocity, times(-1, spatial))
        potential_gradient = plus(potential, times(-1, spatial))
        # Axial cutoff terms before division by the target powers.
        weighted_terms = (
            (potential, times(-1, D), velocity, loss),
            (velocity, times(-1, D), gradient, loss),
            (potential_gradient, times(-1, D), gradient, loss),
            (potential, times(-2, D), gradient, times(2, loss)),
        )
        assert all(plus(field, cutoff, times(-1, target)) == spare
                   for field, cutoff, target, spare in weighted_terms)
        assert all(-2 <= a <= 0 and -2 <= a + b/64 <= 0
                   for a, b in (velocity, gradient))
        v_weight = plus(A, velocity)
        g_weight = plus(A, half, gradient)
        relative = [plus(times(2, factor), times(2, h)) for factor in (v_weight, g_weight)]
        assert relative == [(0, 1+Q(j, 5)), (0, Q(j, 5))]
        stages.append({'stage': j,
                       'velocityPower': list(map(str, velocity)),
                       'velocityGradientPower': list(map(str, gradient)),
                       'potentialPower': list(map(str, potential)),
                       'potentialGradientPower': list(map(str, potential_gradient)),
                       'sourceUniformEndpointsAvailable': 0})

    return {
        'schema': 'MathScope.N7.UncutVelocityPotentialSharpBudget/1',
        'status': 'VERIFIED_EXACT_CONDITIONAL_UNCUT_FIRST_DERIVATIVE_ENERGY_TRANSFER',
        'cutoffReceiptSHA256': LATE_SHA,
        'spatialCost': '1/2+h/2', 'axialCost': '1/2-h',
        'cutoffSparePowerEachDerivative': '3*h/2',
        'definitions': {'d': 'tau0^h', 'T': '2^-21*Xb^-2*tau0^(-j*h/10)'},
        'spatialInputs': ['U0', 'U1', 'A0', 'A1'],
        'weightedVelocityUpper': 'U0+120*d^(3/2)*A0',
        'weightedGradientUpper': 'U1+120*d^(3/2)*(U0+A1)+10200*d^3*A0',
        'relativeEnergyUpper': '1536*Xb^4*tau0^(j*h/5)*(3*d*(weightedVelocityUpper)^2+18*(weightedGradientUpper)^2)',
        'sufficientCaps': {'U0': 'T/(4*sqrt(d))', 'U1': 'T/4',
                           'A0': 'T/(480*d^2)', 'A1': 'T/(480*d^(3/2))'},
        'separateCapPremise': '120*d<=1',
        'certifiedRelativeEnergyAtCapsStrictUpper': '2^-27',
        'stageAllocations': stages,
        'analyticPremises': ['Physical curl plus direct uncut field identity on whole K',
                             'Same axisymmetric total cutoff, radial plateau and original flat zero extension',
                             'Source-pinned full-domain pointwise bounds on U0,U1,A0,A1',
                             '0<h<1/64, q/tau0 in [1/2,2], Xb>1, B_h>1'],
        'scope': 'Exact transfer and explicit amplitude caps; source numerical endpoints remain open.',
        'N706': 'OPEN', 'N805': 'OPEN', 'finalJets': 0, 'release': 'HOLD',
    }


if __name__ == '__main__':
    assert __debug__
    cli = ArgumentParser(description=__doc__)
    cli.add_argument('cutoff', type=Path)
    cli.add_argument('output', type=Path)
    args = cli.parse_args()
    result = proof(args.cutoff.read_bytes())
    with args.output.open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
    print('PASS four inputs, restored axial epsilon reserves, exact 28800/2^42 relative energy cap')
