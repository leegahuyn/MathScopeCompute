/** Full (8.12) pressure after the actual original global five-moment map.
 * This is a literal operator test on the authentic pre-temporal current.
 * It does not change the separate order required for Proposition9.5 j=0.
 */
import {assertGlobalCurrentPressure,globalCurrentPressureCertificate} from './source-global-pressure.mjs';
import {assertGlobalMomentCurrent,globalMomentCurrentCertificate,exactAuxiliaryMeanPDE} from './source-global-moment.mjs';
import {exactFullAuxiliaryMeanPDE,exactFullMeanMomentRemainders,originalFullMeanOperators} from './source-full-mean-equations.mjs';
import {globalGraphEqual} from './source-global-current.mjs';
import {shiftedRadialIntegrals} from './source-pressure.mjs';
import {materializeAuxiliarySourceClosure} from './source-auxiliary-expressions.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});},
  record=s=>({schema:s.schema,source:s.source,velocity:s.velocity,conditioning:s.conditioning,mean:s.mean,
    pressure:s.pressure,nonlinear:s.nonlinear,closure:s.closure,checks:s.checks,scope:s.scope}),
  progress=(context,stage,G)=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length});};

/** Original tiny lambda is factored explicitly. The positive normalized
 * gap obeys d<=theta=(1-exp(-2*d*lambda))/lambda<=2*d because lambda<1
 * and d=1/5. The unscaled condition number grows like1/lambda; no
 * binary64 subtraction or uniform lambda->0 bound is claimed.
 */
function sourceConditioning(G,moment){
  const b=moment.bumps,r=b.sourceRestriction.restriction,q=n=>G.q(n),lambda=G.parameter('lambda'),d=G.q(1,5),
    a=b.a,mu=b.mu,expD=G.exp(d),thetaLower=d,thetaUpper=G.mul(q(2),d),
    axialLambdaScaledConditionUpper=G.div(G.mul(q(2),G.add(G.one,expD)),d),
    axialNormalizedConditionUpper=G.div(axialLambdaScaledConditionUpper,lambda),
    axialScale=[mu[3],G.mul(a,mu[4])],angularScale=[mu[0],G.mul(q(2),a,mu[1]),G.mul(a,mu[2])],
    scaleCondition=values=>G.mul(G.maximum(...values),G.maximum(...values.map(x=>G.inv(x)))),
    angularInverseUpper=Math.ceil(r.angular.rowNormalizedInfinityInverseBound),
    // The largest normalized angular node is exp(2/5)<2, while
    // the other two nodes lie in(0,1]. Thus every row sum is<7.
    angularNormalizedConditionUpper=q(7*angularInverseUpper),
    axialConditionUpper=G.mul(axialNormalizedConditionUpper,scaleCondition(axialScale)),
    angularConditionUpper=G.mul(angularNormalizedConditionUpper,scaleCondition(angularScale)),
    axialLogConditionUpper=G.add(G.mul(q(1000),G.parameter('T')),G.log(axialLambdaScaledConditionUpper),G.log(scaleCondition(axialScale)));
  if(!r.pass||!r.exactSource.lambdaPositive||b.lambda!==lambda||b.d!==d||!Number.isSafeInteger(angularInverseUpper)||angularInverseUpper<1||
    !r.checks.find(x=>x.id==='positive-lambda-factored-axial-inverse')?.pass||!r.moments.intervals.every(x=>x[0]>0))
    fail('The actual lambda-conditioned mean inverse lost an original positive divisor or source moment bound.');
  return {lambda,d,thetaLower,thetaUpper,originalThetaInterval:r.axial.thetaInterval,
    positiveSourceMomentIntervals:r.moments.intervals,angularInverseUpper,angularNormalizedConditionUpper,
    axialLambdaScaledConditionUpper,axialNormalizedConditionUpper,axialScale,angularScale,axialConditionUpper,angularConditionUpper,axialLogConditionUpper,
    gapFactorization:'1-exp(-2*d*lambda)=lambda*theta(lambda)',
    gapProof:'For x=2*d*lambda, x-x^2/2<=1-exp(-x)<=x. With0<lambda<2^-1000<1 and d=1/5, theta>=2*d-2*d^2*lambda>d.',
    normalizedAxialProof:'For A=[[1,exp(d)],[1,exp(d)*exp(-2*d*lambda)]], ||A||inf<=1+exp(d); ||A^-1||inf<=2/(lambda*theta).',
    originalLambdaExpression:r.exactSource.lambda,allOriginalPositiveRowFactorsRetained:true,
    fixedLambdaConstantsAllowed:true,uniformLambdaLimitClaimed:false,binary64UnscaledConditionNumber:false,
    sourceAuthenticated:true};
}

