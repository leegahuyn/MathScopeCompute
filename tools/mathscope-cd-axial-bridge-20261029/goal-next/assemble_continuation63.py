"""Verify the source-bound local C8 background and original operator operands."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation62 import PARENTS as EARLIER

PARENT = '56617dae610654c3777cb89344b369ecc64d9a7d'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation62_Delta_20261120.zip':
           '314b29706b1fa50bcac648be28046000f0695f104882980c8e471ad760905bc4'}
C8 = 'final67/local-background-c8/'
PINS = {
    'README.md': '45e992c300d7a02fc9714b179e7a30a672a6fb4f093397205027722654619c16',
    'verify_c8_slab.mjs': 'e409469db00ac80e376d0a5c47d416d75f451b9dd8050c8a88cf25f4e4fe9d61',
    'c8-slab.json': 'e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b',
    'MANIFEST.json': '902796b129f7e357e08e58641aaef6276d56146bff0e2b4ec0b39b77559e005d',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(C8 + path))['sha256'] == pin, path
    manifest = source(C8 + 'MANIFEST.json')
    assert manifest['artifacts'] == {path: pin for path, pin in PINS.items() if path != 'MANIFEST.json'}
    c8 = source(C8 + 'c8-slab.json')
    assert (len(c8['literalRows']), c8['auditedLeadLeaves'], c8['auditedChartLeaves']) == (330, 90, 25299)
    assert c8['roots']['background'] == 14220496 and c8['roots']['norm'] == 18310069
    assert len(c8['split']) == len(c8['localBudget']) == 3 and len(c8['untouchedComparisons']) == 13
    assert [row['maxN'] for row in c8['split']] == [2, 3, 3]
    assert all(row['localizedComparisons']['smallGrowth128'] == row['unweightedComparisons']['smallGrowth128'] == -1
               for row in c8['split'])
    assert all(row['comparisons']['smallGrowth128'] == row['unweightedComparisons']['smallGrowth128'] == -1
               for row in c8['localBudget'])
    assert c8['frozenUpperCandidate']['maxN'] == 4
    assert c8['frozenUpperCandidate']['localizedComparisons']['normalizedStageOne'] == 1
    assert c8['originalGlobalKRemainsUnchanged'] and c8['meansRemainOpen']
    assert c8['actualFinalJets'] == 0 and c8['release'] == 'HOLD'
    return {'literalSlowC8Rows': 330, 'leadingLeaves': 90, 'chartLeaves': 25299,
            'livePhysicalScopes': 3, 'localBoundExponentMargin': 'H/2^128',
            'frozenFullBackground': 'OPEN', 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation63', date='20261120',
                   verify=verify_evidence)
