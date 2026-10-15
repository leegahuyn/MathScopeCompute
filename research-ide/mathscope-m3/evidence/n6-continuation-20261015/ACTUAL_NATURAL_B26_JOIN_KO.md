# 실제 natural/B.26 경계의 모든 차수 미분 일치

대상은 변경하지 않은 원본의 `actual-continuation-exact-core.mjs:prepareActualNaturalCoreProgram`과 `actual-continuation-exact-pregluing.mjs:prepareActualPregluingProgram`이다. 이 문서는 실제 natural 계수 점화식에서 보존형 적분 항등식을 유도하여, 원본 source.p1과 source.ns가 실제 자연해의 반경 미분과 같음을 증명한다. 이를 이용해 X=Xa에서 natural/B.26의 모든 반경·η 혼합 미분이 일치함을 보인다. 유한 차수 점검으로 모든 차수를 추정하지 않는다.

이 증명은 `ACTUAL_NATURAL_PROOF_KO.md`에서 이미 독립적으로 구성한 같은 실제 natural 극한, 모든 고정 차수의 정상수렴, 실제 g>0 및 `Φ>1/4`(0≤Y≤4.1)에 의존한다. 원본 함수나 점화식, 상수는 바꾸지 않는다.

## 1. 실제 함수와 다섯 적분의 정확한 미분

다음은 원본 core 및 pregluing의 실제 정의이다. t는 1/Lambda이고, 원본의 반경 시간좌표와 구별되는 표기이다.

```
Y=Lambda X, t=1/Lambda,
A=1/2+h, D=1/2−h, d=1−eta², L=1−2h eta²,
Ustar=4eta+j, Hstar=D eta+d Ustar,
chi=Hstar²/(Hstar²+sigma²),
zeta=−L Hstar/(Hstar²+sigma²),
g_eta/g=Lambda zeta,
F=g Φ(Y,eta), U=Ustar+t u(Y,eta),
barU=Ustar+t 𝒜u(Y,eta), M=X barU.
```

`(𝒜u)_n=u_n/(n+1)`이므로 모든 n에 대해 `(n+1)(𝒜u)_n=u_n`이다. 정상수렴에 의해 항별 미분하면 `(X barU)_X=U`, 즉 M_X=U이다. 나머지 실제 core moment는 원본의 적분식으로부터

```
I_X=2XF, J_X=2XUF,
S_X=U²−XF², Cp_X=F²,
Pi=P0+Cp, Pi_X=F²
```

를 만족한다. 예를 들어 원본 `I=2g Lambda^-2∫_0^Y yΦ(y)dy`와 `S=t∫_0^Y U(y)²dy−g²t²∫_0^Y yΦ(y)²dy`에 미적분학의 기본정리와 dY/dX=Lambda를 적용한 것이다. η에 대한 모든 고정 차수에서도 같은 식을 미분할 수 있다.

원본의 실제 배경 식은

```
W=1−2D eta M/X−d M_eta/X,
H=D eta+dU.
```

X>0에서 위 moment 미분을 사용하면

```
W+XW_X=1−2D eta U−dU_eta.                                (1)
```

X=0에서는 barU를 사용한 원래 정의로 매끄럽게 연장된다.

## 2. 원본 Φ/u 점화식의 미분방정식

실제 계수 점화식에서 차수 n의 계수를 비교하면 정확히

```
2(YΦ_YY+2Φ_Y)=−chi Φ+tR1,
2(Yu_YY+u_Y)=−L⁻¹ Zstar+tR2,                             (2)
```

이다. 여기서 원본의 실제 식 전체는

```
W=Wstar+t[−2D eta 𝒜u−d(𝒜u)_eta],
H=Hstar+tdu,
p=g²∫_0^Y Φ(y)²dy,
alpha=A(1−4eta Ustar)+4d,
R1=L⁻¹[(W+h(1−2eta U)+du zeta)Φ+WYΦ_Y+HΦ_eta],
R2=L⁻¹[alpha u−2A eta t u²+WYu_Y+Hstar u_eta
         +dt u u_eta−4A eta p+d p_eta−2eta Yp_Y],
Zstar=−A(1−2eta Ustar)Ustar−4Hstar−dP0_eta+4A eta P0.
```

