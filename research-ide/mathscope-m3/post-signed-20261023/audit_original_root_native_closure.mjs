import {createReadStream,promises as fs} from 'node:fs';
import {createGunzip} from 'node:zlib';
import readline from 'node:readline';
import path from 'node:path';
import {coupledExpressionChildren} from '../navier/source-coupled-expressions.mjs';
import {auditOriginalSourceReplay} from './audit_original_source_graph_replay.mjs';

const abort=message=>{throw Object.assign(Error(message),{code:'INVALID_SOURCE_DEPENDENCY_CLOSURE'});};
const elementary=new Set(['rational','coordinate','add','multiply','inverse','integer_power']);
const bounded=new Set(['exp','log_positive','sqrt_positive']);
/**
 * Roots-to-leaves source-operation census without loading G.nodes objects.
 * This is NOT a source evaluator: coupledExpressionChildren defines only
 * syntactic node dependency references, never the native function value.
 */
export async function auditRootReachableNativeOperations(dir,{maxNodes=5000000,maxEdges=30000000}={}){
 const provenance=await auditOriginalSourceReplay(dir);
 const m=JSON.parse(await fs.readFile(path.join(dir,'original-source-export-manifest.json'),'utf8'));
 if(m.final_all_cycle_A_b_p!==false||m.actual_final_67_jets_certified!==0)
   abort('This is not an original first-FiveMap source graph.');
 const idByOp=new Map(),opNames=[],nodeOps=new Uint16Array(m.node_count),
   starts=new Uint32Array(m.node_count+1),edges=[];
 let count=0,seenHeader=false;
 const stream=readline.createInterface({input:createReadStream(path.join(dir,'original-source-nodes.jsonl.gz')).pipe(createGunzip()),crlfDelay:Infinity});
 for await(const line of stream){
   const obj=JSON.parse(line);
   if(!seenHeader){
     seenHeader=true;if(obj.node_count!==m.node_count)abort('Original node count changed');
     continue;
   }
   if(count>=m.node_count)abort('Original nodes overrun');
   if(!idByOp.has(obj.op)){
     if(opNames.length>=65535)abort('Too many source operator kinds');
     idByOp.set(obj.op,opNames.length);opNames.push(obj.op);
   }
   nodeOps[count]=idByOp.get(obj.op);
   const children=coupledExpressionChildren(obj);
   if(!Array.isArray(children))abort('Original source child extractor returned no array');
   for(const child of children){
     if(!Number.isSafeInteger(child)||child<0||child>=count)
       abort('Non-topological source child: node '+count+' op '+obj.op+' child '+child);
     edges.push(child);
   }
   if(edges.length>maxEdges||count>=maxNodes)abort('Bounded source graph resource limit');
   starts[count+1]=edges.length;count++;
 }
 if(count!==m.node_count)abort('Original node stream incomplete');
 // Source closure from roots. This identifies reachable operation *kinds* only.
 const visited=new Uint8Array(count),stack=[...m.original_root_ids],byOp=Object.create(null);
 let used=0;
 while(stack.length){
   const i=stack.pop();
   if(visited[i])continue;
   visited[i]=1;used++;
   const op=opNames[nodeOps[i]];
   byOp[op]=(byOp[op]??0)+1;
   for(let p=starts[i];p<starts[i+1];p++){
     if(!visited[edges[p]])stack.push(edges[p]);
   }
 }
 const catalog=Object.entries(byOp).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 const opaqueDefinitionNodes=catalog
   .filter(([op])=>op.startsWith('m3_')||op.startsWith('actual_')||op==='source_parameter')
   .map(([op,n])=>({op,n,requiresCaptureFunctionDefinitionsOrParameterGraph:true}));
 const unsupported=catalog.filter(([op])=>!elementary.has(op));
 const notGuaranteed=catalog.filter(([op])=>!elementary.has(op)&&!bounded.has(op));
 return {schema:'MathScope.M3.RootReachableNativeOperationBacklog/1',
   original_pr30_commit:m.original_pr30_commit,source_stream_sha256:m.node_stream_sha256,
   original_first_fivemap_graph_nodes:count,reachable_nodes:used,
   unreachable_nodes:count-used,root_ids:[...m.original_root_ids],
   operator_counts:catalog.map(([op,n])=>({op,n,
     evidence:elementary.has(op)?'ELEMENTARY_INTERVAL_KERNEL_TESTED_ONLY':
      bounded.has(op)?'BOUNDED_ARGUMENT_INTERVAL_KERNEL_ONLY':
      'ACTUAL_ORIGINAL_NUMERICAL_KERNEL_UNVERIFIED'})),
   reachable_non_elementary_nodes:unsupported.reduce((s,[,n])=>s+n,0),
   opaque_native_definition_dependencies:opaqueDefinitionNodes,
   native_definition_semantic_dependencies_traversed:false,
   syntactic_root_closure_only:true,
   reachable_native_operator_kinds_without_validated_generic_interval_value:notGuaranteed.map(([op,n])=>({op,n})),
   actual_final_all_cycle_A_b_p_present:false,actual_final_67_numeric_intervals_certified:0,
   exact_original_operator_graph_digest_checked:provenance.source_node_sha256===m.node_stream_sha256,
   status:'DEPENDENCY_INVENTORY_NOT_NUMERIC_PROOF',release:'HOLD'};
}
