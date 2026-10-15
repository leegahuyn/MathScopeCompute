# 실제 pre-C12 배경의 원래 S 경계

이 문서는 같은 원본 natural 급수, B26, B34, B8 해를 사용한다. 실제 B8 연속 연산자의 재계산과 유입 잔여량의 증명이 선행 조건이다. 전체 C1의 끝점 collar와 이후 I1/I2는 이 정리의 결론에 포함하지 않는다.

## 범위와 작은 공통 기준

`I=[-33/32,33/32]`, `C=CSelected`, `S=C^100000`이다. 원래 loop rectangle의 `X` 범위는 `Ia=(4/Lambda)exp(t1/8)`부터 `Ib=XR exp(T+3)`까지이다. `Q>=2^260`, `Lambda=Q^64`, `log C>=Q^200`, `Pstar=exp(2T)`, `Q>=2^260 Pstar^2`이므로

```
C>2^2048, Pstar<C, h^-2<C,
1/X<C, X<C^24, log(110/Xa)<C,
Q^5000<C.
```

마지막 부등식은 `5000 log Q<Q^200`에서 따른다. 모든 아래 유한 합의 항 개수와 고정 유리수는 C 하나로 흡수한다. C를 정의하는 원래 식은 변경하지 않는다.

## reference와 B26의 한 번 η 미분

실제 natural majorant는 `Y<=4.1` 및 공통 η tube 반경 `delta=rho/(1024Q)`에서 정상 수렴한다. `delta^-1<Q^3`이고 고정 Y 미분을 포함한 η 0,1,2차 미분은 Cauchy 경계로 `Q^20`보다 작다. 자연 함수의 양성 구간에서 `Phi>=1/4`이다. 원래 `g_eta/g=Lambda*zeta`, `|zeta|<sigmaStar^-1<Q`이며 한 번 더 미분해 `|g_etaeta|/g<Q^140`이다. 기존 실제 ψ 경계와 log C를 비교하면 `C^-2<=g<=1`이다.

B22의 두 endpoint는 η와 독립적이다. collar의 logF 적분 몸체는 원래 `cutoff(s)*Y*Phi_Y/Phi`이고, 길이는 `t1<1`이다. 그 η 0,1,2차 미분은 곱·역수 규칙과 `Phi>=1/4`로 `Q^100`에 들어간다. 따라서 실제 reference의 F,U와 그 η 0,1,2차 미분은 `C^4`보다 작고 `Fref^-1<C^3`이다. Fref의 하계는 natural F와 collar의 감소량에서 얻은 `g/8`이다. 끝점 상수 연장은 같은 하계를 유지한다.

reference의 다섯 누적 moment는 `0<=X<=110`에서 원본 적분 measure를 그대로 갖는다. 각각의 η 0,1,2차 미분은 `C^20`보다 작다. 축까지의 자연 적분에서는 이미 증명된 regular-axis 표현을 사용하므로 `1/X`를 축에서 따로 평가하지 않는다. 실제 sourceFromState를 적용하는 곳은 `X>=Xa`이고 여기서 `X^-1<C`이다.

원래 Ns, Qs는 정확히

```
W=1-2D eta M/X-d M_eta/X,
Qs=-W+[(1-h)I-D eta I_eta-d J_eta+2(h-D)eta J]/(2X^2 F),
Ns=-WU+[D(M-eta M_eta)+4h eta S-d S_eta]/X
        +4A eta(P0+Cp)-d(P0_eta+Cp_eta).
```

이 식을 η로 한 번 미분한다. 필요한 moment는 η 2차까지이며 위에서 모두 경계가 있다. L과 그 역수 및 고정 계수의 η 2차까지의 크기는 C보다 작다. 고정 pressure의 η 2차까지도 실제 strip bound에서 C보다 작다. 따라서 `|p1ref_eta|,|nsref_eta|<C^50`이다. 예를 들어 Qs의 가장 큰 분모 항은 `I*F_eta/(X^2 F^2)`이며 지수 합 `20+4+2+6<50`이다. Ns의 가장 큰 moment 항도 `C^20*C` 이하이고 WU 미분의 항은 C^30에 들어간다.

원래 κ, beta, blend는 η와 독립적이다. B26의 이미 증명된 실제 값 경계 `F<=2g`, `E^-1<=C^3`, `a<C`, `a^-1<C^122`와 log 반경 적분의 길이를 사용하면

```
|a_eta|<C^51,
|partial_eta log F_B26|<C^54,
|F_B26,eta|<C^57,
|E_B26,eta|<C^59,
|U_B26,eta|<C^52.
```

