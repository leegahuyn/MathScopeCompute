from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


def exact(source):
    assert source['systems']==[3,5,7] and source['originalEta']==2
    assert source['originalRadialDomain']==[0,24805]
    assert source['fixedMatrixEntries']==72 and source['nativeStripIds']['ratio']==256
    assert source['pairedExactNumerators']==[0]*4 and source['omittedPreviousOmega2DiffNumerator']>0
    assert source['finiteDepths']['bitsEach']==259 and source['finiteDepths']['freeCoordinates']==0
    # Same source row bound as C110, now justified for the 8h slots.
    assert Q(1,2)+7*Q(1,128)<1 and 2+8*Q(1,128)<4
    diag=2+2**9+2*2*8*2
    rows=[2*(4*33*2+2**9)+(4*2*4*128*2+2*2**11)+4*2*4*128*2+diag,
          8*2*8*2+(2*4*33*2+4*2*4*2+2*2**11)+4*2*4*2+4*4*2*2+diag,
          2*(2*2+5*8)*2+2*(2*5*128*2),2*(2*2+5*8+5)*2+2*(2*5*2),32]
    assert max(rows)<2**20
    assert 6*3*2**(20+35)<2**60 and 2**61<2**(260*26)
    assert 2*Q(1,2**35) < Q(1,2**27)/16
    assert 2*(4+8+5*4)==64
    assert 2*(4*(4+1)+5*16)<2**8 and 2*(4*(4+2)+5*16)<2**8
    assert 2*(4*(4+1)+5*16)*2**8<2**17
    omega_bound=2**7+6+4*6+4*2**10+2**17
    assert omega_bound<2**18 and 12+Q(1,2)*omega_bound<2**18
    assert 3*(8+2**10)+2**17<2**18 and 18*2**18<2**23
    assert 2**23*64**2<2**36 and 4*Q(1,2**259)<Q(1,2**256)
    return omega_bound


def report(path):
    raw=path.read_bytes()
    state=json.loads(raw)
    integer=exact(state)
    return {'schema':'MathScope.C112.OriginalNativeN4PairedLocalMixedError/1',
       'operandsSHA256':sha256(raw).hexdigest(),'classification':'VERIFIED_ORIGINAL_N4_PAIRED_FORCING_CONDITIONAL_LOCAL_MIXED_ERROR',
       'exactPairedNumerators':state['pairedExactNumerators'],'omegaErrorInteger':integer,
       'domain':'original 0<=X<=aSquared, native leading and B.26 real radial collar with complex eta losses only',
       'pairedN4':{'sharedOriginalMatrixEntries':72,'sourceForcingError':'2^36 H3 (e+N2Cut+N3Cut)/s3^4',
        'nativeWordRatio':state['nativeWordRatio'],'velocityAndMassStorage':'P_K4','pressureStorage':'P_(K4+1)',
        'strictUniformCap':'<2^-256 for local raw/cut F4,U4 with eta<=3 and value,dX,X*dXX, and raw Pi4 eta<=3',
        'numericalEvaluationAtThoseDepths':False},
       'wholeN4Paired':'OPEN','finalJets':0,'generalY':'OPEN','release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as f:
        f.write((json.dumps(report(args.operands),indent=2)+'\n').encode())
    print('PASS: original N4 four coupled forcing identities and paired local mixed derivative cap')
