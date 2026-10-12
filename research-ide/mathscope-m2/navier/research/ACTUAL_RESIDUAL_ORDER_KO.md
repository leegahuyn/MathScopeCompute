# 실제 동일 N3 내부 해의 N=0,1 잔차와 고정 영역 차수 비교

## 1. 계산한 명제와 원전 결속

이 문서는 원본 N4-05의 유한 acceptance를 검증한다. 원래 source의 같은
압력, 양의 \(h\), 정규화 \(C\), leading nonlinear 해 및 영 axis datum으로
만든 \(n=1\) 내부 해를 사용한다. 하나의 **고정된 양의 compact**에서 실제
\(F_{\mathrm{slow}}=R+\operatorname{div}T\)의 성분을 둘러싸고,
\(C_{N,m},K_m\)를 source 식으로 계산하며, \(N=0\)에서 \(N=1\)로 갈 때
실제 잔차 norm이 작아지는 것을 보인다. 격자와 산술 정밀도가 달라져도
그 compact, 양의 concentration scale \(q\), 원래 source는 바뀌지 않는다.

원전은 OpenAI, *Finite Time Blowup for Navier–Stokes*이다.

- URL: https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf
- SHA256: 0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f
- 고정 profile: same-profile-2026-10-10.3.
- parameter expression SHA256: e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152.

| 원전 | 여기에서 사용하는 사실 |
|---|---|
| (4.1), Lemma 4.1; (5.26) | 실제 similarity 좌표와 공간·시간 chain rule |
| Theorem 4.6(ii), pp.32–33 | \(T_0=0\) on \(0\le X\le X_a\) |
| (5.2)–(5.8), pp.46–49 | 실제 계수 방정식, \(\Omega_n\), 여섯 성분 Picard 시스템 |
| Lemma 5.2, (5.13)–(5.15), pp.49–51 | 최종 보정이 내부 해를 보존하고 \(T_1=0\)인 구간 |
| (5.23)–(5.26), Proposition 5.3, pp.54–55 | 고정 compact의 물리 잔차 norm과 \(q^{2h(N+1)-K_m}\) 상계 |
| SAME_DATUM_ANALYTIC_AXIS.md, §§4–7 | 실제 무한 leading 해의 복소 Banach norm과 같은 A.21 datum |
| ACTUAL_BACKGROUND_KO.md, §§2–4 | 실제 \(C_1\), Picard norm, 정규화 axis coefficient 구간 |

원전 파일의 식을 개명하거나 바꾸지 않았다. source 입력의 실제 바이트,
압력 receipt와 근거 파일의 SHA는 Node 검사에서 확인한다.
새 residual algebra는 frozen actual-background-jets.mjs를 사용하고,
상계는 frozen actual-background-majorant.mjs의 source 상수에서 출발한다.
특히 압력 \(P\)를 임의 even polynomial로 대체하지 않는다. 독립 검사 중
보통 크기의 유리수로 수행하는 대수 항등식 대조는 별도 진단이며 실제
source 구간 계산과 분리된다.

원본 N4-05의 조건은 실제 \(F_{\mathrm{slow}}\) 계산, (5.25)의 차수 상계,
정밀도·격자와 분리된 \(N\) 증가의 실제 잔차 감소, 그리고 계산된
\(C_{N,m},K_m\)다. 여기서는 \(N=0,1\), \(0\le m\le6\)까지 수행한다.
전역 \(n=1\) 모멘트 보정 전체를 수치로 구성했다거나 모든 \(N\)의
잔차를 계산했다는 명제는 반환하지 않는다.

## 2. 이 내부 해는 최종 보정 해의 정확한 restriction이다

원래 Lemma 5.2는

\[
X_a<X_-<X_{\rm keep}<X_{\rm cut}<a^2<\inf I_{\rm pos}
\]

