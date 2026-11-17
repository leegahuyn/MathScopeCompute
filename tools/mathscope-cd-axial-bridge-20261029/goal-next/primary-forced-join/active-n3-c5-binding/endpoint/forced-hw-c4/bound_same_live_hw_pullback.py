#!/usr/bin/env python3
"""Exact fixed-label H_w C4 transport for the two selected m=2 sources."""
import hashlib,itertools,json,math
from fractions import Fraction as Q
from pathlib import Path
def blob(x):return hashlib.sha1(b'blob '+str(len(x)).encode()+b'\0'+x).hexdigest()
init=Path('work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-initialized-angular.mjs').read_bytes()
forced=Path('work/MathScopeCompute-CD/research-ide/mathscope-m3/navier/source-global-forced-current.mjs').read_bytes()
assert blob(init)=='5270ae0792718cbc475c9e7249f7cb4e8f0309c6' and blob(forced)=='1a8d1968b1825de477960cd59b3a0420c72ba4e3'
for s in (b'factor=G.div(ci,G.pow(Tg,delta))',b'Hw=Y.map((y,j)=>G.add(y,G.mul(factor,difference,vt[j])))',b'expectedJacobian=vt.map',b'original-integer-lift-pulse-at-Hw-is-w',b'original-integer-lift-transverse-fixed'):
 assert s in init,s
for s in (b'G.simultaneousSubstitute(value,path.Y,path.Hw)',b'for(const m of [1,2])'):
 assert s in forced,s
old=Path('work/goal-next/continuation41/forced-transfer/n3-selected-lifts-exact.json');prev=json.loads(old.read_bytes())
assert prev['status']=='CONDITIONAL_TWO_SAME_LIVE_M2_EXPLICIT_AFFINE_LIFT' and prev['branches']==['0:1','1:1']
live=Path('work/goal-next/continuation40/first-cycle-43372241418/same-family-mode-two.json');L=json.loads(live.read_bytes())
assert L['status']=='VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED' and L['completeForcedSeal']
rows=[r for r in L['full']['rows'] if r['key'] in ('0:1','1:1') and r['harmonic']==2]
assert len(rows)==2 and {r['key'] for r in rows}=={'0:1','1:1'} and all(len(r['H_w'])==2 and len(r['originalSource'])==3 for r in rows)
# Exact arithmetic in Q(sqrt(2)): basis and original Jg.
def add(x,y):return(x[0]+y[0],x[1]+y[1])
def sub(x,y):return(x[0]-y[0],x[1]-y[1])
def mul(x,y):return(x[0]*y[0]+2*x[1]*y[1],x[0]*y[1]+x[1]*y[0])
def div(x,y):
 d=y[0]*y[0]-2*y[1]*y[1];assert d;return mul(x,(y[0]/d,-y[1]/d))
def z(n):return(Q(n),Q(0))
sqrt2=(Q(0),Q(1));vt=[(Q(-1),Q(1)),z(1)];vr=[z(1),(Q(1),Q(-1))];D=(Q(4),Q(-2));Tg=(Q(4),Q(1));J=[[3,1],[1,5]]
dot=lambda a,b:add(mul(a[0],b[0]),mul(a[1],b[1]))
assert dot(vt,vt)==D and dot(vr,vt)==z(0)
assert [add(mul(z(row[0]),vt[0]),mul(z(row[1]),vt[1])) for row in J]==[mul(Tg,x) for x in vt]
for delta,M in enumerate(([[1,0],[0,1]],J)):
 image=[add(mul(z(row[0]),vt[0]),mul(z(row[1]),vt[1])) for row in M]
 td= z(1) if delta==0 else Tg
 assert dot(vr,image)==z(0) and div(dot(vt,image),D)==td
