"""Package the higher native source argument readbacks and exact mean cancellation."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation73 import PARENTS as EARLIER

PARENT = 'baa87e63c0be1a9b39330bf616afc3c05d6d2bf7'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation73_Delta_20261120.zip':
           '4959a679e6212a04959c1564ed97bad050976aad90a873c46a290d8bc72e084f'}
Y = 'y-higher-flow/n4-three-actual-upper-sites/'
Y_ZIP = Y + 'MathScope_N4_Three_Actual_Upper_Sites_20261120.zip'
TIME = 'final67/initial-temporal-haar-zero/'
AUDIT = 'final67/initial-temporal-linear-source-audit/'
PINS = {
    TIME + 'temporal-projection.json': '7172068a3e3a86bb40c04516eaa452d8cf668650b826ddfd7a64b5ee40971af4',
    TIME + 'MathScope_C74_Temporal_Projection_Evidence.zip':
        'd7c9e827f0b88ffa7d51081cbfdb7f8814e5da536a5e10b0d62609eebbd90db2',
    AUDIT + 'temporal-linear-haar.json': 'c828de82323d1dc8717ffb994199a3682d7c78386aba50b6b7b64c639bedd565',
    Y + 'readback.json': '23778ec90e4f976adba23387f8a787ced8854de78b0c5db2b5fe26d681282274',
    Y_ZIP: 'e72f47fe067e4c9b39aa176051d73dd320fa3c2fe9f098d415650d0f2f8c5412',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    y = source(Y + 'readback.json')
    assert y['status'] == 'VERIFIED_ACTUAL_THREE_HIGHER_N4_INGRESS_SITES'
    assert y['archiveSHA256'] == PINS[Y_ZIP]
    assert y['freshArgumentSitesWithAllChecks'] == 41 and y['originalPositiveRadialSites'] == 112
    assert y['nativeInfiniteSemantics'] == 'OPEN'
    assert y['finalJets'] == 0 and y['release'] == 'HOLD'
    sites = y['sourceSiteReadbacks']
    assert [(r['caller'], r['sourceSystem'], r['freshNaturalArguments'],
             r['inheritedNaturalArguments'], r['verifiedNativeArgumentTuples']) for r in sites] == [
                 (121999, 3, 1221, 170, 948), (125199, 5, 652, 170, 1580),
                 (128717, 7, 652, 170, 1997)]
    assert [r['ordinaryNodes'] for r in sites] == [82848, 66338, 74900]
    time = source(TIME + 'temporal-projection.json')
    assert time['status'] == 'VERIFIED_ORIGINAL_NATIVE_P0_JZ0_HIGH_TEMPORAL_LINEAR_HAAR_PROJECTION'
    ids = time['sourceIDs']
    assert (ids['Wrz'], ids['Ez'], ids['temporalPsi'], ids['temporalBeta']) == (
        17753400, 17754268, 19570917, 19570921)
    assert ids['T1Integrals'] == [19570813, 19570814]
    assert ids['haarGr'] == [21374484, 21374485] and ids['radialLimits'] == [17743711,17743713]
    assert ids['P0'] == [21374489, 21374490] and ids['Jz0'] == [21374575,21374576]
    assert ids['nonlinearJzCurrent'] == 21374560
    assert '+epsilon*partial_T beta' in time['exactSign'] and '-epsilon^4/ci' in time['exactSign']

    audit = source(AUDIT + 'temporal-linear-haar.json')
    assert audit['originalStreamNodes'] == 21_681_493 and len(audit['originalSourceSHA256']) == 6
    assert audit['originalStreamSHA256'] == time['streamSHA256']
    assert [audit['nativeDeclarations'][str(i)]['body'] for i in (-16,-17,-18)] == [
        21374489, 21374531, 21374575]
    assert 'All terms linear in the Temporal velocity' in audit['conditional']
    assert time['finalJets'] in (0, '0/67') and audit['finalJets'] in (0, '0/67')
    assert time['release'] == audit['release'] == 'HOLD'

    return {'verifiedLinearDefectMeans': 3, 'verifiedHigherOriginalSites': 3, 'originalFreshArgumentSites': 41, 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation74', date='20261120',
                   verify=verify_evidence)
