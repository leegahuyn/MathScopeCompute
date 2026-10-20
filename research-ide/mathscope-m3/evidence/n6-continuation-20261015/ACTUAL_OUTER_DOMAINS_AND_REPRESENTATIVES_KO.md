# 실제 frozen 대표점의 범위와 outer/heat의 정의역·양성

원본 frozen 대표점을 모두 C.1 구간 안에 있다고 가정하면 안 된다. 실제 대표점은 원래 Xa부터 전체 terminal heat 끝점 Xb까지 움직인다. 이 문서는 정확한 경우를 나누고, 남아 있던 실제 angular 두 근과 pulse amplitude의 radical/분모, terminal heat의 E와 a 양성을 증명한다.

대상은 고정 정의 SHA-256 `c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b` 안의 원래 outer 전체 3,311-node 프로그램이다. 그 전체 배열은 이미 작은 `NATIVE_PAYLOADS.json`에 포함되어 있다. `actual_natural_proof.kernel-probe.mjs`는 원본 degree-0 생산자를 실행하여 이 전체 outer와 원래 fixed 정의가 같음을 확인한다. 새 `actual_outer_domains.py`는 그 실제 node에서 angular branch, 두 모멘트 방정식, pulse의 연속 행렬·해·amplitude·음의 실제 에너지 항·정규화를 직접 대수적으로 확인한다. 단순한 `smallRootRadius` 선언은 경계로 쓰지 않는다.

사용자가 제공한 원본 `navier-stokes.pdf`는 166쪽이며 SHA-256이 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다. 이는 실제 `G.source.sourcePaperSHA256`와 정확히 같다. 아래 쪽수는 PDF와 인쇄 쪽수가 일치함을 확인한 원문 쪽수다. 논문의 “충분히 작게/크게 선택한다”는 문장만으로 현재 literal 상수가 인증되었다고 추론하지 않고, 그 동일 식에 현재 상수를 대입하는 부등식을 아래에서 추가한다.

| 이 증명의 적용 | 같은 원문 근거 |
|---|---|
| profile interpolation와 angular 압력 중립 두 방정식 | §A.2, (A.10)–(A.11), p130; §A.3의 작은 근 논증, pp131–132 |
| pulse의 실제 2×2 모멘트 복구와 amplitude 이차식 | (A.15), p131; (A.19)–(A.20), p133 |
| 원래 음의 압력 datum와 도함수 부호 | Lemma A.5, (A.21)–(A.23), pp133–134 |
| terminal cutoff와 wait | (A.12)–(A.13), p130; (A.16), p132 |
| 전체 Laplace heat 인자와 모든 고정 도함수 | Lemma A.6, (A.32)–(A.38), p138 |
| 실제 heat blending와 앞선 세 bump 보상 | Proposition A.7, (A.39)–(A.43), pp139–140 |
| finite-N 정확한 주항과 radial correction | Proposition C.2, (C.11)–(C.17), pp161–163 |

## 1. 원래 고정 대표점 선택은 내부점을 준다

원본 `source-global-representative.mjs`는 현재 점을 반올림하지 않는다. 고정 ell과 정수 mesh label로부터 반경·축·시간의 열린 box를 만들고, 실제 active 내부점이 있는 box에서 다음 선택을 한다.

```
sLower=max(1/2,max(0,Rl)^2/(2Xb)),
sUpper=min(2,Ru^2/(2Xa)).
```

active 점은 Xa<X<Xb와 R>0을 갖기 때문에 Ru>0, sLower<sUpper다. 시간 box와 `F(s,Z)=s-Z^2 s^(2h)`의 교차조건을 Z^2의 두 경계로 투영한다. 원본이 만든 양·음 sign interval 가운데 너비가 양수인 것을 택한 midpoint Z는 교차의 내부다. 아래 제곱 경계가 음수이면 0 한 점을 제외해도 열린 교차가 사라지지 않는다. `F_s>=1-8h>1/2`로 인해 시간 교차도 비어 있지 않은 열린 구간이고, 그 midpoint T와 원래 monotone root는

```
Trep>0, 1/2<srep<2.
```

를 준다. 이어 원본 반경 선택은 `(Rl,Ru)`와 `(sqrt(2Xa srep),sqrt(2Xb srep))`의 교차 midpoint이므로

```
Xa<Xrep<Xb,
etaRep^2=Zrep^2*srep^(-1+2h)=1-Trep/srep<1.             (1)
```

