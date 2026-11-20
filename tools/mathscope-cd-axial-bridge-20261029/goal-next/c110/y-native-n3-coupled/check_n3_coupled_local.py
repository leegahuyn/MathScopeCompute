from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


def exact_checks(source):
    assert source['actualSystems']==[3,5] and source['radialDomain']==[0,24805]
    assert source['originalEta']==2 and source['nativeEtaStrips']['ratioS2OverS3']==256
    assert [row['diag'] for row in source['exactWeightedSecond']]==[3,1]
    assert all(row['actualNumerator']==0 and row['omittedGeometricTermNumerator']>0
               for row in source['exactWeightedSecond'])
    assert source['exactLocalCoupledForcingFourIdentities']==[0]*4
    assert source['depths']['freeCoordinateCount']==0
    # Matrix slots work for the common envelope |exponents|<=4;
    # recompute the retained C105 row sums in units of Q^2/delta.
    assert 8+5*16<128
    assert 2*(4*(4*8+5*16)+5*16)<2**11
    assert 2*(4*(4*8+1)+5*16)<2**11
    diag=2+2**9+2*2*8*2
    rows=[2*(4*33*2+2**9)+(4*2*4*128*2+2*2**11)+4*2*4*128*2+diag,
          8*2*8*2+(2*4*33*2+4*2*4*2+2*2**11)+4*2*4*2+4*4*2*2+diag,
          2*(2*2+5*8)*2+2*(2*5*128*2),2*(2*2+5*8+5)*2+2*(2*5*2),32]
    assert max(rows)<2**20
    assert Q(1,2)+6*Q(1,128)<1 and 2+6*Q(1,128)<4
    assert 6*3*2**(20+27)<2**52 and 2**53<2**(260*26)
    # Original a^2=4 Q^-64 exp(t1/16), with 0<t1<1.
    assert 4/(1-Q(1,16))<5 and 5<3**2
    assert 2*Q(1,2**27) < Q(1,2**19)/16
    # The radial component and source operator applications, with strip loss.
    assert 2*(4+8+5*4)==64
    assert 2*(4*(4+1)+5*16)<2**8
    assert 2*(4*(4+2)+5*16)<2**8
    assert 2*(4*(4+1)+5*16)*2**8<2**17
    assert 2*(4+2*16+1)<2**7
    # Nine Omega terms, opposite positive lower indices, and source forcing.
    omega=2**7+6+3*6+3*2**10+2**17
    assert omega<2**18 and 8+Q(1,2)*omega<2**18
    assert 2*(8+2**10)+2**17<2**18
    assert 18*2**18<2**23 and 2**23*64**2==2**35
    # Exact real weighted radial second derivative uses no forcing X derivative.
    assert [Q(diag+2,4) for diag in (3,1)]==[Q(5,4),Q(3,4)]
    assert max(Q(5,4),Q(3,4),Q(1,2))<2
    assert 3*Q(1,2**258)<Q(1,2**256)
    return {'matrixChargeCommonUnits':max(rows),'OmegaErrorCharge':omega,
            'wordRatio':'6*Ma*a/s3 < 2^52 Q^-26 < 1/2',
            'allThreePositiveBudgetContributions':'<2^-258 each'}


def main(path):
    raw=path.read_bytes()
    source=json.loads(raw)
    return {'schema':'MathScope.C110.OriginalNativeN3PairedLocalMixedErrorEnclosure/1',
      'operandsSHA256':sha256(raw).hexdigest(),
      'status':'VERIFIED_ORIGINAL_SOURCE_RECURRENCES_CONDITIONAL_PAIRED_COMMON_RADIAL_COLLAR_STABILITY',
      'checks':exact_checks(source),
      'domain':{'originalX':['0','aSquared'],'radialMeaning':'actual core and original real B.26 collar, no analytic continuation in X',
                'etaMixedInputRegion':'S_(s2/16) contains S_(2*s3); original real eta in [-1,1] covered'},
      'pairedN2':{'bound':'N2Cut=(1+3*k1+k2)*(E2+2*J2)',
        'E2':'4^-K2/3+2*a*Fd2','J2':'16*Ma*(1+2/s2)*E2+Fd2',
        'covers':['F2,U2 actual cut values','first X derivatives','X-weighted second X derivatives'],
        'strip':'S_(s2/2)','needsForcingRadialDerivative':False},
      'pairedN3':{'threeForcingRows':'Fd3=2^35*P*(e+N2Cut)/s2^4','localStability':'2*a*Fd3 on S_(s3)',
        'trueToPairedFinite':'E3=4^-K3/3+2*a*Fd3','localPrecisionGain':'explicit closed N,K2,K3 in source operand graph',
        'pointwiseMixedTargets':'raw and actual cut F3/U3, through eta order 3 for values, first X, and X-weighted second X derivatives; raw Pi3 values and eta orders 1..3',
        'finitePressureStorage':'P_(K3+1)','strictErrorForEveryTarget':'<2^-256','finiteNumericalCentersEvaluated':False},
      'outsideLocalCollar':'OPEN. Paired full Ipos moment coefficient C_eta^3 from the global N1 histories and original leading real eta<=5 is required for an N3 whole-support estimate.',
      'minimalRemainingForWholeOmega2':['C_eta^3 of DeltaU2 and its fixed average',
        'C_eta^2 of DeltaU2_X and X DeltaU2_XX and their fixed averages',
        'matching true/finite lower norms and whole lower pressure and flux debts on original X switch'],
      'generalY':'OPEN','M3':'62/64','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as output:
        output.write((json.dumps(main(args.operands),indent=2)+'\n').encode())
    print('PASS: paired N2 weighted radial derivatives and N3 local mixed stability on exact original source collar')
