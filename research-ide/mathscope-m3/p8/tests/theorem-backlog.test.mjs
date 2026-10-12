import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTheoremBacklog} from '../theorem-backlog.mjs';

test('all seven requested candidates expose their proof obligations without invented compilation',()=>{
  const result=buildTheoremBacklog({status:'NOT_COMPILED_FOR_THIS_INPUT'});
  assert.equal(result.candidates.length,7);
  for(const row of result.candidates){
    for(const key of ['theoremStatement','inputType','certificateConsumption','scope'])assert.ok(typeof row[key]==='string'&&row[key].length>10);
    assert.ok(row.coreLemmas.length>0);assert.deepEqual(row.additionalAxioms,[]);
    assert.equal(row.freshKernelExecuted,false);assert.equal(row.formalProofIssued,false);
    assert.ok(!row.compileStatus.startsWith('RECORDED_EXACT_INPUT'));
    assert.deepEqual(row.actualAuditedTargets,[]);
  }
  assert.equal(result.candidates.find(x=>x.id.endsWith('CHAIN_EQUIVALENCE')).compileStatus,'BACKLOG_NOT_COMPILED_AS_P8_CONSUMER');
  assert.equal(result.libraryCoverage.entries.find(x=>x.topic==='Native advanced prismatic comparisons').status,'NOT_CONFIRMED_FOR_PINNED_DEPLOYMENT');
  assert.equal(result.wholeP8Complete,false);
});

test('recorded exact types attach only to their validated declared targets',()=>{
  const actual={name:'MathScope.P8.inherited_d_squared',type:'test exact printed type',axioms:{all:['propext'],standard:['propext'],custom:[]}};
  const accepted=buildTheoremBacklog({status:'RECORDED_KERNEL_CHECK_MATCH',registry:{ok:true},recordedAudit:{targets:[actual]}});
  assert.equal(accepted.candidates[0].compileStatus,'RECORDED_EXACT_INPUT_KERNEL_TYPES_ATTACHED');
  assert.deepEqual(accepted.candidates[0].actualAuditedTargets,[actual]);
  assert.equal(accepted.candidates[1].compileStatus,'NO_MATCHING_SUCCESSFUL_P8_AUDIT');
  const rejected=buildTheoremBacklog({status:'RECORDED_KERNEL_CHECK_MATCH',registry:{ok:false},recordedAudit:{targets:[actual]}});
  assert.deepEqual(rejected.candidates[0].actualAuditedTargets,[]);
});
