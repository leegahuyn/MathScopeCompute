#!/usr/bin/env python3
"""Replay the byte/provenance/negative-probe audit of this actual A/B packet."""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import re
import sys
import zipfile

EXPECTED = {
    'pins.json': 'e702d85ac8590d14c5ab131b6afaaab3ff56466b96da626739df4b0c364d4ae8',
    'probe.py': 'ed35362b4f1b4ede2271357d5cdc5258eb6d5c5cdef11ad5957827261043fb0e',
    'diagnose.py': '5c1cfa884021964f8023404d807ca7f32086b0e21aa67ff7822362e7d66feaba',
    'metadata_probe.py': '8afa01a2ad14e2a306a4a64f4638c0c5739ed5bfbd1a9dd5663c7916685005be',
    'transport.py': '307168863bcc5923339d698de00ed66b72a0425361d060337900bc533a1fe147',
}
RUN = 38013278865
JOB = 114097893399
ARTIFACT = 11655127117
COMMIT = 'd0543504ab3d923490f2e3cf94c968f3739558d8'
ARCHIVE_SHA = 'b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba'
GUARD_PATH = '/home/mathscopeverify/audit/tool-bin:/home/mathscopeverify/audit/lean-4.34.0-rc2-linux/bin:/opt/mathscope-ci/go/bin:/opt/mathscope-ci/rust/bin:/usr/local/bin:/usr/bin:/bin'
WORK = '/home/mathscopeverify/audit/original-source'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--packet', type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    packet = args.packet.resolve()
    root = packet / 'extracted'
    checks = []

    def check(name, condition, detail=None):
        checks.append({'name': name, 'passed': bool(condition), 'detail': detail})

    def read_json(path):
        return json.loads(path.read_text())

    observation = read_json(packet / 'observation-004.json')
    responses = [item['value']['structuredContent'] for item in observation['results']]
    jobs = [job for response in responses for job in response.get('jobs', [])]
    artifacts = [a for response in responses for a in response.get('artifacts', [])]
    job = next(item for item in jobs if item['id'] == JOB)
    artifact = next(item for item in artifacts if item['id'] == ARTIFACT)
    check('actual_job_completed_success', job['run_id'] == RUN and job['status'] == 'completed' and job['conclusion'] == 'success')
    for number in (3, 5, 6, 7, 8, 9):
        step = next(item for item in job['steps'] if item['number'] == number)
        check('actual_job_step_' + str(number), step['status'] == 'completed' and step['conclusion'] == 'success', step['name'])
    check('artifact_API_run_branch_commit', artifact['workflow_run']['id'] == RUN and
          artifact['workflow_run']['head_sha'] == COMMIT and artifact['workflow_run']['head_branch'] == 'handoff-resume-20261010')
    archive = packet / 'original-guard-diagnostic-38013278865-1.zip'
    archive_bytes = archive.read_bytes()
    check('archive_bytes_and_API_digest', len(archive_bytes) == artifact['size_in_bytes'] == 44015 and
          sha(archive_bytes) == ARCHIVE_SHA and artifact['digest'] == 'sha256:' + ARCHIVE_SHA)
    with zipfile.ZipFile(archive) as zipped:
        members = [entry for entry in zipped.infolist() if not entry.is_dir()]
        check('artifact_has_25_files', len(members) == 25)
        for entry in members:
            check('ZIP_member_' + entry.filename, zipped.read(entry) == (root / entry.filename).read_bytes())
    result = read_json(root / 'result.json')
    for name, digest in EXPECTED.items():
        check('fixed_source_' + name, sha((root / name).read_bytes()) == digest and
              sha((root / ('source-' + name)).read_bytes()) == digest)
        item = next(value for path, value in result['sourceFiles'].items() if Path(path).name == name)
        check('recorded_source_' + name, item['sha256'] == digest and item['bytes'] == (root / name).stat().st_size)
    for name, item in result['evidenceFiles'].items():
        content = (root / name).read_bytes()
        check('producer_input_hash_' + name, sha(content) == item['sha256'] and len(content) == item['bytes'])
    raw_log = json.loads((packet / 'job-log-response.json').read_text())['structuredContent']['content'].encode()
    check('canonical_job_log_is_exact_response_bytes', raw_log == (packet / 'job-114097893399.raw.log').read_bytes())
    check('artifact_commit_file', (root / 'mathscope-commit.txt').read_text().strip() == COMMIT)
    check('pinned_Landrun_source', (root / 'landrun-source-head.txt').read_text().strip() == '811cfff51ceaf3d9843708aa6d22e9b84ccac8b4')
    check('Landrun_binary_record_agrees_with_workflow_sha', (root / 'landrun-binary.sha256').read_text().split()[0] == result['landrun']['sha256'])
    check('diagnostic_scope_remains_false_for_N106', result['N106Completed'] is False and result['originalComparatorExecuted'] is False and result['originalLeanKernelExecuted'] is False)
    check('actual_parent_UID_capabilities', result['uid'] == result['euid'] == 1002 and int(result['parentProcess']['status']['CapEff'], 16) == 0)
    check('same_user_DBus_environment', result['environment']['XDG_RUNTIME_DIR'] == '/run/user/1002' and result['environment']['DBUS_SESSION_BUS_ADDRESS'] == 'unix:path=/run/user/1002/bus' and result['environment']['PATH'] == GUARD_PATH)
    check('actual_empty_diagnostic_directory', result['workingDirectory']['path'] == WORK and result['workingDirectory']['empty'] is True)
    cases = {case['label']: case for case in result['cases']}
    summaries = []
    for label, case in cases.items():
        check(label + '_case_bytes_bind_global_record', read_json(root / (label + '.json')) == case)
        log = (root / case['log']).read_bytes()
        check(label + '_raw_log_hash', sha(log) == case['logSHA256'] and len(log) == case['logBytes'])
        decoded = []
        for line in log.decode().splitlines():
            if line.strip().startswith('{'):
                decoded.append(json.loads(line.strip()))
        check(label + '_events_are_raw_log_JSON', decoded == case['events'])
        check(label + '_bounded_observation', case['timeoutSeconds'] == 25 and 0 <= case['elapsedSeconds'] < 40)
        unit = case['unit']
        check(label + '_unique_owned_unit_name', re.fullmatch('mathscope-guard-' + re.escape(label) + '-[0-9a-f]{12}\\.service', unit))
        prefix = ['systemd-run', '--user', '--pty', '--wait', '--collect',
                  '--property=RestrictAddressFamilies=~AF_UNIX', '-E', 'PATH=' + GUARD_PATH,
                  '--working-directory=' + WORK, '--unit=' + unit, '--']
        check(label + '_literal_original_guard_prefix', case['command'][:11] == prefix and case['cwd'] == WORK)
        check(label + '_capture_and_cleanup_no_errors', case['captureError'] is None and not case.get('cleanupIncomplete', False) and 'error' not in case)
        pid = case['clientProcessAtStart']
        check(label + '_actual_client_unprivileged', int(pid['status']['CapEff'], 16) == 0 and all(int(uid) == 1002 for uid in pid['status']['Uid'].split()))
        if label.endswith('-pipe'):
            check(label + '_actual_pipe_FDs', pid['fd0'].startswith('pipe:') and pid['fd1'].startswith('pipe:') and pid['fd1'] == pid['fd2'])
            check(label + '_timeout_not_promoted_after_exit0', case['timedOut'] is True and case['exitCodeBeforeCleanup'] is None and case['finalClientExitCode'] == 0 and case['passed'] is False and decoded == [])
            pre = case['unitCleanup']['beforeCleanup']['properties']
            check(label + '_service_already_exited_before_cleanup', pre['ActiveState'] == 'inactive' and pre['SubState'] == 'dead' and pre['ExecMainCode'] == '1' and pre['ExecMainStatus'] == '0' and pre['RestrictAddressFamilies'] == '~AF_UNIX')
            for key in ('unitCleanup', 'exceptionOrTimeoutCleanup'):
                cleanup = case[key]
                check(label + '_' + key + '_own_unit_only', cleanup['unit'] == unit and cleanup['stop']['command'] == ['systemctl', '--user', 'stop', '--no-block', unit] and cleanup['kill']['command'] == ['systemctl', '--user', 'kill', '--kill-whom=all', '--signal=SIGKILL', unit])
        else:
            check(label + '_actual_outer_TTY_FDs_and_session', pid['fd0'].startswith('/dev/pts/') and pid['fd0'] == pid['fd1'] == pid['fd2'] and pid['pid'] == pid['sessionId'] == pid['processGroup'])
            check(label + '_actual_exit_EOF_before_cleanup', case['timedOut'] is False and case['exitCodeBeforeCleanup'] == case['finalClientExitCode'] == 0 and case['eofObservedBeforeCleanup'] is True and case['passed'] is True)
        summaries.append({'label': label, 'elapsedSeconds': case['elapsedSeconds'], 'timedOut': case['timedOut'],
            'actualExitBeforeCleanup': case['exitCodeBeforeCleanup'], 'actualExitAfterCleanup': case['finalClientExitCode'],
            'originalProbeEvents': [event for event in decoded if 'probe' in event],
            'systemdPropertiesBeforeCleanup': case.get('unitCleanup', {}).get('beforeCleanup', {}).get('properties')})
    for kind in ('af', 'landlock'):
        a, b = cases[kind + '-pipe'], cases[kind + '-outer-pty']
        check(kind + '_same_argv_except_unit', [x for x in a['command'] if not x.startswith('--unit=')] == [x for x in b['command'] if not x.startswith('--unit=')])
        event = b['events'][0]
        expected_probe = 'AF_UNIX socket creation' if kind == 'af' else 'Landlock write outside writable paths'
        check(kind + '_actual_original_negative_JSON', event == {'probe': expected_probe, 'blocked': True, 'errno': 97 if kind == 'af' else 13, 'uid': 1002})
    check('AF_direct_original_payload', cases['af-outer-pty']['command'][11:] == ['/usr/bin/python3', '/opt/mathscope-ci/probe.py', 'unix-socket'])
    check('Landlock_direct_original_restrictions', cases['landlock-outer-pty']['command'][11:] == [result['landrun']['path'], '--best-effort', '--ro', '/', '--rw', '/dev', '-ldd', '-add-exec', '--', '/usr/bin/python3', '/opt/mathscope-ci/probe.py', 'write-outside', result['forbiddenPath']])
    check('write_denial_has_writable_unrestricted_control', result['writeOutsideControl']['succeededWithoutLandlock'] is True and result['writeOutsideControl']['uid'] == 1002 and result['writeOutsideControl']['path'] == result['forbiddenPath'] and result['forbiddenPathAbsentAfterProbes'] is True)
    before, negative, after = cases['af-outer-pty-metadata']['events']
    check('actual_same_PID_original_probe_metadata', before['event'] == 'guard-process-before-original-probe' and after['event'] == 'guard-process-after-original-probe' and before['pid'] == after['pid'] and before['uid'] == before['euid'] == after['uid'] == 1002 and before['probeSHA256'] == after['probeSHA256'] == EXPECTED['probe.py'])
    check('actual_guarded_CapEff0_NoNewPrivs1', before['effectiveCapabilities'] == 0 and int(before['effectiveCapabilitiesHex'], 16) == 0 and before['noNewPrivileges'] == 1)
    check('actual_guarded_controlling_TTY', before['pid'] == before['sessionId'] == before['processGroup'] and all(fd['isatty'] is True and fd['foregroundProcessGroup'] == before['pid'] for fd in before['fd'].values()))
    check('producer_diagnostic_pass_not_N106', result['status'] == 'DIAGNOSTIC_PASS' and result['exitCode'] == 0 and result['diagnosticPassed'] is True and result['N106Completed'] is False)
    passed = all(item['passed'] for item in checks)
    inputs = [packet / 'observation-004.json', archive, packet / 'job-log-response.json', packet / 'job-114097893399.raw.log', Path(__file__).resolve()] + sorted(path for path in root.rglob('*') if path.is_file())
    receipt = {'schema': 'MathScope.ActualGuardDiagnosticPortableAudit/1',
        'completedUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'status': 'DIAGNOSTIC_EVIDENCE_PASS' if passed else 'FAIL_OR_INCOMPLETE',
        'N106Completed': False, 'actualProtectedComparatorExitCode': None,
        'runId': RUN, 'jobId': JOB, 'artifactId': ARTIFACT, 'archiveSHA256': ARCHIVE_SHA,
        'checksPassed': sum(item['passed'] for item in checks), 'checksTotal': len(checks),
        'checks': checks, 'actualCaseSummaries': summaries,
        'interpretation': 'In this reproduction both services exited before the PIPE client finished; only an outer PTY delivered original negative-probe JSON and a normal client exit. This supports the transport repair, without supplying a Comparator result.',
        'inputs': [{'path': str(path.relative_to(packet)), 'bytes': path.stat().st_size, 'sha256': sha(path.read_bytes())} for path in inputs]}
    with args.output.open('x') as output:
        json.dump(receipt, output, indent=2)
        output.write('\n')
    print(json.dumps({key: receipt[key] for key in ('status', 'checksPassed', 'checksTotal', 'N106Completed')}))
    return 0 if passed else 1


if __name__ == '__main__':
    sys.exit(main())
