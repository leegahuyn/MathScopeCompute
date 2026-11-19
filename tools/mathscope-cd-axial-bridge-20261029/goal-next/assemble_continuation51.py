"""Package the first active-correction source exporter and its preflight."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation50 import PARENTS as EARLIER


PARENT = 'af4502e8604c046b42c563a4e2996cf81e3cd9ba'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation50_Delta_20261120.zip':
           'ee60f5366ff0ceacedc3b812c247a1363577fd697b3552658373ee6d9a6560e4'}
BINDING = 'primary-forced-join/active-n3-c5-binding/'
SPATIAL = BINDING + 'spatial-stage1/'
PINS = {
    'archived-reference-scaling.json': '33c7eb681c1c499b546d69c67cbcfe189071551864cf6ed860be8545b1e363e4',
    'emit_first_spatial.mjs': 'd20a6260922dd1acc8f7b63cf13904bb83e57ac3ecf0d9114b8ab55054967ee5',
    'stage1_spatial_ingress.mjs': '559a294d83fa770bb268023f3eb61693b45ffca4fee8c92e53ab6db1a9aa8099',
    'checks.log': '502533e42f24293f353d8bfb775433871c8e1fe53b00c045a6323b1157830df0',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(SPATIAL + path))['sha256'] == pin, path
    archive = source(SPATIAL + 'archived-reference-scaling.json')
    assert archive['nodes'] == 4456994 and archive['rowMaps'] == 162
    assert len(archive['referenceDefinitions']) == 6
    assert len(archive['originalSpatialJetLabels']) == 33
    assert raw(SPATIAL + 'checks.log').count(b'PASS ') == 6
    run = source(SPATIAL + 'hosted-start.json')
    assert run['workflowRun'] == 44553053960
    assert run['sourceCommit'] == '6adb862667b0ce0e627843b253d6d94673a35164'
    assert run['statusAtFirstReadback'] == 'in_progress' and run['sourceMode'] == 'full-source'
    assert run['requestedNotYetObserved'] == {
        'energyIngressRoots': 24, 'spatialJetLabels': 33, 'gaugeDifferenceRoots': 3,
        'extendedSourceGraphAndNativeRegistry': True,
    }
    assert run['positiveLiveSourceExport'] == run['actualUniformStageEndpoints'] == 'OPEN'
    runner = raw(BINDING + 'run_first_cycle.mjs')
    assert b"from './spatial-stage1/emit_first_spatial.mjs'" in runner
    assert b'await emitFirstSpatial(' in runner
    return {'archivedPreflightNodes': 4456994, 'archivedRowMaps': 162,
            'activeN3SpatialRun': run['workflowRun'], 'positiveLiveSourceExport': 'OPEN'}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation51', date='20261120',
                   verify=verify_evidence)
