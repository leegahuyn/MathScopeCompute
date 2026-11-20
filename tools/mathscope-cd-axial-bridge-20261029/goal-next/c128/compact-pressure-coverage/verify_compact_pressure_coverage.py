#!/usr/bin/env python3
"""Recompute original compact-moment coverage for all 34 high Sigma roles."""
import argparse,hashlib,json,runpy
from fractions import Fraction as Q
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();W=a.work
pins={
 'demand':('continuation127/late-wrz-sigma-dependencies/late-wrz-sigma-dependencies.json','79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36'),
 'pressure':('continuation128/pressure-presigned/pressure-covariance.json','51e3a1190c574723990a28ad9af2f477d01bf2e1a6789122243f612115497a85'),
 'pressureCode':('continuation128/pressure-presigned/verify_presigned_pressure_high.py','13646d4b8550392005a00d2b82ec7de6540c6dac8164e6290ebbbae3d3865738'),
 'tt':('continuation128/compact-high-tt/compact-high-tt.json','cb3c664e8c43e15b9dbe9fe0f290cdea881b7c01a557a0c62149ba1b275e2ef7'),
 'recurrence':('continuation103/initialized-mean/final/verify_initialized_mean.py','7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe'),
 'premean':('continuation97/middle-covariance/premean/final/verify_premean_whole_path.py','0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f'),
 'profile':('continuation102/mode-one-attachment/final/verify_mode_one_attachment.py','32e360aa6f7449772151622bc6528681f013eba81cc39a0e7c8e70b529540554'),
 'c98':('continuation98/covariance/final/global-primary-covariance.json','05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e'),
 'five':('continuation97/middle-five-map/after-temporal-five-map.json','3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102'),
 'static':('continuation106/high-compact-mode-one/compact-mode-one-c15.json','00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884'),
 'adapt':('continuation125/sigma-mixed-join/verify_sigma_mixed_join.py','6e9f98be7a7890fc00e4f84b0296947bb2a285f3c4f94a7cd807b3eedd1d058d')}
D={}
for key,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,key
 D[key]=runpy.run_path(str(path)) if path.suffix=='.py' and key!='pressureCode' else (raw.decode() if key=='pressureCode' else json.loads(raw))
dem=D['demand'];pre=D['pressure'];tt=D['tt'];ops=D['recurrence']
assert dem['roots']==[22001223,22001224,22000443] and dem['fixedEndpoints']==[17743711,17743713]
req={(f,tuple(idx)) for f,idx in dem['newCompactMeanAllOrders']};assert len(req)==34
target_tt={(r['field'],tuple(r['RZTL'][:3])) for r in tt['conditionalRows']}
assert len(target_tt)==6 and target_tt=={(f,tuple(x)) for f,x in dem['newCompactMeanSecondTimeOnly']}<=req
all_requests={(f,tuple(idx)) for f,idx in pre['meanAndCompactDependencies']['requested']}
missing={(f,j) for f,j in req if (f,(*j,0)) not in all_requests};assert not missing
assert len(all_requests)==364 and pre['compactMomentGeometryCharge']==59326
assert pre['status']=='VERIFIED_MIXED_SOURCE_TRANSFER_CONDITIONAL_ON_ORIGINAL_ADMITTED_ANALYTIC_PROFILES'
for text in ('max_order=10','compactMomentRequiredOrders','assert profile["compactChargeInHOver2Pow128"]<2**16'):
 assert text in D['pressureCode']
