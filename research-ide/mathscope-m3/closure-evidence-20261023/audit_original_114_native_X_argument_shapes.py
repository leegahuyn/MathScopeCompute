#!/usr/bin/env python3
"""Replay exact original AST operands of native formal-X actual substitutions.

Depends on the SHA-replayed binding frontier. Distinguishes coordinate,
rational, and multiplication actual argument *syntax*. In particular, an
arbitrary multiplication node does NOT show 0<=X<=5/Lambda, since sign
and interval range of both factors still require proofs.
"""
import argparse,gzip,hashlib,json
from collections import Counter
from fractions import Fraction
from pathlib import Path
from audit_original_114_ast_call_ledger import EXPECTED_GRAPH_SHA,EXPECTED_REG_SHA

class UnprovedNativeArgumentShape(ValueError):pass
def demand(v,msg):
    if not v:raise UnprovedNativeArgumentShape(msg)

def describe(node_id,node):
    op=node['op'];args=node['args']
    if op=='coordinate':
        demand(isinstance(args,list) and len(args)==1 and type(args[0]) is str,'bad actual coordinate')
        return {'node_id':node_id,'op':op,'name':args[0]}
    if op=='rational':
        demand(len(args)==2,'bad actual exact rational')
        z=Fraction(int(args[0]),int(args[1]))
        return {'node_id':node_id,'op':op,'numerator':z.numerator,
                'denominator':z.denominator,'exactly_zero':z==0}
    if op=='multiply':
        demand(len(args)==2 and all(type(x) is int and 0<=x<node_id for x in args),
               'bad actual source product')
        return {'node_id':node_id,'op':op,'operand_source_AST_IDs':args,
                'factor_domains_checked':False}
    raise UnprovedNativeArgumentShape('Unexpected actual X AST kind: '+op)

def audit(graph_dir,binding_receipt_file):
    graph_dir=Path(graph_dir)
    b=json.loads(Path(binding_receipt_file).read_text(encoding='utf8'))
    demand(b['schema']=='MathScope.M3.NativeExpressionFormalActual114Frontier/1'
           and b['original_graph_sha256']==EXPECTED_GRAPH_SHA
           and b['original_registry_sha256']==EXPECTED_REG_SHA
           and b['original_114_global_Y_upper_newly_certified']==0,
           'Unauthenticated binding receipt or false Y claim')
    calls=b['registered_native_expression_call_counts']
    demand(calls['native_expression_calls_with_original_114_in_registered_body']==5545
       and calls['native_expression_calls_with_direct_formal_X_slot']==5545
       and calls['native_expression_calls_with_substituted_formal_X']==5395
       and calls['native_expression_calls_with_formal_X_actual_identity']==150,
       'Original source 5545-call X substitution frontier drifted')
    targets=b['actual_X_argument_AST_node_ID_and_count']
    ensure_unique={x['node_id']:x['calls'] for x in targets}
    demand(len(targets)==len(ensure_unique)==b['distinct_X_actual_argument_AST_nodes'],
           'Duplicate or incomplete actual native X argument IDs')
    demand(sum(ensure_unique.values())==5545,'X native argument call coverage incomplete')
    have={};hash_data=hashlib.sha256();nodes=0
    with gzip.open(graph_dir/'original-source-nodes.jsonl.gz','rb') as f:
        for line_id,line in enumerate(f):
            hash_data.update(line)
            if line_id==0:
                demand(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                       'Wrong original AST header')
                continue
            i=line_id-1;nodes+=1
            if i in ensure_unique:
                have[i]=describe(i,json.loads(line))
    demand(nodes==4420257 and hash_data.hexdigest()==EXPECTED_GRAPH_SHA,
           'Original complete source graph changed')
    demand(len(have)==len(ensure_unique),'Missing concrete X argument AST nodes')
    counts=Counter()
    zero_count=0
    for i,row in have.items():
        calls=ensure_unique[i];counts[row['op']]+=calls
        if row.get('exactly_zero',False):zero_count+=calls
    demand(dict(counts)==b['X_actual_argument_source_operator_counts'],
           'Actual AST X argument type census mismatch')
    return {
      'schema':'MathScope.M3.Original114NativeActualXOperands/1',
      'original_source_SHA256':EXPECTED_GRAPH_SHA,
      'original_function_registry_SHA256':EXPECTED_REG_SHA,
      'binding_stream_SHA256':b['ordered_native_argument_mapping_sha256'],
      'distinct_actual_X_AST_nodes':len(have),
      'native_expression_X_argument_calls':5545,
      'concrete_X_AST_operator_counts':dict(counts),
      'exact_literal_X_equals_zero_binding_occurrences':zero_count,
      'concrete_X_AST_nodes':[dict(have[i],native_call_occurrences=ensure_unique[i])
                                for i in sorted(have)],
      'source_multiply_factor_ranges_checked':False,
      'nonlinear_picard_implicit_and_ODE_bindings_checked':False,
      'native_root_to_114_runtime_guards_proved':False,
      'original_114_global_Y_upper_newly_certified':0,
      'original_523_Y_bound_certified':33,
      'original_523_Y_bound_OPEN':490,
      'final_67_field_jet_intervals_certified':0,
      'M3':'62/64','M4':'0/16','release':'HOLD',
    }
if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True)
    p.add_argument('--bindings',required=True)
    p.add_argument('--output')
    q=p.parse_args()
    r=audit(q.graph_dir,q.bindings)
    if q.output:Path(q.output).write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print(json.dumps({k:v for k,v in r.items() if k!='concrete_X_AST_nodes'},indent=2,ensure_ascii=False))
