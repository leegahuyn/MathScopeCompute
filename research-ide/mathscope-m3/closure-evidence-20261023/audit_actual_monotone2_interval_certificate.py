#!/usr/bin/env python3
"""SHA-pinned actual source monotone root #622820 system 2 certificate frontier.

This reads the original 4.42M source graph and authentic native registry. It
pins *all* original bracket/body/derivative nodes and the two actual arguments.
A bracket advertised by the registry is not an evaluated interval certificate.
Promotion occurs only if the exact original LEFT expression can be proved
strictly positive under the preexisting N3 parameter hypotheses AND the root
is certified to exist in its bracket for these actual arguments.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from fractions import Fraction as F

GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
ROOT=622820
ROOT_SYSTEM=2
NATIVE_ARGS=[622803,622804]
COMMON_DENOMINATOR=622822

def demand(condition,reason):
    if not condition:raise ValueError('ORIGINAL_MONOTONE_2_UNPROVED: '+reason)

def ancestry(node_id, nodes,depth=3):
    if node_id not in nodes:return {'id':node_id,'not_in_excerpt':True}
    n=nodes[node_id]
    x={'id':node_id,'op':n['op'],'args':n['args']}
    if depth<=0:return x
    if n['op'] in ('add','multiply','inverse','integer_power','exp','sqrt_positive','log_positive'):
        refs=[a for a in n['args'][:2] if type(a) is int]
        x['source_children']=[ancestry(q,nodes,depth-1) for q in refs]
    return x

def audit(folder):
    folder=Path(folder)
    manifest=json.loads((folder/'original-source-export-manifest.json').read_text())
    demand(manifest['node_stream_sha256']==GRAPH and manifest['definitions_sha256']==REG
           and manifest['node_count']==4420257 and not manifest['final_all_cycle_A_b_p'],
           'original first-FiveMap provenance')
    registry_bytes=(folder/'original-source-functions.json').read_bytes()
    demand(hashlib.sha256(registry_bytes).hexdigest()==REG,'native registry SHA')
    registry=json.loads(registry_bytes)['base']['base']
    systems=json.loads(registry['monotone'])
    demand(len(systems)>ROOT_SYSTEM,'original monotone system 2 missing')
    s=systems[ROOT_SYSTEM]
    required=('variable','parameters','body','left','right','derivativeLower','derivativeUpper')
    demand(all(k in s for k in required),'actual monotone root missing bracket or derivative')
    demand(type(s['parameters']) is list and len(s['parameters'])==2,
           'root system 2 parameter arity does not match two actual source arguments')
    roots=[s['variable'],s['body'],s['left'],s['right'],s['derivativeLower'],s['derivativeUpper'],*s['parameters'],ROOT,COMMON_DENOMINATOR,*NATIVE_ARGS]
    demand(all(type(n) is int and 0<=n<4420257 for n in roots),'source root ID invalid')
    selected={};all_sha=hashlib.sha256();count=0
    # Capture first 4 expression layers of all formal/actual endpoints by 
    # a SHA verified topological parent-to-child backward walk (stream stored in dict
    # only for subgraph ending at ~622822, not full 4.42M nodes).
    node_stop=max(roots)
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as stream:
        for j,line in enumerate(stream):
            all_sha.update(line)
            if j==0:
                demand(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                       'wrong source nodes header')
                continue
            n=j-1;count+=1
            if n<=node_stop:
                obj=json.loads(line)
                selected[n]=obj
    demand(count==4420257 and all_sha.hexdigest()==GRAPH,'original source graph sha/length')
    demand(selected[ROOT]=={'op':'actual_monotone_root','args':[2,*NATIVE_ARGS]},
           'original monotone source root changed')
    demand(selected[COMMON_DENOMINATOR]=={'op':'multiply','args':[24,ROOT]},
           'actual denominator not original 2*root')
    demand(selected[24]=={'op':'rational','args':['2','1']},
           'denominator scalar differs from exact rational 2')
    formal=[{'id':q,'node':selected[q]} for q in s['parameters']]
    actual=[{'id':q,'node':selected[q]} for q in NATIVE_ARGS]
    endpoints={k:{'source_node_id':s[k],
                  'source_tree':ancestry(s[k],selected,4)}
               for k in ('left','right','derivativeLower','derivativeUpper','body')}
    summary={
      'schema':'MathScope.M3.MonotoneRoot2ActualArgumentInterval/1',
      'graph_sha256':GRAPH,'registry_sha256':REG,
      'original_root_node_id':ROOT,'original_system_id':ROOT_SYSTEM,
      'actual_arguments':actual,'formal_parameter_nodes':formal,
      'defining_coordinate_node':{'id':s['variable'],'node':selected[s['variable']]},
      'source_definition_root_ids':{k:s[k] for k in required if k not in ('parameters',)},
      'original_endpoint_and_derivative_source_trees':endpoints,
      'actual_native_system2_source_fields':{k:v for k,v in s.items() if k not in required},
      'original_56_derived_denominator_node':COMMON_DENOMINATOR,
      'root_positive_from_authenticated_bracket':False,
      'actual_parameter_substituted_bracket_sign_certified':False,
      'endpoint_signs_and_derivative_bounds_evaluated':False,
      'source_monotone_root_uniqueness_and_existence_certified':False,
      'exact_numerator_Y_lt_41_over_10_certified':False,
      'actual_56_root_native_argument_global_Y_certified':0,
      'source_114_global_natural_Y_newly_certified':0,
      'source_523_Y_certified':33,'source_523_Y_OPEN':490,
      'final_67_jet_intervals':0,'M3':'62/64','M4':'0/16','release':'HOLD'
    }
    return summary

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True)
    p.add_argument('--output')
    a=p.parse_args()
    result=audit(a.graph_dir)
    if a.output:Path(a.output).write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(result,indent=2,ensure_ascii=False))
