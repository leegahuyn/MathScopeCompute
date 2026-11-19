"""Replay the correction-only harmonics in the archived corrected full cycle."""

import argparse
from collections import defaultdict
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys


INITIALIZED_PROOF_SHA = '6c191231c6e41e1828d6ff7b98021a07cad9f175a36d45578058679f126d7c4d'
PARTS = ('real', 'imaginary')


def need(condition, description):
    if not condition:
        raise ValueError(description)


def proof_read(path, expected):
    data = path.read_bytes()
    need(sha256(data).hexdigest() == expected, f'digest of {path.name}')
    return json.loads(data)


class GraphView:
    """Make the original exact coefficient algebra use an already authenticated spool."""
    def __init__(self, stream, original_graph, original_factors):
        self.stream = stream
        self.children = original_graph.children
        self.original_factors = original_factors

    def record(self, index):
        return self.stream.record(index)

    def node(self, index):
        row = self.record(index)
        return row['op'], row['args']

    def args(self, i, op):
        return self.stream.args(i, op)

    op = args

    def factors(self, *terms):
        return self.original_factors(self, *terms)

    def rational(self, i):
        return self.stream.rational(i)

    def reach(self, roots):
        seen = set()
        pending = list(roots)
        while pending:
            root = pending.pop()
            if root not in seen:
                seen.add(root)
                pending.extend(self.children(*self.node(root)))
        return seen


def coefficients(graph, algebra, terms, phase, k, definitions, skip_initialized=False):
    from verify_initialized_wave import angle_sign

    output = defaultdict(dict)
    excluded = 0
    used = set()
    for kind, angle, root, scale in terms:
        mode = angle_sign(graph, angle, phase, k)
        need(mode in (1, -1, 2, -2), f'original phase and harmonic at {angle}')
        op, args = graph.node(root)
        if skip_initialized and op == 'm3_coupled_expression_partial' and definitions[args[0]]['name'].startswith('InitializedOriginalWave_'):
            excluded += 1
            need(abs(mode) == 1, 'old initialized wave may only be the fundamental')
            continue
        part = 'real' if kind == 'cosine' else 'imaginary'
        signed = scale if part == 'real' else -scale
        coeff = algebra.mul(algebra.scalar(signed), algebra.of(root))
        output[mode][part] = algebra.add(output[mode].get(part, algebra.zero), coeff)
        used.add(root)
    return output, excluded, used


def verify_harmonics(algebra, predicate, actual, expected, branch, mode, j):
    real, imag = (expected[part] for part in PARTS)
    for signed_mode, source in ((mode, (real, imag)), (-mode, (real, algebra.neg(imag)))):
        for part, target in zip(PARTS, source, strict=True):
            predicate(algebra, actual.get(signed_mode, {}).get(part, algebra.zero), target,
                      (branch, signed_mode, j, part))


