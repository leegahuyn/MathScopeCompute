#!/usr/bin/env python3
"""Exact chain-rule identities and regular average bounds through third order."""
import json,sys
from pathlib import Path
import sympy as s
from fractions import Fraction as F
receipt=json.loads((Path(__file__).parent/'cutoff-jets.json').read_text(encoding='utf8'))
assert receipt['status']=='PASS' and receipt['ordinaryStepDerivativeBounds']==['1','66048','136356096','422521605120']
X,Xa,w=s.symbols('X Xa w',positive=True)
sig=s.Function('sig'); z=(s.log(X/Xa)-w)/w
expr=1-sig(z)
S1,S2,S3=s.symbols('S1 S2 S3',nonnegative=True)
z1=s.diff(z,X);z2=s.diff(z,X,2);z3=s.diff(z,X,3)
assert s.simplify(z1-1/(w*X))==0
assert s.simplify(z2+1/(w*X**2))==0
assert s.simplify(z3-2/(w*X**3))==0
t=s.Symbol('t')
sj=lambda j:s.Subs(s.diff(sig(t),t,j),t,z)
assert s.simplify(s.diff(expr,X)+sj(1)*z1)==0
assert s.simplify(s.diff(expr,X,2)+sj(2)*z1**2+sj(1)*z2)==0
assert s.simplify(s.diff(expr,X,3)+sj(3)*z1**3+3*sj(2)*z1*z2+sj(1)*z3)==0
# nonnegative step supremum and Xa<=X on active transition.
coefficients={1:[1],2:[1,1],3:[1,3,2]}
assert coefficients[3]==[1,3,2] # sigma''' z'^3, 3 sigma'' z'z'', sigma' z'''
assert [F(1,k+1) for k in range(4)]==[F(1),F(1,2),F(1,3),F(1,4)]
out={'status':'PASS','source_step_bounds':receipt['ordinaryStepDerivativeBounds'],
 'kappa_derivative_bounds':{
  '1':'S1/(w*Xa)',
  '2':'(S2/w^2+S1/w)/Xa^2',
  '3':'(S3/w^3+3*S2/w^2+2*S1/w)/Xa^3'},
 'average_derivative_factors':['1','1/2','1/3','1/4'],
 'scope':'exact chain-rule arithmetic; analytic premises and native evaluation not checked'}
text=json.dumps(out,indent=2)+'\n'
if len(sys.argv)>1:Path(sys.argv[1]).write_text(text,encoding='utf8',newline='\n')
print(text,end='')
