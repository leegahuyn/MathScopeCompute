# 실제 1차 보정을 보존한 annulus 전체의 공분산 양성

이 문서는 `actual-admissible-annulus-covariance.mjs`가 생성하는 **새로운 하나의 완전한 dyadic band**를 다룬다. 원래 계수 (F_1,U_1,M_1,v_1)를 남긴 실제 배경으로 두 공분산 열을 만들고, 같은 slow box 안의 모든 허용된 점에서 행렬식이 음수이며 (X_a<X<X_b)에서는 두 역행렬 가중치가 양수임을 보이는 소스 결속형 분석 증명이다. 양성 주장은 terminal 구간에 한정되지 않는다.

직접 실행은 14개 검사 그룹과 25개 내부 소스 결속 검사를 통과했다. 이 실행은 아래의 분석적 부등식에 등장하는 원본 식·상수·정의역을 확인한다. 적분의 수치 평가나 새로운 Lean 해석학 증명으로 해석하지 않는다. 이미 보존된 원래 계수, 이전 `ell=1` 실행물, terminal 실행물 및 공개 runtime은 수정하지 않았다.

## 1. 실제 배경과 선언한 정의역

앞선 [annulus 배경 증명](ACTUAL_ADMISSIBLE_ANNULUS_BACKGROUND_KO.md)의 재귀 cutoff를 사용한다. 모든 (n)에서 (b_n\ge c_n), (n\ge3)에서 (b_n\ge2b_{n-1})이며, 첫 두 값은 추가로 (b_2\ge16b_1)을 만족한다. 실제 첫 두 계수의 유한 물리 FTC 조건도 이 선택에 포함된다. 원래 cutoff 함수의 동일한 본문을 사용하고, 규모만 확대했다.

\[
\ell_A=\left\lceil\frac{\log(4b_1)}{\log2}\right\rceil,
\qquad Q=2^{-\ell_A},\qquad q=Qs,\quad\frac12\le s\le2.
\]

이 전체 band에서 첫 cutoff는 정확히 1이고 (n\ge2) cutoff는 정확히 0이다. 따라서 실제 함수는

\[
\begin{aligned}
F(q,X,\eta)&=F_0(X,\eta)+q^{2h}F_1(X,\eta),\\
U(q,X,\eta)&=U_0(X,\eta)+q^{2h}U_1(X,\eta),\\
M(q,X,\eta)&=M_0(X,\eta)+q^{2h}M_1(X,\eta)
\end{aligned}
\]

이며 (v)도 원래 stream으로부터 생성한다. 활성 1차 계수를 제거하는 support 주장은 사용하지 않는다. (h>0) 및 (q^{2h}>0)을 원본 표현 그대로 보존한다.

slow chart는

\[
R=\sqrt{2sX},\qquad Z=s^D\eta,\qquad T=s(1-\eta^2)
\]

이고, 실제 slow (F,G,b)에 각각 필요한 (s^{-A-1/2},s^{-A},\epsilon s^{-1/2}) 인자를 **미분 전에** 곱한다. 특히 profile (F)와 slow (F)를 동일시하지 않는다.

정의역은 다음과 같다.

| 항목 | 범위 |
|---|---|
| 고정 대표점 | (X_{\rm rep}\in[X_a,X_b]), (\eta_{\rm rep}\in[-1,1]), (s_{\rm rep}\in[1/2,2]) |
| 평가점 | ([X_a/2,2X_b]\times[-1,1]\times[1/2,2])의 slow image |
| 대표점과 평가점 | 같은 원래 slow box, slow Euclidean 거리 (\le4/S^3), (S=\ell_A^2) |
| 행렬식 부등식 | 위의 결합된 확대 정의역 |
| 엄격한 가중치 양성 | 추가로 (X_a<X<X_b)인 점 |
| 매끄러운 양의 제곱근 | 고정 band·고정 label, 내부 slow chart |


(\eta=\pm1)에는 원래 (z\ge0) heat 적분에서 오는 안쪽 연속 jet만 사용한다. 원래 heat 적분을 음의 시간까지 정의했다는 주장은 하지 않는다. 내부 smoothness와 radial flat zero-extension은 서로 다른 결론이다.

## 2. 새로운 배경에도 동일한 소스 (C^2) 상수를 쓰는 이유

원래 cutoff의 normalized Euler 미분은

\[
(q\partial_q)^j\chi(b_nq)
=\big[(x\partial_x)^j\chi(x)\big]_{x=b_nq}
\]

