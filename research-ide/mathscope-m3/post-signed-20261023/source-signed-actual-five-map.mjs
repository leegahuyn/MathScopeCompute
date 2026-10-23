/** First post-Signed actual FiveMap mean-correction AST.
 * Use NEW signed->temporal full P/J defects, unchanged source bump copies,
 * exact five equation inverse, complete updated mean pressure and nonlinear
 * remainders. This is not the last iteration, W/M/S bounds or 67 numeric jets.
 */
import {assertActualPostSignedTemporalInverse} from './source-signed-actual-temporal-inverse.mjs';
import {resolveOriginalPostSignedSourceShape} from './original-post-signed-source-shape.mjs';
import {assertGlobalMomentCurrent,exactFiveMomentCoefficients} from '../navier/source-global-moment.mjs';
import {exactFullMeanMomentRemainders,originalFullMeanOperators} from '../navier/source-full-mean-equations.mjs';
import {reconstructUpdatedFullMeanPressure} from '../navier/source-updated-mean-pressure.mjs';
import {globalGraphEqual,shareGlobalScalar} from '../navier/source-global-current.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});},
names=['beta','v','gamma'];
const record=x=>({schema:x.schema,source:x.source,targets:x.targets,
  coefficients:x.coefficients,increment:x.increment,
  potential:x.potential,postFiveMean:x.postFiveMean,
  nonlinear:x.nonlinear,checks:x.checks,scope:x.scope});
