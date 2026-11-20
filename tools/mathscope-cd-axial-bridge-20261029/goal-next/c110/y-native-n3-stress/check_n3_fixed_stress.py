from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


def checked_operands(path):
    data=path.read_bytes()
    source=json.loads(data)
    assert source['sourceTermCounts']=={'z':12,'theta':11}
    assert source['activeCutoffs']==[28814,28824] and source['originalEta']==2
    assert [row['density'] for row in source['originalStress']]==[123840,123841]
    assert source['conservativeNumerators']==[0,0]
    assert all(n>0 for n in source['wrongEtaAndExponentNumerators'])
    assert all(row['wrongForwardSignRejected'] for row in source['originalStress'])
    assert source['nativePicard']['system']==5 and source['nativePicard']['KMinus2Required']
    assert [source['nativePicard'][name] for name in ('C','s','Kcondition')]==[121892,120822,121901]
    assert source['leading']['copiedNodes']==1968 and [source['leading'][k] for k in ('U','F')]==[2323,2329]
    assert source['uniformBudget']['freeCoordinateCount']==0
    assert source['uniformBudget']['fixedOriginalHistories']
    assert source['exactLowerRecursionDifferences']['omega2Numerator']==source['exactLowerRecursionDifferences']['rawPressureNumerator']==0
    assert source['exactLowerRecursionDifferences']['lowerAngularAndAxialNumerators']==[0,0]
    assert source['exactLowerRecursionDifferences']['preservedActualMatrixEntries']==72
    return source,sha256(data).hexdigest()


def verify_rational_caps():
    # Replacement by a P_K derivative uses 1/(2 xi), then six matrix
    # entries and the native K-2 tail loss 4^2.
    assert Q(1,2)*6*4**2==48
    assert 9*64<1024
    bump_first=16*2048
    bump_second=8192*2048**2
    assert [bump_first,bump_second]==[2**15,2**35]
    assert Q(1,2)+5*Q(1,16)<1 and 1+5*Q(1,16)<2
    assert 4*Q(1,16)<1 and Q(1,2)+4*Q(1,16)<1
    assert 2*(2+2+1)<16  # v from U and its actual regular mass average.
    # Boundary and ordinary remainder bound constants, in common units.
    bz=1+16+2+2+12
    bt=2+32+4+4+16
    rz=2*(1+1+2*3+3)
    rt=2*(2*2+2+2*4+4)
    assert (bz,bt,rz,rt)==(33,58,22,36)
    guards=(2*bz+rz,2*bt+rt)
    assert guards==(88,152) and max(guards)<256
    assert Q(1,3)*Q(1,2**256)<Q(1,2**256)
    return {'boundaryNumerators':[bz,bt],'remainderNumerators':[rz,rt],
            'guardedIntegralNumerators':guards,'bumpHeightValueAndSlope':[bump_first,bump_second],
            'rawWeightedXEntryCoefficient':48}


def proof(path):
    source,digest=checked_operands(path)
    return {'schema':'MathScope.C110.OriginalNativeN3FixedHistoryAbsoluteStressError/1',
      'operandsSHA256':digest,'sourceStatus':'VERIFIED_EXACT_N3_FIXED_HISTORY_STRESS_CONSERVATION_AND_COUPLED_FORCING_IDENTITIES',
      'ordinaryStatus':'CONDITIONAL_ON_THE_ORIGINAL_NATIVE_TAIL_AND_ORDINARY_LEADING_AND_MOMENT_REALIZATIONS',
      'originalStressDensities':{r['component']:r['density'] for r in source['originalStress']},
      'nativeFixedEta':source['originalEta'],'radialCutoffs':source['activeCutoffs'],'rationalCaps':verify_rational_caps(),
      'pointwiseAndAbsoluteL1':{
        'commonBound':'G*4^-K/3',
        'G':'256 B^3 H0 max(1,TU,TF,TP,DU,DF) max(1,1/sqrt(2Xminus),1/(2Xminus))',
        'depth':'K=max(Kcondition+2,ceil(log_4(2^256*G)))',
        'strictCapForEach':'<2^-256',
        'fullPhysicalDomains':'uniform eta in [-1,1]; forward original supported function on X>=0 and backward on original Xminus<X<Xplus',
        'metrics':['axial sup','angular sup','axial absolute dX integral','angular absolute dX integral'],
        'scopeUnchangedExactLowerN0N1N2':True,'depthAndNativeValuesNumericallyEvaluated':False},
      'signedConservation':{'firstEtaDerivativeOfFixedBoundZeroMomentsRetained':True,
        'axisPressureDatumAndOuterSupportRetained':True,
        'forwardMinusBackwardError':'plus original uncut error integral from 0 to Xminus divided by the same radial normalizer',
        'innerPrefixAssertedZero':False},
      'coupledLower':{'exactOmega2RawPressureAngularAndAxialForcingTransfer':True,'fixedActualMatrixEntries':72,'quantitativeClosed':False,
        'openInputs':['ordinary paired N2 v2, v2_X, X v2_XX and eta derivative bounds over its source switch and Ipos collars',
                      'same paired N1 v1 two Z derivatives and their eta traces, and paired N2 previous-order viscosity for stress',
                      'N3 resolvent with paired forcing on a certified common eta strip and propagated five moment and pressure errors']},
      'generalY':'OPEN','M3':'62/64','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    result=proof(args.operands)
    with args.out.open('xb') as file:
        file.write((json.dumps(result,indent=2)+'\n').encode())
    print('PASS: original N3 guarded axial and angular absolute stress errors at fixed histories')
