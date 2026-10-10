# 같은 N3 계수의 모든 유한 차수 재귀와 완성 속도장의 C² 인증

## 1. 이 문서가 인증하는 대상

이 구현은 원래 N3 프로필에서 시작하여, 모든 양의 정수 차수에 대해 계수 방정식의 실제 피적분 함수, 수렴하는 Picard 연산자, 다섯 모멘트 보정 및 보정된 계수의 미분 상계를 생성하는 하나의 귀납 알고리즘을 제공한다. 그 알고리즘으로 선택한 고정된 cutoff 수열은 국소 유한한 실제 속도장을 정의한다. 다음 상계의 상수는 이름만 있는 가정이 아니라 유한한 양의 수식 그래프이다.

\[
 \|F-F_0\|_{C^2}+\|G-G_0\|_{C^2}\le 2M\varepsilon^2,
 \qquad \|b-b_0\|_{C^2}\le M_b\varepsilon^3,
 \qquad \|b\|_{C^2}\le \widehat M_b\varepsilon.
\]

API의 `FGDifference.constant`는 합 노름 대신 **각 성분·각 미분의 최대값**을 제어하므로, 각 성분에는 위 식의 `2` 없이 같은 `M`을 쓸 수 있다. 미분은 고정된 dyadic \(Q\)에 대한 보통의 느린 좌표 \(R,Z,T\) 미분이다. 공통 인증 영역은

\[
X\in[X_a/2,2X_b],\quad \eta\in[-1,1],\quad
s=q/Q\in[1/2,2],\quad 0<q\le1,\quad 0<Q\le1/2.
\]

여기서 \(T=0\)의 미분은 원래 매끄러운 연장에서 오는 한쪽 미분이다. 별도의 실제 leading field 생성기를 결속하여 이 **전체 확대 annulus**에서 \(F_0,G_0\)와 \(F,G\) 자체의 C² 상계도 제공한다.

인증 종류는 **정확한 함수 정의, 실행된 유리식 항등식, 양의 해석적 상계 및 잘 기초화된 귀납 증명**이다. 초거대 상수를 Float64로 평가한 전역 수치 표본도, 새 Lean 커널 증명도 아니다. 어떤 유한 개의 차수 검사가 무한 합과 같다고 주장하지 않는다. 유한 차수 1–4의 실행은 같은 일반 재귀의 회귀검사이고, 일반 차수 방정식은 `ν`를 미정수로 남긴 별도의 정확한 항등식으로 검사한다.

이 결과만으로 원문 Proposition 5.5 전체 또는 N5-06 전체를 완료했다고 하지 않는다. 원문 cutoff 선택에는 가중 stress 및 물리적 flat residual 조항도 있다. 이 모듈은 그 두 조항의 모든 차수 상계를 선택하지 않았다. 공통 \(q_\star\), 실제 전역 pulse covariance 및 (7.30)의 완성 여부도 소비자에서 별도로 인증해야 한다. 해당 플래그는 모두 `false`이다.

## 2. 원문과 소스 식별

주 원문은 [Navier–Stokes 원문 PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)의 (5.4)–(5.6), Lemma 5.2, (5.37), (5.40), (5.42), (5.45)–(5.46), (6.1) 및 (6.6)이다. 특히 인쇄 쪽 60–61의 cutoff 퍼텐셜과 62–63의 좌표 변환을 직접 따른다. PDF SHA256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다.

고정 프로필은 `same-profile-2026-10-10.3`, parameter expression SHA256은 `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`이다. 원래 assembly receipt의 SHA256은 `184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd`이다. `source-profile-data.mjs`에 이 원문 경로와 정확한 양의 파라미터 정의가 함께 고정되어 있다.

\[
h=\exp[-8002(\exp(1048576)+10)]>0,
\quad A=\tfrac12+h,\quad D=\tfrac12-h,\quad
d=1-\eta^2,\quad L=1-2h\eta^2.
\]

