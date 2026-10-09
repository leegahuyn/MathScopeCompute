import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {migrateSession,verifyResearchM0Namespace} from '../../mathscope-m0/session.mjs';
import {BASELINE} from '../../mathscope-m0/baseline-data.mjs';
import {listExamples,validateDomainRequest,executeDomain} from '../core/registry.mjs';
import {createM1Engine} from '../core/engine.mjs';
import {prepareM1SessionJob,saveM1SessionJob} from '../core/session-binding.mjs';
import {FOLLOWUP_KINDS} from '../navier/followup-construction/index.mjs';
import {makeBudget,validatePrecision} from '../navier/numerics.mjs';

const clone=x=>JSON.parse(canonicalStringify(x));
const fixtures=(await listExamples()).filter(e=>FOLLOWUP_KINDS.includes(e.request.kind));
const workerFactory=source=>{
  const wrapper='const {parentPort}=require("node:worker_threads");globalThis.crypto=require("node:crypto").webcrypto;globalThis.self={postMessage:data=>parentPort.postMessage(data)};\n'+source+'\nparentPort.on("message",data=>self.onmessage({data}));';
  const w=new NodeWorker(wrapper,{eval:true}),a={postMessage:d=>w.postMessage(d),terminate:()=>w.terminate(),onmessage:null,onerror:null};
  w.on('message',d=>a.onmessage?.({data:d}));w.on('error',e=>a.onerror?.(e));return a;
};
const exactKinds=['ns.axis-certificate','ns.axis-source-certificate','ns.pressure-certificate'];
const expected=e=>exactKinds.includes(e.request.kind)?'COMPLETED':'PARTIAL';
const mathematicalBody=r=>{const {executionMetrics,...body}=r;return body;};

test('new source constructions have unique, valid, finite shipped requests',async()=>{
  assert.equal(fixtures.length,11);
  assert.equal(new Set(fixtures.map(e=>e.id)).size,fixtures.length);
  for(const e of fixtures)assert.equal((await validateDomainRequest(e.request)).ok,true,e.id);
});

for(const e of fixtures)test(e.id+': isolated Worker, exact local result identity, and bounded source scope',async()=>{
  const engine=createM1Engine({workerFactory});
  try{
    const local=await executeDomain(e.request),job=await engine.submit(e.request),fresh=await engine.wait(job.id);
    assert.equal(local.status,expected(e),JSON.stringify({id:e.id,message:local.message,domainStatus:local.domainStatus}));
    assert.equal(fresh.status,local.status,JSON.stringify(fresh.result));
    assert.deepEqual(mathematicalBody(fresh.result),mathematicalBody(local));
    assert.equal(fresh.result.fullProfileCertified,false);
    assert.equal(fresh.result.contract.fullNavierStokesSolution,false);
    assert.equal(fresh.result.sourceConstructionScope.completedGlobalWitness,false);
    assert.ok(fresh.result.blockers.length>0);
    assert.ok(fresh.result.visualization.points.length>0);
    assert.ok(fresh.result.visualization.points.every(p=>p.pos.length===3&&p.pos.every(Number.isFinite)));
    assert.equal('execution' in fresh.result,false,'Runtime must not change mathematical replay hashes.');
    assert.equal(await sha256(mathematicalBody(local)),fresh.mathematicalHash);
  }finally{engine.dispose();}
});

