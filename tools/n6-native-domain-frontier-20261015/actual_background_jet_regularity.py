"""Fresh source-bound regularity and ordered derivatives for 26 background rows.

Only the four finite registered bodies688..691 are concluded. The historical
matrix is read-only; failure of any body/domain gate gives zero row discharge.
"""
from __future__ import annotations
import argparse,copy,hashlib,importlib.util,json,sys
from collections import Counter
from dataclasses import dataclass
from fractions import Fraction as Q
from functools import lru_cache
from pathlib import Path
import actual_eta_transport as e
from native_domain_extract import (argument_children,conservative_capture,require,sha,STAGE3_PIN,G_ROOT)
from natural_domain_proof import FIXED_PIN,TARGET_PIN,source_parameter_proof

HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
MATRIX_PIN='2e854cc1c7ee577a4451dc9e93849212ae055dcccc705599ee109b7d10bbcf21'
ROWS_PIN='43b76b61892a3c59811cfa79a556f24a2f5599fdab9434c51bd8d13bf44c261b'
ORDER_PIN='f3c6144b294fc1252bd01f9f255e664de30e2ce73a5e88e52bd806c92945a8d3'
R,Z,T,ELL=e.R,e.Z,e.TIME,622791
X,ETA,QVAR=e.X,e.ETA,617438
FILES={
 'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
 'research-ide/mathscope-m3/navier/source-global-band.mjs':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
 'research-ide/mathscope-m3/navier/source-global-current.mjs':'93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
 'research-ide/mathscope-m2/navier/actual-residual-order-induction-background.mjs':'e04a02a8878168d673fd7deed45de6bbfb2591ec58f3abc9eb8f08e1d2770879',
 'research-ide/mathscope-m2/navier/actual-covariance-sensitivity.mjs':'f27ed95c3a1e40a4dfa4a38340d170aa92c7ec6102b277c952e1dc2dc91ac27c'}

class Gap(ValueError):pass
def prove(ok,message):
 if not ok:raise Gap(message)
def digest(raw):return hashlib.sha256(raw).hexdigest()
def call(i,args,orders=None):return ('call',i,tuple(args),tuple(orders or [0]*len(args)))

class BodyNormal:
 """Canonical exact body comparison, with real binders and retained functions."""
 def __init__(self,get,reg,atoms=None):self.get=get;self.reg=reg;self.atoms=atoms or {}
 @lru_cache(None)
 def at(self,i,environment=(),depth=0):
  env=dict(environment)
  if i in self.atoms:
   tag=self.atoms[i]
   return (tag,tuple(env.get(j,('coordinate',j)) for j in ([ETA] if tag=='P0' else [X,ETA]))) if tag in {'P0','M0'} else (tag,i)
  n=self.get(i);op,a=n['op'],n['args']
  f=lambda j:self.at(j,environment,depth)
  if op=='rational':return e.rat(int(a[0]),int(a[1]))
  if op=='coordinate':return env.get(i,('coordinate',i))
  if op=='source_parameter':return ('parameter',a[0])
  if op=='add':return e.add(*(f(j) for j in a))
  if op=='multiply':return e.mul(*(f(j) for j in a))
  if op=='integer_power':return e.power(f(a[0]),a[1])
  if op=='inverse':return e.power(f(a[0]),-1)
  if op=='exp':return e.exp(f(a[0]))
  if op=='log_positive':return e.log(f(a[0]))
  if op=='sqrt_positive':return ('sqrt',f(a[0]))
  if op=='actual_expression_partial':return call(a[0],[f(j) for j in a[1]],a[2])
  if op=='actual_monotone_root':return ('monotone',a[0],tuple(f(j) for j in a[1:]))
  if op=='definite_integral':
   body,binder,lo,hi=a;local=dict(env);local[binder]=('bound',depth)
   return ('integral',self.at(body,tuple(sorted(local.items())),depth+1),f(lo),f(hi))
  if op=='smooth_piecewise':return (op,tuple(f(j) for j in a))
  return ('UNREVIEWED',op,i)

@dataclass(frozen=True)
class Bound:
 lo:Q|None;hi:Q|None;strict_positive:bool=False
def bounded(v):
 if v==0:return Bound(Q(0),Q(0),False)
 if v>2:return Bound(Q(2),None,True)
 if v<-2:return Bound(None,Q(-2),False)
 return Bound(v,v,v>0)