`h`, `Λ`, `ρ`, 실제 C12의 \(R,N\), \(X_a,X_b\) 및 모든 모멘트 행 배율을 원래 양의 수식으로 유지한다. 원래 실제 nonlinear `Φ` 대신 비교 함수를 쓰거나, 실제 누적 모멘트를 0으로 대체하거나, 다른 \(h\)로 계산하는 입력은 없다. \(X_b\)에 포함된 terminal wait와 적분 역시 실제 식이다.

기호 혼동을 피하기 위해 코드의 `F_n`은 **각속도 프로필** `φ_n/C`이고, `M_n`은 **Stokes stream** `∫_0^X U_n\,dX`이다. 원문 (5.45)의 stream 계수에 생기는 추가항을 각속도 `F_n`에 적용하면 잘못된 식이 된다. 정규화 각속도 크기는 \(E_n=\sqrt{2X}F_n\)이다.

## 3. 차수마다 서로 다른 두 실제 시스템

`prepareActualOrderInduction`은 차수 0에 이미 연결된 실제 nonlinear core, B.26/B.34, B.8, C12, I1, I2 및 원래 heat leading field를 소비한다. 그 뒤 각 \(n\ge1\)에서 다음 두 시스템을 **둘 다** 정의한다.

| 시스템 | 실제 lower source | 반경 | 용도 |
|---|---|---|---|
| `actual` | 이전에 다섯 모멘트까지 완성한 계수의 공통 내부 cutoff 제한 | \(0\le X\le a^2=X_a e^{t_1/16}\) | 원래 보정 계수와 실제 cutoff collar |
| `auxiliary` | 이전에 별도로 생성한 natural auxiliary 해 | \(\lvert\Lambda X\rvert\le R_n\) | 작은 내부 영역의 복소 반경 Cauchy 상계 |

보조 반경은 \(R_0=8\), \(R_n=6+2^{1-n}\)이다. 따라서 \(R_0-R_1=1\), \(R_{n-1}-R_n=2^{1-n}>0\)이며 극한 6은 실제 core 끝 \(\Lambda X_a=4\)보다 크다. 보조 시스템을 만들지 않은 채 그 해의 노름만 있다고 선언하지 않는다. 매 차수의 `auxiliary.system`과 그 lower operands, forcing, 해 노름 및 수렴 tail이 실제로 생성된다.

원래 \(B_\rho\) 반경 20에서 `|Y|≤8`, 실제 실수 `η` 구간으로부터의 거리 `ρ/4`는 남는 분모가 \(1-8/20-1/4=7/20>0\)이다. disk 5 전용 `1/2` 상계를 disk 8에 재사용하지 않는다. `g=exp(Λ∫ζ)/CSelected`에도 같은 tube에서 `|ζ|≤64/σ_*²`와 경로 길이 2를 적용하여 실제 상계 `exp(128Λ/σ_*²)/CSelected`를 생성한다.

모든 두 시스템의 일치는 **\(0\le X\le X_a\)에만** 주장한다. 이 영역에서는 이전 차수의 실제 cutoff가 모두 1이고 Ipos 보정은 지지 밖이다. 같은 leading source, 같은 0축 datum, 같은 방정식 및 유일성으로 귀납적으로 일치한다. cutoff가 변하는 영역에서는 원래의 매끄러운 실제 source를 그대로 사용한다. C∞ cutoff collar의 복소 반경 해석성을 가정하지 않는다.

해석적 `η` 폭은 각 차수마다

\[
\delta_n=\frac{\delta}{8\,256^n}>0,
\qquad \text{source strip}=4\delta_n
\]

로 줄인다. 모든 이전 보조 strip은 다음 strip의 적어도 256배이다. 원래 actual \(n=1\) 해는 보조 \(n=1\)보다 넓은 strip을 갖는다. 다음 차수에서는 **작은 보조 strip**을 공통 이전 폭으로 사용한다. 덕분에 보조 core 상계의 미분을 더 넓은 actual 폭으로 잘못 평가하지 않는다.

## 4. 실제 비선형 forcing와 임의 차수의 방정식

