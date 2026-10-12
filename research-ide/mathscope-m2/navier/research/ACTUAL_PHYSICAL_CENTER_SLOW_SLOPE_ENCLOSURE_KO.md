# 새 실제 물리점의 비교 기울기와 유한 수치 도함수

## 1. 이 문서의 범위

새 adapter는 같은 공통 admissible band의 원래 torus 역상으로 구성한
**새 물리점과 새 고정 대표점**을 사용한다. 원래 midpoint의 실제 Volterra
해나 미분값을 새 점으로 옮기지 않는다. 옮기는 것은 아래에서 별도로 정의하는
매끄러운 비교 계수 여섯 개뿐이다. 이들의 근방 미분을 원래 양의 지수와
전체 열 적분에서 제어한 뒤, 정확한 점 이동 경계를 이용한다.

- [비교 계수와 조건부 수치 표](../actual-physical-center-slow-slope-kernel.mjs)
- [새 물리점의 원래 식에 결속하는 adapter](../actual-physical-center-slow-slope-enclosure.mjs)
- [독립적으로 생성하는 실제 미분 bodies](../actual-physical-center-jet-bodies.mjs)
- [전체 curl과 원통 각도 Hessian의 일반 항등식](../actual-physical-center-full-curl-jet-kernel.mjs)

마지막 두 모듈의 원본 실행은 비교 계수의 경량 산술과 별개이다. 작성 시점에
경량 적분함수·몫 항등식·조인 검사는 끝났으며, 하나의 실제 물리점에서
원본 생성기들을 함께 실행하는 검사는 부모 작업에서 진행 중이다.
실행이 끝나기 전에는 이 문서를 그 실행의 성공 영수증으로 사용하지 않는다.

## 2. 고정하는 점과 원래 식

원래 상수, 선택 band, rounded carrier와 대표점 label을 고정한다.
기준 비교점은

\[
(\delta_\ast,T_\ast)=(1/4,1),\qquad
\delta=\log(X_b/X).
\]

실제 새 점은 양의 원래 torus 역상과 정수 lift로 결정되며,
각 비교 좌표의 이동은 엄밀하게 \(2^{-16384}\)보다 작다.
따라서 두 점을 잇는 선분은

\[
\delta\in[3/16,5/16],\qquad T\in[15/16,17/16]
\]

안에 있다. 이 작은 이동은 원래 공통 선택 규칙의 양의
\(\epsilon\)과 강한 주파수 경계에서 나온다. 정수 carrier나 palette를
연속 함수로 간주해 이동시키는 주장은 하지 않는다.

완성된 배경은 이 열린 terminal 근방에서 원래 leading 배경과 같다.
이는 원래 양의 차수 항들의 공통 지지집합 밖이라는 별도 source 결속을
사용한다. 원래 slow 인자와 열 인자를 유지하면 중간 평면 \(Z=0\)에서

\[
F(R,0,T)=E_\ast (R^2/2)^{-1-h}\,f(\delta)H(z),\qquad
\delta=\log(2TX_b/R^2),\qquad z=4T/R^2=2/X,
\]

\[
f(\delta)=1-\frac{h}{256}\sigma(\delta/2).
\]

여기서 \(E_\ast\)는 원래 고정된 양의 상수이다. 마지막 terminal 구간의
길이가 정확히 \(3\)이고, 원래 cutoff가
\(\sigma(1-x)=1-\sigma(x)\)를 만족한다는 사실에서 위 \(f\)를 얻는다.
기존 식의 값을 바꾼 것이 아니라 원래 식과 근방에서 같은 표현이다.

## 3. 전체 열 적분과 양의 \(h\) 인수분해

원래 열 함수는

\[
H(z)=\frac{1}{\Gamma(1+h)}
\int_0^\infty e^{-u}u^h(1+zu)^{-h}\,du
\]

이다. 코드에서는 원래 \(u=x/(1-x)\), \(0<x<1\) 치환과
Jacobian을 보존한다. 원래 heat-loss 적분과 이 적분을 더하면 동일한
Gamma 밀도가 되는 항등식을 검사한다. 원래 양 끝점을 가진 전체 적분을
사용하며, 잘라낸 무한 꼬리를 0으로 놓지 않는다.

