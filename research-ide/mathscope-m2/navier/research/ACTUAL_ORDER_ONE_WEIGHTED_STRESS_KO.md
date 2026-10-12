# 실제 n=1 가중 응력의 말단 경계와 원래 첫 cutoff

이 추가 구현은 원문 **(5.22)의 실제 n=1 응력 경계**를 원래 소스에 결속하고, **(5.43)의 n=1 항**에 필요한 유한 상수를 구성한다. 검증한 요청은 `derivativeOrder: 2`이며, `q∂q`, `∂X`, `∂η`의 총 차수 2 이하를 포함한다. 실제 응력과 완전한 열 적분을 소수값으로 평가했다는 뜻은 아니다.

원문은 [Finite Time Blowup for Navier–Stokes](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)의 PDF 54쪽 (5.22), 60–61쪽 (5.43), (5.46), 163–164쪽 (C.18)을 사용했다. 읽은 PDF SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다.

## 완료 범위와 그대로 남은 범위

| 항목 | 이 구현의 결과 |
|---|---|
| 원래 부호 있는 `T1theta`, `T1z` | 실제 coefficient/heat/stress producer에서 가져온 동일 root |
| 원래 terminal `fo`, 열 인자 `H`, `rho=h/256` | 원래 식과 양의 원래 `h` 유지 |
| 말단 잔차 인수분해 | 실제 `fo` smooth factor의 1·2차 미분으로 생성; `bz*fo_y` 포함 |
| 역방향 적분의 3개 역멱 감소 | 정확한 `16/125` 계수로 증명 |
| 요청한 mixed profile 미분 경계 | 실제 식의 직사각형 FTC 적분 상수로 생성 |
| 원래 `c1` 및 시간 cutoff | 원래 `(throughOrder, derivativeOrder)=(1,1)` 선택식을 재사용 |
| 전체 차수 배경의 물리 잔차·flat-error | 미완료 |
| 전체 `c_n`에 원문의 추가 물리 조건 적용 | 미적용 |
| 실제 공분산 가중치의 양성 | 가정하지도, 증명하지도 않음 |
| 새 Lean kernel 증명·원문 64개 gate 변경 | 없음 |
| M3 시작 조건 | 이 부분 완료만으로 충족되지 않음 |

`(5.43)`에서 사용하는 미분은 `q∂q`, `∂X`, `∂η`이다. 이를 전체 Cartesian 공간·시간 미분을 가진 물리 잔차 정리로 바꾸어 표기하지 않는다. 원래 선택된 normalized `c_n`이나 동결된 runtime/build 파일은 수정하지 않았다.

## 1. 원래 소스에서 말단 항을 분리한다

`prepareActualOrderInduction({order:1})`의 실제 완성된 첫 계수, 원래 다섯 모멘트 보정, 완전한 I2 열 보정과 signed stress를 사용한다. 복사한 증명 객체, caller가 준 응력·열 식·미분·상수·completion flag는 인증하지 않는다.

원래 `actual-continuation-exact-inner.mjs`의 지수는 `lambda1=2*h`이다. 원래 angular residual은 `rtheta/R`를 저장하며, `X=R²/2` 아래에서 stress는 다음과 같다.

\[
T_{1,\theta}(X,\eta)
=-\frac1{2X}\int_{X_-}^{X}2s\,(r_{\theta,1}/R)(s,\eta)\,ds
=\frac1{2X}\int_X^{X_b}2s\,(r_{\theta,1}/R)(s,\eta)\,ds.
\]

두 번째 부호는 **양의 backward primitive**이다. 그 등식은 원래 (5.19)–(5.21)의 보존형 모멘트 상쇄를 사용한다. 적분함수의 support가 compact하다는 사실만으로 전체 적분을 0이라고 하지 않는다. 실행된 원래 다섯 모멘트 identity와 I2의 전체 heat debt, 실제 stress의 forward/backward root를 함께 확인한다. 이 보존형 등식은 원래 해석적 증명에 결속된 항등식이며 새 Lean 정리가 아니다.

원래 support 순서에서 `log(Xb/Xplus)>127`이다. 따라서

