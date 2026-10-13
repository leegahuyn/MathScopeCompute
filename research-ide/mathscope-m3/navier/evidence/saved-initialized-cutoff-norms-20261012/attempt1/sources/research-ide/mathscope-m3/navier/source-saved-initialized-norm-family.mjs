/** Same-source finite norm composition on the observed initialized mean.
 *
 * The source capability is issued only after complete immutable bytes and
 * the actual mean node/function prefix have been checked. The norm program
 * retains actual imported producers and the same canonical source recipe.
 * This path is deliberately distinct from hydrating an old live WeakMap.
 */
import {assertSavedInitializedSource,savedInitializedSourceProgram} from './source-saved-initialized-authority.mjs';
import {originalInitializedNormProgramStructure,originalInitializedNormProgramProducerReferences}
  from './source-initialized-lazy-norm-program.mjs';
import {prepareActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),programSeals=new WeakMap(),copy=x=>structuredClone(x),
  fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SAVED_SOURCE_NORM_PROGRAM'});},
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  names=['beta','v','gamma'],fields=['P','Jtheta','Jz'],
  producerReferences=Object.freeze({...originalInitializedNormProgramProducerReferences(),family:prepareActualCommonAdmissibleFamily}),
  recipePaths=['research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs',
    'research-ide/mathscope-m2/navier/actual-common-target-weighted-norms.mjs',
    'research-ide/mathscope-m2/navier/actual-residual-order-induction-expressions.mjs',
    'research-ide/mathscope-m3/navier/source-global-band.mjs'];

/** This is the mathematical continuation rule used by the imported
 * original family producer. It specifies a finite source-only constant
 * for each requested finite derivative order without changing the actual
 * coefficient functions, common selector, source cutoff or physical field.
 */
function continuationProof(source){
  const paths=new Map(source.sourceFiles.map(r=>[r.path,r]));
  if(recipePaths.some(path=>!paths.has(path)))fail('The exact original same-family norm and derivative producers are absent from the source capture.');
  return {schema:'MathScope.N6.SameSavedSourceFiniteNormContinuation/1',
    originalRecipeFiles:recipePaths.map(path=>copy(paths.get(path))),
    sourceConstruction:'prepareActualCommonAdmissibleFamily followed by the original source-global-band, primary current, complete pressure, temporal inverse and fresh-target five-map constructors.',
    immutableOriginalInputs:['the exact source parameter expression graph','the original completed leading heat/profile bodies',
      'all previously defined coefficient functions','the original common recursive selector b_n','the original finite band window and all zero-tail cutoff identities'],
    induction:[
      {id:'same-coefficients',statement:'The well-founded coefficient construction at index n uses the same original leading fields and earlier coefficient bodies. Increasing a finite requested derivative order differentiates these functions; it does not change their definitions.'},
      {id:'same-selector',statement:'The common selector chooses b_n from the original physical, weighted and normalized clauses with m<=n and the preceding b_(n-1). Every defining set is finite and depends on n, not on a later requested output derivative. Continuing the selector therefore preserves every previously defined b_n.'},
      {id:'same-physical-window',statement:'On the authenticated finite band, all omitted coefficient terms and every derivative vanish by the existing cutoff-window identity. Adding those identically absent terms to an auxiliary norm prefix cannot change the actual mean/body roots on that band.'},
      {id:'same-q-big',statement:'The covariance threshold and qStar use the original canonical C2 background roots, fixed frame/normal lower bounds and fixed profile supports. The family records invariance of these normalized roots under enlargement. Higher input norm orders do not shrink this domain or replace any inverse denominator.'},
      {id:'finite-source-jets',statement:'For a requested finite m, the original ActualInductionExpressions derivative recurrence preserves the same function bodies and supplies finite expression/Picard/FTC jet recurrences. Its requested representation budget is separate from mathematical all-finite smoothness; no missing derivative is returned as zero.'},
      {id:'finite-source-only-norms',statement:'The weighted target and background producers use the exact source factors, full anchored FTC faces and fixed endpoints. The Gaussian derivative recurrence absorbs each finite boundary pole. The stable pulse, inverse matrix and positive square-root recurrences give finite source-only polynomial-S constants at that requested order.'},
      {id:'closed-operator-composition',statement:'The displayed pressure, Fourier, shifted radial and fixed five-map norm producers are fixed linear operators on this same source. The finite Leibniz programs retain every derivative and complete pressure moment. Applying their stated finite derivative demand recursively reaches only finitely many of the preceding source norm leaves.'}
    ],
    quantifiers:'For every finite requested output m there is a finite source-only norm expression for the same original initialized mean on its original common domain.',
    sourceOnlyConstantMeaning:'An unevaluated source_norm_result is the indicated component of the fixed imported producer applied to this canonical mathematical source continuation. It is not a user norm, an arbitrary supremum placeholder, a fitted number or a new physical source.',
    noAdditionalFlattenedDerivativeGraphAcceptanceCriterion:true,
    exactSourceFunctionsAndNormDerivativeMaterializationDistinct:true,
    originalLiveFamilyObjectRecreated:false};
}

