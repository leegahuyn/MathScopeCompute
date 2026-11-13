"""Source-pinned positive-N pointwise reduction and exact torus arithmetic."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from math import comb
from pathlib import Path
import json

PINS={'demand':'7db7caeab702abd948936c075f6cc27e8218e5fd98fc577a6d325224f25376ec',
      'primary':'ebd5da297d06da881e0d38bd6d04507595b50a980b2bb2399ac7df42725323ad',
      'registry':'364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111',
      'fourier':'59e1d8f7fd72b880de030a2a56bee9be65b5e02203cffa73157ce8dae420ad2e'}

def add(x,y):return (x[0]+y[0],x[1]+y[1])
def neg(x):return (-x[0],-x[1])
def mul(x,y):return (x[0]*y[0]+2*x[1]*y[1],x[0]*y[1]+x[1]*y[0])
def inv(x):
    d=x[0]*x[0]-2*x[1]*x[1]
    assert d
    return (x[0]/d,-x[1]/d)
def coeff(x):return [str(x[0]),str(x[1])]

def main():
    p=ArgumentParser(description=__doc__)
    for k in (*PINS,'out'):p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args();raw={}
    for k,pin in PINS.items():
        raw[k]=getattr(a,k).read_bytes();assert sha256(raw[k]).hexdigest()==pin,k
    demand,primary,registry=(json.loads(raw[k]) for k in ('demand','primary','registry'))
    assert demand['status']=='EXACT_SAME_LIVE_CONDITIONAL_V_COVARIANCE_DEMAND'
    assert len(demand['rows'])==52 and demand['maxCovarianceDerivativeOrder']==4
    assert primary['status']=='VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS'
    assert primary['scope']['actualPreHaarCommonYCovarianceClassCertified'] is False
    source=primary['classRows'][4]['fields']['fullCovariance']
    assert source=={'power':2585,'pole':36,'constant':18310098,'epsilonExponent':'1','weight':'zeta',
       'gaussian':'P(v)^2','sourceStage':'LOCAL_COEFFICIENT_BEFORE_AUXILIARY_HAAR_AVERAGE',
       'pointwiseBound':'constant*S_label^power*epsilon^epsilonExponent*weight*delta_*^(-pole)*gaussian'}
    fields=json.loads(registry['base']['fieldDefinitions'])
    definitions=json.loads(registry['base']['expressionDefinitions'])
    fieldEvidence=[]
    for i,name in [(1,'GlobalCompleteCommonTorus_rtheta'),(4,'GlobalCompleteCommonTorus_thetaz')]:
        assert fields[i]['name']==name and len(fields[i]['rows'])==162
        assert fields[i]['sourceRecipe']['all81Boxes'] and fields[i]['sourceRecipe']['bothSignsInsideEachBox']
        assert all(len(x['derivativeMaps'])==5 for x in fields[i]['rows'])
        seen={}
        for row in fields[i]['rows']:
            idx=-1-row['localSystem'];definition=definitions[idx]
            assert definition['body']==row['localBody'] and definition['parameters']==row['localParameters']
            assert len(row['localParameters'])==9
            assert {x['parameter'] for d in row['derivativeMaps'] for x in d}=={0,1,2,7,8}
            key=row['label']['key'];sign=row['label']['sign']
            assert row['label']['countBoxOnce'] and row['label']['signIsInsideBox']
            seen.setdefault(key,set()).add(sign)
        assert len(seen)==81 and all(signs=={-1,1} for signs in seen.values())
        bodies=sorted({row['localBody'] for row in fields[i]['rows']})
        fieldEvidence.append({'field':name,'signedRows':162,'uniqueBoxes':len(seen),'localBodies':bodies,
                              'activeLocalParameterIndices':[0,1,2,7,8]})
    assert fieldEvidence[0]['localBodies']==[17736607,17740025]
    assert fieldEvidence[1]['localBodies']==[17738267,17741685]
    fourier=raw['fourier'].decode('utf8')
    assert 'inner=G.integral(integrand,variables[1],G.zero,G.one)' in fourier
    assert 'normalizedHaarMass:\'1\'' in fourier

    # Q(sqrt(2)) is represented as pairs (rational, rational).
    z=(Q(0),Q(0));one=(Q(1),Q(0)); k=(Q(-1),Q(1)) # sqrt(2)-1
    d=add(one,mul(k,k)); d_inv=inv(d)
    assert d==(Q(4),Q(-2)) and d_inv==(Q(1,2),Q(1,4))
    assert Q(1)<Q(2)<Q(9,4) # 1<sqrt(2)<3/2; hence 0<k<1 and 1<d<2
    # Columns L,N as differential operators in (d0,d1).
    L=(one,neg(k));N=(k,one)
    D0=(d_inv,mul(k,d_inv));D1=(neg(mul(k,d_inv)),d_inv)
    def recover(row):return tuple(add(mul(row[0],L[i]),mul(row[1],N[i])) for i in (0,1))
    assert recover(D0)==(one,z) and recover(D1)==(z,one)
    wrong=(mul(k,d_inv),d_inv)
    assert recover(wrong)!=(z,one)
    mixed=[mul(neg(k),mul(d_inv,d_inv)),mul(add(one,neg(mul(k,k))),mul(d_inv,d_inv)),mul(k,mul(d_inv,d_inv))]
    # Algebraic expansion of d0*d1 in L²,LN,N², including 2 mixed products.
    assert mixed==[mul(D0[0],D1[0]),add(mul(D0[0],D1[1]),mul(D0[1],D1[0])),mul(D0[1],D1[1])]

    # Exact finite rational counterexample to a universal H1-to-Linf bound.
    examples=[]
    for m in [1,2,4,8,16]:
        s=sum((Q(1,1+i*i+j*j) for i in range(-m,m+1) for j in range(-m,m+1) if i or j),Q(0))
        harmonic=sum((Q(1,j) for j in range(1,m+1)),Q(0))
        assert s>=Q(8,3)*harmonic
        examples.append({'radius':m,'S':str(s),'harmonicLower':str(Q(8,3)*harmonic)})
    rows=demand['rows']; special=[x for x in rows if x['j']==1 and x['L']==0]
    assert len(special)==19 and len(rows)-len(special)==33
    assert all(sum(r['slow'])+r['L']+r['j']<=4 for r in rows)
    # Set partitions count all repeated chain-rule terms through four ordered
    # derivatives of c*F(V_1,...,V_5), without assuming affine maps.
    stirling=[[0]*5 for _ in range(5)];stirling[0][0]=1
    for n in range(1,5):
        for block in range(1,n+1):stirling[n][block]=stirling[n-1][block-1]+block*stirling[n-1][block]
    chain_counts=[sum(comb(n,t)*sum(stirling[n-t][p]*5**p for p in range(n-t+1)) for t in range(n+1)) for n in range(5)]
    assert chain_counts==[1,6,41,311,2576]
    assert 162*2576==417312 and 36*417312==15023232 and 18*417312==7511616
    result={
      'status':'SAME_LIVE_POSITIVE_N_V_POINTWISE_CONDITIONAL_REDUCTION',
      'pins':PINS,'count':52,'requiresProjectionFactorTwo':19,'projectionDerivativeAnnihilatesHaar':33,
      'sourceCovarianceFields':[1,4],'signedRowsPerField':162,'localPrimaryC4':source,
      'fieldEvidence':fieldEvidence,'chainRuleCountsDegree0Through4':chain_counts,
      'conditionalCoverBound':'For each of the 162 rows, if local coefficient and its five active argument maps have all derivatives through degree four bounded by C>=1, local signed W has all derivatives through four bounded by M, mapped arguments remain in that local domain, and original joins are flat, then ||D^alpha L^l N^m W||infinity <= 417312*C^5*M for degree <=4.',
      'conditionalVBound':'Under these same conditions the 19 projection rows are <=15023232*c0^-1*A*C^5*M and the other 33 rows <=7511616*c0^-1*A*C^5*M.',
      'unverified':'Prove the numerical C and a uniform M from the actual local C4 weighted bound, including all 162 map values, dyadic scale conversions, pulse paths, and flat joins on the active domain.',
      'directPointwise':'If B_infinity bounds every required actual W derivative through total order four and A>=1 bounds the displayed coefficient derivatives, the 19 rows are <=36*c0^-1*A*B_infinity and the other 33 <=18*c0^-1*A*B_infinity.',
      'derivedFrom':'Pperp g=g-Haar(g), ||Pperp g||infinity<=2||g||infinity; when L or N has already differentiated g, its Haar mean is zero.',
      'directionArithmetic':{'k':coeff(k),'d':coeff(d),'dInverse':coeff(d_inv),
        'dY0':['L/d','k*N/d'],'dY1':['N/d','-k*L/d'],
        'dY0dY1':['-k*L^2/d^2','(1-k^2)*L*N/d^2','k*N^2/d^2'],
        'incorrectSignRejected':True},
      'unitTorusFTC':'||f||infinity <= ||f||2+||d0 f||2+||d1 f||2+||d0d1 f||2 <= ||f||2+2||Lf||2+2||Nf||2+||L^2 f||2+||LN f||2+||N^2 f||2',
      'ftcDemand':'Applying this two-extra-derivative estimate to top-order positive-N v demands source covariance derivatives through total six. The already executed Primary C5 local covariance rows reach order five, not six; independent transfer and further order are required by this specific L2-to-sup route.',
      'oneDerivativeCounterexample':{'family':'f_M(Y)=sum_(0<||k||infinity<=M) exp(2*pi*i*k.Y)/(1+|k|^2)',
        'exact':'f_M(0)=S_M; ||f_M||_2^2+(||d0 f_M||_2^2+||d1 f_M||_2^2)/(4*pi^2)=S_M; S_M>=8/3 H_M -> infinity',
        'consequence':'No universal 2D L2 first-derivative inequality controls sup, even though L,N span the torus. A noncritical one-spare-order estimate needs stronger input.',
        'rationalChecks':examples},
      'scope':'Conditional fixed-Y positive-N v reduction; no numerical A or B_infinity, full mean C4, full Forced or final Cartesian jet proof.',
      'finalJets':'0/67','release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as out:json.dump(result,out,indent=2);out.write('\n')
    print(result['status'],result['count'])
if __name__=='__main__':main()
