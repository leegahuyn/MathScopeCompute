"""Replay the degree-two velocity support property on the exported raw modes 3 and 4."""

from argparse import ArgumentParser
from collections import Counter
from functools import cache
from hashlib import sha256
from pathlib import Path
import json
import sys
from tempfile import TemporaryFile


def mode_ideal(graph, algebra, defs, row, key, children, trusted_prefix=0):
    m = row['m']
    pairs = {3: (1, 2), 4: (2, 2)}
    roots = [z[part] for z in row['raw'] for part in ('real', 'imaginary')]
    assert row['terms'] == [] and row['subtraction'] == [{'real': 0, 'imaginary': 0}] * 3
    wave_prefix = 'PostFiveRepeatWave_'

    def reach(roots):
        pending, seen = list(roots), set()
        while pending:
            root = pending.pop()
            if root < trusted_prefix or root in seen:
                continue
            seen.add(root)
            op, operands = graph.node(root)
            pending.extend(children({'op': op, 'args': operands}))
            if op == 'm3_coupled_expression_partial':
                definition = defs[operands[0]]
                if not definition['name'].startswith(wave_prefix):
                    pending.append(definition['body'])
        return seen

    wave = {}
    for root in reach(roots):
        op, operands = graph.node(root)
        if op != 'm3_coupled_expression_partial':
            continue
        system, actual, order = operands
        definition = defs[system]
        name = definition['name']
        assert not name.startswith('PostFiveRepeatMean'), (key, m, 'mean operand', root)
        if not name.startswith(wave_prefix):
            continue
        prefix = wave_prefix + key + '_'
        assert name.startswith(prefix), (key, m, 'foreign wave label', name)
        degree, component, part = name.removeprefix(prefix).split('_')
        assert part in ('real', 'imaginary') and int(component) in range(3), (key, m, name)
        assert int(degree) in pairs[m] and actual == definition['parameters']
        assert sum(order) <= 1
        wave[root] = int(degree), sum(order)

    @cache
    def clean_coefficient(atom):
        if atom >= 0:
            return not (reach([atom]) & wave.keys())
        denominator, = (d for d, i in algebra.inverse_atoms.items() if i == atom)
        return all(clean_coefficient(i) for term, _ in denominator for i, _ in term)

    report = []
    for component, (raw, supported) in enumerate(zip(row['raw'], row['supported'], strict=True)):
        for part in ('real', 'imaginary'):
            root = raw[part]
            assert algebra.of(root) == algebra.of(supported[part])
            counts = Counter()
            for monomial in algebra.of(root):
                wave_atoms = []
                for atom, power in monomial:
                    if atom in wave:
                        assert power > 0, (key, m, 'wave denominator', atom)
                        wave_atoms.extend([wave[atom]] * power)
                    else:
                        assert clean_coefficient(atom), (key, m, 'hidden wave coefficient', atom)
                modes = tuple(sorted(wave_mode for wave_mode, _ in wave_atoms))
                order = sum(diff for _, diff in wave_atoms)
                assert modes == pairs[m] and order <= 1, (key, m, component, part, monomial, wave_atoms)
                counts[order] += 1
            report.append({'component': component, 'part': part, 'root': root,
                           'undifferentiatedMonomials': counts[0], 'firstDerivativeMonomials': counts[1]})
    assert any(z['firstDerivativeMonomials'] for z in report), (key, m, 'missing derivative evidence')
    return {'key': key, 'mode': m, 'degreePair': list(pairs[m]), 'nativeWaveAtoms': len(wave), 'components': report}


def main():
    parser = ArgumentParser(description=__doc__)
    for option in ('repo', 'candidate-dir', 'out'):
        parser.add_argument('--' + option, type=Path, required=True)
    parser.add_argument('--official-receipt', type=Path)
    parser.add_argument('--github-metadata', type=Path)
    parser.add_argument('--full-dir', type=Path)
    args = parser.parse_args()
    assert args.official_receipt and not (args.github_metadata or args.full_dir) or (
        not args.official_receipt and args.github_metadata and args.full_dir)
    branch = args.repo.resolve() / 'tools/mathscope-cd-axial-bridge-20261029/goal-next'
    sys.path[:0] = [str(branch / name) for name in ('first-force-repair', 'y')]
    from check_repeat_forced_candidates import CANDIDATE_FILE, CANDIDATE_SCOPE, Exact, Graph, STREAM
    from bind_corrected_flat import FULL_SCOPE, compare_prefix, verify_manifest
    from native_reference_scopes import actual_children

    if args.official_receipt:
        official = args.official_receipt.read_bytes()
        verified = json.loads(official)
        manifest, registry = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, verified['commit'])
        assert manifest['node_stream_sha256'] == verified['graphSHA256']
        assert manifest['definitions_sha256'] == verified['registrySHA256']
        matched_prefix = verified['matchedCorrectedFirstCyclePrefix']
        evidence = {'officialAuditSHA256': sha256(official).hexdigest()}
    else:
        gh = args.github_metadata.read_bytes()
        metadata = json.loads(gh)
        assert metadata['status'] == 'completed' and metadata['conclusion'] == 'success'
        full, _ = verify_manifest(args.full_dir, FULL_SCOPE)
        manifest, registry = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, metadata['headSha'])
        matched_prefix = compare_prefix(args.full_dir, args.candidate_dir, full)
        evidence = {'githubMetadataSHA256': sha256(gh).hexdigest()}
    candidate = json.loads((args.candidate_dir / CANDIDATE_FILE).read_bytes())
    assert candidate['snapshot'] == manifest and len(candidate['templates']) == 10
    prefix = matched_prefix['matchedNodes']
    definitions, *_ = json.loads(registry['definitions'])
    defs = {d['id']: d for d in definitions}
    results = []
    with TemporaryFile() as backing:
        graph = Graph(args.candidate_dir / STREAM, backing, manifest)
        algebra = Exact(graph)
        for template in candidate['templates']:
            for row in template['rows']:
                if row['m'] in (3, 4):
                    results.append(mode_ideal(graph, algebra, defs, row, template['key'], actual_children, prefix))
    assert len(results) == 20
    receipt = {'schema': 'MathScope.N6.RepeatHighModeVelocityIdeal/1',
               'authentication': evidence, 'firstCyclePrefix': matched_prefix,
               'graphSHA256': manifest['node_stream_sha256'],
               'registrySHA256': manifest['definitions_sha256'],
               'results': results, 'scope': 'Each raw mode 3/4 monomial is quadratic in own-label velocity jets of total order at most one.'}
    blob = (json.dumps(receipt, indent=2) + '\n').encode()
    args.out.write_bytes(blob)
    print(f'PASS {len(results)} raw high-mode rows and {6 * len(results)} component slots')
    print(f'{sha256(blob).hexdigest()}  {args.out.name}')


if __name__ == '__main__':
    main()
