#!/usr/bin/env python3
"""Evaluate what is ACTUALLY certified for original 67 final-field numerical jets
AFTER the first REAL Signed162 + post-Signed exact Temporal source-AST execution.
No arbitrary source root, no invented interval, and no status promotion.
"""
from __future__ import annotations
import argparse, json, pathlib, sys
from collections import Counter
from verify_real_67jet_readiness import (
    REQ, FAMILY, GRID, BASE_COMMIT, ACTUAL_FUNCTIONAL_SHA, load_source, ensure
)
EXACT_RUN=39933504384
EXACT_COMMIT='d119d367d2717d8abff6838545315aad7e2a7bad'
EXPECTED_STAGES=[
    'original_forced','original_corollary_8_5_stress',
    'original_signed162_successor','signed_temporal_centered_source',
    'post_signed_original_finite_fourier_with_tails',
    'post_signed_original_exact_temporal_AST_and_fresh_mean_PJ'
]
REQUIRED_SIGNED_KEYS={'velocity':3,'pressure':None,'pdeResidual':3,
                      'defects':3,'covariance':6}
BLOCKERS=[
    'ACTUAL_POST_SIGNED_FIVEMAP_CURRENT_AND_PRESSURE_NOT_SEALED',
    'FOUR_STAGE_ITERATION_LIMIT_AND_COMMON_ALL_ORDER_TAILS_NOT_PROVED',
    'LAST_RESOLVED_TIME_AND_ORIGINAL_SCALE_SELECTORS_NOT_NUMERICALLY_EVALUATED',
    'FINAL_PHYSICAL_A0_A1_A2_B_P_NUMERIC_EVALUATORS_NOT_PRESENT',
    'CLOSED_CELL_RIGOROUS_INTERVALS_AND_INDEPENDENT_REFINEMENT_NOT_PRESENT'
]
def check_receipt(real:dict):
    ensure(real['schema']=='MathScope.M3.SourceBoundOriginalPipeline/1','native original runner schema')
    ensure(real['expected_base_commit']==BASE_COMMIT,'PR30 baseline changed')
    ensure(real['executing_commit']==EXACT_COMMIT,'must not substitute a different unverified CI run')
    ensure(real['real_original_forced_seal_issued'] is True,'original Forced source not sealed')
    ensure(real['real_original_latest_cor85_stress_seal_issued'] is True,'Cor85 not sealed')
    ensure(real['real_original_signed162_seal_issued'] is True,'Signed162 actual seal missing')
    ensure(real['actual_signed162_indexed_rows']==1620,'actual Signed 81x2x10 rows changed')
    ensure(real.get('real_original_temporal_centered_input_constructed') is True,'signed centered residual missing')
    ensure(real.get('real_original_temporal_finite_prefix_constructed') is True,'original finite Fourier missing')
    ensure(real.get('temporal_finite_full_lattice_modes_each')==8 and
           real.get('temporal_finite_tails_retained') is True,'exact omitted Fourier tails not preserved')
    ensure(real.get('post_signed_exact_inverse_AST_private_source_checked') is True,
           'actual coupled-inverse Temporal AST not authenticated')
    ensure(real['actual_final67_jets_evaluated']==0,'unexpected reported final numerical jets')
    ensure(real['N706']=='OPEN' and real['N805']=='OPEN' and real['release']=='HOLD',
           'source statuses illegally promoted')
    ensure(real['M3_original_accepted']==62 and real['M4_original_accepted']==0,
           'original denominator or acceptance illegally promoted')
    ensure(real['stage']=='post_signed_original_five_equation_AST_and_fresh_PJ',
           'unexpected source frontier for pinned Signed report')
    ensure(real.get('post_signed_five_map_mean_source_AST_checked') is not True,
           'unexpected real FiveMap source execution; independently review first')
    ensure(real.get('error',{}).get('code')=='ReferenceError' and
           real.get('error',{}).get('message')=='template is not defined',
           'original FiveMap failure evidence changed')
    authenticated=real['successfully_authenticated']
    ensure(len(authenticated)==len(set(authenticated)),'duplicate authenticated steps')
    ensure(all(s in authenticated for s in EXPECTED_STAGES),
           'missing original signed/temporal source step')
    steps={r['stage']:r['node_count'] for r in real['graph_node_counts']}
    ensure(steps['original_signed162_successor']==4193092 and
           steps['post_signed_original_exact_temporal_AST_and_fresh_mean_PJ']==4418363,
           'real root node cardinality changed')
    roots=real['signed162_root_inventory']
    for name,size in REQUIRED_SIGNED_KEYS.items():
        obj=roots[name]
        ensure(len(obj)==size if size is not None else isinstance(obj,int),
               'signed original root inventory missing: '+name)
    flat=[v for k in REQUIRED_SIGNED_KEYS for v in
          (roots[k] if isinstance(roots[k],list) else [roots[k]])]
    ensure(len(flat)==16 and len(set(flat))==16 and
           all(isinstance(r,int) and 0<=r<4193092 for r in flat),
           'genuine predecessor root IDs missing or duplicated')
    ensure(len(real.get('post_signed_exact_inverse_roots',[]))==2 and
           len(real.get('post_signed_updated_mean_PJ',[]))==3 and
           all(isinstance(r,int) and 4193092<=r<4418363
               for r in real['post_signed_exact_inverse_roots']+
                        real['post_signed_updated_mean_PJ']),
           'post-Signed inverse/pressure root lineage invalid')
    ensure(not real.get('real_original_five_map_seal_issued'),
           'original FiveMap magically promoted')
    return {k:roots[k] for k in REQUIRED_SIGNED_KEYS}

