# 동일 N3 leading 함수의 고차 미분과 전역 Ω 적분 상계

## 1. 이 계산이 확장하는 것

`actual-leading-high-jets.mjs`는 원래 고정 profile
`same-profile-2026-10-10.3`의 **leading (U_0,M_0,V_0)** 에 대한
추가 유한 미분 상계를 생성한다. 원래 C12 문서의 (C_eta^2) 상계를
그대로 (C_eta^6)이라고 읽지 않는다. 아래에서 실제 축 계수, B22/B26,
B34, B8의 같은 근, 원래 C1 loop, 같은 C12 주파수, I1의 같은 근,
outer Amp의 같은 양의 근을 다시 미분한다.

상수와 넓이, 압력, 함수, root 또는 norm을 caller가 넣을 수 없다.
반환하는 상계는 실제 signed 모멘트의 값이 아니다. 이 문서만으로
completed positive-order background, 평평한 경계의 정규화 방향,
일반 label의 실제 공분산 열을 인증하지 않는다.

고정 기호는 원래와 같다.

\[
Q\ge2^{260},\quad \Lambda=Q^{64},\quad \rho^{-1}<Q,\quad
C=(1+Q^{300})^{10}\exp(Q^{200}),
\]
\[
t_1=C^{-120},\quad S=C^{100000},\quad
\mathcal E_k=\exp(S^k),\quad R=\mathcal E_{256},\quad
N=1+\lceil R^{50}\rceil.
\]

실행 검사는 parameter expression을 이 식과 대조한다.
또한
\(e^{Q^{200}}>Q^{10200}/51!>Q^{10000}\) 을 정수로 검사한다.
이하 유한 개의 큰 정수 계수도 모두 그 같은 (C)에 흡수한다.
큰 숫자를 십진수로 펼치거나 (0,\infty)로 저장하지 않는다.

근거 원문 8개의 byte/SHA는 runtime의
`ACTUAL_LEADING_HIGH_JET_BINDINGS`에 고정한다. 이 문서는 그 문서들에
이미 증명된 pointwise 양의 하계 및 실제 함수의 정의를 사용한다.
새 고차 미분 비용은 다음의 별도 유한 계산으로 만든다.

## 2. 미분 산술의 규약

처음에는 ordinary mixed derivative의 최댓값을 사용한다. (n)차까지
미분할 때 (k)개 인자의 Leibniz 계수 합은 (k^n) 이하이다.

\[
[f]_n\le C^b,\quad f\ge C^{-a}>0
\quad\Longrightarrow\quad
[1/f]_n<C^{(n+1)a+nb+1}.
\]

이는 고정 중심에서

\[
\frac1{f_0+v}
=f_0^{-1}\sum_{k=0}^{n}(-v/f_0)^k+O(|v|^{n+1})
\]

를 미분해 얻는다. 코드의 reciprocal row는 사용한 (a,b,n), 유한
계수 합, (C)의 추가 지수를 모두 보존한다. 로그의 값에 큰 상계를
넣은 뒤 다시 지수화하지 않는다. 지수의 미분에는 **이미 알고 있는
실제 함수의 양의 값 상계**와 Bell/Leibniz 계수만 사용한다.

loop부터는

\[
\|f\|_n=\sum_{|\alpha|\le n}
\frac{\sup|\partial^\alpha f|}{\alpha!}
\]

를 쓴다. 이 norm은 곱에 대해 submultiplicative다. ordinary derivative
최댓값에서 이 norm으로 갈 때의 유한 multi-index 합은 별도의 (C)
한 지수 안에 넣는다. ordinary 6차 미분과 이 norm을 같다고 하지 않는다.

## 3. 실제 smooth step과 자연계수의 추가 미분

원래
\(f(t)=e^{-1/t^2}\),
\(\sigma(t)=f(t)/(f(t)+f(1-t))\) 를 그대로 쓴다.
새 step 계산은

\[
f^{(k)}=fP_k(1/t),\qquad
P_{k+1}=2z^3P_k-z^2P_k'
\]

