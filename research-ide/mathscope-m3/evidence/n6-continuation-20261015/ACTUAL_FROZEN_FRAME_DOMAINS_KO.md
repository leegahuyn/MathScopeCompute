# 실제 frozen frame의 정적 분모와 제곱근

검증 대상은 원본 `ActualCommonBandLeading_F/G`에서 고정 대표점으로
읽은 `F0=622971`, `FR0=622981`, `GR0=622991`이다. 이 값은 C.12 이전
장의 값으로 바꾸지 않는다. 검증기는 실제 source node를 이용하여
`gabs=622996`, `lambda0=623006`, `c0=623008`, `Bs=623034`,
`Ls=623027`의 수식을 확인한다.

실제 느린 좌표 사상은 `X=R²/(2s)`, `eta=Z*s^(-D)`이고,
leading 두 장은 `F=s^(-A-1/2)*Fbase(X,eta)`,
`G=s^(-A)*Ubase(X,eta)`이다. 원본 암시적 `s`의 인수는 `Z,T`뿐이다.
따라서 `Z,T`를 고정하여 R로 미분하면 s와 eta는 고정된다. 원본의
완료된 leading 장에 대해

    Ebase=sqrt(2X)*Fbase,
    a=1-2X*Ebase_X/Ebase=-2X*Fbase_X/Fbase,
    bs=2X*Ubase_X/Ebase,
    vs=a+bs²/a

를 사용하면 정확히 `R*F_R=-a*F`, `G_R/F=bs`이다. 검증기는 실제
사상에 대해 `R*X_R=2X`와 `(G_multiplier/F_multiplier)*X_R=sqrt(2X)`를
각각 확인한다. `R*F=s^(-A)*Ebase`이므로 실제 Ebase의 양성은 F의
양성을 준다. 대표점 사상 `Rrep=sqrt(2*srep*Xrep)`,
`Zrep=srep^D*etarep`, `Trep=srep*(1-etarep²)`도 원본과 비교한다.

같은 대표점에서 실제 완료된 leading 장의 `Ebase>0`, `a>0`, `vs>2`를
가정하자. `S=a²+bs²`라 하면 실제 frozen gradient와 단위 법선은

    g0=F*(-a,bs),  gabs=F*sqrt(S),
    N0=-a/sqrt(S), N1=bs/sqrt(S)

이다. 따라서 원본 growth radicand는

    -2*F*N0*(gabs+2*F*N0)
      =2*F²*a²*(vs-2)/S > 0.

원본의 양의 제곱근 선택으로 `lambda0>0`이고,
`2*F*N0<0`이므로 `c0<0`이다. 실제 제곱 항등식
`c0²=(vs-2)/2`와 이 부호를 함께 사용하면
`c0=-sqrt((vs-2)/2)`가 나온다. 축방향 shear bs의 부호나 bs가 0이
아니라는 가정은 필요하지 않다.

원본 `epsilon=exp(finite real)>0`,
`k=ceil(epsilon^(-1/2))>=1`, `ci=exp(...)*exp(...)>0`를 그대로 쓰면

    Bs²=lambda0/(epsilon*k²*(1+u²)^(3/2))>0,
    Ls=2*r0/ci>0

이다. 따라서 정적 moving frame의 `gabs`, `c0`, `Ls` 분모와
`lambda0`, `Bs` 제곱근에는 추가적인 정의역 장애가 없다. 별도의 실제
동적 분모 검증에서 얻은 `nt²>0`, `n²>0`와 합치면, moving frame의
대수적 변환이 만드는 분모와 제곱근 조건이 충족된다.

검증기는 원본 radial gradient의 R 인자 누락, radial shear 부호 변경,
growth의 인자 2 누락, c0 분기 부호 변경을 각각 거부한다. 작은 source
cone만 내보내며, fresh-cache 실행에서는 두 실제 covariance 행렬의
조상 그래프에 위 원본 정적 root가 모두 포함되는지도 확인한다.

핵심 미완료 전제는 **C.12 이후 완료된 실제 leading 장 전체에서의**
`Ebase>0`, `a>0`, `vs>2`이다. C.12 이전 natural/B26 장의 양성이나
선택된 한 점의 부등식으로 이 전제를 대체하지 않는다. 완료된 leading
C1 정칙성과 원본 slow chart, 전체 배경 native 함수의 정의역·정칙성도
해당 원본 증명이 필요하다. 따라서 이 결과는 정적 frame 조건을 정확한
원본 전제로 환원한 증명이며 원본 Guard/Jet/PDE 신규 소거 수는 0이다.
