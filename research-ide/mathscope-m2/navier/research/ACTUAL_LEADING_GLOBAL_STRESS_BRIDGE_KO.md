# 원래 leading 압력·응력의 전역 momentum 연결

## 확인한 결과

`actual-leading-global-stress-bridge.mjs`는 원래 전역 `F0,U0,M0,v0`와
`Pi0=P0+Cp`를 그대로 사용하여 leading 차수의 radial, angular, axial
momentum 잔차가 원래 stress의 가중 미분과 소거됨을 검사한다.
`F0`에는 원래 heat 적분과 양의 작은 매개변수가 포함된다.
실행은 `prepareActualGlobalPressureConvolution({order:2})`의 동일한
private 원본에서 시작한다. 사용자가 공급한 field나 모멘트를 받지 않는다.

2026-10-11 source attempt 2는 **7/7 검사, 내부 9개 검사, exit 0**으로
종료했다. 19.390초, 관측 peak RSS 2,087,739,392 bytes이다.
원본 그래프는 127,242 nodes, canonical 5,020,033 bytes,
SHA-256 `9171fa919462a0cbbc5b370040f3c5fe496446372bcba3424580f944fcf4ac05`이다.
실행 기록과 원본 snapshot은
[leading-global-stress-bridge-20261011](evidence/leading-global-stress-bridge-20261011/)
안에 보관한다.

## 1. 네 적분을 전체 구간에서 유지한다

원래 완전한 field를 F,U라고 쓸 때 다음 적분을 원래 식으로 생성한다.

\[
I(X,\eta)=\int_0^X 2xF(x,\eta)\,dx,\quad
J(X,\eta)=\int_0^X 2xU(x,\eta)F(x,\eta)\,dx,
\]
\[
S(X,\eta)=\int_0^X\bigl(U(x,\eta)^2-xF(x,\eta)^2\bigr)\,dx,
\quad C_p(X,\eta)=\int_0^X F(x,\eta)^2\,dx.
\]

각 shared expression의 실제 본문을 펼쳐 고정 하한 0, 상한 X,
integrand의 외부 X 비의존성을 검사한다. 상한 대입, X 미분과
X/eta 혼합 미분을 각각 원래 density 및 그 eta 미분과 대조한다.
integrand의 support가 끝난 뒤에도 적분은 누적 질량을 유지한다.
적분 자체를 compact support 함수로 바꾸지 않는다.

압력은 정확히 `Pi=P0+Cp`이다. `P0(eta)`는 원래 축 datum이며
X에 독립일 뿐 eta에 대한 비상수 항을 그대로 유지한다.

## 2. 같은 전역 M0 증명을 사용한다

원래 private `actual-leading-stream-primitive` 검사가 확인한
모든 접합점과 전체 질량 소거를 사용한다. 소비되는 root가 같은
원본 `M0,U0,v0`인지 먼저 대조한다. 이 증명으로

\[
M_X=U,\qquad M_{\eta X}=U_\eta,
\]
\[
v=\frac{2\eta U-2D\eta M/X-dM_\eta/X}{L}
\]

을 적용한다. 혼합 항등식은 원래 매끄러운 M,U의 미분과 전역
`M_X=U`에서 나온다. 치환 전의 원본 표현식과 치환 근거를 함께
보관한다. 결과를 0으로 정해 잔차를 없애는 방식은 사용하지 않는다.

## 3. 독립 momentum 계수와 실제 stress를 연결한다

원래 scaled 연산자를

\[
\mathcal T_a f=\frac{-af+Xf_X+D\eta f_\eta}{L},\qquad
\mathcal Z_a f=\frac{2\eta(af-Xf_X)+df_\eta}{L}
\]

로 쓴다. `sourceScaledOperators`가 생성한 leading momentum 계수는

