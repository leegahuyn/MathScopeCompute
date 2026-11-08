"""Structural F0 inner binding under explicitly stated strict plateau guards.

No actual Picard solvability, integral cancellation, native chart domain, or
numerical evaluation of analytic nodes is asserted.
"""
import argparse, gzip, hashlib, json
from functools import lru_cache
from pathlib import Path

GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
PROFILE='df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'

def run():
 p=argparse.ArgumentParser();p.add_argument('--source',required=True,type=Path);p.add_argument('--profile',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args()
 reg=(a.source/'original-source-functions.json').read_bytes(); assert hashlib.sha256(reg).hexdigest()==REG
 profile=a.profile.read_bytes();assert hashlib.sha256(profile).hexdigest()==PROFILE
 data,_=json.JSONDecoder().raw_decode(profile.decode('utf8').split('export const PINNED_N3 = ',1)[1]);params=data['parametersExactExpressions']
 assert params['X0I2']=={'product':[{'ref':'XR'},{'exp':{'sum':[{'ref':'T'},{'integer':2},{'product':[{'integer':60},{'ref':'BOuter'}]},{'integer':-20}]}}]}
 base=json.loads(reg)['base']['base']; expr=json.loads(base['expression']); picard=json.loads(base['picard'])
 assert expr[2]['name']=='ActualFinalLeadingF' and expr[2]['parameters']==[4756,2] and expr[2]['body']==71959
 assert picard[0]['sourceLeading']['F0']==25601
 d={};h=hashlib.sha256();count=0
 with gzip.open(a.source/'original-source-nodes.jsonl.gz','rb') as f:
  hdr=f.readline();h.update(hdr);meta=json.loads(hdr)
  for i,line in enumerate(f):
   h.update(line)
   if i<=71959:d[i]=json.loads(line)
   count+=1
 assert count==4420257==meta['node_count'] and h.hexdigest()==GRAPH
 expected={
  0:('rational',['0','1']),12:('source_parameter',['XR']),24:('rational',['2','1']),
  3617:('source_parameter',['Xa']),3618:('rational',['110','1']),
  3612:('source_parameter',['t1']),28811:('rational',['1','128']),28812:('multiply',[3612,28811]),28813:('exp',[28812]),28814:('multiply',[3617,28813]),
  4756:('coordinate',['X']),25516:('coordinate',['actual_inner_xi']),25586:('integer_power',[25516,2]),
  24805:('multiply',[3617,24804]),6257:('source_parameter',['loopILeft']),6258:('source_parameter',['loopIRight']),
  7981:('source_parameter',['X0I1']),7982:('source_parameter',['I1Right']),
  71678:('source_parameter',['X0I2']),71679:('source_parameter',['I2Right']),
  4759:('multiply',[3498,4758]),25589:('multiply',[3498,25588]),
  4758:('actual_natural_series',['Phi',4757,2,0,0]),25588:('actual_natural_series',['Phi',25587,2,0,0]),
  4757:('multiply',[3454,4756]),25587:('multiply',[3454,25586]),
  4779:('multiply',[24,4756]),4780:('sqrt_positive',[4779]),4781:('inverse',[4780]),
  25590:('multiply',[24,25586]),25591:('sqrt_positive',[25590]),25592:('inverse',[25591]),
  25599:('multiply',[25591,25598]),25600:('multiply',[25592,25599]),
  25601:('smooth_piecewise',[25586,3617,24805,25589,25600,25600]),
  71959:('smooth_piecewise',[4756,3617,71673,4759,71958,71958]),
  71958:('multiply',[4781,71957]),71957:('add',[71955,71956]),71956:('add',[71741,71907]),
  71955:('smooth_piecewise',[4756,71673,71673,0,71954,71954]),
  71741:('smooth_piecewise',[4756,71678,71679,0,71740,0]),
  71907:('add',[71905,71906]),71905:('smooth_piecewise',[4756,7981,7982,0,9227,0]),
  71906:('add',[71903,71904]),71904:('smooth_piecewise',[4756,6257,6258,0,7965,0]),
  71903:('smooth_piecewise',[4756,12,5091,6304,71902,71902]),
  6304:('smooth_piecewise',[4756,5089,12,6303,6299,6299]),6303:('add',[5087,6302]),
  6302:('smooth_piecewise',[4756,3617,3618,6300,6301,4778]),6301:('multiply',[4765,4780]),
  5087:('multiply',[5071,5086]),5086:('add',[5084,5085]),5085:('add',[5076,5080]),
  5084:('multiply',[5029,5083]),5076:('multiply',[5027,5075]),5080:('multiply',[5028,5079]),
  5075:('source_step_derivative',[5074,1]),5079:('source_step_derivative',[5078,1]),5083:('source_step_derivative',[5082,1]),
  5074:('multiply',[4816,5073]),5078:('multiply',[4816,5077]),5082:('multiply',[4816,5081]),
  5073:('add',[4790,4847]),5077:('add',[4790,4892]),5081:('add',[4790,4936]),
  4790:('multiply',[4615,4756]),4615:('inverse',[12]),4816:('rational',['4096','1']),
  4847:('rational',['-1','256']),4892:('rational',['-9','2048']),4936:('rational',['-5','1024']),
 }
 def guard(g):return all(g[i]=={'op':op,'args':args} for i,(op,args) in expected.items())
 assert guard(d)
 def equal(i,j,sub):
  # Intern complete symbolic structures as tuples, not numerical/hash sampling.
  table={}; reverse={}; seen=set()
  def it(k):
   if k not in table:
    table[k]=len(table)+1;reverse[table[k]]=k
   return table[k]
  def replace(k,env):
   if k in sub:
    if k!=25586: assert not env,('unsafe_rewrite_under_binder',k)
    seen.add(k)
   return sub.get(k,k)
  def flat(k,op,env):
   k=replace(k,env); v=d[k]
   if v['op']==op:return [z for q in v['args'] for z in flat(q,op,env)]
   return [k]
  @lru_cache(None)
  def norm(k,env=()):
   k=replace(k,env);bindings=dict(env)
   if k in bindings:return it(('bound',bindings[k]))
   n=d[k];op=n['op'];x=n['args']
   if op in ('rational','coordinate','source_parameter'):return it((op,*x))
   if op=='definite_integral':
    body,var,lo,hi=x;assert d[var]['op']=='coordinate' and var not in (4756,25516,25586)
    return it((op,norm(body,env+((var,len(env)),)),norm(lo,env),norm(hi,env)))
   if op in ('add','multiply'):
    vals=[norm(q,env) for q in flat(k,op,env)]
    # A branch rewrite can expose an additional product/sum beneath a
    # syntactic add/product. Flatten again *after* normalization.
    todo=vals; vals=[]
    while todo:
     v=todo.pop(); structure=reverse[v]
     if structure[0]==op:todo.extend(structure[1:])
     else:vals.append(v)
    zero=it(('rational','0','1'))
    if op=='add':
     vals=[v for v in vals if v!=zero]
     if not vals:return zero
     if len(vals)==1:return vals[0]
    elif zero in vals:return zero
    return it((op,*sorted(vals)))
   if op in ('integer_power','source_step_derivative'):return it((op,norm(x[0],env),*x[1:]))
   if op=='actual_natural_series':return it((op,x[0],norm(x[1],env),norm(x[2],env),*x[3:]))
   if op=='actual_quadratic_root':return it((op,*x[:2],*(norm(q,env) for q in x[2:])))
   if op=='actual_expression_partial':return it((op,x[0],tuple(norm(q,env) for q in x[1]),tuple(x[2])))
   if op in ('inverse','exp','log_positive','sqrt_positive','smooth_piecewise','sine','cosine'):
    return it((op,*(norm(q,env) for q in x)))
   raise ValueError(('unsupported',k,op))
  return norm(i)==norm(j),sorted(seen),len(table)
 core={71959:4759,25601:25589,25586:4756}
 collar={71959:71958,25601:25600,25586:4756,71955:0,71741:0,71905:0,71904:0,71903:6304,6304:6303,6302:6301,5087:0}
 c,cr,cn=equal(71959,25601,core); k,kr,kn=equal(71959,25601,collar)
 assert c and k,(c,k,cr,kr)
 wrong=dict(collar);wrong.pop(5087);assert not equal(71959,25601,wrong)[0]
 wrong=dict(collar);wrong.pop(71955);assert not equal(71959,25601,wrong)[0]
 fake=dict(d);fake[6302]=dict(d[6302]);fake[6302]['args']=list(fake[6302]['args']);fake[6302]['args'][4]=6300
 assert not guard(fake)
 result={'graph_sha256':GRAPH,'registry_sha256':REG,'profile_sha256':PROFILE,'node_count':count,
   'actual_F0':71959,'picard_F0':25601,'core':{'equal':c,'rewrites':cr,'intern_nodes':cn},
   'collar':{'equal':k,'rewrites':kr,'intern_nodes':kn},
   'conditions':['0<X<Xa (core) or Xa<X<Xminus (collar); X=xi^2 with xi>0',
     'Xminus<min(110,aSquared,XK,X0I2,X0I1,loopILeft,XR,XR exp(-5))',
     'Xminus/XR<1/256; source step derivative order one is zero on negative arguments',
     'source choose is left-first and non-eager, smooth real interpretations are defined locally',
     'all factors being eliminated are actually defined, no zero times undefined',
     'source-derived guards use Xa<4, 0<t1<1, T>10 and XR>110 exp(20T); see F0_BINDING.md',
     'Xminus<XK remains an explicit hypothesis unless separately proven'],
   'negative_controls':['remove B8 step plateau: no match','remove heat cutoff: no match','mutate actual collar branch: rejected'],
   'not_proved':['Xminus<XK from source parameters','native argument domain','boundary and axis differentiability','Picard ODE or convergence','residual or integral moment']}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(result,indent=2),encoding='utf8')
 print('PASS: actual F0 / Picard F0 exact core and collar DAG equality under explicit strict guards; three negative controls')
if __name__=='__main__':run()
