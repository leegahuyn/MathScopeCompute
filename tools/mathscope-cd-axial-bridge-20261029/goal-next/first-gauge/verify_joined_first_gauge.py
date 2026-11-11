"""Read the appended chart and native derivative roots with the source graph readers."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
from tempfile import TemporaryFile

from bind_first_cycle_gauge import Graph, Native
from materialize_first_gauge import Scope


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--joined', required=True, type=Path)
    parser.add_argument('--delta', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    raw_delta = args.delta.read_bytes()
    delta = json.loads(raw_delta)
    manifest = json.loads((args.joined / 'original-source-export-manifest.json').read_bytes())
    assert manifest['native_delta_sha256'] == sha256(raw_delta).hexdigest()
    assert manifest['source_cycle_manifest']['node_stream_sha256'] == delta['baseGraphSHA256']
    native = Native(args.joined / 'original-source-functions.json', manifest)
    start = delta['baseNodeCount']
    values = manifest['first_correction_value_roots']
    jets = manifest['first_correction_interior_jet_roots']
    assert values == delta['physicalChartRoots'] and len(values) == 5
    assert jets == delta['firstCorrectionRequestedJetExpressions']['interiorRoots'] and len(jets) == 67
    assert manifest['original_root_ids'] == list(values.values()) + list(jets.values())
    assert len(set(manifest['original_root_ids'])) == 72
    assert manifest['actual_final_67_jets_certified'] == 0
    assert not manifest['final_all_cycle_A_b_p'] and manifest['release'] == 'HOLD'
    coordinates = delta['physicalCoordinateIDs']
    radial = {coordinates[k] for k in ('xSquaredPlusYSquared', 'z', 'tau')}
    chart = radial | {coordinates['polarAngleLift']}
    registry = json.loads(native.raw['definitions'])
    for group, count, expected in zip(registry, delta['baseRegistryCounts'], delta['nativeRegistryDelta'], strict=True):
        assert group[count:] == expected
    with TemporaryFile() as backing:
        graph = Graph(args.joined / 'original-source-nodes.jsonl.gz', backing, manifest)
        assert len(graph.offsets) == start + len(delta['nodeDelta'])
        for index, row in enumerate(delta['nodeDelta'], start):
            assert graph.node(index) == (row['op'], row['args'])
        scope = Scope(graph, native.raw)
        for name, root in values.items():
            radius, _, _, left, _, right = graph.args(root, 'smooth_piecewise')
            assert radius == coordinates['xSquaredPlusYSquared'] and left == right == 0
            free = scope.free(root)
            assert sorted(free) == delta['physicalFreeCoordinates'][name]
            assert set(free) == (radial if name == 'b' else chart)
        for name, root in jets.items():
            assert set(scope.free(root)) <= (radial if name.startswith('b@') else chart)
    receipt = {'schema': 'MathScope.M3.FirstGaugeJoinedReadback/1',
               'nodeCount': manifest['node_count'], 'nodeSHA256': manifest['node_stream_sha256'],
               'registrySHA256': manifest['definitions_sha256'], 'nativeDeltaSHA256': manifest['native_delta_sha256'],
               'appendedRecordsMatched': len(delta['nodeDelta']), 'guardedFirstCorrectionValues': len(values),
               'firstCorrectionInteriorDerivativeExpressions': len(jets), 'axisymmetricB': True,
               'finalClosedCellJetIntervals': 0, 'release': 'HOLD'}
    args.out.write_bytes((json.dumps(receipt, indent=2) + '\n').encode())
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
