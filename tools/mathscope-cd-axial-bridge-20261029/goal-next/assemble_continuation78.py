"""Package the ordinary mean curl reduction and local repeat parser control."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation77 import PARENTS as EARLIER


PARENT = '1ef020098c7a4fdd89d4b6d748283835db4f516c'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation77_Delta_20261120.zip':
           '0cb09c6d7dd21f460d2de17c0be930d50f874fc0e7d7a5dd8bb71d9df405d2b2'}
LEAN = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/FiveMapMeanGauge.lean'
WORKFLOW = '.github/workflows/mathscope-cd-axial-bridge-20261029.yml'
EXTRA = {LEAN:'f5153fc09d32aa8214693b79622759170e5efb218c9a4152415d28b3366d8f25',
         WORKFLOW:'c0358c00ca1d08ec33ccd1debd0a92c90cc3acfae973353ba8ad83a047434e94'}
CI = 'ci-44601624873/'
MEAN = 'primary-forced-join/active-n3-c5-binding/ordinary-mean-gauge/'
REPEAT = 'primary-forced-join/active-n3-c5-binding/repeat-candidate-compact-readback/'
PINS = {
    MEAN + 'ordinary-mean-reduction.json': '23ef852f8a0b0138342190113fab7ce692fa79cc517c4743e64c82f8cb6ed6a5',
    MEAN + 'five-bump-derivative.json': 'b8608c091a370bab394ef774313e74f4b899947f84373f067874fe92b98bd28a',
    REPEAT + 'check_local_append_core.py': '9509ff06f5337a1e6874d53c8970676369988a93f8e54c0383372464485ebb00',
    REPEAT + 'n1-compact-replay.json': 'f23349c116bcb76d6e25e9a297b4e04da1c36d8a85291f7657d8969eefba8a7b',
}
THEOREMS = (
    'five_map_radial_primitive_curl',
    'five_map_axial_primitive_curl',
    'five_map_axial_cutoff_commutator',
)


def verify_evidence(raw, source):
    for path, expected in PINS.items():
        assert entry(raw(path))['sha256'] == expected, path
    mean = source(MEAN + 'ordinary-mean-reduction.json')
    assert mean['hostedRun'] == 44582875351
    assert mean['status'] == 'VERIFIED_SAME_LIVE_ORDINARY_MEAN_CURL_REDUCTION_CONDITIONAL_FTC_REGULARITY'
    assert mean['ordinaryMeanResidual']['components'] == ['0']*3
    assert mean['ordinaryMeanResidual']['wholeFiveIntegralZeroUsed'] is False
    assert mean['ordinaryMeanResidual']['temporalDesiredGammaSubstituted'] is False
    assert mean['outerEta']['allEtaDerivativesRetained']
    assert mean['controls']['outerEtaRadialResidual']['value'] == '3/4'
    assert mean['controls']['wrongFormalActualRadius']['candidateMinusActualAxial'] == '3/4'
    assert mean['controls']['movingLowerEndpoint']['nativeMinusCurlRadial'] == '-1/2'
    assert mean['scope']['wholeGaugeDifferenceRootsDeclaredZero'] is False
    assert mean['scope']['actualUniformStageCapsClosed'] is False
    assert mean['scope']['finalJets'] == 0 and mean['scope']['release'] == 'HOLD'
    bump = source(MEAN + 'five-bump-derivative.json')
    assert bump['counterControl']['difference'] == '-4'
    assert bump['counterControl']['isOriginalDataCounterexample'] is False
    repeat = source(REPEAT + 'n1-compact-replay.json')
    assert repeat['archivedN1Fixture'] and repeat['allStructuralChecksPassed']
    assert repeat['activeN3AppendChecked'] is False
    assert repeat['counts']['sevenGuardChains'] == 240
    assert repeat['counts']['zeroDataPulseSystems'] == 40
    assert repeat['counts']['exactConjugateVelocityPressurePairs'] == 160
    assert repeat['completeSecondCorrection'] == 'OPEN'
    run = source(CI + 'github-run.json')
    assert (run['databaseId'],run['headSha'],run['status'],run['conclusion']) == (
        44601624873,'9da51cae219298dc4b5e7c3e2d9ac52956b33da2','completed','success')
    assert (EXTRA[LEAN] + '  MathScope/M3/CD/FiveMapMeanGauge.lean').encode() in raw(CI + 'source-sha256.txt')
    log = raw(CI + 'FiveMapMeanGauge.log')
    assert b'error:' not in log and b'sorryAx' not in log
    assert all(f"'MathScope.M3.CD.{name}' depends on axioms:".encode() in log for name in THEOREMS)
    return {'hostedSourceRun':44582875351, 'reducedOrdinaryMeanComponents':3,
            'archivedN1SevenGuardChains':240, 'actualN3AppendGuardReadback':0,
            'githubLeanRun':44601624873,'leanTheorems':3,'finalJets':0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation78', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
