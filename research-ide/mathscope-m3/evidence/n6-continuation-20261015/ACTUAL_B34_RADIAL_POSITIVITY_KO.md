# 원본 B.34 이동 구간의 E/a 양성과 모든 차수 접합

실제 B.26의 정칙성·E 양성과 역수 경계, 실제 natural 급수의 같은 해를 사용한다. 이 문서는 B.8 복구나 전체 C.1 입력의 완성을 주장하지 않는다.

## 실제 식

`C=CSelected`, `Xi=110`, `Tsh=Q^90`, `y=log(X/Xi)`이고 원본은 정확히

```
Ei=E_B26(110), ellI=log(C Ei), f=(1+eta^2)^(-1),
log E_B34 = -log C + y/10
             +(1-sigma(y/Tsh))*ellI+sigma(y/Tsh)*log f.
```

Ei>0이며 η의 원래 실수 구간 I=[−33/32,33/32]에서 모든 η 미분이 존재한다. 따라서 이 log와 전체 실수 exponential은 잘 정의되고 E_B34>0이다. `a=1−2∂y log E`를 정확히 미분하면

```
a_B34=4/5 + 2 sigma'(y/Tsh)*(ellI-log f)/Tsh.          (1)
```

`actual_b34_binding.mjs`는 변경하지 않은 원본 pregluing 생산자를 작은 규모로 다시 실행하여 Ei, ellI, B.34 식, ideal 식과 두 실제 매개변수를 비교한다.

## cutoff 도함수와 실제 폭

원본 square-seed cutoff의 내부 도함수는

```
sigma'(s)=2 sigma(s)(1-sigma(s)) [s^(-3)+(1-s)^(-3)].
```

0<s≤1/2에서는 `sigma(s)≤exp(4)exp(−1/s²)`이다. exponential 급수의 2차 항에서 `s^(-3)exp(−1/s²)≤2s≤1`이고, `8exp(−1/s²)≤8exp(−4)<1/2`다. 따라서 `0≤sigma'(s)<3 exp(4)<243<256`이다. 반사 대칭으로 나머지 절반에서도 같은 경계이며, 구간 밖과 양 끝에서는 도함수가 0이다. 모든 높은 차수의 flatness도 원래 Gaussian seed의 미분 귀납법과 양의 분모에서 따른다.

실제 Ei는 `sqrt(220) g Phi(4) exp(−1/2 integral a_B26 dy)`다. B.26 증명에서 이 마지막 적분은 0과 1 사이, `1/4≤Phi(4)≤2`이다. 또한 `g=exp(Lambda psi)/C`, `|psi|≤64/sigmaStar²`다. 그러므로 C가 정확히 상쇄된 log에서

```
|ellI|≤64 Lambda/sigmaStar²+4<Q^66.
```

이는 Ei의 메타데이터 상계를 가정한 것이 아니다. 실제 natural 입력과 B.26 적분의 경계다. I에서 `|log f|<1`, `Q≥2^260`이고 원래 폭이 `Q^90`이므로 (1)에서

```
|a_B34-4/5| < 1024 Q^(-24) < 1/20,
3/4 < a_B34 < 17/20.                                 (2)
```

따라서 E는 이 구간에서 증가한다. B.26의 `Ei^(-1)≤C^3`으로부터 `E_B34^(-1)≤C^3`이다. `Ei<30`, `0≤y≤Q^90`과 원래 `log C≥Q^200`을 적용하면 `E_B34<C^2`도 얻는다. 이 경계들은 같은 원본 식 전체에 대한 것이다.

## 두 실제 접합

원본 B.26의 terminal blend는 `X≥100 exp(2t1)`에서 1이다. `t1<2^(-120)`이므로 이 구간은 Xi=110보다 먼저 시작한다. 따라서 Xi의 근방에서 원래 B.26는 `a=4/5`, 즉 `E=Ei(X/110)^(1/10)`이다. B.34의 cutoff가 y=0에서 flat하므로 바로 이 같은 power와 모든 반경·η 혼합 차수에서 일치한다.

오른쪽에서는 cutoff=1이고 원래 `XR=110(C Pstar)^10`이므로

```
C^(-1)(X/110)^(1/10)f
 = Pstar f (X/XR)^(1/10) = E_ideal(X).
```

이는 log 양수 인수의 실수 거듭제곱 등식이다. cutoff가 y=Q^90에서 flat하므로 이 실제 ideal profile과도 모든 고정 혼합 차수에서 일치한다. 이후 ideal gap에서 E>0, a=4/5이며 E는 계속 증가한다. B.8 bump가 나타나는 구간의 보정은 별도로 검증해야 한다.

검증기의 기호 계산은 실제 log 도함수·두 끝점·원래 폭에 대한 정확한 유리수 흡수를 확인한다. 모든 차수의 접합은 위 flatness 논증이며 유한 표본으로 추정하지 않는다. 원본 Guard/Jet/PDE 신규 소거 수는 0이다.
