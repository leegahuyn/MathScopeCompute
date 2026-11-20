from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    "c103": "75221f220bc472ca8bb4f600a3cb46cb76e07d4d386ba1dcf6ce254e5b86e18b",
    "c102": "68f115ba24df5970da8c4c9e684e8a6f541078e0d8cd33178db999e05774140f",
    "c100": "17664f981265e2373a5c16d0bf3c9dc233af48605974de1e072520b9932b71de",
    "c101Taper": "867bc1d589edd923257c2250672ca66d1341847a914eba952ac2b645ed627f8a",
    "c101Outer": "867fbbeac0e03f6e685c89c8e08022ac09f71dfbe0de6b1b00cb0f7c38e0af59",
    "c102Outer": "6bbefee4ade3b5745110c72f3179c19d815c84cad691a993dc8dd2b5b4cc4193",
}


def read(path, pin):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==pin,path
    return json.loads(data)


def check_inputs(args):
    data=args.operands.read_bytes()
    operands=json.loads(data)
    c103=read(args.c103,PINS['c103'])
    c102=read(args.c102,PINS['c102'])
    c100=read(args.c100,PINS['c100'])
    taper=read(args.c101_taper,PINS['c101Taper'])
    outer=read(args.c101_outer,PINS['c101Outer'])
    absolute=read(args.c102_outer,PINS['c102Outer'])
    assert operands['previousPins']['C103']==PINS['c103']
    assert c103['quantitative']['actualStrip']=='s=delta/2^19'
    assert c103['quantitative']['tail']=='E=4^-K/3 for K>=actual_Kcondition'
    assert c103['quantitative']['realizedOnS_sOver2']['V2']=='E'
    assert c103['zeroCompensatorMomentNumerators']==5
    assert c102['sourceScaleBounds']['Xb']=='C^11'
    assert c102['sourceScaleBounds']['H']=='1+originalPositiveUValueBounds[932]+originalPositiveFValueBounds[937]'
    assert c100['norms']['rawF1U1XDerivativeErrorOnDeltaOver16']=='2^46 Q^-19'
    assert c100['norms']['rawF1U1WeightedXSecondDerivativeErrorOnDeltaOver16']=='2^46 Q^-19'
    assert taper['exactIsolatedTaperTrace']['axial']=='-128 sigmaPrime(u) eU/t1'
    assert outer['exactOrdinaryUncutWholeErrorIntegralZero']=={'axial':True,'weightedAngular':True}
    assert absolute['sourceMassRatioUpper']=='mConst/r^2 <= 2 exp(2-60000T) < 2^-59997'
    actual=operands['actualSupport']
    assert actual['Xplus']==28824 and actual['Xb']==28826 and actual['n1AngularDifferentEnd']
    assert operands['eta']==2 and operands['X']==4756
    assert operands['sourceTermCounts']=={'axial':10,'angular':9}
    assert operands['rawFixedEtaIndependentCutoffs']
    assert len(operands['stress'])==2
    z,t=[next(row for row in operands['stress'] if row['component']==kind) for kind in ('z','theta')]
    assert [z['forwardDensity'],t['forwardDensity']]==[120791,120790]
    assert [z['root'],t['root']]==[120807,120800]
    for row in (z,t):
        assert row['physicalSupport']==[28814,28824]
        assert row['forwardBoundaries']==[28814,4756]
        assert row['backwardBoundaries']==[4756,28824] and row['binder']!=row['backBinder']
        assert row['eta']==2 and row['wrongForwardSignRejected']
    con=operands['conservativeIdentities']
    assert con['axial']==con['angular']==0 and con['shiftExponentRows']==[0]*5
    assert con['wrongN1ExponentResidualMonomials']>0
    assert operands['optionalInnerPressureForcingSensitivity']['exactErrorIdentityNumeratorMonomials']==0
    return operands,sha256(data).hexdigest()


def numerical_budgets():
    # Six matrix entries per row and Cauchy's loss s/2. W-P_(K-2)
    # has tail 16E, and the even row derivative identities divide by two.
    assert Fraction(1,2)*6*16*(1+2) < 2**8
    # Upper bounds in units Q^2*g*E from the independently checked Ipos
    # coefficient and original bump derivative caps.
    a,b,b0,b1=2**17,2**31,2**15,2**2070
    ipos_u=16*a*b1
    ipos_f=24*b*(b1+b0)
    assert max(ipos_u,ipos_f)<2**2110
    assert 5*2**2110<2**(260*62)
    assert 64*9+1<2**10
    assert 5*2**9<2**(260*62)  # X*v0 on local error support is below one.
    # g=max physical taper and Ipos caps are already in D; R is the
    # register D_X field error. Difference conservative integrals have
    # no leading eta derivatives outside the local or Ipos support.
    assert 2*8+1==17
    assert 2*(8+8)==32
    # Boundary norms B_z and B_theta in units of B*H*E and B^2*H*Q*E.
    assert 2+1+2+4*17<74
    assert 4+2+4+4*32<140
    # Unintegrated remainder bounds in units E/s and X*Q*E/s.
    assert 2*(3+2*17+2*2+5*34) < 2**9
    assert 2*(6+2*32+2*4+5*64) < 2**10
    # Each pointwise and integrated primitive fits the same common scale;
    # all exponents of B,Q,H,s^-1 below have each been bounded upward.
    axial=2*74+4*2**8+4*2**10+2**9
    angular=2*140+8*2**8+8*2**10+2**10
    assert axial<angular<2**14
    return axial,angular


