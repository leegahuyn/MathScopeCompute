"""Bounded current recovery CI checks; outputs must stay outside the repository.

No historical source producer, full release replay, Lean compiler, browser,
manifest generator, acceptance promotion, network request, or remote write.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
M3 = 'research-ide/mathscope-m3/recovery-20261019'
M4 = 'research-ide/mathscope-m4/recovery-20261019'
RECOVERED = 'research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1'


def digest(path: Path, base: Path) -> dict:
    content = path.read_bytes()
    return {'path': path.relative_to(base).as_posix(), 'bytes': len(content),
            'sha256': hashlib.sha256(content).hexdigest()}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--allow-dirty', action='store_true', help='Local preparation only; record existing dirty inputs explicitly. CI should omit this flag.')
    args = parser.parse_args()
    out = args.output_dir.resolve()
    if out.is_relative_to(ROOT):
        raise ValueError('OUTPUT_MUST_BE_OUTSIDE_REPOSITORY')
    out.mkdir(parents=True, exist_ok=False)
    env = {**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'}
    read_git = lambda *command: subprocess.check_output(['git', *command], cwd=ROOT, env=env, text=True).strip()
    commit, initial_status = read_git('rev-parse', '--verify', 'HEAD'), read_git('status', '--porcelain=v1', '--untracked-files=normal')
    if initial_status and not args.allow_dirty:
        raise ValueError('CLEAN_CHECKOUT_REQUIRED: use --allow-dirty only for an explicitly scoped local preparation run.')
    sources = sorted(set([Path(__file__).resolve(), *HERE.glob('*.mjs'), *HERE.glob('tests/*.mjs'),
                          *(ROOT/M3).glob('*.py'), *(ROOT/M3/'native').glob('*.py')]))
    pins_before = [digest(path, ROOT) for path in sources]
    report = {'schema': 'MathScope.ScopedRecoveryCI/1', 'startedAt': datetime.now(timezone.utc).isoformat(),
              'sourceCommit': commit, 'cleanCheckoutAtStart': not bool(initial_status), 'allowDirty': args.allow_dirty,
              'sourcePins': pins_before, 'steps': [], 'complete': False,
              'scope': 'Current cutoff, native scalar validation, and new M4 provenance/lifecycle contracts only.',
              'actualNewLeanExecution': False, 'actualBrowserInspection': False, 'newM3Closures': 0,
              'N706Closed': False, 'N805Closed': False, 'M4OriginalAcceptance': 'UNCONFIRMED',
              'actualGlobalLastResolvedTau': None}
    def save():
        (out/'SCOPED_CI_EXECUTION.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    save()

    capsule = out/'native'/'SOURCE_CAPSULE.json'
    commands = [
        ('source-capsule', [sys.executable, '-B', f'{M3}/native/prepare_native_source.py', '--recovery-root', RECOVERED, '--output', str(capsule)], 'source', None),
        ('native-validation', [sys.executable, '-B', f'{M3}/native/verify_slow_inverse.py', '--source-capsule', str(capsule), '--output-dir', str(out/'native')], 'native', 'source-capsule'),
        ('cutoff-tests', [sys.executable, '-B', '-m', 'unittest', 'discover', '-s', M3, '-p', 'test_outer_cutoff.py', '-v'], 'unittest9', None),
        ('m4-semantic-tests', ['node', '--test-reporter=tap', f'{M4}/tests/evidence-session.test.mjs'], 'tap10', None),
        ('m4-inspection-tests', ['node', '--test-reporter=tap', f'{M4}/tests/inspect-evidence.test.mjs'], 'tap6', None),
    ]
    outcomes = {}
    for name, command, kind, dependency in commands:
        if dependency and not outcomes.get(dependency):
            report['steps'].append({'name': name, 'command': command, 'pass': False, 'status': 'BLOCKED_DEPENDENCY', 'dependency': dependency})
            outcomes[name] = False; save(); continue
        started = time.monotonic()
        try:
            result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, timeout=90, check=False)
            stdout, stderr, code = result.stdout, result.stderr, result.returncode
            failure = None
        except (subprocess.TimeoutExpired, OSError) as error:
            stdout, stderr, code = getattr(error, 'stdout', None) or b'', getattr(error, 'stderr', None) or b'', None
            failure = type(error).__name__+': '+str(error)
        stdout_path, stderr_path = out/(name+'.stdout.log'), out/(name+'.stderr.log')
        stdout_path.write_bytes(stdout); stderr_path.write_bytes(stderr)
        passed, assertions = code == 0 and failure is None, {}
        if passed:
            try:
                if kind.startswith('tap'):
                    expected = int(kind[3:]); text = stdout.decode('utf-8')
                    counts = {key: int(re.findall(r'^# '+key+r' (\d+)$', text, re.M)[-1]) for key in ['tests','pass','fail','skipped','cancelled','todo']}
                    assert counts == {'tests':expected, 'pass':expected, 'fail':0, 'skipped':0, 'cancelled':0, 'todo':0}
                    assertions = counts
                elif kind == 'unittest9':
                    text = (stdout+stderr).decode('utf-8')
                    count = int(re.findall(r'Ran (\d+) tests? in ', text)[-1])
                    assert count == 9 and re.search(r'^OK$', text, re.M)
                    assertions = {'tests': count, 'pass': count}
                elif kind == 'source':
                    data = json.loads(capsule.read_text())
                    assert len(data['records']) == 19 and data['new_M3_closures'] == 0
                    assertions = {'sourceRecords':19, 'newM3Closures':0}
                elif kind == 'native':
                    summary = json.loads((out/'native/SUMMARY.json').read_text())
                    assert summary['status'] == 'PASS'
                    expected = {'native_boxes':19, 'independent_endpoint_certificates':22, 'implicit_jet_identities':5, 'negative_controls':16,
                                'h_replaced_by_zero':False, 'actual_caller_coordinates_evaluated':False, 'new_M3_closures':0, 'actual_global_last_resolved_tau':None}
                    assert all(summary[key] == value for key, value in expected.items())
                    assertions = expected
            except (AssertionError, KeyError, ValueError, IndexError, OSError) as error:
                passed = False; failure = 'EVIDENCE_ASSERTION_FAILED: '+type(error).__name__+': '+str(error)
        outcomes[name] = passed
        row = {'name': name, 'command': command, 'cwd': '.', 'exitCode': code, 'pass': passed,
               'elapsedSeconds': time.monotonic()-started, 'assertions': assertions, 'failure': failure,
               'stdout': digest(stdout_path, out), 'stderr': digest(stderr_path, out)}
        report['steps'].append(row); save()
        print(json.dumps({'step': name, 'exitCode': code, 'pass': passed, 'assertions': assertions}), flush=True)

    final_status = read_git('status', '--porcelain=v1', '--untracked-files=normal')
    report.update(complete=True, finishedAt=datetime.now(timezone.utc).isoformat(),
                  sourcePinsUnchanged=pins_before == [digest(path, ROOT) for path in sources],
                  repositoryStateUnchanged=initial_status == final_status,
                  sourceCommitUnchanged=commit == read_git('rev-parse', '--verify', 'HEAD'))
    report['pass'] = all(outcomes.values()) and report['sourcePinsUnchanged'] and report['repositoryStateUnchanged'] and report['sourceCommitUnchanged']
    report['outputs'] = [digest(path, out) for path in sorted(out.rglob('*')) if path.is_file() and path.name != 'SCOPED_CI_EXECUTION.json']
    save()
    return 0 if report['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
