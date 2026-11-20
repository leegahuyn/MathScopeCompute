#!/usr/bin/env python3
"""Replay the one missing initialized mean row L² v_TT."""
import argparse,hashlib,json,runpy
from fractions import Fraction as Q
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();W=a.work
pins={
 'recurrence':('continuation103/initialized-mean/final/verify_initialized_mean.py','7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe'),
 'premean':('continuation97/middle-covariance/premean/final/verify_premean_whole_path.py','0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f'),
 'c98':('continuation98/covariance/final/global-primary-covariance.json','05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e'),
 'c11':('continuation101/high-frame/high-frame.json','5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603'),
 'c102':('continuation102/mode-one-attachment/final/mode-one-attachment.json','84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e'),
 'source':('continuation119/compact-beta-zzt2/final/verify_compact_beta_zzt2.py','11244810e77f78442ed3f77b3a8c856f7e7200e6e57b81432a09df865b036538'),
 'demand':('continuation126/late-swirl-time/replay.json','24591e84cd0c571fe18687b1884ea9def7945c3c6ece12dc51d3572b417dd34e')}
D={}
for k,(rel,digest) in pins.items():
 pth=W/rel;raw=pth.read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,k
 D[k]=runpy.run_path(str(pth)) if pth.suffix=='.py' else json.loads(raw)
target=('v',(0,0,2,2));assert ['v',[0,0,2,2]] in D['demand']['temporalT']['oldInitializedMeans']
src=D['source']['source_bind'](W/'continuation101/axial-budget/runtime/research-ide/mathscope-m3/navier')
ops=D['recurrence'];fn,(cov,shifted,cutoff,inverse)=ops['whole_recipe'](D['premean']);value=fn(*target)
high={(f,b) for f,b in cov if sum(b[:3])>7 or b[3]>8}
hi=ops['high_covariance_rows'](high,D['c11']);assert max((sum(x['logDegreeRanks']) for x in hi),default=0)<2**16
assert D['c98']['ordinaryDerivativeBudget']['mixedDirections']==1080
assert D['c102']['compactFiveMap']['compactIndependentOfL']
geometry=D['c102']['extendedCutoffGeometry'];assert geometry['order']==9 and max(geometry['coefficientLog2Ceilings'].values())<256
rank=max(sum(D['c98']['coefficientBudget']['commonGlobalCovarianceRanks']),max((sum(x['logDegreeRanks']) for x in hi),default=0))
coefficient=rank+value['geometryPower']+Q(value['coefficientMass']).numerator.bit_length()+1
assert coefficient<2**16
out={'schema':'MathScope.C127.InitializedOldL2VTT/1','status':'CONDITIONAL_ORIGINAL_MEAN_ROW',
 'target':{'field':'v','RZTL':[0,0,2,2]},'directTemporal':value,'compactContribution':'exactly zero because the native FiveMap field is L-independent',
 'conditionalLogCoefficientUnitsHOver2Pow128':coefficient,'highCovariance':hi,'covariance':sorted(cov),'shiftedPrimitives':sorted(shifted),'inverseRoles':sorted(inverse),'cutoffOrders':sorted(cutoff),
 'scope':'Original C103 whole-path composition under C98/C11 covariance, admitted shifted fixed-label chart, native finite Fourier bounds and flat endpoints. No post-Signed field or final gate follows.',
 'originalSourceBinding':src,'pins':pins,'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS L2 vTT',value,'coefficient',coefficient,'cov',len(cov),'high',len(high))
