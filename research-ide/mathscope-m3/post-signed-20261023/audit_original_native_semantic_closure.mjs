import {createReadStream,promises as fs} from 'node:fs';
import {createGunzip} from 'node:zlib';
import readline from 'node:readline';
import path from 'node:path';
import {auditOriginalSourceReplay} from './audit_original_source_graph_replay.mjs';
import {exactOriginalSourceNodeChildren} from './exact_original_node_children.mjs';
import {loadOriginalExtendedNativeRegistry,nativeSemanticDefinitionEdges} from './original_native_semantic_definitions.mjs';

const halt=(message)=>{throw Object.assign(new Error(message),{code:'INVALID_EXTENDED_SEMANTIC_SOURCE_CLOSURE'})};
function category(op){
 if(op.includes('volterra')||op.includes('covariance'))return 'VOLTERRA';
 if(op.includes('inverse_partial'))return 'FOURIER_INVERSE';
 if(op.includes('pulse')||op.includes('picard'))return 'ODE_PULSE';
 if(op.includes('indexed_partial'))return 'INDEXED_FIELD';
 if(op.includes('expression_partial'))return 'EXPRESSION_BODY';
 if(op==='definite_integral')return 'INTEGRAL';
 return 'OTHER';
}
/** Source-owned native body roots are added to ordinary AST dependencies.
 * This computes structural source-body reachability only, NOT materialized
 * higher derivatives, actual smoothness, Fourier limits or numerical values.
 * A native call with no verified definition is counted as a BLOCKER.
 */
