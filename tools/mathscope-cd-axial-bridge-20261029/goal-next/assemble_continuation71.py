"""Package the N7/N8 target, N8 pressure and N4 Y source readbacks."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation70 import PARENTS as EARLIER

PARENT = 'f8f789ebff678f6eb071c56c6b63112e5abf5e15'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation70_Delta_20261120.zip':
           '16adc165f99129abed147cfc1888b1a57bf6cbe1aea280a6ff0440898d5241ad'}
LEAN = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ResidualPressureSquareTransfer.lean'
EXTRA = {
    LEAN: 'cc731ebc730f199f7b663f7e939384f6f8c71f49ed40466113c5d577ffe1654a',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml': '0dc667fdec61733ec6284d5799c4da409cce062fa596dcf8021a36d16ff5f722',
}
CI = 'ci-44587026528/'
COMMIT = '0b21e619c2cab0390ad2bfc0c357b63a43b9bcb9'
Y = 'y-higher-flow/n4-original-radial-derivatives/'
TARGET = 'final67/n7-n8-target-directed/'
PRESSURE = 'final67/n8-directed-pressure/'
REPEAT = 'primary-forced-join/active-n3-c5-binding/repeat-candidate-replay/'
B22 = 'y-higher-flow/n4-moving-b22/'
TRANSPORT = 'final67/n7-n8-target-primary-transport/'
PULSE = 'primary-forced-join/active-n3-c5-binding/repeat-closed-pulse/'
TRANSVERSE = 'primary-forced-join/active-n3-c5-binding/repeat-transverse/'
PINS = {
    TRANSVERSE + 'transverse.json': '371b12f43b9d703d7b0f8ea3ddad39c489016d81fa5d276be5d2c42730de2910',
    B22 + 'moving-graph.json.gz': 'a03d0431f725251e46c8d1d5331c52998fd3b94851ed5bb1b2888eb0ed3dd025',
    B22 + 'family-range.json': '08455dd772a4296b8a0c9ec2b2a9ceaa90511b15b9f46cb304b92b1c7c18872f',
    TRANSPORT + 'transport-audit.json': '7fbdd58c257938e6c03086cf9e194312659e80ff28a448b8ae5b4e9cc30cbbd2',
    TRANSPORT + 'primary-transport.json': 'a6027c998b42336dbeffd5157e443eca485850e9cca3d78c0afcccf29cbff8b9',
    PULSE + 'closed-pulse.json': '547c4079aa37fbf0afb6463a34f392e52eb25cf1915dbfb05ad86b50ba5c7ed6',
    Y + 'positive.json': '4fc580564e424d345e8c73d3c06790b18afddceb2d9edcd353166a97adc75809',
    Y + 'negative-binders.json': '85d2f5db595029044a749089842fe8135f17003857d72b4477d93dfb8aa2c0dd',
    Y + 'negative-guards.json': 'db1a6433423594b4dd22ae4b314deb200c6dcc8d47fcea0cc25be10b0711700b',
    TARGET + 'weighted-target-high.json': '75b0bb821dc1a486ced5d88176faffe63645d73534366f11bd1708d39377e25f',
    TARGET + 'source-audit.json': '786d1e75032da6edb198d553c8231f212913265dadbb27544b4b1d481ccf980a',
    PRESSURE + 'directed-pressure-error.json': '7acb77db34d1bd209524818866cc6eea91991a5935253de5a990886bcbdf8493',
    REPEAT + 'archived-repeat-append-readback.json': '893ad0d40a2453f7f76bbc522dce08055e0d8be9dd2abd123f256fdfbcb51729',
}


def verify_evidence(raw, source):
    for path, digest in PINS.items():
        assert entry(raw(path))['sha256'] == digest, path
    y = source(Y + 'positive.json')
    assert y['status'] == 'PASS_ORIGINAL_N4_DYNAMIC_RADIAL_NATURAL_INPUTS'
    assert y['nodeCount'] == 7_358_162 and y['originalPositiveRadialSitesAcrossSystems'] == 112
    assert y['originalPositiveRadialSites'] == 38 and y['originalSystem'] == 0
    assert y['originalPositiveRadialSitesByDerivative'] == {'1': 27, '2': 11}
    assert y['distinctGeneratedNaturalNodes'] == 10_367 and not y['violations']
    assert y['kindCounts'] == {'direct': 5149, '1-log': 4088, '2-log': 697, '3-log': 433}
    for control, count in (('binders', 2776), ('guards', 572)):
        observed = source(Y + 'negative-' + control + '.json')
        assert observed['status'] == 'NEGATIVE_CONTROL' and len(observed['violations']) == count
        assert observed['graphSha'] == y['graphSha']

    b22 = source(B22 + 'family-range.json')
    assert b22['status'] == 'PASS_B22_MOVING_ENDPOINT' and b22['source_caller'] == 121999
    assert b22['graph_sha256'] == PINS[B22 + 'moving-graph.json.gz']
    assert b22['reached_nodes'] == 82_848 and len(b22['selected_generated_targets_and_time_coordinates']) == 10
    assert b22['events'] == {'binder_endpoint_transfer': 50, 'guard_discharge_positive': 22}
    assert not b22['open_root_obligations'] and not b22['open_bound_obligations']

    target = source(TARGET + 'weighted-target-high.json')
    audit = source(TARGET + 'source-audit.json')
    assert target['programNodes'] == 41
    assert [(x['order'], x['pole']) for x in target['rows']] == [(7, 24), (8, 27)]
    assert audit['closedCommonUpper'] == 'exp^5(2^21)'
    assert audit['receiptSHA256'] == PINS[TARGET + 'weighted-target-high.json']
    assert audit['programSHA256'] == entry(raw(TARGET + 'weighted-target-high-program.json'))['sha256']
    assert [audit['orders'][str(k)]['profileCount'] for k in (7, 8)] == [36, 45]
    assert not target['scope']['nativeN7N8NormRootsEvaluated']

    transport = source(TRANSPORT + 'transport-audit.json')
    assert transport['receiptSHA256'] == PINS[TRANSPORT + 'primary-transport.json']
    assert [(x['outputOrder'], x['targetOrder'], x['backgroundOrder'], x['cutoffMapOrder'])
            for x in transport['hybrid']] == [(6, 7, 9, 8), (7, 8, 10, 9)]
    assert all(x['targetMaximumUnchangedNativeN6'] for x in transport['hybrid'])
    assert transport['hybrid'][1]['unchangedOriginalPoleInventory'] == list(range(3, 28, 3))

    pressure = source(PRESSURE + 'directed-pressure-error.json')
    assert pressure['explicitIndexedNativeAtoms'] == 100 and pressure['exactPairedIndexedSums'] == 50
    assert [x['exactPressureMonomials'] for x in pressure['typedIndexedPressureGradient']] == [20, 2, 2]
    assert pressure['localizedForceError']['ownPressureErrorSquare'].endswith('2^-1024*S_R.')
    assert pressure['actualNumericalResidualIntervals'] == 0 and pressure['N8_05'] == 'OPEN'

    replay = source(REPEAT + 'archived-repeat-append-readback.json')
    assert replay['status'] == 'VERIFIED_ARCHIVED_ORIGINAL_REPEAT_REPLAY'
    assert replay['seal']['baseNodeCount'] == 4_456_994
    assert replay['seal']['appendedNodeCount'] == 225_012
    assert replay['seal']['appendedDefinitionsByGroup'] == [914, 0, 0, 40, 0]
    assert replay['recoveredStream']['sha256'] == replay['archivePins']['after']['stream']
    gauge = replay['independentTypedGaugeProof']
    assert gauge['nodes'] == 4_682_006 and gauge['candidateCount'] == 40 and gauge['zeroOrderRoots'] == 240
    assert gauge['sha256'] == entry(raw('primary-forced-join/active-n3-c5-binding/repeat-candidate-preflight/stage2-potential-readback.json'))['sha256']

    pulse = source(PULSE + 'closed-pulse.json')
    assert (pulse['run'], pulse['graphNodes'], pulse['componentSlots'], pulse['lazyGuards']) == (
        43015175416, 4_682_006, 240, 1680)
    assert pulse['rightCollarControl']['droppingDpsiNotSupported']
    assert not pulse['rightCollarControl']['actualStateNonzeroInferred']
    assert pulse['finalJets'] == 0 and pulse['release'] == 'HOLD'

    transverse = source(TRANSVERSE + 'transverse.json')
    assert (transverse['run'], transverse['graphNodes'], transverse['checkedPositiveSystems'],
            transverse['componentSlots']) == (43015175416, 4_682_006, 40, 240)
    assert not transverse['actualStateOutsideNativePulseEvaluated']
    assert transverse['finalJets'] == 0 and transverse['release'] == 'HOLD'

    run = source(CI + 'github-run.json')
    assert (run['databaseId'], run['headSha'], run['status'], run['conclusion']) == (
        44587026528, COMMIT, 'completed', 'success')
    digest_manifest = raw(CI + 'source-sha256.txt')
    assert (EXTRA[LEAN] + '  MathScope/M3/CD/ResidualPressureSquareTransfer.lean').encode() in digest_manifest
    log = raw(CI + 'ResidualPressureSquareTransfer.log')
    for theorem in ('residual_force_square_transfer', 'residual_force_square_pressure_allowance'):
        assert ("'MathScope.M3.CD." + theorem + "' depends on axioms:").encode() in log
    assert b'error:' not in log and b'sorryAx' not in log
    return {'verifiedN4BootstrapSourceSites': 38, 'freshNaturalCalls': 10367,
            'conditionalExternalTargetOrders': [7, 8], 'explicitN3IndexedPairs': 50,
            'higherYMovingB22Calls': 10, 'archivedClosedPulseSlots': 240,
            'originalRepeatReplayedNodes': 4682006, 'originalRepeatTypedGauges': 240,
            'githubLeanRun': run['databaseId'], 'leanTheorems': 2, 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation71', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
