#!/usr/bin/env python3
"""Pinned source shapes and exact symbolic finite-jet replay; not the source ODE proof."""
import argparse
import hashlib
import json
from pathlib import Path
import sympy as s

p = argparse.ArgumentParser()
p.add_argument('--source-dir', type=Path, required=True)
p.add_argument('--out', type=Path)
a = p.parse_args()
pre = a.source_dir / 'actual-continuation-exact-pregluing.mjs'
inner = a.source_dir / 'actual-continuation-exact-inner.mjs'
expected = {pre:'7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3',
            inner:'3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8'}
for path, pin in expected.items():
    assert hashlib.sha256(path.read_bytes().replace(b'\r\n',b'\n')).hexdigest() == pin
source = pre.read_text(encoding='utf-8')
actual = inner.read_text(encoding='utf-8')
for fragment in (
    'const kap=G.add(kappa0,G.mul(G.sub(o,kappa0),G.sub(o,G.step(G.div(cy,t1)))))',
    'const B26FAt=X=>G.mul(g,phi4,G.exp(G.mul(q(-1,2),G.integral(actualShear,cy,z,G.log(G.div(X,Xa))))))',
    'const B26UAt=X=>G.add(u4,G.integral(actualUControl,cy,z,G.log(G.div(X,Xa))))',
    'const Xa' # Xa is a parameter consumed by the source; checked precisely below
):
    if fragment == 'const Xa':
        assert "Xa=G.parameter('Xa')" in source
    else:
        assert fragment in source, fragment
for fragment in ('G.choose(X,Xa,aSquared,naturalF,collarF,collarF)',
                 'G.choose(X,Xa,aSquared,naturalU,collarU,collarU)',
                 'G.integral(pre.functions.B26UAt(t),t,Xa,X)',
                 'G.derivative(vX,X)'):
    assert fragment in actual, fragment

# Formal algebra: source slope identity L'_B=kap L'_N, U'_B=kap U'_N
# is an additional hypothesis, NOT established by this script. Truncated
# jets have completely independent symbolic coefficients.
y=s.Symbol('y')
l=s.symbols('l0:7'); u=s.symbols('u0:7'); k=s.symbols('k1:7')
L=sum(l[i]*y**i for i in range(7))
U=sum(u[i]*y**i for i in range(7))
kap=1+sum(k[i-1]*y**i for i in range(1,7))
LB=l[0]+s.integrate(kap*s.diff(L,y),y)
UB=u[0]+s.integrate(kap*s.diff(U,y),y)
flat={v:0 for v in k}
for j in range(7):
    assert s.expand(LB-L).coeff(y,j).subs(flat) == 0
    assert s.expand(UB-U).coeff(y,j).subs(flat) == 0
# Only kappa(0)=1 is insufficient for second-order matching.
assert s.expand(UB-U).coeff(y,2) == k[0]*u[1]/2
assert s.expand(LB-L).coeff(y,2) == k[0]*l[1]/2
receipt={'status':'PASS','formal_jet_orders_checked':list(range(7)),
         'negative_control':'kappa(0)=1 alone permits a nonzero order-two mismatch k1*u1/2',
         'additional_unproved_hypothesis':'original reference-source slopes equal natural d_y(log F), d_y(U) on activation',
         'scope':'formal algebra and pinned source shape; not verified source ODE, step flatness, complex eta regularity, or actual forcing C1',
         'canonical_LF_pins':{path.name:pin for path,pin in expected.items()}}
out=json.dumps(receipt,indent=2)+'\n'
if a.out:a.out.write_text(out,encoding='utf-8',newline='\n')
print(out,end='')
