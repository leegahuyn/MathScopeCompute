# 실제 완료 배경의 안쪽 공분산 제곱근과 평탄 0 연장

이 문서는 `actual-inner-covariance-flat-extension.mjs`의 수학적 범위를 설명한다. 입력은 새 `actual-admissible-annulus-covariance.mjs`가 만든 실제 완료 배경의 두 공분산 열이다. 실제 1차 Picard 보정을 유지하고, 원래 leading 응력에만 나타나는 공통 평탄 인자를 분리한다.

**현재 실행 상태:** 최종 actual source 실행 6은 **13/13 검사와 18개 내부 source 결속을 통과했고, 실제 Node 프로세스 exit code는 0**이었다. 실제 그래프는 542,204개 노드, 22,725,864바이트이며 SHA256은 `2e697c3f475775f36a680da9998eb4f0ca9b8e6e791417c68bdb6f8c4152824b`다. 이 결과는 아래에 명시한 한 선택된 실제 band와 고정 라벨의 안쪽 collar에 대한 서술형 수학 증명 및 소스 결속이다. 전체 M2 완료를 뜻하지 않는다. 실패한 실행 1–5는 원래 코드 snapshot과 함께 그대로 보존했다.

## 1. 입력, 배경과 경계의 범위

고정된 source profile과 앞서 인증한 한 완전한 dyadic band를 사용한다. 그 band의 배경은 원래 계수와 새 확대 cutoff 수열 (b_n)로 구성되며,

\[
F_{\mathrm{prof}}=F_0+q^{2h}F_1,\qquad
U_{\mathrm{prof}}=U_0+q^{2h}U_1
\]

이다. 모든 (n\ge2)항은 그 band에서 원래 cutoff의 정확한 0 branch 때문에 사라진다. 이것은 수치적 절단이나 leading 근사가 아니다. 한편 (F_1,U_1)은 원래 실제 Picard 해다.

안쪽 거리와 사용할 작은 collar는

\[
y=\log(X/X_a),\qquad 0\le y\le t_1/256.
\]

원래 소스의 끝점은

\[
X_-=X_ae^{t_1/128},\quad X_{\rm keep}=X_ae^{t_1/64},\quad
X_{\rm cut}=X_ae^{t_1/32},\quad a^2=X_ae^{t_1/16}.
\]

따라서 이 collar 전체가 실제 Picard의 공통 정의역과 local cutoff의 plateau 안에 있다. 원래 양의 구간 `Ipos` 보정은 더 오른쪽에서 시작한다. 실행 결속은 원래 (F_1,U_1)의 local branch와 원래 6성분 Picard의 행렬·forcing·초기값·해석적 strip을 함께 보존한다.

여기서 주의할 사실은 **1차 응력의 0 branch와 1차 배경장의 0은 서로 다른 명제**라는 점이다. 원래 (T_1)은 (X<X_-)에서 0이지만, (F_1,U_1)에는 실제 Picard 해가 남는다. 새 행렬 (H)의 위상, 움직이는 normal, 압력, 움직이는 basis와 Volterra 식에는 이 배경을 그대로 넣는다.

slow chart는

\[
R=\sqrt{2sX},\quad Z=s^D\eta,\quad T=s(1-\eta^2),\qquad
1/2\le s\le2,\quad -1\le\eta\le1
\]

이다. 실제 점과 frozen 대표점은 원래 동일 box에 있고 거리 조건 (\le4/S^3)을 만족한다. 제곱근의 smoothness는 고정 라벨과 양의 시간의 열린 chart에서 말한다. (\eta=\pm1)에서는 원래 안쪽 방향의 경계 jet만 사용하며, 원래 실수 heat 적분을 음의 시간으로 연장했다고 주장하지 않는다.

## 2. 원래 leading 응력의 평탄 인자

원문 B.26–B.30의 activation을 그대로 쓰면

\[
e_a(y)=(1-\kappa_0)\sigma(y/t_1),\qquad
\kappa_0=t_1=C^{-120}>0.
\]

(r=y/t_1\in(0,1))에서 원래 square-seed step은

\[
\sigma(r)=\frac{e^{-1/r^2}}{e^{-1/r^2}+e^{-1/(1-r)^2}}.
\]

다음을 정의한다.

\[
g_a(y)=\frac{1-\kappa_0}{\operatorname{flat}(y/t_1)+
\operatorname{flat}(1-y/t_1)},\qquad
\operatorname{flat}(t)=
\begin{cases}e^{-1/t^2},&t>0,\\0,&t\le0.\end{cases}
\]

