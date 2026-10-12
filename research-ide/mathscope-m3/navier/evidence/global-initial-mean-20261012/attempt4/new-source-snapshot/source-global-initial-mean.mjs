/** Original Proposition9.5 temporal-before-moment mean construction.
 *
 * The mandatory source is the privately authenticated complete temporal
 * inverse. The older five-moment state is used only as an authenticated
 * template of the fixed original profiles, coefficient matrix and support
 * proof. Its old targets and old updated field are never reused here.
 * Every new P/J comes from the actual post-temporal velocity and pressure.
 * Class and nonzero-angular residual obligations remain separate.
 */
import {assertGlobalTemporalInverse,globalTemporalInverseCertificate} from './source-global-temporal.mjs';
import {assertGlobalMomentCurrent,exactFiveMomentCoefficients} from './source-global-moment.mjs';
import {exactFullMeanMomentRemainders,originalFullMeanOperators} from './source-full-mean-equations.mjs';
import {reconstructUpdatedFullMeanPressure,exactNormalizedHaar,exactWholeRadialIntegral} from './source-updated-mean-pressure.mjs';
import {globalGraphEqual,shareGlobalScalar} from './source-global-current.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});},
  names=['beta','v','gamma'],record=s=>({schema:s.schema,source:s.source,stages:s.stages,bumps:s.bumps,potential:s.potential,
    nonlinear:s.nonlinear,conservation:s.conservation,checks:s.checks,scope:s.scope}),
  progress=(context,stage,G)=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length});};

