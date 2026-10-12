import test from 'node:test';
import assert from 'node:assert/strict';
import {recordedSourceCoreRestrictionEvidence,sourceCoreRestrictionEvidenceObservations} from '../source-core-restriction-evidence.mjs';
import {SOURCE_CORE_RESTRICTION_ARCHIVE} from '../source-core-restriction-evidence-data.mjs';

test('the observed proof archive replays the small source support computation with identical proof identity',async()=>{
  const result=await recordedSourceCoreRestrictionEvidence(),observations=sourceCoreRestrictionEvidenceObservations(result);
  assert.equal(result.gate.nodeTests.passed,16);assert.equal(result.gate.independentCheckCount,41);assert.equal(result.gate.sourceFileCount,156);
  assert.equal(result.newSupportProofExecuted,true);assert.equal(result.freshSourceConstructorExecuted,false);
  assert.equal(result.archiveVerification.newSupportProofExactlyMatchesObservedArtifact,true);
  assert.equal(observations.observedProofArtifact.sha256,'a669b4bad5cde239954f445a131f4d967f090a252fe1ae4cd5d047df7eb6d4f5');
  assert.equal(observations.proofSHA256,result.proofSHA256);assert.deepEqual(observations.curves,[]);
  assert.equal(result.scope.fullFinalN6FieldConstructed,false);assert.equal(result.scope.wholeKEnergyNearTerminalComputed,false);
});

test('recorded proof receipts cannot be supplied, forged, copied or enlarged by callers',async()=>{
  await assert.rejects(recordedSourceCoreRestrictionEvidence({receipt:{pass:true}}),{code:'INVALID_INPUT'});
  const result=await recordedSourceCoreRestrictionEvidence();
  assert.throws(()=>sourceCoreRestrictionEvidenceObservations({...result}),{code:'INVALID_SOURCE_ARCHIVE'});
  result.scope.fullFinalN6FieldConstructed=true;
  assert.throws(()=>sourceCoreRestrictionEvidenceObservations(result),{code:'INVALID_SOURCE_ARCHIVE'});
});

test('a changed support premise inside the immutable observed archive is rejected before replay',async()=>{
  const row=SOURCE_CORE_RESTRICTION_ARCHIVE.certificate.supportInduction.trace.find(x=>x.operator==='FULL_RADIAL_MOMENT'),old=row.zeroOnOpenCore;
  row.zeroOnOpenCore=true;
  try{await assert.rejects(recordedSourceCoreRestrictionEvidence(),{code:'SOURCE_ARCHIVE_MISMATCH'});}finally{row.zeroOnOpenCore=old;}
});
