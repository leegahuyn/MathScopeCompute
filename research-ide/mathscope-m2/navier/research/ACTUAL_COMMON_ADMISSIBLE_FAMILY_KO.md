# 하나의 공통 선택 수열과 모든 허용 band의 실제 covariance 구성

## 1. 이 구성의 목적과 현재 경계

이 문서는 **같은 원래 계수와 하나의 재귀 선택 수열**에 대해 다음을 연결한다.

- 전체 leading 열 적분·I2 보정과 모든 양의 차수 계수의 유한 slow 미분 상수.
- 속도·potential, pressure·stress 및 원래 ζ로 가중한 stress를 함께 제어하는 수열 b_n.
- 각 band와 고정 label이 자기 배경, 대표점, 반올림한 carrier, Volterra 해와 Haar covariance 적분을 갖는 구성.
- 전체 원래 annulus에서의 determinant 하한과 양의 실제 가중치.
- 원래 두 radial 경계 인자를 이용한 모든 고정 차수의 sqrt-weight 미분 상계와 0 연장.

모든 band의 무한히 많은 그래프를 실행했다는 뜻은 아니다. 원래 매개화된 식과 동일한
유한 차수 귀납을 사용하여 보편 명제를 증명하고, 실행은 명시한 유한 prefix와 한 band를
확인한다. 실제 수치 적분 구간, 모든 label의 물리 curl 합, 전역 잔차 분해와 시간 cutoff의
물리 flatness는 각각 해당 후속 adapter가 같은 family를 소비해야 한다.

이 문서에서 사용하는 허용 영역은 원래 양의 h를 유지한 **명시적인 충분조건의 선택**이다.
이전에 미지로 남아 있던 원문 qbig/ell0의 수치를 알아냈다는 뜻은 아니다.
표시용 ell=1의 부호 장애는 이 허용 영역의 반례가 아니다.

현재 실행 결과와 실패의 구분은 §10에서 별도로 기록한다.

## 2. 실제 source와 반환 객체

새 파일은 다음과 같다.

| 파일 | 역할 |
|---|---|
| `actual-compact-all-band-background-norms.mjs` | 전체 원래 F0/U0와 양의 차수 tail의 C_m; slow 계수의 정확한 공유 본문 FTC |
| `actual-common-admissible-family.mjs` | 동일한 실제 norm 출처, 공통 재귀 b_n, 충분조건 영역과 보편 covariance 추정 |
| `actual-common-admissible-band.mjs` | 요청한 band의 실제 배경·carrier·Volterra·H·가중치 생성 |
| `actual-common-target-weighted-norms.mjs` | 같은 전체 T0의 모든 요청된 weighted slow jet 상수 |

`prepareActualCommonAdmissibleFamily`의 입력은 원래 source profile와 유한 차수·자원 예산이다.
사용자가 행렬, norm, 함수의 도함수 또는 양성 플래그를 공급하지 않는다.
반환 family는 `G`, `prepared`, `source`, `constants`, `selector`, `norms`, `leading`,
`uniformCovariance`, `constructBand`, `constructTargetWeightedNorms`를 포함한다.
각 object는 실제 내부 참조와 원래 node prefix·함수 본문·발급 program을 private seal로 결속한다.
직렬화된 certificate 자체에는 새 source를 인증할 권한이 없다.

전체 준비 차수가 3이면 positive primitive, 전체 pressure convolution, conservative moments 및
두 endpoint에서 연결한 stress도 **전체 차수 3**을 먼저 인증한다. 그 뒤 유한 diagonal
질의가 n=1,2의 norm만 선택할 수 있다. 전체 prepared prefix를 일부가 빠진 stress 기록과
결합하지 않는다.

`family.leading`은 같은 G 위의 전체 원래 F0, U0, M0, I, J, S, Cp와
`Pi0=P0+Cp`, 두 leading stress T0 성분이다. P0만을 전체 pressure로 사용하지 않는다.
Band 객체는 이 같은 source prefix의 독립 복사 위에 자기 식을 추가한다.
Target norm 객체도 별도 복사 G를 가지므로, 서로 다른 그래프의 정수 root ID를 혼용할 수 없다.

