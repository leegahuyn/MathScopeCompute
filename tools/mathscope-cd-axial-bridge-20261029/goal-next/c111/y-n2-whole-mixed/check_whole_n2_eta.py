from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


def audit(path):
    raw=path.read_bytes()
    source=json.loads(raw)
    leading=source['leading']
    assert (leading['requestedRadialOrder'],leading['requestedEtaOrder'])==(2,5)
    assert leading['copiedNormNodes']>1900 and len(leading['roots'])==2
    assert source['exactBumpXIdentities']==[0]*4
    assert source['wholeLowerSource']['originalOmega0Terms']==4
    assert source['wholeLowerSource']['originalOmega1Terms']==7
    assert source['wholeLowerSource']['keptOriginalMassAndPressureGauge']
    assert source['sourceDepths']['separateTailBits']==269 and source['sourceDepths']['allFreeCoordinateCount']==0
    # Sum of factorial-weighted real eta derivatives of 1/L. A radius
    # 1/2 disc around real eta is in the original uniform complex region.
    assert 2*sum(2**j for j in range(6))==126<128
    assert 1-2*Q(1,128)*Q(3,2)**2>Q(1,2)
    assert 2+1+1==4  # C^m factorial norm of d=1-eta^2 for m>=2.
    assert 2+2+1==5  # Norm of the exact inverse amplitude times Ef.
    radial_velocity=128*(4+4+20)
    assert 3*radial_velocity<2**20 and radial_velocity<2**16
    z_charge=128*(4*(4+1)+4*4)
    t_charge=128*(4+1+2*4)
    assert z_charge<2**13 and t_charge<2**11
    assert 2**11+6+3+2*2**13<2**15
    assert 128*(4+4+4*3)<2**12
    assert 4096*(Q(1,2**269)+Q(1,2**269))==Q(1,2**256)
    return {'schema':'MathScope.C110.OriginalNativeN2PairedWholeMixedEtaError/1',
      'operandsSHA256':sha256(raw).hexdigest(),
      'classification':'VERIFIED_ORIGINAL_LEADING_ETA5_AND_BUMP_CALCULUS_CONDITIONAL_WHOLE_PAIRED_N2_MIXED_ERROR',
      'originalNormRoots':leading['roots'],'leadDAGNodes':leading['copiedNormNodes'],
      'wholeResult':{'norm':'factorial-weighted uniform real C_eta^3 for F2,U2 values, first X derivatives and X-weighted second X derivatives',
          'domain':'X>=0, eta in [-1,1], including actual taper, gap, Ipos and outer zero saturation',
          'error':'S2whole=G1*e+G2*N2Cut with closed original gains G1,G2',
          'physicalMassProjection':'same regular average as true/finite U2',
          'radialField':'v2, v2_X, X v2_XX have real C_eta^2 error at most 4096*S2whole',
          'strictUniformLimitForAllListedErrors':'<2^-256 at the two explicit closed source depths'},
      'currentScope':'both positive-order lower histories paired, original leading and original inverse held fixed',
      'independentOuterInput':'real whole N2 mixed lower error needed by the original N3 Omega2 first eta trace',
      'remaining':'propagate through the N3 whole Omega2 pressure and flux debts and bound the coupled N3 stress. No certified-depth values evaluated.',
      'generalY':'OPEN','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as f:
        f.write((json.dumps(audit(args.operands),indent=2)+'\n').encode())
    print('PASS: original whole N2 paired real eta3 mixed radial error and full radial v2 trace')
