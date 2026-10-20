# 실제 C.12 부채에서 원래 I1 근의 존재를 얻는 증명

실제 preloop의 S 경계, 실제 분산·원형 역함수, 양 끝 collar 정리를
같은 source에 결합한다. 원래 `ActualSameN3C2I1`의 rhs는 다섯 실제
적분이며, 반지름 metadata나 `incoming<10^-8` 선언을 가정하지 않는다.
아래에서는 점별 C0 축약만으로 근을 만든 뒤, 실제 rhs의 C∞ 정칙성과
Jacobian 가역성으로 매개변수 정칙성을 얻는다. η 고차 도함수가 작다고
가정할 필요가 없다.

## 1. 같은 원본 입력과 더 약한 충분 조건

실제 입력은 다음 문서의 전체 source 결합이다.

- `ACTUAL_PRELOOP_SOURCE_ENVELOPE_KO.md`: 원본 loop rectangle에서
  `0<E<=S`, `|U|<=S`, `a>0`, `a^-1<=S`, `vs<=S`, `|p2|<=S`,
  `S^-1<=X<=S`, 원본 `S=CSelected^100000>=2^20`.
- `ACTUAL_LOOP_REGULARITY_KO.md`: 실제 분산 식, 실제 원형 밀도의 질량 1,
  lifted inverse, 실제 평균을 뺀 주기 1 primitive A와 B.
- `ACTUAL_C1_ENDPOINT_COLLARS_KO.md`: 실제 A와 B의 원래 양 끝 0 확장.

이 입력은 reference를 실제 장으로 바꾸거나 전 구간 stock cone을
가정하는 방식이 아니다. 실제 B8 근, 실제 누적 moment와 실제 loop
정리를 순서대로 사용한다. I1에서는 원래
`R=exp(S^256)`, `N=1+ceil(R^50)`를 유지한다.

## 2. 실제 평균 제거 primitive의 점별 상계

원형 역함수 Θ를 써서 원본과 같은 식을 둔다.

    A0(q)=(a/2)*(q-Theta(q)/(2pi)),
    B0(q)=(Ea/2)*(ts*q-(1/(2pi))*integral_0^Theta(q) t(theta)dtheta).

0<=q<=1이면 0<=Θ(q)<=2pi이다. 따라서 `|A0|<=a/2`이다.
실제 밀도 치환에 의해 meanA는 A0의 q 평균이므로

    |A|=|A0-meanA|<=a<=S.

실제 분산 방정식은 `mean(t)=ts`, `mean((t-ts)^2)=r_variance^2`를 준다.
여기서 원본 cutoff와 a>0에 의해 `r_variance^2<3S`이다. Cauchy–Schwarz로

    (1/(2pi))*integral_0^(2pi) |t-ts| <= r_variance.

따라서 B0의 두 항을 ts와 t-ts로 나누면

    |B0|<=(Ea/2)*(|ts|+r_variance).

`vs=a(1+ts²)<=S`, `a^-1<=S`이므로 `|ts|<=S`이고,
`r_variance<=2S`이다. 같은 실제 평균을 뺀 뒤에는

    |B|<=Ea*(|ts|+r_variance)<=3S³.

이 상계는 실제 tilt의 매우 큰 점별 최대치를 쓰지 않는다. 원본의 정확한
원형 질량과 분산 방정식을 사용하며, p2=0 및 variance=0도 포함한다.
주기성에 의해 모든 실제 phase `q=N logX`에서 동일하다.

## 3. 실제 C.12 장과 다섯 실제 부채

원본의 비선형 식을 선형화하지 않고 그대로 사용한다.

    DeltaE=E*(exp(A(X,eta,NlogX)/N)-1),
    DeltaU=B(X,eta,NlogX)/N.

N>S^50이고 S>=2^20이므로 `|A|/N<1/2`이다. 양의 exponential 급수에서
`exp(u)-1<=u/(1-u)<=2u`(0<=u<=1/2)를 얻어

    |DeltaE|<=2S²/N<1,  |DeltaU|<=3S³/N<1.

원본 적분은 dlogX measure로 만들어져 있다. 정확히 dX로 되돌리면

    dM=integral DeltaU,
    dI=integral sqrt(2X)*DeltaE,
    dJ=integral sqrt(2X)*(E*DeltaU+U*DeltaE+DeltaU*DeltaE),
    dS=integral (2U*DeltaU+DeltaU²-E*DeltaE-DeltaE²/2),
    dCp=integral (E*DeltaE+DeltaE²/2)/X.

구간 길이<=S, `sqrt(2X)<=2S`, `1/X<=S`를 사용하면 각각

    |dM|<=3S^4/N, |dI|<=4S^4/N, |dJ|<=14S^6/N,
    |dS|<=12S^5/N, |dCp|<=3S^5/N.

따라서 다섯 실제 부채의 최대값은 `S^7/N` 이하이다. 교차항이나
제곱 항을 버리지 않았다. 이 부채 상계는 실제 부채 **값을 대신하는
rhs**가 아니라 원본 rhs를 포함시키는 해석 부등식이다.

## 4. 원래 lambda^-2 행까지 포함한 정규화

원본 I1의 K는

    K=Pstar/(1+eta²)*exp(-T/2-7/10-lambda/2
                       -(1/2+lambda)*(60000T-25)).

