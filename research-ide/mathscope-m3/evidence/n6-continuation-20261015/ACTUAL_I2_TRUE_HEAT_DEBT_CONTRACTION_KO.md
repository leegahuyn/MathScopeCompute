# 실제 무한 heat 부채에서 원래 I2 근의 존재를 얻는 증명

이 정리의 η 영역은 **물리적 [-1,1]뿐**이다. 실제 인수
`Z=2(1-eta²)/X`가 음수가 되는 확장을 하지 않는다. 정칙성은 |η|<1에서
C∞이고 ±1에서 각 고정 차수의 연속된 한쪽 jet이라는 뜻이다. 앞선
preheat C1 정리의 확대 η 구간을 I2에 그대로 적용하지 않는다.

원본 `ActualSameN3C2I2Heat`에는 실제 세 무한 heat 적분이 rhs로 들어간다.
다음 증명은 그 적분 자체의 상계에서 원래 10^-6 상자 안의 근을 얻는다.
반지름이나 `heatH9ActualC2DebtBound:true`라는 metadata를 존재 증거로
쓰지 않는다. C0 포함과 Jacobian 가역성이면 실제 매개변수 정칙성에
충분하므로 η 고차 도함수의 작음을 먼저 요구하지 않는다.

## 1. 실제 terminal wait와 tail의 위치

원래 `h=exp(-8002T)`, `lambda=exp(-1000T)`이므로
`0<h<lambda<1/2`, `h<1/100`, `rho=h/256<1/2`이다.
outer 생산자의 wait는

    wait=log(Qb/Qp)/(1-h)

이다. 실제 Qsteep의 초기항 `(lambda-h)/(1-lambda)`와 적분 integrand가
모두 양수이므로 Qsteep>0이다. `hold=-4log h>16`이고
`Qhold=Qsteep+(1-h)*hold`이다. 따라서 실제 flatten 식에서

    Qb>exp(-1/2)*16*(1-h)>198/25>1.

이는 `e<3`, 따라서 exp(1/2)<2, 그리고 h<1/100을 사용한다.
Qp의 integrand는 양수이고, 정확한 step 도함수 질량이 1이므로

    0<Qp<exp(3)*rho/(1-rho)<27/25599<1.

따라서 원래 wait는 양의 유한 실수이다. reservedPower 뒤의 pulse,
interpolation, angular, steepen, steepPower, flatten, wait의 길이도 전부
양의 유한 실수이다. 실제 `Xtail=XR*exp(terminal.start)`와
`XK=Xtail*exp(1/5)`는 그러므로 원래 I2보다 뒤에 있다.

`X0=X0I2=XR*exp(60001T-18)`, `I2Right=X0*exp(5)`는 reservedPower의
끝 `Xp=XR*exp(T+2+60000T)`보다 앞이다. 실제 `XK>=X0>1`이다.

## 2. 실제 tail 진폭의 비교

원본 I2의 η와 독립적인 power 진폭과 정규화는

    e_*=Pstar*exp(-T/2-7/10-lambda/2
                  -(1/2+lambda)*(60000T-20)),
    K=e_*f, f=(1+eta²)^(-1)>=1/2.

실제 terminal의 진폭과 반경은

    Etail=Pstar*exp(terminal.logAStart),
    Xtail=XR*exp(terminal.start),
    eK=Etail*exp(-(1/2+h)/5), XK=Xtail*exp(1/5).

여기에 angular bump의 root 계수나 axial pulse의 amplitude는 들어가지
않는다. 그 보정들은 해당 stage 양 끝에서 사라진다. 원본 stage book의
같은 끝점 `start/end/logAStart/logAEnd`를 그대로 비교한다.

I2부터 terminal 시작까지 각 stage의 `Delta log E + length/2`는 차례대로
`-lambda*length`, `-lambda*Tf-log2`,
`-(1+lambda)/2`, `-hold`, `-(1+h)/2`, `-h*wait` 등의 비양수 항이다.
여기서 pulse와 angular의 항도 각각 `-lambda*length`이다. XK까지의
마지막 1/5 구간은 `-h/5`를 더한다. 따라서 실제 endpoint 진폭은

    eK*sqrt(XK)<=e_*sqrt(X0).

또한 실제 tail에서

    Ecl(X)=Etail*exp(-(1/2+h)*s)*fo(s)/(1-rho),
    s=log(X/Xtail), fo=1-rho*(1-sigma((s-1)/2)).

`1-rho<=fo<=1`이므로 t=X/XK>=1에 대해

    0<Ecl(X)<=2eK*t^(-1/2-h).

이 endpoint 비교는 전체 outer cone이나 실제 angular root의 작은 반지름을
가정하지 않는다. 실제 tail 진폭이 앞선 root에 의존하지 않는다는 source
결합을 사용한다. 다른 구간 장의 정의역을 이 정리가 대신 증명하지 않는다.

## 3. 실제 heat와 세 무한 적분

원본 Laplace 적분을 Gamma(1+h)로 나눈 H에 대해 실제 heat 정칙성 정리가
`0<H<=1`, `H(0)=1`, `|H'|<=h(1+h)<=2h`를 준다.
물리적 η에서 `0<=Z<=2/X`이므로

    0<=1-H(Z)<=4h/X.

