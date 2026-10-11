# 실제 centered pulse 구간의 독립 검토

## 검토와 판정

2026-10-11에 두 새 모듈 `actual-centered-pulse-enclosure-kernel.mjs`, `actual-centered-pulse-enclosure.mjs`를 읽고, 원래 작은 q terminal covariance의 정의와 실제 source attempt1의 JSON·log·process를 대조했다. 현재 60개 literal import의 SHA256은 모두 실행 기록과 일치한다. 이 검토에서 추가 source process를 실행하거나 원래 source 및 numerical code를 수정하지 않았다.

**명시된 한 원래 terminal 대표점과 pulse 중심에서, 실제 양수 척도를 남긴 normalized mass/H/weight 및 scaled weighted pulse 값의 구간 추정에 수학적 결함을 찾지 못했다.** 이 판정은 전체 G-NUM, unscaled 고상대정밀 값, 시간 전체 구간 또는 미분·curl enclosure의 완료를 뜻하지 않는다.

## 1. source smallness와 centered 해

실제 선택식은 `ell=ceil(max(8,Sminimum,(64/h)^2))+8`이고 Sminimum은 B^512를 포함한다. 따라서 S=ell²≥B^1024이다. 이 결론은 큰 정수를 binary64로 계산하는 대신 원래 maximum/ceiling의 순서를 사용한다. B≥2^128 및 B≥Renv^4096, 원래 양수 h, kappa=Renv^-10을 유지한다.

원래 식의 곡률

\[
g=\frac{3\lambda_0u^2}{(1+u^2)^{3/2}}
\]

은 u≥2 및 원래 lambda0 하·상계에서 B^-1<g<B를 만족한다. 원래 palette는 S/B<Ls<S를 주므로 gLs>B^1022이다. reference damping을 생략하지 않은 rho′, 중앙 rho=0 및 rho′(v0)=−g/Ls의 별도 항등식도 확인했다. 양의 제곱근의 제곱 관계는 유리식 검증과 분리되어 있다.

원래 invariant cone는 w_plus>0와 |w_minus/w_plus|≤B^260/S를 제공한다. 실제 `M11=E11-(d-dref)`, `M12=E12`에서

\[
|\partial_v\log w_+|\le3B^{256}/S.
\]

따라서 a_sign=w_plus_sign(Ls/2)>0를 그대로 보존하면서, x=(v−Ls/2)sqrt(g/Ls)에 대한 중심 비율의 log-Lipschitz 계수는 beta<B^-254이다. a_sign이나 전체 Volterra 해를 1로 놓지 않는다.

## 2. Gaussian core와 전체 tail

`eta_time=1/2+v/Ls`, `alpha=u²/(1+u²)`로 두면 코드의 정규화 곡률

\[
q(\eta_{time})=\frac{\eta_{time}}3
\left[(1+\alpha(\eta_{time}^2-1))^{-3/2}+2\right]
\]

은 [1/2,3/2]에서 1/3≤q≤5 및 |q′|<100을 만족한다. q(1)=1에서 적분하면 P²≤exp(−x²/3)이고 중앙 |x|≤64에서

\[
|\log(P^2)+x^2|\le \frac{100|x|^3}{3\sqrt{gL_s}}
\]

이다. 이 core는 원래 ψ plateau 안에 들어간다. 중심 amplitude의 log 비율과 r=w_minus/w_plus를 포함한 integrand의 편차를 `8*combinedLog+6*|r|`로 상계하고 길이 128에 적분하는 계산은 충분히 보수적이다.

core 밖에서는 beta≤1과 |x|≥64>12를 사용해

\[
P^2(w_+/a)^2(1+r)^2\le4e^{-x^2/6}
\]

를 얻는다. 양쪽 tail의 `24/64*exp(-64²/6)`와 reference Gaussian의 `exp(-64²)/64` 상계는 정확하다. 원래 유한 시간 적분을 전체 실수선 Gaussian으로 바꿀 때 생기는 두 tail과 ψ의 바깥 부분이 이 예산에 포함된다. e>2에서 얻은 양의 유리수 상한을 사용하므로 작은 비영 remainder가 0으로 사라지지 않는다. 전체 mass 오차 2^-640 및 component/column 오차 2^-8192의 여유를 확인했다.

