#!/usr/bin/env python3
"""Read actual Repeat T capsule and trace its source TT Signed input crop."""
import argparse,gzip,hashlib,inspect,json,runpy
from itertools import islice,product
from pathlib import Path
p=argparse.ArgumentParser()
for name in ('work','goal','artifact','out'):p.add_argument('--'+name,type=Path,required=True)
a=p.parse_args();W=a.work;P=a.artifact
pins={
 'trace':('continuation125/sigma-rzt-zzt/verify_sigma_rzt_zzt.py','12966c42c9ffba95b8696f48be5b7718b8bd56d3f33be1a8507882e0726fb8ec'),
 'curl':('continuation119/signed-curl-mixed-t/signed-mixed-curl.json','2efe3573d8c7a9b41bb2ba6682307140a017436ada61291f6d131c24ff25cf2a'),
 'protected':('continuation126/late-wrz-mixed-frontier/late-wrz-mixed-frontier.json','5db77c948687ee351a42ce0ac027513d6986c04e9a14b40b3ae181cf7c652f19'),
 'radial':('continuation133/live-radial-trace/live-radial-trace.json','70d841c3686c7f3135592e04e170048cd5663cfaaf4e53ac5b12ba e84bb5c8ba'.replace(' ','')),
 'active':('continuation132/active-repeat-source/active-readback.json','49c39b69df109650688cb21e8331fe53ffc65da1e8f899d1fa97c61a67cce2c4'),
 'pre131':('continuation131/fivemap-presigned-high/fivemap-presigned-high.json','6e1ad88c52194da61728f1985e2c0502b0008d62b4cc17543fa99089f8a2c663'),
 'pre130':('continuation129/temporal-presigned-extra/full-covariance-first.json','797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac'),
 'mean116':('continuation116/mean-time-operands/mean-time-operands.json','3ec640563531208b18f019167174e7c39db1c744e937f834d313eeefafd86e14'),
 'compact127':('continuation127/sigma-rrt/compact.json','1c1931cede39f551a30bee51755fe1128395a13c90d24e98d2d0bbe14494c7b6'),
 'compact130':('continuation130/sigma-rrzt/compact.json','239009250c59125914d8261bb5c83a6ab0b0f4c9c9fa8b6c7a7958a749e2040d'),
 'sigma131':('continuation131/high-sigma-join/join.json','0018ec189d12d57e0d621b8e4dc4da9c67b2bfad3a57e9e09b9b28e969042297')}
D={}
for k,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,k
 D[k]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
assert D['radial']['coreTimeWitness']=={'activeCapsule':'coupled-expression:1363','actualTApplication':22161393,'epsilonNode':17732744,'exactCoefficient':'-epsilon','presentInRawAndSupported':True,'presentInSubtraction':False,'protectedNativeBody':22004387}
assert D['active']['stream']['sha256']=='7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2'
rr=(P/'active-n3-repeat-forced-source/original-source-functions.json').read_bytes();assert hashlib.sha256(rr).hexdigest()==D['active']['registrySHA256']
defs=json.loads(json.loads(rr)['definitions']);capsule=defs[0][1363]
assert capsule['id']=='coupled-expression:1363' and capsule['body']==22004387 and capsule['name']=='PostFiveRepeatWave_0:1_1_0_imaginary'
assert capsule['parameters'][3]==17732750 and capsule['derivativeLimits'][3]==16
path=P/'active-n3-repeat-forced-source/original-source-nodes.jsonl.gz'
with gzip.open(path,'rb') as f:
 f.seek(1024352367);actual=json.loads(next(islice(f,22161393-22155584,22161393-22155584+1)))
assert actual['op']=='m3_coupled_expression_partial' and actual['args'][0]==capsule['id']
assert actual['args'][1]==capsule['parameters'] and actual['args'][2]==[0,0,0,1]+[0]*10
proof=D['protected']['originalGraph'];assert proof['targetApplications']==[22001223,22001224]
assert [(x['body'],x['SigmaTargetOperandCounts']) for x in proof['gaugeBodies']]==[(22001305,[204,204]),(22001469,[204,204])]
assert proof['signedAzimuthalGaugeFirstPartialRoots']['Z']==22001992
assert D['curl']['curlTimeImaginary'][0]=='-epsilon*Z_T(C_theta)/2'
assert D['curl']['originalRadialChart']['ordinaryCommutatorTR']=='ZERO_ON_FIXED_NATIVE_LABEL'
assert all(17732750 not in x['freeCoordinates'] for x in D['curl']['originalRadialChart']['localAndCommonReference'])
base=D['trace'];original=base['pinned'](a.goal);ops=original['arithmetic'];src=inspect.getsource(base['trace'])
old='directions = tuple(product(range(4),range(7),range(3)))';new='directions = tuple(product(range(4),range(9),range(4)))';assert src.count(old)==1
env={};exec(compile(src.replace(old,new),'c134_tt_original_trace','exec'),base['trace'].__globals__,env);trace=env['trace']
targets=((0,0,2),(0,1,2));REG=base['REGIONS'];now={str(j):{r:trace(ops,j,r) for r in REG} for j in targets}
def roles(field):
 if field=='localStress':return {tuple(x) for rr in now.values() for d in rr.values() for x in d[field]}
 return {(f,tuple(j)) for rr in now.values() for d in rr.values() for f,j in d[field]}
