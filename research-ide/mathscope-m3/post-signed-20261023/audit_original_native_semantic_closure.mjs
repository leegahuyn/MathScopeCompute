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
 const naturalSeriesByNode=new Map();
 const earlyOriginalSourceNodes=[];
 const EARLY_Y_INSPECTION_LIMIT=70000;
 let n=0,header=false,bodyEdges=0;
 const lines=readline.createInterface({input:createReadStream(path.join(dir,'original-source-nodes.jsonl.gz')).pipe(createGunzip()),crlfDelay:Infinity});
 for await(const line of lines){
   const item=JSON.parse(line);
   if(!header){header=true;if(item.node_count!==count)halt('Original native graph header mismatch');continue}
   if(n>=count)halt('Too many original nodes');
   if(n<EARLY_Y_INSPECTION_LIMIT)earlyOriginalSourceNodes[n]=item;
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
   if(item.op==='actual_natural_series'){
     const [component,Y,eta,k,m]=item.args;
     if(!['Phi','u','average'].includes(component)||
        !Number.isSafeInteger(Y)||!Number.isSafeInteger(eta)||
        !Number.isSafeInteger(k)||k<0||!Number.isSafeInteger(m)||m<0)
        halt('Malformed native actual natural-series source call at '+n);
     naturalSeriesByNode.set(n,{component,Y,eta,radialOrder:k,etaOrder:m});
   }
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
 const naturalComponents=Object.create(null),naturalOrders=Object.create(null),
       naturalArgumentPairs=new Map();
 const union=Object.create(null),perRoot=roots.map(()=>Object.create(null)),
   missing=Object.create(null),byKind=Object.create(null),reachedDefinitionKeys=new Set();
 let reachable=0,expandedNativeCalls=0,unresolvedCalls=0,reachedUniqueBodyEdges=0;
 for(let i=0;i<count;i++){
   const bits=mask[i];if(!bits)continue;
   reachable++;
   const op=opNames[opIds[i]];
   if(op==='actual_natural_series'){
     const a=naturalSeriesByNode.get(i);
     if(!a)halt('Natural source tuple lost from actual graph');
     naturalComponents[a.component]=(naturalComponents[a.component]??0)+1;
     const key=a.radialOrder+','+a.etaOrder;
     naturalOrders[key]=(naturalOrders[key]??0)+1;
     const pairKey=a.Y+','+a.eta;
     if(!naturalArgumentPairs.has(pairKey))
       naturalArgumentPairs.set(pairKey,{Y_node_id:a.Y,eta_node_id:a.eta,
          source_call_nodes:0,component_counts:Object.create(null),
          derivative_orders:Object.create(null)});
     const pair=naturalArgumentPairs.get(pairKey);
     pair.source_call_nodes++;
     pair.component_counts[a.component]=(pair.component_counts[a.component]??0)+1;
     pair.derivative_orders[key]=(pair.derivative_orders[key]??0)+1;
   }
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
   embedded_source_covariance_definition_crosschecked:registry.covarianceProvenance===
     'EMBEDDED_ORIGINAL_DEFINITION_CROSSCHECKED_NOT_RUNTIME_SHA_VERIFIED',
   covariance_definition_provenance:registry.covarianceProvenance,
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
   original_reachable_natural_series_source_profile:{
     original_56_input_pairs:[...naturalArgumentPairs.values()].map(pair=>{
       const Y=earlyOriginalSourceNodes[pair.Y_node_id],
             eta=earlyOriginalSourceNodes[pair.eta_node_id];
       if(!Y||!eta)halt('Original Y/eta argument exceeds preserved source shape cache');
       let actualOriginalYUpper5Proved=false,actualOriginalYExactValue=null;
       if(Y.op==='rational'&&Y.args.length===2){
         const numerator=BigInt(Y.args[0]),denominator=BigInt(Y.args[1]);
         if(denominator===0n)halt('Actual source Y rational denominator zero');
         actualOriginalYUpper5Proved=denominator>0n?
           numerator>=0n&&numerator<=5n*denominator:
           numerator<=0n&&numerator>=5n*denominator;
         actualOriginalYExactValue=Y.args.join('/');
       }
       return {...pair,Y_source_node:{op:Y.op,args:Y.args},
         eta_source_node:{op:eta.op,args:eta.args},
         source_Y_bound_0_to_5_proved_by_AST:actualOriginalYUpper5Proved,
         source_Y_exact_rational:actualOriginalYExactValue,
         eta_common_complex_domain_proved:false,
         component_calls_total:Object.values(pair.component_counts).reduce((a,b)=>a+b,0)};
     }).sort((a,b)=>b.source_call_nodes-a.source_call_nodes||a.Y_node_id-b.Y_node_id),
     direct_exact_Y_upper5_source_call_count:[...naturalArgumentPairs.values()].reduce((total,pair)=>{
       const Y=earlyOriginalSourceNodes[pair.Y_node_id];
       if(!Y||Y.op!=='rational')return total;
       const n=BigInt(Y.args[0]),d=BigInt(Y.args[1]);
       if(d===0n)halt('Original source rational zero denominator');
       return total+((d>0n?n>=0n&&n<=5n*d:n<=0n&&n>=5n*d)?pair.source_call_nodes:0);
     },0),
     source_input_provenance:'FIRST_FIVEMAP_ARCHIVE_SHA_BOUND_Y_COORDINATE_SHAPES_NOT_FINAL_A_b_p',
     total_reachable_calls:Object.values(naturalComponents).reduce((a,b)=>a+b,0),
     counts_by_component:naturalComponents,
     derivative_orders:Object.entries(naturalOrders).sort((a,b)=>b[1]-a[1])
       .map(([k,n])=>({radialOrder:Number(k.split(',')[0]),etaOrder:Number(k.split(',')[1]),calls:n})),
     max_radial_order:Math.max(0,...Object.keys(naturalOrders).map(k=>Number(k.split(',')[0]))),
     max_eta_order:Math.max(0,...Object.keys(naturalOrders).map(k=>Number(k.split(',')[1]))),
     distinct_source_Y_eta_argument_node_pairs:naturalArgumentPairs.size,
     source_coefficient_norm_proved:false,source_uniform_analytic_domain_proved:false,
     source_fourier_or_series_numeric_value_proved:false,
     original_final_67_certified:0
   },
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
