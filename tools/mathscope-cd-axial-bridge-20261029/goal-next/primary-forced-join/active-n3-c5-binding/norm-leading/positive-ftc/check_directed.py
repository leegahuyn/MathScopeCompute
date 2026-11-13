#!/usr/bin/env python3
"""Read back directed endpoint representation and derive explicit dyadic towers."""
import argparse,hashlib,json
from fractions import Fraction
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--directed',type=Path,default=Path('work/goal-next/continuation37/positive-ftc/positive-c10-rectangle-directed.json'));p.add_argument('--binding',type=Path,default=Path('work/goal-next/continuation37/positive-ftc/positive-rectangle-binding.json'));p.add_argument('--out',type=Path);a=p.parse_args()
pins={a.directed:'4ff9213619c1e127662565a3798b6c647e366993988237e60c6ca6ec335c5efa',a.binding:'08fc47cf44b0b35fb00fa0fe58ceed9814aa4dd579fbacdd6641182793ae4a85'}
for f,h in pins.items():assert hashlib.sha256(f.read_bytes()).hexdigest()==h,f
d=json.loads(a.directed.read_bytes());b=json.loads(a.binding.read_bytes())
assert d['status']=='DIRECTED_SIX_POSITIVE_PROFILE_FTC_UPPERS' and b['status']=='PASS' and b['totalFTCrows']==270 and b['totalFTCfaces']==1080
assert d['sourceProfile']==b['sourceProfile'] and d['sourcePacketSHA256']=='7e1fdbc5e4e6aa43da32c2ba98cd7b29ed178fbea0eb3160c767941f586b3fed'
assert d['oldBoundaryIDs']==[239,257,275] and not d['arithmetic']['binary64UsedForNumericalDecisions']
rows=[]
for row in b['rows']:
 name='n%d_%s'%(row['order'],row['field']); assert d['roots'][name]==row['sourceC10UpperRoot']
 interval=d['endpoints'][name];assert interval['lower']=={'rational':'0'}
 v=interval['upper'];depth=0
 while isinstance(v,dict) and list(v)==['exp']:depth+=1;v=v['exp']
 assert set(v)=={'rational'};c=Fraction(v['rational']);assert 0<c<2**21 and c.denominator==2**96
 assert depth in (5,6);rows.append({'source':name,'sourceRoot':row['sameActualSourceRoot'],'faceRows':45,'upper':'exp^%d(%s)'%(depth,c),'dyadicTowerIndex':5+2*depth})
# T1=2,T2=4,T3=16,T4=65536,T5=2^65536>2^21;
# exp(Tj)<2^(2*Tj)<=2^(2^Tj)=T_(j+2) for integer Tj>=2.
assert 2**21<2**65536
out={'status':'PASS','rows':rows,'maxCommonDyadicTowerIndex':max(r['dyadicTowerIndex'] for r in rows),'towerDefinition':'T1=2; T_(j+1)=2^Tj',
 'operations':d['arithmetic']['operations'],'scope':'Directed enclosure readback and exact tower comparisons; not an independent reevaluation of the full arithmetic DAG or live-family attachment.',
 'pins':{f.name:h for f,h in pins.items()},'release':'HOLD'}
txt=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(txt,encoding='utf8',newline='\n')
print(txt,end='')