\[
Z_a f=\frac{2\eta(af-Xf_X)+d f_\eta}{L},
\qquad
T_a f=\frac{-af+D\eta f_\eta+Xf_X}{L},
\qquad \nu_n=2nh.
\]

코드는 모든 ordered pair를 생성한다. \(i+j=n\)에서 \(i,j>0\)인 항은 forcing에 들어가고, \((0,n),(n,0)\)는 실제 leading coefficient를 가진 선형 연산자에 남는다. `Ω_{n-1}/X`에는 `i+j=n-1`의 양 끝을 포함한 모든 쌍, 시간항, 반경 점성 및 \(n-2\) 차수의 axial 점성을 포함한다.

\[
\begin{aligned}
p_n^{\rm known}
 &=\sum_{i+j=n,\ i,j>0}F_iF_j-\tfrac12\Omega_{n-1}/X,\\
H_n^\theta
 &=\sum_{i+j=n,\ i,j>0}
 [v_i(XF_{j,X}+F_j)+U_iZ_{b+2jh}F_j]
 -Z_{b+2(n-1)h-D}Z_{b+2(n-1)h}F_{n-1},\\
H_n^z
 &=\sum_{i+j=n,\ i,j>0}
 [Xv_iU_{j,X}+U_iZ_{c+2jh}U_j]
 -Z_{c+2(n-1)h-D}Z_{c+2(n-1)h}U_{n-1},
\end{aligned}
\]

여기서 \(b=-A-1/2\), \(c=-A\), \(v_i=V_i/X\)이다. 6차원 forcing은

\[
(0,0,0,2\xi p_n^{\rm known},2H_n^\theta,
 2H_n^z-4\eta Xp_n^{\rm known}/L)
\]

이며 `X=ξ²`이다. 미지수는 \(F_n,U_n,\operatorname{Avg}(U_n)-U_n,\Pi_n,\partial_\xi F_n,\partial_\xi U_n\), 대각 행렬은 `diag(0,0,2,0,3,1)`이다.

`actualInductionLinearKernel`의 동일한 행렬 본문을 actual/auxiliary 생성기가 직접 호출한다. 별도 `verifyActualInductionParametricKernel`은 `ν`를 미정 실수로 남겨 6개 원래 PDE 항등식의 분자를 BigInt 유리 다항식으로 정확히 0화한다. `ν=2nh`를 적용하는 모든 양의 정수 \(n\)이 이 하나의 항등식을 소비한다. 검증용 임의 슬롯은 선형 연산자 항등식에만 쓰며 실제 source 생성기의 피연산자를 바꾸지 않는다. 코드가 생성한 실제 n=1–4의 두 시스템도 별도로 같은 6개 PDE에 대입한다.

차수가 증가하면 계수에 들어가는 `|a|`도 증가한다. 소스 노름은 \(E_n=4+2nh\)를 그대로 사용한다. n=2에서만 충분했던 `|a|≤3`, 고정된 6차 또는 12차 미분 흡수 상수를 일반 차수로 외삽하지 않는다.

## 5. 모든 양의 source norm의 실제 본문

`innerNorm`은 모든 lower field의 실제 반경 0–2차 상계를 만든다. auxiliary에는 실제 큰 원판과 작은 원판의 양의 차 \(g\)를 이용한 `2Λ²M/g²`를 사용한다. actual에는 다음 두 영역의 최대를 사용한다.

\[
 B_{\rm core}=2\Lambda^2 M_{\rm aux},
 \qquad B_{\rm collar}=64C_i M_i\Lambda^2/\delta_i.
\]

첫째는 실제 auxiliary 해와 일치하는 core의 Cauchy 상계이다. 둘째는 원래 6차원 방정식, `ξ²=X≥1/Λ`, 이전 해의 `η` Cauchy 미분으로 얻는다. 실제 cutoff 곱에는 `1+2κ_1+κ_2`를 곱한다. `κ_1,κ_2`는 원래 square seed와 `log(X/Xa)/(t1/64)`의 정확한 미분에서 생성된다.

