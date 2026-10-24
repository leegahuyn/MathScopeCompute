#!/usr/bin/env python3
"""SHA-replay exact operands behind 4714 native actual-X multiplication calls.

A syntactic product X*t does not imply 0<=t<=1. Integral source binders,
chart guards and native parameter binding must be checked separately.
"""
import argparse,gzip,hashlib,json
from collections import Counter
from fractions import Fraction as Q
from prove_original_n3_Q_rho_signs import original_n3_Q_rho_strict_positivity
from pinned_n3_parameter_intervals import pinned_profile
from pathlib import Path
from audit_original_114_ast_call_ledger import EXPECTED_GRAPH_SHA
from audit_original_114_native_X_argument_shapes import UnprovedNativeArgumentShape,demand

def operands(graph_dir,shape_file):
    data=json.loads(Path(shape_file).read_text(encoding='utf8'))
    demand(data['schema']=='MathScope.M3.Original114NativeActualXOperands/1'
           and data['original_source_SHA256']==EXPECTED_GRAPH_SHA
           and data['concrete_X_AST_operator_counts']['multiply']==4714,
           'Actual-X product shape receipt is missing or changed')
    xs={x['node_id']:x for x in data['concrete_X_AST_nodes'] if x['op']=='multiply'}
    source_child_ids={i for x in xs.values() for i in x['operand_source_AST_IDs']}
    children={};h=hashlib.sha256();count=0
    with gzip.open(Path(graph_dir)/'original-source-nodes.jsonl.gz','rb') as stream:
        for j,line in enumerate(stream):
            h.update(line)
            if j==0:
                demand(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                       'Corrupt original source AST header')
                continue
            node_id=j-1;count+=1
            if node_id in source_child_ids:
                node=json.loads(line)
                children[node_id]={'op':node['op'],'args':node['args']}
    demand(count==4420257 and h.hexdigest()==EXPECTED_GRAPH_SHA,'Full original AST no longer SHA-authentic')
    demand(set(children)==source_child_ids,'Missing source product operand nodes')
    # The exact original N3 source parameters yield Lambda*Xa=4, Lambda>0.
    n3=original_n3_Q_rho_strict_positivity()
    profile=pinned_profile()
    demand(n3['Lambda_is_strictly_positive'] and
       profile['parametersExactExpressions']['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]},
       'Original N3 Lambda Xa product identity not established')
    shape_cases=Counter();coord_names=Counter();parameter_names=Counter()
    xa_rational_coefficients=Counter()
    xa_rational_proved_under_5=0
    xa_rational_over_5=0
    parent_rows=[];direct_X_factor=0;zero_factor=0
    for p in sorted(xs):
        row=xs[p]
        factor_ids=row['operand_source_AST_IDs']
        a,c=(children[k] for k in factor_ids)
        times=row['native_call_occurrences']
        shape_cases['*'.join(sorted((a['op'],c['op'])))]+=times
        for v in (a,c):
            if v['op']=='coordinate':coord_names[v['args'][0]]+=times
            if v['op']=='source_parameter':parameter_names[v['args'][0]]+=times
            if v['op']=='rational' and int(v['args'][0])==0:zero_factor+=times
        if {a['op'],c['op']}=={'source_parameter','rational'}:
            par=a if a['op']=='source_parameter' else c
            rat=a if a['op']=='rational' else c
            if par['args'][0]=='Xa':
                multiplier=Q(int(rat['args'][0]),int(rat['args'][1]))
                xa_rational_coefficients[str(multiplier)]+=times
                if Q(0)<=multiplier<=Q(5,4):xa_rational_proved_under_5+=times
                else:xa_rational_over_5+=times
        if 4756 in factor_ids:direct_X_factor+=times
        parent_rows.append({'actual_X_product_AST_node_id':p,
          'native_call_occurrences':times,
          'factors':[{'source_node_id':k,**children[k]} for k in factor_ids]})
    demand(sum(shape_cases.values())==4714,'Original source product count changed')
    demand(xa_rational_proved_under_5+xa_rational_over_5==80,
           'Original Xa rational source expressions not covered')
    return {
       'schema':'MathScope.M3.NativeX4714ImmediateFactorShapes/1',
       'source_graph_SHA256':EXPECTED_GRAPH_SHA,
       'exact_native_X_product_calls':4714,
       'distinct_original_native_X_product_expression_nodes':len(xs),
       'immediate_child_operator_pair_call_counts':dict(sorted(shape_cases.items())),
       'named_immediate_coordinate_operand_call_counts':dict(sorted(coord_names.items())),
       'named_source_parameter_operand_call_counts':dict(sorted(parameter_names.items())),
       'multiply_calls_with_immediate_original_X_coordinate_4756_factor':direct_X_factor,
       'multiply_calls_with_literal_zero_operand':zero_factor,
       'original_rational_times_Xa_coefficient_occurrences':dict(sorted(xa_rational_coefficients.items())),
       'individual_rational_Xa_actual_arguments_proved_0_le_Lambda_X_le_5':xa_rational_proved_under_5,
       'individual_rational_Xa_actual_arguments_not_proved_in_0_to_5':xa_rational_over_5,
       'WARNING_actual_X_argument_bound_is_not_native_call_path_guard_proof':True,
       'original_X_product_factor_rows':parent_rows,
       'coordinate_support_and_integration_interval_proven':False,
       'actual_native_call_path_branch_dominance_proved':False,
       'all_114_global_Y_bounds_newly_certified':0,
       'all_523_original_Y_bounds_certified':33,
       'all_523_original_Y_bounds_open':490,
       'final_67_original_field_jets_certified':0,
       'M3':'62/64','M4':'0/16','release':'HOLD'
    }
if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True);p.add_argument('--shapes',required=True);p.add_argument('--output')
    q=p.parse_args()
    r=operands(q.graph_dir,q.shapes)
    if q.output:Path(q.output).write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({k:v for k,v in r.items() if k!='original_X_product_factor_rows'},indent=2,ensure_ascii=False))
