"""Package the coupled mean bound, harmonic cancellation, and M4 readback."""

from fractions import Fraction

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation46 import PARENTS as EARLIER


PARENT = '50637e8864623c53d719dfa318e82b5e91ea63c5'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation46_Delta_20261119.zip':
           '5bb0baeaf8ec6355028ca57d79b040fa4d25faa1556ddda67887d59cb6570df4'}
HARMONIC = 'primary-forced-join/active-n3-c5-binding/phase-free-mode-two/'
MEAN = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/mean-coupled-source/'
M4 = 'm4/r108-fragment-provenance-20261119/'
Y = 'y-higher-flow/n4-outer-image/'
CI_H = 'ci-44542662819/'
CI_M = 'ci-44543956526/'
LEAN = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/'
EXTRA = {
    LEAN + 'HarmonicModeTwo.lean': 'd636f28312477914e115c1d0e860d7390f0856131355b99868af6aa5a829d8c1',
    LEAN + 'MeanScaleCoupling.lean': '9c0a68a82007f1f1cd925fa1728032747ce43aa9cd4c12d528c11c78bfe39c73',
    LEAN + 'InverseChart.lean': '1f8d73eca9e401c28776d7e7b030ab00ce3c845bd6a91e6d863a9226fe890283',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':
        'a3eb7867a423e3ee2932068fcdf450e5f8f1ef022344852a35c757db005aa1a3',
}
PINS = {
    MEAN + 'common-threshold-source.json': '2f72eede076eafe81098b075bcb5125a7a1fee2b17fb38617e6cf6962bee1745',
    MEAN + 'laurent-ledger.json': 'aa1bd4662a5bb9fa158608059d15a4bb756ed585d7d4ee9d02199fcb3a4d5076',
    MEAN + 'coupled-algebra.json': 'cc58a83a1011f6e2990b8510f693abd729e27bb9d17cd72641953faf97328a98',
    MEAN + 'coupled-mean-final.json': '9564ba16886f5c26c2367e5a77332cbd5882494dd3a07f4d295d9ef4dd42b721',
    MEAN + 'coupled-readback.json': 'e077a35311f86052ea368d7ad4ab5ec07d398e76f6b8340fb746e3675aab4125',
    MEAN + 'initial-energy-budget.json': '341927d7223f1c0d036f9b1dc3c3317e7d84998e7cb35aebce96445d555a8be5',
    Y + 'representative-guards.json': '36f6f64edfb762d97bdac1c229e74c22fd45ed4b67e1437484b6bb2dbfd4cdb1',
    Y + 'representative-no-guards.json': '4209a52fa6e84f6900362be40cc4029a8cac32e81937ddd6ccad6a2284656974',
    Y + 'outer-images.json': 'c27b0f662c8404be98c7e2427fb1809fcdc06c6cd67a09f19adb603629a4c7fd',
    HARMONIC + 'harmonic-kernel-final.json': '543b5c49d9e70629873426a61090ee2d229f2af9d808bbed31e68520da824f36',
    HARMONIC + 'mode-two-bounds.json': 'ddb27e84bf7c860e52a7ec3ccf3401dec2686f315dd299642205e16bd32c9c70',
    HARMONIC + 'projection/normalized-projection-c4.json':
        '15eabb71b7c60e7401b3cab1e6c4beddfcc1b1fb558fd7376cb68efc5465a024',
    M4 + 'provider-fragment-digests.json': 'ba38497698c047791477203817979ae09603cb3aa549cac3694704384c17d900',
    M4 + 'fragment-public-binding.json': '2e8ad1d4890842b1c52fe899dcee8ba7c41c5cd3cc5f9dda202b9957d4856d35',
    CI_H + 'HarmonicModeTwo.log': 'e3ef724644c3e37807eea9c16dae6a1ce9a64a158ea2ff2d0166855f9fd13aed',
    CI_H + 'run.json': 'b51958ea0b36d6d102ba310e460375daa322e041e3ced7ecc3e046e29046896d',
    CI_M + 'MeanScaleCoupling.log': '350d5e7680669c335a277c8ba74e0cabd5ab21b8e1c42ec8866d7e93df0647ee',
    CI_M + 'InverseChart.log': '9d3818888cbc9ee44e10cfb93d51ba6f2fa1a79793ab469aa11bcb31a0bc8fdb',
    CI_M + 'run.json': '6ce16fe3095eb8d993ce1dda47d0e3852e31fb10f5493965378d2278b0235577',
}


def verify_ci(raw, source, directory, run, names):
    meta = source(directory + 'run.json')
    assert meta['databaseId'] == run and meta['conclusion'] == 'success'
    hashes = raw(directory + 'source-sha256.txt')
    for name, theorem, count in names:
        assert (EXTRA[LEAN + name + '.lean'] + '  MathScope/M3/CD/' + name + '.lean').encode() in hashes
        log = raw(directory + name + '.log')
        assert b'sorryAx' not in log and log.count(b'depends on axioms:') >= count
        assert theorem.encode() in log


