#!/usr/bin/env python3
"""Collect completed axis follow-up receipts without executing Lean.

The execution environment and command are retained verbatim.  An import/type
audit is explicitly separate from a proof of the complete analytic producer.
This collector refuses incomplete/failed positive runs and a false negative
control that unexpectedly succeeds.  It never changes the original repository.
"""
from pathlib import Path
import datetime
import hashlib
import json
import re

HERE = Path(__file__).resolve().parent
M1 = HERE.parents[1]
OFFICIAL = M1 / 'navier' / 'official-validation'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(name):
    return json.loads((HERE / name).read_text())


def source_file(path, role, url=None):
    record = {'path': str(path.relative_to(M1)), 'role': role,
              'content': path.read_text(), 'sha256': digest(path)}
    if url:
        record['url'] = url
    return record


def verified_receipt(name):
    record = read_json(name)
    if 'exitCode' not in record or 'completedUTC' not in record:
        raise SystemExit(f'Run is not complete: {name}')
    if digest(HERE / record['log']) != record['logSHA256']:
        raise SystemExit(f'Log hash mismatch: {name}')
    return record


positive = verified_receipt('axis-lean-command.json')
negative = verified_receipt('axis-negative-command.json')
if positive['exitCode'] != 0:
    raise SystemExit('Positive audit did not exit zero; no passing audit emitted')
if negative['exitCode'] == 0:
    raise SystemExit('False scalar inequality unexpectedly accepted')
if digest(HERE / 'AxisBoundAudit.lean') != positive['sourceSHA256']:
    raise SystemExit('Current positive source differs from the checked source')
if digest(HERE / 'AxisBoundNegative.lean') != negative['sourceSHA256']:
    raise SystemExit('Current negative source differs from the checked source')

log = (HERE / positive['log']).read_text()
negative_log = (HERE / negative['log']).read_text()
if 'error:' in log or 'sorryAx' in log:
    raise SystemExit('Positive log contains an error or sorryAx')
if 'error:' not in negative_log or 'unsolved goals' not in negative_log or '⊢ False' not in negative_log:
    raise SystemExit('Negative did not fail with the expected Lean proof diagnostic')
if any(s in negative_log for s in ['synthInstanceFailed', 'Unknown identifier', 'sorry']):
    raise SystemExit('Negative failed to typecheck rather than rejecting the false scalar statement')

targets = []
allowed_axioms = {'propext', 'Classical.choice', 'Quot.sound'}
for name in read_json('axis-audit-targets.json'):
    start = re.search(r'^' + re.escape(name) + r'(?=[\s:.])', log, re.M)
    axioms_match = re.search(re.escape("'" + name + "' depends on axioms:") +
                             r'\s*\[([^\]]*)\]', log, re.S)
    if start is None or axioms_match is None or start.start() >= axioms_match.start():
        raise SystemExit(f'Missing printed type/axioms for {name}')
    axioms = [x.strip() for x in axioms_match.group(1).split(',') if x.strip()]
    if set(axioms) - allowed_axioms:
        raise SystemExit(f'Unexpected axioms for {name}: {axioms}')
    local = name.startswith('MathScope.')
    scope = ('KERNEL_CHECKED_FIXED_SCALAR_THEOREM' if local else
             'IMPORTED_ORIGINAL_THEOREM_TYPE_AND_AXIOM_AUDIT')
    note = ('This statement proves only its printed scalar inequality, not the entire '
            'analytic-input producer.' if local else
            'An original theorem is imported with its full hypotheses.  This audit '
            'does not instantiate all generated analytic premises.')
    if name.startswith('NavierStokes.NaturalAxisData.'):
        note += (' In particular SmallParameters requires h,j <= 1/1000.  The default '
                 'h=1/200,j=3/100 fixture does not instantiate that specialization; '
                 'the actual low-Z cutoff is certified independently by exact interval cover.')
    targets.append({'name': name, 'type': log[start.start():axioms_match.start()].strip(),
                    'axioms': axioms, 'status': 'PASS', 'scope': scope, 'note': note})

original = json.loads((OFFICIAL / 'official-audit-summary.json').read_text())
lake_manifest = json.loads((OFFICIAL / 'repo' / 'lake-manifest.json').read_text())
mathlib = next(p for p in lake_manifest['packages'] if p['name'] == 'mathlib')
repo_commit = original['sourceCommit']
source_files = [source_file(HERE / 'AxisBoundAudit.lean', 'checked scalar proofs and import audit'),
                source_file(HERE / 'AxisBoundNegative.lean', 'rejected false scalar proof')]
