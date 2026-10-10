# 남은 실제 same-profile 구성 의무

## 판정 범위

원문 N4/N5 16개 중 10개 finite operator/observation gate가 PASS이고 6개 actual-source construction gate가 PARTIAL이다. OPEN은 없다. 이는 blueprint p.57의 M2 패키지 완료를 뜻하지 않는다. 패키지는 같은 N3에서 출발한 배경·stress·flat error와 실제 pulses의 연결을 요구하며, 조건부 연산자에 임의의 숫자를 입력하는 것만으로 그 source instance가 만들어지지 않는다.

원문은 `checklist.mjs`에 그대로 보존했다. 수학 원전은 README에 기록한 PDF §5–7이며 원본 N3와 parameter expression/profile evidence hash를 변경하지 않았다. 아래에서 “미입력” 또는 “미구성”은 N3의 기존 완료 상태를 취소하는 말이 아니라 **새 M2 작업에 필요한 고차 함수·bound·실행 evaluator가 아직 만들어지지 않았음**을 뜻한다.

## 재개 작업에서 실제로 완료한 부분

원본에는 η=0 관측뿐 아니라 같은 nonlinear Φ의 mixed radial/η coefficient·derivative 자료와 전역 접합 명세가 있다. 이를 복구해 같은 원본에서 **n=1의 exact Taylor DAG, 실제 공통 collar의 C1·strip·Cauchy loss·무한 tail 식, 축 미분 3개 및 양의 Xi에서의 차분몫 구간 15개**를 구성했다. 또 보존된 Imean의 실제 F/V/b/G, 3차 slow jet와 whole-box 상계, 원문 왼쪽 pulse datum, 국소 phase/frame·Riccati·Gaussian 값 비교를 연결했다.

이 진전은 [실제 배경](research/ACTUAL_BACKGROUND_KO.md), [실제 Imean pulse](research/ACTUAL_MEAN_PATCH_PULSE.md), [독립 원본 감사](research/RESUMED_SOURCE_AUDIT_KO.md)에 식·해시·검사 범위와 함께 기록돼 있다. 아래의 전역 의무를 제거하지는 않는다. 양의 Xi 관측은 bits에 따라 점을 바꾸므로 N4-05의 고정 점 정련이 아니고, 기준 log P 그래프는 실제 homogeneous amplitude의 수치 적분 결과가 아니다.

## 6개 기준별 정확한 잔여물

| 기준 | 아직 필요한 실제 object 또는 inequality | 외부 정리를 그대로 적용할 수 있는 시점 | 구체적 다음 작업 |
|---|---|---|---|
| **N4-03 inner Picard** | n=1의 실제 C1·strip·loss·tail 식과 유한 exact jet, 양의 반경에서의 제한된 함수 구간은 생겼다. 필요한 각 차수의 full coefficient/forcing 함수 평가와 공통 구간의 Picard sum은 아직 완료되지 않았다. 기존 `ns.background-picard`의 `Cn=.5`는 계속 별도 조건부 premise다. | 원문 (5.7)/(5.8), Lemma 5.1의 실제 입력·domain·uniform norm을 각 차수에서 구성해야 한다. 새 C1은 n=1에 대해 원본에서 도출한 값이고, 모든 차수의 Cn을 대체하지 않는다. | 정확한 원본 nonlinear 함수 evaluator를 전체 η strip과 원래 공통 collar에 연결하고, 이미 도출한 tail 식과 함께 실제 Picard partial sum을 계산한다. n≥2는 이전 차수의 전역 모멘트 복구 이후에만 진행한다. |
| **N4-04 five moments** | 실제 다섯 functional의 의존 그래프와 Imean의 두 적분 기여는 계산했다. 전체 nonlinear leading profile를 거치는 두 Ω 적분과 실제 cutoff된 inner 함수의 debt는 아직 닫히지 않았다. U=0인 Imean에서도 V와 Ω는 0이 아니다. | 원문 (5.10)–(5.16), Lemma 5.2의 실제 total debts와 source support 입력이 완성되면 현재 실제 λ·Ipos 행렬 inverse에 적용할 수 있다. 일부 구간의 적분이나 행렬 가역성만으로 전체 debt를 결정할 수 없다. | B.26/B.34→B.8→C.12 이후의 실제 U0/M/V0와 전체 Ω 적분을 실행하고 η 도함수를 enclosure한다. 다섯 correction을 적용해 total moments=0을 확인한 뒤에만 다음 차수의 source를 허용한다. |
| **N4-05 finite residual** | 복구된 실제 계수 0..N과 `R+div(T)`가 필요하다. (5.25)의 `C_N,m`, `K_m`을 계산하고, N 증가·공간격자·정밀도 변화의 효과를 분리한 실제 residual norm 감소가 있어야 한다. 현재 exact polynomial의 monomial 수는 residual norm이 아니다. | N4-03/04의 actual sequence 및 derivative bounds가 들어오면 원문 finite background estimate의 가정을 구성할 수 있다. 그 뒤 upper bound와 직접 residual interval 계산을 대조해야 한다. | 실제 coefficient/stress evaluator를 `finiteBackgroundResidual`에 대입하고 N=1,2부터 독립 Cartesian 잔차와 비교한다. grid/precision/N을 별도 축으로 refinement하고 실제 CNm/Km을 export한다. 미계산 상수를 verified tail로 표시하지 않는다. |
| **N5-04 phase/frame** | 실제 Imean의 F/V/b/G, 3차 slow jet, whole-box 상계, 양의 방향 여유 및 국소 frame 비교상수는 구성했다. 원래 annulus 전체의 완료된 N4 계수열과 공통 uniform bound가 아직 필요하다. | Imean의 국소 normal/projector/frame 비교는 명시한 실제 상수로 성립한다. scalar smallness threshold와 이 국소 결과만으로 전체 q_star 영역의 모든 §7.1 가정을 충족했다고 할 수 없다. | 완료된 전역 N4 배경을 전체 annulus의 jet evaluator와 연결하고, 실제 h·carrier ceil을 유지해 모든 요구 derivative 및 frame determinant를 enclosure한다. ell≤900 core 관측은 별도다. |
| **N5-05 growing/decaying ODE** | 새 실제 Imean 구성은 원문 왼쪽 growing datum, 국소 Riccati/log 비교, Gaussian 값 상계를 보존한다. 전역 actual coefficient system, 검증된 실제 amplitude enclosure와 모든 요구 slow derivative Gaussian 상계는 아직 필요하다. 기존 midpoint unit seed 예제는 별도 연산자 probe다. | Lemma 7.4의 국소 값 비교에 필요한 실제 Imean 상수는 도출됐다. 모든 slow derivative 및 전체 annulus 조건을 인증해야 다음 전역 조립에 전달할 수 있다. 기준 P의 표본을 actual t의 적분값으로 사용할 수 없다. | 같은 왼쪽 datum의 actual projected system을 검증된 오차로 적분하거나 동등한 함수 enclosure를 구성하고, 필요한 모든 slow derivative majorant 및 Gaussian estimate를 계산한다. |
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

