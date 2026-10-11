# 같은 공통 family의 실제 물리 중심과 세 성분 수치 값

## 1. 대상과 실행 상태

새 `actual-common-physical-center-enclosure.mjs`는 현재 공통 admissible family의 **원래 first-admissible band**를 사용한다. 옛 terminal witness의 양의 수치 계수를 다른 점에 그대로 붙이지 않고, 원래 torus 지도의 실제 역상에서 새 점을 만든 뒤 그 점에서 fields, Rayleigh root, frame, Volterra 해, H와 y를 다시 평가한다.

두 번째 actual-source 실행은 **12/12 PASS, 실제 관측 exit0**으로 완료했다. 원래 import102개의 실행 전후 SHA가 동일하며, 695628개 노드의 원래 common family와 새 실제 물리점 연결을 검증했다. 실행 시간은329.902474249초, peak RSS는4041027584bytes다. 전체 curl의 **값**과 명시한 양의 척도로 나눈 수치 구간에 한정된 결과다.

첫 source 실행은 실제 새점/양 부호 moving matrix/H/y 결속을 지나 마지막 cutoff plateau의 literal 비교에서 실패했다. 원래 함수값 `sigma(6)`이 expression node로 보존되어 1과 같은 node가 아니었던 것이 원인이다. 작은 원래-class fixture로 재현하고 **원래 psi body, 두 step 인자의 정확한6 항등식, 원래 sigma의 [1,infinity) constant-one 법칙**을 따로 증명하는 helper로 보완했다. 원래 psi 값은 보존한다. 그 뒤 두 번째 source 실행이 실제로 성공했으며, 첫 실패를 설계된 음성대조로 다시 분류하지 않는다.

12개 light 검사는 새 wrong-body/shifted-center/chi삭제 음성대조를 포함해 모두 통과했고, 최종 kernel3 wrapper도 관측 exit0이다. 첫 실패, source snapshot 및 중간 kernel2의 옛 검사수 metadata 실패를 보존했다.

최종 실행물은 `evidence/physical-center-20261011/actual-common-physical-center-source-attempt2.json`이다(SHA256 `bcc676d87bb8de05765a7de2334fe296f95407788a5d2ce16439a9341902ad4e`). 최종 compiler SHA256은 `d7fef39bfe7dbc377bf21c905da1b88d219eee604f55f6f2feb01ab1da1b4ad9`이고, 31297485 canonical bytes와 append 뒤 동일한 발급 prefix를 확인했다. 실행 시 Git HEAD는 `87c7bb6fa1b24e1f8ea3d0281827665cc852de0e`이며 후속 저장 시점의 HEAD로 바꾸지 않는다.

## 2. 원래 지도와 실제 물리점

\[
v_r=(1,1-\sqrt2),\qquad v_t=(\sqrt2-1,1),\qquad D_g=4-2\sqrt2,
\]

\(\Lambda=4-\sqrt2\), \(T_g=4+\sqrt2\)라 놓는다. 원래 palette index \(i\)와 radial exponent \(d_r\)를 사용하면 물리 torus 지도는

\[
Y_i=\Lambda^i r^{d_r}v_r+T_g^i t v_t\pmod{\mathbb Z^2}
\]

이다. 먼저 \(X_*=X_be^{-1/4},R_*=\sqrt{2X_*},Z=0,T=1\)을 **가장 가까운 정수 lift와 slow label을 고르는 기준으로만** 쓴다. 선택한 원래 + rectangle 중심 \(c\)에 대해

\[
k_j=\lfloor Y_{i,*j}-c_j+1/2\rfloor,\qquad y=c+k,
\quad a_r=\frac{v_r\cdot y}{D_g},\quad a_t=\frac{v_t\cdot y}{D_g}
\]

이고

\[
r_\#=\exp\!\left(\frac{\log(a_r/\Lambda^i)}{d_r}\right),\quad
t_\#=a_t/T_g^i,\quad
T_\#=(1-t_\#)/Q,\quad R_\#=r_\#/\sqrt Q,\quad X_\#=R_\#^2/(2T_\#)
\]

