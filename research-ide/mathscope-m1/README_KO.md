# MathScope M0·M1 - 소스, 계산, 증거 재현

이 패키지는 MathScope의 M0 연구 기반과 M1 수학 객체를 실제로 실행하고, 입력·결과·출처·검증 범위를 확인하기 위한 소스와 증거 묶음이다. **M0의 남은 여섯 항목, 산술 24개, 게이지 16개는 명시된 지원 범위에서 완료했다.** NS에는 원문에서 실제로 계산한 외곽·축·연장·loop·변조·접합과 정확한 국소 상계를 추가했다. 원문의 모든 수학적 조건을 만족하는 하나의 완성된 NS 프로파일은 아직 인증되지 않았다.

<!-- RELEASE-SUMMARY:BEGIN -->
문서 기준 날짜는 **2026-10-10, Asia/Seoul**이다. 공개 페이지 **v54 / 16f4f911**에 **실행 예제 59개**를 배포했다. 후속 NS는 **8종류·11개 예제**다. M1 버전은 `1.2.0`, NS 엔진은 `1.3.0-m1`이다. [v54 배포 원장](evidence/deployment-v54-verified.json)과 [최종 판정 자료](evidence/release-report-data.json)에서 소스·상태·검증 범위를 확인할 수 있다. v54의 수정은 키보드 Home 처리와 입력/결과 표시 갱신이며, [Worker 동일성 기록](evidence/v53-v54-worker-continuity.json)이 수학 Worker와 49개 소스의 불변을 확인한다. **최종 v54 브라우저 19/19 확인을 통과했다.** 실제 관찰 범위는 [브라우저 원장](evidence/browser-final-v54.json)에 기록했다.
<!-- RELEASE-SUMMARY:END -->

Lean 감사는 **초기 로컬 target 71개**, **원래 rc2 C/D 제출 정리 2개**, **후속 원문 exported 타입·공리 참조 16개**, **새 스칼라 정리 4개**로 구분한다. 네 개의 pinned 감사 묶음을 제공하지만 이를 합쳐 새로 증명한 정리 93개라고 표시하지 않는다. 계산 예제를 실행하거나 브라우저에서 소스가 일치하는지 확인하는 일 자체는 Lean 커널 실행이 아니다.

원문 체크리스트는 **70개**다. M0의 남은 6개, 산술 P1–P3의 24개, gauge Y1–Y2의 16개, Navier–Stokes N1–N3의 24개를 원래 문구로 보존한다. M0 여섯 항목은 독립 검토에서 완료했으며, 현재 전체 집계는 **61 PASS / 7 PARTIAL / 2 BLOCKED**다. **NS 원문의 전체 기본 빌드, 독립 Comparator 검사와 N3의 전체 선도 프로파일 인증은 남은 관문이다.** C/D 선택 빌드의 성공으로 이 관문이나 70개 모두의 수학적 완료를 선언하지 않는다. 최종 항목별 상태는 [원문 기준](evidence/original-acceptance.json), [M0 여섯 항목 검토](evidence/m0-six-checklist.json), [NS 체크리스트](navier/checklist-status.json)에 있다.

## 1. 가장 빠른 실행

ZIP을 풀면 `mathscope-m1`, `mathscope-m0`, 필요한 `mathscope-extension` 파일이 같은 상위 디렉터리에 놓인다. **이 상대 경로를 유지한다.** 아래 명령은 세 디렉터리가 보이는 상위 디렉터리에서 실행한다.

필수 환경은 **Node.js 24 이상**이다. 실제 CLI 확인 환경은 Node `v24.19.0`이며, CLI에는 별도 npm 패키지가 필요하지 않다. Python과 Lean은 CLI 예제 실행의 필수 조건이 아니다.

```bash
node --version
node mathscope-m1/cli.mjs list
node mathscope-m1/cli.mjs list --json
node mathscope-m1/cli.mjs run prime-1000 --out ./runs/prime-1000
```

`prime-1000`은 실제 유한 구간 `[2,1000]`에서 소수 168개를 계산한다. 기존 CLI의 [18/18 검증 기록](evidence/cli-validation.json)과 [당시 export bundle](evidence/cli-prime-1000/replay-bundle.json)을 보존했다. v50 당시에도 새 Worker 계산으로 [12/12 추가 검사](evidence/cli-v50-validation.json)와 [그 export bundle](evidence/cli-v50-prime-1000/replay-bundle.json)을 저장했다. 이 과거 실행을 현재 배포에서 모두 다시 실행한 기록으로 바꾸지 않는다. 복합체 예제를 실행하려면 다음 명령을 쓴다.

```bash
node mathscope-m1/cli.mjs run p1-p3 --out ./runs/p1-p3
node mathscope-m1/cli.mjs run ns-source-pressure-bounds --out ./runs/pressure
node mathscope-m1/cli.mjs run ns-axis-source-exact-bounds --out ./runs/source-axis
node mathscope-m1/cli.mjs run ns-source-inner-gluing --out ./runs/gluing
```

압력·국소 축의 `COMPLETED`는 해당 정확 상계 계산의 완료다. 접합 예제는 실제 수치 연산을 성공해도 원문 전체 인증이 없으므로 `PARTIAL` 및 종료 코드 2를 반환한다. `fullProfileCertified:false`와 남은 조건을 함께 읽는다.

**v53 CLI 통합 검사 48/48을 통과했다.** 실제 CLI 호출은 목록 1회, 계산 3회, 입력·덮어쓰기 거부 3회의 총 7회다. gluing은 `PARTIAL`/종료 2, 압력과 A.21 축은 `COMPLETED`/종료 0이었다. 별도 공개 Node 엔진에서 gluing 재계산 `MATCH`, 위조 승격·외부 소스·100비트·연산 예산·caller debt 거부 등 제어 7개를 확인했다. 48은 48개 예제를 모두 계산한 횟수가 아니다. CLI에는 `replay` 서브명령이 없으며 공개 엔진 API를 사용했다. [검사 원장](evidence/cli-v53-validation.json), [실제 명령](evidence/cli-v53-commands.json), [엔진 제어](evidence/cli-v53-controls.json)를 따로 읽는다. 이 Worker는 v54와 같지만 v54에서 CLI를 다시 실행했다고 표시하지 않는다.