\[
M_j(z)=\frac{1}{\Gamma(1+h)}
\int_0^\infty e^{-u}u^h(1+zu)^{-h}\frac{u^j}{(1+zu)^j}\,du.
\]

고정된 \(X_b\)에 대해 \(d/d\delta=\partial_\delta+z\partial_z\)이므로

\[
\begin{aligned}
H_\delta/h&=-zM_1,\\
H_{\delta\delta}/h&=-zM_1+z^2(1+h)M_2,\\
H_{\delta\delta\delta}/h
&=-zM_1+3z^2(1+h)M_2-z^3(1+h)(2+h)M_3.
\end{aligned}
\]

원래 적분함수를 직접 세 번 미분한 뒤 이 세 표현과 비교한다.
Gamma moment 지배에 의해 적분 아래 미분이 정당하다. 구체적으로
\(0<h<1,\ z\ge0\)이면

\[
|H^{(j)}(z)|/h\le j!(j+1)!,\qquad j=1,2,3.
\]

모듈의 heatDeltaOverH라는 내부 이름에서 분모는 대문자 열 함수가 아니라
**원래의 소문자 양의 지수 \(h\)**이다. 실제 지수는
\(0<h<2^{-4096}\)이며 수치 0으로 치환하지 않는다.

## 4. 실제 source 미분으로 정의한 여섯 기울기

각 미분을 먼저 원래 식에 적용하고, 나중에 실제 새 점에 대입한다.
\(D_R=R_\sharp\partial_R,\ D_Z=\partial_Z,\ D_T=\partial_T\)에서
\(R_\sharp\)는 미분 후의 고정 정규화 값이다. 따라서 이 표의
반복 \(R\) 미분은 미분 중에 \(R\)을 다시 곱하는 Euler 연산자가 아니다.

\[
\alpha=-\frac{RF_R}{2F}-1=h\bar A,\qquad
\bar A=1+\frac{f_\delta}{hf}+\frac{H_\delta}{hH},\qquad
\xi=\frac{\bar A_\delta}{\bar A}.
\]

원래 frame의 양의 Rayleigh 인자와 이 \(\alpha\)가 같다는 별도 항등식을
유지한다. 원래 field의 도함수로

\[
c_i=\frac{D_iF}{F}+\frac{D_i\alpha}{2\alpha},
\qquad d_i=\frac{D_iF_R}{F_R},
\qquad \kappa=\frac{1+u^{-2}}3
\]

를 정의한다. \(u=2R_{\rm env}^{10}\)도 원래 유한 양의 값이다.
완전한 감쇠항을 미분한 비교 계수는

\[
\mu_i=\kappa c_i-\frac12d_i.
\]

중간 평면에서 얻는 식은

\[
\begin{aligned}
c_R&=-2(1+\alpha)-\xi,&
d_R&=-3-2\alpha-\frac{2\alpha\xi}{1+\alpha},\\
c_T&=\frac{\alpha-h+\xi/2}{T},&
d_T&=\frac{\alpha-h+\alpha\xi/(1+\alpha)}{T},\\
c_Z&=0,&d_Z&=0.
\end{aligned}
\]

이에 따라

\[
\mu_T=\frac{(\kappa-\frac12)(\alpha-h)
(\frac{\kappa}{2}-\frac{\alpha}{2(1+\alpha)})\xi}{T},
\]

\[
\mu_R=\frac32-2\kappa+(1-2\kappa)h-2T\mu_T.
\]

임의의 양의 \(T\)에서 이 식을 검사한다. \(T=1\)에서만 성립하는
표현을 재사용하지 않으며, \(1/T\)를 누락한 부정 대조는 실패한다.

두 번째 비교 계수는

\[
I_A=\frac{\log2}{3},\qquad
I_B=\frac{\log2}{3}-\frac7{72},\qquad
\nu_i=I_Ac_i-I_Bd_i.
\]

