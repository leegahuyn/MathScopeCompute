# 실제 작은 q 공분산의 바깥 경계: 양의 계수와 제곱근의 평탄한 0 연장

## 결론과 범위

이 문서는 원래 식으로 새로 만든 작은 q 공분산에서 바깥 응력 경계 \(X=X_b\)를 다룬다. 내부의 양의 가중치만 확인한 앞선 terminal 결과에 다음 내용을 추가한다.

1. 원래 전체 응력의 공통 평탄 인자를 분리한 뒤, 나머지 실제 계수 \(W=H^{-1}\bar b\)가 경계에서도 엄밀히 양수임을 보인다.
2. 실제 공분산 행렬식에 \(d_*/S\)라는 양의 하한을 주고, 역행렬에는 \(C_*S\)라는 상한을 준다. \(d_*,C_*\)는 실제 소스 표현식이다.
3. 원래 정규화 pulse 행렬의 음의 대각항을 유지한 logarithmic norm으로 유한 차수 slow 미분의 \(S\) 거듭제곱 경계를 도출한다.
4. \(\sqrt{y_i}\)의 바깥 경계 0 연장을 구성하고, 모든 고정된 유한 차수의 미분이 그 경계에서 0임을 서술형 해석 증명으로 보인다.

이 결과의 정의역은 **선택한 작은 q band의 바깥 collar와 고정 라벨 chart**이다. 안쪽 경계, 큰 활성 completed 계수 prefix가 있는 모든 내부 box, 원문 전체의 최종 \(\Gamma\), 전체 물리 잔차 및 flat-error, 새로운 해석 Lean kernel 증명을 포함하지 않는다. 전체 G-POS, M2 완료, M3 시작은 이 결과로 승인되지 않는다.

소스 모듈은 [actual-outer-covariance-flat-extension.mjs](../actual-outer-covariance-flat-extension.mjs)이며, 앞서 저장된 [실제 admissible terminal 공분산](ACTUAL_ADMISSIBLE_TERMINAL_COVARIANCE_KO.md)의 private 인증 객체를 새 그래프에 복사한다. 이전 모듈과 배포 bundle은 수정하지 않는다.

현재 실행 상태는 아래 검증 절에 별도로 기록한다. 함수가 반환하는 해석 명제, 정확한 대수 검사, 실제 소스 실행, 수치 구간 적분, Lean kernel 검사는 서로 다른 증거다.

## 1. 실제 정의역과 대표점

\[
\ell_*=\ell_{\min}+8,\qquad Q_*=2^{-\ell_*},\qquad
S_*=\ell_*^2,\qquad q=Q_*s,\quad \tfrac12\le s\le2.
\]

이 \(\ell_{\min}\)은 기존 실제 source direction, matrix perturbation, Gaussian concentration 조건을 합친 충분조건에서 온다. 전체 physical band가 그 source \(q_*\)보다 작다는 사실은 앞선 terminal 인증에서 이미 결속했다. 원문에 존재한다고 서술된 미지의 최종 \(q_{\rm big},\ell_0\) 값을 이 선택과 동일시하지 않는다.

새 관측 chart는

\[
\delta=\log(X_b/X),\qquad
X=X_be^{-\delta},\quad0\le\delta\le\tfrac12,
\quad
R=\sqrt{2sX},\quad Z=s^D\eta,\quad T=s(1-\eta^2).
\]

고정 대표점은 \(X_+<X_{\rm rep}\le X_b\), \(|\eta_{\rm rep}|\le1\), \(s_{\rm rep}\in[1/2,2]\)에 놓이고, 관측점은 같은 원래 box에 있으며 slow 거리가 \(4/S_*^3\) 이하이다. 경계를 만나는 box에서 이 chart의 0 연장을 적용한다. 서로 독립적인 두 점 전체에 대한 농축·방향 명제를 주장하지 않는다.

원문 (6.8)의 허용 집합은 \(X=X_b\)를 포함한다. 실제 끝점 검사는

\[
X=X_{\rm rep}=X_b,\quad
\eta=\eta_{\rm rep}=0,\quad s=s_{\rm rep}=1,
\quad R=\sqrt{2X_b},\ Z=0,\ T=1
\]

