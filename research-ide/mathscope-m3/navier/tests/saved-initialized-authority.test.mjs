import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {openSavedInitializedSource,assertSavedInitializedSource,savedInitializedSourceProgram} from '../source-saved-initialized-authority.mjs';

let source;
const get=()=>source??=openSavedInitializedSource();

test('the fixed observed initialized mean retains its full source prefix and fresh pressure/target sequence',async()=>{
  const a=await get(),p=savedInitializedSourceProgram(a);
  assert.equal(assertSavedInitializedSource(a),true);
  assert.equal(await openSavedInitializedSource(),a);
  assert.equal(a.source.sourceDependencyCount,155);
  assert.equal(a.source.replayDependencyCount,9);
  assert.equal(p.nodeCount,3615866);
  assert.equal(a.source.completeParentSnapshotNodeCount,3892594);
  assert.match(a.source.sourceNodePrefixSHA256,/^[0-9a-f]{64}$/);
  assert.equal(p.mean.graph.sha256,a.source.originalMeanGraph.sha256);
  assert.deepEqual(a.source.originalSourceSequence,['primary-current-pressure','temporal-8.20','post-temporal-8.12',
    'five-moments-8.25-on-new-P-J','post-moment-8.12']);
  for(const key of ['P','Jtheta','Jz'])assert.equal(a.actualRoots.freshInputDefects[key],p.mean.stages.temporal.mean[key]);
  assert.notEqual(a.actualRoots.initializedPressure.value,a.actualRoots.temporalPressure.value);
  for(const stage of ['temporalVelocity','initializedVelocity'])for(const id of Object.values(a.actualRoots[stage]))assert.ok(p.node(id));
  for(const id of Object.values(a.actualRoots.retainedRemainderDefects))assert.ok(p.node(id));
  assert.equal(p.mean.nonlinear.remaindersDeclaredZero,false);
  assert.equal(a.verification.fullParentUncompressedStreamVerified,true);
  assert.equal(a.verification.all155OriginalSourceBytesVerified,true);
  assert.equal(a.verification.originalConstructorPass,false);
  assert.equal(a.verification.identitiesRecomputedDuringThisOpen,false);
});

test('the observed source identity does not grant a live family producer, a class estimate or a whole-PDE result',async()=>{
  const a=await get(),p=savedInitializedSourceProgram(a);
  for(const key of ['originalPrivateProducerAuthorityHydrated','liveFamilyRuntimeRecreated','uniformAllOrderSourceClassProved',
    'wholeIndependentPhysicalPDECompared','completeForcedCurrentCertificateRecovered','originalN602Complete','completeN6','wholeM3Complete'])
    assert.equal(a.scope[key],false,key);
  assert.equal(p.originalLiveFamily,null);assert.equal(p.originalTargetNormProducer,null);
  assert.equal(a.recipe.allFiniteNormProducerHydrated,false);
  assert.equal(a.recipe.files.length,4);
  assert.ok(p.sourceText(a.recipe.files[0].path).includes('constructTargetWeightedNorms'));
  assert.ok(p.definitionCollections.length>=10);
  assert.throws(()=>p.node(p.nodeCount),{code:'INVALID_SAVED_INITIALIZED_SOURCE'});
  assert.throws(()=>p.node(-1),{code:'INVALID_SAVED_INITIALIZED_SOURCE'});
  assert.throws(()=>p.sourceText('arbitrary-claimed-source.mjs'),{code:'INVALID_SAVED_INITIALIZED_SOURCE'});
});

test('caller replacements, copied capabilities and existing node or function-definition mutations are rejected',async()=>{
  const a=await get(),p=savedInitializedSourceProgram(a),id=a.actualRoots.initializedPressure.value;
  for(const input of [{},{source:a},a,'claimed-source-path'])
    await assert.rejects(()=>openSavedInitializedSource(input),{code:'INVALID_SAVED_INITIALIZED_SOURCE'});
  for(const clone of [structuredClone(a),Object.freeze({...a}),{...a,scope:{...a.scope,originalN602Complete:true}}])
    assert.throws(()=>assertSavedInitializedSource(clone),{code:'INVALID_SAVED_INITIALIZED_SOURCE'});
  assert.throws(()=>{p.node(id).op='rational';},TypeError);
  assert.throws(()=>{p.node(id).args[0]=0;},TypeError);
  assert.throws(()=>{p.mean.stages.moments.pressure.value=0;},TypeError);
  assert.throws(()=>{p.completeParentDefinitions.base.expressionDefinitions='[]';},TypeError);
  assert.equal(assertSavedInitializedSource(a),true);
  const selectedRoots=[...Object.values(a.actualRoots.background),...Object.values(a.actualRoots.covariance),
    ...a.actualRoots.originalStress,...Object.values(a.actualRoots.temporalVelocity),...Object.values(a.actualRoots.initializedVelocity),
    a.actualRoots.temporalPressure.value,a.actualRoots.initializedPressure.value,...Object.values(a.actualRoots.freshInputDefects),
    ...Object.values(a.actualRoots.initializedDefects),...Object.values(a.actualRoots.retainedRemainderDefects)];
  if(process.env.M3_SAVED_INITIALIZED_AUTHORITY_EVIDENCE)writeFileSync(process.env.M3_SAVED_INITIALIZED_AUTHORITY_EVIDENCE,
    JSON.stringify({schema:'MathScope.N6.SavedInitializedSourceAuthorityObservedGate/1',source:a,
      selectedNodeBindings:[...new Set(selectedRoots)].sort((a,b)=>a-b).map(id=>({id,node:p.node(id)})),
      processObservation:{pid:process.pid,rssBytes:process.memoryUsage().rss,maxRSSBytes:process.resourceUsage().maxRSS*1024,
        observation:'Actual Node process self-observation; it is not an independent whole-worker-family RSS limit.'},
      actualOriginalSourceByteReaderExecuted:true,allCompletedTestsMustStillBeCheckedInReceipt:true},null,2)+'\n',{flag:'wx'});
});
