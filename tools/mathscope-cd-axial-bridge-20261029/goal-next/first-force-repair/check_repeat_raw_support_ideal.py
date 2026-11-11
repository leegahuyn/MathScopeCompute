"""Independently set only typed own-label wave jets to zero in all 240 raw source slots."""

from argparse import ArgumentParser
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


PARTS = ('real', 'imaginary')


def verify_case(graph, template, defs, actual_children, prefix):
    key = template['key']
    support = template['rawSupport']
    systems = set(support['waveSystems'])
    wave_prefix = f'PostFiveRepeatWave_{key}_'
    expected = {f'{wave_prefix}{m}_{j}_{part}' for m in (1, 2) for j in range(4) for part in PARTS}
    assert len(systems) == 16 and {defs[d]['name'] for d in systems} == expected
    assert all(defs[d]['body'] < prefix for d in systems)
    assert support['wholeMeanCoefficientKept'] and support['sourcePressureWaveJetsKept']
    jet_orders = set()
    max_orders = {m: {q: 0 for q in ('velocity', 'pressure')} for m in range(1, 5)}
    active_mode = 0

    @cache
    def visits(root):
        if root < prefix:
            return root == 0, False
        op, args = graph.node(root)
        body = ()
        if op == 'm3_coupled_expression_partial':
            system, actual, orders = args
            definition = defs[system]
            if system in systems:
                assert actual == definition['parameters']
                jet_orders.add((system, tuple(orders), definition['body']))
                field = 'pressure' if definition['name'].split('_')[-2] == '3' else 'velocity'
                max_orders[active_mode][field] = max(max_orders[active_mode][field], sum(orders))
                return True, True
            assert not definition['name'].startswith('PostFiveRepeatWave_'), (key, root, definition['name'])
            body = (definition['body'],)
        descendants = [visits(i) for i in (*actual_children({'op': op, 'args': args}), *body)]
        uses_wave = any(contains for _, contains in descendants)
        if op == 'add':
            return all(zero for zero, _ in descendants), uses_wave
        if op == 'multiply':
            return any(zero for zero, _ in descendants), uses_wave
        if op == 'integer_power' and args[1] > 0:
            return descendants[0][0], uses_wave
        assert not uses_wave, (key, root, op, 'wave jet in nonpolynomial operand')
        return False, False

    checks = []
    for row in template['rows']:
        m = active_mode = row['m']
        visits.cache_clear()
        for j, z in enumerate(row['raw']):
            for part in PARTS:
                root = z[part]
                zero, wave = visits(root)
                assert zero and (wave or root == 0), (key, m, j, part, root)
                checks.append({'id': f'actual-forcing-wave-support-{m}-{j}-{part}', 'source': root, 'reduced': 0})
    assert checks == [{k: proof[k] for k in ('id', 'source', 'reduced')} for proof in support['checks']]
    recorded = {(r['system'], tuple(r['orders']), r['actualBody']) for r in support['waveJets']}
    assert recorded and recorded <= jet_orders
    assert all(orders['velocity'] <= (2 if m <= 2 else 1) and orders['pressure'] <= (1 if m <= 2 else 0)
               for m, orders in max_orders.items())
    return {'key': key, 'registeredWaveSystems': len(systems), 'recordedWaveJets': len(recorded),
            'independentlyReachedWaveJets': len(jet_orders), 'modeMaximumJetOrders': max_orders, 'checks': checks}


def main():
    parser = ArgumentParser(description=__doc__)
    for option in ('repo', 'candidate-dir', 'official-receipt', 'out'):
        parser.add_argument('--' + option, type=Path, required=True)
    args = parser.parse_args()
    branch = args.repo.resolve() / 'tools/mathscope-cd-axial-bridge-20261029/goal-next'
    sys.path[:0] = [str(branch / name) for name in ('first-force-repair', 'y')]
    from check_repeat_forced_candidates import CANDIDATE_FILE, CANDIDATE_SCOPE, Graph, STREAM
    from bind_corrected_flat import verify_manifest
    from native_reference_scopes import actual_children

    official = args.official_receipt.read_bytes()
    verified = json.loads(official)
    manifest, registry = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, verified['commit'])
    assert manifest['node_stream_sha256'] == verified['graphSHA256']
    assert manifest['definitions_sha256'] == verified['registrySHA256']
    candidate = json.loads((args.candidate_dir / CANDIDATE_FILE).read_bytes())
    assert candidate['snapshot'] == manifest
    definitions, *_ = json.loads(registry['definitions'])
    defs = {row['id']: row for row in definitions}
    prefix = verified['matchedCorrectedFirstCyclePrefix']['matchedNodes']
    with TemporaryFile() as backing:
        graph = Graph(args.candidate_dir / STREAM, backing, manifest)
        rows = [verify_case(graph, row, defs, actual_children, prefix) for row in candidate['templates']]
    assert len(rows) == 10 and sum(len(row['checks']) for row in rows) == 240
    receipt = {'schema': 'MathScope.N6.RepeatRawSourceSupportIdeal/1',
               'officialAuditSHA256': sha256(official).hexdigest(), 'graphSHA256': verified['graphSHA256'],
               'scope': 'Raw nonzero sources are in the formal own-label wave-jet ideal on the domain of the other operands.',
               'analyticGuardAndGlobalJoins': 'OPEN', 'rows': rows}
    raw = (json.dumps(receipt, indent=2) + '\n').encode()
    args.out.write_bytes(raw)
    print('PASS 240 independently zeroed source slots across all 40 candidates')
    print(f'{sha256(raw).hexdigest()}  {args.out.name}')


if __name__ == '__main__':
    main()