를 (k=12)까지 정확한 정수 다항식으로 실행한다. 차수는 36 이하이고
\(\sup_{z\ge0}z^m e^{-z^2}\le18^{18}\) 이다. 출력되는 실제 계수 합과
이 수의 곱은 (2^{160})보다 작다. 분모는 (e^{-4}>1/128)이고,
역수 Taylor 계수를 다시 계산하면

\[
|\sigma^{(k)}|<2^{4096}<Q^{16}\qquad(0\le k\le12)
\]

가 나온다. 소스 step의 정의와 flat endpoint는 바뀌지 않는다.
B8 bump의 반지름 8차 미분에는 실제로 \(\sigma^{(9)}\)가 필요하므로,
종전 8차 결과를 무단 재사용하지 않는다. 여유 있는 12차 확장이 이를
포함한다.

자연계수에는 `SAME_DATUM_ANALYTIC_AXIS.md` (16)을 사용한다.
\(0\le Y\le41/10\), \(\eta\in[-1,1]\)에서

\[
|\partial_Y^k\partial_\eta^m f|
\le Q\rho^{-m}
\frac{(m+k)!}{(m+1)^2 20^k}
(200/159)^{m+k+1}.
\]

\((Y\partial_Y)^r=\sum_k S(r,k)Y^k\partial_Y^k\) 의 Stirling 정수까지
넣은 모든 (r+m\le12) 계수를 정확한 유리수로 계산한다. 각 계수는
\(2^{260}\)보다 작으므로 실제 미분은 \(Q^{m+2}\le Q^{14}\) 이하다.
이는 비교용 Bessel 함수의 norm이 아니라 실제 무한 Banach 해의 norm이다.

## 4. 실제 premodulation의 mixed 8-jet

### B22 reference와 실제 B26 source

자연 \(\Phi\ge1/4\)와 위 계수로 reciprocal 12-jet의 지수는 182,
비상수 log/\(Y\Phi_Y/\Phi\)의 지수는 199 미만이다. 공통 (Q^{512})
여유를 둔다. B22에서는 원래 식

\[
R_r(X)=\Phi(4e^{t_1})e^{v(X)},\qquad
v=\int_{t_1}^{\min(y,2t_1)}\alpha(s)
\frac{Y\Phi_Y}{\Phi}(4e^s)\,ds
\]

를 쓴다. 모든 필요한 eta 미분의 적분은
\(Q^{512}t_1<Q^{512-1200000}<1\) 이다. 따라서 (e^v\le2)라는 실제
값에 finite Bell rule을 적용할 수 있다. (R_r)의 실제 범위는
\(1/4\le R_r\le2\)로 보존되며, 그 ratio
\(R_r(sX)/R_r(X)\)의 eta jet도 계산한다. 작은 (g\)를 별도로 나누지 않는다.

반지름 미분은 짧은 width의 역수를 잃는다. 정확히
\(t_1^{-\max(r-1,0)}\)를 기록한다. 필요한 reference field mixed jet의
공통 Q 지수 16384는 실제 finite Bell 지수 (12\cdot512+2)보다 크다.
원래 압력은
\(\Pi_r=P+\int_0^X F_r^2\,dx\),
\(D_y\Pi_r=XF_r^2\) 이다. 이 regular integral과 원래 strip datum을
포함하면 압력의 공통 지수 40000이 충분하다.

원래 source는 정확히 다음을 포함한다.

\[
S_{q,r}=-W_rl_r-h(1-2\eta U_r)-H_{c,r}(\log F_r)_\eta,
\]
\[
S_{n,r}=-W_rD_yU_r-A(1-2\eta U_r)U_r-H_{c,r}(U_r)_\eta
-d(\Pi_r)_\eta+4A\eta\Pi_r+2\eta D_y\Pi_r.
\]

세/여섯 항과 한 번 더 필요한 eta 미분을 모두 넣은 지수 50000은
위의 곱 비용을 초과한다. radial average에는
\(D_y\operatorname{Avg}U=U-\operatorname{Avg}U\)를 쓴다.

