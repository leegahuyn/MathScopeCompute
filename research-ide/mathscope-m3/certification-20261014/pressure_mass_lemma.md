# 실제 retained A.21 압력의 양의 측도 mass 및 holomorphy

`pressure_mass.py --output DIR`는 원본 155개 producer capture와 전체 3,892,594개 node stream을 검증한다. 이후 fixed registry의 **실제 `core.P0`**에 대해 twelve-stage integrands, 모든 endpoint amplitudes, Qb/Qp wait, 전체 initial prefix와 infinite terminal tail을 독립적으로 작성한 식과 맞춘다. 서로 다른 적분 binder는 alpha-equivalence로 비교하지만 계수, stage, endpoint, primitive 또는 tail은 생략하지 않는다. 일치하지 않는 식이나 검토되지 않은 operation이 있으면 증명 artifact를 내지 않고 실패한다.

아래 증명은 `actual-global-source-outer.mjs`와 `actual-continuation-exact-core.mjs`의 literal pressure formula에 대한 고전적 수학 증명이다. 기존 PASS, 숫자 샘플, quadrature, rootRadius label은 사용하지 않는다. 새 Lean kernel 실행을 뜻하지 않는다.

## 1. 실제 초기 amplitude와 범위

고정된 source parameters는

\[
 T=e^{2^{20}}+10>128,\quad
 h=e^{-8002T},\quad\lambda=e^{-1000T},\quad
 \rho_o=h/256,\quad K=P_*^2.
\]

`e>2`에서 `0<h<2^-200<1/16`, 그리고 **`0<h<lambda<1`**이다. 따라서 `0<rho_o<1/4096`이다. source의 첫 stage에는 `logAStart=0`이 문자 그대로 들어간다. 초기 reference의 amplitude는 `c(y)=exp(y/10)`이며 y<=0에서 theta=1이다. 그러므로

\[
 \int_{-\infty}^0 c(y)^2\,dy
 =\int_{-\infty}^0 e^{y/5}\,dy=5.
\]

이는 calibration root를 가정한 결과가 아니다. auditor는 actual `initialInfinitePrefix`가 정확히 `5*f(eta)^2`, `f=(1+eta²)^-1`인지 확인하고, stage zero amplitude가 literal 0인지 확인한다. `actual_pressure_initial_log`나 다른 미검토된 root가 이 operand에 들어가면 거부한다.

**범위 제한:** 여기서 증명하는 것은 retained core P0 datum이다. 이후 temporal/updated whole mean의 initial-pressure calibration이나 최신 residual pressure와의 equality는 별도의 명제이다. angular edit의 pressure neutrality도 이 retained P0의 mass 증명에는 전제로 쓰지 않는다.

## 2. 실제 source step

source step은 `sigma(t)=f0(t)/(f0(t)+f0(1-t))`, `f0(t)=exp(-1/t²)` 및 0/1 flat extensions이다. 각 고정된 미분 차수에서 exponential times polynomial 형태가 유지되므로 extension은 C-infinity이고 endpoint derivatives는 모두 0이다.

`u=1/t>=1`과 `exp(u²)>=u^4/2`에서 `f0'(t)<=4`이다. t 또는 1-t 중 적어도 하나는 1/2 이상이므로 denominator는 `>=exp(-4)>1/81`. 따라서

\[
 0\le\sigma'(t)
 \le\frac{f0'(t)+f0'(1-t)}{f0(t)+f0(1-t)}<648.
\]

또한 `sigma(1-t)=1-sigma(t)`에서 `integral_0^1 sigma=1/2`이다. 이는 실제 source outer compiler가 `S(1)=1/2`로 줄이는 식과 같다.

## 3. 실제 A.13 wait의 positivity

`a=1-lambda`, `S(s)=integral_0^s sigma`로 쓰면 source에 그대로 있는 식은

\[
 Q_0=(\lambda-h)/a>0,
\]

\[
 Q_{steep}=e^{-a/2}\left[Q_0+
 \int_0^1 e^{a(s-S(s))}(\lambda+a\sigma(s)-h)\,ds\right]>0.
\]

`lambda-h>0`이므로 integrand도 양수이다. source hold length `Lh=-4log h>4`에서

\[
 Q_{hold}=Q_{steep}+(1-h)Lh>2.
\]

다음 literal flatten formula의 integrand가 비음수이므로

\[
 Q_b=e^{-(1-h)/2}\left[Q_{hold}+
 \int_0^1e^{(1-h)S(s)}(1-h)(1-\sigma(s))\,ds\right]
 >Q_{hold}/2>1.
\]

