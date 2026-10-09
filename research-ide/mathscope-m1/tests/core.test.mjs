import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {readFile} from 'node:fs/promises';
import {canonicalStringify,sha256,getContractExamples,validate} from '../../mathscope-m0/contracts.mjs';
import {migrateSession,addNode,referenceOf,reviseAssumption,verifyResearchM0Namespace,exportSessionBundle,importSessionBundle} from '../../mathscope-m0/session.mjs';
import {BASELINE} from '../../mathscope-m0/baseline-data.mjs';
import {normalizeRequest,validateDomainRequest,listExamples,executeDomain} from '../core/registry.mjs';
import {createM1Engine} from '../core/engine.mjs';
import {prepareM1SessionJob,saveM1SessionJob} from '../core/session-binding.mjs';
import {listPinnedAudits,getPinnedAudit,checkPinnedAudit,checkTheoremAdapter,verifyAdapterFixtures} from '../core/theorem-adapters.mjs';
import {createM1Tools,registerM1Tools} from '../webmcp.mjs';

const clone=x=>JSON.parse(canonicalStringify(x));
const empty=async()=>(await migrateSession({schema:'MathScopeResearchSession/0.3.1-foundation.1',id:'m1-core-test-session',objects:[{id:'legacy-object',name:'keep'}],claims:[],evidence:[]},BASELINE)).researchM0;
const fixtures=await listExamples(),prime=fixtures.find(x=>x.id==='prime-1000').request,p1=fixtures.find(x=>x.id==='p1-p3').request;
const workerFactory=source=>{
  const wrapper='const {parentPort}=require("node:worker_threads");globalThis.crypto=require("node:crypto").webcrypto;globalThis.self={postMessage:data=>parentPort.postMessage(data)};\n'+source+'\nparentPort.on("message",data=>self.onmessage({data}));';
  const w=new NodeWorker(wrapper,{eval:true}),adapter={postMessage:data=>w.postMessage(data),terminate:()=>w.terminate(),onmessage:null,onerror:null};w.on('message',data=>adapter.onmessage?.({data}));w.on('error',error=>adapter.onerror?.(error));return adapter;
};

