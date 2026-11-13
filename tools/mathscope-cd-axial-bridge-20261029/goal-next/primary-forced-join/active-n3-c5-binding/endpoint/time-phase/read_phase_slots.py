"""Extract only selected phase ancestors from the SHA-pinned same-family graph."""

from argparse import ArgumentParser
import gzip
from hashlib import sha256
import json
from pathlib import Path


WITNESS = 'a35bd111ef2f60b0e779a85433571db8caa00061616da91372782a28a16859e9'
ENDPOINT = '5abe63bc103e29e14694528d5bac4733b84f217344679ddfdff0b65727e18d85'
GRAPH = '831120617913e89c5bb60976fb26f58c6714decc301097a08f72ee23233e0a6a'
REGISTRY = '364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111'


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument('bundle', type=Path)
    p.add_argument('endpoint', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    witness = json.loads(pinned(args.bundle / 'original-active-mode-two-witness.json', WITNESS))
    endpoint = json.loads(pinned(args.endpoint, ENDPOINT))
    assert endpoint['sameLiveNormFamily'] and endpoint['graphSHA256'] == GRAPH
    source_registry = json.loads(pinned(args.bundle / 'original-source-functions.json', REGISTRY))
    phase_roots = [row['phase'] for row in witness['rows']]
    selected = {}
    digest = sha256()
    with gzip.open(args.bundle / 'original-source-nodes.jsonl.gz', 'rb') as graph:
        first = graph.readline()
        digest.update(first)
        for i, row in enumerate(graph):
            digest.update(row)
            # Both original unfrozen phases and their newly frozen/lifted
            # counterparts are in narrow ranges before/after initialization.
            if i < 40 or 17_732_725 <= i <= 17_736_610 or 21_382_950 <= i <= 21_383_100 or any(root - 6 <= i <= root for root in phase_roots):
                selected[i] = json.loads(row)
    assert i + 1 == witness['snapshot']['node_count'] and digest.hexdigest() == GRAPH
    result = {'schema': 'MathScope.ActiveN3SelectedPhaseSlots/1', 'graphSHA256': GRAPH, 'registrySHA256': REGISTRY,
              'witnessSHA256': WITNESS, 'endpointSHA256': ENDPOINT, 'nodes': selected,
              'registryFields': list(source_registry), 'rows': witness['rows']}
    with args.output.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(result, separators=(',', ':')) + '\n')
    print(json.dumps({'nodesKept': len(selected), 'SHA256': sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
