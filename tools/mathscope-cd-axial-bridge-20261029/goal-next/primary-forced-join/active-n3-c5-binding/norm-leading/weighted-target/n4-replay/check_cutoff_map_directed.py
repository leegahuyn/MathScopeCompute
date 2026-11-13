#!/usr/bin/env python3
"""Read a conditional original cutoff/map directed upper as an integer tower."""
import argparse,hashlib,json
from fractions import Fraction
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--input',type=Path,required=True);p.add_argument('--index',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
raw=a.input.read_bytes();d=json.loads(raw);index=json.loads(a.index.read_bytes())
assert d['status']=='DIRECTED_ORIGINAL_CUTOFF_MAP_MAXIMUM' and d['prefix']==index['prefix'] and d['root']==index['mapFTC']['maximum']
assert d['sourcePins']['index']==hashlib.sha256(a.index.read_bytes()).hexdigest()
assert d['fullKEnclosed'] is False and not d['arithmetic']['binary64UsedForNumericalDecisions']
v=d['enclosure']['upper'];depth=0
while list(v)==['exp']:v=v['exp'];depth+=1
assert list(v)==['rational'];q=Fraction(v['rational']);assert 0<q<2**21 and q.denominator==2**96
tower=5+2*depth
out={'status':'PASS_CONDITIONAL_ORIGINAL_MAP_UPPER','prefix':d['prefix'],'root':d['root'],'leafCount':len(d['leaves']),
 'expDepth':depth,'innerRational':str(q),'strictDyadicUpper':f'T{tower}','arithmeticOperations':d['arithmetic']['operations'],
 'proof':'T5=2^65536>2^21 and exp(Tj)<T(j+2) for Tj>=2.',
 'sourceSHA256':hashlib.sha256(raw).hexdigest(),'scope':'Directed readback only; conditional source bounds, no whole-K assertion.','release':'HOLD'}
a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS',out['root'],'<',out['strictDyadicUpper'])
