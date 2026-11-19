"""Verify the jet composition ledger and the actual archived initialized wave."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation60 import PARENTS as EARLIER

PARENT = '220367e87b311762616d37a176421c7f273e2d01'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation60_Delta_20261120.zip':
           'b0d7e1dc493e9ce44dc6cb0b5d8d8bb179bbb1f505825ddcbce064899c462ada'}
COMPOSITION = 'final67/correction-jet-composition/'
WAVE = 'primary-forced-join/active-n3-c5-binding/spatial-stage1/initialized-wave/'
PINS = {
    COMPOSITION + 'correction-jet-composition.json': '4b9e76aa053e18e767f8d82c7cd64a09b0bd23e942cd39157bf9ea95efdcc648',
    COMPOSITION + 'check_correction_jet_composition.py': '0591fd50fad66040b9496c4668e7664eaf2f0db069982106abda8dd9e083f490',
    COMPOSITION + 'pinned-source/source-final-summation.mjs': '67c2f0a63d4b1a5fdf86a4c25f776ed0fdf0a6cd379d08aaf858231621c04450',
    COMPOSITION + 'pinned-source/outer_cutoff.py': '535e1126c6450627bd61cf0e5a94c33938b12e71886a995175493dddfe6b8ced',
    WAVE + 'verify_initialized_wave.py': 'fe1f0276c83b72b625d9b9d2d4e91f82bdc175cad3954db4a65123dd6739ab97',
    WAVE + 'archived-initialized-wave-typed.json': '6c191231c6e41e1828d6ff7b98021a07cad9f175a36d45578058679f126d7c4d',
    WAVE + 'INITIALIZED_WAVE.md': 'eaa91f4d5ee93b8230a377ce5b6edb1e705edc6e706a97a7606518ebcd8b4a7e',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    composition = source(COMPOSITION + 'correction-jet-composition.json')
    rows = composition['rows']
    assert len(rows) == composition['requiredFinalLabels'] == composition['controls']['exactComposedLabels'] == 67
    assert sum(map(len, rows.values())) == composition['termsPerStage'] == 118
    assert all(term['stageJet'] in rows and term['tau0HPower'] == term['cutoffJet'][0]
               for terms in rows.values() for term in terms)
    bounds = composition['bounds']
    assert (bounds['transitionCells'], bounds['outwardBits']) == (256, 80)
    assert bounds['weightedSeedIntegerCaps'] == [1, 4, 33, 854]
    assert bounds['physicalDerivativesInTau0Units'] == {
        '0,0': 1, '0,1': 9, '1,0': 12, '1,1': 203, '2,0': 288, '3,0': 22290}
    assert composition['activeStages'] == [1, 2, 3, 4] and composition['actualStageJetIntervals'] == 'OPEN'
    assert composition['finalJets'] == 0

    archived = source(WAVE + 'archived-initialized-wave-typed.json')
    assert archived['scope'] == 'ARCHIVED_N1' and archived['sourceNodes'] == 4456994
    assert len(archived['rows']) == 10 and archived['xiVBranchCorrespondences'] == 1620
    assert sum(row['initializedTerms'] for template in archived['rows']
               for row in template['components']) == 120
    assert len(archived['negativeControls']) == 2 and archived['liveN3GaugeDifferences'] == 'OPEN'
    return {'originalJetCompositionLabels': 67, 'piecewiseCutoffJets': 6,
            'termsPerActiveStage': 118, 'archivedInitializedFourierTerms': 120,
            'archivedFrozenArgumentComparisons': 1620, 'actualFinalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation61', date='20261120',
                   verify=verify_evidence)