def product(a,b):
 if a.lo==a.hi==0 or b.lo==b.hi==0:return bounded(Q(0))
 if a.lo is not None and a.lo>=0 and b.lo is not None and b.lo>=0:
  return Bound(min(Q(2),a.lo*b.lo),None if a.hi is None or b.hi is None else a.hi*b.hi,a.strict_positive and b.strict_positive)
 if a.hi is not None and a.hi<=0 and b.hi is not None and b.hi<=0:
  return Bound(min(Q(2),a.hi*b.hi),None if a.lo is None or b.lo is None else a.lo*b.lo,a.hi<0 and b.hi<0)
 if a.lo==a.hi and a.lo is not None:
  if a.lo<0:return Bound(None if b.hi is None else a.lo*b.hi,None if b.lo is None else a.lo*b.lo,b.hi is not None and b.hi<0)
  return Bound(None if b.lo is None else a.lo*b.lo,None if b.hi is None else a.lo*b.hi,b.strict_positive)
 if b.lo==b.hi and b.lo is not None:return product(b,a)
 return Bound(None,None,False)

class ConstantDomains:
 """Finite real source constants with conservative sign proofs, no floats."""
 def __init__(self,get,parameters):self.get=get;self.parameters=parameters;self.domains=[];self.used=set()
 @lru_cache(None)
 def ast(self,key):
  value=self.parameters[key]
  if key in {'h','lambda'}:
   # The exact parameter trees were checked by source_parameter_proof;
   # T_parameter>128 and exp(4)>16 give these strict upper bounds.
   prove(value=={'exp':{'product':[{'integer':-8002 if key=='h' else -1000},{'ref':'T'}]}},'Changed actual small exponent '+key)
   return Bound(Q(0),Q(1,16),True)
  if key in {'Q','Lambda','CSelected','Pstar','T','XR'}:return Bound(Q(2),None,True)
  return self.tree(value)
 def tree(self,v):
  prove(isinstance(v,dict) and len(v)==1,'Unknown source constant AST')
  op,a=next(iter(v.items()))
  if op=='integer':return bounded(Q(int(a)))
  if op=='rational':return bounded(Q(a))
  if op=='ref':prove(a in self.parameters,'Missing fixed source parameter '+a);return self.ast(a)
  if op=='exp':return self.operation('exp',[self.tree(a)])
  if op=='log':return self.operation('log_positive',[self.tree(a)])
  if op=='ceil':return self.operation('ceiling',[self.tree(a)])
  if op=='power':return self.operation('integer_power',[self.tree(a[0])],int(a[1]))
  if op=='quotient':return product(self.tree(a[0]),self.operation('inverse',[self.tree(a[1])]))
  if op in {'product','sum','min'}:
   rows=[self.tree(v) for v in a]
   if op=='min':
    prove(all(v.strict_positive for v in rows),'Unproved min-source positivity')
    return Bound(Q(0),None,True)
   return self.operation('multiply' if op=='product' else 'add',rows)
  raise Gap('Unknown fixed AST operation '+op)
 def operation(self,op,rows,n=None):
  if op=='add':
   lo=None if any(v.lo is None for v in rows) else sum(v.lo for v in rows)
   hi=None if any(v.hi is None for v in rows) else sum(v.hi for v in rows)
   pos=lo is not None and (lo>0 or lo==0 and all(v.lo is not None and v.lo>=0 for v in rows) and any(v.strict_positive for v in rows))
   return Bound(lo,hi,pos)
  if op=='multiply':
   out=bounded(Q(1))
   for row in rows:out=product(out,row)
   return out
  a=rows[0]
  if op=='inverse':
   prove(a.strict_positive or a.hi is not None and a.hi<0,'Unproved finite constant inverse')
   if a.strict_positive:return Bound(Q(0) if a.hi is None else 1/a.hi,None if a.lo in (None,0) else 1/a.lo,True)
   return Bound(None if a.hi==0 else 1/a.hi,None if a.lo is None else 1/a.lo,False)
  if op=='integer_power':
   prove(type(n) is int,'Noninteger source power')
   if n==0:return bounded(Q(1))
   if n<0:return self.operation('integer_power',[self.operation('inverse',[a])],-n)
   if a.lo is not None and a.lo>=0:
    # Only sign/positivity is required. Avoid materializing C^100000.
    lo=min(Q(2),a.lo) if a.lo>=1 else Q(0)
    hi=None if a.hi is None or a.hi>1 else a.hi
    return Bound(lo,hi,a.strict_positive)
   if n%2==0:return Bound(Q(0),None,a.hi is not None and a.hi<0)
   return Bound(None,None,False)
  if op=='exp':return Bound(Q(1) if a.lo is not None and a.lo>=0 else Q(0),Q(1) if a.hi is not None and a.hi<=0 else None,True)
  if op=='log_positive':
   prove(a.strict_positive,'Unproved finite constant logarithm')
   # 1-1/x <= log(x) <= x-1 for x>0, preserving a strict
   # negative upper bound for h<1 without evaluating enormous scales.
   return Bound(1-1/a.lo if a.lo is not None and a.lo>0 else None,a.hi-1 if a.hi is not None and a.hi>0 else None,a.lo is not None and a.lo>1)
  if op=='sqrt_positive':
   prove(a.lo is not None and a.lo>=0,'Unproved finite constant radical')
   return Bound(Q(0),None,a.strict_positive)
  if op=='ceiling':return Bound(Q(1) if a.strict_positive else None,None,a.strict_positive)
  if op=='maximum':return Bound(None if all(v.lo is None for v in rows) else max(v.lo for v in rows if v.lo is not None),None if any(v.hi is None for v in rows) else max(v.hi for v in rows),any(v.strict_positive for v in rows))
  raise Gap('Unreviewed finite constant operation '+op)
 @lru_cache(None)
 def at(self,i,environment=()):
  self.used.add(i);node=self.get(i);op,a=node['op'],node['args']
  if op=='rational':return bounded(Q(int(a[0]),int(a[1])))
  if op=='source_parameter':prove(a[0] in self.parameters,'Unbound fixed source parameter');return self.ast(a[0])
  if op=='coordinate':
   prove(i in dict(environment),'Unbound constant-integral coordinate '+str(i));return dict(environment)[i]
  if op=='definite_integral':return self.integral(i,a,environment)
  if op=='source_step_derivative':
   arg=self.at(a[0],environment);order=a[1]
   prove(type(order) is int and 0<=order<=12,'Unreviewed actual square-step derivative order')
   # The separately pinned literal interpreter defines the globally smooth
   # square-seed quotient. Its first derivative is strictly positive on
   # (0,1), nonnegative everywhere, and all endpoint jets vanish.
   if order==0:
    if arg.hi is not None and arg.hi<=0:return bounded(Q(0))
    if arg.lo is not None and arg.lo>=1:return bounded(Q(1))
    return Bound(Q(0),Q(1),arg.strict_positive)
   if order==1:return Bound(Q(0),None,arg.strict_positive and arg.hi is not None and arg.hi<1)
   return Bound(None,None,False)
  prove(op in {'add','multiply','inverse','integer_power','exp','log_positive','sqrt_positive','ceiling','maximum'},'Unreviewed constant ancestor '+str((i,op)))
  prove(op!='ceiling' or not environment,'Unreviewed discontinuous integral integrand')
  rows=[self.at(j,environment) for j in (a[:1] if op in {'integer_power','inverse','exp','log_positive','sqrt_positive','ceiling'} else a)]
  try:out=self.operation(op,rows,a[1] if op=='integer_power' else None)
  except Gap as err:
   err.primitive_frontier={'node':i,'sourceNode':node,
     'argumentEnclosures':[{'lo':str(v.lo) if v.lo is not None else None,'hi':str(v.hi) if v.hi is not None else None,'strictPositive':v.strict_positive} for v in rows],
     'scopedCoordinates':[j for j,_ in environment]}
   raise
  if op=='add' and self.lambda_minus_h_with_nonnegative_remainder(i,environment):
   # h/lambda=exp(-7002*T)<1, from the already checked literal
   # parameter ASTs and T>128. No independent-small-number guess is used.
   self.ast('h');self.ast('lambda');out=Bound(Q(0),out.hi,True)
  if op in {'inverse','log_positive','sqrt_positive'} or op=='integer_power' and a[1]<0:
   self.domains.append({'node':i,'operation':op,'argument':a[0],'strictPositive':rows[0].strict_positive,'proved':True})
  return out
 def lambda_minus_h_with_nonnegative_remainder(self,i,environment):
  leaves=[]
  def flatten(j):
   n=self.get(j)
   if n['op']=='add':
    for k in n['args']:flatten(k)
   else:leaves.append(j)
  flatten(i);lp=[];hm=[]
  for j in leaves:
   n=self.get(j)
   if n=={'op':'source_parameter','args':['lambda']}:lp.append(j)
   if n['op']=='multiply' and len(n['args'])==2:
    for h,minus in (n['args'],n['args'][::-1]):
     if self.get(h)=={'op':'source_parameter','args':['h']} and self.get(minus)=={'op':'rational','args':['-1','1']}:hm.append(j)
  if len(lp)!=1 or len(hm)!=1:return False
  return all((v:=self.at(j,environment)).lo is not None and v.lo>=0 for j in leaves if j not in {lp[0],hm[0]})
 def integral(self,i,args,environment):
  body,binder,lower,upper=args
  prove(self.get(binder)['op']=='coordinate','Malformed constant integral binder')
  # Endpoints are evaluated outside the new scope; shadowing the same
  # coordinate affects only the body, including nested integral bodies.
  def endpoint(j):
   out=self.at(j,environment);n=self.get(j)
   if n['op']=='rational':
    v=Q(int(n['args'][0]),int(n['args'][1]));return Bound(v,v,v>0)
   return out
  low,high=endpoint(lower),endpoint(upper)
  scoped=dict(environment);scoped[binder]=Bound(None if low.lo is None or high.lo is None else min(low.lo,high.lo),None if low.hi is None or high.hi is None else max(low.hi,high.hi),low.strict_positive and high.strict_positive)
  inner=self.at(body,tuple(sorted(scoped.items())))
  forward=low.hi is not None and high.lo is not None and low.hi<=high.lo
  reverse=high.hi is not None and low.lo is not None and high.hi<=low.lo
  out=Bound(None,None,False);witness=None
  if forward or reverse:
   left,right=(low,high) if forward else (high,low)
   lengthlo=None if right.lo is None or left.hi is None else right.lo-left.hi
   lengthhi=None if right.hi is None or left.lo is None else right.hi-left.lo
   lengthpos=lengthlo is not None and lengthlo>0 or left.lo==left.hi==0 and right.strict_positive
   pos=lengthpos and inner.strict_positive
   # A continuous nonnegative function has positive integral if positive
   # at one interior point. This is essential for sigma' with zero endpoint
   # values; no sampled quadrature is used as an integral estimate.
   if not pos and inner.lo is not None and inner.lo>=0 and left.lo==left.hi and right.lo==right.hi and left.lo is not None and right.lo is not None and left.lo<right.lo:
    mid=(left.lo+right.lo)/2;point=dict(environment);point[binder]=bounded(mid)
    test=self.at(body,tuple(sorted(point.items())))
    if test.strict_positive:pos=True;witness=str(mid)
   integral_bound=product(inner,Bound(lengthlo,lengthhi,lengthpos))
   if inner.lo is not None and inner.lo>=0:integral_bound=Bound(Q(0),integral_bound.hi,pos)
   out=integral_bound if forward else product(bounded(Q(-1)),integral_bound)
  self.domains.append({'node':i,'operation':'definite_integral','binder':binder,'lower':lower,'upper':upper,'integrand':body,'allScopedPrimitiveDomainsChecked':True,'continuousOnFiniteClosedInterval':True,'orientationProved':forward or reverse,'strictPositive':out.strict_positive,'positiveInteriorRationalWitness':witness,'proved':True})
  return out