`--out`에는 **새 디렉터리**를 지정한다. 이미 있는 디렉터리를 덮어쓰지 않는다. 옵션을 생략하면 현재 작업 디렉터리의 `m1-output` 아래에 예제 ID와 실행시각을 사용한 새 디렉터리를 만든다. 목록은 하드코딩한 설명이 아니라 현재 `core/registry.mjs`가 반환하는 실제 예제 요청이다.

CLI는 `core/engine.mjs`의 `createM1Engine`과 설치된 `WORKER_SOURCE`를 그대로 쓴다. Node `worker_threads`는 브라우저 Worker의 메시지 전송 규약을 연결한다. 별도의 소수·gauge·NS 알고리즘을 구현하지 않는다. 원래 요청의 시간·작업량·표본·결과 바이트 제한이 유지되며, Worker에는 메모리 상한도 설정한다. `Ctrl+C`는 작업을 취소하고 종료 상태의 checkpoint와 bundle을 저장하는 경로로 들어간다.

### 저장되는 결과

| 파일 | 내용 |
|---|---|
| `request.json` | 예제에서 가져온 원본 수학 입력과 정규화된 precision/budget |
| `environment.json` | 설치된 Worker SHA-256, 엔진 버전, 실제 capability와 환경 hash |
| `result.json` | 실제 도메인 계산 결과, 관측 정의, 가정, 유한 범위와 오차 기록 |
| `replay-bundle.json` | 엔진의 실제 `exportBundle` 결과. 원본 요청·환경·결과·hash·checkpoint 포함 |
| `summary.json` | 실행 상태, Node Worker 정보, source/input/result/mathematical/bundle hash와 scope |
| `files-manifest.json` | 위 다섯 파일의 바이트 수와 SHA-256 |

엔진의 `resultHash`는 전체 계산 결과를, `mathematicalHash`는 최상위 실행시간 통계를 제외한 수학적 결과를 묶는다. 이 규칙은 bundle의 `semanticHashPolicy`에 기록된다. 가져온 JSON에는 살아 있는 실행 receipt나 증명 권한이 생기지 않는다. `engine.replay(bundle)`은 동일 설치 환경에서 요청을 새로 계산해 비교하는 API이며, CLI의 최소 명령은 `list`와 `run`이다.

CLI 종료 코드는 다음과 같다. `PARTIAL`인 NS 후보도 결과와 차단 사유를 저장한다.

| 코드 | 의미 |
|---:|---|
| 0 | `COMPLETED` — 요청한 유한 계산 완료 |
| 2 | `PARTIAL` — 계산한 부분과 남은 조건을 함께 반환 |
| 3 | `PRECISION_REQUIRED` 또는 `BUDGET_EXCEEDED` |
| 4 | `UNSUPPORTED` |
| 130 | `CANCELLED` |
| 1 | 입력·실행·파일 저장 실패 |

## 2. 브라우저와 독립 CLI의 관계

**브라우저 M0 연결에는 기존 MathScope 페이지와 세션이 필요하다.** `workspace.html`, `workspace.css`, `workspace.mjs`는 기존 앱의 탐색·세션·M0 그래프에 통합되는 구성요소다. 이 ZIP을 정적 파일 서버로 열었다고 새 MathScope 사이트나 로그인된 세션이 구성되는 것은 아니다.

**CLI는 브라우저 없이 실행할 수 있다.** 필요한 M0 계약과 baseline 데이터가 소스에 포함되며, Worker 계산과 결과 export에 기존 브라우저 세션을 요구하지 않는다. CLI 결과는 파일로 저장된다. 현재 사용자의 MathScope 세션을 읽거나 수정하지 않는다.

현재 배포 정보는 [v54 배포 원장](evidence/deployment-v54-verified.json), 설치된 소스와 Worker/app hash는 [build-manifest.json](build-manifest.json)이 기준이다. [초기 배포 기록](evidence/deployment.json)은 과거 증거로 보존한다. 보고서·CLI·압축 생성은 사이트 배포를 수행하지 않는다.

브라우저 직접 관측은 [v45–49의 25개 기록](evidence/browser-validation.json)과 [v50 당시의 9개 기록](evidence/browser-validation-v50.json)을 구분했다. v50에서는 새 Worker 출처, 같은 M0 세션에 P¹ 결과 저장과 새 계산 재현, 원문 C/D 감사 범위, heat 구간 인증, 미인증 NS 후보, G2의 실제 4D 표본과 3D 투영, 문헌·Lean 구분 검사를 확인했다. 후속 배포는 [v52 원문 식 교정](evidence/deployment-v52-ns-formula-correction.json), [v53 실제 접합 통합](evidence/deployment-v53-readback-verified.json), [v54 UI 교정](evidence/deployment-v54-ui.json)으로 별도 추적한다. 새 배포가 이전 모든 검사를 같은 버전에서 반복했다는 의미는 아니다.

### v54에서 실제 확인한 범위

[최종 브라우저 19/19 원장](evidence/browser-final-v54.json)은 2026-10-09 18:24:40 UTC의 실제 WebMCP 반환과 보이는 DOM을 확인한 기록이다. 설치된 Worker SHA, 예제 59개, 감사 묶음 4개와 `formalPass:false`를 확인했다. 원장에 포함된 계산과 UI 검사는 다음과 같다.

| 실제 확인 | 결과와 범위 |
|---|---|
| B.34/B.8 접합 | 세 η stencil의 모멘트 비교 3/3, 최대 정규화 잔차 `2.9137869562977097e-10`, 중심 cone 표본 97/97. `PARTIAL`, `intervalNewtonCertified:false` 유지 |
| 접합 저장과 재현 | M0 revision 68에 저장, 별도의 새 계산으로 `MATCH`. `(log X, η, log E)`와 값 U의 114개 표시점을 확인 |
| A.21 압력·축 | 압력과 축 상계 계산 `COMPLETED`; 실제 binary64 h의 정확 유리수 결속, `Φ` 하계 `16011107/61056000`, self-map 상계 `1/400`. 축 결과는 revision 65에 저장하고 새 계산 `MATCH` |
| P¹ 비교 복합체 | 실제 계산한 자유 rank `(1,0,1)`과 세 차수의 빈 torsion 목록 |
| G2의 4D→3D 관측 | 7×7 행렬 표현, `LINEAR_PROJECTION`, 실제 625개 관측점 |
| 정밀도·위조 입력 | 100비트 요구는 `PRECISION_REQUIRED`, 외부 `actualDebt`는 `FAILED`. 해석 adapter 계약·출처 guard는 47/47 |
| 발견된 UI 결함 교정 | Ctrl+Home 등의 수정 키는 NS 탭을 유지한다. 예제를 바꾸면 이전 결과와 입력 불일치가 즉시 표시되고 저장이 비활성화되며, 원래 입력을 복원하면 결속이 회복됨 |

