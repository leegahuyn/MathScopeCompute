"""Package the source-bound anisotropic inverse and GitHub Lean results."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation74 import PARENTS as EARLIER

PARENT = '92bbbcd43289ce4c9ce72ab77b8308381a54143e'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation74_Delta_20261120.zip':
           'c477e944b12375a9306cdef88567de34b34b5685a11ec8cc2aab146ece55fb7c'}
LEAN = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/CovarianceCutoffCollocation.lean'
EXTRA = {
    LEAN: 'ab2690b2e5cfb2b8be8ecd5b0b4a134e86e47cb9e647ffdc1a9df84372a2afa4',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml': 'f7ddf82c5d80ec8b015581b9408c322cabb4e81d7f51a41bc178c8bd041abc8b',
}
CI = 'ci-44596465130/'
ANI = 'final67/temporal-wrz-anisotropic/'
LENGTH = 'final67/original-radial-time-length/radial-length-cost.json'
PINS = {
    ANI + 'anisotropic-final.json': 'f549235f4f126ffc2141f4d1a3b3280d25206402a8ba332a961121da0295e013',
    ANI + 'MathScope_C75_Wrz_Anisotropic_Evidence.zip':
        '7c38b574302d07ae8b85150f787625817dd00e5a6ffa83e64cf4e4b0c05cfbe7',
    ANI + 'radial-scalar-final.json': '0eaa89e5d706e71338c494fecb589a54276cb337c1ad0263320feb96b0b369cd',
    LENGTH: '609040736c97e77747f2bb5d191f5dcf6c8fabb7a939e133246a03185d16a4aa',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    ani = source(ANI + 'anisotropic-final.json')
    assert ani['status'] == 'VERIFIED_ACTIVE_N3_WRZ_TRANSVERSE_SHAPE_CONDITIONAL_Z6T_INVERSE_BOUND'
    assert ani['actual']['transverseMonomials'] == ['chi^2', 'chi*chi_prime']
    assert ani['actual']['chiPrimeSquaredTerm'] is False and ani['actual']['rows'] == 162
    assert sorted(row['interior'] for row in ani['actual']['verifiedBodies'].values()) == [17737168, 17740586]
    assert ani['additionalSlowDerivativesForAnisotropicPart'] == 0
    assert ani['conditionalArithmetic']['mixedOrder'] == [0,6,1,0,0]
    assert ani['conditionalArithmetic']['inverseMultiplierLog2Upper'] == 127

    length = source(LENGTH)
    assert length['comparison'] == -1 and length['logTwoLessThanHOverTwoPow128']
    scalar = source(ANI + 'radial-scalar-final.json')
    assert scalar['status'] == 'VERIFIED_TEMPORAL_CI_SOURCE_CONDITIONAL_RADIAL_HIGHEST_ALLOCATION'
    assert scalar['pins']['radial'] == PINS[LENGTH]
    assert scalar['activeIDs']['ci'] == 17745449 and scalar['activeIDs']['T1InverseCi'] == 19570770
    assert [scalar['activeIDs'][key] for key in ('T1Left','T1Whole','a','b')] == [
        19570813,19570814,17743711,17743713]
    assert '(-4+2^-112)H' in scalar['conditionalDirected']

    run = source(CI + 'github-run.json')
    assert (run['databaseId'], run['headSha'], run['status'], run['conclusion']) == (
        44596465130, '16309de14ba8923373f6c9d2528cef1a50fc0fd3', 'completed', 'success')
    hashes = raw(CI + 'source-sha256.txt')
    assert (EXTRA[LEAN] + '  MathScope/M3/CD/CovarianceCutoffCollocation.lean').encode() in hashes
    log = raw(CI + 'CovarianceCutoffCollocation.log')
    assert b'sorryAx' not in log and b'error:' not in log
    for theorem in ('covariance_cutoff_two_point_bound','covariance_cutoff_curvature_coefficients'):
        assert f"'MathScope.M3.CD.{theorem}' depends on axioms:".encode() in log
    return {'actualAnisotropicSourceRows':162, 'additionalSlowDirections':0,
            'actualTemporalCoefficient':17745449, 'conditionalRadialAllocationExponent':'-4+2^-112',
            'githubLeanRun':44596465130, 'leanTheorems':2, 'finalJets':0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation75', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
