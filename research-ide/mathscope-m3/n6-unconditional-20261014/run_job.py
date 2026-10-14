"""Bounded source research: successful execution never grants N6 acceptance."""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
import os
import platform
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tempfile
import time

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
LIMIT = 1200

def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()

def write(path, value):
    Path(path).write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode())

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module

def safe_name(name):
    path = PurePosixPath(name)
    if not name or '\\' in name or ':' in name or path.is_absolute() or '..' in path.parts or str(path) != name:
        raise ValueError('Unsafe or noncanonical receipt path')
    return path

def verify_receipt(folder, expected_commit, require_success=True):
    """Verify the exact complete file set, not just a selected result digest."""
    folder = Path(folder).resolve()
    receipt = json.loads((folder / 'receipt.json').read_text(encoding='utf8'))
    if receipt['sourceCommit'] != expected_commit:
        raise ValueError('Receipt source SHA mismatch')
    if require_success and receipt['executionStatus'] != 'SUCCESS':
        raise ValueError('A failed execution cannot be used as a successful input')
    records = receipt['members']
    names = [str(safe_name(row['path'])) for row in records]
    if len(names) != len(set(names)) or 'receipt.json' in names:
        raise ValueError('Duplicate or self-referential receipt member')
    actual = set()
    for path in folder.rglob('*'):
        if path.is_symlink():
            raise ValueError('Receipt inputs must not contain symlinks')
        if path.is_file():
            actual.add(path.relative_to(folder).as_posix())
    if actual != set(names) | {'receipt.json'}:
        raise ValueError('Missing or extra receipt member')
    for row in records:
        path = folder / row['path']
        if path.stat().st_size != row['bytes'] or sha(path) != row['sha256']:
            raise ValueError('Receipt bytes changed: ' + row['path'])
    return {'sourceCommit': expected_commit, 'membersVerified': len(records),
            'receiptSHA256': sha(folder / 'receipt.json'), 'executionStatus': receipt['executionStatus'],
            'byteIntegrityIsMathematicalProof': False}

def verify_pins():
    lock = json.loads((HERE / 'INPUT_LOCK.json').read_text(encoding='utf8'))
    found = {}
    for name, expected in lock['protectedSources'].items():
        path = REPO / safe_name(name)
        found[name] = sha(path)
        if found[name] != expected:
            raise ValueError('Protected source changed: ' + name)
    for name, expected in lock['verifierAndReferenceInputs'].items():
        if sha(REPO / safe_name(name)) != expected:
            raise ValueError('Pinned verifier/reference changed: ' + name)
    return found

