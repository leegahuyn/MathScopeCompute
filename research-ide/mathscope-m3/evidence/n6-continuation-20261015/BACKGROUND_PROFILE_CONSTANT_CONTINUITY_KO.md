# 실제 profile 도함수의 정성적 유한성과 selector 상수의 비순환성

독립 과학적 검토: **같은 원본 leading/order-one 정리와 실제 호출 정의역을 확인한 뒤, 함수족 2–10의 도함수를 유한 연속인 미지 부호의 leaf로 사용하는 것은 타당하다.** 이 원리는 도함수 값이나 수치 norm을 주지 않는다. 실제 node416302의 전체 인자 AST와 binder 범위는 다음 fresh 검증에서 확인해야 한다. 본 검토에 의한 원본 ID 소거는 0이다.

## 실제 새 경계

실행 `38731894081`, commit `c2405c5d459cee10201af1014fd2a795ce70ca29`의 인증된 작은 투영은 selector617466 조상에서 다음을 보존한다.

```
416306 = actual_expression_partial(6, [416302,416267], [2,1])
definition6 = ActualFinalOrderOneU
formal coordinates = [4756,2] = [X,eta]
body = 29289
416267 = coordinate('physical_norm_face_7_2$23974')
```

호출 node SHA는 `6b2df106708e3faeb4e90e7194cb847b0c5a389e5739b03a50aa5f85d9fc01ce`, 실제 정의 SHA는 `133b2bbfc587140e854225bff92bea522244829115e97039632fe3ce64b7abb3`다. 투영에는 node416302의 조상이 없으며 `argumentGraphComplete=false`다. 따라서 이 로컬 자료만으로 그 인자를 원본 Cartesian 다항식과 동일하다고 인증할 수 없다.

원래 `actual-background-physical-seminorms.mjs` 43–50줄은 미분을 먼저 취한 뒤 각 FTC face의 좌표를 대입하고 모든 선택된 좌표를 유한 구간에서 적분한다. 106–109줄의 원래 생성식은

\[
X_c=(x_1^2+x_2^2)/2,\qquad
|x_1|,|x_2|\le\sqrt{2X_b},\qquad -1\le\eta\le1.
\]

그러므로 이 생성식이 실제 AST에 연결되면 `0<=Xc<=2Xb`다. 각 face에서 일부 좌표를 왼쪽 끝점으로 고정해도 이 범위는 보존된다. 다음 fresh 검증은 이 본문의 동일성 또는 각 실제 인자의 같은 범위 명제를 원본 AST와 binder scope로 증명해야 한다. 좌표 이름이나 이 문서의 식만으로 범위를 부여해서는 안 된다.

## 축과 닫힌 eta 끝점

이미 별도로 증명·연결한 원본 정리는 모든 2–10 profile이 `X>=0`, `|eta|<1`에서 C∞이고 모든 고정 혼합 jet이 `X=0`, `eta=+-1`로 안쪽에서 연속 연장됨을 준다. 따라서 실제 6번 U1의 `(2,1)` 도함수도 이 닫힌 영역에 연속이다.

`f(Xc,eta)`는 Cartesian 축에서도 매끄럽다. 예를 들어

\[
\partial_{x_1}f=x_1f_X,\quad
\partial_{x_1}^2f=f_X+x_1^2f_{XX},\quad
\partial_{x_1}\partial_{x_2}f=x_1x_2f_{XX}.
\]

일반 고정 차수에서도 다항식 계수와 유한 개의 `f_(X^k eta^m)`의 합이다. X=0의 안쪽 Taylor 전개가 같은 식을 축까지 정당화한다. 원본 함수를 음의 X에서 평가하거나 `1/sqrt(X)`를 축에 대입할 필요가 없다. 닫힌 eta 끝점에서는 원래 안쪽 jet과 유한 구간 FTC를 사용한다. 원본 함수의 `|eta|>1` 해석 연장은 요구하지 않는다.

원래 physical seminorm 생성기는 mass를 단순히 X로 나누어 축 값을 추정하지 않고, 이미 증명된 `average`, `v` 등 원본 매끄러운 axis profile을 Cartesian 대표식에 넣는다. 그러나 다른 stress/native 몸체까지 이 사실만으로 승인하는 것은 허용되지 않는다. 그 몸체가 추가로 나타나면 원래 AST와 별도의 정칙성·분모 검사가 필요하다.

## 유한 적분에 필요한 결론의 정확한 크기

닫힌 유한 Cartesian/eta box와 각 face 위의 연속 도함수 J는 유한하고 유계다. 원래 적분의 `sqrt(1+J^2)`는 연속이며 radicand가 1 이상이므로 매끄럽고 양수다. 따라서 모든 해당 유한 중첩 적분은 유한하다. 정확한 sup 값이나 실제 norm 수치가 없어도 이 **유한성** 결론은 성립한다.

native leaf 자체는 부호를 모른다. 따라서 handler는 인자들을 먼저 모두 평가하고, 정확한 원본 body/parameters/orders와 `X>=0`, `-1<=eta<=1`를 검사한 뒤에만 미지 부호의 유한 연속 값으로 반환해야 한다. native leaf를 양수로 표시하거나, 임의의 유한 수치 C1/B/norm으로 치환해서는 안 된다. 이후 `1+J^2`, `maximum(1,...)`, `exp(...)`의 양수성은 그 실제 바깥 연산에서 따로 증명한다. 미지 부호 J의 역수·로그·radical은 별도 조건 없이는 실패해야 한다. 파라미터, binder, partial order, 정의역을 알 수 없으면 계속 OPEN이다.

## 의존성의 방향

완료 leading 합성기의 입력은 post-C12, outer, I1/I2, repair, frozen frame, 동일한 stream binding 및 원본 payload다. order-one 합성기의 입력은 같은 leading, 원본 primitive binding, Picard 정리다. 이 두 정리는 새 physical seminorm, selector617466, background26 소거 결과를 입력으로 소비하지 않는다.

따라서 논리 방향은 `완료 leading/Picard -> 완료 order-one -> 실제 도함수의 연속성 -> 유한 FTC 상수 -> selector 유한성 -> 유한 background 본문 정칙성`이다. selector를 사용해 order-one 정칙성을 다시 가정하는 순환이 아니다. 실행 구현은 같은 원본 root와 입력 SHA 연결을 확인해야 하며, 선언적인 C∞ flag만으로 다른 함수를 승인하면 안 된다.

이 원리는 원래 finite n=1에 나타난 정확한 2–10번 source profile만 다룬다. n>=2 함수, 실제 수치 C1 경계, selector의 정량적 all-band norm, 무한 background 동일성, covariance 양의 weight/행렬, Fourier/PDE 의무는 이 문서에서 증명하지 않는다. 전체 실제 AST와 primitive closure가 fresh 실행에서 통과하기 전까지 26개 OPEN과 웹사이트 수치를 유지한다.
