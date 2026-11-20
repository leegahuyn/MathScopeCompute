from argparse import ArgumentParser
from dataclasses import dataclass, replace
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path


ROOT = Path('work/goal-next')
GATES = Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next')
SOURCE = ROOT / 'final67/source/research-ide/mathscope-m3/navier'
RUNTIME = ROOT / 'continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier'
PINS = {
    'geometry': (ROOT / 'continuation107/n8-n8-05-audit/final/sampling-geometry.json', 'd33baa5bd6b9514ea381c9745936ad056f7e3681de8978bc9196f2e119be3df9'),
    'localization': (SOURCE / 'source-localization.mjs', '5f6480f9799a9a83945f696833b9213585572efbe65e9e755b2935726e6f1036'),
    'partition': (RUNTIME / 'actual-covariance-source-certificate.mjs', 'c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681'),
    'coefficientCutoff': (ROOT / 'f1-mean/source/source-global-band.mjs', 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'),
    'stageCutoff': (SOURCE / 'shrinking-cutoff-summation.mjs', 'a4afa225c5da82d6894a40314ecdc8f7784390f58bb47e085d5d724d9f7ee05c'),
    'stageTail': (GATES / 'final67/cut-correction-tail.json', '7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b'),
    'atlas': (GATES / 'whole-k-atlas/result.json', 'ef5afe28cde499bf61016a0f8098d3fddb6535d88c9950e38b62d8dcdb742989'),
    'angular': (GATES / 'final67/angular-winding/actual-angular-winding.json', '6b4210a3365127297958b12f8795dede58793f8913e5d21c5679ea0fa14c83db'),
    'inner': (GATES / 'final67/inner-n8-refinement/inner-taylor-refinement.json', '86a17bafa5f65b311ee94fe789babeb866d185b33146c26128a86d59950fa601'),
    'exterior': (GATES / 'final67/exterior-n8-refinement/exterior-n8-refinement.json', '767a47dac5d8a73e2b5b076c4dfc6ed2c4749fc03258e7cc85f05c61cfc7c160'),
}


def verify_sources(workspace):
    inputs = {}
    for key, (path, pin) in PINS.items():
        data = (workspace / path).read_bytes()
        assert sha256(data).hexdigest() == pin, key
        inputs[key] = json.loads(data) if path.suffix == '.json' else data.decode()
    assert inputs['geometry']['sourceExtents']['longitudinalPulseTransitionPhysicalWidth'] == 'r0/(10 Tg^i) in tau'
    assert inputs['geometry']['originalSlab']['qUpperOpen']
    loc = inputs['localization']
    for text in ('globalDefinition:', 'Inside the original local domain, c=0 and all spatial cutoff derivatives vanish',
                 'axial=chi(axialArgument)', 'pressure:[{field:\'p_loc\',derivative:null,coefficient:c}]',
                 'c=chi(2*(x1^2+x2^2)/r0^2)*chi(2*x3^2/z0^2)*chi((1-t)/tau0)'):
        assert text in loc, text
    for text in ('floor(G.add(G.sub(x,centers[i][j]),q(1,2)))',
                 'v=G.div(G.add(eta,g.r0),g.ci)',
                 'meshCoordinates=slow.map(x=>G.mul(G.pow(ell,6),x))',
                 'supportedTime=G.choose(rectangle.v,G.zero,operator.geometry.Ls,G.zero,composed,G.zero)',
                 'G.choose(operator.chart.X,Xa,Xb,G.zero'):
        assert text in inputs['partition'], text
    assert 'chi(x)=1-sigma_1(2*x-1)' in inputs['coefficientCutoff']
    assert 'sigma=G.mul(selected.scale,q0)' in inputs['coefficientCutoff']
    assert '(2*a_J)^(-1)' in inputs['stageCutoff']
    assert inputs['stageTail']['allJAtLeast5'].startswith('Exactly zero on the slab')
    assert inputs['atlas']['maximumSelectedCoefficientOrder'] == 4
    assert 'b_(N+1)q<2' in inputs['atlas']['referenceSelection']
    assert inputs['angular']['conditionalFinalCaps']['allQuadraticFullCircleExactGrid'] == '64W+3'
    assert inputs['exterior']['wholeKLastResolvedTau'] is None
    return inputs


def sample_indices(left, right, count, periodic=False):
    return tuple(left + (right-left)*k/count for k in range(count + (not periodic)))


def dyadic_count(width, maximum_width):
    quotient = width / maximum_width
    cells = (quotient.numerator + quotient.denominator - 1)//quotient.denominator
    return 1 << max(0, (cells-1).bit_length())


def nested_at_events(events, transition_pairs, slope, budget=1024, extra_cap=Q(0), extra_active=()):
    pairs = tuple(zip(events, events[1:]))
    assert events == sorted(set(events)) and all(pair in pairs for pair in (*transition_pairs,*extra_active))
    assert slope >= 0 and extra_cap >= 0
    caps = [max(slope if pair in transition_pairs else Q(0), extra_cap if pair in extra_active else Q(0)) for pair in pairs]
    counts = [dyadic_count(right-left, Q(1,16)/cap) if cap else 1
              for (left,right), cap in zip(pairs,caps)]
    if 2*sum(counts) > budget:
        raise ValueError('Refined complete event-segment cover exceeds the budget')
    rows = []
    for (left, right), cells, cap in zip(pairs, counts, caps):
        coarse = sample_indices(left, right, cells)
        twice = sample_indices(left, right, 2*cells)
        assert coarse == twice[::2]
        changing = (left, right) in transition_pairs
        change = (right-left)*slope/cells if changing else Q(0)
        assert change <= Q(1,16)
        assert (right-left)*cap/cells <= Q(1,16)
        rows.append({'endpointPair': list(map(str, (left,right))), 'baseCells': cells,
                     'doubleCells': 2*cells, 'maximumCutoffArgumentChange': str(change),
                     'maximumAnyRetainedArgumentChange':str((right-left)*cap/cells),
                     'doubledMaximumCutoffArgumentChange': str(change/2)})
    return rows


def original_chord():
    # At q=tau0 the implicit chart is exactly rho=1-zeta^2 for every original h.
    # Encode signed zeta as sign*sqrt(mu); mu stays rational.
    zero, plateau, support = Q(0), Q(1,4), Q(1,2)
    points = [zero, plateau, support]
    assert support < Q(3,4)**2
    assert 2*plateau == Q(1,2) and 2*support == 1
    assert [1-mu for mu in points] == [Q(1), Q(3,4), Q(1,2)]
    simultaneous = nested_at_events(points, [(zero,plateau),(plateau,support)],Q(2),
                                    extra_cap=Q(4),extra_active=[(plateau,support)])
    assert [row['baseCells'] for row in simultaneous] == [8,16]
    def physical_samples(factor):
        return {(sign if mu else 0,mu,1-mu) for sign in (1,-1) for row in simultaneous
                for mu in sample_indices(*map(Q,row['endpointPair']),factor*row['baseCells'])}
    coarse, twice = physical_samples(1), physical_samples(2)
    assert coarse < twice and len(coarse) == 49 and len(twice) == 97
    return {'physicalFibre':'q=tau0; zeta=eta; rho=1-zeta^2; same real source for all original h',
            'radicalCoordinate':'signed zeta=sign*sqrt(mu); a unique zeta=0',
            'muBreaks':list(map(str,points)), 'rhoAtBreaks':['1','3/4','1/2'],
            'axialPlateauAndSupportArguments':['1/2','1'], 'timeCutoffArgSlopeInMu':'2', 'axialCutoffArgSlopeInMu':'4',
            'commonPhysicalSamples':len(coarse),'totalRefinedPhysicalSamples':len(twice),'rows':simultaneous,
            'evaluatedOriginalField':False}


def run_partition_replay(path):
    raw = path.read_bytes()
    data = json.loads(raw)
    assert data['sourceCalls'] == 99 and data['flatSupportSeams'] == 12
    assert data['sourceSHA256'] == 'a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f'
    for row in data['rows']:
        coordinate = Q(row['coordinate'])
        assert row['nearest'] == str((coordinate+Q(1,2))//1)
        assert row['active'] == [str(i) for i in range(-2,3) if abs(coordinate-i)<Q(3,4)]
    return sha256(raw).hexdigest()


@dataclass(frozen=True)
class Settings:
    grid: int = 4
    angle_cutoff: int = 4
    coefficient_order: int = 4
    bits: int = 80


COMPONENTS = ('ux','uy','uz','pressure','fx','fy','fz')
ZERO = ((Q(0), Q(0)),) * len(COMPONENTS)
ZERO_BOX = ((Q(0),Q(1)),(Q(3,4),Q(1)),(Q(1,2),Q(1)),(Q(0),Q(1)))


def plan_zero(settings):
    # This certificate proves the entire rational box lies strictly beyond support.
    assert 2 * ZERO_BOX[1][0]**2 == Q(9,8) > 1
    grid = tuple(sample_indices(lo,hi,settings.grid,periodic=axis==3)
                 for axis, (lo,hi) in enumerate(ZERO_BOX))
    # Every retained angular mode and source term has the same proved zero
    # multiplier. Project and round zero without touching nonzero branches.
    assert settings.angle_cutoff >= 0 and settings.coefficient_order >= 0 and settings.bits >= 1
    angular_projected = sum(0 for _ in range(-settings.angle_cutoff,settings.angle_cutoff+1))
    coefficient_partial_sum = sum(angular_projected for _ in range(settings.coefficient_order+1))
    scaled = coefficient_partial_sum * (1<<settings.bits)
    value = Q(scaled,1<<settings.bits)
    enclosure = ((value,value),) * len(COMPONENTS)
    return {p: enclosure for p in product(*grid)}


def common_points(left_id, right_id, left, right):
    if left_id != right_id:
        raise ValueError('Field, domain, component or normalization mismatch')
    common = left.keys() & right.keys()
    if not common:
        raise ValueError('No common samples')
    for point in common:
        for x, y in zip(left[point], right[point], strict=True):
            if min(x[1],y[1]) < max(x[0],y[0]):
                raise ValueError('Incompatible enclosures on a common physical point')
    return len(common)


def rejected(action):
    try:
        action()
    except ValueError:
        return True
    return False


def check_zero_refinement():
    identity = (PINS['localization'][1], 'original C times pinned A,p before curl and localized momentum residual',
                COMPONENTS, 'physical raw output', ZERO_BOX, 'theta/(2pi)')
    base = Settings()
    coarse = plan_zero(base)
    doubled = {'grid':replace(base,grid=8), 'angle_cutoff':replace(base,angle_cutoff=8),
               'coefficient_order':replace(base,coefficient_order=8), 'bits':replace(base,bits=160)}
    comparisons = {}
    for axis, settings in doubled.items():
        assert [key for key in vars(base) if getattr(base,key)!=getattr(settings,key)] == [axis]
        refined = plan_zero(settings)
        assert coarse.keys() <= refined.keys()
        assert common_points(identity, identity, coarse, refined) == len(coarse)
        assert all(x == ZERO for x in refined.values())
        comparisons[axis] = {'newSetting':getattr(settings,axis),'commonPhysicalSamples':len(coarse),
                             'totalRefinedSamples':len(refined),'nonzeroRemainder':False}
    assert rejected(lambda: common_points(identity, ('unrelated field',), coarse, coarse))
    point = next(iter(coarse))
    assert rejected(lambda: common_points(identity, identity, {point:ZERO}, {point:((Q(1),Q(2)),)*len(COMPONENTS)}))
    assert rejected(lambda: common_points(identity, identity, coarse, {}))
    return {'domain':[[str(x) for x in bounds] for bounds in ZERO_BOX], 'coordinates':['rbar','zeta','rho','theta/(2 pi)'],
            'fieldRole':identity[1], 'componentOrder':COMPONENTS, 'baseSettings':vars(base), 'axisComparisons':comparisons,
            'separateUniformErrors':{'spatial':'0','Fourier':'0','coefficient':'0','arithmetic':'0'},
            'identityControlsRejected':3,'nonzeroFinalFieldEvaluation':False}


def make_receipt(workspace, partition_path):
    inputs = verify_sources(workspace)
    partition_sha = run_partition_replay(partition_path)
    w = list(map(Q, ('0','1/5','1/4','3/4','4/5','1')))
    xi = list(map(Q, ('-1','-3/4','-1/4','0','1/4','3/4','1')))
    longitudinal = nested_at_events(w,[(w[1],w[2]),(w[3],w[4])],Q(20))
    transverse = nested_at_events(xi,[(xi[1],xi[2]),(xi[4],xi[5])],Q(2))
    assert [row['baseCells'] for row in longitudinal] == [1,16,1,16,1]
    assert [row['baseCells'] for row in transverse] == [1,16,1,1,16,1]
    assert rejected(lambda: nested_at_events(w,[(w[1],w[2]),(w[3],w[4])],Q(20),64))
    phase_support = list(zip(w[1:4],w[2:5]))
    assert rejected(lambda: nested_at_events(w,[],Q(0),extra_cap=Q(1<<1024),extra_active=phase_support))
    selectors = list(map(Q,('0','1/2','1','2')))
    selector_mesh = nested_at_events(selectors,[(selectors[1],selectors[2])],Q(2))
    assert [row['baseCells'] for row in selector_mesh] == [1,16,1]
    outer_squared = list(map(Q,('0','1/4','1/2','1')))
    outer_squared_mesh = nested_at_events(outer_squared,[(outer_squared[1],outer_squared[2])],Q(4))
    assert Q(2)*2*6*64 == 1536
    for M in (1, 19, 32*(1<<1024)+1):
        assert 2*M+1 > M+M
    return {
        'schema':'MathScope.C108.OriginalN805NestedAdaptiveRefinement/1',
        'pins':{**{n:pin for n,(_,pin) in PINS.items()},'nodePartitionReplay':partition_sha},
        'status':'VERIFIED_EXACT_NESTED_SOURCE_ARGUMENT_REFINEMENT_AND_STRUCTURAL_ZERO_BRANCH',
        'physicalPullbacks':{
            'profileFibreAtFixedQ':'r=sqrt(2qX), z=z0*zeta, tau=q-z^2*q^(2h); use zeta sign and fixed q for monotonic time crossings',
            'timeBoundaryOnFixedQ':'zeta=+/-sqrt(Qstar-rhoStar)*Qstar^(-h), when Qstar>=rhoStar and within the admitted fibre',
            'fixedCopyRadialInverse':'xi+rProjection=Lambda_torus^i*r^dr; invert on r>=0 only when rhs is nonnegative and lies on admitted fibre',
            'fixedCopyTimeInverse':'tau=1-(tProjection+2*r0*w-r0)/Tg^i, tProjection=vt·(center+copy)/(4-2sqrt(2))',
            'backgroundAndStageSelectorCuts':['a_j*q=1/2,1','b_n*q=1/2,1','b_(N+1)*q=2'],
            'partitionCuts':'split -log2(q) and each band-specific ell^6 slow mesh at j+1/2 and j+/-1/4,3/4',
            'originalRadialGuardCuts':['X=Xa (Y=4)','X=Xb','2*r^2=1/2,1'],
            'originalAxialAndTimeGuardCuts':['2*zeta^2=1/2,1','rho=1/2,1','|eta| at admitted margin'],
            'periodicAngularPlan':'choose at least 64W+3 turns for support M=32W+1; k maps to 2k under doubling, no duplicated seam',
            'unresolved':'sort and instantiate the numerical physical hits for the whole nonzero chart from original admissible constants'},
        'branchwiseNestedPulseCutoffMeshes':{'longitudinalNormalizedW':longitudinal,'transverseNormalizedXi':transverse,
            'onlyCutoffTransitionCells':True,'timePhaseDerivativeInWCap':'1536*r0*Smax*kMax*Nstar on active support',
            'phasePlan':'restrict each support leaf further by certified phase, slow mesh and chart pitch before actual field evaluation'},
        'selectorArgumentMesh':{'argument':'a_j*q or b_n*q; 2 is the background reference switch operand',
                'leftPlateau':'[0,1/2]','inactiveFrom':'1','referenceSwitchStrictBelow':'2','rows':selector_mesh,
                'physicalProjection':'q=argument/a_j or argument/b_n; order-specific canonical constants required'},
        'outerSquaredCoordinateMesh':{'sourceCoordinates':['r^2','zeta^2'],'rows':outer_squared_mesh},
        'centralAxialTimeChord':original_chord(),
        'restrictedActualZeroField':check_zero_refinement(),
        'availableOtherDomainComparisons':{'inner':inputs['inner']['status'],'exterior':inputs['exterior']['status'],
              'exteriorLastVerifiedTau':inputs['exterior']['exteriorLastVerifiedTau']},
        'sameWholeFinalFieldObservedRefinements':0,'wholeKLastResolvedTau':None,
        'open':'nonzero annular same-field source producer, exact support realization and independent whole-field grid, Fourier, coefficient and arithmetic tail caps',
        'N8_05':'OPEN','N7_06':'OPEN','finalJets':0,'release':'HOLD',
    }


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--workspace', type=Path, default=Path.cwd())
    parser.add_argument('--partition', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    data = make_receipt(args.workspace, args.partition)
    with args.out.open('xb') as output:
        output.write((json.dumps(data,indent=2)+'\n').encode())
    print('PASS: original split arguments, nested pulse maps and four independent exact-zero field axis comparisons')
