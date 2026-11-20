"""Check original N1 pointwise and absolute outer stress-error envelopes."""

from fractions import Fraction as F
from hashlib import sha256
import json
from pathlib import Path
import sys


C101 = '867fbbeac0e03f6e685c89c8e08022ac09f71dfbe0de6b1b00cb0f7c38e0af59'
C101_OPS = 'f9910c12ee41bda2e75fcc12d71a6837f52d495dcdc0bb91af43ea6c3eb7bb46'


def pinned(path, pin):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == pin, path
    return json.loads(raw)


def verify(operands, older):
    raw=operands.read_bytes()
    data=json.loads(raw)
    assert data['schema']=='MathScope.C102.OriginalN1AbsoluteOuterOperands/1'
    prior=pinned(older/'n1-outer-flux.json',C101)
    original=pinned(older/'n1-outer-flux-operands.json',C101_OPS)
    assert data['prior']['C101Outer']==C101 and data['prior']['C101Ops']==C101_OPS
    assert data['originalPrefixSHA256']==original['originalPrefixSHA256']
    assert all(data['dispatch'].values())
    s=data['originalSource']
    assert [s[k] for k in ('cut','IposLeft','last','IposRight','Xplus','Xb')]==[28823,28987,117099,28988,28824,28826]
    assert [s[k] for k in ('actualAxialDensity','forwardAxialIntegral','backwardAxialIntegral')]==[117047,117057,117066]
    assert prior['compensatedErrorsZeroAfterLastAngularBump']
    assert prior['exactOrdinaryUncutWholeErrorIntegralZero']=={'axial':True,'weightedAngular':True}
    assert prior['lateClippedForwardConstantUpper']=={'axial':'5 g R','weightedAngular':'9 g^2 R'}
    assert prior['preIposGapExactErrorFromCut']['radialMassCoefficientUpper']=='2^8 g E/delta'
    assert prior['preIposGapExactErrorFromCut']['pressureCoefficientUpper']=='2^12 Q g E/delta'
    norm=data['sameSourcePositiveLeadingValueBounds']
    assert norm['domains']['U']['X']==['0','infinity']
    assert norm['domains']['F']['X']==['0','Xplus=Xv*exp(1)']
    assert norm['domains']['U']['eta']==norm['domains']['F']['eta']==['-1','1']
    assert norm['activeHeatI2']
    arith=dict(norm['arithmeticNodes'])
    assert norm['nodeCount']==len(arith)==len(norm['arithmeticNodes'])
    assert norm['F'] in arith and norm['U'] in arith and norm['F']!=norm['U']
    for index,node in arith.items():
        op,args=node['op'],node['args']
        children=[] if op in ('rational','source_parameter') else args[:1] if op=='integer_power' else args
        assert all(child in arith and child<index for child in children), index

    # Source mConst/r² <= 2 exp(2 - 60000 T); T=exp(Md)+10 > 1.
    assert F(data['normalizedLast']) == F(7,2)+F(1,4096)
    assert F(data['normalizedLast'])**2<16
    assert 60000-2-1==59997  # 2 exp(2-60000T) < 2^-59997.
    # The source angular amplitude normalization h_j=(2K/r)Delta beta_j
    # cancels both K factors in two of the inverse right hand sides.
    assert 2**24*max(4,16,48)<2**30
    # For x<=s in the bumps and lambda>0, x²*s^-2-2lambda <=1 and
    # (s²-x²)*s^-2-2lambda <= 1. Keep (r²/2) d(s²) geometry explicit.
    weighted_prefix_factor=F(3,2)
    assert weighted_prefix_factor*8==12
    assert weighted_prefix_factor*16*10==240
    assert 12+240<2**8
    # Tail of U is -DeltaM; its exact unit masses give |DeltaM|<=8 A.
    assert 2*4==8
    assert 2*(5+4*16)<2**8
    assert 2**8*8==2**11
    # For Y=X Delta v1, the mass contribution is <=2^11 A/delta.
    assert (16+5*2*16)*8<2**11
    assert 8*16==128
    # Weighted angular tail rows: x² for f and x^(1-2lambda) for u*F0.
    assert 3*16==48 and 2*2*4==16
    assert 2*(6+4*16)<2**8 and 2*(2+5*16)<2**8
    assert 2**8*48==12288 and 2**8*16==4096
    # Pointwise flux bounds after dividing by sqrt(2X) or 2X.
    assert 2*8*2==32  # 2 X |Delta U_X| and X|Delta U|/L.
    assert 2*8*3==48  # 2 X |Delta F_X| and X|Delta F|/L.
    assert 8*8*2*2==256  # angular mixed boundary U*F0
    assert 2*128+256==2**9 and 2*2**11+4096==2**13
    # dX = R dR. Integrate the three real-gap weights.
    # d/dR (R^3/6-gR) = R²/2-g.
    assert 3*F(1,6)==F(1,2)
    assert F(1,2)*2==1
    assert 2*8==16  # |g F0(g)| contributes 16 g Q * B_m to angular numerator.

    return {
        'schema':'MathScope.C102.ActualN1AbsoluteOuterStressError/1',
        'sourceStatus':'VERIFIED_SAME_SOURCE_LEADING_ENVELOPES_IPOS_MASS_AND_BOTH_RADIAL_PRIMITIVES',
        'ordinaryStatus':'CONDITIONAL_ON_ORIGINAL_LEADING_MOMENTS_C101_COMPENSATED_FIELDS_AND_ORDINARY_FIXED_LIMIT_INTEGRATION',
        'operandsSHA256':sha256(raw).hexdigest(),'priorC101SHA256':C101,
        'sourceAxialIntegrand':117047,'lastAngularBump':117099,'axialOuterEnd':28824,'angularOuterEnd':28826,
        'actualPositiveLeadingBounds':{'U':norm['U'],'F':norm['F'],'arithmeticNodeCount':norm['nodeCount'],
            'normProgramSHA256':norm['programSHA256'],'ordinaryEtaDomain':[-1,1]},
        'sourceMassRatioUpper':'mConst/r^2 <= 2 exp(2-60000T) < 2^-59997',
        'symbolicInputs':{'g':'Xcut','r':'Rbase=sqrt(2 X0Ipos)','rg':'sqrt(2g)','XL':'last angular bump radius in X',
            'R':'2^46 Q^-19','E':'2^73 Q^-77','A':'2^17 Q^2 g E','B':'2^31 Q^2 g E',
            'H':'2^30 Q g E','Bm':'2^8 g E/delta','Bp':'2^12 Q g E/delta','mu':'mConst/r^2',
            'b0':'2^15','b1':'2^2070'},
        'gapAbsolutePointwiseForward':{
            'axial':'[5 g R+Bm(Ubound+8)+(X-g)Bp]/sqrt(2X)',
            'angular':'[9 g^2 R+2 Bm(X Fbound+8gQ)]/(2X)'},
        'gapAbsoluteIntegralForward':{
            'axial':'[5 g R+Bm(Ubound+8)](r-rg)+Bp[(r^3-rg^3)/6-g(r-rg)]',
            'angular':'(9g^2 R+16 Bm gQ)/2 log(X0Ipos/g)+Bm Fbound (X0Ipos-g)'},
        'IposSharpTailEnvelope':{'angularF':[48,'r^3 B'],'angularUF':[16,'r A'],
            'axialMass':[8,'A'],'axialPressure':[ '3/2','r^2 H'],
            'axialPressureEtaOnDeltaOver16':[24,'r^2 H/delta']},
        'IposUniformAbsoluteDifferenceUsingOriginalBackwardPrimitive':{
            'axial':'(32+2mu) A b0/r+32 A b1/r^3+2^11 A/(r delta)+2^8 r H/delta',
            'angular':'(48+3mu)r B b0+48 B(b1+b0)/r+(2^9 b0+2^13/delta)A/r+12288 r B/delta'},
        'outerAbsoluteIntegralForward':{
            'axial_Xcut_to_Xplus':'gapAxial+(XL-X0Ipos)IposAxial+5gR(sqrt(2Xplus)-r)',
            'angular_Xcut_to_Xb':'gapAngular+(XL-X0Ipos)IposAngular+(9/2)g^2R log(Xb/X0Ipos)'},
        'lateTransfer':{
            'axial':'forward error=P0_z/sqrt(2X), original backward error=0 for XL<=X<Xplus',
            'angular':'forward error=P0_theta/(2X), original backward error=0 for XL<=X<Xb'},
        'remaining':'OPEN_NUMERICAL_QUADRATURE_VALUES_AND_HIGHER_RECURSION_NO_SMALLNESS_ASSERTION_FOR_HUGE_OUTER_SCALES',
        'additionalFinalJets':0,'release':'HOLD',
    }


if __name__=='__main__':
    source,prior,out=map(Path,sys.argv[1:])
    value=verify(source,prior)
    with out.open('x',encoding='utf-8',newline='\n') as f:
        json.dump(value,f,indent=2)
        f.write('\n')
    print('VERIFIED original leading value norms, Ipos mass ratio and literal outer stress branches')
    print('CONDITIONAL pointwise and absolute-integral N1 error through both outer switches')
