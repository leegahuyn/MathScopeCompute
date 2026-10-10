# 원래 9개 잔여 조건의 독립 재판정

검토일: 2026-10-10 KST / 2026-10-09 UTC.  
수학 증거: one-profile-0002와 그 입력 137개.  
보호 Comparator의 이 문서상 마지막 실제 관측: 2026-10-09 23:27:25.692 UTC.

## 1. 판정

**사용자가 지정한 원래 9개 잔여 조건 가운데 7개는 충족했고, N1-06과
N3-03의 2개는 아직 미완료다.** 인수인계 때 이미 충족한 N1-05에 더하여,
이번에는 N3-01·02·04·05·06·07의 실제 동일 프로파일 조건을 충족했다.
N3의 새 판정은 서면 해석 증명, 실행한 연속 구간 포위, 독립 유리수
검증 및 동일 입력 결합에 근거한다. 새 프로파일 전체의 Lean 형식 검증이
끝났다는 판정은 아니다.

이 문서는 기존 61 PASS / 7 PARTIAL / 2 BLOCKED 기준표를 수정하지 않는
후속 판정이다. 이 후속 증거를 원래 70항목에 적용한 별도 집계는
**68 PASS / 2 PARTIAL / 0 BLOCKED**다. 원래 실패·조건부 증거·이전 입력은 그대로 보존한다.
N3-03의 실제 Lean 연결과 N1-06의 실제 보호 실행 결과가 없으므로,
전체 9조건 완료 및 full profile certification은 계속 false다.

| 항목 | 원래 사용자 지정 잔여 조건 | 이번 독립 판정 | 결정적 근거 또는 실제 남은 조건 |
| --- | --- | --- | --- |
| N1-05 공식 Lean 환경 고정 | 원문 전체 기본 빌드의 성공 종료 | **충족 유지** | 동일 원문 전체 기본 빌드 실제 exit 0. 전체 로그·환경·소스·커널·대상 검증을 보존했고 새 독립 감사도 통과했다. |
| N1-06 의존성과 Comparator | 원문 보호 조건을 유지한 독립 Comparator 실행 | **부분 완료·최종 결과 미확인** | 실제 보호 Comparator job이 마지막 관측에서 진행 중이다. 필수 nanoda, 원래 보호 설정, 최종 독립 검사 결과 및 소스 보존을 함께 증명하는 최종 artifact가 아직 없다. |
| N3-01 상수 선택 순서 | 같은 완성 프로파일의 전체 매개변수 계층 | **잔여 조건 충족** | 63개 정확 식으로 동일 상수 계층을 고정했다. 실제 S와 R를 결합하고 하나의 유한 N까지 선택했다. 미지의 compact supremum이나 빈 임계값으로 남긴 선택이 없다. |
| N3-02 외곽과 압력 datum | 보정한 실제 장의 압력과 A.21 목표 압력의 동일성, 모든 eta의 정확 모멘트 | **잔여 조건 충족** | 실제 A.21 적분, 연속 prefix 포위, 후반 무한 tail, B.8·I2·I1의 압력 및 다섯 모멘트 보존을 같은 최종 장에 연결했다. |
| N3-03 축과 수렴 멱급수 | 무한 고정점·유한 jet·절단/반올림 오차·실제 Lean 전제의 연결 | **부분 완료** | 같은 무한해와 실제 유한 배열의 연결은 진전했다. 새 A.21 함수들과 무한 계수공간 입력에 필요한 전체 해석학적 전제를 실제 Lean proof term으로 공급하고 원래 정리에 적용한 커널 결과가 아직 없다. |
| N3-04 core 복원 | 같은 무한 core의 정확한 선도 항등식과 Cartesian 정칙성 | **잔여 조건 충족** | 같은 무한 고정점에서 정확한 div 및 leading tangential 항등식을 도출했다. 실제 core 배열·도함수와 혼합 Phi 계수는 양의 비선형 오차, 무한 tail, 반올림 포위로 같은 해에 연결했다. |
| N3-05 다섯 모멘트 접합 | 실제 연속 적분 포위와 전체 eta의 interval Newton/implicit 인증 | **기존 차단 해소·잔여 조건 충족** | 실제 upstream continuation debt, 모든 eta의 연속 5×5 비선형 포함, 모든 이차항 및 허용 root 상자를 동일 입력으로 연결했다. |
| N3-06 cone 변조 | 같은 최종 장 전 영역의 한 유한 N, strict cone, 균일 복원 | **기존 차단 해소·잔여 조건 충족** | 실제 source upper와 별도 gap lower를 결합했다. 선택한 N에서 전체 연속 영역과 I1 복원 뒤의 공통 strict margin은 R^-10이다. |
| N3-07 지지와 끝점 | 같은 최종 장의 stress·비자명성·flat factorization·끝점 극한 | **잔여 조건 충족** | 최종 stress는 지정 annulus 밖에서 0, 내부에서 양의 flat 하한을 갖는다. 양쪽 끝점 방향 극한과 Ipos/Imean 보존을 동일 최종 장에 연결했다. |

