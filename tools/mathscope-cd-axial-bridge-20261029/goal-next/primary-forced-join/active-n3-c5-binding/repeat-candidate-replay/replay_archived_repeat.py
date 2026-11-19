"""Replay the archived original repeat candidate from a checked base and suffix."""
import argparse
import gzip
import json
from hashlib import sha256
from pathlib import Path
from shutil import copyfile
from subprocess import run
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'spatial-readback'))
from source_stream import MANIFEST, NODE, REGISTRY, STREAM, SourceStream, need, read

DELTA = 'repeat-appended-nodes.jsonl.gz'
SEAL = 'repeat-append-seal.json'
HEADER_SCHEMA = 'MathScope.M3.FullNodesJSONL/1'
ARCHIVES = {
    'before': {
        'run': 43010593847,
        'manifest': 'c7adae44498f9705aa7cec4c3b99092c054bd23469701afebbd86470a3adcecc',
        'scope': 'CORRECTED_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT',
        'stream': 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf',
        'registry': '657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333',
    },
    'after': {
        'run': 43015175416,
        'manifest': '8ea8adbfeec6025371a6062afe50d0f28bacece88b0fe07d792739417ac87135',
        'scope': 'POST_FIVE_REPEAT_FORCED_CONDITIONAL_SOURCE',
        'stream': '9af34bc6497656e08aeb6f9cd298bfe5f69c049d2917002f9e5492fc0c2b7037',
        'registry': '5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920',
    },
}
ORIGINAL = 'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60'


def registry_prefix(before, after):
    need(before.keys() == after.keys(), 'registry keys changed')
    for field in ('base', 'maximumOrder', 'maximumTerms'):
        need(before[field] == after[field], f'registry scope changed at {field}')
    old, new = (json.loads(registry['definitions']) for registry in (before, after))
    need(len(old) == len(new) == 5, 'extended group count')
    need([len(group) for group in old] == before['counts'], 'base registry counts')
    need([len(group) for group in new] == after['counts'], 'extended registry counts')
    added = []
    for index, (left, right) in enumerate(zip(old, new)):
        need(left == right[:len(left)], f'original definition changed in group {index}')
        added.append(len(right) - len(left))
    return added


def archive(directory, role):
    expected = ARCHIVES[role]
    manifest, manifest_pin = read(directory / MANIFEST, expected['manifest'])
    need(manifest['scope'] == expected['scope'], f'{role} archive scope')
    need(manifest['original_pr30_commit'] == ORIGINAL, f'{role} original PR30 commit')
    need(manifest['node_stream_sha256'] == expected['stream'], f'{role} stream pin')
    need(manifest['definitions_sha256'] == expected['registry'], f'{role} registry pin')
    need(manifest['extended_coupled_registry_included'], f'{role} extended registry absent')
    registry, _ = read(directory / REGISTRY, expected['registry'])
    need(registry['counts'] == manifest['extended_coupled_function_counts'],
         f'{role} registry counts mismatch')
    return manifest, manifest_pin, registry


def header(count):
    return (json.dumps({'schema': HEADER_SCHEMA, 'node_count': count},
                       separators=(',', ':')) + '\n').encode()


def node_record(line, index):
    need(NODE.match(line) is not None and line.endswith(b']}\n'), f'node framing at {index}')
    return line


def pack(before, after, packet):
    old, old_pin, old_registry = archive(before, 'before')
    new, new_pin, new_registry = archive(after, 'after')
    added = registry_prefix(old_registry, new_registry)
    first = old['node_count']
    stop = new['node_count']
    need(0 < first < stop <= 35_000_000, 'source node bounds')

    packet.mkdir()
    prefix, suffix, full, old_full = (sha256() for _ in range(4))
    with (gzip.open(before / STREAM, 'rb') as left,
          gzip.open(after / STREAM, 'rb') as right,
          gzip.open(packet / DELTA, 'xb', compresslevel=3) as append):
        old_header, new_header = left.readline(), right.readline()
        need(old_header == header(first) and new_header == header(stop), 'exact stream headers')
        old_full.update(old_header)
        full.update(new_header)
        for index in range(first):
            row = node_record(left.readline(), index)
            need(row == right.readline(), f'original node changed at {index}')
            prefix.update(row)
            old_full.update(row)
            full.update(row)
        need(not left.read(1), 'unexpected base node')
        for index in range(first, stop):
            row = node_record(right.readline(), index)
            suffix.update(row)
            full.update(row)
            append.write(row)
        need(not right.read(1), 'unexpected final node')
    need(old_full.hexdigest() == old['node_stream_sha256'], 'base full digest')
    need(full.hexdigest() == new['node_stream_sha256'], 'archived final full digest')

    for name in (MANIFEST, REGISTRY):
        copyfile(after / name, packet / name)
    seal = {
        'schema': 'MathScope.N8.ArchivedOriginalRepeatAppendSeal/1',
        'originalPR30': ORIGINAL,
        'baseRun': ARCHIVES['before']['run'], 'fullRepeatRun': ARCHIVES['after']['run'],
        'baseManifestSHA256': old_pin, 'fullRepeatManifestSHA256': new_pin,
        'baseNodeCount': first, 'appendedNodeCount': stop - first, 'finalNodeCount': stop,
        'originalNodeRecordsSHA256': prefix.hexdigest(),
        'appendedNodeRecordsSHA256': suffix.hexdigest(),
        'appendedDefinitionsByGroup': added,
        'definitionCountsBefore': old_registry['counts'],
        'definitionCountsAfter': new_registry['counts'],
    }
    (packet / SEAL).write_bytes((json.dumps(seal, indent=2) + '\n').encode())
    return seal