## 3. 전체 leading과 임의 유한 차수 C_m

원래 고정 rectangle은

\[
 1/2\le s\le2,\qquad X_a/2\le X\le2X_b,\qquad -1\le\eta\le1.
\]

원래 full F0에는 모든 활성화·moment 보정, I2의 실제 해와 외부 열 적분이 포함된다.
U0도 원래 전체 본문이다. 이 본문의 실제 미분을 직사각형 FTC로 적분하여 profile norm을 만든다.
Slow chart의 역미분과 multiplier `s^(-A-1/2)`, `s^(-A)`도 실제 본문에서 미분한다.

3변수 FTC는 각 부분집합 J에 대해 anchor face의 혼합 미분을 모두 포함하는 항등식

\[
 f(x)=\sum_{J\subseteq\{1,2,3\}}
 \int_{[a_J,x_J]}\partial_J f(t_J,a_{J^c})\,dt_J
\]

에서 나온다. 각 절댓값을 `sqrt(1+value^2)`로 상계하고 적분 상한을 전체 box로 늘린다.
이렇게 만든 상수는 유한한 실제 적분식이다.

새 compact constructor는 slow 계수를 그 **동일한 실제 본문을 가진** 공유 함수로 둔다.
0차 materialization이 원래 coefficient root와 문자 그대로 같음을 확인한다.
FTC가 필요한 8개 face의 도함수는 공유 함수의 `actual_expression_partial`이며
원래 본문에서 materialize할 수 있다. 작은 독립 대조에서 모든 face를 원래 AD와 비교했다.
이는 원래 sealed C_m 모듈의 식을 변경하지 않고 표현 중복을 줄이는 새 모듈이다.

전체 열 인자에서는 원래 h>0를 유지하여, 모든 유한 j에 대해

\[
 (-1)^j H^{(j)}(z)=\frac{(h)_j}{\Gamma(1+h)}
 \int_0^\infty e^{-v}v^{h+j}(1+zv)^{-h-j}\,dv,
 \quad z\ge0,
\]

\[
 |H^{(j)}(z)|\le(h)_j(1+h)_j\le j!(j+1)!
\]

를 쓴다. 원래 I2 contraction의 미분 norm이 1/4 이하이므로 implicit Jacobian 역은
4/3 이하이고, 같은 실제 해를 반복 미분하여 각 유한 eta jet을 얻는다.
이는 유한 반복값을 I2 해로 선언하는 과정이 아니다.

양의 차수는 원래 canonical c_n의 finite block과 diagonal tail을 사용한다.
고정 scale b_n에 대한 Euler cutoff 미분 상계는 b_n의 크기에 의존하지 않으므로
b_n>=c_n으로 키워도 같은 추정이 성립한다. 따라서 각 유한 m에서

\[
 \max_{|\alpha|\le m}(|D^\alpha F|+|D^\alpha G|)\le C_m,
 \qquad
 |D^\alpha(F-F_0)|+|D^\alpha(G-G_0)|\le E_m\epsilon^2
\]

형태의 source 상수를 갖는다. 구현은 성분별 상수를 보존한다. C_m은 ell, Q와 label에
독립이다. 요청하지 않은 상위 C_m root를 자동으로 발급하지 않는다.
Gaussian 혼합 jet 차수 j에는 C_(j+2), 물리 cutoff force 차수 m에는 C_(m+3)가 필요하다.

Eta의 닫힌 끝점은 z>=0/T>=0 쪽의 연속 jet이다. 원래 실수 열 적분을 음의 시간까지
연장했다고 주장하지 않는다. 활성화 collar의 복소 radial 해석성도 사용하지 않는다.

## 4. 하나의 재귀 수열 b_n

각 원래 차수 n과 m<=n에서 다음의 source-only B_(n,m)들을 모두 사용한다.

