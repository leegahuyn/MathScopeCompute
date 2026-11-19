"""Package the original pointwise C10, source cutoffs and targeted readbacks."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation71 import PARENTS as EARLIER

PARENT = '6691e77b81e80fde6223233a6cdf8667602b9add'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation71_Delta_20261120.zip':
           '16883e72fcbadd8c01595607ce3858846abc4262ded1a6fd5a0618091ddf7cb5'}

LIVE = 'final67/live-background-c10/'
CUTOFF = 'final67/n7-n8-primary-cutoff-orders/'
VELOCITY = 'final67/n8-selected-velocity-force/'
Y = 'y-higher-flow/n4-complete-site-121999/'
MESH = {
    'primary-forced-join/active-n3-c5-binding/repeat-radial-mesh/radial-mesh.json': 'a4e05257d9d8c6545a20fa291535e054bd7c290371ff8c009b7f3eca6688c708',
    'primary-forced-join/active-n3-c5-binding/repeat-z-mesh/z-mesh.json': '456f8052ef30f9f259b2464cbc66e4e4fcb412a1f77b3769245a95df65ab7a97',
    'primary-forced-join/active-n3-c5-binding/repeat-t-mesh/t-mesh.json': '1c57ca80fb32ad2d9fc80c68e9777c9675ec655f0ebdc0177f8a539e5d731613',
    'primary-forced-join/active-n3-c5-binding/repeat-band-face/band-face.json': '1cd6412eef1774e9457b25cf83cc04c9b78ef198dca670da4d75a6fd70c4d23b',
}
SHELL = 'primary-forced-join/active-n3-c5-binding/repeat-shell-minimum/shell-minimum.json'
PINS = {
    SHELL: '7535cc782fd488c44a786269a9376dbcd19b52858d372b92be4d6a3a203adbcf',
    **MESH,
    LIVE + 'Exact_C10_Profile_Trace_20261120.zip': 'ae68b1c5912e358a5581208c73064d0a8690edb4e9d7b74b63c82b1f2938bf45',
    LIVE + 'chart-c10.json': '5e770e398e3db1376bafacfcc06e5b5cb92a582db8eca4432f520873caf582c3',
    LIVE + 'positive-c10-directed.json': 'f756d88c734373cd5a7a34684a5b1edac272298774c60d27667fc8473a1833f9',
    CUTOFF + 'cutoff-orders-audit.json': '2b9940ae5719759972393013922cfa47ffecf7fe395ab703606417f74f59ac78',
    CUTOFF + 'primary-cutoff-orders.json': 'd3dab84d038b542253e76a27b5eb84d4730fd5660f8db9fc26774a09bb5d43d9',
    VELOCITY + 'selected-velocity-heat.json': 'c3598e33a097593df3aa229108051f392adcee60c888ca1a090535276fb19491',
    Y + 'range.json': 'cb21d1432c5956dc7e0a9425ed7395e8b9d8f814c19b2ff19a008117107fe839',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    replay = source(LIVE + 'independent-replay.json')
    chart = source(LIVE + 'chart-c10.json')
    directed = source(LIVE + 'positive-c10-directed.json')
    assert replay['arithmeticTraceNodes'] == 210631 and replay['originalPrefix'] == 123870
    assert replay['conditionalBoundaries'] == [239, 257, 275]
    assert replay['traceSHA256'] == directed['packetSHA']
    assert replay['chartSHA256'] == PINS[LIVE + 'chart-c10.json']
    assert replay['directedSHA256'] == PINS[LIVE + 'positive-c10-directed.json']
    assert replay['byteIdenticalReplays'] == {'trace': True, 'chart': True}
    assert replay['strictUpperBelowOriginalGate'] and replay['privateNativeAssociation'] == 'OPEN'
    assert chart['maximumTermsAllDegreeTen'] == len(chart['slowOrders']) == 286
    assert chart['combinedPointwiseFactor'] == '2^1867*Hc^143'
    assert directed['candidateFullC10']['combinedComparison'] == -1
    assert [row['weightedUnitComparison'] for row in directed['rows']] == [-1] * 3

    cutoff = source(CUTOFF + 'cutoff-orders-audit.json')
    assert cutoff['receiptSHA256'] == PINS[CUTOFF + 'primary-cutoff-orders.json']
    assert cutoff['bothBelowExistingDirectedTargetN6Upper']
    assert cutoff['noHeatNegativeTimeExtension']
    assert [(row['cutoffMapOrder'], row['stepDerivativeOrder'], row['RstarPower'])
            for row in cutoff['orders']] == [(8, 10, 24), (9, 11, 26)]

    velocity = source(VELOCITY + 'selected-velocity-heat.json')
    slices = velocity['exactC52Slices']
    assert slices['typedLeaves'] == 54
    assert [row['selectedExpandedMonomials'] for row in slices['entries']] == [98, 98, 98]
    assert len(velocity['normalizationProducts']) == 15
    assert velocity['forceTransfer']['currentActualComplementBound'] == 'OPEN'
    assert velocity['N8_05'] == 'OPEN' and velocity['finalJets'] == 0

    y = source(Y + 'range.json')
    assert y['source_caller'] == 121999 and y['reached_nodes'] == 82848
    assert y['certified_natural_targets'] == y['fresh_natural_targets'] == 1221
    assert y['certified_native_ingress_targets'] == {'scaled_square': 595, 'scaled_radius': 353}
    assert not y['open_root_obligations'] and not y['open_bound_obligations']
    assert y['events'] == {'binder_endpoint_transfer': 413, 'guard_discharge_positive': 706}
    for control, count, native in (('binders', 1216, 948), ('guards', 575, 0), ('radial-frame', 1207, 948)):
        removed = source(Y + f'without-{control}.json')
        assert removed['open_natural_targets'] == count
        assert sum(removed['open_native_ingress_targets'].values()) == native

    for path in MESH:
        mesh = source(path)
        assert (mesh['run'], mesh['graphNodes'], mesh['checkedPositiveSystems'],
                mesh['componentSlots']) == (43015175416, 4682006, 40, 240)
        assert not mesh['actualStateOutsideNativePulseEvaluated']
        assert mesh['finalJets'] == 0 and mesh['release'] == 'HOLD'
    shell = source(SHELL)
    assert shell['candidate']['lazyShell']['node'] == 4468678
    assert shell['actualInteriorTargetDerivative']['nativeApplication'] == 3676019
    assert shell['actualInteriorTargetDerivative']['targetSquareRoot'] == 623824
    assert shell['shellEquality'] == 'OPEN' and not shell['numericActualValueInferred']
    return {'liveProfileArithmeticNodes': 210631, 'originalSlowDerivativeMultiindices': 286,
            'conditionalCutoffMapOrders': [8, 9], 'actualTimeViscosityLeaves': 54,
            'higherOriginalNaturalArgumentsClosed': 1221, 'higherTypedNativeIngress': 948,
            'archivedMeshDirections': ['band', 'R', 'Z', 'T'], 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation72', date='20261120',
                   verify=verify_evidence)