|eta|<=33/32, T>=1, `0<lambda<=2^-200`, `Pstar=exp(2T)`에서
`log(K^-1)<60000T`이다. 원래 `Q>=2^260*exp(4T)`와 `log C>=Q^200`이므로
`60000T<Q<=log C`이다. 따라서 `K^-1<C<S`, `lambda^-1<C<S`이다.
원래 `X0I1=XR*exp(60001T-23)>1`도 유지한다.

다섯 원본 행은 순서대로

    dM/(X0*K*lambda),
    [dJ/(sqrt(2)*X0^(3/2)*K²)-dM/(X0*K)]/lambda²,
    dI/(X0^(3/2)*K*lambda),
    dS/(X0*K²*lambda), dCp/(K²*lambda).

그 연산자 norm은 `2S^4` 이하이다. 특히 둘째 행의 두 항과
`lambda^-2`를 유지한다. 따라서 실제 normalized rhs는 `S^12/N` 이하이다.

## 5. 실제 연속 행렬의 역수와 이차항

원본 unit-mass bump는 `[9,9.5]`부터 `[13,13.5]`까지 다섯 개이며
서로 만나지 않는다. sigma가 증가하므로 각 bump는 양수이고 적분이 1이다.
행렬의 U block은 두 번째 행이
`w_lambda(x)=-integral_0^logx exp(-lambda*s)ds`의 두 bump 평균인 2×2다.
두 지지집합의 간격>=1/2이며

    |w_lambda'(x)|=x^(-1-lambda)>1/121, |w_lambda|<3.

따라서 determinant의 절댓값>=1/242, adjugate row sum<4로
`||A_U^-1||<968<2^30`이다.

E block의 한 점 column은
`[sqrt(2)*sqrt(x), -x^(-1/2-lambda), x^(-3/2-lambda)]`이다.
각 column에서 `x^(-3/2-lambda)>=14^-2`를 뽑으면 남는 첫 행은
`f(x)=sqrt(2)*x^(2+lambda)`, 다음 두 행은 −x,1이다.
세 점의 간격 곱은 `>=1/2*1/2*3/2=3/8`이고 `f[x,y,z]>1`이다.
따라서 점별 determinant의 절댓값은 `3/(8*14^6)`보다 크다.
양의 세 unit-mass 측도에 대한 determinant multilinearity로 같은 하계가
실제 연속 적분 행렬에도 적용된다. 모든 cofactor<=12이므로

    ||A_E^-1||<=36*(8*14^6)/3=722835456<2^30.

이는 수치로 근사한 역행렬이나 과거 `inverseBound` 플래그가 아니다.
원래 실제 A의 exact adjugate inverse이다.

이전 repair 정리의 독립적인 step 상계에서 `beta<=64`이다. Unit mass로
`integral beta²<=64`이고, 원래 S 행의 합은 `2*64+3*32=224<256`이다.
다른 이차 행은 더 작다. 따라서 실제 대각 이차 연산자의 norm은 256
미만이며 `||A^-1 Qdiag||<2^38`이다.

## 6. 원래 상자의 실제 inclusion과 같은 근

`2^30<=S²`이므로 실제 전조건 rhs의 크기는

    ||A^-1 rhs_actual||<=S^14/N<S^-36<=2^-720.

원본 `r_box=10^-6`, `0<lambda<=2^-200`를 써서 실제 사상

    T(z)=A^-1*(rhs_actual-lambda*Qdiag(z_j²))

에 대해 분수 연산으로 직접 확인한다.

    ||T(z)||<=2^-720+2^-200*2^38*r_box² < r_box,
    Lip(T)<=2*2^-200*2^38*r_box < 1/4.

따라서 실제 다섯 적분을 rhs로 쓰는 바로 그 원본 방정식에는 원래
10^-6 상자 안의 유일한 근이 있고, 0에서 시작한 원래 반복은 그 근으로
수렴한다. 반지름은 증명의 결론이 포함되는 원래 영역으로 사용했으며,
존재를 보장하는 metadata로 사용하지 않았다.

실제 C.12 장, 고정 구간 적분, 양수 K의 역수는 η의 열린 근방에서 C∞다.
실제 Jacobian `A+2lambda Qdiag diag(z)`는 위 축약 부등식에서 가역이다.
각 점의 암시함수 정리와 근의 유일성으로 같은 실제 I1 근은 C∞다.
고차 η 도함수의 크기를 C0 상자 반지름으로 잘못 제한하지 않는다.

`actual_i1_native_probe.mjs`는 같은 source/fixed/core/prefix, 원본 loop 두
등록부, 실제 C.12 식, 다섯 적분, 정규화, A/Q 25개 항씩과 exact inverse를
비교한다. `actual_i1_incoming.py`는 실제 preloop/loop/collar 영수증의
동일성을 확인하고 위 inclusion을 정확한 분수로 다시 계산한다.

이것은 I1 primitive의 실제 존재와 정칙성에 관한 부분정리다. I2의 실제
무한 heat debt, 전체 완료 leading cone 및 모든 원본 J의 g 정칙성은 별도다.
원본 Guard/Jet/PDE의 신규 소거 수는 계속 0이다.
