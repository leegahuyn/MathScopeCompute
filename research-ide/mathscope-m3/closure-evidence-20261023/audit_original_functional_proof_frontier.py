#!/usr/bin/env python3
"""Pinned ORIGINAL source-functional proof audit. Fails closed; not a theorem prover."""
import argparse,copy,hashlib,json
from collections import Counter
from pathlib import Path

REL=('research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1/'
     'recovered/base/work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json')
PIN='7a44a4737d386903272ebc706d53aeff256be6e2'
INVENTORY={'FixedOriginalSource':1,'ActualInitializedState':1,
'GroupedSupportedNonzeroResidual':5,'OriginalForcedMap':5,
'FullPressureAndResidualRefresh':20,'ActualPhysicalHaarTangentialResidual':5,
'OriginalSignedMap':5,'ActualZeroAuxiliaryMeanResidual':5,'OriginalTemporalMap':5,
'FreshFiveTargets':5,'OriginalFiveMap':5,'CompletedActualStage':5,
'ActualCorrectionPotentials':5,'ExactSourceFunctionalBound':20,
'ActualCutoffCurlBound':20,'ActualShrinkingScale':5}
def gitblob(raw):return hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
def check(value,msg):
    if not value:raise ValueError('ORIGINAL_SOURCE_FRONTIER_REJECTED: '+msg)
def audit(data,actual_blob):
    check(actual_blob==PIN,'original function-graph Git blob changed')
    check(data.get('schema')=='MathScope.ActualRecursiveSourceFunctionals/1','source schema changed')
    nodes=data.get('nodes')
    check(isinstance(nodes,list) and len(nodes)==117,'117 source nodes required')
    check(Counter(n.get('operation') for n in nodes)==INVENTORY,'actual operations inventory changed')
    seen=set();look={}
    for n in nodes:
        i=n.get('id');deps=n.get('inputs')
        check(isinstance(i,str) and i.startswith('f_') and i not in seen,'bad/duplicate function node')
        check(isinstance(deps,list) and all(x in seen for x in deps),'missing/forward source dependency')
        seen.add(i);look[i]=n
    check(data.get('fixed_source') in seen,'original fixed source absent')
    starts=data.get('actual_stages')
    finished=[n for n in nodes if n['operation']=='CompletedActualStage']
    check(isinstance(starts,list) and len(starts)==6 and starts[0] in seen,'initial plus five stages missing')
    for j,n in enumerate(finished,1):
        check(n.get('data',{}).get('j')==j and starts[j]==n['id'],'source stage index/roots changed')
        check(n['data'].get('full_refreshed_current') in seen,'full source refresh node absent')
    scales=[n for n in nodes if n['operation']=='ActualShrinkingScale']
    check([n.get('data',{}).get('j') for n in scales]==[1,2,3,4,5],'scale stage sequence altered')
    bounds=[n for n in nodes if n['operation']=='ExactSourceFunctionalBound']
    check(all(n['data'].get('effective_numerical_evaluation') is False for n in bounds),
      'unbacked weighted-supremum numeric status')
    for name in ('numerical_field_evaluator','numerical_supremum_evaluator','private_original_seals_reused'):
        check(data.get(name) is False,name+' unexpectedly promoted')
    check(data.get('proof_status')=='SOURCE_BOUND_ANALYTIC_CONSTRUCTION_CANDIDATE','proof status changed')
    return {'schema':'MathScope.M3.PinnedOriginalFunctionalProofFrontier/1',
      'pinned_original_blob':PIN,'source_function_nodes':117,
      'finite_cycle_descriptions':5,'source_private_cycles_authenticated_here':0,
      'source_specific_supremum_bounds_evaluated':0,'real_final_67_closed_intervals_certified':0,
      'first_unproved_cycle':{'j':1,'node':finished[0]['id'],
        'needed':'original Forced Signed Temporal FiveMap private seals plus refreshed full pressure and 3D residual'},
      'additional_unproved_cycles':[{'j':j,'node':n['id']} for j,n in enumerate(finished[1:],2)],
      'bound_metadata_nodes':[n['id'] for n in bounds],
      'missing_global_inputs':['all-j common domain Lemma 9.7','all-m source-specific estimates Lemma 9.8',
        'actual cutoff-before-curl infinite sum/flat joins Lemma 5.4',
        'external forcing R=f, divergence-free, smooth compact support',
        'active original scale selectors and actual final-field numerical evaluator',
        '192 nonzero whole-K cells and independent refinement'],
      'M3':'62/64','M4':'0/16','last_resolved_tau':None,'release':'HOLD'}
def main():
    p=argparse.ArgumentParser();p.add_argument('--out',required=True,type=Path)
    p.add_argument('--self-test',action='store_true')
    args=p.parse_args()
    root=Path(__file__).resolve().parents[3]
    raw=(root/REL).read_bytes();data=json.loads(raw)
    result=audit(data,gitblob(raw))
    if args.self_test:
        for variant in range(5):
            mock=copy.deepcopy(data);pin=PIN
            if variant==0:mock['nodes'].pop()
            if variant==1:mock['actual_stages'].pop()
            if variant==2:mock['private_original_seals_reused']=True
            if variant==3:mock['numerical_field_evaluator']=True
            if variant==4:pin='bad'
            try:audit(mock,pin)
            except ValueError:pass
            else:raise AssertionError('bad source data accepted, mutation '+str(variant))
        result['mutation_controls_passed']=5
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'finite_source_nodes':117,'cycles':5,'original_cycle_seals_proved':0,
      'numeric_jets':0,'release':'HOLD'},ensure_ascii=False))
if __name__=='__main__':main()