def replay(before, packet, recovered):
    old, old_pin, old_registry = archive(before, 'before')
    new, new_pin, new_registry = archive(packet, 'after')
    seal, _ = read(packet / SEAL)
    need((old_pin, new_pin) == (seal['baseManifestSHA256'], seal['fullRepeatManifestSHA256']),
         'packet manifest hash mismatch')
    need(registry_prefix(old_registry, new_registry) == seal['appendedDefinitionsByGroup'],
         'packet definition counts')
    first, stop = old['node_count'], new['node_count']
    need((first, stop - first, stop) == (
        seal['baseNodeCount'], seal['appendedNodeCount'], seal['finalNodeCount']),
        'packet node counts')
    recovered.mkdir()
    prefix, suffix = sha256(), sha256()
    with (gzip.open(before / STREAM, 'rb') as source,
          gzip.open(packet / DELTA, 'rb') as append,
          gzip.open(recovered / STREAM, 'xb', compresslevel=3) as out):
        need(source.readline() == header(first), 'base stream header')
        out.write(header(stop))
        for index in range(first):
            row = node_record(source.readline(), index)
            prefix.update(row)
            out.write(row)
        need(not source.read(1), 'excess base nodes')
        for index in range(first, stop):
            row = node_record(append.readline(), index)
            suffix.update(row)
            out.write(row)
        need(not append.read(1), 'excess suffix nodes')
    need(prefix.hexdigest() == seal['originalNodeRecordsSHA256'], 'base node records changed')
    need(suffix.hexdigest() == seal['appendedNodeRecordsSHA256'], 'suffix node records changed')
    for name in (MANIFEST, REGISTRY):
        copyfile(packet / name, recovered / name)
    with SourceStream(recovered, new, first, recovered, remember=False) as stream:
        return stream.verify


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('before', 'after', 'scratch', 'output'):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    packet = args.scratch / 'append-packet'
    seal = pack(args.before, args.after, packet)
    recovered = args.scratch / 'recovered-original'
    verification = replay(args.before, packet, recovered)
    candidate_name = 'post-five-repeat-forced-candidate.json'
    copyfile(args.after / candidate_name, recovered / candidate_name)
    parent = Path(__file__).resolve().parent.parent
    verifier = parent / 'repeat-candidate-preflight' / 'verify_repeat_gauge_roots.py'
    gauge_proof = args.scratch / 'recovered-gauge.json'
    checked = run([sys.executable, str(verifier), str(parent.parents[1]), str(recovered),
                   str(gauge_proof)], check=True, capture_output=True, text=True)
    gauges = json.loads(checked.stdout)
    expected_gauges = verifier.with_name('stage2-potential-readback.json')
    need(gauge_proof.read_bytes() == expected_gauges.read_bytes(),
         'recovered typed gauge proof differs from the archived proof')
    result = {
        'schema': 'MathScope.N8.ArchivedOriginalRepeatAppendReplay/1',
        'status': 'VERIFIED_ARCHIVED_ORIGINAL_REPEAT_REPLAY',
        'archivePins': ARCHIVES, 'seal': seal, 'recoveredStream': verification,
        'compressedSuffixBytes': (packet / DELTA).stat().st_size,
        'independentTypedGaugeProof': gauges,
        'currentActiveN3Repeat': 'AWAITING_SAME_LIVE_SOURCE',
        'completeSecondCorrection': 'OPEN', 'N805': 'OPEN', 'finalJets': 0,
        'release': 'HOLD',
    }
    args.output.write_bytes((json.dumps(result, indent=2) + '\n').encode())
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