def compare_waves(graph, full_registry, archive, initialized, cases,
                  signed_reader, exact_reader, flat):
    from verify_initialized_wave import guards, harmonic

    algebra = exact_reader.Exact(graph)
    recipe = flat.Recipes(graph, full_registry)
    definitions = {x['id']: x for x in recipe.names.values()}
    signed_modes = signed_reader.signed_modes(graph, archive['native'])
    need(json.loads(json.dumps(signed_modes)) == archive['known']['signedPositiveModes'],
         'original actual Signed curl replay')
    cases = {(x['key'], x['mode']): x for x in cases}
    need(len(cases) == 20, 'all original Forced chart/mode pairs')
    tried_omitting_half = False
    compare = flat.assert_rational_identity
    report = []
    for signed, old in zip(signed_modes, initialized['rows'], strict=True):
        key = signed['key']
        need(old['label'] == key, 'same original ten template ordering')
        delta, sign = map(int, key.split(':'))
        suffix = 0 if sign == 1 else 1
        phase, k = signed['phase'], signed['waveNumber']
        modal = {}
        all_roots = set()
        signed_coefficients = {}
        for j, old_j in enumerate(old['components']):
            need(old_j['component'] == j, 'source component ordering')
            roots = {}
            for tag, kind in (('forced', 'ActualForcedCurrent'), ('signed', 'GenericSigned162')):
                owner = recipe.names[f'{kind}_velocity_{j}_own_{suffix}']
                body, conditions = guards(graph, owner['body'], owner['parameters'][-1], delta)
                need([list(x) for x in conditions] == signed['fixedGuards'], 'same source local chart')
                roots[tag] = body
            need(roots['forced'] == old_j['forcedBody'], 'same previously checked initialized correction subtraction')
            values, removed, used = coefficients(graph, algebra, harmonic(graph, roots['forced']),
                                                  phase, k, definitions, skip_initialized=True)
            need(removed == old_j['initializedTerms'] == 4, 'correction-only Forced coefficients')
            all_roots.update(used)
            modal[j] = values
            items, _, _ = coefficients(graph, algebra, harmonic(graph, roots['signed']),
                                        phase, k, definitions)
            need(set(items) <= {-1, 1}, 'Signed only the actual fundamental')
            signed_coefficients[j] = items

        potential_systems = []
        for m in (1, 2):
            case = cases[key, m]
            need(case['phase'] == phase and case['waveNumber'] == k, 'same original Forced and Signed phase')
            expected, systems = flat.forced_curl(graph, algebra, recipe, case, list(all_roots))
            potential_systems.extend(systems)
            for j in range(3):
                verify_harmonics(algebra, compare, modal[j], {part: expected[part][j] for part in PARTS}, key, m, j)

        case = cases[key, 1]
        raw = case['raw']
        w_to_pulse = {raw['path']['w']: algebra.of(case['pulseValue'])}
        normals = [algebra.affine_at(algebra.of(i), w_to_pulse) for i in raw['normal']['value']]
        half = algebra.scalar(Fraction(1, 2))
        p = [algebra.of(z['imaginary']['root']) for z in signed['positiveNormalizedCylindricalPotential']]
        leading = [algebra.neg(algebra.mul(half, algebra.of(k), term)) for term in flat.cross(algebra, normals, p)]
        for j, row in enumerate(signed['actualVelocityCoefficients']):
            compare(algebra, algebra.of(row['real']), leading[j], (key, j, 'same actual moving normal for Signed'))
            # signed_modes reads the three actual original native derivative
            # applications, axial factor and cylindrical connection. Here
            # explicitly join that checked imaginary remainder and the
            # independently reconstructed leading term to both signed arms.
            verify_harmonics(algebra, compare, signed_coefficients[j],
                             {'real': leading[j], 'imaginary': algebra.of(row['imaginary'])}, key, 1, j)
            if not tried_omitting_half and leading[j]:
                doubled = algebra.mul(algebra.scalar(2), leading[j])
                try:
                    compare(algebra, algebra.of(row['real']), doubled, (key, j, 'omit Signed half control'))
                except AssertionError:
                    tried_omitting_half = True
                else:
                    raise ValueError('missing original Signed half factor not detected')
        report.append({'key': key, 'phase': phase, 'carrier': k, 'forcedPotentialSystems': potential_systems,
                       'forcedSignedArmIdentities': 24, 'signedArmIdentities': 12,
                       'signedSameNormalComponents': 3, 'initializedTermsRemoved': 12})
        exact_reader.Exact.of.cache_clear()
    need(len(report) == 10 and tried_omitting_half, 'all correction cases and half-factor control')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for field in ('goal', 'reader', 'prior-reader', 'wave-reader', 'full', 'first', 'initialized-proof', 'scratch', 'out'):
        parser.add_argument('--' + field, type=Path, required=True)
    args = parser.parse_args()
    assert __debug__
    goal = args.goal
    sys.path[:0] = [str(d) for d in (args.reader, args.prior_reader, args.wave_reader,
                                   goal/'corrected-flat', goal/'first-gauge', goal/'first-force-repair')]
    import bind_corrected_flat as flat
    import bind_first_cycle_gauge as signed_reader
    import verify_repaired_first_force as exact_reader
    from bind_initialized_metadata import ARCHIVE_GAUGE_SHA, ARCHIVE_MANIFEST_SHA
    from source_stream import SourceStream, STREAM, MANIFEST

    first_meta, first_registry = flat.verify_manifest(args.first, flat.FIRST_SCOPE, flat.REPAIR)
    full_meta, full_registry = flat.verify_manifest(args.full, flat.FULL_SCOPE, flat.FULL_COMMIT)
    proof_read(args.full / MANIFEST, ARCHIVE_MANIFEST_SHA)
    prefix = flat.compare_prefix(args.first, args.full, first_meta)
    registry = flat.same_registry_prefix(first_registry, full_registry)
    authored = flat.read(args.first / 'corrected-first-force.json')
    need(authored['snapshot'] == first_meta and authored['commit'] == flat.REPAIR, 'same first builder')
    original = proof_read(goal/'first-force-repair'/'independent-repaired-first-force.json', flat.FIRST_RECEIPT)
    need(original['snapshot'] == first_meta, 'same independently replayed Forced source')
    init = proof_read(args.initialized_proof, INITIALIZED_PROOF_SHA)
    need(init['sourceSHA256'] == full_meta['node_stream_sha256'], 'same checked initialized full graph')
    known = proof_read(goal/'first-gauge'/'corrected-gauge-replay.json', ARCHIVE_GAUGE_SHA)
    native = signed_reader.Native(args.full / 'original-source-functions.json', full_meta)
    archive = {'native': native, 'known': known}
    with SourceStream(args.full, full_meta, first_meta['node_count'], args.scratch) as stream:
        graph = GraphView(stream, exact_reader.Graph, flat.ReplayGraph.factors)
        cases = flat.signed_cases(graph, full_registry, original, authored)
        report = compare_waves(graph, full_registry, archive, init, cases, signed_reader, exact_reader, flat)
    summary = {'schema': 'MathScope.N7.ArchivedCorrectionOnlyHarmonicCurls/1', 'scope': 'ARCHIVED_N1',
               'prefix': prefix, 'exactNativeRegistryPrefixLengths': registry,
               'sourceSHA256': full_meta['node_stream_sha256'], 'sourceNodes': full_meta['node_count'],
               'cases': report, 'forcedArmIdentities': 240, 'signedArmIdentities': 120,
               'signedSameNormalComponents': 30, 'initializedTermsRemoved': 120,
               'negativeControl': 'missingSignedHalfDetected',
               'liveN3GaugeDifferences': 'OPEN', 'release': 'HOLD'}
    args.out.write_bytes((json.dumps(summary, indent=2) + '\n').encode())
    print('PASS 240 correction-only Forced and 120 Signed coefficient comparisons, 30 shared normal components', flush=True)


if __name__ == '__main__':
    main()
