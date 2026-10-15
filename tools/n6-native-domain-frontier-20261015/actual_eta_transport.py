"""Fresh-cache inventory and exact physical eta transport for the actual source.

No producer is run and no arbitrary negative physical time is certified.
The source cache must have been freshly prepared/authenticated by pinned Stage3.
"""
from __future__ import annotations
import argparse
from collections import Counter,defaultdict
from fractions import Fraction as Q
from functools import lru_cache
import hashlib,importlib.util,json
from pathlib import Path
from native_domain_extract import (argument_children,conservative_capture,native_definition,
 NATIVE,STAGE3_PIN,G_ROOT,require,sha)
from natural_domain_proof import (RAW_DIAGNOSTIC_PIN,FIXED_PIN,TARGET_PIN,
 CALL_INVENTORY_PIN,source_parameter_proof)

ETA=2; X=4756; R=622802; Z=622803; TIME=622804
CHART_SYSTEM=2; CHART_S=622820; CHART_X=622824; CHART_ETA=622829
REP_X=622807;REP_ETA=622808;REP_S=622809
CAPTURE_PIN='5d9e85d4b92e19947dc68a0f17b994ee8f95664440c962fbd0cb01b6cf49419a'

def rat(n,d=1):return ('q',str(Q(n,d)))
def parts(a):
 if a[0]=='q':return Q(a[1]),{}
 if a[0]=='mul':return Q(a[1]),dict(a[2])
 return Q(1),{a:1}
def mul(*values):
 c=Q(1);fs=Counter()
 for v in values:
  a,b=parts(v);c*=a;fs.update(b)
 if not c:return rat(0)
 fs={v:p for v,p in fs.items() if p}
 if not fs:return rat(c)
 if c==1 and len(fs)==1 and next(iter(fs.values()))==1:return next(iter(fs))
 return ('mul',str(c),tuple(sorted(fs.items(),key=repr)))
def add(*values):
 terms=defaultdict(Q)
 for v in values:
  vs=v[1] if v[0]=='add' else (v,)
  for z in vs:
   c,fs=parts(z);base=mul(*(('mul','1',((a,p),)) for a,p in fs.items()))
   terms[base]+=c
 out=[mul(rat(c),a) for a,c in terms.items() if c]
 if not out:return rat(0)
 return out[0] if len(out)==1 else ('add',tuple(sorted(out,key=repr)))
def exp(v):return rat(1) if v==rat(0) else ('exp',v)
def log(v):return rat(0) if v==rat(1) else ('log',v)
def power(v,n):
 require(type(n) is int,'Noninteger symbolic power')
 if v[0]=='exp':return exp(mul(rat(n),v[1]))
 c,fs=parts(v)
 require(c or n>=0,'Zero inverse in eta argument')
 return mul(rat(c**n),*(('mul','1',((z,p*n),)) for z,p in fs.items()))

class Normal:
 """Exact rational algebra; transcendental atoms never receive numeric values."""
 def __init__(self,get,registries):self.get=get;self.reg=registries
 @lru_cache(None)
 def at(self,i):
  n=self.get(i);op,a=n['op'],n['args']
  if op=='rational':return rat(int(a[0]),int(a[1]))
  if op=='coordinate':return ('coordinate',i)
  if op=='source_parameter':return ('parameter',a[0])
  if op=='add':return add(*(self.at(j) for j in a))
  if op=='multiply':return mul(*(self.at(j) for j in a))
  if op=='inverse':return power(self.at(a[0]),-1)
  if op=='integer_power':return power(self.at(a[0]),a[1])
  if op=='exp':return exp(self.at(a[0]))
  if op=='log_positive':return log(self.at(a[0]))
  if op=='sqrt_positive':return ('sqrt',self.at(a[0]))
  if op=='actual_monotone_root':
   d=self.reg['monotone'][a[0]]
   require(len(a)-1==len(d['parameters']),'Chart root arity mismatch')
   return ('monotone',a[0],tuple(self.at(j) for j in a[1:]))
  # Opaque atoms retain source identity and are not accepted as chart proofs.
  return ('unreviewed',op,i)

