"""Package the original initialized-mean bounds, primary ledger and N1 derivatives."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation90 import FORCED as FORCED_C90, PARENTS as EARLIER, PINS as PINS_C90, ROOT as ROOT_C90


PARENT = '6b9d2f6ac5c0c3ef829006d4f1507fc08a8eccd2'
PARENTS = {
    **EARLIER,
    'MathScope_Goal_Continuation90_Delta_20261120.zip':
        '5e6a291651e94f80281747c7c3929c95b700811f7b05b34d7bb8f0899afaeeb9',
}
ROOT = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/initial-mean-norm/'
PRIMARY = ROOT + 'primary/'
LEAN = ROOT + 'lean/'
Y = 'y-higher-flow/picard-core-derivatives/'
LEAN_HEAD = 'c76ed6cf10acaf413906f52f96d07aa152b31276'
LEAN_RUN = 44634334317
LEAN_FILE = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/MeanReferencePalette.lean'
WORKFLOW = '.github/workflows/mathscope-cd-axial-bridge-20261029.yml'
THEOREM = 'mean_reference_palette_window'
AXIOMS = ['propext', 'Classical.choice', 'Quot.sound']
ADDITIONAL = {
    LEAN_FILE: '8fb757bc87750f354858559cd7c6b32f834f8d69b36e3e146c2ceee3eee5f886',
    WORKFLOW: '4d63b41f78a1cc7322cea574fad8f3be883af8155dbb83674a33f41597f61630',
}
PINS = {
    ROOT + 'initial-mean-caps.json': '2d172188703c2ddb81925eae70fd91252f8df9a743b8ff96ba325a6ac7f9bd1a',
    ROOT + 'radial-b-c5.json': '4dad32cb7f509b0fbb10590bc4dccd0c12f833ab5cf7bc2307c5040eac16d6b8',
    PRIMARY + 'primary-quotient-ledger.json': 'a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244',
    PRIMARY + 'MANIFEST.json': '654bf462ef7cddc59cf6d27b3fb8e23c133d826fe6c9ff37e65adf446992efae',
    Y + 'derivative-intervals.json': '881333f71db27ec1621923365ce1aed318ee0fd9458a2118781740bfd2f303ee',
    Y + 'derivative-operands.json': '991b9ce42da0b6bbda6f076df1818a4b194dbb5343b04a2ecd00b50f14104a3c',
    Y + 'manifest.json': 'f71e2d512fb4a220b975a95ba78489200156be9091be0cbf70b83b9de30d693c',
    'preservation-continuation91.json': 'b3b82a1ca1bad069a0622e795aa42991629712e5a821aaf43517f41a6a6701aa',
}


def verify_mean_and_primary(raw, source):
    mean = source(ROOT + 'initial-mean-caps.json')
    assert mean['status'] == 'VERIFIED_ACTUAL_INITIAL_MEAN_PALETTE_AND_WEIGHTED_C5_RECURRENCE'
    assert mean['sourceNodes'] == 22155584
    assert (mean['actualMeanVelocityJets'], mean['covarianceInputRoles'], mean['shiftedPrimitiveRoles']) == (
        129, 600, 153
    )
    assert mean['fourierInputsBeforeAndAfterExtraL2'] == 169
    assert mean['palette']['bandBounds'] == '1/(8*Tg*S)<ci0<=1/S'
    assert set(mean['rows']) == {'beta', 'v', 'gamma'}
    assert mean['scope']['fullBackgroundRetained'] == ['b', 'R*F', 'G']
    assert mean['scope']['fiveMapAbsentOnlyOnPreviouslyAdmittedOuterCollar']
    assert mean['scope']['sameLiveBackgroundBOverEpsilonC5BoundAttachedOnOriginalSlab']
    assert mean['scope']['actualMeanExtrapolationOutOfOriginalSlabForbidden']
    assert not mean['scope']['allCoefficientsForActualWeightedCovarianceNumericallyBounded']
    assert mean['inputPins']['radialB'] == PINS[ROOT + 'radial-b-c5.json']
    assert mean['inputPins']['factor'] == PINS_C90[FORCED_C90 + 'normalized-first-forced.json']
    assert mean['inputPins']['rawMajorant'] == PINS_C90[ROOT_C90 + 'raw-forcing-majorant.json']
    covariance = mean['primaryCovarianceTransfer']
    assert (covariance['maximumRequiredSlow'],covariance['maximumRequiredL']) == (7,8)
    band = mean['upperBandPowersAfterPuttingThreePerSlowDerivativeIntoC90']
    assert (band['forcedModeOneThroughOrderFour'],band['forcedModeTwoThroughOrderFour']) == ('107/4','16')

    radial = source(ROOT + 'radial-b-c5.json')
    assert radial['schema'] == 'MathScope.C91.OriginalNativeRadialBThroughC5/1'
    assert radial['traceNodes'] == 74575
    assert [row['n'] for row in radial['profileRoots']] == list(range(4))
    assert [row['n'] for row in radial['positive']] == [1, 2, 3]
    assert all(row['ordinaryAndExtraBothRetained'] for row in radial['positive'])
    assert radial['originalLiveSlabThresholdComparison'] == -1
    assert radial['analyticSourceConditionsRetained']

    manifest = source(PRIMARY + 'MANIFEST.json')
    assert manifest['schema'] == 'MathScope.PrimaryQuotientC91Replay/1'
    assert manifest['sourceNodes'] == mean['sourceNodes']
    assert [manifest[k] for k in ('primaryPotentials','primaryScalars','rawForcedScalarPulseChecks')] == [6,100,120]
    files = manifest['producedFiles']
    assert set(files) == {'README.md', 'primary-quotient-ledger.json', 'verify_primary_quotient.py', 'replay.log'}
    for path, expected in files.items():
        assert entry(raw(PRIMARY + path))['sha256'] == expected, path
    primary = source(PRIMARY + 'primary-quotient-ledger.json')
    assert primary['status'] == 'VERIFIED_ACTUAL_PRIMARY_QUOTIENT_BODIES_AND_CONDITIONAL_WEIGHT_DEGREES'
    assert primary['inputPins']['forced'] == PINS_C90[FORCED_C90 + 'normalized-first-forced.json']
    assert primary['sourceStream']['nodes'] == manifest['sourceNodes']
    assert len(primary['exactSameBody']['tenCharts']) == 10
    demand = primary['firstForcedDemand']
    assert demand['nativeRawScalarsChecked'] == 120
    assert len(demand['pulseDerivativeCancellations']) == 20
    assert demand['componentRoleBounds']['1']['u'] == {
        'maxSlow':6, 'maxXi':3, 'maxPulse':1, 'maxTotal':6,
    }
    assert demand['componentRoleBounds']['2']['u']['maxPulse'] == 0
    assert primary['weightedQuotientLedger']['sourceConstantsStillRequired']
    assert all(rec['release'] == 'HOLD' and rec['finalJets'] == 0 for rec in (mean,radial,manifest,primary))

    return {
        'originalMeanVelocityInputJets': mean['actualMeanVelocityJets'],
        'originalMeanCovarianceRoles': mean['covarianceInputRoles'],
        'originalMeanShiftedPrimitiveRoles': mean['shiftedPrimitiveRoles'],
        'originalNativeRadialBPositiveOrders': len(radial['positive']),
        'originalNativeRadialBThresholdComparison': radial['originalLiveSlabThresholdComparison'],
        'originalPrimaryPotentials': manifest['primaryPotentials'],
        'originalPrimaryScalars': manifest['primaryScalars'],
    }


def verify_native(raw, source):
    manifest = source(Y + 'manifest.json')
    assert manifest['schema'] == 'MathScope.C91.OriginalN1CoreDerivativeEvidence/1'
    files = manifest['filesSHA256']
    assert set(files) == {'README.md', 'derivative-intervals.json', 'derivative-operands.json',
                         'replay_core_derivatives.mjs', 'replay.log', 'source-replay.log',
                         'verify_core_derivatives.py'}
    for path, expected in files.items():
        assert entry(raw(Y + path))['sha256'] == expected, path
    receipt = source(Y + 'derivative-intervals.json')
    operands = source(Y + 'derivative-operands.json')
    radial = receipt['uniformRadialDerivative']
    parameter = receipt['uniformEtaDerivativeOnCenterline']
    assert receipt['sourceOperandStatus'] == 'VERIFIED'
    assert receipt['ordinaryIntervalStatus'] == 'CONDITIONAL_ORIGINAL_C47_COEFFICIENT_DOMAIN_AND_C54_CORE_REALIZATION'
    assert receipt['priorOperandSHA256'] == PINS_C90['y-higher-flow/picard-core-interval/core-operands.json']
    assert receipt['priorIntervalSHA256'] == PINS_C90['y-higher-flow/picard-core-interval/core-interval.json']
    assert receipt['derivativeOperandsSHA256'] == PINS[Y + 'derivative-operands.json']
    assert receipt['axisForcingEtaDerivative'] == '48' and receipt['originalEvenProfile'] == 28835
    assert (receipt['actualSystem'],receipt['auxiliarySystem']) == (0,1)
    row = operands['rows'][0]
    assert radial['dXCalls'] == [row['calls']['radialAtC90'],row['calls']['radialAtEtaEdge']] == [117737,117743]
    assert parameter['dEtaCall'] == row['calls']['etaAtSmall'] == 117749
    assert radial['X_star'] == operands['ids']['X'] and radial['eta_width'] == operands['ids']['etaWidth']
    assert parameter['X_small'] == operands['ids']['XSmall']
    assert radial['domain'] == '0<=X<=X_star, abs(eta)<=eta_width'
    assert parameter['domain'] == '0<X<=X_small, eta=0'
    assert radial['interval'] == ['524071/1048576','262253/524288']
    assert parameter['interval'] == ['12582803/1048576','12583021/1048576']
    assert receipt['termsUsedForEachEnclosure'] == 2 and not receipt['largeSourceIndexKEnumerated']
    assert receipt['additionalFinalJets'] == 0 and receipt['release'] == 'HOLD'
    return {'nativeN1CoreDerivativeIntervals':2, 'nativeN1CoreDerivativeCalls':3,
            'nativeN1CoreFiniteTerms':receipt['termsUsedForEachEnclosure']}


def verify_lean(raw, source):
    lean = source(LEAN + 'receipt.json')
    assert lean['run'] == LEAN_RUN and lean['head'] == LEAN_HEAD and lean['conclusion'] == 'success'
    assert lean['file'] == LEAN_FILE and lean['fileSHA256'] == ADDITIONAL[LEAN_FILE]
    assert lean['theorems'] == [THEOREM] and lean['axioms'] == AXIOMS
    log = raw(LEAN + 'MeanReferencePalette.log').decode()
    assert f"'MathScope.M3.CD.{THEOREM}' depends on axioms: [{', '.join(AXIOMS)}]" in log
    assert 'sorryAx' not in log and 'error:' not in log
    shas = raw(LEAN + 'source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256'] + '  MathScope/M3/CD/MeanReferencePalette.lean' in shas
    return {'hostedLeanRun':lean['run'], 'hostedLeanTheorems':len(lean['theorems'])}


def verify_evidence(raw, source):
    for path, expected in PINS.items():
        assert entry(raw(path))['sha256'] == expected, path
    public = source('preservation-continuation91.json')
    assert public['schema'] == 'MathScope.C91.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'],public['bytes']) == (200,30707818)
    assert public['sha256'] == 'a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48'
    assert public['samePublicBodyAsC90']
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'

    return {
        **verify_mean_and_primary(raw, source),
        **verify_native(raw, source),
        **verify_lean(raw, source),
        'operatingByteReadback':public['bytes'],
        'finalN8Comparisons':0,
        'finalJets':0,
    }


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation91', date='20261120',
                   verify=verify_evidence, additional_pins=ADDITIONAL)
