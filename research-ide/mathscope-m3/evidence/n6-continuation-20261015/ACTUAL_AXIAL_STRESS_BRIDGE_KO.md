# 실제 축방향 응력: 원천 식, 미분 대수와 남은 접합 전제

재개 head는 `0a4a743f0ba7f48746bf0a905c2d228713aa9882`이다. 원본 생성자,
상수, 양화, 순서 있는 미분 요청과 합격 기준은 수정하지 않았다.
원본 잔여는 Guard10 / Jet230 / PDE1020 =1260이며 원본26은 OPEN이다.
이 문서의 새 검증은 원본 의무 승격을 뜻하지 않는다.

사용자 첨부166쪽 원고의 SHA256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다.
Library에서 바이트를 독립 확인했다.99쪽 설계도는
`f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이다.
공식 Lean의 별도 가정이나 커널 증명을 새로 이식했다는 주장은 없다.
Lemma8.6의 m+4와 고정 inverse 정리의 m+5 차이는 이 검증으로 바뀌지 않는다.

## 실제 원천의 성분과 ABI

`actual-continuation-exact-stress.mjs`는 angular 적분함수를 먼저 등록하고
axial 적분함수를 두 번째로 등록한다. 따라서 native1은 축방향이다.
원래 bootstrap 옵션은 terms0 / bits128 / heatIterations0이다.
고정 serialized 소스의 expression1은 body117047,parameters[4756,2],
derivativeLimits[128,128],historicalBodyPreserved=true이고 정의 해시는
`f815fd78afc4ef36627e657a34ba84624c838a44039de6435b748020b52b1689`이다.
bootstrap의[4,6] ABI와 구분해 원래 append-only induction 복사를 재현한다.

117047은 정확히 `choose(X,Xminus28814,Xplus28824,0,117045,0)`이다.
angular 성분은 다른 끝점 Xb28826을 쓴다. 원고 p54의 n=1 예외적 외부
원천은 angular에만 해당하므로 이를 이유로 axial의 Xplus를 바꾸지 않는다.

새 source probe는 raw117045의 원래8개 항을 독립 재구성하고 모든 항의
누락을 거부한다. 완전한 leading U0/v0와 U1/v1/Pi1을 그대로 쓴다.
실제 Picard 행렬의6개 대수 항등식과 실제 support 순서 및8개 axial 항의
바깥 소멸도 재실행한다. sourceAssertions를 해석학적 전제로 소비하지 않는다.

## 83-node 원래 미분식의 정확한 환원

a=Xminus,X=(x1²+x2²)/2,r=sqrt(2X),f=native1로 쓰고
Ieta=integral_a^X f_eta(s,eta)ds라 하자. 원래 middle517233은 정확히

`x1*x2*(-3*r^-5*Ieta + 2*r^-3*f_eta - r^-1*f_Xeta)`

이다. 원래83개 노드와 guard,미분 차수,실제 binder117055까지 모두 비교한다.
독립적인 Cartesian 연쇄미분과 실제 소스의 대수 전개가 각각 같은 식에 도달한다.
전체 cone canonical SHA256은
`f02b61635b695f7941caf256042307c99757589e772a0049146797b399b71920`이다.
이는 도함수 존재나 적분 미분 교환을 증명하는 것이 아니다. 그 전제가 충족될 때
원고 p49 (5.9)의 signed primitive에서 원래 식을 재사용할 수 있음을 고정한다.

## 실제 raw 잔차 정칙성과 density 접합은 별개다

원래 leading/order-one의 같은 본문·입력 해시 정리를 연결하면, zero 분기로
감싸기 전의117045는 양의 반경에서 공동 C-infinity이다. 실제
L=1-2h eta²는 |eta|<=1,0<h<1/16에서 L>7/8이다. 따라서 각 유한한 양의
닫힌 radial box의 고정 raw partial(0,1),(1,1)은 연속이고 유한하다.
eta 끝점에서는 기존과 같은 안쪽 일방 jet의 뜻이다.
별도 raw-regularity 검사기는 이러한 원래 본문과 해시 연결만 승인한다.

이 결론을 supported native1 전체에 적용하려면 실제 안쪽 collar에서
전역 U0/v0와 내부 Picard 식의 제한을 비교해야 한다. 전역 B26 mass와
내부 mass는 서로 다른 binder를 가진다. 외부 분기 wrapper를 줄이지 않은
원래6193/24913의 직접 primitive-body 비교는 통과하지 않았다.
그 실패를 동일성 증거로 바꾸지 않는다. C12와 I1의 실제 support를 사용해
wrapper를 먼저 줄인 후 진짜 mass 적분을 alpha-equivalence로 비교해야 한다.

## 보존형 환원과 진짜 응력 primitive

c=-A,lambda1=2h라 두고 C_i=(X*v_i)_X+Z_(c+lambda_i)U_i라 쓰면

`raw - [T_(c+lambda1)U1 + d_X{X(v0U1+v1U0)-2X*U1_X}
        + Z_(2c+lambda1)(2U0U1+Pi1) - Z_(c-D)Z_c U0]
 = -U1*C0-U0*C1`

이다. 새 exact checker는 이 항등식과 radial primitive 식의 모든 끝점 항을
보존한다. 원고 pp53–54 (5.20)–(5.21)을 실제 소스에 적용하려면
실제 질량·압력-flux moment,연속방정식,부분적분,매개변수 미분 교환이 필요하다.
특히 c-D=-1이라 lower viscosity의 질량 항에도 실제 leading mass와
끝점 flux가 필요하다. 범용 보존식의 대수만으로 실제 moment를0으로 두지 않는다.

양의 반경에서 forward-backward 차이는 정확히
`-(integral_a^b f)/sqrt(2X)`이다. density의 모든 끝점 jet가0이어도 총적분은
양수일 수 있다. checker는 C-infinity compact bump의 양의 mass 반례도
보존하여 이러한 잘못된 승격을 거부한다. 원고의 angular n1에는 별도로
p53 (5.19)의 보상된 leading moment와 p54 terminal collar가 필요하다.

literal scalar의 bounded piecewise integrability,ordinary 도함수,
진짜 응력 primitive 접합,수치 norm 정직성은 모두 별도 계약이다.
이 변경은 ConstantDomains,원본 matrix 또는 원본26의 승격 규칙을 바꾸지 않는다.

## 검증 범위

GitHub workflow의 별도4개 gate는 실제 source binding,83-node live cache 비교,
조건부 보존 대수,원래 raw residual 정칙성의 입력 연결을 검증한다.
모든 gate 결과와 원본 의무 장부는 구분한다. 실행 결과와 파일 해시는
해당 새 run 디렉터리와 후속 보고에 보존한다.
