#!/usr/bin/env python3
"""Read-only independent source/log review; does not rerun tests or a guard."""
import ast
import datetime
import hashlib
import json
from pathlib import Path
import re
import sys
import yaml

HERE = Path(__file__).resolve().parent
REPAIR = HERE.parent
REPO = Path('/workspace/scratch/9a6c38c54c2e/MathScopeCompute')
LOCAL = REPAIR / 'protected-controller-local-0001'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    out = HERE / 'reviewer-receipt-0001.json'
    if out.exists():
        raise ValueError('Append-only review: receipt already exists')
    checks, inputs = [], {}

    def check(name, ok):
        checks.append({'name': name, 'passed': bool(ok)})

    def read(path):
        path = Path(path)
        data = path.read_bytes()
        inputs[str(path)] = {'bytes': len(data), 'sha256': sha(data)}
        return data

    read(__file__)
    local = json.loads(read(LOCAL / 'receipt.json'))
    check('actual local exit and scope', local['exitCode'] == 0 and local['status'] == 'PASS'
          and local['actualTestsRun'] == 12 and local['actualGuardExecuted'] is False
          and local['actualComparatorExecuted'] is False and local['N106Completed'] is False)
    for item in local['inputs']:
        actual, snapshot = read(REPO / item['path']), read(LOCAL / item['snapshot'])
        check('actual test input: ' + item['path'], actual == snapshot and
              len(actual) == item['bytes'] and sha(actual) == item['sha256'])
    for stream in ('stdout', 'stderr'):
        data = read(LOCAL / (stream + '.log'))
        check('actual ' + stream + ' byte hash', sha(data) == local[stream + 'SHA256'])
    test_log = (LOCAL / 'stderr.log').read_text()
    actual_names = re.findall(r'^(test_\w+) \([^\n]+\) \.\.\. ok$', test_log, re.M)
    test_paths = ['tools/ns-guard-ci/test_transport.py', 'tools/ns-guard-ci/test_protected_transport.py']
    expected_names = set()
    for path in test_paths:
        tree = ast.parse(read(REPO / path))
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name.startswith('test_'):
                expected_names.add(node.name)
    check('twelve actual tests match inherited/overridden source methods',
          len(actual_names) == len(set(actual_names)) == len(expected_names) == 12 and
          set(actual_names) == expected_names and 'Ran 12 tests in 2.002s' in test_log and
          test_log.endswith('\nOK\n'))
    check('original claimed preservation checks', len(local['preservationChecks']) == 7 and
          all(local['preservationChecks'].values()) and local['inputBytesStillEqual'] is True)

    original_path = REPO / 'tools/ns-original-ci/run.py'
    protected_path = REPO / 'tools/ns-guard-ci/run_protected.py'
    original_text, protected_text = read(original_path).decode(), read(protected_path).decode()
    original, protected = ast.parse(original_text), ast.parse(protected_text)

    def functions(tree):
        return {n.name: n for n in tree.body if isinstance(n, ast.FunctionDef)}

    def dump(node):
        return ast.dump(node, include_attributes=False)

    a, b = functions(original), functions(protected)
    for name in ('digest', 'utc', 'capture_git_status', 'require_clean_git_status'):
        check('unchanged original function: ' + name, dump(a[name]) == dump(b[name]))
    am, bm = functions(a['main']), functions(b['main'])
    for name in ('save', 'run', 'clone', 'source_hashes'):
        check('unchanged original nested function: ' + name, dump(am[name]) == dump(bm[name]))

    def stages(tree):
        result = {}
        for node in ast.walk(tree):
            if (isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and
                node.func.id in ('run', 'run_guard') and node.args and
                isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str)):
                result[node.args[0].value] = ([dump(n) for n in node.args[:3]],
                                            [dump(n) for n in node.keywords])
        return result

    sa, sb = stages(a['main']), stages(b['main'])
    for label, args in sa.items():
        check('preserved original command/cwd: ' + label, sb.get(label) == args)
    start = '        run("identity", ["id"])'
    end = '            # Exercise the original guard and Landlock, without relying on a flag alone.'
    check('literal original preparation through guarded argv',
          original_text.split(start, 1)[1].split(end, 1)[0] ==
          protected_text.split(start, 1)[1].split(end, 1)[0])
    tail = '            audit = base / "SubmittedAxioms.lean"'
    check('literal original type/axiom/source/kernel/Git/final tail',
          original_text.split(tail, 1)[1] == protected_text.split(tail, 1)[1])
    fixed = {
        'tools/ns-original-ci/run.py': '47b0126a22ada5c2254377a458daac076948526f5e8eaa13b5c4e47f933bc220',
        'tools/ns-original-ci/probe.py': 'ed35362b4f1b4ede2271357d5cdc5258eb6d5c5cdef11ad5957827261043fb0e',
        'tools/ns-original-ci/pins.json': 'e702d85ac8590d14c5ab131b6afaaab3ff56466b96da626739df4b0c364d4ae8',
        'tools/ns-guard-ci/transport.py': '307168863bcc5923339d698de00ed66b72a0425361d060337900bc533a1fe147',
        'tools/ns-guard-ci/metadata_probe.py': '8afa01a2ad14e2a306a4a64f4638c0c5739ed5bfbd1a9dd5663c7916685005be',
    }
    for path, expected in fixed.items():
        check('unchanged fixed source: ' + path, sha(read(REPO / path)) == expected)
    transport = read(REPO / 'tools/ns-guard-ci/protected_transport.py').decode()
    dt = functions(ast.parse(read(REPO / 'tools/ns-guard-ci/transport.py')))
    pt = functions(ast.parse(transport))
    for name in ('utc', 'process_state', '_controlling_terminal'):
        check('unchanged diagnosed transport primitive: ' + name, dump(dt[name]) == dump(pt[name]))
    check('transport retains strict original prefix and disclosure',
          'if command[:10] != expected:' in transport and
          'command.insert(9, "--unit=" + unit)' in transport and
          '330 * 60' in transport and 'transport="outer-pty"' in transport)
    for condition in (
        'record.get("timedOut") is False', 'record.get("captureError") is None',
        'not record.get("cleanupIncomplete", False)', 'record.get("exitCodeBeforeCleanup") == 0',
        'record.get("finalClientExitCode") == 0', 'record.get("eofObservedBeforeCleanup") is True',
        '"transportException" not in record', 'record.get("streamedBytes") == record.get("logBytes")'):
        check('required transport PASS conjunct: ' + condition, condition in transport.split('record["passed"] =', 1)[1])

    workflow_path = REPO / '.github/workflows/ns-comparator-verification.yml'
    workflow_bytes = read(workflow_path)
    workflow = yaml.load(workflow_bytes, Loader=yaml.BaseLoader)
    job = workflow['jobs']['comparator']
    steps = job['steps']
    check('main-push trigger, explicit dispatch, read-only token',
          workflow['on']['push']['branches'] == ['main'] and 'workflow_dispatch' in workflow['on'] and
          workflow['permissions'] == {'contents': 'read'})
    check('separate queue without cancellation and fixed host/budget',
          workflow['concurrency']['group'].startswith('pinned-original-comparator-terminal-') and
          workflow['concurrency']['cancel-in-progress'] == 'false' and
          job['runs-on'] == 'ubuntu-24.04' and job['timeout-minutes'] == '350')
    check('no step ignores a failed command', all('continue-on-error' not in s for s in steps))
    check('checkout does not retain credentials', steps[0]['with']['persist-credentials'] == 'false')
    check('fixed Go and no shared Go cache', steps[2]['with'] == {'go-version': '1.27.2', 'cache': 'false'})
    preparation, invocation = steps[3]['run'], steps[4]['run']
    for fragment in ('sudo useradd --create-home --shell /bin/bash mathscopeverify',
                     'test "$mathscope_uid" -eq 1002',
                     'rustup toolchain install 1.99.0 --profile minimal --no-self-update',
                     'sudo install -d -m 755 /opt/mathscope-ci /opt/mathscope-guard-ci',
                     'sudo loginctl enable-linger mathscopeverify'):
        check('workflow preserved/strengthened setup: ' + fragment, fragment in preparation)
    check('literal unprivileged comparator-only call',
          'sudo -u mathscopeverify -H env' in invocation and
          '/usr/bin/python3 -B /opt/mathscope-ci/run_protected.py' in invocation and
          '--mode comparator --work /home/mathscopeverify/audit' in invocation and
          'test "$mathscope_uid" -eq 1002' in invocation and invocation.startswith('set -euo pipefail'))
    check('always preserve actual evidence and upload', steps[5]['if'] == steps[6]['if'] == 'always()' and
          steps[6]['uses'] == 'actions/upload-artifact@v4' and
          steps[6]['with']['if-no-files-found'] == 'error')
    syntax = json.loads(read(REPAIR / 'production-workflow-syntax-001.json'))
    check('actual syntax receipt binds this workflow and four Bash blocks',
          syntax['sha256'] == sha(workflow_bytes) and syntax['passed'] is True and
          len(syntax['bashBlocks']) == 4 and all(x['exitCode'] == 0 for x in syntax['bashBlocks']) and
          [x['stepIndex'] for x in syntax['bashBlocks']] == [i for i, s in enumerate(steps) if 'run' in s])
    remote = json.loads(read(REPAIR / 'independent-remote-review/reviewer-receipt-0001.json'))
    check('independent actual guard evidence bound separately', remote['status'] == 'PASS' and
          remote['checksPassed'] == remote['checksTotal'] == 135 and remote['N106Completed'] is False)
    read(LOCAL / 'controller.diff')
    read(LOCAL / 'transport.diff')
    check('all reviewed input bytes remain unchanged', all(
          sha(Path(path).read_bytes()) == item['sha256'] for path, item in inputs.items()))
    receipt = {
        'schema': 'MathScope.IndependentProtectedControllerReview/1',
        'completedUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'status': 'PASS' if all(x['passed'] for x in checks) else 'FAIL',
        'checksPassed': sum(x['passed'] for x in checks), 'checksTotal': len(checks),
        'checks': checks, 'inputs': inputs, 'actualReviewedLocalTests': actual_names,
        'reviewerReranTests': False, 'reviewerExecutedActualGuard': False,
        'reviewerExecutedComparator': False, 'N106Completed': False,
        'manualSourceFindings': [
            'Full original controller and diagnosed transport diffs read; only disclosed transport and additional checks change.',
            'Original AF_UNIX/PTY/wait/collect, Landlock negative payload, pinned nanoda/configuration and clean original checkout requirements are retained.',
            'Original theorem, axiom, source-byte, kernel-byte and Git-status final acceptance stages remain after actual Comparator success.',
            'Real client exit/EOF and sticky timeout are separate from cleanup; simulated test clients are explicitly not guard evidence.',
            'The 330-minute body and 350-minute job bounds only limit observation; a truncated run cannot establish N1-06.',
            'No remaining source-review blocker identified for the frozen candidate; actual full protected Comparator completion remains required.'
        ],
    }
    with out.open('x') as f:
        json.dump(receipt, f, indent=2)
        f.write('\n')
    print(json.dumps({'status': receipt['status'], 'checks': str(receipt['checksPassed']) + '/' + str(receipt['checksTotal']),
                      'receipt': str(out), 'sha256': sha(out.read_bytes())}))
    return 0 if receipt['status'] == 'PASS' else 1


if __name__ == '__main__':
    sys.exit(main())
