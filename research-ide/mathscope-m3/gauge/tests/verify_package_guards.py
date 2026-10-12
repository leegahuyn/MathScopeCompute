#!/usr/bin/env python3
"""Exercise receipt packaging against mutations in an isolated source copy."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parents[1]
IDE = HERE.parents[1]
REPO = IDE.parent

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

local = json.loads((HERE / 'evidence/lean-audit.json').read_text())
release = json.loads((HERE / 'evidence/real-lean-release.json').read_text())
real = release['report']
real_root = HERE / 'evidence/real-lean-audit'
files = {HERE / 'package_lean.py', HERE / 'evidence/lean-audit.json',
         HERE / 'legacy/original-validation.json', HERE / 'evidence/real-lean-release.json',
         HERE / 'evidence' / release['archive'], real_root / 'audit.json',
         real_root / 'import-closure.json'}
for row in local['commands'] + local['inheritedLegacySources']:
    files.add(IDE / row['sourcePath'])
for row in local['commands']:
    files.add(IDE / row['logPath'])
for row in real['sourceFiles']:
    files.add(REPO / row['path'])
commands = [real['build'], real['consumerAudit']]
for row in real['hypothesisRemovalControls']:
    commands += [row['positiveControl'], row['negativeControl']]
    files.add(real_root / ('Consumer_' + row['id'] + '.lean'))
    files.add(real_root / ('Removed_' + row['id'] + '.lean'))
for row in commands:
    files.add(real_root / row['logFile'])
before = {str(file.relative_to(REPO)): sha(file.read_bytes()) for file in files}
rows = []
with tempfile.TemporaryDirectory(prefix='gauge-receipt-guards-') as tmp:
    shadow = Path(tmp)
    for file in files:
        destination = shadow / file.relative_to(REPO)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(file, destination)
    script = shadow / (HERE / 'package_lean.py').relative_to(REPO)

    def execute(name, expected_error=None):
        result = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
        expected = result.returncode == 0 if expected_error is None else (
            result.returncode != 0 and expected_error in result.stderr)
        rows.append({'id': name, 'exitCode': result.returncode,
                     'expectedOutcomeObserved': expected,
                     'stdout': result.stdout, 'stderr': result.stderr})
        assert expected, name + ': ' + result.stdout + result.stderr

    execute('unchanged_sources_package')
    probes = [
        ('changed_finite_source', HERE / 'lean/FiniteSpectral.lean',
         b'\n-- isolated mutation control\n', 'Source changed after its kernel receipt'),
        ('changed_real_source', HERE / 'lean/RealSpectralBridge.lean',
         b'\n-- isolated mutation control\n', 'Real source changed after CI'),
        ('changed_compiler_log', real_root / real['build']['logFile'],
         b'\nchanged log bytes\n', 'A real raw compiler log changed'),
        ('changed_import_closure', real_root / 'import-closure.json',
         b'\n', 'The real imported closure changed'),
    ]
    for name, source, suffix, expected_error in probes:
        target = shadow / source.relative_to(REPO)
        original = target.read_bytes()
        target.write_bytes(original + suffix)
        execute(name, expected_error)
        target.write_bytes(original)
    execute('restored_sources_package')
after = {str(file.relative_to(REPO)): sha(file.read_bytes()) for file in files}
assert before == after, 'A real working source or kernel receipt was modified'
receipt = {'schema': 'MathScope.M3.GaugePackageGuardAudit/1',
           'status': 'EXECUTED_IN_ISOLATED_COPY',
           'packagerSha256': sha((HERE / 'package_lean.py').read_bytes()),
           'verifiedLiveInputs': before, 'liveSourceAndReceiptBytesUnchanged': True,
           'processes': rows,
           'scope': 'Packaging guard checks only; no new Lean execution or proof authority.'}
(HERE / 'evidence/package-guard-audit.json').write_text(
    json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': receipt['status'], 'processes': len(rows),
                  'allExpected': all(row['expectedOutcomeObserved'] for row in rows),
                  'liveSourcesUnchanged': True}))
