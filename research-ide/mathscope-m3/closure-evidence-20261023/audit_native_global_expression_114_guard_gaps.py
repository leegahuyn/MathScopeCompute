#!/usr/bin/env python3
"""Exact original native-global-expression-body *potential* bypass census.

This does not evaluate the 11-root native substitutions, prove the 114
series globally defined, or establish actual counterexamples. For each
natural-series AST call we remove its single SHA-audited first selected
piecewise arm (conditional local Y<5 theorem) and identify other surviving
syntactic dependency paths in registered global expression bodies.

Native body ROOT inclusion is only a structural use; actual invocation
coordinates, later guards and call context are not established here.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from collections import Counter
from audit_original_114_first_AST_piecewise_guards import (
    audit_first_AST_piecewise,original_children
)
from audit_original_114_ast_call_ledger import (
    EXPECTED_GRAPH_SHA,EXPECTED_REG_SHA,expected_index
)

class InvalidSourceNativeGuard(ValueError): pass

def require(ok,msg):
    if not ok: raise InvalidSourceNativeGuard(msg)

def audit_native_first_guard_gaps(graph_dir):
    graph_dir=Path(graph_dir)
    prior=audit_first_AST_piecewise(graph_dir)
    ids=sorted(expected_index())
    bit={n:1<<k for k,n in enumerate(ids)}
    by_guard={}
    for record in prior['first_ancestor_records']:
        node=record['piecewise_node_id']
        by_guard.setdefault(node,[]).append(
            (record['original_natural_node_id'],record['arm']))
    require(len(ids)==114 and len(by_guard)==89,
            'Original 114 calls or 89 first selected guards changed')
    mask=[]
    source_sha=hashlib.sha256()
    with gzip.open(graph_dir/'original-source-nodes.jsonl.gz','rb') as stream:
        for line_index,line in enumerate(stream):
            source_sha.update(line)
            if line_index==0:
                head=json.loads(line)
                require(head=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                        'Unexpected full source graph header')
                continue
            node_id=line_index-1
            obj=json.loads(line)
            op,args=obj['op'],obj['args']
            deps=original_children(op,args)
            current=bit.get(node_id,0)
            if op=='smooth_piecewise' and node_id in by_guard:
                require(len(args)==6,'Invalid piecewise source arity')
                parts=[mask[ch] for ch in deps]
                for natural_id,arm in by_guard[node_id]:
                    arm_index={'before':3,'inside':4,'after':5}[arm]
                    to_remove=bit[natural_id]
                    require(parts[arm_index]&to_remove != 0,
                            'Original source call not contained in selected branch')
                    parts[arm_index]&=~to_remove
                for m in parts:current|=m
            else:
                for ch in deps:
                    require(type(ch) is int and 0<=ch<node_id,
                            'Invalid source topological dependency')
                    current|=mask[ch]
            mask.append(current)
    require(len(mask)==4420257 and source_sha.hexdigest()==EXPECTED_GRAPH_SHA,
            'Original full source graph hash changed')
    definitions=(graph_dir/'original-source-functions.json').read_bytes()
    require(hashlib.sha256(definitions).hexdigest()==EXPECTED_REG_SHA,
            'Original native source registration SHA changed')
    source=json.loads(definitions)
    base=source['base']['base']
    globals_=json.loads(base['expression'])
    require(len(globals_)==base['expressionCount'],'Global expression count drift')
    exposed=[]
    union=0
    for i,definition in enumerate(globals_):
        root=definition['body']
        require(type(root) is int and 0<=root<len(mask),
                'Invalid original global expression body root')
        leftovers=mask[root]
        if leftovers:
            union|=leftovers
            exposed.append({
                'native_global_expression_index':i,
                'registered_body_root_node_id':root,
                'calls_with_first_selected_guard_insufficient':[
                    ids[k] for k in range(len(ids)) if leftovers>>k&1],
                'unprotected_structural_call_count':leftovers.bit_count(),
            })
    require(len(exposed)==28 and union.bit_count()==84,
            'Original native definition potential bypass frontier changed')
    require(
        next(x for x in exposed if x['native_global_expression_index']==1)
            ['unprotected_structural_call_count']==84,
        'Global native expression #1 original dependency frontier changed')
    return {
        'schema':'MathScope.M3.OriginalNativeGlobalExpressionFirstGuardGap/1',
        'scope':'FIRST_POST_SIGNED_FIVEMAP; ONLY global expression registrations',
        'source_graph_sha256':EXPECTED_GRAPH_SHA,
        'source_definitions_sha256':EXPECTED_REG_SHA,
        'first_selected_arm_conditional_local_Y_lt_5':114,
        'first_guard_distinct_source_nodes':89,
        'native_global_expression_body_roots_with_additional_paths':28,
        'distinct_original_114_calls_with_unprotected_structural_paths':84,
        'other_original_114_calls_not_exposed_in_this_specific_registry_subset':30,
        'exposed_definition_bodies':exposed,
        'native_invocation_argument_bindings_proved':False,
        'all_root_to_call_paths_checked':False,
        'all_real_chart_supports_proved':False,
        'possible_bypass_not_actual_domain_counterexample':True,
        'global_114_Y_bounds_newly_certified':0,
        'original_523_Y_bounds_certified':33,
        'original_523_Y_bounds_OPEN':490,
        'actual_original_all_A_D_final_fields_constructed':False,
        'actual_67_final_field_jet_intervals_certified':0,
        'M3':'62/64','M4':'0/16','release':'HOLD',
    }

def verify_claims(result):
    require(result.get('schema')=='MathScope.M3.OriginalNativeGlobalExpressionFirstGuardGap/1'
        and result.get('source_graph_sha256')==EXPECTED_GRAPH_SHA
        and result.get('source_definitions_sha256')==EXPECTED_REG_SHA
        and result.get('native_global_expression_body_roots_with_additional_paths')==28
        and result.get('distinct_original_114_calls_with_unprotected_structural_paths')==84
        and result.get('global_114_Y_bounds_newly_certified')==0
        and result.get('original_523_Y_bounds_OPEN')==490
        and result.get('actual_67_final_field_jet_intervals_certified')==0
        and result.get('native_invocation_argument_bindings_proved') is False
        and result.get('release')=='HOLD',
        'Native first-guard audit cannot be promoted to global proof')
    return True

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True)
    p.add_argument('--output')
    args=p.parse_args()
    result=audit_native_first_guard_gaps(args.graph_dir)
    verify_claims(result)
    if args.output:
        Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='exposed_definition_bodies'},ensure_ascii=False,indent=2))