순서로 반경을 정한다. (5.14)–(5.15)의 cutoff는
\(X\le X_{\rm keep}\)에서 1이고, 다섯 보정 bump는 \(I_{\rm pos}\) 안에
있다. 따라서 최종 \(f_1,U_1\)는 \(X\le X_-\)에서 동일한 내부 해다.
원전 proof는 영 axis datum에서 앞으로 적분하는 \(V_1,\Pi_1\) 역시
그 구간에서 내부 해와 같음을 명시한다. 바깥의 pressure debt를
내부 pressure에 임의 상수로 더할 수 없다.

Theorem 4.6(ii)와 (5.13)에 따라 \(T_0,T_1\)는 이보다 작은 관측
compact의 열린 이웃에서 정확히 0이다. 그러므로 관측하는 두 truncation에
대해 \(F_{\mathrm{slow}}=R\)이며, 모든 stress 미분도 0이다.
이는 stress를 생략한 근사가 아니다. 어떤 전역 moment repair가
진행 중이더라도 원래 정리의 이 restriction은 바뀌지 않는다.

아래에서 \(R=3/\Lambda\), \(X_{\max}<R/8\)을 source 상수만으로
정한다. 실제 natural core 끝점은 \(X_a=4/\Lambda\)이므로
\(X_{\max}<R/8<X_a<X_-\)다. 여기에 임의의 cutoff를 새로 넣거나
\(q\)에 의존하여 영역을 이동하지 않는다. 이 영역은 매우 작다는 사실을
결과의 observationDomainIsVerySmall에 명시한다.

## 3. 실제 PDE에 두 truncation을 직접 대입

다음은 source 표기를 유지한 약기다.

\[
f_n=\phi_n/C,\quad A=\tfrac12+h,\quad D=\tfrac12-h,\quad
b=-A-\tfrac12,\quad c=-A,\quad w=q^{2h},
\]
\[
\mathcal Z_a^{[2]}=\mathcal Z_{a-D}\mathcal Z_a,\qquad
v_n=V_n/X.
\]

\(f_n\)는 swirl의 매끄러운 축 계수다. streamfunction \(F_n\)와
혼동하지 않는다. 모든 \(\mathcal T_a,\mathcal Z_a\)는 원래의 정확한
\(a\)를 사용한다. 뒤의 \(|a|\le4\)는 상계에만 적용한다.

### N=0

(5.2)–(5.6)의 retained 항을 직접 상쇄하면

\[
R_\theta^{[0]}
=-\sqrt{2X}\,q^{-A-1}w\,\mathcal Z_b^{[2]}f_0,
\qquad
R_z^{[0]}
=-q^{-A-1}w\,\mathcal Z_c^{[2]}U_0,
\]
\[
R_r^{[0]}
=q^{-3/2}\sqrt{X/2}
\left\{\frac{\Omega_0}{X}
-w\frac{\mathcal Z_0^{[2]}V_0}{X}\right\}.
\]

특히 \(\Omega_0\)를 0으로 놓지 않으며 원래 axial viscosity도 남긴다.

### N=1

첫 미상쇄 계수는

\[
H_{\theta1}
=V_1\left(f_{1,X}+\frac{f_1}{X}\right)
+U_1\mathcal Z_{b+2h}f_1-\mathcal Z_{b+2h}^{[2]}f_1,
\]
\[
H_{z1}
=V_1U_{1,X}+U_1\mathcal Z_{c+2h}U_1
-\mathcal Z_{c+2h}^{[2]}U_1,
\]
\[
Q_1=\frac{\Omega_1-2Xf_1^2}{X},
\qquad Q_2=\frac{\Omega_2}{X}.
\]

따라서

\[
R_\theta^{[1]}=\sqrt{2X}\,q^{-A-1}w^2H_{\theta1},
\quad
R_z^{[1]}=q^{-A-1}w^2H_{z1},
\]
\[
R_r^{[1]}=q^{-3/2}\sqrt{X/2}\{wQ_1+w^2Q_2\}.
\]

\(\Omega_2\)에는 \(V_1,U_1\)의 자기 곱과 \(V_1\)의 axial viscosity가
있다. truncation에서 \(V_2,U_2=0\)라는 사실은 \(\Omega_2=0\)을
뜻하지 않는다. 또한 \(\Omega_1\)의 pressure-shift 항에서
\(2Xf_1^2\)를 빼야 한다.

