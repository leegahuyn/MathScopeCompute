#!/usr/bin/env python3
"""Read-only independent review of the frozen PASS-only assessment writer.

No invocation of the assessment writer, no positive fixture, no terminal result.
"""
import ast
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

BASE = Path('/workspace/scratch/9a6c38c54c2e')
REPO = BASE / 'MathScopeCompute'
IDE = REPO / 'research-ide'
T = IDE / 'mathscope-m1/navier/followup-20261010-comparator-transport'
OUT = Path(__file__).resolve().parent
PREP = BASE / 'tmp/ns-guard-repair-20261010/terminal-assessment-local-0001'
SCOPE = BASE / 'tmp/ns-guard-repair-20261010/theorem46-scope-review'

def digest(data):
    return hashlib.sha256(data).hexdigest()

def save(path, data):
    with path.open('xb') as handle:
        handle.write(data)

for name in ['source-review-receipt.json', 'SOURCE_REVIEW.md']:
    if (OUT / name).exists():
        raise SystemExit('Refusing to overwrite prior review')
(OUT / 'inputs').mkdir(exist_ok=False)
checks, inputs = [], {}

def check(name, value, **details):
    checks.append({'name': name, 'pass': bool(value), **details})

def read(path, expected=None, snapshot=None):
    path = Path(path)
    data = path.read_bytes()
    sha = digest(data)
    inputs[str(path)] = {'sha256': sha, 'bytes': len(data)}
    if expected:
        check('input hash: ' + str(path), sha == expected, expected=expected, actual=sha)
    if snapshot:
        save(OUT / 'inputs' / snapshot, data)
    return data

writer = T / 'write_terminal_gate_assessment.py'
writer_sha = 'd471135f614fb3ec9d18020c7744433eb4646ad7793ba720a7f127fe9eceb314'
code = read(writer, writer_sha, 'write_terminal_gate_assessment.py').decode()
tree = ast.parse(code, filename=str(writer))
compile(tree, str(writer), 'exec')
check('actual frozen source parses and compiles without executing main', True)
assignments = {}
for node in tree.body:
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        try:
            assignments[node.targets[0].id] = ast.literal_eval(node.value)
        except (ValueError, TypeError):
            pass

expected_pins = {
    'FROZEN_SHA256': 'e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c',
    'BINDING_SHA256': '5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab',
    'AUDITOR_SHA256': '81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef',
    'RESOLUTION_SHA256': 'da4622e9307e3d062fed8e3d097e372406021af0148afd79e313cdbc6bd11bfc',
    'SCOPE_MAP_SHA256': 'af7021b5765feabf3d90ccc6ef77bc599b3215899755164e620421afd93dc583',
    'SCOPE_REVIEW_SHA256': 'e9d1164573ec501e4ad5fd7cb8b21a4ef7eb0086b4dcd3c609e35194766b3c1b',
    'SCOPE_MEMO_SHA256': '4765a8379badf62453a25621e3288ade1652fd309f0110f5c0bb0534e1d8febe',
}
for key, sha in expected_pins.items():
    check('literal frozen constant ' + key, assignments.get(key) == sha)
paths = {
    'FROZEN_SHA256': (T.parent / 'followup-20261010-final-stress-audit/ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_3.json', 'assessment69.json'),
    'BINDING_SHA256': (T / 'terminal-auditor-inputs/actual-run-binding.json', 'actual-run-binding.json'),
    'AUDITOR_SHA256': (T / 'verify_n106_terminal_artifact.py', 'verify_n106_terminal_artifact.py'),
    'RESOLUTION_SHA256': (T / 'historical-criterion-inputs/reference-resolution.json', 'reference-resolution.json'),
    'SCOPE_MAP_SHA256': (SCOPE / 'theorem46-clause-map.json', 'theorem46-clause-map.json'),
    'SCOPE_REVIEW_SHA256': (SCOPE / 'reviewer-receipt-0001.json', 'scope-review-receipt.json'),
    'SCOPE_MEMO_SHA256': (SCOPE / 'THEOREM46_SCOPE_REVIEW.md', 'THEOREM46_SCOPE_REVIEW.md'),
}
loaded = {key: read(path, expected_pins[key], snap) for key, (path, snap) in paths.items()}
old = json.loads(loaded['FROZEN_SHA256'])
binding = json.loads(loaded['BINDING_SHA256'])
resolution = json.loads(loaded['RESOLUTION_SHA256'])
scope = json.loads(loaded['SCOPE_MAP_SHA256'])
scope_review = json.loads(loaded['SCOPE_REVIEW_SHA256'])
prep_bytes = read(PREP / 'receipt.json', snapshot='actual-preparation-receipt.json')
prep = json.loads(prep_bytes)
read(PREP / 'writer-source-tested.py', writer_sha, 'actual-negative-tested-writer.py')
check('actual preparation reports precisely its limited successful scope', prep['status'] == 'PREPARATION_PASS'
      and prep['passed'] == prep['total'] == len(prep['checks']) == 5 and all(c['pass'] is True for c in prep['checks'])
      and prep['writerSHA256'] == writer_sha and prep['simulatedPositiveArtifactUsed'] is False
      and prep['finalAssessmentIssued'] is False and prep['N106CompletedByThisPreparation'] is False)

