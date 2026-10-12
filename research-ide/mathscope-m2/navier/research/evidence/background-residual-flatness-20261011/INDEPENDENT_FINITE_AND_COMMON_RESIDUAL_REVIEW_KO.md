# 실제 유한 잔차와 공통 수열 비교의 독립 검토

검토자: `/root/ns_proof_audit`. 검토일: 2026-10-11.

## 판정과 실행 범위

아래 다섯 모듈과 [유한 잔차 설명](../../../ACTUAL_GLOBAL_FINITE_RESIDUAL_KO.md)을
읽고 원래 물리 좌표, 모든 유한 대류 순서쌍, cutoff stream 추가 항,
같은 재귀 수열에 대한 잔차 비교 추정을 독립적으로 계산했다.
**이 검토 범위에서 수학적 결함을 발견하지 못했다.**

이 문서가 직접 확인한 실제 실행은 `N=2, m=0`의 finite source attempt3와
보편 kernel attempt2이다. 공통 family의 실제 물리장에 최종 `E_B`를 붙이는
통합 실행은 검토 시점에 별도로 진행 중이다. 따라서 후자의 실행 성공이나
전체 G-N4/M2 완료를 이 문서에서 발급하지 않는다. 통합 실행을 기다리는 동안
코드의 수학 논증은 읽었지만, 아직 나오지 않은 결과를 관측했다고 쓰지 않았다.

| 읽은 모듈 | 검토한 SHA-256 |
|---|---|
| `actual-global-finite-residual.mjs` | `d5516d6e8ae8210545243bd1ad45132ffba3de30684b58381fcc135bda0c3983` |
| `actual-background-residual-flatness-kernel.mjs` | `a5adab3dfccba3d6508cd2b4a9c3004c9ec432e1b084573f626e5f1892f5fd89` |
| `actual-background-residual-flatness-cartesian.mjs` | `4a4e23e84ba4c0f91332429d432a303ef304fe5c3ebb4a5686357a2fd4f3a2fc` |
| `actual-background-residual-flatness.mjs` | `4e6a288688f90aceff4bcab1bbf1120cd0ff08bceadc58ee1fc6780f17702511` |
| `actual-common-band-background-residual.mjs` | `c68cd761e662fb224d1daa13fac59144630a90f9ce83e24d9a16ed4d2f73b831` |

유한 잔차 설명 문서의 검토한 SHA는
`2c3c75e464ef39e79ac557a92023c70baeeb8de9a4af60c44b59816d903acd2f`이다.
검토를 위해 큰 source 생성이나 물리 worker를 다시 실행하지 않았다.

## 1. 물리 좌표와 원통좌표 연결

원래

\[
t=-q(1-\eta^2),\quad z=q^D\eta,\quad
X=\frac{r^2}{2q},\quad A=\frac12+h,\quad D=\frac12-h
\]

에서 역좌표 미분을 독립적으로 확인했다. `L=1-2h eta^2`에 대해
`q_t=-1/L`, `eta_t=D eta/(qL)`, `q_z=2q eta/(q^D L)`,
`eta_z=(1-eta^2)/(q^D L)`가 된다. 이 식은 실제 `T_a,Z_a`의 계수와
일치하며, 시간·축 미분이 물리 가중치에도 작용한다.

Cartesian kernel은 속도와 모든 함수 jet을 독립 기호로 유지한다.
원의 유리 매개화에서 회전계수까지 매번 미분하므로 원심항 `-K^2/r`,
angular 연결항 `VK/r`, 벡터 Laplacian의 `-V/r^2,-K/r^2`가 남는다.
stress는 각각 `(partial_r+2/r)Ttheta`, `(partial_r+1/r)Tz`이며
두 반지름 계수를 같게 두지 않는다. 각각을 누락한 음성 대조가 별도로 있다.

물리 계수의 gain은 `2nh`이고 angular/axial 축 점성항은 한 차수,
radial Omega 안의 축 점성항은 한 차수가 더 이동한다.
독립 scaling kernel의 임의 지수 계산은 이 이동 및 radial 성분의 `1/2`를
보존한다. 원래 매우 작은 `h`를 수치 0으로 바꾼 계산은 없다.

## 2. 유한 합의 모든 항과 실제 저차 상쇄

먼저 `0<=n<=N`의 uncut 원래 합을 고정하면 모든 이차항은
`0<=i,j<=N`의 순서쌍이다. `i+j=n` 또는 radial Omega의 `i+j=n-1`에
각각 정확히 한 번 들어간다. 최종 radial 차수 `2N+1`의 `(N,N)`도 남는다.
여기서 유한 다항식 범위 바깥에 넣은 0은 원래 무한 계수를 0으로 정하는
행위가 아니다.

