#!/usr/bin/env python3
"""Replay C103/C116 original mean recurrence for three new C125 requests."""
import argparse,hashlib,json,runpy
from collections import Counter
from fractions import Fraction as Q
from itertools import product
from math import factorial
from pathlib import Path

p=argparse.ArgumentParser(description=__doc__);p.add_argument('--work',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();W=a.work
pins={
 'recurrence':('continuation103/initialized-mean/final/verify_initialized_mean.py','7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe'),
 'premean':('continuation97/middle-covariance/premean/final/verify_premean_whole_path.py','0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f'),
 'c11':('continuation101/high-frame/high-frame.json','5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603'),
 'c98':('continuation98/covariance/final/global-primary-covariance.json','05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e'),
 'profile':('continuation102/mode-one-attachment/final/verify_mode_one_attachment.py','32e360aa6f7449772151622bc6528681f013eba81cc39a0e7c8e70b529540554'),
 'geometry':('continuation102/mode-one-attachment/final/mode-one-attachment.json','84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e'),
 'joined':('continuation101/high-frame/joined-high.json','4ad8582a8d107446cbdab41c0fc06b7415241fb7f09e795aa0e587be07b2637d'),
 'c119':('continuation119/compact-beta-zzt2/final/verify_compact_beta_zzt2.py','11244810e77f78442ed3f77b3a8c856f7e7200e6e57b81432a09df865b036538'),
 'sigma':('continuation108/early-sigma-c6/final/verify_sigma_c6.py','f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8'),
 'five':('continuation97/middle-five-map/after-temporal-five-map.json','3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102')}
D={}
for name,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,(name,path)
 D[name]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
targets=[('beta',(0,3,2,0)),('gamma',(0,2,2,0)),('v',(0,2,2,0))]
source=W/'continuation125/sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json';report=json.loads(source.read_bytes())
assert hashlib.sha256(source.read_bytes()).hexdigest()=='569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b'
assert report['status']=='VERIFIED_ORIGINAL_OPERATOR_DEPENDENCIES_OPEN_NEW_NATIVE_BOUNDS'
assert {(f,(*j,0)) for f,j in report['newSecondTimeMeanRoles']}==set(targets)
source_binding=D['c119']['source_bind'](W/'continuation101/axial-budget/runtime/research-ide/mathscope-m3/navier')
assert '(Q(7,2) if f=="beta" else Q(1,2))+3*sum(a),0,54920)' in (W/pins['sigma'][0]).read_text(encoding='utf-8')
five=D['five']
assert [five['sourceDefinitions'][k] for k in ('Jtheta','gamma','beta')]==[21374531,21374926,21374944]
assert [five['beta'][k] for k in ('integral','nativeGammaZ','wholeGammaMomentZero')]==[21374941,21374939,True]
assert five['radialEndpoints']==[17743711,17743713] and five['conditionalBounds']['liveChart']['sDependsOnZ']
# Original four factors: Jtheta, moving s power, (1+eta^2), radial primitive.
jets={((0,0),)*4:1}
for axis in (0,1,0,1,0,0):
 new=Counter()
 for parts,count in jets.items():
  for k,orders in enumerate(parts):
   changed=tuple(v+(j==axis) for j,v in enumerate(orders))
   new[parts[:k]+(changed,)+parts[k+1:]]+=count
 jets=dict(new)
closed={}
for zz in product(range(5),repeat=3):
 for tt in product(range(3),repeat=3):
  last=(4-sum(zz),2-sum(tt))
  if min(last)<0: continue
  index=(*zip(zz,tt),last);den=1
  for z,t in index:den*=factorial(z)*factorial(t)
  closed[index]=factorial(4)*factorial(2)//den
assert jets==closed and (len(jets),sum(jets.values()))==(350,4**6)
assert jets[((3,2),(1,0),(0,0),(0,0))]*factorial(3)*factorial(2)==48
ops=D['recurrence'];row,(cov,shifted,cutoff,inverse)=ops['whole_recipe'](D['premean']);direct=[]
for field,alpha in targets:direct.append({'field':field,'RZTL':alpha,'conditionalTemporal':row(field,alpha)})
moments,linear,quadratic=ops['compact_demand'](targets)
assert max(sum(alpha[:3]) for _,alpha in linear)<=7
assert max(alpha[3] for _,alpha in linear)<=8
qrows=[];maxmass=Q(0);maxgeom=0
for name,order,f,b,g,c,dz,mult in quadratic:
 u,v=row(f,b),row(g,c);grade=Q(u['minEpsilon'])+Q(v['minEpsilon'])+dz
 maxmass=max(maxmass,Q(u['coefficientMass']),Q(v['coefficientMass']));maxgeom=max(maxgeom,u['geometryPower'],v['geometryPower'])
 surplus=Q(u['bandIntercept'])+Q(v['bandIntercept'])+3*dz-Q(1,2)
 assert (grade-1)/2>Q(2,2**112)+Q(2**14,2**128)+surplus/2**32636
 qrows.append({'moment':name,'order':order,'left':[f,b],'right':[g,c],'extraZ':dz,'multiplicity':mult,'grade':str(grade),'bandSurplus':str(surplus)})
needed=cov|linear;high={(f,alpha) for f,alpha in needed if sum(alpha[:3])>7 or alpha[3]>8};low=needed-high
maxslow=max(sum(alpha[:3]) for _,alpha in needed);maxl=max(alpha[3] for _,alpha in needed)
assert maxslow<=10 and maxl<=14
highrows=ops['high_covariance_rows'](high,D['c11']);assert {(r['component'],tuple(r['RZTL'])) for r in highrows}==high
assert D['c11']['frame']['auditedDirections']==364 and D['c11']['cutoff']['maximumOrder']==15
assert D['joined']['pins']['frame']==pins['c11'][1] and D['joined']['backgroundOrdinaryOrder']==12 and D['joined']['regularTargetOrdinaryOrder']==11
assert set(D['joined']['targetThreeRegions'])=={'inner','middle','outer'}
assert D['c98']['ordinaryDerivativeBudget']['mixedDirections']==1080 and D['c98']['coefficientBudget']['wholePathCovarianceLogCap']=='H/2^113'
momentmax={k:max(map(sum,v)) for k,v in moments.items()};positive={k:sum(t>0 for _,t in v) for k,v in moments.items()}
minrates={k:min(Q(z['grade']) for z in qrows if z['moment']==k) for k in moments};surplus={k:max(Q(z['bandSurplus']) for z in qrows if z['moment']==k) for k in moments}
geometry=D['geometry']['extendedCutoffGeometry'];assert geometry['order']==9 and max(geometry['coefficientLog2Ceilings'].values())<256
primary_rank=sum(D['c98']['coefficientBudget']['commonGlobalCovarianceRanks']);high_rank=max((sum(r['logDegreeRanks']) for r in highrows),default=primary_rank)
massbits=maxmass.numerator.bit_length()
mean_rank=max(primary_rank,high_rank)+maxgeom*256+massbits+64
assert primary_rank<2**16 and high_rank<2**16
for q in qrows:
 assert (Q(q['grade'])-1)/2>Q(2*mean_rank+4096,2**128)+Q(q['bandSurplus'])/2**32636
extra={'fiveMap':D['five'],'crop':{'gradeAbsorption':{'minimumQuadraticEpsilonByMoment':{k:str(v) for k,v in minrates.items()},'maximumQuadraticBandSurplusBeforeAbsorption':{k:str(v) for k,v in surplus.items()}}}}
compact=D['profile']['compact_budget'](extra,mean_rank,mean_rank,geometry)
assert compact['motionOfSRetained'] and compact['compactIndependentOfL'] and compact['compactZeroOnBothSourceCollars']
out={'status':'CONDITIONAL_ORIGINAL_C125_THREE_MEAN_RECURSIONS','targets':targets,'directTemporalRows':direct,
 'compactMomentRequests':{k:sorted(v) for k,v in moments.items()},'momentMaximumTotalZT':momentmax,'positiveTimeMomentCounts':positive,
 'linearCovariance':sorted(linear),'quadraticHaarProducts':qrows,'quadraticMultiplicity':sum(x['multiplicity'] for x in qrows),
 'allCovariance':sorted(needed),'highBeyondC98':highrows,'allCovarianceMaximumSlowOrder':maxslow,'allCovarianceMaximumLOrder':maxl,
 'lowCovarianceCount':len(low),'highCovarianceCount':len(high),'shiftedIntegralCount':len(shifted),'fourierInverseCount':len(inverse),'cutoffMaximumOrder':max(map(sum,cutoff)),
 'minimumQuadraticEpsilonByMoment':{k:str(v) for k,v in minrates.items()},'maximumQuadraticBandSurplusBeforeAbsorption':{k:str(v) for k,v in surplus.items()},
 'compactBetaZZZTT':{'RZT':[0,3,2],'epsilonPower':'2','bandPower':'37/2','logChargeHOver2Pow128':compact['compactChargeInHOver2Pow128'],'temporalMeanLogRankHOver2Pow128':mean_rank,'sourceJtheta':21374531,'sourceBeta':21374944,'assumptions':'Original admissible chart and moving cutoff, C98 low and C11 high Primary covariance, temporal/Fourier bounds, compact source profile and C103 recurrence.'},
 'compactGammaZZTT':{'RZT':[0,2,2],'epsilonPower':'1','bandPower':'25/2','logChargeHOver2Pow128':compact['compactChargeInHOver2Pow128']},
 'compactVZZTT':{'RZT':[0,2,2],'epsilonPower':'1','bandPower':'25/2','logChargeHOver2Pow128':compact['compactChargeInHOver2Pow128']},
 'betaMovingProfileJets':{'sourceDerivativeBeforeBetaPrefactor':[4,2],'fourFactorJetProductsPerCopy':len(jets),'totalMultiplicityPerCopy':sum(jets.values()),'movingScaleNonzeroControl':48,'sourceAxialCopies':2},
 'temporalMaxGeometryPower':maxgeom,'temporalMaxCoefficientMass':str(maxmass),'runtimeSourceBinding':source_binding,
 'compactProfile':compact,'geometryOrder':geometry['order'],'c125DemandSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'inputPins':pins,
 'scope':'Conditional C103/C116 recurrence and generic C11 high-source donor for the three old mean roles. The new Forced covariance, Signed local stress, source seams and complete gates remain independent.','release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS',len(direct),'means,',len(needed),'covariances,',len(high),'high, max',maxslow,maxl,'moments',momentmax,'quadratics',len(qrows),'compact',compact['compactChargeInHOver2Pow128'])
