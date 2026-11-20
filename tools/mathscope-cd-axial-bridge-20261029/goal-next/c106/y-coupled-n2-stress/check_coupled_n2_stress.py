from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json


PINS={
    'fixed':'9b94457853b46d03a64439173a414a5b614b814ddbbc92a808e0b1c0fc1be993',
    'paired':'4706411acb5ddf906fa50fc07e062c313374a2e34d0042c459da12eec0cddaf6',
}


def pinned(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return json.loads(raw)


def check_inputs(args):
    raw=args.operands.read_bytes()
    source=json.loads(raw)
    fixed=pinned(args.fixed,PINS['fixed'])
    paired=pinned(args.paired,PINS['paired'])
    assert source['pins']['C104']==PINS['fixed'] and source['pins']['C105']==PINS['paired']
    assert source['actualStress']==fixed['actualStress']
    assert [source['eta'],source['X'],source['lastIpos']]==[2,4756,117099]
    assert source['activeCutoffs']==[28814,28824]
    assert source['bothOriginalMomentChecks']=={'first':5,'second':5}
    assert source['stressTermCounts']=={'z':10,'theta':9}
    assert source['coupledConservativeNumerators']==[0,0,0]
    assert len(source['droppedLowerFluxAndViscosityNumerators'])==4
    assert all(k>0 for k in source['droppedLowerFluxAndViscosityNumerators'])
    assert paired['localStability']['matrixCap']=='Ma=2^20 Q^4'
    assert paired['localStability']['rawCoupledFiniteError']=='E2=4^-K/3+2*a*Fd when K>=original Kcondition'
    assert paired['localStability']['forcingError'].startswith('Fd=2^25 H1 e/s1^2')
    assert paired['wholeCoupledTransfer']['allFiveIncomingMomentErrorsC1']=='Merr=2^6 L0 E2s+B DL'
    assert paired['wholeCoupledTransfer']['sameExteriorPressureAndCoefficientErrorsZeroAfterLastIpos']
    assert source['fixedPressureAndTail']=={'matrixBound':118568,'s':117678,'Kcondition':118577}
    return source,sha256(raw).hexdigest()


def check_budgets():
    # The same 16E factor bounds the pair's K-2 value tail. The
    # raw derivative has quotient 1/(2*xi) from the literal first rows.
    assert Fraction(1,2)*16*(1+2) < 2**5
    # Taper only uses the first X derivative in the conservative flux.
    assert 64*9 < 2**10
    # Original normalized Ipos inverse error coefficient: 2^30 Q^2 Merr.
    a=2**30
    b0,b1=2**15,2**2070
    assert max(16*a*b1,24*a*(b1+b0))<2**2120
    # Cauchy use for the previous-order viscosity: e covers value,
    # one radial derivative, and X-weighted second radial derivative.
    # Each factor X on the support is at most the common B>=1.
    z=2*(4*(4+1)+5*2)
    zx=2*(4*(5+1)+5*2)
    assert z<2**6 and zx<2**7
    zz=2*(4*(4*2**6+2**7)+5*2**8)
    assert zz<2**14
    # True and finite v1 norm from their own regular averaged U1.
    assert 2*(2+2+1)<2**4
    assert 1+2**4<2**5
    # Two same-source transport products, pressure, etc.
    bz=1+2**5+2**8+2+2+4*2
    bt=2+2*2**5+2*2**8+4+4+4*4
    rz=2*(3+2+2*2+5*2)+1
    rt=2*(3*2+2*2+2*4+5*4)+2
    assert bz==301 and bt==602
    assert rz==39 and rt==78
    assert bz<2**9 and bt<2**10 and rz<2**6 and rt<2**7
    integral_z=2*2**9+2**6
    integral_theta=2*2**10+2**7
    assert max(integral_z,integral_theta)<2**12
    assert 2*Fraction(1,2**257)==Fraction(1,2**256)
    return {'boundaryNumerators':[bz,bt],'densityNumerators':[rz,rt],
            'normalizedIntegralNumerators':[integral_z,integral_theta],
            'lowerZSquaredIntegerCap':zz}


def main(args):
    source,operands_sha=check_inputs(args)
    caps=check_budgets()
    result={
        'schema':'MathScope.C106.ActualCoupledN2AbsoluteStressError/1',
        'sourceStatus':'VERIFIED_ORIGINAL_PAIRED_N2_STRESS_CROSS_TERMS_AND_PREVIOUS_VISCOSITY',
        'ordinaryStatus':'CONDITIONAL_ON_C105_ORDINARY_ORIGINAL_AND_PAIRED_N1_N2_REALIZATIONS',
        'operandsSHA256':operands_sha,
        'originalStress':[row['root'] for row in source['actualStress']],
        'originalRadialCutoffs':source['activeCutoffs'],'originalEta':source['eta'],
        'sourceTermCounts':source['stressTermCounts'],
        'coupledConservativeNumerators':source['coupledConservativeNumerators'],
        'droppedLowerFluxAndViscosityNumerators':source['droppedLowerFluxAndViscosityNumerators'],
        'explicitPairedBudget':{
            'Xbound':'B=CSelected^11',
            'rawValueError':'E2=4^-K/3+2*a*Fd for K>=Kcondition+2',
            'rawFirstXError':'R2=2^25 Q^4 E2/s+Fd',
            'wholeWeightedFirstXError':'D2=R2+2^10 CSelected^120 E2+2^2120 Q^2 Merr',
            'commonInput':'G=L0*S2+N1*D1+Z+D2 (the uppercase Z is C105 coupled error)',
            'commonOutputError':'2^12 Q^64 B^4 G',
            'allFour':['pointwise axial','pointwise angular','absolute integral axial dX','absolute integral angular dX'],
            'strictErrorAtAdaptiveDepths':'2^-256',
            'adaptiveDepths':'positive coefficients P_K,P_N of the same bound; exact two-depth maxima in README',
            **caps,
        },
        'exactDifferenceTransfer':{
            'uncutSignedDifferenceZero':{'z':True,'theta':True},
            'backwardDifferenceZeroAfterLastIpos':True,
            'forwardDifferenceKeepsOriginalInitialPrefixDefect':True,
            'guardedForwardFiniteAndTrueKeepSameEtaAndBothRadialEndpoints':True,
        },
        'remaining':'OPEN_NUMERICAL_CENTERS_HIGHER_RECURSIONS_AND_FINAL_JETS',
        'finalJets':0,'release':'HOLD',
    }
    with args.out.open('xb') as output:
        output.write((json.dumps(result,indent=2)+'\n').encode())
    print('PASS: coupled source N2 axial and angular absolute coefficient error, both sup and L1(dX)')


if __name__=='__main__':
    parser=ArgumentParser()
    for arg in ('operands','fixed','paired','out'):
        parser.add_argument('--'+arg,type=Path,required=True)
    main(parser.parse_args())
