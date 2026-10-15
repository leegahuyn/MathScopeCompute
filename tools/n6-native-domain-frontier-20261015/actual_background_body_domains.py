"""Scoped actual-DAG primitive audit for the original nine background bodies.

Algebraic normalization is only used after recursively checking every actual
operand. It therefore cannot erase an undefined inverse or an unknown native.
Only same-source approved profile/P0/M0/selector boundaries are opaque.
"""
from dataclasses import dataclass
from fractions import Fraction as Q
from functools import lru_cache
import hashlib,json
import actual_eta_transport as e

class PrimitiveGap(ValueError):pass
def need(ok,message):
 if not ok:raise PrimitiveGap(message)
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
@dataclass(frozen=True)
class Box:
 lo:Q|None=None;hi:Q|None=None;positive:bool=False;negative:bool=False
 def __post_init__(self):
  object.__setattr__(self,'positive',self.positive or self.lo is not None and self.lo>0)
  object.__setattr__(self,'negative',self.negative or self.hi is not None and self.hi<0)
  need(self.lo is None or self.hi is None or self.lo<=self.hi,'Inconsistent primitive interval')
def point(v):return Box(Q(v),Q(v))
def product(a,b):
 if a.lo==a.hi==0 or b.lo==b.hi==0:return point(0)
 if all(v is not None for v in (a.lo,a.hi,b.lo,b.hi)):
  vv=[a.lo*b.lo,a.lo*b.hi,a.hi*b.lo,a.hi*b.hi];return Box(min(vv),max(vv),a.positive and b.positive or a.negative and b.negative,a.positive and b.negative or a.negative and b.positive)
 if a.lo is not None and a.lo>=0 and b.lo is not None and b.lo>=0:return Box(a.lo*b.lo,None,a.positive and b.positive)
 if a.hi is not None and a.hi<=0 and b.hi is not None and b.hi<=0:return Box(a.hi*b.hi,None,a.negative and b.negative)
 if a.lo==a.hi and a.lo is not None:
  if a.lo<0:return Box(None if b.hi is None else a.lo*b.hi,None if b.lo is None else a.lo*b.lo,b.negative,b.positive)
  return Box(None if b.lo is None else a.lo*b.lo,None if b.hi is None else a.lo*b.hi,b.positive,b.negative)
 if b.lo==b.hi and b.lo is not None:return product(b,a)
 return Box()

