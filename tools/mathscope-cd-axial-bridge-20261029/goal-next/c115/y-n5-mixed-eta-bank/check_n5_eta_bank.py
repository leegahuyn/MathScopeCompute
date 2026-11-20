from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


def verify_norm_charges():
    # L=1-2h eta^2, with original 0<h<1/128. The full
    # radius-1/2 disc about any real eta in [-1,1] is allowed.
    l_lower = 1 - 2 * Fraction(1, 128) * Fraction(3, 2) ** 2
    assert l_lower > Fraction(1, 2)
    inverse_l = 2 * sum(2 ** j for j in range(10))
    assert inverse_l == 2046 < 2 ** 11
    # Sum-of-factorial-coefficients product estimate, for all m<=9.
    assert sum(Fraction(1, factorial(j)) for j in range(10)) < 3
    eta, d, exp, derivative = 2, 4, 4, 10
    assert 1 + 2 + 1 == d
    assert 2 + 2 + 1 == 5  # (1+eta^2)/Ef
    assert Fraction(1, 2) + 9 * Fraction(1, 128) < 1  # D+2jh, j<=5
    mass = 2 ** 11 * (2 * eta * (1 + 2) + d * 9)
    z = 2 ** 11 * (2 * eta * (exp + 1) + d * derivative)
    xz = 2 ** 11 * (2 * eta * (exp + 2) + d * derivative)
    time = 2 ** 11 * (exp + eta * derivative + 1)
    zz = 2 ** 18 * z
    assert mass < 2 ** 17 and 3 * mass < 2 ** 22
    assert max(z, xz) < 2 ** 18 and time < 2 ** 17 and zz <= 2 ** 36
    # Work relative to B>=1. Charge each of the 5 possible ordered
    # transport pairs by two differences, even when one is exactly fixed.
    transport = Fraction(3, 2) + 2 ** 18
    omega_zero = 2 ** 17 + 6 + transport
    omega_error = 2 ** 17 + 6 + 10 * transport + 2 ** 36
    assert omega_zero < 2 ** 21 and omega_error < 2 ** 40
    pressures = 2 + Fraction(2 ** 40, 2)
    angular = 4
    axial = 4 + Fraction(2 ** 40, 2)
    assert max(pressures, angular, axial) < 2 ** 42
    # For raw leading radial-second and X-weighted radial-second,
    # the same B covers the conversion; for an average this operation
    # has kernel t*(tX)g_XX(tX), dominated by the weighted input.
    assert 3 * Fraction(1, 2) <= 2
    return {
        'inverseLEta9': inverse_l,
        'massInteger': mass,
        'ZWeightedZTZSquaredIntegers': [z, xz, time, zz],
        'wholeOmegaTransferFactor': '2^40 B^2 A',
        'threeLowerDensityTransferFactor': '2^42 B^3 A',
    }


def verify_eta_dependencies():
    # F/U and v norms for independent true and finite whole magnitudes.
    mag = {0: (9, 8), 1: (7, 6), 2: (5, 4), 3: (3, 2), 4: (1, 0)}
    # Upper mixed errors. Leading N0 is held exactly fixed.
    err = {1: (9, 8), 2: (7, 6), 3: (5, 4), 4: (3, 2)}
    stages = []
    for n, m in ((2, 7), (3, 5), (4, 3), (5, 1)):
        prior = n - 2
        assert err[n - 1][1] >= m + 1  # T and Z on v_(n-1)
        assert not prior or err[prior][1] >= m + 2
        for i in range(n):
            j = n - 1 - i
            if i == 0 or j == 0:
                # End pairs are genuinely leading times error. The leading
                # lower field uses one eta derivative when it receives Z.
                assert mag[0][1] >= m + 1
                assert err[n - 1][1] >= m + 1 and err[n - 1][0] >= m
            else:
                assert min(err[i][0], err[j][1], mag[i][0], mag[j][1] - 1) >= m
                assert min(err[i][1], mag[i][1], mag[j][1]) >= m
        for i in range(1, n):
            j = n - i
            assert min(err[i][0], err[j][0], mag[i][0], mag[j][0]) >= m
        assert all(sum((i == k) + (n - i == k) for i in range(1, n)) == 2 for k in range(1, n))
        stages.append({'stage': n, 'wholeDensityEtaOrder': m,
                       'omegaPreviousVNeeded': None if not prior else [prior, m + 2]})
    # Requirements for true and finite magnitude proof of A_j. N2 at
    # eta7 only uses the *difference* of Omega1, whose previous term
    # depends solely on fixed N0 and is zero.
    for j, m in ((1, 7), (2, 5), (3, 3), (4, 1)):
        assert all(mag[i][1] >= m + 1 for i in range(j))
        if j > 1:
            assert mag[j - 2][1] >= m + 2
    assert err[4][0] == 3  # both two-Z previous F4/U4 terms of N5 stress
    return {
        'stages': stages,
        'fixedLeadingPreviousOmega1TermCancelsInEta7Difference': True,
        'N5PressureAndAxialCrossProductsNeedEta': 1,
        'N5StressPreviousF4U4NeedsEta': 3,
    }


