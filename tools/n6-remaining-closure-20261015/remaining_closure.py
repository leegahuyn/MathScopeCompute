#!/usr/bin/env python3
"""Source-bound continuation from the 1,266-obligation Stage 4 ledger.

Proves only the six explicitly checked original coordinate/substitution guards
on the unchanged admitted annular chart. All other guard/jet/PDE IDs remain.
No compiler success, hash, or formal derivative is treated as analytic proof.
"""
from __future__ import annotations
import argparse
from collections import Counter,defaultdict
from fractions import Fraction as Q
from functools import lru_cache
import hashlib,importlib.util,json
from pathlib import Path

PARENT='7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
MATRIX4='8ac413724219323a8c422d011a3bdb3b38e0d9cd74dee8c308475e9b3bd2456b'
DIRECT4='339af4ca93008a0e79571fb20e816dd236ddc4417c236ed88b05b6cbbd67373b'
V3PIN='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f'
SCALAR='aa2da2a3ee1a12ffd9fc24d471271fc62f6b8723d75813a91eabb68713adc0a8'
TARGETS=(5,8,9,10,11,59)
PDE_PINS=('aca02b347723569cd214b96e7449eaa5b704c5f2b0c9a38f18df79562fb530c2','256ed9245d16fb571c2ab9e49fa821fb4cf81871875fa082bf65ab16b89a21cc','3e86c95b011033d64449d8f34ede0ded276af816cee978c7dd2b7e506ddb616e')
R,Z,T,N,Y0,Y1,BINDER=622802,622803,622804,622791,635044,635045,3615151
ZERO=('Q','0');ONE=('Q','1')

def require(ok,message):
 if not ok:raise ValueError(message)
