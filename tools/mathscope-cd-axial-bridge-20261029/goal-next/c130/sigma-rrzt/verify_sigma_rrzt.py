#!/usr/bin/env python3
"""Pinned original Sigma_RRZT recurrence and current input coverage."""
import argparse,hashlib,json,runpy
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--goal',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();W=a.work
pins={
 'trace':('continuation125/sigma-rzt-zzt/verify_sigma_rzt_zzt.py','12966c42c9ffba95b8696f48be5b7718b8bd56d3f33be1a8507882e0726fb8ec'),
 'dep125':('continuation125/sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json','569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b'),
 'dep128':('continuation127/late-wrz-sigma-dependencies/late-wrz-sigma-dependencies.json','79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36'),
 'dep127':('continuation127/sigma-rrt/replay.json','e77795e860888dc33f12dc1f0b506fda4030d4fe7df038cb897d79b706782e9d'),
 'highCov':('continuation128/pressure-presigned/pressure-covariance.json','51e3a1190c574723990a28ad9af2f477d01bf2e1a6789122243f612115497a85'),
 'rrtCov':('continuation127/late-swirl-covariance/pre-signed-late-swirl.json','0efb18ed928286bb7a21683dffcc6a6979f5e6008de19f78c52ecf19bca7efe9'),
 'compact128':('continuation128/compact-pressure-coverage/coverage.json','3ac0131ed8c4082dd3be8b25797c818114b3c8a0cd81837927ae52066529aeb6'),
 'compact127':('continuation127/sigma-rrt/compact.json','1c1931cede39f551a30bee51755fe1128395a13c90d24e98d2d0bbe14494c7b6'),
 'local127':('continuation127/sigma-rrt/local.json','9dd137d3efbed682416ffcb4bec0afb90215a7bcc4955b60f13b1973aad8ee9d'),
 'local128':('continuation127/signed-local-high-time/signed-local-high-time.json','78bd955033b7c2342d4e0ea255ea078b79c5c9077dee0cdea71ba3cb2112c037'),
 'sigma128':('continuation128/sigma-high-time/sigma-high-time.json','c09bf88e3ad65ecf9b5f21e25fe229469cd3e491bacb2dd0ee5ead4627d6ef00')}
D={}
for k,(path,sha) in pins.items():
 pp=W/path;raw=pp.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,k
 D[k]=runpy.run_path(str(pp)) if pp.suffix=='.py' else json.loads(raw)
module=D['trace'];orig=module['pinned'](a.goal);ops=orig['arithmetic'];regions=module['REGIONS']
import inspect
tracesrc=inspect.getsource(module['trace']);assert tracesrc.count('range(7)')==1
tracesrc=tracesrc.replace('range(7)','range(9)',1);env=module['trace'].__globals__;ns={};exec(compile(tracesrc,'c130_original_trace','exec'),env,ns);trace=ns['trace']
assert D['dep128']['roots']==D['dep125']['roots']==[22001223,22001224,22000443]
assert D['dep128']['fixedEndpoints']==D['dep125']['fixedEndpoints']==[17743711,17743713]
target=(2,1,1);now={str(target):{r:trace(ops,target,r) for r in regions}}
prior_targets={*map(tuple,orig['oldDemand']['exactSigmaRequests']),*module['TARGETS'],*map(tuple,D['dep128']['targetRZT']),(2,0,1)}
prior={str(j):{r:trace(ops,j,r) for r in regions} for j in sorted(prior_targets)}
def roles(data,f):
 if f in ('localStress','cutoffAndDensity','pressureAndSignedPrimitives'):return {tuple(x) if f=='localStress' else (x[0],tuple(x[1])) for rr in data.values() for row in rr.values() for x in row[f]}
 return {(name,tuple(j)) for rr in data.values() for row in rr.values() for name,j in row[f]}
fields=('covariance','compactMean','localStress','background','cutoffAndDensity','pressureAndSignedPrimitives')
new={f:roles(now,f)-roles(prior,f) for f in fields}
cov=roles(now,'covariance')
available={tuple(x['RZTL'][:3]) for k in ('highCov','rrtCov') for x in D[k]['covarianceRows'] if x['allSixComponents'] and x['RZTL'][3]==0}
missingcov={(f,j) for f,j in cov if j not in available}
mean=roles(now,'compactMean');existingRequests={(f,tuple(j[:3])) for f,j in D['highCov']['meanAndCompactDependencies']['requested'] if j[3]==0}
missingmean=mean-existingRequests
local=roles(now,'localStress');localnew=local-roles(prior,'localStress')
result={'schema':'MathScope.C130.SigmaRRZTSourceDependency/1','status':'SOURCE_PINNED_RECURRENCE_BOUNDS_OPEN','target':target,
 'roots':D['dep128']['roots'],'fixedEndpoints':D['dep128']['fixedEndpoints'],'sourceTraces':now[str(target)],
 'allRoles':{f:sorted(roles(now,f)) for f in fields},'newRolesBeyondC125C127C128':{f:sorted(x) for f,x in new.items()},
 'covarianceNotCoveredByC127C128AllSixRows':sorted(missingcov),'compactNotInC128HighPressureRoster':sorted(missingmean),'newLocalStressDirections':sorted(localnew),
 'scope':'Original native Signed flux/pressure recurrence in three regions. Coverage compares typed requests against pinned conditional receipts; not yet a new numerical Sigma bound.','pins':pins,'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(result,indent=2)+'\n').encode());print('PASS RRZT',[(f,len(v)) for f,v in new.items()],'uncovered W-',len(missingcov),'compact',len(missingmean),'local',sorted(localnew))