이는 **극한 transport 비교 적분으로 정의한 계수**이다.
실제 유한 \(u\)의 적분이나 실제 Volterra 로그 도함수 자체와 같다고
선언하지 않는다. 원래 유한 \(u\)의 두 적분에는 각각
\(8/u^2,\ 64/u^2\)라는 별도의 양의 오차가 있고,
초기층과 Riccati 오차도 후속 실제 source 경계에 남는다.

## 5. 분모를 0으로 만들지 않는 근방 오차

\(\delta/2\in[3/32,5/32]\)에서 원래 smooth step의 지수
\(g(x)=-x^{-2}+(1-x)^{-2}\)는 \(-38\)보다 작다.
직접 유리수 계산으로

\[
|g'|<2^{12},\quad |g''|<2^{19},\quad |g'''|<2^{25},
\]

를 얻고, step의 정확한 곱 미분으로 필요한 세 도함수를 \(2^{64}\) 아래로
제어한다. \(0<z<1/16\)에서 Gamma 지배와 함께 사용하면

\[
f>1/2,\quad H>1/2,\quad 1/2<\bar A\le1.
\]

\(a_1=f_\delta/h,a_2=f_{\delta\delta}/h,a_3=f_{\delta\delta\delta}/h\)
라고 쓸 때,

\[
\left(\frac{a_1}{f}\right)'
=\frac{a_2}{f}-h\frac{a_1^2}{f^2},
\qquad
\left(\frac{a_1}{f}\right)''
=\frac{a_3}{f}-3h\frac{a_1a_2}{f^2}
+2h^2\frac{a_1^3}{f^3}.
\]

열 함수에도 같은 규칙을 적용한다. 계수 \(3\)의 교차항과 마지막 역수항을
모두 보존한다. 계산 장부는

\[
|\bar A_\delta|,\ |\bar A_{\delta\delta}|<2^{67},\qquad
|\xi|<2^{68},\quad |\xi_\delta|<2^{137}
\]

를 주며, 모든 \(\mu_i,\nu_i\)의 \(\delta,T\) 1차 도함수는
\(2^{144}<2^{512}\)로 제어된다. 따라서 실제 점 이동에 따른 각 비영
비교 계수의 오차는

\[
2\cdot2^{512}\cdot2^{-16384}<2^{-15000}.
\]

구간 산술은 이 엄밀한 양의 반경을 더하고 외향 반올림한다.
\(Z\) 비교 계수의 정확한 0은 원래 짝대칭만의 결론이다.
실제 행렬의 \(\epsilon\) 항, moving frame과 두 번째 모드의
\(Z\) 도함수를 0으로 두는 결론이 아니다.

## 6. 후속 228개 조건부 계수와 42개 물리 도함수

일반 표 계산기는 입력 구간만으로 source 권한을 만들지 않는다.
실제 adapter가 동일한 새 점의 두 원래 행렬·초기값·그 미분,
전체 시간 Riccati/Gaussian 경계, frame, 원래 \(H^{-1}\) 및 양의
\(\sqrt y\) 미분을 별도로 결속해야 한다.

| 대상 | 도함수 | 두 부호를 합친 행 수 |
|---|---|---:|
| 가중 pulse의 세 성분 | R/Z/T 1차 및 대칭 2차 | 54 |
| 가중 pulse의 세 성분 | v, vv, Rv, Zv, Tv | 30 |
| 원래 pulse의 세 성분 | R/Z/T 1차 및 대칭 2차 | 54 |
| 중심의 첫 모드 a | R/Z/T 1차 및 대칭 2차 | 18 |
| 원래 H의 네 원소 | R/Z/T 1차 및 대칭 2차 | 36 |
| 원래 양의 두 weight y | R/Z/T 1차 및 대칭 2차 | 18 |
| 원래 두 번째 모드 | R/Z/T 1차 및 대칭 2차 | 18 |
| 합계 | | 228 |

