# 실제 source 공분산: N5-06의 전역 family 인증

## 1. 원래 합격 조건과 판정 범위

원본 Blueprint 60쪽, **N5-06 — 두 family의 positive covariance**의 문언을 변경하지 않는다.

> (7.27)의 angular 1/2 및 Haar Jacobian을 포함해 Hcov를 적분하고 y=Hcov^ −1T0,*를 푼다. 합격: y±>0, det lower
> bound, C(W0)=εT0,* 및 global (7.30)을 확인한다. 같은 slow box를 ±로 두 번 합산하지 않는다.

이 인증서는 동일한 accepted N3 source `same-profile-2026-10-10.3`의 실제 완성 배경을 사용한다. 그 매개변수 표현 SHA는 `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`이다. 원래 source 함수, B.8/C.12/I1/I2 보상, heat 외부, 양의 차수 귀납 및 정준 cutoff를 바꾸지 않는다.

합격은 실제 함수의 수렴하는 연산 프로그램과 그 source에서 유도한 해석적 상계에 대한 **THEOREM-BACKED** 판정이다. 전역 H의 소수 구적값, 모든 slow 도함수의 실제 계산, 완성 Navier–Stokes 해의 존재·정칙성, 새로운 Lean 검증을 주장하지 않는다. 특히 `global730.exactResidual=['0','0']`은 평균 공분산 함수의 정확한 항등식이며 수치 PDE residual이 아니다.

## 2. 재현 가능한 실제 배경

`prepareActualCompletedBackgroundC2`가 생성한 private 인증 객체에서 각 대역의 실제 F,G,b를 가져온다. 고정된 n=1,2의 C² 블록과 정준 모든 n의 cutoff 꼬리를 사용하므로 상수는 예제로 선택한 anchor나 추가 미분 차수에 의존하지 않는다. 원래 확대 영역

- X∈[Xa/2,2Xb], η∈[-1,1], s=q/Q∈[1/2,2]
- |D_slow^≤2(F−F0,G−G0)|≤M ε²
- |D_slow^≤2 b|≤Mb ε

의 실제 양의 표현 상수를 그대로 소비한다. leading F의 외부 heat를 포함한 확대 C² 상계도 같은 source에 결속한다.

원래 정수 대역 ell에 대해 `actualBackgroundDyadicPrefix`는 실제 n=1..ell 항을 생성한다. cn≥2^n과 q≥2^(-ell-1)에서 n≥ell+1의 cutoff는 모두 정확히 꺼진다. 효율적인 anchor 경로는 같은 정준 항을 사용하되 실제 cutoff 하나에서 큰 dyadic Q를 선택하여 꼬리가 꺼짐을 더 빨리 증명한다. 둘은 동일한 family의 서로 다른 유한 표현 방법이다. 유한 예산을 초과하면 RESOURCE_LIMIT이며 누락한 계수를 0으로 대체하지 않는다.

공개 예제의 선택 대역은 q* 아래임을 별도로 증명하지 않았다. 따라서 `exercisedMember.certifiedBandMembership`, `positivityOfThisMemberCertified`, `determinantNonzeroForThisMemberCertified`는 모두 false다. 전역 인증은 별도로 생성된 **모든 ell≥ellMinimum**의 영역에 적용된다. 예제 한 개의 결과를 전 영역으로 승격하지 않는다.

## 3. 실제 phase와 움직이는 제약 ODE

원전 (7.1)–(7.8)처럼 leading F0, FR0, GR0와 N,K,c0,lambda0는 선택한 slow box의 대표점에서 고정한다. 대표점의 X는 [Xa,Xb] 안에 있다. 확대 영역의 절대 C² 상계를 Rayleigh 양성 하한으로 오해하지 않는다.

실제 completed F,G로

H=pF+pzG,  Φ=pθ+pzZ/ε+x0R−vH

