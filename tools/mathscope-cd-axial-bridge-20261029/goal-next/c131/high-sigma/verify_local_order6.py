#!/usr/bin/env python3
"""Original C107 local stress chains at Z⁵T and RZ⁴T, order six."""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser()
for x in ('work','goal','out'):p.add_argument('--'+x,type=Path,required=True)
a=p.parse_args();W=a.work
base=W/'continuation127/signed-local-high-time/verify_signed_local_high_time.py';raw=base.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='92ba0e0c982e797b3f9be6faf55708c1eaa34311c2983219ef000689b0c3e567'
dep=W/'continuation131/high-sigma/frontier.json';digest=hashlib.sha256(dep.read_bytes()).hexdigest()
assert digest=='06f1c8ec97ef6361764453bc6cd65e1e4bd09d6ded2615cc1a032c2e0bed4b55'
src=raw.decode('utf-8')
def replace(old,new):
 global src
 assert src.count(old)==1,old
 src=src.replace(old,new,1)
replace('"scope":"79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36"',f'"scope":"{digest}"')
replace('assert dep["fixedEndpoints"]==','assert dep["sourceEndpoints"]==')
replace('"fixedEndpoints":dep["fixedEndpoints"]','"fixedEndpoints":dep["sourceEndpoints"]')
replace('DIRECTIONS=((0,3,1),(0,4,1),(1,2,1),(1,3,1))','DIRECTIONS=((0,5,1),(1,4,1))')
replace('for x in ("a","b") for i in range(5)','for x in ("a","b") for i in range(6)')
replace('for _ in range(5):\n        lp.append','for _ in range(6):\n        lp.append')
replace('for _ in range(4):\n        direct.append','for _ in range(5):\n        direct.append')
replace('for n in range(1,6):','for n in range(1,7):')
replace('    order=5\n','    order=6\n')
replace('len(donor["ordinaryCapRows"])>=6','len(donor["ordinaryCapRows"])>=7')
replace('donor["ordinaryCapRows"][:6]','donor["ordinaryCapRows"][:7]')
replace('for row in table[:6]','for row in table[:7]')
replace('assert [x["exactFreeJetTerms"] for x in chains]==[295,849,200,653]','assert len(chains)==2 and all(x["maxOriginalProfileOrder"]==6 for x in chains)')
replace('assert [x["polynomialMassBits"] for x in chains]==[12,16,11,15]','assert all(x["polynomialMassBits"]<24 for x in chains)')
replace('assert chart_bits==[0,6,17,30,43,57]','assert chart_bits[:6]==[0,6,17,30,43,57] and len(chart_bits)==7 and chart_bits[6]<256')
replace('extra=10*256+128','extra=12*256+128')
replace('16+10+2<=32','16+12+2<=32')
replace('8+10+2<=32','8+12+2<=32')
replace('18*u*u+','21*u*u+')
replace('18*d*d+','21*d*d+')
replace('"highestNeededPrimitiveProfileDerivative":5','"highestNeededPrimitiveProfileDerivative":6')
replace('"MathScope.C127.OriginalSignedLocalHigherMixedTime/1"','"MathScope.C131.OriginalSignedLocalOrderSixMixedTime/1"')
env={'__name__':'c131_local_order6_adapter'};exec(compile(src,str(base),'exec'),env)
class Inputs:pass
i=Inputs();i.goal=a.goal;i.dependencies=dep;i.prior_local=W/'continuation125/signed-local-rzt-zzt/signed-local-rzt-zzt.json';i.out=a.out
env['main'](i)
out=json.loads(a.out.read_bytes());assert {tuple(row['direction']) for row in out['conditionalRows']}=={(0,5,1),(1,4,1)}
assert all(row['innerPole']==18 and row['outerPole']==21 for row in out['conditionalRows'])
out['c131InputPins']={'census':digest,'baseVerifier':hashlib.sha256(raw).hexdigest()}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode())
