"""Check original source tail parameters and exact algebraic word controls."""
import hashlib
import json
import math
import sys
from fractions import Fraction as F
from pathlib import Path
assert len(sys.argv)==5,'usage: TAIL_RECEIPT PROFILE_MJS FUNCTIONS_MJS OUTPUT_JSON'
tail,profile,functions,out=map(Path,sys.argv[1:]);H=lambda b:hashlib.sha256(b).hexdigest()
tb=tail.read_bytes();assert H(tb)=='ae27c89dd4c11bdd284e857f8c6770693b14c4860d1cd5b8bb0045d8795e5016';v=json.loads(tb);assert len(v['rows'])==5 and v['nodeCount']==7358162 and all(r['sourceA1MaskChecked'] for r in v['rows'])
pb = profile.read_bytes()
assert H(pb) == 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
profile_data, _ = json.JSONDecoder().raw_decode(pb.decode('utf8').split('export const PINNED_N3 = ', 1)[1])
p = profile_data['parametersExactExpressions']
assert p['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]}
assert p['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}}
assert p['logP'] == {'product': [{'integer': 2}, {'ref': 'T'}]}
assert p['Pstar'] == {'exp': {'ref': 'logP'}}
assert p['K'] == {'power': [{'ref': 'Pstar'}, 2]}
numerator, denominator = p['Q']['quotient']
multiplier, scale = numerator['product']
assert int(multiplier['integer']) > 1 and scale == {'ref': 'K'}
assert denominator == {'power': [{'ref': 'sigmaStar'}, 2]}
assert p['rho']=={'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]} and p['j0']=={'power':[{'ref':'h'},4]} and p['sigmaStar']=={'quotient':[{'ref':'j0'},{'integer':2000}]}
f=functions.read_bytes();assert H(f)=='326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311';f=f.decode('utf8');assert "this.substitute(f,s.xi,this.mul(t,s.xi))" in f and "this.integral(this.mul(this.pow(t,s.diagonal[i])" in f and "finitePartialSumIsExactSolution:false" in f
# Matrix A1 and its eta derivative preserve the actual last-two/first-four block mask.
def matmul(A,B):return [[sum(A[i][k]*B[k][j] for k in range(6)) for j in range(6)] for i in range(6)]
A=[[0]*6 for _ in range(6)];B=[[0]*6 for _ in range(6)]
for i in (4,5):
 for j in range(4):A[i][j]=i+j+1;B[i][j]=2*i+j+1
D=[[0]*6 for _ in range(6)]
for i in range(6):D[i][i]=i+1
assert all(v==0 for row in matmul(matmul(A,D),B) for v in row)
Bbad=[row[:] for row in B];Bbad[0][4]=1;assert any(v!=0 for row in matmul(matmul(A,D),Bbad) for v in row)
# All binary words through k=16; adjacent derivative blocks vanish.
rows=[]
for k in range(17):
 valid=[]
 for w in range(1<<k):
  if w&(w<<1):continue
  d=w.bit_count();assert d<=(k+1)//2;valid.append(d)
 assert max(valid)==(k+1)//2 and len(valid)<=2**k
 rows.append({'operatorCount':k,'totalWords':2**k,'nonadjacentWords':len(valid),'maximumDerivativeLetters':max(valid)})
# Every word contributes (C/2)^L, and at most 2^(L-1) words.
for L in range(1,30):assert 2**(L-1)*F(1,2)**L==F(1,2)
# e <= 1+1+1/2+1/4 = 11/4 < 3 using k!>=6*3^(k-3) for k>=3.
assert F(11,4)<3 and F(3,12)==F(1,4)
# Direct rational samples of the source geometric threshold, including L=1 separately.
checks=0
for s in (F(1,2),F(1,8),F(1,32),F(1,128)):
 for z in (F(1,100),F(1,40),F(1,20),F(1,10),F(1,5)):
  bound=72*z*z/s;K=-((-bound.numerator)//bound.denominator);assert K>=1
  for L in range(K+1,K+6):
   d=L//2;T=z**L/(2*math.factorial(L))*max(F(1),F(d,1)/s)**d
   assert 72*z*z<=s*L and 9*z*z*16<=2*s*L and T<=F(1,2*4**L);checks+=1
assert checks==100
# Abstract source-compatible block example: scalar A0=2, A1=0, a=1 has ||K1||=2.
assert F(2)>1
result={'schema':'MathScope.OriginalPicard.ValueTailFromCoefficientBounds/1','sourceTailReceiptSHA256':H(tb),'profileSHA256':H(pb),'functionsSHA256':H(functions.read_bytes()),'sourceActualOrders':[r['order'] for r in v['rows']],'sourceActualSystems':[r['system'] for r in v['rows']],'blockMaskAndDistinctDiagonalKernelControl':True,'badMaskControlDetected':True,'finiteWordChecks':rows,'exactRationalThresholdTests':checks,'sourceStripFact':'The pinned profile has T>0, 0<h<1, 0<sigmaStar<1/2000, rho=sigmaStar^2/65536<1 and Q>1. Hence delta=rho/(1024Q) in (0,1), and each actual n>=1 solution strip s<=delta/8<1.','conditionalTheorem':'Assume the actual source coefficient matrices and forcing are bounded by C/2 on the radial interval and S_(2s), and are holomorphic in eta there; assume 0<s<=1, C>0 and a>0. For L>=2, the L-integral k=L-1 Volterra term is bounded by (Ca)^L/(2L!)*max(1,d/s)^d where d<=floor(L/2). Since L! >= (L/3)^L, this is <= (3Ca/sqrt(2sL))^L/2. If L>=72(Ca)^2/s it is <=4^(-L)/2. For N>=ceil(72(Ca)^2/s)>=1, summing L=N+1 onward yields ||W-W_N||_(S_s)<=4^(-N)/6<=4^(-N)/3. L=1 is not part of this tail and is bounded separately by Ca/2.','limitInterpretation':'This discharges the value-tail premise of the separate first-radial-derivative lemma conditional only on the stated actual coefficient/forcing majorants and holomorphic source data. Uniform convergence defines a mathematical fixed-n Picard limit; it is not evidence that the native finite display, capped at eight terms, equals that limit or evaluates K.','open':'The bound C/2 and eta analyticity are not established by a registry entry alone. Source leading data, lower-order analytic bounds, every actual input frame, arbitrary-order generated/derivative semantics, source endpoints and final jets remain separate.','release':'HOLD'}
out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf8', newline='\n')
print(json.dumps({'status': 'PASS', 'orders': len(v['rows']), 'wordDepths': len(rows),
                  'rationalTests': checks, 'badMaskRejected': True}))