\[
\begin{aligned}
r_\theta/R={}&\mathcal T_{-A-1/2}F+v(XF_X+F)
 +U\mathcal Z_{-A-1/2}F-2(XF_{XX}+2F_X),\\
r_z={}&\mathcal T_{-A}U+XvU_X+U\mathcal Z_{-A}U
 +\mathcal Z_{-2A}\Pi-2(XU_{XX}+U_X),\\
r_r={}&\Pi_X-F^2.
\end{aligned}
\]

이 식들은 stress의 음의 미분으로 정의한 것이 아니라 원래
time, transport, pressure, radial viscosity 연산자로 독립 생성한다.
axial viscosity의 추가 항은 원래 양의 첫 차수에서 등장하며
leading 식에만 포함되지 않는다. 그 항의 양의 차수 처리는 별도
원본 pressure/stress 검사가 맡는다.

`actualLeadingTargetOnSensitivityGraph`가 생성한 원래 두 stress와
다음 weighted flux가 정확히 일치함을 먼저 검사한다.

\[
W=1-\frac{2D\eta M+dM_\eta}{X},
\]
\[
\Theta=XT_\theta=-\frac{FX^2W}{L}
 +\frac{(1-h)I-D\eta I_\eta-dJ_\eta+2(h-D)\eta J}{2L}
 +2X^2F_X,
\]
\[
Z_f=\sqrt{2X}T_z=
\frac{-XWU+D(M-\eta M_\eta)+4h\eta S-dS_\eta
      +X(4A\eta\Pi-d\Pi_\eta)}{L}+2XU_X.
\]

그 다음 실제 flux를 미분하고, 위에서 정당화한 FTC 및 M0
치환만 적용하여 정확한 유리식 계산으로 다음을 확인한다.

\[
\boxed{\Pi_X-F^2=0,\qquad
\partial_X\Theta+X(r_\theta/R)=0,\qquad
\partial_XZ_f+r_z=0.}
\]

두 원래 shear `2X^2 F_X`, `2X U_X` 중 하나를 생략하면 실제
잔차 검사가 실패하는 음성 대조를 포함한다. 별도 일반 커널
`originalLeadingMomentStressIdentity()`의 항등식과 shear/뒤쪽 적분
부호를 바꾼 음성 대조도 확인한다.

## 4. 축과 접합점, 원본 보존

네 prefix는 X=0에서 실제로 0이다. 가중 divergence 항등식은
X>0에서 검사한다. 축에서는 원래 매끄러운 source와 동일한
한쪽 극한을 사용하며 0/0에 수치를 대입하지 않는다.
전역 M0의 접합점과 잔류 질량은 기존 전역 증명의 정확한 같은
원본을 통해 연결된다.

새 그래프는 원래 pressure 그래프의 node prefix와 모든 함수
정의를 유지한다. disposable cache만 비운 후 새 연산을 덧붙인다.
private seal은 그래프, 함수 본문, primitive, target, scope 및
certificate data의 변경을 거부한다. clone, 모멘트 변조, target
변조, scope 승격을 실제 테스트에서 거부했다.

첫 실행은 잘못된 request key `throughOrder` 때문에 원래 입력
검사에서 종료했다. `order:2`로 test 입력을 고친 두 번째 실행을
최종 결과로 삼았다. 첫 실패의 snapshot, TAP, 종료 기록을
보관하며 통과 수에 포함하지 않는다. 원래 수학 생성기는 바꾸지 않았다.

## 5. 범위

이 패킷은 **leading n=0의 전체 압력 primitive와 실제 stress
divergence 소거**를 닫는다. 양의 차수 stress, 공통 재귀 cutoff,
무한합의 물리 잔차 경계, pulse의 전역 flat error와 정밀 수치
계산은 해당 후속 패킷으로 연결해야 한다. 이 패킷 자체는
`wholeGN4Complete`, `m3MayStart`를 true로 만들지 않는다.
새 Lean kernel 실행, browser 실행 또는 worker 실행을 주장하지 않는다.
