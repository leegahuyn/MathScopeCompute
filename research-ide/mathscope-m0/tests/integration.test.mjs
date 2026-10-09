import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareSessionJob,saveSessionJob} from '../integration.mjs';
import {createComputeEngine,createExampleJob} from '../compute.mjs';
import {migrateSession,addNode,reviseAssumption,referenceOf,verifyResearchM0Namespace,exportSessionBundle,importSessionBundle,revalidateImportedInputs,addDependencyExample} from '../session.mjs';
import {sha256,getContractExamples} from '../contracts.mjs';
const baseline=JSON.parse(await readFile(new URL('../baseline/manifest.json',import.meta.url),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x));
const empty=async()=>(await migrateSession({schema:'MathScopeResearchSession/0.3.1-foundation.1',id:'rs-integration',objects:[],claims:[],evidence:[]},baseline)).researchM0;

test('all four actual adapters bind installed source, finite target, request and freshly verified result in one namespace',async()=>{
  const engine=createComputeEngine({preferWorker:false});let ns=await empty();
  try{
    for(const adapter of ['prime-segment','padic-delta','rational-interval','integer-matrix-product']){
      const fixture=await createExampleJob(adapter),before=clone(ns);
      const prepared=await prepareSessionJob(fixture,ns,await engine.capabilities());
      assert.deepEqual(ns,before);
      assert.notEqual(prepared.request.modelRef.hash,fixture.modelRef.hash);
      const plannedSource=prepared.plannedNodes.find(n=>n.kind==='source')||ns.nodes.find(n=>n.id===prepared.request.sourceRefs[0].id);
      assert.equal(prepared.request.sourceRefs[0].hash,await sha256(plannedSource.payload));
      assert.notEqual(prepared.request.sourceRefs[0].hash,plannedSource.payload.entries[0].sha256);
      const pending=await engine.submit(prepared.request),job=await engine.wait(pending.id);
      assert.equal(job.status,'COMPLETED');
      ns=await saveSessionJob(ns,prepared,job);
      assert.equal(ns.nodes.find(n=>n.id===`result:${job.id}`).payload.evidence.grade,'CERTIFIED NUMERICAL');
      assert.ok(ns.edges.some(e=>e.type==='COMPUTES'&&e.from===job.id));
      assert.equal((await verifyResearchM0Namespace(ns)).ok,true);
    }
    assert.equal(ns.nodes.filter(n=>n.kind==='source').length,1);
    assert.equal(ns.nodes.filter(n=>n.kind==='result').length,4);
  }finally{engine.dispose();}
});
test('actual registered model reference is preserved and incompatible edited prime bounds are rejected',async()=>{
  const engine=createComputeEngine({preferWorker:false});
  try{
    const request=await createExampleJob('prime-segment'),first=await prepareSessionJob(request,await empty(),await engine.capabilities());
    let ns=await empty();for(const node of first.plannedNodes)ns=await addNode(ns,node);
    const preserved=await prepareSessionJob(first.request,ns,await engine.capabilities());
    assert.deepEqual(preserved.request.modelRef,first.request.modelRef);assert.equal(preserved.plannedNodes.length,0);
    const edited=clone(first.request);edited.input.upper='999';edited.scope.primeInterval.upper='999';
    const capabilities=await engine.capabilities();
    await assert.rejects(()=>prepareSessionJob(edited,ns,capabilities),/different bounds/);
  }finally{engine.dispose();}
});
test('unknown assumptions and forged installed-worker manifests cannot produce a prepared job',async()=>{
  const engine=createComputeEngine({preferWorker:false});
  try{
    const fixture=await createExampleJob('prime-segment'),cap=await engine.capabilities(),ns=await empty();
    fixture.assumptionRefs=[{id:'unregistered-gap',revision:'unregistered-gap:r1',hash:'0'.repeat(64)}];
    await assert.rejects(()=>prepareSessionJob(fixture,ns,cap),/unresolved/);
    fixture.assumptionRefs=[];cap.sourceManifest[0].sha256='0'.repeat(64);
    await assert.rejects(()=>prepareSessionJob(fixture,ns,cap),/installed fixed source/);
  }finally{engine.dispose();}
});
test('finite arithmetic adapters reject relabeled YM/PDE/prism targets and stale generated operand contexts',async()=>{
  const engine=createComputeEngine({preferWorker:false});
  try{
    const cap=await engine.capabilities(),examples=await getContractExamples();let ns=await empty();
    for(const kind of ['SourceManifest','GaugeGroupSpec','StateFamilySpec','PDEConstructionSpec','PrismSpec'])ns=await addNode(ns,{kind,payload:examples[kind]});
    for(const kind of ['StateFamilySpec','PDEConstructionSpec','PrismSpec']){
      const request=await createExampleJob('integer-matrix-product');request.modelRef=referenceOf(ns.nodes.find(n=>n.id===examples[kind].id));
      await assert.rejects(()=>prepareSessionJob(request,ns,cap),/cannot be computed by relabeling/);
    }
    const first=await prepareSessionJob(await createExampleJob('rational-interval'),ns,cap);
    for(const node of first.plannedNodes)ns=await addNode(ns,node);
    assert.deepEqual((await prepareSessionJob(first.request,ns,cap)).request.modelRef,first.request.modelRef);
    const changed=clone(first.request);changed.input.operation='add';
    await assert.rejects(()=>prepareSessionJob(changed,ns,cap),/exact finite adapter\/input/);
  }finally{engine.dispose();}
});
test('assumption revision while a job runs prevents saving a stale interpretation and does not mutate the session',async()=>{
  const engine=createComputeEngine({preferWorker:false});
  try{
    const examples=await getContractExamples();let ns=await addNode(await empty(),{kind:'AssumptionSpec',payload:examples.AssumptionSpec});
    const fixture=await createExampleJob('prime-segment');fixture.assumptionRefs=[referenceOf(ns.nodes[0])];
    const prepared=await prepareSessionJob(fixture,ns,await engine.capabilities());
    const pending=await engine.submit(prepared.request),job=await engine.wait(pending.id);
    ns=(await reviseAssumption(ns,examples.AssumptionSpec.id,'Changed gap bound after job submission')).namespace;
    const before=clone(ns);await assert.rejects(()=>saveSessionJob(ns,prepared,job),/revised|stale/);assert.deepEqual(ns,before);
  }finally{engine.dispose();}
});
test('modified request or fabricated result values fail before save',async()=>{
  const engine=createComputeEngine({preferWorker:false});
  try{
    const ns=await empty(),prepared=await prepareSessionJob(await createExampleJob('prime-segment'),ns,await engine.capabilities());
    const pending=await engine.submit(prepared.request),job=await engine.wait(pending.id);
    const bad=clone(prepared);bad.request.input.upper='10';await assert.rejects(()=>saveSessionJob(ns,bad,job),/Prepared request was modified/);
    const forged=clone(job);forged.result.values={count:{kind:'INTEGER',value:'0'}};await assert.rejects(()=>saveSessionJob(ns,prepared,forged),/content hash/);
    assert.equal(ns.nodes.length,0);
  }finally{engine.dispose();}
});
test('explicit imported-input revalidation permits a fresh computation while old results remain untrusted',async()=>{
  const engine=createComputeEngine({preferWorker:false});
  try{
    const cap=await engine.capabilities();let ns=await empty();
    const fixture=await createExampleJob('prime-segment'),prepared=await prepareSessionJob(fixture,ns,cap);
    const pending=await engine.submit(prepared.request),first=await engine.wait(pending.id);ns=await saveSessionJob(ns,prepared,first);
    ns=await importSessionBundle(await exportSessionBundle(ns));
    const oldResult=ns.nodes.find(n=>n.id===`result:${first.id}`),oldGrade=oldResult.payload.evidence.grade;
    assert.equal(oldResult.effectiveTrust,'REVALIDATION_REQUIRED');
    await assert.rejects(()=>prepareSessionJob(fixture,ns,cap),/imported revision/);
    await assert.rejects(()=>revalidateImportedInputs(ns,{expectedBaselineHash:'0'.repeat(64)}),/exact baseline/);
    ns=await revalidateImportedInputs(ns,{expectedBaselineHash:ns.baselineHash});
    assert.equal(ns.events.at(-1).verification,'CONTRACT_AND_HASH_ONLY');
    assert.equal(ns.nodes.find(n=>n.id===oldResult.id).effectiveTrust,'REVALIDATION_REQUIRED');
    assert.equal(ns.nodes.find(n=>n.id===first.id).freshness,'REVALIDATION_REQUIRED');
    fixture.id='fresh-after-import';const next=await prepareSessionJob(fixture,ns,cap);
    const running=await engine.submit(next.request),second=await engine.wait(running.id);ns=await saveSessionJob(ns,next,second);
    assert.equal(second.status,'COMPLETED');
    assert.equal(ns.nodes.find(n=>n.id===oldResult.id).payload.evidence.grade,oldGrade);
    assert.equal(ns.nodes.find(n=>n.id===oldResult.id).effectiveTrust,'REVALIDATION_REQUIRED');
    assert.equal(ns.nodes.find(n=>n.id===`result:${second.id}`).freshness,'CURRENT');
    assert.ok(ns.nodes.every(n=>n.supportsCurrent===false));
  }finally{engine.dispose();}
});
test('input revalidation does not revive already stale or historical dependencies',async()=>{
  const demo=await addDependencyExample(await empty());
  const revised=await reviseAssumption(demo.namespace,demo.assumptionId,'Changed bound before export');
  const imported=await importSessionBundle(await exportSessionBundle(revised.namespace));
  const after=await revalidateImportedInputs(imported,{expectedBaselineHash:imported.baselineHash});
  for(const id of demo.dependentIds)assert.equal(after.nodes.find(n=>n.id===id).freshness,'STALE');
  assert.equal(after.history[0].freshness,'HISTORICAL');
  assert.equal(after.history[0].effectiveTrust,'REVALIDATION_REQUIRED');
});
