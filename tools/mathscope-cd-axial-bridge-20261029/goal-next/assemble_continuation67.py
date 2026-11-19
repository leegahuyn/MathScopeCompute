"""Verify the two original N3 mode-two frame bindings and directional mean replay."""
from io import BytesIO
from zipfile import ZipFile
import json

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation66 import PARENTS as EARLIER

PARENT = '58fdbf97d0a00f32d72f9191474bda285aab23ec'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation66_Delta_20261120.zip':
           'f352da4e5c653502ce4e459d2274758aca7befa5a48dbf98755421d7c6ec0c9a'}
WAVE = 'final67/selected-mode-two-spatial/'
MEAN = 'final67/mean-directional-stress/'
ARCHIVE = 'MathScope_Selected_Mode2_First_Spatial_Caps_20261120.zip'
ARCHIVE_SHA = '4bc06af0c5dad5fbc7c4ab1bdb7b5e75f2d807c89e2096876c96d23ea7f4398c'
WAVE_MANIFEST = '1b3d696a9735a272eb7b607558a4d5290cc0d9262303cd5e273a305e0db7769d'
MEAN_MANIFEST = '9b028518dd0e524b59f7d0292a2c4e295e1cd8ccb2155bfb817f39b67e20fcaf'


def verify_evidence(raw, source):
    data = raw(WAVE + ARCHIVE)
    assert entry(data)['sha256'] == ARCHIVE_SHA
    with ZipFile(BytesIO(data)) as z:
        assert z.testzip() is None and len(z.namelist()) == 8
        assert entry(z.read('MANIFEST.json'))['sha256'] == WAVE_MANIFEST
        manifest = json.loads(z.read('MANIFEST.json'))
        assert set(z.namelist()) == set(manifest['files']) | {'MANIFEST.json'}
        for name, pin in manifest['files'].items():
            assert entry(z.read(name))['sha256'] == pin, name
        frame = json.loads(z.read('frame-closure-final.json'))
        ep = json.loads(z.read('sample-endpoints-final.json'))
        wide = json.loads(z.read('frame-wide.json'))
        assert raw(WAVE + 'sample-endpoints-final.json') == z.read('sample-endpoints-final.json')
    assert frame['passed'] and frame['regionSHA256'] == manifest['files']['frame-wide.json']
    assert frame['graph'] == ep['observedSource']['archiveGraph'] == (
        '831120617913e89c5bb60976fb26f58c6714decc301097a08f72ee23233e0a6a')
    assert [(row['key'], row['system']) for row in frame['checked']] == [('0:1', 1), ('1:1', 5)]
    assert all(len(row['negativeControls']) == 3 and row['unchangedSlowDirections'] for row in frame['checked'])
    assert ep['observedSource']['archivedFormalActualFrameVerified'] and ep['observedSource']['includedConjugates']
    assert [row['group'] for row in ep['rows']] == ['U', 'G_U', 'A', 'G_A']
    assert [row['logCostUnitsHOver2Pow128'] for row in ep['rows']] == [3836, 4756, 2976, 3902]
    assert ep['strictEndpoint']['comparison'] == -1 and not ep['actual24Closed']
    assert ep['N706'] == ep['N805'] == 'OPEN' and ep['finalJets'] == 0 and ep['release'] == 'HOLD'

    assert entry(raw(MEAN + 'MANIFEST.json'))['sha256'] == MEAN_MANIFEST
    m = source(MEAN + 'MANIFEST.json')
    for name, meta in m['files'].items():
        assert entry(raw(MEAN + name)) == meta, name
    mean = source(MEAN + 'mean-directional.json')
    replay = source(WAVE + 'root-independent-replay.json')
    assert replay['reproducedWaveDigests'] == {n: manifest['files'][n] for n in (
        'frame-wide.json', 'frame-closure-final.json', 'sample-endpoints-final.json')}
    assert replay['meanDirectionalReceiptSHA256'] == m['files']['mean-directional.json']['sha256']
    assert len(mean['fiveMapGaugeJetPrograms']) == 4 and len(mean['pressureDirectionalPaths']) == 60
    assert (mean['formalControl']['weightedDz2SigmaThetaTime'] ==
            mean['formalControl']['expected'] == '2*epsilon**3*KP(R, 0, 1)')
    assert not mean['formalControl']['actualOriginalTargetValuesSubstituted']
    path = mean['selectedUnderlyingCovariancePath']
    assert path['covarianceJet'] == {'Z': 5, 'T': 2, 'totalOrder': 7}
    assert path['explicitEpsilonAfterWeightedSigmaTheta_Dz2_Time'] == 7
    assert not path['actualSelectedJetBounded']
    return {'originalModeTwoRows': 2, 'archivedOriginalGraphNodes': 21681493,
            'conditionalSelectedSpatialBound': 'exp(-H/3)', 'directionalPressurePaths': 60,
            'selectedCovarianceJet': 'epsilon^7 * Wrz_Z5T2',
            'actualFullStageCapsClosed': 0, 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation67', date='20261120',
                   verify=verify_evidence)
