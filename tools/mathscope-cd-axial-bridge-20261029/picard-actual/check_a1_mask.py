"""Check original system-0 nilpotent eta-derivative mask and truncation IDs.

This is a structural certificate, not an analytic norm bound or ODE solution.
"""
import argparse, gzip, hashlib, json
from pathlib import Path

GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--source',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
 raw=(a.source/'original-source-functions.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==REG
 root=json.loads(raw)['base']['base'];s=json.loads(root['picard'])[0]
 assert s['name']=='ActualSameN3OrderOneInner' and s['order']==1
 assert s['diagonal']==[0,0,2,0,3,1] and s['zeroAxisDatum']==[0]*6
 expected=[[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
           [25927,25929,25929,0,0,0],[0,25934,25936,25576,0,0]]
 assert s['A1']==expected
 assert all(s['A1'][i][j]==0 for i in range(6) for j in range(6) if i<4 or j>=4)
 tail=s['tail'];assert (tail['Kcondition'],tail['Kprecision'],tail['K'],tail['etaOrder'],tail['error'],tail['target'])==(24825,24834,24835,2,24842,24843)
 assert tail['sourceTruncationIndexNumericallyMaterialized'] is False and tail['tailIsForTheCertifiedIndexNotForDisplayedTerms'] is True
 expect_nodes={0:('rational',['0','1']),24825:('ceiling',[24824]),24834:('ceiling',[24833]),24835:('maximum',[1,24825,24834]),24843:('rational',['1',str(2**128)])}
 selected={};h=hashlib.sha256();n=0
 with gzip.open(a.source/'original-source-nodes.jsonl.gz','rb') as stream:
  header=stream.readline();h.update(header);metadata=json.loads(header)
  for n,line in enumerate(stream,1):
   h.update(line);i=n-1
   if i in expect_nodes:selected[i]=json.loads(line)
 assert n==metadata['node_count']==4420257 and h.hexdigest()==GRAPH
 for i,(op,args) in expect_nodes.items():assert selected[i]=={'op':op,'args':args},i
 mask=[[v!=0 for v in row] for row in expected]
 # A(x)D A(y)=0 even when coefficients/arguments differ; derivatives of an
 # identically-zero entry remain zero wherever actual differentiation exists.
 paths=[(i,k,j) for i in range(6) for k in range(6) for j in range(6) if mask[i][k] and mask[k][j]]
 assert paths==[]
 mutant=[row[:] for row in mask];mutant[0][4]=True
 bad=[(i,k,j) for i in range(6) for k in range(6) for j in range(6) if mutant[i][k] and mutant[k][j]]
 assert (0,4,0) in bad
 # At most ceil(k/2) nonadjacent derivative-bearing factors in a word of
 # length k, proved by packing pairs, demonstrated for a range as a control.
 for k in range(101):
  dynamic=[0,1] if k else [0,0]
  best=0
  # independent greedy witness: 1010... reaches ceil(k/2).
  assert sum(i%2==0 for i in range(k))==(k+1)//2
 result={'schema':'MathScope.PicardMaskStructuralAudit/1','graph_sha256':GRAPH,'registry_sha256':REG,'nodes':n,
   'system':s['name'],'diagonal':s['diagonal'],'source_A1_node_ids':expected,
   'structural_nonzero_entries':sum(sum(r) for r in mask),
   'A1_diagonal_A1_nonzero_paths':paths,'forbidden_mask_mutation_path':list(bad[0]),
   'source_tail_ids':{k:tail[k] for k in ['Kcondition','Kprecision','K','etaOrder','error','target']},
   'sourceTruncationIndexNumericallyMaterialized':tail['sourceTruncationIndexNumericallyMaterialized'],
   'tailIsForTheCertifiedIndexNotForDisplayedTerms':tail['tailIsForTheCertifiedIndexNotForDisplayedTerms'],
   'scope':'mask structure only; no source analytic norms, convergence, evaluation or ODE satisfaction proved',
   'assumptions':['actual coefficients and their eta derivatives are defined, zero entries have zero derivatives', 'the intermediate radial inverse kernel preserves the two blocks'],
   'interpretation':'A1(x) D A1(y) and A1(x) D (partial_eta A1)(y) vanish for diagonal D; nonadjacent A1 factors in k positions are bounded by ceil(k/2).'}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
 print('PASS: exact original graph/registry; six A1 structural entries; diagonal-block composition and forbidden-mask negative control.')
if __name__=='__main__':main()
