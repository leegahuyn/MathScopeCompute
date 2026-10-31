"""Authenticate original #672 inner positive-order branch, not Picard solvability."""
import argparse,gzip,hashlib,json
from pathlib import Path

GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 regbytes=(a.source/'original-source-functions.json').read_bytes();assert hashlib.sha256(regbytes).hexdigest()==REG
 r=json.loads(regbytes)['base']['base']; expr=json.loads(r['expression']); picard=json.loads(r['picard'])
 h=hashlib.sha256();nodes={};count=0
 expected={
  2:('coordinate',['eta']),4756:('coordinate',['X']),3612:('source_parameter',['t1']),3617:('source_parameter',['Xa']),
  28811:('rational',['1','128']),28812:('multiply',[3612,28811]),28813:('exp',[28812]),28814:('multiply',[3617,28813]),
  28816:('rational',['1','64']),28817:('multiply',[3612,28816]),28818:('exp',[28817]),28819:('multiply',[3617,28818]),
  28820:('rational',['1','32']),28821:('multiply',[3612,28820]),28822:('exp',[28821]),28823:('multiply',[3617,28822]),
  24802:('rational',['1','16']),24803:('multiply',[3612,24802]),24804:('exp',[24803]),24805:('multiply',[3617,24804]),24806:('sqrt_positive',[24805]),
  28834:('actual_background_even_profile',[0,0,4756,2,0,0]),28835:('actual_background_even_profile',[0,1,4756,2,0,0]),
  28837:('smooth_piecewise',[4756,28819,28823,28834,28836,0]),28839:('smooth_piecewise',[4756,28819,28823,28835,28838,0]),
  28987:('source_parameter',['X0Ipos']),28988:('source_parameter',['IposRight']),
  29268:('smooth_piecewise',[4756,28987,28988,0,29267,0]),29288:('smooth_piecewise',[4756,28987,28988,0,29287,0]),
  29289:('add',[28839,29268]),29290:('add',[28837,29288]),
  29329:('coordinate',['actual_n1_axis_average$200']),29330:('multiply',[4756,29329]),
  29331:('actual_background_even_profile',[0,1,29330,2,0,0]),29332:('definite_integral',[29331,29329,0,1]),
  29336:('smooth_piecewise',[4756,28819,29328,29332,29335,0]),
  50557:('actual_background_even_profile',[0,3,4756,2,0,0]),50558:('smooth_piecewise',[4756,28819,28824,50557,50556,0]),
  117045:('add',[117031,117044]),117047:('smooth_piecewise',[4756,28814,28824,0,117045,0])}
 with gzip.open(a.source/'original-source-nodes.jsonl.gz','rb') as f:
  head=f.readline();h.update(head);header=json.loads(head)
  for i,line in enumerate(f):
   h.update(line)
   if i in expected:nodes[i]=json.loads(line)
   count+=1
 assert count==header['node_count']==4420257 and h.hexdigest()==GRAPH
 def validate(candidate):
  for i,(op,args) in expected.items():
   if candidate[i]!={'op':op,'args':args}:return False
  return True
 assert validate(nodes)
 assert expr[5]['body']==29290 and expr[6]['body']==29289 and expr[9]['body']==29336 and expr[10]['body']==50558
 assert all(expr[j]['parameters']==[4756,2] for j in [5,6,9,10])
 s=picard[0]
 assert s['name']=='ActualSameN3OrderOneInner' and s['order']==1
 assert s['diagonal']==[0,0,2,0,3,1] and s['zeroAxisDatum']==[0]*6 and s['radialDomain']==[0,24806]
 assert s['unknowns'][0].startswith('F1=') and s['unknowns'][1]=='U1' and s['unknowns'][2].startswith('K1=') and s['unknowns'][3]=='Pi1'
 assert s['A0'][2]==[0,0,0,0,0,20] and s['A1'][2]==[0]*6 and s['forcing'][2]==0
 fake=dict(nodes);fake[29268]=dict(nodes[29268]);fake[29268]['args']=fake[29268]['args'].copy();fake[29268]['args'][3]=1
 assert not validate(fake)
 out={'graph_sha256':GRAPH,'registry_sha256':REG,'nodes_scanned':count,'exact_nodes_checked':len(expected),
 'picard_system':{'id':0,'name':s['name'],'radial_domain':s['radialDomain'],'zero_axis_datum':s['zeroAxisDatum'],'diagonal':s['diagonal'],'k_row':s['A0'][2]},
 'conditional_inner_restrictions':{'F1':'#29290=#28834=even(system 0, component 0)','U1':'#29289=#28835=even(system 0, component 1)','Pi1':'#50558=#50557=even(system 0, component 3)','average':'#29336=#29332=integral_0^1 even(system 0,component 1,t X,eta) dt'},
 'guards':['0<=X<=Xminus<Xkeep<Xcut<aSquared','Xminus<X0Ipos','all nodes needed in selected branch are defined, with correct smooth source semantics'],
 'limits':['This only checks AST and conditional branch identities.','No proof of source-level Picard convergence or equation semantics.','No proof global leading profiles equal inner leading profiles.','Average equals U1+K1 only if Picard system row equation and zero axis datum hold as functions.','No proof #117045=0, eta-derivative interchange, all-order result, or native caller membership.'],
 'negative_control':'mutated additive bump left branch is structurally rejected'}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(out,indent=2),encoding='utf8');print('PASS: exact graph hash, 0th Picard metadata, and four conditional inner branch restrictions; inner ODE and original zero residual OPEN')
if __name__=='__main__':main()