def classify_eta(normal,value):
 form=normal.at(value)
 if form==('coordinate',ETA):return {'kind':'formalEta','rangeEstablishedHere':False}
 if form==('coordinate',REP_ETA):return {'kind':'formalFrozenRepresentativeEta','rangeEstablishedHere':False}
 # Recognize every literal chart substitution by its actual monotone args.
 h=('parameter','h');D=add(rat(1,2),mul(rat(-1),h))
 candidates=[]
 def walk(t):
  if t[0]=='monotone' and t[1]==CHART_SYSTEM:candidates.append(t)
  if t[0]=='add':
   for x in t[1]:walk(x)
  elif t[0]=='mul':
   for x,_ in t[2]:walk(x)
  elif t[0] in {'exp','log','sqrt'}:walk(t[1])
 walk(form)
 for root in candidates:
  zz,tt=root[2]
  expected=mul(zz,exp(mul(rat(-1),D,log(root))))
  if form==expected:
   return {'kind':'actualSlowChartEta','rootSystem':CHART_SYSTEM,
    'normalizedZ':zz,'normalizedPhysicalT':tt,
    'exactIdentity':'eta^2=1-T_physical/s',
    'physicalTNonnegativeStillRequired':True,'rangeEstablishedOnOriginalPhysicalChart':True}
 return {'kind':'unresolvedEtaArgument','rangeEstablishedHere':False}

def semantic_free_coordinates(get,seen):
 """Syntactic parameters, with correct integral binding; no hidden body guesses."""
 free={}
 for i in sorted(seen):
  n=get(i);op,a=n['op'],n['args']
  if op=='coordinate':free[i]=frozenset([i]);continue
  children=argument_children(n)
  require(all(j<i and j in free for j in children),'Non-topological or uncaptured actual operand')
  if op=='definite_integral':
   body,binder,lo,hi=a
   free[i]=(free[body]-{binder})|free[lo]|free[hi]
  else:free[i]=frozenset().union(*(free[j] for j in children))
 return free

def expression_inventory(get,reg,seen,free,*,expected_count=855):
 rows=[];defs={};eta_roots=defaultdict(list);physical=[]
 for i in sorted(seen):
  n=get(i)
  if n['op']!='actual_expression_partial':continue
  index,args,orders=n['args'];require(type(index) is int and index>=0,'Expression registry index')
  d=reg['expression'][index];parameters=d['parameters']
  require(len(args)==len(orders)==len(parameters),'Actual expression arity/partial order mismatch')
  require(all(type(k) is int and k>=0 for k in orders),'Invalid actual partial multiindex')
  require(d['body'] in seen and free[d['body']]<=set(parameters),'Unbound expression-body coordinate')
  require(d.get('unspecifiedOracle') is False,'Unspecified expression oracle')
  row={'id':i,'nodeSHA256':sha(n),'definition':index,'argumentTuple':args,'partialOrders':orders}
  if ETA in parameters:
   at=parameters.index(ETA);row['etaArgument']=args[at];eta_roots[args[at]].append(i)
  if REP_ETA in parameters:
   at=parameters.index(REP_ETA);row['representativeEtaArgument']=args[at];eta_roots[args[at]].append(i)
   row['representativeArguments']={str(p):args[parameters.index(p)] for p in [REP_X,REP_ETA,REP_S] if p in parameters}
  if X in parameters:row['XArgument']=args[parameters.index(X)]
  if index in range(11):
   require(parameters==[X,ETA],'Changed original expression0..10 formal coordinates')
  if index in range(688,694):
   require(parameters[:3]==[R,Z,TIME],'Changed actual chart function coordinates')
   row['physicalArguments']={'R':args[0],'Z':args[1],'T':args[2]};physical.append(row)
  defs[index]={'name':d['name'],'parameters':parameters,'body':d['body'],'definitionSHA256':sha(d),
    'syntacticBodyFreeCoordinates':sorted(free[d['body']]),'noUnboundExpressionCoordinates':True}
  rows.append(row)
 require(len(rows)==expected_count,'Changed actual_expression_partial inventory')
 return rows,defs,eta_roots,physical

