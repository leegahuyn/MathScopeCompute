"""Retain the original normal and frozen images from the authenticated graph."""

from argparse import ArgumentParser
import gzip
from hashlib import sha256
import json
from pathlib import Path


WITNESS = 'a35bd111ef2f60b0e779a85433571db8caa00061616da91372782a28a16859e9'


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument('bundle', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    raw = (args.bundle / 'original-active-mode-two-witness.json').read_bytes()
    assert sha256(raw).hexdigest() == WITNESS
    witness = json.loads(raw)
    rows = witness['rows']
    # Original band, representative, actual frozen carrier, and small
    # intervals around the delayed frozen derivatives and Forced normals.
    ranges = [(0, 512), (17_727_050, 17_727_125), (17_732_720, 17_736_650),
              (17_766_490, 17_766_565), (17_788_265, 17_788_330)]
    ranges += [(row['path']['w'], row['path']['w'] + 100) for row in rows]
    ranges.sort()
    selected, digest, current = {}, sha256(), 0
    with gzip.open(args.bundle / 'original-source-nodes.jsonl.gz', 'rb') as stream:
        header = stream.readline()
        digest.update(header)
        assert json.loads(header)['node_count'] == witness['snapshot']['node_count']
        for i, line in enumerate(stream):
            digest.update(line)
            while current < len(ranges) and i > ranges[current][1]:
                current += 1
            if current < len(ranges) and ranges[current][0] <= i:
                selected[i] = json.loads(line)
    assert i + 1 == witness['snapshot']['node_count']
    assert digest.hexdigest() == witness['snapshot']['node_stream_sha256']
    result = {'schema': 'MathScope.N3ExactFrozenNormalSlots/1', 'sourceWitnessSHA256': WITNESS,
              'sourceGraphSHA256': digest.hexdigest(), 'nodes': selected,
              'representative': witness['nativeCover']['representativeRoots'],
              'rows': [{k: row[k] for k in ('key', 'system', 'normal', 'path', 'K', 'k', 'epsilon')} for row in rows]}
    with args.output.open('x', encoding='utf8', newline='\n') as out:
        out.write(json.dumps(result, separators=(',', ':')) + '\n')
    print(json.dumps({'retained': len(selected), 'SHA256': sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
