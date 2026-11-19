"""Verify and package the successful first-correction source readback."""
import json

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation76 import PARENTS as EARLIER


PARENT = 'a89a9236e717f552b5ec83bd5e92d3c25de1d28f'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation76_Delta_20261120.zip':
           'c67bca0be3a236d3eb091e8755d29a0b801bcc87d4f513c35bb08021b5d96567'}
DIR = 'primary-forced-join/active-n3-c5-binding/hosted-44582875351/'
RUN = 44582875351
COMMIT = '059df9db3a188ce18f3c43a0dca3a92f2e02a4b2'
STREAM = 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
PINS = {
    'github-run.json': '190d0d3445c61321dbe465cdc07c7615277d1d91837a9a2de983c3839317b552',
    'spatial/original-source-export-manifest.json': '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'spatial/first-correction-spatial-export.json': 'a06d409faf6818d1f494e685334d0e420b3a659ddf793f7752a83c30db99dc0c',
    'spatial/first-correction-spatial-ingress.json': '20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f',
    'spatial/spatial-readback.json': '364debba33e15d7db387b9a67c4deb5cc43e59a96744ad046ac8b4ba146991b2',
    'spatial/spatial-cutoff-same-live.json': '2a1fc82ce005e5fced9e28ad9f8e1c2fcffa4ee5e6dc8f7768c41a0b66f35a89',
    'spatial/spatial-mean-same-live.json': '214f2ec8534e9eb828add24aab542128b39ec4453da3396ee70203507b78f408',
    'archived-operands/live-prefix-final.json': '7b070da91d4ecb58df0cfa775c9b56be3cd9ceb10fcba0d7189fa8978e040775',
    'repeat-metadata/live-repeat-metadata.json': '424fcc1a91ae3a0ec265fdbd4f320e825424aabe3a934161749a5310722df8a4',
}


def verify_evidence(raw, source):
    def data(path):
        return source(DIR + path)

    for path, pin in PINS.items():
        assert entry(raw(DIR + path))['sha256'] == pin, path
    hosted = data('github-run.json')
    assert (hosted['databaseId'], hosted['headSha'], hosted['status'], hosted['conclusion']) == (
        RUN, COMMIT, 'completed', 'success')
    readback = data('spatial/spatial-readback.json')
    assert readback['hostedRun']['id'] == RUN and readback['hostedRun']['headSha'] == COMMIT
    assert readback['status'] == 'VERIFIED_ACTIVE_N3_SPATIAL_SOURCE_STREAM_AND_OPERAND_BINDINGS'
    assert readback['sourceStream']['sha256'] == STREAM
    assert (readback['sourceStream']['nodes'], readback['sourceStream']['bytes']) == (22155584, 1024352367)
    assert readback['originalPrefixComparison']['sameRunCompact']['checkedRecords'] == 1663
    assert readback['typedSourceReadback']['exactOriginalRowsReused'] == 162
    assert (readback['energyIngressRoots'], readback['spatialJetLabels']) == (24, 33)
    gauge_roots = [22154926, 22154928, 22154930]
    assert readback['gaugeDifferenceRoots'] == gauge_roots
    assert all(readback[k] == 'OPEN' for k in ('gaugeEquivalence','uniformWeightedEndpoints','N706','N805'))

    cutoff = data('spatial/spatial-cutoff-same-live.json')
    assert cutoff['liveRootBinding']['readbackSHA256'] == PINS['spatial/spatial-readback.json']
    assert cutoff['liveRootBinding']['gaugeDifferenceRoots'] == gauge_roots
    assert cutoff['scope']['actualUniform24CapsEvaluated'] is False
    assert cutoff['scope']['actualCorrectionBudgetsClosed'] == 0
    mean = data('spatial/spatial-mean-same-live.json')
    assert mean['status'] == 'VERIFIED_ACTUAL_NATIVE_FIVEMAP_BODY_AND_TEMPORAL_APPLICATION_BINDINGS'
    assert mean['actualMean']['wholeSharedIntegrand'] == 22151951
    assert mean['actualMean']['sameRadialLimits'] == [17743711,17732748]
    assert mean['actualMean']['wholeFixedRadialLimits'] == [17743711,17743713]
    assert mean['cannotPromoteWholeGauge']

    archive = data('archived-operands/live-prefix-final.json')
    assert archive['liveRun']['id'] == RUN and archive['liveRun']['headSha'] == COMMIT
    assert archive['liveManifestSHA256'] == PINS['spatial/original-source-export-manifest.json']
    matches = next(section for section in archive.values()
                   if isinstance(section, dict) and 'comparedUniqueTypedRecords' in section)
    assert matches['comparedUniqueTypedRecords'] == matches['matches'] == 40621
    assert matches['mismatches'] == 0 and matches['entireOldNodeStreamEqualsLivePrefix'] is False
    for field in archive['nativeDefinitionsExactlyEqual']['covarianceFields']:
        assert field['allSignedRowsExactlyEqual'] == 162

    repeat = data('repeat-metadata/live-repeat-metadata.json')
    assert repeat['run'] == RUN and repeat['executingCommit'] == COMMIT
    assert repeat['prefixRawReadback']['uncompressedSHA256'] == STREAM
    assert repeat['preRepeatNodeCount'] == readback['sourceStream']['nodes']
    assert repeat['postRepeatNodeCount'] - repeat['preRepeatNodeCount'] == 225012
    assert repeat['repeatAppendNodesReported'] == 225012 and repeat['missingRepeatRawStreamAndRegistry']
    metadata = repeat['candidateMetadata']
    assert (metadata['positiveInverseCount'], metadata['signedReturnedHarmonics'],
            metadata['typedGaugeMetadataRecords'], metadata['exactRawSupportRecordCount']) == (40,80,240,240)
    assert metadata['uniqueDeclaredRoots'] == metadata['earlierPrefixRoots'] + metadata['repeatAppendRoots'] == 1444
    assert repeat['completeSecondCorrection'] == 'OPEN'
    progress = [json.loads(line) for line in raw(DIR + 'native-run-excerpt.log').splitlines()]
    assert progress[-1]['name'] == 'post-five-repeat-inverse-candidate'
    assert progress[-1]['nodeCount'] == repeat['postRepeatNodeCount']
    assert data('spatial/spatial-readback.json')['finalJets'] == 0
    assert data('spatial/spatial-readback.json')['release'] == 'HOLD'
    return {'sourceRun':RUN, 'sourceNodes':22155584, 'archivedTypedOperands':40621,
            'spatialEnergyRoots':24, 'spatialJetLabels':33, 'reportedRepeatCandidates':40,
            'repeatGaugeMetadataRecords':240, 'completeSecondCorrection':'OPEN', 'finalJets':0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation77', date='20261120', verify=verify_evidence)
