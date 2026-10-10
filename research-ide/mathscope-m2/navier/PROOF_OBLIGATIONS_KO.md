# 남은 실제 same-profile 구성 의무

## 판정 범위

원문 N4/N5 16개 중 10개 finite operator/observation gate가 PASS이고 6개 actual-source construction gate가 PARTIAL이다. OPEN은 없다. 이는 blueprint p.57의 M2 패키지 완료를 뜻하지 않는다. 패키지는 같은 N3에서 출발한 배경·stress·flat error와 실제 pulses의 연결을 요구하며, 조건부 연산자에 임의의 숫자를 입력하는 것만으로 그 source instance가 만들어지지 않는다.

원문은 `checklist.mjs`에 그대로 보존했다. 수학 원전은 README에 기록한 PDF §5–7이며 원본 N3와 parameter expression/profile evidence hash를 변경하지 않았다. 아래에서 “미입력” 또는 “미구성”은 N3의 기존 완료 상태를 취소하는 말이 아니라 **새 M2 작업에 필요한 고차 함수·bound·실행 evaluator가 아직 만들어지지 않았음**을 뜻한다.

## 6개 기준별 정확한 잔여물

| 기준 | 아직 필요한 실제 object 또는 inequality | 외부 정리를 그대로 적용할 수 있는 시점 | 구체적 다음 작업 |
|---|---|---|---|
| **N4-03 inner Picard** | 모든 필요한 n의 `F_n`, `A_0,n`, `A_1,n`이 같은 leading profile와 이미 복구한 이전 차수에서 계산되어야 한다. 전체 선택 eta strip과 공통 radial interval의 실제 `C_n` 및 Cauchy loss가 필요하다. 현재 API의 `Cn=.5`는 명시한 operator premise이며 실제 source norm이 아니다. | 원문 (5.7)/(5.8), Lemma 5.1의 실제 입력 함수·analytic domain·uniform norm을 구성하고 증명하면, 기존 6×6/block 및 두-parity tail backend로 tail implication을 검증할 수 있다. 지금의 finite eta-zero core 값 75개만으로 전체 strip의 Cn을 유도할 수는 없다. | 먼저 n=1의 full same-profile coefficient/forcing evaluator를 만들고 공통 `a²=X_a exp(t1/16)` 및 eta strip에서 majorant를 계산한다. interval/validated analytic arithmetic으로 Picard sum과 tail을 출력한다. radial interval을 n마다 임의로 축소해 문제를 피하지 않는다. |
| **N4-04 five moments** | 실제 inner `phi_n,U_n`을 cutoff한 뒤 얻는 다섯 **total moment debt 함수** `m_n^0(eta)`가 필요하다. 실제 f(eta)와 양성·support 조건 하에서 correction coefficient 함수를 적용하고 V_n,Pi_n와 stress를 복원해야 한다. n=1과 n≥2의 stress support가 다르다. | 원문 (5.10)–(5.16), Lemma 5.2의 실제 debts와 source support 입력이 생기면 현재 실제 λ·Ipos 행렬 inverse에 넣을 수 있다. 행렬 가역성을 증명한 것과 debt 자체를 계산한 것은 별개다. | N4-03 결과로 실제 moments를 적분하고 eta derivatives를 enclosure한다. U의 2개 및 E의 3개 correction을 실제 계수에 적용해 다섯 모멘트가 0임을 확인한다. `nextOrderAllowed`는 이때만 true가 될 수 있다. |
| **N4-05 finite residual** | 복구된 실제 계수 0..N과 `R+div(T)`가 필요하다. (5.25)의 `C_N,m`, `K_m`을 계산하고, N 증가·공간격자·정밀도 변화의 효과를 분리한 실제 residual norm 감소가 있어야 한다. 현재 exact polynomial의 monomial 수는 residual norm이 아니다. | N4-03/04의 actual sequence 및 derivative bounds가 들어오면 원문 finite background estimate의 가정을 구성할 수 있다. 그 뒤 upper bound와 직접 residual interval 계산을 대조해야 한다. | 실제 coefficient/stress evaluator를 `finiteBackgroundResidual`에 대입하고 N=1,2부터 독립 Cartesian 잔차와 비교한다. grid/precision/N을 별도 축으로 refinement하고 실제 CNm/Km을 export한다. 미계산 상수를 verified tail로 표시하지 않는다. |
| **N5-04 phase/frame** | 실제 source annulus의 F,G 및 모든 필요한 derivatives, lambda0>0의 하계, normal denominator gap과 frame determinant 하계가 필요하다. `q_star`가 충분히 작아 원문의 `Sstar²*(epsilon+epsilon²+1/k)` smallness 등 모든 조건을 동시에 만족해야 한다. | 실제 slow-domain norms·stress cone·frame 입력으로 원문 §7.1의 uniform hypotheses를 인증하면 현재 complete normal/chain-rule/frozen-frequency operator에 연결할 수 있다. | 실제 F/G jet evaluator와 uniform bounds를 source annulus에서 구성한다. 실제 h를 보존한 log/expression arithmetic으로 q_star 및 carrier ceil을 정하고 모든 source frame determinant를 enclosure한다. ell≤900의 core 관측 구간을 pulse 인증 영역으로 재라벨링하지 않는다. |
| **N5-05 growing/decaying ODE** | 실제 source coefficient system (7.13)/(7.17)과 원문 growing-mode datum이 필요하다. 현재 midpoint unit seed는 그 datum이 아니다. `E=O(Sstar^-1)` 등의 comparison bound, actual damping의 reference와의 오차, integration error, 모든 요구 slow derivatives 및 양 끝 실제 t의 Gaussian constants가 필요하다. | Lemma 7.4의 실제 frame/coefficient hypotheses와 growing datum을 구성하면 reference P Gaussian bound 및 tangent integrator를 사용할 수 있다. reference P만의 Gaussian 상계는 t와 P의 비교 정리를 대신하지 않는다. | source left growing-mode seed를 log representation으로 생성하고 actual projected ODE를 검증된 오차를 가진 방식으로 적분한다. midpoint normalization은 그 해의 정규화로 수행한다. cP≤|t|≤CP 및 필요한 derivative Gaussian estimate를 bound해 N5-06/08에 넘긴다. |
| **N5-06 two-family covariance** | 실제 두 homogeneous pulse의 (7.27) Hcov 적분과 같은 N3의 `T0,*`가 필요하다. 전체 인증 영역에서 `det Hcov` 하계, y±>0, `C(W0)=epsilon*T0,*`, 그리고 once-per-slow-box global (7.30)을 확인해야 한다. 현재 constant-polarization target fixture는 이 target 함수가 아니다. | N5-04/05의 actual source pulses·bounds 및 source stress cone이 구성되면 원문의 positivity/inversion argument를 적용할 수 있다. 정확한 normalized Haar와 angular 1/2 backend는 준비됐다. | cutoff χψ와 실제 두 t를 적분하고 Hcov interval inverse 및 양의 weights를 계산한다. 원문의 한 방향/두 방향 영역을 구별한다. ±를 같은 slow box의 별도 두 box로 합산하지 않고, full pulse curl remainder를 포함한 실제 covariance/residual에 연결한다. |

