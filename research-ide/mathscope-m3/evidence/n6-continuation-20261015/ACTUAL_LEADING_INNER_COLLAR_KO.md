# 실제 전역·내부 B26 질량의 열린 collar 동일성

기준 head는 `e5e7f1d579c44ff53030520e70a1dd0e011da750`이다.
그 head의 기존 네 CI 워크플로는 모두 성공했다. 실행별 URL과 여덟
gauge/fluid job의 최종 상태는 `CI_COMPLETION_E5E7F1D.json`에 보존한다.
CI 상태로 원본 의무를 소거하지 않는다. Guard10 / Jet230 / PDE1020 =1260,
M3 56/64, N6-01 OPEN, N6-02 PARTIAL을 유지한다.

## 같은 원본 함수의 비교

`actual_leading_inner_collar.mjs`는 원래 terms0 / bits128 / heatIterations0
생성자를 호출하고, 원본 파일 바이트와 고정 정의·진단·논문 SHA를 확인한다.
원본 그래프와 함수 정의를 보존한 채 별도의 비교용 노드만 추가한다.
원래 전역 U9236, M9239, M_eta18767, v18778과 내부 U24858,
질량24899, 질량의 eta 미분24908, v24914를 각각 제한한다.

열린 구간은

`Xa*exp(t1/256) < X < Xa*exp(3*t1/256)`

이다. 원래 `Xminus=Xa*exp(2*t1/256)`를 양쪽에서 포함한다. 양의
`t1=CSelected^-120<2^-120`과 지수함수의 엄격한 단조성으로

`Xa < collarLeft < Xminus < collarRight < Xkeep < inner.aSquared < loopILeft < 1`

을 보인다. 여기서 `Xkeep=Xa*exp(4*t1/256)`,
`inner.aSquared=Xa*exp(t1/16)`, `loopILeft=Xa*exp(t1/8)`이다.
`Q>2^260`, `Lambda=Q^64`, `Xa=4/Lambda`는 수치 오버플로 계산 없이
`loopILeft<12/2^16640<1`을 준다. 외부 patch의 왼쪽 끝과 I1의
`X0I1=XR*exp(60001*T-23)`는 1보다 크다. 따라서 C12와 I1의 실제
보정은 이 collar에서 비활성이다. `1<loopILeft`를 가정하지 않는다.

전역 U와 내부 U는 같은 B26 노드4788로 환원된다. 전역 질량은
5255, 내부 질량은24899에 남는 서로 다른 binder의 리터럴 적분을
alpha-renaming하여 비교한다. 양쪽의 같은 누적 질량 상수4486과
같은 하한Xa를 보존한다. eta 미분도 원래 별도로 전개된 그래프
`18767 -> 6182 -> 5696 -> 5675 -> 5665`에서 검사한다. 내부24908과
비교할 때 누적 eta 상수5306을 그대로 남긴다. 마지막 v 비교는
같은 질량 및 eta 미분으로 구성된 실제 식을 사용한다.

적분 body에는 바깥 자유 좌표 X의 collar 가정을 전파하지 않는다.
서로 다른 binder, 적분 끝점, 활성 분기 또는 I1 support를 바꾸면
비교를 거절해야 한다. sourceAssertions, 임의 atom 면제, 전체 질량0,
응력 접합 또는 수치적 근사값은 동일성의 전제가 아니다.

## 첨부 논문의 실제 적용 범위

검증한166쪽 첨부 논문의 SHA256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이며
원래 소스의 `sourcePaperSHA256`과 같다.
[공식 논문](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)
p46 (5.2)는 같은 질량 원시함수와 축 상수로 v를 정한다. 이번
동일성은 이 단계의 실제 전역·내부 계수를 연결한다. 같은 실제
함수의 기존 completed-leading 정칙성 정리를 결속하면 이 열린
근방에서 필요한 혼합 jet의 동일성도 따른다.

native1 밀도의 왼쪽 영 접합에는 추가로 전역 U1/v1/Pi1의 실제
Picard 성분 일치, 원래 행렬·forcing이 주는 axial 식 (5.4), 필요한
정칙성과 eta 끝점 convention을 같은 소스로 결속해야 한다.
Lemma5.1과 Lemma5.2 Step1 및 (5.14)–(5.15)가 이 단계에 해당한다.
이번 선행 계수 동일성만으로 이 전체 적용을 완료했다고 하지 않는다.

다음 구체적인 소스 결속은 v1의 평균29336이다. Xkeep 이전 분기는
리터럴29332=`integral_0^1 PicardEven(0,1,t*X,eta) dt`를 선택한다.
원래 U/K 행과 영 축 자료는 `partial_X[X*(U+K)]=U`를 주므로,
정칙성과 FTC를 결속하면 이 적분은 `U+K`다. 기존
`evenPicardMassJacobian=0` 산술 검사만으로 리터럴29332까지 결속했다고
하지 않는다. 이 실제 body·행·축 자료의 연결을 후속 증명으로 남긴다.

p49 (5.9)의 응력은 음의 잔차의 가중 전방 원시함수다. 그 오른쪽
영 접합에는 p53 (5.20)–(5.21) 및 p54의 전방·후방 표현에 따른 실제
총 axial moment 소거, 압력 경계항, 선행 flux moment, 적분의 eta
미분 교환이 추가로 필요하다. 밀도 접합과 이 응력 접합은 서로 다른
증명이다. bounded piecewise integrability와 numerical norm honesty도
별도 계약으로 남긴다. Lean의 가정·컴파일 결과나 논문의 정리를
원본 의무의 자동 소거로 바꾸지 않는다.

## 검증 결과의 보존

실제 로컬 실행 및 호스팅 실행의 결과·테스트·SHA 목록을 후속 실행
디렉터리에 보존한다. 이전6193/24913의 wrapper 미제거 비교 실패는
삭제하거나 수학적 반례로 바꾸지 않는다. 분기 제한 후 적분의 정확한
동일성을 확인하는 이번 단계와 구분한다. 원본 producer, 상수,
quantifier, 수락 gate와 원래26개 OPEN 기록은 변경하지 않는다.
