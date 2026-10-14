# 원본 natural series 및 quadratic의 해석적 인증 시도

이 문서는 node 4483 `actual_natural_series("average",474,2,0,0)`와 node 5029 `actual_quadratic_root(0,4,2)`를 다룬다. `series_quadratic.py`는 원본 155개 소스와 3,892,594개 checkpoint 노드를 검증하고, 원본 세 quadratic 정의와 실제 primitive capture를 기록한다. 기존 producer, main, 원래 56/64 판정은 바꾸지 않는다. 계산된 조건부 미분을 무조건적인 N6 합격으로 바꾸지 않는다.

여기서 **증명**은 아래에 전개한 고전적 수학 증명을 의미한다. Python은 그 증명의 유한 정수·유리수 부등식을 독립적으로 확인한다. 새 Lean kernel 증명이나 실제 함수 노름의 수치 enclosure를 뜻하지 않는다. 원본 JSON의 PASS 값은 사용하지 않는다.

## 1. 고정된 원본 매개변수와 복소 근방

실제 source profile의 식을 직접 확인한다:

\[
 T=e^{2^{20}}+10,
 h=e^{-8002T},\quad j=h^4,\quad\mu=h^2,
 \sigma=j/2000,\quad\rho=\sigma^2/65536,
 \quad K=e^{4T},\quad Q=2^{260}K/\sigma^2,
 \quad\Lambda=Q^{64}.
\]

이는 전부 양의 유한 실수이다. `exp(x)>=1+x`, `e>2`에서 `T>128`, `0<h<2^-200`, `0<j<1/1000`, `Q>2^260`, `rho^-1<=Q`가 따른다. 실제 선택은

\[
 C=(1+Q^{300})^{10}e^{Q^{200}}.
\]

`sigma^-2<=Q`이므로 `64 Lambda/sigma²+1<=65 Q^65<Q^200<=log C`. 따라서 이 실제 C는 `Caxis=exp(64 Lambda/sigma²+1)`보다 크다. 기존 작은 C나 다른 fixed point를 그대로 사용하지 않는다.

`I=[-33/32,33/32]`, `Omega={z:dist(z,I)<sigma²/2048}`로 둔다. 원본 다항식은

\[
 H(z)=(1/2-h)z+(1-z^2)(4z+j),\qquad L(z)=1-2hz^2.
\]

닫힌 tube에서 `|z|<17/16`, `|H(z)|<10`, `|H'(z)|<20`이다. 가장 가까운 실수 x에 대해

\[
 |H(z)^2-H(x)^2|
 \le (400/2048+400\sigma^2/2048^2)\sigma^2
 <\sigma^2/4.
\]

그러므로 `|H(z)^2+sigma²|>=H(x)²+3sigma²/4>0`, `|L(z)|>99/100`이다. 같은 추정은 `|chi(z)|<=1`, `|zeta(z)|<=32/sigma²`를 준다. 이 근방의 분모 비소멸은 실제 다항식에 대한 증명이다.

압력은 실제 A.21 schedule이 만드는 양의 측도에 대해 `P(z)=-integral (1+z²)^(-2theta)dnu`, `0<=theta<=1`이다. **실제** `nu(total)<=4K`가 있으면 `|Im z|<=1/16`에서 `|P(z)|<=4K(256/255)²<5K`, Cauchy에서 `|P'|<=160K`이다. 전체 각 schedule을 이 측도와 mass bound에 연결하는 일은 아래의 실제 소스 lemma에 남겼다. 함수 정의가 같다는 hash만으로 mass bound를 증명하지 않는다.

## 2. 무한 Banach fixed point까지 필요한 연결

`g=exp(Lambda integral_0^z zeta)/C`이므로 위 tube에서는 `|g|<e^-1`, 실수에서 `g>0`이다. Cauchy 노름 손실은

\[
 \sum_{m\ge0}(m+1)^2(1/16)^m=4352/3375<2.
\]

