#!/usr/bin/env python3
"""Bind newly generated C10 F/U upper roots to exact prior C8 source rows."""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--packet',type=Path,default=Path('work/goal-next/continuation37/positive-ftc/positive-c10-rectangle.json'));p.add_argument('--sparse',type=Path,default=Path('work/goal-next/whole-k-annular-wrz-norm/background-c8.json'));p.add_argument('--out',type=Path);a=p.parse_args()
pins={a.packet:'7e1fdbc5e4e6aa43da32c2ba98cd7b29ed178fbea0eb3160c767941f586b3fed',a.sparse:'5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e'}
for f,h in pins.items():assert hashlib.sha256(f.read_bytes()).hexdigest()==h,f
c=json.loads(a.packet.read_bytes());s=json.loads(a.sparse.read_bytes());assert c['sourceProfile']==s['sourceParameterSHA256']
assert c['originalDefinitions']['K']=={'power':[{'ref':'Pstar'},2]}
assert c['sourcePrefixSHA256']=='ae216216f5076bd6d8c4d5a61f34af1979141af5f13b591c6de371bc0a672d9e'
assert [x['id'] for x in c['trace']['nonArithmeticBoundaries']]==[239,257,275]
rows=[]
for row in c['rows']:
    hits=[g for g in s['groups'] if (g['order'],g['field'])==(row['order'],row['field'])];assert len(hits)==1
    g=hits[0];assert g['sourceRoot']==row['actualSourceRoot'] and row['jetCount']==66
    assert len(g['rows'])==45 and {tuple(x['orders']) for x in g['rows']}=={(r,e) for r in range(9) for e in range(9-r)}
    assert all(len(x['faces'])==4 for x in g['rows'])
    for item in g['rows']:
        r,e=item['orders'];assert r+1+e+1<=10
    rows.append({'order':row['order'],'field':row['field'],'sameActualSourceRoot':row['actualSourceRoot'],'sourceC10UpperRoot':row['upper'],'c8FTCrows':45,'c8FTCfaces':180})
assert len(rows)==6
out={'status':'PASS','rows':rows,'totalFTCrows':270,'totalFTCfaces':1080,'sourceProfile':c['sourceProfile'],
 'scope':'Exact roots match archived sparse original source registry and C10 upper operands; does not bind a new private live instance or discharge analytic norm premises.',
 'pins':{f.name:h for f,h in pins.items()},'release':'HOLD'}
text=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(text,encoding='utf8',newline='\n')
print(text,end='')
