"""Recheck exact outer-cutoff cells, refine its time integral, and test gauge data."""
from collections import Counter
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path
import sys

HERE=Path(__file__).resolve().parent
SOURCE=HERE/'source/research-ide/mathscope-m3'
OUTER=SOURCE/'recovery-20261019'
sys.path.insert(0,str(OUTER))
from outer_cutoff import ActualOuterCutoff, I, chi_jets
from run_outer_cutoff import partition
sys.path.insert(0,str(SOURCE/'closure-evidence-20261023'))
from original_torus_fourier_interval import pi_bracket


def read(path):
    return json.loads(path.read_bytes())


def atom(row,cell,name):
    return I(*row['jet_sets'][cell['jet_set']]['cutoff_jets'][name]['coefficient_interval'])


def measure(partitions):
    # Each time partition has equal normalized width and identical grid.
    time_width=Q(1,2*len(partitions))
    total=I.point(0)
    for row in partitions:
        volume=Q(row['normalized_cell_volume'])*time_width
        for cell in row['cells']:
            total+=volume*atom(row,cell,'C@0,0,0').square()
    return total


def time_partition(evaluator,n,bits):
    return [partition(evaluator,8,I(Q(1,2)+Q(j,2*n),Q(1,2)+Q(j+1,2*n)),bits) for j in range(n)]


def compare_time_splits(coarse,fine):
    assert len(fine)==2*len(coarse)
    count=Counter()
    names=tuple(coarse[0]['jet_sets'][0]['cutoff_jets'])
    for k,parent in enumerate(coarse):
        f0,f1=fine[2*k:2*k+2]
        for p,c0,c1 in zip(parent['cells'],f0['cells'],f1['cells'],strict=True):
            assert p['index']==c0['index']==c1['index']
            for name in names:
                old=atom(parent,p,name)
                v0,v1=atom(f0,c0,name),atom(f1,c1,name)
                combined=I(min(v0.lo,v1.lo),max(v0.hi,v1.hi))
                tightened=I(max(combined.lo,old.lo),min(combined.hi,old.hi))
                if tightened.hi-tightened.lo<old.hi-old.lo:
                    count['strictly_narrower']+=1
                else:
                    count['same_width']+=1
                if old.lo==old.hi==0:
                    assert tightened.lo==tightened.hi==0
                    count['retained_exact_zero']+=1
    return dict(count)


def separated_measure(cells=256):
    # Polar coarea gives radial pi/2 times integral_0^1 chi(u)^2 du.
    # Axial evenness yields the factor 2. Each scalar factor is nonnegative
    # decreasing, so use upper/lower endpoint rectangles.
    def integrate(start,end,argument):
        step=(end-start)/cells
        f=[chi_jets(argument(start+j*step),argument(start+j*step),96)[0].square()
           for j in range(cells+1)]
        return I(step*sum(v.lo for v in f[1:]),step*sum(v.hi for v in f[:-1]))
    radial=integrate(Q(0),Q(1),lambda q:q)
    axial=integrate(Q(0),Q(1),lambda q:2*q*q)
    time=integrate(Q(1,2),Q(1),lambda q:q)
    pi=pi_bracket(40)
    return I(pi.lo,pi.hi)*radial*axial*time, {
        'cellsPerFactor':cells,'radialUnitIntegral':radial.encoded(),
        'axialPositiveHalfIntegral':axial.encoded(),'timeIntegral':time.encoded(),
        'pi':'Exact Machin/alternating rational series enclosure',
        'radialMeasure':'Polar area dxdy=pi ds; argument u=2s gives pi/2',
        'axialMeasure':'Even on zeta in [-1,1], cancels factor 1/2 from radial',
    }


