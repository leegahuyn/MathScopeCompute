/** Strict, read-only genuine PR30 source hierarchy resolver for next stages.
 * Does not mint any private authority. Callers MUST already possess the
 * actual in-process source-private Signed162 seal.
 */
const fail=(message,code='POST_SIGNED_ORIGINAL_SOURCE_SHAPE_MISMATCH')=>{
  throw Object.assign(new Error(message),{code});};
const root=(G,v)=>Number.isSafeInteger(v)&&v>=0&&!!G.nodes?.[v];
const vec=(G,v,n)=>Array.isArray(v)&&v.length===n&&v.every(x=>root(G,x));
const originalNames=Object.freeze(['rr','rtheta','rz','thetatheta','thetaz','zz']);
const sameBase=(G,base)=>{
  let a=G;const seen=new Set();
  while(a&&!seen.has(a)){if(a===base)return true;seen.add(a);a=a.baseGraph;}return false;
};
/** This is an independent shape check, NOT a replacement for the WeakMap seal. */
export function resolveOriginalPostSignedSourceShape(signed){
  const G=signed?.G,forced=signed?.input,angular=forced?.input,
    initializedMean=angular?.mean,originalPressure=initializedMean?.temporal?.pressure,
    template=initializedMean?.template,band=originalPressure?.current?.band,
    current=originalPressure?.current,updated=signed?.constructed?.updated,
    meanVelocity=forced?.mean?.completeBetaVGamma,
    covariance=updated?.updatedCovariance,mean=updated?.updatedMean;
  if(signed?.schema!=='MathScope.N6.PR30SourceBoundSigned162Successor/1'||
     forced?.schema!=='MathScope.N6.GlobalActualForcedCurrent/1'||
     angular?.schema!=='MathScope.N6.GlobalActualInitializedAngular/1'||
     initializedMean?.schema!=='MathScope.N6.GlobalActualInitializedMean/1'||
     template?.schema!=='MathScope.N6.GlobalActualMomentCurrent/1'||
     originalPressure?.schema!=='MathScope.N6.GlobalActualCurrentPressure/1'||
     !Array.isArray(G?.nodes)||G!==forced.G||G!==angular.G||
     !sameBase(G,current?.G)||template.current!==current||
     initializedMean.temporal.pressure!==originalPressure)
    fail('Real source must be Signed -> Forced -> initialized angular -> initialized mean -> original private pressure and fixed moment template.');
  if(!vec(G,[meanVelocity?.beta,meanVelocity?.v,meanVelocity?.gamma],3)||
     originalNames.some(k=>!root(G,covariance?.[k]))||
     mean?.mean?.fullAngularCovariance!==covariance||
     !root(G,mean?.pressure?.value)||
     !['P','Jtheta','Jz'].every(k=>root(G,mean?.mean?.[k]))||
     !Array.isArray(mean?.checks)||!mean.checks.length||mean.checks.some(x=>x.pass!==true))
    fail('Signed refreshed mean covariance, defect roots and original Forced predecessor velocity must agree.');
  if(!Array.isArray(originalPressure.geometry?.Y)||originalPressure.geometry.Y.length!==2||
     originalPressure.geometry.Y.some(id=>G.nodes[id]?.op!=='coordinate')||
     originalPressure.cover?.rows?.length!==81||
     originalPressure.cover?.proof?.allCrossLabelProductsVanish!==true)
    fail('The actual pressure chart and complete original 81-box cover must be retained.');
  const bump=template.bumps;
  if(bump?.copies?.length!==3||bump?.powers?.length!==5||bump?.mu?.length!==5||
     bump?.coefficients?.angularMatrix?.length!==3||
     bump?.coefficients?.axialMatrix?.length!==2||
     bump?.sourceRestriction?.positiveAAndFiveMuFromSource!==true||
     bump?.sourceRestriction?.originalPositiveLambdaRetained!==true)
    fail('Use the THREE original geometric copies for the five original 3+2 moment equations, not five copies.');
  return Object.freeze({G,forced,angular,initializedMean,originalPressure,current,band,template,bump,
    meanVelocity,updated,covariance,postSignedMean:mean});
}