| 실제 norm 계열 | 수열의 조건 |
|---|---|
| velocity와 potential의 물리 미분 | `velocitySeminorms.rows[n-1].bounds[m]` |
| 전체 pressure와 두 stress의 물리 미분 | `pressureStressSeminorms.rows[n-1].bounds[m]` |
| normalized pressure | 동일 객체의 `normalizedPressure[n-1].bounds[m]` |
| n=1 원래 weighted stress | `n1Weighted.bounds[m]`, pole `3+3m` 유지 |
| n>=2의 T/ζ 미분 | `weightedStress`의 `bounds[m]` |
| n>=2의 실제 ∂T/ζ | 같은 행의 `directWeightedBounds[m]` |

원래 Euler cutoff 계수는 이 norm에 이미 포함된다. 이를 두 번 곱하지 않는다.
각 조건은

\[
 \log b_n\ge\frac{n\log2+\log B_{n,m}}{nh}
 \quad\Longrightarrow\quad B_{n,m}b_n^{-nh}\le2^{-n}
\]

이다. `ell_min`은 §5에서 얻는 source-only covariance 하한이다. 재귀는

\[
\begin{aligned}
 \log b_1&=\max\left(\log c_1,\log2,(\ell_{\min}+10)\log2,
          \left\{\frac{\log2+\log B_{1,m}}h:m\le1\right\}\right),\\
 \log b_2&=\max\left(\log c_2,\log b_1+\log16,
          \left\{\frac{2\log2+\log B_{2,m}}{2h}:m\le2\right\}\right),\\
 \log b_n&=\max\left(\log c_n,\log b_{n-1}+\log2,
          \left\{\frac{n\log2+\log B_{n,m}}{nh}:m\le n\right\}\right)
          \quad(n\ge3).
\end{aligned}
\]

각 중괄호에는 위 표의 모든 norm 계열이 들어간다. 전 단계는 반드시 **새 b_(n-1)**다.
독립적으로 만든 여러 수열의 단순한 점별 max는 이 16배/2배 간격을 보존하지 못할 수 있다.

각 고정 n,m의 상수는 같은 source 식을 같은 유한 FTC로 정의한다.
더 긴 query가 앞선 수학적 상수를 변경하지 않는다. `b_n>=c_n>=2^n`이므로
q>0의 모든 compact 집합에서 cutoff와 그 도함수는 유한개만 남는다.
원래 cutoff가 0이 아닌 곳에서는 q<=1/b_n이고,

\[
 B_{n,m}q^{2nh}\le2^{-n}q^{nh}
\]

를 얻는다. n=1의 endpoint pole은 이 수열의 조건만으로 없어지지 않으며
원래 Gaussian 인자와 함께 후속 weighted 추정에 그대로 전달한다.

## 5. 충분조건 영역과 모든 활성 band의 경계

원래 stress direction, 전체 배경 C2, frame의 양의 분모 하한과 concentration recipe에서
source-only B>=2^128, E=B^256, 모든 S 조건의 최대 S_min을 만든다.
Representative의 |c0|는 원래 허용 구간 `[Renv^-6,Renv^10]` 전체에 대해
양의 식의 interval rule을 적용하여 제거한다. 원래 h는 계속 양수다.

\[
 \ell_{\min}=\left\lceil\max\left(8,S_{\min},(64/h)^2\right)\right\rceil,
 \quad \ell_0=\ell_{\min}+6,
 \quad q_*=2^{-(\ell_{\min}+4)}.
\]

모든 ell>=ell0, Q=2^-ell, s∈[1/2,2]인 band는 q=Qs<q_*이고
S=ell^2는 모든 실제 concentration 조건을 만족한다.

반대 방향에는 buffer가 필요하다. q<q_*만으로 모든 활성 ell>=ell0라고 할 수 없다.
원래 band cutoff의 지지 조건은 `|ell+log2(q)|<3/4`이므로,
전체 label 합은 같은 수열에 대해 더 작은

\[
 q_{\rm global}=2^{-(\ell_0+4)}
\]

를 사용한다. 그러면 q<q_global에서 활성인 모든 ell은 ell>ell0+13/4여서 충분조건에 들어간다.
이 축소는 배경 수열을 바꾸지 않는다.