modules = sorted({t['name'].split('.')[1] for t in targets if t['name'].startswith('NavierStokes.')} |
                 {'NaturalAxisCoefficients', 'AxisWeightEstimates'})
source_pins = []
for module in modules:
    path = OFFICIAL / 'repo' / 'NavierStokes' / f'{module}.lean'
    frozen_copy = M1 / 'navier' / 'sources' / 'official-repo' / 'NavierStokes' / f'{module}.lean'
    if digest(path) != digest(frozen_copy):
        raise SystemExit(f'Original source and frozen source differ: {module}')
    url = f'https://github.com/openai/NavierStokesAndEuler/blob/{repo_commit}/NavierStokes/{module}.lean'
    source_files.append(source_file(frozen_copy, 'original imported module, unchanged', url))
    olean = OFFICIAL / 'repo' / '.lake' / 'build' / 'lib' / 'lean' / 'NavierStokes' / f'{module}.olean'
    source_pins.append({'module': f'NavierStokes.{module}', 'sourceSHA256': digest(path),
                        'sourceMatchesFrozenCopy': True, 'compiledModuleSHA256': digest(olean),
                        'sourceURL': url})

attempt = read_json('axis-lean-attempt1-command.json')
# The failed first attempt had one unsupported pretty-print option; its original
# source and log are retained.  It is not included in the passing target count.
attempt['log'] = 'axis-lean-attempt1.log'
if attempt['logSHA256'] != digest(HERE / attempt['log']):
    raise SystemExit('Preserved first-attempt log hash mismatch')
attempt['source'] = 'AxisBoundAudit.attempt1.lean'
attempt['sourceSHA256'] = digest(HERE / attempt['source'])
attempt['includedInPositiveCount'] = False
attempt['reason'] = 'Unknown option pp.width; only that display option was removed for the successful rerun.'
negative_attempt = read_json('axis-negative-attempt1-command.json')
negative_attempt['log'] = 'axis-negative-attempt1.log'
if negative_attempt['logSHA256'] != digest(HERE / negative_attempt['log']):
    raise SystemExit('Preserved first negative-attempt log hash mismatch')
negative_attempt['source'] = 'AxisBoundNegative.attempt1.lean'
negative_attempt['sourceSHA256'] = digest(HERE / negative_attempt['source'])
negative_attempt['includedInNegativeControlCount'] = False
negative_attempt['reason'] = ('The source lacked an explicit public real-number import and failed '
                              'instance synthesis. This is not a valid false-proposition control; '
                              'Mathlib.Data.Real.Basic was explicitly imported for the rerun.')

result = {
    'schema': 'MathScope.Navier.AxisLeanAudit/1',
    'recordedUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status': 'PASS',
    'summary': {'originalImportedTargets': 16, 'newScalarTargets': 4, 'positiveTargets': 20,
                'negativeControlsPassed': 1, 'newAnalyticProducerFullyKernelChecked': False,
                'combinedWithFrozen71OrOriginalCD2': False},
    'toolchain': {'version': original['toolchain'], 'kernelCommit': original['kernelCommit'],
                  'archiveSHA256': original['toolchainArchiveSHA256'],
                  'mathlibCommit': mathlib['rev'], 'repositoryCommit': repo_commit},
    'executionProfile': original['executionProfile'],
    'sourceFiles': source_files,
    'originalModulePins': source_pins,
    'targets': targets,
    'commands': [positive, negative],
    'negativeControls': [{'name': 'falseWholeIntervalMargin', 'source': 'AxisBoundNegative.lean',
                          'sourceSHA256': negative['sourceSHA256'], 'exitCode': negative['exitCode'],
                          'pass': True, 'expected': 'False reversed positivity inequality is rejected',
                          'log': negative['log'], 'logSHA256': negative['logSHA256'],
                          'diagnostic': negative_log}],
    'previousFailedAttempts': [attempt, negative_attempt],
    'proofBoundary': {'wholeAnalyticCertificateKernelChecked': False,
                      'existingFiniteJetEqualityProved': False,
                      'completedOuterPressureEqualityProved': False,
                      'globalWitnessProved': False,
                      'original70CriteriaChanged': False,
                      'description': 'Imported universal theorems retain their hypotheses.  The four '
                      'new Lean proofs concern exact scalar gates for a single fixture, plus one '
                      'scalar bound quantified over z.  The exact executable analytic producer is '
                      'tested separately; this receipt is not a complete Lean instantiation of it.'}
}
(HERE / 'axis-lean-audit.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')