로 정의한다. 원래 implicit chart는 Z=0에서 \(s-T_\#=0\)이므로 유일한 s는 T#이고 eta는0이다. 실제 source의 frozen radius와 구조를 맞추기 위해 코드의 R# node는 양의 \(\sqrt{2T_\#X_\#}\)로 쓴다. 그 제곱과 양의 부호를 따로 증명해 위 quotient와 같음을 결속한다.

\(v_r,v_t\)의 직교성과 같은 길이 제곱 Dg가 원래 지도를 복원한다. 구현은 \(\sqrt2^2-2\)에 비례하는 정확한 유리식 잔차를 먼저 남기고 양의 sqrt 법칙을 적용한다. 임의로 xi=0,v=Ls/2를 지정한 점을 물리점이라고 부르지 않는다.

## 3. 역상의 존재, 원래 box 및 terminal 근방

원래 양의 h, 실제 ell과 B의 조건은

\[
0<h<2^{-4096},\quad \ell\ge(64/h)^2,\quad S=\ell^2,\quad
\epsilon=2^{-h\ell},\quad B\ge2^{128},\quad S\ge B^{1024}
\]

이다. \(t=\ell^{1/4}\)를 두면 \(\log_2\ell<8t\), \(h\ell/t\ge512/\sqrt h>512\,2^{2048}\)이다. 명시적 정수 비교로

\[
\epsilon^{1/200000} S^{16384}<2^{-16384}
\]

를 얻는다. 원래 h나 epsilon을0으로 둔 결과가 아니다.

\(\rho=\log\Lambda/\log T_g\)는 \(1/2<\rho<1\)이며 \(1<d_r<17/8<3\)이다. palette floor의 원래 부등식은

\[
\Lambda^iQ^{d_r/2}>\frac{\epsilon^{-1/200000}}{3S}
\]

를 준다. 각 lift 좌표의 변화가 최대1/2이고 \(B^{-1}<R_*<B\)이므로 양의 radial 역상은 \((R_*/2,2R_*)\)에 있다. 평균값 정리로

\[
|R_\#-R_*|<12B^2S\epsilon^{1/200000},\quad
|T_\#-1|<6S\epsilon,
\]

\[
|\log(X_\#/X_*)|<64B^3S\epsilon^{1/200000}
\]

이며 모두 작은 양의 명시 상계다. 따라서

\[
15/16<T_\#<17/16,\quad3/16<\log(X_b/X_\#)<5/16
\]

이고 원래 공통 지지집합의 Xplus 뒤, 열린 terminal collar 안에 남는다.

slow label은 원래 \(\ell^6\) mesh에 대해 고른다. 새점의 offset은 (-9/16,9/16)에 들어 원래 support(-3/4,3/4) 안이다. 원문6.8은 box와 정의역의 교집합에서 대표점을 고를 수 있으므로 이 실제 새점을 먼저 고정한 대표점으로 사용한다. 대표점이 반드시 grid 정수 중심이어야 한다는 새로운 조건을 만들지 않는다.

반대 부호 rectangle의 중심 차는 정확히 \((-2^{-20},0)\)이고 같은 lift에서 \(|\xi_-|>2^{-21}>r_0=2^{-34}\)다. 다른 활성 label은 원래 universal palette 분리 정리로 제외한다. 첫 band의 slow T#가1 근처이므로 인접 band의 support도 겹치지 않는다. 실제 slow partition eta_beta 값은 원래 three-translate 정규화 분모까지 보존한다.

## 4. 새점의 원래 fields, H와 양의 인자

원래 모든 양의 차수 보정은 X>Xplus에서 실제 after-branch가0이다. 이를 적분의 integrand가 compact support라는 이유만으로 primitive까지0이라고 판정하지 않고, 원래 full moment identities와 완성된 U/M/V의 endpoint를 사용한다. 따라서 새점의 열린 근방에서 완성된 F는 full heat leading F와 같고 G와 그 미분은0이다. 원래 heat의 eta 짝함수성으로 F_Z=0이다.

실제 FR<0,F>0에서

\[
N=(-1,0),\quad K=(0,-1),\quad g_{\rm abs}=-R_\#F_R,
\quad \gamma=-c_0>0,\quad \alpha=\gamma^2,
\]

\[
\lambda_0=2F\gamma,\qquad g_{\rm abs}=2F(1+\alpha)
\]

를 얻는다. original positive square root의 radicand와 c0 정의를 실제로 결속한다. 원래 전체 target은 새 \(s^{-A-1/2}\) factor와 full Gamma heat를 유지하며 T_z=0,T_theta>0이다.

두 부호의 원래 moving matrix를 새점에서 다시 만든다. pressure row, moving basis connection, 원래 damping, actual nonzero rounded angular carrier를 모두 포함한다. unrounded carrier는 오차 차이를 정의할 때만 사용하고 실제 carrier를 바꾸지 않는다. 원래 초기값은 (1,0)이다.

중심의 실제 a±, 다른 성분, t의 세 성분, H 두 열, mass 및 inverse y를 같은 새 대표점/평가점에서 대입한다. 새

\[
g=\frac{3\lambda_0u^2}{(1+u^2)^{3/2}},\quad
m=r_0^2/\sqrt{gL_s},\quad A_c=\gamma\sqrt{1+u^2},\quad
\tau=T_\theta/A_c,\quad A_0=\sqrt{\tau/m}
\]

를 쓴다. 기존 T=1,delta=1/4 값에 특화된 mu나 nu 수치표를 새점으로 옮기지 않는다. Gaussian/cone/adiabatic의 값 상계는 이 새점의 실제 인자와 동일한 uniform B/length 조건을 다시 결속한 뒤 사용한다.

수치 출력의 positive scales는 t의 (1,Ac,u), weighted t의 (A0,AcA0,uA0), H 두 행의 (Ac*m,u*m), y의 tau/m, detH의 Ac*u*m^2이다. 각각의 rational coefficient 구간과 nonzero remainder를 유지한다. 아직 이 scale 자체를 모두 수치 평가했다고 표시하지 않으며 별도 nested-exponential profile/geometry/target 확장에서 진행한다.

## 5. exact phase0에서 전체 curl의 값

원래 angular integer p는0이 아니다. 같은 새점에서

\[
\theta_\#=\frac{(L_s/2)(pF+p_zG)-x_0R_\#-p_z Z/\epsilon}{p}
\]

를 고르면 **원래 phase 자체**가 정확히0이다. 실제 양의 potential coefficient는

\[
C=\eta_\beta\sqrt\epsilon\sqrt y\,\chi\psi\,
\frac{n\times t}{k|n|^2}
\]

이고 real potential은 -C sin(kPhi)다. 전체 원통 curl은

\[
-k\nabla_*\Phi\times C\cos(k\Phi)
-\operatorname{curl}_*C\sin(k\Phi).
\]

원래 physical radial fast coefficient a(R)의 실제 미분, Dz=epsilon partialZ와 원통 Ctheta/R 항을 포함한 coefficient curl을 유지한다. shared C의 zero-order materialization은 actual body와 동일함을 확인한다. 이 value packet은 그 shared coefficient의 모든 slow derivative를 별도 변분 system으로 numerical materialization했다고 주장하지 않는다.

실제 phase gradient가 n이라는 source 항등식, 원래 B의 양의 nt=sqrt(ntheta^2+nz^2) 관계에서 n·t=0, 그리고 vector triple product를 결속한다. 따라서 phase0에서 **값만**

\[
\operatorname{curl}_*(-C\sin(k\Phi))
=\eta_\beta\sqrt\epsilon\sqrt y\,t
\]

가 된다. 물리값에는 Q^-A가 붙는다. chi(0)=psi(Ls/2)=P(Ls/2)=1은 원래 cutoff의 정확한 성질로 별도 증명한다.

원래 pressure sine 항도 이 점의 값만0이다. sine remainder의 미분, pressure 미분, 전체 nonlinear NS residual을0으로 두지 않는다. Cartesian 값은 원래 theta#로 회전한 정확한 세 성분 표현을 반환한다. 원래 angle 자체를 binary64로 반올림해 고정 상대오차의 Cartesian 소수값을 얻었다고 주장하지 않는다.

## 6. 실행 범위와 다음 입력

이 새 packet의 목표는 같은 공통 family의 하나의 genuine physical center에서 세 성분과 H/y의 scaled 값, 전체 curl의 scaled 값이다. slow/mixed/fast 도함수의 실제 물리 수치값, 모든 label 수치 범위, 전역 physical residual enclosure, 전체 G-NUM/M2/M3 관문은 별도다.

원래 positive scale의 절대 구간을 위해 source-only 숫자 중첩exp/log 평가를 추가하고 있다. common selector의 실제 FTC norm에 대한 명시적 유한 수치 power bound와 새점의 원래 terminal target 적분을 결속해야 한다. finite coefficient 구간이나 저장된 원래 symbolic scale을 그 완료의 대체물로 쓰지 않는다.

독립 검토는 [물리 중심 검토 기록](evidence/physical-center-20261011/INDEPENDENT_PHYSICAL_CENTER_REVIEW_KO.md)에 있다. 검토자는 위 실행의102개 import SHA와12/12 검사를 다시 대조했고, 명시한 값·척도 범위의 수학적 오류를 찾지 못했다. 해당 검토가 읽은 본문 SHA는 `91fa480ff8b669794a72676cf1db42703b34346794f581be8475596e68cc3b68`이며, 그 뒤 변경은 이 검토 링크 문단 추가뿐이다. 실행 코드와 원래 실행 기록은 불변이다.