def verify_evidence(raw, source):
    for path, digest in PINS.items():
        assert entry(raw(path))['sha256'] == digest, path
    replay = source(HARMONIC + 'harmonic-kernel-final.json')
    assert replay['graphNodes'] == 5640
    assert all(replay['general']['correctedIdentity']) and not all(replay['general']['amplitudeOnlyIdentity'])
    assert all(replay['harmonicCurl']['amplitudeOnlyIdentity'])
    assert replay['harmonicCurl']['incorrectConnectionRejected']
    harmonic = source(HARMONIC + 'mode-two-bounds.json')
    assert harmonic['hostedRun'] == 44528954587 and len(harmonic['positiveSecondHarmonicRows']) == 10
    assert harmonic['pulsePullback']['fixedWOrder4PullbackFactor'] == '625/256'
    assert sum(harmonic['sourceDerivatives']['fiveParameterMultiIndices'].values()) == 126
    projected = source(HARMONIC + 'projection/normalized-projection-c4.json')
    assert projected['projectorDerivativeCoefficients'] == [1, 4, 24, 208, 2400]
    assert sum(projected['sourceNormalDerivativeCounts'].values()) == 210
    assert projected['currentRegistryNormalIdentity'].startswith('OPEN')
    production = source(M4 + 'fragment-public-binding.json')
    assert production['provider']['fragmentCount'] == len(production['matches']) == 14
    assert production['matchedBytes'] == 1125144 and production['snapshot']['bytes'] == 30707818
    assert production['operationalR108'] == 'OPEN'
    assert all(production['negativeControls'].values())
    assert production['offlineCandidate']['providerObservedFragmentsPreserved'] == 14
    threshold = source(MEAN + 'common-threshold-source.json')
    assert threshold['verifiedFullSourceNodes'] == 4456994
    assert threshold['nodes']['127'] == {'op': 'log_positive', 'args': [24]}
    algebra = source(MEAN + 'coupled-algebra.json')
    assert algebra['checkedLaurentRecords'] == 3918
    assert list(map(int, algebra['maximumPositiveDegrees'])) == [187, 6]
    assert Fraction(algebra['strictRemainingMargin']) > 0
    mean = source(MEAN + 'coupled-mean-final.json')
    assert mean['status'] == 'CONDITIONAL_COMPLETE_INITIALIZED_MEAN_WITHIN_RESERVED_BUDGET'
    assert mean['reservedForceFraction'] == '2^-32' and mean['consumedRecords'] == 3918
    assert mean['maximumPositiveDegrees'] == ['187', '6']
    assert [mean[k] for k in ('coefficientComparison', 'radialComparison',
                              'geometricComparison', 'energyBelowOne', 'budgetAboveOne')] == [-1, -1, -1, -1, 1]
    readback = source(MEAN + 'coupled-readback.json')
    assert readback['receiptSHA256'] == PINS[MEAN + 'coupled-mean-final.json']
    assert readback['comparisons']['energyBelowReservedBudget'] == -1
    split = source(MEAN + 'initial-energy-budget.json')
    assert split['meanInputSHA256'] == PINS[MEAN + 'coupled-mean-final.json']
    assert Fraction(split['sufficientInitializedFraction']) == Fraction(41, 2 ** 32)
    outer = source(Y + 'outer-images.json')
    assert outer['checkedRows'] == {'global': 243, 'auxiliary': 972}
    assert outer['distinctPositiveRatios'] == 3
    assert outer['representativeTuple'] == {'X': 4588867, 'eta': 4588872, 's': 4588852}
    assert [len(rows) for rows in outer['frameClasses'].values()] == [6, 18, 24]
    assert outer['representativeGuardReceiptSHA256'] == PINS[Y + 'representative-guards.json']
    guards = source(Y + 'representative-guards.json')
    withheld = source(Y + 'representative-no-guards.json')
    assert len(guards['factsAtInverse']) == 5 and all(guards['factsAtInverse'].values())
    assert guards['targetInverse'] == withheld['targetInverse'] == 4588852
    assert guards['ancestors'] == withheld['ancestors'] == 561
    assert not any(withheld['factsAtInverse'].values())
    verify_ci(raw, source, CI_H, 44542662819,
              [('HarmonicModeTwo', 'mode_two_amplitude_only_of_zero_divergence', 4)])
    verify_ci(raw, source, CI_M, 44543956526,
              [('MeanScaleCoupling', 'initialized_mean_energy_below_budget', 4),
               ('InverseChart', 'chart_joint_scale_preserves_radial', 1)])
    return {'sameLivePositiveModeTwoRows': 10, 'm4ProviderFragments': 14, 'm4MatchedPublicBytes': 1125144,
            'conditionalMeanForceFraction': '2^-32', 'outerIndexedRows': 1215,
            'leanRuns': [44542662819, 44543956526]}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label='MathScope_Goal_Continuation47',
                   date='20261119', verify=verify_evidence, additional_pins=EXTRA)