\[
X_e=X_b e^{-1/4},\qquad X_+<X_e<X_b
\]

이고, `[Xe,Xb]`는 모든 앞선 positive-order support가 끝난 말단 구간이다. 이 구간에서 원래 열 cutoff는 1이다. angular residual에는 실제 `-Z_(b-D)Z_b(F0)`만 남고 axial stress는 0이다. 여기서

\[
F_0=F_{\mathrm{heat}}f_o,\quad
F_{\mathrm{heat}}=c_\infty X^b H(2(1-\eta^2)/X),\quad
b=-A-\tfrac12.
\]

`H`는 원래 전체 improper Laplace 적분이다. `H=1` 대체, 유한 Taylor 부분합의 exact 선언, 무한 tail 절단을 하지 않는다.

## 2. terminal step의 정확한 계수

\[
\delta=\log(X_b/X),\quad 0\le\delta\le\tfrac14,\quad
E(\delta)=e^{-4/\delta^2},\quad \rho=h/256.
\]

원래 3단위 terminal stage와 square-seed step의 반사 대칭에서

\[
1-f_o=E(\delta)a(\delta),\qquad
a(\delta)=\frac{\rho}{E(\delta)+e^{-4/(2-\delta)^2}}.
\]

`E`는 `δ≤0`에서 0으로 flat하게 연장한다. 분모의 두 번째 항은 이 구간에서 `exp(-64/49)` 이상이다. 그러므로 `a`는 닫힌 구간에서 smooth하며 0으로 나누지 않는다. 실제 expression function을 원점에서 materialize한 결과는

\[
a(0)=\rho e,\qquad a'(0)=\rho e,\qquad a''(0)=\tfrac52\rho e.
\]

이는 함수의 값과 도함수이며, Taylor 급수의 2차 **계수**는 `5 rho e / 4`이다. 세 값은 원래 source에서도 정확한 rational-expression equality로 확인했다. guard 없이 `exp(-4/δ²)`에 직접 `δ=0`을 넣는 negative control은 거부된다.

원래 물리 `Z` 연산자와 `Z_b(Fheat)=0`을 사용하면

\[
a_z=-\frac{2\eta}{L},\qquad
b_z=\frac{-2D\eta a_z+d\,\partial_\eta a_z}{L},\qquad
L=1-2h\eta^2,\ d=1-\eta^2,
\]

\[
r_{\theta,1}/R=-F_{\mathrm{heat}}
\left(a_z^2\partial_{yy}f_o+b_z\partial_y f_o\right),\qquad y=\log X.
\]

`L`의 η 의존성과 `bz`의 두 항을 유지한다. `∂y=-∂δ`이므로 실제 미분은 다음 smooth coefficient를 준다.

\[
r_{\theta,1}/R=E\delta^{-6}\mathcal D,
\]

