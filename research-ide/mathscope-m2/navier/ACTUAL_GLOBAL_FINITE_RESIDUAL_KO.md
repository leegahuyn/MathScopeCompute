# 원래 유한 배경의 실제 물리 잔차

## 검증된 범위

`actual-global-finite-residual.mjs`는 원래 완성된 전역 계수의 유한 합을
Navier–Stokes 운동량식과 원래 stress 발산에 넣은 **전체 잔차**를 만든다.
저차 계수는 원본 표현으로 보존하고, 별도로 증명된 leading/positive
압력·stress 항등식과 실제로 대조한 뒤에만 0이라는 결론을 사용한다.
고차 잔차는 삭제하지 않고, 모든 요구된 물리 미분의 상수를 원래 함수에
대한 완전한 직사각형 FTC 식으로 구성한다.

2026-10-11 실행은 실제 (N=2), 잔차 미분 차수 (m=0)이다.
필요한 유한 부분 속도는 물리 미분 차수 2까지 구성했다.
source 검사는 5/5, 내부 검사는 6/6 통과했고 관측 종료 코드는 0이다.
독립 보편 대수 kernel 검사는 7/7 통과했다. 이 유한 단계만으로 공통
무한 절단 배경이나 전체 M2 완료를 선언하지 않는다.

## 원래 물리장과 좌표

원문의 (A=1/2+h), (D=1/2-h), (h>0)를 그대로 쓴다.

\[
t=-q(1-\eta^2),\qquad z=q^D\eta,\qquad
X=\frac{r^2}{2q},\qquad y=\frac{x_\perp}{\sqrt q},\qquad
L=1-2h\eta^2.
\]

각 계수의 물리 성분은

\[
u_{\theta,n}=r q^{-A-1/2+2nh}F_n,\qquad
u_{r,n}=\frac r2 q^{-1+2nh}v_n,\qquad
u_{z,n}=q^{-A+2nh}U_n,
\]

\[
p_n=q^{-2A+2nh}\Pi_n,\qquad
T_n=q^{-A-1/2+2nh}(T_{n,\theta},T_{n,z})
\]

이다. (v_n=V_n/X)이며, 축에서 (V_n/X)를 별도로 수치 나눗셈하지
않고 원래 regular 표현을 사용한다. 원래 full heat (F_0), 전역 (U_0,M_0),
비상수 압력 축값 (P_0(\eta)), leading 두 shear를 모두 유지한다.

이 좌표에서 물리 미분을 전개하는 보편 kernel은 (T_a,Z_a)의 역좌표
계수, 반지름 미분, 두 벡터 Laplacian의 연결항, stress의 두 서로 다른
반지름 가중치를 독립적으로 확인한다. (h)는 그래프의 원래 정확한
양수 매개변수이며 부동소수점 0으로 바꾸지 않는다.

## Cartesian 운동량식의 독립 결속

`actual-background-residual-flatness-cartesian.mjs`는 독립적인

\[
(V,K,U,p,S_\theta,S_z)
\]

함수 jet을 놓고 Cartesian 운동량식을 직접 미분한다. 원의 유리 매개화로
회전 행렬을 구성해 각 성분이 다음 원통좌표 식과 같은지 정확한 유리함수
계산으로 확인한다.

\[
\begin{aligned}
R_r={}&V_t+VV_r+UV_z-K^2/r+p_r
 -(V_{rr}+V_r/r-V/r^2+V_{zz}),\\
R_\theta={}&K_t+VK_r+UK_z+VK/r
 -(K_{rr}+K_r/r-K/r^2+K_{zz})
 +(\partial_r+2/r)S_\theta,\\
R_z={}&U_t+VU_r+UU_z+p_z
 -(U_{rr}+U_r/r+U_{zz})+(\partial_r+1/r)S_z.
\end{aligned}
\]

원심항, (VK/r) 연결항, stress 반지름 계수를 누락하는 음성 대조군은
거부된다. 별도 scaling kernel은 (2nh) 대신 독립적인 지수 기호를
먼저 유지하여 원래 물리 가중치와 viscosity 차수 이동을 검증한다.

## 모든 순서쌍과 viscosity 이동

유한 합 (0\le n\le N)을 먼저 고정한다. `allFiniteResidualLedger`
는 (n=0,\ldots,2N+1)을 생성하며 다음 항을 모두 보존한다.

| 계수의 종류 | 원래 기여 |
|---|---|
| 같은 차수의 선형 항 | (n\le N)의 시간 미분, 압력, 방사 확산, stress |
| angular/axial 대류 | 모든 순서쌍 (0\le i,j\le N, i+j=n) |
| angular/axial 축 확산 | 원래 (n-1)차 계수, 범위 안에 있을 때 |
| 방사 압력·원심항 | (\Pi_{n,X}-\sum_{i+j=n}F_iF_j) |
| 방사 Omega 대류 | (i+j=n-1)인 모든 순서쌍 |
| 방사 Omega 시간·방사 확산 | (n-1\le N)일 때 원래 계수 |
| 방사 Omega 축 확산 | (n-2\le N)일 때 원래 계수 |