def digest(raw):return hashlib.sha256(raw).hexdigest()
def canonical(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def sha(x):return digest(canonical(x))
def read(p):return json.loads(Path(p).read_text(encoding='utf-8'))
def write(p,x):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def load(p,name,pin):
 require(digest(Path(p).read_bytes())==pin,'Changed prerequisite implementation '+str(p))
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def add(values):
 terms=[]
 for x in values:terms.extend(x[1] if x[0]=='ADD' else (x,))
 constant=Q(0);co=defaultdict(Q)
 for x in terms:
  if x[0]=='Q':constant+=Q(x[1])
  elif x[0]=='MUL' and x[1][0][0]=='Q':
   b=x[1][1] if len(x[1])==2 else ('MUL',x[1][1:]);co[b]+=Q(x[1][0][1])
  else:co[x]+=1
 result=[]
 if constant:result.append(('Q',str(constant)))
 for x,c in co.items():
  if c:result.append(x if c==1 else ('MUL',(('Q',str(c)),x)))
 return ZERO if not result else result[0] if len(result)==1 else ('ADD',tuple(sorted(result,key=repr)))
def mul(values):
 terms=[];c=Q(1)
 for x in values:
  for t in x[1] if x[0]=='MUL' else (x,):
   if t[0]=='Q':c*=Q(t[1])
   else:terms.append(t)
 if not c:return ZERO
 terms=sorted(terms,key=repr)
 if c!=1 or not terms:terms.insert(0,('Q',str(c)))
 return terms[0] if len(terms)==1 else ('MUL',tuple(terms))

class PrimitiveCanonical:
 """Exact outer algebra. Required domains are collected before cancellation."""
 def __init__(self,g):self.g=g;self.domains=set();self.nodes=set()
 @lru_cache(maxsize=None)
 def at(self,i,env=()):
  mapping=dict(env)
  if i in mapping:return self.at(mapping[i],()) # simultaneous, not cascading
  self.nodes.add(i);n=self.g(i);op=n['op'];a=n['args'];C=lambda k:self.at(k,env)
  if op=='rational':return ('Q',str(Q(*map(int,a))))
  if op in ('coordinate','source_parameter'):return (op,i)
  if op=='add':return add([C(k) for k in a])
  if op=='multiply':return mul([C(k) for k in a])
  if op in ('integer_power','source_step_derivative'):return (op,C(a[0]),a[1])
  require(op in ('inverse','sqrt_positive','log_positive','exp','sine','cosine','ceiling'),'Unreviewed outer source operation '+op)
  if op in ('inverse','sqrt_positive','log_positive'):self.domains.add((i,op,a[0]))
  return (op,C(a[0]))

def integer_superset(x):
 """Conservative payload walk: even numeric metadata is included, never omitted.
 Local embedded graph indices create extra reads, not false absence proofs.
 """
 if type(x)is int:
  if 0<=x<3892594:yield x
 elif isinstance(x,(list,tuple)):
  for t in x:yield from integer_superset(t)
 elif isinstance(x,dict):
  for t in x.values():yield from integer_superset(t)
 elif isinstance(x,str) and x.startswith(('{','[')):
  try:d=json.loads(x)
  except ValueError:return
  yield from integer_superset(d)

class CaptureAudit:
 """Transitive absence proof, NOT analytic definedness of reached operators."""
 def __init__(self,g,reg,max_nodes=2000000):self.g=g;self.reg=reg;self.max_nodes=max_nodes
 def run(self,root,forbidden):
  seen=set();used={};stack=[root];coordinates=set();ops=Counter()
  def definition(key,d):
   if key in used:return
   used[key]=sha(d);stack.extend(integer_superset(d))
  while stack:
   i=stack.pop()
   if i in seen:continue
   require(len(seen)<self.max_nodes,'Explicit closure node budget')
   seen.add(i);n=self.g(i);op=n['op'];a=n['args'];ops[op]+=1
   if op=='coordinate':
    coordinates.add(i);require(i not in forbidden,'Hidden defining-body capture at source coordinate '+str(i));continue
   if op in ('rational','source_parameter'):continue
   if op in ('inverse','sqrt_positive','log_positive','exp','sine','cosine','integer_power','source_step_derivative','ceiling'):
    stack.append(a[0]);continue
   if op in ('add','multiply','maximum','smooth_piecewise','definite_integral'):stack.extend(a);continue
   if op=='actual_expression_partial':definition('expression:'+str(a[0]),self.reg['expression'][a[0]])
   elif op=='m3_aux_expression_partial':definition('expressionDefinitions:'+str(-1-a[0]),self.reg['expressionDefinitions'][-1-a[0]])
   elif op=='m3_aux_indexed_partial':definition('fieldDefinitions:'+str(a[0]),self.reg['fieldDefinitions'][a[0]])
   elif op=='m3_aux_inverse_partial':definition('inverseDefinitions:'+str(a[0]),self.reg['inverseDefinitions'][a[0]])
   elif op=='m3_global_indexed_partial':definition('m3GlobalFields:'+str(a[0]),self.reg['m3GlobalFields'][a[0]])
   elif op in ('actual_monotone_root','actual_quadratic_root'):
    key='monotone' if op=='actual_monotone_root' else 'quadratic';definition(key+':'+str(a[0]),self.reg[key][a[0]])
   elif op=='actual_natural_series':definition('fixed',self.reg['fixed'])
   elif op in ('actual_background_even_profile','actual_background_picard'):
    definition('picard:'+str(a[0]),self.reg['picard'][a[0]])
   elif op=='actual_covariance_volterra':
    ds=[d for d in self.reg['m3GlobalPulses'] if d['covariance']==a[0]]
    require(len(ds)==1,'Covariance system absent or ambiguous');definition('covariance:'+str(a[0]),ds[0])
   elif op=='m3_global_pulse_jet':definition('m3GlobalPulses:'+str(a[0]),self.reg['m3GlobalPulses'][a[0]])
   elif op in ('m3_coupled_expression_partial','m3_coupled_indexed_partial','m3_coupled_inverse_partial','m3_forced_expression_partial'):
    group={'m3_coupled_expression_partial':0,'m3_coupled_indexed_partial':1,'m3_coupled_inverse_partial':2,'m3_forced_expression_partial':4}[op]
    idx=int(a[0].split(':')[-1]);definition(f'definitions:{group}:{idx}',self.reg['definitions'][group][idx])
   elif op=='m3_forced_pulse_partial':definition('definitions:3:'+str(a[0]),self.reg['definitions'][3][a[0]])
   else:raise ValueError('Unreviewed closure operation '+op)
   stack.extend(integer_superset(a))
  return {'root':root,'forbiddenCoordinates':sorted(forbidden),'sourceNodes':len(seen),'sourceNodeIdSetSHA256':sha(sorted(seen)),
    'registryDefinitions':[{'key':k,'sha256':v} for k,v in sorted(used.items())],'definitions':len(used),'operations':dict(sorted(ops.items())),
    'highestReadNode':max(seen),'forbiddenCaptureAbsent':True,'analysis':'Conservative transitive dependency superset, including defining operands and encoded native definitions.',
    'allReachedFunctionsDefinedOrSmooth':False}

def exact_node(g,i,op,args):require(g(i)=={'op':op,'args':args},'Changed source node '+str(i))

def coordinate_proof(p,g,source_folder):
 require(sha(p)==SCALAR,'Changed source scalar circuit')
 # Original band threshold: ell0=6+ceil(max(8,...)); the window lower bound includes ell0.
 for i,op,a in [(117105,'rational',['6','1']),(4654,'rational',['8','1']),
  (617431,'maximum',[4654,617430,617357]),(617432,'ceiling',[617431]),
  (617433,'add',[117105,617432]),(622785,'maximum',[617433,622784]),
  (N,'coordinate',['N6_global_frozen_integer_band_N1$30434']),
  (635046,'add',[190,N]),(190,'rational',['-2','1']),
  (622794,'exp',[622793]),(622793,'multiply',[20,622792]),(622792,'multiply',[127,N]),
  (622824,'multiply',[622821,622823]),(622823,'inverse',[622822]),(622822,'multiply',[24,622820]),
  (622821,'integer_power',[R,2])]:exact_node(g,i,op,a)
 # Source contract texts are pinned byte-for-byte, not taken from a new caller predicate.
 names={'source-global-band.mjs':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60','source-global-current.mjs':'93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760'}
 contract={name:digest((source_folder/name).read_bytes()) for name in names}
 require(contract==names,'Changed authenticated source domain contracts')
 band=(source_folder/'source-global-band.mjs').read_text()
 require("slowPointDomain:'Original image s in[1/2,2], X in[Xa/2,2Xb], eta in[-1,1].'" in band,'Original annular chart changed')
 require('ell=window.ell,Q=window.Q' in band and 'ell0:family.constants.ell0' in band,'Source no longer uses original band window')
 # Positive-radius sheet is the original cylindrical coordinate convention; axis extension is separate.
 scalar={2:('coordinate',['m3_global_band_slow_R$30435',R]),16:('coordinate',['N6_global_frozen_integer_band_N1$30434',N]),
  31:('add',[16,30]),30:('rational',['-2','1']),19:('exp',[18]),54:('sqrt_positive',[19]),55:('multiply',[2,54]),
  44:('multiply',[25,43]),25:('exp',[24]),43:('exp',[42]),40:('ceiling',[39]),34:('log_positive',[31])}
 for i,(op,a) in scalar.items():require(p[i]=={'op':op,'args':a},'Changed original coordinate guard operand '+str(i))
 require(Q(6)+Q(8)-Q(2)==12,'Exact integer band margin changed')
 return {'sourceContracts':contract,'originalBandWindowLowerNode':622785,'originalEll0Node':617433,
  'integerBandLower':14,'Nminus2Lower':12,'bandProof':'N>=window.lower>=ell0=6+ceil(max(8,...))>=14, hence N-2>=12>0.',
  'radialProof':'On the ORIGINAL positive-radius annular chart, R=sqrt(2*s*X), 1/2<=s<=2, X>=Xa/2, Xa=4/Lambda>0. Thus R^2>=Xa/2=2/Lambda>0.',
  'QProof':'Q=exp(-N*log(2)) is finite and strictly positive at every fixed admissible integer N; no floating underflow replacement.',
  'physicalRadius':'sqrt(Q)*R>0','ciProof':'Q^(1+h)*exp(i0*log(4+sqrt(2)))>0 with i0=-ceil(-finite(N-2)).',
  'scope':'Unchanged admissible positive-radius reference/active annular charts. NOT all signed R or an axis extension certificate.',
  'newInputRestrictionAdded':False,'axisExtensionProved':False,'coordinatesAreFixedBandParametersDuringDifferentiation':True}

def phase_domain_proof(g, domains):
 expected={127:('log_positive',24),3622:('sqrt_positive',24),
  623015:('log_positive',300172),623016:('inverse',623015),
  624041:('log_positive',624040),624049:('sqrt_positive',622794),
  624059:('log_positive',624050),635049:('log_positive',635046),
  3615153:('log_positive',3615152)}
 require(domains=={(i,op,a) for i,(op,a) in expected.items()},'Unknown or missing phase domain prerequisite')
 for i,(op,a) in expected.items():exact_node(g,i,op,[a])
 for i,op,a in [(24,'rational',['2','1']),(20,'rational',['-1','1']),(474,'rational',['4','1']),
  (623065,'multiply',[20,3622]),(300172,'add',[474,3622]),(624040,'add',[474,623065]),
  (624050,'multiply',[R,624049]),(3615152,'multiply',[624049,BINDER]),
  (635046,'add',[190,N])]:exact_node(g,i,op,a)
 require(2<2**2 and 4-2==2,'Positive phase basis bound failed')
 return {'allRequiredPhaseDomainsAccountedFor':True,
  'positiveConstantFacts':['2>0','1<sqrt(2)<2','4-sqrt(2)>2','4+sqrt(2)>4','log(4+sqrt(2))>0'],
  'positiveCoordinateFacts':['N-2>=12','Q>0','sqrt(Q)>0','R>0','rho=R>0'],
  'noUndefinedPhaseCancelled':True}

def endpoint_proof(p,g,reg):
 require(p[1528]=={'op':'unresolved_opaque_substitution','args':[247,232,2]},'Changed target original substitution')
 require(p[247]=={'op':'actual_opaque_value','args':[3615202,'m3_aux_expression_partial']},'Source/scalar call mismatch')
 exact_node(g,3615202,'m3_aux_expression_partial',[-22,[N,BINDER,Z,T,3615158,3615160],[0]*6])
 exact_node(g,3615048,'m3_aux_expression_partial',[-22,[N,R,Z,T,Y0,Y1],[0]*6])
 d=reg['expressionDefinitions'][21]
 require(d['body']==3614891 and d['parameters']==[N,R,Z,T,Y0,Y1],'Changed complete_gr abstraction')
 cap=CaptureAudit(g,reg).run(d['body'],{BINDER})
 c=PrimitiveCanonical(g);env=((BINDER,R),)
 values=[c.at(i,env) for i in g(3615202)['args'][1]]
 original=[c.at(i) for i in g(3615048)['args'][1]]
 require(values==original,'Endpoint phase pullback fails to restore actual tuple')
 require(c.at(3615157,env)==ZERO,'First source phase difference not zero')
 require(c.at(3615159,env)==ZERO,'Second source phase difference not zero')
 domain_proof=phase_domain_proof(g,c.domains)
 return {'originalScalarSubstitution':1528,'sourceShiftedCall':3615202,'sourceUnshiftedCall':3615048,
  'rootDefinitionSHA256':sha(d),'captureAudit':cap,'restoredSourceArguments':[N,R,Z,T,Y0,Y1],
  'allSixArgumentsExactlyEqual':True,'derivativeOrders':[0]*6,
  'endpointIdentity':'g(rho,Z,T,Y+v*(Psi(rho)-Psi(R)))|_(rho=R)=g(R,Z,T,Y)',
  'primitiveDomainChecks':[{'source':i,'operation':op,'argument':a} for i,op,a in sorted(c.domains)],
  'domainReason':'All outer phase operations depend only on fixed N>2 and positive R/rho. At rho=R their arguments and domains agree exactly; no undefined term is cancelled.',
  'sameDefinednessDomainNotNewExistenceProof':True,'completeGrAnalyticRegularityProved':False,
  'primitiveNodesCompared':len(c.nodes),'phaseDomainProof':domain_proof}

def guard_rows(old,previous,coordinate,endpoint):
 rows=[]
 for r in old['cumulativeGlobalGuardRows']:
  if r['id'] not in previous['remainingGlobalGuardIDs']:continue
  index=int(r['id'].split('-')[2]);g=r['originalGuard'];rule=None
  if index in TARGETS:
   expected={5:{'kind':'POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN','operand':31,'operation':'log_positive'},
    8:{'kind':'POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN','operand':55,'operation':'log_positive'},
    9:{'kind':'NONZERO_ACTUAL_ARGUMENT','operand':55},10:{'kind':'NONZERO_ACTUAL_ARGUMENT','operand':44},
    11:{'kind':'NONZERO_ACTUAL_ARGUMENT','operand':2},59:{'kind':'ACTUAL_OPAQUE_SUBSTITUTION','root':247,'bound':232,'value':2}}[index]
   require(all(g[k]==v for k,v in expected.items()),'Changed original proposition')
   rule='EXACT_ENDPOINT_PULLBACK_SAME_DOMAIN' if index==59 else 'ORIGINAL_BAND_AND_POSITIVE_RADIAL_CHART'
  require(r['id'].endswith(sha(g)[:12]),'Original guard ID/statement changed')
  rows.append({'id':r['id'],'originalGuard':g,'status':'DISCHARGED_ORIGINAL_GUARD' if rule else 'OPEN',
   'rule':rule,'proofScope':coordinate['scope'],'remainingReason':None if rule else 'Actual complete_gr/P integrability and uniform parameter-derivative domination have not yet been established.'})
 require(len(rows)==16 and sum(r['rule'] is not None for r in rows)==6,'Original remaining partition changed')
 return rows

def jet_request_audit(p,prev,g,reg):
 """Audit every request; record conditional demands WITHOUT promoting them.
 Identity-map index addition is a derivative demand on C^k functions, not a
 proof of their existence. Original ordered requests are never merged/erased.
 """
 require(sha(p)==SCALAR,'Changed original ordered jet program')
 rows=[];classes=defaultdict(list);types=Counter();all_bounds=[]
 for ident in prev['remainingJetIDs']:
  i=int(ident.split(':')[-1]);n=p[i];require(n['op']=='unresolved_total_source_jet','Changed original jet request')
  operand,ordered=n['args'];base=p[operand];require(base['op']=='actual_opaque_value','Unreviewed original jet operand')
  source=base['args'][0];call=g(source);op=call['op'];a=call['args']
  if op=='actual_expression_partial':key='expression:'+str(a[0]);d=reg['expression'][a[0]]
  elif op=='m3_aux_expression_partial':key='expressionDefinitions:'+str(-1-a[0]);d=reg['expressionDefinitions'][-1-a[0]]
  elif op=='m3_aux_indexed_partial':key='fieldDefinitions:'+str(a[0]);d=reg['fieldDefinitions'][a[0]]
  elif op=='m3_aux_inverse_partial':key='inverseDefinitions:'+str(a[0]);d=reg['inverseDefinitions'][a[0]]
  else:raise ValueError('Unreviewed jet registry')
  directions=list(range(len(d['parameters']))) if op in ('actual_expression_partial','m3_aux_expression_partial') else d['directionParameterIndices']
  require(len(a[1])==len(d['parameters']) and len(a[2])==len(directions),'Changed jet arity')
  new=list(a[2]);coords=[p[v]['args'][1] for v in ordered];kind='NONTRIVIAL_PULLBACK';target=None
  if a[1]==d['parameters']:
   kind='UNPROVED_EARLIER_DERIVATIVE_BEFORE_ABSENT_DIRECTION'
   if all(v in d['parameters'] and d['parameters'].index(v) in directions for v in coords):
    kind='CONDITIONAL_NATIVE_HIGHER_PARTIAL'
    for v in coords:new[directions.index(d['parameters'].index(v))]+=1
    target={'registry':key,'arguments':a[1],'orders':new};classes[sha(target)].append(ident)
  types[kind]+=1
  rows.append({'id':ident,'originalNode':n,'sourceNode':source,'sourceCallSHA256':sha(call),'definitionSHA256':sha(d),
   'orderedSourceCoordinates':coords,'classification':kind,'conditionalTarget':target,'status':'OPEN',
   'differentiabilityAssumedForTargetOnly':True,'higherPartialExistenceProved':False,'conditionalCommutationIsNotDischarge':True})
 require(len(rows)==230,'Original jet count changed')
 return {'rows':rows,'counts':dict(types),'conditionalIdentityClasses':len(classes),'conditionalClassMembership':dict(classes),
  'originalOrderedRequestsPreserved':True,'newDischarged':0,'remaining':230}

def pde_dependency_audit(prepared,g,reg):
 rows=[];totals=Counter()
 for component,count in enumerate((169,197,654)):
  path=prepared/f'cartesian/rational/pde_component_{component}.json'
  require(digest(path.read_bytes())==PDE_PINS[component],'Changed original PDE coefficients/source factors')
  d=read(path)
  require(len(d['reducedNumeratorTerms'])==count,'Changed original PDE inventory')
  poly={};terms=[];coupled=set();term_registry=Counter()
  for k,t in enumerate(d['reducedNumeratorTerms']):
   coefficient=Q(t['coefficient']);factors=tuple(sorted((f['sourceNode'],f['power']) for f in t['factors']))
   require(coefficient!=0 and all(type(e)is int and e>0 for _,e in factors),'Malformed original monomial')
   for f in t['factors']:
    n=g(f['sourceNode']);require(n['op']==f['operation'],'Changed actual PDE factor operation')
    if n['op']=='m3_coupled_indexed_partial':coupled.add((f['sourceNode'],n['args'][0]))
    if f.get('definitionKey'):term_registry[f['definitionKey']]+=1
   poly[factors]=poly.get(factors,Q(0))+coefficient
   terms.append({'id':f'N6-PDE-{component}-{k:04d}','coefficient':str(coefficient),'sourceFactors':factors,'sourceTermSHA256':sha(t),'status':'OPEN'})
  require(sum(c!=0 for c in poly.values())==count,'New cancellation needs explicit term transport review')
  rows.append({'component':component,'inputSHA256':digest(path.read_bytes()),'rows':terms,'sourceRegistryOccurrences':dict(term_registry),
   'coupledResidualOperands':[{'source':i,'registry':key} for i,key in sorted(coupled)],
   'formalTermRecollectionComplete':True,'newDischarged':0,'analyticNonzeroCounterexample':False,
   'requiredNextProof':'Equality of the actual coupled indexed residual with the complete differential operator on the original fields; cannot assign an opaque field an arbitrary value.'})
 return {'components':rows,'attempted':1020,'newDischarged':0,'remaining':1020,'newIndependentFullCartesianPDEEvaluation':False}

def run(source_folder,prepared,prior,stage4_path,stage3_path,bump_path,out):
 out.mkdir(parents=True,exist_ok=True)
 from header_binding import bind_header_to_gzip
 authenticated_header,header_binding=bind_header_to_gzip(source_folder/'original-parent.ndjson.gz',source_folder/'header.json')
 previous=load(stage4_path,'original_stage4',DIRECT4);v3=load(stage3_path,'original_stage3',V3PIN)
 result4=previous.run(source_folder,prepared,prior,stage3_path,bump_path,out/'prerequisite-replay')
 matrix4=out/'prerequisite-replay/OBLIGATION_MATRIX_STAGE4.json'
 require(digest(matrix4.read_bytes())==MATRIX4,'Replayed Stage4 differs from fixed 1266 baseline')
 cp=read(prepared/'cartesian/checkpoints/cartesian-source-checkpoint.json');p=cp['cartesian']['scalarProgram'];old=read(prior/'OBLIGATION_MATRIX.json')
 g=v3.Source(out/'prerequisite-replay/stage3-replay/source-cache.sqlite');reg=v3.registries(authenticated_header)
 _,header_after=bind_header_to_gzip(source_folder/'original-parent.ndjson.gz',source_folder/'header.json')
 require(header_after==header_binding,'Source header changed during inherited replay')
 header_binding['fullGraphAuthenticatedByInheritedReplay']=True
 write(out/'SOURCE_HEADER_BINDING.json',header_binding)
 coordinate=coordinate_proof(p,g,source_folder/'source');endpoint=endpoint_proof(p,g,reg)
 guards=guard_rows(old,result4,coordinate,endpoint)
 from conditional_pressure import verify as verify_pressure
 pressure=verify_pressure(p,g,reg,guards)
 write(out/'CONDITIONAL_PRESSURE_LEMMA.json',pressure)
 jets=jet_request_audit(p,result4,g,reg);pdes=pde_dependency_audit(prepared,g,reg)
 closed=[r['id'] for r in guards if r['rule']];remaining=[r['id'] for r in guards if not r['rule']]
 require(set(closed).isdisjoint(remaining) and set(closed+remaining)==set(result4['remainingGlobalGuardIDs']),'Dropped or double-counted original guard')
 result={'schema':'MathScope.N6.Remaining1266Continuation/1','parentSHA256':PARENT,'sourceScalarSHA256':SCALAR,'sourceStage4MatrixSHA256':MATRIX4,
  'before':{'GlobalGuard':16,'CartesianJet':230,'PDE':1020,'total':1266},
  'after':{'GlobalGuard':len(remaining),'CartesianJet':230,'PDE':1020,'total':len(remaining)+1250},
  'newDischarged':{'GlobalGuard':len(closed),'CartesianJet':0,'PDE':0},'newDischargedGuardIDs':closed,
  'remainingGlobalGuardIDs':remaining,'remainingJetIDs':result4['remainingJetIDs'],
  'coordinateProof':coordinate,'endpointProof':endpoint,'priorClosedGuardIDs':result4['dischargedOriginalGuardIDs'],
  'allOriginal1266Closed':False,'wholeFunctionRegularityProved':False,'axisExtensionProved':False,
  'originalUniversalRequirements':result4['originalUniversalRequirements'],'proofBasis':'Written analytic proof plus exact source graph/phase/capture audit; not Lean.',
  'sourceHeaderBinding':header_binding,
  'N601':'OPEN','N602':'PARTIAL','M3':'56/64','sourceProducerModified':False,'historicalMatrixModified':False,
  'originalProgressModified':False,'publicWebsiteModified':False}
 write(out/'GUARD_DISCHARGES.json',{'rows':guards});write(out/'JET_REQUEST_AUDIT.json',jets);write(out/'PDE_DEPENDENCY_AUDIT.json',pdes)
 write(out/'OBLIGATION_MATRIX_CONTINUATION.json',result)
 write(out/'OBLIGATION_MATRIX.json',result)
 write(out/'AUDIT_SUMMARY.json',{'before':result['before'],'after':result['after'],'newDischarged':result['newDischarged'],
   'endpointCaptureNodes':endpoint['captureAudit']['sourceNodes'],'endpointCaptureDefinitions':endpoint['captureAudit']['definitions'],
   'allSixEndpointArgumentsRestored':True,'jetClassCounts':jets['counts'],'conditionalNativeClasses':jets['conditionalIdentityClasses'],
   'allOriginal1266Closed':False,'remainingTenGuardsShareOneSourceRegularityLemma':True,'conditionalPressureTransportSourceBound':True,'noUnsupportedIdentityPromoted':True})
 return result

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 for name in ('source','prepared','prior','stage4','stage3','bump','out'):p.add_argument('--'+name,type=Path,required=True)
 a=p.parse_args()
 try:r=run(a.source,a.prepared,a.prior,a.stage4,a.stage3,a.bump,a.out)
 except (ValueError,KeyError,OSError,IndexError) as e:p.exit(2,str(e)+'\n')
 print(json.dumps({'before':r['before'],'after':r['after'],'discharged':r['newDischarged']}))
