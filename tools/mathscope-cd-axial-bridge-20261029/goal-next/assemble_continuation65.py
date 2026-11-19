"""Verify the reproduced original N4 frozen-representative source and arithmetic."""
from io import BytesIO
from zipfile import ZipFile
import json

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation64 import PARENTS as EARLIER

PARENT = '674a0aa1221c795cbed600eb8bffd8a0a6de2b33'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation64_Delta_20261120.zip':
           'fefada60bfcfef91a7e0697fa4e175e7cfbf28ca6fb2e165f66092150e8ea343'}
BASE = 'final67/frozen-n4-background/'
ARCHIVE = 'MathScope_Exceptional_Frozen_N4_C8_20261120.zip'
ARCHIVE_SHA = '7085d269cce568d0830997459951c513fd35163bad0aba5c3538700d22ab3817'
MANIFEST_SHA = '4add1aa27ca26fac6552ae58da062bc15af2f8be0094ab89610755d4cc13bade'
BRIDGE_SHA = '4459d1098e5e44b09ac395054f031b0cc6130f1c09878ebad1214ddf23fdf410'


def verify_evidence(raw, source):
    packed = raw(BASE + ARCHIVE)
    assert entry(packed)['sha256'] == ARCHIVE_SHA
    with ZipFile(BytesIO(packed)) as packet:
        assert packet.testzip() is None and len(packet.namelist()) == 18
        assert entry(packet.read('MANIFEST.json'))['sha256'] == MANIFEST_SHA
        manifest = json.loads(packet.read('MANIFEST.json'))
        assert set(packet.namelist()) == set(manifest['files']) | {'MANIFEST.json'}
        for name, pin in manifest['files'].items():
            assert entry(packet.read(name))['sha256'] == pin, name
        assert raw(BASE + 'frozen-n4-bridge.json') == packet.read('frozen-n4-bridge.json')
        bound = json.loads(packet.read('hosted-binding.json'))
        atoms = json.loads(packet.read('relative-final.json'))
        geometry = json.loads(packet.read('plus-one.json'))
        raw_trace = json.loads(packet.read('raw-trace.json'))
    bridge = source(BASE + 'frozen-n4-bridge.json')
    assert manifest['files']['frozen-n4-bridge.json'] == BRIDGE_SHA
    assert bridge['scope'].startswith('Full frozen F/G background at original representatives')
    assert bridge['M3'] == '62/64' and bridge['finalJets'] == '0/67' and bridge['release'] == 'HOLD'
    assert bound['hostedNodeStreamSHA256'] == 'ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd'
    assert (bound['fullGraphNodes'], bound['identicalOriginalPrefixNodes']) == (7358162, 127241)
    assert (bound['actualSystem'], bound['auxiliarySystem']) == (7, 6)
    assert (bound['sourceBound'], bound['sourceSolutionNorm']) == (125092, 125097)
    assert len(raw_trace['trace']['nodes']) == 175408
    assert len(atoms['rows']) == 78 and all(row['compared'] == -1 for row in atoms['rows'])
    assert atoms['factual'] == {'finiteCap': -1, 'actualRadialGap': -1}
    assert geometry['gates']['smallGrowth128']['plusOne'] == -1
    replay = source(BASE + 'root-independent-replay.json')
    assert replay['reproducedDigest'] == {name: manifest['files'][name] for name in (
        'raw-trace.json', 'hosted-binding.json', 'relative-separated.json', 'frequency.json',
        'relative-final.json', 'flat-8.json', 'plus-one.json', 'frozen-n4-bridge.json')}
    return {'n4OriginalNodesReplayed': 7358162, 'n4IdenticalPrefix': 127241,
            'negativeSeparationSigns': 78, 'producedFilesReplayed': 8,
            'exceptionalFourthBound': 'exp(-L^6/3)', 'conditionalFrozenBudget': 'H/2^128',
            'actualOperatorTransport': 'OPEN', 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation65', date='20261120',
                   verify=verify_evidence)
