"""Package M0 sources, necessary legacy test modules, and delivery evidence."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parent.parent
M0 = ROOT / 'mathscope-m0'
OUT = ROOT / 'output'
OUT.mkdir(exist_ok=True)
archive_path = OUT / 'MathScope_M0_Source_and_Verification.zip'
manifest_path = M0 / 'evidence/source-archive-manifest.json'

files = [p for p in M0.rglob('*') if p.is_file()
         and p != manifest_path
         and not any(part.startswith('.') or part == '__pycache__'
                     for part in p.relative_to(M0).parts)
         and p.suffix not in {'.pyc', '.olean', '.ir'}]
for name in ['session-bundle.mjs', 'arithmetic-model.mjs',
             'arithmetic-model.test.mjs', 'ym-model.mjs',
             'test-ym-model.mjs', 'ns-model.mjs', 'ns-model.test.mjs']:
    files.append(ROOT / 'mathscope-extension' / name)
files.append(OUT / 'pdf/MathScope_M0_Implementation_Checklist_KO.pdf')
files = sorted(files)
manifest = {
    'schema': 'MathScope.M0SourceArchive/1',
    'pageVersion': 44,
    'pageVersionHash': '4d79dd82',
    'scope': 'M0 sources and verified bounded functionality; legacy snapshot is masked and not a full overwrite deployment.',
    'files': [{
        'path': str(p.relative_to(ROOT)),
        'bytes': p.stat().st_size,
        'sha256': hashlib.sha256(p.read_bytes()).hexdigest()
    } for p in files]
}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
files.append(manifest_path)
with zipfile.ZipFile(archive_path, 'w', compression=zipfile.ZIP_DEFLATED,
                     compresslevel=9) as archive:
    for p in sorted(files):
        archive.write(p, str(p.relative_to(ROOT)))
with zipfile.ZipFile(archive_path) as archive:
    if archive.testzip() is not None:
        raise RuntimeError('Archive CRC verification failed')
    for item in manifest['files']:
        if hashlib.sha256(archive.read(item['path'])).hexdigest() != item['sha256']:
            raise RuntimeError('Archive file hash mismatch: ' + item['path'])
result = {'path': str(archive_path), 'files': len(files),
          'bytes': archive_path.stat().st_size,
          'sha256': hashlib.sha256(archive_path.read_bytes()).hexdigest(),
          'crcAndFileHashes': 'PASS'}
(OUT / 'MathScope_M0_Delivery_Manifest.json').write_text(
    json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False))