남은 문제에는 실제 전역 함수와 적분의 실행 단계가 포함된다. 원본 archive에는 mixed η/radial 자료와 전역 정의도 있고, 이번에는 그 자료에서 실제 n=1 국소 계수·C1 및 실제 Imean pulse 상수를 도출했다. 그러나 B.26/B.34·B.8·C.12를 합성한 전체 U0/M, 두 Ω 적분, 복구된 고차 total moments, uniform annular pulse coefficients를 반환하는 완전한 evaluator는 아직 없다. 기호 정의 또는 미구현 함수에 이름만 붙인 호출을 실행 완료로 취급하지 않는다.

특히 실제 h는 `exp[-8002(exp(1048576)+10)]`로 양수이다. 일반 binary64에서 h를 0으로 읽고 k=1 또는 toy q_star를 선택하면 다른 계산이 된다. 극소 물리 배율을 exact expression으로 유지하는 관측은 구현했지만, 전체 analytic strip/annulus의 theorem-input certification과 validated ODE integration을 대신하지 않는다.

외부 정리를 이름만 인용해 PASS로 바꾸지는 않는다. 실제 함수를 구성하고 해당 정리의 정량 입력·부등식·동일 datum의 provenance를 공급하면 닫을 수 있는 항목이며, 그 구체적 입력을 위 표에 고정했다. 현 상태에서는 **source-instance 완료, 원문 M2 패키지 완료 또는 전역 Navier–Stokes 증명 완료**라고 보고할 수 없다.

## 추가로 닫힌 실제 원본 입력과 남은 연결

새 `ns.actual-core-evaluation`은 실수 η∈[-1,1]의 요청점에서 actual Φ와 축방향 보정·평균의 0–2차 도함수를 96–512비트 구간으로 계산한다. 원문 Banach 오차와 압력 strip 오차를 별도로 유지한다. η=0의 유한 표본밖에 입력이 없다는 제한은 더 이상 현재 상태를 설명하지 않는다. 하지만 점별 구간은 B.26/B.34·B.8을 모두 통과한 셀 적분기가 아니다.

새 `ns.actual-global-source`는 실제 전체 outer U/M의 scalar-root·적분 식, 외곽의 15개 원본 관측과 6개 정규 Ω 적분의 정확 축소를 제공한다. 실제 축 경계와 C.12/I1 omission 값의 상계도 유지한다. 다음 계산은 B.22 reference moments → B.26/B.34 continuation → B.8의 E-dependent 다섯 debt와 선택 root → 6개 실제 regular integral → Ipos inverse의 순서이다. Ω functional 값의 작은 remainder를 모든 η 도함수나 radial shear의 오차로 대체할 수 없다.

현재 이 연결은 완료되지 않았으므로 N4-04의 다섯 전체 debt와 그 보정, 다음 차수 사용 gate를 PASS로 바꾸지 않는다. N4-03의 전 구간 Picard 풀이, N4-05의 실제 잔차, N5의 전체 영역 pulse/covariance도 같은 원본 연결이 필요하다. [점 평가기 독립 검토](research/ACTUAL_CORE_INDEPENDENT_REVIEW_KO.md)와 [전역 Ω 축소](research/WEIGHTED_OMEGA_REDUCTION_KO.md)에 확인 범위를 기록했다.
