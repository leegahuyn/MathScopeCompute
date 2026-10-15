# 원본 B.8 실제 유입 부채, 같은 연속 행렬의 축약근, E/a 양성

이 증명은 원래 natural 급수, B.22 참조 이력, 실제 B.26, B.34, 축방향 복원으로부터 유입되는 다섯 모멘트 자체를 평가한다. `incomingPreconditionedBound=10^-8`라는 생산자의 선언을 가정하지 않는다. 행렬을 유리수 전조건자로 교체하지 않으며, 원래 양수 h와 무한 natural 급수를 유지한다. 이 부분정리의 결합으로 원본 Guard/Jet/PDE 소거 수를 올리지는 않는다.

고정 정의의 SHA-256은 `c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b`, 원본 pregluing 파일의 SHA-256은 `7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3`이다. 다음 실제 증명을 입력으로 쓴다.

- `ACTUAL_NATURAL_PROOF_KO.md`: 계수노름 Q, 정상수렴, 실제 Phi의 하계 1/4 및 실제 압력 경계.
- `ACTUAL_NATURAL_RADIAL_POSITIVITY_KO.md`: 같은 실제 Phi_Y<0 및 명시적 t=Lambda^-1의 2차 오차.
- `ACTUAL_B26_RADIAL_POSITIVITY_KO.md`: 실제 참조 Qs>=1/2, Qs<Q^65, 실제 B.26의 E>0와 적분 경계.
- `ACTUAL_B34_RADIAL_POSITIVITY_KO.md`: 실제 B.34 식, 폭 Q^90, |ellI|<Q^66, 양 끝의 모든 차수 접합.

검증기는 이 네 입력의 스키마·같은 원본 해시·필요한 실제 경계를 검사한다. B.34가 소비한 B.26 영수증의 바이트 해시도 현재 입력과 일치시킨다. 이는 이미 작성된 해석 증명을 합성하는 검사이며, JSON의 참 플래그 자체를 해석 증명의 대용으로 삼는 것은 아니다.

## 1. 실제 원본 식과 축방향 끝값 Gi

영역은 I=[-33/32,33/32]이다. 아래의 Keta는 압력 규모 K=Pstar^2와 구분한다.

```
c=4eta, Keta=Pstar/(1+eta^2)>1/3,
j=h^4, muMoment=h^2, Lambda=Q^64,
t1=C^(-120), C=CSelected, log C>=Q^200, Q>=2^260.
```

원본 `actual-continuation-exact-pregluing.mjs`의 `sourceFromState`를 사용한다. 참조 모멘트는 정의 그대로

```
M=integral_0^X U(s)ds, I=2 integral_0^X s F(s)ds,
J=2 integral_0^X s U(s)F(s)ds,
S=integral_0^X (U(s)^2-s F(s)^2)ds,
Cp=integral_0^X F(s)^2 ds, Pi=P0+Cp.
```

같은 함수의 실제 `Ns`와 `ns`는 정확히

```
W=1-2D eta M/X-d M_eta/X,
Ns=-WU+[D(M-eta M_eta)+4h eta S-d S_eta]/X
       +4A eta Pi-d Pi_eta,
source.ns=Ns/L.
```

여기서 A=1/2+h, D=1/2-h, d=1-eta^2, L=1-2h eta^2이다. 특히 나눗셈 전의 Ns와 실제 source.ns를 혼동하지 않는다.

실제 natural 계수노름과 짧은 B.22 참조 적분에서 X<=110에 대해

```
|Uref|<=5, |Uref_eta|<=5, 0<Fref<=2,
|Fref_eta|<=Q^66, |P0|<=4Q, |P0_eta|<=17Q.
```

를 얻는다. 예를 들어 Fref=g f이고 |g_eta/g|=|Lambda zeta|<=Q^65, |f|<=2, |f_eta|<=Q^5이다. B.22에서는 이 로그 도함수를 길이 t1인 양수 cutoff 적분으로 연장하며, 반경 밖에서는 상수로 고정한다. Uref=4eta+j+Lambda^-1 q이고 |q|<=Q^2, |q_eta|<=Q^3이므로 두 U 경계가 유지된다. 이는 실제 참조 이력 전체에 대한 경계다.

모멘트 적분을 직접 평가하면

```
|M|,|M_eta|<=5X, |W|<=24,
|S|<=25X+2X^2, |S_eta|<=50X+2Q^66 X^2,
|Cp|<=4X, |Cp_eta|<=4Q^66 X.
```

따라서 h<1/16, |d|<=1, |A|<1, L^-1<2를 실제 Ns 식에 넣어

```
|Ns|<=3000+40Q+660Q^66<Q^68,
|source.ns|<Q^70                                             (1)
```

을 얻는다. X=0의 몫은 같은 모멘트의 정칙 적분 극한으로 해석한다.

