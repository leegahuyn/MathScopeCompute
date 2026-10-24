#!/usr/bin/env python3
"""Full SHA-verified original 4,420,257-node stream replay for the 114 X-calls.

This independently re-reads each expected source AST natural-series node from
the archived GitHub Actions run 39988632325. The exact 114-node ID inventory
was obtained from earlier native-semantic root census of 523 source calls.
This checker verifies node existence, components, k/m, eta, graph bytes, and
the source-normalization inventory; it does NOT redo native root reachability,
infer branch evaluation guards, prove Y<=5, or certify final physical jets.
"""
import argparse,gzip,hashlib,json
from collections import Counter
from pathlib import Path

EXPECTED_GRAPH_SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
EXPECTED_REG_SHA='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
EXPECTED_ROWHASH='e563091a33839e5572780a8a1a89bcd1e42b59d52a37fc5b792bf3458f782e79'
EXPECTED_COMPONENTS={'Phi':44,'u':38,'average':32}
EXPECTED_ORDERS={(1,0):18,(1,1):18,(0,0):17,(0,1):17,(0,2):14,
                 (2,0):10,(1,2):8,(2,1):6,(0,3):4,(3,0):2}
# SHA-pinned list from separately completed first-FiveMap native-body reachability,
# grouped by (actual Y_source_node_id). The 8 entries are not 8 certificate claims.
GROUPS={
4757: (4758,4784,5177,5299,6904,7115,9732,11137,11177,11411,11553,24916,24922,24951,24956,24963,25275,25442,25503,50818,51425,74048,74306,74689,77089,77271,77556),
6945: (6947,6963,7020,7158,11431,11487,11579,25019,25039,25056,25349,50883,50970,51011,51039,51078,51599,74117,74144,74148,77116),
25063: (25064,25352,25353,51054,51606,74209,74211,74371),
32495: (32496,32498,32598,32672,33398,33576,33771,33782,36836,36969,37175,53916,54204,56853,56933,69277,69515,69813,69897,69954,105639,105822,106111),
33412: (33414,33430,33487,33601,36853,36908,36995,53946,53971,54054,54235,69323,69350,69354,69411,69564,105666),
50907: (50908,50909,50923,50925,50980,51021),
54061: (54062,54063,54238,69417,69419,69567),
56747: (56748,56750,56858,56938,69836,69902),
}
# exp(log_positive(...)) source guard debt; guard POSITIVE, not a Y upper bound.
POSITIVE_GUARDS={4757:(),6945:(4760,),25063:(4760,),32495:(4756,),
                 33412:(4756,),50907:(4760,),54061:(4756,),56747:(4756,)}
class InvalidSourceLedger(ValueError):pass

def demand(ok,reason):
    if not ok:raise InvalidSourceLedger(reason)

def expected_index():
    ids={}
    for y,group in GROUPS.items():
        for i in group:
            demand(i not in ids, 'duplicate source natural node ID')
            ids[i]=y
    demand(len(GROUPS)==8 and len(ids)==114,'wrong source X ledger size')
    return ids

def verify_rows(rows):
    demand(len(rows)==114 and all(set(x)=={'node_id','component','k','m','Y_node_id','eta_node_id'} for x in rows),'incomplete 114 source rows')
    demand(len({x['node_id'] for x in rows})==114,'duplicate natural source call')
    payload=json.dumps(sorted(rows,key=lambda r:r['node_id']),sort_keys=True,separators=(',',':')).encode()
    digest=hashlib.sha256(payload).hexdigest()
    demand(digest==EXPECTED_ROWHASH,'114 native-reachable original-source call inventory drift')
    demand(dict(Counter(x['component'] for x in rows))==EXPECTED_COMPONENTS,'component inventory drift')
    demand(dict(Counter((x['k'],x['m']) for x in rows))==EXPECTED_ORDERS,'derivative-order inventory drift')
    return digest

