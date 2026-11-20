#!/usr/bin/env python3
"""Pinned original Signed Sigma_RRT dependency census; no numerical cap."""
import argparse,hashlib,json,runpy
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--goal',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
pins={
 'c125':('continuation125/sigma-rzt-zzt/verify_sigma_rzt_zzt.py','12966c42c9ffba95b8696f48be5b7718b8bd56d3f33be1a8507882e0726fb8ec'),
 'demand':('continuation125/sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json','569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b'),
 'forced':('continuation125/forced-mixed-rzt-z4t/forced-rzt-z4t.json','8844998bb26a96ccb276e107fa04e8b108229e7d0a71077d60f867bd8e63695f'),
 'mean':('continuation125/sigma-extra-mean/replay1.json','b880bac8b64973a0bb7076d0b04105f7bcb84671585aa810701c96f5a271865e'),
 'local':('continuation125/signed-local-rzt-zzt/signed-local-rzt-zzt.json','31834de8587e52da76dbe98dc4c97065846097f9a1fd5b39a4d13f568252833c'),
 'join':('continuation125/sigma-mixed-join/sigma-mixed-join.json','ec610109784540efae884f7ddcb5a5c8da354cbd9e94c0c7aee8dd2790b65f0a')}
D={}
for k,(rel,digest) in pins.items():
 path=a.work/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,k
 D[k]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
mod=D['c125'];prior=mod['pinned'](a.goal);ops=prior['arithmetic'];native=D['demand']
assert native['roots']==[22001223,22001224,22000443] and native['fixedEndpoints']==[17743711,17743713]
regions={r:mod['trace'](ops,(2,0,1),r) for r in mod['REGIONS']}
assert set(regions)=={'inner','middle','outer'}
old={str(x):{r:mod['trace'](ops,x,r) for r in mod['REGIONS']} for x in tuple(map(tuple,prior['oldDemand']['exactSigmaRequests']))+mod['TARGETS']}
current={'(2, 0, 1)':regions}
def collect(group,field):
 if field in ('localStress','background'):return {tuple(x) for rr in group.values() for data in rr.values() for x in data[field]}
 return {(f,tuple(x)) for rr in group.values() for data in rr.values() for f,x in data[field]}
fields=('covariance','compactMean','localStress','background')
delta={f:collect(current,f)-collect(old,f) for f in fields}
covered={tuple(r['RZTL'][:3]) for r in prior['oldCovariance']['covarianceRows'] if r['allSixComponents']}
covered|={tuple(r['RZTL'][:3]) for r in D['forced']['covarianceRows'] if r['allSixComponents']}
cov=collect(current,'covariance');missing={(f,j) for f,j in cov if j not in covered}
local_covered={tuple(row['direction']) for row in D['local']['conditionalRows']}
local_missing=collect(current,'localStress')-local_covered
mean_roles=collect(current,'compactMean');newtt={(f,j) for f,j in mean_roles if j[2]>=2}-collect(old,'compactMean')
result={'schema':'MathScope.C127.SigmaRRTSourceDependency/1','status':'ORIGINAL_RECURRENCE_CENSUS_INPUT_BOUNDS_OPEN','roots':native['roots'],'fixedEndpoints':native['fixedEndpoints'],'target':[2,0,1],
 'sourceTraces':regions,'allRoles':{f:sorted(collect(current,f)) for f in fields},'rolesNewBeyondC119AndC125':{f:sorted(v) for f,v in delta.items()},
 'covarianceNotCoveredByC119C125AllSixRows':sorted(missing),'localStressNotCoveredByC125':sorted(local_missing),'newSecondTimeMeanRoles':sorted(newtt),
 'scope':'Source recurrence dependency census only. Previous numerical/regularity estimates remain conditional on their original source and chart premises; missing rows are not bounded. No gate or release status changes.','inputPins':pins,'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(result,indent=2)+'\n').encode());print('PASS RRT',[(k,len(v)) for k,v in delta.items()],'cov missing',len(missing),'local missing',len(local_missing),'new TT',sorted(newtt))
