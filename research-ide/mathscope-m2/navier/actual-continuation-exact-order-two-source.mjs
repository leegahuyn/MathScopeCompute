/** The actual n=2 source, after the live n=1 five-moment gate.
 * The lower coefficient is the finalized, cut and repaired coefficient.
 * The common inner restriction retains that cutoff; it is never replaced
 * by the uncut first Picard solution on Xkeep < X < a^2.
 */
import {prepareActualFirstOrderGlobalProgram,assertActualFirstOrderCompleted} from './actual-continuation-exact-order-one.mjs';
import {rational as Q,qadd,qmul,qdiv,qpow,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';

const preparedSecondOrders=new WeakMap();
export function sourceSquareStepSecondDerivativeProof(){
  let eUpper=Q(0);for(let k=0;k<=10;k++)eUpper=qadd(eUpper,Q(1,factorial(k)));
  eUpper=qadd(eUpper,Q(12,11n*factorial(11)));
  const eLower=Q(8,3),aPrimeSquaredUpper=qdiv(qmul(Q(4),qpow(Q(3,2),3)),qpow(eLower,3));
  const aSecondUpper=qadd(qmul(Q(4),qpow(qdiv(Q(3),eLower),3)),qmul(Q(6),qpow(qdiv(Q(2),eLower),2)));
  const checks={eUpperBelowElevenQuarters:qcompare(eUpper,Q(11,4))<0,eFourthBelow64:qcompare(qpow(Q(11,4),4),Q(64))<0,
    seedFirstDerivativeBelow1:qcompare(aPrimeSquaredUpper,Q(1))<0,seedSecondDerivativeBelow16:qcompare(aSecondUpper,Q(16))<0,
    quotientSecondDerivativeBelow8192:64*(16+32+2*9*2)<8192};
  if(!Object.values(checks).every(Boolean))fail('INTERNAL_VALIDATION','The square-step derivative estimate failed.');
  return {schema:'MathScope.ActualSquareStepSecondDerivativeProof/1',sourceSeed:'a(s)=exp(-1/s^2) for s>0, extended flat by zero',
    sigma:'a(s)/(a(s)+a(1-s))',eUpper:qtext(eUpper),eLower:'8/3',seedPrimeSquaredUpper:qtext(aPrimeSquaredUpper),seedSecondUpper:qtext(aSecondUpper),
    denominatorLower:'1/64',sigmaPrimeUpper:'9 (the original source derivative bound)',sigmaSecondUpper:'8192',
    quotientRule:'sigma_second=(a_second-sigma*g_second-2*sigma_prime*g_prime)/g; |g_prime|<=2, |g_second|<=32',checks,pass:true};
}

export function sourceScaledOperators(G,X,eta){
  const q=(n,d=1)=>G.q(n,d),{D,d,L}=G.core;
  const Z=(a,f)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(a,f),G.mul(X,G.derivative(f,X)))),G.mul(d,G.derivative(f,eta))),L);
  const T=(a,f)=>G.div(G.add(G.neg(G.mul(a,f)),G.mul(D,eta,G.derivative(f,eta)),G.mul(X,G.derivative(f,X))),L);
  return {Z,T};
}

/** Original (5.6), divided by X before forming any axis expression. */
export function buildActualOmegaCoefficientOverX(G,{order,X,eta,U,v}){
  if(!Number.isSafeInteger(order)||order<0||U.length!==order+1||v.length!==order+1)fail('INVALID_INPUT','Supply every coefficient through the requested Omega order.');
  const q=(n,d=1)=>G.q(n,d),{D}=G.core,h=G.parameter('h'),{Z,T}=sourceScaledOperators(G,X,eta),lambda=k=>G.mul(q(2*k),h),vx=v.map(f=>G.derivative(f,X));
  const terms=[T(G.sub(lambda(order),G.one),v[order]),G.mul(q(-2),G.add(G.mul(q(2),vx[order]),G.mul(X,G.derivative(vx[order],X))))];
  for(let i=0;i<=order;i++){const j=order-i;terms.push(G.mul(v[i],G.add(G.mul(q(1,2),v[j]),G.mul(X,vx[j]))),G.mul(U[i],Z(G.sub(lambda(j),G.one),v[j])));}
  if(order>0)terms.push(G.neg(Z(G.sub(G.sub(lambda(order-1),D),G.one),Z(G.sub(lambda(order-1),G.one),v[order-1]))));
  return {value:G.add(...terms),terms,axialViscosityShift:order>0?order-1:null,coordinate:'v_k=V_k/X; X=R^2/2',axisSingularDivisionIntroduced:false};
}

