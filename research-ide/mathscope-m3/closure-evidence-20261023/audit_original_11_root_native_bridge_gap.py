#!/usr/bin/env python3
"""Why original 114 source-call guards are not yet 11-root certificates.

The 11 original first-FiveMap physical roots have ZERO 114-X-series call
descendants through *ordinary syntactic AST edges alone*. The previously
authenticated 523-call native-body semantic closure is a different traversal:
native definition-body edges and argument bindings are indispensable.
Zero direct syntactic descendants is NOT a proof of global non-use.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from audit_original_114_ast_call_ledger import replay,expected_index,EXPECTED_GRAPH_SHA
from audit_original_114_first_AST_piecewise_guards import original_children

class SourceRootClosureMismatch(ValueError):pass
ROOT_COUNT=11
def root_native_bridge_gap(graph_dir):
    baseline=replay(graph_dir)
    graph_dir=Path(graph_dir)
    manifest=json.loads((graph_dir/'original-source-export-manifest.json').read_text())
    roots=manifest['original_root_ids']
    if len(roots)!=ROOT_COUNT or len(set(roots))!=ROOT_COUNT:
        raise SourceRootClosureMismatch('Must be the exact 11 real first-FiveMap physical root IDs')
    ids=sorted(expected_index())
    bits={n:1<<k for k,n in enumerate(ids)}
    masks=[];result={};h=hashlib.sha256()
    with gzip.open(graph_dir/'original-source-nodes.jsonl.gz','rb') as f:
        for line_index,line in enumerate(f):
            h.update(line)
            if line_index==0:
                if json.loads(line)['node_count']!=4420257:
                    raise SourceRootClosureMismatch('Wrong node count header')
                continue
            i=line_index-1
            n=json.loads(line)
            v=bits.get(i,0)
            for child in original_children(n['op'],n['args']):
                if type(child) is not int or not 0<=child<i:
                    raise SourceRootClosureMismatch('Corrupted original direct AST child')
                v|=masks[child]
            masks.append(v)
            if i in roots:
                result[i]={'root_id':i,'root_op':n['op'],
                    'original_114_call_nodes_directly_reachable':v.bit_count()}
    if len(masks)!=4420257 or h.hexdigest()!=EXPECTED_GRAPH_SHA:
        raise SourceRootClosureMismatch('Original 4,420,257 source AST SHA verification failed')
    if len(result)!=11 or any(x['original_114_call_nodes_directly_reachable']!=0 for x in result.values()):
        raise SourceRootClosureMismatch('Direct AST-vs-native frontier unexpectedly changed')
    return {
      'schema':'MathScope.M3.Original11RootsRequireNativeBodyBridgesTo114/1',
      'original_graph_sha256':EXPECTED_GRAPH_SHA,
      'original_114_AST_source_ledger_sha256':baseline['source_114_ledger_sha256'],
      'original_physical_roots':[result[r] for r in roots],
      'source_11_roots_direct_AST_descendant_114_call_count':0,
      'original_114_semantic_calls_reachable_in_separate_source_native_audit':114,
      'necessary_next_proof':'native-body root-to-source-call edge traversal with argument substitution and path-dependent piecewise guards',
      'native_body_path_guard_dominance_proved':False,
      'global_original_Y_upper_newly_certified':0,
      'all_523_original_Y_certified':33,'all_523_original_Y_OPEN':490,
      'final_67_jets':0,'M3':'62/64','M4':'0/16','release':'HOLD',
    }

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--graph-dir',required=True);p.add_argument('--output')
    a=p.parse_args()
    out=root_native_bridge_gap(a.graph_dir)
    if a.output:Path(a.output).write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(out,indent=2,ensure_ascii=False))