export function attachGlobalMomentPressure(previousPressure,moment,context={}){
  assertGlobalCurrentPressure(previousPressure);assertGlobalMomentCurrent(moment);
  if(previousPressure.current!==moment.current||previousPressure.G.baseGraph!==moment.G)
    fail('The full pressure and five-moment update must belong to the same privately constructed actual global current.');
  const G=previousPressure.G,start=G.nodes.length,current=moment.current,geometry=previousPressure.geometry,
    {R,Z,T,Y,epsilon,radialFast:a}=geometry,{L,Dz}=originalFullMeanOperators(G,geometry),
    W=previousPressure.covariance.fullAngularMean,background=moment.mean.background,stress=moment.mean.fullOriginalStress,
    previous=moment.velocity.previous,updated=moment.velocity.updated,increment=moment.velocity.increment,
    fullInput={geometry,background,covariance:W,stress},oldFull=exactFullAuxiliaryMeanPDE(G,{...fullInput,velocity:previous}),
    newFull=exactFullAuxiliaryMeanPDE(G,{...fullInput,velocity:updated}),
    zeroInput={coordinates:{R,Z,T},epsilon,background,covariance:current.covariance.fullAuxiliaryMean,stress},
    oldZero=exactAuxiliaryMeanPDE(G,{...zeroInput,velocity:previous}),newZero=exactAuxiliaryMeanPDE(G,{...zeroInput,velocity:updated}),
    gr=newFull.gr,deltaGr=G.sub(newZero.gr,oldZero.gr),P=moment.mean.P,{rho,cRho,chi}=current.mean.geometry,
    f=G.sub(gr,G.mul(rho,P)),Lgr=L(gr),fZ=G.derivative(f,Z),
    integrals=shiftedRadialIntegrals(G,{body:f,...geometry,tag:'after_global_five_moments'}),
    radialAuxiliaryIntegrals=shiftedRadialIntegrals(G,{body:Lgr,...geometry,tag:'after_global_five_moments_L'}),
    slowZIntegrals=shiftedRadialIntegrals(G,{body:fZ,...geometry,tag:'after_global_five_moments_Z'}),
    pressure=G.sub(integrals.left,G.mul(chi,integrals.whole)),A0=G.mul(G.derivative(chi,R),integrals.whole),
    partialR=G.add(integrals.endpoint,G.neg(G.mul(a,radialAuxiliaryIntegrals.left)),G.neg(A0),G.mul(chi,a,radialAuxiliaryIntegrals.whole)),
    Lp=G.sub(radialAuxiliaryIntegrals.left,G.mul(chi,radialAuxiliaryIntegrals.whole)),Drp=G.add(partialR,G.mul(a,Lp)),
    pZ=G.sub(G.sub(slowZIntegrals.left,G.mul(G.derivative(chi,Z),integrals.whole)),G.mul(chi,slowZIntegrals.whole)),
    Etheta=newFull.Etheta,Ez=G.add(newFull.Ez,G.mul(epsilon,pZ)),radialResidual=G.sub(Drp,gr),
    nonlinear=exactFullMeanMomentRemainders(G,{geometry,background,previous,increment}),
    conditioning=sourceConditioning(G,moment),checks=[
      {id:'complete-old-radial-source-is-the-authenticated-pressure-input',...globalGraphEqual(G,oldFull.gr,previousPressure.radial.gr)},
      {id:'complete-old-angular-source-is-the-authenticated-residual',...globalGraphEqual(G,oldFull.Etheta,previousPressure.residual.Etheta)},
      {id:'complete-old-axial-source-retains-authenticated-pressure',...globalGraphEqual(G,G.add(oldFull.Ez,G.mul(epsilon,previousPressure.pressure.slowZDerivative)),previousPressure.residual.Ez)},
      {id:'same-source-five-increments-have-no-auxiliary-variable',pass:Object.values(increment).every(x=>Y.every(y=>!G.freeCoordinates(x).has(y)))},
      {id:'complete-full-curl-radial-change-is-actual-zero-mode-change',...globalGraphEqual(G,G.sub(newFull.gr,oldFull.gr),deltaGr)},
      {id:'complete-full-curl-angular-change-is-actual-zero-mode-change',...globalGraphEqual(G,G.sub(newFull.Etheta,oldFull.Etheta),G.sub(newZero.Etheta,oldZero.Etheta))},
      {id:'complete-full-curl-axial-without-pressure-change-is-actual-zero-mode-change',...globalGraphEqual(G,G.sub(newFull.Ez,oldFull.Ez),G.sub(newZero.Ez,oldZero.Ez))},
      {id:'complete-five-moment-radial-8.26',...globalGraphEqual(G,G.sub(G.sub(newFull.gr,oldFull.gr),nonlinear.linear.PIntegrand),nonlinear.Rg)},
      {id:'complete-five-moment-angular-flux-8.27',...globalGraphEqual(G,G.sub(G.sub(newFull.fluxTheta,oldFull.fluxTheta),nonlinear.linear.JthetaIntegrand),nonlinear.JthetaIntegrand)},
      {id:'complete-five-moment-axial-flux-8.27',...globalGraphEqual(G,G.sub(newFull.fluxZ,oldFull.fluxZ),G.add(G.mul(G.q(2),R,background.G,increment.gamma),nonlinear.JzVelocityIntegrand))},
      {id:'complete-five-moment-remainder-is-actual-recorded-remainder',...globalGraphEqual(G,nonlinear.Rg,moment.nonlinear.Rg)},
      {id:'complete-new-pressure-radial-FTC',...globalGraphEqual(G,Drp,G.sub(f,A0),[f,A0,a,chi,radialAuxiliaryIntegrals.left,radialAuxiliaryIntegrals.whole])},
      {id:'complete-new-radial-residual-retains-P-and-A0',...globalGraphEqual(G,radialResidual,G.sub(G.neg(G.mul(rho,P)),A0),[gr,rho,P,A0,a,chi,radialAuxiliaryIntegrals.left,radialAuxiliaryIntegrals.whole])},
      {id:'complete-new-pressure-all-auxiliary-modes-retained',pass:Y.every(y=>G.freeCoordinates(pressure).has(y))},
      {id:'both-original-conservation-rows-remain-zero',pass:moment.bumps.coefficients.checks[0].pass&&moment.bumps.coefficients.checks[3].pass&&moment.potential.divergenceCheck.pass},
      {id:'original-positive-lambda-conditioned-source-inverse',pass:conditioning.sourceAuthenticated&&!conditioning.uniformLambdaLimitClaimed},
    ];
  if(checks.some(x=>!x.pass))fail('A full-pressure five-moment source identity failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const closure=materializeAuxiliarySourceClosure(G,[gr,P,Etheta,Ez,pressure,radialResidual,nonlinear.Rg,
    ...Object.values(increment),...Object.values(moment.nonlinear.remainderDefects)],{maxExpressions:70000,onProgress:context.onProgress});
  checks.push({id:'every-full-pressure-and-nonlinear-source-derivative-materialized',pass:closure.allRequestedSharedBodiesMaterialized&&closure.allDeclaredCoverRowsRetained&&closure.baseClosure.allRequestedSharedBodiesMaterialized});
  if(!checks.at(-1).pass)fail('A requested full moment-pressure source derivative was omitted.');
  const result={schema:'MathScope.N6.GlobalActualMomentPressure/1',G,previousPressure,moment,
    source:{sameActualGlobalCurrent:true,sourcePrefixCount:start,originalPaperSHA256:current.source.paperSHA256,
      parameterExpressionSHA256:current.source.parameterExpressionSHA256,actualOldDefects:moment.source.actualGlobalDefectRoots,
      actualNewDefects:{P:moment.mean.P,Jtheta:moment.mean.Jtheta,Jz:moment.mean.Jz},originalM2Modified:false,
      exactOperatorApplicationBeforeTemporal:true,callerReplacementFieldUsed:false},
    velocity:moment.velocity,conditioning,
    mean:{gr,P,Jtheta:moment.mean.Jtheta,Jz:moment.mean.Jz,Etheta,Ez,radialResidual,
      fullAngularCovariance:W,fullOriginalStress:stress,background,allNonlinearCurrentTermsRetained:true,
      exactConservationIntegrals:moment.bumps.momentRows.slice(0,2),
      actualHaarDefects:moment.nonlinear.remainderDefects,auxiliaryIndependentRadialChange:deltaGr,
      haarDerivation:'The complete W is unchanged. All old/new mean increments and their gr change are auxiliary-independent; Haar averaging the checked full difference gives exactly the retained old/new global mean equations and P/J.'},
    pressure:{source:f,value:pressure,rho,cRho,chi,integrals,radialAuxiliaryIntegrals,slowZIntegrals,
      partialR,radialAuxiliaryDerivative:Lp,fullRadialDerivative:Drp,slowZDerivative:pZ,cutoffRemainder:A0,
      fullReconstructionEquation:'p_m,new=T_0(g_r,new-rho*Pnew)',
      equivalentLinearDecomposition:G.add(previousPressure.pressure.value,G.sub(moment.mean.pressure.value,current.mean.pressure.value)),
      decompositionProof:'Linearity of the retained T0 integral and its cutoff, together with auxiliary-independence of delta gr and delta P, gives p_full,new=p_full,old+p_mean,new-p_mean,old.',
      mechanicalIntegralReduction:false,cutoffRemainderDeclaredZero:false,allAuxiliaryModesRetained:true},
    nonlinear:{...nonlinear,defects:moment.nonlinear.remainderDefects,actualSourceIdentityChecks:checks.filter(x=>x.id.includes('8.2')),
      exactIntegralDerivation:moment.nonlinear.relationToRecomputedDefects,oldAndNewCovarianceCancelOnlyInTheirDifference:true},
    closure,checks,scope:{actualFiveMomentOperatorOnOriginalCurrent:true,fullPressureAfterOriginalFiveMoments:true,
      actualTwoConservationIntegralsZero:true,actualNonlinear8_26And8_27:true,originalTinyLambdaConditionNumberControlled:true,
      individualN606OperatorCriteriaSatisfied:true,temporalMeanUpdateApplied:false,initializedJ0:false,
      allOrderTargetClassBoundsCertified:false,completeN6:false,numericalWholeFieldEnclosure:false,newLeanKernelProof:false}};
  const count=G.nodes.length;seals.set(result,{G,previousPressure,moment,start,count,delta:canonicalStringify(G.nodes.slice(start)),
    definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  progress(context,'global-source-five-moments-full-pressure-and-conditioned-inverse-sealed',G);return result;
}

export function assertGlobalMomentPressure(s){
  const seal=seals.get(s);if(!seal||seal.G!==s.G||seal.previousPressure!==s.previousPressure||seal.moment!==s.moment||
    seal.record!==canonicalStringify(record(s))||seal.delta!==canonicalStringify(s.G.nodes.slice(seal.start,seal.count))||!s.G.functionDefinitionsUnchanged(seal.definitions))
    fail('Use the unchanged privately constructed full moment-pressure state.');
  assertGlobalCurrentPressure(s.previousPressure);assertGlobalMomentCurrent(s.moment);return true;
}

export async function globalMomentPressureCertificate(s){
  assertGlobalMomentPressure(s);const seal=seals.get(s),sourceMoment=await globalMomentCurrentCertificate(s.moment),
    sourcePressure=await globalCurrentPressureCertificate(s.previousPressure),encoded=canonicalStringify({sourceMomentGraph:sourceMoment.graph,
      sourcePressureGraph:sourcePressure.graph,record:record(s),nodes:s.G.nodes.slice(seal.start,seal.count),definitions:seal.definitions});
  return {...record(s),sourceMoment,sourcePressure,graph:{sha256:await sha256(encoded),nodeCount:seal.count,deltaNodeCount:seal.count-seal.start,
      canonicalBytes:new TextEncoder().encode(encoded).length},execution:'ACTUAL_ORIGINAL_FIVE_MOMENTS_FULL_PRESSURE_AND_NONLINEAR_DEFECTS',
    individualOperatorAcceptanceDoesNotCompletePackage:true,numericalValuesOrEnclosures:false};
}