모든 행은 \(2^{-560}\)의 양의 analytic reserve와 실제 외향 반올림을
유지한다. 예를 들어 \(r=w_-/w_+,\ q=\log w_+\)일 때
\((ar)_{ij}\)에는 \(q_{ij}r,\ q_ir_j,\ q_jr_i,\ r_{ij}\)가 모두 남는다.
원래 source 경계 \(r\le B^{260}/S,\ |r_i|\le B^6,\ |r_{ij}|\le B^{14}\)
등에서 정규화된 두 번째 모드 도함수가 \(B^{264}/S<2^{-560}\)라는
양의 반경 안에 들어간다. 두 번째 모드를 정확히 0으로 선언하지 않는다.

전체 실제 curl을

\[
U=L\cos(k\Phi)-K\sin(k\Phi),\qquad K=\operatorname{curl}C
\]

로 쓸 때, 위상값 0은 미분 **후에** 적용한다. 원통 성분에 대해

\[
J(V)=(-V_\theta,V_r,0),\qquad
N_\theta V=\frac{\partial_\theta V+J(V)}R
\]

이며,

\[
H_{i\theta}=D_i(N_\theta U)\quad(i=r,z,t),\qquad
H_{\theta\theta}=N_\theta(N_\theta U)+\frac{D_rU}{R}.
\]

마지막 항은 방향 기저 자체의 미분에서 나온다. 이를 포함해 4방향 1차
12개와 대칭 2차 30개, 총 42개의 원래 물리 도함수 값을 생성한다.
원래 양의 주파수 크기는

\[
\Omega_r=B_su,\quad \Omega_z=B_s,\quad
\Omega_t=\widetilde pF,\quad \Omega_\theta=\widetilde p/R,\qquad
\widetilde p=\frac{RB_su}{L_sg_{\rm abs}}>0
\]

이고 위상 부호는 \(r,\theta\)가 양, \(z,t\)가 음이다.
특히 각도 위상 Hessian의 \(D_r\Phi/R\)를
\(\Omega_\theta^2\)로 나누면 pulse 길이 제곱이 남으므로,
source phase 장부는 \(B^{64}S^2\)를 사용한다.

위상 0에서의 2차 curl **값**은 \(C\)의 2차 및 \(\Phi\)의 3차 미분을
요구한다. \(C\)의 3차 미분에 곱해진 sine 값만 이 점에서 소거된다.
전체 potential의 3차 미분이 없어도 된다는 주장은 하지 않는다.
42개 조건부 수치 행의 양의 reserve는 \(2^{-512}\)이다.

## 7. 정확도와 source 실행의 구분

요청 정확도는 표시한 **정규화 계수 구간의 폭**이다.
원래 \(A_c,u,g,L_s,\tau,\epsilon,Q,k\) 등 양의 정규화 인자들은
미분 뒤에 고정한 원래 식으로 각 행에 남는다.
그 인자들의 반복 지수 크기까지 별도로 평가하지 않았다면 원래 비정규화
도함수의 상대 정확도를 확보했다고 표시하지 않는다.

현재 비교·조인 경량 검사는 18/18, 각도 curl 경량 검사는 11/11이다.
원래 source constructor를 실행한 결과와 혼동하지 않도록 영수증은
actualSourceConstructorExecuted=false를 기록한다.

- [비교·조인 18개 실행 영수증](evidence/physical-center-full-jets-20261011/slow-slope-and-interface-kernel-attempt1.json)
- [해당 실행 로그](evidence/physical-center-full-jets-20261011/slow-slope-and-interface-kernel-attempt1.log)
- [각도 42행 일반 검사 영수증](evidence/physical-center-full-jets-20261011/angular42-kernel-attempt2.json)
- [각도 검사 로그](evidence/physical-center-full-jets-20261011/angular42-kernel-attempt2.log)

각도 검사의 첫 시도는 affine Cartesian 위치 벡터 검사에서 \(R/R\)의
노드 ID를 1의 노드 ID와 직접 비교한 한 줄만 실패했다.
정확한 유리식 항등식으로 검사하도록 고쳤으며, 당시 관측 결과와 테스트
원문은 별도 파일에 보존했다. 원래 curl 식이나 연결항을 삭제한 수정은 없다.

이 단계만으로 모든 source label, 전역 잔차의 수치 구간, 새로운 Lean
kernel 증명 또는 M3 시작을 승인하지 않는다.
