# 실제 outer amplitude: 원래 9/10–6/5 분기, 7/20 도함수와 복소 tube

이 증명은 원본 `actual-global-source-outer.mjs`의 실제 amplitude 이차식에 적용한다. 원본 SHA-256은 `5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9`, fixed 정의 SHA-256은 `c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b`다. 원본 `selectedRootBracket=['9/10','6/5']`와 `sourceDerivativeFloor='7/20'` 선언을 증명으로 읽지 않고 아래에서 같은 상수를 유도한다. amplitude의 실제 적분·상수·분기는 바꾸지 않는다.

사용자가 제공한 같은 논문의 (A.15), p131 및 (A.19)–(A.20), p133에 해당한다. 에너지는 생산자가 명시한 **전체 reference 에너지**다. 모든 A.2 stage, angular 보정과 무한 power 꼬리가 포함된다. 이를 heat 보상 이후 실제 전역 E² 적분과 동일하다고 주장하지 않는다.

## 1. 실제 복소 영역과 양의 매개변수

원래 T=exp(2^20)+10>128, lambda=exp(-1000T), h=exp(-8002T), BOuter=1000T, Tf=128을 그대로 쓴다. 특히

```
lambda<2^-200,
lambda(T+1)<=2 exp(-999T)<2^-990.                     (1)
```

두 번째 부등식에는 T+1<=2exp(T), T>128, exp(1)>2만 필요하다. 큰 수를 부동소수점으로 표현하지 않는다.

복소 eta의 영역은 `Omega={dist(eta,[-1,1])<1/4}`다. 이때 |Im eta|<1/4, |Re eta|<5/4이므로

```
Re(1+eta²)>15/16, |1+eta²|<3, |eta|²<2,
1/3<|f|<16/15, f=(1+eta²)^-1.                       (2)
```

따라서 log f=-Log(1+eta²)는 Omega 전체에서 하나의 정칙 분기로 정의된다. 실수 theta∈[0,1]에 대해 |f^(2theta)|=|f|^(2theta)다. cutoff의 복소화는 쓰지 않는다. 모든 radial 적분변수와 cutoff 인수는 실수이고 eta만 복소화한다.

## 2. angular 계수의 같은 복소 작은 분기

실제 rInitial,rDecay,rEntry,rBefore는 eta와 독립이며 0<rBefore<13, rEq<2다. bEta=log(2f)에서 |2f|<3, |(2f)^-theta|<2를 (A.10)의 실제 유한 interpolation 식에 넣으면 |rAfter|<16이다. 따라서 원래 angularDebt D에 대해

```
|D|<18 exp(-(1-lambda)(30000T-3))
   <2^12 lambda^30.                                 (3)
```

마지막 단계는 30000lambda T<1과 exp(3)<27을 사용한다. BA,BB와 quadratic bump 적분은 eta와 독립이며, 실제 연속 unit-mass bump에서 1/2<BA,BB<2, Q0,Q1<2^11이다. ratio=exp(2(1-lambda))∈(2,9), 그리고 원래 bq의 D=0 부분 bbase<-7/4다.

원래 소거식 `aq,bq,cq`를 그대로 사용하면

```
aq<2^18, |bq-bbase|<1/4, |cq|<9|D|,
|4aq*cq/bq²|<1/4.                                   (4)
```

Omega에서 정칙 함수 `sqrt(1-z)`는 |z|<1/4에서 양의 실수 축 분기를 갖는다. 실제 angular radical은

```
sqrt(bq²-4aq*cq)=-bq*sqrt(1-4aq*cq/bq²)
```

로 정칙적으로 주어진다. 실수 eta에서 원래 양의 radical과 같으며, 분모 `bq-sqrt(...)`는 0이 아니다. 실제 c1,c2에 (3)–(4)를 대입하면

```
|c2|<12|D|, |c1|<110|D|,
max|cj|<2^20 lambda^30<2^-40.                        (5)
```

이는 정칙 분기와 복소 경계를 직접 만든 것이며 실수 양성에서 복소 radical의 존재를 추론한 것이 아니다.

## 3. 전체 실제 reference 에너지의 정규화

실제 pulse 시작을 yP, 그 log amplitude를 aP라고 한다. 모든 원래 앞 stage를 유지하여 정확히 계산하면

```
yP=T+2+60000T,
yP+2aP=3/5-lambda-120000lambda T=:bP.
```

검증기는 실제 node에서 이 항등식을 확인한다. Dp=exp(bP)f²이고, normalizedE=lambda*totalOuterEnergy/Dp다. pulse stage의 정확한 항은

