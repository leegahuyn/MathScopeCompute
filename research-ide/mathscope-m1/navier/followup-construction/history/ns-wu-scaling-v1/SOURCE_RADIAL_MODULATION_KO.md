# Appendix C.12의 실제 유한 주파수 변조와 첫 보정 구간

이 후속 모듈은 첨부 원문 PDF 161–163쪽 Proposition C.2의 **변조 연산과 실제로 발생한 다섯 모멘트 오차의 보정 연산**을 실행한다. 입력은 명시적으로 정의한 양의 annulus 프로파일이다. Appendix B의 완성된 무한 축 해와 실제 Appendix A 외곽을 접합한 원문의 전체 프로파일은 아직 이 입력에 연결되지 않았다. 따라서 표본이 모두 cone 내부에 있더라도 결과 상태는 `PARTIAL`, `fullProfileCertified`는 `false`이다.

## 1. 실행 계약과 데이터

`source-radial-modulation.mjs`가 다음 세 함수를 내보낸다.

```javascript
await runRadialModulation(input, budget)
validateRadialModulationInput(input)
getRadialModulationExamples()
```

공통 작업 종류는 `ns.radial-modulation`이다. 모든 입력은 JSON이다. 함수나 임의 사용자 코드를 프로파일로 실행하지 않는다. `budget`은 공통 `makeBudget` 결과 또는 `maxOperations`, `maxMilliseconds`, `maxPoints`를 가진 설정이다. 취소는 공통 budget의 `tick()`에서 검사한다. 정적 import만 사용하므로 독립 Worker 번들에서 실행할 수 있다.

기본 예제는 다음과 같다.

```javascript
{
  kind: 'ns.radial-modulation',
  input: {
    family: 'explicit-power-annulus',
    N: 512, etaValues: [0], samples: 97
  },
  budget: {
    maxOperations: 50000000,
    maxMilliseconds: 60000,
    maxPoints: 8192
  }
}
```

기본 `h=10^-8`, `lambda=0.2`, 축 쪽 진폭 40, power 진폭 1, 변조 구간 `[3,6]`, 첫 보정 구간 `[8,16]`을 사용한다. `N`은 2–2048이며 기본 예제의 실제 진단 표본은 변조 4,294개와 보정 65개다. 요청 `samples=97`은 상세 표의 기본 밀도이며, 진단에는 주파수에 맞춘 더 조밀한 격자와 좁은 cutoff의 추가 점을 쓴다. 기본 공통 예산의 4,096점으로 N=512를 요청하면 정상적으로 `BUDGET_EXCEEDED`를 반환한다.

출력은 `parameters`, `inputContract`, `loopParameters`, `supportContract`, `slices`, `computedConditions`, `missingConditions`, `visualization`을 포함한다. 각 slice는 실제 E, U, eta 미분, 위상을 고정한 log-radius 편미분, 전미분에서 얻은 shear, 누적 모멘트, 압력, V0, 변경된 ps, cone의 네 gap을 제공한다. 첫 eta 미분만 요청했을 때 계산하지 않은 이차 미분은 `null` 또는 생략이며 0으로 만들지 않는다.

## 2. 명시적 입력 프로파일과 원문 입력의 경계

`y=log X`, `alpha=0.1`, `beta=-1/2-lambda`로 둔다. X≤1에서 E=A X^alpha이고, 1<X<2에서는 log E를 원문의 smooth step으로 `log A+alpha y`에서 `log K+beta y`로 연결한다. X≥2에서는

\[
\log E=\log K+\beta y+J\sigma((y-\log X_-)/w),\qquad
w=\log(X_+/X_-),\quad J=(\alpha-\beta)w/8.
\]

U=0이며 E는 eta와 무관하다. X≥X+에서는 정확히 E=Kout X^beta이므로 첫 보정 구간에서 원문 PDF 162쪽의 두 U 가중치와 세 E 가중치를 그대로 사용할 수 있다. 각 유한 반경까지의 누적 모멘트를 계산하며 Cp의 무한 꼬리는 정확한 power 적분이다. I의 무한대 적분까지 유한하다는 주장은 하지 않는다. 압력 datum은 Pi(0)=-Cp(infinity), Pi(X)는 남은 Cp 꼬리의 음수로 계산하여 큰 수의 차감 오차를 줄인다.

이 X^0.1 축 쪽 연결은 Cartesian 정칙 축을 주장하기 위한 자료가 아니다. `regularCartesianAxisCertified=false`, `originalPaperProfile=false`로 명시한다. 첫 보정 구간에서의 원문 연산을 평가할 수 있는 명시적 입력이다. 원문 Corollary B.10의 전 프로파일 존재 정리와 동일한 해로 표시하지 않는다.