# Adapter for the IDE's existing AUDITS schema.  Displaying it is a replay of
# recorded evidence, not a browser-side invocation of the Lean kernel.
source_index = {s['path']: s for s in source_files}
ui_targets = []
for target in targets:
    if target['name'].startswith('MathScope.'):
        path = 'navier/followup-construction/AxisBoundAudit.lean'
    else:
        path = 'navier/sources/official-repo/NavierStokes/' + target['name'].split('.')[1] + '.lean'
    ui_targets.append({**target, 'standardAxioms': target['axioms'], 'customAxioms': [],
                       'sourceFile': path, 'sourceSha256': source_index[path]['sha256']})
duration = (datetime.datetime.fromisoformat(positive['completedUTC']) -
            datetime.datetime.fromisoformat(positive['startedUTC'])).total_seconds()
profile = original['executionProfile']
ui = {
    'id': 'ns-axis-original-rc2',
    'label': 'Navier–Stokes Bρ / 원문 16개 타입 참조 + 새 스칼라 4개 (rc2)',
    'sourceFiles': [s for s in source_files if s['role'] != 'rejected false scalar proof'],
    'targets': ui_targets,
    'builds': [{'module': 'MathScope.FollowupAxis.AxisBoundAudit',
                'sourceFile': 'navier/followup-construction/AxisBoundAudit.lean',
                'sourceSha256': positive['sourceSHA256'], 'command': positive['command'],
                'cwd': positive['cwd'], 'exitCode': positive['exitCode'], 'seconds': duration,
                'logFile': 'navier/followup-construction/' + positive['log'],
                'log': log, 'logSha256': positive['logSHA256'],
                'originalDependencySourcesUnchanged': True,
                'analyticProducerFullyKernelChecked': False,
                'executionProfile': profile['kind']}],
    'environment': {'leanVersion': original['toolchain'], 'leanCommit': original['kernelCommit'],
                     'mathlibCommit': mathlib['rev'], 'repositoryCommit': repo_commit,
                     'mathlibManifestSha256': digest(OFFICIAL / 'repo' / 'lake-manifest.json'),
                     'driverSha256': profile['driverSHA256'],
                     'runtimeLibrarySha256': profile['officialSharedLibrarySHA256'],
                     'kernelModified': False, 'runtimeModified': False,
                     'verifierGuardModified': False, 'logicalOptionsReplaced': False,
                     'executionProfile': profile['kind'],
                     'vanillaCLIOutcome': profile['vanillaCLIOutcome']},
    'negativeControls': [{'name': 'falseWholeIntervalMargin',
                          'sourceFile': 'navier/followup-construction/AxisBoundNegative.lean',
                          'sourceSha256': negative['sourceSHA256'],
                          'sourceContent': (HERE / 'AxisBoundNegative.lean').read_text(),
                          'command': negative['command'],
                          'exitCode': negative['exitCode'], 'expectedRejected': True,
                          'rejected': True, 'logFile': 'navier/followup-construction/' + negative['log'],
                          'log': negative_log, 'logSha256': negative['logSHA256']}],
    'scope': ('원래 rc2에서 원문 exported 정리 16개의 전체 타입·공리와 새 스칼라 4개를 검사했다. '
              '원문 정리의 가정은 유지하며, 생성한 복소 해석·계수 norm 전제 전체의 Lean '
              '인스턴스화, 기존 finite η-jet 동일성, 완성된 outer pressure 또는 전역 witness를 증명한 기록이 아니다.'),
    'checkedAt': max(positive['completedUTC'], negative['completedUTC']),
    'originalAuditPath': 'navier/followup-construction/axis-lean-audit.json',
    'originalAuditSha256': digest(HERE / 'axis-lean-audit.json'),
    'originalModulePins': source_pins,
    'browserKernelRerun': False,
    'fullAnalyticPremiseKernelProof': False,
    'separateFromFrozen71AndOriginalCD2': True
}
(HERE / 'axis-pinned-audit.json').write_text(json.dumps(ui, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': result['status'], **result['summary'],
                  'output': str(HERE / 'axis-lean-audit.json'),
                  'ideOutput': str(HERE / 'axis-pinned-audit.json')}, indent=2))
