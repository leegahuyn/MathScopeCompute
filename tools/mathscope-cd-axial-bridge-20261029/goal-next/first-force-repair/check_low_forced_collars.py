"""Bind the live low-mode cutoff subtractions to the full first-source collar ideal."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

GUARDS_SHA = '722f8227d71d18041b62449d10e957ce237625ab791c50b84d2ebedb754273d1'
FIRST_GRAPH_SHA = '1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3'
PSI, CHI, SLOW = 623055, 623043, 625300
XI, V = 623035, 622805
REP = {622807: 623950, 622808: 623955, 622809: 623935}
PARTS = ('real', 'imaginary')


def multiplicative_ideal(graph, root, generators):
    @cache
    def vanishes(node):
        if node == 0 or node in generators:
            return True
        op, args = graph.node(node)
        if op == 'add':
            return all(vanishes(arg) for arg in args)
        if op == 'multiply':
            return any(vanishes(arg) for arg in args)
        if op == 'integer_power' and args[1] > 0:
            return vanishes(args[0])
        return False
    return vanishes(root)


def primary_envelopes(graph, lift, definitions, base, case, cut):
    key = case['key']
    difference, sign = key.split(':')
    xi, pulse = (g[0] for g in case['sourceGuards'][-2:])
    suffix = f'{difference}_{sign}_'
    potential = {i: r for i, r in enumerate(base) if r['name'].startswith(f'GlobalOriginalPotential_{sign}_')}
    assert len(potential) == 3
    for r in potential.values():
        assert all(multiplicative_ideal(graph, r['body'], {factor}) for factor in (PSI, CHI, SLOW))
    own_velocity = [r for r in definitions if r['name'].startswith('InitializedOriginalWave_' + suffix)]
    [pressure] = [r for r in definitions if r['name'].startswith('InitializedOriginalPrimaryPressure_' + suffix)]
    tails = [r for r in definitions if r['name'].startswith('OriginalPrimaryPrincipalFlat_' + suffix)]
    assert len(own_velocity) == 6 and len(tails) == 3
    velocity = []
    for r in own_velocity:
        calls = {}
        for root in graph.reach([r['body']]):
            op, args = graph.node(root)
            if op != 'actual_expression_partial' or args[0] not in potential:
                continue
            system, actual, orders = args
            substitution = REP | {XI: xi, V: pulse}
            assert actual == [substitution.get(p, p) for p in potential[system]['parameters']]
            assert sum(orders) <= 1
            calls[root] = {'potential': system, 'orders': orders}
        assert calls and multiplicative_ideal(graph, r['body'], calls)
        velocity.append({'definition': r['id'], 'body': r['body'], 'potentialCalls': calls})
    chi_expected = lift.form(CHI, ((XI, xi),))
    chi_candidates = []
    for root in graph.reach([pressure['body']]):
        op, args = graph.node(root)
        if op == 'smooth_piecewise' and args[3] == 1 and args[-1] == 0 and lift.form(root) == chi_expected:
            chi_candidates.append(root)
    [mapped_chi] = chi_candidates
    assert all(multiplicative_ideal(graph, pressure['body'], {factor}) for factor in (cut['psi'], mapped_chi, SLOW))
    for tail in tails:
        assert all(multiplicative_ideal(graph, tail['body'], {factor}) for factor in (cut['dpsi'], mapped_chi, SLOW))
    return {'key': key, 'ownXi': xi, 'ownPulse': pulse, 'mappedTransverseCutoff': mapped_chi,
            'primaryVelocity': velocity, 'primaryPressure': pressure['body'],
            'primaryTailBodies': [r['body'] for r in tails],
            'potentialBodies': [r['body'] for r in potential.values()]}


def cutoff_intervals():
    boundaries = (Q(0), Q(1, 5), Q(1, 4), Q(3, 4), Q(4, 5), Q(1))

    def step(x):
        if x <= 0:
            return 'zero'
        if x >= 1:
            return 'one'
        return 'transition'

    intervals = []
    for left, right in zip(boundaries, boundaries[1:]):
        mid = (left + right) / 2
        a, b = step(20 * mid - 4), step(16 - 20 * mid)
        intervals.append({'left': str(left), 'right': str(right), 'arguments': [a, b],
                          'psi': 'zero' if 'zero' in (a, b) else 'one' if a == b == 'one' else 'transition'})
    assert [i['psi'] for i in intervals] == ['zero', 'transition', 'one', 'transition', 'zero']
    return intervals


def check_live_row(graph, exact, bind_path, cutoff, registry, pulse_systems, previous, next_row, xi):
    key, m = previous['key'], previous['m']
    assert next_row['m'] == m
    terms = next_row['terms']
    assert [t['family'] for t in terms[:2]] == ['first-forced-remaining-source', 'first-forced-cutoff-derivative']
    cut = previous['mappedCutoff']
    assert terms[0]['value'] == cut['remainingSource'] and terms[1]['value'] == cut['derivativeSource']
    system = pulse_systems[previous['system']]
    assert system['left'] == 0 and system['initial'] == [{'real': 0, 'imaginary': 0}] * 3
    assert system['forcing'] == previous['projectedSource']
    substitutions = bind_path(graph, exact, previous['path'], system, key)
    xi_formula = exact.of(xi)
    exact.verify_affine_atoms(xi_formula, list(substitutions))
    mapped_xi = exact.affine_at(xi_formula, {y: exact.of(h) for y, h in substitutions.items()})
    xi_error = exact.clear_compound_denominators(exact.sub(mapped_xi, xi_formula))
    assert not exact.reduce_sqrt_two(xi_error, 3622)
    formal = [{part: 0 for part in PARTS} for _ in range(3)]
    supports = []
    for part in previous['components']:
        j, kind = part['j'], part['part']
        formal[j][kind] = part['formalPathSource']
        pulled, actual = registry.expression(graph, part['mapped'])
        assert pulled['name'] == f'ActualWholeNonzeroSource_{key}_{m}_{j}_{kind}'
        assert pulled['body'] == part['supported']
        assert actual == [substitutions.get(p, p) for p in pulled['parameters']]
        wrapped, args = registry.expression(graph, part['formalPathSource'])
        assert wrapped['name'] == f'CoupledForced_source_{j}_{kind}' and wrapped['body'] == part['mapped']
        assert args == wrapped['parameters'] == [system['variable'], *system['parameters']]
        assert exact.of(part['raw']) == exact.add(exact.of(part['supported']), exact.of(part['primary']))
        supports.append({'j': j, 'part': kind, 'raw': part['raw'], 'supported': part['supported'],
                         'primary': part['primary'], 'registeredSource': wrapped['id']})
    normal = [exact.of(n) for n in previous['normal']['value']]
    n2 = exact.dot(normal, normal)
    assert n2 == exact.of(previous['normal']['squared'])
    for part in PARTS:
        source = [exact.of(z[part]) for z in formal]
        normal_source = exact.mul(exact.dot(normal, source), exact.inv(n2))
        for j, entry in enumerate(system['forcing']):
            projected = exact.sub(exact.mul(normal[j], normal_source), source[j])
            assert exact.of(entry[part]) == projected
    cutoff(graph, exact, registry, previous, system, formal)
    assert exact.mul(exact.of(previous['length']), exact.of(previous['path']['ci'])) == exact.scalar(Q(1, 2**33))
    return {'key': key, 'mode': m, 'originalFirstSystem': system['id'], 'pulse': previous['path']['pulse'],
            'pathPreservedOwnXi': xi, 'checkedZeroInitialDataAndProjection': True,
            'psi': cut['psi'], 'dpsi': cut['dpsi'], 'remaining': terms[0]['value'],
            'derivative': terms[1]['value'], 'actualSourceRoots': supports}


def main():
    parser = ArgumentParser(description=__doc__)
    for arg in ('repo', 'first-dir', 'candidate-dir', 'official-receipt', 'seven-guards', 'out'):
        parser.add_argument('--' + arg, type=Path, required=True)
    args = parser.parse_args()
    branch = args.repo.resolve() / 'tools/mathscope-cd-axial-bridge-20261029/goal-next/first-force-repair'
    sys.path.insert(0, str(branch))
    from check_repeat_forced_candidates import CANDIDATE_FILE, CANDIDATE_SCOPE, Exact, Graph, STREAM
    from bind_corrected_flat import FIRST_SCOPE, REGISTRY, compare_prefix, same_registry_prefix, verify_manifest
    from bind_primary_amplitude import FixedLift
    from check_seven_guards import support_ideal
    from verify_repaired_first_force import Registry, bind_path, bind_raw_harmonics, cutoff

    official = args.official_receipt.read_bytes()
    verified = json.loads(official)
    prior = json.loads((args.first_dir / 'corrected-first-force.json').read_bytes())
    first, first_reg = verify_manifest(args.first_dir, FIRST_SCOPE, prior['commit'])
    assert prior['snapshot'] == first and first['node_stream_sha256'] == FIRST_GRAPH_SHA
    final, final_reg = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, verified['commit'])
    assert final['node_stream_sha256'] == verified['graphSHA256'] and final['definitions_sha256'] == verified['registrySHA256']
    next_ = json.loads((args.candidate_dir / CANDIDATE_FILE).read_bytes())
    assert next_['snapshot'] == final
    matched = compare_prefix(args.first_dir, args.candidate_dir, first)
    registry_prefix = same_registry_prefix(first_reg, final_reg)
    guard_blob = args.seven_guards.read_bytes()
    assert sha256(guard_blob).hexdigest() == GUARDS_SHA
    guards = json.loads(guard_blob)
    assert guards['graphSHA256'] == FIRST_GRAPH_SHA
    by_case = {row['key']: row for row in guards['sourceCases']}
    old = {(r['key'], r['m']): r for r in prior['rows']}
    definitions, _, _, pulse_systems, _ = json.loads(first_reg['definitions'])
    base = json.loads(first_reg['base']['base']['expression'])
    registry = Registry(args.first_dir / REGISTRY, first)
    rows, primary, raw_harmonics = [], [], []
    with TemporaryFile() as backing:
        graph = Graph(args.candidate_dir / STREAM, backing, final)
        exact = Exact(graph)
        lift = FixedLift(graph)
        ideal, max_orders, controls = support_ideal(graph, definitions, prior)
        for case in next_['templates']:
            key = case['key']
            envelope = primary_envelopes(graph, lift, definitions, base, by_case[key], old[key, 1]['mappedCutoff'])
            primary.append(envelope)
            raw_harmonics.append({'key': key, 'originalFofG0':
                                  bind_raw_harmonics(graph, exact, registry, [old[key, 1], old[key, 2]])})
            for row in case['rows'][:2]:
                rows.append(check_live_row(graph, exact, bind_path, cutoff, registry, pulse_systems,
                                           old[key, row['m']], row, envelope['ownXi']))
    assert len(rows) == 20 and len(primary) == 10
    receipt = {'schema': 'MathScope.N6.LowForcedCollarBinding/1', 'candidateGraphSHA256': final['node_stream_sha256'],
               'firstPrefix': matched, 'firstNativeRegistryCounts': registry_prefix,
               'officialAuditSHA256': sha256(official).hexdigest(), 'sevenGuardsSHA256': GUARDS_SHA,
               'liveLowModeSubtractions': rows, 'primaryEnvelopeProofs': primary,
               'originalFofG0RawHarmonics': raw_harmonics,
               'firstSourceIdeal': ideal, 'firstSourceMaximumPrimaryJetOrders': max_orders,
               'firstSourceIdealNegativeControls': controls, 'exactPulsePartition': cutoff_intervals(),
               'conditional': ['Ordinary zero extension at the slow and shell seams needs the source-bound cofactor regularity and bounds.',
                               'For a zero-data parameter jet of the state to vanish, the corresponding forcing jets vanish along the complete pulse.'],
               'uniformAllOrderClosure': 'OPEN'}
    raw = (json.dumps(receipt, indent=2) + '\n').encode()
    args.out.write_bytes(raw)
    print('PASS 20 low-mode cases, 240 live subtraction slots and 100 primary envelope definitions')
    print(f'{sha256(raw).hexdigest()}  {args.out.name}')


if __name__ == '__main__':
    main()
