# 실제 전역 다섯 모멘트와 양의 차수 연속식

이 묶음은 원래 계수 생성기의 다섯 복구 방정식이 **원래 전역 함수의 실제 다섯 적분**을 0으로 만드는 연결을 추가한다. 독립 압력·M0 primitive 증명 이후의 단계다. 계수, 미분, incoming debt, 적분 값, 양성 가정을 입력으로 받지 않는다.

최종 실행은 원래 계수 생성기 **한 번**으로 `n=1,2`를 생성했다. 작은 독립 검사 8/8, 실제 source 검사 8/8을 통과했다. `validation.json`이 파일 해시와 실패·성공 시도 전부를 고정한다. 전역 tangential stress 소거, 0차 잔차, 무한 공통 cutoff 배경의 flat-error, Lean 증명, 전체 G-N4 완료는 이 묶음의 완료 범위가 아니다.

## 1. 실제로 닫힌 전역 밀도

`X=R²/2`, `F_n=E_n/R`이고, `Ωhat_(n-1)=Ω_(n-1)/X`라 쓰자. 기존 source의 `buildActualOmegaCoefficientOverX`가 만드는 것은 `Ωhat`다. 기존 압력 연결이 모든 원래 분기와 경계에서

\[
\Pi_{n,X}=\sum_{i+j=n}F_iF_j-\frac12\widehat\Omega_{n-1}
\]

를 증명했다. 이를 이용해 새 모듈은 다음 **전체 ordered convolution**을 독립적으로 구성한다.

| 번호 | 실제 `dX` 적분 밀도 | 원래 `R` 좌표 모멘트 |
|---|---|---|
| 1 | `U_n` | `∫ R U_n dR` |
| 2 | `2X F_n` | `∫ R² E_n dR` |
| 3 | `Π_n,X` | `∫ ∂R Π_n dR` |
| 4 | `2X Σ_(i+j=n) U_i F_j` | `∫ R² Σ U_i E_j dR` |
| 5 | `Σ_(i+j=n) U_i U_j − X Π_n,X` | `∫ [R Σ U_i U_j − R² ∂RΠ_n/2] dR` |

적분 구간은 실제 `[0,Xplus]`다. 큰 실수 근삿값으로 `Xplus`를 대체하지 않는다. 원래 support와 압력 primitive 증명으로 각 밀도가 이 구간 밖에서 사라진다. 특히 압력의 실제 축·외부 값이 0이므로 5번은 `∫(Σ U_i U_j+Π_n)dX`와도 같다.

검사는 각 차수의 실제 global U/F를 **원래 κ cutoff를 포함하는 local 부분 + 실제 Ipos bump 부분**으로 대조한다. 전체 leading F0/U0의 원래 core 제한은 앞선 pressure packet의 private 증명에서 가져온다. Ipos에서는 전체 F0가 원래 `ef R^(-2-2lambda)`임을 이용하고, 전체 U0는 다음 실제 분기 검사로 별도로 0임을 증명한다.

Ipos의 원래 로그 반지름 구간은 `[pulse.start−14,pulse.start−9]`다. B8, C12, I1, axial decay의 support는 이보다 먼저 끝나며, 원래 axial pulse는 `pulse.start`에서 시작한다. 실제 전역 U0의 모든 활성 후보를 이 부등식으로 선택한 뒤 0으로 감소시키고, source F/U root와의 결속을 확인한다. 이 구간의 **누적 M0 또는 v0를 0으로 만들지 않는다.**

`n>=2`의 모든 내부 ordered pair `i,j>=1`, `i+j=n`은 원래 `lowerBodies`와 비교한다. Ω의 core/global/zero wrapper가 전체 Ωhat와 같다는 private 압력 증명도 유지한다. 원래 lower integral 세 개는 모두 `[0,Xplus]` 전체 endpoint와 실제 밀도를 대조한다. 단순히 core 안의 적분으로 줄이지 않는다.

## 2. 원래 연속 bump 행렬의 13개 적분

모든 실제 `Umat` 4개, `Emat` 9개 entry의 bound variable, 양 끝점, integrand를 다시 읽어 대조했다. 서로 다른 다섯 support는 원래 값 그대로다. `R=Rbase u`와 `dX=Rbase² u du`로 바꾸면 current correction의 다섯 밀도는 각각