```
lambda*integral_0^(13/lambda) exp(-2lambda t)dt
             =(1-exp(-26))/2.                       (6)
```

다른 모든 항도 남겨 둔다. 아래 표는 각각의 절댓값을 lambda로 나눈 상계다. 복소 eta에 대해서도 (2)와 (5)를 사용한 같은 상계다. 이 표는 stage를 생략하는 근거가 아니라 전체 합의 triangle inequality다.

| 원래 에너지 부분 | 정규화 후 상계/lambda |
|---|---:|
| reference prefix와 initial | 128 |
| axialDecay | 3T |
| entry | 3 |
| reservedPower | 120000T |
| interpolation | 384 |
| angular의 base energy | 90000T |
| 두 실제 angular energy change | 1 |
| steepen와 steepPower | 5 |
| flatten | 3h^8 |
| wait | 3h^8(16006T+34) |
| terminal | 36h^8 |
| 전체 무한 exterior power tail | 6h^7 |

이를 확인하는 세부 사항은 다음과 같다. reservedPower의 pulse-start 대비 밀도는 exp(2lambda(Tw-s))<=2다. interpolation의 eta 인자는 `|(2f)^(-2sigma)|<=9/4<3`이다. angular 이후에도 같은 3 상계를 쓸 수 있다. 실제 angular change는 원래 두 support 적분이며 각각 unit-mass beta와 beta² 적분을 갖는다. beta² 적분<2^11 및 (5)에서 그 두 항 합이 lambda보다 작다.

steepen에서 reference 에너지 밀도의 로그 증가율은 -2lambda-2(1-lambda)sigma<=0다. steepPower의 실제 길이는 -4logh이므로 그 뒤 밀도에는 정확히 h^8이 붙는다. flatten의 에너지 밀도는 증가하지 않는다. 원래 양의 wait에 대해서는 실제 A.13 식에서

```
1<Qb<7+32008T, rho<=Qp<1, rho=h/256,
wait=log(Qb/Qp)/(1-h)<16006T+34.
```

가 성립한다. 여기서 log(7+32008T)<10T, log256<8과 h<1/1000을 써도 표시된 상계보다 작다. terminal에서는 fo/(1-rho)<2이며 에너지 밀도에 추가되는 제곱 인자가 4보다 작다. 실제 무한 tail은 끝 밀도를 2h로 나눈 정확한 값이다. h^8을 유지하여 lambda*6h^7로 유한하게 제어한다. 무한 꼬리를 0으로 놓지 않는다.

따라서 표의 전체 합은, 여유를 크게 두어

```
|normalizedE-(1-exp(-26))/2|
                   <2^30 lambda(T+1).
|normalizedE-1/2|<2^-27+2^-100<10^-6.                (7)
```

원래 12개 stage, prefix, 두 angular correction과 무한 tail의 총 16개 가산 항을 실행 검증기가 실제 AST에서 모두 확인한다. 각 stage의 에너지 적분 또는 닫힌 지수 적분도 별도로 원래 식과 비교한다.

## 4. 실제 Kb와 두 affine 보정

원래 R0(w)는 0..1/50에서 0<=R0<=w, 1/50..10에서 정확히 w-1/100이며, 10..11에서는 그 양의 값에 0..1 cutoff를 곱하고 11 이후는 0이다. 따라서

```
I*=integral_0^infinity exp(-2w)(w-1/100)^2dw
  =1/4-1/200+1/20000=4901/20000.
I*-(1/500000)-56exp(-20)<Kb<I*+1/375000.
244/1000<Kb<246/1000.                                (8)
```

하계의 처음 오차는 길이 1/50와 제곱 상계 1/10000의 곱이고, 끝 오차는 원래 닫힌 primitive에서 56exp(-20)보다 작다. 상계의 처음 오차는 integral_0^(1/50)w²dw=1/375000다. 실제 Kb는 세 원래 support 구간 적분 전체다.

두 incoming은 각각 실제 Mshape<=4exp(T-10), Jshape<128exp(T)를 갖는다. (2)의 더 정확한 직사각형 경계 |eta|²<13/8, |1+eta²|<21/8에서 `(13/8)(21/8)²<16`이므로 |eta/f|<4다. 이를 넣어도 pulse 중심 이전에 남는 다른 지수 감쇠가 exp(-T)보다 작다. 두 원래 slope·중심 곱은 각각

```
6.5/lambda-14.5+3lambda,
6.5/lambda-27.5+6lambda
```