cov=roles('covariance');mean=roles('compactMean');local=roles('localStress')
presentCov={tuple(v['RZTL'][:3]) for key in ('pre131','pre130') for v in D[key]['covarianceRows'] if v['allSixComponents'] and v['RZTL'][3]==0}
missingCov={(f,j) for f,j in cov if j not in presentCov and j[2]>0}
presentMean={(f,tuple(j[:3])) for key in ('pre131','pre130') for f,j in D[key]['meanAndCompactDependencies']['requested'] if j[3]==0}
presentMean|={(f,tuple(j[:3])) for f,j,*_ in D['mean116']['temporalMeanRows'] if j[3]==0}
presentMean|={(f,tuple(j[:3])) for key in ('compact127','compact130') for f,j in D[key]['targets'] if j[3]==0}
missingMean=mean-presentMean
gauge={(a[0]+b[0],a[1]+b[1],a[2],b[2]) for _,i in cov for a in product(*(range(u+1) for u in i)) for b in ((0,0,0),(1,0,0),(0,1,0),(0,0,1))}
knownGauge={tuple(x) for k in ('pre131','pre130') for x in D[k]['targetGaugeDirections']}
missingGauge={j for j in gauge-knownGauge if j[2]>0}
third={x for x in mean if x[1][2]>=3}
out={'schema':'MathScope.C134.LiveRadialNativeTTSourceFrontier/1','status':'EXACT_NATIVE_WAVE_TT_BUDGET_SOURCE_RECURRENCE_GAUSSIAN_TRACE_OPEN',
 'actualTNode':actual,'activeCapsule':capsule,'TTApplicationMaterializedByThisAudit':False,'TTApplicationAnywhereInLiveGraph':'NOT_CHECKED',
 'proposedOrdinaryTTVector':[0,0,0,2]+[0]*10,'nativeSlotLimit':16,
 'ordinaryDerivativeRule':'At fixed label, partial_T(-epsilon * partial_T wave_r_im) = -epsilon * partial_TT wave_r_im; the Signed radial imaginary summand is -epsilon/2 * partial_Z C_theta, hence its explicit contribution is +epsilon^2/2 * C_theta,ZTT.',
 'signedSigmaTargets':targets,'allSignedGaugeSlowSuborders':sorted({(0,z,t) for z in range(2) for t in range(3)}),
 'originalSignedGaugeBodies':proof['gaugeBodies'],'originalSigmaApplications':proof['targetApplications'],
 'originalSigmaSourceTraces':now,'preSignedCovarianceRoles':sorted(cov),'positiveTimeCovarianceNotInPinnedReceipts':sorted(missingCov),
 'initializedCompactMeanRoles':sorted(mean),'initializedCompactMeanNotInPinnedRosters':sorted(missingMean),'thirdTimeMeanRoles':sorted(third),
 'localStressRoles':sorted(local),'preSignedGaugeCandidates':sorted(gauge),'positiveTimeGaugeNotInPinnedRosters':sorted(missingGauge),
 'weakGaussianFirstUnboundExample':{'SigmaTarget':[0,0,2],'region':'inner and outer','preSignedCovariance':['rtheta',[0,0,2]],'missing':'No pinned original TT Gaussian-times-finite-collar-pole bound; an exact cancellation of the complete supported source could change the sufficient crop.'},
 'scope':'Exact existing live T capsule, native derivative permission, protected Signed curl and placeholder source recurrence only. TT applications, mixed derivatives, Fourier convergence, epsilon bounds and even a positive-Gaussian fixed-label trace remain unproved. This is a sufficient source operand crop, not a proof that the complete supported expression cannot cancel.','pins':pins,'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS native TT allowed; source missing Wminus',len(missingCov),'old mean',len(missingMean),'TTT',len(third),'pre gauge',len(missingGauge),'local',sorted(local))