def audit_actual_body_domains(get,reg,leading_roots,scale_id,constants):
 """Return a complete witness, or raise at the first actual-domain frontier.

 `constants` is the hardened same-fixed-AST ConstantDomains instance. Its
 selector-root proof is mandatory; no positivity of a norm is assumed.
 """
 X,ETA,R,Z,T,ELL,QVAR=e.X,e.ETA,e.R,e.Z,e.TIME,622791,617438
 selected=constants.at(scale_id);need(selected.strict_positive,'Actual selector scale must be finite and strictly positive')
 need(leading_roots['M']==9239 and scale_id==617466,'Exact original M0/selector source boundary')
 approved={3451:'same actual P0 theorem',leading_roots['M']:'same actual M0 theorem',scale_id:'complete actual constant selector domain proof'}
 class ScopedNormal(e.Normal):
  @lru_cache(None)
  def at(self,i):
   if i in approved:return ('approved-source-boundary',i)
   return super().at(i)
 normal=ScopedNormal(get,reg);chart=e.check_chart(get,reg,normal)
 roots=[(i,reg['expression'][i]) for i in [681,682,683,684,685,688,689,690,691]]
 cutoff=reg['expression'][680];cp=reg['expression'][677];cv=cutoff['parameters'][0]
 need(cutoff['parameters']==[622831] and cp['parameters']==[X,ETA],'Exact original cutoff/Cp formal arguments')
 cp_node=get(cp['body']);need(cp_node['op']=='definite_integral' and len(cp_node['args'])==4,'Actual Cp integral source node');cp_binder=cp_node['args'][1]
 coordinate=('coordinate',cv);u=e.add(e.mul(e.rat(2),coordinate),e.rat(-1));one_minus=e.add(e.rat(1),e.mul(e.rat(-1),u))
 domain_bounds={X:Box(Q(0),None,True),ETA:Box(Q(-1),Q(1)),QVAR:Box(Q(0),None,True),R:Box(Q(0),None,True),Z:Box(),T:Box(Q(0),None),ELL:Box(),cv:Box()}
 def scope(parameters):
  need(all(j in domain_bounds for j in parameters),'Unknown definition formal parameter')
  return tuple(sorted((j,domain_bounds[j]) for j in parameters))
 visited=set();checks=[];native=[];root_hits=set();integrals=[];cutoffs=[];chart_body_checked=False
 def record(i,op,arg,proof):checks.append({'sourceNode':i,'operation':op,'actualArgument':arg,'proof':proof,'proved':True})
 @lru_cache(None)
 def at(i,environment=(),branch=''):
  nonlocal chart_body_checked
  visited.add(i);env=dict(environment);n=get(i);op,a=n['op'],n['args']
  if i in approved:
   need(i==scale_id or X in env and ETA in env,'Approved profile boundary outside its actual formal-coordinate scope')
   root_hits.add(i)
   return Box(Q(0),None,True) if i==scale_id else Box()
  if op=='rational':return point(Q(int(a[0]),int(a[1])))
  if op=='coordinate':need(i in env,'Unbound actual primitive coordinate '+str(i));return env[i]
  if op=='source_parameter':
   b=constants.ast(a[0]);return Box(b.lo,b.hi,b.strict_positive,b.strict_negative)
  if op=='actual_expression_partial':
   index,args,orders=a;d=reg['expression'][index]
   need(len(args)==len(orders)==len(d['parameters']) and all(type(k) is int and k>=0 for k in orders),'Actual native call arity/order')
   values=[at(j,environment,branch) for j in args]
   if index in range(2,11):
    allowed=args==[X,ETA] and orders==[0,0]
    if index==2 and orders==[0,0] and args==[cp_binder,ETA] and cp_binder in dict(environment):
     b=values[0];allowed=b.lo is not None and b.lo>=0
    need(allowed and d['parameters']==[X,ETA] and d.get('unspecifiedOracle') is False,'Unapproved actual profile native tuple '+str((i,a)))
   elif index==680:
    need(orders in ([0],[1]) and normal.at(args[0])==e.mul(normal.at(scale_id),('coordinate',QVAR)),'Unapproved actual cutoff native tuple')
   elif index in (681,682,683,684,685):
    need(args==[622830,e.CHART_X,e.CHART_ETA] and orders==[0,0,0],'Unapproved physical-to-normalized native tuple')
    need(values[0].positive and values[1].positive and values[2].lo is not None and values[2].lo>=-1 and values[2].hi is not None and values[2].hi<=1,'Actual native chart argument domains')
   elif index==677:need(args==[X,ETA] and orders==[0,0],'Unapproved actual Cp-prefix native tuple')
   else:raise PrimitiveGap('Unknown actual native expression '+str((i,index)))
   native.append({'sourceNode':i,'definition':index,'definitionSHA256':digest(d),'actualArguments':args,'actualOrders':orders,'sameApprovedContractAndTuple':True})
   return Box(Q(0),Q(1)) if index==680 and orders==[0] else Box()
  if op=='actual_monotone_root':
   need(i==e.CHART_S and a==[e.CHART_SYSTEM,Z,T],'Unknown actual native root')
   for j in a[1:]:at(j,environment,branch)
   d=reg['monotone'][e.CHART_SYSTEM]
   at(d['left'],(),branch);at(d['right'],(),branch)
   local={j:env[j] for j in d['parameters']};local[d['variable']]=Box(Q(1,2),Q(2));at(d['body'],tuple(sorted(local.items())),branch)
   chart_body_checked=True;native.append({'sourceNode':i,'definitionKind':'monotone','definition':e.CHART_SYSTEM,'definitionSHA256':digest(d),'actualArguments':[Z,T],'originalImageAndPositiveRootIntervalChecked':True})
   return Box(Q(1,2),Q(2),True)
  if op=='definite_integral':
   need(i==cp['body'] and a[2:]==[0,X] and get(a[1])['op']=='coordinate','Unapproved actual primitive integral')
   low,high=at(a[2],environment,branch),at(a[3],environment,branch);need(low.lo==low.hi==0 and high.positive,'Actual finite Cp interval')
   local={**dict(environment),a[1]:Box(Q(0),high.hi)};at(a[0],tuple(sorted(local.items())),branch)
   integrals.append({'sourceNode':i,'actualBody':a[0],'binder':a[1],'lower':a[2],'upper':a[3],'allActualIntegrandPrimitivesChecked':True,'finiteContinuousIntegralWithMovingUpperEndpoint':True})
   return Box(Q(0),None)
  if op=='smooth_piecewise':
   need(i==cutoff['body'] and len(a)==6 and a[0]==cv,'Only original source cutoff lazy branches approved')
   at(a[0],environment,branch);left,right=at(a[1],environment,branch),at(a[2],environment,branch)
   need(left.lo==left.hi==Q(1,2) and right.lo==right.hi==1,'Actual original cutoff thresholds')
   for j,b in [(3,Box(None,Q(1,2))),(4,Box(Q(1,2),Q(1))),(5,Box(Q(1),None))]:
    local={**dict(environment),cv:b};at(a[j],tuple(sorted(local.items())),'cutoffMiddle' if j==4 else'cutoffExterior')
   cutoffs.append({'sourceNode':i,'actualCondition':cv,'left':a[1],'right':a[2],'allThreeActualBranchesScopedAndChecked':True,'middleDomain':'1/2<t<1; u=2t-1>0 and 1-u>0','originalFlatEndpointExponentialProofRetained':True})
   return Box(Q(0),Q(1))
  need(op in {'add','multiply','inverse','sqrt_positive','log_positive','exp','integer_power'},'Unknown actual primitive '+str((i,op)))
  # Every operand is traversed before any rational cancellation is allowed.
  vv=[at(j,environment,branch) for j in (a[:1] if op in {'inverse','sqrt_positive','log_positive','exp','integer_power'} else a)]
  form=normal.at(i)
  if form==normal.at(e.CHART_ETA):return Box(Q(-1),Q(1))
  if branch=='cutoffMiddle' and form in (u,one_minus):return Box(Q(0),Q(1),True)
  if op=='add':
   lo=None if any(v.lo is None for v in vv) else sum(v.lo for v in vv);hi=None if any(v.hi is None for v in vv) else sum(v.hi for v in vv)
   return Box(lo,hi,lo==0 and all(v.lo is not None and v.lo>=0 for v in vv) and any(v.positive for v in vv))
  if op=='multiply':
   out=point(1)
   for v in vv:out=product(out,v)
   return out
  b=vv[0]
  if op=='inverse':
   need(b.positive or b.negative,'Undefined or unproved ACTUAL inverse '+str(i));record(i,op,a[0],'actual argument strictly nonzero in this scope')
   return Box(Q(0) if b.hi is None else 1/b.hi,None if b.lo in (None,0) else 1/b.lo,True) if b.positive else Box(None if b.hi in (None,0) else 1/b.hi,Q(0) if b.lo is None else 1/b.lo,False,True)
  if op=='log_positive':need(b.positive,'Undefined or unproved ACTUAL log '+str(i));record(i,op,a[0],'actual argument strictly positive');return Box()
  if op=='sqrt_positive':need(b.positive,'Non-smooth or undefined ACTUAL radical '+str(i));record(i,op,a[0],'actual argument strictly positive');return Box(Q(0),None,True)
  if op=='exp':return Box(Q(0),None,True)
  if op=='integer_power':
   k=a[1];need(type(k) is int and k>=0,'Unreviewed actual negative/noninteger power '+str(i))
   if k==0:return point(1)
   if b.lo is not None and b.hi is not None:
    vals=[b.lo**k,b.hi**k];lo=0 if k%2==0 and b.lo<=0<=b.hi else min(vals);return Box(Q(lo),max(vals),b.positive or k%2==0 and b.negative,b.negative and k%2==1)
   return Box(Q(0),None,b.positive or k%2==0 and b.negative) if b.lo is not None and b.lo>=0 or k%2==0 else Box()
  raise PrimitiveGap('Unreachable actual primitive operation')
 # Audit literal cutoff and Cp definitions as well as the nine bodies.
 at(cutoff['body'],scope(cutoff['parameters']));at(cp['body'],scope(cp['parameters']))
 for _,d in roots:at(d['body'],scope(d['parameters']))
 need(chart_body_checked and cutoffs and integrals,'Complete actual chart/cutoff/Cp primitive audits required')
 need(approved.keys()<=root_hits,'All three source boundary roots must actually occur')
 return {'schema':'MathScope.N6.ActualBackgroundPrimitiveClosure/1','completeActualClosure':True,
  'bodyRootsAndDefinitionHashes':[{'definition':i,'body':d['body'],'definitionSHA256':digest(d)} for i,d in roots],
  'perBodyParameterScopes':[{'definition':i,'parameters':d['parameters'],'initialEnvironmentCoordinates':sorted(d['parameters'])} for i,d in roots],
  'visitedSourceNodeCount':len(visited),'visitedSourceIDsSHA256':digest(sorted(visited)),
  'actualVisitedNodeRecordsSHA256':digest([(i,get(i)) for i in sorted(visited)]),
  'actualPrimitiveDomainChecks':checks,'nativeBoundaryCalls':native,
  'approvedBoundaryRoots':[{'sourceRoot':i,'contract':approved[i],'sourceNodeSHA256':digest(get(i))} for i in sorted(root_hits)],
  'actualCutoffBranchAudits':cutoffs,'actualCpIntegralAudits':integrals,'actualChartDefinitionSHA256':chart['definitionSHA256'],
  'allOperandsCheckedBeforeAlgebraicCancellation':True,'allActualNativeTuplesChecked':True,'allConditionalBranchesAuditedOnTheirOwnDomains':True,'everyDefinitionRestrictedToItsOwnFormalParameters':True,'everyActualFreeCoordinateBoundByDefinitionParameterScope':True,
  'unprovedFrontier':[],'scope':'Nine implemented finite normalized/physical bodies only; original image and one-sided physical T=0; no infinite background equality.'}
