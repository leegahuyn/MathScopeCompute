# 실제 원본 cutoff 질량의 외향 수치 구간

## 이 확장이 완료하는 범위

`actual-cutoff-mass-enclosure.mjs`는 실제 covariance operator의 두 cutoff 적분 인자를 원래 식에 결속하고 엄밀한 유리수 구간을 계산한다. 횡방향 질량과 종방향 정규화 질량을 공통 적분으로 계산하고, 실제 `ell=1`의 원래 길이 `Ls`를 엄밀하게 감싸서 **전체 종방향 질량의 절대 수치 구간도 반환**한다. 정확한 원래 `Ls × 정규화 구간` 표현은 함께 보존한다.

이는 G-NUM의 **두 실제 source 인자에 대한 부분 완료**다. 실제 H 전체의 적분, Volterra 해, slow pulse 도함수, 역행렬의 조건수, 양의 covariance 가중치, 전체 curl 수치 구간, 물리 잔차와 flat-error까지 평가했다는 뜻은 아니다. 새 Lean kernel 증명도 포함하지 않는다.

## 현재 operator의 원래 정의와 정확한 환원

출처는 [`actual-covariance-source-operator.mjs`](../actual-covariance-source-operator.mjs)의 `originalCutoffs`와 원래 `haarFactor` 구성이다. 현재 source는

\[
\sigma(s)=\frac{e^{-1/s^2}}{e^{-1/s^2}+e^{-1/(1-s)^2}},\quad 0<s<1,
\]

를 사용하며 양 끝 바깥에서 각각 0과 1로 매끄럽게 확장한다. 다음 공통 상수를 둔다.

\[
I=\int_0^1\sigma(s)^2\,ds.
\]

### 횡방향 질량

`r0=2^-34`, `t=xi/r0`에 대해 현재 source의 bump는 `|t|≤1/4`에서 1, `1/4<|t|<3/4`에서 `sigma(3/2−2|t|)`, 그 바깥에서 0이다. 양쪽 전이 구간에서 각각 변수 치환하면

\[
\boxed{\int_{-r_0}^{r_0}\chi(\xi)^2\,d\xi=r_0\left(\frac12+I\right).}
\]

이 식은 현재 source의 **반지름 1/4 plateau**에 해당한다. 다른 기존 수치 경로에서 사용한 반지름 1/2 plateau의 허용 가능한 cutoff는 질량이 다르다. 그 경로의 `1+I/2` 정규화를 이 operator에 재사용하지 않는다. 실제 root 검사에서 현재 branch 상수와 원래 질량 root를 모두 확인한다.

### 종방향 질량

`u=v/Ls`에 대해

\[
\psi(v)=\sigma(20u-4)\sigma(16-20u).
\]

왼쪽 전이는 `u∈[1/5,1/4]`, plateau는 `[1/4,3/4]`, 오른쪽 전이는 `[3/4,4/5]`이다. 각 전이에서 다른 sigma 인자는 정확히 1이다. 전이 폭은 각각 `1/20`이므로

\[
\boxed{\frac1{L_s}\int_0^{L_s}\psi(v)^2\,dv=\frac12+\frac{I}{10}.}
\]

`Ls`는 원래 `2*r0/ci` 식이다. `ci`는 양의 원래 밑에 대한 실수 거듭제곱의 곱이므로 양수이고 `Ls>0`이다. 여기서는 이 원래 길이를 임의의 부동소수점 값으로 치환하지 않는다.

### 실제 ell=1의 길이까지 감싸기

원래 `Q`는 rational `1/2` node가 아니라 `exp(−ell*log(2))` node다. source adapter는 이 **원래 exp/log body**, `Tg`, palette floor, `ci`, `Ls`, `h` root를 먼저 검사한다. `ell=1`에서 다음 수학적 환원이 가능하다.

\[
Q=\tfrac12,\quad
0<\frac{(1+h)\log 2}{\log(4+\sqrt2)}<1,
\quad\mathrm{paletteIndex}=0,
\quad c_i=2^{-(1+h)},\quad L_s=2^{-32}2^h.
\]

