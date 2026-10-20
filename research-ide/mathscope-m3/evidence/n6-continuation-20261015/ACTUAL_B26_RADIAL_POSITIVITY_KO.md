# 실제 B.22 reference와 B.26의 E 및 a 양성

이 문서는 `ACTUAL_NATURAL_RADIAL_POSITIVITY_KO.md`의 실제 natural 단조성과 원본 `actual-continuation-exact-pregluing.mjs`의 literal B.22/B.26 적분식에서 다음을 유도한다.

```
referenceSource.Qs≥1/2,
referenceSource.p1=X Qs/L≥X/2                 (모든 X>0),
actual B26 a≥2t1/Lambda>0                    (Xa≤X≤Xi=110),
actual B26 E>0, E⁻¹≤CSelected³.
```

원본 B.22 reference를 실제 B.26 함수와 같은 함수로 놓지 않는다. reference는 B.26 제어식에 들어가는 원래의 입력으로만 사용한다. 실제 B.26의 p2/v_s 전체 경계와 B.34/B.8 이후 C.1 배경은 이 정리의 결론이 아니다.

## 1. literal reference에 대한 균등한 실수 경계

t=Lambda⁻¹, C=CSelected, eta∈I=[−33/32,33/32]로 고정한다. 원본 reference를

```
Fref(X,eta)=g(eta) f(X,eta),
Uref(X,eta)=Ustar(eta)+t q(X,eta)
```

로 쓴다. X≤Xstart=Xa exp(t1)에서는 f=Phi(Lambda X), q=u(Lambda X)이다. Xstart<X<Xend=Xa exp(2t1)에서는 원본 cutoff k22(s)=1−sigma_step((s−t1)/t1)를 사용하여

```
log f=log Phi(4exp(t1))
         +∫_(t1)^y k22(s) ∂s log Phi(4exp(s))ds,
q=u(4exp(t1))+∫_(t1)^y k22(s) 4exp(s)u_Y(4exp(s))ds,
y=log(X/Xa).
```

이후에는 각각 끝점 값으로 일정하다. 0≤k22≤1이고 실제 Phi_Y<0이므로 f는 X에 대해 비증가한다. collar에서는 f가 두 natural 끝점 값 사이에 있다. t1<1/10000 및 `4exp(2t1)<4.1`이므로

```
1/4≤f≤2,       |f−1|≤2chi+tQ⁹                           (1)
```

가 모든 X≥0에서 성립한다. 두 경계에서 cutoff가 평평하므로 reference의 모든 혼합 미분도 접합된다. 실제 reference moment는 따라서 동일한 Fref/Uref의 축부터 시작하는 다섯 적분이고, 앞의 보존식 증명에 사용한 FTC 미분을 만족한다.

필요한 η 경계도 실제 natural 노름에서 직접 얻는다. `DeltaPhi=Phi−f0(chi Y)`에 대해

```
|DeltaPhi_eta|, |DeltaPhi_(Y eta)|≤tQ⁹,
|Phi_Y|<1/2,
|Hstar Phi_eta|≤41chi+10tQ⁹,
|Hstar Phi_(Y eta)|≤17chi+10tQ⁹.                           (2)
```

첫 줄은 기존 `||DeltaPhi||≤tQ⁸/2`와 b(n,1)의 정확한 평가합을 사용한다. 두 번째 가중 경계는 `Hstar chi_eta=2Hstar_eta chi(1−chi)`, |Hstar_eta|<20, |f0′|≤1/4, |f0″|≤1/24 및 |Hstar|<10에서 따른다. f0″의 상계도 0≤chiY≤4.1에서 감소하는 교대 미분급수로 얻는다.

Phi≥1/4를 사용하면

```
|Hstar ∂eta log Phi|≤164chi+40tQ⁹,
|Hstar ∂eta(Y Phi_Y/Phi)|≤2¹¹chi+2⁹tQ⁹.
```

두 번째 줄은 Y≤4.1 및 (2)에 직접 몫 미분을 적용한 결과이다. literal reference의 위 적분식을 η로 미분한다. 적분길이는 t1<1이고 cutoff는 η와 독립이다. f≤2를 곱하면 넉넉하게

```
|Hstar f_eta|≤2¹⁴chi+tQ¹³.                               (3)
```

이다. 같은 적분식에서 가중하지 않은 경계도 얻는다. |chi_eta|≤40/sigma≤40Q와 (2)로 natural |Phi_eta|,|Phi_(Y eta)|<Q²이다. 몫 미분 및 길이 1 이하의 reference 적분에서

```
|f_eta|≤Q⁵.                                               (4)
```

이다. q에 대해서는 natural 평가 `|u|<2Q`, `|u_Y|<Q`, `|u_eta|,|u_(Y eta)|<Q²` 및 같은 적분길이로

```
|q|≤7Q<Q²,       |q_eta|≤6Q²<Q³.                          (5)
```

를 얻는다. 이 경계들은 reference가 상수로 된 X>Xend에서도 그대로 유지된다. reference의 η 미분이 0이라고 놓지는 않는다.

## 2. 원본 source.Qs의 정확한 분해

원본 다섯 reference moment에서 M_X=Uref이며, barq=X⁻¹∫_0^Xq(s)ds라 쓰면

```
W=Wstar+tWq,
Wq=−2D eta barq−d barq_eta,      |Wq|≤Q⁴.
```

Angular_X/(2Xg)를 실제 sourceFromState의 식으로 전개하면 정확히

```
(C0+Lambda L chi) f−Hstar f_eta−d q zeta f
  +t[−d q_eta f−d q f_eta+2(h−D)eta q f],                  (6)
C0=(1−h)−4d+2(h−D)eta Ustar
   =2Wstar−Bneg,
Bneg=−3+h−j eta.
```