## 완료한 조건부 gate가 위 의무를 숨기지 않는 방법

### N4-06: 모든 q에 대한 scalar schedule

`a_(j+1)>=2*a_j`와 각 supplied m≤j의 부등식은 실제 outward log 연산과 단조성으로 증명한다. `constantLedger.operatorCertificate=true`여도 `sourceDerivativeBoundsVerified=false`이다. 실제 repaired coefficients에서 나온 `C_hat[j,m]`, P, g가 생기면 같은 API로 재실행할 수 있지만, 현재 기본 수치 상수가 그 도함수 상수라고 주장하지 않는다.

### N4-08: 실제 locally finite sum

완전한 compact domain에 대해 `a_J*q_min>=1`을 exact binary64-dyadic rational 비교로 검사한다. 모든 future cutoff가 같은 doubling construction을 따른다는 조건에서 보지 않은 j>J의 cutoff는 전부 0이다. 이 경우 실제 supplied vector potential에 C∞ cutoff를 곱해 합산한 `localSum.value`가 있다. 부족한 prefix에서는 `localSum=null`이다.

이 gate의 PASS는 local-finiteness operator와 active index 계약을 완료한다. 실제 source coefficient sequence 및 그 tail constants가 있다는 주장은 N4-03/04/05가 완료된 뒤에만 가능하다. `uncutFiniteFormalTruncation`을 같은 물리적 sum이라고 부르지 않는다.

