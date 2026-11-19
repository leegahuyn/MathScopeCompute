"""Verify the selected live pointwise C9 arithmetic and original covariance dependency audit."""
import json
from io import BytesIO
from zipfile import ZipFile

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation68 import PARENTS as EARLIER

PARENT = '8715be966d185f170b3989246ce9ff0437cedb7e'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation68_Delta_20261120.zip':
           '3b23545878d3c20a4af074d13bc26bca690ed819d7b2dc0f849496fd9875dc56'}
LIVE = 'final67/selected-live-c9/'
MEAN = 'final67/selected-covariance-order/'
PINS = {
    'c9-runtime-pins.json': 'cff9581d31e435119c2e2c5dec6fb4962a1e90c42f395ae604a143980673615d',
    'evaluate_positive_c9.mjs': 'ac0978d920b8ede27cf9cecb6fc1ff16c9e8e4065e00b471cc161ff2ae4133a1',
    'Exact_C9_Profile_Trace_20261120.zip': '42d2db91878e9be28895005edda2ee66ba6a20b3cabd1aea133875a3f5e0f965',
    'positive-c9-directed.json': 'f6d2cf934d97c0e250b8719d120d9bcac56f3c60dc9798e5549701bb732990b9',
    'README.md': 'dfac88554915df1fd8da5f3ac89940722c64d05472f7096219da0d8befcdc7a7',
    'selected-c9-pointwise-chart.json': 'c55001103b8044787c228dc47f6969dfae61d77f6a1248752f857e417f32b2ad',
    'trace_positive_c9.mjs': 'f544e16de86f6adb1e35759f6e93cb8577f17d084d972cbc3afd69caf3058740',
    'verify_c9_runtime_pins.mjs': '7b10487b70606c1afa75fe78c017a49b5818c9b76d9450ded6958aff5f89735c',
    'verify_selected_c9_chart.py': '947a25804665ce63cdb5c6b4d1fb91cf963557fde2e4ed43a183c3c9a682df05',
}
TRACE = '381e02c26516ed7acf242610340b69f9ef179308a682122fc2dd9df7cac2faaf'
MEAN_MANIFEST_SHA = '99791fa480f36b9146cf7f98e8cb83ac661c9e52008497c063e640c4b2366f4c'


def verify_evidence(raw, source):
    for name, pin in PINS.items():
        assert entry(raw(LIVE + name))['sha256'] == pin, name
    with ZipFile(BytesIO(raw(LIVE + 'Exact_C9_Profile_Trace_20261120.zip'))) as z:
        assert z.namelist() == ['positive-c9-trace.json'] and z.testzip() is None
        plain = z.read('positive-c9-trace.json')
        assert entry(plain)['sha256'] == TRACE
        trace = json.loads(plain)
    assert (trace['originalPrefix'], trace['builtNodes'], trace['derivativeOrder']) == (123870, 358766, 9)
    assert len(trace['trace']['nodes']) == 169401
    assert trace['sourceParameterExpressionSHA256'] == 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
    assert [row['id'] for row in trace['trace']['nonArithmeticBoundaries']] == [239,257,275]
    assert all(row['mixedProfileOrders'] == 55 and row['normalizedEulerWeights'] == 10 for row in trace['finite'])

    directed = source(LIVE + 'positive-c9-directed.json')
    assert directed['packetSHA'] == TRACE and directed['finalJets'] == 0
    assert [row['weightedUnitComparison'] for row in directed['rows']] == [-1,-1,-1]
    assert directed['candidateFullC9']['combinedComparison'] == -1
    assert directed['candidateFullC9']['leadingPointwiseDominanceRequired']
    chart = source(LIVE + 'selected-c9-pointwise-chart.json')
    assert chart['combinedPointwiseFactor'] == directed['chartMultiplier']['pointwiseBound'] == '2^1696*Hc^130'
    assert [row['ordinarySlowOrders'] for row in chart['selectedOrders']] == [[2,5,2],[1,6,2],[0,7,2]]
    assert chart['pointwiseOnly'] and not chart['fullDegreeNineFTCFacesProved']
    runtime = source(LIVE + 'c9-runtime-pins.json')
    assert runtime['originalSources'] == len(runtime['modules']) == 121
    assert all(len(row['gitBlob']) == 40 for row in runtime['modules'])

    assert entry(raw(MEAN + 'MANIFEST.json'))['sha256'] == MEAN_MANIFEST_SHA
    for name, meta in source(MEAN + 'MANIFEST.json')['files'].items():
        assert entry(raw(MEAN + name)) == meta, name
    path = source(MEAN + 'selected-audit.json')
    assert path['selectedCovariance']['newSelectedBackgroundJets'] == 6
    assert path['fullLeadingPointwiseC9AlreadyAvailable']['oldPositiveUpperExpressionsDominatePointwiseC9']
    assert path['movingFrameControl']['rawMixedFRPulseDerivativeAtZero'] == '1/24 - sqrt(2)/144'
    assert not path['movingFrameControl']['actualOriginalSourceValuesNumericallySubstituted']
    independent = source(LIVE + 'independent-replay.json')
    assert independent['positiveTrace'] == TRACE
    assert independent['directedComparison'] == PINS['positive-c9-directed.json']
    assert independent['selectedMeanAudit'] == entry(raw(MEAN + 'selected-audit.json'))['sha256']
    return {'selectedLiveSlowC9Derivatives': 6, 'rawSourceArithmeticNodes': 169401,
            'conditionalDirectionalBackgroundBound': 'exp(H/2^128)/(64*Xb^2)',
            'selectedMeanOperatorAndTargetJetBounds': 'OPEN', 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation69', date='20261120',
                   verify=verify_evidence)
