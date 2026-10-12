# 같은 N3 선도장의 임의 유한 차수 미분 상계

## 1. 결과와 정확한 범위

`actual-leading-all-order-jets.mjs`는 사용자가 고정한 N3 source의 **실제 최종
선도장**에 대해 요청한 유한 직사각형
`0 <= r' <= radialOrder`, `0 <= m' <= etaOrder`의
`|∂X^r' ∂eta^m' U0|`와 `|∂X^r' ∂eta^m' F0|`를 상계하는 양의 유한 식을
생성한다. 반환값의 미분은 factorial로 나눈 계수가 아닌 ordinary physical
`X, eta` 미분이다. 중간 계산만 total Taylor norm을 사용한다.

| 반환 root | 실제 함수와 적용 영역 |
|---|---|
| `U0` | 실제 B.8, C.12, I1 및 외곽 pulse를 마친 `U0`; `0 <= X < infinity`, `eta ∈ [-1,1]`. `X >= Xv`에서는 실제 모멘트 복구에 의해 정확히 0이다. |
| `F0inner` | 실제 자연 코어와 B.26; `0 <= X <= Xa exp(t1/16)`. C.12 시작점 `Xa exp(t1/8)`보다 엄격히 앞이다. |
| `F0active` | 실제 I2 열 부채 보상까지 포함한 `F0=E0/sqrt(2X)`; `0 <= X <= Xplus=Xv exp(1)`. 모든 양의 차수 velocity/pressure coefficient와 `n>=2` stress 지원을 포함한다. |

`F0inner`의 중간 B.26 상계는 더 넓은 pregluing 영역에서 얻지만, 실제 최종
`F0`와의 동일성은 표의 unchanged collar에만 적용한다. `F0active` 영역은
128단위 외곽 interpolation의 첫 단위까지이다. 직접적인 열 편집은 아직
시작하지 않았지만, 그 **전체 무한 꼬리 부채를 상쇄하는 I2 correction은
이미 포함**된다. 실제 1차 `T_theta`의 지지는 `Xb>Xplus`까지이므로 이
상계로 1차 angular stress 전체를 계산했다고 주장할 수 없다. 이 결과는
`Xplus` 너머의 전역 `F0` 미분 상계가 아니다.

실제 `h, lambda, g, E`를 부동소수점 0으로 바꾸지 않는다. 식이 원래 `R`보다
커지는 것을 허용하며, 원래 `R=exp(S^256)`와 `N=1+ceil(R^50)`를 재선정하지
않는다. API의 명시적 메모리/차수 budget을 초과하면 실패하며 누락 차수를 0으로
채우지 않는다. 이 유한 budget은 수학적 재귀의 차수 한계가 아니다.

## 2. 원문 및 실제 함수 결속

원래 166쪽 논문의 SHA-256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다.
원문 식을 특정한 동일 source의 다음 보강 문서 8개를 main의
`ACTUAL_LEADING_ALL_ORDER_BINDINGS`에 정확한 바이트 수와 SHA-256으로 결속한다.

- `followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md`
- 같은 디렉터리의 `REFERENCE_DERIVATIVE_BOUNDS.md`,
  `CONTINUATION_AND_NEW_DEBT.md`, `GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md`
- `followup-20261010-symbolic-gluing/LOOP_DERIVATIVE_ENVELOPE.md`,
  `C12_FREQUENCY_CONTRACT.md`
- `followup-20261010-outer-reselection/OUTER_DERIVATION.md`
- `followup-20261010-final-stress-audit/HEAT_COMPENSATION_PROOF_EN.md`

호출자가 source 함수나 부채를 제공하지 않는다. 내부에서
`prepareActualFullLeadingProgram`을 생성하고 private identity 검사를 수행한다.
이는 실제 자연 계수, B.22/B.26/B.34, B.8의 실제 다섯 부채와 근, C.12의
variance/circle inverse, 실제 I1 및 I2 근의 정의를 포함한다. 이 함수 graph와
상계 graph는 구분된다. 상계 graph가 실제 signed 부채의 소수값을 계산했다는
의미는 없다. norm graph의 모든 leaf는 유리수 또는 고정 source parameter이며,
`actual_norm` 같은 이름만 있는 oracle leaf는 없다.

