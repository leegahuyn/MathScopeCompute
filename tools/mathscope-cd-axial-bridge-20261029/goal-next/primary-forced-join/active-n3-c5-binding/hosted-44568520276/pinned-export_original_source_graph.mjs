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
export async function exportOriginalSourceGraph(G,{dir,roots,scope,sourceCommit,pr30Commit,maxNodes=5000000,definitionGraph=G}={}){
 if(typeof dir!=='string'||!dir||!Array.isArray(roots)||!roots.length||
    !Number.isSafeInteger(G?.nodes?.length)||G.nodes.length>maxNodes||
    !roots.every(x=>Number.isSafeInteger(x)&&x>=0&&x<G.nodes.length&&G.nodes[x])||
    typeof scope!=='string'||!scope||typeof sourceCommit!=='string'||!sourceCommit||
    typeof pr30Commit!=='string'||!pr30Commit)
   fail('INVALID_ORIGINAL_GRAPH_EXPORT','Missing original roots/provenance or node budget exceeded');
 if(!definitionGraph||definitionGraph.nodes!==G.nodes)
     fail('WRONG_SOURCE_DEFINITION_OWNER','Replay owner must share the exact complete original G.nodes array');
 if(typeof definitionGraph.captureFunctionDefinitions!=='function')
     fail('MISSING_SOURCE_FUNCTION_DEFINITIONS','Original native function registry cannot be omitted');
 const defs=definitionGraph.captureFunctionDefinitions();
 if(definitionGraph!==G&&(!Array.isArray(defs?.counts)||defs.counts.length!==5||
    typeof defs.definitions!=='string'||!defs.base))
     fail('MISSING_COUPLED_NATIVE_DEFINITIONS','An extended source owner must capture nested auxiliary, coupled and forced definitions');

 if(defs===undefined)fail('MISSING_SOURCE_FUNCTION_DEFINITIONS','No replay without original definitions');
 // Serialize definitions BEFORE node export, avoiding incomplete exports on failure.
 const definitions=stable(defs);
 if(typeof definitions!=='string')fail('INVALID_SOURCE_DEFINITIONS','Not serializable');
 await fs.mkdir(dir,{recursive:true});
 const compressor=createGzip({level:3}),file=path.join(dir,'original-source-nodes.jsonl.gz');
 const pipe=pipeline(compressor,createWriteStream(file,{flags:'wx'})),digest=createHash('sha256');
 let bytes=0;const operationHistogram=Object.create(null);
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
     operationHistogram[n.op]=(operationHistogram[n.op]??0)+1;
     await write(n);
   }
   compressor.end();await pipe;
 }catch(e){compressor.destroy(e);try{await pipe}catch{};throw e}
 await fs.writeFile(path.join(dir,'original-source-functions.json'),definitions+'\n',{flag:'wx'});
 const manifest={schema:'MathScope.M3.SourceGraphReplayManifest/1',
   original_pr30_commit:pr30Commit,executing_commit:sourceCommit,
   scope,final_all_cycle_A_b_p:false,node_count:G.nodes.length,
   function_registry_capture_kind:definitionGraph===G?'RAW_BASE_ONLY':'EXTENDED_COUPLED_FACADE',
   extended_coupled_function_counts:definitionGraph===G?null:[...defs.counts],
   extended_coupled_registry_included:definitionGraph!==G,

   operation_histogram:Object.fromEntries(Object.entries(operationHistogram).sort(([a],[b])=>a.localeCompare(b))),
   original_root_ids:[...roots],node_stream_uncompressed_bytes:bytes,
   node_stream_sha256:digest.digest('hex'),
   definitions_sha256:createHash('sha256').update(definitions+'\n').digest('hex'),
   exact_source_node_stream_preserved:true,actual_final_67_jets_certified:0,
   all_order_math_proved:false,release:'HOLD'};
 await fs.writeFile(path.join(dir,'original-source-export-manifest.json'),stable(manifest)+'\n',{flag:'wx'});
 return manifest;
}