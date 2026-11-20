#!/usr/bin/env python3
"""Hash the fixed PostFive mean derivative result and its direct inputs."""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
for flag in ('goal','protected','prior','reference','operators','packet','out'):p.add_argument('--'+flag,type=Path,required=True)
a=p.parse_args();D=a.packet;G=a.goal
files=[D/x for x in ('README.md','verify_mean_first_derivatives.py','double_replay.py','hash_evidence.py','first-derivative-grades.json','first-derivative-replay-1.json','first-derivative-replay-2.json','double-replay.json')]
files += [G/x for x in ('c105/late-grade/late-grade.json','c108/mode-one-late-mean/late-mode-one-mean.json','c108/first-k1-energy/k1-donor-join.json','c107/forced-mode-one-guards/verify_mode_one_guard_geometry.py')]
files += [a.protected,a.prior,a.reference,a.operators]
rows=[]
for f in files:
 h=hashlib.sha256(f.read_bytes()).hexdigest();rows.append({'path':f.as_posix(),'bytes':f.stat().st_size,'sha256':h})
receipt=json.loads((D/'first-derivative-grades.json').read_bytes());assert receipt['status']=='CONDITIONAL_PROTECTED_POSTFIVE_PHYSICAL_FIRST_DERIVATIVES'
assert next(r['sha256'] for r in rows if r['path']==(D/'first-derivative-grades.json').as_posix())=='5e5a5a4585aad76fbba3a5c0d2b290fb00d208ce058c5308094a805c5e6dec23'
for p in ('first-derivative-replay-1.json','first-derivative-replay-2.json'):
 assert next(r['sha256'] for r in rows if r['path']==(D/p).as_posix())=='5e5a5a4585aad76fbba3a5c0d2b290fb00d208ce058c5308094a805c5e6dec23'
assert json.loads((D/'double-replay.json').read_bytes())['status']=='PASS_TWO_BYTE_IDENTICAL_ARITHMETIC_REPLAYS'
out={'status':'PASS_FROZEN_PROTECTED_MEAN_DERIVATIVE_EVIDENCE_HASHES','files':rows,'scope':'Integrity only; conditional source analytic premises remain independent.','release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8',newline='\n');print('PASS',len(rows),'files, frozen receipt unchanged')
