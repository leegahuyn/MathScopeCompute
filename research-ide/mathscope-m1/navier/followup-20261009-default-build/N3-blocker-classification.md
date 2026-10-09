# N3 잔여 조건의 성격 — v50을 변경하지 않는 후속 검토

검토일: 2026-10-09. 기준은 v50 `checklist-status.json`, 실제 `leading-profile-candidate.json`, 첨부 논문 pp.129–163이다. 이 문서는 구현 또는 인증의 새 완료 판정이 아니다. 원본 70개 수용기준과 v50 판정·소스·receipt를 수정하지 않는다.

## 결론

N1-05의 원래 default build 중단은 실행 환경이 허용하는 **남은 실행 작업**이다. 그래서 16:36:01 UTC에 별도 후속 로그로 재개했다. 반면 N3-01–07의 잔여 조건은 빌드를 한 번 더 실행하거나 화면을 연결해서 해결되지 않는다. **누락된 논문 연산의 구현과, 그 연산이 실제 선택된 데이터에서 원문의 전칭 조건을 만족한다는 정량 인증**이 함께 필요하다.

원문은 관련 존재·접합·cone 정리를 제공한다. 따라서 이 잔여 작업을 새로운 Navier–Stokes 존재 정리를 처음부터 해결해야 하는 일이나 계산 불가능성으로 설명하면 부정확하다. 필요한 것은 그 증명의 유한한 매개변수 선택, norm 상계와 작은 근방을 하나의 계산 가능한 witness 및 오차 증명으로 구체화하는 작업이다. 기존 예시가 그러한 witness라는 증거는 아직 없다.

| 원문 항목 | 아직 구현할 연산 | 새로 채워야 하는 수학적 인증 | 현재 성격 |
|---|---|---|---|
| N3-01 | 의존 순서를 따르는 상수 탐색, log 좌표·정밀도 처리, 선택의 certificate 출력 | `C_pre`, `B_k`, `T_sh`, complex domain, contraction/moment 허용량을 정량화하고 모든 sufficiently large/small 요구를 동시에 만족시켜야 한다. | 주로 정량 선택의 인증. 숫자 상수를 임의로 바꾸는 것만으로 해결되지 않음. |
| N3-02 | `Amp(η)` root, M/J/S 보정, A.11의 두 angular/pressure bump, A.7 heat 대체 후 보상 및 최종 공통 압력 | 모든 `η∈[-1,1]`에서 positivity, moment equality, 압력 적분 tail와 analytic datum의 오차를 구간 또는 해석 증명으로 보장해야 한다. | 구체적인 누락 코드가 있으며 그 위에 uniform 인증이 필요함. |
| N3-03 | 필요하다면 더 높은 coefficient order와 majorant evaluator, complex norm/연산자 bound 계산 | `B_ρ`의 invariant ball, contraction `<1`, 공통 `Ω`, positivity 및 무한 nonlinear tail를 보장해야 한다. 유한 degree 잔차 감소는 대체 증거가 아님. | 실제 유한 비선형 재귀는 이미 구현됨. 주 잔여는 무한 해석 대상에 대한 정량 인증. |
| N3-04 | 인증된 axis/profile 입력에 기존 Π, V₀ 복원을 연결 | 실제 무한 profile의 (4.13) leading residual이 0이고 Cartesian regularity 조건이 충족됨을 연결해야 한다. | 발산 소거 항등식과 유한 복원 코드는 있음. N3-03 인증의 후속 연결이 핵심. |
| N3-05 | diagnostic interpolation을 B.5–B.7의 controlled continuation으로 대체; 실제 5-bump 교정 실행 | continuum quadrature enclosure, uniform 5×5 Jacobian inverse, interval Newton inclusion, 필요한 η-도함수 오차 및 cone 보존 | 실제 누락 구현과 중요한 새 수치 인증 모두 필요. 작은 planted fixture의 Newton 성공은 실제 접합 성공이 아님. |
| N3-06 | Lemma C.1의 평균을 보존하는 실제 admissible shear loop, C.12 변조와 첫 patch의 exact moment 복원 | 실제 `(X,η,φ)` 전체에서 양의 loop margin, `O(N⁻¹)` 상수, 유한 N 선택, 교정 후 전 구간 κ>0 | 임의 주기함수나 독립 cone box로 대체할 수 없는 논문 구성·인증 작업. |
| N3-07 | 완성 stress에서 B.30/A.48–49의 factor와 collar 데이터를 추출 | 실제 annulus 내부의 nonzero stress, 양 끝의 factor lower bound, smooth normalized limit와 support identity | N3-02/05/06 이후의 해석적 끝점·지지 인증. 0/0 회피 코드나 C∞ cutoff만으로 충족되지 않음. |

## 원문은 일부 유용한 수치 상계를 이미 준다

### 1. Outer amplitude: 구체적인 bracket이 있지만 전체 오차 상수가 필요하다

논문 p.133의 (A.19)는 `Amp∈[0.9,1.2]`에서 `0.20<K_b≤0.25`, 주항의 끝값 `<−0.047`와 `>0.038`, amplitude 도함수 `≥0.36`을 준다. 실제 오차는 `‖E‖C¹≤C_pre λ(1+log(1/λ))`이다. 따라서 `C_pre`의 검증된 상계를 채우면 endpoint signs와 비영 도함수를 유지하는 명시적 λ 조건을 정할 수 있다. **이 root solve는 구체적인 다음 구현 대상**이다. 단일 η의 Newton 수렴만으로 전체 η구간의 유일성·매끄러움을 주장해서는 안 된다. [p.133, (A.19)–(A.23)]

### 2. Axis fixed point: 무한 계수 공간의 bound와 finite recurrence를 연결해야 한다