이다. T=0에서만 닿는 box라도 실제 active 내부점의 양의 시간 이웃을 같은 box 안에서 사용할 수 있다. 경계에만 닿아 active 내부점이 없는 경우는 원래 바깥 lazy guard가 먼저 0을 반환해야 하며, 대표점이나 root를 평가할 수 있는 허가로 삼지 않는다. 모든 max/min·sign 선택·midpoint는 label에만 의존하여 느린 R/Z/T 미분에서는 상수다.

ordinary slow point의 확대 범위 Xa/2..2Xb와 이 frozen 대표점 범위를 구분한다. (1)은 대표점의 성질이다. 동적 frame의 느린 rank 분모와 후속 full-field 정칙성은 각각의 실제 증명으로 처리한다.

## 2. 원래 대표점 구간의 경우

| 실제 X 위치 | E/a/vs의 근거 |
|---|---|
| Xa<=X<=Ia=Xa exp(t1/8) | natural/B.26 κ 비교에서 vs>2+1/128; 아래 설명 |
| Ia<=X<=Ib=XR exp(T+3) | 실제 유한 N C.12 정리: E>0, a>0, vs>=2+delta/16 |
| Ib 이후 reserved power, I1/I2 지지 밖 및 pulse | a=2+2lambda, 따라서 vs>=a>2 |
| 실제 I1/I2 bump 지지 | 실제 작은 근의 존재와 repair shear 정리를 별도로 결합 |
| interpolation | a>=2+2lambda, 아래 정확한 η 부호 |
| angular | 실제 작은 두 계수의 증명으로 a>2+lambda |
| steepen/steepPower/flatten/wait | 원래 slope의 convex 전환으로 a>=2+2h |
| terminal 및 heat | 실제 Laplace 식에서 E>0, a>2+h/2 |

첫 행에서는 `ACTUAL_C1_ENDPOINT_COLLARS_KO.md`의 κ 증명이 실제로 0<=log(X/Xa)<=t1/7 전체에서 성립한다. natural vs>2+1/64, κ>=1-2^-40 및 E 비율의 같은 적분 부등식을 적용하면 된다. 따라서 Xa..Ia의 모듈레이션하지 않은 구간도 포함된다. Xa보다 작은 slow 영역에 이 전단 하계를 주장하지 않는다.

interpolation의 실제 로그는 `alpha s-sigma(s/Tf)log2+(1-sigma(s/Tf))log f`, alpha=-1/2-lambda, f=(1+eta^2)^-1이다. 따라서

```
a=2+2lambda+(2/Tf)sigma'(s/Tf)log(2/(1+eta^2))
 >=2+2lambda, |eta|<=1.                               (2)
```

이다. 이 부호를 더 넓은 η 구간 전체에 잘못 적용하지 않는다. 대표점은 (1)로 원래 |eta|<1 안에 있다.

## 3. 실제 angular 작은 근의 독립 경계

원본 `actual-global-source-outer.mjs`의 a0=1-lambda, b0=-1-2lambda를 이 절에서만 사용한다. 0<lambda<2^-200, 0<h<lambda다. 원래 rInitial<10, rDecay<10, rEntry<13은 정의된 양의 유한 적분에서 exp(1)<3을 대입하여 얻는다. rBefore는 rEntry와 rEq=1/a0<2의 convex 결합이므로 0<rBefore<13이다.

원래 bEta=log(2f)∈[0,log2], Tf=128이므로

```
rAfter=exp(-a0 Tf+bEta)
 [rBefore+integral_0^Tf exp(a0 s-bEta sigma(s/Tf))ds]
 <26exp(-64)+2/a0<5.
```

따라서 실제 angularDebt D의 절댓값은

```
|D|<7 exp(-(1-lambda)(30000T-3))<1024 lambda^30.        (3)
```

여기서 exp(1000T)>=(1000T)^2/2에서 lambda*T<=2/10^6이고, 따라서 30000lambda*T<1이다. 모든 긴 구간의 실제 감쇠를 유지했다.

원래 beta=(10/3)sigma'((10/3)s+1/2)는 양의 unit-mass bump이며 지지는 [-3/20,3/20]다. |sigma'|<=256, |sigma''|<2^16에서 beta<=1024, |beta'|<2^20이다. 실제 BA,BB는 [1/2,2], ratio=exp(2a0)<9이고 ratio>2다. 실제 제곱 bump 적분 Q0,Q1는 2^11 미만이다.

원본의 정확한 소거 식은

