# 같은 실제 0차 응력의 양쪽 평탄 경계와 방향 변화 상계

## 1. 이 계산이 만드는 것

`actual-stress-direction-program.mjs`는 원래 선택된 N3 배경의
안쪽 및 바깥쪽 응력에서 공통 평탄 인자를 분리한 **실제 함수**를 만든다.
`actual-stress-direction-bounds.mjs`는 같은 함수의 일차 미분을 둘러싸고,
중간 구간의 실제 응력과 연결하여

\[
 \sup_{X_a\le X\le X_b,\ -1\le\eta\le1}
 (|\partial_y n|\vee|\partial_\eta n|)<R^{512},
 \qquad n=T_0/|T_0|,
 \tag{D1}
\]

를 낸다. 끝점의 `n`은 아래 평탄 인자를 제거한 함수의 연속 값이다.
물리적으로 0인 응력을 0으로 나누어 정의하지 않는다.

그 결과, **0차 배경에서 동결한** `N,K,c0`에 관한 목표 비율의 느린
좌표 Lipschitz 상계는 `R^2048`이다. 원래 상자 지름이 `4 Sstar^-3`이고
`Sstar>=R^1024`이면 그 비율 변화는 `kappa/16` 이내다.
완성 배경의 동결 프레임으로 옮기는 데 필요한 양의 차수 `C²` 오차는
이 계산에 포함되지 않는다.

모든 상수는 원래 고정된

\[
 C=(1+Q^{300})^{10}e^{Q^{200}},\quad
 t_1=\kappa_0=C^{-120},\quad
 R=e^{C^{25600000}},\quad N=1+\lceil R^{50}\rceil,
 \quad\kappa=R^{-10}
 \tag{D2}
\]

를 사용한다. 요청자가 함수, 노름, 폭, `R`, `N`, 밴드 또는 완료 여부를
주입하는 입력은 거부한다. 표본을 전 구간 인증으로 바꾸지 않는다.

### 결속된 원전