원래 근거는 설계도 p.52의 N1, pp.55–56의 N3,
인수인계 p.4의 9개 표와 p.10의 실행 순서,
[원래 수락 조건 JSON](../../evidence/original-acceptance.json),
[NS_GATES_EN.md](../../../docs/NS_GATES_EN.md)이다.
설계도 p.56은 충분히 크거나 작은 상수를 **명시적 상하계 또는 증명된
선택 조건**으로 바꿀 것을 요구한다. 선택한 유한 수가 크다는 이유로
십진 전개를 새 필수 조건으로 추가하지 않았다.

## 2. 동일 최종 프로파일을 확인한 방식

[결합 명세](../followup-20261010-symbolic-gluing/ONE_PROFILE_SPECIFICATION.md)는
다음 실제 함수들을 순서대로 정의한다. 새 외곽의 정확한 작은 근,
그 외곽의 전체 A.21 적분, 그 datum을 넣은 유일한 무한 axis,
실제 B.26/B.34 continuation, 실제 debt를 복구하는 B.8 근,
A.7 heat 교체와 I2 보상, 원래 C.1/C.12 변조와 I1 복원,
마지막으로 그 최종 함수들의 누적 적분으로 계산한 pressure·stock·stress다.

이 결합은 서로 다른 후보의 성공 로그를 합친 것이 아니다. 최종 정확
매개변수 SHA-256은 다음과 같다.

    e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152

입력 증거 SHA-256은 다음과 같다.

    ff3b1590aa49499417910962736fe2deb8e6088acd7d77e281fd8aba6807c206

[결합본 0002](../followup-20261010-symbolic-gluing/attempts/one-profile-0002/receipt.json)는
63개 정확 매개변수와 137개 입력 바이트 사본을 보존한다.
[별도 독립 감사](assembly-review/0001/receipt.json)는 producer를
import하거나 실행하지 않고 모든 사본의 바이트·해시·실제 소스 일치,
정확 식의 비순환 의존성, 실제 debt·gap·source·core 연결 및 주장 한계를
검사해 **295/295, 실제 exit 0**을 기록했다.

이 295개는 수학 증명의 개수를 뜻하지 않는다. 수학적 연결 자체는
[독립 전체 검토문](ONE_PROFILE_ASSEMBLY_INDEPENDENT_REVIEW_EN.md)에서
영역별로 검토하고, 그 문서가 각 연속 증명과 별도 구간 검증을 가리킨다.
원문 종이·최종 상수·함수 정의·실행 증거가 서로 같은 대상을 가리키는지를
별도로 확인한 것이다.

## 3. N3-01 — 상수 선택은 실제 하나로 닫혔다

원래 순서는 다음과 같이 유지된다.

\[
M_d\to T\to P_*\to\lambda\to h
\to(\epsilon_{\rm moment},j_0)
\to(\delta_*,\sigma_*,\Lambda)
\to T_{sh}\to(C,X_R)\to\text{전이 폭}\to N.
\]

실제 선택의 주요 항목은 다음과 같다.

\[
\begin{gathered}
T=\exp(2^{20})+10,\quad P_*=\exp(2T),\\
\lambda=\exp(-1000T),\quad h=\exp(-8002T),\\
j_0=h^4,\quad \epsilon_{\rm moment}=h^3,\quad \mu_{\rm moment}=h^2,\\
\Lambda=Q^{64},\quad T_{sh}=Q^{90},\\
C=(1+Q^{300})^{10}\exp(Q^{200}),\quad
X_R=110(CP_*)^{10},\\
t_1=\kappa_0=\omega_1=\omega_2=C^{-120},\\
S=C^{100000},\quad R=\exp(S^{256}),\quad
N=1+\lceil R^{50}\rceil,\quad \kappa=R^{-10}.
\end{gathered}
\]

