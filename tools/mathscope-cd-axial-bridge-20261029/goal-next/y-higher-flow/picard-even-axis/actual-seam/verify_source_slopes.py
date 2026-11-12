#!/usr/bin/env python3
"""Exact source first-integral reduction; no numerical truncation of native solution."""
import argparse
import hashlib
import json
from pathlib import Path
import sympy as s

p=argparse.ArgumentParser()
p.add_argument('--source-dir',type=Path,required=True)
p.add_argument('--out',type=Path)
a=p.parse_args()
pre=a.source_dir/'actual-continuation-exact-pregluing.mjs'
core=a.source_dir/'actual-continuation-exact-core.mjs'
step=a.source_dir/'actual-global-source-expressions.mjs'
raw={p:p.read_bytes().replace(b'\r\n',b'\n') for p in (pre,core,step)}
pins={pre:'7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3',
      core:'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
      step:'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3'}
for path, digest in pins.items():
    assert hashlib.sha256(raw[path]).hexdigest() == digest, path
src={p:b.decode('utf-8') for p,b in raw.items()}
# Mandatory source shapes: pressure primitive, mass and the two recurrence rows.
for fragment in (
 'const W=G.sub(G.sub(o,G.div(G.mul(q(2),D,eta,M),X)),G.div(G.mul(d,Me),X));',
 'const Qs=G.add(G.neg(W),G.div(angular,G.mul(q(2),G.pow(X,2),F)));',
 'const Ns=G.add(G.neg(G.mul(W,U)),G.div(G.add(G.mul(D,G.sub(M,G.mul(eta,Me))),G.mul(q(4),G.parameter(\'h\'),eta,S),G.neg(G.mul(d,Se))),X),G.mul(q(4),A,eta,Pi),G.neg(G.mul(d,Pie)));',
 'const actualUControl=G.mul(q(-1,2),kap,beta,cx,atReference(referenceSource.ns,cx));',
 'const actualShear=G.add(G.mul(G.sub(o,blend),kap,atReference(referenceSource.p1,cx)),G.mul(q(4,5),blend));',
): assert fragment in src[pre], fragment
for fragment in (
 'phi.push(G.div(G.add(G.neg(G.mul(chi,phi[n])),G.mul(invLambda,r1)),G.q(2*(n+1)*(n+2))));',
 'u.push(G.div(G.add(n===0?G.neg(G.mul(invL,Z)):G.zero,G.mul(invLambda,r2)),G.q(2*(n+1)**2)));',
 'const p=[G.zero,...Array.from({length:degree},(_,k)=>G.div(G.mul(g2,convolution(phi,phi,k)),G.q(k+1)))],average=u.map((x,k)=>G.div(x,G.q(k+1)));',
): assert fragment in src[core], fragment
assert 'if(x<=0||x>=1)return n===0?(x>=1?1:0):0;' in src[step]
assert 'z=mul(ia,ia).map((v,k)=>-v+mul(ib,ib)[k])' in src[step]

e,h,j,lam,sigma,y=s.symbols('eta h j Lambda sigma Y', nonzero=True)
phi,phiy,phiyy,phie,u,uy,uyy,ue,avg,avge,pres,prese,P0,P0e,g=s.symbols('Phi PhiY PhiYY PhiEta u uY uYY uEta avg avgEta p pEta P0 P0Eta g')
A=s.Rational(1,2)+h; D=s.Rational(1,2)-h; d=1-e**2; L=1-2*h*e**2
Us=4*e+j; Hs=D*e+d*Us; Ws=1-4*d-2*D*e*Us
chi=Hs**2/(Hs**2+sigma**2); zeta=-L*Hs/(Hs**2+sigma**2)
U=Us+u/lam; Ue=4+ue/lam; H=D*e+d*U
avgu=Us+avg/lam; avgue=4+avge/lam
W=1-2*D*e*avgu-d*avgue
X=y/lam; F=g*phi; FX=g*lam*phiy; FXX=g*lam**2*phiyy
FE=g*(lam*zeta*phi+phie); UX=uy; UXX=lam*uyy
Pi=P0+pres/lam; PiEta=P0e+prese/lam
xWx=-2*D*e*(U-avgu)-d*(Ue-avgue)

# derivative of angular first-integral defect divided by 2X.
angular_d=(1-h)*F-D*e*FE-d*(Ue*F+U*FE)+2*(h-D)*e*U*F-2*F*W-X*FX*W-F*xWx+4*L*FX+2*L*X*FXX
pref=W+h*(1-2*e*U)+d*u*zeta
angular_rec=2*L*lam*(y*phiyy+2*phiy)+lam*L*chi*phi-(pref*phi+W*y*phiy+H*phie)
assert s.factor(s.cancel(angular_d/g-angular_rec))==0

# derivative of axial first-integral defect, using M_X=U,
# S_X=U^2-XF^2 and Pi_X=F^2 from the literal source integrals.
axial_d=(-W*U-xWx*U-X*W*UX+D*(U-e*Ue)+4*h*e*(U**2-X*F**2)
         -d*(2*U*Ue-X*2*F*FE)+4*A*e*Pi-d*PiEta
         +X*(4*A*e*F**2-2*d*F*FE)+2*L*UX+2*L*X*UXX)
Z=-A*(1-2*e*Us)*Us-4*Hs-d*P0e+4*A*e*P0
alpha=A*(1-4*e*Us)+4*d
# p_Y = g^2 Phi^2 follows by termwise differentiation of its source coefficients.
N2=alpha*u-2*A*e*u**2/lam+W*y*uy+Hs*ue+d*u*ue/lam-4*A*e*pres+d*prese-2*e*y*g**2*phi**2
axial_rec=Z+2*L*(uy+y*uyy)-N2/lam
assert s.factor(s.cancel(axial_d-axial_rec))==0
# Negative controls: omit the genuine 4h eta S term or alter phi's radial coefficient.
assert s.factor(s.cancel((axial_d-4*h*e*(U**2-X*F**2))-axial_rec))!=0
assert s.factor(s.cancel(angular_d/g-(angular_rec-2*L*lam*phiy)))!=0
out={'status':'PASS','checks':['original angular defect derivative = exact Phi-recurrence residual',
 'original axial defect derivative = exact u-recurrence residual with p_Y=g^2 Phi^2',
 'negative: missing 4h eta S is detected','negative: changed Phi radial coefficient is detected'],
 'scope':'identity of symbolic expressions; upgrading to actual reference slopes requires original analytic convergence, original parameter-domain/nonvanishing, natural reference branch, and real endpoint flatness',
 'canonical_LF_sha256':{p.name:hashlib.sha256(v).hexdigest() for p,v in raw.items()}}
t=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(t,encoding='utf-8',newline='\n')
print(t,end='')