/** Bounds of the exact same first solution and its actual cutoff, followed
 * by explicit product/Cauchy norms of the n=2 forcing. No supplied norm.
 */
export function actualSecondOrderSourceMajorant(completed){
  assertActualFirstOrderCompleted(completed);
  const {G,inner}=completed,q=(n,d=1)=>G.q(n,d),o=G.one,delta=inner.delta,Lambda=G.parameter('Lambda'),Xa=G.parameter('Xa'),t1=G.parameter('t1');
  const step=sourceSquareStepSecondDerivativeProof(),M=G.maximum(o,inner.solutionNorm,inner.naturalSolutionNorm),w=G.div(t1,q(64));
  const kappa1=G.div(q(9),G.mul(w,Xa)),kappa2=G.add(G.div(q(9),G.mul(w,G.pow(Xa,2))),G.div(q(8192),G.mul(G.pow(w,2),G.pow(Xa,2))));
  const rawRadial=G.div(G.mul(q(8),inner.C1,M,G.pow(Lambda,2)),delta),cutRadial=G.mul(rawRadial,G.add(o,G.mul(q(2),kappa1),kappa2));
  const H=G.maximum(o,inner.B,cutRadial),V=G.div(G.mul(q(256),H),delta),eta1=G.div(q(64),delta),eta2=G.mul(q(2),G.pow(eta1,2));
  // On the actual thin tube, |eta|<=33/32 and |d|<3. For
  // |a|<=3, |X|<=1 and |1/L|<=2:
  // Z_a=P_a+Q*dX+R*deta, with |P|<=24, |Q|<=8,
  // |R|<=6, |Q_X|<=8 and all eta coefficient derivatives <=64.
  const Zbound=B=>G.mul(B,G.add(q(32),G.mul(q(6),eta1)));
  const ZZbound=B=>G.mul(B,G.add(
    G.mul(q(24),G.add(q(32),G.mul(q(6),eta1))),
    G.mul(q(8),G.add(q(40),G.mul(q(6),eta1))),
    G.mul(q(6),G.add(q(128),G.mul(q(96),eta1),G.mul(q(6),eta2)))));
  const timeV=G.mul(q(2),V,G.add(q(3),eta1)),transportV=G.mul(q(3),G.pow(V,2)),axialTransport=G.mul(q(2),H,Zbound(V)),radialViscosity=G.mul(q(6),V),axialViscosity=ZZbound(V);
  const omega=G.add(timeV,transportV,axialTransport,radialViscosity,axialViscosity),pressure=G.add(G.pow(H,2),G.mul(q(1,2),omega));
  const Htheta=G.add(G.mul(q(2),V,H),G.mul(H,Zbound(H)),ZZbound(H)),Hz=G.add(G.mul(V,H),G.mul(H,Zbound(H)),ZZbound(H));
  const forcingBounds=[G.zero,G.zero,G.zero,G.mul(q(2),pressure),G.mul(q(2),Htheta),G.add(G.mul(q(2),Hz),G.mul(q(16),pressure))];
  const matrixBound=G.mul(q(2),inner.C1),C2=G.mul(q(2),G.add(matrixBound,...forcingBounds));
  const sourceStrip=G.div(delta,q(64)),solutionStrip=G.div(delta,q(128)),loss=solutionStrip;
  return {schema:'MathScope.ActualSecondOrderSourceMajorant/1',order:2,profileId:completed.program.profileId,parameterExpressionSHA256:completed.program.parameterExpressionSHA256,
    exactNormRoots:{firstSolution:M,rawFirstRadial:rawRadial,cutFirstRadial:cutRadial,kappa1,kappa2,H,V,eta1,eta2,omega,pressure,Htheta,Hz,forcingBounds,matrixBound,C2,sourceStrip,solutionStrip,loss},step,
    sourceFirstSystem:inner.system,firstNaturalDisk:'|Lambda*X|<=5 is an auxiliary natural analytic extension; it agrees with the actual source only before activation.',
    radialSplit:{inner:'For 0<=X<=1/Lambda, the Cauchy circle of radius1/Lambda lies in the natural disk. Derivatives0,1,2 are bounded by2*M*Lambda^2.',
      outer:'For X>=1/Lambda: F_XX=rhs4/(4X)-W4/X^(3/2), U_XX=rhs5/(4X)-W5/(2X^(3/2)); |rhs|<=18*C1*M/delta on S_(delta/16).',
      resultingBound:rawRadial,actualCommonCollarCovered:true,collarRadialAnalyticityAssumed:false},
    cutoff:{actualCutoff:completed.orderOne.Xkeep,ends:completed.orderOne.Xcut,widthLog:w,etaIndependent:true,firstDerivative:kappa1,secondDerivative:kappa2,
      productRule:'|(kappa*f)_XX| <= (1+2*kappa1+kappa2)*max_{k<=2}|dX^k f|'},
    cauchy:{firstFieldsStrip:'delta/16',regularVStrip:'delta/32',forcingStrip:'delta/64',etaDerivativeFactors:[eta1,eta2],averageContraction:'dX^k Avg(U)=integral_0^1 t^k dX^k U(tX)dt; k<=2'},
    normRules:{geometric:{absEta:'33/32',absd:3,absD:1,absExponent:3,absX:1,absInverseL:2,P:24,Q:8,R:6,Qx:8,etaCoefficientDerivative:64},Z:'(32+6*eta1)*B',
      ZZ:'[24(32+6eta1)+8(40+6eta1)+6(128+96eta1+6eta2)]*B',
      Omega1:'time(V)+3V^2+2H*Z(V)+6V+ZZ(V)',
      Htheta1:'2VH+H*Z(H)+ZZ(H)',Hz1:'VH+H*Z(H)+ZZ(H)',
      chosenMajorant:'C2=2*(2*C1+sum of six displayed forcing bounds); all norms are of actual functions, and no bound replaces an operand in the equation.'},
    hBound:'The same source h<2^-4096 gives 4h<1/4 and keeps every n=2 exponent in |a|<=3.',
    convergenceBoundDerived:true,finitePicardSolutionValuesEnclosed:false,allOrdersBoundDerived:false};
}

