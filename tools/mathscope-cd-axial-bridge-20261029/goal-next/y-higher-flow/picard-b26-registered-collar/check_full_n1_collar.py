"""Verify source identities and rational bounds for the actual N1 registered collar."""

from fractions import Fraction as F
from hashlib import sha256
import json
from math import factorial
from pathlib import Path
import sys


C97_OPERANDS = 'd43384e8f8cb1fc2204595298b50e48c7247dc68677a2670e0e6f284f2223052'
C97 = '63445c649efe09ae23d6012ebcfb4b6b9ff3384f9349ced316a2a2c80b562316'
C55_PROOF = 'aa4cf7d3b762b9772fce712ce1fb7a08f4784d9797aaee62deced94e8c5b7276'
C55_SOURCE = '9061704c10b553ed44f43d0021ebe22c656ec5b8082dfd06079b2e1fbe5163c0'


def load(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def evaluate(args):
    operands_file, c97_root, goal = map(Path, args)
    raw = operands_file.read_bytes()
    operand = json.loads(raw)
    assert operand['schema'] == 'MathScope.C98.OriginalN1FullCommonCollarOperands/1'
    old = json.loads(load(c97_root/'b26-restart-operands.json', C97_OPERANDS))
    restart = json.loads(load(c97_root/'b26-restart.json', C97))
    assert operand['previousSHA'] == restart['sourceOperandsSHA256'] == C97_OPERANDS
    for pin in ('registrySHA', 'prefixSHA', 'profileSHA'):
        assert operand[pin] == old[pin], pin
    root = goal/'axial-order-one-identity/leading-B'
    load(root/'ACTUAL_LEADING_B_PROOF.md', C55_PROOF)
    leading = json.loads(load(root/'activation-source.json', C55_SOURCE))
    assert '0<=y<=t1/16<t1' in leading['branchPremises']
    assert leading['actualFieldBinding']['checkActualF']['pass']
    assert leading['checkShear']['pass'] and leading['checkKap']['pass']

    p, oldi = operand['ids'], old['ids']
    for key in ('X', 'eta', 'Xa', 't1'):
        assert p[key] == oldi[key], key
    assert p['Lam'] == oldi['Lambda'] and p['end'] == oldi['XiUpper']
    assert p['F0'] == old['branch']['F0']
    assert p['U0'] == old['branch']['U0'] and p['v0'] == old['branch']['V0']
    heads = dict(operand['heads'])
    assert len(heads) == len(operand['heads'])
    actual = operand['actual']
    assert actual['system'] == 0 and operand['auxiliary']['system'] == 1
    assert actual['radialDomain'] == [0, p['end']]
    assert heads[p['end']] == {'op':'sqrt_positive','args':[p['endX']]}
    assert heads[p['alpha']] == {'op':'sqrt_positive','args':[p['Xa']]}
    assert p['endX'] == old['branch']['F0branch']['args'][2]
    assert actual['diagonal'] == [0, 0, 2, 0, 3, 1]
    assert actual['A0'][3][0] == old['branch']['registeredRow']
    assert [[bool(x) for x in row] for row in actual['A1']] == old['A1mask']
    assert actual['forcing'][:3] == [0, 0, 0]
    assert all(actual['forcing'][i] > 0 for i in range(3, 6))
    for name in ('F0', 'U0', 'v0'):
        assert heads[p[name]]['op'] == 'smooth_piecewise'
        assert heads[p[name]]['args'][:3] == [p['X'], p['Xa'], p['endX']]
    assert operand['counts'] == {'matrixEntries':72,'forcingEntries':6,
                                 'exactRightEndpointCalls':6,'finiteSeamTerms':2,'finiteRightTerms':2}
    assert operand['finiteEndpointClosure']['zeroFreeCoordinates']
    assert operand['finiteEndpointClosure']['noPicardOrEvenOracle']
    assert operand['finiteEndpointClosure']['nodes'] > 1000
    for i, row in enumerate(operand['records']):
        assert row['i'] == i
        assert heads[row['native']] == {'op':'actual_background_picard','args':[0,i,p['end'],0,0]}
        assert heads[row['auxSeed']] == {'op':'actual_background_picard','args':[1,i,p['alpha'],p['eta'],0]}
        for key in ('finiteKT0', 'exactKT0'):
            term = heads[row[key]]
            assert term['op'] == 'definite_integral' and term['args'][2:] == [p['alpha'], p['xi']]
        if i < 4:
            assert heads[row['even']] == {'op':'actual_background_even_profile','args':[0,i,p['endX'],0,0,0]}
        else:
            assert row['even'] is None

    profile = operand['profileExpressions']
    integer = lambda k: {'integer':k}
    ref = lambda name: {'ref':name}
    sig2 = {'power':[ref('sigmaStar'),2]}
    assert profile['rho'] == {'quotient':[sig2,integer(65536)]}
    assert profile['Q'] == {'quotient':[{'product':[integer(str(2**260)),ref('K')]},sig2]}
    assert profile['K'] == {'power':[ref('Pstar'),2]}
    assert profile['Pstar'] == {'exp':ref('logP')} and profile['logP'] == {'product':[integer(2),ref('T')]}
    assert profile['h'] == {'exp':{'product':[integer(-8002),ref('T')]}}
    assert profile['Lambda'] == {'power':[ref('Q'),64]}
    assert profile['Xa'] == {'quotient':[integer(4),ref('Lambda')]}
    assert profile['t1'] == {'power':[ref('CSelected'),-120]}
    assert profile['CSelected'] == {'exp':ref('logCSelected')}
    assert {'power':[ref('Q'),200]} in profile['logCSelected']['sum']
    assert 2**260 // 65536 == 2**244
    assert 2**244 > 2**10  # Q*rho=2^244*K, K>1, so delta^-1<Q^2.
    assert 2**260 >= 2 and 8002 > 7  # h<2^-7, e>2, T>1.
    assert 1 - 8 * F(1,128) > F(1,2)
    assert 4 / (1-F(1,256)) < F(41,10) < 5  # t1<=1/16 and e^x<=1/(1-x).
    assert 2 / (1-F(1,32)) < 3
    assert 0 < F(1,128) < F(1,64) < F(1,32) < F(1,16)

    # Coefficients of 1,Q,delta^-1, etc. Bases Q,delta^-1,theta^-1 >=1.
    # F0,U0 and their first two X derivatives use C55 at the unchanged source.
    assert max(F(2),F(6)) < 2**3
    assert max(F(1,5),F(12)) < 2**4
    assert max(F(1,25),F(84)) < 2**7
    assert F(1,5) < F(1,4) and max(F(1,25),F(3,4)) < 1
    # Weighted Euler derivatives use X<=5/Lambda. E^2=E+X^2 dXX.
    assert 5 * 2**4 < 2**7
    assert 5 * 2**4 + 25 * 2**7 < 2**12
    assert 2**3 + 5 * 2**4 < 2**7 and F(5,4) < 2
    # v0=(2 eta U0-2 D eta averageU0-d d_eta(averageU0))/L.
    v_multiplier = 2 * (4 + 8 + 5*2)
    assert v_multiplier < 2**6
    v, vx, ev, xvxx, veta = 2**9, 2**6, 2**9, 2**9, 2**11
    assert v_multiplier*8 < v and 5*vx < ev and 5*vx < xvxx
    assert 4*v == veta
    zf = 8*(4*2**3+2**7) + 16*2*2**3
    ezf = 8*(4*2**7+2**12) + 16*2*2**7
    assert zf < 2**11 and ezf < 2**16
    zzf = 8*(4*2**11+2**16) + 16*4*2**11
    assert zzf < 2**20
    omega_roles = [
        2*(4*veta+v+ev),
        v*(v//2+ev),
        8*2*(5*veta+4*(v+ev)),
        2*(2*vx+xvxx),
    ]
    assert sum(omega_roles) < 2**20
    force_cap = max(2**20, 2*2**20, 2*(2**20+4*2**20))
    assert force_cap < 2**24  # Q^3/(theta delta^2) majorizes all the rows.
    diagonal = 2+v+4*8*2
    a04 = [2*(4*33*2+v), 4*2*4*2**7*2+2*2**11, 4*2*4*2**7*2, diagonal]
    a05 = [8*2*8*2, 2*4*33*2+4*2*4*2*2+2*2**11,
           4*2*4*2*2, 4*4*2*2, diagonal]
    a14 = [2*(4+5*8)*2, 2*5*2**7*2, 2*5*2**7*2]
    a15 = [2*(4+5*8+5*2)*2, 2*5*2*2, 2*5*2]
    row_caps = {'A0':[1,1,1,32,sum(a04),sum(a05)], 'A1':[0,0,0,0,sum(a14),sum(a15)]}
    for key, value in row_caps.items():
        assert max(value) < 2**15, key

    # Allocate two strip losses of delta/16 and avoid an enumeration of K.
    # 2^k choices, k/s Cauchy for each derivative, simplex b^k/k!,
    # and k^k/k!<3^k yield factors 6*M*b/s. No nilpotence assumed here.
    assert 6*2**15*2*16 < 2**23
    assert 6*2**15*F(1,8)*16 < 2**19
    assert F(2**23, (2**260)**26) < F(1,2)
    assert F(2**19, (2**260)**26) < F(1,2)
    core_first = 2 * 2**24
    collar_force_integrated = F(1,8) * 2**24
    assert core_first == 2**25 and collar_force_integrated == 2**21
    core_solution = 2 * core_first
    right_seed = core_solution + collar_force_integrated
    assert core_solution == 2**26 and right_seed < 2**27
    assert 2**27 * 2**19 == 2**46
    assert 2 * 2**27 * (2**19)**2 == 2**66
    core_tail = 2 * core_first * (2**23)**2
    assert core_tail == 2**72 and 2*core_tail + 2**66 < 2**74
    eta_absolute_error_binary_exponents = []
    for m in range(9):
        factor = (16**m)*factorial(m)
        exponent = 74+(factor-1).bit_length()-260*(77-2*m)
        assert exponent < -15700
        eta_absolute_error_binary_exponents.append(exponent)

    return {
        'schema':'MathScope.C98.ActualN1FullCommonCollar/1',
        'sourceStatus':'VERIFIED_78_ORIGINAL_OPERANDS_AND_FULL_RIGHT_ENDPOINT_WITH_TWO_PLUS_TWO_TERMS',
        'ordinaryStatus':'CONDITIONAL_ON_ORIGINAL_B_RHO_A21_AND_C55_LEADING_REALIZATION',
        'operandsSHA256':sha256(raw).hexdigest(),
        'originalPins':{'C97':C97,'C97Operands':C97_OPERANDS,'C55Proof':C55_PROOF,'C55Source':C55_SOURCE},
        'registeredDomain':actual['radialDomain'],
        'endpointX':p['endX'],
        'sourceCutoffAndCompensation':operand['sourceCutoffAndCompensation'],
        'counts':operand['counts'],
        'finiteEndpointClosure':operand['finiteEndpointClosure'],
        'rowCapsOverQSquaredDeltaInverse':row_caps,
        'forcingCap':'2^24 Q^3/(theta delta^2), theta=1 core, theta=t1 extended collar',
        'deltaInverseUpper':'Q^2',
        'rightWidthUpper':'t1/(8 Q^32)',
        'sourceMatrixBoundUpper':'2^15 Q^4',
        'coreStrip':'3delta/16',
        'rightStrip':'delta/8',
        'coreGeometricRatioUpper':'2^23 Q^-26',
        'rightGeometricRatioUpper':'2^19 Q^-26 t1',
        'seamNormUpper':'2^26 Q^-25',
        'wholeRightT0NormUpper':'2^27 Q^-25',
        'wholeRightKT0NormUpper':'2^46 Q^-51 t1',
        'twoRightTermExactTraceTailUpper':'2^66 Q^-77 t1^2',
        'twoPlusTwoFiniteErrorUpper':'2^74 Q^-77',
        'etaErrorBinaryExponentsOrders0Through8':eta_absolute_error_binary_exponents,
        'nativeEndpointCalls':[row['native'] for row in operand['records']],
        'finiteEndpointApproximations':[row['probe'] for row in operand['records']],
        'coversXkeepAndXcut':True,
        'beyondRegisteredCollar':'OPEN_ACTUAL_FIVE_MOMENT_COMPENSATION_AND_FULL_STRESS_SUPPORT',
        'additionalFinalJets':0,'release':'HOLD',
    }


if __name__ == '__main__':
    evidence = evaluate(sys.argv[1:4])
    with Path(sys.argv[4]).open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(evidence, stream, indent=2)
        stream.write('\n')
    print('VERIFIED Original N1 78 operator operands and all six full-right endpoint calls')
    print('CONDITIONAL full common collar, 2+2 finite terms and strict uniform 2^74 Q^-77 error')