반경 평균은 모든 \(r\)차 미분에서 `∫_0^1 t^r dt=1/(r+1)`를 준다. 정규화된 \(V_i/X\)에는 그 평균의 **한 `η` 미분**도 들어가므로 별도의 미분 손실을 반영한다. 코드는 보수적인

\[
 V_i^{\rm norm}\le
 128(1+2ih)H_i/\delta_{\rm previous},
\quad e_1=16/\delta_{\rm previous},
\quad e_2=2e_1^2
\]

를 사용한다. `Z`, `DXZ`, `DEZ`, `ZZ`, 시간항의 계수를 항별 합산하고, 이 값으로 실제 `Ω`, pressure-known, 두 forcing의 상계를 계산한다. `|η|≤33/32`, `|d|≤3`, `|1/L|≤2`, `|X|,|ξ|≤1`에서 실제 행렬은

\[
512(1+E_n)(1+H_0+V_0+\operatorname{ZBound}(H_0))
\]

로 제어된다. \(C_n\)은 이 행렬 상계와 6개 forcing 상계의 합에 2를 곱한 **실제 수식**이다. 양의 해 노름과 꼬리는

\[
 M_n=\exp\!\left(\frac{9C_n^2a_n^2}{2\delta_n}\right),
\quad K\ge\left\lceil\frac{72C_n^2a_n^2}{\delta_n}\right\rceil,
\quad \mathrm{tail}(K)\le\frac{4^{-K}}3
\]

이다. 여기 \(a_n^2\)는 해당 actual 또는 auxiliary 방정식의 반경 영역이며, 시간 cutoff \(c_n\)와 다르다. `η` m차에는 `m!(2/δ_n)^m`를 곱한다. 표시된 유한 Picard 항을 정확한 해라고 하지 않으며, 양의 tail을 지우지 않는다.

## 6. 원래 전역 보정과 n+1 차수의 엄격한 게이트

각 actual raw field를 `η`에 독립적인 원래 radial cutoff로 자른다. 전역 모멘트의 비선형 lower source에는 그 **전체 보정된 lower tuple**을 넣는다. 내부 표본만으로 전역 적분을 대체하지 않는다. `Ω`의 Ipos 뒤쪽 기여도 지우지 않는다.

다섯 실제 incoming 값은 적분 본문을 가진 함수이다. 코드가 원래 continuous Ipos 행렬의 inverse, `λ` 및 `ef`의 실제 양의 배율을 적용하여 `α,β`를 계산한다. 실제 두 \(U\) bump와 세 \(F\) bump의 보정 모멘트를 더한 **다섯 실제 residual body 전부**를 `completeOrder` 안에서 정확한 유리식으로 0화한다. 이 검사가 끝나기 전에는 `completed=true`가 되지 않으며 다음 차수 source 생성이 금지된다. 단순한 universal 행렬 identity 또는 나중에 실행할 테스트는 완료를 대신하지 않는다.

이 보정 뒤 \(M_n=\int_0^XU_n\), `Π_n` 및 `V_n`를 원래 앞쪽 primitive로 복원한다. 동일한 모멘트 0 덕분에 원래 지지 끝 뒤에서는 정확히 0인 매끄러운 가지로 바뀐다. `coefficientSupport`는 실제 source endpoint ordering과 함수 본문을 따라 그 exterior를 검사한다. 단순히 localized integrand가 있다는 이유로 그 적분을 0이라고 결론내리는 음성 대조는 실패해야 한다.

이 속도/압력 계수의 지지는 \(X\le X_+=eX_v\)에 들어간다. \(n=1\) stress의 angular 지지는 \(X_b\)까지 갈 수 있으므로 이 지지 주장을 stress에 옮기지 않는다. 이 C² 소비자는 `T_n` 또는 stress 지지의 미증명 boolean을 전제로 사용하지 않는다.

## 7. 모든 유한 미분의 보정 계수 노름