이 JSON은 **실제 관찰 요약**이다. 브라우저가 만든 원본 JSON의 파일 동기화는 timeout이어서 원본 export를 바이트 단위로 복제한 자료라고 표시하지 않는다. [실제 최종 화면](evidence/browser-v54-final.jpg)은 별도로 동기화해 저장했다. 브라우저 검사는 새 Lean 커널 실행이나 무한 영역의 해석 조건 증명이 아니며 `formalPass:false`, `fullProfileCertified:false`를 유지한다.

v53의 공통 엔진 [19/19](evidence/core-v53-candidate.tap), 후속 통합 [19/19](evidence/followup-integration-v53-candidate.tap), M0 회귀 [82/82](evidence/m0-regression-v53.tap)와 CLI [48/48](evidence/cli-v53-validation.json)은 실제 실행 버전을 보존했다. v54에서 변한 소스는 `workspace.mjs` 하나이며 Worker는 동일하다. 이 같은 계산 소스의 연속성을 v54에서 모든 검사를 반복했다는 뜻으로 바꾸지 않는다.

## 3. 원문 70개 항목의 범위

| 묶음 | 원문 수 | 구현과 판단 범위 |
|---|---:|---|
| M0 남은 공통 기반 | 6 | 군·상태족 계약, 정밀도 전파, 독립 검증, 유한 Lean 정리, 해석 가정 기록, 문헌/실제 import 분리 |
| P1–P3 | 24 | 유한 소수·정확 산술·p-adic 관측·실제 점/P¹ 비교 복합체 및 Frobenius. 일반 prismatic site와 전역 BSD 증명을 포함하지 않음 |
| Y1–Y2 | 16 | 지원하는 실제 compact matrix group, Lie algebra, embedding, 4D 고전장·곡률·불변 관측과 유한 holonomy |
| N1–N3 | 24 | 원문/코드 연결, 좌표·heat 성분·기준 해, 선도 프로파일의 일부 연산과 후보. 원래 rc2의 C/D 선택 빌드·타입/공리 확인 완료와 전체 기본 빌드·독립 Comparator·전 구간 인증의 미완료를 구분 |

상세 설명은 [산술 안내](arithmetic/README_KO.md), [산술 수학 설명](arithmetic/MATHEMATICS_KO.md), [gauge 안내](gauge/README.md), [NS 안내](navier/README.md)를 따른다. 각 도메인의 `checklist`는 fixture 통과와 미지원 수학 범위를 함께 기록한다.

### Gauge와 Δ의 의미

실제 행렬 adapter는 `SU(2..6)`, `SO(3,5..8)`, compact `Sp(1..3)`, compact `G2`의 14개다. `G2`에는 Dynkin index 1과 3의 서로 다른 실제 SU(2) embedding을 제공한다. Spin, 임의 중심몫, F4/E6/E7/E8 또는 범위 밖 군은 이름만 붙인 대체 장으로 처리하지 않고 거부한다.

군 이름이나 Δ만으로는 field job을 만들 수 없다. coupling, 표현, 불변형, scale·center·coefficients, 경계와 seed, 관측 방식 등 실제 상태족 입력이 필요하다. `ASSUMED_BOUND`는 물리적 장을 유지하고 가정만 바꾼다. `UNITS`는 단위를 바꾼다. `CLASSICAL_SCALE`과 `EFFECTIVE_MODEL`은 명시한 정의에 따라 실제 장을 다시 만든다. 이 차이는 물리적 field hash와 정규화된 입력에 남는다.

BPST와 full-basis 시험장, 유한 transport는 고전 계산이다. 유한 대각 Hamiltonian의 채널 감쇠는 별도 명시 모델이다. 양자 Wilson ensemble, 무한 부피/continuum 극한, 모든 compact simple G의 양자 Yang–Mills 존재와 질량간극은 이 계산에서 얻지 않는다.

### NS의 남은 관문

heat의 유한 구간 enclosure와 정확한 기준 해 검사는 해당 성분의 결과다. 원문의 전체 NS 구성, 모든 공간·시간 점에서의 부등식, 접합, cone, 안정성, 잔차에서 해의 오차로 가는 상수를 동시에 검증했다는 뜻이 아니다. N3 후보의 `PARTIAL`, `BLOCKED`, `fullCertifiedProfile:false`, `solutionErrorBound:null`을 그대로 유지한다.

원래 rc2의 `NavierStokes.ComparatorSolution` 선택 빌드와 별도 `PinnedDeclarations.lean` 타입·공리 확인은 실제 종료 0으로 완료했다. 전체 기본 대상 `NavierStokes`, `Euler`, `ComparatorChallenges`는 이후 재개했으나 아직 종료 0이 기록되지 않았다. 처음 C/D 우선 전환 때의 종료 -15와, 그 다음 실행이 연결 오류 뒤 사라져 종료 코드·원인을 모르는 상태, 17:50 UTC의 새 재개를 각각 보존했다. **N1-05는 전체 기본 빌드 미완료, N1-06은 독립 Comparator 환경 차단 때문에 PARTIAL이다.** 현재의 실행 스냅샷은 아래 4절과 원장을 따른다.

N3의 정확한 잔여 조건은 다음과 같다. 이미 구현된 A.7 보상, C.1 loop, B.26 연장, B.34/B.8 접합을 과거의 미구현 상태로 되돌려 설명하지 않는다.

