"""Package the exceptional frozen C10 and directed Primary arithmetic."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation72 import PARENTS as EARLIER

PARENT = '11e21549305210fb3574ae0eace141693d11e3a9'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation72_Delta_20261120.zip':
           '68e62ddbf686286b1fa35c52ef1ac78987837d968ee9f15ff3278837dc12dbfd'}
FROZEN = 'final67/frozen-n4-high/'
PRIMARY = 'final67/external-primary-high/'
PATH = 'final67/primary-path-admission/path-admission.json'
PRE_HAAR = 'final67/prehaar-wrz-z5t2/'
PINS = {
    PRE_HAAR + 'prehaar-wrz.json': 'a749056e325accfb2582b6814c1e335cfbcdd46ec1bc8fb911c24e4741ae8ccc',
    PRE_HAAR + 'MathScope_C73_PreHaar_Wrz_Evidence.zip':
        '70fb914c713b35952912da99c22347a4f4dc3930907218bceea79e1c60ef91ba',
    PATH: '7913987530f25c6c93ea383611d56dc99882046037439b08ddb232aa71f32f4a',
    FROZEN + 'frozen-high-bridge.json': 'a4cbadff8f11caf2b75a5933b49457cc4260307fe2ad712a5c9eadbe8e7f776e',
    FROZEN + 'MathScope_Exceptional_Frozen_N4_C9_C10_20261120.zip':
        '438790442c4e35901f1c35837109fa802d8974a899d7dbfdf06e76488a041faf',
    PRIMARY + 'external-primary-k.json': '5aef7c09a25a84a573ea43047a152461776e3feeb4a4c2fc8308dea5012cb824',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path

    frozen = source(FROZEN + 'frozen-high-bridge.json')
    assert frozen['scope']['exceptionalFrozenN4Through10']
    assert frozen['rawC10']['rank'] == [2, 33127] and frozen['rawC10']['independentAtoms'] == 80
    assert frozen['finiteFrequency']['A_rank'] == [2, 8705]
    assert frozen['chartCutoff']['eulerOrder'] == 10 and frozen['chartCutoff']['maximumProfileTerms'] == 286
    assert 'exp(-L^6/3)<1' in frozen['conclusion']

    primary = source(PRIMARY + 'external-primary-k.json')
    assert primary['pins']['frozen'] == [FROZEN + 'frozen-high-bridge.json',
                                         PINS[FROZEN + 'frozen-high-bridge.json']]
    expected = [(3, 6, 3405), (3, 7, 3814), (4, 6, 3405), (4, 7, 3814)]
    assert [(row['prefix'], row['order'], row['maxPower']) for row in primary['horizon']] == expected
    for row in primary['horizon']:
        assert row['kComparison'] == row['coefficientComparison'] == row['haarComparison'] == -1
        assert list(row['componentComparisons'].values()) == [-1]*7
    assert primary['unaveragedRadialWeight']['maxPole'] == 54
    assert primary['unaveragedRadialWeight']['compareHOver2Pow115'] == -1
    assert primary['unaveragedRadialWeight']['halfGaussianCompareHOver2Pow115'] == -1
    assert primary['nativeKRootEvaluated'] is False and primary['actualAllCorrections'] == 'OPEN'

    path = source(PATH)
    assert path['status'] == 'VERIFIED_FIXED_LABEL_GEOMETRY_CONDITIONAL_POINTWISE_CLASS_TRANSPORT'
    assert len(path['sourceSHA256']) == 10 and len(path['inputSHA256']) == 4
    assert path['originalGeometry']['activeOwnLabelOffsets'] == [14, 15, 16]
    assert path['originalGeometry']['activeOwnQOverTau0'] == ['2', '1', '1/2']
    assert set(path['actualPrimaryArguments']) >= {'live', 'pulse', 'transverse', 'indexedHaar'}
    assert 'midpoint' in path['straightPathControl']

    before_haar = source(PRE_HAAR + 'prehaar-wrz.json')
    assert before_haar['sourcePins']['khat'] == PINS[PRIMARY + 'external-primary-k.json']
    assert before_haar['actualSourceStreamSHA256'] == '831120617913e89c5bb60976fb26f58c6714decc301097a08f72ee23233e0a6a'
    field = before_haar['actualInitialMap']
    assert (field['field'], field['application'], field['firstZApplication']) == (2, 17753400, 17753414)
    assert field['rows'] == 162 and field['derivativeYColumnEntries'] == 648
    assert field['directionOrder'] == [0,5,2,0,0] and field['torusDerivativesInSelectedPath'] == 0
    assert field['selectedRowMultiplier'] == 'rho^(2A+5D+2)'
    assert 'strict wherever zeta>0' in before_haar['conditionalWeightedTransport']['peakAfterEpsilon7']
    assert before_haar['nativeM7SealConstructed'] is False

    page = source('preservation-continuation73.json')
    assert page['http'] == 200 and page['bytes'] == 30_707_818 and page['operatedOnlyRead']
    assert page['bodySHA256'] == 'a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48'
    assert page['operationalR108'] == 'OPEN'
    return {'exceptionalFrozenN4DerivativeOrder': 10, 'independentFrozenAtoms': 80,
            'conditionalExternalPrimaryScalarComparisons': 4, 'release': 'HOLD', 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation73', date='20261120',
                   verify=verify_evidence)
