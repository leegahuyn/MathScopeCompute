#!/usr/bin/env python3
"""Replay pinned high local stress chain with actual R²ZT query added."""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser()
for x in ('work','goal','out'):p.add_argument('--'+x,type=Path,required=True)
a=p.parse_args();W=a.work
base=W/'continuation127/signed-local-high-time/verify_signed_local_high_time.py';raw=base.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='92ba0e0c982e797b3f9be6faf55708c1eaa34311c2983219ef000689b0c3e567'
dep=W/'continuation130/sigma-rrzt/recurrence.json';digest=hashlib.sha256(dep.read_bytes()).hexdigest()
assert digest=='792776a8535ffea5dea722ed53c363f18d1a9d56b1b882b16243808a0c2c221d'
source=raw.decode('utf-8')
def replace(old,new):
 global source
 assert source.count(old)==1,old
 source=source.replace(old,new,1)
replace('"scope":"79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36"',f'"scope":"{digest}"')
replace('DIRECTIONS=((0,3,1),(0,4,1),(1,2,1),(1,3,1))','DIRECTIONS=((0,3,1),(0,4,1),(1,2,1),(1,3,1),(2,1,1))')
replace('p=apply_R(direct[z]) if r else direct[z]','p=direct[z]\n        for _ in range(r): p=apply_R(p)')
replace('alternate=apply_R(direct[0])','alternate=direct[0]\n            for _ in range(r): alternate=apply_R(alternate)')
replace('assert set(map(tuple,dep["newLocalStressDirections"]))==set(DIRECTIONS)','assert set(map(tuple,dep["newLocalStressDirections"]))=={(2,1,1)}')
replace('assert [x["exactFreeJetTerms"] for x in chains]==[295,849,200,653]','assert [x["exactFreeJetTerms"] for x in chains[:4]]==[295,849,200,653]')
replace('assert [x["polynomialMassBits"] for x in chains]==[12,16,11,15]','assert [x["polynomialMassBits"] for x in chains[:4]]==[12,16,11,15]')
replace('"MathScope.C127.OriginalSignedLocalHigherMixedTime/1"','"MathScope.C130.OriginalSignedLocalHigherRRZT/1"')
env={'__name__':'c130_local_high_adapter'};exec(compile(source,str(base),'exec'),env)
class Inputs: pass
i=Inputs();i.goal=a.goal;i.dependencies=dep;i.prior_local=W/'continuation125/signed-local-rzt-zzt/signed-local-rzt-zzt.json';i.out=a.out
env['main'](i)
out=json.loads(a.out.read_bytes());r,=[r for r in out['conditionalRows'] if r['direction']==[2,1,1]]
assert (r['innerPole'],r['outerPole'],r['middlePole'])==(12,15,0)
out['c130InputPins']={'census':digest,'baseVerifier':hashlib.sha256(raw).hexdigest()}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode())
