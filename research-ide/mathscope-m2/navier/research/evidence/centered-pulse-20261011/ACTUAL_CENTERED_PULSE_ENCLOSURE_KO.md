# 원래 펄스 중심값을 보존하는 공분산·가중 진폭의 엄밀 수치 구간

## 1. 범위와 실행 상태

새 모듈은 원래 작은 \(q\) terminal covariance source의 고정 witness

\[
X=X_{\rm rep}=X_b e^{-1/4},\quad
\eta=\eta_{\rm rep}=0,\quad s=s_{\rm rep}=1,\quad
(R,Z,T)=(\sqrt{2X},0,1)
\]

에서 두 실제 펄스의 중심 \(v_0=L_s/2\)를 다룬다. \(h\)는 원래 양의
표현 그대로이며, 밴드는 원래 source 조건으로 정한
\(\ell=\ell_{\min}+8\), \(S=\ell^2\)다.

정규화 질량, 정규화한 실제 \(H\)의 두 열, 정규화 역가중치와
\(\sqrt{y_\pm}\,t_\pm(v_0)\)의 세 투영에 유리수 구간을 제공한다.
이것은 실제 펄스의 가중 진폭이다. 모든 cutoff·위상·물리 curl을
포함한 전체 속도의 수치값을 뜻하지 않는다.

작은 kernel 8/8과 실제 source 11/11 검사가 모두 통과했고 각 프로세스의
실제 종료 코드 0을 관측했다. Source의 내부 결속 검사 7개도 통과했다.
실제 source 실행은 57.967초, peak RSS 2,986,721,280 bytes였다.
245,828 nodes의 원래 식과 수치 certificate가 함께 결속됐으며 실행의
60개 local import SHA는 종료 후 재검사에서도 모두 동일했다.

실행 기록은 actual-centered-pulse-enclosure-source-attempt1.json과
별도 -process.json, log다. 새 그래프 SHA256은
bfd72c11e7e2e854183de2a30294b9f6e93c1b956d7045a76c43c6e7a48e3f75다.
원래 selected terminal source의 SHA256
8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a와
234,335 nodes도 이번 프로세스에서 그대로 재현했다. Worker·브라우저
실행은 이 packet에 포함하지 않는다.

## 2. 중심값을 먼저 분리하는 정확한 이유

원래 식은 \(z=P w\), \(t=Bz\)다. 두 부호마다

\[
a_\pm=w_{+,\pm}(v_0)>0,\qquad
\widetilde t_\pm=t_\pm/a_\pm,\qquad
\widetilde H_\pm=H_\pm/a_\pm^2
\]

로 둔다. \(a_\pm\)는 원래 전체 Volterra 해의 값이다. invariant cone과
양의 지수해에서 \(a_\pm>0\)를 알지만 절대 수치값은 아직 계산하지 않았다.

\[
H=\widetilde H\operatorname{diag}(a_+^2,a_-^2),\qquad
\widetilde y=\operatorname{diag}(a_+^2,a_-^2)y
\]

이므로 양의 제곱근 법칙에서

\[
\sqrt{y_\pm}\,t_\pm
=\sqrt{\widetilde y_\pm}\,\widetilde t_\pm
\]

가 정확히 성립한다. 서로 다른 \(a_+,a_-\)를 동일시하거나 \(1\)로
근사하지 않는다. algebra 검사는 서로 다른 양의 중심 인자를 사용하며,
\(a^2\) 대신 \(a\)로 열을 나누는 잘못된 변환을 음성 대조로 검출한다.

## 3. 선택된 원래 밴드의 강한 오차 여유

원래 source 선택식의 최대값에는 \(B^{512}\)가 들어간다. 따라서

\[
\ell_{\min}=\left\lceil\max\{8,S_{\min},(64/h)^2\}\right\rceil,\quad
S_{\min}\ge B^{512}
\ \Longrightarrow\ S=(\ell_{\min}+8)^2\ge B^{1024}.
\]

이 추론은 거대한 정수를 수치로 전개하지 않는다. \(B\)는 원래 전역
C2 및 geometry 상수를 포함한 같은 식이며 \(B\ge2^{128}\),
\(B\ge R_{\rm env}^{4096}\)이다. 원래 parameter chain은
\(R_{\rm env}>2^{4096}\), \(\kappa=R_{\rm env}^{-10}<2^{-40960}\)도 준다.
따라서 source로 증명된
\(\lVert C-C_{\rm ideal}\rVert_{\max}\le\kappa/128\)는 이번 수치 계산의
양의 오차 반경 \(2^{-8192}\)보다 작다.

원래 palette에서
\[
2r_0S\le L_s<2r_0(4+\sqrt2)S<S,\qquad
2r_0=2^{-33}>B^{-1}
\]
를 얻는다. 양의 \(h\), 실제 logarithm·ceiling·palette 표현을 그대로
검사하며 \(h=0\)이나 \(\ell=1\)로 바꾸지 않는다.

## 4. 실제 \(P\)의 가우스 잔여항

