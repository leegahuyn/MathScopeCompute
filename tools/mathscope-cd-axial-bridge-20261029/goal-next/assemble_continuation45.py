"""Package the refined conditional initialized mean cutoff upper bound."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation44 import PARENTS as EARLIER


PARENT = '48580a712d009547492281386299d7f1a133a00c'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation44_Delta_20261119.zip':
           '423404a3f37b3dbea21270c927ec0d2855d010e3cafc1fdcf90ed807949afba5'}
MEAN = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/mean-deep-exponential/'
PINS = {
    MEAN + 'mean-cutoff-final.json': 'c876697f251b2de901f8c44fb661c27f94746d108293f3bb5d582ca023c0260c',
    MEAN + 'deep-sum-controls.json': '3c2dc687474995e7f072c110f477bc1a27074919fef06bb00f52b52d3ba3ba4a',
    MEAN + 'verified-mean-final.json': '95e5f9e748b0b6c8b79ed08e994a4fc2f8fc68b6230ed884587b8f90b2362b5e',
}


def verify_evidence(raw, source):
    for path, digest in PINS.items():
        assert entry(raw(path))['sha256'] == digest, path
    mean = source(MEAN + 'mean-cutoff-final.json')
    assert len(mean['covarianceRoots']) == 42 and len(set(mean['covarianceRoots'])) == 42
    assert mean['arithmetic']['deepPositiveSumRefinements'] == 11238
    assert mean['BnormRefinement']['originalScalar'] == 300170
    assert mean['BnormRefinement']['upperComparison'] == -1
    bounds = [row['upperComparison'] for field in mean['velocity'].values() for row in field.values()]
    assert bounds == [-1] * 9
    energy = mean['actualMeanCutoffEnergy']
    assert energy['comparison'] == 1 and energy['upperComparisonToPrevious'] == -1
    control = source(MEAN + 'deep-sum-controls.json')
    assert [row['eligible'] for row in control['rows']].count(True) == 3
    assert [row['eligible'] for row in control['rows']].count(False) == 2
    proof = source(MEAN + 'verified-mean-final.json')
    assert proof['status'] == 'PASS_EXACT_RATIONAL_DEEP_CAP_AND_MEAN_READBACK'
    assert proof['controlsSHA256'] == PINS[MEAN + 'deep-sum-controls.json']
    assert proof['meanSHA256'] == PINS[MEAN + 'mean-cutoff-final.json']
    assert proof['velocityComparisons'] == {'strict': 9, 'equal': 0, 'larger': 0}
    assert proof['fullMeanUpperStrictlyImproved'] and proof['fullMeanCutoffComparison'] == 1
    return {'meanUpperBoundsStrictlyReduced': 9, 'deepSumRefinements': 11238,
            'meanUpperStrictlyReduced': True, 'meanUpperFitsBudget': False}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label='MathScope_Goal_Continuation45',
                   date='20261119', verify=verify_evidence)
