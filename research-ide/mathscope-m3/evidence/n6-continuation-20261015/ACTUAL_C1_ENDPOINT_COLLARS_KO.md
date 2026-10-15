# 원본 C.1의 두 실제 끝점 collar에서 vs>2

원래 `loopILeft=Xa exp(t1/8)`, `loopIRight=XR exp(T+3)`를 바꾸지 않는다. η 구간은 I=[-33/32,33/32] 전체다. 이 문서는 실제 natural 급수의 증명, natural/B.26 보존 항등식, 변경하지 않은 B.26와 loop 생산자의 몸체 비교를 사용한다. 원래 `S=CSelected^100000`, `delta=exp(-S^16)`다.

원본 loop의 정의는

```
a=1-2X E_X/E, bs=2X U_X/E, vs=a+bs^2/a.
```

아래에서는 이 실제 a와 bs를 사용한다. B.22 참조장의 vs를 실제 배경의 것으로 대신하지 않는다. 목표는 원래 끝점 주변의 고정된 열린 반경 근방에서 `vs-2>S^-1`를 증명하는 것이다.

## 1. 실제 natural 함수의 Y=4 근방

Y=Lambda X, F=g Phi, U=4eta+j+Lambda^-1 u이고 E=sqrt(2X)F다. 따라서

```
a_n=-2Y Phi_Y/Phi,
bs_n=sqrt(2X) u_Y/(g Phi).
```

이미 증명한 실제 고정점은 `Phi0=f0(chi Y)`, `u0=-L^-1 Zstar Y/2`에 대해 모든 0<=Y<=4.1에서

```
|Phi-Phi0|, |Phi_Y-(Phi0)_Y|, |u_Y-(u0)_Y|
 <= epsilon=(1/2)Q^-56,
1/4<=Phi<=2, 0<a_n<32 (4<=Y<=4.1).
```

첫 Y 도함수의 평가 노름이 1보다 작다는 실제 계수공간의 경계를 사용한다. 계수의 유한 표본을 전체 급수의 도함수로 대신하지 않는다.

χ>=3/4이면 x=χY는 [3,4.1]에 있다. 정확한 Bessel 급수 항등식은

```
f0(x)+x f0'(x)=sum_(n>=0) (-x/2)^n/(n!)^2.
```

이며 교대급수의 나머지에서

```
f0+x f0' <=P4(x)=1-x/2+x^2/16-x^3/288+x^4/9216.
```

P4'는 이 구간 전체에서 음수이고 P4(3)=-23/1024다. 그러므로

```
Phi+Y Phi_Y<=-23/1024+(1+4.1)epsilon<-1/64,
a_n-2=-2(Phi+Y Phi_Y)/Phi>1/64.                        (1)
```

## 2. χ가 작을 때 실제 압력으로부터 얻는 bs 하계

χ<3/4이면 `|Hstar|<sqrt(3)sigma<j/1000`이다. 원본의 정확한 식은

```
Hstar=eta B+j d, B=D+4-4eta^2, d=1-eta^2,
D=1/2-h, 0<h<1/1000.
```

I 전체에서 B>1/5다. 따라서 |eta|<6j이다. 이 작은 구간에서는 d>999/1000이고 B<9/2이므로 `eta B=Hstar-jd<-998j/1000`, 즉

```
-6j<eta<-j/5, |Ustar|=|4eta+j|<24j.                   (2)
```

이는 I의 양 끝까지 포함한 추론이다. 처음부터 |eta|<=1에서만 성립하는 B>=D를 가정하지 않는다.

원본 압력의 부호를 유지해야 한다. 압력은 `P0=-K/2`에 양의 전체 외부 스케줄 적분을 곱한 음수 함수다. 초기 무한 구간만 사용해도 `|P0|>=(5/2)K(1+eta^2)^-2>2K`이다. 각 단계의 η 인자는 `(1+eta^2)^(-2theta)`, 0<=theta<=1이므로 P0_eta의 부호는 eta의 부호와 같다. (2)에서 d>0이므로 `-d P0_eta>=0`이다.

원본 `actual-continuation-exact-core.mjs`의 Zstar는 정확히

```
Zstar=-A(1-2eta Ustar)Ustar-4Hstar
       -d P0_eta+4A eta P0, A=1/2+h.
```

압력 이외 두 항의 절댓값 합은 26j 미만이다. (2), A>1/2와 위 압력 하계를 적용하면

```
Zstar>=(4/5)Kj-26j>(1/2)Kj,                            (3)
```

이다. 마지막 흡수에는 실제 K=exp(4T)>1024만 사용한다. negative eta와 negative P0의 곱을 잘못 음수로 취급하지 않는다.

u0_Y=-L^-1 Zstar/2와 epsilon<j/16에서 `|u_Y|>Kj/8`이다. 또한 실제 g=exp(Lambda psi)/C에 대해 |Lambda psi|<=Q^65, log C>=Q^200이므로 g<C^-1/2이다. X>=4/Lambda와 Phi<=2를 사용하면

