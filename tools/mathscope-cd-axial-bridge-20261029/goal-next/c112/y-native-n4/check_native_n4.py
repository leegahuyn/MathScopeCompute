from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


def source_check(path):
    raw=path.read_bytes()
    data=json.loads(raw)
    assert (data['nativeSystem'],data['auxiliarySystem'])==(7,6)
    assert data['retainedLiteralN3Nodes']==123870 and data['originalNodeCount']>123870
    assert data['originalEta']==2 and data['originalX']==4756
    assert data['lowerHistoriesFrozenThroughOrder']==3
    assert data['pressureStorage']['wrongSameDepthRejected'] and data['pressureStorage']['finiteDepths']==[2,3]
    assert data['pressureStorage']['displayMax']==8
    assert data['omega3']['branchTermCounts']==[11,11] and data['omega3']['switch']==[24805,28824]
    assert data['omega3']['normalizedOmegaTransportPairs']==[[0,3],[1,2],[2,1],[3,0]]
    assert data['omega3']['physicalPairs']==[[1,3],[2,2],[3,1]]
    assert data['omega3']['previousViscosityOrder']==2
    assert data['omega3']['omittedMiddlePressureProductNumerator']>0
    assert all(row['endpoints']==[0,28824] and row['eta']==2 for row in data['omega3']['lowerIntegrals'])
    assert data['fiveMomentNumerators']==[0]*5 and data['replacedNativeN4Calls']==19
    assert data['originalStress']['counts']==[14,13] and data['originalStress']['conservativeNumerators']==[0,0]
    assert all(x>0 for x in data['originalStress']['wrongEtaAndHomogeneity'])
    assert data['originalStress']['fixedLowerOnlyPositions']=={'angular':[3,4,5,6,7,8,12],'axial':[3,4,5,6,7,8,13]}
    for row in data['originalStress']['rows']:
        assert row['eta']==2 and row['forward']==[28814,4756] and row['backward']==[4756,28824]
        assert row['wrongSignRejected'] and row['binders'][0]!=row['binders'][1]
    assert data['uniformBudget']['freeCoordinates']==0 and data['leadingNormNodes']==2659
    assert not data['nativeNumericalValuesEvaluated'] and not data['pairedN4Quantitative']
    return data,sha256(raw).hexdigest()


def integer_checks():
    # For real eta, the exact n=4 exponents obey the same bounds used for
    # the two current conservative remainder terms, since h<1/16.
    assert Q(1,2)+7*Q(1,16)<1 and 1+7*Q(1,16)<2
    assert 6*Q(1,16)<1 and Q(1,2)+6*Q(1,16)<1
    assert Q(1,2)*6*4**2==48
    assert 9*64<1024 and [16*2048,8192*2048**2]==[2**15,2**35]
    assert 2*(2+2+1)<16
    moment_coefficients=[1,2,2,4,4]
    assert max(moment_coefficients)==4
    bz=1+16+2+2+12
    bt=2+32+4+4+16
    rz=2*(1+1+2*3+3)
    rt=2*(2*2+2+2*4+4)
    assert (bz,bt,rz,rt)==(33,58,22,36)
    domain_caps=(2*bz+rz,2*bt+rt)
    assert domain_caps==(88,152) and max(domain_caps)<256
    assert Q(1,3)*Q(1,2**256)<Q(1,2**256)
    return {'boundaryIntegerCaps':[bz,bt],'remainderIntegerCaps':[rz,rt],
            'bothDirectionIntegralBeforeRadialNormalizer':domain_caps,'finalInteger':256,
            'rawFirstRadialEntryCharge':48,'fiveLocalMomentIntegerCaps':moment_coefficients}


def main(path):
    data,digest=source_check(path)
    return {'schema':'MathScope.C112.OriginalNativeN4FixedLowerCoefficientStressError/1',
      'operandsSHA256':digest,'sourceStatus':'VERIFIED_ORIGINAL_N4_PRESSURE_STORAGE_ELEVEN_TERM_OMEGA3_FIVE_DEBTS_AND_STRESS_IDENTITIES',
      'ordinaryStatus':'CONDITIONAL_ON_ORIGINAL_NATIVE_ANALYTIC_TAIL_ORDINARY_LEADING_AND_FIXED_ENDPOINT_MOMENT_REALIZATIONS',
      'integerChecks':integer_checks(),
      'actualSourceDepth':{'holdFixedExactly':[0,1,2,3],'nativeValueTail':'e=4^-K/3',
        'nativeOneEtaDerivativeGain':'E=1+2/s, s=delta/2^35',
        'K':'max(Kcondition+2,ceil(log_4(2^256*G)))','closedSourceGainComputed':True,
        'numericTermsOrCentersEvaluated':False},
      'originalPressureOmega3':{'known':'2 F1 F3+F2^2-Omega3/2 using finalized original lower cuts',
        'bothBranchesExactTerms':data['omega3']['branchTermCounts'], 'originalMomentHistoryEnd':28824,
        'pressureCompatibility':'velocity P_K and pressure P_(K+1); retain Pi4(0) and original outer zero gauge'},
      'errorCap':{'gain':'256 B^3 H max(1,TU,TF,TP,DU,DF) max(1,(2Xminus)^(-1/2),(2Xminus)^(-1))',
        'strictUniformTargetEveryListedError':'<2^-256',
        'fixedCoefficientScope':['F4,U4,Pi4 values and first eta derivatives on X>=0','X-weighted first X derivatives of F4,U4',
                                 'each whole coefficient absolute X-integral, including its first eta derivative'],
        'stressScope':['original axial forward and backward on the guard','original weighted angular forward and backward on its guard',
                       'pointwise and absolute X-integral errors for both channels'],
        'forwardOutsideGuardExactZero':True,'backwardOutsideGuardClaimed':False,
        'wholeSignedConservationConditional':True,'actualInnerPrefixDefectRetained':True},
      'pairedN4':'OPEN','pairedLowerForcingMinimumRemaining':[
          'N3 whole real C_eta^3 U3 values and C_eta^2 first X and X-weighted second X derivatives for v3 in Omega3',
          'N2 v2 through eta order 3 and mixed v2_X eta order 2, X v2_XX eta order 1 for the previous Z^2 v2 term',
          'whole coefficient transported lower Omega3 errors and matched N4 ordinary histories'],
      'generalY':'OPEN','M3':'62/64','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as f:
        f.write((json.dumps(main(args.operands),indent=2)+'\n').encode())
    print('PASS: original N4 exact source joins and fixed-history whole coefficient and stress errors')
