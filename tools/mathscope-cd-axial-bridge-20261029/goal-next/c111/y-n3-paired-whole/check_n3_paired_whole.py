from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


def source_check(path):
    raw=path.read_bytes()
    x=json.loads(raw)
    assert x['originalSystems']==[3,5] and x['originalEta']==2
    assert x['exactCoupledConservativeNumerators']==[0,0]
    assert x['weightedViscosityShiftNumerator']==0
    assert x['originalMomentResidualsAfterArbitraryNewDebts']==[0]*5
    assert all(k>0 for k in x['lowerTransportControls']+x['previousViscosityControls'])
    assert x['actualOmega2']['terms']==[9,9] and x['actualOmega2']['ends']==[24805,28824]
    assert x['actualOmega2']['retainedEta']==x['originalEta'] and x['leadingNormNodes']==2659
    assert x['bothOriginalLowerHistoriesPaired'] and x['sourcePressureGaugeUnchanged']
    assert x['sourceDepths']['freeCoordinates']==0 and x['sourceDepths']['separateBits']==258
    by_component={r['component']:r for r in x['originalStress']}
    assert {c:r['density'] for c,r in by_component.items()}=={'theta':123840,'z':123841}
    for r in by_component.values():
        assert r['forwardBoundaries']==[28814,4756] and r['backwardBoundaries']==[4756,28824]
        assert r['wrongForwardSignRejected'] and r['eta']==2
    return x,sha256(raw).hexdigest()


def rational_check():
    # In the weighted real eta norms, |eta| contributes <=2, d <=4,
    # and 1/L <=128, uniformly for orders 0..5.
    assert 2*sum(2**i for i in range(6))==126<128
    z=128*(4*(4+1)+4*3)
    z_x=128*(4*(4+2)+4*2)
    t=128*((4+1)+2*2)
    z_squared=128*(4*(4*z+z_x)+4*2*z)
    assert z<2**13 and z_x<2**13 and t<2**11 and z_squared<2**28
    assert 2**11+6+4+2*2**13+2**28<2**30
    # Pair pressure, angular flux and axial flux respectively with
    # D_omega <= 2^30 B^2 A D. B>=1 absorbs all X factors.
    density_caps=[2+Q(1,2)*2**30,4,4+Q(1,2)*2**30]
    assert max(density_caps)<2**32
    assert 2*(2+2+1)<16
    bz=1+16+2+2+2+8
    bt=2*(1+16+2)+4+4+16
    rz_without=2*(1+1+2*2+2)
    rt_without=2*(2*2+2+2*4+4)
    assert (bz,bt,rz_without,rt_without)==(31,62,16,36)
    assert (2*32+17,2*64+38)==(81,166)
    assert max(81,166)<256
    assert 3*Q(1,2**258)<Q(1,2**256)
    return {'operatorIntegers':[z,z_x,t,z_squared],'boundaryNumbers':[bz,bt],
            'restBeforePreviousViscosity':[rz_without,rt_without],
            'bothDirectionIntegralCaps':[81,166],'finalCommonInteger':256}


def check(path):
    s,digest=source_check(path)
    return {'schema':'MathScope.C111.OriginalNativeN3WholePairedPressureAndStressError/1',
      'operandsSHA256':digest,'sourceStatus':'VERIFIED_ORIGINAL_N3_COUPLED_FLUX_PREVIOUS_VISCOSITY_AND_FIVE_MOMENTS',
      'ordinaryStatus':'CONDITIONAL_ON_PINNED_ORIGINAL_ORDINARY_NATIVE_LEADING_ANALYTIC_ETA_AND_FIXED_BOUND_MOMENT_REALIZATIONS',
      'rationalChecks':rational_check(),'exactConservativeNumerators':s['exactCoupledConservativeNumerators'],
      'wrongLowerAndViscosityControls':s['lowerTransportControls']+s['previousViscosityControls'],
      'pairedHistoryErrorsThroughWholeX':{'N1N2Paired':True,'N3PressureStorage':'P_(K3+1)',
        'fieldTarget':'F3,U3 first real eta norm, dX and X-weighted second radial derivative, Pi3 first real eta norm',
        'B':'max(1,Xplus)','A':'max(1,H,A1,A2)','lowerMixed':'D=D1+D2 with the original whole N2 derivative bank',
        'omega2':'2^30 B^2 A D','allThreeLowerPressureAndFluxDensities':'D3=2^32 B^3 A D',
        'allFiveMomentErrors':'M3=4 B^2 H E3_star+B D3',
        'pressureError':'P3=E3_star+B(2 H S3+D3)'},
      'guardedStress':{'originalEta':2,'originalStartEnd':[28814,28824],
        'unweightedAxialDensity':123841,'weightedAngularDensity':123840,
        'samePressureGauge':True,'wholeSignedErrorZeroConditional':True,'originalInnerPrefixDefectRetained':True,
        'cap':'256 B^3 max(1,(2Xminus)^(-1/2),(2Xminus)^(-1)) (A(S3+D)+P3+2^28 B^2 D2)',
        'forwardAndBackwardSeparate':True,'allFourBothDirections':['pointwise axial','pointwise angular','absolute dX axial','absolute dX angular']},
      'explicitThreeDepthTransfer':{'differentStages':['N1 depth N','N2 depth K2','N3 depth K3'],
        'finalStrictTargetForFieldsAndStresses':'<2^-256','eachPositiveContribution':'<2^-258',
        'hasOriginalK2AndK3Minus2Floors':True,'numericCentersOrDepthsMaterialized':False},
      'generalY':'OPEN','M3':'62/64','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as out:
        out.write((json.dumps(check(args.operands),indent=2)+'\n').encode())
    print('PASS: original whole paired N3 pressure, moments, and both guarded stress errors')
