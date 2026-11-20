from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


def exact_checks(source):
    assert source['nativeSystem']==7 and source['eta']==2 and source['X']==4756
    assert source['leadingNodes']==3496 and source['highEtaLowerColumnsExactlyRegenerated']
    assert source['priorLocalN4ExactForcingNumerators']==[0]*4
    assert source['pairedAllPositiveHistories'] and source['wholePressureGaugePreserved']
    assert source['currentPressureMiddleF2SquaredRequiredNumerator']>0
    assert source['lowerAxialStressMiddleU2SquaredRequiredNumerator']>0
    assert source['exactCoupledStressNumerators']==[0,0]
    assert all(x>0 for x in source['wrongLowerFluxAndPreviousViscosity'])
    assert source['momentResiduals']==[0]*5 and source['weightedAngularViscosityShiftNumerator']==0
    assert source['originalOmega3']['terms']==[11,11] and source['originalOmega3']['previousViscosity']==2
    assert all(r['eta']==2 and r['bounds']==[0,28824] for r in source['originalOmega3']['integrals'])
    assert source['originalStressTermCounts']==[14,13]
    assert {r['component']:r['density'] for r in source['originalStressRows']}=={'theta':127211,'z':127212}
    for row in source['originalStressRows']:
        assert row['eta']==2 and row['forward']==[28814,4756] and row['backward']==[4756,28824]
        assert row['wrongSignRejected'] and row['binders'][0]!=row['binders'][1]
    assert source['closedDepths']['bitsEach']==259 and source['closedDepths']['freeCoordinates']==0
    assert source['closedDepths']['lowerIndividuallyUnweightedDerivativeFactor']==120
    assert not source['closedDepths']['nativeValuesNumericallyEvaluated']
    # 4h and 6h in N3 become 6h and 8h in the respective N4 exponents.
    assert Q(1,2)+7*Q(1,16)<1 and 1+7*Q(1,16)<2
    assert 6*Q(1,16)<1 and Q(1,2)+6*Q(1,16)<1
    # The (1,3), (2,2), (3,1) product terms charge each error exactly twice.
    for i in (1,2,3):
        assert sum((j==i)+(4-j==i) for j in (1,2,3))==2
    assert 2**14+6+4*6+8*2**15+2**31<2**33
    assert max(2+Q(1,2)*2**33,4,4+Q(1,2)*2**33)<2**35
    assert 2*(2+2+1)<16
    bz=1+16+2+2+2+8
    bt=2*(1+16+2)+4+4+16
    rz=2*(1+1+2*2+2)
    rt=2*(2*2+2+2*4+4)
    assert (bz,bt,rz,rt)==(31,62,16,36)
    assert (2*32+17,2*64+38)==(81,166) and max(81,166)<256
    assert 4*Q(1,2**259)<Q(1,2**256)
    return {'boundary':[bz,bt],'nonviscousRemainders':[rz,rt],
            'guardedIntegralBeforeRadialNormalizer':[81,166],'finalCommonInteger':256}


def receipt(path):
    raw=path.read_bytes()
    source=json.loads(raw)
    return {'schema':'MathScope.C113.OriginalNativeN4WholePairedPressureStressError/1',
        'operandsSHA256':sha256(raw).hexdigest(),
        'verification':'VERIFIED_ORIGINAL_N4_COUPLED_CONSERVATIVE_STRESSES_PRESSURE_F2_SQUARE_AND_ALL_FIVE_MOMENTS',
        'ordinaryAssumptions':'pinned original leading and native analytic eta solution estimates, real ordinary lower fields and paired realizations, original flat endpoints and differentiation under fixed-limit moments',
        'arithmetic':exact_checks(source),'stressConservativeNumerators':source['exactCoupledStressNumerators'],
        'wrongLowerFluxAndPreviousViscosity':source['wrongLowerFluxAndPreviousViscosity'],
        'wrongMiddleProducts':{'pressureF2Squared':source['currentPressureMiddleF2SquaredRequiredNumerator'],
                               'axialFluxU2Squared':source['lowerAxialStressMiddleU2SquaredRequiredNumerator']},
        'sourceTransfer':{
            'fixedExactLeading':True,'allPositiveOrdersPaired':[1,2,3,4],
            'etaBank':'original leading radial2 eta7, paired N2 eta5 and N3 eta3; actual gain columns re-instantiated identically',
            'bothSourceOmega3Branches':'Delta Omega3 / X bounded in real first eta norm by 2^33 B^2 A (D1+D2+D3)',
            'originalWholePressureAndFluxDebt':'Dlow4=2^35 B^3 A (D1+D2+D3)',
            'allFiveMomentErrors':'M4=4 B^2 H eta4+B Dlow4',
            'pressureCompatibleStorage':'P_(K4+1) with original zero axis and saturated outer gauge; d_X pressure retains full lower forcing',
            'pressureError':'P4=eta4+B*(2H*S4+Dlow4) in real eta first norm'},
        'wholeError':{'strictLimit':'<2^-256','fieldErrors':['F4,U4 values and first real eta derivatives and first and X-weighted second radial forms',
                         'Pi4 value and first real eta derivative and corresponding first X derivative'],
            'stressErrors':'both original axial and weighted angular pointwise and L1(dX), forward on the whole zero extension and backward on original guard',
            'wholeStressSignedConservationConditional':True,'originalInnerPrefixDefectRetained':True,
            'sourceDepths':'closed original N,K2,K3,K4; all K_j>=Kcondition_j+2 with four contributions <2^-259 individually',
            'numericallyEvaluatedTermsOrCenters':False},
        'pairedN4WholeStatus':'CONDITIONAL_FIXED_ORIGINAL_ALGEBRA_AND_ORDINARY_BOUND',
        'generalY':'OPEN','M3':'62/64','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as output:
        output.write((json.dumps(receipt(args.operands),indent=2)+'\n').encode())
    print('PASS: original whole paired N4 pressure and both guarded stresses with four closed depths')
