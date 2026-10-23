#!/usr/bin/env node
/* Unmodified PR30 source, source-bound stage trace. NO synthetic roots / no acceptance promotion. */
import fs from 'node:fs';
import os from 'node:os';
import {prepareGlobalSourceBand} from '../navier/source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../navier/source-global-representative.mjs';
import {attachGlobalCurrentState} from '../navier/source-global-current.mjs';
import {attachGlobalMomentCurrent} from '../navier/source-global-moment.mjs';
import {attachGlobalCurrentPressure} from '../navier/source-global-pressure.mjs';
import {attachGlobalTemporalInverse} from '../navier/source-global-temporal.mjs';
import {attachGlobalInitializedMean} from '../navier/source-global-initial-mean.mjs';
import {attachGlobalInitializedAngular,assertGlobalInitializedAngular} from '../navier/source-initialized-angular.mjs';
import {prepareOriginalMeanMapOperatorSeminorms} from '../navier/source-fixed-mean-majorants.mjs';
import {attachInitializedMeanOperatorMajorants,assertInitializedMeanOperatorMajorants} from '../navier/source-initialized-mean-majorants.mjs';
import {attachGlobalForcedCurrent,assertGlobalForcedCurrent} from '../navier/source-global-forced-current.mjs';
import {attachGlobalForcedMeanStress,assertGlobalUpdatedMeanStress} from '../navier/source-global-updated-mean-stress.mjs';

const OUT=process.argv[2]??'actual_original_source_receipt.json',START=Date.now(),
      LIMIT_MIN=Number(process.env.M3_MAX_MINUTES??15),
      MAX_RSS=Number(process.env.M3_MAX_RSS_GB??6)*1024**3;
const receipt={schema:'MathScope.M3.SourceBoundOriginalPipeline/1',
    expected_base_commit:'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60',
    executing_commit:process.env.GITHUB_SHA??null,
    runtime:{node:process.version,platform:process.platform,arch:process.arch,cpus:os.cpus().length,
       max_minutes:LIMIT_MIN,max_rss_bytes:MAX_RSS},
    started_utc:new Date().toISOString(),stage:'NOT_STARTED',
    successfully_authenticated:[],graph_node_counts:[],progress:[],
    real_original_current_constructed:false,real_original_forced_seal_issued:false,
    real_original_latest_cor85_stress_seal_issued:false,
    real_original_signed162_seal_issued:false,
    real_original_temporal_seal_issued:false,real_original_five_map_seal_issued:false,
    actual_final67_jets_evaluated:0,N706:'OPEN',N805:'OPEN',
    M3_original_accepted:62,M4_original_accepted:0,release:'HOLD'};
