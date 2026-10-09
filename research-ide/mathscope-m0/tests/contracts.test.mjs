import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SCHEMAS,validate,assertValid,canonicalStringify,sha256,getContractExamples,validateProofEdge,effectiveEvidenceTrust,validateComputeJobSpec,validateResultEnvelope} from '../contracts.mjs';
import {migrateSession,addNode,addEdge,addDependencyExample,reviseAssumption,exportSessionBundle,importSessionBundle,validateResearchM0Namespace,verifyResearchM0Namespace,quarantineResearchM0Namespace,effectiveNodeState,referenceOf,getSessionNodeKinds} from '../session.mjs';
import {createResearchBundle} from '../../mathscope-extension/session-bundle.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const baseline=JSON.parse(await readFile(new URL('../baseline/manifest.json',import.meta.url),'utf8'));
const examples=await getContractExamples();
const H='0'.repeat(64);
function legacy(){
  const base={schema:'MathScopeResearchSession/0.3.1-foundation.1',id:'rs-contract-tests',title:'Existing MathScope session',objects:[],representations:[],claims:[],evidence:[],assumptions:[],revisions:[],checkpoints:[],sessionRevision:'rs-contract-tests:r4',environmentRef:null};
  const bundle=createResearchBundle({module:'primes',input:{xMax:200},results:{counts:[2,3,5,7]}},{session:base,inputsHash:H,createdAt:'2026-10-09T00:00:00.000Z'});
  for(const group of ['objects','representations','claims','evidence','researchRuns'])base[group]=bundle[group];
  base.evidence.push({id:'legacy-audited',grade:'FORMAL PASS',claimRef:'rx-primes-claim',inputsHash:H,method:'historical pinned verifier',supportsCurrent:true,freshness:'CURRENT'});
  return base;
}
function job(){return {schema:'MathScope.ComputeJobSpec/1',id:'job-contract',modelRef:{id:'m0-primes',revision:'m0-primes:r1',hash:H},adapter:{id:'prime-segment',version:'1.0.0'},sourceRefs:[],assumptionRefs:[],scope:{kind:'FINITE',primeInterval:{lower:'2',upper:'200'}},precision:{kind:'EXACT'},seed:null,domain:{lower:'2',upper:'200'},basis:{kind:'integer-line'},budget:{maxMillis:1000,maxBytes:100000,maxItems:200},input:{lower:'2',upper:'200'}};}
function result(){return {schema:'MathScope.ResultEnvelope/1',jobId:'job-contract',inputHash:H,environmentHash:H,status:'COMPLETED',scope:{kind:'FINITE',finite:{description:'A finite exact test result',itemCount:1}},precision:{kind:'EXACT'},values:{count:{kind:'INTEGER',value:'46'}},errorLedger:{rounding:null,discretization:null,tail:null,residual:null,stability:null,statistical:null},provenance:{modelRef:job().modelRef,sourceRefs:[],assumptionRefs:[],adapter:job().adapter,seed:null,domain:job().domain,basis:job().basis,environment:{runtime:'test fixture'}},evidence:{grade:'CERTIFIED NUMERICAL',scopeKind:'exact-finite',sourceRefs:[],assumptionRefs:[]}};}

