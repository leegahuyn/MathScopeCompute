"""Package the actual angular moment and conditional Signed radial transfer."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation85 import PARENTS as EARLIER


PARENT = '20b8e544e04e3ee60f88bd2d4d7a3082787bd964'
PARENTS = {
    **EARLIER,
    'MathScope_Goal_Continuation85_Delta_20261120.zip':
        '320f06b367991e926d0298cd249d9438ded7da9f22fd94e6da86dc6066a3baf6',
}
ROOT = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/signed-polynomial-shell/'
ADDITIONAL = {
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ShellGaussianPrimitive.lean':
        '7ca9d61e5c93d7ddd3a6989168d60e1b6b32bcbc38e560355c3e9d98044ff7ab',
}
PINS = {
    'signed-cubic-transfer.json': 'ccb89be13cc70fc69257ffe594b3f4bf5e4fd7d9a8a99c23cd1a3bdf784f18aa',
    'original-angular-cancellation.json': '4f26dab68019dedd61a5cf39a7b2e20ea6fc6213d738a2ff1ec9241fd6207117',
    'original-angular-eta.json': '0e9c0536e8ebeff64e8465e8267b8507378d574d7932f24cd1826509b54bd8f7',
    'initial-temporal/initial-temporal.json': '8c2c1641bf425268451c2ef8564777c942eceb4a3a9092602a0686c88c49c460',
    'whole-angular/whole-angular.json': '4b2cca313683e017756849e89e8153c81020d9736b3da8f97a7ead0127f2941e',
    'lean/ShellGaussianPrimitive.log': '498e2b58eca41fcd57c6c92f1e6345a4ee7ca0740864ffc22266f0f2c0e765b3',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(ROOT + path))['sha256'] == pin, path
    manifest = source(ROOT + 'whole-angular/manifest.json')
    for path, metadata in manifest['files'].items():
        assert entry(raw(ROOT + 'whole-angular/' + path)) == metadata, path

    signed = source(ROOT + 'signed-cubic-transfer.json')
    stress = signed['isolatedOriginalAngularContribution']
    assert signed['outerOriginalCutoff']['maximumGuaranteedPole'] == 63
    assert len(signed['exactSignedTargets']) == 6
    assert stress['residualPoles'] == [6, 9, 12] and stress['sigmaPoles'] == [3, 6, 9, 12]
    assert [row['signedPole'] for row in stress['signedJets']] == ['3/2', '9/2', '15/2', '21/2']
    assert signed['scope']['actualCompleteWeightedHaarResidual'] == 'OPEN'

    original = source(ROOT + 'original-angular-cancellation.json')
    eta = source(ROOT + 'original-angular-eta.json')
    rows = source(ROOT + 'whole-angular/whole-angular.json')
    assert original['graph']['nodeCount'] == 131080
    assert original['leadingAngular']['preHeatConstant']
    assert original['tangentialWhole']['theta']['originalTotal'] == 117072
    assert original['tangentialWhole']['axial']['originalTotal'] == 117075
    assert original['originalAngularTimeAndFlux']['exactInverseRows'] == [True, True]
    assert eta['originalReplaySHA256'] == PINS['original-angular-cancellation.json']
    assert eta['sameLiveOriginalPrefix']['nodes'] == 117100
    assert set(eta['sameLiveOriginalPrefix']['nativePrefixes']) == {'quadratic', 'monotone', 'picard', 'expression'}
    assert eta['sameLiveOriginalPrefix']['nativePrefixes']['expression']['matchedMaterializer']
    assert eta['outerEtaWeightMajorant']['constants'] == [8, 16, 400]
    assert eta['wholeMomentStatus'] == 'CONDITIONAL_ACTUAL_ORIGINAL_ORDER_ONE'
    assert [row['root'] for row in rows['currentMomentSource']['actualRows']] == [14246833, 14246841]
    assert rows['I2SourceRowOnly']['identityExactArithmetic']
    assert all(not row['allOrdersConstructed'] and row['finalJets'] == 0 and row['release'] == 'HOLD'
               for row in (original['scope'], eta))

    temporal = source(ROOT + 'initial-temporal/initial-temporal.json')
    assert temporal['sourceStream']['nodes'] == 22155584
    assert [row['actualZeroModeSubtraction'] for row in temporal['centeredInitialTemporal']] == [19561026, 19563365]
    assert [row['negativeStressArm'] for row in temporal['centeredInitialTemporal']] == [17744077, 17744195]
    assert len(temporal['pressurePaths']) == 2

    lean = source(ROOT + 'lean/receipt.json')
    assert lean['run'] == 44621136369 and lean['conclusion'] == 'success'
    assert lean['initialRun']['run'] == 44620009108 and lean['initialRun']['conclusion'] == 'failure'
    assert lean['fileSHA256'] == ADDITIONAL[lean['file']]
    log = raw(ROOT + 'lean/ShellGaussianPrimitive.log').decode()
    assert 'MathScope.M3.CD.' + lean['addedTheorem'] in log
    assert all(log.count(axiom) == 4 for axiom in lean['axioms'])
    assert 'sorryAx' not in log and 'error:' not in log
    assert 'error: Type mismatch' in raw(ROOT + 'lean/initial-compile.log').decode()
    shas = raw(ROOT + 'lean/source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256'] + '  MathScope/M3/CD/ShellGaussianPrimitive.lean' in shas

    return {'actualAngularWholeIntegral': 117072, 'sameOriginalNodes': 117100,
            'angularOrdinaryEtaOrders': [0, 1, 2], 'shortIntegralDistanceGain': 3,
            'initialTemporalCenterings': 2, 'signedPotentialBodies': 6,
            'hostedLeanRun': lean['run'], 'hostedLeanTheorems': 1,
            'finalN8Comparisons': 0, 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation86', date='20261120',
                   verify=verify_evidence, additional_pins=ADDITIONAL)
