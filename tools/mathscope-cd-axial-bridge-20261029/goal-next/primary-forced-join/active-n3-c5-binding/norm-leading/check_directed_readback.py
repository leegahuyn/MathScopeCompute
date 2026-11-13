#!/usr/bin/env python3
"""Check directed endpoint encoding, exact dyadic tower logic, and sparse IDs."""
import argparse,hashlib,json
from fractions import Fraction
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--dir',type=Path,default=Path('work/goal-next/continuation36/norm-leaf'));p.add_argument('--sparse',type=Path,default=Path('work/goal-next/whole-k-annular-wrz-norm/background-c8.json'));p.add_argument('--out',type=Path);a=p.parse_args()
pins={a.dir/'u0-directed.json':'c1b8eef03b5cac90a9a9eabda2d9baa3f255c1bd860d382af1562a53847811af',
 a.dir/'f0-directed.json':'f94fa27286e02bc858777aba8302c68b7c71141790aba465f177e3ee8e407bcd',
 a.dir/'leading-f0-c99.json':'ba937ba0fa45592c3bb2e3049fddfadb57ba91a17a4fcc7264f5d1d18a20b5f6',
 a.sparse:'5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e'}
for path,h in pins.items():assert hashlib.sha256(path.read_bytes()).hexdigest()==h,path
sparse=json.loads(a.sparse.read_bytes()); result={}
for field,name,numerator in [('U','u0-directed.json',83152259474872902432540274525583463),('F','f0-directed.json',83152338703035416696877868069533799)]:
 d=json.loads((a.dir/name).read_bytes());group=[g for g in sparse['groups'] if g['order']==0 and g['field']==field];assert len(group)==1
 assert len(group[0]['rows'])==45 and all(len(r['faces'])==4 for r in group[0]['rows'])
 assert d['FTCInterval']['lower']=={'rational':'0'} and not d['arithmetic']['binary64UsedForNumericalDecisions']
 v=d['FTCInterval']['upper']
 for _ in range(5):assert list(v)==['exp'];v=v['exp']
 assert v=={'rational':str(numerator)+'/79228162514264337593543950336'}
 c=Fraction(v['rational']);assert 0<c<2**21 and c.denominator==2**96
 assert d['fixedDyadicTowerUpper']['index']==15 and not d['fixedDyadicTowerUpper']['fullIntegerNumericallyMaterialized']
 result[field]={'45_FTC_each_le_exp5_of':str(c),'each_le_dyadic_tower_index':15,'operations':d['arithmetic']['operations']}
# T1=2,T2=4,T3=16,T4=65536,T5=2^65536>2^21. For integer T>=2,
# 2T<=2^T follows by induction; five exp applications each cost two tower levels.
assert 2**21<2**65536 and 5+2*5==15
out={'status':'PASS','rows':result,'scope':'readback of directed arithmetic artifacts and exact monotone tower inequality; not a second evaluation of full arithmetic DAG',
 'pins':{x.name:h for x,h in pins.items()},'release':'HOLD'}
text=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(text,encoding='utf8',newline='\n')
print(text,end='')
