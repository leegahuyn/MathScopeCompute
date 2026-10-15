# 원본 배경에서 C.1 전체 정칙성과 유한 N의 C.12 정칙성까지

이 문서는 앞선 실제 부분정리들을 결합한다. 조건부 일반 정리를 다시 선언하는 대신, 원본 C.1 정리에 필요한 입력이 어느 실제 원본 증명에서 나오는지 명시한다. 결론은 원래 loop rectangle의 배경·분산근·circle inverse·평균을 뺀 A/B, 그리고 원래 유한 N의 C.12 함수에 대한 C∞ 및 C.12의 E 양성이다. C.12 이후의 전단 하계나 최종 g21 전체 정칙성을 결론으로 삼지 않는다.

대상 고정 정의 SHA-256은 `c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b`, 원본 loop 구현 SHA-256은 `07ee5caa8ce45a9d8a910cab7243ae3e351965a8602a38030917f69114d8902d`이다. 원본 두 native 정의는 `ActualC1VarianceRoot`와 `ActualC1CircleInverseLift`이며 실제 body root는 각각 7450, 7539이다. 작은 원본 재실행이 이 두 registry 몸체, 전체 fixed 정의, 실제 겹치는 graph, 분산·circle·배경 식과 끝점 branch를 직접 비교한다.

## 실제 배경의 같은 해와 공통 열린 영역

I=[-33/32,33/32], Ia=Xa exp(t1/8), Ib=XR exp(T+3), S=CSelected^100000을 고정한다. 모든 수는 변경하지 않은 원래 매개변수다. Ia>0, Ib<무한대이며 이 문서는 [Ia,Ib]의 근방에서만 log X를 사용한다.

원본 natural 함수는 메타데이터 노름을 가정하지 않은 실제 Banach 급수 증명으로 얻는다. 같은 삼각 계수점화식과의 일치는 차수 귀납으로 확인되며, 그 급수는 원래 반경 인수 Y<=4.1와 공통 η 복소 근방에서 정상수렴한다. 따라서 실제 입력과 필요한 모든 고정 혼합 도함수가 존재한다. 실제 Phi>=1/4와 g>0으로 B.22의 실제 로그 몫도 잘 정의된다.

natural/B.26의 접합은 원본 모멘트로부터 증명한 정확한 두 항등식

```
source.p1=-2X F_X/F, source.ns=-2U_X
```

과 κ-1의 flatness를 사용한다. 모든 반경·η 혼합 차수가 일치한다. 원본 B.26의 terminal blend=1, beta=0 근방에서는 a=4/5와 U=Gi가 정확히 성립한다. 이 값에서 시작한 실제 B.34가 Xi=110에서 같은 power와 flat하게 접합한다. B.34의 오른쪽은 원래 XR=110(C Pstar)^10 때문에 정확한 ideal power와 일치한다. η에 의존하는 실제 Ei/Gi를 상수 외부 입력으로 바꾸지 않는다.

실제 B.8의 유입 부채는 natural/B.22/B.26/B.34/복원 모멘트 이력 전체로부터 작다고 증명되었다. 새로 계산한 연속 적분 행렬과 원래 전조건자의 축약사상은 같은 실제 근의 존재·유일성과 C∞를 준다. 이 근을 쓰는 원래 bump는 flat한 양 끝과 서로 떨어진 실제 지지구간을 갖는다. 실제 다섯 모멘트 방정식도 정확히 소거된다. 유한 근 반복을 사용하지 않는다.

outer의 실제 cutoff primitive는 y=0,1에서 flat한 도함수를 갖는다. 초기 식은 y=0에서 ideal power와 같고, y=1에서 대칭 항등식 `integral_0^1 sigma=1/2`에 의해 decay의 상수 -1/5와 같다. entry가 끝나는 y=T+2에서 상수는 정확히 `-7/10-T/2-lambda/2`이고 그 뒤 실제 power와 같아 모든 차수가 접합한다. outer axial 함수의 k cutoff는 T 이전에 정확히 0이 되며, pulse 이전의 실제 tail도 정확히 0이다. 복원 및 B.8 bump의 접합까지 합치면 실제 E,U는 [Ia,Ib]와 I의 공통 열린 근방에서 C∞다.

원본 loop의 모멘트는 B.22 참조값이 아니라 이 실제 E,U의 적분이다. 같은 smooth 함수의 유한 적분과 미적분학의 기본정리로 그 누적 모멘트도 모든 차수에서 C∞다. 원래 `sourceFromState`가 이 모멘트에서 만드는 p1,p2도 같은 열린 근방에서 C∞다. p2를 E_eta로 동일시하지 않는다.

## 실제 C.1의 양성·S·끝점 가정이 모두 충족됨

각 실제 구간의 양성 및 도함수 예산을 결합한 `ACTUAL_PRELOOP_SOURCE_ENVELOPE_KO.md`는 원본 rectangle 전체에서

```
0<E<C^2, 0<a<C^2,
a^-1<C^122<S, vs<C^192<S, |p2|<C^220<S
```

