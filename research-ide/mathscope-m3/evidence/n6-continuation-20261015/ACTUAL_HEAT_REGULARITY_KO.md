# 원본 전체 열 적분의 실제 정칙성

대상은 원본 `actual-continuation-exact-heat.mjs`가 생성한 heatLoss와 같은 source node 71948이다. 이 문서는 자연급수나 Picard 함수의 정칙성을 가정하여 결론을 되돌려 쓰지 않는다. 열 인자 자체에 대한 독립 증명이다. 다른 root·접합·합성 인자의 미증명 조건은 그대로 남는다.

## 원본 식과 정의역

원본의 `h=exp(-8002 T_source)`는 정확한 양수이고 `0<h<1/16`이다. 원본 적분변수 v를 `u=v/(1-v)`로 바꾸면 전체 heat factor는

```
H(a) = 1 - heatLoss(a)
     = Gamma(1+h)^(-1) integral_0^infinity exp(-u) u^h (1+a u)^(-h) du,
a = 2(1-eta^2)/X.
```

Gamma의 분모도 같은 치환에 의해 `integral_0^infinity exp(-u)u^h du`다. 분모는 양수이며 유한하다. 적분의 양 끝점은 improper limit다. v=0이나 1의 원시 log·역원을 실제 끝점 표본으로 평가하지 않는다. 무한 구간의 꼬리를 제거하지 않는다.

원래 slow chart는 `s-Z^2 s^(2h)-T_phys=0`, `X=R^2/(2s)`, `eta=Z s^(h-1/2)`를 사용한다. 따라서 같은 원본 근에서 정확히 `a=4T_phys/R^2`다. `R>0,T_phys≥0`이면 `a≥0`이다. 이 계산은 `s∈[1/2,2]` 같은 축소된 chart 범위를 요구하지 않는다. 실제 선택된 근의 존재와 정칙성은 별도의 조건이다.

## 모든 고정 차수에 대한 적분 미분

모든 정수 n≥0와 a≥0에서

```
d_a^n (1+a u)^(-h) = (-1)^n (h)_n u^n (1+a u)^(-h-n).
```

이는 n에 관한 귀납법이다. `(h)_0=1`이고 한 번 미분할 때 `-(h+n)u`가 곱해진다. 모든 a≥0에 공통으로 절댓값이 `(h)_n u^n` 이하이므로 전체 미분 integrand는

```
(h)_n exp(-u) u^(h+n) / Gamma(1+h)
```

로 지배된다. 0 근방에서는 지수가 h+n>−1이고 무한대에서는 exponential이 모든 고정 거듭제곱을 지배하므로 적분 가능하다. Gamma의 부분적분 점화식에서 그 적분은 정확히 `(h)_n(1+h)_n`이다.

지배수렴과 차분몫의 적분 표현을 반복 적용하면 H는 a>0에서 C∞이며, 각 n차 도함수가 a=0까지 연속인 오른쪽 도함수로 이어진다. 위 상계는 a의 모든 compact 부분구간에 공통이고, 실제로 a≥0 전체에 성립한다. 유한 차수 표본을 무한 차수 결론으로 확대하지 않는다.

특히 `0<H(a)≤1`, `H(0)=1`이다. 양성은 적분 integrand의 엄격한 양성과 분모 양성에서 나온다. 오른쪽 n차 도함수의 끝점 값은 `(-1)^n(h)_n(1+h)_n`이다.

## 전체 양의 반경 구간에서 slow 미분

원래 압력 구간 `J=[sqrt(Xa),2sqrt(Xb)]`에서는 `R≥sqrt(Xa)>0`이다. 이 compact 구간의 조금 큰 양의 반경 근방에서 `4T_phys/R^2`의 모든 고정 차수 slow 도함수는 유계다. H의 위 지배수렴 정리와 유한 연쇄법칙을 합성하면 원본 heat factor는 전체 J에서 R,Z,T_phys의 모든 필요한 고정 차수 도함수를 갖는다. 여기서 Z 도함수가 0이라는 결론은 실제 열 인자 H(4T_phys/R²)에 한하며, 전체 background field의 Z 도함수로 확대하지 않는다. 실제 외부 amplitude와 X 거듭제곱을 곱할 때는 해당 양의 인수의 정의역과 실제 chart 정칙성을 별도로 사용한다.

T_phys=0에서는 연속된 한쪽 시간 미분을 사용한다. `a<0`에는 모든 u에 대해 `1+a u>0`이라는 조건이 깨지므로 이 적분을 음의 시간까지 같은 실수 식으로 확장하지 않는다. 원래 물리 정의역의 한쪽 정칙성과, Guard가 요구하는 열린 근방 또는 상대적 근방의 정확한 의미를 구분해야 한다.

## 실행 결합과 한계

`actual_heat_regularization.py`는 인증된 전체 원본에서 fresh cache를 만든 같은 workflow 안에서 원본 heatLoss와 Gamma의 전체 primitive 조상을 다시 읽는다. 정확한 source node, full improper integral의 끝점, compactification Jacobian, 실제 지수와 인수, slow chart 항등식을 검사한다. 원본 인수와 Jacobian의 변조는 거부한다. 작은 차수의 미분 공식 검산은 회귀 검사이며 위의 모든 n에 대한 귀납·지배수렴 증명의 대체물이 아니다.

이 정리로 heat factor의 전체 양의 반경 구간 정칙성 관문 하나가 해결된다. 원본 `g`의 모든 다른 구성요소, 533개 natural 호출의 실제 적용 영역, Picard 입력, 이전 비선형 root, Volterra 입력, indexed cutoff 접합과 실제 합성은 여전히 각각 검증해야 한다. 원본 Guard/Jet/PDE 신규 소거 수는 0이다.
