import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {runMutationAudit,inspectP7ZeroStructure,inspectRankUpperEvidence,invalidateMutationDependents,runBindingMutationAudit} from '../p8/mutation-audit.mjs';
import {bindP8Claim,cloneJSON,canonicalJSON} from '../p8/contracts.mjs';

const root=new URL('../',import.meta.url), manifest=JSON.parse(readFileSync(new URL('evidence/resume-20261012/attempt2/manifest.json',root),'utf8'));
function archive(name){const artifact=name+'.json.gz',bytes=readFileSync(new URL('evidence/resume-20261012/attempt2/'+artifact,root)),expected=manifest.runs.find(r=>r.artifact===artifact);assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256);const record=JSON.parse(gunzipSync(bytes));assert.equal(record.recordSHA256,expected.recordSHA256);return record;}
const zeroRecord=archive('explicit-psi'),rankRecord=archive('elliptic-local');
const copy=value=>JSON.parse(JSON.stringify(value));

test('default suite executes original M2 gates and leaves unsupported P7 mathematics OPEN',async()=>{
  const report=await runMutationAudit();assert.equal(report.status,'PARTIAL');assert.equal(report.executedFiniteControls,4);assert.deepEqual(report.openCases,['zero-box','rank-upper']);
  for(const row of report.cases.filter(c=>c.mathematicalReplayStatus==='EXECUTED_M2'))assert.equal(row.negativeControlPassed,true,row.id);
  const bad=report.cases.find(c=>c.id==='bad-prime');assert.equal(bad.omittedBadPrime.rejection.code,'UNVERIFIED_GOOD_MODEL');assert.equal(bad.observed.reduction,'BAD_REDUCTION');
  const truncation=report.cases.find(c=>c.id==='truncation-bound');assert.equal(truncation.precisionGate.status,'PRECISION_REQUIRED');assert.equal(truncation.verifier.pass,false);assert.ok(truncation.precisionGate.certificate.omittedTermValuationLowerBound<3);
  const frobenius=report.cases.find(c=>c.id==='frobenius-coefficient');assert.equal(frobenius.verifier.pass,false);assert.equal(frobenius.unchangedBaseline,true);assert.equal(frobenius.source.resultHash,frobenius.source.freshResultHash);assert.notEqual(frobenius.source.resultHash,frobenius.source.mutatedResultHash);
  assert.equal(report.originalP8CriterionComplete,false);assert.equal(report.certificateIssued,false);assert.equal(report.formalComplete,false);
});

test('negative controls invalidate only their exact downstream dependency closure',()=>{
  const graph={direction:'PREREQUISITE_TO_DEPENDENT',nodes:['a','b','c','unrelated'],edges:[{from:'a',to:'b'},{from:'b',to:'c'}]},before=canonicalJSON(graph);
  const report=invalidateMutationDependents(graph,['a']);assert.deepEqual(report.revokedNodeIds,['a','b','c']);assert.deepEqual(report.unchangedNodeIds,['unrelated']);assert.equal(report.states[3].proofAuthorityIssued,false);assert.equal(canonicalJSON(graph),before);
  graph.edges.push({from:'c',to:'a'});assert.throws(()=>invalidateMutationDependents(graph,['a']),{code:'DEPENDENCY_CYCLE'});
});

test('actual archived P7 zero brackets are structurally inspected without claiming analytic replay',()=>{
  const before=JSON.stringify(zeroRecord),check=inspectP7ZeroStructure(zeroRecord);assert.equal(check.ok,true);assert.equal(check.positiveCount,3);assert.equal(check.analyticReplay,'OPEN_REQUIRES_FRESH_P7_FLINT_RUNNER');assert.equal(check.wholeContourRecomputed,false);assert.equal(check.hashIntegrityVerified,false);assert.equal(check.certificateIssued,false);assert.equal(JSON.stringify(zeroRecord),before);
  for(const mutation of [z=>{z.hardyRoots[0].upper=z.hardyRoots[0].lower;},z=>{z.hardyRoots.pop();},z=>{z.contour.zeroCountIncludingMultiplicity=3;},z=>{z.hardyRoots[0].uniqueAndSimpleByTotalCount=false;},z=>{z.hardyRoots[0].lowerSign=0;}]){
    const changed=copy(zeroRecord);mutation(changed.result.zeroCertificate);assert.equal(inspectP7ZeroStructure(changed).ok,false);
  }
});

test('coherent imported zero metadata still cannot establish zeta values or whole-contour nonvanishing',()=>{
  const forged=copy(zeroRecord);forged.result.zeroCertificate.hardyRoots[0].hardyLower.lower.mantissa='999';
  const check=inspectP7ZeroStructure(forged);assert.equal(check.ok,true);assert.equal(check.wholeContourRecomputed,false);assert.equal(check.certificateIssued,false);assert.match(check.analyticReplay,/OPEN/);
  forged.formalLeanProofIssued=true;assert.equal(inspectP7ZeroStructure(forged).ok,false);
});

