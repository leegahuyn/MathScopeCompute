"""Verify and package the first-cycle failure, natural tail and pulse energy evidence."""

from assemble_continuation40 import PARENTS as EARLIER
from assemble_continuation39 import assemble_delta, entry, read_arguments


PARENT = '9cdbd000fb9ee55a6fa22cc9ac5de3458754aa4a'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation40_Delta_20261117.zip':
           '729f821b334366b90692bc5b2bd2d7bba862edbd628e98b38952eafdf8716258'}
HOSTED = 'primary-forced-join/active-n3-c5-binding/hosted-44029534187/'
GAUGE = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/'
FORCED = 'primary-forced-join/active-n3-c5-binding/endpoint/forced-tangent/'
TAIL = 'y-higher-flow/n4-natural-tail/'
ENERGY_CI = 'ci-44529293123/'
TAIL_CI = 'ci-44530264291/'
ADDITIONAL_PINS = {
    '.github/workflows/mathscope-original-primary-c5.yml':
        '8b6101ae21663849813aa8f704b4f0a81ca9a0b2c9b5ec76168245e238a4d04e',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':
        '029fc39ee3718d710b76079bd832dd8623f5b6ea071091a0c4c9a97955f1341e',
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/PulseCutoff.lean':
        'cb83bfbdd9499cc454008ff03284e2bdba1c7024f5f1f4322dab01e4d3afacbc',
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/NaturalTailOrderTwelve.lean':
        '35e085fc7b5a746776cff4ebbcf6175938c6ed99a6900555097187b33d9d1d3b',
}
PINS = {
    HOSTED + 'first-cycle.json': '18bcb6485ac4fcf1ae30dfe1ded334c3f1075d9cdd1f285708ce79da3904b60d',
    HOSTED + 'same-family-mode-two.json': 'c41b935776e89691073a40ead9d2f3bfa800540e8c515f6c785016c94612dcbf',
    HOSTED + 'verified-readback.json': 'f90f848759984378011ad3ee0b84fae71e1cc20d08a18f8fada52f39ad2104da',
    GAUGE + 'spatial-gauge-adapted-factors.json': '4bb22ec082cc23f6bc1211f5e2efd2c7dc416895206e56e09a2f0df8ffca2887',
    GAUGE + 'spatial-phase-source.json': 'de87c70b3f9b035ea2cdbca962bf44707988d95343fdb8e32e409596617b5260',
    GAUGE + 'initialized-budget-adapted-gauge.json': '08f9ca3cba4463286e80341072a6c0d8be6fdc7a3ab3e2618ee416569bf2867d',
    GAUGE + 'weighted-velocity/weighted-velocity-coefficients.json': 'a063ec41e45055397ab3f3eea1df520a7806df690db2b80fe371a5aa8da31356',
    GAUGE + 'weighted-velocity/weighted-mean-bulk-energy.json': '3aa405263d1fafb45e7fef2c461540bbd397f42ed9d4b246c0949e74f060a3ba',
    GAUGE + 'mean-curl/temporal-curl-source.json': '5e6587efa93017d5d33f3ad87fc9f07cab9e59b4fea24fd520c31d9f25e78a39',
    TAIL + 'natural-tail-modulus.json': 'a8a9a7d776ae3c89ddca1ba29719f59971c56ecafb48b6338fcb444377c8933a',
    FORCED + 'n3-tangent-value-growth.json': '430415e806b361e7bf3cb93ec7933fb3550927f7ebd0a98d7332003990bcaac8',
}


def verify_lean(raw, source, directory, run_id, commit, file, names):
    run = source(directory + 'github-run.json')
    assert run['databaseId'] == run_id and run['conclusion'] == 'success'
    assert run['headSha'] == commit
    path = f'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/{file}.lean'
    assert ADDITIONAL_PINS[path] + f'  MathScope/M3/CD/{file}.lean' in raw(directory + 'source-sha256.txt').decode()
    log = raw(directory + file + '.log').decode()
    assert 'sorryAx' not in log and ': error:' not in log
    for name in names:
        assert f"'MathScope.M3.CD.{name}' depends on axioms: [propext, Classical.choice, Quot.sound]" in log


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    cycle = source(HOSTED + 'first-cycle.json')
    assert cycle['stoppedNodes'] == 22032009 and cycle['error']['code'] == 'INVALID_TEMPORAL_OPTIONS'
    assert cycle['stages'][1]['indexedRows'] == 1620
    retry = source(HOSTED + 'retry-run.json')
    assert retry['databaseId'] == 44528954587
    assert retry['headSha'] == '31c067839c27f7575e53a686a7ec10588b8d1b0b'
    stages = retry['jobs'][0]['steps']
    assert next(row for row in stages if row['name'] ==
                'Prepare the original Signed and post-Signed source modules')['conclusion'] == 'success'
    forced = source(HOSTED + 'same-family-mode-two.json')
    assert forced['completeForcedSeal'] and len(forced['full']['checks']) == 805
    assert all(row['pass'] is True for row in forced['full']['checks'])
    gauge = source(GAUGE + 'spatial-gauge-adapted-factors.json')
    assert len(gauge['factors']) == 30 and gauge['largestOriginalComponent'] == 'mean'
    assert gauge['initializedReplaySHA256'] == '9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34'
    budget = source(GAUGE + 'initialized-budget-adapted-gauge.json')
    assert budget['terms'] == 118 and budget['comparison'] == 1
    assert all(row['budgetComparison'] == 1 for row in budget['componentBounds'])
    weighted = source(GAUGE + 'weighted-velocity/weighted-velocity-coefficients.json')
    assert weighted['consumedOldRecords'] == 3924 and len(weighted['consumedOldLeaves']) == 51
    curl = source(GAUGE + 'mean-curl/temporal-curl-source.json')
    assert curl['status'] == 'VERIFIED_SAVED_TEMPORAL_COVARIANT_CURL_SOURCE_IDENTITY'
    assert curl['sourceSHA256'] == gauge['sourceSHA256'] and curl['sourceNodes'] == 4456994
    assert curl['actualPsi'] == 1706770 and curl['actualGamma'] == 1706782
    tail = source(TAIL + 'natural-tail-modulus.json')
    assert tail['sourceNaturalCalls'] == 597 and tail['previouslyUnsupportedSourceCalls'] == 25
    assert tail['originalTailComparisons']['exactComparisons'] == 338
    assert tail['modulus']['supportedRadialOrder'] == tail['modulus']['supportedEtaOrder'] == [0, 12]
    tangent = source(FORCED + 'n3-tangent-value-growth.json')
    assert [row['system'] for row in tangent['rows']] == [1, 5]
    assert all(row['actualProjectedTangencies'] == ['real', 'imaginary'] for row in tangent['rows'])
    verify_lean(raw, source, ENERGY_CI, 44529293123, '6f9e07d138aef1f81b774a00bd2e066143a4846e',
                'PulseCutoff', ('forced_tangent_energy_cancellation', 'forced_shear_energy_bound',
                                'forced_tangent_energy_growth'))
    verify_lean(raw, source, TAIL_CI, 44530264291, '1e14661714850b4b359b5d9ccbf34bd6955590ca',
                'NaturalTailOrderTwelve', ('natural_tail_polynomial_order_twelve',))
    return {'newGithubLeanTheorems': 4, 'naturalSourceCalls': 597, 'naturalTailRationalChecks': 338,
            'spatialGaugeAtoms': 30, 'energyStencilTerms': 118, 'signedIndexedRows': 1620}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label='MathScope_Goal_Continuation41',
                   date='20261119', verify=verify_evidence, additional_pins=ADDITIONAL_PINS)
