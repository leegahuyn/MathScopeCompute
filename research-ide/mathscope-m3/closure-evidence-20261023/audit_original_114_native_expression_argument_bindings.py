#!/usr/bin/env python3
"""SHA-bound individual native-expression actual-argument audit for 114 source calls.

First-FiveMap 4,420,257 source AST and original expression-system definitions.
This checks each recorded expression native call node: definition provenance,
parameter arity, derivative order, uniqueness of formal slots, *exact actual*
source-node IDs, and which source natural-series nodes its registered BODY
contains. It deliberately does not infer dominance, actual numerical bounds,
implicit/picard native parameter passing, or valid runtime support.
"""
import argparse,gzip,hashlib,json
from collections import Counter,defaultdict
from pathlib import Path
from audit_original_114_ast_call_ledger import EXPECTED_GRAPH_SHA,EXPECTED_REG_SHA,expected_index,GROUPS
from audit_original_114_first_AST_piecewise_guards import original_children

OPS={
  'actual_expression_partial':'global',
  'm3_aux_expression_partial':'aux',
  'm3_coupled_expression_partial':'coupled',
  'm3_forced_expression_partial':'forced',
}
SOURCE_X_COORD_NODE=4756
SOURCE_ETA_COORD_NODE=2
class OriginalNativeBindingGap(ValueError):pass
def ensure(cond,msg):
    if not cond:raise OriginalNativeBindingGap(msg)

def load_expression_registry(folder):
    raw=(folder/'original-source-functions.json').read_bytes()
    ensure(hashlib.sha256(raw).hexdigest()==EXPECTED_REG_SHA,'source native registry changed')
    snapshot=json.loads(raw)
    base=snapshot['base']
    origin=base['base']
    defs={
     'global':json.loads(origin['expression']),
     'aux':json.loads(base['expressionDefinitions']),
     'coupled':json.loads(snapshot['definitions'])[0],
     'forced':json.loads(snapshot['definitions'])[4],
    }
    ensure(len(defs['global'])==origin['expressionCount'] and len(defs['aux'])==base['expressions'],
           'original expression definition count drift')
    return defs

def choose_def(op,sid,defs):
    family=OPS[op]
    if family=='global':
        ensure(type(sid) is int and 0<=sid<len(defs[family]),'bad global source expression ID')
        return defs[family][sid],str(sid)
    if family=='aux':
        ensure(type(sid) is int and sid<0 and -1-sid<len(defs[family]),'bad aux source expression ID')
        return defs[family][-1-sid],str(sid)
    prefix='coupled-expression:' if family=='coupled' else 'forced-expression:'
    ensure(type(sid) is str and sid.startswith(prefix),'bad coupled source expression ID')
    idx=int(sid[len(prefix):])
    ensure(0<=idx<len(defs[family]),'source expression index outside registry')
    row=defs[family][idx]
    ensure(row['id']==sid,'source facade expression ID mismatch')
    return row,sid

def validate_binding(node,defs):
    op=node['op'];args=node['args']
    ensure(op in OPS and len(args)==3,'unexpected expression native call arity')
    definition,sid=choose_def(op,args[0],defs)
    params=definition['parameters'];values=args[1];orders=args[2]
    ensure(isinstance(params,list) and isinstance(values,list) and isinstance(orders,list),
           'actual-to-formal lists missing')
    ensure(len(params)==len(values)==len(orders),'formal and actual arity mismatch')
    ensure(len(set(params))==len(params) and all(type(x) is int and x>=0 for x in params),
           'formal binding slots must be distinct source coordinates')
    ensure(all(type(v) is int and v>=0 for v in values),'actual native arguments must be AST node IDs')
    limits=definition['derivativeLimits']
    ensure(len(limits)==len(orders) and
           all(type(n) is int and 0<=n<=limits[i] for i,n in enumerate(orders)),
           'nonexistent actual native partial derivative order')
    ensure(type(definition['body']) is int and definition['body']>=0,
           'registered native body root missing')
    return definition,sid,params,values,orders

