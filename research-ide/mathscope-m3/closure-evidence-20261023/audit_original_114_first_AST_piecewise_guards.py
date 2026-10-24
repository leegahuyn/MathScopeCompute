#!/usr/bin/env python3
"""First encountered *syntactic* piecewise ancestor for each original 114 X call.

The first ancestor in topological source order is not necessarily a
dominating runtime guard: the same node can be shared through multiple
source and native-body paths, and substituted coordinate aliases require
separate proof. This never promotes any original natural-series Y bound.
"""
import argparse,gzip,hashlib,json
from collections import Counter
from pathlib import Path
from audit_original_114_ast_call_ledger import replay,expected_index,EXPECTED_GRAPH_SHA

PRIMITIVE={'rational','coordinate','source_parameter'}
UNARY={'inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling','integer_power','source_step_derivative'}
ALL={'add','multiply','maximum','smooth_piecewise'}
EXPR={'actual_expression_partial','m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial',
      'm3_coupled_expression_partial','m3_coupled_indexed_partial','m3_coupled_inverse_partial',
      'm3_forced_expression_partial','m3_global_indexed_partial'}
VOL={'actual_covariance_volterra','actual_pulse_jet_volterra','actual_pulse_sensitivity_volterra',
     'actual_pulse_third_jet_volterra','actual_n6_pulse_higher_jet_volterra','m3_global_pulse_jet'}
EXPECTED_CASES={
 'before|32469|3617|3618':23,
 'before|6944|3624|3627':21,
 'before|4756|3617|3618':19,
 'before|33411|3624|3627':17,
 'inside|6944|3624|3627':14,
 'before|4756|3617|24805':8,
 'inside|33411|3624|3627':6,
 'before|56721|3617|3618':6,
}
class UnauthenticatedGuardRoute(ValueError):pass
def ensure(ok,why):
    if not ok:raise UnauthenticatedGuardRoute(why)
def original_children(op,a):
    if op in PRIMITIVE:return ()
    if op in UNARY:return (a[0],)
    if op in ALL:return a
    if op=='definite_integral':return (a[0],a[2],a[3])
    if op=='actual_natural_series':return (a[1],a[2])
    if op in ('actual_background_picard','actual_background_even_profile'):return (a[2],a[3])
    if op=='actual_quadratic_root':return (a[2],)
    if op=='actual_monotone_root':return a[1:]
    if op in VOL:return (a[2],*a[3])
    if op=='m3_forced_pulse_partial':return (a[3],*a[4])
    if op in EXPR:return a[1]
    raise UnauthenticatedGuardRoute('unknown source native child schema '+op)

def verify_first_rows(rows):
    ensure(len(rows)==114 and len({row['original_natural_node_id'] for row in rows})==114,
           'must list all 114 original source calls once')
    want=set(expected_index())
    ensure({r['original_natural_node_id'] for r in rows}==want,'must include exact 114 original node IDs')
    cases=Counter(f"{r['arm']}|{r['guard_x_node']}|{r['left_node']}|{r['right_node']}" for r in rows)
    ensure(dict(cases)==EXPECTED_CASES,'changed first encountered source branch case distribution')
    ensure(all(r['piecewise_node_id']>r['original_natural_node_id'] for r in rows),'source must precede branch')
    return dict(sorted(cases.items()))

