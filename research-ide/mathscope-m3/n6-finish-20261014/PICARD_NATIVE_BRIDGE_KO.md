# 실제 native Picard 함수와 공통 η strip: 확인된 항등식과 남은 연결

이 문서는 원본 `c143b5d8093b724d2509f8fc0ab5746c531d9e0c`의 정의를 조사한 결과다. **실제 native 함수의 Bρ 노름이나 모든 실제 호출의 정의역이 인증되었다고 판정하지 않는다.** 기존 PASS, 이름, tail 설명을 그 증명의 대체물로 사용하지 않는다.

## 실제 계수의 η 의존성

`actual-continuation-exact-inner.mjs`는 `ActualSameN3OrderOneInner`의 A0, A1, forcing을 실제 natural Φ/u, g와 원본 B.26 continuation으로 만든다. 이 공통 collar에서 분기 경계는 X 또는 ξ²에만 의존한다. 활성화 `σ(log(X/Xa)/t1)`도 η에 의존하지 않는다. 따라서 이 분기의 flat radial join만으로 η 비해석성을 주장할 수 없다. 반대로 이것만으로 원본 native 함수의 η 해석성이 증명되는 것도 아니다.

목표 상수는 δ=ρ/(1024Q), 원본 계수 strip δ/4, 해의 strip δ/8이다. `actual-background-majorant.mjs`의 전개에는 **같은 실제 natural Φ/u의 Bρ 노름≤Q와 실제 Φ≥1/4**가 입력으로 필요하다. 이 입력은 source tag의 `coefficientNormUpper: Q`만 읽어서 충족시킬 수 없다.

## 이번에 별도로 계산한 보편 항등식

`native_picard_bridge.py`는 두 독립 정수 다항식 전개법으로 B.14/B.15의 모든 변수에 대한 스칼라 항등식을 검사한다. 한 방법은 AST의 각 단계에서 같은 단항식을 합치고, 다른 방법은 전체 곱을 먼저 분배한 뒤 마지막에만 계수를 합친다. 표본 대입을 사용하지 않는다. 혼합항 부호와 pressure Euler 계수를 바꾼 음성 대조는 양쪽에서 검출한다.

t=Λ⁻¹, b=average(u), β=∂ηb라 놓으면 실제 코드의

`W = W* − t(2Dηb+dβ)`, `H = H*+tdu`, `U = U*+tu`

를 원본 angular/axial 식에 대입한 결과가 `AxisContraction.lean`의 완전한 expanded remainder와 항별로 같다. 여기에는 `du·ζ·Φ`, `tdu·∂ηu`, 모든 `p`, `∂ηp`, `Y∂Yp` 항이 포함된다. 이 항등식은 임의의 radial order에서 계수를 비교할 수 있다.

초기 Φ₀=1, u₀=0, p₀=0과

`p_(n+1)=g² Σ_(i=0)^n Φ_i Φ_(n−i)/(n+1)`

가 같고 실제 입력 함수와 완전한 remainder가 같다면, 양의 분모 `2(n+1)(n+2)`와 `2(n+1)²`를 갖는 삼각 recurrence에 귀납하여 **모든** radial coefficient가 같다. 유한 계수 몇 개의 일치로 나머지 계수를 추정하는 주장이 아니다.

## Lean 정리가 주는 것과 아직 필요한 동일성

조사한 `ConcreteProducer.selectedFixedPoint_spec`는 호출자가 노름 가정을 제공하는 정리가 아니다. 선택한 실제 입력으로 반지름 1의 fixed point, 오차, 유일성을 구성한다. `OperatorBounds.selectedReference_radius_Q`는 `‖selectedReference‖+1≤Q`를 증명한다. `AmplitudeInput`은 같은 선택 상수로 amplitude와 그 노름≤2를 구성한다. 이 조사에서는 기존 Lean kernel 실행을 새로 수행하거나 전이 import 전체의 axiom 출력을 재인증하지 않았다.

핵심 미완료 연결은 다음과 같다.

1. Native `appendActualPressure`의 P0는 **각 stage의 유한 적분 합과 양쪽 무한 power tail의 닫힌 식**이다. Lean `newPressure`는 **`newClockWeight`와 `newShapeExponent`를 사용한 전 실수 적분**이다. 원본 시간 분할, shift, terminal wait, flatten/release 위치, 양쪽 tail과 angular pressure-neutral 생략을 모두 보존하여 이 두 실제 함수가 같음을 연결해야 한다. 파일 이름이나 각각의 PASS는 그 동일성이 아니다.
2. Native g의 실제 ζ 적분과 Lean `realAmplitude`가 같은 η 원시함수·적분 상수·선택 상수임을 원본 node에 연결해야 한다. CSelected의 `exp(10 log(1+Q^300)+Q^200)`와 `(1+Q^300)^10 exp(Q^200)`의 동일성도 양수성과 함께 유지해야 한다.
3. 보편 remainder 항등식과 위 입력 함수 동일성을 native의 저장된 모든 차수 의미에 적용해야 한다. 원본 fixed.core의 pressure/g, registry와 source SHA를 동시에 확인해야 하며, finite coefficient/tail metadata를 이 입력 증명의 전제로 되돌려 쓰면 순환이다.
4. 그 뒤에도 실제 full-field의 모든 활성 호출이 공통 collar와 η strip의 실수 기저 정의역으로 들어간다는 image 증명이 필요하다. 개별 원본 chart에서의 결과를 전체 source domain의 인증으로 바꾸지 않는다.

이 연결을 마친 native analytic family 정리라도 원본 Prop.9.5의 j0 전체 W/M/S 상수, 모든 Haar moment, 전역 support와 독립 Cartesian PDE를 자동으로 증명하지 않는다. 이번 항등식 증명은 jet 수나 N6 acceptance를 올리지 않는다.

## 조사한 원본 바이트 SHA-256

| 원본 경로 | SHA-256 |
|---|---|
| `mathscope-m2/navier/actual-continuation-exact-core.mjs` | `d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815` |
| `mathscope-m2/navier/actual-continuation-exact-functions.mjs` | `326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311` |
| `mathscope-m2/navier/actual-continuation-exact-inner.mjs` | `3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8` |
| `mathscope-m1/navier/sources/official-repo/NavierStokes/AxisContraction.lean` | `d9151673815948eef8e8e2db3e93c95119ce7be80fc6a01d8a83f2bc4cd4df9d` |
| `mathscope-m1/navier/followup-20261010-same-datum-axis/formal-input-producer/OperatorBounds.lean` | `f3c8d76a316e3cd17144167948d9b7eaf95b4513079a5d56887e8aa146491a64` |
| `mathscope-m1/navier/followup-20261010-same-datum-axis/formal-input-producer/ConcreteProducer.lean` | `38b5ddc97514a00fcf9ee4f2cfc6a1030a2781bccb577fd8e14389ec97a3e7b2` |
| `mathscope-m1/navier/followup-20261010-same-datum-axis/formal-input-producer/SameDatumInputs.lean` | `9f80d62caa58f5b4076eda552286752ad598c7214c1bafaf01778f7a02a5f5af` |
| `mathscope-m1/navier/followup-20261010-symbolic-gluing/formal-clean-replay/attempts/0001/AmplitudeInput.lean` | `a960171b872ba7968305bad8839519421edb4a8eb45d487e3c6f18bace105679` |

위 경로는 `research-ide/` 아래에 있다. N6-01 OPEN / N6-02 PARTIAL / M3 56/64를 유지한다.