actual-residual-order-algebra.mjs는 이 연산을 정확한 expression DAG로
실행한다. 실제 leading/positive 계수로 N0/N1의 retained angular,
axial, pressure 계수가 모두 상쇄되는지 독립 Fraction 연산으로
검사한다. 유한 radial array는 대수 항등식과 축 계수를 계산하기 위한
것이며, 이를 무한 함수의 값으로 대입하지 않는다. 양의 반경의 실제
함수 오차는 다음 절의 별도 Cauchy bound로 둘러싼다.

## 4. 실제 source의 비영 잔차 계수

\[
U_*(\eta)=4\eta+j_0,\qquad
\alpha(\eta)=U_{1,X}(0,\eta)
=-\tfrac12\mathcal Z_{-1}\mathcal Z_{-A}U_*(\eta)
\]

로부터 정확히

\[
\alpha(0)=Aj_0,\quad
\alpha'(0)=12,\quad
\alpha''(0)=2Aj_0(8h-3)
\]

를 얻는다. \(\mathcal Z_a(Xg)=X\mathcal Z_{a-1}g\)의 shift를
유지해야 한다. 이 식을 \(H_{z1}\)에 대입하면

\[
H_{z1}(0,0)=0,\qquad
\partial_XH_{z1}(0,0)
=\left(\tfrac92-18h^2\right)j_0>0.
\]

radial 성분에는 다음 정확한 상쇄가 있다.

\[
v_0(0,0)=-4,\quad v_{0,\eta}(0,0)=2Aj_0,\quad
v_{0,\eta\eta}(0,0)=16,
\]
\[
Q_1(0,0)=2\alpha'(0)
-\{v_{0,\eta\eta}(0,0)-2v_0(0,0)\}=24-24=0,
\quad Q_2(0,0)=0.
\]

반면 N0에는 실제 압력의 비영 debt가 남는다.

\[
\frac{\Omega_0}{X}(0,0)
=-2\Pi_{1,X}(0,0)=24-4AP(0)+P''(0).
\]

압력 \(P(0)/K,P''(0)/K\)는 원래 A.21 receipt의 exact rational
interval을 사용한다. 그 source analytic error를 지우지 않는다.
기본 정밀도에서 N0 radial의 정규화된 양의 관측 구간은 약
\([19.887736380085993,19.887736380085997]\)이고,
N1 axial의 \(H_{z1}/(j_0X)\)는 약 \(4.5\)다. 이 두 값은
원래 물리 잔차를 자체의 양의 정확한 배율로 나눈 구간이며,
서로 다른 정규화의 midpoint끼리 norm 비교를 하지 않는다.

## 5. 실제 source의 해석 norm에서 Bres를 계산

frozen source majorant의 기호를 유지한다.

\[
\delta=\frac{\rho}{1024Q},\quad
B=\frac{4096\Lambda^2Q^3}{t_1},\quad
C_1=\frac{2^{18}B^2}{\delta^2},\quad
R=\frac3\Lambda,\quad
\rho_0=\Delta=\frac{\delta}{8}.
\]

실제 nonlinear leading 해의 Banach series는 복소 \(|Y|<3\),
\(\operatorname{dist}(\eta,[-1,1])<\rho_0\)를 포함한다.
실제 \(g\), \(P\), 그 미분을 포함한 leading bound는 이 natural core에서
유효하다. \(C^\infty\) activation cutoff의 radial analyticity를
주장하지 않는다. 관측용 복소 disc는 그 cutoff 이전에 있다.

여섯 성분 선형 시스템을 source에서 계산한 \(C_1\)로 상계한다.
희소 eta derivative block 때문에 \(k\)번째 Picard 항의 미분 수는
\(\lceil k/2\rceil\) 이하다. \(c_P=3C_1\sqrt R/\sqrt{2\Delta}\)로
놓으면 원래 항 상계와 Cauchy–Schwarz로

\[
\sum_{k\ge0}\|\mathcal K^kGf_1\|
\le\sum_{r\ge1}\frac{c_P^r}{\sqrt{r!}}
<e^{c_P^2}.
\]

