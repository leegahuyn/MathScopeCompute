"""Package the actual Temporal and Forced estimates, Picard ingress and R1-08 evidence."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation86 import PARENTS as EARLIER

PARENT = 'fcad30347655a1a7da0dd7a887b9a31cc55abaec'
PARENTS = {
    **EARLIER,
    'MathScope_Goal_Continuation86_Delta_20261120.zip':
        'ff3d7b3de38021ec963bca1da06a240e93599c293f46de3291c5b9a85dc1cb0b',
}
ROOT = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/temporal-weighted-inverse/'
FORCED = ROOT + 'first-forced-covariance/'
M4 = 'm4/r108/provider-transform/'
Y = 'y-higher-flow/picard-body-ingress/'
PINS = {
    ROOT+'actual-transverse.json': '958080d2e9444fbea108d8c51404d878e41e1512ee03543882442412a7aad742',
    ROOT+'temporal-weight-transfer.json': 'c347d10e54d4bfd2ff845892047b09d38ef1bcec596369694ad0a8e73dbbd45b',
    FORCED+'outer-covariance-final.json': 'bd1974a286e1bb99f07c780b8a3ca29dc2ff65347231cfa36a31bb744133eb3d',
    FORCED+'mean-direction.json': '65c7c4dedd18a6dcc25ed5d8a4e5b274d0a3911b923f737d7df21dd50c76e42d',
    M4+'provider-transform.json': 'd0acc22a0f9e393def8bfe625ae48721a44199b79b891140bc1c4faff81552fc',
    Y+'body-a.json': '14d32aff0e47f0bc8ca5900799fb4727dd57c91db79580b57f2d51d31cfa0590',
    Y+'tail-a.json': 'f9c3f539b8bf1a22dbbe07f21c95730020de571a44ced8e7cbb8cac699b73e48',
}


def verify_evidence(raw, source):
    for path, expected in PINS.items():
        assert entry(raw(path))['sha256'] == expected, path
    for directory in (FORCED, M4, Y):
        manifest = source(directory+'manifest.json')
        for path, metadata in manifest['files'].items():
            assert entry(raw(directory+path)) == metadata, (directory,path)

    shape = source(ROOT+'actual-transverse.json')
    assert shape['sourceNodes']==22155584 and len(shape['localCovariances'])==12
    assert shape['commonTorus']['columnChecks']==324 and shape['commonTorus']['signedBoxes']==81
    transfer = source(ROOT+'temporal-weight-transfer.json')
    assert transfer['proof']['distinctTargetJets']==378
    assert transfer['spatialDemandEnvelope']['distinctTargetJets']==165
    assert transfer['proof']['covarianceRequests']['W_rz']['maxSlowTotal']==8
    actual = transfer['exactFirstForcedMeanDemand']
    assert actual['distinctTargetJets']==129 and actual['allSourceRequests']==600
    assert actual['covarianceRequests']['W_rz']['maxSlowTotal']==7
    assert transfer['localCovarianceCutoffValues']['sampleSlope']==str(2**38)
    assert transfer['localCovarianceCutoffValues']['CUpperOverM']==f'1/{2**37}'
    assert transfer['localCovarianceCutoffValues']['DUpperOverM']==f'5/{2**78}'

    forced = source(FORCED+'outer-covariance-final.json')
    direction = source(FORCED+'mean-direction.json')
    assert transfer['inputPins']['meanDirection']==PINS[FORCED+'mean-direction.json']
    assert sum(direction['testedRawModeOneGroupsByChart'].values())==100
    assert len(direction['meanNativeSourceDemand']['commonOrdersForBetaVAndGamma'])==43
    demand = forced['radialJetDemand']
    assert demand['aggregateLabelledComplexVelocityRoles']==750
    assert demand['aggregateLabelledComplexProjectedRHSRoles']==1380
    assert demand['highestNativeVariationalOrder']==4
    assert forced['poleAlgebra']['covarianceHaarERadialPoles0to2']==[30,33,36]
    assert all(row['finalJets']==0 and row['release']=='HOLD' for row in (shape,transfer,forced,direction))

    y = source(Y+'body-a.json')
    assert len(y['sourceSystems'])==10 and y['openCount']==0
    assert [y['actualDirectNaturalRoles'],y['actualRecursionEdges']]==[710,163]
    assert [y['auxiliaryDirectNaturalRoles'],y['auxiliaryRecursionEdges']]==[70,182]
    for control, expected in [('binders',497),('guards',297),('radius',437)]:
        assert source(Y+'body-'+control+'.json')['openCount']==expected
    tail = source(Y+'tail-a.json')
    assert tail['typedCoefficientIngressSHA256']==PINS[Y+'body-a.json']
    assert tail['realAuxiliaryTail']['minimumRetainedDegreeForThisCertificate']==512
    assert tail['complexAuxiliaryCoreTail']['minimumRetainedDegreeForThisCertificate']==4096

    m4 = source(M4+'provider-transform.json')
    assert m4['control']['matchesAuthenticatedFullDigest'] and m4['control']['exactPublicRoundTrip']
    assert m4['production']['metadata']['version']==137 and m4['production']['metadata']['versionHash']=='9171eb0c'
    assert len(m4['production']['candidates'])==2 and m4['production']['sameFragmentSHA256Count']==14
    assert all(item['sameLengthAsProviderStoredPage'] and item['exactPublicRoundTrip']
               and not item['providerShortHashMatch'] for item in m4['production']['candidates'])
    assert m4['acceptance']['operationalR1-08']=='OPEN' and m4['acceptance']['release']=='HOLD'

    return {'actualCommonCovariances':6,'fixedCoverRows':162,'actualMeanJetRoles':129,
            'covarianceInputRoles':600,'projectedSourceRoles':1380,
            'actualNaturalRoles':710,'actualLowerPicardEdges':163,
            'heldProductionVersion':137,'rejectedEditableCandidates':2,
            'finalN8Comparisons':0,'finalJets':0}


if __name__=='__main__':
    assemble_delta(read_arguments(__doc__),parent=PARENT,parents=PARENTS,
                   label='MathScope_Goal_Continuation87',date='20261120',verify=verify_evidence)
