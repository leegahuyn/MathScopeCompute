"""Verify directed original norm comparisons and archived Forced/Signed curls."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation61 import PARENTS as EARLIER

PARENT = '1bd41251dabd53f74e39f8fc88a3c3057e663525'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation61_Delta_20261120.zip':
           'd1ef1c06d22febdcc418959593e005268d31d9ff0224863cb06c2b1ad6a5698b'}
NORM = 'final67/active-n3-cap-transport/'
CAP = NORM + 'source-cap/'
WAVE = 'primary-forced-join/active-n3-c5-binding/spatial-stage1/correction-waves/'
PINS = {
    NORM + 'primary-norm-operands.json': 'bcd6cb4639c865607816b9953953012ee83d69b1f834feb21f7c020f0457a9ad',
    CAP + 'MANIFEST.json': '64f8755cca3f7581de4e22661725c4611efa12408c717613e39228ea7ce46bb5',
    CAP + 'cap-transport.json': '387863daedfc9fd37f7c1d43db430235238f94d23b767424baffa5d2f3348955',
    WAVE + 'archived-correction-waves.json': 'dc8bf5c0d2443e219af27ee6ea6d57368df862ee3d0ecc93dbb7166f557f97c7',
    WAVE + 'verify_correction_waves.py': '0dbf7e420a6ae93d052ade65cd16d04ee0bae1ba061272622d190fa9a879ac67',
    WAVE + 'CORRECTION_WAVES.md': '09a31ef64bfa527bfac9b797d6d81ca007f364b2ff5f191675575217e4e7bc3f',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    norm = source(NORM + 'primary-norm-operands.json')
    assert norm['originalK'] == 18310069 and norm['sourceBackgroundRoot'] == 14220496
    assert len(norm['thresholds']) == 6 and len(norm['operands']) == 14
    assert norm['wholeKOperandsStrictlyBelowThresholdFraction'] == 13 and norm['thresholdFraction'] == '1/64'
    for row in norm['operands']:
        if row['id'] == 14220496:
            assert all(item['upperToLower'] == 1 and item['lowerToUpper'] == -1 for item in row['comparisons'])
        else:
            assert all(item['upperToOneSixtyFourth'] == -1 for item in row['comparisons'])
    assert [row['order'] for row in norm['backgroundC8']['orders']] == list(range(1, 8))

    manifest = source(CAP + 'MANIFEST.json')
    for path, pin in manifest['files'].items():
        assert entry(raw(CAP + path)) == pin, path
    cap = source(CAP + 'cap-transport.json')
    assert len(cap['all20ForcedSystems']) == 20 and len(cap['referenceTransport']) == 2
    assert cap['scope']['actualCapBudgetsClosed'] == 0 and cap['scope']['finalJets'] == 0

    archived = source(WAVE + 'archived-correction-waves.json')
    assert archived['scope'] == 'ARCHIVED_N1' and archived['sourceNodes'] == 4456994
    assert archived['prefix']['matchedNodes'] == 4197115
    assert archived['forcedArmIdentities'] == 240 and archived['signedArmIdentities'] == 120
    assert archived['signedSameNormalComponents'] == 30 and archived['liveN3GaugeDifferences'] == 'OPEN'
    return {'thresholdsCompared': 6, 'originalPrimaryOperands': 14, 'operandsBelowThresholdOver64': 13,
            'unresolvedPrimaryC8Root': 14220496, 'originalNativeForcedSystems': 20,
            'archivedForcedAndSignedCoefficientIdentities': [240, 120], 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation62', date='20261120',
                   verify=verify_evidence)
