"""Verify the original first active correction gauge and hosted readback."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation58 import PARENTS as EARLIER

PARENT = '33ce545fe60781c0c05881bd6acaccfe02911bd0'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation58_Delta_20261120.zip':
           '260c3fb57dcf2450c767bf64e858fa310f7687d1c620b8108ef40a56879a4cc1'}
GAUGE = 'primary-forced-join/active-n3-c5-binding/spatial-stage1/local-gauge/'
HOSTED = 'primary-forced-join/active-n3-c5-binding/hosted-44553053960/'
PINS = {
    GAUGE + 'README.md': '722eb25ca966c53e1f45a9ac9e1ee16450bc9e397c5875eec74eb01ba6b89712',
    GAUGE + 'prove_stage1_gauge.py': 'a98d64b50c22bdf3352dad44eff5e6d4c5e22db23d3c732c15680c76bfdde749',
    GAUGE + 'stage1-gauge-local-proof.json': '9e248a635db68790d2fd8234ab31ac0a085b5e015bd36b2e74b48c0d5b1c6d99',
}


def verify_local(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    gauge = source(GAUGE + 'stage1-gauge-local-proof.json')
    stage_source = 'primary-forced-join/active-n3-c5-binding/spatial-stage1/stage1_spatial_ingress.mjs'
    assert entry(raw(stage_source))['sha256'] == gauge['sourceSHA256']['stage1_spatial_ingress.mjs']
    assert gauge['localHarmonics'] == {'forcedComponents': 3, 'signedComponents': 3,
                                        'wrongRealSignRejected': True}
    assert gauge['fixedLabelPullback']['radialAzimuthalAndAxialScales'] == 4
    assert gauge['fixedLabelPullback']['missingPaletteFactorRejected']
    assert gauge['meanCurl']['temporalT1Retained'] and gauge['meanCurl']['fiveMapUsesRawLeftPrimitive']
    assert gauge['liveRootEquivalence'] == 'OPEN' and gauge['release'] == 'HOLD'


def verify_evidence(raw, source):
    verify_local(raw, source)
    hosted = source(HOSTED + 'spatial-readback.json')
    metadata = source(HOSTED + 'run.json')
    assert hosted['hostedRun']['metadataSHA256'] == entry(raw(HOSTED + 'run.json'))['sha256']
    assert hosted['hostedRun']['id'] == metadata['databaseId'] == 44553053960
    assert hosted['hostedRun']['headSha'] == metadata['headSha'] == '6adb862667b0ce0e627843b253d6d94673a35164'
    assert metadata['status'] == 'completed' and metadata['conclusion'] == hosted['hostedRun']['conclusion']
    assert hosted['status'] == 'PARTIAL_ORIGINAL_CYCLE_WITHOUT_SPATIAL_INGRESS'
    assert hosted['firstCycleReadbackSHA256'] == entry(raw(HOSTED + 'first-cycle.json'))['sha256']
    failure = source(HOSTED + 'first-correction-spatial-failure.json')
    assert hosted['spatialError'] == failure and failure['sameRunDirectSplitOutcome'] == 'VERIFIED'
    assert all(root in failure['message'] for root in ('22001221', '22001222', '22001223', '22001224'))
    assert entry(raw(HOSTED + 'independent-direct-split.json'))['sha256'] == (
        'bc91034dffc735ef809dc9c4efd21e6ae6efa21c4af48ae0a027d2ba31110455')
    assert source(HOSTED + 'independent-direct-split.json')['zeroPolynomials'] == 4
    assert hosted['gaugeEquivalence'] == hosted['uniformWeightedEndpoints'] == 'OPEN'
    assert hosted['N706'] == hosted['N805'] == 'OPEN' and hosted['finalJets'] == 0
    return {'localCurlComponents': 6, 'fixedLabelScaleIdentities': 4,
            'hostedOriginalN3Run': 44553053960, 'spatialReadback': hosted['status'],
            'uniformEndpoints': 'OPEN'}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation59', date='20261120',
                   verify=verify_evidence)