def ordinary_closure(get,roots,*,stop=()):
 seen=set();stack=list(roots);stops=set(stop)
 while stack:
  i=stack.pop()
  if i in seen:continue
  seen.add(i)
  if i in stops:continue
  n=get(i)
  if n['op']=='actual_expression_partial':continue
  stack.extend(argument_children(n))
 return seen

def bind_inputs(data,hashes,reg):
 leading,one,b,major,kernel=(data[k] for k in ['leading','orderone','orderone-binding','majorant','natural-binding'])
 require(leading['schema']=='MathScope.N6.ActualCompletedLeadingFrozenApplication/1' and leading['fixedDefinitionSHA256']==FIXED_PIN and leading['sourceHeaderSHA256']==HEADER,'Actual completed leading theorem')
 require(one['schema']=='MathScope.N6.ActualOrderOnePrimitiveCalculus/1' and one['actualAllOrderGlobalRegularityComposed'],'Actual six completed orderone profiles required')
 require(one['inputSHA256']['leading']==hashes['leading'] and one['inputSHA256']['binding']==hashes['orderone-binding'],'Same orderone/leading source chain')
 require(leading['inputSHA256']['stream-binding']==hashes['orderone-binding'],'Same genuine leading stream')
 require(b['schema']=='MathScope.N6.ActualOrderOnePrimitiveBinding/1' and b['sourceHeaderSHA256']==HEADER,'Same original orderone body bindings')
 require(b['bodyRoots']=={'F1':29290,'U1':29289,'v1':29440,'M1':29334,'average':29336,'Pi1':50558},'Changed six original bodies')
 require(one['provedActualOrderOneConclusions']=={'allSixOriginalProfilesCInfinity':True,'axisAndEtaEndpointOneSidedJets':True,'genuineLiteralPressurePrimitive':True,'allOriginalPi1JoinConstantsAndAllFixedMixedJets':True,'actualContinuousMomentSolvesForArbitraryFiniteDebts':True} and one['remainingAnalyticPremises']==[],'Incomplete six-profile source theorem')
 require(leading['provedActualCompletedLeading']['regularity']=='F0,U0,M0,V0/X are C-infinity for X>=0 and abs(eta)<1; all fixed one-sided eta jets extend to eta=+-1','Exact completed leading regularity scope')
 require(major['schema']=='MathScope.N6.ActualNaturalIndependentBanachMajorant/1' and major['fixedDefinitionSHA256']==FIXED_PIN,'Actual P0 analytic source theorem')
 require(kernel['schema']=='MathScope.N6.ActualNaturalOriginalKernelRebinding/1' and kernel['fixedDefinitionSHA256']==FIXED_PIN,'Actual core root rebinding')
 require(kernel['allActualCoreRootsEqual'] and kernel['fullActualPressureDefinitionEqual'] and kernel['sourceKernelBytesUnchanged'],'Actual P0 source root')
 require(major['sourceInputs']['actualPressureRoot']==reg['fixed']['core']['P0']==3451,'Same actual P0 root')
 require(major['actualPressureASTVerification']['pressurePrimitiveASTSHA256']==kernel['pressurePrimitiveASTSHA256']=='19a9eec59702f233d4744083aaef545f0d600d5549177ee8e8b3a143535c8152','Same exact 287 pressure primitive ASTs')
 roots=leading['actualCompletedLeadingRoots']
 require(roots['M']==b['actualLeadingRoots']['M'] and roots['U']==b['actualLeadingRoots']['U'] and roots['v']==b['actualLeadingRoots']['v'],'Same completed axial roots')
 for name,index in [('F',2),('U',3),('v',4)]:require(reg['expression'][index]['body']==roots[name],'Changed actual completed leading expression body')
 for name,index in [('F1',5),('U1',6),('v1',7),('M1',8),('average',9),('Pi1',10)]:require(reg['expression'][index]['body']==b['bodyRoots'][name],'Changed actual orderone expression body')
 for index in range(2,11):require(reg['expression'][index]['parameters']==[X,ETA] and reg['expression'][index]['unspecifiedOracle'] is False,'Changed original profile formal coordinates')
 return roots