각 이차 합은 ((N+1)^2)개의 **순서쌍**을 정확히 한 번 포함한다.
유한 다항식 범위를 벗어난 항에만 문자 그대로 0을 넣는다. 이것은
아직 만들지 않은 무한 계수를 0으로 정하는 행위가 아니다.

검증된 (N=2) 실행에는 (n=0,\ldots,5)가 있고, 마지막 (n=5)
방사 Omega 계수의 ((2,2)) 항까지 유지되어 있다.

## 저차 상쇄를 사용하는 순서

### (n=0)

독립 `actual-leading-global-stress-bridge.mjs`가 원래 full leading
자료에서 (I,J,S,C_p) 네 primitive와 mixed FTC를 구성한다.
그 결과 (\Pi_0=P_0+C_p)와 두 shear를 포함한 원래 stress flux가
각각 독립적으로 조립한 운동량 계수를 상쇄한다. 유한 잔차 adapter는
자신이 조립한 세 계수 및 두 가중 flux를 이 실제 결과와 다시 대조한다.

### (1\le n\le N)

각 차수에서 다음 일곱 가지를 따로 확인한다.

1. 모든 원래 항으로 조립한 angular 계수.
2. 모든 원래 항으로 조립한 axial 계수.
3. 같은 전역 (U_i,v_i)로 다시 조립한 전체 Omega.
4. 원래 압력 primitive의 전역 방사 밀도.
5. 원래 angular stress의 실제 미분.
6. 원래 axial stress의 실제 미분.
7. 원래 방사 잔차 표현.

이 비교의 권한은 `actual-positive-global-stress.mjs`의 실제 다섯
보존 moment, 양쪽 signed FTC, 원래 Picard 내부식, 모든 전역 join이다.

특히 (n=1)의 낮은 angular viscosity 적분은 원문의 완전한 수렴하는
subtracted moment를 사용한다. A.2/A.13의 적분상수, B8/I1 보정, I2와
full heat 항을 유지한다. 발산하는 비보정 적분을 개별 경계항처럼
처리하거나 heat 항만으로 전체 moment가 0이라고 주장하지 않는다.

### 동일 그래프의 미분 의미

실제 positive 그래프에서 양의 차수와 모든 높은 유한 계수의 대수를
**먼저** 만든다. 그 append-only 확장까지 leading audit의 독립 복제에
포함한다. 원래 source 노드와 함수 본문은 변경되지 않는다. 새 sibling
그래프에서 생긴 노드 번호를 원래 그래프에 옮기지 않는다.

이 순서가 필요한 이유는 leading audit의 AD가 좌표와 무관한 함수를
즉시 0으로 미분하는 최적화를 갖기 때문이다. 원래 AD가 유지하는
문자 그대로 0인 branch/integral과 표현이 다를 수 있다. 두 그래프의
큰 식을 무차별적인 유리함수 전개로 비교하는 대신, 원래 AD가 만든
정확히 같은 positive 피연산자를 비교한다.

## 고차 잔차의 실제 상수

저차 항의 실제 상쇄를 확인한 뒤 (n=N+1,\ldots,2N+1)의 angular,
axial, radial 계수를 그대로 남긴다. Cartesian 성분은 각각 (y_1,y_2)
인자를 포함하여 구성한다. 모든 물리 미분 단어를 원래 chart에서
생성하고, 각 남은 함수에 완전한 직사각형 FTC 상수를 붙인다.

\[
\|E^{[N]}\|_m
\le C_{N,m}\,
q^{\,2h(N+1)-(2A+1+m)}.
\]

손실 (2A+1+m)은 (N)과 무관하다. 모든 고차 항에는 양의 차수
계수나 그 미분이 들어가므로 공통 방사 compact support를 갖는다.
예외인 (N=1)의 낮은 방사 축 확산은 원래 leading (v_0)의 미분이며
이 역시 실제 mass closure에 의해 compact support를 갖는다.
원래 full heat tail은 잘라내지 않는다.

같은 실행에서 전체 uncut 부분 속도의 (m+2) 미분 상수도 구성한다.
이 속도 상수는 모든 잔차 차이가 놓이는 고정 방사 상자를 덮는 FTC
상수다. 상자 밖에서는 양의 차수 차이가 0이므로 nonlinear 비교에
속도 상자를 넘어선 임의의 성장 가정을 추가할 필요가 없다.


\[
\|u^{[N]}\|_{m+2}
\le C^u_{N,m+2}\,q^{-(2A+m+2)}.
\]

현재 (N=2,m=0) 실행은 높은 세 잔차 계수, 15개 부분 속도 성분,
총 165개의 완전한 3차원 직사각형 FTC receipt를 생성했다. 각 receipt는
모든 (2^3=8)개의 face를 포함하며, 모든 상수의 자유 좌표는 없다.