그 후 원래 적분식

\[
p_{1,r}=\frac X L\int_0^1s\frac{R_r(sX)}{R_r(X)}S_{q,r}(sX)ds,
\quad n_{s,r}=\frac1L\int_0^1S_{n,r}(sX)ds
\]

과 원래 미분식

\[
D_yp_{1,r}=XS_{q,r}/L-l_rp_{1,r},\qquad
D_yn_{s,r}=S_{n,r}/L-n_{s,r}
\]

을 사용한다. 필요한 total order 범위 안에서 최대 9회 radial recurrence의
Q 지수는 (100000+9(512+3)=104635<200000)이다.
B26의 원래 kappa, beta, blend 곱은 (Q^{210000}) 안에 들어간다.
이때 eta 적분 길이 \(\log(110\Lambda/4)<Q^2\)와 radial width loss를
모두 유지한다. 두 종류 손실을 서로 바꾸지 않는다.

\(Q^{210000}<C^{21}\), 실제 (E<C^2), total order8로부터

\[
[E]_8,[U]_8<C^{2+8\cdot21+7\cdot120+1}
=C^{1011}<C^{2048}
\]

가 나온다. B34는 (T_{sh}\ge1), 실제 endpoint log jet와 같은 finite
Bell rule을 사용한다. ideal segment와 unit-width axial restoration도
같은 2048에 포함된다.

### 실제 B8 root의 eta 8차

incoming moment의 가장 큰 density는 \(\sqrt{2X}UE\) 이다.
그 eta8 product에 (2\cdot2048+7+1), integration에 12,
유한 segment 합과 radial product에 두 지수를 더해도 (4118<4120)이다.
원래 다섯 정규화에는 \(K_\eta^{-1}\), \(\mu^{-1}\),
\(dJ-4\eta dI\), \(dS-8\eta dM\)가 모두 있다.
이들의 유한 polynomial eta jet를 넣으면 지수 4130으로 충분하다.

B8의 실제 rational preconditioner row norm을 파일에서 다시 더한다.
그 값은 (2^{30}<C)이다. 실제 residual norm과 실제
\(\mu(B_U+B_E)\)를 곱하여 preconditioned Jacobian 손실이 (1/4) 미만임을
다시 검사한다. 따라서 inverse norm은 2 미만이고,

\[
b_m=2\left(C^{4131}+\sum_{k=1}^{m-1}
{m\choose k}b_kb_{m-k}\right)
\]

가 실제 ordinary root derivative를 상계한다. (z_0) 항은 이미
Jacobian 안에 있다. 위 recurrence를 (m=8)까지 다항식으로 실행한다.
최종 차수 33048와 실제 계수 합을 흡수하면 (C^{33049})다.
이 높은 미분들이 여전히 (10^{-6})라고 주장하지 않는다.
원래 (K_\eta\mu z_j b_j)와 bump의 log-radius 미분을 합해도

\[
[E]_8,[U]_8<C^{65536}
\]

이며, premodulation 전체의 같은 field에 적용된다.

### 실제 loop 입력

모멘트 mixed7의 지수는 (2\cdot65536+32)로 둔다.
원래 pointwise (E>C^{-3}), (a>C^{-122})를 보존하고 원래 식

\[
p_1=L^{-1}\{-XW+H^{-1}((1-h)I-D\eta I_\eta-dJ_\eta
 +2(h-D)\eta J)\},
\]
\[
p_2=(LE)^{-1}\{-XWU+D(M-\eta M_\eta)+4h\eta S_m-d(S_m)_\eta
 +X(4A\eta\Pi-d\Pi_\eta)\}
\]

에 finite reciprocal/product rules를 실행한다. 특히 (-XWU)를 남긴다.
shear (a,b_s), (t_s,v_s,c_s,j_s), 역수까지 포함한 실제 mixed6
ledger는 (C^{3802199}) 안에 든다.