기존 `ACTUAL_LEADING_HIGH_JETS_KO.md`의 고정 6/8/12차 결과를 임의 차수로
외삽하지 않는다. 아래에서 쓰는 기존 **값/영역/양의 하계**와 실제 방정식의
새 유한 미분 재귀를 구분한다. 특히 외곽 계수의 복소 tube 값 `C^32`는 기존
문서의 outer 절에서 Cauchy 미분 전 증명한 값 상계이다. 그로부터 새로운
각 차수 Cauchy 계수를 생성한다.

## 3. Total Taylor 산술

고정된 실제 중심과 영역에 대해

\[
[f]_n=\sum_{|\alpha|\le n}\frac{\sup|D^\alpha f|}{\alpha!}
\]

를 사용한다. 변수에는 외부 `y=log X, eta`뿐 아니라 implicit 식의 평행이동된
unknown과 주기 phase도 포함될 수 있다. 합과 곱은 삼각부등식과 다항식
convolution으로 상계한다. 미분 한 번은 `(n+1)[f]_(n+1)`로 제어한다.
실제 양의 함수 `f >= l > 0`의 역수는

\[
[1/f]_n\le l^{-1}\sum_{k=0}^{n}([f]_n/l)^k.
\]

exponential, logarithm, positive square root에는 각각 유한 Taylor 전개와
실제 값/분모 하계를 사용한다. exponential의 별도 값 상계가 없으면 `exp([f]_n)`를
그대로 유지한다. 매우 큰 값이라는 이유로 유한 항을 삭제하지 않는다.
outer Taylor norm `F`, inner nonconstant jet의 합 `Z`인 합성은
`F sum_(k=0)^n Z^k`로 제어한다. 원문 fixed endpoint 적분은 eta 미분과
교환하며 moving upper endpoint는 FTC로 처리한다.

### 일반 implicit 식: 혼합항과 고차 unknown을 포함하는 증명

실제 root를 `w(0)=0`으로 평행이동한다. 식의 `(external degree, unknown degree)`가
`(0,1)`인 **실제 Jacobian 전체**를 왼쪽으로 옮기고 실제 inverse를 적용한다.
`F`는 이 평행이동된 원래 식의 외부 변수와 unknown 변수를 모두 포함한
total Taylor 계수 합을 상계한다. 외부 degree를 `t`, unknown의 성분 절댓값
합을 `w`로 collapse한다. `d`개 unknown이면

\[
A=d\|J^{-1}\|_\infty F
\]

는 각 남은 collapsed 계수를 상계한다. 따라서 모든 `p>=1,q>=0` 혼합항과
모든 `p=0,q>=2` 항은 coefficientwise로

\[
H(t,w)=A\left\{\frac1{(1-t)(1-w)}-1-w\right\}
=A\frac{t/(1-t)+w^2}{1-w}
\]

에 의해 지배된다. `w=H(t,w)`에 `(1-w)`를 곱하면 정확히

\[
w=\frac{At}{1-t}+(1+A)w^2.
\]

따라서 constant quadratic에 한정하지 않고 `t w`, `t w^2`, `w^3` 등 모든
variable coefficient/high-power 항을 포함한다. 그 최소 formal solution의
계수는

\[
[t^m]w=\sum_{k=1}^{m}\operatorname{Cat}_{k-1}
{m-1\choose k-1}A^k(1+A)^{k-1}.
\]

코드는 각 요청 차수까지 이 정수 계수를 실제 생성한다. 유한 차수 `mod t^(n+1)`
비교이므로 smooth cutoff가 analytic이라는 가정은 필요 없다. C0 branch의
작은 반경을 고차 미분의 작은 반경으로 재사용하지 않는다. 실제 root와
Jacobian 하계는 원문에서 식별하고, 고차 도함수는 이 새 재귀로 생성한다.