를 사용한다. 이 점을 포함하는 lattice box를 고르고 그 점 자체를 대표점으로 택할 수 있다. 원래 규칙은 대표점을 lattice 중심으로 제한하지 않는다. 이 대표점에서 carrier를 **직접 고정**하며, 대표점을 움직일 때 나타나는 정수 반올림의 불연속을 연속이라고 가정하지 않는다.

\(\eta=\pm1\)에서는 원래 \(z\ge0\) heat의 한쪽 경계 jet을 쓴다. 열린 chart에서는 통상적인 smoothness를 얻는다. 원래 실수 Laplace 적분을 \(T<0\)까지 연장했다는 주장은 하지 않는다.

## 2. 원래 전체 응력에서 가져온 정확한 평탄 인자

원문 부록 A.8–A.10, 특히 (A.48)–(A.54)는

\[
T_0(X,\eta)
= e^{-4/\delta^2}\delta^{-3}
   \bigl(b_\theta(\delta,\eta),\delta^6b_z(\delta,\eta)\bigr)
\]

를 준다. 따라서 현재 slow chart의 응력은

\[
\bar T=f_{\rm wt}(\delta)\,\bar b,\qquad
f_{\rm wt}=e^{-4/\delta^2}\delta^{-3},\qquad
\bar b=s^{-A-1/2}(b_\theta,\delta^6b_z).
\]

정규화할 방향은 \((b_\theta,\delta^6b_z)\)의 방향이다. 축방향 성분의 \(\delta^6\)을 버리면 원래 응력 방향이 달라진다.

소스는 [actual-stress-direction-program.mjs](../actual-stress-direction-program.mjs)의 원래 outer factor 프로그램을 직접 복사한다. 여기에는 다음 항이 모두 남아 있다.

- (A.54)의 경계 angular 항, viscous 적분, inviscid 적분.
- 압력에 나타나는 실제 \(K^2\), 원래 outer cutoff 및 두 번의 axial 적분.
- \(h>0\)인 전체 Euler Gamma/Laplace heat 적분.
- 원래 profile의 모든 outer stage, terminal 높이와 위치.

정칙 커널은

\[
\mathcal J_{4,m}G(\delta)
=\int_0^\infty e^{-4t}(1+\delta^2t)^{-(m+3)/2}
G\!\left(\frac{\delta}{\sqrt{1+\delta^2t}}\right)\,dt,
\qquad m\ge-3.
\]

각 고정된 유한 혼합 미분의 적분 integrand는 \(e^{-4t}\)와 \(t\)의 다항식의 곱으로 지배된다. 원래 \(G\)의 해당 유한 미분은 닫힌 outer collar에서 유계이다. 지배수렴으로 모든 필요한 경계 미분을 얻으며

\[
\mathcal J_{4,m}G(0)=G(0)/4
\]

이다. 이 식은 적분의 수치 근사가 아니다.

원래 forward moment target도 그래프에 그대로 보존한다. 그 target과 위의 backward factor가 같다는 근거는 원래 regular-axis 성질, 실제 B8/C12/I1의 다섯 moment 복원, 전체 I2 heat 보상에 의해 성립하는 A.8의 적분 항등식이다. 복잡한 forward AST를 상수 0이나 임의의 factor AST로 바꾸지 않는다. 이 해석적 적분 항등식을 rational normalizer만으로 검사했다고 기록하지 않는다.

현재 바깥 영역은 모든 양의 completed 차수의 공통 지지 끝점 \(X_+\)보다 바깥이다. 따라서 실제 무한 completed 배경과 모든 고정 유한 jet이 leading 배경과 정확히 같다. \(X\le X_+\)의 큰 활성 prefix를 잘라내어 이 결론을 얻은 것이 아니다.

## 3. 특이 공식을 대입하지 않는 실제 경계 계수

다음 기호는 원래 source의 값이다.

\[
\rho=h/256,\qquad
E_{\rm pow,b}=P_*\exp(\operatorname{logAEnd}),\qquad
H_b=H\!\left(2(1-\eta^2)/X_b;h\right).
\]

원래 \(h,\rho,E_{\rm pow,b},H_b\)는 모두 양수이고 heat를 1로 바꾸지 않는다. 정칙 커널의 경계식은

\[
b_\theta(0,\eta)
 =\frac{16\rho\,E_{\rm pow,b}\,H_b\,e}{\sqrt{2X_b}}>0,\qquad
(\delta^6b_z)(0,\eta)=0
\]

