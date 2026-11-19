"""Verify the scope and exact bytes of the stopped original first-cycle run."""

from argparse import ArgumentParser
import hashlib
import json
from pathlib import Path
import re


PINS = {
    'first-cycle.json': '18bcb6485ac4fcf1ae30dfe1ded334c3f1075d9cdd1f285708ce79da3904b60d',
    'same-family-mode-two.json': 'c41b935776e89691073a40ead9d2f3bfa800540e8c515f6c785016c94612dcbf',
    'pr30-source-pins.json': '3f57354aca3da79d475e0bd0605ece51c36cf2633e7744cee35d59efe874b3f7',
}


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    records = {}
    for name, digest in PINS.items():
        raw = (args.directory / name).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == digest, name
        records[name] = json.loads(raw)

    cycle = records['first-cycle.json']
    forced = records['same-family-mode-two.json']
    assert forced['status'] == 'VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED'
    assert forced['completeForcedSeal'] is True
    assert len(forced['full']['checks']) == 805
    assert all(row['pass'] is True for row in forced['full']['checks'])
    assert cycle['sourceForcedNodeCount'] == 21999237
    assert [row['name'] for row in cycle['stages']] == [
        'original-latest-corollary-8-5-stress',
        'original-signed-162-successor',
        'original-post-signed-temporal-frontier',
    ]
    stress, signed, frontier = cycle['stages']
    assert len(stress['checks']) == 18 and all(row['pass'] is True for row in stress['checks'])
    assert signed['indexedRows'] == 1620
    assert len(signed['roots']['velocity']) == len(signed['roots']['defects']) == 3
    assert len(signed['roots']['covariance']) == 6
    roots = [signed['roots']['pressure']]
    for name in ('velocity', 'pdeResidual', 'defects', 'covariance'):
        roots.extend(signed['roots'][name])
    assert all(isinstance(root, int) and 0 <= root < signed['nodeCount'] for root in roots)
    assert frontier['scope']['sameSignedPrivateSource'] is True
    assert frontier['scope']['normalizedTorusMeanComputed'] is True
    assert frontier['scope']['exactCenteredSourcesGenerated'] is True
    assert frontier['scope']['inverseNActuallyConstructed'] is False
    assert cycle['status'] == 'STOPPED_DURING_FIRST_CYCLE'
    assert cycle['error']['code'] == 'INVALID_TEMPORAL_OPTIONS'
    assert cycle['stoppedNodes'] == frontier['nodeCount'] == 22032009
    for name, count in (('signed-frame-tangency.tap', 10), ('signed-original-cover-and-registry.tap', 106)):
        text = (args.directory / name).read_text(encoding='utf8')
        assert re.search(r'^[#ℹ] fail 0$', text, re.MULTILINE)
        assert re.search(rf'^[#ℹ] pass {count}$', text, re.MULTILINE)
    assert cycle['finalJets'] == '0/67' and cycle['N706'] == cycle['N805'] == 'OPEN'
    report = {
        'status': 'VERIFIED_ORIGINAL_SIGNED_AND_CENTERED_TEMPORAL_SOURCE_READBACK',
        'run': 44029534187, 'originalForcedChecks': 805, 'latestStressChecks': 18,
        'signedIndexedRows': 1620, 'lastSourceNodeCount': 22032009,
        'terminalError': cycle['error'], 'inputSHA256': PINS,
        'scope': 'Exact pinned hosted records of same-private source construction and native checks. '
                 'The original exact Temporal inverse, FiveMap and physical residual stages did not run. '
                 'Analytic bounds, source identities beyond recorded construction and final fields remain open.',
        'release': 'HOLD',
    }
    args.output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf8', newline='\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