`attachActualInductionNorms`는 고정된 `n,m`마다 실제 leading mixed-jet 생성기에 충분한 직사각형을 요청한다. 현재 정의는 반경 `m+2n+4`, `η` `2m+6n+8`이다. 요청은 일반 미분 재귀이고 fixed-12 흡수가 아니다. 영역이 다른 `F0inner`, `F0active`와 전역 `U0`를 구분한다.

보정된 positive-order의 임의 반경 \(r\ge2\) 노름은 다음 잘 기초화된 순서로 계산한다.

1. \(X\le1/\Lambda\): 생성된 auxiliary 해의 실제 원판에서 Cauchy 미분을 적용한다.
2. \(X\ge1/\Lambda\): 원래 angular/axial 방정식을 `2X∂_X²`에 대해 풀고 \(r-2\)번 미분한다. 오른쪽의 같은 차수 미분은 항상 반경 차수가 더 낮다. 모든 lower coefficient 차수는 이미 구성되어 있다.
3. 실제 radial cutoff의 Bell 다항식, 모든 binomial Leibniz 항, Ipos inverse, 양의 source 배율 및 radial average를 합성한다.

따라서 귀납 순서는 `(계수 차수, 반경 미분 차수)`이다. `η` 미분은 매 단계 앞서 확보한 실제 strip 및 leading finite-jet 요청을 소비한다. top derivative 또는 알 수 없는 derivative를 0으로 치환하지 않는다. 양의 실제 상수가 원래 \(R\)보다 커져도 새 \(R,N\)를 선택하지 않는다. 그 큰 값은 cutoff 선택식에 그대로 전달한다.

전역 모멘트는 `η` 독립적 구간에서 실제 integrand를 미분한 뒤 \(X_+\) 길이 상계로 제어한다. continuous Ipos inverse의 노름 `1024`와 `2^24`, 원래 `λ^{-1},ef^{-1}`를 보존한다. 원래 bump `σ'_2`의 모든 필요한 새 미분과 `√X` chain rule을 실제로 생성한다. 수식 노드들은 유한한 합, 곱, 정확한 양의 역수, 지수, 계승, 적분 및 실제 생성된 연산자의 수렴 한계이다. 외부에서 `bound`, `incoming`, `coefficient`, `PASS`를 주입하는 입력은 없다.

## 8. 임의 미분의 원래 cutoff와 고정된 canonical 수열

원래 square seed `a_2(t)=exp(-1/t²)`와 선택된 time cutoff의 linear seed `a_1(t)=exp(-1/t)`를 구분한다. \(z=1/t\)일 때

\[
\frac{d^k}{dt^k}a_p(t)=e^{-z^p}P_k(z),\qquad
P_{k+1}=p z^{p+1}P_k-z^2P'_k.
\]

부호를 가진 모든 다항식 계수를 BigInt로 생성한다. 새 degree `j`마다 `sup_{z≥0}z^j e^{-z^p}`를 `max(1,ceil(j/p))^max(1,ceil(j/p))`로 제어한다. 예전 12차의 최대 degree를 재사용하지 않는다. `a_p(t)+a_p(1-t)`의 양의 역수 상계는 \(p=2\)에서 64, \(p=1\)에서 16이다. 실제 ordinary reciprocal 및 Leibniz 재귀로 smooth step의 모든 요청된 미분 상계가 나온다. 이 식은 양쪽 flat extension의 jets와 일치한다.

시간 cutoff는 `χ(s)=1-σ_1(2s-1)`이며 \(s\le1/2\)에서 1, \(s\ge1\)에서 0이다. `D=s∂_s`의 미분은 실제 Stirling 수로 ordinary derivative에서 변환한다. 원래 퍼텐셜의 추가항 `sχ'(s)`에는 **한 차수 더 높은** `D^{m+1}χ`가 필요하므로 그 미분도 항상 생성한다.

차수 \(n\)의 normalized coefficient/stream jets와 이 Euler 다항식을 곱한 실제 최대 상계를 \(B_{n,m}\ge1\)라 하자. 각 cutoff는 반드시 **그 차수 자체의** 요청 `throughOrder=n, derivativeOrder=n`으로 고정한다.