test('arithmetic rank upper null stays OPEN; fabricated exact rank or imported certificate has no authority',()=>{
  const before=JSON.stringify(rankRecord),check=inspectRankUpperEvidence(rankRecord);assert.equal(check.ok,true);assert.equal(check.upperBound,null);assert.equal(check.exactRank,null);assert.match(check.status,/OPEN/);assert.equal(JSON.stringify(rankRecord),before);
  const forged=copy(rankRecord);forged.result.arithmeticRank.upperBound=1;forged.result.arithmeticRank.exactRank=1;assert.equal(inspectRankUpperEvidence(forged).issues[0].code,'RANK_UPPER_CERTIFICATE_MISSING');
  forged.result.rankUpperCertificate={pass:true,claim:'rank <= 1'};const unsupported=inspectRankUpperEvidence(forged);assert.equal(unsupported.ok,false);assert.equal(unsupported.status,'OPEN_UNSUPPORTED_RANK_UPPER_VERIFIER');assert.equal(unsupported.arithmeticRankProved,false);
});

test('small archived projections execute structural mutations but keep mathematical gates OPEN',async()=>{
  const z=zeroRecord.result.zeroCertificate;
  const projected={schema:zeroRecord.schema,execution:{status:'COMPLETED'},request:zeroRecord.request,recordSHA256:zeroRecord.recordSHA256,formalLeanProofIssued:false,wholeP7Complete:false,wholeM3Complete:false,result:{zeroCertificate:{schema:z.schema,positiveZeroCount:z.positiveZeroCount,countSaturation:z.countSaturation,contour:{zeroCountIncludingMultiplicity:z.contour.zeroCountIncludingMultiplicity},hardyRoots:z.hardyRoots.map(r=>({positiveZeroIndex:r.positiveZeroIndex,lower:r.lower,upper:r.upper,lowerSign:r.lowerSign,upperSign:r.upperSign,oppositeSigns:r.oppositeSigns,uniqueAndSimpleByTotalCount:r.uniqueAndSimpleByTotalCount}))}}};
  const report=await runMutationAudit({cases:['zero-box','rank-upper'],p7ZeroRecord:projected,p7RankRecord:rankRecord});
  assert.equal(report.cases.every(c=>c.negativeControlPassed),true);assert.equal(report.cases.every(c=>c.mathematicalReplayStatus.startsWith('OPEN')),true);assert.equal(report.status,'PARTIAL');assert.equal(report.certificateIssued,false);
});

test('source/environment/input/precision/base/ring mutations revoke a current binding without issuing proof',async()=>{
  const h='a'.repeat(64),ref=id=>({id,revision:'1',hash:h}),target={declaration:'MathScope.P8.Generated.point_count_certificate',propositionId:'P8.FINITE.COUNT',type:'Finite point-count consumer contract (test fixture; no Lean run)'};
  const graph={direction:'CLAIM_TO_PREREQUISITE',nodes:[{id:'claim',kind:'theorem',statement:target.type,propositionId:target.propositionId,declaration:target.declaration}],edges:[]};
  const input={claim:{schema:'MathScope.M3.P8.Claim/1',id:'claim',revision:'1',object:{id:'finite',kind:'DERIVED_MODEL',baseRef:ref('base'),coefficientRingRef:ref('ring')},arithmetic:{mode:'EXACT',scope:{kind:'FINITE',description:'Untrusted binding mutation fixture'},precision:{}},proof:{method:'NONE',target,sourceRefs:[],assumptionRefs:[]}},sourceFiles:[{path:'Generated.lean',content:readFileSync(new URL('p8/lean/MathScope/P8/Generated.lean',root),'utf8')}],environment:{leanVersion:'test-environment-unverified',leanCommit:'a'.repeat(40),mathlibCommit:null,runtimeLibrarySha256:h,importClosureSha256:h},input:{prime:'5'},precision:{},assumptionLedger:{schema:'MathScope.M3.P8.AssumptionLedger/1',target:{claimId:'claim',...target},entries:[],dependencyGraph:cloneJSON(graph)},dependencyGraph:graph};
  const binding=await bindP8Claim(input),report=await runBindingMutationAudit(binding,input);assert.equal(report.status,'BINDING_MUTATIONS_REJECTED');assert.equal(report.cases.length,6);assert.equal(report.cases.every(c=>c.negativeControlPassed),true);assert.equal(report.certificateIssued,false);
});

test('suite selectors and imported execution flags cannot request authority or unsupported code',async()=>{
  for(const input of [{cases:[]},{cases:['bad-prime','bad-prime']},{cases:['eval:source']},{formalComplete:true}])await assert.rejects(()=>runMutationAudit(input));
});