\[
e^{C^{200000}}>\frac{C^{4200000}}{21!}
>C^{4199999}>C^{3802199}
\]

를 실행하므로 공통 high-jet bound는 \(\mathcal E_2\)이다.
이는 원래 **pointwise** (S)와 양의 cone gap을 재선정하지 않는다.

## 5. 같은 C1 loop를 total 6까지 미분

원래 \(\mu_{max}=S^{12}\), \(d_0=(8S)^{-1}\),
\(\delta_L=e^{-S^{16}}\)를 유지한다.
\(M(z)=\langle e^{z\sin\theta}\rangle\),
\(\mathcal R=M(2z)/M(z)^2\)에서 실제 removable quotient는

\[
Q(z)=\int_0^1(1-s)\mathcal R''(sz)ds.
\]

원래 (M,1/M,\mathcal R)의 8차 상계가 (Q)의 6차를 준다.
\(Q\ge\mathcal E_{14}^{-1}\),
\(W_\mu\ge\mathcal E_{14}^{-1}\)를 그대로 사용한다.
(W=d_0\mu\sqrt{Q(\mu p_2)})와 cutoff right side의 square root는
각 양의 분모를 보존한 finite Taylor recurrence로 미분한다.
right side의 support에서는 (v_*-v_s\ge\delta_L/4)이다.
밖의 영 extension은 원래 sigma의 flatness로 같은 bound를 갖는다.

각 displayed algebra stage의 미분 비용은 다음의 실행된 enclosing
template 안에 든다. (H\ge1)에 대해

\[
J(H)=H\sum_{k=0}^6(3H^2)^k.
\]

이는 positive reciprocal, positive square root, 최대 세 입력의
finite Taylor composition을 상계한다. 실제 각 stage는 최대 세 번의
이러한 nesting, 최대 여덟 product와 (2^{80})보다 작은 고정 계수로
분해된다. 코드가

\[
2^{80}[J(J(J(H)))]^8
\]

의 degree 17576, 계수 합의 bit length 14793을 실행한다.
따라서 \(H=\mathcal E_a\)일 때 log multiplier는
\(17576+14793+1=32370<65536<S\)이다. 이 과정을 통해 무계산의
“일정한 상수”를 쓰지 않고 아래 표의 손실을 확인한다.

| 실제 함수 | 새 total6 norm 상계 |
|---|---:|
| (Q)의 필요한 미분, inverse | \(\mathcal E_{15}\) |
| (W), square root | \(\mathcal E_{19}\) |
| 원래 cutoff right side | \(\mathcal E_{20}\) |
| (F(\mu,y,\eta)=W-r)의 mixed6 | \(\mathcal E_{22}\) |
| 같은 implicit \(\mu\) | \(\mathcal E_{32}\) |
| 실제 (t) | \(\mathcal E_{35}\) |
| circle density / lift | \(\mathcal E_{38},\mathcal E_{39}\) |
| 같은 inverse circle | \(\mathcal E_{48}\) |
| 원래 loop | \(\mathcal E_{64}\) |
| 원래 zero-mean (A,B) | \(\mathcal E_{128}<R\) |

implicit step 자체는 일반 “chain-rule 상수”로 넘기지 않는다.
원래 식을 실제 근에서 Taylor 전개하여 (w(0)=0), (F_{00}=0)으로 놓고,

\[
w_m\le H\,[t^m]\sum_{i+j\le m,(i,j)\ne(0,0),(0,1)}
H t^i w(t)^j
\]

를 정확한 positive polynomial로 실행한다. ((0,1)) 항은 실제
Jacobian으로 옮겨서 나누었다. (m=6)의 degree는 22이며 실제 계수
합도 저장된다. (H=\mathcal E_{22})에서 이 polynomial은
\(\mathcal E_{23}\)보다 작다. circle inverse에도 같은 recurrence를
새로 적용한다. 그 실제 density 하계는 (1/(16S^2))다.

원래 (t)는 (p_2)로 나누지 않고

