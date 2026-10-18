/** Exact cutoff dependence of the authenticated, recorded pre-temporal
 * auxiliary inverse. Source norms stay exact scalar expressions. This
 * derives a tail comparison, not fresh Fourier sums or final-field samples.
 */
import {recordedGlobalTemporalInverse,globalTemporalInverseObservations} from './source-global-temporal-evidence.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=x=>structuredClone(x);
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const require=(ok,message)=>{if(!ok)fail('INVALID_TEMPORAL_CUTOFF_REFINEMENT',message);};
const FORMULA='8*(2+sqrt(2))*C_(m+4)/((2*pi)^5*K)';

function requestOf(input){
  require(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>k==='cutoffs'),
    'Only finite Fourier cutoffs may change; source bodies, constants, norms and completion flags are fixed.');
  const cutoffs=input.cutoffs??[1,2,4,8];
  if(!Array.isArray(cutoffs)||!cutoffs.length||cutoffs.length>8||new Set(cutoffs).size!==cutoffs.length||
      cutoffs.some(k=>!Number.isSafeInteger(k)||k<1||k>1048576))
    fail('RESOURCE_LIMIT','Choose 1..8 distinct positive integer cutoffs through 1048576. No Fourier modes are enumerated by this tail comparison.');
  return {cutoffs:[...cutoffs].sort((a,b)=>a-b)};
}

export async function evaluateRecordedTemporalCutoffRefinement(input={}){
  const request=requestOf(input),archive=await recordedGlobalTemporalInverse();
  globalTemporalInverseObservations(archive);
  const rows=[];
  for(const [component,inverse]of Object.entries(archive.summary.inverses)){
    require(inverse.sourceAuthenticated===true&&inverse.finite.cutoff===1&&!inverse.finiteSumReplacesExactLimit,
      'Use the original authenticated K=1 inverse with its complete omitted tail.');
    for(const tail of inverse.finite.tails){
      require(tail.cutoff==='1'&&tail.sourceDerivativeOrder===tail.derivativeOrder+4&&tail.exactFormula===FORMULA&&
        tail.tailTendsToZero===true&&tail.omittedModesSetToZero===false&&Number.isSafeInteger(tail.sourceBound.upper)&&
        Number.isSafeInteger(tail.upper),'Keep the executed full-lattice source derivative bound and exact original formula.');
      for(const K of request.cutoffs){
        const latticeModes=(2*K+1)**2-1;
        rows.push({component,derivativeOrder:tail.derivativeOrder,sourceDerivativeOrder:tail.sourceDerivativeOrder,K,
          sourceSHA256:archive.summary.graph.sha256,sourceArtifactSHA256:archive.artifact.sha256,
          originalResidualRoot:inverse.finite.body,originalSourceDerivativeBoundRoot:tail.sourceBound.upper,
          originalK1TailBoundRoot:tail.upper,omittedBoundScalar:`(source_scalar(${tail.upper}))/(${K})`,
          omittedBoundFormula:FORMULA,relativeToK1Exact:K===1?'1':`1/${K}`,
          representedNonzeroModeCount:latticeModes,representedRealConjugatePairCount:latticeModes/2,
          omittedLattice:'All k in Z^2 with max(|k0|,|k1|)>K',
          summationBound:'sum_(n=K+1)^infinity n^-2 <= integral_K^infinity x^-2 dx = 1/K',
          sourceScalarIsANumericalValue:false,freshFourierCoefficientIntegralsComputed:false,
          originalFullOmittedTailRetained:true});
      }
    }
  }
  const comparisons=[];
  for(const component of Object.keys(archive.summary.inverses))for(const derivativeOrder of [0,1]){
    const selected=rows.filter(r=>r.component===component&&r.derivativeOrder===derivativeOrder);
    for(let i=1;i<selected.length;i++){
      const prior=selected[i-1],current=selected[i];
      comparisons.push({component,derivativeOrder,previousK:prior.K,currentK:current.K,
        exactBoundRatio:`${prior.K}/${current.K}`,cutoffDoubled:current.K===2*prior.K,
        sameOriginalSourceDerivativeBound:prior.originalSourceDerivativeBoundRoot===current.originalSourceDerivativeBoundRoot,
        independentCutoffAxis:true,observedNumericalFourierDifference:null});
    }
  }
  const result={schema:'MathScope.N8.RecordedTemporalCutoffRefinement/1',
    status:'EXACT_RECORDED_SOURCE_FOURIER_TAIL_COMPARISON_PRE_TEMPORAL',request,
    source:{archiveSHA256:archive.archiveSHA256,paperSHA256:archive.summary.source.paperSHA256,
      graphSHA256:archive.summary.graph.sha256,artifact:copy(archive.artifact),packedArtifact:copy(archive.packedArtifact),
      fieldStage:'Actual full tangential mean residuals before the temporal mean update; the initialized/final field is a separate source.',
      recordedSourceGate:copy(archive.gate)},rows,comparisons,
    limitation:'Only the original pre-temporal auxiliary inverse tail depends on K here. No source norm is assigned a numeric value and no K>1 Fourier sum is evaluated. This does not resolve final annular/core, axial/pulse, active-cutoff or whole-field error obligations of N8-05.',
    scope:{archiveAuthenticated:true,sourceDerivedFullLatticeTailScaling:true,recordedOnly:true,newExecutionOfSourceConstructor:false,
      freshFourierSumsEvaluated:false,numericalFieldSamplesGenerated:false,finalFieldSourceAttached:false,
      axialAndPulseScalesResolved:false,activeFinalCutoffsResolved:false,numericalFourAxisRefinementComplete:false,
      originalN805Complete:false,originalN601Complete:false,originalN602Complete:false,wholeM3Complete:false},
    lastResolvedTau:null};
  const complete={...result,resultSHA256:await sha256(canonicalStringify(result))};
  seals.set(complete,canonicalStringify(complete));return complete;
}

export function assertRecordedTemporalCutoffRefinement(result){
  require(seals.has(result)&&seals.get(result)===canonicalStringify(result),
    'Use the unchanged privately derived source table; copied data or relabelled completion flags have no source authority.');
  return true;
}

export function recordedTemporalCutoffRefinementObservations(result){
  assertRecordedTemporalCutoffRefinement(result);
  return {kind:'RECORDED_SOURCE_FOURIER_TAIL_REFINEMENT',samples:[],curves:[],tables:copy(result.rows),
    source:copy(result.source),comparisons:copy(result.comparisons),limitation:result.limitation,
    sourceExpressionIdsAreNumericalValues:false,resultSHA256:result.resultSHA256,scope:copy(result.scope)};
}
