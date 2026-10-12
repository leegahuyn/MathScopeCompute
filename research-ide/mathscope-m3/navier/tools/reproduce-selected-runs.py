#!/usr/bin/env python3
"""Run each saved public N8 fixture in a fresh bounded Node process.

Worker teardown may retain native allocator pages in a long-lived parent.
Independent processes release that memory between fixtures, and keep each
failure and its source snapshot available for review.
"""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import os
import signal
import subprocess
import time


FIXTURES = ('N8-flow', 'N8-source-core-refinement', 'N8-source-near-terminal')


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def write(path, value):
    path.write_text(json.dumps(value, indent=2)+'\n')


def cgroup_memory():
    file = Path('/sys/fs/cgroup/memory.current')
    return int(file.read_text()) if file.is_file() else None


def execute_fixture(args, fixture):
    directory = args.output/fixture
    log = args.output/(fixture+'.stdout.log')
    error_log = args.output/(fixture+'.stderr.log')
    command = ['node', '--max-old-space-size=256', '--expose-gc',
               str(Path(__file__).with_suffix('.mjs')), '--source-root', str(args.source_root),
               '--observations-root', str(args.observations_root), '--output', str(directory),
               '--fixture', fixture]
    started, monotonic = now(), time.monotonic()
    host_pid, peak_rss, peak_cgroup, reason = None, 0, cgroup_memory(), None
    with log.open('x') as stdout, error_log.open('x') as stderr:
        process = subprocess.Popen(command, stdout=stdout, stderr=stderr,
                                   cwd=args.source_root, start_new_session=True)
        while process.poll() is None:
            if host_pid is None:
                for line in log.read_text().splitlines():
                    try:
                        value = json.loads(line)
                        if value.get('stage') == 'N8_REPRODUCTION_START':
                            host_pid = value['hostPID']
                    except (ValueError, KeyError):
                        pass
            if host_pid:
                try:
                    rows = dict(line.split(':', 1) for line in
                                (Path('/proc')/str(host_pid)/'status').read_text().splitlines()
                                if ':' in line)
                    peak_rss = max(peak_rss, int(rows['VmRSS'].split()[0])*1024)
                except (FileNotFoundError, KeyError):
                    pass
            total = cgroup_memory()
            if total is not None:
                peak_cgroup = max(peak_cgroup or 0, total)
            if peak_rss > args.rss_limit_mib*1024**2:
                reason = 'OWNED_NODE_RSS_LIMIT'
            elif args.shared_limit_mib and total is not None and total > args.shared_limit_mib*1024**2:
                reason = 'SHARED_CGROUP_RESERVATION'
            elif time.monotonic()-monotonic > args.timeout_seconds:
                reason = 'DECLARED_FIXTURE_RUNTIME_LIMIT'
            if reason:
                os.killpg(process.pid, signal.SIGTERM)
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait()
                break
            time.sleep(.025)
    code = process.wait()
    receipt_file = directory/'receipt.json'
    child = json.loads(receipt_file.read_text()) if receipt_file.is_file() else None
    row = {'id': fixture, 'startedAt': started, 'finishedAt': now(),
           'durationSeconds': time.monotonic()-monotonic, 'command': command,
           'exitCode': code, 'stopReason': reason, 'ownedNodeHostPID': host_pid,
           'observedPeakOwnedNodeRSSBytes': peak_rss,
           'observedPeakSharedCgroupBytes': peak_cgroup,
           'completeChildReceipt': child is not None,
           'receiptPath': str(receipt_file.relative_to(args.output)),
           'receiptSHA256': hashlib.sha256(receipt_file.read_bytes()).hexdigest() if child else None,
           'sourceManifestSHA256': child.get('release', {}).get('sourceManifestSHA256') if child else None,
           'pass': code == 0 and reason is None and child is not None and child.get('pass') is True}
    write(args.output/(fixture+'.launch.json'), row)
    print(json.dumps(row), flush=True)
    return row, child


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-root', type=Path, default=Path(__file__).resolve().parents[4])
    parser.add_argument('--observations-root', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--rss-limit-mib', type=int, default=1024)
    parser.add_argument('--shared-limit-mib', type=int, default=0)
    parser.add_argument('--timeout-seconds', type=int, default=90)
    args = parser.parse_args()
    if not 256 <= args.rss_limit_mib <= 2048 or not 1 <= args.timeout_seconds <= 180:
        raise ValueError('Declare an owned memory limit of 256–2048 MiB and a timeout of 1–180 seconds.')
    if args.shared_limit_mib < 0:
        raise ValueError('The optional shared cgroup reservation must be nonnegative.')
    args.source_root = args.source_root.resolve()
    args.observations_root = (args.observations_root or args.source_root/
                             'research-ide/mathscope-m3/evidence/all64-20261012/public-v99').resolve()
    args.output = args.output.resolve()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.mkdir()  # Existing observations are deliberately immutable.
    source = Path(__file__).read_bytes()
    (args.output/Path(__file__).name).write_bytes(source)
    result = {'schema': 'MathScope.N8.ObservedIsolatedReproduction/1', 'startedAt': now(),
              'fixtureIds': list(FIXTURES), 'runStatus': 'RUNNING', 'pass': False,
              'resourceLimits': {'ownedNodeRSSBytes': args.rss_limit_mib*1024**2,
                                 'sharedCgroupReservationBytes': args.shared_limit_mib*1024**2 or None,
                                 'perFixtureSeconds': args.timeout_seconds},
              'launcher': {'path': Path(__file__).name, 'bytes': len(source),
                           'sha256': hashlib.sha256(source).hexdigest()},
              'actualSeparateProcesses': True, 'importedAuthorityAdopted': False,
              'originalN808Complete': False, 'wholeM3Complete': False, 'runs': [], 'checks': []}
    children = []
    try:
        for fixture in FIXTURES:
            row, child = execute_fixture(args, fixture)
            result['runs'].append(row)
            children.append(child)
            if row['stopReason']:
                break  # Release reserved memory before any subsequent work.
        all_pass = len(children) == 3 and all(child and child.get('pass') for child in children)
        result['checks'] = [
            {'id': 'all-three-declared-fixtures-executed-in-fresh-processes',
             'pass': len(result['runs']) == 3 and all(row['pass'] for row in result['runs'])},
            {'id': 'every-child-source-and-mathematical-check-passed', 'pass': bool(all_pass)},
            {'id': 'same-current-source-manifest-for-all-three-processes',
             'pass': all_pass and len({row['sourceManifestSHA256'] for row in result['runs']}) == 1},
            {'id': 'same-frozen-verifier-in-every-child',
             'pass': all_pass and len({json.dumps(json.loads((args.output/row['id']/'source-before.json').read_text())['verifierSources'], sort_keys=True)
                                      for row in result['runs']}) == 1},
            {'id': 'launcher-source-unchanged', 'pass': Path(__file__).read_bytes() == source}]
        result['pass'] = all(row['pass'] for row in result['checks'])
        result['runStatus'] = 'PASS' if result['pass'] else 'FAIL'
    except Exception as error:
        result['runStatus'] = 'FAIL'
        result['error'] = {'type': type(error).__name__, 'message': str(error)}
    finally:
        result['finishedAt'] = now()
        write(args.output/'receipt.json', result)
    print(json.dumps({'status': result['runStatus'], 'receipt': str(args.output/'receipt.json')}))
    return 0 if result['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