그러면 (y>0)에서

\[
e_a(y)=g_a(y)e^{-t_1^2/y^2}.
\]

(0\le r\le1/4)에서 분모는 2 이하이고, (1-\kappa_0>1/2)이다. 또한 두 번째 항은 (e^{-16/9}>1/9) 이상이다. 마지막 부등식은 (16/9<2), (e<3)에서 따른다. 따라서 더 좁은 실제 collar에서도

\[
\boxed{\quad1/4<g_a<9,\qquad g_a(0)=(1-\kappa_0)e>0.\quad}
\]

이 함수는 0을 포함한 collar에서 매끄럽다. 분모의 두 번째 항이 양의 하한을 가지므로 영이 되는 activation 자체의 역수를 취하지 않는다.

### 정확한 정규화 적분

원래 natural 참조해와 실제 B.26 해의 차이를 정규화할 때 쓰는 연산자는

\[
K_af(y)=\frac1{e_a(y)}\int_0^y e_a(z)f(z)\,dz.
\]

이 표시는 (y>0)에서의 항등식이며, 구현은 (e_a^{-1})를 만들지 않는다. 변수변환

\[
u=t_1^2/z^2-t_1^2/y^2,\qquad
z=\frac{y}{\sqrt{1+(y/t_1)^2u}}
\]

를 쓰면 정확히

\[
\boxed{
K_af(y)=\frac{y^3}{2t_1^2g_a(y)}
\int_0^\infty e^{-u}
 g_a\!\left(\frac{y}{\sqrt{1+(y/t_1)^2u}}\right)
 f\!\left(\frac{y}{\sqrt{1+(y/t_1)^2u}}\right)
 (1+(y/t_1)^2u)^{-3/2}\,du.
}
\]

원래 코드의 무한 적분은 (u=t/(1-t))의 정확한 compactification과 Jacobian을 가진다. 끝점을 유한 샘플로 평가하거나 tail을 버리지 않는다.

원래 `actual-stress-direction-program.mjs`는 이 식을 field 차이와 다섯 moment 차이에 각각 적용한다. 자연계열 함수, 두 viscosity shear, 비선형 곱의 차이 및 axial의 (-XWU) 항이 모두 남아 있다. 따라서

\[
T_0=e_a(y)b(y,\eta),\qquad b=(b_\theta,b_z)
\]

이고, 새 공분산이 맞추는 실제 slow target은

\[
\overline T=s^{-A-1/2}T_0
             =e_a(y)\overline b,
\qquad \overline b=s^{-A-1/2}b.
\]

여기서 (s^{-A-1/2})를 생략하면 실제 slow target과 profile pullback을 혼동하게 된다. 모듈은 이 인자를 역행렬을 취하기 전에 넣고 검사한다.

이 factorization은 원래 exact integral의 변수변환과 원래 natural zero-stress 식을 빼는 해석적 항등식이다. 서로 다른 전방 적분 표현을 컴퓨터의 유리함수 정규화만으로 같다고 판정한 결과는 아니다. 원래 전체 forward target 역시 그래프에서 보존한다.

## 3. 경계의 정규 계수

원래 natural 함수와 (g_a)는 닫힌 collar에서 모든 고정 유한 차수의 미분을 가진다. 변환된 적분의 각 미분은 (e^{-u})에 (u)의 다항식을 곱한 함수로 지배된다. 그 이유는 (1+(y/t_1)^2u\ge1)이고, 합성되는 natural 함수의 인자가 동일 compact collar 안에 남으며, (\Phi), (g_a)의 실제 분모는 양의 하한을 가지기 때문이다. 그러므로 적분 아래 미분과 (y\downarrow0) 극한을 정당화할 수 있다.

앞의 (y^3) 인자에 의해 (K_af(0)=0)이다. (\eta) 미분은 (f)에만 작용하므로 모든 고정 유한 차수의 (\eta) 미분도 같은 0 극한을 갖는다. 원래 stress-difference 식에 이 극한을 넣으면

\[
\boxed{\quad
b(0,\eta)=\left(p_1F_{\rm nat},
 -\frac{2(U_{\rm nat})_y}{\sqrt{2X_a}}\right)_{Y=4},
\qquad p_1=-\frac{2Y\Phi_Y}{\Phi}.
\quad}
\]

구현은 원래 natural series의 (Y=4) value와 derivative를 별도로 만든다. 특이한 interior 식에 (y=0)을 대입하지 않는다. 원래 full forward target의 그래프를 이 endpoint 값으로 덮어쓰지도 않는다. 두 표현의 연결은 앞의 정규화 적분과 극한 증명이다.

