import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateRecordedChecks,conditionalLedger} from '../p8/recorded-checks.mjs';
import {sha256} from '../p8/common.mjs';

const bytesHash=bytes=>createHash('sha256').update(bytes).digest('hex');
const pkg=JSON.parse(await readFile(new URL('../p8/evidence/p7-mutation-release-historical-v1.json',import.meta.url)));
const expected='90337c7b958b069bfc62916998aa7ea67426be7a415c5d640e2d10f2576b8fd3';
const paths=[...pkg.report.sourceBinding.files.map(r=>r.path),'p8/tools/audit_p7_mutations.py','tests/test_p8_p7_mutations.py'];
const liveCurrent={files:await Promise.all(paths.map(async path=>({path:'mathscope-m3/'+path,sha256:bytesHash(await readFile(new URL('../'+path,import.meta.url)))})))};
// This immutable CI archive predates the arithmetic runtime. Its original
// manifest can exercise the consistency parser; current bytes must separately
// reject it as stale. The actual arithmetic /2 release has a separate test
// using the current sources; this historical artifact is never relabelled.
const current={files:[...pkg.report.sourceBinding.files.map(row=>({path:'mathscope-m3/'+row.path,sha256:row.sha256})),
  {path:'mathscope-m3/p8/tools/audit_p7_mutations.py',sha256:pkg.report.auditSourceSHA256},
  {path:'mathscope-m3/tests/test_p8_p7_mutations.py',sha256:pkg.report.testHarness.sourceSHA256}]};
const clone=structuredClone;
async function reseal(value){const body={...value.report};delete body.reportSHA256;value.report.reportSHA256=await sha256(body);return await sha256(value);}
async function rejectMutation(change,pattern){const value=clone(pkg);change(value);const result=await validateRecordedChecks(value,current,await reseal(value));assert.equal(result.status,'RECORDED_CI_REJECTED');assert.equal(result.ok,false);if(pattern)assert.match(result.issues.join(' '),pattern);assert.equal(result.freshExecution,false);}

test('historical independently successful CI package is consistent with its recorded manifest without fresh execution',async()=>{
  assert.equal(await sha256(pkg),expected);
  const original=JSON.stringify(pkg),result=await validateRecordedChecks(pkg,current,expected);
  assert.equal(result.ok,true,result.issues?.join(' '));assert.equal(result.status,'RECORDED_CI_SOURCE_MATCH');
  assert.equal(result.ci.commit,'dd37b6a8953dd5de3d85451d88b888022cd66fa6');
  for(const key of ['freshExecution','formalLeanProofIssued','wholeP8Complete','wholeM3Complete','certificateIssued','archiveBytesVerifiedInBrowser','rawP7RecordHashesRecomputed'])assert.equal(result[key],false);
  assert.equal(result.process.pytestExitCode,0);assert.equal(JSON.stringify(pkg),original);assert.equal(Object.isFrozen(pkg),false);assert.equal(Object.isFrozen(result.report),true);
});

test('historical CI observations are rejected against changed current source bytes',async()=>{
  const changed=JSON.stringify(liveCurrent)!==JSON.stringify(current);
  const result=await validateRecordedChecks(pkg,liveCurrent,expected);
  assert.equal(result.ok,!changed);assert.equal(result.freshExecution,false);
  if(changed)assert.match(result.issues.join(' '),/stale|membership|version/);
});

test('missing evidence is NOT_RECORDED while false and corrupt objects are rejected',async()=>{
  assert.equal((await validateRecordedChecks(null,current,null)).status,'NOT_RECORDED');
  assert.equal((await validateRecordedChecks(false,current,expected)).status,'RECORDED_CI_REJECTED');
  assert.equal((await validateRecordedChecks(pkg,current,'0'.repeat(64))).ok,false);
});

test('independent pytest failure or another commit/run cannot be hidden by report PASS',async()=>{
  for(const [key,value] of [['pytestExitCode',1],['commit','0'.repeat(40)],['runId','1'],['schema','other']])await rejectMutation(p=>p.process[key]=value,/process|schema/);
  await rejectMutation(p=>delete p.process);
});

test('pre-exit receipt cannot claim an already successful test process',async()=>{
  await rejectMutation(p=>p.report.testHarness.allTestsPassed=true,/pre-exit/);
  await rejectMutation(p=>p.report.testHarness.testProcessExitCode=0,/pre-exit/);
  await rejectMutation(p=>p.report.testHarness.sourceSHA256='0'.repeat(64),/test source/);
});

test('source deletion, duplication and stale bytes fail even after package resealing',async()=>{
  await rejectMutation(p=>p.report.sourceBinding.files.pop(),/membership/);
  await rejectMutation(p=>p.report.sourceBinding.files.push(clone(p.report.sourceBinding.files[0])),/recorded source/);
  const stale=clone(current);stale.files[0].sha256='0'.repeat(64);assert.equal((await validateRecordedChecks(pkg,stale,expected)).ok,false);
  const added=clone(current);added.files.push({path:'mathscope-m3/p7/new_backend.py',sha256:'1'.repeat(64)});assert.equal((await validateRecordedChecks(pkg,added,expected)).ok,false);
  const duplicate=clone(current);duplicate.files.push(clone(duplicate.files[0]));assert.equal((await validateRecordedChecks(pkg,duplicate,expected)).ok,false);
});

test('inner report digest is checked separately from the outer packaged digest',async()=>{
  const value=clone(pkg);value.report.reportSHA256='0'.repeat(64);
  const result=await validateRecordedChecks(value,current,await sha256(value));assert.equal(result.ok,false);assert.match(result.issues[0],/report digest/);
});