| 원문 항목 | 이번에 확보한 것 | 실제로 남은 조건 |
|---|---|---|
| N3-01 PARTIAL | 정확한 국소 tube·노름·수축·양성용 상수와 A.21 필요한 조건 판정 | 같은 완성 프로파일의 A.6/B.33/B.40 전체 정량 계층 |
| N3-02 PARTIAL | source 외곽 스케줄·M/J·Amp·angular·heat 보상, A.21 목표 압력의 정확 상계 | 보정된 실제 E의 압력과 목표 A.21의 동일성, 모든 η의 정확 모멘트 |
| N3-03 PARTIAL | 유리함수 및 A.21 입력의 Bρ invariant ball·수축·양성·무한 tail | 같은 무한 고정점과 finite η-jet/반올림 오차의 결속, 생성 전제의 전체 Lean 인스턴스화 |
| N3-04 PARTIAL | 유한 core 복원, 실제 B.26 연장, 원문 Ns 교정 | 무한 source profile에서 정확한 leading 항등식과 같은 수치 배열의 관계 |
| N3-05 BLOCKED | 실제 B.26 종점부터 B.34/B.8의 5모멘트·이차 Newton·재적분 | 연속 적분 enclosure와 전체 η의 interval Newton/implicit-function 포함 조건 |
| N3-06 BLOCKED | 실제 C.1/C.12 및 변조의 실제 오차를 첫 patch에서 복원 | 같은 최종 B.8 프로파일의 전 영역 strict cone κ 및 균일 복원 |
| N3-07 PARTIAL | 성분별 예약 patch·support·끝점 처리·실패 거부 | 같은 최종 장의 T0 지지·flat factorization·edge limit |
| N3-08 PASS | 판본·상수·소스·결과·각 정리 절의 근거/미해결 이유 계약 | 계약의 PASS는 원문 전체 프로파일의 PASS가 아님 |

선택 빌드·공리 확인의 성공, 전체 기본 빌드, 독립 Comparator 결과는 서로 다른 증거다. 아래 4절의 실제 명령·완료 시각·산출물 재고와 [원문 감사 요약](navier/official-validation/official-audit-summary.json)을 함께 읽는다. 패키지 생성 시점의 원장은 [NS 성분 검증 원장](navier/evidence/lean-validation.json), [NS 체크리스트](navier/checklist-status.json), `official-validation` 기록이다.

## 4. 서로 다른 Lean 감사와 원래 전체 build

| 목적 | 버전과 범위 |
|---|---|
| MathScope 로컬 성분 감사 | **Lean 4.34.1**, commit `5045d0056413266e57c625dcd7c365b10e377c52` |
| mathlib를 실제 import한 로컬 성분 | mathlib commit `d13f23b723b8a846827a245b89c10fc7d3f11612` |
| 원래 NS의 C/D 선택 빌드·타입/공리 확인 | **Lean 4.34.0-rc2**, commit `6a10ac8c22beadecabdbb0919c2b50214762f91d`. 별도 checkout·의존성·명시 설치 경로 entry·build 원장을 사용 |
| 원래 rc2의 mathlib | commit `85e3a25e006c35636f0e53b0e9296caca2685bc0`. 4.34.1 로컬 성분의 cache와 분리 |

71개는 산술 **31**, gauge **27**, NS **13** target의 합이다. 각 type, `#print axioms`, 소스, 실제 종료 코드, 로그와 hash를 보존한다. 9개의 고의 오류는 실제 커널에서 거부됐다. 이 로컬 target 집합에는 사용자 추가 axiom이나 `sorryAx`가 없다. 표준 Lean axiom 의존성은 target마다 다르므로 감사 기록을 그대로 읽는다.

### 원래 rc2 C/D의 완료된 실행 결과

고정된 원문 커밋은 `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`다. **2026-10-09 16:05:12 UTC**, 원래 Lake 대상 선택 명령 `lake build NavierStokes.ComparatorSolution`이 **9,371개 Lake 작업, 종료 0**으로 완료했다. **16:06:24 UTC**에는 별도 `PinnedDeclarations.lean`의 import·타입·`#print axioms` 조회도 **종료 0**으로 완료했다. 9,371은 해당 빌드의 작업 수이며 새로운 정리의 수가 아니다.

조회한 원래 exported declaration은 다음 두 개다.

- `NavierStokes.Comparator.navier_stokes_breakdown_R3`
- `NavierStokes.Comparator.navier_stokes_breakdown_periodic`

각 정리에서 출력된 공리 집합은 정확히 **`[propext, Classical.choice, Quot.sound]`**이며, `sorryAx`나 추가 사용자 공리는 보고되지 않았다. 타입은 고정된 원문의 초기 속도·외력 조건을 포함하는 C/D 문장이다. 이 두 결과는 71개 로컬 target에 섞어 집계하지 않고 **별도 rc2 제출 정리 감사**로 기록한다. 독립 Comparator의 Challenge/Solution 동치 검사나 Nanoda 검사 완료를 뜻하지 않는다.

이 성공은 **공식 rc2 공유 라이브러리에 연결한 명시 설치 경로 entry**를 사용한 실행 프로파일의 결과다. 원래 배포 CLI의 자동 설치 경로 탐지 실패도 별도 기록으로 보존한다. 원문 proof source·manifest·커널을 바꾸지 않았고, 원래 캐시의 **8,747/8,747 요청**이 다운로드·압축 해제되어 종료 0에 도달한 뒤 빌드했다. 공식 upstream cache에 대한 통상적인 신뢰 가정은 유지하며, cache에 있는 모든 증명을 독립 외부 커널로 재검사했다는 주장은 하지 않는다.

v50의 성공한 선택 빌드 이후 `.olean` 재고는 다음과 같았다. 현재의 새 build 재고는 다음 절에 따로 기록한다. 행들은 서로 겹치며 합산하지 않는다. **파일 존재 재고 자체는 별도의 증명 인증서가 아니다.**

| 원문 범위 | 소스 모듈 | `.olean` 존재 | 미생성 |
|---|---:|---:|---:|
| C/D 제출의 local import closure | 609 | 609 | 0 |
| `NavierStokes` root의 source import closure | 753 | 692 | 61 |
| 전체 `NavierStokes` library | 817 | 702 | 115 |
| 전체 `Euler` library | 1,840 | 23 | 1,817 |
| `ComparatorChallenges` | 2 | 0 | 2 |

### 전체 default build의 후속 실행

