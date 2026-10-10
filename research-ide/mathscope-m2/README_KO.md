# MathScope M2 · 구현 범위, 사용법과 재현

기존 MathScope v0.3.1에 M1 관측 개선과 M2 계산·비교 작업창을 추가한 디렉터리입니다. **원문 M2 기준 64개 중 62개 PASS, 2개 PARTIAL, 0개 OPEN**이며, 이전의 20 PASS / 39 PARTIAL / 5 OPEN에서 **42개 기준이 추가로 PASS**가 되었습니다. 기존 M0/M1 수학 소스와 M1 Worker, 원본 인수인계와 검증 기록은 보존합니다.

남은 2개는 N4-04의 실제 모멘트 복구와 N5-06의 실제 공분산·전역 조립입니다. 따라서 현재 `fullM2Complete`는 **false**입니다. 개별 기준에 명시된 유한 합격과 N4/N5 전체 패키지·새로운 전역 정리의 완료를 구별합니다.

- [M2 작업창](https://project29770.websitepublisher.ai/v0.3.1.html#research-m2)
- [M1 수학 대상과 관측](https://project29770.websitepublisher.ai/v0.3.1.html#research-objects)
- [원문 64개 기준](evidence/original-m2-criteria.json) · [현재 상태](evidence/m2-criteria-status.json) · [이전 상태와의 원문 대조](evidence/original-status-delta.json)
- [최종 라이브 릴리스 기록](evidence/live-release.json)

현재 라이브 게시 버전은 **68 (`0a3ad25e`)**, M2 작업창 버전은 **0.3.4**입니다. v67에서 같은 배경의 실제 잔차 비교 7개 패널을 추가하고 N4-05를 완료했으며, v68에서는 M1/M2 그래프의 범례와 축 설명 간격을 보완했습니다. v68의 잔차 7개·공분산 8개 패널이 실제 브라우저에서 표시되며 잔차 재현은 `MATCH`입니다. 전체 73예제의 원본 모듈·정적 Worker 수학 결과도 일치합니다. 보존한 v64 전체 브라우저 검사는 68예제·129패널, v62의 M1 전체 검사는 59예제입니다. v68에서는 M1 열 적분 구간과 원본 Worker 해시도 다시 확인했습니다. 버전별 검증을 [라이브 릴리스 기록](evidence/live-release.json)에 구별해 보관합니다.

## 1. 현재 상태와 이번 변경

| 원문 묶음 | 이전 PASS / PARTIAL / OPEN | 현재 PASS / PARTIAL / OPEN | 추가 PASS |
| --- | ---: | ---: | ---: |
| P4 · 고차원 산술과 Frobenius | 4 / 4 / 0 | 8 / 0 / 0 | 4 |
| P5 · 형식 q와 Breuil–Kisin | 4 / 4 / 0 | 8 / 0 / 0 | 4 |
| P6 · perfectoid와 비교 | 2 / 6 / 0 | 8 / 0 / 0 | 6 |
| Y3 · 유한 격자 | 6 / 2 / 0 | 8 / 0 / 0 | 2 |
| Y4 · 앙상블·전달 연산자 | 4 / 2 / 2 | 8 / 0 / 0 | 4 |
| N4 · 배경 구성 | 0 / 5 / 3 | 7 / 1 / 0 | 7 |
| N5 · pulse 구성 | 0 / 8 / 0 | 7 / 1 / 0 | 7 |
| I2 · 관측 인터페이스 | 0 / 8 / 0 | 8 / 0 / 0 | 8 |
| **합계** | **20 / 39 / 5** | **62 / 2 / 0** | **42** |

이전 기준점은 원격 Git commit `2fc532b`의 `evidence/m2-criteria-status.json`입니다. 과거 로컬 commit `7cb1d59`로 표기한 파일과 SHA-256이 같은 원격 보존본입니다. 38개 `PARTIAL→PASS`, 4개 `OPEN→PASS`, 1개 `OPEN→PARTIAL`을 기록했습니다. 이전 PASS 20개는 유지되며 기존 PARTIAL 1개도 계속 PARTIAL입니다. 64개 ID·제목·합격 문구·페이지를 이전 파일 및 원문 추출본과 각각 대조했고 변경하지 않았습니다. [대조 스크립트](compare-original-criteria.py)는 원본 텍스트가 다르면 실패하고 [상태 변화 기록](evidence/original-status-delta.json)을 재생성합니다.

현재 등록 실행 예제는 **73개: 산술 25개, 게이지 14개, NS 23개, 관측·비교 I2 11개**입니다. 예제 수와 원문 기준 64개는 서로 다른 집계입니다. [정적 Worker 대조](evidence/static-worker-parity.json)에서는 예제 전부의 전체 수학 결과가 로컬 모듈과 일치했습니다. 기본 입력의 실행 상태는 **60 COMPLETED / 13 PARTIAL**입니다. PARTIAL은 짧은 게이지 앙상블 1개와 실제 구성 조건이 남은 NS 12개이며, 결과를 숨기거나 성공으로 바꾸지 않습니다.

| 영역 | 이번에 보강한 핵심 기능 | 예제 수 |
| --- | --- | ---: |
| 산술 P4–P6 | 실제 MW Frobenius, semilinear coefficient map, global Euler 연결, q-framing 및 실제 q-PD diagonal nerve, 비상수 tilt/Witt/sharp/θ, 표준 완비 torus AΩ와 순서 있는 비교 | 25 |
| 게이지 Y3–Y4 | 출처별 링크·곡률 오차, 고정 물리 부피의 모든 셀 적분, 비영 β 작은 격자의 독립 reference, reflection positivity 가정 대응, Gauss 절단·전달 연산자 오차 | 14 |
| NS N4–N5 | 실제 Picard·pulse·고정 core 잔차 비교, core continuation, 실제 공분산 적분·열 보상 응력·양의 역행렬·대표점 조립, exact PDE·curl·support 연산자 | 23 |
| I2 | 네 Δ 모드의 나란한 비교, 4D 관측 5종, 동일 τ의 물리·유사 좌표, 정수 기저 교체와 실제 i/r/h 추적, WebGL 점 경로와 CPU fallback | 11 |

## 2. M1의 빈 관측 보완

M1의 **등록 예제 59개 전체**에 원본 결과에 연결된 관측을 적용하고, v62 실제 브라우저에서도 59개 전체를 실행해 확인했습니다. 그중 기존에 점·선·화살표가 모두 비었던 **26개**에는 실제 행렬·기저·구간·검사 결과를 읽는 관측을 연결했습니다. 26개는 59개의 부분집합이며 별도의 새 수학 예제를 추가한 수가 아닙니다. [관측 목록](visualization/evidence/adapted-inventory.json)과 [소스 해시](visualization/evidence/source-hashes.json)에 각 대상과 적용 범위가 있습니다.

- 복합체의 chain group, 미분, kernel/image, Frobenius, filtration과 비교 사상을 행렬·관계 그림·정확한 표로 확인할 수 있습니다. 선택한 기저에는 실제 미분/Frobenius 열과 계산 가능한 비교 사상 열을 연결합니다. 영차원 모듈의 사상도 정확한 0 사상으로 표시합니다.
- 군의 실제 표현과 Lie 기저, NS의 실제 profile·스펙트럼·구간·검사 자료를 각 자료에 맞는 축으로 표시합니다. 공간 좌표, cochain 차수, p-adic valuation, 스펙트럼 인덱스와 단순 배치 좌표를 구별합니다.
- 소수 Atlas는 segmented tile의 정확한 범위와 미계산 부분을 나누어 표시합니다. 이전·다음 구간으로 이동하거나 새 구간을 계산할 수 있습니다. 잘린 tile에 표시되는 소수 개수는 원본 tile 전체의 개수라는 설명을 유지합니다.
- 완료 실행 두 개를 선택하면 호환되는 관측을 같은 카메라·축·색 범위로 비교합니다. 입력을 변경하면 이전 그림을 닫고, 과거 실행을 다시 선택하면 그 실행의 입력도 함께 복원합니다.
- 원본 수치표와 점 선택은 실제 결과 경로를 유지합니다. LOD는 전체 범위의 원본 인덱스에서 결정적으로 표본을 선택하며 계산 결과나 해시를 바꾸지 않습니다.

큰 정수와 유리수·유한환·형식 q의 정확값은 표와 JSON에 남습니다. 그림의 좌표나 Float32 표시 버퍼가 정확값을 덮어쓰지 않습니다. v62의 전체 브라우저 검사에서는 59번째 실행 뒤 첫 작업을 다시 선택하고 새 계산으로 재현해 `MATCH`를 확인했습니다. 실행 이력의 기존 32개 제한을 host에서 128개로 확장하고, 중복·상한 오류를 분리했습니다. 수학 Worker의 소스와 계산 예산은 유지합니다. v63은 새 작업이 시작되면 즉시 대기 관측을 표시하고 취소된 작업은 취소 상태를 표시하도록 보완했습니다.

## 3. 작업창 사용법

### 예제를 실행하고 결과를 읽기

1. M2 작업창에서 **산술 / 게이지 / NS / 관측·비교** 탭을 선택하고 예제를 고릅니다. 예제의 `{kind,input,precision,budget}` 요청이 편집기에 들어갑니다.
2. 입력 검사로 지원 범위와 자원 상한을 확인하고 계산을 실행합니다. 지원 범위는 각 도메인의 `getCapabilities()`와 원문 체크리스트에서 확인할 수 있습니다. 미지원 정밀도나 과도한 예산은 실제로 거절됩니다.
3. 결과의 상태, 남은 조건, 수학적 축과 단위를 먼저 확인합니다. 패널 선택으로 주 관측·행렬·구간·상관함수·잔여항 등을 바꾸고, 정확표 또는 선택값에서 원본 필드와 해시를 확인합니다.
4. 카메라 버튼·키보드·초기화·표시 예산을 사용합니다. 카메라 변경은 표현 revision만 바꾸며 새 수학 계산을 실행하지 않습니다.
5. 입력을 바꾼 뒤에는 새 계산을 실행합니다. 오래 걸린 이전 작업의 완료가 새 편집기나 선택을 덮어쓰지 않습니다. 실행 목록에서 과거 작업을 선택하면 해당 요청과 결과가 함께 복원됩니다.

`COMPLETED`는 선택한 입력의 구현된 계산이 완료됐다는 뜻입니다. `PARTIAL`은 계산된 값과 미해결 조건이 함께 있다는 뜻입니다. `UNSUPPORTED`, `PRECISION_REQUIRED`, `INPUT_CHANGED`, 취소·시간 초과에서는 성공한 것처럼 이전 데이터를 남기지 않습니다. τ=0은 blowup 관측의 경계 상태이며 무한한 값으로 그리지 않습니다.

### 비교 기능

**Δ 상태족**은 네 모드를 구분합니다. `ASSUMED_BOUND`는 하한 가정만 바꾸므로 원본 장이 유지됩니다. `UNITS`는 같은 물리 장을 다른 단위로 표현합니다. `EFFECTIVE_MODEL`은 명시한 고전 장과 별도 유한 spectral 모형을 각각 재계산합니다. `ENSEMBLE_ESTIMATE`는 β=Δ라는 명시한 규칙으로 실제 Gibbs chain을 생성합니다. 마지막 모드의 correlator 가로축은 Monte Carlo lag이며 물리 시간이 아닙니다. 양쪽은 카메라와 공통 색 범위를 공유하고 model/sample/observation hash를 분리합니다.

**4D 관측**은 x4 단면, 유한 scalar marginal, 균등 fibre의 조건부 평균, 열린 Wilson line, 닫힌 Wilson loop를 각각 계산합니다. 적분 구간·정규화·endpoint·gauge convention과 손실 정보를 표시합니다. scalar 적분은 connection으로 반환되지 않으며 비단사 관측에서 원본 4D 장을 복원하는 기능을 제공하지 않습니다.

**물리·유사 좌표**는 같은 유한 M1 후보와 같은 τ를 두 화면에서 관측합니다. 물리 시야는 프레임 전체에서 고정하고 radial/axial 확대율을 저장합니다. 고정 색은 전체 프레임의 공통 범위, 자동 색은 선택한 프레임 쌍의 공통 범위를 사용합니다. 이 후보의 유한 h는 원문의 극소 N3 지수와 별도 입력입니다. NS의 실제 core 관측은 원본 N3 receipt와 정확한 기호식을 사용하는 다른 예제입니다.

**기저 교체**는 `ORIGINAL`, `REVERSE`, `SHEAR`를 선택해 계산합니다. 정수 unimodular 변환 아래 D, Frobenius, i/r/h, filtration을 함께 옮깁니다. 선택 기저에는 실제 r/h 열, r-image별 i 열, 정확한 정수 조합 `i(r(b))`와 원본 계수 경로가 연결됩니다. 화면에서 기저의 위치가 달라도 계산된 cohomology와 Frobenius 불변량은 유지됩니다.

### 세션 저장·내보내기·재현

세션 저장은 작업을 시작한 **동일 세션·동일 revision**에서 발급된 실제 engine receipt를 요구합니다. 입력·결과·환경 해시와 현재 세션을 확인한 직후 Foundation의 동기 commit을 실행합니다. 저장 대상은 `FiniteComputationRecord`이며, 수학적 원본의 차원은 `sourceRecord.object`에 따로 남깁니다. adapter 저장의 근거 등급은 `NUMERICAL INDICATOR`이며 자동 `FORMAL PASS`가 아닙니다.

실행 목록은 메모리에 보관되므로 필요한 결과는 새로고침 전에 JSON으로 내보냅니다. 세션 기록과 전체 raw 결과의 재현 파일은 용도가 다릅니다. 내보내기에는 정규화된 요청, 전체 결과, 환경·Worker 해시와 재현 해시가 포함됩니다. 재현은 직렬화된 결과를 믿는 대신 같은 설치 환경에서 새로 계산한 결과를 비교합니다. 모든 해시를 다시 붙인 위조 결과라도 실제 재계산과 다르면 `MISMATCH`입니다.

세션이 바뀌거나 revision이 달라졌다면 기존 실행을 자동으로 다른 세션에 옮겨 저장하지 않습니다. 현재 세션에서 다시 실행해 새 출처를 가진 기록을 만듭니다. 실행·재현 중 새로 편집하거나 선택한 화면은 늦게 도착한 결과가 덮어쓰지 않습니다.

## 4. 도메인별 구현과 정확한 범위

### 산술 P4–P6: 24개 기준 PASS

Pⁿ의 finite-perfect 비교는 실제 generator와 Frobenius를 projective bundle 및 명시한 derived comparison 정리에 연결합니다. 모든 n에 대한 수학 명세와 화면 n=0..8 관측을 구별합니다. 타원곡선에서는 smoothness·bad/nonminimal prime 경계를 검사하고, 독립 유한체 점 열거와 직접 Monsky–Washnitzer reduction을 비교합니다.

MW backend는 good short Weierstrass curve, p≥5의 지원 범위에서 유리수 Frobenius 행렬을 직접 계산합니다. working/output precision, 실제 분모 감소와 생략항 valuation 하계를 저장합니다. p=2·3 및 extension-field MW는 미지원입니다. unramified coefficient ring의 Frobenius는 Hensel root로 구성하고, semilinear 곱과 `p^N>2B_j`를 만족할 때만 정수 특성다항식을 유일 복원합니다. MW의 rational cohomology 행렬을 integral prismatic complex 전체로 승격하지 않습니다.

q 비교는 단순 rank나 임의 contraction이 아니라 실제 q 미분, unit-triangular framing chain map 및 **q-PD diagonal envelope의 δ-relations·face·degeneracy·overlap**을 계산합니다. 유한 δ-depth·nerve 그림과 전체 완비 객체의 명세를 구별하고, 같은 입력의 regularity·smoothness·completion 조건을 원전의 descent/comparison 정리에 연결합니다. BK point의 u→0, u→π, u→πᵖ도 서로 다른 coefficient map으로 적용합니다.

Perfectoid 경로는 선택한 표준 완비 root tower·tilt·untilt와 source hash를 고정합니다. 비상수 tilt의 실제 연산, universal Witt polynomial carry, 정밀도 하계가 있는 sharp, θ와 ξ witness를 계산합니다. 표준 torus의 AΩ는 실제 Koszul/η 연산과 정리 적용 가정을 연결하고, étale·de Rham·crystalline 비교의 연산 순서를 보존합니다. 임의 completed element에는 Cauchy presentation과 오차 oracle이 더 필요하며, 유한 root level 자체를 perfectoid라고 분류하지 않습니다.

이 24 PASS는 지원 표준 대상의 알고리즘과 가정을 확인한 기존 정리 적용 범위입니다. 임의 perfectoid algebra, 일반 cup/E∞ certificate, RH/BSD 또는 새로운 Lean kernel 증명을 포함하지 않습니다. 수식·지원 상한·원전은 [산술 README](arithmetic/README.md)에 있습니다.

### 게이지 Y3–Y4: 16개 유한 기준 PASS

M1의 실제 14개 군 표현·완전한 Lie 기저로 4D 링크, Wilson 작용, 열린 경로와 닫힌 holonomy를 계산합니다. OPEN/PERIODIC 경계, 공간·시간 간격, gauge convention을 보존합니다. 고전장 transport·곡률 refinement에는 출처별 오차구간을 붙이고, 고정 물리 부피 refinement는 실제 링크와 **모든 셀**의 에너지·실수 Q를 적분합니다.

앙상블은 전체 군 proposal과 실제 이력을 사용하고 cold/hot 시작, 수락률, 자기상관·ESS·오차를 표시합니다. 독립 Haar/Bessel 한 링크 oracle과 비영 β 작은 격자의 독립 reference를 제공합니다. 기본의 짧은 앙상블은 ESS가 부족하여 계속 PARTIAL입니다. 유한 통계 구간은 선언한 확률 모형과 가정에 조건부이며 고정 PRNG를 수학적 독립성의 증명으로 사용하지 않습니다.

Reflection positivity는 선택한 작용·측도·군·경계·관측 대수의 가정 대응과 인수분해를 기록합니다. 원전의 SU(N) 정리 적용과 더 일반적인 compact/open 조건의 별도 유도를 구별합니다. 전달 연산자는 SU(2) OPEN 공간 cube의 전체 weight≤5 Gauss 절단 7개 상태와 실제 Gram companion을 계산하고, 누락 spectrum의 `q^6` 상계와 적분 오차를 함께 반환합니다. 한정된 예제로 무한 부피·연속체 양자장·질량 간극·일반 평형·정수 위상 섹터 혼합을 인증하지 않습니다.

`IMPLEMENTED_FINITE_SCOPE`를 원문 유한 acceptance의 PASS로 연결하되, 불충분한 해상도·ESS·허용오차·미지원 절단은 개별 실행에서 PARTIAL/UNSUPPORTED로 남깁니다. 상세 모델·원전·독립 oracle은 [게이지 README](gauge/README_KO.md)와 [원문 대응표](gauge/evidence/criterion-completion.json)에 있습니다.

### NS N4–N5: 원문 유한 기준 14 PASS, 실제 구성 2 PARTIAL

원래 cylindrical PDE를 exact differential polynomial로 미분해 n=1,2의 모든 ordered convolution과 pressure/viscosity shift를 검사합니다. 실제 N3 parameter graph, 공통 radial interval, 모멘트 보정용 실제 λ와 Ipos를 보존합니다. 원문 support mesh 전체에 대한 유리수 지지 분리와 2,250색 palette, fast/slow auxiliary chain rule도 계산합니다.

v64의 실제 core 계산은 원본 receipt와 양의 비선형 오차를 유지하면서, 요청한 정확한 유리수 Y·η에서 Φ·U·평균 U·압력과 혼합 미분을 다시 계산합니다. Y≤4의 원래 core와 4<Y≤4.1의 자연 연장을 구별하고, j0 정규화와 물리 X 미분의 배율을 표에 기록합니다. 96–512 bit 방향성 BigInt 구간에는 비교 급수의 나머지와 실제 비선형 해의 오차가 모두 남습니다.

실제 외곽 장은 3,785개 노드의 식 그래프와 양의 물리 배율을 보존합니다. weighted Ω 모멘트를 여섯 regular integral과 축 경계항으로 축소하고, 외곽 U/M/V의 구간을 표시합니다. 실제 n=1 배경은 공통 radial interval의 6성분과 source C1·Cauchy loss·기호적 tail을 연결하며, 실제 Imean pulse는 장·20개 slow jet·원문 성장 초기조건을 계산합니다. 이 버전은 아직 전체 continuation과 모든 고차 복구를 완료하지 않았습니다. [실제 계산의 범위와 독립 검증](navier/README_KO.md)을 함께 확인합니다.

이번에 완료한 조건부 gate는 다음과 같이 실제 원본 적용 조건을 분리합니다.

| 기준 | 완료한 연산 | 유지하는 원본 적용 경계 |
| --- | --- | --- |
| N4-06 | 제공한 모든 도함수 상수에 대한 cutoff doubling·전 q 구간 scalar 부등식 | 상수가 실제 repaired source profile에서 유도됐는지는 별도이며 `sourceDerivativeBoundsVerified:false` |
| N4-08 | supplied potential에 C∞ cutoff를 곱한 실제 합, exact compact active prefix 증명 | prefix가 부족하면 `localSum:null`; 실제 고차 N3 계수의 생성·tail 상수는 별도 |
| N5-07 | harmonic potential Cₘ의 전체 mixed jet 미분·rₘ·물리 Q 배율·원통 1/R·conjugate pair | generic smooth tangent coefficient 연산자이며 수치 probe를 실제 N3 growing pulse로 부르지 않음 |
| N5-08 | supplied complex interval jet의 전체 `(1−ψ)f+ψ′t` Leibniz 계산, 별도의 조건부 log envelope | local jet은 특정 ℓ/source family와 미결속; 실제 residual 대 envelope 비교 인증은 수행하지 않음 |

원본의 양수 `h=exp[-8002(exp(1048576)+10)]`를 0이나 수치 probe의 h로 대체하지 않습니다. v65의 실제 원본 유한 인증은 범위에 맞게 `sourceInstanceCertified:true`를 허용하지만, `allOrderSourceCertificate`, `fullSameProfileN4/fullSameProfileN5`, `formalComplete`는 false입니다. 실제 성장 pulse의 원래 초기조건·양의 Volterra 비교와 에너지 항등식·양 끝 Gaussian을 연결한 유한 영역 인증은 일반 ODE probe의 수치 refinement와 구분합니다. 자세한 설명은 [NS README](navier/README_KO.md)와 [유한 기준 재심사](navier/research/FINITE_CRITERIA_REAUDIT_KO.md)에 있습니다.

## 5. 완료한 4개 유한 기준과 남은 2개 PARTIAL

v65는 실제 원본의 인증된 유한 영역에서 N4-03, N5-04, N5-05를 PASS로 완료했습니다. 원문 기준 ID·제목·합격 문구·페이지는 유지했습니다. Picard certificate의 15개 조건, pulse의 21개 조건, 독립 계산과 실패 대조군을 공개합니다. 새 pulse 패널은 실제 x/P의 중점 약 0.353553을 표시하며 reference P의 중점 1과 구별합니다.

| 원문 기준 | v68까지의 실제 근거 | 기준 상태·남은 범위 |
| --- | --- | --- |
| N4-03 · 차수별 inner Picard | 같은 원본 n=1의 6성분 식, C1·공통 collar·strip loss·기호적 K tail, 양의 반경 관측과 15조건 certificate | **PASS** · 개별 유한 기준. 전체 K항 수치 materialization 및 모든 차수는 주장하지 않음 |
| N4-04 · 모멘트 복구 | 실제 core 전체 적분 21개, continuation U/M/V 구간 10개, reference 적분, 4,070-node A2 program과 양의 global remainder | **PARTIAL** · 실제 continuation debt를 수렴 계산하여 복구하고 다음 차수 입력에 연결 |
| N4-05 · 유한 배경 잔차 | 같은 실제 source의 고정 core에서 N=0/1 직접 PDE 잔차, 양의 radial/axial witness, 실제 C_N,m·N에 독립인 K_m, q·격자·bit 정련 비교 | **PASS** · N=0/1, m≤6의 고정 core 유한 기준. whole-profile·모든 차수는 주장하지 않음 |
| N5-04 · 위상·편극·주파수 | 실제 Imean source의 normal·K·frame·양의 determinant·원문 frequency 조건 | **PASS** · 인증한 source 영역의 유한 기준 |
| N5-05 · 성장·감쇠 ODE | 원래 left datum으로 구한 실제 homogeneous amplitude, 모든 적분 cell의 양의 비교, 정확 에너지·직교 identity와 양 끝 Gaussian | **PASS** · 실제 전체 pulse 경로의 유한 기준; 모든 slow box·forcing inverse는 별도 |
| N5-06 · 두 family covariance | 실제 두 family Hcov 적분, 열 보상한 같은 원본 T0,* 구간, 양의 weight, 대표점의 전체 활성 합과 정확한 (7.30) | **PARTIAL** · 전체 annulus에서의 실제 배경 norm·열 오차·Hcov 양의 역과 공통 q* |

v67의 `ns.actual-residual-order`는 원래 모멘트 보정이 정확히 사라지는 같은 inner core에서 두 차수의 배경을 직접 대입합니다. X∈[0,4·Xunit], η∈[−1,1], 모든 θ를 사용하고 Xunit은 N·q·격자·bit 수와 무관하게 고정합니다. q를 고정하면 τ=q(1−η²), z=q^Dη로 정의되는 시공간 집합입니다. N=0의 실제 norm 하한과 N=1의 해석적 norm 상한을 공통 양의 배율로 정규화해 비교하며, 그래프를 norm의 정확값으로 표시하지 않습니다. k=4,8,12,16에서 N=1 상한은 각각 1/16, 1/256, 1/4096, 1/65536이고 N=0 witness 하한은 19보다 큽니다. 실제 C_N,m, K_m=2+m, 48개 성분 행, 4개 격자와 3개 산술 정밀도의 비교를 7개 패널에 보존합니다. 고정 source 오차 바닥을 bit 정련으로 없애지 않으며, q나 X의 binary64 underflow를 0으로 대입하지 않습니다. [잔차 증명과 적용 범위](navier/research/ACTUAL_RESIDUAL_ORDER_KO.md), [봉인된 독립 검증 목록](navier/actual-residual-order-manifest.json)을 연결합니다.

v66의 `ns.actual-covariance-matching`은 실제 angular 평균 1/2와 transverse 질량을 한 번씩 적용한 Hcov, 같은 source의 열 보상 T0, 양의 제곱 진폭과 정확한 두 열 역을 계산합니다. Gaussian 중심의 256개 cell과 양의 무한 tail을 보존하며 8개 패널에서 구간·행렬·적분 밀도·cutoff·활성 합·항등식을 볼 수 있습니다. 대표점에서는 전체 활성 band·box를 판별하여 같은 box를 한 번만 합산한 물리 배율의 (7.30)을 정확히 확인합니다. 이 대표점의 성공은 전체 annulus에 대한 공통 q*와 양의 역의 균일 보장으로 승격하지 않습니다.

공분산 균일 역에 관한 별도 부분 명제는 실제 source cone에서 목표 변화와 H 열 오차가 명시한 상계 안에 있으면 determinant와 양의 역이 유지됨을 exact Bernstein 계산과 독립 Python으로 확인합니다. 그 상계를 전체 annulus의 실제 source에서 생성하는 작업은 N5-06의 남은 조건입니다. 추가로 봉인한 [leading 고차 미분 상계](navier/research/ACTUAL_LEADING_HIGH_JETS_KO.md)는 Node 12개·독립 Python 573개 검사를 통과했지만 위 195/8,325의 릴리스 합계에는 포함하지 않았으며, n1 복구·flat-edge 방향·공통 q*의 완료로 승격하지 않습니다.

현재 `fullM2Complete:false`는 유지합니다. 원문 세부 진행 기록은 [원문 상태 대조](evidence/original-status-delta.json)와 [PROOF_OBLIGATIONS_KO.md](navier/PROOF_OBLIGATIONS_KO.md)에 있습니다.

## 6. 검증 결과와 렌더링 범위

| 검증 묶음 | 현재 결과 | 근거 |
| --- | --- | --- |
| 산술 | Node **42 / 42 PASS**, 독립·음성 대조 포함 | [acceptance](arithmetic/evidence/acceptance.json) |
| 게이지 | Node **45 / 45 PASS**: 계산·관측 42 + Worker 3; 별도 독립 인증 **171개**와 원본 링크 대조 **5개** 통과 | [criterion completion](gauge/evidence/criterion-completion.json), [독립 인증](gauge/evidence/certification-independent-validation.json), [링크 대조](gauge/evidence/independent-validation.json) |
| NS | Node **195 / 195 PASS**, 독립 Python **8,325개** 통과: v66의 4,967 + 실제 잔차 1,544 + 공분산 균일 역의 부분 명제 1,814 | [acceptance](navier/evidence/acceptance.json) |
| 루트 통합 | **5 / 5 PASS**: 전체 Worker 대조·panel 원본 경로·WebMCP·요청 경계 | [v68 통합 검사](evidence/v68-integration-tests.tap), [73예제 parity](evidence/static-worker-parity.json) |
| 엔진·세션 결속 | **25 / 25 PASS**: 소스·입력·결과·runtime 재현, 위조 환경 거부, 세션 revision 경계 | [v67 core 기록](evidence/v67-core-tests.tap) |
| 공통 시각화·I2·renderer | **23 / 23 PASS**: 시각화 10 + I2 12 + renderer 경로 1 | [시각화 테스트](visualization/visualization.test.mjs), [I2 테스트](observatory/tests/observatory.test.mjs), [renderer 테스트](observatory/tests/render-paths.test.mjs) |
| 공통·실제 소스 관측·M1 host | **68 / 68 PASS**: 공통 시각화 10, 이전 실제 관측·host 51, 새 잔차 7; 좁은/넓은 화면의 범례 간격 포함 | [v68 시각화 검사](evidence/v68-visualization-tests.tap) |
| M1 관측 | 등록 **59개 전체 브라우저 실행**, 기존 빈 관측 **26개** 보완, 첫 작업 재현 MATCH | [v62 전체 audit](evidence/v62-m1-catalog-audit.json), [v63 상태 검사](evidence/v63-m1-state-audit.json) |
| 정적 산출물 | M2 **73예제 전부 source/Worker mathematical hash 일치** | [static Worker parity](evidence/static-worker-parity.json) |
| 실제 브라우저·최종 게시 | 게시 버전별 실행·입력 변경·저장·재현·탐색·성능을 별도 기록 | [live release](evidence/live-release.json) |

검사 수, 예제 수, 기준 수는 별도로 집계합니다. Worker parity는 `executionMetrics`만 제외한 전체 수학 결과와 상태의 일치이며, PARTIAL 결과가 두 경로에서 정확히 같아야 하는 검사도 포함합니다. 오래된 Worker 바이트로 새 source를 실행했다면 이 검사는 실패해야 합니다.

현재 저장소의 **M2 Worker 빌드 SHA-256**은 다음과 같습니다.

```text
d08ad2f103e6e225ef2a3768854ff32be74246e4fc5b75dada921a8587f77191
```

이 해시는 로컬 최종 Worker 바이트와 source/Worker parity 기록의 값입니다. 실제 게시된 Worker의 최종 확인은 라이브 릴리스 기록과 대조합니다.

### 브라우저와 Node의 수치 재현 범위

v68 로컬 모듈과 별도 Node Worker는 같은 Node 런타임에서 73/73 수학 해시가 정확히 일치합니다. 다음은 보존한 **v61의 64예제 교차 런타임 검사**이며 현재 신규 예제의 집계가 아닙니다. 당시 Chrome과 Node를 비교하면 **52/64는 동일하고 12/64는 다릅니다**. 그 12개 전체 결과를 재수집해 대조한 결과, 정규화 입력·판정·boolean·키·타입·배열 길이는 같고 차이는 수치 및 그 수치가 들어간 해시·표시 문자열에 있었습니다. 이번 비교의 최대 절대 차이는 약 **3.0653×10⁻¹¹**입니다. 일부 경로에서는 동일 입력의 `Math.exp(-0.375)` 값이 1 ULP 다름을 확인했고, 잔여 경로의 첫 primitive까지 모두 격리했다고 주장하지 않습니다. [교차 런타임 수치 대조](evidence/cross-runtime-comparison.json)와 압축 원본·leaf 차이를 보존합니다.

v61은 환경 schema를 `MathScope.M2Environment/2`로 올리고, 호출 런타임의 Node/V8 또는 브라우저 식별 정보와 고정 **18개 Math 함수의 IEEE754 결과**를 환경 해시에 포함합니다. 수학 결과는 반올림하거나 차이 항목을 빼지 않고 계속 정확하게 해시합니다. 유한 fingerprint는 모든 런타임에서의 동등성 증명이 아니며, 외부 workerFactory의 실제 프로세스도 원격 인증하지 않습니다. 다른 환경의 번들은 재현 실행 전에 거부하고, 같은 환경도 실제 재계산의 전체 수학 해시가 일치해야 `MATCH`입니다. 과거 v1 환경의 JSON은 보존되지만 v2 환경으로 조용히 승격하여 재현하지 않습니다.

### WebGL과 CPU를 확인한 방법

WebGL 경로는 실제 `packMarks` 버퍼의 표시 좌표·반경·색을 rasterize하고, 정확표·점 선택·CPU 투영은 공통 원본을 사용합니다. WebGL context가 없거나 손실되면 CPU Canvas2D로 전환합니다.

이번 클라우드 브라우저에서는 WebGL context를 생성할 수 없어 **실제 브라우저는 CPU fallback으로 검증**했습니다. 나란한 카메라, 키보드·초기화, 입력 변경, 선택·표·재현과 p95 조작 지연의 관측은 브라우저 audit의 환경·범위를 따릅니다.

실제 GLSL과 버퍼·raster는 별도 **native offscreen EGL/OpenGL ES, Mesa llvmpipe software renderer**에서 검사했습니다. 저장된 [shader/raster audit](evidence/gpu-shader-raster-audit.json)은 6,000점·30회 측정 p95 약 **5.17ms**, 최대 Float32 표시좌표 오차 약 **0.0000244px**, 중심색 최대 오차 **1/255**와 이동시킨 잘못된 shader 거부를 기록합니다. 이는 물리 GPU나 해당 브라우저의 WebGL 실행 측정이 아닙니다. JS API fixture의 WebGL 분기 검사, 독립 GLES raster 검사, 실제 브라우저 CPU 검증을 각각 구별합니다.

## 7. 소스·증거·해시 구조

| 경로 | 역할 |
| --- | --- |
| `arithmetic/` | `mw-frobenius.mjs`, `unramified-frobenius.mjs`, `qpd-nerve.mjs`, `tilt-arithmetic.mjs`, `perfectoid-comparisons.mjs` 등 실제 산술과 theorem application |
| `gauge/` | `lattice.mjs`, `transport-certificates.mjs`, `volume.mjs`, `ensemble.mjs`, `reference.mjs`, `reflection.mjs`, `transfer.mjs` |
| `navier/` | `source-algebra.mjs`, `source-background.mjs`, `source-core-observations.mjs`, `source-gluing.mjs`, `source-pulse-curl.mjs`, `source-tail.mjs` 및 원본 parameter binding |
| `observatory/` | Δ·4D·blowup 상태족과 `complex-basis.mjs`의 정확한 기저 운반 |
| `visualization/` | M1/M2 관측 adapter, 행렬·구간·비교 패널, renderer, `webgl-marks.mjs`, M1 관측 도구 |
| `core/` | domain registry, 취소·시간 제한·receipt/replay engine, static Worker entry, Foundation 세션 결속 |
| `workspace.mjs`, `webmcp.mjs` | 작업창·비동기 입력/선택 보호·탐색 및 브라우저 도구 계약 |
| `evidence/original-m2-criteria.json` | 사용자 원문 64개 ID·제목·합격 문구·페이지 |
| `evidence/m2-criteria-status.json`, `evidence/original-status-delta.json` | 현재 62/2/0 및 Git 기준점과의 원문 불변·상태 변화 |
| 도메인별 `evidence/` | 실제 실행 결과, 독립 oracle·음성 대조, 테스트 출력과 source SHA |
| `build-manifest.json`, `page-patches.json`, `evidence/assembly-audit.json` | 정적 모듈 그래프·번들·순서 있는 정확한 anchor 패치와 조립 검사 |
| `evidence/baseline-v54-read-projection.html.gz` | 재현 가능한 v54 provider read projection, deterministic gzip mtime=0 |
| `evidence/live-release.json` | 최종 게시와 실제 브라우저 검증, runtime Worker 해시·스크린샷·관련 audit의 위치 |

`workerSha256`는 실행 코드, `inputHash`는 정규화된 요청, `resultHash`는 전체 결과를 묶습니다. `mathematicalHash`는 최상위 `executionMetrics`만 제외합니다. `modelHash`, `sampleHash`, `ensembleHash`, `historyHash`, `observationHash`는 각 도메인의 실제 정의를 따릅니다. 수학 자료의 `sourceHash`와 소스 코드 파일의 SHA-256은 서로 다른 범위이며, 관측 변경·LOD·카메라가 원본 모형이나 표본의 해시를 바꾸지 않습니다.

사용자 Blueprint의 SHA-256은 다음과 같습니다.

```text
f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac
```

원문 범위는 I2 pp.17–18, P4–P6 pp.27–32, Y3–Y4 pp.41–44, N4–N5 pp.57–60입니다. 인수인계의 과거 **M1 64/64 + M0 잔여 6/6 = 70/70**은 그 기록의 검증 묶음이며 현재 M1 등록 예제 59개나 M2 원문 64개의 개수가 아닙니다. 과거 61/7/2와 69/1 평가, 기존 NS 개별 fixture의 PARTIAL도 날짜와 범위를 유지합니다.

N1-06의 실제 원본 Comparator 성공 terminal은 [상속된 검증 기록](evidence/m1-inherited-comparator-audit.json)에 원본 ZIP·로그 해시와 함께 보존합니다. 이 작업에서 원본 Comparator를 새로 실행했다고 표시하지 않습니다. 산술·NS의 이전 예제 evidence도 각각 `arithmetic/evidence/history/`, `navier/evidence/historical-v0.1.1/`에 보존합니다.

배포 provider가 읽어 주는 HTML에는 기존 및 새 inline script의 일부가 가려질 수 있습니다. `originalReadProjectionSha256`·`candidateReadProjectionSha256`는 **provider read projection의 해시**, `bundleSha256`·`visualizationSha256`는 **로컬 빌드 digest**입니다. 독립적으로 읽은 완전한 라이브 HTML의 digest로 부르지 않습니다. 원본 전체를 가려진 projection으로 덮어쓰지 않고 승인된 정확한 부분 패치를 사용하며, runtime Worker 해시는 브라우저에서 별도로 확인합니다. `baseVersion`과 최종 게시 버전도 구분합니다.

## 8. 빌드와 재현 명령

명령은 저장소 루트에서 실행합니다. 작성 환경은 Node.js 24.19.0, Python 3.12.14입니다. 수학 모듈과 Worker는 정적 모듈 그래프를 사용하며 브라우저 실행 중 외부 코드를 내려받지 않습니다. 독립 게이지 검사는 Python NumPy, 독립 NS 고정밀 검사는 표준 라이브러리의 Decimal·Fraction을 사용합니다. NS evidence generator는 내부에서 `python` 실행 파일을 호출하므로 `python`과 아래의 `python3`가 같은 Python 3 환경을 가리키는지 확인합니다. GLES 검사는 시스템 EGL/OpenGL ES/Mesa가 있는 환경에서 별도로 실행합니다.

### 빌드와 전체 Node 검사

```sh
python3 research-ide/mathscope-m2/build_m2.py
python3 research-ide/mathscope-m2/tests/check_assembly.py

node --test \
  research-ide/mathscope-m2/arithmetic/tests/*.test.mjs \
  research-ide/mathscope-m2/gauge/tests/*.test.mjs \
  research-ide/mathscope-m2/navier/tests/*.test.mjs \
  research-ide/mathscope-m2/core/tests/*.test.mjs \
  research-ide/mathscope-m2/visualization/*.test.mjs \
  research-ide/mathscope-m2/observatory/tests/*.test.mjs \
  research-ide/mathscope-m2/tests/*.test.mjs
```

위 명령에는 표의 현재 검증 묶음 외에 기존 core receipt/replay/세션 회귀 테스트도 포함됩니다. 단독으로 전체 73예제 source/Worker 대조와 공통 panel 경계를 다시 확인하려면 다음을 실행합니다.

```sh
node --test research-ide/mathscope-m2/tests/integration.test.mjs
```

기본 빌드는 저장소의 압축 baseline을 읽습니다. 압축을 푼 기준 SHA-256은 `7bdf4cd11e35ab021d4d5686cdbdd709062f3675635eba523be6f16fbc7de948`이며 일치하지 않으면 중단합니다. 두 Python 명령은 같은 기준의 일반 HTML 또는 gzip 파일을 첫 번째 인수로 받을 수도 있습니다. 다른 페이지 버전을 쓰려면 기준과 패치 anchor를 새로 검토해야 합니다.

빌드는 `prepare-evidence.mjs`로 원문 상태를 모으고 Worker·UI·관측 번들, 해시와 `page-patches.json`을 생성합니다. candidate HTML은 시스템 임시 파일에만 기록하며 `candidateTemporaryPath`로 경로를 출력합니다. 조립 검사는 보존된 baseline에 패치를 메모리에서 다시 적용하여 anchor 유일성·해시·DOM ID·기존 Worker 보존을 확인하므로 과거 scratch 경로나 임시 candidate 파일에 의존하지 않습니다.

README·상태 문서만 바꾼 경우와 수학 runtime을 바꾼 경우를 구분합니다. runtime 수정 뒤에는 마지막 source로 Worker를 다시 빌드한 후 parity를 검사합니다. 빌드 성공만으로 수학 테스트나 라이브 검증을 대신하지 않습니다.

### 도메인 evidence와 독립 대조 재생성

아래 명령은 해당 evidence 파일을 다시 씁니다. 대상 source를 확정하고 실행 범위를 확인한 뒤 사용합니다.

```sh
node research-ide/mathscope-m2/arithmetic/tests/record-evidence.mjs

node research-ide/mathscope-m2/gauge/tests/generate-certification-evidence.mjs
python3 research-ide/mathscope-m2/gauge/tests/independent-certification.py
node research-ide/mathscope-m2/gauge/tests/generate-evidence.mjs
python3 research-ide/mathscope-m2/gauge/tests/independent.py
node --test research-ide/mathscope-m2/gauge/tests/worker.test.mjs

node research-ide/mathscope-m2/navier/tests/generate-evidence.mjs
python3 research-ide/mathscope-m2/tests/gpu_raster_audit.py
```

NS generator는 source·core·conditional contract의 독립 Python 대조와 51개 Node 검사를 함께 실행합니다. 기존 source binding을 다시 생성할 때는 `navier/tests/build-source-binding.py`, `build-source-core-binding.py`가 참조하는 원본 여섯 파일·accepted assembly/core의 SHA를 먼저 확인합니다. 원본 자료를 새 예제 값으로 치환하지 않습니다.

core 세션 검사는 실제 Foundation provider projection에서 발췌한 validator/commit 계약, 위조 receipt·환경 변조·비동기 revision 경쟁·rollback을 사용합니다. 별도 Node Worker는 게시용 Worker 바이트를 실행합니다. 실제 브라우저의 DOM·다운로드·저장·runtime 해시와 상호작용은 최종 배포 후 별도 audit에 기록합니다.

## 9. 다음 확장 절차

1. 원문 criterion ID·문구·페이지를 유지하고 새 입력 대상, 계산 범위, 정리 가정과 정밀도 상한을 먼저 정의합니다. M0/M1 보호 소스와 기존 evidence는 보존합니다.
2. 실제 계산을 해당 도메인의 `run`/`runJob`, `validate`/`validateRequest`, `getExamples`, `getCapabilities`, `getChecklist`에 연결합니다. 요청·취소·budget 계약을 유지합니다.
3. 그림과 정확표를 실제 결과 필드에서 만듭니다. 축의 타입·단위·변환·물리/데이터 차원, source 경로·해시·손실 정보를 기록하고 입력 변경·실패·정밀도 부족에서 오래된 관측을 비웁니다.
4. 구현을 반복하는 테스트와 별개로 독립 oracle, 잘못된 공식·입력·출처·상태를 거부하는 대조군을 추가합니다. 일반 정리를 적용한다면 실제 입력 construction에서 가정을 확인하고 원전의 정확한 적용 범위를 기록합니다.
5. 기준별 잔여 의무와 evidence를 갱신합니다. 다음 NS 작업은 [남은 6개 의무](navier/PROOF_OBLIGATIONS_KO.md)의 실제 함수·상계부터 연결합니다. 조건부 scalar PASS만으로 실제 source certificate를 true로 바꾸지 않습니다.
6. source를 확정한 뒤 정적 Worker/UI를 빌드하고 조립·전체 source/Worker parity·관련 도메인·세션/replay·관측 검사를 실행합니다. 정확한 patch anchor로 게시하고, 최종 버전의 브라우저 결과·runtime Worker 해시·시각화·입력 변경·저장·내보내기·재현·탐색을 `evidence/live-release.json`에 연결합니다.

새 Lean 증명이나 외부 verifier가 필요한 기능은 실제 proof source·가정·버전·검증 실행 결과를 별도로 보존해야 합니다. adapter 결과와 직렬화된 JSON은 그 증거를 대신하지 않습니다.