대표점은 각 원래 box 안의 고정점이다. Box 직경은 4/S^3 이하이며
모든 미분은 band·대표점·정수 label·반올림 carrier를 고정한 뒤 수행한다.
대표점의 좌표는 선언한 확대 source chart 안에 있어야 한다.

## 6. 각 band의 실제 배경과 covariance

Band constructor는 같은 family source의 복사에 자기 Q, S, epsilon, k, palette, ci, Ls를 만든다.
원래 implicit slow chart와 모든 원래 multiplier를 유지한다.

\[
 \bar F=F_0+\sum_{n\ge1}\chi(b_nq)q^{2nh}F_n,
 \quad \bar U=U_0+\sum_{n\ge1}\chi(b_nq)q^{2nh}U_n,
 \quad \bar\Pi=\Pi_0+\sum_{n\ge1}\chi(b_nq)q^{2nh}\Pi_n.
\]

Radial stream도 같은 항을 사용하고 `b_n*q*chi'(b_n*q)`에서 나오는 원래
commutator를 별도로 남긴다. 반환 `fields`는

\[
 F=s^{-A-1/2}\bar F,\quad G=s^{-A}\bar U,
 \quad b=\epsilon s^{-1/2}\bar b,\quad p=s^{-2A}\bar\Pi
\]

다. 후속 물리 adapter는 이 b,F,G,p를 직접 미분할 수 있다.

각 부호의 phase와 normal은

\[
 H=p_\theta F+p_zG,\qquad
 n=(x_0-vH_R,p_\theta/R,p_z-\epsilon vH_Z).
\]

각자의 원래 이동 압력, 기저 B, Bleft와 Bprime을 포함한 행렬로
`w'=M w`, `w(0)=(1,0)`를 만들고 원래 P와 곱하여 t=B*P*w를 얻는다.
이전에 선택한 terminal 또는 ell=1의 H나 펄스를 복사하지 않는다.

Covariance 열은 실제 원래 Haar, chi, psi 적분

\[
 H_{\theta,\varsigma}=J\int_0^{L_s}\psi^2t_rt_\theta\,dv,
 \qquad H_{z,\varsigma}=J\int_0^{L_s}\psi^2t_rt_z\,dv
\]

이며 역가중치는 실제 leading target `Tbar=s^(-A-1/2)T0(X,eta)`에 대해
`y=H^-1*Tbar`이다. 원래 `Hy=Tbar` 항등식을 실제 생성한 두 열에 대해 검사한다.

기본 실행 band는 `ellA=ceil(log2(4*b1))`이다. 새 b2>=16b1에서
그 band의 n1 cutoff는 plateau, n>=2 cutoff는 정확히 0이다.
이 사실은 기본 실행을 유한하게 줄이는 이유이며, 보편 증명에서 다른 band의
양의 차수 항을 제거하는 근거로 사용하지 않는다. 다른 유한 band를 요청하면
충분한 실제 계수·selector prefix가 있어야 하고, 없으면 RESOURCE_LIMIT로 거절한다.

## 7. 원래 소스에 결속된 determinant와 양성

전체 C2와 같은 box의 leading jet, epsilon^2 근접성은 frozen jet 오차를 B^5/S^3 이하로 준다.
실제 rounding 오차와 v<=Lmax*S를 포함하면 normal/normal-prime 오차는 B^12/S 이하이다.
원래 Bs, tangential normal, c0의 양의 하한을 사용하는 frame의 product·inverse·sqrt ledger에서
모든 실제 operator·damping·단위방향·slope 오차는 B^256/S 이하이다.

이는 각 band의 실제 행렬을 reference로 바꾸는 항등식이 아니다.
오차 E_actual을 실제로 남긴

\[
 M=\operatorname{diag}(0,-2\lambda)+E_{\rm actual}-(d-d_{\rm ref})I
\]

에서 Riccati cone과 concentration 추정을 적용한다. Infinity logarithmic norm은
`mu∞(M)<=(2E+Ed)/S`이고, 원래 propagator는
`W=exp((2E+Ed)*Lmax)`로 제어된다. exp(matrixNorm*Ls)를 사용하여 band에 따라
지수 폭발하는 상수를 만들지 않는다.