```
target=D/BA, ratio=A01/A00,
aq=Q0 ratio^2+Q1,
bq=A11-A10 ratio-2Q0 target ratio,
cq=A10 target+Q0 target^2,
c2=-2cq/(bq-sqrt(bq^2-4aq cq)), c1=target-ratio c2.
```

BA,BB와 exp(2b0)<1/4에서 A11-A10 ratio<-7/4다. (3)을 넣으면

```
aq<2^18, bq<-1, |cq|<9|D|,
bq^2-4aq cq>1/2,
|c2|<18|D|, |c1|<164|D|<2^8|D|
                         <1024lambda^29.              (4)
```

이로써 실제 radical과 분모가 잘 정의되며 원래 작은 분기는 η의 열린 근방에서 C∞다. D=0도 분모가 음수라 문제가 없다. 검증기는 실제 몸체에서 c1,c2의 식과 첫 선형 방정식 및 두 번째 이차 방정식을 확인하고 branch 부호 변조를 거부한다.

원래 angular E는 base E에 `B=1+c1 beta1+c2 beta2`를 곱한다. 두 bump는 서로 만나지 않으므로 (4)에서 B>1/2, |B_y|<2^30lambda^29다. 따라서

```
Eangular>0,
aangular=2+2lambda-2B_y/B>2+2lambda-2^32lambda^29
                                      >2+lambda.       (5)
```

실제 두 모멘트 방정식 때문에 원래 angular 압력 중립성도 유지된다. A.21에서 이 bump를 빼고 계산한 datum을 다른 압력으로 바꾸지 않는다.

## 4. 실제 pulse amplitude의 radical과 분모

여기서는 amplitude가 생산자에 쓰인 [9/10,6/5] 안에 있다는 선언을 가정하지 않는다. 정칙성에 필요한 실제 amp0<0,amp2>0를 직접 증명한다.

원래 k는 0<=k<=4, 지지의 끝은 T-11이다. 따라서 Mshape<=4exp(T-10), U2shape<=16exp(T-10), Jshape<128exp(T)다. 실제 pulse 시작 yP=T+2+60000T, 길이 L=13/lambda, 첫 중심 L-3이며 원래 두 양의 slope는 1/2-lambda, 1/2-2lambda다. 원본 incoming 두 행의 지수에 이 실제 값을 대입하면 각 incoming의 절댓값은 exp(-6/lambda)보다 작다. 예를 들어 두 center 지수는 각각 6.5/lambda-14.5+3lambda 및 6.5/lambda-27.5+6lambda이므로 6/lambda보다 크고, 나머지 원래 prefactor 지수는 30000T보다 크다.

연속 pulse 행렬은 두 행이 `[Bi,Bi exp(2si)]`, 1/2<Bi<2다. 두 slope 차이는 lambda이므로

```
|det|=B0 B1 exp(2s1)(exp(2lambda)-1)>lambda/2,
||A_pulse^-1||_infinity<16/lambda<1024/lambda.
```

역수 경계는 determinant 하계만으로 추론하지 않는다. E0=exp(2s0), E1=exp(2s1)라 하면 E0/E1=exp(2lambda)<3이다. 실제 inverse 첫 행의 절댓값 합은 `[1/B0+exp(2lambda)/B1]/[exp(2lambda)-1]<4/lambda`, 둘째 행은 `[1/B0+1/B1]/[E1(exp(2lambda)-1)]<2/lambda`다. 따라서 표시한 더 느슨한 16/lambda 경계가 성립한다.

따라서 원본 affineConstant의 절댓값은 exp(-5/lambda)보다 작다. 이는 exp(1/lambda)>1024/lambda에서 나오며, lambda^-1>2^200과 exponential 2차 항만으로 충분하다. 실제 matrix와 inverse solve를 작은 원본 node에서 직접 확인한다.

실제 amp0는 정확히

```
amp0=normalizedUPre-(1/2)normalizedE
              +w0 affineConstant0^2+w1 affineConstant1^2.
```

원본의 η·Pstar·logA 정규화를 그대로 대입하면 normalizedUPre<16lambda<1/64다. 실제 양의 제곱 bump 가중치는 wi<2048lambda이므로 두 제곱 항의 합은 4096lambda<1/64다.

전체 실제 outer E^2 적분의 pulse 구간만 보아도

```
normalizedE >=lambda integral_0^(13/lambda) exp(-2lambda t)dt
             =(1-exp(-26))/2>1/4.
```

angular 보정까지 포함한 totalOuterEnergy는 실제 양의 제곱 적분이다. 다른 구간을 음의 에너지로 바꾸지 않는다. 그러므로 실제 amp0<-3/32다.