\[
u=2R_{\rm env}^{10},\quad
g=\frac{3\lambda_0u^2}{(1+u^2)^{3/2}},\quad
x=(v-v_0)\sqrt{g/L_s}
\]

로 둔다. 원래 \(\lambda_0\) 상·하한에서 \(B^{-1}<g<B\), 따라서
\(gL_s\ge B^{1022}\)다. 실제 reference는

\[
s_{\rm ref}=\pm u(1/2+v/L_s),\quad
\lambda=\frac{\lambda_0}{\sqrt{1+s_{\rm ref}^2}},\quad
d_{\rm ref}=\frac{\lambda_0(1+s_{\rm ref}^2)}{(1+u^2)^{3/2}},
\quad P=\exp\int_{v_0}^v(\lambda-d_{\rm ref})\,dt .
\]

코드는 원래 \(\lambda-d_{\rm ref}\)의 실제 도함수를 생성한다. 중심의
두 제곱근 표현은 먼저 인자의 유리식 동일성을 검사하고 양의 제곱근
동일성으로 연결한다. 유리식 checker가 독립적으로
\(\sqrt{x}^{\,2}=x\)까지 증명했다고 기록하지 않는다.

\[
\alpha=\frac{u^2}{1+u^2},\quad
\zeta=1+\frac{v-v_0}{L_s},\quad
q(\zeta)=\frac{\zeta}{3}
\big[(1+\alpha(\zeta^2-1))^{-3/2}+2\big]
\]

