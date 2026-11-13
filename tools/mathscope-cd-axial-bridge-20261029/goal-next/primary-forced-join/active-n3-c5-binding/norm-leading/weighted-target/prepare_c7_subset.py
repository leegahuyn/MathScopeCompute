#!/usr/bin/env python3
"""Pin the 168 original C7 FTC rows that are candidates for same-source C6 binding."""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--target',type=Path,default=Path('work/goal-next/whole-k-annular-wrz-norm/target-c7.json'));p.add_argument('--numerical',type=Path,default=Path('work/goal-next/annular-numeric-25'));p.add_argument('--out',type=Path);a=p.parse_args()
pins={a.target:'3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770',
 a.numerical/'target-inner-numerical.json':'724daf0118dd8dc9b2d4af0597411bdee0995c99e68a25950a80749517737e4d',
 a.numerical/'target-middle-numerical.json':'07cbe3e4cda7f95d289fffea64472a5fac45387f72a4414603fec663613458e9',
 a.numerical/'target-outer-numerical.json':'9b1eeaf1bd241da773c67848a2eeca2882fc4ab5434d54184556a5f125003e15',
 a.numerical/'target-ftc-transport.json':'d316f03da261a99c717cc6afbd721ea3b44197bdf53949205c63726bfe9a2241'}
for f,h in pins.items():assert hashlib.sha256(f.read_bytes()).hexdigest()==h,f
target=json.loads(a.target.read_bytes());transport=json.loads((a.numerical/'target-ftc-transport.json').read_bytes())
gsha='8ecdc6d5ba6faae0114249a5041eee1d8af1268e1ec98cc4f526a8b615bb70e5'
assert target['graph']['uncompressedSHA256']==transport['originalGraphSHA256']==gsha
assert (transport['checkedFTCRoots'],transport['checkedFaces'])==(216,864)
rows=[]
for kind in ('inner','middle','outer'):
 numerical=json.loads((a.numerical/('target-'+kind+'-numerical.json')).read_bytes())
 assert numerical['originalGraphSHA256']==gsha and len(numerical['rows'])==72
 assert numerical['status']=='VERIFIED_ORIGINAL_72_'+kind.upper()+'_TARGET_FTC_NUMERICAL_UPPER_ENDPOINTS'
 by={r['root']:r for r in numerical['rows']}; assert len(by)==72
 reg=target['regions'][kind];assert len(reg['rows'])==72
 for c in reg['rows']:
  r,e=c['orders'];assert len(c['faces'])==4
  if r+e>6:continue
  num=by[c['root']];assert num['orders']==c['orders'] and num['component']==c['component']
  assert num['interval']['lower']=={'rational':'0'}
  rows.append({'kind':kind,'component':c['component'],'radialOrder':r,'etaOrder':e,
    'originalC7Body':reg['bodies'][c['component']],'originalC7System':reg['systems'][c['component']],
    'originalC7Derivative':c['native'],'originalC7Root':c['root'],'originalC7Faces':c['faces'],'directedInterval':num['interval']})
assert len(rows)==168 and all(sum(x['kind']==k for x in rows)==56 for k in ('inner','middle','outer'))
out={'status':'VERIFIED_PRIOR_C7_168_CANDIDATE_ROWS_NOT_LIVE_BOUND','sourceGraphSHA256':gsha,
 'sourceParameterSHA256':target['sourceParameterSHA256'],'count':len(rows),'regions':{k:56 for k in ('inner','middle','outer')},
 'requires':'Compare each live C6 actual derivative, full four anchored FTC faces, formal/actual arguments, endpoints and retained function body alpha-equivalently. Candidate C7 roots alone do not prove live equality.',
 'rows':rows,'pins':{f.name:h for f,h in pins.items()},'release':'HOLD'}
txt=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(txt,encoding='utf8',newline='\n')
print(json.dumps({'status':out['status'],'count':len(rows),'regions':out['regions']}))
