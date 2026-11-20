#!/usr/bin/env python3
"""Classify the original six Z3T pressure-covariance candidate inputs."""
import argparse,hashlib,json,runpy
from pathlib import Path
from types import SimpleNamespace
p=argparse.ArgumentParser()
for k in ('work','goal','out'):p.add_argument('--'+k,type=Path,required=True)
a=p.parse_args();W=a.work
pins={
 'base':('continuation129/temporal-postsigned-covariance/verify_temporal_postsigned_covariance.py','f5e9c04c043ff9cde04c45245f6278a147951a67471026e1155c4d80395c0c7e'),
 'pre':('continuation131/fivemap-presigned-high/fivemap-presigned-high.json','6e1ad88c52194da61728f1985e2c0502b0008d62b4cc17543fa99089f8a2c663'),
 'preExtra':('continuation129/temporal-presigned-extra/full-covariance-first.json','797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac'),
 'sigma':('continuation131/high-sigma-join/join.json','0018ec189d12d57e0d621b8e4dc4da9c67b2bfad3a57e9e09b9b28e969042297'),
 'five':('continuation131/fivemap-velocity-time/fivemap-velocity-time.json','f91e6c15292c6970a95de7141d109e18ee5c0b57056e4a635faa6f23c9adddf7')}
D={}
for k,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,k
 D[k]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
b=D['base'];inputs=b['load'](a);native=inputs['base'];inputs['native']=native['load'](a.work,a.goal)
old,prior=b['late_sigma'](native,inputs);cap=D['sigma']['common'];assert D['sigma']['targetsRZT']==[[0,5,1],[1,4,1]]
assert cap['epsilon']=='1' and cap['gaussian']=='zeta'
known=set(old)|set(prior)|{tuple(x) for x in D['sigma']['targetsRZT']}
_,previous,_=b['merge_wave_tables'](inputs)
pre=set(previous)|{tuple(x) for name in ('pre','preExtra') for x in D[name]['targetGaugeDirections']}
one={(r,z,0,l) for r,z,l in inputs['preStaticOne']['directions']}
two={(r,z,0,l) for r,z,l in (x['RZL'] for x in inputs['preStaticTwo']['conditionalGaugeRows'])}
six={(f,(0,3,1,l)) for f in ('rr','thetatheta','zz') for l in (0,2)}
rows=[]
for f,j in sorted(six):
 needed=b['curl_needs'](f,j)
 missingSigma={v[:3] for v in needed}-known
 missingGauge=needed-pre-(one&two)
 rows.append({'component':f,'RZTL':j,'gaugeCount':len(needed),'unknownSigma':sorted(missingSigma),'unknownPreGauge':sorted(missingGauge)})
out={'schema':'MathScope.C132.PressureSixCovarianceCoverage/1','status':'SOURCE_CLASSIFICATION_ONLY','rows':rows,
 'allUnknownSigma':sorted({tuple(x) for row in rows for x in row['unknownSigma']}),
 'allUnknownPreGauge':sorted({tuple(x) for row in rows for x in row['unknownPreGauge']}),
 'scope':'Gauge and Sigma input membership only. No newly computed W+ bound; original chart, frame, native curls and support remain necessary.','pins':pins,'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS six classification',[(r['component'],r['RZTL'][-1],len(r['unknownSigma']),len(r['unknownPreGauge'])) for r in rows])
