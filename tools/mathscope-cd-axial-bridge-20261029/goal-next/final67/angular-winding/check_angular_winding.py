"""Replay original post-Five angular carriers and derive finite slab mode caps."""

from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction
from hashlib import sha256
import json
from math import factorial
from pathlib import Path
import sys
from tempfile import TemporaryFile


THETA, K, BAND = 622806, 622801, 622791
PINS = {
    'candidate': '43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf',
    'manifest': '8ea8adbfeec6025371a6062afe50d0f28bacece88b0fe07d792739417ac87135',
    'registry': '5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920',
    'official': '3e3911a19698f1f59187a34665a86be9b1e2f6296a3fa113be1b5f12be2d5285',
    'cycle': '2570a6b98bf365e44629c40c4f406a4192b42f63acda67e08e1cd0e101b87181',
    'family': 'b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78',
    'wholeK': 'af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9',
    'angular': 'f9d6240fa7214d9fcb1254dd2b8a289723fdc0f4d08ee556dee8f7f8bb5d958a',
    'cutoff': '7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b',
    'postfive': '4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7',
    'harmonic': '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20',
    'band': 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
    'current': '93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
    'index': 'a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f',
    'carrierBound': 'b5e96a01ba3a64c2d8b07c4562cccc3bf5c062180a1b0fb8cae9bd799e896d88',
    'paper103': '6a5889bab60c959a1e2eac4ce65c0f596d24bc334f59642f8869d479fb99b2e1',
    'paper104': '118003fd915c747c9ae311a2dff22a813b86c3c619daf77ee80ae8957120470f',
    'paper108': '399bf272dd3b12f3a09d7f5d972170437bf9350b9011e7f205e8f1a989985976',
}
SOURCE_FILES = {
    'postfive': 'mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs',
    'harmonic': 'mathscope-m3/navier/source-harmonic-assembly.mjs',
    'band': 'mathscope-m3/navier/source-global-band.mjs',
    'current': 'mathscope-m3/navier/source-global-current.mjs',
    'index': 'mathscope-m3/navier/global-source-index.mjs',
    'carrierBound': 'mathscope-m2/navier/actual-covariance-operator-bounds.mjs',
}


def need(condition, message):
    if not condition:
        raise ValueError(message)


def pinned(path, label):
    content = path.read_bytes()
    need(sha256(content).hexdigest() == PINS[label], f'{label} SHA256')
    return content


def read(path, label):
    return json.loads(pinned(path, label))


def summands(graph, root):
    op, terms = graph.node(root)
    if op != 'add':
        yield root
        return
    for term in terms:
        yield from summands(graph, term)


def check_carriers(graph, scope, templates, phases):
    q = lambda root: Fraction(*map(int, graph.args(root, 'rational')))
    need(graph.args(K, 'ceiling') == [622800] and graph.args(622800, 'inverse') == [622799]
         and graph.args(622799, 'sqrt_positive') == [622798]
         and graph.args(622798, 'exp') == [622797]
         and graph.args(622797, 'multiply') == [9, 622796]
         and graph.args(9, 'source_parameter') == ['h']
         and graph.args(622796, 'log_positive') == [622794]
         and graph.args(622794, 'exp') == [622793]
         and graph.args(622793, 'multiply') == [20, 622792]
         and graph.args(622792, 'multiply') == [127, BAND]
         and graph.args(127, 'log_positive') == [24] and q(24) == 2
         and scope.free(K) == {BAND}, 'original frozen k=ceil((2^-ell)^(-h/2))')
    need(set(phases) == {str(t['phase']) for t in templates}, 'same ten preceding physical lifts')
    results = []
    for t in templates:
        phase = t['phase']
        p = phases[str(phase)]
        omega, theta_term = p['windingRate'], p['thetaTerm']
        inner, lo, hi, left, fallback, right = graph.args(omega, 'smooth_piecewise')
        neg, ceil = graph.args(inner, 'multiply')
        [negative] = graph.args(ceil, 'ceiling')
        minus, shifted = graph.args(negative, 'multiply')
        half, seed = graph.args(shifted, 'add')
        need(q(neg) == q(minus) == -1 and q(half) == Fraction(1, 2)
             and q(lo) == Fraction(-1, 2) and q(hi) == Fraction(1, 2)
             and left == right == inner
             and graph.args(fallback, 'smooth_piecewise') == [seed, 0, 0, 20, 1, 1]
             and graph.args(seed, 'multiply')[0] == K,
             f'{t["key"]}: original nearest-nonzero integer')
        [angle, rate] = graph.args(theta_term, 'multiply')
        inv, integer = graph.args(rate, 'multiply')
        need(angle == THETA and integer == omega and p['waveNumber'] == K
             and graph.args(inv, 'inverse') == [K] and THETA not in scope.free(omega),
             f'{t["key"]}: original theta*omega/k')
        offsets = [i for root in p['offsetSummands'] for i in summands(graph, root)]
        need(Counter(summands(graph, phase)) == Counter([theta_term, *offsets])
             and all(THETA not in scope.free(root) for root in offsets),
             f'{t["key"]}: exact angle-affine phase and native offsets')
        need([row['m'] for row in t['rows']] == [1, 2, 3, 4], 'original candidate harmonic slots')
        results.append({'key': t['key'], 'phase': phase, 'waveNumber': K, 'windingRate': omega})
    return results


