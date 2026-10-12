/** P8 evidence boundaries, tested against actual inherited M2 computations. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {OBJECT_KINDS,ARITHMETIC_MODES,PROOF_METHODS,validateObjectEvidence,bindP8Claim,verifyP8Binding,cloneJSON,canonicalJSON,sha256,assertJSON} from '../p8/contracts.mjs';
import {auditAssumptionLedger,prepareAssumptionRemoval,dependencyGraphToSessionEdges} from '../p8/assumptions.mjs';
import {buildM2ComparisonDiagram,validateComparisonDiagram,invalidateComparisonAfterAssumptionChange} from '../p8/comparison.mjs';
import {runJob} from '../../mathscope-m2/arithmetic/index.mjs';

const h='a'.repeat(64), ref=id=>({id,revision:'1',hash:h});
function fixture() {
  const target={declaration:'MathScope.M3.P8.zero',propositionId:'P8.FINITE.ZERO',type:'(0 : Nat) = 0'};
  const dependencyGraph={direction:'CLAIM_TO_PREREQUISITE',nodes:[{id:'claim:zero',kind:'theorem',statement:target.type,propositionId:target.propositionId,declaration:target.declaration}],edges:[]};
  const claim={schema:'MathScope.M3.P8.Claim/1',id:'claim:zero',revision:'1',object:{id:'object:finite',kind:'DERIVED_MODEL',baseRef:ref('base:Z'),coefficientRingRef:ref('ring:Z')},arithmetic:{mode:'EXACT',scope:{kind:'FINITE',description:'A finite contract regression, not an executed Lean proof.'},precision:{}},proof:{method:'LEAN_KERNEL',target,sourceRefs:[ref('source:fixture')],assumptionRefs:[]}};
  return {claim,sourceFiles:[{path:'MathScope/M3/P8/Zero.lean',content:'namespace MathScope.M3.P8\ntheorem zero : (0 : Nat) = 0 := rfl\nend MathScope.M3.P8\n'}],environment:{leanVersion:'4.34.1',leanCommit:'5'.repeat(40),mathlibCommit:'d'.repeat(40),runtimeLibrarySha256:h,importClosureSha256:'b'.repeat(64)},input:{fixture:'zero',largeInteger:'9007199254740993'},precision:{},assumptionLedger:{schema:'MathScope.M3.P8.AssumptionLedger/1',target:{claimId:claim.id,...target},entries:[],dependencyGraph:cloneJSON(dependencyGraph)},dependencyGraph};
}
function addAssumption(ledger,{id='assumption:operator',kind='USER_AXIOM',declaration='Research.operatorBound',propositionId='P8.OPERATOR.BOUND',statement='OperatorBound A'}={}) {
  const entry={id,revision:'1',kind,declaration,propositionId,statement,sourceRefs:[]};
  ledger.entries.push(entry);
  ledger.dependencyGraph.nodes.push({id,kind:({USER_AXIOM:'user_axiom',HYPOTHESIS:'hypothesis',EXTERNAL_THEOREM:'reference',OPEN_OBLIGATION:'open'})[kind],statement,propositionId,...(declaration===null?{}:{declaration})});
  ledger.dependencyGraph.edges.push({from:ledger.target.claimId,to:id,type:'DEPENDS_ON'});
  return entry;
}
async function bindAssumptions(input) {
  input.dependencyGraph=cloneJSON(input.assumptionLedger.dependencyGraph);
  input.claim.proof.assumptionRefs=await Promise.all(input.assumptionLedger.entries.map(async e=>({id:e.id,revision:e.revision,hash:await sha256(e)})));
  return input;
}
function metadataAudit(ledger,custom=[]) {
  return {schema:'MathScope.M3.P8.LeanAudit/1',status:'KERNEL_CHECKED_FINITE_SCOPES',serializedAuthority:'UNTRUSTED_REQUIRES_REEXECUTION',targets:[{name:ledger.target.declaration,type:ledger.target.type,axioms:{all:['propext',...custom],standard:['propext'],custom}}]};
}
const prism=target=>({kind:'arithmetic.comparison',input:{operation:'perfectPrism',p:'3',target},precision:{N:3}});

test('object identity, arithmetic mode and proof method are independent string enums',()=>{
  for (const kind of OBJECT_KINDS) for (const mode of ARITHMETIC_MODES) for (const method of PROOF_METHODS) {
    const f=fixture(); f.claim.object.kind=kind; f.claim.arithmetic.mode=mode; f.claim.proof.method=method;
    const report=validateObjectEvidence(f.claim); assert.equal(report.ok,true); assert.equal(report.formalComplete,false); assert.equal(report.certificateIssued,false);
  }
  for (const change of [c=>{c.proof.method=99;},c=>{c.arithmetic.mode=99;},c=>{c.object.kind=99;},c=>{c.grade=999;},c=>{c.proof.formalComplete=true;}]) {
    const f=fixture();change(f.claim);assert.equal(validateObjectEvidence(f.claim).ok,false);
  }
});

test('strict JSON preserves exact strings and rejects nonfinite, unsafe, sparse and executable input',()=>{
  assert.doesNotThrow(()=>assertJSON({exact:'9007199254740993',display:0.125}));
  for (const bad of [NaN,Infinity,9007199254740992,undefined,1n,()=>0,new Date(),{s:'\ud800'},[,1],Object.defineProperty({},'x',{get(){throw Error('must not execute');},enumerable:true}),JSON.parse('{"__proto__":{}}')]) assert.throws(()=>assertJSON(bad));
  const disguised={ok:1};Object.defineProperty(disguised,'hidden',{value:2});assert.throws(()=>assertJSON(disguised));
});

test('binding snapshots all inputs and remains unverified after consistent replay',async()=>{
  const f=fixture(), before=canonicalJSON(f), record=await bindP8Claim(f);
  assert.equal(canonicalJSON(f),before);assert.equal(record.proofRequest.status,'PREPARED_LOCAL_CHECK_REQUIRED');
  const check=await verifyP8Binding(record,f);assert.equal(check.ok,true);assert.equal(check.status,'BINDINGS_MATCH_UNVERIFIED');assert.equal(check.certificateIssued,false);
  assert.equal((await verifyP8Binding(record)).status,'CURRENT_BINDING_REQUIRED');
  assert.equal(Object.isFrozen(record.claim),true);
});

test('source, environment, input, precision, base, ring and exact target changes stale the binding',async()=>{
  const f=fixture(), record=await bindP8Claim(f);
  const changes=[
    ['source',x=>{x.sourceFiles[0].content+='\n';}],
    ['environment',x=>{x.environment.leanCommit='e'.repeat(40);}],
    ['input',x=>{x.input.largeInteger='9007199254740994';}],
    ['precision',x=>{x.precision={binaryBits:192};x.claim.arithmetic.precision={binaryBits:192};}],
    ['base',x=>{x.claim.object.baseRef.hash='e'.repeat(64);}],
    ['ring',x=>{x.claim.object.coefficientRingRef.hash='f'.repeat(64);}],
    ['target',x=>{x.claim.proof.target.type='(1 : Nat) = 1';x.assumptionLedger.target.type=x.claim.proof.target.type;x.assumptionLedger.dependencyGraph.nodes[0].statement=x.claim.proof.target.type;x.dependencyGraph=cloneJSON(x.assumptionLedger.dependencyGraph);}]
  ];
  for (const [key,change] of changes) {const next=cloneJSON(f);change(next);const report=await verifyP8Binding(record,next);assert.equal(report.status,'STALE',key);assert.ok(report.mismatchedBindings.includes(key),key);}
});

test('source path traversal, changed assumption refs and promoted serialized records fail closed',async()=>{
  const f=fixture();f.sourceFiles[0].path='../Zero.lean';await assert.rejects(()=>bindP8Claim(f),{code:'INVALID_SOURCE_PATH'});
  const g=fixture();addAssumption(g.assumptionLedger);await bindAssumptions(g);g.claim.proof.assumptionRefs[0].hash='c'.repeat(64);await assert.rejects(()=>bindP8Claim(g),{code:'ASSUMPTION_BINDING_MISMATCH'});
  const good=fixture(), record=cloneJSON(await bindP8Claim(good));record.formalComplete=true;assert.equal((await verifyP8Binding(record,good)).issues[0].code,'IMPORTED_AUTHORITY_REJECTED');
  const modified=cloneJSON(await bindP8Claim(good));modified.sourceFiles[0].sha256='0'.repeat(64);assert.equal((await verifyP8Binding(modified,good)).issues[0].code,'BINDING_INTEGRITY_MISMATCH');
});

test('full Lean audit runtime metadata remains bound and modified runtimes are rejected',async()=>{
  const f=fixture();Object.assign(f.environment,{leanBinarySha256:h,lakeManifestSha256:h,importedModuleCount:3000,kernelModified:false,runtimeModified:false});
  const record=await bindP8Claim(f), next=cloneJSON(f);next.environment.lakeManifestSha256='c'.repeat(64);
  assert.equal((await verifyP8Binding(record,next)).status,'STALE');
  next.environment.kernelModified=true;await assert.rejects(()=>bindP8Claim(next),{code:'INVALID_ENVIRONMENT'});
});

test('a caller edit during async hashing cannot create a mixed binding revision',async()=>{
  const f=fixture(), initial=cloneJSON(f), pending=bindP8Claim(f);f.input.largeInteger='changed';f.sourceFiles[0].content='changed';
  const record=await pending;assert.equal(record.input.largeInteger,initial.input.largeInteger);assert.equal(record.sourceFiles[0].content,initial.sourceFiles[0].content);assert.equal((await verifyP8Binding(record,initial)).ok,true);
});

test('actual axiom names must match the target ledger in both directions; hypotheses are separate',()=>{
  const l=fixture().assumptionLedger;addAssumption(l);addAssumption(l,{id:'hypothesis:domain',kind:'HYPOTHESIS',declaration:null,propositionId:'P8.DOMAIN',statement:'x belongs to the operator domain'});
  const report=auditAssumptionLedger(l,{kernelAudit:metadataAudit(l,['Research.operatorBound'])});assert.equal(report.ok,true);assert.equal(report.status,'CONDITIONAL');assert.equal(report.axiomConsistency.status,'CONSISTENT_UNTRUSTED');assert.equal(report.certificateIssued,false);assert.deepEqual(report.hypotheses,['hypothesis:domain']);
  for (const custom of [[],['Research.operatorBound','Research.extra']]) assert.equal(auditAssumptionLedger(l,{kernelAudit:metadataAudit(l,custom)}).issues[0].code,'AXIOM_LEDGER_MISMATCH');
});

test('kernel target/type, axiom partition and sorryAx mutations are rejected',()=>{
  const l=fixture().assumptionLedger;
  const cases=[a=>{a.targets[0].type+=' ';},a=>{a.targets.push(cloneJSON(a.targets[0]));},a=>{a.targets[0].axioms.custom=['propext'];},a=>{a.targets[0].axioms={all:['sorryAx'],standard:[],custom:['sorryAx']};},a=>{a.serializedAuthority='TRUSTED';}];
  for(const change of cases){const audit=metadataAudit(l);change(audit);assert.equal(auditAssumptionLedger(l,{kernelAudit:audit}).ok,false);}
});

test('assuming the target is explicitly conditional and syntactic matching claims no semantic decision',()=>{
  for (const kind of ['USER_AXIOM','HYPOTHESIS']) {
    const l=fixture().assumptionLedger;addAssumption(l,{kind,declaration:kind==='USER_AXIOM'?'Research.target':null,propositionId:l.target.propositionId,statement:l.target.type});
    const report=auditAssumptionLedger(l);assert.equal(report.ok,true);assert.equal(report.status,'CONDITIONAL_ON_TARGET');assert.equal(report.semanticEquivalenceDecided,false);assert.equal(report.formalComplete,false);
  }
});

test('external references and open obligations cannot silently become imported Lean theorems',()=>{
  const l=fixture().assumptionLedger;addAssumption(l,{kind:'EXTERNAL_THEOREM',declaration:null,statement:'Published comparison under smooth proper hypotheses'});assert.equal(auditAssumptionLedger(l).status,'THEOREM_REFERENCE_ONLY');
  addAssumption(l,{id:'open:global',kind:'OPEN_OBLIGATION',declaration:null,propositionId:'P8.GLOBAL',statement:'Global trace identity remains to be established'});assert.equal(auditAssumptionLedger(l).status,'RESEARCH_OPEN');
  l.dependencyGraph.nodes[1].kind='imported_theorem';assert.equal(auditAssumptionLedger(l).ok,false);
});

test('duplicate IDs, undeclared axioms, wrong directions, unknown endpoints and disconnected cycles fail',()=>{
  const mutations=[
    l=>{l.dependencyGraph.direction='PREREQUISITE_TO_DEPENDENT';},
    l=>{l.dependencyGraph.edges.push({from:l.target.claimId,to:'missing',type:'DEPENDS_ON'});},
    l=>{addAssumption(l);l.entries.push(cloneJSON(l.entries[0]));},
    l=>{addAssumption(l);l.entries=[];},
    l=>{for(const id of ['a','b'])l.dependencyGraph.nodes.push({id,kind:'definition',statement:id,propositionId:`P8.${id}`});l.dependencyGraph.edges.push({from:'a',to:'b',type:'DEPENDS_ON'},{from:'b',to:'a',type:'DEPENDS_ON'});}
  ];
  for(const mutate of mutations){const l=fixture().assumptionLedger;mutate(l);assert.equal(auditAssumptionLedger(l).ok,false);}
});

test('proof-to-session reversal selectively invalidates dependents and requires actual recompilation',()=>{
  const l=fixture().assumptionLedger;addAssumption(l);l.dependencyGraph.nodes.push({id:'unrelated',kind:'definition',statement:'Unrelated',propositionId:'P8.UNRELATED'});
  const before=canonicalJSON(l), edges=dependencyGraphToSessionEdges(l.dependencyGraph);assert.equal(edges[0].from,'assumption:operator');assert.equal(edges[0].to,l.target.claimId);
  const removed=prepareAssumptionRemoval(l,'assumption:operator');assert.deepEqual(removed.affectedClaimIds,[l.target.claimId]);assert.equal(removed.freshKernelRunRequired,true);assert.equal(removed.sourceRegenerationRequired,true);assert.equal(removed.formalComplete,false);assert.equal(canonicalJSON(l),before);
});

test('all four actual perfect-prism routes preserve typed operations and external theorem scope',async()=>{
  const expected={etale:3,etaleZp:4,deRham:2,crystalline:3};
  for(const [target,count] of Object.entries(expected)){
    const diagram=await buildM2ComparisonDiagram(prism(target));assert.equal(diagram.edges.length,count);assert.equal(diagram.localKernelCheck,false);assert.equal(diagram.formalComplete,false);assert.equal((await validateComparisonDiagram(diagram,{expectedBinding:diagram.binding})).ok,true);
    if (target==='etaleZp') assert.match(diagram.nodes.at(-2).coefficientRing,/Compatible family/);
  }
});

test('actual projective and q-PD diagrams use their source maps; module-only q-PD proxy is rejected',async()=>{
  const projective=await buildM2ComparisonDiagram({kind:'arithmetic.projective',input:{p:'3',n:2}});assert.equal(projective.edges.length,3);assert.ok(projective.nodes[0].sourceFieldPath.includes('finitePerfectComparison'));assert.equal((await validateComparisonDiagram(projective)).ok,true);
  const qpd=await buildM2ComparisonDiagram({kind:'arithmetic.qDeRham',input:{p:'3',operation:'cechP1'}});assert.equal(qpd.edges.length,3);assert.ok(qpd.edges.some(e=>e.sourceOperation==='CANONICAL_QPD_DESCENT'));assert.equal((await validateComparisonDiagram(qpd)).ok,true);
  await assert.rejects(()=>buildM2ComparisonDiagram({kind:'arithmetic.qDeRham',input:{operation:'cechModuleP1'}}),{code:'UNSUPPORTED_COMPARISON_ROUTE'});
});

test('original M2 rejects deleted or reordered inversion and derived fixed points',async()=>{
  for(const operations of [['DERIVED_REDUCTION_MOD_PN','DERIVED_FROBENIUS_FIXED_POINTS'],['INVERT_PRISM_IDEAL','DERIVED_REDUCTION_MOD_PN','DERIVED_FROBENIUS_FIXED_POINTS']]){
    const route=prism('etale');route.input.operations=operations;await assert.rejects(()=>buildM2ComparisonDiagram(route),{code:'INVALID_COMPARISON_ROUTE'});
  }
  const route=prism('etaleZp');route.input.modPOnlyAsZp=true;await assert.rejects(()=>buildM2ComparisonDiagram(route),{code:'INVALID_COMPARISON_ROUTE'});
});

test('deleting assumptions, edges or changing ring/base maps rejects the affected comparison',async()=>{
  const original=await buildM2ComparisonDiagram(prism('etale'));
  const mutations=[d=>{d.assumptions.shift();},d=>{d.edges[0].requiredAssumptionRefs=[];},d=>{d.edges.splice(1,1);},d=>{d.nodes[1].coefficientRingRef.hash='0'.repeat(64);},d=>{d.edges[0].baseRef.hash='0'.repeat(64);},d=>{d.edges[0].sourceOperation='ORDINARY_FIXED_POINTS';},d=>{d.formalComplete=true;}];
  for(const mutate of mutations){const d=cloneJSON(original);mutate(d);const result=await validateComparisonDiagram(d);assert.equal(result.ok,false);assert.equal(result.formalComplete,false);}
});

test('rehashing forged diagrams does not evade the fresh route comparison',async()=>{
  const d=cloneJSON(await buildM2ComparisonDiagram(prism('etale')));d.edges[0].sourceTheoremRefs[0].locator='Invented theorem';const {binding,...body}=d;d.binding.sha256=await sha256(body);assert.equal((await validateComparisonDiagram(d)).ok,false);
  const changed=await buildM2ComparisonDiagram({...prism('etale'),input:{operation:'perfectPrism',p:'5',target:'etale'}});assert.equal((await validateComparisonDiagram(changed,{expectedBinding:binding})).issues[0].code,'STALE_COMPARISON');
  assert.notEqual(changed.nodes[0].coefficientRingRef.hash,d.nodes[0].coefficientRingRef.hash);
});

test('supplied M2 records are recomputed without mutation; forged source results cannot be imported',async()=>{
  const route=prism('deRham'), raw=await runJob(route), before=canonicalJSON(raw);const diagram=await buildM2ComparisonDiagram(route,raw);assert.equal(diagram.source.resultHash,raw.resultHash);assert.equal(canonicalJSON(raw),before);
  const forged=cloneJSON(raw);forged.results.route.details.coefficientMap='theta without Frobenius twist';await assert.rejects(()=>buildM2ComparisonDiagram(route,forged),{code:'M2_RESULT_MISMATCH'});
});

test('comparison condition changes revoke affected downstream edges without mutating the original diagram',async()=>{
  const d=await buildM2ComparisonDiagram(prism('etaleZp')), before=canonicalJSON(d);const changed=invalidateComparisonAfterAssumptionChange(d,d.assumptions[0].id);assert.equal(changed.status,'STALE');assert.equal(changed.invalidEdgeIds.length,d.edges.length);assert.equal(changed.freshReplayRequired,true);assert.equal(changed.certificateIssued,false);assert.equal(canonicalJSON(d),before);
});