U 미분 적분에는 `κ nsref_eta dX/2`가 있으며 길이는 110보다 작다. 방사 미분은 `U_X=-κ beta nsref/2`라서 `|U_X|<C^4`이다. cutoff의 좁은 폭을 η 미분으로 잘못 끌어오지 않는다.

## B34, 복구, B8 및 outer 입력

실제 `ellI_eta=Ei_eta/Ei`이므로 `|ellI_eta|<C^62`이다. B34 식을 직접 η 미분하면 `|E_eta|<C^65`이다. `Gi_eta`는 B26 endpoint의 같은 U 미분이고, axial restoration은 Gi와 4η의 cutoff 보간이다. 따라서 복구 구간에서 `|U_eta|<C^55`이다.

incoming endpoint까지는 `X<C^24`이다. 다섯 실제 moment를 각각 η 미분하면 길이와 실제 measure의 `sqrt X` 또는 `1/X`를 포함해 전부 `C^110`보다 작다. 이 경계는 ideal과의 상쇄를 필요로 하지 않는다. Keta, XR 정규화의 역수는 1 이하이고 그 η log 미분은 C 이하이다. 실제 scaled debt의 `mu^-1=h^-2<C`도 포함하면 `|rhs_eta|<C^115`이다.

B8의 재계산된 실제 연산자는 원래 상수 preconditioner R에 대해 `||I-R(A+2mu Qdiag diag(z))||<1/4`이고 `||R||<2^40`이다. 따라서 실제 root의 η 미분은 원래 식

```
z_eta=(A+2mu Qdiag diag(z))^-1 rhs_eta
```

에서 `|z_eta|<C^117`이다. 유한 iterate의 미분을 해의 미분으로 사용하지 않는다. 원래 bump 폭 1/4096과 step 미분의 고정 경계 `2^2048<C`를 포함해 B8 보정의 η 미분은 C^120보다 작다.

`X>=XR`의 실제 outer E는 로그 반경의 primitive cutoff로 정해진다. 초기 전환의 a는 `[4/5,2]`, decay의 a는 2, entry와 이후 power의 a는 `[2,2+2lambda]`이다. 초기 전환에서 로그 진폭의 증가는 최대 1/10이고 그 다음 E는 감소하므로 이 구간에서 `E<2Pstar<C^2`, `E>=Pstar exp(-(T+4)/2)/3>1`이다. outer U는 `4eta`, `eta*k(log(X/eXR))`, 그 뒤 원래 tail의 정확한 0 branch이다. pulse 시작은 `XR exp(T+2+60000T)`로 Ib보다 뒤다. k의 cutoff는 s=exp(Md)-1에서 이미 0이고 T=exp(Md)+10이므로 decay endpoint 근방도 정확히 0이다. 따라서 outer U의 η 미분은 4 이하이고 `|U_X|<C^4`이다. E의 η log 미분은 Keta의 것뿐이다.

이 모든 같은 원본 branch를 합치면 loop rectangle 전체에서

```
0<E<C^2, E^-1<C^4, |U|<C^2,
|E_eta|,|U_eta|<C^122, |U_X|<C^4,
0<a<C^2, a^-1<C^122.
```

B8의 양성 및 3/4 하계는 실제 incoming/contraction 정리의 결론이다. 다른 구간은 앞선 실제 B26/B34 및 위 outer 식의 경계다. 모든 branch의 접합은 원래 cutoff의 flatness와 같은 endpoint 값·도함수에서 따른다.

## 실제 C1 입력의 S 경계

loop에 쓰이는 다섯 moment는 reference가 아니라 이 실제 E,U의 누적 적분이다. 실제 body와 measure를 η로 미분하고 `X<C^24`를 사용하면 모든 moment와 η 1차 미분이 C^180보다 작다. Ns의 위 정확한 식에서 `|Ns|<C^190`이고 `L^-1<2`이다. 따라서

```
|p2|=|X Ns/(L E)|<2C^218<C^220<C^300,
|bs|=|2X U_X/E|<C^34,
vs=a+bs^2/a<C^192.
```

Ns를 정의할 때 ns=Ns/L임을 반영하였다. 위 p2의 표시에는 이 L이 한 번만 있다. p2는 E_eta와 동일시하지 않는다.

그러므로 원래 S=C^100000에 대해 `a^-1<S`, `vs<S`, `|p2|<S`가 실제 loop 전체에서 성립한다. 끝점 `vs>2` collar는 추가로 필요하며 이 정리가 대신하지 않는다. 증명 문서의 유한 지수 예산과 실제 source/hash 입력 연결을 검증하고, 전체 g/J 정칙성과 원본 1,260개 의무는 계속 별도로 추적한다.