원본의 `p_Y=g²Φ²` 및 `Pi=P0+tp`도 그대로 사용한다. 정상수렴이 (2)를 실제 함수의 등식으로 만든다. `R1/R2`를 이름만 부여한 미지 잔차로 취급하지 않는다.

특히

```
Hstar zeta=−L chi                                          (3)
```

는 실제 같은 양의 분모에서 직접 따른다. Hstar나 eta로 나누지 않으므로 Hstar=0인 점도 포함한다.

F=gΦ, U=Ustar+tu 및 (3)을 (2)에 대입하면 다음 두 실제 식과 동치이다.

```
2L(XF_XX+2F_X)
 =(W+h(1−2eta U))F+XWF_X+HF_eta,                          (4)

2L(XU_XX+U_X)
 =A(1−2eta U)U+HU_eta+XWU_X
   −2eta XF²−4A eta Pi+dPi_eta.                           (5)
```

(4)에서는 `F_eta=g(Φ_eta+Lambda zeta Φ)` 및 `H=Hstar+tdu`를 쓰면 `Hstar zeta` 항이 정확히 −L chi를 만든다. 남는 du zeta 항도 R1에 그대로 들어 있다. (5)에서는 Ustar_eta=4, Pi=P0+tp를 전개하면 상수항이 −Zstar, t에 곱해진 모든 항이 L R2가 된다. p_Y=g²Φ²로 마지막 반경 압력항까지 일치한다.

첨부한 독립 검증기는 (4)/(5)를 (2)로 환원하는 정확한 다항식 항등식을 검사한다. Hstar=0을 제외하는 약분을 사용하지 않는다.

## 3. 각운동량 적분 항등식과 실제 source.p1

원본 sourceFromState의 angular 분자를 그대로 쓴다.

```
Angular=(1−h)I−D eta I_eta−dJ_eta+2(h−D)eta J.
```

다음 차이를 정의한다.

```
Ctheta=Angular−2X²WF+4LX²F_X.
```

I_X=2XF, J_X=2XUF 및 (1)을 적용해 정확히 미분하면

```
(Ctheta)_X
 =2X[2L(XF_XX+2F_X)
      −(W+h(1−2eta U))F−XWF_X−HF_eta]=0.                  (6)
```

마지막 0은 (4)이다. X→0에서 I,J는 O(X²)이고 F,F_X,W는 유계이므로 Ctheta→0이다. 따라서 Ctheta=0이 전 영역에서 성립한다. 원본의 실제 정의는

```
Qs=−W+Angular/(2X²F),
source.p1=X Qs/L.
```

이므로 (6)에서

```
source.p1=−2X F_X/F.                                     (7)
```

이다. source.p1 정의의 X 인자는 필수이다. 검증기는 이 X를 누락한 잘못된 식을 음성 대조로 거부한다. 0≤Y≤4.1에서 실제 F>0이므로 나눗셈은 허용된다.

## 4. 축방향 적분 항등식과 실제 source.ns

원본 sourceFromState는 다음과 같다.

```
Ns=−WU+[D(M−eta M_eta)+4h eta S−dS_eta]/X
       +4A eta Pi−dPi_eta,
source.ns=Ns/L.
```

다음을 정의한다.

```
Cz=−XWU+D(M−eta M_eta)+4h eta S−dS_eta
      +X(4A eta Pi−dPi_eta)+2LXU_X.
```

다섯 moment의 정확한 미분 및 (1)을 적용하면

```
(Cz)_X
 =2L(XU_XX+U_X)−A(1−2eta U)U−HU_eta−XWU_X
      +2eta XF²+4A eta Pi−dPi_eta=0.                     (8)
```

여기서 S_X와 Pi_X에 들어 있는 η 미분 압력항은 서로 상쇄한다. F² 항은 A−h=1/2에 의해 정확히 2eta XF²가 된다. 마지막 0은 (5)이다. 원본의 정칙한 자연계수에서 M,S=O(X), Pi와 U_X는 유계이므로 X→0에서 Cz→0이다. 따라서 Cz=0이다. X>0에서 나누면

```
source.ns=−2U_X.                                         (9)
```

이다. 분모 X의 축 극한을 별도 추정으로 대체하지 않고, 곱해진 보존량의 축 값이 0임을 사용했다.

