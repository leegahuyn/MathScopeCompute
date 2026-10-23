import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {promises as fs} from 'node:fs';
import {exportOriginalSourceGraph} from './export_original_source_graph.mjs';
import {loadOriginalExtendedNativeRegistry,nativeSemanticDefinitionEdges} from './original_native_semantic_definitions.mjs';
import {auditNativeDefinitionBodyClosure} from './audit_original_native_semantic_closure.mjs';

const raw={
  expression:'[]',expressionCount:0,
  m3GlobalFields:'[]',m3GlobalFieldCount:0,
  m3GlobalPulses:'[]',m3GlobalPulseCount:0,
  quadratic:'[]',monotone:'[]',picard:'[]'
};
const forced={length:0,variable:1,parameters:[1],
 matrix:[[0,0,0],[0,0,0],[0,0,0]],
 forcing:[{real:2,imaginary:0},{real:0,imaginary:2},{real:2,imaginary:2}]};
const aux={
 base:raw,expressions:0,fields:0,inverses:1,
 expressionDefinitions:'[]',fieldDefinitions:'[]',
 inverseDefinitions:JSON.stringify([{body:2,Y:[1,1],parameters:[1]}])
};
const captured={base:aux,counts:[1,0,0,1,0],
 definitions:JSON.stringify([
  [{id:'coupled-expression:0',body:3,parameters:[1]}],[],[],
  [forced],[]
 ])};