## 3. C.1 loop, 정규화된 원시함수와 C.12

`admissible-loop.mjs`의 실제 C.4–C.10 구성을 사용하여 공유 d0, muMax, delta를 선택한다. 이 선택의 검사는 주어진 유한 상태 집합에 한정된다. 연속적인 모든 (X,eta)에 대한 입력 조건 인증은 아니다. 이후 X와 eta를 미분할 때 이 공유 매개변수들을 고정한다.

원문 C.11은 phi에 대한 평균이 0인 주기 원시함수 Acal, Bcal을 정의한다.

\[
\partial_\varphi\mathcal A=-\tfrac12(a_L-a),\qquad
\partial_\varphi\mathcal B=\tfrac12E(b_L-b_s).
\]

일반 p2 분기에서는 원문의 exponential tilt, prescribed-variance 해, 원의 재매개변수화를 계산한다. theta와 phi의 평균을 구분하여 가중 평균을 제거한다. theta 구간별 Simpson 적분과 단조 Hermite 역변환을 쓰며, 주기 결함이 허용 범위를 넘으면 정밀도 부족을 반환한다. p2가 0으로 갈 때는 `expm1`과 양의 분산 급수로 cancellation을 줄인다.

이 입력의 eta=0에서는 p2=0이다. 이 제거 가능한 특수 분기의 정확한 식을 사용한다. T=d0 mu, v=a+rho라 쓰면

\[
\varphi=\frac{\theta}{2\pi}-\frac{\rho\sin(2\theta)}{4\pi v},\quad
\mathcal A=-\frac{a\rho\sin(2\theta)}{8\pi v},\quad
\mathcal B=\frac{EaT\cos\theta}{4\pi}.
\]

단조인 첫 식의 역함수를 수치로 구한다. p2=0에서 원시함수의 첫 p2 미분을 해석적으로 계산하고, 실제 ps 식의 `partial_eta p2`와 곱하여 첫 eta 미분을 얻는다. 별도의 ±eta 일반 분기 차분과 비교한 최대 차이는 Acal에서 2.65e-11, Bcal에서 7.33e-12이다. 이는 독립 수치 비교이며 연속 오차 포락 증명은 아니다.

실제 변조는 원문 그대로

\[
E_N=E\exp(\mathcal A(X,\eta,N\log X)/N),\qquad
U_N=U+\mathcal B(X,\eta,N\log X)/N.
\]

원문 C.13에서 DX는 **위상 phi를 고정한** log-radius 미분이다.

\[
a_N=a_L-2D_X\mathcal A/N,\qquad
b_N=e^{-\mathcal A/N}\left(b_L+2D_X\mathcal B/(NE)\right).
\]

이 편미분은 5점 차분으로 계산한다. 독립 검사는 위상을 포함해 E_N, U_N을 다시 평가한 전 log-radius 미분이다. 기본 N=512에서 a, b의 두 방식 차이는 각각 약 1.10e-11, 1.17e-10이다. exponential 분모를 생략하거나 N partial_phi 항을 누락하는 음성 대조는 실제 큰 오차를 발생시킨다.

## 4. 좁은 cutoff와 오실레이션 적분

공유 delta가 작을 때 C.1 cutoff의 radial 전이는 한 위상 주기보다 훨씬 좁을 수 있다. 단순한 조밀 격자도 이 구간을 놓치므로, a=2+delta/8과 a=2+delta/4의 두 문턱을 양쪽에서 찾아 적분 구간을 분할한다. log-radius 미분 간격도 각 실제 cutoff 폭의 1/128 이하로 제한한다. 각 좁은 구간에는 17개 추가 진단점을 둔다.

이 처리는 실제로 필요한 수정이었다. N=256은 일반 격자만으로는 통과한 것처럼 보였지만, cutoff를 포함하면 2,165개 중 2개에서 cone gap이 음수이다. N=512는 계산한 4,294개 점에서 모두 양수이다. 따라서 표본 통과를 전구간 인증으로 바꾸거나 N의 증가만으로 모든 이후 정수의 통과를 추정하지 않는다.

모멘트 적분에는 위상 사분주기 경계, 실제 cutoff 경계, 요청 반경의 누적 경계를 함께 사용한다. 작은 변화는 `deltaE`와 `expm1`으로 계산하고 제곱 차이를 직접 큰 두 값의 차로 만들지 않는다. 모멘트 오차의 첫 eta 미분도 실제 필드 미분으로 적분한다. 별도 적분 차수 `q+4`로 변조 오차를 비교한다.

## 5. 실제 모멘트 오차의 첫 patch 복원

