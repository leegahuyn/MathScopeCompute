import {createWriteStream,promises as fs} from 'node:fs';
import {createHash} from 'node:crypto';
import {createGzip} from 'node:zlib';
import {once} from 'node:events';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
/** Sequential full graph export. Scope is first FiveMap, NOT final A,b,p. */
const fail=(code,s)=>{throw Object.assign(new Error(s),{code})};
const stable=x=>JSON.stringify(x,(_,v)=>{
 if(typeof v==='bigint')return {__exact_bigint_decimal__:String(v)};
 if(v instanceof Map)return {__exact_map_entries__:[...v]};
 if(v instanceof Set)return {__exact_set_values__:[...v]};
 if(typeof v==='function'||typeof v==='symbol')fail('NON_SERIALIZABLE_SOURCE','Source runtime definition cannot be faithfully serialized');
 return v;});
export async function exportOriginalSourceGraph(G,{dir,roots,scope,sourceCommit,pr30Commit,maxNodes=5000000}={}){
 if(typeof dir!=='string'||!dir||!Array.isArray(roots)||!roots.length||
    !Number.isSafeInteger(G?.nodes?.length)||G.nodes.length>maxNodes||
    !roots.every(x=>Number.isSafeInteger(x)&&x>=0&&x<G.nodes.length&&G.nodes[x])||
    typeof scope!=='string'||!scope||typeof sourceCommit!=='string'||!sourceCommit||
    typeof pr30Commit!=='string'||!pr30Commit)
   fail('INVALID_ORIGINAL_GRAPH_EXPORT','Missing original roots/provenance or node budget exceeded');
 const defs=G.captureFunctionDefinitions?.();
 if(defs===undefined)fail('MISSING_SOURCE_FUNCTION_DEFINITIONS','No replay without original definitions');
 // Serialize definitions BEFORE node export, avoiding incomplete exports on failure.
 const definitions=stable(defs);
 if(typeof definitions!=='string')fail('INVALID_SOURCE_DEFINITIONS','Not serializable');
 await fs.mkdir(dir,{recursive:true});
 const compressor=createGzip({level:3}),file=path.join(dir,'original-source-nodes.jsonl.gz');
 const pipe=pipeline(compressor,createWriteStream(file,{flags:'wx'})),digest=createHash('sha256');
 let bytes=0;
 async function write(item){
   const line=stable(item)+'\n',buf=Buffer.from(line);
   digest.update(buf);bytes+=buf.length;
   if(!compressor.write(buf))await once(compressor,'drain');
 }
 try{
   await write({schema:'MathScope.M3.FullNodesJSONL/1',node_count:G.nodes.length});
   for(let i=0;i<G.nodes.length;i++){
     const n=G.nodes[i];
     if(!n||typeof n.op!=='string'||!Array.isArray(n.args))
       fail('INVALID_ORIGINAL_NODE','Missing source graph node '+i);
     await write(n);
   }
   compressor.end();await pipe;
 }catch(e){compressor.destroy(e);try{await pipe}catch{};throw e}
 await fs.writeFile(path.join(dir,'original-source-functions.json'),definitions+'\n',{flag:'wx'});
 const manifest={schema:'MathScope.M3.SourceGraphReplayManifest/1',
   original_pr30_commit:pr30Commit,executing_commit:sourceCommit,
   scope,final_all_cycle_A_b_p:false,node_count:G.nodes.length,
   original_root_ids:[...roots],node_stream_uncompressed_bytes:bytes,
   node_stream_sha256:digest.digest('hex'),
   definitions_sha256:createHash('sha256').update(definitions+'\n').digest('hex'),
   exact_source_node_stream_preserved:true,actual_final_67_jets_certified:0,
   all_order_math_proved:false,release:'HOLD'};
 await fs.writeFile(path.join(dir,'original-source-export-manifest.json'),stable(manifest)+'\n',{flag:'wx'});
 return manifest;
}