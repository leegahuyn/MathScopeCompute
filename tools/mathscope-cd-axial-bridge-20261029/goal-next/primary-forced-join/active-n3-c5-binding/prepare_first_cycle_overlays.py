"""Restore the 29 pinned PR30 files and retain byte-verified storage overlays for Node."""
from hashlib import sha1, sha256
import json
from pathlib import Path
import re
import subprocess
import sys


def main(out):
    def read(name):
        return json.loads((out / name).read_bytes())

    navier = Path('research-ide/mathscope-m3/navier')
    pins_source = (navier / 'source-signed-162-pr30-pins.mjs').read_text(encoding='utf-8')
    pins = dict(re.findall(r"'([^']+\.mjs)':'([0-9a-f]{40})'", pins_source))
    assert len(pins) == 29
    patched = {row['file']: row['overlaySHA256'] for row in read('bounded-seal-overlays.json')['files']
               if row['exactByteReversal']}
    patched.update({path: row['afterSHA256'] for path, row in read('bounded-lower-overlays.json')['files'].items()
                    if row['reversedToExactInput']})
    patched.update({(navier / row['file']).as_posix(): row['outputSHA256']
                    for row in read('forced-preparation.json')['files'] if row['exactStorageAndBudgetReversal']})

    overlays = out / 'pr30-runtime-overlays'
    overlays.mkdir()
    manifest = []
    for name, pin in pins.items():
        path = Path(name)
        original = subprocess.check_output(['git', 'show', 'HEAD:' + name])
        assert sha1(f'blob {len(original)}\0'.encode() + original).hexdigest() == pin, name
        actual = path.read_bytes()
        if actual == original:
            continue
        digest = sha256(actual).hexdigest()
        assert patched[name] == digest, name
        overlay = overlays / (digest + '.mjs')
        overlay.write_bytes(actual)
        path.write_bytes(original)
        manifest.append({'original': name, 'gitBlobSHA': pin,
                         'overlay': overlay.relative_to(out).as_posix(), 'sha256': digest})
    assert {row['original'] for row in manifest} == set(pins) & set(patched)
    (out / 'pr30-runtime-overlays.json').write_text(
        json.dumps({'schema': 'MathScope.PR30OriginalVerifiedStorageOverlays/1', 'files': manifest}, indent=2) + '\n',
        encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
