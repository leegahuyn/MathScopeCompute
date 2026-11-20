#!/usr/bin/env python3
"""C131 source census for native Signed Z⁵T and RZ⁴T."""
import argparse,hashlib,inspect,json,runpy
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--goal',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();W=a.work
pins={
 'trace':('continuation125/sigma-rzt-zzt/verify_sigma_rzt_zzt.py','12966c42c9ffba95b8696f48be5b7718b8bd56d3f33be1a8507882e0726fb8ec'),
 'prior':('continuation125/sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json','569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b'),
 'higher':('continuation127/late-wrz-sigma-dependencies/late-wrz-sigma-dependencies.json','79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36'),
 'rrzt':('continuation130/sigma-rrzt/join.json','00d57efc37cceec1dcc907792d9da7db92278ed77298c6b52bef008c402e2cc3'),
 'cov128':('continuation128/pressure-presigned/pressure-covariance.json','51e3a1190c574723990a28ad9af2f477d01bf2e1a6789122243f612115497a85'),
 'cov130':('continuation129/temporal-presigned-extra/full-covariance-first.json','797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac'),
 'compact130':('continuation130/sigma-rrzt/compact.json','239009250c59125914d8261bb5c83a6ab0b0f4c9c9fa8b6c7a7958a749e2040d'),
 'compact128':('continuation128/compact-pressure-coverage/coverage.json','3ac0131ed8c4082dd3be8b25797c818114b3c8a0cd81837927ae52066529aeb6'),
 'local130':('continuation130/sigma-rrzt/local.json','da2922e5a1b659d626ff9ddbb6823e691ced9fadff45325755096d3eef092380')}
D={}
for key,(rel,digest) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,key
 D[key]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
base=D['trace'];original=base['pinned'](a.goal);ops=original['arithmetic'];source=inspect.getsource(base['trace']);assert source.count('range(7)')==1
# Pure Z⁵T reaches compact source orders beyond the old readback bank;
# widening the placeholder bank does not insert a numerical estimate.
source=source.replace('range(7)','range(11)',1);scope={};exec(compile(source,'c131_original_trace','exec'),base['trace'].__globals__,scope);trace=scope['trace'];regions=base['REGIONS']
targets=((0,5,1),(1,4,1));prior_targets={*map(tuple,original['oldDemand']['exactSigmaRequests']),*base['TARGETS'],*map(tuple,D['higher']['targetRZT']),(2,0,1),(2,1,1)}
now={str(t):{r:trace(ops,t,r) for r in regions} for t in targets}
old={str(t):{r:trace(ops,t,r) for r in regions} for t in sorted(prior_targets)}
def roles(data,field):
 if field=='localStress':return {tuple(q) for regions in data.values() for row in regions.values() for q in row[field]}
 return {(f,tuple(j)) for regions in data.values() for row in regions.values() for f,j in row[field]}
fields=('covariance','compactMean','localStress','background','cutoffAndDensity','pressureAndSignedPrimitives')
new={f:roles(now,f)-roles(old,f) for f in fields}
avail={tuple(row['RZTL'][:3]) for k in ('cov128','cov130') for row in D[k]['covarianceRows'] if row['allSixComponents'] and row['RZTL'][3]==0}
missingW={(f,j) for f,j in roles(now,'covariance') if j not in avail}
spatial={(f,tuple(j)) for row in original['spatial']['regions'].values() for f,j in row['trace']['covariance']}
spatial_covered={(f,j) for f,j in missingW if j[2]==0 and (f,j) in spatial}
missingW-=spatial_covered
means={(f,tuple(j[:3])) for k in ('cov128','cov130') for f,j in D[k]['meanAndCompactDependencies']['requested'] if j[3]==0}
means|={(f,tuple(j[:3])) for f,j in D['compact130']['targets']}
missingM=roles(now,'compactMean')-means
localnew=roles(now,'localStress')-roles(old,'localStress')
assert D['higher']['roots']==D['prior']['roots']==[22001223,22001224,22000443]
assert D['higher']['fixedEndpoints']==D['prior']['fixedEndpoints']==[17743711,17743713]
out={'schema':'MathScope.C131.HigherSignedSigmaDependency/1','status':'PINNED_SOURCE_RECURRENCE_OPEN_INPUT_BOUNDS','targetsRZT':targets,
 'nativeSigmaRoots':[22001223,22001224],'actualIncrementalPressureZ':22000443,'sourceEndpoints':[17743711,17743713],
 'sourceTraces':now,'allRoles':{f:sorted(roles(now,f)) for f in fields},'newRolesBeyondC128C130':{f:sorted(v) for f,v in new.items()},
 'missingPreSignedCovariance':sorted(missingW),'existingSpatialCovarianceCoverage':sorted(spatial_covered),'compactNotInPinnedMeanRosters':sorted(missingM),'newLocalStressDirections':sorted(localnew),
 'scope':'Original three-region derivative demand only. Readback placeholders are not numerical bounds. This does not assume the separate late FiveMap reduction or close a complete gate.',
 'pins':pins,'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS targets',targets,'new',[(f,len(v)) for f,v in new.items()],'missing W-',len(missingW),'compact',len(missingM),'local',sorted(localnew))
