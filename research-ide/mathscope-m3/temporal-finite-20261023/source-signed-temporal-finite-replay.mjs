/** Certified original Signed frontier -> exact FINITE two-torus Fourier inverse.
 * Full Fourier limit, temporal potential, FiveMap and numerical jets are NOT asserted.
 * Source residual, Y, direction and bounds are never accepted from caller.
 */
import {assertSigned162TemporalFrontier} from '../navier/source-signed-temporal-frontier.mjs';
import {finiteAuxiliaryInverse} from '../navier/source-auxiliary-fourier.mjs';
import {checkActualFiniteAuxiliaryIdentity} from '../navier/source-global-temporal.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const record=x=>({schema:x.schema,source:x.source,finite:x.finite,checks:x.checks,scope:x.scope,roots:x.roots});
export function attachSigned162FiniteTemporalReplay(frontier,context={}){
  if(!context||typeof context!=='object'||Array.isArray(context)||
     Object.keys(context).some(k=>!['onProgress','checkCancelled'].includes(k)))
    fail('INVALID_TEMPORAL_INPUT','Source, Fourier direction, coefficients and bounds are not caller-selectable.');
  if(assertSigned162TemporalFrontier(frontier)!==true)fail('SIGNATURE_REQUIRED','The real signed private source is mandatory.');
  const G=frontier.G,Y=frontier.source.originalTorus,sources=frontier.centered;
  if(!Array.isArray(Y)||Y.length!==2||Y[0]===Y[1]||Y.some(id=>G.nodes[id]?.op!=='coordinate')||
     !Array.isArray(sources)||sources.length!==2||sources.some(id=>!G.nodes[id]))
    fail('INVALID_POST_SIGNED_TORUS','Both original centered signed residuals required.');
  const start=G.nodes.length,finite=[];
  for(let i=0;i<2;i++){
    context.checkCancelled?.();
    const inverse=finiteAuxiliaryInverse(G,{body:sources[i],Y,cutoff:1,derivativeOrders:[0,1]});
    const identity=checkActualFiniteAuxiliaryIdentity(G,inverse);
    if(!identity.pass||inverse.pairCount!==4||inverse.fullLatticeModeCount!==8||
       inverse.finiteSumClaimedWholeInverse!==false||inverse.omittedTailRetained!==true||
       inverse.tails.some(t=>t.sourceDerivativeOrder!==t.derivativeOrder+4||!t.tailTendsToZero||
           t.omittedModesSetToZero||Y.some(y=>G.freeCoordinates(t.upper).has(y))))
      fail('ORIGINAL_TEMPORAL_FINITE_INVERSE_UNPROVED','Finite source projections and tails must be proved.');
    const omittedFourierProjection=G.sub(inverse.centeredBody,inverse.sourceProjection);
    finite.push({field:i===0?'theta':'z',inverse,identity,omittedFourierProjection,source:sources[i],
      finiteInverseRoot:inverse.value,sourceProjectionRoot:inverse.sourceProjection,
      fourExtraDerivativeTails:inverse.tails.map(t=>t.upper),
      omittedModesSetToZero:false,exactWholeInverseProduced:false});
    context.onProgress?.({stage:'post-signed-finite-temporal-'+(i===0?'theta':'z'),nodeCount:G.nodes.length});
  }
  const roots=finite.map(x=>x.finiteInverseRoot),result={
    schema:'MathScope.N6.PostSignedSourceBoundFiniteTemporalReplay/1',G,frontier,
    source:{signedPrivateAuthenticated:true,sourceCenteredOriginal:[...sources],torus:[...Y],
      fastDirection:['sqrt(2)-1','1'],fixedFiniteCutoff:1,sourcePressure:frontier.source.updatedFullPressure},
    finite,roots,checks:[{id:'private-Signed-predecessor',pass:true},
      {id:'both-real-Fourier-identities',pass:finite.every(x=>x.identity.pass)},
      {id:'all-omitted-modes-retained',pass:finite.every(x=>x.inverse.tails.length===2&&!x.omittedModesSetToZero)}],
    scope:{actualSourceBasedFiniteFourierPrefixConstructed:true,coefficientNumericalValuesEvaluated:false,
      actualExactInfiniteTemporalInverseConstructed:false,fullSignedToTemporalPotential:false,
      postTemporalPressureRecomputed:false,originalFiveMapExecuted:false,actualFinal67JetNumericalValues:0,
      n706Closed:false,n805Closed:false,release:'HOLD'}};
  seals.set(result,{G,frontier,start,count:G.nodes.length,graphDelta:canonicalStringify(G.nodes.slice(start)),
    definitions:G.captureFunctionDefinitions(),snapshot:canonicalStringify(record(result))});
  return result;
}
export function assertSigned162FiniteTemporalReplay(x){
  const s=seals.get(x);
  if(!s||s.G!==x?.G||s.frontier!==x.frontier||
     s.graphDelta!==canonicalStringify(x.G.nodes.slice(s.start,s.count))||
     s.snapshot!==canonicalStringify(record(x))||!x.G.functionDefinitionsUnchanged(s.definitions))
    fail('UNAUTHENTICATED_FINITE_TEMPORAL_REPLAY','Signed finite inverse graph/tail changed.');
  assertSigned162TemporalFrontier(x.frontier);return true;
}
export async function signed162FiniteTemporalReplayCertificate(x){
  assertSigned162FiniteTemporalReplay(x);
  return {schema:'MathScope.N6.PostSignedSourceBoundFiniteTemporalCertificate/1',
    graph:{sha256:await sha256(canonicalStringify(record(x))),nodeCount:x.G.nodes.length},
    sourceRoots:x.source.sourceCenteredOriginal,finiteInverseRoots:x.roots,
    verifiedFiniteModesEach:8,sourceBoundTailsRetained:true,
    exactInfiniteInverseCompleted:false,postTemporalPressureCompleted:false,
    fiveMapCompleted:false,finalField67NumericCertified:0,release:'HOLD'};
}