def refs(value):
    if isinstance(value, dict):
        if isinstance(value.get('path'), str) and isinstance(value.get('sha256'), str):
            yield value
        for child in value.values():
            yield from refs(child)
    elif isinstance(value, list):
        for child in value:
            yield from refs(child)

aliases = {(x['historicalPath'], x['historicalSHA256']): x for x in resolution['entries']}
historical = {}
for item in refs(old):
    identity = item['path'], item['sha256']
    if identity in historical:
        continue
    rawpath = Path(item['path'])
    path = rawpath if rawpath.is_absolute() else IDE / rawpath
    relocated = False
    if not path.exists() or digest(path.read_bytes()) != item['sha256']:
        alias = aliases[identity]
        path = IDE / alias['snapshotPath']
        relocated = True
    check('historical regular file ' + item['path'], path.is_file() and not path.is_symlink())
    data = read(path, item['sha256'])
    check('historical exact bytes ' + item['path'], len(data) == item.get('bytes', len(data)))
    historical[identity] = {'resolvedPath': str(path), 'relocated': relocated}
check('all 47 historical citations resolve; exactly one old README alias', len(historical) == 47
      and sum(x['relocated'] for x in historical.values()) == 1)
check('actual preparation historical report covers identical 47 references',
      {(x['historicalPath'], x['sha256']) for x in prep['historicalReferences']} == set(historical))

alias = resolution['entries'][0]
git_result = subprocess.run(['git', 'show', alias['sourceCommit'] + ':' + alias['sourceGitPath']],
                            cwd=REPO, capture_output=True, check=False)
save(OUT / 'inputs/git-historical-readme.stdout', git_result.stdout)
save(OUT / 'inputs/git-historical-readme.stderr', git_result.stderr)
snapshot = read(IDE / alias['snapshotPath'], alias['historicalSHA256'], 'N1_README_historical.md')
blob_sha = hashlib.sha1(b'blob ' + str(len(snapshot)).encode() + b'\0' + snapshot).hexdigest()
check('read-only historical Git object exactly matches preserved README bytes', git_result.returncode == 0
      and not git_result.stderr and git_result.stdout == snapshot and len(snapshot) == alias['historicalBytes']
      and blob_sha == alias['sourceGitBlobSHA1'])
read(IDE / alias['historicalPath'], alias['laterPathSHA256'])

seen_scope = set()
for item in refs(scope):
    identity = item['path'], item['sha256']
    if identity in seen_scope:
        continue
    seen_scope.add(identity)
    raw = Path(item['path'])
    path = raw if raw.is_absolute() else IDE / raw
    check('scope regular file ' + item['path'], path.is_file() and not path.is_symlink())
    data = read(path, item['sha256'])
    check('scope exact size ' + item['path'], len(data) == item.get('bytes', len(data)))
check('actual preparation scope report covers all 64 exact references', len(seen_scope) == 64
      and {(x['path'], x['sha256']) for x in prep['scopeReferences']} == seen_scope)
common = scope['sameFinalProfileBinding']
check('scope and old assessment identify exactly the same profile',
      common['parameterExpressionSHA256'] == old['parameterExpressionSHA256']
      and common['profileEvidenceSHA256'] == old['profileEvidenceSHA256']
      and common['assemblyReceiptSHA256'] == old['assemblyReceipt']['sha256']
      and common['formalCompletionReviewSHA256'] == old['formalCompletionReview']['sha256']
      and scope_review['sameFinalProfileBinding'] == common)
