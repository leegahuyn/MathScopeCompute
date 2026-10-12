import test from 'node:test';
import assert from 'node:assert/strict';
import {getExamples,runGaugeM3,exportGaugeSession,replayGaugeSession} from '../index.mjs';
import {STUDY_RECORD_DATA} from '../study-record-data.mjs';
import {verifyStudyRecordEnvelope} from '../study-record.mjs';
import {sha256} from '../contracts.mjs';

test('actual production archive exposes all eight attempts and seven reviewed rows without claiming a new chain or continuum gap',async()=>{
 const example=getExamples().find(e=>e.id==='y5-production-reference-record'),r=await runGaugeM3(example.request);
 assert.equal(r.kind,'ensemble-study');assert.equal(r.newExecution,false);assert.equal(r.execution.originalAttemptCount,8);assert.equal(r.execution.displayedChannelConfigurations,12288);assert.equal(r.execution.distinctReferenceConfigurations,384);assert.equal(r.calibration.length,7);
 assert.equal(r.archiveAudit.status,'ARCHIVE_BODY_AND_DISPLAYED_ROWS_MATCH');assert.equal(r.archiveAudit.rawFilesRefetchedInBrowser,false);assert.equal(r.archiveAudit.displayedRowChecks.length,7);assert.equal(r.priorAttempts[0].channelMass.status,'UNRESOLVED_CHANNEL_MASS');
 assert.ok(r.calibration.every(c=>c.channelMass.value!==c.targetDelta&&c.targetComparison.equalityForced===false&&c.targetComparison.newActualChainExecuted===false&&c.targetComparison.originalNewActualChainExecuted===true));
 assert.equal(r.limitComparison.matching.allMatched,true);assert.equal(r.limitComparison.spatial.status,'FIXED_A_FINITE_SWEEP_EXECUTED');assert.equal(r.limitComparison.temporal.status,'FIXED_A_FINITE_SWEEP_EXECUTED');assert.equal(r.limitComparison.spacing.extrapolation.continuumPositiveLowerBound,null);assert.equal(r.proofBoundary.clayProblemSolved,false);
 const base=r.calibration.find(c=>c.id==='a-beta230');assert.equal(base.scaleSetting.quantitativeStatus,'PROVISIONAL_REFERENCE_DIAGNOSTICS');assert.equal(base.scaleSetting.diagnostics.replicas[0].status,'INSUFFICIENT_EFFECTIVE_SAMPLES');assert.ok(base.channel.vacuumDifference.empiricalNegativeValues.length>0);
});

test('archive transport detects byte edits and remains verifiable after publisher-style Unicode escape normalization',async()=>{
 const changed=structuredClone(STUDY_RECORD_DATA);changed.bodyBase64='A'+changed.bodyBase64.slice(1);
 await assert.rejects(verifyStudyRecordEnvelope(changed),e=>['STUDY_ARCHIVE_BODY_HASH','STUDY_ARCHIVE_ENCODING'].includes(e.code));
 const normalized=JSON.parse(JSON.stringify(STUDY_RECORD_DATA).replace(/\\u([0-9a-f]{4})/gi,(_,digits)=>String.fromCharCode(parseInt(digits,16))));
 const valid=await verifyStudyRecordEnvelope(normalized);assert.equal(valid.bodySha256,STUDY_RECORD_DATA.bodySha256);assert.equal(valid.rowChecks.length,7);
});

test('archive input cannot masquerade as edited or freshly calibrated model parameters',async()=>{
 await assert.rejects(runGaugeM3({kind:'ensemble-study',recordId:'su2-production-v1',beta:3}),/unsupported parameter/);
 await assert.rejects(runGaugeM3({kind:'ensemble-study',recordId:'unknown'}),/su2-production-v1/);
});

test('archive session replay rechecks source data without relabelling it a newly executed numerical chain',async()=>{
 const r=await runGaugeM3({kind:'ensemble-study',recordId:'su2-production-v1'}),bundle=await exportGaugeSession(r),replayed=await replayGaugeSession(bundle);
 assert.equal(replayed.status,'MATCH');assert.equal(replayed.newExecution,false);assert.equal(replayed.sourceAuditReexecuted,true);assert.equal(replayed.actual.sourceHash,r.sourceHash);
 const forged=structuredClone(bundle);forged.payload.result.calibration[0].channelMass.value=100;forged.payloadHash=await sha256(forged.payload);
 const mismatch=await replayGaugeSession(forged);assert.equal(mismatch.status,'MISMATCH');assert.equal(mismatch.actual.calibration[0].channelMass.value,r.calibration[0].channelMass.value);
});
