#!/usr/bin/env python3
"""Replay the protected-source arithmetic twice with explicit input paths."""
import argparse,hashlib,json,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
for flag in ('goal','protected','prior','reference','operators','frozen','out-dir'):p.add_argument('--'+flag,type=Path,required=True)
a=p.parse_args();D=a.out_dir;D.mkdir(parents=True,exist_ok=True);script=Path(__file__).with_name('verify_mean_first_derivatives.py')
expected='5e5a5a4585aad76fbba3a5c0d2b290fb00d208ce058c5308094a805c5e6dec23';assert hashlib.sha256(a.frozen.read_bytes()).hexdigest()==expected
results=[]
for i in (1,2):
 dest=D/f'first-derivative-replay-{i}.json'
 subprocess.run([sys.executable,str(script),'--goal',str(a.goal),'--protected',str(a.protected),'--prior',str(a.prior),'--reference',str(a.reference),'--operators',str(a.operators),'--out',str(dest)],check=True)
 assert hashlib.sha256(dest.read_bytes()).hexdigest()==expected
 results.append({'name':dest.name,'sha256':expected})
assert hashlib.sha256(a.frozen.read_bytes()).hexdigest()==expected
out={'status':'PASS_TWO_BYTE_IDENTICAL_ARITHMETIC_REPLAYS','frozenSHA256':expected,'replays':results,
 'scope':'Exact independent reruns of the conditional source arithmetic ledger; the original source analytic premises and physical-domain conditions remain separate.','release':'HOLD'}
(D/'double-replay.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8',newline='\n');print('PASS two byte-identical reruns; frozen receipt unchanged')