test('exact axis certificate remains exact in M0, keeps theorem-reference premises, and replays freshly',async()=>{
  const e=fixtures.find(e=>e.request.kind==='ns.axis-certificate'),engine=createM1Engine({workerFactory});
  try{
    let ns=(await migrateSession({schema:'MathScopeResearchSession/0.3.1-foundation.1',id:'followup-session',objects:[],claims:[],evidence:[]},BASELINE)).researchM0;
    const id='followup:axis',prepared=await prepareM1SessionJob(ns,e.request,await engine.environment(),{id});
    assert.equal(prepared.job.precision.kind,'EXACT');
    const model=prepared.plannedNodes.find(n=>n.payload.schema==='MathScope.M1ObjectSpec/1');
    assert.equal(model.payload.interpretation.externalComparison,'THEOREM_REFERENCE');
    assert.equal(model.payload.interpretation.universalProof,false);
    await engine.submit(e.request,{id});const job=await engine.wait(id);
    assert.equal(job.result.bounds.selfMapDisplacementUpper.exact,'1/400');
    assert.equal(job.result.bounds.uniformPhiPositiveLower.exact,'16011107/61056000');
    const saved=await saveM1SessionJob(ns,prepared,await engine.receipt(id),engine);
    ns=saved.namespace;
    assert.equal((await verifyResearchM0Namespace(ns)).ok,true);
    assert.equal(saved.result.evidence.supportsCurrent,false);
    assert.notEqual(saved.result.evidence.grade,'FORMAL PASS');
    assert.equal(await sha256(saved.result.values.domainResult.snapshot),job.resultHash);
    const bundle=await engine.exportBundle(id),fresh=createM1Engine({workerFactory});
    try{const replay=await fresh.replay(bundle);assert.equal(replay.status,'MATCH');assert.equal(replay.importedEvidenceTrusted,false);}finally{fresh.dispose();}
    const forged=clone(bundle);forged.result.bounds.uniformPhiPositiveLower.exact='1';
    delete forged.bundleHash;forged.bundleHash=await sha256(forged);
    await assert.rejects(()=>engine.replay(forged),/digest mismatch/);
  }finally{engine.dispose();}
});

test('all new component kinds bind to typed M0 objects without universal or continuum promotion',async()=>{
  const engine=createM1Engine({local:true});
  try{
    const ns=(await migrateSession({schema:'MathScopeResearchSession/0.3.1-foundation.1',id:'followup-types',objects:[],claims:[],evidence:[]},BASELINE)).researchM0;
    for(const [i,e] of fixtures.entries()){
      const p=await prepareM1SessionJob(ns,e.request,await engine.environment(),{id:'followup:type-'+i});
      const model=p.plannedNodes.find(n=>n.payload.schema==='MathScope.M1ObjectSpec/1').payload;
      assert.equal(model.objectType,'NavierStokesComponent');
      assert.equal(model.domain,'PDE');
      assert.equal(model.interpretation.continuumClaim,false);
      assert.equal(model.interpretation.universalProof,false);
      if(exactKinds.includes(e.request.kind)){
        assert.equal(p.job.precision.kind,'EXACT');
        assert.equal(model.interpretation.externalComparison,'THEOREM_REFERENCE');
      }
      assert.deepEqual(model.request.input,e.request.input);
    }
  }finally{engine.dispose();}
});

test('actual B34/B8 debt, scope and source remain bound through M0 save and a fresh Worker replay',async()=>{
  const e=fixtures.find(e=>e.request.kind==='ns.source-inner-gluing'),engine=createM1Engine({workerFactory});
  try{
    const ns=(await migrateSession({schema:'MathScopeResearchSession/0.3.1-foundation.1',id:'inner-gluing-session',objects:[],claims:[],evidence:[]},BASELINE)).researchM0;
    const id='followup:source-inner-gluing',p=await prepareM1SessionJob(ns,e.request,await engine.environment(),{id});
    await engine.submit(e.request,{id});const j=await engine.wait(id),r=j.result;
    assert.equal(j.status,'PARTIAL');
    assert.equal(r.inputContract.externalMomentDebtAllowed,false);
    assert.equal(r.inputContract.syntheticMomentDebt,false);
    assert.equal(r.sourceConstructionScope.entireEtaIntervalCertified,false);
    assert.ok(r.sourceConstructionScope.originalAcceptanceIds.includes('N3-05'));
    assert.equal(r.etaStencilCorrections.length,3);
    assert.ok(r.etaStencilCorrections.every(c=>c.finiteNumericalMomentMatch&&c.intervalNewtonCertified===false));
    assert.ok(r.etaStencilCorrections.some(c=>c.actualDebtFloat64.some(x=>Math.abs(x)>1e-10)));
    const saved=await saveM1SessionJob(ns,p,await engine.receipt(id),engine);
    assert.equal((await verifyResearchM0Namespace(saved.namespace)).ok,true);
    assert.equal(saved.result.evidence.supportsCurrent,false);
    assert.notEqual(saved.result.evidence.grade,'FORMAL PASS');
    assert.equal(await sha256(saved.result.values.domainResult.snapshot),j.resultHash);
    const fresh=createM1Engine({workerFactory});
    try{const replay=await fresh.replay(await engine.exportBundle(id));assert.equal(replay.status,'MATCH');assert.equal(replay.importedEvidenceTrusted,false);}finally{fresh.dispose();}
  }finally{engine.dispose();}
});

