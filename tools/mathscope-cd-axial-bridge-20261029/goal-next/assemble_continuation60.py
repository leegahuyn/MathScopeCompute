"""Verify the repaired spatial ingress and the archived initialized-field cancellation."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation59 import PARENTS as EARLIER

PARENT = 'f50681e518fb4e7a49d9140c3ec51fed7b21827e'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation59_Delta_20261120.zip':
           'e2f15d4447ba1bddf6c4a5c2230bd878f7ee0896a621ce711d6299564dd5bf94'}
STAGE = 'primary-forced-join/active-n3-c5-binding/spatial-stage1/'
INITIALIZED = STAGE + 'initialized-metadata/'
RETRY = 'primary-forced-join/active-n3-c5-binding/hosted-44568520276/start.json'
EXTRA = {'.github/workflows/mathscope-active-n3-first-cycle.yml':
         '01e16c0ab55badd11a98901e5d791796bc6e68daab83d5b20e771942c58268f1'}
PINS = {
    STAGE + 'match_signed_stress.mjs': '1546569c15ea8db5f347db887f2d95ae4cdce800e4f8db89867f2011796b9ebf',
    STAGE + 'check_signed_stress_apps.mjs': 'a89341c5cf41723ea1ddc9e9dcf07328909b3900c808a1efbd7b4011f8dd25d8',
    STAGE + 'stage1_spatial_ingress.mjs': 'ca387b2c61daf45fbd0473f5fa297aae0442b2349272a8ae959f2af5082c401f',
    STAGE + 'signed-stress-controls.json': '1ee7d0283144f9b0e8ca5773a4afbcb6bd53fd48fd1f7beed00cbb95bfe07485',
    INITIALIZED + 'archived-initialized-metadata-final.json': '85a7d6f9678f4a0646db4d4ba3981a8ee83686f61cd3de47d19909c00be5a51f',
    INITIALIZED + 'bind_initialized_metadata.py': '2ab75a8f7da4906098ea269f0c4e9a9f88d3f37090e64923192b7588c231fafa',
    INITIALIZED + 'INITIALIZED_METADATA.md': 'e22ffd58aa77b9270bf21150574317a2c9a19d81a288f3fcb2deee954c0af629',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    control = source(STAGE + 'signed-stress-controls.json')
    assert control['checkedComponents'] == 2 and control['distinctRegistrationIDs']
    assert len(set(control['controlsRejected'])) == 7 and control['activeN3ApplicationReadback'] == 'OPEN'
    archive = source(INITIALIZED + 'archived-initialized-metadata-final.json')
    assert archive['mode'] == 'ARCHIVED_N1' and archive['sourceNodes'] == 4456994
    assert archive['checkedComponentRows'] == 486 and archive['exactMeanCancellations'] == 6
    assert len(archive['negativeControls']) == 4 and archive['liveGaugeZero'] == 'OPEN'
    run = source(RETRY)
    assert run['databaseId'] == 44568520276 and run['headSha'] == 'b26c8d8bd30a94540669791991795bea01535dbf'
    assert run['status'] == 'in_progress' and run['conclusion'] == ''
    return {'archiveComponentRows': 486, 'exactArchiveBaselineCancellations': 6,
            'stressAliasNegativeControls': 7, 'hostedRetryRun': 44568520276,
            'receiptScope': 'LOCAL_CONTROLS_AND_HOSTED_START'}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation60', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
