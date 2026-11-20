#!/usr/bin/env python3
"""Original high compact means beta_Z6TT, gamma_Z5TT and v_Z5TT."""
import argparse,hashlib,json,runpy
from fractions import Fraction as Q
from pathlib import Path

p=argparse.ArgumentParser()
for name in ('work','runtime','out'):p.add_argument('--'+name,type=Path,required=True)
a=p.parse_args();W=a.work
pins={
 'demand':('continuation131/high-sigma/frontier.json','06f1c8ec97ef6361764453bc6cd65e1e4bd09d6ded2615cc1a032c2e0bed4b55'),
 'recurrence':('continuation103/initialized-mean/final/verify_initialized_mean.py','7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe'),
 'premean':('continuation97/middle-covariance/premean/final/verify_premean_whole_path.py','0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f'),
 'c98':('continuation98/covariance/final/global-primary-covariance.json','05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e'),
 'c11':('continuation101/high-frame/high-frame.json','5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603'),
 'c11Joined':('continuation101/high-frame/joined-high.json','4ad8582a8d107446cbdab41c0fc06b7415241fb7f09e795aa0e587be07b2637d'),
 'c15':('continuation106/frame15/frame-c15.json','09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8'),
 'c15Joined':('continuation106/frame15/joined-c15.json','98e3fa519ab4e323373d8f0beb85029938ba7b4ede221af982524705fd590fd3'),
 'shape':('continuation106/high-compact-mode-one/compact-mode-one-c15.json','00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884'),
 'five':('continuation97/middle-five-map/after-temporal-five-map.json','3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102'),
 'c119':('continuation119/compact-beta-zzt2/final/verify_compact_beta_zzt2.py','11244810e77f78442ed3f77b3a8c856f7e7200e6e57b81432a09df865b036538'),
 'tt128':('continuation128/compact-high-tt/verify_compact_high_tt.py','0996f7d32894ac0dda3b716ec739769df56b05f51e95287ccfe3c02f950a81e0'),
 'adapter':('continuation125/sigma-mixed-join/verify_sigma_mixed_join.py','6e9f98be7a7890fc00e4f84b0296947bb2a285f3c4f94a7cd807b3eedd1d058d')}
D={}
for key,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,key
 D[key]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
targets=sorted((f,(*j,0)) for f,j in D['demand']['compactNotInPinnedMeanRosters'])
assert targets==[('beta',(0,6,2,0)),('gamma',(0,5,2,0)),('v',(0,5,2,0))]
five=D['five'];assert [five['sourceDefinitions'][x] for x in ('Jtheta','beta','gamma','v')]==[21374531,21374944,21374926,21374922]
assert five['radialEndpoints']==[17743711,17743713] and five['beta']['wholeGammaMomentZero'] and five['conditionalBounds']['liveChart']['sDependsOnZ']
binding=D['c119']['source_bind'](a.runtime)
ops=D['recurrence'];row,(cov,shift,cutoff,inverse)=ops['whole_recipe'](D['premean']);direct=[{'field':f,'RZTL':j,'recurrenceOperand':row(f,j)} for f,j in targets]
moments,linear,products=ops['compact_demand'](targets);maximum={k:max(map(sum,v)) for k,v in moments.items()}
assert maximum=={'P':7,'Jz':7,'Jtheta':9} and len(products)==1170
pair=[];mass=Q(0);geom=0
for name,order,f,b,g,c,dz,mult in products:
 x,y=row(f,b),row(g,c);mass=max(mass,Q(x['coefficientMass']),Q(y['coefficientMass']));geom=max(geom,x['geometryPower'],y['geometryPower'])
 grade=Q(x['minEpsilon'])+Q(y['minEpsilon'])+dz;surplus=Q(x['bandIntercept'])+Q(y['bandIntercept'])+3*dz-Q(1,2)
 pair.append({'moment':name,'direction':order,'left':[f,b],'right':[g,c],'epsilonGrade':str(grade),'bandSurplus':str(surplus),'multiplicity':mult})