새 C를 선택한 후 이전 C의 고정점을 그대로 쓰지 않는다. 같은 C를
사용하는 무한 해, continuation, 압력과 모든 correction을 다시
하나의 정의로 연결했다. reference derivative bound가 폭 C^-120의
허용성을 증명하고, 실제 source derivative table과 실제 gap ledger가
S 및 R의 전제를 공급한다. 따라서 독립적인 상수 조각만 확보했던
인수인계 시점의 남은 조건을 해소했다.

근거:
[axis 증명](../followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md),
[reference derivative bound](../followup-20261010-same-datum-axis/REFERENCE_DERIVATIVE_BOUNDS.md),
[실제 source bound](../followup-20261010-same-datum-axis/GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md),
[loop derivative bound](../followup-20261010-symbolic-gluing/LOOP_DERIVATIVE_ENVELOPE.md),
[C.12 유한 N 계약](../followup-20261010-symbolic-gluing/C12_FREQUENCY_CONTRACT.md).

## 4. N3-02 — 근사 압력과 정확한 datum을 구분한 뒤 동일성을 증명했다

최종 datum은 실제 A.21 전체 적분으로 정의한다. 그 값을 설명하거나
계산하기 위해 쓰는
\(\Pi_0/P_*^2=-c_P/(1+\eta^2)^2+\text{오차}\)는 그 정의를 대체하지 않는다.

원문 axial interval에서는 angular exponent가 정확히 1이고
\(E=P_1 f(\eta)e^{-s/2}\)다. 이후 모든 미수정 단계의 진폭은
log derivative가 -1/2 이하이므로, 생략한 무한 axial tail과 실제
post-axial tail의 합을 strip에서 \(2e^{-T}<2^{-1400}\)으로 포위한다.
이는 새로운 [독립 tail 검토](PRESSURE_TAIL_REVIEW_EN.md)에서 원문 식과
함께 다시 확인했다. 실제 prefix 적분에는 통과한 0002만 사용하고
실패한 0001은 그대로 남긴다.

접합의 정확성은 적분 근사값의 근접성으로 주장하지 않는다. B.8,
heat 교체 후 I2, C.12 후 I1은 각각의 **실제 incoming debt**를
연속 비선형 방정식의 작은 근으로 상쇄한다. 다섯 모멘트의 정확한
동일성이 해당 접합 이후 pressure와 stock의 동일성을 준다.
열 교체에서는 M/J가 0으로 유지되고 세 E 모멘트의 실제 보상이
datum을 복원한다. 보정 support 내부의 양성·부분 모멘트도 따로
포위하므로, 보정 끝점에서만 맞는 진술에 머무르지 않는다.

네 예약 patch의 정확한 위치와 실제 compact bump 지지는 결합 명세에
있다. 보정 후 Ipos와 Imean의 power law는 그대로다. 이로써 N3-02의
all-eta 압력·모멘트·heat 보상 조건은 같은 최종 장에서 충족된다.

근거:
[정확 압력 증명](../followup-20261010-symbolic-gluing/PRESSURE_DATUM_INTERVAL.md),
[heat 보상 연속 증명](HEAT_COMPENSATION_PROOF_EN.md),
[B.8 및 실제 preloop gap 증명](B8_AND_PRELOOP_GAPS_EN.md),
[C.12 복원 증명](../followup-20261010-symbolic-gluing/C12_FREQUENCY_CONTRACT.md).

## 5. N3-03과 N3-04 — 충족 범위가 서로 다르다

### N3-03의 실제 미완료 조건

같은 새 압력에 대한 무한 계수공간, 연산자, invariant ball, contraction,
정확한 coefficient recurrence와 오차 경계는 작성되었다. 실제 수치
산출물도 새 datum 및 같은 비선형 무한해에 연결된다. 따라서 예전
독립 fixture의 계수를 그 무한해라고 부르던 간극은 크게 줄었다.

그러나 사용자가 명시한 **실제 Lean 해석학적 전제와의 연결**이 아직
전부 실행되지 않았다. 현재 필요한 일은 새 A.21 압력과 실제 함수들을
원래 AxisSpace 입력으로 만드는 proof term, 필요한 smoothness 및 모든
계수/도함수 가중 norm 조건, compatible-data 항등식, 실제 amplitude와
Lambda threshold를 공급하고 원래 fixed-point 정리를 그 자료에
적용하는 것이다. 전제를 structure의 필드로 선언하거나, 그 전제를
가정한 정리를 커널 검사하는 것만으로는 충족하지 않는다.

