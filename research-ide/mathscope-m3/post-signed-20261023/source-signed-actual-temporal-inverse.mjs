/** Original Signed private successor -> exact auxiliary inverse as source AST.
 * Uses the SAME corrected Signed mean/PDE and ORIGINAL two-torus direction.
 * Finite Fourier controls and differentiated tail sources belong to this
 * new post-Signed field. Inserting a formal limit node is NOT independent
 * interval evaluation, whole-iteration uniform convergence or N7/N8 proof.
 */
import {assertSigned162TemporalFrontier} from '../navier/source-signed-temporal-frontier.mjs';
import {resolveOriginalPostSignedSourceShape} from './original-post-signed-source-shape.mjs';
import {checkOriginalCoupledTemporalInverse} from './original-coupled-inverse-proof.mjs';
import {finiteAuxiliaryInverse} from '../navier/source-auxiliary-fourier.mjs';
import {checkActualFiniteAuxiliaryIdentity} from '../navier/source-global-temporal.mjs';
import {realizeOriginalTemporalPotential} from '../navier/source-temporal-potential.mjs';
import {reconstructUpdatedFullMeanPressure} from '../navier/source-updated-mean-pressure.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const keys=['beta','v','gamma'];
const record=x=>({schema:x.schema,source:x.source,inverses:x.inverses,
  potential:x.potential,postTemporal:x.postTemporal,checks:x.checks,scope:x.scope});
