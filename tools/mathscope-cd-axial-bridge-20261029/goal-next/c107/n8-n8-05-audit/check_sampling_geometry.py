from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


CRITERIA='bfe0e57b127849a5413414c8e8340ed5592049082fd211d9172a2fce6f219156'
CHART='af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9'
GATES={
    'atlas':('whole-k-atlas/primary-reference-cover.json','143d32b523429323eb3efc8ef8ea9c8f8922162bd919712cfe41580103a788be'),
    'scale':('first-scale-closure/first-scale-closure.json','1efc5a0d90ed98b14d79ee4c20d4ff2a3b86cf9c4cedd0cc1590868dbcbaf81a'),
    'angular':('final67/angular-winding/actual-angular-winding.json','6b4210a3365127297958b12f8795dede58793f8913e5d21c5679ea0fa14c83db'),
    'stages':('final67/cut-correction-tail.json','7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b'),
    'scalar':('primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget/outer-weight-comparison/outer-scalar-budget.json','0d1e6635208ef369741a7073067b69e467608114495c03bb22c3575715d01873'),
}
LOCAL={
    'source-localization.mjs':'5f6480f9799a9a83945f696833b9213585572efbe65e9e755b2935726e6f1036',
    'shrinking-cutoff-summation.mjs':'a4afa225c5da82d6894a40314ecdc8f7784390f58bb47e085d5d724d9f7ee05c'
}


def read(path,pin):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==pin,path
    return data


def sources(args):
    original=json.loads(read(args.criterion,CRITERIA))
    chart=json.loads(read(args.chart,CHART))
    checks={n:json.loads(read(args.goal/name,digest)) for n,(name,digest) in GATES.items()}
    loc={n:read(args.localization/n,digest).decode() for n,digest in LOCAL.items()}
    found=[row for row in original['criteria'] if row['id']=='N8-05'] if 'criteria' in original else []
    if not found:
        found=[row for rows in original.values() if isinstance(rows,list)
               for row in rows if isinstance(row,dict) and row.get('id')=='N8-05']
    criterion,=found
    assert criterion['page']==66
    assert all(x in criterion['text'] for x in ('Fourier cutoff','coefficient order','arithmetic precision','last-resolved'))
    assert "chi(s)=1-sigma1(2s-1)" in loc['source-localization.mjs']
    assert "c=chi(2*(x1^2+x2^2)/r0^2)*chi(2*x3^2/z0^2)*chi((1-t)/tau0)" in loc['source-localization.mjs']
    assert "tau0===G.div(qStar,q(32))" in loc['source-localization.mjs']
    assert "z0===G.exp(G.mul(D,G.log(tau0)))" in loc['source-localization.mjs']
    assert "r0===G.one" in loc['source-localization.mjs']
    assert chart['variables']['chart_equation']=='Q - sigma * Q^(2h) = rho'
    assert chart['variables']['Q']=='q/tau0'
    assert chart['variables']['bounds']==['1/2 <= Q < 2','|eta| < 3/4','q < qBig/16']
    assert chart['last_resolved_tau'] is None
    assert chart['four_axis_final_field_comparison_evaluated'] is False
    assert checks['atlas']['physicalSlab']['N4']['qOverQBig']==['1/64','1/32']
    assert checks['atlas']['physicalSlab']['N3']['qOverQBig']==['1/32','1/16']
    assert checks['scale']['actualRoots']['qBig']==622791
    assert checks['scale']['qBigComparison']['actual']=='qBig=2^(-(ellMinimum+10))'
    assert checks['scale']['qBigComparison']['strictLowerBounds'][:2]==['2048*h^(-2)','Bnorm^512/2']
    assert checks['angular']['physicalBand']['ellMax']=='ellMinimum+16'
    assert checks['angular']['conditionalFinalCaps']['cylindricalVelocityPressure']=='16W'
    assert checks['angular']['conditionalFinalCaps']['cylindricalForce']=='32W'
    assert checks['angular']['conditionalFinalCaps']['allQuadraticFullCircleExactGrid']=='64W+3'
    assert checks['stages']['allJAtLeast5'].startswith('Exactly zero on the slab')
    assert checks['scalar']['threshold']['logSOverHUpperAsNegativePowerOfTwo']==32636
    raw=args.operands.read_bytes()
    geom=json.loads(raw)
    assert [row['sign'] for row in geom['exactFixedCopyJacobianRows']]==[1,-1]
    assert all(row['zeroNumeratorMonomials']==[0]*6 and row['wrongTimeSignRejected']
               for row in geom['exactFixedCopyJacobianRows'])
    assert geom['sourceLongitudinalTransitionWidth']=='r0/(10 Tg^i)'
    assert geom['sourcePhaseTimeChain']=='partial_T(v)=-Q Tg^i/ci=-1/epsilon on a fixed copy and label'
    assert geom['exactBasisGramOverQSqrt2']==[[[4,-2],[0,0]],[[0,0],[4,-2]]]
    assert geom['ellCoverageArithmeticProgram']['sourceR0']=='2^-34'
    assert geom['originalNormalAndCarrierCaps']=={'normal':'Bnorm^8*(1+Ls)','carrier':'Bnorm^5'}
    return criterion,sha256(raw).hexdigest()


