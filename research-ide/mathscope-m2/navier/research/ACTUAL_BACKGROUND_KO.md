# 같은 N3 소스에서 구성한 1차 배경 계수와 남은 전역 모멘트

## 이번에 실제로 추가한 것

이 문서는 `same-profile-2026-10-10.3`의 고정된 압력·지수·진폭·활성화 함수를 사용한 N4 작업을 설명한다. `h`, `j0`, `Lambda`, `CSelected`를 계산하기 쉬운 다른 값으로 바꾸지 않는다. 사용한 M1 입력 파일의 경로, SHA-256, 바이트 수는 `../actual-background-data.mjs`에 있으며 전용 테스트가 원본 바이트와 대조한다.

새 모듈은 다음을 구성한다.

1. 실제 leading nonlinear Picard 해의 B.14/B.15 점화식으로 leading radial jet를 생성한다. 이어 (5.2)–(5.6)을 풀어 **양의 차수 (n=1)**의 (F_1,U_1,K_1,\Pi_1,V_1) radial jet를 생성한다. 여기서 (F_n=\phi_n/C_{\rm Selected})다. 각 계수는 실제 압력 함수, 실제 지수 및 그 해석적 미분을 참조하는 정확한 식 DAG이다. 유한 배열을 무한 함수로 바꾸어 부르지 않는다.
2. 실제 첫 활성화 구간까지 포함하는 공통 반경에서 구체적인 complex strip, (C_1), Cauchy radius loss 및 수렴 Picard tail을 도출한다. 사용자가 선언한 (C_n)을 입력받지 않는다.
3. 실제 (n=1) 계수의 축 미분값 세 개를 정확한 유리수 구간으로 계산한다. 압력에 의존하는 값은 실제 A.21 압력의 적분·해석 오차를 유지한다.
4. **실제 양의 반경 다섯 곳**에서 세 계수의 정규화된 difference quotient를 해석적 remainder와 함께 평가한다. 이 관측은 실제 무한 해에 대한 구간이며, 축 미분값 자체를 다른 점의 함수값으로 바꾸어 표시하지 않는다.
5. 원문의 다섯 total moment를 (X=R^2/2) 좌표의 식 DAG로 구성한다. 전역 Ω 항을 없애지 않는다. 실제 (I_{\rm mean}) 구간에 남는 두 모멘트 기여를 별도로 평가하여, core 또는 (I_{\rm pos}) 이후를 0으로 처리하는 잘못된 복구를 반증한다.

**전체 차수별 배경 구성, 전역 다섯 모멘트 복구, 실제 (F_{\rm slow}) 잔차 감소의 완료를 의미하지 않는다.** 공개 반환값은 전체 상태를 `PARTIAL`로 유지한다. 원문의 N4-03, N4-04, N4-05 문언을 변경하지 않았다. 다음 차수 source는 실제 전역 moment repair가 완료되기 전 생성하지 않는다.

## 원문과 정확한 입력

