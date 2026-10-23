import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {promises as fs} from 'node:fs';
import {exportOriginalSourceGraph} from './export_original_source_graph.mjs';
import {auditRootReachableNativeOperations} from './audit_original_root_native_closure.mjs';

const nodes=[
 {op:'rational',args:['1','1']},
 {op:'coordinate',args:['x']},
 {op:'multiply',args:[0,1]},
 {op:'exp',args:[1]},
 {op:'add',args:[0,2]}
];
const G={nodes,captureFunctionDefinitions:()=>({source:'toy only'})};
async function run(roots){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mathscope-native-closure-'));
 try{
   await exportOriginalSourceGraph(G,{dir,roots,scope:'FIRST_FIVEMAP_TOY',
     sourceCommit:'toy-run',pr30Commit:'toy-pr30'});
   return await auditRootReachableNativeOperations(dir);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
}
test('only root-reachable source nodes count, never disconnected special functions',async()=>{
 const r=await run([4]);
 assert.equal(r.original_first_fivemap_graph_nodes,5);
 assert.equal(r.reachable_nodes,4);
 assert.equal(r.unreachable_nodes,1);
 assert.equal(r.multiple_root_reachability_method,'SINGLE_REVERSE_TOPOLOGICAL_BITMASK_PASS');
 assert.equal(r.original_source_per_root_native_usage.length,1);
 assert.equal(r.original_source_per_root_native_usage[0].reachable_nodes,4);
 assert.equal(r.reachable_non_elementary_nodes,0);
 assert.equal(r.actual_final_67_numeric_intervals_certified,0);
 assert.equal(r.exact_original_operator_graph_digest_checked,true);
 assert.equal(r.release,'HOLD');
});
test('reachable source exponential is not silently certified as original',async()=>{
 const r=await run([3]);
 assert.equal(r.reachable_nodes,2);
 assert.equal(r.reachable_non_elementary_nodes,1);
 assert.equal(r.operator_counts.find(x=>x.op==='exp').evidence,
   'BOUNDED_ARGUMENT_INTERVAL_KERNEL_ONLY');
 assert.equal(r.actual_final_all_cycle_A_b_p_present,false);
 assert.equal(r.syntactic_root_closure_only,true);
 assert.equal(r.native_definition_semantic_dependencies_traversed,false);
});
test('source unknown native operation has no numerical promotion',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mathscope-native-closure-'));
 try{
   const g={nodes:[{op:'rational',args:['1','1']},{op:'m3_unknown_native',args:[0]}],
     captureFunctionDefinitions:()=>({source:'toy only'})};
   await exportOriginalSourceGraph(g,{dir,roots:[1],scope:'FIRST_FIVEMAP_TOY',
     sourceCommit:'toy',pr30Commit:'toy'});
   await assert.rejects(()=>auditRootReachableNativeOperations(dir),
     {code:'UNRECOGNIZED_SOURCE_NODE_SHAPE'});
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});

test('native system, component and derivative metadata never appear as reachable nodes',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mathscope-native-shapes-'));
 try{
   const g={nodes:[
     {op:'rational',args:['1','1']},
     {op:'coordinate',args:['X']},
     {op:'coordinate',args:['eta']},
     {op:'actual_natural_series',args:['average',1,2,0,0]},
     {op:'actual_pulse_jet_volterra',args:[0,0,1,[2]]}],
     captureFunctionDefinitions:()=>({source:'toy only'})};
   await exportOriginalSourceGraph(g,{dir,roots:[3,4],
     scope:'FIRST_FIVEMAP_TOY',sourceCommit:'toy',pr30Commit:'toy'});
   const r=await auditRootReachableNativeOperations(dir);
   assert.equal(r.reachable_nodes,4);
   assert.equal(r.unreachable_nodes,1);
   assert.equal(r.reachable_native_operator_kinds_without_validated_generic_interval_value.length,2);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});

test('single reverse pass reports separate root native closures accurately',async()=>{
 const r=await run([3,4]);
 assert.equal(r.reachable_nodes,5);
 assert.equal(r.original_source_per_root_native_usage.length,2);
 const [exp,add]=r.original_source_per_root_native_usage;
 assert.equal(exp.reachable_nodes,2);
 assert.equal(add.reachable_nodes,4);
 assert.equal(exp.operation_counts.find(x=>x.op==='exp').n,1);
 assert.equal(add.operation_counts.some(x=>x.op==='exp'),false);
 assert.equal(r.operator_counts.find(x=>x.op==='exp').n,1);
});

test('system ID census distinguishes actual repeated source call nodes from unique registry ID',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-system-id-census-'));
 try{
  const x={nodes:[
   {op:'rational',args:['1','1']},
   {op:'coordinate',args:['X']},
   {op:'m3_aux_expression_partial',args:[-13,[1],[0]]},
   {op:'m3_aux_expression_partial',args:[-13,[1],[1]]},
   {op:'add',args:[2,3]}],
    captureFunctionDefinitions:()=>({raw:true})};
  await exportOriginalSourceGraph(x,{dir,roots:[4,2],
   scope:'FIRST_FIVEMAP_TOY',sourceCommit:'synthetic',pr30Commit:'synthetic'});
  const result=await auditRootReachableNativeOperations(dir);
  assert.equal(result.distinct_native_source_system_IDs_reached,1);
  assert.deepEqual(result.direct_reachable_source_system_ID_usage,
    [{source_id:'m3_aux_expression_partial::-13',call_nodes:2}]);
  assert.equal(result.original_source_per_root_native_usage[0].native_original_source_system_IDs[0].call_nodes,2);
  assert.equal(result.original_source_per_root_native_usage[1].native_original_source_system_IDs[0].call_nodes,1);
  assert.equal(result.native_function_body_expansion_included_in_ID_counts,false);
  assert.equal(result.actual_final_67_numeric_intervals_certified,0);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
