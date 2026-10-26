#!/usr/bin/env node
/** SHA-verified 11-physical-root monotone2 reachability via ALL native bodies.
 * Scope: original first-FiveMap source dependencies, NOT evaluated branches.
 * Crucial: syntactic 662 monotone2 source calls != semantic root frontier (2).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import {createGunzip} from 'node:zlib';
import {exactOriginalSourceNodeChildren} from '../post-signed-20261023/exact_original_node_children.mjs';
import {loadOriginalExtendedNativeRegistry,nativeSemanticDefinitionEdges} from '../post-signed-20261023/original_native_semantic_definitions.mjs';

const G='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269';
const F='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e';
const fail=m=>{throw Error('ORIGINAL_SEMANTIC_ROOT2_FRONTIER_MISMATCH: '+m)};
const check=(v,m)=>{if(!v)fail(m)};
export async function certifyOriginalReachableMonotone2(dir,{includeNaturalNodeIds=false}={}) {
 const mf=JSON.parse(fs.readFileSync(path.join(dir,'original-source-export-manifest.json'),'utf8'));
 const N=4420257;
 check(mf.node_count===N&&mf.node_stream_sha256===G&&mf.definitions_sha256===F&&
  mf.final_all_cycle_A_b_p===false&&mf.original_root_ids.length===11,
  'original first FiveMap manifest');
 const file=fs.readFileSync(path.join(dir,'original-source-functions.json'));
 check(crypto.createHash('sha256').update(file).digest('hex')===F,'native registry SHA');
 const registry=loadOriginalExtendedNativeRegistry(JSON.parse(file.toString('utf8')));
 const start=new Uint32Array(N+1);
 const childEdges=[];
 const nativeEdges=new Map();
 const cache=new Map();
 const names=[],opCodes=new Map(),opAt=new Uint8Array(N);
 const natural=[],monotone=[];
 const sha=crypto.createHash('sha256');
 const stream=readline.createInterface({input:fs.createReadStream(path.join(dir,'original-source-nodes.jsonl.gz')).pipe(createGunzip()),crlfDelay:Infinity});
 let i=0,header=false;
 for await(const line of stream) {
   sha.update(line+'\n');
   const n=JSON.parse(line);
   if(!header) {
     check(n.schema==='MathScope.M3.FullNodesJSONL/1'&&n.node_count===N,'graph header');
     header=true;continue;
   }
   check(i<N,'more source nodes than expected');
   const op=n.op;
   let code=opCodes.get(op);
   if(code===undefined) {code=names.length;opCodes.set(op,code);names.push(op);check(code<256,'too many source operations');}
   opAt[i]=code;
   start[i]=childEdges.length;
   for(const j of exactOriginalSourceNodeChildren(n)) {
     check(Number.isInteger(j)&&j>=0&&j<i,'invalid exact typed AST direct child');
     childEdges.push(j);
   }
   if(op==='actual_natural_series')natural.push(i);
   if(op==='actual_monotone_root'&&n.args[0]===2)
     monotone.push({node_id:i,Z_source_id:n.args[1],T_source_id:n.args[2]});
   if((op.startsWith('actual_')||op.startsWith('m3_'))&&op!=='actual_natural_series') {
     const key=op+'::'+JSON.stringify(n.args[0]);
     let d=cache.get(key);
     if(d===undefined) {
       d=nativeSemanticDefinitionEdges(n,registry);
       cache.set(key,d??null);
     }
     if(d?.resolved===true)nativeEdges.set(i,d.bodyRoots);
   }
   i++;
 }
 start[N]=childEdges.length;
 check(header&&i===N&&sha.digest('hex')===G,'original 4.42m graph SHA mismatch');
 check(childEdges.length===9749737,'original 9,749,737 AST edges changed');
 check(natural.length>=523&&monotone.length===662,'original source native inventories');
 const mask=new Uint16Array(N),queue=[];
 for(let j=0;j<11;j++) {
   const root=mf.original_root_ids[j];
   check(Number.isInteger(root)&&root>=0&&root<N,'bad physical root');
   const bit=1<<j;
   if(!(mask[root]&bit)){mask[root]|=bit;queue.push(root);}
 }
 let scanned=0;
 for(let k=0;k<queue.length;k++){
   const node=queue[k],bits=mask[node];
   const push=ch=>{
     check(Number.isInteger(ch)&&ch>=0&&ch<N,'out-of-source native dependency root');
     const next=mask[ch]|bits;
     if(next!==mask[ch]){mask[ch]=next;queue.push(ch);}
   };
   for(let e=start[node];e<start[node+1];e++)push(childEdges[e]);
   const bodies=nativeEdges.get(node);
   if(bodies)for(const ch of bodies)push(ch);
   if(queue.length>N*20)fail('native reachability did not stabilize');
   scanned++;
 }
 const reachedNatural=natural.filter(id=>mask[id]!==0);
 const reachedRoot2=monotone.filter(x=>mask[x.node_id]!==0).map(x=>({
   ...x,semantic_original_physical_root_mask:mask[x.node_id],
   Z_source_op:names[opAt[x.Z_source_id]],
   T_source_op:names[opAt[x.T_source_id]]
 }));
 let reachable=0;for(const m of mask)if(m)reachable++;
 check(reachable===159655,'original 159655 semantic reachable AST nodes mismatch');
 check(reachedNatural.length===523,'original 523 natural-series frontier mismatch');
 check(reachedRoot2.length===2,'source native root2 actual call frontier is not exactly two');
 check(JSON.stringify(reachedRoot2.map(x=>x.node_id))===JSON.stringify([622820,623935]),
   'original root2 source IDs changed');
 check(reachedRoot2.every(x=>x.semantic_original_physical_root_mask===2047),
   'original eleven physical roots root2 dependence has changed');
 check(reachedRoot2[0].Z_source_op==='coordinate'&&
       reachedRoot2[0].T_source_op==='coordinate'&&
       reachedRoot2[1].Z_source_op==='smooth_piecewise'&&
       reachedRoot2[1].T_source_op==='multiply',
       'two physically relevant root2 source argument op shapes drifted');
 return {
   schema:'MathScope.M3.Original11PhysicalRootsExactly2Monotone2SourceCalls/1',
   original_source_graph_sha256:G,original_source_native_registry_sha256:F,
   original_nodes:N,original_AST_edges:childEdges.length,
   original_physical_root_count:11,
   source_all_monotone_system2_AST_calls:monotone.length,
   source_actual_semantic_root_reachable_monotone2_calls:reachedRoot2.length,
   source_semantic_root_reachable_calls:reachedRoot2,
   original_reachable_AST_union_count:reachable,
   original_reachable_actual_natural_series_call_count:reachedNatural.length,
   ...(includeNaturalNodeIds?{
     original_reachable_natural_series_node_ids:reachedNatural,
     original_reachable_native_body_entry_roots:[...new Set(
       [...nativeEdges].filter(([id])=>mask[id]!==0).flatMap(([,bodies])=>bodies)
     )].sort((a,b)=>a-b),
     original_reachable_expression_call_node_ids:[...nativeEdges.keys()].filter(id=>mask[id]!==0&&
       ['actual_expression_partial','m3_aux_expression_partial','m3_coupled_expression_partial','m3_forced_expression_partial'].includes(names[opAt[id]]))
   }:{}),
   additional_semantic_native_registry_provenance:'EMBEDDED_GLOBAL_COVARIANCE_SOURCE_CROSSCHECK_ONLY_NOT_RUNTIME_OWNER_SEAL',
   semantic_reachability_is_not_actual_runtime_branch_selection:true,
   system2_two_real_Z_T_source_image_memberships_unconditionally_proved:0,
   native_monotone2_actual_root_to_call_domain_guards_globally_certified:false,
   original_523_natural_Y_certified:33,
   original_523_natural_Y_OPEN:490,
   actual_final_67_jets:0,M3:'62/64',M4:'0/16',release:'HOLD'
 };
}
if(import.meta.url===new URL('file://'+process.argv[1]).href){
 const [dir,out]=process.argv.slice(2);
 if(!dir||!out)fail('Usage: node script source_graph_directory output_json_file');
 const r=await certifyOriginalReachableMonotone2(dir);
 fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n');
 console.log(JSON.stringify(r,null,2));
}