따라서 실제 \(f_0,U_0,f_1,U_1\), 그리고 필요한 radial average를
한꺼번에 감싸는 상수는

\[
M=1+B+6Q+\exp\!\left(\frac{9C_1^2R}{2\Delta}\right).
\]

이 값은 caller의 상계 입력이 아니다. source의 고정된 양의
expression으로 계산한다. 식이 너무 커서 십진수로 펼칠 수 없다는
이유로 유한한 다른 숫자를 넣지 않는다.

복소 \(|X|\le R/2\), \(S_{\rho_0/2}\)에서 각 scalar atom의
local Taylor coefficient는

\[
\frac{|\partial_X^i\partial_\eta^j f|}{i!j!}
\le M(2/R)^i(2/\rho_0)^j
\]

로 상계된다. \(L^{-1}\)는 \(X\)에 무관하고 eta 계수는
\(2(2/\rho_0)^j\) 이하이다. radial average는
\(\int_0^1 U(tX,\eta)\,dt\)이므로 같은 norm을 가진다.
실제 영 axis datum과 Schwarz lemma로 \(f_1/X\)의 norm은
\(M/R\) 이하다. \(V/X\)는 다음 정칙식에서 계산한다.

\[
v_n=L^{-1}\{2\eta U_n
-2\eta(D+2nh)\operatorname{Avg}_XU_n
-(1-\eta^2)\partial_\eta\operatorname{Avg}_XU_n\}.
\]

source의 실제 \(h\)에서 \(n=0,1\)에 대해 \(|D+2nh|\le1\)이다.
코드의 norm jet는 local Taylor coefficient 규약이며 미분 때
차수를 곱하고 사용 가능한 degree를 줄인다. \(\Omega\)에 필요한
radial 2차와 eta 2차에다가 위 average의 eta 1차가 더 들어가므로
degree 3을 확보한다. 확보하지 않은 미분을 0으로 반환하지 않는다.

이 연산을 사용해 다음 여덟 scalar 상계를 실제 합성한다.

1. \(\mathcal Z_b^{[2]}f_0\).
2. \(\mathcal Z_c^{[2]}U_0\).
3. \(\Omega_0/X\).
4. \(\mathcal Z_0^{[2]}V_0/X\).
5. \(H_{\theta1}\).
6. \(H_{z1}\).
7. \(Q_1\).
8. \(Q_2\).

각 sum, product, derivative 및 양의 분모의 Cauchy loss를 expression
DAG로 실행하고, 그 여덟 bound의 합에 1을 더한 값을
\(B_{\rm res}\)로 정의한다. signed PDE에서 필요한 빼기는 norm에서
triangle inequality로 더한다. \(\Omega\)의 radial viscosity
\(2(2v_X+Xv_{XX})\), pressure shift 및 \(\Omega_2\)도 이 합에 포함된다.

## 6. 물리 Cartesian 미분과 계산된 CNm, Km

이 절에서는 실제 물리 좌표를 미분한다. 극좌표 basis의 \(1/r\)를
별도의 특이 bound로 추정하지 않는다. \(s_i=x_i/\sqrt q\)라 놓으면
\(X=(s_1^2+s_2^2)/2\)이며,

\[
\sqrt{2X}\,e_\theta=(-s_2,s_1,0),\qquad
\sqrt{X/2}\,e_r=(s_1,s_2,0)/2.
\]

실수 \(X\le R/8\)를 중심으로 각 \(s_i\)의 복소 반경을
\(a_s=\sqrt R/32\), eta 반경을 \(a_\eta=\rho_0/4\)로 정한다.
\(\sqrt2<3/2\)를 사용하면 이 polydisc에서

\[
|X_{\mathbb C}|
\le\frac R2(1/2+3/64)^2
=\frac{1225}{8192}R<R/2.
\]