독립 Python 검사는 전체 double geometric 식의 계수를 Fraction으로 다시
전개하고, 별도로 `w=t+(1+t)w^2`, `w=t+w^2/(1-t)` 및 선형/모든 고차 unknown을
가진 variable equation을 검사한다. 첫 식의 3차 계수는 constant quadratic의
계수보다 커져, variable coefficient를 생략하는 음성 대조가 실제 실패한다.

## 4. 자연 코어와 regular reference

`SAME_DATUM_ANALYTIC_AXIS`의 실제 nonlinear Banach 계수에 대해
`|Y| <= 5`, `dist(eta,[-1,1]) <= rho/4`에서 기하급수 계수를 항별 미분한다.
log-radius 변환에는 Stirling 수 `S(r,j)`를 새로 생성하여

\[
\frac{1}{r!m!}\sum_{j=0}^{r}S(r,j)4^{-j}
(m+j)!2^{m+j+1}\,Q\rho^{-m}
\]

를 사용한다. physical X 계수는

\[
\frac{(r+m)!2^{r+m+1}}{20^r r!m!}
Q\Lambda^r\rho^{-m}.
\]

이는 Bessel 비교함수를 실제 nonlinear 함수로 대체한 값이 아니다.
실제 `g`는 원래 complex tube의 값 상계 `|g|<1`과 실제 radius를 사용한다.
작은 `g`로 나누지 않는다. `log g`의 eta 도함수는 원래
`(log g)_eta=Lambda*zeta`와 양의 `H^2+sigmaStar^2` 분모에서 생성한다.
실제 A.21 압력의 양의 적분 표현은 `|Im eta|<=1/16`에서 `|P|<=5K`를 주므로
반경 `1/32`의 Cauchy 계수 `5K sum 32^m`를 사용한다.

B.22의 실제 `Phi>=1/4`, `1/4<=Rr<=2`는 값 하계/상계이다. log integral,
`Y PhiY/Phi`, 실제 cutoff를 미분해 `Rr`과 `Ur`의 새 norm을 얻는다.
reference source는 다음 regular 식을 사용한다.

\[
p_{1r}=\frac X L\int_0^1 s\frac{R_r(sX)}{R_r(X)}S_q(sX)ds,
\qquad n_{sr}=\frac1L\int_0^1 S_n(sX)ds.
\]

`S_q`의 세 항과 `S_n`의 여섯 항을 모두 남긴다. 특히
`(log F)_eta=Lambda*zeta+(Rr)_eta/Rr`로 `g`를 소거하고, pressure radial
항 `2 eta X F^2`, pressure eta 항 및 `-X W U`에 필요한 실제 prefix들을
보존한다. B.26의 shear/axial 적분, B.34의 endpoint-preserving logarithm,
축 복구의 cutoff는 모두 원래 widths로 합성한다.

## 5. 실제 B.8, C.12, I1와 외곽 root

### B.8의 singular ideal reference

actual prefix의 다섯 physical density는

\[
U,\quad 2XF,\quad 2XUF,\quad U^2-XF^2,\quad F^2.
\]

actual axis는 regular이지만 ideal comparison의 `F~X^(-2/5)`는 regular가
아니다. 따라서 이상장을 actual bounded-density 상계에 넣지 않는다.
`x=X/XR`, `c=4eta`에 대한 실제 이상 prefix는

\[
M=cX_Rx,\ I=\tfrac58\sqrt2 X_R^{3/2}K_\eta x^{8/5},\ J=cI,
\]
\[
S=c^2X_Rx-\tfrac5{12}X_RK_\eta^2x^{6/5},\quad
C_p=\tfrac52K_\eta^2x^{1/5}.
\]

