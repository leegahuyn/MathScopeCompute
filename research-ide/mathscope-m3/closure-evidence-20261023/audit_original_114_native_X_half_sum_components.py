#!/usr/bin/env python3
"""SHA-exact two addends of 4578 native X=(A+B)/2 source argument calls.

This labels the two *actual* source AST operands and proves the elementary
convex interval transport conditional on both operand intervals. No interval
is silently assigned to unresolved source coordinates or native call sites.
"""
import argparse,gzip,hashlib,json
from collections import Counter
from pathlib import Path
from fractions import Fraction as Q
from audit_original_114_ast_call_ledger import EXPECTED_GRAPH_SHA
from audit_original_114_native_X_argument_shapes import demand

def audit(folder,factor_json):
    evidence=json.loads(Path(factor_json).read_text(encoding='utf8'))
    demand(evidence['schema']=='MathScope.M3.NativeX4714ImmediateFactorShapes/1'
           and evidence['source_graph_SHA256']==EXPECTED_GRAPH_SHA
           and evidence['original_rational_times_add_coefficients']=={'1/2':4578},
           'Original 4578 native X half-sums not authenticated')
    add_rows={}
    for x in evidence['original_X_product_factor_rows']:
        factors=x['factors']
        ops={z['op'] for z in factors}
        if ops!={'add','rational'}:continue
        add=next(z for z in factors if z['op']=='add')
        rat=next(z for z in factors if z['op']=='rational')
        demand(Q(int(rat['args'][0]),int(rat['args'][1]))==Q(1,2),
               'Source actual argument is not exact half-sum')
        demand(len(add['args'])==2 and all(type(q) is int and q<add['source_node_id'] for q in add['args']),
               'Not original source binary sum')
        add_rows[x['actual_X_product_AST_node_id']]={
            'native_X_actual_product_node_id':x['actual_X_product_AST_node_id'],
            'add_AST_node_id':add['source_node_id'],
            'two_addend_AST_node_IDs':add['args'],
            'native_call_occurrences':x['native_call_occurrences']
        }
    demand(sum(row['native_call_occurrences'] for row in add_rows.values())==4578,
           'Incomplete 4578 actual native half-sum bindings')
    want={j for row in add_rows.values() for j in row['two_addend_AST_node_IDs']}
    found={};h=hashlib.sha256();total=0
    with gzip.open(Path(folder)/'original-source-nodes.jsonl.gz','rb') as stream:
        for line_index,line in enumerate(stream):
            h.update(line)
            if line_index==0:
                demand(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                       'Non-original full source header')
                continue
            n=line_index-1;total+=1
            if n in want:
                found[n]=json.loads(line)
    demand(total==4420257 and h.hexdigest()==EXPECTED_GRAPH_SHA,
           'Original AST not SHA-verified')
    demand(set(found)==want,'Missing an actual native half-sum operand')
    shape_counter=Counter();coordinate_counter=Counter();param_counter=Counter()
    witness_rows=[]
    for x in add_rows.values():
        aa=x['two_addend_AST_node_IDs']
        entries=[dict(node_id=n,**found[n]) for n in aa]
        shape_counter['+'.join(sorted(z['op'] for z in entries))]+=x['native_call_occurrences']
        for e in entries:
            if e['op']=='coordinate':coordinate_counter[e['args'][0]]+=x['native_call_occurrences']
            if e['op']=='source_parameter':param_counter[e['args'][0]]+=x['native_call_occurrences']
        witness_rows.append({**x,'actual_addends':entries,
              'both_real_interval_bounds_proved':False})
    demand(sum(shape_counter.values())==4578,'Original source sum operand count drift')
    return {
       'schema':'MathScope.M3.NativeX4578HalfSumActualAddends/1',
       'original_graph_sha256':EXPECTED_GRAPH_SHA,
       'exact_half_sum_native_expression_call_occurrences':4578,
       'distinct_exact_half_sum_AST_argument_nodes':len(add_rows),
       'two_addend_operator_type_call_counts':dict(sorted(shape_counter.items())),
       'named_coordinate_addend_call_counts':dict(sorted(coordinate_counter.items())),
       'named_parameter_addend_call_counts':dict(sorted(param_counter.items())),
       'conditional_interval_transport':'If A,B in [0,41/(10 Lambda)] then (A+B)/2 in [0,41/(10 Lambda)], Lambda>0',
       'actual_addend_interval_bounds_authenticated':False,
       'exact_original_half_sum_binding_records':witness_rows,
       'source_114_global_Y_bounds_newly_certified':0,
       'original_523_certified_Y_bounds':33,
       'original_523_OPEN_Y_bounds':490,
       'final_67_field_jet_intervals_certified':0,
       'M3':'62/64','M4':'0/16','release':'HOLD'
    }

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True)
    p.add_argument('--product-factors',required=True)
    p.add_argument('--output')
    q=p.parse_args()
    r=audit(q.graph_dir,q.product_factors)
    if q.output:Path(q.output).write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({k:v for k,v in r.items() if k!='exact_original_half_sum_binding_records'},indent=2,ensure_ascii=False))