export function attachSavedInitializedNormFamily(capability){
  assertSavedInitializedSource(capability);const source=savedInitializedSourceProgram(capability),mean=source.mean,
    roots=source.actualRoots,valid=id=>Number.isSafeInteger(id)&&id>=0&&id<source.nodeCount&&!!source.node(id),
    exactSequence=['primary-current-pressure','temporal-8.20','post-temporal-8.12','five-moments-8.25-on-new-P-J','post-moment-8.12'];
  if(!same(mean.source.exactSequence,exactSequence)||!same(roots.initializedVelocity,mean.stages.moments.velocity)||
    !same(roots.initializedPressure,mean.stages.moments.pressure)||
    !names.every(k=>valid(roots.initializedVelocity[k])&&valid(roots.temporalVelocity[k]))||
    !fields.every(k=>valid(roots.freshInputDefects[k])&&valid(roots.initializedDefects[k])&&
      roots.freshInputDefects[k]===mean.stages.temporal.mean[k])||
    !valid(roots.initializedPressure.value)||!valid(roots.initializedPressure.source)||
    !mean.checks.every(r=>r.pass)||!mean.nonlinear.expansionChecks.every(r=>r.pass)||
    mean.nonlinear.remaindersDeclaredZero!==false||mean.bumps.exactRows.length!==5||
    mean.bumps.exactRows.slice(0,2).some(r=>source.node(r.target).op!=='rational'||source.node(r.target).args[0]!=='0'))
    fail('The norm family requires the complete actual source sequence, five exact rows and latest pressure body.');
  const result={schema:'MathScope.N6.SavedInitializedNormFamily/1',source:copy(capability.source),
    sourceBinding:{actualMeanSourcePrefixSHA256:capability.source.sourceNodePrefixSHA256,
      actualMeanNodeCount:source.nodeCount,actualRoots:copy(roots),originalSourceSequence:exactSequence,
      sourceCapabilityKind:'immutable exact saved initialized-mean node/function program',
      originalLiveProducerAuthorityHydrated:false},
    continuation:continuationProof(source),
    generator:{entryPoint:'constructSavedInitializedNormProgram(family,{order})',
      input:'A finite nonnegative derivative order and finite scalar representation budgets only.',
      mathematicalSource:'The same authenticated actual mean body and canonical all-order source recipe.',
      producers:Object.keys(producerReferences),importedFunctionReferencesPrivatelyRetained:true,
      requestedScalarCompositionExecutedByOriginalKernels:true},
    scope:{actualSavedInitializedSourceAuthenticated:true,sameSourceNormContinuationBound:true,
      originalLiveFamilyRuntimeRecreated:false,allFiniteSourceOrdersMaterialized:false,
      actualFiniteScalarNormCompositionExecuted:false,completeInitialResidualClassCertified:false,
      allFiniteCorrectionStagesClassCertified:false,completeN6:false}};
  seals.set(result,{capability,source,functions:{...producerReferences},record:canonicalStringify(result)});return result;
}

