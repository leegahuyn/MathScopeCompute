# N6-01 / N6-02 원본 해석 조건 감사

2026-10-14. 상태: **OPEN / UNRESOLVED**. 원본 56/64 진도나 N6 완료 판정을 변경하지 않는다.

이 문서는 첨부 논문의 명제, 실제 producer, 저장된 원본 노드의 조건을 연결한다. 조건부 미분 항등식이 맞는 것과 그 조건이 원본 전체 영역에서 증명된 것은 별개의 판정이다. 유한 표본, 문자열 proof label, 원본 pass bit는 해석 조건의 증거가 아니다.

## 자료와 원본 고정

- [논문 PDF](../../reference-documents/ns-primary-20261013/navier-stokes.pdf), SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`. 아래 페이지는 PDF의 인쇄 페이지와 같다.
- [첨부 Blueprint PDF](../../reference-documents/n6-audit-20261014/blueprint.pdf), pp61–62 및 알고리즘 설명 pp79–80. N6-01은 Prop 9.5의 상태, N6-02는 최신 전체 속도/압력에서의 잔차를 요구한다.
- [이전 cloud run `38480202315`의 원본 artifact ZIP](../evidence/n6-source-audit-20261014/prior-run-38480202315.zip) 안 `evidence-01/whole-mean/whole-mean-direct-20261013224935425.json`은 실제 원본 snapshot 3,615,866 노드, parent 3,892,594 노드를 묶고 `UNRESOLVED`로 끝났다. 첫 정지는 source node `539400`의 maximum을 source coordinate `622802`로 미분할 때다. `rows=[]`, `actualWholeMeanDifferenceRecomputed=false`, `originalN601Complete=false`, `originalN602Complete=false`다. [실행 관측 기록](../evidence/n6-source-audit-20261014/PRIOR_RUN_OBSERVATION.json)은 실행과 수학 완료 판정을 구별한다.

## 1. source node 539400: maximum 선택과 smoothness

저장된 노드는 `maximum(1, 539399)`이고 node SHA-256은 `190f8b3abf266b728f0c3b299d71ce6d31d7bf97fcba0249a7d59842872a1e06`이다. 이전 independent replay에서는 node `40907`이었으며 두 번째 피연산자의 미분이 0으로 인증되지 않았다.

실제 역할은 radial coordinate를 1로 clamp하는 것이 아니라 [actual-background-physical-seminorms.mjs](../../mathscope-m2/navier/actual-background-physical-seminorms.mjs)의 `rectangularSourceFTC`로 만든 **물리 미분 norm selector**다. `539399=517247+539398`, `539398=494786+499869`이며 세 summand는 각각 three-coordinate FTC의 mask `0..7` face 합이다. mask 0은 적분 없이 `sqrt(1+f(anchor)^2)`이고 나머지 face는 같은 양수 integrand의 적분이다. 정확한 domain은 x/y `[-sqrt(2*Xb),sqrt(2*Xb)]`, eta `[-1,1]`로서 source endpoint nodes `346574=-215514`, `215514=sqrt(137008)`, `20=-1`, `1=1`을 사용한다.

따라서 **source bodies가 real이고 실제 face derivatives가 존재/적분 가능하며 endpoints가 ordered인 조건 아래**, 각 FTC 합은 1 이상이고 세 합 B는 3 이상이다. 이 경우 `max(1,B)=B`는 strict gap을 갖는 branch이며 box 부피의 lower bound도 필요하지 않다. 이것은 숨은 function capture closure나 source reality/continuous derivatives 자체를 증명하지 않는다. 새 adapter는 이 조건과 정확한 face skeleton을 함께 남겨야 한다.

`max(1,H(x))`의 미분을 무조건 0으로 두거나 두 번째 branch로 바꿀 수 없다. 필요한 경우는 다음 중 하나다.

1. 미분 좌표와 모든 실제 capture가 독립이라는 원본 closure 증명.
2. 지정 영역에서 `H>1` 또는 `H<1`이라는 엄격한 branch gap 증명.
3. `H=1` 접합점에서 요청된 모든 jet이 일치한다는 원본 접합 증명.

단순히 max가 majorant 또는 cutoff 선택에 쓰인다는 설명은 1–3을 대신하지 않는다. source 노드와 그 사용 영역, 전체 capture를 고정한 뒤 증명해야 한다. producer에서 실제 속도 인자로 대입된 좌표와 frozen selector coordinate를 구별해야 한다.

## 2. monotone systems 0 / 1 / 2

일반적인 `F(w,p)=0`의 conditional derivative는

`w_i = -F_i/F_w`,

`w_ij = -(F_ij + F_wi*w_j + F_wj*w_i + F_ww*w_i*w_j)/F_w`.

필수 조건은 실제 완전한 F의 capture closure, bracket endpoint signs, 존재/유일성, 실제 source image에서 `0<m<=F_w<=M`, 그리고 요청 차수의 smoothness다. serialized `derivativeLower` 노드는 그 부등식의 증명이 아니다. 유한 iterate도 exact root가 아니다.

### 0. ActualC1VarianceRoot

[실제 producer](../../mathscope-m2/navier/actual-continuation-exact-loop.mjs)는 unsigned variance를 직접 미분하지 않는다. 논문 pp159–160 (C.4)–(C.10)의 removable quotient와 signed square root를 사용한다.

`M(z)=<exp(z*sin(theta))>`, `R(z)=M(2z)/M(z)^2`,

`Q(z)=integral_0^1 (1-s)*R''(s*z) ds=(R(z)-1)/z^2`,

`W(mu,p)=d0*mu*sqrt(Q(mu*p))`, `F=W-r`,

`r=zeta(vs)*sqrt(vStar-vs)/sqrt(a)` on the supported cutoff, smoothly zero elsewhere.

`Q(0)=1/2`와 `W_mu(0,p)=d0/sqrt(2)>0`이다. `V_mu(0,p)>0`라고 주장하면 틀린다. producer의 bracket은 `[0,S^12]`, lower/upper는 `exp(-S^14)`, `exp(S^22)`다.

[LOOP_DERIVATIVE_ENVELOPE](../../mathscope-m1/navier/followup-20261010-symbolic-gluing/LOOP_DERIVATIVE_ENVELOPE.md) (1)–(2)는 실제 입력 전체 영역에서 factorial jet norm order≤3가 `S` 이하이고 `S>=2^20`이며, `a,c_s-2,c_s-v_s,2(c_s-v_s)^2-(v_s-2)j_s^2>=S^-1`, boundary collars에서 `v_s-2>=S^-1`일 것을 요구한다. (7)–(11)은 이 조건 아래 `Q>0`, signed-root simple derivative와 유한 jet bound를 설명한다. 이는 새 saved audit가 전체 source input bounds를 증명했다는 의미가 아니다.

### 1. ActualC1CircleInverseLift

동일 producer는 `F(theta,p)=phi(theta)-phase`와

`phi'(theta)=a*(1+t(theta)^2)/(2*pi*vTarget)`를 사용한다.