\[
R_bu,\quad R_b^2u^2,\quad
2e_fR_b^{-2-2\lambda}u^{-2-2\lambda},\quad
e_fR_b^{1-2\lambda}u^{1-2\lambda},\quad
-e_fR_b^{-2\lambda}u^{-2\lambda}
\]

에 해당 bump와 실제 α 또는 β를 곱한 값이다. 독립 rational kernel이 다섯 Jacobian과 압력의 부호·계수 2를 각각 확인한다. 양의 실수 반지름에서 지수 덧셈을 적용하는 곳은 실제 exponent 다항식도 비교한다.

원래 U 행렬의 두 번째 행은 confluent 형태다. 실제로 필요한 행과의 관계는

\[
u^{1-2\lambda}
=u-2\lambda u\int_0^{\log u}e^{-2\lambda s}\,ds
\]

이다. 독립 kernel은 양변을 u로 나눈 차이의 도함수가 0이고 u=1에서 값도 0임을 문자 그대로 FTC로 확인한다. 따라서 전체 smooth bump 적분 후에도 `originalUrow = Umat[0]−2lambda Umat[1]`이 성립한다. λ를 0으로 근사하지 않는다. 이 λ와 계수 차수의 `nu_n=2nh`는 서로 다른 원래 매개변수다.

이제 전역 밀도를 위의 local/patch/lower 부분으로 적분하면 **원래 incoming+원래 correction**과 같다. 그 후에만 원래 continuous inverse 방정식의 rational cancellation을 실행한다. 실제 `n=1,2`에서 다섯 식씩 총 열 식이 0으로 소거되며, 다섯 번째 correction을 빼는 음성 대조군은 소거되지 않는다. 실제 임의의 적분 값을 새로운 0 상수로 입력하지 않는다.

## 3. 1차의 원래 weighted Ω flux

원래 1차 다섯 번째 incoming은 `localMoment[4]+fluxOmega`다. `fluxOmega`의 정의를 문자열로 신뢰하는 대신, 원래 전체 leading U0/v0와 원래 다음 다섯 whole integral을 소비한다.

\[
J_0=\int_0^{X_v}Xv\,dX,\quad
J_{0,\eta}=\int_0^{X_v}Xv_\eta\,dX,
\]
\[
H_0=\int_0^{X_v}XUv\,dX,\quad
H_{0,\eta}=\int_0^{X_v}X(U_\eta v+Uv_\eta)\,dX,\quad
K_1=\int_0^{X_v}Xv^2\,dX.
\]

각 원래 whole density의 새 상한 X prefix를 만들고, **원래 integrand와 고정 하한**을 대상으로 실제 AD와 FTC endpoint를 검증한다. 이것은 원래 source가 저장했던 prefix라고 주장하지 않는다. 원래 whole density에서 새로 유도한 primitive다.

\[
Q_\Omega(X)=
\frac{D\eta J_{0,\eta}(X)-J_0(X)+dH_{0,\eta}(X)+2D\eta H_0(X)}{2L}
-\frac{K_1(X)}4
+X^2\left(\frac v{2L}-\frac{\eta Uv}{L}+\frac{v^2}2-v_X\right).
\]

독립 kernel과 실제 source AD는 모두

\[
Q_{\Omega,X}-\frac{X\widehat\Omega_0}{2}
=\frac{Xv}{2L}
\left[L(v+Xv_X)+dU_\eta-2A\eta U-2\eta XU_X\right]
\]

를 확인한다. 대괄호는 같은 원래 M0의 `M0_X=U0`와 원래 stream 재구성으로 0이다. 미해결 continuity defect를 지우는 flag를 받지 않는다.

축에서는 원래 natural U/v의 정칙성으로 X² boundary 전체가 0이고, 모든 prefix는 동일 endpoint라 0이다. `M/X`를 X=0에서 평가하지 않는다. Xv에서는 원래 U/v와 모든 고정 차수 도함수가 0이다. 각 새 prefix를 Xv까지 완성한 식이 위 **원래 다섯 whole integral**과 같은지 alpha-equivalence로 확인한다. 따라서 남은 값은 원래 `fluxOmega`와 정확히 같고,

\[
\int_0^{X_v}\frac{X\widehat\Omega_0}2\,dX
=\text{original fluxOmega}
\]

가 성립한다. 실제 leading Ω의 외부는 0이므로 같은 전체 값이 `[0,Xplus]`에서도 유지된다. `−X²v_X`나 X 가중치를 빼는 독립 음성 대조군은 실패한다.

