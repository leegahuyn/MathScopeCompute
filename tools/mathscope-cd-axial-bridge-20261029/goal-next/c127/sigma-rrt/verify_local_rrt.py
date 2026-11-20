#!/usr/bin/env python3
"""Replay original C125 local stress bound with the additional RRT chain."""
import argparse,hashlib,json
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--goal',type=Path,required=True);p.add_argument('--work',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
code=a.work/'continuation125/signed-local-rzt-zzt/verify_signed_local_rzt_zzt.py';raw=code.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='a606416a3603cd1ca15ef649650e97a1e91785021904938884008fea30a3bb94'
census=a.work/'continuation127/sigma-rrt/replay.json';data=json.loads(census.read_bytes())
assert hashlib.sha256(census.read_bytes()).hexdigest()=='e77795e860888dc33f12dc1f0b506fda4030d4fe7df038cb897d79b706782e9d'
assert data['target']==[2,0,1] and [2,0,1] in data['allRoles']['localStress']
src=raw.decode('utf-8')
def replace(old,new):
 global src
 assert src.count(old)==1,old
 src=src.replace(old,new,1)
replace('    RZT=R(ZT)\n','    RRT=R(R(F))\n    RZT=R(ZT)\n')
replace('for tag,value in (("RZT",RZT),("ZZT",ZZT)):', 'for tag,value in (("RZT",RZT),("ZZT",ZZT),("RRT",RRT)):')
replace('    exact_rows=[\n','    exact_rows=[\n        {"direction":[2,0,1],"epsilonGrade":"1","band":"0","gaussian":"zeta","innerPole":9,"outerPole":12,"middlePole":0,"logCoefficient":"H/2^252"},\n')
replace('"directions":[[1,1,1],[0,2,1]]','"directions":[[1,1,1],[0,2,1],[2,0,1]]')
replace('"VERIFIED_ORIGINAL_LOCAL_STRESS_CHAIN_CONDITIONAL_WEIGHTED_RZT_ZZT"','"VERIFIED_ORIGINAL_LOCAL_STRESS_CHAIN_CONDITIONAL_WEIGHTED_RZT_ZZT_RRT"')
ns={'__name__':'c127_pinned_c125_adapter'};exec(compile(src,str(code),'exec'),ns)
class Inputs:pass
i=Inputs();i.goal=a.goal;i.demand=a.work/'continuation125/sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json';i.out=a.out
ns['main'](i)
result=json.loads(a.out.read_bytes());assert [2,0,1] in result['conditionalCap']['directions']
assert result['operators']['RRT']['actualProfileSlots_q_X_eta']
result['c127SourcePins']={'baseVerifierSHA256':hashlib.sha256(raw).hexdigest(),'rrtCensusSHA256':hashlib.sha256(census.read_bytes()).hexdigest()}
a.out.write_bytes((json.dumps(result,indent=2)+'\n').encode())
print('PASS original RRT local, slots',result['operators']['RRT']['actualProfileSlots_q_X_eta'])
