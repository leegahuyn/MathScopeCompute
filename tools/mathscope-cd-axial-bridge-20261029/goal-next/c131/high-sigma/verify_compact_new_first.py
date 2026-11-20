#!/usr/bin/env python3
"""Attach fourteen new low/first-T compact rows to the original C128 profile."""
import argparse,hashlib,json,runpy
from fractions import Fraction as Q
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();W=a.work
pins={
 'demand':('continuation131/high-sigma/frontier.json','06f1c8ec97ef6361764453bc6cd65e1e4bd09d6ded2615cc1a032c2e0bed4b55'),
 'coverage':('continuation128/compact-pressure-coverage/coverage.json','3ac0131ed8c4082dd3be8b25797c818114b3c8a0cd81837927ae52066529aeb6'),
 'pressure':('continuation128/pressure-presigned/pressure-covariance.json','51e3a1190c574723990a28ad9af2f477d01bf2e1a6789122243f612115497a85'),
 'recurrence':('continuation103/initialized-mean/final/verify_initialized_mean.py','7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe'),
 'tt128':('continuation128/compact-high-tt/verify_compact_high_tt.py','0996f7d32894ac0dda3b716ec739769df56b05f51e95287ccfe3c02f950a81e0')}
D={}
for k,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,k
 D[k]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
new={(f,tuple(j)) for f,j in D['demand']['newRolesBeyondC128C130']['compactMean']}
targets={(f,j) for f,j in new if j[2]<2};higher=new-targets
assert len(new)==17 and len(targets)==14 and len(higher)==3
assert ('beta',(0,8,1)) in targets
available={(f,tuple(j[:3])) for f,j in D['pressure']['meanAndCompactDependencies']['requested'] if j[3]==0}
assert targets<=available
mom,lin,products=D['recurrence']['compact_demand'](sorted((f,(*j,0)) for f,j in targets))
orig={k:{tuple(x) for x in values} for k,values in D['pressure']['meanAndCompactDependencies']['compactMomentOrders'].items()}
assert all(v<=orig[k] for k,v in mom.items()) and (9,1) in mom['Jtheta']
profile=D['coverage']['compactProfile'];rank=profile['compactChargeInHOver2Pow128']
assert rank==D['pressure']['compactMomentGeometryCharge']==59326 and profile['motionOfSRetained'] and profile['compactZeroOnBothSourceCollars']
control=D['tt128']['moving_profile'](9,1);assert control['primitiveDerivativeZT']==[9,1] and control['nonzeroMovingScaleControl']>0
rows=[{'field':f,'RZT':j,'epsilonPower':'2' if f=='beta' else '1',
       'bandPower':str((Q(7,2) if f=='beta' else Q(1,2))+3*sum(j)),
       'unweightedCoefficientHOver2Pow128':rank,'oneGaussianCoefficientHOver2Pow128':rank+1}
      for f,j in sorted(targets)]
out={'schema':'MathScope.C131.NewCompactFirstTime/1','status':'CONDITIONAL_ORIGINAL_NEW_COMPACT_FIRST_TIME','conditionalRows':rows,
 'momentMaximumTotalZT':{k:max(map(sum,v)) for k,v in mom.items()},'quadraticBranches':len(products),
 'movingBetaZ8TControl':control,'excludedSeparateTT':sorted(higher),'pins':pins,
 'scope':'Original initialized compact field only. Existing C128 full 364-source-request profile and original C98/C15 frame, chart, moving cutoff and Fourier premises are required. The three higher TT rows are proved in a separate receipt.','release':'HOLD'}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS 14 compact low/first-T max',out['momentMaximumTotalZT'],'coefficient',rank,'move products',control['distinctProductsPerCopy'])
