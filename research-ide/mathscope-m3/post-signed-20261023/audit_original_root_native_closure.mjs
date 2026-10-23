import {createReadStream,promises as fs} from 'node:fs';
import {createGunzip} from 'node:zlib';
import readline from 'node:readline';
import path from 'node:path';
import {exactOriginalSourceNodeChildren} from './exact_original_node_children.mjs';
import {auditOriginalSourceReplay} from './audit_original_source_graph_replay.mjs';

const abort=message=>{throw Object.assign(Error(message),{code:'INVALID_SOURCE_DEPENDENCY_CLOSURE'});};
const elementary=new Set(['rational','coordinate','add','multiply','inverse','integer_power']);
const originalRegisteredCalls=new Set([
 'actual_expression_partial','actual_background_picard','actual_background_even_profile',
 'actual_quadratic_root','actual_monotone_root','actual_covariance_volterra',
 'actual_pulse_jet_volterra','actual_pulse_sensitivity_volterra',
 'actual_pulse_third_jet_volterra','actual_n6_pulse_higher_jet_volterra'
]);
const isNativeOwner=(op)=>op.startsWith('m3_')||originalRegisteredCalls.has(op);
const bounded=new Set(['exp','log_positive','sqrt_positive']);
/**
 * Roots-to-leaves source-operation census without loading G.nodes objects.
 * This is NOT a source evaluator: exactOriginalSourceNodeChildren defines only
 * typed syntactic node dependencies, never a native function's value. Unknown
 * source-native operations halt rather than inventing an incomplete census.
 */
export async function auditRootReachableNativeOperations(dir,{maxNodes=5000000,maxEdges=30000000}={}){
 const provenance=await auditOriginalSourceReplay(dir);
 const m=JSON.parse(await fs.readFile(path.join(dir,'original-source-export-manifest.json'),'utf8'));
 if(m.final_all_cycle_A_b_p!==false||m.actual_final_67_jets_certified!==0)
   abort('This is not an original first-FiveMap source graph.');
 const systemIDs=new Map(),systemKeys=[''],nativeOwnerCode=new Uint32Array(m.node_count);
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
   if(isNativeOwner(obj.op)){
     const key=obj.op+'::'+JSON.stringify(obj.args[0]);
     if(!systemIDs.has(key)){systemIDs.set(key,systemKeys.length);systemKeys.push(key);}
     nativeOwnerCode[count]=systemIDs.get(key);
   }
   const children=exactOriginalSourceNodeChildren(obj);
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
 // Original nodes are topologically ordered: every referenced child < parent.
 // Reverse-propagate all root reachability as independent bits in one DAG pass.
 const roots=m.original_root_ids;
 if(roots.length>16)abort('At most sixteen original roots in one exact mask census');
 const masks=new Uint16Array(count);
 for(let i=0;i<roots.length;i++)masks[roots[i]]|=(1<<i);
 for(let i=count-1;i>=0;i--){
   const bits=masks[i];
   if(!bits)continue;
   for(let p=starts[i];p<starts[i+1];p++)masks[edges[p]]|=bits;
 }
 const byOp=Object.create(null),perRoot=roots.map(()=>Object.create(null));
 const ownerCounts=Object.create(null),byRootOwner=roots.map(()=>Object.create(null));
 let used=0;
 for(let i=0;i<count;i++){
   const bits=masks[i];if(!bits)continue;
   used++;
   const op=opNames[nodeOps[i]];
   byOp[op]=(byOp[op]??0)+1;
   const owner=nativeOwnerCode[i]?systemKeys[nativeOwnerCode[i]]:null;
   if(owner)ownerCounts[owner]=(ownerCounts[owner]??0)+1;
   for(let j=0;j<roots.length;j++){
     if(bits&(1<<j)){
       perRoot[j][op]=(perRoot[j][op]??0)+1;
       if(owner)byRootOwner[j][owner]=(byRootOwner[j][owner]??0)+1;
     }
   }
 }
 const sourceRoles=roots.length===11&&m.scope==='ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT_NOT_FINAL_A_b_p'?
    ['velocity_component_0','velocity_component_1','velocity_component_2',
     'full_pressure','full_divergence','PDE_residual_0','PDE_residual_1',
     'PDE_residual_2','direct_split_defect_0','direct_split_defect_1',
     'direct_split_defect_2']:roots.map((_,i)=>'source_root_'+i);
 const byRoot=perRoot.map((counts,i)=>({
   root_id:roots[i],role:sourceRoles[i],reachable_nodes:Object.values(counts).reduce((a,b)=>a+b,0),
   native_original_source_system_IDs:Object.entries(byRootOwner[i])
     .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
     .map(([source_id,n])=>({source_id,call_nodes:n})),
   operation_counts:Object.entries(counts)
     .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
     .map(([op,n])=>({op,n,category:
       op.includes('volterra')||op.includes('covariance')?'VOLTERRA':
       op.includes('inverse_partial')?'FOURIER_INVERSE':
       op.includes('pulse')||op.includes('picard')?'PULSE_ODE':
       elementary.has(op)?'ELEMENTARY':'OTHER_NATIVE'}))
 }));
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
   original_source_per_root_native_usage:byRoot,
   distinct_native_source_system_IDs_reached:Object.keys(ownerCounts).length,
   direct_reachable_source_system_ID_usage:Object.entries(ownerCounts)
      .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
      .map(([source_id,n])=>({source_id,call_nodes:n})),
   native_function_body_expansion_included_in_ID_counts:false,
   multiple_root_reachability_method:'SINGLE_REVERSE_TOPOLOGICAL_BITMASK_PASS',
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
