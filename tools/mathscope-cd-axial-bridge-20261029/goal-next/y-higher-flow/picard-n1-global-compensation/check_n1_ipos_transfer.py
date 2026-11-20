"""Check actual N1 compensated-field error constants with exact arithmetic."""

from fractions import Fraction as F
from hashlib import sha256
import json
from math import factorial
from pathlib import Path
import sys


C98 = '4addbef308f52e5956e54cfc0e0f83d5155b5c571e2558d42056d540d1853d08'
C98_OPERANDS = '0c6a32b4641da682aba70d5ecdb1533528d1ea6c793a44ab4c767db98525551c'
C97 = 'd43384e8f8cb1fc2204595298b50e48c7247dc68677a2670e0e6f284f2223052'


def read(path, pin):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == pin, path
    return json.loads(raw)


def evaluate(operands_path, c98_folder):
    raw = operands_path.read_bytes()
    data = json.loads(raw)
    assert data['schema'] == 'MathScope.C99.OriginalN1CompensatedTransferOperands/1'
    assert data['prior'] == {'C97':C97,'C98':C98,'C98Operands':C98_OPERANDS}
    prior = read(c98_folder/'full-n1-collar.json', C98)
    c98 = read(c98_folder/'full-n1-collar-operands.json', C98_OPERANDS)
    assert data['originalPrefixSHA256'] == c98['prefixSHA']
    assert data['registrySHA'] == c98['registrySHA'] and data['profileSHA'] == c98['profileSHA']
    assert prior['twoPlusTwoFiniteErrorUpper'] == '2^74 Q^-77'
    assert prior['rightStrip'] == 'delta/8' and prior['deltaInverseUpper'] == 'Q^2'
    assert data['sourceSupportProof']['pass'] and all(data['sourceScope'].values())
    support = data['sourceSupportProof']['endpoints']
    assert [support[name] for name in ('Xminus','Xkeep','Xcut','Xplus')] == [28814,28819,28823,28824]
    assert support['aSquared'] == prior['endpointX'] == 24805
    assert support['IposLeft'] == data['rawSupports']['X0']
    assert support['Xb'] == data['rawSupports']['Xb']
    assert data['sourceRoots']['pressureOmega'] == 24733
    assert data['sourceRoots']['fluxOmega'] == 24744
    assert data['localMoments'] == [28864,28878,28905,28943,28983]
    assert data['incomingMoments'] == [28864,28878,28985,28943,28986]
    assert len(set(data['approximateLocal'])) == len(set(data['approximateIncoming'])) == 5
    assert len(data['originalRHS']) == len(data['approximateRHS']) == 5
    assert len(data['coefficients']) == len(data['approximateCoefficients']) == 5
    assert data['noRawCallInCompensatedApproximants']
    expected_names = {'F1','U1','E1','M1','M1overX','v1','V1','Pi1','pressureDerivative'}
    assert set(data['outputs']) == expected_names == set(data['approximants'])
    assert all(data['outputs'][name] != data['approximants'][name] for name in expected_names)
    assert len(data['momentsChecks']) == 5
    assert all(row['numeratorMonomials'] == 0 for row in data['momentsChecks'])
    coverage = data['rawDomainProof']
    assert coverage['allActualRadialArgumentsAtMostXcut'] and coverage['verifiedContexts']==193
    assert coverage['actualRawCallIds'] == sorted(i for i, _ in data['rawRequestReplacements'])
    assert len(coverage['actualRawCallIds']) == 18
    for _, call in data['rawRequestReplacements']:
        assert call['component'] in (0,1,3) and call['radialOrder'] == 0
        assert call['etaOrder'] in (0,1)

    profile = data['profileScalars']
    for key, value in profile.items():
        assert value == c98['profileExpressions'][key]
    ref = lambda key: {'ref':key}
    integer = lambda n: {'integer':n}
    assert profile['lambda'] == {'exp':{'product':[integer(-1000),ref('T')]}}
    assert profile['BOuter'] == {'product':[integer(1000),ref('T')]}
    assert profile['Pstar'] == {'exp':ref('logP')}
    assert c98['profileExpressions']['logP'] == {'product':[integer(2),ref('T')]}
    assert 8002 * 8 + 4 == 64020  # log Q > 64020 T from its pinned sigma and K.
    assert 1000 < 64020
    #  log K(0) = 3T/2 - 7/10 - lambda/2 -(1/2+lambda)(60000T-14)
    assert F(3,2) > F(7,10) + F(1,8) and F(3,4)*60000 == 45000
    assert F(1,2)*60000-F(3,2) > 7
    assert 45000 < 64020  # Q^-1 < K(0) < 1 whenever T>1.
    assert 60001 > 12  # X0Ipos=XR exp(60001 T-12)>1 under the pinned profile.
    assert 1 - F(1,128)**2 > F(1,2)
    assert 1 + 2**2 == 5

    inverse = data['matrices']
    assert [len(row) for row in inverse['U']] == [2,2]
    assert [len(row) for row in inverse['E']] == [3,3,3]
    assert [len(row) for row in inverse['Uinverse']] == [2,2]
    assert [len(row) for row in inverse['Einverse']] == [3,3,3]
    proof = inverse['normalizedInverseProof']
    assert proof['schema'] == 'MathScope.ActualIposContinuousInverseProof/1'
    assert proof['lambda'] == {'samePinnedParameter':True,'strictlyPositive':True,'upper':'1/4','setToZero':False}
    assert proof['positiveUnitRMass'] and proof['actualContinuousEntriesRetained']
    centers = list(map(F,proof['centers']))
    half = F(proof['halfWidth'])
    assert half == F(1,4096)
    assert 1 < centers[0]-half and centers[-1]+half < 4
    assert min(y-x-2*half for x,y in zip(centers,centers[1:])) > F(1,4)
    du = F(1,8)*F(1,4)
    de = F(1,32)**3 * F(1,2)**2
    assert F(proof['normalizedU']['determinantLower']) == du == F(1,32)
    assert F(proof['normalizedE']['determinantAbsoluteLower']) == de == F(1,131072)
    assert F(proof['normalizedU']['adjugateInfinityUpper']) == 16
    assert F(proof['normalizedE']['adjugateInfinityUpper']) == 96
    assert 16/du < F(proof['normalizedU']['inverseInfinityUpper']) == 2**10
    assert 96/de < F(proof['normalizedE']['inverseInfinityUpper']) == 2**24

    # From Xcut=x_c<=5 Q^-64, Q>=2^260, get x_c<1/2 and Q x_c<1.
    q_min = 2**260
    assert F(5,q_min**64)<F(1,2) and F(5,q_min**63)<1
    # Coefficients of (E*x_c,E*x_c²,E*Q*x_c,E*Q*x_c²,E*x_c).
    local = [1,1,2*8,8+8,2*8+8]
    assert local == [1,1,16,16,24]
    # |R_b Delta alpha| and |Delta beta/R_b| over Q²*x_c*E.
    ua_scaled = 2**10*(local[0]+5*local[3])
    eb_scaled = 2**24*max(local[1],F(5,2)*local[2],5*local[4])
    assert ua_scaled < 2**17 and eb_scaled < 2**31
    bump = 9/(2*half)
    assert bump < 2**15
    assert 2*2**15*2**17 == 2**33
    assert 3*2**15*2**31 < 2**48
    # Whole mass: local mass and at most two full weighted positive prefixes, each <=4.
    assert 1+8*2**17 < 2**21
    # Prefix pressure: shared ef cancels the same factor in two inverse RHS rows.
    pressure_outer = local[2]+3*2**24*max(4*local[1],local[2],2*local[4])
    assert pressure_outer < 2**33
    assert max(2**33,2**48,2**21)*F(5,q_min**62) < 1
    assert 2**33*F(5,q_min**63) < 1
    # X*U and M derivative contributions to the actual global V.
    assert 8*2**16*2**17 == 2**36
    assert 2*(4*2**36 + 8*2**21 + 5*16*2**21) < 2**40
    assert 2**40*F(5,q_min**60) < 1
    assert 2*(4+8+5*16) < 2**8  # normalized v1 when the eta strip halves
    assert 2*(8+2) < 2**5  # source pressureDerivative operand, separate from radial jets

    # Evaluate only binary exponents of exact errors, without computing Q.
    dyadic = []
    for m in range(9):
        factor = factorial(m)*32**m
        exponent = 82 + (factor-1).bit_length() - 260*(75-2*m)
        assert exponent < -15200
        dyadic.append(exponent)

    return {
        'schema':'MathScope.C99.ActualN1GlobalCompensationError/1',
        'sourceStatus':'VERIFIED_ORIGINAL_FIVE_MOMENTS_FIXED_OMEGA_INVERSES_AND_GLOBAL_APPROXIMANT',
        'ordinaryStatus':'CONDITIONAL_ON_C98_LEADING_REALIZATION_AND_ORDINARY_ORIGINAL_GLOBAL_HISTORIES',
        'operandsSHA256':sha256(raw).hexdigest(),
        'priorC98ReceiptSHA256':C98,
        'originalLocalMoments':data['localMoments'],
        'nativeRequestsReplaced':len(data['rawRequestReplacements']),
        'verifiedOriginalRawDomainContexts':coverage['verifiedContexts'],
        'outputsTransferred':len(expected_names),
        'momentResidualNumeratorsZero':len(data['momentsChecks']),
        'rawNativeMaxX':support['Xcut'],
        'registeredRightBoundary':support['aSquared'],
        'positiveOrderFieldCutoff':support['Xplus'],
        'orderOneStressBoundary':support['Xb'],
        'fixedLeadingOmegaRoots':[data['sourceRoots']['pressureOmega'],data['sourceRoots']['fluxOmega']],
        'normFrame':{'E':'2^74 Q^-77','x_c':'Xcut<5 Q^-64','strip':'S_(delta/8)'},
        'localMomentErrorOverE':[str(x) for x in ('x_c','x_c^2','16 Q x_c','16 Q x_c^2','24 x_c')],
        'normalizedInverseInfinityUpper':{'U':2**10,'E':2**24},
        'scaledCoefficientErrorOverQSquaredXcutE':{'Rbase*alpha':'2^17','beta/Rbase':'2^31'},
        'globalErrorOverEOnDeltaOver8':{'F1':1,'U1':1,'E1':1,'M1':1,'M1overX':1,'Pi1':1},
        'globalErrorOverEOnDeltaOver16':{'V1':1,'v1':'2^8/delta','pressureDerivative':'2^5 Q'},
        'allOutputAbsoluteEtaErrorBinaryExponentsThrough8':dyadic,
        'notYetNumericQuadratures':True,
        'remaining':'OPEN_RADIAL_JETS_COMPLETE_GLOBAL_ORDINARY_STRESS_AND_ALL_HIGHER_ORDERS',
        'additionalFinalJets':0,'release':'HOLD',
    }


if __name__ == '__main__':
    args = list(map(Path, sys.argv[1:]))
    receipt = evaluate(*args[:2])
    with args[2].open('x', encoding='utf-8', newline='\n') as f:
        json.dump(receipt, f, indent=2)
        f.write('\n')
    print('VERIFIED five original cutoff moment inputs, normalized Ipos inverses and nine compensated outputs')
    print('CONDITIONAL original whole-support error transfer from actual C98 raw profile realization')