test('request normalization owns finite inputs, is idempotent and rejects unsupported resource fields',()=>{
  const a=normalizeRequest(prime),b=clone(a);a.input.a='100';assert.equal(b.input.a,'2');assert.deepEqual(normalizeRequest(b),b);
  for(const budget of [{maxMillis:60001},{maxOperations:50000001},{maxPoints:20000},{arbitrary:1}])assert.throws(()=>normalizeRequest({...prime,budget}),/budget|runtime|cap/);
  assert.throws(()=>normalizeRequest({...prime,input:{n:9007199254740992}}),/decimal string/);
});
test('all shipped example contracts are finite and use registered domain kinds',async()=>{
  assert.ok(fixtures.length>=15);
  for(const f of fixtures){assert.ok(f.id&&f.label);const result=await validateDomainRequest(f.request);assert.equal(result.ok,true,f.id+': '+JSON.stringify(result));}
});
test('an exact P1 computation has real differentials and its actual cohomology',async()=>{
  const r=await executeDomain(p1);assert.equal(r.status,'COMPLETED');assert.deepEqual([r.results.smith.cohomology.H0.freeRank,r.results.smith.cohomology.H1.freeRank,r.results.smith.cohomology.H2.freeRank],[1,0,1]);assert.ok(r.checks.every(c=>c.pass));assert.ok(r.visualization.lines.length>0);
});
test('typed mathematical objects, installed source, exact input and finite result share one session graph',async()=>{
  const engine=createM1Engine({local:true});try{
    let ns=await empty();for(const kind of ['arithmetic.primes','arithmetic.padic','arithmetic.p1','gauge.field','ns.benchmark']){
      const f=fixtures.find(x=>x.request.kind===kind);assert.ok(f,'fixture '+kind);const id='test:'+kind.replaceAll('.','-'),before=clone(ns),prepared=await prepareM1SessionJob(ns,f.request,await engine.environment(),{id});assert.deepEqual(ns,before);
      await engine.submit(f.request,{id});const j=await engine.wait(id);assert.ok(['COMPLETED','PARTIAL'].includes(j.status),JSON.stringify(j.result));
      const saved=await saveM1SessionJob(ns,prepared,await engine.receipt(id),engine);ns=saved.namespace;
      assert.equal(ns.nodes.find(n=>n.id===prepared.job.modelRef.id).payload.schema,'MathScope.M1ObjectSpec/1');assert.ok(ns.edges.some(e=>e.type==='COMPUTES'&&e.from===id));assert.equal(saved.result.provenance.domainResultHash,j.resultHash);assert.equal(await sha256(saved.result.values.domainResult.snapshot),j.resultHash);assert.equal(saved.result.evidence.supportsCurrent,false);assert.notEqual(saved.result.evidence.grade,'FORMAL PASS');assert.equal((await verifyResearchM0Namespace(ns)).ok,true);
      const again=await saveM1SessionJob(ns,prepared,await engine.receipt(id),engine);assert.deepEqual(again.namespace,ns,'Saving twice is idempotent.');
    }
  }finally{engine.dispose();}
});
test('public JSON copies, invented receipts and mutated completed values cannot acquire execution authority',async()=>{
  const engine=createM1Engine({local:true});try{const ns=await empty(),prepared=await prepareM1SessionJob(ns,prime,await engine.environment(),{id:'receipt-test'});await engine.submit(prime,{id:'receipt-test'});await engine.wait('receipt-test');const receipt=await engine.receipt('receipt-test');assert.equal(await engine.verifyReceipt(receipt),true);assert.equal(await engine.verifyReceipt(clone(receipt)),false);await assert.rejects(()=>saveM1SessionJob(ns,prepared,clone(receipt),engine),/fresh receipt/);receipt.result.results.intervalCount=1;assert.equal(await engine.verifyReceipt(receipt),false);await assert.rejects(()=>saveM1SessionJob(ns,prepared,receipt,engine),/fresh receipt/);}finally{engine.dispose();}
});
test('rehashed metadata cannot rebind a real calculation to another object, source or adapter',async()=>{
  const engine=createM1Engine({local:true});try{const ns=await empty(),prepared=await prepareM1SessionJob(ns,prime,await engine.environment(),{id:'rebind-test'});await engine.submit(prime,{id:'rebind-test'});await engine.wait('rebind-test');const receipt=await engine.receipt('rebind-test');
    for(const change of [p=>p.job.adapter.id='arithmetic.p1',p=>p.job.input.input.b='999',p=>p.plannedNodes.at(-1).payload.request.input.b='999',p=>p.environment.workerSha256='0'.repeat(64)]){const bad=clone(prepared);change(bad);delete bad.preparationHash;bad.preparationHash=await sha256(bad);await assert.rejects(()=>saveM1SessionJob(ns,bad,receipt,engine),/modified|binding|identity|environment/);}
    const env=clone(await engine.environment());env.workerSha256='0'.repeat(64);await assert.rejects(()=>prepareM1SessionJob(ns,prime,env,{id:'bad-env'}),/installed/);
  }finally{engine.dispose();}
});
test('assumptions revised during a job make its pending interpretation unsavable, without mutating unrelated data',async()=>{
  const engine=createM1Engine({local:true});try{const a=(await getContractExamples()).AssumptionSpec;let ns=await addNode(await empty(),{kind:'AssumptionSpec',payload:a});const prepared=await prepareM1SessionJob(ns,prime,await engine.environment(),{id:'stale-test',assumptionRefs:[referenceOf(ns.nodes[0])]});await engine.submit(prime,{id:'stale-test'});await engine.wait('stale-test');ns=(await reviseAssumption(ns,a.id,'Changed bound')).namespace;const before=clone(ns);await assert.rejects(async()=>saveM1SessionJob(ns,prepared,await engine.receipt('stale-test'),engine),/changed|quarantined/);assert.deepEqual(ns,before);}finally{engine.dispose();}
});
test('immutable input snapshot survives caller edits while digest/execution is pending',async()=>{
  const engine=createM1Engine({local:true});try{const request=clone(prime),submitted=engine.submit(request);request.input.b='17';const j=await submitted,r=await engine.wait(j.id);assert.equal(r.request.input.b,'1000');assert.equal(r.result.results.intervalCount.value,'168');assert.equal(r.inputHash,await sha256(normalizeRequest(prime)));}finally{engine.dispose();}
});
test('fresh replay matches actual values and refuses rehashed input/environment forgery',async()=>{
  const engine=createM1Engine({local:true});try{const j=await engine.submit(p1);await engine.wait(j.id);const bundle=await engine.exportBundle(j.id);assert.equal((await engine.replay(bundle)).status,'MATCH');for(const mutate of [b=>b.request.input.p='5',b=>b.environment.capabilities.version='forged']){const bad=clone(bundle);mutate(bad);delete bad.bundleHash;bad.bundleHash=await sha256(bad);await assert.rejects(()=>engine.replay(bad),/digest|environment/);}}finally{engine.dispose();}
});
test('real isolated Worker runs the same P1 algorithm and result as the local evaluator',async()=>{
  const a=createM1Engine({local:true}),b=createM1Engine({workerFactory});try{const x=await a.submit(p1),y=await b.submit(p1);const [ra,rb]=await Promise.all([a.wait(x.id),b.wait(y.id)]);assert.equal(rb.status,'COMPLETED',JSON.stringify(rb.result));assert.equal(ra.resultHash,rb.resultHash);assert.equal((await b.environment()).execution,'APPLICATION_WORKER_FACTORY');}finally{a.dispose();b.dispose();}
});
test('worker cancellation terminates a running calculation and retains truthful restart semantics',async()=>{
  const engine=createM1Engine({workerFactory});try{const request=fixtures.find(x=>x.id==='prime-million').request;const j=await engine.submit(request);assert.equal(engine.cancel(j.id),true);const stopped=await engine.wait(j.id);assert.equal(stopped.status,'CANCELLED');assert.equal(engine.cancel(j.id),false);const bundle=await engine.exportBundle(j.id);assert.equal(bundle.resumePolicy,'RECOMPUTE_FROM_ORIGINAL_INPUT');}finally{engine.dispose();}
});
test('worker watchdog refuses work after its hard time budget',async()=>{
  const engine=createM1Engine({workerFactory});try{const request=clone(fixtures.find(x=>x.id==='prime-million').request);request.budget.maxMillis=1;const j=await engine.submit(request),r=await engine.wait(j.id);assert.equal(r.status,'BUDGET_EXCEEDED',JSON.stringify(r.result));}finally{engine.dispose();}
});
test('concurrent duplicate job identities are rejected atomically',async()=>{
  const engine=createM1Engine({local:true});try{const results=await Promise.allSettled([engine.submit(prime,{id:'same-id'}),engine.submit(prime,{id:'same-id'})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);await engine.wait('same-id');assert.equal(engine.listJobs().length,1);}finally{engine.dispose();}
});
test('M1 schema rejects changing the object label without changing its actual mathematical operation',async()=>{
  const engine=createM1Engine({local:true});try{const p=await prepareM1SessionJob(await empty(),p1,await engine.environment(),{id:'schema-test'}),object=clone(p.plannedNodes.at(-1).payload);assert.equal(validate('M1ObjectSpec',object).ok,true);object.objectType='Connection4D';object.domain='GAUGE';assert.equal(validate('M1ObjectSpec',object).ok,false);}finally{engine.dispose();}
});
test('a revised constructed gauge assumption cannot be overwritten by saving its original calculation again',async()=>{
  const engine=createM1Engine({local:true});try{const q=fixtures.find(f=>f.id==='su3-bpst').request,prepared=await prepareM1SessionJob(await empty(),q,await engine.environment(),{id:'component-revision'});await engine.submit(q,{id:'component-revision'});await engine.wait('component-revision');const receipt=await engine.receipt('component-revision'),saved=await saveM1SessionJob(await empty(),prepared,receipt,engine);const assumption=saved.namespace.nodes.find(n=>n.id.startsWith('m1-field-assumption:'));assert.ok(assumption);const ns=(await reviseAssumption(saved.namespace,assumption.id,'A deliberately changed physical interpretation')).namespace,before=clone(ns);await assert.rejects(()=>saveM1SessionJob(ns,prepared,receipt,engine),/constructed mathematical object was revised/);assert.deepEqual(ns,before);}finally{engine.dispose();}
});
test('domain precision failures and malformed inputs never become completed calculations',async()=>{
  const q=clone(fixtures.find(f=>f.id==='ns-heat-interval').request);q.precision.bits=100;const r=await executeDomain(q);assert.equal(r.status,'PRECISION_REQUIRED');for(const input of [null,1,'text',[]])assert.throws(()=>normalizeRequest({...prime,input}),/JSON object/);
});
test('exact pinned Lean source comparison rejects one changed source and never claims browser compilation',async()=>{
  const audits=listPinnedAudits();assert.ok(audits.length>=2,'Actual arithmetic/gauge kernel audits must be included.');for(const a of audits){const result=await checkPinnedAudit(a.id);assert.equal(result.status,'MATCHED_LOCAL_KERNEL_AUDIT',JSON.stringify(result));assert.equal(result.kernelRerun,false);assert.equal(result.formalPass,false);const changed=getPinnedAudit(a.id).sourceFiles;changed[0].content+='\n-- changed source\n';assert.equal((await checkPinnedAudit(a.id,changed)).status,'STALE');}
});
test('analytic and theorem adapter guards reject source-only promotion and unrecognized Lean targets',()=>{const r=verifyAdapterFixtures();assert.equal(r.pass,true);assert.ok(r.total>=10);assert.equal(checkTheoremAdapter({role:'LOCAL_LEAN_TARGET',auditId:'invented',target:'classical_RH',type:'True'}).ok,false);});
test('WebMCP exposes bounded named operations and refuses unknown or oversized payloads',async()=>{
  const api={getStatus:()=>({ok:true}),validateRequest:async()=>({ok:true}),runExample:async()=>({ok:true}),getJob:()=>({ok:true}),cancelJob:()=>({ok:true}),saveResult:async()=>({ok:true}),checkAdapters:()=>({ok:true})};
  const defs=createM1Tools(api);assert.equal(defs.length,7);assert.equal(new Set(defs.map(x=>x.name)).size,7);
  assert.equal((await defs[0].execute({extra:true})).ok,false);assert.equal((await defs[2].execute({exampleId:'x'.repeat(170)})).ok,false);assert.equal((await defs[1].execute({request:{text:'x'.repeat(70000)}})).ok,false);
  const registrations=[],host={modelContext:{registerTool:async(t,o)=>{registrations.push({t,o});}}};const one=await registerM1Tools(api,host);assert.equal(one.registered,true);assert.equal(registrations.length,7);const signal=registrations[0].o.signal;await registerM1Tools(api,host);assert.equal(signal.aborted,true);
});
