/** Source identity for norm generators on the ORIGINAL initialized mean.
 *
 * This capability can only be made from the live, privately constructed
 * temporal-before-five source. It authenticates that source, its actual
 * roots and its all-finite source recipe. It does not by itself prove any
 * velocity/residual norm or upgrade an archived record to a live source.
 */
import {assertGlobalInitializedMean,globalInitializedMeanCertificate} from './source-global-initial-mean.mjs';
import {assertActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),byMean=new WeakMap(),copy=x=>structuredClone(x),
  fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});},
  record=p=>({schema:p.schema,source:p.source,actualRoots:p.actualRoots,recipe:p.recipe,scope:p.scope}),
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);

/** No source id, numerical norm, source hash or caller completion flag is
 * an accepted input. The existing parent assertions check the complete
 * immutable node/function prefixes, not just a record's public labels.
 */
export function attachOriginalInitializedNormAuthority(mean){
  assertGlobalInitializedMean(mean);
  const current=mean.temporal.pressure.current,family=current.band.family;
  assertActualCommonAdmissibleFamily(family);
  if(byMean.has(mean)){
    const prior=byMean.get(mean);assertOriginalInitializedNormAuthority(prior);return prior;
  }
  if(mean.template.current!==current||mean.G!==mean.temporal.G||
    !mean.checks.every(r=>r.pass)||!family.uniformCovariance.universalAnalyticRecipeSourceBound||
    !family.scope.allFixedDerivativeClausesBySameRecipe||
    !same(mean.source.exactSequence,['primary-current-pressure','temporal-8.20','post-temporal-8.12',
      'five-moments-8.25-on-new-P-J','post-moment-8.12'])||
    !['P','Jtheta','Jz'].every(k=>mean.bumps.actualInputDefects[k]===mean.stages.temporal.mean[k])||
    !mean.stages.temporal.checks.every(r=>r.pass)||!mean.stages.moments.checks.every(r=>r.pass)||
    !mean.nonlinear.expansionChecks.every(r=>r.pass)||mean.nonlinear.remaindersDeclaredZero!==false)
    fail('Use the complete original same-family temporal/fresh-target/five-map/latest-pressure construction.');
  const result={schema:'MathScope.N6.OriginalInitializedNormAuthority/1',
    source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
      sourceNamespace:'same private initializedMean.G',normFamilyNamespace:'same private current.band.family',
      selectedSourceDerivativeOrder:family.request.derivativeOrder,selectedSourceCoefficientOrder:family.request.throughOrder,
      fixedSourceQBig:family.constants.qStar,sourceSequence:copy(mean.source.exactSequence)},
    actualRoots:{geometry:copy(mean.temporal.pressure.geometry),background:copy(mean.stages.temporal.mean.background),
      covariance:copy(mean.stages.temporal.mean.fullAngularCovariance),stress:copy(mean.stages.temporal.mean.fullOriginalStress),
      primaryPressure:mean.temporal.pressure.pressure.value,
      temporalVelocity:copy(mean.stages.temporal.velocity),temporalPressure:copy(mean.stages.temporal.pressure),
      freshInputDefects:copy(mean.bumps.actualInputDefects),fiveCoefficients:copy(mean.bumps.coefficients),
      initializedVelocity:copy(mean.stages.moments.velocity),initializedPressure:copy(mean.stages.moments.pressure),
      initializedDefects:copy(mean.nonlinear.actualNewDefects),nonlinearRemainderDefects:copy(mean.nonlinear.remainderDefects),
      exactFiveRows:copy(mean.bumps.exactRows),potential:copy(mean.potential),conservation:copy(mean.conservation)},
    recipe:{base:'The exact private original common-family analytic recipe, including the common recursive selector and the well-founded all-order coefficient construction.',
      finiteLeafMeaning:'At each requested finite order, use the same source-only norm producer and its complete source integrands, fixed endpoints, derivative recurrence and finite coefficient maximum.',
      coherence:'A larger finite norm demand continues the same mathematical coefficient/selector recipe. It does not choose a new physical source or a new Q_big.',
      sourceFunctionEntryPoint:'family.constructTargetWeightedNorms',
      noFlattenedDerivativeGraphRequirement:true,finiteMaterializationAndUniversalRecurrenceSeparate:true},
    scope:{actualInitializedSourceIdentityAuthenticated:true,originalAllFiniteSourceRecipeAuthenticated:true,
      actualNewNormRowsMaterialized:false,actualVelocityClassesProved:false,actualResidualClassesProved:false,
      completeInitialTupleClassCertified:false,allFiniteIterationClassesCertified:false,completeN6:false}};
  seals.set(result,{mean,current,family,G:mean.G,record:canonicalStringify(record(result)),
    targetProducer:family.constructTargetWeightedNorms});
  byMean.set(mean,result);return result;
}

export function assertOriginalInitializedNormAuthority(p){
  const s=seals.get(p);
  if(!s||s.mean.G!==s.G||s.current!==s.mean.temporal.pressure.current||s.family!==s.current.band.family||
    s.targetProducer!==s.family.constructTargetWeightedNorms||s.record!==canonicalStringify(record(p)))
    fail('Use the unchanged private initialized source capability; copied records, labels and hashes do not authenticate a source.');
  assertGlobalInitializedMean(s.mean);assertActualCommonAdmissibleFamily(s.family);return true;
}

/** Generator implementations receive the actual authenticated parents.
 * Their identity remains guarded by assertOriginalInitializedNormAuthority
 * on each public consumer call. No serialized record can call this path.
 */
export function originalInitializedNormSource(p){
  assertOriginalInitializedNormAuthority(p);const s=seals.get(p);
  return {mean:s.mean,current:s.current,family:s.family,G:s.G,
    targetNormProducer:s.targetProducer};
}

export async function originalInitializedNormAuthorityCertificate(p){
  assertOriginalInitializedNormAuthority(p);const s=seals.get(p),parent=await globalInitializedMeanCertificate(s.mean),
    program={schema:'MathScope.N6.OriginalInitializedNormSourceBinding/1',parentGraph:parent.graph,record:record(p)},
    encoded=canonicalStringify(program);
  return {...record(p),parent:parent.graph,program,graph:{sha256:await sha256(encoded),
    canonicalBytes:new TextEncoder().encode(encoded).length,requiresCompleteAuthenticatedActualMeanProgram:true},
    serializedCertificateIsNotLiveSourceAuthority:true,numericalNormValuesComputed:false};
}
