# 원래 유한 N의 실제 C.12: a_new>0와 vs_new>2

이 문서는 `ACTUAL_C1_C12_REGULARITY_COMPOSITION_KO.md`의 같은 원본 해에 대한 후속 정리다. 원래 loop rectangle [Ia,Ib], η∈I=[-33/32,33/32]에서 성립한다. 원래 `S=CSelected^100000`, `delta=exp(-S^16)`, `R=exp(S^256)`, `N=1+ceil(R^50)`를 유지한다. 높은 η 도함수의 역사적 envelope를 가정하지 않는다. 필요한 새로운 입력은 원본 느린 반경 y=logX의 1차 미분 경계뿐이며, 아래에서 실제 원본 식으로 증명한다.

결론은 `a_new>0`, `vs_new>=2+delta/16`이다. 일반적으로 a_new>2라고 주장하지 않는다. 원래 물리 위상 NlogX의 빠른 반경 미분은 계산에 모두 남긴다.

## 1. 실제 배경의 필요한 첫 logX 미분

앞선 실제 preloop 증명은

```
0<E<C^2, E^-1<C^4, |U|<C^2,
|E_eta|,|U_eta|<C^122, |U_X|<C^4,
0<a<C^2, a^-1<C^122,
|bs|<C^34, |p2|<C^220, vs<C^192,
C^-1<X<C^24, C=CSelected>2^2048
```

를 준다. 이 절은 그 경계를 소비하는 실제 도함수 예산이다.

참조장의 F_y,U_y는 C^4보다 작다. natural 부분에서는 Y<=4.1의 정상수렴한 도함수를 직접 사용한다. B.22에서는 `F_y=F cutoff*Y Phi_Y/Phi`, `U_y=cutoff*Y u_Y/Lambda`이며 양의 Phi 하계와 같은 원본 계수 경계를 쓴다. 상수 연장에서는 도함수가 0이다. 참조 모멘트의 η 0,1차를 y로 미분하면 미적분학의 기본정리에서

```
M_y=XU, (M_eta)_y=X U_eta,
I_y=2X^2 F, (I_eta)_y=2X^2 F_eta,
J_y=2X^2 UF, (J_eta)_y=2X^2(U_eta F+U F_eta),
S_y=X(U^2-XF^2), (S_eta)_y=X(2UU_eta-2XFF_eta),
(Cp)_y=XF^2, (Cp_eta)_y=2XFF_eta.
```

따라서 X<=110에서 이 값들은 C^25 미만이다. 참조 F^-1<C^3, X^-1<C와 실제 sourceFromState의 몫을 미분하면 `|(p1ref)_y|,|(nsref)_y|<C^100`이다. 이 계산은 F_eta,y 또는 U_eta,y를 요구하지 않는다.

원래 κ, beta, blend의 폭은 모두 t1=C^-120이다. |sigma'|<256<C이므로 이 세 cutoff의 y 미분은 C^121 미만이다. 실제 B.26의

```
a=(1-blend)kappa*p1ref+(4/5)blend,
U_y=-(1/2)kappa*beta*X*nsref
```

를 한 번 미분한다. 실제 p1ref,nsref<C와 위 참조 source 미분 경계에서 `|a_y|,|U_yy|<C^200`을 얻는다. 실제 X 인자와 cutoff 폭을 빠뜨리지 않는다.

B.34에서는 `a=4/5+2 sigma'(y/Q^90)(ellI-logf)/Q^90`를 한 번 더 미분한다. |ellI|<Q^66과 아래 sigma'' 경계로 |a_y|<1이다. U는 Gi이므로 U_yy=0이다. 복원 U=Gi+(4eta-Gi)sigma(log(X/XR)+8)의 U_yy도 고정 cutoff의 sigma'' 경계로 C^2보다 작다.