def audit(folder,*,retain_binding_records=False):
    folder=Path(folder)
    manifest=json.loads((folder/'original-source-export-manifest.json').read_text())
    ensure(manifest['node_stream_sha256']==EXPECTED_GRAPH_SHA and manifest['definitions_sha256']==EXPECTED_REG_SHA
           and manifest['node_count']==4420257 and manifest['final_all_cycle_A_b_p'] is False,
           'not original pinned first FiveMap')
    registry=load_expression_registry(folder)
    targets=expected_index()
    bit={node:1<<i for i,node in enumerate(sorted(targets))}
    masks=[]
    node_kinds=[]   # immutable original op name for each exact actual argument AST ID
    counters=Counter();families=Counter()
    x_actual_kinds=Counter()
    x_actual_node_ids=Counter()
    per_target=defaultdict(lambda:{'native_expression_call_count':0,
                                    'formal_X_binding_count':0,'ambient_X_formal_absent_count':0,
                                    'actual_X_arg_node_examples':[]})
    examples=[];all_records=[];h=hashlib.sha256();count=0
    signatures_hash=hashlib.sha256()
    relevant_systems=set()
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as stream:
        for line_id,line in enumerate(stream):
            h.update(line)
            if line_id==0:
                ensure(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                       'original source node header mismatch')
                continue
            i=line_id-1
            node=json.loads(line)
            roots=original_children(node['op'],node['args'])
            m=bit.get(i,0)
            for child in roots:
                ensure(type(child) is int and 0<=child<i,'non-topological original source AST')
                m|=masks[child]
            masks.append(m)
            node_kinds.append(node['op'])
            count+=1
            if node['op'] not in OPS:continue
            definition,sid,params,values,orders=validate_binding(node,registry)
            counters['total_source_expression_call_nodes']+=1
            if definition['body']>=len(masks):
                raise OriginalNativeBindingGap('forward/non-source native definition body')
            natural_mask=masks[definition['body']]
            if not natural_mask:continue
            counters['native_expression_calls_with_original_114_in_registered_body']+=1
            families[node['op']]+=1
            relevant_systems.add((node['op'],sid))
            x_actual=values[params.index(SOURCE_X_COORD_NODE)] if SOURCE_X_COORD_NODE in params else None
            eta_actual=values[params.index(SOURCE_ETA_COORD_NODE)] if SOURCE_ETA_COORD_NODE in params else None
            if x_actual is None:
                counters['native_expression_calls_without_direct_formal_X_slot']+=1
            else:
                ensure(x_actual<i,'formal X actual argument was not an existing prior AST node')
                counters['native_expression_calls_with_direct_formal_X_slot']+=1
                counters['native_expression_calls_with_formal_X_actual_identity' if x_actual==SOURCE_X_COORD_NODE else 'native_expression_calls_with_substituted_formal_X']+=1
                x_actual_kinds[node_kinds[x_actual]]+=1
                x_actual_node_ids[x_actual]+=1
            record={
                'original_native_call_node_id':i,'native_op':node['op'],'system_id':sid,
                'native_definition_body_id':definition['body'],
                'formal_parameter_source_ids':params,'actual_argument_source_ids':values,
                'partial_derivative_orders':orders,
                'formal_X_source_slot':SOURCE_X_COORD_NODE if x_actual is not None else None,
                'actual_X_source_node_id':x_actual,
                'actual_eta_source_node_id':eta_actual,
            }
            signatures_hash.update((json.dumps(record,sort_keys=True,separators=(',',':'))+'\n').encode())
            if len(examples)<24:examples.append(record)
            if retain_binding_records:all_records.append(record)
            for k,natural_id in enumerate(sorted(targets)):
                if not natural_mask>>k & 1:continue
                row=per_target[natural_id];row['native_expression_call_count']+=1
                if x_actual is None:row['ambient_X_formal_absent_count']+=1
                else:
                    row['formal_X_binding_count']+=1
                    sample=row['actual_X_arg_node_examples']
                    if x_actual not in sample and len(sample)<12:sample.append(x_actual)
    ensure(count==4420257 and h.hexdigest()==EXPECTED_GRAPH_SHA,'original source stream changed')
    result={
      'schema':'MathScope.M3.NativeExpressionFormalActual114Frontier/1',
      'scope':'registered expression partial calls, ORIGINAL FIRST_FIVEMAP GRAPH only',
      'original_graph_sha256':EXPECTED_GRAPH_SHA,'original_registry_sha256':EXPECTED_REG_SHA,
      'original_AST_nodes_replayed':count,
      'original_114_source_natural_call_count':len(targets),
      'registered_native_expression_call_counts':dict(counters),
      'relevant_expression_partial_counts_by_operator':dict(families),
      'X_actual_argument_source_operator_counts':dict(x_actual_kinds),
      'distinct_X_actual_argument_AST_nodes':len(x_actual_node_ids),
      'actual_X_argument_AST_node_ID_and_count':[{'node_id':n,'calls':v} for n,v in sorted(x_actual_node_ids.items())],
      'distinct_relevant_registered_expression_systems':len(relevant_systems),
      'ordered_native_argument_mapping_sha256':signatures_hash.hexdigest(),
      'representative_exact_actual_binding_examples':examples,
      **({'all_exact_binding_records':all_records} if retain_binding_records else {}),
      'per_original_source_natural_call':[{'source_natural_node_id':n,'source_Y_node_id':targets[n],**per_target[n]}
                                          for n in sorted(targets)],
      'scope_limitations':['native body membership is not actual root-to-call path dominance',
         'formal to actual equality is syntactic binding only; source actual Y-range is unproved',
         'Picard, implicit roots, indexed, Volterra, and Fourier systems have separate bindings',
         'derivative orders require chain rules and junction conditions',
         'common complex analytic domain and B_rho norm not certified'],
      'original_114_global_Y_upper_newly_certified':0,
      'original_523_Y_certified':33,'original_523_Y_OPEN':490,
      'final_67_field_jets_certified':0,'M3':'62/64','M4':'0/16','release':'HOLD'
    }
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True)
    p.add_argument('--output')
    a=p.parse_args()
    r=audit(a.graph_dir)
    if a.output:Path(a.output).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in r.items() if k not in ('representative_exact_actual_binding_examples','per_original_source_natural_call')},indent=2,ensure_ascii=False))
