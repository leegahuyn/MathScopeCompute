# 실제 완료 leading 장에서 실제 frozen frame까지

이 합성은 원본 초기 장 자체의 양성·정칙성을 실제 frozen 대표점에 적용한다. 대상은 같은 `ActualFinalLeadingF/U` 및 `ActualCommonBandLeading_F/G`다. C.12 이전의 장을 완료 leading 장이라고 바꾸거나, I1/I2 registry의 반지름을 근의 존재 증거로 사용하지 않는다. 전체 g21, 모든 호출자의 정의역, covariance weight 또는 원본 의무 행의 소거를 이 결과로 선언하지 않는다.

고정 정의 SHA-256은 `c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b`, 같은 원본 header 기록 SHA-256은 `f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1`이다. 직접 원문은 사용자가 제공한 166쪽 PDF의 동일 paper pin `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. Appendix A의 (A.10)–(A.23), pp130–134와 Lemma A.6/Proposition A.7, pp138–140, Appendix C의 Lemma C.1/Proposition C.2, pp158–163에 대응한다. 현재 literal 매개변수의 충분성은 각각의 실제 부채·도함수 증명에서 별도로 확인한 뒤 이 문서에서 합친다.

## 1. 실제 I1/I2 근과 같은 장

`ACTUAL_I1_TRUE_DEBT_CONTRACTION_KO.md`는 원래 유한 N의 C.12 변경으로 생기는 다섯 실제 적분을 원래 정규화에 대입한다. 같은 연속 unit-mass 행렬의 실제 역수와 참 부채 경계에서 원래 10^-6 상자의 축약 포함을 얻는다. 따라서 원래 실제 I1 근이 존재하고 유일하며, 같은 실제 반복의 극한이다.

`ACTUAL_I2_TRUE_HEAT_DEBT_CONTRACTION_KO.md`는 전체 무한 Laplace heat 변경의 세 실제 부채를 사용한다. 무한 꼬리를 0으로 바꾸거나 상계 자체를 rhs로 대입하지 않는다. 원래 정규화와 연속 E 행렬에서 같은 원래 10^-6 상자의 실제 I2 근을 증명한다. 이 근은 |eta|<1에서 C∞이며, 모든 고정 한쪽 η 도함수가 ±1까지 연속이다. heat의 음의 인수나 |eta|>1에서 원래 적분을 평가한다는 주장은 없다.

이제 `ACTUAL_REPAIR_SHEAR_PRESERVATION_KO.md`의 정확한 원본 I1/I2 식에 이 두 실제 존재 정리를 적용한다. 그 정리는 원래 lambda와 1/2 폭의 bump를 유지하고 실제 비선형 E의 분모를 포함하여

```
E>0, a>=2+3lambda/2, vs=a+bs^2/a>=a>2
```

를 각 E bump에서 준다. I1의 U bump는 E bump와 만나지 않으므로 그곳 a=2+2lambda다. scalar 반지름을 존재의 근거로 읽는 순환은 없다. 실제 근을 먼저 만들고 그 크기를 보존 정리의 입력으로 사용한다.

## 2. 실제 완료 leading E/F/U의 전체 물리 영역

X>0, |eta|<=1을 대상으로 한다. 실제 E의 각 부분을 합친다.

- 0<X<=Xa: 원래 natural E=sqrt(2X)g Phi, g>0, Phi>=1/4.
- Xa..Ia: 같은 실제 κ 비교가 E>0, a>0, vs>2+1/128을 준다.
- Ia..Ib: 원래 N의 C.12 정리가 E>0, a>0, vs>=2+loopDelta/16을 준다.
- 이후 power/pulse와 interpolation: 원래 slope 및 실제 |eta|<=1에서 a>=2+2lambda이며 E>0다.
- I1/I2 지지: 위 실제 작은 근과 보존 정리로 a>=2+3lambda/2다.
- angular: 실제 두 작은 계수와 radical의 독립 증명에서 E>0, a>2+lambda다.
- steepen/steepPower/flatten/wait: 원래 slope의 전환에서 a>=2+2h다.
- terminal/heat와 그 이후: 실제 전체 Laplace 식과 cutoff 부호에서 E>0, a>2+h/2다.

모든 외부 경우의 literal 부등식과 근의 정의역은 `ACTUAL_OUTER_DOMAINS_AND_REPRESENTATIVES_KO.md`에 증명되어 있다. 이 경우는 원본 Xa부터 terminal 끝 Xb까지 전체를 덮으며, X>Xb에서도 같은 양의 heat 식이 유지된다. 따라서

```
E0>0 for all X>0, |eta|<=1,
a0>0, vs0>2 for Xa<=X<=Xb, |eta|<=1.                 (1)
```

Xa보다 작은 natural 부분에서 vs>2를 이 문서로 주장하지 않는다. 필요한 frozen 대표점은 그 부분에 있지 않다.

모든 접합은 원래 cutoff의 flatness, 실제 같은 endpoint 값·도함수 및 정확한 원본 모멘트 방정식으로 일치한다. 실제 angular/pulse radical은 엄격히 양수이고, 같은 native I1/I2 Jacobian은 실제 축약 부등식으로 가역이다. 따라서 완료 leading F0=E0/sqrt(2X), U0는 X>0, |eta|<1에서 C∞다. heat의 모든 고정 한쪽 도함수도 물리 η 끝점까지 연속이다.

축에서는 finalF의 원래 lazy branch가 g Phi(Lambda X)를 사용하므로 F0는 X=0까지 정칙하다. U0도 원래 natural 함수다. 같은 원래 inner rectangle와 η 복소 tube가 C.12 이전에 끝나므로, 그 영역의 원래 analytic-η 성질은 바뀌지 않는다. 이 사실은 π1 등의 안쪽 계수 문제에서 사용할 수 있으며, 비물리 영역까지 전체 heat를 확장한다는 의미는 아니다.

## 3. 실제 M0, V0/X와 축방향 support

원본 M0는 같은 U0의 원시함수다. B.26의 안쪽 시작값은 실제 core moment이며, 그 자연 접합은 이미 모든 차수에서 일치한다. Xi 이후의 Gi 구간과 복원 구간은 같은 U0의 실제 유한 적분이다. B.8의 첫 모멘트 방정식은 bump 이후 M0=cX를 정확히 복원한다. C.12 이후에는 실제 modulation의 질량 적분을 더하고, I1의 첫 모멘트 방정식이 그 전체 차이를 정확히 지운다. 따라서 원래 `finalM`이 I1 오른쪽에서 원래 preM으로 돌아가는 branch는 같은 함수와 모든 도함수로 접합한다.

이 문단의 원본 식 식별은 `--stream-binding`으로 받는 fresh `MathScope.N6.ActualOrderOnePrimitiveBinding/1`에 의존한다. 이 검사는 원래 `attachActualLeadingStreamPrimitive`를 실행하여 natural average, B26/B34의 전체 적분 이력, B8 첫 실제 근 방정식, C12의 `exp(t)` Jacobian, I1 첫 실제 근 방정식과 양쪽 pulse 모멘트를 보존한 원본 함수 본문을 비교한다. 해당 source audit의 M/U/v root와 실제 I2/frozen 쪽의 M/U/v root도 정확히 같아야 한다. 이 검사는 함수의 정칙성을 가정하지 않는 식·근 방정식 검증이므로 현재 합성과 순환하지 않는다.

pulse의 원래 2×2 연속 모멘트 방정식은 M의 끝값을 정확히 0으로 만든다. main pulse와 끝 bump가 경계 근방에서 flat하기 때문에 U0/M0도 모든 차수에서 0 branch와 접합한다. 따라서 원래 Xv 이후

```
U0=M0=V0=0, partial_X M0=U0.                          (2)
```

이다. heat와 I2는 E만 바꾸므로 (2)의 축방향 함수에 영향을 주지 않는다. 실제 V0/X는 원래 식

```
v0=[2eta U0-2Deta M0/X-d(M0_eta)/X]/L,
L=1-2h eta^2>0
```

으로 주어진다. X>0에서 위 정칙성으로 C∞다. 축 근방에서는 원래 natural average로 M0/X를 계산하여 1/X를 축에서 평가하지 않는다. 그 표현은 X에 정칙이므로 v0도 X=0까지 C∞다. U0,M0,v0에 대해 실제 η 고차 도함수의 크기가 상자 반지름보다 작다는 가정은 없다.

## 4. 실제 대표점에의 정확한 적용

원래 고정 대표점 선택 알고리즘은 실제 active 내부점을 가진 mesh box에서

```
Xa<Xrep<Xb, |etaRep|<1, 1/2<srep<2
```

를 준다. 이 선택의 원래 interval projection·midpoint·monotone root 증명은 outer 문서 §1에 재확인하였다. 확대 ordinary slow domain Xa/2..2Xb를 frozen 대표점 범위와 혼동하지 않는다. active 내부점이 없는 box는 원래 바깥 lazy guard가 먼저 0으로 처리해야 하며, 이 합성은 임의의 unguarded 호출자를 인증하지 않는다.

따라서 (1)의 같은 완료 leading E/a/vs를 원본 `ActualCommonBandLeading_F/G`의 같은 실제 대표점에 대입할 수 있다. 실제 chart는

```
X=R^2/(2s), eta=Z s^(-D),
F=s^(-A-1/2)Fbase, G=s^(-A)Ubase.
```

Z,T를 고정하면 s와 eta는 R과 독립이다. 실제 frozen-frame 대수 증명은

```
R F_R=-a F, G_R/F=bs,
gabs^2=F^2(a^2+bs^2),
lambda0^2=2F^2 a^2(vs-2)/(a^2+bs^2),
c0=-sqrt((vs-2)/2)
```

를 정확한 원본 node에서 확인했다. 따라서 실제 대표점에서

```
F0>0, gabs>0, lambda0>0, c0<0.
```

원래 epsilon은 유한 실수의 exponential로 양수이고, k=ceil(epsilon^-1/2)>=1, ci는 유한 양수 exponential들의 곱이다. 유한 band와 고정 정수 label에서 원래 u도 유한하다. 따라서

```
Bs^2=lambda0/[epsilon k^2(1+u^2)^(3/2)]>0,
Ls=2r0/ci>0.
```

이다. frame의 정확한 fresh-cache 조상 검증은 이 원본 root들이 실제 두 covariance 행렬의 조상임도 확인한다. 이로써 정적 frame의 해당 분모와 radical의 조건부 전제가 실제 완료 leading 장으로 충족된다.

`actual_completed_leading_domains.py`는 postC12/outer/I1/fresh I2/repair/frame/stream-binding의 정확한 원본 정의 및 입력 SHA 연결을 검사한다. I2의 arithmetic-only 영수증, 바뀐 I1 binding 및 다른 M0 root를 각각 거부한다. 실제 최종 F/U root가 frozen-frame이 소비하는 원본 expression:2/3과 같아야 한다. 출력은 이 실제 물리 영역의 E/a/vs 및 frame 정의역 정리다. 전체 covariance cone, 양의 weight와 determinant, 모든 후속 호출자의 실제 guard, 전체 g21/J와 원본 의무 행의 소거는 별도다.