\[
\log c_0=0,\qquad
\log c_n=\max\!\left(
\log c_{n-1}+\log2,
\max_{0\le m\le n}\frac{n\log2+\log B_{n,m}}{nh}
\right).
\]

나중에 더 높은 차수를 요청해도 앞의 \(c_1,c_2,\ldots\)는 변하지 않는다. Node 회귀검사는 실제 \(X_b\) 적분을 포함한 의미적 수식 fingerprint를 order 2와 order 4 요청에서 비교한다. 단순히 같은 배열 길이를 확인하는 검사가 아니다.

모든 \(q>0\)에 대해 \(c_n\ge2^n\)이므로 \(q\)가 0에서 떨어진 compact에서는 전체 수열과 모든 미분이 국소 유한하다. 활성구간 \(q\le1/c_n\)에서는

\[
B_{n,m}q^{nh}\le2^{-n},\qquad
|D_q^e\partial_X^r\partial_\eta^s[\chi(c_nq)q^{2nh}f_n]|\le2^{-n}q^{nh}
\]

이고 \(q\ge1/c_n\)에서는 cutoff와 모든 미분이 정확히 0이다. 소스 값이나 미분을 caller가 주는 조건부 selector가 아니다.

고정된 미분 차수 \(m\)에 대해 \(J=\max(3,m)\)로 잡는다. \(n<J\)는 실제 유한 block으로 남겨두고, \(n\ge J\)만

\[
\sum_{n\ge J}2^{-n}q^{nh}\le2^{1-J}q^{Jh}
\]

로 합산한다. 특히 C²에서는 **실제 n=1과 n=2를 모두** 남긴다. n=2의 큰 상수를 생략한 채 꼬리 시작을 \(q^{3h}\)로 높이지 않는다. 원래 \(q^A u_r\)에는 \(q^h\)가 더 있으므로 \(q^{3h}\) 개선이 나타난다.

추후 가중 stress/물리 residual 조항에서 더 큰 cutoff가 필요하면 같은 monotone doubling 조건 아래 \(c_n\)를 더 크게 선택해도 위 부등식과 퍼텐셜 식은 유지된다. 그러나 그런 추가 selector를 이미 계산했다고 표기하지 않는다. 현재 고정 sequence는 **정규화 속도/압력 조항용**이라는 플래그를 보존한다.

## 9. 실제 퍼텐셜의 추가항과 느린 좌표 C² 변환

원래 stream 계수는 \(S_n=q^{1-A+2nh}M_n(X,\eta)\)이다. 물리적 \(z\) 미분에 대해

\[
q_z=2\eta q^{1-D}/L,\quad
X_z=-2\eta Xq^{-D}/L,\quad
\eta_z=dq^{-D}/L.
\]

이 식과 \(A+D=1\), \(M_{n,X}=U_n\)를 직접 대입하면 (5.45)의 radial bracket은

\[
\chi(c_nq)V_n-\frac{2\eta}{L}(c_nq)\chi'(c_nq)M_n.
\]

실제 함수 root가 연결된 parametric identity 검사에서 추가항을 생략하면 실패한다. divergence는 같은 Stokes potential의 두 물리적 혼합미분 상쇄이며 cutoff transition을 제외하지 않는다.

느린 좌표는 \(T=s(1-\eta^2)\), \(Z=s^D\eta\), \(X=R^2/(2s)\)이다. `(q∂q, ∂X, ∂η)`에서의 세 미분 row는

\[
\begin{aligned}
\partial_R&=(0,\sqrt{2X/s},0),\\
\partial_Z&=s^{-D}L^{-1}(2\eta,-2\eta X,d),\\
\partial_T&=(sL)^{-1}(1,-X,-D\eta).
\end{aligned}
\]

계수의 1차 profile 미분도 실제로 생성한다. 각 row의 절댓값 합을 \(A_0\), 각 profile 방향으로 미분한 row의 절댓값 합을 \(B_0\)로 제어하면

