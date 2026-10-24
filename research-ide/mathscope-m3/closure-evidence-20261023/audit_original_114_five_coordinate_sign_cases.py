#!/usr/bin/env python3
"""SHA-exact structural sign cases for 114 source X-related natural calls.

On the source's real domains Xa>0 and exp(real)>0.
58 calls use Xa*exp(...) coordinates with positive source expressions.
29 calls use exp(log_positive(...)) whose definition requires positive X.
27 directly use X and need an actual native/chart X>0 certificate.
This is NOT proof of runtime native parameter substitution, or all Y<=5.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from audit_original_114_ast_call_ledger import (
    EXPECTED_GRAPH_SHA,EXPECTED_REG_SHA,GROUPS,expected_index
)
from prove_original_n3_Q_rho_signs import original_n3_Q_rho_strict_positivity
from pinned_n3_parameter_intervals import pinned_profile

# Exact source AST nodes relevant to source X input coordinates.
EXPECTED={
 4756:('coordinate',['X']),
 6944:('multiply',[3617,6943]),
 6943:('exp',[4761]),
 32469:('exp',[6339]),
 6339:('log_positive',[4756]),
 33411:('multiply',[3617,33410]),
 33410:('exp',[32503]),
 56721:('exp',[33756]),
 33756:('log_positive',[32469]),
 3617:('source_parameter',['Xa']),
}
Y_TO_X={
 4757:4756,6945:6944,25063:6944,32495:32469,
 33412:33411,50907:6944,54061:33411,56747:56721,
}
class InvalidOriginalPositiveSource(ValueError):pass
def check(ok,msg):
    if not ok:raise InvalidOriginalPositiveSource(msg)

def certificate(graph_dir):
    folder=Path(graph_dir)
    m=json.loads((folder/'original-source-export-manifest.json').read_text())
    check(m['node_stream_sha256']==EXPECTED_GRAPH_SHA
          and m['definitions_sha256']==EXPECTED_REG_SHA
          and m['node_count']==4420257
          and m['final_all_cycle_A_b_p'] is False,
          'Wrong original first FiveMap SHA manifest')
    positive=original_n3_Q_rho_strict_positivity()
    p=pinned_profile()
    check(positive['Lambda_is_strictly_positive']
          and p['parametersExactExpressions']['Xa']=={
              'quotient':[{'integer':4},{'ref':'Lambda'}]},
          'Actual N3 Xa=4/Lambda and Lambda>0 not proved')
    counts={x:sum(len(GROUPS[y]) for y,t in Y_TO_X.items() if t==x) for x in set(Y_TO_X.values())}
    check(counts=={4756:27,6944:35,32469:23,33411:23,56721:6},
          '114 original normalized Y source group count drifted')
    want=expected_index();found={};h=hashlib.sha256();count=0
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as stream:
        for lino,line in enumerate(stream):
            h.update(line)
            if lino==0:
                check(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                      'Wrong original source stream header')
                continue
            i=lino-1;count+=1
            if i in EXPECTED:found[i]=json.loads(line)
            if i in want:
                node=json.loads(line)
                check(node['op']=='actual_natural_series' and len(node['args'])==5
                      and node['args'][1]==want[i], 'Original natural call Y argument drift')
    check(count==4420257 and h.hexdigest()==EXPECTED_GRAPH_SHA,
          'Original complete source SHA/count mismatch')
    for i,(op,args) in EXPECTED.items():
        check(found.get(i)=={'op':op,'args':args},
              'Original source coordinate changed: '+str(i))
    return {
      'schema':'MathScope.M3.Original114FivePositiveSourceCoordinates/1',
      'original_graph_sha256':EXPECTED_GRAPH_SHA,
      'source_registry_sha256':EXPECTED_REG_SHA,
      'source_X_coordinate_call_counts':{str(k):v for k,v in sorted(counts.items())},
      'positive_Xa_exp_real_source_coordinate_calls':58,
      'positive_exp_log_positive_source_coordinate_calls_requiring_positive_X':29,
      'raw_X_coordinate_calls_requiring_positive_chart_X':27,
      'source_calls_positive_if_actual_X_chart_and_log_domains_are_valid':114,
      'actual_native_X_coordinate_substitution_certified':False,
      'source_real_exp_and_log_domains_globally_certified':False,
      'original_114_global_Y_lower_and_upper_bounds_newly_certified':0,
      'original_523_Y_upper_bound_certified':33,
      'original_523_Y_upper_bound_OPEN':490,
      'final_67_field_jets_certified':0,
      'M3':'62/64','M4':'0/16','release':'HOLD',
    }

def validate_certified_scope(c):
    check(c.get('schema')=='MathScope.M3.Original114FivePositiveSourceCoordinates/1'
       and c.get('positive_Xa_exp_real_source_coordinate_calls')==58
       and c.get('positive_exp_log_positive_source_coordinate_calls_requiring_positive_X')==29
       and c.get('raw_X_coordinate_calls_requiring_positive_chart_X')==27
       and c.get('actual_native_X_coordinate_substitution_certified') is False
       and c.get('original_114_global_Y_lower_and_upper_bounds_newly_certified')==0
       and c.get('final_67_field_jets_certified')==0 and c.get('release')=='HOLD',
       'Source sign cases cannot certify native runtime or final 67 jets')
    return True

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--graph-dir',required=True);a.add_argument('--output')
    q=a.parse_args()
    c=certificate(q.graph_dir);validate_certified_scope(c)
    if q.output:Path(q.output).write_text(json.dumps(c,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(c,indent=2,ensure_ascii=False))
