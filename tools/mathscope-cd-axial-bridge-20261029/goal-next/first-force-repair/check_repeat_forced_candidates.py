"""Check the second native candidate graph against the repaired first cycle."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE.parent / name) for name in ('cycle', 'corrected-flat')]
from bind_corrected_flat import (FULL_SCOPE, STREAM,
                                compare_prefix, same_registry_prefix, verify_manifest)
from group_replayed_postfive import IndexedGraph
from verify_repaired_first_force import Exact, Graph as SourceGraph, PALETTE, PARTS, ZERO, git_blob, read

CANDIDATE_SCOPE = 'POST_FIVE_REPEAT_FORCED_CONDITIONAL_SOURCE'
CANDIDATE_FILE = 'post-five-repeat-forced-candidate.json'
MODULE = 'research-ide/mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs'
FAMILIES = [
    'first-forced-remaining-source',
    'first-forced-cutoff-derivative',
    'primary-cutoff-derivative',
    'signed-cutoff-derivative',
]


class Graph(IndexedGraph):
    children = staticmethod(SourceGraph.children)
    reach = SourceGraph.reach

    def args(self, root, op):
        tag, values = self.node(root)
        assert tag == op, (root, op, tag)
        return values


def index(rows, key):
    result = {key(row): row for row in rows}
    assert len(result) == len(rows)
    return result


def read_guards(graph, root, body, expected):
    if root == 0:
        assert body == 0
        return 0
    actual = []
    for _ in range(7):
        x, lo, hi, left, root, right = graph.args(root, 'smooth_piecewise')
        assert left == right == 0
        actual.append([x, lo, hi])
    assert sorted(actual[:4]) == sorted(expected[:4])
    assert actual[4:] == expected[4:]
    assert root == body, (root, body)
    return len(actual)


def verify_path_source(graph, row, candidate, previous, definitions):
    path = previous['path']
    replacement = dict(zip(path['Y'], path['Hw'], strict=True))
    result = []
    for j, pair in enumerate(candidate['pullback']):
        formal = {}
        for part in PARTS:
            entry = pair[part]
            body, shared, mapped = (entry[key] for key in ('body', 'shared', 'mapped'))
            assert body == row['guarded'][j][part]
            if shared == body:
                assert mapped == body
                assert graph.node(body)[0] == 'rational'
            else:
                system, values, orders = graph.args(shared, 'm3_coupled_expression_partial')
                definition = definitions[system]
                label = f"PostFiveRepeatPullback_{candidate['key']}_{row['m']}_{j}_{part}"
                assert definition['name'] == label
                assert definition['body'] == body and definition['parameters'] == values
                assert orders == [0] * len(values)
                if any(y in values for y in replacement):
                    target = [replacement.get(x, x) for x in values]
                    assert graph.args(mapped, 'm3_coupled_expression_partial') == [system, target, orders]
                else:
                    assert mapped == shared
            formal[part] = mapped
        result.append(formal)
    assert len(result) == 3
    return result


def verify_inverse(graph, algebra, candidate, previous, old_system, system, source):
    m = candidate['m']
    assert system['name'] == f"ActualPostFiveRepeatForced_{candidate['key']}_m{m}"
    for prop in ('variable', 'directions', 'left', 'length', 'initial'):
        assert system[prop] == old_system[prop], prop
    assert system['initial'] == [ZERO] * 3 and system['left'] == 0
    assert set(old_system['directions']) <= set(system['parameters'])
    assert system['variable'] not in system['parameters']
    n = [algebra.of(x) for x in previous['normal']['value']]
    n2 = algebra.dot(n, n)
    assert n2 == algebra.of(previous['normal']['squared'])
    d = algebra.mul(algebra.of(previous['epsilon']), algebra.pow(algebra.of(previous['k']), 2), n2)
    inv_n2 = algebra.inv(n2)
    sources = {part: [algebra.of(z[part]) for z in source] for part in PARTS}
    for i in range(3):
        for j in range(3):
            matrix = algebra.of(old_system['matrix'][i][j])
            if i == j:
                matrix = algebra.add(matrix, algebra.mul(algebra.scalar(1 - m*m), d))
            assert algebra.of(system['matrix'][i][j]) == matrix, (candidate['key'], m, i, j)
        for part in PARTS:
            f = sources[part]
            projected = algebra.add(algebra.neg(f[i]), algebra.mul(n[i], algebra.dot(n, f), inv_n2))
            assert algebra.of(system['forcing'][i][part]) == projected, (candidate['key'], m, i, part)
    for field in ('velocity', 'pressure'):
        positive = candidate['positive'][field]
        negative = candidate['negative'][field]
        if field == 'pressure':
            assert positive == candidate['mappedCutoff']['pressure']
            positive, negative = [positive], [negative]
        for p, n_ in zip(positive, negative, strict=True):
            assert algebra.of(p['real']) == algebra.of(n_['real'])
            assert algebra.of(p['imaginary']) == algebra.neg(algebra.of(n_['imaginary']))
    assert candidate['positive']['m'] == m and candidate['negative']['m'] == -m


def bind_registered_sources(graph, system, definitions, pullback):
    """Recover the exact retained-body facade used inside the native projection."""
    params = [system['variable'], *system['parameters']]
    reachable = {part: graph.reach([row[part] for row in system['forcing']]) for part in PARTS}
    wrapped = []
    for j, row in enumerate(pullback):
        inputs = {}
        for part in PARTS:
            body = row[part]
            if body == 0:
                inputs[part] = 0
                continue
            matches = []
            for root in reachable[part]:
                op, args = graph.node(root)
                if op != 'm3_coupled_expression_partial':
                    continue
                key, actual, orders = args
                definition = definitions[key]
                if definition['name'] == f'CoupledForced_source_{j}_{part}' and definition['body'] == body:
                    assert actual == definition['parameters'] == params
                    assert orders == [0] * len(params)
                    matches.append(root)
            [inputs[part]] = matches
        wrapped.append(inputs)
    return wrapped


def verify_case(graph, algebra, template, prior_rows, candidate_rows, expected_guards, defs, pulses):
    key = template['key']
    assert key == f"{template['difference']}:{template['sign']}"
    assert [row['m'] for row in template['rows']] == [1, 2, 3, 4]
    previous = prior_rows[key, 1]
    assert previous['path']['pulse'] == expected_guards[-1][0]
    evidence = []
    for row in template['rows']:
        m = row['m']
        candidate = candidate_rows[key, m]
        system = pulses[candidate['system']]
        if m < 3:
            old = prior_rows[key, m]
            required = FAMILIES[:2] if m == 2 else FAMILIES
            assert [term['family'] for term in row['terms']] == required
            assert row['terms'][0]['value'] == old['mappedCutoff']['remainingSource']
            assert row['terms'][1]['value'] == old['mappedCutoff']['derivativeSource']
            if m == 1:
                primary = [{part: next(x['primary'] for x in old['components']
                                      if (x['j'], x['part']) == (j, part)) for part in PARTS}
                           for j in range(3)]
                assert row['terms'][2]['value'] == primary
                for j, z in enumerate(row['terms'][3]['value']):
                    assert z['imaginary'] == 0
                    system_id, _, _ = graph.args(z['real'], 'm3_coupled_expression_partial')
                    assert defs[system_id]['name'] == f'PostFiveSignedPrincipalTail_{key}_{j}'
        else:
            assert row['terms'] == [] and row['subtraction'] == [ZERO] * 3
        assert all(len(row[name]) == 3 for name in ('raw', 'supported', 'subtraction', 'guarded'))
        guards = 0
        for j in range(3):
            for part in PARTS:
                vals = {k: row[k][j][part] for k in ('raw', 'supported', 'subtraction', 'guarded')}
                sub = algebra.add(*(algebra.of(t['value'][j][part]) for t in row['terms']))
                assert algebra.of(vals['subtraction']) == sub
                assert algebra.of(vals['raw']) == algebra.add(algebra.of(vals['supported']), sub)
                guards += read_guards(graph, vals['guarded'], vals['supported'], expected_guards)
        pullback = verify_path_source(graph, row, candidate, previous, defs)
        source = bind_registered_sources(graph, system, defs, pullback)
        verify_inverse(graph, algebra, candidate, previous, pulses[previous['system']], system, source)
        evidence.append({'key': key, 'mode': m, 'system': system['id'],
                         'rawRoots': row['raw'], 'guardedRoots': row['guarded'],
                         'pathPullbackRoots': pullback, 'formalSourceRoots': source, 'guardNodes': guards})
    return evidence


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ('repo', 'first-dir', 'full-dir', 'candidate-dir', 'github-metadata', 'out'):
        parser.add_argument('--' + key, required=True, type=Path)
    args = parser.parse_args()
    assert __debug__
    metadata = read(args.github_metadata)
    assert metadata['status'] == 'completed' and metadata['conclusion'] == 'success'
    full, full_defs = verify_manifest(args.full_dir, FULL_SCOPE)
    snapshot, registry = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, metadata['headSha'])
    candidate = read(args.candidate_dir / CANDIDATE_FILE)
    assert candidate['schema'] == 'MathScope.N6.PostFiveRepeatForcedCandidate/1'
    assert candidate['snapshot'] == snapshot and candidate['commit'] == metadata['headSha']
    assert candidate['precedingConservativeResidual'] == full['original_root_ids'][5:8]
    assert snapshot['original_root_ids'][:3] == candidate['precedingConservativeResidual']
    assert candidate['registeredPositiveSystems'] == 40
    assert candidate['scope']['completeSecondForcedState'] is False
    assert candidate['scope']['completeFlatRemainderVerified'] is False
    assert candidate['scope']['release'] == 'HOLD'
    prefix = compare_prefix(args.full_dir, args.candidate_dir, full)
    registry_prefix = same_registry_prefix(full_defs, registry)
    definitions, _, _, pulse_rows, _ = json.loads(registry['definitions'])
    defs = index(definitions, lambda row: row['id'])
    pulses = index(pulse_rows, lambda row: row['id'])
    prior = read(args.first_dir / 'corrected-first-force.json')
    prior_rows = index(prior['rows'], lambda row: (row['key'], row['m']))
    candidates = index(candidate['systems'], lambda row: (row['key'], row['m']))
    templates = index(candidate['templates'], lambda row: row['key'])
    expected = read(HERE.parent / 'corrected-flat/seven-guards-receipt.json')
    guard_cases = index(expected['sourceCases'], lambda row: row['key'])
    assert templates.keys() == guard_cases.keys() == PALETTE
    assert candidates.keys() == {(key, m) for key in PALETTE for m in range(1, 5)}
    assert {row['system'] for row in candidates.values()} == set(pulses) - {
        row['id'] for row in json.loads(full_defs['definitions'])[3]
    }
    with TemporaryFile() as backing:
        graph = Graph(args.candidate_dir / STREAM, backing, snapshot)
        algebra = Exact(graph)
        evidence = []
        for key, template in sorted(templates.items()):
            evidence.extend(verify_case(graph, algebra, template, prior_rows, candidates,
                                        guard_cases[key]['sourceGuards'], defs, pulses))
    receipt = {
        'schema': 'MathScope.M3.IndependentSecondNativeCandidateAudit/1',
        'run': metadata['databaseId'], 'commit': candidate['commit'],
        'candidateSourceSHA256': sha256(git_blob(args.repo, candidate['commit'], MODULE)).hexdigest(),
        'graphSHA256': snapshot['node_stream_sha256'], 'graphNodes': snapshot['node_count'],
        'registrySHA256': snapshot['definitions_sha256'],
        'matchedCorrectedFirstCyclePrefix': prefix, 'matchedNativeDefinitionPrefix': registry_prefix,
        'systems': evidence, 'checkedRealAndImaginaryCoefficients': 6 * len(evidence),
        'globalConservativeProjectionEquality': 'OPEN', 'uniformDerivativeAndSupportClass': 'OPEN',
        'completeSecondForcedState': False, 'finalJets': 0, 'release': 'HOLD',
    }
    args.out.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f"Verified {len(evidence)} original-operator candidates and {6 * len(evidence)} source components")


if __name__ == '__main__':
    main()
