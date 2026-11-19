"""Read original repeat-Forced mapped potential roots from the candidate archive."""

from argparse import ArgumentParser
from collections import defaultdict
from functools import lru_cache
import gzip
from hashlib import sha256
import json
from pathlib import Path
import re
import sys


REPEAT_NAME = re.compile(
    r'ActualPostFiveRepeatCurl_([0-4]:(?:-1|1))_m([1-4])_(real|imaginary)_([0-2])\Z')
ARCHIVE_PREFIX = 4_456_994
SOURCE_CREATION = (
    'source-mapped-forced-curl.mjs registers the raw real and imaginary cross-product bodies'
    ' through G.share. Its physical complex potential is (-raw.imaginary, raw.real).'
)


def main():
    assert __debug__
    p = ArgumentParser(description=__doc__)
    p.add_argument('goal_next', type=Path)
    p.add_argument('artifact', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    assert not args.output.exists()
    sys.path.insert(0, str(args.goal_next /
                          'primary-forced-join/active-n3-c5-binding/spatial-readback'))
    from source_stream import MANIFEST, STREAM, Native, SourceStream, read

    manifest, _ = read(args.artifact / MANIFEST,
                       '8ea8adbfeec6025371a6062afe50d0f28bacece88b0fe07d792739417ac87135')
    candidate, candidate_pin = read(args.artifact / 'post-five-repeat-forced-candidate.json',
                                   '43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf')
    assert candidate['snapshot'] == manifest and candidate['registeredPositiveSystems'] == 40
    native = Native(args.artifact, manifest)
    definitions, by_key = {}, defaultdict(dict)
    for definition in native.expressions:
        match = REPEAT_NAME.fullmatch(definition['name'])
        if match:
            group = (match[1], int(match[2]))
            key = (match[3], int(match[4]))
            assert key not in by_key[group]
            assert ARCHIVE_PREFIX <= definition['body'] < manifest['node_count']
            definitions[definition['id']] = definition
            by_key[group][key] = definition['id']
    assert len(definitions) == 240 and len(by_key) == 40
    assert set(by_key) == {(row['key'], row['m']) for row in candidate['systems']}

    apps = defaultdict(list)
    with SourceStream(args.artifact, manifest, ARCHIVE_PREFIX, args.output.parent) as graph:
        with gzip.open(args.artifact / STREAM, 'rb') as source:
            source.readline()
            coupled = b'{"op":"m3_coupled_expression_partial","args":['
            for index, line in enumerate(source):
                if index < ARCHIVE_PREFIX or not line.startswith(coupled):
                    continue
                function, actual, orders = json.loads(line)['args']
                if function in definitions and not any(orders):
                    definition = definitions[function]
                    if actual == definition['parameters']:
                        apps[function].append(index)
        assert all(len(apps[key]) == 1 for key in definitions)

        @lru_cache(maxsize=65_536)
        def reach(index):
            if index < ARCHIVE_PREFIX:
                return frozenset()
            op_data = graph.record(index)
            op, arguments = op_data['op'], op_data['args']
            if op == 'm3_coupled_expression_partial':
                if arguments[0] in definitions:
                    definition = definitions[arguments[0]]
                    assert arguments[1] == definition['parameters']
                    return frozenset({arguments[0]})
                return frozenset()
            if op in ('add', 'multiply', 'inverse'):
                return frozenset().union(*(reach(child) for child in arguments))
            if op == 'integer_power':
                return reach(arguments[0])
            return frozenset()

        def dependencies(velocity):
            return frozenset().union(*(reach(root) for part in velocity for root in part.values()))

        assembled = []
        for row in candidate['systems']:
            group = row['key'], row['m']
            expected = set(by_key[group].values())
            actual = dependencies(row['positive']['velocity'])
            assert actual == expected, (group, actual, expected)
            assert not any(reach(root) for root in row['positive']['pressure'].values())
            body_refs = []
            for component in range(3):
                parts = {}
                for part, multiplier in (('imaginary', -1), ('real', 1)):
                    id = by_key[group][part, component]
                    root, = apps[id]
                    definition, actuals, orders = native.application(graph, root)
                    assert not any(orders) and actuals == definition['parameters']
                    assert definition['id'] == id
                    parts['physicalReal' if part == 'imaginary' else 'physicalImaginary'] = {
                        'root': root, 'multiplier': multiplier, 'body': definition['body'],
                        'system': id, 'exactArguments': actuals,
                    }
                body_refs.append(parts)
            assembled.append({'template': group[0], 'mode': group[1],
                              'complexPotential': body_refs,
                              'allSixDistinctSystemsReachedFromReturnedCurl': True,
                              'pressureIndependentOfMappedPotentialCapsules': True})
        # A borrowed gauge from another harmonic has six typed systems but
        # cannot be substituted for the genuine first candidate's gauge.
        first = candidate['systems'][0]
        wrong = candidate['systems'][1]
        assert first['key'] == wrong['key'] and first['m'] != wrong['m']
        assert dependencies(wrong['positive']['velocity']) != {
            x for x in by_key[first['key'], first['m']].values()
        }
        stream = graph.verify

    result = {
        'schema': 'MathScope.N8.RepeatMappedGaugeReadback/1',
        'status': 'VERIFIED_ARCHIVED_TYPED_MAPPED_POTENTIAL_ROOTS_FROM_UNMODIFIED_REPEAT_CONSTRUCTOR',
        'candidateSHA256': candidate_pin, 'sourceStream': stream,
        'complexConvention': SOURCE_CREATION, 'candidateCount': len(assembled),
        'zeroOrderSharedPotentialRootCount': len(definitions),
        'eightWaveGaugeUsesAreStillArchivedN1Only': True,
        'borrowedHarmonicNegativeControl': True, 'candidateRoots': assembled,
        'liveOriginalN3GaugeOwnerRestorableFromArchive': False,
        'completeSecondCorrection': 'OPEN', 'finalJets': 0, 'release': 'HOLD',
    }
    raw = (json.dumps(result, indent=2) + '\n').encode()
    args.output.write_bytes(raw)
    print(json.dumps({'nodes': stream['nodes'], 'candidateCount': len(assembled),
                      'zeroOrderRoots': len(definitions), 'sha256': sha256(raw).hexdigest()}))


if __name__ == '__main__':
    main()