bracket은 `[2*pi*(phase-1),2*pi*(phase+1)]`, lower/upper는 `1/(16*S^2)`, `exp(S^38)`다. 논문 p160은 `a>0`, `vTarget>2`, 정확한 variance root에 의해 `a*<1+t^2>=vTarget`이며 `phi(theta+2*pi)=phi(theta)+1`임을 사용한다. 따라서 inverse는 lifted circle의 smooth branch다. 모듈로/바닥 함수를 미분하는 branch가 아니다. upstream system0의 존재 및 실제 cone bounds가 남으면 system1도 conditional이다.

### 2. ActualCommonBandSlowInverse

[source-global-band.mjs](../navier/source-global-band.mjs)의 정확한 body는

`F(s,Z,T)=s-Z^2*s^(2*h)-T`, bracket `[1/2,2]`.

source image는 `Z=s0^D*eta`, `T=s0*(1-eta^2)`, `s0 in [1/2,2]`, `eta in [-1,1]`, `D=1/2-h`, `0<h<1/16`이다. 그러면 `F(s0,Z,T)=0`이고 `F_s=1-2*h*Z^2*s^(2*h-1)`이다.

이 **정확한 image와 h 조건 아래** bracket 전체의 bound를 해석적으로 계산할 수 있다. `Z^2<=2^(1-2h)`, `s^(2h-1)<=2^(1-2h)`이므로 `0<=2h*Z^2*s^(2h-1)<=2h*2^(2-4h)<8h<1/2`. 따라서 `1/2<F_s<=1`이고 s0가 bracket 안의 root이므로 양 endpoint signs도 맞는다. 이는 임의 Z,T의 계약이 아니다. 실제 source arguments가 이 image를 만족하고 h가 해당 양수 구간이라는 binding/domain 증거가 함께 있어야 한다.

