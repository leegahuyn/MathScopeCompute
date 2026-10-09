#!/usr/bin/env python3
"""Package the frozen M0/M1 source and evidence; never build or deploy the app.

--dry-run performs selection, source-pin and local-import checks without writing
an archive. The normal command writes a ZIP only after those checks pass, then
checks its complete entry set, CRCs, byte lengths, and SHA-256 digests.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
ARCHIVE_NAME = 'MathScope_M0_M1_Source_and_Evidence.zip'
MANIFEST_NAME = 'PACKAGE_MANIFEST.json'
BUILD_SNAPSHOT = 'mathscope-m1/navier/original-build-release-snapshots/20261009T181519Z/snapshot.json'
LIVE_BUILD_ROOT = 'mathscope-m1/navier/followup-20261009-default-build-resume-1750/'
LIVE_BUILD_FILES = {LIVE_BUILD_ROOT + name for name in (
    'current-stage.json', 'resource-progress.json', 'default-build.log', 'result.json',
)}
SKIP_DIRS = {
    '.lake', '.git', '.pydeps', '__pycache__', 'vendor', 'node_modules',
    '.venv', 'venv', 'mathlib-cache', 'mathlib-ym-check', 'lake-home',
}
TEXT_SUFFIXES = {
    '.mjs', '.js', '.py', '.sh', '.c', '.h', '.lean', '.json', '.md',
    '.txt', '.log', '.tap', '.css', '.html', '.toml', '.yml', '.yaml',
    '.svg', '.tex', '.sty', '.bib',
}
IMAGE_SUFFIXES = {'.png', '.jpg', '.jpeg', '.webp'}
SPECIAL_NAMES = {'lean-toolchain', 'LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING'}
OFFICIAL_FILES = {
    'mathscope-m1/navier/sources/official-repo/NavierStokes/Flatness.lean',
    'mathscope-m1/navier/sources/official-repo/NavierStokes/ProblemStatement.lean',
    'mathscope-m1/navier/sources/official-repo/LICENSE',
}
OFFICIAL_FILES.update(
    'mathscope-m1/navier/sources/official-repo/NavierStokes/' + name + '.lean'
    for name in [
        'AnalyticCoefficientBounds', 'AxisContraction', 'AxisModelBounds',
        'AxisOperators', 'AxisResolvent', 'AxisWeightEstimates',
        'NaturalAxisBridge', 'NaturalAxisCoefficients', 'NaturalAxisData',
    ]
)
OFFICIAL_VALIDATION_SUFFIXES = {'.json', '.log', '.md', '.py', '.sh', '.c', '.lean', '.diff'}
IMPORT = re.compile(
    r'^\s*(?:import|export)\s+(?:[^;]*?\s+from\s+)?[\'"]([^\'"\n]+)[\'"]',
    re.MULTILINE,
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def as_json(value) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def relative(path: Path) -> str:
    if not path.resolve().is_relative_to(ROOT):
        raise ValueError(f'Source outside the project root: {path}')
    return path.relative_to(ROOT).as_posix()


def permitted(name: str) -> bool:
    if name in LIVE_BUILD_FILES:
        return False  # The immutable release-time snapshot is packaged instead.
    parts = Path(name).parts
    if any(p in SKIP_DIRS or p.startswith('.') for p in parts):
        return False
    if name in OFFICIAL_FILES:
        return True
    if name.startswith('mathscope-m1/navier/sources/'):
        return False
    if name.startswith('mathscope-m1/navier/official-validation/'):
        # Only the root-level diagnostic/reproduction records are included.
        # In particular no checkout, toolchain, archives, .olean or helper binary.
        return len(parts) == 4 and Path(name).suffix in OFFICIAL_VALIDATION_SUFFIXES
    if not name.startswith(('mathscope-m0/', 'mathscope-m1/', 'mathscope-extension/')):
        return False
    # Full external papers and extracted paper text are never selected.
    if 'sources' in parts or any(p.lower() in {'papers', 'paper-text', 'pdf-text', 'downloads'} for p in parts):
        return False
    p = Path(name)
    return p.suffix.lower() in TEXT_SUFFIXES | IMAGE_SUFFIXES or p.name in SPECIAL_NAMES


def walk_sources(base: Path):
    for current, directories, files in os.walk(base, followlinks=False):
        current_path = Path(current)
        directories[:] = sorted(
            d for d in directories
            if d not in SKIP_DIRS and not d.startswith('.')
            and not (current_path / d).is_symlink()
            and d not in {'official-validation', 'sources'}
        )
        for filename in sorted(files):
            path = current_path / filename
            if path.is_symlink():
                continue
            name = relative(path)
            if permitted(name):
                yield name, path


def select_sources():
    selected = {}
    for base in (ROOT / 'mathscope-m1', ROOT / 'mathscope-m0'):
        if not base.is_dir():
            raise FileNotFoundError(base)
        selected.update(walk_sources(base))

    special = set(OFFICIAL_FILES) | {'mathscope-extension/session-bundle.mjs'}
    build_path = ROOT / 'mathscope-m1/build-manifest.json'
    build = json.loads(build_path.read_text())
    pins = build.get('sourceFiles')
    if not isinstance(pins, dict) or not pins:
        raise ValueError('build-manifest.json must contain nonempty sourceFiles pins.')
    special.update(pins)
    for name in sorted(special):
        path = ROOT / name
        if name != relative(path) or path.is_symlink() or not path.is_file() or not permitted(name):
            raise ValueError(f'Required source is missing or outside the packaging policy: {name}')
        selected[name] = path

    official = ROOT / 'mathscope-m1/navier/official-validation'
    if official.exists():
        for path in sorted(official.iterdir()):
            if path.is_file() and not path.is_symlink() and permitted(relative(path)):
                selected[relative(path)] = path
    return dict(sorted(selected.items())), build, pins


def check_local_imports(contents: dict[str, bytes]):
    checked = 0
    for name, data in contents.items():
        if Path(name).suffix not in {'.mjs', '.js'}:
            continue
        for value in IMPORT.findall(data.decode('utf-8')):
            if not value.startswith('.'):
                continue  # Node built-ins are supplied by Node, not copied.
            target = (ROOT / name).parent / value
            target_name = relative(target.resolve())
            if target_name not in contents:
                raise ValueError(f'Missing packaged local import: {name} -> {value}')
            checked += 1
    return checked


def prepare():
    selected, build, pins = select_sources()
    contents = {}
    for name, path in selected.items():
        data = path.read_bytes()
        if path.suffix.lower() not in IMAGE_SUFFIXES and b'\x00' in data:
            raise ValueError(f'Binary content in a source/text record: {name}')
        contents[name] = data
    mismatches = [name for name, expected in pins.items() if sha(contents[name]) != expected]
    if mismatches:
        raise ValueError('Installed build source pin mismatch: ' + ', '.join(mismatches))
    local_imports = check_local_imports(contents)
    if BUILD_SNAPSHOT not in contents:
        raise ValueError('The frozen original-build release snapshot is missing.')
    build_snapshot = json.loads(contents[BUILD_SNAPSHOT])
    if set(build_snapshot['liveMutatingFilesToExcludeFromArchive']) != LIVE_BUILD_FILES:
        raise ValueError('Live-build exclusions differ from the immutable snapshot.')
    if not build_snapshot.get('integrityGatePassed'):
        raise ValueError('Original-build snapshot integrity gate did not pass.')
    counts = collections.Counter(name.split('/')[0] for name in contents)
    manifest = {
        'schema': 'MathScope.M0M1.SourcePackage/1',
        'createdAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'archiveName': ARCHIVE_NAME,
        'hashAlgorithm': 'SHA-256',
        'fileCount': len(contents),
        'uncompressedBytes': sum(map(len, contents.values())),
        'files': [{'path': name, 'bytes': len(data), 'sha256': sha(data)} for name, data in contents.items()],
        'build': {'path': 'mathscope-m1/build-manifest.json', 'sha256': sha(contents['mathscope-m1/build-manifest.json']),
                  'workerSha256': build['workerSha256'], 'bundleSha256': build['bundleSha256'],
                  'sourcePinsMatched': len(pins)},
        'checksBeforeWriting': {'localImportEdgesIncluded': local_imports, 'roots': dict(counts)},
        'originalBuildAtSnapshot': {
            'path': BUILD_SNAPSHOT, 'sha256': sha(contents[BUILD_SNAPSHOT]),
            'capturedUTC': build_snapshot['captureCompletedUTC'],
            'status': build_snapshot['wholeDefaultBuild']['status'],
            'exitCode': build_snapshot['wholeDefaultBuild']['exitCode'],
            'liveFilesOmitted': sorted(LIVE_BUILD_FILES),
            'buildWasNotStoppedForPackaging': True,
        },
        'omitted': [
            '.lake/.git/.pydeps/vendor, Node/Python installed dependencies and caches',
            'Official Lean/Go/Rust/helper binaries, mathlib/toolchain downloads and archives',
            'Full external paper PDFs and extracted full paper text',
            'The full official NS checkout; only unchanged Flatness/ProblemStatement, nine audited axis dependency sources and LICENSE are included',
            'Nested official-validation repositories/toolchains; only root-level JSON/log/MD/Python/shell/C/Lean/diff probe and audit records are included',
            'The four active original-build progress/result/log files listed in originalBuildAtSnapshot; the separately frozen source/toolchain/build/Comparator snapshot is included instead',
        ],
        'reproduction': {
            'cli': 'Node.js24+; node mathscope-m1/cli.mjs list; no npm dependencies for the CLI',
            'browser': 'The M1 workspace integrates into an existing MathScope/M0 page; source ZIP is not a newly deployed standalone browser site.',
            'lean': 'Pinned local component audit: Lean4.34.1. Official full NS original-build attempt: Lean4.34.0-rc2 in a separate tree. Obtain external dependencies separately.',
            'dependencyInstallationsIncluded': False,
        },
        'evidenceBoundary': 'File/ZIP integrity and previous audit provenance are checked; packaging never upgrades a theorem reference, candidate result or failed build to a proof.',
        'selfDigestExcluded': 'PACKAGE_MANIFEST.json is the sole archive member omitted from its own files list.',
    }
    return selected, contents, manifest


def write_zip(output: Path, selected, contents, manifest, force: bool):
    output = output.resolve()
    if output.exists() and not force:
        raise FileExistsError(f'Output exists; choose a new path or pass --force: {output}')
    output.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix='MathScope-source-', suffix='.tmp', dir=output.parent)
    os.close(descriptor)
    temp = Path(temporary)
    manifest_bytes = as_json(manifest)
    try:
        now = dt.datetime.now(dt.timezone.utc)
        zip_time = (now.year, now.month, now.day, now.hour, now.minute, now.second)
        with zipfile.ZipFile(temp, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name, data in {**contents, MANIFEST_NAME: manifest_bytes}.items():
                info = zipfile.ZipInfo(name, date_time=zip_time)
                info.compress_type = zipfile.ZIP_DEFLATED
                info.create_system = 3
                info.external_attr = (0o100755 if data.startswith(b'#!') else 0o100644) << 16
                archive.writestr(info, data)
        with zipfile.ZipFile(temp) as archive:
            expected_names = set(contents) | {MANIFEST_NAME}
            if len(archive.namelist()) != len(expected_names) or set(archive.namelist()) != expected_names:
                raise ValueError('ZIP contains a duplicate, omitted or unexpected path.')
            if archive.testzip() is not None:
                raise ValueError('ZIP CRC verification failed.')
            if archive.read(MANIFEST_NAME) != manifest_bytes:
                raise ValueError('ZIP manifest bytes differ.')
            for entry in manifest['files']:
                data = archive.read(entry['path'])
                if len(data) != entry['bytes'] or sha(data) != entry['sha256']:
                    raise ValueError('ZIP content hash mismatch: ' + entry['path'])
        changed = [name for name, path in selected.items() if sha(path.read_bytes()) != sha(contents[name])]
        if changed:
            raise ValueError('Sources changed during packaging; retry after freeze: ' + ', '.join(changed))
        if output.exists() and not force:
            raise FileExistsError('Output was created by another process: ' + str(output))
        os.replace(temp, output)
    finally:
        if temp.exists():
            temp.unlink()
    zip_digest = sha(output.read_bytes())
    receipt = {
        'schema': 'MathScope.M0M1.SourcePackageReceipt/1', 'status': 'ZIP_CONTENT_VERIFIED',
        'path': str(output), 'bytes': output.stat().st_size, 'sha256': zip_digest,
        'packagedSourceFiles': len(contents), 'archiveEntries': len(contents) + 1,
        'manifestSha256': sha(manifest_bytes), 'sourcePinsMatched': manifest['build']['sourcePinsMatched'],
        'crcVerified': True, 'everyEntryHashVerified': True, 'sourcesUnchangedDuringPackaging': True,
        'formalPass': False, 'buildOrDeploymentPerformed': False,
    }
    output.with_suffix(output.suffix + '.sha256').write_text(f'{zip_digest}  {output.name}\n')
    receipt_path = output.with_suffix('.package-receipt.json')
    receipt_path.write_bytes(as_json(receipt))
    return {**receipt, 'receiptPath': str(receipt_path)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true', help='Verify selection and pins; create no ZIP or manifest file.')
    parser.add_argument('--output', type=Path, default=ROOT / 'output' / ARCHIVE_NAME)
    parser.add_argument('--force', action='store_true', help='Replace an existing archive after complete verification.')
    args = parser.parse_args()
    selected, contents, manifest = prepare()
    if args.dry_run:
        print(as_json({'status': 'DRY_RUN_VERIFIED_NO_ARCHIVE_WRITTEN',
                       'outputIfExecuted': str(args.output.resolve()),
                       'files': manifest['fileCount'], 'uncompressedBytes': manifest['uncompressedBytes'],
                       'sourcePinsMatched': manifest['build']['sourcePinsMatched'],
                       'localImportEdgesIncluded': manifest['checksBeforeWriting']['localImportEdgesIncluded'],
                       'roots': manifest['checksBeforeWriting']['roots'],
                       'officialSourcesIncluded': sorted(OFFICIAL_FILES),
                       'officialValidationRecords': sum('/official-validation/' in p for p in contents),
                       'archiveWritten': False}).decode(), end='')
        return
    print(as_json(write_zip(args.output, selected, contents, manifest, args.force)).decode(), end='')


if __name__ == '__main__':
    main()