여기서 음의 원본 zeta 부호에 의한 `Hstar zeta=−L chi`를 사용했다. q zeta 항에는 t가 없고 실제 식에 그대로 남아 있다.

다음을 정의한다.

```
Af=∫_0^X s f(s)ds/[X² f(X)],
Bf=∫_0^X s f_eta(s)ds/[X² f(X)].
```

원본 `Qs=−W+Angular/(2X²Fref)`에 (6)을 축부터 적분하면

```
Qs=−Wstar+(C0+Lambda L chi)Af−Hstar Bf+Err−tWq.            (7)
```

Err는 (6)의 `−d q zeta f` 및 t 대괄호의 같은 가중 적분이다. 식 (7)은 실제 reference 이력 전체를 유지한다.

## 3. Qs의 엄격한 양성

f가 비증가이고 1/4≤f≤2이므로

```
1/2≤Af≤4,
|Af−1/2|≤8chi+4tQ⁹.                                     (8)
```

두 번째 줄은 적분 안의 f(s)−f(X)에 (1)을 적용한다. 모든 가중 적분의 절댓값은 integrand의 supremum의 2배 이하이다. 따라서 (3)에서

```
|Hstar Bf|≤2¹⁵chi+2tQ¹³.
```

실수 |zeta|≤Qsqrt(chi), (4),(5) 및 |d|≤1에서

```
|Err|≤4Q³sqrt(chi)+tQ⁹
      ≤Q⁴sqrt(chi)+tQ⁹.
```

실제 |C0|≤50, L>99/100, −Bneg/2≥1이다. (7)을 Af=1/2+(Af−1/2)로 나누고 위 경계를 넣으면

```
Qs≥1+(Lambda/4)chi−(400+2¹⁵)chi
        −Q⁴sqrt(chi)−tQ¹⁴
  ≥1+(Lambda/8)chi−Q⁴sqrt(chi)−tQ¹⁴.
```

정확한 완전제곱 부등식

```
Q⁴sqrt(chi)≤(Lambda/16)chi+4Q⁸/Lambda
```

을 사용하면

```
Qs≥1+(Lambda/16)chi−tQ¹⁴−4tQ⁸≥1/2.                     (9)
```

마지막 비교는 t=Q⁻⁶⁴, Q≥2²⁶⁰에서 직접 성립한다. Qs가 양수인 이유를 원본 metadata나 cone 이름에 의존하지 않았다. L≤1이므로 `p1ref=X Qs/L≥X/2`이다.

같은 식의 절댓값 경계는 `|Qs|≤4Lambda+Q⁴+2¹⁷<Q⁶⁵`를 준다. 예를 들어 |Wstar|≤23, |C0|Af≤200, ΛLchiAf≤4Lambda이며 나머지 항은 위에서 이미 제어했다. 따라서

```
0<p1ref≤2XQ⁶⁵.                                          (10)
```

## 4. 실제 B.26 E와 a

원본 B.26의 log 반경 도함수는 직접

```
a_B26=−2X(F_B26)_X/F_B26
     =(1−blend)kappa p1ref+(4/5)blend.
```

0≤blend≤1, kappa≥kappa0=t1, X≥Xa=4/Lambda이므로 (9)에서

```
a_B26≥min(2t1/Lambda,4/5)=2t1/Lambda>0.
```

특히 `a_B26⁻¹≤Lambda/(2t1)<C¹²²<S`이다. F_B26의 시작값 gPhi(4)는 양수이고 이후는 실제 실수 적분의 지수함수이므로 F_B26와 E_B26=√(2X)F_B26는 양수이다.

역수의 정량 경계도 얻을 수 있다. kappa=t1인 구간은 y≥t1이고, 0≤y≤t1에서는 kappa≤1이다. 실제 Lambda=Q⁶⁴>8이므로 Xa=4/Lambda<1/2이다. 이 사실과 t1<1/10000에서

```
∫_(Xa)^(110) kappa(X)dX
 ≤Xa(exp(t1)−1)+110t1<111t1.
```

blend는 X>100에서만 0이 아닐 수 있다. (10)에 의해

```
∫_0^log(110/Xa) a_B26 dy
 ≤222Q⁶⁵t1+(4/5)log(110/100)<1.
```

여기서 t1=C⁻¹²⁰, C>Q²⁰⁰이므로 첫 항은 1/4보다 작고, log(11/10)<1/10이다. 따라서

```
g/8≤gPhi(4)exp(−1/2)≤F_B26≤gPhi(4)≤2g.
```

기존 g≥C⁻²와 X≥4/Lambda에서 `E_B26⁻¹≤C³`이다. 또한 (10)에서 a_B26<Q⁶⁶<C이다. 전체 B.26 구간에서 실제 E/a의 양성 및 필요한 유한 상계·역수 경계가 도출되었다.

## 적용 경계

원본 κ, blend, reference 몸체의 동일성은 성공한 `ACTUAL_NATURAL_B26_BINDING.json`에 결합한다. 이 정리는 실제 natural 정칙성과 단조성 및 같은 원본 reference 적분 이력을 사용한다. 원본 B.26가 reference와 같다고 가정하지 않는다.

실제 B.26의 U와 moment η 미분까지 수치 경계를 내어 p2/v_s<S를 확인하는 단계, B.34와 B.8 복구구간, C.1 두 collar의 v_s>2는 별도로 남는다. 따라서 전체 C.1 정칙성 적용과 원본 Guard/Jet/PDE 수는 이 문서에서 변경하지 않는다.