## 4. 양의 차수의 실제 연속식

원래 각 positive mass primitive와 그 모든 접합을 유지한다. source 평균의 core branch는 `M=X average`, middle branch는 `average=M/X`, 외부는 원래 first moment로 닫힌 0이다. 원래 v의 실제 body도 비교한다.

\[
v_n=\frac{2\eta U_n-[2\eta(D+\nu_n)M_n+dM_{n,\eta}]/X}{L},
\qquad \nu_n=2nh.
\]

임의의 ν에 대한 독립 kernel은

\[
L\bigl[\partial_X(Xv)+\mathcal Z_{-A+\nu}U\bigr]
=-2\eta(D+\nu)(M_X-U)-d\,\partial_\eta(M_X-U)
\]

를 증명한다. 두 mass defect는 실제 primitive 증명으로 0이다. 도함수 식 자체는 certificate에 남기며, AST가 0으로 재정의되는 것은 아니다. ν를 빼는 대조군은 실패한다.

## 5. 보존형 잔차에 제공하는 정확한 kernel

같은 새 kernel에는 서로 독립인 `nu_i,nu_j`에 대해 angular/axial 비선형 pair를 발산형으로 바꾸는 항등식, radial weight 1·2의 time/Z 적분 부분적분, radial viscosity의 boundary form, 압력 부분적분을 넣었다. `delta_i=∂X(Xv_i)+Z_(-A+nu_i)U_i`가 미증명일 때 남는 항을 모두 보존한다. 이 단계만으로 source stress 전체 잔차를 통과시키지 않는다. 후속 `actual-positive-global-stress.mjs`가 이 kernel, 실제 inner recurrence, 전체 모멘트, 양의/음의 primitive와 양 끝의 support를 연결한다.

## 6. API와 차수 범위

```js
const proof = prepareActualGlobalConservativeMoments({
  order: 2,
  maxNodes: 2_000_000,
  maxDerivativeOrder: 128
}, context);
const receipt = await actualGlobalConservativeMomentsCertificate(proof);
```

이미 같은 source의 pressure 객체가 있으면 `attachActualGlobalConservativeMoments(pressure, context)`로 다시 원래 생성기를 실행하지 않고 연결한다. private 객체와 그 source/node/definition/program seals를 모두 검사한다. 복제 객체, scope 변경, 주입된 forcing/미분/모멘트 입력은 거부한다. certificate 이후 append-only 노드를 추가해도 고정 compiler graph SHA는 변하지 않는다.

실제 실행은 n=1,2다. 일반 n의 수학적 recipe는 모든 n+1 ordered pair와 원래 앞 차수들을 소비하는 동일한 source loop, arbitrary ν kernel, 실제 다섯 density 분할이다. 모든 n을 유한 실행했다고 주장하지 않는다. 실제 구현의 graph/derivative 예산은 각각의 유한 질의 비용을 제한하며, 이 모멘트 항등식에 n=2 또는 n=16이라는 수학적 상한을 두지 않는다.

## 7. 실행 영수증과 범위

최종 kernel attempt4: **8/8 PASS**, exit0, 0.427초, peak 92,753,920 bytes.

최종 original source attempt3: **8/8 PASS**, exit0, 20.244초, peak 2,094,534,656 bytes, heap3072MiB, timeout150초. 원래 constructor는 한 번이며 기존 의존 파일 37개가 실행 전후와 최종 봉인에서 일치한다.

고정 compiler graph:

`e8e030186d8cfa62ff860733af68c07889af2e4864e780fb80728a0261f0bbb1`

133,494 nodes, 5,336,943 canonical bytes다. 이는 원래 exact function program과 새 증명 graph의 해시이며, signed numerical quadrature가 완료되었다는 뜻은 아니다.

최초 kernel의 syntax failure, source1의 bound-integral free-atom 비교 실패, source2의 중첩 division structural 비교 실패를 모두 그대로 보존했다. 두 source 비교 문제는 독립적인 비상수 작은 fixture로 재현하고 정확한 alpha-equivalence/rational 비교로 해결했다. 원래 source 함수나 적분, denominator, α/β, 기존 cutoff selector를 바꾸지 않았다.

이 패킷은 기존 원문 64개 기준의 개수, frozen runtime/build, 기존 PASS의 의미, 실제 covariance 양성 domain을 바꾸지 않는다. 전체 G-N4, global flat-error, Lean, M3 완료 flag는 계속 false다.
