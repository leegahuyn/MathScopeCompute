# 실제 FTC selector 안의 profile 도함수: 정성적 유한성

원본 node416306은 expression6의 실제 U1 본문29289에 대한 보통
`partial_X^2 partial_eta`다. 원본 complete definition SHA-256은
`133b2bbfc587140e854225bff92bea522244829115e97039632fe3ce64b7abb3`이다.
이 항은 source의 `actual-background-physical-seminorms.mjs`가 만드는
rectangular FTC face 적분에 들어간다. 단순한 산술 상수가 아니므로,
native가 있다는 이유만으로 유한성이나 양의 부호를 가정하지 않는다.

같은 실제 leading 및 order-one receipt는 원래2..10의 모든 고정 차수
도함수가 X>=0, |eta|<1에서 연속이고, eta=+-1에서 안쪽의 모든 고정
jet가 연속적으로 확장됨을 증명한다. 실제4/7은 V/sqrt(X)가 아니라
V/X이며, stream/average의 원점 정칙성도 그 receipt에 포함된다.
따라서 원래 ordinary-X/eta multiindex가 실제 ABI 안에 있고 실제
인자가 X>=0, eta∈[-1,1]임을 확인하면 그 도함수는 유한한 실수다.
도함수가 음수거나0일 가능성은 그대로 남는다.

실제 FTC는 Cartesian 대표를 사용한다. 두 Cartesian 좌표의 유한한
범위는 각각 `[-sqrt(2Xb),sqrt(2Xb)]`이고
`X=(x1^2+x2^2)/2>=0`이다. eta face의 실제 범위는[-1,1]이다.
각 적분 binder는 그 적분의 실제 끝점에서만 범위를 얻는다. 형식좌표
이름만으로 이 범위를 붙이거나 실제 caller 인자를 다른 점으로
바꾸지 않는다. X=0도 이 직사각형에 포함되므로 원점 정칙성은 필수다.

검증기는 `ConstantDomains`의 선택적 handler를 동일한 source의
leading/order-one 입력 결합 검사가 끝난 후에만 활성화한다. 기본
상태에서는 native를 계속 거부한다. 활성화된 handler도2..10의
완전한 원본 definition hash, 같은 실제 본문 root, 두 formal parameter,
partial order와 원래 derivative limit를 검사한다. 두 실제 인자
subgraph를 현재 적분 scope에서 모두 재귀적으로 검사한 뒤에야
위 X/eta 범위를 사용한다. 다른 native나 증명되지 않은 범위는 OPEN이다.

그 결론은 부호와 크기를 모르는 유한한 연속 실수
`Bound(None,None,False,False)`다. 이후 원래 FTC가 사용하는
`sqrt(1+value^2)`는 실제 square/add/radical 연산으로 양수임을
증명하고, 유한한 구간의 연속함수 적분이 유한함을 얻는다. 여기에는
도함수를0으로 치환하거나, 실제 n2 해·도함수·norm을 승인하거나,
FTC 수식을 새로운 수치 상계로 평가하는 단계가 없다.

receipt는 원래 native node, definition/body hash, 실제 인자와 보통
partial order, lexical scope, 실제 인자 범위 및 세 선행 정리의 파일
hash를 남긴다. 잘못된 source 결합, profile, ABI, 인자 범위 및 원점/
eta endpoint 전제를 거부하는 독립 검사23개가 추가되었다. 이 검사는
원본 전체 cache에서 selector 및9개 background body를 새로 재생하는
검증을 대신하지 않는다. 해당 fresh 결과 전의 새 원본 소거 수는0이다.