를 준다.

새 프로그램은 이 식으로 \(\bar b(0)\)를 **별도로** 구성한다. \(H(0)\)에는 실제 공분산 적분을 현재 경계 좌표에서 대입한다. 그런 다음

\[
W(0)=H(0)^{-1}\bar b(0)
\]

를 만든다. \(\delta^{-3}\), \(\exp(-4/\delta^2)\), \(\log\delta\)가 있는 내부식에 \(\delta=0\)을 대입하지 않는다.

원래 forward target의 경계 AST도 보존한다. 그 실제 값 \(\bar T(0)=0\)과 아래 \(y_i(0)=\sqrt{y_i}(0)=0\)는 공통 평탄 인자와 정확한 backward 표현에서 따라온다.

## 4. 경계에서도 유지되는 실제 양의 \(W\) 하한

고정된 source frame에서

\[
\mathcal A=(-c_0)\sqrt{1+u^2}>0,\qquad
\widetilde\tau=-\frac{N\cdot\bar b}{\mathcal A}.
\]

기존 source direction 증명은 닫힌 outer collar에서

\[
b_\theta\ge C^{-10},\quad
-N\cdot\frac{(b_\theta,\delta^6b_z)}
 {|(b_\theta,\delta^6b_z)|}>R_{\rm env}^{-33}
\]

를 제공한다. 같은 source에서

\[
\tfrac14<s^{-A-1/2}<4,\qquad
\mathcal A<4R_{\rm env}^{20},\qquad
\mathcal A>R_{\rm env}^{-6},
\]

\[
R_{\rm env}>C^{10},\qquad R_{\rm env}>16,\qquad
|(b_\theta,\delta^6b_z)|<2R_{\rm env}
\]

를 얻는다. 뒤의 크기 흡수는 실제 coefficient의 \(C\) 거듭제곱 상한과 기존 정량 source power absorption에서 온다. 따라서

\[
R_{\rm env}^{-56}<\widetilde\tau<R_{\rm env}^{8}.
\]

아래 \(m_{\rm up}\)은 실제 positive mass의 공통 상한이다. 기존 실제 covariance cone이 \(H W=\bar b\)에 적용되므로

\[
\boxed{\quad
W_i\ge
w_*:=\frac{\kappa R_{\rm env}^{-56}}{64m_{\rm up}}>0
\quad}
\]

이다. 이 하한은 경계에서도 성립한다. \(\bar T=0\)인 경계에서 \(T/|T|\)를 계산하지 않고, 위 정칙 계수의 방향을 사용한다.

여기서 \(\mu_\chi=\int\chi^2\,d\xi>0\), \(D_g=4-2\sqrt2\),
\(A_{\rm up}=2\exp((2E+E_d)L_{\max})\)라 하면

\[
\operatorname{haar}=\frac{D_g}{2}c_i\mu_\chi,\qquad
L_s=\frac{2r_0}{c_i},\qquad
m_{\rm up}=\operatorname{haar}A_{\rm up}^2L_s
=D_gr_0\mu_\chi A_{\rm up}^2.
\]

마지막 소거는 실제 소스의 정확한 rational identity로 검사한다. 따라서 \(w_*\)는 band 크기 \(S\), 대표점 및 관측점에 의존하지 않는 양의 source 표현식이다. 그것을 유한 정밀도 숫자로 계산했다는 뜻은 아니다.

## 5. 행렬식과 역행렬의 \(S\) 의존성

기존 실제 정규화 두 column 결과는 \(\det H<0\)과

\[
|\det H|>\frac{15}{8}\mathcal A u\,m_{\rm low}^2,\qquad
m_{\rm low}=\operatorname{haar}\,c_m\sqrt{L_s}>0
\]

를 준다. \(c_m\)은 source Gaussian mass 하한 계수이다. 정확한 전개로

\[
\frac{15}{8}\mathcal A u\,m_{\rm low}^2
=\frac{15}{16}\mathcal A uD_g^2r_0\mu_\chi^2c_m^2c_i.
\]

프로그램은 이 항등식을 두 종류의 근거로 분리한다. 곱과 몫의 전개는 rational checker로 검사하고, \((\sqrt{L_s})^2=L_s\)는 원래 palette의 \(L_s\ge L_{\min}S>0\)에 대한 positive square-root 규칙으로 명시한다. rational checker가 이 해석 규칙까지 증명한 것처럼 표시하지 않는다.