export function attachActualSecondOrderInner(completed,{terms=0,bits=128,etaOrder=2}={},context={}){
  const gate=assertActualFirstOrderCompleted(completed);
  if(!Number.isSafeInteger(terms)||terms<0||terms>8||!Number.isSafeInteger(bits)||bits<16||bits>4096||!Number.isSafeInteger(etaOrder)||etaOrder<0||etaOrder>2)fail('RESOURCE_LIMIT','Use 0..8 displayed n=2 terms, 16..4096 bits and eta order0..2.');
  const G=completed.G,r=completed.orderOne,old=completed.inner,{X,eta}=completed.constants,q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,{A,D,d,L}=G.core,h=G.parameter('h'),Lambda=G.parameter('Lambda'),nu=G.mul(q(2),h),lambda2=G.mul(q(4),h),{Z,T}=sourceScaledOperators(G,X,eta);
  // The actual finalized n=1 tuple, including its original local cutoff.
  // Ipos is disjoint from [0,a^2], so its restriction has no correction bump.
  const cutoff=G.sub(o,G.step(G.div(G.sub(G.log(G.div(X,G.parameter('Xa'))),G.div(G.parameter('t1'),q(64))),G.div(G.parameter('t1'),q(64)))));
  const Fr=G.picardEven(old.system,0,X,eta),Ur=G.picardEven(old.system,1,X,eta),F1=G.choose(X,r.Xkeep,r.Xcut,Fr,G.mul(cutoff,Fr),z),U1=G.choose(X,r.Xkeep,r.Xcut,Ur,G.mul(cutoff,Ur),z);
  const t=G.fresh('actual_n2_finalized_n1_average'),average=G.integral(G.substitute(U1,X,G.mul(t,X)),t,z,o),v1=G.div(G.sub(G.sub(G.mul(q(2),eta,U1),G.mul(q(2),eta,G.add(D,nu),average)),G.mul(d,G.derivative(average,eta))),L);
  const localOmega=buildActualOmegaCoefficientOverX(G,{order:1,X,eta,U:[old.U0,U1],v:[old.v0,v1]}),pKnown=G.sub(G.pow(F1,2),G.mul(q(1,2),localOmega.value));
  const b=G.neg(G.add(A,q(1,2))),c=G.neg(A),Htheta=G.add(G.mul(v1,G.add(G.mul(X,G.derivative(F1,X)),F1)),G.mul(U1,Z(G.add(b,nu),F1)),G.neg(Z(G.sub(G.add(b,nu),D),Z(G.add(b,nu),F1))));
  const Hz=G.add(G.mul(X,v1,G.derivative(U1,X)),G.mul(U1,Z(G.add(c,nu),U1)),G.neg(Z(G.sub(G.add(c,nu),D),Z(G.add(c,nu),U1))));
  const F0=old.F0,U0=old.U0,v0=old.v0,Hf=G.add(F0,G.mul(X,G.derivative(F0,X))),Hu=G.mul(X,G.derivative(U0,X)),beta=G.add(b,lambda2),gamma=G.add(c,lambda2),pressureExponent=G.add(G.mul(q(-2),A),lambda2),xi=G.var('actual_inner_order_two_xi');
  const matrix0=Array.from({length:6},()=>Array(6).fill(z)),matrix1=Array.from({length:6},()=>Array(6).fill(z));
  matrix0[0][4]=o;matrix0[1][5]=o;matrix0[2][5]=q(-1);matrix0[3][0]=G.mul(q(4),xi,F0);
  matrix0[4][0]=G.mul(q(2),G.add(G.div(G.mul(beta,G.sub(G.mul(q(2),eta,U0),o)),L),v0));
  matrix0[4][1]=G.add(G.div(G.mul(q(4),eta,G.sub(A,lambda2),Hf),L),G.mul(q(2),Z(b,F0)));
  matrix0[4][2]=G.div(G.mul(q(-4),eta,G.add(D,lambda2),Hf),L);
  matrix0[4][4]=G.add(G.div(xi,L),G.mul(xi,v0),G.div(G.mul(q(-2),eta,xi,U0),L));
  matrix0[5][0]=G.div(G.mul(q(-8),eta,X,F0),L);
  matrix0[5][1]=G.add(G.div(G.mul(q(2),gamma,G.sub(G.mul(q(2),eta,U0),o)),L),G.div(G.mul(q(4),eta,G.sub(A,lambda2),Hu),L),G.mul(q(2),Z(c,U0)));
  matrix0[5][2]=G.div(G.mul(q(-4),eta,G.add(D,lambda2),Hu),L);matrix0[5][3]=G.div(G.mul(q(4),pressureExponent,eta),L);matrix0[5][5]=matrix0[4][4];
  matrix1[4][0]=G.div(G.mul(q(2),G.add(G.mul(D,eta),G.mul(d,U0))),L);
  matrix1[4][1]=matrix1[4][2]=G.div(G.mul(q(-2),d,Hf),L);
  matrix1[5][1]=G.div(G.mul(q(2),G.add(G.mul(D,eta),G.mul(d,U0),G.neg(G.mul(d,Hu)))),L);matrix1[5][2]=G.div(G.mul(q(-2),d,Hu),L);matrix1[5][3]=G.div(G.mul(q(2),d),L);
  const rawForcing=[z,z,z,G.mul(q(2),xi,pKnown),G.mul(q(2),Htheta),G.sub(G.mul(q(2),Hz),G.div(G.mul(q(4),eta,X,pKnown),L))],atXi=id=>G.substitute(id,X,G.pow(xi,2)),A0=matrix0.map(row=>row.map(atXi)),A1=matrix1.map(row=>row.map(atXi)),forcing=rawForcing.map(atXi);
  const majorant=actualSecondOrderSourceMajorant(completed),nr=majorant.exactNormRoots,C2=nr.C2,loss=nr.loss,delta=old.delta,aSquared=old.aSquared;
  const Kcondition=G.ceiling(G.div(G.mul(q(72),G.pow(C2,2),aSquared),loss)),Kprecision=G.ceiling(G.mul(q(1,2),G.add(q(bits+etaOrder**2+8*etaOrder),G.div(q(2*etaOrder),delta)))),K=G.maximum(o,Kcondition,Kprecision),tail=G.mul(q(1,3),G.exp(G.neg(G.mul(K,G.log(q(4))))),q(factorial(etaOrder)),G.pow(G.div(q(256),delta),etaOrder)),target=q(1,1n<<BigInt(bits));
  const solutionNorm=G.exp(G.div(G.mul(q(9),G.pow(C2,2),aSquared),G.mul(q(2),loss)));
  const system=G.definePicardSystem({name:'ActualSameN3OrderTwoInner',order:2,xi,eta,diagonal:[0,0,2,0,3,1],A0,A1,forcing,zeroAxisDatum:[0,0,0,0,0,0],unknowns:['F2=phi2/C','U2','K2=average(U2)-U2','Pi2','partial_xi F2','partial_xi U2'],
    radialDomain:[z,G.sqrt(aSquared)],sourceLeading:{F0:atXi(F0),U0:atXi(U0),v0:atXi(v0)},previousOrderGate:gate,finalizedLowerRestriction:{F1:atXi(F1),U1:atXi(U1),v1:atXi(v1),actualCutoffPreserved:true,uncutLowerSubstitution:false},
    tail:{sourceBound:C2,sourceStrip:nr.sourceStrip,solutionStrip:nr.solutionStrip,loss,Kcondition,Kprecision,K,etaOrder,error:tail,target,sourceNormProducer:'actual-continuation-exact-order-two-source.mjs:actualSecondOrderSourceMajorant',
      proof:'The original nilpotent A1 mask gives at most ceil(k/2) eta derivatives. Kcondition>=72(C2*a)^2/loss gives the tail4^-K/3. Cauchy radiusdelta/256 supplies etaOrder!*(256/delta)^etaOrder.',tailIsForTheCertifiedIndexNotForDisplayedTerms:true,sourceTruncationIndexNumericallyMaterialized:false},
    solutionNorm:{commonCollar:solutionNorm,naturalExtensionToY5:null,auxiliaryNaturalSystemGenerated:false,naturalExtensionNotUsedAsActualActivation:true},callerSuppliedForcing:false,leadingReferenceSubstitution:false});
  context.checkCancelled?.();const values=Array.from({length:6},(_,j)=>G.picardRoot(system,j,xi,eta)),partial=G.picardPartialSum(system,terms),F2at=x=>G.picardEven(system,0,x,eta),U2at=x=>G.picardEven(system,1,x,eta);
  const roots={...completed.roots,actualOrderTwoOmegaOneOverXInner:localOmega.value,actualOrderTwoPressureKnownInner:pKnown,actualOrderTwoHthetaOne:Htheta,actualOrderTwoHzOne:Hz,actualOrderTwoC2:C2,actualOrderTwoCertifiedK:K,actualOrderTwoTail:tail,actualOrderTwoSolutionNorm:solutionNorm};
  values.forEach((v,j)=>{roots['actualOrderTwoInner'+j]=v;roots['actualOrderTwoPartial'+j]=partial.sum[j];});
  const program=G.pack(roots,{construction:'Actual n=2 six-component source after the live finalized n=1 five-moment gate; the common interval and actual lower cutoff are retained.',order:2,
    previousOrderGate:gate,innerOrderTwo:{system,values,partial,majorant,commonDomain:[z,aSquared],lowerCutoff:[r.Xkeep,r.Xcut],actualLowerRestriction:true,uncutPicardLowerUsedBeyondCutoff:false,known:{omegaOverX:localOmega.value,pKnown,Htheta,Hz}},
    scope:{...completed.program.scope,actualOrderTwoSourceGenerated:true,actualOrderTwoInnerPicardCompiled:true,actualOrderTwoSourceMajorantDerived:true,actualOrderTwoFiveMomentsCorrected:false,actualOrderTwoStressSupportChecked:false,nextPositiveOrderAllowed:false,allOrdersConstructed:false,originalN404Complete:false,originalN405Complete:false}});
  const result={...completed,G,program,roots,completedOrderOne:completed,secondInner:{system,values,partial,xi,F2at,U2at,lambda2,localOmega,pKnown,Htheta,Hz,F1,U1,v1,majorant,C2,K,tail,solutionNorm,naturalSolutionNorm:null}};
  preparedSecondOrders.set(result,{G,prefix:JSON.stringify(G.nodes),nodes:G.nodes.length,definitions:G.captureFunctionDefinitions(),data:JSON.stringify(result.secondInner),F2at,U2at,completed});return result;
}

