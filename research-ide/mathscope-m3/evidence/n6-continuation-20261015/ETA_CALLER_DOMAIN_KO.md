# 실제 natural/heat 호출의 eta 영역과 남은 source 결합

eta node2라는 사실만으로 모든 실제 호출의 eta 범위를 결론내릴 수는 없다. 원래 chart는 source-global-band.mjs의 몸체 그대로

```
s-Z^2 s^(2h)-T=0,  1/2<=s<=2,
X=R^2/(2s), eta=Z/s^D, D=1/2-h
```

이다. 여기서 T는 실제 coordinate622804이며, 거대한 고정 매개변수 T와 구분한다. 같은 근에서 정확히

```
T=s(1-eta^2)
```

가 따른다. 따라서 원래 물리적 image의 T>=0이면 |eta|<=1이다. 원본 pressure 적분은 R만 적분 변수로 바꾸고 Z,T를 고정한다. s의 native 인수 [622803,622804]도 R과 독립적이므로 그 적분 전체에서 eta는 동일하다. 더 넓은 원래 압력 반경 J를 좁은 chart로 대체할 필요가 없다.

이 전제는 원본 source-global-current.mjs의 referenceChart에서 T>=0으로, source-global-band.mjs에서는 s와 eta∈[-1,1]의 image로 명시되어 있다. 그러나 실제 indexed row의 executable guard는 shell, mesh, band offset만 검사한다. 독립적인 T>=0 분기를 발견한 것은 아니다. 그러므로 이 영역 증명을 임의의 R,Z,T 전체로 확대하지 않는다. 원래 Guard의 양화 영역에 물리적 image 전제가 포함되는지 최종 적용에서 보존해야 한다.

그 전제를 제거하면 실제 장애가 있다. s=1, Z=sqrt(101/100), T=-1/100은 원래 근 방정식을 정확히 만족하고 eta^2=101/100이다. 실제 terminal heat 인수 2(1-eta^2)/X는 음수이며, 충분히 큰 Laplace 변수 u에서 1+Zu가 음수가 된다. 이 점에서 같은 실수 적분에 대한 열린 음의 시간 확장은 사용할 수 없다.

## frozen 대표점의 정확한 양수 시간

원래 source-global-representative.mjs의 executable projection을 독립 검토했다. 비어 있지 않은 active open box에서는 Sl<s<Su이고, 시간 box의 양의 내부에서 Tl0<T<Tu다. T=0인 active 경계점도 같은 열린 mesh box와 shell 안에서 작은 양의 시간 점으로 옮길 수 있다. F_s>1-8h>1/2이므로 s를 조금 바꾸면 된다.

실제 선택은 Z box를

```
(Sl-Tu)/Sl^(2h) < Z^2 < (Su-max(0,Tl))/Su^(2h)
```

의 두 부호 interval과 교차시킨 뒤 양의 폭을 갖는 구간의 중점을 택한다. 제곱 하계가 음수이면 단일 점0을 제외해도 열린 비어 있지 않은 교차구간이 사라지지 않는다. |Z|^2<2^(1-2h)와 s∈[1/2,2]에서 F_s>1-8h>1/2이다. 따라서

```
[max(max(0,Tl),F(Sl)), min(Tu,F(Su))]
```

는 양의 폭을 갖고, 원래 선택한 T_rep 중점은 엄격히 양수다. 같은 실제 monotone 근 s_rep에서 eta_rep^2=1-T_rep/s_rep<1이다. 이어 radius interval의 중점을 택하면 Xa<X_rep<Xb이며 같은 box 안이다. 이 증명은 mesh를 유한 개 표본으로 검사하지 않는다. 단, 실제 모든 호출 전에 active-box guard가 실행된다는 source 결합은 별도로 필요하다.

## 원래 후보 band 치환과 eta 불변성

양의 band 비율 r에서 source의 slow 치환은

```
(R,Z,T)->(sqrt(r)R,r^D Z,r T), s->r s
```

이다. 2D+2h=1이므로 바뀐 방정식의 좌변은 정확히 r배이고, eta'=r^D Z/(rs)^D=eta다. 실제 band guard가 해당 s'를 원래 [1/2,2] image 안에 두고 원래 근의 유일성을 적용한다면 모든81개 후보에서 eta 범위가 보존된다. 이 때도 guard를 실행하기 전에 후보의 잘못된 root를 평가해서는 안 된다.

## 끝점과 남은 범위

early natural/B.26의 확대 구간 I=[-33/32,33/32]는 원래 물리 eta와 대표점 eta를 여유 있게 포함한다. 반면 full terminal heat는 |eta|<=1에서만 사용한다. 물리 시간0에서 eta는 ±1이며, heat와 I2의 모든 고정 차수 jet은 한쪽으로 연속이다. 고정된 T=0에서 Z를 조금 바꾸는 방향은 같은 chart에서 eta=±1을 유지한다. 따라서 g_Z를 위한 접선 미분과 상대적 T>=0 연속성은 음의 heat 인수 확장을 요구하지 않는다. 원래 Guard가 보통의 열린 음의 시간 근방을 요구한다면 그 의무는 별도로 남는다.

이 문서는 원래 caller의 해석적 geometry를 명시하며, 아직 전체 533개 native/body parameter 치환을 독립 전개한 receipt가 아니다. 특히 fixed 대표점의 실제 root IDs와 외부 guard 순서, 모든 relabel row의 실제 치환, 전체 g의 원래 물리 영역 및 pressure J를 함께 묶는 마지막 source 적용이 남는다. 원본 Guard/Jet/PDE 소거 수는 변경하지 않는다.