각 Cartesian 선형 factor의 절댓값도
\(17\sqrt R/32<1\)이다. eta는 \(S_{\rho_0/4}\)에 남으며
\(|\eta|\le2\), \(|1-\eta^2|\le5\), \(|L^{-1}|\le2\)이다.
마지막 부등식은 실제 \(8h<1/2\)에서 나온다.
따라서 앞 절의 scalar bound는 이 모든 복소 polydisc에서 유효하다.

원래 좌표식 \(\tau=q(1-\eta^2)\), \(z=q^D\eta\)의 Jacobian을
직접 역변환하면

\[
\partial_t(q^af)
=q^{a-1}L^{-1}
\left(-af+\tfrac12s\cdot\nabla_sf+D\eta f_\eta\right),
\]
\[
\partial_z(q^af)
=q^{a-D}L^{-1}
\left(2\eta(af-\tfrac12s\cdot\nabla_sf)
+(1-\eta^2)f_\eta\right),
\]
\[
\partial_{x_i}(q^af)=q^{a-1/2}\partial_{s_i}f.
\]

시간 부호는 \(t=1-\tau\)에서 나온다. axial loss는 정확히 \(D\)이며
그것을 1로 바꾸어 미분한 것이 아니다. \(0<q\le1\)에서 모든
미분의 최대 loss를 1로 상계할 수 있을 뿐이다.

\[
D_{\rm space}=1+32/\sqrt R+8/\rho_0
\]

로 놓고 polydisc 반경을 \(m+1\)개의 같은 단계로 줄인다. 한 단계
Cauchy는 \(\partial_{s_i}\)에 \((m+1)D_{\rm space}\) 이하,
\(\partial_\eta\)에 \((m+1)D_{\rm space}/2\) 이하를 준다.
초기 잔차의 실제 \(q\) 지수는 절댓값이 2보다 작고, \(m\)번 이내의
미분 중에는 \(|a|\le m+2\)다.

따라서 시간 연산의 한 단계 norm 비용은

\[
2\{(m+2)+(m+1)D_{\rm space}
+(m+1)D_{\rm space}/2\}
\le8(m+2)D_{\rm space}.
\]

axial 연산에서는 \(2|\eta|\le4\), \(|1-\eta^2|\le5\)이므로

\[
2\{4(m+2)+4(m+1)D_{\rm space}
+5(m+1)D_{\rm space}/2\}
\le26(m+2)D_{\rm space}.
\]

transverse 비용도 이보다 작다. 공통 상계로
\(32(m+2)D_{\rm space}\)를 사용한다.
이 비용을 **매 미분마다** 부과하고 반복하므로 ordinary derivative의
factorial/Cauchy 비용이 이미 \((m+1)^m\) 안에 들어 있다.
Taylor coefficient를 ordinary derivative로 잘못 읽거나 별도의
\(m!\) 비용을 생략한 계산이 아니다.

잔차를 Cartesian 성분으로 분해하면 radial의 두 \(q\) 항이 각 두
성분, angular가 두 성분, axial이 한 성분으로 최대 일곱 scalar
summand다. 여유를 포함한 8을 사용하면 \(N=0,1\)에 대해

\[
C_{N,m}=8B_{\rm res}
\{32(m+2)D_{\rm space}\}^{m},\qquad K_m=2+m
\]

를 얻는다. 실제 더 날카로운 \(q\) loss는
\(3/2+2h+m\)이고 원래 \(0<h<1/4\)에서

\[
3/2+2h+m\le2+m.
\]

그러므로 (5.23)의 물리 Cartesian 공간·시간 미분 norm에 대해

\[
|F_{\rm slow}^{[N]}|_m
\le C_{N,m}q^{\,2h(N+1)-K_m}
\]

가 고정 compact 전체에서 성립한다. \(K_m\)은 두 \(N\)에 공통이다.
표시용 decimal이 아니라 source에 결속된 정확한 식으로
\(C_{N,m}\)를 반환한다. 기본값은 \(m=0,1,2\), 허용 입력은 \(0\le m\le6\)다.

## 7. 고정 양의 반경에서 실제 성분 interval

\[
\epsilon=2^{-160},\quad
J=1+\frac1{j_0}+\frac1K+\frac{Cj_0^2}{\Lambda^2},
\quad
X_{\rm unit}=\frac{R^2\epsilon}{256B_{\rm res}J},
\quad X_{\max}=4X_{\rm unit}.
\]