test('every complete starter contract validates and has a versioned JSON Schema',()=>{
  for(const [name,data] of Object.entries(examples)){assertValid(name,data);assert.equal(SCHEMAS[name].$schema,'https://json-schema.org/draft/2020-12/schema');}
  assert.equal(getSessionNodeKinds().ResultEnvelope,'result');
});
test('canonical JSON is stable and exact integers must use strings beyond IEEE-754 range',async()=>{
  assert.equal(canonicalStringify({b:2,a:[{z:0,y:1}]}),'{"a":[{"y":1,"z":0}],"b":2}');
  assert.equal(await sha256({b:2,a:1}),await sha256({a:1,b:2}));
  assert.throws(()=>canonicalStringify({x:9007199254740992}),/decimal string/);
  assert.throws(()=>canonicalStringify({x:Infinity}),/finite/);
  assert.throws(()=>canonicalStringify({x:undefined}),/unsupported/);
  assert.throws(()=>canonicalStringify(JSON.parse('{"__proto__":{"bad":true}}')),/reserved/);
  const cycle={};cycle.self=cycle;assert.throws(()=>canonicalStringify(cycle),/cyclic/);
  assert.equal(canonicalStringify({kind:'FLOAT64',value:1e100,certified:false}),'{"certified":false,"kind":"FLOAT64","value":1e+100}');
  assert.throws(()=>canonicalStringify({kind:'FLOAT64',value:Infinity}),/finite/);
});
test('finite queries require bounds, preserve huge integer strings and reject infinite completeness claims',()=>{
  const j=job();assert.equal(validateComputeJobSpec(j).ok,true);
  delete j.scope.primeInterval;assert.equal(validateComputeJobSpec(j).ok,false);
  const prime=clone(examples.PrimeQuerySpec);prime.scope.kind='INFINITE';assert.equal(validate('PrimeQuerySpec',prime).ok,false);
  const large=clone(examples.PrimeQuerySpec);large.query.lower='9007199254740993';large.query.upper='9007199254741013';large.scope.primeInterval={lower:large.query.lower,upper:large.query.upper};assertValid('PrimeQuerySpec',large);
  large.query.upper='9007199254740992';large.scope.primeInterval.upper=large.query.upper;assert.equal(validate('PrimeQuerySpec',large).ok,false);
  const changed=clone(examples.PrimeQuerySpec);changed.query.upper='300';assert.equal(validate('PrimeQuerySpec',changed).ok,false);
});
test('a CW complex or finite p-adic quotient cannot be renamed into a proved prism',()=>{
  const p=clone(examples.PrismSpec);assert.equal(p.semanticStatus,'INTERFACE');
  p.geometricObject.kind='CW_COMPLEX';assert.equal(validate('PrismSpec',p).ok,false);
  const q=clone(examples.PrismSpec);q.ring.kind='Z_MOD_PN';assert.equal(validate('PrismSpec',q).ok,false);
  const forged=clone(examples.PrismSpec);forged.prismPredicate.status='VERIFIED';assert.equal(validate('PrismSpec',forged).ok,false);
  const comparison=clone(examples.PrismSpec);comparison.semanticStatus='COMPARISON_MODEL';assert.equal(validate('PrismSpec',comparison).ok,false);
  const composite=clone(examples.PrismSpec);composite.p='9';assert.equal(validate('PrismSpec',composite).ok,false);
  const digits=clone(examples.PrismSpec);digits.delta.inputExtraDigits=0;assert.equal(validate('PrismSpec',digits).ok,false);
});
test('general G contracts demand global form, representation, dimension and explicit embedding',()=>{
  assert.equal(validate('GaugeGroupSpec',{schema:'MathScope.GaugeGroupSpec/1',name:'E8'}).ok,false);
  const g=clone(examples.GaugeGroupSpec);delete g.globalForm;assert.equal(validate('GaugeGroupSpec',g).ok,false);
  const d=clone(examples.GaugeGroupSpec);d.lieAlgebra.dimension=4;assert.equal(validate('GaugeGroupSpec',d).ok,false);
  const state=clone(examples.StateFamilySpec);delete state.fieldConstruction.embedding;assert.equal(validate('StateFamilySpec',state).ok,false);
  const mismatch=clone(examples.StateFamilySpec);mismatch.fieldConstruction.embedding.codomainRef.hash='1'.repeat(64);assert.equal(validate('StateFamilySpec',mismatch).ok,false);
  const assumed=clone(examples.StateFamilySpec);assumed.delta.mode='ASSUMED_BOUND';assumed.energyInterpretation='DECLARED_BOUND';assert.equal(validate('StateFamilySpec',assumed).ok,false);
});
test('PDE paper, illustrative model, manufactured force and bounded time are disjoint contracts',()=>{
  const p=clone(examples.PDEConstructionSpec);p.modelKind='PAPER_CONSTRUCTION';p.modelId='paper_construction:ns';assert.equal(validate('PDEConstructionSpec',p).ok,false);
  const noTime=clone(examples.PDEConstructionSpec);delete noTime.scope.spatial.timeMax;delete noTime.scope.series.timeMax;assert.equal(validate('PDEConstructionSpec',noTime).ok,false);
  const wrongId=clone(examples.PDEConstructionSpec);wrongId.modelId='paper_construction:ns';assert.equal(validate('PDEConstructionSpec',wrongId).ok,false);
  const manufactured=clone(examples.PDEConstructionSpec);manufactured.force.kind='MANUFACTURED_FORCE';assertValid('PDEConstructionSpec',manufactured);
});
test('observations report lost information and scalar marginals cannot become connections',()=>{
  const o=clone(examples.ObservationMapSpec);o.method='SCALAR_MARGINAL';o.outputType='GaugeConnection';assert.equal(validate('ObservationMapSpec',o).ok,false);
  const missing=clone(examples.ObservationMapSpec);missing.lostInformation=[];assert.equal(validate('ObservationMapSpec',missing).ok,false);
  const line=clone(examples.ObservationMapSpec);line.method='WILSON_LINE';assert.equal(validate('ObservationMapSpec',line).ok,false);
  const inverse=clone(examples.ObservationMapSpec);inverse.inverse.status='AVAILABLE';assert.equal(validate('ObservationMapSpec',inverse).ok,false);
});
test('a generic result cannot issue formal/theorem authority or turn statistics into rigorous intervals',()=>{
  assert.equal(validateResultEnvelope(result()).ok,true);
  for(const grade of ['FORMAL PASS','THEOREM-BACKED']){const r=result();r.evidence.grade=grade;assert.equal(validateResultEnvelope(r).ok,false);}
  const statistical=result();statistical.evidence.scopeKind='statistical';assert.equal(validateResultEnvelope(statistical).ok,false);
  const imprecise=result();imprecise.precision.kind='FLOAT64';assert.equal(validateResultEnvelope(imprecise).ok,false);
  const noErrorLedger=result();delete noErrorLedger.errorLedger.stability;assert.equal(validateResultEnvelope(noErrorLedger).ok,false);
  const omittedAssumptions=result();delete omittedAssumptions.provenance.assumptionRefs;assert.equal(validateResultEnvelope(omittedAssumptions).ok,false);
});
test('migration uses actual existing extension bundle and preserves legacy IDs, values, grades and input object',async()=>{
  const original=legacy(),before=canonicalStringify(original),migrated=await migrateSession(original,baseline);
  assert.equal(canonicalStringify(original),before);
  for(const key of Object.keys(original))assert.deepEqual(migrated[key],original[key]);
  assert.equal(migrated.researchM0.legacyIndex.find(n=>n.id==='legacy-audited').grade,'FORMAL PASS');
  assert.deepEqual(await migrateSession(migrated,baseline),migrated);
  assert.equal((await verifyResearchM0Namespace(migrated.researchM0)).ok,true);
});
test('baseline hash and exact starting version are enforced',async()=>{
  const wrong=clone(baseline);wrong.page.version=42;await assert.rejects(()=>migrateSession(legacy(),wrong),/page 41/);
  const migrated=await migrateSession(legacy(),baseline);migrated.researchM0.baseline.page.sha256=H;assert.equal((await verifyResearchM0Namespace(migrated.researchM0)).ok,false);
});
test('assumption edits stale only reachable claims and interpretations, preserving independent prime computation',async()=>{
  const m=await migrateSession(legacy(),baseline),demo=await addDependencyExample(m),before=clone(demo.session);
  const changed=await reviseAssumption(demo.session,demo.assumptionId,'Selected positive gap bound delta=2 in the same energy unit.');
  assert.deepEqual(changed.invalidated.sort(),demo.dependentIds.sort());
  assert.equal(effectiveNodeState(changed.session,demo.independentId).freshness,'CURRENT');
  for(const id of demo.dependentIds)assert.equal(effectiveNodeState(changed.session,id).freshness,'STALE');
  assert.equal(changed.namespace.history.length,1);
  assert.deepEqual(demo.session,before);
  assert.equal((await verifyResearchM0Namespace(changed.namespace)).ok,true);
});
test('USER_AXIOM origin survives revisions and cannot be smuggled into an unconditional target indirectly',async()=>{
  const m=await migrateSession(legacy(),baseline),demo=await addDependencyExample(m);
  await assert.rejects(()=>reviseAssumption(demo.session,demo.assumptionId,{origin:'EXTERNAL_THEOREM'}),/USER_AXIOM/);
  const direct=clone(examples.ClaimSpec);direct.logicRole='THEOREM_TARGET';direct.id='m0-unconditional';direct.revision='m0-unconditional:r1';
  await assert.rejects(()=>addNode(demo.session,{kind:'ClaimSpec',payload:direct}),/USER_AXIOM/);
  direct.assumptionRefs=[];
  const state=await addNode(demo.session,{kind:'ClaimSpec',payload:direct});
  await assert.rejects(()=>addEdge(state,{id:'indirect-axiom',type:'DEPENDS_ON',from:'m0-gap-claim',to:direct.id}),/indirectly depends on USER_AXIOM/);
});
test('dependency cycles and plain metadata certificates are rejected atomically',async()=>{
  const m=await migrateSession(legacy(),baseline),demo=await addDependencyExample(m),before=clone(demo.session);
  await assert.rejects(()=>addEdge(demo.session,{id:'cycle',type:'DEPENDS_ON',from:'m0-gap-interpretation',to:'m0-gap-claim'}),/cycle/);
  await assert.rejects(()=>addEdge(demo.session,{id:'fake-proof',type:'VERIFIED_BY',from:'m0-primes',to:'m0-gap-claim',certificate:{status:'PASS',claimId:'m0-gap-claim'}}),/live audited certificate/);
  assert.deepEqual(demo.session,before);
});
test('finite-field Weil RH and a finite/channel observation do not close global conjectures',()=>{
  const nodes=[{id:'weil',propositionKind:'WEIL_RH_FINITE_FIELD',scope:{kind:'FINITE'}},{id:'rh',propositionKind:'CLASSICAL_RH',scope:{kind:'SYMBOLIC'}},{id:'channel',propositionKind:'OBSERVED_SPECTRUM',scope:{kind:'FINITE'}},{id:'global',propositionKind:'GLOBAL_SPECTRUM',scope:{kind:'SYMBOLIC'}}];
  const cert={claimId:'rh'};
  const direct=validateProofEdge({type:'LOCAL_TO_GLOBAL',from:'weil',to:'rh',certificate:cert,semanticBridge:{limitStatement:'pretended bridge'}},nodes,{isVerifiedCertificate:()=>true});assert.equal(direct.ok,false);assert.match(direct.errors.join(' '),/Weil RH/);
  const noLimit=validateProofEdge({type:'LIMIT',from:'channel',to:'global',certificate:{claimId:'global'}},nodes,{isVerifiedCertificate:()=>true});assert.equal(noLimit.ok,false);assert.match(noLimit.errors.join(' '),/spectral inclusion/);
  assert.equal(validateProofEdge({type:'CITES',from:'weil',to:'rh'},nodes).ok,true);
});
test('live receipt identity is checked and serialized copies are only historical audit references',()=>{
  const receipt={claimId:'test',grade:'CONDITIONAL_FORMAL',axioms:{standard:[],custom:['USER_AXIOM']},scope:'Explicit assumptions'};
  const known=new WeakSet([receipt]),isVerifiedProofReceipt=x=>known.has(x);
  assert.equal(effectiveEvidenceTrust(receipt,{isVerifiedProofReceipt}).status,'LOCAL_AUDIT_VERIFIED');
  assert.equal(effectiveEvidenceTrust({claimId:receipt.claimId,statement:'An unrelated theorem'},{receipt,isVerifiedProofReceipt}).status,'REVALIDATION_REQUIRED');
  assert.equal(effectiveEvidenceTrust({grade:'FORMAL PASS'},{receipt:clone(receipt),isVerifiedProofReceipt}).status,'REVALIDATION_REQUIRED');
});
test('content references and input revisions cannot be rebound to mismatched hashes',async()=>{
  let state=(await migrateSession(legacy(),baseline)).researchM0;
  state=await addNode(state,{kind:'SourceManifest',payload:examples.SourceManifest});
  state=await addNode(state,{kind:'AssumptionSpec',payload:examples.AssumptionSpec});
  const bad=clone(examples.ClaimSpec);bad.assumptionRefs[0].hash=H;
  await assert.rejects(()=>addNode(state,{kind:'ClaimSpec',payload:bad}),/mismatched content reference/);
  const same=await addNode(state,{kind:'AssumptionSpec',payload:examples.AssumptionSpec});assert.equal(same.revision,state.revision);
});
test('reusing a historical assumption revision leaves the recomputed interpretation stale',async()=>{
  const demo=await addDependencyExample(await migrateSession(legacy(),baseline));
  const changed=await reviseAssumption(demo.session,demo.assumptionId,'New bound');
  const claim=clone(examples.ClaimSpec);claim.statement+=' The record still references the old assumption.';
  const stored=await addNode(changed.session,{kind:'ClaimSpec',payload:claim});
  assert.equal(effectiveNodeState(stored,claim.id).freshness,'STALE');
});
test('export/import round-trip preserves exact mathematical payloads and legacy grades, quarantines current trust',async()=>{
  const demo=await addDependencyExample(await migrateSession(legacy(),baseline));
  const exported=await exportSessionBundle(demo.session),parsed=await importSessionBundle(exported,{expectedBaselineHash:demo.namespace.baselineHash});
  for(const node of demo.namespace.nodes)assert.deepEqual(parsed.researchM0.nodes.find(n=>n.id===node.id).payload,node.payload);
  assert.deepEqual(parsed.objects,demo.session.objects);
  assert.equal(parsed.evidence.find(e=>e.id==='legacy-audited').grade,'FORMAL PASS');
  assert.equal(parsed.evidence.find(e=>e.id==='legacy-audited').supportsCurrent,false);
  assert.equal(parsed.researchM0.importAudit.integrity,'SHA256_VERIFIED');
  assert.ok(parsed.researchM0.nodes.every(n=>n.effectiveTrust==='REVALIDATION_REQUIRED'));
  const reexport=await exportSessionBundle(parsed);assert.equal((await importSessionBundle(reexport)).id,parsed.id);
});
test('tampering is caught at bundle, baseline and payload levels',async()=>{
  const demo=await addDependencyExample(await migrateSession(legacy(),baseline)),raw=JSON.parse(await exportSessionBundle(demo.session));
  raw.payload.researchM0.nodes[1].payload.statement='tampered';
  await assert.rejects(()=>importSessionBundle(JSON.stringify(raw)),/payload hash mismatch/);
  raw.payloadHash=await sha256(raw.payload);await assert.rejects(()=>importSessionBundle(JSON.stringify(raw)),/Payload digest mismatch/);
  const forged=clone(demo.namespace);forged.nodes[0].effectiveTrust='FORMAL PASS';assert.equal(validateResearchM0Namespace(forged).ok,false);
});
test('USER_AXIOM cannot be hidden in an assumption ledger or a malformed namespace',async()=>{
  const examples=await getContractExamples();let ns=(await migrateSession(legacy(),baseline)).researchM0;
  ns=await addNode(ns,{kind:'SourceManifest',payload:examples.SourceManifest});
  ns=await addNode(ns,{kind:'AssumptionLedger',payload:examples.AssumptionLedger});
  const ledger=ns.nodes.find(n=>n.payload.schema==='MathScope.AssumptionLedger/1');
  const claim=clone(examples.ClaimSpec);claim.logicRole='THEOREM_TARGET';claim.assumptionRefs=[referenceOf(ledger)];
  await assert.rejects(()=>addNode(ns,{kind:'ClaimSpec',payload:claim}),/USER_AXIOM/);
  const malformed=clone(ns);malformed.nodes=[null];assert.equal(validateResearchM0Namespace(malformed).ok,false);
});
test('plain JSON and nested checkpoints cannot revive serialized proof authority',async()=>{
  const demo=await addDependencyExample(await migrateSession(legacy(),baseline));
  const sync=clone(demo.namespace);quarantineResearchM0Namespace(sync);assert.equal(sync.importAudit.integrity,'NOT_CHECKED');
  const nested=clone(demo.session);nested.checkpoints=[{id:'cp-original',snapshot:clone(demo.session)}];
  const imported=await importSessionBundle(await exportSessionBundle(nested));
  assert.equal(imported.checkpoints[0].snapshot.evidence.find(e=>e.id==='legacy-audited').supportsCurrent,false);
  assert.equal(imported.checkpoints[0].snapshot.researchM0.nodes[0].effectiveTrust,'REVALIDATION_REQUIRED');
});