`n=0`은 전체 heat와 I2를 포함한 `F0`, 전역 `U0,M0`, 비상수 축 pressure,
`Pi0=P0+Cp`, 원래 두 shear와 네 primitive의 FTC를 가진 독립 leading
구성과 대조한다. `1<=n<=N`은 angular, axial, 전체 Omega, pressure 밀도,
두 stress 미분, radial defect의 일곱 원래 표현을 각각 대조한다.
검사 전에 실제 잔차 본문을 0으로 바꾸지 않는다.

특히 positive source 그래프에 실제 계수 대수를 먼저 append하고 그 전체
prefix를 독립 leading 그래프에 복사하는 순서가 타당하다. 서로 다른 AD
최적화가 같은 0을 다르게 표현할 수 있다는 이유로 미확인 함수들을 공통
atom으로 놓거나 원래 항을 버리는 방식이 아니다. 확인된 원래 피연산자와
FTC 항등식만 비교에 사용한다.

저차 상쇄 후 남은 `N+1..2N+1` 계수에는 양의 차수 함수나 그 미분이
들어가므로 실제 고정 방사 support 안에 놓인다. `N=1`의 낮은 radial
viscosity에는 compact한 원래 `v0`의 미분이 들어간다. 전체 heat의 먼 쪽
꼬리를 잘라내는 추가 가정은 없다. 각 Cartesian 고차 성분의 실제 물리
미분과 완전한 FTC에서

\[
\|E^{[N]}\|_m\le C_{N,m}
q^{2h(N+1)-(2A+1+m)}
\]

가 나온다. 손실 `2A+1+m`은 `N`과 무관하다. 원래 양의 계수의 큰 미분
상수는 `C_{N,m}`에 남으며 지수 손실로 잘못 바뀌지 않는다.

## 3. 같은 cutoff 수열의 정확한 차이

공통 family의 log maximum에서 사용한 물리 norm은 바로 같은
`B_(n,r)`이다. 그 조건은

\[
B_{n,r}b_n^{-nh}\le2^{-n}\qquad(r\le n)
\]

이며, `b2>=16 NEW b1`, 뒤의 `b_n>=2 NEW b_(n-1)`를 유지한다.
어떤 잔차 전용 다른 수열로 바꾸지 않는다. 원래 Euler cutoff 미분 상수는
이미 `B_(n,r)`에 포함되므로 이를 두 번 곱하지 않는다.

`q<1/(2b_J)`에서 앞의 `J`개 cutoff는 정확히 1이고 모든 양의 cutoff
미분은 0이다. 나머지 cut 항이 남으면 `q<=1/b_n`이므로
`B_(n,r)q^(nh)<=2^(-n)`이다. 따라서 `J>=max(1,r)`이면

\[
\|\mathrm{tuple}_B-\mathrm{tuple}^{[J]}\|_r
\le 2^{-J}q^{(J+1)h-(2A+r)}.
\]

이 tuple은 실제 velocity, pressure, 두 stress를 포함한다. `b_n>=2^n`으로
`q>0`에서 모든 합은 국소적으로 유한하다. 전체 leading 항은 두 tuple에서
정확히 같아 차이에서 없어지며, 실제 차이는 양의 계수의 고정 상자 안에
지지된다. 그러므로 nonlinear 비교에 필요한 부분 속도의 norm을 그 고정
상자에서 구성하는 것으로 충분하다.

원래 radial stream 보정은

\[
v_n^{\rm cut}=\chi v_n-
\frac{2\eta}{XL}(q\partial_q\chi)M_n
\]

이다. 실제 divergence는 `chi*originalDiv`와
`(2eta/L)(q partial_q chi)(U_n-M_nX)`의 합으로 계산된다.
같은 원래 continuity와 mass primitive가 둘 다 증명된 뒤에만 0이 된다.
따라서 cutoff가 움직이는 구간의 추가 항을 잃지 않는다.

## 4. 물리 stress 계수와 nonlinear 비교 상수

stress 발산의 Cartesian 계수는 `x1^a x2^b r^(-k)`의 유한 합이다.
각 미분은 보통 power 미분 및 `-k*x_j*r^(-k-2)` 두 기여를 갖는다.
모듈의 양의 계수 재귀는 두 방향을 모두 더하므로 모든 고정 미분 단어를
상계한다. 원래 방사 support에서 `r>=sqrt(2qXminus)`를 쓰면 모든
`|I|<=m`에 대해 `q^(-(m+1))`의 보수적 손실로 덮인다.
시간·축 미분은 이 순수 Cartesian 반지름 계수에 새 항을 만들지 않는다.
stress 차이가 support 바깥에서 0이므로 축에서 `1/r`를 평가하지 않는다.