원래 pinned source의 [`sourceExponentContract`](../source-profile.mjs)는 엄밀한 `0<h<2^-4096`를 제공한다. `h<1/2`에서

\[
1<2^h\le e^h\le\frac1{1-h}\le1+2h<1+2^{-4095}
\]

이므로 원래 `Ls`는 다음 닫힌 유리수 구간의 **엄밀한 내부**에 있다.

\[
L_s\in[2^{-32},\ 2^{-32}(1+2^{-4095})].
\]

이 두 끝점과 양의 정규화 종방향 질량 끝점을 정확히 곱하면 전체 질량을 감싼다. 두 질량의 적분 오차 외에 `Ls` 구간 폭에서 온 작은 양의 기여도 `absoluteWidthBudget`에 별도로 기록한다. 이 증명은 `h=0` 또는 `Ls=2^-32`라는 등식을 사용하지 않는다.

## 엄밀 적분과 수치 오차

### 끝점의 작은 값을 0으로 치환하지 않는 방법

대칭성 `sigma(1−s)=1−sigma(s)`로

\[
I=\frac12-2J,\qquad
J=\int_0^{1/2}f(s)\,ds,
\quad f(s)=\sigma(s)(1-\sigma(s)).
\]

`z(s)=(1−s)^−2−s^−2`라 두면 `0<s≤1/2`에서 `z≤0`이고 증가한다. 따라서

\[
f(s)=\frac{e^{z(s)}}{(1+e^{z(s)})^2},\qquad
0\le\int_0^\delta f(s)\,ds
\le \delta e^{z(\delta)}
\le\delta 2^{-\lfloor-z(\delta)\rfloor}=:T.
\]

`delta`는 엄밀히 양수인 dyadic 수다. 기본 192 bits에서 `delta=1/16`이다. 버린 끝점 구간의 오차 `T`는 결과의 적분 오차에 더해진다. 작은 지수를 실수 0으로 취급하여 오차를 없애지 않는다.

### 내부 구간의 검증된 Taylor 적분

`[delta,1/2]`를 동일 폭의 dyadic cells로 나눈다. 중심 `c`, 반폭 `a`인 cell에서 `f`의 7차 Taylor 다항식을 적분한다. 각 중심 계수 `f^(k)(c)/k!`는 외향 구간으로 계산하고, 나머지에 사용하는 **8차 계수의 상한은 전체 cell**에서 interval jets로 계산한다.

\[
\left|\int_{c-a}^{c+a} f(s)\,ds-
\sum_{k=0,2,4,6}\frac{2a^{k+1}}{k+1}\frac{f^{(k)}(c)}{k!}\right|
\le\frac{2a^9}{9}\sup_{s\in[c-a,c+a]}
\left|\frac{f^{(8)}(s)}{8!}\right|.
\]

각 cell의 signed 다항식 구간을 더한 결과를 `[Plo,Phi]`, 나머지 반경 합을 `R`라 쓰면

\[
J\in[P_{lo}-R,\ P_{hi}+R+T],
\quad
I\in\left[\frac12-2(P_{hi}+R+T),\ \frac12-2(P_{lo}-R)\right].
\]

그러므로 최종 폭은 `2*(Phi−Plo)+4*R+2*T`이다. 표본 수를 늘렸을 때의 차이는 오차 증명으로 사용하지 않는다.

### 외향 산술과 지수 함수

기존 [`actual-continuation-arithmetic.mjs`](../actual-continuation-arithmetic.mjs)의 BigInt dyadic interval arithmetic를 사용한다. 곱, 나눗셈, 유리수 변환에서 아래 끝점은 floor, 위 끝점은 ceil 방향으로 계산한다. 지수는 이 새 모듈 안에서 다음과 같이 검증한다.

1. 비양수 지수를 반전하고 범위를 줄여 `0≤y≤1/8`로 만든다.
2. `exp(y)`의 양의 Taylor 급수와 명시적인 상한 `8/7 × (1/8)^(N+1)/(N+1)!`을 사용한다.
3. 외향 제곱을 반복한 뒤 외향 역수를 계산한다.
4. `x≥bits+8`이면 `exp(−x)`는 `[0,2^-bits]`로 감싼다. 위 끝점은 양수다.

