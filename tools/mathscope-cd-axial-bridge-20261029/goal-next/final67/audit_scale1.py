"""Pin and bound the exact first cutoff selector without inventing source norms."""
import argparse
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path
import sys
import sympy as S

HERE=Path(__file__).resolve().parent
M3=HERE/'source/research-ide/mathscope-m3'
sys.path.insert(0,str(M3/'recovery-20261019'))
sys.path.insert(0,str(M3/'closure-evidence-20261023'))
from outer_cutoff import ActualOuterCutoff, chi_jets
from verify_real_67jet_readiness import load_source,FAMILY,REQ

CHART_SHA='af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9'
BASE_STAGE='f_ac81b63855489a21bb407b2d'


def check_chart_implicit_derivatives():
    q=S.Symbol('q',positive=True)
    z,t,eta=S.symbols('z tau eta',real=True)
    h=S.Symbol('h',positive=True)
    D=S.Rational(1,2)-h
    F=q-t-z*z*q**(2*h)
    Fq=S.diff(F,q)
    qz=-S.diff(F,z)/Fq
    qt=-S.diff(F,t)/Fq
    qzz=-(S.diff(F,z,2)+2*S.diff(F,z,q)*qz+S.diff(F,q,2)*qz*qz)/Fq
    qzt=-(S.diff(F,z,q)*qt+S.diff(F,q,2)*qz*qt)/Fq
    L=1-2*h*eta**2
    normalized=(
      ('q_tau',qt,0,1/L,Q(2)),
      ('q_z',qz,1-D,2*eta/L,Q(4)),
      ('q_z_z',qzz,1-2*D,2/L+16*h*eta**2/L**2-8*h*(1-2*h)*eta**4/L**3,Q(12)),
      ('q_z_tau',qzt,-D,4*h*eta/L**2-4*h*(1-2*h)*eta**3/L**3,Q(3)),
    )
    rows=[]
    for name,term,exponent,expected,bound in normalized:
        pulled=S.powsimp((term/q**exponent).subs(z,q**D*eta),force=True)
        assert S.simplify(pulled-expected)==0,name
        rows.append({'derivative':name,'qExponent':str(exponent),'normalizedFormula':str(expected),
                     'absoluteBoundCoefficient':str(bound)})
    assert Q(2)/Q(1,2)==4
    assert Q(4)+Q(128,16)==12 and Q(48,16)==3
    return rows