첫 전체 명령은 C/D 선택 검증을 우선하면서 종료 -15로 중단했다. 2026-10-09 **16:36:01 UTC**에 다시 전체 `lake build`를 시작했다. 이 실행의 마지막 자원 기록은 **17:45:05 UTC**였고, 연결 오류 뒤 **17:50:27 UTC** 조사에서는 기존 controller/build 프로세스가 없었다. 최종 receipt를 쓰지 못했으므로 **실제 종료 코드·원인은 모른다**. 이를 OOM이나 컴파일 실패로 추정하지 않는다. [중단 관찰](navier/followup-20261009-default-build/interruption-observation-1750.json)에 로그·프로세스·원문 입력 해시를 보존했다.

같은 원문·manifest·rc2 커널·보호 조건을 유지하여 **17:50:28 UTC**에 한 번 재개했다. 보고서에는 **18:15:19–18:15:21 UTC**에 복사한 [불변 스냅샷](navier/original-build-release-snapshots/20261009T181519Z/snapshot.json)과 [36개 로그·근거의 해시 목록](navier/original-build-release-snapshots/20261009T181519Z/SNAPSHOT_MANIFEST.json)을 연결한다. 원문 입력·소스·커널 해시를 재확인했고 `RUNNING_AT_CAPTURE`, `exitCode:null`, NS `.olean` 794/817, Euler 158/1,840, ComparatorChallenges 2/2였다. 프로세스 확인은 nested PID와 host PID를 대조했다. 복사한 진행 로그는 그 시간의 관찰된 prefix이며 원자적 전체 checkpoint나 종료 receipt가 아니다. 이 수치로 전체 완료율·성공을 추정하지 않는다.

### 후속 축의 원문 참조 16개와 새 스칼라 4개

원래 rc2의 `AxisBoundAudit.lean` 검사가 **2026-10-09 17:16:16 UTC, 종료 0**으로 끝났다. 원문 exported 정리 16개의 정확한 타입·공리 참조와 유리함수 기본 fixture의 새 스칼라 정리 4개를 구분한다. 모두 `[propext, Classical.choice, Quot.sound]`만 의존한다. 정확히 실수 타입을 갖는 거짓 부등식은 `⊢ False`를 남기고 종료 1로 거부됐다.

이 감사는 [axis-lean-audit.json](navier/followup-construction/axis-lean-audit.json)과 [네 번째 pinned 감사](navier/followup-construction/axis-pinned-audit.json)에 있다. 기본 스칼라 4개를 A.21 source-axis 입력으로 자동 이전하지 않는다. 생성한 복소 해석·계수 노름 전제 전체, 기존 finite η-jet, 보정된 E의 압력 동일성 또는 전역 NS witness를 모두 Lean으로 증명한 기록이 아니다. 최초의 지원되지 않는 표시 옵션 및 실수 import 부족 시도는 별도 실패로 남으며, 유효한 음성 대조나 성공에 합산하지 않는다.

원래 `systemd-run --property=RestrictAddressFamilies=~AF_UNIX --user --pty ...` 호출은 user bus 연결 단계에서 실패하여 **Comparator는 환경 BLOCKED**다. 별도 읽기 전용 조사도 현재 컨테이너에 활성 user systemd/DBus와 필요한 cgroup 위임이 제공되지 않음을 확인했다. 보호 조건을 보존하는 정상 비특권 외부 실행 환경이 필요하며, guard를 완화하거나 fake-landrun으로 대체하지 않았다.

실제 결과를 추적하는 파일은 다음과 같다.

- [최종 rc2 명령·환경·종료·로그 해시](navier/official-validation/full-pinned-command-results.json)
- [C/D 두 정리의 실제 타입·공리 출력](navier/official-validation/ns-pinned-declarations.log)
- [공식 캐시 entry의 종료 결과](navier/official-validation/cache-context-result.json)
- [선택 빌드 이후의 원문/산출물 재고](navier/official-validation/remaining-build-scope.json)
- [원문 rc2 감사 요약](navier/official-validation/official-audit-summary.json)
- [Comparator 독립 환경 조사 JSON](navier/official-validation/comparator-environment-independent.json)과 [짧은 설명](navier/official-validation/comparator-environment-independent.md)

### 기존 로컬 감사의 범위

기존 M0에는 사용자 가정에 의존하는 별도의 조건부 예제가 있다. M1의 71개에 추가 사용자 axiom이 없다는 사실로 M0의 사용자 가정을 지우거나, 가정 있는 귀결을 무조건적 정리로 바꾸지 않는다.

확인할 원장은 다음과 같다.

- [산술 Lean 감사](arithmetic/evidence/lean-audit.json)
- [Gauge Lean 감사](gauge/lean/lean-audit.json)
- [NS 성분 Lean 감사](navier/evidence/lean-validation.json)
- [후속 축의 원래 rc2 감사](navier/followup-construction/axis-pinned-audit.json)
- [공통으로 묶인 감사 목록](evidence/packaged-audits.json)

브라우저의 `MATCHED_LOCAL_KERNEL_AUDIT`는 표시 중인 정확 소스가 이미 검사한 기록과 일치한다는 뜻이다. 편집한 임의의 Lean 소스를 새로 컴파일한 결과가 아니다. `kernelRerun:false`, `formalPass:false`를 그대로 보존한다.

### Lean을 다시 검사하려면

공식 Lean 설치와 필요한 고정 mathlib를 별도로 준비한다. 바이너리와 대형 cache는 ZIP에 없다. `gauge/lean`에는 일반 Lake 설치에서 사용할 `lean-toolchain`과 `lakefile.lean`이 있다.

```bash
cd mathscope-m1/gauge/lean
lake build
lake env lean MathScope/M1/Gauge/SU3.lean
lake env lean MathScope/M1/Gauge/G2.lean
```

다른 현재 재현 스크립트들은 검사 당시 workspace의 `lean-4.34.1-linux`, `mathlib-ym-check`, `/tmp/mathscope-lean-embed` 경로를 사용한다. [M0 driver 소스](../mathscope-m0/lean/lean-embed-check.c)와 [M0 재현 스크립트](../mathscope-m0/lean/reproduce.py), 도메인별 `lean/reproduce.py`에 실제 경로·명령·모듈 순서가 있다. 설치 경로를 준비하지 않은 상태에서 바로 실행되는 범용 Lean installer로 해석하지 않는다. 산술/NS에는 현재 별도 `lakefile.lean`이 없으므로 해당 재현 스크립트와 원장의 import closure를 기준으로 환경을 맞춘다.

