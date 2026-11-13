"""Authenticate the original graph stream and retain annular and frame operands."""

import argparse
import gzip
from hashlib import sha256
import json
from pathlib import Path


WITNESS = 'a35bd111ef2f60b0e779a85433571db8caa00061616da91372782a28a16859e9'
REGISTRY = '364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111'


def read(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected
    return json.loads(raw)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('bundle', type=Path)
    parser.add_argument('out', type=Path)
    args = parser.parse_args()
    witness = read(args.bundle / 'original-active-mode-two-witness.json', WITNESS)
    reg = read(args.bundle / 'original-source-functions.json', REGISTRY)
    root = reg['base']['base']
    homogeneous = json.loads(root['m3GlobalPulses'])
    forced = json.loads(reg['definitions'])[3]
    selected_forced = [forced[row['system']] for row in witness['rows']]
    ranges = [(0, 500), (3595, 3625), (14220470, 14220499), (17732735, 17733815),
              (17735900, 17736610), (21385642, 21385658), (21385780, 21385795)]
    for row in witness['rows']:
        w = row['path']['w']
        ranges.append((w, w + 350))
    for row in selected_forced:
        for i, line in enumerate(row['matrix']):
            diag = line[i]
            ranges.append((diag - 12, diag + 1))
    graph = witness['snapshot']
    digest = sha256()
    selected = {}
    ranges.sort()
    with gzip.open(args.bundle / 'original-source-nodes.jsonl.gz', 'rb') as stream:
        header = stream.readline()
        digest.update(header)
        assert json.loads(header)['node_count'] == graph['node_count']
        cursor = 0
        for i, line in enumerate(stream):
            digest.update(line)
            while cursor < len(ranges) and i > ranges[cursor][1]:
                cursor += 1
            if cursor < len(ranges) and ranges[cursor][0] <= i:
                selected[i] = json.loads(line)
    assert i + 1 == graph['node_count'] and digest.hexdigest() == graph['node_stream_sha256']
    result = {'schema': 'MathScope.N3ExactAnnularFrameSlots/1', 'witnessSHA256': WITNESS, 'registrySHA256': REGISTRY,
              'graphSHA256': digest.hexdigest(), 'nodes': selected, 'homogeneous': homogeneous, 'forced': selected_forced,
              'rowInputs': [{k: row[k] for k in ('key', 'system', 'normal', 'K', 'k', 'epsilon', 'length', 'path', 'lift')} for row in witness['rows']],
              'representative': witness['nativeCover']['representativeRoots']}
    with args.out.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(result, separators=(',', ':')) + '\n')
    print(json.dumps({'nodesRetained': len(selected), 'SHA256': sha256(args.out.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
