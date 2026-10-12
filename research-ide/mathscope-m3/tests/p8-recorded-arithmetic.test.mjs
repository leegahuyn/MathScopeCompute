import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sha256} from '../p8/common.mjs';
import {validateRecordedChecks} from '../p8/recorded-checks.mjs';

// This fixture is the byte-verified artifact from an observed successful CI
// run. Its actual checkout is GitHub's PR merge commit, not the branch head.
const pkg=JSON.parse(await readFile(new URL('../p8/evidence/p7-mutation-release.json',import.meta.url)));
const expected='a46ce8dcb8c62a272cebd0535a75297eed5e124c9e091a454522b007c438d263';
const recipe=['setup.py','pyproject.toml','MANIFEST.in','src/mathscope_p7_pari/__init__.py','src/mathscope_p7_pari/build.py'].map(p=>'p7/pari_runtime/'+p);
const sourcePaths=['cli.py',...(await readdir(new URL('../p7/',import.meta.url))).filter(p=>p.endsWith('.py')).map(p=>'p7/'+p),...recipe,'p8/tools/audit_p7_mutations.py','tests/test_p8_p7_mutations.py'];
const current={files:await Promise.all(sourcePaths.map(async path=>({path:'mathscope-m3/'+path,sha256:createHash('sha256').update(await readFile(new URL('../'+path,import.meta.url))).digest('hex')})))};
const rank=p=>p.report.cases.find(row=>row.id==='rank-upper');
async function reseal(value){
  const certificate=rank(value).negativeControl.mutations[0].before;
  if(certificate&&typeof certificate==='object'){
    const body={...certificate};delete body.certificateSHA256;
    certificate.certificateSHA256=await sha256(body);
  }
  const body={...value.report};delete body.reportSHA256;
  value.report.reportSHA256=await sha256(body);
  return sha256(value);
}
async function rejectMutation(change,pattern){
  const value=structuredClone(pkg);change(value);
  const result=await validateRecordedChecks(value,current,await reseal(value));
  assert.equal(result.status,'RECORDED_CI_REJECTED');assert.equal(result.ok,false);
  assert.match(result.issues.join(' '),pattern);assert.equal(result.freshExecution,false);
}

test('actual successful arithmetic CI matches current source and preserves its observed scope',async()=>{
  assert.equal(await sha256(pkg),expected);
  assert.equal(pkg.report.schema,'MathScope.M3.P8.P7MutationAudit/2');
  assert.equal(pkg.ci.runId,'38237430568');assert.equal(pkg.ci.artifactId,11741622609);
  assert.equal(pkg.ci.commit,'eb2bc3a4a14d05a88248e85167286bb4f46a6ef5');
  assert.equal(pkg.process.pytestExitCode,0);
  assert.equal(await sha256(pkg.report.sourceBinding),'72564078d6fd9d19dc076eb3c4a6842108fad523898f786d0ec98c18b895b041');
  assert.equal(pkg.report.execution.freshP7ChildExecutions,6);
  assert.equal(pkg.report.validRankUpperCertificateDeletionExecuted,true);
  const original=JSON.stringify(pkg),result=await validateRecordedChecks(pkg,current,expected);
  assert.equal(result.status,'RECORDED_CI_SOURCE_MATCH');assert.equal(result.ok,true,result.issues?.join(' '));
  for(const key of ['freshExecution','formalLeanProofIssued','wholeP8Complete','wholeM3Complete','certificateIssued','archiveBytesVerifiedInBrowser','rawP7RecordHashesRecomputed'])assert.equal(result[key],false);
  const change=rank(pkg).negativeControl.mutations[0];
  assert.equal(change.before.status,'CERTIFIED_ARITHMETIC_UPPER');assert.equal(change.before.upperBound,1);
  assert.equal(change.operation,'DELETE_VALID_CERTIFICATE');assert.equal(change.after,null);
  assert.deepEqual(change.rankIntervalPreserved,{lowerBound:1,upperBound:1,exactRank:1});
  assert.equal(JSON.stringify(pkg),original);
});

test('rank mutation must delete the valid prerequisite while retaining the original singleton interval',async()=>{
  for(const change of [m=>m.operation='DELETE_UNCHECKED_LABEL',m=>m.after=structuredClone(m.before),m=>m.rankIntervalPreserved.upperBound=2]){
    await rejectMutation(p=>change(rank(p).negativeControl.mutations[0]),/deletion of an actual valid rank/);
  }
  for(const change of [c=>c.upperBound=null,c=>c.twoSelmerRank=2,c=>c.freshProcessExecuted=false]){
    await rejectMutation(p=>change(rank(p).negativeControl.mutations[0].before),/not a valid arithmetic rank/);
  }
});

test('resealing cannot substitute a database, conjecture, different model or unpinned arithmetic runtime',async()=>{
  for(const change of [c=>c.backend.databasesUsed=true,c=>c.backend.version='2.18.0',c=>c.backend.sourceArchiveSHA256='0'.repeat(64),c=>c.modelHash='0'.repeat(64)]){
    await rejectMutation(p=>change(rank(p).negativeControl.mutations[0].before),/runtime or model binding/);
  }
  for(const key of ['databaseLookupUsed','analyticRankUsed','BSDOrParityConjectureAssumed','formalLeanProofIssued']){
    await rejectMutation(p=>rank(p).negativeControl.mutations[0].before[key]=true,/authority or completion/);
  }
});

test('the removed arithmetic certificate must retain its exact checked two-cover map',async()=>{
  for(const change of [c=>c.exactTwoCovers=[],c=>c.coverMapChecks=[],c=>c.coverMapChecks[0].exactRationalMapIdentityChecked=false,c=>c.coverMapChecks[0].coverSHA256='0'.repeat(64)]){
    await rejectMutation(p=>change(rank(p).negativeControl.mutations[0].before),/checked 2-cover map/);
  }
});

test('actual arithmetic scope and downstream revocation cannot be promoted or omitted',async()=>{
  await rejectMutation(p=>p.report.validRankUpperCertificateDeletionExecuted=false,/replay count or scope/);
  await rejectMutation(p=>rank(p).mathematicalScope.rankUpperBoundComputed=false,/arithmetic bound scope/);
  await rejectMutation(p=>rank(p).mathematicalScope.globalBSDProved=true,/authority or completion/);
  await rejectMutation(p=>rank(p).downstream.revokedNodeIds.pop(),/revocation/);
  await rejectMutation(p=>rank(p).downstream.badges.find(b=>b.id==='curve-rank-equality').status='PASS',/badge/);
});

test('actual arithmetic receipt requires unchanged source, complete recipe and an independent successful process',async()=>{
  const stale=structuredClone(current);stale.files.find(f=>f.path==='mathscope-m3/p7/elliptic_arithmetic.py').sha256='0'.repeat(64);
  const mismatch=await validateRecordedChecks(pkg,stale,expected);assert.equal(mismatch.ok,false);assert.match(mismatch.issues.join(' '),/stale/);
  const missing=structuredClone(current);missing.files=missing.files.filter(f=>f.path!=='mathscope-m3/p7/pari_runtime/setup.py');
  const incomplete=await validateRecordedChecks(pkg,missing,expected);assert.equal(incomplete.ok,false);assert.match(incomplete.issues.join(' '),/runtime\/source membership/);
  await rejectMutation(p=>p.process.pytestExitCode=1,/Independent test process failed/);
  await rejectMutation(p=>p.process.commit='529e864c8b2ed19399bab8bbc53a08721873d5d4',/another run/);
});
