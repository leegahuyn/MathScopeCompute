/** Actual order-one Lemma 5.2 extension.
 *
 * The five incoming moments contain the actual same-source inner Picard
 * function and the complete leading Omega functionals. The correction uses
 * inverses of continuous bump-integral matrices. A finite interval midpoint,
 * a finite Picard iterate, and a debt bound are never correction operands.
 *
 * This module compiles exact convergent function operations. Its numeric
 * materialization and the all-order/background theorem are separate claims.
 */
import {prepareActualFirstOrderInnerProgram,assertActualFirstOrderInnerPrepared} from './actual-continuation-exact-inner.mjs';
import {qcompare,qmul,rational as Q,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {verifyActualMomentLinearIdentities} from './actual-continuation-exact-linear.mjs';

const completedOrders=new WeakMap();

export function actualIposContinuousInverseProof(){
  const uDet=Q(1,32),eDet=Q(1,131072),uAdj=Q(16),eAdj=Q(96),uInv=Q(1024),eInv=Q(1n<<24n);
  const checks={positiveActualLambda:true,lambdaUpperQuarter:true,
    twoOrderedAxialSupports:true,threeOrderedAngularSupports:true,
    uInverseBound:qcompare(uAdj,qmul(uInv,uDet))<0,
    eInverseBound:qcompare(eAdj,qmul(eInv,eDet))<0};
  if(!Object.values(checks).every(Boolean))fail('INTERNAL_VALIDATION','The Ipos inverse bound failed.');
  return {schema:'MathScope.ActualIposContinuousInverseProof/1',
    sourceEquations:['5.14','5.15','5.16','Lemma A.1'],
    lambda:{samePinnedParameter:true,strictlyPositive:true,upper:'1/4',setToZero:false},
    bumpDefinition:'beta_j(x)=sigma_prime((x-left_j)/(right_j-left_j))/(right_j-left_j); b_j(R)=beta_j(R/Rbase)/Rbase',
    centers:['3/2','2','5/2','3','7/2'],halfWidth:'1/4096',positiveUnitRMass:true,
    originalDefinitionAllowsThisChoice:'Lemma 5.2 fixes any five smooth positive unit-integral bumps with mutually disjoint ordered supports in Jpos, independently of the background order. These bumps are a positive-order choice; they do not change any leading N3 datum.',
    normalizedU:{weights:['x','x*integral_0^log(x) exp(-2*lambda*s) ds'],determinantLower:qtext(uDet),adjugateInfinityUpper:qtext(uAdj),inverseInfinityUpper:qtext(uInv),
      proof:'For all supports 1<x<4, w_prime=x^(-1-2lambda)>1/8 and the two support gaps exceed 1/4. Thus x*y*(w(y)-w(x))>1/32. Entries are <8, hence each adjugate row sum <16. Integrate against the two positive unit-mass measures.'},
    normalizedE:{weights:['x^2','x^(-2-2*lambda)','x^(-2*lambda)'],determinantAbsoluteLower:qtext(eDet),adjugateInfinityUpper:qtext(eAdj),inverseInfinityUpper:qtext(eInv),
      proof:'Factor x^(-2-2lambda)>1/32 from each point column and set t=x^2. The remaining rows are t^(2+lambda), 1, t. Since the second divided difference of t^(2+lambda) on t>=1 is >=1, consecutive t gaps exceed 1/2 and the outer gap exceeds 1. The determinant magnitude exceeds 1/(4*32^3)=1/131072. Entries are at most 16,1,1; every cofactor is at most 32 and every adjugate row sum at most 96. Multilinearity preserves this bound for the positive bump integrals.'},
    actualContinuousEntriesRetained:true,approximateInverseUsed:false,debtSmallnessRequired:false,checks};
}

/** Attach only to an internally generated same-source first-order solution. */
export function attachActualFirstOrderExtension(prepared,{etaOrder=0}={},context={}){
  assertActualFirstOrderInnerPrepared(prepared);
  if(!Number.isSafeInteger(etaOrder)||etaOrder<0||etaOrder>2)fail('RESOURCE_LIMIT','Order-one global output jets are available through eta order two.');
  const {G,pre,inner}=prepared,q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,{X,eta,Xv,lambda}=prepared.constants;
  if(!inner||pre.G!==G||!prepared.program.scope.actualOrderOneForcingFullySpecified||!prepared.program.scope.actualFinalGlobalU0M0V0Compiled)fail('INVALID_INPUT','Use the actual same-source global leading and order-one inner construction.');
  const {A,D,d,L}=G.core,Xa=G.parameter('Xa'),t1=G.parameter('t1'),XR=G.parameter('XR'),C=G.parameter('CSelected');
  const Xminus=G.mul(Xa,G.exp(G.div(t1,q(128)))),Xkeep=G.mul(Xa,G.exp(G.div(t1,q(64)))),Xcut=G.mul(Xa,G.exp(G.div(t1,q(32)))),Xplus=G.mul(Xv,G.exp(o));
  const Xb=G.mul(XR,G.exp(G.outer.stages.at(-1).end));
  const at=(id,x)=>G.substitute(id,X,x),integrate=(body,left,right,prefix)=>{const t=G.fresh(prefix);return G.integral(at(body,t),t,left,right);};
  const kappa=G.sub(o,G.step(G.div(G.sub(G.log(G.div(X,Xa)),G.div(t1,q(64))),G.div(t1,q(64)))));
  const Fraw=inner.F1at(X),Uraw=inner.U1at(X);
  // The zero branch avoids evaluating the inner function outside its domain.
  const Ft=G.choose(X,Xkeep,Xcut,Fraw,G.mul(kappa,Fraw),z),Ut=G.choose(X,Xkeep,Xcut,Uraw,G.mul(kappa,Uraw),z);
  const localBodies=[Ut,G.mul(q(2),X,Ft),G.mul(q(2),inner.F0,Ft),G.mul(q(2),X,G.add(G.mul(inner.U0,Ft),G.mul(Ut,inner.F0))),G.sub(G.mul(q(2),inner.U0,Ut),G.mul(q(2),X,inner.F0,Ft))];
  const localMoments=localBodies.map((body,j)=>integrate(body,z,Xcut,'actual_n1_local_m'+j));
  const moments=[localMoments[0],localMoments[1],G.sub(localMoments[2],prepared.pressureOmega),localMoments[3],G.add(localMoments[4],prepared.fluxOmega)];

  const X0=G.parameter('X0Ipos'),IposRight=G.parameter('IposRight'),Rbase=G.sqrt(G.mul(q(2),X0)),sqrt2X=G.sqrt(G.mul(q(2),X));
  const Kpos=G.mul(G.parameter('Pstar'),G.inv(G.add(o,G.pow(eta,2))),G.exp(G.add(G.mul(q(-1,2),G.parameter('T')),q(-7,10),G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(G.mul(q(60),G.parameter('BOuter')),q(14)))))));
  const power=(v,exponent)=>G.exp(G.mul(exponent,G.log(v))),ef=G.mul(Kpos,power(Rbase,G.add(o,G.mul(q(2),lambda))));
  const centers=[q(3,2),q(2),q(5,2),q(3),q(7,2)],width=q(1,2048),half=q(1,4096),supports=centers.map(c=>[G.sub(c,half),G.add(c,half)]);
  const bump=(x,j)=>G.div(G.step(G.div(G.sub(x,supports[j][0]),width),1),width);
  const onBump=(fn,j,prefix)=>{const t=G.fresh(prefix);return G.integral(fn(t),t,...supports[j]);};
  const Umat=[[],[]],Emat=[[],[],[]];
  for(let j=0;j<5;j++){
    context.checkCancelled?.();
    if(j<2){
      Umat[0].push(onBump(x=>G.mul(x,bump(x,j)),j,'actual_n1_BU_first'));
      Umat[1].push(onBump(x=>{const s=G.fresh('actual_n1_BU_confluent_weight');return G.mul(x,bump(x,j),G.integral(G.exp(G.mul(q(-2),lambda,s)),s,z,G.log(x)));},j,'actual_n1_BU_confluent'));
    }else{
      Emat[0].push(onBump(x=>G.mul(G.pow(x,2),bump(x,j)),j,'actual_n1_BE_first'));
      Emat[1].push(onBump(x=>G.mul(power(x,G.sub(q(-2),G.mul(q(2),lambda))),bump(x,j)),j,'actual_n1_BE_second'));
      Emat[2].push(onBump(x=>G.mul(power(x,G.mul(q(-2),lambda)),bump(x,j)),j,'actual_n1_BE_third'));
    }
  }
  const R1minus2lambda=power(Rbase,G.sub(o,G.mul(q(2),lambda))),Rminus2minus2lambda=power(Rbase,G.sub(q(-2),G.mul(q(2),lambda))),Rminus2lambda=power(Rbase,G.mul(q(-2),lambda));
  const Urhs=[G.neg(G.div(moments[0],Rbase)),G.div(G.add(G.neg(G.div(moments[0],Rbase)),G.div(moments[3],G.mul(ef,R1minus2lambda))),G.mul(q(2),lambda))];
  const Erhs=[G.neg(G.div(moments[1],G.pow(Rbase,2))),G.neg(G.div(moments[2],G.mul(q(2),ef,Rminus2minus2lambda))),G.div(moments[4],G.mul(ef,Rminus2lambda))];
  const inverse=matrix=>{const det=G.determinant(matrix);return matrix.map((_,i)=>matrix.map((__,j)=>G.div(G.mul(q((i+j)%2?-1:1),G.determinant(matrix.filter((_,r)=>r!==j).map(row=>row.filter((_,c)=>c!==i)))),det)));};
  const Uinverse=inverse(Umat),Einverse=inverse(Emat),dot=(a,b)=>G.add(...a.map((v,j)=>G.mul(v,b[j]))),alpha=Uinverse.map(row=>dot(row,Urhs)),beta=Einverse.map(row=>dot(row,Erhs)),proof=actualIposContinuousInverseProof();
  const normalizedR=G.div(sqrt2X,Rbase),dUraw=G.div(G.add(...alpha.map((v,j)=>G.mul(v,bump(normalizedR,j)))),Rbase),dU=G.choose(X,X0,IposRight,z,dUraw,z),dE=G.div(G.add(...beta.map((v,j)=>G.mul(v,bump(normalizedR,j+2)))),Rbase);
  const dF=G.choose(X,X0,IposRight,z,G.div(dE,sqrt2X),z),U1=G.add(Ut,dU),F1=G.add(Ft,dF),E1=G.mul(sqrt2X,F1),phi1=G.mul(C,F1);
  // Primitive of each R-bump with dX=R dR. The prefix has the real
  // integrand and retains its complete continuous mass, not point samples.
  const correctionMass=G.mul(Rbase,G.add(...alpha.map((v,j)=>{const s=G.fresh('actual_n1_bump_mass_prefix'),partial=G.integral(G.mul(s,bump(s,j)),s,supports[j][0],normalizedR);return G.mul(v,G.choose(normalizedR,...supports[j],z,partial,Umat[0][j]));})));
  const localMassPartial=integrate(Ut,z,X,'actual_n1_local_mass_prefix'),localMass=G.choose(X,Xkeep,Xcut,localMassPartial,localMassPartial,localMoments[0]);
  const unclosedM=G.add(localMass,correctionMass),lastU=G.mul(X0,G.pow(supports[1][1],2));
  // Before Xkeep the integral average is regular. Beyond the final U bump,
  // the first moment makes the streamfunction exactly zero.
  const t=G.fresh('actual_n1_axis_average'),axisAverage=G.integral(G.substitute(inner.U1at(G.mul(t,X)),eta,eta),t,z,o);
  const M1=G.choose(X,Xkeep,lastU,G.mul(X,axisAverage),unclosedM,z),M1overX=G.choose(X,Xkeep,lastU,axisAverage,G.div(M1,X),z);
  const v1=G.div(G.sub(G.sub(G.mul(q(2),eta,U1),G.mul(q(2),eta,G.add(D,inner.lambda1),M1overX)),G.mul(d,G.derivative(M1overX,eta))),L),V1=G.mul(X,v1);

  // Prefix of integral Omega0/(2X), with the exact regular boundary term.
  // At X=0 this formula has the analytic axis value; no V/X singular node
  // needs to be evaluated there.
  const v0=prepared.finalv,U0=prepared.finalU,VX0=prepared.roots.actualGlobalAxisVX;
  if(VX0===undefined)fail('INVALID_SOURCE_CONSTRUCTION','Preserve the actual leading axis derivative in the Omega prefix.');
  const prefixBodies=[v0,G.mul(U0,v0),G.pow(v0,2)],prefix=prefixBodies.map((body,j)=>integrate(body,z,X,'actual_n1_Omega_prefix'+j));
  const boundary=G.add(G.div(G.mul(X,v0),G.mul(q(2),L)),G.neg(G.div(G.mul(eta,X,U0,v0),L)),G.mul(q(1,2),X,G.pow(v0,2)),G.neg(v0),G.neg(G.mul(X,G.derivative(v0,X))));
  const pressurePrefix=G.add(G.div(G.add(G.mul(D,eta,G.derivative(prefix[0],eta)),G.mul(d,G.derivative(prefix[1],eta)),G.mul(q(-2),A,eta,prefix[1])),G.mul(q(2),L)),G.mul(q(1,4),prefix[2]),boundary,VX0);
  const closedPressurePrefix=G.choose(X,Xkeep,Xv,pressurePrefix,pressurePrefix,prepared.pressureOmega);
  const localPressurePartial=integrate(localBodies[2],z,X,'actual_n1_pressure_local_prefix'),localPressure=G.choose(X,Xkeep,Xcut,localPressurePartial,localPressurePartial,localMoments[2]);
  const pressureCorrection=G.mul(q(2),ef,Rminus2minus2lambda,G.add(...beta.map((v,j)=>{const s=G.fresh('actual_n1_pressure_bump_prefix'),weight=power(s,G.sub(q(-2),G.mul(q(2),lambda))),partial=G.integral(G.mul(weight,bump(s,j+2)),s,supports[j+2][0],normalizedR);return G.mul(v,G.choose(normalizedR,...supports[j+2],z,partial,Emat[1][j]));})));
  const unclosedPi=G.sub(G.add(localPressure,pressureCorrection),closedPressurePrefix),innerPi=G.picardEven(inner.system,3,X,eta),Pi1=G.choose(X,Xkeep,Xplus,innerPi,unclosedPi,z);
  const F0pos=G.mul(ef,power(sqrt2X,G.sub(q(-2),G.mul(q(2),lambda))));
  const F0F1=G.add(G.choose(X,Xkeep,Xcut,G.mul(inner.F0,Fraw),G.mul(inner.F0,Ft),z),G.choose(X,X0,IposRight,z,G.mul(F0pos,dF),z));
  const v0X=G.derivative(v0,X),v0XX=G.derivative(v0X,X),v0Eta=G.derivative(v0,eta),vPlusXvX=G.add(v0,G.mul(X,v0X));
  const omegaOverX=G.add(G.div(G.add(G.mul(D,eta,v0Eta),vPlusXvX),L),G.mul(v0,G.add(G.mul(q(1,2),v0),G.mul(X,v0X))),G.div(G.mul(U0,G.sub(G.mul(d,v0Eta),G.mul(q(2),eta,vPlusXvX))),L),G.mul(q(-2),G.add(G.mul(q(2),v0X),G.mul(X,v0XX))));
  const pressureDerivative=G.sub(G.mul(q(2),F0F1),G.mul(q(1,2),G.choose(X,Xkeep,Xv,inner.omegaOverX,omegaOverX,z)));
  const originalUrows=[Umat[0],Umat[0].map((v,j)=>G.sub(v,G.mul(q(2),lambda,Umat[1][j])))],correctionMoments=[G.mul(Rbase,dot(originalUrows[0],alpha)),G.mul(G.pow(Rbase,2),dot(Emat[0],beta)),G.mul(q(2),ef,Rminus2minus2lambda,dot(Emat[1],beta)),G.mul(ef,R1minus2lambda,dot(originalUrows[1],alpha)),G.neg(G.mul(ef,Rminus2lambda,dot(Emat[2],beta)))];
  const momentResiduals=moments.map((m,j)=>G.add(m,correctionMoments[j]));
  const roots={...prepared.roots,actualOrderOneF:F1,actualOrderOnePhi:phi1,actualOrderOneE:E1,actualOrderOneU:U1,actualOrderOneStream:M1,actualOrderOneStreamOverX:M1overX,actualOrderOneV:V1,actualOrderOneVOverX:v1,actualOrderOnePi:Pi1,actualOrderOnePressureDerivative:pressureDerivative,actualOrderOneGlobalPressurePrefix:closedPressurePrefix,
    actualOrderOneXminus:Xminus,actualOrderOneXkeep:Xkeep,actualOrderOneXcut:Xcut,actualOrderOneXplus:Xplus,actualOrderOneXb:Xb,actualIposRbase:Rbase,actualIposAmplitude:ef};
  moments.forEach((v,j)=>{roots['actualOrderOneIncomingMoment'+j]=v;roots['actualOrderOneCorrectionMoment'+j]=correctionMoments[j];roots['actualOrderOneMomentResidual'+j]=momentResiduals[j];});
  alpha.forEach((v,j)=>roots['actualOrderOneAlpha'+j]=v);beta.forEach((v,j)=>roots['actualOrderOneBeta'+j]=v);
  for(const [name,value]of Object.entries({U:U1,F:F1,VOverX:v1,Pi:Pi1})){
    let r=value;for(let m=1;m<=etaOrder;m++){context.checkCancelled?.();r=G.derivative(r,eta);roots['actualOrderOne'+name+'_eta'+m]=r;}
  }
  const program=G.pack(roots,{construction:'Actual same-N3 n=1 extension by the literal Lemma 5.2 five continuous moment equations.',order:1,
    inner:prepared.program.inner,
    momentRepair:{inputMoments:moments,localIntegrands:localBodies,localIntegrals:localMoments,globalOmegaPressure:prepared.pressureOmega,globalOmegaFlux:prepared.fluxOmega,
      U:{matrix:Umat,inverse:Uinverse,rhs:Urhs,solution:alpha},E:{matrix:Emat,inverse:Einverse,rhs:Erhs,solution:beta},proof,
      rowTransform:{U:'original second normalized row = row0 - 2*lambda*confluentRow1',positiveLambdaRetained:true,physicalScales:[Rbase,R1minus2lambda,G.pow(Rbase,2),Rminus2minus2lambda,Rminus2lambda],amplitude:ef},
      correctionMoments,residualExpressions:momentResiduals,zeroIdentity:'A*adj(A)=det(A)*I in each actual continuous matrix block. Substituting the physical row transformation gives five exact zero functions of eta.',exactZeroValues:[0,0,0,0,0],
      universalLinearIdentity:verifyActualMomentLinearIdentities(),normalizationProofRequired:true,finiteNumericalMomentsEvaluated:false,finitePicardIterateUsedAsInput:false,callerSuppliedDebtUsed:false},
    reconstruction:{Fmeans:'F here in roots.actualOrderOneF is phi1/C, not the Stokes primitive. roots.actualOrderOneStream is the distinct integral of U1.',M:M1,average:M1overX,V:V1,Pi:Pi1,pressureDerivative,pressurePrefix:closedPressurePrefix,axisDatum:[0,0,0],regularVOverX:true,exactInnerRestrictionThrough:Xkeep,outerZeroUsesExactMomentIdentity:true},
    support:{Xminus,Xkeep,Xcut,commonASquared:inner.aSquared,Xplus,Xb,leadingAxialEndpoint:Xv,positiveOrderPatch:[X0,IposRight],allEndpointsIndependentOfEta:true,independentOfBackgroundOrder:true,
      sourceOrdering:['Xa<Xminus<Xkeep<Xcut<a^2<loopILeft','IposRight<ImeanLeft<Xv<Xplus','Xplus=Xv*exp(1) lies in the next interpolation stage of length Tf=128','Xplus<Xb: Xb is the end of the actual outer terminal stage, not the local B26 control value 100'],
      orderOneStress:[Xminus,Xb],laterOrderStress:[Xminus,Xplus],supportProof:'Lemma 5.2, steps 3--4. For n=1 the lower angular viscosity moment is the heat-compensated leading difference identity (5.19); for n>=2 it is the already-cancelled lower positive-order angular moment. Both conservative total residuals (5.21) vanish after the five corrections.',
      directActualOrderOneStressGraphGenerated:false,allLaterActualCoefficientsConstructed:false},
    scope:{...prepared.program.scope,actualOrderOneGlobalCutoffAndIposApplied:true,actualOrderOneIposRepairComplete:true,actualCompleteOrderOneDebtsAreCorrectionOperands:true,actualOrderOneGlobalProfilesCompiled:true,actualOrderOneFiveMomentAlgebraicIdentity:true,actualOrderOneNumericMomentValuesEvaluated:false,actualGlobalTranscendentalValuesNumericallyEnclosed:false,nextPositiveOrderAllowed:true,actualOrderTwoSourceGenerated:false,allOrdersConstructed:false,originalN404Complete:false,originalN405Complete:false,newLeanKernelProof:false}});
  const result={...prepared,G,program,roots,orderOne:{F1,phi1,E1,U1,M1,M1overX,v1,V1,Pi1,pressureDerivative,F0F1,moments,localMoments,alpha,beta,Umat,Emat,Uinverse,Einverse,Urhs,Erhs,correctionMoments,momentResiduals,proof,ef,Rbase,normalizedR,bump,supports,Xminus,Xkeep,Xcut,Xplus,Xb,X0,IposRight}};
  completedOrders.set(result,{G,profileId:program.profileId,parameterExpressionSHA256:program.parameterExpressionSHA256,roots:[F1,U1,M1,v1,Pi1],prefix:JSON.stringify(G.nodes),nodes:G.nodes.length,definitions:G.captureFunctionDefinitions(),orderOneData:JSON.stringify(result.orderOne),bump:result.orderOne.bump,inner:prepared});
  return result;
}

