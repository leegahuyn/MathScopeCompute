/** All-original-native-definition structural guard coverage for 114 source X calls.
 * Important: CONDITIONAL source branch theorem, NOT actual root-to-call
 * substitution proof, complex eta domain, 523 Y certificates or final 67 jets.
 *
 * Reuses the repository's original nativeSemanticDefinitionEdges code rather
 * than inventing an independent interpretation of any system IDs.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createGunzip} from 'node:zlib';
import readline from 'node:readline';
import {exactOriginalSourceNodeChildren} from './exact_original_node_children.mjs';
import {loadOriginalExtendedNativeRegistry,nativeSemanticDefinitionEdges} from './original_native_semantic_definitions.mjs';

const GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269';
const REGISTRY='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e';
const Y_X = new Map([[4757,4756],[6945,6944],[25063,6944],[32495,32469],
                     [33412,33411],[50907,6944],[54061,33411],[56747,56721]]);
const SOURCE_SAFE_BOUNDS=new Set([3617,3624,3627]);
const fail = m=>{throw Error('UNPROVED_OR_UNAUTHENTICATED_SOURCE_GUARD: '+m)};

export function conditionalNodeMask(node,childMasks,naturalBit,byX){
  if(node.op==='smooth_piecewise'){
    if(!Array.isArray(node.args)||node.args.length!==6||childMasks.length!==6)
      fail('Expected real six-argument original smooth_piecewise');
    const masks=childMasks.slice();
    const [x,left,right]=node.args;
    const eligible=byX.get(x)??0n;
    // When a selected BEFORE/INSIDE branch has x within one of the
    // SHA-proved local positive-X upper limits, the source's Y=Lambda*x
    // (or pinned exp(log_positive(x/Xa))) is <5, conditional on x>=0,
    // selected arm, exact alias and valid logarithm arguments.
    if(SOURCE_SAFE_BOUNDS.has(left)) masks[3]&=~eligible;
    if(SOURCE_SAFE_BOUNDS.has(right)) masks[4]&=~eligible;
    return masks.reduce((sum,b)=>sum|b,naturalBit);
  }
  return childMasks.reduce((sum,b)=>sum|b,naturalBit);
}

export async function auditOriginalAllNativeGuardCoverage(dir,ledgerFile,firstArmFile){
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'original-source-export-manifest.json'),'utf8'));
  if(manifest.node_stream_sha256!==GRAPH||manifest.definitions_sha256!==REGISTRY
     ||manifest.node_count!==4420257||manifest.final_all_cycle_A_b_p!==false
     ||manifest.original_root_ids.length!==11) fail('Original first-FiveMap manifest provenance');
  const ledger=JSON.parse(fs.readFileSync(ledgerFile,'utf8'));
  if(ledger.schema!=='MathScope.M3.Original114NaturalASTNodeLedger/1'
     ||ledger.original_graph_sha256!==GRAPH||ledger.actual_source_call_nodes.length!==114
     ||ledger.source_114_node_inventory_verified_against_full_original_AST!==true)
    fail('Verified individual 114 natural-series nodes missing');
  const first=JSON.parse(fs.readFileSync(firstArmFile,'utf8'));
  if(first.schema!=='MathScope.M3.Original114SelectedFirstArmConditionalY5/1'
     ||first.original_graph_sha256!==GRAPH
     ||first.all_first_syntactic_arms_local_conditional_Y_le_5!==114
     ||first.every_native_root_to_call_path_dominance_proved!==false)
    fail('Original 114 local-first-arm source theorem missing');
  const targetNodes=ledger.actual_source_call_nodes;
  const bitByNode=new Map(),byX=new Map();
  for(let k=0;k<targetNodes.length;k++){
    const row=targetNodes[k],coord=Y_X.get(row.Y_node_id),bit=1n<<BigInt(k);
    if(coord===undefined||bitByNode.has(row.node_id))fail('Unrecognized Y source coordinate');
    bitByNode.set(row.node_id,bit);
    byX.set(coord,(byX.get(coord)??0n)|bit);
  }
  const raw=fs.readFileSync(path.join(dir,'original-source-functions.json'));
  if(crypto.createHash('sha256').update(raw).digest('hex')!==REGISTRY)
    fail('Actual native body registry differs from source archive');
  const registry=loadOriginalExtendedNativeRegistry(JSON.parse(raw.toString('utf8')));
  const masks=new Array(manifest.node_count);
  const nativeDefinitions=new Map();
  let observedNatural=0,visited=0;
  const hash=crypto.createHash('sha256');
  const stream=readline.createInterface({
    input:fs.createReadStream(path.join(dir,'original-source-nodes.jsonl.gz')).pipe(createGunzip()),
    crlfDelay:Infinity
  });
  let seenHeader=false;
  for await(const line of stream){
    hash.update(line+'\n');
    const item=JSON.parse(line);
    if(!seenHeader){
      if(item.schema!=='MathScope.M3.FullNodesJSONL/1'||item.node_count!==manifest.node_count)
        fail('Corrupt source stream header');
      seenHeader=true;continue;
    }
    const i=visited++;
    if(i>=masks.length)fail('Original source node budget exceeded');
    const children=exactOriginalSourceNodeChildren(item);
    const childMasks=children.map(j=>{
      if(!Number.isSafeInteger(j)||j<0||j>=i)fail('Invalid topological original child');
      return masks[j];
    });
    const naturalBit=bitByNode.get(i)??0n;
    if(naturalBit){
      if(item.op!=='actual_natural_series'||!Y_X.has(item.args[1]))
        fail('Original 114 natural source position changed');
      observedNatural++;
    }
    masks[i]=conditionalNodeMask(item,childMasks,naturalBit,byX);
    if((item.op.startsWith('actual_')||item.op.startsWith('m3_'))&&item.op!=='actual_natural_series'){
      const key=item.op+':'+JSON.stringify(item.args[0]);
      if(!nativeDefinitions.has(key)){
        const def=nativeSemanticDefinitionEdges(item,registry);
        nativeDefinitions.set(key,{
          op:item.op,system:item.args[0],resolved:def?.resolved===true,
          root_ids:def?.bodyRoots??[],blocker:def?.blocker??null
        });
      }
    }
  }
  if(visited!==manifest.node_count||hash.digest('hex')!==GRAPH||observedNatural!==114)
    fail('Original source AST stream SHA/length/114 inventory mismatch');
  const coveredR=manifest.original_root_ids.every(i=>masks[i]===0n);
  const uncovered=[],unresolved=[];
  for(const [key,def] of nativeDefinitions){
    if(!def.resolved){unresolved.push({key,blocker:def.blocker});continue}
    let bits=0n;
    for(const r of def.root_ids){
      if(!Number.isSafeInteger(r)||r<0||r>=masks.length)
        fail('Original native definition contains foreign AST root');
      bits|=masks[r];
    }
    if(bits){
      const naturalIds=targetNodes.filter((row,k)=>Boolean(bits & (1n<<BigInt(k)))).map(row=>row.node_id);
      uncovered.push({source_native_system:key,original_uncovered_natural_ids:naturalIds});
    }
  }
  // The native semantic resolver validates each source-definition root but
  // does NOT certify runtime argument bindings, strict x>=0, log branch,
  // derivative junction matches, analytic extension or convergence.
  const conditionalStructural=coveredR&&uncovered.length===0&&unresolved.length===0;
  return {
    schema:'MathScope.M3.OriginalAllNativeBodyConditionalFirstFiveMap114GuardCoverage/1',
    source_graph_sha256:GRAPH,source_registry_sha256:REGISTRY,
    original_first_FiveMap_AST_nodes:visited,
    original_11_root_direct_AST_residual_unprotected_masks_zero:coveredR,
    original_global_native_system_id_count:nativeDefinitions.size,
    original_native_body_definitions_unresolved:unresolved,
    original_native_body_definitions_with_unprotected_structural_calls:uncovered,
    original_114_selected_source_guard_coverage_conditional:conditionalStructural,
    conditional_source_guard_count:114,
    safe_guard_interval_nodes:[...SOURCE_SAFE_BOUNDS],
    required_hypotheses:['selected arm of every actual runtime path',
       'native argument and parameter substitution preserves symbolic x and Lambda',
       'all before-arm original coordinates satisfy x>=0',
       'positive log arguments and correct exp(log_positive) branches',
       'piecewise differentiation requires matching boundary jets'],
    native_runtime_argument_substitution_certified:false,
    all_root_to_call_semantic_execution_paths_certified:false,
    common_complex_eta_domain_and_Brho_norm_certified:false,
    original_114_Y_upper_bound_newly_certified:0,
    original_523_Y_bound_certified:33,
    original_523_Y_bound_OPEN:490,
    original_67_final_physical_jet_intervals_certified:0,
    M3:'62/64',M4:'0/16',release:'HOLD'
  };
}

if(import.meta.url === new URL('file://'+process.argv[1]).href){
 const [dir,ledger,first,out]=process.argv.slice(2);
 if(!dir||!ledger||!first||!out)fail('usage: node script graph_dir ledger_file first_114_file receipt_output');
 const receipt=await auditOriginalAllNativeGuardCoverage(dir,ledger,first);
 fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({
  native_system_ids:receipt.original_global_native_system_id_count,
  uncovered_body_count:receipt.original_native_body_definitions_with_unprotected_structural_calls.length,
  unresolved_native_systems:receipt.original_native_body_definitions_unresolved.length,
  conditional_114_structure:receipt.original_114_selected_source_guard_coverage_conditional,
  global_Y_newly_proved:receipt.original_114_Y_upper_bound_newly_certified,
  jet_count:receipt.original_67_final_physical_jet_intervals_certified,
  release:receipt.release
 }));
 if(!receipt.original_114_selected_source_guard_coverage_conditional)process.exitCode=2;
}