실제 amp2=Kb+sum wi affineAmplitude_i^2이며 Kb>0다. Kb의 중간 항은 정확히 `integral_(1/50)^10 exp(-2w)(w-1/100)^2 dw>0`이다. 원본에 사용된 닫힌 primitive의 미분을 검증기가 확인한다. 모든 나머지 affineAmplitude 적분은 유한하고 pulse 행렬 분모는 위에서 0이 아니다. 따라서

```
amp2>0, amp1^2-4amp2 amp0>amp1^2>=0,
amplitude=[sqrt(amp1^2-4amp2 amp0)-amp1]/(2amp2)>0.      (6)
```

원래 amplitude와 pulse 계수는 η에 대해 C∞다. U의 main cutoff와 두 bump는 양 끝 근방에서 flat하게 0이다. M의 첫/마지막 값은 같은 실제 두 선형 모멘트 방정식에서 일치하므로 원래 piecewise U/M도 모든 차수에서 접합한다.

## 5. wait 및 실제 terminal heat의 양성

wait의 길이도 선언으로 가정할 필요가 없다. 원래 Q0=(lambda-h)/(1-lambda)>0, Qsteep>0이며 hold 길이는 -4logh=32008T다. 따라서 Qhold>(1-h)32008T, Qb>Qhold/e>1이다. 한편 Qp는 양의 unit-mass sigma' 적분에 rho/(1-rho)를 곱하고 지수는 exp(3) 이하이므로

```
0<Qp<=27rho/(1-rho)<1, rho=h/256.
```

따라서 log(Qb/Qp)>0이며 원래 terminal 시작 Xtail과 끝 Xb는 유한하고 순서가 맞다.

terminal에서는 s=log(X/Xtail), fo=1-rho[1-sigma((s-1)/2)]이고

```
Ecl=Etail exp(-(1/2+h)s) fo/(1-rho),
a_cl=2+2h-2fo_y/fo
    >=2+2h-h/(1-h/256).
```

특히 Ecl>0다. 원래 heat factor는 음이 아닌 인수 Z=2(1-eta^2)/X에서

```
H(Z)=1/Gamma(1+h)*integral_0^infinity exp(-v)v^h(1+Zv)^(-h)dv.
```

원본 heat AST에 대한 별도 검증은 정확히 이 적분과 정규화, 전체 무한 끝점을 확인한다. H>0, H<=1이고, 미분 및 convex tangent 부등식에서

```
0<=1-H<=h(1+h)Z,
0<=H_y<=h(1+h)Z.
```

를 얻는다. 원래 heat cutoff ξ는 0에서 1로 증가하고 실제 최종 E는 `Ecl*F`, `F=1-xi(1-H)`다. 따라서 F>=H이고 `F_y=xi H_y-xi_y(1-H)<=H_y`다. cutoff 도함수 항은 a의 하계를 개선한다. X>=XK=Xtail exp(1/5)>XR>200에서 Z<1/100, h<1/1000이므로 H>1/2 및 H_y/H<4hZ다. 따라서

```
Eheat>0,
aheat=a_cl-2F_y/F
 >=2+2h-h/(1-h/256)-8hZ>2+h/2.                         (7)
```

열 적분의 무한 꼬리를 버리지 않는다. η=±1에서는 Z=0, H=1로 같은 한쪽 경계를 가지며, 실제 frozen 대표점은 |eta|<1이다. 원래 전체 heat 함수의 고정 모든 차수 정칙성은 독립적인 Laplace 적분 지배수렴 정리를 사용한다.

## 결합 범위와 남은 정확한 적용

(1)–(7)은 frozen 대표점이 실제로 방문하는 모든 원본 반경 stage를 분류하고, angular/pulse 및 terminal heat의 원시 분모·radical·E/a 정의역을 증명한다. 실제 I1/I2의 작은 근과 그 지지에서의 shear 보존은 별도 실제 부채 정리를 결합해야 한다. 그 결합 후에는 Xa<Xrep<Xb의 같은 완료 leading 장에 대해 E>0,a>0,vs>2를 원본 frozen-frame 대수 정리에 적용할 수 있다.

ordinary 느린 점의 Xa/2..2Xb 범위, 전체 covariance/weight의 cone과 양의 determinant, 모든 원본 g21 압력 구간까지의 정칙성은 각각의 실제 source 적용을 계속 추적해야 한다. 이 부분정리만으로 원본 Guard/Jet/PDE 소거 수를 변경하지 않는다.
