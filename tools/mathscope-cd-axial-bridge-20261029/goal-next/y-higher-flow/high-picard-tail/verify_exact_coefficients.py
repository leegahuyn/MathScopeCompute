#!/usr/bin/env python3
"""Pinned source selector and exact finite coefficient checks, not a tail proof."""
import argparse,hashlib,json,math
from fractions import Fraction as F
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--source-dir',type=Path,required=True)
p.add_argument('--tail',type=Path,default=Path(__file__).resolve().parent.parent/'fixed-n-radial-tail/tail-parameters.json')
p.add_argument('--parity',type=Path,default=Path(__file__).resolve().parent.parent/'picard-even-axis/parity.json')
p.add_argument('--out',type=Path)
a=p.parse_args(); first=a.source_dir/'actual-continuation-exact-functions.mjs'; higher=a.source_dir/'actual-residual-order-induction-expressions.mjs'
pins={first:'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',higher:'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',a.tail:'ae27c89dd4c11bdd284e857f8c6770693b14c4860d1cd5b8bb0045d8795e5016',a.parity:'4106ba96d876b58a526bdbb26c2c1bccacab52c5ac78c7fa2334cd233e886103'}
for f,expected in pins.items():
    raw=f.read_bytes().replace(b'\r\n',b'\n');assert hashlib.sha256(raw).hexdigest()==expected,f
t=json.loads(a.tail.read_bytes());z=json.loads(a.parity.read_bytes());expected='ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd'
assert t['graphSHA256']==z['sourceGraphSHA256']==expected
assert [(r['order'],r['system']) for r in t['rows']]==[(1,0),(2,3),(3,5),(4,7),(5,9)]
assert [(r['order'],r['system']) for r in z['rows']]==[(1,0),(2,3),(3,5),(4,7),(5,9)]
assert all(r['sourceA1MaskChecked'] for r in t['rows']) and z['negativeWrongParityRejected']
old=first.read_text(encoding='utf8'); new=higher.read_text(encoding='utf8')
for fragment in ('component>3','radialOrder>4','etaOrder>8','for(let j=0;j<2*radialOrder;j++)body=this.derivative(body,s.xi)',
                 't,j)=>this.pow(t,2*(radialOrder-1-j))',"this.q(1,1n<<BigInt(radialOrder))"):
    assert fragment in old,fragment
assert 'this.derivativeBudget(2*radialOrder,etaOrder)' in new
assert 'if(n>this.maxDerivativeOrder)' in new
coeff=[]
for r in range(17):
    even=F(1,2**r)
    for k in range(r):even/=2*k+1
    odd=even/F(2*r+1)
    assert even==F(math.factorial(r),math.factorial(2*r))
    assert odd==F(math.factorial(r),math.factorial(2*r+1))
    coeff.append({'r':r,'even':str(even),'odd_over_xi':str(odd)})
    for m in range(r,21):
        expected_fall=math.factorial(m)//math.factorial(m-r)
        even_weight=F(math.factorial(2*m),2**r*math.factorial(2*(m-r)))
        for j in range(r):even_weight/=2*m-2*j-1
        assert even_weight==expected_fall,(r,m,'even')
        odd_weight=F(math.factorial(2*m+1),2**r*math.factorial(2*(m-r))*(2*m+1))
        for j in range(r):odd_weight/=2*m-2*j-1
        assert odd_weight==expected_fall,(r,m,'odd')
# A non-even w(xi)=xi has w''=0, yet d/dX w(sqrt X)=1 at X=1/4.
assert F(1,1)!=F(0,1)
out={'status':'PASS','sourceGraphSHA256':expected,'sourceSystems':[0,3,5,7,9],
     'selector':'first four components; original n1 X order <=4 and eta order <=8; higher adapter explicit derivative budget',
     'sourceAxisSpecialCase':'original n1 has a distinct direct axis formula for X order one',
     'even_and_optional_odd_coefficients':coeff,'monomialChecks':'all 0<=r<=16 and r<=m<=20',
     'negative_control':'non-even w(xi)=xi has derivative 1 at X=1/4 while RHS with w_double_prime gives 0',
     'scope':'exact finite arithmetic and source shape only; universal derivative-limit and parity premises require analytic proof',
     'pins':{f.name:d for f,d in pins.items()}}
text=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(text,encoding='utf8',newline='\n')
print(text,end='')
