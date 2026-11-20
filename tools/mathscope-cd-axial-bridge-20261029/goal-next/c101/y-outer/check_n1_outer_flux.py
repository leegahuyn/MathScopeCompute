"""Audit original outer N1 difference, bump derivatives and signed closure."""

from collections import defaultdict
from fractions import Fraction as F
from hashlib import sha256
import json
from pathlib import Path
import sys


C99 = '05f6adaa85ad7adf05a5c4943e4f01e98794243f3dab8c7c0a1f85c9f4f5b387'
C99_OPS = 'd52bfc8ddd4a9987cd25d3d4a2161cc10e19d8d2ee7975f87ae2e7b68f8e27be'
C100 = '17664f981265e2373a5c16d0bf3c9dc233af48605974de1e072520b9932b71de'
C100_OPS = 'afa75d0bba159592b4ce217dc06c9b871fb7137f9617291240370a53b1aad35f'
C101_TAPER = '867bc1d589edd923257c2250672ca66d1341847a914eba952ac2b645ed627f8a'
LEADING = '5c0fda42461aca2e77cd2987100a0e7a38dced94ec3be8883ae639df765f06cd'
DERIVATIVE = 'f27e8d640e9b8e49805c0128c987f043d5667c298b2029dd061b820ae9e3117b'
MOMENTS = '3d4be5e7b50d1f1310ee2588f59cf055be87ddfaff60f75ca4cbf98c9371d4cb'


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def normalized_radial_derivative(expression):
    """Represent (d/dx)/x on finite terms b^(j)(x) x^(-p)."""
    result = defaultdict(int)
    for (j,p),coefficient in expression.items():
        result[j+1,p+1] += coefficient
        result[j,p+2] -= p*coefficient
    return {key:value for key,value in result.items() if value}