\[
t=t_s+d_0\mu\int_0^1
\partial_z\{e^{z\sin\theta}/M(z)\}_{z=s\mu p_2}ds
\]

로 미분한다. 필요한 numerator 미분은 7차까지이며 원래 8차 bound에
포함된다. 두 primitive의 원래 평균 subtraction과 (B)의 (E) 인자를
유지한다. 한 circle의 lift만 미분하고 seam에서 맞춘다. (N\log X)의
큰 값으로 periodic function의 norm을 대체하지 않는다.

## 6. 같은 N에서 C12와 실제 I1의 eta6 복구

phase에 eta 의존성이 없으므로 factorial (C_\eta^6) norm에서도

\[
\|e^{A/N}-1\|_6\le3R/N,\quad
\|\Delta E\|_6,\|\Delta U\|_6\le4R^2/N.
\]

다섯 실제 nonlinear density difference를 적분하면 (R^6/N),
전체 I1 정규화 row operator는 (R^7) 이하다. 특히 두 번째 row의
\(\lambda^{-2}\)와 두 항을 없애지 않는다. I1의 (K,1/K)는 실제
reserved power-law coefficient의 rational eta factor이므로 eta6도
(R) 안에 든다.

실제 continuous matrix의 determinant/cofactor bound는
\(\|A_{I1}^{-1}\|_\infty<2^{30}<R^3\)다. 따라서

\[
\beta=R^{16}/N
\]

가 inverse를 적용한 실제 debt의 factorial eta6 norm을 감싼다.
같은 quadratic operator의 preconditioned norm은 (2^{36}) 미만이다.
factorial (C^6) algebra에서 반경 (2\beta)의 contraction을 적용한다.
그 Lipschitz bound는 (2\lambda2^{36}\cdot10^{-6}<1/4)보다 작다.
이는 기존 (C^0) root box 안에 있으므로 같은 원래 branch다.
높은 미분의 norm을 고정 box radius에서 잘못 추론한 것이 아니다.

실제 bump를 복구한 뒤 field change는 (R^{20}/N), partial moment
change는 (R^{24}/N) 이하다. 모두 같은 (N>R^{50})에서 1보다 작다.
I1 이후의 **실제 (M) 함수 일치**는 다섯 defining moment equations에서
온다. \(\Delta U\)의 compact support만으로 결론내리지 않는다.

빠른 반지름 미분은 별도다.

\[
D_y\frac{B(y,\eta,Ny)}N
=\frac{B_y(y,\eta,Ny)}N+B_\phi(y,\eta,Ny).
\]

eta5까지의 이 식은 실제 loop total6으로 감싼다. 두 번째 항은 작다고
놓지 않는다. 보정 이후 (D_yU)의 eta5 norm도 유한 (R^2) 안에 든다.

## 7. I1 바깥의 실제 outer Amp 미분

여기에는 원래 (M,J)와 total (S)를 맞추는 실제 Amp가 들어간다.
고정된 일차 함수로 대체하지 않는다. 먼저 coefficient 함수만
\(\operatorname{dist}(\eta,[-1,1])\le1/4\)에 holomorphic하게 연장한다.

\[
9/16\le|1+\eta^2|\le41/16,\quad |f|<2,\quad |f^{-1}|<3.
\]

angular interpolation의 integrating factor에서
\(|r_{after}|\le24\), \(r_{eq}\le2\)이고, 실제 angular debt는
\(26e^3\lambda^{29}<1024\lambda^{29}\)다.
원래 matrix inverse (<4), quadratic row (<64)로 복소 ball
\(2^{16}\lambda^{29}\)에 contraction을 실행한다.
그 real restriction은 기존 실제 small root와 같고, 이 holomorphic
coefficient를 Cauchy radius (1/8)로 미분한다. Amp 자체를 복소수의
임의 sqrt branch로 확장했다고 가정하지 않는다.

