"""Bind a verified original N3 retry to the existing spatial energy stencil."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import importlib.util
import json
import sys


RUN, COMMIT = 44582875351, '059df9db3a188ce18f3c43a0dca3a92f2e02a4b2'
REFERENCE = '74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529'
COMPACT = '51057fc92e13cd7fc9a875e71c2926c6769cc3536ee1a13f2bea7ddd630cd94a'
SPLIT = 'bc91034dffc735ef809dc9c4efd21e6ae6efa21c4af48ae0a027d2ba31110455'
BASE = '938fac2a33c130128749ca1f8eddd7f2eaff460e3a1e55ddfc6de47e74d4a226'
STAGE1_SOURCE = 'ca387b2c61daf45fbd0473f5fa297aae0442b2349272a8ae959f2af5082c401f'
READER = '6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48'


def load_with_sha(path):
    data = path.read_bytes()
    return json.loads(data), sha256(data).hexdigest()


def verify_scope(meta, ingress, source, conclusion):
    assert source['schema'] == 'MathScope.N7.IndependentActiveN3SpatialReadback/1'
    assert source['status'] == 'VERIFIED_ACTIVE_N3_SPATIAL_SOURCE_STREAM_AND_OPERAND_BINDINGS', source['status']
    assert source['hostedRun'] == {'id': RUN, 'headSha': COMMIT, 'conclusion': conclusion, 'metadataSHA256': meta}
    assert source['ingressSHA256'] == ingress
    assert source['sourceReferenceReceiptSHA256'] == REFERENCE
    assert source['mode'] == 'full-source' and source['spatialJetLabels'] == 33
    assert source['energyIngressRoots'] == 24 and source['finalJets'] == 0
    assert source['gaugeEquivalence'] == source['uniformWeightedEndpoints'] == 'OPEN'
    assert source['N706'] == source['N805'] == 'OPEN' and source['release'] == 'HOLD'
    assert source['sameRunDirectSplit']['sha256'] == SPLIT
    prefix = source['originalPrefixComparison']
    for label in ('sameRunCompact', 'priorCompact'):
        assert prefix[label]['compactSHA256'] == COMPACT and prefix[label]['checkedRecords'] == 1663
    assert source['typedSourceReadback']['exactOriginalRowsReused'] == 162
    assert [row['announcedRoot'] for row in source['signedStressApplications']] == [22001221, 22001222]
    assert [row['signedRoot'] for row in source['signedStressApplications']] == [22001223, 22001224]


def main(argv=None):
    if not __debug__:
        raise RuntimeError('Assertions must remain enabled.')
    args = ArgumentParser(description=__doc__)
    for name in ('goal', 'artifact', 'run-json', 'readback', 'out'):
        args.add_argument('--' + name, type=Path, required=True)
    params = args.parse_args(argv)
    metadata, meta = load_with_sha(params.run_json)
    assert (metadata['databaseId'], metadata['headSha'], metadata['status']) == (RUN, COMMIT, 'completed')
    assert metadata['conclusion'] in {'success', 'failure', 'timed_out'}
    record, _ = load_with_sha(params.readback)
    assert record['status'] == 'VERIFIED_ACTIVE_N3_SPATIAL_SOURCE_STREAM_AND_OPERAND_BINDINGS', record['status']
    ingress_path = params.artifact / 'first-correction-spatial-ingress.json'
    ingress, ingress_sha = load_with_sha(ingress_path)
    verify_scope(meta, ingress_sha, record, metadata['conclusion'])
    assert ingress['originalPrefix'] == record['sourceStream']['originalPrefixRecords']
    assert ingress['materializedNodes'] == record['sourceStream']['nodes']
    assert ingress['gaugeDifferenceRootsForIndependentCheck'] == record['gaugeDifferenceRoots']

    path = params.goal / 'final67/spatial-cutoff-24/verify_spatial_cutoff_caps.py'
    assert sha256(path.read_bytes()).hexdigest() == BASE
    spec = importlib.util.spec_from_file_location('original_spatial_caps', path)
    original = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(original)
    for role, expected in (('stage1Builder', STAGE1_SOURCE), ('independentReader', READER)):
        relative, _ = original.PINS[role]
        original.PINS[role] = relative, expected
    arguments = sys.argv
    try:
        sys.argv = [str(path), str(params.goal), str(params.out),
                    '--ingress', str(ingress_path), '--readback', str(params.readback)]
        original.main()
    finally:
        sys.argv = arguments
    result, _ = load_with_sha(params.out)
    assert result['liveRootBinding']['hostedRun']==record['hostedRun']
    assert len(result['sourceSlots']) == 24 and all(type(v['rootID']) is int for v in result['sourceSlots'].values())
    assert result['liveRootBinding']['gaugeDifferencesProvedZeroByThisReplay'] is False
    assert result['scope']['actualUniform24CapsEvaluated'] is False and result['scope']['finalJets'] == 0


if __name__ == '__main__':
    main()