driver는 설치 root를 명시해 공식 frontend를 호출하기 위한 소스다. Lean 커널·runtime·검증 guard를 변경하는 패치가 아니다. 공식 NS 원문의 rc2 재현에서는 4.34.1의 `.olean`이나 mathlib build 결과를 섞어 쓰지 않는다.

## 5. 계산·계약 검사

새 설치에서 Node 검사 경로를 확인하려면 다음 명령을 사용한다. 각 결과의 범위를 개별적으로 읽으며, 테스트 수를 서로 다른 정리의 수로 더하지 않는다.

```bash
node --test mathscope-m1/tests/core.test.mjs
node --test mathscope-m0/tests/*.test.mjs
node --test mathscope-m1/arithmetic/tests/arithmetic.test.mjs
node mathscope-m1/gauge/tests.mjs
```

일부 검사·생성기는 해당 하위 디렉터리의 fixture나 evidence 파일을 다시 쓴다. 배포 당시 원장을 보존하려면 압축을 푼 별도의 사본에서 재현한다. 산술 독립 Python 검사는 `sympy==1.14.0`, `mpmath==1.3.0`을 사용한다. 설치 목록은 `arithmetic/requirements-test.txt`에 있으며 이 의존성의 vendor 사본은 ZIP에 포함하지 않는다.

기존 검사 기록은 `evidence/core-tests.tap`, `evidence/m0-regression-tests.tap`, 각 도메인 `evidence`에 있다. 실제 독립 비교에는 point enumeration/Frobenius, exact matrix/SymPy, FFT/direct mode convolution, matrix curvature/finite difference, analytic density/quadrature가 사용된다. 같은 함수를 다시 실행한 것은 replay이며 독립 수학 검증으로 세지 않는다.

## 6. 문헌 adapter

논문 URL, 정리명, 정확한 가정과 결론은 인용 수준의 근거다. `THEOREM_REFERENCE`만 연결된 결과에는 Lean import나 커널 권한이 붙지 않는다. 실제로 import한 정리는 정확한 exported target과 그 감사 기록을 별도로 가진다.

[BSD known-case adapter](core/bsd-known-case-reference.json)는 `E/ℚ`의 해석적 랭크 0·1에서 대수적 랭크 일치와 Sha 유한성을 명시한다. 정확한 전역 L-function 가정을 충족해야 하며, 유한 Euler 목록이나 수치 threshold가 이를 증명하지 않는다. 일반 BSD의 선도계수 공식과 Sha 차수 계산을 결론에 넣지 않는다. 프리즘 비교·trace formula 및 NS 원문 정리도 해당 source/import 구분을 따른다.

## 7. 소스와 ZIP을 다시 만들 때

**일반 CLI 실행에는 `build_m1.py`가 필요하지 않다.** 이 스크립트는 기존 MathScope **v44를 기준으로 하는** 정적 bundle과 WebsitePublisher 패치 9개를 만든다. `page-patches.json`은 이미 M1이 통합된 페이지에 반복 적용하는 패치가 아니다. 기존 페이지 전체를 자동 복구하거나 배포하는 범용 명령도 아니다. 새 배포를 만들 때에는 현재 페이지 버전·이미 적용된 항목을 별도로 확인해야 한다.

소스 ZIP 스크립트는 bundle을 재생성하거나 사이트를 수정하지 않는다. 먼저 포함 파일과 설치 build의 source pin을 읽고 검사한다.

```bash
python mathscope-m1/tools/package_source.py --dry-run
python mathscope-m1/tools/package_source.py --output output/MathScope_M0_M1_Source_and_Evidence.zip
```

Python **3.10 이상**의 표준 라이브러리만 필요하다. `--dry-run`은 ZIP이나 manifest 파일을 쓰지 않는다. 기본 출력도 `output/MathScope_M0_M1_Source_and_Evidence.zip`이다. 기존 결과를 의도적으로 교체할 때만 `--force`를 지정한다.

정상 실행은 다음을 검증한다.

1. `build-manifest.json`의 모든 `sourceFiles`가 현재 파일 hash와 일치한다.
2. 필요한 M0 계약·schema·테스트·Lean driver 및 renderer와 로컬 import 경로가 포함된다.
3. 내부 `PACKAGE_MANIFEST.json`에 소스별 길이와 SHA-256이 들어간다.
4. ZIP의 전체 entry 집합, CRC, 모든 entry의 길이·hash를 다시 읽어 검사한다.
5. 포장 도중 원본 파일이 바뀌지 않았는지 확인하고, 최종 ZIP SHA-256과 `.package-receipt.json`을 기록한다.

포함 범위는 M1의 source/tests/evidence/docs/Lean 소스와 로그, 필요한 M0 소스·schema·테스트·로그, build manifest가 참조하는 renderer다. 공식 NS repository에서는 `Flatness.lean`, `ProblemStatement.lean`, `LICENSE`와 후속 감사가 참조한 **9개 axis 원문 모듈**을 포함한다. 목록은 `tools/package_source.py`의 `OFFICIAL_FILES` 및 감사 `sourceFiles`가 기준이다. 이 부분집합은 전체 공식 저장소가 아니다. `official-validation`은 최상위 JSON/log/MD, 재현용 Python/shell/C와 실제 probe·감사 증거인 `.lean`·`.diff` 파일을 포함하고, 그 아래의 repository·cache·toolchain 디렉터리는 제외한다.

설치된 Lean/mathlib와 대형 cache, vendor dependency, 원문 전체 repository, 바이너리·다운로드 archive, 외부 논문 전문 PDF와 추출한 전문 text는 제외한다. 따라서 ZIP 크기나 무결성 확인을 공식 NS 전체의 재현 성공으로 읽을 수 없다. 공개 원전의 URL·고정 commit·hash·정리 위치는 source lock과 문헌 목록에 남는다.

최종 PDF 보고서는 별도 산출물이다. 이 ZIP에는 보고서의 원문 acceptance, 정규화한 데이터, 생성 소스와 검증 기록이 들어가며 외부 논문의 전문을 복제하지 않는다.

