/** The actual same-N3 outer axial field after the completed I1 restoration.
 * The amplitude is an explicit quadratic root of the complete source energy
 * polynomial. Its coefficients include the angular pressure-neutral repair,
 * both affine M/J corrections, the terminal wait, and the infinite power tail.
 * No historical numeric profile or externally supplied coefficient is used.
 */
import {ActualSourceExpressions} from './actual-global-source-expressions.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';

export function compileActualOuterAxialProgram({profileId=SOURCE_PROFILE_ID,etaDerivativeOrder=2}={}){
  if(!Number.isSafeInteger(etaDerivativeOrder)||etaDerivativeOrder<0||etaDerivativeOrder>2)throw Error('The outer source program currently expands eta derivatives through order two.');
  const d=new ActualSourceExpressions(profileId),z=d.zero,o=d.one,q=(a,b=1)=>d.q(a,b),sum=(...a)=>d.add(...a),mul=(...a)=>d.mul(...a),sub=(a,b)=>d.sub(a,b),div=(a,b)=>d.div(a,b),exp=a=>d.exp(a),sq=a=>d.pow(a,2),neg=a=>d.neg(a),eta=d.var('eta'),t=d.var('t'),xi=d.var('xi');
  const Md=d.parameter('Md'),T=d.parameter('T'),B=d.parameter('BOuter'),lam=d.parameter('lambda'),h=d.parameter('h'),P=d.parameter('Pstar'),logP=d.parameter('logP'),XR=d.parameter('XR'),Tf=d.parameter('Tf'),co=d.parameter('co');
  const f=div(o,sum(o,sq(eta))),logf=d.log(f),D=sub(q(1,2),h),A=sum(q(1,2),h),L=sub(o,mul(q(2),h,sq(eta))),dd=sub(o,sq(eta));
  const S=x=>{if(x===z)return z;if(x===o)return q(1,2);const v=d.fresh('sigmaIntegral');return d.integral(d.step(v),v,z,x);};
  const integral=(fn,a,b,prefix='s')=>{const s=d.fresh(prefix);return d.integral(fn(s),s,a,b);};
  const step=x=>d.step(x),beta=(x,c)=>mul(q(10,3),d.step(sum(mul(q(10,3),sub(x,c)),q(1,2)),1));
  const R0=x=>{
    const v=d.fresh('r0Primitive'),begin=d.integral(step(mul(q(50),v)),v,z,x);
    const primitive=d.choose(x,z,q(1,50),z,begin,sub(x,q(1,100)));
    return mul(primitive,sub(o,step(sub(x,q(10)))));
  };
  const mainPulseIntegral=(fn,prefix)=>sum(...[[z,q(1,50)],[q(1,50),q(10)],[q(10),q(11)]].map(([a,b])=>integral(fn,a,b,prefix)));
  const compactPrefix=(fn,left,right,end,prefix)=>{
    const whole=integral(fn,left,right,prefix),partial=integral(fn,left,end,prefix);
    return d.choose(end,left,right,z,partial,whole);
  };
  const bumpIntegral=(exponent,offset=z,square=false)=>integral(s=>mul(exp(mul(exponent,sum(s,offset))),square?sq(beta(s,z)):beta(s,z)),q(-3,20),q(3,20),'bump');
  const exponentialIntegral=(rate,len)=>rate===z?len:div(sub(exp(mul(rate,len)),o),rate);

  // Literal A.2 outer E schedule. logA does not include log(Pstar) or theta log f.
  const stages=[];let y=z,logA=z;
  function stage(id,length,delta,theta=o,slope=null){
    const start=y,logAStart=logA,s=d.fresh(id),thetaAt=typeof theta==='function'?theta(s):theta;
    let energy;
    if(slope!==null){const rate=sum(o,mul(q(2),slope));energy=mul(exp(sum(start,mul(q(2),logAStart),mul(q(2),thetaAt,logf))),exponentialIntegral(rate,length));}
    else energy=mul(exp(sum(start,mul(q(2),logAStart))),d.integral(exp(sum(s,mul(q(2),delta(s)),mul(q(2),thetaAt,logf))),s,z,length));
    y=sum(y,length);logA=sum(logA,delta(length));
    const row={id,start,end:y,length,logAStart,logAEnd:logA,energy,theta:thetaAt,localCoordinate:s};stages.push(row);return row;
  }
  stage('initial',o,s=>sub(mul(q(1,10),s),mul(q(3,5),S(s))));
  stage('axialDecay',T,s=>mul(q(-1,2),s),o,q(-1,2));
  stage('entry',o,s=>sub(mul(q(-1,2),s),mul(lam,S(s))));
  const alpha=neg(sum(q(1,2),lam)),Tw=mul(q(60),B),power=stage('reservedPower',Tw,s=>mul(alpha,s),o,alpha);
  const pulse=stage('pulse',div(q(13),lam),s=>mul(alpha,s),o,alpha);
  stage('interpolation',Tf,s=>sub(mul(alpha,s),mul(d.log(q(2)),step(div(s,Tf)))),s=>sub(o,step(div(s,Tf))));
  const angular=stage('angular',mul(q(30),B),s=>mul(alpha,s),z,alpha);
  stage('steepen',o,s=>sub(mul(alpha,s),mul(sub(o,lam),S(s))),z);
  const holdLength=mul(q(-4),d.log(h));stage('steepPower',holdLength,s=>mul(q(-3,2),s),z,q(-3,2));
  stage('flatten',o,s=>sum(mul(q(-3,2),s),mul(sub(o,h),S(s))),z);

  // A.13 wait, with the actual scalar Q ODE solved by its integrating factor.
  const a=sub(o,lam),Q0=div(sub(lam,h),a),Ast=s=>mul(a,sub(s,S(s)));
  const Qsteep=mul(exp(neg(mul(a,q(1,2)))),sum(Q0,integral(s=>mul(exp(Ast(s)),sub(sum(lam,mul(a,step(s))),h)),z,o,'Qsteep')));
  const Qhold=sum(Qsteep,mul(sub(o,h),holdLength));
  const Qb=mul(exp(neg(mul(sub(o,h),q(1,2)))),sum(Qhold,integral(s=>mul(exp(mul(sub(o,h),S(s))),sub(o,h),sub(o,step(s))),z,o,'Qflatten')));
  const rho=mul(co,h),fo=s=>sub(o,mul(rho,sub(o,step(div(sub(s,o),q(2))))));
  const Qp=integral(s=>div(mul(exp(mul(sub(o,h),s)),rho,d.step(div(sub(s,o),q(2)),1)),mul(q(2),sub(o,rho))),o,q(3),'Qterminal');
  const wait=div(d.log(div(Qb,Qp)),sub(o,h)),terminalSlope=neg(sum(q(1,2),h));
  stage('wait',wait,s=>mul(terminalSlope,s),z,terminalSlope);
  stage('terminal',q(3),s=>sum(mul(terminalSlope,s),d.log(div(fo(s),sub(o,rho)))),z);
  const infiniteTailEnergy=div(exp(sum(y,mul(q(2),logA))),mul(q(2),h));

  // Actual angular root: eliminate the linear row, solve the remaining quadratic
  // on its unique small branch. This does not invoke an unimplemented root oracle.
  const rInitial=mul(exp(q(-13,10)),sum(q(5,8),integral(s=>exp(sub(mul(q(8,5),s),mul(q(3,5),S(s)))),z,o,'rInitial')));
  const rDecay=sum(o,mul(sub(rInitial,o),exp(neg(T))));
  const rEntry=mul(exp(sum(q(-1),mul(lam,q(1,2)))),sum(rDecay,integral(s=>exp(sub(s,mul(lam,S(s)))),z,o,'rEntry')));
  const rEq=div(o,a),rBefore=sum(rEq,mul(sub(rEntry,rEq),exp(neg(mul(a,sum(Tw,pulse.length))))));
  const bEta=d.log(mul(q(2),f));
  const rAfter=mul(exp(sum(neg(mul(a,Tf)),bEta)),sum(rBefore,integral(s=>exp(sub(mul(a,s),mul(bEta,step(div(s,Tf))))),z,Tf,'rInterpolation')));
  const angularCenters=[sub(angular.length,q(3)),sub(angular.length,o)],angularDebt=neg(mul(sub(rAfter,rEq),exp(neg(mul(a,angularCenters[0])))));
  const b=neg(sum(o,mul(q(2),lam))),BA=bumpIntegral(a),BB=bumpIntegral(b);
  const angularLinear=[[BA,mul(BA,exp(mul(q(2),a)))],[mul(q(2),BB),mul(q(2),BB,exp(mul(q(2),b)))]];
  const angularQuadratic=[bumpIntegral(b,z,true),bumpIntegral(b,q(2),true)];
  const ratio=div(angularLinear[0][1],angularLinear[0][0]),target=div(angularDebt,angularLinear[0][0]);
  const aq=sum(mul(angularQuadratic[0],sq(ratio)),angularQuadratic[1]);
  const bq=sub(sub(angularLinear[1][1],mul(angularLinear[1][0],ratio)),mul(q(2),angularQuadratic[0],target,ratio));
  const cq=sum(mul(angularLinear[1][0],target),mul(angularQuadratic[0],sq(target)));
  const discr=sub(sq(bq),mul(q(4),aq,cq)),angularC2=div(mul(q(-2),cq),sub(bq,d.sqrt(discr))),angularC1=sub(target,mul(ratio,angularC2)),angularCoefficients=[angularC1,angularC2];
  const angularEnergyChange=sum(...angularCoefficients.map((c,j)=>mul(exp(sum(angular.start,mul(q(2),angular.logAStart),mul(q(-2),lam,angularCenters[0]))),sum(mul(q(2),c,bumpIntegral(mul(q(-2),lam),q(2*j))),mul(sq(c),bumpIntegral(mul(q(-2),lam),q(2*j),true))))));
  const totalOuterEnergy=sum(mul(q(5,6),sq(f)),...stages.map(s=>s.energy),infiniteTailEnergy,angularEnergyChange);

  // Exact pre-pulse M, J, U². Flatness makes the last eleven decay units zero.
  const k=s=>mul(q(4),sub(o,step(div(d.log(sum(o,s)),Md)))),kEnd=sub(exp(Md),o),K1=integral(s=>mul(exp(s),k(s)),z,kEnd,'K1'),K2=integral(s=>mul(exp(s),sq(k(s))),z,kEnd,'K2');
  const Mshape=mul(exp(o),sum(q(4),K1)),U2shape=mul(exp(o),sum(q(16),K2));
  const Jinit=integral(s=>exp(sub(mul(q(8,5),s),mul(q(3,5),S(s)))),z,o,'Jinitial'),Jshape=sum(q(5,2),mul(q(4),Jinit),mul(exp(q(13,10)),K1));
  const mConst=mul(XR,Mshape),Xp=mul(XR,exp(pulse.start)),Ep=mul(P,exp(pulse.logAStart),f),centers=[sub(pulse.length,q(3)),sub(pulse.length,o)],slopes=[sub(q(1,2),lam),sub(q(1,2),mul(q(2),lam))];
  const pulseMatrix=slopes.map(s=>{const b=bumpIntegral(s);return [b,mul(b,exp(mul(q(2),s)))];});
  const incoming=[
    neg(mul(eta,Mshape,exp(neg(sum(pulse.start,logP,pulse.logAStart,logf,mul(slopes[0],centers[0])))))),
    neg(mul(eta,Jshape,exp(neg(sum(mul(q(3,2),pulse.start),logP,mul(q(2),pulse.logAStart),logf,mul(slopes[1],centers[0]))))))
  ];
  const perAmplitude=slopes.map(s=>neg(mainPulseIntegral(w=>div(mul(exp(sum(mul(div(s,lam),sub(w,q(13))),mul(q(3),s))),R0(w)),lam),'pulseDebt')));
  const determinant=sub(mul(pulseMatrix[0][0],pulseMatrix[1][1]),mul(pulseMatrix[0][1],pulseMatrix[1][0]));
  const solve=rhs=>[div(sub(mul(rhs[0],pulseMatrix[1][1]),mul(pulseMatrix[0][1],rhs[1])),determinant),div(sub(mul(pulseMatrix[0][0],rhs[1]),mul(rhs[0],pulseMatrix[1][0])),determinant)];
  const affineConstant=solve(incoming),affineAmplitude=solve(perAmplitude);
  const KbPrimitive=x=>{const v=sub(x,q(1,100));return mul(exp(mul(q(-2),x)),sum(mul(q(1,2),sq(v)),mul(q(1,2),v),q(1,4)));};
  const Kb=sum(integral(w=>mul(exp(mul(q(-2),w)),sq(R0(w))),z,q(1,50),'KbStart'),sub(KbPrimitive(q(1,50)),KbPrimitive(q(10))),integral(w=>mul(exp(mul(q(-2),w)),sq(R0(w))),q(10),q(11),'KbEnd'));
  const normalizedUPre=mul(lam,sq(eta),U2shape,exp(neg(sum(pulse.start,mul(q(2),logP),mul(q(2),pulse.logAStart),mul(q(2),logf)))));
  const normalizedE=mul(lam,totalOuterEnergy,exp(neg(sum(pulse.start,mul(q(2),pulse.logAStart),mul(q(2),logf)))));
  const weights=centers.map(c=>mul(lam,exp(mul(q(-2),lam,c)),bumpIntegral(mul(q(-2),lam),z,true)));
  const amp0=sum(normalizedUPre,mul(q(-1,2),normalizedE),...weights.map((w,j)=>mul(w,sq(affineConstant[j]))));
  const amp1=sum(...weights.map((w,j)=>mul(q(2),w,affineConstant[j],affineAmplitude[j])));
  const amp2=sum(Kb,...weights.map((w,j)=>mul(w,sq(affineAmplitude[j]))));
  const amplitude=div(sub(d.sqrt(sub(sq(amp1),mul(q(4),amp2,amp0))),amp1),mul(q(2),amp2));
  const correction=affineConstant.map((c,j)=>sum(c,mul(amplitude,affineAmplitude[j])));

  // The exact final source agrees with this U/M after I1 has restored all moments.
  // Heat compensation changes E only and has no effect on U, M, or Omega here.
  const X=mul(Xp,exp(t)),Et=mul(Ep,exp(mul(alpha,t))),Rt=sum(mul(amplitude,R0(mul(lam,t))),...correction.map((c,j)=>mul(c,beta(t,centers[j])))),Ut=mul(Et,Rt);
  const mainPrefix=sum(...[[z,q(1,50)],[q(1,50),q(10)],[q(10),q(11)]].map(([a,b])=>compactPrefix(w=>div(mul(exp(mul(div(slopes[0],lam),w)),R0(w)),lam),a,b,mul(lam,t),'MmainPrefix')));
  const bumpPrefixes=centers.map(c=>compactPrefix(s=>mul(exp(mul(slopes[0],s)),beta(s,c)),sub(c,q(3,20)),sum(c,q(3,20)),t,'MbumpPrefix'));
  const Mt=sum(mul(eta,mConst),mul(Xp,Ep,sum(mul(amplitude,mainPrefix),...correction.map((c,j)=>mul(c,bumpPrefixes[j])))));
  const Msegment=d.choose(t,z,pulse.length,mul(eta,mConst),Mt,z),Usegment=d.choose(t,z,pulse.length,z,Ut,z);
  const Meta=d.derivative(Msegment,eta),V=div(sub(sub(mul(q(2),eta,X,Usegment),mul(q(2),D,eta,Msegment)),mul(dd,Meta)),L);
  const Vy=d.derivative(V,t),Vyy=d.derivative(Vy,t),Veta=d.derivative(V,eta);
  const omega=sum(div(sum(mul(D,eta,Veta),Vy,mul(Usegment,sub(mul(dd,Veta),mul(q(2),eta,Vy)))),L),div(sub(mul(V,sub(Vy,mul(q(1,2),V))),mul(q(2),sub(Vyy,Vy))),X));
  const pulseOmega=d.substitute(omega,t,xi);
  const pulsePressureDebt=mul(q(-1,2),d.integral(pulseOmega,xi,z,pulse.length));
  const pulseFluxDebt=mul(q(1,2),d.integral(mul(pulseOmega,Xp,exp(xi)),xi,z,pulse.length));
  const meanPressureDebt=mul(div(sq(mConst),mul(q(4),Xp)),sub(exp(q(20)),o)),meanFluxDebt=mul(q(-5),sq(mConst));
  const Xv=mul(Xp,exp(pulse.length)),tailStart=mul(Xp,exp(q(-20)));
  const roots={U:Usegment,M:Msegment,V,Omega0:omega,amplitude,Kb,mConst,Xp,Ep,Xv,tailStart,meanPressureDebt,meanFluxDebt,pulsePressureDebt,pulseFluxDebt,outerPressureDebt:sum(meanPressureDebt,pulsePressureDebt),outerFluxDebt:sum(meanFluxDebt,pulseFluxDebt),Qb,Qp,terminalWait:wait,totalOuterEnergy,R0:R0(xi)};
  for(const [name,root]of Object.entries({U:Usegment,M:Msegment,V,amplitude})){let v=root;for(let n=1;n<=etaDerivativeOrder;n++){v=d.derivative(v,eta);roots[name+'_eta'+n]=v;}}
  const equations={angular:{linear:angularLinear,quadratic:angularQuadratic,target:[angularDebt,z],coefficients:angularCoefficients,smallRootRadius:mul(q(1024),d.pow(lam,29)),smallRootBranch:'bq<0; c2=-2*cq/(bq-sqrt(bq^2-4*aq*cq)); c1=target-ratio*c2'},pulse:{linear:pulseMatrix,determinant,incoming,perAmplitude,affineConstant,affineAmplitude,coefficients:correction,amplitudePolynomial:[amp0,amp1,amp2],amplitude,selectedRootBracket:['9/10','6/5'],sourceDerivativeFloor:'7/20'}};
  return d.pack(roots,{profileId,coordinate:{t:'log(X/Xp)',eta:'source eta',xi:'lambda*t when observing the main pulse'},stages,equations,energyNormalization:{totalOuterEnergy:'Integral E_ref^2/(XR*Pstar^2) for the literal A.2 reference prefix and outer schedule, including the angular correction and full exterior power tail.',pairedUse:'The amplitude equation uses this reference energy together with its matching reference U^2 prefix. B.8 preserves their combination S=integral(U^2-E^2/2), not each energy separately.',equalsFinalGlobalESquaredIntegral:false},support:{tailStartExpression:'I1Right=Xp*exp(-20)',XpExpression:'XR*exp(T+2+60*BOuter)',XvExpression:'Xp*exp(13/lambda)',tailDomain:['I1Right','Xv'],sameActualAxialFieldOnTail:true,UAndMAndVIdenticallyZeroAfterXv:true,endpointIndependentOfEta:true,outerEHeatCorrectionIrrelevantForTheseAxialFunctionals:true},scope:{completeActualOuterTailFunctionDefinitionCompiled:true,rootDefinitionsExpandedToElementaryAndIntegralOperations:true,ordinaryEtaDerivativesExpandedThrough:etaDerivativeOrder,completeActualGlobalU0Compiled:false,completeActualGlobalMomentDebtsEvaluated:false,outerTailIntegralsNumericallyEvaluated:false,hugeParameterValuesMaterialized:false,noNamedRootOrFieldOrDerivativeOracle:true,N4_04_Complete:false},sourceEquations:['A.2','A.11','A.13','A.19','4.7','5.6'],interpretation:'Exact computable real-function expression program. The diagnostic binary64 interpreter has explicit resource limits and is not a complete evaluated interval oracle for the actual scales.'});
}