export async function auditNativeDefinitionBodyClosure(dir,{maxNodes=5000000,maxEdges=30000000,maxBodyEdges=1000000}={}){
 const manifest=JSON.parse(await fs.readFile(path.join(dir,'original-source-export-manifest.json'),'utf8'));
 const integrity=await auditOriginalSourceReplay(dir);
 if(integrity.function_registry_capture_kind!=='EXTENDED_COUPLED_FACADE'||
    !integrity.extended_coupled_registry_sha256_verified)
    halt('SHA-valid base-only registry cannot support native body reachability');
 const defs=JSON.parse(await fs.readFile(path.join(dir,'original-source-functions.json'),'utf8'));
 const runtimeCovariance=integrity.covariance_runtime_registry_sha256_verified?
     JSON.parse(await fs.readFile(path.join(dir,'original-source-covariance-systems.json'),'utf8')):null;
 const registry=loadOriginalExtendedNativeRegistry(defs,{runtimeCovarianceSystems:runtimeCovariance});
 const count=manifest.node_count;
 if(!Number.isSafeInteger(count)||count<1||count>maxNodes||
    manifest.original_root_ids.length<1||manifest.original_root_ids.length>16)
    halt('Original source node and root budgets exceeded');
 const starts=new Uint32Array(count+1),edges=[],
   opIds=new Uint16Array(count),opNames=[],opIndex=new Map();
 const bodyByNode=new Map(),missingByNode=new Map(),cachedNativeDefinitions=new Map(),cacheKeyByNode=new Map();
 let n=0,header=false,bodyEdges=0;
 const lines=readline.createInterface({input:createReadStream(path.join(dir,'original-source-nodes.jsonl.gz')).pipe(createGunzip()),crlfDelay:Infinity});
 for await(const line of lines){
   const item=JSON.parse(line);
   if(!header){header=true;if(item.node_count!==count)halt('Original native graph header mismatch');continue}
   if(n>=count)halt('Too many original nodes');
   for(const child of exactOriginalSourceNodeChildren(item)){
     if(!Number.isSafeInteger(child)||child<0||child>=n)
       halt('Non-topological syntactic source child '+child+' of node '+n);
     edges.push(child);
   }
   if(edges.length>maxEdges)halt('Source expression child budget exhausted');
   starts[n+1]=edges.length;
   if(!opIndex.has(item.op)){
     if(opNames.length>=65535)halt('Native operation type budget exceeded');
     opIndex.set(item.op,opNames.length);opNames.push(item.op)
   }
   opIds[n]=opIndex.get(item.op);
   if(item.op.startsWith('m3_')||item.op.startsWith('actual_')){
     const cacheKey=item.op+':'+JSON.stringify(item.args[0]);
     cacheKeyByNode.set(n,cacheKey);
     const newlySeen=!cachedNativeDefinitions.has(cacheKey);
     const def=newlySeen?nativeSemanticDefinitionEdges(item,registry):
       cachedNativeDefinitions.get(cacheKey);
     if(newlySeen)cachedNativeDefinitions.set(cacheKey,def);
     if(!def||def.resolved!==true){
       missingByNode.set(n,{op:item.op,system:item.args[0],
         reason:def?.blocker??'No source-owned semantic defining-body implementation'});
     }else{
       for(const root of def.bodyRoots){
         if(!Number.isSafeInteger(root)||root<0||root>=count)
           halt('Native definition contains invalid source root '+root);
       }
       if(newlySeen)bodyEdges+=def.bodyRoots.length;
       if(bodyEdges>maxBodyEdges)halt('Unique native definition body edge budget exhausted');
       bodyByNode.set(n,{kind:def.kind,roots:def.bodyRoots});
     }
   }
   n++;
 }
 if(n!==count)halt('Source DAG stream truncated');
 const roots=manifest.original_root_ids;
 const mask=new Uint16Array(count),queue=[];let front=0,work=0;
 for(let j=0;j<roots.length;j++){
   const root=roots[j];if(!Number.isSafeInteger(root)||root<0||root>=count)halt('Invalid original root');
   const bit=1<<j;if((mask[root]&bit)===0){mask[root]|=bit;queue.push(root)}
 }
 while(front<queue.length){
   const i=queue[front++],bits=mask[i];
   const visit=(id)=>{const next=mask[id]|bits;if(next!==mask[id]){mask[id]=next;queue.push(id)}};
   for(let k=starts[i];k<starts[i+1];k++)visit(edges[k]);
   const def=bodyByNode.get(i);
   if(def)for(const id of def.roots)visit(id);
   if(++work>count*17)halt('Excessive semantic graph propagation');
 }
 const union=Object.create(null),perRoot=roots.map(()=>Object.create(null)),
   missing=Object.create(null),byKind=Object.create(null),reachedDefinitionKeys=new Set();
 let reachable=0,expandedNativeCalls=0,unresolvedCalls=0,reachedUniqueBodyEdges=0;
 for(let i=0;i<count;i++){
   const bits=mask[i];if(!bits)continue;
   reachable++;
   const op=opNames[opIds[i]];
   union[op]=(union[op]??0)+1;
   for(let j=0;j<roots.length;j++)if(bits&(1<<j))
     perRoot[j][op]=(perRoot[j][op]??0)+1;
   const def=bodyByNode.get(i);
   if(def){
     expandedNativeCalls++;
     byKind[def.kind]=(byKind[def.kind]??0)+1;
     const key=cacheKeyByNode.get(i);
     if(!reachedDefinitionKeys.has(key)){
       reachedDefinitionKeys.add(key);
       reachedUniqueBodyEdges+=def.roots.length;
     }
   }
   const unresolved=missingByNode.get(i);
   if(unresolved){
     unresolvedCalls++;
     const key=unresolved.op+' ['+unresolved.reason+']';
     missing[key]=(missing[key]??0)+1;
   }
 }
 const format=(counts)=>Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
   .map(([op,n])=>({op,n,category:category(op)}));
 const rootRoles=roots.length===11&&manifest.scope==='ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT_NOT_FINAL_A_b_p'?
  ['u0','u1','u2','p','divergence','R0','R1','R2','direct_split_defect0','direct_split_defect1','direct_split_defect2']:
  roots.map((_,j)=>'root_'+j);
 return {schema:'MathScope.M3.NativeBodySemanticDependencyCensus/1',
   verified_graph_SHA256:integrity.source_node_sha256,
   verified_function_registry_SHA256:manifest.definitions_sha256,
   original_pr30_commit:manifest.original_pr30_commit,
   source_node_count:count,root_count:roots.length,
   native_registry_counts:registry.counts,
   actual_covariance_runtime_source_registry_SHA_verified:integrity.covariance_runtime_registry_sha256_verified,
   actual_covariance_runtime_source_system_count:integrity.covariance_runtime_registry_system_count,
   semantic_body_reachable_unique_nodes:reachable,
   syntactic_and_native_body_union_operations:format(union),
   source_native_body_extra_edges_constructed:bodyEdges,
   source_unique_native_definition_keys_in_whole_graph:cachedNativeDefinitions.size,
   source_unique_reachable_native_definition_keys:reachedDefinitionKeys.size,
   source_native_unique_body_edges_reached:reachedUniqueBodyEdges,
   native_source_body_expansion_cache_enabled:true,
   reached_native_body_calls_with_source_definitions:expandedNativeCalls,
   reached_native_calls_with_unresolved_definitions:unresolvedCalls,
   reached_native_body_categories:byKind,
   unresolved_native_semantic_blockers:format(missing),
   original_root_semantic_body_usage:perRoot.map((c,j)=>({
      root_id:roots[j],role:rootRoles[j],
      structurally_reachable_nodes:Object.values(c).reduce((a,b)=>a+b,0),
      operations:format(c)})),
   native_definition_reachability_complete:unresolvedCalls===0,
   native_derivative_orders_materialized_and_proved:false,
   native_substitution_semantics_independently_proved:false,
   forced_ODE_Volterra_Fourier_infinite_calculations_certified:false,
   final_all_iteration_A_b_p_built:false,actual_final_67_jet_intervals_certified:0,
   scope:'RETAINED_NATIVE_BODY_DEPENDENCY_CENSUS_NOT_MATHEMATICAL_OR_NUMERICAL_PROOF',
   release:'HOLD'};
}