`B_ρ`의 가중치는

`a_{αβ}=20^(−α) ρ^(−β) β! binom(α+β,β)/((α+1)²(β+1)²)`

이고, Lemma B.1은 multiplication constant `C_sq²`, `C_sq=8∑_{n≥1}n⁻²`를 준다. 예를 들어 integral test로 `C_sq<16`의 보수적인 상계를 얻을 수 있으므로 이 대수 bound 전체가 알려지지 않은 것은 아니다. p.148은 radial degree b 위에서 `‖J₂F‖≤80/((b+1)(b+2))‖F‖` 및 `‖T^k‖≤(40Mχ)^k/(k!(k+1)!)`도 준다.

남은 것은 완성된 outer pressure datum의 공통 복소영역과 각 계수 norm, 실제 remainder `R₁,R₂`의 uniform bound·Lipschitz constant를 평가하는 것이다. 합성된 fixed-point perturbation의 ball bound를 M, Lipschitz 상계를 L, ball radius를 r라고 정의했다면 `M/(2Λ)≤r`, `L/(2Λ)<1` 같은 명시 조건을 실제 상계로 채워야 한다. 이 설명의 M/L/r는 **아직 계산·인증되지 않은 변수**이며 인증 결과를 주장하지 않는다. 이후 coefficient norm과 `R<20`에서의 geometric/binomial tail를 사용해 실제 infinite profile을 감싼다. [pp.145–148, (B.4)–(B.16), Proposition B.2]

### 3. 정확한 접합: residual이 작은 것과 exact root의 존재는 다르다

원문은 `X_R=X_i(CP_*)^10`으로 radial scale을 정규화하고, `x_sep=e^(T_sh)/(CP_*)^10`을 작게 만들어 moment discrepancy를 줄인다. (B.39)의 `C_k`는 앞서 선택된 axis·shape data에 의존한다. 보정 구간은 `−6<log x<−5`; U의 두 bump와 E의 세 bump를 쓴다. 5×5 moment map의 nonlinear term은 정확히 quadratic이다. [pp.155–157, Proposition B.8, (B.35)–(B.40)]

실제 profile을 interval로 둘러싼 뒤, approximate inverse B와 coefficient box A에 대해 interval Newton/Krawczyk의 **strict inclusion**을 보여야 한다. 예를 들어 `a₀−B F(a₀)+(I−B DF(A))(A−a₀)⊂int(A)`는 사용할 수 있는 표준 충분조건이다. 이 포함 판정에 들어갈 integral/Jacobian interval과 필요한 η-도함수 전체가 아직 없다. 현재 실제 diagnostic continuation에서는 moment 교정이 실패로 남았으며, planted 작은 fixture의 성공은 이 입력을 인증하지 않는다.

### 4. Cone: 실제 loop, 그 margin, 그 다음 finite N의 순서다

Lemma C.1의 loop는 평균이 원래 `(a,−b_s)`와 같고, 모든 `(X,η,φ)`에서 네 cone gap이 `κ_L>0`인 smooth loop이다. 임의 sine primitive는 이 조건을 대신하지 않는다. Proposition C.2는 이 **고정된 입력과 loop**에 대한 moment·압력 오차 `C_m/N`를 추정한 뒤 N을 선택한다. 첫 예약 patch에서 다시 다섯 moments를 정확히 복구해야 한다. [pp.158–162, (C.1)–(C.2), (C.12)–(C.16)]

p.162는 첫 correction matrix의 U-weights가 `1`과 `X^(−λ)`라서 `λ→0`일 때 서로 합쳐진다고 명시한다. 따라서 N3-01에서 λ를 작게 잡은 후의 실제 inverse bound와 N을 평가해야 한다. 고정 λ의 가역성을 λ 전 범위의 균일한 conditioning으로 바꿔서는 안 된다.

### 5. Flat edge: 그림의 threshold나 zero guard가 증명은 아니다

최종 stress를 `T₀=ζ B`로 분리하고, collar에서 B의 smoothness 및 `|B|≥b₀>0`을 인증하면 `T₀/|T₀|=B/|B|`의 끝점 연장을 다룰 수 있다. 현재 ζ 식과 0/0 입력 거부는 구현되어 있지만 **실제 stress가 이 factor를 가지며 B가 영이 아니라는 연결**이 없다. 이는 completed inner/outer construction 및 moment identities가 들어와야 하는 후속 인증이다. [pp.151–153, (B.30); pp.142–144, (A.48)–(A.49); pp.163–165, Proposition C.3]

## 다음 구현을 시작할 때의 의존 순서

1. N3-01에서 외곽 단계에 필요한 상계와 λ/h 선택 조건을 명시한다.
2. N3-02의 실제 amplitude·angular·heat moment 보정을 구현하고 uniform pressure datum을 인증한다.
3. 그 datum으로 N3-03의 complex-domain fixed point와 tail를 인증하고 N3-04의 복원 항등식에 연결한다.
4. N3-05의 controlled continuation, 정규화된 오차, actual five-moment exact root를 인증한다.
5. N3-06의 실제 admissible loop와 유한 N을 구성하고 moments를 다시 복구한다.
6. N3-07의 실제 stress support·edge factor 및 모든 Theorem 4.6 조항을 연결한다.

각 단계는 실패/오차를 보존하는 유용한 부분 기능으로 추가 구현할 수 있다. 다만 전체 원문 profile 인증 등급은 마지막 증거가 연결되기 전까지 false를 유지해야 한다. N4–N8의 all-order background, Borel 합성, pulse, force localization은 이 N3 분석의 밖이며, N1 default build 성공으로 자동 구현되지 않는다.
