"""Build a scratch import preflight using the archived active M3 overlay bytes."""

import argparse
from hashlib import sha256
import json
from pathlib import Path
from shutil import copytree, copyfile


def check(path, expected):
    assert sha256(path.read_bytes()).hexdigest() == expected, path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original_probe', type=Path, help='previous minimal original research-ide tree')
    parser.add_argument('active_run', type=Path, help='active N3 first cycle 44553053960 artifacts')
    parser.add_argument('goal_next', type=Path)
    parser.add_argument('large_seal', type=Path, help='archived generated helper with captureNodes export')
    parser.add_argument('coupled', type=Path, help='original f8cb coupled-expressions blob')
    parser.add_argument('scratch', type=Path)
    args = parser.parse_args()
    assert not args.scratch.exists()
    tree = args.scratch / 'research-ide'
    copytree(args.original_probe, tree)
    manifest = json.loads((args.active_run / 'pr30-runtime-overlays.json').read_bytes())
    assert manifest['schema'] == 'MathScope.PR30OriginalVerifiedStorageOverlays/1'
    assert len(manifest['files']) == 12
    for row in manifest['files']:
        relative_path = Path(row['original'])
        assert relative_path.parts[0] == 'research-ide'
        path = args.scratch / relative_path
        source = args.active_run / row['overlay']
        check(source, row['sha256'])
        copyfile(source, path)
    for source, dest in (
        ('primary-forced-join/active-c5/capture_source_delta.mjs', 'mathscope-m3/navier/mathscope-active-forced-seal.mjs'),
        ('primary-forced-weights/live-c5/large-pack/owned_lookup.mjs', 'mathscope-m2/navier/mathscope-owned-lookup.mjs'),
        ('primary-forced-weights/live-c5/compact-lookup/compact_lookup.mjs', 'mathscope-m2/navier/mathscope-compact-lookup.mjs'),
    ):
        copyfile(args.goal_next / source, tree / dest)
    size_seal = json.loads((args.active_run / 'bounded-seal-overlays.json').read_bytes())
    assert size_seal['helperSHA256'] == '94df5d1171246de92226d11fc1710a1453c9399fe054400f00feeb7f29916019'
    check(args.large_seal, size_seal['helperSHA256'])
    copyfile(args.large_seal, tree / 'mathscope-m2/navier/mathscope-large-seal.mjs')
    check(args.coupled, '5f83192211b649526a2616421a68c9e53004ace96776243e55e37b0a6973cf39')
    copyfile(args.coupled, tree / 'mathscope-m3/navier/source-coupled-expressions.mjs')
    check(tree / 'mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs',
          '4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7')
    print(json.dumps({'verifiedActiveM3Overlays': len(manifest['files']),
                      'staticTransitiveSourceScope': 'Existing probe and archived effective M3 bytes; no active 22M AST or live owners.'}))


if __name__ == '__main__':
    main()
