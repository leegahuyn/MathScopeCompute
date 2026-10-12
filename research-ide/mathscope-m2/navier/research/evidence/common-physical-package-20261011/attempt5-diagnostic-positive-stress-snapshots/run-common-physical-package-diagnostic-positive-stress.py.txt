"""Additive, immutable common-source runner with read-only worker diagnostics.

Prepare with ATTEMPT --preflight; execute the frozen inputs with ATTEMPT --run.
The mathematical test and every existing runner remain unchanged.  Diagnostic
clients are children of this runner, in the worker's network/PID namespace.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import signal
import subprocess
import sys
import time

from node_process_observer_positive_stress import ProcessTreeObserver


ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'research-ide/mathscope-m2/navier'
EVIDENCE = BASE / 'research/evidence/common-physical-package-20261011'
SELF = Path(__file__).resolve()
SOURCE_TEST = BASE / 'tests/actual-common-physical-package-source.test.mjs'
CLIENT = BASE / 'tests/node-inspector-diagnostics-positive-stress.mjs'
OBSERVER = BASE / 'tests/node_process_observer_positive_stress.py'
OLD_RUNNER = BASE / 'tests/run-common-physical-package-validation.py'
LEADING_PHASE = 'positive-stress-leading-angular-source-start'
TIMEOUT_SECONDS = 1800
SAMPLING_INTERVAL = 0.25
STALE_SECONDS = 45
PROFILE_SECONDS = 5
CLIENT_TIMEOUT_SECONDS = 60


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def relative(path):
    return str(Path(path).relative_to(ROOT))


def write_exclusive_json(path, value):
    with Path(path).open('x') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')


def source_files():
    roots = [BASE / path for path in [
        'actual-common-physical-jet-kernel.mjs',
        'actual-common-band-physical-curl.mjs',
        'actual-common-global-wave-bounds.mjs',
        'actual-common-global-covariance.mjs',
        'actual-background-residual-flatness.mjs',
        'actual-common-band-background-residual.mjs',
        'tests/assert-common-background-residual-source.mjs',
        'tests/actual-common-physical-package-source.test.mjs',
    ]] + [SELF, OBSERVER, CLIENT, OLD_RUNNER]
    seen = set()

    def closure(path):
        path = path.resolve()
        if path in seen:
            return
        if not path.is_file():
            raise RuntimeError('Missing frozen source: ' + str(path))
        seen.add(path)
        if path.suffix != '.mjs':
            return
        for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', path.read_text()):
            closure(path.parent / spec)

    for path in roots:
        closure(path)
    return roots, [{'path': relative(path), 'sha256': sha(path), 'bytes': path.stat().st_size}
                   for path in sorted(seen)]


def terminate_local_group(child):
    """Host PIDs are never supplied to a local kill/wait operation."""
    if child is None or child.poll() is not None:
        return
    try:
        os.killpg(child.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        child.wait(timeout=5)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(child.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        child.wait()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('attempt', type=int)
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument('--preflight', action='store_true')
    modes.add_argument('--run', action='store_true')
    args = parser.parse_args()
    if args.attempt < 1:
        raise ValueError('Use a new positive attempt number.')
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    stem = 'actual-common-physical-package-source-attempt' + str(args.attempt)
    log = EVIDENCE / (stem + '.log')
    receipt = EVIDENCE / (stem + '.json')
    observed = EVIDENCE / (stem + '-process.json')
    journal = EVIDENCE / (stem + '-observations.jsonl')
    preflight = EVIDENCE / (stem + '-preflight.json')
    diagnostic_prefix = EVIDENCE / (stem + '-leading-stall-inspector')
    diagnostic_outputs = [Path(str(diagnostic_prefix) + suffix)
                          for suffix in ['.log', '.json', '.cpuprofile']]
    outputs = [log, receipt, observed, journal, *diagnostic_outputs]
    if any(path.exists() for path in outputs):
        raise RuntimeError('Earlier source outputs are immutable; use a new attempt number.')
    roots, manifest = source_files()
    command = ['node', '--inspect=127.0.0.1:0', '--max-old-space-size=4608',
               '--test', '--test-reporter=tap', relative(SOURCE_TEST)]
    source_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()

    if args.preflight:
        if preflight.exists():
            raise RuntimeError('The earlier preflight is immutable; use its --run or a new attempt.')
        snapdir = EVIDENCE / ('attempt' + str(args.attempt) + '-diagnostic-positive-stress-snapshots')
        snapdir.mkdir()
        snapshots = []
        for path in roots:
            target = snapdir / (path.name + '.txt')
            with target.open('xb') as stream:
                stream.write(path.read_bytes())
            snapshots.append({'original': relative(path), 'path': relative(target), 'sha256': sha(target)})
        fixture = BASE / 'research/evidence/node-inspector-diagnostics-20261011/positive-stress-diagnostics-attempt2.json'
        record = {'schema': 'MathScope.FrozenCommonPhysicalDiagnosticPreflight/1',
                  'createdAt': utc_now(), 'attempt': args.attempt, 'sourceCommitAtPreflight': source_commit,
                  'command': command, 'sourceManifest': manifest, 'snapshots': snapshots,
                  'requiredEmptyOutputs': [relative(path) for path in outputs],
                  'timeoutSeconds': TIMEOUT_SECONDS, 'samplingIntervalSeconds': SAMPLING_INTERVAL,
                  'diagnostic': {'trigger': 'The last visible SOURCE_PROGRESS phase is leading-angular-start, and both visible source/TAP progress and checkpoint file changes have been stale for more than 45 seconds.',
                                 'staleSeconds': STALE_SECONDS, 'cpuProfileSeconds': PROFILE_SECONDS,
                                 'maximumAutomaticAttempts': 1, 'sameNamespaceSubprocess': True,
                                 'staleLogIsProofOfActivePhase': False, 'stalenessTerminatesSource': False},
                  'testedDiagnosticFixture': {'path': relative(fixture), 'sha256': sha(fixture)},
                  'mathematicalSourceExecuted': False, 'mathematicalSourcesModified': False,
                  'wholeM2Complete': False, 'M3Started': False}
        write_exclusive_json(preflight, record)
        print(json.dumps({'preflight': relative(preflight), 'sha256': sha(preflight),
                          'filesFrozen': len(manifest), 'snapshots': len(snapshots),
                          'mathematicalSourceExecuted': False, 'runCommand': ['python', relative(SELF), str(args.attempt), '--run']}, indent=2))
        return 0

    if not preflight.is_file():
        raise RuntimeError('Create and review this attempt\'s --preflight before --run.')
    frozen = json.loads(preflight.read_text())
    if frozen['sourceManifest'] != manifest or frozen['command'] != command:
        raise RuntimeError('Frozen source/command changed after preflight; do not reuse this attempt.')
    if not all(sha(ROOT / row['path']) == row['sha256'] for row in frozen['snapshots']):
        raise RuntimeError('A preserved preflight snapshot changed.')

    started = utc_now()
    tick = time.monotonic()
    env = dict(os.environ, M2_COMMON_PHYSICAL_EVIDENCE=str(receipt))
    child = None
    observer = None
    client = None
    client_stream = None
    client_started = None
    diagnostic = {'attempted': False, 'status': 'NOT_TRIGGERED', 'cpuProfileSeconds': PROFILE_SECONDS,
                  'latestVisiblePhaseIsNotAssertedAsActualCPUPhase': True}
    endpoints = []
    last_source_event = None
    last_visible_progress = tick
    last_checkpoint_progress = tick
    checkpoint_stamp = None
    checkpoint_observations = []
    log_buffer = ''
    timeout = False
    interrupted = False
    execution_error = None
    observer_error = None

    with journal.open('x') as observation_stream, log.open('xb') as log_stream:
        def event(kind, **details):
            observation_stream.write(json.dumps({'observedAt': utc_now(), 'kind': kind, **details}, ensure_ascii=False) + '\n')
            observation_stream.flush()

        event('runner-start', command=command, preflightSHA256=sha(preflight),
              expectedCertificatePath=relative(receipt), observerLocalPid=os.getpid())
        try:
            child = subprocess.Popen(command, cwd=ROOT, env=env, stdout=log_stream,
                                     stderr=subprocess.STDOUT, start_new_session=True)
            observer = ProcessTreeObserver(child.pid)
            event('child-start', localPid=child.pid, observerHostPid=observer.parent_host_pid,
                  killAndWaitUseLocalPID=True)
            with log.open('rb') as log_reader:
                while child.poll() is None:
                    now = time.monotonic()
                    try:
                        was_resolved = observer.root_host_pid is not None
                        sample = observer.sample()
                        if not was_resolved and sample['rootResolved']:
                            event('host-proc-child-resolved', **sample)
                    except (OSError, ValueError) as error:
                        if observer_error is None:
                            observer_error = {'name': type(error).__name__, 'message': str(error)}
                            event('memory-observer-error', error=observer_error)
                    log_buffer += log_reader.read().decode(errors='replace')
                    lines = log_buffer.split('\n')
                    log_buffer = lines.pop()
                    for line in lines:
                        for endpoint in re.findall(r'ws://127\.0\.0\.1:\d+/[\w-]+', line):
                            if endpoint not in endpoints:
                                endpoints.append(endpoint)
                                event('inspector-endpoint-discovered', endpoint=endpoint)
                        match = re.search(r'SOURCE_PROGRESS\s+(\{.*\})', line)
                        if match:
                            try:
                                last_source_event = json.loads(match.group(1))
                            except json.JSONDecodeError:
                                continue
                            last_visible_progress = now
                            event('source-progress-visible', sourceEvent=last_source_event)
                        elif re.match(r'^(?:ok|not ok) \d+ - ', line):
                            last_visible_progress = now
                            event('tap-test-visible', line=line)
                    if receipt.exists():
                        stat = receipt.stat()
                        stamp = (stat.st_mtime_ns, stat.st_size)
                        if stamp != checkpoint_stamp:
                            checkpoint_stamp = stamp
                            last_checkpoint_progress = now
                            raw = receipt.read_bytes()
                            observation = {'bytes': len(raw), 'mtimeNs': stat.st_mtime_ns,
                                           'sha256': hashlib.sha256(raw).hexdigest(),
                                           'writerPIDIndependentlyObserved': False}
                            try:
                                packet = json.loads(raw)
                                observation.update({'parseable': True, 'complete': packet.get('complete'),
                                                    'certificates': list(packet.get('certificates', {})),
                                                    'sourceConstructions': packet.get('sourceConstructions')})
                            except (json.JSONDecodeError, UnicodeDecodeError):
                                observation['parseable'] = False
                            checkpoint_observations.append(observation)
                            event('checkpoint-file-changed', **observation)
                    stale = now - max(last_visible_progress, last_checkpoint_progress)
                    if (not diagnostic['attempted'] and last_source_event is not None
                            and last_source_event.get('phase') == LEADING_PHASE and stale > STALE_SECONDS):
                        diagnostic.update({'attempted': True, 'triggeredAt': utc_now(),
                                           'secondsWithoutVisibleOrCheckpointProgress': stale,
                                           'lastVisibleSourceEvent': last_source_event,
                                           'checkpointCountAtTrigger': len(checkpoint_observations),
                                           'inspectorEndpointsObserved': endpoints.copy()})
                        if len(endpoints) != 1:
                            diagnostic['status'] = 'NO_UNIQUE_INSPECTOR_ENDPOINT'
                            event('diagnostic-unavailable', diagnostic=diagnostic)
                        else:
                            diagnostic_command = ['node', '--max-old-space-size=128', str(CLIENT), endpoints[0],
                                                  str(diagnostic_prefix), str(SOURCE_TEST), str(PROFILE_SECONDS)]
                            client_stream = diagnostic_outputs[0].open('xb')
                            client = subprocess.Popen(diagnostic_command, cwd=ROOT, stdout=client_stream,
                                                      stderr=subprocess.STDOUT, start_new_session=True)
                            client_started = now
                            diagnostic.update({'status': 'RUNNING', 'command': diagnostic_command,
                                               'clientLocalPid': client.pid, 'sameRunnerNamespace': True})
                            event('diagnostic-start', diagnostic=diagnostic)
                    if client is not None and client.poll() is None and now - client_started > CLIENT_TIMEOUT_SECONDS:
                        diagnostic['clientTimeout'] = True
                        terminate_local_group(client)
                        event('diagnostic-client-timeout', exitCode=client.returncode)
                    if now - tick >= TIMEOUT_SECONDS:
                        timeout = True
                        event('external-source-timeout', timeoutSeconds=TIMEOUT_SECONDS)
                        break
                    try:
                        child.wait(timeout=SAMPLING_INTERVAL)
                    except subprocess.TimeoutExpired:
                        pass
        except KeyboardInterrupt:
            interrupted = True
            event('runner-keyboard-interrupt', certificateCompletionNotInferred=True)
        except Exception as error:
            execution_error = {'name': type(error).__name__, 'message': str(error)}
            event('runner-error', error=execution_error)
        finally:
            terminate_local_group(child)
            if client is not None:
                try:
                    client.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    diagnostic['clientTimeout'] = True
                    terminate_local_group(client)
                diagnostic['observedExitCode'] = client.returncode
                client_stream.close()
                report_path = diagnostic_outputs[1]
                if report_path.exists():
                    try:
                        report = json.loads(report_path.read_text())
                        diagnostic['status'] = report.get('status', 'UNKNOWN_REPORT_STATUS')
                        diagnostic['reportedWorkerLocalPid'] = report.get('before', {}).get('pid')
                        diagnostic['reportedWorkerHostPid'] = report.get('before', {}).get('hostPid')
                        diagnostic['debuggerPauseResumed'] = report.get('debuggerPauseResumed')
                    except (json.JSONDecodeError, OSError):
                        diagnostic['status'] = 'UNREADABLE_DIAGNOSTIC_REPORT'
                else:
                    diagnostic['status'] = 'NO_DIAGNOSTIC_REPORT'
                event('diagnostic-complete', diagnostic=diagnostic)
            event('child-finished', exitCode=child.returncode if child else None,
                  timeout=timeout, interrupted=interrupted)

    elapsed = time.monotonic() - tick
    text = log.read_text(errors='replace')
    certificate_packet = None
    certificate_parse_error = None
    if receipt.exists():
        try:
            certificate_packet = json.loads(receipt.read_text())
        except (json.JSONDecodeError, OSError) as error:
            certificate_parse_error = str(error)
    complete = bool(certificate_packet and certificate_packet.get('complete') is True)
    unchanged = all((ROOT / row['path']).is_file() and sha(ROOT / row['path']) == row['sha256'] for row in manifest)
    memory = observer.receipt() if observer else None
    logged_values = list(map(int, re.findall(r'"rssBytes":(\d+)', text)))
    observed_values = logged_values + ([observer.individual_high_water_bytes] if observer and observer.successful_samples else [])
    exit_code = child.returncode if child else None
    record = {'schema': 'MathScope.ObservedCommonPhysicalPackageProcess/2',
              'startedAt': started, 'finishedAt': utc_now(), 'command': command,
              'sourceCommitAtExecution': source_commit, 'runnerSHA256AtExecution': sha(SELF),
              'preflight': {'path': relative(preflight), 'sha256': sha(preflight)},
              'sourceManifest': {'files': manifest, 'unchangedAfterExecution': unchanged},
              'exitCode': exit_code, 'timeout': timeout, 'timeoutSeconds': TIMEOUT_SECONDS,
              'interrupted': interrupted, 'runnerError': execution_error, 'elapsedSeconds': elapsed,
              'peakRSSBytes': max(observed_values) if observed_values else None,
              'memoryObservation': {'namespaceAwareProcessTree': memory, 'observerError': observer_error,
                                    'maximumSourceLoggedRSSBytes': max(logged_values) if logged_values else None,
                                    'reapedChildrenAggregatePeakRSSBytes': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
                                    'reapedAggregateMayIncludeInspectorClient': True,
                                    'samplingIntervalSeconds': SAMPLING_INTERVAL,
                                    'definition': 'Source peakRSSBytes is the largest observed source-subtree individual VmHWM or source-logged RSS. Tree totals are separate; unresolved observations are not zero. Aggregate reaped-child RSS is contextual and is not used as the source peak.'},
              'tests': {'passed': len(re.findall(r'^ok \d+ - ', text, re.M)),
                        'failed': len(re.findall(r'^not ok \d+ - ', text, re.M))},
              'log': {'path': relative(log), 'sha256': sha(log)},
              'certificate': {'path': relative(receipt), 'exists': receipt.exists(), 'complete': complete,
                              'parseError': certificate_parse_error, 'sha256': sha(receipt) if receipt.exists() else None},
              'checkpointObservations': checkpoint_observations,
              'observationJournal': {'path': relative(journal), 'sha256': sha(journal)},
              'diagnostic': diagnostic,
              'diagnosticArtifacts': [{'path': relative(path), 'sha256': sha(path)} for path in diagnostic_outputs if path.exists()],
              'snapshots': frozen['snapshots'],
              'pass': exit_code == 0 and complete and unchanged and not timeout and not interrupted and execution_error is None,
              'designedNegativeControl': False, 'wholeM2Complete': False, 'M3Started': False}
    write_exclusive_json(observed, record)
    print(json.dumps({key: value for key, value in record.items()
                      if key not in ['sourceManifest', 'snapshots', 'checkpointObservations']}, ensure_ascii=False, indent=2))
    return 0 if record['pass'] else (130 if interrupted else 1)


if __name__ == '__main__':
    raise SystemExit(main())