실제 fixed data에 이 estimate를 적용하면 `||g||rho<=2`, 나머지 정해진 입력의 노름은 Q 이하이다. 원본 B_rho의 곱셈, 평균, radial primitive, regular inverses, integrated differentiated products는 각각 `64,1,80,80,5120/rho` 이하이다. 이 상수들은 Q 이하이다.

원본 integrated operator와 literal B.14/B.15 recurrence의 대응을 사용할 때, 독립적으로 전개한 **전체** remainder tree는

\[
 B(Q)=2Q^5+3Q^6+3Q^7+11Q^8+8Q^9+2Q^{10}+29Q^{11},
\]

\[
 L_N(Q)=2Q^4+3Q^5+4Q^6+17Q^7+14Q^8+4Q^9+58Q^{10}.
\]

angular quadratic, 두 mixed parameter 항, slow terms, pressure primitive와 parameter/radial pressure 항을 모두 포함한다. `||S||<2^256`, `||x0||<=2^256+2^25 K`, `Q>=2^260 K`이므로 x0의 radius-one ball은 Q ball 안에 있다. `F=x0+N/(2Lambda)`에 대해

\[
 ||F(x)-x0||\le29Q^{-53}<1,
 \quad Lip(F)\le51Q^{-54}<1/2.
\]

**실제 입력과 integrated operator 연결 lemma를 충족하면** 완비성에 의해 한 개의 고정점이 존재하고 radius-one ball 안에서 유일하다. 순차 차이의 기하급수 합으로 limit을 구성한다. 원본 recurrence의 n+1번째 계수는 n 이하의 계수와 그 실제 eta 미분만 사용하므로 induction으로 source finite coefficients가 이 동일한 limit의 계수임을 보인다. 유한 부분합을 limit으로 선언할 필요가 없다.

이 limit에는 `||(Phi,u)||rho<=Q`가 붙고, `|Y|<=5`에서 eta의 `rho/4` 복소 근방을 사용할 수 있다. 모든 **고정된** k,m의 정확한 tail은

\[
 Q\rho^{-m}\frac{m!}{(m+1)^2}
 \sum_{n>N}\binom{n+m}{m}
 \frac{(n)_kY^{n-k}}{20^n(n+1)^2}.
\]

해당 양의 항의 ratio는 `(Y/20)(n+m+1)/(n+1-k)*((n+1)/(n+2))²`이다. 전체 상계 `(Y/20)(N+2+m)/(N+2-k)<1`이 있으면 first-term division이 무한 tail 전체를 제어한다. 이를 유한 계산의 수치 오차와 혼동하지 않는다.

actual core graph를 독립적으로 걷는 audit는 모든 계수 입력이 formal eta만 capture하는지를 확인한다. 따라서 natural 연산의 외부 인자는 Y와 eta뿐이다. alpha-renamed formal eta 및 계수 table은 local binder이다. source substitution이 이 local binder를 외부 좌표처럼 바꾸면 다른 함수가 된다.

## 3. B.8 연속 행렬의 독립적인 비특이성 증명

과거 approximate inverse와 PASS를 전혀 사용하지 않는다. 원본 bump는 `b_j(x)=sigma'((x-l_j)/w)`, `w=1/4096`, support `l_j=(j+6)/2048`, `j=0,...,4`이다. 원본 flat step은 `sigma(t)=f(t)/(f(t)+f(1-t))`, `f(t)=exp(-1/t²)` 및 endpoint flat extension이다.

각 고정된 k에 대해 `f^(k)(t)=exp(-1/t²) P_k(1/t)`이고 `P_(k+1)(u)=2u³P_k(u)-u²P_k'(u)`이다. t가 0으로 내려갈 때 모든 polynomial factor와 exponential의 곱은 0으로 간다. 따라서 f의 zero extension은 C-infinity이고 모든 endpoint derivative가 0이다. denominator는 [0,1]에서 양수이므로 sigma는 매끄럽고, 0/1로 확장한 각 collar에서도 모든 derivative가 일치한다. 이는 제한된 3-jet을 C-infinity로 선언하는 방식이 아니다.

