"""Verify the higher-order moment operands and spatial cutoff arithmetic."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation57 import PARENTS as EARLIER

PARENT = 'eb59056578a5316a48e34394aee670fbee84211a'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation57_Delta_20261120.zip':
           '70fe83511c44d06d04278f5b5b2dc4c1bf677e3d0f041b0a2c7f6105da9888cf'}
MOMENTS = 'axial-order-one-identity/higher-whole-moments/'
CUTOFF = 'final67/spatial-cutoff-24/'
PINS = {
    MOMENTS + 'README.md': '72c127d933bc0db9e9e7bcb7be2c2413ca839252042d6da1ef08a399711d1c76',
    MOMENTS + 'check_higher_moments.mjs': 'ae14279fb7a60f4a94865b2c2262f384b795c22be310e97d389da73f1f5683f2',
    MOMENTS + 'higher-moments.json': 'e78ddd420473f05bbb517b9d3f64bde2d2dd24ba8d28bb93292d5851f319748f',
    CUTOFF + 'MANIFEST.json': '5886e5b21d2f9a8c34809ccfaed7b0b760436b3449fa0d18e219c65bb0817ca5',
    CUTOFF + 'spatial-cutoff-caps.json': '5152e1b5bb7c0e91ae223bc35e7b26c6899ea329fdc000f213f58fb8ab0027c4',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    moments = source(MOMENTS + 'higher-moments.json')
    assert moments['priorSHA256'] == entry(raw('axial-order-one-identity/whole-moments/whole-moments.json'))['sha256']
    for n, row in enumerate(moments['rows'], start=2):
        assert row['n'] == n and row['pairs'] == [[i, n - i] for i in range(1, n)]
        assert row['omega']['index'] == n - 1 and row['omega']['nestedViscosityIndex'] == n - 2
        assert (len(row['local']), len(row['history']), len(row['correctionMoments'])) == (5, 3, 5)
        assert len(row['prefixes']['bumpMassPrefixes']) == 2
        assert len(row['prefixes']['bumpPressurePrefixes']) == 3
        assert all(row[key] for key in ('omittedCorrectionRejected', 'wrongPressureOmegaSignRejected',
                                       'missingAxialXWeightRejected'))
    assert len(moments['rows']) == 4 and moments['release'] == 'HOLD'

    cap_manifest = source(CUTOFF + 'MANIFEST.json')
    for path, metadata in cap_manifest['files'].items():
        assert entry(raw(CUTOFF + path)) == metadata, path
    for metadata in cap_manifest['sourcePins'].values():
        assert entry(raw(metadata['relativePath']))['sha256'] == metadata['sha256']
    caps = source(CUTOFF + 'spatial-cutoff-caps.json')
    bounds = caps['cutoffBounds']
    assert (bounds['totalFirst_tau0'], bounds['totalSecond_tau0']) == ('35', '1658')
    effective = bounds['stage4EffectiveOnCorrectionSupportOnly']
    assert (effective['first_tau0'], effective['second_tau0']) == ('15', '366')
    assert caps['stage'] == 1 and caps['liveRootBinding'] is None
    assert len(caps['sourceSlots']) == 24 and all(row['rootID'] is None for row in caps['sourceSlots'].values())
    return {'actualOrders': [2, 3, 4, 5], 'actualLocalIntegrals': 20, 'actualLowerHistories': 12,
            'actualRepairedRows': 20, 'actualMassPressurePrefixes': 32,
            'conditionalCutoffConstants': [35, 1658], 'coveredSpatialOperands': 24}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation58', date='20261120',
                   verify=verify_evidence)
