# 실제 I1/I2 보정 뒤 E, a, vs의 양성

이 결과는 C.12 이후 보정 중 I1과 I2만 분리한다. 원본 완료 leading
전체의 양성을 선언하지 않는다. 실제 원본 함수의 root가 원래의 작은
상자에 존재한다는 전제에서, 두 보정 자체는 양의 shear gap을 보존한다.

원본 source의 I1 보정은 `9227`(E), `9209`(U), I2 E 보정은 `71740`이다.
실제 이차 root는 `ActualSameN3C2I1`과 `ActualSameN3C2I2Heat`의 값이며,
반지름 source는 `4991`이다. source registry에 반지름 `10^-6`이 적혀
있다는 사실만으로 실제 root의 존재나 이 상자 포함을 증명하지 않는다.

두 보정 패치의 변하지 않은 실제 power branch는 `71874`이다. 각 패치의
`x=X/X0`와 실제 정규화 K를 쓰면

    Ebase=K*x^(-p), Ubase=0, p=1/2+lambda,
    DeltaE=K*lambda*sum_j z_j*beta_j(x).

여기서 원본 `0<lambda<=2^-200`이고, E bump의 지지구간은 각각
`[11,11.5]`, `[12,12.5]`, `[13,13.5]`이다. I1의 U bump 지지구간은
`[9,9.5]`, `[10,10.5]`이므로 E bump와 만나지 않는다. 실제 bump는
`beta_j(x)=2*sigma'(2*(x-left_j))`이다. 원본 lambda와 폭 인자를 유지한다.

## 원본 step의 독립적인 충분한 상계

원본 해석기의 step은 0<t<1에서

    sigma(t)=exp(-1/t²)/(exp(-1/t²)+exp(-1/(1-t)²))

이고 바깥에서 평탄하게 0 또는 1로 이어진다. 다음의 넉넉한 상계면
충분하다.

    0<=sigma'<=32, |sigma''|<=256,
    0<=beta<=64, |beta'|<=1024.

이를 기존의 더 작은 수치 상계에 의존하지 않고 확인할 수 있다.
대칭성 때문에 t<=1/2만 보자. `s=1/t`, `y=1/(1-t)`,
`z=y²-s²`, `L(z)=1/(1+exp(-z))`이면 sigma=L(z)이다.
`L'<=exp(z)`와 `z'<=2s³+16`을 쓰면
`sigma'<=(2s³+16)*exp(4-s²)<=32`이다. 마지막 함수는 s>=2에서 감소한다.

2/5<=t<=1/2에서는 `z'<=4375/108<41`,
`|z''|<=6*((5/2)^4-(5/3)^4)<189`이다. Logistic 함수에 대해
`L'<=1/4`, `|L''|<=1/(6sqrt(3))<1/10`이므로
`|sigma''|<=41²/10+189/4<256`이다. Logistic 두 번째 도함수 상계는
`v=(1-2L)²`로 바꾸면 다음 정확한 인수분해로 확인된다.

    1/108-v*(1-v)²/16=(v-1/3)²*(4/3-v)/16>=0.

t<=2/5에서는 s>=5/2, y<=5/3이므로

    |sigma''|<=((2s³+10)²+6s^4)*exp(25/9-s²).

이 양은 s>=5/2에서 감소한다. 양의 계수를 가진 6차 다항식 P에 대해
`P'/P<=6/s<2s`이기 때문이다. 시작점에서 `P(5/2)<2048`이고
`25/4-25/9=125/36>3`, `exp(3)>8`이므로 상계는 256보다 작다.
끝점의 평탄한 확장도 같은 상계를 만족한다.

## 작은 실제 root에서 나오는 점별 shear gap

이제 실제 선택된 root에 대해 `|z_j|<=r=10^-6`이라고 하자. 이는 아직
입증해야 하는 실제 root 전제이다. disjoint support와 x<=14, p<=1을 쓰면
`q=DeltaE/Ebase`에 대해

    |q|<=896*r*lambda,
    |D_logX q|<=201600*r*lambda.

원본 보정식을 그대로 미분하면

    Enew=Ebase*(1+q)>0,
    anew=2+2lambda-2*D_logX(q)/(1+q).

분모를 생략하지 않으면 정확한 유리수 상계는

    |anew-(2+2lambda)|/lambda
      <=403200/999104 <1/2.

따라서 두 실제 E 보정 패치에서

    anew>=2+3lambda/2>2,  vs_new=anew+bs_new²/anew>=anew>2.

I1 U 보정 지지구간에서는 E가 바뀌지 않아 `a=2+2lambda`이다. 따라서
bs의 크기나 부호를 제한하지 않아도 같은 strict vs gap이 나온다.
두 보정의 bump 바깥에서는 원본 power profile의 `a=2+2lambda`가 유지된다.

## 실제 source 연결과 남은 의무

검증기는 원본 profile 파일과 이차 registry의 SHA를 확인하고, 실제 K,
두 power 정규화, 세 보정 수식, 원래 반폭, bump 위치와 lambda 인자를
비교한다. 완료 leading F의 실제 합산 node와 I1/I2 guard도 보존한다.
원본 전체 source를 재생산하지 않고 작은 source cone만 읽는다.

이 결과로 새로 필요한 작은ness 조건은 **실제 root의 원래 10^-6 상자
포함**으로 줄었다. 실제 I1 root를 얻으려면 원본 C.12의 다섯 moment debt
`rhs=[8830,8831,8832,8833,8834]`를 그 값 그대로 사용하여 원본 연속 행렬의
inclusion/contraction을 증명해야 한다. 이 부분은 실제 preloop 전체 장과
C.11 primitive의 S/R envelope에 의존한다. 선언된 root 반지름이나 과거
proof boolean으로 대체할 수 없다.

I2의 대응 rhs는 실제 무한 heat debt에서 나온 `[71708,71712,71716]`이다.
`||A_E^-1||<=2^30`와 실제 정규화 heat debt `<=2^15/X0I2`를 독립적으로
증명하면 preconditioned debt는 `2^45/(lambda*X0I2)` 이하가 된다.
원본 `X0I2=XR*exp(60001T-18)`, `lambda=exp(-1000T)`, `XR>=2^40`로
이는 `32*exp(-59001T+18)` 이하이다. 이 계산은 매우 작다는 함의를 주지만,
실제 무한 heat debt와 그 tail envelope의 source 연결을 생략하지 않는다.

패치가 원본 C.12 지지구간 뒤이며 heat switch 앞이라는 전체 원본
구간 연결, 실제 loop와 양쪽 flat collar의 정칙성·gap, I1/I2 밖의 전체
완료 leading 장은 별도 의무이다. 따라서 이 결과를 전체 J 또는 모든
고차 g 정칙성의 증명으로 올리지 않는다. 원본 Guard/Jet/PDE 신규 소거는
계속 0이다.
