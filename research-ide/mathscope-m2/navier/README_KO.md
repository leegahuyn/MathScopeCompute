# M2 Navier–Stokes: 원문 연산자·실제 core 관측·구성 경계

## 현재 상태

원문 N4/N5 16개 기준 중 **10개 PASS, 6개 PARTIAL, 0개 OPEN**입니다. 18개 예제는 모두 실행되고 실제 계산 결과의 그래프와 수치표를 반환합니다. 기본 예제 결과는 8개 연산자·관측 `COMPLETED`, 10개 구성·국소 계산 `PARTIAL`로 구별됩니다. 원문 기준 문구는 `tests/fixtures/original-n4-n5.json`과 byte-equivalent 문자열 대조를 하며 바꾸지 않았습니다.

여기서 PASS는 해당 원문 **연산자 또는 유한 관측 acceptance**를 뜻합니다. Blueprint의 M2 패키지 완료관문인 실제 배경·stress·flat error의 전체 연결은 아직 닫히지 않았습니다. 모든 결과와 체크리스트는 `sourceInstanceCertified: false` 또는 대응하는 `fullSameProfileN4/fullSameProfileN5: false`, `allOrderSourceCertificate: false`, `formalComplete: false`를 유지합니다. 기존 N3 완료 상태를 변경하거나 새 Lean 커널 실행을 주장하지 않습니다.

## 원전과 동일한 N3 연결

