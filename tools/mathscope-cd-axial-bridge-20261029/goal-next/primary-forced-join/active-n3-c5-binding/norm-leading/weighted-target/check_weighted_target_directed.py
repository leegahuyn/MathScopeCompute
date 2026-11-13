#!/usr/bin/env python3
"""Read directed N_m intervals and derive a compact explicit dyadic ceiling."""
import argparse,hashlib,json
from fractions import Fraction
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--input',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
raw=a.input.read_bytes();d=json.loads(raw)
assert d['status']=='DIRECTED_CONDITIONAL_N0_TO_N6' and d['leaves']=={'target':168,'slow-chart':1148,'archived-integral':3}
assert not d['fullKEnclosed'] and not d['arithmetic']['binary64UsedForNumericalDecisions']
roots=[17759538,17759550,17759597,17759730,17760036,17760648,17761755]
rows=[]
for j,(r,root) in enumerate(zip(d['rows'],roots,strict=True)):
 assert r['order']==j and r['root']==root and r['enclosure']['lower']=={'rational':'1'}
 v=r['enclosure']['upper'];depth=0
 while list(v)==['exp']:v=v['exp'];depth+=1
 assert list(v)==['rational'] and depth==5
 q=Fraction(v['rational']);assert 0<q<2**21 and q.denominator==2**96
 rows.append({'order':j,'root':root,'lower':'1','upperExpDepth':depth,'upperArgument':str(q),'strictDyadicUpper':'T15'})
assert 2**21<2**65536
out={'status':'PASS_CONDITIONAL_DIRECTED_N0_TO_N6_READBACK','rows':rows,'commonStrictUpper':'T15',
 'towerDefinition':'T1=2; T(j+1)=2^Tj',
 'proof':'T5=2^65536>2^21; exp(Tj)<T(j+2) for Tj>=2; apply five times.',
 'arithmeticOperations':d['arithmetic']['operations'],'inputSHA256':hashlib.sha256(raw).hexdigest(),
 'scope':'Readback of conditional directed arithmetic, not independent re-evaluation, not a bound of complete K.', 'release':'HOLD'}
a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS: 1 <= each original N0..N6 < T15, conditional on source bounds')