## 3. quadratic root와 node 4483 natural series

논문 pp127–128 Lemma A.2는 `F_eta(c)=B(eta)c+Q_eta(c,c)=d(eta)`를 다룬다. `B,Q,d`는 `K=[-1,1]`에서 smooth이고 B는 invertible이다. `beta0=sup||B^-1||`, `kappa0=sup||Q||`, `d0=||d||C0`라 하면

`8*beta0^2*kappa0*d0 <= 1`

아래에서 zero-seeded contraction이 `||c||C0<=2*beta0*d0`의 유일 branch를 정하고 실제 Jacobian의 nonsingularity와 endpoint smoothness를 준다. preselected Ck norm estimate에는 별도로 `8*betak^2*kappak*||d||Ck<=1`이 필요하다. 모든 도함수 차수의 동시 smallness는 요구하지 않는다. 각 고정 차수의 유한 bound와 uniform all-order M/S/W class 증명도 구분한다.

저장된 `actual_quadratic_root`에는 실제 continuous matrix와 quadratic 계수, rhs, scale을 모두 남겨야 한다. 미분은 실제 Jacobian으로 계산한다. diagonal-square 표현의 경우

`J_ij=A_ij+2*scale*Q_ij*c_j`,

`J*c' = d' - A'*c - scale'*Q(c,c) - scale*Q'(c,c)`.

preconditioner를 J로 바꾸거나 rhs만 미분하면 실제 coefficient capture가 변할 때 틀린다. conditional Cramer identity의 numerator가 정확히 0이어도 `det(J)!=0` 증명은 별도로 필요하다.

source node `4483`은 `actual_natural_series ["average",474,2,0,0]`다. 실제 radial argument는 node `474`, eta는 node `2`, radial/eta derivative order는 둘 다 0이다. node SHA-256은 `8c7ed31205f1f229c3b8277e8118e0192be7cd935cdb4817b7ad406fe7e17275`이며 이전 audit의 `closureProved`는 false다. 이 연산은 논문 pp145–149 (B.4)–(B.16), 특히 완전한 (B.14)/(B.15) 재귀의 coefficient partial sums와 source tail로 정한 limit다. 유한 비교 함수 `f0`나 잘린 polynomial이 원본 series를 대신할 수 없다. chain rule을 붙이려면 실제 P0, g, coefficient recursion 및 tail capture를 고정하고 complex neighborhood, B_rho norm과 수렴/미분 tail 조건을 남겨야 한다. 유한 차수의 conditional chain rule은 original domain acceptance가 아니다.

## 4. N6-01: source j=0 / Proposition 9.5

논문 p106 Definition 9.4 및 pp106–107 Proposition 9.5의 원본 순서는 다음과 같다.

1. fixed base와 primary potentials의 **완전한 curl**로 시작한다.
2. 현재 전체 wave covariance `W_ab=<w_a*w_b>theta`, `g_r`를 만들고 (8.12)로 P와 pressure를 복원한다.
3. 현재 `E_theta^circ,E_z^circ`로 temporal mean update (8.20)를 적용한다. axial increment는 actual potential (8.14)의 `Delta_gamma=gamma_d-A1(gamma_d)`이며 cutoff remainder를 포함한다.
4. 최신 전체 velocity에서 pressure와 E, P, J_theta, J_z를 다시 계산한다.
5. 새 defects에 (8.25) five-equation correction을 적용하고 pressure 및 전체 means/defects를 다시 계산한다.

