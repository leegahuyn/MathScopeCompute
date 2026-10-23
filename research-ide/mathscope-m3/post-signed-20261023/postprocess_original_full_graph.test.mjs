import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {exportOriginalSourceGraph} from './export_original_source_graph.mjs';
import {produceFirstFiveMapNativeOperatorReceipt} from './postprocess_original_full_graph.mjs';
test('exact source archive produces per-root Fourier and elementary counts',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mathscope-per-root-source-'));
 try{
  const G={nodes:[
   {op:'rational',args:['1','1']},
   {op:'coordinate',args:['X']},
   {op:'coordinate',args:['Y']},
   {op:'m3_aux_inverse_partial',args:['aux-inverse:0',[1,2],[0,0]]},
   {op:'multiply',args:[0,1]},
   {op:'add',args:[4,3]},
   {op:'exp',args:[2]}],
   captureFunctionDefinitions:()=>({source:'toy only'})};
  await exportOriginalSourceGraph(G,{dir,roots:[5,4],scope:'FIRST_FIVEMAP_TOY',
    sourceCommit:'toy',pr30Commit:'toy'});
  const q=await produceFirstFiveMapNativeOperatorReceipt(dir);
  assert.equal(q.source_node_count,7);
  assert.equal(q.root_count,2);
  assert.equal(q.root_usage[0].fourier_inverse.length,1);
  assert.equal(q.root_usage[1].fourier_inverse.length,0);
  assert.equal(q.root_usage[0].reachable_nodes,6);
  assert.equal(q.root_usage[1].reachable_nodes,3);
  assert.equal(q.first_blocking_native_operation_by_reachable_count,'m3_aux_inverse_partial');
  assert.equal(q.actual_original_final_67_jet_interval_count,0);
  assert.equal(q.complete_full_stream_SHA256_verified,true);
  assert.equal(q.native_function_definitions_semantically_evaluated,false);
  await assert.rejects(()=>produceFirstFiveMapNativeOperatorReceipt(dir,{requireOriginal:true}),
    {code:'WRONG_ORIGINAL_SOURCE_ARCHIVE'});
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
