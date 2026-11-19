"""Package the original first-forced source, weighted variation and native N1 interval."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation89 import PARENTS as EARLIER


PARENT = 'be10265b4382b19c9e21ba29d0a84a441e2fc37b'
PARENTS = {
    **EARLIER,
    'MathScope_Goal_Continuation89_Delta_20261120.zip':
        '7a40e5feb5d11786b9c3d36c98c45477ffc34b4fb52a5e1a16ae4e1f9ff82c09',
}
ROOT = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/forced-normalized-variation/'
FORCED = ROOT + 'source/'
LEAN = ROOT + 'lean/'
Y = 'y-higher-flow/picard-core-interval/'
LEAN_HEAD = '803da719fb3b77c4b628d0a903ced586199985ee'
LEAN_RUN = 44632889517
LEAN_FILE = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ForcedPulseConcentration.lean'
WORKFLOW = '.github/workflows/mathscope-cd-axial-bridge-20261029.yml'
THEOREMS = ['forced_weighted_word_bound', 'forced_pulse_sqrt_band']
AXIOMS = ['propext', 'Classical.choice', 'Quot.sound']
ADDITIONAL = {
    LEAN_FILE: '5a5c317a236532cfea567710603cd29e299083781773110327243326d52b7c3c',
    WORKFLOW: '78116a16ce1a7239ad1e4ede64e993168d3320942b1a8afe4e69c26f89c069e3',
}
PINS = {
    ROOT + 'weighted-variation.json': 'c3ec1fb8ea1bf30ec18c09111440099e921a26c3417d5a47e083e5aa6e85dc37',
    ROOT + 'audit_raw_forcing_majorant.py': '5924e7938c1eeb4453d1dbb59145af080b65f2fe84424f08d941b9c697fc7cc7',
    ROOT + 'raw-forcing-majorant.json': '66ed506c4bbbc1e2108d1aa23d07682e3744a34e1dc9f4e6fe761c009c4fe9c2',
    ROOT + 'README.md': 'd0de68fdc4d647cb50e06fd15a8e1332b858ec896ef5884bda352db674d74f26',
    ROOT + 'replay.log': '3e329d4daf384b57d640d392be88eee01186cbc831ff12a13f3c5c51cd75cf31',
    ROOT + 'verify_weighted_forced_variation.py': 'bc793ae3d6e42755d227fee199322130255f9e21273888d019579db22aa89f2e',
    FORCED + 'normalized-first-forced.json': 'dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d',
    FORCED + 'MANIFEST.json': '9f5d3bf9abe3c6c05058a00e0cacde7fc115504c1fc082e6627de7115f9786c6',
    Y + 'core-interval.json': '6e074bcaabf5634256a771c8318a236e7c1e50df338cd8793ed42110fe019cf1',
    Y + 'core-operands.json': 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d',
    Y + 'manifest.json': 'b06a3126a8ac6387bb4542b4f724e7044e9b382eb29952b3e2053b8c60a41a93',
    'preservation-continuation90.json': 'dae256b416fb8e4d5c9a94b0c31e675fe8b33f645dc8666c19a2a9bd4e050a3c',
}


def verify_forced(raw, source):
    manifest = source(FORCED + 'MANIFEST.json')
    assert manifest['schema'] == 'MathScope.NormalizedFirstForcedC90Replay/1'
    assert (manifest['sourceNodes'], manifest['nativeSystems'], manifest['projectedScalars']) == (22155584, 20, 120)
    assert manifest['release'] == 'HOLD' and manifest['finalJets'] == 0
    produced = manifest['producedFiles']
    assert set(produced) == {'README.md', 'normalized-first-forced.json', 'verify_forced_source_factor.py',
                             'replay.log'}
    for path, expected in produced.items():
        assert entry(raw(FORCED + path))['sha256'] == expected, path

    forced = source(FORCED + 'normalized-first-forced.json')
    assert forced['status'] == 'VERIFIED_SAME_PULSE_GAUSSIAN_FACTOR_ALL_FIRST_FORCED_SCALARS'
    assert forced['sourceStream']['nodes'] == manifest['sourceNodes']
    assert forced['sourceStream']['originalPrefixRecords'] == 22153782
    assert forced['projectedCheckedByMode'] == {'1': 60, '2': 60}
    cases = forced['cases']
    assert len(cases) == manifest['nativeSystems']
    assert sum(len(row['scalars']) for row in cases) == manifest['projectedScalars']
    assert all(row['scalarGaussianPowerBeforeDivision'] == row['mode'] and
               row['powerRemainingAfterDivisionByP'] == row['mode'] - 1 for row in cases)
    assert forced['release'] == 'HOLD' and forced['finalJets'] == 0

    variation = source(ROOT + 'weighted-variation.json')
    assert variation['status'] == 'VERIFIED_ACTUAL_FORCED_JET_DEMAND_AND_CONDITIONAL_CONCENTRATED_VARIATION'
    assert variation['sourceNodes'] == forced['sourceStream']['nodes']
    assert variation['inputPins']['matrix'] == forced['inputPins']['matrix']
    assert variation['inputPins']['frame'] == forced['inputPins']['frame']
    assert [(r['chart'], r['mode'], r['system'], r['nativePulseVariable']) for r in cases] == [
        (r['key'], r['mode'], r['system'], r['pulse']) for r in variation['nativeSystems']
    ]
    assert len(variation['rows']) == variation['distinctDirections'] == 23
    assert variation['complexProjectedRoleDemand'] == 1380 and variation['velocityRoleDemand'] == 750
    assert variation['initialTemporalDemand'] == {'outputJets': 129, 'covarianceRequests': 600, 'WrzSlowOrder': 7}
    assert variation['massBounds']['mode1'] == 'Lmax*S'
    assert variation['massBounds']['mode2'] == '3*sqrt(Lmax/gL)*S^(1/2)'
    assert variation['massBounds']['onlySameAdmittedInterval'] == '0<=t0<=v<=L_s'
    assert variation['scope']['originalForwardPropagatorAndDifferentiationPremisesRetained']
    assert not variation['scope']['wholeRawSourceNormEvaluated']
    assert not variation['scope']['normalizedSolutionNumericalInterval']
    assert variation['scope']['closedFinalN8Comparisons'] == 0
    assert variation['finalJets'] == variation['scope']['finalJets'] == 0
    assert variation['release'] == variation['scope']['release'] == 'HOLD'

    raw_majorants = source(ROOT + 'raw-forcing-majorant.json')
    assert raw_majorants['schema'] == 'MathScope.C90.ForcedRawPositiveCoefficientMajorant/1'
    assert raw_majorants['inputPins']['source'] == PINS[FORCED + 'normalized-first-forced.json']
    assert raw_majorants['inputPins']['variation'] == PINS[ROOT + 'weighted-variation.json']
    assert raw_majorants['baseNormalizedExactMonomials'] == {'1': 3080, '2': 1270}
    assert raw_majorants['unprojectedScalars'] == 120
    groups = raw_majorants['firstAndSecondModeCoefficientGroups']
    assert [len(groups[str(mode)]) for mode in (1, 2)] == [33, 5]
    assert {row['explicitFrozenEpsilonPower'] for row in groups['1']} == {0, 1, 2, 3}
    assert {row['explicitFrozenEpsilonPower'] for row in groups['2']} == {0, 1}
    assert not raw_majorants['scope']['provenNumericalUniformNorm']
    assert raw_majorants['scope']['implicitEpsilonInSourceOperandsRetained']

    return {
        'originalFirstForcedProjectedScalars': manifest['projectedScalars'],
        'originalFirstForcedNativeSystems': manifest['nativeSystems'],
        'forcedVariationDirections': variation['distinctDirections'],
        'complexProjectedRoleDemand': variation['complexProjectedRoleDemand'],
        'velocityRoleDemand': variation['velocityRoleDemand'],
        'exactNormalizedForcingMonomials': sum(raw_majorants['baseNormalizedExactMonomials'].values()),
        'positiveCoefficientGroups': sum(map(len, groups.values())),
    }


def verify_native(raw, source):
    manifest = source(Y + 'manifest.json')
    assert manifest['schema'] == 'MathScope.C90.OriginalNativeN1CoreValueEvidence/1'
    files = manifest['filesSHA256']
    assert set(files) == {'README.md', 'core-interval.json', 'core-operands.json', 'replay_core_value.mjs',
                          'replay.log', 'verify_core_interval.py'}
    for path, expected in files.items():
        assert entry(raw(Y + path))['sha256'] == expected, path

    interval = source(Y + 'core-interval.json')
    operands = source(Y + 'core-operands.json')
    assert interval['sourceOperandStatus'] == 'VERIFIED'
    assert interval['ordinaryIntervalStatus'] == 'CONDITIONAL_ORIGINAL_C47_COEFFICIENT_DOMAIN_AND_C54_CORE_REALIZATION'
    assert interval['sourceNodesChecked'] == 7358162
    assert interval['sourceRegistrySHA256'] == operands['registrySHA256']
    assert interval['profileSHA256'] == operands['parameterExpressionSHA256']
    assert interval['coreOperandsSHA256'] == PINS[Y + 'core-operands.json']
    assert (interval['system'], interval['component'], interval['originalEvenProfile']) == (0, 1, 28835)
    assert interval['sourceAxisForcing'] == '4*A*j0'
    input_point = interval['actualCoreInput']
    assert input_point['eta'] == 0 and input_point['admitted'] == '0<X<Xa, eta=0'
    assert (input_point['X'], input_point['Y'], input_point['Xa']) == (
        operands['ids']['X'], operands['ids']['Y'], operands['ids']['Xa'])
    assert interval['application'] == operands['rows'][0]['application']
    assert interval['normalizedEnclosure'] == ['524233/1048576', '65543/131072']
    assert interval['termsGenerated'] == interval['termsUsedForEnclosure'] == 2
    assert not interval['largeSourceIndexKEnumerated']
    assert not interval['globalJetRowsPromoted'] and not interval['allNativeYRowsPromoted']

    return {
        'nativeN1CorePointsEnclosedConditionally': 1,
        'nativeN1CoreNormalizedInterval': interval['normalizedEnclosure'],
        'nativeN1CoreFiniteTerms': interval['termsGenerated'],
    }


def verify_lean(raw, source):
    lean = source(LEAN + 'receipt.json')
    assert lean['run'] == LEAN_RUN and lean['head'] == LEAN_HEAD and lean['conclusion'] == 'success'
    assert lean['file'] == LEAN_FILE and lean['fileSHA256'] == ADDITIONAL[LEAN_FILE]
    assert lean['theorems'] == THEOREMS and lean['axioms'] == AXIOMS
    log = raw(LEAN + 'ForcedPulseConcentration.log').decode()
    for theorem in THEOREMS:
        line = f"'MathScope.M3.CD.{theorem}' depends on axioms: [{', '.join(AXIOMS)}]"
        assert line in log
    assert 'sorryAx' not in log and 'error:' not in log
    shas = raw(LEAN + 'source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256'] + '  MathScope/M3/CD/ForcedPulseConcentration.lean' in shas
    return {'hostedLeanRun': lean['run'], 'hostedLeanTheorems': len(lean['theorems'])}


def verify_evidence(raw, source):
    for path, expected in PINS.items():
        assert entry(raw(path))['sha256'] == expected, path
    public = source('preservation-continuation90.json')
    assert public['schema'] == 'MathScope.C90.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'], public['bytes']) == (200, 30707818)
    assert public['sha256'] == 'a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48'
    assert public['samePublicBodyAsC89'] and not public['newAuthenticatedEditableBody']
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'

    return {
        **verify_forced(raw, source),
        **verify_native(raw, source),
        **verify_lean(raw, source),
        'operatingByteReadback': public['bytes'],
        'finalN8Comparisons': 0,
        'finalJets': 0,
    }


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation90', date='20261120',
                   verify=verify_evidence, additional_pins=ADDITIONAL)
