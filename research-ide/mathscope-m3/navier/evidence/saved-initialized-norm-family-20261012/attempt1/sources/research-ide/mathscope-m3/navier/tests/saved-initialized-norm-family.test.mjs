import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {openSavedInitializedSource,savedInitializedSourceProgram} from '../source-saved-initialized-authority.mjs';
import {attachSavedInitializedNormFamily,assertSavedInitializedNormFamily,constructSavedInitializedNormProgram,
  assertSavedInitializedNormProgram,savedInitializedNormProgramCertificate} from '../source-saved-initialized-norm-family.mjs';
import {originalInitializedNormProgramStructure,originalInitializedNormProgramProducerReferences}
  from '../source-initialized-lazy-norm-program.mjs';

let pending;
const records={};
async function setup(){
  if(!pending)pending=(async()=>{
    const cap=await openSavedInitializedSource(),source=savedInitializedSourceProgram(cap),
      family=attachSavedInitializedNormFamily(cap),programs=[0,2].map(order=>constructSavedInitializedNormProgram(family,{order}));
    return {cap,source,family,programs};
  })();
  return pending;
}

test('the actual saved mean body issues a distinct private same-source norm family',async()=>{
  const {cap,source,family}=await setup();
  assert.equal(assertSavedInitializedNormFamily(family),true);
  assert.equal(source.nodeCount,3615866);
  assert.equal(family.source.sourceNodePrefixSHA256,cap.source.sourceNodePrefixSHA256);
  assert.deepEqual(family.sourceBinding.actualRoots,cap.actualRoots);
  assert.deepEqual(family.sourceBinding.originalSourceSequence,cap.source.originalSourceSequence);
  assert.equal(family.continuation.originalRecipeFiles.length,4);
  assert.equal(family.continuation.induction.length,7);
  assert.ok(family.continuation.originalRecipeFiles.every(r=>source.sourceFiles.some(s=>s.path===r.path&&s.sha256===r.sha256)));
  assert.equal(family.generator.importedFunctionReferencesPrivatelyRetained,true);
  assert.equal(family.scope.sameSourceNormContinuationBound,true);
  assert.equal(family.scope.originalLiveFamilyRuntimeRecreated,false);
});

test('selected C0 and C2 complete scalar norm programs execute on that same actual source family',async()=>{
  const {cap,programs}=await setup();
  for(const p of programs){
    assert.equal(assertSavedInitializedNormProgram(p),true);
    assert.equal(p.savedSourceBinding.source.sourceNodePrefixSHA256,cap.source.sourceNodePrefixSHA256);
    assert.deepEqual(p.savedSourceBinding.actualRoots.initializedVelocity,cap.actualRoots.initializedVelocity);
    assert.deepEqual(p.savedSourceBinding.actualRoots.initializedPressure,cap.actualRoots.initializedPressure);
    assert.deepEqual(p.savedSourceBinding.actualRoots.freshInputDefects,cap.actualRoots.freshInputDefects);
    assert.equal(p.scope.actualSourceIdentityAuthenticated,true);
    assert.equal(p.scope.originalAllFiniteSourceRecipeAuthenticated,true);
    assert.equal(p.scope.actualSavedSourceScalarNormCompositionExecuted,true);
    assert.equal(p.scope.sameMathematicalSourceForEveryDeferredNorm,true);
    const raw=originalInitializedNormProgramStructure(p.request);
    assert.deepEqual(p.scalarProgram,raw.scalarProgram);
    assert.deepEqual(p.callGraph,raw.callGraph);
    assert.deepEqual(p.rows,raw.rows);
    assert.deepEqual(p.sourceDemand,raw.sourceDemand);
    assert.equal(p.callGraph.calls.length,13);
    assert.equal(p.rows.length,p.request.order+1);
  }
});

test('all deferred constants select the fixed imported producer results on the original source',async()=>{
  const {programs}=await setup(),refs=originalInitializedNormProgramProducerReferences();
  for(const p of programs){
    assert.ok(p.callGraph.calls.every(c=>typeof refs[c.producer]==='function'));
    const nodes=p.scalarProgram.nodes.filter(n=>n.op==='source_norm_result');
    assert.equal(p.savedSourceBinding.leafBindings.length,nodes.length);
    for(const binding of p.savedSourceBinding.leafBindings){
      assert.deepEqual(p.scalarProgram.nodes[binding.node].args,[binding.call,binding.path]);
      assert.equal(binding.producer,p.callGraph.calls[binding.call].producer);
    }
    assert.equal(p.savedSourceBinding.originalLiveProducerAuthorityHydrated,false);
    assert.equal(p.scope.actualHighOrderSourceDerivativeBodiesMaterialized,false);
    assert.equal(p.scope.actualFinitePrivateNormAttachmentExecuted,false);
    assert.equal(p.scope.actualImprovedTangentialResidualClassCertified,false);
    assert.equal(p.scope.completeN6,false);
  }
});

