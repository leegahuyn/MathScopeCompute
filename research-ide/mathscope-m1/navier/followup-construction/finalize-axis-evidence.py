#!/usr/bin/env python3
"""Assemble only this submodule's completed evidence; no compute/proof rerun."""
from pathlib import Path
import datetime
import hashlib
import json
import re

HERE = Path(__file__).resolve().parent
M1 = HERE.parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path):
    return json.loads(path.read_text())


def dump(name, data):
    (HERE / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


now = datetime.datetime.now(datetime.timezone.utc).isoformat()
source_hash = sha(HERE / 'axis-certificates.mjs')
test_log = (HERE / 'axis-tests.tap').read_text()


def test_count(key):
    match = re.search(r'^(?:ℹ |# )' + key + r' (\d+)\s*$', test_log, re.M)
    if not match:
        raise SystemExit(f'Missing recorded Node test count: {key}')
    return int(match.group(1))


js_count = {k: test_count(k) for k in ['tests', 'pass', 'fail', 'cancelled', 'skipped']}
if js_count != {'tests': 27, 'pass': 27, 'fail': 0, 'cancelled': 0, 'skipped': 0}:
    raise SystemExit(f'Unexpected final Node test receipt: {js_count}')
independent = load(HERE / 'axis-independent-validation.json')
if independent['pass'] != independent['total'] or independent['source']['sha256'] != source_hash:
    raise SystemExit('Independent exact audit is incomplete or targets a different source')
lean = load(HERE / 'axis-lean-audit.json')
if lean['status'] != 'PASS' or lean['summary']['positiveTargets'] != 20:
    raise SystemExit('Original rc2/scalar audit is incomplete')

dump('axis-test-results.json', {
    'schema': 'MathScope.Navier.AxisTestResults/1', 'recordedUTC': now,
    'source': {'path': 'axis-certificates.mjs', 'sha256': source_hash},
    'node': {'command': 'node --test mathscope-m1/navier/followup-construction/axis-certificates.test.mjs',
             'exitCode': 0, **js_count, 'log': 'axis-tests.tap',
             'logFormat': 'Node human-readable test reporter',
             'logSHA256': sha(HERE / 'axis-tests.tap')},
    'independent': {'method': independent['method'], 'pass': independent['pass'],
                    'total': independent['total'], 'path': 'axis-independent-validation.json',
                    'sha256': sha(HERE / 'axis-independent-validation.json')},
    'lean': {'path': 'axis-lean-audit.json', 'sha256': sha(HERE / 'axis-lean-audit.json'),
             'originalImportedTargets': 16, 'newScalarTargets': 4,
             'negativeControlsPassed': 1, 'separateFromFrozen71AndOriginalCD2': True}
})

original = load(M1 / 'evidence' / 'original-acceptance.json')


def criteria_in(value):
    if isinstance(value, dict):
        if value.get('id') in {'N3-01', 'N3-03'}:
            yield value
        for item in value.values():
            yield from criteria_in(item)
    elif isinstance(value, list):
        for item in value:
            yield from criteria_in(item)


rows = []
for criterion in criteria_in(original):
    cid = criterion['id']
    rows.append({
        'id': cid, 'original': criterion, 'originalCriterionStatus': 'PARTIAL',
        'statusChangedFromFrozenV50': False,
        'completedLocalComponents': (
            ['정확한 rational pressure datum에서 전체 η 구간 low-Z margin·σ를 계산한다.',
             '다항식 perturbation/Cauchy 상계로 공통 복소 반경과 모든 η 도함수 norm을 계산한다.',
             '실제 Controlled B/L에서 Λ를 자동 선택하고 복소 phase bound에서 정확 log C를 선택한다.']
            if cid == 'N3-01' else
            ['원래 무한 계수 공간의 연산자·resolvent·모든 nonlinear remainder 항의 상계를 계산한다.',
             '반경 1 invariant ball, Lipschitz <1/2, 전 구간 Φ>1/4와 무한 radial/mixed tail를 인증한다.',
             '전체 η cover·급수·Lipschitz 전개를 다른 정확 알고리즘으로 검증하고 고정 스칼라 gate 4개를 Lean으로 검사한다.']),
        'remaining': (
            ['Md→Td→P*→λ→h 및 외부 witness에 의존하는 matching tolerance 등 원문 전체 선택 순서는 구현·인증되지 않았다.',
             'h=1/200,j0=3/100은 선언된 국소 datum이며 전역 충분히 작은 선택의 인증으로 사용하지 않는다.',
             'Tsh,Cpre,XR,transition widths,N과 해당 모든 선행 조건을 실제 pressure witness로 연결해야 한다.']
            if cid == 'N3-01' else
            ['완성된 원문 outer pressure와 이 rational datum의 동일성은 증명되지 않았다.',
             '기존 binary64 finite η-jet 계수와 유일한 무한 고정점의 계수별 동일성·rounding error는 연결되지 않았다.',
             '생성된 복소 해석 입력·norm producer 전체를 Lean의 CompatibleData 및 bridge 전제로 export한 증명은 없다.',
             '큰 Λ/log C의 정확 amplitude를 일반 float evaluator가 유지하지 못하므로 전역 witness로 승격하지 않는다.']),
        'evidence': ['axis-default-certificate.json', 'axis-independent-validation.json',
                     'axis-test-results.json', 'axis-lean-audit.json', 'N3_AXIS_FOLLOWUP.md']
    })
if len(rows) != 2:
    raise SystemExit('Original criterion lookup is not exactly N3-01/N3-03')
dump('axis-followup-status.json', {
    'schema': 'MathScope.Navier.AxisFollowupStatus/1', 'recordedUTC': now,
    'originalAcceptanceSHA256': sha(M1 / 'evidence' / 'original-acceptance.json'),
    'criteria': rows, 'boundCertificateStatus': 'VERIFIED_LOCAL_BOUND_CERTIFICATE',
    'scope': '명시적 rational pressure datum에 대한 실제 무한 Bρ 국소 상계. 원문 전체 pressure/witness 및 70개 판정의 완성으로 표시하지 않는다.'
})

owned = [
    'axis-certificates.mjs', 'axis-certificates.test.mjs', 'verify-axis-independent.py',
    'axis-tests.tap', 'axis-test-results.json', 'axis-independent-validation.json',
    'axis-default-certificate.json', 'AxisBoundAudit.lean', 'AxisBoundNegative.lean',
    'axis-audit-targets.json', 'axis-lean-audit.json', 'axis-pinned-audit.json', 'axis-lean-audit.log',
    'axis-lean-command.json', 'axis-negative.log', 'axis-negative-command.json',
    'AxisBoundAudit.attempt1.lean', 'axis-lean-attempt1.log', 'axis-lean-attempt1-command.json',
    'AxisBoundNegative.attempt1.lean', 'axis-negative-attempt1.log', 'axis-negative-attempt1-command.json',
    'collect-axis-audit.py', 'finalize-axis-evidence.py', 'axis-followup-status.json',
    'README_AXIS_CERTIFICATES.md', 'N3_AXIS_FOLLOWUP.md'
]
dump('axis-followup-manifest.json', {
    'schema': 'MathScope.Navier.AxisFollowupManifest/1', 'recordedUTC': now,
    'scope': 'Only files authored for the axis-certificate follow-up; sibling continuation/outer files are owned separately.',
    'files': [{'path': name, 'bytes': (HERE / name).stat().st_size, 'sha256': sha(HERE / name)} for name in owned],
    'originalV50FilesModifiedByThisFollowup': False,
    'api': {'module': 'axis-certificates.mjs', 'function': 'certifyAxis(input, budget)',
             'secondArgument': 'Direct existing makeBudget return object, not a wrapper or raw hooks',
             'exampleInput': 'axisExampleInput()', 'jobKind': 'ns.axis-certificate'}
})
print(json.dumps({'status': 'PASS', 'sourceSHA256': source_hash, 'node': '27/27',
                  'independent': f"{independent['pass']}/{independent['total']}",
                  'originalImportedTargets': 16, 'newScalarTargets': 4,
                  'negativeControlsPassed': 1, 'ownedFiles': len(owned)}, indent=2))
