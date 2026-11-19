"""Package the joined initial annular energy and original N4 representative evidence."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation48 import PARENTS as EARLIER


PARENT = '92f38334476cc8bfd4eef7110b0a745fe0429715'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation48_Delta_20261119.zip':
           '1c0793b208e2510fdbd034b7fdf8fb02dab090d382f0103cb93f69bba32f5d21'}
SPATIAL = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/'
WAVE = SPATIAL + 'wave-coupled-source/'
JOIN = SPATIAL + 'initial-energy-join/'
Y = 'y-higher-flow/n4-representative-proof/'
CI = 'ci-44548219226/'
M4 = 'm4/production-readback-20261119/provider-editable-body-attempt.json'
PROOF = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/InitializedEnergyJoin.lean'
EXTRA = {
    PROOF: '6734cb3f3c6dccf6b7532f164d7ee4ff4396da8e9d0653f15ad39c8eb5bdcde2',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':
        '15c1596fc94cc4591ff87114ff13a176d0af6a249f0be2324394edd11b34105f',
}
PINS = {
    WAVE + 'wave-energy-ledger.json': 'b06a3591051ef0f0ac15896c7ed88b264bdd9a7c3891c0d84f0b471488d1f4f3',
    WAVE + 'initial-wave-energy.json': '4ed57a5a6b3bc42bbc29cb2bef47e1af8be732538526e1beb66baf3c32c6253e',
    WAVE + 'wave-readback.json': '07323ad1025c0718c79b47d43513b382824bf14e35c3cbf14e2030543ef1642d',
    WAVE + 'wave-scaling-audit.json': '8449f4d69c69be685da2723edd3d14b511a741fd5feca555981fb6468fe2403f',
    JOIN + 'initialized-annular-energy.json': '7971d64d1710a048995fdc206aaa805aafe9ecf0b5ad597c88e78920c3c49588',
    Y + 'radial-ingress.json': 'a8078037864a574934015163866e726fed0a52710f11b711a24d34fddae7126e',
    Y + 'radial-no-binders.json': '8177955b89932b839deba3981fd53084c8fb66c24817e722eafae479070f51fc',
    Y + 'representative-slice.json': '0003fd9081a4b2c8771291315bd3589d13da567b21b37c5d6066e8b8e2fb8292',
    Y + 'representative-replay.json': 'e77d333755a32ab47d922c8788df1d8a06b85e371530f050be44920fab9e25fc',
    CI + 'InitializedEnergyJoin.log': '21b25a0b687e35e1886501b56aa10a49921fbcb1304fe1c0487593d10e0d3189',
    CI + 'version.txt': '355a9a028f81641782d75d6e6b58dec70f29d2f61238a9e271690259d9bf5680',
    CI + 'source-sha256.txt': '064a2edaa02ecea67b3badfd8ad887a7e8a7936a2048ccea50f77ac13e45aea5',
    M4: 'b40311fb2224a426902a5719ca24829f2d14fb9b0c4663e14b8ef8929314f5c3',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    wave = source(WAVE + 'initial-wave-energy.json')
    readback = source(WAVE + 'wave-readback.json')
    assert wave['reservedForceFraction'] == '2^-32' and wave['strictlyStrongerThanRequested']
    assert wave['consumedRecords'] == readback['checkedReachableDegreeRecords'] == 1070
    assert wave['positiveDegrees'] == readback['positiveDegrees'] == ['34', '2']
    assert readback['energySHA256'] == PINS[WAVE + 'initial-wave-energy.json']
    assert readback['ratioStrictlyBelowOne'] and all(x['strict'] for x in readback['strictComparisons'])
    join = source(JOIN + 'initialized-annular-energy.json')
    for path, pin in join['evidenceSHA256'].items():
        assert entry(raw(path))['sha256'] == pin, path
    assert join['triangleOnlyFractionStrictUpper'] == '9/1073741824'
    assert join['initializedEnergyFractionStrictUpper'] == '13/2147483648'
    assert join['initializedBudgetFraction'] == '1/67108864'
    assert join['N706'] == join['N805'] == 'OPEN' and join['finalJets'] == 0
    selected = source(Y + 'representative-replay.json')
    assert selected['status'] == 'PASS_EXACT_ORIGINAL_SELECTED_CONSTRUCTION'
    assert selected['sliceSHA256'] == PINS[Y + 'representative-slice.json']
    assert selected['exactOriginalRoots']['s'] == 4588852
    assert selected['actualNativeTieSubstitutionResult'] == 4588837
    for name, bounded in [('radial-ingress.json', True), ('radial-no-binders.json', False)]:
        outcome = source(Y + name)
        assert outcome['targetCount'] == len(outcome['frames']) == 24
        assert outcome['binderCount'] == 9
        assert all(row['positiveIntervalBinderDominates'] is bounded for row in outcome['frames'])
    log = ' '.join(raw(CI + 'InitializedEnergyJoin.log').decode().split())
    assert log.count('[propext, Classical.choice, Quot.sound]') == 2
    assert 'primary_wave_log_allowance' in log and 'initialized_energy_of_three_component_bounds' in log
    assert (EXTRA[PROOF] + '  MathScope/M3/CD/InitializedEnergyJoin.lean').encode() in raw(CI + 'source-sha256.txt')
    m4 = source(M4)
    assert m4['withoutContent']['version'] == 137 and not m4['withContent']['bodyReturned']
    assert m4['editableSourceMapping'] == 'OPEN'
    return {'leanRun': 44548219226, 'leanTheorems': 2, 'waveCoefficientRecords': 1070,
            'triangleForceFraction': '9/2^30', 'orthogonalForceFraction': '26/2^32',
            'representativeOriginalRoots': 6, 'radialIntegralSubstitutions': 24}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation49', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
