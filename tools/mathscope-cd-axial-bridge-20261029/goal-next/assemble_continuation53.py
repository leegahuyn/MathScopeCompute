"""Package the original inner-field coefficient-order refinement."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation52 import PARENTS as EARLIER, BINDING


PARENT = '286a53dd74569ac762747d06178b5d6339648e1b'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation52_Delta_20261120.zip':
           'd88af245ceff66dd6fdaa7592c4ffb0e43d31fb66c9ad53604d00276beb2513a'}
INNER = 'final67/inner-n8-refinement/'
READER = BINDING + 'spatial-readback/'
PINS = {
    'MANIFEST.json': '09b6f0a0ad5e986e6b7b5922b80cf59046c31314cb3065e55ad8ebba6cb585e5',
    'inner-taylor-source.json': 'd363429c4e91d96059617b5b8743799c27923554eaf62dc10d0e77ae501eb095',
    'inner-taylor-refinement.json': '86a17bafa5f65b311ee94fe789babeb866d185b33146c26128a86d59950fa601',
}
READER_PINS = {
    'archived-schema-control.json': '9e45a3f52699700ebd7c06f655505824747f676822331bb5dc2006a665c31c82',
    'controls-final.json': '911619ee16b6e33af6d18fdd58d1ad0c938abd9ee4245b2cd658dc6d16ec3136',
    'source_stream.py': '2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb',
    'verify_spatial_artifact.py': '7c5e89eb64133f8892002ae8c1b55ab5a190e4ed26b25c89218f7992161bb7fc',
    'verify_spatial_structure.py': '1493328510177182ae760be95ee832e3a670f0b3227b12bd5714405cb7763ef9',
}


def verify_evidence(raw, source):
    for name, pin in PINS.items():
        assert entry(raw(INNER + name))['sha256'] == pin, name
    manifest = source(INNER + 'MANIFEST.json')
    for name, item in manifest['files'].items():
        assert entry(raw(INNER + name)) == item, name
    graph = source(INNER + 'inner-taylor-source.json')
    assert graph['status'] == 'VERIFIED_ORIGINAL_INNER_SIGNED_TAYLOR_POLYNOMIAL_SOURCE'
    assert graph['originalNodeCount'] == 123870 and graph['extendedNodeCount'] == 126369
    assert len(graph['coefficients']) == 324 and len(graph['polynomials']) == 72
    record_ids = {int(key) for key in graph['records']}
    assert len(record_ids) == 2522
    assert all(row['axisCorrectedRoot'] in record_ids for row in graph['polynomials'])
    result = source(INNER + 'inner-taylor-refinement.json')
    assert result['status'] == 'VERIFIED_ORIGINAL_FULL_INNER_SIGNED_TAYLOR_ORDER4_TO8_ERROR_REFINEMENT'
    assert result['sourceSHA256'] == PINS['inner-taylor-source.json']
    assert len(result['scalarErrorEnclosures']) == result['widthComparison']['scalarsStrictlyNarrower'] == 22
    assert len(result['fieldAtomErrorEnclosures']) == 67
    widths = result['widthComparison']
    assert (widths['atomsStrictlyNarrower'], widths['exactZeroAtomErrors'],
            widths['uniformWidthRatioUpper']) == (48, 19, '5/16')
    assert result['N706'] == result['N805'] == 'OPEN' and result['finalJets'] == 0
    for name, pin in READER_PINS.items():
        assert entry(raw(READER + name))['sha256'] == pin, name
    archived = source(READER + 'archived-schema-control.json')
    controls = source(READER + 'controls-final.json')
    assert archived['sourceStream']['nodes'] == 4456994
    assert len(controls['negativeIntakeCases']) + controls['archiveNegativeCases'] == 11
    assert controls['partialArtifactCases'] == 4 and not controls['liveN3Replayed']
    return {'innerNativeOperands': 324, 'innerScalarWidthsReduced': 22,
            'innerLocalJetWidthsReduced': 48, 'innerExactZeroErrors': 19,
            'innerWidthRatioUpper': '5/16', 'spatialReadbackNegativeCases': 11,
            'spatialReadbackPartialArtifactCases': 4}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation53', date='20261120',
                   verify=verify_evidence)