def check_systems(scope, candidate, official, definitions):
    phases = {row['key']: row['phase'] for row in candidate['templates']}
    registered = {row['id']: row for row in json.loads(definitions['definitions'])[3]}
    observed = {(row['key'], row['mode']): row for row in official['systems']}
    need(set(observed) == {(key, m) for key in phases for m in range(1, 5)}, 'all audited slots')
    seen, roots = set(), set()
    for row in candidate['systems']:
        key, m, system = (row[k] for k in ('key', 'm', 'system'))
        template = next(t for t in candidate['templates'] if t['key'] == key)
        t = next(t for t in template['rows'] if t['m'] == m)
        d = registered[system]
        receipt = observed[key, m]
        need(receipt['system'] == system and d['name'] == f'ActualPostFiveRepeatForced_{key}_m{m}'
             and receipt['guardedRoots'] == t['guarded'] and receipt['rawRoots'] == t['raw']
             and THETA not in d['parameters'] and THETA not in d['directions']
             and (key, m) not in seen, 'same registered fixed-phase candidate')
        for name, mode in [('positive', m), ('negative', -m)]:
            harmonic = row[name]
            need(harmonic['m'] == mode, 'conjugate slot keeps physical carrier')
            roots.update(z[part] for z in [*harmonic['velocity'], harmonic['pressure']]
                         for part in ('real', 'imaginary'))
        seen.add((key, m))
    mean = candidate['mean']
    need(mean['m'] == 0 and all(z['imaginary'] == 0 for z in [*mean['velocity'], mean['pressure']]),
         'actual refreshed mean has a real zero theta mode')
    roots.update(z['real'] for z in [*mean['velocity'], mean['pressure']])
    need(seen == set(observed) and all(THETA not in scope.free(root) for root in sorted(roots)),
         'theta-free native candidate coefficients and refreshed mean')
    return len(roots)


