# 같은 실제 물리점의 양의 목표 스케일과 수치 끝점

## 현재 판정

이 문서는 동결된 `actual-common-physical-center-enclosure.mjs`가 만든
**같은 공통 admissible family의 실제 물리점**에 붙이는 별도 확장이다.
원래 torus 역상, 대표점, 두 이동 pulse, 전체 heat와 covariance를
새 점에서 구성한 객체만 입력으로 받는다. 이전 `T=1, delta=1/4`
지점의 인증 객체를 새로운 점의 수치 결과로 복사하지 않는다.

현재 수치 적분 커널은 7/7, 실제 원문 식을 사용하는 작은 source
fixture는 4/4 통과했다. **새 확장을 실제 물리점 객체에 붙인 전체
source 실행은 아직 하지 않았다.** 아래 source 결속은 그 실행에서
검사할 구체적 구성과 증명이다. 이 문서만으로 전체 G-NUM 또는 M2를
완료로 표시하지 않는다.

구현은 다음 세 파일로 나뉜다.

- `actual-terminal-target-coefficient-kernel.mjs`: directed 유리수 적분,
  Taylor 잔여항과 실제 source에 필요한 양의 perturbation 경계.
- `actual-physical-center-target-enclosure.mjs`: private 실제 물리점,
  원래 12단계 끝점, A.54의 backward target, 수치 끝점의 결속.
- `actual-positive-profile-log-enclosure.mjs`: 이미 독립 검토한 원래
  양의 `h,C,Renv` 등의 숫자 중첩 지수 끝점.

## 1. 원래 점과 단위

새 점의 normalized slow chart에서

\[
\eta=0,\qquad \frac{15}{16}<s=T^\sharp<\frac{17}{16},\qquad
\frac3{16}<d=\log(X_b/X^\sharp)<\frac5{16}
\]

이며, 동결된 물리점 증명은
\(|d-1/4|<2^{-16384}\)를 더 강한 실제 frequency 부등식에서 도출한다.
이 점은 원래 `Xplus<X<Xb`의 열린 terminal 영역 안에 있다.
모든 positive-order completed profile은 **자신의 실제 끝점과 전체
moment 식** 때문에 그 영역에서 0이고, leading axial 함수도 원래
마지막 support 뒤에서 0이다. Compact integrand라는 이유만으로
원시함수를 0으로 바꾸지 않는다.

여기서 target은 normalized slow target
\(\overline T=s^{-A-1/2}T_0\)이고,
\(\tau=\overline T_\theta/A_c>0\)이다. 물리 스케일의 추가 `Q` 인자를
이미 평가했다고 주장하지 않는다. 원래 profile의
\(L=1-2h\eta^2\)는 이 점에서 1이다. **이 `L`은 pulse 길이 `Ls`가 아니다.**

실제 frame은 \(N=(-1,0)\), \(K=(0,-1)\)라는 증명을 사용하지만,
원래 target 노드의 \(-N\cdot\overline T/A_c\) 표현은 그대로 둔다.
`tau===Ttheta/Ac` 같은 부적절한 문자 그대로의 동일성 검사를 하지 않는다.

## 2. A.54의 세 항과 정확한 양의 prefactor

원래 terminal 끝점으로부터

\[
X^\sharp=X_b e^{-d},\quad r_*=\sqrt{2X^\sharp},\quad
K_*=E_{\mathrm{pow},b}e^{Ad},\quad z=2/X^\sharp,\quad A=h+\frac12
\]

라 두자. 원래 flat 함수 \(e^{-1/t^2}\)를 \(f_\flat(t)\)라 쓰고

\[
g_o(s)=\frac1{f_\flat(s/2)+f_\flat(1-s/2)},\qquad
C(s)=8g_o(s)+s^3g_o'(s),
\]

\[
s(u)=\frac d{\sqrt{1+d^2u/4}},\qquad
J[F]=\frac14\int_0^\infty e^{-u}F(s(u))\,du
\]

