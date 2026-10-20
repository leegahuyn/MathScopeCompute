/** Exact finite coefficients of the ACTUAL nonlinear natural core.
 *
 * Unlike the fixed-error Bessel enclosure, both input functions are fully
 * expanded: A.21 is its complete actual outer pressure integral and g is
 * exp(Lambda*integral zeta)/CSelected. Parameter derivatives use actual
 * product/chain/Leibniz operations. No pressure or derivative oracle leaf
 * is introduced. The uniform analytic tail is separate from evaluation.
 */
import {ActualSourceExpressions} from './actual-global-source-expressions.mjs';
import {compileActualOuterAxialProgram} from './actual-global-source-outer.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

function importOuter(profileId){
  const outer=compileActualOuterAxialProgram({profileId,etaDerivativeOrder:0}),G=new ActualSourceExpressions(profileId);
  G.nodes=structuredClone(outer.nodes);G.lookup=new Map(G.nodes.map((n,i)=>[JSON.stringify([n.op,n.args]),i]));
  return {G,outer};
}

/** Every A.21 stage is retained, including the eta-independent exterior tail. */
function appendActualPressure(G,outer){
  const eta=G.var('eta'),h=G.parameter('h'),lambda=G.parameter('lambda'),Pstar=G.parameter('Pstar'),Tf=G.parameter('Tf'),co=G.parameter('co');
  const one=G.one,two=G.q(2),f=G.inv(G.add(one,G.pow(eta,2))),logf=G.log(f),alpha=G.neg(G.add(G.q(1,2),lambda)),terminalSlope=G.neg(G.add(G.q(1,2),h));
  const primitive=x=>{const z=G.fresh('actual_A21_step');return G.integral(G.step(z),z,G.zero,x);};
  const rho=G.mul(co,h),fo=x=>G.sub(one,G.mul(rho,G.sub(one,G.step(G.div(G.sub(x,one),two)))));
  function stageFormula(id,s){
    let delta,theta;
    if(id==='initial'){delta=G.sub(G.mul(G.q(1,10),s),G.mul(G.q(3,5),primitive(s)));theta=one;}
    else if(id==='axialDecay'){delta=G.mul(G.q(-1,2),s);theta=one;}
    else if(id==='entry'){delta=G.sub(G.mul(G.q(-1,2),s),G.mul(lambda,primitive(s)));theta=one;}
    else if(['reservedPower','pulse'].includes(id)){delta=G.mul(alpha,s);theta=one;}
    else if(id==='interpolation'){const cutoff=G.step(G.div(s,Tf));delta=G.sub(G.mul(alpha,s),G.mul(G.log(two),cutoff));theta=G.sub(one,cutoff);}
    else if(id==='angular'){delta=G.mul(alpha,s);theta=G.zero;}
    else if(id==='steepen'){delta=G.sub(G.mul(alpha,s),G.mul(G.sub(one,lambda),primitive(s)));theta=G.zero;}
    else if(id==='steepPower'){delta=G.mul(G.q(-3,2),s);theta=G.zero;}
    else if(id==='flatten'){delta=G.add(G.mul(G.q(-3,2),s),G.mul(G.sub(one,h),primitive(s)));theta=G.zero;}
    else if(id==='wait'){delta=G.mul(terminalSlope,s);theta=G.zero;}
    else if(id==='terminal'){delta=G.add(G.mul(terminalSlope,s),G.log(G.div(fo(s),G.sub(one,rho))));theta=G.zero;}
    else fail('INTERNAL_VALIDATION','Unknown actual A.21 source stage '+id);
    return {delta,theta};
  }
  const stages=[];
  for(const stage of outer.stages){
    const s=G.fresh('actual_A21_'+stage.id),{delta,theta}=stageFormula(stage.id,s),density=G.exp(G.mul(two,G.add(stage.logAStart,delta,G.mul(theta,logf)))),integral=G.integral(density,s,G.zero,stage.length);
    stages.push({id:stage.id,variable:s,integrand:density,lower:G.zero,upper:stage.length,integral,theta});
  }
  const initialInfinitePrefix=G.mul(G.q(5),G.pow(f,2)),last=outer.stages.at(-1),terminalInfiniteTail=G.div(G.exp(G.mul(two,last.logAEnd)),G.add(one,G.mul(two,h)));
  const pressureOverPstarSquared=G.mul(G.q(-1,2),G.add(initialInfinitePrefix,...stages.map(x=>x.integral),terminalInfiniteTail));
  const pressure=G.mul(G.pow(Pstar,2),pressureOverPstarSquared);
  return {pressure,pressureOverPstarSquared,eta,f,logf,stages,initialInfinitePrefix,terminalInfiniteTail,definition:{source:'A.21; PRESSURE_DATUM_INTERVAL.md section 1',integral:'-1/2 integral_(all log radius) E_id,sched^2 dy',omittedAngularBumps:'Exactly pressure-neutral by their actual defining root equations; no other stage is omitted.',fullExteriorTailIncluded:true,pressureApproximationUsed:false,pressureInputOracle:false,positiveTailReplacedByZero:false}};
}

