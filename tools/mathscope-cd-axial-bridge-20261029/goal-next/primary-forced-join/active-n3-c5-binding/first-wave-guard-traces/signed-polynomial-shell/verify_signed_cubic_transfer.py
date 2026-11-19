"""Compose the actual outer Signed normal transfer and its source premises."""

import argparse
from fractions import Fraction
from hashlib import sha256
import json
from math import ceil
from pathlib import Path


PINS = {
    'signed-shell/signed-shell.json': '5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308',
    'angular-order-one-shell/transport/stress-transport.json': '3667d24bfaebfa135a019d7444d661286aa5e79fdb036e553b30e5b69e8138be',
    'angular-order-one-shell/transport/terminal-transport-bounds.json': 'eb94dc1483c3bce65eedd923fe157b1715d8f5fd790624a930517d3fabb28b98',
    'weighted-haar-shell/gaussian/gaussian-shell.json': '16906cc8b40c719d9c2de416490499c632df9a59376378b313831ef93868144e',
}
OUTER = 'research-ide/mathscope-m2/navier/actual-outer-covariance-flat-extension.mjs'
OUTER_PIN = 'd0a991f5e789aae7aa35dd8c18b9a82d9be40b8f31955ce9f166b108aef00c0c'


def read_pinned(path, pin):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == pin, path
    return data


def inverse_factor_polynomials():
    # If F(d)=exp(2/d^2)*d^(3/2), then D_d^j F = F*d^(-3j) P_j(d^2).
    result = [[Fraction(1)]]
    for order in range(3):
        current = result[-1]
        derivative = [Fraction(0)] * (len(current) + 1)
        for degree, coefficient in enumerate(current):
            derivative[degree] -= 4 * coefficient
            derivative[degree + 1] += (Fraction(3, 2) - 3 * order + 2 * degree) * coefficient
        result.append(derivative)
    assert [row[0] for row in result] == [1, -4, 16, -64]
    return result


def signed_primitive_rows(signed, pole):
    orders = {'M': 0, 'M_R': 1, 'M_RR': 2}
    primitive_poles = [pole - 3 + 3 * order for order in range(4)]
    summaries = []
    for row, weight, body, haar in zip(signed['actualSigmaRows'], (2, 1),
                                       (21999641, 22000464), (21999624, 22000447), strict=True):
        assert row['weight'] == weight and row['body'] == body
        assert row['normalizedHaarEAtBoundRadius'] == haar
        assert row['fixedLimits'] == [17743711, 17743713]
        assert not row['outerWholeMomentZeroRequired']
        normalized = []
        for order, derivative in enumerate(row['collarNormalDerivatives'], 1):
            terms = []
            for term in derivative:
                powers = dict(term['powers'])
                radial_pole = -powers.pop('R', 0)
                (role, degree), = powers.items()
                assert degree == 1 and radial_pole >= 0
                gaussian_pole = primitive_poles[0] if role == 'Sigma' else pole + 3 * orders[role]
                assert gaussian_pole <= primitive_poles[order]
                terms.append({'role': role, 'coefficient': str(abs(Fraction(term['coefficient']))),
                              'inverseR': radial_pole, 'poleBeforeCommonBound': gaussian_pole})
            assert max(term['poleBeforeCommonBound'] for term in terms) == primitive_poles[order]
            normalized.append(terms)
        summaries.append({'sigma': row['nativeApplication'], 'body': body, 'haar': haar, 'weight': weight,
                          'constantS0': f'C0*Rmax^{weight+1}/(2*Rmin^{weight}*a)',
                          'derivativeConstantsAfterS0': normalized})
    return summaries, primitive_poles