라 정의한다. 이 `1/4`는 원래 `J_(4,-3)`의 정확한 변수변환 인자다.
새 코드와 원래 `outerStressFactorAlgebra`를 비교하는 유리수 항등식은
이 인자를 두 번 없애거나 viscous/boundary 항을 누락하면 실패한다.

같은 full Gamma heat를 \(H\)라 쓸 때 정확한 양의 prefactor는

\[
\mathcal P_\tau=
\frac{\rho E_{\mathrm{pow},b}r_* e^{Ad}
 s^{-A-1/2}e^{-4/d^2}}{4A_c},\qquad \rho=h/256>0.
\]

원래 A.54에 이 인자를 대입하면

\[
\frac\tau{\mathcal P_\tau}=
J\!\left[e^{(1-h)(d-s)}H(z_s)C(s)\right]
\]
\[
\quad+\frac2{r_*^2}
J\!\left[e^{-h(d-s)}
\big((2+2h)H(z_s)+2z_sH'(z_s)\big)C(s)\right]
+\frac8{d^3r_*^2}H(z)C(d),
\qquad z_s=ze^{s-d}.
\]

원래 \(H'>0\)를 가정하지 않는다. 실제 \(H'<0\)이고,
retained heat moment 경계로 괄호 전체가 양수임을 확인한다.
위 식의 세 항은 모두 유지된다. 실제 새 `tau` 노드와 backward-factor
노드를 함께 기록하며, 둘의 관계는 원래 A.54와 복구된 전체 moment
식의 해석학적 항등식이다. 서로 다른 적분 표현의 AST가 같다고 쓰지 않는다.

## 3. 수치 적분과 실제 양의 오차

수치 커널은 regular reference 계수

\[
I_0=\frac14\int_0^\infty
e^{-u}e^{1/4-s(u)}C(s(u))\,du,
\qquad s(u)=\frac{1/4}{\sqrt{1+u/64}}
\]

를 평가한다. 여기의 `h=0,H=1,d=1/4`는 **오차가 붙는 비교 적분의
정의**이며 원래 source의 대체값이 아니다. 실제 원래 양수 `h`와 새
`d`를 위의 정확한 식에 그대로 남기고 아래 양의 오차를 더한다.

`[0,128]`를 유한 cell로 나누어 각 midpoint의 11차 Taylor 다항식을
적분한다. Cell 반폭이 \(a\)일 때, whole-cell interval로 평가한
12차 coefficient \(c_{12}=f^{(12)}/12!\)로

\[
\left|\int_{-a}^a(f-P_{11})\right|
\le \frac{2a^{13}}{13}\sup|c_{12}|
\]

를 계산한다. 단순한 refinement 차이를 오차 증명으로 쓰지 않는다.
Square-root coefficient는 원래 제곱 항등식의 재귀, exponential은
정확한 Taylor 계수 재귀로 얻는다. 각 산술 연산은 BigInt dyadic
구간의 바깥 방향으로 반올림한다.

무한 tail은 \(64e^{-128}>0\)로 포함한다. 작은 지수의 하한이
dyadic 해상도에서 0일 때도 양의 상한을 유지하며, `[0,0]`으로 지우지
않는다. Taylor 적분 오차, elementary arithmetic 폭, tail, 실제
source perturbation을 합친 최종 폭이 요청값 아래인지 검사한다.

실제 perturbation에 쓰는 구체적 경계는 다음과 같다.

| 원인 | 양의 오차 상한 |
|---|---:|
| 새 \(d\)와 \(1/4\)의 차이 | \(2^{-16368}\) |
| 원래 \(h>0\)의 지수 인자 | \(2^{-4090}\) |
| 실제 full Gamma heat 손실 | \(2^{-6648}\) |
| 원래 viscous 및 boundary 두 항 | \(2^{-2542}\) |
| 모든 실제 perturbation의 공통 반경 | \(2^{-2400}\) |

이를 위해 \(0\le s\le5/16\)에서
\(g_o\le8\), \(|g_o'|\le128\), \(|g_o''|\le4608\),
\(0<C\le128\), \(|C'|\le2048\)을 사용한다.
\(s_d=(1+d^2u/4)^{-3/2}\in(0,1]\)이고
적분 계수의 `d` 도함수에는 보수적인 65536 상한을 둔다.
원래 \(z<2^{-2559}\), \(h<2^{-4096}\), \(r_*^2>2^{2561}\)가
실제 source 점에서 결속되어야만 이 반경을 실제 `tau`에 적용한다.

기본 요청은 coefficient 폭 \(10^{-12}\), 산술 192 bit이다.
계수는 약 **7.397744229104**이며, adapter는 실제 양의 perturbation을
포함한 구간 전체가 `(7,8)` 안에 있는지도 별도로 검사한다.

## 4. 원래 12단계에서 양의 absolute scale 경계까지

`physicalTargetEndpointScheduleAudit`는 원래 단계의 length,
log-amplitude 증가량, 이전 단계와의 연결, 전체 시작값 0을 검사한다.
`step(Tf/Tf)`와 `step(1)`은 서로 다른 실제 노드로 유지하고,
\(Tf/Tf=1\), \(Tf=128>0\) 및 원래 plateau 법칙을 따로 연결한다.
단계 증가량만 맞추고 시작값을 바꾸는 변조도 거부한다.

각 단계의 실제 증가량은 \(-2\,\mathrm{length}<\Delta\log A<0\)이다.
원래 A.13의 `Qb,Qp` 적분에서
\(0<\mathrm{wait}<16006T+34\)가 성립한다. 따라서

\[
y_{\rm end}=13e^{1000T}+122009T+135+\mathrm{wait}
<14e^{1000T},
\]

\[
\log C>e^{12804000T}>2y_{\rm end},\qquad
C^{-1}<E_{\mathrm{pow},b}=P_*e^{\log A_{\rm end}}<P_*<C.
\]

원래 \(X_R=110(CP_*)^{10}\)와
\(y_{\rm end}+20T+\log110<\log C\)에서
\(X_b<C^{11}\)이다. 새 점에서

\[
C^{10}<X^\sharp<C^{11},\qquad C^5<r_*<C^6.
\]

\(8002T<\log C\)는 원래 \(h=e^{-8002T}>C^{-1}\)를 준다.
원래 \(f_o,H\in(1/2,1)\), \(\sigma'\le9\) 및 heat moment 경계로

\[
\alpha=h-f_{o,y}/f_o+zH'/H\in(h/2,h),\qquad
\sqrt{h/2}<\gamma=-c_0<\sqrt h.
\]

\(u=2R_{\rm env}^{10}\), \(R_{\rm env}>C^{100}\)와 실제
\(A_c=\gamma\sqrt{1+u^2}\)를 사용하면
\(R_{\rm env}^9<A_c<R_{\rm env}^{11}\)이다.

전체 실제 angular field는

\[
F=s^{-A-1/2}E_{\mathrm{pow},b}e^{Ad}f_oH/r_*.
\]

하한에는 \(E_{\mathrm{pow},b}>C^{-1}\), \(r_*<C^6\),
\(s^{-A-1/2}f_oH>1/8>C^{-1}\)을 쓴다. 상한에는 더 강한
\(E_{\mathrm{pow},b}<P_*\)와
\(r_*>\sqrt{220}C^5P_*^5\)를 사용한다. 그 결과
\(C^{-8}<F<C^{-5}\)다. 단지 `EpowB<C`만으로 이 상한을 도출하지 않는다.

실제 \(\lambda_0=2F\gamma\) 및
\(g=3\lambda_0u^2/(1+u^2)^{3/2}\)에서
\(R_{\rm env}^{-12}<g<R_{\rm env}^{-8}\)이다.
위의 정확한 \(\mathcal P_\tau\), coefficient `(7,8)` 및
\(\rho>C^{-2}\), \(e^{-4/d^2}>C^{-1}\)를 대입하면
\(R_{\rm env}^{-12}<\tau<R_{\rm env}^{-8}\)도 얻는다.

## 5. 숫자 끝점의 의미와 정확도

새 7개 행은 `Ac,tau,g,F,gamma,profileX,profileRadius`다.
모든 끝점은 **숫자 유리수 상수와 `exp`/`neg`만으로 닫힌 실제 실수**다.
끝점 안에 원래 field root, norm root, 미평가 적분을 넣지 않는다.
원래 source root는 무엇을 둘러싼 구간인지 연결하는 별도 필드에만 둔다.

\(R_{\rm env}\)는 높이 4, \(C\)는 높이 3이다.
\(L_1=\log R_{\rm env}\), \(L_2=\log L_1\), \(L_3=\log L_2\)라 하면
\(1\le a\le12\)에 대해

\[
0\le\log^4(R_{\rm env}^a)-\log^4 R_{\rm env}
<\frac{\log12}{L_2L_3}<2^{-4096}.
\]

`C`에 대해서는 \(K_2=\log\log C\)라 놓아

\[
\log^3(C^a)-\log^3C
=\log(1+\log a/K_2)<\log12/K_2<2^{-4096}
\]

를 사용한다. 작은 음의 거듭제곱에는 이름을 명시한
`log(-log(value))` 계열 좌표를 사용하고, 끝점 seed의 순서를 뒤집는다.
\(\gamma\)는 \(-\log\sqrt h=4001T\)에서 직접 높이 2의 작은 양수
구간을 만든다. 모든 경우에 양의 \(2^{-4096}\) 여유를 directed
산술로 더하고 최종 좌표 폭이 요청값 아래인지 검사한다.

**보장하는 정확도는 각 행에 명시한 반복 로그 좌표의 폭**이다.
원래 매우 작은 `tau`나 매우 큰 `Ac`의 상대 오차가 \(10^{-12}\)라는
뜻이 아니다. 적분 coefficient는 별도로 보통 유리수 absolute 폭을
보장한다. 이 두 정확도 개념을 합치지 않는다.

## 6. 실행 및 후속 범위

검증 기록은 `research/evidence/terminal-target-coefficient-20261011/`에 둔다.
초기 수치 테스트의 누락된 test-local 변수, 작은 source fixture의
`step(Tf/Tf)`와 `step(1)` 문자 비교 실패는 각각 원래 snapshot과
사유를 보존했다. 이들은 설계된 음성대조가 아니다. 원래 source 식은
바꾸지 않았다. 실제 음성대조는 `J`의 1/4 중복 제거, 두 양의 항 누락,
변조된 stage chain, 잘못된 `EpowB`, kernel 차수 변경, private 인증
복사를 각각 거부한다.

실제 물리점 source 실행에서는 같은 `p.G`의 원래 prefix를 보존한 채
이 adapter를 붙이고, 8개 source 결속과 2개 수치 결과 검사를 수행한다.
원래 source scale와 Gamma heat가 모두 그대로인지를 확인한 이후만
실제 결과로 표시한다.

남은 `ell,Q,epsilon,ci,Ls,J` 및 absolute `H,y`에는 공통 selector의
실제 norm tower 평가가 필요하다. 원래 norm producer는 지수 함수와
이전 norm의 재귀를 포함하므로 `Bnorm<Renv^K` 같은 미검증 단일
거듭제곱 경계를 넣지 않는다. 전체 curl 도함수 수치 결과, 모든 label의
수치 검증, 새 Lean 증명, M3 진행은 이 확장의 결과가 아니다.