exp jets는 `b_n=(1/n) Σ_(k=1)^n k a_k b_(n−k)`로 생성하여 같은 외향 산술을 유지한다. 최종 pass와 refinement 결정에는 binary64 근삿값을 사용하지 않는다.

오차 예산의 절반은 `4R+2T`, 나머지 절반은 `2*(Phi−Plo)`에 배정한다. derivative 상한과 나머지 반경을 외향 계산하면서 생긴 폭은 전자에 이미 들어 있다. 후자는 중심 다항식 계산의 외향 산술 및 지수 급수 평가 폭이다. 두 부분의 **합**이 결과의 정확한 구간 폭이다. 수치 판정에 사용하지 않는 독립 Simpson 계산은 테스트의 근사 진단일 뿐이다.

## API와 검증 경계

```js
const result = await actualCutoffMassEnclosure({
  sourceProfile: 'same-profile-2026-10-10.3',
  ellExact: '1',
  precisionBits: 192,
  tolerance: '1/10000000000',
  maxCells: 1024
});
```

`tolerance`는 `I` 구간의 절대 **폭**에 대한 정확한 유리수 문자열이다. Number나 반올림된 소수 입력은 받지 않는다. 적분 kernel의 precision은 96–512 bits, `maxCells`는 4–4096 사이 2의 거듭제곱이다. source 길이 상한의 `2^-4095`와 그 이후 유리수 곱은 정확한 정수 산술로 보존한다. 부족한 precision, 부족한 cells, 취소 요청은 명시적으로 실패하며 부분 결과에 pass를 붙이지 않는다.

이미 만든 실제 operator에는 `attachActualCutoffMassEnclosure(operator, controls)`를 사용할 수 있다. `encloseSigmaSquareIntegral(controls)`는 순수 수치 kernel이며 `sourceAuthenticated:false`다. 그것만으로 실제 source나 NS member를 인증하지 않는다.

`assertActualCutoffMassEnclosure`는 private WeakMap에 저장한 live 결과, 원래 operator의 source seal, 추가한 종방향 적분 node의 불변 prefix를 검사한다. JSON 복사본, 수정한 수치 구간, 변경한 원래 branch, 변경한 추가 적분 body는 이 인증을 통과하지 않는다. 직렬화된 JSON은 실행 기록이고 live 인증 토큰은 아니다.

밴드와 labels를 고정하면 `r0`, `Ls`, 두 질량 적분 root에는 free R/Z/T 좌표가 없다. 이 구조적 독립성으로 R/Z/T 1차 및 RR/RZ/RT/ZZ/ZT/TT 2차 slow 질량 도함수는 정확히 0이다. 이것을 실제 pulse 도함수가 0이라는 주장으로 확대하지 않는다.

## 현재 수치 결과와 실행 기록

기본 kernel 실행은 128 cells를 사용했고 약 0.6초가 걸렸다. 아래 소수는 정확한 유리수 끝점을 바깥 방향으로 다시 반올림한 표시 구간이다.

| 값 | 표시용 포함 구간 |
|---|---|
| `I` | `[0.47059326157186788, 0.47059326157194201]` |
| `transverseMass/r0` | `[0.97059326157186788, 0.97059326157194201]` |
| `longitudinalSquareMass/Ls` | `[0.54705932615718678, 0.54705932615719421]` |
| 원래 `transverseMass` | `[5.6495963454471661e-11, 5.6495963454475976e-11]` |
| 원래 `longitudinalSquareMass` (`ell=1`) | `[1.2737217502602999e-10, 1.2737217502603173e-10]` |

`I`의 실제 유리수 구간 폭은 `7.4122094419073 × 10^-14` 이하이다. 횡방향 전체 질량의 폭에는 추가로 정확한 인자 `2^-34`가 곱해지고, 종방향 정규화 질량의 폭은 이 폭의 `1/10`이다. 정규화 질량에 대한 0.6초 측정은 원래 전체 source operator를 구성하는 시간을 포함하지 않는다.

