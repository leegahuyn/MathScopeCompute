#!/usr/bin/env python3
"""Independent read-only review of frozen auditor sources and actual controls."""
import ast
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
REPAIR = HERE.parent
REPO = Path('/workspace/scratch/9a6c38c54c2e/MathScopeCompute')
NAVIER = REPO / 'research-ide/mathscope-m1/navier'
TERMINAL = NAVIER / 'followup-20261010-comparator-transport'
TRUST = TERMINAL / 'terminal-auditor-inputs'
OLD_TRUST = NAVIER / 'followup-20261010-n1-final/comparator-auditor-inputs'
V1 = '83dcdd2824792cb8cc4eb73045ff3aa22bf25589a0eeb84049e78bff195860b7'
V2 = '81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef'
BIND = '5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def main():
    output = HERE / 'reviewer-receipt-0001.json'
    if output.exists():
        raise ValueError('Append-only reviewer receipt already exists')
    checks, inputs, git_queries = [], {}, []

    def read(path):
        data = Path(path).read_bytes()
        inputs[str(path)] = {'bytes': len(data), 'sha256': sha(data)}
        return data

    def check(name, ok):
        checks.append({'name': name, 'passed': bool(ok)})

    read(__file__)
    source = read(TERMINAL / 'verify_n106_terminal_artifact.py')
    binding_bytes = read(TRUST / 'actual-run-binding.json')
    check('frozen final auditor bytes', sha(source) == V2)
    check('unchanged actual run binding bytes', sha(binding_bytes) == BIND)
    binding = json.loads(binding_bytes)
    check('actual run, job and commit only; no completion at binding',
          binding['runId'] == 38014602021 and binding['jobId'] == 114101981614 and
          binding['mathscopeCommit'] == '55dacb898f8c204bf0c5925ea901d75d6c2d0f46' and
          binding['N106CompletedAtBinding'] is False)
    check('eight frozen runtime files', len(binding['files']) == 8)
    for name, item in binding['files'].items():
        data = read(TRUST / name)
        check('runtime byte/hash/blob: ' + name, len(data) == item['bytes'] and
              sha(data) == item['sha256'] and blob(data) == item['gitBlobSHA1'])
        command = ['git', 'rev-parse', binding['mathscopeCommit'] + ':' + item['gitPath']]
        proc = subprocess.run(command, cwd=REPO, capture_output=True, text=True, check=False)
        git_queries.append({'command': command, 'exitCode': proc.returncode,
                            'stdout': proc.stdout, 'stderr': proc.stderr})
        check('actual commit tree contains frozen blob: ' + name,
              proc.returncode == 0 and proc.stdout.strip() == blob(data))
    for key in ('initialObservation', 'runMetadata'):
        item = binding[key]
        data = read(TRUST / item['path'])
        check('saved actual binding observation: ' + key,
              len(data) == item['bytes'] and sha(data) == item['sha256'])
    acceptance = read(REPO / 'research-ide/mathscope-m1/evidence/original-acceptance.json')
    check('unchanged original acceptance criteria', sha(acceptance) == binding['originalAcceptanceSHA256'])
    observation = json.loads((TRUST / binding['initialObservation']['path']).read_text())
    jobs = [j for r in observation['results'] for j in
            r.get('value', r).get('structuredContent', {}).get('jobs', [])]
    check('actual job observed at binding', any(j['id'] == binding['jobId'] and
          j['run_id'] == binding['runId'] for j in jobs))
    metadata = json.loads((TRUST / binding['runMetadata']['path']).read_text())
    actual_run = json.loads(metadata['results'][0]['structuredContent']['content'])
    check('actual run API binds commit, branch and workflow', actual_run['id'] == binding['runId'] and
          actual_run['head_sha'] == binding['mathscopeCommit'] and actual_run['head_branch'] == 'main' and
          actual_run['path'] == binding['workflowPath'])
    manifest = json.loads(read(OLD_TRUST / 'manifest.json'))
    check('eight original trusted inputs retained', len(manifest['files']) == 8)
    for name, item in manifest['files'].items():
        data = read(OLD_TRUST / name)
        check('original trusted input preserved: ' + name, sha(data) == item['sha256'] and
              ('gitBlobSHA1' not in item or blob(data) == item['gitBlobSHA1']))
    read(NAVIER / 'followup-20261010-n1-final/verify_n106_artifact.py')

    tree = ast.parse(source)
    constants = {n.targets[0].id: n.value for n in tree.body if isinstance(n, ast.Assign)
                 and len(n.targets) == 1 and isinstance(n.targets[0], ast.Name)}
    stages = ast.literal_eval(constants['EXPECTED_STAGES'])
    expected = ['identity', 'system', 'extract-official-lean', 'lean-version', 'lean-prefix']
    for name in ['original-source']:
        expected += [name + '-' + action for action in ['init', 'remote', 'fetch', 'checkout', 'head']]
    expected += ['cache-get', 'pin-Comparator', 'pin-mathlib', 'pin-lean4export']
    for name in ['landrun-source', 'nanoda-source']:
        expected += [name + '-' + action for action in ['init', 'remote', 'fetch', 'checkout', 'head']]
    expected += ['go-version', 'rust-version', 'build-landrun', 'build-nanoda', 'build-comparator-tools',
                 'guard-preflight', 'guard-metadata-preflight', 'landlock-preflight', 'protected-comparator',
                 'submitted-type-and-axiom-audit', 'source-status-after']
    check('exact 35-stage list independently traced through frozen controller',
          len(expected) == len(stages) == 35 and expected == stages)
    text = source.decode()
    for name, fragment in {
        'requires all stages in order': '[x.get("label") for x in steps]==EXPECTED_STAGES',
        'unit at guard boundary': 'command[9]==units_in_command[0] and command[10]=="--"',
        'same recorded unit': 'transport.get("unit")==units_in_command[0][7:]',
        'same recorded label': 'transport.get("label")==label',
        'actual producer PASS required': 'transport.get("passed") is True',
        'job success required': 'job.get("conclusion")=="success"',
        'historical controller exception removed': 'postcheck_only=False',
        'all checks govern completion': 'passed=all(c["pass"] for c in checks)',
        'failure CLI exit preserved': 'return 0 if passed else 1',
    }.items():
        check('reviewed final acceptance structure: ' + name, fragment in text)

    for attempt, version in [('0001', V1), ('0002', V2)]:
        packet = REPAIR / ('terminal-auditor-negative-controls-' + attempt)
        receipt = json.loads(read(packet / 'receipt.json'))
        tested = read(packet / 'auditor-source-tested.py')
        check('actual negative-control source retained: ' + attempt, sha(tested) == version)
        check('two actual negative cases: ' + attempt, receipt['status'] == 'PASS' and len(receipt['cases']) == 2)
        for case in receipt['cases']:
            label = attempt + '/' + case['name']
            audit_bytes = read(packet / (case['name'] + '.audit.json'))
            audit = json.loads(audit_bytes)
            check('recorded actual rejection: ' + label, case['exitCode'] == 1 and case['expectedRejection'] is True
                  and case['N106Completed'] is False and audit['N106Completed'] is False and
                  audit['status'] == 'FAIL_OR_INCOMPLETE' and audit['verifierSHA256'] == version and
                  audit['actualRunBindingSHA256'] == BIND and sha(audit_bytes) == case['auditSHA256'])
            for stream in ['stdout', 'stderr']:
                data = read(packet / (case['name'] + '.' + stream + '.log'))
                check('actual negative ' + stream + ': ' + label, sha(data) == case[stream + 'SHA256'] and
                      (stream != 'stderr' or data == b''))
            for item in case['inputs']:
                path = Path(item['path'])
                data = tested if path.name == 'verify_n106_terminal_artifact.py' else read(path)
                check('actual negative input bound: ' + label + '/' + path.name, sha(data) == item['sha256'])
    preservation = json.loads(read(REPAIR / 'terminal-auditor-negative-controls-0001/source-byte-preservation.json'))
    check('prior source reconstruction explicitly identified', preservation['sha256'] == V1 and
          'inverse' in preservation['method'] and 'SHA256 matched' in preservation['method'])
    check('reviewed sources unchanged during review', all(
          sha(Path(path).read_bytes()) == item['sha256'] for path, item in inputs.items()))
    report = {'schema': 'MathScope.IndependentTerminalAuditorSourceReview/1',
              'completedUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'status': 'PASS' if all(c['passed'] for c in checks) else 'FAIL',
              'checksPassed': sum(c['passed'] for c in checks), 'checksTotal': len(checks),
              'checks': checks, 'inputBindings': inputs, 'readOnlyGitQueries': git_queries,
              'auditorSHA256': V2, 'actualRunBindingSHA256': BIND,
              'reviewerExecutedComparator': False, 'reviewerReranNegativeControls': False,
              'N106Completed': False,
              'scope': 'Source, immutable execution identity and actual negative-control review only. Await the actual full production artifact for gate closure.',
              'resolvedFindings': ['Require every actual stage, not only supplied stage entries.',
                  'Require unique service unit at its exact guard boundary and consistent transport unit/label.',
                  'Require the actual transport producer passed field as well as independent success conditions.'],
              'manualOriginalComparatorReview': 'Original Main confirms external nanoda acceptance, Lean replay, Quot postcheck and final success output in this order. No original acceptance requirement was weakened.'}
    with output.open('x') as f:
        json.dump(report, f, indent=2)
        f.write('\n')
    print(json.dumps({'status': report['status'], 'checks': str(report['checksPassed']) + '/' + str(report['checksTotal']),
                      'receipt': str(output), 'sha256': sha(output.read_bytes())}))
    return 0 if report['status'] == 'PASS' else 1


if __name__ == '__main__':
    sys.exit(main())
