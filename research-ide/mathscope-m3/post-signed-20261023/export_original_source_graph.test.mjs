import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {promises as fs} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {exportOriginalSourceGraph} from './export_original_source_graph.mjs';
const nodes=[{op:'rational',args:['0','1']},{op:'coordinate',args:['x']},{op:'multiply',args:[0,1]}];
const G={nodes,captureFunctionDefinitions:()=>({foo:'bar'})};
const settings={roots:[2],scope:'FIRST_POST_FIVEMAP_NOT_FINAL_ABP',
 sourceCommit:'test-origin',pr30Commit:'test-pr30'};
test('whole graph and definitions survive gzip and 2 SHA256 checks',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-snap-'));
 try{
  const r=await exportOriginalSourceGraph(G,{...settings,dir});
  const data=gunzipSync(await fs.readFile(path.join(dir,'original-source-nodes.jsonl.gz')));
  assert.equal(r.node_stream_sha256,createHash('sha256').update(data).digest('hex'));
  assert.deepEqual(data.toString().trim().split('\n').slice(1).map(JSON.parse),nodes);
  const defs=await fs.readFile(path.join(dir,'original-source-functions.json'));
  assert.equal(r.definitions_sha256,createHash('sha256').update(defs).digest('hex'));
  assert.equal(r.final_all_cycle_A_b_p,false);assert.equal(r.actual_final_67_jets_certified,0);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('never write a fabricated root index',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-snap-'));
 try{await assert.rejects(()=>exportOriginalSourceGraph(G,{...settings,dir,roots:[40]}),{code:'INVALID_ORIGINAL_GRAPH_EXPORT'});}
 finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('reject source graphs lacking native definitions',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-snap-'));
 try{await assert.rejects(()=>exportOriginalSourceGraph({nodes},{...settings,dir}),{code:'MISSING_SOURCE_FUNCTION_DEFINITIONS'});}
 finally{await fs.rm(dir,{recursive:true,force:true})}
});