를 증명한다. 실제 B.26/B.34/B.8 양성을 선행 입력으로 사용하며, B.8 근의 η 미분은 실제 Jacobian의 Neumann 역수에서 나온다. 모멘트 적분의 실제 X measure와 유한 구간을 지수 예산에 포함한다. 단순히 소스에 쓰인 S 선언을 가정하지 않는다.

`ACTUAL_C1_ENDPOINT_COLLARS_KO.md`는 다음 두 실제 근방을 증명한다.

```
t1/9<=log(X/Xa)<=t1/7:       vs-2>1/128>S^-1,
T+5/2<=log(X/XR)<=T+7/2:     vs-2=2lambda>S^-1.
```

왼쪽은 실제 natural 해의 χ 분할 및 원본 음의 압력으로부터 얻은 엄밀한 하계를, 실제 B.26의 κ와 E 비율을 통해 옮긴 것이다. 오른쪽은 실제 power와 pulse 이전의 U=0 branch를 사용한다. 원래 끝점 t1/8, T+3은 각각 근방의 내부다. 모든 경계는 I 전체에서 엄격하고 균일하므로 연속성 및 이미 증명한 공통 정칙성에 의해 η의 열린 근방으로도 확장된다.

## 실제 분산근, circle inverse와 원래 A/B

이제 `ACTUAL_LOOP_REGULARITY_KO.md`의 모든 배경 가정을 위 실제 증명으로 충족한다. 그 문서의 원본 scalar 식은

```
M(z)=(2pi)^-1 integral_0^(2pi) exp(z sin theta)dtheta,
R(z)=M(2z)/M(z)^2,
Q(z)=integral_0^1 (1-s)R''(sz)ds,
W(mu,p)=d0 mu sqrt(Q(mu p)).
```

실제 scalar AST에서 M,R,R''가 독립적으로 재계산된다. Q(0)=1/2이므로 p=0 또는 mu=0에서도 같은 부드러운 W를 사용한다. 거짓 주장 `partial_mu(W^2)(0)>0`를 사용하지 않는다. 실제로 이 도함수는 0이며 W_mu(0)=d0/sqrt(2)>0이다.

정칙성 증명은 실제 W가 전역에서 μ에 대해 엄격히 증가하고, 원래 muMax=S^12가 실제 우측 부호를 충족하며, 원래 양의 derivativeLower/Upper가 유효함을 보인다. 따라서 실제 분산근은 원본 고정점 반복과 같은 유일한 C∞ 근이다. 제한된 반복의 근삿값이나 외부 root oracle을 쓰지 않는다.

원래 t(theta), vTarget 및 density의 적분질량은 정확히 1이다. `a(1+t^2)/(2pi vTarget)`는 엄격히 양수이고 같은 실제 lift가 `phi(theta+2pi)=phi(theta)+1`을 만족한다. 따라서 원래 bracket `[2pi(phase-1),2pi(phase+1)]` 안의 유일한 역 lift theta는 모든 실수 phase에서 C∞이며, 같은 주기 관계를 갖는다. 불연속 modulo 또는 floor를 미분하지 않는다.

원본이 정의한 A/B는 이 역 lift를 대입하고 정확한 한 주기 평균을 뺀 primitive다. 그러므로 모든 느린 변수와 실수 phase에 대해 C∞이며 주기는 1이다. 두 끝점 collar에서는 vs>=2+delta/4이므로 원래 cutoff ζ=0, r=0, mu=0이다. 그때 density=1/(2pi), 역 lift=2pi·phase가 되어 A와 B가 정확히 0이다. 따라서 원래 반경 piecewise 정의의 0 연장도 모든 고정 혼합 차수에서 C∞다.

## 원래 유한 N의 C.12

원래 N은 `1+ceil(C12EnvelopeR^50)`인 유한한 양의 정수다. 고정된 원본 입력으로 정한 상수이므로 η나 X로 미분하지 않는다. 원래 물리 위상과 함수는 정확히

```
phase=N log X,
Enew=E exp(A(X,eta,N log X)/N),
Unew=U+B(X,eta,N log X)/N.
```

이다. X>0에서의 C∞ 합성과 실제 E>0으로 Enew>0 및 Enew,Unew의 C∞가 따른다. phase의 큰 반경 도함수를 버리거나 주기 평균으로 대체하지 않는다. 끝점에서는 A/B가 근방에서 정확히 0이므로 원래 배경과 모든 차수에서 접합한다.

`actual_c1_c12_composition.py`는 S·collar·native 정리·loop binding·B.8·B.26·B.34·natural 및 보존 항등식의 정확한 해시 연결을 검사한다. 동일한 성공 플래그를 가진 다른 B.8 입력을 끼우는 음성 대조군을 거부한다. 이 검사는 위 해석적 합성의 입력 추적이며, 유한 차수 검사를 무한 차수 증명으로 부르는 것이 아니다.

후속 C.12의 `a_new>0, vs_new>2`, cone, 실제 I.1/I.2 보정의 작은 근 상자, 이후 heat/Volterra/외부 함수의 전부 적용 및 최종 g21의 모든 고정 압력 구간 정칙성은 이 결론에 포함되지 않는다. 원본 Guard/Jet/PDE 신규 소거 수는 이 부분정리만으로 변경하지 않는다.
