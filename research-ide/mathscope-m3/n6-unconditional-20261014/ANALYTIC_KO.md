# 원본 eta-Picard 및 j=0 클래스의 독립 해석 검증

이번 개발은 기존 PASS를 읽지 않고 원본 source header/SQLite, 155개 producer와 보존본, 원문 PDF SHA를 검증한다. `analytic_prerequisites.py`는 이 source에서 실제 order-one singular Picard 시스템의 A0/A1/forcing closure를 다시 읽는다. 원본의 `A1 ∂eta W`를 보존하며 일반 6차원 ODE로 대체하지 않는다. 결과 파일은 `analytic-prerequisites-result.json`이다. **N6-01 OPEN, N6-02 PARTIAL을 그대로 유지한다.**

## 1. 새 무조건부 leaf: 원본 flat step의 날카로운 전역 미분 상계

원본 `actual-global-source-expressions.mjs:stepDerivative`가 정의하는 함수는

\[
 f(t)=\begin{cases}e^{-1/t^2}&t>0,\\0&t\le0,\end{cases}
 \qquad \sigma(t)=\frac{f(t)}{f(t)+f(1-t)}.
\]

기존 all-fixed-order C∞ 및 endpoint flatness 증명과 같은 literal 함수이다. 여기서는 그 **실제** 함수에 대한 추가 정량 명제

\[
                    0\le \sigma'(t)\le8\quad(t\in\mathbb R)
\]

를 독립적으로 증명했다. 상수 8은 날카롭다: `sigma'(1/2)=8`. 원본 Picard majorant가 사용하는 `|sigma'|<9`를 기존 JSON 상계 없이 확보한다.

`0<t<1`에서 `g=(1-t)^(-2)-t^(-2)`라 두면 `sigma=(1+e^(-g))^(-1)`이고

\[
 \sigma'=\frac{g'}{2+e^g+e^{-g}},\quad
 g'=\frac{2(1-3x)}{x^3},\quad g^2=\frac{1-4x}{x^4},\quad x=t(1-t)\in(0,1/4].
\]

지수함수 급수 또는 cosh의 짝수항 양성에서 `e^g+e^(-g)>=2+g²`. 따라서 `sigma'<=8`은 양의 `x^4`를 곱한 다음 다음 다항식의 비음수성으로 충분하다.

\[
 p(x)=32x^4+6x^2-34x+8.
\]

`p(1/4)=0`. 또 `p''=384x²+12>0`이므로 `p'`는 증가하고, `p'(1/4)=-29<0`. 따라서 `[0,1/4]` 전체에서 p는 감소하고 `p>=0`. 바깥의 상수 확장에서는 미분이 0이며 endpoint에서도 flatness로 0이다. 유한 representative, 수치 차분, binary64 underflow를 쓰지 않은 전역 증명이다. 8보다 작은 위조 상계는 midpoint 때문에 negative control에서 거부된다.

이 leaf는 모든 composed source argument가 유한·매끄럽다는 증명이 아니다. 해당 조건은 원본 argument마다 계속 추적한다.

## 2. 원본 Picard 시스템에 대한 실제 source 구조

원문 Lemma 5.1, PDF 47–49쪽의 (5.7)–(5.8)과 actual registry `picard[0]`를 대조했다. 실제 명칭은 `ActualSameN3OrderOneInner`, xi node `25516`, eta node `2`, singular diagonal은 `[0,0,2,0,3,1]`이다. A0/A1/forcing source row는 JSON에 모두 보존한다.

원본 A1의 nonzero 위치는 마지막 두 행/처음 네 열에만 존재한다. 모든 eta derivative도 같은 block에 존재한다. `V=span(e1,...,e4)`, `U=span(e5,e6)`라 두면 A1은 V를 U로 보내고 U를 죽인다. eta 독립 diagonal Green kernel D는 두 공간을 보존한다. 그러므로

\[
 A_1(\xi)D A_1(s)=0,\qquad
 A_1(\xi)D\partial_\eta^m A_1(s)=0\quad(m\ge0).
\]

인접한 두 derivative operator는 왼쪽 미분이 coefficient에 걸리는 경우까지 0이다. 따라서 길이 k의 비영 operator word에는 derivative letter가 서로 인접할 수 없고, **모든 k**에서 개수는 `ceil(k/2)` 이하이다. 이는 원문 논증에 정확히 해당한다. 별도의 모든 길이 induction이 수학적 증명이고, 길이 0–12의 모든 단어를 열거한 control은 구현 오류 탐지다.