def cutoff_bounds(cells=256):
    # On the literal source flat branches all positive jets vanish.
    # Exact outward ranges on a cover of the closed active strip suffice.
    assert ActualOuterCutoff().atoms
    max_upper=[Q(0),Q(0)]
    for i in range(cells):
        left=Q(1,2)+Q(i,2*cells);right=left+Q(1,2*cells)
        jets=chi_jets(left,right,96)
        for k in (1,2):
            max_upper[k-1]=max(max_upper[k-1],abs(jets[k].lo),abs(jets[k].hi))
    return max_upper,[q.__ceil__() for q in max_upper]


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--whole-k-chart',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    chart_raw=args.whole_k_chart.read_bytes()
    assert hashlib.sha256(chart_raw).hexdigest()==CHART_SHA
    chart=json.loads(chart_raw)
    assert chart['variables']['bounds']==['1/2 <= Q < 2','|eta| < 3/4','q < qBig/16']
    assert chart['variables']['rho']=='tau/tau0 with tau=1-t and tau0=qBig/32'
    family,sha=load_source(FAMILY)
    req,_=load_source(REQ)
    assert sha==req['actual_family_sha256']
    nodes={n['id']:n for n in family['nodes']}
    first=nodes[req['frozen_scale_nodes'][0]]
    assert first['operation']=='ActualShrinkingScale' and first['data']['j']==1
    assert first['data']['gamma']=='h*1/20' and first['data']['previous']=='log(1/qbig)'
    assert first['data']['L']=='max(1,1+L_previous,1+log(1/qbig),max_m(2*P_hat/gamma)^2,max_m2*(C_hat+j)/gamma)'
    assert nodes[BASE_STAGE]['operation']=='ActualCorrectionPotentials'
    assert nodes[BASE_STAGE]['data']['j']==1
    local=(M3/'navier/source-localization.mjs').read_text(encoding='utf8')
    assert 'tau=q*(1-eta^2), z=q^D*eta, X=r^2/(2q)' in local
    assert 'G.pow(G.div(q(64),h),2)' in local
    assert 'ell0===G.add(ellMinimum,q(6))&&qStar===expectedQStar' in local
    assert 'G.add(ell0,q(4)),G.log(q(2))' in local
    assembler=(M3/'navier/final-summation/source-final-summation.mjs').read_text(encoding='utf8')
    cutoff=assembler.split('export function originalFinalCutoffRoot(G,s){',1)[1].split('const curl=',1)[0]
    assert 'left=G.exp(G.neg(G.inv(u))),right=G.exp(G.neg(G.inv(G.sub(G.one,u))))' in cutoff
    assert 'G.choose(s,G.q(1,2),G.one,G.one,inside,G.zero)' in cutoff
    helper=(M3/'navier/shrinking-cutoff-summation.mjs').read_text(encoding='utf8')
    assert 'C=G.add(G.one,G.sqrt(G.add(G.one,G.pow(coefficientNorm,2))))' in helper
    assert 'coefficientThreshold=G.div(G.mul(G.q(2),G.add(C,G.q(j))),gain)' in helper

    uppers,(M1,M2)=cutoff_bounds()
    qs=check_chart_implicit_derivatives()
    # On the active cutoff strip aq<=1, |a|<=1/q. All cutoff
    # derivatives outside the strip are zero.
    cutoff_derivatives={'chi_z':[4*M1,'-D'],
        'chi_tau':[2*M1,'-1'],'chi_z_z':[16*M2+12*M1,'-2D'],
        'chi_z_tau':[8*M2+3*M1,'-D-1']}
    norm_k=[4*(1+4*M1),20*(1+20*M1+16*M2)]
    assert norm_k[1]>=20*(1+9*M1+8*M2)
    rows=[]
    for m, id in enumerate(first['data']['norm_inputs']):
        cutoff_norm=nodes[id]
        assert cutoff_norm['operation']=='ActualCutoffCurlBound'
        assert cutoff_norm['data']['m']==m and cutoff_norm['data']['j']==1
        assert cutoff_norm['data']['numeric_value'] is None
        assert cutoff_norm['data']['ellPrime']==f'ell_({m+1})+{m+1}'
        assert cutoff_norm['data']['C_hat']=='1+ceil(S_hat_(j,m,P_hat_(j,m)))'
        bound=nodes[cutoff_norm['inputs'][0]]
        assert bound['operation']=='ExactSourceFunctionalBound'
        assert bound['inputs'][0]==BASE_STAGE and bound['data']['derivative_order']==m+1
        assert not bound['data']['effective_numerical_evaluation']
        rows.append({'m':m,'originalCutoffBoundID':id,'originalUncutBoundID':bound['id'],
          'genuineIncrementTriplet':BASE_STAGE,'uncutDerivativeOrder':m+1,
          'sumOfAbsoluteComponentDerivativeBoundConstant':norm_k[m],
          'cutoffDerivativeWeightLoss':'m+D','sourceSelectorWeightLoss':'m+1',
          'spareQPower':'1-D=1/2+h','P_hat':{'conditionalOnActualUncutClassBound':0},
          'S_hatBound':'2*K_m*C*4^P*P!*exp(-B/4)','C_hatNumeric':None})

    # The real-source functional uses C_hat=1+ceil(S_hat). The generic
    # graph helper uses 1+sqrt(1+norm^2); even when S_hat=1, these differ.
    example=S.Rational(11,10)
    assert 1+int(S.ceiling(example))==3
    assert 1+example**2<4
    assert Q(2048)/(Q(1,16)) > 120
    result={'schema':'MathScope.M3.OriginalFirstActualScaleSelectorScope/1',
      'originalFamilySHA256':sha,'originalWholeKChartSHA256':CHART_SHA,
      'firstActualScaleID':first['id'],'requestedGain':'h/20','B':'log(1/qBig)',
      'qDerivativeBounds':qs,
      'linearSeedCutoffProof':{'subcells':256,'outwardBits':96,'absoluteDerivativeUppers':[str(x) for x in uppers],
          'integerDerivativeUppers':[M1,M2],'composedDerivatives':[{
            'derivative':key,'boundCoefficient':value[0],'qExponent':value[1]} for key,value in cutoff_derivatives.items()]},
      'm0And1':rows,
      'cutoffCurlIdentity':'T_a Z=(chi U+chi_z*(e_z cross A), chi p); U=curl A+B e_theta',
      'sparePowerProof':'Use genuine uncut bound through m+1; chi_z commutator always has at least one z derivative. Its m derivatives cost q^(-m-D), because q is independent of x,y and fixed a<=1/q on the transition.',
      'logAbsorptionProof':'For x=log(1/q)>=B, delta=1-D>1/2. exp(-delta*x)*(1+x)^P <= exp(-B/4)*exp(1/4)*4^P*P! <= 2*exp(-B/4)*4^P*P!, by one term of the positive exp series.',
      'exactConditionalSelector':{'Cmax':'max(C_hat_1_0,C_hat_1_1)','C_hat':'1+ceil(S_hat at P_hat=0)',
        'L1':'max(B+1,40*(Cmax+1)/h)','a1':'exp(L1)',
        'normalizedGuardRoot':'h*(L1-B)=max(h,40*(Cmax+1)-h*B)',
        'physicalCellCondition':'r=q/qBig in [r_lo,r_hi]',
        'unitPlateau':'normalizedGuardRoot <= h*log(1/(2*r_hi))',
        'zeroBranch':'normalizedGuardRoot >= h*log(1/r_lo)',
        'wholeKConservativeRatio':['1/64','1/16'],'wholeKUnitPlateauBound':'h*log(8)',
        'wholeKZeroBound':'h*log(64)','actualRootIDsEmitted':False},
      'sufficientActualPlateauPremise':{
        'upperSCondition':'For m=0,1 supply genuine finite C,P with 2*K_m*C*4^P*P!*exp(-B/4)<=1.',
        'then':'Cmax<=2, so h*B>2048/h>120>=40*(Cmax+1). The exact original L1=B+1 and a1*q<=exp(1)/16<1/2 throughout this slab.',
        'baseThreshold':'ellMinimum>= (64/h)^2; qBig=2^(-(ellMinimum+10)); log(2)>1/2',
        'actualUncutMajorantsMaterialized':False},
      'genericHelperScope':{
        'entry':'shrinkingCutoffThresholdExpression','helperCoefficient':'1+sqrt(1+coefficientNorm^2)',
        'actualCoefficient':'1+ceil(S_hat at P_hat=0)','differentExactExpressions':True,
        'witnesses':[
          'S_hat=1 gives actual 2; feeding either S_hat=1 or C_hat=2 to the helper gives >2.',
          'S_hat=11/10 gives actual 3; feeding S_hat to the helper gives <3, while still majorizing S_hat.',
        ],
        'mustUseExactSelectorForOriginalGuard':True},
      'firstUnsatisfiedSourceHypothesis':'The actual first-cycle correction triplet must supply common-domain order-1 and order-2 weighted uncut majorants (or another rigorous bound on its cutoff-curl supremum). Existing harmonic projection and pre-final physical roots do not give these global norms or the original C_hat.',
      'actualC_hatEvaluated':False,'actualScaleEvaluated':False,'wholeKFinalFieldEvaluated':False,
      'finalJetsCertified':0,'N7_06':'OPEN','N8_05':'OPEN','release':'HOLD'}
    args.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n')
    print(json.dumps({'M1':M1,'M2':M2,'K0':norm_k[0],'K1':norm_k[1],
                      'P_hat_conditional':[0,0],'actual_C_hat':[None,None],'guard_numeric':False}))

if __name__=='__main__':
    main()