[FORMAL_BRIDGE_REMAINING.md](../followup-20261010-same-datum-axis/FORMAL_BRIDGE_REMAINING.md)가
이 미완료 입력을 구체적으로 기록한다. 이번 결합본의
generatedAnalyticPremisesLean도 NOT_COMPLETED로 유지된다.
원문 전체 Lean 빌드 성공은 원문을 검증한 것이므로 이 새 입력의
실제 인스턴스를 자동으로 제공하지 않는다.

별도의 구현 한계도 명시한다. 전체 eta 구간의 모든 비선형 recurrence
노드를 직접 수치 전개한 결과는 아직 없다. 이 사실을 숨기지 않되,
아래 N3-04의 원래 항등식 조건에 새로운 필수 조건으로 덧붙이지 않는다.

### N3-04는 원래 요구한 정확한 core 조건을 충족한다

설계도 p.56의 원래 문구는 Cartesian axis regularity와 div u0=0을
항등식으로 확인하고, (4.13)의 leading tangential residual만 0으로
하며 axial viscosity 등을 별도 잔차로 남기도록 요구한다.
인수인계 p.4 역시 남은 조건을 “같은 무한 core의 정확한 선도 항등식과
Cartesian 정칙성”으로 적었다. NS_GATES의 추가 구체화 5번은 실제
유한 배열과 도함수 평가를 정확한 profile에 오차 포위로 연결하라는
조건이다.

같은 무한 고정점에 대해 복원한

\[
E=\sqrt{2X}\,\varphi/C,\qquad
\Pi_X=E^2/(2X),\qquad
V_0=\frac{X}{L}
\left(2\eta U-2D\eta\mathcal A_X(U)
-d\,\partial_\eta\mathcal A_X(U)\right)
\]

가 정확한 평균 항등식과 regular integrating-factor 해의 유일성에
의해 원래 core 식을 만족한다. Cartesian 정칙성과 leading div 및
tangential 항등식은 무한 방정식에서 유도한다. 유한 residual이
작다는 관찰로 정확한 항등식을 대신하지 않는다.

실제 계산된 새 산출물은 다음처럼 범위를 표시한다.

| 계산 산출물 | 실제 범위와 같은 무한해에 대한 연결 |
| --- | --- |
| core 75개 값 | eta=0, Y=0·1·2·4·4.1, radial 미분 0–2 및 지정된 실제 eta 미분을 포함한다. 압력·속도 복원도 같은 datum을 사용한다. |
| Phi 125개 혼합 계수 | radial 0–24차, 정규화 eta 0–4차의 같은 비선형 Phi 계수를 양의 비교 오차와 함께 포위한다. |
| Phi 75개 혼합 도함수 값 | 같은 radial 평가점에서 지정된 eta/radial 미분을 실제 구간 연산으로 평가한다. |
| 실제 유한 eta Taylor 근사 | 실제 nonlinear chart는 \(|\eta|\le\rho/4\)다. \(\xi=\eta/j_0\)의 복소 반경 1/16은 comparison 함수에만 사용한다. |

오차에는 \(29Q^{-53}\)의 비선형 displacement, 무한 radial tail,
parameter Taylor tail 및 실제 반올림 포위가 각각 남는다.
comparison Bessel 다항식을 nonlinear 해와 같다고 놓지 않는다.
따라서 실제 배열이 같은 무한 core와 무관한 계산이라는 간극도 해소했다.

원래 N3-04에 없는 “전체 eta에서 비선형 recurrence의 모든 노드를
직접 수치 전개할 것”이나 “N3-04 전부를 별도 Lean 정리로 재작성할 것”을
이 항목의 새 완료 기준으로 만들지 않는다. 미완료인 N3-03의 formal
연결은 그대로 남기면서 N3-04의 독립적인 원래 잔여 조건을 충족으로
판정하는 것이 기준을 그대로 유지하는 해석이다.

근거:
[같은 무한 axis의 §7–9](../followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md),
[core 수치 포위 설명](../followup-20261010-symbolic-gluing/CORE_INTERVAL_EVALUATION.md),
[혼합 Phi 포위 설명](../followup-20261010-same-datum-axis/EVALUATED_MIXED_PHI.md),
[core receipt](../followup-20261010-symbolic-gluing/attempts/core-intervals-0002/receipt.json),
[혼합 Phi receipt](../followup-20261010-same-datum-axis/evaluated-phi-mixed-comparison.json).

## 6. N3-05 — 실제 incoming debt를 넣어 연속 포함을 닫았다

