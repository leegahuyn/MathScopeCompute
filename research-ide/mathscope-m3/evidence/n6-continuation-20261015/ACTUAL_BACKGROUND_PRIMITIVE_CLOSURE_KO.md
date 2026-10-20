# 실제 background 본문의 모든 primitive 정의역 검사

이 보강 검사는 동일한 원본 header의 expression681..685 및688..691,
총9개 literal body를 대상으로 한다. normalized Cp677, cutoff680 및
monotone2 chart의 실제 본문도 별도로 방문한다. 원본 함수나 상수를
수정하지 않는다. 전체 무한 background와의 동일성을 결론내리지 않는다.

대수적 정규화가 `0*(1/eta)`를0으로 없애더라도 eta=0에서 원래 분모가
정의되지 않는 문제는 남는다. 따라서 검증기는 실제 node의 **모든 자식**을
먼저 검사한 뒤에만 대수적 정규화로 source 인자나 chart 식을 비교한다.
거듭제곱 지수가0이어도 실제 밑의 subtree를 먼저 검사한다. 알 수 없는
native call, primitive, conditional 또는 적분은 닫힘의 증거가 아니다.

불투명하게 멈추는 실제 source root는3451의 승인된 P0,9239의 승인된
M0 및617466의 동일한 selector뿐이다. 처음 두 함수는 같은 leading/
order-one/natural receipt의 정확한 본문과 좌표에서만 사용한다.
selector는 원래63개 parameter AST에 대한 hardened ConstantDomains가
그 전체 원본 cone의 유한성과 strict positivity를 먼저 증명해야 한다.
사용하지 않는 n2 norm이 실제 도함수의 상계라는 가정은 사용하지 않는다.

실제 profile native2..10 호출은 `[X,eta]`, order0을 그대로 보존한다.
Cp 적분 내부의 F0 호출만 실제 binder를 첫 인자로 쓰며, 그 binder의
범위는 `[0,X]`이다. 승인된 leading 정리가 X=0에서의 정칙성도 주므로
이 끝점을 양의 X로 잘못 바꾸지 않는다. Cp는 유한구간의 연속 함수
적분이고, 움직이는 위쪽 끝점의 도함수는 미적분학의 기본정리를 따른다.

normalization의 실제 역수 L은 `L=1-2h*eta^2>7/8`이고, 실제 radical은
`sqrt(2X)>0`이다. 각 log의 실제 인자는2, 양수 q, 양수 Q 또는 양수 s다.
이 값들은 각각 원래 함수의 domain과 실제 node에서 얻는다. 적분 binder,
물리 좌표 및 함수의 형식좌표를 서로 바꿔서 부호를 증명하지 않는다.

실제 cutoff의 세 가지 lazy branch는 각자의 domain에서 모두 방문한다.
중간 branch는 `1/2<t<1`, 따라서 `u=2t-1>0`, `1-u>0`이고 두
exponential과 그 합이 양수다. 외부 branch는 원래 상수1과0이다.
`exp(-1/u)` 및 `exp(-1/(1-u))`의 끝점 flatness가 모든 고정 차수
접합을 보장한다. 범위 밖에서 중간 branch의 역수를 평가하지 않는다.
한편 외부 branch 자체에 정의되지 않은 node가 있으면 검사는 거부한다.

chart는 실제 식 `s-Z^2*s^(2h)-T=0` 및 실제 구간 `[1/2,2]`를
다시 확인한다. 원래 image의 한 점을 s0,eta0로 쓰면
`Z^2=s0^(1-2h)*eta0^2`, `T=s0*(1-eta0^2)`이고 s0가 실제 근이다.
전체 bracket에서
`Z^2*s^(2h-1)<4`, `2h<1/8`이므로 근 방정식의 s 도함수는
1/2보다 크다. 유일한 근과 implicit 미분이 정당하다. 이 정리는 원래
image에서 사용하며, 임의의 Z,T 직사각형으로 확대하지 않는다.
물리 T=0에서의 도함수는 원래의 한쪽 convention을 유지한다.

fresh receipt의 `actualPrimitiveClosureAudit`는 실제9개 definition/body
hash, 방문한 실제 node 집합과 node-record hash, primitive별 정의역
증거, 정확한 native 인자/order, 각 lazy branch 및 Cp 적분의 증거를
남긴다. 미해결 frontier가 있으면 `completeActualClosure=true`를
내보내지 않는다. 기존 BodyNormal의9개 literal 비교와 이 검사는 함께
필요하며, 어느 한쪽만으로 원래26개 요청을 승인하지 않는다.

정의마다 허용하는 좌표도 실제 formal parameter로 제한한다. normalized
본문은 q/X/eta, 물리 본문은 R/Z/T/ell, Cp는 X/eta, cutoff는 t만
허용한다. monotone 본문도 자체 parameters와 근 변수만 허용한다.
따라서0배 된 미선언 free coordinate나 다른 scope에서의 M0/P0 사용도
대수적 상쇄로 숨길 수 없다.

24개 독립 fixture 검사는 숨겨진 inverse0, `1/eta`, log0, 음수/0
radical, 거듭제곱0에 숨은 inverse,0배 된 미승인 native, 잘못된
native 인자/order, 미승인 branch/적분, cutoff의 비활성 branch 및
Cp의 X=0에서 잘못된 inverse 및 scope 밖의 미선언 좌표를 거부한다. fixture 통과는 원본 cache의
fresh replay를 대체하지 않는다.