끝점 `x=exp(-7)`에서 이 정확한 원시함수들의 norm을 actual histories에
더한다. 원래 `mu^-1, K_eta^-1`, `dJ-4eta dI`, `dS-8eta dM`을 보존하고,
원래 rational preconditioner의 row norm을 파일에서 다시 합산한다.
같은 C0 근의 preconditioned Jacobian inverse `<2`에서 일반 implicit 재귀를
실행한다. 원래 좁은 bump의 실제 모든 도함수도 별도 sigma 재귀로 생성한다.

### C1/C.12 loop

원래 `delta=exp(-S^16)`, `muMax=S^12`, `d0=(8S)^-1`를 유지한다.
`M(z)=<exp(z sin theta)>`, `R(z)=M(2z)/M(z)^2`에서

\[
Q(z)=\int_0^1(1-s)R''(sz)ds
\]

를 사용한다. 따라서 요청 `n`에는 실제 tilt의 `n+2` 미분이 필요하다.
`p2=0`에서 나누거나 removable 값을 0으로 선언하지 않는다.
실제 `Q>=exp(-S^14)`, nonzero branch의 radicand `>=delta/(4S)`와 실제
`W_mu>=exp(-S^14)`를 사용해 동일 `mu` root를 미분한다. 원래 circle density
`>=1/(16S^2)`로 같은 inverse lift를 미분한다. zero-mean `A,B`의 적분과
`B`의 실제 `E` 인자를 보존한다.

주기 phase의 값은 한 원에서 상계하지만 phase 미분은 삭제하지 않는다.

\[
D_y^rB(y,eta,Ny)=\sum_{j=0}^r{r\choose j}N^j
\partial_y^{r-j}\partial_\theta^jB.
\]

따라서 원래 finite `N`에 대해 `(1+N)^n/N`이 남는다. 큰 고차 상계를
`1/N`만으로 작다고 선언하지 않는다. actual C.12 다섯 debt density의 모든
linear/quadratic/cross 항을 적분하고 I1의 실제 continuous inverse `<2^30`를
적용한다. 특히 원래 두 번째 normalized row의 `lambda^-2`를 보존한다.

### 전체 외곽 axial field

원래 initial/decay/entry/angular/A13 wait/power 및 infinite energy tail을
모두 포함한 외곽 coefficient들은 `1/4` complex tube에서 `C^32` 값 상계를
갖는다. 반경 `1/8`에서 새 모든 차수 Cauchy 계수를 생성한다. 실제 Amp는
원래 real bracket `(9/10,6/5)` 및 derivative `>=7/20`로 implicit 재귀를
적용한다. 복소 square-root branch를 가정하지 않는다. pulse의 시작과 마지막
cutoff를 모두 남긴다. 같은 원문 다섯 모멘트의 복구로 외곽 이후 `U0=0`임을
사용하며, 단순히 `U`의 support만 보고 `M=0`이라고 추론하지 않는다.

## 6. 실제 열 부채의 임의 eta 차수와 F0active

원래 H5의 normalized Gamma integral에 대해

\[
\mathcal L(z)=\frac1{\Gamma(1+h)}\int_0^\infty
e^{-t}t^h\{1-(1+zt)^{-h}\}\,dt,\qquad z\ge0.
\]

실제 미분을 적분 안에서 계산하면
`|L^(j)(z)| <= (h)_j(1+h)_j`이다. `Z=2(1-eta^2)/X`의 nonconstant eta Taylor
norm은 `6/X` 이하이고, `X>=XK>=1`이므로 모든 항에 `1/X`를 유지한다.

\[
X[\mathcal L(Z)]_{eta,n}\le
B_n=4h+\sum_{j=1}^n\frac{6^j(h)_j(1+h)_j}{j!}.
\]

`eta=±1`에서는 연속 one-sided 도함수이다. 음의 `Z`에 열 적분을 연장해
holomorphic이라고 주장하지 않는다. 모든 유한 차수에 이 Gamma majorant가
적분 가능하므로 끝점까지 미분과 improper integral의 교환이 정당하다.
원래 heat cutoff는 eta와 무관하고 `0<=chi<=1`이다.