\[
\partial_i\partial_j f
=\sum_{k,l}a_{ik}a_{jl}f_{kl}
+\sum_{k,l}a_{ik}(\partial_k a_{jl})f_l
\]

이므로 2차 연산자 상계는 \(A_0^2+A_0B_0\)이다. Jacobian의 미분을 버린 \(A_0^2\)만 사용하지 않는다. \(s^{-A-1/2}/\sqrt{2X}\), \(s^{-A}\), \(s^{-1/2}\) 등의 ordinary/Euler 미분에도 모든 binomial 곱 항을 포함한다. 원래 \(h>0\), \(A<1\), \(D<1/2\)와 `s∈[1/2,2]`만 사용한다.

전체 leading `F0`의 절대 상계는 `actualLeadingEnlargedC2`에서 `[Xa/2,Xplus]`의 실제 active-field norm, `[Xa,Xb]`의 원래 `R^70` mixed norm, `[Xb,2Xb]`의 실제 Gamma heat 식을 합한 것이다. 마지막 영역에서는 `F0=Aext X^(-1-h) H(2d/X)`의 prefactor 미분과 모든 heat chain 항을 유지한다. 그 raw physical `X/η` C² 상계에도 같은 느린 Jacobian과 `s^{-A-1/2}` multiplier를 적용한다. `F0active`의 영역을 전체 annulus로 바꾸어 부르지 않는다.

## 10. 실제 q 함수와 원래 dyadic band API

`actualBackgroundFiniteQuery`는 지정한 양의 유리수 `q` 또는 내부 canonical anchor에서 필요한 **모든** 실제 계수를 합한다. 원래 `χ`의 공유 함수는 본문과 AD materializer를 갖고 있다. `q^(2nh)`는 실제 `exp(2nh log q)`로 남으며 underflow로 0이 되지 않는다. 필요한 차수가 준비되지 않았으면 `RESOURCE_LIMIT`이고 완료 receipt가 아니다.

phase/ODE가 `q` 미분을 필요로 하면 `actualBackgroundSymbolicPrefix`를 사용한다. `q`는 고정 노드가 아니라 자유 좌표이다. 모든 root는 실제 finite body를 갖고, 요청한 `(q∂q,∂X,∂η)` jets도 실제 AD로 생성된다.

원래 dyadic 규약에는 다음 내부 선택을 사용한다.

\[
\ell=\left\lceil\frac{\log(4c_a)}{\log2}\right\rceil,
\quad Q=2^{-\ell},\quad
\frac1{8c_a}\le Q\le\frac1{4c_a}.
\]

`q∈[Q/2,2Q]`에서 \(n\le a\)는 `χ=1`, \(n\ge a+4\)는 `χ=0`과 모든 cutoff jets가 0이다. 따라서 \(a+1,a+2,a+3\)의 실제 항을 남겨야 한다. default anchor 1에서는 실제 n=1–4를 생성한다. `a+3`을 생략하면 dyadic rounding 끝에서 활성 항을 빠뜨릴 수 있다. 전용 음성 대조가 이 경우를 검출한다.

```js
const cert = prepareActualCompletedBackgroundC2({order: 4});
const family = actualBackgroundSymbolicPrefix(cert, {
  anchorOrder: 1,
  derivativeOrder: 2,
  dyadicBand: true
});
// family.qVariable: 실제 자유 q 좌표
// family.Q, family.ell: 정확한 양의 source 수식/정수
// family.rows: 실제 n=1,2,3,4
// family.exactInactiveTail.from: 5
// family.roots와 family.jets: 같은 실제 함수 본문 및 AD
```

기존 비dyadic \(Q=1/(4c_a)\) 모드도 명시적으로 구분한다. 그때만 필요한 추가 prefix가 \(a+2\), inactive tail 시작이 \(a+3\)이다. 이 한 compact band의 실제 함수 실행을 모든 band의 수치 실행으로 부르지 않으며 `thisFiniteBandEqualsAllBands:false`를 보존한다.