export function attachActualPostSignedFiveMap(temporal,context={}){
  if(!context||typeof context!=='object'||Array.isArray(context)||
     Object.keys(context).some(k=>!['onProgress','checkCancelled'].includes(k)))
    fail('INVALID_FIVEMAP_OPTIONS','The original five profiles, matrix and targets are not caller-selectable.');
  if(assertActualPostSignedTemporalInverse(temporal)!==true)
    fail('MISSING_NEW_POST_SIGNED_TEMPORAL','Require actual Signed successor and new exact temporal AST.');
  const signed=temporal.frontier.signed,G=temporal.G,
    {originalPressure:pressure,band,bump:b,updated:signedUpdated}=resolveOriginalPostSignedSourceShape(signed),
    geometry=pressure.geometry,{R,Z,T,Y,epsilon}=geometry,
    source=temporal.postTemporal.updatedMeanPressure,previous=temporal.postTemporal.velocity,
    covariance=signedUpdated.updatedCovariance,
    stress=pressure.residual.fullOriginalStress,
    background={b:band.fields.b,V:G.mul(R,band.fields.F),G:band.fields.G},
    q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x)));
  assertGlobalMomentCurrent(template);
  if(!b?.sourceRestriction?.positiveAAndFiveMuFromSource||
     !b?.sourceRestriction?.originalPositiveLambdaRetained||
     b?.copies?.length!==3||b?.coefficients?.angularMatrix?.length!==3||
     b?.coefficients?.axialMatrix?.length!==2||source.checks.some(x=>x.pass!==true)||
     source.mean.fullAngularCovariance!==covariance)
    fail('UNVERIFIED_SOURCE_FIVEMAP','Original five positive smooth bumps and the fresh post-temporal mean must be used.');
  const start=G.nodes.length,s=band.chart.s,A=band.constants.A,
    defects={P:source.mean.P,Jtheta:source.mean.Jtheta,Jz:source.mean.Jz},
    targets={P:G.mul(power(s,G.mul(q(2),A)),defects.P),
      Jtheta:G.mul(power(s,G.sub(G.mul(q(2),A),q(3,2))),defects.Jtheta),
      Jz:G.mul(power(s,G.sub(G.mul(q(2),A),G.one)),defects.Jz)},
    coefficients=exactFiveMomentCoefficients(G,{
      angularNodes:b.powers.slice(0,3).map(p=>G.exp(G.mul(b.d,p))),
      angularFactors:b.coefficients.angularMatrix.map(row=>row[0]),
      angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)],
      axialNode:G.exp(b.d),axialRatio:G.exp(G.mul(q(-2),b.d,b.lambda)),
      axialFactors:b.coefficients.axialMatrix.map(row=>row[0]),
      axialTarget:G.neg(targets.Jtheta)}),
    deltaV=shareGlobalScalar(G,G.add(...coefficients.angular.map((c,j)=>
      G.mul(c,b.copies[j].inQ))),'PostSignedFiveBump_v'),
    gammaDesired=shareGlobalScalar(G,G.add(...coefficients.axial.map((c,j)=>
      G.mul(c,b.copies[j].inQ))),'PostSignedFiveBump_gamma'),
    r=G.fresh('PostSignedFiveBumpRadialVar'),
    integrand=G.substitute(G.mul(R,gammaDesired),R,r),
    primitive=G.integral(integrand,r,geometry.innerRadius,R),
    whole=G.integral(integrand,r,geometry.innerRadius,geometry.outerRadius),
    psi=G.div(primitive,R),compactPsi=G.div(G.sub(primitive,G.mul(pressure.pressure.chi,whole)),R),
    deltaBeta=shareGlobalScalar(G,G.neg(G.mul(epsilon,G.derivative(psi,Z))),'PostSignedFiveBump_beta'),
    increment={beta:deltaBeta,v:deltaV,gamma:gammaDesired},
    updated=Object.fromEntries(names.map(n=>[n,G.add(previous[n],increment[n])])),
    {De,Dz}=originalFullMeanOperators(G,geometry),
    realizedGamma=De(psi,1),divergence=G.add(De(deltaBeta,1),Dz(gammaDesired)),
    afterFive=reconstructUpdatedFullMeanPressure(G,{
      geometry,background,velocity:updated,covariance,stress,
      rho:pressure.pressure.rho,chi:pressure.pressure.chi,
      tag:'PostSignedAfterFiveMomentsFreshPAndJ'}),
    nonlinear=exactFullMeanMomentRemainders(G,{geometry,background,previous,increment}),
    checks=[
      ...coefficients.checks,
      ...afterFive.checks,
      {id:'same-five-row-original-positive-profile-matrix',pass:
        canonicalStringify(coefficients.angularMatrix)===canonicalStringify(b.coefficients.angularMatrix)&&
        canonicalStringify(coefficients.axialMatrix)===canonicalStringify(b.coefficients.axialMatrix)},
      {id:'post-signed-T1-FiveMap-exact-axial-potential-FTC',
        ...globalGraphEqual(G,realizedGamma,gammaDesired,[R,primitive,gammaDesired])},
      {id:'post-signed-T1-FiveMap-exact-divergence',
        ...globalGraphEqual(G,divergence,G.zero)},
      {id:'source-five-mean-bumps-independent-of-auxiliary-torus',
        pass:Object.values(increment).every(x=>Y.every(y=>!G.freeCoordinates(x).has(y)))},
      {id:'same-actual-post-temporal-covariance',
        pass:afterFive.mean.fullAngularCovariance===covariance},
      {id:'new-targets-not-old-initial-targets',
        pass:defects.P!==template.mean.P&&defects.P!==pressure.current.mean.P},
      {id:'original-quadratic-nonlinear-terms-retained',
        pass:nonlinear.allOldNewAndQuadraticTermsRetained&&nonlinear.nonlinearRemaindersDeclaredZero===false},
    ];
  if(checks.some(x=>x.pass!==true))
    fail('POST_SIGNED_FIVEMAP_IDENTITY_FAILED','Original post-signed 5×5 moment or new PDE mean failed: '+
      checks.filter(x=>x.pass!==true).map(x=>x.id).join(', '));
  const result={schema:'MathScope.N6.ActualPostSignedFiveMapAST/1',
    G,temporal,source:{
      originalFiveProfileSourceImmutable:true,
      newPostSignedTemporalDefects:[...Object.values(defects)],
      originalPositiveLambdaAndFiveBumpsRetained:true,
      allPreexistingSignedCovarianceRetained:true,
      originalMeanRadialEnvelopeRetained:true,
      neverUseOldInitializedMomentTargets:true},
    targets,coefficients,increment,
    potential:{psi,compactPsi,primitive,whole,realizedGamma,gammaDesired,
      divergence,wholeIntegralAnalyticCancellationRequired:true},
    postFiveMean:{velocity:updated,updatedMeanPressure:afterFive},
    nonlinear,checks,
    scope:{fullOriginalFiveMomentAlgebraConstructed:true,
      exactFiveMomentTargetsFromCurrentPostSignedTemporalPAndJ:true,
      originalFullMeanPressureAfterFiveASTConstructed:true,
      wholeSourceSignedTemporalAnalyticClassCertificate:false,
      fullThreeDimensionalSignedTemporalFivePDERefreshed:false,
      cycleAtoDIndependentlyAccepted:false,
      allScaleSelectorsAndTailsEvaluated:false,
      actualFinal67NumericalJets:0,
      originalM3N706Closed:false,originalM3N805Closed:false,release:'HOLD'}};
  const end=G.nodes.length;
  seals.set(result,{G,temporal,start,end,
    delta:canonicalStringify(G.nodes.slice(start,end)),
    definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  context.checkCancelled?.();context.onProgress?.({stage:'post-signed-original-fivemap-fresh-P-J-and-mean',
    nodeCount:G.nodes.length});
  return result;
}
export function assertActualPostSignedFiveMap(x){
  const seal=seals.get(x);
  if(!seal||seal.G!==x?.G||seal.temporal!==x?.temporal||
    seal.delta!==canonicalStringify(x.G.nodes.slice(seal.start,seal.end))||
    seal.record!==canonicalStringify(record(x))||
    !x.G.functionDefinitionsUnchanged(seal.definitions))
    fail('INVALID_POST_SIGNED_FIVEMAP_SOURCE','Original five profile or current updated graph mutated.');
  assertActualPostSignedTemporalInverse(x.temporal);return true;
}
export async function actualPostSignedFiveMapCertificate(x){
  assertActualPostSignedFiveMap(x);
  return {schema:'MathScope.N6.PostSignedFiveMapSourceASTCertificate/1',
    sha256:await sha256(canonicalStringify(record(x))),
    finalPostFiveMeanP:x.postFiveMean.updatedMeanPressure.mean.P,
    finalPostFiveJtheta:x.postFiveMean.updatedMeanPressure.mean.Jtheta,
    finalPostFiveJz:x.postFiveMean.updatedMeanPressure.mean.Jz,
    actualFullThreeDimensionalPDERecomputedAfterFive:false,
    actualFinalField67NumericEnclosures:0,
    fullAnalyticMeanIterationProved:false,N706Closed:false,N805Closed:false,release:'HOLD'};
}
