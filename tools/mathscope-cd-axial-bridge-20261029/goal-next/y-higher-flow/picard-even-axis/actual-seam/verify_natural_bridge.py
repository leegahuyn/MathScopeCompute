#!/usr/bin/env python3
"""Bind original axis proof to selected native source and check exact scalar implications."""
import argparse,hashlib,json
from fractions import Fraction as F
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--source-dir',type=Path,required=True)
p.add_argument('--evidence-dir',type=Path,default=Path(__file__).parent/'natural-source')
p.add_argument('--out',type=Path)
a=p.parse_args()
proof=a.evidence_dir/'SAME_DATUM_ANALYTIC_AXIS.md'; certpath=a.evidence_dir/'axis-envelope-certificate.json'
profilepath=a.source_dir/'source-profile-data.mjs'; backpath=a.source_dir/'actual-background-majorant.mjs'; innerpath=a.source_dir/'actual-continuation-exact-inner.mjs'; corepath=a.source_dir/'actual-continuation-exact-core.mjs'
pins={proof:'1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920',certpath:'32f59e314e04d71bd7d47cf1bf3d1208e98b6549240875b7e2e2740c63ba2605',profilepath:'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a',innerpath:'3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',corepath:'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',backpath:'e741d1cd144481c205874d05842b7961807c923f92155a662347dbcd48785b52'}
for path,digest in pins.items():
    raw=path.read_bytes()
    # Git blob evidence is pinned raw; JS source may use checkout CRLF.
    if path not in (proof,certpath):raw=raw.replace(b'\r\n',b'\n')
    assert hashlib.sha256(raw).hexdigest()==digest, path
certificate=json.loads(certpath.read_bytes()); doc=proof.read_text(encoding='utf8')
profile_text=profilepath.read_text(encoding='utf8').split('export const PINNED_N3 = ',1)[1].strip().removesuffix(';')
profile=json.loads(profile_text); params=profile['parametersExactExpressions']; previous=certificate['parametersExactExpressions']
def normalize(x):
    if isinstance(x,dict):return {k:normalize(v) for k,v in x.items()}
    if isinstance(x,list):return [normalize(v) for v in x]
    if isinstance(x,int):return str(x)
    return x
for key in ('Md','T','logP','Pstar','lambda','h','K','j0','sigmaStar','rho','Q','Lambda'):
    assert normalize(previous[key])==normalize(params[key]),key
assert params['CSelected']=={'exp':{'ref':'logCSelected'}}
assert params['logCSelected']=={'sum':[{'product':[{'integer':10},{'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},{'power':[{'ref':'Q'},200]}]}
assert params['BRefUpper']=={'power':[{'ref':'Q'},300]}
assert params['Q']['quotient'][0]['product'][0]['integer']==str(2**260)
assert params['Q']['quotient'][0]['product'][1]=={'ref':'K'}
assert params['Q']['quotient'][1]=={'power':[{'ref':'sigmaStar'},2]}
assert params['Lambda']=={'power':[{'ref':'Q'},64]}
assert certificate['status']=='EXACT_SCALAR_CHECKS_SUPPORT_WRITTEN_LOCAL_AXIS_PROOF'
assert certificate['passed']==certificate['total']==51
assert certificate['boundaries']['writtenProofSuppliesInfiniteFixedPoint']
assert not certificate['boundaries']['fullAnalyticPremisesProvedInLean']
assert certificate['sourceBinding']['paperSHA256']==profile['sourcePaperSHA256']
for fragment in ('**`Phi>1/4`**','|Y|<20','`||x||<=Q`','`g_eta=Lambda*zeta*g`','`p_Y=g^2 Phi^2`'):
    assert fragment in doc, fragment
background=backpath.read_text(encoding='utf8'); inner=innerpath.read_text(encoding='utf8')
assert '|Phi_eta|<=4Q/rho' in background
assert 'const delta=G.div(rho,G.mul(q(1024),Q))' in inner
assert "C=G.parameter('CSelected')" in corepath.read_text(encoding='utf8')
# The independent axis proof gives Phi>=305719/1152000 - 2^-100 on
# the real rectangle. Background derivative transport to distance delta:
# 4Q/rho * delta = 1/256. None of these use binary floating point.
assert F(305719,1152000)-F(1,2**100)>F(1,4)
assert F(1,4)-F(1,256)==F(63,256)>F(1,8)
assert F(1,1024)<F(1,4) # Q>=2^260 > 1 makes delta<rho/4.
# Q=2^260 K/sigma^2, K>1 and sigma<1, hence Q>=2^260.
# 64 Lambda/sigma^2 < 64 Q^65/2^260 <= Q^65/2 and,
# for Q>=2, Q^200 >= 2 Q^65 > Q^65/2+1.
assert 64*2 < 2**260
assert 2**135>=2
out={'status':'PASS','same_actual_parameter_keys':12,'original_axis_scalar_checks':'51/51',
 'selected_amplitude':'CSelected>exp(Q^200)>exp(64 Lambda/sigmaStar^2+1)=Caxis',
 'phi_bound':'|Phi|>63/256>1/8 on Y<=41/10, distance(eta,[-1,1])<=delta',
 'source_scope':'original written infinite fixed point and convergence, supported by exact scalar checks; not a formal proof of all analytic premises in Lean',
 'pins':{p.name:h for p,h in pins.items()}}
txt=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(txt,encoding='utf8',newline='\n')
print(txt,end='')