필수 상태 조건은 (9.8) `G_wave in W^0.7`, `E_theta,E_z in M^1.2`, `(P,J_theta,J_z) in S^1.2`; (9.9) total `w in W^0.5`, `w-w0_tan in W^0.68`, `v,gamma,p_m in M^0.9`, `beta in M^1.9`; (9.10) `integral R^2*<v>Y dR=0`, `integral R*<gamma>Y dR=0`이다. supported fixed phases, finite harmonic grouping, smooth zero extension과 exact divergence도 필요하다.

(8.25)의 원본 mean patch는 pp97–98 (8.24)에서 `Vq=a(eta)*x^(-1-2*lambda)`, `Gq=0`, fixed `lambda>0`, `|a(eta)|>=a0>0`다. independent angular moment weights `2,-2-2lambda,-2lambda`와 axial weights `1,1-2lambda`의 invertible matrix가 필요하다. inverse가 `lambda->0`에서 악화될 수 있으므로 lambda를 0으로 바꾸거나 uniform inverse로 통과시킬 수 없다.

논문 proof의 decay-order bookkeeping, 원본 class constants, same-domain bounds, moments와 tails가 아직 모두 증명되지 않으면 원본 j=0 인증은 **OPEN**이다. 새 상태의 수치 slope나 conditional algebra만으로 Prop 9.5를 완료하지 않는다.

## 5. N6-02: updated full mean / residual

논문 p100 §8.7은 velocity가 변할 때마다 아래 전체 정의를 다시 적용하라고 명시한다.

`W_ab=<w_a*w_b>theta` → (8.3) `g_r` → (8.12) `P=integral <g_r>Y dR`, `p_m=T0(g_r-rho*P)` → (8.3) `E_theta,E_z` → (8.15) `J_theta,J_z`.

zero-auxiliary-mean cutoff remainder도 다른 항과 곱하면 nonzero mean을 만들 수 있다. 따라서 actual axial cutoff를 포함한 최신 velocity로 모든 product를 만들며 flat term을 다음 step의 ledger에서 삭제하지 않는다.

전체 physical residual identity는 p105 (9.3)의 proof 및 Blueprint p62에 따라

`R(u+du,p+dp)=R(u,p)+dt(du)-Delta(du)+grad(dp)+(u dot grad)du+(du dot grad)u+(du dot grad)du`.

마지막 term은 divergence-free 상황에서 `div(du tensor du)`와 같다. 정확한 angular means를 독립 재구성하는 것만으로 nonzero angular harmonics 및 전체 Cartesian PDE가 인증되지는 않는다. pressure change, cylindrical connection terms, mixed products, square terms, base flat tail, pulse cutoff tail, radial/temporal cutoff remainder, harmonic tails와 numerical enclosure는 각 scope에 남겨야 한다.

pp98–99 Lemma 8.8의 (8.26)–(8.27)은 moment update 후 새 nonlinear defect의 정확한 검산식이다. `R_g=g_r,new-g_r-(2V/R)*Delta_v`에는 `(Delta_beta)^2`, `Delta_beta*Delta_gamma`, `(Delta_v)^2` 및 old beta/v/gamma와의 모든 cross terms가 남는다. `J_theta,new`에는 `Delta_gamma*Delta_v`, `J_z,new`에는 `(Delta_gamma)^2`가 남는다. conditional algebra check가 성공해도 class/analytic closure와 full physical error budget은 별도다.

## 판정

원본 노드의 정의를 보존하며 조건부 미분 및 잔차 항등식을 계산하는 것은 구현 진전이다. 위 source-domain/closure/smoothness/nonzero-divisor/class/flat-tail 조건의 미입증 부분을 임의 pass로 바꾸지 않는다. N6-01, N6-02와 whole M3 완료는 계속 **OPEN**으로 둔다.