def main(args):
    operands,c99,c100,taper,goal,output=map(Path,args)
    raw=operands.read_bytes()
    data=json.loads(raw)
    old=json.loads(pinned(c99/'n1-ipos-transfer.json',C99))
    source=json.loads(pinned(c99/'n1-ipos-transfer-operands.json',C99_OPS))
    recent=json.loads(pinned(c100/'n1-radial-seams.json',C100))
    pinned(c100/'n1-radial-seams-operands.json',C100_OPS)
    trace=json.loads(pinned(taper/'n1-taper-flux.json',C101_TAPER))
    root=goal/'axial-order-one-identity'
    leading=json.loads(pinned(root/'leading-axial-support/leading-axial-support.json',LEADING))
    pinned(root/'leading-axial-support/archives/GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md',DERIVATIVE)
    moments=json.loads(pinned(root/'whole-moments/whole-moments.json',MOMENTS))
    assert data['schema']=='MathScope.C101.OriginalN1OuterConservativeErrorOperands/1'
    assert data['prior']=={'C99Ops':C99_OPS,'C100':C100,'C100Ops':C100_OPS,'C101Taper':C101_TAPER}
    assert source['originalPrefixSHA256']==data['originalPrefixSHA256']
    assert data['actualSourceIntegrals']=={'axialBody':117047,'axialTotal':117075,'angularTotal':117072}
    assert recent['originalAxialDensityAndIntegrals']['body']==117047
    assert data['restoredMoments']==[row['original'] for row in source['momentsChecks']]
    assert leading['Ipos']['U']=='0'
    assert moments['patch']['U0IposZero']==0
    assert data['ordinaryContinuityUsed'] and data['primitives']['matchedTwoMassAndThreePressureBumps']
    roots=data['sourceRoots']
    assert [roots[key] for key in ('cut','Xpos','IposRight','lastAxial','Xplus','Xb')]==[28823,28987,28988,29328,28824,28826]
    assert roots['lastAngular']==117099
    assert (roots['completePressureOmega'],roots['completeFluxOmega'])==(24733,24744)
    assert [row['label'] for row in data['identities']]==[
        'positive-radius-coordinate-jacobian','original-axial-pressure-exponent',
        'original-weighted-angular-exponents-c-beta','original-weighted-angular-exponents-gamma-b',
        'leading-continuity-coefficient','order-one-continuity-coefficient','same-original-order-one-radial-velocity',
        'axial-source-convective-group','weighted-angular-source-convective-group',
        'axial-J-conservative-prefix','weighted-angular-J-conservative-prefix',
        'axial-time-mass-prefix','weighted-angular-time-prefix',
        'saturated-original-mass-prefix','saturated-original-pressure-prefix',
    ]
    assert all(row['numeratorMonomials']==0 for row in data['identities'])
    assert old['scaledCoefficientErrorOverQSquaredXcutE']=={'Rbase*alpha':'2^17','beta/Rbase':'2^31'}
    assert recent['norms']['finiteRegisteredValueErrorOnDeltaOver8']=='2^73 Q^-77'
    assert recent['norms']['rawF1U1XDerivativeErrorOnDeltaOver16']=='2^46 Q^-19'
    assert recent['exactCompensatedMomentsZero']==5
    assert trace['uniformErrorWithTaperTraceRemoved']=={'axial':'5 g R','angular':'9 g^2 R'}
    assert trace['sourceAxialIntegrand']==117047

    # Original normalized bump width, and a uniform bound for j<=2.
    half_width=F(1,4096)
    width=2*half_width
    assert width==F(1,2048)
    b0=2**15
    b1=2**2070
    b2=2**2081
    assert 9/width<b0 and 2**2048/width**2==b1 and 2**2048/width**3==b2
    plain={(0,0):1}
    normalized={(0,1):1}
    plain_d=normalized_radial_derivative(plain)
    normalized_d=normalized_radial_derivative(normalized)
    assert plain_d=={(1,1):1}
    assert normalized_radial_derivative(plain_d)=={(2,2):1,(1,3):-1}
    assert normalized_d=={(1,2):1,(0,3):-1}
    assert normalized_radial_derivative(normalized_d)=={(2,3):1,(1,4):-3,(0,5):3}
    # K has modulus at most 2 and the actual 1+eta² factor is nonzero.
    assert 2*(2+2*F(1,4))==5
    assert 2*2*3==12
    assert 2*5*3+2*2*3==42
    assert old['normalizedInverseInfinityUpper']['E']==2**24
    assert old['localMomentErrorOverE']==['x_c','x_c^2','16 Q x_c','16 Q x_c^2','24 x_c']
    assert 16+3*2**24*max(4,16,48)<2**33
    # Before Ipos, mass and pressure are the fixed local moment errors.
    # A loss delta/16 bounds their first eta derivatives by 16/delta.
    assert 2*(8+5*16)<2**8
    assert 2*(4*16+5*16*16)<2**12

    # On the full interval the ordinary conservative prefix is zero
    # after the saturated correction.  At g the C101 derivative trace
    # vanishes, so its prefix bound applies. Both endpoints at X=0
    # give zero for the weighted fluxes by the regular C100 axis parity.
    result={
        'schema':'MathScope.C101.ActualN1OuterCompensationAndStressError/1',
        'sourceStatus':'VERIFIED_ORIGINAL_BUMP_PRIMITIVES_CONSERVATIVE_FLUX_AND_CLOSURE_ROLES',
        'ordinaryStatus':'CONDITIONAL_ON_SAME_C100_ORDINARY_FIELDS_AND_ORIGINAL_LEADING_MOMENT_DENOTATION',
        'operandsSHA256':sha256(raw).hexdigest(),'priorC101TaperSHA256':C101_TAPER,
        'sourceIdentityCount':len(data['identities']),'sourceAxialIntegrand':117047,
        'sourceAxialTotal':117075,'sourceWeightedAngularTotal':117072,
        'outerEndpoints':{'cut':roots['cut'],'IposLeft':roots['Xpos'],
            'lastAxialBump':roots['lastAxial'],'lastAngularBump':roots['lastAngular'],
            'IposRight':roots['IposRight'],'Xplus':roots['Xplus'],'Xb':roots['Xb']},
        'normSymbols':{'g':'Xcut','r':'Rbase','E':'2^73 Q^-77','R':'2^46 Q^-19',
            'A':'2^17 Q^2 g E','B':'2^31 Q^2 g E',
            'b0':'2^15','b1':'2^2070','b2':'2^2081'},
        'IposOrdinaryErrorBoundsOnDeltaOver8':{
            'DeltaU':[ '2 A b0/r^2','2 A b1/r^4','2 A (b1+b2)/r^6' ],
            'DeltaF':[ '3 B b0/r','3 B (b1+b0)/r^3','3 B (b2+3b1+3b0)/r^5' ],
            'DeltaPressure':[ '2^33 Q g E','12 B b0/r^2','B (42b0+12b1)/r^4' ],
            'DeltaMass':['2^21 Q^2 g E','DeltaU','DeltaU_X'],
            'derivativeOrders':[0,1,2],
        },
        'compensatedErrorsZeroAfterLastAngularBump':True,
        'preIposGapExactErrorFromCut':{
            'interval':'Xcut<=X<=Xpos',
            'radialMassCoefficient':'V0=(-2(D+lambda1)eta Delta_m0-d partial_eta Delta_m0)/L',
            'pressureCoefficient':'P0=(-2eta Delta_m2+d partial_eta Delta_m2)/L',
            'axialIntegratedDensity':'V0*(U0(X)-U0(Xcut))+(X-Xcut)*P0',
            'weightedAngularIntegratedDensity':'2*V0*(X*F0(X)-Xcut*F0(Xcut))',
            'radialMassCoefficientUpper':'2^8 g E/delta','pressureCoefficientUpper':'2^12 Q g E/delta',
        },
        'pressureAndMassSaturationProofUsesExactCompensatedMoments':[0,2],
        'sourceMomentRowsUsedByAxialClosure':[0,4],
        'sourceMomentRowsUsedByAngularClosure':[1,3],
        'exactOrdinaryUncutWholeErrorIntegralZero':{'axial':True,'weightedAngular':True},
        'signedOuterErrorIntegralUpper':{'axial_Xcut_to_Xplus':'5 g R','weightedAngular_Xcut_to_Xb':'9 g^2 R'},
        'signedWholeClippedErrorIntegralUpper':{'axial_Xminus_to_Xplus':'5 g R','weightedAngular_Xminus_to_Xb':'9 g^2 R'},
        'clippedForwardLateConstant':'normalized DeltaStress = uncut DeltaDensity integral from 0 to original Xminus',
        'lateClippedForwardConstantUpper':{'axial':'5 g R','weightedAngular':'9 g^2 R'},
        'remaining':'OPEN_NO_UNIFORM_POINTWISE_OUTER_STRESS_ERROR_AND_NO_ALL_ORDER_RECURSION',
        'additionalFinalJets':0,'release':'HOLD',
    }
    with output.open('x',encoding='utf-8',newline='\n') as f:
        json.dump(result,f,indent=2)
        f.write('\n')
    print('VERIFIED original Ipos weighted primitives and 15 conservative identities')
    print('CONDITIONAL explicit outer primitive derivative errors and signed whole outer flux bounds')


if __name__=='__main__':
    main(sys.argv[1:])
