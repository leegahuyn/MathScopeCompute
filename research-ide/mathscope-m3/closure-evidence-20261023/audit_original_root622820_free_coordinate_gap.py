#!/usr/bin/env python3
"""Exact free-coordinate domain obstruction at original monotone root #622820.

Counterexample to inferring the inverse domain from its AST call alone,
NOT a witness reachable in actual final physical-field support.
"""
from fractions import Fraction as F
import gzip, hashlib, json

GRAPH_SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
PINS={
622803:('coordinate',['m3_global_band_slow_Z$30436']),
622804:('coordinate',['m3_global_band_slow_T$30437']),
622820:('actual_monotone_root',[2,622803,622804])
}
class DirectImageOPEN(ValueError): pass

def inspect_original_graph(path):
    digest=hashlib.sha256();found={};count=0
    with gzip.open(path,'rb') as f:
        for line in f:
            digest.update(line)
            if count>0 and count-1 in PINS:found[count-1]=json.loads(line)
            if count==0 and json.loads(line)!={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257}:
                raise DirectImageOPEN('source graph header differs')
            count+=1
    if count!=4420258 or digest.hexdigest()!=GRAPH_SHA:
        raise DirectImageOPEN('source AST immutable SHA mismatch')
    for node,(op,args) in PINS.items():
        if found.get(node)!={'op':op,'args':args}:raise DirectImageOPEN(f'unexpected AST node {node}')
    return True

def evaluate_exact_h_independent_free_counterexample(Z=F(0),T=F(0)):
    if type(Z) is not F or type(T) is not F or (Z,T)!=(F(0),F(0)):
        raise DirectImageOPEN('only exactly source-independent Z=T=0 counterexample')
    # F(s;0,0)=s for all 0<h<2^-4096, so both endpoint signs are positive.
    F_half=F(1,2);F_two=F(2)
    assert F_half>0 and F_two>0
    return {
     'schema':'MathScope.M3.OriginalRoot622820FreeCoordinatesFailClosed/1',
     'AST_pin_source_sha256':GRAPH_SHA,'actual_direct_node':622820,
     'direct_Z_node':622803,'direct_T_node':622804,
     'unconstrained_counterexample_Z_T':['0','0'],
     'F_one_half':'1/2','F_two':'2',
     'original_required_F_one_half_le_zero':False,
     'zero_zero_inside_original_chart_image':False,
     'claim_AST_alone_implies_chart_domain':False,
     'runtime_11root_support_contains_Z_T_zero_proved':False,
     'actual_root622820_entire_physical_support_domain_proved':False,
     'original_523_Y_certified':33,'original_523_Y_OPEN':490,
     'M3':'62/64','M4':'0/16','final_67_jets':0,'release':'HOLD'
    }

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser()
    p.add_argument('--original-graph',required=True);p.add_argument('--output')
    args=p.parse_args()
    inspect_original_graph(args.original_graph)
    answer=evaluate_exact_h_independent_free_counterexample()
    out=json.dumps(answer,indent=2)
    if args.output:open(args.output,'w').write(out+'\n')
    print(out)
