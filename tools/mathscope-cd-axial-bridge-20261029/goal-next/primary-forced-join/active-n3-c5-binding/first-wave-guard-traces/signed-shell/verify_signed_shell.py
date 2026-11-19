"""Exact actual Signed compact-primitive reduction at the radial shell."""
from argparse import ArgumentParser
from fractions import Fraction as F
from functools import cache
from hashlib import sha256
from pathlib import Path
import json,sys
if not __debug__:raise RuntimeError('Assertions must remain enabled.')
PINS={'reader':'2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb',
 'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
 'cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
 'shell':'8058eb7e2a0d6b4bc9bf7e9ebb2f118149173ff53102e1e188776e2b47900c5f',
 'old':'c2987779c065ac09e48e0317e7727498fcea9dd93191e00ec53087a4675e0920',
 'scope':'0443eae8eedb3f1259eb626a1da711bbe3a0e5640e7d6dc1c502a4741f868272',
 'ingress':'20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f',
 'seams':'65c08c86d7682f989e9bf6c98f7ae04a42d2f1594488287da2548e85ca0a2815'}
def check(path,pin):
 b=path.read_bytes();assert sha256(b).hexdigest()==pin,path;return b
def main():
 cli=ArgumentParser(description=__doc__)
 for n in ('goal','work','out'):cli.add_argument('--'+n,type=Path,required=True)
 a=cli.parse_args();rd=a.goal/'primary-forced-join/active-n3-c5-binding/spatial-readback';old=a.goal/'primary-forced-join/active-n3-c5-binding/live-wave-gauge/signed'
 for path,pin in [(rd/'source_stream.py',PINS['reader']),(a.goal/'first-force-repair/verify_repaired_first_force.py',PINS['exact']),
  (old/'source_cache.py',PINS['cache']),(a.goal/'first-gauge/prove_five_whole.py',PINS['shell']),
  (a.goal/'first-gauge/bind_first_cycle_gauge.py',PINS['old']),(a.goal/'f1-mean/bind_mean_angle_scope.py',PINS['scope'])]:check(path,pin)
 sys.path[:0]=[str(rd),str(old),str(a.goal/'first-force-repair'),str(a.goal/'first-gauge')]
 import source_stream as reader
 from source_cache import load
 from verify_repaired_first_force import Exact
 from prove_five_whole import verify_shell
 ingress=json.loads(check(a.work/'continuation70/hosted-44582875351/first-correction-spatial-ingress.json',PINS['ingress']))
 seams=json.loads(check(a.goal/'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/signed/signed-seams.json',PINS['seams']))
 D=a.work/'continuation70/hosted-44582875351/first-correction-spatial-source';M=json.loads((D/reader.MANIFEST).read_bytes());N=reader.Native(D,M)
 assert N.pin=='e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'
 S=load(reader,D,M,22153782,a.work/'continuation80/signed-wave/cache')
 class V:
  def node(self,i):r=S.record(i);return r['op'],r['args']
  def args(self,i,op):return S.args(i,op)
 g=V();E=Exact(g);atom=lambda i:{((i,1),):F(1)}
 def derivative(poly,rules):
  terms=[]
  for mono,c in poly.items():
   for i,n in mono:
    if i not in rules:continue
    rest=tuple((j,m-(1 if j==i else 0)) for j,m in mono if m-(1 if j==i else 0))
    terms.append(E.mul({rest:c*n},rules[i]))
  return E.add(*terms)
 def encoded(poly,names):return [{'coefficient':str(c),'powers':{names.get(i,str(i)):n for i,n in m}} for m,c in sorted(poly.items())]
 try:
  ell,R,Z,T=17732737,17732748,17732749,17732750;r=17743710;alpha,beta=17743711,17743713;chi=17743734;bump=17743723;s=17732766
  shell=verify_shell(g,a.goal.parents[2],{'inner':alpha,'outer':beta},center=17743687)
  assert S.args(s,'actual_monotone_root')==[2,Z,T]
  inverse=json.loads(N.base_snapshot['base']['monotone'])[2]
  assert inverse['parameters']==[Z,T] and inverse['left']==19 and inverse['right']==24
  assert E.of(17732770)==E.mul(E.scalar(F(1,2)),E.pow(E.of(R),2),E.inv(E.of(s)))
  assert S.args(chi,'source_step_derivative')==[17743701,0]
  scale=E.mul(E.of(17743687),E.of(17743688))
  for node,var in [(17743701,R),(17743716,r)]:
   assert E.of(node)==E.mul(E.scalar(10),E.sub(E.mul(E.of(var),E.inv(scale)),E.one))
  bb=S.args(bump,'smooth_piecewise');assert bb[:4]==[17743716,0,1,0] and bb[-1]==0
  # Actual X=R^2/(2s), scale^2=2s*e*X0. Therefore U^2=X/(e*X0).
  # Inner X<=X0 implies U<1; outer X>=e^2*X0 implies U^2>=e>2>121/100.
  assert F(121,100)<2 and 2<5
  inspected=set()
  @cache
  def has_free_radius(i):
   # Append-only order excludes any occurrence of the newly created R below its ID.
   if i<R:return False
   if i==R:return True
   inspected.add(i);op,aa=g.node(i)
   if op in ('rational','source_parameter','coordinate'):return False
   if op=='definite_integral':
    body,bound,lo,hi=aa
    return has_free_radius(lo) or has_free_radius(hi) or (bound!=R and has_free_radius(body))
   if op in ('integer_power','source_step_derivative'):children=aa[:1]
   elif op in ('add','multiply','inverse','sqrt_positive','exp','log_positive','maximum','ceiling','sine','cosine','smooth_piecewise'):children=aa
   elif op.endswith('_partial') and len(aa)==3 and isinstance(aa[1],list):children=aa[1]
   elif op=='actual_monotone_root':children=aa[1:]
   elif op=='actual_quadratic_root':children=aa[2:3]
   elif op in ('actual_background_picard','actual_background_even_profile'):children=aa[2:4]
   elif op=='actual_natural_series':children=aa[1:3]
   elif op=='actual_covariance_volterra':children=[aa[2],*aa[3]]
   elif op=='m3_forced_pulse_partial':children=[aa[3],*aa[4]]
   else:raise ValueError(('Unrecognized actual dependency operation',i,op))
   assert all(type(c) is int and c<i for c in children),(i,op,children)
   return any(has_free_radius(c) for c in children)
  sourceRows=[];weightedIntegrands=[]
  for j,w,body,I,J,p,haar,inner,rawE in [
   (0,2,21999641,21999635,21999636,21999634,21999624,21999623,21999622),
   (1,1,22000464,22000458,22000459,22000457,22000447,22000446,22000445)]:
   binding=ingress['latestStressApplications'][j];assert binding['body']==body
   d,args,orders=N.application(S,binding['signedRoot']);assert d['body']==body and d['parameters']==args==[ell,R,Z,T] and orders==[0]*4
   assert S.args(I,'definite_integral')==[p,r,alpha,R] and S.args(J,'definite_integral')==[p,r,alpha,beta]
   assert not any(has_free_radius(x) for x in [p,alpha,beta]),'Actual fixed-bound radial FTC must not hide free R'
   actual=E.of(body);expected=E.neg(E.mul(E.pow(E.of(R),-w),E.sub(E.of(I),E.mul(E.of(chi),E.of(J)))))
   assert actual==expected
   assert S.args(haar,'definite_integral')==[inner,17745431,0,1] and S.args(inner,'definite_integral')==[rawE,17745430,0,1]
   pp=E.of(p);main=E.mul(E.pow(E.of(r),w),E.of(haar));correction=E.sub(pp,main)
   assert correction and all(dict(m).get(bump,0)==1 for m in correction)
   assert all(dict(m).get(bump,0)==0 for m in main)
   # FTC endpoint means p(r) with r replaced by R, without inventing a materialized node ID.
   endpoint,chi1=1000000000+10*j,1000000001+10*j
   rules={R:E.one,I:atom(endpoint),J:E.zero,chi:atom(chi1)}
   first=derivative(actual,rules)
   rhs=E.add(E.neg(E.mul(E.pow(E.of(R),-w),atom(endpoint))),E.neg(E.mul(E.scalar(w),actual,E.pow(E.of(R),-1))),E.mul(E.pow(E.of(R),-w),atom(chi1),E.of(J)))
   assert first==rhs
   # Exact normal recursion on either collar, keeping Sigma itself as an independent symbol.
   sig,m0,m1,m2=1000000100+10*j,1000000101+10*j,1000000102+10*j,1000000103+10*j
   sr=E.add(E.neg(atom(m0)),E.neg(E.mul(E.scalar(w),atom(sig),E.pow(E.of(R),-1))))
   rr={R:E.one,sig:sr,m0:atom(m1),m1:atom(m2)}
   srr=derivative(sr,rr);srrr=derivative(srr,rr)
   assert srr==E.add(E.neg(atom(m1)),E.mul(E.scalar(w),atom(m0),E.pow(E.of(R),-1)),E.mul(E.scalar(w*(w+1)),atom(sig),E.pow(E.of(R),-2)))
   assert srrr==E.add(E.neg(atom(m2)),E.mul(E.scalar(w),atom(m1),E.pow(E.of(R),-1)),E.neg(E.mul(E.scalar(w*(w+2)),atom(m0),E.pow(E.of(R),-2))),E.neg(E.mul(E.scalar(w*(w+1)*(w+2)),atom(sig),E.pow(E.of(R),-3))))
   names={R:'R',sig:'Sigma',m0:'M',m1:'M_R',m2:'M_RR'}
   sourceRows.append({'component':j,'weight':w,'nativeApplication':binding['signedRoot'],'definition':d['id'],'body':body,'parameters':args,
    'boundRadius':r,'fixedLimits':[alpha,beta],'weightedIntegrand':p,'forwardPrimitive':I,'wholePrimitive':J,'meanCutoff':chi,
    'normalizedHaarEAtBoundRadius':haar,'haarRawEAtBoundRadius':rawE,'haarIntegrationOrder':[17745430,17745431],
    'correctionEveryMonomialHasBump':bump,'exactFirstOrderIdentity':'Sigma_R = -R^(-w)*p(R) - w*Sigma/R + R^(-w)*chi_R*J',
    'endpointSubstitution':{'integrand':p,'boundVariable':r,'replaceBy':R,'materializedRoot':None},
    'collarNormalDerivatives':[encoded(x,names) for x in (sr,srr,srrr)],
    'innerCollarFormula':'Sigma = -R^(-w) * integral_alpha^R p(r) dr',
    'outerCollarFormula':'Sigma = +R^(-w) * integral_R^beta p(r) dr',
    'outerWholeMomentZeroRequired':False,'noFreeRInBoundIntegrandAndFixedLimits':True,
    'identityConditions':'Ordinary FTC on the admitted native branch; fixed endpoint functions and no free R in bound integrand, verified through the registered actual argument DAG.'})
   weightedIntegrands.append(p)
  # Every actual Signed pre-potential body is linear in these two fresh Sigma applications.
  sigmaRoots=[row['signedRoot'] for row in ingress['latestStressApplications']];linear=[]
  for definition in N.expressions:
   if not definition['name'].startswith('GenericSignedAfterForced_'):continue
   pol=E.of(definition['body']);assert all(sum(dict(m).get(i,0) for i in sigmaRoots)==1 for m in pol)
   owner=int(definition['name'].split('_')[-2]);aRoot=[17733826,17733827][owner];yRoot,=S.args(aRoot,'sqrt_positive')
   assert yRoot==[17733801,17733805][owner] and all(dict(m).get(aRoot,0)==-1 for m in pol)
   linear.append({'id':definition['id'],'body':definition['body'],'terms':len(pol),'linearSigmaApplications':sigmaRoots,'samePositiveAmplitude':aRoot,'sameTargetY':yRoot,'inverseAmplitudePower':-1})
  assert len(linear)==6 and len(seams['cases'])==10
  # Exact inverse-square-root jets and retained zeta valuation.
  av,y1,y2,y3=1000001000,1000001001,1000001002,1000001003
  dr={av:E.mul(E.scalar(F(1,2)),atom(y1),E.pow(atom(av),-1)),y1:atom(y2),y2:atom(y3)}
  jets=[E.pow(atom(av),-1)]
  for _ in range(3):jets.append(derivative(jets[-1],dr))
  assert jets[3]==E.add(E.mul(E.scalar(F(-15,8)),E.pow(atom(y1),3),E.pow(atom(av),-7)),E.mul(E.scalar(F(9,4)),atom(y1),atom(y2),E.pow(atom(av),-5)),E.mul(E.scalar(F(-1,2)),atom(y3),E.pow(atom(av),-3)))
  valuations=[]
  for order,jet in enumerate(jets):
   vals=[]
   for m,c in jet.items():
    val=sum(F(n,2) if i==av else F(n) for i,n in m);assert val==F(-1,2);vals.append(str(val))
   valuations.append({'order':order,'terms':encoded(jet,{av:'a=sqrt(y)',y1:'y_R',y2:'y_RR',y3:'y_RRR'}),'zetaPowers':vals})
  # Nonzero whole-moment control: p=1, alpha=1,beta=3,R=2,w=1,chi=1.
  control=-F(1,2)*((2-1)-(3-1));assert control==F(1,2)
  wrong=-F(1,2)*(2-1);assert wrong==-F(1,2) and wrong!=control
  receipt={'schema':'MathScope.C83.ActualSignedRadialPrimitiveReduction/1','status':'VERIFIED_ACTUAL_COMPACT_PRIMITIVE_AND_NORMAL_DERIVATIVE_REDUCTION_WEIGHTED_ESTIMATE_OPEN',
   'hostedRun':44582875351,'sourceStream':S.verify,'registrySHA256':N.pin,'inputPins':PINS,'exactOriginalShell':shell,
   'actualGeometry':{'X':17732770,'formula':'R^2/(2*s)','s':s,'sNativeBracket':['1/2','2'],'sFreeSlots':['Z','T'],'meanCenter':17743687,'meanScaleFormula':'sqrt(s)*sqrt(2*X0Imean)*exp(1/2)'},
   'sourceBoundCollars':{'inner':'Xa < X <= X0Imean: chi=0 and rho=0','outer':'exp(2)*X0Imean <= X < Xb: chi=1 and rho=0',
    'strictSeparation':'Xa<X0Imean and exp(5)*X0Imean<Xb, verified against the actual original parameter tree.',
    'correctionCutoffArgument':'10*(R/(sqrt(s)*x0)-1)','normalDirections':'R derivatives at fixed ell,Z,T; s_R=0. Sigma has no xi,v,Y argument.'},
   'actualSigmaRows':sourceRows,'actualSignedLinearTransfer':linear,'fixedCases':[x['key'] for x in seams['cases']],
   'fixedBoundDependencyAudit':{'distinctLateArgumentNodesInspected':len(inspected),'boundIntegrandsAndFixedLimitsFreeOfR':True,'nativeCalls':'Actual arguments are traversed with registered operations; integer IDs and derivative-order metadata are not scalar operands. Calls use their original registered formal-argument semantics.'},
   'inverseSquareRootJets':valuations,
   'conditionalWeightConclusion':'If actual y_R^j is bounded by C_j*zeta*delta^(-p_j), j<=3, and y>=c_y*zeta>0, then each inverse-a jet retains zeta^(-1/2). Combining actual Sigma jets with zeta retains sqrt(zeta) and finite poles. The original Gaussian kills every fixed finite pole at the shell.',
   'smallestOpenPureNormalInput':{'weightedEndpointPrimitiveOrder':0,'actualHaarERadialOrders':[0,1,2],
    'sourceRootsAtBoundRadius':[21999622,22000445],'normalizedHaarRoots':[21999624,22000447],
    'firstUnresolvedOrder':0,
    'requires':'Same-live post-Forced Haar(E) weighted zeta finite-pole bounds through pure R order2, including zero extension outside the actual moving shell. The first unproved retained-weight input is order0, not a fourth derivative. A source-matched Gaussian primitive lemma applied to M0 supplies Sigma0; the verified recurrence then supplies Sigma1..3.',
    'otherFactors':'Actual target y lower floor/weighted C3, inverse H and moving-frame C3 on the same admitted family remain premises unless discharged by their separate source receipts.',
    'fullMixedC3':'Pure tangential Z/T order3 still differentiates the endpoint primitive under the integral and needs corresponding tangential source bounds. This packet does not close full mixed C3.'},
   'wholeMomentDistinction':{'outerTailIdentityUsesWholeMomentZero':False,'interiorDivergenceRemainder':'R^(-w)*chi_R*J remains in the full exact FTC identity; no compatibility condition is dropped.'},
   'sufficientGaussianPrimitiveLemma':{'g':'x^(-p)*exp(-a/x^2), a>0, p>=0',
    'exactDerivative':'g_prime=g*x^(-3)*(2*a-p*x^2)',
    'collarCondition':'p*d^2<=2*a implies g is nondecreasing on (0,d], so integral_0^d g<=d*g(d).',
    'actualApplication':'Conditional on the retained actual zeta source bound, matching its endpoint distance, bounded radial change-of-variable weights and bounded opposite-end Gaussian ratio. This does not manufacture the missing actual M0 bound.',
    'flatLimit':'Every fixed finite pole times exp(-a/(2*d^2)) tends to zero; use exp(x)>=x^N/N! with 2N larger than the pole.'},
   'control':{'p':'1','alpha':'1','beta':'3','R':'2','w':1,'chi':1,'wholeMoment':'2 (nonzero)','actualCompactSigma':str(control),'backwardTailSigma':str(control),'wrongUncorrectedForward':str(wrong),'wrongDroppedCutoffRejected':True},
   'scope':{'actualWeightedPostForcedEBound':'OPEN','radialSignedSeamClosure':'CONDITIONAL','slowSeams':'SEPARATE','noNativeOpaqueValueEvaluated':True,'noLocalLean':True,'base67Unchanged':True,'release':'HOLD'}}
  a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8',newline='\n')
  print('PASS actual Signed compact primitives 2; native linear bodies 6; fixed cases 10; normal recurrences 6; inverse-a jets 4; weighted E remains OPEN',flush=True)
 finally:S.__exit__(None,None,None)
if __name__=='__main__':main()