원본 `actualUControl`과 `B26UAt`은 정확히

```
U_y=-1/2 kappa beta X source.ns,  y=log(X/Xa),
Gi=U_natural(4)+integral_0^log(110/Xa) U_y dy.
```

β는 0과 1 사이이고, 이미 증명한 실제 κ 적분은 `integral_Xa^110 kappa dX<111t1`이다. 이때 Xa=4/Lambda<1/2를 사용한다. (1)에서

```
|Gi-c|<=j+2Q^(-63)+56Q^70 t1<2j.                            (2)
```

마지막 엄밀한 흡수는 Q j^2=2^260 K*2000^2>1에 따른 j>Q^-1/2, C>Q^200에 따른 t1<Q^-24000을 사용한다. 같은 부분 적분으로 실제 B.26의 |U|<=6도 얻는다. B.34와 ideal gap의 U는 Gi이고, 원본 `restoredUAt`은 Gi와 c의 cutoff 볼록결합이다. 따라서 복원 끝점까지 |U|<=6이며, X>=Xsep에서는 |U-c|<=2j이다.

## 2. 작은 초기 구간의 실제 다섯 모멘트 오차

다음 양수와 무차원 반경을 둔다.

```
Delta=exp(-Q^200/4), Xsep=110 exp(Q^90),
XR=110(C Pstar)^10, x=X/XR, xsep=Xsep/XR.
```

실제 g=exp(Lambda psi)/C, |Lambda psi|<=Q^65이고 B.26의 전단 적분은 음수가 아니다. 그러므로 natural/B.26의 X<=110에서는 F<=Delta^2, E<=Delta^2이다. B.34의 정확한 로그 식은

```
log E=-log C+y/10+(1-sigma(y/Q^90))ellI+sigma(y/Q^90)log f.
```

이며 |ellI|<Q^66, |log f|<1이다. 따라서 이 전체 구간에서도 E<=Delta^2이다. 원래 XR를 대입하면

```
xsep<=exp(-(5/2)Q^200)=Delta^10.                             (3)
```

원본 `increment`는 logX 변수에서 `[XU,sqrt(2)X^(3/2)E,sqrt(2)X^(3/2)UE,X(U^2-E^2/2),E^2/2]`를 적분한다. 이를 dX 변수로 되돌린다. 초기 구간 0..Xsep에서 원본의 다섯 정규화 차이를 각각 D_M, D_J, D_I, D_S, D_P라 쓰면

```
|D_M|<=33 xsep,
|D_I|<=3Delta^2 xsep^(3/2)+xsep^(8/5),
|D_J|<=100Delta^2 xsep^(3/2),
|D_S|<=2000 xsep,
|D_P|<=990Delta^4+(9/2)Q^90 Delta^4+(5/2)Delta^2.             (4)
```

여기서 D_J는 `(dJ-c dI)/(XR^(3/2)Keta^2)`, D_S는 `(dS-2c dM)/(XR Keta^2)`이다. 중심을 빼면 각각 `(U-c)E`와 `(U-c)^2-(E^2-Eideal^2)/2`만 남는다. 따라서 큰 c의 제곱을 오차로 남길 필요가 없다. 압력 행의 첫 항은 `integral_0^110 F^2 dX/Keta^2`, 둘째 항은 `integral_110^Xsep E^2 dlogX/(2Keta^2)`의 경계다. 원본의 축에서 특이한 ideal 압력 적분은 실제 primitive `(5/2)Keta^2 x^(1/5)`로 평가한다. 유한 값을 수치 적분으로 추정하지 않는다.

(3),(4)의 모든 행은

```
epsilon_early=10^4(Q^90+111)exp(-Q^200/2)<Q^-1000<h^3         (5)
```

보다 작다. 첫 부등식은 exponential 급수의 6차 양의 항에서

```
exp(-Q^200/2)<=64*6!*Q^-1200
```

을 사용하고 `10^4*112*64*720<2^260<=Q`로 흡수한다. 마지막 부등식은 위 j>Q^-1/2, h=j^(1/4)에서 따른다. 큰 수를 무한대 또는 0으로 바꾸지 않는다.

Xsep 이후에는 실제 E가 ideal E=Keta x^(1/10)과 정확히 같다. 원본 복원이 끝나는 x=exp(-7)<1까지 (2)를 양의 모멘트 가중치에 적분하면

```
||DU||_infinity<=6j+h^3,
||DE||_infinity<=36j^2+h^3.                                 (6)
```

DU의 두 행은 M 및 중심 J, DE의 세 행은 I, 중심 S, Cp이다. 후반 I/Cp 차이는 정확히 0이고, 후반 중심 S는 `(U-c)^2` 적분이므로 36j^2 이하다.

## 3. 실제 축약근과 같은 연속 행렬

