#!/usr/bin/env python3
"""Verify and restore the exact v54 source archive into a new directory."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import tempfile
import zipfile

EXPECTED_ARCHIVE_SHA256 = 'ccc8d6dd7bc85f8e5a054aa04c0adab6f1ebd3172a175c667180cf9ef75b58f9'
EXPECTED_ARCHIVE_BYTES = 73559111
EXPECTED_MANIFEST_SHA256 = 'd4bcc38dcd6186cef9b6a9169fca6b8f900f0afc776f00eb3e5ae803754f94ae'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validate_original_archive(path: Path):
    raw = path.read_bytes()
    if len(raw) != EXPECTED_ARCHIVE_BYTES or sha(raw) != EXPECTED_ARCHIVE_SHA256:
        raise ValueError('This is not the exact delivered v54 archive. No extraction was performed.')
    with zipfile.ZipFile(path) as archive:
        manifest_bytes = archive.read('PACKAGE_MANIFEST.json')
        if sha(manifest_bytes) != EXPECTED_MANIFEST_SHA256:
            raise ValueError('Original package-manifest digest differs.')
        manifest = json.loads(manifest_bytes)
        records = {entry['path']: entry for entry in manifest['files']}
        if len(records) != 935 or len(manifest['files']) != 935:
            raise ValueError('Unexpected or duplicated original source membership.')
        names = archive.namelist()
        if len(names) != 936 or set(names) != set(records) | {'PACKAGE_MANIFEST.json'}:
            raise ValueError('Original ZIP membership differs from its manifest.')
        if archive.testzip() is not None:
            raise ValueError('Original ZIP CRC verification failed.')
        contents = {}
        for name in names:
            pure = PurePosixPath(name)
            if pure.is_absolute() or '..' in pure.parts or '\\' in name:
                raise ValueError(f'Unsafe archive path: {name}')
            info = archive.getinfo(name)
            if (info.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError(f'Symbolic link in original archive: {name}')
            data = archive.read(name)
            if name != 'PACKAGE_MANIFEST.json':
                record = records[name]
                if len(data) != record['bytes'] or sha(data) != record['sha256']:
                    raise ValueError(f'Original member digest differs: {name}')
            contents[name] = data
    return contents, manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--destination', required=True, type=Path)
    args = parser.parse_args()
    destination = args.destination.absolute()
    if destination.exists() or destination.is_symlink():
        raise FileExistsError('Destination must be new; existing files are never overwritten.')
    contents, manifest = validate_original_archive(args.archive)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp = Path(tempfile.mkdtemp(prefix='mathscope-v54-restore-', dir=destination.parent))
    try:
        for name, data in contents.items():
            target = temp / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            if data.startswith(b'#!'):
                target.chmod(0o755)
        if destination.exists() or destination.is_symlink():
            raise FileExistsError('Destination was created during verification; refusing to replace it.')
        os.rename(temp, destination)
    finally:
        if temp.exists():
            shutil.rmtree(temp)
    print(json.dumps({
        'status': 'ORIGINAL_ARCHIVE_RESTORED',
        'destination': str(destination),
        'sourceFiles': manifest['fileCount'],
        'archiveMembers': len(contents),
        'archiveSha256': EXPECTED_ARCHIVE_SHA256,
        'everyMemberHashVerified': True,
        'buildOrDeploymentPerformed': False,
    }, indent=2))


if __name__ == '__main__':
    main()
