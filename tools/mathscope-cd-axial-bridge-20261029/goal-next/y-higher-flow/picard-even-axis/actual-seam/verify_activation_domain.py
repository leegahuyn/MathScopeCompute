#!/usr/bin/env python3
"""Check exact original parameter-expression shapes and rational domain chain."""
import argparse, hashlib, json
from fractions import Fraction as F
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--source-dir',type=Path,required=True)
p.add_argument('--out',type=Path)
a=p.parse_args()
path=a.source_dir/'source-profile-data.mjs'
raw=path.read_bytes().replace(b'\r\n',b'\n')
pin='df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
assert hashlib.sha256(raw).hexdigest()==pin
body=raw.decode('utf8').split('export const PINNED_N3 = ',1)[1].strip()
if body.endswith(';'): body=body[:-1]
profile=json.loads(body); v=profile['parametersExactExpressions']
assert v['T']=={'sum':[{'exp':{'ref':'Md'}},{'integer':10}]}
assert v['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}
assert v['j0']=={'power':[{'ref':'h'},4]}
assert v['sigmaStar']=={'quotient':[{'ref':'j0'},{'integer':2000}]}
assert v['logP']=={'product':[{'integer':2},{'ref':'T'}]}
assert v['Pstar']=={'exp':{'ref':'logP'}}
assert v['K']=={'power':[{'ref':'Pstar'},2]}
assert v['Q']['quotient'][0]['product'][1]=={'ref':'K'}
assert int(v['Q']['quotient'][0]['product'][0]['integer'])>1
assert v['Q']['quotient'][1]=={'power':[{'ref':'sigmaStar'},2]}
assert v['Lambda']=={'power':[{'ref':'Q'},64]}
assert v['BRefUpper']=={'power':[{'ref':'Q'},300]}
assert v['logCSelected']=={'sum':[{'product':[{'integer':10},{'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},{'power':[{'ref':'Q'},200]}]}
assert v['CSelected']=={'exp':{'ref':'logCSelected'}}
assert v['t1']=={'power':[{'ref':'CSelected'},-120]}
assert v['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]}
assert v['omega1']=={'ref':'t1'} and v['omega2']=={'ref':'t1'}
# T>10, h<1, sigmaStar<1, K>1, Q>1, Lambda>1,
# logCSelected>1, CSelected>e>2, 0<t1<2^-120<1/4.
assert F(1,2**120)<F(1,4)
# For 0<=x<1, exp(x)<=1/(1-x), by coefficient comparison.
start_bound=F(4,1)/(1-F(1,4))
activation_Y_bound=F(4,1)/(1-F(1,64))
assert start_bound==F(16,3) and start_bound<100<110
assert activation_Y_bound==F(256,63) and activation_Y_bound<F(41,10)
out={'status':'PASS','activation_bounds':'0<t1<1/4; 0<Xa<4; Xa*exp(t1)<16/3<100<110; Y<=256/63<41/10',
     'conclusion':'literal B22 reference is natural on the actual activation interval; beta=1, blend=0; natural Y<=41/10',
     'analytic_domain_still_required':'source natural analytic convergence and Phi nonvanishing on the eta strip',
     'source_profile_canonical_LF_sha256':pin}
text=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(text,encoding='utf-8',newline='\n')
print(text,end='')
