"""Independent finite source check: XK terminal-wait DAG and base Qb/Qp copies.

No integral or source-step analytic property is assumed established here.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from functools import lru_cache
from fractions import Fraction

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',required=True,type=Path);p.add_argument('--profile',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args()
 h=hashlib.sha256();d=[]
 with gzip.open(a.source/'original-source-nodes.jsonl.gz','rb') as f:
  line=f.readline();h.update(line);header=json.loads(line)
  for i,line in enumerate(f):
   h.update(line)
   if i<=71673:d.append(json.loads(line))
 assert h.hexdigest()=='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269' and header['node_count']==4420257
 profile=a.profile.read_bytes();assert hashlib.sha256(profile).hexdigest()=='df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
 params=json.JSONDecoder().raw_decode(profile.decode().split('export const PINNED_N3 = ',1)[1])[0]['parametersExactExpressions']
 assert params['X0I2']=={'product':[{'ref':'XR'},{'exp':{'sum':[{'ref':'T'},{'integer':2},{'product':[{'integer':60},{'ref':'BOuter'}]},{'integer':-20}]}}]}
 assert params['co']=={'rational':'1/256'} and params['Tf']=={'integer':128}
 expected={71673:('multiply',[71478,71672]),71478:('multiply',[12,71477]),71477:('exp',[71476]),71476:('add',[218,71475]),71475:('multiply',[71474,279]),71474:('log_positive',[71473]),71473:('multiply',[71461,71472]),71472:('inverse',[71471]),279:('inverse',[207]),207:('add',[1,21]),21:('multiply',[9,20]),20:('rational',['-1','1']),71672:('exp',[4708]),4708:('rational',['1','5']),12:('source_parameter',['XR']),9:('source_parameter',['h'])}
 expected.update({1:('rational',['1','1']),6:('source_parameter',['T']),7:('source_parameter',['BOuter']),8:('source_parameter',['lambda']),13:('source_parameter',['Tf']),56:('add',[1,6]),76:('add',[1,56]),83:('rational',['60','1']),84:('multiply',[7,83]),98:('add',[76,84]),101:('rational',['13','1']),102:('inverse',[8]),103:('multiply',[101,102]),114:('add',[98,103]),139:('add',[13,114]),147:('rational',['30','1']),148:('multiply',[7,147]),158:('add',[139,148]),179:('add',[1,158]),184:('rational',['-4','1']),185:('log_positive',[9]),186:('multiply',[184,185]),199:('add',[179,186]),218:('add',[1,199])})
 for i,(op,args) in expected.items():assert d[i]=={'op':op,'args':args},i
 intern={}; rev={}
 def it(v):
  if v not in intern:intern[v]=len(intern)+1;rev[intern[v]]=v
  return intern[v]
 @lru_cache(None)
 def norm(i,env=()):
  bindings=dict(env)
  if i in bindings:return it(('bound',bindings[i]))
  n=d[i];op=n['op'];args=n['args']
  if op in ('rational','source_parameter','coordinate'):return it((op,*args))
  if op=='definite_integral':
   body,var,lo,hi=args; assert d[var]['op']=='coordinate';return it((op,norm(body,env+((var,len(env)),)),norm(lo,env),norm(hi,env)))
  if op in ('add','multiply'):
   todo=[norm(j,env) for j in args];vals=[]
   while todo:
    x=todo.pop();v=rev[x]
    if v[0]==op:todo.extend(v[1:])
    else:vals.append(x)
   return it((op,*sorted(vals)))
  if op in ('source_step_derivative','integer_power'):return it((op,norm(args[0],env),*args[1:]))
  if op in ('inverse','exp','log_positive','sqrt_positive','smooth_piecewise'):return it((op,*(norm(j,env) for j in args)))
  raise ValueError((i,op))
 checks={'Qb_copy_exact_modulo_alpha_and_AC':norm(259)==norm(71461),'Qp_copy_exact_modulo_alpha_and_AC':norm(275)==norm(71471)}
 @lru_cache(None)
 def free_coords(i,bound=()):
  n=d[i];op=n['op'];args=n['args']
  if op=='coordinate':return frozenset() if i in bound else frozenset([i])
  if op in ('rational','source_parameter'):return frozenset()
  if op=='definite_integral':
   body,var,lo,hi=args;return free_coords(body,bound+(var,))|free_coords(lo,bound)|free_coords(hi,bound)
  if op in ('source_step_derivative','integer_power'):return free_coords(args[0],bound)
  if op in ('add','multiply','inverse','exp','log_positive','sqrt_positive','smooth_piecewise'):
   return frozenset().union(*(free_coords(j,bound) for j in args))
  raise ValueError((i,op))
 checks['Qb_Qp_have_no_free_coordinate']=not free_coords(71461) and not free_coords(71471)
 assert all(checks.values()),checks
 # Negative control: swapping the ratio reverses wait and is excluded by Qb>Qp.
 qb,qp=Fraction(1,2),Fraction(1);assert qb>0 and qp>qb
 out={'graph_sha256':h.hexdigest(),'nodes':header['node_count'],'profile_sha256':hashlib.sha256(profile).hexdigest(),'source_paths':{'outer_blob':'f8097860af5514eaa0b0dbad6ac2086277047f16','support_blob':'21a4dffe89f77056588fb00f0bac20e6881b8343'},'checks':checks,'guards':{'X0I2':'XR*exp(60001*T-18)>XR>Xminus, provided stated pinned parameter inequalities','XK':'XK=XR*exp(prewait+log(Qb/Qp)/(1-h)+1/5); prewait>0 and Qb>Qp>0 imply XK>XR>Xminus'},'negative_control':{'Qb':'1/2','Qp':'1','observation':'Qb/Qp<1; wait is negative for h<1, so positivity is not automatic'},'limits':['This checks finite graph equality; it does not itself prove analytic Qb>Qp, integrability, flat-step properties or native inputs.']}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(out,indent=2),encoding='utf8');print('PASS: source XK and Qb/Qp DAGs matched; analytic inequalities remain hypotheses')
if __name__=='__main__':main()