이므로 두 incoming 절댓값은 exp(-6/lambda)보다 작다. 실제 연속 2×2 행렬의 역수는 이미 독립적으로 <16/lambda로 증명되었다. 따라서

```
max|affineConstant_j|<exp(-5/lambda).                 (9)
```

원래 perAmplitude는 w∈[0,11]인 전체 compact main pulse 적분이다. 원래 s_i>=.49, R0<=11, exp(3s_i)<5를 사용하면

```
|perAmplitude_i|<(605/lambda) exp(-.98/lambda)
                 <(800/lambda) exp(-.9/lambda).
max|affineAmplitude_j|<(12800/lambda²)exp(-.9/lambda)
                       <exp(-1/(2lambda)).            (10)
```

마지막 부등식은 t=1/lambda>=2^200에서 `exp(.4t)>(.4t)^4/24`만으로 확인된다. 생산자의 endpoint bump가 main pulse 뒤에 놓이는 정확한 2/lambda 간격이 중요하다. main pulse를 무한 지수 적분으로 대체하지 않는다.

실제 normalizedUPre는 (2)와 실제 U2shape<=16exp(T-10)에서 <1024lambda이고, 실제 양의 두 wi<2048lambda다. (7)–(10)을 실제 세 계수에 넣으면 Omega 전체에서

```
|amp0+1/4|<10^-6,
|amp1|<10^-6,
|amp2-Kb|<10^-6.                                    (11)
```

검증기는 실제 amp0의 **음의** normalizedE/2 항을 포함한 세 원래 계수 식을 직접 확인한다.

## 5. 원래 실수 bracket와 도함수 floor

실수 eta∈[-1,1]에서 (8)–(11)의 더 느슨한 범위

```
-.251<amp0<-.249, |amp1|<.001, .244<amp2<.246
```

를 적용한다. p(a)=amp0+amp1*a+amp2*a²에 대해 정확한 유리수 계산이

```
p(.9)<-.04884<0, p(1.2)>.09916>0,
p'(a)>=2*.244*.9-.001=.4382>7/20,
                                    .9<=a<=1.2      (12)
```

를 준다. amp0<0,amp2>0이므로 원래 양의 radical 식은 유일한 양의 근이며 실제로 원래 [9/10,6/5] 안에 있다. 원래 상수나 source bracket를 바꾸지 않았다.

## 6. 실제 정칙 분기와 CSelected^32 계수 경계

Omega에서 실제 discriminant Delta=amp1²-4amp2*amp0를 Kb와 비교한다. (11)에서

```
|Delta-Kb|<=10^-12+4*10^-6*(1/4+10^-6)
                   +4*Kb*10^-6<1/10000.
Re Delta>6/25, Re amp2>6/25.                         (13)
```

따라서 Delta는 복소 오른쪽 반평면 안에 있다. 그 principal square root는 Omega 전체에서 정칙이며 실수 eta에서 원래 양의 radical이다. 실제 amp2 분모도 0이 아니다. 또한 |Delta|<(.6)^2이고

```
|amplitude|<(.6+10^-6)/(2*.24)<2.                    (14)
```

이다. 이 과정은 실수 양성만으로 복소 분기를 가정하지 않는다.

두 실제 affine 계수, angular 두 계수, 실제 amplitude와 correction 계수는 (5),(9),(10),(14)에 의해 Omega에서 절댓값이 2보다 작다. 실제 pulse polynomial 계수도 1보다 작다. 원래 2×2 inverse, Kb, reference energy 등의 유한 계수는 16/lambda, 4/lambda 또는 고정 수로 제어된다. 필요한 원래 좌표 계수도 Xp<C^11, mConst<C^12이고, 이는 원래 Q>h^-8, log C>Q^200, XR=110(CPstar)^10에서 얻는다. 그러므로 원래 outer coefficient majorant **CSelected^32**는 이 모든 사용 계수를 지배한다.

실수 eta 중심의 반지름 1/8 원판은 Omega 안에 있다. 모든 고정 k에서 Cauchy로

```
|coefficient^(k)(eta)|<=k! 8^k CSelected^32
```

를 얻는다. 이는 원래 `outer(k)`가 요구하는 coefficient tube 1/4, Cauchy radius 1/8, 같은 amplitude bracket와 같은 real derivative floor를 정당화한다. 전체 all-order leading majorant, covariance의 실제 target cone/H, 원본 Guard/Jet/PDE 행의 소거는 이 부분정리만으로 승격하지 않는다.