실제 palette는 \(c_i>1/(T_gS)\)이다. 따라서

\[
\boxed{\quad
|\det H|>\frac{d_*}{S},\qquad
d_*=\frac{15}{16}
\frac{R_{\rm env}^{-6}uD_g^2r_0\mu_\chi^2c_m^2}{T_g}>0
\quad}.
\]

source Riccati cone의 \(|z_-/z_+|\le1/2\), \(|s_a|\le2u\), \(|c|\le2uR_{\rm env}^{10}\)에서

\[
|t_{\rm tan}|\le8uR_{\rm env}^{10}t_r.
\]

그러므로 각 \(|H_{ij}|\le C_H:=8uR_{\rm env}^{10}m_{\rm up}\)이고, 2차원 adjugate 식으로

\[
\boxed{\quad
\|H^{-1}\|_\infty\le (2C_H/d_*)S
\quad}.
\]

\(d_*,C_H,2C_H/d_*,w_*\) 모두 새 프로그램의 실제 root로 반환한다. 사용자가 임의의 determinant나 양성 하한을 입력하는 경로는 없다.

## 6. 큰 절댓값 norm 대신 실제 안정 대각항을 유지한다

두 actual pulse의 정규화 행렬에는 정확히

\[
M=\begin{pmatrix}0&0\\0&-2\lambda\end{pmatrix}
+E_{\rm actual}-(d-d_{\rm ref})I,\quad
|(E_{\rm actual})_{ij}|\le E/S,\quad |d-d_{\rm ref}|\le E_d/S
\]