const graph={nodes:[
 {op:'rational',args:['1','1']},
 {op:'coordinate',args:['X']},
 {op:'exp',args:[1]},
 {op:'m3_aux_inverse_partial',args:[0,[1],[0]]},
 {op:'m3_coupled_expression_partial',args:['coupled-expression:0',[1],[0]]},
 {op:'actual_covariance_volterra',args:[0,0,1,[1]]},
 {op:'m3_forced_pulse_partial',args:[0,0,0,1,[1],[0]]},
 {op:'add',args:[4,6]},
 {op:'add',args:[7,5]}
],captureFunctionDefinitions:()=>({raw:true})};
async function scoped(roots){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-semantic-native-'));
 const owner={nodes:graph.nodes,captureFunctionDefinitions:()=>captured};
 await exportOriginalSourceGraph(graph,{dir,definitionGraph:owner,roots,
    scope:'FIRST_FIVEMAP_TOY',sourceCommit:'source-toy',pr30Commit:'pr-toy'});
 return {dir};
}
test('actual auxiliary Fourier source body and coupled function body are followed',async()=>{
 const r=loadOriginalExtendedNativeRegistry(captured);
 const f=nativeSemanticDefinitionEdges(graph.nodes[4],r);
 assert.deepEqual(f.bodyRoots,[3]);
 assert.equal(f.kind,'coupled_expression');
 const inv=nativeSemanticDefinitionEdges(graph.nodes[3],r);
 assert.deepEqual(inv.bodyRoots,[2]);
 assert.equal(inv.kind,'auxiliary_fourier_inverse');
});
test('native forced ODE requires full real matrix and complex forcing roots',async()=>{
 const r=loadOriginalExtendedNativeRegistry(captured);
 const f=nativeSemanticDefinitionEdges(graph.nodes[6],r);
 assert.equal(f.kind,'forced_ODE');
 assert.deepEqual(f.bodyRoots,[1,0,2]);
 assert.equal(f.odeVariationalBoundsVerified,false);
});
test('semantic graph expansion reaches hidden Fourier and ODE from physical roots',async()=>{
 const {dir}=await scoped([7]);
 try{
  const r=await auditNativeDefinitionBodyClosure(dir);
  assert.equal(r.source_node_count,9);
  assert.equal(r.semantic_body_reachable_unique_nodes,7);
  assert.equal(r.reached_native_calls_with_unresolved_definitions,0);
  assert.equal(r.reached_native_body_calls_with_source_definitions,3);
  assert.equal(r.native_definition_reachability_complete,true);
  assert.equal(r.original_root_semantic_body_usage[0].operations.find(o=>o.op==='m3_aux_inverse_partial').n,1);
  assert.equal(r.actual_final_67_jet_intervals_certified,0);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('Volterra system is reported as unresolved instead of presumed numeric',async()=>{
 const {dir}=await scoped([8]);
 try{
  const r=await auditNativeDefinitionBodyClosure(dir);
  assert.equal(r.semantic_body_reachable_unique_nodes,9);
  assert.equal(r.reached_native_calls_with_unresolved_definitions,1);
  assert.equal(r.native_definition_reachability_complete,false);
  assert.equal(r.unresolved_native_semantic_blockers[0].n,1);
  assert.equal(r.forced_ODE_Volterra_Fourier_infinite_calculations_certified,false);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('SHA-valid base-only graph remains insufficient for native semantic closure',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-native-base-only-'));
 try{
  await exportOriginalSourceGraph(graph,{dir,roots:[7],scope:'TOY',
    sourceCommit:'test',pr30Commit:'test'});
  await assert.rejects(()=>auditNativeDefinitionBodyClosure(dir),
    {code:'INVALID_EXTENDED_SEMANTIC_SOURCE_CLOSURE'});
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('a missing original definition is never replaced with arbitrary node zero',()=>{
 const altered=structuredClone(captured);
 const groups=JSON.parse(altered.definitions);groups[0][0].body=999;
 altered.definitions=JSON.stringify(groups);
 const r=loadOriginalExtendedNativeRegistry(altered);
 const d=nativeSemanticDefinitionEdges(graph.nodes[4],r);
 assert.deepEqual(d.bodyRoots,[999]);
});

test('indexed localSystem body and retained localBody must be the identical source definition',()=>{
 const changed=structuredClone(captured);
 changed.counts[1]=1;
 const groups=JSON.parse(changed.definitions);
 const row={localSystem:'coupled-expression:0',localBody:3,
   coefficient:0,values:[1],localParameters:[1],guards:[],derivativeMaps:[]};
 groups[1]=[{id:'coupled-field:0',parameters:[1],directions:[1],rows:[row]}];
 changed.definitions=JSON.stringify(groups);
 const r=loadOriginalExtendedNativeRegistry(changed);
 const call={op:'m3_coupled_indexed_partial',args:['coupled-field:0',[1],[0]]};
 const good=nativeSemanticDefinitionEdges(call,r);
 assert.equal(good.kind,'coupled_indexed');
 assert.deepEqual(good.bodyRoots,[1,3,0]);
 const forged=structuredClone(changed);const invalid=JSON.parse(forged.definitions);
 invalid[1][0].rows[0].localBody=2;forged.definitions=JSON.stringify(invalid);
 const s=loadOriginalExtendedNativeRegistry(forged);
 assert.throws(()=>nativeSemanticDefinitionEdges(call,s),{code:'NATIVE_REGISTRY_SEMANTIC_GAP'});
});

test('repeated native derivative calls reuse one defining-body expansion',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-native-cache-'));
 try{
  const duplicated={
   nodes:[...graph.nodes,
     {op:'m3_coupled_expression_partial',args:['coupled-expression:0',[1],[2]]},
     {op:'add',args:[7,9]}],
   captureFunctionDefinitions:()=>({raw:true})};
  const owner={nodes:duplicated.nodes,captureFunctionDefinitions:()=>captured};
  await exportOriginalSourceGraph(duplicated,{
    dir,definitionGraph:owner,roots:[10],scope:'FIRST_FIVEMAP_TOY',
    sourceCommit:'toy',pr30Commit:'toy'});
  const r=await auditNativeDefinitionBodyClosure(dir);
  assert.equal(r.source_unique_native_definition_keys_in_whole_graph,4);
  assert.equal(r.source_unique_reachable_native_definition_keys,3);
  assert.equal(r.reached_native_body_calls_with_source_definitions,4);
  assert.equal(r.semantic_body_reachable_unique_nodes,9);
  assert.equal(r.reached_native_calls_with_unresolved_definitions,0);
  assert.equal(r.native_source_body_expansion_cache_enabled,true);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});

test('source runtime covariance 2x2 matrix and normUpper resolve actual Volterra native body',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-native-original-covariance-'));
 try{
  const G={...graph,covarianceSystems:[{
   variable:1,parameters:[1],matrix:[[0,2],[2,0]],
   normUpper:0,length:1,initial:[0,1]}]};
  const owner={nodes:G.nodes,captureFunctionDefinitions:()=>captured};
  await exportOriginalSourceGraph(G,{dir,definitionGraph:owner,roots:[8],
    scope:'FIRST_FIVEMAP_TOY',sourceCommit:'toy',pr30Commit:'toy'});
  const r=await auditNativeDefinitionBodyClosure(dir);
  assert.equal(r.actual_covariance_runtime_source_registry_SHA_verified,true);
  assert.equal(r.actual_covariance_runtime_source_system_count,1);
  assert.equal(r.reached_native_calls_with_unresolved_definitions,0);
  assert.equal(r.reached_native_body_categories.source_covariance_volterra,1);
  assert.equal(r.native_definition_reachability_complete,true);
  assert.equal(r.actual_final_67_jet_intervals_certified,0);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('tampering original covariance source matrix fails independent SHA validation',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ms-native-cov-tamper-'));
 try{
  const G={...graph,covarianceSystems:[{
   variable:1,parameters:[1],matrix:[[0,2],[2,0]],
   normUpper:0,length:1,initial:[0,1]}]};
  await exportOriginalSourceGraph(G,{dir,
    definitionGraph:{nodes:G.nodes,captureFunctionDefinitions:()=>captured},
    roots:[8],scope:'FIRST_FIVEMAP_TOY',sourceCommit:'toy',pr30Commit:'toy'});
  await fs.writeFile(path.join(dir,'original-source-covariance-systems.json'),'[]\n');
  await assert.rejects(()=>auditNativeDefinitionBodyClosure(dir),
    {code:'UNTRUSTED_SOURCE_REPLAY'});
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
