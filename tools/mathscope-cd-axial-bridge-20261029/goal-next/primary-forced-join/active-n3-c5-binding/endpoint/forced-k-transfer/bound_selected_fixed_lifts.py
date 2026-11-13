#!/usr/bin/env python3
"""Exact irrational-arithmetic bounds for the two selected original lifts."""
import hashlib,json
from fractions import Fraction as Q
from pathlib import Path
def blob(x):return hashlib.sha1(b'blob '+str(len(x)).encode()+b'\0'+x).hexdigest()
def read(p,want):
 b=Path(p).read_bytes();assert blob(b)==want,p;return b.decode()
base=Path('work/goal-next/continuation30/forced-probe/runtime/research-ide')
init=read(base/'mathscope-m3/navier/source-initialized-angular.mjs','5270ae0792718cbc475c9e7249f7cb4e8f0309c6')
band=read(base/'mathscope-m3/navier/source-global-band.mjs','1f1c18a26372c998d8389b6c5138b3c9d3a66f36')
cover=read(base/'mathscope-m3/navier/source-global-pressure.mjs','2bc8193efc695d4e474cb4136d299128b040b9cf')
window=read(base/'mathscope-m3/navier/global-source-index.mjs','94bdacdff8b40fbc80c23add81202a5b41c3fbdf')
physical=read(base/'mathscope-m2/navier/actual-common-band-physical-curl.mjs','fd21267925e3c8de70010398414423337ba284a9')
family=read('work/goal-next/continuation27/original-primary-degree-runtime/research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs','614c59419ec1a6d7e37a52084d10b6a3b4e5d30b')
for t,frags in ((init,['key:delta+\':\'+prior.sign','xi=G.div(dot(G,vr,offset),Dgeom)','v=G.div(G.add(eta,r0),ci)']),
 (cover,['J=[[3n,1n],[1n,5n]]']), (physical,['basis=[[G.one,G.sub(G.one,sqrt2)],[G.sub(sqrt2,G.one),G.one]]',"id:'fixed-band-and-labels'"]),
 (band,['Dgeom=G.sub(q(4),G.mul(q(2),G.sqrt(q(2))))','paletteIndex=G.neg(G.ceiling(G.neg(paletteQuotient)))','ci=G.mul(power(Tg,paletteIndex),power(Q,G.add(G.one,h)))']),
 (window,["Q=G.exp(G.neg(G.mul(ell,log2)))"]),(family,['Tg=G.add(q(4),G.sqrt(q(2)))'])):
 for s in frags:assert s in t,s
def add(x,y):return(x[0]+y[0],x[1]+y[1])
def mul(x,y):return(x[0]*y[0]+2*x[1]*y[1],x[0]*y[1]+x[1]*y[0])
def inv(x):
 d=x[0]*x[0]-2*x[1]*x[1];assert d;return(x[0]/d,-x[1]/d)
def z(x):return(Q(x),Q(0))
r=(Q(0),Q(1));den=(Q(4),Q(-2));vr=[z(1),(Q(1),Q(-1))];vt=[(Q(-1),Q(1)),z(1)]
matrices=[[[1,0],[0,1]],[[3,1],[1,5]]];results=[]
for delta,J in enumerate(matrices):
 def slopes(v):return [mul(add(mul(v[0],z(J[0][j])),mul(v[1],z(J[1][j]))),inv(den)) for j in range(2)]
 x=slopes(vr);y=slopes(vt)
 if delta==0:assert x==[(Q(1,2),Q(1,4)),(Q(0),Q(-1,4))] and y==[(Q(0),Q(1,4)),(Q(1,2),Q(1,4))]
 else:assert x==[(Q(3,2),Q(1,2)),(Q(1,2),Q(-1))] and y==[(Q(1,2),Q(1)),(Q(5,2),Q(3,2))]
 # 7/5 < sqrt(2) < 3/2, hence exact rational endpoint interval.
 assert Q(7,5)**2<2<Q(3,2)**2
 for slope in x:assert max(abs(slope[0]+slope[1]*q) for q in (Q(7,5),Q(3,2)))<=Q(9,4)
 for slope in y:assert max(abs(slope[0]+slope[1]*q) for q in (Q(7,5),Q(3,2)))<=Q(19,4)
 results.append({'delta':delta,'xiY':[[str(a),str(b)] for a,b in x],'etaY':[[str(a),str(b)] for a,b in y]})
D=Path('work/goal-next/continuation41/forced-transfer');prior=(D/'n3-mode-two-k-transfer.json').read_bytes();p=json.loads(prior)
assert {x['key'] for x in p['selected']}=={'0:1','1:1'}
assert 1053*3125**2*33**10>0
out={'status':'CONDITIONAL_TWO_SAME_LIVE_M2_EXPLICIT_AFFINE_LIFT','branches':['0:1','1:1'],'slopeFormat':'a+b*sqrt(2)',
 'exactLiftSlopes':results,'liftOrderFiveBound':'L5 <= 5*(1+1/ci) < 33*S for ci>0, ell>=1, S=ell^2',
 'sourcePaletteBound':'For Tg=4+sqrt(2), i=floor(((1+h)*ell*log(2)-2*log(ell))/log(Tg)), Q=2^(-ell), ci=Tg^i*Q^(1+h), one has (Tg*S)^(-1)<ci<=S^(-1).',
 'transferBound':'|partial^alpha f_2,j| <= (1053*3125^2*33^10/4) * C4 * S^10 * T26 * W5^2, |alpha|<=4.',
 'proof':'Both selected fixed-label lift maps are affine in (R,Z,T,Y1,Y2). Their derivatives of order >=2 vanish; the two original matrices are I and J=[[3,1],[1,5]]. Exact Q(sqrt(2)) arithmetic gives the slopes, while sqrt(2)<3/2 yields Tg<11/2. Five-coordinate chain differentiation through order 5 yields at most 5^5=3125 terms and the source 1/2 factor is retained. Palette floor gives ci^(-1)<Tg*S and L5<5(1+Tg*S)<33*S.',
 'scope':'Conditional bound for exactly the delta=0 and delta=1 positive-sign m=2 source branches. C4 and W5 remain pointwise original source quantities and are not yet numerically enclosed. H_w derivatives and inverse/output remain separate. Requires fixed-label active domain ell>=1, ci>0 and original primary/source class premises.','priorSHA256':hashlib.sha256(prior).hexdigest(),'release':'HOLD'}
(D/'n3-selected-lifts-exact.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS exact affine lifts; L5 < 33 S; source m2 C4 bound conditional')