function save(){fs.mkdirSync((awaitPath()).dir,{recursive:true});fs.writeFileSync(OUT,JSON.stringify(receipt,null,2)+'\n');}
function awaitPath(){return {dir:OUT.includes('/')?OUT.slice(0,OUT.lastIndexOf('/'))||'.':'.'};}
let G=null,lastProgress=0;
function bound(){
    if(Date.now()-START>LIMIT_MIN*60000)throw Object.assign(new Error('bounded source execution deadline'),{code:'SOURCE_TIME_BUDGET'});
    if(process.memoryUsage().rss>MAX_RSS)throw Object.assign(new Error('bounded source RSS budget'),{code:'SOURCE_MEMORY_BUDGET'});
}
const context={checkCancelled:bound,onProgress:(row)=>{
    bound();const now=Date.now();
    if(now-lastProgress>15000){lastProgress=now;
       receipt.progress.push({at_ms:now-START,stage:row?.stage??receipt.stage,substage:row?.step??row?.component??null,nodeCount:row?.nodeCount??G?.nodes?.length??null,delta:row?.delta??null});
       if(receipt.progress.length>100)receipt.progress.shift();save();}
}};
async function stage(name,callback){
    receipt.stage=name;save();bound();
    const result=await callback();
    receipt.successfully_authenticated.push(name);
    receipt.graph_node_counts.push({stage:name,node_count:G?.nodes?.length??null,elapsed_ms:Date.now()-START});
    console.log(JSON.stringify({kind:'ORIGINAL_STAGE_COMPLETED',stage:name,elapsed_ms:Date.now()-START,node_count:G?.nodes?.length??null}));
    save();return result;
}
try{
 const band=await stage('source_band',()=>prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context));
 G=band.G;
 const rep=await stage('fixed_representative',()=>attachGlobalFixedRepresentative(band,context));
 const cur=await stage('original_current',()=>attachGlobalCurrentState(rep,context));
 const templ=await stage('original_five_moment_template',()=>attachGlobalMomentCurrent(cur,context));
 const pres=await stage('original_full_pressure',()=>attachGlobalCurrentPressure(cur,context));
 const temporal=await stage('original_temporal_inverse',()=>attachGlobalTemporalInverse(pres,context));
 const mean=await stage('original_initialized_mean',()=>attachGlobalInitializedMean(temporal,templ,context));
 const norms=await stage('original_operator_seminorms',()=>prepareOriginalMeanMapOperatorSeminorms({order:1,maxNodes:300000,maxWork:10000},context));
 const majorants=await stage('original_majorant_binding',()=>{
   const obj=attachInitializedMeanOperatorMajorants(mean,norms);
   if(assertInitializedMeanOperatorMajorants(obj)!==true)throw Error('majorant private authentication failed');return obj;});
 const initial=await stage('original_initialized_angular',()=>{
   const obj=attachGlobalInitializedAngular(mean,context);
   if(assertGlobalInitializedAngular(obj)!==true)throw Error('initialized angular private authentication failed');return obj;});
 receipt.real_original_current_constructed=true;save();
 const forced=await stage('original_forced',()=>{
   const obj=attachGlobalForcedCurrent(initial,context);
   if(assertGlobalForcedCurrent(obj)!==true)throw Error('forced private authentication failed');return obj;});
 receipt.real_original_forced_seal_issued=true;save();
 const stress=await stage('original_corollary_8_5_stress',()=>{
   const obj=attachGlobalForcedMeanStress(forced,context);
   if(assertGlobalUpdatedMeanStress(obj)!==true)throw Error('latest mean stress private authentication failed');return obj;});
 receipt.real_original_latest_cor85_stress_seal_issued=true;save();
 const {attachOriginalSigned162Successor,assertOriginalSigned162Successor}=await import('../navier/original-signed-162-successor.mjs');
 const signed=await stage('original_signed162_successor',async()=>{
    const obj=await attachOriginalSigned162Successor(forced,{onProgress:context.onProgress,
       candidateMaxAdditionalNodes:250000,assemblyMaxAdditionalNodes:1500000,authenticatedLatestStress:stress});
    if(assertOriginalSigned162Successor(obj)!==true)throw Error('actual source-bound Signed162 private seal rejected');
    return obj;
 });
 receipt.real_original_signed162_seal_issued=true;
 receipt.actual_signed162_indexed_rows=signed.audit.allIndexedRows;
 receipt.actual_signed162_node_count=G.nodes.length;
 receipt.signed162_root_inventory=signed.audit.rootInventory;save();
 const {attachSigned162TemporalFrontier,assertSigned162TemporalFrontier}=await import('../navier/source-signed-temporal-frontier.mjs');
 const frontier=await stage('signed_temporal_centered_source',()=>{
    const obj=attachSigned162TemporalFrontier(signed);
    if(assertSigned162TemporalFrontier(obj)!==true)throw Error('authentic centered post-signed temporal source rejected');
    return obj;
 });
 receipt.real_original_temporal_centered_input_constructed=true;save();
 const {attachSigned162FiniteTemporalReplay,assertSigned162FiniteTemporalReplay}=
   await import('../temporal-finite-20261023/source-signed-temporal-finite-replay.mjs');
 const temporalFinite=await stage('post_signed_original_finite_fourier_with_tails',()=>{
   const x=attachSigned162FiniteTemporalReplay(frontier,context);
   if(assertSigned162FiniteTemporalReplay(x)!==true)throw Error('Original post-Signed finite Fourier source rejected');
   return x;
 });
 receipt.real_original_temporal_finite_prefix_constructed=true;
 receipt.temporal_finite_roots=temporalFinite.roots;
 receipt.temporal_finite_full_lattice_modes_each=8;
 receipt.temporal_finite_tails_retained=true;save();
 receipt.real_original_temporal_seal_issued=false;
 receipt.real_original_five_map_seal_issued=false;
 const {attachActualPostSignedTemporalInverse,assertActualPostSignedTemporalInverse}=
   await import('../post-signed-20261023/source-signed-actual-temporal-inverse.mjs');
 const actualTemporal=await stage('post_signed_original_exact_temporal_AST_and_fresh_mean_PJ',()=>{
   const x=attachActualPostSignedTemporalInverse(frontier,context);
   if(assertActualPostSignedTemporalInverse(x)!==true)
     throw Error('Post-signed exact Temporal source AST seal failed');
   return x;
 });
 receipt.post_signed_exact_inverse_AST_private_source_checked=true;
 receipt.post_signed_exact_inverse_roots=Object.values(actualTemporal.inverses).map(x=>x.exact);
 receipt.post_signed_updated_mean_PJ=['P','Jtheta','Jz'].map(x=>actualTemporal.postTemporal.updatedMeanPressure.mean[x]);save();
 const {attachActualPostSignedFiveMap,assertActualPostSignedFiveMap}=
   await import('../post-signed-20261023/source-signed-actual-five-map.mjs');
 const actualFive=await stage('post_signed_original_five_equation_AST_and_fresh_PJ',()=>{
   const x=attachActualPostSignedFiveMap(actualTemporal,context);
   if(assertActualPostSignedFiveMap(x)!==true)
     throw Error('Post-signed FiveMap source AST seal failed');
   return x;
 });
 receipt.post_signed_five_map_mean_source_AST_checked=true;
 receipt.post_signed_five_map_fresh_PJ=['P','Jtheta','Jz'].map(x=>actualFive.postFiveMean.updatedMeanPressure.mean[x]);save();
 const {attachActualPostFiveFull3DPDE,assertActualPostFiveFull3DPDE}=
   await import('../post-signed-20261023/source-postfive-full-3d-residual.mjs');
 const actualFull3D=await stage('post_five_actual_full_physical_three_dimensional_PDE_AST',()=>{
   const x=attachActualPostFiveFull3DPDE(actualFive,context);
   if(assertActualPostFiveFull3DPDE(x)!==true)
     throw Error('Actual post-FiveMap complete 3D physical PDE AST authentication failed');
   return x;
 });
 receipt.post_five_full_three_dimensional_PDE_AST_checked=true;
 receipt.post_five_full_three_dimensional_PDE_residual_roots=[...actualFull3D.residual.conservative];
 // Only the first post-Signed FiveMap snapshot; do not confuse these roots
 // with a final all-cycle gauge A,b,p family or a numerical interval evaluator.
 receipt.post_five_full_three_dimensional_velocity_roots=[...actualFull3D.velocity.fullPhysicalVelocity];
 receipt.post_five_full_three_dimensional_pressure_root=actualFull3D.pressure.fullPhysicalPressure;
 receipt.post_five_full_three_dimensional_divergence_root=actualFull3D.residual.divergence;
 receipt.actual_final_emitted_gauge_A_b_p_roots=null;
 receipt.actual_final67_source_numerical_interval_inventory=null;
 receipt.post_five_full_three_dimensional_PDE_residual_proved_zero=false;
 // Independently polarized AST uses the SAME privately sealed original graph;
 // constructing defects never certifies their vanishing or the forcing theorem.
 const {buildSourcePostFiveDirectSplit}=await import('../post-signed-20261023/source-postfive-direct-split.mjs');
 receipt.stage='post_five_source_bound_direct_vs_split_AST';save();bound();
 const directSplit=buildSourcePostFiveDirectSplit(actualFull3D);
 if(!directSplit.checks.allRootsValid || directSplit.roots.defects.length!==3)
   throw Object.assign(new Error('Source-bound 3D polarization roots incomplete'),{code:'INCOMPLETE_SOURCE_3D_POLARIZATION'});
 receipt.post_five_direct_vs_split_AST_constructed=true;
 receipt.post_five_direct_vs_split_difference_roots=[...directSplit.roots.defects];
 receipt.post_five_direct_vs_split_divergence_difference_root=directSplit.roots.divergenceDefect;
 receipt.post_five_direct_vs_split_same_original_pressure_root=actualFull3D.pressure.fullPhysicalPressure;
 receipt.post_five_direct_vs_split_node_count=G.nodes.length;
 receipt.post_five_direct_vs_split_proved_zero=false;
 receipt.progress.push({stage:receipt.stage,nodeCount:G.nodes.length,scope:'AST_ONLY_PROOF_OPEN'});
 receipt.actual_final67_jets_evaluated=0;save();
 receipt.stage='FOUR_STAGE_ITERATION_ALL_ORDER_ESTIMATES_AND_FINAL67_NUMERIC_OPEN';
 receipt.stop_reason='Signed->Temporal->FiveMap->whole 3D PDE and direct/split ASTs constructed, but their identity and the forced PDE remain OPEN, infinite A-D corrections, analytic class bounds, scale selectors and the final 67 original numeric intervals remain OPEN.';
 receipt.status='PARTIAL_SOURCE_AUTHENTICATED';save();
}catch(e){receipt.error={code:e.code??e.name??'ERROR',message:String(e.message??e).slice(0,1000)};
 receipt.status='BLOCKED';receipt.failed_at_stage=receipt.stage;
 receipt.failed_graph_node_count=G?.nodes?.length??null;
 receipt.last_progress=receipt.progress.slice(-8);save();console.error(JSON.stringify(receipt.error));process.exitCode=2;}
finally{receipt.finished_utc=new Date().toISOString();receipt.runtime_elapsed_ms=Date.now()-START;save();
 console.log(JSON.stringify({status:receipt.status,authenticated:receipt.successfully_authenticated,
 source_stress:receipt.real_original_latest_cor85_stress_seal_issued,release:'HOLD'}));}