P=[[sub(z(int(i==j)),div(mul(vt[i],vt[j]),D)) for j in range(2)] for i in range(2)]
assert all(add(mul(P[i][0],P[0][j]),mul(P[i][1],P[1][j]))==P[i][j] for i in range(2) for j in range(2))
# 7/5<sqrt(2)<3/2. Bound all P entries by <=1 exactly, using affine
# representations a+b*sqrt(2), and absolute values at both endpoints.
assert Q(7,5)**2<2<Q(3,2)**2
for row in P:
 for a,b in row:assert max(abs(a+b*q) for q in (Q(7,5),Q(3,2)))<=1
counts={}
for alpha in itertools.product(range(5),repeat=6):
 r=sum(alpha)
 if r<=4:counts[str(r)]=counts.get(str(r),0)+1
assert counts=={'0':1,'1':6,'2':21,'3':56,'4':126} and sum(counts.values())==math.comb(10,4)==210
# Every Jacobian column of (R,Z,T,H1,H2) has l1 sum <=2. All higher
# derivatives vanish. Repeated chain rule therefore costs at most 2^r.
assert 2**4*1053==16848
coefficient=16*1053*3125**2*33**10
out={'status':'CONDITIONAL_SAME_LIVE_HW_C4_SOURCE_PULLBACK','branches':[{'key':r['key'],'rawSource':r['supported'],'H_w':r['H_w'],'actualPullbackSource':r['originalSource']} for r in rows],
 'fixedLabelJacobian':'d_Y H_w = I - v_t v_t^T/Dgeom; d_w H_w = ci*Tg^(-delta)*v_t',
 'exactProjectionEntries':[[[str(a),str(b)] for a,b in row] for row in P],
 'exactRelations':['v_t dot v_t = Dgeom','v_r dot v_t = 0','Jg v_t = Tg v_t','P^2=P'],
 'pathImage':'Both actual delta=0,1 lifts satisfy xi(H_w)=xi(Y), v(H_w)=w; R,Z,T are unchanged. Thus |xi|<=r0 and 0<=w<=Ls imply the mapped point stays in the same closed fixed-label pulse rectangle, assuming the original annulus and fixed chart are admitted.',
 'jacobianColumnL1Upper':'2','affineSecondAndHigherDerivatives':'0','sixVariableMultiIndexCounts':counts,
 'pointwiseSourceBound':'For |alpha|<=4 in (R,Z,T,Y1,Y2,w), |partial^alpha(f_2,j composed with H_w)| <= 16848*C4(H_w)*B5(H_w)^2.',
 'KTransferBound':'(16*1053*3125^2*33^10/4)*C4(H_w)*S^10*T26*W5(H_w)^2',
 'integerNumerator':str(coefficient),'integerDenominator':4,
 'domain':'Fixed actual label, delta 0 or 1, original annulus, ell>=1, ci>0, 0<=w<=Ls; original smoothness and source-domain inclusion at H_w are separate premises.',
 'proof':'Actual H_w is affine in Y,w; original path verifies v(H_w)=w and transverse invariance. ci<=1/S<=1 and Tg>1. The Y Jacobian is the rank-one orthogonal projection P, with each entry absolute <=1; the w column is ci*Tg^(-delta)*v_t, with l1 norm <=2. Each coordinate-derivative chain expansion therefore costs <=2 and no higher derivatives of H_w occur. Apply the source-bound C4 estimate at the mapped point, not after differentiating its envelope.',
 'limitations':'Conditional on the original analytic K/primary and source geometry claims, source inclusion at H_w, and C4/W5 at the mapped point. This bounds the actual unprojected forcing pullback, not the projected vector, matrix propagator, forced velocity or pressure; no final jets or gates are closed.',
 'pins':{'liveReceiptSHA256':hashlib.sha256(live.read_bytes()).hexdigest(),'previousTransferSHA256':hashlib.sha256(old.read_bytes()).hexdigest(),'sourceInitializedGitBlob':blob(init),'sourceForcedGitBlob':blob(forced)},'release':'HOLD'}
Dout=Path('work/goal-next/continuation42/forced');Dout.mkdir(parents=True,exist_ok=True);(Dout/'n3-same-live-hw-c4-pullback.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS two actual H_w paths; C4 pullback factor <=16; output inverse remains open')