B.8에서는 원래 actual root z가 η에만 의존하며 X 미분은 bump에만 작용한다. 필요한 sigma'''의 유한 경계를 직접 증명할 수 있다. v=2(s^-3+(1-s)^-3)에 대해

```
sigma'''=sigma(1-sigma)[(1-6sigma+6sigma^2)v^3
                     +3(1-2sigma)vv'+v''].
```

0<s<=1/2에서 sigma<=81 exp(-1/s^2)이므로

```
|sigma'''|<=81 exp(-1/s^2)
 [32s^-9+36s^-7+24s^-5+288s^-4+576s^-3+21760]
 <81[32*240+36*24+24*6+288*2+576*2+21760]<2^22.
```

여기서는 exp(u)>=u^k/k!, u=1/s^2>=1를 사용한다. 나머지는 반사대칭과 끝점 flatness다. 따라서 같은 실제 B.8 지지에서 x/width<=21과 mu=h^2<2^-16004, |z|<=10^-6를 사용하면 δE/Eideal, δE_y/Eideal뿐 아니라 δE_yy/Eideal도 1/100보다 작다. `a_y=-2(logE)_yy`에서 |a_y|<C^10, 그리고 |U_yy|<C^4가 나온다. 큰 매개변수에서의 step 고차 도함수 envelope를 가정하지 않는다.

outer에서는 a가 4/5+6sigma/5 또는 2 또는 2+2lambda sigma 또는 2+2lambda이므로 |a_y|<C다. 실제 axial k의 log(1+s)/Md 합성은 s>=0, Md>1, |sigma'|<256, |sigma''|<2^16에서 |U_yy|<2^20<C다. loop rectangle은 pulse보다 앞이므로 이후 실제 axial tail은 정확히 0이다. 각 접합의 모든 차수 일치가 앞서 증명되었으므로 같은 경계는 경계점에서도 성립한다.

이 실제 branch들을 합치면 |a_y|,|U_yy|<C^200다. `E_y/E=(1-a)/2`와 `bs=2U_y/E`에서

```
|bs_y|=|2U_yy/E-bs E_y/E|<C^205.
```

실제 loop 모멘트의 y 미분도 위 미적분학의 기본정리 공식을 E,U로 쓰면 된다. η 1차까지의 실제 모멘트와 그 y 미분은 C^180 안에 들어간다. W와 W_y는 C^184 미만이며 |U_y|=|XU_X|<C^28이다. 정확한 Ns 식을 y 미분하면 가장 큰 W U_y도 C^213 미만이므로 `|Ns_y|<C^230`이다. 실제 p2=X Ns/(L E)를 미분하여 `|p2_y|<C^260`을 얻는다. L은 y와 독립적이다. 이로써

```
|a_y|, |bs_y|, |p2_y| < C^600 < S.                     (1)
```

실제 p2를 E_eta로 바꾼 계산이 아니다. 필요한 η 미분은 이미 증명한 1차뿐이다.

## 2. 실제 loop의 느린 y 미분은 원래 R보다 작다

이 절에서 y 미분은 원래 phase q를 고정한 미분이다. 실제 a^-1,vs,|p2|<=S에서 a<=S, |bs|<=S, |ts|=|bs/a|<=S^2이며 (1)로 |ts_y|<S^5, |vs_y|<S^6다.

실제 ζ의 전환 폭은 delta/8이다. 따라서 `|zeta_y|<=2048 delta^-1 |vs_y|`다. sqrt가 실제로 평가되는 지지에서는 `vStar-vs>=delta/4`, `rBase<=2S`이다. 실제 `r=zeta sqrt((vStar-vs)/a)`를 미분하면

```
|r_y|<=2^16 S^10 exp(S^16)<exp(S^18).                  (2)
```

지지 밖에서는 r=0이고 flat한 전환 때문에 같은 경계다. sqrt를 음수 영역에서 평가하지 않는다. 또한 vTarget의 도함수에서는 전환 폭이 상쇄된다. 전환 중 |vStar-vs|<=delta/2이므로

```
|(vTarget)_y|<=2049 |vs_y|<S^7.                         (3)
```

실제 분산근은 0<=mu<=S^12, |mu p2|<=S^13을 만족한다. 앞선 원본 정리의 `W_mu>=exp(-S^14)`를 사용한다. 필요한 W_p 경계도 실제 scalar 식에서 얻는다. |M^(k)(z)|<=exp(|z|), M(z)>=exp(-|z|)이므로 |R'''(z)|<=192 exp(10|z|)이고 |Q'(z)|<=192 exp(10|z|)이다. 양의 tilted variance 증명은 Q(z)>=(1/2)exp(-4|z|)를 준다. 따라서

```
|W_p|=d0 mu^2 |Q'(mu p)|/(2sqrt(Q(mu p)))
       <256S^24 exp(12S^13)<exp(S^22).
```

실제 implicit 식 W(mu,p2)=r와 (1),(2)에서

```
|mu_y|<=exp(S^14)(|r_y|+|W_p p2_y|)<exp(S^24).         (4)
```

p2=0 또는 mu=0에서도 같은 Q와 실제 implicit 미분을 사용한다.

정규화 tilt를 f_z(theta)=exp(z sin theta)/M(z)라 쓰자. 실제 tilted 평균에서 |(logM)'|<=1, 0<=(logM)''<=1이므로

```
|f_z|<=exp(2Z), |partial_z f_z|<=2exp(2Z),
|partial_z^2 f_z|<=5exp(2Z), Z=S^13.
```

실제 `t=ts+d0 mu integral_0^1 partial_z f_(s mu p2) ds`를 미분하고 (4)를 넣으면 `|t|<exp(S^14)`, `|t_y|<exp(S^26)`이다. 실제 원형 density `rho=a(1+t^2)/(2pi vTarget)`를 (1),(3)과 함께 미분하면 `|rho_y|<exp(S^28)`이다.

실제 phase q∈[0,1]에서는 0<=Theta<=2pi, rho>=1/(16S^2)다. 따라서 `|Theta_y|<=16S^2*2pi sup|rho_y|<exp(S^30)`이다. A/B를 원래의 고정 적분구간과 실제 weighted mean 식에서 미분하면

```
|A|<=S, |A_y|<exp(S^32), |B_y|/E<exp(S^36).             (5)
```

B_y/E에는 실제 E의 미분도 포함한다. 구체적으로 B/E의 식을 미분한 뒤 `(E_y/E)(B/E)`를 더하며, B/E 및 고정 적분 primitive는 exp(S^18)보다 작다. 모든 integrand의 y 미분, 움직이는 Theta 끝점의 t(Theta)Theta_y, weighted mean의 rho_y 항을 포함한다. A의 mean 미분도 `integral(A0_y rho+A0 rho_y)`를 유지한다. 유한 양의 항들의 로그 상계를 모으면 (5)의 여유 있는 지수 안에 들어간다. 주기성은 y 미분 후에도 유지되므로 (5)는 모든 실수 phase에 대해 성립한다.

여기서 쓰는 유한 지수 흡수는 모두 `S>=2^20`, `logS<=S`에서 나온다. 예를 들어 `c S^p+d logS+e<S^(p+2)`는 p>=1이고 c+d+e<2^40이면 성립한다. 검증기는 이 유한 예산을 따로 확인한다. R=exp(S^256)를 새로 키우지 않는다. (5)와 실제 t 경계에서 다음 모두가 원래 R보다 작다.

```
|A|, |A_y|, |B_y|/E, aBar^-1, |bBar| < R,
aBar=vTarget/(1+t^2)>0, bBar=-aBar*t.                   (6)
```

## 3. 원래 빠른 위상 미분의 정확한 주항

원래 식은

```
A=(a/2)(q-Theta/(2pi))-meanA,
B=(Ea/2)(ts*q-(1/(2pi))integral_0^Theta t)-meanB.
```

실제 inverse-circle 식은 `Theta_q/(2pi)=vTarget/[a(1+t^2)]`를 준다. meanA/B는 q에 의존하지 않는다. 따라서 정확히

```
2A_q=a-aBar,
2B_q/E=a ts-aBar*t=-bs-aBar*t,
aBar+bBar^2/aBar=vTarget.                              (7)
```

이것은 유한 N 전개의 근사 항등식이 아니다. 검증기가 원본 A/B 몸체의 정확한 유리식 항등식을 독립적으로 검사한다.

원래 q=NlogX를 대입하고 y로 미분하면 실제 C.12 함수는

```
aNew=a-2A_q-2A_y/N=aBar-2A_y/N,
bsNew=(bs+2B_q/E+2B_y/(NE))*exp(-A/N)
     =(bBar+2B_y/(NE))*exp(-A/N).                       (8)
```

이다. 빠른 위상 도함수를 버리면 (7),(8)이 성립하지 않는다. 그 변조를 음성 대조군이 거부한다.

## 4. 원래 N이 실제 오차를 흡수함

원래 cutoff의 정의에서 vTarget>=2+delta/8이다. vs<=2+delta/8이면 ζ=1이므로 vTarget=2+delta/2다. 전환 구간에서는 vTarget이 vs와 vStar의 볼록결합이라 이 하계를 유지하고, 그 오른쪽은 vTarget=vs>=2+delta/4다.

(6),(8), N>R^50에서

```
|aNew-aBar|<=2R/N,
|bsNew-bBar|<=4R^2/N,
aNew>=aBar/2>0.
```

실제 exponential을 선형식으로 교체하지 않는다. |A|/N<1/2에서 `|exp(-A/N)-1|<=2|A|/N`를 사용한 부등식이다. |bsNew|<2R, aBar^-1<R, aNew^-1<2R이므로

```
|vsNew-vTarget|
 <=|aNew-aBar|+|bsNew^2-bBar^2|/aNew
      +bBar^2 |aNew-aBar|/(aNew*aBar)
 <=30R^5/N<R^-44<delta/16.                              (9)
```

여기서 S>=2^20이므로 원래 R=exp(S^256)>30이고, 따라서 N>R^50에서 `30R^5/N<30R^-45<R^-44`이다. 마지막 delta 부등식은 44S^256>S^16+4, exp(4)>16에서 나온다. 따라서 실제 원래 유한 N과 실제 비선형 exponential을 유지한 채

```
Enew>0, aNew>0, vsNew>=2+delta/16>2
```

를 얻는다. 끝점 collar에서는 A/B가 근방에서 정확히 0이므로 이전 실제 배경의 더 큰 여유가 유지된다. 모든 경계는 I와 원래 rectangle에서 균일하고 엄격하므로 같은 해의 공통 열린 근방으로 확장된다.

이 정리는 실제 C.12 구간에 대한 전단·성장 radicand의 양성 입력을 준다. aNew>2, 이후 I.1/I.2 보정 전체 적용, 최종 g21의 모든 원본 압력 구간 정칙성 또는 전체 원본 Guard/Jet/PDE 소거를 자동으로 주장하지 않는다.
