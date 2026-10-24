#!/usr/bin/env python3
"""Concrete actual source root(2,Z,T) call inventory on original 4.42M AST.

This is a targeted attempt at the final OPEN native argument-image transport:
does any actual root invocation already carry Z=s^D eta and
T=s(1-eta^2) expressions rather than unbound free coordinates?
Do not treat any AST op pair alone as verified chart image.
"""
import argparse,gzip,hashlib,json
from collections import Counter
from pathlib import Path

SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
def demand(v,m):
    if not v:raise ValueError('MONOTONE2_GLOBAL_CALL_IMAGE_OPEN: '+m)
def audit(dir):
    path=Path(dir)
    m=json.loads((path/'original-source-export-manifest.json').read_text())
    demand(m['node_stream_sha256']==SHA and m['definitions_sha256']==REG
           and m['node_count']==4420257 and m['final_all_cycle_A_b_p'] is False,
           'incorrect original first FiveMap manifest')
    call_sites=[];hash_=hashlib.sha256();count=0
    with gzip.open(path/'original-source-nodes.jsonl.gz','rb') as f:
        for j,line in enumerate(f):
            hash_.update(line)
            if j==0:
                demand(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},'bad source header')
                continue
            count+=1
            if b'"actual_monotone_root"' not in line:continue
            n=json.loads(line)
            if n['op']=='actual_monotone_root' and n['args'][0]==2:
                demand(len(n['args'])==3 and all(type(v) is int and 0<=v<j-1 for v in n['args'][1:]),
                       'root2 actual argument IDs not original AST')
                call_sites.append({'source_root_call_id':j-1,'Z_actual_ID':n['args'][1],'T_actual_ID':n['args'][2]})
    demand(count==4420257 and hash_.hexdigest()==SHA,'original full source SHA mismatch')
    demand(any(x['source_root_call_id']==622820 and x['Z_actual_ID']==622803 and x['T_actual_ID']==622804 for x in call_sites),
           'original monotone2 source call missing')
    referenced={x[k] for x in call_sites for k in ('Z_actual_ID','T_actual_ID')}
    nodes={}
    with gzip.open(path/'original-source-nodes.jsonl.gz','rb') as f:
        next(f)
        for i,line in enumerate(f):
            if i in referenced:nodes[i]=json.loads(line)
            if len(nodes)==len(referenced):break
    demand(len(nodes)==len(referenced),'missing root2 actual argument original nodes')
    pairs=Counter()
    for x in call_sites:
        x['Z_actual_source_node']=nodes[x['Z_actual_ID']]
        x['T_actual_source_node']=nodes[x['T_actual_ID']]
        pairs[nodes[x['Z_actual_ID']]['op']+'|'+nodes[x['T_actual_ID']]['op']]+=1
    return {
      'schema':'MathScope.M3.ActualMonotone2AllSourceCallsImageGate/1',
      'original_graph_sha256':SHA,
      'original_registry_sha256':REG,
      'actual_monotone_system_2_call_count':len(call_sites),
      'actual_monotone_system_2_distinct_source_argument_pairs':len({(x['Z_actual_ID'],x['T_actual_ID']) for x in call_sites}),
      'actual_Z_T_operand_operator_call_counts':dict(sorted(pairs.items())),
      'source_actual_system2_calls':call_sites,
      'all_source_argument_pairs_certified_to_be_in_original_slow_chart_image':False,
      'monotone_image_domain_analytic_inverse_certificate_exists':True,
      'original_56_divisor_native_chart_calls_global_support_certified':0,
      'source_523_Y_certified':33,'source_523_Y_OPEN':490,
      'final_67_jets':0,'M3':'62/64','M4':'0/16','release':'HOLD'
    }
if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True);p.add_argument('--output')
    a=p.parse_args()
    result=audit(a.graph_dir)
    if a.output:Path(a.output).write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='source_actual_system2_calls'},indent=2,ensure_ascii=False))
    print('FIRST_ACTUAL_MONOTONE2_CALLS',json.dumps(result['source_actual_system2_calls'][:7]))
