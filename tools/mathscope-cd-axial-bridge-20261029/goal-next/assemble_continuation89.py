"""Package the fixed-label source norm, matrix ledger and actual Picard tail."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation88 import PARENTS as EARLIER


PARENT = 'f2b8c62a74669bd260aad6c0a824abeff1c3bbfb'
PARENTS = {
    **EARLIER,
    'MathScope_Goal_Continuation88_Delta_20261120.zip':
        '0915d654e4564c31da9336c0497ac21bbaba35b9ff8690cefee4b978c112aadb',
}
ROOT = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/outer-fixed-label-norm/'
MATRIX = ROOT + 'matrix/'
LEAN = ROOT + 'lean/'
Y = 'y-higher-flow/picard-native-tail/'
LEAN_HEAD = 'ff3017b96f259c96fa8d7756fb792bf2b0a367e5'
LEAN_FILE = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/FixedBandWeight.lean'
WORKFLOW = '.github/workflows/mathscope-cd-axial-bridge-20261029.yml'
ADDITIONAL = {
    LEAN_FILE: '512dae6f75f7603827fa6b737667fd488b11d8446bc60a8f5cdea7bb8553853e',
    WORKFLOW: '1de1d9773b087db79ba8d69be64aa480861af01616c9050362384647fdad3ed4',
}
PINS = {
    ROOT + 'background-original.json': '5571e8d0784be04e71f1b4f0531caf71578fe7a646669e958e81a3329a008eb3',
    ROOT + 'background-transport.json': '0b7c13076805acc97cd45e3e4e70e6f7620950744dc493dbff26d0644ff977cc',
    ROOT + 'band-weight.json': '4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0',
    MATRIX + 'matrix-s-j.json': 'e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36',
    MATRIX + 'MANIFEST.json': '5c8562835fc7dd9e18a9c680e0c7fc74e65bb76422a41c93a4e5dafd30b2aec7',
    Y + 'picard-tail.json': 'e328c3e06763a28c0c5ee77e7e78625239dc26e2cec62f17190b66c1a39424ba',
    Y + 'manifest.json': 'f15b11469d50164a57fa459623b03ee3cdf03e087623c9cfbf274be0da96b5d3',
    'preservation-continuation89.json': 'aec2328a4c307e7dd0336df938bb525ab84de641545c111079767118e13c11de',
}


def verify_evidence(raw, source):
    for path, expected in PINS.items():
        assert entry(raw(path))['sha256'] == expected, path

    matrix_manifest = source(MATRIX + 'MANIFEST.json')
    assert matrix_manifest['schema'] == 'MathScope.NormalizedMatrixC89Replay/1'
    assert matrix_manifest['sourceNodes'] == 22155584 and matrix_manifest['mixedIndices'] == 165
    assert matrix_manifest['producedFiles']
    for path, expected in matrix_manifest['producedFiles'].items():
        assert entry(raw(MATRIX + path))['sha256'] == expected, path
    native_manifest = source(Y + 'manifest.json')
    assert native_manifest['schema'] == 'MathScope.C89.LiveNativePicardTail/1'
    assert native_manifest['files'] and native_manifest['release'] == 'HOLD'
    for path, metadata in native_manifest['files'].items():
        assert entry(raw(Y + path)) == metadata, path

    original = source(ROOT + 'background-original.json')
    background = source(ROOT + 'background-transport.json')
    weight = source(ROOT + 'band-weight.json')
    matrix = source(MATRIX + 'matrix-s-j.json')
    assert original['schema'] == 'MathScope.C89.OriginalBackgroundCoefficientRoles/1'
    assert original['coordinates'] == {'X': 4756, 'eta': 2}
    assert [row['order'] for row in original['prefixRows']] == [0, 1, 2, 3]
    assert background['status'] == 'VERIFIED_ORIGINAL_N3_BACKGROUND_AND_HAAR_FRAME_OPERAND_TRANSPORT'
    assert background['inputPins']['original'] == PINS[ROOT + 'background-original.json']
    assert background['sourceNodes'] == matrix['sourceStream']['nodes'] == 22155584
    assert background['inputPins']['stream'] == matrix['sourceStream']['sha256']
    assert background['inputPins']['registry'] == matrix['inputPins']['registry']
    assert background['leadingAndCoefficientPrefixNodes'] == original['sourceCount'] == 123870
    background_fields = background['actualBackground']['fields']
    assert [row['field'] for row in background_fields] == ['F', 'G']
    for row in background_fields:
        field = row['field']
        assert row['coefficientRoots'] == [item[field] for item in original['prefixRows']]
        matrix_field = matrix['sameLiveMatrixBinding']['physicalFieldBindings'][field]
        assert row['physicalSlot'] == matrix_field['nativeSlot']
        assert row['nativeRoot'] == matrix_field['sourceRootAndFirstRZTJets'][0]
        assert row['actualProfileArguments'] == [17732776, 17732770, 17732775]
    assert background['actualBackground']['swappedFieldAndOrderControlsRejected']
    assert [row['actualHaarMass'] for row in background['actualCovarianceFamilies']] == [17733414, 17733746]
    assert all(row['GaussianFixedSlow'] and not row['nativeInternalSourceAuthenticated']
               for row in background['actualCovarianceFamilies'])
    assert background['scope']['derivativeOrder'] == 10
    assert background['pointwiseInputCap']['originalStrictBudgetComparisonOnLiveSlab'] == -1
    assert not background['scope']['nativeWholeBandNumericalGradientsEnclosed']

    assert matrix['status'] == 'VERIFIED_ACTUAL_NORMALIZED_MATRIX_SOURCE_AND_CONDITIONAL_S_J_DERIVATIVE_CAP'
    audit = matrix['sharpBandDegreeAudit']
    assert audit['distinctMixedMultiIndicesAudited'] == 165
    assert audit['slowDirections'] == ['R', 'Z', 'T'] and audit['zeroDerivativeInCommonTorusDirections']
    assert audit['homogeneousInitialDataIsConstant'] == [1, 0]
    assert [row['matchedHomogeneousPulseBandPower'] for row in audit['sourceTargetBandTransfer']] == list(range(2, 17, 2))
    assert [row['normalizedZeroDataForcedBandPowerIfRHS_jIsWeightedS^j']
            for row in audit['sourceTargetBandTransfer']] == list(range(3, 18, 2))
    assert matrix['sameLiveMatrixBinding']['preciseSourceInputBoundary']['finiteSourceC8ScopeDoesNotProduceC9']

    assert weight['status'] == 'VERIFIED_SOURCE_BAND_WEIGHT_JOIN_CONDITIONAL_ORIGINAL_CONE'
    assert weight['inputPins']['sameLiveBackground'] == PINS[ROOT + 'background-transport.json']
    assert weight['inputPins']['matrix'] == PINS[MATRIX + 'matrix-s-j.json']
    assert weight['actualLabel']['ell'] == background['actualBackground']['frozenBandCoordinate']
    assert [row['slowBackgroundOrderRequired'] for row in weight['scaleTransfer']] == list(range(1, 10))
    assert [row['tangentOverGaussianPower'] for row in weight['scaleTransfer']] == list(range(0, 17, 2))
    assert [row['covarianceAndAmplitudePowers']['sqrtWOverFourthRootS']
            for row in weight['scaleTransfer']] == [str(2 * j) for j in range(9)]
    assert weight['lemmaApplication']['rho'] == '1/1048576'
    assert weight['lemmaApplication']['rangeOfPolynomialDegree'] == ['0', '64']
    assert weight['lemmaApplication']['unadmittedSmallLabelControlRejected']
    assert weight['scope']['sourceConeAndPulsePropagatorPremisesRetained']
    assert not weight['scope']['allAdmittedSlowAndFrozenBoundaryNumericalConstants']
    assert not weight['scope']['fullProjectedForcingAndPressure']
    assert all(record['finalJets'] == 0 and record['release'] == 'HOLD'
               for record in (background, matrix, matrix_manifest, weight))

    y = source(Y + 'picard-tail.json')
    assert y['status'] == 'VERIFIED_LIVE_SOURCE_TAIL_FORMULAS_AND_EXACT_SYMBOLIC_INDEX_DOMINANCE'
    assert y['nativeRecurrencePriorSHA256'] == '6cf52d3f2c05f8173b8640229c270dcdc962da5626f5574927933c2fef9e58b3'
    assert y['parameterExpressionSHA256'] == original['parameterExpressionSHA']
    assert y['sameOriginalPrefixNodes'] == 130348 and y['scalarGraphNodes'] == 3286
    assert y['tailRequests'] == 260 and y['wrongCauchyFactorControl'] == 240
    assert sorted(row['system'] for row in y['sourceSystems']) == list(range(10))
    assert all(row['queries'] == 26 and row['omittedCauchyNumeratorFactorRejected'] == 24
               for row in y['sourceSystems'])
    assert y['bootstrapHistorical']['K'] == 24835 and y['bootstrapHistorical']['sourceBits'] == 128
    assert y['tailInequalities']['log2KconditionLower'] == '768*2^1048576'
    assert y['tailInequalities']['evaluatedKSelection'] == 'exactly Kcondition for requested branches and historical bootstrap'
    assert y['release'] == 'HOLD'

    public = source('preservation-continuation89.json')
    assert public['requestMethod'] == 'GET' and [public['status'], public['bytes']] == [200, 30707818]
    assert public['sha256'] == 'a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48'
    assert public['priorSnapshotExactBytesMatch'] and not public['editableProviderSourceDerived']
    provider = public['providerMetadata']
    assert [provider['version'], provider['versionHash'], provider['storedPageBytes']] == [137, '9171eb0c', 29580450]
    assert not provider['currentVersionWithinHistoryTier'] and provider['tierVersions'] == 0
    assert public['editableRead']['diagnostic'] == 'Transport closed' and not public['editableRead']['bodyReceived']
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'
    lean = source(LEAN + 'receipt.json')
    assert lean['run'] == 44630491627
    assert lean['conclusion'] == 'success' and lean['head'] == LEAN_HEAD
    assert lean['file'] == LEAN_FILE and lean['fileSHA256'] == ADDITIONAL[LEAN_FILE]
    assert lean['theorems'] == ['fixed_band_weighted_polynomial']
    assert lean['axioms'] == ['propext', 'Classical.choice', 'Quot.sound']
    log = raw(LEAN + 'FixedBandWeight.log').decode()
    assert "'MathScope.M3.CD.fixed_band_weighted_polynomial' depends on axioms: [propext, Classical.choice, Quot.sound]" in log
    assert 'sorryAx' not in log and 'error:' not in log
    shas = raw(LEAN + 'source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256'] + '  MathScope/M3/CD/FixedBandWeight.lean' in shas

    return {
        'actualBackgroundFields': len(background_fields),
        'fixedLabelBackgroundDerivativeOrder': background['scope']['derivativeOrder'],
        'conditionalNormalizedMatrixMixedIndices': audit['distinctMixedMultiIndicesAudited'],
        'actualNativePicardTailRequests': y['tailRequests'],
        'actualNativePicardTailSystems': len(y['sourceSystems']),
        'operatingByteReadback': public['bytes'],
        'operatingVersion': provider['version'],
        'hostedLeanRun': lean['run'], 'hostedLeanTheorems': len(lean['theorems']),
        'finalN8Comparisons': 0, 'finalJets': 0,
    }


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation89', date='20261120',
                   verify=verify_evidence, additional_pins=ADDITIONAL)