모든 양의 정수에서 같은 family를 정의하는 공용 실행 API는 `actualBackgroundDyadicPrefix(cert,{ellExact:'4',derivativeOrder:2})`이다. 보수적으로 실제 n=1부터 ell까지의 함수를 합한다. q≥2^(-ell-1), c_n≥2^n이므로 n≥ell+1은 전부 cutoff와 모든 미분이 0이라는 정확한 증명이 있다. `ellExact`는 큰 정수 문자열 또는 BigInt로 보존하며, 필요한 prefix가 없으면 안전한 정수로 변환하기 전에 `RESOURCE_LIMIT`을 반환한다. 이 정의에는 미정 계수나 사용자 상계가 없다. 각 유한 ell에서 동일한 귀납 계수 생성기를 유한 횟수 호출하는 알고리즘이다. 원래 초거대 anchor label에서 1부터 ell까지를 실제 열거하지 않아도 되는 이유는 앞의 별도 cutoff 비교 증명이 같은 합을 짧게 줄이기 때문이다. 두 API가 서로 다른 배경장을 선택하는 것은 아니다.

## 11. 경계, 자원, 인증 소비 계약

완료 객체는 live 실제 생성기에서만 얻을 수 있다. 복사한 PASS 플래그나 바꾼 canonical rows는 인증되지 않는다. 원래 node prefix와 함수 정의, 실제 source records, norm rows, chart proof의 변경도 검사한다. graph는 후속 AD/실제 q query를 위해 append-only로 확장될 수 있다.

원래 square/linear cutoff의 상수 exterior와 모든 유한 endpoint jets는 실제 materializer에서도 검사한다. 비활성 branch의 `1/0`을 먼저 평가하지 않으며, source 식의 flat 연장에 따라 정확히 0 또는 1을 반환한다.

모든 요청은 유한 정수 order, node budget, derivative budget 및 arithmetic operation budget을 갖는다. 알고리즘은 임의 유한 차수에 대한 같은 재귀이지만 어떤 특정 실행도 무한 자원을 약속하지 않는다. 자원이 모자라면 명시적으로 `RESOURCE_LIMIT`을 반환하며, 미계산 항이나 derivative를 0으로 바꾸지 않는다. 정확한 함수 표현의 존재/상계와 거대한 truncation index의 수치 materialization은 서로 다른 결과다.

## 12. 재현 검사와 잔여 범위

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-residual-order-induction.test.mjs research-ide/mathscope-m2/navier/tests/actual-residual-order-induction-background.test.mjs
node research-ide/mathscope-m2/navier/tests/actual-residual-order-induction-fixture.mjs | python3 research-ide/mathscope-m2/navier/tests/actual-residual-order-induction-independent.py
```

독립 Python은 JavaScript가 실제 생성한 일반 `ν` 행렬을 내보내 받아 원래 PDE식을 별도로 계산한다. 유리수 슬롯은 universal 연산자 항등식의 검사 변수이며 실제 N3 field 표본이라는 뜻이 아니다. 원래 실제 source의 생성/수렴/모멘트 gate는 Node의 실제 함수 그래프에서 따로 실행된다. Python은 부호를 가진 seed 재귀, 모든 새 degree의 전역 monomial 상계, reciprocal, Stirling, `m+1` cutoff derivative, 자연 Cauchy 상계, ordered source indices, Jacobian의 정확한 inverse, 2차 budget, finite n2 보존 및 dyadic membership을 독립 검산한다.

최종 검사 수, 각 파일 SHA256, 실제 source dependency 및 실행 명령은 `evidence/actual-residual-order-induction.json`에 봉인한다. 모든 source와 scope flag를 보존한다. 이 인증이 공급하는 것은 실제 완성 속도장의 C² 함수/노름 전제이다. N5-06의 원래 전체 covariance family, 공통 q 임계값 및 가중 stress/flat residual의 별도 미완료를 이 전제로 덮지 않는다.
