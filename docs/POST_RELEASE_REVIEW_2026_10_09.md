# 2026-10-09 후속 검토: 계산 실패와 증거 무결성

이 기록은 2026-10-08 동결 이후 PR #2와 #4의 검토 지적을 실제 실행으로
재현한 보완 사항이다. 과거 Stage 8 통과 기록은 당시 실행한 범위의 기록이며,
이 경계 사례가 이미 검증되었다는 뜻으로 확대하지 않는다.

## 재현한 문제와 수정

| 항목 | 수정 전 재현 | 수정 후 계약 |
|---|---|---|
| 유효한 제타 격자점 0개 | 실수 0.99..1.01, 허수 -0.01..0.01, 4×4 격자, 극점 제외 반경 0.4에서 16개가 모두 제외되지만 completed, 차이 0, NUMERICAL INDICATOR 반환 | 계산 가능한 점이 없으면 계산 불가 오류. 성공 결과·증거를 만들지 않음. 동기 API는 422, 작업 API는 failed 및 result 없음 |
| 증명 범위 설명 변경 | 고정 Lean 증명은 그대로 두고 manifest의 범위를 전체 PDE 존재·유일성으로 바꾸어도 실제 Lean 실행 후 FORMAL 기록에 해당 설명이 포함됨 | Lean 실행 전에 source와 전체 manifest 바이트를 각각 고정 SHA-256과 비교. 가정·제외 주장·의존성·추가 필드·공백 변경도 거부 |
| 동일 세션·개정의 수치 replay | 원본 세션 r3를 같은 세션 r3로 재실행하면 25개 typed node ID 재사용 | 같은 세션은 원본보다 새로운 개정만 허용. 같은/이전 개정은 계산 전에 거부. 다른 세션 또는 새 개정의 정상 재실행은 유지 |

실제 로컬 Lean 재현은 임시 패키지에서만 수행했다. 배포된 증명 파일과
manifest를 변조하지 않았다. 정확한 대수 정리의 source 및 proof hash는
그대로이며, 전체 PDE·스펙트럼·위상·지표 정리를 증명한다는 의미를 추가하지 않았다.

## 관련 검토의 추가 보완

- 제타 극점 제외와 수치 평가 실패를 따로 집계하며 일부 평가 실패를 경고한다.
- `sourceRevisionRefs`와 기존 `upstreamRevisions` 별칭을 지원하고 실제 출력 객체
  ID로 참조를 연결한다. 기존 화면이 사용하는 첫 번째 표면 출력은 유지한다.
- 환경이 바뀌고 수치 결과도 실패한 경우에는 `NUMERICAL_REPLAY_FAILED`를
  우선한다. 환경 검토 상태는 수치 계산·비교가 통과한 경우에만 사용한다.
- 로컬 FORMAL receipt에 UTC `generatedAt`을 넣는다. 실행 ID·시간은 안정적인
  proof hash와 분리한다.
- 문서대로 `python tools/benchmark_stage8.py`를 실행할 때의 import 오류를 수정한다.
- mpmath 버전은 기존 환경 fingerprint에 이미 포함되어 있음을 확인했다.

## 검증과 적용 범위

수정 전 회귀 실패를 확인한 뒤 전체 Python 테스트 **127개 통과**를 확인했다.
실제 자식 프로세스를 사용하는 작업 API에서도 빈 격자와 동일 개정 replay가
실패 상태로 끝나고 결과가 없는 것을 검사했다. 기존 Starlette/httpx 경고 1개는
이번 변경과 무관하다. 고정 Lean으로 수정 후 실제 재검증 2회를 수행했으며,
각 실행의 ID와 시각은 다르고 proof hash는 같았다.

클라우드 FORMAL 검증은 이 저장소의 Compute API가 아니라 별도
`leegahuyn/mathlib4` 저장소의 `MathScopeCloudLean` 서비스에서 수행한다.
같은 source·manifest 보호를 그 서비스에도 구현하고 실제 Lean 및 HTTP 검증을
포함한 Node 테스트 **21개 통과**를 확인했다. 실제 서비스 반영은 각 저장소의
배포 commit과 자동 배포 이벤트 및 공개 API 재검증으로 별도 확인한다.

수치 replay API는 대상 세션의 전체 저장 이력을 보유하지 않는 stateless API다.
호출자는 재사용하지 않은 대상 세션·개정 쌍을 선택해야 한다. 임의의 다른 대상
쌍을 여러 번 보내는 전역 중복 탐지까지 제공한다고 주장하지 않는다. 실제 웹
replay는 현재 세션의 개정을 증가시키고, API 실행 `jobId`는 매번 별도로 발급한다.

원본 검토: [PR #2](https://github.com/leegahuyn/MathScopeCompute/pull/2),
[증명 범위](https://github.com/leegahuyn/MathScopeCompute/pull/4#discussion_r4216061916),
[재실행 ID](https://github.com/leegahuyn/MathScopeCompute/pull/4#discussion_r4216061958).
