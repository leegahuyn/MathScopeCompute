"""Copy the exact Git blobs used by the isolated R1-06 defensive replay."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import posixpath
import re
import subprocess

PIN = 'e5113446c4d4ede3decd6107e6ab3dd52dce1697'
SEEDS = (
    'research-ide/mathscope-m4/acceptance.mjs',
    'research-ide/mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json',
    'research-ide/mathscope-m1/arithmetic/index.mjs',
    'research-ide/mathscope-m3/navier/source-exterior-force-evidence.mjs',
    'research-ide/mathscope-m3/navier/source-exterior-force-jets.mjs',
    'research-ide/mathscope-m3/navier/source-localization-domain.mjs',
)
RELATIVE_IMPORT = re.compile(
    r"""(?:\bfrom\s+|\bimport\s*(?:\(\s*)?)['"](\.{1,2}/[^'"]+)['"]"""
)

def materialize(repo, output):
    def git(*args):
        return subprocess.check_output(
            ['git', '-c', 'core.longpaths=true', '-C', str(repo), *args]
        )
    tracked = set(git('ls-tree', '-r', '--name-only', PIN, 'research-ide').decode().splitlines())
    files, todo = {}, list(SEEDS)
    while todo:
        path = todo.pop()
        if path in files:
            continue
        assert path in tracked, path
        data = git('show', f'{PIN}:{path}')
        files[path] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        dest = output / 'source' / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        if dest.suffix not in {'.mjs', '.js'}:
            continue
        for import_path in RELATIVE_IMPORT.findall(data.decode('utf-8')):
            dep = posixpath.normpath(str(PurePosixPath(path).parent / import_path))
            if dep in tracked:
                todo.append(dep)
    receipt = {'sourceCommit': PIN, 'files': dict(sorted(files.items()))}
    (output / 'source-pin.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'{len(files)} pinned runtime files')

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('repo', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    materialize(args.repo, args.output)