기본 논문은 SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`의
166쪽 원문이다. 식 (4.11), (4.15), (4.16), (4.26), (B.26)–(B.30),
(A.48), (A.49), (A.53), (A.54)를 사용한다. 실제 선택과 정량값은
다음 동일 출처 문서에 결속한다. 프로그램의 `sourceBindings`가 각 파일의
정확한 바이트 수와 SHA를 보관하며 독립 검사에서 다시 읽는다.

- `followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md`
- 같은 디렉터리의 `REFERENCE_DERIVATIVE_BOUNDS.md`,
  `CONTINUATION_AND_NEW_DEBT.md`, `GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md`
- `followup-20261010-outer-reselection/OUTER_DERIVATION.md`
- `followup-20261010-symbolic-gluing/C12_FREQUENCY_CONTRACT.md`
- `followup-20261010-final-stress-audit/GLOBAL_STRESS_ASSEMBLY_EN.md`
- 같은 디렉터리의 `ACTIVATION_COLLAR_BOUNDS_EN.md`,
  `HEAT_COMPENSATION_PROOF_EN.md`

새 고차 입력은 이미 봉인된 `actual-leading-high-jets.mjs`가 실제
자연해, B.22/B.26/B.34/B.8, C.12 및 I1 복구에 대해 산출한다.
이 문서는 기존 6/12차 계산을 모든 차수로 다시 표시하지 않는다.

## 2. 안쪽 인자를 제거한 실제 적분

`y=log(X/Xa)`이고 `0<=y<=t1/4`이다. 이 구간에서는 원래 기준장이
자연해와 정확히 같다. 기준장 변경은 `y=t1`부터 시작한다.
`Y=4 exp(y)<=41/10`이므로 고차 입력의 실제 자연해 영역 안에 있다.

원래 평탄 씨앗 `f(r)=exp(-1/r²)` (`r>0`, 왼쪽에서는 0)으로

\[
 e_a(y)=(1-\kappa_0)\sigma(y/t_1)
       =e^{-t_1^2/y^2}g_a(y),\qquad
 g_a(y)=\frac{1-\kappa_0}{f(y/t_1)+f(1-y/t_1)}.
\]

`e_a^-1`을 직접 사용하는 대신 다음 적분을 생성한다.

\[
 K_a b(y)=\frac{y^3}{2t_1^2g_a(y)}
 \int_0^\infty e^{-u}
 (1+(y/t_1)^2u)^{-3/2}g_a(s)b(s)\,du,
 \quad s=\frac{y}{\sqrt{1+(y/t_1)^2u}}.
 \tag{D3}
\]

이는 `u=t1²/s²-t1²/y²`의 정확한 Jacobian으로
`e_a(y)^-1 integral_0^y e_a(s)b(s) ds`와 같다.
끝점에서는 (D3)이 0이며 `g_a(0)>0`이다. 무한 적분은 다시
`u=t/(1-t)`로 펼친 명시된 피적분 함수다. 특이 끝점은 표본으로
평가하지 않으며 한쪽 부적분 극한을 사용한다.

`r=y/t1<=1/4`에서 원문 `sigma(r)<2^-14`와
`r/(1-r)<=1/3`으로

\[
 1<2(1-2^{-14})
 \le \frac{y^3}{t_1^2}(\log e_a)'(y)
 \le2(1+1/27)=56/27.
 \tag{D4}
\]

양의 로그 미분 하계로 `(K_a b)<=y³ B/t1²`이고,
`(K_a b)'=b-(log e_a)'K_a b`를 사용하면

\[
 |K_a b|\le y^3 B/t_1^2,
 \qquad |(K_a b)'|\le (83/27)B
 <5B+(y^3/t_1^2)B_y.
 \tag{D5}
\]

`eta` 미분은 정확히 `b`만 미분한다. `y³/t1²<=t1/64<1`이므로
기존 피적분 함수의 값/필요한 미분 상계에 유한 계수 6을 더하면 된다.
이 결과에는 `1/e_a`의 거대한 수치 상계가 없다.

자연해 함수는 `Phi,u,Avg(u)`의 실제 B-rho 계수열 연산으로 결속된다.
이 연산에는 계수 생성기, 부분합, 0으로 가는 원래 B-rho 꼬리가 있다.
비교 Bessel 함수만을 실제 자연해로 대체하지 않는다.

## 3. 안쪽의 비선형 다섯 모멘트와 두 응력 성분

기준값을 `Fr,Ur,Er=sqrt(2X)Fr,Wr`로 적는다. 다음 식들은 원래
B.26 적분의 정확한 변형이다.

\[
 v/e_a=\tfrac12K_a p_{1r},\quad
 (U-U_r)/e_a=-K_a\partial_y U_r,
 \quad v=\log(F/F_r).
\]

`(exp(v)-1)/v=integral_0^1 exp(tv)dt`를 사용하여
`deltaF=(F-Fr)/ea`를 만든다. 이 항은 정확히 `v=0`에서도 정의된다.
이하 `du, de, dF`는 각각 `U,E,F`의 차이를 `ea`로 나눈 것이다.
다섯 모멘트 차이를 `ea`로 나눈 값은 `K_a`에 다음 로그 반지름
밀도를 넣은 적분이다.

| 모멘트 | `K_a` 안의 실제 차이 밀도 |
|---|---|
| M | `X du` |
| I | `sqrt(2X) X de` |
| J | `sqrt(2X) X (Er du+Ur de+ea de du)` |
| S | `X (2Ur du+ea du²-Er de-ea de²/2)` |
| Cp | `Er de+ea de²/2` |

이 표에는 제곱과 혼합곱의 모든 항이 있다. 단순 선형화가 아니다.
모멘트 `M,I,J,S,Cp`의 나눈 차이를 `dM,dI,dJ,dS,dCp`로 쓰면

\[
 dW=-[2D\eta\,dM+d\,\partial_\eta dM]/X,
\]
\[
 d(FW)=F_r dW+W_r dF+e_a dF dW,
 \quad d(WU)=W_r du+U_r dW+e_a dW du.
\]

`dAng`는
`(1-h)dI-D eta dI_eta-d dJ_eta+2(h-D)eta dJ`이다.
`dAx`는
`-X d(WU)+D(dM-eta dM_eta)+4h eta dS-d dS_eta`
`+X(4A eta dCp-d dCp_eta)`이다.
실제 응력 `T0=ea B0`의 두 성분은

\[
 B_{0\theta}=-\frac{X\,d(FW)}L+rac{dAng}{2XL}
             +p_{1r}(F_r-\kappa dF),
 \qquad
 B_{0z}=\frac{dAx}{L\sqrt{2X}}-rac{2\partial_y U_r}{\sqrt{2X}}.
 \tag{D6}
\]

마지막 두 점성 항은 생략할 수 없다. 별도 검사는 완전한 (4.11),
(4.16)의 실제장과 기준장 값을 각각 계산하여 그 차이/`ea`를
(D6)와 대조한다. 기준장의 응력이 0이라는 자연해 정체성은 그 다음에
적용한다. 따라서 테스트가 그 정체성을 이용해 양변을 인위적으로
같게 만들지 않는다.

이 안쪽 구간은 최종 장에서도 정확히 보존된다. 원문 activation
계산의 `vs>=21/10`과 실제 `deltaLoop<1/10`으로 C.1 절단은 0이고
두 주기 원시함수 A/B도 0이다. B.8, I1 및 I2 지지는 더 오른쪽이다.

### 실제 미분 상계

이 구간의 자연해 `F,E,U,W,p1,Uy`와 필요한 `eta²/한 번 y` 미분은
고차 입력의 자연 계수/양의 `Phi>=1/4`/B.26 식으로 `C^65536`보다
작다. 이는 전체 구간에서 W를 E와 같은 지수로 가정한 것이 아니다.
여기서는 자연해 평균으로 W를 직접 계산하며, 자연 로그 비율은
고차 입력의 `Q^512` 범위 안에 있다. `X`, 그 역수, 제곱근과 L
기하 인자는 `C²`로 둘러싼다. `ea`의 한 번 y 미분은
`9/t1<C^121`이다.

`inner.ledger`가 (D3)–(D6)의 각 합/곱/미분을 계산한다.
전체 차수 3까지의 Leibniz 계수는 곱 인자 수의 세제곱으로
둘러싼다. 각 행의 한 C reserve에는 작은 원래 계수(최대 4)도
포함되며 독립 검사가 `4 coefficient<C^reserve`를 확인한다.
지수함수의 값은 실제 `|v|<1/10`에서 사용하고, 고차 노름의
지수함수로 바꾸지 않는다. 그 유한 Bell 미분이 만드는 결과는

\[
 |B_0|,|\partial_yB_0|,|\partial_\eta B_0|<C^{656252}.
\]

양의 투영 `Pc-vs>=2ea`, `F>=C^-3`, `|ts|<C6`을 **먼저**
`ea`로 나누면 `|B0|>C^-12`이다. 따라서 단위 방향 일차 미분은
`C^656266<R`이다. 원래 `R=exp(C^25600000)`에 대한 흡수는
실제 선택한 한 지수급수 항과 factorial 비교로 실행한다.

## 4. 바깥쪽 인자: 실제 heat와 두 번의 후방 적분

`delta=log(Xb/X)`이며 `0<=delta<=1/2`이다. 실제 종단 Xb와
`Epow(Xb)`는 원래 스케줄의 실제 양의 wait 적분까지 보존한다.
`X=Xb exp(-delta)`, `r=sqrt(2X)`, `Z=2(1-eta²)/X`로 쓴다.

\[
 H(Z)=\frac{\int_0^\infty e^{-v}v^h(1+Zv)^{-h}\,dv}
             {\int_0^\infty e^{-v}v^h\,dv},
 \quad K=E_{pow}(X_b)e^{A\delta}H(Z).
 \tag{D7}
\]

Z 미분의 분자에는 추가 `v`가 들어간다. 실제
`K_delta=Epow(Xb)exp(A delta)(A H+Z H_Z)`를 사용한다.
`Z>=0`에서 `|H^(j)|<=j!(j+1)!`, `0<=j<=4`는 Gamma 적분의
양의 모멘트로 직접 얻는다. 따라서 eta 끝점에서도 한쪽 미분
상계가 유지된다. 음의 Z로 복소 확장한다고 가정하지 않는다.

`go=1/(f(delta/2)+f(1-delta/2))` 및
`c=rho(8go+delta³ go')`로 두면 실제 `fo'_y=e^-4/delta² delta^-3 c`.
모든 평탄 인자는 원래 함수 그대로다. `go`의 분모는 `1/9`보다 크고,
고차 입력의 씨앗 미분을 유한 reciprocal 재귀에 넣어 3차까지 계산한다.
`K,K_delta,go`에 사용한 `C^20` 상계는 이 미분 계수들을 넉넉히
포함한다. 예를 들어 4차 heat 모멘트 상계는 정확히 2880이다.

원문 평탄 적분 치환을

\[
 J_{4,m}b(\delta)=\int_0^\infty e^{-4t}
 (1+\delta^2t)^{-(m+3)/2}
 b\!\left(\frac\delta{\sqrt{1+\delta^2t}}\right)dt
 \quad(m\ge-3)
 \tag{D8}
\]

로 적으면 실제 두 계수는

\[
 b_\theta=\frac{2Kc}{r}
 +\frac{\delta^3}{2r^2}J_{4,-3}[r(K+2K_\delta)c]
 +\frac{\delta^3}{4Lr^2}J_{4,-3}[r^3Kc],
 \tag{D9}
\]
\[
 P_b=\frac\eta L J_{4,-3}[K^2 f_o c],\qquad
 b_z=\frac1{4r}J_{4,0}[r^2 P_b].
 \tag{D10}
\]

따라서

\[
 T_0=e^{-4/\delta^2}\delta^{-3}(b_\theta,\delta^6 b_z).
 \tag{D11}
\]

각도 응력의 세 항, 압력의 heat 제곱 및 두 번째 후방 적분을
모두 보존한다. I1/I2 등 앞선 실제 모멘트 복구가 끝났으므로 이
영역의 후방 식은 수정 전의 앞쪽 누적 모멘트로 대체되지 않는다.

`s=delta/sqrt(1+delta²t)`에서 `|s_delta|<=1`이고

\[
 |J_{4,m}b|\le B/4,\qquad
 |\partial_\delta J_{4,m}b|
 \le B_\delta/4+(m+3)B/32.
 \tag{D12}
\]

두 번째 계수는 `delta<=1/2`와 `integral t exp(-4t)=1/16`의
곱이다. T 이후 꼬리의 일차 미분 상계는
`exp(-4T)[B_delta/4+(m+3)B(T/8+1/32)]`이다.

`outer.ledger`는 필요한 곱과 두 J 연산으로
`(btheta,delta6 bz)`의 값과 일차 미분을 `C^119`로 둘러싼다.
원문 S13의 양의 첫 항은 전체 구간에서 `btheta>=C^-10`을 준다.
방향 미분은 `C^131<R`이다. 특히 끝점은 정확히 `(1,0)`이다.

## 5. 중간 영역과 원래 고주파의 비용

중간 영역은 `y>=t1/8`, `delta>=1/4`이다. 양쪽 인자 영역과
겹치므로 어떤 점도 누락되지 않는다.

현재 고차 producer는 두 실제 C.12 원시함수의 total6을 `R`로
둘러싼다. 실제 `v=A(y,eta,Ny)/N`에 대해

\[
 |v|<1,\quad |v_y|<2R,\quad
 v_{yy}=A_{yy}/N+2A_{y\varphi}+N A_{\varphi\varphi},
 \quad |v_{yy}|<4NR<R^{53}.
 \tag{D13}
\]

두 번째 식을 `(A_y+N A_phi)/N`과 혼동하지 않는다.
`exp(v)`의 이차 미분에는 `v_y²+v_yy`가 모두 들어가며 그 전체가
`R56`보다 작다. 실제 E/U 원래 값의 고차 상계와 곱하면
수정 전 구간+C.12의 mixed2를 `R59`로 둘러싼다.
실제 I1 root, bump의 두 폭 미분을 넣은 비용은 `R60`보다 작다.
H12 및 원래 씨앗 3차를 사용한 I2/heat 수정 비용은 `C32<R`이다.
따라서 전체 E/U mixed2는 `R64`, F mixed2는 `R70`으로 둘러싼다.

다섯 실제 모멘트의 eta² 및 한 번 y/eta 미분은 밀도에 두 필드,
반지름 가중치, 적분 길이 `Xb<R`를 넣어 `R140`으로 둘러싼다.
압력의 축 밀도는 `E²/(2X)=F²`로 정칙하다. 축부터 적분할 때
구간의 `X^-1` 최댓값을 잘못 사용하지 않는다. 실제 `P0`의 eta²는
같은 A.21 입력의 고차 상계에 결속된다.

응력에서는 F 또는 E의 역수를 먼저 소거하여

\[
 T_{0\theta}=-FXW/L+Ang/(2XL)+2\partial_yF,
\]
\[
 T_{0z}=[-XWU+D(M-\eta M_\eta)+4h\eta S-dS_\eta
       +X(4A\eta\Pi-d\Pi_\eta)]/(L\sqrt{2X})
       +2\partial_yU/\sqrt{2X}
 \tag{D14}
\]

를 사용한다. `middle.ledger`는 이 식의 C1 상계를 `R227`로 낸다.
원문 전역 평탄 가중치 zeta는 이 중간 영역에서
`zeta>=exp(-128)>C^-1`이고 S14에 의해 `|T0|>R^-20`이다.
`|d(T/|T|)|<=2|dT|/|T|`로 방향 미분은 `R248<R512`이다.
평탄 경계에서는 이 중간 영역 나눗셈을 적용하지 않는다.

## 6. 같은 선도 장의 동결 비율과 상자 조건

실제 원문 구간별 부등식은
`|a|,|bs|<R³`, `a,vs-2>R^-10`을 준다. C.12에서는 실제 raw gap이
`1/(2R)`이고, 안쪽에서는 `vs-2>1/10`, `a>=C^-122`이다.
J 오른쪽의 원래 slope는 O§8–9에서 `-lambda/2` 또는 `-3h/4`
이하이고, H19/H22/H25는 수정 후에도 `a-2>=min(lambda,h)`를
보존한다. `h^-1<Q<R`이다. 단지 연속함수의 양의 최소가 존재한다는
주장은 사용하지 않는다.

\[
 N_\theta=-a/\sqrt{a^2+b_s^2},\quad
 c_0^2=\frac{\lambda_0^2}{4F^2N_\theta^2}
      =\frac{a^2+b_s^2-2a}{2a}=\frac{v_s-2}{2}.
 \tag{D15}
\]

위에 **표시된 약한 부등식만** 사용해 `vs<R18`, `|c0|<R10`이다.
이전 초안의 `vs<R8` 중간 표시는 이 약한 전제만으로 나오지 않아
수정했다. 이미 봉인된 leading-high-jets 계산에는 이 주장이 없으며
해당 파일/결과를 바꾸지 않았다. 또한

\[
 |N_\theta|>R^{-14},\quad |c_0|>R^{-6},\quad
 R^{-31}<\lambda_0<R^{83},\quad R^{-20}<|g_0|<R^{75}.
\]

원문 방향 부등식은 대표점에서 `-n dot N>R^-32`를 준다.
`s=q/Q in[1/2,2]`, `eta=Z/s^D`,
`s-Z²s^(2h)-T=0`의 미분 분모는 `L>=.98`이다.
이 명시된 좌표 변환과 `d(log X)/dRchart=2/Rchart`를 사용하면
방향의 느린 미분은 `R524`보다 작다. 여기서 Rchart는 좌표이며
원래 source envelope R과 구분한다.

대표점에서 고정한 N/K/c0에 대해

\[
 r_T=\frac{A_c}{u_*}\frac{n\cdot K}{-n\cdot N},\qquad
 A_c/u_*\le2|c_0|<R^{11}.
\]

근방에서 `-n dot N>=R^-33`이면 quotient rule 비용은
`R^(11+524+66+1)<R2048`이다. `Sstar>=R1024`이면 원래 상자에서
`4R524 Sstar^-3<R^-33`이므로 이 분모 조건이 먼저 유지된다.
이어서 `4R2048 Sstar^-3<=kappa/16`이 성립한다. 두 단계가 순환하지
않도록 분모 보존을 먼저 확인한다.

범위는 원래 물리 프로필 영역과 상자의 교집합이다. `eta in[-1,1]`
밖의 확장이나 임의 큰 느린 상자로 승격하지 않는다.

## 7. 검증과 미완 범위

Node 검사는 원본 바이트, 입력 거부, 정확한 40개 유리수 상태에서
다섯 비선형 밀도 및 완전 응력 차이, 평탄 인자 0에서의 정칙성,
두 누락 항 음성 대조, 실제 고주파 이차항, 동결 c0 항등식,
끝점과 완료 범위 분리를 검사한다.

Python 검사는 Fraction으로 완전한 수정 전/후 응력을 별도로
계산하고, 원시 적분의 Jacobian, Laplace 모멘트/꼬리, 유한
Leibniz reserve 및 지수 흡수를 독립 계산한다. 봉인 증빙의
`checks/categories/files/receiptCanonicalSHA256`가 그 실행 결과다.
이 정수·유리수 검사 수는 별도의 Lean 정리 수가 아니다.

실제 실행 결과는 Node **11/11**, Python **1487/1487** 통과다.
Python에는 비선형 밀도 200개, 완전 응력 차이 80개, 정확한 평탄
치환 288개, 누락 항/부족한 상계 음성 대조 103개가 포함된다.

다른 구현 담당자의 읽기 검토는 (D3), (D6), (D9), (D10),
(D12)의 부호/정규화 및 C.12의 안쪽 무변경, (D4), 중간 zeta 하계와
동결 quotient 예산을 대조했다. 그 읽기 검토를 실제 함수 전체의
독립 수치 적분이나 완전한 형식 증명으로 표시하지 않는다.

현재 결과는 원래 N5-06 전체를 완료하지 않는다. 필요한 후속 계산은
실제 양의 차수 coefficient/potential과 a_j 생성기로 (5.42)/(5.46)의
완성 배경 C² 및 절단 꼬리를 결속하는 것이다. 이후 **그 완성 배경**으로
일반 label의 (7.13) 계수, 동적 프레임과 압력, 전체 펄스 해를 생성하고,
실제 H 두 열의 상대 오차를 양의 공통 스케일로 정규화해야 한다.
마지막으로 실제 양의 역원과 공통 q* 및 (7.30)의 모든 활성 상자를
같은 출처로 조립해야 한다. 이 문서의 `R512/R2048`는 그 중 목표
응력 방향 의무를 해결하며, 빠진 H 열이나 완성 배경의 실제 노름을
대체하지 않는다. 따라서 `originalN506Complete=false`를 유지한다.