를 생성한다. p는 k*pTilde에서 가장 가까운 0이 아닌 정수로 선택하므로 |p−pTilde|≤1/k이다. 0으로 반올림되는 cell에서는 부호를 보존한다. 1/p를 frame 좌표에 쓰지 않는다.

n=(x0−vHR,p/R,pz−εvHZ), n′=(−HR,0,−εHZ)

이고 원래 원통형 connection을 가진 행렬은

K=[[0,−2F,0],[2F+RFR,0,0],[GR,0,0]]이다.

프로그램은

Aphi=−K+n(nᵀK−n′ᵀ)/|n|²,
π=i(nᵀK−n′ᵀ)t/(k|n|²)

를 보존한다. 따라서 nᵀAphi+n′ᵀ=0이다. 독립 검사는 이 rank-one 식을 다시 호출하지 않고, 원래 세 momentum 식과 미분한 제약식의 4×4 유리수 연립계를 풀어 압력과 t′를 비교한다.

Ka=n_tan/|n_tan|, Na=(Ka_z,−Ka_theta), sa=nr/|n_tan|,
U=[e_r−sa Ka,Na], J=[[1,1],[c0√(1+sref²),−c0√(1+sref²)]], B=UJ

를 사용한다. B′=U′J+UJ′를 실제 미분으로 생성하며, Bleft=B의 실제 왼쪽 역원이다. z=P w에 대해

w′=[Bleft(Aphi B−B′)−lambda I−(d−dref)I]w,
w(0)=e1,

lambda=lambda0/√(1+sref²), dref=lambda0(1+sref²)/(1+u²)^(3/2),
sref=sign*u*(1/2+v/Ls), d=εk²|n|²이다.

P=exp(∫_(Ls/2)^v(lambda−dref))이므로 P(Ls/2)=1이다. 실제 z의 중앙값을 1로 놓지 않는다. 시작값은 z(0)=P(0)e1이다. 전체 eikonal remainder εv(H_T−G H_Z)+b nr도 0으로 지우지 않는다.

## 4. 실제 상수에서 operator 오차까지

Bsource=2^128+R^4096+실제 completed C² 상수들+실제 좌표 Jacobian 상수들로 둔다. 새로운 큰 상계를 예전 R의 임의 거듭제곱으로 다시 흡수하지 않는다.

같은 box의 두 점은 slow 거리 ≤4/S³로 결속된다. slow image가 볼록하다고 가정하지 않고, (s,X,η)의 직선 경로를 사용한다. 원래 implicit chart의 미분 하한 1−8h>1/2와 정방향 Jacobian을 함께 사용하면 고정 차원 계수까지 B⁴|Δslow|에 들어간다. completed-leading 차이와 합쳐 F,FR,GR의 근접도는 B⁵/S³이다.

정확한 frozen 취소 betaTilde·g0=−sign Bs u/Ls, 원래 반올림 오차, εvHZ 항을 모두 보존하면 |n−nref|,|n′|≤B¹²/S이다. 실제 source는 Bs>R^-40>B^-1와 |c0|≥R^-6>B^-1를 준다. S≥B^512에서 |n_tan|≥B^-2이다.

`actualOperatorPowerAudit`는 188개 행의 실제 합·곱·역수·제곱근·ordinary Leibniz 규칙을 실행한다. 각 triple(v,e,d)는 |f|≤B^v, |f−fref|≤B^e/S, |∂v f|≤B^d/S이다. null은 정확히 0이다. 계산한 최종 지수는 E=69, Ed=21, Ef=29, Es=29이며 공개 상계 B^256이 이를 모두 지배한다. n′ 및 B′는 별도 행으로 남아 있다.

작은 q의 가정 없이도 0이 아닌 정수 kp에서 1/|n_tan|≤kB를 얻는다. 유한 행렬 곱을 직접 계산하여 ||M_w||∞≤B^40(1+k)^3(1+Ls)^2를 얻고, 실제 kernel에는 더 큰 K=B^256(1+k)^8(1+Ls)^8를 넣는다. 이 유한 norm이 표시한 대역의 진짜 Volterra 꼬리를 정당화한다. source family의 양성 결론과는 별개의 상계다.

