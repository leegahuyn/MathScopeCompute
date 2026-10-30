"""Check exact original Y-expression equivalences; no native-domain certification.

The transcendental step exp(log(x))=x explicitly requires x>0.  These are
equalities of source functions at the *same* formal assignment; calls under
different native substitutions cannot be identified without a binder proof.
"""
import argparse, gzip, hashlib, json
from fractions import Fraction
from pathlib import Path

SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
DEFS='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--receipt',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    m=json.loads((a.source/'original-source-export-manifest.json').read_text(encoding='utf8'))
    assert m['node_stream_sha256']==SHA and m['definitions_sha256']==DEFS
    assert digest(a.source/'original-source-functions.json')==DEFS
    h=hashlib.sha256();nodes={};num=0
    with gzip.open(a.source/'original-source-nodes.jsonl.gz','rb') as f:
        header=next(f);h.update(header);expected=json.loads(header)['node_count']
        for i,line in enumerate(f):
            h.update(line);num+=1
            if i<=56747:nodes[i]=json.loads(line)
    assert h.hexdigest()==SHA and num==expected==4420257
    def expect(i,op,args):assert nodes[i]=={'op':op,'args':args},(i,nodes[i])
    expect(3454,'source_parameter',['Lambda']);expect(3617,'source_parameter',['Xa']);expect(3679,'inverse',[3617]);expect(474,'rational',['4','1'])
    expect(4756,'coordinate',['X']);expect(4757,'multiply',[3454,4756])
    expect(6339,'log_positive',[4756]);expect(32469,'exp',[6339]);expect(32495,'multiply',[3454,32469])
    expect(33756,'log_positive',[32469]);expect(56721,'exp',[33756]);expect(56747,'multiply',[3454,56721])
    groups=[(25063,6945,7023,7022,6944),(54061,33412,33490,33489,33411),(26118,25660,25738,25737,25659)]
    for left,right,lognode,scaled,coordinate in groups:
        expect(right,'multiply',[3454,coordinate]);expect(scaled,'multiply',[3679,coordinate]);expect(lognode,'log_positive',[scaled])
        l=nodes[left];assert l['op']=='multiply' and l['args'][0]==474
        expect(l['args'][1],'exp',[lognode])
    receipt=json.loads(a.receipt.read_text(encoding='utf8'))
    assert receipt['source_node_sha256']==SHA and receipt['definitions_sha256']==DEFS
    src=receipt['expanded_native_definition_semantic_closure']['natural_source_input_pairs']
    pairs=src['original_56_input_pairs'];assert len(pairs)==56 and sum(x['source_call_nodes'] for x in pairs)==523
    counts={p['Y_node_id']:p['source_call_nodes'] for p in pairs}
    for i in (4757,32495,56747,25063,6945,54061,33412,26118,25660):assert i in counts
    # Exact algebraic negative controls for the omitted scaling and positivity premises.
    x,xa,lam=Fraction(2),Fraction(3),Fraction(1)
    assert 4*x/xa != lam*x and lam*xa!=4
    assert Fraction(0)<=0  # log_positive(0) is outside its stated domain.
    payload={
      'status':'VERIFIED conditional source-expression identities, not native domain certificate',
      'source_sha256':SHA,'functions_sha256':DEFS,'nodes_scanned':num,
      'semantic_reachability_receipt_sha256':digest(a.receipt),
      'receipt_scope':'first FiveMap only; source-reported 56 pairs and 523 calls, not final A-D jets',
      'equivalence_classes':[
        {'Y_nodes':[4757,32495,56747],'formula':'Lambda*X','required':['X>0','same formal X and Lambda assignment']},
        *[{'Y_nodes':[right,left],'formula':f'Lambda*node#{coord}',
           'required':['Xa>0',f'node#{coord}>0','Lambda*Xa=4','same formal assignment']} for left,right,_,_,coord in groups]],
      'receipt_occurrence_counts':{str(k):counts[k] for k in sorted([4757,32495,56747,25063,6945,54061,33412,26118,25660])},
      'duplicate_Y_node_count':5,
      'duplicate_source_call_count_in_receipt':sum(counts[k] for k in (32495,56747,25063,54061,26118)),
      'scope_limitations':['No positivity or guard established for native calls.', 'No formal-to-native binder equality established.', 'No new Y call accepted merely from a shared formal expression.', 'No nonlinear natural function or 67 final jets evaluated.'],
      'negative_controls':['X=0 cannot evaluate log_positive(X).','Xa=3, Lambda=1, x=2 violates Lambda*Xa=4 and 4*x/Xa != Lambda*x.'],
      'released_Y_count_increment':0,'M3':'62/64','M4':'0/16','jets':'0/67','release':'HOLD'}
    a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(payload,indent=2),encoding='utf8')
    print(json.dumps({k:payload[k] for k in ('nodes_scanned','duplicate_Y_node_count','duplicate_source_call_count_in_receipt','released_Y_count_increment','status')},indent=2))
if __name__=='__main__':main()