def execute(command, out, log_name, deadline):
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise subprocess.TimeoutExpired(command, LIMIT)
    with (out / log_name).open('w', encoding='utf8') as log:
        result = subprocess.run(command, cwd=REPO, stdout=log, stderr=subprocess.STDOUT,
                                timeout=remaining, env={**os.environ, 'PYTHONUTF8': '1'})
    if result.returncode:
        raise RuntimeError(f'Command exit {result.returncode}; inspect {log_name}')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--kind', required=True, choices=['prepare', 'controls', 'rayleigh', 'analytic', 'cartesian', 'acceptance'])
    parser.add_argument('--output', required=True)
    parser.add_argument('--research-output')
    args = parser.parse_args()
    out = Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    deadline = start + LIMIT
    code = 0
    before = None
    working_status = subprocess.check_output(['git', 'status', '--porcelain'], cwd=REPO, text=True)
    metadata = {
        'schema': 'MathScope.N6Unconditional.Execution/1', 'kind': args.kind,
        'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
        'baselineCommit': 'a08d9de1777cf460e6fa980674c5c70939201457',
        'workingTreeStatusAtStart': working_status,
        'codeIsExactCleanCommit': not working_status.strip(),
        'workflowRunId': os.environ.get('GITHUB_RUN_ID'),
        'workflowRunAttempt': os.environ.get('GITHUB_RUN_ATTEMPT'),
        'startedAtUTC': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'python': platform.python_version(), 'node': subprocess.check_output(['node', '--version'], text=True).strip(),
        'platform': platform.platform(), 'cpuCount': os.cpu_count(), 'commandTimeoutSeconds': LIMIT,
        'runner': os.environ.get('RUNNER_NAME', 'local'), 'runnerOS': os.environ.get('RUNNER_OS', platform.system()),
        'memory': Path('/proc/meminfo').read_text() if Path('/proc/meminfo').exists() else None,
        'diskFreeBytes': shutil.disk_usage(REPO).free, 'paidLargerRunnerUsed': False,
        'heavyPassedMeanRecomputed': False, 'originalN601Complete': False, 'originalN602Complete': False,
        'implementationInputs': [{'path': path.relative_to(REPO).as_posix(), 'bytes': path.stat().st_size, 'sha256': sha(path)}
                                 for path in sorted(HERE.iterdir()) if path.is_file()]
    }
    write(out / 'started.json', metadata)
    try:
        before = verify_pins()
        metadata['protectedSourcesBefore'] = before
        inherited = load_module('inherited_run_job', HERE.parent / 'n6-continuation-20261014/run_job.py')
        with tempfile.TemporaryDirectory(prefix='n6-verified-', dir=out.parent) as temporary:
            inputs = Path(temporary)
            receipts = inherited.verify_archives(inputs if args.kind in ['rayleigh', 'analytic', 'cartesian', 'acceptance'] else None)
            write(out / 'inherited-verification.json', {'baselineHead': metadata['baselineCommit'], 'archives': receipts,
                  'integrityImpliesMathematicalProof': False})
            if args.kind == 'rayleigh':
                execute([sys.executable, '-B', str(HERE / 'rayleigh.py'), '--artifacts', str(inputs), '--output', str(out)], out, 'rayleigh.log', deadline)
            elif args.kind == 'analytic':
                execute([sys.executable, '-B', str(HERE / 'analytic_prerequisites.py'), '--artifacts', str(inputs), '--output', str(out)], out, 'analytic.log', deadline)
            elif args.kind == 'cartesian':
                execute([sys.executable, '-B', str(HERE / 'cartesian_run.py'), '--artifacts', str(inputs),
                         '--source-inputs', str(inputs / 'mean-proof-inputs-38500114302'), '--output', str(out)], out, 'cartesian.log', deadline)
            elif args.kind == 'controls':
                execute([sys.executable, '-B', '-m', 'unittest', 'discover', '-s', str(HERE), '-p', 'test_*.py', '-v'], out, 'python-controls.log', deadline)
                tests = sorted(str(path) for path in HERE.glob('*.test.mjs'))
                if not tests:
                    raise ValueError('Missing Cartesian negative controls')
                execute(['node', '--test', '--test-reporter=tap', *tests], out, 'node-controls.tap', deadline)
            elif args.kind == 'acceptance':
                if not args.research_output:
                    raise ValueError('Same-run research receipts required')
                execute([sys.executable, '-B', str(HERE / 'acceptance.py'), '--artifacts', str(inputs),
                         '--research-output', str(Path(args.research_output).resolve()), '--output', str(out),
                         '--source-commit', metadata['sourceCommit']], out, 'acceptance.log', deadline)
        after = verify_pins()
        if before != after:
            raise ValueError('Original source changed during execution')
        metadata['protectedSourcesAfter'] = after
        metadata['executionStatus'] = 'SUCCESS'
    except Exception as error:
        code = 1
        metadata['executionStatus'] = 'RESOURCE_LIMIT' if isinstance(error, subprocess.TimeoutExpired) else 'IMPLEMENTATION_FAILURE'
        metadata['failure'] = str(error)
    finally:
        try:
            after = verify_pins()
            metadata['protectedSourcesAfter'] = after
            metadata['originalProtectedSourcesUnchanged'] = before is not None and before == after
            implementation_after = [{'path': path.relative_to(REPO).as_posix(), 'bytes': path.stat().st_size, 'sha256': sha(path)}
                                    for path in sorted(HERE.iterdir()) if path.is_file()]
            metadata['implementationInputsAfter'] = implementation_after
            metadata['implementationUnchangedDuringRun'] = metadata['implementationInputs'] == implementation_after
            metadata['commitUnchangedDuringRun'] = metadata['sourceCommit'] == subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip()
            if not metadata['implementationUnchangedDuringRun'] or not metadata['commitUnchangedDuringRun']:
                raise ValueError('Implementation or code commit changed during execution')
        except Exception as error:
            code = 1
            metadata['executionStatus'] = 'SOURCE_INTEGRITY_FAILURE'
            metadata['failure'] = str(error)
        metadata['elapsedSeconds'] = time.monotonic() - start
        write(out / 'execution.json', metadata)
        members = [{'path': path.relative_to(out).as_posix(), 'bytes': path.stat().st_size, 'sha256': sha(path)}
                   for path in sorted(out.rglob('*')) if path.is_file() and path.name != 'receipt.json']
        write(out / 'receipt.json', {'schema': 'MathScope.N6Unconditional.Receipt/1',
              'sourceCommit': metadata['sourceCommit'], 'executionStatus': metadata['executionStatus'], 'members': members})
    print(json.dumps({key: metadata[key] for key in ['kind', 'executionStatus', 'elapsedSeconds', 'originalN601Complete', 'originalN602Complete']}))
    return code

if __name__ == '__main__':
    sys.exit(main())
