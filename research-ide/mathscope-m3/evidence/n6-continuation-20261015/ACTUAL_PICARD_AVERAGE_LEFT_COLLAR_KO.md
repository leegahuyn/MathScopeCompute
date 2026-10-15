# 실제 Picard 평균과 왼쪽 축방향 영 collar의 합성

이 단계는 head `9a2021ce32a9f0dab511e2270cdc2aa32efe81f7`의 검증된
선행 U/M/M_eta/v collar 동일성에서 이어진다. 원본 producer, 상수,
적분 구간, 축 자료, quantifier와 수락 gate를 바꾸지 않는다.
원본26의 전체 수락 또는 원래1260개 의무의 소거와는 구분한다.

## 원래 리터럴 평균의 적분 상수

원래 평균29336의 내부 분기는29332이다. 그 식은 같은 Picard0의
component1을 인자 `t*X,eta`에 평가한 리터럴 `integral_0^1 U(tX,eta)dt`다.
전시용 유한 Picard 부분합으로 바꾸지 않는다. 원래 여섯 행의 대각은
`[0,0,2,0,3,1]`이고 U/K 행은 같은 W5를 각각 +1/-1로 사용한다.
이 두 행의 A1 및 forcing은0이며 원래 축 datum은 여섯 성분 모두0이다.

`X=xi^2`, `xi>0`에서 원래 K 행은

`K_xi + 2*K/xi = -U_xi`

이므로 `partial_X[X*(U+K)]=U`다. 축을 포함하는 같은 실제 Picard
정칙성으로 U+K가 축 근방에서 유계이고, 따라서 `X*(U+K)`의 축
극한은0이다. 이 원래 축 상수를 보존해 FTC를 적용하면

`X*(U+K) = integral_0^X U(s,eta)ds`.

고정 X>0에서 `s=tX`로 바꾸면 원래 구간0..1의 평균은 정확히 U+K다.
X=0에서는 1/X 또는 1/xi를 평가하지 않고 고정 구간 평균의 연속
확장을 쓴다. 원래 축 자료를 생략하거나 별도의 적분 상수를0으로
선언해서 얻는 결론이 아니다.

이 증명에는 좁은 leading collar만으로 부족하다. 모든0<=t<=1에 대해
`0<=tX<aSquared`가 필요하므로, 기존에 증명한 실제 Picard의 **축부터
aSquared까지 전체 공통 영역**을 소비한다. 각 고정 r,s에 대해 같은
compact 영역의 혼합 jet 연속성은

`partial_X^r partial_eta^s average = integral_0^1 t^r*(partial_X^r partial_eta^s U)(tX,eta)dt`

를 정당화한다. 먼저 eta 내부에서 증명하고 연속 극한으로 원래
eta=+-1의 안쪽 convention을 보존한다. 모든 미분 차수에 공통인
수치 bound 또는 실제 norm 값을 여기서 주장하지 않는다.

## 같은 전역 양의 차수 함수의 내부 분기

열린 구간은 원래와 같은

`C = (Xa*exp(t1/256), Xa*exp(3*t1/256))`

이며 `Xa<C_left<Xminus<C_right<Xkeep<aSquared`다. 이전의 정확한
매개변수 부등식과 원래 Ipos support를 사용하여, 전역 U1과 Pi1은
각각 같은 Picard0의 component1과 component3을 선택한다. 실제 v1은
동일한 U1, 평균 및 평균의 eta 미분으로 구성된다. 평균 동일성과
미분·적분 교환 후에도 원래 식

`v1 = (2*eta*U1 - 2*(D+nu)*eta*average - d*average_eta)/L`

를 그대로 남긴다. `nu=lambda1=2*h`는 노드25이고, 외부 source
`lambda` 노드8과 바꾸지 않는다. `d=1-eta^2`, `L=1-2*h*eta^2`도
같은 원본 정의다. 이 결과와 이전의 실제 U0/v0 collar 동일성은
raw residual에 쓰이는 다섯 프로파일을 같은 내부 해에 연결한다.

## 원래 여덟 항과 내부 축방향 방정식