원래 positivity/concentration recipe의 질량 하한·상한은

\[
 Jc_*\sqrt{L_s}\le m_\varsigma\le J W_*^2L_s.
\]

같은 Haar 인자와 `ci*Ls=2r0`, `1/(Tg*S)<ci<=1/S`를 사용한다.
정규화된 determinant의 절댓값은 15/8과 17/8 사이이며 원래 열 순서의 determinant는 음수다.
따라서 program에 보존된 양의 source 상수 d_*에 대해

\[
 |\det H|\ge d_*/S,\qquad \max_{ij}|(H^{-1})_{ij}|\le K_{\rm inv}S.
\]

목표 방향은 같은 원래 leading stress direction에서 온다.
그 norm/각도 하한, chart factor와 Ac의 source 상한을 결합하면
`targetScale>=Renv^-128*zeta`이다. 정규화 역가중치 하한 `kappa/64`와
실제 mass 상한을 사용하면

\[
 y_\varsigma\ge c_y\zeta>0
\]

를 전체 열린 radial annulus에서 얻는다. d_*, K_inv, c_y는 실제 원래 norm과
concentration recipe의 양의 root로 저장되며 caller 입력값이 아니다.

## 8. 전체 원래 T0의 weighted jet 상수

`y=log(X/Xa)`, `delta=log(Xb/X)`, `delta_*=min(1,y,delta)`라 쓰고

\[
 \zeta=\exp(-t_1^2/y^2-4/\delta^2)
\]

의 열린 annulus 표현을 사용한다. 원래 전체 factorization은 다음과 같다.

| 영역 | 보존하는 실제 factorization | norm box |
|---|---|---|
| Inner | `T0=exp(-t1^2/y^2)*g_a(y)*(btheta,bz)` | 0<y<=t1/4, eta∈[-1,1] |
| Outer | `T0=exp(-4/delta^2)*delta^-3*(btheta,delta^6*bz)` | 0<delta<=1/2, eta∈[-1,1] |
| Middle | 실제 전체 T0의 미분을 원래 양의 ζ로 나눈 본문 | y>=t1/8, delta>=1/4 |

Inner factor의 자연계열, Ka, 모든 nonlinear moment 차이와 outer의 원래 Gamma·heat,
복구된 전체 moment와 두 shear 항을 보존한다. 이전 inner/outer identity의 증명은
동일한 원래 source 본문에 대한 것이므로 b_n을 바꿔도 leading T0의 factorization은 같다.
원래 source profile가 같다는 플래그만을 factorization 증명으로 사용하지 않는다.

Regular coefficient의 각 요청된 미분은 실제 본문을 가진 공유 함수로 생성한다.
거꾸로 된 거리 `width-distance`를 사용하여 FTC anchor를 양의 t1/4 또는 1/2에 둔다.
0 끝점은 dominated regularity로 정당화한 적분 끝의 한쪽 극한으로만 사용한다.
발산하는 역거리 식을 0에 직접 대입하지 않는다.

Inner/outer 원래 적분의 지수 weight는 모든 고정 차수 미분의 다항식 인자를 지배한다.
Middle은 원래 full heat/I2/moment의 매끄러운 본문과 양의 ζ를 가진 compact rectangle이다.
두 collar는 middle과 겹치므로 전체 annulus를 덮는다.

각 Gaussian은 다음의 정확한 Laurent 귀납을 따른다.

\[
 \frac d{dt}\left(e^{-a/t^2}\sum_pc_pt^p\right)
 =e^{-a/t^2}\sum_p\left(pc_pt^{p-1}+2ac_pt^{p-3}\right).
\]

원래 ordinary X 미분은 첫 Stirling 수에 의한 log-X 미분의 완전한 선형결합이다.
Leibniz와 이 귀납에서 radial j차가 늘리는 pole은 최대 3j이다.
Eta 미분은 Gaussian이 아닌 regular factor에만 작용한다.
원래 slow coefficient 전개와 `s^(-A-1/2)`를 함께 적용하면

