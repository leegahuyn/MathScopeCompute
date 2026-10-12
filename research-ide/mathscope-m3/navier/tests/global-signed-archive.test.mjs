import test from 'node:test';
import assert from 'node:assert/strict';
import {recordedGlobalSigned,globalSignedObservations} from '../source-global-signed-evidence.mjs';

test('actual signed archive keeps complete partition, fixed source and all3 remainders',async()=>{
 const r=await recordedGlobalSigned(),v=globalSignedObservations(r);
 assert.ok(r.checks.every(c=>c.pass));assert.equal(v.partitionCount,81);
 assert.equal(v.covarianceRows.length,6);assert.deepEqual(v.samples,[]);assert.deepEqual(v.curves,[]);
 assert.equal(r.gate.nodeTests.passed,13);assert.equal(r.sourceFileCount,230);
 assert.match(r.packedArtifact.path,/\.json\.gz$/);assert.equal(r.artifact.bytes,29064143);
 for(const row of v.covarianceRows)assert.deepEqual(Object.keys(row).sort(),['after','before','component','curl','earlier','principal','representation','square'].sort());
});
test('archive does not rewrite historical acceptance or claim a finite state/full field',async()=>{
 const r=await recordedGlobalSigned();assert.equal(r.gate.originalN604Complete,false);
 assert.equal(r.summary.scope.originalN604Complete,false);assert.equal(r.recordedOnly,true);
 assert.equal(r.freshSourceConstructorExecuted,false);assert.equal(r.scope.initializedJ0,false);
 assert.equal(r.scope.allOrderSourceClassesCertified,false);assert.equal(r.completeN6,false);
 assert.equal(r.scope.currentAssessmentPath,'research-ide/mathscope-m3/N6_PROGRESS.json');
});
test('replacement targets, removed square and forged observed records are rejected',async()=>{
 await assert.rejects(recordedGlobalSigned({target:[0,0]}),{code:'INVALID_INPUT'});
 const r=await recordedGlobalSigned();assert.throws(()=>globalSignedObservations(structuredClone(r)),{code:'INVALID_SOURCE_ARCHIVE'});
 const old=r.summary.identity.newIncrementSquare;r.summary.identity.newIncrementSquare={};
 assert.throws(()=>globalSignedObservations(r),{code:'INVALID_SOURCE_ARCHIVE'});r.summary.identity.newIncrementSquare=old;
 assert.equal(globalSignedObservations(r).partitionCount,81);
});
