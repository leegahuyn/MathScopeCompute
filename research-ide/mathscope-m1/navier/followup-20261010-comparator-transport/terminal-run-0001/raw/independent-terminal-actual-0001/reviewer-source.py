#!/usr/bin/env python3
"""Independently inspect an actual protected Comparator artifact and API record.

This implementation imports neither the primary auditor nor the controller.
It runs no shell commands, theorem prover, guard or Comparator. An actual archive
and final API observation are required; output is created exclusively.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import stat
import sys
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from zipfile import BadZipFile, ZipFile

RUN = 38014602021
JOB = 114101981614
COMMIT = '55dacb898f8c204bf0c5925ea901d75d6c2d0f46'
BINDING_SHA = '5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab'
MANIFEST_SHA = '48341732c4eac4a991ed5b65b786beedc9f1d7098a97698ce99c89dead22a273'
PRIMARY_AUDITOR_SHA = '81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef'
ORIGINAL = 'f9e8bc5b38b6e212696e8a30e3e91517af887bbd'
KERNEL_SHA = 'cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5'
LEAN_ARCHIVE_SHA = '3d011041203acacf300d343a39673f7d233743397993797c941346ae9e5df1a8'
ORIGINAL_INPUT_SHA = {
    'protected-controller.py': '03144d3692790deafd1b763feee5309144137dde60346335c59afbd094f77687',
    'protected-probe.py': 'ed35362b4f1b4ede2271357d5cdc5258eb6d5c5cdef11ad5957827261043fb0e',
    'pins.json': 'e702d85ac8590d14c5ab131b6afaaab3ff56466b96da626739df4b0c364d4ae8',
    'protected-workflow.yml': 'e785e9e04dd0829c267e1afe4d866f96157f0330036aeca604bc586166f467c2',
    'pinned-original-source-hashes.json': '1511e4398e2825776b1f1f6de35925b02cba19237b42d26bd13a9a65cd8b0f28',
    'original-configuration.json': '7610ecead7b390d80ff7f4229a3ff8f18d630e046f7ad1de4f92c7e8e76845b8',
    'original-Comparator-Main.lean': 'b95ab1b6293f97fa16ecae548cf452b009ba035fc0273fe83b894769435ef6ef',
    'original-Comparator-README.md': 'cfdf0ff608755d56f3bad62acc86273bc0c11591335678344bf53cb733b61772',
}
THEOREMS = (
    'NavierStokes.Comparator.navier_stokes_breakdown_R3',
    'NavierStokes.Comparator.navier_stokes_breakdown_periodic',
)
STANDARD_AXIOMS = {'propext', 'Classical.choice', 'Quot.sound'}
WORK = '/home/mathscopeverify/audit'
ORIGINAL_REPO = WORK + '/original-source'
LEAN_ROOT = WORK + '/lean-4.34.0-rc2-linux'
LAKE = LEAN_ROOT + '/bin/lake'
TOOL = WORK + '/tool-bin'
RUNTIME_PATH = ':'.join([TOOL, LEAN_ROOT + '/bin', '/opt/mathscope-ci/go/bin',
                         '/opt/mathscope-ci/rust/bin', '/usr/local/bin', '/usr/bin', '/bin'])
GUARD_START = ['systemd-run', '--user', '--pty', '--wait', '--collect',
               '--property=RestrictAddressFamilies=~AF_UNIX', '-E', 'PATH=' + RUNTIME_PATH,
               '--working-directory=' + ORIGINAL_REPO]
STAGE_ORDER = (
    'identity', 'system', 'extract-official-lean', 'lean-version', 'lean-prefix',
    'original-source-init', 'original-source-remote', 'original-source-fetch',
    'original-source-checkout', 'original-source-head', 'cache-get',
    'pin-Comparator', 'pin-mathlib', 'pin-lean4export',
    'landrun-source-init', 'landrun-source-remote', 'landrun-source-fetch',
    'landrun-source-checkout', 'landrun-source-head',
    'nanoda-source-init', 'nanoda-source-remote', 'nanoda-source-fetch',
    'nanoda-source-checkout', 'nanoda-source-head', 'go-version', 'rust-version',
    'build-landrun', 'build-nanoda', 'build-comparator-tools',
    'guard-preflight', 'guard-metadata-preflight', 'landlock-preflight',
    'protected-comparator', 'submitted-type-and-axiom-audit', 'source-status-after',
)
GUARD_PAYLOADS = {
    'guard-preflight': ['/usr/bin/python3', '/opt/mathscope-ci/probe.py', 'unix-socket'],
    'guard-metadata-preflight': ['/usr/bin/python3', '/opt/mathscope-guard-ci/metadata_probe.py'],
    'landlock-preflight': [TOOL + '/landrun', '--best-effort', '--ro', '/', '--rw', '/dev',
                          '-ldd', '-add-exec', '--', '/usr/bin/python3', '/opt/mathscope-ci/probe.py',
                          'write-outside', WORK + '/forbidden-write'],
    'protected-comparator': [LAKE, 'env', ORIGINAL_REPO + '/.lake/packages/Comparator/.lake/build/bin/comparator',
                             'ComparatorChallenges/NavierStokes.json'],
}
ACCEPTANCE_MESSAGES = (
    'Running nanoda kernel on solution',
    'nanoda kernel accepts the solution',
    'Running Lean default kernel on solution.',
    'Lean default kernel accepts the solution',
    'Your solution is okay!',
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Duplicate JSON object key: ' + key)
        result[key] = value
    return result


def parse_json(data: bytes):
    return json.loads(data.decode('utf-8'), object_pairs_hook=unique_object)


def terminal_text(data: bytes) -> str:
    text = data.decode('utf-8', errors='replace').replace('\r\n', '\n')
    return re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', text)


def log_json(data: bytes):
    events = []
    decoder = json.JSONDecoder(object_pairs_hook=unique_object)
    for line in terminal_text(data).splitlines():
        position = line.find('{')
        if position < 0:
            continue
        try:
            event, _ = decoder.raw_decode(line[position:])
        except (ValueError, json.JSONDecodeError):
            continue
        if isinstance(event, dict):
            events.append(event)
    return events


def exact_int(value, expected):
    return type(value) is int and value == expected


class Inspection:
    def __init__(self, args):
        self.args = args
        self.checks = []
        self.inputs = {}
        self.members = []
        self.files = {}
        self.details = {}
        self.archive = b''

    def check(self, name, condition, **detail):
        self.checks.append({'name': name, 'pass': bool(condition), **({'detail': detail} if detail else {})})

    def read(self, path, expected=None):
        path = Path(path)
        data = path.read_bytes()
        self.inputs[str(path.resolve())] = {'sha256': sha(data), 'bytes': len(data)}
        self.check('regular input file: ' + path.name, path.is_file() and not path.is_symlink())
        if expected:
            self.check('frozen input SHA-256: ' + path.name, sha(data) == expected,
                       expected=expected, actual=sha(data))
        return data

    def archived_json(self, name):
        data = self.files.get(name)
        self.check('required archived JSON: ' + name, data is not None)
        if data is None:
            return {}
        try:
            result = parse_json(data)
            self.check('archived JSON is an object: ' + name, isinstance(result, dict))
            return result if isinstance(result, dict) else {}
        except (ValueError, UnicodeError) as exc:
            self.check('valid unique-key archived JSON: ' + name, False, error=str(exc))
            return {}

    def text(self, name):
        return terminal_text(self.files.get(name, b''))

    def inspect(self):
        args = self.args
        binding = parse_json(self.read(args.production_inputs / 'actual-run-binding.json', BINDING_SHA))
        self.check('fixed actual execution identity', binding.get('runId') == RUN and binding.get('jobId') == JOB
                   and binding.get('mathscopeCommit') == COMMIT and binding.get('branch') == 'main')
        manifest = parse_json(self.read(args.original_inputs / 'manifest.json', MANIFEST_SHA))
        self.check('exact original eight trusted input names', set(manifest.get('files', {})) == set(ORIGINAL_INPUT_SHA))
        original_files = {}
        for name, expected in ORIGINAL_INPUT_SHA.items():
            data = self.read(args.original_inputs / name, expected)
            original_files[name] = data
            record = manifest.get('files', {}).get(name, {})
            self.check('original manifest row: ' + name, record.get('sha256') == expected)
            if 'gitBlobSHA1' in record:
                self.check('original Git blob identity: ' + name, git_blob_sha(data) == record['gitBlobSHA1'])
        pins = parse_json(original_files['pins.json'])
        baseline = parse_json(original_files['pinned-original-source-hashes.json'])
        configuration = parse_json(original_files['original-configuration.json'])
        self.check('independent original tracked baseline has exactly 2669 entries', len(baseline) == 2669)
        self.check('literal original configuration and mandatory external nanoda', configuration == {
            'challenge_module': 'ComparatorChallenges.NavierStokes',
            'solution_module': 'NavierStokes.ComparatorSolution',
            'enable_nanoda': True, 'theorem_names': list(THEOREMS),
            'permitted_axioms': ['propext', 'Quot.sound', 'Classical.choice']})

        self.archive = self.read(args.archive)
        observation_bytes = self.read(args.observation)
        observation = parse_json(observation_bytes)
        self.details.update(githubObservationSHA256=sha(observation_bytes), githubObservationUTC=observation.get('receivedUTC'))
        responses = []
        for item in observation.get('results', []):
            if isinstance(item, dict):
                payload = item.get('value', item)
                if isinstance(payload, dict) and isinstance(payload.get('structuredContent'), dict):
                    responses.append(payload['structuredContent'])
        jobs = [job for response in responses for job in response.get('jobs', []) if isinstance(job, dict) and job.get('id') == JOB]
        artifacts = [obj for response in responses for obj in response.get('artifacts', [])
                     if isinstance(obj, dict) and obj.get('id') == args.artifact_id]
        self.check('one actual matching job in API response', len(jobs) == 1)
        self.check('one actual matching artifact in API response', len(artifacts) == 1)
        job, artifact = (jobs[0] if len(jobs) == 1 else {}), (artifacts[0] if len(artifacts) == 1 else {})
        self.check('actual bound GitHub job completed successfully', job.get('run_id') == RUN
                   and job.get('status') == 'completed' and job.get('conclusion') == 'success')
        self.check('actual archive belongs to the bound run and commit', artifact.get('workflow_run', {}).get('id') == RUN
                   and artifact.get('workflow_run', {}).get('head_sha') == COMMIT
                   and artifact.get('name', '').startswith(f'original-comparator-terminal-{RUN}-'))
        self.check('actual API digest and byte length identify this archive', exact_int(artifact.get('size_in_bytes'), len(self.archive))
                   and artifact.get('digest') == 'sha256:' + sha(self.archive))
        for name in ['Prepare a separate unprivileged verification user',
                     'Run the original protected Comparator and preserve its actual exit']:
            selected = [s for s in job.get('steps', []) if s.get('name') == name]
            self.check('actual workflow step success: ' + name, len(selected) == 1
                       and selected[0].get('status') == 'completed' and selected[0].get('conclusion') == 'success')
        self.details.update(actualJobStatus=job.get('status'), actualJobConclusion=job.get('conclusion'))

        # Read members directly. Nothing is extracted or executed by this reviewer.
        with ZipFile(args.archive) as archive:
            self.check('complete archive CRC verification', archive.testzip() is None)
            seen = set()
            for info in archive.infolist():
                name, posix = info.filename, PurePosixPath(info.filename)
                safe = bool(name) and not posix.is_absolute() and '..' not in posix.parts and '\\' not in name
                safe = safe and name not in seen and not stat.S_ISLNK(info.external_attr >> 16)
                self.check('unique safe archive member: ' + name, safe)
                seen.add(name)
                if not safe or info.is_dir():
                    continue
                data = archive.read(info)
                self.files[name] = data
                member = {'name': name, 'sha256': sha(data), 'bytes': len(data)}
                if args.extracted:
                    local = args.extracted.joinpath(*posix.parts)
                    self.check('independent extracted bytes: ' + name, local.is_file() and not local.is_symlink()
                               and local.read_bytes() == data)
                self.members.append(member)

        self.check('archived actual workflow commit', self.text('mathscope-commit.txt').strip() == COMMIT)
        for name, entry in binding.get('files', {}).items():
            data = self.read(args.production_inputs / name, entry['sha256'])
            self.check('production source Git blob and length: ' + name,
                       git_blob_sha(data) == entry.get('gitBlobSHA1') and len(data) == entry.get('bytes'))
            self.check('actual archived production source: ' + name, self.files.get(entry['artifactName']) == data)
        self.check('all eight actual production sources bound', len(binding.get('files', {})) == 8)
        for key in ['initialObservation', 'runMetadata']:
            entry = binding[key]
            data = self.read(args.production_inputs / entry['path'], entry['sha256'])
            self.check('initial identity record length: ' + key, len(data) == entry['bytes'])

        controller = self.archived_json('result.json')
        before = self.archived_json('source-hashes-before.json')
        after = self.archived_json('source-hashes-after.json')
        archived_pins = self.archived_json('pins.json')
        self.check('original source whole set and every before/after byte hash', len(before) == len(after) == 2669
                   and before == baseline and after == baseline)
        self.check('controller confirms unchanged original sources and guards', controller.get('trackedSourceBytesUnchanged') is True
                   and controller.get('sourceChanges') is False and controller.get('guardChanges') is False)
        self.check('actual archived pins and controller pin record match frozen original', archived_pins == pins == controller.get('pins')
                   and controller.get('pinsSHA256') == sha(original_files['pins.json']))
        self.check('exact original repository head', self.text('original-source-head.log').strip() == ORIGINAL == pins.get('commit'))
        for filename, expected in pins['sourceFileSHA256'].items():
            self.check('unchanged original toolchain/manifest/build configuration: ' + filename,
                       before.get(filename) == after.get(filename) == expected)
        self.check('unchanged original Comparator configuration', before.get(pins['configuration']) == after.get(pins['configuration'])
                   == pins['configurationSHA256'] == sha(original_files['original-configuration.json']))
        self.check('original official archive and kernel remain selected',
                   controller.get('downloadedArchiveSHA256') == pins.get('leanArchiveSHA256') == LEAN_ARCHIVE_SHA
                   and controller.get('leanKernelSHA256') == pins.get('leanKernelSHA256') == KERNEL_SHA)
        self.check('actual official Lean version and prefix', self.text('lean-version.log').strip() ==
                   'Lean (version 4.34.0-rc2, x86_64-unknown-linux-gnu, commit 6a10ac8c22beadecabdbb0919c2b50214762f91d, Release)'
                   and self.text('lean-prefix.log').strip() == LEAN_ROOT)
        self.check('actual unprivileged verification identity and zero effective capabilities',
                   exact_int(controller.get('uid'), 1002) and exact_int(controller.get('euid'), 1002)
                   and exact_int(controller.get('parentEffectiveCapabilities'), 0)
                   and 'uid=1002(mathscopeverify)' in self.text('identity.log') and 'sudo' not in self.text('identity.log'))
        self.check('no original project build before independent Comparator', controller.get('originalProjectOleansBeforeComparator') == [])
        self.check('actual successful controller, no exception or historical postcheck concession',
                   controller.get('schema') == 'MathScope.ProtectedOriginalCI/1' and controller.get('mode') == 'comparator'
                   and controller.get('status') == 'PASS' and exact_int(controller.get('exitCode'), 0)
                   and not controller.get('error') and bool(controller.get('completedUTC')))
        self.details.update(actualControllerStatus=controller.get('status'), actualControllerExitCode=controller.get('exitCode'),
                            actualControllerCompletedUTC=controller.get('completedUTC'), trackedFileCount=len(before))

        steps = controller.get('steps', [])
        self.check('all 35 required actual stages, exactly once in original execution order',
                   isinstance(steps, list) and tuple(s.get('label') for s in steps) == STAGE_ORDER)
        stages = {s.get('label'): s for s in steps if isinstance(s, dict)}
        for label in STAGE_ORDER:
            stage = stages.get(label, {})
            raw = self.files.get(label + '.log')
            self.check('actual successful completed stage: ' + label,
                       exact_int(stage.get('exitCode'), 0) and bool(stage.get('startedUTC')) and bool(stage.get('completedUTC')))
            self.check('complete actual raw stage log: ' + label,
                       raw is not None and stage.get('logSHA256') == sha(raw if raw is not None else b''))
        required_commands = {
            'cache-get': [LAKE, 'exe', 'cache', 'get'],
            'build-landrun': ['go', 'build', '-mod=readonly', '-o', TOOL + '/landrun', 'cmd/landrun/main.go'],
            'build-nanoda': ['cargo', 'build', '--release', '--locked', '--jobs', '2'],
            'build-comparator-tools': [LAKE, 'build', 'comparator', 'lean4export'],
            'submitted-type-and-axiom-audit': [LAKE, 'env', 'lean', WORK + '/SubmittedAxioms.lean'],
            'source-status-after': ['git', 'status', '--porcelain', '--untracked-files=no'],
        }
        for label, command in required_commands.items():
            self.check('literal trusted build/cache/audit command: ' + label, stages.get(label, {}).get('command') == command)
        for package, key in [('Comparator', 'comparatorCommit'), ('mathlib', 'mathlibCommit'), ('lean4export', 'lean4exportCommit')]:
            self.check('actual original dependency head: ' + package,
                       self.text('pin-' + package + '.log').strip() == controller.get('dependencyHeads', {}).get(package) == pins[key])
        for tool in ['landrun', 'nanoda']:
            self.check('actual independent verifier source commit: ' + tool, self.text(tool + '-source-head.log').strip() == pins[tool]['commit'])
        self.check('selected Go and Rust versions', 'go version go' + pins['goVersion'] + ' ' in self.text('go-version.log')
                   and 'rustc ' + pins['rustVersion'] + ' ' in self.text('rust-version.log'))
        binary_hashes = controller.get('verificationToolSHA256', {})
        self.check('actual built verifier and Comparator binary hashes recorded',
                   set(binary_hashes) == {'landrun', 'nanoda_bin', 'lean4export'}
                   and all(isinstance(v, str) and re.fullmatch('[a-f0-9]{64}', v) for v in binary_hashes.values())
                   and isinstance(controller.get('comparatorBinarySHA256'), str)
                   and re.fullmatch('[a-f0-9]{64}', controller['comparatorBinarySHA256']))

        units = []
        for label, payload in GUARD_PAYLOADS.items():
            stage = stages.get(label, {})
            command = stage.get('command', [])
            transport = stage.get('transportRecord', {})
            unit = command[9] if isinstance(command, list) and len(command) > 10 else ''
            valid_unit = isinstance(unit, str) and re.fullmatch('--unit=mathscope-protected-' + re.escape(label) + '-[0-9a-f]{12}\\.service', unit)
            expected = GUARD_START + [unit, '--'] + payload
            self.check('full exact original security argv with sole owned unit: ' + label,
                       valid_unit and command == expected and sum(str(x).startswith('--unit=') for x in command) == 1)
            units.append(unit)
            self.check('guard transport record binds this exact command and unit: ' + label,
                       transport.get('label') == label and transport.get('unit') == unit.removeprefix('--unit=')
                       and transport.get('command') == command and transport.get('cwd') == stage.get('cwd') == ORIGINAL_REPO)
            self.check('real pre-cleanup exit zero and EOF, no timeout or cleanup substitute: ' + label,
                       stage.get('status') == 'PASS' and transport.get('passed') is True
                       and transport.get('transport') == 'outer-pty' and transport.get('timedOut') is False
                       and exact_int(transport.get('exitCodeBeforeCleanup'), 0)
                       and exact_int(transport.get('finalClientExitCode'), 0) and exact_int(stage.get('exitCode'), 0)
                       and transport.get('eofObservedBeforeCleanup') is True and transport.get('eofObservedAfterCleanup') is True
                       and transport.get('captureError') is None and not transport.get('transportException')
                       and not transport.get('cleanupIncomplete', False) and transport.get('cleanup') == []
                       and 'exceptionOrTimeoutCleanup' not in transport and 'unitCleanup' not in transport
                       and transport.get('timeoutSeconds') == (19800 if label == 'protected-comparator' else 25))
            raw = self.files.get(label + '.log', b'')
            self.check('complete raw PTY log and CI stream: ' + label, bool(raw)
                       and exact_int(transport.get('streamedBytes'), len(raw)) and exact_int(transport.get('logBytes'), len(raw))
                       and transport.get('logSHA256') == stage.get('logSHA256') == sha(raw))
        self.check('four distinct owned guarded units', len(units) == len(set(units)) == 4)
        self.details['actualProtectedComparatorExitCode'] = stages.get('protected-comparator', {}).get('exitCode')
        adaptation = controller.get('transportOnlyAdaptation', {})
        self.check('disclosed transport-only change binds its actual reviewed source',
                   adaptation.get('diagnosticRunId') == 38013278865
                   and adaptation.get('validatedDiagnosticTransportSHA256') == '307168863bcc5923339d698de00ed66b72a0425361d060337900bc533a1fe147'
                   and adaptation.get('runProtectedSHA256') == sha(self.files.get('run_protected.py', b''))
                   and adaptation.get('protectedTransportSHA256') == sha(self.files.get('protected_transport.py', b''))
                   and adaptation.get('copiedOriginalControllerSHA256') == sha(self.files.get('source-original-run.py', b''))
                   and adaptation.get('guardSecurityOptionsUnchanged') is True
                   and adaptation.get('preflightTimeoutSeconds') == 25 and adaptation.get('comparatorTimeoutSeconds') == 19800)

        probe_sources = self.files.get('probe.py', b'')
        self.check('actual negative probe is unchanged and enforces empty effective capabilities',
                   probe_sources == original_files['protected-probe.py']
                   and b'assert os.geteuid() != 0' in probe_sources
                   and b'assert int(status["CapEff"].strip(), 16) == 0' in probe_sources)
        for label, name, errors in [('guard-preflight', 'AF_UNIX socket creation', {1, 13, 97}),
                                    ('landlock-preflight', 'Landlock write outside writable paths', {1, 13})]:
            found = [x for x in log_json(self.files.get(label + '.log', b'')) if x.get('probe') == name]
            self.check('actual original negative probe result: ' + label, len(found) == 1 and found[0].get('blocked') is True
                       and exact_int(found[0].get('uid'), 1002) and type(found[0].get('errno')) is int and found[0]['errno'] in errors)

        events = log_json(self.files.get('guard-metadata-preflight.log', b''))
        starts = [x for x in events if x.get('event') == 'guard-process-before-original-probe']
        finishes = [x for x in events if x.get('event') == 'guard-process-after-original-probe']
        start, finish = (starts[0] if len(starts) == 1 else {}), (finishes[0] if len(finishes) == 1 else {})
        self.check('one before/after metadata pair from the same actual process', len(starts) == len(finishes) == 1
                   and type(start.get('pid')) is int and start['pid'] > 0 and start['pid'] == finish.get('pid')
                   and exact_int(start.get('uid'), 1002) and exact_int(start.get('euid'), 1002) and exact_int(finish.get('uid'), 1002)
                   and start.get('probeSHA256') == finish.get('probeSHA256') == sha(probe_sources)
                   and controller.get('guardProcessMetadata') == start)
        self.check('actual guarded process caps zero, NNP one and real controlling terminal',
                   exact_int(start.get('effectiveCapabilities'), 0) and start.get('effectiveCapabilitiesHex') == '0000000000000000'
                   and exact_int(start.get('noNewPrivileges'), 1) and start.get('pid') == start.get('sessionId') == start.get('processGroup')
                   and set(start.get('fd', {})) == {'0', '1', '2'}
                   and all(x.get('isatty') is True and x.get('foregroundProcessGroup') == start.get('pid') for x in start.get('fd', {}).values()))
        self.check('unchanged probe really denied AF_UNIX in the metadata process',
                   any(x.get('probe') == 'AF_UNIX socket creation' and x.get('blocked') is True
                       and exact_int(x.get('uid'), 1002) and x.get('errno') in {1, 13, 97} for x in events))
        control = controller.get('landlockWriteControl', {})
        control_bytes = b'Original Landlock preflight write control.\n'
        self.check('same-user positive write control and actual forbidden-write absence',
                   exact_int(control.get('uid'), 1002) and control.get('path') == WORK + '/forbidden-write'
                   and control.get('succeededWithoutLandlock') is True and control.get('sha256') == sha(control_bytes)
                   and exact_int(control.get('bytes'), len(control_bytes)) and controller.get('landlockForbiddenWriteAbsent') is True)

        comparison = self.text('protected-comparator.log')
        positions = [comparison.find(message) for message in ACCEPTANCE_MESSAGES]
        self.check('actual nanoda then Lean then final Quot-success path in complete Comparator log',
                   all(p >= 0 for p in positions) and all(a < b for a, b in zip(positions, positions[1:])), positions=positions)
        self.check('no actual kernel or quotient rejection marker', not any(message in comparison for message in [
            'kernel rejects the solution', 'kernel rejected the solution', 'Quotient post-check rejects the solution', 'Quotient constant mismatch on:']))
        main_source = original_files['original-Comparator-Main.lean'].decode()
        self.check('final success marker is interpreted using fixed original Comparator implementation',
                   'Quotient post-check rejects the solution' in main_source and 'Your solution is okay!' in main_source
                   and 'if cfg.enable_nanoda?.getD false then' in main_source)
        type_text = self.text('submitted-type-and-axiom-audit.log')
        printed = re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]", type_text, flags=re.S)
        axiom_map = {name: [a.strip() for a in body.split(',') if a.strip()] for name, body in printed}
        self.check('exactly both submitted theorem axiom sets, no additional axioms', len(printed) == len(axiom_map) == 2
                   and set(axiom_map) == set(THEOREMS) and all(set(values) <= STANDARD_AXIOMS for values in axiom_map.values()))
        for theorem in THEOREMS:
            self.check('actual printed submitted theorem type: ' + theorem, re.search(re.escape(theorem) + r'\s*:', type_text) is not None)
        self.details['theoremAxioms'] = axiom_map

        last = stages.get('source-status-after', {})
        stdout, stderr = self.files.get('source-status-after.stdout.log'), self.files.get('source-status-after.stderr.log')
        self.check('actual clean tracked Git status with separate preserved stderr', stdout == b'' and stderr is not None
                   and last.get('stdoutLog') == 'source-status-after.stdout.log' and last.get('stderrLog') == 'source-status-after.stderr.log'
                   and exact_int(last.get('stdoutBytes'), 0) and exact_int(last.get('stderrBytes'), len(stderr or b''))
                   and last.get('stdoutSHA256') == sha(stdout or b'') and last.get('stderrSHA256') == sha(stderr or b'')
                   and self.files.get('source-status-after.log') == b'--- stdout ---\n' + (stdout or b'') + b'\n--- stderr ---\n' + (stderr or b'') + b'\n')

        if args.primary_audit:
            data = self.read(args.primary_audit)
            audit = parse_json(data)
            self.details['primaryTerminalAuditSHA256'] = sha(data)
            self.check('separate primary auditor concerns exactly these bytes and actual execution',
                       audit.get('schema') == 'MathScope.OriginalProtectedComparatorTerminalAudit/1'
                       and audit.get('verifierSHA256') == PRIMARY_AUDITOR_SHA and audit.get('actualRunBindingSHA256') == BINDING_SHA
                       and audit.get('runId') == RUN and audit.get('jobId') == JOB and audit.get('artifactId') == args.artifact_id
                       and audit.get('archiveSHA256') == sha(self.archive) and audit.get('archiveBytes') == len(self.archive)
                       and audit.get('githubObservationSHA256') == sha(observation_bytes))
            ac = audit.get('checks', [])
            self.check('separate actual primary auditor also passed; not used in place of this inspection',
                       audit.get('status') == 'PASS' and audit.get('N106Completed') is True and audit.get('postcheckOnlyFailure') is False
                       and bool(ac) and all(x.get('pass') is True for x in ac)
                       and exact_int(audit.get('passed'), len(ac)) and exact_int(audit.get('total'), len(ac)))
        if args.job_log:
            raw = self.read(args.job_log)
            text = terminal_text(raw)
            positions = [text.find(message) for message in ACCEPTANCE_MESSAGES]
            self.check('separate actual raw job log contains ordered kernel/final acceptance',
                       all(p >= 0 for p in positions) and all(a < b for a, b in zip(positions, positions[1:])))
            self.details['rawJobLogSHA256'] = sha(raw)

    def report(self):
        # The entire input archive and every external input remain unchanged.
        for filename, record in tuple(self.inputs.items()):
            path = Path(filename)
            self.check('input byte preservation at seal: ' + path.name,
                       path.is_file() and sha(path.read_bytes()) == record['sha256'])
        passed = bool(self.checks) and all(item['pass'] for item in self.checks)
        return {
            'schema': 'MathScope.IndependentActualProtectedComparatorReview/1',
            'status': 'PASS' if passed else 'FAIL_OR_INCOMPLETE', 'N106Completed': passed,
            'reviewedUTC': datetime.now(timezone.utc).isoformat(),
            'runId': RUN, 'jobId': JOB, 'artifactId': self.args.artifact_id, 'mathscopeCommit': COMMIT,
            'archiveSHA256': sha(self.archive), 'archiveBytes': len(self.archive),
            'actualRunBindingSHA256': BINDING_SHA, 'reviewerSourceSHA256': sha(Path(__file__).read_bytes()),
            'passed': sum(item['pass'] for item in self.checks), 'total': len(self.checks), 'checks': self.checks,
            'members': self.members, 'inputs': self.inputs, **self.details,
            'primaryAuditorImportedOrInvoked': False, 'controllerImportedOrInvoked': False,
            'newComparatorRunPerformedByReviewer': False, 'newKernelRunPerformedByReviewer': False,
            'scope': 'Independent reading of actual final API/archive/source/guard/exit/marker/type/axiom evidence. No historical cancellation, transport-only diagnostic or cleanup exit is promoted to protected Comparator success.',
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True, type=Path, help='Actual downloaded terminal ZIP bytes')
    parser.add_argument('--artifact-id', required=True, type=int, help='Actual API artifact ID')
    parser.add_argument('--observation', required=True, type=Path, help='Actual final saved jobs+artifacts API response')
    parser.add_argument('--original-inputs', required=True, type=Path, help='Frozen original comparator-auditor-inputs directory')
    parser.add_argument('--production-inputs', required=True, type=Path, help='Frozen terminal-auditor-inputs directory')
    parser.add_argument('--extracted', type=Path, help='Optional independently extracted directory; compare all member bytes')
    parser.add_argument('--primary-audit', type=Path, help='Optional actual primary terminal audit, compared only after independent checks')
    parser.add_argument('--job-log', type=Path, help='Optional actual raw GitHub job log')
    parser.add_argument('--output', required=True, type=Path, help='New independent result only; never overwritten')
    args = parser.parse_args()
    if args.output.exists() or args.output.is_symlink():
        parser.error('Refusing to overwrite an existing independent result')
    for name in ['archive', 'observation']:
        if not getattr(args, name).is_file():
            parser.error('An actual existing ' + name + ' file is required before a result can be issued')
    inspection = Inspection(args)
    try:
        inspection.inspect()
    except Exception as exc:
        inspection.check('review could complete without a structural/input exception', False,
                         exceptionType=type(exc).__name__, message=str(exc))
    report = inspection.report()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('x', encoding='utf-8') as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)
        handle.write('\n')
    print(json.dumps({key: report[key] for key in ['status', 'N106Completed', 'runId', 'jobId', 'archiveSHA256', 'passed', 'total']}))
    for check in report['checks']:
        if not check['pass']:
            print(json.dumps(check, ensure_ascii=False))
    return 0 if report['N106Completed'] else 1


if __name__ == '__main__':
    sys.exit(main())