def audit_first_AST_piecewise(graph_dir):
    # Replay original source before treating the independent byte stream as genuine.
    source=replay(graph_dir)
    target=expected_index();positions={node:1<<k for k,node in enumerate(sorted(target))}
    bit_id=sorted(target)
    masks=[];first={};Y_source={};sha=hashlib.sha256();count=0
    with gzip.open(Path(graph_dir)/'original-source-nodes.jsonl.gz','rb') as f:
        for line_idx,line in enumerate(f):
            sha.update(line)
            if line_idx==0:
                ensure(json.loads(line)['node_count']==4420257,'wrong source node header')
                continue
            i=line_idx-1; count+=1
            item=json.loads(line)
            op=item['op'];a=item['args']
            if i in set(target.values()):Y_source[i]=item
            bits=positions.get(i,0)
            for child in original_children(op,a):
                ensure(type(child) is int and 0<=child<i,'not a topological AST child')
                bits|=masks[child]
            if op=='smooth_piecewise':
                ensure(len(a)==6,'invalid original six-argument smooth_piecewise')
                for k,arm in ((3,'before'),(4,'inside'),(5,'after')):
                    mask=masks[a[k]]
                    while mask:
                        bit=mask & -mask
                        ordinal=bit.bit_length()-1
                        node=bit_id[ordinal]
                        if node not in first:
                            first[node]={
                                'original_natural_node_id':node,
                                'Y_node_id':target[node],
                                'piecewise_node_id':i,
                                'arm':arm,
                                'guard_x_node':a[0],
                                'left_node':a[1],
                                'right_node':a[2],
                            }
                        mask-=bit
            masks.append(bits)
    ensure(count==4420257 and sha.hexdigest()==EXPECTED_GRAPH_SHA,'full original source graph changed')
    rows=sorted(first.values(),key=lambda r:r['original_natural_node_id'])
    cases=verify_first_rows(rows)
    # First encountered BEFORE arm x<=left provides a *conditional local*
    # source-radius theorem whenever the original Y-expression is literally
    # Lambda*x with the same x used by the piecewise guard, and x>=0.
    # It is NOT a native root-to-call dominance/execution certificate.
    safe=[]
    for row in rows:
        Y=Y_source.get(row['Y_node_id'])
        if (Y and Y['op']=='multiply' and Y['args']==[3454,row['guard_x_node']]
            and row['arm']=='before' and row['left_node'] in (3617,3624)):
            row['conditional_local_before_Y_le_5'] = True
            row['conditional_local_hypotheses'] = 'selected before arm, original x>=0, Lambda>0, Xa=4/Lambda, 0<t1<1/8'
            row['local_Y_upper'] = '4' if row['left_node']==3617 else '<32/7'
            safe.append(row)
        else:
            row['conditional_local_before_Y_le_5'] = False
            row['conditional_local_hypotheses'] = None
            row['local_Y_upper'] = None
    upper=Counter(x['left_node'] for x in safe)
    ensure(len(safe)==94 and upper=={3617:56,3624:38},
           'original direct-input first-BEFORE source branch audit drifted')
    ensure(sum(x['arm']=='inside' for x in rows)==20,
           'original transition branch count drifted')
    ensure(len(rows)-len(safe)==20,
           'original 20 first-inside source branches drifted')
    return {
      'schema':'MathScope.M3.Original114FirstSyntacticPiecewiseAncestors/1',
      'graph_source_sha256':EXPECTED_GRAPH_SHA,
      'native_source_114_row_hash':source['source_114_ledger_sha256'],
      'original_AST_node_count':count,
      'number_with_at_least_one_syntactic_piecewise_ancestor':len(rows),
      'first_ancestor_case_counts':cases,
      'first_ancestor_records':rows,
      'source_first_before_direct_Y_over_Lambda_local_radius_conditional_count':len(safe),
      'source_first_before_Xa_local_conditional_count':upper[3617],
      'source_first_before_Xa_exp_t1_local_conditional_count':upper[3624],
      'source_first_before_direct_coordinate_count':len(safe),
      'source_first_inside_transition_needing_tighter_upper_count':20,
      'local_radius_result_requires_selected_branch_and_nonnegative_coordinate':True,
      'proof_note':'Topological first *syntactic* ancestor, NOT all native root-to-call execution paths and NOT a support proof',
      'first_piecewise_proved_to_dominate_all_original_consumer_execution_paths':0,
      'native_coordinate_alias_substitution_verified':False,
      'source_Y_upper_bounds_newly_certified':0,
      'original_Y_bounds_certified_523':33,'original_Y_bounds_open_523':490,
      'actual_final_67_jet_intervals':0,
      'M3':'62/64','M4':'0/16','release':'HOLD',
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True);p.add_argument('--output')
    args=p.parse_args()
    receipt=audit_first_AST_piecewise(args.graph_dir)
    if args.output:Path(args.output).write_text(json.dumps(receipt,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({k:v for k,v in receipt.items() if k!='first_ancestor_records'},indent=2,ensure_ascii=False))

if __name__=='__main__':main()
