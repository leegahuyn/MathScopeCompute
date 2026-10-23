/** Source-bound re-evaluation of the complete physical cylindrical PDE after
 * the first actual Signed -> Temporal -> FiveMap. Recompute pressure, not just
 * the zero Fourier mode. An AST of the PDE is not a proof that it vanishes.
 */
import {assertActualPostSignedFiveMap} from './source-signed-actual-five-map.mjs';
import {exactRealCylindricalPDE} from '../navier/source-harmonic-assembly.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),names=['beta','v','gamma'];
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const root=(G,id)=>Number.isSafeInteger(id)&&id>=0&&!!G.nodes?.[id];
const record=x=>({schema:x.schema,source:x.source,pressure:x.pressure,
  velocity:x.velocity,residual:x.residual,checks:x.checks,scope:x.scope});

export function attachActualPostFiveFull3DPDE(five,context={}){
  if(!context||typeof context!=='object'||Array.isArray(context)||
     Object.keys(context).some(k=>!['onProgress','checkCancelled'].includes(k)))
    fail('INVALID_POSTFIVE_3D_OPTIONS','No replacement physical field or source PDE is permitted.');
  if(assertActualPostSignedFiveMap(five)!==true)
    fail('UNAUTHENTICATED_POSTFIVE_PREDECESSOR','Require actual private Signed -> Temporal -> FiveMap AST.');
  const signed=five.temporal.frontier.signed,forced=signed.input,G=five.G,
    old=signed.constructed?.updated,mean=five.postFiveMean?.updatedMeanPressure,
    baseline=forced.mean.completeBetaVGamma,
    latestMean=five.postFiveMean.velocity,
    beforeMean=old?.updatedMean;
  if(!Array.isArray(old?.fullVelocity)||old.fullVelocity.length!==3||
     !old.fullVelocity.every(x=>root(G,x))||!root(G,old?.fullPressure)||
     !names.every(n=>root(G,baseline?.[n])&&root(G,latestMean?.[n]))||
     !root(G,mean?.pressure?.value)||!root(G,beforeMean?.pressure?.value)||
     mean.mean?.fullAngularCovariance!==old.updatedCovariance||
     mean.checks?.some(c=>c.pass!==true)||
     G!==signed.G||G!==forced.G||!forced.global?.geometry)
    fail('INVALID_ORIGINAL_POSTFIVE_SOURCES','Actual previous Signed full field, unchanged physical geometry and new mean pressure required.');
  const start=G.nodes.length;
  const meanIncrements=names.map(n=>G.sub(latestMean[n],baseline[n]));
  const velocity=old.fullVelocity.map((rootId,j)=>G.add(rootId,meanIncrements[j]));
  const pressureDelta=G.sub(mean.pressure.value,beforeMean.pressure.value);
  const pressure=G.add(old.fullPressure,pressureDelta);
  const residual=exactRealCylindricalPDE(G,{geometry:forced.global.geometry,
    velocity,pressure});
  const roots=[...velocity,pressure,residual.divergence,
    ...residual.conservativeResidual,...residual.advectiveResidual,
    ...residual.pressureGradient];
  const checks=[
    {id:'all-source-3D-root-ids-existing',pass:roots.every(x=>root(G,x))},
    {id:'all-three-real-post-five-PDE-residuals',pass:
      residual.conservativeResidual.length===3&&
      residual.advectiveResidual.length===3&&
      residual.pressureGradient.length===3},
    {id:'original-r-theta-z-physical-pressure-increment',pass:
      G.nodes[pressure].op==='add'&&
      G.nodes[pressure].args.includes(old.fullPressure)&&
      G.nodes[pressure].args.includes(pressureDelta)},
    {id:'original-cylindrical-connection-terms-retained',pass:
      residual.allCylindricalConnectionsRetained===true},
    {id:'after-FiveMap-new-mean-covariance-preserved',pass:
      mean.mean.fullAngularCovariance===old.updatedCovariance},
    {id:'no-original-pressure-or-signed-wave-replacement',pass:
      velocity.every((rootId,j)=>G.nodes[rootId].op==='add'&&
        G.nodes[rootId].args.includes(old.fullVelocity[j]))},
  ];
  if(checks.some(c=>!c.pass))
    fail('INCOMPLETE_POSTFIVE_3D_PDE','Exact original physical 3D field roots/checks failed.');
  const result={schema:'MathScope.N6.PostSignedTemporalFiveFull3DPDEAST/1',G,five,
    source:{actualPrivateSignedAndFiveRequired:true,
      priorSignedVelocityRoots:[...old.fullVelocity],
      priorSignedPressureRoot:old.fullPressure,
      exactOriginalPhysicalGeometry:forced.global.geometry,
      originalMeanPressureRecomputedAfterFive:true,
      originalSignedSixCovarianceFieldsPreserved:true},
    velocity:{newMeanIncrements:meanIncrements,fullPhysicalVelocity:velocity},
    pressure:{newMeanDelta:pressureDelta,fullPhysicalPressure:pressure},
    residual:{divergence:residual.divergence,
      advective:residual.advectiveResidual,
      conservative:residual.conservativeResidual,
      pressureGradient:residual.pressureGradient,
      vectorLaplacian:residual.vectorLaplacian},
    checks,
    scope:{full3DPhysicalNavierStokesResidualASTComputed:true,
      full3DConservativeResidualProvedZero:false,
      exactSourceGlobalAllOrderTailBoundsProved:false,
      allABCDOriginalStagesCompleted:false,
      independentlyCertifiedFinalPhysicalFieldAvailable:false,
      actualFinal67NumericalJetIntervals:0,
      N706:'OPEN',N805:'OPEN',release:'HOLD'}};
  const end=G.nodes.length;
  seals.set(result,{G,five,start,end,
    delta:canonicalStringify(G.nodes.slice(start,end)),
    definitions:G.captureFunctionDefinitions(),
    record:canonicalStringify(record(result))});
  context.checkCancelled?.();
  context.onProgress?.({stage:'post-five-actual-3D-physical-residual-computed',
    nodeCount:G.nodes.length});
  return result;
}
export function assertActualPostFiveFull3DPDE(x){
  const s=seals.get(x);
  if(!s||s.G!==x?.G||s.five!==x?.five||
     s.delta!==canonicalStringify(x.G.nodes.slice(s.start,s.end))||
     s.record!==canonicalStringify(record(x))||
     !x.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_POSTFIVE_3D_SOURCE_SEAL','The actual post-five complete physical PDE AST was changed.');
  assertActualPostSignedFiveMap(x.five);
  return true;
}
export async function actualPostFiveFull3DPDECertificate(x){
  assertActualPostFiveFull3DPDE(x);
  return {schema:'MathScope.N6.PostFiveActual3DResidualASTCertificate/1',
    sha256:await sha256(canonicalStringify(record(x))),
    physicalVelocityRoots:x.velocity.fullPhysicalVelocity,
    physicalPressureRoot:x.pressure.fullPhysicalPressure,
    nonzeroAuxiliaryPDEResidualRoots:x.residual.conservative,
    actualPDEResidualProvedZero:false,
    actual67NumericJetsCertified:0,originalM3Closed:false,release:'HOLD'};
}
