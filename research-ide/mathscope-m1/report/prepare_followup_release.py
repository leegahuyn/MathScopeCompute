#!/usr/bin/env python3
"""Prepare documentary follow-up inputs from frozen v50 and actual receipts.

This does not deploy, run mathematics, change acceptance criteria, or create a
PDF. Final browser/CLI metadata must be supplied after the release is checked.
"""
import copy
import hashlib
import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
M1 = HERE.parent
ROOT = M1.parent
F = M1 / 'navier/followup-construction'


def read(path):
    return json.loads(path.read_text())


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def artifact(name):
    return 'mathscope-m1/navier/followup-construction/' + name


def suite(name, label, passed, scope):
    return {'label': label, 'pass': passed, 'total': passed,
            'artifact': artifact(name), 'scope': scope}


def record(status, implementation, validation, remaining, files, gate, boundary):
    return {'status': status, 'implementation': implementation,
            'validation': validation, 'remaining': remaining,
            'artifacts': files, 'mathGateStatus': gate, 'scopeBoundary': boundary}


def prepare():
    original = read(M1 / 'evidence/original-acceptance.json')
    original_bytes = (M1 / 'evidence/original-acceptance.json').read_bytes()
    release = read(HERE / 'history/v50-before-followup/evidence/release-report-data.json')
    native = read(HERE / 'history/v50-before-followup/navier/checklist-status.json')
    # This preparer reconstructs the pre-v53 review draft, not current release metadata.
    manifest = {'workerSha256': '92e74450879c2b9fdd9919cfb06f30d63d333bddcd134267870af7aa8e95ae2f',
                'bundleSha256': 'd7e45fb88a6d226e487ec0d635851c9790f57da8d505eb31755fc1f989af5296'}
    correction = read(F / 'ns-source-formula-correction.json')
    gluing_node = read(F / 'source-inner-gluing-tests.json')
    gluing_reference = read(F / 'source-inner-gluing-independent.json')
    build_snapshot_path = M1 / 'navier/followup-20261009-default-build-resume-1750/status-snapshot-1804.json'
    build_snapshot = read(build_snapshot_path)
    assert correction['status'] == 'CORRECTED_AND_REVALIDATED'
    assert gluing_node['failed'] == 0 and gluing_node['passed'] == gluing_node['total']
    assert gluing_reference['counts'] == {'passed': 691, 'failed': 0, 'total': 691}
    assert build_snapshot['status'] == 'RUNNING' and not build_snapshot['resultReceiptExists']

    updates = {}
    updates['N1-05'] = record('PARTIAL', [
        '원래 rc2 commit·manifest·공식 커널을 고정했다. 원래 cache body 8,747/8,747 요청과 C/D 선택 build 9,371 jobs는 각각 종료 0이다. 전체 defaultTargets의 후속 build는 같은 원문 소스·커널로 재개했다.',
        '16:36 UTC의 전체 build가 연결 오류 뒤 사라져 17:50에 관찰했다. 마지막 자원 기록은 17:45:05이며 실제 종료 코드·원인은 알려지지 않았다. 이를 컴파일 오류나 성공으로 처리하지 않고, 17:50:28 UTC부터 같은 default 명령을 한 번 재개했다.'
    ], [
        'C/D 선택 build의 완료는 2026-10-09 16:05:12 UTC, 별도 exported 타입·공리 조회는 16:06:24 UTC이다. 원문 proof source·manifest·커널은 변경하지 않았다.',
        '재개한 build의 18:02:51 UTC 관찰에서 NS .olean 791/817, Euler 118/1840, ComparatorChallenges 2/2였다. 프로세스와 PID namespace를 대조했으며 lake build 하나가 진행 중이다. 이 겹치는 산출물 재고는 완료율이나 전체 build 성공이 아니다.'
    ], [
        '원래 defaultTargets(NavierStokes, Euler, ComparatorChallenges) 전체의 종료 0과 최종 로그·환경 receipt가 필요하다. 현재 후속 실행은 RUNNING이며 종료 코드는 미확보이다.',
        '표준 배포 CLI의 설치 경로 자동 탐지 실패는 별도 환경 기록으로 유지한다. 성공 기록은 공식 rc2 커널과 명시 설치 경로 entry를 사용한 실행 프로파일이다.'
    ], ['sources.lock.json', 'official-validation/official-audit-summary.json',
        'official-validation/full-pinned-command-results.json',
        'followup-20261009-default-build/interruption-observation-1750.json',
        'followup-20261009-default-build-resume-1750/current-stage.json',
        'followup-20261009-default-build-resume-1750/status-snapshot-1804.json'],
        'PENDING_ORIGINAL_WHOLE_DEFAULT_BUILD',
        '종료 -15였던 최초 C/D 우선 전환, 이후 연결 오류로 종료 원인을 모르는 실행, 현재 재개 실행을 각각 보존한다. NS 선택 target의 성공이나 파일 존재만으로 전체 성공을 판정하지 않는다.')

    # Keep the actual completed C/D declaration audit and guarded failure.
    updates['N1-06'] = copy.deepcopy(release['overrides']['N1-06'])
    updates['N1-06']['implementation'].append('후속 rc2 축 감사는 원문 타입·공리 참조 16개와 새 스칼라 4개를 별도로 검사했으며, 독립 Comparator 결과로 대신하지 않는다.')
    updates['N1-06']['artifacts'].append('followup-construction/axis-pinned-audit.json')

    updates['N3-01'] = record('PARTIAL', [
        '(A.6)/(B.40)의 선택 순서를 보존한다. 명시적 유리함수 압력 및 실제 A.21 목표 압력에서 low-Z 분리, 공통 복소 tube, Bρ 계수 상계, self-map·수축·양성에 필요한 Λ와 log C를 정확 유리수 계산으로 선택한다.',
        'A.21 producer는 log P*>Td와 h<exp(-Td)의 필요한 조건을 PROVED/DISPROVED/UNDECIDED로 따로 판정한다. source-axis 소비자는 같은 정확 h를 요구한다.'
    ], [
        '유리함수 축: Node 27/27, 독립 Fraction/Bernstein 131/131. A.21 압력: Node 70/70, 독립 정확·120자리 비교 306/306. A.21 축: Node 34/34, 독립 82/82 및 음성 대조 4/4.',
        '원래 rc2에서 원문 exported 정리 16개의 타입·공리, 기본 유리함수 fixture에 대한 새 스칼라 4개와 거짓 부등식 거부를 기록했다. 이 감사는 모든 생성 해석 전제의 Lean 인스턴스화가 아니다.'
    ], [
        '같은 최종 원문 프로파일에서 Md,Td,P*,λ,h,j0,Tsh,C,XR,전이폭,N의 모든 충분히 작다/크다 요구를 동시에 정량화해야 한다.',
        'B.34/B.8 수치 기본값 log P*=0은 원문의 큰 진폭 조건을 만족하지 않는다. log P*=14 가지는 현재 유한 축 근사의 양성 실패로 거부되며, 무한 축 존재 정리의 반증으로 해석하지 않는다.'
    ], ['followup-construction/axis-default-certificate.json', 'followup-construction/pressure-analytic-fixture.json',
        'followup-construction/axis-source-default-certificate.json', 'followup-construction/axis-pinned-audit.json',
        'followup-construction/source-inner-gluing-contract.json'],
        'LOCAL_CONSTANTS_CERTIFIED_GLOBAL_HIERARCHY_PENDING',
        '국소 인증의 실제 선택 상수와 전역 B.33/B.40 계층은 별도다. 미충족 원문 조건을 UI 예시 값으로 대체하지 않는다.')

    updates['N3-02'] = record('PARTIAL', [
        '별도 source-outer 작업에서 A.5–A.13 radial schedule과 terminal QODE, A.15 M/J 보정, A.11 angular 두 bump, A.19 Amp, A.21 압력의 두 무한 끝, A.7 heat 세 bump 보상을 실제로 계산했다. 큰 반지름과 작은 모멘트는 SIGNED_LOG로 보존한다.',
        'A.21 목표 압력은 양의 측도 혼합식으로 정의하고 전체 질량·실수 압력/도함수·공통 복소 tube·모든 차수 Cauchy/Bρ 상계를 정확 유리수 포위로 계산한다. 작은 혼합 꼬리는 0으로 지우지 않는다.'
    ], [
        'source-outer Node 40/40, 독립 70자리 Gauss 기준 71/71. M/J 독립 적분의 최대 상대 차이는 3.4566e-9로 원래 2e-8 허용값을 통과했다.',
        '압력 producer Node 70/70, 독립 Fraction/120자리 306/306. 지수 Taylor 나머지, 양의 무한 꼬리, principal Log 및 적분 아래 미분의 우세 조건을 보존했다.'
    ], [
        '수치 보정된 외곽 E의 실제 압력이 해석적으로 정의한 A.21 목표 압력과 정확히 같다는 결속이 필요하다.',
        '모든 η에서 E>0, 다섯 모멘트 등식, heat 보상과 예약 patch의 동시 성질을 인증해야 한다. 현재 유한 η 비교와 수치 적분은 이 전 구간 등식을 대신하지 않는다.'
    ], ['followup-construction/outer.mjs', 'followup-construction/outer-validation.json',
        'followup-construction/outer-independent-reference.json', 'followup-construction/pressure-analytic-fixture.json',
        'followup-construction/pressure-analytic-independent.json'],
        'SOURCE_OUTER_COMPUTED_UNIFORM_REPAIRED_PRESSURE_IDENTITY_PENDING',
        'A.7/A.11/A.15/A.19/A.21 연산은 구현됐으며 과거의 미구현 설명은 더 이상 현재 상태가 아니다. 수치 보정 성분과 완성된 전역 source datum의 인증을 구별한다.')

    updates['N3-03'] = record('PARTIAL', [
        'B.12–B.15 유한 비선형 η-jet 재귀와 별도로, 명시 유리함수 압력 및 실제 A.21 목표 압력의 무한 계수 공간에 대해 공통 복소 Ω, invariant ball, 수축 상계 <1, Φ>1/4, radial/mixed 무한 tail 상계를 계산했다.',
        'source-axis는 압력 producer의 정확 h와 축 h를 결속한다. 숫자 1e-8의 정확 binary64 유리수와 문자열 1/100000000을 같은 입력으로 취급하지 않는다.'
    ], [
        '유리함수 기본 fixture의 self-map 상계 1/400, Φ 오차 ≤1/318 및 Φ 하계 >1/4를 정확 계산했다. f0와 전 구간 cubic 비교, derivative bound를 별도 검사했다.',
        '유리함수 27/27+독립 131/131, A.21 연결 34/34+독립 82/82 및 음성 대조 4/4를 통과했다. 새 스칼라 Lean 4개는 유리함수 기본 fixture 범위이며 A.21 입력으로 자동 이전하지 않는다.'
    ], [
        '같은 무한 고정점과 기존 유한 η-jet 배열의 계수 동일성·유한 차수 및 반올림 오차를 결속해야 한다.',
        'A.21 목표 압력과 실제 보정된 외곽 장의 압력 동일성, 생성된 전체 해석 전제의 Lean 인스턴스화 및 최종 접합 프로파일과의 공통 매개변수 연결이 남아 있다.'
    ], ['axis-series.mjs', 'followup-construction/axis-default-certificate.json',
        'followup-construction/axis-source-default-certificate.json', 'followup-construction/axis-source-validation-manifest.json',
        'followup-construction/axis-pinned-audit.json'],
        'LOCAL_INFINITE_AXIS_BOUNDS_CERTIFIED_FINITE_JET_BINDING_PENDING',
        '국소 Bρ·수축·양성·tail 상계는 이제 계산된 인증 범위다. 이 성과를 되돌려 미인증이라고 쓰지 않되, 기존 float 배열이나 완성된 source witness 전체를 인증했다고 표시하지 않는다.')

    updates['N3-04'] = record('PARTIAL', [
        '유한 비선형 축에서 Π primitive, V0 적분 평균, Cartesian regular factor를 복원하고 기존 solenoidal cancellation의 Lean 성분 검사를 유지한다.',
        '실제 B.22/B.26 연장에서 다섯 누적 모멘트와 압력·도함수·a,b_s를 계산한다. Ns의 −WU 항은 원문 (4.16)/(B.35)에 따라 1/X 분수 밖에 두도록 교정했다.'
    ], [
        '기존 Cartesian FD 발산≈4.34e-11 및 source jet/물리 FD 비교는 그 유한 fixture의 범위다.',
        '교정된 B.26/C.1 회귀 109/109와 독립 원문 Ns 대조 243/243를 통과했다. 독립 대조의 최대 절댓값 차이는 2.8422e-14이다. 수정 전 같은 243개 대조가 모두 실패한 기록도 보존했다.'
    ], [
        '유한 재귀가 같은 무한 exact profile을 근사한다는 계수·미분·반올림 오차의 결속과 leading tangential residual의 정확한 0 항등식이 필요하다.',
        '전체 NS 잔차에는 axial viscosity 등이 포함되므로 leading 식만으로 전체 잔차 0이나 유한시간 폭발 해를 선언할 수 없다.'
    ], ['axis-series.mjs', 'checks.mjs', 'followup-construction/controlled-continuation.mjs',
        'followup-construction/continuation-source-formula-independent.json', 'followup-construction/ns-source-formula-correction.json'],
        'FINITE_CORE_AND_SOURCE_CONTINUATION_COMPUTED',
        '원문 전사 오류는 실제 구현 오류로 교정했다. 유한 잔차 비교의 통과와 무한 원문 해의 형식 증명은 별도다.')

    updates['N3-05'] = record('BLOCKED', [
        '교정된 B.26의 실제 종점에서 B.34 로그 전이, B.38 scale, G_i→4η 복원, 다섯 실제 누적 모멘트 debt를 계산한다. 외부에서 임의 종점·debt를 주입하는 입력은 거부한다.',
        '원문 B.8/A.3의 2개 U bump·3개 E bump, 전체 선형·이차 모멘트 지도와 5×5 Jacobian을 구성하고 감쇠 Newton 및 별도 192점 재적분을 실행한다. X_R≈exp(804.70048)는 SIGNED_LOG로 보존한다.'
    ], [
        f'신규 gluing Node {gluing_node["passed"]}/{gluing_node["total"]}, 독립 90자리 691/691. 실제 종점 정규화·B.34·누적 debt·이차 지도·raw Jacobian·재적분 잔차를 다른 계산으로 대조했다.',
        '초기 Gauss32 fixture의 독립 검사 616개 중 130개 실패를 보존하고 128/192점 규칙으로 교정했다. 큰 j0 후보의 실제 Newton/cone 실패와 log P*=14 유한 축 양성 실패도 보존한다.'
    ], [
        '연속 모멘트 적분의 엄밀한 enclosure, 같은 전체 η 영역에서의 interval Newton/implicit-function 포함 조건과 Jacobian 가역성의 균일 인증이 남아 있다.',
        'B.33/B.40 매개변수 선택의 동시 정량화와 유한 축·무한 source 축의 결속이 필요하다. 기본 log P*=0은 원문 큰 진폭 조건을 만족하지 않는다.'
    ], ['followup-construction/source-inner-gluing.mjs', 'followup-construction/source-inner-gluing-contract.json',
        'followup-construction/source-inner-gluing-tests.json', 'followup-construction/source-inner-gluing-independent.json',
        'followup-construction/source-inner-gluing-history.json'],
        'BLOCKED_UNIFORM_INTERVAL_NEWTON_INCLUSION',
        '실제 B.34/B.8 수치 연산은 구현됐다. 원문 수용기준은 수치 근 하나보다 강한 균일 interval-Newton 조건이므로 BLOCKED를 유지하며 기준 문구를 축소하지 않는다.')

    updates['N3-06'] = record('BLOCKED', [
        '실제 C.1의 exponential tilt·분산 조건·재매개화·평균 0인 C.11 원시함수를 구현했다. C.12를 명시적 양의 annulus 가족에 적용하고, 실제 발생한 다섯 모멘트 오차를 첫 patch의 비선형 2U/3E 지도에서 복원한다.',
        '값 변화 O(1/N)와 radial derivative의 order-one 변화를 별도로 측정한다. 좁은 cutoff를 찾아 적분·진단 격자를 나누며 Ns의 −WU 스케일을 원문대로 교정했다.'
    ], [
        'C.1 독립 160자리 39/39, C.12 실행 57/57, 독립 Fraction 원문 식 1,135/1,135, 80자리 보정 지도 74/74를 통과했다.',
        'N=512에서는 변조 4,294/4,294·복원 patch 65/65 표본의 네 cone gap이 양수다. N=256은 좁은 cutoff 표본 2개가 실패하며 N=8도 실제 위반을 반환한다. 실패를 표본 범위에서 숨기지 않는다.'
    ], [
        '같은 완성 B.34/B.8 프로파일을 C.12 입력으로 연결하고 모든 (X,η)에서 strict cone κ>0을 구간 전체로 인증해야 한다.',
        '유한 N의 연속 도함수·적분 오차 포위, 첫 patch 복원의 균일 interval-Newton 및 모든 η 조건은 미인증이다. 명시 annulus 예제는 정칙 Cartesian 축을 제공하지 않는다.'
    ], ['followup-construction/admissible-loop.mjs', 'followup-construction/source-radial-modulation.mjs',
        'followup-construction/source-radial-modulation-contract.json', 'followup-construction/c12-source-formula-independent.json',
        'followup-construction/source-correction-independent.json'],
        'BLOCKED_WHOLE_PROFILE_STRICT_CONE',
        '고정 상태의 모든 위상에 대한 loop 상계와 전체 공간·η 프로파일의 균일 κ는 다르다. 표본 통과를 연속 영역 인증으로 승격하지 않는다.')

    updates['N3-07'] = record('PARTIAL', [
        'outer schedule과 보정에서 네 예약 patch의 위치를 보존하고 source flat cutoff·endpoint 연산을 제공한다. B.26/B.34 및 C.12의 지지 위치·도함수·유한 cone 진단을 같은 성분 결과에 기록한다.',
        'edge의 0/0 stress normalization을 직접 계산하는 입력을 거부하며, 큰 반지름·작은 비영 성분은 SIGNED_LOG 또는 정확 유리수로 보존한다.'
    ], [
        'outer 40/40+독립 71/71, C.12 57/57+독립 1,135/1,135, B.34/B.8 독립 691/691에서 지원·보정 지점과 실제 수치 성분을 확인했다.',
        '과거 finite support 검사 및 잘못된 stress normalization 거부를 유지한다. 이 검사들은 최종 전역 응력의 존재를 대신하지 않는다.'
    ], [
        '같은 최종 장에서 T0의 annulus support·내부 비영성·flat factorization, n=T0/|T0|의 edge limit을 인증해야 한다.',
        'Ipos/Imean 예약 patch의 unmodified power law와 모든 보정 뒤 불변성, inner/outer flatness를 그 동일한 완성 프로파일에 연결해야 한다.'
    ], ['radial.mjs', 'followup-construction/outer.mjs', 'followup-construction/source-inner-gluing-contract.json',
        'followup-construction/source-radial-modulation-contract.json'],
        'BLOCKED_ACTUAL_GLOBAL_STRESS_EDGE_LIMIT',
        '유한 성분의 지지·끝점 처리와 실제 전역 stress T0의 지지·edge limit 증명은 구분한다.')

    for item in native['items']:
        if item['id'] in updates:
            patch = updates[item['id']]
            item.update({k: copy.deepcopy(v) for k, v in patch.items() if k not in {'remaining'}})
            item['blockedConditions'] = copy.deepcopy(patch['remaining'])
            item['evidence'] = ' '.join(patch['implementation'])
            item['implementationStatus'] = 'PARTIAL_SOURCE_IMPLEMENTATION'
    old = read(HERE / 'history/v50-before-followup/navier/checklist-status.json')
    for before, after in zip(old['items'], native['items']):
        for key in ['id', 'title', 'originalDetail', 'originalAcceptance']:
            assert before[key] == after[key], (after['id'], key)
    assert Counter(x['status'] for x in native['items']) == {'PASS': 15, 'PARTIAL': 7, 'BLOCKED': 2}
    native['reportingRule'] = '원문 24개 기준은 15 PASS / 7 PARTIAL / 2 BLOCKED다. 실제 source 연산과 정확 국소 상계를 구현했어도 무한 축·전역 매개변수·균일 접합/cone/stress의 결속이 없으면 full certified profile로 승격하지 않는다.'
    native['followupConstruction'] = {
        'families': 8, 'newGlobalWitness': False,
        'sourceFormulaCorrection': 'followup-construction/ns-source-formula-correction.json',
        'newSourceInnerGluing': 'followup-construction/source-inner-gluing-contract.json',
        'currentOriginalBuild': {'status': 'RUNNING', 'wholeDefaultBuildPassed': False,
                                 'snapshot': 'followup-20261009-default-build-resume-1750/status-snapshot-1804.json'},
    }
    native['formalValidation']['additionalAxisPinnedRc2Audit'] = {
        'originalImportedTargets': 16, 'newScalarTargets': 4, 'negativeControlsRejected': 1,
        'auditFile': 'followup-construction/axis-pinned-audit.json',
        'fullGeneratedAnalyticPremiseProof': False, 'sourceAxisDefaultScalarReceiptTransferred': False,
    }
    native['formalValidation']['defaultBuildFollowup'] = native['followupConstruction']['currentOriginalBuild']
    for item in native['crossCutting']:
        if item['id'] == 'I1-03':
            item['evidence'] += ' Exact rational bounds for the rational/source A21 pressure and infinite-axis coefficient norms are now separately computed; finite binary64 jets remain unbound. Source h is compared as the exact supplied rational value.'
            item['artifacts'] += ['followup-construction/pressure-analytic-fixture.json', 'followup-construction/axis-source-default-certificate.json']
        elif item['id'] == 'I1-07':
            item['evidence'] += ' Follow-up independent checks include Fraction/Bernstein, high-precision Bessel and separate quadratures, and an original Ns formula reconstruction which detected and corrected the historical -WU/X transcription.'
            item['artifacts'] += ['followup-construction/ns-source-formula-correction.json', 'followup-construction/source-inner-gluing-independent.json']
        elif item['id'] == 'I3-04':
            item['evidence'] += ' 후속 원문 exported 참조 16개와 새 스칼라 4개의 rc2 감사는 네 번째 pinned audit에 있으며 생성된 A21 전제나 전체 프로파일로 자동 이전하지 않는다.'
            item['artifacts'].append('followup-construction/axis-pinned-audit.json')

    # v50 is retained as history, never relabelled as a new release's test.
    release['historicalReleases'] = [{'version': 'v50', 'buildId': 'fe509729',
        'scope': copy.deepcopy(release['scope']), 'tests': copy.deepcopy(release['tests']),
        'input': 'report/history/v50-before-followup/evidence/release-report-data.json'}]
    release['tests'].pop('browserFinal', None)
    release['tests'].pop('cliFinal', None)
    release['tests']['core'] = {'pass': 19, 'total': 19,
        'artifact': 'mathscope-m1/evidence/core-tests-corrected-followup.tap', 'executionVersion': 'v52',
        'scope': 'Corrected 58-example source; the later inner-gluing release is checked separately.'}
    release['release'].update({
        'date': '2026-10-10', 'dateTimezone': 'Asia/Seoul', 'version': 'v52', 'buildId': 'c26312f0',
        'workerSha256': manifest['workerSha256'], 'bundleSha256': manifest['bundleSha256'],
        'status': 'PREPARED_PENDING_FINAL_LIVE_CHECKS',
        'lastObservedLiveVersion': 52, 'lastObservedLiveBuildId': 'c26312f0',
    })
    release['scope'].update({'runnableExamples': 58, 'preparedAdditionalExamples': 1,
        'pinnedAuditPackages': 4, 'followupOriginalImportedTargets': 16,
        'followupNewScalarTargets': 4, 'followupNegativeLeanControlsRejected': 1,
        'fullCertifiedNavierProfile': False})
    release['finalValidationPending'] = ['source-inner-gluing의 실제 Worker/브라우저 배포와 현재 예제 수',
                                        '최종 배포의 새 CLI·브라우저 smoke 및 소스/결과 해시',
                                        '진행 중 원래 default build의 최종 상태']
    release['overrides'].update(updates)
    release['overrides'].setdefault('I3-02', {})['reportDisplay'] = {
        'implementation': '초기 산술 31·게이지 27·NS 13의 로컬 Lean 71개와 별도 원래 rc2 C/D 제출 정리 2개를 보존했다. 후속 원문 exported 타입·공리 참조 16개와 새 스칼라 4개를 네 번째 pinned audit로 추가했다. 각 소스·type·axioms·명령·exit·log·hash 및 서로 다른 적용 범위를 기록한다.',
        'validation': '초기 로컬 거짓 명제 9개와 후속 정확 스칼라의 거짓 부등식 1개를 실제 커널이 거부했다. 총 네 감사 묶음의 소스 일치를 확인한다. 원문 참조 16개를 새로 증명한 정리 수로 세지 않고, 편집한 소스는 STALE·kernelRerun=false다.'}
    release['overrides'].setdefault('I3-04', {})['reportDisplay'] = {
        'implementation': 'S01/S02·trace·BSD rank0/1·YM·NS 참조의 가정과 결론을 유지한다. 실제 import와 커널 감사는 정확 source/type에만 연결한다. 초기 로컬 71개, 원문 C/D 2개, 후속 원문 참조 16개·스칼라 4개를 분리한다. A21의 생성된 해석 전제 전체를 새 Lean 증명으로 승격하지 않는다.',
        'validation': '외부 문헌 20개·adapter/analytic-shape guard 47개 및 네 pinned 감사 묶음의 기록을 연결한다. BSD는 Kolyvagin(1990) §1 Theorem 1과 Wiles p.4에 연결하며 leanImport/kernelReceipt=null이다. 원문 타입의 가정과 실제 numerical witness 사이의 결속은 별도로 남는다.'}
    release['overrides'].setdefault('I1-03', {})['reportDisplay'] = {
        'implementation': '정확 정수·유한환·p-adic 자리 손실과 binary64 수치 오차를 분리한다. 후속 압력·축 producer는 BigInt 유리수 및 방향 반올림 지수 포위로 무한 tail·공통 복소 영역·Bρ 상계를 계산한다. 큰 반지름과 작은 비영 모멘트는 SIGNED_LOG로 보존하며 Newton 좌표 underflow는 PRECISION_REQUIRED로 반환한다.',
        'validation': '기존 p-adic/heat 정밀도 guard와 새 exact-h 결속·64/128/256비트 producer·256비트 내부 bound 경로를 검사했다. 사용자가 norm·tail·인증 flag를 주입하거나, 근사 float를 정확 입력처럼 바꾸거나, 예산/취소/표현 범위 실패를 COMPLETED로 바꾸지 못한다.'}

    release['tests']['followup'] = {
        'axisNode': suite('axis-test-results.json', '유리함수 축 실행', 27, '유한 실행·거부 검사'),
        'axisExact': suite('axis-independent-validation.json', '유리함수 축 독립 유리수', 131, 'Fraction/Bernstein/무한 급수 상계'),
        'outerNode': suite('outer-validation.json', '원문 외곽 실행', 40, '유한 η source 연산'),
        'outerIndependent': suite('outer-independent-reference.json', '외곽 독립 70자리', 71, '별도 Gauss 적분; 전체 η 인증 아님'),
        'pressureNode': suite('pressure-analytic-validation.json', 'A.21 압력 실행', 70, '정확 상계·입력·취소·정밀도 검사'),
        'pressureIndependent': suite('pressure-analytic-independent.json', 'A.21 압력 독립', 306, 'Fraction 및 120자리 대조; 생성 전제의 Lean 증명 아님'),
        'sourceAxisNode': suite('axis-source-test-results.json', 'A.21 축 연결 실행', 34, '정확 h·pressure 연결·거부 검사'),
        'sourceAxisIndependent': suite('axis-source-independent-validation.json', 'A.21 축 독립', 82, '별도 음성 대조 4/4 포함 범위를 원장에 구분'),
        'continuationLoop': suite('continuation-loop-tests.json', '교정 B.26·C.1 회귀', 109, '원문 Ns 교정 뒤 실행'),
        'continuationOriginal': suite('continuation-source-formula-independent.json', '교정 B.26 원문 식 대조', 243, '저장 유한 표본에서 독립 Ns 재구성'),
        'loopIndependent': suite('independent-loop-reference.json', 'C.1 독립 160자리', 39, 'Bessel 및 별도 각도 적분'),
        'c12Node': suite('source-radial-modulation-tests.json', '교정 C.12 실행', 57, '실제 cone 실패 및 예산 거부 보존'),
        'c12Original': suite('c12-source-formula-independent.json', 'C.12 원문 식 Fraction', 1135, '유한 저장 수의 exact algebra; 연속 영역 인증 아님'),
        'c12Moments': suite('source-correction-independent.json', 'C.12 보정 지도 80자리', 74, '실제 이차 보정 및 η 미분; 균일 Newton 아님'),
        'innerGluingNode': suite('source-inner-gluing-tests.json', 'B.34/B.8 접합 실행', gluing_node['passed'], '실제 source 종점·debt·거부·replay'),
        'innerGluingIndependent': suite('source-inner-gluing-independent.json', 'B.34/B.8 독립 90자리', 691, '실제 종점·누적 모멘트·이차 지도·Jacobian·재적분'),
        'integrationCorrectedV52': {'label': 'v52 교정 통합 Worker', 'pass': 16, 'total': 16,
            'artifact': 'mathscope-m1/evidence/followup-integration-corrected.tap',
            'scope': '당시 58개 source의 로컬/Worker 동일성·M0 저장·replay·거부; 새 gluing 통합 전 기록'},
    }

    def module(id_, title, kind, status, ids, impl, checks, scope, remaining, files, formula=(), usage=(), commands=()):
        return {'id': id_, 'title': title, 'kind': kind, 'status': status,
                'originalAcceptanceIds': ids, 'implementation': impl, 'validation': checks,
                'scope': scope, 'remaining': remaining, 'artifacts': [artifact(x) for x in files],
                'formulas': list(formula), 'usage': list(usage), 'commands': list(commands)}

    release['followupConstruction'] = {
        'title': 'NS 실제 원문 구성: 8개 성분과 정확 국소 상계',
        'summary': [
            '후속 구현은 유리함수 축, source outer, B.26 controlled continuation, C.1 loop, A.21 압력 인증, A.21 축 인증, C.12 변조·복원, B.34/B.8 실제 접합의 여덟 가족이다. 계산한 성분마다 원문식·정밀도·출처·입력·결과·잔여 관문을 함께 반환한다.',
            '정확 국소 상계와 유한 source 수치 연산을 서로 다른 등급으로 유지한다. 원문 70개 판정은 61 PASS / 7 PARTIAL / 2 BLOCKED이며, 전역 NS witness·균일 interval Newton·전체 cone/stress가 새로 증명되었다고 표시하지 않는다.',
        ],
        'leanAudit': {'originalImportedTargets': 16, 'newScalarTargets': 4, 'negativeControlsPassed': 1,
            'artifact': artifact('axis-pinned-audit.json'),
            'scope': '원래 rc2의 정확 exported 타입·공리 참조 16개와 유리함수 기본 fixture의 새 스칼라 4개. 모두 표준 [propext, Classical.choice, Quot.sound]. A.21 생성 전제·유한 η-jet·보정된 E의 동일성·전역 witness는 이 감사에 포함되지 않는다.'},
        'notes': [
            '실제 교정: B.26/C.12에서 −WU를 잘못 X로 나누던 원문 전사를 고쳤다. 수정 전 109/109 회귀 및 53/53 C.12 검사는 이 항을 독립 대조하지 못했다. 과거 데이터의 새 원문 대조 243개는 모두 실패했고 최대 차이는 67.01080019였다. 교정 뒤 243/243의 최대 차이는 2.8422e-14이다.',
            '이전 소스·fixture·검사와 실패 기록은 history/ns-wu-scaling-v1/에 보존된다. 현재 Worker는 이 과거 소스를 import하지 않는다. 새 원문 Fraction 대조 1,135개와 80자리 보정 74개는 서로 다른 범위를 확인한다.',
            'B.34/B.8의 Gauss32 초기 결과는 독립 616개 중 130개에서 실패했다. 원래 허용값을 유지하며 128/192점 규칙과 계산 debt를 별도로 재검사했다. 큰 j0 및 log P*=14의 실패도 기록하며 성공만 선별하지 않는다.',
        ],
        'modules': [
            module('axis-rational', '1. 명시 유리함수 압력의 Bρ 축 인증', 'ns.axis-certificate',
                'VERIFIED_LOCAL_BOUND_CERTIFICATE', ['N3-01', 'N3-03'],
                ['P(η)=−K/(1+η²)²에서 전체 η의 low-Z 분리, 공통 복소 tube, Cauchy 계수 노름과 원문 controlled remainder의 모든 항을 정확 상계한다.',
                 '무한 resolvent 급수의 양의 prefix·tail, 수축·self-map·양성용 Λ/log C 및 radial/mixed tail를 계산한다. 표시 float는 증명 입력에 쓰지 않는다.'],
                ['Node 27/27, 독립 Fraction/Bernstein 131/131.', '기본 self-map 1/400, Φ 오차 1/318, 전 구간 Φ>1/4. 별도 rc2 스칼라 4개와 거짓 부등식 대조.'],
                ['정확한 국소 해석 상계 및 원문 정리 참조. 기본 h=1/200,j0=3/100은 더 좁은 SmallParameters 특수화의 인스턴스가 아니며 일반 Controlled/CompatibleData 경로의 별도 상계를 사용한다.'],
                updates['N3-03']['remaining'],
                ['axis-default-certificate.json', 'axis-test-results.json', 'axis-independent-validation.json', 'axis-pinned-audit.json'],
                [r'P(\eta)=-\frac{K}{(1+\eta^2)^2}', r'\|\Phi-\Phi_0\|\leq\frac{1}{318},\qquad\Phi>\frac{1}{4}'],
                ['예제 ns-axis-exact-bounds. 정확 유리수 원자료와 certificateScope를 확인한다.'],
                ['node --test mathscope-m1/navier/followup-construction/axis-certificates.test.mjs',
                 'python -B mathscope-m1/navier/followup-construction/verify-axis-independent.py']),
            module('source-outer', '2. 실제 Appendix A 외곽과 보상', 'ns.source-outer',
                'SOURCE_OUTER_CONSTRUCTION_COMPUTED / PARTIAL', ['N3-02', 'N3-07'],
                updates['N3-02']['implementation'][:1], updates['N3-02']['validation'][:1],
                ['유한 η의 실제 원문 연산이며 부호·로그 표현으로 exp(65966) 규모의 반지름도 보존한다. 작은 정규화 잔차를 정확 모멘트 등식으로 취급하지 않는다.'],
                updates['N3-02']['remaining'],
                ['outer-fixture.json', 'outer-validation.json', 'outer-independent-reference.json', 'outer-precision-history.json'],
                usage=['예제 ns-source-outer-repairs. Amp, M/J 보정, heat compensation, pressure와 각 support trace를 확인한다.'],
                commands=['node mathscope-m1/navier/followup-construction/outer.verify.mjs',
                          'python mathscope-m1/navier/followup-construction/outer-reference.py']),
            module('controlled-continuation', '3. B.22/B.26 실제 controlled continuation', 'ns.controlled-continuation',
                'PARTIAL_SOURCE_CONTINUATION', ['N3-04', 'N3-05'],
                ['유한 비선형 축 계수에서 source cutoff와 B.26의 log Φ/U ODE를 계산하고 M,I,J,S,Cp를 함께 적분한다. rational datum 및 실제 A.21 datum의 두 입력을 제공한다.',
                 '원문 Ns의 −WU 항은 분모 밖에 위치한다. 이 교정은 reference shear와 실제 U·누적 모멘트를 바꾸므로 과거 결과를 새 소스로 재현했다고 표시하지 않는다.'],
                ['교정된 B.26/C.1 공동 회귀 109/109, 독립 원문 Ns 243/243.', '이전 243/243 실패 및 최대 67.01080019 차이와 교정 뒤 최대 2.8422e-14를 함께 보존한다.'],
                ['유한 jet·RK/Hermite 수치 연장. 해당 곡선의 실행 완료는 원문의 무한 축 해와 같은 해임을 인증한 결과가 아니다.'],
                ['같은 무한 축과 유한 계수·반올림 오차의 결속, 연속 ODE 오차 포위, 전 η의 균일 κ 및 B.33/B.40 선택 조건이 남는다.'],
                ['continuation-loop-contract.json', 'continuation-loop-examples.json', 'continuation-source-formula-independent.json', 'ns-source-formula-correction.json'],
                [r'N_s=-WU+\frac{D(M-\eta M_\eta)+4h\eta S-dS_\eta}{X}+4A\eta\Pi-d\Pi_\eta'],
                usage=['예제 ns-controlled-axis 또는 ns-controlled-source-datum. 유한 축 입력과 실제 endpoint·누적 moments를 확인한다.'],
                commands=['node mathscope-m1/navier/followup-construction/test-continuation-loop.mjs',
                          'python mathscope-m1/navier/followup-construction/independent-continuation-formula.py']),
            module('admissible-loop', '4. 실제 C.1 admissible loop', 'ns.admissible-loop',
                'FIXED_STATE_ALL_PHASE_BOUNDS / PARTIAL_PROFILE', ['N3-06'],
                ['C.1의 exponential tilt·양의 분산 방정식과 위상 재매개화를 계산한다. p2=0의 제거 가능한 분기와 평균 0인 C.11 원시함수를 제공한다.',
                 '제공된 고정 상태마다 모든 위상의 cone gap 상계를 계산한다. 적분 평균과 위상 평균, 유한 상태 집합과 연속 profile 영역을 구분한다.'],
                ['B.26/C.1 공동 회귀 109/109 및 독립 160자리 Bessel·각도 적분 39/39.'],
                ['고정 입력 상태의 모든 위상에 대한 성질. 전체 (X,η)의 loop 매개변수와 도함수 상계는 별도 조건이다.'],
                ['공통 연속 프로파일의 전 상태에서 loop의 매개변수 가정·η 미분을 인증하고 같은 C.12/접합 프로파일로 연결해야 한다.'],
                ['continuation-loop-contract.json', 'independent-loop-reference.json', 'admissible-loop.mjs'],
                usage=['예제 ns-loop-zero-p2와 ns-loop-tilted. removable branch와 weighted mean·phase gap을 비교한다.'],
                commands=['python mathscope-m1/navier/followup-construction/independent-loop-reference.py']),
            module('pressure-analytic', '5. 실제 A.21 목표 압력의 해석 상계', 'ns.pressure-certificate',
                'EXACT_BOUND_CERTIFICATE_WITH_THEOREM_REFERENCE', ['N3-01', 'N3-02', 'N3-03'],
                ['P(z)=−∫(1+z²)^(−2θ(y)) dμ(y), 0≤θ≤1의 실제 양의 혼합식을 정의하고 두 무한 끝을 포함한 전체 μ 질량을 정확 포위한다.',
                 'principal Log를 우반평면에서 고정한다. 공통 우세함수, 실수·복소 압력/도함수 및 모든 차수 Cauchy/Bρ 상계를 제공한다. 유한 Taylor 나머지와 양의 혼합 suffix를 지우지 않는다.'],
                ['Node 70/70, 독립 Fraction·120자리 대조 306/306. NaN·caller norm·불일치 h·예산·취소·Taylor tail 누락·도함수 계수 오류·양의 꼬리 누락을 검사한다.'],
                ['A.21 목표 압력의 정확 포위와 해석 논증이다. 물리 장의 수치 보정이 이 압력과 정확히 같다는 인증은 별도다.'],
                [updates['N3-02']['remaining'][0], '생성된 모든 해석적 전제를 Lean으로 인스턴스화한 새 증명은 아직 없다.'],
                ['pressure-analytic-fixture.json', 'pressure-analytic-validation.json', 'pressure-analytic-independent.json', 'README_PRESSURE_ANALYTIC_KO.md'],
                [r'\frac{5}{2}P_*^2\leq\mu(\mathbb{R})\leq P_*^2\left(\frac{5}{2}e^{1/5}+\frac{e^{-2/5}}{2(1-c_oh)^2}\right)',
                 r'|P(z)|\leq C_u\delta^{-2},\qquad|P^\prime(z)|\leq4(W+r)C_u\delta^{-3}'],
                usage=['예제 ns-source-pressure-bounds. parameterHExact, principal Log, exact rational lower/upper와 표본 표시를 확인한다.'],
                commands=['node mathscope-m1/navier/followup-construction/pressure-analytic.verify.mjs',
                          'python mathscope-m1/navier/followup-construction/pressure-analytic-reference.py']),
            module('source-axis', '6. A.21 압력과 같은 h의 축 인증', 'ns.axis-source-certificate',
                'VERIFIED_LOCAL_BOUND_CERTIFICATE', ['N3-01', 'N3-03'],
                ['압력 producer를 같은 입력에서 새로 실행하고 parameterHExact의 동일성을 검사한다. 그 질량·실수·복소 상계에서 국소 축의 Bρ·수축·양성·무한 tail를 직접 계산한다.',
                 '원래 유리함수 축 모듈의 일곱 공통 계산 구간을 SHA로 검증하며 재사용한다. 256비트 내부 bound는 전용 정확 유리수 경로로 읽고 공개 입력의 크기 제한은 완화하지 않는다.'],
                ['Node 34/34, 독립 Fraction/Bernstein/지수 포위 82/82 및 음성 대조 4/4.', '유리함수 기본 스칼라 Lean 감사는 이 A.21 인스턴스에 자동 이전하지 않는다.'],
                ['실제 A.21 목표 압력과 동일 h에 대한 국소 해석 상계. 사용자 mass·norm·Λ·log C·truth flag를 받지 않는다.'],
                updates['N3-03']['remaining'],
                ['axis-source-default-certificate.json', 'axis-source-test-results.json', 'axis-source-independent-validation.json', 'axis-source-derivation.json'],
                usage=['예제 ns-axis-source-exact-bounds. pressureAxisBinding.matches와 생성된 exact 상수를 확인한다.'],
                commands=['node --test mathscope-m1/navier/followup-construction/axis-source-certificate.test.mjs',
                          'python -B mathscope-m1/navier/followup-construction/verify-axis-source-independent.py']),
            module('radial-modulation', '7. 실제 C.12 변조와 첫 patch 복원', 'ns.radial-modulation',
                'SOURCE_C12_AND_FIRST_PATCH_COMPUTED / PARTIAL', ['N3-06', 'N3-07'],
                updates['N3-06']['implementation'], updates['N3-06']['validation'],
                ['명시한 양의 annulus 가족의 실제 연산이다. 시각화 좌표 (log X,η,N(E_N−E))는 변조의 함수 그래프이며 물리 공간 NS 속도장 투영이 아니다.'],
                updates['N3-06']['remaining'],
                ['source-radial-modulation-contract.json', 'source-radial-modulation-fixtures.json', 'c12-source-formula-independent.json', 'source-correction-independent.json'],
                [r'E_N=E\exp(\mathcal{A}/N),\qquad U_N=U+\mathcal{B}/N',
                 r'a_N=a_L-2D_X\mathcal{A}/N,\qquad b_N=e^{-\mathcal{A}/N}(b_L+2D_X\mathcal{B}/(NE))'],
                usage=['N=8,256의 실제 cone 실패와 N=512의 유한 표본 통과를 비교한다. 진단 격자의 cutoff 추가 점과 원자료를 확인한다.'],
                commands=['node mathscope-m1/navier/followup-construction/test-source-radial-modulation.mjs',
                          'python mathscope-m1/navier/followup-construction/independent-c12-formula.py',
                          'python mathscope-m1/navier/followup-construction/independent-source-correction.py']),
            module('source-inner-gluing', '8. 실제 B.34/B.8 inner–outer 접합', 'ns.source-inner-gluing',
                'SOURCE_INNER_GLUING_COMPUTED / PARTIAL', ['N3-05', 'N3-07'],
                updates['N3-05']['implementation'], updates['N3-05']['validation'],
                ['실제 upstream endpoint에서 생성한 debt만 사용한다. 큰 X_R와 작은 비영 모멘트를 유지하고 Newton 좌표에 표현할 수 없는 debt는 PRECISION_REQUIRED로 거부한다.',
                 '기본 log P*=0은 원문 전체 큰 P 조건을 만족하지 않는다. 이 성분의 수치 검증과 원문 N3-05 수용기준의 PASS는 별개다.'],
                updates['N3-05']['remaining'] + ['이 같은 접합 후보에 C.12를 결속한 전체 cone·stress 인증도 남는다.'],
                ['source-inner-gluing-contract.json', 'source-inner-gluing-fixture.json', 'source-inner-gluing-tests.json', 'source-inner-gluing-independent.json', 'source-inner-gluing-history.json'],
                [r'\log X_R=\log X_i+10(\log C+\log P_*)',
                 r'\delta U=c_0b_0+c_1b_1,\qquad\delta E=c_2b_2+c_3b_3+c_4b_4'],
                usage=['등록 후 예제 ns-source-inner-gluing. sourceContinuation endpoint, transition moments, computed debt, raw Jacobian, nonlinear residual를 함께 확인한다.'],
                commands=['node --test mathscope-m1/navier/followup-construction/source-inner-gluing.test.mjs',
                          'python mathscope-m1/navier/followup-construction/source-inner-gluing-reference.py']),
        ],
    }
    release['notes'] = [
        'M0 여섯 원문 항목은 PASS, 산술 24개와 게이지 16개는 지원 범위에서 PASS다. NS는 15 PASS / 7 PARTIAL / 2 BLOCKED이며 원문 70개는 변경하지 않았다.',
        'Lean 로컬 71개, 원래 rc2 C/D 제출 정리 2개, 후속 원문 참조 16개·새 스칼라 4개 및 음성 대조는 별도 집합이다. 브라우저 소스 일치는 새 커널 실행이 아니다.',
        'NS 원본 C/D 선택 build·타입/공리는 실제 종료 0이다. 전체 default의 후속 실행은 17:45 마지막 관찰 뒤 알 수 없는 원인으로 사라졌으며 17:50 재개했다. 현재 RUNNING으로 전체 성공 receipt가 없다. Comparator는 원래 systemd user guard에서 환경 BLOCKED다.',
        '후속 원문 식 교정: B.26/C.12의 −WU/X 전사를 −WU로 수정했다. 이전 243개 원문 대조 FAIL과 교정 뒤 243/243 PASS, C.12 exact Fraction 1,135개 및 독립 80자리 74개를 보존한다. 원래 수용기준은 완화하지 않았다.',
        '브라우저 v45–49의 25개, v50의 추가 9개 관찰은 각각 과거 기록이다. v52에는 교정된 source와 Worker가 배포됐으나 최종 후속 smoke 결과는 아직 이 release에 합산하지 않았다.',
        'CLI 이전 18/18과 v50 추가 12/12는 과거 실행이다. 현재 최종 배포의 새 CLI 실행 및 gluing 등록은 따로 확인하고 기록한다.',
        '색상은 각 실행의 표시 표본에 대한 정규화다. 실행 사이에는 원래 수량·단위·해시를 비교한다. NS의 coefficient/pressure/modulation 그래프는 물리 공간 velocity 투영과 다른 좌표이며 원자료에 의미를 명시한다.',
    ]
    release['releaseEvidence'] += [
        'evidence/deployment-v52-ns-formula-correction.json', 'evidence/core-tests-corrected-followup.tap',
        'evidence/followup-integration-corrected.tap', 'navier/followup-construction/ns-source-formula-correction.json',
        'navier/followup-construction/source-inner-gluing-independent.json',
        'navier/followup-20261009-default-build/interruption-observation-1750.json',
        'navier/followup-20261009-default-build-resume-1750/status-snapshot-1804.json',
    ]
    release['documentationPreparedAtSeoulDate'] = '2026-10-10'
    write(M1 / 'navier/checklist-status.json', native)
    write(M1 / 'evidence/release-report-data.json', release)
    assert (M1 / 'evidence/original-acceptance.json').read_bytes() == original_bytes
    return {'originalCriteria': len(original), 'nativeNSCounts': dict(Counter(x['status'] for x in native['items'])),
            'followupModuleFamilies': len(release['followupConstruction']['modules']),
            'gluingNode': gluing_node['passed'], 'gluingIndependent': 691,
            'pdfGenerated': False, 'deploymentPerformed': False,
            'releaseDataSHA256': hashlib.sha256((M1 / 'evidence/release-report-data.json').read_bytes()).hexdigest()}


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--recreate-historical-review-draft', action='store_true',
                        help='Explicitly replace documentary inputs with the pre-v53 review draft. Never a final release command.')
    args = parser.parse_args()
    if not args.recreate_historical_review_draft:
        parser.error('Historical draft preparer only; final release data must not be overwritten implicitly.')
    print(json.dumps(prepare(), ensure_ascii=False, indent=2))