`C_n=B_n+B_n^2/2`, H4의 실제 값 관계
`eK<=eStar`, `eK sqrt(XK)<=eStar sqrt(X0)`, `XK>=X0>=1`을 사용한다.
원래 `Ecl(XK x)<=2eK x^(-A)`, `A=1/2+h`에서 실제 세 부채는

\[
\|D_I\|_{eta,n}\le\frac{4B_ne_*\sqrt{X_0}}h,
\quad\|D_S\|_{eta,n}\le4e_*^2 C_n,
\quad\|D_{C_p}\|_{eta,n}\le4e_*^2C_n/X_0.
\]

각 적분은 정확히 `1/h`, `1/(2A)<=1`, `1/(1+2A)<=1`를 사용한다.
따라서 H9의 고정 C² 결과를 고차로 승격하지 않고 매 차수 Gamma 계수를
생성한다. 실제 `lambda X0^(3/2) K`, `lambda X0 K^2`, `lambda K^2` 정규화와
같은 I2 3차원 root를 사용한다. `K=eStar/(1+eta^2)`의 역수 미분도 포함한다.

이 I2 correction과 actual pre-heat E를 합한 뒤 `sqrt(2X)`로 나누면
`F0active`를 얻는다. 이 영역 밖의 direct heat pointwise jet가 이 상계로
자동 생성되는 것은 아니다.

## 7. Physical X로 환산하고 축을 포함하는 방법

원래 항등식

\[
\partial_X^r=X^{-r}\prod_{j=0}^{r-1}(D_y-j)
\]

의 모든 falling-Euler 항을 실제 정수 재귀로 생성한다. 절댓값 polynomial
계수 `a_(r,k)`로 ordinary 계수 합은 `sum_k a_(r,k) k! m!`이다.
예를 들어 `r=4,m=2`는 `[0,6,11,6,1]`로부터 정확히 176을 준다.
annulus에서는 `X>=Xa`이므로
`(1+sum a_(r,k)k!m!)(1+Xa^-1)^r`를 사용한다. 축을 이 식에 대입하지 않고
실제 Banach physical-X norm을 별도로 합친다. 이 합이 요청 직사각형의
모든 낮은 ordinary mixed derivative도 지배한다.

## 8. 검증과 후속 의무

Node 검사는 원문 바이트 결속, 실제 full heat function identity, 고정 12차를
넘는 요청, 양의 AST/분모, B8 ideal primitives, removable Q의 추가 2차,
implicit 전체 coefficient 전제, 원래 finite N, source injection/미완료 scope
거부를 검사한다. 독립 Python은 Fraction 및 180자리 Decimal로 seed recurrence,
Stirling/physical 변환, variable implicit 식, 실제 circle moment series,
ideal primitive, Gamma endpoint 계수 및 fast phase chain rule을 다시 계산한다.
범용 산술 검사용 작은 수는 실제 source parameter를 대체하지 않는다.

독립 읽기 검토는 `/root/blueprint_review`가 regular reference의 3+6항,
actual Phi/Rr domain, B8의 다섯 primitive, 원래 N와 lambda^-2, Gamma 꼬리와
implicit double-geometric 지배를 대조했다. 이 문서는 기계 형식 증명이나
전체 부동소수점 field sampler라고 주장하지 않는다. 실행 횟수와 정확한 파일
바이트/hash는 별도 `evidence/actual-leading-all-order-jets.json`에 봉인한다.

이 모듈만으로 양의 차수 계수의 전역 norm, 실제 모든 cutoff의 귀납 선택,
completed-background C² tail, 일반 label의 실제 projected ODE 또는 H 열,
source-uniform q*, 원문 N5-06은 완료되지 않는다. 반환값에서 해당 flag는
모두 false이다. 후속 producer는 이 정확한 상계를 내부에서 소비하고 각
추가 의무를 별도로 구성·검증해야 한다.
