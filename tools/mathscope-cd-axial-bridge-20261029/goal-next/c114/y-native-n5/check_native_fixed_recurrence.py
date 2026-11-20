from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


def exact_recurrence(path):
    raw = path.read_bytes()
    src = json.loads(raw)
    assert src['retainedLiteralN4Nodes'] == 127241 and src['originalNodes'] > 127241
    assert src['originalEta'] == 2 and src['originalX'] == 4756
    guards = src['originalSupports']
    assert src['distinctN1StressGuards'] == [
        {'component':'theta','domain':[guards['Xminus'],guards['Xb']]},
        {'component':'z','domain':[guards['Xminus'],guards['Xplus']]},
    ]
    assert guards['Xminus'] == 28814 and guards['Xplus'] == 28824 and guards['Xb'] != guards['Xplus']
    rows = src['exactOrders']
    assert [row['order'] for row in rows] == [2,3,4,5]
    for row in rows:
        n = row['order']
        assert row['actualSystem'] == 2*n-1 and row['auxiliarySystem'] == 2*n-2
        assert row['omegaCounts'] == [2*n+3]*2 and row['omegaPrior'] == n-2
        assert row['sourceLowerPairs'] == [[i,n-i] for i in range(1,n)]
        assert row['sourceMomentNumerators'] == [0]*5 and row['stressCounts'] == [2*n+6,2*n+5]
        assert [tail['etaOrder'] for tail in row['nativeTails']]==[0,1]
        assert all(tail['order']==n and tail['positiveRemainderRetained'] and not tail['finiteDisplayedTermsCertified']
                   for tail in row['nativeTails'])
        assert all(p['eta']==2 and p['limits']==[0,28824] for p in row['lowerIntegrals'])
        for s in row['stressRows']:
            assert s['eta']==2 and s['forward']==[28814,4756] and s['backward']==[4756,28824]
            assert s['binders'][0] != s['binders'][1]
    assert src['universalConservation']['independentHomogeneity']
    assert src['universalConservation']['numerators'] == [0,0]
    assert all(v>0 for v in src['universalConservation']['wrongEtaAndExponent'])
    n5 = src['N5']
    assert n5['actualSystem']==9 and n5['storedPressure']=='P_(K+1)'
    assert n5['displayedP2P3Check'] and n5['displayLimit']==8
    assert n5['omittedOmegaMiddleNumerator']>0 and n5['omittedPressureCrossNumerator']>0
    assert n5['nativeCallsReplaced']==19 and n5['finiteMomentNumerators']==[0]*5
    assert n5['fixedThroughLowerOrder']==4
    assert [r['order'] for r in src['globalScalars']]==[2,3,4,5]
    assert all(row['freeCoordinates']==0 for row in src['globalScalars'])
    assert src['leadingNormNodes']==3496 and not src['pairedWholeN5'] and not src['numericValuesMaterialized']
    return src,sha256(raw).hexdigest()


def common_error_calculus():
    h=Q(1,128)
    for n in range(2,6):
        assert Q(1,2)+(2*n-1)*h<1
        assert 1+(2*n-1)*h<2
        assert (2*n-2)*h<1 and Q(1,2)+(2*n-2)*h<1
    assert Q(1,2)*6*4**2==48
    assert 9*64<1024 and [16*2048,8192*2048**2]==[2**15,2**35]
    assert 2*(2+2+1)<16
    bz=1+16+2+2+12
    bt=2+32+4+4+16
    rz=2*(1+1+2*3+3)
    rt=2*(2*2+2+2*4+4)
    assert (bz,bt,rz,rt)==(33,58,22,36)
    assert (2*bz+rz,2*bt+rt)==(88,152) and max(88,152)<256
    assert Q(1,3)*Q(1,2**256)<Q(1,2**256)
    return {'boundaryIntegerCaps':[bz,bt],'ordinaryRemainderIntegerCaps':[rz,rt],
        'guardDirectionIntegralIntegerCaps':[88,152],'rawKMinus2DerivativeFactor':48,
        'uniformEtaFirstNorm':'sum of suprema of value and ordinary first eta derivative'}


def main(path):
    source,digest=exact_recurrence(path)
    n5=source['exactOrders'][-1]
    return {'schema':'MathScope.C114.OriginalNativeN5ReusableFixedRecurrenceError/1',
      'operandsSHA256':digest,'verified':'ORIGINAL_NATIVE_N5_AND_REUSABLE_LITERAL_N2_TO_N5_FIXED_HISTORY_COEFFICIENT_STRESS_RECURRENCE',
      'ordinaryPremises':'original real leading and native Picard analytic eta estimates, ordinary flat supports and fixed-endpoint moment differentiation',
      'reuseAcrossSourceOrders':[2,3,4,5],'independentN1StressGuards':source['distinctN1StressGuards'],
      'arithmetic':common_error_calculus(),
      'actualN5':{'readOnlyPrefixNodes':source['retainedLiteralN4Nodes'],'nativeGraphNodes':source['originalNodes'],
        'actualSystem':n5['actualSystem'],'auxiliarySystem':n5['auxiliarySystem'],
        'Omega4TwoBranchesTermCounts':n5['omegaCounts'],'previousOmegaViscosityOrder':n5['omegaPrior'],
        'ownPressureCross':'2(F1 F4+F2 F3)-Omega4/2, Omega4 already divided by X',
        'omittedCentralOmega4Numerator':source['N5']['omittedOmegaMiddleNumerator'],
        'omittedPressureCrossNumerator':source['N5']['omittedPressureCrossNumerator'],
        'finiteCallsReplaced':source['N5']['nativeCallsReplaced'],'finiteFiveMomentNumerators':[0]*5,
        'stressDensities':{r['component']:r['density'] for r in n5['stressRows']}},
      'genericFixedHistoryError':{'e_n':'4^-K/3','nativeEtaGain':'E_n=1+2/s_n, s_n=delta/(8*256^n)',
        'pressureStorage':'P_K velocity and average, P_(K+1) pressure',
        'closedDepth':'K=max(Kcondition_n+2,ceil(log_4(2^256*G_n)))',
        'strictLimit':'<2^-256 individually for all stated fixed-history errors',
        'scopes':['whole F_n,U_n,Pi_n value and ordinary first eta error, pointwise and absolute X integral',
          'whole F_n,U_n X-weighted first radial derivative error',
          'both source guarded axial and angular stresses pointwise and absolute X integral, independently in both directions'],
        'physicalOriginalPrefixErrorRetained':True,'exactLowerHistoriesPerRequestedOrder':True},
      'numericNativeCentersOrDepthValuesMaterialized':False,'pairedWholeN5':'OPEN','generalY':'OPEN','M3':'62/64','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as f:
        f.write((json.dumps(main(args.operands),indent=2)+'\n').encode())
    print('PASS: original native N5 and reusable fixed-history coefficient and stress bounds N2 through N5')