\[
 |D^\alpha_{R,Z,T}\bar T|\le N_m\zeta\delta_*^{-(3+3m)},
 \qquad |\alpha|\le m
\]

이다. 모든 N_m은 같은 source의 실제 유한 FTC 식이며 ell과 label에 독립이다.
실행에서 생성한 유한 m과 이 임의 고정 m 귀납은 구분한다.

## 9. 실제 제곱근의 모든 고정 차수와 0 연장

고정한 band와 label에서 C_(m+2)는 M과 B의 모든 필요한 slow/fast jet을
source 상수와 S의 유한 거듭제곱으로 제어한다. 초기 데이터의 slow 미분은 0이다.
안정 propagator에 Duhamel을 적용하면 w의 각 고정 jet도 S의 유한 다항식으로 제어된다.
원래 P는 slow 독립이고 양의 Gaussian 상계를 갖는다.
H 미분은 고정 구간에서 실제 t_r*t_tan를 Leibniz 미분한 적분이다.

먼저 실제 식 `H*Hinv=I`를 미분한다.

\[
 D^\alpha H^{-1}=-H^{-1}\sum_{0<\beta\le\alpha}
 {\alpha\choose\beta}(D^\beta H)(D^{\alpha-\beta}H^{-1}).
\]

이전 determinant 하한은 각 차수의 Hinv에 다항식 S 상계를 준다.
그다음 `y=Hinv*Tbar`를 미분하면 각 y jet은
`sourceConstant*S^p*zeta*delta_*^-d`로 제어된다.
마지막으로 sigma=sqrt(y)>0에서

\[
 2\sigma D^\alpha\sigma=D^\alpha y-
 \sum_{0<\beta<\alpha}{\alpha\choose\beta}
 (D^\beta\sigma)(D^{\alpha-\beta}\sigma)
\]

를 사용한다. 분모는 `2sqrt(c_y*zeta)` 이상이고 분자의 모든 항은 ζ를 포함하므로
각 고정 jet은

\[
 |D^\alpha\sqrt y|\le C_\alpha S^{p_\alpha}
 \sqrt\zeta\,\delta_*^{-d_\alpha}
\]

이다. 원래 두 Gaussian은 모든 유한 pole을 흡수한다.
고정 차수마다 지수의 절반을 남기면 모든 양의 소멸 차수에 대한 bound를 얻는다.
따라서 각 radial 경계에서 모든 고정 jet의 한쪽 극한은 0이고, 그 밖을 0으로 정의한
실제 sqrt weight는 매끄럽다. 경계나 외부에서 먼저 H^-1 또는 sqrt를 평가하는 정의를 쓰지 않는다.

이 논증은 같은 source 함수와 같은 b_n에 대한 모든 고정 차수 귀납이다.
미분 차수가 올라갈 때 새로운 q 임계값으로 바꾸지 않는다. 고정된 양의 q의 compact
부분에서는 원래 label 합이 locally finite하다. Eta 끝점의 시간 방향은 §3의 한쪽 범위를 유지한다.

## 10. 실행 결과와 보존한 실패

최종 actual-common-admissible-family source attempt3는 **8/8 PASS, 실제 exit0**으로 끝났다.
하나의 실제 준비 과정에서 C3·전체 positive source prefix3, n1/n2의 모든 diagonal norm,
새 band의 두 실제 Volterra/H와 역가중치, target weighted N0..N2를 생성했다.

| 실제 실행 근거 | 결과 |
|---|---|
| 외부 process | exit0, timeout=false |
| 경과 시간 | 271.440953161초 |
| peak RSS | 3,938,156,544 bytes |
| 공통 family 내부 결속 | 9/9 |
| 자기 band 내부 결속 | 16/16 |
| weighted target 내부 결속 | 9/9 |
| 실제 literal import closure | 92/92 실행 전후 및 최종 검토 시점 SHA 일치 |
| 일반·음성대조 검사 | 6/6 PASS |
| 실제 FTC target 행 | 36개, 각 4개 face |

발급된 세 program은 서로 다른 명시적 graph namespace를 가진다.

