# MathScope M3 검토 보고서 — P7 제외

> **이번 검토의 최종 판정: 원래 56개 기준 중 31개 완료, 20개 부분 완료, 5개 OPEN.** 작성 시각은 2026-10-12T07:53:01+00:00이다. 공개 화면의 실제 20개 확인 결과와 최신 진행표를 반영했다. 전체 M3 또는 모든 원래 기준을 완료했다고 판정하지 않는다. 아래의 실제 Lean CI, 로컬 검사와 공개 화면 검증은 각각의 범위로 제시하며, 이 보고서가 포함될 새 commit의 CI를 이미 통과한 것으로 주장하지 않는다.

> **범위 이력:** 이 문서는 P7 제외로 진행한 **v91 checkpoint의 56개 기준**을 보존한다. 이후 사용자는 P7을 포함한 전체 64개 M3 기준으로 범위를 확대했다. 후속 구현·평가는 새 단계에서 다루며, 이 표에 P7을 소급 추가하거나 완료 처리하지 않는다.

## 1. 요청 범위와 판정 기준

이번 검토 대상은 **Y5·Y6·Y7·N6·N7·N8·P8의 각 8개, 총 56개 원래 기준**이다. 사용자가 제외한 P7은 완료 수에 넣지 않았다. P8이 승계한 P7 검사 기록은 출처로만 참조하며 P7의 미완료 증명이나 상태를 새로 완료 처리하지 않는다.

기준 원본은 `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf`이고 SHA-256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이다. 기존 기준 JSON에 적힌 `005314` 파일명은 같은 SHA-256의 PDF를 가리킨다. 원래 ID·제목·본문·쪽수는 [ORIGINAL_M3_M4_CRITERIA.json](ORIGINAL_M3_M4_CRITERIA.json)과 비교했으며, 56개 모두 공백 차이를 제외하고 일치했다. 아래 표에서는 PDF 줄바꿈을 공백으로 폈고 수식·요구사항은 바꾸지 않았다.

`originalCriterionComplete=true`를 완료 집계의 유일한 기준으로 삼았다. `PASS` 또는 `COMPLETE_WITHIN_STATED_SCOPE`는 **그 행에 적힌 한정된 합격 조건**이 충족됐다는 뜻이다. 예를 들어 Y7-06/07은 continuum proof 의무를 분리하고 `OPEN_CONTINUUM`을 유지하는 기능이 기준이므로, 그 기능의 완료와 Yang–Mills 문제의 해결은 다른 판단이다. `PARTIAL`은 실제 구현·검사가 있지만 원래 요건 일부가 남은 상태, `OPEN`은 핵심 구성이 아직 없는 상태, `PENDING_UI_VERIFICATION`은 현재 게시본에서 상호작용의 최종 증거가 남은 상태다.

원문에 있는 ‘설계 문서 작성 턴’ 설명은 그대로 보존했다. 그 문장을 이번 구현 턴의 실행·게시 증거로 바꾸어 읽거나, 이번 턴의 실제 실행을 무조건 미실행으로 덮어쓰지 않는다. 원래 요구사항과 현재 증거의 상태를 별도 열에서 판단한다.

## 2. 패키지별 최종 집계

| 패키지 | 범위 | 원래 기준 수 | 완료 | 미완료 | 현재 status 분포 |
|---|---|---:|---:|---:|---|
| Y5 | Δ별 장·스펙트럼·앙상블 | 8 | 5 | 3 | COMPLETE_WITHIN_STATED_SCOPE 5, PARTIAL 3 |
| Y6 | 원본에 연결된 관측·시각화 | 8 | 8 | 0 | COMPLETE_WITHIN_STATED_SCOPE 8 |
| Y7 | 유한·조건부 Lean 연결 | 8 | 8 | 0 | COMPLETE_WITHIN_STATED_SCOPE 8 |
| N6 | 국소 보정 반복 | 8 | 0 | 8 | OPEN 2, PARTIAL 6 |
| N7 | Localization·force·전역화 | 8 | 0 | 8 | PARTIAL 5, OPEN 3 |
| N8 | 수치 실행·오차·재현 | 8 | 3 | 5 | PASS 3, PARTIAL 5 |
| P8 | 구조·비교·인증·검토 통합 | 8 | 7 | 1 | PASS 7, PARTIAL 1 |
| **합계** | **P7 제외** | **56** | **31** | **25** | COMPLETE_WITHIN_STATED_SCOPE 21, PARTIAL 20, OPEN 5, PASS 10 |

현재 공개 사이트의 작업 공간은 다음 경로에 연결된다. 실제 선택·표시·재열기 검증은 §3.6의 원본 UI receipt에 연결했다. 이 화면 검증과 원래 수학 요건의 완료 판정은 별도로 관리한다.