## 공통 무한 절단 배경으로 이어지는 단계

후속 `actual-background-residual-flatness.mjs`는 같은 family의
재귀 (b_n)와 위 유한 잔차를 결합한다. 모든 실제 physical norm이

\[
B_{n,r}b_n^{-nh}\le 2^{-n}
\]

을 만족하게 선택된 바로 그 계수열을 사용한다. 원래
\(\chi(b_nq)\)와 \(q\partial_q\chi(b_nq)\)를 velocity, pressure,
stress 및 모든 미분에서 함께 유지한다.

고정한 (m,P)에 대해 (r=m+2), (K=2A+r), (H=m+1)로 놓고

\[
J=\max\!\left(r,
 \left\lceil\frac{P+2+2K+H}{h}\right\rceil\right)
\]

을 정확한 유한 비교 차수로 정의한다. (J)는 원래 (h>0)에 대한
symbolic ceiling이다. 현재 실행한 (N=2)가 이 거대한 (J)와 같다고
주장하지 않는다. 필요한 (C_{J,m},C^u_{J,m+2})는 같은 임의 유한
source constructor가 정의하는 정확한 상수이며, 값을 모르는 별도의
자유 상수를 발급하지 않는다.

이 문서를 저장한 시점에는 main same-family theorem과 실제
`E_B = original physical NS + original full stress divergence` adapter의
통합 source 실행이 별도로 남아 있다. 따라서 본 packet의
`wholeGN4Complete`, `allOrderCommonCutoffSummationBound`, `m3MayStart`는
모두 false다. 실제 공통 물리 결속이 통과한 후속 packet만 추가 권한을
줄 수 있다.

## 관측 실행과 실패 보존

증거 디렉터리:
`research/evidence/background-residual-flatness-20261011/`.

| 실행 | 결과 | 확인된 의미 |
|---|---|---|
| kernel attempt 1 | 4/5, exit 1 | 검사에서 실제 maximum op 명칭을 잘못 기대한 오류, 실패 원본 보존 |
| kernel attempt 2 | 7/7, exit 0 | Cartesian/scale, 모든 순서쌍, cutoff commutator, 양수 지수, geometry recurrence |
| source attempt 1 | 0/5, exit 1 | (F_0F_0)와 (F_0^2)의 구조 비교 오류; 원래 식의 유리 대수로 교정 |
| source attempt 2 | timeout, exit 1 | AD 표현 차이를 큰 rational fallback으로 전개한 실행; 성공으로 재분류하지 않음 |
| source attempt 3 | 5/5, exit 0 | 실제 n1/n2, full n0, n3..n5 tail, FTC와 source seal |

성공 source 실행 시간은 48.557초, 종료한 전체 node test 계통에 대한
관측 RUSAGE peak는 2,224,336,896 bytes다. 69개의 frozen import 파일은
실행 전후 해시가 모두 같았다. 시간 제한 실행에서는 node grandchild를
종료하면서 immediate wrapper의 RUSAGE만 남을 수 있으므로 그 작은
수치를 실제 source peak로 해석하지 않는다. 보조 `/proc` group 표본도
전체 source peak를 대체하지 않는다.

성공 graph는 363,161개 노드, canonical 15,320,405 bytes이며 SHA-256은
`61efa8251ce52348e4e849314a7919ca30fe5685c7aa7efa2973c8c55eb21635`다.
최종 source SHA-256은
`d5516d6e8ae8210545243bd1ad45132ffba3de30684b58381fcc135bda0c3983`다.
정확한 각 실행의 소스 snapshot, 테스트·runner·import 해시, TAP 및
종료 기록은 `finite-validation.json`이 가리킨다.

## 원문·구현 근거

- 로컬 원문 `tmp/physical_bridge_audit/navier-stokes.pdf`, SHA-256
  `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`:
  (5.6), (5.19)–(5.37)의 원래 계수·moment·stress 식과 후속 절단 배경.
- `ACTUAL_GLOBAL_CONSERVATIVE_MOMENTS_KO.md`: 다섯 실제 전역 moment.
- `ACTUAL_LEADING_GLOBAL_STRESS_BRIDGE_KO.md`: 원래 full leading
  압력, primitive, 두 shear와 전역 상쇄.
- `ACTUAL_POSITIVE_GLOBAL_STRESS_KO.md`: 실제 양의 차수 전체 잔차,
  원래 signed FTC와 두 경계.
- `ACTUAL_PRESSURE_STRESS_ALL_ORDER_TAIL_KO.md`: 같은 원래 stress와
  pressure의 임의 유한 물리 미분 및 weighted endpoint 상수.

이 결과는 source-bound 정확식 프로그램과 독립 대수 검증이다.
새 Lean kernel 증명이나 미실행 무한 그래프의 실행 기록을 뜻하지 않는다.
