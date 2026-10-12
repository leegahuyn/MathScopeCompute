"""Read and hash frozen M2 receipts without changing their scope or files."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parents[1]
PATHS = {
    'final': 'research-ide/mathscope-m2/navier/research/evidence/m2-final-completion-20261011/M2_FINAL_COMPLETION.json',
    'common6': 'research-ide/mathscope-m2/navier/research/evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json',
    'source4': 'research-ide/mathscope-m2/navier/research/evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt4.json',
}
EXPECTED = {
    'final': 'aad34e553582c48778684e9b2ddd18e7fcdb016e9282f44c5f39a3b670586ad7',
    'common6': 'ac98143158c9e7abc6bd656e687269f183bb803ecdc036edb8a3937edc24bc01',
    'source4': '88f7cf6fe5af934d6b3bcacc8ad975e86bd0b37fee2110b9db8c73e72acb129e',
}
IMPLEMENTATION_FILES = (
    'galerkin.mjs', 'corrections.mjs', 'localization.mjs', 'index.mjs',
    'source-mean-map.mjs', 'source-inheritance.mjs', 'flow-observations.mjs',
    'source-current-state.mjs', 'source-pressure.mjs', 'source-higher-jets.mjs',
    'source-signed-stress.mjs', 'source-current-evidence.mjs',
    'source-inner-growth.mjs', 'source-inner-growth-evidence.mjs',
)


def update_implementation_pin():
    """Hash current M3 implementation without rewriting frozen inheritance."""
    implementation = []
    for filename in IMPLEMENTATION_FILES:
        raw = (OUT / filename).read_bytes()
        implementation.append({'path': 'research-ide/mathscope-m3/navier/' + filename,
                               'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)})
    aggregate = hashlib.sha256(json.dumps(implementation, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    pin = {'schema': 'MathScope.NavierM3.ImplementationPin/1', 'files': implementation, 'sha256': aggregate}
    (OUT / 'implementation-pin.mjs').write_text('// Generated from actual implementation bytes; regenerate after an implementation edit.\nexport const implementationPin = ' + json.dumps(pin, separators=(',', ':')) + ';\n')
    return pin


def main():
    files, values = {}, {}
    for name, relative in PATHS.items():
        raw = (ROOT / relative).read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if name in EXPECTED and digest != EXPECTED[name]:
            raise ValueError(f'{name}: frozen M2 source digest mismatch')
        values[name] = json.loads(raw)
        files[name] = {'path': relative, 'sha256': digest, 'bytes': len(raw)}
    final = values['final']
    for name in ('source4', 'common6'):
        if final['references'][name]['sha256'] != files[name]['sha256']:
            raise ValueError(f'{name}: final completion references a different source')
    common, source4 = values['common6'], values['source4']
    covariance = common['certificates']['covariance']
    interface = covariance['n6Interface']
    scope = final['mathematicalScope']
    if scope['wholeUncorrectedNSResidualDeclaredFlat'] or not scope['nonlinearAndCurlRemaindersRemainN6Inputs']:
        raise ValueError('M2 scope no longer retains the uncorrected residual for N6')
    if covariance['scope']['actualN6CorrectionPerformed']:
        raise ValueError('Expected the frozen pre-correction M2 interface')
    source_checks = []
    for name in ('initialManifest', 'lateImportManifest'):
        for path, expected in source4.get(name, {}).get('files', {}).items():
            actual = ROOT / path
            digest = hashlib.sha256(actual.read_bytes()).hexdigest() if actual.exists() else None
            source_checks.append({'path': path, 'expected': expected, 'actual': digest, 'pass': digest == expected})
    if any(not row['pass'] for row in source_checks):
        bad = [row['path'] for row in source_checks if not row['pass']]
        raise ValueError(f'M2 executed source changed: {bad}')
    record = {
        'schema': 'MathScope.N6.M2SourceInheritance/1',
        'baseCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'files': files,
        'sourceProfile': covariance['sourceBinding']['sourceProfile'],
        'parameterExpressionSHA256': covariance['sourceBinding']['parameterExpressionSHA256'],
        'graph': covariance['graph'],
        'n6Interface': interface,
        'frozenScope': scope,
        'allReferencedSourceFilesMatch': all(row['pass'] for row in source_checks),
        'sourceFileChecks': source_checks,
        'source4NumericRunPassed': source4['pass'],
        'common6DeclaredComplete': common['complete'],
        'inheritedM2Assessment': final['assessment'],
        'scopeOfThisCheck': 'Byte identity, namespace and boundary validation only; the old computations are not rerun or enlarged.',
        'actualN6CorrectionApplied': False,
        'sourceReconstructionComplete': False,
    }
    (OUT / 'source-inheritance.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
    small = {k: v for k, v in record.items() if k != 'sourceFileChecks'}
    small['sourceFileCheckCount'] = len(source_checks)
    (OUT / 'source-inheritance.mjs').write_text('// Generated by tests/build-source-inheritance.py from byte-checked frozen M2 receipts.\nexport const inheritedSource = ' + json.dumps(small, ensure_ascii=False, separators=(',', ':')) + ';\n')
    update_implementation_pin()
    print(json.dumps({'pass': True, 'sourceFileChecks': len(source_checks), 'files': files}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pin-only', action='store_true',
                        help='Update current M3 implementation hashes while preserving inheritance receipt bytes.')
    args = parser.parse_args()
    if args.pin_only:
        pin = update_implementation_pin()
        print(json.dumps({'pass': True, 'implementationFileCount': len(pin['files']),
                          'implementationSHA256': pin['sha256'], 'inheritanceReceiptsRewritten': False}))
    else:
        main()