재현 명령:

```sh
node --test --test-reporter=tap research-ide/mathscope-m2/navier/tests/actual-cutoff-mass-enclosure-kernel.test.mjs
node research-ide/mathscope-m2/navier/tests/actual-cutoff-mass-enclosure-source-check.mjs
```

source helper는 새 증거 디렉터리에 원래 source graph와 추가 적분 binding graph의 hash, source/input SHA, 정확한 수치 구간, 오차 예산, runtime, exit code 및 변조 거부 검사 결과를 저장한다. 기존 기록을 덮어쓰지 않으므로 재실행할 때에는 새 디렉터리를 인자로 지정한다.

2026-10-11 검증 결과는 다음과 같다.

| 실행 | 확인 결과 | 기록 |
|---|---|---|
| 최종 numerical kernel | 7/7 PASS, exit 0, 약 2.23초 | [JSON](evidence/m2-continuation-20261011/actual-cutoff-mass-enclosure-kernel-final.json), [TAP](evidence/m2-continuation-20261011/actual-cutoff-mass-enclosure-kernel-final.tap) |
| 실제 source operator 한 건 | 10/10 PASS, exit 0, 약 18.18초, peak RSS 1,259,044,864 bytes | [JSON](evidence/m2-continuation-20261011/actual-cutoff-mass-enclosure-source.json), [log](evidence/m2-continuation-20261011/actual-cutoff-mass-enclosure-source.log) |

실제 source 검사는 원래 두 mass root와 Haar factor, 두 질량 환원, 원래 exp/log Q와 palette/Ls/h 결속, 실제 전체 종방향 질량, R/Z/T 독립성, 외향 오차, JSON 복사 및 원래/추가 integral body 변조 거부를 검사했다. 실행 중 literal module closure 45개 파일이 바뀌지 않은 것도 확인했다. 이 기록은 **직접 source 실행**이며 worker 또는 browser 실행 기록이 아니다.

원래 217,940-node source program SHA256은 `8ab08ced59083f935cce9a7f64c8576d4a40a3bcb33e3669e2f01630c204d8dc`, 추가 적분 node를 포함한 217,942-node binding program SHA256은 `35b40530a32e8815f46bc3dccc8c851fff4814753f83eeba7a8650f0e673b9a6`이다. 실제 실행한 모듈 SHA256은 `320936a36cebe07828333a39b1620fdec182ec5e5a2a84be174bbb151a7abca8`이다.

## 전체 G-NUM을 닫으려면 필요한 다음 단계

이 두 cutoff는 원래 식에 대한 정확한 변수 치환 덕분에 거대한 background 평가와 분리하여 계산할 수 있다. 실제 H는 `psi²` 외에도 원래 `P`, moving frame `B`, Volterra 해 `w`의 곱을 포함한다. 그 인자들을 위의 cutoff 질량으로 치환하지 않는다.

전체 수치 경로에는 먼저 frozen band/representative와 정확한 R/Z/T 점 또는 상자 입력이 필요하다. 원래 `h`, 거대한 지수, 작은 양의 인자는 symbol 또는 scale을 보존해야 하며, 작은 interval의 아래 끝점이 0이라는 사실을 원래 h=0으로 해석해서는 안 된다. 실제 원본 integral/heat/series 식은 각각 적분 오차와 원래 tail을 함께 전달해야 한다.

그다음 실제 augmented ODE를 검증된 국소 적분으로 계산하고 초기값, 계수 평가, Volterra/적분 나머지와 rounding 오차를 합산해야 한다. covariance와 slow derivative 적분은 모든 원래 product/Leibniz 항을 유지한 accumulator를 사용해야 한다. 역행렬에서는 수치 상자 위의 비특이성과 inverse 오차 증명이 필요하고, sqrt 가중치는 실제 상자에서 양의 하한을 확인한 경우에만 미분할 수 있다. 이러한 단계의 성공은 실제 원본에 결속된 별도의 실행 결과로 확인해야 한다.