| graph | nodes | canonical bytes | SHA-256 |
|---|---:|---:|---|
| family | 622,781 | 28,446,215 | `bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219` |
| own band | 627,497 | 28,187,395 | `5912d073e58d1f587395d4478b5ad704f63530f8bd5219cca54da1d95c39f3ff` |
| weighted target | 630,060 | 27,977,396 | `df0cd7314d4c5b8bf70e90ce3f6d18812861ee41a455817d9a3c0aba1c2a7add` |

[최종 source JSON](evidence/common-admissible-family-20261011/actual-common-admissible-family-source-attempt3.json)의
SHA는 `ab068695261541789783ab5feb8d38ae6d6798ebb42151a259ca05ed3f9b37ca`다.
[실제 process 기록](evidence/common-admissible-family-20261011/actual-common-admissible-family-source-attempt3-process.json)은
`b6b5b6a6c83c0ff79079fa6296993048302b782fc720e596af90299db6f69c90`이다.
최종 source JSON, 로그와 process 기록은 코드 snapshot과 분리하여 보존했다.

- 기존 C_m 패킷은 그대로 동결되어 있다. 새 compact 모듈의 body-sharing 및 모든 8개
  face derivative 대조를 포함한 공통 경량 검사 6/6은 통과했다.
- Attempt1: C3 prepared와 n1/n2 moments만 연결하여 n3 stress 본문이 빠진 인터페이스 실패.
  0/8, 실제 exit1. 원래 코드 snapshot과 로그를 보존했다.
- Attempt2: 전체 prepared3로 수정하고 같은 C3를 compact FTC로 표현했다.
  공통 family, 실제 자기 band의 두 Volterra/H, 역행렬 및 witness 검사가 통과하여 6/8이었다.
  Target weighted 내부 수학 검사는 통과했지만 outer.copy 함수를 program metadata에 넣어
  JSON 직렬화가 거절되었다. 실제 exit1, 191.117초, peak 3,828,449,280 bytes.
- Attempt3 수정: 실제 함수 본문은 그대로 두고 직렬화되는 metadata를 roots, 복사 대응,
  연산 목록과 kernel provenance로 명시적으로 구성했다. 작은 실제 factor-copy fixture에서
  같은 program 직렬화를 먼저 검사했다.

각 실제 실행은 입력, 명령, 실행 전후 import SHA, 원래 실행 시점의 runner SHA, 로그,
자원 사용량과 실패 당시 새 코드 snapshot을 따로 보존한다.
설계된 음성대조와 실제 구현 실패를 서로 바꿔 분류하지 않는다.

## 11. 후속 adapter가 이어야 하는 부분

이 family의 실제 공통 데이터에 같은 band의 물리 curl 및 전체 label 합을 붙여야 한다.
원래 시간 cutoff의 잔여항은 source Gaussian으로 따로 flatness를 증명한다.
그 뒤에도 실제 nonlinear/curl/eikonal 잔여항은 원래 다음 단계에 전달할 정확한 항으로 남긴다.
이들을 전부 0으로 만들거나 전부 flat이라고 선언하는 것이 현재 구성의 목표는 아니다.

수치 미분의 외향 구간, 기존 공개 실행 경로의 통합·검증, 전체 M2 관문은 별도로 판정한다.
이 문서는 전체 M2 완료 또는 M3 시작 허가를 단독으로 발급하지 않는다.

### 직접 연결하는 선행 증거

- [전체 leading 포함 C_m](ACTUAL_ALL_BAND_BACKGROUND_NORMS_KO.md)
- [전체 annulus covariance](ACTUAL_ADMISSIBLE_ANNULUS_COVARIANCE_KO.md)
- [원래 inner factor와 0 연장](ACTUAL_INNER_COVARIANCE_FLAT_EXTENSION_KO.md)
- [원래 outer factor와 0 연장](ACTUAL_OUTER_COVARIANCE_FLAT_EXTENSION_KO.md)
- [공통 실행 증거 디렉터리](evidence/common-admissible-family-20261011/)
- [공통 source·수열·covariance·weighted target의 독립 검토](INDEPENDENT_COMMON_ADMISSIBLE_FAMILY_REVIEW_KO.md)
