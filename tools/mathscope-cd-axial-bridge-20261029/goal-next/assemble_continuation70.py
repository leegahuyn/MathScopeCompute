"""Verify the actual partial spatial readback and corrected hosted export."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation69 import PARENTS as EARLIER

PARENT = '16ceac49dddf69c3bf7f7be884342663464c1953'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation69_Delta_20261120.zip':
           '3f6abbbb48e84b140c284d13d52d4e6338d6d016c55b48255f09572f8b8e001c'}
BASE = 'primary-forced-join/active-n3-c5-binding/hosted-44568520276/'
EXTRA = {'.github/workflows/mathscope-active-n3-first-cycle.yml': '0dbdeca5f818a5e5f3f21b008930d2ba4deb1830a469284c4f4ddb8d4aa9ce35'}
CODE = {
    'primary-forced-join/active-n3-c5-binding/run_first_cycle.mjs': '436db1ca819c176f8c02b15d80c028bbc22a7e2fc0993e435225e12d48956d70',
    'primary-forced-join/active-n3-c5-binding/run_anchored_repeat_candidate.mjs': 'aef576c88a68626333a311ddbaab86bb1eff3922f8d5daca315a2dee9b107bf4',
    'primary-forced-join/active-n3-c5-binding/spatial-stage1/export_coupled_snapshot.mjs': 'a7f05cdbbdc75d9483ac42e4d67cb3682dd0f084c02fdbd057738928dad802e2',
    'primary-forced-join/active-n3-c5-binding/spatial-stage1/emit_first_spatial.mjs': 'a5637c40ceab21fe2678a2c427c045d658e01cdb8572d23f7c3f57aa3955660f',
}
ORIGINAL_RUN = 44568520276
CORRECTED_RUN = 44582875351
CORRECTED_COMMIT = '059df9db3a188ce18f3c43a0dca3a92f2e02a4b2'


def verify_evidence(raw, source):
    for path, digest in CODE.items():
        assert entry(raw(path))['sha256'] == digest, path
    observed = source(BASE + 'spatial-readback.json')
    expected_metadata = source(BASE + 'run-44568520276.json')
    assert observed['hostedRun']['id'] == expected_metadata['databaseId'] == ORIGINAL_RUN
    assert observed['hostedRun']['metadataSHA256'] == entry(raw(BASE + 'run-44568520276.json'))['sha256']
    assert observed['hostedRun']['headSha'] == expected_metadata['headSha'] == 'b26c8d8bd30a94540669791991795bea01535dbf'
    assert expected_metadata['status'] == 'completed' and expected_metadata['conclusion'] == 'failure'
    assert observed['status'] == 'PARTIAL_SPATIAL_INGRESS_METADATA_WITHOUT_COMPLETE_NATIVE_READBACK'
    assert observed['firstCycleReadbackSHA256'] == entry(raw(BASE + 'first-cycle.json'))['sha256']
    cycle = source(BASE + 'first-cycle.json')
    assert cycle['split']['nodeCount'] == 22153782
    assert cycle['status'] == 'VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION'
    assert observed['ingressSHA256'] == entry(raw(BASE + 'first-correction-spatial-ingress.json'))['sha256']
    ingress = source(BASE + 'first-correction-spatial-ingress.json')
    assert ingress['materializedNodes'] == 22155584 and ingress['originalPrefix'] == 22153782
    assert observed['energyIngressRoots'] == 24 and observed['spatialJetLabels'] == 33
    assert len(ingress['spatialJetAtoms']) == 33 and ingress['completeNativeExport'] is None
    assert observed['gaugeDifferenceRoots'] == [22154926, 22154928, 22154930]
    assert [a['body'] for a in ingress['latestStressApplications']] == [21999641, 22000464]
    assert all(row['actualArguments'] == row['formalParameters'] and row['derivativeOrders'] == [0]*4
               for row in ingress['latestStressApplications'])
    assert observed['sameRunDirectSplit']['sha256'] == entry(raw(BASE + 'independent-direct-split.json'))['sha256']
    assert source(BASE + 'independent-direct-split.json')['zeroPolynomials'] == 4
    failure = source(BASE + 'first-correction-spatial-failure.json')
    assert failure['code'] == 'INVALID_ORIGINAL_GRAPH_EXPORT' and failure['sameRunDirectSplitOutcome'] == 'VERIFIED'
    original = raw(BASE + 'pinned-export_original_source_graph.mjs')
    assert b'maxNodes=5000000,definitionGraph=G' in original
    assert b"definitionGraph===G?'RAW_BASE_ONLY':'EXTENDED_COUPLED_FACADE'" in original
    contract = source(BASE + 'export-contract.json')
    assert contract['originalModuleSHA256'] == entry(original)['sha256']
    exporter = next(path for path in CODE if path.endswith('/export_coupled_snapshot.mjs'))
    assert contract['wrapperSHA256'] == CODE[exporter]
    assert contract['legacyOwnerKind'] == 'RAW_BASE_ONLY' and contract['fixedOwnerKind'] == 'EXTENDED_COUPLED_FACADE'
    assert contract['explicitNodeLimit'] == 35000000 and contract['retryIngressGraphNodes'] == 22155584
    assert len(contract['controls']) == 5 and contract['exactNodeStreamPreserved']
    assert not contract['actualOriginalFullStreamExportAcknowledged']
    next_run = source(BASE + 'run-44582875351.json')
    assert next_run['databaseId'] == CORRECTED_RUN and next_run['headSha'] == CORRECTED_COMMIT
    assert next_run['status'] == 'in_progress'
    older = source(BASE + 'run-44582428221.json')
    assert older['databaseId'] == 44582428221 and older['conclusion'] == 'cancelled'
    assert observed['uniformWeightedEndpoints'] == observed['gaugeEquivalence'] == 'OPEN'
    return {'actualN3SourceNodes': 22153782, 'actualSpatialIngressNodes': 22155584,
            'actualSpatialOperandLabels': 24, 'actualSpatialJetLabels': 33,
            'pendingGaugeRoots': observed['gaugeDifferenceRoots'],
            'newHostedRun': CORRECTED_RUN, 'completeNativeStream': 'OPEN', 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation70', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
