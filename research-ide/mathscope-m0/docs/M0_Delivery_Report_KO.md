# MathScope M0 구현·검증 보고서

## 1. IDE 기반 구축 — 이번에 완성한 범위

**M0의 로컬 실행 기반을 구현했다.** 수학 대상의 입력 계약, 정확한 유한 계산, 가정 변경에 따른 증거 갱신, 실제 Lean 검사 기록을 기존 ResearchSession 안에서 함께 다룰 수 있다. 사용자는 같은 세션에서 계산의 원본·범위·정밀도·출처와 정리의 가정·소스를 확인할 수 있다.

접속: [MathScope Research Foundation](https://project29770.websitepublisher.ai/v0.3.1.html#research-foundation)

| 배포·검증 기준 | 기록 |
|---|---|
| 기준 페이지 | MathScope v0.3.1, 기존 version 41 / d400a17e |
| 이번 페이지 버전 | 44 / 4d79dd82 |
| M0 번들 SHA-256 | b337da82947040c17b2271d34eb70eb9fba46f2aca6e8860ffcce2cc089f8695 |
| Node 회귀 검사 | 82개 통과 |
| M0 브라우저 인수 검사 | 12개 통과, 실제 BROWSER_WEB_WORKER 경로 |
| 기존 Research Extensions 검사 | Node 13개·배포 후 실제 UI 28개 각각 통과 |
| 실제 Lean 검사 | 6개 모듈, 8개 정리 대상; 의도적 실패 사례 2개 거부 |

### 무엇을 사용할 수 있는가

- **대상·계약:** 소수 질의, 프리즘 입력, 게이지 군·상태족, PDE 구성, 관측과 가정을 명시적인 JSON 계약으로 등록한다.
- **정밀도·계산:** 소수 구간, p-adic delta, 유리수 구간, 정수 행렬의 네 계산을 실행·취소·재개하고, 재현 묶음을 내보낸다.
- **가정·증거:** 가정을 수정하면 선언된 의존 관계를 따라 관련 결과가 STALE이 된다. 저장·가져오기로 증명 권한이 되살아나는 경로를 차단한다.
- **Lean·감사:** 실제로 검사한 다섯 범위의 소스와 감사 기록을 선택한다. 정확한 소스가 일치할 때만 LOCAL_AUDIT_VERIFIED를 표시한다.

### 완료 판정의 의미

설계도의 M0 최소 관문인 **“정확한 유한 정리와 조건부 실수 정리가 실제 커널을 통과하고, 잘못된 소스·순환 의존·과거 hash 재사용을 거부하는 기반”**이 갖춰졌다. 이 보고서는 I0·I1·I3의 24개 항목을 현재 범위에 맞추어 분류한다. 전체 28개 작업 패키지·224개 체크리스트의 완료 보고서는 아니다.

원래 99쪽 설계도는 변경하지 않았으며, 이 문서는 M0의 구현·검증 결과를 별도로 기록한다. 실제 프리즘 복합체의 전체 비교, 일반 G의 새로운 장·앙상블, Navier–Stokes 정량 재구성은 각 도메인 패키지에서 이어간다. RH·전칭 BSD·일반 G의 연속체 양자 이론 구성은 연구 관문으로 유지한다. 기존 전체 RELEASE HOLD 판단도 별도다. 이번 작업으로 유료 인프라나 신규 외부 asset을 추가하지 않았다.

근거: build-manifest, unit-tests, bridge-validation, lean-validation 및 각 모듈의 구현 설명서. 구체적인 파일 목록은 마지막 절에 정리했다.

<!-- PAGEBREAK -->

## 2. 네 작업 화면과 권장 사용 순서

| 화면 | 실제 기능 | 사용자가 확인할 내용 |
|---|---|---|
| **01 대상 · 계약** | 예제 선택, JSON 편집·검사, 세션 등록, 스키마 내보내기, 기존 확장 관측 연결 | 대상 ID, 원본 정의, 유한 범위, 출처와 가정 |
| **02 정밀도 · 계산** | 네 계산 어댑터, 진행률, 취소·재개, 결과 저장, 재현 묶음·새 엔진 재실행 | 실제 실행 경로, 정확한 출력, 검증 방법, 정밀도와 오차 원장 |
| **03 가정 · 증거** | 사용자 가정 등록·수정, 의존 관계 검사, 선택적 STALE 예제 | 어떤 가정이 어떤 주장·관측 해석을 지지하는지 |
| **04 Lean · 감사** | 정리·소스 파일 선택, 편집, 감사 일치 확인, ProofJob 저장·내보내기 | 정리의 전체 타입, 표준·사용자 공리, 소스와 환경 hash |

### 처음 실행할 때

1. **연구 세션을 선택한다.** Research Foundation을 열고 기존 세션에 M0 기록을 추가한다. 기존 객체·주장·증거의 ID와 기록된 등급을 보존한다.
2. **대상 계약을 확인한다.** 예를 들어 PrimeQuerySpec을 선택하여 소수집합의 정의와 유한 구간을 확인한 뒤 계약 검사와 세션 등록을 실행한다. 프리즘·군·PDE 예제의 INTERFACE와 가정 표기도 함께 읽는다.
3. **작은 계산을 실행한다.** 정밀도·계산 화면에서 소수 구간의 기본 입력을 실행한다. 완료 후 “결과를 세션에 기록”을 눌러 실제 입력·모델·소스에 묶인 결과를 저장한다.
4. **가정 변경을 시험한다.** “가정 변경 예제 만들기”를 실행하고 가정을 수정한다. 의존하는 주장·해석만 STALE이 되고 독립적인 소수 계산은 유지되는지 확인한다.
5. **Lean 근거를 확인한다.** 정리를 선택하고 “소스 · 공리 감사 확인”을 누른다. 소스 끝에 한 글자를 추가하여 다시 확인하면 과거 기록은 STALE이 된다. “검사한 소스로 복원”한 뒤 다시 일치 여부를 검사할 수 있다.
6. **재현과 가져오기를 확인한다.** 먼저 내보내기 버튼을 눌러 파일 링크와 읽기 전용 전체 JSON을 준비한 뒤, 생성된 링크를 선택하거나 전체 JSON을 선택한 뒤 Ctrl+C 또는 Command+C로 복사한다. 복사한 전체 JSON을 .json 파일로 저장하면 가져오기에 사용할 수 있다. 계산 묶음은 새 엔진에서 재실행한다. 세션을 가져온 경우 “입력 계약 다시 확인”으로 입력 정의를 재검사하고, 필요한 계산을 새로 실행한다. 가져온 과거 결과·증명 기록에는 별도의 재검증이 필요하다.
7. **M0 기반 검사를 실행한다.** 상단 버튼은 별도의 시험 세션에서 12개 인수 검사를 수행한다. 사용자의 현재 세션을 수정하지 않는다.

### 저장이 입력과 어긋나지 않도록 하는 장치

계산을 준비할 때 입력과 revision을 고정한다. 결과 저장 직전에 설치된 계산 소스, 모델·가정 참조, 출력 hash를 다시 확인하고 작은 결과를 재계산한다. 실행 중 입력이나 가정이 바뀌었다면 예전 결과를 새 입력에 붙이지 않는다. namespace 저장에도 현재 세션 ID와 revision을 확인하며, 저장소 쓰기가 실패하면 메모리 상태를 먼저 바꾸지 않는다.

<!-- PAGEBREAK -->

## 3. 실행 가능한 네 계산과 정밀도의 의미

| 계산 | 기본 확인 결과 | 현재 지원 범위 |
|---|---|---|
| 소수 구간 | [2, 1000]의 소수 168개 | 상한 1,000,000, 구간 폭 20,000 이하. 구간 안 모든 정수의 판정을 독립적인 나눗셈 검사와 비교한다. |
| p-adic delta | delta_5(7) = 15 + O(5^3) | 표준 Z_p와 Frobenius lift가 항등인 경우. 소수 p ≤ 1,000,000, 출력 1–255자리. |
| 유리수 구간 | [1/3, 1/2] × [−2, 3] = [−1, 3/2] | 정확한 유리수 끝점의 사칙연산. 0을 포함한 구간으로의 나눗셈은 거부한다. |
| 정수 행렬 | 설계도의 D1 D0 = 3×4 영행렬 | 차원 16 이하, 입력 원소 512자리 이하. 행별 내적과 외적 누적의 두 방식으로 비교한다. |

### 정확한 값과 불확실성을 구분한다

큰 정수는 십진 문자열·BigInt로 보존한다. 정수·유리수·유한체·p-adic ball·정확한 유리수 구간·부동소수점·통계 추정값에 서로 다른 타입을 사용한다. 통계 추정값을 지원하는 스키마가 있다는 사실은 새로운 MCMC 계산기가 구현됐다는 의미가 아니다.

유리수 구간 연산에서는 산술 반올림 오차가 0이며, 구간 폭은 입력 범위와 연산의 의존성에서 나온다. workingBits는 공통 요청·표시 문맥을 기록하는 필드로, 출력 구간 폭의 달성 목표를 보장하지 않는다. 초월함수와 구간 적분은 후속 어댑터 범위다.

### p-adic delta의 추가 한 자리

delta(a) = (a − a^p)/p를 출력 N자리까지 계산하려면 입력 N+1자리가 필요하다. 정확한 정수 원본이나 양립하는 정확한 lift가 있으면 정밀도를 높일 수 있다. 그런 근거가 없으면 PRECISION_REQUIRED를 반환한다. 예를 들어 7과 132는 modulo 5^3에서 같지만 delta의 modulo 5^3 값은 다를 수 있으므로, 빠진 자리를 임의로 채우지 않는다.

### 작업과 재현

브라우저가 지원하면 별도 Web Worker에서 계산한다. 선택한 worker가 시작하지 못하면 실패 원인을 표시한다. Node와 명시적으로 선택한 로컬 fallback에서는 제한된 크기의 계산 단위마다 제어권을 돌려준다. worker 큐는 기본 1개, 최대 2개 동시 실행이며, 보관 작업·캐시·시간·입력·출력의 한도를 둔다. 이 한도는 운영체제가 강제하는 JavaScript heap 제한과는 구별된다.

취소·예산 초과 시 마지막으로 완료한 구간 또는 행을 checkpoint로 보존한다. 재개할 때 가져온 계산 접두부를 다시 검사한다. 재현 묶음에는 입력·실제 환경·출력·오차 원장·검사 기록·계산 소스가 들어가며, 가져온 소스 문자열을 실행하지 않고 설치된 일치 소스로 다시 계산한다.

<!-- PAGEBREAK -->

## 4. I0 체크리스트 — 수학 대상·가정·관측 계약 확장

**상태 기준:** “M0 기반완료”는 이번에 제공한 계약·저장·검증 기반의 완료를 뜻한다. “일부 / 후속 도메인”은 해당 항목의 실행 요구 중 추가 수학 모델이나 계산기가 남아 있음을 뜻한다. 입력 계약의 통과가 그 계약에 적힌 수학적 가정의 증명이 되지는 않는다.

| 항목 | 이번 판정 | 구현 근거와 남은 범위 |
|---|---|---|
| **I0-01 현재 기준선 스냅샷 고정** | M0 기반완료 | version 41 / d400a17e의 페이지·확장·기존 Lean·첨부 논문 hash를 고정했다. migration에서 기존 ID·등급·revision·값을 보존한다. 이번 배포 후 RX Node 13개와 실제 UI 28개 검사를 각각 통과했다. |
| **I0-02 무한 대상과 유한 질의 분리** | M0 기반완료 | 기호적 PrimeSet·역극한·급수 정의와 유한 관측의 계약을 분리했다. 범위 누락·모순과 유한 결과의 무한 전체 완성 주장을 거부한다. |
| **I0-03 프리즘 입력 계약** | M0 기반완료 | p, 환·아이디얼, delta/Frobenius 관례, 기하 가정·절단·비교 출처를 기록한다. CW 재명명과 단순 유한 몫환의 prism 승격을 거부한다. 실제 복합체·비교 인증은 P 계열 후속 작업이다. |
| **I0-04 일반 G와 상태족 계약** | 일부 / 후속 도메인 | 군의 전역형·표현·불변 내적·embedding·결합상수·격자·seed·채널·delta 역할을 검사한다. 새 일반-G 장과 기본 상태족 계산기의 구현은 남아 있다. 기존 고전 SU(2) 화면은 별도 기능으로 유지한다. |
| **I0-05 PDE 재구성 계약** | M0 기반완료 | 논문 구성·설명 모델·일반 solver의 ID를 구별하고 외력·초기조건·양의 시각 범위·cutoff를 요구한다. 실제 정량 profile·pulse 구성은 N 계열 후속 작업이다. |
| **I0-06 가정과 증명 의존성 등록** | M0 기반완료 | 사용자 공리의 출처와 변경 이력을 보존한다. 연결된 후손만 STALE로 만들며, 간접 의존이나 원장에 감춘 USER_AXIOM도 무조건부 target에 넣지 못한다. |
| **I0-07 증거 등급의 호환 확장** | M0 기반완료 | 기존 등급은 기록 그대로 보존하고 유한 정확·구간·통계·조건부 범위를 구별한다. 계산 결과, 인용, 사용자 가정, 가져온 JSON에서 FORMAL PASS를 발급하지 않는다. |
| **I0-08 의존 그래프와 합성 경계** | M0 기반완료 | cycle·유한→무한·투영·스펙트럼 비교의 조건을 검사한다. 유한체 Weil RH→고전 RH 직접 증명 edge를 거부한다. 실제 proof edge는 양 끝 revision·payload hash까지 묶인 인증서를 요구한다. |

입력 스키마는 16개 runtime 계약과 ResearchM0 구조를 포함하여 17개 문서로 내보낸다. 공통 runtime validator와 예제를 검사했으며, 별도 제삼자 JSON Schema validator를 설치하여 교차 검증한 것으로 표시하지 않는다.

<!-- PAGEBREAK -->

## 5. I1 체크리스트 — 정확 연산·정밀도·계산 작업 계층

이번 I1은 **네 유한 로컬 어댑터**에 대한 실행 기반이다. 기존 MathScopeCompute 서버의 SageMath·FLINT·Arb·격자 기능을 새로 배포하거나 확인 없이 지원한다고 선언하지 않는다.

| 항목 | 이번 판정 | 구현 근거와 남은 범위 |
|---|---|---|
| **I1-01 capabilities와 실제 버전 고정** | M0 기반완료 | 실제 로컬 경로·소스·환경 digest와 입력 한도를 공개한다. 미구현 어댑터는 UNSUPPORTED로 표시한다. 서버는 확인한 health 응답만 표시한다. |
| **I1-02 정확 값과 부동소수점 타입 분리** | M0 기반완료 | 정확한 큰 정수·유리수·유한체·p-adic ball·구간·통계 추정을 구분한다. 안전하지 않은 Number 입력을 거부하고 표시 반올림으로 원본을 덮어쓰지 않는다. |
| **I1-03 정밀도 소모 전파** | 일부 / 후속 도메인 | 구현된 p-adic 연산과 delta의 추가 입력 자리, unit-only 나눗셈, 정확한 구간 연산을 처리한다. determinant·basis reduction·일반 Frobenius·미분·적분·급수 오차 전파는 후속 구현이다. |
| **I1-04 잔차와 해 오차의 차이 기록** | M0 기반완료 | rounding·discretization·tail·residual·stability·statistical을 별도 필드로 보존한다. 이번 유한 계산에서 없는 PDE 잔차·안정성 근거는 미계산·미제공으로 명시한다. |
| **I1-05 정준 입력과 캐시 키** | M0 기반완료 | 모델 revision/hash·소스·가정·정밀도·seed·범위·basis·알고리즘·환경을 묶는다. 수학적 출력 hash와 실행 시간·작업 ID는 구별하여 재현 결과를 비교한다. |
| **I1-06 예산·취소·재개** | M0 기반완료 | 로컬 시간·항목·입출력·연산 수 예산과 checkpoint를 구현했다. 취소·예산 초과 후 범위 안에서 재개할 수 있다. GPU·서버 durable queue와 OS 메모리 격리는 후속 인프라다. |
| **I1-07 독립 계산 교차 검증** | 일부 / 후속 도메인 | 구간 체와 전수 나눗셈, 행 내적과 외적 누적, 작은 p의 두 delta 계산을 비교한다. Frobenius 점 세기·FFT·게이지 quadrature·PDE 교차 검증은 도메인별로 추가한다. |
| **I1-08 결과의 재현 패키지** | M0 기반완료 | 요청·환경·checkpoint·정확한 출력·오차·출처·verifier·정적 worker 소스를 내보낸다. 새 엔진에서 재실행하고 소스 불일치·위조된 접두부를 거부한다. |

### 세션 저장과 계산의 연결

새 결과를 저장할 때 실제 설치된 worker 소스에서 SourceManifest를 만들고, 해당 유한 계산의 target과 job·result를 연결한다. 소수 계산의 이름을 PrismSpec·StateFamilySpec·PDEConstructionSpec으로 바꾸어 다른 수학 대상의 검증 결과처럼 저장하는 경로를 거부한다.

가져온 입력 정의는 계약·hash 재확인 후 CURRENT / DECLARED로 복원할 수 있다. 그 과정은 과거 result·proof를 재인증하지 않는다. 새 계산과 저장 검사를 거친 결과를 별도로 생성해야 한다.

<!-- PAGEBREAK -->

## 6. I3 체크리스트 — Lean 형식화·증거 승격·연구 관문

이번 I3에서 커널이 확인한 것은 **고정 유한 복합체와 명시적 가정을 가진 실수 스펙트럼 명제**다. 형식화의 범위는 target의 전체 Lean 타입과 함께 기록한다.

| 항목 | 이번 판정 | 구현 근거와 남은 범위 |
|---|---|---|
| **I3-01 정의와 연구가설의 파일 분리** | M0 기반완료 | Defs·Finite·Analytic·Comparison·Conditional·Open을 분리했다. 무조건부 경로는 사용자 공리 모듈을 import하지 않으며, 맞지 않는 등급의 의존 관계를 거부한다. |
| **I3-02 유한 대수 정리부터 형식화** | 일부 / 후속 도메인 | 실제 정수 행렬·전칭 d²=0·정확한 큰 정수 fixture와 잘못된 인증서 거부를 구현했다. delta 정밀도·semilinear chain map·소수 구간·Lie bracket·holonomy 정리는 이어서 작성한다. |
| **I3-03 해석적 가정의 구체화** | 일부 / 후속 도메인 | 실수 에너지의 정의역·단위·양화 범위·gap 가정을 명시했다. 완비성·균등수렴·미분과 극한 교환·semigroup·spectral measure·PDE 안정성 정리는 아직 해당 도메인의 과제다. |
| **I3-04 외부 비교 정리의 adapter** | 일부 / 후속 도메인 | 실제 spectrum inclusion adapter를 증명했다. 문헌 참조만 있는 입력은 참조로 유지한다. 프리즘·trace·BSD·NS의 실제 exported Lean 정리 import와 adapter는 후속 작업이다. |
| **I3-05 소스 생성과 재검사** | M0 기반완료 | 소스·target·가정·context·환경을 묶은 ProofJob을 만든다. 한 글자나 delta·hash가 바뀌면 과거 audit를 STALE로 분리한다. 임의 소스의 서버 컴파일과 도메인별 생성기는 후속 연결이다. |
| **I3-06 커널·공리·빌드 감사** | M0 기반완료 | 실제 Lean·mathlib pin, source·환경 hash, exit code, warnings, sorry, 전체 타입, #print axioms, 시간과 음성 대조군을 기록했다. |
| **I3-07 연구 관문의 완료 조건** | M0 기반완료 | RESEARCH OPEN과 MODEL DEVELOPMENT를 구별하고 cycle·미증명 입력·결론을 그대로 가정하는 관문 닫기를 거부한다. 일반적인 모든 논리적 동치·순환을 자동 판정하는 기능은 아니다. |
| **I3-08 교육용 설명과 전문가 감사 동기화** | M0 기반완료 | 같은 claim ID에 쉬운 설명과 정확한 type·가정·범위·출처를 연결했다. 조건부 타입은 사용자 공리 목록이 비어 있어도 조건부로 표시한다. |

### 화면에서 증명 기록을 읽는 규칙

LOCAL_AUDIT_VERIFIED는 **포함된 실제 검사 기록과 지금 소스의 정확한 일치**를 뜻한다. 버튼을 누를 때 브라우저에서 새 Lean 컴파일이 실행되는 것은 아니다. 사용자 공리를 포함한 정리는 해당 의존성을 그대로 보여준다. 소스를 편집하면 새 ProofJob으로 내보내고, 이후의 실제 컴파일 결과를 별도로 받아야 한다.

다른 claim에 같은 ID나 복사한 digest를 붙여 기존 receipt를 재사용할 수 없다. 현재 다섯 audit는 각각의 정확한 형식화 범위에 적용되며, 임의의 자연어 주장·그래프 edge를 자동으로 증명하지 않는다.

<!-- PAGEBREAK -->

## 7. 실제 검사한 여덟 Lean 대상

전체 namespace는 MathScope.M0이며, 아래 표는 그 뒤의 이름을 표시한다. 원본의 target type과 전체 axiom 출력은 lean-validation에 포함된다.

| 정리 | 실제 확인한 내용 | 공리 의존성 |
|---|---|---|
| Finite.differential_squared_zero | 고정 D0·D1에 대해 모든 v ∈ Z^4의 d1(d0(v)) = 0 | propext |
| Finite.matrix_product_zero | 표시한 3×5 및 5×4 정수 행렬의 곱이 영행렬 | propext |
| Finite.integer_fixture | (−7, 9007199254740993, 11, −13)의 정확한 계산 | 없음 |
| Analytic.gap_excludes_interval | 주어진 GapAt 가정으로 (0, delta)의 에너지를 배제 | 표준 3개 |
| Analytic.smaller_positive_gap | 같은 spectrum에 더 작은 양의 하한을 적용 | 표준 3개 |
| Analytic.gap_transfer | 관측한 superset의 gap을 원래 subset으로 전달 | 표준 3개 |
| Comparison.transport_gap | 명시적 SpectrumComparison.inclusion을 통한 전달 | 표준 3개 |
| Conditional.selected_gap_excludes_interval | 선택한 spectrum과 delta=1 사용자 가정의 귀결 | 표준 3개 + 사용자 공리 2개 |

표준 3개는 propext, Classical.choice, Quot.sound이다. 사용자 공리의 실제 선언 이름은 다음과 같다.

```lean
MathScope.M0.Conditional.selectedSpectrum
MathScope.M0.Conditional.userAssumedGapAtOne
```

### 수학적 적용 범위

고정 행렬의 chain condition은 유한 복합체의 실제 성질이다. 완성된 프리즘 복합체와의 동일시, 빠진 Laurent weight의 contraction, Frobenius와의 호환성, 기하 비교 정리에는 각각 추가 증명이 필요하다.

GapAt은 실수들의 집합과 양의 하한에 관한 술어다. gap을 가정한 귀결과 gap 자체의 존재는 다른 명제다. selectedSpectrum에는 특정 Yang–Mills Hamiltonian이라는 정의가 들어 있지 않다. 자기수반 연산자·Hilbert 공간·양자장·continuum limit의 구성은 Y 계열 작업에서 이어간다. 관측 채널의 subset을 원래 전체 spectrum의 superset으로 잘못 취급할 수 없도록 inclusion 방향도 타입에 보존했다.

### 검사 환경

Lean 4.34.1과 mathlib commit d13f23b723b8a846827a245b89c10fc7d3f11612를 사용했다. 공식 Lean shared library의 정상 frontend·kernel로 검사했으며 runtime·kernel·verifier guard를 수정하지 않았다. 실행 파일의 설치 루트 탐지 대신 명시적인 경로를 제공한 작은 driver의 소스와 hash를 포함했다.

2,258개 import 모듈의 소스와 사용 가능한 olean·private·IR hash를 기록했고 unresolved import는 0개다. 성공한 target에서 sorry는 0개, 경고는 0개다. 현재 pin의 실제 import 경로는 Mathlib.Basic.Real.Basic이며 재현 명령도 이 경로를 사용한다.

<!-- PAGEBREAK -->

## 8. 검증 결과와 보호한 경계

| 검사 묶음 | 결과 | 확인한 범위 |
|---|---|---|
| 전체 Node 회귀 | 82 / 82 통과 | 계약·정확 연산·작업·저장 연결·증거·WebMCP·commit bridge |
| M0 브라우저 인수 | 12 / 12 통과 | 실제 BROWSER_WEB_WORKER 경로; 계약·정밀도·계산·Lean audit |
| 기존 RX Node 회귀 | 13 / 13 통과 | 이번 패치 뒤 코드 회귀 검사 |
| 기존 RX 실제 UI 검사 | 28 / 28 통과 | 배포 후 화면의 “확장 검증 실행”을 실제 실행 |
| 실제 Lean 성공 빌드 | 6개 모듈 / 8개 감사 대상 | 각 target의 타입·공리·source·환경 pin |
| 실제 Lean 음성 대조군 | 2 / 2 거부 | 0=1 by rfl, 부호가 잘못된 행렬 certificate |
| 실제 주입 commit 코드 | 9 / 9 통과 | 저장 오류·비동기 경쟁·revision·baseline·기존 데이터 보존 |

검사 범위는 일부 중첩된다. 합계를 독립적인 수학적 증명 수로 해석하지 않는다. version 44의 #research-foundation/lean 직접 새로고침 후 M0 표시를 확인했다. 실제 YM 관측 연결 뒤 M0 revision 22·노드 17개이며, 기존 객체 5·표현 5·주장 5·증거 6개는 유지됐다.

### 실제 실패를 만들어 확인한 사례

- 소스 한 글자·hash·target·환경·delta·가정 변경, audit의 exit code·공리·타입 변조, 복제한 receipt로 과거 증명 권한을 재사용하지 못한다.
- 부족한 p-adic 자리, 누락된 유한 범위, 위조 checkpoint, 다른 어댑터의 모델로 재분류한 결과, 오래된 가정에 의존한 결과 저장을 거부한다.
- 저장 실패 시 기존 session·store·dirty·timer를 유지한다. 비동기 검증 중 revision 변경, 같은 revision의 다른 내용, baseline과 hash를 함께 위조한 요청도 거부한다.

### 브라우저 내보내기 확인

Blob·링크 다운로드는 Download failed였고 자동 clipboard API도 제한됐다. 내보내기 버튼은 지속되는 링크와 읽기 전용 전체 JSON을 준비한다. JSON 선택 후 Ctrl+C에서는 275,922자가 실제 클립보드에 복사되어 원문 길이와 일치했다. 전체 JSON 파싱 결과는 evidence/browser-session-bundle.json에 저장했다. 수동 복사 후 .json 저장 경로를 사용할 수 있으며, 자동 다운로드·복사 성공으로 기록하지 않는다.

재가져오기는 코드·통합 테스트를 통과했다. 실제 브라우저 file chooser 검증은 파일 선택 자동화의 보안 승인 거절로 미완료이며, 우회하지 않았다. 브라우저 재가져오기 성공으로 표시하지 않는다.

### 실제 WebMCP 호출과 브라우저 환경

native WebMCP 7종을 실제 consumer로 호출하여 모두 응답을 받았다. 완료 작업의 cancel은 cancelRequested:false·COMPLETED 유지가 확인됐으며, 이 관측을 실행 중 취소 성공으로 해석하지 않는다. 해당 동작의 코드 검사는 별도다. M0 7종과 legacy summary를 합한 8회 호출을 evidence/browser-webmcp-validation.json에 기록했다.

console에는 chrome-extension metadata 오류 2개와 기존 Three.js GPU/WebGL 생성불가 3개가 남았다. M0 worker·Lean 감사는 동작했고 기존 RX는 CPU 3D 경로를 사용했다. 전체 GPU 검증이나 console 무오류를 주장하지 않는다. 새 연구 정리와 전체 RELEASE HOLD 해제는 별도 관문이다.

<!-- PAGEBREAK -->

## 9. 후속 선택과 다음 구현의 시작점

### 사용자의 설계 선택이 필요한 두 인프라 연결

| 결정 | 현재 구현 | 후속 연결에서 정할 내용 |
|---|---|---|
| **임의 Lean 소스의 실제 컴파일** | 소스 편집·ProofJob 내보내기·다섯 pinned audit의 정확한 대조 | 별도 local verifier 또는 인증된 원격 worker의 위치, toolchain pin, 시간·메모리 한도, 의존성 허용 목록, 감사·receipt 발급 방식 |
| **서버의 지속 작업 큐** | 한도가 있는 로컬 worker 큐, checkpoint 내보내기·가져오기·재개 | MathScopeCompute와 연결할 저장소·작업 backend, 재시작 후 복구, 사용자 인증, artifact 보관과 비용 한도 |

브라우저 탭을 닫은 뒤에도 계산이 계속되고 서버 재시작을 넘어 job이 유지되는 기능은 durable queue를 연결할 때 추가한다. 현재의 checkpoint 재현과 이 기능을 같은 것으로 표시하지 않는다. 기존의 특정 정리 전용 Lean endpoint를 임의 M0 소스 컴파일러로 사용하지도 않는다.

이 두 선택을 지금 확정하지 않아도 네 로컬 계산과 입력·가정·감사 기능은 사용할 수 있다. 이번 단계에서 새 유료 서비스나 외부 asset을 추가하지 않았으며, 비용을 발생시키는 인프라 변경은 이루어지지 않았다.

### 다음 단계로 넘기는 수학 작업

- **산술:** 지금의 정확한 행렬·p-adic 기반에 실제 점·P1 비교 모델, 전체 복합체의 contraction과 Frobenius, 더 일반적인 비교 adapter를 연결한다. 소수집합은 기호적 원본으로 유지하고 각 계산 범위의 완전성을 명시한다.
- **게이지 이론:** 일반 G의 실제 표현·embedding 또는 full Lie algebra 장을 구현하고, delta의 가정·단위 변환·유효 상태족·앙상블 추정 역할에 맞춰 원본 장과 관측을 계산한다.
- **PDE:** 논문에 고정된 profile·pulse·cutoff·보정과 정량 조건을 구현한다. 형식 급수·수렴 급수·절단 오차를 구별하며 각 단계의 입력·잔차·안정성 조건을 연결한다.

새 구현은 기존 SourceManifest → 대상 → ComputeJob → ResultEnvelope와 Definition → theorem → audit 흐름에 들어간다. 수학적 비교·극한·복원 증거가 필요한 지점은 그 조건과 연구 상태를 보존한다.

### 기준 스냅샷과 변경 방식

소스 재구성의 기준은 WebsitePublisher 커넥터가 제공한 스냅샷이며, 불투명 필드의 마스킹을 유지한다. 배포에는 해당 버전에 대한 변경 patch를 적용했고 전체 HTML 덮어쓰기를 사용하지 않았다. 기준 스냅샷의 hash와 실제 배포 버전·M0 번들 hash를 구별하여 기록한다.

<!-- PAGEBREAK -->

## 10. 재현 자료와 확인 순서

### 함께 제공하는 근거 파일

| 파일 | 용도 |
|---|---|
| build-manifest.json, page-patches.json | 기준 버전, 변경 묶음, 번들 hash와 배포 patch |
| baseline/manifest.json | 기존 페이지·확장·Lean·논문 원본의 고정 참조 |
| schemas/ 및 docs/contracts-notes.md | 입력 계약, migration, import·세션·의존 관계의 의미 |
| docs/compute-notes.md | 네 어댑터, 정밀도·한도·취소·재현의 실제 범위 |
| docs/lean-notes.md, lean/ | 실제 정리 소스, toolchain, 재현 명령과 감사 방법 |
| evidence/unit-tests.txt | 전체 Node 회귀 검사 결과 |
| evidence/bridge-validation.json | 실제 주입된 저장 함수의 무결성·동시성 검사 |
| evidence/lean-validation.json | 실제 Lean 타입·공리·로그·negative control |
| evidence/lean-environment.json | 전체 import 소스·컴파일 산출물의 hash 목록 |

이 보고서의 “M0 기반완료”는 위 파일과 테스트로 확인한 현재 제공 범위를 가리킨다. 실제 프리즘·일반 G·NS의 후속 계산과 새로운 연구 정리의 완료 여부는 해당 패키지의 구체적인 증거로 갱신한다.


### 로컬 회귀 검사를 재실행할 때

소스 묶음을 푼 프로젝트 루트에서 다음 명령을 실행한다. 실제 페이지에 주입된 commit 함수의 검사는 생성된 HTML을 읽으므로, 페이지를 다시 만들었다면 같은 build 결과를 대상으로 검사한다.

```sh
node --test mathscope-m0/tests/*.test.mjs
```

### Lean 소스의 재검사

일반 Lean/Lake 설치 환경에서는 포함된 lean 디렉터리의 toolchain과 lakefile pin을 따른다. 의존성을 준비한 뒤 다음과 같이 모듈을 검사하고 type·axiom 출력을 확인한다.

```sh
lake update
lake exe cache get Mathlib.Basic.Real.Basic
lake build MathScope.M0.Finite
lake build MathScope.M0.Analytic
lake build MathScope.M0.Conditional
lake build MathScope.M0.Comparison
lake env lean MathScope/M0/Finite.lean
lake env lean MathScope/M0/Conditional.lean
```

NegativeFalse.lean과 NegativeMatrix.lean은 반드시 실패해야 하는 대조군이다. 이 두 파일을 모든 파일이 성공해야 하는 일반 빌드 대상으로 합치지 않는다. 재현을 위한 실행 환경과 상세 명령은 docs/lean-notes.md에 정리했다. 기존 실제 실행 환경용 reproduce.py는 배포 묶음 외부의 Lean distribution과 pinned mathlib 설치 경로를 요구한다.

### 이 문서와 설계도의 관계

원래 99쪽 설계도는 연구·구현의 전체 목표이고, 이 보고서는 version 44에 추가한 M0의 실제 제공 범위를 설명한다. 다음 작업은 각 항목의 후속 범위와 근거를 갱신하면서 이어가며, 공리·추정·계산·정리의 상태를 같은 기록으로 섞지 않는다.