가 성립한다. 두 sign 각각 네 entry의 동일성을 실제 matrix AST로 검사한다. 여기서는 원래 pressure, moving normal, \(B'\), actual damping을 유지한다.

실수 행렬의 induced infinity logarithmic norm은

\[
\mu_\infty(M)=\max_i\left(M_{ii}+\sum_{j\ne i}|M_{ij}|\right)
\le(2E+E_d)/S.
\]

따라서 \(0\le u_0\le v\le L_s\le L_{\max}S\)에서

\[
\|\Phi(v,u_0)\|_\infty
\le\exp((2E+E_d)L_{\max}).
\]

이 상한은 \(S\)와 무관하다. \(\|M\|\)의 절댓값에 Grönwall을 적용해서 음의 대각항을 버리는 경로는 이 증명에 사용하지 않는다. 실제 source에서는 \(E_d=E=B_{\rm norm}^{256}\)이다.

## 7. 고정된 모든 유한 slow 미분의 다항 경계

아래에서 모든 미분은 현재 slow 좌표 \(R,Z,T\)에 관한 것이며, band, box 대표점, 반올림된 carrier와 \(L_s\)는 고정한다. \(C_j\)는 고정 source와 유한 차수에만 의존하는 유한 상수다.

1. 닫힌 outer collar의 leading 배경은 elementary terminal 식, 원래 square-seed cutoff, 전체 Laplace heat로 구성된다. \(z\ge0\)에서 \(|H^{(j)}(z)|\le(h)_j(1+h)_j\)이므로 각 유한 미분은 유계이다. 정칙 backward factor에는 앞 절의 지배수렴을 적용한다.
2. 실제 \(n\)에는 pulse 시간 \(v\le L_{\max}S\)가 선형으로 나타난다. 모든 \(j\ge1\)에 대해 \(n_j=O(S)\), \(n'_j=O(1)\)이다. \(n\) 자체, \(|n|^{-1}\), \(n_{\rm tan}^{-1}\), \(c^{-1}\)에는 기존 실제 source의 양의 분모 하한과 크기 상한이 적용된다.
3. \(k\)는 행렬에서 \(\epsilon k^2\in[1,4]\) 및 이미 유계인 고정 carrier를 통해 나타난다. 반올림된 라벨을 slow 미분하지 않는다. 유한 곱·역수·제곱근 chain rule로 \(M_j,B_j=O(S^j)\)를 얻는다.
4. \(w(0)=(1,0)\)의 slow 미분은 0이다. \(w_\alpha\)의 forcing에 variation of constants와 안정 propagator를 적용하면
   \[
   (w_\alpha)'=Mw_\alpha+
   \sum_{0<\beta\le\alpha}{\alpha\choose\beta}M_\beta w_{\alpha-\beta},
   \qquad w_j=O(S^{2j}).
   \]
   각 forcing의 지수는 \(1+k+2(j-k)\le2j\)이다.
5. 원래 \(P(v)\)는 현재 \(R,Z,T\)에 실제로 의존하지 않는다. 따라서 \(t_j/P=O(S^{2j})\)이다. \(P\le1\), \(\operatorname{haar}L_s=D_gr_0\mu_\chi\)를 사용하면 \(H_j=O(S^{2j})\)이다.
6. \(H W=\bar b\), \(\|H^{-1}\|_\infty=O(S)\)를 미분하면 \(W_j=O(S^{3j+1})\)이다. \(k\ge1\)인 항의 지수는 \(1+2k+3(j-k)+1\le3j+1\)이다.
7. \(\sigma=\sqrt W\)에는 \(\sigma\ge\sqrt{w_*}>0\)가 있다. 항등식
   \[
   2\sigma D^\alpha\sigma
   =D^\alpha W-
   \sum_{0<\beta<\alpha}{\alpha\choose\beta}
     D^\beta\sigma D^{\alpha-\beta}\sigma
   \]
   로 \(j\ge1\)에서 \(\sigma_j=O(S^{4j})\), 값에는 느슨한 \(O(S)\) 상한을 얻는다. 합에서 두 끝점은 제외한다.

이는 유한 샘플 차수를 무한 차수로 외삽한 주장이 아니다. 동일한 finite product/chain/variation 공식과 표시된 affine 지수 부등식에 대한 귀납 증명이다. 각 \(C_j\)의 개별 수치 값까지 계산한 것은 아니다. 모든 box의 completed 내부 배경에 이 주장을 적용하지 않는다.

## 8. 평탄한 scalar factor와 0 연장

\[
f(\delta)=e^{-2/\delta^2}\delta^{-3/2},\quad\delta>0,\qquad
f(\delta)=0,\quad\delta\le0.
\]

정확한 미분 재귀는

\[
f^{(j)}(\delta)
=f(\delta)\delta^{-3j}P_j(\delta^2),\qquad P_0=1,
\]

\[
P_{j+1}(x)=\left[4-\left(\tfrac32+3j\right)x\right]P_j(x)
          +2x^2P'_j(x).
\]

예를 들어

\[
P_1=4-\tfrac32x,\quad
P_2=16-24x+\tfrac{15}{4}x^2,\quad
P_3=64-216x+147x^2-\tfrac{105}{8}x^3.
\]

\(B_j=\sum_k|[x^k]P_j|4^{-k}\)와
\(M=\lceil(3+6j+2N)/4\rceil\)를 택하면

\[
|f^{(j)}(\delta)|
\le B_jM!\,\delta^N e^{-1/\delta^2},\qquad0<\delta\le\tfrac12.
\]

증명은 \(e^{1/\delta^2}\ge\delta^{-2M}/M!\)와 \(2M\ge3/2+3j+N\)이다. 계수, factorial, 거듭제곱 흡수는 BigInt 유리수로 계산한다.

따라서 \(\delta>0\)에서

\[
\sqrt{y_i}=f(\delta)\sqrt{W_i}.
\]

Leibniz와 앞 절의 경계로 각 고정된 \(I,N\)에 대해

\[
|D^I\sqrt{y_i}|
\le C_{I,N}S^{\,4|I|+1}\delta^N.
\]

\(\delta\le0\)에는 **함수 전체를 먼저 0으로 정의**한다. 유효하지 않은 내부 제곱근을 계산한 다음 0을 곱하지 않는다. \(N=1\)을 각 차수에 적용하면 모든 경계 jet이 0으로 이어지므로 \(C^\infty\) 0 연장을 얻는다.

## 9. 검증과 원본 보존

최종 가벼운 검사는 **9/9 PASS, exit 0**이다. 평탄 재귀, 5차 ordinary AD와의 일치, 16차 생성, 양의 계수 제곱근 미분, 잘못된 0 하한의 거부, 안정 대각항의 부호, 32차 지수 회귀, 위조 source 인증의 거부를 확인한다. 마지막 작은 actual outer-factor fixture는 적분 dummy 변수의 이름만 다른 원래 식의 동일성과, 끝점 배수·부호·적분 한계를 바꾼 대조의 거부를 검사한다. 이 light 실행은 전체 covariance source를 준비하지 않는다.

실제 source runner는 별도이다. 원래 작은 q source와 새 outer source를 구성하고, endpoint witness의 모든 자유좌표가 사라지는지, 실제 \(HW=\bar b\), 행렬식 및 mass 식, 8개 actual matrix identity, 요청된 scalar AD를 확인한다. 복사 인증, 값·범위 변조, 소스 node 및 Volterra matrix 변경, compiler metadata 및 node 배열 교체를 거부하는 음성대조를 포함한다. 나중에 독립 node를 append해도 발급한 고정 program prefix의 해시는 변하지 않아야 한다.

최종 실제 source attempt3는 **14/14 PASS, 관측 exit 0**이다. 249,810개 node, canonical program 10,003,412 bytes를 생성했다. 실행 시간은 51,009.599234 ms, peak RSS는 3,173,842,944 bytes이다. Graph SHA256은 `083f148b75f624a966c8b697481e8cc6d47b2e9c2bd8a19283f9a6a4bb9ed084`이며, 실행 전후 54개 literal import 파일의 SHA가 모두 같았다. source JSON의 검사 결과와 별도 process JSON의 실제 종료 관측을 구분하여 보존했다.

첫 source attempt는 원래 적분의 dummy 변수 이름이 다를 때 끝점·높이의 literal node ID 비교가 실패했다. 적분의 한계와 본문을 모두 보존하는 정확한 alpha-equivalence 검사로 수정했다. 두 번째 attempt는 실제 모듈의 18개 source 결속이 통과한 뒤, 독립 endpoint test가 `a*(b*c)`와 `(a*b)*c`의 node ID를 직접 비교하여 실패했다. 그 test에 정확한 rational identity 검사를 적용했다. 두 번째와 세 번째 실행의 source 모듈 및 최종 graph SHA는 같다. 두 실패는 개발 중 관측한 실패이며 설계된 음성대조가 아니다. 원래 JSON/log/process와 당시 source bytes의 해시 일치 snapshot을 모두 보존했다.

실행 파일과 영수증은 [outer-covariance-flat-20261011](evidence/outer-covariance-flat-20261011/)에 둔다. 현재 source 파일, 최종 실행, 실패 보존 및 문서의 정확한 SHA는 [validation packet](evidence/outer-covariance-flat-20261011/actual-outer-covariance-flat-extension-validation.json)에 결속한다. 프로그램의 실행 PASS가 이 문서의 모든 해석적 적분·귀납 명제를 Lean kernel로 증명했다는 뜻은 아니다.

## 10. 전체 M2로 이어 가기 위해 남은 실제 명제

이 결과는 안쪽 flat edge를 다루지 않는다. 그곳에서는 실제 inner factor에 대해 같은 종류의 **영이 아닌 정칙 계수**, 양의 공분산 inverse coefficient, 해당 chart의 모든 유한 jet과 0 연장을 별도로 결속해야 한다.

또한 \(X\le X_+\)에서는 양의 completed 차수가 실제로 활성이다. 이 경우에는 정식 canonical 계수를 유지한 전체 locally finite 배경, source의 유한 차수 균일 norm, leading 배경과의 정량 오차, 실제 phase/frame/pressure의 보호된 분모 하한이 필요하다. 원래 cutoff가 만든 finite active prefix라는 사실만으로 그 계수들을 실행하거나 균일 추정했다고 볼 수 없다.

모든 band와 label을 포괄하는 최종 covariance 정리를 위해서는 해당 배경·방향·농축의 충분조건을 하나의 실제 선택자로 합쳐야 한다. 그 후 원문 \(\Gamma\)에 쓰일 구체적인 \(\ell_0,q_{\rm big}\)를 택하고, 다른 절이 요구하는 전역 physical/flat-error 조건도 함께 만족함을 보여야 한다. 현재 selected source threshold를 미지의 원문 최종 선택자라고 다시 이름 붙이는 것으로 끝내지 않는다.

원문은 [navier-stokes.pdf](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)이며, 읽은 파일의 SHA256은 0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f이다. 주요 식은 (6.8), §7.1–7.2, (A.47)–(A.54)이다.