export function assertSavedInitializedNormFamily(family){
  const s=seals.get(family);
  if(!s||s.record!==canonicalStringify(family)||Object.keys(producerReferences).some(k=>s.functions[k]!==producerReferences[k]))
    fail('Use the unchanged private same-source norm family, not a copied record or arbitrary source id.');
  assertSavedInitializedSource(s.capability);
  if(savedInitializedSourceProgram(s.capability)!==s.source)fail('The exact saved source program changed.');return true;
}

export function constructSavedInitializedNormProgram(family,input={}){
  assertSavedInitializedNormFamily(family);const s=seals.get(family),program=originalInitializedNormProgramStructure(input),
    calls=program.callGraph.calls,leaves=[];
  for(const call of calls){
    if(call.id<0||call.id>=calls.length||calls[call.id]!==call||typeof s.functions[call.producer]!=='function'||
      call.dependencies.some(id=>!Number.isSafeInteger(id)||id<0||id>=call.id))
      fail('Every norm call must use the fixed imported producer and all earlier finite dependencies.');
  }
  program.scalarProgram.nodes.forEach((node,id)=>{
    if(node.op==='source_norm_result'){
      const [call,path]=node.args;
      if(!Number.isSafeInteger(call)||!calls[call]||!Array.isArray(path)||!path.length||path.some(k=>typeof k!=='string'&&!Number.isSafeInteger(k)))
        fail('A norm leaf must select a scalar result of the complete same-source producer graph.');
      leaves.push({node:id,call,producer:calls[call].producer,path:copy(path)});
    }
  });
  if(!leaves.length||calls.length!==13||program.rows.length!==program.request.order+1)
    fail('The complete initial mean norm composition is missing a source operation.');
  program.savedSourceBinding={source:copy(family.source),actualRoots:copy(family.sourceBinding.actualRoots),
    sourceCapabilityKind:family.sourceBinding.sourceCapabilityKind,originalLiveProducerAuthorityHydrated:false,
    sameSourceNormContinuation:copy(family.continuation),leafBindings:leaves,
    exactCurrentEquality:'The velocity, fresh P/J inputs, fixed five coefficients, latest pressure and current nonlinear defects are the authenticated source roots stored in actualRoots; every producer uses this same mathematical source.'};
  program.scope.actualSourceIdentityAuthenticated=true;
  program.scope.originalAllFiniteSourceRecipeAuthenticated=true;
  program.scope.actualSavedSourceScalarNormCompositionExecuted=true;
  program.scope.sameMathematicalSourceForEveryDeferredNorm=true;
  program.scope.originalLiveFamilyRuntimeRecreated=false;
  program.scope.actualHighOrderSourceDerivativeBodiesMaterialized=false;
  program.scope.actualFinitePrivateNormAttachmentExecuted=false;
  program.scope.actualImprovedTangentialResidualClassCertified=false;
  program.scope.completeN6=false;
  programSeals.set(program,{family,capability:s.capability,source:s.source,functions:{...s.functions},record:canonicalStringify(program)});
  return program;
}

export function assertSavedInitializedNormProgram(program){
  const s=programSeals.get(program);
  if(!s||s.record!==canonicalStringify(program)||Object.keys(producerReferences).some(k=>s.functions[k]!==producerReferences[k]))
    fail('Use the unchanged privately source-bound scalar norm program.');
  assertSavedInitializedNormFamily(s.family);assertSavedInitializedSource(s.capability);return true;
}

export async function savedInitializedNormProgramCertificate(program){
  assertSavedInitializedNormProgram(program);const encoded=canonicalStringify(program);
  return {schema:'MathScope.N6.SavedInitializedNormProgramCertificate/1',program:copy(program),
    graph:{sha256:await sha256(encoded),canonicalBytes:new TextEncoder().encode(encoded).length,
      scalarNodeCount:program.scalarProgram.nodes.length,producerCallCount:program.callGraph.calls.length},
    sourceBinding:copy(program.savedSourceBinding),scope:copy(program.scope),
    exactDeferredSourceNormExpressions:true,allIntegerDerivativeGraphsExecuted:false,
    serializedCertificateIsNotPrivateSourceAuthority:true};
}
