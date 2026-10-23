import {createReadStream,promises as fs} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createHash} from 'node:crypto';
import readline from 'node:readline';
import path from 'node:path';
const fail=s=>{throw Object.assign(Error(s),{code:'UNTRUSTED_SOURCE_REPLAY'})};
/** Streaming proof-boundary check; native ops inventoried, never evaluated or assigned zero. */
export async function auditOriginalSourceReplay(dir){
 const m=JSON.parse(await fs.readFile(path.join(dir,'original-source-export-manifest.json'),'utf8'));
 if(m.schema!=='MathScope.M3.SourceGraphReplayManifest/1'||
    m.exact_source_node_stream_preserved!==true||m.final_all_cycle_A_b_p!==false||
    m.actual_final_67_jets_certified!==0||!Array.isArray(m.original_root_ids))
   fail('First-FiveMap graph cannot be promoted to final source jets');
 const defs=await fs.readFile(path.join(dir,'original-source-functions.json'));
 if(createHash('sha256').update(defs).digest('hex')!==m.definitions_sha256)
   fail('Native function definitions changed');
 const captured=JSON.parse(defs.toString());
 const extended=m.function_registry_capture_kind==='EXTENDED_COUPLED_FACADE';
 if(extended){
   if(!Array.isArray(captured.counts)||captured.counts.length!==5||
      typeof captured.definitions!=='string'||!captured.base)
     fail('Captured native auxiliary/coupled/forced function namespaces missing');
   const lists=JSON.parse(captured.definitions);
   if(!Array.isArray(lists)||lists.length!==5||
      !lists.every((rows,j)=>Array.isArray(rows)&&rows.length===captured.counts[j]))
     fail('Captured native registry counts do not match their bodies');
   if(m.extended_coupled_registry_included!==true||
      JSON.stringify(m.extended_coupled_function_counts)!==JSON.stringify(captured.counts))
     fail('Native function manifest and recorded extended registries differ');
 }

 let covarianceSystemBodiesShaVerified=false,covarianceSystemCount=null;
 if(m.covariance_runtime_registry_included===true){
   const cov=await fs.readFile(path.join(dir,'original-source-covariance-systems.json'));
   if(createHash('sha256').update(cov).digest('hex')!==m.covariance_runtime_registry_sha256)
     fail('Original runtime covariance system archive SHA256 mismatch');
   const systems=JSON.parse(cov.toString());
   if(!Array.isArray(systems)||systems.length!==m.covariance_runtime_registry_count)
     fail('Original runtime covariance system registry size mismatch');
   for(const system of systems)
     if(!Number.isSafeInteger(system.variable)||!Array.isArray(system.parameters)||
       !Array.isArray(system.matrix)||system.matrix.length!==2||
       system.matrix.some(row=>!Array.isArray(row)||row.length!==2)||
       !Number.isSafeInteger(system.normUpper)||!Number.isSafeInteger(system.length))
        fail('Covariance system lacks original matrix, normUpper or length source roots');
   covarianceSystemBodiesShaVerified=true;covarianceSystemCount=systems.length;
 }else if(m.covariance_runtime_registry_included!==false&&
          m.covariance_runtime_registry_included!==undefined)
     fail('Malformed runtime covariance evidence flag');
 let n=0,expected=null,bytes=0;const ops={},hash=createHash('sha256');
 const input=readline.createInterface({input:createReadStream(path.join(dir,'original-source-nodes.jsonl.gz')).pipe(createGunzip()),crlfDelay:Infinity});
 for await(const line of input){
   const raw=Buffer.from(line+'\n');hash.update(raw);bytes+=raw.length;
   const a=JSON.parse(line);
   if(expected===null){
     expected=a.node_count;
     if(a.schema!=='MathScope.M3.FullNodesJSONL/1'||expected!==m.node_count)fail('Invalid original graph header');
     continue;
   }
   if(!a||typeof a.op!=='string'||!Array.isArray(a.args))fail('Malformed node '+n);
   ops[a.op]=(ops[a.op]??0)+1;n++;if(n>expected)fail('Unexpected appended source nodes');
 }
 if(n!==expected||bytes!==m.node_stream_uncompressed_bytes||hash.digest('hex')!==m.node_stream_sha256||
    !m.original_root_ids.every(x=>Number.isSafeInteger(x)&&x>=0&&x<n))
   fail('Source graph missing/modified or root IDs unbound');
 const canonicalOps=Object.fromEntries(Object.entries(ops).sort(([a],[b])=>a.localeCompare(b)));
 if(m.operation_histogram&&JSON.stringify(m.operation_histogram)!==JSON.stringify(canonicalOps))
   fail('Native operation inventory differs from the archived source graph');
 const elementary=new Set(['rational','coordinate','add','multiply','inverse','integer_power']);
 const requiresDedicatedValidatedNumerics=Object.entries(ops)
   .filter(([op])=>!elementary.has(op))
   .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 const complicated=Object.entries(ops).filter(([name])=>
   name.startsWith('m3_')||name.startsWith('actual_')||
   ['definite_integral','source_step_derivative','smooth_piecewise','source_parameter'].includes(name))
   .sort((a,b)=>b[1]-a[1]);
 return {schema:'MathScope.M3.SourceNumericKernelInventory/1',
   node_count:n,original_root_ids:m.original_root_ids,
   source_node_sha256:m.node_stream_sha256,
   function_registry_capture_kind:m.function_registry_capture_kind??'LEGACY_RAW_BASE_ONLY',
   extended_coupled_registry_sha256_verified:extended,
   native_extended_function_bodies_structurally_present:extended,
   covariance_runtime_registry_sha256_verified:covarianceSystemBodiesShaVerified,
   covariance_runtime_registry_system_count:covarianceSystemCount,

   actual_native_ODE_Fourier_function_values_evaluated:false,

   operation_histogram:canonicalOps,operators_requiring_dedicated_interval_interpreters:requiresDedicatedValidatedNumerics,
   requires_original_source_provenance:true,certified_final_numeric_kernels_assumed:0,
   operations_with_nontrivial_numeric_semantics:complicated,
   first_fivemap_source_serialized:true,final_all_cycle_A_b_p_serialized:false,
   final_67_numeric_certified:0,release:'HOLD'};
}