속도 차이 `e`에 대해 실제 nonlinear 차이는

\[
u_J\cdot\nabla e+e\cdot\nabla u_J+e\cdot\nabla e
\]

를 모두 유지한다. 시간, Laplacian, pressure gradient 및 stress 발산의
차이도 포함한다. Leibniz 계수의 합 `2^m`과 3성분 대류의 합을 합쳐
`16*2^m + stressConstant`는 표시한 비교의 충분한 상수다.

`r=m+2`, `K=2A+r`, `H=m+1`로 놓고

\[
J=\max\left(r,\left\lceil
\frac{P+2+2K+H}{h}\right\rceil\right),\qquad
\tau=(J+1)h-K
\]

로 정하면 `tau-H-K>P+2`이다. 유한 잔차의 지수 역시 `P+2`보다 크다.
후자의 여유를 나타내는 정확한 대수식은 `P+11+5m+6A`로 양수다.
따라서 같은 `b_J`의 plateau에서

\[
\|E_B\|_m\le
\left(C_{J,m}+D_m2^{-J}(C^u_{J,m+2}+2)\right)q^{P+2}.
\]

이 상수는 원래 유한 source constructor에 정확한 유한 `J,m`을 넣어
정의한다. 실제 실행 `N=2`를 이 `J`와 같다고 주장하지 않으며, 미실행한
거대한 수치 상수를 알려진 숫자로 발급하지 않는다. 모든 고정 차수의
유한 convolution·미분·FTC 구성과 같은 대각 수열을 쓰는 수학적 귀납이다.

## 5. 실제 물리 band 연결의 읽기 검토

마지막 adapter는 private physical 객체와 theorem의 family가 정확히
같아야 한다. 원래 normalized `F/U/M/average/Pi/v/Ttheta/Tz`와 같은
`chi(b_n q)`, Euler chi, power를 대조한다. 기본 anchor의 plateau/zero
축약은 그 anchor에서만 허용한다. 다른 활성 원래 항을 삭제하지 않는다.

`q=Qs`, `r=sqrt(Q)R`, `A=1/2+h`에서 radial/axial/pressure의 물리
인자도 일치한다. 해당 물리 그래프에서 full leading 네 primitive와 mixed
FTC, 실제 두 stress flux를 다시 결속하여 leading stress divergence의
정칙 대표식을 얻는다. 공통 mass primitive의 권한은 같은 private source에
있고, 별도 sibling 그래프의 새 root 번호를 물리 피연산자로 옮기지 않는다.

`E_B`는 실제 완성된 배경의 NS 다항식에 원래 stress 발산을 더한 식이다.
원래 NS를 계산하기 전에 stress를 원하는 값으로 골라 없애거나, 잔차를
정의상 0으로 저장하지 않는다. 이 배경 flatness와 전체 wave의 비선형·curl·
eikonal 잔차는 다르다. 후자의 원래 항은 이후 N6 보정 단계에 남는다.

## 확인한 실행과 provenance

- [Source attempt3](source-attempt-3-certificate.json): 5/5, 내부 6/6,
  실제 관측 exit0, timeout=false. `N=2,m=0`, 부분 속도 미분은 2차다.
- [Process](source-attempt-3-process.json): 48.556951763초,
  완료한 node 계통의 peak 2,224,336,896 bytes.
- 실행 의존성 전체 72개와 실행 전후 SHA 및 현재 SHA를 직접 비교해 모두
  일치했다. 이 안의 기존 frozen 파일은 69개다. 별도 실행 snapshot 5개와
  TAP의 기록 SHA도 확인했다.
- [Kernel attempt2](kernel-attempt-2-process.json): 7/7, exit0.
  앞선 실패 kernel과 source attempt1/2는 보존되어 있고 설계된 음성 대조로
  재분류하지 않는다.
- 최종 graph: 363,161 nodes, 15,320,405 canonical bytes,
  SHA `61efa8251ce52348e4e849314a7919ca30fe5685c7aa7efa2973c8c55eb21635`.
- Source certificate SHA
  `f32f3def5ecdf869c5b50ca57e9d2056d443afd8b0134728e4b91caca972e223`.
- Process SHA
  `75b6a188a17a39b38aebbe500394b0b1179a741357f28ee6d16c6795b29bc459`.

이 독립 검토는 원래 수학 본문과 보존한 실행을 함께 읽은 결과다.
검사 수만으로 원문 정리 전체, 새 Lean 증명 또는 아직 진행 중인 통합 실행의
성공을 선언하지 않는다. 이 문서는 M3 시작 권한을 발급하지 않는다.