실제 coefficient의 radial reflection parity도 78개 matrix/forcing row 모두 source DAG에서 검증했다. `P=diag(1,1,1,1,-1,-1)`에 대해

\[
 A_j(-\xi,\eta)=-P A_j(\xi,\eta)P,\qquad
 f(-\xi,\eta)=-P f(\xi,\eta).
\]

짝수 selector와 실제 arguments의 equality, binder를 보존한 integral, 동일 natural operator의 동일 입력만 사용한다. 함수 값을 0으로 치환하지 않았다. 이 formula symmetry에서 **존재·유일성과 매끄러움이 확보된 뒤에** 첫 네 solution component의 evenness가 따른다. Symmetry 자체만으로 아직 정의되지 않은 limit의 존재를 선언하지 않는다.

이 order-one coefficient closure에는 **quadratic root가 0개**다. 전체 producer의 B8/C12/I2 존재성 의무를 이 작은 order-one closure와 혼동하지 않는다. 실제 flat-step argument와 piecewise selector 중 eta-dependent 항은 **0개**다. 따라서 eta가 flat endpoint를 횡단해 holomorphy를 파괴하는 obstruction은 이 closure에 없다. 이것은 holomorphic strip와 실제 norm의 증명이 아니며, natural 호출의 활성 branch domain 및 denominator guard가 여전히 필요하다.

## 3. eta-transport Picard의 모든 차수 수렴·tail 정리

원본 `G_i g=xi ∫_0^1 t^(c_i)g(t xi)dt`를 사용한다. `A0,A1,f`가 공통 `S_rho`에서 bounded holomorphic이고 `[0,a]`에서 균일하며, `C>=2 max(1,||A0||,||A1||,||f||)`라 하자. `Delta=rho-rho'>0`는 1 이하라 둔다. 위 sparse word 결론과 Cauchy 반경 손실을 모든 남은 미분에 분할하면