## 8. NS의 여덟 후속 구성

후속 파일은 `navier/followup-construction/`에 있다. 독립 Worker에서 실행하는 API는 임의 사용자 코드를 받지 않으며, 공통 입력·정밀도·시간/연산/표본 budget·취소·소스 해시 계약을 사용한다. 결과의 실행시간 정보는 수학적 해시에서 제외하고, 입력의 정확 값과 표현 종류는 유지한다. 같은 원본 입력으로 새 계산을 실행하는 replay와 서로 다른 식·적분 경로의 독립 검사를 구별한다.

| 가족 | 실행 kind | 실제 대상과 검사 | 범위 |
|---|---|---|---|
| 유리함수 축 | `ns.axis-certificate` | 전체 η cutoff, 공통 complex tube, Bρ 상계, 수축·양성·무한 tail. Node 27/27, 독립 131/131 | 명시적 압력 `−K/(1+η²)²`의 국소 해석 상계 |
| source 외곽 | `ns.source-outer` | A.5–A.21 schedule, M/J, Amp, angular·heat 보상. Node 40/40, 독립 70자리 71/71 | 유한 η에서 실제 원문 연산 |
| controlled 연장 | `ns.controlled-continuation` | B.22/B.26, 실제 U·Φ·다섯 누적 모멘트. C.1과 공동 회귀 109/109, 독립 원문식 243/243 | 유한 nonlinear jet·RK/Hermite 연장 |
| admissible loop | `ns.admissible-loop` | C.1 tilt·분산·재매개화·C.11 primitive. 독립 160자리 39/39 | 제공된 고정 상태의 모든 위상 상계 |
| A.21 압력 | `ns.pressure-certificate` | 양의 측도, 무한 끝, exact exp enclosure, principal Log, 도함수 노름. Node 70/70, 독립 306/306 | 실제 A.21 목표 압력의 정확 상계 |
| A.21 축 | `ns.axis-source-certificate` | 같은 exact h의 pressure→axis 연결. Node 34/34, 독립 82/82 및 음성 대조 4/4 | 해당 source datum에서 국소 무한 계수 상계 |
| C.12 변조·복원 | `ns.radial-modulation` | 실제 C.1/C.11/C.12, 5모멘트 첫 patch. Node 57/57, 원문식 Fraction 1,135/1,135, 보정 80자리 74/74 | 명시적 annulus 가족의 유한 N 연산 |
| B.34/B.8 접합 | `ns.source-inner-gluing` | 실제 B.26 종점→로그 전이→U 복원→실제 5모멘트 debt→이차 Newton. Node 26/26, 독립 90자리 691/691 | 실제 수치 접합 성분; 균일 interval Newton 미인증 |

이 표는 검사 수를 모두 더한 전역 증명 개수를 만들지 않는다. 독립 원문식 검사는 저장된 수에 대한 별도 대수 계산이며, 연속 구간의 격자 사이까지 검증한 결과가 아니다. 정확한 해석 상계는 격자 보간이 아닌 명시 부등식에서 나온다.

### 8.1 정확한 압력과 축 상계

A.21 목표 압력은 `P(z)=−∫(1+z²)^(−2θ(y))dμ(y)`의 양의 혼합식이다. μ의 두 무한 끝을 유한 절단점에서 없애지 않는다. inner 질량 `(5/2)exp(2logP)`의 정확한 초월 표현과 그 유리수 하·상계를 구분한다. 작지만 양수인 혼합 suffix 역시 0으로 처리하지 않는다.

복소 tube에서 `Re(1+z²)>0`를 보장하고 principal Log를 고정한다. 적분함수와 도함수의 공통 우세함수를 사용하여 실수/복소 상계와 모든 차수의 Cauchy/Bρ 노름을 계산한다. 지수는 정확 Taylor 합·꼬리 및 방향 반올림으로 포위하며 표시용 `Math.exp` 값을 인증 입력에 쓰지 않는다. 상세 논증은 [압력 설명](navier/followup-construction/README_PRESSURE_ANALYTIC_KO.md)과 [압력 독립 검사](navier/followup-construction/pressure-analytic-independent.json)에 있다.

숫자 `1e-8`의 실제 binary64 값은 정확히 `3022314549036573/302231454903657293676544`다. 문자 입력 `1/100000000`과 정확히 같지 않다. source-axis는 pressure producer가 반환한 `parameterHExact`와 같은 h를 요구하고 불일치를 `AXIS_H_MISMATCH`로 거부한다. 외부에서 mass·norm·tail·Λ·logC·증명 flag를 입력하여 인증을 조작할 수 없다.

축 결과의 `VERIFIED_LOCAL_BOUND_CERTIFICATE`는 명시 함수의 정확 국소 상계와 원문 정리 참조를 뜻한다. `formalPass:false`와 `fullCertificateKernelChecked:false`를 유지한다. 양성 비교는 `0≤Y≤41/10, −1≤η≤1`의 직사각형에서 수행한다. 유리함수 기본 스칼라의 Lean 감사가 A.21 입력에 자동 이전되지 않으며, 기존 η-jet 배열과 무한 고정점의 계수 동일성·반올림 오차 연결도 남아 있다.

### 8.2 실제 B.34/B.8 접합

접합 모듈은 임의로 심은 보정 계수나 외부 debt 대신, **같은 실행의 실제 B.26 종점**에서 시작한다. 중심 η와 양쪽 차분점에서 다음을 모두 계산한다.

1. `X_i=110`의 E,U,M,I,J,S,Cp와 필요한 η 자료를 읽는다.
2. B.34 로그 전이와 `log X_R=log X_i+10(log C+log P*)`를 계산한다.
3. 전이 전체에서 다섯 모멘트를 실제로 적분하고 A.7 기준 모멘트와의 차이를 측정한다.
4. `−8<log x<−7`에서 `G_i→4η`로 복원하며 추가 모멘트 오차를 누적한다.
5. 다음 고정 구간의 두 U bump와 세 E bump로 전체 선형·이차 변화량, raw Jacobian, 행 변환, 수치 Newton을 계산한다.
6. 별도 192점 적분으로 다섯 모멘트와 비선형 잔차를 다시 확인하고, B.35와 유한 지점의 relaxed cone 결과를 반환한다.