같은 함수가 열린 C에서 일치하고 필요한 고정 jet이 존재하므로
raw117045의 도함수들도 같은 내부 함수의 도함수다. 원래 소스의
여덟 항을 모두 유지하여 실제 `actualInnerPDEIdentity`에 연결한다.
단순한 `pass:true`, sourceAssertions 또는 임의 forcing을 대신 쓰지
않고, 같은 고정 Picard 레지스트리, 행렬, forcing과 source leading
roots를 확인한다.

두 좌표 변환은 별도로 확인한다. U1_X는 `W5/(2*xi)`이고

`X*U1_XX+U1_X = (W5_xi+W5/xi)/4`.

원래 W5 행의 대각은1이므로 원래 radial 점성 항은 정확히
`-2*(X*U1_XX+U1_X)=-rhs5/2`다. 압력 행은 대각0이며 같은 forcing과
F0를 사용하므로 `Pi1_X=rhs3/(2*xi)=2*F0*F1-omega0OverX/2`다.
나머지 T/Z, 대류 및 선행 점성 항도 원래 계수와 그대로 대응한다.

이 구간에서는 `xi=sqrt(X)>0`이다. 실제 분모 노드25577은 `2*xi`,
노드28은 L이며 기존 같은 매개변수 증명은 물리적 `abs(eta)<=1`에서
`L>7/8`을 준다. 분모를 제거한 항등식을 축의 1/xi 식에 적용하지
않는다. 실제 수렴하는 무한 Picard 해가 원래 ODE를 만족한다는
정칙성·적분방정식 정리를 같은 소스에 결속해야 한다.

그렇게 합성한 결론은 `raw117045=0` on `C x (-1,1)`이다. 기존 raw
C-infinity 정리로 C의 모든 고정 혼합 raw jet도0이며, 안쪽 연속
극한으로 eta=+-1까지 연결된다. 원래 density1 body117047은
`choose(X,Xminus,Xplus,0,raw117045,0)`이므로 왼쪽 Xminus 근방에서
밀도 자체가 국소적으로0이고 왼쪽 영 접합 jet도 일치한다.

이번 raw 소스의 eta 영역을 더 넓은 Picard 복소 tube로 확장하지
않는다. 이 왼쪽 단계에는 전역 F0pos/압력 전체의 독립 식별이
필요하지 않다. Pi1의 내부 분기는 같은 내부 F0와 omega를 쓰는
Picard 성분을 직접 선택하기 때문이다. 그 전역 식별 과제는 다른
응용에서 그대로 남는다.

## 첨부 논문과 남는 별도 의무

동일성이 확인된166쪽 첨부 논문의 SHA256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다.
[공식 논문](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)
p47의 K 정의와 (5.7), pp48–49 Lemma5.1 Step3이 평균과 축·parity
정당화에 해당한다. p46 (5.2)와 (5.4), pp50–51 Lemma5.2의 내부
재구성을 같은 실제 소스에 적용한다. Lean 컴파일 또는 논문만으로
직렬화된 원본 의무가 자동 소거된다고 하지 않는다.

전역 density의 오른쪽 접합과 전체 ordinary derivative 응용,
bounded piecewise integrability, 실제 응력 원시함수 접합과 수치 norm
honesty는 별도다. 특히 p49 (5.9)의 응력에서 전방·후방 원시함수의
동일성과 오른쪽 영 접합은 총 밀도 적분 및 그 eta 미분의 소거를
추가로 요구한다. 원래 결합된 다섯 번째 모멘트의 fluxOmega24744를
삭제하거나 각 항을 따로0으로 가정하지 않는다. 원래 전체 모멘트
구간 `[0,Xplus]`를 임의로 바꾸지 않는다.

실행별 검증 결과와 원시 실패·성공 기록은 후속 run 보고서와 해시
목록에 보존한다. 이번 단계만으로 원본26, M3 또는 전체 N6/NS의
완료를 주장하지 않는다.

이 국소 결론으로 raw가 전체 [0,Xminus]에서0이라고 주장하지 않는다.
특히 전체 모멘트의 [0,Xplus] 적분을 줄이거나 축부터의 누적 질량을
임의로0으로 둘 수 없다.
