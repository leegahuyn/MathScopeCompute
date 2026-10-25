#!/usr/bin/env python3
"""Original source Y-dependency contract extraction (no convergence claim).

Reads byte-exact exported post-FiveMap node stream and the independent
semantic-reach list. Authenticates original stream, independently rechecks
all 523 listed calls and derives all 56 Y primitive dependencies.

The script deliberately DOES NOT infer runtime chart support, actual Y bounds,
Phi/u natural series convergence or any M3/M4 acceptance row.
"""
import argparse, collections, gzip, hashlib, io, json, zipfile
from pathlib import Path

EXPECTED_STREAM_SHA="a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269"
EXPECTED_REGISTRY_SHA="bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e"
PFX="MathScope_NEWCHAT/"
STREAM=PFX+"ORIGINAL_FIRST_FIVEMAP_GRAPH/original-source-nodes.jsonl.gz"
MANIFEST=PFX+"ORIGINAL_FIRST_FIVEMAP_GRAPH/original-source-export-manifest.json"
REGISTRY=PFX+"ORIGINAL_FIRST_FIVEMAP_GRAPH/original-source-functions.json"
REACH=PFX+"INDEPENDENT_662_ROOT_REACH/reachable_523_natural_nodes.json"


def extract_contracts(archive: Path):
    with zipfile.ZipFile(archive) as z:
        manifest=json.loads(z.read(MANIFEST))
        registry=z.read(REGISTRY)
        if hashlib.sha256(registry).hexdigest()!=EXPECTED_REGISTRY_SHA:
            raise ValueError('AUTHENTICATION_FAIL: registry SHA')
        if manifest['definitions_sha256']!=EXPECTED_REGISTRY_SHA or manifest['node_stream_sha256']!=EXPECTED_STREAM_SHA:
            raise ValueError('AUTHENTICATION_FAIL: manifest SHA')
        if manifest['scope']!='ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT_NOT_FINAL_A_b_p':
            raise ValueError('AUTHENTICATION_FAIL: changed proof scope')
        rows=json.loads(z.read(REACH)); ids={r['node_id']:r for r in rows}
        if len(ids)!=523 or len(rows)!=523:
            raise ValueError('CALL_SET_FAIL: expected 523 distinct reached natural calls')
        y_ids={r['Y_node_id'] for r in rows}; max_y=max(y_ids)
        node_cache={};sha=hashlib.sha256();count=0;size=0
        with z.open(STREAM) as wrapped, gzip.GzipFile(fileobj=wrapped) as stream:
            header=stream.readline();sha.update(header);size+=len(header)
            if json.loads(header)!={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257}:
                raise ValueError('GRAPH_HEADER_FAIL')
            for i,line in enumerate(stream):
                sha.update(line);size+=len(line);count+=1
                if i<=max_y or i in ids:
                    obj=json.loads(line)
                    if i<=max_y:node_cache[i]=obj
                    if i in ids:
                        row=ids[i]
                        if obj['op']!='actual_natural_series' or obj['args']!=[
                                row['component'],row['Y_node_id'],row['eta_node_id'],row['k'],row['m']]:
                            raise ValueError('CALL_ID_BINDING_FAIL: '+str(i))
            if count!=manifest['node_count'] or size!=manifest['node_stream_uncompressed_bytes']:
                raise ValueError('NODE_SIZE_FAIL')
            if sha.hexdigest()!=EXPECTED_STREAM_SHA:
                raise ValueError('SOURCE_STREAM_SHA_FAIL')

    # The semantic reach list is inherited: verifying each listed AST binding
    # does not itself redo the native-body semantic fixed-point reach proof.
    known={}
    def deps(i):
        if i in known:return known[i]
        n=node_cache[i];op=n['op'];args=n['args']
        if op=='coordinate':answer={('coordinate',args[0])}
        elif op=='source_parameter':answer={('source_parameter',args[0])}
        elif op=='rational':answer=set()
        else:
            if op not in {'multiply','add','exp','inverse','integer_power',
                           'log_positive','sqrt_positive','maximum','sine','cosine'}:
                raise ValueError('Y_EXPRESSION_UNSUPPORTED: '+op+' @'+str(i))
            if op=='integer_power':children=[args[0]]
            elif op in {'exp','inverse','log_positive','sqrt_positive','sine','cosine'}:children=[args[0]]
            else:children=args
            answer=set()
            for c in children:
                if type(c)!=int or c<0 or c>=i:raise ValueError('Y_DAG_CHILD_FAIL')
                answer|=deps(c)
        known[i]=answer
        return answer
    groups=collections.Counter(r['Y_node_id'] for r in rows)
    details=[]
    for y,num in sorted(groups.items(),key=lambda kv:(-kv[1],kv[0])):
        body=node_cache[y]
        d=sorted(deps(y))
        details.append({'Y_node_id':y,'source_Y_node':body,'calls':num,
                        'primitive_dependencies':[{'type':op,'name':name} for op,name in d],
                        'actual_Y_upper_bound_certified_by_this_script':False,
                        'actual_runtime_guard_evaluated':False})
    for d in details:
        if d['Y_node_id']==474:
            if d['source_Y_node']!={'op':'rational','args':['4','1']}:
                raise ValueError('MUTATED_SOURCE_CONST_Y')
        if d['Y_node_id']==4757:
            if d['source_Y_node']!={'op':'multiply','args':[3454,4756]} or node_cache[3454]!={'op':'source_parameter','args':['Lambda']} or node_cache[4756]!={'op':'coordinate','args':['X']}:
                raise ValueError('MUTATED_SOURCE_LAMBDA_X')
    classes={'constant_Y_4_calls':groups.get(474,0),
             'literal_Lambda_times_X_calls':groups.get(4757,0),
             'Y_expressions_with_coordinate_dependence':sum(any(x['type']=='coordinate' for x in d['primitive_dependencies']) for d in details),
             'Y_calls_with_coordinate_dependence':sum(d['calls'] for d in details if any(x['type']=='coordinate' for x in d['primitive_dependencies'])),
             'Y_calls_without_coordinate_dependence':sum(d['calls'] for d in details if not any(x['type']=='coordinate' for x in d['primitive_dependencies']))}
    if len(groups)!=56 or sum(groups.values())!=523 or classes['constant_Y_4_calls']!=15 or classes['literal_Lambda_times_X_calls']!=27:
        raise ValueError('SOURCE_CENSUS_DRIFT')
    components=dict(sorted(collections.Counter(r['component'] for r in rows).items()))
    if components!={'Phi':254,'average':93,'u':176}:raise ValueError('SOURCE_COMPONENT_DRIFT')
    return {'schema':'MathScope.M3.Original523NaturalYDependencyContracts/1',
            'source_stream_sha256':EXPECTED_STREAM_SHA,'source_registry_sha256':EXPECTED_REGISTRY_SHA,
            'original_first_FiveMap_nodes':count,'semantic_reach_list_authenticated_against_source_nodes':True,
            'semantic_reach_independently_redone':False,'reachable_natural_calls':len(rows),
            'distinct_source_Y_nodes':len(groups),'components':components,'structural_classes':classes,
            'Y_nodes':details,'prior_original_Y_verified':33,'prior_original_Y_OPEN':490,
            'newly_certified_Y_upper_bounds':0,'newly_certified_final_source_jets':0,
            'final_C_field_native_domains_closed':False,'M3':'62/64','M4':'0/16','release':'HOLD',
            'next_actual_math_contract':'For each of 56 Y nodes, bind primitive coordinate and parameter intervals to ORIGINAL active native support and prove actual Y domain, including transformed free-coordinate and mesh-switched callers; then bound source Phi/u tails independently.'}

def main():
    p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);p.add_argument('--out',type=Path)
    a=p.parse_args();result=extract_contracts(a.archive)
    if a.out:a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'source_sha':result['source_stream_sha256'],'calls':result['reachable_natural_calls'],
                      'Y_nodes':result['distinct_source_Y_nodes'],'classes':result['structural_classes'],
                      'new_certified_Y_bounds':0,'release':'HOLD'},ensure_ascii=False))
if __name__=='__main__':main()
