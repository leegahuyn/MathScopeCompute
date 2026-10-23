import path from 'node:path';
import {promises as fs} from 'node:fs';
import {auditOriginalSourceReplay} from './audit_original_source_graph_replay.mjs';
import {auditRootReachableNativeOperations} from './audit_original_root_native_closure.mjs';

/** Postprocess a COMPLETE checked source-graph archive, never a partial run log. */
export async function produceFirstFiveMapNativeOperatorReceipt(dir,{requireOriginal=false}={}){
 const m=JSON.parse(await fs.readFile(path.join(dir,'original-source-export-manifest.json'),'utf8'));
 if(requireOriginal&&(
    m.original_pr30_commit!=='a9b3a5b317525f6d0a71e2e356b054c9d25d2e60'||
    m.scope!=='ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT_NOT_FINAL_A_b_p'||
    m.original_root_ids?.length!==11||
    !Number.isSafeInteger(m.node_count)||m.node_count<4400000
 ))throw Object.assign(Error('Not the complete pinned original first-FiveMap source archive'),{code:'WRONG_ORIGINAL_SOURCE_ARCHIVE'});
 const full=await auditOriginalSourceReplay(dir);
 if(requireOriginal&&(
     full.function_registry_capture_kind!=='EXTENDED_COUPLED_FACADE'||
     full.native_extended_function_bodies_structurally_present!==true))
    throw Object.assign(Error('Original native function bodies missing despite valid graph hash'),{
      code:'MISSING_NATIVE_SOURCE_DEFINITIONS'});

 const census=await auditRootReachableNativeOperations(dir);
 if(full.node_count!==census.original_first_fivemap_graph_nodes||
   full.source_node_sha256!==census.source_stream_sha256||
   census.exact_original_operator_graph_digest_checked!==true)
   throw Error('Independent full-graph/reachable-root identity mismatch');
 const nativeKinds=census.operator_counts
   .filter(r=>r.evidence!=='ELEMENTARY_INTERVAL_KERNEL_TESTED_ONLY')
   .map(r=>({op:r.op,n:r.n,evidence:r.evidence}));
 const perRoot=census.original_source_per_root_native_usage.map(root=>({
   root_id:root.root_id,role:root.role,reachable_nodes:root.reachable_nodes,
   pulse_ode:root.operation_counts.filter(row=>row.category==='PULSE_ODE'),
   volterra:root.operation_counts.filter(row=>row.category==='VOLTERRA'),
   fourier_inverse:root.operation_counts.filter(row=>row.category==='FOURIER_INVERSE'),
   other_native:root.operation_counts.filter(row=>row.category==='OTHER_NATIVE'),
 }));
 return {schema:'MathScope.M3.ReplayRootNativeOperatorReceipt/1',
   original_pr30_commit:m.original_pr30_commit,
   executing_commit:m.executing_commit,
   source_node_sha256:m.node_stream_sha256,
   definitions_sha256:m.definitions_sha256,
   source_node_count:full.node_count,
   root_count:census.root_ids.length,
   root_usage:perRoot,
   native_operations_reachable_from_any_root:nativeKinds,
   first_blocking_native_operation_by_reachable_count:nativeKinds[0]?.op??null,
   complete_full_stream_SHA256_verified:true,
   captured_source_definitions_bytes_SHA256_verified:true,
   complete_extended_native_function_registry_SHA_verified:full.extended_coupled_registry_sha256_verified,
   native_function_definitions_semantically_evaluated:false,
   first_fivemap_only:true,final_all_iteration_fields_present:false,
   actual_original_final_67_jet_interval_count:0,release:'HOLD'};
}
if(process.argv[1]?.endsWith('/postprocess_original_full_graph.mjs')){
 if(process.argv.length!==4)throw Error('Usage: node postprocess_original_full_graph.mjs SOURCE_ARCHIVE_DIR OUTPUT_JSON');
 const receipt=await produceFirstFiveMapNativeOperatorReceipt(process.argv[2],{requireOriginal:true});
 await fs.writeFile(process.argv[3],JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({node_count:receipt.source_node_count,root_count:receipt.root_count,
   distinct_native_ops:receipt.native_operations_reachable_from_any_root.length,
   original_final67:0,release:'HOLD'}));
}