def evaluate(req,family,grid,real):
    roots=check_receipt(real)
    ensure(req['actual_family_sha256']==ACTUAL_FUNCTIONAL_SHA,'original recursive family changed')
    jets=req['requested_field_jets']
    ensure(len(jets)==67 and len(set(jets))==67,'67 unique original jet targets required')
    counts=Counter(x.split('@')[0] for x in jets)
    ensure(counts=={'A0':19,'A1':19,'A2':19,'b':6,'p':4},'original 67-field composition changed')
    ensure(req['coordinates']['physical_time_derivative']=='-partial_tau',
           'original physical time derivative sign changed')
    ensure(family['numerical_field_evaluator'] is False and
           family['numerical_supremum_evaluator'] is False,
           'original recursion unexpectedly has a numerical evaluator')
    ensure(grid['actual_nonzero_final_field_evaluated'] is False and
           grid['whole_K_energy'] is None and grid['missing_field_cells']==192,
           'original whole K numerical-jet frontier changed')
    steps={r['stage']:r['node_count'] for r in real['graph_node_counts']}
    return {
      'schema':'MathScope.M3.SignedAuthenticated67FinalJetReadiness/1',
      'provenance':{'actual_real_signed_run':EXACT_RUN,'run_commit':EXACT_COMMIT,
        'original_source_commit':BASE_COMMIT,
        'signed162_private_authenticated':True,'signed_indexed_rows':1620,
        'signed_source_graph_node_count':steps['original_signed162_successor'],
        'post_signed_temporal_ast_authenticated':True,
        'post_signed_temporal_graph_node_count':steps['post_signed_original_exact_temporal_AST_and_fresh_mean_PJ'],
        'signed_field_root_inventory':roots,
        'post_signed_temporal_inverse_roots':real['post_signed_exact_inverse_roots'],
        'post_signed_new_pressure_moment_roots':real['post_signed_updated_mean_PJ']},
      'actual_original_final_field_root_inventory':None,
      'final_67_jet_requests':[{'id':j,'component':j.split('@')[0],
        'derivative_multiindex':list(map(int,j.split('@')[1].split(','))),
        'final_field_root':None,'numeric_interval':None,
        'status':'BLOCKED_FINAL_FIELD_NOT_MATERIALIZED'} for j in jets],
      'required_field_jet_counts':dict(counts),
      'total_required':67,'signed_predecessor_only_root_count':16,
      'final_numeric_certified':0,'not_counted_as_final_jet':len(roots),
      'outstanding_prerequisites':BLOCKERS,
      'whole_K_192_nontrivial_cells_numeric_certified':0,
      'original_M3_criterion_complete':62,'original_M4_accepted':0,
      'last_resolved_tau':None,'N7_06':'OPEN','N8_05':'OPEN',
      'M4_release':'HOLD','all_final_jet_numeric_intervals_are_absent':True
    }
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--receipt',required=True,type=pathlib.Path)
    ap.add_argument('--output',required=True,type=pathlib.Path)
    ap.add_argument('--require-67',action='store_true')
    a=ap.parse_args()
    try:
        req,_=load_source(REQ);family,_=load_source(FAMILY);grid,_=load_source(GRID)
        result=evaluate(req,family,grid,json.loads(a.receipt.read_text()))
        a.output.parent.mkdir(parents=True,exist_ok=True)
        a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'source_signed':'AUTHENTICATED','temporal_ast':'AUTHENTICATED',
            'numerically_certified_final_jets':0,'total':67,'status':'HOLD'}))
        return 2 if a.require_67 else 0
    except (ValueError,KeyError,TypeError,FileNotFoundError) as e:
        print(str(e),file=sys.stderr);return 3
if __name__=='__main__':raise SystemExit(main())