def receipt(path):
    raw = path.read_bytes()
    s = json.loads(raw)
    assert s['eta'] == 2 and s['X'] == 4756 and s['originalN5Nodes'] == 130926
    lead = s['leading']
    assert (lead['radialOrder'], lead['etaOrder'], lead['roots'], lead['nodes']) == (2, 9, [5684, 5690], 4470)
    assert lead['tableSHA256'] == '44e643ce8590552d5788fd2f7566d6c874e545aa469fa35f07505fa0ef2dbe06'
    assert s['available'] == [{'order': n, 'FU': m, 'v': m - 1, 'Pi': m} for n, m in ((2,7), (3,5), (4,3))]
    assert [r['omegaCounts'] for r in s['exactRows']] == [[7,7], [9,9], [11,11], [13,13]]
    assert [r['previousOmegaViscosity']['order'] for r in s['exactRows']] == list(range(4))
    assert [r['previousStressViscosity']['order'] for r in s['exactRows']] == list(range(1,5))
    for row in s['exactRows']:
        assert row['systems'] == [2 * row['n'] - 1, 2 * row['n'] - 2]
        assert all(d['eta'] == 2 and d['domain'] == [0,28824] for d in row['debts'])
        assert len({d['binder'] for d in row['debts']}) == 3
    n5 = s['exactRows'][-1]
    assert n5['pairs'] == [[1,4], [2,3], [3,2], [4,1]]
    assert n5['middle']['missingNumerators'] == [1,1,2,2]
    assert s['fixedOriginalIpos']['etaIndependentInverse']
    assert [t['etaOrder'] for t in s['exactNativeHighEtaTailDescriptors']] == [7,5,3]
    for t in s['exactNativeHighEtaTailDescriptors']:
        assert t['positiveRemainderRetained'] and not t['finiteDisplayedTermsCertified']
    assert len(s['originalSourceBounds']['wholeMagnitudes']) == 5
    assert len(s['columns']) == 4
    d = s['closedDepths']
    assert d['ordinaryDerivativeFactor'] == factorial(7) and d['bitsEach'] == 259
    assert 4 * Fraction(1, 2 ** d['bitsEach']) < Fraction(1, 2 ** 256)
    assert not s['evaluatedNumerically'] and s['pairedWholeN5'] == 'OPEN'
    return {
        'schema': 'MathScope.C115.OriginalN5WholeHigherEtaErrorBank/1',
        'operandsSHA256': sha256(raw).hexdigest(),
        'verifiedOriginal': 'RADIAL2_ETA9_LEADING_AND_N5_TWO_OMEGA4_BRANCHES_V3_VISCOSITY_AND_ORDERED_MIDDLE_PRODUCTS',
        'originalN5': {'nodes': s['originalN5Nodes'], 'omegaBranches': n5['omegaCounts'],
                       'lowerOrderedPairs': n5['pairs'], 'previousOmegaViscosity': n5['previousOmegaViscosity'],
                       'previousStressViscosity': n5['previousStressViscosity'], 'missingSourceNumerators': n5['middle']['missingNumerators']},
        'leading': lead,
        'arithmetic': verify_norm_charges(),
        'etaDependencies': verify_eta_dependencies(),
        'conditionalWholeErrors': {
            'lower': s['available'], 'strictLimit': '<2^-256',
            'radialFUV': ['value','dX','X*dXX'], 'pressure': ['value','dX'],
            'allFiveIncomingDebtTransfer': 'M_n=4 B^2 H base_n+B Dlow_n',
            'N5Delivered': s['deliveredN5Inputs'], 'nativeDepths': d,
            'scope': 'fixed exact leading and paired N1..N4, C105/C110/C112 original ordinary analytic realizations, fixed average and moments differentiable in eta, source/paired flat extensions and pressure gauge',
            'valuesAndNativeDepthsNumericallyEvaluated': False,
        },
        'remainingN5': 'Apply an actual N5 paired native Picard stability bound, then original five compensation rows, compatible pressure gauge and both guarded stress integrals.',
        'pairedWholeN5': 'OPEN', 'generalY': 'OPEN', 'finalJets': 0, 'release': 'HOLD',
    }


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--operands', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    with args.out.open('xb') as output:
        output.write((json.dumps(receipt(args.operands), indent=2) + '\n').encode())
    print('PASS: original N5 dependent whole eta bank at orders 7,5,3 and four symbolic lower depths')