`u=1/t>=1`일 때 `exp(u²)>=u^4/2`이므로 `f'(t)<=4`. 적어도 t 또는 1-t는 1/2 이상이므로 `f(t)+f(1-t)>=e^-4>1/81`. 따라서

\[
 0\le\sigma'(t)
 \le\frac{f'(t)+f'(1-t)}{f(t)+f(1-t)}<648.
\]

`int b_j dx=w`는 endpoint 값 0/1의 FTC identity이다. 이것이 support, mass, 양성에 필요한 실제 함수 증명이다.

U block의 열은 `w*(1, average(sqrt2*x^(3/5)))`이다. `x<1`에서 weight의 미분은 `>=3/5`, 두 support gap은 w 이상이다. 따라서

\[
 |det A_U|\ge(3/5)w^3>0.
\]

E block의 point 열에서 `x^-9/10`을 떼면 나머지는 `(sqrt2*x^(7/5),-x,1)`이다. `f(x)=x^(7/5)`로 두면 `f''(x)=(14/25)x^-3/5>=14/25`, second divided difference는 `>=7/25`이다. 첫 row의 별도 `sqrt2>1` 인자는 상계를 낮추는 데만 사용한다. 세 support의 모든 point tuple에서 gaps는 `w,w,3w` 이상이다. 부호가 일정하므로 determinant multilinearity에 따라 실제 bump 적분 후에도

\[
 |det A_E|\ge(21/25)w^6>0.
\]

E support에서 `x>=1/256`, 각 entry의 절댓값은 `<=256w`이다. 각 cofactor는 `<=2(256w)²`, adjugate row sum은 `<=393216w²`. 따라서 전체 block-diagonal A에 대해

\[
 ||A^{-1}||_\infty<2^{68}.
\]

원본 Qdiag의 비선형 vector의 max norm은 `kappa_raw<64`이다: `int b²<=648w`, energy row는 `<=5*648w`, pressure row는 `<=3*128*648w<64`이다. 실제 효과에는 scale `mu=h²`를 반드시 곱한다.

만일 **실제 전체 source debt**가 `d0=||rhs||infinity<=15h`를 만족하면

\[
 8\beta_0^2\kappa_{eff}d_0
 \le120\,2^{-458}<1,\quad
 2\beta_0d_0\le30\,2^{-132}<10^{-6}.
\]

이는 Lemma A.2의 충분조건이다. 작은 ball에서 `A^-1(rhs-mu Q(z))`를 zero부터 반복하면 유일한 root를 얻는다. 원본 zero-seeded preconditioned branch가 같은 box 안에서 방정식을 만족하면 유일성으로 이 root와 같다. 그 전제를 source rootRadius label 자체로 증명하지 않는다.

이 root에서

\[
 J_{ij}=A_{ij}+2\mu Q_{ij}z_j,
 \quad ||A^{-1}(J-A)||\le60\,2^{-458}<1/2,
 \quad ||J^{-1}||<2^{69}.
\]

그러므로 실제 rhs가 C-infinity이면 implicit function theorem에서 같은 branch의 모든 고정된 차수의 미분이 따른다. 모든 k에 동시에 한 개의 Ck-smallness bound를 요구할 필요는 없다. 실제 rhs의 모든 capture와 moving endpoints에 대한 smoothness가 먼저 있어야 한다. 계수가 parameter에 의존하는 일반 시스템에서는 `rhs_dir-A_dir*z-mu_dir*Q*z²-mu*Q_dir*z²`를 유지한다. 이번 source matrix와 mu가 eta 독립이라는 점은 실제 operand graph walk로 별도로 확인한다.

## 4. C.2 I1/I2 연속 행렬 및 A.2 상수

