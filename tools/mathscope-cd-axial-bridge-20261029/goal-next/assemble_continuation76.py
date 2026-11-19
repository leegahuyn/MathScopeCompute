"""Package original Wzz cutoff, exact gamma shift and Lean verification."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation75 import PARENTS as EARLIER

PARENT = '92d57920b73c5ee260b52dc327af11b3fd8b26d9'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation75_Delta_20261120.zip':
           '05cc25b903ed9df7f0bd4f95ba7340a44e8344f15b78976b4a48a07803d48296'}
LEAN = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/CovarianceCutoffCollocation.lean'
EXTRA = {LEAN: '7c3c3fcac9a224277c87056cf3163b24c51e23904b71df4208c45c4d3de7002d'}
CI = 'ci-44597786608/'
WZZ = 'final67/temporal-wzz-three-point/wzz-cutoff.json'
CUT = 'final67/original-mean-radial-cutoff-coefficients/mean-cutoff-coefficients.json'
GAMMA = 'final67/temporal-wzz-gamma/'
PINS = {
    WZZ: '08619494bba81a5d9aa2ed33b5a5c5b2634aee00a9e92dd2178581157974cc35',
    CUT: '0d6065d41dd235fb56cc620af0e1242d8f0ff265256410f7e724e862f67f59b6',
    GAMMA + 'exact-gamma-shift.json': '9d7889d5250115870a41613f2a8857d8c8d1953c4ab6e8df45d20369c2fad029',
    GAMMA + 'wzz-gamma-square.json': 'c94380545a59796c2b4790937c7e2f25d3c987d4167069aaf5ca64c5afd00acd',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    wzz = source(WZZ)
    assert wzz['actual']['application'] == 17753403 and wzz['actual']['actualEarlyEz'] == 17754268
    assert wzz['actual']['actualFreshJzWzzAndGammaSquare'] == [21374536, 21374560]
    assert wzz['actual']['transverseMonomials'] == ['chi^2','chi*chi_prime','chi_prime^2']
    assert wzz['actual']['rowsWithExactC75SiblingMaps'] == 162
    assert wzz['arithmetic']['extraSlowDerivativesForCollocationAndInverse'] == 0
    assert [case['strictOverallFactorUpper'] for case in wzz['arithmetic']['referenceCases']] == [
        '2^130', '2^132']

    cutoff = source(CUT)
    assert cutoff['commonPowerOfTwo'] == 80 and len(cutoff['mixedOrderBoundsTimesX0']) == 4
    assert cutoff['radialLengthCompare3HOver2Pow128'] == cutoff['comparison'] == -1
    assert 'neg' in cutoff['logCap']['upper']
    gamma = source(GAMMA + 'exact-gamma-shift.json')
    assert gamma['native']['gammaExplicitFTC'] == 19570945
    assert gamma['native']['rawClearedDifference'] == 19570949
    assert gamma['exactFTCPolynomial'] == [[['g'],1],[['Jg','chiR','invR'],-1]]
    square = source(GAMMA + 'wzz-gamma-square.json')
    assert square['gammaCharge'] == 23840 and square['wholeHaarSquareCharge'] == 47686
    assert len(square['ordinaryMixedIndices']) == 6 and square['exactHashBoundGammaFTC']
    assert square['finalJets'] == 0 and square['release'] == 'HOLD'

    run = source(CI + 'github-run.json')
    assert (run['databaseId'], run['headSha'], run['status'], run['conclusion']) == (
        44597786608, 'cf6d2adc8a781a274fe36bb565b55ba1ac1a5bda', 'completed', 'success')
    assert (EXTRA[LEAN] + '  MathScope/M3/CD/CovarianceCutoffCollocation.lean').encode() in raw(CI + 'source-sha256.txt')
    log = raw(CI + 'CovarianceCutoffCollocation.log')
    assert b'sorryAx' not in log and b'error:' not in log
    for theorem in ('covariance_cutoff_three_point_bounds','covariance_cutoff_squared_derivative_coefficients'):
        assert f"'MathScope.M3.CD.{theorem}' depends on axioms:".encode() in log
    return {'originalWzzRows':162, 'additionalSlowDirections':0,
            'gammaSquareLogChargeUnits':47686, 'githubLeanRun':44597786608, 'leanTheorems':2, 'finalJets':0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation76', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