`innerEndpointStressAlgebra`는 이 대수적 endpoint 식의 두 성분을 검증하며, axial 계수의 2를 빠뜨린 식을 음성 대조로 거절한다. 이 작은 대수 검사는 (K_af(0)=0)을 스스로 증명하거나 실제 source를 인증하는 역할을 하지 않는다.

## 4. 실제 (H^{-1}\overline b)의 양성

이미 증명한 실제 annulus covariance의 행렬을 그대로 사용한다. 원래 고정 leading 방향 (N,K)와

\[
A_c=-c_0\sqrt{1+u^2}>0
\]

를 사용해

\[
W=H^{-1}\overline b,\qquad
\widetilde\tau=-\frac{N\cdot\overline b}{A_c}
\]

로 둔다. 원래 inner factor bound는 (|b|\ge C^{-12})이고, 동일 box의 frozen 방향 결속은 (-N\cdot b/|b|>R_{\rm env}^{-33})이다. 또한 (s^{-A-1/2}>1/4), (A_c<4R_{\rm env}^{20}), (C^{12}<R_{\rm env})이다. 따라서

\[
R_{\rm env}^{-56}<\widetilde\tau<R_{\rm env}^{8}.
\]

이는 영인 응력 벡터의 방향을 수치적으로 계산한 부등식이 아니다. 영이 되지 않는 정규 계수 (b)의 원래 source direction을 사용한다.

원래 transverse mass를 (mu_\chi=\int\chi^2)라 하면

\[
\mathrm{haar}=\frac{D_g}2c_i\mu_\chi,\qquad
L_s=2r_0/c_i.
\]

따라서 실제 양의 질량의 상한은

\[
m_{\max}=D_gr_0\mu_\chi A_{\max}^2
\]

이고 band와 대표점에 의존하지 않는 source-only 식이다. 이 cancellation은 원래 두 root를 유리식으로 비교해 검사한다. 실제 column cone의 역행렬 부등식으로부터

\[
W_i\ge\frac{\kappa R_{\rm env}^{-56}}{64m_{\max}}
=:W_*>0
\]

가 따른다. 같은 고정 라벨의 (H)와 정규 계수는 경계까지 연속이므로 이 양의 하한은 (y=0)에도 성립한다. 경계 대표점 자체를 원래 닫힌 대표점 영역에서 고정해 같은 공식을 직접 사용할 수도 있다. 불연속인 정수 rounding의 미분은 사용하지 않는다.

실제 행렬식도 따로 제어한다. 기존 질량 하한과 ((\sqrt{L_s})^2=L_s)를 쓰면

\[
|\det H|>
\frac{15}{16}A_cuD_g^2r_0\mu_\chi^2m_0^2c_i
>\frac{d_*}{S},
\]

\[
d_*=
\frac{15}{16}\frac{R_{\rm env}^{-6}uD_g^2r_0\mu_\chi^2m_0^2}{T_g}>0.
\]

첫 등가식의 전개와 Haar/length cancellation은 대수 검사이며, 양의 제곱근 법칙과 실제 palette (c_i>1/(T_gS))는 분리해 기록한다. 각 (H_{ij})의 실제 source 상한을 (C_H)라 하면

\[
\|H^{-1}\|_\infty\le 2C_HS/d_*.
\]

즉, 필요한 역행렬 bound의 분모는 실제 (H)와 실제 source 질량에 연결되어 있다.

## 5. 모든 고정 유한 차수의 정규 계수 미분

먼저 (F_1,U_1)의 smoothness가 필요하다. 원래 6성분 Picard 시스템은 실제 B.26 계수와 forcing, 원래 0 axis datum 및 양의 (eta)-strip을 보존한다. 그 수렴 norm과 Cauchy 식은 더 작은 strip에서 각 유한 (eta) 차수를 제어한다. (X_a>0)의 compact 근방은 radial axis로부터 떨어져 있으므로 실제 미분방정식을 반복 미분하여 각 유한 radial/mixed 차수도 제어한다. 실제 activation을 radial 복소 해석 함수라고 가정하지 않는다.

이로부터 각 고정 (j)에 대해 필요한 actual field norm은 유한하고 source에만 의존한다. (q^{2h}\le1) 및 그 slow 미분의 normalized (s) 인자들은 band가 작아져도 발산하지 않는다. 원래 양의 normal/basis 분모, bounded frozen carrier, (epsilon k^2\le4), (v\le L_{\max}S)를 사용하면

