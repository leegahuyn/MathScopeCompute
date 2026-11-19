"""Actual n=1 outer theta residual: source Gaussian coefficient and FTC bound."""
from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as F
from hashlib import sha256
from math import factorial
from pathlib import Path
import importlib.util,json,sys
if not __debug__:raise RuntimeError('Assertions must remain enabled.')
PINS={'reader':'2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb','exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75','cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f','git':'9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee'}
def check(p,h):
 b=p.read_bytes();assert sha256(b).hexdigest()==h,p;return b
def main():
 cli=ArgumentParser(description=__doc__)
 for n in ('goal','work','out'):cli.add_argument('--'+n,type=Path,required=True)
 a=cli.parse_args();base=a.goal/'primary-forced-join/active-n3-c5-binding';rd=base/'spatial-readback';support=base/'live-wave-gauge/signed'
 for p,h in [(rd/'source_stream.py',PINS['reader']),(a.goal/'first-force-repair/verify_repaired_first_force.py',PINS['exact']),(support/'source_cache.py',PINS['cache']),(a.goal/'first-scale-closure/check_first_scale_closure.py',PINS['git'])]:check(p,h)
 sys.path[:0]=[str(rd),str(support),str(a.goal/'first-force-repair')]
 import source_stream as reader
 from source_cache import load
 from verify_repaired_first_force import Exact
 sp=importlib.util.spec_from_file_location('source_git',a.goal/'first-scale-closure/check_first_scale_closure.py');gr=importlib.util.module_from_spec(sp);sp.loader.exec_module(gr);gr.REFERENCE='059df9db3a188ce18f3c43a0dca3a92f2e02a4b2'
 source={};texts={}
 for name in ['actual-order-one-weighted-stress.mjs','actual-continuation-exact-stress.mjs','actual-continuation-exact-heat.mjs','actual-background-residual-bridge.mjs']:
  b=gr.git_blob(a.goal.parents[2],'research-ide/mathscope-m2/navier/'+name);source[name]=sha256(b).hexdigest();texts[name]=b.decode()
 assert "totalStressMoments:'Original (5.19)-(5.21)" in texts['actual-order-one-weighted-stress.mjs']
 D=a.work/'continuation70/hosted-44582875351/first-correction-spatial-source';M=json.loads((D/reader.MANIFEST).read_bytes());N=reader.Native(D,M);S=load(reader,D,M,22153782,a.work/'continuation80/signed-wave/cache')
 class View:
  def node(self,i):r=S.record(i);return r['op'],r['args']
 E=Exact(View());core=json.loads(N.base_snapshot['base']['expression'])
 def sqrt_bound_body(root):
  add,=S.args(root,'sqrt_positive');terms=S.args(add,'add');assert 1 in terms and len(terms)==2
  square=next(i for i in terms if i!=1);call,degree=S.args(square,'integer_power');assert degree==2;return call
 def native(call,orders,actual=None):
  key,args,oo=S.args(call,'actual_expression_partial');assert key==32006 and oo==orders
  if actual is not None:assert args==actual
  return args
 try:
  # Source summation is in canonical add order [3,2,1], not ascending coefficient order.
  orderRows=[]
  for n,power in [(3,17743840),(2,17743846),(1,17743852)]:
   exponent,=S.args(power,'exp');assert E.of(exponent)==E.mul(E.scalar(2*n),E.of(9),E.of(17735156))
   orderRows.append({'powerRoot':power,'actualOrder':n,'exactExponent':'2*'+str(n)+'*h*log(qActual)'})
  assert S.args(117068,'smooth_piecewise')==[4756,28814,28826,0,117054,0]
  assert core[0]['name']=='actual_n1_Ttheta_forward_integrand' and core[0]['parameters']==[4756,2] and core[0]['body']==117048
  assert S.args(117048,'multiply')==[4779,117046] and S.args(117046,'smooth_piecewise')==[4756,28814,28826,0,117038,0]
  assert E.of(4779)==E.mul(E.scalar(2),E.of(4756))
  for integral,call,bound,left,right in [(117051,117050,117049,28814,4756),(117062,117061,117060,4756,28826),(117072,117071,117070,28814,28826)]:
   assert S.args(integral,'definite_integral')==[call,bound,left,right]
   assert S.args(call,'actual_expression_partial')==[0,[bound,2],[0,0]]
  assert E.of(117054)==E.neg(E.mul(E.of(117051),E.inv(E.of(4779))))
  assert E.of(117063)==E.mul(E.of(117062),E.inv(E.of(4779)))
  assert S.args(17744317,'definite_integral')==[17743895,117049,28814,17744284]
  assert S.args(17743895,'actual_expression_partial')==[0,[117049,17732775],[0,0]]
  assert S.args(17744341,'smooth_piecewise')==[17744284,28814,28826,0,17744340,0]
  assert E.of(17744340)==E.neg(E.mul(E.of(17744317),E.of(17732766),E.pow(E.of(17743710),-2)))
  # Bind the literal ORIGINAL terminal regular program, already in the same source graph.
  defs={32004:('ActualOrderOneTerminalSmoothFactor',17716949,[17716930]),32005:('ActualOrderOneTerminalCompleteHeat',17716976,[17716930,2]),32006:('ActualOrderOneTerminalPrimitiveSmoothCoefficient',17717057,[17716930,2]),32007:('ActualOrderOneWeighted_theta',117068,[4756,2])}
  for key,(name,body,params) in defs.items():
   assert core[key]['name']==name and core[key]['body']==body and core[key]['parameters']==params
  delta=E.of(17716930);eta=E.of(2);h=E.of(9);one=E.one
  LL=E.sub(one,E.mul(E.scalar(2),h,E.pow(eta,2)));Linv=E.inv(LL);dd=E.sub(one,E.pow(eta,2));DD=E.sub(E.scalar(F(1,2)),h)
  az=E.neg(E.mul(E.scalar(2),eta,Linv));az_eta=E.add(E.neg(E.mul(E.scalar(2),Linv)),E.neg(E.mul(E.scalar(8),h,E.pow(eta,2),E.pow(Linv,2))))
  bz=E.mul(E.add(E.neg(E.mul(E.scalar(2),DD,eta,az)),E.mul(dd,az_eta)),Linv)
  A0,A1,A2,H=[E.of(i) for i in (17716950,17716991,17716992,17716977)]
  for call,key,oo in [(17716950,32004,[0]),(17716991,32004,[1]),(17716992,32004,[2]),(17716977,32005,[0,0])]:
   aa=S.args(call,'actual_expression_partial');assert aa[0]==key and aa[2]==oo
  coefficient=E.mul(H,E.sub(E.mul(E.pow(az,2),E.add(E.mul(E.pow(delta,6),A2),E.mul(E.scalar(16),E.pow(delta,3),A1),E.mul(E.sub(E.scalar(64),E.mul(E.scalar(24),E.pow(delta,2))),A0))),E.mul(bz,E.add(E.mul(E.pow(delta,6),A1),E.mul(E.scalar(8),E.pow(delta,3),A0)))))
  assert coefficient==E.of(17717045)
  assert E.of(17717057)==E.mul(E.of(17717045),E.of(17717056))
  assert E.of(S.args(17717056,'exp')[0])==E.mul(E.scalar(-2),delta)
  assert E.of(17717024)==E.of(17717048) # actual direct retained fo derivatives versus its Gaussian factorization
  eAtoms=[i for m in E.of(17717048) for i,n in m if i>=0 and S.record(i)['op']=='exp' and E.of(S.args(i,'exp')[0])==E.mul(E.scalar(-4),E.pow(delta,-2))]
  assert len(set(eAtoms))==1;eRoot=eAtoms[0]
  assert E.of(17717048)==E.mul(E.of(eRoot),E.pow(delta,-6),coefficient)
  # Four source FTC faces, not an arbitrary supplied upper bound.
  K0=17717108;assert E.of(K0)==E.add(*[E.of(i) for i in [17717067,17717079,17717091,17717105]])
  c0=sqrt_bound_body(17717067);native(c0,[0,0],[0,20])
  fa,va,la,ua=S.args(17717079,'definite_integral');assert [la,ua]==[0,847];native(sqrt_bound_body(fa),[1,0],[va,20])
  fb,vb,lb,ub=S.args(17717091,'definite_integral');assert [lb,ub]==[20,1];native(sqrt_bound_body(fb),[0,1],[0,vb])
  inner,vx,lx,ux=S.args(17717105,'definite_integral');assert [lx,ux]==[0,847]
  fc,vy,ly,uy=S.args(inner,'definite_integral');assert [ly,uy]==[20,1];native(sqrt_bound_body(fc),[1,1],[vx,vy])
  assert S.rational(847)==F(1,4) and S.rational(20)==-1
  assert E.of(17717110)==E.mul(E.scalar(F(16,125)),E.of(K0))
  assert S.args(17717699,'maximum')==[1,17717409,17717697,17717698]
  # Independent exact Laurent recurrence through C2 of exp(2d-4/d^2)*d^-6 * B(d).
  P={(-6,0):F(1)};jets=[]
  for j in range(3):
   jets.append(P);Q=defaultdict(F)
   for (p,k),c in P.items():
    Q[p-1,k]+=p*c;Q[p,k]+=2*c;Q[p-3,k]+=8*c;Q[p,k+1]+=c
   P={key:c for key,c in Q.items() if c}
  ordinaryXX=defaultdict(F)
  for poly in [jets[1],jets[2]]:
   for key,c in poly.items():ordinaryXX[key]+=c
  # Explicit uniform coefficient majorants for d<=1/4.
  assert 2*F(1,4)**3+6*F(1,4)**2+8<9
  assert 81+9*F(1,4)**3+6*F(1,4)**4+24*F(1,4)**2<83 and 18+F(1,4)**3<19
  assert 8-3*F(1,4)**2==F(125,16)
  assert F(1,128)**2/F(7,4)**2==F(1,50176)
  assert F(11,4)<F(25,9) and F(5,3)*F(50176,50175)<2
  def ftcRecipe(j):return {'nativeDefinition':32006,'nativeBody':17717057,'derivative':[j,0],
   'corner':{'actualArguments':['0','-1'],'orders':[j,0]},
   'deltaFace':{'integral':['u','0','1/4'],'actualArguments':['u','-1'],'orders':[j+1,0]},
   'etaFace':{'integral':['v','-1','1'],'actualArguments':['0','v'],'orders':[j,1]},
   'rectangle':{'integrals':[['u','0','1/4'],['v','-1','1']],'actualArguments':['u','v'],'orders':[j+1,1]},
   'integrandForEveryFace':'sqrt(1+(native derivative)^2)','existingConstantRoot':K0 if j==0 else None}
  # Differentiating the possible forward moment tail requires no numerical value of that moment.
  momentJets=[{'XDerivative':j,'coefficient':str(F((-1)**(j+1)*factorial(j),2)),'factor':'J(eta)*X^(-'+str(j+1)+')'} for j in range(4)]
  result={'schema':'MathScope.C85.ActualN1ThetaOuterRegularFactor/1','status':'VERIFIED_ACTUAL_N1_SOURCE_TERMINAL_COEFFICIENT_AND_C0_FTC_BOUND_DERIVATIVE_RECIPES_CONDITIONAL_TERMINAL_SOURCE_REDUCTION',
   'hostedRun':44582875351,'sourceStream':S.verify,'registrySHA256':N.pin,'inputPins':PINS,'sourceModules':source,
   'orderCorrection':{'actualArmOrders':orderRows,'exceptionalValueRoot':17744341,'exceptionalActualOrder':1,'originalStressRoot':117068,'supersedes':'C84 positional order labels [1,2,3]; exact pairings remain valid, actual labels are [3,2,1].'},
   'actualPrimitive':{'originalX':4756,'originalEta':2,'rawAngularDensity':117038,'supportedAngular':117046,'weightedIntegrand':117048,'integrandDefinition':0,'forward':117054,'backward':117063,'wholeAngularMoment':117072,
    'liveIntegral':17744317,'liveX':17744284,'liveEta':17732775,'liveStress':17744341,
    'exactDifference':'Tforward-Tbackward=-Jtheta(eta)/(2X)','wholeMomentZeroProvedHere':False,'forwardTailJetsIfNonzeroJ':momentJets},
   'terminalRawDensity':{'deltaFormal':17716930,'deltaMeaning':'log(Xb/X)','domain':['0','1/4'],'factorDefinition':32004,'factorBody':17716949,'factorDerivatives':[17716950,17716991,17716992],
    'completeHeatDefinition':32005,'completeHeatBody':17716976,'completeHeatCall':17716977,'literalRawCoefficient':17717045,'actualDirect':17717024,'actualFactored':17717048,'outerGaussianRoot':eRoot,
    'BDefinition':32006,'BBody':17717057,'BRelation':'B=exp(-2delta)*rawCoefficient',
    'exactFormula':'Atheta=exp(2delta-4/delta^2)*delta^(-6)*B(delta,eta)',
    'pointwiseAlgebraVerified':True,'originalRawDensityIdentification':'Uses original terminal source support reductions, positive square-root density match and Z_b(Fheat)=0 from actualHeatExteriorIdentity. No whole-angular-moment identity is used for this RAW DENSITY reduction.',
    'coefficientFormula':'H{az^2[delta^6 A2+16delta^3 A1+(64-24delta^2)A0]-bz[delta^6 A1+8delta^3 A0]}',
    'az':'-2eta/L','bz':'(-2D*eta*az+(1-eta^2)*az_eta)/L','L':'1-2h*eta^2','D':'1/2-h'},
   'sourceC0Bound':{'B0':K0,'fourFaces':[17717067,17717079,17717091,17717105],'sourceWeightedPrimitiveC0Norm':17717699,
    'bound':'sup_[0,1/4]x[-1,1] |B| <= B0','sourceB0EvaluatedNumerically':False,
    'rawTheta':'|Atheta| <= exp(1/2)*B0*exp(-4/delta^2)*delta^-6',
    'zetaRecovery':'For original t1<1/128 and total log width>2, opposite Gaussian inverse<=50176/50175, and exp(1/2)<5/3. Hence |Atheta|<2*B0*zeta*delta^-6.',
    'regularityPremises':'Original h>0, h<1/64 and positive fixed parameters; the smooth factor denominator is bounded below by the second seed on delta<=1/4; the original full heat Laplace moments dominate every finite derivative, including eta endpoints.'},
   'sourceC1C2Recipes':{'K':[ftcRecipe(j) for j in range(3)],'newOriginalGraphNodesAppended':False,
    'derivativeOrderMeaning':'Kj uniformly bounds partial_delta^j B; K1,K2 are explicit source functionals, with no invented original node IDs and no claimed numeric evaluation.',
    'ordinaryXBounds':{'order0':'2*K0*zeta*delta^-6','order1':'2*Xedge^-1*(9*K0+K1)*zeta*delta^-9','order2':'2*Xedge^-2*(83*K0+19*K1+K2)*zeta*delta^-12'},
    'Xedge':'Xb*exp(-1/4)','conversion':'partial_X=-X^-1 partial_delta; partial_X^2=X^-2(partial_delta^2+partial_delta)',
    'deltaLaurentJets':[{'order':j,'terms':[{'deltaPower':p,'BdeltaOrder':k,'coefficient':str(c)} for (p,k),c in sorted(poly.items())]} for j,poly in enumerate(jets)],
    'ordinaryXSecondPolynomial':[{'deltaPower':p,'BdeltaOrder':k,'coefficient':str(c)} for (p,k),c in sorted(ordinaryXX.items()) if c]},
   'primitiveGaussianRule':{'identity':'d_delta(exp(-4/delta^2)*delta^-3)=exp(-4/delta^2)*delta^-6*(8-3delta^2)',
    'positiveFactorLower':'125/16','integralUpperFactor':'16/125','wholeMomentNeededOnlyForOriginalForwardStress':True},
   'scope':{'rawThetaWeightedC0':'CONDITIONAL_ON_ORIGINAL_TERMINAL_IDENTIFICATION_AND_REGULARITY','rawThetaXAndXX':'EXPLICIT_FINITE_SOURCE_NORM_RECIPES_NOT_NUMERICAL_ENCLOSURES','originalStressWholeMomentZero':'SEPARATE_OPEN_IN_THIS_REPLAY','noLocalLean':True,'base67Unchanged':True,'release':'HOLD'}}
  a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
  print('PASS actual orders3/2/1; n1 J117072; literal terminal coefficient17717045; B0 FTC17717108; exact C1/C2 Laurent recipes',flush=True)
 finally:S.__exit__(None,None,None)
if __name__=='__main__':main()