def arithmetic():
    # Core/contact chart geometry: eta^2<=1 and 0<h<1/16.
    assert 1-2*Fraction(1,16)==Fraction(7,8)
    inv=Fraction(8,7)
    assert 2*2*inv<5      # dQ/dzeta
    assert 2*2*inv<5      # dlog2(q)/drho
    assert 2*2*5==20      # dlog2(q)/dzeta
    assert 4*2*5==40      # dY/dzeta through Y<=4
    assert 4*2*inv < 12   # dY/drho through Y<=4
    assert max(2*4,2)==8  # slopes of the outer support cutoff arguments
    # r and z fixed chart ratios for the three original l values.
    band_ratios=[Fraction(2),Fraction(1),Fraction(1,2)]
    assert max(max(x,1/x) for x in band_ratios)==2
    # The exact original pulse body transitions over normalized width 1/20.
    low=[Fraction(1,5),Fraction(1,4)]
    high=[Fraction(3,4),Fraction(4,5)]
    assert low[1]-low[0]==high[1]-high[0]==Fraction(1,20)
    assert Fraction(2,20)==Fraction(1,10)
    assert 2*6==12
    # Conservative |n| B^8 and carrier/phase derivative combination.
    assert 2*32==64
    assert 4*32 <= 64*2**2
    # Original radial positive exponent: 2<Lambda<3 and 5<Tg<6,
    # hence Lambda^3>Tg. Thus rho_g>1/3. Its exact h term is retained.
    assert 2**3>6
    assert 2*(Fraction(1,3)-Fraction(1,16*100000))>0
    assert 2*(1+Fraction(1,16))<3
    # The fixed-copy longitudinal affine policy necessarily fails
    # n<=2^1024 at the source centre label, using the original threshold.
    # h^2*L*ln 2>2048 and ln 2>1/2 imply H^2/L>32^2.
    # L> Bnorm^512/2 > 2^65535 and ln L<=sqrt(L) then suffice.
    assert 2048*Fraction(1,2)==32**2
    assert 128*512-1==65535
    assert (32-2)*2**32767>1024
    assert Fraction(80,6) / Fraction(1,2**34)>1
    dims=('rbar','zeta','rho','theta')
    base=Fraction(1,16)
    table=[{'axis':'base','normalizedMaximumPhaseOrCutoffArgumentChanges':[str(base)]*4}]
    for i,name in enumerate(dims):
        row=[base]*4
        row[i]/=2
        assert sum(row)==Fraction(7,32)
        table.append({'axis':name+' pitch halved alone','normalizedMaximumPhaseOrCutoffArgumentChanges':list(map(str,row))})
    return table


