"""Exact affine scale check for original cutoff stages 2 through 4."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


PIN = '7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b'


def plus(x, y):
    return tuple(a+b for a,b in zip(x,y,strict=True))


def scale(a, x):
    return tuple(a*t for t in x)


def encode(x):
    return [str(a) for a in x]


def main():
    p=ArgumentParser(description=__doc__)
    p.add_argument('--tail',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    a=p.parse_args()
    assert __debug__
    raw=a.tail.read_bytes()
    assert sha256(raw).hexdigest()==PIN
    tail=json.loads(raw)
    assert tail['allJAtLeast5'].startswith('Exactly zero')
    A,sx=(Q(1,2),Q(1)),(Q(1,2),Q(1,2))
    one,half=(Q(1),Q(0)),(Q(1,2),Q(0))
    # The volume contributes tau0, which cancels the same factor in S_R.
    relative_force_power=(Q(0),Q(2))
    rows=[]
    for j in (2,3,4):
        original=[r for r in tail['rows'] if r['stage']==j and r['derivativeOrder']<=1]
        assert [r['derivativeOrder'] for r in original]==[0,1]
        crude=[(Q(-2*m-4),Q(j,20)-5-Q(3*m,2)) for m in (0,1)]
        crude_norm=[plus(A,crude[0]),plus(plus(A,half),crude[1])]
        crude_ratio=[plus(scale(2,w),relative_force_power) for w in crude_norm]
        assert [w[0] for w in crude_ratio]==[-7,-10]
        # Physical potential and direct swirl have distinct source rescalings.
        gain=(Q(0),Q(j,10))
        pot=plus(plus(half,scale(-1,A)),gain)
        swirl=plus(scale(-1,A),gain)
        sharpened=[plus(pot,scale(-1,sx)),plus(pot,scale(-2,sx))]
        direct=[swirl,plus(swirl,scale(-1,sx))]
        assert all(x[0]==y[0] and x[1]<y[1] for x,y in zip(sharpened,direct,strict=True))
        norm=[plus(A,sharpened[0]),plus(plus(A,half),sharpened[1])]
        ratio=[plus(scale(2,w),relative_force_power) for w in norm]
        assert ratio==[(0,1+Q(j,5)),(0,Q(j,5))]
        rows.append({'stage':j,'originalCutoffNorms':[r['sourceCutoffNorm'] for r in original],
                     'coarseRelativePowers':list(map(encode,crude_ratio)),
                     'requiredPhysicalPotentialAndSwirlValuePowers':[encode(pot),encode(swirl)],
                     'sharpLocalizedVelocityAndGradientPowers':list(map(encode,sharpened)),
                     'sharpRelativePowers':list(map(encode,ratio))})
    result={'schema':'MathScope.N7.OriginalLateAnnularEnergyScaleTransfer/1',
            'status':'EXACT_COARSE_BOUND_OBSTRUCTION_AND_CONDITIONAL_SHARP_SCALE',
            'sourceTailSHA256':PIN,'powerConvention':'[a,b] means a+b*h; ratio columns are [E/S_R,D/S_R]',
            'conditionalInputs':'For each j=2,3,4 supply finite evaluated actual spatial A_j C2 and B_j C1 coefficient endpoints with original j/10 gain, including source logarithms and all labels. No pressure or time derivative enters E+D.',
            'combine':'Use the norm triangle for combined late stages and earlier field before squaring; no energy additivity on overlapping supports.',
            'rows':rows,'numericalAnnularBudgetClosed':False,'N7_06':'OPEN','N8_05':'OPEN','finalJets':0,'release':'HOLD'}
    raw=(json.dumps(result,indent=2)+'\n').encode()
    a.out.write_bytes(raw)
    print('PASS original late-stage coarse obstruction and sharpened affine energy/dissipation powers')
    print(sha256(raw).hexdigest(),a.out.name)


if __name__=='__main__':
    main()