def actual_scale_obstruction(evaluator):
    # A->A+grad(x) leaves curl(A) unchanged and hence preserves the
    # uncut velocity, pressure and residual. It changes curl(C*A) by
    # grad(C) cross (1,0,0). Use the actual linear-seed cutoff.
    zeta=Q(5,8)
    rho=Q(3,4)
    witness=evaluator.evaluate(I.point(0),I.point(0),I.point(zeta),I.point(rho),160)
    axial=I(*witness['cutoff_jets']['C@0,1,0']['coefficient_interval'])
    assert axial.hi<0
    assert chi_jets(rho,rho,160)[1]==I.point(-4)
    analytic_midpoint={'coordinates':'x=y=0, z=z0*sqrt(3/8), tau=(3/4)*tau0',
      'z0_times_C_z':'-8*sqrt(3/8)','nonzero':'z0>0 and sqrt(3/8)>0'}
    return {'type':'NONINJECTIVITY_OF_UNLOCALIZED_VELOCITY_TO_CUTOFF_POTENTIAL',
      'sameUncutVelocityPressureResidualForGaugeShift':True,
      'differenceWhenCutoffApplied':'curl(C*(A+grad(x)))-curl(C*A)=(0,C_z,-C_y)',
      'analyticMidpoint':analytic_midpoint,
      'rationalWitness':{'x':'0','y':'0','zeta':str(zeta),'rho':str(rho),
                         'normalizedVelocityDifferenceY':axial.encoded(),'C_y':'0',
                         'actualOuterCutoffSlopeAtThreeFourths':'-4'},
      'interpretation':'A gauge counterexample to inference from physical roots, not an alternative actual source field.'}


def main():
    import argparse
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--outer-replay',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    evaluator=ActualOuterCutoff()
    matches=[]
    for name in ('OUTER_CUTOFF_WHOLE_K_CELLS.json','OUTER_CUTOFF_DOUBLED_GRID.json'):
        archived=read(OUTER/'evidence'/name)
        replay=read(args.outer_replay/name)
        for key in ('cells','jet_sets','edges','cell_count','exact_zero_cells','missing_field_cells'):
            assert archived[key]==replay[key],(name,key)
        matches.append({'artifact':name,'exactCellAndJetTableEquality':True,'cells':replay['cell_count'],
                        'jetSets':len(replay['jet_sets']),'exactZeroCells':replay['exact_zero_cells'],
                        'fieldCellsPending':replay['missing_field_cells'],
                        'replaySHA256':hashlib.sha256((args.outer_replay/name).read_bytes()).hexdigest()})
    coarse=time_partition(evaluator,4,80)
    fine=time_partition(evaluator,8,80)
    time_compare=compare_time_splits(coarse,fine)
    assert time_compare['strictly_narrower']>0
    assert time_compare['same_width']+time_compare['strictly_narrower']==4*512*13
    old_measure=measure(coarse)
    refined_measure=measure(fine)
    intersection=I(max(old_measure.lo,refined_measure.lo),min(old_measure.hi,refined_measure.hi))
    assert intersection.lo>0 and intersection.hi<4
    assert intersection.hi-intersection.lo<old_measure.hi-old_measure.lo
    separated,factors=separated_measure()
    assert intersection.lo<=separated.lo<=separated.hi<=intersection.hi
    result={'schema':'MathScope.M3.OriginalCutoffIndependentTimeRefinement/1',
      'originalWholeKReplays':matches,
      'timeRefinement':{'spaceGrid':8,'timeCells':[4,8],'intervalArithmeticBits':80,
                        'normalizedTimeDomain':['1/2','1'],'parentCutoffJetComparisons':time_compare},
      'normalizedCutoffSquaredMeasure':{'meaning':'integral C^2 dx dy d(z/z0) d(tau/tau0) on whole spatial K and the transition slab',
        'coarse':old_measure.encoded(),'refined':refined_measure.encoded(),'intersection':intersection.encoded(),
        'independentPolarAndSeparable':separated.encoded(),'oneDimensionalFactors':factors,
        'toPhysicalFactor':'z0*tau0, retained symbolically','isPhysicalFieldEnergy':False},
      'gaugeObstruction':actual_scale_obstruction(evaluator),
      'finalFieldEnclosuresObtained':0,'N7_06':'OPEN','N8_05':'OPEN','release':'HOLD'}
    args.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n')
    print(json.dumps({'timeJetComparisons':time_compare,'cutoffSquaredMeasureDecimal':
                      [float(separated.lo),float(separated.hi)],'finalFieldEnclosuresObtained':0}))

if __name__=='__main__':
    main()
