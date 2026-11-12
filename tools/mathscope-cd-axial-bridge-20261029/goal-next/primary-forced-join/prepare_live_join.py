"""Generate bounded corrected first-Forced/primary join from the exact f8 runner.

No native source edits or execution. Generated runner still requires the
usual prepared reference checkout with 27 original + 2 pinned repair blobs.
"""
import argparse,hashlib
from pathlib import Path
PIN='690e1f7a842bafcfcfb768093b8a777656f8ce0d'
def blob(x):return hashlib.sha1(b'blob '+str(len(x)).encode()+b'\0'+x).hexdigest()
def replace_one(s,old,new):
 if s.count(old)!=1:raise ValueError('expected exactly one source anchor: '+old[:80])
 return s.replace(old,new,1)
def generate(raw):
 if blob(raw)!=PIN:raise ValueError('original f8 runner blob mismatch')
 s=raw.decode('utf8')
 s=replace_one(s,"schema:'MathScope.M3.SourceBoundOriginalPipeline/1'","schema:'MathScope.M3.LiveSameFamilyForcedPrimary/1'")
 s=replace_one(s,"M3_original_accepted:62,M4_original_accepted:0,release:'HOLD'","progress_counts_not_asserted:true,release:'HOLD'")
 s=replace_one(s,"receipt.status='BLOCKED';receipt.failed_at_stage=receipt.stage;","receipt.status='BLOCKED';receipt.failed_rss_bytes=process.memoryUsage().rss;receipt.failed_heap_bytes=process.memoryUsage().heapUsed;receipt.failed_at_stage=receipt.stage;")
 s=replace_one(s,"}catch(e){receipt.error=", "}catch(e){receipt.error_stack=String(e?.stack??'');receipt.error=")
 s=replace_one(s,"stage:row?.stage??receipt.stage,substage:","rss_bytes:process.memoryUsage().rss,heap_bytes:process.memoryUsage().heapUsed,stage:row?.stage??receipt.stage,substage:")
 s=replace_one(s,"node_count:G?.nodes?.length??null,elapsed_ms:Date.now()-START}","node_count:G?.nodes?.length??null,elapsed_ms:Date.now()-START,rss_bytes:process.memoryUsage().rss,heap_bytes:process.memoryUsage().heapUsed}")
 s=replace_one(s,"let G=null,lastProgress=0;", '''let G=null,lastProgress=0,lastMemoryGC=0;
receipt.memory_gc=[];
function memoryGC(label){
    if(!global.gc)return;
    const before=process.memoryUsage();
    global.gc();
    const after=process.memoryUsage();
    lastMemoryGC=Date.now();
    receipt.memory_gc.push({label,stage:receipt.stage,at_ms:lastMemoryGC-START,before,after});
    save();
}''')
 s=replace_one(s,"    if(process.memoryUsage().rss>MAX_RSS)throw",'''    if(process.memoryUsage.rss()>=MAX_RSS*0.94&&Date.now()-lastMemoryGC>30000)
       memoryGC('near-RSS-limit');
    if(process.memoryUsage.rss()>MAX_RSS)throw''')
 s=replace_one(s," const temporal=await stage('original_temporal_inverse',",''' for(const graph of new Set([family.G,cur.G,target.G,pres.G]))clearDisposableThirdJetCaches(graph);
 memoryGC('after-authenticated-pressure');bound();
 const temporal=await stage('original_temporal_inverse',''')
 s=replace_one(s," const mean=await stage('original_initialized_mean',",''' memoryGC('after-authenticated-temporal');bound();
 const mean=await stage('original_initialized_mean',''')
 s=replace_one(s,"import {prepareGlobalSourceBand} from '../navier/source-global-band.mjs';", """import {prepareActualCommonAdmissibleFamily,assertActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {assertActualCommonTargetWeightedNorms} from '../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {clearDisposableThirdJetCaches} from '../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import {attachGlobalSourceBand} from '../navier/source-global-band.mjs';
import {assertGlobalCurrentState} from '../navier/source-global-current.mjs';
import {attachGlobalPrimaryClassOperator,assertGlobalPrimaryClassOperator} from '../navier/source-primary-class-majorants.mjs';
import {assertLivePrimaryForcedJoin,raiseSharedNodeLimit} from './assert_live_join.mjs';""")
 s=replace_one(s,"const band=await stage('source_band',()=>prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context));", """const family=await stage('same_family_C5',()=>prepareActualCommonAdmissibleFamily({throughOrder:2,derivativeOrder:5,maxNodes:5000000,maxProfileJets:60000,maxJetRequests:600000},context));
 assertActualCommonAdmissibleFamily(family);clearDisposableThirdJetCaches(family.G);global.gc?.();
 const band=await stage('source_band',()=>attachGlobalSourceBand(family,{coefficientOrder:1,maxNodes:4000000},context));""")
 s=replace_one(s,"const cur=await stage('original_current',()=>attachGlobalCurrentState(rep,context));", """const cur=await stage('original_current',()=>attachGlobalCurrentState(rep,context));
 const collect=()=>{clearDisposableThirdJetCaches(family.G);clearDisposableThirdJetCaches(cur.G);global.gc?.();bound();};
 collect();
 const target=await stage('same_family_target_C3',()=>family.constructTargetWeightedNorms({derivativeOrder:3,maxNodes:6000000,maxJetRequests:600000},context));
 assertActualCommonTargetWeightedNorms(target);clearDisposableThirdJetCaches(target.G);collect();
 const primary=await stage('same_current_primary_C2',()=>attachGlobalPrimaryClassOperator(cur,target,{order:2,maxWork:200000},context));
 assertGlobalPrimaryClassOperator(primary);clearDisposableThirdJetCaches(target.G);collect();
 receipt.primary_before_forced={same_current:primary.current===cur,same_family:target.family===family,
   finite_order:primary.scope.actualFiniteDerivativeOrder,target_order:target.request.derivativeOrder,
   family_order:family.request.derivativeOrder,current_nodes:cur.G.nodes.length,target_nodes:target.G.nodes.length};
 save();""")
 s=replace_one(s,""" const norms=await stage('original_operator_seminorms',()=>prepareOriginalMeanMapOperatorSeminorms({order:1,maxNodes:300000,maxWork:10000},context));
 const majorants=await stage('original_majorant_binding',()=>{
   const obj=attachInitializedMeanOperatorMajorants(mean,norms);
   if(assertInitializedMeanOperatorMajorants(obj)!==true)throw Error('majorant private authentication failed');return obj;});
"""," collect();\n")
 s=replace_one(s," receipt.real_original_current_constructed=true;save();", """ receipt.real_original_current_constructed=true;save();
 const forcedGraphBudget=Number(process.env.M3_FORCED_MAX_NODES??5000000);
 if(![5000000,6200000].includes(forcedGraphBudget))throw Error('Unexpected isolated Forced graph budget.');
 if(forcedGraphBudget>5000000){
   const graphBudget=raiseSharedNodeLimit(initial.G,5000000,forcedGraphBudget);
   if(assertGlobalInitializedAngular(initial)!==true)
     throw Error('The initial source seal changed after updating its resource ceiling.');
   receipt.forced_graph_budget={...graphBudget,
     mathematicalSourceChanged:false,initializedPrivateSealRechecked:true};
   memoryGC('after-forced-budget-change');bound();save();
 }""")
 marker=' receipt.real_original_forced_seal_issued=true;save();'
 if s.count(marker)!=1:raise ValueError('forced seal anchor mismatch')
 prefix,tail=s.split(marker);failure="}catch(e){receipt.error_stack=String(e?.stack??'');receipt.error="
 if tail.count(failure)!=1:raise ValueError('failure handler anchor mismatch')
 suffix=failure+tail.split(failure,1)[1]
 extension="""
 receipt.real_original_forced_seal_issued=true;save();
 collect();
 const joined=await stage('live_same_family_corrected_first_forced_join',()=>assertLivePrimaryForcedJoin({family,current:cur,target,primary,initial,forced,native:{
   assertActualCommonAdmissibleFamily,assertActualCommonTargetWeightedNorms,assertGlobalCurrentState,assertGlobalPrimaryClassOperator,
   assertGlobalInitializedAngular,assertGlobalForcedCurrent}}));
 receipt.same_family_join={...joined,graphCounts:{family:family.G.nodes.length,current:cur.G.nodes.length,target:target.G.nodes.length,forced:forced.G.nodes.length},
   primaryBackgroundOrder:primary.bounds.backgroundRow.backgroundDerivativeOrder,
   primaryTargetOrders:primary.bounds.targetRows.map(x=>x.derivativeOrder),
   primaryTargetPoles:primary.bounds.targetRows.map(x=>x.pole),
   primaryFiniteOrder:primary.scope.actualFiniteDerivativeOrder,
   sameFamilyLiveObjectIdentitiesChecked:true,sourceGraphFullyExported:false};
 receipt.stage='LIVE_JOIN_ONLY_WITH_FORCED_INPUT_CLASS_OPEN';
 receipt.status='VERIFIED_LIVE_SOURCE_JOIN_ONLY';receipt.stop_reason='Exact live source identity only; actual Forced W-alpha input, original moment bridge, all later stages and final 67 jets remain OPEN.';
 receipt.actual_final67_jets_evaluated=0;receipt.release='HOLD';save();
"""
 return (prefix+extension+suffix).encode('utf8')
def main():
 p=argparse.ArgumentParser();p.add_argument('runner',type=Path);p.add_argument('out',type=Path);a=p.parse_args();a.out.write_bytes(generate(a.runner.read_bytes()));print('PASS generated first-Forced live join from exact pinned runner; no construction executed')
if __name__=='__main__':main()