기본 `j0=10^-6`, `Λ=1024`, `log C=80`, `Tsh=640`, `log P*=0`에서 `log X_R≈804.70048`이다. 큰 물리 반지름과 작은 비영 모멘트는 `SIGNED_LOG`로 보존한다. Newton의 수치 좌표로 옮길 때 비영 debt가 underflow하거나 overflow하면 `PRECISION_REQUIRED`가 되며, 이를 0으로 지워 통과시키지 않는다.

세 η stencil의 scaled 비선형 잔차 최대는 약 `2.914e-10`으로 고정 허용값 `1e-9`보다 작고, 중심 η의 cone 진단은 유한 97/97점에서 통과했다. **기본 log P*=0은 원문의 큰 P* 조건을 만족하지 않는다.** `log P*=14` 가지에서 현재 유한 축 근사가 양성을 잃는 실패도 노출한다. 수치 후보가 원문 전체 매개변수 계층을 충족한다는 주장을 하지 않는다.

최종 `hasOwn` 입력 whitelist 교정 뒤 현재 fixture의 입력·결과가 독립 검사본과 정확히 같음을 [최종 근거 결속](navier/followup-construction/source-inner-gluing-final-evidence-binding.json)에서 확인했다. 독립 691개를 같은 계산으로 다시 실행했다고 쓰지 않는다. 상세 식·실패 이력·재현 명령은 [접합 설명](navier/followup-construction/SOURCE_INNER_GLUING_KO.md)과 [계약](navier/followup-construction/source-inner-gluing-contract.json)에 있다.

### 8.3 C.12의 실제 변화와 실패

C.12의 `E_N=E exp(Acal/N)`, `U_N=U+Bcal/N`과 원문의 위상을 고정한 log-radius 미분을 계산한다. `N∂phase` 항을 가진 전체 도함수와 별도로 대조한다. 실제 변조에서 생긴 다섯 모멘트 오차를 첫 patch의 이차 모멘트 방정식으로 복원한다. 이 작업은 B.8의 inner 접합과 별도이며, 아직 같은 전체 프로파일에 두 구성이 결속되지 않았다.

좁은 C.1 cutoff는 단순 조밀 격자도 놓칠 수 있어 경계와 추가 진단점을 사용한다. 결과는 다음과 같다.

| N | 실제 변조/복원 | 유한 cone 표본 | 전 구간 κ 인증 |
|---:|---|---|---|
| 8 | 계산됨 | 실제 위반 유지 | 없음 |
| 256 | 계산됨 | cutoff에서 변조 2개 표본 실패 | 없음 |
| 512 | 계산됨 | 변조 4,294/4,294, patch 65/65 통과 | 없음 |

같은 점에서 N=512와 1024를 비교하면 값 변화는 약 절반으로 줄지만 radial derivative 변화는 비영 규모로 남는다. 이는 두 유한 N의 관찰이며 모든 N의 점근 정리를 인증한 것은 아니다. 3D 좌표 `(log X,η,N(E_N−E))`는 변조의 함수 그래프다. 물리 공간의 NS 속도장 그림으로 해석하지 않는다. [C.12 설명](navier/followup-construction/SOURCE_RADIAL_MODULATION_KO.md)에 cutoff·적분·수량·범위를 기록했다.

## 9. 발견한 오류와 교정 근거

### 원문 Ns 전사의 −WU 스케일

B.26과 C.12 구현에서 `−WU`를 모멘트 분자 안에 넣어 X로 한 번 더 나누는 **실제 전사 오류**를 발견했다. 원문 (4.16)/(B.35)의 적분 경계항은 `−XWU`이므로 최종식은 다음과 같다.

```text
Ns = -W*U + (D*(M-eta*M_eta)+4*h*eta*S-d*S_eta)/X
     + 4*A*eta*Pi - d*Pi_eta
```

기존 B.26/C.1 회귀 109/109와 C.12 회귀 53/53는 이 항을 원문과 독립적으로 대조하지 못했다. 별도의 원문 검사로 과거 저장 데이터 243개를 확인하자 **243개 모두 실패**, 최대 절댓값 차이 `67.01080019077068`이 나왔다. 이를 기존 PASS 뒤에 숨기지 않았다.

교정 뒤 B.26/C.1 회귀 109/109, C.12 회귀 57/57가 통과했다. 새 독립 B.26 원문식 243/243의 최대 차이는 `2.842170943040401e-14`, C.12의 exact Fraction 원문식 1,135/1,135, 별도 80자리 보정 지도는 74/74였다. 74개 보정 검사는 원래부터 Ns 식의 범위를 주장하지 않았으며, 그 검사와 원문 Ns 검사는 지금도 구분한다.

수정 전 소스·fixture·검사·문서는 [history/ns-wu-scaling-v1](navier/followup-construction/history/ns-wu-scaling-v1/snapshot.json)에 보존한다. 현재 Worker는 과거 소스를 import하지 않는다. [교정 원장](navier/followup-construction/ns-source-formula-correction.json)과 [교정 해시 목록](navier/followup-construction/ns-source-formula-correction-manifest.json)이 정확한 before/after 소스와 검사 범위를 연결한다. 원문 수용기준이나 오차 허용값을 낮추지 않았다.

### 실제 접합 적분의 해상도 교정

B.34/B.8의 첫 Gauss32 계산은 flat bump 적분을 충분히 해상하지 못해 독립 616개 검사 중 130개에서 실패했다. 정확한 bump 적분과 별도 고정밀 계산으로 원인을 확인하고 128/192점 규칙으로 교정했다. 고정밀 checker도 극도로 작은 적분을 그대로 적응 적분할 때의 절대오차 문제가 있어 크기를 분리한 뒤 적분하도록 고쳤다. 두 종류의 과거 실패와 기준값은 별도 history에 보존하며, 검사 허용값을 완화하지 않았다.

이후 실제 계산 종점·모멘트 debt·이차 지도·Jacobian·재적분을 독립 90자리 계산 691/691로 확인했다. 연속 적분의 엄밀한 enclosure 또는 전체 η의 interval Newton을 새로 증명한 결과는 아니다. 원래 N3-05는 계속 **BLOCKED**다.