def verify(goal, runtime):
    parent = goal / 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces'
    signed, stress, transport, gaussian = [
        json.loads(read_pinned(parent / path, pin)) for path, pin in PINS.items()
    ]
    outer = read_pinned(runtime / OUTER, OUTER_PIN).decode()
    for text in (
        'flatWeight=G.mul(flat,G.pow(delta,-3))',
        'sqrtExponential=G.exp(G.neg(G.mul(q(2),G.pow(delta,-2))))',
        'halfPower=G.exp(G.mul(q(-3,2),G.log(delta)))',
        'positiveSquareRoots=W.map(x=>G.mul(sqrtFlat,G.sqrt(x)))',
        'normalizedWeightLower=G.div(G.mul(c.kappa,tauLower),G.mul(q(64),massUpper))',
        'rawActualForwardMomentTargetRetained:true',
    ):
        assert outer.count(text) == 1, text

    assert gaussian['envelope']['outer'] == 'x=log(Xb/X), a=4, b=t1^2'
    assert gaussian['envelope']['inner'] == 'x=log(X/Xa), a=t1^2, b=4'
    assert signed['actualGeometry']['formula'] == 'R^2/(2*s)'
    assert signed['actualGeometry']['sFreeSlots'] == ['Z', 'T']
    assert signed['exactOriginalShell']['Xb'] == 28826
    assert signed['sourceBoundCollars']['outer'] == 'exp(2)*X0Imean <= X < Xb: chi=1 and rho=0'
    flux = stress['exactAngularFlux']
    assert flux['rawETheta'] == 21999622 and flux['sourcePrimitives']['wholeAngularMoment'] == 117072
    assert flux['derivativeRemainderIntervalTerms'] == 0
    assert stress['correctedExceptionalPhysicalOrder'] == 1
    rational = transport['exponentsAndConstants']
    assert rational['oppositeExponentUpper'] == '1/50176' and rational['deltaUpper'] == '1/4'
    source_poles = [int(row.rsplit('^(-', 1)[1][:-1]) for row in transport['threeRadialBounds']]
    assert source_poles == [6, 9, 12]

    # At d<=1/4 and width>2, d/(width-d)<=1/7. The original t1<1/128.
    slope_margin = Fraction(63, 16) + 2 * Fraction(1, 128) ** 2 * Fraction(1, 7) ** 3
    assert slope_margin < 4
    assert Fraction(64, 16) == 4  # Any positive opposite term makes p=64 exceed this test at d=1/4.
    outer_controls, sigma_poles = signed_primitive_rows(signed, source_poles[0])
    potentials = signed['actualSignedLinearTransfer']
    assert [row['sameTargetY'] for row in potentials] == [17733801] * 3 + [17733805] * 3
    assert [row['samePositiveAmplitude'] for row in potentials] == [17733826] * 3 + [17733827] * 3
    assert all(row['inverseAmplitudePower'] == -1 and row['linearSigmaApplications'] == [22001223, 22001224]
               for row in potentials)
    inverse_jets = inverse_factor_polynomials()
    signed_jets = []
    for order in range(4):
        # Leibniz also allows fewer than order derivatives to hit Sigma and F.
        poles = [sigma_poles[i] - Fraction(3, 2) + 3 * j
                 for i in range(order + 1) for j in range(order - i + 1)]
        pole = max(poles)
        gaussian_series_term = ceil((pole + 2) / 2)
        assert 2 * gaussian_series_term - pole >= 2
        signed_jets.append({'order': order, 'signedPole': str(pole), 'GaussianSeriesTerm': gaussian_series_term})
    assert [row['signedPole'] for row in signed_jets] == ['3/2', '9/2', '15/2', '21/2']
    return {
        'status': 'VERIFIED_EXACT_SIGNED_POLE_PROPAGATION_CONDITIONAL_SOURCE_ENVELOPES',
        'inputPins': {**PINS, OUTER: OUTER_PIN},
        'outerOriginalCutoff': {'Xb': 28826, 'maximumDelta': '1/4', 'minimumWidth': 2,
                                'maximumGuaranteedPole': 63, 'worstSlopeMarginLeft': str(slope_margin),
                                'requiredAtMost': 4, 'physicalJacobian': 'abs(dR/dd)=R/2'},
        'genericSmallerCollar': {'dAtMost': 'min(1/4,width/2,a/(p+1),width*a/(16*(a+b)))',
                                 'requiredAtMost': 'a', 'upperProof': 'p*d^2<=a/4 and 2*b*(d/(width-d))^3<=a/4'},
        'exactSignedTargets': [row['body'] for row in potentials],
        'sameActualTargetY': [17733801, 17733805],
        'signedPrimitiveSources': outer_controls,
        'isolatedOriginalAngularContribution': {
            'actualRawETheta': 21999622, 'actualHaarTheta': 21999624,
            'positiveAmplitudeFactor': 'exp(-2/d^2)*d^(-3/2)*sqrt(W)',
            'oppositeEndFactorKept': True,
            'residualPoles': source_poles, 'sigmaPoles': sigma_poles,
            'inverseFlatFactorPolynomialCoefficients': [[str(c) for c in row] for row in inverse_jets],
            'signedJets': signed_jets,
            'result': 'On the admitted outer ray, the isolated contribution is O(sqrt(zeta)*d^(-pole)), hence O(d^2) in every order 0 through 3.',
        },
        'conditions': [
            'Original outer source terminal heat, cutoff, ordinary positive-radius calculus, exterior zero support of the input contribution, and C85 actual B norm bounds.',
            'Each actual Signed target must agree with its factored outer target on the same live chart, with normalized W positive and ordinary C3 bounds on remaining cofactors divided by sqrt(W).',
            'The proof concerns R derivatives at fixed Z,T, label, and fast arguments. Full mixed differentiability, interval jet values and exact endpoint moment restoration have separate source obligations.',
        ],
        'scope': {'actualCompleteWeightedHaarResidual': 'OPEN', 'isolatedSignedContribution': 'CONDITIONAL',
                  'wholeAngularMoment': 'OPEN', 'finalJets': 0, 'release': 'HOLD'},
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for option in ('goal', 'runtime', 'out'):
        parser.add_argument('--' + option, type=Path, required=True)
    args = parser.parse_args()
    if not __debug__:
        parser.error('Python assertions must be enabled')
    receipt = verify(args.goal, args.runtime)
    with args.out.open('x', encoding='utf-8', newline='\n') as output:
        json.dump(receipt, output, indent=2)
        output.write('\n')
    print(receipt['status'])