## 5. H의 실제 수렴 연산

각 부호의 해는 실제 M_w를 사용하는 ordered integral로 정의한다.

w_N=e1+Σ_(j=1)^N ∫_(0<t_j<…<t_1<v) M(t_1)…M(t_j)e1 dt.

전체 [0,Ls]에서

||w−w_N||≤exp(KLs)(KLs)^(N+1)/(N+1)!

이다. 유한 부분합을 해로 선언하지 않는다. 실제 상수가 매우 커서 소수 구적이 비실용적이어도, 정해진 유한 K,Ls에서 이 꼬리는 0으로 수렴한다. 이전 근사와의 고정 비교 오차를 잔여항으로 쓰지 않는다.

matrix의 자유 좌표는 선언한 pulse 변수와 여섯 매개변수에 한정한다. K와 Ls는 pulse 시간에 의존할 수 없다. 숨은 좌표를 무시하고 그 도함수를 0으로 만드는 경로는 거부된다. 아직 구현하지 않은 slow-parameter Volterra 미분은 UNSUPPORTED로 종료한다.

각 H_N은 원래 ψ² tr ttheta, ψ² tr tz, ψ² tr²의 유한 정확 적분이다. 0<P≤1, ||w||,||w_N||≤exp(KLs), ||B||≤Bsource^20(1+k)²(1+Ls)²를 이용하면 각 적분의 오차는

2*haarFactor*Ls*||B||²*exp(KLs)*VolterraTail

이하이다. 프로그램이 lower/upper 함수 표현을 반환하며 decimal quadrature를 실행했다고 표시하지 않는다.

## 6. angular 1/2, Haar, 실제 좌표

원래 정수 cover Jg=[[3,1],[1,5]],
vr=(1,1−√2), vt=(√2−1,1), Dg=4−2√2를 사용한다. 정규화 Haar의 cover 전체 인자는 1이다. 14^i개의 inverse lift와 각 14^-i Jacobian이 상쇄되므로 임의의 전역 1/14를 넣지 않는다.

χg(ξ)=b(ξ/r0), r0=2^-34이며 b는 |t|≤1/4에서1, 1/4<|t|<3/4에서 원래 σ(3/2−2|t|), 밖에서0이다. 질량 ∫χg²를 실제 적분으로 남긴다. ψ=σ(20v/Ls−4)σ(16−20v/Ls)는 [Ls/4,3Ls/4]에서1이고 [Ls/5,4Ls/5] 밖에서0이다.

정확히

H_sign=(Dg/2)*ci*(∫χg²dξ)*∫_0^Ls ψ² tr t_tan dv

이다. 가로 좌표에 homogeneous amplitude 의존성이 없다. 정규화 양의 column mass는 같은 인자에 ∫ψ² tr²를 곱한다.

periodic rectangle copy는 별도 oracle가 아니라 floor(Yi−center+1/2)로 만든다. 실제 local wave를 이 rectangle의 ξ,v에 합성한 root, 이어 Yi=Jg^i(vr*r^dr+vt*t)에 합성한 physical root를 구별하여 저장한다. **원래 시간은 τ=1−t**, 따라서 t=1−QT다. 추가 시간 평행이동을 하지 않는다. 지원 밖의 0 branch가 먼저 적용되므로 domain 밖 Volterra 값에 0을 곱하는 식으로 처리하지 않는다.

## 7. cone, Gaussian과 공통 q*

c0<0, u=2/κ, κ=R^-10은 원래 leading source에서 온다. Renv와 실제 전체 C² 상수를 소비한 E,Ed,Ef,Es가 조건부 concentration lemma의 입력을 실제로 채운다.