test('a higher finite request continues the same original source and exact finite demand',async()=>{
  const {family,cap}=await setup(),p=constructSavedInitializedNormProgram(family,{order:13,maxWork:500000});
  assert.equal(assertSavedInitializedNormProgram(p),true);
  assert.equal(p.rows.length,14);
  assert.equal(p.sourceDemand.backgroundSlowOrder,28);
  assert.equal(p.sourceDemand.targetWeightedOrder,26);
  assert.equal(p.savedSourceBinding.source.sourceNodePrefixSHA256,cap.source.sourceNodePrefixSHA256);
  assert.ok(p.scalarProgram.nodes.length<50000);
  records.higherOrder={request:p.request,sourceDemand:p.sourceDemand,nodeCount:p.scalarProgram.nodes.length,
    finalRows:p.rows.map(r=>({order:r.order,defectExponents:Object.values(r.freshDefects).map(f=>f.epsilonExponent)})),
    sourceBinding:p.savedSourceBinding.source,scope:p.scope};
});

test('caller hashes, copied records, replacement roots and changed scalar programs cannot claim private authority',async()=>{
  const {cap,family,programs}=await setup();
  for(const fake of [{},structuredClone(cap),{source:cap.source},{sourceSHA256:cap.source.sourceNodePrefixSHA256}])
    assert.throws(()=>attachSavedInitializedNormFamily(fake),{code:'INVALID_SAVED_INITIALIZED_SOURCE'});
  for(const fake of [{},structuredClone(family),{...family},cap])
    assert.throws(()=>constructSavedInitializedNormProgram(fake),{code:'INVALID_SAVED_SOURCE_NORM_PROGRAM'});
  for(const fake of [{},structuredClone(programs[0]),{...programs[0]}])
    assert.throws(()=>assertSavedInitializedNormProgram(fake),{code:'INVALID_SAVED_SOURCE_NORM_PROGRAM'});
  const old=family.sourceBinding.actualRoots.initializedVelocity.v;
  family.sourceBinding.actualRoots.initializedVelocity.v=0;
  assert.throws(()=>assertSavedInitializedNormFamily(family),{code:'INVALID_SAVED_SOURCE_NORM_PROGRAM'});
  family.sourceBinding.actualRoots.initializedVelocity.v=old;
  const p=programs[0],leaf=p.scalarProgram.nodes.find(n=>n.op==='source_norm_result'),saved=leaf.args[0];
  leaf.args[0]=12;
  assert.throws(()=>assertSavedInitializedNormProgram(p),{code:'INVALID_SAVED_SOURCE_NORM_PROGRAM'});
  leaf.args[0]=saved;
  p.scope.completeN6=true;
  assert.throws(()=>assertSavedInitializedNormProgram(p),{code:'INVALID_SAVED_SOURCE_NORM_PROGRAM'});
  p.scope.completeN6=false;
  assert.equal(assertSavedInitializedNormProgram(p),true);
  for(const request of [{norm:1},{source:'different'},{producer:()=>1},{order:-1},{order:0,maxNodes:2}])
    assert.throws(()=>constructSavedInitializedNormProgram(family,request));
});

test('full program certificates preserve the actual roots and finite source norm expressions losslessly',async()=>{
  const {cap,source,family,programs}=await setup();
  const certificates=await Promise.all(programs.map(savedInitializedNormProgramCertificate));
  for(const [j,c]of certificates.entries()){
    assert.deepEqual(c.program,programs[j]);assert.equal(c.graph.producerCallCount,13);
    assert.equal(c.exactDeferredSourceNormExpressions,true);
    assert.equal(c.allIntegerDerivativeGraphsExecuted,false);
    assert.match(c.graph.sha256,/^[0-9a-f]{64}$/);
  }
  const rawPrograms=programs.map(p=>originalInitializedNormProgramStructure(p.request));
  const selected=[...Object.values(cap.actualRoots.background),...Object.values(cap.actualRoots.covariance),
    ...cap.actualRoots.originalStress,...Object.values(cap.actualRoots.temporalVelocity),...Object.values(cap.actualRoots.initializedVelocity),
    cap.actualRoots.temporalPressure.value,cap.actualRoots.initializedPressure.value,...Object.values(cap.actualRoots.freshInputDefects),
    ...Object.values(cap.actualRoots.initializedDefects),...Object.values(cap.actualRoots.retainedRemainderDefects)];
  records.result={schema:'MathScope.N6.SavedInitializedNormFamilyObservedGate/1',source:cap,family,certificates,
    rawProgramFixtures:{programs:rawPrograms,fixtures:{higherOrder:records.higherOrder,
      producerKeys:Object.keys(originalInitializedNormProgramProducerReferences()),producersAreActualImportedFunctions:true},
      actualPrivateCurrentIdentityUsed:false,actualHighOrderSourceLeafMaterializationExecuted:false,completeN6:false,
      scope:'Independent formal scalar substitutions below verify the same AST; they are not actual source norm values.'},
    higherOrder:records.higherOrder,
    selectedNodeBindings:[...new Set(selected)].sort((a,b)=>a-b).map(id=>({id,node:source.node(id)})),
    processObservation:{pid:process.pid,rssBytes:process.memoryUsage().rss,maxRSSBytes:process.resourceUsage().maxRSS*1024},
    actualSavedSourcePositiveBindingExecuted:true,actualHighOrderSourceLeafMaterializationExecuted:false,
    originalPrivateFamilyRuntimeHydrated:false,wholeInitialTangentialResidualClassCertified:false,completeN6:false};
});

after(async()=>{
  if(process.env.MATHSCOPE_SAVED_INITIALIZED_NORM_DIRECTORY&&records.result)await writeFile(
    process.env.MATHSCOPE_SAVED_INITIALIZED_NORM_DIRECTORY+'/saved-initialized-norm-family.json',
    JSON.stringify(records.result,null,2)+'\n',{flag:'wx'});
});