check('source map has exactly the six same-profile clauses', [c['clause'] for c in scope['clauses']] == ['i','ii','iii','iv','v','vi']
      and all(c['sameFinalProfileBinding'] == common and c['sourceRefs'] for c in scope['clauses']))

neg = prep['negativeExecution']
command = neg['command']
read(PREP / 'cancelled-run.stdout.log', neg['stdoutSHA256'], 'actual-negative.stdout.log')
stderr = read(PREP / 'cancelled-run.stderr.log', neg['stderrSHA256'], 'actual-negative.stderr.log')
for option, key in [('--audit', 'actualAuditSHA256'), ('--artifact','actualArchiveSHA256'), ('--observation','actualObservationSHA256')]:
    read(Path(command[command.index(option)+1]), neg[key])
negative_output = Path(command[command.index('--output')+1])
check('actual cancelled run was rejected for failed terminal audit before later optional inputs',
      neg['exitCode'] == 1 and b'ValueError: Actual terminal artifact audit did not pass' in stderr
      and b'verify_terminal' in stderr and b'passed_review' in stderr
      and not negative_output.exists() and not negative_output.with_name(negative_output.stem + '_KO.md').exists())
check('no artificial positive independent review was created',
      not Path(command[command.index('--independent-comparator-review')+1]).exists())

