#!/usr/bin/env python3
"""SourceExpressions numeric-kernel backlog: metadata, NEVER an enclosure certificate."""
import argparse,json,re
from pathlib import Path

ELEMENTARY={'rational','coordinate','add','multiply','inverse','integer_power'}
CATEGORIES={
'source_parameter':'PINNED_PARAMETER_ENCLOSURE_REQUIRED',
'definite_integral':'RIGOROUS_QUADRATURE_OR_ANALYTIC_INTEGRAL_REQUIRED',
'smooth_piecewise':'BRANCH_GUARD_AND_JOIN_REQUIRED',
'source_step_derivative':'SMOOTH_STEP_DERIVATIVE_INTERVAL_REQUIRED',
'exp':'TRANSCENDENTAL_DIRECTED_ROUNDING_REQUIRED',
'log_positive':'TRANSCENDENTAL_DIRECTED_ROUNDING_REQUIRED',
'sqrt_positive':'TRANSCENDENTAL_DIRECTED_ROUNDING_REQUIRED',
'sine':'TRANSCENDENTAL_DIRECTED_ROUNDING_REQUIRED',
'cosine':'TRANSCENDENTAL_DIRECTED_ROUNDING_REQUIRED',
'ceiling':'INTEGER_SELECTOR_UNIQUENESS_REQUIRED',
'actual_covariance_volterra':'VOLTERRA_SOURCE_AND_TAIL_ESTIMATE_REQUIRED',
'm3_global_pulse_jet':'ORIGINAL_ODE_JET_ENCLOSURE_REQUIRED',
'm3_global_indexed_partial':'COVER_SEAMS_INDEXED_FIELD_VALIDATION_REQUIRED',
'm3_aux_expression_partial':'ORIGINAL_AUXILIARY_SOURCE_VALUE_REQUIRED',
'm3_aux_indexed_partial':'ORIGINAL_AUXILIARY_SOURCE_VALUE_REQUIRED',
'm3_aux_inverse_partial':'FOURIER_INVERSE_AND_TAIL_BOUNDS_REQUIRED',
'm3_coupled_expression_partial':'COUPLED_SOURCE_FUNCTIONAL_REQUIRED',
'm3_coupled_indexed_partial':'COUPLED_SOURCE_FUNCTIONAL_REQUIRED',
'm3_coupled_inverse_partial':'FOURIER_INVERSE_AND_TAIL_BOUNDS_REQUIRED',
'm3_forced_expression_partial':'FORCED_FIELD_SOURCE_EVALUATOR_REQUIRED',
'm3_forced_pulse_partial':'FORCED_ODE_PARTIAL_INTERVAL_REQUIRED',
'actual_expression_partial':'ORIGINAL_RETAINED_EXPRESSION_EVALUATOR_REQUIRED',
}
def category(op):
    if op in ELEMENTARY:return 'IMPLEMENTED_ELEMENTARY_TESTED_ONLY'
    if op in CATEGORIES:return CATEGORIES[op]
    if re.match(r'^m3_',op):return 'UNRECOGNIZED_M3_NATIVE_KERNEL_REQUIRED'
    if re.match(r'^actual_',op):return 'UNRECOGNIZED_ACTUAL_NATIVE_KERNEL_REQUIRED'
    return 'UNKNOWN_SOURCE_OPERATION_IMPLEMENTATION_REQUIRED'
def audit(m):
    if m.get('schema')!='MathScope.M3.SourceGraphReplayManifest/1' or
       m.get('final_all_cycle_A_b_p') is not False or
       m.get('actual_final_67_jets_certified')!=0 or
       m.get('release')!='HOLD':
        raise ValueError('Require original first-FiveMap scoped HOLD manifest')
    ops=m.get('operation_histogram')
    if not isinstance(ops,dict) or not ops:
        raise ValueError('Actual original native operation histogram not yet available')
    if any(type(n) is not int or n<=0 or type(k) is not str or not k for k,n in ops.items()):
        raise ValueError('Operation histogram values malformed')
    if sum(ops.values())!=m.get('node_count'):
        raise ValueError('Operation histogram does not account for every AST node')
    catalog=[{'op':name,'node_count':n,'status':category(name)}
             for name,n in sorted(ops.items(),key=lambda x:(-x[1],x[0]))]
    blocked=[x for x in catalog if x['status']!='IMPLEMENTED_ELEMENTARY_TESTED_ONLY']
    return {'schema':'MathScope.M3.OriginalSourceIntervalKernelBacklog/1',
       'original_pr30_commit':m.get('original_pr30_commit'),
       'run_commit':m.get('executing_commit'),
       'source_node_stream_sha256':m.get('node_stream_sha256'),
       'first_fivemap_node_count':m['node_count'],
       'distinct_source_operators':len(catalog),
       'elementary_node_count':sum(x['node_count'] for x in catalog if x not in blocked),
       'unsupported_node_count':sum(x['node_count'] for x in blocked),
       'all_source_operations':catalog,'blocking_operator_classes':blocked,
       'first_blocking_operator_by_population':blocked[0]['op'] if blocked else None,
       'actual_final_A_b_p_graph_included':False,
       'actual_final_67_jet_intervals_certified':0,
       'mathematical_analytic_conditions_proved':False,
       'source_replay_archive_independently_sha256_verified_by_this_tool':False,
       'classification':'COVERAGE_PLANNING_ONLY_NOT_NUMERIC_CERTIFICATION',
       'release':'HOLD'}
def main():
    p=argparse.ArgumentParser()
    p.add_argument('manifest',type=Path)
    p.add_argument('--out',type=Path)
    args=p.parse_args()
    r=audit(json.loads(args.manifest.read_text()))
    if args.out:
        args.out.parent.mkdir(parents=True,exist_ok=True)
        args.out.write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'source_nodes':r['first_fivemap_node_count'],
       'operator_types':r['distinct_source_operators'],
       'unimplemented_classes':len(r['blocking_operator_classes']),
       'source_specific_final67':0,'release':'HOLD'}))
if __name__=='__main__':main()