이다. 이 항등식은 (b_n)의 크기에 의존하지 않는다. 원래의 normalized cutoff derivative 상수를 그대로 사용하면서 (b_n\ge c_n)으로 활성 (q) 구간만 줄이면, 원래 all-order 대각 tail의 각 작은 항 상한이 커지지 않는다. (q>0)를 고정하면 (b_n\ge2^n)이므로 합이 국소적으로 유한하다. 이 논증은 (n=1,2)의 실행 관찰을 나머지 모든 차수로 복사하는 논증이 아니다. 동일한 원래 coefficient recurrence와 cutoff inequality에 대한 서술형 귀납·국소 유한성 논증이며, 실행한 첫 두 계수는 그 실제 초기 block을 결속한다.

`actual-admissible-annulus-background.mjs`는 원래 완성된 배경의 slow (C^2) 상수들을 독립 재생성하고, 그 root가 원래 producer의 root와 정확히 같은지 검사한다. 새 (H)는 이 비공개 인증 객체를 그대로 입력으로 사용한다. 사용자 제공 배경·상수·행렬·양성 flag는 받지 않는다.

이 문서에서는 slow 반경 (R)과 구분하여 소스의 고정 큰 envelope를 \(\mathcal R\)로 쓴다. 실제 상수는

\[
\begin{aligned}
B={}&2^{128}+\mathcal R^{4096}
 +C_{FG\,\mathrm{error}}+C_b+C_F+C_G
 +A_{\rm chart}+B_{\rm chart},\\
E={}&B^{256}.
\end{aligned}
\]

각 (C)와 chart 상수는 원래 producer의 AST root이다. (B,E)에는 band·대표점·slow 좌표의 자유변수가 없으며, 유한한 양의 원본 표현이다. 실제 (q_*\)는 이후 이 상수로 선택한다. 상수의 머신 수치 값을 요청하거나 underflow를 0으로 바꾸지 않는다.

이 전이 논증은 동일한 원래 coefficient family와 허용된 cutoff 확대 family에 공통으로 적용된다. 단일 band의 실행 기록 자체를 모든 band의 실행 기록으로 간주하지 않는다. 반대로 무한히 많은 band의 개별 literal graph를 실행하는 것이 보편 정리의 필요조건도 아니다. 남은 all-band 작업은 **일반 band의 매개화된 원래 구성과 이 보편 추정의 결속**, 그리고 물리 조건까지 포함한 하나의 공통 재귀 cutoff 선택이다.

## 3. 실제 carrier와 움직이는 압력

대표점에서 원래 order-zero slow 값을 동결한다.

\[
g_0=(R_{\rm rep}F_{0,R},G_{0,R}),\quad
N=\frac{g_0}{|g_0|},\quad K=(-N_z,N_\theta),
\]

\[
\lambda_0^2=-2F_0N_\theta(|g_0|+2F_0N_\theta),
\qquad c_0=\frac{\lambda_0}{2F_0N_\theta}<0.
\]

원래 whole-annulus shear·방향 증명은

\[
\begin{gathered}
F_0>\mathcal R^{-10},\quad |N_\theta|>\mathcal R^{-14},
\quad |g_0|>\mathcal R^{-20},\\
\mathcal R^{-6}<|c_0|<\mathcal R^{10},\qquad
\mathcal R^{-31}<\lambda_0<\mathcal R^{83}
\end{gathered}
\]

를 준다. 이 하한은 행렬식을 역으로 가정해서 얻지 않는다.

원래 palette 및 carrier의 정의는

\[
\epsilon=Q^h,\quad k=\lceil\epsilon^{-1/2}\rceil,\quad
u=2/\kappa,\quad
i=\left\lfloor\frac{(1+h)\ell_A\log2-2\log\ell_A}{\log T_g}\right\rfloor,
\]

\[
c_i=T_g^iQ^{1+h},\quad L_s=2r_0/c_i,\quad
B_s^2=\frac{\lambda_0}{\epsilon k^2(1+u^2)^{3/2}}
\]

이다. (r_0=2^{-34},T_g=4+\sqrt2)를 보존한다. 따라서 실제 palette에서

\[
\frac1{T_g S}<c_i\le\frac1S,
\qquad 2r_0\le L_s/S<2r_0T_g.
\]

각 부호 (\varsigma\in\{+1,-1\})에 대해