전체 original outer energy에는 모든 stage와 angular correction,
terminal wait, 그리고 정확한
\(E_{pow}(X_b)^2 X_b/(2h)\) tail을 포함한다.
\(X_b<C^{11}\), scalar outer height (<C^2\), (h^{-1}<C\)에서
그 절댓값은 (C^{20}\)로 충분하다. height는 최초 transition의 증가
\(\le e^{1/10}\), 이후 감소/상대 angular factor (<2\)와
\(P_*=e^{2T}<C\)에서도 직접 얻는다.
normalized (E)의 추가 인자는 (C^3) 미만이다.
원래 two-by-two pulse inverse (<4/\lambda<C^2\), 실제 affine
coefficients (<C^5\), 고정 positive bump weights (<30\)을 사용하면
실제 Amp polynomial의 세 coefficient complex norm은 (C^{32}\) 안이다.
Cauchy eta8까지의 추가 정수 비용은 (C) 하나 안에 있으므로
여유 있는 (C^{50})을 쓴다.

실제 real root (A_0\in(9/10,6/5)\)에서는 (F_A\ge7/20)이다.
\(A=A_0+w\)로 이동하면 coefficient bound에서

\[
b_m=3C^{50}\left(7+5\sum_{i=1}^{m-1}b_i+
\sum_{i,j\ge1,i+j\le m}b_i b_j\right)
\]

가 나온다. 이 Taylor recurrence와 마지막 (m!) 변환을 (m=8)까지
실행하면 (C^{751})이 충분하다. 원래
\(U=E(\mathrm{Amp}R_0+\text{두 affine bump})\)와 한 번의 log-radius
미분, 실제 primitive (M)도 (C^{4096}<R) 안에 든다.

원래 (M,J) moment equations에서 (X\ge X_v)의 (U=M=V=0)을
사용한다. 열전도 준비와 I2는 (E)만 바꾸므로 이 (U,M,V) 함수와
그 eta/radial 미분은 바뀌지 않는다. 이 마지막 사실은 (E) 자체의
전역 eta8 norm을 인증했다는 뜻이 아니다.

## 8. 전역 regular Ω integrand와 실제 적분의 오차

이제 같은 원문 source에 대해

\[
\|U_0\|_{\eta,6},\|\operatorname{Avg}_XU_0\|_{\eta,6}<R^2,
\qquad \|M_0\|_{\eta,6}<R^3.
\]

평균은 실제 적분 \(\int_0^1U_0(tX)dt\)다. 원래 정칙 복원은

\[
v=V_0/X=
\frac{2\eta U_0-2D\eta\operatorname{Avg}U_0
-d\partial_\eta\operatorname{Avg}U_0}{L}.
\]

factorial derivative shift에 최대 6을 주고 geometric coefficient를
곱하면 \(\|v\|_{\eta,5}<64R^2<R^3\)다.

core의 physical (X) 미분은 자연계수의 (Y=\Lambda X) 식에서 직접
계산한다. (U=U_*+u(\Lambda X)/\Lambda)이므로 불필요한 (1/X)가 없다.
J에서는 (X^{-1}\le R)와 위의 정확한 fast-phase 식을 사용한다.
바깥에는 (X>1)이며 Amp derivative 계산이 적용된다.

\[
\|\partial_XU_0\|_{\eta,5},\quad
\|\partial_X\operatorname{Avg}U_0\|_{\eta,5},\quad
\|\partial_Xv\|_{\eta,5}<R^5.
\]

원래 Ω 부분적분은 여섯 regular integrand만 필요하다.

| 이름 | integrand | eta5 norm 지수 | physical X 미분 norm 지수 |
|---|---|---:|---:|
| (J_m) | (v) | 3 | 5 |
| (J_0) | (Xv) | 4 | 7 |
| (H_m) | (Uv) | 6 | 9 |
| (H_0) | (XUv) | 7 | 11 |
| (K_{m2}) | (v^2) | 7 | 9 |
| (K_{m1}) | (Xv^2) | 8 | 11 |

표의 같은 기호를 ([0,X_v])에서 적분한 값으로 쓰면