export function attachGlobalInitializedMean(temporal,template,context={}){
  assertGlobalTemporalInverse(temporal);assertGlobalMomentCurrent(template);
  const previousPressure=temporal.pressure,current=previousPressure.current,G=temporal.G,band=current.band,
    start=G.nodes.length,geometry=previousPressure.geometry,{R,Z,T,Y,epsilon}=geometry;
  if(template.current!==current||template.G!==G.baseGraph||!template.bumps.sourceRestriction.positiveAAndFiveMuFromSource||
    !template.bumps.sourceRestriction.originalPositiveLambdaRetained||!template.checks.every(x=>x.pass))
    fail('Use the fixed original mean profiles from this exact same privately constructed current.');
  const background={b:band.fields.b,V:G.mul(R,band.fields.F),G:band.fields.G},covariance=previousPressure.covariance.fullAngularMean,
    stress=previousPressure.residual.fullOriginalStress,{rho,chi}=previousPressure.pressure,
    input={geometry,background,covariance,stress,rho,chi},
    afterTemporal=reconstructUpdatedFullMeanPressure(G,{...input,velocity:temporal.potential.velocity,tag:'GlobalInitializationAfterTemporal'}),
    b=template.bumps,power=(x,a)=>G.exp(G.mul(a,G.log(x))),q=(n,d=1)=>G.q(n,d),s=band.chart.s,A=band.constants.A,
    actualInputDefects={P:afterTemporal.mean.P,Jtheta:afterTemporal.mean.Jtheta,Jz:afterTemporal.mean.Jz},
    targets={P:G.mul(power(s,G.mul(q(2),A)),actualInputDefects.P),
      Jtheta:G.mul(power(s,G.sub(G.mul(q(2),A),q(3,2))),actualInputDefects.Jtheta),
      Jz:G.mul(power(s,G.sub(G.mul(q(2),A),G.one)),actualInputDefects.Jz)},
    coefficients=exactFiveMomentCoefficients(G,{angularNodes:b.powers.slice(0,3).map(p=>G.exp(G.mul(b.d,p))),
      angularFactors:b.coefficients.angularMatrix.map(row=>row[0]),
      angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)],axialNode:G.exp(b.d),
      axialRatio:G.exp(G.mul(q(-2),b.d,b.lambda)),axialFactors:b.coefficients.axialMatrix.map(row=>row[0]),axialTarget:G.neg(targets.Jtheta)}),
    deltaV=shareGlobalScalar(G,G.add(...coefficients.angular.map((c,j)=>G.mul(c,b.copies[j].inQ))),'GlobalInitializationFiveBump_v'),
    gammaDesired=shareGlobalScalar(G,G.add(...coefficients.axial.map((c,j)=>G.mul(c,b.copies[j].inQ))),'GlobalInitializationFiveBump_gamma'),
    r=G.fresh('GlobalInitializationFiveBump_radial_integral'),weighted=G.mul(R,gammaDesired),
    integrand=G.substitute(weighted,R,r),primitive=G.integral(integrand,r,geometry.innerRadius,R),
    whole=G.integral(integrand,r,geometry.innerRadius,geometry.outerRadius),psi=G.div(primitive,R),
    compactPsi=G.div(G.sub(primitive,G.mul(chi,whole)),R),
    rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z))),
    deltaBeta=shareGlobalScalar(G,rawDeltaBeta,'GlobalInitializationFiveBump_beta'),
    increment={beta:deltaBeta,v:deltaV,gamma:gammaDesired},
    previous=temporal.potential.velocity,updated=Object.fromEntries(names.map(n=>[n,G.add(previous[n],increment[n])])),
    {De,Dz}=originalFullMeanOperators(G,geometry),realizedGamma=De(psi,1),divergence=G.add(De(rawDeltaBeta,1),Dz(gammaDesired)),
    potentialChecks=[
      {id:'post-temporal-five-bump-axial-potential-FTC',...globalGraphEqual(G,realizedGamma,gammaDesired,[R,primitive,gammaDesired])},
      {id:'post-temporal-five-bump-exact-incompressibility',...globalGraphEqual(G,divergence,G.zero)},
      {id:'post-temporal-five-bump-has-no-auxiliary-variable',pass:Object.values(increment).every(x=>Y.every(y=>!G.freeCoordinates(x).has(y)))}],
    afterMoments=reconstructUpdatedFullMeanPressure(G,{...input,velocity:updated,tag:'GlobalInitializationAfterFiveMoments'}),
    oldEquations=afterTemporal.mean.raw,newEquations=afterMoments.mean.raw,
    nonlinear=exactFullMeanMomentRemainders(G,{geometry,background,previous,increment}),
    wholeHaar=body=>exactWholeRadialIntegral(G,exactNormalizedHaar(G,body,Y),geometry,'GlobalInitializationRemainder'),
    remainderDefects={P:wholeHaar(nonlinear.Rg),Jtheta:wholeHaar(nonlinear.JthetaIntegrand),
      Jz:G.sub(wholeHaar(nonlinear.JzVelocityIntegrand),G.mul(q(1,2),wholeHaar(G.mul(G.pow(R,2),nonlinear.Rg))))},
    expansionChecks=[
      {id:'post-temporal-full-radial-change-8.26',...globalGraphEqual(G,G.sub(G.sub(newEquations.gr,oldEquations.gr),nonlinear.linear.PIntegrand),nonlinear.Rg)},
      {id:'post-temporal-full-angular-flux-change-8.27',...globalGraphEqual(G,G.sub(G.sub(newEquations.fluxTheta,oldEquations.fluxTheta),nonlinear.linear.JthetaIntegrand),nonlinear.JthetaIntegrand)},
      {id:'post-temporal-full-axial-flux-change-8.27',...globalGraphEqual(G,G.sub(newEquations.fluxZ,oldEquations.fluxZ),
        G.add(G.mul(q(2),R,background.G,increment.gamma),nonlinear.JzVelocityIntegrand))}],
    exactRows=[
      {name:'angular-conservation',value:coefficients.angularValues[0],target:G.zero,weightPower:q(2)},
      {name:'axial-conservation',value:coefficients.axialValues[0],target:G.zero,weightPower:G.one},
      {name:'radial-pressure-defect',value:coefficients.angularValues[1],target:G.neg(targets.P)},
      {name:'angular-axial-defect',value:coefficients.axialValues[1],target:G.neg(targets.Jtheta)},
      {name:'axial-pressure-defect',value:coefficients.angularValues[2],target:G.neg(targets.Jz)}],
    checks=[...potentialChecks,...expansionChecks,...coefficients.checks,
      {id:'temporal-pressure-reconstructed-before-actual-five-moment-targets',pass:afterTemporal.checks.every(x=>x.pass)&&
        actualInputDefects.P===afterTemporal.mean.P&&actualInputDefects.Jtheta===afterTemporal.mean.Jtheta&&actualInputDefects.Jz===afterTemporal.mean.Jz},
      {id:'new-five-moment-pressure-reconstructed-with-complete-current',pass:afterMoments.checks.every(x=>x.pass)&&
        afterMoments.mean.fullAngularCovariance===covariance&&afterMoments.mean.fullOriginalStress===stress},
      {id:'same-original-five-row-matrix-and-positive-lambda',pass:canonicalStringify(coefficients.angularMatrix)===canonicalStringify(b.coefficients.angularMatrix)&&
        canonicalStringify(coefficients.axialMatrix)===canonicalStringify(b.coefficients.axialMatrix)&&b.lambda===G.parameter('lambda')},
      {id:'old-pre-temporal-targets-not-reused',pass:actualInputDefects.P!==template.mean.P&&actualInputDefects.P!==current.mean.P&&
        actualInputDefects.Jtheta!==template.mean.Jtheta&&actualInputDefects.Jz!==template.mean.Jz},
      {id:'temporal-zero-Haar-mean-and-exact-five-conservation-rows',pass:temporal.inverses.theta.exactZeroMode===G.zero&&
        temporal.inverses.z.exactZeroMode===G.zero&&coefficients.checks[0].pass&&coefficients.checks[3].pass}];
  if(checks.some(x=>!x.pass))fail('An original temporal-before-moment initialization identity failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  progress(context,'global-source-post-temporal-new-defects-five-moments-full-pressure',G);
  const result={schema:'MathScope.N6.GlobalActualInitializedMean/1',G,temporal,template,
    source:{sameActualGlobalCurrent:true,paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
      sourcePrefixCount:start,exactSequence:['primary-current-pressure','temporal-8.20','post-temporal-8.12','five-moments-8.25-on-new-P-J','post-moment-8.12'],
      actualInputDefects,originalM2Modified:false,callerReplacementTargetsAccepted:false,
      templateUse:'Only the unchanged original profile copies, five-row matrix, positive lambda and source support/invertibility theorem are reused.'},
    stages:{temporal:afterTemporal,moments:afterMoments},
    bumps:{actualInputDefects,targets,coefficients,copies:b.copies,originalLambda:b.lambda,originalPositiveA:b.a,
      originalFiveMu:b.mu,originalSourceRestriction:b.sourceRestriction,exactRows},
    potential:{weighted,primitive,whole,psi,compactPsi,rawDeltaBeta,deltaBeta,realizedGamma,gammaDesired,checks:potentialChecks,
      compactPotentialIdentity:'The exact homogeneous p=1 row gives the retained whole integral zero by the original profile change of variables; hence compactPsi=psi. The raw whole integral remains in the certificate.',
      originalMeanPatchSupportRetained:true,analyticIntegralReductionUsed:true},
    nonlinear:{...nonlinear,expansionChecks,remainderDefects,
      actualNewDefects:{P:afterMoments.mean.P,Jtheta:afterMoments.mean.Jtheta,Jz:afterMoments.mean.Jz},
      exactDefectDerivation:'Integrate the three checked full difference identities using normalized Haar. The same fixed five-row profile identities cancel the actual old P/J. Integral additivity and Fubini then identify every new defect with the displayed actual nonlinear remainder integral.',
      mechanicalRawIntegralReduction:false,remaindersDeclaredZero:false},
    conservation:{angular:G.zero,axial:G.zero,
      derivation:'The exact temporal inverse has zero normalized Haar mean. Translation/Fubini and the retained T1 realization preserve that mean. The two homogeneous rows of the actual subsequent five-equation solve contribute zero weighted radial moments.',
      exactTemporalZeroMeanSource:{theta:temporal.inverses.theta.exactZeroMode,z:temporal.inverses.z.exactZeroMode},
      actualFiveRows:exactRows.slice(0,2),allCorrectionsRemainDivergenceFree:true},
    checks,scope:{actualTemporalBeforeMomentSequenceConstructed:true,actualNewDefectsUsedForFiveMoments:true,
      actualFullPressureAfterBothMeanUpdates:true,actualFullMeanNonlinearIdentities:true,exactConservation9_10:true,
      everyNewInverseDerivativeTailMaterialized:false,fullNonzeroAngularResidualAttached:false,
      originalProp9_5ClassBoundsEstablished:false,initializedJ0:false,completeN6:false,
      numericalWholeFieldEnclosure:false,newLeanKernelProof:false}};
  const count=G.nodes.length;seals.set(result,{G,temporal,template,start,count,delta:canonicalStringify(G.nodes.slice(start)),
    definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});return result;
}