\[
\beta=B_s\left(K-\frac{\varsigma u}{L_s|g_0|}N\right),\qquad
\widetilde p=R_{\rm rep}\beta_\theta,\quad p_z=\beta_z,
\quad x_0=\varsigma B_su/2.
\]

(kp)는 (k\widetilde p)에 가장 가까운 0이 아닌 정수이며, 0으로 반올림되는 구간에서는 원래 signed fallback을 유지한다. 그러면 (|p-\widetilde p|\le1/k)이고 모든 carrier label은 slow 변수와 pulse 변수에 대해 동결되어 있다.

**평가점의 phase speed에는 완성된 (F,G)를 사용한다.**

\[
H_\phi=pF+p_zG,\qquad
n=(x_0-vH_{\phi,R},\ p/R,\ p_z-\epsilon vH_{\phi,Z}),
\qquad n'=(-H_{\phi,R},0,-\epsilon H_{\phi,Z}).
\]

실제 행렬은

\[
K_{\rm cyl}=
\begin{pmatrix}
0&-2F&0\\
2F+RF_R&0&0\\
G_R&0&0
\end{pmatrix},\qquad
A_\phi=-K_{\rm cyl}+\frac{n(n^TK_{\rm cyl}-(n')^T)}{|n|^2}.
\]

새 adapter는 원래 `actualMovingPulseFrame`을 호출한다. 테스트는 (n')가 들어가는 전체 pressure numerator, 실제 (B'=\partial_vB), 그리고 (B^{\rm left}(A_\phi B-B'))의 입력이 그대로 남았음을 확인한다.

## 4. 완성된 배경에서 원래 농축 가정까지

소스 조건은 (S\ge B^{512})와

\[
S^2(\epsilon+\epsilon^2+k^{-1})<1
\]

을 포함한다. 완성된 배경과 leading 배경의 slow (C^2) 차이는 소스 상수 곱하기 (\epsilon^2) 이하이다. 대표점에서 평가점으로 이동할 때는 profile 직육면체 안의 직선 경로와 그 slow image를 사용한다. slow image 자체의 볼록성은 가정하지 않는다. 암시적 chart 식의 차를 빼면

\[
|\Delta s|\le2(|\Delta T|+4|\Delta Z|)
\]

이고, (X,\eta)의 차와 image 경로 길이도 (B)로 제어된다. 고정된 leading (C^2), 완성된 배경의 비교 상수, 같은 box 거리 조건을 합쳐

\[
\max\{|F-F_0|,|F_R-F_{0,R}|,|G_R-G_{0,R}|\}
\le B^5/S^3
\]

형태의 보수적 공통 상한을 얻는다. 각 항에 같은 상한을 사용하는 유한 합 계수는 (B\ge2^{128})에 흡수한다.

동결된 cancellation은 정확하다.

\[
\widetilde pF_{0,R}+p_zG_{0,R}
=\beta\cdot g_0=-\varsigma B_su/L_s.
\]

반올림 오차, 실제 (F_R,G_R)의 차, 접선의 원래 (L_s^{-1}) tilt, (p/R)의 평가점 차이, \(-\epsilon vH_{\phi,Z}\)를 모두 남기면

\[
|n-n_{\rm ref}|\le B^{12}/S,\qquad
|n'|\le B^{12}/S,
\quad
n_{\rm ref}=B_s\left(\varsigma(u/2+uv/L_s),K\right).
\]

(\epsilon k^2\le4)와 위 원본 하한으로 (B_s>\mathcal R^{-40}>B^{-1})이다. (S\ge B^{512})이면 실제 접선 normal이 사라질 수 없고

\[
|n_{\rm tan}|\ge B_s/2>B^{-2}.
\]

따라서 실제 frame의 역수와 제곱근 분모에 필요한 하한을 먼저 확보한다.

원래 cylindrical 행렬을 기준 normal (n_{\rm ref})로 투영한 (2\times2) 행렬은

\[
M_{\rm ref}=
\begin{pmatrix}
0&2F_0N_\theta/(1+s_{\rm ref}^2)\\
-(|g_0|+2F_0N_\theta)&0
\end{pmatrix}.
\]


\[
J=\begin{pmatrix}1&1\\c_0\sqrt{1+s_{\rm ref}^2}&-c_0\sqrt{1+s_{\rm ref}^2}\end{pmatrix}
\]

가 이를 (\operatorname{diag}(\lambda,-\lambda))로 대각화한다. 새 generic kernel은 전체 pressure를 포함한 네 투영 항등식과 네 대각화 항등식을 독립 exact algebra로 확인한다. pressure를 제거하거나 제곱근 인자를 누락한 식은 실패한다. 그 generic 항등식 자체가 actual-source 증명은 아니며, actual source 검사가 바로 위의 원본 (F_0,N,c_0,\lambda_0) 관계 및 실제 (A_\phi,B,B')를 따로 결속한다.

`FramePowerLedger`는 앞의 원시 부등식에 product·reciprocal·square-root 차분과 보통 (v) 미분 규칙을 적용한다. 실행한 유한 ledger의 최종 지수는 다음과 같다.

| 실제 오차 | 계산된 (B) 지수 | 채택한 공통 상한 |
|---|---:|---|
| 움직이는 projected operator | 69 | (B^{256}/S) |
| damping | 21 | (B^{256}/S) |
| normalized unit frame | 29 | (B^{256}/S) |
| normal slope | 29 | (B^{256}/S) |


ledger가 원시 하한을 스스로 증명하는 것은 아니다. 원시 하한은 위 원래 함수와 source (C^2) 전이에서 나오고, ledger는 그 이후의 유한 대수 추정을 계산한다. 이 두 단계를 분리해 기록한다.

수렴식에 넣은 별도의 무조건 유한 행렬 norm은

\[
\|M_w\|_\infty\le B^{256}(1+k)^8(1+L_s)^8
\]

이다. (kp\ne0)과 (R\le B)에서 (1/|n_{\rm tan}|\le kB)가 나오므로, 이 유한 norm을 얻기 위해 공분산 역행렬의 양성을 선행 가정할 필요가 없다.

## 5. 원래 cutoff와 실제 두 적분 열

각 pulse는 유한 부분합으로 바꾸지 않은 정확한 Volterra limit이다.

\[
w'=M_ww,\quad w(0)=(1,0),\qquad
P(v)=\exp\int_{L_s/2}^v(\lambda-d_{\rm ref})\,d\tau,
\qquad t=B(Pw).
\]

기준 damping은 실제 (\epsilon k^2B_s^2=\lambda_0/(1+u^2)^{3/2})에서 나온다. Riccati cone으로 (x=t_r>0)를 얻는다. 원래 (\psi\)의 plateau와 연속 Gaussian 상한·하한은

\[
e^{-g_+(v-L_s/2)^2/L_s}\le P(v)
\le e^{-g_-(v-L_s/2)^2/L_s},
\qquad g_-={\lambda_{\min}\over4u},\quad
g_+={15\lambda_{\max}\over2u}
\]

를 준다. Gaussian limit이나 유한 sample을 적분 대신 쓰지 않는다.

원래 transverse cutoff (\chi)의 질량은 그대로 적분하며, Haar 계수는

\[
J_{\rm Haar}={4-2\sqrt2\over2}\,c_i
\int_{-r_0}^{r_0}\chi(\xi)^2\,d\xi>0.
\]

angular average의 (1/2) 및 원래 rectangle determinant를 유지한다. \(\int\chi^2\)를 1로 정규화하지 않는다.

\[
H_\varsigma=J_{\rm Haar}\int_0^{L_s}\psi^2x\,(t_\theta,t_z)\,dv,
\qquad m_\varsigma=J_{\rm Haar}\int_0^{L_s}\psi^2x^2\,dv.
\]

실제 (psi=1)인 중앙 구간에서 Gaussian 하한을 적분하고, 실수선 전체의 절대 1차 Gaussian moment를 상계하면 코드에 기록한 소스 양수 (m_*,a_+)에 대해

\[
0<m_{\rm low}=J_{\rm Haar}m_*\sqrt{L_s}
\le m_\varsigma\le
m_{\rm up}=J_{\rm Haar}a_+^2L_s
\]

를 얻는다. 농축 오차와 움직이는 frame 오차에 각각 (\kappa/256)을 배분하는 실제 (S\) 조건을 모두 합쳤다.

## 6. 행렬식과 양의 가중치

\[
A_c=-c_0\sqrt{1+u^2}>0,
\qquad
C_{1\varsigma}=-{N\cdot H_\varsigma\over A_cm_\varsigma},
\qquad
C_{2\varsigma}={K\cdot H_\varsigma\over um_\varsigma}.
\]

앞선 추정은 같은 box 안의 모든 허용된 점에서

\[
\left\|C-\begin{pmatrix}1&1\\-1&1\end{pmatrix}\right\|_{\max}
\le\kappa/128.
\]

원래 margin (0<\kappa<1)의 정확한 다항식 부등식은

\[
15/8<\det C<17/8.
\]

또한 orientation을 포함한 정확한 식은

\[
\det H=-A_cu\,m_+m_-\det C
< -{15\over8}A_cu\,m_+m_-<0.
\]

새 generic kernel은 이 부호와 양쪽 질량 인자를 모두 확인하며, 부호를 바꾼 식은 실패한다. 실제 두 행의 (H\operatorname{adj}(H)T/\det H=T)도 원본 (H,T) root를 atom으로 사용하는 별도 exact rational 검사로 통과했다.

목표 벡터는 원래의 full leading stress

\[
\overline T=s^{-A-1/2}T_0(X,\eta)
\]

이다. 실제 전체 (I,J,S,C_p\) moment, 최종 (M_0), 원래 (P_0+C_p), 두 viscosity shear를 본문으로 조립한다. 완료된 배경을 쓴다는 이유로 목표 (T_0)의 정의를 임의로 바꾸지 않는다.

원래 전체 annulus의 방향 margin과 flat edge에서의 normalized direction modulus를 사용한다. (S\ge\mathcal R^{1024})이면 같은 box의 frozen target ratio 변화가 (\kappa/16) 이하이다. 이 단계는 flat stress의 작은 크기로 나누는 대신, 미리 증명된 flat factor를 제거한 방향을 사용한다.

내부 (X_a<X<X_b)에서

\[
\tau=-{N\cdot\overline T\over A_c}>0,
\qquad
{\kappa\over64}\le{m_\varsigma y_\varsigma\over\tau}\le2.
\]

따라서 두 **실제** 가중치 (y=H^{-1}\overline T)는

\[
{\kappa\tau\over64m_{\rm up}}
\le y_\varsigma\le{2\tau\over m_{\rm low}}
\]

를 만족하며, 양의 제곱근에 동일하게 단조 제곱근 경계를 적용한다. 이 값들은 원본 식의 양수 표현이며 수치 구간으로 평가하지 않았다.

고정 label에서 완성된 실제 유한 배경과 compact pulse interval의 ODE 계수는 내부 chart에서 smooth하다. ODE의 매개변수 미분과 유한 적분, 비영 행렬식, 양의 가중치에 의해 내부의 양의 제곱근도 smooth하다. 이는 실제 계수의 smoothness에서 얻는 존재 정리이다. 모든 차수 jet의 수치 계산을 실행했다는 주장이 아니다.

## 7. 실행 증거 및 불변성

실제 실행 파일은 `research/evidence/admissible-annulus-covariance-20261011/`에 있다.

| 증거 | 관측 결과 |
|---|---|
| generic kernel | 6/6 PASS, exit 0 |
| 실제 source attempt 1 | 14/14 PASS, 25개 내부 source 결속, 관측 exit 0 |
| source 실행 기준 commit | `fdf2ea19d373e7bb280913db6403c4103af145c0` |
| literal import closure | 60개, 실행 전후 모두 동일 |
| 실제 원본 배경 graph | `c2e0e84547b245eb3687ecc8b78d94badfcf3efbddc191b5f7ef2de6f65867ed` 재현 |
| 새 (H) graph | 526,428 nodes, 22,467,199 canonical bytes |
| 새 graph SHA256 | `e042e57c7d59bed083da9a7b786fbcc5ae538d936484132310e684d2482a0b4b` |
| process wall 시간 / peak RSS | 63.348초 / 2,834,210,816 bytes |
| source receipt SHA256 | `36ae8be6e89f85e3a964b23a343c82ac2ab204b588d6c94ac3145d35fda4bb7f` |


내부 검사 ID의 `actual-fixed-zero-initial-Volterra`는 시작 **시간**이 0이라는 뜻이다. 실제 초기 벡터는 소스와 검사에서 모두 `(1,0)`이며 영벡터가 아니다. 성공한 실행 파일을 이 이름 때문에 다시 수정하거나 재실행하지 않았다.

기존 frozen graph를 복사한 뒤 새 식을 추가했다. 작업 cache만 비우며 원본 node·함수 정의는 변경하지 않는다. 새 certificate는 전체 metadata와 고정 node prefix를 비공개 seal에 결속한다. 객체 복사, completed (F)를 leading (F)로 교체, source norm 축소, pulse matrix 수정, program node 배열 교체, 임의 metadata 추가를 거부한다. 이미 발급한 graph 뒤에 무관한 식을 append해도 발급된 graph SHA는 바뀌지 않는다.

별도로 (X=X_{\rm rep}=110), (s=s_{\rm rep}=1), (\eta=\eta_{\rm rep}=0)인 **비-terminal 내부점**에 실제 (F,H,y,T)를 대입했다. slow·대표점 자유좌표가 모두 소거됐음을 확인했다. 실제 1차 항을 식에 남겼다는 검사이며, 그 계수의 특정 수치가 0이 아니라고 추가 주장하지 않는다. 이 점의 대입은 전체 정의역 부등식의 증명 대신 사용하지 않았다. 원래 box 하나와 허용 대표점의 존재를 사용하며 구체적 lattice index를 materialize하지 않았다.

## 8. 남은 G-POS와 M2 조건

이 결과는 선택한 **전체 annulus band**에서 실제 (H), 비영 행렬식 및 내부 양의 가중치를 연결한다. 다음 조건들은 아직 별도로 남아 있다.

1. 현재 완성된 annulus 배경에 대한 inner flat factor와 제곱근의 zero-extension. 이전 terminal outer 배경의 결과를 자동 이전하지 않는다.
2. 일반적인 모든 충분히 작은 band에 대해 국소 유한 원래 배경·동일한 carrier/Volterra/H template와 위의 보편 상수를 결속하는 정리. 무한한 literal graph 실행은 요구하지 않는다.
3. 속도·potential의 모든 필요한 유한 차수 물리 조건과 stress 조건을 함께 만족하는 **하나의** 재귀 cutoff 수열 및 공통 (\ell_0,q_{\rm big}) 선택. 첫 값이 커질 때 (b_2\ge16b_1)을 다시 강제해야 하므로 단순한 두 수열의 pointwise maximum만으로는 충분하지 않다.
4. 원래 slow partition 및 모든 label 합의 physical chain, 전역 NS residual, flat-error, 전체 수치 적분 오차.

전체 함수 공간·적분·극한·양성의 추가 해석학 Lean 형식화는 별도 후속 작업이다. 기존에 실제 Lean kernel로 검증한 대수 보조정리 14개와 보조 선언 2개는 [완료 관문의 현재 범위](M2_COMPLETION_GATE_KO.md)에 기록되어 있으며, 추가 전체 해석학 형식화를 사용자의 M2 완료에 대한 새로운 차단 조건으로 추가하지 않는다. 현재 코드의 `newAnalyticLeanKernelProof:false`는 이번 모듈에서 새 해석학 Lean 증명을 실행하지 않았다는 사실을 표시한다.

코드의 `allBandsLiteralCovarianceGraphsConstructed:false`는 관측한 실행 범위의 사실이다. 보편 증명을 무한 개의 실행으로 대체하라는 추가 완료 조건은 아니다. 원래 논문에서 지정하지 않은 임의의 (q_{\rm big},\ell_0)에 대한 Γ membership은 `NOT_EVALUATED`로 남는다. 이 단계만으로 G-POS 전체, M2 전체 또는 M3 시작을 승인하지 않는다.

## 소스 연결

- `actual-admissible-annulus-background.mjs`: 실제 (b_n), 1차 계수, slow 인자, 원래 normalized (C^2) 전이.
- `actual-admissible-annulus-covariance.mjs`: 새 actual (H), 목표 stress, 역행렬, witness, 정의역, 비공개 seal.
- `actual-annulus-covariance-kernel.mjs`: reference pressure·대각화·행렬식 부호의 exact algebra와 음성 대조.
- `actual-covariance-matrix.mjs`, `actual-covariance-volterra.mjs`: 원래 움직이는 pressure/frame 및 정확한 homogeneous ODE limit.
- `actual-covariance-operator-bounds.mjs`, `actual-covariance-concentration.mjs`, `actual-covariance-uniform.mjs`: 실제 원시 경계 이후의 유한 power ledger, 연속 농축, robust inverse 다항식.
- `actual-stress-direction-bounds.mjs`: 원래 전체 annulus 방향과 양쪽 flat edge의 normalized modulus. 원래 전체 stress 및 activation/heat 증명에 대한 SHA 결속을 포함한다.
- `actual-covariance-sensitivity.mjs`: 원래 full leading moment·pressure·두 shear를 사용하는 목표 stress 본문.
