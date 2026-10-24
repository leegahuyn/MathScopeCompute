#!/usr/bin/env python3
"""SHA exact base coordinate identities for 4578 sums of squares plus 56 inverses.

No assumption on exponent base, absolute value, support, or inverse denominator
is inferred merely from its AST operation. The original 4.42M-node digest is
replayed before any mathematical claim is made.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from collections import Counter
from audit_original_114_ast_call_ledger import EXPECTED_GRAPH_SHA
from audit_original_114_native_X_argument_shapes import demand

def audit(graph_dir,halfsums,products):
    h=json.loads(Path(halfsums).read_text(encoding='utf8'))
    p=json.loads(Path(products).read_text(encoding='utf8'))
    demand(h['schema']=='MathScope.M3.NativeX4578HalfSumActualAddends/1'
       and p['schema']=='MathScope.M3.NativeX4714ImmediateFactorShapes/1'
       and h['original_graph_sha256']==EXPECTED_GRAPH_SHA
       and p['source_graph_SHA256']==EXPECTED_GRAPH_SHA
       and h['power_exponents_weighted_by_native_call_occurrence']=={'2':9156}
       and p['inverse_times_power_exponents']=={'2':56}
       and p['inverse_product_denominator_AST_nodes']=={'622822':56},
       'Unverified original real quadratic arguments')
    all_bases=Counter()
    for row in h['exact_original_half_sum_binding_records']:
        demand(len(row['actual_addends'])==2,'Original half sum not binary')
        for x in row['actual_addends']:
            demand(x['op']=='integer_power' and x['args'][1]==2,
                   'Original half-sum term ceased to be a square')
            all_bases[x['args'][0]]+=row['native_call_occurrences']
    demand(sum(all_bases.values())==9156,'Source 4578*2 squared bases missing')
    original_den={int(k):v for k,v in p['inverse_product_denominator_AST_nodes'].items()}
    want=set(all_bases)|set(original_den)|{24,622820}
    found={};digest=hashlib.sha256();count=0
    with gzip.open(Path(graph_dir)/'original-source-nodes.jsonl.gz','rb') as stream:
        for i,line in enumerate(stream):
            digest.update(line)
            if i==0:
                demand(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                       'Incorrect original graph header')
                continue
            node_id=i-1;count+=1
            if node_id in want:found[node_id]=json.loads(line)
    demand(count==4420257 and digest.hexdigest()==EXPECTED_GRAPH_SHA,
           'Actual native quadratic bases not grounded in SHA-original graph')
    demand(set(found)==want,'Missing source-native quadratic base operand')
    kinds=Counter();coords=Counter();sources=Counter()
    examples=[]
    for node_id,weight in sorted(all_bases.items()):
        n=found[node_id]
        kinds[n['op']]+=weight
        if n['op']=='coordinate':coords[n['args'][0]]+=weight
        if n['op']=='source_parameter':sources[n['args'][0]]+=weight
        examples.append({'base_node_id':node_id,'op':n['op'],'args':n['args'],'occurrences':weight})
    demand(found[24]=={'op':'rational','args':['2','1']},
           'Original common inverse denominator scalar is no longer exactly 2')
    demand(found[622822]=={'op':'multiply','args':[24,622820]},
           'Original common inverse denominator no longer 2 * source node 622820')
    denominator=[{'source_node_id':node_id,'node':found[node_id],
                  'native_call_occurrences':weight}
                 for node_id,weight in sorted(original_den.items())]
    return {
      'schema':'MathScope.M3.NativeSquaredActualCoordinateAndDenominator/1',
      'graph_sha256':EXPECTED_GRAPH_SHA,
      'half_sum_square_base_occurrences':9156,
      'distinct_quadratic_base_source_nodes':len(all_bases),
      'square_base_operator_kind_counts':dict(sorted(kinds.items())),
      'square_base_original_coordinate_name_counts':dict(sorted(coords.items())),
      'square_base_original_source_parameter_counts':dict(sorted(sources.items())),
      'exact_square_base_source_AST_nodes':examples,
      'inverse_56_actual_X_denominator_AST_description':denominator,
      'inverse_denominator_remaining_factor_original_node_id':622820,
      'inverse_denominator_remaining_factor_source_AST_node':found[622820],
      'conditional_quadratic_Y_upper':'For real a,b and Lambda>0, Lambda*(a²+b²)/2<=41/10 iff a²+b²<=41/(5 Lambda)',
      'base_realness_and_support_for_all_actual_native_calls_proved':False,
      'inverse_denominator_nonzero_positive_proved':False,
      'original_114_global_Y_bound_newly_certified':0,
      'original_523_Y_certified':33,'original_523_Y_OPEN':490,
      'actual_67_final_jet_intervals':0,
      'M3':'62/64','M4':'0/16','release':'HOLD'
    }
if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True)
    p.add_argument('--halfsums',required=True)
    p.add_argument('--product-factors',required=True)
    p.add_argument('--output')
    a=p.parse_args()
    r=audit(a.graph_dir,a.halfsums,a.product_factors)
    if a.output:Path(a.output).write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({k:v for k,v in r.items() if k!='exact_square_base_source_AST_nodes'},indent=2,ensure_ascii=False))