# These are source-review findings, not a replay of a mathematical checker.
# The source byte pin above fixes the exact implementation to which they refer.
findings = [
    ('All terminal acceptance checks precede result construction and exclusive output creation.', ['verify_terminal', 'passed_review', 'verify_scope', 'main']),
    ('The terminal audit must have the exact schema, PASS, N106Completed true, no postcheck exception, actual completed/success job, controller PASS and two integer zero exits.', ['verify_terminal']),
    ('The accepted terminal audit is bound to frozen auditor and run-binding hashes, exact run/job, final observation bytes and downloaded archive bytes.', ['verify_terminal']),
    ('The observed artifact must identify the bound run and source commit and match the actual API byte length and SHA-256.', ['verify_terminal']),
    ('The archived controller must pass, all 35 command stages must have completed with integer exit zero, and every audited member must have exact bytes.', ['verify_terminal']),
    ('The exact order, full guard argv, source/kernel/nanoda/Quot checks are required by the separately reviewed frozen auditor, not replaced by the writer count of 35.', ['verify_terminal', 'frozen verify_n106_terminal_artifact.py']),
    ('The separate independent Comparator review must pass with a nonempty all-true complete check record and the same run/job/archive.', ['passed_review', 'main']),
    ('All original acceptance/status/checklist references are verified from the frozen 69/1 record; the old README uses an exact-hash historical resolution only.', ['verify_historical_refs', 'main']),
    ('Only N1-06 is updated; each other gate row is required to be deeply identical, including its existing evidence references.', ['main']),
    ('Every one of the nine original criterion texts, detail texts and canonical criterion-record hashes is checked unchanged.', ['main']),
    ('The original 70 criterion IDs and 61/7/2 baseline are retained; 70 PASS is derived by applying the nine rows to that baseline.', ['main']),
    ('The fixed independent scope memo/map/review and same-profile source refs are mandatory before the leading-profile flag can be set.', ['verify_scope', 'main']),
    ('The flag meaning is explicit, entireNewProfileLeanFormalized remains false, and later full time-dependent NS/f=0/smooth t=1 claims are excluded.', ['main']),
    ('The writer refuses to overwrite dated output and checks the frozen assessment hash again before writing.', ['main']),
]
function_names = {n.name for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
for text, functions in findings:
    check('reviewed implementation: ' + text, all(n in function_names or n.startswith('frozen ') for n in functions),
          reviewType='HUMAN_SOURCE_REVIEW_BOUND_TO_EXACT_SHA256', functions=functions)

for path, record in inputs.items():
    check('input remained unchanged: ' + path, digest(Path(path).read_bytes()) == record['sha256'])
require_all = all(c['pass'] for c in checks)
if not require_all:
    save(OUT / 'failed-checks.json', (json.dumps([c for c in checks if not c['pass']], indent=2)+'\n').encode())
    raise SystemExit('Independent source review failed; see failed-checks.json')

report = '''# Independent source review: final assessment writer

The frozen `write_terminal_gate_assessment.py` with SHA-256
`d471135f614fb3ec9d18020c7744433eb4646ad7793ba720a7f127fe9eceb314`
has no blocking issue found in this read-only review. This is a preparation/source
review, not an actual Comparator result and not a new completion assessment.

The writer requires the actual successful bound job and controller, exact terminal
audit source and input binding, all 35 successful archived stages, exact archive and
member bytes, and a separate successful independent review of the same run, job and
archive. The fixed terminal auditor remains responsible for the full original
guard, stage-order, source/kernel/configuration/nanoda/type/axiom/Quot checks; the
writer's shorter checks do not replace or relax that auditor.

The old 69/1 JSON and original acceptance/status/checklist files remain pinned.
All 47 historical references resolve to their exact recorded bytes. Exactly one
uses the preserved earlier N1 README, independently compared here with the actual
read-only Git object at `88e7799d407ba6cf88aa90a1aceabc44fa61c8ca`, including the
Git blob hash. The current README and old assessment are unchanged.

The writer changes only the N1-06 row, requires deep equality of the other eight
rows, and verifies the original nine criterion texts and canonical record hashes.
It derives the prospective 70/0 count from the fixed original 61/7/2 baseline.
The explicit six-clause map, memo and independent scope receipt are mandatory,
with all 64 unique source references and the same parameter/profile/assembly/formal
identities checked. `entireNewProfileLeanFormalized=false` is retained.

The actual preparation record used the cancelled original run and exited 1 in
`verify_terminal` / `passed_review`, with `Actual terminal artifact audit did not
pass`. Its stdout/stderr and actual audit/archive/observation hashes were verified.
The output files and placeholder independent positive review do not exist. This
review did not rerun that control, did not use a simulated positive artifact, did
not invoke the final writer, and did not perform any Comparator or kernel run.

The future independent actual Comparator result must be a separate record with
`status=PASS` (or `FAIL_OR_INCOMPLETE`), the appropriate `N106Completed` boolean,
exact `archiveSHA256`, `runId`, `jobId`, and a complete `passed/total/checks` record.
This source review deliberately uses `PASS_SOURCE_REVIEW_ONLY`, so it cannot be
mistaken for that future terminal result by the writer.
'''
save(OUT / 'SOURCE_REVIEW.md', report.encode())
receipt = {
    'schema': 'MathScope.IndependentTerminalAssessmentSourceReview/1',
    'status': 'PASS_SOURCE_REVIEW_ONLY',
    'reviewedUTC': datetime.now(timezone.utc).isoformat(),
    'passed': sum(c['pass'] for c in checks), 'total': len(checks), 'checks': checks,
    'writerSHA256': writer_sha, 'reviewerSourceSHA256': digest(Path(__file__).read_bytes()),
    'sourceReviewReportSHA256': digest((OUT / 'SOURCE_REVIEW.md').read_bytes()),
    'actualPreparationReceiptSHA256': digest(prep_bytes),
    'historicalReferencesVerified': len(historical), 'historicalSnapshotAliases': 1,
    'scopeUniqueReferencesVerified': len(seen_scope),
    'newComparatorRuns': 0, 'newKernelRuns': 0, 'newAssessmentWriterInvocations': 0,
    'simulatedPositiveArtifactUsed': False, 'actualTerminalCompletionClaimed': False,
    'finalAssessmentIssued': False, 'existingEvidenceMutated': False,
    'sameFinalProfileBinding': common,
    'boundProspectiveProductionRun': {'runId': binding['runId'], 'jobId': binding['jobId'], 'commit': binding['mathscopeCommit']},
    'inputs': inputs,
    'snapshotSHA256': {p.name: digest(p.read_bytes()) for p in sorted((OUT / 'inputs').iterdir())},
}
save(OUT / 'source-review-receipt.json', (json.dumps(receipt, indent=2, ensure_ascii=False)+'\n').encode())
print(json.dumps({'status': receipt['status'], 'passed': receipt['passed'], 'total': receipt['total'],
                  'receiptSHA256': digest((OUT / 'source-review-receipt.json').read_bytes()),
                  'reportSHA256': receipt['sourceReviewReportSHA256']}, indent=2))