여기서 `e<3<4`이므로 `exp(-1/2)>1/2`이다. source의 다른 operand는

\[
 Q_p=\int_1^3
 \frac{e^{(1-h)s}\rho_o\sigma'((s-1)/2)}{2(1-\rho_o)}\,ds.
\]

정규화된 sigma-prime의 적분이 1이므로

\[
 0<Q_p<27\rho_o/(1-\rho_o)<27/4095<1.
\]

따라서 actual `wait=log(Qb/Qp)/(1-h)`는 양의 유한 실수이다. 이로써 압력 적분의 모든 twelve-stage 구간이 ordered이고, wait의 존재성·분기가 숨은 가정으로 남지 않는다.

## 4. 전체 source amplitude의 감소

각 실제 stage에는 amplitude `c(y)=exp(logAStart+delta(s))`, eta factor `f(eta)^theta(s)`가 있다. theta는 initial부터 pulse까지 1, interpolation에서 `1-sigma(s/Tf)`, 그 뒤에는 0이다. 따라서 모든 y에서 `0<=theta<=1`, c와 theta는 eta 독립이다.

첫 transition 0<=s<=1의 density는

\[
 c(s)^2=\exp\left(s/5-(6/5)\int_0^s\sigma\right)
 \le e^{1/5}<5/4.
\]

geometric-series upper bound로 마지막 부등식을 얻었다. endpoint에서는

\[
 c(1)^2=e^{-2/5}<25/37,
\]

왜냐하면 `exp(2/5)>1+2/5+(2/5)²/2=37/25`이기 때문이다.

그 이후의 actual log amplitude derivatives는 axial `-1/2`, entry `-1/2-lambda*sigma`, reservedPower/pulse/angular `-1/2-lambda`, interpolation에 추가되는 비양수 항, steepen에서 추가되는 `-(1-lambda)*sigma`, steepPower `-3/2`, flatten `-3/2+(1-h)*sigma`, wait `-1/2-h`이다. 이들은 모두 `<=-1/2`이다.

terminal stage에서는

\[
 f_o(s)=1-\rho_o(1-\sigma((s-1)/2)),\quad
 f_o\ge1-\rho_o,\quad f_o'\le324\rho_o.
\]

따라서 `fo'/fo<2h`, terminal log slope는 `-1/2-h+fo'/fo<-1/2+h<-1/4`이다. 전체 infinite exterior tail의 slope는 `-1/2-h`이다. Source logAEnd가 다음 logAStart와 실제로 같은 node 식이므로 모든 stage에서

\[
 c(y)^2\le c(1)^2e^{-(y-1)/2}\quad(y\ge1).
\]

stage 길이가 얼마나 큰지는 상관없다. 특히 `13/lambda` pulse나 A.13 wait 및 전체 무한 tail을 truncate하지 않고

\[
 \int_1^\infty c(y)^2dy\le2c(1)^2<50/37.
\]

## 5. 실제 positive measure와 압력

`dnu(y)=K*c(y)^2*dy/2`로 두면 실제 retained P0가

\[
 P_0(z)=-\int (1+z^2)^{-2\theta(y)}\,d\nu(y)
\]

이다. auditor는 `core.P0OverPstarSquared=-1/2*(prefix+12 stage integrals+terminalTail)`와 P0의 Pstar² factor를 직접 확인한다. 따라서

\[
 \nu(\mathbb R)
 <\frac K2\left(5+\frac54+\frac{50}{37}\right)
 =\frac{1125}{296}K<4K.
\]

이것으로 이전 `NS-BRHO-ACTUAL-OPERATOR`의 **actual A.21 mass 전제 한 개를 제거**할 수 있다. 나머지 Banach operator correspondence와 source infinite solution의 quantitative membership은 여기서 자동으로 합격시키지 않는다.

`|Im z|<=1/16`이면 `Re(1+z²)>=255/256>0`. Principal logarithm에 대한 integrand는 holomorphic이고 modulus는 `(256/255)²` 이하이다. 위의 실제 finite positive measure가 공통 적분 majorant를 주므로 P0는 열린 strip에서 holomorphic이며 `|P0(z)|<5K`이다. Cauchy의 radius 1/32에서 작은 tube의 `|P0'|<=160K`도 따른다.

실수에서는 P0가 매끄럽고 음수이며, 적분 안에서 실제 미분하면 `eta*P0'(eta)>=0`이다. actual theta-one reference mass가 `5K/2`이므로 `|eta|<=1`에서는 `-P0(eta)>=5K/8`이다. 이 명제는 최신 whole physical PDE나 N6 완료를 증명하지 않는다.
