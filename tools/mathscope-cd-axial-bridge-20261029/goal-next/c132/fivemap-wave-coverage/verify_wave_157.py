#!/usr/bin/env python3
"""Source-bound coverage audit for 157 original FiveMap W+ roles."""
import argparse,hashlib,json,runpy
from collections import Counter
from pathlib import Path
p=argparse.ArgumentParser()
for x in ('work','goal','out'):p.add_argument('--'+x,type=Path,required=True)
a=p.parse_args();W=a.work
pins={
 'base':('continuation129/temporal-postsigned-covariance/verify_temporal_postsigned_covariance.py','f5e9c04c043ff9cde04c45245f6278a147951a67471026e1155c4d80395c0c7e'),
 'five':('continuation131/fivemap-velocity-time/fivemap-velocity-time.json','f91e6c15292c6970a95de7141d109e18ee5c0b57056e4a635faa6f23c9adddf7'),
 'frontier':('continuation129/temporal-velocity-time/frontier.json','d1ee3fa60dc761433c04659ccc73cce9292dc9955560b42f7d424831502b1332'),
 'complete94':('continuation130/postsigned-covariance-final/complete-94.json','bca0ba42238e2d50913eb6d540fa4d31d3ad4cfe44c17881bc7d8c1484d555ff'),
 'six':('continuation132/fivemap-wave-coverage/six-caps.json','e012bfd8ba80a42408adb4f1b882147d12adfddb0b4b437e3c613436ae8fb6a6'),
 'pre130':('continuation129/temporal-presigned-extra/full-covariance-first.json','797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac'),
 'pre131':('continuation131/fivemap-presigned-high/fivemap-presigned-high.json','6e1ad88c52194da61728f1985e2c0502b0008d62b4cc17543fa99089f8a2c663'),
 'sigma130':('continuation130/sigma-rrzt/join.json','00d57efc37cceec1dcc907792d9da7db92278ed77298c6b52bef008c402e2cc3'),
 'sigma131':('continuation131/high-sigma-join/join.json','0018ec189d12d57e0d621b8e4dc4da9c67b2bfad3a57e9e09b9b28e969042297'),
 'post131':('continuation131/fivemap-postsigned-z4t/fivemap-postsigned-z4t.json','8176592c2b8ef55c5901e5d368fc5bbc00a7997c4e2f81dd2f087acdebf135c6')}
D={}
for k,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,k
 D[k]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
b=D['base'];d=b['load'](a);native=d['base'];d['native']=native['load'](W,a.goal);old,sigma=b['late_sigma'](native,d)
known_sigma=set(old)|set(sigma)
for item in (D['sigma130'],D['sigma131']):
 assert item['nativeSigmaRoots']==[22001223,22001224] and item['actualIncrementalPressureZ']==22000443 and item['sourceEndpoints']==[17743711,17743713]
 known_sigma|={tuple(j) for j in item['targetsRZT']}
prev,basegauges,_=b['merge_wave_tables'](d)
pre=set(basegauges)|{tuple(j) for k in ('pre130','pre131') for j in D[k]['targetGaugeDirections']}
one={(r,z,0,l) for r,z,l in d['preStaticOne']['directions']}
two={(r,z,0,l) for r,z,l in (x['RZL'] for x in d['preStaticTwo']['conditionalGaugeRows'])}
pre|=one&two
ask={(f,tuple(j)) for f,j in D['five']['sourceRequestCensus']['Wplus']};assert len(ask)==157
front={(f,tuple(j)) for f,j in D['frontier']['combinedPostSignedCovariance']}
assert len(front)==94 and D['complete94']['completeCount']==94 and not D['complete94']['stillOpen']
spatial={(f,tuple(j)) for f,j in d['spatial']['premise']['componentDirections']}
swirl={(f,tuple(j)) for f,j in d['postSwirl']['requiredCovariance']}
six={(r['tensor'],tuple(r['RZTL'])) for r in D['six']['targets']};assert len(six)==6
post=D['post131'];assert post['tensor']=='W^+_rz' and post['RZTL']==[0,4,1,0]
known=front|spatial|swirl|six|{('rz',(0,4,1,0))}
missing=ask-known
rows=[]
for f,j in sorted(missing):
 needs=b['curl_needs'](f,j)
 rows.append({'tensor':f,'RZTL':j,'unknownSigma':sorted({q[:3] for q in needs}-known_sigma),
              'unknownPreGauge':sorted(needs-pre)})
ready=[(r['tensor'],r['RZTL']) for r in rows if not r['unknownSigma'] and not r['unknownPreGauge']]
out={'schema':'MathScope.C132.OriginalFiveMap157WaveCoverage/1','status':'SOURCE_PINNED_COVERAGE_AUDIT_NOT_FULL_NORM',
 'requestedCount':len(ask),'coveredCount':len(ask&known),'remainingCount':len(missing),
 'remainingByComponent':dict(sorted(Counter(r['tensor'] for r in rows).items())),
 'remainingBySlowTime':dict(sorted(Counter(str(r['RZTL'][2]) for r in rows).items())),
 'needsNoFurtherSigmaOrPreGauge':ready,'remaining':rows,
 'unknownSigmaDirections':sorted({tuple(j) for r in rows for j in r['unknownSigma']}),
 'unknownPreGaugeDirections':sorted({tuple(j) for r in rows for j in r['unknownPreGauge']}),
 'scope':'Coverage against only the explicitly pinned conditional source receipts, followed by a typed gauge census. Ready rows still require actual paired native curls/Haar arithmetic; unknown membership is not a proof that other evidence cannot cover them. The separate exact FiveMap FTC reduction may shrink this conservative roster.','pins':pins,'release':'HOLD'}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS 157 census covered',len(ask&known),'remaining',len(missing),'ready',len(ready),'sigma',len(out['unknownSigmaDirections']),'pre',len(out['unknownPreGaugeDirections']))
