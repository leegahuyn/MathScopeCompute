"""Bind exact original Picard tail constants for n=1..5 and derivative lemma."""
import gzip,hashlib,json,math,sys
from fractions import Fraction as F
from pathlib import Path
assert len(sys.argv)==5,'usage: N4_GRAPH_GZ N4_REGISTRY_JSON FUNCTIONS_MJS OUT_JSON'
graph,registry,functions,out=map(Path,sys.argv[1:]);code=functions.read_bytes();assert hashlib.sha256(code).hexdigest()=='326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311';code=code.decode('utf8')
assert "if(c){const t=this.fresh('actual_Picard_radial_average');out=this.sub(rhs,this.mul(this.q(c),this.integral(this.mul(this.pow(t,c),this.picardRhs(system,component,this.mul(t,xi),eta,etaOrder)),t,this.zero,this.one)));}" in code
assert 'finitePartialSumIsExactSolution:false' in code;raw=registry.read_bytes();assert hashlib.sha256(raw).hexdigest()=='049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad';p=json.loads(json.loads(raw)['base']['picard'])
h=hashlib.sha256();nodes=[];count=0
with gzip.open(graph,'rb') as f:
 line=f.readline();h.update(line);assert json.loads(line)['node_count']==7358162
 for line in f:
  h.update(line)
  if count<=129000:nodes.append(json.loads(line))
  count+=1
assert count==7358162 and h.hexdigest()=='ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd'
assert nodes[24806]=={'op':'sqrt_positive','args':[24805]}
def factored(root,atoms):
 # Exact multiplicative normalization, treating C, a^2, and s as opaque nodes.
 def go(i):
  if i in atoms:return F(1),{atoms[i]:1}
  v=nodes[i];op=v['op'];a=v['args']
  if op=='rational':return F(int(a[0]),int(a[1])),{}
  if op=='multiply':
   c=F(1);d={}
   for j in a:
    z,e=go(j);c*=z
    for k,v in e.items():d[k]=d.get(k,0)+v
   return c,{k:v for k,v in d.items() if v}
  if op=='inverse':
   c,d=go(a[0]);return 1/c,{k:-v for k,v in d.items()}
  if op=='integer_power':
   c,d=go(a[0]);v=a[1];return c**v,{k:w*v for k,w in d.items()}
  raise ValueError((i,v))
 return go(root)
expected_ids=[(0,1,24818,24807,24825,24848),(3,2,118568,117678,118577,118573),(5,3,121892,120822,121901,121897),(7,4,125092,123872,125101,125097),(9,5,128610,127243,128619,128615)]
rows=[]
for sid,order,C,strip,K,M in expected_ids:
 s=p[sid];t=s['tail'];assert s['order']==order and s['eta']==2 and s['radialDomain']==[0,24806]
 assert t['sourceBound']==C and t['solutionStrip']==t['loss']==strip and t['Kcondition']==K
 sol=s['solutionNorm']['commonCollar'] if order==1 else s['solutionNorm'];assert sol==M
 assert nodes[K]['op']=='ceiling' and factored(nodes[K]['args'][0],{C:'C',24805:'a2',strip:'s'})==(F(72),{'C':2,'a2':1,'s':-1})
 assert nodes[M]['op']=='exp' and factored(nodes[M]['args'][0],{C:'C',24805:'a2',strip:'s'})==(F(9,2),{'C':2,'a2':1,'s':-1})
 assert factored(strip,{24801:'delta'})==(F(1,8) if order==1 else F(1,8*256**order),{'delta':1})
 source_factor=factored(t['sourceStrip'],{24801:'delta'});assert source_factor==(F(1,4) if order==1 else F(4,8*256**order),{'delta':1})
 assert s['diagonal']==[0,0,2,0,3,1] and all(s['A1'][i][j]==0 for i in range(6) for j in range(6) if i<4 or j>=4)
 if order==1:assert not t['sourceTruncationIndexNumericallyMaterialized'] and t['tailIsForTheCertifiedIndexNotForDisplayedTerms']
 else:assert t['finitePartialSumIsSolution'] is False and t['valueTailAtK']=='4^-K/3 for K>=Kcondition'
 rows.append({'order':order,'system':sid,'sourceC':C,'solutionStrip':strip,'sourceStrip':t['sourceStrip'],'Kcondition':K,'solutionNorm':M,'radialDomain':[0,24806],'sourceA1MaskChecked':True})
# Exact rational tests of the tail threshold; no binary floating point.
def ceil(q):return -((-q.numerator)//q.denominator)
trials=0
for s in [F(1,2),F(1,8),F(1,32),F(1,128)]:
 for z in [F(1,100),F(1,40),F(1,20),F(1,10),F(1,5)]:
  K=ceil(72*z*z/s)
  for m in range(max(1,K),max(1,K)+5):
   deriv=(m//2);term=z**m/F(math.factorial(m))*max(F(1),F(deriv,1)/s)**deriv
   assert 72*z*z<=s*m and 144*z*z<=2*s*m and 9*z*z*16<=2*s*m
   assert term<=F(1,4**m);trials+=1
assert trials==100
# The bounded-coefficient hypotheses alone do not force a one-step contraction.
# On the first zero-diagonal component, A0=2, A1=0, a=1 gives ||K1||=2.
assert F(2)*F(1)>1
result={'schema':'MathScope.OriginalPicard.SourceTailAndRadialDerivative/1','graphSHA256':h.hexdigest(),'registrySHA256':hashlib.sha256(raw).hexdigest(),'sourceFunctionsSHA256':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311','nodeCount':count,'rows':rows,'exactTailThresholdRationalTests':trials,'sourceEqualities':'For actual n=1..5, source K=ceil(72*C^2*a^2/s) and M=exp(9*C^2*a^2/(2*s)); n=1 uses s=delta/8 and source strip 2s, n>=2 uses s=delta/(8*256^n) and source strip 4s. All n use the original actual radius a^2=#24805 and the original nilpotent A1 mask.','conditionalLemma':'Let E_N be the mathematical error after N Volterra iterates. Assume the original source coefficient functions are continuous in xi, holomorphic on the needed eta strips, satisfy the source A0/A1 row-sum bound C/2, and the existing source value tail ||E_(N-1)||_(S_s)<=4^(-(N-1))/3 for N-1>=K. Then the original regular Volterra derivative identity yields ||partial_xi E_N||_(S_(s/2)) <= C*(1+2/s)*4^(-(N-1))/3. For real eta, Cauchy on eta disks of radii approaching s/2 gives |partial_eta^m partial_xi E_N| <= m!*(2/s)^m*C*(1+2/s)*4^(-(N-1))/3, uniformly for xi in [0,a], including xi=0.','negativeControl':'A scalar eta-independent component with a=1, A0=2, A1=0 has one-step operator norm at least 2; the source upper-bound hypotheses alone do not imply a Banach contraction. This is an abstract control, not an actual-source counterexample.','limits':'These are mathematical Picard iterates and a conditional bound, not native display partialSum(max 8) evaluation of the astronomical source K, nor an independent proof of coefficient majorants, Picard existence, X/axis higher radial derivatives, all original formal-to-actual domains or source cutoffs. Release and gates unchanged.','release':'HOLD'}
out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n');print(json.dumps({'status':'PASS','sourceNodeCount':count,'systems':len(rows),'exactRationalTests':trials}))