원래 cutoff χ는 0과 1 사이이고, `L=chi*(1-H)`라 하자.
`DeltaE=-Ecl*L`, energyChange=`(1-L)^2-1`이므로

    |DeltaE|<=4h*Ecl/X,
    |energyChange|<=2L<=8h/X.

실제 원본 세 부채를 dX measure로 정확히 되돌리면

    DI=-integral_XK^infinity sqrt(2X)*Ecl*L dX,
    DS=-(1/2)*integral_XK^infinity Ecl²*energyChange dX,
    DCp=(1/2)*integral_XK^infinity Ecl²*energyChange dX/X.

부호는 원본 그대로이며 상계에서만 절댓값을 쓴다. 위 tail 상계와
`A=1/2+h`를 적용하면

    |DI|<=8sqrt(2)*eK*sqrt(XK)<16eK*sqrt(XK),
    |DS|<=16h*eK²/(2A)<=16h*eK²,
    |DCp|<=16h*eK²/[XK*(2A+1)]<=16h*eK²/XK.

첫 적분의 `integral_1^infinity t^(-1-h)dt=1/h`가 실제 h와 상쇄된다.
무한 꼬리를 버리거나 끝점을 유한 표본으로 대신하지 않는다.

## 4. 실제 normalized rhs와 원래 상자 포함

원본 세 정규화는 `X0^(3/2)*K`, `X0*K²`, `K²`이다.
`K>=e_*/2`, `eK*sqrt(XK)<=e_*sqrt(X0)`, `XK>=X0`에서 실제 정규화
heat 부채의 최대값은 `64/X0` 이하이다. 원래 λ를 나눈 rhs와 I1에서
독립 증명한 동일한 연속 E block의 역수 `||A_E^-1||<2^30`를 쓰면

    ||A_E^-1 rhs_actual||<=2^36/(lambda*X0).

원본 `XR>=2^40`, `lambda=exp(-1000T)`와 X0를 그대로 대입하면

    2^36/(lambda*X0)<=2^-4*exp(-59001T+18)
      <2^-58987<2^-720                 (T>=1).

원래 `r_box=10^-6`, `||A_E^-1 Qdiag||<2^38`, `lambda<=2^-200`이므로
같은 정확한 분수 계산으로

    image<=2^-720+2^-200*2^38*r_box² < r_box,
    Lipschitz<=2*2^-200*2^38*r_box <1/4.

따라서 실제 세 무한 적분을 rhs로 쓰는 바로 그 원본 I2 방정식에는
원래 상자 안의 유일한 근이 있다. 0에서 시작한 원래 반복이 그 근으로
수렴한다. 작음의 상계를 임의의 rhs 값으로 대입하지 않았다.

## 5. 물리적 η 내부의 정칙성과 한쪽 끝점 jet

원래 heat 미분의 모든 고정 차수 majorant를 사용하면 η의 각 고정 차수
미분에서도 `1-H(2(1-eta²)/X)`는 tail에서 `C_m/X`로 유계다.
η 미분에서 생기는 Z 미분은 적어도 1/X를 가지며, h>0이 고정되어 있다.
따라서 DI에는 `C_m*X^(-1-h)`, 다른 두 적분에는 더 강한 적분 가능
majorant가 있다. 지배수렴으로 실제 rhs는 |η|<1에서 C∞이고, 모든 고정
차수의 η 미분이 ±1까지 한쪽으로 연속이다.

위 축약에서 실제 Jacobian은 가역이다. 암시함수 정리와 유일성으로 같은
근은 |η|<1에서 C∞다. 정확한 implicit 미분식을 반복하면 모든 고정 차수의
연속된 한쪽 끝점 jet도 얻는다. η=±1에서는 실제 Z=0, H(0)=1이므로 세
부채가 정확히 0이고, invertible A와 상자 내 유일성으로 실제 근은 (0,0,0)이다.
이 끝점 값은 미지 값을 0으로 정한 것이 아니라 실제 heat 항등식의 결론이다.

이 적분은 η가 ±1을 넘어가면 일부 u에서 `1+Zu>0`이 깨질 수 있다.
음의 Z에 대한 같은 적분의 확장이나 끝점을 넘는 열린 근방 정칙성은
주장하지 않는다. Guard가 그 확장을 요구한다면 별도 열린 의무이다.

## 실행 결합과 범위

`actual_i2_native_probe.mjs`는 원래 full-leading kernel만 작은 cloud
범위로 실행한다. 같은 fixed/source/core/prefix와 두 이차 등록부, 모든
stage 끝점, Qb/Qp와 wait, 실제 Gamma와 세 compactified improper 적분,
원래 η 인수·cutoff·정규화, I1과 같은 E operator를 독립 비교한다.
전체 g21 생산자를 다시 실행하거나 전체 그래프를 내려받지 않는다.

`actual_i2_incoming.py`는 이 결합을 실제 I1 연속 행렬 증명 및 원본
heat 정칙성 영수증과 같은 source/hash로 합성하고 inclusion을 다시 계산한다.
이 결과는 실제 I2 primitive에 대한 부분정리이며, 전체 완료 장과 모든
압력 구간 J의 g 정칙성, Volterra와 indexed/PDE 적용은 별도로 추적한다.
원본 Guard/Jet/PDE 신규 소거 수는 계속 0이다.