r=z_minus/z_plus의 Riccati 식에서 beta=4E/(lambdaFloor S), lambdaFloor=lambdaLower/(2u)를 사용한다. S≥2*coneK일 때 |r|≤1/2가 보존되고 z_plus>0이다. P로 나눈 실제 radial amplitude는 exp(−B0)/2와2exp(B0) 사이이며 B0=(2E+Ed)Lmax이다.

Gaussian P의 지수 상하계는 c=lambdaLower/(4u), C=15lambdaUpper/(2u)에서 얻는다. a=max(1,2C)라 하면

I0=∫ψ²x²≥cx²√Ls/(15a),
I1=∫|v−Ls/2|ψ²x²/Ls≤Cx²/(2c).

따라서 정규화 column 오차는 D/√Ls+Kframe/S 이하이다. 이 둘이 각각 κ/256 이하가 되도록 실제 양의 표현 조건을 생성한다. 원래 i 선택에서 2r0≤Ls/S<2r0Tg임을 함께 사용한다.

상수 |c0|의 대표점 의존성은 [R^-6,R^10]의 실제 상하계로 제거한다. 각 역수는 끝점을 반대로, 각 곱은 네 모서리를 모두 보존하여 전파한다. 양 끝을 임의 대입해 전체 단조성을 가정하지 않는다.

모든 조건과 S≥B^512, S≥R^1024, ell≥(64/h)²를 합쳐

ellMinimum=ceil(max(8,Sminimum,(64/h)²)),
qStar=2^(-ellMinimum−4)

를 만든다. h를 machine0으로 바꾸지 않는다. log2≥1/2 및 logell≤√ell로 3ell⁴2^(-h ell/2)<1을 증명하므로 S²(ε+ε²+k^-1)≤1이다. q*의 그래프는 자유 좌표가 없고 fixed source 상수만 가진다. 실제 cutoff 적분도 root-independent 표현 hash에 포함된다.

## 8. 실제 target, det 부호, 양의 역원

실제 heat-prepared F0,U0,M0에서 유한 prefix를 생성한다.

I=∫_0^X2xF, J=∫_0^X2xUF,
S=∫_0^X(U²−xF²), Cp=∫_0^XF²,
Π=P0+Cp, W=1−(2DηM+dMη)/X.

(4.16)의 두 응력 식에는 **+2X F_X**와 **+2X U_X/√(2X)**를 모두 남긴다. 축부터 X까지 실제 source를 적분하며, A.2 reference나 외부 상계 숫자를 실제 debt로 바꾸지 않는다. Tstar=s^(-A−1/2)T0(X,η)다.

H의 θ,z 두 행과 plus,minus 두 열에 실제 adjugate inverse를 적용한다. H*y−Tstar의 두 성분은 같은 실제 H 적분과 Tstar를 원자로 취급한 정확 유리식 연산에서0이다.

정규화 행 [-N/Ac;K/u], Ac=|c0|√(1+u²)와 양의 column mass를 쓰면 기준 행렬은 [[1,1],[-1,1]]이고 각 entry 오차≤κ/128이다. 정확 Bernstein 부등식은 det(C)>15/8와 κ/64≤normalized y_sign≤2를 준다. **물리 H의 det는 음수**다. det(row transform)=−1/(Ac*u)이므로 표시하는 물리 하계는 |det(H)|≥(15/8)Ac*u*hplus*hminus다.

actualMassLowerRoot는 단순 Gaussian 계수가 아니다. 전체 haarFactor*gaussianMassCoefficient*√Ls를 가리킨다.

y±>0는 Xa<X<Xb의 열린 nonzero stress 지원에서의 결론이다. 양 끝에는 실제 T0=0이고 y±=0이다. 원래 양 끝의 flat factor와 양의 smooth 방향 계수가 y에도 남으므로 sqrt(y)의 smooth zero extension이 성립한다. 끝점에서 target-normalized 0/0을 평가하지 않는다.

## 9. 원래 전역 (7.30)의 실제 합

tband=−log(q)/log2, b0=floor(tband+1/2)에서 상대 대역 j=-1,0,1을 사용한다. 각 ell_j=b0+j와 Q_j=2^-ell_j에 대해