export function assertGlobalInitializedMean(s){
  const seal=seals.get(s);if(!seal||seal.G!==s.G||seal.temporal!==s.temporal||seal.template!==s.template||
    seal.record!==canonicalStringify(record(s))||seal.delta!==canonicalStringify(s.G.nodes.slice(seal.start,seal.count))||
    !s.G.functionDefinitionsUnchanged(seal.definitions))fail('Use the unchanged privately constructed temporal-before-moment source state.');
  assertGlobalTemporalInverse(s.temporal);assertGlobalMomentCurrent(s.template);return true;
}

export async function globalInitializedMeanCertificate(s){
  assertGlobalInitializedMean(s);const seal=seals.get(s),sourceTemporal=await globalTemporalInverseCertificate(s.temporal),
    encoded=canonicalStringify({sourceTemporalGraph:sourceTemporal.graph,record:record(s),nodes:s.G.nodes.slice(seal.start,seal.count),definitions:seal.definitions});
  return {...record(s),sourceTemporalGraph:sourceTemporal.graph,
    graph:{sha256:await sha256(encoded),nodeCount:seal.count,deltaNodeCount:seal.count-seal.start,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_SOURCE_TEMPORAL_THEN_NEW_FIVE_MOMENTS_WITH_COMPLETE_MEAN_PRESSURE',
    numericalValuesOrEnclosures:false,Prop9_5ClassAcceptanceStillRequired:true};
}
