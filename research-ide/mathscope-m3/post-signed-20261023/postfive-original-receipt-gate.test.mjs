import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyOriginalPostFiveReceipt as verify} from './postfive-original-receipt-gate.mjs';
const example=()=>({schema:'MathScope.M3.SourceBoundOriginalPipeline/1',
  expected_base_commit:'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60',executing_commit:'test',
  real_original_signed162_seal_issued:true,real_original_forced_seal_issued:true,
  real_original_latest_cor85_stress_seal_issued:true,actual_signed162_indexed_rows:1620,
  actual_signed162_node_count:4193092,
  successfully_authenticated:['original_signed162_successor',
    'post_signed_original_exact_temporal_AST_and_fresh_mean_PJ','post_signed_original_five_equation_AST_and_fresh_PJ'],
  graph_node_counts:[{stage:'original_signed162_successor',node_count:4193092},
    {stage:'post_signed_original_exact_temporal_AST_and_fresh_mean_PJ',node_count:4418363},
    {stage:'post_signed_original_five_equation_AST_and_fresh_PJ',node_count:4419183}],
  post_signed_five_map_mean_source_AST_checked:true,
  post_signed_five_map_fresh_PJ:[4418702,4418769,4418830],
  post_signed_exact_inverse_AST_private_source_checked:true,
  real_original_five_map_seal_issued:false,real_original_temporal_seal_issued:false,
  actual_final67_jets_evaluated:0,M3_original_accepted:62,M4_original_accepted:0,
  N706:'OPEN',N805:'OPEN',release:'HOLD'});
test('actual-style receipt reaches FiveMap AST, not an original private seal or PDE proof',()=>{
  const out=verify(example());assert.equal(out.afterFive3DPDESourceASTChecked,false);
  assert.equal(out.fiveMapOriginalPrivateSeal,false);
  assert.equal(out.actual3DPDEResidualProvedZero,false);
  assert.equal(out.actual67IntervalJetsVerifiedByThisAudit,0);
});
test('forged five moment root outside AST graph is rejected',()=>{
  const r=example();r.post_signed_five_map_fresh_PJ[1]=4419183;
  assert.throws(()=>verify(r),{code:'RECEIPT_EVIDENCE_INCOMPLETE'});
});
test('replacing original PR pin or release HOLD is rejected',()=>{
  const r=example();r.expected_base_commit='changed';assert.throws(()=>verify(r));
  const b=example();b.release='PASS';assert.throws(()=>verify(b));
});
test('full 3D stage requires the actual three residual roots',()=>{
  const r=example();r.successfully_authenticated.push('post_five_actual_full_physical_three_dimensional_PDE_AST');
  r.graph_node_counts.push({stage:'post_five_actual_full_physical_three_dimensional_PDE_AST',node_count:4419300});
  assert.throws(()=>verify(r));
  r.post_five_full_three_dimensional_PDE_AST_checked=true;
  r.post_five_full_three_dimensional_PDE_residual_roots=[4419250,4419260,4419270];
  const out=verify(r);assert.equal(out.afterFive3DPDESourceASTChecked,true);
  assert.equal(out.actual3DPDEResidualProvedZero,false);
});
test('Signed private source seal cannot be promoted from fixture',()=>{
  const r=example();r.real_original_signed162_seal_issued=false;
  assert.throws(()=>verify(r));
});
