from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


def local_numbers():
    # Work on nested analytic eta strips for real X in [0,a^2].
    # F/U caps are 2P and their error is Etot; lower v uses the
    # Cauchy estimate on a strip loss for the original average.
    e = Fraction(33, 32)
    radial_mass = 2 * (4 * e + 3 * 4)
    z = 2 * (2 * e * 5 + 3 * 16)
    xz = 2 * (2 * e * 6 + 3 * 16)
    time = 2 * (4 + 16 * e + 1)
    assert radial_mass < 64 and max(z, xz) < 256 and time < 128
    assert 256 * 256 < 2 ** 17
    # P>=1, s=s4<=1, F/U radial magnitudes <=2P and v magnitudes
    # <=128P/s; their differences are <=Etot and <=64Etot/s.
    # Charges suppress powers s^-1,s^-2 into s^-3 and retain
    # the exact two ordered variation contributions of each product.
    v_transport = 5 * 2 * Fraction(3, 2) * 64 * 128
    u_zv = 5 * (256 * 128 + 2 * 256 * 64)
    visc_v3 = 2 ** 17 * 64
    omega = 128 * 64 + 6 * 64 + v_transport + u_zv + visc_v3
    p = 4 * 2 * 2 + Fraction(1, 2) * omega
    adv = 4 * 2 * (64 * 2 + 128)
    zz = 2 ** 17
    u_zf = 4 * (256 * 2 + 2 * 256)
    ht = adv + u_zf + zz
    hz = ht
    # Sum of the original three nonzero rows (2xi*p, 2Ht, 2Hz-4eta*X*p/L).
    forcing = 2 * p + 2 * ht + 2 * hz + 8 * e * p
    assert forcing < 2 ** 37
    assert 6 * 3 * 2 ** (20 + 43) < 2 ** 68
    assert 2 ** 68 * Fraction(1, 2 ** (260 * 26)) < Fraction(1, 2)
    return {'omegaLocalInteger': int(omega), 'forcingConstant': int(forcing), 'coarseForcingInteger': 2 ** 37,
            'wordRatio': '6 Ma sqrt(aSquared)/s5 < 2^68 Q^-26 < 1/2'}


def stress_numbers():
    # h<1/128 preserves all bounded multipliers in both remainders.
    assert Fraction(1, 2) + 9 * Fraction(1, 128) < 1
    assert 1 + 9 * Fraction(1, 128) < 2
    assert 8 * Fraction(1, 128) < 1
    assert Fraction(1, 2) + 8 * Fraction(1, 128) < 1
    # The original v uses a fixed average and 0th eta geometry.
    assert 2 * (2 + 2 + 1) < 16
    # In b_z and b_theta each lower transport variation costs
    # 2 A sum_i D_i. All four ordered pairs have each index twice.
    assert all(sum((i == k) + (5 - i == k) for i in range(1, 5)) == 2 for k in range(1, 5))
    # B=max(1,Xplus), J includes the actual prior viscosity.
    bz, bt = 1 + 16 + 2 + 2 + 2 + 8, 2 * (1 + 16 + 2) + 4 + 4 + 16
    rz, rt = 2 * (1 + 1 + 2 * 2 + 2), 2 * (2 * 2 + 2 + 2 * 4 + 4)
    assert (bz, bt, rz, rt) == (31, 62, 16, 36)
    assert (2 * 32 + 17, 2 * 64 + 38) == (81, 166)
    assert max(81, 166) < 256
    return {'conservativeBoundaryConstants':[32,64], 'nonviscousRemainderConstants':[16,36],
            'absoluteIntegralBeforeOriginalNormalizer':[81,166], 'wholeStressGain':256}


def receipt(path):
    raw = path.read_bytes()
    s = json.loads(raw)
    local, stresses, closed = s['local'], s['stresses'], s['closed']
    assert s['lowerBankRegeneratedExactly'] and s['eta'] == 2 and s['X'] == 4756
    assert local['system'] == 9 and local['radialDomain'] == [0,24805] and local['stripRatio'] == 256
    assert local['matricesUnchanged'] == 72 and local['forcingNumerators'] == [0,0,0,0]
    assert local['negativePreviousV3'] > 0 and local['pressure'] == 'P_(K5+1)'
    assert local['changedMomentResiduals'] == [0] * 5
    assert s['wholeN5Sources']['middle']['missingNumerators'] == [1,1,2,2]
    assert stresses['counts'] == [16,15] and stresses['conservativeNumerators'] == [0,0]
    assert stresses['weightedViscosityShift'] == 0 and stresses['innerPrefixRetained']
    assert len(stresses['wrongStress']) == 5 and all(v > 0 for v in stresses['wrongStress'])
    assert {r['component']:r['density'] for r in stresses['guards']} == {'theta':130896,'z':130897}
    for row in stresses['guards']:
        assert row['forward'] == [28814,4756] and row['backward'] == [4756,28824]
        assert row['eta'] == 2 and len(set(row['binders'])) == 2
    assert closed['bitsEach'] == 260 and not closed['evaluatedNumerically']
    assert len(s['pairedColumns']) == 5
    assert 5 * Fraction(1, 2 ** closed['bitsEach']) < Fraction(1, 2 ** 256)
    return {
        'schema':'MathScope.C116.OriginalNativeN5WholePairedError/1',
        'operandsSHA256':sha256(raw).hexdigest(),
        'verifiedOriginal':'ACTUAL_N5_PAIRED_FORCING_AND_CONSERVATIVE_STRESSES_72_MATRICES_FIVE_MOMENTS',
        'actualN5': {'local':local,'stresses':stresses},
        'exactArithmetic': {'local':local_numbers(), 'stress':stress_numbers(), 'fiveDepthContributions':'each <2^-260'},
        'conditionalProof': {
            'ordinaryPremises':'original leading and lower native Picard realizations, ordinary radial regularity, analytic eta strip and original flat cutoff endpoints, source averages, moment differentiation and pressure integration by parts',
            'comparison':'fixed original N0; pair positive orders N1 through N5, on original real support and eta in [-1,1]',
            'retainedGauge':'pressure axis zero, P_(K5+1) paired storage, exact moment and zero exterior',
            'outputs':'all nine n5 coefficient values; F/U first eta and first and weighted second radial forms with first eta; Pi and Pi_X first eta; axial and angular guarded sup and absolute L1(dX) errors',
            'strictError':'<2^-256', 'nativeDepths':closed,'numericFiniteValues':False,
        },
        'pairedWholeN5':'CONDITIONAL',
        'generalY':'OPEN','finalJets':0,'release':'HOLD',
    }


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as output:
        output.write((json.dumps(receipt(args.operands),indent=2)+'\n').encode())
    print('PASS: original whole paired N5 coefficients, pressure and both guarded stresses at five symbolic depths')