needed=cov|linear;high={(f,j) for f,j in needed if sum(j[:3])>7 or j[3]>8}
assert len(needed)==510 and len(high)==108 and max(sum(j[:3]) for _,j in needed)==11 and max(j[3] for _,j in needed)==3 and max(map(sum,cutoff))==10
assert {(f,j) for f,j in high if sum(j[:3])==11}=={('W_rz',(0,9,2,l)) for l in (0,2)}
assert D['c11Joined']['pins']['frame']==pins['c11'][1] and D['c11Joined']['regularTargetOrdinaryOrder']==11
assert D['c15Joined']['pins']['frame']==pins['c15'][1] and D['c15Joined']['regularTargetOrder']==15 and D['c15Joined']['originalBackgroundOrder']==16
assert D['c15']['matrixDirections']==816 and D['c15']['cutoffOrder']==19
fn=D['adapter']['adapt'](ops['high_covariance_rows'],[('assert j<=10','assert j<=11'),
 ('outer_cost<2**23 and inner_cost<2**54','outer_cost<2**26 and inner_cost<2**63'),
 ('cover.bit_length()+54','cover.bit_length()+(63 if j==11 else 54)')])
small={x for x in high if sum(x[1][:3])<=9};large=high-small
hi=fn(small,D['c11'])+fn(large,{'primaryUniformLogRanks':D['c15']['uniformLogRanks']})
assert len(hi)==len(high) and all(sum(x['RZTL'][:3])+2<=(11 if tuple(x['RZTL']) in {j for _,j in small} else 15) for x in hi)
lowrank=sum(D['c98']['coefficientBudget']['commonGlobalCovarianceRanks']);highrank=max(sum(x['logDegreeRanks']) for x in hi)
linearrank=max(lowrank,*(sum(x['logDegreeRanks']) for x in hi if (x['component'],tuple(x['RZTL'])) in linear))
meanrank=max(lowrank,highrank)+256*geom+mass.numerator.bit_length()+64
shape=D['shape']['coefficientProfile'];assert D['shape']['compactMomentMaximumZT']=={'P':10,'Jz':10,'Jtheta':11}
assert all(maximum[k]<=D['shape']['compactMomentMaximumZT'][k] for k in maximum) and D['shape']['cutoff']['order']==13
assert shape['motionOfSRetained'] and shape['compactIndependentOfL'] and shape['compactZeroOnBothSourceCollars']
assert [shape[k] for k in ('finiteScalarCoefficientBits','finiteScalarGeometryBPower')]==[2938,42]
for item in pair:
 assert (Q(item['epsilonGrade'])-1)/2>Q(2*meanrank+4096,2**128)+Q(item['bandSurplus'])/2**32636
rank=max(linearrank,meanrank)+2938+42+64;assert rank<2**16
control=D['tt128']['moving_profile'](7,2);assert control['primitiveDerivativeZT']==[7,2] and control['nonzeroMovingScaleControl']>0
rows=[]
for f,j in targets:
 rows.append({'field':f,'RZTL':j,'epsilonPower':'2' if f=='beta' else '1',
              'bandPower':str((Q(7,2) if f=='beta' else Q(1,2))+3*sum(j[:3])),
              'logChargeHOver2Pow128':rank,'pole':0,'compactZeroOnBothOriginalCollars':True})
out={'schema':'MathScope.C131.OriginalCompactHighTT/1','status':'CONDITIONAL_ORIGINAL_THREE_COMPACT_HIGH_TT','targets':targets,
 'conditionalRows':rows,'directTemporalRows':direct,'primaryCovarianceCount':len(needed),'highPrimaryCovariance':hi,
 'momentMaximumTotalZT':maximum,'momentRequests':{k:sorted(v) for k,v in moments.items()},'quadraticHaarBranches':pair,
 'cutoffMaximumOrder':max(map(sum,cutoff)),'shiftedIntegralCount':len(shift),'inverseCount':len(inverse),'movingBetaControl':control,
 'runtimeSourceBinding':binding,'pins':pins,'scope':'Original compact mean source and C98/C11/C15 frame under fixed original chart, smooth moving scale, support and Fourier assumptions. Dynamic Wminus, local stress and complete Sigma are separate.','release':'HOLD'}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS compact three high TT: rank',rank,'high',len(high),'frame15',len(large),'moments',maximum)