- 수학 원전: [Finite Time Blowup for Navier–Stokes](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), §5–7. PDF SHA-256: `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
- 원문 체크리스트: `MathScope_Research_IDE_Blueprint_v1_KO(1)(9).pdf`, N4 p.58, N5 p.60, 패키지 완료관문 p.57. SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.
- 보존한 N3 identity: `same-profile-2026-10-10.3`, repository commit `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`; assessment SHA-256 `e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c`.
- 원문 Lean snapshot: `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`. 기존 형식 연결 검토 자료는 읽기만 했으며 새 proof term이 생성됐다고 표시하지 않습니다.
- 동일 profile assembly: `mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/one-profile-0002/receipt.json`, SHA-256 `184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd`.
- 실제 core receipt: `mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/core-intervals-0002/receipt.json`, SHA-256 `8f65d85d903df534c2c10501119fbcef636678c95ec214e165041681d16fb5a5`.

`tests/build-source-binding.py`는 기존 여섯 입력 파일의 hash와 전체 parameter expression graph를 보존합니다. `tests/build-source-core-binding.py`는 accepted assembly의 `acceptedEvidence.core` 링크를 먼저 검증한 뒤 원본 75개 구간을 그대로 추출합니다. 원본 파일은 수정하지 않습니다.

원본 자료가 η=0의 75개 값에 한정된 것은 아닙니다. 같은 Φ에 대해 **125개 mixed radial/η coefficient와 75개 mixed derivative 관측**, 실제 nonlinear domain, B.26/B.34·B.8·C.12를 거치는 전역 구성 명세도 보존돼 있습니다. 75개 core 값만을 근거로 전체 자료가 없다고 보았던 이전 설명을 정정합니다. accepted Banach 오차는 실제 실수 η∈[-1,1] 전체에 적용됩니다. 이전 관측의 `|η|≤ρ/4`는 그 부분영역이며, η=0 중심 비교 급수의 `|ξ|≤1/16, ξ=η/j0`도 별도 조건입니다. 새 점 평가기는 요청한 η에서 비교함수를 다시 계산하고 실제 비선형 오차를 더합니다. [독립 수학 검토](research/ACTUAL_CORE_INDEPENDENT_REVIEW_KO.md)에 두 영역을 구분한 근거가 있습니다. 원본 정합성과 실행 가능한 함수의 현재 범위는 [재검토 기록](research/RESUMED_SOURCE_AUDIT_KO.md)에 있습니다.

실제 source exponent는

\[
h=\exp[-8002(\exp(1048576)+10)]>0
\]

입니다. 이를 `.005`, `1/128` 또는 0으로 대체하지 않습니다. `[0,2^{-1000}]`는 양의 실제 h를 담는 표시용 enclosure이며, 하단 0은 대입값이 아닙니다. 별도의 수치 연산자 probe가 유한 h를 사용하면 `EXPLICIT_SMOOTH_VERIFICATION_COEFFICIENTS; NOT_N3_PROFILE_VALUES`로 표시합니다.

## 실행 항목

| 요청 kind | 실제 계산·표시 | scope |
|---|---|---|
| `ns.actual-core-evaluation` | 요청한 정확 Y·η에서 actual Φ의 0–2차 혼합 미분, actual pressure, u/K·평균 및 U의 구간; 96–512비트 directed BigInt | 원래 core와 B26용 자연 연장을 구분; 전체 접합·모멘트는 PARTIAL |
| `ns.actual-global-source` | 실제 외곽 U/E·M/(XE)·V/(XE) 15관측, 전체 outer AST, Ω의 정규 6적분 축소와 축 경계 및 C12/I1 오차 | 원본 외곽 값과 적분식; 전체 적분·correction은 PARTIAL |
| `ns.actual-background` | 같은 N3의 실제 n=1 Taylor DAG, 공통 collar C1·Cauchy loss·무한 tail 식, 축 3개 미분과 양의 반경 15개 차분몫 구간, Imean의 0이 아닌 모멘트 기여 | 원본 기반 국소 계산; 전체 모멘트와 고차 잔차는 PARTIAL |
| `ns.actual-mean-pulse` | 같은 N3의 Imean F/V/b/G와 3차 slow jet, whole-box 상계, 국소 phase/frame·원문 왼쪽 datum·Gaussian 값 비교 | 실제 Imean 국소 구성; 전역 phase/ODE/covariance는 PARTIAL |
| `ns.background-recursion` | 원래 cylindrical PDE의 exact coefficient 추출, n=1,2 직접 대입 대조, 모든 i+j=n 항 | N4-01/02 PASS; 실제 계수 해는 미구성 |
| `ns.background-picard` | 원문 6×6 선형계·공통 반경 계약·두 parity의 무한 tail 상계 | 선언한 Cn에 조건부; N4-03 PARTIAL |
| `ns.background-moments` | 실제 λ와 Ipos에 대한 2×2/3×3 모멘트 행렬과 interval inverse | 실제 moment debts 미입력; N4-04 PARTIAL |
| `ns.background-residual` | 유한 차수 원래 PDE 잔차의 모든 differential polynomial | 실제 norm/CNm/Km 미계산; N4-05 PARTIAL |
| `ns.background-cutoffs` | 모든 q·m에 대한 cutoff 부등식, C∞ cutoff를 곱한 supplied potential의 실제 합, 완전한 active prefix 증명 | N4-06/08 조건부 operator PASS |
| `ns.potential-curl` | 원문 (5.45)의 χ′ radial 보정 exact 항등식과 Cartesian curl probe | N4-07 PASS |
| `ns.dyadic-charts` | 실제 h로 선택한 고정 label·dyadic geometry, 별도 actual core overlap 자료 | N5-01 관측 PASS |
| `ns.source-core-charts` | 실제 accepted Phi(Y,0) 구간을 두 chart에서 각각 복원 | N5-01 관측 PASS |
| `ns.torus-derivatives` | 정확한 Q(√2) eigenvector·dual basis·전체 evaluated chain rule | N5-02 PASS |
| `ns.pulse-support` | countable source mesh 전체를 위한 2,250색 유리수 지지 분리 certificate | N5-03 PASS |
| `ns.pulse-ode` | 모든 세 normal 성분을 유지한 tangent-frame RK4, log amplitude, energy balance, reference Gaussian | 실제 source frame/growing datum 미연결; N5-04/05 PARTIAL |
| `ns.pulse-covariance` | 정확한 정규화 규약의 두 polarization covariance와 cone 실패 | 실제 source 두 pulse/global stress 미연결; N5-06 PARTIAL |
| `ns.pulse-curl` | 원래 Cm의 mixed jet 미분·전체 rm·Cartesian curl/divergence·conjugate pair | N5-07 generic harmonic operator PASS |
| `ns.pulse-tail` | 실제 supplied complex residual jets의 전체 (1−ψ)f+ψ′t 및 별도의 조건부 고정차수 log envelope | N5-08 conditional operator PASS |

### 실제 비선형 core의 요청점 계산

`ns.actual-core-evaluation`은 기존의 η=0 표본을 재사용하는 대신 각 입력점에서 비교 급수를 새로 평가하고, 전체 radial tail과 accepted nonlinear displacement를 별도로 더합니다. Y는 정확한 유리수로 0–4.1, η는 `RHO_SCALED`, `J_SCALED`, `DIRECT_RATIONAL` chart를 선택합니다. 직접 η는 [-1,1]에 속하는 분자·분모 각 4096비트 이하 유리수입니다. Y≤4는 실제 수정 전 core이고 Y>4는 B.26 입력을 위한 자연 연장으로 표시합니다.

Φ의 η 도함수는 `j0^m ∂η^m ∂Y^k Φ`이며, 축방향 패널은 ordinary η 도함수를 사용합니다. U의 0차 값은 RHO/J chart에서만 j0로 나누고 DIRECT chart는 η=0에서도 ordinary 배율을 유지합니다. 정확한 끝점, 복원 식과 두 오차를 각 수치표에 보존합니다. 산술 bits를 늘려도 양의 실제 nonlinear 오차는 제거되지 않습니다.

입력 `bits` 또는 `precision:{mode:"DIRECTED_BIGINT",bits:256}`로 96–512비트 산술을 선택합니다. 두 bits를 동시에 쓰면 일치해야 합니다. 다른 NS 계산은 이 arbitrary precision backend를 사용하지 않습니다. 실제 구간의 수학 검토와 지원 계약은 [계산 명세](research/ACTUAL_CORE_POINT_EVALUATOR.md), [독립 검토](research/ACTUAL_CORE_INDEPENDENT_REVIEW_KO.md)에 있습니다.

### 실제 외곽 장과 전체 Ω 적분의 축소

`ns.actual-global-source`는 선택한 η와 `xi=lambda*log(X/Xp)`에서 원본 외곽 U/E, M/(XE), V/(XE)를 계산합니다. 기본 5개 좌표의 15개 비영 관측은 원래 continuous integral receipt와 엄밀한 remainder를 사용하며, 원래 양의 h·lambda를 0으로 대입하지 않습니다.

전체 두 Ω functional은 `v=V/X`를 사용한 6개 regular integral로 정확히 축소했습니다. 축 경계 `V_X(0,0)=-4`와 고정 부분구간의 양쪽 경계 부호를 보존합니다. C.12 및 I1의 차이는 두 functional의 **값**에 대한 별도 상계이며 고차 η 도함수나 pulse shear의 오차를 대신하지 않습니다. 전체 outer source의 scalar root·적분·보정 정의는 3,785개 노드의 실행 가능한 식 그래프로 반환합니다. 그 식 그래프를 모두 평가하거나 전역 debt가 닫혔다고 표시하지 않습니다.

새 core 점 평가를 B.22의 reference moments, B.26/B.34 접합, B.8의 실제 다섯 debt와 선택 root, 전역 셀 적분으로 연결하는 작업이 남습니다. [외곽 구성 설명](research/ACTUAL_GLOBAL_SOURCE_KO.md)과 [정규 적분 유도](research/WEIGHTED_OMEGA_REDUCTION_KO.md)에 정확한 다음 입력과 184개 독립 검사를 기록했습니다.

### 새로 연결한 실제 n=1 배경

`ns.actual-background`는 같은 accepted nonlinear recurrence에서 `F1,U1,K1,Pi1,V1`의 exact Taylor DAG를 구성합니다. 원래 공통 반경 `a²=Xa exp(t1/16)`을 유지하며 실제 source 식으로 analytic strip, `C1`, Cauchy loss와 `4^(-K)/3` tail 상계를 도출합니다. K개의 Picard 항을 모두 수치 평가했다는 뜻은 아닙니다.

축 그래프의 세 값은 **첫 방사 미분**이고 서로 다른 정확한 정규화를 사용합니다. 양의 반경 그래프의 15개 값은 5개 `Xi>0`에서 세 계수의 **정규화한 차분몫 `s*f(Xi)/Xi`**를 감싼 구간입니다. Xi는 극소 양의 exact 식이며 0으로 대입하지 않습니다. `tailBits`를 바꾸면 Xi도 달라지므로 고정 점의 정밀도 수렴 또는 N4-05 잔차 감소 검사로 해석할 수 없습니다.

또한 Imean에서는 U가 0이어도 누적 모멘트로부터 `V0=-m*`, `Omega0=-m*²/(2X)`가 남습니다. 새 패널은 두 정규화 적분 기여 `1-exp(-5)`와 `-5/4`를 보여 줍니다. 전체 Ω 적분이나 다섯 debt가 닫힌 것으로 표시하지 않습니다. 수식 유도와 193개 독립 검사는 [실제 배경 설명](research/ACTUAL_BACKGROUND_KO.md)에 있습니다.

### 새로 연결한 실제 Imean pulse

`ns.actual-mean-pulse`는 같은 N3의 보존된 Imean에서 F, V, radial b, 정확히 0인 G를 계산합니다. 고정된 band chart의 `(rhoR,Z,T_chart)`에 대한 총차수 3까지 20개 도함수와 전체 관측 상자의 도함수 상계를 보관합니다. 정규화를 복원해도 이것이 곧 물리적 Cartesian 성분은 아닙니다.

실제 방향 여유, 양의 h, 원래 왼쪽 초기조건 `z_plus(0)=P(0)>0, z_minus(0)=0`를 유지하고 국소 normal/frame 오차와 Riccati·Gaussian 값 비교를 연결합니다. 곡선은 **정규화한 기준 log P와 Gaussian 상계**이며 실제 진폭의 수치 적분값은 아닙니다. 전역 annulus, 모든 slow derivative Gaussian bound, covariance의 완료 플래그는 false입니다. 421개 독립 검사와 국소 증명의 범위는 [실제 pulse 설명](research/ACTUAL_MEAN_PATCH_PULSE.md)에 있습니다.

### 실제 core의 두 chart

승인된 receipt는 `eta=0`, `Y=Lambda*X`의 `Y=0,1,2,4,41/10`에서 다섯 normalized quantity와 radial order 0,1,2를 기록합니다. 해당 구간에는 실제 infinite core와 비교 다항식 사이의 양의 비선형 오차, 전체 radial tail과 산술 오차가 이미 포함됩니다. 이 구현은 그 구간을 비교 다항식의 점값으로 줄이지 않습니다.

`ns.source-core-charts` 예제는 그중 `Phi=CE/sqrt(2X)`의 order 0을 표시합니다. 두 인접 chart는 각각 `T=3/4,3/2`를 사용하여 같은 `q=Q*T`를 복원합니다. `Lambda*R²/(2*T)`로 원본 Y를 역산하고,

\[
 C Q^A u_\theta/R=T^{-1-h}\Phi,
\quad
 u_\theta=q^{-A}\sqrt{2Y/\Lambda}\,\Phi/C
\]

를 affine h 지수의 exact 합으로 확인합니다. 먼저 다른 chart 값으로 변환한 구간을 각 chart에서 되돌리므로 같은 interval을 두 번 복사하는 검사가 아닙니다. 표시축은 source Y와 normalized Phi이며, 물리량의 극소 배율은 식과 로그식으로 남깁니다. Y=0에서 `u_theta=0`은 analytic extension으로 처리합니다.

`ell=8..900`은 이 **유한 좌표 관측**의 지원 범위이며, source pulse의 작은-q 인증 영역을 의미하지 않습니다. `ns.dyadic-charts`의 일반 R/Z/T geometry 행과 `actualCoreOverlap`의 실제 core 표본은 각각 자기 좌표와 tau를 보존합니다. 전체 eta 또는 gluing 이후 전역 field evaluator가 제공된다고 주장하지 않습니다.

### 조건부 cutoff와 tail

`ns.background-cutoffs`는 선언된 각 `C_hat[j,m]`에 대해 log-bound의 경계값과 단조성을 사용하므로 유한 q sampling을 전구간 증명으로 쓰지 않습니다. 실제 profile에서 그 상수들이 유도됐다는 주장과 scalar 부등식의 검증은 `constantLedger`에서 분리됩니다.

`results.localPotentialSum`은 supplied 세 성분 potential에 실제 C∞ cutoff를 곱한 뒤 더합니다. `a_J*q_min>=1`과 이후 cutoff의 doubling 계약이 성립하면, compact domain 전체에서 보지 않은 모든 항의 cutoff가 정확히 0입니다. 이때만 `localSum`을 반환합니다. 조건이 부족하면 `PREFIX_EXHAUSTED`, `localSum:null`, 필요한 prefix 길이를 반환합니다. `uncutFiniteFormalTruncation`은 다른 값으로 별도 기록하며 uncut 무한급수 수렴을 주장하지 않습니다.

`ns.pulse-tail`은 `residualJet`의 ψ 도함수 0..m+1, complex vector f/t 도함수 0..m를 사용해 모든 Leibniz 항을 계산합니다. m≤8의 실제 입력값·구간과 결과 경로가 export됩니다. 별도 log graph는 선언한 Gaussian/derivative-loss envelope의 조건부 결과입니다. **이 국소 jet은 특정 ell 또는 source family와 결속되어 있지 않으며, 실제 residual과 그 envelope의 크기 비교를 수행했다고 표시하지 않습니다.**

### 수정한 원문 전사·정규화

원문 (7.2)의 식은

\[
 B_s^2=\frac{\lambda_0}{\epsilon k^2(1+u_*^2)^{3/2}}
\]

입니다. 이전 `Bs=2*lambda0/(...)`는 잘못된 전사여서 수정했습니다. reference `P`는 실제 Bs² 정의로 midpoint log값 0과 연속 Gaussian 상계를 만족합니다. 그것만으로 실제 pulse t의 균일 Gaussian 상계를 인증하지 않습니다.

정규화 Haar 평균에서 degree-14 covering의 **모든 inverse lift**를 포함하면 `14^Delta * 14^(-Delta)=1`입니다. 전역 factor를 `1/14`로 두지 않습니다. (6.19)/(7.27)의 국소 rectangle Jacobian은 `4−2√2`이고 angular 평균은 `1/2`입니다. 잘못된 과거 예제는 `evidence/historical-v0.1.1/`의 역사 자료로만 보존하며 현재 acceptance에서 제외됩니다.

## 검증과 재현

```bash
node research-ide/mathscope-m2/navier/tests/generate-evidence.mjs
```

기존 51개 Node 검사에 실제 배경 13개, 실제 Imean pulse 13개, actual core 14개, actual global source 14개를 더해 총 105개 검사를 수행합니다. 별도 Python 검사는 원본 물리 PDE의 exact Taylor jet 대조, exact support 비교, 70/100/400자리 수치 대조, exact polynomial residual derivative, 400자리 chart 역변환·3차 혼합차분을 포함합니다. 실제 배경 193개, 실제 pulse 421개, actual core 68개, global source 184개의 독립 검사를 기존 286개 원문 검사와 함께 기록하여 총 1,152개를 대조합니다. 최종 개수·입력 hash·코드 hash·모든 example receipt는 `evidence/acceptance.json`에서 확인합니다.

음성 대조는 axial viscosity의 n−1 항, pressure shift, cylindrical connection, χ′ 또는 rm 누락, 빠른 auxiliary chain rule 누락, Q/T 배율 누락, 잘못된 Haar factor, source receipt·Y·interval 변조, 부족한 cutoff prefix, ψ의 최고차 도함수 누락, covariance cone 밖의 target 등을 실제로 실패시킵니다. `EXACT`, `FORMAL`과 설치 범위를 벗어나는 정밀도 요청은 거절합니다. 실제 core에만 96–512비트 `DIRECTED_BIGINT`를 허용하며, 구간 포함과 정확한 함수값·형식 증명을 구분합니다.

새 source operator는 exact BigInt rational polynomial 및 Q(√2) 산술, 또는 IEEE754 outward interval을 사용합니다. ODE의 RK4 refinement는 경험적 수렴 진단이며 rigorous solution-error enclosure로 표시하지 않습니다. 그래프는 source hash와 raw interval/point 경로를 유지하며 축 라벨을 데이터 경로로 오인하지 않습니다.

## 남은 실제 구성

남은 기준은 N4-03/04/05와 N5-04/05/06입니다. 필요한 정확한 함수·부등식·정리 입력과 실제 다음 단계는 [PROOF_OBLIGATIONS_KO.md](PROOF_OBLIGATIONS_KO.md)에 정리했습니다. 기존 N3를 다른 h나 다른 profile로 교체하는 것은 이 의무를 해결하지 않습니다.
