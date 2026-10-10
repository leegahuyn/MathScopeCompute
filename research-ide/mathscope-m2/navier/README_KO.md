# M2 Navier–Stokes: 원문 연산자·실제 core 관측·구성 경계

## 현재 상태

원문 N4/N5 16개 기준 중 **10개 PASS, 6개 PARTIAL, 0개 OPEN**입니다. 14개 예제는 모두 실행되고 실제 계산 결과의 그래프와 수치표를 반환합니다. 기본 예제 결과는 8개 연산자·관측 `COMPLETED`, 6개 실제 구성 `PARTIAL`로 구별됩니다. 원문 기준 문구는 `tests/fixtures/original-n4-n5.json`과 byte-equivalent 문자열 대조를 하며 바꾸지 않았습니다.

여기서 PASS는 해당 원문 **연산자 또는 유한 관측 acceptance**를 뜻합니다. Blueprint의 M2 패키지 완료관문인 실제 배경·stress·flat error의 전체 연결은 아직 닫히지 않았습니다. 모든 결과와 체크리스트는 `sourceInstanceCertified: false` 또는 대응하는 `fullSameProfileN4/fullSameProfileN5: false`, `allOrderSourceCertificate: false`, `formalComplete: false`를 유지합니다. 기존 N3 완료 상태를 변경하거나 새 Lean 커널 실행을 주장하지 않습니다.

## 원전과 동일한 N3 연결

- 수학 원전: [Finite Time Blowup for Navier–Stokes](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), §5–7. PDF SHA-256: `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
- 원문 체크리스트: `MathScope_Research_IDE_Blueprint_v1_KO(1)(9).pdf`, N4 p.58, N5 p.60, 패키지 완료관문 p.57. SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.
- 보존한 N3 identity: `same-profile-2026-10-10.3`, repository commit `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`; assessment SHA-256 `e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c`.
- 원문 Lean snapshot: `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`. 기존 형식 연결 검토 자료는 읽기만 했으며 새 proof term이 생성됐다고 표시하지 않습니다.
- 동일 profile assembly: `mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/one-profile-0002/receipt.json`, SHA-256 `184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd`.
- 실제 core receipt: `mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/core-intervals-0002/receipt.json`, SHA-256 `8f65d85d903df534c2c10501119fbcef636678c95ec214e165041681d16fb5a5`.

`tests/build-source-binding.py`는 기존 여섯 입력 파일의 hash와 전체 parameter expression graph를 보존합니다. `tests/build-source-core-binding.py`는 accepted assembly의 `acceptedEvidence.core` 링크를 먼저 검증한 뒤 원본 75개 구간을 그대로 추출합니다. 원본 파일은 수정하지 않습니다.

실제 source exponent는

\[
h=\exp[-8002(\exp(1048576)+10)]>0
\]

입니다. 이를 `.005`, `1/128` 또는 0으로 대체하지 않습니다. `[0,2^{-1000}]`는 양의 실제 h를 담는 표시용 enclosure이며, 하단 0은 대입값이 아닙니다. 별도의 수치 연산자 probe가 유한 h를 사용하면 `EXPLICIT_SMOOTH_VERIFICATION_COEFFICIENTS; NOT_N3_PROFILE_VALUES`로 표시합니다.

## 실행 항목

| 요청 kind | 실제 계산·표시 | scope |
|---|---|---|
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

### 실제 core의 두 chart

승인된 receipt는 `eta=0`, `Y=Lambda*X`의 `Y=0,1,2,4,41/10`에서 다섯 normalized quantity와 radial order 0,1,2를 기록합니다. 해당 구간에는 실제 infinite core와 비교 다항식 사이의 양의 비선형 오차, 전체 radial tail과 산술 오차가 이미 포함됩니다. 이 구현은 그 구간을 비교 다항식의 점값으로 줄이지 않습니다.

새 core 예제는 그중 `Phi=CE/sqrt(2X)`의 order 0을 표시합니다. 두 인접 chart는 각각 `T=3/4,3/2`를 사용하여 같은 `q=Q*T`를 복원합니다. `Lambda*R²/(2*T)`로 원본 Y를 역산하고,

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

현재 전체 suite는 **51개 Node 검사**입니다. 별도 Python 검사는 원본 물리 PDE의 exact Taylor jet 대조, exact support 비교, 70/100/400자리 수치 대조, exact polynomial residual derivative를 포함합니다. 상세 개수·입력 hash·코드 hash·모든 example receipt는 `evidence/acceptance.json`에서 확인합니다.

음성 대조는 axial viscosity의 n−1 항, pressure shift, cylindrical connection, χ′ 또는 rm 누락, 빠른 auxiliary chain rule 누락, Q/T 배율 누락, 잘못된 Haar factor, source receipt·Y·interval 변조, 부족한 cutoff prefix, ψ의 최고차 도함수 누락, covariance cone 밖의 target 등을 실제로 실패시킵니다. `EXACT`, `FORMAL`, 임의 정밀도 요청은 지원하지 않는 계산을 한 것처럼 라벨링하지 않고 명시적으로 거절합니다.

새 source operator는 exact BigInt rational polynomial 및 Q(√2) 산술, 또는 IEEE754 outward interval을 사용합니다. ODE의 RK4 refinement는 경험적 수렴 진단이며 rigorous solution-error enclosure로 표시하지 않습니다. 그래프는 source hash와 raw interval/point 경로를 유지하며 축 라벨을 데이터 경로로 오인하지 않습니다.

## 남은 실제 구성

남은 기준은 N4-03/04/05와 N5-04/05/06입니다. 필요한 정확한 함수·부등식·정리 입력과 실제 다음 단계는 [PROOF_OBLIGATIONS_KO.md](PROOF_OBLIGATIONS_KO.md)에 정리했습니다. 기존 N3를 다른 h나 다른 profile로 교체하는 것은 이 의무를 해결하지 않습니다.