이 source-defined 값은 산술 bits나 격자에 의존하지 않는다.
\(0<R<1\), \(B_{\rm res},J\ge1\)에서

\[
0<\frac{X_{\max}}R
=\frac{R\epsilon}{64B_{\rm res}J}
<1/64<1/8.
\]

실제 관측점은 \(X=tX_{\rm unit}>0,\eta=0\)이다. 이 \(t\)는
반경 multiplier이며 물리 시간 \(t\)와 무관하다.
실제 \(X\)를 binary64 0으로 저장하지 않고 정확한 양의 expression으로
유지한다. 모든 \(q\)에 대해 동일한 similarity compact를 사용한다.
원래 similarity map에 따라 그 물리 공간의 크기는 \(q\)와 함께 변한다.

scalar residual \(g\)가 \(|X|\le R/2\)에서 \(B_{\rm res}\)로
상계될 때

\[
|g(X)-g(0)|\le
\frac{2B_{\rm res}X/R}{1-2X/R}.
\]

\(g(0)=0\)이면

\[
|g(X)-Xg_X(0)|
\le\frac{4B_{\rm res}X^2/R^2}{1-2X/R}.
\]

\(J\)는 모든 정규화 multiplier를 상계하고 \(X/R<1/8\)이므로,
두 radial 항에 대한 합산 오차와 \(H_{z1}/(j_0X)\)의 오차도
\(t\epsilon/32\) 이하이다. 코드에서는 여유를 더해 공통
\(t\epsilon/16>0\)를 붙인다. angular와 N0 axial에는 더 작은
상계가 적용되므로 같은 budget이 유효하다.

| N | 성분 | 정규화된 관측량 | 원래 물리 배율 |
|---:|---|---|---|
| 0 | angular | \(-Cj_0^2\mathcal Z_b^{[2]}f_0/\Lambda^2\) | \(\sqrt{2X}\Lambda^2/(Cj_0^2)\,q^{-3/2+h}\) |
| 0 | axial | \(-\mathcal Z_c^{[2]}U_0/j_0\) | \(j_0q^{-3/2+h}\) |
| 0 | radial | \((\Omega_0/X-w\mathcal Z_0^{[2]}V_0/X)/K\) | \(\sqrt{X/2}Kq^{-3/2}\) |
| 1 | angular | \(Cj_0^2H_{\theta1}/\Lambda^2\) | \(\sqrt{2X}\Lambda^2/(Cj_0^2)\,q^{-3/2+3h}\) |
| 1 | axial | \(H_{z1}/(j_0X)\) | \(j_0Xq^{-3/2+3h}\) |
| 1 | radial | \((Q_1+wQ_2)/K\) | \(\sqrt{X/2}Kq^{-3/2+2h}\) |

N0 radial의 축 보정 \(-24w/K\)도 실제 \(0<w\le1\),
\(K^{-1}<2^{-2048}\)로
\([-24\,2^{-2048},0]\) 안에 유지한다. \(h,j_0,K^{-1}\)를 정확히
0으로 대체하지 않는다. N1 angular/radial의 표시 중심이 0인 경우에도
양의 Cauchy width가 있으므로 정확한 영 잔차라고 하지 않는다.

## 8. 같은 물리 배율에서 실제 N 감소를 증명

모든 격자에 포함되는 \(X=X_{\rm unit},\eta=0\)의 N0 radial
interval 하한을 \(L_0\)라 한다. 원래 압력 receipt와 Cauchy error를
포함하여 \(L_0>19>1\)이다. 다음 양의 source scale을 고정한다.

\[
S=K\sqrt{X_{\rm unit}/2},\qquad C_\sharp=8B_{\rm res}.
\]

요청한 정수 \(k\)마다

\[
w_k=\frac{2^{-k}S}{1+C_\sharp+S},
\qquad
q_k=\exp\!\left(\frac{\log w_k}{2h}\right)
\]