```
|bs_n|>=Kj sqrt(C)/(8 sqrt(Lambda))>4.                 (4)
```

실제 Qj^2>1에서 j>Q^-1/2>Q^-1, C>Q^200, sqrt(Lambda)=Q^32이므로 (4)의 하계는 Q^67/8보다도 크다. a_n>0이므로 `vs_n=a_n+bs_n^2/a_n>=2|bs_n|>8`이다. (1)과 합쳐

```
vs_n>2+1/64  on 4<=Y<=4.1, eta in I.                 (5)
```

χ=0을 나눗셈으로 제외하지 않는다. 그 경우는 (2)–(4)에서 그대로 처리된다.

## 3. 원래 왼쪽 끝점은 실제 B.26 구간에 있다

다음 고정 근방을 사용한다.

```
t1/9<=y=log(X/Xa)<=t1/7.
```

이 구간은 원래 끝점 y=t1/8을 내부에 포함한다. t1<1/10000이므로 `4<=Y=4exp(y)<4.1`이다. 이곳은 원래 B.22 시작 y=t1보다 왼쪽이므로 reference의 F,U와 모든 core moment 이력이 같은 natural 함수다. 원래 B.26의 beta=1, blend=0이며 실제 κ는

```
kappa=t1+(1-t1)(1-sigma(y/t1)).
```

이다. square-seed cutoff의 식에서 0<=s<=1/7일 때

```
sigma(s)<=exp(4)exp(-1/s^2)<=exp(-45)<2^-40=:e.
```

따라서 1-e<=κ<=1이다. 실제 보존 항등식 `source.p1=-2X F_X/F=a_n`, `source.ns=-2U_X`를 실제 B.26 제어 식에 넣으면

```
a_B=κ a_n,
(U_B)_X=κ (U_n)_X,
E_B/E_n=exp(1/2 integral_0^y (1-κ(s))a_n(s) ds).
```

이 마지막 실제 비율은 1과 exp(16t1 e) 사이에 있다. B.26의 U 값이 natural U 값과 같다고 가정하지 않고, 실제 반경 도함수 식만 사용한다. 따라서

```
vs_B=κ[a_n+(E_n/E_B)^2 bs_n^2/a_n]
     >=κ exp(-32t1 e)vs_n
     >=(1-e)^2 vs_n>2+1/128.                           (6)
```

마지막 부등식은 t1<1/10000, exp(-v)>=1-v와 (5)에서 나온 정확한 유리수 흡수다. B.8 bump 지지는 x>=6/2048인 훨씬 오른쪽에 있으므로 이 왼쪽 근방의 실제 E/U에는 B.8 보정이 없다. loop 생산자의 실제 smooth_piecewise ancestry를 별도 원본 probe가 비교한다.

## 4. 원래 오른쪽 끝점의 실제 power 구간

오른쪽에서는 `T+5/2<=y=log(X/XR)<=T+7/2`를 사용한다. 원래 끝점 y=T+3은 이 구간의 내부다. 원본 entry가 끝나는 y=T+2 뒤이므로 실제 E는 정확히

```
E=Keta exp[-7/10-T/2-lambda/2
            -(1/2+lambda)(y-T-2)].
```

이다. 원본 axial tail의 첫 smooth_piecewise branch는 pulse 이전에 정확히 0이며 pulse 시작은 `Xp=XR exp(T+2+60BOuter)`, BOuter=1000T다. 따라서 이 오른쪽 근방에서 실제 U=0, U_X=0이고

```
a=vs=2+2lambda.                                        (7)
```

이다. 원본 probe는 이 실제 power 몸체, zero-tail branch와 pulse 시작 식까지 비교한다. ideal 참조장을 실제 outer 장으로 바꿔 넣지 않는다. Q는 정확히 `2^260 K/sigma^2`이고 sigma=h^4/2000, h=exp(-8002T)이므로 Q>exp(64020T)이다. λ=exp(-1000T)>Q^-1>S^-1이다. (6),(7)에서 두 collar 모두 `vs-2>S^-1>delta`이다.

## 5. 원래 radial zero extension의 결론

실제 loop cutoff는 vs>=2+delta/4이면 ζ=0이다. 따라서 두 실제 끝점의 고정된 근방에서 r=0, 선택된 분산근 mu=0이다. 이때 circle density는 1/(2pi), 역 lift는 2pi·phase이고 원래 평균을 뺀 A/B primitive가 정확히 0이다. 그러므로 반경 경계에서 0으로 연장한 A와 B는 모든 고정 혼합 차수에서 매끄럽다. cutoff값이 작다는 수치 주장이 아니라 끝점 근방에서 함수가 정확히 0이라는 결론이다.

이 정리는 끝점 collar만 해결한다. 실제 B.8 축약근의 존재, 전체 preloop E/a/S 경계, 분산근·circle inverse 정칙성과 함께 조합해야 실제 C.1 전체 정칙성을 얻는다. C.12 이후나 최종 g21 전체의 의무 수를 이 문서 하나로 변경하지 않는다.