export function assertActualSecondOrderInner(prepared){
  const r=preparedSecondOrders.get(prepared);
  if(!r||prepared.G!==r.G||JSON.stringify(r.G.nodes.slice(0,r.nodes))!==r.prefix||!r.G.functionDefinitionsUnchanged(r.definitions)||JSON.stringify(prepared.secondInner)!==r.data||prepared.secondInner.F2at!==r.F2at||prepared.secondInner.U2at!==r.U2at)fail('PREVIOUS_ORDER_INCOMPLETE','Use the unchanged actual second-order inner source generated after first-order moment completion.');
  assertActualFirstOrderCompleted(r.completed);return true;
}
export function prepareActualSecondOrderInnerProgram(input={},context={}){
  for(const k of Object.keys(input))if(!['sourceProfile','terms','bits','etaOrder'].includes(k))fail('INVALID_INPUT','Unknown actual n=2 source input '+k);
  const completed=prepareActualFirstOrderGlobalProgram({sourceProfile:input.sourceProfile,terms:0,bits:input.bits??128,etaOrder:0},context);
  return attachActualSecondOrderInner(completed,{terms:input.terms??0,bits:input.bits??128,etaOrder:input.etaOrder??2},context);
}
export function compileActualSecondOrderInnerProgram(input={},context={}){return prepareActualSecondOrderInnerProgram(input,context).program;}
