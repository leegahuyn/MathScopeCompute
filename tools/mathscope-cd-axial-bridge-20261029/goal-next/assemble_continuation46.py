"""Verify and package the completed original same-family first correction."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation45 import PARENTS as EARLIER


PARENT = '150d0ee78f7c094f0d8c775079a7c7822e915e50'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation45_Delta_20261119.zip':
           '005facb3a3bbee781415b8c6fef78f8df088c7a44042dbbb40e701655698d609'}
RUN = 'primary-forced-join/active-n3-c5-binding/hosted-44528954587/'
READBACK = '4b03b42b39d2946d7362a121397eadb2f37a186b72a7ea04e92c1b6b7843c64b'
CHECKER = '41ed8c7744ec12a6cdc302e2c2a4ed6d3ec23046e23aead54fd3e120e8cf5ed8'
CONTROLS = 'e6d327c6073813d55948af27fd356a56d986f9ab012267dcaba1e7dbe3787ecf'


def verify_evidence(raw, source):
    assert entry(raw(RUN + 'verified-readback.json'))['sha256'] == READBACK
    assert entry(raw(RUN + 'check_first_cycle_stages.py'))['sha256'] == CHECKER
    assert entry(raw(RUN + 'verification-controls.json'))['sha256'] == CONTROLS
    record = source(RUN + 'verified-readback.json')
    for path, digest in record['inputSHA256'].items():
        assert entry(raw(RUN + path))['sha256'] == digest, path
    assert record['status'] == 'VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION'
    assert record['hostedRun']['id'] == 44528954587 and record['hostedRun']['conclusion'] == 'success'
    assert record['hostedRun']['fullGraphIndependentReadback'] == 'skipped'
    assert len(record['completedSourceStages']) == 6 and record['lastSealedGraphNodes'] == 22153782
    assert record['originalForcedChecks'] == 805 and record['originalStressChecks'] == 18
    assert record['signedIndexedRows'] == 1620
    assert record['directSplit']['roots'] == [22153774, 22153776, 22153778]
    assert record['directSplit']['divergence'] == 22153781 and not record['directSplit']['differencesProvedZero']
    cycle = source(RUN + 'first-cycle.json')
    assert cycle['stages'][3]['inverses'] == [22032009, 22087003]
    assert cycle['stages'][5]['conservativeResidual'] == [22153560, 22153562, 22153564]
    assert all(row['rejected'] for row in source(RUN + 'verification-controls.json'))
    return {'firstCycleGitHubRun': 44528954587, 'firstCycleSourceStages': 6, 'sourceNodes': 22153782,
            'directSplitRoots': 4, 'directSplitRootsProvedZero': 0, 'finalJets': '0/67'}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label='MathScope_Goal_Continuation46',
                   date='20261119', verify=verify_evidence)