\[
\mathcal D=F_{\mathrm{heat}}\left\{
a_z^2[\delta^6a''+16\delta^3a'+(64-24\delta^2)a]
-b_z[\delta^6a'+8\delta^3a]\right\}.
\]

이 식은 전달받은 미분값으로 만드는 식이 아니다. `G.derivative`가 retained `a` 본문을 미분하며, 직접 미분한 잔차와 위 인수분해를 비교한다. `bz*fo_y`를 빠뜨린 식은 실제 source에서 동일성 검사를 통과하지 않는다.

## 3. backward primitive의 정확한 상계

`B(δ,η)=exp(-2δ) D(δ,η)`라고 두고 원래 backward primitive에 `s=Xb exp(-u)`를 대입하면

\[
T_{1,\theta}(X_b e^{-\delta},\eta)
=X_b e^\delta\int_0^\delta e^{-4/u^2}u^{-6}B(u,\eta)\,du.
\]

적분의 방향과 `2s ds/(2X)`의 모든 인자를 이 식에 반영했다. 다음 정확한 등식을 쓴다.

\[
\frac{d}{d\delta}(E\delta^{-3})
=E\delta^{-6}(8-3\delta^2)
\ge\frac{125}{16}E\delta^{-6}\quad(0<\delta\le1/4).
\]

`E δ^-3`의 0에서의 극한은 0이므로

\[
\int_0^\delta e^{-4/u^2}u^{-6}\,du
\le\frac{16}{125}E(\delta)\delta^{-3}.
\]

이를 미분하는 모든 유한 차수는 정수 Laurent recurrence

\[
Q_0=\delta^{-6},\qquad
Q_{j+1}=Q_j'+8\delta^{-3}Q_j
\]

로 생성한다. `Qj`의 최대 pole은 `6+3j`이고 그 계수는 `8^j`이다. 각 다항식의 정수 계수 절댓값 합을 이용하므로 부호가 바뀌는 항도 빠뜨리지 않는다. `δ` 미분 `r`회에 필요한 stress pole은 `3+3r`로 잡는다. `exp(δ)`의 Leibniz 합도 전부 포함한다.

ordinary `X` 미분은 다음 signed Stirling 변환을 쓴다.

\[
\partial_X^r=(-1)^rX^{-r}
\sum_{j=0}^r\left[{r\atop j}\right]\partial_\delta^j.
\]

예를 들어 `∂X²`에는 `X^-2(∂δ²+∂δ)`가 필요하다. 낮은 `∂δ` 항을 생략한 negative control은 통과하지 않는다.

## 4. 실제 finite FTC 상수와 ζ의 처리

`rectangularSourceFTC`는 actual expression `f`의 네 anchored face를 모두 사용한다. 값, 첫 번째 축 적분, 두 번째 축 적분, 두 축 mixed derivative 적분을 각각 `sqrt(1+g²)`로 감싸서 더한다. 결과는 `sup |f|`의 유한 상계이고 모든 profile 좌표에서 독립이다. 숫자 norm이나 자유로운 사용자 상수를 넣지 않는다.

terminal의 `B`와 요청한 미분에 대해 `[0,1/4]×[-1,1]`에서 이 상수를 구성했다. 열 인자의 유한 차수 smoothness에는 원래 전체 적분의 다음 지배식을 사용한다.

\[
(-1)^jH^{(j)}(z)=\frac{(h)_j}{\Gamma(1+h)}
\int_0^\infty e^{-v}v^{h+j}(1+zv)^{-h-j}\,dv,
\]

\[
|H^{(j)}(z)|\le(h)_j(1+h)_j\le j!(j+1)!,\quad z\ge0,\ 0<h<1.
\]

따라서 η의 닫힌 구간 양 끝점에도 필요한 모든 고정 유한 도함수가 연속으로 내려온다. η 구간 밖에서 음의 열 인자로 적분을 확장한다는 주장은 없다. improper 적분의 끝점은 극한이며 endpoint quadrature sample이 아니다.

원래 (C.18)의 weight는

\[
\zeta(X)=\exp\left[-\frac{t_1^2}{\log^2(X/X_a)}
-\frac4{\log^2(X_b/X)}\right].
\]

terminal에서 `δ_global=δ`이고 반대쪽 인자는

\[
\frac{E(\delta)}{\zeta(X)}
\le \exp\left[\frac{t_1^2}{\log^2(X_e/X_a)}\right]
\]

으로 제어한다. `X∈[Xminus,Xe]`에서는 **actual `∂X^r∂η^k T1`를 `ζ`로 나눈 식**에 FTC를 적용한다. 이 닫힌 구간에서는 `ζ>0`이다. `X≤Xminus`에서는 stress가 원래 zero branch이므로 inner boundary에서 나눗셈이 필요하지 않다.

최종적으로 생성한 상수 `B_(r,k)`는

\[
|\partial_X^r\partial_\eta^k T_{1,a}|
\le B_{r,k}\,\zeta\,\delta_{\rm global}^{-(3+3r)},
\quad a\in\{\theta,z\},\quad X_a<X<X_b
\]

를 준다. `T/ζ`를 `Xa`나 `Xb`에서 정의하거나 평가하지 않는다. 원래 stress의 zero extension은 각 유한 차수에서 `E`가 모든 역멱보다 빠르게 0으로 가는 사실로 얻는다. `ζ`의 terminal Taylor 계수는 전부 0이지만, `a`나 반대쪽 smooth factor의 Taylor 계수까지 0이라고 두지 않는다.

## 5. 원래 c1과 q Euler 미분

원래 첫 diagonal recipe의 norm 요청 `(1,1)`을 그대로 호출한다. 이번에 만든 가중 상수를 `c1` 선택식에 더하지 않으며 다른 `cn`을 생성하거나 바꾸지 않는다. 뒤의 prefix나 이번 요청 차수가 기존 `c1`을 바꾸지 않는다.

시간 cutoff는 원래 `source-gluing.mjs`와 같은 `chi(s)=1-sigma_1(2s-1)`이다. radial square seed와 구별하여 원래 linear seed를 사용한다. `q^(2h)*chi(c1*q)`를 직접 미분하고, `sourceNormalizedCutoffWeights`가 주는 정확한 polynomial-in-h 상계 `We`를 곱한다. 따라서

\[
|(q\partial_q)^e\partial_X^r\partial_\eta^k
[q^{2h}\chi(c_1q)T_{1,a}]|
\le W_eB_{r,k}\,q^{2h}\zeta\delta_{\rm global}^{-(3+3r)},
\quad 0<q\le1.
\]

이는 (5.43)의 실제 n=1 유한 블록이다. 나머지 모든 n을 합한 결과나 actual physical selector를 새로 적용한 결과가 아니다.

## 6. API와 검증 증거

```js
import {
  prepareActualOrderOneWeightedStress,
  actualOrderOneWeightedStressCertificateFromProgram
} from './actual-order-one-weighted-stress.mjs';

const prepared = prepareActualOrderOneWeightedStress({
  derivativeOrder: 2,
  maxNodes: 1500000
});
const certificate = await actualOrderOneWeightedStressCertificateFromProgram(prepared);
```

이미 인증된 actual prefix가 있으면 `attachActualOrderOneWeightedStress(prepared,{derivativeOrder})`를 쓸 수 있다. 요청 차수는 0–8의 유한 실행 예산으로 제한된다. 이번 실행 증거가 직접 검증한 차수는 2이며 그보다 높은 차수를 실행한 것으로 기록하지 않는다.

증거는 [background-residual-20261011](evidence/background-residual-20261011/)에 있다.

| 검증 | 결과 |
|---|---|
| 독립 kernel | 8/8 PASS |
| 원래 source 생성 | 1회, source tests 6/6 PASS |
| 내부 source 및 algebra checks | 21/21 PASS |
| terminal / interior FTC constants | 6 / 12 |
| weighted mixed profile rows | 6 |
| q Euler까지 포함한 normalized rows | 10 |
| source process 종료 | exit 0, timeout 없음 |
| source process 실제 시간 / peak RSS | 9.645초 / 1,369,096,192 bytes |
| compiler graph | 135,670 nodes / canonical 5,360,448 bytes |
| compiler SHA-256 | `09872de49e1f1d7c80dd65e166705be88e17aa1015638d9b0f1569ffd83c64ce` |

source root와 function body, 프로그램 metadata 및 scope flags의 변경은 private assertion에서 거부한다. 이후 harmless graph append가 생겨도 인증서의 고정 prefix SHA가 바뀌지 않는지 검사했다. 원래 dependency 파일은 실행 전후 동일했다. 자세한 파일 SHA는 process record와 `validation.json`을 사용한다.

이 파일의 재현 명령은 다음과 같다.

```sh
node --test --test-reporter=tap research-ide/mathscope-m2/navier/tests/actual-order-one-weighted-stress-kernel.test.mjs
node --max-old-space-size=3072 --test --test-reporter=tap research-ide/mathscope-m2/navier/tests/actual-order-one-weighted-stress-source.test.mjs
```

다음 연결점은 actual n≥2 weighted seminorms와 추가 물리 cutoff 선택, 그 선택 아래의 모든 차수 finite-residual/flat-error 정리이다. 이 경계를 닫기 전에는 전체 G-N4, 전체 G-CURL 연결 또는 M3 진입을 PASS로 바꾸지 않는다.
