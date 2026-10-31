"""Authenticate n=1 leading core/collar expressions, under explicit domain guards.

Uses exact DAG interning rather than digest equality for structural comparison.
Only named branch simplifications justified by the accompanying proof are allowed.
No derivative interchange, Picard solution, or native domain is certified.
"""
import argparse, gzip, hashlib, json
from pathlib import Path
from functools import lru_cache

GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--profile',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 registry=(a.source/'original-source-functions.json').read_bytes();assert hashlib.sha256(registry).hexdigest()==REG
 profile=a.profile.read_bytes();assert hashlib.sha256(profile).hexdigest()=='df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
 systems=json.loads(json.loads(registry)['base']['base']['picard']); sys=systems[0]
 d={};h=hashlib.sha256();count=0
 with gzip.open(a.source/'original-source-nodes.jsonl.gz','rb') as f:
  line=f.readline();h.update(line);header=json.loads(line)
  for i,line in enumerate(f):
   h.update(line)
   if i<=25638:d[i]=json.loads(line)
   count+=1
 assert h.hexdigest()==GRAPH and count==header['node_count']==4420257
 expected={
  4756:('coordinate',['X']),25516:('coordinate',['actual_inner_xi']),25586:('integer_power',[25516,2]),
  12:('source_parameter',['XR']),3617:('source_parameter',['Xa']),3618:('rational',['110','1']),6257:('source_parameter',['loopILeft']),
  4562:('rational',['-8','1']),4563:('exp',[4562]),4564:('multiply',[12,4563]),
  4565:('rational',['-7','1']),4566:('exp',[4565]),4567:('multiply',[12,4566]),
  3290:('rational',['-5','1']),5088:('exp',[3290]),5089:('multiply',[12,5088]),
  7981:('source_parameter',['X0I1']),9195:('inverse',[7981]),9196:('multiply',[4756,9195]),
  8843:('rational',['-9','1']),688:('rational',['-10','1']),24:('rational',['2','1']),
  9197:('add',[8843,9196]),9198:('multiply',[24,9197]),
  9202:('add',[688,9196]),9203:('multiply',[24,9202]),
  4789:('smooth_piecewise',[4756,3617,3618,4786,4788,4481]),
  5260:('smooth_piecewise',[4756,3617,3618,5180,5255,5259]),
  5675:('smooth_piecewise',[4756,3617,3618,5302,5665,5674]),
  5090:('smooth_piecewise',[4756,4564,4567,4789,4795,3458]),
  5175:('smooth_piecewise',[4756,4567,5089,5090,5174,5157]),
  5270:('smooth_piecewise',[4756,4564,4567,5260,5269,4678]),
  5293:('smooth_piecewise',[4756,4567,5089,5270,5292,5173]),
  5696:('smooth_piecewise',[4756,4564,4567,5675,5689,5695]),
  6182:('smooth_piecewise',[4756,4567,5089,5696,6149,6181]),
  6202:('smooth_piecewise',[4756,3617,5089,6201,6193,6193]),
  18778:('smooth_piecewise',[4756,6257,7982,6202,18777,6202]),
  9236:('add',[7966,9209]),7966:('add',[5175,7961]),7961:('multiply',[7959,7960]),
  7959:('smooth_piecewise',[4756,6257,6258,0,7958,0]),
  9209:('multiply',[9207,9208]),9207:('add',[9201,9206]),
  9201:('multiply',[9169,9200]),9206:('multiply',[9170,9205]),
  9200:('multiply',[24,9199]),9205:('multiply',[24,9204]),
  9199:('source_step_derivative',[9198,1]),9204:('source_step_derivative',[9203,1]),
  25637:('smooth_piecewise',[25586,3617,24805,25619,25636,25636]),
  25638:('smooth_piecewise',[25586,3617,24805,25605,25621,25621]),
 }
 def guard(candidate):
  return all(candidate[i]=={'op':op,'args':args} for i,(op,args) in expected.items())
 assert guard(d)
 assert sys['sourceLeading']['U0']==25638 and sys['sourceLeading']['v0']==25637

 def compare(pairs, substitutions):
  # Intern immutable structural nodes, avoiding collision-based equality.
  intern={}; seen_rewrites=[]
  def interned(k):
   if k not in intern:intern[k]=len(intern)+1
   return intern[k]
  def replace(n):return substitutions.get(n,n)
  def flatten(n,op,env):
   original=n;n=replace(n)
   if n!=original and original!=25586:
    assert not env,('branch_rewrite_under_integral',original,env)
    seen_rewrites.append(original)
   v=d[n]
   return [z for child in v['args'] for z in flatten(child,op,env)] if v['op']==op else [n]
  @lru_cache(None)
  def norm(n,env=()):
   original=n;n=replace(n)
   if n!=original and original!=25586:
    # Branch choices are asserted only for free current-X; do not rewrite
    # them under an integral binder without proving its domain separately.
    assert not env,('branch_rewrite_under_integral',original,env)
    seen_rewrites.append(original)
   bindings=dict(env)
   if n in bindings:return interned(('bound',bindings[n]))
   v=d[n];op=v['op'];x=v['args']
   if op in ('rational','coordinate','source_parameter'):return interned((op,*x))
   if op=='definite_integral':
    body,var,lo,hi=x;assert d[var]['op']=='coordinate' and var not in (4756,25516,25586)
    return interned((op,norm(body,env+((var,len(env)),)),norm(lo,env),norm(hi,env)))
   if op in ('add','multiply'):return interned((op,*sorted(norm(j,env) for j in flatten(n,op,env))))
   if op in ('integer_power','source_step_derivative'):return interned((op,norm(x[0],env),*x[1:]))
   if op=='actual_natural_series':return interned((op,x[0],norm(x[1],env),norm(x[2],env),*x[3:]))
   if op=='actual_quadratic_root':return interned((op,*x[:2],*(norm(j,env) for j in x[2:])))
   if op=='actual_background_even_profile':return interned((op,*x[:2],norm(x[2],env),norm(x[3],env),*x[4:]))
   if op=='actual_expression_partial':return interned((op,x[0],tuple(norm(j,env) for j in x[1]),tuple(x[2])))
   if op in ('inverse','exp','log_positive','sqrt_positive','smooth_piecewise','sine','cosine'):
    return interned((op,*(norm(j,env) for j in x)))
   raise ValueError(('unsupported_operator',n,op))
  return [norm(i)==norm(j) for i,j in pairs],sorted(set(seen_rewrites)),len(intern)

 # X=xi^2: explicit structural substitution; collar replacements apply only
 # under Xa < X < Xminus and Xminus < all relevant outer left boundaries.
 core_pairs=[(4786,25605),(6201,25619)]
 collar_pairs=[(4788,25621),(5255,25625),(6193,25636)]
 subst={25586:4756,5175:4788,5293:5255,6182:5665}
 core_results,core_rewrites,core_size=compare(core_pairs,{25586:4756})
 collar_results,rewrites,collar_size=compare(collar_pairs,subst)
 pairs=core_pairs+collar_pairs;results=core_results+collar_results;size=core_size+collar_size
 assert all(results),list(zip(pairs,results))
 assert core_rewrites==[]
 assert set(rewrites).issubset({5175,5293,6182})
 # Invalid removal of the eta-moment branch proof must prevent final match.
 without=dict(subst);without.pop(6182)
 checks,_,_=compare([(6193,25636)],without);assert checks==[False]
 # Changing the concrete bracketed collar branch must fail source matching.
 fake=dict(d);fake[5675]=dict(d[5675]);fake[5675]['args']=list(fake[5675]['args']);fake[5675]['args'][4]=5302
 assert not guard(fake)
 out={'graph_sha256':GRAPH,'registry_sha256':REG,'source_profile_sha256':hashlib.sha256(profile).hexdigest(),'nodes':count,
      'scope':'exact structural interned DAG equality of displayed U and v coefficient subtrees, conditional on branch inequalities, definedness and integral alpha-renaming',
      'pairs':[{'actual':i,'picard':j,'structural_match':ok} for (i,j),ok in zip(pairs,results)],
      'branch_rewrites':rewrites,'interned_nodes':size,
      'assumptions':['0<X<Xminus, 0<t1<1, Xa>0, Xminus<4564 and Xminus<loopILeft and Xminus<X0I1',
        'collar simplifications 5175→4788, 5293→5255, 6182→5665 require Xa<X<Xminus',
        'core matches 4786,6201 require 0<X<Xa',
        'X=xi^2, exact integral dummy alpha-renaming and associative-commutative real arithmetic',
        'all operations, integrals, real derivatives defined; non-eager left-first branch semantics',
        'Xa, X=0, and endpoint jets require separate limits/regularity'],
      'negative_controls':['omit 6182 branch rewrite: collar v0 match fails','change 5675 collar branch: AST guard rejects'],
      'not_proved':['source native physical argument bounds','Picard convergence or ODE satisfaction','F0 branch binding','actual full residual/moment cancellation','all n>=1']}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(out,indent=2),encoding='utf8')
 print('PASS: five exact interned structural subtree matches; collar rewrite guards explicit; two negative controls PASS')
if __name__=='__main__':main()