\[
\int\frac{\Omega_0}{2X}dX
=\frac{D\eta\partial_\eta J_m+d\partial_\eta H_m-2A\eta H_m}{2L}
+K_{m2}/4+V_{0,X}(0),
\]
\[
\int\frac{\Omega_0}{2}dX
=\frac{D\eta\partial_\eta J_0-J_0+d\partial_\eta H_0+2D\eta H_0}{2L}
-K_{m1}/4.
\]

실제 axis 항은
\([2A\eta(4\eta+j_0)-4d]/L\)이고 생략하지 않는다.
위 적분의 eta4 factorial norm에는 (R^{13})이 충분하다.
특히 η4 pressure/flux에는 실제 leading η6가 필요했다는 점을 보존한다.

각 regular integrand의 eta5 value/X-derivative norm은 (R^{12})
미만이다. (X_v<R)이고 support 이후 exact zero이므로, (n)등분
left rectangle의 실제 error는

\[
\left\|\int_0^{X_v}f-\frac{X_v}{n}
\sum_{j=0}^{n-1}f(jX_v/n)\right\|_{\eta,5}
\le\frac{X_v^2}{2n}\|f_X\|_{\eta,5}
<\frac{R^{14}}{2n}.
\]

이 오차식은 실제 convergent evaluator가 값의 interval을 정밀하게
생산할 때 사용할 수 있다. 이 문서/producer는 quadrature sum을 이미
계산했다고 주장하지 않으며 signed integral 값을 norm 상계로 바꾸지 않는다.

## 9. 남은 N5-06 경계

이 새 norm은 actual global leading operand와 actual n1 moment/Picard
norm을 결합하는 데 쓸 수 있다. 다음은 여전히 별도의 의무다.

- 모든 필요한 positive coefficient와 cutoff tail을 포함한 (5.42)의
  completed (F,G) (C^2) 상수.
- 양쪽 평평한 stress 경계에서 공통 소멸 인자를 먼저 약분한
  normalized direction의 실제 modulus. 단순 (\zeta^{-1}\)로는 안 된다.
- 원래 일반 label에서 actual principal ODE, positive peak scale,
  integrated (H) column의 상대 오차와 양의 공통 scale.
- 위 오차를 기존 robust cone/inverse budget으로 보내는 하나의 실제
  (q_*>0), 전체 active partition의 (7.30) 증명.

따라서 `originalN506Complete`, `actualUniformHColumnsCertified`,
`sourceUniformQStarCertified`는 false다. 이 결과는 실행된 유한 정수/jet
검사와 위의 해석 유도이며 Lean/다른 formal kernel proof를 의미하지 않는다.

## 10. 실행 검증과 독립 검토

전용 Node 검사는 12개 모두 통과했다. Python 독립 검사는 573개를
통과했다. Python은 JavaScript의 재귀를 그대로 옮기지 않고, 세 가지
implicit recurrence를 Catalan/Lagrange 생성함수의 닫힌 계수식과
대조했다. step derivative는 Bell partition, 자연계수는
inclusion-exclusion Stirling 수, 적분 오차는 선형 함수에서 정확히
포화되는 독립 유리수 항등식으로 검사했다. Leibniz binomial,
`B_phase`, 실제 `−XWU` 및 axis boundary를 빠뜨리는 실패 대조군도
포함했다.

별도 소스 검토자는 §4, §6, §7의 reference 비율, B.8의 고차 step,
C.12의 fast-phase 항, 원래 작은 근과의 uniqueness 연결, outer
coefficient의 복소 확장과 실제 실수 Amp implicit branch의 구분을
읽고 구체적인 식 오류를 찾지 못했다. 이 읽기 검토는 모든 지수의
독립 실행 검사를 대신하지 않는다. 실행 결과와 모든 새 파일의
정확한 바이트 해시는 `../evidence/actual-leading-high-jets.json`에
저장하며 실제 signed moment 값이나 전역 N5-06 완료의 증빙으로
확대하지 않는다.