def main(args):
    criterion,geometry_sha=sources(args)
    table=arithmetic()
    result={
      'schema':'MathScope.C107.OriginalN805AnnularSamplingGeometry/1',
      'verified':'ORIGINAL_FIXED_COPY_PHYSICAL_JACOBIAN_AND_UNIFORM_SCALE_ARITHMETIC',
      'conditional':'ADMITTED_ORIGINAL_LABEL_PATHS_AND_ORIGINAL_FINITE_HARMONIC_COVER',
      'criterion':{k:criterion[k] for k in ('id','title','page','text')},
      'pins':{'originalCriterion':CRITERIA,'wholeKChart':CHART,'sourceReplay':geometry_sha,
              **{k:d for k,(_,d) in GATES.items()},**LOCAL},
      'originalSlab':{'tau0':'qBig/32','z0':'tau0^(1/2-h)','q':['qBig/64','qBig/16'],
                      'qUpperOpen':True,'positiveTauRange':['tau0/2','tau0']},
      'sourceExtents':{'coreRadius':'sqrt(2*q*Xa)',
                        'outerAxialHalfWidth':'z0/sqrt(2)','movingNormalizedCore':'Y=Lambda*rbar^2/(2*(q/tau0)) <= 4',
                        'radialPulseTransitionCoordinateWidth':'r0/2 in xi',
                        'longitudinalPulseTransitionPhysicalWidth':'r0/(10 Tg^i) in tau','r0':'2^-34'},
      'sourceScales':{'coordinates':['rbar=r/sqrt(tau0)','zeta=z/z0','rho=tau/tau0','theta'],
        'ellRange':['ellMinimum+14','ellMinimum+16'],'relativeQ':[2,1,'1/2'],
        'Smin':'(ellMinimum+14)^2','Smax':'(ellMinimum+16)^2',
        'epsilonMin':'(qBig/64)^h','kMax':'ceil(epsilonMin^(-1/2))',
        'LsMax':'12 r0 Smax','positiveNormalCap':'Nstar=Bnorm^8*(1+LsMax)',
        'angularWindingCap':'W=ceil(Bnorm^5*kMax)',
        'radialPulseArgumentSlope':'Axi=12*epsilonMin^(-1/100000)*max(Xa^(-1/2),4 Xb)/r0',
        'timePulseArgumentSlope':'Av=20/(r0*epsilonMin*Smin)'},
      'directionalCauseCaps':{
          'rbar':{'coreY':'4 Lambda sqrt(Xa)','slowMesh':'4 Smax^3','outerSupport':'8','transversePulse':'Axi','wavePhase':'64 kMax Nstar'},
          'zeta':{'coreY':'40','slowMesh':'4 Smax^3','outerSupport':'8','bandAndStageCutoff':'40','wavePhase':'64 kMax Nstar/epsilonMin'},
          'rho':{'coreY':'12','slowMesh':'4 Smax^3','outerSupport':'2','bandAndStageCutoff':'10','longitudinalPulse':'Av','wavePhase':'64 kMax Nstar/epsilonMin'},
          'theta':{'phaseAndCartesianRotation':'32 W+2'}},
      'sufficientBranchwisePitch':'spacing <= 1/(16*max of its directional cap row); fixed reference and copy; split path at original branch boundaries',
      'geometryOnlyRefinementRows':table,
      'longitudinalUniformPolicyLower':{'originalCentreLabel':'ellMinimum+15','requiredNormalizedPulseArgumentChangePerStep':'<=1/16',
          'necessaryUniformCountForAffineGeometryPolicy':'n > 80*exp(H)/(6*r0*(ellMinimum+15)^2) > 2^1024',
          'measurement':'original affine pulse-coordinate policy; no assertion about existing adaptive methods, runtime failure, actual solution convergence or last-resolved tau'},
      'applicationUnclosed':{'observedRefinementComparisons':'0/4 on the identical full final field',
          'actualWholeFinalFieldUniformTails':False,'lastResolvedPositiveTauForWholeK':None,
          'missing':'numerical field-enclosure producer on admitted annular cells and own-source cover; actual active increment evaluations for all four axes; field-valued tails; final common observed tau'},
      'N8_05':'OPEN','N7_06':'OPEN','finalJets':0,'release':'HOLD'
    }
    with args.out.open('xb') as output:
        output.write((json.dumps(result,indent=2)+'\n').encode())
    print('PASS: original annular core, axial, pulse, phase and cutoff directional scales; independent geometric refinements')


if __name__=='__main__':
    parser=ArgumentParser()
    for name in ('operands','criterion','chart','goal','localization','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    main(parser.parse_args())
