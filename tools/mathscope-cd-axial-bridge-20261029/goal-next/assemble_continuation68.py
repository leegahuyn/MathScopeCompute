"""Verify the archived N3 mean increment and the repeated Forced source preflight."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation67 import PARENTS as EARLIER

PARENT = 'da6c992ab98095cf69976ebd8011d062ce90eb67'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation67_Delta_20261120.zip':
           'd9d948b553c0558e1ffe3ef02859085644785b86701422e1912f5e0b2f3164c4'}
MEAN = 'primary-forced-join/active-n3-c5-binding/compact-mean-increment/'
NEXT = 'primary-forced-join/active-n3-c5-binding/repeat-candidate-preflight/'


def verify_evidence(raw, source):
    assert entry(raw(MEAN + 'compact-mean.json'))['sha256'] == (
        '4034331b1ab4204a845d197b213e3566a7bc677aa4541f22936e2bc77b89435d')
    assert entry(raw(MEAN + 'verify_original_compact_mean.py'))['sha256'] == (
        '05e112606bff6c01940fb49381e54db8c9eeb43adcb40a7647146eae54c47be7')
    mean = source(MEAN + 'compact-mean.json')
    assert mean['sourceGraphNodes'] == 22153782 and mean['compactRecords'] == 1663
    rows = mean['componentRows']
    assert [v['postFiveRoot'] for v in rows] == [22153222, 22153223, 22153224]
    assert [len(v['cancelledBaselineTerms']) for v in rows] == [2, 2, 4]
    assert [len(v['temporalTerms']) for v in rows] == [1, 1, 3]
    assert all(v['omitBaselineSubtractionDetected'] for v in rows)
    assert mean['verifiedPsiApplicationIDs'] == [22150943, 22150944, 22150947, 22150948, 22150949]
    assert mean['scope']['duplicateMeanBaselineCancellation'] and not mean['scope']['nativeRegistryDefinitionBodiesRead']
    assert mean['scope']['fullInitializedSubtractionAndGauge'] == 'OPEN'

    assert entry(raw(NEXT + 'MANIFEST.json'))['sha256'] == (
        '3358b1e39b81fdf20845b9a96225b19884fc049e714be77cc19cacd2b7e079f3')
    preflight = source(NEXT + 'MANIFEST.json')
    for name, pin in preflight['artifacts'].items():
        assert entry(raw(NEXT + name))['sha256'] == pin, name
    checks = source(NEXT + 'replay-log.json')
    assert checks['unchangedOriginalRepeatTestsPassed'] == 2
    assert checks['exactReferenceCovarianceIdentities'] == 60 and checks['covarianceAndOwnerControls'] == 136
    assert checks['originalN1NodeRecords'] == 4682006 and checks['actualTypedGaugeApplications'] == 240
    assert not checks['actualLiveN3RepeatConstructed'] and not checks['stage2Completed']
    assert checks['finalJets'] == 0 and checks['release'] == 'HOLD'
    gauge = source(NEXT + 'stage2-potential-readback.json')
    assert gauge['zeroOrderSharedPotentialRootCount'] == 240 and gauge['candidateCount'] == 40
    assert gauge['sourceStream']['nodes'] == 4682006
    assert gauge['borrowedHarmonicNegativeControl'] and gauge['completeSecondCorrection'] == 'OPEN'
    return {'actualCompactMeanCancellations': 3, 'actualTemporalApplicationMatches': 5,
            'archivedN1RepeatCandidates': 40, 'archivedTypedPotentialRoots': 240,
            'conditionalCovarianceIdentities': 60, 'actualN3Repeat': 'OPEN', 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation68', date='20261120',
                   verify=verify_evidence)
