import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {exportOriginalSourceGraph} from './export_original_source_graph.mjs';
import {auditOriginalSourceReplay} from './audit_original_source_graph_replay.mjs';
const G={nodes:[{op:'rational',args:['1','1']},{op:'coordinate',args:['x']},{op:'multiply',args:[0,1]}],
  captureFunctionDefinitions:()=>({mock:true})};
const options={roots:[2],scope:'FIRST_FIVEMAP_NOT_FINAL',sourceCommit:'test-source',pr30Commit:'test-pr30'};
test('exact replay validates all nodes and preserves 0/67 scope',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-replay-'));
 try{
  await exportOriginalSourceGraph(G,{...options,dir});
  const r=await auditOriginalSourceReplay(dir);
  assert.equal(r.node_count,3);assert.equal(r.operation_histogram.multiply,1);
  assert.equal(r.final_all_cycle_A_b_p_serialized,false);
  assert.equal(r.final_67_numeric_certified,0);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('tampered source graph hash rejected',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-replay-'));
 try{
  await exportOriginalSourceGraph(G,{...options,dir});
  const file=path.join(dir,'original-source-export-manifest.json');
  const r=JSON.parse(await fs.readFile(file,'utf8'));
  r.node_stream_sha256='0'.repeat(64);await fs.writeFile(file,JSON.stringify(r));
  await assert.rejects(()=>auditOriginalSourceReplay(dir),{code:'UNTRUSTED_SOURCE_REPLAY'});
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});