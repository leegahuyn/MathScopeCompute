#!/usr/bin/env python3
"""Attach pinned C127 source, Forced covariance, compact mean and stress."""
import argparse,hashlib,inspect,json,runpy
from fractions import Fraction as Q
from itertools import product
from pathlib import Path
from types import SimpleNamespace

p=argparse.ArgumentParser();
for flag in ('work','goal','runtime','out'):p.add_argument('--'+flag,type=Path,required=True)
a=p.parse_args();W=a.work;G=a.goal
pins={
 'census':(W/'continuation127/sigma-rrt/replay.json','e77795e860888dc33f12dc1f0b506fda4030d4fe7df038cb897d79b706782e9d'),
 'compact':(W/'continuation127/sigma-rrt/compact.json','1c1931cede39f551a30bee51755fe1128395a13c90d24e98d2d0bbe14494c7b6'),
 'local':(W/'continuation127/sigma-rrt/local.json','9dd137d3efbed682416ffcb4bec0afb90215a7bcc4955b60f13b1973aad8ee9d'),
 'pre':(W/'continuation127/late-swirl-covariance/pre-signed-late-swirl.json','0efb18ed928286bb7a21683dffcc6a6979f5e6008de19f78c52ecf19bca7efe9'),
 'preprogram':(W/'continuation127/late-swirl-covariance/verify_late_swirl_covariance.py','26e40a6201647e3d8005c57b9bee58720082f6c848a2bc441d6847e529ee0923'),
 'joinprogram':(W/'continuation125/sigma-mixed-join/verify_sigma_mixed_join.py','6e9f98be7a7890fc00e4f84b0296947bb2a285f3c4f94a7cd807b3eedd1d058d'),
 'localT':(G/'c117/signed-local-stress-time/signed-local-time-stress.json','3ec60e03a9ae128ed546bc67256692ed2241e76be3261b8618761264ebcb9dd5'),
 'localRT':(G/'c119/signed-local-mixed-time/signed-local-mixed-time.json','8a6d9bd9fa6c1717380c6255aa45736a67cf42df8b63996fe22b74e27c451804')}
D={}
for k,(path,digest) in pins.items():
 raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,k
 D[k]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
dep,compact,local,pre,preprog,j=D['census'],D['compact'],D['local'],D['pre'],D['preprogram'],D['joinprogram']
assert dep['target']==[2,0,1] and dep['roots']==[22001223,22001224,22000443] and dep['fixedEndpoints']==[17743711,17743713]
assert {(f,tuple(x[:3])) for f,x in compact['targets']}=={('gamma',(1,0,2)),('v',(1,0,2))}
assert local['originalResiduals']==[21999622,22000445] and [2,0,1] in local['conditionalCap']['directions']
# Recompute the exact full C127 pre-Signed receipt while capturing the
# underlying noncompact means; the output must agree byte-for-byte.
old,paths=preprog['load'](W,G)
asks={(f,tuple(x)) for f,x in old['demand']['temporalT']['postSignedCovariance']}
targets={b for _,alpha in asks for b in preprog['down'](alpha)}
targets.update(preprog['down']((2,0,1,0)))
targets.update(tuple(row['RZTL']) for row in old['prePrior']['covarianceRows'])
fn=preprog['adapt'](old['preProgram']['main'],[
 ("{ (0,z,t,l) for z,t,l in product(range(2),range(2),range(3)) }","extensions"),
 ('MathScope.C125.OriginalFirstCycleCovarianceForPostSignedThetaZZT/1','MathScope.C127.OriginalFirstCycleCovarianceForLateSwirlTime/1'),
 ('    a.out.write_bytes((json.dumps(ans,indent=2,ensure_ascii=False)+"\\n").encode())','    a.out.write_bytes((json.dumps(ans,indent=2,ensure_ascii=False)+"\\n").encode())\n    return cap["temporal"]')],extensions=targets)