\[
M_j,B_j=O(S^j)\quad(j\ge1).
\]

여기에는 원래 (n_\theta^2+n_z^2), (n\cdot n), (c_0) 등의 실제 하한이 들어 있다. 작은 (C^2) 차이 bound만을 새로운 (C^3) bound로 이름 바꾸는 논증은 아니다.

### 안정적인 pulse 미분

실제 normalized matrix는

\[
M=\operatorname{diag}(0,-2\lambda)+E_{\rm actual}
 -(d-d_{\rm ref})I
\]

이다. 두 sign의 여덟 scalar 항에 대해 이 항등식을 원래 matrix와 직접 비교한다. (mu_\infty)를 induced infinity logarithmic norm이라 하면

\[
\mu_\infty(M)\le3E/S,
\qquad
\|\Phi(v,w)\|_\infty\le e^{3EL_{\max}}\quad(v\ge w).
\]

음의 두 번째 대각을 유지하기 때문에 이 상한은 (S)와 무관하다. 절대 행렬 norm을 써서 불필요한 (e^{cL_s})를 만드는 논증을 사용하지 않는다.

lower endpoint는 0, initial vector는 ((1,0))이고 두 값 모두 slow 변수에 독립이다. 고정 라벨에 대해 (P) 역시 slow 점의 변수에 독립이다. 따라서 variation-of-constants의 귀납으로

\[
w_j=O(S^{2j}),\quad t_j/P=O(S^{2j}),\quad H_j=O(S^{2j})
\]

를 얻는다. 마지막 식에는 정확한 (mathrm{haar}L_s=D_gr_0\mu_\chi) cancellation을 쓴다.

(HW=\overline b)를 반복 미분하고 앞의 (H^{-1}=O(S)) bound를 쓰면

\[
W_j=O(S^{3j+1}).
\]

(V=g_aW)는 동일한 degree를 가지며 (V\ge W_*/4>0)이다. (sigma=\sqrt V)의 정확한 recurrence는

\[
2\sigma D^\alpha\sigma
=D^\alpha V-
\sum_{0<\beta<\alpha}\binom\alpha\beta
D^\beta\sigma\,D^{\alpha-\beta}\sigma.
\]

여기서 두 endpoint (eta=0,alpha)는 합에서 제외된다. 이 식과 실제 (V) 하한으로

\[
(\sqrt V)_j=O(S^{4j})\quad(j\ge1),
\qquad \sqrt V=O(S)
\]

를 얻는다. 상수는 각 고정 차수에서 유한하다. 이것은 같은 source ODE와 정확한 미분 법칙에 대한 귀납이며, 유한 개의 실행된 derivative 값에서 나머지 차수를 추측한 것이 아니다. 이 모듈은 모든 차수의 수치 상수를 평가하지 않는다.

## 6. 제곱근의 평탄 0 연장

실제 양의 가중치는 (y_i=e_aW_i)이다. (V_i=g_aW_i>0)이므로 (y>0)에서

\[
\boxed{
\sqrt{y_i}=e^{-t_1^2/(2y^2)}\sqrt{V_i}.
}
\]

스칼라 (f(y)=e^{-1/(2r^2)}), (r=y/t_1)의 미분을

\[
f^{(j)}=t_1^{-j}f\,r^{-3j}P_j(r^2)
\]

로 쓰면

\[
P_0=1,\qquad
P_{j+1}(x)=(1-3jx)P_j(x)+2x^2P'_j(x).
\]

첫 다항식은 \(1,1,1-3x,1-9x+12x^2\)다. 구현은 실제 ordinary \(y\) derivative와 이 recurrence를 비교하고, \(t_1^{-j}\)를 빠뜨린 식과 다항식 항을 빠뜨린 식을 거절한다.

임의의 (N\ge0)에 대해 (M=\lceil(3j+N)/2\rceil)로 놓으면 지수급수에서

\[
e^{-1/(4r^2)}\le M!4^Mr^{2M}
\]

이므로, 남은 절반의 지수 인자를 보존하여

\[
|f^{(j)}(y)|\le t_1^{-j}B_jM!4^M r^N e^{-1/(4r^2)}.
\]

Leibniz 식과 정규 계수의 미분 bound를 합하면, 모든 고정 finite multiindex (I), 모든 (N)에 대해

\[
|D^I\sqrt{y_i}|
\le C_{I,N} S^{4|I|+1}(y/t_1)^N.
\]

따라서 **전체 제곱근을 (y\le0)에서 0으로 정의**하면 모든 차수의 jet이 0으로 맞는다. interior의 특이한 인자를 먼저 평가하고 그 결과에 0을 곱하는 방식은 사용하지 않는다.

