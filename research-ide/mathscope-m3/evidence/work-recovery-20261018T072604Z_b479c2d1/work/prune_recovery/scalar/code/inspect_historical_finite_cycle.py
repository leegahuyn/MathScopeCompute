#!/usr/bin/env python3
"""Read historical finite-cycle receipts without rerunning the producer."""
import argparse,json,pathlib
import recover_scalar_closure as r

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',type=pathlib.Path,required=True);ap.add_argument('--out',type=pathlib.Path,required=True);args=ap.parse_args();folder=args.root/'work/n602_continuation'
    names=['ACTUAL_FINITE_CYCLE_RECEIPT.json','ACTUAL_PROCESS.json','FINITE_CYCLE_RESULT.json','logs/actual.stdout.log','logs/actual.stderr.log','source/research-ide/mathscope-m3/navier/source-finite-cycle-continuation.mjs']
    pins=[{'path':'work/n602_continuation/'+name,'bytes':(folder/name).stat().st_size,'sha256':r.file_sha(folder/name)} for name in names]
    receipt=r.load(folder/names[0]);process=r.load(folder/names[1]);summary=r.load(folder/names[2]);module=folder/names[-1]
    r.require(receipt['schema']=='MathScope.N602.ActualFiniteCycleAttempt/1','Unknown historical receipt schema')
    r.require(process['stdoutSha256']==r.file_sha(folder/'logs/actual.stdout.log') and process['stderrSha256']==r.file_sha(folder/'logs/actual.stderr.log'),'Historical log hash mismatch')
    r.require(receipt['loadedSuccessorModuleSha256']==r.file_sha(module),'Historical loaded module hash mismatch')
    rows=[]
    for name in ['post-forced','signed','temporal','fresh-five']:
        state=receipt['stages'][name];checks=state['comparison']
        r.require(len(checks)==3 and all(c['pass'] and c['numeratorMonomials']==0 for c in checks),'Historical comparison changed')
        ids=[*state['actualVelocity'],state['actualPressure']]
        rows.append({'stage':name,'velocity':state['actualVelocity'],'pressure':state['actualPressure'],'live_node_count':state['nodeCount'],'all_three_recorded_exact_numerators_zero':True,'all_ids_outside_authenticated_original_parent_graph':all(i>=r.SOURCE_PIN['nodes'] for i in ids)})
    result={'schema':'MathScope.HistoricalFiniteCycleGraphIdentityReview/1','source_pins':pins,'review_code_sha256':r.file_sha(__file__),
       'recorded_status':receipt['status'],'recorded_exit_code':process['exitCode'],'recorded_elapsed_seconds':process['elapsedSeconds'],
       'all_mandatory_finite_stages_recorded':receipt['allMandatoryFiniteStagesConstructed'],'receipt_originalN602Complete':receipt['originalN602Complete'],
       'loaded_module_and_log_hashes_match':True,'stages':rows,'original_parent_node_count':r.SOURCE_PIN['nodes'],
       'recovered_scalar_tuple':{'velocity':[3825006,3825007,3825008],'pressure':3825009},
       'scope':'Historical receipt inspection only. Four later live states use another graph execution; their IDs cannot be looked up in the 3,892,594-node original parent stream. The recovered initialized scalar closure is not a final fresh-five evaluator.',
       'producer_executed_for_this_review':False,'finite_cycle_rerun':False,'windows_rerun':False,
       'final_field_scalar_graph_exported_by_historical_receipt':False,'final_field_evaluator_complete':False,'N706_closed':False,'N805_closed':False}
    r.write(args.out,result);print(json.dumps({'recorded_exit_code':process['exitCode'],'recorded_elapsed_seconds':process['elapsedSeconds'],'reviewed_stages':len(rows),'later_graph_ids_not_original_parent':all(x['all_ids_outside_authenticated_original_parent_graph'] for x in rows),'new_execution':False}))
if __name__=='__main__':main()