export function prepareActualNaturalCoreProgram(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','degree'].includes(key))fail('INVALID_INPUT','Unknown exact nonlinear core input '+key);
  const profileId=input.sourceProfile??SOURCE_PROFILE_ID,degree=input.degree??4;
  if(!Number.isSafeInteger(degree)||degree<0||degree>64)fail('RESOURCE_LIMIT','The finite coefficient materializer accepts degrees 0..64; the analytic function definition and tail are not truncated by this budget.');
  const {G,outer}=importOuter(profileId),pressure=appendActualPressure(G,outer),eta=pressure.eta,Y=G.var('Y'),h=G.parameter('h'),j=G.parameter('j0'),Lambda=G.parameter('Lambda'),sigma=G.parameter('sigmaStar'),C=G.parameter('CSelected');
  const A=G.add(G.q(1,2),h),D=G.sub(G.q(1,2),h),d=G.sub(G.one,G.pow(eta,2)),L=G.sub(G.one,G.mul(G.q(2),h,G.pow(eta,2))),invLambda=G.inv(Lambda),invL=G.inv(L),Us=G.add(G.mul(G.q(4),eta),j);
  const Hs=G.add(G.mul(D,eta),G.mul(d,Us)),Ws=G.sub(G.sub(G.one,G.mul(G.q(4),d)),G.mul(G.q(2),D,eta,Us)),den=G.add(G.pow(Hs,2),G.pow(sigma,2)),chi=G.div(G.pow(Hs,2),den),zeta=G.neg(G.div(G.mul(L,Hs),den));
  const z=G.fresh('actual_g_eta'),psi=G.integral(G.substitute(zeta,eta,z),z,G.zero,eta),g=G.div(G.exp(G.mul(Lambda,psi)),C),g2=G.pow(g,2);
  const P=pressure.pressure,Z=G.add(G.neg(G.mul(A,G.sub(G.one,G.mul(G.q(2),eta,Us)),Us)),G.neg(G.mul(G.q(4),Hs)),G.neg(G.mul(d,G.derivative(P,eta))),G.mul(G.q(4),A,eta,P));
  const phi=[G.one],u=[G.zero],R1=[],R2=[];
  const convolution=(a,b,n)=>G.add(...Array.from({length:n+1},(_,k)=>G.mul(a[k]??G.zero,b[n-k]??G.zero)));
  const derivative=rows=>rows.map(x=>G.derivative(x,eta)),radialDot=rows=>rows.map((x,k)=>G.mul(G.q(k),x));
  for(let n=0;n<degree;n++){
    context.checkCancelled?.();
    const avg=u.map((x,k)=>G.div(x,G.q(k+1))),Wcorr=avg.map(x=>G.sub(G.neg(G.mul(G.q(2),D,eta,x)),G.mul(d,G.derivative(x,eta))));
    const W=Wcorr.map((x,k)=>G.add(G.mul(invLambda,x),k===0?Ws:G.zero)),U=u.map((x,k)=>G.add(G.mul(invLambda,x),k===0?Us:G.zero)),Hc=u.map((x,k)=>G.add(G.mul(invLambda,d,x),k===0?Hs:G.zero));
    const pref=Array.from({length:n+1},(_,k)=>G.add(W[k],G.mul(h,G.sub(k===0?G.one:G.zero,G.mul(G.q(2),eta,U[k]))),G.mul(d,u[k],zeta)));
    const r1=G.mul(invL,G.add(convolution(pref,phi,n),convolution(W,radialDot(phi),n),convolution(Hc,derivative(phi),n)));
    const p=[G.zero,...Array.from({length:n},(_,k)=>G.div(G.mul(g2,convolution(phi,phi,k)),G.q(k+1)))];
    const alpha=G.add(G.mul(A,G.sub(G.one,G.mul(G.q(4),eta,Us))),G.mul(G.q(4),d));
    const r2=G.mul(invL,G.add(G.mul(alpha,u[n]),G.neg(G.mul(G.q(2),A,eta,invLambda,convolution(u,u,n))),convolution(W,radialDot(u),n),G.mul(Hs,G.derivative(u[n],eta)),G.mul(d,invLambda,convolution(u,derivative(u),n)),G.neg(G.mul(G.q(4),A,eta,p[n])),G.mul(d,G.derivative(p[n],eta)),G.neg(G.mul(G.q(2*n),eta,p[n]))));
    R1.push(r1);R2.push(r2);
    phi.push(G.div(G.add(G.neg(G.mul(chi,phi[n])),G.mul(invLambda,r1)),G.q(2*(n+1)*(n+2))));
    u.push(G.div(G.add(n===0?G.neg(G.mul(invL,Z)):G.zero,G.mul(invLambda,r2)),G.q(2*(n+1)**2)));
  }
  const p=[G.zero,...Array.from({length:degree},(_,k)=>G.div(G.mul(g2,convolution(phi,phi,k)),G.q(k+1)))],average=u.map((x,k)=>G.div(x,G.q(k+1)));
  const polynomial=rows=>G.add(...rows.map((c,n)=>G.mul(c,G.pow(Y,n)))),phiPartial=polynomial(phi),uPartial=polynomial(u),pPartial=polynomial(p),averagePartial=polynomial(average);
  const rootFields={eta,Y,h,j0:j,Lambda,sigmaStar:sigma,CSelected:C,A,D,d,L,Ustar:Us,Hstar:Hs,Wstar:Ws,Zstar:Z,chi,zeta,psi,g,gSquared:g2,P0:P,P0OverPstarSquared:pressure.pressureOverPstarSquared};
  const roots={...rootFields,PhiPartial:phiPartial,uPartial,pressurePrimitivePartial:pPartial,averagePartial,physicalUPartial:G.add(Us,G.mul(invLambda,uPartial)),physicalFPartial:G.mul(g,phiPartial),physicalAverageUPartial:G.add(Us,G.mul(invLambda,averagePartial)),physicalPiPartial:G.add(P,G.mul(invLambda,pPartial))};
  const program=G.pack(roots,{
    schema:'MathScope.ActualSourceFunctionProgram/1',construction:'Actual same-N3 nonlinear natural coefficient recurrence with complete A.21 input and exact positive g primitive.',
    degree,coefficients:{Phi:phi,u,p,average},remainders:{R1,R2},pressureProgram:{...pressure,eta:undefined,f:undefined,logf:undefined},
    recurrence:{source:'SAME_DATUM_ANALYTIC_AXIS.md section 8, (18)-(20); original B.14-B.15',initial:{Phi:'1',u:'0',p:'0'},Phi:'Phi_(n+1)=(-chi*Phi_n+Lambda^-1*(R1)_n)/(2(n+1)(n+2))',u:'u_(n+1)=(-L^-1*Zstar*[n=0]+Lambda^-1*(R2)_n)/(2(n+1)^2)',p:'p_(n+1)=g^2*sum_(i=0)^n Phi_i Phi_(n-i)/(n+1)',higherEtaDerivativeTruncated:false,finiteArithmeticRoundoff:'0 for this exact expression graph; no numeric transcendental enclosure is asserted'},
    analyticTail:{coefficientNormUpper:'Q',coefficientSpace:'Original B_rho with radial base 20',etaRadius:'rho=sigmaStar^2/65536',pointDomain:{Y:['0','41/10'],eta:['-1','1']},bound:'Q*rho^-m*m!/(m+1)^2 * sum_(n>N) binom(n+m,m)*(n)_k*Y^(n-k)/(20^n*(n+1)^2)',ratioUpper:'(Y/20)*(N+2+m)/(N+2-k)',tailComputation:'If ratio<1, first positive term divided by 1-ratio bounds the complete tail. Increase N until the requested exact error inequality holds; the coefficient materializer has an explicit resource budget.',fixedBesselOrPressureErrorFloor:false,convergenceForEveryFixedDerivativeOrder:true,tailNumericallyEvaluated:false},
    scope:{actualPressureDefinitionFullyExpanded:true,actualPositiveGDefinitionFullyExpanded:true,actualNonlinearFiniteCoefficientsGenerated:true,coefficientEtaDerivativesExpanded:true,comparisonCoefficientsRelabeledAsActual:false,finiteActualCoefficientsNumericallyEvaluated:false,wholeNaturalFunctionNumericallyEvaluated:false,completeGlobalSourceProgram:false,originalN404Complete:false,newLeanKernelProof:false}
  });
  return {G,program,pressure,outer,rootFields,coefficients:{Phi:phi,u,p,average}};
}

export function compileActualNaturalCoreProgram(input={},context={}){return prepareActualNaturalCoreProgram(input,context).program;}