def check_chart(get,reg,normal):
 d=reg['monotone'][CHART_SYSTEM];h=('parameter','h');D=add(rat(1,2),mul(rat(-1),h))
 sv=('coordinate',d['variable']);zz=('coordinate',Z);tt=('coordinate',TIME)
 require(d['name']=='ActualCommonBandSlowInverse' and d['parameters']==[Z,TIME],'Different actual slow chart')
 expected=add(sv,mul(rat(-1),power(zz,2),exp(mul(rat(2),h,log(sv)))),mul(rat(-1),tt))
 require(normal.at(d['body'])==expected,'Changed literal slow-chart root equation')
 require(normal.at(d['left'])==rat(1,2) and normal.at(d['right'])==rat(2),'Changed actual slow-chart interval')
 require(normal.at(22)==D,'Changed D=1/2-h')
 require(get(CHART_S)=={'op':'actual_monotone_root','args':[CHART_SYSTEM,Z,TIME]},'Changed actual source chart root')
 require(normal.at(CHART_X)==mul(power(('coordinate',R),2),rat(1,2),power(normal.at(CHART_S),-1)),'Changed actual radial chart')
 result=classify_eta(normal,CHART_ETA);require(result['kind']=='actualSlowChartEta','Changed actual source eta formula')
 return {'definitionSHA256':sha(d),'definition':d,'actualNodes':{str(i):get(i) for i in [22,CHART_S,CHART_X,CHART_ETA]},
  'actualEquationAndCoordinatesCompared':True,'etaIdentity':'T_physical=s*(1-eta^2)',
  'positiveSInOriginalInterval':True,'physicalTNonnegativeImpliesAbsEtaAtMostOne':True,
  'strictPositiveTImpliesAbsEtaLessThanOne':True,'noNegativeTClaim':True}

def classify_physical_call(row,normal):
 args=row['argumentTuple'];h=('parameter','h');D=add(rat(1,2),mul(rat(-1),h))
 sr=('coordinate',REP_S);er=('coordinate',REP_ETA)
 if args[1:3]==[Z,TIME]:return 'sameActualReferenceZAndPhysicalT'
 if (normal.at(args[1])==mul(er,exp(mul(D,log(sr)))) and
     normal.at(args[2])==mul(sr,add(rat(1),mul(rat(-1),power(er,2))))):
  return 'exactFormalFrozenRepresentativeImage'
 return 'unresolvedPhysicalCallerSubstitution'

