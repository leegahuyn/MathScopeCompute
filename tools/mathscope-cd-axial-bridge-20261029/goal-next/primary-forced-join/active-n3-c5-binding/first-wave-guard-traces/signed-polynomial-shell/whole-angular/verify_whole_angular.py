"""Exact source binding for the actual n=1 whole angular moment and I2 row.

No real integral is evaluated, and no moment-zero assertion is inferred from a
native function name. The conservative reduction records explicit analytic
premises; the I2 row is an exact algebraic/source binding only.
"""
from argparse import ArgumentParser
from fractions import Fraction as F
from hashlib import sha256
from pathlib import Path
import importlib.util,json,sys
if not __debug__:raise RuntimeError('Assertions must remain enabled.')
PINS={
 'reader':'2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb',
 'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
 'cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
 'git':'9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee',
 'C57Receipt':'3d4be5e7b50d1f1310ee2588f59cf055be87ddfaff60f75ca4cbf98c9371d4cb',
 'C57Verifier':'d0ab0fc1e94db9e618319c5af196f73e5eac7276e386771c7434aa68b65516d6'}
def check(p,h):
 b=p.read_bytes();assert sha256(b).hexdigest()==h,p;return b
def main():
 cli=ArgumentParser(description=__doc__)
 for n in ('goal','work','out'):cli.add_argument('--'+n,type=Path,required=True)
 a=cli.parse_args();base=a.goal/'primary-forced-join/active-n3-c5-binding';rd=base/'spatial-readback';support=base/'live-wave-gauge/signed';prior=a.goal/'axial-order-one-identity/whole-moments'
 for p,h in [(rd/'source_stream.py',PINS['reader']),(a.goal/'first-force-repair/verify_repaired_first_force.py',PINS['exact']),(support/'source_cache.py',PINS['cache']),(a.goal/'first-scale-closure/check_first_scale_closure.py',PINS['git']),(prior/'whole-moments.json',PINS['C57Receipt']),(prior/'check_order_one_whole_moments.mjs',PINS['C57Verifier'])]:check(p,h)
 previous=json.loads((prior/'whole-moments.json').read_bytes())
 assert previous['status']=='CONDITIONAL_ORDER_ONE_PHYSICAL_MOMENTS_BOUND_TO_ORIGINAL_SOURCE'
 sys.path[:0]=[str(rd),str(support),str(a.goal/'first-force-repair')]
 import source_stream as reader
 from source_cache import load
 from verify_repaired_first_force import Exact,Graph
 spec=importlib.util.spec_from_file_location('source_git',a.goal/'first-scale-closure/check_first_scale_closure.py');gr=importlib.util.module_from_spec(spec);spec.loader.exec_module(gr);gr.REFERENCE='059df9db3a188ce18f3c43a0dca3a92f2e02a4b2'
 source={};texts={}
 for name in ['actual-continuation-exact-stress.mjs','actual-continuation-exact-heat.mjs','actual-continuation-exact-inner.mjs','actual-global-conservative-moments.mjs','actual-continuation-exact-leading-conservation.mjs']:
  data=gr.git_blob(a.goal.parents[2],'research-ide/mathscope-m2/navier/'+name);source[name]=sha256(data).hexdigest();texts[name]=data.decode()
 assert 'const angular=G.add(...angularTerms,G.neg(angularViscosity))' in texts['actual-continuation-exact-stress.mjs']
 assert 'actualLeadingSubtractedAngularProof' in texts['actual-continuation-exact-leading-conservation.mjs']
 D=a.work/'continuation70/hosted-44582875351/first-correction-spatial-source';M=json.loads((D/reader.MANIFEST).read_bytes());N=reader.Native(D,M);S=load(reader,D,M,22153782,a.work/'continuation80/signed-wave/cache')
 class View:
  def node(self,i):r=S.record(i);return r['op'],r['args']
 E=Exact(View());core=json.loads(N.base_snapshot['base']['expression']);systems=json.loads(N.base_snapshot['base']['quadratic'])
 try:
  # JS JSON.stringify of exactly the unchanged ORIGINAL 117100-node prefix.
  prefix=sha256();prefix.update(b'[')
  for i in range(previous['originalPrefix']['nodes']):
   if i:prefix.update(b',')
   prefix.update(json.dumps(S.record(i),separators=(',',':'),ensure_ascii=False).encode())
  prefix.update(b']');assert prefix.hexdigest()==previous['originalPrefix']['sha256']
  # Same current integrand, independently alpha-renamed integral binders.
  assert core[0]['name']=='actual_n1_Ttheta_forward_integrand' and core[0]['parameters']==[4756,2] and core[0]['body']==117048
  assert S.args(117048,'multiply')==[4779,117046]
  assert E.of(4779)==E.mul(E.scalar(2),E.of(4756))
  assert S.args(117046,'smooth_piecewise')==[4756,28814,28826,0,117038,0]
  assert S.args(117068,'smooth_piecewise')==[4756,28814,28826,0,117054,0]
  integrals=[]
  for integral,call,bound,left,right in [(117051,117050,117049,28814,4756),(117062,117061,117060,4756,28826),(117072,117071,117070,28814,28826)]:
   assert S.args(integral,'definite_integral')==[call,bound,left,right]
   assert S.args(call,'actual_expression_partial')==[0,[bound,2],[0,0]]
   integrals.append({'root':integral,'call':call,'binder':bound,'left':left,'right':right,'sameNativeDefinition':0})
  assert E.of(117054)==E.neg(E.mul(E.of(117051),E.inv(E.of(4779))))
  assert E.of(117063)==E.mul(E.of(117062),E.inv(E.of(4779)))
  boundAudits=[]
  for root in [28814,28824,28826]:
   pending=[root];seen=set();ops=set()
   while pending:
    node=pending.pop()
    if node in seen:continue
    seen.add(node);op,args=View().node(node);ops.add(op)
    assert op in ('rational','source_parameter','variable','coordinate','add','multiply','maximum','inverse','integer_power','sqrt_positive','exp','log_positive','ceiling','definite_integral','source_step_derivative','smooth_piecewise'),(root,node,op)
    pending.extend(Graph.children(op,args))
   assert 2 not in seen and 4756 not in seen
   boundAudits.append({'root':root,'reachableNodes':len(seen),'operations':sorted(ops),'freeOfEtaAndX':True})
  # Native field aliases denote precisely the old bodies, not independent atoms.
  fields=[]
  for call,key,name,body in [(117100,2,'ActualFinalLeadingF',71959),(117101,3,'ActualFinalLeadingU',9236),(117670,5,'ActualFinalOrderOneF',29290),(117671,6,'ActualFinalOrderOneU',29289)]:
   assert S.args(call,'actual_expression_partial')==[key,[4756,2],[0,0]]
   definition=core[key];assert definition['name']==name and definition['parameters']==[4756,2] and definition['body']==body
   fields.append({'call':call,'definition':key,'name':name,'body':body,'formalArguments':[4756,2]})
  assert E.of(14246816)==E.mul(E.of(4779),E.of(117670))
  assert E.of(14246820)==E.mul(E.of(4779),E.add(E.mul(E.of(117101),E.of(117670)),E.mul(E.of(117100),E.of(117671))))
  momentRows=[]
  for order,definition,density,wholeDef,root,call,bound,name in [(2,31922,14246816,31965,14246833,14246832,14246830,'2X*F1'),(4,31924,14246820,31967,14246841,14246840,14246838,'2X*(U0*F1+F0*U1)')]:
   assert core[definition]['body']==density and core[definition]['parameters']==[4756,2]
   assert core[wholeDef]['body']==root and core[wholeDef]['parameters']==[2]
   assert S.args(root,'definite_integral')==[call,bound,0,28824]
   assert S.args(call,'actual_expression_partial')==[definition,[bound,2],[0,0]]
   momentRows.append({'row':order,'densityDefinition':definition,'densityBody':density,'wholeDefinition':wholeDef,'root':root,'binder':bound,'finiteEndpoints':[0,28824],'literalDensity':name,'wholeIntegralExtension':'Uses original support proof and C57, not a name containing Zero.'})
  # Literal selected heat/I2 system. Its first row is LINEAR, not an upper cap.
  Q=systems[2];assert Q['name']=='ActualSameN3C2I2Heat' and Q['linear'][0]==[8894,8946,8996] and Q['quadraticDiagonal'][0]==[0,0,0]
  assert Q['rhs'][0]==71708 and Q['scale']==8
  for j,root in enumerate([71717,71718,71719]):assert S.args(root,'actual_quadratic_root')==[2,j,2]
  assert S.args(71547,'multiply')==[20,71546] and S.rational(20)==-1
  assert S.args(71546,'definite_integral')==[71545,71419,0,1]
  assert S.args(71702,'multiply')==[71685,71701]
  scale=E.mul(E.of(8),E.of(71702));debt=E.of(71547)
  assert E.of(71708)==E.neg(E.mul(debt,E.inv(scale)))
  dot=E.add(*[E.mul(E.of(co),E.of(rt)) for co,rt in zip(Q['linear'][0],[71717,71718,71719])])
  rowResidual=E.sub(dot,E.of(71708));deltaI=E.mul(scale,dot)
  assert E.add(deltaI,debt)==E.mul(scale,rowResidual)
  # The complete leading field really includes both heat edit and I2 correction.
  assert S.args(71959,'smooth_piecewise')==[4756,3617,71673,4759,71958,71958]
  assert S.args(71958,'multiply')==[4781,71957] and S.args(71957,'add')==[71955,71956]
  assert S.args(71956,'add')==[71741,71907]
  assert S.args(71955,'smooth_piecewise')==[4756,71673,71673,0,71954,71954]
  assert S.args(71741,'smooth_piecewise')==[4756,71678,71679,0,71740,0]
  # Physical powers are checked in the ACTUAL symbolic h/first lambda namespace.
  h=E.of(9);one=E.one;half=E.scalar(F(1,2));A=E.add(half,h);DD=E.sub(half,h);b=E.neg(E.add(one,h));lam=E.mul(E.scalar(2),h)
  assert E.of(23)==A and E.of(22)==DD and E.of(25)==lam
  assert S.args(8,'source_parameter')==['lambda'] and S.args(9,'source_parameter')==['h']
  current=E.add(b,lam,E.scalar(2));flux=E.add(b,E.neg(A),lam,E.scalar(2));leading=E.add(b,E.scalar(2))
  assert current==E.add(one,h) and flux==half and leading==E.sub(one,h)
  assert E.sub(current,one)==h and E.sub(flux,DD)==h and E.sub(E.sub(leading,DD),DD)==h
  # Formal signed control. This is NOT a counterexample to the actual source.
  for hh in [F(1,100),F(1,4)]:
   assert F(0)-2*(1-hh)<0
   assert -2*(1-hh)==(-F(99,50) if hh==F(1,100) else -F(3,2))
  result={
   'schema':'MathScope.C86.ActualN1WholeAngularConservativeBinding/1',
   'status':'VERIFIED_SOURCE_BINDINGS_EXACT_I2_ROW_ALGEBRA_CONDITIONAL_ANALYTIC_WHOLE_ANGULAR_REDUCTION',
   'hostedRun':44582875351,'sourceStream':S.verify,'registrySHA256':N.pin,'inputPins':PINS,'sourceModules':source,
   'originalPrefix':{'nodes':117100,'sha256':prefix.hexdigest(),'C57ExactPrefixMatch':True},
   'actualAngular':{'X':4756,'eta':2,'rawDensity':117038,'supportedDensity':117046,'weightedDensity':117048,'nativeIntegrandDefinition':0,'wholeMoment':117072,'stress':117068,'forward':117054,'backward':117063,'sameNativeIntegrals':integrals,'endpointParameterAudits':boundAudits,'differenceIfFTCApplies':'Tforward-Tbackward=-Jtheta(eta)/(2X)','wholeMomentZeroProvedHere':False},
   'currentMomentSource':{'aliases':fields,'actualRows':momentRows,'reusedProof':{'receipt':'axial-order-one-identity/whole-moments/whole-moments.json','sha256':PINS['C57Receipt'],'checker':'axial-order-one-identity/whole-moments/check_order_one_whole_moments.mjs','checkerSHA256':PINS['C57Verifier'],'status':previous['status'],'scope':'Denotation/source rebind to exact original prefix. C57 analytic/native semantics premises remain; C57 checker not rerun by this bounded replay.'}},
   'I2SourceRowOnly':{'system':2,'name':Q['name'],'firstLinearRow':Q['linear'][0],'firstQuadraticRow':Q['quadraticDiagonal'][0],'rhs':71708,'selectedRoots':[71717,71718,71719],'heatAngularDebt':71547,'debtIntegral':71546,'debtIntegration':[71545,71419,0,1],'lambda':8,'angularNormalization':71702,'exactIdentity':'DeltaI+heatI=lambda*N0*(firstLinearRow(root)-rhs0)','identityExactArithmetic':True,'nativeRootEquationUsedAsPremise':False,'identificationWithRealCorrectionAndHeatIntegralsProvedHere':False,'completeLeadingInclusion':{'finalF0':71959,'heatEdit':71955,'I2Correction':71741,'preheat':71907}},
   'conservativeReduction':{'domain':'q>0, t<1, r>=0, |eta|<1; inward one-sided traces at eta=+-1 require separate uniform estimates','physicalRelations':['q-z^2*q^(2h)=1-t','eta=z/q^(1/2-h)','r^2=2qX'],'parameters':{'h':9,'A':23,'D':22,'lambda1Source':25,'lambda1':'2h','I2ScaleLambda':8,'I2ScaleDistinctFromLambda1':True},'b':'-1-h','L':'1-2h*eta^2','Tbar':'Tbar_a(f)=(-a*f+D*eta*f_eta)/L','Zbar':'Zbar_a(f)=(2*a*eta*f+(1-eta^2)*f_eta)/L','positiveQPowerConvention':'d_t(q^a f)=q^(a-1) Tbar_a f; d_z(q^a f)=q^(a-D) Zbar_a f','moments':{'m12':'integral_0^infinity 2X F1 dX','m14':'integral_0^infinity 2X(U0 F1+U1 F0)dX','I0':'integral_0^infinity 2X(F0-C X^(-1-h))dX as ONE convergent subtracted integral; C is eta independent'},'physicalExponents':{'current':'1+h','flux':'1/2','leadingSubtracted':'1-h','commonResidual':'h'},'identity':'Jtheta=Tbar_(1+h)m12+Zbar_(1/2)m14-Zbar_(1/2)Zbar_(1-h)I0','sufficientFunctionalIdentities':['m12 identically 0','m14 identically 0','I0 identically 0'],'I0DischargedHere':False},
   'rationalControl':{'premise':['m12=0','m14=0','I0=1'],'eta':0,'exactJ':'-2(1-h)','sampleRationalH':'1/100','sampleExactJ':'-99/50','scope':'Countermodel to dropping the independent leading subtracted moment, not an actual source counterexample.'},
   'analyticPremises':[
    'Literal conservative cylindrical angular identity for raw #117038, actual continuity, and source radial inner/exterior equations identify the supported #117046 with the full physical residual. No derivative of a discontinuous replacement is taken.',
    '0<h<1, L>0 on the closed eta interval, actual positive q and source root branch admitted.',
    'Axis parity and decay make the radial advective and viscous boundary fluxes vanish; no cutoff eta derivative or moving endpoint is omitted.',
    'C57 support extension and original native inverse semantics bind current full moments as eta-function identities, including their required derivatives.',
    'The fixed physical exterior subtraction P(r)=const*r^(-2A), independent z, is retained. Its subtracted leading integral and the derivatives needed twice in z have uniform locally integrable majorants.',
    'Use fixed radial endpoints 0,infinity and a common local exterior radius where the leading field is z independent; otherwise retain all moving-bound terms explicitly.',
    'At eta=+-1 use inward one-sided heat traces with uniform integrable majorants. No negative heat-time continuation is asserted.',
    'The source I2 first-row equation must be interpreted as real correction integral=-complete heat debt, and the original preheat subtracted moment must independently vanish. Parent replays actualLeadingSubtractedAngularProof separately.'
   ],
   'remaining':['Independent source/analytic I0 functional identity and derivative-integral justification; parent separately running the existing original leading-conservation proof.','Join source conservative residual identity and all endpoint hypotheses before promoting actual #117072=0.','No higher-order n>=2 or whole-field criterion is proved in this bounded n1 receipt.'],
   'scope':'Actual n1 whole angular source, current moments, heat/I2 first-row algebra, exact scale bookkeeping and a rational logical control. No numeric source cap or actual whole moment zero inferred.'}
  data=(json.dumps(result,indent=2,ensure_ascii=False)+'\n').encode();a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes(data)
  print('PASS C86 source prefix, actual m12/m14 bindings, I2 first-row algebra, exponents and rational control')
  print('receipt_sha256',sha256(data).hexdigest())
 finally:S.__exit__(None,None,None)
if __name__=='__main__':main()
