"""Package exact order-one axial source identity and active-correction thresholds."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation49 import PARENTS as EARLIER, SPATIAL


PARENT = 'efbdd2a33707125eea9220a3134a90202b488a1c'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation49_Delta_20261120.zip':
           '4d1869e57d5ac9276c131abb8022b935a60cedfba0583c8f4267a3c6509e251a'}
AXIAL = 'axial-order-one-identity/'
LATE = SPATIAL + 'active-correction-bounds/'
CAPS = SPATIAL + 'velocity-potential-caps/'
CI = 'ci-44551494917/'
LEAN = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/'
EXTRA = {
    LEAN + 'AxialSourceSevenFlux.lean': '3697eea77a0c424d87ae718a9c7cd96f2f51a8c11f424dc73b08f16fffc37e2a',
    LEAN + 'CorrectionSpatialBudget.lean': '489d6d2fd9e92b044586066cd9a73e3472bb2b205f77e04024c4c2d707cdd6a3',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':
        '9c38710142c53027d63b5b044c9951e5b5be72a73b27afbbc5dc87d792d8ac2d',
}
PINS = {
    AXIAL + 'source-jet-slice.json': '08b01a36402390dbf272cb4abe677c6a18d6c7f5785fc4853de6d4e6a41b988b',
    AXIAL + 'source-identity.json': 'b36276e700e9a69da8b664be0d190197401725bc49e498780ca991554b4057d2',
    AXIAL + 'collars/axial-collars-verified.json': 'c59f31ab3b4df3893b11b3bc46a2d67b47d74ca7e63634fb607bb358e41dcd61',
    LATE + 'MANIFEST.json': 'c98cbb14884f94e981e8996a0199152cded605422995536e7d412677731c5b95',
    LATE + 'late-spatial-gates.json': '1fa33500726728505f74ed51aae5e113f4c10c452c5faa7a4f823d5a6d2d6a36',
    LATE + 'late-spatial-numerical.json': '49def857fc384fd42308aa9e3e838d2f991544ebc44a0040f7a86d4afdead548',
    CAPS + 'velocity-potential-transfer.json': '902b71a7e9e7cd458e3f1cab668d0cf791f942bc62294ded352c15353e5c1820',
    CAPS + 'directed-velocity-potential-caps.json': '0ac1fa175122e9958261eae1fa19e9cf01b0f59dce1e0106e1ae34ae5b5ea32d',
    CI + 'AxialSourceSevenFlux.log': 'a25c231a47cb2f0a210f79ff33546cce4c9eaa70a237db5e1ef24881576611fc',
    CI + 'CorrectionSpatialBudget.log': '88446610985f82f54082a31308fe07a57fa556742eacd44e304a9b43eaa32986',
    CI + 'source-sha256.txt': '23d382b8eae78fb745e3dda15df1b7a1d341c8afc7c8ed1f9ce6bdadf1d21bb1',
    CI + 'version.txt': '355a9a028f81641782d75d6e6b58dec70f29d2f61238a9e271690259d9bf5680',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    axial = source(AXIAL + 'source-identity.json')
    assert axial['sourceSliceSHA256'] == PINS[AXIAL + 'source-jet-slice.json']
    assert axial['status'] == 'PASS_ACTUAL_N1_SOURCE_RAW_AND_ETA_DIFFERENTIAL_IDENTITIES'
    assert [axial[key] for key in ('originalOrderOneFunction', 'originalOrderOneBody',
            'sourceDensity', 'sourceRaw', 'sourceRawEta', 'sourceSupportedEta')] == [
                672, 117069, 117047, 117045, 213973, 213974]
    assert len(axial['checks']) == 6 and all(row['pass'] for row in axial['checks'].values())
    assert len(axial['negativeControls']) == 3 and all(row['rejected'] for row in axial['negativeControls'].values())
    assert axial['registryNamespaceControl']['N4_672']['name'] == 'ActualCompactSlowCoefficient_565'
    collars = source(AXIAL + 'collars/axial-collars-verified.json')
    assert collars['registrySHA256'] == axial['registrySHA256']
    assert collars['originalPrefix'] == axial['originalPrefix']
    pressure = collars['right']['actualPressureIdentity']
    assert pressure['moment3'] == 71416 and pressure['exactRationalDifferenceZero']
    assert collars['right']['radialV1UsesLiteralZeroAverage']
    repairs = collars['allFiveActualMomentRepairs']
    assert repairs['zeroNumerators'] == len(repairs['rows']) == 5
    assert [row['residual'] for row in repairs['rows']] == list(range(71414, 71419))
    for row in repairs['rows']:
        exact = row['rationalIdentity']
        assert exact['expression'] == row['residual']
        assert exact['pass'] and exact['numeratorMonomials'] == 0
        assert exact['nonzeroDenominatorProofRequired'] and row['omittedCorrectionRejected']
    native = collars['conditionalNativeCalculus']
    assert [frame['source'] for frame in native['fixedEtaCopies']] == [117057, 117066, 117075]
    assert all(frame['formalOrders'] == [0, 1] and frame['noEndpointTerm'] for frame in native['fixedEtaCopies'])
    assert native['radialCopies'] == [117120, 117121, 0]
    assert not collars['conclusions']['allN']
    late = source(LATE + 'late-spatial-gates.json')
    manifest = source(LATE + 'MANIFEST.json')
    for path, expected in manifest['files'].items():
        assert entry(raw(LATE + path)) == expected, path
    assert late['energyIntegerUpper'] == 789303688704 < 2**40
    assert len(late['firstCorrection33SpatialAtoms']) == 33
    stages = source(LATE + 'late-spatial-numerical.json')['rows']
    assert [row['stage'] for row in stages] == [1, 2, 3, 4]
    assert all(row['coarseCandidateUpperComparison'] == 1 and row['actualStageK'] is None for row in stages)
    caps = source(CAPS + 'directed-velocity-potential-caps.json')
    for stage in caps['stages']:
        assert stage['actualWeightedUniformEndpointsCertified'] == 0
        assert set(stage['caps']) == {'U0', 'U1', 'A0', 'A1'}
        assert all(row['comparisonOfBenchmarkLogKUpperToCapLower'] == 1 for row in stage['caps'].values())
    assert len(caps['stages']) == 4
    log_sha = raw(CI + 'source-sha256.txt')
    for name, num in [('AxialSourceSevenFlux', 2), ('CorrectionSpatialBudget', 3)]:
        assert (EXTRA[LEAN + name + '.lean'] + f'  MathScope/M3/CD/{name}.lean').encode() in log_sha
        log = ' '.join(raw(CI + name + '.log').decode().split())
        assert log.count('[propext, Classical.choice, Quot.sound]') == num
        assert 'warning:' not in log
    return {'leanRun': 44551494917, 'leanTheorems': 5, 'actualAxialSourceChecks': 6,
            'axialFaultControls': 3, 'fixedEtaIntegralFrames': 3, 'exactOriginalMomentRepairRows': 5,
            'correctionAmplitudeAllowanceFactor': 8,
            'firstN1SpatialAtoms': 33, 'actualStageBounds': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation50', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
