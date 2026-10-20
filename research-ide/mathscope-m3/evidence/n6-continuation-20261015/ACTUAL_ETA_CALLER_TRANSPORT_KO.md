# 실제 eta 호출의 유한 목록과 물리적 영역 전달

이 문서는 같은 source header와 Stage3 원본 캐시에 있는 실제 호출을 대상으로 한다. `actual_eta_transport.py`는 원본 생산자를 실행하지 않는다. 원본 전체 스트림의 인증은 같은 클라우드 작업에서 먼저 실행한 고정 Stage3 준비에 속하며, 이 probe는 gzip header를 다시 결속하고 g21의 보수적 전체 조상 136,186개와 registry 84개를 재탐색한다. 자연 급수 533개는 원래 ID·호출 SHA를 모두 비교한다. `actual_expression_partial` 855개를 누락 없이 열거하고 실제 registry의 본문·인자 수·미분 다중지수·자유 좌표를 검사한다. 작은 단위시험은 이 원본 인증의 대체물이 아니다.

## 실제 식에서 얻는 eta 범위

원본 좌표는 R=622802, Z=622803, 물리 시간 T=622804다. 이는 거대한 고정 source 매개변수 `T`와 다르다. 원래 `ActualCommonBandSlowInverse`는 system2이며, 그 본문과 실제 node622820/622824/622829는 다음 식 그대로인지 검사한다.

```
s-Z² exp(2h log s)-T_physical=0, 1/2<=s<=2,
X=R²/(2s), eta=Z exp(-D log s), D=1/2-h.
```

s>0에서 보통 실수 지수 법칙과 2D+2h=1을 적용하면 **같은 실제 근에서**

```
eta²=Z² s^(-1+2h)=1-T_physical/s
```

이다. 따라서 원래 근이 존재하는 물리 chart에서 T_physical>=0이면 |eta|<=1이며, T_physical>0이면 |eta|<1이다. 고정 원본 h=exp(-8002T_parameter)와 T_parameter=exp(1048576)+10에서 0<h<1/16이다. 근에서 방정식의 s 도함수는 1-2h eta²>=1-2h>1/2이므로 양의 물리 시간 내부에서 같은 실제 역함수의 보통 매끄러움도 정당하다. 임의 Z,T에 그 근이 존재한다는 주장은 하지 않는다.

## 실제 native 인자와 frozen 대표점

자연 급수 533개 모두의 내부 eta 인자는 정확히 coordinate2다. 따라서 533개의 서로 다른 eta 수식을 따로 추정하는 문제가 아니다. 출력은 실제 expression0..10의 (X,eta) 인자, eta-bearing registry의 전체 인자 전달, 물리 chart 함수688..693의 R/Z/T 인자, frozen frame의 대표 X/eta/s native 인자를 ID와 SHA로 보존한다. coordinate2 또는 대표 eta coordinate622808 그 자체는 **형식 인자**이며 범위 증명으로 표시하지 않는다.

원래 frozen image는

```
Zrep=etarep exp(D log srep),
Trep=srep(1-etarep²), Rrep=sqrt(2srep Xrep)
```

이다. 이 image의 실제 chart 호출이 같은 etarep를 돌려주는 것은 원래 근의 유일성에 따른다. 실제 대표점 선택은 source의 열린 mesh box와 shell의 interval projection을 사용한다. 비어 있지 않은 **물리적 active** box에서 Sl<Su, 시간 하계 max(0,Tl)를 사용한 두 부호 Z interval 중 양의 폭을 가진 interval의 중점을 선택한다. s↦s-Z²s^(2h)는 그 interval 전체에서 도함수>1-8h>1/2이며, 이어 선택한 시간 interval의 중점 Trep는 엄격히 양수다. 같은 근과 반경 interval 중점에서

```
1/2<srep<2, Xa<Xrep<Xb, |etarep|<1
```

이 따른다. T=0인 active 점도 같은 열린 mesh box와 shell 안에서 작은 양의 시간 점을 갖는다. 경계에만 닿는 box는 active 내부점 전제가 아니며, 원래 lazy guard가 먼저 0을 반환하는지 별도로 결속해야 한다. 새 inventory는 실제 frozen 인자 치환을 보존하여 그 결속을 검사 가능하게 한다. 모든 형식 대표 인자가 실제 선택된 대표점이라는 전역 주장을 자동으로 하지 않는다.

## 압력 반경 적분에서 eta는 변하지 않는다

실제 eta622829의 명시적 자유 좌표는 정확히 {622803,622804}다. 실제 chart 근622820의 인자도 [Z,T_physical]이며 R은 없다. 원래 압력 적분의 양의 고정 반경 구간 전체에서 Z,T를 고정하고 R만 적분 좌표로 바꾸면 s와 eta는 동일하다. 출력은 실제688..693 호출 중 Z/T 인자가 이 두 원래 좌표와 같은 모든 R 치환을 따로 열거한다. 그러므로 더 넓은 원래 압력 J를 작은 radial chart로 줄여서 eta 범위를 얻을 필요가 없다. 다른 반경에서 생기는 분모·cutoff·전체 함수 정칙성은 이 eta 명제로 대신하지 않는다.

## 제외할 수 없는 전제와 남은 실제 연결

T_physical>=0를 제거하면 정확한 반례가 있다. s=1, Z²=101/100, T_physical=-1/100은 같은 원래 방정식을 만족하지만 eta²=101/100이다. terminal heat의 실제 인자 2(1-eta²)/X는 음수이며, 충분히 큰 Laplace 변수에서 1+Zu가 음수가 된다. 이는 임의 음의 물리 시간까지 같은 실수 heat 적분을 확장할 수 없음을 보인다.

후보 band 비율 r>0에서 (R,Z,T)→(sqrt(r)R,r^D Z,rT), s→rs는 eta를 보존한다. 다만 모든 원래 후보 row의 실제 치환과 lazy guard가 rs를 같은 원래 근 구간에 넣는다는 source 연결은 별도다. 물리 시간0의 eta=±1에서는 기존 heat/I2 정리의 한쪽 jet만 사용한다. 열린 음의 시간 근방에 대한 보통 미분을 새로 주장하지 않는다.

이 결과는 실제 원본 식의 eta 항등식, 전체855-call inventory, R-only 치환의 실제 불변성을 제공한다. 임의·음의 T, 아직 해석하지 않은 relabel/대표점/guard 연결, 다른 primitive 정의역 및 전체 g/J의 정칙성은 OPEN이다. 원본 Guard/Jet/PDE 신규 소거는 0이다.