\[
 \|K^kGf\|_{S_{\rho'}}\le
 \frac{(Ca)^{k+1}}{(k+1)!}
 \max\{1,\lceil k/2\rceil/\Delta\}^{\lceil k/2\rceil}.
\]

Coefficient에 걸리는 Leibniz 항을 버리지 않는다: Cauchy operator norm을 합성하기 전에 작은 strip들 사이에서 평가하므로 그 항들이 포함된다. 최대 `2^k`개 word는 C에 흡수된다. eta 독립 ordered radial simplex의 volume은 `a^(k+1)/(k+1)!`다. 우변의 kth root는 0으로 가므로 모든 유한 a에서 series가 균일 수렴하고, 같은 bound를 homogeneous difference에 반복하여 유일성을 얻는다. 큰 norm 때문에 radial interval을 줄일 필요가 없다. 더 작은 strip에서 Cauchy를 적용하면 **각 고정된** eta derivative의 균일 수렴과 termwise differentiation도 따른다.

정량적으로 `A=Ca`, `K>=72A²/Delta`이면 원문과 같은 factorial estimate에서 k≥K의 항은 `4^(-k-1)` 이하이다. 따라서 value tail은 `4^-K/3`. m차 eta derivative에서는 **별도로** `m!*(16/delta)^m`가 곱해진다. `log2(m!)<=m²`, `log2(16/delta)<=4+2/delta`가 original Kprecision의 충분조건을 준다. 새 exact verifier는 value tail만 맞고 derivative precision은 틀린 경우를 거부한다.

이 정리는 명시적 functional hypotheses 아래의 **증명된 정리**다. source `C1`의 저장된 설명을 actual coefficient 상계로 읽지 않았다. 원본 A0/A1/forcing 전체에 대한 common strip 및 그 actual norm은 아직 독립 enclosure로 닫지 못했다. node `24818`, `24825`, `24834`, `24835`라는 bound/index labels가 존재한다는 사실은 그 enclosure의 대체물이 아니다.

## 4. 원본 even-X derivative kernel의 모든 fixed-order 정당화

even C∞ 함수 f가 한 개 reflected collar에서 정의되면, source가 사용하는 식은 모든 고정 k≥1에 대해

\[
 \partial_X^k f(\sqrt X)=2^{-k}
 \int_{[0,1]^k}\prod_{j=0}^{k-1}t_j^{2(k-1-j)}
 f^{(2k)}\!\left(\sqrt X\prod_jt_j\right)\,dt.
\]

k=1은 `f'(0)=0`와 FTC에서 나온다. Compact integral 안에서 미분하고 even 함수 `f^(2k)`에 같은 공식을 반복하면 k+1의 정확한 weights를 얻는다. 매 단계 각 고정 derivative는 동일한 compact collar에서 유계이므로 dominated differentiation이 정당하다. X=0에서도 이 integral이 연속 extension과 정확한 derivative를 준다.

Monomial `f(xi)=xi^(2n)`에서 RHS coefficient는

\[
 \frac{(2n)!}{2^k(2n-2k)!}
 \prod_{j=0}^{k-1}\frac1{2n-2j-1}
 =\frac{n!}{(n-k)!};
\]

n<k에서는 양변이 0이다. 새 exact controls는 source의 `2^-k` 또는 weight 누락을 검사한다. 이 all-k induction은 compiler의 radial order 4/eta order 8 제한을 수학적 top derivative로 해석하지 않는다. 다만 실제 Picard solution의 C∞·evenness 확보가 선행되어야 한다.

## 5. Prop.9.5의 정확한 exponent 여유와 남은 전칭 조건

원문 PDF 106–107쪽 (9.8)–(9.10), `B0=7/10`, `C0*=6/5`와 원본 source의 `kappa_s=1/100000`을 정확한 유리수로 비교한다. 원본 (8.12) pressure → (8.20) temporal → pressure → (8.25) five-map → pressure 순서를 보존한 뒤 얻는 다음 implication의 exponent 여유는 모두 엄격히 양수이다.

| 실제 class 입력이 충족된 뒤의 항 | 확보 가능한 exponent | 요구 exponent |
|---|---|---|
| primary linear residual | `1-3 kappa_s` | `7/10` |
| primary nonlinear residual | `1-kappa_s` | `7/10` |
| primary full-curl auxiliary mean residual | `3/2-2 kappa_s` | `149/100` |
| temporal new tangential residual | `2-3 kappa_s` | `6/5` |
| five-map full nonlinear defects, conservative | `19/10-3 kappa_s` | `6/5` |
| curl remainder | `1-kappa_s` | `68/100` |
| mean/pressure total correction | `1-kappa_s` | `9/10` |
| induced radial mean | `2-kappa_s` | `19/10` |

이 계산은 actual class membership의 증명이 아니다. 모든 고정 multiindex마다 동일 원본 domain의 band/label/copy/point 및 support 전체에 균일한 `C_I,b_I,d_I`가 필요하다. 실제 primary stable dissipative pulse norm, covariance positive floor 및 squared partition의 derivative 포함 exact cancellation, 원본 full pressure/Fourier/Gaussian/flat/cutoff tail, nonlinear remainder Fubini가 전제다. Finite jet나 전역 Gronwall `exp(M Ls)`만으로 polynomial-S wave class를 증명할 수 없다.

최소 의무와 source nodes는 결과 JSON의 `remainingObligations`에 저장한다. 특히 `3614976/3615392` mean residual, `3615055/3615101/3615147` full defects, `3615361` final pressure, `3825006/3825007/3825008` full Cartesian velocities에 대해 위 전칭 seminorm이 미완료다. `3614735/3614752`의 fixed five-bump homogeneous rows는 이미 증명된 increment identity이지만, **whole tuple**의 (9.10)은 temporal zero mode 및 T1/A1 reconstruction, full normalized Haar/radial Fubini를 추가로 요구한다.

## 실행

```text
python research-ide/mathscope-m3/n6-unconditional-20261014/analytic_prerequisites.py --artifacts INPUT_DIR --output OUTPUT_DIR
python -m unittest discover -s research-ide/mathscope-m3/n6-unconditional-20261014 -p test_analytic_prerequisites.py
```

새 proof leaf와 source identity는 고전적 수학 증명이며 새 Lean kernel 인증은 아니다. 원본 producer, original 56/64, public site, 기존 N6 completion을 수정하지 않는다.
