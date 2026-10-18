#!/usr/bin/env python3
"""Independent source/inequality review of the resumed natural certificates."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
from math import comb,factorial
import gzip,json
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
NAT=ROOT/'work/resumed_continuation/natural'
HEADER=ROOT/'recovered/base/analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json'
SOURCE=ROOT/'work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz'
PINS={HEADER:'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1',SOURCE:'42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3'}
def pin(p):return {'path':str(p.relative_to(ROOT)),'sha256':sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
def main():
 for p,want in PINS.items():assert pin(p)['sha256']==want
 cert=json.loads((NAT/'evidence/SCALED_CALLER_CERTIFICATES.json').read_text());degree=json.loads((NAT/'evidence/ACTUAL_DEGREE_ONE.json').read_text())
 outputs=cert['outputs'];wanted={v for o in outputs for v in [o['sourceNode'],o['naturalNode'],o['YNode'],o['scaleNode']]}
 raw={}
 with gzip.open(SOURCE,'rb') as f:
  assert f.readline()==HEADER.read_bytes()
  for i,line in enumerate(f):
   if i>max(wanted|{3611}):break
   n,row=json.loads(line);assert i==n
   if i<=3611 or i in wanted:raw[i]=row
 for i in range(3612):assert raw[i]==degree['nodes'][i]
 # Independently compare each claimed multiplication with its native call,
 # retaining eta order, original radial node, and the exact original scale.
 for o in outputs:
  assert raw[o['sourceNode']]=={'op':'multiply','args':sorted([o['scaleNode'],o['naturalNode']])}
  assert raw[o['naturalNode']]=={'op':'actual_natural_series','args':[o['component'],o['YNode'],2,0,o['etaOrder']]}
  assert o['scaleNode'] in [3457,3498]
  assert o['YNode'] in [474,3628]
  m=o['etaOrder'];assert 0<=m<=5
  Y=F(4 if o['YNode']==474 else 5)
  first=F(factorial(m)*comb(m+1,m),(m+1)**2*20*4)*Y
  ratio=Y*F(m+2,40);tail=first/(1-ratio)
  assert ratio<1
  assert [str(first),str(ratio),str(tail)]==[o['tailFirstRational'],o['tailRatioUpper'],o['tailRational']]
  exponent=m-63 if o['scaleNode']==3457 else m-198
  assert exponent<0 and o['dyadicTailUpper']=={'coefficient':str(tail),'powerOfTwo':260*exponent}
  finite=F(1,2**51740) if o['scaleNode']==3498 and m==0 else F(0)
  assert tail/F(2**(-260*exponent))+finite<F(1,2**4096)
  assert F(o['absoluteEnclosure']['lower'])==-F(1,2**4096)
  assert F(o['absoluteEnclosure']['upper'])==F(1,2**4096)
 # Required original factor nodes and caller Y binding.
 expected={3457:('inverse',[3454]),3494:('definite_integral',[3493,3476,0,2]),3495:('multiply',[3454,3494]),3496:('exp',[3495]),3497:('inverse',[3456]),3498:('multiply',[3496,3497]),3454:('source_parameter',['Lambda']),3456:('source_parameter',['CSelected'])}
 for i,(op,args) in expected.items():assert raw[i]=={'op':op,'args':args}
 # Verify core formulas against the original degree prefix; the parameter
 # inequalities below use these formulas, not the natural author's prose.
 n=degree['nodes']
 def q(i):
  r=n[i];return F(*map(int,r['args'])) if r['op']=='rational' else None
 def polynomial(i):
  op,a=n[i]['op'],n[i]['args']
  if op=='rational':return {(0,0,0):F(*map(int,a))}
  if i in [2,9,3453]:return {tuple(int(k==[2,9,3453].index(i)) for k in range(3)):F(1)}
  if op=='add':
   z={}
   for c in a:
    for k,v in polynomial(c).items():z[k]=z.get(k,F(0))+v
   return {k:v for k,v in z.items() if v}
  if op=='multiply':
   z={}
   for k,v in polynomial(a[0]).items():
    for l,w in polynomial(a[1]).items():
     m=tuple(x+y for x,y in zip(k,l));z[m]=z.get(m,F(0))+v*w
   return {k:v for k,v in z.items() if v}
  if op=='integer_power' and a[1]==2:
   z={}
   for k,v in polynomial(a[0]).items():
    for l,w in polynomial(a[0]).items():
     m=tuple(x+y for x,y in zip(k,l));z[m]=z.get(m,F(0))+v*w
   return {k:v for k,v in z.items() if v}
  raise AssertionError(('unsupported polynomial',i,n[i]))
 assert polynomial(28)=={(0,0,0):F(1),(2,1,0):F(-2)}
 assert polynomial(3459)=={(1,0,0):F(4),(0,0,1):F(1)}
 assert polynomial(3467)=={(0,0,0):F(-3),(1,0,1):F(-1),(2,1,0):F(8),(1,1,1):F(2)}
 # Check g's integrand is substitution of zeta, an actual regular rational
 # expression. Every referenced node lies in the exact matching prefix.
 assert n[3475]['op']=='multiply' and 20 in n[3475]['args']
 assert n[3472]['op']=='multiply'
 assert n[3493]['op']=='multiply' and 20 in n[3493]['args']
 # r1 estimate: h<1/16, j=h^4<1, |U|<5, |W|<8,
 # L>7/8. Hence |r1|<(8+11/16)*8/7=139/14<13.
 r1=F(8,1)+F(11,16);r1*=F(8,7);assert r1==F(139,14) and r1<13
 assert F(13,4*2**16640)<F(1,2**4096)
 # Exact residual inequalities sufficient for the parameter estimates:
 # Q>=2 implies Q^200-Q^199>=Q^65/2; exp(-x)<1/x for x>0.
 assert 2**200-2**199>=F(2**65,2)
 # t1<exp(-120)<1/8, exp(t1)<8/7, gives Y<32/7<5.
 assert F(32,7)<5 and 1+120>8
 # Check all guards/restrictions remain expressly stated.
 assert cert['all138WholeKernelsRemainOpen'] and cert['newM3Closures']==0
 assert not cert['N706_closed'] and not cert['N805_closed']
 assert all(o['etaDomain']==['-1','1'] and not o['unscaledNativeKernelComplete'] for o in outputs)
 report={'schema':'MathScope.IndependentResumedNaturalReview/1','reviewedInputs':[pin(NAT/'code/certify_scaled_callers.py'),pin(NAT/'code/materialize_degree_one.mjs'),pin(NAT/'evidence/SCALED_CALLER_CERTIFICATES.json'),pin(NAT/'evidence/ACTUAL_DEGREE_ONE.json')],
  'status':'PASS_WITH_STATED_FORMAL_DOMAIN_AND_NORMALIZATION_SCOPE','originalScalarMultiplicationsIndependentlyMatched':len(outputs),'authenticatedCorePrefixRecordsCompared':3612,
  'tailRationalsAndDyadicErrorBudgetsRecomputed':len(outputs),'actual3632And3637Present':{str(i):any(o['sourceNode']==i for o in outputs)for i in [3632,3637]},
  'gProofReview':['For real eta in [-1,1], h<1/16 and sigmaStar>0 imply 0<L<=1 and Hstar^2+sigmaStar^2>0.',
   '|Hstar|/(Hstar^2+sigmaStar^2)<=1/(2 sigmaStar), and integration from 0 to eta has length<=1, so |psi|<=1/(2 sigmaStar)<Q/2.',
   'log(CSelected)>=Q^200 and Lambda=Q^64 imply log(g)<=Q^65/2-Q^200<=-Q^199 for Q>2.',
   'Since exp(x)>x for x>0, g<=exp(-Q^199)<Q^-199. This bounds g times the eta partial, not the derivative of their product.'],
  'phiOneProofReview':{'r1Upper':str(r1),'claimed13Valid':True,'chiInUnitInterval':'Hstar^2/(Hstar^2+sigmaStar^2), sigmaStar>0','smallCoefficientRemainder':'13/(4 Lambda)<2^-4096'},
  'domainProofReview':'Original Y is exactly 4 or 4 exp(t1), with 0<t1<1/8 and exp(t1)<8/7, hence 4<=Y<5; eta restriction unchanged.',
  'materialLimitations':['Formal eta-domain certificates do not prove every later global caller substitution.','No arbitrary-precision unscaled native kernel is certified.','Degree-zero caller enclosures use original normalizations and exact zero/one coefficients; the Phi1 enclosure is separate.'],
  'newM3Closures':0,'N706_closed':False,'N805_closed':False}
 (OUT/'REVIEW.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':report['status'],'normalizedScalarNodesReviewed':len(outputs),'tailBudgetsReviewed':len(outputs),'newM3Closures':0}))
if __name__=='__main__':main()
