#!/usr/bin/env python3
"""Exact size/readback of previously certified C7 candidate intervals."""
import argparse,hashlib,json
from fractions import Fraction
from collections import Counter
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--input',type=Path,default=Path('work/goal-next/continuation38/target-bound/c7-candidate-168.json'));p.add_argument('--out',type=Path);a=p.parse_args()
raw=a.input.read_bytes();assert hashlib.sha256(raw).hexdigest()=='adb3eb331af0434058588f8f6db512633fc6a5e24f87b37a249e804df3f03ac2';d=json.loads(raw)
counts=Counter();maximum=Fraction(0)
for row in d['rows']:
 v=row['directedInterval']['upper'];depth=0
 while isinstance(v,dict) and list(v)==['exp']:depth+=1;v=v['exp']
 assert set(v)=={'rational'};c=Fraction(v['rational']);assert 0<c<2**21 and c.denominator==2**96
 counts[(row['kind'],depth)]+=1;maximum=max(maximum,c)
assert counts=={('inner',3):56,('middle',5):56,('outer',4):56}
assert 2**21<2**65536 and 5+2*5==15
out={'status':'PRIOR_C7_DIRECTED_168_CANDIDATES_READBACK','counts':{f'{k[0]}_exp{k[1]}':v for k,v in sorted(counts.items())},
 'commonCandidateDyadicUpper':'T15, T1=2 and T_(j+1)=2^Tj','maximumInnerDyadicArgument':str(maximum),
 'scope':'Previously proved C7 candidate rows only; live target FTC binding, native N6 arithmetic and full K remain open.',
 'inputSHA256':hashlib.sha256(raw).hexdigest(),'release':'HOLD'}
text=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(text,encoding='utf8',newline='\n')
print(text,end='')
