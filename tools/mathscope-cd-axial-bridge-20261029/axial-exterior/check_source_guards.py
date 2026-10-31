"""Check pinned source parameter syntax and exact inequalities used in guards.

Arithmetic assertions accompany the inequality derivation in SOURCE_GUARDS.md;
the interpreter and analytic smoothness remain independent obligations.
"""
import argparse,hashlib,json
from pathlib import Path

EXPECTED_SHA='df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
def integer(n):return {'integer':n}
def ref(n):return {'ref':n}
def mul(*x):return {'product':list(x)}
def add(*x):return {'sum':list(x)}
def exp(x):return {'exp':x}
def pow_(x,n):return {'power':[x,n]}
def div(x,y):return {'quotient':[x,y]}

def check(p):
 T=ref('T'); XR=ref('XR'); B=ref('BOuter'); Q=ref('Q')
 expected={
  'Md':integer(1048576),'T':add(exp(ref('Md')),integer(10)),
  'BOuter':mul(integer(1000),T),'lambda':exp(mul(integer(-1000),T)),
  'h':exp(mul(integer(-8002),T)),'j0':pow_(ref('h'),4),'sigmaStar':div(ref('j0'),integer(2000)),
  'logP':mul(integer(2),T),'Pstar':exp(ref('logP')),'K':pow_(ref('Pstar'),2),
  'Q':div(mul(integer('1852673427797059126777135760139006525652319754650249024631321344126610074238976'),ref('K')),pow_(ref('sigmaStar'),2)),
  'Lambda':pow_(Q,64),'Xa':div(integer(4),ref('Lambda')),'BRefUpper':pow_(Q,300),
  'logCSelected':add(mul(integer(10),{'log':add(integer(1),ref('BRefUpper'))}),pow_(Q,200)),
  'CSelected':exp(ref('logCSelected')),'t1':pow_(ref('CSelected'),-120),
  'XR':mul(integer(110),pow_(mul(ref('CSelected'),ref('Pstar')),10)),
  'X0I1':mul(XR,exp(add(T,integer(2),mul(integer(60),B),integer(-25)))),
  'X0Ipos':mul(XR,exp(add(T,integer(2),mul(integer(60),B),integer(-14)))),
  'IposRight':mul(ref('X0Ipos'),exp(integer(5))),
  'loopIRight':mul(XR,exp(add(T,integer(3))))}
 return [k for k,v in expected.items() if p.get(k)!=v]

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--profile',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
 raw=a.profile.read_bytes();assert hashlib.sha256(raw).hexdigest()==EXPECTED_SHA
 text=raw.decode('utf8');v,_=json.JSONDecoder().raw_decode(text.split('export const PINNED_N3 = ',1)[1]);p=v['parametersExactExpressions']
 assert v['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
 assert check(p)==[]
 fake=dict(p);fake['X0I1']=integer(1);assert check(fake)==['X0I1']
 assert 8193**2==67125249 and 4096**2==16777216 and 67125249 < 6*16777216
 assert 26+1>11 and 3*32-1>0
 # Exponents use exact coefficient vectors (constant,T,B,1/lambda).
 plus=(3,1,60,1)
 def sub(x,y):return tuple(a-b for a,b in zip(x,y))
 assert sub(plus,(3,1,0,0))==(0,0,60,1)       # loopIRight
 assert sub(plus,(1,1,0,0))==(2,0,60,1)       # XR exp(T+1)
 assert sub(plus,(-5,0,0,0))==(8,1,60,1)     # XR exp(-5)
 assert sub(plus,(-7,1,60,0))==(10,0,0,1)    # IposRight
 assert sub(plus,(-23,1,60,0))==(26,0,0,1)   # X0I1
 data={'source_profile_sha256':EXPECTED_SHA,'git_blob':'f1559221145b5d4ce051bbdb9cb84254045c8696',
       'parameter_expression_sha256':v['parameterExpressionSHA256'],
       'checked_source_parameters':sorted(p.keys() & {'Md','T','BOuter','lambda','h','j0','sigmaStar','logP','Pstar','K','Q','Lambda','Xa','BRefUpper','logCSelected','CSelected','t1','XR','X0I1','X0Ipos','IposRight','loopIRight'}),
       'negative_control':'mutated X0I1 rejected',
       'rational_checks':{'(8193/4096)^2<6':True,'exp(5)>6':'by exp(x)>1+x for x>0','exp(26)>27>10.5':'by exp(x)>1+x for x>0'},
       'status':'Exact source parameter AST matches; mathematical guard ordering proof in SOURCE_GUARDS.md; conditional smooth/natively-defined semantics and actual caller-domain binding remain open.'}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(data,indent=2),encoding='utf8');print('PASS: 22 pinned source parameter trees; rational guard comparisons; mutated parameter rejected')
if __name__=='__main__':main()