| 작업 공간 | 공개 경로 | 역할 |
|---|---|---|
| Gauge | [Y5](https://project29770.websitepublisher.ai/v0.3.1.html#research-gauge-m3/Y5) · [Y6](https://project29770.websitepublisher.ai/v0.3.1.html#research-gauge-m3/Y6) · [Y7](https://project29770.websitepublisher.ai/v0.3.1.html#research-gauge-m3/Y7) | Δ 모드·원본 관측·스펙트럼·Lean 기록 |
| Navier | [N6](https://project29770.websitepublisher.ai/v0.3.1.html#research-fluid-m3/N6) · [N7](https://project29770.websitepublisher.ai/v0.3.1.html#research-fluid-m3/N7) · [N8](https://project29770.websitepublisher.ai/v0.3.1.html#research-fluid-m3/N8) | 보정 의존성·localization 관문·Galerkin 수치 실행 |
| Arithmetic P8 | [P8 구조·검토](https://project29770.websitepublisher.ai/v0.3.1.html?p8=P8-02#research-m3-p8) | 실제 M2 구조·비교 사상·finite certificate·review packet |

## 3. 이번 구현으로 실제로 가능한 일

### 3.1 Gauge: 원본 장, 관측, 유한 스펙트럼과 새로운 소규모 chain

Δ를 바꿀 때 ‘가정만 변경’, ‘단위만 변경’, ‘명시한 유효모형의 실제 장 변경’, ‘실제 ensemble 추정’을 분리한다. 가정 모드에서는 A/F와 sample hash를 보존하고, 유효모형에서는 원래 Lie 행렬 기저의 BPST 및 perturbation을 실제로 계산한다. 고정 좌표에서 달라지는 A/F·길이·density와 단순 표시 단위의 변화가 섞이지 않는다. 유효 스펙트럼은 명시한 유한 모델과 model assumption ID에 연결되며, 이 연결을 양자 Yang–Mills의 구성 정리로 올리지 않는다.

실제 SU(2) Wilson chain을 target/beta별로 생성하고 cold·Haar-hot 초기화, 저장 sample, connected correlation, block bootstrap, GEVP와 channel mass를 제공한다. target 값과 측정값이 같도록 강제하지 않으며, C(t)≤0 또는 불가능한 acosh 입력은 null과 실패 이유로 남긴다. 저장 production sample의 상관함수 재계산과 새로운 작은 chain 실행을 구분한다. 현재 물리 척도의 독립 측정으로 목표 Δ를 찾은 calibration, 제어된 plateau/전체 vacuum 문제, 같은 물리량의 a/L/T sweep는 여전히 Y5-05/06/08의 미완료 조건이다.

실제 저장 links의 x4 절단, at가 곱해지는 marginal, 시간 평균, configuration 평균을 서로 다른 연산자로 제공한다. SU(2)/G2의 비정상 Wilson flow는 전체 Lie 기저와 실제 불변 Gram metric에서 계산하며 원본과 flowed source hash를 나눠 보관한다. step-halving 및 gauge covariance 검사는 유한 수치 solver의 검사이고 continuum flow의 전역 오차 증명은 아니다. 관측 선택은 원래 4D 좌표·links·F·configuration fibre로 돌아간다.
증거: [E001](gauge/field-family.mjs) · [E002](gauge/ensemble-family.mjs) · [E003](gauge/lattice-observation.mjs) · [E004](gauge/wilson-flow.mjs) · [E005](gauge/evidence/runtime-audit.json) · [E006](gauge/tests/gauge-m3.test.mjs) · [E007](gauge/tests/lattice-observation-flow.test.mjs)

### 3.2 N6: 원래 source의 고정 moment inverse 의존성을 연결

M2 final/common-source-6/numerical-source-4의 receipt와 실행 source를 고정한 뒤, 원래 mean patch 함수를 그대로 불러오는 경로를 만들었다. 단순히 유사한 작은 상수로 대체하지 않고 다음 원래 매개변수 표현을 보존한다.

\[
T=e^{1048576}+10,\qquad \lambda=e^{-1000T}>0,\qquad h=e^{-8002T}>0.
\]

이 경로는 다섯 disjoint smooth profile의 전체 support, 양의 power-integral enclosure, angular inverse, λ를 인수로 분리한 axial determinant/inverse를 계산한다. 표현 불가능할 만큼 작은 양수를 Float64의 0으로 바꾸지 않는다. 0을 포함하는 외부 enclosure의 끝점은 실제 매개변수가 0이라는 뜻이 아니다. 별도의 λ=0.2 수치 fixture는 설명된 유한 예제로 유지하며 원래 λ의 계산으로 대체하지 않는다.

이것은 **고정한 역연산자 의존성의 실제 source 연결**이다. 아직 현재 full-curl 상태의 P·Jθ·Jz를 계산해서 이 map으로 보정하고, (8.12)의 압력을 복원하고, 원래 상수의 j=0 상태를 완성한 것은 아니다. 따라서 N6-06은 PARTIAL이고 N6-01 및 N6-08은 OPEN이다. 유한 residual identity, harmonic 생성·truncation 관문, signed covariance inverse, zero auxiliary mean inverse, 정확 유리수 차수 장부도 구현했지만, 이 보조 계산을 전체 원문 보정 반복의 완료로 계산하지 않았다.
증거: [E008](navier/source-inheritance.json) · [E009](navier/source-mean-map.mjs) · [E010](navier/evidence/N6-source-mean.json) · [E011](navier/corrections.mjs) · [E012](navier/README_KO.md)
원래 수식 출처는 [Navier–Stokes 원문 PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이며, 이번 연결은 해당 원문의 §7–10 및 고정된 M2 구현을 대조했다.

### 3.3 N7: 조건과 교차항을 보존하는 관문, 실제 전역 해는 미완료

cutoff는 r²와 z에 매끄러운 형태로 두며 `curl(cA)=c curl A+∇c×A`의 교차항을 없애지 않는다. force는 divergence-free일 필요가 없다는 원문 조건을 보존하고, pressure 식에서 div f를 제외하지 않는다. 임의 Leray projection으로 force를 바꿔 compact support·pressure 조건을 훼손하는 처리를 허용하지 않는다.

유한 terminal-jet bound를 조건으로 받은 force extension 일정과 disjoint periodization/동일 force·data/pressure 관문은 동작한다. 그러나 실제 N6 local field가 없으므로 원래 terminal Fj, 고정 K 전체의 energy balance, e0의 양의 하한과 명시 remainder를 가진 blowup 경로는 아직 구성되지 않았다. t>1 force extension을 velocity의 smooth extension으로 설명하지 않는다.
증거: [E013](navier/localization.mjs) · [E014](navier/evidence/N7-workbench.json) · [E015](navier/evidence/N7-periodic.json)

### 3.4 N8: 실제 일반 Galerkin solver와 독립 수치 비교

2π-periodic Fourier–Galerkin branch에서 retained-mode convolution, Leray projector, 별도 zero mode, Hermitian symmetry와 pressure의 div f 항을 처리한다. 직접 convolution과 독립 radix-2 3D FFT를 비교하고, high-mode aliasing을 의도적으로 넣으면 검출한다. diffusion에는 IMEX를 사용하며 CFL, step-doubling local error, energy defect로 step을 승인한다. 이 일반 주기 branch를 논문의 whole-space singular source 해와 동일시하지 않는다.

현재 유한 검사 36개와 예제 11개의 재현이 통과했고, NumPy가 새 JS Fourier 출력을 별도로 계산해 4개 비교를 통과했다. 직접/FFT의 정규화 오차는 약 1.67×10⁻¹⁶, NumPy 대 JS 직접/FFT는 약 1.35×10⁻¹⁶/1.79×10⁻¹⁶이다. Taylor–Green 시간 반분의 관측 차수는 2.00471 및 2.00117이다. 이 수치는 이 유한 fixture의 비교값이며 모든 입력의 rigorous PDE error bound는 아니다.

τ=10⁻²,10⁻⁴,10⁻⁸,10⁻¹²와 10⁻⁴⁰,10⁻¹⁰⁰⁰은 양의 정확 십진 표현으로 유지한다. 표시 t가 1로 반올림돼도 τ>0 계약이 사라지지 않는다. 다만 실제 논문 normalized velocity·pulse resolution·coefficient order·전 차수 tail을 계산한 precision mode는 남아 있다.

일반 solver의 실제 81개 spatial sample과 velocity, energy/time 곡선은 실행 hash에 연결한다. 표시 계약은 실제 z=0 plane의 bounds, 전체 선언 domain, 색 범위, 적용한 vector multiplier 0.3, camera/LOD/selection을 수학 결과와 분리해 보관하고 재검증한다. 이는 source 경로의 streamlines/particle trajectories 또는 core/global energy를 모두 완성했다는 뜻은 아니다.
증거: [E016](navier/galerkin.mjs) · [E017](navier/evidence/acceptance.json) · [E018](navier/evidence/independent-numpy.json) · [E019](navier/evidence/N8-nearT.json) · [E020](navier/index.mjs) · [E021](web/extended-view-contract.mjs) · [E022](web/tests/extended-worker.test.mjs)

### 3.5 P8: 실제 구조·비교·유한 인증과 Canvas2D fallback

네 구조 view는 실제 M2 결과의 basis/matrix/slopes/local factors/root prefix에서 생성된다. 점·사상을 선택하면 해당 exact 값과 source 경로를 확인할 수 있으며, 누락된 구조를 임의 예제 좌표로 채우지 않는다. 비교 diagram은 각 node의 coefficient ring/base 및 edge의 필요한 가정을 유지하고, 제거된 가정에 따른 무효 사상을 STALE 점선으로 표시한다.

WebGL이 비활성인 환경의 실제 blocker를 해결하기 위해 같은 정규화된 좌표의 Canvas2D 3D 투영을 추가했다. 키보드·선택·zoom·LOD·directed/dashed 선·DPR resize·경로 복귀 시 camera 복원을 지원한다. 실제 model을 동결한 mount 회귀 7개와 source model 회귀 9개를 별도로 통과했다. recording Canvas context를 사용한 로컬 테스트와 live browser에서 실제 그림·클릭을 확인하는 것은 서로 다른 증거다.

P8의 export는 수학 execution record를 저장한다. 실행 뒤 바꾼 표시 view, camera, LOD, 선택 항목을 export/import로 복원하는 별도 presentation 기능은 현재 P8에 없다. 원래 P8-02의 ‘표시 변경이 수학 결과를 바꾸지 않는다’는 계약과 presentation 복원 기능을 혼동하지 않는다. advanced comparison 또는 전용 chain-equivalence consumer의 미완성 부분은 theorem backlog에 남기며, 목록에 있다는 사실을 컴파일 완료로 표시하지 않는다.
증거: [E023](web/p8-visual-models.js) · [E024](web/p8-visualization.js) · [E025](web/p8-workspace.js) · [E026](tests/p8-visual-models.test.mjs) · [E027](tests/p8-visualization.test.mjs) · [E028](p8/theorem-backlog.mjs) · [E029](p8/review-packets.mjs)

### 3.6 공개 화면에서 실제로 확인한 내용

게시 이력 v85–v89의 원본 UI receipt에는 **서로 다른 20개 확인 항목이 모두 PASS**로 남아 있다. 이는 화면에 대한 확인 수이며 원래 56개 기준의 완료 수와 다르다. P8의 독립 snapshot은 그중 v87의 6개를, Gauge의 독립 snapshot은 공통 입력 보호를 포함한 11개를 원문 그대로 보존한다. Gauge의 기준별 검토는 실제 수치 회귀와 이 화면 증거를 함께 대조해 Y6의 8개 요건을 판정했다.

| 실제 확인한 동작 | 관찰한 결과와 범위 |
|---|---|
| N8 URL을 직접 열고 새로고침 | 초기 비동기 탐색 뒤에도 N8 작업 공간이 유지되고 실제 실행의 81개 sample을 표시함 |
| N8 내보내기·가져오기·새 계산 | 재계산 결과 MATCH, 선택 원본·camera·LOD 복원, source와 view hash의 재검증. 가져온 과거 권한은 채택하지 않음 |
| N8 키보드와 LOD 변경 | source points 및 mathematical digest 유지. 실제 t=0.5, z=0 평면과 전체 periodic domain의 분리, vector multiplier 0.3을 보존함 |
| Gauge source 선택과 연속 절단 | 원래 4D 좌표·A/F 또는 links/configuration fibre로 연결되고, c 변경 시 실제 새로운 관측 hash와 좌표를 계산함 |
| Gauge marginal 및 Wilson flow | marginal의 ell0^-3 단위와 at 가중 연산자, 8개 원본 fibre, 독립 flow time 및 서로 다른 original/flowed hash와 실제 action 곡선을 확인함 |
| Gauge 상태 비교 | 같은 좌표·단위·공통 색 범위와 EFFECTIVE 표기를 확인함. 빠졌던 ensemble의 ESTIMATED 표기를 수정한 뒤 v89의 두 새 chain에서 ‘목표 Δ=1/2 · C00 · ESTIMATED’를 각각 확인함 |
| Gauge 재열기·stale·게시 Lean 기록 | 실제 MATCH 재계산과 표시 상태를 복원함. 변경되거나 오래된 source 기록은 권한을 채택하지 않으며, 게시된 45개 proof source bytes가 실제 보관된 kernel 기록과 일치함 |
| P8 네 구조 view와 원본 선택 | WebGL 없는 공개 환경에서 Canvas2D가 실제 basis/matrix column, Newton slopes, Frobenius 값, refinement 원본을 표시함 |
| P8 camera·LOD·route 복귀 | 수학 record가 유지되고 단일 canvas와 camera가 복원됨. 표시 투영에 proof authority를 부여하지 않음 |
| P8 조건부 ledger | 실제 고유 assumption ID·명제와 #print axioms, 해당 source axiom 제거 후 거부를 표시함. RECORDED_CI_SOURCE_MATCH와 CONDITIONAL_ON_TARGET 범위를 유지함 |

Canvas2D 추가 시점의 P8 로컬 JavaScript 전체 회귀는 **101/101**이며 Canvas mount 7개가 여기에 포함된다. Python **17/17**은 별도로 보존한 앞선 로컬 실행이다. 이전 JavaScript 94개 receipt를 새 101개 실행처럼 수정하지 않았다. 공개 화면 6개, 로컬 JavaScript 101개, Python 17개 및 실제 Lean target 수를 서로 합쳐 원래 기준 완료 수로 사용하지 않는다.
증거: [E030](evidence/live-ui/acceptance.json) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E032](gauge/evidence/ui-criterion-assessment.json) · [E033](p8/evidence/p8-live-v87-20261012.json) · [E034](p8/evidence/p8-renderer-local-20261012.json) · [E035](p8/evidence/p8-local-acceptance-20261012.json) · [E036](p8/evidence/p8-final-integration-20261012.json) · [E037](evidence/live-ui/n8-live-v85.jpg) · [E038](evidence/live-ui/p8-refinement-v87.jpg) · [E039](evidence/live-ui/gauge-delta-v88.jpg)


### 3.7 v91 전송 수정과 별도의 최종 공개 확인

최종 게시 bytes를 비교하다 P8 Worker의 JSON 문자열 안에 있는 원래 여섯 ASCII 문자 `\u0000`이 게시 과정에서 literal NUL 한 byte로 바뀐 실제 실패를 발견했다. 후보와 공개 v90 HTML은 이 교체를 제외한 모든 bytes가 같았으며, 원래 Worker 문자열은 JSON으로 해석되지만 공개 문자열은 해석되지 않았다. 실패를 감추거나 source 해시 기준을 완화하지 않았다.

전체 Worker를 **UTF-8/base64**로 전송하고 `TextDecoder("utf-8",{fatal:true,ignoreBOM:true})`로 복원하도록 generator를 수정했다. 이 방식은 해당 Unicode escape 변환으로부터 원래 bytes를 보존하며 잘못된 UTF-8을 대체 문자로 통과시키지 않는다. 임의의 모든 전송 손상을 인증하는 암호학적 장치라고 주장하지 않는다. 원래 duplicate-edge 구분자와 모든 수학 프로그램은 그대로다. 81개 source-binding 파일 중 바뀐 것은 `p8/tools/build_browser.py` 하나이며, build metadata 뒤의 프로그램 bytes 및 그 밖의 build metadata가 동일함을 기록했다.

추가된 세 회귀는 실제 v90 실패, 전체 Worker의 독립 재조립과 byte 일치, BOM·한글·astral Unicode·NUL·literal escape 보존 및 잘못된 decode의 거부를 확인한다. 기존 검사의 실제 Worker 실행도 계속 Node source의 결과와 비교한다. 이 수정 뒤 로컬 JavaScript는 **104/104**, Python은 **17/17**, static pin audit와 build `--check`는 모두 통과했다. 이 보고서 작성자의 추가 검토는 읽기 전용 source 검토였으며 같은 검사를 다시 실행했다고 표시하지 않는다. 앞선 101/101 및 v87 화면 receipt는 그 시점의 기록으로 그대로 보존했다.

공개 **v91 / `2a0038c0`**에서는 후보 HTML과 받은 HTML의 SHA-256이 모두 `6f80b5c7315ee3c9d3ee783a848f274aa32187e2d2d7df064df708f349362a9f`로 일치한다. P8 bundle과 복원한 636,265-byte Worker도 로컬 값과 정확히 같으며, 복원 Worker SHA-256은 `c4221290f3506b7d9d4f6b1fd490b92f2ead1ce3535f74f340f724525adc42bb`이다. 새 source manifest는 `5bdae9fdd5d0b39e6afc21c31a31678edbfd597c9c7d5e785bff9d6b06682f9a`다.

v91의 별도 세 공개 확인은 실제 조건부 source/ledger의 `RECORDED_CI_SOURCE_MATCH`, 새 replay의 `MATCH`, 실제 구조 실행과 `e_2 ∈ H^4` 선택의 matrix column `["9"]` 연결을 기록했다. v90에서 수행한 Gauge/Y7·Y6 진행표·N8 새 실행/replay 세 확인도 별도 파일에 남았다. 기존 v85–v89의 20개 acceptance, v90의 세 확인, v91 P8의 세 확인은 서로 다른 시점의 기록으로 보존하며 원래 56개 기준의 완료 수를 바꾸지 않는다. 이 전송 수정은 새 Lean kernel 실행이나 추가 수학 증명도 아니다.

증거: [E094](p8/evidence/p8-worker-transport-20261012.json) · [E095](evidence/live-ui/p8-transport-failure-v90.json) · [E096](evidence/live-ui/published-bytes-v91.json) · [E097](evidence/live-ui/final-p8-v91.json) · [E098](evidence/live-ui/final-v90.json) · [E099](p8/tools/build_browser.py) · [E100](tests/p8-engine.test.mjs) · [E101](tests/p8-worker-transport.test.mjs) · [E102](p8/build-data.json) · [E103](web/p8-engine.bundle.js) · [E104](p8/evidence/p8-worker-transport-tests-20261012.tap) · [E105](p8/evidence/p8-worker-transport-python-20261012.log) · [E106](p8/evidence/p8-worker-transport-static-20261012.log) · [E107](p8/evidence/p8-worker-transport-build-check-20261012.log) · [E108](evidence/live-ui/p8-final-v91.jpg) · [E109](evidence/live-ui/n8-final-v90.jpg) · [E110](evidence/live-ui/publication-v91.json)

## 4. 실제 Lean 기록과 그 증명 범위

다음 링크는 현재 저장된 원본 receipt에 기록된 실제 GitHub CI 실행을 가리킨다. 브라우저는 그 기록과 현재 source의 일치를 검사한다. 브라우저에서 새 Lean kernel을 실행했다고 표시하지 않는다. CI trigger의 head commit과 실제 checkout commit은 다를 수 있으므로 실제 receipt의 checkout을 함께 기록했다.

| 기록 | 실제 CI | 실제 checkout commit | 검증 결과 | 증명 범위 |
|---|---|---|---|---|
| P8 finite consumers | [run 38213076249](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38213076249) | `4410aa76760a0665f709e82f3422604a66c4056f` | 12 target, semantic negative 8개 | 정수 chain/matrix/finite ring 정리와 명시한 F5 fixture. 전체 prismatic·analytic 문제를 해결하지 않음 |
| P8 conditional source | [run 38213076249](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38213076249) | `4410aa76760a0665f709e82f3422604a66c4056f` | 실제 axiom 목록과 조건부 target, 해당 axiom 제거 후 실제 거부 | `CONDITIONAL_ON_TARGET` 의존성을 숨기지 않는 작은 조건부 예제 |
| Y7 Real finite spectral bridge | [run 38215697672](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38215697672) | `9436d58903d0f9caf1206a386893244a7f3b7dc3` | Real target 8개, 필수 가정 제거 negative 9개 및 각 positive consumer | 유한 모델/cutoff의 weighted exp, log lower bound, 전체 비진공 transfer enclosure, 명시한 4-state fixture |

두 실제 Real/Mathlib CI 기록은 Lean 4.34.1, Lean commit `5045d0056413266e57c625dcd7c365b10e377c52`, mathlib commit `d13f23b723b8a846827a245b89c10fc7d3f11612`를 기록한다. 원래 kernel/runtime을 변경하지 않은 실행이다. P8 artifact SHA-256은 `b2373daa628b2bd736f7a45ef6970b9c473e5b06841a0ab514aeb6a8f7635b91`, Y7 artifact SHA-256은 `d8df568fd283ea7126907e53016a3733bec5f8dea848d263a847af698656308d`다. source·raw log·import closure의 정확한 해시를 확인해 package에 넣었으며, 변화한 소스를 예전 kernel 결과로 승인하지 않는다.

기존 gauge local kernel receipt는 별도 사실이다. 그 실행은 보호된 M1 exact SU3/G2/transport, legacy Core10 및 명시적 조건부 corollary와 새 유한 rational spectral 문장을 재컴파일했고, 8개 양성 명령과 10개 음성 명령의 예상 결과를 관찰했다. 그 receipt의 ‘당시 Real bridge 미실행’ 범위는 바꾸지 않았다. 뒤이어 성공한 Y7 Real CI를 별도 receipt로 추가한 것이며, 과거 기록을 새 실행인 것처럼 수정하지 않았다.
증거: [E040](p8/evidence/lean-release.json) · [E041](p8/evidence/conditional-lean-release.json) · [E042](p8/evidence/lean-release-provenance.json) · [E043](gauge/evidence/real-lean-release.json) · [E044](gauge/evidence/real-lean-audit/audit.json) · [E045](gauge/evidence/lean-audit.json) · [E046](gauge/package_lean.py)

### 증거가 허용하는 주장

| 증거 종류 | 허용되는 결론 | 아직 연결되지 않은 결론 |
|---|---|---|
| 유한 exact arithmetic / Lean target | 출력된 타입·가정·모델·cutoff 안의 정리 또는 certificate | 다른 입력, 외부 비교정리 전체, 무한 모델, Clay 문제 |
| finite/Float64 수치 비교 | 해당 fixture와 명시 tolerance에서의 일치·오차·회귀 통과 | 전 차수 smoothness, 무한합 수렴, 전역 PDE 해의 존재 또는 blowup |
| 명시 사용자/모델 가정의 corollary | 해당 가정 ID와 실제 axiom 의존을 가진 조건부 결론 | 가정 자체의 참, 원래 모델의 존재·간극 |
| source/hash 및 replay | 같은 원본 bytes·요청·수학 결과의 재현 또는 불일치 검출 | hash만으로 수학 명제가 참이라는 판정 |
| browser/Canvas 상호작용 | 표시 데이터·선택·단위·camera·LOD와 원본의 연결 | 3D projection의 injectivity/동형 또는 원래 4D 물리장의 복원 |

## 5. 원래 56개 합격 기준과 현재 증거의 정확한 대응

아래 일곱 표는 각 8행이며 P7 행이 없다. ‘현재 구현’은 검토 설명이고, ‘원래 기준’은 원문이다. 완료 여부는 진행표의 boolean을 따르며 보조 검사 통과 수를 원래 기준 완료 수로 대체하지 않았다. E 번호는 파일 링크이며 §8의 SHA 목록으로 해당 bytes를 찾을 수 있다.

### Y5. Δ별 장·스펙트럼·앙상블 — 5/8 완료

| ID · 원본 쪽 | 원래 기준: 제목 및 전문 | 상태 · 완료 boolean | 현재 구현과 범위 | 증거 | 남은 요구사항 |
|---|---|---|---|---|---|
| **Y5-01** · p.46 | **Δ 모드와 변경 효과 선언** — declared lower bound / units-rescaling / explicit effective model / empirical ensemble estimate의 4모드를 둔다. 합 격: 가정 모드에서는 A와 샘플 hash가 유지되고 axiom revision만 바뀐다. Δ≤0·단위 없음·다른 모드 자료 혼합은 거부한다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 네 Δ 모드의 효과를 분리하고 실제 A/F·sample·original hash 보존 및 잘못된 입력 거부를 실행했다. | [E001](gauge/field-family.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y5-02** · p.46 | **실제로 변하는 유효 4D 장족** — 자연단위에서 ℓ Δ=1/Δ, ρΔ=κℓΔ를 모델 규칙으로 지정한다. A Δ=ιA_BPST(ρΔ)+εℓΔ⁻¹Σcφ((x−x₀)/ℓΔ)Ta를 생성한다. 합 격: Δ₁≠Δ₂이면 고정 관측 좌표의 A/F·길이 척도·투영이 규칙대로 변한다. ε≠0의 장은 off-shell일 수 있으며 ρΔ=κ/Δ는 양자 YM 정리가 아니다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 기존 실제 행렬 Lie 기저에서 BPST와 전 기저 perturbation을 계산하고 고정 좌표 A/F·길이·밀도 변화를 확인했다. | [E001](gauge/field-family.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y5-03** · p.46 | **명시적인 유효 스펙트럼 연결** — Ej(Δ)=Δ+εj, εj≥0 및 wj≥0의 유한 모형으로 C Δ(t)=Σwj exp( −Ej t)를 만든다. ε₀=0,w₀>0이면 이 모형의 최저 에너지는 Δ다. 합격: CΔ(t)≤exp(−Δt)Σwj를 정확한 가정 아래 검증한다. Y5-02 장과 이 스펙트럼의 연결은 model assumption ID를 가져야 한다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 비음수 weight/excess를 가진 유한 지수합과 양의 bound를 계산하고 장↔스펙트럼 model assumption ID를 보존한다. Real 전칭 Lean 연결은 Y7-03의 별도 관문이다. | [E047](gauge/spectral.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y5-04** · p.46 | **단위 변환과 실제 dilation 구별** — Δphysical=(ℏc/at)(atΔ)의 단위를 고정한다. A λ(x)=λA(λx)의 고전 scaling과 단순 표시 단위 변경을 구별한다. 합격: 4D 고 전 작용의 scaling 불변과 ρ→ρ/λ를 확인한다. quantum gap scaling은 H λ=λUHU⁻¹ 등 별도 가정 없이는 유도하지 않는다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 실제 dilation의 밀도×16·marginal×8·BPST 작용 불변, 같은 물리장의 표시 단위 변환, 독립 scale 입력에 대한 physical mass 환산을 실행했다. | [E001](gauge/field-family.mjs) · [E047](gauge/spectral.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y5-05** · p.46 | **Δ 타깃에 대한 양자 격자 앙상블족** — PΔ(U)∝exp[−Sβ(Δ),G(U)]의 생성 규칙을 지정한다. β·a·L·T를 바꾸는 calibration table와 독립 scale-setting으로 타깃을 찾는다. 합격: 모든 Δ 결과는 실제 새 chain 또는 검증된 재가중 경로에 연결된다. 타깃 Δ와 추정 mchannel±오차를 나란히 표시하고 동일성을 미리 강제하지 않는다. | `PARTIAL` · `false` | 각 target/beta에서 새 cold·Haar-hot Wilson chain, 독립 source hash, target와 실제 channel estimate를 계산했다. 두 β의 긴 실행과 통계 진단을 저장했다. | [E002](gauge/ensemble-family.mjs) · [E048](gauge/evidence/ensemble-production-attempt2.json) · [E049](gauge/evidence/source-production2/manifest.json) | 물리 척도를 target와 독립적으로 실제 측정하여 목표 Δ를 찾은 calibration은 아직 없다. / 현재 실측 실행은 연속 SU(2) defining links이며 다른 G의 생산 ensemble adapter를 동일 결과로 대신하지 않는다. |
| **Y5-06** · p.46 | **상관함수와 유효질량 추정** — 전체 진공 공간을 제거한 gauge-invariant 관측 벡터의 C(t)를 측정한다. 유일한 진공이면 평균 제거를 사용하며, 주기 시간 에는 finite-T/cosh와 operator channel을 명시한다. 합격: C(t)≤0 또는 cosh 역함수의 불가능 입력을 abs/clip으로 숨기지 않는다. 양의 스펙트럼 가정에서 gapglobal≤Echannel≤meff 방향을 표시한다. | `PARTIAL` · `false` | 실제 gauge-invariant 2채널 connected C, periodic cosh, block bootstrap, GEVP를 계산한다. C≤0·불가능 acosh는 null과 사유를 보존한다. | [E002](gauge/ensemble-family.mjs) · [E047](gauge/spectral.mjs) · [E048](gauge/evidence/ensemble-production-attempt2.json) | 새 chain의 평균 제거는 명시한 unique-vacuum 가정에 조건부이며 독립 vacuum theorem이나 일반 degenerate-vacuum projector는 없다. / 유한 T와 operator overlap을 제어한 질량 plateau·전체 스펙트럼 복원은 남아 있다. |
| **Y5-07** · p.46 | **전달 연산자·GEVP·인증 경계** — 양의 self-adjoint T에서 En −E0=−at⁻¹log(λn/λ0)를 사용한다. GEVP는 관측량 기저와 excited-state 오염을 함께 기록한 다. 합격: 수치 eigenvalue는 추정이다. 전체 진공 공간을 제외한 최대 λexc/λ₀≤r<1과 전체 비진공 공간의 제어가 있을 때만 해당 모델 gap 하한 −log(r)/at를 인증한다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 수치 GEVP는 관측량 span·condition/residual·overlap/finite-T 오염을 기록한 추정으로 유지한다. 완전한 유한 diagonal 모형은 전체 퇴화 진공과 모든 비진공 ratio를 정확 유리수로 검사하고, 별도 실제 Real Mathlib CI에서 modelId/cutoff를 보존한 -log(r)/at 하한과 4-state fixture를 kernel 검증했다. | [E047](gauge/spectral.mjs) · [E050](gauge/lean/FiniteSpectral.lean) · [E045](gauge/evidence/lean-audit.json) · [E051](gauge/lean/RealSpectralBridge.lean) · [E043](gauge/evidence/real-lean-release.json) · [E044](gauge/evidence/real-lean-audit/audit.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y5-08** · p.46 | **한계 순서와 불확실성 비교** — 통계·operator overlap·T·L·a·표현 cutoff 오차를 구분한다. 일정 물리량 조건에서 a→0,L→∞,T→∞를 비교한다. 합격: 한 operator channel의 양의 질량이나 유한 격자의 양의 gap을 continuum의 양의 하한으로 표시하지 않는다. 외삽 그래프에 는 사용한 가정·fit window·데이터를 공개한다. | `PARTIAL` · `false` | 통계·overlap·T·L·a·cutoff를 개별 오류 채널로 저장하고 limit 순서와 raw calibration rows를 내보낸다. 정당화되지 않은 extrapolation은 만들지 않는다. | [E002](gauge/ensemble-family.mjs) · [E048](gauge/evidence/ensemble-production-attempt2.json) | 같은 물리량을 맞춘 독립 scale-setting 및 a/L/T sweep, 공개 fit window를 가진 정당한 extrapolation 자료는 아직 없다. |

### Y6. 원본에 연결된 관측·시각화 — 8/8 완료

| ID · 원본 쪽 | 원래 기준: 제목 및 전문 | 상태 · 완료 boolean | 현재 구현과 범위 | 증거 | 남은 요구사항 |
|---|---|---|---|---|---|
| **Y6-01** · p.48 | **원본·표현·근거를 연결** — Original에는 A/F 또는 links/ensemble, Representation에는 slice·marginal·LOD, Evidence에는 source·오차·proof를 보 관한다. 합격: 3D selection은 원본 4D 좌표·configuration·관측 연산자로 이동한다. 화면 mesh나 색상으로 원본의 새 물리 상태를 생성하지 않는다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | Original/Representation/Evidence와 selection→실제 4D 좌표·A/F 재계산을 제공한다. | [E001](gauge/field-family.mjs) · [E052](gauge/index.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E032](gauge/evidence/ui-criterion-assessment.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y6-02** · p.48 | **x ₄=c 절단** — q(y,c), energy density, 선택된 invariant observable을 3D에 표시하고 c를 연속/격자 index로 조절한다. 합격: 기존 SU(2) BPST slice의 해석식을 회귀검사한다. interpolated slice는 보간 방식과 오차를 표시하고 실제 격자면과 구별한다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | x4=c 연속 절단과 실제 격자 정수 timeIndex 관측을 제공하고 SU(2) BPST 해석식·source 좌표·index guards를 검증한다. 보간은 수행하지 않는다. | [E001](gauge/field-family.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E032](gauge/evidence/ui-criterion-assessment.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y6-03** · p.48 | **x ₄ 방향 적분·평균 구별** — marginal at Σn q(y,n at), 평균 (1/Nt) Σn q, 한 표본과 ensemble 평균을 서로 다른 연산자로 둔다. 합격: marginal의 단위 가 q×length로 바뀐다. BPST 무한 방향 해석식과 finite window tail을 확인하고 at 누락·합/평균 혼동을 잡는다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 실제 저장된 chain links에서 4D 격자 밀도·at 가중 marginal·시간 평균·configuration 평균을 계산하고 원래 모든 시간/표본 fibre로 돌아가는 inspector를 제공한다. BPST analytic marginal·tail도 유지한다. | [E001](gauge/field-family.mjs) · [E003](gauge/lattice-observation.mjs) · [E007](gauge/tests/lattice-observation-flow.test.mjs) · [E053](gauge/evidence/lattice-flow-tests.tap) · [E054](gauge/evidence/lattice-chain-marginal-mean.json) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E032](gauge/evidence/ui-criterion-assessment.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y6-04** · p.48 | **안전한 게이지 불변 기본 화면** — plaquette energy·Wilson character·정규화된 density·correlation을 기본 채널로 둔다. A/F 성분은 gauge를 고정한 진단 모드에 둔다. 합격: gauge transformation 전후 기본 채널은 같고 성분 채널에는 gauge ID가 보인다. gauge-dependent arrow의 형태에서 질량 간극을 추론하지 않는다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 기본 invariant density와 gauge ID가 있는 A/F 진단을 분리하고 실제 비상수 gauge transform 전후 불변량을 비교했다. | [E001](gauge/field-family.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E032](gauge/evidence/ui-criterion-assessment.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y6-05** · p.48 | **Flow와 투영된 loop의 의미 보존** — gradient flow time을 독립 매개변수로 둔다. 4D loop를 3D에 그릴 때 원래 경로와 x ₄ 이동을 함께 보관한다. 합격: flowed density를 원본 density로 덮어쓰지 않는다. 원래 loop holonomy와 projected path에서 다시 계산한 holonomy를 동일시 하지 않는다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 실제 비정상 SU2/G2 Wilson gradient flow를 전체 Lie 기저/불변 Gram metric에서 실행했다. 원본 보존·독립 flow time·step-halving·full-trajectory gauge covariance와 실제 4D/평탄화 loop 구별을 검사했다. | [E004](gauge/wilson-flow.mjs) · [E001](gauge/field-family.mjs) · [E007](gauge/tests/lattice-observation-flow.test.mjs) · [E053](gauge/evidence/lattice-flow-tests.tap) · [E055](gauge/evidence/wilson-flow-su2.json) · [E056](gauge/evidence/wilson-flow-g2.json) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E032](gauge/evidence/ui-criterion-assessment.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y6-06** · p.48 | **Δ별 상태 비교** — 같은 좌표 범위·단위·color scale로 Δ₁,Δ₂의 field family와 상관함수를 비교한다. 독립 정규화는 선택적으로 표시한다. 합격: 색상 auto-normalization으로 가려지는 밀도 크기 차이를 확인할 수 있다. assumed/effective/estimated 상태가 모든 비교 패널에 나타난다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 같은 물리 좌표·단위·공통 색 척도의 Δ별 실제 field 및 spectrum을 반환하고 assumed/effective/estimated 의미를 명시한다. | [E001](gauge/field-family.mjs) · [E047](gauge/spectral.mjs) · [E002](gauge/ensemble-family.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E032](gauge/evidence/ui-criterion-assessment.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y6-07** · p.48 | **그림에서 Lean 명제로 연결** — 관측을 선택하면 정확한 observable·domain·projection·claim type을 내보낸다. proof 후보는 fibre 조건과 reconstruction certificate를 요구한다. 합격: 같은 3D 투영을 가진 다른 4D source를 반례 fixture로 제공한다. projection 그림의 동일성 만으로 4D 성질·spectral gap을 복원하는 명제를 거부한다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 서로 다른 4D BPST 원본의 같은 3D density slice 반례와 정확 domain/projection 계약을 제공한다. fibre·reconstruction·전체 spectrum 방향 없이는 승격하지 않는다. | [E057](gauge/proof.mjs) · [E050](gauge/lean/FiniteSpectral.lean) · [E045](gauge/evidence/lean-audit.json) · [E006](gauge/tests/gauge-m3.test.mjs) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E032](gauge/evidence/ui-criterion-assessment.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y6-08** · p.48 | **세션 재현·접근성·stale 확인** — 수치 테이블·키보드·색각 독립 표식과 원본 데이터를 제공한다. scene/model/proof revision을 분리하여 저장한다. 합격: 재 열기 시 같은 source·관측·가정을 복원한다. G· Δ 모형·경계·proof source 변경은 관련 결과를 stale로 만들고 단순 카메라 이 동은 만들지 않는다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 실제 재계산 replay, 재해시된 변조 거부, scene/model/assumption/proof stale 구별을 실행했다. | [E052](gauge/index.mjs) · [E057](gauge/proof.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E032](gauge/evidence/ui-criterion-assessment.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |

### Y7. 유한·조건부 Lean 연결 — 8/8 완료

| ID · 원본 쪽 | 원래 기준: 제목 및 전문 | 상태 · 완료 boolean | 현재 구현과 범위 | 증거 | 남은 요구사항 |
|---|---|---|---|---|---|
| **Y7-01** · p.50 | **기존 검증 범위를 고정** — Core와 Mathlib scaffold의 실제 source hash·toolchain·axiom audit를 유지한다. 기존 선언형 quantum model을 full QFT로 오인하지 않는다. 합격: 기존 Core 10개의 axiom-free 보조정리와 사용자 axiom 의존 corollary를 분리한다. Mathlib 표준 axiom과 사용자 YM axiom도 별도 표시한다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 실제 legacy 원본 Core10을 source hash 그대로 다시 컴파일하고 axiom-free 보조정리와 사용자 공리 corollary를 분리했다. 이전 Mathlib scaffold source와 기존 receipt는 같은 hash의 inherited evidence로 표시한다. | [E058](gauge/legacy/MathScopeConditionalYM_Core.lean) · [E059](gauge/legacy/MathScopeConditionalYM.lean) · [E060](gauge/legacy/original-validation.json) · [E045](gauge/evidence/lean-audit.json) · [E061](gauge/proof-data.mjs) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y7-02** · p.50 | **유한 대수 인증서를 Lean에 연결** — Y1 bracket table·Y2 embedding·Y3 path/Wilson 항등식의 정확 데이터를 import하고 kernel에서 검사한다. 합격: 생성 기의 성공 로그 대신 Lean certificate와 source hash가 필요하다. 잘못된 Jacobi·경로 순서·embedding index fixture가 실 제 거부된다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 보호된 M1 exact SU3/G2/transport/conditional 소스를 바꾸지 않고 새 공식 Lean kernel으로 재검사했다. 잘못된 Jacobi·embedding index·Wilson path를 실제 거부했다. | [E062](gauge/verify_lean.py) · [E045](gauge/evidence/lean-audit.json) · [E063](gauge/evidence/lean/NegativeJacobi.log) · [E064](gauge/evidence/lean/NegativeEmbeddingIndex.log) · [E065](gauge/evidence/lean/m1-NegativeWilson.log) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y7-03** · p.50 | **유한 spectral certificate** — 유한 양의 가중치·spectral sum·전달행렬 enclosure를 각각 formalize한다. 숫자 고유값 출력과 enclosing proof를 구분한 다. 합격: 계수 sign·at>0·r<1·비진공 subspace 조건을 빠뜨리면 해당 하한 정리를 사용할 수 없다. certificate의 모델 cutoff 를 결론에 남긴다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 새 finite Lean suite와 실제 성공한 Real Mathlib CI를 분리해 source에 결속했다. Real weighted exp/log 및 전체 비진공 transfer enclosure를 직접 연결한 8개 target과 모델/cutoff를 보존한 정확 4-state fixture를 검증했다. 9개 필수 가정의 양성 consumer는 성공하고 binder를 제거한 음성 consumer는 실제 거부되며 custom axiom/sorry가 없다. | [E050](gauge/lean/FiniteSpectral.lean) · [E045](gauge/evidence/lean-audit.json) · [E051](gauge/lean/RealSpectralBridge.lean) · [E066](gauge/verify_real_lean.py) · [E043](gauge/evidence/real-lean-release.json) · [E044](gauge/evidence/real-lean-audit/audit.json) · [E046](gauge/package_lean.py) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y7-04** · p.50 | **사용자 존재·간극 axiom의 출처 저장** — 고정된 모델 의미·G·단위· Δ·quantifier를 갖는 가정을 등록한다. user/paper/heuristic 출처와 source revision, 의존 정리를 기록한다. 합격: 상충하는 spectrum/Δ 가정을 감지하면 중단한다. 임의 Prop P 모두를 참으로 선언하는 식의 광범위 axiom 은 금지하고 YM 의미 술어를 고정한다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 고정 수학 의미·quantifier·G·단위·Δ·출처·SHA·revision·의존 ID를 보존하고 spectrum 충돌, 광범위 공리, 잘못된 quantifier와 누락/순환 의존을 거부한다. | [E057](gauge/proof.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y7-05** · p.50 | **투영 뒤 corollary의 정확한 계약** — projection observation이 fibre-constant인지, reconstruction이 어느 집합에서 성립하는지, spectrum 전달은 어떤 포함 가정인지 요구한다. 합격: 그림을 다시 Lean 형태로 적었다는 사실만으로 새 정리를 승인하지 않는다. conditional theorem 에는 필요한 reconstruction/transfer 가정과 사용자 axiom 목록이 남는다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | fibre-constant 또는 제한 domain reconstruction과 전체 original positive spectrum inclusion의 올바른 방향을 요구한다. 사용자가 입력한 certificate 형태는 조건부 가정이며 새 proof가 아니다. | [E057](gauge/proof.mjs) · [E050](gauge/lean/FiniteSpectral.lean) · [E045](gauge/evidence/lean-audit.json) · [E006](gauge/tests/gauge-m3.test.mjs) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y7-06** · p.50 | **OS/transfer 재구성 의무 분리** — Schwinger functions/observable algebra, regularity, Euclidean symmetry, reflection positivity, clustering·vacuum 조건과 재구성 정리 적용을 독립 작업으로 둔다. 합격: 특정 lattice 외부 정리의 가정이 매핑되어도 continuum 재구성 완료 로 체크하지 않는다. gauge-invariant observable의 재구성 문제를 gauge potential positivity와 구별한다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | observable algebra·regularity·Euclidean symmetry·reflection positivity·clustering·vacuum·reconstruction을 독립 OPEN 의무와 dependency로 관리한다. finite lattice 가정 매핑은 continuum 완료를 만들지 않는다. | [E067](gauge/contracts.mjs) · [E057](gauge/proof.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y7-07** · p.50 | **새 continuum YM 구성의 연구 목표** — 일정 물리량 조건의 continuum·무한 부피 극한, 비자명성, 필요한 QFT axioms, uniform positive gap을 서로 다른 proof obligation으로 둔다. 합격: 각 극한의 존재·모형 식별·uniform bound 근거 없이는 OPEN CONTINUUM을 유지한다. 격자 simulation·유효모형·사용자 존재 axiom으로 Clay 완료 상태를 만들지 않는다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | continuum/volume limit·nontriviality·QFT axioms·uniform gap을 별도 OPEN_CONTINUUM으로 유지한다. 이 관문은 난제 해결 상태를 잘못 생성하지 않는 동작에 대한 완료이다. | [E067](gauge/contracts.mjs) · [E057](gauge/proof.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **Y7-08** · p.50 | **최종 회귀검사와 증거 bundle** — 핀된 Lean/mathlib, no-sorry 검사, axiom audit, negative control, 소스·데이터 hash, 예측된 failure cases를 묶는다. 합 격: 변경된 소스는 새 kernel 결과가 나올 때까지 unverified다. 보고서에는 유한 결과·조건부 결과·추정·열린 의무가 각각의 범위와 함께 표시된다. | `COMPLETE_WITHIN_STATED_SCOPE` · `true` | 핀된 Lean/mathlib, exact source/log/import-closure hash, no-sorry·axiom audit와 실제 양성·음성 kernel 기록을 묶는다. 뒤이어 성공한 Real CI는 별도 원본 receipt로 연결하고 source 변경을 새 proof로 인정하지 않는다. | [E062](gauge/verify_lean.py) · [E046](gauge/package_lean.py) · [E045](gauge/evidence/lean-audit.json) · [E061](gauge/proof-data.mjs) · [E006](gauge/tests/gauge-m3.test.mjs) · [E043](gauge/evidence/real-lean-release.json) · [E068](gauge/evidence/source-transport-audit.json) · [E069](gauge/evidence/package-guard-audit.json) · [E031](gauge/evidence/live-ui-v85-v89-gauge.json) · [E070](gauge/tests/verify_transport.mjs) · [E071](gauge/tests/verify_package_guards.py) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |

### N6. 국소 보정 반복 — 0/8 완료

| ID · 원본 쪽 | 원래 기준: 제목 및 전문 | 상태 · 완료 boolean | 현재 구현과 범위 | 증거 | 남은 요구사항 |
|---|---|---|---|---|---|
| **N6-01** · p.62 | **초기 finite state 구성** — primary curls 뒤 temporal mean update와 다섯 moment correction을 수행하여 j=0 상태를 만든다. 합격: Proposition9.5 의 B0=0.7,C0*=1.2와 (9.9),(9.10) 명세를 충족한다. 명세의 상수 없이 경험적 power slope만으로 인증하지 않는다. | `OPEN` · `false` | 수정 전 primary/curl/residual의 M2 원본과 namespace를 고정했다. 요구되는 실제 j=0 보정 상태는 아직 없다. | [E008](navier/source-inheritance.json) · [E009](navier/source-mean-map.mjs) | 실제 full-curl primary state에 temporal mean 및 다섯 moment 보정을 적용해야 한다. / 압력을 다시 계산하고 원래 B0=0.7, C0*=1.2 및 누적 class bound를 명시 상수와 함께 충족해야 한다. |
| **N6-02** · p.62 | **전체 residual 재계산** — R(u+δu,p+δp)=R(u,p)+Lu(δu,δp)+div(δu⊗δu)를 사용하며 매 substep 후 최신 압력을 복원한다. 합격: 독립 직접 PDE 평가와 decomposed residual이 오차 예산 내 일치한다. 기존 flat tail와 새 quadratic remainder를 장부에서 누락하지 않 는다. | `PARTIAL` · `false` | 유한 Fourier residual의 전체 이차식과 제곱항 누락 거부를 실행했다. 논문의 최신 보정 상태·압력은 아직 입력되지 않는다. | [E016](navier/galerkin.mjs) · [E017](navier/evidence/acceptance.json) | 각 실제 source update 뒤 직접 PDE residual과 분해식을 같은 오차 예산으로 비교해야 한다. / 기존 flat tail과 모든 새 quadratic/curl 항을 같은 pressure 복원 장부에 유지해야 한다. |
| **N6-03** · p.62 | **비영 angular harmonics 보정** — 현재 source의 모든 nonzero harmonics를 (7.13) inverse로 풀고 source-supported potentials에 cutoff 후 curl한다. 합격: same-label 곱에서 m+m′ 신규 주파수가 생성된다. 단계별 최대 harmonic을 기록하고 조용한 truncation 대신 discarded-mode bound를 제공한다. | `PARTIAL` · `false` | 유한 harmonic 집합의 모든 pairwise 생성 주파수와 무근거 truncation 거부를 구현했다. (7.13)은 명시한 유한 계수 모형에서 풀어 정확 ODE와 비교한다. | [E011](navier/corrections.mjs) · [E072](navier/evidence/N6-harmonic.json) | 실제 same-label 전체 상태로부터 모든 coefficient source를 유도해야 한다. / 원래 phase/coefficient jets, source-supported potential의 cutoff와 full curl, commutator 및 mode tail을 계산해야 한다. |
| **N6-04** · p.62 | **Signed covariance increment** — 고정 positive a±에 대해 δa=(Hcov^−1(Σ/ε))/(2a)를 사용한다. 새 Σ는 signed일 수 있다. 합격: B(W0,LΣ)=Σ와 (7.41)의 세 remainder를 모두 검사한다. 앞 단계 a±를 새 residual에 맞춰 몰래 재선택하지 않는다. | `PARTIAL` · `false` | 고정한 양의 기준 진폭에서 signed inverse를 계산하고 increment square 및 세 remainder 계열을 유지한다. 실제 M2의 H/a 원본은 따로 고정한다. | [E011](navier/corrections.mjs) · [E008](navier/source-inheritance.json) · [E073](navier/evidence/N6-signed.json) | 최신 signed stress를 원래 covariance inverse에 공급해야 한다. / 실제 보정장의 cross/curl/square remainder와 derivative class를 확인해야 한다. |
| **N6-05** · p.62 | **Zero auxiliary mean Fourier inverse** — (8.19)의 1/(2 πi vt·k) multiplier로 (8.20)을 풀고 axial increment는 (8.14)의 potential로 실현한다. 합격: zero mode가 0이고 Nφ=F가 맞는다. \|vt·k\|^ −1≤C(1+\|k\|) 및 4개 추가 도함수를 포함한 Fourier tail를 기록한다. | `PARTIAL` · `false` | 원래 vt=(√2−1,1)의 divisor를 정수 norm으로 유리화하고 유한 Fourier inverse·zero mean·tail 관문을 검사한다. | [E011](navier/corrections.mjs) · [E074](navier/evidence/N6-workbench.json) | 실제 source Fourier coefficients와 C^(m+4) 상수가 필요하다. / axial potential을 실제로 구성하고 radial cutoff remainder를 최신 pressure/residual에 반영해야 한다. |
| **N6-06** · p.62 | **다섯 radial equations와 압력** — (8.25)로 두 보존 모멘트와 P,J θ,Jz를 보정하고 (8.12)로 pressure를 다시 계산한다. 합격: 두 보존 적분은 0으로 유지되고 새 결함은 (8.26),(8.27)의 nonlinear remainder와 일치한다. λ의 작은 값에 따른 condition number를 통제한다. | `PARTIAL` · `false` | 변경하지 않은 실제 M2 mean patch 함수를 실행한다. 원래 양의 λ/a, 다섯 disjoint support, 양의 적분 enclosure, angular inverse, λ를 인수로 분리한 axial inverse를 연결했다. 실제 현재 결함에 적용하는 단계는 남았다. | [E009](navier/source-mean-map.mjs) · [E010](navier/evidence/N6-source-mean.json) · [E075](navier/evidence/N6-moments.json) | 현재 전체 curl 상태에서 P, Jθ, Jz를 계산해야 한다. / 그 결함에 실제 source map을 적용하고 (8.12)로 pressure를 복원해야 한다. / (8.26)–(8.27)의 모든 현재 mean·remainder·derivative 상수를 재계산해야 한다. |
| **N6-07** · p.62 | **고정 도메인과 차수 향상** — σj=1/5+j/10, gj=hj/10 및 (9.17),(9.18)의 Km,ℓm,log powers를 추적한다. 합격: 모든 finite stage가 같은 q<qbig 도메 인을 사용한다. 단 한 번의 step에서 샘플 잔차가 늘면 정밀도/범위/상수부터 조사하고 차수 theorem과 혼동하지 않는다. | `PARTIAL` · `false` | 정확 유리수 차수 부등식과 고정 도메인 의무를 장부로 관리한다. 경험적 slope를 미분 class 정리로 올리지 않는다. | [E011](navier/corrections.mjs) · [E074](navier/evidence/N6-workbench.json) | 모든 finite stage에 공통인 원래 qbig와 source 미분 상수를 고정해야 한다. / 같은 도메인에서 단계별 장·physical derivative loss·tail을 계산해야 한다. |
| **N6-08** · p.62 | **최종 local 합성** — (9.21)에서 Aj,Bj,pj에 shrinking cutoff를 적용하고 curl하여 local field를 만든다. finite residual의 flat terms를 무조건 합 산하지 않는다. 합격: Lemma5.4의 tail 비교로 (9.20)을 연결한다. 평가 구간의 active indices와 생략 tail의 bound를 저장 하고 없으면 finite-stage approximation으로 제한한다. | `OPEN` · `false` | finite-stage와 최종 local field를 구분하는 관문이 있다. 실제 보정 수열과 shrinking-cutoff 무한합은 아직 구성되지 않았다. | [E020](navier/index.mjs) · [E008](navier/source-inheritance.json) | 실제 finite correction sequence가 필요하다. / 미분 후에도 합산 가능한 tail을 가진 shrinking cutoff 및 Lemma 5.4 비교가 필요하다. / 평가 영역별 active indices와 omitted-tail bound를 저장해야 한다. |

### N7. Localization·force·전역화 — 0/8 완료

| ID · 원본 쪽 | 원래 기준: 제목 및 전문 | 상태 · 완료 boolean | 현재 구현과 범위 | 증거 | 남은 요구사항 |
|---|---|---|---|---|---|
| **N7-01** · p.64 | **시간·공간 cutoff 선택** — q≤C0(τ+\|z\|^(1/D))로 support를 q<q*/2 안에 놓고 c= χxχt를 선택한다. χx는 r²,z에 smooth하게 둔다. 합격: u=p=0인 초기 시간구간과 고정 compact K가 존재한다. t가 1에 가까울 때 원점 근방에서 cutoff가 정확히 1이어야 한다. | `PARTIAL` · `false` | qstar/2 안의 고정 cutoff-support 부등식과 r²/z에 매끄러운 cutoff 구성 규칙이 있다. 최종 local field와 원래 qstar는 남았다. | [E013](navier/localization.mjs) · [E014](navier/evidence/N7-workbench.json) | 완성된 N6 local A/B/p와 원래 qstar를 사용해야 한다. / 실제 상수로 고정 compact support·초기 0 구간·원점 부근 cutoff=1을 확인해야 한다. |
| **N7-02** · p.64 | **Localization 교차항 보존** — (10.4)의 curl(cA), 특히 ∇c×A를 포함하고 f를 전체 PDE residual로 정의한다. 합격: 직접 계산된 f와 cutoff 전 residual+모 든 commutator 전개의 일치 여부를 검사한다. ∇·u=0은 구조적으로 유지한다. | `PARTIAL` · `false` | curl(cA)=c curl A+∇c×A 및 전체 PDE residual 의무를 명시한다. 실제 source의 모든 commutator를 계산한 것은 아니다. | [E013](navier/localization.mjs) | 실제 N6 potentials/pressure를 localization해야 한다. / 전체 force의 직접값과 모든 cutoff commutator를 오차 예산 안에서 비교해야 한다. |
| **N7-03** · p.64 | **Force의 발산과 압력 계약** — 원문 p118에 따라 f는 divergence-free일 필요가 없다. −Δp=∂i∂j(uiuj)−div f를 검사한다. 합격: div f≠0을 실패로 처리하 지 않는다. 임의 Leray projection으로 f를 바꿔 compact support/pressure 조건을 훼손하지 않는다. | `PARTIAL` · `false` | pressure 식의 div f 항을 보존하고 별도 유한 Galerkin branch에서 검사했다. div f≠0 자체를 실패로 처리하지 않는다. | [E013](navier/localization.mjs) · [E016](navier/galerkin.mjs) · [E076](navier/evidence/N8-acceptance.json) | 임의 projection으로 force를 바꾸지 않고 같은 localized source의 pressure 식을 검증해야 한다. |
| **N7-04** · p.64 | **Terminal force jets** — Fj(x)=lim(t↑1)∂t^j f(x,t), ∂x^ αFj(0)=0을 (10.6)-(10.10)에 맞춰 구축한다. 합격: 유한 jet order M의 수치 근사와 ∀order smooth-extension 정리의 의존성을 분리한다. 몇 개 finite differences가 작다는 이유로 C∞ force라 표시하지 않는다. | `OPEN` · `false` | 유한 입력 jet과 전 차수 force extension을 분리한다. 실제 localized source의 terminal jets는 아직 없다. | [E013](navier/localization.mjs) · [E014](navier/evidence/N7-workbench.json) | 실제 localized residual로부터 terminal Fj를 구성해야 한다. / 전 차수 미분 극한과 원점에서의 flatness 근거가 필요하다. |
| **N7-05** · p.64 | **t>1 force extension** — (10.11)의 Σχ0(bjσ)σ^jFj/j!, σ=t−1≥0를 사용하며 (10.12)의 differentiated tail constraints로 bj를 선택한다. 합격: force는 t≤2에서 compact support를 갖고 모든 인증된 jets가 접합된다. 이는 velocity를 t=1 이후 smooth하게 연장하는 알고리즘이 아니다. | `PARTIAL` · `false` | 유한 jet bound를 가정으로 입력하면 differentiated cutoff 부등식을 만족하는 증가 bj를 계산한다. velocity 연장 알고리즘으로 표시하지 않는다. | [E013](navier/localization.mjs) · [E014](navier/evidence/N7-workbench.json) | 실제 전 차수 terminal jets와 인증된 미분 상수가 필요하다. / t≤2까지 compact support와 전체 differentiated infinite tail을 증명·결속해야 한다. |
| **N7-06** · p.64 | **전역 에너지 balance** — d(∥u∥²₂/2)/dt+ν∥∇u∥²₂=⟨f,u⟩를 전체 K에서 적분한다. core만의 에너지와 구분한다. 합격: 정규화 energy defect가 독립 space/time refinement에서 감소한다. ν=1에서 (10.13)의 ∥u(t)∥² ₂+2∫∥∇u∥²₂≤(∫∥f∥₂)² 상계와 모순 없어야 한다. | `OPEN` · `false` | 일반 주기 solver의 전체 주기영역 energy/time defect는 계산한다. 논문의 고정 compact K에 대한 에너지 계산은 아니다. | [E016](navier/galerkin.mjs) · [E077](navier/evidence/N8-TG.json) | 실제 localized 장과 force를 K 전체에서 적분해야 한다. / 공간·시간을 독립 refinement하고 원래 (10.13)의 force-norm 상계와 비교해야 한다. |
| **N7-07** · p.64 | **실제 blowup 경로와 오차** — xτ=(√(2Xinτ),0,0), η=0에서 τ^A u θ=e0+O(τ^(2h)), e0>0를 측정한다. 합격: e0의 양의 하한과 remainder의 explicit bound가 있어야 해석적 성장 certificate로 연결한다. 유한 값 plot의 증가만으로 τ→0의 무한대를 증명하지 않는다. | `OPEN` · `false` | 양의 τ 및 source scaling을 기호적으로 유지한다. 그림의 성장으로 해석적 blowup certificate를 발급하지 않는다. | [E013](navier/localization.mjs) · [E019](navier/evidence/N8-nearT.json) | 복원한 velocity로 원래 Xin 경로를 평가해야 한다. / 양의 e0 하한과 O(τ^(2h))의 명시 remainder 상수가 필요하다. |
| **N7-08** · p.64 | **비교 정리·주기화· ν 확인** — Lemma10.5의 동일 force/data 비교, (10.22)의 ν rescaling, Corollary10.6의 지지 축소 후 disjoint translate를 검토한다. 합격: C/D 결론에 필요한 energy·periodic pressure·same forcing가 모두 남는다. periodization을 arbitrary overlapping copies의 합으로 대체하면 nonlinear cross terms 때문에 실패다. | `PARTIAL` · `false` | disjoint support, 동일 force/data, viscosity, periodic-pressure 조건과 overlap 거부를 실행한다. 실제 논문 해의 전역 비교 구성은 남았다. | [E013](navier/localization.mjs) · [E015](navier/evidence/N7-periodic.json) | 실제 장·force·pressure·energy 가정에서 comparison 및 ν rescaling을 적용해야 한다. / 지지축소와 disjoint translate를 실제로 구성하고 모든 조건을 보존해야 한다. |

### N8. 수치 실행·오차·재현 — 3/8 완료

| ID · 원본 쪽 | 원래 기준: 제목 및 전문 | 상태 · 완료 boolean | 현재 구현과 범위 | 증거 | 남은 요구사항 |
|---|---|---|---|---|---|
| **N8-01** · p.66 | **Divergence-free Fourier 기저** — 2π 주기 영역에서 k· ûk=0, û−k=conj(ûk), Pk=I −kkᵀ/\|k\|²를 사용한다. k=0은 별도 mean equation이다. 합격: 제약이 초 기·각 accepted step에서 유지되고 pressure 회복에 div f가 포함된다. 이 branch의 periodic domain을 whole-space 논문 해와 혼동하지 않는다. | `PASS` · `true` | 독립 2π-periodic Galerkin branch에서 초기·모든 accepted step의 divergence/conjugate 제약, zero mode, div f를 포함한 pressure를 검사한다. | [E016](navier/galerkin.mjs) · [E076](navier/evidence/N8-acceptance.json) · [E077](navier/evidence/N8-TG.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **N8-02** · p.66 | **비선형 convolution과 dealiasing** — 모든 p+q=k 상호작용을 계산한다. quadratic product는 3/2 padding 또는 그와 동등한 정확한 retained-mode convolu- tion을 사용한다. 합격: 작은 random solenoidal fixture에서 direct convolution과 FFT product가 정규화 10^ −11 이내 일치한다. high-mode aliasing negative control이 검출된다. | `PASS` · `true` | retained direct convolution과 독립 padded 3D FFT 및 NumPy를 비교하고 high-mode alias mutation을 검출한다. | [E016](navier/galerkin.mjs) · [E017](navier/evidence/acceptance.json) · [E018](navier/evidence/independent-numpy.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **N8-03** · p.66 | **시간 적응과 에너지 안정성** — diffusion integrating factor/IMEX 등으로 stiff linear term을 처리하고 advection CFL·embedded local error·energy defect로 step을 승인한다. 합격: Taylor-Green의 amplitude/energy를 시간 반분에서 설계 차수로 수렴시킨다. dt를 줄여 도 사라지지 않는 energy defect는 spatial/aliasing 오류로 조사한다. | `PASS` · `true` | IMEX, advection CFL, step-doubling, energy-defect 관문을 구현했다. 시간 반분에서 Taylor–Green의 amplitude/energy가 2차로 수렴한다. | [E016](navier/galerkin.mjs) · [E076](navier/evidence/N8-acceptance.json) · [E018](navier/evidence/independent-numpy.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **N8-04** · p.66 | **τ 기반 near-terminal sampling** — s=−logτ를 주 변수로 쓰고 τ>0만 평가한다. normalized coordinates와 velocity를 계산한 뒤 physical scaling을 적용한다. 합격: τ=10^−2,10^−4,10^−8,10^−12 예시와 더 작은 값의 precision mode가 재현된다. 표시 t가 1로 반올림돼도 내 부 τ>0 계약은 유지한다. | `PARTIAL` · `false` | 1e−2부터 1e−1000까지 양의 십진 τ를 표시 t와 독립적으로 보존한다. 실제 논문 velocity 계산이 아니라 source 좌표·scale 계약이다. | [E013](navier/localization.mjs) · [E019](navier/evidence/N8-nearT.json) | source-admissible 지점에서 실제 normalized velocity와 physical scaling을 계산해야 한다. / 좌표 문자열 외에 source interval/tail bound를 가진 precision mode가 필요하다. |
| **N8-05** · p.66 | **공간·급수·정밀도 적응** — core radius, axial length, pulse wavelength, active cutoff orders를 함께 해결한다. 각 refinement 축을 독립 증가시킨 다. 합격: 2배 grid, Fourier cutoff, coefficient order, arithmetic precision 비교표와 별도 tail bound를 저장한다. 예산 초과 시 last-resolved τ와 원인을 표시한다. | `PARTIAL` · `false` | 유한 계산 예산과 마지막 resolved time, 독립 FFT/time/NumPy 검사를 제공한다. 논문 pulse/coefficient/precision의 독립 적응은 남았다. | [E016](navier/galerkin.mjs) · [E017](navier/evidence/acceptance.json) · [E018](navier/evidence/independent-numpy.json) | source grid·Fourier cutoff·coefficient order·arithmetic precision을 독립 비교해야 한다. / 실제 core/axial/pulse scale·active cutoff·rigorous tail·last-resolved positive τ를 기록해야 한다. |
| **N8-06** · p.66 | **시각화·물리량 연결** — fixed physical bounds와 normalized view를 제공하고 instantaneous streamlines/particle paths, 속도/각속도, core/ global energy를 구분한다. 합격: 모든 scene은 실제 run hash·샘플 위치·단위·색 범위·vector scale를 갖는다. 자동 확대나 vector 정규화가 core 수축·성장을 숨기지 않는다. | `PARTIAL` · `false` | 실제 유한 Fourier run의 81개 위치·속도, 주기영역 에너지, hash·단위·색 범위·벡터 척도를 연결한다. 게시 N8의 z=0 평면·전체 domain 분리·vector multiplier 0.3·선택·키보드/LOD 불변성을 확인했다. 논문 source 물리 해의 구현은 별개다. | [E020](navier/index.mjs) · [E077](navier/evidence/N8-TG.json) · [E030](evidence/live-ui/acceptance.json) · [E021](web/extended-view-contract.mjs) · [E022](web/tests/extended-worker.test.mjs) | source 경로의 fixed physical/normalized view와 streamlines/particle path, 속도/각속도, core/global energy 구별을 완성해야 한다. |
| **N8-07** · p.66 | **Claim-test-proof 연결** — 각 관 측 량 에 원 문 reference, numerical test, analytic certificate, Lean theorem 을 별 도 링 크 한 다. 합 격: arbitrary sampled array를 axiom으로 놓고 PDE 해라고 결론 내리지 않는다. certified approximation 표시는 해당 구간의 error enclosure와 조건을 요구한다. | `PARTIAL` · `false` | source lineage·수치 검사·analytic certificate·Lean theorem을 별도 보관한다. 없는 analytic/Lean 증거는 null이고 위조 권한과 관측 변조는 거부한다. | [E020](navier/index.mjs) · [E017](navier/evidence/acceptance.json) · [E078](web/extended-worker.mjs) · [E022](web/tests/extended-worker.test.mjs) | source reconstruction과 UI의 관측량별 연결을 완성해야 한다. / certified approximation 표시에 앞서 실제 구간별 error enclosure와 refinement proof가 필요하다. |
| **N8-08** · p.66 | **재현 패키지와 최종 체크** — 판본·commit·상수·기저·domain·time schedule·quadrature·truncations·precision·tails·residual·energy·camera·build logs를 묶는다. 합격: 다른 환경에서 fixture와 selected run이 같은 허용오차로 재현된다. 이번 문서 작성 턴의 상태는 설계 완료이며 구현·사이트 변경·배포 완료로 표시하지 않는다. | `PARTIAL` · `false` | source bytes·구현 hash·입력·basis·domain·schedule·pressure/energy·표시 계약을 내보낸다. 게시본의 실제 재계산 MATCH·camera/LOD/선택 복원·직접 경로 재열기·수정 입력 보호와 독립 로컬 build/NumPy를 확인했다. 전체 논문 reconstruction package는 아니다. | [E079](navier/tests/build-source-inheritance.py) · [E080](navier/tests/run.mjs) · [E081](navier/tests/independent_numpy.py) · [E008](navier/source-inheritance.json) · [E082](navier/implementation-pin.mjs) · [E017](navier/evidence/acceptance.json) · [E030](evidence/live-ui/acceptance.json) · [E021](web/extended-view-contract.mjs) · [E022](web/tests/extended-worker.test.mjs) · [E083](web/build_extended.py) · [E084](web/tests/test_extended_build.py) · [E085](CI_EXECUTION_WORKSPACES.md) | 원래 source 상수·precision/coefficient cutoff·엄밀 tail 및 실제 reconstruction run을 패키지에 넣어야 한다. |

### P8. 구조·비교·인증·검토 통합 — 7/8 완료

| ID · 원본 쪽 | 원래 기준: 제목 및 전문 | 상태 · 완료 boolean | 현재 구현과 범위 | 증거 | 남은 요구사항 |
|---|---|---|---|---|---|
| **P8-01** · p.36 | **객체 정체성과 증거 등급을 직교화한다** — CW_TOY, DERIVED_MODEL, PRISMATIC_VIA_COMPARISON, NATIVE_PRISMATIC을 object kind로 둔다. exact/ ball/approximate와 Lean-checked/external-theorem/hypothesis를 별도로 관리한다. 합격: PRISMATIC_VIA_COMP ARISON이어도 Lean dependency가 외부면 FORMAL_COMPLETE가 아니다. 숫자 grade 값을 크게 바꾸어 theorem 상태 로 승격시키는 schema fixture가 실패한다. | `PASS` · `true` | object kind, 계산 정확도, proof method가 독립이다. numerical grade 또는 직렬화된 권한을 바꿔 theorem 상태를 만드는 입력을 거부한다. | [E086](tests/p8-contracts.test.mjs) · [E035](p8/evidence/p8-local-acceptance-20261012.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **P8-02** · p.36 | **3D 구조의 좌표 계약을 고정한다** — degree-basis-valuation, Hodge/Newton polygons, prime-degree-Frobenius weight, refinement tower를 각 view로 제공한다. 클릭하면 chain basis·matrix column·map·source theorem을 보이게 한다. 합격: view matrix·camera·LOD 변 경은 수학 결과를 바꾸지 않는다. 3D projection을 원래 공간과의 동형·차원 축소 증명으로 저장할 수 없다. | `PASS` · `true` | 실제 M2에서 네 구조 view와 exact source model을 만든다. 공개 v87에서 WebGL 실패 시 Canvas2D 3D 투영, exact source 선택, camera·LOD의 수학 record 불변성과 route 복귀의 단일 canvas·camera 복원을 확인했다. | [E026](tests/p8-visual-models.test.mjs) · [E027](tests/p8-visualization.test.mjs) · [E034](p8/evidence/p8-renderer-local-20261012.json) · [E033](p8/evidence/p8-live-v87-20261012.json) · [E038](evidence/live-ui/p8-refinement-v87.jpg) · [E024](web/p8-visualization.js) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **P8-03** · p.36 | **비교 diagram의 조건을 클릭해서 검사한다** — 노드는 계수환과 base를, 화살표는 tensor/twist/completion/inversion/fixed-point 또는 quasi-isomorphism을 명세한 다. 잘못된 base-change 순서는 composability 검사로 막는다. 합격: bounded/smooth/proper/perfect 등 각 edge의 필 요한 가정이 표시된다. 조건을 제거한 replay에서는 edge가 유효하지 않다는 이유를 반환한다. | `PASS` · `true` | 실제 M2 typed comparison의 계수환/base/연산 순서/가정 의존을 검사하고, 순서 변경·가정 제거·재해시된 변조를 거부한다. | [E086](tests/p8-contracts.test.mjs) · [E035](p8/evidence/p8-local-acceptance-20261012.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **P8-04** · p.36 | **Lean은 작은 인증 정리부터 쌓는다** — 정수 d², unit contraction, chain equivalence, point counts, trace recurrence, bounded residue reconstruction, finite Euler identity를 우선 구현 후보로 둔다. 고급 비교정리의 현재 라이브러리 범위를 별도 조사한다. 합격: 각 후보에는 theorem statement·입력 타입·핵심 lemma·certificate 소비 방식·추가 axiom이 명시된다. 컴파일되지 않은 코드를 형식화 완료라고 표시하지 않는다. | `PASS` · `true` | 요구된 일곱 후보 범주에 statement·입력·lemma·consumer·추가 axiom 정책을 기록했다. 정확 F5 consumer 12개와 semantic negative 8개는 실제 CI로 검사했다. 전용 chain-equivalence consumer는 명시된 향후 후보다. | [E028](p8/theorem-backlog.mjs) · [E040](p8/evidence/lean-release.json) · [E042](p8/evidence/lean-release-provenance.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **P8-05** · p.36 | **조건부 corollary의 의존성을 숨기지 않는다** — 새 operator/trace/duality 가정은 고유 ID와 정확한 수학 명제를 갖는다. theorem의 실제 의존 axiom을 출력하고 그 axiom 을 지운 상태의 재검증을 지원한다. 합격: Lean #print axioms와 입력 assumption ledger가 일치한다. target conjecture 자체를 가정하고 얻은 corollary는 CONDITIONAL_ON_TARGET으로 명확히 분류한다. | `PASS` · `true` | 실제 조건부 Lean source와 #print axioms, 해당 axiom 제거 후 거부를 보존한다. 성공한 CI artifact를 source/hash에 결속했으며 공개 v87에서 고유 ID·정확 명제·axiom ledger·제거 후 거부 및 CONDITIONAL_ON_TARGET 표시를 확인했다. Browser의 새 Lean 실행은 아니다. | [E041](p8/evidence/conditional-lean-release.json) · [E087](p8/evidence/lean-attempt7-38213076249.zip) · [E042](p8/evidence/lean-release-provenance.json) · [E088](p8/evidence/conditional-local-20261012/receipt.json) · [E089](p8/tools/test_conditional_audit.py) · [E033](p8/evidence/p8-live-v87-20261012.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **P8-06** · p.36 | **반증용 mutation과 재현 bundle을 만든다** — bad prime 하나, Frobenius coefficient 하나, truncation bound 하나, zero box 하나, rank upper certificate 하나를 제 거·변조하여 관문을 다시 실행한다. 합격: 변조된 입력은 해당 단계에서 실패하고 후속 theorem badge가 취소된다. session 저장은 입력 해시·정밀도·비교 근거를 보존하며 재계산 결과와 일치한다. | `PARTIAL` · `false` | bad-prime/Frobenius/truncation/comparison의 새 검사와 기록된 P7 zero-box·위조 rank 검사를 연결했다. 유효한 P7 rank upper certificate를 새로 만들지 않았다. | [E090](tests/p8-mutation-audit.test.mjs) · [E091](p8/evidence/p7-mutation-release.json) · [E035](p8/evidence/p8-local-acceptance-20261012.json) | P7-07의 유효 arithmetic-rank upper certificate가 아직 없고 P7은 이번 요청에서 제외됐다. 위조 증서 거부는 확인됐지만 유효 증서를 삭제하는 mutation은 아직 검사할 수 없다. |
| **P8-07** · p.36 | **새 연구를 위한 구체적인 탐색 도구를 제공한다** — global operator 후보의 finite compression, determinant normalization quotient, trace moment matching, func- tional equation·duality consistency, zero multiplicity coverage를 자동 비교한다. 반례는 재현 가능한 최소 입력으로 줄 인다. 합격: 후보 A와 B가 같은 그림을 내어도 다른 characteristic polynomial·trace·rank이면 구별된다. 미증명 bridge는 각각 RESEARCH OPEN이며 실패/통과한 유한 테스트를 나란히 표시한다. | `PASS` · `true` | 정확 유리수 finite compression의 특성다항식·rank·trace·정규화 비·reflection/duality·multiplicity를 비교한다. 반례 축소는 명시된 유한 principal compression 안에서 같은 실패 명제를 유지한다. | [E092](tests/p8-candidate-search.test.mjs) · [E035](p8/evidence/p8-local-acceptance-20261012.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |
| **P8-08** · p.36 | **마일스톤 review packet으로 승인 기준을 고정한다** — P1-P3 기본 계산, P4 실제 zeta 연결, P5-P6 고급 base, P7 분석 인증, P8 통합을 각각 독립 review packet으로 작성한다. 지원범위·fixture 결과·미완료 증명·새 연구 질문을 담는다. 합격: 출시 준비와 수학적 난제 해결을 다른 체크박스로 둔다. 이 번 산출물은 설계도이며 구현·컴파일·배포가 완료되었다는 상태를 생성하지 않는다. | `PASS` · `true` | P1–P3/P4/P5–P6/P7/P8 review packet마다 지원 입력·기록된 실제 fixture·미완료 proof·연구 질문을 유지한다. P7은 승계·제외 범위다. | [E029](p8/review-packets.mjs) · [E093](p8/review-fixture-evidence.json) · [E035](p8/evidence/p8-local-acceptance-20261012.json) | 진행표상 이 행의 한정된 합격 범위에 추가 미충족 조건 없음. 전체 이론의 완성을 뜻하지 않음. |

## 6. 미완료 요구사항의 의존 순서

| 먼저 필요한 작업 | 뒤에서 막히는 기준 | 완료로 보기 위해 필요한 실제 결과 |
|---|---|---|
| 실제 primary curls에서 temporal mean과 five-moment를 적용한 j=0 및 pressure | N6-01, N6-02~07 | 원래 상수·도메인에서 현재 P/Jθ/Jz, pressure, full residual, harmonic/curl/quadratic remainder의 계산 |
| 실제 correction sequence와 shrinking-cutoff 합성 | N6-08 및 N7의 source 경로 | active indices·전 차수 differentiated tail·Lemma 5.4의 고정 stage 비교 |
| 완성된 local A/B/p의 localization | N7-01~06, N7-08 | 모든 ∇c×A/commutator, 실제 force와 terminal jets, 고정 K 전체 energy, 동일 forcing/data/pressure 조건 |
| 실제 Xin 경로와 명시한 양의 하한·remainder | N7-07, N8-04~08의 논문 branch | e0>0의 하한, O(τ^(2h)) 상수, precision/tail/error enclosure 및 실제 source 관측 |
| 독립 물리 scale setting과 제어된 ensemble/limit 연구 | Y5-05/06/08 | target와 독립적인 척도·진공/overlap/finite-T 조건·같은 물리량의 a/L/T 비교 및 공개 fit window |
| 유효한 arithmetic-rank upper certificate | P8-06의 한 mutation | 제외된 P7-07 의존이다. 이번 작업에서 P7 변경 없이 유효 증서를 만들어냈다고 주장하지 않음 |

## 7. 재현 명령과 최종 CI 준비

### 새 실행 workspace CI

[m3-execution-workspaces.yml](../../.github/workflows/m3-execution-workspaces.yml)은 PR, main push, 수동 실행을 지원한다. research-ide 파일과 이 workflow 외에, packaging source로 핀된 gauge-real-spectral-verification.yml의 단독 변경도 검사를 유발한다. 저장소 전체 checkout이 필요하다. 새 M3 모듈은 보존된 M0/M1/M2 모듈을 읽지만, 이 workflow는 기존 M2의 대형 completion graph를 다시 계산하지 않는다. 권한은 contents:read이며 publisher·계정 자격증명을 사용하지 않는다.

환경은 Ubuntu 24.04, Node 24, Python 3.12, NumPy 2.3.5다. npm package 설치나 source PDF, 실제 Lean/Mathlib 설치는 이 runtime job의 전제가 아니다. Lean의 새 컴파일은 별도 기존 workflow에서 수행한다. source package guard에는 기록된 원본 Lean source/log/import closure 및 `gauge/evidence/y7-real-attempt3-38215697672.zip`이 필요하다.

실행 순서는 다음과 같다. 첫 bundle 검사는 테스트가 새 receipt를 쓰기 전에 해야 한다.

```bash
python -m pip install numpy==2.3.5
python -B research-ide/mathscope-m3/web/build_extended.py --check
node research-ide/mathscope-m3/gauge/tests/verify_transport.mjs
python -B research-ide/mathscope-m3/gauge/tests/verify_package_guards.py
python -B research-ide/mathscope-m3/web/tests/test_extended_build.py
node --test --test-reporter=tap research-ide/mathscope-m3/web/tests/extended-worker.test.mjs
node --test --test-reporter=tap research-ide/mathscope-m3/gauge/tests/*.test.mjs
node research-ide/mathscope-m3/gauge/verify_runtime.mjs
node research-ide/mathscope-m3/navier/tests/run.mjs
python -B research-ide/mathscope-m3/navier/tests/independent_numpy.py
```

workflow에는 frozen M2 receipt 3개·source entry 250개 및 현재 Navier 구현 6개의 read-only SHA 검사도 있다. `build-source-inheritance.py`를 CI의 generator로 실행하지 않는다. 그 generator는 baseCommit을 현재 checkout으로 기록하므로 검증 대상 source record를 다시 쓰게 된다. 현재 workflow는 기존 record와 actual bytes를 직접 비교한다.

게시 중 확인한 `\ufeff`→U+FEFF escape 손상은 정확한 실패 hash로 재현하고, UTF-8/base64 전송 후 45개 source의 원래 해시를 그대로 확인한다. hash 기준을 완화하지 않았다. package guard는 임시 복사본에서 finite/Real Lean source·compiler log·import closure를 각각 변조하고 거부되는지 검사한다. 6개 subprocess의 기대 결과가 맞았으며 원래 working source와 receipt bytes가 유지됐다. 이 두 단계는 새 Lean 증명 실행이 아니다.

로컬 독립 확인은 Node 24.19.0/Python 3.12.14/NumPy 2.3.5에서 수행했다. 기존 검증된 gauge 26/26, 공개 예제 13개 및 MATCH replay, extended Worker 9/9, original-criteria builder 9/9, Navier 36/36·11 replay, NumPy 4/4에 더해 source transport 45개와 package guard 6개를 확인했다. P8의 source-model 9개와 Canvas mount 7개는 해당 P8 CI glob에서 검사된다. 이 수치는 서로 다른 검사 단위이므로 합산해 ‘56개 모두 통과’라는 수로 만들지 않는다.

실패한 CI에서도 로그를 artifact로 남긴다. fresh result JSON은 모든 실행 단계가 통과한 뒤에만 수집하여, 실패 중 남아 있는 예전 receipt를 새 실행 결과처럼 올리지 않는다. 최종 source/progress 변경 후 bundle을 명시적으로 재생성하고 `--check`해야 하며, CI는 stale bundle을 자동 재생성해서 통과시키지 않는다. workflow YAML과 14개 shell 단계의 구문·실패 전달·최초 freshness 검사·마지막 artifact 수집 조건을 독립 확인했다. 새 commit에서 실행되는 CI의 실제 링크와 conclusion은 해당 PR의 Checks와 최종 인계에서 확인하며, 이 보고서는 그 실행이 이미 성공했다는 주장을 포함하지 않는다.

### 화면 검증 receipt의 해석

§3.6의 실제 receipt는 게시 page/version과 source, package/example, run/source hash, 화면의 값·단위·bounds/색 척도/vector scale, selection 원본, camera/LOD 전후 불변성, 실제 import/replay, 입력 변경 stale 및 route 복귀를 보존한다. Canvas fallback에서는 `renderer=CANVAS2D`, `state=READY`, `currentModelRendered=true`, 단일 canvas와 실제 source selection을 확인했다. 이 증거로 Y6와 P8의 해당 UI 요건 및 N8-06/08의 UI 부분을 갱신했다. N6/N7의 해석적 구성이나 N8의 rigorous error enclosure는 여전히 별도 미완료 조건이다.

## 8. 이 보고서가 읽은 원본과 증거 bytes

### 기준·진행표 snapshot

아래 SHA는 이 보고서 작성 시점에 한 번 읽어 판정·집계에 사용한 bytes다. 이후 새 증거로 진행표가 바뀌면 이 보고서를 그 후속 판정으로 오인하지 않도록 snapshot과 집계를 함께 갱신해야 한다.

| 파일 | SHA-256 |
|---|---|
| [ORIGINAL_M3_M4_CRITERIA.json](ORIGINAL_M3_M4_CRITERIA.json) | `bfe0e57b127849a5413414c8e8340ed5592049082fd211d9172a2fce6f219156` |
| [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json) | `7e78f62d36a32ecd9085cf98a0957c6db5faf5c5c77fe2266213e0cf1a72193e` |
| [N6_PROGRESS.json](N6_PROGRESS.json) | `804bbacfe0873ba72cb5a75fe8a8c324da374952224c2e11c7eca5eb8db1dda4` |
| [N7_PROGRESS.json](N7_PROGRESS.json) | `5faa9aa9da18bcaf935372ed8d044bc006b9e0d9df69c443fd1ec0123921eb70` |
| [N8_PROGRESS.json](N8_PROGRESS.json) | `95ef2b4441af6cf8a486d71a42cd3dbda874420036d2faec2d7387d271d45080` |
| [P8_PROGRESS.json](P8_PROGRESS.json) | `67886a870bee815f3a4d17a9cf09bade268223818e4acb82261d34cebbf0da9f` |

작성 시점 checkout HEAD: `7e5378bbaafdd9188e1362724dd06475e29a3a05`. 이 HEAD는 아직 commit되지 않은 이번 추가 파일 전체를 포함한다는 뜻이 아니다. 보고서의 행별 출처는 위 진행표 SHA 및 다음 실제 파일 SHA에 결속된다.

### 행별 증거 파일

| 참조 | 파일 | SHA-256 |
|---|---|---|
| E001 | [gauge/field-family.mjs](gauge/field-family.mjs) | `a044f36ece053a5b06baedcd201ffc550e918dcda0afb5b6c48a7372a995b1f2` |
| E002 | [gauge/ensemble-family.mjs](gauge/ensemble-family.mjs) | `587157317f0accb863aa698029f4afe42e45ccb486d5bfb83a36b676c8ee30b0` |
| E003 | [gauge/lattice-observation.mjs](gauge/lattice-observation.mjs) | `c258abb337c07f338aac90451bc4ea99d7c9964a37d20197e1f6d8ebb7ec90bb` |
| E004 | [gauge/wilson-flow.mjs](gauge/wilson-flow.mjs) | `38b11e8cea65280c43c7d5a4a824ab063d137c38e4c6b99d0fa2ca6e36f147cf` |
| E005 | [gauge/evidence/runtime-audit.json](gauge/evidence/runtime-audit.json) | `3147d819e9a1afabe93ad7ee8a653339d6da5523fcd9d7c13056c960472b6542` |
| E006 | [gauge/tests/gauge-m3.test.mjs](gauge/tests/gauge-m3.test.mjs) | `e946ffdad8e689a76c295ea938c96bc6d1f20abfc96bb81797be6735c4415a13` |
| E007 | [gauge/tests/lattice-observation-flow.test.mjs](gauge/tests/lattice-observation-flow.test.mjs) | `48af2079b8fec60a43ea27ec88aad2a74c492ede52efe2d4fd4e11a8e5de150d` |
| E008 | [navier/source-inheritance.json](navier/source-inheritance.json) | `f0308dde26467a6bbe83193576fa50ba04aa12e3d32657e66d4e348dfcfb8f6f` |
| E009 | [navier/source-mean-map.mjs](navier/source-mean-map.mjs) | `072f9cbaa7fedab6ea2cdb64158a7d5af3c3916685dfefeef65e977219ef09b7` |
| E010 | [navier/evidence/N6-source-mean.json](navier/evidence/N6-source-mean.json) | `445487febc8b71c352bd41595bfd331e46ca7a80d209bd9400591c8a5ee03ed9` |
| E011 | [navier/corrections.mjs](navier/corrections.mjs) | `120c595312afb232138a4e23b26ae7a7de987aa15729af8fe9f50f5bccea2c8f` |
| E012 | [navier/README_KO.md](navier/README_KO.md) | `885cfa2dd62722b75082db554b6ae808ba1a8e33c86579fe5eeb2a60600be382` |
| E013 | [navier/localization.mjs](navier/localization.mjs) | `1754c965e6cc977d1e304d16b8eb20578ff27e6158801ea426a4e94f29b090fb` |
| E014 | [navier/evidence/N7-workbench.json](navier/evidence/N7-workbench.json) | `8ddf1c4e79291c38993bb1707c7668e083e41475bb132103593edce2777203b3` |
| E015 | [navier/evidence/N7-periodic.json](navier/evidence/N7-periodic.json) | `3dfec6b6c207da3373d50b25709a1c112fe13c47a65e379ac5dd3f702d740948` |
| E016 | [navier/galerkin.mjs](navier/galerkin.mjs) | `e0a04a0a5363a7d72dec89fe3b157499669db317bc064d9922ccedf3599239aa` |
| E017 | [navier/evidence/acceptance.json](navier/evidence/acceptance.json) | `c5fd58431dd79791be60564cd207e6f63f1e351fda82908ff1592b6eb01f928d` |
| E018 | [navier/evidence/independent-numpy.json](navier/evidence/independent-numpy.json) | `8c92db3341050cae05b037c536a3fa0b77e4fd1a8509df81a0cb19271f8fb2d7` |
| E019 | [navier/evidence/N8-nearT.json](navier/evidence/N8-nearT.json) | `a4770f90b44d56f5528c198942b40a089dcd27062322d6b88b43890f6f24ce76` |
| E020 | [navier/index.mjs](navier/index.mjs) | `d6b98110ee1644279478ac193fd1dd25cb973b74d08f21d23cf0bcf3e85dc89b` |
| E021 | [web/extended-view-contract.mjs](web/extended-view-contract.mjs) | `c2cd46f23899ada0136c688a07f4efbf60c46ee6ad02f99c57ca51e62c23d2c8` |
| E022 | [web/tests/extended-worker.test.mjs](web/tests/extended-worker.test.mjs) | `44f2d917da96943b68969f48cf01f8e4c19ee989d39e18e3e99e9cc2e1569a55` |
| E023 | [web/p8-visual-models.js](web/p8-visual-models.js) | `8398cdf82f2c3aa61f0514a38945cce309b098da1617cc48a2e36e4f645a8009` |
| E024 | [web/p8-visualization.js](web/p8-visualization.js) | `72266bdc840b668eee8a9b01cc68a62d7a431cae7e7671f66c39c5af4655428b` |
| E025 | [web/p8-workspace.js](web/p8-workspace.js) | `0f7c9b6f3580ce482ea9b5673dfe1d943fe6ee04994848d4b449415616cbbd44` |
| E026 | [tests/p8-visual-models.test.mjs](tests/p8-visual-models.test.mjs) | `b21807f7095d7fa604f9460da40b2f6a0d60abaf5d55bc11e5287ffdfee449d1` |
| E027 | [tests/p8-visualization.test.mjs](tests/p8-visualization.test.mjs) | `e0b14c5473db42c1c8e091af5d8492c1691d4d255ce0af47b6e17e10a58e28ac` |
| E028 | [p8/theorem-backlog.mjs](p8/theorem-backlog.mjs) | `c41b33ae0b960493ace981619bfc4bb6f5850fb95b28b9f1665a0716a5f44ca2` |
| E029 | [p8/review-packets.mjs](p8/review-packets.mjs) | `8444d1f240d0affc0d7ba2f1882c28967103ea57c18369781d0175a70e53601d` |
| E030 | [evidence/live-ui/acceptance.json](evidence/live-ui/acceptance.json) | `ad15205805dade8f24cc4d75a52fb00ad7740932fb2f8387ee6348d816e2d408` |
| E031 | [gauge/evidence/live-ui-v85-v89-gauge.json](gauge/evidence/live-ui-v85-v89-gauge.json) | `9729ad0f3a4af8d04b578319eaf79b19e0efe590f14289dc747d64c574531bbf` |
| E032 | [gauge/evidence/ui-criterion-assessment.json](gauge/evidence/ui-criterion-assessment.json) | `7197fa143ca054431e5c96258feb366d98b8bf9c8dc641a23c61220754917c83` |
| E033 | [p8/evidence/p8-live-v87-20261012.json](p8/evidence/p8-live-v87-20261012.json) | `e6e1095bea78d9c3d22a124d1fa5bff1406ba5eb140dcbb0d3388e482688d0a5` |
| E034 | [p8/evidence/p8-renderer-local-20261012.json](p8/evidence/p8-renderer-local-20261012.json) | `b4b10655d5167f755c752cc5a4b3a3f09e52eb73d372f53aa7f72166f779b520` |
| E035 | [p8/evidence/p8-local-acceptance-20261012.json](p8/evidence/p8-local-acceptance-20261012.json) | `21830db348976f74b12eff9e4b150c78119351f04a44fcf6394f3cb6cd00551d` |
| E036 | [p8/evidence/p8-final-integration-20261012.json](p8/evidence/p8-final-integration-20261012.json) | `a2fbfebfede4e372b9410035438127003a1b956d1960af9f964c621f8a08391f` |
| E037 | [evidence/live-ui/n8-live-v85.jpg](evidence/live-ui/n8-live-v85.jpg) | `26a38107736ad24b189c945f168f2159a15e8d7f3cdedd1eda7b3ca371dc67b6` |
| E038 | [evidence/live-ui/p8-refinement-v87.jpg](evidence/live-ui/p8-refinement-v87.jpg) | `c59d516c292b4cf80d404b62a67a894ff1b99cefbaf564a7bc294276ec3bf495` |
| E039 | [evidence/live-ui/gauge-delta-v88.jpg](evidence/live-ui/gauge-delta-v88.jpg) | `1a7a24caf55020f7f77101463677f2e32d20b7427e8920ddca772e3210265b55` |
| E040 | [p8/evidence/lean-release.json](p8/evidence/lean-release.json) | `6dfbda277e97d50a77e52fe4250548ee2b4e1db24ec3dcc342cc7c740ed08d3f` |
| E041 | [p8/evidence/conditional-lean-release.json](p8/evidence/conditional-lean-release.json) | `d9793a3a4242c8dd06c0ae89ca928eddff3df7bbfb9b0cc88624a4b2c0a3fa0e` |
| E042 | [p8/evidence/lean-release-provenance.json](p8/evidence/lean-release-provenance.json) | `d9f2809f7bab440d8643bd9517ebd5709324d8c4c2facb1004ba9bb7f49b39f5` |
| E043 | [gauge/evidence/real-lean-release.json](gauge/evidence/real-lean-release.json) | `3eef9ae012dcc15a120dcfd5180ebf07c04ccabe04b5b1f4920b707ced836d81` |
| E044 | [gauge/evidence/real-lean-audit/audit.json](gauge/evidence/real-lean-audit/audit.json) | `bcc6a0d60c9b39f11fcf8b854af9b42dfb50f77f789b7dc4f3228f505ef03413` |
| E045 | [gauge/evidence/lean-audit.json](gauge/evidence/lean-audit.json) | `23510ec876bc5f6f6b3442fbe13acafa303f7e53588a9d327e32d0581b1dd02a` |
| E046 | [gauge/package_lean.py](gauge/package_lean.py) | `49bdf74eb63bcd98fe3dc9ed3bc01dc5d85c4cab70ef69e25cb7292cf46125da` |
| E047 | [gauge/spectral.mjs](gauge/spectral.mjs) | `ef3cfcb950e26482739e2bb4ce2314a9a9b2d708122b2c41036968066b607d3e` |
| E048 | [gauge/evidence/ensemble-production-attempt2.json](gauge/evidence/ensemble-production-attempt2.json) | `b12ef7c9dacf3ec9294e6e8b580dc76e9453b049c9141d38f4c2dcd7a2eaec61` |
| E049 | [gauge/evidence/source-production2/manifest.json](gauge/evidence/source-production2/manifest.json) | `34c87aff51689d9dc575ab4b49b8df90b243694d407c9a444651016b57400008` |
| E050 | [gauge/lean/FiniteSpectral.lean](gauge/lean/FiniteSpectral.lean) | `3a0d62e4f64f46ab7fa77038cc7f335182bdac9b154c509b407ddc934f9380f4` |
| E051 | [gauge/lean/RealSpectralBridge.lean](gauge/lean/RealSpectralBridge.lean) | `6361ae4a03fc003e0e3cccc21eb5af38dba37a40ed148a5b76d89dcfad886d53` |
| E052 | [gauge/index.mjs](gauge/index.mjs) | `f132dbfacb0179b907698659e4b495837bbc5b825010ed9404accf076074b6fe` |
| E053 | [gauge/evidence/lattice-flow-tests.tap](gauge/evidence/lattice-flow-tests.tap) | `c11928b201ad1b819e09a4626a0539ed8c913f4610164c34cecb94ab49eead1d` |
| E054 | [gauge/evidence/lattice-chain-marginal-mean.json](gauge/evidence/lattice-chain-marginal-mean.json) | `576462954f07f88f43713a4adabf0aa6c58946942b48427185dddfcfe74fefd6` |
| E055 | [gauge/evidence/wilson-flow-su2.json](gauge/evidence/wilson-flow-su2.json) | `cb308ad712a9aa7c68dd17e9817749bb93aa7ad5b79ca7956ebb7949e42c1888` |
| E056 | [gauge/evidence/wilson-flow-g2.json](gauge/evidence/wilson-flow-g2.json) | `2b7f3e5e7b60bc021ca05c79e5149e81771be76c382e6661a2ff28fd0bf3b8cc` |
| E057 | [gauge/proof.mjs](gauge/proof.mjs) | `78fed2a8f916cee4c18e4c52f6a2375a3150dcc578bd3622ffcb3fa09e46ca34` |
| E058 | [gauge/legacy/MathScopeConditionalYM_Core.lean](gauge/legacy/MathScopeConditionalYM_Core.lean) | `c4316c0c6b8d3ba1461b675a377728b8baf2096b6f0ea6938fa9653eb1326639` |
| E059 | [gauge/legacy/MathScopeConditionalYM.lean](gauge/legacy/MathScopeConditionalYM.lean) | `6d64aa5b3f4a62477a6732ed1b6018f4ee588ffd051e22a04fcce9fcbfaa234c` |
| E060 | [gauge/legacy/original-validation.json](gauge/legacy/original-validation.json) | `70d8981c33cf1141336ee1f8213ded28e03978337a244f92e683e3a4f63d5a1f` |
| E061 | [gauge/proof-data.mjs](gauge/proof-data.mjs) | `05679b173ccb3cc20a10364ac3d8f7003f2f69b7ec198b498a8337e4747273a0` |
| E062 | [gauge/verify_lean.py](gauge/verify_lean.py) | `aa5f176d96e17d995daa707c624d77cd94ccb14ca4473e7f17ec7b2f141b52c0` |
| E063 | [gauge/evidence/lean/NegativeJacobi.log](gauge/evidence/lean/NegativeJacobi.log) | `b6a0b1535d9f4d08e30f8a1f23e9be9bfaa9b26cc55f8f00c4532da403e03e4d` |
| E064 | [gauge/evidence/lean/NegativeEmbeddingIndex.log](gauge/evidence/lean/NegativeEmbeddingIndex.log) | `69695150b0deb17ad54406536bb2bef995b72b19f5252faf4b585cdbe6dd2af7` |
| E065 | [gauge/evidence/lean/m1-NegativeWilson.log](gauge/evidence/lean/m1-NegativeWilson.log) | `f3bdc32819754f28b1b2e6bac2e5e0167374d5fed021a591329ac153255131e0` |
| E066 | [gauge/verify_real_lean.py](gauge/verify_real_lean.py) | `5116567220fba46bffe8c9bff354aa8f6d6fd65654cc0cc807b093dd996e9793` |
| E067 | [gauge/contracts.mjs](gauge/contracts.mjs) | `18fcb8237f5547eae3b60879e8fd28baef09cc200c96f4dcb6a82a101a8c57fa` |
| E068 | [gauge/evidence/source-transport-audit.json](gauge/evidence/source-transport-audit.json) | `7be4c6f271f3f7f6250b988e5243ba0313b48726afcacb8368ed12d8720a65a1` |
| E069 | [gauge/evidence/package-guard-audit.json](gauge/evidence/package-guard-audit.json) | `06319f02529ebb16a0a9691a95b9516410af29d042809de42f9d7e04465f2e2a` |
| E070 | [gauge/tests/verify_transport.mjs](gauge/tests/verify_transport.mjs) | `8ecb6d58bae77e249cc94acfe94a7fdee19bad726b62326cb21ee083eaa7ba60` |
| E071 | [gauge/tests/verify_package_guards.py](gauge/tests/verify_package_guards.py) | `c21d7ee1cb592a7eb0838c3ce9a39bdef61a37dab7ecd546ea52f2d64dac9721` |
| E072 | [navier/evidence/N6-harmonic.json](navier/evidence/N6-harmonic.json) | `c062d07837f7e13fabbab71e6e7ed38d916453779baa0afd60b013a620146562` |
| E073 | [navier/evidence/N6-signed.json](navier/evidence/N6-signed.json) | `4880f1e72596f4cc5d7424b7af44704cceace1839faeb550bc72ab20eb7292ad` |
| E074 | [navier/evidence/N6-workbench.json](navier/evidence/N6-workbench.json) | `19a3e1120f5ecd734d877480ddb60f18bab41eb22f89e863f69512d1545550d9` |
| E075 | [navier/evidence/N6-moments.json](navier/evidence/N6-moments.json) | `f81d008ca74cc4be147c648523d469e6e061b1bd5d4dd4adfae28c8148307e6f` |
| E076 | [navier/evidence/N8-acceptance.json](navier/evidence/N8-acceptance.json) | `f9cd254feb4179486732254804e2d547227a9eae1785fb959bed2cc5b36ea505` |
| E077 | [navier/evidence/N8-TG.json](navier/evidence/N8-TG.json) | `0e7168cf3c5c7d44bac56560fe293d16461c698899b8698c1e0f1f0dfddf8e6a` |
| E078 | [web/extended-worker.mjs](web/extended-worker.mjs) | `251ee186104606844e268fb51d83ba896e0a56bf9daacec470dd9f912419c7c8` |
| E079 | [navier/tests/build-source-inheritance.py](navier/tests/build-source-inheritance.py) | `fbb22896d8a589b01a2b45a152202cb10ab737c4d0a27973dcdc45ea9104231a` |
| E080 | [navier/tests/run.mjs](navier/tests/run.mjs) | `0b3c0d2f0c1490288337c3f6e2f795060411f0454e53b5245fb5c8336143dda2` |
| E081 | [navier/tests/independent_numpy.py](navier/tests/independent_numpy.py) | `040cf3c90ae4f240be3314c3cc019ab175f8bf7d96899f04743fb83012b28a9b` |
| E082 | [navier/implementation-pin.mjs](navier/implementation-pin.mjs) | `9224d3b303981e32c9db7b280fc1b0565bb8ded409938c5e742e074ec9782f7d` |
| E083 | [web/build_extended.py](web/build_extended.py) | `00d0f89bd81fb1705c47081a370400aa00e6e9544c920b4ae2afb9b08b47d9c9` |
| E084 | [web/tests/test_extended_build.py](web/tests/test_extended_build.py) | `2fb6f4fe842b9c63b027a93f15caaa3c9a20c4f1fa3d870cbf5a1e6bef32c057` |
| E085 | [CI_EXECUTION_WORKSPACES.md](CI_EXECUTION_WORKSPACES.md) | `c6eb8cff77636c922678278e20107da8fddb0faa722c623936705a3698dbad5a` |
| E086 | [tests/p8-contracts.test.mjs](tests/p8-contracts.test.mjs) | `23501ba7c05f7bcff41dc6b6790ba85f49f7c4ab6fbba1823aec7cd6d18591d4` |
| E087 | [p8/evidence/lean-attempt7-38213076249.zip](p8/evidence/lean-attempt7-38213076249.zip) | `b2373daa628b2bd736f7a45ef6970b9c473e5b06841a0ab514aeb6a8f7635b91` |
| E088 | [p8/evidence/conditional-local-20261012/receipt.json](p8/evidence/conditional-local-20261012/receipt.json) | `5abd83b35420bf6b32edf3d07ae3bfd8d9e69467e7ad0819fda699a69294e16f` |
| E089 | [p8/tools/test_conditional_audit.py](p8/tools/test_conditional_audit.py) | `d2a89e8950f47c6fb4676226fecf58297fecd6ab862e2c4bd84481e30205a0d3` |
| E090 | [tests/p8-mutation-audit.test.mjs](tests/p8-mutation-audit.test.mjs) | `07bee26d06a72426f2ed440b154682978dc4da556443ed67281091cc495b0be8` |
| E091 | [p8/evidence/p7-mutation-release.json](p8/evidence/p7-mutation-release.json) | `7871d7f89f395916952e3f21261d7d4e7bbf3bcb1378db1f7245b8b1ebc4fc28` |
| E092 | [tests/p8-candidate-search.test.mjs](tests/p8-candidate-search.test.mjs) | `38c2b3d9b7b8385831a2c0ddfe84206847fc38c4daba6ddd92b62f98b4bdbcc4` |
| E093 | [p8/review-fixture-evidence.json](p8/review-fixture-evidence.json) | `2fdd9d17d1434a5626e8a63bab9362a0b8a9e301f8a01a21afbff9c7ce3aaaa3` |
| E094 | [p8/evidence/p8-worker-transport-20261012.json](p8/evidence/p8-worker-transport-20261012.json) | `56e2bdc7df5d64ad7b6feec6f4916502538ee400467aae6060ce8ffe9768287b` |
| E095 | [evidence/live-ui/p8-transport-failure-v90.json](evidence/live-ui/p8-transport-failure-v90.json) | `4fa72ea0c037861ee941b3ee4f5efd3fa4b30d4ff1c0a5b75d429a4afe9b4c36` |
| E096 | [evidence/live-ui/published-bytes-v91.json](evidence/live-ui/published-bytes-v91.json) | `90f376b6355cdd0f01d9a99e5a9405c7fe57d9a70d921abf55974234c62be49c` |
| E097 | [evidence/live-ui/final-p8-v91.json](evidence/live-ui/final-p8-v91.json) | `ffb10641fc829c342d974595e7815eac352dd89a184aec8e8bd68ed1110761df` |
| E098 | [evidence/live-ui/final-v90.json](evidence/live-ui/final-v90.json) | `a2eabcfe188557bde63c0459e401262637939df20f0622be4882b6cebd037001` |
| E099 | [p8/tools/build_browser.py](p8/tools/build_browser.py) | `a8dd2938e13a3d77b842d53744632ae78121fd6156e8e4af475a7ca0d5f49bf8` |
| E100 | [tests/p8-engine.test.mjs](tests/p8-engine.test.mjs) | `2a6947314dd6854b8789c49df75e9aee8c00a8017d0bdb323bbe60023f40e03c` |
| E101 | [tests/p8-worker-transport.test.mjs](tests/p8-worker-transport.test.mjs) | `af2567c7a0247560e0586ad6c9dfafc956ca468639b2a8c37577b9731cb9f66f` |
| E102 | [p8/build-data.json](p8/build-data.json) | `42f5bf1f54c2c87adf775e686ed4c1bb4d5f0f69f739fa2ec0024c3a0d744919` |
| E103 | [web/p8-engine.bundle.js](web/p8-engine.bundle.js) | `bea0c12d231ab2fad70bc5aa72836465b20a996406a5416f953079ceef410974` |
| E104 | [p8/evidence/p8-worker-transport-tests-20261012.tap](p8/evidence/p8-worker-transport-tests-20261012.tap) | `946ee5c0cbcb98475c05798a8d17d72f033ef7018cdbac302fa57cae3d1ea2b0` |
| E105 | [p8/evidence/p8-worker-transport-python-20261012.log](p8/evidence/p8-worker-transport-python-20261012.log) | `ecb2481fe4fc37e099494fd2eac56322269cfb68a6d7b32b8bde0a57efe94e8a` |
| E106 | [p8/evidence/p8-worker-transport-static-20261012.log](p8/evidence/p8-worker-transport-static-20261012.log) | `8da766d32cc56079d2964829007ce7d09f8b5a01286e195269c6ea076f811b87` |
| E107 | [p8/evidence/p8-worker-transport-build-check-20261012.log](p8/evidence/p8-worker-transport-build-check-20261012.log) | `f8af9bed363567f2b47c0f7953cb0842fedf87026623a45af884bc7c22c5a0e0` |
| E108 | [evidence/live-ui/p8-final-v91.jpg](evidence/live-ui/p8-final-v91.jpg) | `875d0e6f5021a3563f9e605a8b200d585f0ce8df650d733842244460d068e2c5` |
| E109 | [evidence/live-ui/n8-final-v90.jpg](evidence/live-ui/n8-final-v90.jpg) | `28b5f63df04fc1d35cd76fa5991b83e63a77fcbd3052ebb529bcaa99ab3bb021` |
| E110 | [evidence/live-ui/publication-v91.json](evidence/live-ui/publication-v91.json) | `78f6cf3b91cdffb5fd0194f12b0bd62753c92799ffcdabeede8b37e681f84ca9` |
