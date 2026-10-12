import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {exportReviewPackets} from '../p8/review-packets.mjs';
const evidence=JSON.parse(await fs.readFile(new URL('../p8/review-fixture-evidence.json',import.meta.url),'utf8'));
const buildData=JSON.parse(await fs.readFile(new URL('../p8/build-data.json',import.meta.url),'utf8'));
const snapshot=()=>({...structuredClone(buildData.reviewSnapshot),fixtureEvidence:structuredClone(evidence)});

test('actual historical fixture groups stay separate from available replay requests and current source',async()=>{
  const input=snapshot(),before=JSON.stringify(input),result=await exportReviewPackets(input,buildData.sourceBinding);
  assert.equal(JSON.stringify(input),before);assert.equal(result.wholeM3Complete,false);assert.equal(result.wholeP8Complete,false);
  for(const packet of result.packets){
    const group=evidence.groups.find(g=>g.id===packet.id);assert.deepEqual(packet.recordedFixtureResults,group.fixtures);
    assert.equal(packet.recordedFixtureScope.freshExecutionPerformed,false);assert.equal(packet.recordedFixtureScope.currentSourceReexecutionClaimed,false);
    assert.equal(packet.recordedFixtureScope.sourceCommit,evidence.sourceCommit);assert.equal(packet.importedAuthorityAccepted,false);assert.equal(packet.releaseAcceptance.allOriginalCriteriaComplete,false);
  }
  const p4=result.packets.find(p=>p.id==='P4');assert.equal(p4.recordedFixtureResults.length,10);assert.ok(p4.fixtures.every(f=>f.executionStatus==='AVAILABLE_FOR_INDEPENDENT_REPLAY_NOT_EXECUTED_BY_PACKET_EXPORT'));
  assert.equal(p4.releaseAcceptance.status,'INHERITED_COMPLETED_M2_SCOPED_CRITERIA');assert.equal(p4.releaseAcceptance.inheritedM2Acceptance.criteria.pass,24);
  const p8=result.packets.find(p=>p.id==='P8');assert.equal(p8.recordedFixtureSummary.singleSourceForAll17ExamplesAttested,false);assert.equal(p8.recordedFixtureSummary.laterEngineRebuildsCovered,false);
  const controls=p8.recordedFixtureResults.find(f=>f.id==='p8-recorded-mutation-controls');assert.equal(controls.checks.passed,4);assert.equal(controls.checks.unresolved,2);assert.equal(controls.sourceHash,null);
});

test('historical evidence rejects promoted execution scope and mismatched source commits',async()=>{
  for(const mutate of [s=>s.fixtureEvidence.freshExecutionPerformed=true,s=>s.fixtureEvidence.groups[0].fixtures[0].proofStatusPromoted=true,s=>s.fixtureEvidence.groups[0].fixtures[0].source.commit='0'.repeat(40)]){
    const input=snapshot();mutate(input);await assert.rejects(()=>exportReviewPackets(input,buildData.sourceBinding));
  }
});

test('missing recorded evidence is explicitly absent instead of inventing fixture results',async()=>{
  const input=snapshot();delete input.fixtureEvidence;const result=await exportReviewPackets(input,buildData.sourceBinding);
  assert.ok(result.packets.every(p=>p.recordedFixtureResults.length===0&&p.recordedFixtureScope.status==='NO_RECORDED_RESULTS_PROVIDED'));
});