를 정의한다. 실제 \(0<h\)를 그대로 사용하므로
\(0<q_k<1\), \(q_k^{2h}=w_k\)다. \(q_k\) 역시 underflow 0이
아닌 양의 정확한 expression이다.
각 비교는 \(q=q_k\)를 고정한 \((X,\eta,\theta)\) 영역의 supremum이다.
원래 물리 시간은 \(\tau=q_k(1-\eta^2)\)로 복원하므로 eta가 달라지면
물리 시간도 달라진다. 이를 한 물리 시간의 전체 공간 snapshot으로
표시하지 않는다. witness의 eta=0에서는 \(\tau=q_k\)다.

N0의 실제 한 성분 witness는 compact 전체 supremum의 하한을 주고,
앞 절의 실제 scalar norm은 N1 전체 vector supremum의 상한을 준다.
각도는 전체 원을 포함하며 witness에서는 theta=0을 택한다.
따라서 radial 성분은 물리 Cartesian 첫 번째 성분과 정확히 일치한다.

\[
\sup_{\rm compact}|F_{\rm slow}^{[0]}|
\ge q_k^{-3/2}S L_0,
\]
\[
\sup_{\rm compact}|F_{\rm slow}^{[1]}|
\le C_\sharp q_k^{-3/2}w_k
<q_k^{-3/2}S\,2^{-k}.
\]

따라서

\[
\frac{\sup_{\rm compact}|F_{\rm slow}^{[1]}|}
{\sup_{\rm compact}|F_{\rm slow}^{[0]}|}
<\frac{2^{-k}}{L_0}<2^{-k}.
\]

이는 formal \(q\) power에 감소 label만 붙인 결과가 아니다.
동일한 실제 물리 scale에서 계산된 N0의 양의 하한과,
계산된 source 상수로 만든 N1의 전체 compact 상한을 비교한다.
다만 반환된 norm interval의 midpoint를 실제 norm의 수치 적분값으로
표시하지 않는다. 기본 \(k\)는 4, 8, 12, 16이다.

## 9. 독립 정밀도·격자 검사와 경계

기본 격자는 \(g=8\), \(X_i=(4i/g)X_{\rm unit}\)이다.
\(g=4,8,16,32\)는 같은 끝점과 공통 witness를 가지는 nested 격자다.
모든 공통점의 source interval이 일치하는지 검사한다.
finite sampling은 위 analytic supremum proof를 대신하지 않는다.

bits는 exact rational interval을 dyadic interval로 바깥 반올림하는
산술 정밀도다. 96, 128, 192 bits의 독립 fixture 및 512-bit
경계 검사에서 같은 \(X,q\), 같은 source analytic error를 사용한다.
160-bit의 고정 source error floor 이상으로 bits를 높여도 그
해석 오차가 사라지지 않는다. 실제 압력 receipt의 폭도 유지한다.

전용 검사 명령:

    node --test research-ide/mathscope-m2/navier/tests/actual-residual-order.test.mjs
    python research-ide/mathscope-m2/navier/tests/actual-residual-order-independent.py

Node 검사는 source 바이트, source-only input, DAG 및 scope replay,
positive parameter, 실제 물리 배율, fixed coordinates, interval nesting,
오류 한계 보존을 검사한다. 독립 Python 검사는 원래 압력 receipt에서
Fraction 구간을 다시 구성하고, 별도의 exact eta differential algebra로
retained PDE cancellation과 축 식을 확인한다. 누락된 viscosity,
pressure correction, moving coordinates, 임의 \(C\), 오류 폭 제거,
전역 완료 flag 변조는 실패해야 한다.

이 결과가 실행하는 범위는 **원래 내부 source의 N=0,1 유한 잔차
acceptance**다. 전체 \(I_{\rm pos}\) moment debt의 값, 전역으로
복원된 \(n=1\) coefficient family, 모든 \(N\)의 residual, 전체
annulus의 균일 bounds는 별도의 계산 의무로 남는다.
wholeProfileResidualComplete, globalN1MomentRepairComplete,
allNResidualComplete, formalKernelProof는 모두 false로 유지한다.
