"""Join the pinned first-correction graph delta without modifying the original export."""
from argparse import ArgumentParser
from collections import Counter
import gzip
from hashlib import sha256
import json
from pathlib import Path
from tempfile import TemporaryDirectory


def record(value):
    return (json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n').encode()


def read(path):
    return json.loads(path.read_bytes())


def load_registry(base, delta, manifest):
    payload = (base / 'original-source-functions.json').read_bytes()
    assert sha256(payload).hexdigest() == delta['baseRegistrySHA256'] == manifest['definitions_sha256']
    registry = json.loads(payload)
    original = json.loads(registry['definitions'])
    assert registry['counts'] == [len(group) for group in original] == delta['baseRegistryCounts']
    delta_registry = delta['nativeRegistryDelta']
    assert [len(group) for group in delta_registry][2:] == [0, 0, 0]
    for name, before, added in zip(('coupled-expression', 'coupled-field'), original, delta_registry):
        assert all(row['id'] == f'{name}:{len(before)+index}' for index, row in enumerate(added))
        assert all(row['sourceAuthenticated'] is False for row in added)
    joined = [before + added for before, added in zip(original, delta_registry, strict=True)]
    counts = [len(group) for group in joined]
    return record({**registry, 'definitions': record(joined).decode().rstrip('\n'), 'counts': counts}), counts


def join(base, delta, manifest, output):
    source_digest, target_digest = sha256(), sha256()
    base_count, suffix = delta['baseNodeCount'], delta['nodeDelta']
    target_count = base_count + len(suffix)
    header = {'schema': 'MathScope.M3.FullNodesJSONL/1', 'node_count': base_count}
    new_header = record({**header, 'node_count': target_count})
    bytes_out = len(new_header)
    histogram = Counter(manifest['operation_histogram'])
    with gzip.open(base / 'original-source-nodes.jsonl.gz', 'rb') as source, output.open('xb') as raw:
        with gzip.GzipFile(filename='', mode='wb', compresslevel=3, mtime=0, fileobj=raw) as target:
            old_header = next(source)
            assert json.loads(old_header) == header and manifest['node_count'] == base_count
            source_digest.update(old_header)
            target.write(new_header)
            target_digest.update(new_header)
            n = 0
            for line in source:
                source_digest.update(line)
                target_digest.update(line)
                target.write(line)
                bytes_out += len(line)
                n += 1
            assert n == base_count
            assert source_digest.hexdigest() == delta['baseGraphSHA256'] == manifest['node_stream_sha256']
            for row in suffix:
                line = record(row)
                target_digest.update(line)
                target.write(line)
                bytes_out += len(line)
                histogram[row['op']] += 1
    return {'node_count': target_count, 'operation_histogram': dict(sorted(histogram.items())),
            'node_stream_uncompressed_bytes': bytes_out, 'node_stream_sha256': target_digest.hexdigest()}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('base', 'delta', 'out'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    assert __debug__
    base = args.base.resolve()
    out = args.out.resolve()
    assert base != out
    source = read(base / 'original-source-export-manifest.json')
    raw_delta = args.delta.read_bytes()
    delta = json.loads(raw_delta)
    assert delta['schema'] == 'MathScope.M3.CorrectedFirstGaugeNativeDelta/1'
    assert not source['final_all_cycle_A_b_p'] and delta['scope']['finalJets'] == 0
    native, counts = load_registry(base, delta, source)
    if out.exists():
        raise FileExistsError(out)
    value_roots = delta['physicalChartRoots']
    jet_roots = delta['firstCorrectionRequestedJetExpressions']['interiorRoots']
    roots = [*value_roots.values(), *jet_roots.values()]
    assert len(roots) == 72 and len(set(roots)) == len(roots)
    with TemporaryDirectory(prefix='mathscope-first-gauge-', dir=out.parent) as work:
        staging = Path(work) / 'graph'
        staging.mkdir()
        node_stream = join(base, delta, source, staging / 'original-source-nodes.jsonl.gz')
        assert all(delta['baseNodeCount'] <= root < node_stream['node_count'] for root in roots)
        manifest = {
            **source, **node_stream,
            'scope': 'CORRECTED_FIRST_INCREMENT_A_B_PRESSURE_EXPLICIT_N1_AND_SYMBOLIC_JETS',
            'extended_coupled_function_counts': counts, 'original_root_ids': roots,
            'definitions_sha256': sha256(native).hexdigest(),
            'source_cycle_manifest': source, 'native_delta_sha256': sha256(raw_delta).hexdigest(),
            'first_correction_value_roots': value_roots, 'first_correction_interior_jet_roots': jet_roots,
            'final_all_cycle_A_b_p': False, 'actual_final_67_jets_certified': 0, 'release': 'HOLD',
        }
        (staging / 'original-source-functions.json').write_bytes(native)
        (staging / 'original-source-export-manifest.json').write_bytes(record(manifest))
        staging.rename(out)
    print(json.dumps({'originalBytePreservedPrefixNodes': delta['baseNodeCount'],
                      'joinedNodeCount': node_stream['node_count'], 'valueRoots': len(value_roots),
                      'symbolicInteriorJets': len(jet_roots), 'graphSHA256': node_stream['node_stream_sha256'],
                      'registrySHA256': manifest['definitions_sha256']}))


if __name__ == '__main__':
    main()
