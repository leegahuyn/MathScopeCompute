# 원래 order-one 본문에서 Picard0 경계의 국소 전달

이 정리는 `ActualFinalOrderOneF/U/VOverX/Stream/Average/Pressure`, 원래
expression5..10의 ordinary AST가 직접 호출하는 Picard0의 인자 정의역을
증명한다. 다른 native 본문의 숨은 의존성이나 전역 physical/mesh 인자
치환은 이 정리의 결론이 아니다. 함수 본문, 상수, guard 또는 원래 행을
바꾸지 않는다.

## 1. 원본의 세 끝점

실제 `actual-continuation-exact-order-one.mjs` 줄44는

```
Xkeep=Xa*exp(t1/64), Xcut=Xa*exp(t1/32)
```

를 정의한다. Picard0의 실제 radialDomain 오른쪽은 a이며
`a²=Xa*exp(t1/16)`이다. 고정 원본 t1=C^-120>0, Xa=4/Lambda,
Lambda=Q^64, Q>2^260이므로

```
0<Xkeep<Xcut<a²<1.
```

마지막 부등식은 t1<1, exp(1/16)<2와 Xa<1/2에서 따른다. 새 checker는
fresh 원본 cache의 Xkeep=28819, Xcut=28823 및 native radialDomain의
primitive AST를 이 정확한 식과 대조한다. 거대한/작은 값을 부동소수점으로
평가하지 않는다.

## 2. 원래 lazy branch가 raw 해를 보호한다

실제 Fraw/Uraw 호출 28834/28835의 인자는 `(X,eta)=(4756,2)`이다.
원래 28837/28839는 `choose(X,Xkeep,Xcut,raw,kappa*raw,0)`이다.
따라서 모든 실수 X>=0에서 raw 부분이 평가되는 위치는 X<=Xcut<a²이다.
X>=Xcut의 zero branch에서는 raw Picard 해를 평가하지 않는다. 선택되지
않은 branch의 수학적 값을 먼저 계산한 뒤 0을 곱하지 않는다.

실제 첫 local moment 호출28854는 binder28853을 radial 인자로 쓴다.
guard28863은 같은 Xkeep/Xcut을 유지하고 적분28864의 실제 구간은
`[0,Xcut]`이다. 다른 moment와 prefix도 동일한 AST 규칙으로 따라간다.
임의의 부호를 가진 적분변수를 0..1이라고 가정하지 않는다. 각 실제
적분의 두 끝점이 주는 폐구간을 그 binder의 범위로 넣는다.

axis-average의 실제 호출29331은 radial 인자29330=`tX`를 쓴다.
실제 적분29332의 binder29329는 t∈[0,1]이다. Stream29334와
Average29336에서 이 average는 outside-left branch X<=Xkeep에서만
필요하다. 따라서 `0<=tX<=Xkeep<a²`이다. 이는 sqrt X의 미분을 축에서
직접 나누는 논법을 사용하지 않는다.

원래 Pi1의 raw 호출50557도 guard50558의 outside-left branch에서만
필요하므로 X<=Xkeep이다. middle branch는 실제 보존형 pressure prefix와
원래 보정들의 본문이고, inner Pi를 전체 Xplus까지 평가하지 않는다.

이 명시적 사례 외의 ordinary 노드도 checker가 같은 규칙으로 모두
추적한다. guard selector가 실제 coordinate일 때만 그 coordinate의
상계를 줄인다. 양의 인자들이 각각 1 이하인 곱은 각 인자의 상계 이하라는
정확한 부등식만 쓴다. 다른 식은 더 느슨한 무한 상계로 남기므로 부당한
radial 제한을 만들어내지 않는다. native Picard 호출에 도달했을 때
radial 인자>=0, 상계<=a² 및 η 인자=원래 formal η가 모두 필요하다.
알 수 없는 직접 xi Picard 호출이나 다른 η 인자는 실패한다.

따라서 이 **직접 국소 호출들**에는 이미 증명된 동일한 B/C1/norm/K 정리의
radial 전제를 재사용할 수 있다. 표기된 η 차수에 같은 Kprecision을 쓰고,
다른 차수에 같은 저장 K를 무조건 사용하지 않는다. 완성된 함수의 다른
native leaf, Ipos 역행렬과 모멘트 접합 정리는 별도 합성 입력이다.

## 3. 전체 압력 구간과의 차이

원래 압력 반경 구간의 실제 끝점633710/633712는
`[sqrt(Xa),2sqrt(Xb)]`이다. 원래 chart에서 1/2<=s<=2이며
X=R²/(2s)이므로 전체 X envelope는 `[Xa/4,4Xb]`이다. 이 구간을 raw
Picard0의 `0<=X<=a²`라고 놓을 수 없다. 예를 들어 s=1,R=sqrt2이면
X=1>a²이고, Xa<1 및 Xb>1 때문에 이 R은 압력 envelope 안이다.

이는 **unguarded raw-domain 재사용 주장**의 반례다. 원래 함수의
반례라고 주장하지 않는다. 실제 source는 앞서 본 lazy cutoff와 외부
완성 branch를 가지고 있다. 전역 정리에는 각 indexed local body의 실제
인자 tuple, 라벨을 고정한 chart map, 압력 적분 경로 전부, 모든 변하는
라벨/nearest-copy 경계의 평탄성을 추적해야 한다.

원래 533 natural 호출과 모든 다른 native 호출의 전체 pressure-J 적용,
전체 g의 joint C1 및 PDE 성분 전체의 소거는 이 국소 정리에서 결론내리지
않는다. 실행 결과도 `wholeJNativeCallerTransportProved=false`와
`wholeGOnJProved=false`, 원래 새 소거0을 보존한다.

## 4. 검증

`actual_picard0_local_transport.py`는 원본 Stage3/header/cache, 동일 numeric
영수증과 compact definition, 원래 order-one 생산자 SHA를 먼저 확인한다.
모든 실제 직접 호출의 source ID/해시와 binder/guard별 증명 상태를 출력한다.
고립된 읽기 복사본에서 raw F guard를 제거하거나, average 인자를 2tX로
바꾸거나, η coordinate를 바꾸면 검증이 실패해야 한다. 원본은 읽기 전용이다.
단위 검증은 signed binder 및 5배 확대 인자도 거부한다. 전체 source 실행은
작은 로컬 파일을 확대 다운로드하지 않고 GitHub의 fresh cache에서 한다.