def replay(path):
    folder=Path(path)
    manifest=json.loads((folder/'original-source-export-manifest.json').read_text())
    demand(manifest['schema']=='MathScope.M3.SourceGraphReplayManifest/1','manifest schema')
    demand(manifest['node_count']==4420257 and manifest['node_stream_uncompressed_bytes']==188570816,'node budget drift')
    demand(manifest['node_stream_sha256']==EXPECTED_GRAPH_SHA and manifest['definitions_sha256']==EXPECTED_REG_SHA,'source manifest SHA drift')
    reg=(folder/'original-source-functions.json').read_bytes()
    demand(hashlib.sha256(reg).hexdigest()==EXPECTED_REG_SHA,'actual registry SHA mismatch')
    want=expected_index()
    found={}
    digest=hashlib.sha256();size=0;count=0
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as f:
        for line_number,line in enumerate(f):
            digest.update(line);size+=len(line)
            if line_number==0:
                header=json.loads(line)
                demand(header=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},'source graph header mismatch')
                continue
            node_id=line_number-1;count+=1
            if node_id not in want:continue
            node=json.loads(line)
            demand(node['op']=='actual_natural_series' and len(node['args'])==5,'not actual natural-source call at '+str(node_id))
            component,Y,eta,k,m=node['args']
            demand(Y==want[node_id] and eta==2,'wrong original Y or eta node at '+str(node_id))
            demand(component in EXPECTED_COMPONENTS and type(k) is int and type(m) is int and k>=0 and m>=0,'malformed source derivative')
            found[node_id]={'node_id':node_id,'component':component,'k':k,'m':m,'Y_node_id':Y,'eta_node_id':eta}
    demand(count==4420257 and size==188570816,'full original source graph count/length mismatch')
    demand(digest.hexdigest()==EXPECTED_GRAPH_SHA,'full original uncompressed source SHA mismatch')
    demand(set(found)==set(want),'missing native-reachable natural-source call nodes')
    rowhash=verify_rows(list(found.values()))
    guard_calls=sum(len(v) for y,v in GROUPS.items() if POSITIVE_GUARDS[y])
    demand(guard_calls==87,'original positivity guard count drift')
    result={
      'schema':'MathScope.M3.Original114NaturalASTNodeLedger/1',
      'scope':'ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_NOT_FINAL_A_b_p',
      'original_run':39988632325,
      'original_graph_sha256':EXPECTED_GRAPH_SHA,
      'original_registry_sha256':EXPECTED_REG_SHA,
      'original_graph_node_count':count,
      'source_114_ledger_sha256':rowhash,
      'source_114_node_inventory_verified_against_full_original_AST':True,
      'original_native_reachability_of_523_inherited_not_recomputed_here':True,
      'Y_normalization_inherited_from_separate_56_to_43_audit':True,
      'groups':[{ 'Y_id':y,'calls':len(v),'positive_guard_source_nodes':list(POSITIVE_GUARDS[y])}
                 for y,v in sorted(GROUPS.items())],
      'component_counts':EXPECTED_COMPONENTS,
      'derivative_orders':[{'k':k,'m':m,'calls':v} for (k,m),v in sorted(EXPECTED_ORDERS.items())],
      'actual_source_call_nodes':sorted(found.values(),key=lambda x:x['node_id']),
      'guarded_call_count':guard_calls,
      'source_Y_upper_bound_certified_114':0,
      'native_call_branch_and_support_paths_proved':0,
      'source_Y_certified_523':33,'source_Y_open_523':490,
      'actual_67_final_field_jets':0,
      'M3':'62/64','M4':'0/16','release':'HOLD',
    }
    return result

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True)
    p.add_argument('--output')
    args=p.parse_args()
    result=replay(args.graph_dir)
    if args.output:Path(args.output).write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='actual_source_call_nodes'},indent=2,ensure_ascii=False))

if __name__=='__main__':main()
