"""Exact source replay of the original whole-K angular and first-gauge cutoff reductions."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as F
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

NEXT = Path(__file__).resolve().parents[1]
for relative in ('first-gauge', 'first-scale-closure', 'f1-mean'):
    sys.path.insert(0, str(NEXT / relative))

from bind_first_cycle_gauge import Graph, Native, Exact, select_chart, need, q
from bind_mean_angle_scope import Scope
from check_first_scale_closure import SourceProgram

THETA, K, R, Z, T, ELL, Y1, Y2 = 622806, 622801, 622802, 622803, 622804, 622791, 635044, 635045
RADIAL2, QREF, FIXED = 4458195, 4458194, 4458191
GRAPH = 'b68d5de9a1b03f4eb393eda5c1af8591a39237b66fc94edaf6d65959e3a70ab7'
REGISTRY = 'f8440a02d382dc2e07c9f074d4dbe1e3ab4f8e3697f9c92644bd0bc1ae45a6f1'
PINS = {
    'wholeK': 'af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9',
    'delta': '039e655f25d7992bfb56702dcb0b072be05f93bf56661af7ed5a7580ed8c69f8',
    'cycle': '2570a6b98bf365e44629c40c4f406a4192b42f63acda67e08e1cd0e101b87181',
    'n1Collars': '707ea90297e318aa7be02494d6485a8d083eb6481830fae1a2fdfed1d15ec37e',
    'pressureNorm': '68c70a831a219b9fbf5e6202c55c8f6f27c7bca252aab3669c6125054e392117',
}


def read(path, pin=None):
    raw = path.read_bytes()
    if pin:
        need(sha256(raw).hexdigest() == PINS[pin], f'authenticated {pin} receipt')
    return json.loads(raw)


class LocalizationProgram(SourceProgram):
    def node(self, index):
        raw = self.nodes[self.indices[index]]
        if raw['op'] == 'smooth_piecewise':
            return raw['op'], [self.ids[i] for i in raw['args']]
        return super().node(index)


def outer_and_scale(outer, whole, pressure, interval, cutoff_jets):
    p = LocalizationProgram(outer.archive)
    roots = {name: p.root(name) for name in
             ('x1', 'x2', 'z', 'tau', 'radialSquared', 'radialArgument', 'axialArgument',
              'timeArgument', 'chiRadial', 'chiAxial', 'chiTime', 'cutoff',
              'qStar', 'tau0', 'z0', 'r0', 'ellMinimum', 'ell0', 'D')}
    op = p.args

    def factor(root, term, power):
        return op(root, 'integer_power') == [term, power]

    def squared_args(root, coord):
        return any(p.node(i)[0] == 'integer_power' and factor(i, coord, 2)
                   for i in op(root, 'add'))

    need(op(roots['r0'], 'rational') == ['1', '1'] and
         squared_args(roots['radialSquared'], roots['x1']) and
         squared_args(roots['radialSquared'], roots['x2']),
         'exact Cartesian radial square and unit transverse scale')
    need(set(p.terms(roots['cutoff'], 'multiply')) ==
         {roots['chiRadial'], roots['chiAxial'], roots['chiTime']},
         'product of the three original primitive substitutions')
    for which in ('Radial', 'Axial', 'Time'):
        test, lo, hi, left, _, right = op(roots['chi' + which], 'smooth_piecewise')
        need(test == roots[which.lower() + 'Argument'] and
             [op(i, 'rational') for i in (lo, hi, left, right)] ==
             [['1', '2'], ['1', '1'], ['1', '1'], ['0', '1']],
             f'original {which} primitive endpoints and guard')
    radial_factors = p.terms(roots['radialArgument'], 'multiply')
    axial_factors = p.terms(roots['axialArgument'], 'multiply')
    time_factors = p.terms(roots['timeArgument'], 'multiply')
    tau_factors = p.terms(roots['tau0'], 'multiply')
    need(roots['radialSquared'] in radial_factors and 24 in radial_factors and
         op(24, 'rational') == ['2', '1'] and 24 in axial_factors and
         any(p.node(i)[0] == 'integer_power' and factor(i, roots['z'], 2)
             for i in axial_factors) and
         any(p.node(i)[0] == 'inverse' and
             factor(op(i, 'inverse')[0], roots['z0'], 2) for i in axial_factors) and
         any(p.node(i)[0] == 'inverse' and op(i, 'inverse') == [roots['tau0']]
             for i in time_factors) and roots['tau'] in time_factors and
         roots['qStar'] in tau_factors and
         any(p.node(i)[0] == 'rational' and op(i, 'rational') == ['1', '32']
             for i in tau_factors), 'original radial, axial, and time argument scales')
    zlog = p.terms(op(roots['z0'], 'exp')[0], 'multiply')
    need(roots['D'] in zlog and any(p.node(i)[0] == 'log_positive' and
         op(i, 'log_positive') == [roots['tau0']] for i in zlog), 'actual z0=tau0^D')

    qstar, emin = roots['qStar'], roots['ellMinimum']
    q_exponent = p.terms(op(qstar, 'exp')[0], 'multiply')
    need(qstar == 622791 and sorted(q_exponent) == [20, 127, 622788] and
         op(127, 'log_positive') == [24] and op(20, 'rational') == ['-1', '1'] and
         sum(F(*map(int, op(i, 'rational'))) for i in p.terms(622788, 'add') if i != emin) == 10 and
         p.terms(622788, 'add').count(emin) == 1, 'original outer qBig threshold')
    [ceil_arg] = op(emin, 'ceiling')
    need(617430 in op(ceil_arg, 'maximum') and 617429 in op(617430, 'maximum') and
         op(617429, 'integer_power') == [216823, 1024] and
         op(216823, 'source_parameter') == ['C12EnvelopeR'],
         'source ellMinimum contains Rstar^1024')
    need(pressure['radialEnvelopeComparison']['MAtMostOriginalEnvelope'] and
         pressure['actualOriginalQbig']['C12EnvelopeR'] == 216823 and
         whole['variables']['chart_equation'] == 'Q - sigma * Q^(2h) = rho' and
         whole['variables']['bounds'] == ['1/2 <= Q < 2', '|eta| < 3/4', 'q < qBig/16'] and
         whole['variables']['space_measure'] == 'z0 dx dy dzeta' and
         whole['variables']['time_measure'] == 'dt = -tau0 d rho, reversed time integration limits',
         'source-matched reference shell comparison and whole-K slab')

    axis = interval(F(-1), F(1))
    endpoint = outer.evaluate(axis, axis, axis, interval.point(1))
    need(endpoint['status'] == 'EXACT_ZERO' and len(endpoint['cutoff_jets']) == 13 and
         all(v['coefficient_interval'] == ['0', '0'] for v in endpoint['cutoff_jets'].values()) and
         endpoint['global_field']['velocity'] == [['0', '0']] * 3,
         'all 13 actual global cutoff jets zero on the starting time slice')
    plateau = [v.encoded() for v in cutoff_jets(F(0), F(1, 3), 80)]
    need(plateau == [['1', '1']] + [['0', '0']] * 3,
         'entire first gauge support is strictly in the unit radial plateau')
    return {'localizationRoots': roots, 'domain': '0<=r^2<=1/2, zeta^2<=1/2, 1/2<=rho<=1',
            'allSpatialSlicesArePhysicalFullCircles': True,
            'physicalMeasure': ['z0*r dr dtheta dzeta', 'dt=-tau0 d rho; reverse bounds'],
            'normalizedEnergyWeights': {'commonPhysicalFactor': 'z0*tau0^(-2A)',
                                        'transverseDissipation': 'nu*tau0',
                                        'axialDissipation': 'nu*tau0^(2h)'},
            'initialSlice': endpoint, 'strictCollarRadialJetControl': plateau}


def fixed_gauge(g, n, scope, delta):
    roots = delta['physicalChartRoots']
    need(roots == dict(zip(('A_x', 'A_y', 'A_z', 'b', 'pressure_increment'),
                           range(4458212, 4458221, 2), strict=True)), 'actual first physical gauge roots')
    need(g.args(RADIAL2, 'coordinate') == ['physical_cartesian_radius_squared'] and
         g.args(FIXED, 'add') == [622785, 24] and
         g.args(QREF, 'exp') == [4458193] and
         set(g.args(4458193, 'multiply')) == {4458192, FIXED} and
         set(g.args(4458192, 'multiply')) == {20, 127}, 'exact physical reference shell scaling')
    exact = Exact(g)
    need(g.args(622785, 'maximum') == [617433, 622784] and
         g.args(622784, 'multiply') == [20, 622783] and g.args(622783, 'ceiling') == [622782] and
         g.args(622782, 'multiply') == [20, 622781] and
         g.args(622781, 'multiply') == [617465, 617517] and g.args(617517, 'inverse') == [127] and
         g.args(617463, 'add') == [669, 617432] and q(g, 669) == 10 and
         g.args(617464, 'multiply') == [127, 617463] and 617464 in g.args(617465, 'maximum'),
         'actual L is max(ell0,floor(log b1/log 2)) and L>=ellMinimum+10')
    need(g.args(4458207, 'multiply') == [QREF, 3617] and
         g.args(4458210, 'multiply') == [4458209, 28826] and
         exact.of(4458209) == exact.mul(exact.scalar(4), exact.of(QREF)) and
         g.args(633710, 'sqrt_positive') == [3617] and
         g.args(633712, 'multiply') == [24, 633711] and g.args(633711, 'sqrt_positive') == [28826],
         'actual shell has r^2<=4*Qref*Xb=Qref*Rout^2')
    for j, (name, root) in enumerate(roots.items()):
        body = root - 1
        need(g.args(root, 'smooth_piecewise') == [RADIAL2, 4458207, 4458210, 0, body, 0],
             f'{name}: exact physical support and exterior zero')
        expected = [4458200, 4458204, 4458206, FIXED] + ([] if name == 'b' else [THETA])
        chart = n.expressions['FirstCorrectionPhysicalChart_' + name]
        need(g.args(body, 'm3_coupled_expression_partial') ==
             [chart['id'], expected, [0] * len(expected)], f'{name}: exact native physical substitution')
        test, lo, hi, left, inside, right = g.args(chart['body'], 'smooth_piecewise')
        need([test, lo, hi, left, right] == [R, 633710, 633712, 0, 0],
             f'{name}: exact lazy physical-chart shell guard')
        normalized = n.expressions['FirstCorrectionNormalized_' + name]
        actual = [R, Z, T, ELL, 4458178, 4458180] + ([] if name == 'b' else [THETA])
        need(g.args(inside, 'm3_coupled_expression_partial') ==
             [normalized['id'], actual, [0] * len(actual)],
             f'{name}: actual physical torus lift and unchanged angle argument')
    need(all(THETA not in scope.free(i) for i in
             (4458200, 4458204, 4458206, FIXED, 4458178, 4458180, 4458156, 4458218,
              4454155, 4455164, 4454009, 4455153)), 'axisymmetric slow, normalization, and mean contributions')
    need(exact.of(4458141) == exact.add(*(exact.of(i) for i in (4458138, 4454155, 4455164))) and
         exact.of(4458151) == exact.add(exact.of(4454009), exact.of(4455153)) and
         g.args(4458142, 'cosine') == g.args(4458143, 'sine') == [THETA],
         'actual mean meridional and direct swirl addition and polar frame')
    a_r, a_theta, a_z = [exact.of(i) for i in (4458137, 4458141, 4458139)]
    cosine, sine = [exact.of(i) for i in (4458142, 4458143)]
    rotation = (exact.sub(exact.mul(a_r, cosine), exact.mul(a_theta, sine)),
                exact.add(exact.mul(a_r, sine), exact.mul(a_theta, cosine)), a_z)
    for name, expect in zip(('A_x', 'A_y', 'A_z'), rotation, strict=True):
        need(exact.of(n.expressions['FirstCorrectionNormalized_' + name]['body']) ==
             exact.mul(exact.of(4458156), expect), f'actual Cartesian frame rotation {name}')
    return {'roots': roots, 'Qref': QREF, 'fixedReferenceLabel': FIXED,
            'radialSupportBound': 'r^2 <= Qref*Rout^2 < 1/6 < 1/4',
            'inequalities': ['Qref <= qBig/4', 'Rout <= Rstar=C12EnvelopeR',
                             'B=log(1/qBig)>Rstar^1024/2>=1/2+512*log(Rstar)',
                             'qBig*Rstar^2<exp(-1/2)<2/3'],
            'radialCutoffCurlCommutator': 'identically zero for the actual first correction on its admitted chart',
            'directSwirlAxisymmetric': True}


def winding(g, scope, cycle):
    phase_data = cycle['correctedFullCycle']['sourceWindingPhases']
    need(len(phase_data) == 10, 'the ten actual first-wave phase palette entries')
    for rate, theta_term, angle_rate in ((625982, 3622958, 625983),
                                         (629400, 3649454, 629401)):
        inner, lo, hi, left, fallback, right = g.args(rate, 'smooth_piecewise')
        [negative, rounded] = g.args(inner, 'multiply')
        [round_arg] = g.args(rounded, 'ceiling')
        neg_again, shifted = g.args(round_arg, 'multiply')
        half, seed = g.args(shifted, 'add')
        need(negative == neg_again == 20 and q(g, 20) == -1 and q(g, half) == F(1, 2) and
             left == right == inner and q(g, lo) == F(-1, 2) and q(g, hi) == F(1, 2) and
             g.args(fallback, 'smooth_piecewise') == [seed, 0, 0, 20, 1, 1] and
             THETA not in scope.free(rate), 'exact integer rounding and nonzero fallback')
        need(g.args(theta_term, 'multiply') == [THETA, angle_rate] and
             g.args(angle_rate, 'multiply') == [623110, rate] and
             g.args(623110, 'inverse') == [K] and THETA not in scope.free(K),
             'literal rate / wave number on the physical theta lift')
    def summands(root):
        op, args = g.node(root)
        if op != 'add':
            return [root]
        return [term for child in args for term in summands(child)]

    for phase, record in phase_data.items():
        need(record['waveNumber'] == K and record['windingRate'] in (625982, 629400) and
             record['thetaTerm'] == {625982: 3622958, 629400: 3649454}[record['windingRate']] and
             Counter(summands(int(phase))) == Counter([record['thetaTerm'], *(i for j in record['offsetSummands'] for i in summands(j))]) and
             all(THETA not in scope.free(i) for i in record['offsetSummands']),
             'literal theta-free phase offsets')
    return {int(key): value for key, value in phase_data.items()}


def gauge_terms(g, root, multiplier=F(1)):
    op, args = g.node(root)
    if op == 'add':
        for child in args:
            yield from gauge_terms(g, child, multiplier)
    if op == 'multiply':
        factors = []
        for child in args:
            if g.node(child)[0] == 'rational':
                multiplier *= q(g, child)
            else:
                factors.append(child)
        if len(factors) == 1:
            yield from gauge_terms(g, factors[0], multiplier)
        elif len(factors) == 2:
            trig = [i for i in factors if g.node(i)[0] in ('sine', 'cosine')]
            if len(trig) == 1:
                trig_root, = trig
                yield trig_root, next(i for i in factors if i != trig_root), multiplier


def check_wave(g, native, scope, phases):
    exact = Exact(g)
    result = []
    direction_counts = Counter()
    distinct_guard_atoms = set()
    definitions = native.expressions
    phase_terms = {(phase, m): exact.mul(exact.scalar(m), exact.of(K), exact.of(phase))
                   for phase in phases for m in (-2, -1, 1, 2)}
    for comp in range(3):
        field = native.fields[f'FirstCorrectionGauge_wave_{comp}']
        need(g.args(4458137 + comp, 'm3_coupled_indexed_partial') ==
             [field['id'], field['parameters'], [0] * 6] and
             field['parameters'] == [R, Z, T, ELL, Y1, Y2, THETA] and
             len(field['rows']) == 162, 'actual wave indexed field and 162 row applications')
        by_sign = Counter()
        for sign in (1, -1):
            name = f'FirstCorrectionGauge_{sign}_{comp}'
            own, reference = [definitions[name + tail] for tail in ('_own', '_reference')]
            params = own['parameters']
            need(params == reference['parameters'] and params[14] == THETA,
                 'literal theta formal in own and reference gauge')
            reference_scale, native_call = g.args(reference['body'], 'multiply')
            need(reference_scale == 4456996 and THETA not in scope.free(reference_scale),
                 'reference gauge amplitude scaling theta-free')
            own_id, actual, orders = g.args(native_call, 'm3_coupled_expression_partial')
            need(own_id == own['id'] and orders == [0] * len(params) and actual[14] == THETA and
                 all(THETA not in scope.free(i) for j, i in enumerate(actual) if j != 14),
                 'actual own-gauge argument list keeps only physical theta slot')
            for row in field['rows']:
                if row['label']['sign'] != sign:
                    continue
                by_sign[sign] += 1
                need(row['localSystem'] == reference['id'] and
                     row['localBody'] == reference['body'] and row['localParameters'] == params and
                     row['values'][14] == THETA and row['values'][15] == row['label']['fixedDifference'] and
                     row['derivativeMaps'] == [[{'coefficient': 1, 'parameter': j}]
                                               for j in (0, 1, 2, 8, 9, 14)],
                     'indexed physical theta, fixed label and derivative map stay unchanged')
                distinct_guard_atoms.update(row['values'][:14] + row['values'][15:] +
                                            [row['coefficient']] + [i for triple in row['guards'] for i in triple])
            for difference in range(5):
                body, guards = select_chart(g, own, difference)
                distinct_guard_atoms.update(i for triple in guards for i in triple)
                terms = list(gauge_terms(g, body))
                need(bool(terms), f'nonempty exact reconstruction {body}')
                rebuilt = exact.add(*(exact.mul(exact.scalar(s), exact.of(coef), exact.of(trig))
                                     for trig, coef, s in terms))
                need(rebuilt == exact.of(body), f'complete actual own-wave reconstruction {body}')
                known = set()
                for trig, coef, s in terms:
                    [angle] = g.node(trig)[1]
                    need(THETA not in scope.free(coef), 'every actual wave amplitude theta-free')
                    matches = [(phase, m) for (phase, m), p in phase_terms.items()
                               if p == exact.of(angle) and phases[phase]['windingRate'] ==
                               {1: 625982, -1: 629400}[sign]]
                    need(len(matches) == 1, f'one literal m*k*Phi in actual gauge term {angle}')
                    phase, m = matches[0]
                    known.add((phase, abs(m)))
                    direction_counts[abs(m)] += 1
                need(len({phase for phase, _ in known}) == 1 and {m for _, m in known} == {1, 2},
                     'per-row pair frequencies m=1 and m=2')
                result.append({'component': comp, 'sign': sign, 'difference': difference, 'body': body,
                               'termCount': len(terms), 'phase': next(iter(known))[0],
                               'mAbs': [1, 2]})
        need(by_sign == Counter({1: 81, -1: 81}), 'each actual sign has all 81 rows')
    need(all(THETA not in scope.free(i) for i in sorted(distinct_guard_atoms)),
         'all indexed and own-chart guard geometry and remaining parameters theta-free')
    return {'rowApplications': 486, 'ownCharts': result,
            'frequencyTermCountsByAbsM': dict(direction_counts),
            'checkedGuardAndActualArgumentRoots': len(distinct_guard_atoms),
            'physicalFrequency': 'n=m*omega_sign with omega_sign a nonzero integer'}


def verified_n1_slab_overlap(collars):
    attained = collars['strictCollars']['originalClosedZT']
    need(attained['Z'] == ['-1/8', '1/8'] and attained['T'] == ['15/16', '17/16'],
         'original attained N1 box from the strict-collar replay')
    t_lo, t_hi = map(F, attained['T'])
    rho_lo, rho_hi = F(1, 2), F(1)
    overlap = {}
    for j in (3, 4):
        scale = 2 ** (j - 3)
        left, right = max(rho_lo, t_lo / scale), min(rho_hi, t_hi / scale)
        need(left <= right, 'nonempty possible intersection')
        overlap[str(j)] = [str(left), str(right)]
    need(rho_hi / 2 < t_lo and 4 * rho_lo > t_hi and
         overlap == {'3': ['15/16', '1'], '4': ['1/2', '17/32']},
         'exact N1 and whole-K time intersections')
    return {'j': 'L-ellMinimum-10>=0 integer, fixed by the selected b1',
            'timeScale': 'T=rho*2^(j-3)', 'possibleRhoByJ': overlap,
            'allOtherJ': 'empty on the verified closed N1 box',
            'additionalZGuard': '|zeta|*(2^(j-3))^D<=1/8',
            'scope': 'this calculation describes coverage of the verified chart only'}


def main():
    parser = ArgumentParser()
    parser.add_argument('--joined', type=Path, default=NEXT / 'first-gauge/joined-first-correction-graph')
    parser.add_argument('--delta', type=Path, default=NEXT / 'first-gauge/first-gauge-native-delta.json')
    parser.add_argument('--cycle', type=Path, default=NEXT / 'corrected-flat/corrected-cycle-ledger.json')
    parser.add_argument('--pressure-norm', type=Path, default=NEXT / 'first-pressure-norm/first-pressure-norm.json')
    parser.add_argument('--n1-collars', type=Path, default=NEXT / 'n1-seam-collars/n1-seam-collars.json')
    parser.add_argument('--whole-k', type=Path, default=NEXT.parent / 'goal-20261111/m3/whole-k-chart.json')
    parser.add_argument('--localization-source', type=Path, default=NEXT / 'final67/source')
    parser.add_argument('--out', type=Path, default=Path(__file__).with_name('whole-k-angular.json'))
    args = parser.parse_args()
    sys.path.insert(0, str(args.localization_source / 'research-ide/mathscope-m3/recovery-20261019'))
    from outer_cutoff import ActualOuterCutoff, I, chi_jets

    outer = outer_and_scale(ActualOuterCutoff(args.localization_source), read(args.whole_k, 'wholeK'),
                            read(args.pressure_norm, 'pressureNorm'), I, chi_jets)
    manifest = read(args.joined / 'original-source-export-manifest.json')
    need((manifest['node_count'], manifest['node_stream_sha256'], manifest['definitions_sha256']) ==
         (4459637, GRAPH, REGISTRY), 'exact joined source checkpoint')
    with TemporaryFile('w+b') as backing:
        graph = Graph(args.joined / 'original-source-nodes.jsonl.gz', backing, manifest)
        native = Native(args.joined / 'original-source-functions.json', manifest)
        scope = Scope(graph, native.raw)
        gauge = fixed_gauge(graph, native, scope, read(args.delta, 'delta'))
        phases = winding(graph, scope, read(args.cycle, 'cycle'))
        wave = check_wave(graph, native, scope, phases)
    chart_overlap = verified_n1_slab_overlap(read(args.n1_collars, 'n1Collars'))
    data = {'schema': 'MathScope.M3.OriginalWholeKAngularReduction/1',
            'status': 'SOURCE_EXACT_PARTIAL_REDUCTION', 'graph': GRAPH, 'registry': REGISTRY,
            'receiptPins': PINS, 'outer': outer, 'firstGauge': gauge, 'wave': wave,
            'verifiedN1BoxWholeKOverlap': chart_overlap,
            'orthogonality': {
                'sphereOrPartialCircleUsed': False,
                'meanWaveCrossTerms': 'zero on full physical circles for actual first correction',
                'aliasRule': 'sum all active labels at each equal integer n before a norm or work product',
                'axialAndTimeFactorsRemain': True,
                'cartesianGradientFrameTerm': 'r^-1*(partial_theta U + J U)',
            },
            'open': {'wholeKFinalEnergy': None, 'wholeKFinalDissipation': None, 'wholeKFinalForceWork': None,
                     'wholeKDefect': None, 'spaceTimeRefinement': None, 'nuOne1013': None,
                     'firstGaugeScope': 'admitted original N1 chart only', 'N7-06': 'OPEN',
                     'finalJetsAdded': 0, 'release': 'HOLD'}}
    args.out.write_text(json.dumps(data, ensure_ascii=True, indent=2) + '\n', encoding='utf-8')
    print(f"PASS exact whole-K cutoff, 486 first-wave rows, 30 source own charts; N7-06 OPEN")
    print(f"receipt SHA256 {sha256(args.out.read_bytes()).hexdigest()}")


if __name__ == '__main__':
    main()