def body_proof(get,reg,leading_roots):
 q=('coordinate',QVAR);x=('coordinate',X);eta=('coordinate',ETA);h=('parameter','h')
 A=e.add(e.rat(1,2),h);L=e.add(e.rat(1),e.mul(e.rat(-2),h,e.power(eta,2)))
 cp=reg['expression'][677];prove(cp['name']=='ActualCovarianceSensitivityTargetPrefix_Cp' and cp['parameters']==[X,ETA],'Actual finite Cp helper definition')
 normal=BodyNormal(get,reg,{3451:'P0',leading_roots['M']:'M0'})
 expectedCp=('integral',e.power(call(2,[('bound',0),eta]),2),e.rat(0),x)
 prove(normal.at(cp['body'])==expectedCp,'Leading Cp is not the exact finite integral of actual F0 squared')
 # Find every literal cutoff call in the normalized background, without
 # entering known native profile bodies and confusing formal coordinates.
 nodes=ordinary_closure(get,[reg['expression'][i]['body'] for i in range(681,686)],stop=[3451,leading_roots['M']])
 chi=[]
 for i in nodes:
  n=get(i)
  if n['op']=='actual_expression_partial' and n['args'][0]==680:chi.append((i,n))
 prove(chi and {tuple(n['args'][2]) for _,n in chi}=={(0,),(1,)},'Actual chi and differentiated chi both retained')
 sigmas={n['args'][1][0] for _,n in chi};prove(len(sigmas)==1,'Multiple unreviewed cutoff scales')
 sigma_id=next(iter(sigmas));sigma=get(sigma_id)
 prove(sigma['op']=='multiply' and len(sigma['args'])==2 and QVAR in sigma['args'],'Original scale times positive q')
 scale_id=next(i for i in sigma['args'] if i!=QVAR)
 constants=ConstantDomains(get,reg['fixed']['source']['parametersExactExpressions'])
 prove(constants.at(scale_id).strict_positive,'Original selector scale positivity/finiteness unresolved')
 normal=BodyNormal(get,reg,{3451:'P0',leading_roots['M']:'M0',scale_id:'fixedSelectorScale'})
 scale=normal.at(scale_id);sigmaN=e.mul(scale,q);chi0=call(680,[sigmaN]);extra=e.mul(sigmaN,call(680,[sigmaN],[1]));w=e.exp(e.mul(e.rat(2),h,e.log(q)))
 fg={i:call(i,[x,eta]) for i in range(2,11)}
 expect={681:e.add(fg[2],e.mul(w,chi0,fg[5])),682:e.add(fg[3],e.mul(w,chi0,fg[6])),
  683:e.add(normal.at(leading_roots['M']),e.mul(w,chi0,fg[8])),
  684:e.add(normal.at(3451),call(677,[x,eta]),e.mul(w,chi0,fg[10])),
  685:e.mul(e.power(('sqrt',e.mul(e.rat(2),x)),-1),e.add(e.mul(x,fg[4]),e.mul(w,e.add(e.mul(chi0,x,fg[7]),e.mul(e.rat(-2),eta,e.power(L,-1),extra,fg[8])))))}
 ledger=[]
 for index in range(681,686):
  d=reg['expression'][index]
  prove(d['parameters']==[QVAR,X,ETA] and d['unspecifiedOracle'] is False,'Changed normalized background function'+str(index))
  prove(all(v>=2 for v in d['derivativeLimits']),'Insufficient original normalized derivative limit')
  prove(normal.at(d['body'])==expect[index],'Changed complete normalized n1 body'+str(index))
  ledger.append({'definition':index,'body':d['body'],'definitionSHA256':sha(d),'literalCompleteFiniteN1FormulaCompared':True})
 # Exact cutoff body, including both flat endpoint branches.
 d=reg['expression'][680];cv=('coordinate',d['parameters'][0]);u=e.add(e.mul(e.rat(2),cv),e.rat(-1))
 aa=e.exp(e.mul(e.rat(-1),e.power(u,-1)));bb=e.exp(e.mul(e.rat(-1),e.power(e.add(e.rat(1),e.mul(e.rat(-1),u)),-1)))
 cutoff=('smooth_piecewise',(cv,e.rat(1,2),e.rat(1),e.rat(1),e.mul(bb,e.power(e.add(aa,bb),-1)),e.rat(0)))
 prove(normal.at(d['body'])==cutoff,'Changed original flat time cutoff body')
 # Actual chart and all multipliers are compared before invoking regularity.
 chart=e.check_chart(get,reg,e.Normal(get,reg));sr=e.Normal(get,reg).at(e.CHART_S)
 QQ=e.exp(e.mul(e.rat(-1),('coordinate',ELL),e.log(e.rat(2))))
 actualq=e.mul(QQ,sr);chartx=e.Normal(get,reg).at(e.CHART_X);charte=e.Normal(get,reg).at(e.CHART_ETA)
 epsilon=e.exp(e.mul(h,e.log(QQ)))
 factors={688:e.exp(e.mul(e.rat(-1),e.add(A,e.rat(1,2)),e.log(sr))),689:e.exp(e.mul(e.rat(-1),A,e.log(sr))),
  690:e.mul(epsilon,e.exp(e.mul(e.rat(-1,2),e.log(sr)))),691:e.exp(e.mul(e.rat(-2),A,e.log(sr)))}
 for index,helper in [(688,681),(689,682),(690,685),(691,684)]:
  d=reg['expression'][index]
  prove(d['parameters']==[R,Z,T,ELL] and d['unspecifiedOracle'] is False,'Changed physical background coordinates')
  prove(all(v>=2 for v in d['derivativeLimits']),'Insufficient original physical derivative limit')
  expected=e.mul(factors[index],call(helper,[actualq,chartx,charte]))
  prove(normal.at(d['body'])==expected,'Changed physical normalization/chart body'+str(index))
  ledger.append({'definition':index,'body':d['body'],'definitionSHA256':sha(d),'normalizedDefinition':helper,'literalActualChartAndMultiplierCompared':True})
 return {'allNormalizedAndPhysicalBodiesCompared':True,'bodyLineages':ledger,'actualChart':chart,
  'cutoff':{'definition':680,'body':reg['expression'][680]['body'],'actualFlatBodyCompared':True,
   'allOrdersAtEndpoints':'exp(-1/u) and exp(-1/(1-u)) have zero one-sided jets at u=0,1; the denominator is positive inside.'},
  'leadingCp':{'definition':677,'body':cp['body'],'exactFiniteIntegralOfSameF0Squared':True,'movingEndpointAndAxisCoveredByActualLeadingCInfinity':True},
  'selector':{'actualScaleRoot':scale_id,'finiteStrictlyPositive':True,'constantAncestorCount':len(constants.used),'constantSourceIDSetSHA256':sha(sorted(constants.used)),'allConstantPrimitiveDomains':constants.domains},
  'allRemainingTemplatePrimitiveDomains':[
   {'argument':'q=exp(-ell log2)*s','proof':'positive for every fixed finite original integer ell and s>0','operations':['log(q)','q^(2h)']},
   {'argument':'s','proof':'same original root in [1/2,2]','operations':['log(s)','real powers and inverse of s']},
   {'argument':'X=R^2/(2s)','proof':'R>0 and s>0','operations':['sqrt(2X)','inverse sqrt(2X)']},
   {'argument':'L=1-2h eta^2','proof':'|eta|<=1,0<h<1/16 imply L>7/8','operations':['inverse L']},
   {'argument':'chi interior denominators','proof':'u=2sigma-1 in (0,1); both exp terms positive; outer branches evaluated lazily','operations':['1/u','1/(1-u)','1/(exp(-1/u)+exp(-1/(1-u)))']}],
  'allBodyPrimitiveDomainsChecked':True,'finiteN1Only':True,'infiniteBackgroundEqualityClaimed':False}