test('a negative replay timeout or failed process is not a successful rejection',async()=>{
  for(const change of [e=>e.status='UNRESOLVED',e=>e.timedOut=true,e=>e.observedExitCode=2,e=>e.failure={type:'MemoryError'},e=>e.stderr='backend failure'])await rejectMutation(p=>change(p.report.cases[0].negativeControl.fresh.execution),/complete cleanly/);
  await rejectMutation(p=>p.report.cases[0].negativeControl.unresolvedCountsAsRejection=true,/replay controls/);
});

test('actual child environment and imposed limits are checked',async()=>{
  await rejectMutation(p=>p.report.cases[0].negativeControl.fresh.execution.observedChildEnvironmentSHA256='0'.repeat(64),/environment/);
  await rejectMutation(p=>p.report.cases[0].negativeControl.fresh.execution.observedChildResourceLimits.cpuSeconds=[1,2],/limits/);
  await rejectMutation(p=>p.report.cases[0].negativeControl.fresh.execution.startedAt='1900-01-01T00:00:00Z',/interval/);
});

test('vacuous binding flags and missing precision controls fail',async()=>{
  await rejectMutation(p=>p.report.cases[0].bindingPreserved={},/binding/);
  await rejectMutation(p=>p.report.cases[0].request.input.precisionBits=192,/precision/);
});

test('explicit binding keys and rejection controls cannot be omitted',async()=>{
  await rejectMutation(p=>delete p.report.cases[0].bindingPreserved.inputSHA256,/binding/);
  await rejectMutation(p=>p.report.cases[0].bindingRejectionControls.splice(1,1),/rejection controls/);
  await rejectMutation(p=>p.report.cases[0].baseline.inputSHA256='0'.repeat(64),/binding/);
});

test('changed negative mathematics must differ from forged but match fresh positive baseline',async()=>{
  await rejectMutation(p=>p.report.cases[0].negativeControl.forged.mathematicalSHA256=p.report.cases[0].baseline.mathematicalSHA256,/changed mathematics/);
  await rejectMutation(p=>p.report.cases[0].positiveControl.fresh.mathematicalSHA256='0'.repeat(64),/changed mathematics/);
  await rejectMutation(p=>p.report.cases[0].negativeControl.fresh.recordSHA256=p.report.cases[0].positiveControl.fresh.recordSHA256,/reused/);
});

test('box translation and forged upper-bound evidence are the actual fixed controls',async()=>{
  await rejectMutation(p=>p.report.cases[0].negativeControl.mutations[0].after.lower=p.report.cases[0].negativeControl.mutations[0].before.lower,/translation/);
  await rejectMutation(p=>p.report.cases[1].negativeControl.mutations[0].before.upperBound=1,/open baseline/);
  await rejectMutation(p=>delete p.report.cases[1].negativeControl.mutations[0].after.upperBoundCertificate,/forged rank/);
});

test('downstream graph closure revokes exactly the dependent badges',async()=>{
  await rejectMutation(p=>p.report.cases[0].downstream.edges.pop(),/graph/);
  await rejectMutation(p=>p.report.cases[0].downstream.revokedNodeIds.pop(),/revocation/);
  await rejectMutation(p=>p.report.cases[0].downstream.badges.find(b=>b.id==='conditional-rh-review').status='PASS',/badge/);
  await rejectMutation(p=>p.report.cases[0].downstream.wholeApplicationGraphAudited=true,/authority/);
});

test('nested authority and mathematical completion promotions are rejected',async()=>{
  await rejectMutation(p=>p.report.certificateIssued=true,/authority/);
  await rejectMutation(p=>p.report.cases[1].mathematicalScope.rankUpperBoundComputed=true,/authority/);
  await rejectMutation(p=>p.report.cases[0].positiveControl.fresh.wholeP7Complete=true,/authority/);
  await rejectMutation(p=>p.report.cases[0].positiveControl.importedProofStatusAdopted=true,/controls/);
});

test('CI identity, artifact metadata and duplicated current paths are bounded',async()=>{
  await rejectMutation(p=>p.ci.url='https://example.com/fake',/CI identity/);
  await rejectMutation(p=>p.ci.artifactId='11727724970',/artifact identity/);
  await rejectMutation(p=>p.ci.artifactSHA256='no-digest',/artifact identity/);
});

test('asynchronous digest validation snapshots both caller-owned inputs',async()=>{
  const value=clone(pkg),source=clone(current),pending=validateRecordedChecks(value,source,expected);
  value.report.cases[0].negativeControl.fresh.execution.timedOut=true;source.files[0].sha256='0'.repeat(64);
  const result=await pending;assert.equal(result.ok,true,result.issues?.join(' '));assert.equal(result.report.cases[0].negativeControl.fresh.execution.timedOut,false);assert.equal(Object.isFrozen(value),false);
});

test('conditional success is not invented from absent or failed evidence',async()=>{
  const failed={kind:'CONDITIONAL_LEAN',ci:clone(pkg.ci),report:{schema:'MathScope.M3.P8.ConditionalLeanAudit/1',status:'FAILED',proofGrade:'CONDITIONAL_ON_TARGET',serializedAuthority:'UNTRUSTED_REQUIRES_REEXECUTION',formalLeanProofIssued:false,wholeP8Complete:false,wholeM3Complete:false}};
  const result=await validateRecordedChecks(failed,current,await sha256(failed));assert.equal(result.ok,false);assert.equal(result.formalLeanProofIssued,false);
  assert.throws(()=>conditionalLedger(failed.report),/boundary/);
  // No successful conditional CI fixture is fabricated here. That branch
  // requires its future real CI archive before a positive acceptance test.
});