원본 `certify_symbolic_b8.py`를 새로 실행한다. `actual_b8_native_probe.mjs`는 변경하지 않은 원본 `prepareActualB8Program`을 실행하고, 25개 선형 항과 25개 대각 이차 항을 실제 Gaussian-seed cutoff 도함수 적분과 비교한다. 지지구간은 `[(j+6)/2048,(2j+13)/4096]`, 폭은 1/4096이다. bump는 단위질량으로 재정규화하지 않는다. 같은 원본의 실제 scaledDebt, muMoment, 근의 반경, δE/δU 몸체도 비교한다. 전체 fixed 정의와 진단의 겹치는 원본 노드까지 일치해야 한다.

Python 검증기는 새 연속 적분 구간행렬 A,Qdiag에서 정확한 유리수 전조건자 R를 직접 곱한다. 결과 플래그를 믿는 대신 다음을 분수 구간 연산으로 다시 확인한다.

```
||R||_infinity<2^40, z=||Id-RA||_infinity<1/4,
beta=10^-8, r=10^-6, mu<=2^-400,
beta+zr+mu||R Qdiag||r^2<r,
z+2mu||R Qdiag||r<1/4.                                     (7)
```

실제 mu=h^2, h=exp(-8002T), T>1이므로 `mu<2^-16004<2^-400`이다. 더구나 (6)을 원래 양수 mu로 나누고 j=h^4를 그대로 대입하면

```
||R scaledDebt_U||<=2^40(6h^2+h)<10^-8,
||R scaledDebt_E||<=2^40(36h^6+h)<10^-8,                     (8)
```

이다. h<2^-200만으로도 마지막 두 부등식이 성립한다. 부채가 0이라는 가정은 없다.

(7),(8)은 원본 사상 `z -> z-R(Az+mu Qdiag(z_j^2)-rhs)`가 실제 r 공을 보존하고 1/4 미만으로 축약함을 증명한다. 따라서 같은 원본 연속 행렬의 유일한 근이 있다. 이것은 R를 A^-1이라고 부르는 주장이 아니다. A의 한 항을 0으로 바꾸는 음성 대조군은 (7)을 실패시킨다.

모든 실제 입력은 natural 정상수렴, 앞선 flat 접합과 유한 적분에 의해 η의 열린 근방에서 C∞다. 근의 z 미분은 (7)에서 가역이다. 각 η에서 암시함수 정리를 적용하고 근의 유일성으로 이어 붙이면 같은 실제 근은 I의 열린 근방에서 C∞다. 유한한 근 반복을 정확한 근이라고 바꾸지 않는다.

## 4. 실제 B.8 보정 후 E와 a

실제 bump 지지구간에서는 이미 B.34가 끝나 Eideal=Keta x^(1/10)이다. 이는 `log(X/110)=10log(C Pstar)+log x>Q^90`와 원래 C의 값에서 따른다. xmin=6/2048>2^-9이므로 Eideal>=Keta/2이다.

원본 square-seed step σ에 대해 |σ'|<256이다. 0<s<=1/2에서 σ<=81 exp(-1/s^2), v=2(s^-3+(1-s)^-3)를 쓰면

```
|sigma''|<=81 exp(-1/s^2)(8s^-6+6s^-4+608)
          <=81(8*6+6*2+608)<2^16<2^2048.
```

여기서는 exp(u)>=u^3/6 및 exp(u)>=u^2/2를 사용한다. 나머지 절반은 반사대칭, 끝점은 flatness로 처리한다. 따라서 높은 차수에 대한 가정을 이 저차 양성 평가에 끌어오지 않는다.

원본 δE=Keta mu sum_(j=2)^4 z_j σ'((x-left_j)/width)이고 x/width<=21이다. η를 고정하여 y=logX로 미분하면

```
|deltaE|/Eideal<=6mu r 2^2048=:e0<1/100,
|deltaE_y|/Eideal<=126mu r 2^2048=:e1<1/100.
```

따라서 같은 실제 보정 함수는

```
E=Eideal+deltaE>Keta/4>0,
a=1-2E_y/E >=(4/5-e0-2e1)/(1+e0)>3/4.                    (9)
```

이다. bump 지지 밖에서는 δE=0이다. 모든 bump가 flat하므로 양 끝의 모든 반경·η 혼합 차수 접합도 유지한다.

이로써 실제 B.8 입력 부채와 근, 그 보정구간의 E/a 양성을 증명했다. 전체 C.1의 원래 S 전역 경계와 양 끝 collar의 `vs-2>=S^-1`, 이후 C.12/C.2의 실제 입력 및 최종 g21의 모든 압력 구간 적용은 여전히 별도로 증명해야 한다. 이 문서만으로 원본 1,260개 전체가 소거되었다고 선언하지 않는다.
