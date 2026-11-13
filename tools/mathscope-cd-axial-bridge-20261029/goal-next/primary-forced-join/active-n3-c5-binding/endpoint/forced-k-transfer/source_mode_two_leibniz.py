#!/usr/bin/env python3
"""Exact conditional C4 algebra for actual selected mode-two source terms."""
import hashlib,itertools,json,math
from pathlib import Path

def blob(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def read(path,want):
 data=Path(path).read_bytes();assert blob(data)==want,path;return data.decode()
harm=read('work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-harmonic-assembly.mjs','cc8d24fdc2a7790d393aea86204b63c21a86f1b0')
init=read('work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-initialized-angular.mjs','5270ae0792718cbc475c9e7249f7cb4e8f0309c6')
forced=read('work/MathScopeCompute-CD/research-ide/mathscope-m3/navier/source-global-forced-current.mjs','1a8d1968b1825de477960cd59b3a0420c72ba4e3')
for text,fragments in ((harm,['Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))','Dz=x=>G.mul(epsilon,G.derivative(x,Z))',
 'S.scale(invR,T[1][1])','S.scale(invR,T[0][1])','quadratic=kernel.tensorDivergence(inc.velocity,inc.velocity)',
 'G.mul(k,G.q(m),phaseDerivative)']),
 (init,['nonzeroAngularForcing=subtractVectorRows(G,waveResidual,primaryFlatResidual).filter(row=>row.m!==0)']),
 (forced,['for(const m of [1,2])','sourcePullbackComponent(G,z[part],path'])):
 for s in fragments:assert s in text,s
p=Path('work/goal-next/continuation40/first-cycle-43372241418/same-family-mode-two.json');data=p.read_bytes();L=json.loads(data)
assert L['status']=='VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED' and L['completeForcedSeal'] and L['prefix']==3
selected=[r for r in L['full']['rows'] if r['key'] in ('0:1','1:1') and r['harmonic']==2]
assert len(selected)==2 and {r['key'] for r in selected}=={'0:1','1:1'}
assert all(r['raw']==r['supported'] and r['principal'] is None for r in selected)
prior=Path('work/goal-next/continuation41/forced-transfer/n3-primary-constants-transfer.json');K=json.loads(prior.read_bytes())
assert K['status']=='CONDITIONAL_SAME_LIVE_PRIMARY_CONSTANTS_ENCLOSED' and K['inputSHA256']['sameLive']==hashlib.sha256(data).hexdigest()

# For each 5-coordinate multi-index alpha with |alpha|<=4, the exact
# 3-factor Leibniz coefficient sum is 3^|alpha|. Enumerate integer counts.
counts={}
for alpha in itertools.product(range(5),repeat=5):
 r=sum(alpha)
 if r>4:continue
 total=1
 for a in alpha:
  total*=sum(math.factorial(a)//(math.factorial(i)*math.factorial(j)*math.factorial(a-i-j)) for i in range(a+1) for j in range(a-i+1))
 assert total==3**r;counts[str(r)]=counts.get(str(r),0)+1
assert counts=={'0':1,'1':5,'2':15,'3':35,'4':70}
# Dr field derivatives: 2 R + 4 Y terms; Dz: 2; two cylindrical
# connection terms; three phase-gradient terms. The latter terms have
# coefficient 2*k*physical_phase_gradient, accounted for inside C4.
categories={'radial':2,'radial_fast_two_Y':4,'axial':2,'cylindrical':2,'phase':3}
assert sum(categories.values())==13 and 13*3**4==1053
out={'status':'CONDITIONAL_SAME_LIVE_MODE_TWO_C4_SOURCE_BOUND','sourceBranches':[{'key':r['key'],'harmonic':2,'roots':r['supported']} for r in selected],
 'coordinates':['R','Z','T','Y1','Y2'],'multiIndexCounts':counts,'sourceMonomialUpperCounts':categories,
 'conditionalBound':'For |alpha|<=4 and j=0,1,2, |partial^alpha f_2,j| <= 13*3^|alpha|*C4*B5^2 <= 1053*C4*B5^2.',
 'B5':'Uniform maximum over 3 complex positive-mode coefficients and all their coordinate derivatives through total order 5 on the actual fixed-label active domain.',
 'C4':'Uniform maximum >=1 over derivatives through total order 4 of actual a*vr_i, epsilon, 1/R, and 2*k*(Dr phi, (d_theta phi)/R, Dz phi), on the same domain.',
 'exactDomain':'Original fixed-label active annulus where R>0; all five differentiation variables are independent and the retained primary amplitudes are angular-independent.',
 'proof':'The actual m=2 forcing equals the full +1 self-quadratic by the same-live binder. Expand the original cylindrical conservative tensor divergence. Its at most 13 monomials have at most three factors; multi-index Leibniz gives 3^|alpha|.',
 'limitations':'B5 and C4 are not yet evaluated from the local primary T25 constants: exact lift/reference and derivative transport is still required. No derivative bound after H_w pullback, inverse, pressure, forced velocity or final jets is claimed.',
 'sameLiveSHA256':hashlib.sha256(data).hexdigest(),'primaryConstantTransferSHA256':hashlib.sha256(prior.read_bytes()).hexdigest(),
 'sourceGitBlobs':{'harmonic':'cc8d24fdc2a7790d393aea86204b63c21a86f1b0','initialized':'5270ae0792718cbc475c9e7249f7cb4e8f0309c6','forced':'1a8d1968b1825de477960cd59b3a0420c72ba4e3'},'release':'HOLD'}
outpath=Path('work/goal-next/continuation41/forced-transfer/n3-mode-two-source-c4.json');outpath.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS 126 multi-indices; 13*3^4=1053; source-domain B5/C4 remain open')
