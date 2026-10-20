#!/usr/bin/env python3
"""Verify an indexed recovery package and replay it only in a new working copy.

Python 3.12+ and Node on PATH are required. No network, git operation, original
source producer, old 1,700-second replay, or Windows-only historical run occurs.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import sqlite3
import subprocess
import sys
import time
import uuid


SOURCE = 'work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz'
STAGE3 = 'work/recovery_git/recovered/tools/n6-domain-transport-20261015/verify_domain_transport.py'
SCALAR = 'work/prune_recovery/scalar'
NATIVE = 'work/prune_recovery/native'
ENERGY = 'work/prune_recovery/energy'


def sha_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def inside(path: Path, parent: Path) -> bool:
    return path == parent or parent in path.parents


def indexed_path(root: Path, text: str) -> Path:
    if not isinstance(text, str) or not text or '\\' in text or ':' in text:
        raise ValueError(f'Invalid portable indexed path: {text!r}')
    relative = PurePosixPath(text)
    if relative.is_absolute() or any(p in ('', '.', '..') for p in text.split('/')):
        raise ValueError(f'Unsafe indexed path: {text!r}')
    result = root.joinpath(*relative.parts)
    if not inside(result.resolve(), root):
        raise ValueError(f'Indexed path escapes package: {text!r}')
    return result


def read_index(package: Path):
    path = package / 'FINAL_FILE_INDEX.json'
    raw = path.read_bytes()
    document = json.loads(raw)
    rows = document.get('files') if isinstance(document, dict) else None
    if not isinstance(rows, list) or not rows:
        raise ValueError('FINAL_FILE_INDEX.json needs a nonempty files array')
    seen = set()
    for row in rows:
        if not isinstance(row, dict) or not {'path', 'size_bytes', 'sha256'} <= row.keys():
            raise ValueError('Each indexed file requires path, size_bytes, sha256')
        indexed_path(package, row['path'])
        folded = row['path'].casefold()
        if folded in seen:
            raise ValueError('Duplicate or case-colliding indexed path: ' + row['path'])
        seen.add(folded)
        if type(row['size_bytes']) is not int or row['size_bytes'] < 0:
            raise ValueError('Invalid indexed byte size: ' + row['path'])
        checksum = row['sha256']
        if not isinstance(checksum, str) or len(checksum) != 64 or any(c not in '0123456789abcdef' for c in checksum):
            raise ValueError('Invalid SHA256: ' + row['path'])
        parts = PurePosixPath(row['path']).parts
        name = parts[-1].lower()
        if '__pycache__' in parts or name.endswith(('.pyc', '.pyo')) or '.sqlite' in name:
            raise ValueError('Disposable caches must not be indexed: ' + row['path'])
    return rows, hashlib.sha256(raw).hexdigest()


def verify_all(package: Path, rows):
    observations = []
    errors = []
    for row in rows:
        observed = {'path': row['path']}
        try:
            path = indexed_path(package, row['path'])
            if not path.is_file():
                raise ValueError('not a regular file')
            observed.update(size_bytes=path.stat().st_size, sha256=sha_file(path))
            observed['matches_index'] = (observed['size_bytes'] == row['size_bytes']
                                         and observed['sha256'] == row['sha256'])
            if not observed['matches_index']:
                errors.append({'path': row['path'], 'reason': 'size or SHA256 mismatch'})
        except (OSError, ValueError) as exc:
            observed.update(matches_index=False, error=str(exc))
            errors.append({'path': row['path'], 'reason': str(exc)})
        observations.append(observed)
    return {'file_count': len(rows), 'passed': not errors, 'errors': errors, 'files': observations}


def copy_indexed(package: Path, work: Path, rows) -> None:
    for row in rows:
        source = indexed_path(package, row['path'])
        target = indexed_path(work, row['path'])
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() or target.is_symlink():
            raise ValueError('New working copy already contains indexed destination: ' + row['path'])
        shutil.copyfile(source, target)
        if target.stat().st_size != row['size_bytes'] or sha_file(target) != row['sha256']:
            raise ValueError('Copy verification failed: ' + row['path'])


def replay_jobs(node: str):
    py = sys.executable
    def python(name, script, *args):
        return {'id': name, 'kind': 'process', 'argv': [py, '-X', 'utf8', script, *args]}
    common = ['--root', 'recovered/base', '--source', SOURCE, '--stage3', STAGE3]
    return [
        {'id': 'node_version', 'kind': 'process', 'argv': [node, '--version']},
        # This checks archived hashes. It must precede regeneration below.
        python('frozen_energy_package_review', 'work/prune_recovery/energy_independent_review/code/check_final_freeze.py'),
        python('scalar_recovery', SCALAR + '/code/recover_scalar_closure.py', *common, '--out', SCALAR + '/evidence'),
        python('scalar_controls', SCALAR + '/code/test_scalar_recovery.py', *common, '--evidence', SCALAR + '/evidence'),
        {'id': 'binder_controls', 'kind': 'process', 'argv': [py, '-X', 'utf8', '-m', 'unittest', 'discover',
            '-s', SCALAR + '/binder_review', '-p', 'test_scoped_bindings.py', '-v']},
        python('binder_audit', SCALAR + '/binder_review/audit_actual_bindings.py'),
        python('historical_cycle_identity', SCALAR + '/code/inspect_historical_finite_cycle.py',
               '--root', 'recovered/base', '--out', SCALAR + '/evidence/HISTORICAL_FINITE_CYCLE_GRAPH_IDENTITY.json'),
        python('scalar_independent_review', 'work/prune_recovery/scalar_independent_review/code/review_recovery.py'),
        python('native_generation', NATIVE + '/code/native_binding.py'),
        python('native_indexed_operand_recovery', NATIVE + '/code/recover_indexed_operands.py', '--source', SOURCE),
        python('native_original_proof_application', NATIVE + '/code/proof_application.py', '--source', SOURCE),
        python('native_controls', NATIVE + '/code/verify_native.py'),
        {'id': 'energy_operator', 'kind': 'process', 'argv': [node, ENERGY + '/code/recover_operator.mjs',
            'recovered/base', ENERGY + '/evidence']},
        python('energy_controls', ENERGY + '/code/check_recovery.py', 'recovered/base'),
        {'id': 'prepare_derived_energy_cache', 'kind': 'derived_cache'},
        python('energy_actual_source_connection', ENERGY + '/code/connect_recovered_source.py'),
        python('energy_pressure_recipe', ENERGY + '/code/connect_pressure_recipe.py'),
        python('native_independent_math_review', 'work/prune_recovery/native_independent_review/review_math.py'),
        python('native_independent_binding_review', 'work/prune_recovery/native_independent_review/binding_scope/review_frozen_bindings.py'),
        python('native_independent_direct_operand_review', 'work/prune_recovery/native_independent_review/binding_scope/review_direct_supplement.py',
               '--source', SOURCE),
        python('energy_independent_algebra_review', 'work/prune_recovery/energy_independent_review/code/check_energy_algebra.py'),
        python('energy_independent_boundary_review', 'work/prune_recovery/energy_independent_review/code/check_energy_boundary.py'),
    ]


def require_job_inputs(rows, jobs):
    names = {row['path'] for row in rows}
    required = {SOURCE, STAGE3}
    for job in jobs:
        for arg in job.get('argv', [])[1:]:
            if arg.startswith('work/') and arg.endswith(('.py', '.mjs')):
                required.add(arg)
    missing = sorted(required - names)
    if missing:
        raise ValueError('Required replay files are not indexed: ' + ', '.join(missing))


def derive_energy_cache(work: Path):
    source = work / SCALAR / 'evidence/fresh-source-cache.sqlite'
    target = work / SCALAR / 'cache_recheck/independent-recheck.sqlite'
    if not source.is_file() or target.exists() or target.is_symlink():
        raise ValueError('Expected one freshly generated source cache and an absent derived destination')
    connection = sqlite3.connect(source.resolve().as_uri() + '?mode=ro', uri=True)
    try:
        rows = connection.execute('SELECT COUNT(*) FROM nodes').fetchone()[0]
        record = connection.execute('SELECT raw FROM nodes WHERE id=31').fetchone()
    finally:
        connection.close()
    expected = {'op': 'coordinate', 'args': ['initial$1']}
    if rows != 3892594 or record is None or json.loads(record[0]) != expected:
        raise ValueError('Fresh scalar cache failed row-count/node31 verification; no cache copied')
    target.parent.mkdir(parents=True, exist_ok=True)
    try:
        shutil.copyfile(source, target)
        checksum = sha_file(source)
        if sha_file(target) != checksum:
            raise ValueError('Derived cache copy SHA256 mismatch')
    except BaseException:
        target.unlink(missing_ok=True)
        raise
    return target, {'source': str(source.relative_to(work)), 'derived_copy': str(target.relative_to(work)),
        'rows': rows, 'node31': expected, 'sha256': checksum, 'bytes': target.stat().st_size,
        'copied_from_this_run_scalar_recovery': True, 'second_full_cache_producer_executed': False,
        'historical_cache_diagnostic_json_regenerated': False,
        'authority': 'Pinned original stream and current scalar recovery/independent review; cache is disposable'}


def process_job(job, work, stdout_path, stderr_path, environment):
    with stdout_path.open('wb') as stdout, stderr_path.open('wb') as stderr:
        process = subprocess.Popen(job['argv'], cwd=work, stdout=stdout, stderr=stderr, env=environment)
        try:
            while True:
                try:
                    return process.wait(timeout=30)
                except subprocess.TimeoutExpired:
                    print(f"  Still running: {job['id']}", flush=True)
        except KeyboardInterrupt:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--package-root', required=True, type=Path)
    parser.add_argument('--work-dir', required=True, type=Path, help='Must not already exist')
    parser.add_argument('--report-dir', required=True, type=Path, help='Parent for a new per-run report folder')
    args = parser.parse_args()
    if sys.version_info < (3, 12):
        parser.error('Use Python 3.12 or later')
    if args.work_dir.expanduser().is_symlink():
        parser.error('--work-dir must be a new directory, not a symbolic link')
    package, work, reports = (p.expanduser().resolve() for p in (args.package_root, args.work_dir, args.report_dir))
    if not package.is_dir():
        parser.error('--package-root is not a directory')
    if work.exists() or work.is_symlink():
        parser.error('--work-dir must be new; existing directories are never cleared')
    if inside(work, package) or inside(reports, package):
        parser.error('Working copies and reports must be outside the original package')
    node = shutil.which('node')
    if node is None:
        parser.error('Node executable was not found on PATH')
    rows, index_sha = read_index(package)
    jobs = replay_jobs(node)
    require_job_inputs(rows, jobs)
    work.mkdir(parents=True, exist_ok=False)
    run_name = dt.datetime.now(dt.timezone.utc).strftime('recovery-%Y%m%dT%H%M%SZ-') + uuid.uuid4().hex[:8]
    report = reports / run_name
    report.mkdir(parents=True, exist_ok=False)
    logs = report / 'logs'
    logs.mkdir()
    summary = {'schema': 'MathScope.PortableRecoveryReplay/1',
        'package_root': str(package), 'work_dir': str(work), 'report_dir': str(report),
        'index_sha256': index_sha, 'indexed_files': len(rows),
        'python_version': sys.version, 'python_executable': sys.executable, 'node_executable': node,
        'copy_policy': 'Only FINAL_FILE_INDEX.json files are copied; generated outputs live in new copy',
        'source_producer_executed': False, 'old_1700_second_replay_executed': False,
        'historical_windows_replay_executed': False, 'jobs': [],
        'N706_closed': False, 'N805_closed': False, 'actual_last_resolved_tau': None}
    write_json(report / 'JOB_PLAN.json', jobs)
    environment = dict(os.environ)
    environment.update(PYTHONUTF8='1', PYTHONIOENCODING='utf-8', PYTHONUNBUFFERED='1', PYTHONDONTWRITEBYTECODE='1')
    environment.pop('PYTHONPATH', None)
    before = None
    derived_cache = None
    exit_code = 0
    started = time.monotonic()
    try:
        print(f'Verifying {len(rows)} indexed package files...', flush=True)
        before = verify_all(package, rows)
        write_json(report / 'PACKAGE_BEFORE.json', before)
        if not before['passed']:
            raise ValueError('Original package verification failed; no files copied')
        copy_indexed(package, work, rows)
        summary['copy_verified'] = True
        for number, job in enumerate(jobs, 1):
            label = f"{number:02d}-{job['id']}"
            stdout_path, stderr_path = logs / (label + '.stdout.log'), logs / (label + '.stderr.log')
            observed = dict(job, stdout=str(stdout_path), stderr=str(stderr_path))
            summary['jobs'].append(observed)
            stamp = time.monotonic()
            print(f'[{number}/{len(jobs)}] {job["id"]}', flush=True)
            try:
                if job['kind'] == 'derived_cache':
                    derived_cache, cache_receipt = derive_energy_cache(work)
                    summary['derived_cache_reuse'] = cache_receipt
                    write_json(report / 'DERIVED_CACHE_REUSE.json', cache_receipt)
                    stdout_path.write_text(json.dumps(cache_receipt, indent=2) + '\n', encoding='utf-8')
                    stderr_path.write_bytes(b'')
                    code = 0
                else:
                    code = process_job(job, work, stdout_path, stderr_path, environment)
            except KeyboardInterrupt:
                observed.update(exit_code=130, elapsed_seconds=round(time.monotonic() - stamp, 3))
                (logs / (label + '.exit.txt')).write_text('130\n', encoding='ascii')
                raise
            except Exception as exc:
                stderr_path.write_text(str(exc) + '\n', encoding='utf-8')
                stdout_path.touch(exist_ok=True)
                code = 1
            observed.update(exit_code=code, elapsed_seconds=round(time.monotonic() - stamp, 3))
            (logs / (label + '.exit.txt')).write_text(str(code) + '\n', encoding='ascii')
            write_json(report / 'SUMMARY.json', summary)
            if code != 0:
                raise RuntimeError(f'{job["id"]} exited {code}; dependent jobs were not run')
    except KeyboardInterrupt:
        exit_code = 130
        summary['error'] = 'Interrupted by user'
    except Exception as exc:
        exit_code = 1
        summary['error'] = str(exc)
    finally:
        if derived_cache is not None:
            try:
                derived_cache.unlink()
                summary['derived_cache_removed_after_replay'] = True
            except OSError as exc:
                summary['derived_cache_cleanup_error'] = str(exc)
                exit_code = 1
        after = verify_all(package, rows)
        write_json(report / 'PACKAGE_AFTER.json', after)
        try:
            index_unchanged = sha_file(package / 'FINAL_FILE_INDEX.json') == index_sha
        except OSError:
            index_unchanged = False
        summary['original_package_unchanged'] = bool(before and before['files'] == after['files'] and index_unchanged)
        summary['original_package_matches_index_after'] = after['passed'] and index_unchanged
        if not summary['original_package_unchanged'] or not summary['original_package_matches_index_after']:
            exit_code = 1
        summary['unrun_jobs'] = [j['id'] for j in jobs[len(summary['jobs']):]]
        summary.update(exit_code=exit_code, elapsed_seconds=round(time.monotonic() - started, 3),
                       status='PASS' if exit_code == 0 else 'FAILED')
        write_json(report / 'SUMMARY.json', summary)
        (report / 'EXIT.txt').write_text(str(exit_code) + '\n', encoding='ascii')
        print(f'{summary["status"]}: {report / "SUMMARY.json"}', flush=True)
    return exit_code


if __name__ == '__main__':
    raise SystemExit(main())