복원 목표는 임의로 심어 놓은 bump 계수가 아니다. C.12에서 실제 발생한 `(deltaM,deltaI,deltaJ,deltaS,deltaCp)`이다. 첫 patch 안에 서로 겹치지 않는 다섯 compact bump를 두며, 앞 두 개는 U, 뒤 세 개는 E에 작용한다. 원문 PDF 162쪽의 선형 미분 가중치는

|변경 필드|모멘트 행|가중치|
|---|---|---|
|U|M, J|1, H=√(2X) E|
|E|I, S, Cp|√(2X), -E, E/X|

이다. lambda>0를 고정해야 U의 두 행이 구별된다. 실제 변경의 U², E², E·U 항을 포함한 비선형 모멘트 식을 만들고 감쇠 Newton 방법으로 계수 다섯 개를 계산한다. eta 미분은 이 비선형 식을 미분한 실제 Jacobian을 풀어 얻는다. 이 연산은 원문 B.8의 inner 접합을 대신하지 않는다. Appendix C.2의 **변조 후 첫 patch 복원**이다.

N=512의 계산된 계수는 대략

`[9.82168087e-8, -7.60698042e-8, -3.30888823e-7, 7.56566536e-7, -4.21748569e-7]`

이다. Newton 내부의 모멘트 잔차는 2e-18 이하이고, 변조 적분 차수를 높인 뒤 보정도 독립 192점 Gauss로 재적분하면 다섯 잔차의 최대 절댓값은 5.27e-13이다. 계수의 연속 eta 전역 존재, 오차의 엄밀한 포락, uniform interval Newton까지 증명한 수치는 아니다.

추가 독립 검증은 80자리 mpmath로 bump의 **국소 좌표**에서 적응 적분한다. 브라우저 구현의 물리 X 좌표 Gauss 계산과 구별되는 경로이다. 실제 선형 행렬 50개 항목, 비선형 복원과 첫 eta 미분 각 10개, 두 block의 비퇴화, 이차항을 버린 실패, lambda=0에서 독립 적분한 U block의 퇴화를 합해 74개 검사가 통과했다.

## 6. 표시 수량과 현재 판정

3차원 그림의 좌표는 `(log X, eta, N(E_N-E))`이다. 높이와 색은 변조 및 보정 두 구간 모두 **같은 수량 N(E_N−E)**을 표시한다. 1/N 크기 변화가 보이도록 명시적으로 N을 곱했으며 원래 크기의 E_N, U_N은 상세 표에 있다. 물리 공간의 3차원 NS 속도장을 표시하는 좌표가 아니다.

compact 모드는 기본적으로 상세 행 132개를 반환하면서 진단에 사용한 변조 4,294점과 보정 65점의 시각화 자료를 보존한다. 최악의 네 gap에 해당하는 행과 모든 좁은 cutoff 행은 상세 표에도 남는다. `detailMode='dense'`는 모든 상세 행을 반환한다.

|기본/대조|계산 결과|전구간 인증|
|---|---|---|
|N=8|실제 변조 및 복원 완료, cone 표본 위반|없음|
|N=256|좁은 cutoff를 포함하면 변조 2개 표본 위반|없음|
|N=512|변조 4,294/4,294, 보정 65/65 점에서 네 gap 양수|없음|

N=512와 같은 점들에서 다시 평가한 N=1024의 값 변화는 대략 절반으로 줄어들지만 radial 변화는 같은 비영 크기 규모로 남는다. 이것은 C.14가 설명하는 현상을 직접 측정한 두 유한 주파수의 비교이다. 모든 N에 대한 점근 상계를 인증했다는 뜻이 아니다.

실행·계약·음성 대조 검사 **53/53**, 독립 보정 검증 **74/74**가 통과했다. 자료는 `source-radial-modulation-tests.json`, `source-radial-modulation-fixtures.json`, `source-correction-independent.json`에 있다. 이번 모듈에서 새 Lean 커널 실행은 하지 않았다. 역사적 71개 로컬 정리와 별도 원문 rc2 C/D 두 정리 감사는 이 수치 입력의 인증으로 자동 승격되지 않는다.

남은 원문 N3-06 수용 조건은 실제 B.10 전 프로파일과의 연결, 전 (X,eta) 입력 조건, 원시함수·미분·진동 적분의 엄밀한 오차 포락, 연속 모멘트 map의 uniform implicit-function/interval-Newton 조건, 고정한 유한 N의 **전구간 양의 cone 여유 kappa**이다. 이 조건을 채우기 전에는 `SAMPLED_POST_CONE`의 범위를 “Only computed finite diagnostic samples; never all-domain certification”으로 유지한다.

원전: 첨부 `01-navier-stokes.pdf`, SHA256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`, 28쪽 (4.15)–(4.16), 158–160쪽 C.1, 161–163쪽 (C.11)–(C.16) 및 Proposition C.2. 공식 저장소 고정 commit은 `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`이다.
