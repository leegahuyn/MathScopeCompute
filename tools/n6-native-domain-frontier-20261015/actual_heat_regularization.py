"""Bind the original complete heat integral and check its exact calculus.

All-order domination is a written proof, not inferred from derivative samples.
No classical regularity of other source terms or original obligation is inferred.
"""
from __future__ import annotations
import argparse,hashlib,importlib.util,json,os
from pathlib import Path
import sympy as s

def main():
 p=argparse.ArgumentParser();p.add_argument('--source-db',type=Path,required=True);p.add_argument('--stage3',type=Path,required=True)
 p.add_argument('--diagnostics',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 stage=a.stage3.read_bytes();assert hashlib.sha256(stage).hexdigest()=='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f'
 spec=importlib.util.spec_from_file_location('heat_source_v3',a.stage3);v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
 get=v3.Source(a.source_db);raw=a.diagnostics.read_bytes()
 assert hashlib.sha256(raw).hexdigest()=='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1'
 d=json.loads(raw)
 assert d['headerBinding']['sourceHeaderRecordSHA256']=='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
 assert d['fullNativePayloads']['fixed']['source']['parametersExactExpressions']['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}
 roots={'originalHeatLoss':71948,'originalGammaIntegral':71517};nodes={}
 def children(n):
  op,ar=n['op'],n['args']
  if op in ('rational','coordinate','source_parameter'):return []
  if op in ('integer_power','source_step_derivative'):return ar[:1]
  assert op in ('add','multiply','inverse','sqrt_positive','exp','log_positive','definite_integral'),op
  return ar
 def walk(i):
  if i in nodes:return
  nodes[i]=get(i)
  for c in children(nodes[i]):walk(c)
 for i in roots.values():walk(i)
 assert nodes[9]=={'op':'source_parameter','args':['h']} and nodes[4756]=={'op':'coordinate','args':['X']} and nodes[2]=={'op':'coordinate','args':['eta']}
 h,X,v,w=s.symbols('h X v w',positive=True,real=True)
 eta=s.Symbol('eta',real=True)
 symbols={9:h,4756:X,2:eta,71926:v,71505:w}
 def expr(i):
  if i in symbols:return symbols[i]
  n=nodes[i];op,ar=n['op'],n['args']
  if op=='rational':return s.Rational(*map(int,ar))
  if op=='add':return s.Add(*(expr(c) for c in ar))
  if op=='multiply':return s.Mul(*(expr(c) for c in ar))
  if op=='inverse':return 1/expr(ar[0])
  if op=='integer_power':return expr(ar[0])**ar[1]
  if op=='log_positive':return s.log(expr(ar[0]))
  if op=='exp':return s.exp(expr(ar[0]))
  raise AssertionError((i,n))
 assert nodes[71947]=={'op':'definite_integral','args':[71946,71926,0,1]}
 assert nodes[71517]=={'op':'definite_integral','args':[71516,71505,0,1]}
 assert nodes[71948]=={'op':'multiply','args':[71518,71947]} and nodes[71518]=={'op':'inverse','args':[71517]}
 u=v/(1-v);A=2*(1-eta**2)/X
 def equal(x,y):return s.simplify(s.expand_log(x-y,force=True))==0
 assert equal(expr(71934),-u+h*s.log(u))
 assert equal(expr(71940),-h*s.log(1+A*u))
 assert equal(expr(71946),s.exp(-u+h*s.log(u))*(1-s.exp(-h*s.log(1+A*u)))/(1-v)**2)
 uw=w/(1-w)
 assert equal(expr(71516),s.exp(-uw+h*s.log(uw))/(1-w)**2)
 # Exact symbolic profile-to-slow substitution, retaining all terms.
 R,T,Z,q=s.symbols('R T Z q',positive=True,real=True)
 converted=s.simplify(A.subs({X:R**2/(2*q),eta:Z*q**(h-s.Rational(1,2))}))
 constraint=q-Z**2*q**(2*h)-T
 assert s.simplify(converted-4*T/R**2-4*constraint/R**2)==0
 aa,uu=s.symbols('a u',positive=True)
 for n in range(7):
  actual=s.diff((1+aa*uu)**(-h),aa,n)
  expected=(-1)**n*s.rf(h,n)*uu**n*(1+aa*uu)**(-h-n)
  assert s.simplify(actual-expected)==0
 negative={
  'changed_actual_heat_argument_rejected':not equal(expr(71940),-h*s.log(1+2*A*u)),
  'missing_compactification_jacobian_rejected':not equal(expr(71516),s.exp(-uw+h*s.log(uw))),
 }
 assert all(negative.values())
 result={'schema':'MathScope.N6.ActualCompleteHeatRegularity/1','executionRun':os.environ.get('GITHUB_RUN_ID'),
  'diagnosticsSHA256':hashlib.sha256(a.diagnostics.read_bytes()).hexdigest(),'sourceHeaderRecordSHA256':d['headerBinding']['sourceHeaderRecordSHA256'],
  'freshCacheScope':'Same workflow cache produced by the preceding full authenticated original source extraction; arbitrary supplied SQLite is not independently authenticated here.',
  'roots':roots,'primitiveNodes':{str(i):n for i,n in sorted(nodes.items())},'sourceNodeCount':len(nodes),
  'actualIntegralBindings':{'fullOriginalHeatLoss':True,'fullOriginalGammaDenominator':True,'untruncatedImproperEndpoints':[0,1],
   'profileArgument':'2*(1-eta^2)/X','originalSlowConstraint':'s-Z^2*s^(2h)-T=0','slowArgument':'4*T/R^2',
   'symbolicLogRewriteDomain':'0<v,w<1, X>0, h>0, a>=0. Domain validity is supplied by the written argument and actual caller gates, not by force-expanded logarithm identities.'},
  'universalWrittenProof':'ACTUAL_HEAT_REGULARITY_KO.md',
  'allOrderDerivativeFormula':'H^(n)(a)=(-1)^n*(h)_n/Gamma(1+h)*integral_0^infinity exp(-u)*u^(h+n)*(1+a*u)^(-h-n) du',
  'allOrderCompactMajorant':'(h)_n*(1+h)_n for every fixed n>=0 and all a>=0',
  'conclusion':'The original heat factor is C-infinity for a>=0 with continuous one-sided derivatives at0; after actual chart substitution it is C-infinity on R>0,T>=0 in the same one-sided convention.',
  'ordinaryDerivativeFormulaRegressionOrders':list(range(7)),'finiteSamplesUsedAsAllOrderProof':False,'negativeControls':negative,
  'noNegativeTimeExtensionAsserted':True,'wholeGRegularity':'OPEN','newOriginalGuardDischarged':0,'newOriginalJetDischarged':0,'newOriginalPDEDischarged':0}
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'sourceNodes':len(nodes),'actualHeatBindings':True,'newOriginalDischarged':0}))
if __name__=='__main__':main()
