"""Package the outer amplitude, Forced pulse, native Y, and operating scope evidence."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation87 import PARENTS as EARLIER


PARENT = 'f69646447882127774eee398acbbd7f7b483b9aa'
PARENTS = {
    **EARLIER,
    'MathScope_Goal_Continuation87_Delta_20261120.zip':
        '9215cd4938c3da61b9b21d3ff47175248332a4b4f63a4d47ea063e0eb0b160a5',
}
ROOT = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/outer-normalized-amplitude/'
PULSE = ROOT + 'pulse-frame/'
LEAN = ROOT + 'lean/'
Y = 'y-higher-flow/picard-native-steps/'
M4 = 'm4/r108/operating-n8-scope/'
LEAN_FILE = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/OuterCovarianceCone.lean'
WORKFLOW = '.github/workflows/mathscope-cd-axial-bridge-20261029.yml'
ADDITIONAL = {
    LEAN_FILE: '39ad3c31db1f2e92a46401fd54dc286d7a49d91d07baa8e8e8e34df3c83dd888',
    WORKFLOW: 'a933f01cfa60066d93aeba3c11e8c1c981810056269b9fa895d15faa6ef0f4bd',
}
PINS = {
    ROOT + 'outer-source.json': '350586b512bfcc9e605feb80c4c0cf3bd32f6520c78abd396eed13147f1f5de7',
    ROOT + 'outer-live.json': '23d3577bc75eb2a6587eb5839a7c6b9f834814e46c335c136fb165757f03aa39',
    ROOT + 'outer-scale.json': '71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa',
    PULSE + 'pulse-frame-caps-final.json': '56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d',
    PULSE + 'MANIFEST.json': 'b5a6bc3a1fd0adec5d8985244c375e8852e6bb73ae36aec2fa52384e1adba34e',
    Y + 'native-picard-steps.json': '6cf52d3f2c05f8173b8640229c270dcdc962da5626f5574927933c2fef9e58b3',
    Y + 'native-replay-manifest.json': 'fe39062cb34a5feb8a9215289ca2174921d29d258117adf8691446ee5e88c7c6',
    M4 + 'fourier-picks.json': 'f16d50416df7dbe493e74076c7f758606f22109dfe08feff3e9ab2ddd5f92f6a',
    M4 + 'live-scene.json': '3405a211ee96a741ee861d643a7cc4c347419db9d210cb69778b9fae679590b3',
    M4 + 'source-access.json': '1de437cd1f55629998bcf4f501cc83281c07ecf28e824897f1c787b24fc79ab3',
}


def verify_evidence(raw, source):
    for path, expected in PINS.items():
        assert len(expected) == 64, f'Finalize the SHA-256 pin for {path}'
        assert entry(raw(path))['sha256'] == expected, path
    manifests = [
        (PULSE, 'MANIFEST.json', 'MathScope.C88.FirstForcedPulsePacket/1'),
        (M4, 'manifest.json', 'MathScope.R1-03.C88.OperatingFiniteScenePacket/1'),
        (Y, 'manifest.json', 'MathScope.C88.OriginalNativePicardStepPacket/1'),
    ]
    for directory, filename, schema in manifests:
        manifest = source(directory + filename)
        assert manifest['schema'] == schema and manifest['files']
        for path, metadata in manifest['files'].items():
            assert entry(raw(directory + path)) == metadata, (directory, path)

    outer = source(ROOT + 'outer-source.json')
    live = source(ROOT + 'outer-live.json')
    scale = source(ROOT + 'outer-scale.json')
    assert outer['status'] == 'EXECUTED_ORIGINAL_TARGET_OUTER_FACTOR_AND_CONE_SOURCE'
    assert live['status'] == 'VERIFIED_SAME_LIVE_OUTER_TARGET_AND_COVARIANCE_MASSES'
    assert scale['status'] == 'VERIFIED_OUTER_CONCENTRATION_POWER_TRANSFER_CONDITIONAL_SOURCE_NORMS'
    assert outer['target']['rawBodies'] == [117767, 117768]
    assert outer['originalOuterFactor']['limits']['range'] == ['0', '1/2']
    assert outer['exactCone']['inverseBounds'] == ['kappa/64', '2']
    assert len(outer['exactCone']['rows']) == 8 and all(row['pass'] for row in outer['exactCone']['rows'])
    assert live['sourceNodes'] == 22155584
    assert live['originalOuterReplaySHA256'] == scale['sourceReplaySHA256'] == PINS[ROOT + 'outer-source.json']
    assert scale['sameLiveSHA256'] == PINS[ROOT + 'outer-live.json']
    bindings = live['lexicalRebuild']['typedTargetBindings']
    assert [row['slot'] for row in bindings] == [32017, 32018]
    assert [row['rebuiltRawBody'] for row in bindings] == outer['target']['rawBodies']
    assert all(row['swapFormalArgsRejected'] and row['outerFormalArgs'] == [4756, 2]
               and row['actualArgs'] == [17732770, 17732775] for row in bindings)
    assert live['target']['actualRadicands'] == [17733801, 17733805]
    masses = live['positiveMasses']
    assert [row['mass'] for row in masses['sameMassAsColumns']] == [17733414, 17733746]
    assert masses['exactProduct'] == 'haar*Ls=Dgeom*r0*Ichi'
    assert scale['controls']['checkedRationalConeCornersAsControls'] == 96
    assert [row['throughOrder'] for row in scale['regularizedLiveTargetCaps']['boundRows']] == list(range(9))
    assert [row['sqrtWOverFourthRootS'] for row in scale['scaleRows']] == [str(2 * j) for j in range(9)]
    assert not scale['scope']['allActiveDomainsAttached']
    assert not scale['scope']['actualRegularConstantsNumericallyEnclosed']

    pulse = source(PULSE + 'pulse-frame-caps-final.json')
    assert pulse['status'] == 'VERIFIED_ALL20_ACTUAL_FIRST_FORCED_FRAME_MATRIX_AND_ORIGINAL_NORMALIZED_PULSE'
    assert len(pulse['firstForcedRows']) == 20
    assert pulse['verifiedNativeMatrixEntries'] == 180 and pulse['verifiedNativeProjectedScalars'] == 120
    assert all(row['samePositiveKAndEpsilon'] and row['normalIsOriginalFrozen']
               and row['noYDerivativeOnMatrix'] and row['exactNegativeOrthogonalProjectionScalars'] == 6
               for row in pulse['firstForcedRows'])
    primary = sum(len(row['checkedBodies']) for row in pulse['actualPrimaryFactorOnEveryChart'])
    assert len(pulse['actualPrimaryFactorOnEveryChart']) == 10 and primary == 100
    cap = pulse['finiteParameterCaps']
    assert 'u*abs(c0)' in cap['commonCapM']
    assert 'Original u=2/kappa>=2' in cap['numberAwareDenominators']['leftBasisScale']
    assert not pulse['numericGradientsEvaluated']
    assert all(record['finalJets'] == 0 and record['release'] == 'HOLD' for record in (outer, live, scale, pulse))

    y = source(Y + 'native-picard-steps.json')
    native = source(Y + 'native-replay-manifest.json')
    assert y['status'] == 'VERIFIED_ORIGINAL_NATIVE_RECURRENCE_AND_RADIAL_RHS_CONDITIONAL_LIMIT'
    assert y['sourceRegistrySHA256'] == native['registrySHA256']
    assert y['sourceStreamSHA256'] == native['sourceSHA256']
    assert y['sourceTypedIngressSHA256'] == '14d32aff0e47f0bc8ca5900799fb4727dd57c91db79580b57f2d51d31cfa0590'
    assert len(y['systems']) == len(native['rows']) == 10
    y_roles = tuple(sum(row[key] for row in y['systems']) for key in (
        'exactFiniteTerms', 'finiteDisplaySums', 'etaRHSAndRadial', 'independentEtaDerivatives'
    ))
    assert y_roles == (180, 240, 240, 900)

    picks = source(M4 + 'fourier-picks.json')
    web = source(M4 + 'live-scene.json')
    access = source(M4 + 'source-access.json')
    assert picks['status'] == 'VERIFIED_ACTUAL_FINITE_NS_SOURCE_TO_OPERATING_PICKS'
    assert picks['operatingHTTPSReceiptSHA256'] == PINS[M4 + 'live-scene.json']
    assert access['provider']['currentVersion'] == 137 and access['provider']['shortHash'] == '9171eb0c'
    assert not access['currentEditablePage']['fullBodyReceived']
    assert picks['exactRationalSourceChecks']['scalars'] == 750
    assert picks['exactRationalSourceChecks']['curlParsevalExact']
    viewport_checks = picks['views']
    assert len(viewport_checks) == len(web['observations']) == 2
    assert all(row['picks'] == 3 and row['immutableDownload'] for row in viewport_checks)
    assert picks['chosenSourcePoint']['exactExportedBytesOnBothViewports']
    assert picks['finalJets'] == 0 and picks['operatingR108'] == 'OPEN' and picks['release'] == 'HOLD'

    lean = source(LEAN + 'receipt.json')
    assert lean['run'] == 44625438914 and lean['conclusion'] == 'success'
    assert lean['head'] == 'f6ffd87dc034feefa118f47a62d48778a6c06c94'
    assert lean['file'] == LEAN_FILE and lean['fileSHA256'] == ADDITIONAL[LEAN_FILE]
    assert lean['theorems'] == ['outer_covariance_cone_weights', 'outer_covariance_positive_mass_lower']
    assert lean['axioms'] == ['propext', 'Classical.choice', 'Quot.sound']
    log = raw(LEAN + 'OuterCovarianceCone.log').decode()
    for theorem in lean['theorems']:
        assert f"'MathScope.M3.CD.{theorem}' depends on axioms: [propext, Classical.choice, Quot.sound]" in log
    assert 'sorryAx' not in log and 'error:' not in log
    shas = raw(LEAN + 'source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256'] + '  MathScope/M3/CD/OuterCovarianceCone.lean' in shas

    return {
        'actualOuterTargets': len(bindings), 'conditionalOuterDerivativeOrder': 8,
        'actualFirstForcedSystems': len(pulse['firstForcedRows']),
        'actualFirstForcedProjectedScalars': pulse['verifiedNativeProjectedScalars'],
        'actualPrimaryPulseBodies': primary,
        'nativeYVolterraComponents': y_roles[0], 'nativeYEtaDerivativePositions': y_roles[3],
        'operatingVersion': access['provider']['currentVersion'],
        'operatingPointerPicks': sum(row['picks'] for row in viewport_checks),
        'operatingByteExactDownloads': sum(row['immutableDownload'] for row in viewport_checks),
        'hostedLeanRun': lean['run'], 'hostedLeanTheorems': len(lean['theorems']),
        'finalN8Comparisons': 0, 'finalJets': 0,
    }


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation88', date='20261120',
                   verify=verify_evidence, additional_pins=ADDITIONAL)