## 3. 원래 H, target 및 척도의 상쇄

선택점은 실제 `X=Xb*exp(-1/4), eta=0, s=1`이다. 원래 full moment를 닫은 U/M/V의 support와 terminal heat를 유지하므로 그 주변에서 G_R=0이다. F>0와 원래 음의 R F_R로부터 N=(-1,0), K=(0,-1)을 얻는다. 원래 backward target factor의 axial 성분은 eta=0에서 0이며 Ttheta>0이다. 이 해석적 결론은 원래 target·normal root를 그래프에서 덮어쓰는 방식으로 얻지 않았다.

각 sign에 대해 H_sign=a_sign² Htilde_sign, ytilde_sign=a_sign² y_sign을 쓰면 H*y=T와 양수 제곱근의 곱 법칙은

\[
\sqrt{y_{sign}}\,t_{sign}
=\sqrt{\widetilde y_{sign}}\,(t_{sign}/a_{sign})
\]

를 준다. a_sign>0 조건이 필수이며 모듈에 보존되어 있다. 실제 source 검사에서는 같은 Volterra system과 중앙 t=B(a,b), 실제 H 및 역행렬 y의 root를 결속한다.

원래 Haar와 cutoff는

\[
\mathrm{haar}=\tfrac12D_g c_i\int\chi^2,
\quad c_iL_s=2r_0,\quad \int\chi^2=r_0(1/2+I_\sigma)
\]

이다. 따라서 mass/(a²r0²/sqrt(gLs))의 중심값은 `Dg*(1/2+I_sigma)*sqrt(pi)`이다. Haar의 1/2을 중복 적용하거나 transverse 질량을 1로 정규화하지 않는다.

같은 target에 대한 C 행렬의 중심은 [[1,1],[-1,1]]이고 `C*(mass_sign*y_sign/tau)=(1,0)`이다. 각 sign의 실제 mass가 같은 구간 안에 들어가는 사실만 사용하며 두 mass를 동일한 실수로 선언하지 않는다. 독립 interval 곱·역수는 이 차이를 안전하게 포함한다. z covariance와 signed tangent의 부호도 원래 K=(0,-1), sign 규칙과 일치한다.

## 4. Directed 수치 계산과 실제 실행

sqrt(pi)는 Machin의 두 alternating rational series, 첫 누락항과 양의 제곱근 외향 연산으로 계산한다. 원래 sigma² 적분은 기존 실제 cutoff의 엄밀 finite-cell 및 endpoint-tail 경계를 소비한다. 모든 division/sqrt의 구간은 0과 분리되고, tiny analytic radius는 최소 외향 dyadic 오차로 올림된다. 마지막 각 output width를 요청한 정확한 tolerance와 비교한다.

| 증거 | 독립 확인 |
|---|---|
| source attempt1 | 11/11 PASS, 내부 check 7개, 관측 return code 0 |
| 시간 | source 내부 약 57.967초, wrapper 58.299957083초 |
| peak RSS | 2,986,721,280 bytes |
| 현재 import | 60개 모두 실행 SHA와 일치 |
| 원래 graph SHA256 | `8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a` |
| 새 graph | 245,828 nodes, canonical 10,116,561 bytes |
| 새 graph SHA256 | `bfd72c11e7e2e854183de2a30294b9f6e93c1b956d7045a76c43c6e7a48e3f75` |
| source JSON SHA256 | `bec3cdbd2c10429e5addfb02f594171a573c9429b99755402c70cf37bdb4a34d` |
| log SHA256 | `88a606068e52b5d07c4c4481a4a6405b1b3874f341f36d6e6e17e25be1a4576d` |
| process SHA256 | `a79bccc78132a81002a930f4876008b24ebd28fb6925b1e4bfd54fb20470a883` |

원래 h, G, H, a_sign, tau 및 geometry 척도는 원본 expression으로 남는다. 숫자로 보고하는 것은 명시된 normalized coefficient이며, absolute H·weight의 모든 양수 척도가 평가된 것은 아니다. `wholeGNUMComplete`, `allSourceLabelsCovered`, `slowOrFastPulseJetsNumericallyEnclosed`, `actualFullCurlNumericalEnclosure`, `workerExecution`, `browserExecution`, `m3MayStart`의 false 범위를 유지하는 것이 정확하다.