원본 unit-mass bumps는 `[9,9.5]`부터 `[13,13.5]`에 있다. `lambda<=2^-200<1/100`이고 `14^lambda<=2`이다. U weight `w_lambda=-int_0^log x exp(-lambda s)ds`에는 `-w_lambda'>=1/28`, support gap이 1/2 이상이다. 따라서 `|det A_U|>=1/56`, `||A_U^-1||<=336`이다.

E point 열의 `x^(-3/2-lambda)`를 factor하면 `(sqrt2*x^(2+lambda),-x,1)`이다. second divided difference는 1 이상, gaps는 `1/2,1/2,3/2` 이상이다. source unit mass 적분을 하면

\[
 |det A_E|\ge3/(8\,14^6),\quad
 ||A_E^{-1}||\le128\,14^6<2^{30}.
\]

각 row entry가 `8,1,1` 이하이므로 adjugate row sum 48을 사용했다. source `sigma'<=9`를 가져오지 않고 위의 648 상계를 사용해도 unit-mass bump 최대 1296, `kappa_raw<2^13`이다.

실제 C.12 R-envelope가 있으면 I1의 원래 normalization을 모두 유지한 rhs가 `<=R^13/N<=2^-481`이다. `R>=8192`, `N>=R^50`를 사용했다. 그러므로 `8 beta² kappa_eff d0<=2^-605<1`이다. 그러나 R을 매개변수로 선언하는 것만으로 profiles, reciprocals, primitives, cone gaps에 대한 실제 envelope를 증명할 수 없다.

I2에서는 실제 H5-H9 improper heat moment estimate `||rhs||<=2^16/(lambda X0I2)`가 필요하다. `X0I2=XR*exp(60001T-18)`, `XR>=2^40`, `T>=128`에서 `||rhs||<2^-7552134`가 따른다. A.2 guard는 `2^-7552258`보다 작다. 모든 positive exponentials와 무한 heat tail은 그대로 유지했다. eta endpoint의 one-sided smoothness와 improper differentiation majorants를 finite sample로 대체하지 않는다.

## 5. 이번 시도에서 가장 작게 남긴 실제 source lemma

1. **NS-BRHO-ACTUAL-OPERATOR**: 실제 A.21 schedule의 양의 측도 mass, 실제 fixed fields의 B_rho membership, 그리고 literal recurrence와 원본 integrated Banach operator의 일치. 구간은 위의 I/Omega 및 `|Y|<=5`이다. 새로운 37개 exact implication이 이것의 대체 증명은 아니다.
2. **B8-ACTUAL-FIVE-HISTORY-DEBT**: node 5029의 실제 registry rhs에 대해 `max_{m<=2,eta in[-1,1]}||partial_eta^m rhs||<=15h`. rhs는 모든 natural/B22/B26/B34/restoration 이력의 차이와 원본 normalization을 포함한다. 기존 `CONTINUATION_AND_NEW_DEBT.md` (15)-(19)는 이 부등식의 수학적 경로를 제시하지만 이번 시도는 전체 이력을 다시 검증한 것으로 표시하지 않는다. 이것이 붙으면 새 matrix bounds가 branch/Jacobian 관문을 제거한다.
3. **I1-ACTUAL-C12-INPUT-ENVELOPE**: 실제 preloop E의 양성, a/p2/ts/vs 및 원본 두 monotone inverses의 정량 조건을 거쳐 C.12의 전체 R-envelope를 입력에 연결해야 한다.
4. **I2-ACTUAL-IMPROPER-HEAT-DEBT**: 실제 compactified integrands와 endpoint majorants에서 H5-H9의 full improper moment bound를 도출해야 한다.

이 ledger는 어떤 scalar 조건이 이미 계산 가능한지와 어떤 실제 함수 명제가 아직 남았는지를 분리한다. 원본 N6-01의 j=0 Proposition 9.5 tuple과 N6-02의 full physical/nonzero-angular residual acceptance는 위의 local natural/quadratic 명제만으로 완료되지 않는다.
