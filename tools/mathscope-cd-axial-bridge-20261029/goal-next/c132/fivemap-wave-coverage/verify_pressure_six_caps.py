#!/usr/bin/env python3
"""Replay actual post-Signed W+ rr/thetatheta/zz Z3T, with L^0 and L^2."""
import argparse,hashlib,json,runpy
from pathlib import Path
p=argparse.ArgumentParser()
for k in ('work','goal','out'):p.add_argument('--'+k,type=Path,required=True)
a=p.parse_args();W=a.work
pins={
 'base':('continuation129/temporal-postsigned-covariance/verify_temporal_postsigned_covariance.py','f5e9c04c043ff9cde04c45245f6278a147951a67471026e1155c4d80395c0c7e'),
 'merge':('continuation130/postsigned-covariance-final/verify_temporal_postsigned_covariance_complete.py','5e4d8d21f827eb8646b8fc2c0ac221c0766924cc3dff97973cf9f0a1f9cc0d05'),
 'classification':('continuation132/fivemap-wave-coverage/six-classification.json','25cb8a426201234083bd29e5bf6d9c2a4de70f14eab4fa5b5151f685f18eb78d'),
 'five':('continuation131/fivemap-velocity-time/fivemap-velocity-time.json','f91e6c15292c6970a95de7141d109e18ee5c0b57056e4a635faa6f23c9adddf7'),
 'pre':('continuation131/fivemap-presigned-high/fivemap-presigned-high.json','6e1ad88c52194da61728f1985e2c0502b0008d62b4cc17543fa99089f8a2c663'),
 'preExtra':('continuation129/temporal-presigned-extra/full-covariance-first.json','797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac'),
 'supplement':('continuation129/temporal-presigned-extra/temporal-presigned-supplement.json','de68d445e83834814bbc45351979d3839243d746bb4edd546cb624ecdb3d43e0'),
 'l9':('continuation129/temporal-presigned-extra/original-primary-l9.json','12d869922e481f5468455a11b200d8d5faf75429be7fd0fc5381e262eb9f82eb'),
 'matrix9':('continuation131/fivemap-presigned-high/matrix-order9.json','234adcb53fc323ddbce451e2948348f9c3260d1f50cd51c6da7bcb782e0a194d')}
D={}
for k,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,k
 D[k]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
assert D['supplement']['pins']['full']==pins['preExtra'][1] and D['supplement']['pins']['protectedPrimaryL9']==pins['l9'][1]
assert len(D['l9']['sourceRows'])==6
assert D['pre']['pins']['sealedScheduleSources']['originalMatrixOrder9']==pins['matrix9'][1]
assert D['matrix9']['allRZTMatrixAuditCount']==816 and D['matrix9']['oldC89ExactPrefixRows']==9 and D['matrix9']['maximumSuppliedOrder']==9
b=D['base'];complete=D['merge'];d=b['load'](a);native=d['base'];d['native']=native['load'](a.work,a.goal)
source=native['bound_sources'](d['native']);old,higher=b['late_sigma'](native,d)
combined,_,_=b['merge_wave_tables'](d);combined,_=complete['merge'](combined,D['preExtra'],b['REGIONS']);combined,gauges=complete['merge'](combined,D['pre'],b['REGIONS'])
d['native']['pre']=combined;d['adapt']=d['ordinaryAdapter']['adapt']
targets={(f,(0,3,1,l)) for f in ('rr','thetatheta','zz') for l in (0,2)}
assert targets<={(f,tuple(j)) for f,j in D['five']['sourceRequestCensus']['Wplus']}
assert {(r['component'],tuple(r['RZTL'])) for r in D['classification']['rows']}==targets
assert not D['classification']['allUnknownSigma'] and not D['classification']['allUnknownPreGauge']
for f,j in targets:
 needs=b['curl_needs'](f,j);assert needs<=gauges,(f,j,needs-gauges)
 assert {q[:3] for q in needs}<=(old.keys()|higher.keys())
paired=complete['pair_adapter'](b)(a,d,native,targets,higher)
assert paired.keys()==targets
out={'schema':'MathScope.C132.PostSignedPressureSix/1','status':'CONDITIONAL_SIX_ORIGINAL_POSTSIGNED_COVARIANCE_ROWS',
 'source':source,'targets':[{'tensor':f,'RZTL':j,'wholePathEpsilonGrade':'99999/100000','conditionalPairBudget':paired[f,j]} for f,j in sorted(targets)],
 'scope':'Actual original fixed-label Primary, Forced and Signed paired curls under admitted frame, chart, smooth support and Fourier assumptions. Narrow beta_ZT input only; other FiveMap and full gate obligations remain separate.',
 'pins':pins,'release':'HOLD','finalJets':0}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS original six post-Signed pressure-covariance rows')