moments,linear,products=ops['compact_demand'](sorted(all_requests))
assert {k:[list(x) for x in sorted(v)] for k,v in moments.items()}==pre['meanAndCompactDependencies']['compactMomentOrders']
assert len(products)==pre['meanAndCompactDependencies']['compactQuadraticBranches']==1593
subset,linear_sub,prod_sub=ops['compact_demand'](sorted((f,(*j,0)) for f,j in req))
assert all(set(v)<=set(moments[k]) for k,v in subset.items()) and set(linear_sub)<=set(linear)
assert ('beta',(0,7,1)) in req and (8,1) in subset['Jtheta']
assert max(map(sum,subset['Jtheta']))==9
assert ('beta',(0,7,1)) not in {(f,j) for f,j in req if j[1]<=6}
# Recompute all nonlinear source products and the same exact profile debit.
row,_=ops['whole_recipe'](D['premean']);grades={k:[] for k in moments};surpluses={k:[] for k in moments}
for name,order,f,b,g,c,dz,mult in products:
 x,y=row(f,b),row(g,c)
 grades[name].append(Q(x['minEpsilon'])+Q(y['minEpsilon'])+dz)
 surpluses[name].append(Q(x['bandIntercept'])+Q(y['bandIntercept'])+3*dz-Q(1,2))
low=sum(D['c98']['coefficientBudget']['commonGlobalCovarianceRanks'])
high=max(sum(r['logDegreeRanks']) for r in pre['meanAndCompactDependencies']['exactHighSeeds'])
assert max(low,high)<2**16
geom=D['static']['cutoff'];assert geom['order']>=12
budget=D['adapt']['adapt'](D['profile']['compact_budget'],[
 ('max_order=7','max_order=10'),('assert max(g.values())<256','assert max(g.values())<512'),
 ('bell[-1]==877','bell[-1]==115975'),('x in bump)<64','x in bump)<128'),
 ('+7*(5+gs)','+max_order*(5+gs)'),('FaadiBrunoPartitionCountAtSeven','FaadiBrunoPartitionCountAtTen'),
 ('"linearCompactCovarianceUsesOnlyC7":True','"linearCompactCovarianceUsesSameHighSource":True')])
profile=budget({'fiveMap':D['five'],'crop':{'gradeAbsorption':{
 'minimumQuadraticEpsilonByMoment':{k:str(min(v)) for k,v in grades.items()},
 'maximumQuadraticBandSurplusBeforeAbsorption':{k:str(max(v)) for k,v in surpluses.items()}}}},max(low,high),high,geom)
assert profile['compactChargeInHOver2Pow128']==pre['compactMomentGeometryCharge']==59326
assert profile['compactZeroOnBothSourceCollars'] and profile['motionOfSRetained'] and profile['compactIndependentOfL']
assert Q(1,128)**2+Q(4,9)<1
rows=[]
for f,j in sorted(req):
 eps=2 if f=='beta' else 1;band=(Q(7,2) if f=='beta' else Q(1,2))+3*sum(j)
 rows.append({'field':f,'RZT':j,'epsilonPower':str(eps),'bandPower':str(band),
              'unweightedCoefficientHOver2Pow128':59326,'oneGaussianCoefficientHOver2Pow128':59327,
              'independentHighTTWitness':(f,j) in target_tt})
out={'schema':'MathScope.C128.All34OriginalCompactPressureMeanCoverage/1','status':'CONDITIONAL_ALL_34_SOURCE_BOUND_COMPACT_MEAN_ROWS',
 'roots':dem['roots'],'fixedEndpoints':dem['fixedEndpoints'],'rows':rows,'priorSourceRequests':364,
 'momentMaximumTotalZT':{k:max(map(sum,v)) for k,v in subset.items()},'originalMomentSets':{k:sorted(v) for k,v in subset.items()},
 'quadraticBranchesForAllRequests':len(products),'linearHighPrimaryRows':pre['meanAndCompactDependencies']['highLinearMomentRows'],
 'compactProfile':profile,'independentSixTT':sorted(target_tt),'negativeControl':'Removing Z>6 drops the actual beta_Z7T source request.',
 'scope':'Original initialized compact fields only, under the pinned current original C98/C15 frame, admissible chart, fixed paths, smooth moving source and Fourier hypotheses. The dynamic post-Signed covariance, noncompact mean, stress and full Sigma join are separate.','pins':pins,'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS all 34',len(req),'first/lower',len(req-target_tt),'TT',len(target_tt),'moment maxima',out['momentMaximumTotalZT'],'coefficient',profile['compactChargeInHOver2Pow128'])