def check_stages(family, chart, cutoff):
    nodes = {node['id']: node for node in family['nodes']}
    states = [nodes[i] for i in family['actual_stages']]
    need(len(states) == 6 and states[0]['operation'] == 'ActualInitializedState'
         and states[0]['data']['max_wave_harmonic'] == 1, 'original initialized state')
    operations = ('FullPressureAndResidualRefresh', 'OriginalFiveMap', 'FreshFiveTargets',
                  'FullPressureAndResidualRefresh', 'OriginalTemporalMap',
                  'ActualZeroAuxiliaryMeanResidual', 'FullPressureAndResidualRefresh',
                  'OriginalSignedMap', 'ActualPhysicalHaarTangentialResidual',
                  'FullPressureAndResidualRefresh', 'OriginalForcedMap', 'GroupedSupportedNonzeroResidual')
    rows = []
    for j, state in enumerate(states[1:], 1):
        d = state['data']
        prev = states[j - 1]['id']
        need(state['operation'] == 'CompletedActualStage' and d['j'] == j
             and d['complete_cycle_predecessor'] == prev
             and d['max_wave_harmonic'] == 2**j and d['max_residual_harmonic'] == 2**(j + 1),
             f'original stage {j} limits')
        pointer = d['full_refreshed_current']
        for op in operations:
            node = nodes[pointer]
            need(node['operation'] == op, f'original stage {j} {op}')
            if op == 'GroupedSupportedNonzeroResidual':
                need(node['inputs'] == [prev] and node['data']['all_conjugate_pairs']
                     and node['data']['all_generated_harmonics'] == f'0<|m|<=2^{j}',
                     f'complete source slots in stage {j}')
            # Map records' first input is current; their second input carries
            # the operator-specific source back to that same predecessor.
            source_maps = ('OriginalFiveMap', 'OriginalTemporalMap', 'OriginalSignedMap', 'OriginalForcedMap')
            pointer = node['inputs'][1 if op in source_maps else 0]
        rows.append({'stage': j, 'node': state['id'], 'wave': 2**j, 'residual': 2**(j + 1)})
    need(chart['variables']['bounds'] == ['1/2 <= Q < 2', '|eta| < 3/4', 'q < qBig/16']
         and chart['variables']['rho'] == 'tau/tau0 with tau=1-t and tau0=qBig/32'
         and chart['corrections']['possibly_active_stages'] == [1, 2, 3, 4]
         and chart['corrections']['first_strictly_zero_stage'] == 5
         and cutoff['allJAtLeast5'].startswith('Exactly zero'), 'whole-K exact cutoff slab')
    lower5 = sum(Fraction(5**i, factorial(i)) for i in range(7))
    need(lower5 > 64 and Fraction(cutoff['stageSupport']['exactSeriesLower']['3']) > 20
         and Fraction(cutoff['stageSupport']['exactSeriesLower']['4']) > 54,
         'strict rational exponential bounds for support thresholds')
    return rows


def controls():
    grouped = defaultdict(int)
    for m, omega, coeff in [(2, 3, 7), (1, 6, -7), (1, 1, 4)]:
        grouped[m * omega] += coeff
    need(grouped[6] == 0 and grouped[1] == 4, 'physical equal-winding cancellation')
    for cap in range(1, 34):
        aliased_grid, exact_grid = 2 * cap, 2 * cap + 1
        need((-cap) % aliased_grid == cap % aliased_grid, 'top frequency alias control')
        need(len({n % exact_grid for n in range(-cap, cap + 1)}) == exact_grid,
             'no equal residues over full spectrum')
    # In the e_r +/- i e_theta frame the connection eigenvalues are +/-i.
    # Gaussian integer pairs avoid a floating-point complex implementation.
    def i_times(pair, n=1):
        real, imaginary = pair
        return -n * imaginary, n * real

    def add(left, right):
        return tuple(a + b for a, b in zip(left, right, strict=True))

    for n in range(-33, 34):
        ur, ut = (4, -7), (-5, 3)
        vr = add(i_times(ur, n), tuple(-v for v in ut))
        vt = add(i_times(ut, n), ur)
        for sigma in (-1, 1):
            need(add(vr, i_times(vt, sigma)) == i_times(add(ur, i_times(ut, sigma)), n + sigma),
                 'cylindrical connection equals derivative of shifted Cartesian mode')
    point_carriers = (2**4) * 2
    need((1 + 2 * point_carriers * 16, 1 + 2 * point_carriers * 32) == (1025, 2049),
         'late-stage sparse physical mode counts before grouping')
    return {'groupEqualWindingBeforeSquare': 'PASS', 'aliasAt2M': 'PASS', 'noAliasAt2MPlus1': 'PASS',
            'exactCylindricalConnectionCartesianShift': 'PASS', 'sparsePointwiseCount': 'PASS'}