C_ellj=(R√(Q/Q_j), Z(Q/Q_j)^D, TQ/Q_j)

를 실제로 생성한다. 고정 원점0 mesh ell_j^6*C_ellj의 nearest integer를 계산한다. 따라서 모든 offset은 독립 가정 좌표가 아니라 실제 q와 physical point의 함수다. floor(x+1/2) 항등식으로 offset∈[-1/2,1/2)이다. s_j=q/Q_j에서 X와η는 대역을 바꾸어도 정확히 같으므로 모든 대역의 raw T0가 같다.

3×3³=81개 후보의 absolute ell/grid label과 palette center를 보존한다. 실제로 양의 가중치는 최대16개이다. 나머지 모든 정수 지표의 bump는 정확히0이며, 선택되지 않은 box는 실제 active shell point를 포함할 수 없다. 각 box의 두 부호는 그 안의 H 두 열이다. 전역 합에는 box당 한 번만 들어간다.

원래2250색 palette의 exact integer 검사는 같은 대역의 겹치는 mesh, 가까운 대역, 두 부호 및 cover 차이0..4를 모두 분리한다. 이는 표시한81개에 한정된 pair 샘플이 아니라 전체 countable mesh에 대한 증명이다. 다른 label의 cross product는 실제 보조 지원의 분리로0이다.

각 box에서 C(W0)=εTstar를 사용하고

Q^(-2A)*Q^h*(Q/q)^(A+1/2)=q^(-A−1/2)

를 h의 정확한 유리수 affine 다항식으로 검산한다. 정규화 squared partition의 합은1이다. 따라서 전체 평균 공분산은 q^(-A−1/2)T0다. q<2^(-ell0−4)와 |tband−ell|<3/4에서 모든 active ell>ell0+13/4이므로 공통 source 조건을 만족한다. 지원 밖에는 source의 정확한0 연장을 적용한다.

## 10. 실행과 검증

공개 API는 `actualCovarianceFamilyCertificate`다. 입력은 원래 sourceProfile, anchorOrder1..2 또는 양의10진 ellExact, 표시 terms0..2뿐이다. 실제 lower bound, target, field, completion predicate를 입력받지 않는다. 일반 정수 경로의 유한 materialization budget 초과는 명시 실패다.

전체 약316,480노드 함수 그래프는 별도 재현 가능 artifact에 둔다. 약130KB의 공개 receipt에는 full graph SHA, root IDs, 실제 식 조각, domain 및 검사만 둔다. 날짜·elapsed·cache hit·machine값을 수학 결과에 넣지 않는다. mutable background cache는 제거했다.

검사 구성:

| 검사 | 내용 |
|---|---|
| Node source11개 | default→ell1→명시default 전체 canonical packet/graph/root bit equality, 공통 threshold 동일성, 원문 문언, 실제 domain, full mass, source target,81 labels, tail, 실패 입력/취소 |
| Node kernel11개 | 실제 matrix constraint/Bleft, B′ 독립차분, 생략 실패, Volterra 부분합, 숨은 변수 거부, graph copy, 미구현 slow 미분 거부, signed range와 alpha-renamed threshold |
| Python1144개 | Fraction4×4 압력해,90자리 Decimal 움직이는 frame/도함수/full ODE, 실제 time-ordered 다항식 적분, nonzero factorial tail,188행 연산 산술, palette/좌표/receipt 결속 |
| 독립 source review | 별도 리뷰 문서에 실제 source/domain/H/global 연결과 실패 대조군을 보존 |

Python의25개 실패 대조군은 n′ 생략12개, B′ 생략12개, 비상수 행렬을 한 점에서 고정한 Volterra 대체1개다. source의 거대한 수치를 이 작은 fixture로 대체하지 않는다. 최종 파일별 SHA, 정확한 실행 결과와 source receipt는 `evidence/actual-covariance-source.json`에 봉인한다.
