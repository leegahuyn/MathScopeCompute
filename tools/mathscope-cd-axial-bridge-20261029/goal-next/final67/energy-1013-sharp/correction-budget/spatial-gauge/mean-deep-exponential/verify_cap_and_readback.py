"""Exact rational checks for the cap seed, negative control and resulting bounds."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
import json
import sys

if not __debug__:
    raise RuntimeError("Numerical certificate checks require Python assertions.")

assert len(sys.argv)==4, 'Pass CONTROL_JSON, MEAN_JSON and NEW_OUTPUT.'
controls_path,mean_path,output=map(Path,sys.argv[1:])
assert not output.exists()
controls=json.loads(controls_path.read_bytes())
mean=json.loads(mean_path.read_bytes())
delta=F(1,2**128)
assert 2**256*delta>=1
# exp(delta) <= 1+delta+(delta^2/2)/(1-delta/3).
# This uses a geometric majorant for the positive Taylor tail from degree2.
exp_delta_upper=1+delta+(delta**2/2)/(1-delta/3)
assert exp_delta_upper<2
def rational_compare(a,b):
    levels=0
    while 'exp' in a and 'exp' in b:
        a=a['exp']
        b=b['exp']
        levels+=1
    assert set(a)==set(b)=={'rational'}
    aa,bb=F(a['rational']),F(b['rational'])
    return (aa>bb)-(aa<bb),levels
assert controls['status']=='PASS_DEEP_POSITIVE_SUM_CAP_AND_GUARD_CONTROLS'
for row in controls['rows']:
    if row['eligible']:
        assert row['depth']>=2 and row['value']>=256 and row['refinements']==1
        assert rational_compare(row['next']['upper'],row['old']['upper'])[0]==-1
    else:
        assert row['refinements']==0 and row['next']==row['old']
counts={'strict':0,'equal':0,'larger':0}
for row in mean['velocity'].values():
    for bound in row.values():
        comparison,levels=rational_compare(bound['interval']['upper'],bound['previousCommonGainUpper'])
        assert levels==7 and comparison==bound['upperComparison']
        counts[{-1:'strict',0:'equal',1:'larger'}[comparison]]+=1
assert counts=={'strict':9,'equal':0,'larger':0}
refinement=mean['BnormRefinement']
assert rational_compare(refinement['refined']['upper'],refinement['previous']['upper'])[0]==-1
energy=mean['actualMeanCutoffEnergy']
comparison,levels=rational_compare(energy['upperDividedByTau0'],energy['budgetDividedByTau0'])
assert comparison==energy['comparison']==1 and levels==7
assert rational_compare(energy['upperDividedByTau0'],energy['previousUpperDividedByTau0'])[0]==energy['upperComparisonToPrevious']==-1
result={
 'status':'PASS_EXACT_RATIONAL_DEEP_CAP_AND_MEAN_READBACK',
 'controlsSHA256':sha256(controls_path.read_bytes()).hexdigest(),
 'meanSHA256':sha256(mean_path.read_bytes()).hexdigest(),
 'delta':str(delta),'seedLower':str(2**256*delta),
 'depthOneExpDeltaUpper':str(exp_delta_upper),
 'velocityComparisons':counts,'BnormUpperStrictlyImproved':True,
 'fullMeanCutoffComparison':comparison,'commonEnergyExpLayers':levels,
 'fullMeanUpperStrictlyImproved':True,
 'release':'HOLD',
}
with output.open('x', encoding='utf8', newline='\n') as report:
    json.dump(result, report, indent=2)
    report.write('\n')
print('PASS cap seed, depth-one counter-control, nine strict mean improvements and still-open budget')