def negative_controls():
 # Actual transformed equation at s=1 has eta^2=Z^2, regardless of h.
 outside=Q(101,100);t=1-outside
 require(t==Q(-1,100) and outside>1,'Lost exact negative-time counterexample')
 class Fake:
  def __init__(self,f):self.f=f
  def at(self,_):return self.f
 sroot=('monotone',2,(('coordinate',Z),('coordinate',TIME)))
 D=add(rat(1,2),mul(rat(-1),('parameter','h')))
 good=mul(('coordinate',Z),exp(mul(rat(-1),D,log(sroot))))
 require(classify_eta(Fake(good),1)['kind']=='actualSlowChartEta','Valid exact chart not recognized')
 mutations=[mul(('coordinate',R),exp(mul(rat(-1),D,log(sroot)))),
  mul(('coordinate',Z),exp(mul(D,log(sroot)))),
  mul(('coordinate',Z),exp(mul(rat(-1),D,log(('monotone',1,sroot[2])))))]
 require(all(classify_eta(Fake(v),1)['kind']=='unresolvedEtaArgument' for v in mutations),'Bad chart eta accepted')
 return {'wrongAxialCoordinateRejected':True,'wrongEtaExponentSignRejected':True,
  'wrongNativeRootRegistryRejected':True,'exactNegativeTimeCounterexample':{'s':'1','Z_squared':str(outside),'T_physical':str(t),'eta_squared':str(outside)},
  'negativePhysicalTimeCannotBeDropped':True}

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 for n in ['source-db','stage3','header','diagnostics','out']:ap.add_argument('--'+n,type=Path,required=True)
 a=ap.parse_args();require(hashlib.sha256(a.stage3.read_bytes()).hexdigest()==STAGE3_PIN,'Changed Stage3')
 spec=importlib.util.spec_from_file_location('eta_transport_stage3',a.stage3);v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
 from header_binding import bind_header_to_gzip
 header,binding=bind_header_to_gzip(a.header.parent/'original-parent.ndjson.gz',a.header)
 raw=a.diagnostics.read_bytes();require(hashlib.sha256(raw).hexdigest()==RAW_DIAGNOSTIC_PIN,'Changed original diagnostics')
 diagnostics=json.loads(raw);require(diagnostics['headerBinding']==binding,'Changed authenticated header binding')
 reg=v3.registries(header);require(sha(reg['fixed'])==FIXED_PIN and sha(reg['expressionDefinitions'][21])==TARGET_PIN,'Changed original source definitions')
 get=v3.Source(a.source_db);seen,definitions,ops=conservative_capture(get,reg,G_ROOT)
 require(len(seen)==136186 and len(definitions)==84 and sha(sorted(seen))==CAPTURE_PIN,'Changed conservative actual source closure')
 natural=diagnostics['naturalCalls'];require(len(natural)==533 and sha([(c['id'],c['nodeSHA256']) for c in natural])==CALL_INVENTORY_PIN,'Changed all533 inventory')
 for c in natural:
  require(c['eta']==ETA and sha(get(c['id']))==c['nodeSHA256'],'Changed actual natural eta or source call')
 params=source_parameter_proof(reg['fixed']);normal=Normal(get,reg);chart=check_chart(get,reg,normal)
 free=semantic_free_coordinates(get,seen)
 rows,exprdefs,eta_roots,physical=expression_inventory(get,reg,seen,free)
 actual_monotone=[];native_eta=[];frozen_bindings=[]
 for i in sorted(seen):
  n=get(i);op,aa=n['op'],n['args']
  if op=='actual_monotone_root' and aa[0]==CHART_SYSTEM:
   actual_monotone.append({'id':i,'node':n,'nodeSHA256':sha(n),'argumentCoordinates':[sorted(free[j]) for j in aa[1:]]})
  if op in {'actual_natural_series','actual_background_even_profile','actual_background_picard','actual_quadratic_root','actual_monotone_root'}:
   key,d=native_definition(n,reg);e=None
   if op=='actual_natural_series':e=aa[2]
   elif op in {'actual_background_even_profile','actual_background_picard'}:e=aa[3]
   elif op=='actual_quadratic_root':e=aa[2]
   elif ETA in d.get('parameters',[]):e=aa[1+d['parameters'].index(ETA)]
   if e is not None:native_eta.append({'id':i,'operation':op,'definitionKey':key,'etaArgument':e,'nodeSHA256':sha(n)})
  if op in {'actual_covariance_volterra','m3_global_pulse_jet'}:
   key,d=native_definition(n,reg);parameters=d['parameters'];values=aa[3]
   require(len(parameters)==len(values),'Frozen covariance native parameter arity')
   if REP_ETA in parameters:
    frozen_bindings.append({'id':i,'operation':op,'definitionKey':key,'definitionSHA256':sha(d),
     'argumentTuple':values,'parameterTuple':parameters,
     'representativeArguments':{str(p):values[parameters.index(p)] for p in [REP_X,REP_ETA,REP_S]},
     'nodeSHA256':sha(n)})
    eta_roots[values[parameters.index(REP_ETA)]].append(i)
 eta_records=[];root_graph={}
 for root,users in sorted(eta_roots.items()):
  rec={'root':root,'node':get(root),'nodeSHA256':sha(get(root)),'actualExpressionUsers':users,
   'explicitArgumentFreeCoordinates':sorted(free[root]),**classify_eta(normal,root)}
  eta_records.append(rec)
  stack=[root]
  while stack:
   i=stack.pop()
   if str(i) in root_graph:continue
   n=get(i);root_graph[str(i)]=n
   # Preserve native boundary identity and explicit args; never inflate a
   # body by accidentally treating a registry index or derivative as an ID.
   stack.extend(argument_children(n))
  require(len(root_graph)<=12000,'Eta argument projection exceeds reviewed finite output budget; no truncation is permitted')
 require(R not in free[CHART_ETA] and free[CHART_ETA]==frozenset([Z,TIME]),'Pressure radial binder affects eta')
 direct=[]
 for r in physical:
  args=r['argumentTuple']
  r['physicalSubstitutionClassification']=classify_physical_call(r,normal)
  if args[1:3]==[Z,TIME]:
   direct.append({'call':r['id'],'definition':r['definition'],'RArgument':args[0],
    'RArgumentCoordinates':sorted(free[args[0]]),'ZArgument':Z,'TArgument':TIME,
    'actualEtaUnchangedUnderThisRadialSubstitution':True})
 controls=negative_controls()
 result={'schema':'MathScope.N6.ActualEtaCallerTransport/1','sourceHeaderBinding':binding,
  'sourceAuthentication':'Pinned fresh Stage3 preparation is inherited; this probe rebinds its header and replays the complete conservative closure without a producer.',
  'stage3ModuleSHA256':STAGE3_PIN,'inputDiagnosticsSHA256':RAW_DIAGNOSTIC_PIN,
  'fixedDefinitionSHA256':FIXED_PIN,'targetG21SHA256':TARGET_PIN,
  'capture':{'nodes':len(seen),'definitions':len(definitions),'sourceIDSetSHA256':CAPTURE_PIN},
  'all533NaturalSourceCallsCompared':True,'all533InternalEtaIsActualCoordinate2':True,
  'actualExpressionCallCount':len(rows),'actualExpressionInventorySHA256':sha(rows),
  'actualExpressionCalls':rows,'actualExpressionRegistryDefinitions':exprdefs,
  'uniqueEtaArgumentRoots':eta_records,'etaArgumentGraph':root_graph,
  'actualChart':chart,'actualChartRootCalls':actual_monotone,
  'actualFrozenNativeParameterTransfers':frozen_bindings,
  'allNativeEtaBearingCalls':native_eta,
  'actualPhysicalChartFunctionCalls':physical,
  'actualRSubstitutionsKeepingZAndT':direct,
  'sourceParameterCheck':params,'strictNegativeControls':controls,
  'provedActualDomainStatements':{
   'physicalChart':'For the unchanged actual root s in [1/2,2], T_physical>=0 implies |eta|<=1, and T_physical>0 implies |eta|<1.',
   'pressureRadius':'The exact actual eta622829 and native root622820 depend only on Z622803 and physical T622804. All listed R-only substitutions preserve eta, on the whole positive pressure radius interval.',
   'formalNativeInheritance':'All533 natural native calls use eta coordinate2; the inventory records the exact native argument transfers that must supply its real value.',
   'frozenImage':'An actual selected physical active representative has Trep>0 and srep in (1/2,2), hence its unchanged chart eta is strictly inside (-1,1). Actual representative argument/root bindings and lazy caller guards are inventoried rather than assumed globally.'},
  'remainingApplicationGates':[
   'Bind every frozen formal representative parameter to the exact selected active physical box before any singular local evaluation.',
   'Review every candidate relabel/native row and its lazy guard to transfer the original chart interval and physical T domain.',
   'Preserve the original physical T>=0 quantified domain; arbitrary negative T is a concrete counterexample.',
   'Complete all remaining primitive domains, all bands/higher prefixes, and the whole final g/J application.'],
  'all533ActualCallerDomainsProved':False,'wholeGOnJProved':False,
  'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
 print(json.dumps({'actualExpressionCalls':len(rows),'uniqueEtaRoots':len(eta_records),'actualChartRoots':len(actual_monotone),'all533ActualCallerDomainsProved':False,'newDischarged':0}))

if __name__=='__main__':main()