기존의 유한 후보 Newton 성공만으로는 이 항목을 완료할 수 없었다.
이번에는 세 가지 입력을 같은 식별자로 연결했다.

첫째, 새 무한 core에서 나온 B.26/B.34 continuation 및 U 복원의
실제 연속 모멘트와 eta 미분을 포위했다. 둘째, 같은 h 및 mu=h^2에서
5×5 bump map의 모든 이차항과 Jacobian을 연속 영역에서 포위했다.
셋째, 실제 upstream debt가 허용된 작은 근 상자에 들어간다는 조건을
전체 eta in [-1,1]에서 확인했다.

B.8 연산자 자체의 인증은 독립적으로 공급한 임의 debt에 대한 조건부
정리로 보존된다. 새 continuation 증거와 결합본이 바로 그 전제를
실제 함수의 debt로 충족한다. 경계 eta, 미분·tail·cutoff 기여를
포함하므로 sampled nonsingularity를 전칭 포함으로 승격한 것이 아니다.
새 root는 모든 모멘트를 정확히 일치시키고, 부분 적분과 양성을
별도 bound로 유지한다.

근거:
[실제 continuation/debt](../followup-20261010-same-datum-axis/CONTINUATION_AND_NEW_DEBT.md),
[180개 실행 검사 receipt](../followup-20261010-same-datum-axis/continuation-debt-certificate.json),
[B.8 연속 operator certificate](../followup-20261010-symbolic-gluing/attempts/b8-0001/certificate.json),
[독립 B.8 검증](../followup-20261010-symbolic-gluing/independent-review/b8-fraction-review-001.json),
[부분 모멘트와 gap 독립 검증](../followup-20261010-symbolic-gluing/independent-review/preloop-gap-review-001.json).

## 7. N3-06 — 실제 전체 영역에서 한 N과 strict margin을 얻었다

상계만 주어진 source bound로는 C.1의 gap 전제를 증명할 수 없다.
이번에는 실제 상계 S=C^100000와 별도로

\[
a,\quad c_s-2,\quad c_s-v_s,\quad
2(c_s-v_s)^2-(v_s-2)j_s^2\ \ge C^{-1000}>S^{-1}
\]

를 실제 연속 preloop 영역에서 증명했다. 양쪽 loop collar와 loop가
변하지 않는 나머지 영역의 \(v_s-2\) 하한도 공급했다.
B.8 부분 적분에 대해서는 C의 거친 상계 대신
\(\mu P_*=\exp(-16002T)\)를 사용해 실제 cone 보존을 증명했다.

실제 영역은 서로 다른
\(J_{\rm left}=X_a e^{t_1/16}\),
\(I_{\rm left}=X_a e^{t_1/8}\)를 사용한다.
loop 오른쪽 끝은 \(X_R e^{T+3}\)이며, 실제 \(v_s>2\)인
post-entry constant collar에 위치한다. \(2X_R\)는 그 전제를
충족하지 않아 사용하지 않는다. 안쪽 flat collar와 I가 겹치는
부분에서는 원래 loop 자체가 상수라 A=B=0이다.

이 입력들로 원래 C.1 loop의 모든 필요한 도함수와 zero-mean
primitive를 포위한 뒤 C.12를 적용했다. O(1/N) 값 변화와
order-one radial 미분 변화는 분리한다. moment 정규화에서는
불량 조건의 lambda^-2 U 행을 유지하고, factorial C_eta^2 norm에서
실제 2차 미분으로 전환할 때 factor 2도 유지한다.

실제 I1 debt와 작은 근을 사용한 복원 뒤 네 raw gap은 J 전체에서
1/(2R)보다 크다. 변화 없는 외곽 방향 margin도 C^-2보다 크게
직접 증명했다. 양쪽 끝점의 방향 극한을 포함해 공통
\(\kappa=R^{-10}>0\)를 얻으므로 원래 N3-06 차단 조건은 해소된다.

근거:
[실제 preloop gap](B8_AND_PRELOOP_GAPS_EN.md),
[실제 activation collar](ACTIVATION_COLLAR_BOUNDS_EN.md),
[loop 상계](../followup-20261010-symbolic-gluing/LOOP_DERIVATIVE_ENVELOPE.md),
[C.12 유한 N 증명](../followup-20261010-symbolic-gluing/C12_FREQUENCY_CONTRACT.md),
[최종 source 결합 독립 검토](ONE_PROFILE_ASSEMBLY_INDEPENDENT_REVIEW_EN.md).

