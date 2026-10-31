"""Recheck explicit n=1 exterior branches in the original source DAG.

The result is conditional on cutoff ordering and smooth semantics. It is not an
evaluation of actual Picard profiles or a proof of an integral moment.
"""
import argparse, gzip, hashlib, json
from pathlib import Path
from functools import lru_cache

HASH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REGHASH='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args()
 regfile=a.source/'original-source-functions.json'
 assert sha(regfile)==REGHASH
 reg=json.loads(regfile.read_text(encoding='utf8')); funcs=json.loads(reg['base']['base']['expression'])
 nodes=[];h=hashlib.sha256();count=0
 with gzip.open(a.source/'original-source-nodes.jsonl.gz','rb') as f:
  header=f.readline();h.update(header);head=json.loads(header)
  for line in f:
   h.update(line)
   if count<=117047:nodes.append(json.loads(line))
   count+=1
 assert count==head['node_count']==4420257 and h.hexdigest()==HASH
 def node(i):return nodes[i]
 assert node(117047)=={'op':'smooth_piecewise','args':[4756,28814,28824,0,117045,0]}
 def flatten(i,op):
  n=node(i)
  if n['op']==op:return [j for k in n['args'] for j in flatten(k,op)]
  return [i]
 terms=flatten(117045,'add')
 assert terms==[117031,117030,117027,87490,87489,87488,87480,87481]
 assert node(117031)=={'op':'multiply','args':[20,79047]}
 assert node(20)=={'op':'rational','args':['-1','1']}
 def solve(allowed,extended=False,allow_step=True):
  used_expr={};active=set()
  @lru_cache(None)
  def zero(i):
   if i in active:return None
   active.add(i)
   try:
    n=node(i);op=n['op'];v=n['args']
    if op=='rational':return frozenset() if int(v[0])==0 else None
    if op=='add':
     l,r=zero(v[0]),zero(v[1]);return l|r if l is not None and r is not None else None
    if op=='multiply':
     l,r=zero(v[0]),zero(v[1]);return min((x for x in (l,r) if x is not None),key=lambda x:(len(x),tuple(sorted(x))),default=None)
    if op=='integer_power' and v[1]>0:return zero(v[0])
    if op=='sqrt_positive':return zero(v[0])
    if op=='smooth_piecewise' and v[0]==4756 and v[2] in allowed:
     z=zero(v[5]);return z|{(v[2],i)} if z is not None else None
    if op=='smooth_piecewise' and extended and v[0]==5099 and v[2]==103:
     z=zero(v[5]);return z|{(103,i)} if z is not None else None
    if op=='source_step_derivative' and extended and allow_step and v[0] in (9198,9203) and v[1]>=1:
     return frozenset({(v[0],i)})
    if op=='actual_expression_partial':
     f=funcs[v[0]]
     if v[1]==f['parameters']:
      z=zero(f['body'])
      if z is not None:used_expr[i]={'system':v[0],'body':f['body'],'arguments':v[1],'orders':v[2]}
      return z
    if op=='definite_integral' and (v[0]==0 or v[2]==v[3]):return frozenset()
    return None
   finally:active.remove(i)
  return {i:zero(i) for i in terms},used_expr
 allowed={28823,28988,29328,28824}; result,partials=solve(allowed)
 assert all(result[i] is not None for i in terms[1:]) and result[117031] is None
 neg,_=solve(allowed-{28824});assert neg[117027] is None
 extended_allowed=allowed|{6258,5093,5089}
 extended_result,extended_partials=solve(extended_allowed,extended=True)
 assert all(extended_result[i] is not None for i in terms)
 no_step,_=solve(extended_allowed,extended=True,allow_step=False)
 assert no_step[117031] is None
 expected={
  5099:('log_positive',[5098]),5098:('multiply',[4756,5097]),5097:('inverse',[613]),
  103:('multiply',[101,102]),101:('rational',['13','1']),102:('inverse',[8]),
  9198:('multiply',[24,9197]),9197:('add',[8843,9196]),8843:('rational',['-9','1']),
  9203:('multiply',[24,9202]),9202:('add',[688,9196]),688:('rational',['-10','1']),
  9196:('multiply',[4756,9195]),9195:('inverse',[7981]),7981:('source_parameter',['X0I1']),
  6258:('source_parameter',['loopIRight']),5093:('multiply',[5091,5092]),5091:('multiply',[12,588]),
  5092:('exp',[6]),5089:('multiply',[12,5088]),5088:('exp',[3290]),3290:('rational',['-5','1']),
  3293:('multiply',[613,3292]),3292:('exp',[103]),28824:('multiply',[588,3293]),
  613:('multiply',[12,612]),612:('exp',[98]),98:('add',[76,84]),
  76:('add',[1,56]),56:('add',[1,6]),84:('multiply',[7,83]),83:('rational',['60','1'])}
 for k,(op,argv) in expected.items():assert node(k)=={'op':op,'args':argv},k
 # The derivative argument reduction requires endpoints independent of X and eta.
 def support(i,seen=None):
  if seen is None:seen=set()
  if i in seen:return set()
  seen.add(i);n=node(i);op=n['op'];v=n['args']
  if op=='coordinate':return {v[0]}
  if op in ('rational','source_parameter'):return set()
  if op=='integer_power':return support(v[0],seen)
  if op in ('add','multiply','inverse','exp'):return set().union(*(support(j,seen) for j in v))
  raise ValueError(('unexpected endpoint operator',i,op))
 assert all(not support(i) for i in extended_allowed)
 data={'source_stream_sha256':HASH,'registry_sha256':REGHASH,'node_count':count,
       'raw_node':117045,'clipped_node':117047,'terms':terms,
       'conditional_exterior_results':{str(i):None if result[i] is None else [{'endpoint':e,'piecewise_node':k} for e,k in sorted(result[i])] for i in terms},
       'successful_terms':7,'unresolved_terms':[117031],
       'proof_domain':'X strictly larger than all four named cutoff endpoints, with source parameters fixed, |eta|<1 and smooth source interpretations; endpoints require independent ordering Xplus >= all four; each branch and derivative must be defined.',
       'cutoffs':{'28823':'Xcut=Xa*exp(t1/32)','28988':'IposRight','29328':'X0Ipos*(8193/4096)^2','28824':'Xplus'},
       'particular_unresolved':'#117031 = -#79047; producer identifies #79047 as Z_(c-D)(Z_c(U0)); its reduction requires leading axial support and eta derivatives, not supplied by these seven branch proofs.',
       'partials_reached':partials,'negative_control':'Removing permission to use cutoff #28824 leaves #117027 unproved; PASS',
       'extended_result':{'successful_terms':8,'node117031_proof_guards':[{'guard':e,'node':k} for e,k in sorted(extended_result[117031])],
         'interpretation':'In addition to the first seven conditional branch rules, assume X exceeds 6258=loopIRight, 5093=XR exp(T+1), and 5089=XR exp(-5); log(X/Xp)>13/lambda; source step arguments 2(X/X0I1-9), 2(X/X0I1-10) exceed 1; source step derivatives vanish there. These are explicit analytic hypotheses, not native-domain proofs.',
         'negative_control':'without the step-derivative flatness rule, #117031 cannot be reduced'},
       'limits':['This is not a numerical evaluation, native binder proof or proof of source cutoff ordering.', 'No moment integral or boundary equality has been proved.', 'Only n=1 is addressed; no all-order induction.', 'A prefix integral is never replaced with zero because its integrand is compactly supported.']}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf8')
 print('PASS: exact source SHA; all eight exterior terms conditionally reduce under explicit branch/step guards; both negative controls PASS; native guards and actual moment remain OPEN')
if __name__=='__main__':main()