def main():
    p = ArgumentParser(description=__doc__)
    for label in ('candidate-dir', 'goal-next', 'source-root', 'paper-text-dir',
                  'official', 'cycle', 'family', 'whole-k', 'out'):
        p.add_argument('--' + label, required=True, type=Path)
    args = p.parse_args()
    need(__debug__, 'run without python -O')
    for subdir in ('first-force-repair', 'f1-mean'):
        sys.path.insert(0, str(args.goal_next / subdir))
    from verify_repaired_first_force import Graph
    from bind_mean_angle_scope import Scope

    for name, path in SOURCE_FILES.items():
        pinned(args.source_root / path, name)
    for name, path in [('paper103', 'prop91-93-p103.txt'), ('paper104', 'prop91-93-p104.txt'),
                       ('paper108', 'r105-initial-p108.txt')]:
        pinned(args.paper_text_dir / path, name)
    candidate = read(args.candidate_dir / 'post-five-repeat-forced-candidate.json', 'candidate')
    manifest = read(args.candidate_dir / 'original-source-export-manifest.json', 'manifest')
    registry = read(args.candidate_dir / 'original-source-functions.json', 'registry')
    official, cycle = read(args.official, 'official'), read(args.cycle, 'cycle')['correctedFullCycle']
    family, chart = read(args.family, 'family'), read(args.whole_k, 'wholeK')
    old = read(args.goal_next / 'whole-k-angular/whole-k-angular.json', 'angular')
    cutoff = read(args.goal_next / 'final67/cut-correction-tail.json', 'cutoff')
    need(candidate['snapshot'] == manifest and official['graphSHA256'] == manifest['node_stream_sha256']
         and official['registrySHA256'] == manifest['definitions_sha256'] == PINS['registry']
         and official['graphNodes'] == manifest['node_count'] == 4682006
         and official['matchedCorrectedFirstCyclePrefix']['firstStreamSHA256'] == cycle['graphSHA256']
         and official['completeSecondForcedState'] is False and candidate['scope']['completeSecondForcedState'] is False
         and official['release'] == candidate['scope']['release'] == 'HOLD'
         and old['receiptPins']['cycle'] == PINS['cycle'], 'exact earlier source and open-state pins')
    stages, tests = check_stages(family, chart, cutoff), controls()
    with TemporaryFile(dir=args.out.parent) as file:
        graph = Graph(args.candidate_dir / 'original-source-nodes.jsonl.gz', file, manifest)
        scope = Scope(graph, registry)
        carriers = check_carriers(graph, scope, candidate['templates'], cycle['sourceWindingPhases'])
        checked = check_systems(scope, candidate, official, registry)
    result = {
        'status': 'VERIFIED_ARCHIVED_PHASE_AND_CANDIDATE_SUPPORT_CONDITIONAL_FINAL_COVER',
        'inputPins': PINS, 'graphSHA256': manifest['node_stream_sha256'], 'graphNodes': manifest['node_count'],
        'sourceCarriers': carriers, 'nativeCandidateSlots': 40, 'thetaFreeCoefficientRoots': checked,
        'functionalStages': stages, 'controls': tests,
        'physicalBand': {'ellMax': 'ellMinimum+16', 'kMax': 'ceil((64/qBig)^(h/2))',
                         'windingCap': 'W=ceil(Bnorm^5*ceil((64/qBig)^(h/2)))'},
        'conditionalFinalCaps': {'cylindricalVelocityPressure': '16W', 'cartesianVelocity': '16W+1',
                                 'cylindricalForce': '32W', 'cartesianForce': '32W+1',
                                 'allQuadraticFullCircleExactGrid': '64W+3'},
        'conditionalSparsePointwiseCaps': {'fixedOriginalSignedLabels': 32, 'cylindricalVelocityPressure': 1025,
                                           'cylindricalForceWithDisjointClosedSupports': 2049},
        'wholeKFinalFieldsNumericallyEvaluated': False, 'independentFinalRefinementComparisons': 0,
        'N8_05': 'OPEN', 'N7_06': 'OPEN', 'finalJets': 0, 'release': 'HOLD',
    }
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'PASS {manifest["node_count"]} AST nodes, 10 phases, 40 native candidates, {checked} theta-free coefficient roots')


if __name__ == '__main__':
    main()