function root(G,x){return Number.isSafeInteger(x)&&!!G.nodes?.[x];}
export function attachActualPostSignedTemporalInverse(frontier,context={}){
  if(!context||typeof context!=='object'||Array.isArray(context)||
     Object.keys(context).some(k=>!['onProgress','checkCancelled'].includes(k)))
    fail('INVALID_TEMPORAL_OPTIONS','No replacement temporal source, Fourier direction, gauge, mean or tail bounds.');
  if(assertSigned162TemporalFrontier(frontier)!==true)
    fail('MISSING_SIGNED_SOURCE','A truly sealed original Signed162 successor is required.');
  const signed=frontier.signed,G=frontier.G,
    {originalPressure:pressure,band,meanVelocity,updated}=resolveOriginalPostSignedSourceShape(signed),
    geometry={...pressure.geometry,chi:pressure.pressure.chi},
    {R,Z,T,Y}=geometry,ell=band.coordinates.ell;
  if(![R,Z,T,ell,...Y,geometry.ci,geometry.epsilon,geometry.radialFast,
      geometry.radialPrimitive].every(x=>root(G,x))||
    Y.length!==2||Y.some(y=>G.nodes[y].op!=='coordinate')||
    updated.updatedMean.checks.some(x=>x.pass!==true)||
    pressure.cover.rows.length!==81||!pressure.cover.proof.allCrossLabelProductsVanish||
    !pressure.cover.proof.haarInvariance?.normalizedMeasure)
    fail('INVALID_ORIGINAL_SIGNED_TEMPORAL_DOMAIN','Original common-torus and post-Signed pressure premises are required.');
  const fields=['theta','z'],parameters=[R,Z,T,ell,...Y],inverses={},
    source=[...frontier.centered],start=G.nodes.length;
  for(let j=0;j<2;j++){
    context.checkCancelled?.();
    const body=source[j];
    if(!root(G,body))fail('MISSING_POST_SIGNED_RESIDUAL','Both actual centered Signed mean residuals required.');
    const system=G.defineAuxiliaryInverse({
      name:'ActualAfterSigned_'+fields[j]+'_OriginalFastTime',body,Y,
      parameters,directions:[R,Z,T,...Y]});
    const exact=G.auxiliaryInverseValue(system,parameters);
    const finite=finiteAuxiliaryInverse(G,{body,Y,cutoff:1,derivativeOrders:[0,1]});
    const identity=checkActualFiniteAuxiliaryIdentity(G,finite);
    if(!identity.pass||finite.pairCount!==4||finite.fullLatticeModeCount!==8||
       finite.finiteSumClaimedWholeInverse!==false||!finite.omittedTailRetained||
       finite.tails.some(t=>!t.tailTendsToZero||t.omittedModesSetToZero||
          t.sourceDerivativeOrder!==t.derivativeOrder+4))
      fail('INVALID_NEW_SIGNED_FOURIER','Real Signed residual exact Fourier coefficient and tail proof failed.');
    inverses[fields[j]]={body,system,exact,finite,identity,
      exactFormalLimitNotNumericalEnclosure:true,sourceNumericalBoundsComputed:false};
    context.onProgress?.({stage:'actual-new-Signed-exact-temporal-'+fields[j],
      nodeCount:G.nodes.length});
  }
  const potential=realizeOriginalTemporalPotential(G,{
    geometry,inverseTheta:inverses.theta.exact,inverseZ:inverses.z.exact,
    tag:'afterActualSigned162'});
  const previous=meanVelocity,
    updatedVelocity=Object.fromEntries(keys.map(k=>[k,G.add(previous[k],potential.velocity[k])])),
    background={b:band.fields.b,V:G.mul(R,band.fields.F),G:band.fields.G},
    afterTemporal=reconstructUpdatedFullMeanPressure(G,{
      geometry:pressure.geometry,background,velocity:updatedVelocity,
      covariance:updated.updatedCovariance,
      stress:pressure.residual.fullOriginalStress,
      rho:pressure.pressure.rho,chi:pressure.pressure.chi,
      tag:'ActualSignedAfterTemporalUpdatedPressure'}),
    noChangedCovariance=afterTemporal.mean.fullAngularCovariance===updated.updatedCovariance,
    checks=[
      ...potential.checks,
      ...afterTemporal.checks,
      {id:'same-source-signed-mean-and-covariance',pass:noChangedCovariance&&
        keys.every(k=>root(G,updatedVelocity[k]))},
      {id:'new-post-signed-T1-exact-formal-limits',pass:Object.values(inverses)
          .every(x=>checkOriginalCoupledTemporalInverse(G,{
            system:x.system,exact:x.exact,body:x.body,Y,parameters,finite:x.finite
          }).pass===true)},
      {id:'no-old-temporal-mean-reused',pass:afterTemporal.mean.P!==
        updated.updatedMean.mean.P},
    ];
  if(checks.some(x=>x.pass!==true))
    fail('INVALID_SIGNED_TEMPORAL_RECOMPUTATION',
      'New temporal source or updated pressure failed: '+checks.filter(x=>x.pass!==true).map(x=>x.id).join(','));
  const result={schema:'MathScope.N6.ActualPostSignedTemporalInverseAST/1',
    G,frontier,source:{
      signedPrivateSealMandatory:true,sameActualGraph:true,
      residualRoots:source,originalTorus: [...Y],
      originalParameters:[...parameters],postSignedPressureRoot:frontier.source.updatedFullPressure,
      FourierCutoff:1,completeModeCountAtCutoff:8,
      noReplacementSourceAllowed:true,allOriginalCovarianceRetained:true,
      crossLabelProofRetained:true},
    inverses,potential,postTemporal:{velocity:updatedVelocity,updatedMeanPressure:afterTemporal},
    checks,scope:{
      twoExactInverseLimitNodesConstructed:true,
      finiteFourierIdentitiesAndTailsConstructed:true,
      originalT1PotentialConstructed:true,
      postTemporalCompleteMeanPressureASTConstructed:true,
      independentAllDerivativeTailApplicationsVerified:false,
      numericalFourierCoefficientEnclosures:false,
      uniformOriginalAllOrderBoundsProved:false,
      subsequentFiveMapConstructed:false,
      actualFinal67JetNumericalValues:0,
      wholeFourStepIterationProved:false,N706Closed:false,N805Closed:false,release:'HOLD'}};
  const end=G.nodes.length;
  seals.set(result,{G,frontier,start,end,delta:canonicalStringify(G.nodes.slice(start,end)),
    definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  return result;
}
export function assertActualPostSignedTemporalInverse(x){
  const seal=seals.get(x);
  if(!seal||seal.G!==x?.G||seal.frontier!==x?.frontier||
    seal.record!==canonicalStringify(record(x))||
    seal.delta!==canonicalStringify(x.G.nodes.slice(seal.start,seal.end))||
    !x.G.functionDefinitionsUnchanged(seal.definitions))
    fail('INVALID_POST_SIGNED_TEMPORAL_SEAL','New Signed temporal limit AST or original source graph mutated.');
  assertSigned162TemporalFrontier(x.frontier);return true;
}
export async function actualPostSignedTemporalCertificate(x){
  assertActualPostSignedTemporalInverse(x);
  const seal=seals.get(x);
  return {schema:'MathScope.N6.PostSignedTemporalASTCertificate/1',
    graph:{sha256:await sha256(canonicalStringify({record:record(x),
      newNodes:x.G.nodes.slice(seal.start,seal.end)})),nodeCount:seal.end},
    exactFormalInverseRoots:Object.values(x.inverses).map(v=>v.exact),
    postTemporalPressureRoot:x.postTemporal.updatedMeanPressure.pressure.value,
    status:'AUTHENTIC_SOURCE_AST_NOT_NUMERIC_OR_ALL_ORDER_PROOF',
    actualFiveMapExecuted:false,actualFinal67JetsNumericallyCertified:0,
    N706Closed:false,N805Closed:false,release:'HOLD'};
}