export function prepareActualFirstOrderGlobalProgram(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','terms','bits','etaOrder'].includes(key))fail('INVALID_INPUT','Unknown actual order-one extension input '+key);
  const prepared=prepareActualFirstOrderInnerProgram({sourceProfile:input.sourceProfile,terms:input.terms??1,bits:input.bits??128,etaOrder:Math.max(2,input.etaOrder??0)},context);
  return attachActualFirstOrderExtension(prepared,{etaOrder:input.etaOrder??0},context);
}
export function compileActualFirstOrderGlobalProgram(input={},context={}){return prepareActualFirstOrderGlobalProgram(input,context).program;}

/** Only a live result created here, with unchanged mathematical operands,
 * can cross the induction gate. Caller completion flags are ignored. */
export function assertActualFirstOrderCompleted(prepared){
  const r=completedOrders.get(prepared),p=prepared?.program,o=prepared?.orderOne;
  if(!r||prepared.G!==r.G||p?.profileId!==r.profileId||p?.parameterExpressionSHA256!==r.parameterExpressionSHA256||JSON.stringify(r.G.nodes.slice(0,r.nodes))!==r.prefix||!r.G.functionDefinitionsUnchanged(r.definitions)||!o||JSON.stringify(o)!==r.orderOneData||o.bump!==r.bump||[o.F1,o.U1,o.M1,o.v1,o.Pi1].some((v,j)=>v!==r.roots[j]))fail('PREVIOUS_ORDER_INCOMPLETE','Generate and preserve the actual five-moment order-one extension before requesting order two. A flag, serialized receipt, finite iterate or modified graph cannot authorize a new source.');
  assertActualFirstOrderInnerPrepared(r.inner);
  return {order:1,actualContinuousFiveMomentIdentity:true,profileId:r.profileId,parameterExpressionSHA256:r.parameterExpressionSHA256,nextOrder:2,authority:'PRIVATE_LIVE_MATHEMATICAL_CONSTRUCTION',numericValuesClaimed:false};
}