def original_rows(compact,matrix,get,reg):
 allrows=[r for rows in compact['families'].values() for r in rows]
 require(len(allrows)==230 and sha(sorted((r['id'],r['sourceNode'],r['orderedSourceCoordinates']) for r in allrows))==ROWS_PIN,'Changed original230 ordered requests')
 require(sha(matrix['remainingJetIDs'])==ORDER_PIN and set(matrix['remainingJetIDs'])=={r['id'] for r in allrows},'Changed original row IDs/order')
 wanted=[]
 for index in [688,689,690,691]:
  rows=compact['families']['expression:'+str(index)]
  require(len(rows)==(2 if index==691 else 8),'Changed original background request family')
  for row in rows:
   node=get(row['sourceNode']);require(node=={'op':'actual_expression_partial','args':[index,[R,Z,T,ELL],[0,0,0,0]]},'Changed original background source call')
   require(sha(reg['expression'][index])==compact['definitions']['expression:'+str(index)]['sha256'],'Changed original background definition')
   ordered=row['orderedSourceCoordinates'];require(ordered and all(j in {R,Z,T,635044,635045,622806} for j in ordered),'Unreviewed requested direction')
   zeros=[j for j in ordered if j not in {R,Z,T,ELL}]
   wanted.append({'id':row['id'],'sourceNode':row['sourceNode'],'sourceCallSHA256':sha(node),'registry':'expression:'+str(index),
    'orderedSourceCoordinates':ordered,'partialTargetOrders':None if zeros else [ordered.count(j) for j in [R,Z,T,ELL]],
    'absentSourceCoordinates':zeros,'exactDerivativeValue':'0' if zeros else 'same original registered ordinary partial, with original one-sided T=0 convention'})
 require(len(wanted)==26 and len({r['id'] for r in wanted})==26 and sum(bool(r['absentSourceCoordinates']) for r in wanted)==9,'Changed original26/9-zero partition')
 return wanted

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 names=['source-db','stage3','header','compact','leading','orderone','orderone-binding','majorant','natural-binding','kernels','matrix','matrix-out','out']
 for n in names:ap.add_argument('--'+n,type=Path,required=True)
 a=ap.parse_args();sys.setrecursionlimit(20000)
 require(a.matrix.resolve() not in {a.out.resolve(),a.matrix_out.resolve()},'Historical matrix must remain immutable')
 require(digest(a.stage3.read_bytes())==STAGE3_PIN,'Changed inherited Stage3')
 sp=importlib.util.spec_from_file_location('bg26_stage3',a.stage3);v3=importlib.util.module_from_spec(sp);sp.loader.exec_module(v3)
 from header_binding import bind_header_to_gzip
 header,hbinding=bind_header_to_gzip(a.header.parent/'original-parent.ndjson.gz',a.header)
 require(hbinding['sourceHeaderRecordSHA256']==HEADER,'Changed original header record')
 reg=v3.registries(header);require(sha(reg['fixed'])==FIXED_PIN and sha(reg['expressionDefinitions'][21])==TARGET_PIN,'Changed actual fixed/g21 definitions')
 paths={n:getattr(a,n.replace('-','_')) for n in ['compact','leading','orderone','orderone-binding','majorant','natural-binding','matrix']}
 raw={n:p.read_bytes() for n,p in paths.items()};hashes={n:digest(b) for n,b in raw.items()};data={n:json.loads(b) for n,b in raw.items()}
 require(hashes['matrix']==MATRIX_PIN,'Use latest authenticated original continuation matrix')
 matrix=data['matrix'];require(matrix['after']=={'GlobalGuard':10,'CartesianJet':230,'PDE':1020,'total':1260} and len(matrix['originalUniversalRequirements'])==14,'Changed original residual contract')
 require(data['compact']['headerBinding']==hbinding and data['compact']['sourceHeaderSHA256']==HEADER,'Compact source header mismatch')
 source_files=[]
 for path,pin in FILES.items():
  b=(a.kernels/path).read_bytes();require(digest(b)==pin,'Changed original source contract '+path);source_files.append({'path':path,'sha256':pin,'bytes':len(b)})
 # These exact same-source contracts declare physical T and its endpoint
 # derivative convention. No new negative-time neighborhood is introduced.
 text=(a.kernels/'research-ide/mathscope-m3/navier/source-global-current.mjs').read_text(encoding='utf8')
 require("with T>=0, q=Q_ref*s>0 and 1/2<=s<=2" in text,'Changed original physical chart contract')
 text=(a.kernels/'research-ide/mathscope-m2/navier/actual-residual-order-induction-background.mjs').read_text(encoding='utf8')
 require("timeEndpoint:'T=0 one-sided'" in text,'Changed original endpoint convention')
 get=v3.Source(a.source_db);seen,defs,_=conservative_capture(get,reg,G_ROOT)
 require(len(seen)==136186 and len(defs)==84 and sha(sorted(seen))==e.CAPTURE_PIN,'Changed actual g21 capture')
 rows=original_rows(data['compact'],matrix,get,reg);roots=bind_inputs(data,hashes,reg);source_parameter_proof(reg['fixed'])
 gap=None;proof=None;gap_details=None
 try:proof=body_proof(get,reg,roots)
 except Gap as err:
  gap=str(err);gap_details=getattr(err,'primitive_frontier',None)
  if gap_details is not None:
   # Bounded read-only diagnostics. An unresolved ancestor remains a gap;
   # neither these nodes nor the frontier are a regularity certificate.
   todo=[gap_details['node']];cone={};seen=set()
   while todo and len(cone)<512:
    i=todo.pop()
    if i in seen:continue
    seen.add(i);n=get(i);cone[str(i)]=n;todo.extend(j for j in argument_children(n) if j not in seen)
   gap_details.update({'smallOriginalPrimitiveCone':cone,'unexpandedFrontier':sorted(set(todo)-seen),'coneComplete':not todo,
                       'diagnosticNodeLimit':512,'coneIsNotAProof':True})
 complete=gap is None;proved_ids=[r['id'] for r in rows] if complete else []
 for row in rows:row.update({'status':'PROVED' if complete else 'OPEN','actualFunctionDerivativeExistenceProved':complete,'originalOrderedRequestPreserved':True})
 remaining=[j for j in matrix['remainingJetIDs'] if j not in set(proved_ids)]
 require(len(remaining)==(204 if complete else 230),'Exact remaining row partition')
 newmatrix={'schema':'MathScope.N6.ActualBackground26RowContinuation/1','parentHistoricalMatrixSHA256':hashes['matrix'],
  'parentSHA256':matrix['parentSHA256'],'sourceScalarSHA256':matrix['sourceScalarSHA256'],'sourceStage4MatrixSHA256':matrix['sourceStage4MatrixSHA256'],
  'sourceHeaderBinding':hbinding,'originalHistoricalMatrixUntouched':True,'before':matrix['after'],
  'after':{'GlobalGuard':10,'CartesianJet':len(remaining),'PDE':1020,'total':1030+len(remaining)},
  'newDischarged':{'GlobalGuard':0,'CartesianJet':len(proved_ids),'PDE':0},'newDischargedGuardIDs':[],
  'newDischargedJetIDs':proved_ids,'remainingJetIDs':remaining,'remainingGlobalGuardIDs':matrix['remainingGlobalGuardIDs'],
  'originalUniversalRequirements':copy.deepcopy(matrix['originalUniversalRequirements']),
  'originalUniversalRequirementsUnchanged':True,'originalPDECountUnchanged':True,'allOriginal1266Closed':False,
  'wholeFunctionRegularityProved':False,'allBandsInfiniteBackgroundEqualityProved':False,'N601':matrix['N601'],'N602':matrix['N602'],'M3':matrix['M3']}
 result={'schema':'MathScope.N6.ActualBackground26JetRegularity/1','sourceHeaderBinding':hbinding,
  'fixedDefinitionSHA256':FIXED_PIN,'inputSHA256':hashes,'originalSourceFiles':source_files,'rowClosureMode':'ALL26_OR_NONE',
  'actualOriginalBackgroundRows':rows,'actualSourceBodyProof':proof,'unprovedBodyDomainGaps':[] if complete else [gap],
  'unprovedPrimitiveFrontier':gap_details,
  'originalPhysicalDomain':'Same admitted positive-radius chart, T_physical>=0, original s in [1/2,2] and frozen integer band; T=0 derivatives are one-sided as originally specified.',
  'provedOriginalBackgroundRowCount':len(proved_ids),'remainingOriginalJetCount':len(remaining),
  'wholeGOnJProved':False,'allInfiniteBandsEquivalenceClaimed':False,
  'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':len(proved_ids),'newOriginalPDETermsDischarged':0,
  'proof':'ACTUAL_BACKGROUND_26_JET_REGULARITY_KO.md'}
 require(a.matrix.read_bytes()==raw['matrix'],'Historical matrix changed during read-only proof')
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 a.matrix_out.write_text(json.dumps(newmatrix,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps({'actualBackgroundRowsProved':len(proved_ids),'remainingJets':len(remaining),'Guard':10,'PDE':1020,'bodyDomainGap':gap}))

if __name__=='__main__':main()