주원전은 [Navier–Stokes 원문 PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. 아래 쪽수는 PDF의 인쇄 쪽수다.

| 근거 | 사용하는 내용 |
|---|---|
| 원문 pp.46–49, (5.1)–(5.8), Lemma 5.1 | 원래 변수의 거듭제곱, 계수 PDE, 여섯 성분 시스템, sparse derivative block, 공통 반경의 Picard 수렴 |
| 원문 pp.49–53, (5.10)–(5.18), Lemma 5.2 | 다섯 모멘트, 원래 cutoff·복구 순서, 정확한 bump integral matrix, (n=1)의 긴 stress support |
| 원문 pp.150–153, B.22·B.26·Corollary B.6 | natural core와 reference의 일치 구간, 실제 첫 활성화, parameter analyticity |
| `mathscope-m1/navier/followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md` §§4–9 | **같은** A.21 압력의 strip, (B_\rho) norm, 실제 무한 nonlinear fixed point, 전 η 구간의 계수·미분 상계 |
| 같은 디렉터리의 `CONTINUATION_AND_NEW_DEBT.md` | 같은 최종 (C\), (t_1=C^{-120}\), 같은 reference 및 실제 B.26 continuation |
| `mathscope-m1/navier/followup-20261010-final-stress-audit/ACTIVATION_COLLAR_BOUNDS_EN.md` | 실제 짧은 collar의 cone 여유와 (X_{\rm an}=X_a\exp(t_1/16)) 선택 |
| `mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/pressure-datum-0001/receipt.json` | 실제 (P(0)/K\), (P''(0)/K) 구간; finite prefix로 잘라 버리지 않은 A.21 오차 |
| `mathscope-m1/navier/followup-next/uniform-gluing/smooth-derivative-certificate.json` | literal flat step의 연속 도함수 상계; 여기서는 (\|\sigma'\|<9) 사용 |

원문의 구현 기준은 `mathscope-m2/evidence/original-m2-criteria.json` N4-03–05이며 Blueprint source page는 58이다. 과거 M1에서 이미 생성된 mixed coefficients 125개와 mixed derivative values 75개는 실제 nonlinear source의 유한 관측이다. 이번 전 η strip 추론은 그 유한 표가 아니라 위의 **실제 무한 함수 (B_\rho) norm**을 사용한다.

## 1. 공통 complex strip을 실제 첫 collar까지 확장

소스의 정확한 값은

\[
Q\ge 2^{260},\quad \Lambda=Q^{64},\quad
C=(1+Q^{300})^{10}\exp(Q^{200}),\quad t_1=C^{-120},
\quad X_a=4/\Lambda.
\]

실제 normalized functions (\Phi,u)의 (B_\rho) norm이 (Q) 이하이므로, weighted coefficient estimate에서 분모 가중치를 1로 완화하고 항별 Taylor 전개를 합하면

\[
|\partial_Y^k\partial_\eta^m f|
\le \frac{Q(k+m)!}{20^k\rho^m}
\left(1-\frac{|Y|}{20}-\frac{|\operatorname{Im}\eta|}{\rho}\right)^{-k-m-1}.
\]

실제 norm은 원문에서 확장한 실수 η 구간 (I=[-33/32,33/32])에 일관되게 주어져 있다. 따라서 ([-1,1])의 양 끝에서도 동일한 작은 tube를 사용할 수 있다. ( |Y|\le5\), (\operatorname{dist}(\eta,I)\le\rho/4)에서는 우변의 괄호를 (1/2)로 하계할 수 있다. 특히

\[
|\Phi_\eta|\le4Q/\rho,\qquad
|\Phi_Y|,|u_Y|\le Q/5.
\]

선택한 작은 폭은

\[
\delta=\frac{\rho}{1024Q}.
\]

실수 (0\le Y\le4.1)에서 실제 (\Phi\ge1/4)이므로 이 폭의 parameter tube에서는

\[
|\Phi|\ge\frac14-\frac1{256}=\frac{63}{256}>\frac18.
\]

따라서 reference logarithmic slope에 쓰이는 실제 (1/\Phi)도 상계된다. 유한 비교 다항식의 무영점성을 실제 함수의 무영점성으로 바꿔 쓰지 않는다.

공통 끝점은 기존 소스 그대로

\[
a^2=X_a\exp(t_1/16).
\]

(y=\log(X/X_a)\in[0,t_1/16])에서는 B.22 reference가 아직 natural core와 정확히 같다. 실제 B.26 activation은

\[
\kappa(y)=1-(1-t_1)\sigma(y/t_1),
\]
\[
F_s=g\Phi(4,\eta)
\exp\!\left(\int_0^y\kappa(s)
\frac{Y\Phi_Y}{\Phi}(4e^s,\eta)\,ds\right),
\]
\[
U_s=U_{\rm nat}(X_a,\eta)+\Lambda^{-1}
\int_0^y\kappa(s)Y u_Y(4e^s,\eta)\,ds.
\]

따라서 단지 natural core를 collar까지 연장하는 대체 함수를 만들 필요가 없다. 원래 활성화 함수를 그대로 쓴다. (0\le\kappa\le1\), (C\ge Q\), (8Qt_1<1\), (4e^{t_1/16}<4.1)을 사용하면 이 전체 구간과 (S_\delta)에서

\[
|F_0|\le6Q,\qquad |U_0|\le6,\qquad |\Pi_0|\le2Q.
\]

후속 loop나 moment correction은 이 구간 오른쪽에서만 작동한다.

## 2. 원래 여섯 성분 시스템의 실제 (C_1)

(r=Y\Phi_Y/\Phi)라 놓으면 ( |r|\le8Q\), ( |r_y|\le80Q^2)다. η와 무관한 cutoff에 ( |\sigma'|<9)를 적용하여

\[
|F_{0,XX}|\le 2048\Lambda^2Q^3/t_1,\quad
|U_{0,XX}|\le2\Lambda Q/t_1,
\]
\[
|\Pi_{0,X}|\le36Q^2,\quad
|\Pi_{0,XX}|\le144\Lambda Q^3
\]

를 얻는다. 다음 보수적 상수 하나가 (F_0,U_0,\Pi_0)의 radial orders 0, 1, 2를 모두 상계한다.

\[
B=4096\Lambda^2Q^3/t_1.
\]

재구성 (v=V_0/X)는 axis에서 특이한 값을 나누지 않고 radial average로 계산한다. (S_{\delta/2})에서 ( |\partial_X^k v|\le28B/\delta), (k=0,1,2)이며, 더 작은 (S_{\delta/4})에서 ( |v_\eta|\le112B/\delta^2)다. 원래 식 (5.6)은

\[
\frac{\Omega_0}{X}
=L^{-1}(D\eta v_\eta+v+Xv_X)
+v(v/2+Xv_X)
+U_0L^{-1}\{dv_\eta-2\eta(v+Xv_X)\}
-2(2v_X+Xv_{XX}).
\]

(a^2<1,\delta<1,B\ge1,|\eta|\le2,|L^{-1}|\le2)를 이용한 네 묶음의 합은 (4096B^2/\delta^2)보다 작다. 같은 Cauchy bound로 두 실제 axial-viscosity source도 (4096B/\delta^2) 이하이다.

Unknown은 원래 벡터를 정확히 conjugate한

\[
W_1=(F_1,U_1,K_1,\Pi_1,\partial_\xi F_1,\partial_\xi U_1),
\qquad F_1=\phi_1/C
\]

이다. source parameter나 physical field를 변경한 것이 아니다. ξ-singular diagonal은 원래의 ( (0,0,2,0,3,1))이다. 두 matrix의 최대 행합은 (512B/\delta), forcing의 최대 성분은 (65536B^2/\delta^2)로 상계된다. 그러므로

\[
C_1=2^{18}B^2/\delta^2
\]

를 선택할 수 있다. source strip, solution strip, loss는 각각

\[
\rho_1=\delta/4,\qquad \rho'_1=\delta/8,\qquad
\Delta=\delta/8.
\]

모든 수는 실제 고정 source parameter의 정확한 식이다. 부동소수점 underflow로 (h=0\), (t_1=0\), (\delta=0)을 설정하지 않는다.

## 3. 매우 큰 (C_1)에도 유효한 Picard tail

원래 sparse derivative block 때문에 (k)회 합성의 η 미분 수는 최대 (p_k=\lceil k/2\rceil)이다. (A_P=C_1a)라고 쓰면 (5.8)의 항 상계는

\[
B_k=\frac{A_P^{k+1}}{(k+1)!}
\max(1,p_k/\Delta)^{p_k}.
\]

(k\ge1\), (0<\Delta\le1)에서 factorial 하계 (m!\ge(m/3)^m)를 쓰면

\[
B_k\le\left(\frac{3A_P}{\sqrt{2\Delta(k+1)}}\right)^{k+1}.
\]

요청한 정밀도 (b)에 대해

\[
K=\max\!\left(1,\left\lceil\frac{72A_P^2}{\Delta}\right\rceil,
\lceil b/2\rceil\right)
\]

를 선택하면, (k\ge K)에서 (B_k\le4^{-k-1})이며

\[
\left\|\sum_{k\ge K}\mathcal K^kGf_1\right\|
\le\sum_{k\ge K} B_k
\le4^{-K}/3\le2^{-b}.
\]

이것은 **해당 정확한 (K)-항 절단의 해석적 오차 보증**이다. 실제 (K)가 매우 크기 때문에 그 정수를 십진수로 펼치거나 모든 (K)항을 이미 계산했다고 표시하지 않는다. 반환값 `truncationActuallyEvaluated:false`를 반드시 유지한다. 이 source-specific bound와 사용자가 입력한 보통 크기의 상수를 사용한 universal tail arithmetic test는 서로 다른 검증 범위다.

## 4. 새로 계산한 실제 1차 축 미분값

영 axis datum과 원래 방정식을 (X=\eta=0)에 적용하면 다음 식이 나온다. (\chi_0=4000000/4000001)이다.

\[
-\frac{4j_0^2}{\Lambda^2}\phi_{1,X}(0,0)
=\chi_0^2
+\frac{(9/2-h)\,4000000\cdot3999999}{\Lambda\,4000001^2}
+\frac{2(-1-h)j_0^2}{\Lambda^2},
\]
\[
\frac{U_{1,X}(0,0)}{j_0}=\frac12+h,
\qquad
\frac{\Pi_{1,X}(0,0)}K
=-\frac{12}K+2(1/2+h)\frac{P(0)}K-\frac{P''(0)}{2K}.
\]

| 실제 정규화 관측 | 화면용 근삿값 | 정확한 해석 |
|---|---:|---|
| (-4j_0^2\phi_{1,X}/\Lambda^2) | 0.9999995000001876 | 실제 양의 값; 원래 φ 미분은 음수 |
| (U_{1,X}/j_0) | 0.5 | 엄밀히 (1/2)보다 크다. 이 차이는 binary64로 구분되지 않아도 정확한 구간에 남는다. |
| Π 미분의 (1/K) 정규화 | −9.943868190042998 | 실제 A.21 압력의 불확실성을 포함한 음수 구간 |

첫 식은 (g'=\Lambda\zeta g\), (g''/g=\Lambda\zeta'+\Lambda^2\zeta^2)에서, 마지막 식은 **원래 radial Ω pressure shift를 포함하여** 얻는다. 정규화된 값의 구간을 원래 물리 field의 유한 숫자로 오해하면 안 된다. 각 행에는 정확한 정규화와 역복원 식이 있다.

### 양의 반경에서의 실제 함수 구간

관측 전용 Cauchy disc를 (R_{\rm obs}=3/\Lambda)로 정한다. 이는 actual natural core 끝점 (4/\Lambda) 안에 있다. Lemma 5.1의 공통 반경 (a^2=X_ae^{t_1/16})를 줄이는 것이 아니다. 실제 leading coefficient의 (B_\rho) norm은 complex (Y)에서도 수렴하는 series를 주므로 이 disc에서 앞의 보수적 (C_1)을 그대로 사용할 수 있다.

복소 radial ray 위의 Picard 연산은 동일하게 수렴한다. 첫 네 coordinate의 짝성 때문에 해는 (X)에서 analytic이다. 실제 실수 inner solution과는 원래 영 axis datum·uniqueness에 의해 일치한다. (A_{\rm obs}=C_1\sqrt{R_{\rm obs}}), (c=3A_{\rm obs}/\sqrt{2\Delta})라 쓰면,

\[
\sum_{k\ge0}\|\mathcal K^kGf_1\|
\le\sum_{m\ge1}\frac{c^m}{\sqrt{m!}}
\le\sqrt{(e^{2c^2}-1)\sum_{m\ge1}2^{-m}}
<e^{c^2}=:M.
\]

따라서 zero axis datum을 가진 (f=F_1,U_1,\Pi_1)에 대해

\[
|f(X)-f'(0)X|
\le M\frac{(X/R_{\rm obs})^2}{1-X/R_{\rm obs}}.
\]

세 정규화 multiplier와 그 공통 상계는

\[
s_F=-4Cj_0^2/\Lambda^2,\quad s_U=1/j_0,\quad s_\Pi=1/K,
\quad B_{\rm obs}=1+|s_F|+s_U+s_\Pi.
\]

선택한 `locationScaleBits` (b)로

\[
X_i=\frac{iR_{\rm obs}^2,2^{-b}}{32MB_{\rm obs}},\qquad i=1,2,3,4,5
\]

를 정의하면 모두 엄밀히 양수다. (X_i/R_{\rm obs}<5/32)이고

\[
\left|s\frac{f(X_i)}{X_i}-sf'(0)\right|
\le\frac{i,2^{-b}}{32(1-5/32)}<2^{-b}.
\]

이로써 앞의 실제 축 미분 interval에 정확히 (2^{-b})만큼 여유를 더해 **실제 (s f(X_i,0)/X_i)** 15개를 둘러싼다. 엄청나게 작은 (X_i)는 exact expression과 log expression으로 보존한다. `XBinary64:null`이며, 0을 뜻하지 않는다. 화면의 (i)는 실제 반경 multiplier의 범주형 index이고 raw 공간축이 아니다.

이 관측은 전체 inner collar의 수치 sampler가 아니다. **(b)를 바꾸면 관측 위치 (X_i)도 바뀐다.** 따라서 fixed-point numerical refinement, 독립적인 격자·정밀도 수렴, 또는 N4-05의 실제 residual 감소 증거로 사용하지 않는다. 전체 local moment 적분을 수치로 계산했다는 뜻도 아니다. 이 구별을 `precisionChangesObservationPoint:true`, `fixedPointRefinement:false`, `completeInnerCollarEvaluator:false`, `localMomentIntegralsEvaluated:false`, `N4_05_ResidualEvidence:false`로 반환한다.

## 5. 다섯 모멘트 중 전역 Ω를 필요로 하는 두 항

현재의 정확한 inner solution을 η와 무관한 원래 순서의 cutoff로 확장한다.

\[
\widetilde F_1=\kappa F_1^{\rm in},\qquad
\widetilde U_1=\kappa U_1^{\rm in}.
\]

Cutoff는 (X_{\rm keep}=X_a e^{t_1/64})까지 1이고 (X_{\rm cut}=X_a e^{t_1/32}<a^2)부터 0이다. (X=R^2/2)로 정확히 변수 변환하면 다섯 초기 모멘트는

\[
\begin{aligned}
m_1&=\int\widetilde U_1\,dX,\\
m_2&=\int 2X\widetilde F_1\,dX,\\
m_3&=\int 2F_0\widetilde F_1\,dX
      -\int_0^{X_v}\frac{\Omega_0}{2X}\,dX,\\
m_4&=\int2X(U_0\widetilde F_1+\widetilde U_1F_0)\,dX,\\
m_5&=\int(2U_0\widetilde U_1-2XF_0\widetilde F_1)\,dX
      +\int_0^{X_v}\frac{\Omega_0}{2}\,dX.
\end{aligned}
\]

첫 번째의 local 적분들과 달리 두 Ω 적분은 실제 global leading axial support (X_v)까지 필요하다. 식 DAG는 이 두 항을 명시적으로 남긴다. 이후 correction은 원래 식대로

\[
\alpha=-B_U^{-1}(m_1,m_4/(e_*f))^T,
\quad
\beta=-B_E^{-1}(m_2,m_3/(2e_*f),-m_5/(e_*f))^T.
\]

여기서 역행렬은 **정확한 bump integral matrix의 역**이다. interval matrix의 midpoint 역으로 대체하지 않는다. 원문의 선형 복구에는 debt smallness 가정이 없다.

그러나 이 M2 경로에는 현재 실제 global (U_0,V_0) 함수의 완전한 실행 evaluator가 없다. 고정된 원본은 이미 전체 nonlinear root·heat compensation·rapid modulation·복구 recipe를 가지고 있으므로 새 사용자 입력이 필요한 것은 아니다. 필요한 코딩은 그 실제 recipe를 derivative 및 적분이 가능한 완전한 함수 프로그램으로 연결하는 것이다. `globalU0`와 (X_v) 노드는 이를 숨긴 완료 certificate를 반환하지 않는다. 실제 다섯 total debts와 correction 계수는 미완료다.

### 실제 (I_{\rm mean})에서의 누락 반증

보존된 (I_{\rm mean}=[X_0,X_0e^5])에서 actual source는

\[
U_0=0,\quad M=\eta m_*,\quad
m_*=X_Re\left(4+\int_0^T e^s k(s)\,ds\right)>0.
\]

(2D\eta^2+d=L)이므로 (V_0=-m_*)가 정확하다. 따라서 (5.6)은

\[
\Omega_0=-\frac{m_*^2}{2X}\ne0
\]

가 된다. 현재 (n=1) cutoff와 bump는 이 구간 전에 끝나므로 (F_1=U_1=0)이지만

\[
\Pi_{1,X}=\frac{m_*^2}{4X^2}>0.
\]

이 구간의 실제 기여는

\[
\frac{4X_0}{m_*^2}\int_{I_{\rm mean}}\Pi_{1,X}\,dX
=1-e^{-5}\approx0.9932620530009146,
\qquad
\frac1{m_*^2}\int_{I_{\rm mean}}\frac{\Omega_0}{2}\,dX=-\frac54.
\]

첫 값은 (e^5)의 positive rational Taylor sum과 전체 geometric tail로 정확히 둘러싸고, 독립 검산은 (e^{-5})의 alternating series를 사용한다. 즉 global forcing을 0으로 두는 지름길은 **실제 소스에서 수치적으로도 반증된다**. 위 값은 total moment 자체가 아니라 두 total moment의 한 구간 기여이다.

## 6. 코드 API와 검증

공개 import 경로는 `navier/actual-background.mjs`다.

```js
const result = actualBackgroundConstruction({
  order: 1,
  radialDegree: 3,  // 1..6
  bits: 128        // 16..4096
});
```

반환 구조는 `jets`, `majorant`, `axisObservations`, `pointEnclosures`, `moments`, `verification`, `completed`, `remaining`이다. 전용 패널은 `axisObservations.samples`의 세 행, `pointEnclosures.samples`의 15개 실제 양의 core 관측 및 `moments.imeanOmissionControl.normalizedContributions`의 두 행을 사용한다. 모두 정확한 interval과 화면용 directed enclosure를 분리한다.

`evaluateBackgroundJetOracle`는 독립 알고리즘 검사용으로 보통 크기의 명시적 rational datum을 받을 수 있다. 반환 scope는 `EXTERNAL_NUMERICAL_ORACLE_FOR_ALGORITHM_TESTS_ONLY`이며 `sameProfileCertificate:false`다. 실제 source 관측 API는 그 oracle 입력을 받지 않는다.

저장소 루트에서 다음을 실행한다.

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-background.test.mjs
python research-ide/mathscope-m2/navier/tests/actual-background-independent.py \
  --output research-ide/mathscope-m2/navier/tests/actual-background-independent.json
```

이 작성 시점의 전용 결과는 Node **13/13**, 독립 Fraction **193/193**이다. Python 검산은 production의 normalized B.14/B.15와 별도로 **비정규화 원래 (n=0) PDE부터** leading 계수를 다시 생성한 후, (n=1)의 radial degree 3과 η derivative orders 0, 1, 2를 대조한다. 실제 압력 구간을 쓰는 세 값, 양의 core point의 구간 여유·정규화, 실제 (I_{\rm mean}) 기여도 별도로 독립 검산한다. omitted axial viscosity, omitted radial pressure shift, 위조한 source hash·interval·domain·완료 flag, 실제 양의 좌표를 0으로 바꾸는 변조 및 다음 차수 조기 생성을 차단한다.

테스트 통과는 이 문서에 설명한 알고리즘·유한 관측·상계의 범위이다. 전체 N4/N5, 임의 (N)의 실제 PDE residual, 새 Lean kernel 실행 또는 라이브 배포 검증을 뜻하지 않는다. 상위 bundle·worker·UI와 라이브 브라우저 검증은 별도의 root 통합·release evidence가 담당한다.