capture=preprog['BytesOutput']();noncompact=fn(SimpleNamespace(work=W,goal=G,runtime=a.runtime,demand=paths['sigmaDemand'],out=capture))
assert hashlib.sha256(capture.raw).hexdigest()==pins['pre'][1]
ops=runpy.run_path(str(G/'c108/early-sigma-c6/verify_sigma_c6.py'))
assert hashlib.sha256((G/'c108/early-sigma-c6/verify_sigma_c6.py').read_bytes()).hexdigest()=='f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8'
roles={(f,tuple(x)) for f,x in dep['allRoles']['covariance']}
middle,branches,collars=j['target_mean_tables'](ops,noncompact,roles)
for row in compact['directTemporalRows']:
 key=(row['field'],tuple(row['RZTL']))
 assert key not in middle
 middle[key]=row['conditionalTemporal']
compact_inputs={}
for f,key in (('gamma','compactGammaRTT'),('v','compactVRTT')):
 row=compact[key];assert row['RZT']==[1,0,2] and row['epsilonPower']=='1' and row['bandPower']=='19/2'
 assert row['logChargeHOver2Pow128']==compact['compactProfile']['compactChargeInHOver2Pow128']==30468
 compact_inputs[f,(1,0,2)]=ops['Bound'](ops['E'],Q(19,2),0,30468)
scopes={}
for datum,alpha in ((D['localT'],(0,0,1)),(D['localRT'],(1,0,1)),(local,(2,0,1))):
 c=datum['conditionalCap'];assert c['epsilon']=='1' and c['gaussian']=='zeta'
 if 'directions' in c:assert list(alpha) in c['directions']
 for reg in ('inner','outer','middle'):
  key={'inner':'innerPole','outer':'outerPole','middle':'middlePole'}[reg]
  scopes[reg,alpha]=ops['Bound'](ops['E'],0,c[key],1)
arith=j['adapt'](ops['arithmetic'],[
 ('return Bound(2*E if f=="beta" else E,','if (f,a) in d["compactInputs"]:\n            return d["compactInputs"][f,a]\n        return Bound(2*E if f=="beta" else E,'),
 (')+3*sum(a),0,54920)',')+3*sum(a),0,d["generalCompactLogRank"])'),
 ('return Bound(E,0,pole,1)','return d["localInputs"][region,a]')])
capdata={'compactInputs':compact_inputs,'generalCompactLogRank':pre['compactMomentGeometryCharge']+2,'localInputs':scopes}
regions={};target=(2,0,1)
for reg in ('inner','outer','middle'):
 view={**pre,'covarianceRows':[r for r in pre['covarianceRows'] if r['RZTL'][3]==0]}
 wave=j['covariance_cap'](ops,view,reg)
 asks={'weightedSigmaSpatialOrders':[list(target)],'localWeightedRadialFlux':[list(i) for i in product(*(range(x+1) for x in target))]}
 vals,trace=arith(capdata,asks,middle,branches,collars,wave,reg)
 assert json.loads(json.dumps(trace))==dep['sourceTraces'][reg],reg
 regions[reg]={'bounds':vals,'sourceTrace':trace}
rows=[r for v in regions.values() for r in v['bounds']]
e=min(Q(r['epsilon']) for r in rows);s=max(Q(r['band']) for r in rows);pole=max(r['pole'] for r in rows);coeff=max(r['coefficientInHOver2Pow128'] for r in rows)
assert e>=1 and coeff<2**20
out={'schema':'MathScope.C127.OriginalSignedSigmaRRTBound/1','status':'CONDITIONAL_AUTHENTICATED_ORIGINAL_SIGMA_RRT','pins':{k:v[1] for k,v in pins.items()},'nativeSigmaRoots':dep['roots'][:2],'actualIncrementalPressureZ':dep['roots'][-1],'sourceEndpoints':dep['fixedEndpoints'],'targetsRZT':[target],'regions':regions,
 'common':{'epsilon':str(e),'band':str(s),'pole':pole,'logCoefficientUnitsHOver2Pow128':coeff,'gaussian':'zeta'},
 'scope':'Conditional on exact original chart, support, moving cutoff, covariance, Fourier and input mean premises in the pinned witnesses. Does not close any complete gate.','release':'HOLD','finalJets':0}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS Sigma RRT conditional',out['common'])