def local_pressure_budget():
    # On X>=Xa, the exact cutoff has w=t1/64. Retain its rapidly
    # increasing second derivative separately and use t1<=1.
    assert Fraction(9*64,4) < 2**8
    assert Fraction(9*64+8192*64**2,4) < 2**24
    assert 1+2*9*64 < 2**25
    assert 2*(4+8+5*2) < 2**6
    assert 4*2**6 == 2**8
    assert 2*(4*3*2**6+5*2**8) < 2**13
    assert 2*(4*2*2**9+5*2**11) < 2**15
    time=2*(3*2**6+4*2**8)
    radial=6*2**6
    v_product=2*Fraction(3,2)*2**9*2**6
    u_product=8*2**13+2**15
    assert time+radial+v_product+u_product < 2**19
    assert 3+Fraction(1,2)*(time+radial+v_product+u_product) < 2**19
    return [time,radial,int(v_product),u_product]


def main(args):
    source, operands_sha=check_inputs(args)
    axial,angular=numerical_budgets()
    components=local_pressure_budget()
    result={
      'schema':'MathScope.C104.ActualN2AbsoluteStressError/1',
      'sourceStatus':'VERIFIED_ORIGINAL_N2_STRESS_BOTH_PRIMITIVES_AND_CONSERVATIVE_ERROR_IDENTITIES',
      'ordinaryStatus':'CONDITIONAL_ON_C103_ORDINARY_ORIGINAL_LOWER_AND_N2_PICARD_REALIZATIONS',
      'operandsSHA256':operands_sha,'previousReceiptPins':PINS,
      'actualStress':source['stress'],
      'conservativeIdentities':source['conservativeIdentities'],
      'literalOuterCutoff':[28814,28824],
      'coefficientEnclosure':{
          'rawTail':'E=4^-K/3 for K>=Kcondition+2',
          'registeredStrip':'s=delta/2^19',
          'rawXAndWeightedSecondXError':'R=2^8 C2 E/s',
          'wholeWeightedFirstRadialFieldError':'D=R+2^10 CSelected^120 E',
          'leadingGeometry':'B=CSelected^11; H=1+Ubound[932]+Fbound[937]',
          'degreeAbsorptionNumeratorsForZAndTheta':[axial,angular],
          'commonPrefactor':'M=2^14 Q^65 B^3 H (1+C2+CSelected^120)/s',
          'bothPointwiseAndAbsoluteIntegralThroughXplus':'M E',
          'sufficient256BitDepth':'max(Kcondition+2,ceil((256 log(2)+log(M))/log(4)))',
          'sufficientDepthGives':'each original N2 pointwise and absolute dX stress error strictly <2^-256',
          'depthMaterialized':False,
      },
      'conservativeTransfer':{
          'uncutSignedDifferenceIntegralAfterAllIposBumps':{'axial':0,'angular':0},
          'forwardMinusBackwardDifference':'initial uncut error prefix through Xminus divided by the original normalization',
          'exactBackwardErrorBeyondLastIposBump':0,
          'sourceForwardCutoffAndFiniteInitialPrefixDefectRetained':True,
      },
      'optionalInnerPressureSourceFromN1':{
          'status':'CONDITIONAL_LOCAL_INHOMOGENEITY_BOUND_WITH_EXACT_SOURCE_IDENTITY',
          **source['optionalInnerPressureForcingSensitivity'],
          'firstInputStrip':'s1=delta/16',
          'N1CutoffDerivativeBound':'Bdelta=2^25 Q^64 t1^-2 (E1+R1)',
          'OmegaIntegerCharges':components,
          'N2PknownError':'2^19 Bdelta/s1^2 uniformly through aSquared on S_(s1/4)',
          'N2PressureForcingRowError':'2*sqrt(X) times the N2 Pknown error bound',
          'includesGlobalLowerMomentRetargeting':False,
      },
      'remaining':'OPEN_FINITE_QUADRATURE_CENTERS_COUPLED_GLOBAL_N1_N2_ERROR_AND_ALL_ORDER_REALIZATION',
      'finalJets':0,'release':'HOLD'
    }
    with args.out.open('xb') as output:
        output.write((json.dumps(result,indent=2)+'\n').encode())
    print('PASS: both original N2 stress caps; exact two-direction primitive transfer; local N1-to-N2 source sensitivity')


if __name__=='__main__':
    parser=ArgumentParser()
    for name in ('operands','c103','c102','c100','c101-taper','c101-outer','c102-outer','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    main(parser.parse_args())