test('the actual large-amplitude source failure is retained by the integrated Worker',async()=>{
  const e=clone(fixtures.find(e=>e.request.kind==='ns.source-inner-gluing')),engine=createM1Engine({workerFactory});
  e.request.input.continuation.pressure.parameters.logP=14;
  try{
    assert.equal((await validateDomainRequest(e.request)).ok,true);
    const j=await engine.submit(e.request),r=await engine.wait(j.id);
    assert.equal(r.status,'FAILED');assert.equal(r.result.domainStatus,'INVALID_PROFILE');
    assert.equal(r.result.fullProfileCertified,false);
    assert.match(r.result.message,/not positive/);
  }finally{engine.dispose();}
});

test('new components preserve budget exhaustion, unsupported inputs and precision failures',async()=>{
  for(const e of fixtures){
    const request=clone(e.request);request.budget.maxOperations=1;
    const r=await executeDomain(request);assert.equal(r.status,'BUDGET_EXCEEDED',e.id+': '+JSON.stringify(r));
  }
  const axis=clone(fixtures.find(e=>e.request.kind==='ns.axis-certificate').request);
  axis.input.pressure.family='untrusted';assert.equal((await validateDomainRequest(axis)).ok,false);
  const precise=clone(fixtures.find(e=>e.request.kind==='ns.admissible-loop').request);
  precise.precision.bits=100;assert.equal((await executeDomain(precise)).status,'PRECISION_REQUIRED');
});

test('isolated source-profile work can be cancelled without issuing a completed certificate',async()=>{
  const e=fixtures.find(e=>e.request.kind==='ns.source-outer'),engine=createM1Engine({workerFactory});
  try{const job=await engine.submit(e.request);assert.equal(engine.cancel(job.id),true);const stopped=await engine.wait(job.id);assert.equal(stopped.status,'CANCELLED');assert.equal((await engine.exportBundle(job.id)).resumePolicy,'RECOMPUTE_FROM_ORIGINAL_INPUT');}finally{engine.dispose();}
});

test('precision rejects malformed bits and an explicit operation budget is never silently increased',async()=>{
  for(const bits of ['NaN','53',NaN,-1,0,1.5,null]){
    assert.throws(()=>validatePrecision({bits}),e=>e.code==='INVALID_INPUT');
  }
  assert.equal(validatePrecision({bits:53}).bits,53);
  assert.throws(()=>validatePrecision({bits:100}),e=>e.code==='PRECISION_REQUIRED');
  const budget=makeBudget({maxOperations:1,maxMilliseconds:50,maxPoints:1});
  budget.tick();
  assert.throws(()=>budget.tick(),e=>e.code==='RESOURCE_LIMIT');
  assert.equal(budget.snapshot().operations,1);
  assert.equal(budget.snapshot().maxOperations,1);
  assert.throws(()=>makeBudget({maxOperations:1.5}),e=>e.code==='INVALID_INPUT');
});
