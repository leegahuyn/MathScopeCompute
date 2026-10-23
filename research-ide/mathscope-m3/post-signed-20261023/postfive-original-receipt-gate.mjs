#!/usr/bin/env node
/** Read-only source-bound Actions receipt gate. No private authority minted. */
import {readFileSync} from 'node:fs';
const BASE='a9b3a5b317525f6d0a71e2e356b054c9d25d2e60';
const FIVE='post_signed_original_five_equation_AST_and_fresh_PJ';
const PDE='post_five_actual_full_physical_three_dimensional_PDE_AST';
const req=(p,m)=>{if(!p)throw Object.assign(new Error(m),{code:'RECEIPT_EVIDENCE_INCOMPLETE'});};
const validRoot=(id,n)=>Number.isSafeInteger(id)&&id>=0&&id<n;
export function verifyOriginalPostFiveReceipt(r){
  req(r?.schema==='MathScope.M3.SourceBoundOriginalPipeline/1','Original pipeline receipt schema required');
  req(r.expected_base_commit===BASE,'Original PR30 pinned commit changed');
  req(r.real_original_signed162_seal_issued===true,'Original Signed private seal missing');
  req(r.real_original_forced_seal_issued===true && r.real_original_latest_cor85_stress_seal_issued===true,
      'Original Forced/Cor85 private seals missing');
  req(r.actual_signed162_indexed_rows===1620,'Signed source inventory must contain 1620 indexed contributions');
  req(r.actual_signed162_node_count===4193092,'Historical Signed162 checkpoint root/node count mismatch');
  const stages=r.successfully_authenticated;
  req(Array.isArray(stages)&&new Set(stages).size===stages.length,'Stage history absent or duplicated');
  const signed=stages.indexOf('original_signed162_successor'),temporal=stages.indexOf('post_signed_original_exact_temporal_AST_and_fresh_mean_PJ'),five=stages.indexOf(FIVE);
  req(signed>=0&&temporal>signed&&five>temporal,'Signed -> Temporal -> FiveMap order unverified');
  req(r.post_signed_five_map_mean_source_AST_checked===true,'Original FiveMap AST result not authenticated');
  const counts=r.graph_node_counts;
  req(Array.isArray(counts)&&counts.length===stages.length,'Stage node accounting incomplete');
  let previous=-1;
  for(let i=0;i<counts.length;i++){
    const c=counts[i];req(c.stage===stages[i],'Stage/node ledger ordering altered');
    if(c.node_count!==null){req(Number.isSafeInteger(c.node_count)&&c.node_count>=previous,'Graph node count regressed');previous=c.node_count;}
  }
  const f=counts.find(x=>x.stage===FIVE);
  req(f&&Number.isSafeInteger(f.node_count),'FiveMap AST graph root bound absent');
  req(Array.isArray(r.post_signed_five_map_fresh_PJ)&&r.post_signed_five_map_fresh_PJ.length===3&&
    r.post_signed_five_map_fresh_PJ.every(x=>validRoot(x,f.node_count)),'FiveMap P/J missing or not part of source graph');
  const pdeRan=stages.includes(PDE);
  if(pdeRan){
    req(r.post_five_full_three_dimensional_PDE_AST_checked===true,'3D PDE AST stage did not confirm source seal');
    const tail=counts.find(x=>x.stage===PDE);
    req(tail&&Number.isSafeInteger(tail.node_count),'3D PDE graph accounting missing');
    req(Array.isArray(r.post_five_full_three_dimensional_PDE_residual_roots)&&
      r.post_five_full_three_dimensional_PDE_residual_roots.length===3&&
      r.post_five_full_three_dimensional_PDE_residual_roots.every(x=>validRoot(x,tail.node_count)),
      'Three actual full 3D PDE roots missing');
  }
  const numerical=r.actual_final67_jets_evaluated;
  req(Number.isSafeInteger(numerical)&&numerical>=0&&numerical<=67,'Actual 67-jet count invalid');
  req(r.M3_original_accepted===62 && r.M4_original_accepted===0 && r.release==='HOLD'&&
    r.N706==='OPEN'&&r.N805==='OPEN','Acceptance ledger must not be silently changed');
  return {schema:'MathScope.M3.ReadOnlyPostFiveReceiptAudit/1',executing_commit:r.executing_commit,
    firstFiveMapSourceASTStageConfirmed:true,stageCount:stages.length,
    graphNodesAtFiveMap:f.node_count,fiveMapCurrentPJ:[...r.post_signed_five_map_fresh_PJ],
    temporalFormalASTChecked:r.post_signed_exact_inverse_AST_private_source_checked===true,
    originalSignedPrivateSeal:true,fiveMapOriginalPrivateSeal:r.real_original_five_map_seal_issued===true,
    temporalOriginalPrivateSeal:r.real_original_temporal_seal_issued===true,
    afterFive3DPDESourceASTChecked:pdeRan,
    actual3DPDEResidualProvedZero:pdeRan&&r.post_five_full_three_dimensional_PDE_residual_proved_zero===true,
    actual67IntervalJetsVerifiedByThisAudit:0,
    nextOriginalGate:pdeRan?'INDEPENDENT_3D_RESIDUAL_VANISHING':PDE,
    release:'HOLD',interpretation:'AST_ROOTS_ONLY_NOT_ANALYTIC_OR_NUMERIC_CERTIFICATION'};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  try{const r=JSON.parse(readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(verifyOriginalPostFiveReceipt(r),null,2));}
  catch(e){console.error(e.code??e.name,e.message);process.exitCode=2;}
}
