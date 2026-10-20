# 실제 axial density의 원본 finite-face 적분 적용

이 단계는 검증된 native expression1의 정칙성을 원본 Cartesian 호출에 적용한다.
출발점은 PR30의 `cd1f6762af0b77b67816f24ddf8dfe38d390c982`이다.
원본 생산자, 상수, derivativeLimits, ordered request와 acceptance gate를 바꾸지 않는다.

## 같은 함수와 실제 인자

앞 단계의 20개 입력을 전부 다시 합성하여
`density117047=choose(X4756,Xminus28814,Xplus28824,0,raw117045,0)`의
모든 고정 ordinary mixed jet과 inward eta endpoint 연속성을 확인한다.
단순 pass flag나 raw residual의 정칙성만 소비하지 않는다.
원본 스트림의 인증된 SQLite에서 83-node cone, 각 binder, finite-face 구간과
selector617466의 실제 조상 경로를 비교한다.

`X517175=(x1²+x2²)/2`, `eta517017`이고 실제 호출은 다음과 같다.

| 원본 노드 | 같은 native1의 실제 호출 |
|---|---|
| 517218 | `g_eta(X517175,eta517017)` |
| 517221 | `g_eta(s117055,eta517017)` |
| 517227 | `g_Xeta(X517175,eta517017)` |
| 517222 | `integral_a^X g_eta(s,eta) ds` |

적분의 끝점은 새 binder 밖에서 평가한다. `117055`는 적분 몸체에서만
독립적인 radial 좌표다. Cartesian 호출점의 X 범위를 이 binder에 그대로
대입하지 않는다. 원본 guard의 활성 구간 `0<a=Xminus<X<Xplus=b`에서
실제 적분 구간은 `[a,X]`이며 `[a,b]` 안에 들어간다.

## 유한한 경계와 보존된 점프 가능성

검증된 density의 `g_eta,g_Xeta`는 `[a,b]×[-1,1]`에서 연속이므로
같은 함수의 유한한 정성적 경계 `M_eta,M_Xeta`가 존재한다.
원본 lazy guard517234는 `X<=a` 또는 `X>=b`이면 먼저 literal0을 선택한다.
이 분기에서는 `1/r`이나 raw 식을 축에서 평가하지 않는다.

활성 분기에서 `r=sqrt(2X)>=rmin=sqrt(2a)>0`이다. 모든 역수의 정의역을
확인한 뒤 실제517233을 정확한 유리식으로 비교하면

`E=x1*x2*(2*g_eta/r^3-3*I_eta/r^5-g_Xeta/r)`

이며 `I_eta=integral_a^X g_eta(s,eta) ds`이다. 따라서

`|I_eta|<=(b-a)*M_eta`,

`|E|<=C=b*(2*M_eta/rmin^3+3*(b-a)*M_eta/rmin^5+M_Xeta/rmin)<infinity`.

이것은 수치 크기를 인증하는 bound가 아니다. 특히 b에서 내부 극한은
`-3*x1*x2*I_eta(b,eta)/r_b^5`일 수 있다. 실제 경계값0과의 연속성,
totalAxial=0, genuine Tz primitive의 접합 또는 실제 stress derivative와의
동일성을 여기서 주장하지 않는다.

## 원본 세 중첩 적분

원본 `H517237=sqrt(1+E517234^2)`는 `1<=H<=Hmax=sqrt(1+C^2)`를 만족한다.
바깥 분기의 H도1이므로 적분 유한성은 원본 유한 face box를 사용한다.
그 구간은 `R=sqrt(2*Xb28826)>0`에 대해 `[-R,R]^2×[-1,1]`이다.

| 원본 노드 | 적분 binder와 구간 | 정성적 경계 |
|---|---|---|
| 517238 | eta517017, `[-1,1]` | `2<=K<=2*Hmax` |
| 517239 | x2 517016, `[-R,R]` | `4R<=L<=4R*Hmax` |
| 517240 | x1 517015, `[-R,R]` | `16Xb<=face<=16Xb*Hmax` |

단순히 bounded measurable이라는 이유로 Riemann 적분을 승인하지 않는다.
이 원본 식에서 불연속 가능 집합은 두 radial cylinder `X=a,b`에 포함된다.
고정된 x1,x2의 eta slice는 연속이며 cylinder 위에서는 literal H=1이다.
eta 적분 K는 두 원 밖에서 연속이고, 고정 x1의 x2 slice에는 원과의 교점이
최대 네 개다. 따라서 그 bounded slice의 Riemann 적분이 존재한다.
마지막으로 고정 x1의 예외 x2가 유한 집합이고 균일 경계가 있으므로
bounded dominated convergence로 L의 x1 연속성을 얻는다. 마지막 원본
Riemann 적분도 존재한다. 같은 함수들의 Lebesgue 적분 역시 유한하다.

## 원본 background 검증에 대한 제한된 적용

기존 ConstantDomains와 원본 background gate의 기본 동작은 유지한다.
명시적으로 켠 source-bound application은 **환경이 빈 완전한517240**만
받는다. 전체 density 증명과 원본 source receipt를 다시 합성하고 실제
node와 fixed parameter를 비교한 뒤 이 scalar가 유한하고 양수임을 반환한다.
그 자식 식의 generic 연속성이나 임의의 smooth_piecewise를 승인하지 않는다.

새 실행은 기존 `ACTUAL_BACKGROUND_26_JET_REGULARITY.json`을 덮어쓰지 않고
별도 continuation과 별도 matrix를 기록한다. 모든 9개 몸체, primitive 정의역,
chart, cutoff와 26개 ordered request의 기존 ALL26_OR_NONE 검증이 그대로
남는다. 이 finite-face 증명 자체의 Guard/Jet/PDE discharge는 모두0이다.

## OpenAI 자료의 실제 사용과 경계

같은 native1 density 증명은 첨부된 OpenAI 원문 p49 식(5.9)의 axial residual
구조와 원본 직렬화 식의 대응을 사용한다. 이번 단계는 그 정칙성 결과를
실제 native argument, 독립 binder와 유한 적분에 적용한다. 논문 속 적분의
모멘트 소거를 이 literal Cartesian 식의 경계 연속성으로 대체하지 않는다.
공식 PDF와 첨부 원문은 SHA256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`로
식별되어 있으며, [공식 원문](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)을 사용한다.
별도 Lean pin의 Lemma8.6 m+4 대 inverse theorem m+5 차이도 유지한다.
새 Lean kernel proof, 전체 Navier–Stokes 해결 또는 N6의 보편적 해결을
주장하지 않는다. 실행별 결과와 raw failure는 후속 run 보고서에 보존한다.