## 7. 검증과 남은 결합 작업

이 새 모듈은 한 선택된 complete band, 동일 box의 frozen 라벨 및 (X_a)의 작은 실제 collar에 적용된다. 원래 n1 field, actual matrix, integral, target을 모두 보존한다. 코드는 문서의 exact calculus와 source 결속을 실행해 확인하고, private seal은 프로그램 prefix와 metadata 및 function/system 정의를 보호한다. 이후 무관한 그래프 append는 이미 발급한 SHA를 바꾸지 않는다.

모든 실행의 파일·로그·receipt·실행 종료값은 `evidence/inner-covariance-flat-20261011/` 아래 보존했다. 최종 source 실행 6은 84.854초, 최대 RSS 3,072,077,824바이트였고, 실행 전후 67개 literal import 파일의 SHA가 같았다. 최종 source JSON의 SHA256은 `c3e50084508912e43b09a25facc73437714d8739d30aa7706aeb84dffee7bbd9`, 로그의 SHA256은 `b705037f3d715e67e682f0cb77cf8173710ffcb5243d91fdfca2419158745257`이다. source JSON의 검사 결과와 별도 process receipt의 실제 exit 0 관측을 함께 사용한다.

| 실행 | 결과와 정확한 원인 | 수정 범위 |
|---|---|---|
| 1 | 의존성 캐시의 `Map maximum size exceeded`, 새 인증서 없음 | 복사한 그래프의 coordinate 의존성만 동일한 free-coordinate 집합으로 계산 |
| 2 | 원래 activation 곱의 AST node 번호를 문자 그대로 비교해 source 결속 거절 | 원본 곱을 유지한 정확한 대수적 비교 추가 |
| 3 | opaque step 내부의 동치인 인자 곱 순서까지 달라 비교 거절 | 먼저 인자의 유리식 항등식을 증명한 뒤 동일 원래 함수의 congruence 적용 |
| 4 | source 18개 결속과 최종 그래프는 성공했지만 오래된 문자 동일성 assertion 때문에 전체 11/13, exit 1 | test의 옛 assertion을 이미 증명한 인자·계수·함수 동일성 검사로 교체 |
| 5 | 새 test helper의 import 누락으로 `ReferenceError`, 전체 11/13, exit 1 | import 한 줄만 추가하고 모든 새 helper를 작은 실제 복사 fixture에서 먼저 실행 |
| 6 | 13/13, 내부 source 결속 18/18, 실제 exit 0 | 실행 4 이후 수학 모듈과 커널은 불변 |

위 실패들은 설계한 음성 대조가 아니며 성공으로 세지 않는다. 별도의 경량 검사 10개는 스칼라 미분, 폭과 다항식의 누락, 원래 축방향 계수 2의 누락, 재생 인증서 거절, unsupported source operation, 원래 activation 계수·인자·미분 차수의 변경, 의존성 캐시의 동치성을 검사한다. 최종 실행 전에 새 source helper를 모두 실행한 별도 smoke fixture도 1/1 통과했다.

좌표 캐시 최적화는 적분의 bound coordinate 제거와 양 endpoint 의존성을 포함하며, 일반 noncoordinate subtree query는 원래 알고리즘을 유지한다. activation 비교는 원본 node를 수정하지 않는다. 두 step의 인자에 대한 정확한 유리식 항등식과 동일한 원래 함수·미분 차수를 먼저 확인한 후에만 함수 congruence를 사용한다. 비교되지 않은 opaque 함수들을 임의로 같은 atom으로 취급하지 않는다.

남은 G-POS 결합은 같은 source template를 모든 충분히 작은 admissible band와 모든 원래 box에 연결하고, velocity/pressure/stress의 모든 고정 유한 차수 조건을 함께 만족하는 공통 재귀 cutoff 수열을 선택하며, 두 radial 경계의 연장을 그 동일한 family에 적용하는 것이다. 원래 명시되지 않은 (q_{\rm big},\ell_0)를 수치적으로 안다고 주장하지 않는다. 우리가 구성하는 충분조건 선택과 원문의 미지 선택은 구별한다.

추가적인 전체 해석학 Lean formalization은 별도 후속 작업이다. 이 문서는 그 formalization이 완료됐다고 주장하지 않으며, 이미 확인한 새로운 kernel algebra declaration의 범위도 확장하지 않는다. 이 inner 결과만으로 whole M2가 완료되거나 M3가 시작되는 것은 아니다.