이면 \(-L_s(\lambda-d_{\rm ref})'/g=q(\zeta)\), \(q(1)=1\)이고,
\(1/2\le\zeta\le3/2\), \(0<\alpha<1\) 전체에서

\[
\frac13\le q\le5,\qquad |q'|\le\frac{10}{3}+72<100 .
\]

그러므로 원래 전체 pulse 구간에서 \(P^2\le e^{-x^2/3}\), 중심에서는
\[
|\log P^2+x^2|\le\frac{100|x|^3}{3\sqrt{gL_s}}.
\]

원래 안정 ODE는
\[
M=\operatorname{diag}(0,-2\lambda)+E_{\rm actual}-(d-d_{\rm ref})I
\]
이며 \(|E_{{\rm actual},ij}|,|d-d_{\rm ref}|\le B^{256}/S\)다.
원래 cone은 \(r=w_-/w_+\)에 대해
\[
|r|\le B^{260}/S\le B^{-764},\qquad w_+>0
\]
를 준다. 이에
\[
|(\log(w_+/a_\pm))_v|\le3B^{256}/S
\]
이고 \(x\) 좌표의 계수는
\(\beta\le3B^{256+1/2}/\sqrt S<B^{-254}\)다. 절대 \(w_+\)를 \(1\)에
가깝다고 선언하지 않고 중심값에 대한 비만 제어했다.

## 5. cutoff를 포함한 전체 적분 오차

중심 구간을 \(|x|\le64\)로 고정한다. \(64<\sqrt{gL_s}/4\)이므로 원래
\(\psi=1\) plateau 안이다. core에서는 로그 잔여항과 \((1+r)^2\)를
함께 곱하고, 길이 \(128\)을 곱한 절대 적분 오차를 양의 유리수로 누적한다.

core 밖에서
\[
P^2(w_+/a_\pm)^2(1+r)^2\le4e^{-x^2/6}
\]
이므로 양쪽 꼬리의 합은
\[
\frac{24}{64}e^{-64^2/6}<\frac{24}{64}\,2^{-682}.
\]
비교 Gaussian의 양쪽 꼬리는 \(2^{-4096}/64\)보다 작다. 유한 원래
구간 밖으로 nonnegative majorant만 확장한다. 그곳의 실제 펄스 해를
정의하거나 샘플링하지 않는다.

따라서
\[
d_\pm=\int\psi^2P^2(w_+/a_\pm)^2(1+r)^2\,dx,\qquad
|d_\pm-\sqrt\pi|<2^{-640}.
\]
코드는 core·실제 tail·비교 tail의 유리수 상계를 각각 보관한다.
작은 양의 오차는 dyadic 정밀도보다 작아도 최소 한 ulp 위로 반올림한다.

## 6. 원래 횡 cutoff 질량과 Haar 인자

\[
I=\int_0^1\sigma(s)^2\,ds,\qquad
\sigma(s)=\frac{e^{-s^{-2}}}{e^{-s^{-2}}+e^{-(1-s)^{-2}}}
\]
이며 원래 transition 폭에서
\[
\int\chi^2\,d\xi=r_0(1/2+I)
\]
다. 기존 directed cutoff kernel은 대칭식
\(I=1/2-2\int_0^{1/2}\sigma(1-\sigma)\)을 사용한다. 각 cell 전체의
8차 Taylor 계수 상계, 7차 midpoint 다항식, 작은 endpoint collar의
양의 tail을 포함한다.

\[
J=\frac{D_g}{2}c_i\int\chi^2,\quad c_iL_s=2r_0,\quad
D_g=4-2\sqrt2
\]
이므로
\[
m_\pm=\frac{a_\pm^2r_0^2}{\sqrt{gL_s}}\,
D_g(1/2+I)d_\pm .
\]
Haar의 \(1/2,D_g,c_i\)와 실제 \(\chi\) 질량을 단위값으로 바꾸지 않는다.

## 7. 원래 target·역가중치·중심 진폭

원래 전체 moment 복원을 마친 \(U,M,V\)는 \(X_v\) 뒤에서 0이다.
이번 witness는 그 밖의 terminal 영역에 있으므로 실제 \(G_R=0\)이며,
원래 shear 부호 \(RF_R<0\)에서
\[
N=(-1,0),\qquad K=(0,-1)
\]
이다. compact integrand만 보고 원시함수를 0으로 바꾼 것이 아니다.
실제 전체 moment root와 support 결론을 사용한다.

원래 outer target은
\[
T_{\rm chart}=e^{-4/\delta^2}\delta^{-3}
(b_\theta,\delta^6b_z),\qquad\delta=1/4
\]
로 factorize한다. 그대로 복사한 source factor에서 \(b_z\)의 실제
\(\eta\) 인자가 \(\eta=0\)에서 0이 되는 것을 확인한다.
원래 부호 증명은 \(T_\theta>0,T_z=0\)을 준다.
\(A_c=-c_0\sqrt{1+u^2}>0\), \(\tau=T_\theta/A_c>0\)로 쓰되,
\(\tau\)의 절대 수치값을 계산한 것은 아니다.

\[
C=\begin{pmatrix}1&1\\-1&1\end{pmatrix}+\mathcal E,\quad
\|\mathcal E\|_{\max}<2^{-8192},\qquad
C\binom{m_+y_+/\tau}{m_-y_-/\tau}=\binom10 .
\]

directed 2×2 inverse는 determinant가 0에서 떨어진 것을 먼저 확인한다.
원래 중심 frame과 cone 오차를 함께 포함하여
\[
A_0=\sqrt\tau\,(gL_s)^{1/4}/r_0
\]
에 대해 다음 세 계수에 같은 유효 구간을 준다.

| 실제 식 | 양의 정확한 scale |
|---|---|
| \(\sqrt{y_\pm}t_{r,\pm}(v_0)\) | \(A_0\) |
| \(-N\cdot(\sqrt{y_\pm}t_{{\rm tan},\pm}(v_0))\) | \(A_cA_0\) |
| \(\mp K\cdot(\sqrt{y_\pm}t_{{\rm tan},\pm}(v_0))\) | \(uA_0\) |

192 bit와 요청 폭 \(10^{-12}\)에서 실제 source에 결속한 값은 다음
부근이다. 완전한 유리수 양 끝점은 실행 JSON에 보관한다. 256개
cutoff cell을 썼고, 14개 결과 구간 모두 요청 폭을 만족했다.

| 정규화 수량 | 구간 중심의 표시값 |
|---|---:|
| \(m_\pm/(a_\pm^2r_0^2/\sqrt{gL_s})\) | 2.015494031299352 |
| \(y_\pm a_\pm^2r_0^2/(\tau\sqrt{gL_s})\) | 0.2480781348073054 |
| 위 세 중심 가중 진폭의 계수 | 0.498074426975834 |

실제 \(\theta\) covariance 두 열은 양수, \(z\) 열은 \(+\) family에서
양수와 \(-\) family에서 음수다. \(C\) 둘째 행 및 \(K=(0,-1)\)의
방향을 끝까지 유지한 결과다.

## 8. 수치 근거와 독립 참조의 구분

\(\pi=16\arctan(1/5)-4\arctan(1/239)\)를 교대급수의 부호 있는 첫
누락항으로 감싼다. tan 덧셈식과 각도 구간을 따로 확인하며
\(\sqrt\pi\)는 정수 제곱근의 floor/ceiling으로 반올림한다.
최종 inverse·positive sqrt도 같은 directed BigInt 산술이다.

Exa로 확인한 공식 근거는 [DLMF 7.2.1–7.2.2](https://dlmf.nist.gov/7.2)
및 [DLMF 4.24.3](https://dlmf.nist.gov/4.24)이다.
Precise Special Functions의 \(\Gamma(1/2)\), 80자리 결과는
representable 인자에 대한 독립 sanity reference다. 플러그인이
외향 반올림 오차 증명을 제공하지 않으므로 어떤 유리수 구간의
증거로도 쓰지 않는다. 실제 작은 \(h\)를 Number 인자의 0으로 넣은
호출은 없다. 참조는 independent-references.json에 분리했다.

## 9. 아직 닫히지 않은 부분

절대 \(H,y\)의 높은 상대정밀도는 \(a_\pm\)의 절대 평가가 필요하다.
\(A_0\)에 남은 양의 \(\tau,g,L_s\)도 원래 정확한 식으로 남았다.
모든 \(v\)의 pulse 값·도함수, 물리 curl, 전역 residual·flat-error의
수치 구간, 모든 label의 합, 새 analytic Lean 증명, 전체 G-NUM이나
M2/M3 gate는 이 packet으로 완료되지 않는다.