## 5. 실제 B.26 몸체의 모든 혼합 미분 일치

원본 `y=log(X/Xa)`를 사용한다. 원본 reference는 `X<Xstart=Xa exp(t1)`에서 같은 실제 natural F,U와 같은 다섯 core moment이다. 따라서 어떤 양의 공통 collar, 예를 들어 0≤y≤t1/16에서 (7),(9)가 reference.p1/ns에도 성립한다. 원본 Xb=100이고 Xa<4이므로 yB=log(Xb/Xa)>log25>1이다. 이 collar에서 실제 beta=1, blend=0이다.

원본 κ는

```
kappa(y)=kappa0+(1−kappa0)(1−sigma_step(y/t1))
        =1−(1−kappa0)sigma_step(y/t1).
```

따라서 kappa−1은 y=0에서 모든 차수로 평평하다. 원본 B.26 적분식은 이 collar에서

```
F_B26(y)=gΦ(4) exp[−(1/2)∫_0^y kappa(s) p1_ref(s)ds],
U_B26(y)=U_nat(4)−(1/2)∫_0^y kappa(s) X(s) ns_ref(s)ds.
```

(7),(9)를 사용하여 적분하면 정확히

```
log F_B26(y)−log F_nat(Xa exp(y))
 =∫_0^y (kappa(s)−1) ∂s log F_nat(Xa exp(s))ds,            (10)

U_B26(y)−U_nat(Xa exp(y))
 =∫_0^y (kappa(s)−1) ∂s U_nat(Xa exp(s))ds.                (11)
```

초기값도 원본 그대로 gΦ(4), U_nat(4)이므로 적분 상수는 0이다. natural 함수와 log F_nat는 실제 공통 collar의 열린 근방에서 C∞이다. 매끄러운 함수와 평평한 함수의 곱, 그리고 0에서 시작한 그 적분은 모든 y·η 혼합 미분이 0에서 사라진다. (10)의 지수함수를 취해도 같은 성질을 유지한다. 따라서 모든 유한 k,m에 대해

```
∂y^k ∂eta^m(F_B26−F_nat)|_(y=0)=0,
∂y^k ∂eta^m(U_B26−U_nat)|_(y=0)=0.
```

`∂X=X⁻¹∂y`이고 Xa>0이므로 같은 결론이 모든 X·η 혼합 미분에도 성립한다. E=√(2X)F를 곱하거나 그 매끄러운 양수 계수로 나누어도 동일하다.

매끄러운 좌표 합성과 이들 함수의 유한 미분·적분·대수 연산으로 만든 실제 coefficient도 필요한 분모가 비영인 같은 근방에서 동일한 모든 경계 jet을 가진다. 어떤 계수가 실제로 어느 원본 F/U/v 몸체의 미분·합성인지에 관한 18개 guard lineage는 별도의 원본 AST 검사와 결합한다. 이 문서의 보존 항등식이 이름만 같은 임의의 함수에 적용되는 것은 아니다.

## 6. 검증 범위와 열린 전제

`actual_natural_b26_identity.py`는 원본 두 파일의 고정 SHA-256을 확인하고, (6),(8)의 FTC 전개 및 (4),(5)의 실제 R1/R2 환원을 독립 기호 연산으로 검사한다. 실제 source.p1의 X 인자 음성 대조도 포함한다. 이 검사는 유한 차수 표본이나 수치 격자를 사용하지 않는다.

이미 증명된 실제 natural 정상수렴·양성, 실제 reference의 natural collar 동일성, 원본 κ/beta/blend의 분기값을 결합하면 natural/B.26 자체의 모든 차수 경계 일치 정리는 완료된다. 그 뒤 Picard source coefficient 18개 guard에 적용하는 원본 lineage 검사는 별도 산출물로 확인해야 한다.

이 결론은 B.34/B.8을 거친 전체 C.1 배경의 E/a 양성, 실제 source S의 전체 영역 경계, covariance 행렬의 primitive 정의역, 전체 radial pressure J의 정칙성을 주장하지 않는다. 그 의무는 여전히 열린 상태이다. 따라서 이 파일 자체의 새 원본 Guard/Jet/PDE 소거 수는 0으로 유지하며 새 Lean 형식증명을 실행했다고 주장하지 않는다.