### N5-01: 실제 accepted core의 관측

원본 accepted assembly가 지정한 core receipt에서 원래 interval을 읽는다. 두 chart는 각각 exact q/Y 역변환과 physical exponent algebra를 수행하고, 변환한 normalized velocity를 독립적으로 되돌린다. source receipt/Y/Q/T/interval/scale의 변조는 실패한다. 이 실제 eta-zero core 관측은 전체 annulus의 pulse evaluator를 대신하지 않는다.

### N5-07: 원문의 보편 curl 연산자

`C_m=i(nPhi×t_m)/(km|nPhi|²)`에 대해 원문 (6.6)의 fast/slow 미분과 cylindrical basis 미분을 모두 수행한다. `r_m=[-Dz Ctheta, Dz Cr-Dr Cz, (Dr+R^-1)Ctheta]`를 제거하면 실제 covariance/residual 대조가 실패한다. exact div-curl 및 physical Q exponent 항등식, mixed jets, 독립 Cartesian curl/divergence refinement, conjugate symmetry를 확인했다.

이 항등식은 prescribed smooth tangent coefficients 전체에 대한 연산자이다. 시각화에 사용하는 compact C∞ probe는 정의된 source operator의 실제 입력이며, source N3의 실제 homogeneous pulse라고 표시하지 않는다. actual pulse class estimates와 global assembly는 N5-04/05/06과 연결해야 한다.

### N5-08: 전체 cutoff residual 및 조건부 flatness

m≤8의 복소 interval jet에서 `D^k[(1−psi)f_m+psi_prime*t_m]`를 모든 Leibniz 항과 함께 계산한다. ψ의 k+1차 도함수와 forcing/amplitude 경로를 보존하고, ψ′ 또는 forcing을 누락한 negative control은 다른 실제 residual을 만든다.

별도 log-bound 곡선은 선언된 c,C,M에 대한

\[
-c\ell^2+(M+N)\ell\log2+2C\log\ell
\]

의 조건부 결과다. 국소 residual jet과 특정 ell의 source Gaussian envelope를 서로 연결하거나 비교했다고 표시하지 않는다. 실제 source c,C,M은 N5-05에서 도출해 전달해야 한다. machine zero를 모든 차수의 flatness 증거로 쓰지 않는다.

## 현재 계산으로 source instance를 닫을 수 없는 이유

남은 문제는 버튼·시각화·파일 링크 또는 더 촘촘한 유한 grid의 부족이 아니다. 현재 archive에서 실행에 사용할 수 있는 실제 core interval은 지정한 eta-zero 표본이고, M2의 실제 positive-order solutions·corrected total moments·uniform annular pulse coefficients를 반환하는 evaluator는 아직 없다. 선언된 operator premises를 원본에서 유도된 값으로 바꿀 근거도 없다.

특히 실제 h는 `exp[-8002(exp(1048576)+10)]`로 양수이다. 일반 binary64에서 h를 0으로 읽고 k=1 또는 toy q_star를 선택하면 다른 계산이 된다. 극소 물리 배율을 exact expression으로 유지하는 관측은 구현했지만, 전체 analytic strip/annulus의 theorem-input certification과 validated ODE integration을 대신하지 않는다.

외부 정리를 이름만 인용해 PASS로 바꾸지는 않는다. 실제 함수를 구성하고 해당 정리의 정량 입력·부등식·동일 datum의 provenance를 공급하면 닫을 수 있는 항목이며, 그 구체적 입력을 위 표에 고정했다. 현 상태에서는 **source-instance 완료, 원문 M2 패키지 완료 또는 전역 Navier–Stokes 증명 완료**라고 보고할 수 없다.