## 8. N3-07 — 동일 최종 stress의 support와 flat 하한

최종 장의 실제 pressure 및 stock으로 정의한 stress에 대해

\[
T_0=0 \quad(X\le X_a\ \text{또는}\ X\ge X_b),
\]

\[
|T_0|\ge \min(C^{-11},R^{-8})
\exp\!\left(-\frac{t_1^2}{\log^2(X/X_a)}
-\frac4{\log^2(X_b/X)}\right)>0
\quad(X_a<X<X_b)
\]

를 얻었다. core의 정확한 leading 항등식, modulation 및 I1 복원
영역의 raw gap, 보존 외곽, terminal transition, 마지막 heat flat
collar를 모두 포함한다. 별도의 보정 전 stress를 최종 stress라고
부르지 않는다.

양쪽 factorization의 양의 선도 계수와 상대 성분 bound가 n의
edge limit를 준다. 끝점에서 T0/|T0|를 직접 나눠 계산하지 않는다.
안쪽 factorization 구간과 loop 구간이 일부 겹쳐도 실제 A=B=0인
collar이므로 그 식은 최종 장에도 그대로 성립한다. 열 교체와
I1/I2 보정 후에도 Ipos와 Imean의 원래 power law는 변하지 않는다.

근거:
[전체 stress 증명](GLOBAL_STRESS_ASSEMBLY_EN.md),
[고정된 실제 geometry의 stress receipt 0002](stress-assembly/0002/receipt.json),
[heat 및 terminal factorization 증명](HEAT_COMPENSATION_PROOF_EN.md),
[최종 결합 독립 감사](assembly-review/0001/receipt.json).

## 9. N1-05와 N1-06은 실행 증거로만 판정한다

N1-05의 원래 전체 기본 빌드는 2026-10-09
20:59:06.787843 UTC에 실제 exit 0으로 끝났고, 전체 로그 마지막에
11424 jobs 성공 종료가 남았다. 새 portable 22/22 및 runtime
36/36 감사는 이 완료 증거와 실제 원문 소스·커널·lockfile·대상
목록을 다시 대조한다. 별도 GitHub wrapper job 실패는 과거의
실패로 보존하며, 그 job의 하위 원문 명령 exit 0과 구분한다.

N1-06은 마지막 실제 관측인 2026-10-09 23:27:25.692 UTC에
run 37979127351의 Comparator job 113984853927이 in_progress,
conclusion null이었다. 보정된 새 run 37992645347에는 아직 job이
할당되지 않았다. 따라서 기존 제출 정리 axiom 감사와 원문 빌드가
통과했어도 독립 Comparator 성공을 주장할 수 없다.

남은 것은 같은 원문 보호 설정과 필수 nanoda를 사용한 실제 최종
명령 결과, 독립/kernel outcomes, 소스·커널 보존 및 제출 C/D
declaration 연결을 갖춘 artifact다. 기존 보호 설정을 약화하거나,
일반 Lean 빌드를 그 실행으로 대체하는 것은 원래 조건을 충족하지
않는다.

근거:
[N1 후속 감사 설명](../followup-20261010-n1-final/README.md),
[portable 감사](../followup-20261010-n1-final/n105-portable-audit.json),
[실제 runtime 감사](../followup-20261010-n1-final/n105-runtime-audit.json),
[마지막 관측 009](../followup-20261010-n1-final/github-observation-009.json).

## 10. 이후 완료 판정에 필요한 정확한 두 결과

N1-06은 보호된 독립 Comparator의 실제 성공 artifact를 수신하고
위의 원래 항목들을 검증해야 한다. 실행 중이라는 상태를 성공으로
바꿀 근거는 없다.

N3-03은 같은 새 A.21 datum과 정확 매개변수를 원래 무한 계수공간
정리에 공급하는 실제 Lean 분석 전제들을 끝내고, 그 인스턴스의
커널 검증과 데이터 연결을 남겨야 한다. 부분적인 scalar lemma나
가정이 남은 declaration만으로 full analytic connection을 표시할
수 없다.

이 두 항목을 충족하기 전까지 이번 결과는 같은 leading profile의
여섯 N3 잔여 조건을 실제로 닫은 후속 성과다. 설계도 pp.55–56에서
정한 대상은 Theorem 4.6의 leading profile과 annular stress이며,
전체 시간 의존 Navier–Stokes 해 또는 원문 force를 제거한 새 정리에
대한 완료 판정으로 확장하지 않는다.
