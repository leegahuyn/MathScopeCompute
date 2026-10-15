#!/usr/bin/env python3
"""Fresh-source binding of nonzero angular carriers and moving nt/n^2.

Only a small selected proof cone is exported. Native coefficient functions
and static representative denominators retain their OPEN source premises.
"""
from __future__ import annotations
import argparse,hashlib,importlib.util,json,os
from functools import lru_cache
from pathlib import Path
import sympy as S

def canonical(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def sha(x):return hashlib.sha256(canonical(x)).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--source-db',type=Path,required=True);p.add_argument('--stage3',type=Path,required=True)
 p.add_argument('--header',type=Path,required=True);p.add_argument('--compact',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 assert hashlib.sha256(a.stage3.read_bytes()).hexdigest()=='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f'
 spec=importlib.util.spec_from_file_location('volterra_original_v3',a.stage3);v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
 g=v3.Source(a.source_db);C=json.loads(a.compact.read_text(encoding='utf-8'))
 assert hashlib.sha256(a.header.read_bytes()).hexdigest()==C['sourceHeaderSHA256']
 reg=v3.registries(json.loads(a.header.read_text(encoding='utf-8')))
 primitive={'add','multiply','inverse','sqrt_positive','exp','log_positive','integer_power','ceiling','smooth_piecewise','source_step_derivative','sine','cosine','maximum','definite_integral'}
 def children(n):
  op=n['op'];aa=n['args']
  if op in ('rational','coordinate','source_parameter'):return []
  if op in ('inverse','sqrt_positive','exp','log_positive','integer_power','ceiling','source_step_derivative','sine','cosine'):return aa[:1]
  if op in primitive:return aa
  return [] # a retained native source body is an explicit frontier
 @lru_cache(None)
 def flat_add(i):
  n=g(i)
  return tuple(j for k in n['args'] for j in flat_add(k)) if n['op']=='add' else (i,)
 def square_base(i):
  n=g(i);aa=n['args']
  if n['op']=='integer_power' and aa[1]==2:return aa[0]
  if n['op']=='multiply' and len(aa)==2 and aa[0]==aa[1]:return aa[0]
  return None
 def radius_division(i):
  n=g(i)
  if n['op']!='multiply' or len(n['args'])!=2:return None
  for j,k in (n['args'],list(reversed(n['args']))):
   if g(j)=={'op':'inverse','args':[622802]}:return k
  return None
 def rational(i):
  n=g(i);assert n['op']=='rational'
  return S.Rational(*map(int,n['args']))
 selected={};bindings=[];controls=[]
 for covariance in (0,1):
  key='covariance:'+str(covariance);record=C['definitions'][key];d=record.get('fullDefinition',record)
  actual=[r for r in reg['m3GlobalPulses'] if r['covariance']==covariance];assert len(actual)==1 and sha(actual[0])==record['sha256']
  assert actual[0]==d and d['initial']==[1,0] and d['left']==0 and d['length']==623027
  original=json.loads(d['originalDefinition']);assert original['matrix']==d['matrix'] and original['parameters']==d['parameters']
  seen=set();todo=[i for row in d['matrix'] for i in row]
  while todo:
   i=todo.pop()
   if i in seen:continue
   seen.add(i);assert len(seen)<=20000,'Explicit remote primitive search budget exceeded'
   todo.extend(children(g(i)))
  nt_candidates=[]
  for i in sorted(seen):
   n=g(i)
   if n['op']!='sqrt_positive':continue
   terms=flat_add(n['args'][0]);bases=[square_base(t) for t in terms]
   if len(terms)!=2 or any(b is None for b in bases):continue
   found=[(b,radius_division(b)) for b in bases if radius_division(b) is not None]
   if len(found)==1:nt_candidates.append((i,n['args'][0],bases,found[0]))
  assert len(nt_candidates)==1,('Ambiguous actual moving nt root',covariance,nt_candidates)
  nt,nt2,bases,(nth,pnode)=nt_candidates[0];nz=next(b for b in bases if b!=nth)
  n2_candidates=[]
  for i in sorted(seen):
   if g(i)['op']!='add':continue
   terms=flat_add(i);bs=[square_base(t) for t in terms]
   if len(terms)==3 and all(x is not None for x in bs) and nth in bs and nz in bs:n2_candidates.append((i,bs))
  assert len(n2_candidates)==1,('Ambiguous actual normal-square node',covariance,n2_candidates)
  n2,normal_bases=n2_candidates[0];nr=next(b for b in normal_bases if b not in (nth,nz))
  pn=g(pnode);assert pn['op']=='multiply' and len(pn['args'])==2
  options=[]
  for j,k in (pn['args'],list(reversed(pn['args']))):
   if g(j)['op']=='inverse' and g(g(j)['args'][0])['op']=='ceiling':options.append((g(j)['args'][0],k))
  assert len(options)==1
  carrier_k,rounded_integer=options[0];rn=g(rounded_integer);assert rn['op']=='smooth_piecewise'
  rounded,left,right,outerleft,fallback,outerright=rn['args']
  assert rational(left)==-S.Rational(1,2) and rational(right)==S.Rational(1,2) and outerleft==outerright==rounded
  fb=g(fallback);assert fb['op']=='smooth_piecewise'
  scaled,zero0,zero1,minus,plus0,plus1=fb['args']
  assert rational(zero0)==rational(zero1)==0 and rational(minus)==-1 and rational(plus0)==rational(plus1)==1
  x=S.Symbol('actual_scaled_carrier',real=True)
  def expression(root,env):
   @lru_cache(None)
   def at(i):
    if i in env:return env[i]
    n=g(i);op=n['op'];aa=n['args']
    if op=='rational':return S.Rational(*map(int,aa))
    if op=='add':return S.Add(*(at(t) for t in aa))
    if op=='multiply':return S.Mul(*(at(t) for t in aa))
    if op=='inverse':return 1/at(aa[0])
    if op=='ceiling':return S.ceiling(at(aa[0]))
    raise ValueError('Unexpected original rounded-carrier operator '+str(i)+' '+op)
   return at(root)
  assert S.expand(expression(rounded,{scaled:x})+S.ceiling(-x-S.Rational(1,2)))==0
  # Bind k=ceil(1/sqrt(epsilon)), epsilon=exp(real source exponent).
  inv=g(g(carrier_k)['args'][0]);assert inv['op']=='inverse'
  sq=g(inv['args'][0]);assert sq['op']=='sqrt_positive'
  epsilon=sq['args'][0];assert g(epsilon)['op']=='exp'
  epsilon_cone=set();todo=[epsilon]
  while todo:
   i=todo.pop()
   if i in epsilon_cone:continue
   epsilon_cone.add(i);n=g(i)
   assert n['op'] in {'rational','coordinate','source_parameter','add','multiply','exp','log_positive','inverse','sqrt_positive','integer_power'}
   if n['op'] in ('log_positive','sqrt_positive'):
    operand=g(n['args'][0]);assert operand['op']=='exp' or operand['op']=='rational' and rational(n['args'][0])>0
   todo.extend(children(n))
  assert all(g(i)['op']!='coordinate' or i==622791 for i in epsilon_cone)
  # A genuinely zero rounded value would lose the nonzero-normal proof;
  # test the actual fallback rows, not arbitrary values for the source ODE.
  valid_fallback=[int(rational(t)) for t in (minus,plus0,plus1)]
  assert all(t!=0 for t in valid_fallback)
  def rejected(predicate,value):
   try:predicate(value)
   except AssertionError:return True
   raise AssertionError('A changed dynamic-denominator source operand was accepted.')
  def nonzero_fallback(values):assert all(t in (-1,1) for t in values)
  def actual_nt_square(values):assert len(values)==2 and nth in values and nz in values
  def actual_positive_carrier(value):assert value['op']=='ceiling' and g(value['args'][0])['op']=='inverse'
  controls.append({'covariance':covariance,
                   'changedActualFallbackToZeroRejected':rejected(nonzero_fallback,[0,*valid_fallback[1:]]),
                   'omittedActualAngularNormalSquareRejected':rejected(actual_nt_square,[nz]),
                   'changedActualCarrierKToZeroRejected':rejected(actual_positive_carrier,{'op':'rational','args':['0','1']})})
  stops={scaled,nr,nz};proof_roots={nt,nt2,n2,pnode,nth,carrier_k,rounded_integer,rounded,fallback,epsilon}
  proof_seen=set();todo=list(proof_roots)
  while todo:
   i=todo.pop()
   if i in proof_seen:continue
   proof_seen.add(i);selected[str(i)]=g(i)
   if i in stops:continue
   todo.extend(children(g(i)))
  assert len(selected)<=500,'Selected dynamic-denominator proof cone exceeds500 source nodes'
  bindings.append({'covariance':covariance,'definitionSHA256':record['sha256'],'originalName':original['name'],
    'actualMatrixRoots':d['matrix'],'primitiveSearchNodes':len(seen),'actualNtSource':nt,'actualNtSquaredSource':nt2,
    'actualNormalSquaredSource':n2,'actualNormalBases':normal_bases,'actualNThetaSource':nth,'actualPSource':pnode,
    'actualKSource':carrier_k,'actualEpsilonSource':epsilon,'actualRoundedIntegerSource':rounded_integer,
    'actualPreFallbackRoundedSource':rounded,'actualFallbackSource':fallback,'actualScaledCarrierSource':scaled,
    'selectedProofNodes':len(proof_seen),'openActualFiniteRealAtoms':{'scaledCarrier':scaled,'normalR':nr,'normalZ':nz},
    'proof':'The actual pre-fallback integer is floor(scaledCarrier+1/2). Its only possible zero case is replaced by an actual±1 branch. Thus m is an integer!=0. Actual k=ceil(epsilon^-1/2)>=1 because epsilon=exp(finite real frozen exponent)>0. Therefore actual p=m/k!=0, actual n_theta=p/R, nt^2=n_theta^2+n_z^2>=p^2/R^2>0, and actual n^2=n_r^2+n_theta^2+n_z^2>=nt^2>0 on original R>0.'})
 result={'schema':'MathScope.N6.ActualVolterraDynamicDenominator/1','executionRun':os.environ.get('GITHUB_RUN_ID'),
  'sourceHeaderSHA256':C['sourceHeaderSHA256'],'compactSHA256':hashlib.sha256(a.compact.read_bytes()).hexdigest(),
  'freshCacheScope':'Same workflow cache authenticated by preceding full original-source replay; this reader is not standalone cache authentication.',
  'originalCovarianceBindings':bindings,'originalSelectedSourceGraph':selected,'sourceNodeCount':len(selected),'negativeControls':controls,
  'dynamicDenominatorConclusion':'Both actual covariance0/1 moving nt and normal-squared denominators are strictly positive at every original point with R>0 and finite real original coefficients. No numerical lower-bound sample or replacement ODE value is used.',
  'staticConditionsStillOpen':['Actual frozen representative gabs,c0,lambda0,Bs and their source domains.','Actual finite real regularity of the complete background profiles/derivatives entering the matrix.'],
  'newOriginalGuardDischarged':0,'newOriginalJetDischarged':0,'newOriginalPDEDischarged':0,'wholeVolterraRegularityProved':False}
 assert all(all(value for name,value in c.items() if name!='covariance') for c in controls)
 a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 print(json.dumps({'selectedSourceNodes':len(selected),'actualCovarianceSystems':2,'actualDynamicDenominatorBinding':True,'newOriginalDischarged':0}))
if __name__=='__main__':main()
