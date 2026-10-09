# P¹의 completed Čech–de Rham 비교 모델: 정확한 계산 범위

## 1. 기하와 환

첫 base는 bounded crystalline prism `(A,I)=(Z_p,(p))`이다. 계수 Frobenius lift는 `phi_A=id`이며 `delta(a)=(a-a^p)/p`이다. 계산 화면의 `A/p^N`은 이 base의 유한 관측이다. Cartier, p-adic completeness 및 prism 조건은 이 표준 base의 적용 가정으로 기록하고 유한 관측 자체를 새 prism으로 승인하지 않는다. [S01, Definition 1.1, Example 1.3(1), Definition 1.4]

`X=P¹/F_p`는 `P¹/Z_p`라는 smooth proper lift를 가진다. 그 두 affine chart를 t와 s로 쓰며 겹침에서 `s=t^(-1)`이다. p-adic completed Čech–de Rham complex는 이 lift의 de Rham hypercohomology를 계산한다. S02의 Theorem 3.6/Corollary 3.8을 적용하면 special fiber의 crystalline cohomology를 얻고, S01의 Theorem 1.8(1)/5.2를 적용하면 Frobenius와 호환되는 prismatic 비교를 얻는다. S01의 completed coefficient base change는 `phi_A=id`를 따라가므로 현재 base에서는 계수 twist가 identity다.

이 두 기하 비교는 원문 정리의 적용 기록이다. 이 프로젝트에 S01/S02의 실제 exported Lean theorem은 없다. 아래 행렬·weight 증명과 혼동하지 않도록 각 비교 edge의 등급은 `THEOREM_REFERENCE`이다.

## 2. 정수 복합체와 D=1 golden fixture

각 D≥1에서 함수는 chart당 차수 0…D, chart 1-form은 차수 0…D−1, overlap 함수는 Laurent 지수 −D…D, overlap 1-form은 지수 −D−1…D−1을 쓴다. 함수의 weight는 지수, `t^j dt`의 weight는 j+1이다. 따라서 전체 total differential이 각 weight를 보존한다.

차원은 `dim C⁰=2D+2`, `dim C¹=4D+1`, `dim C²=2D+1`이다. convention은 다음과 같다.

```text
d0(f0,f1) = (df0,df1,f1-f0)
d1(omega0,omega1,g) = omega1-omega0-dg
s^j ds = -t^(-j-2) dt
```

D=1에서 기저는 다음과 같다.

```text
C0: (1,t ; 1,s)
C1: (dt ; ds ; t^-1,1,t)
C2: (t^-2 dt, t^-1 dt, dt)

d0 = [[ 0, 1, 0, 0],
      [ 0, 0, 0, 1],
      [ 0, 0, 0, 1],
      [-1, 0, 1, 0],
      [ 0,-1, 0, 0]]

d1 = [[ 0,-1, 1, 0, 0],
      [ 0, 0, 0, 0, 0],
      [-1, 0, 0, 0,-1]]
```

곱 `d1*d0`는 정수에서 0이다. d0와 d1의 비영 Smith 인자는 각각 `(1,1,1)`, `(1,1)`이다. 일반 D에서도 크기 `2D+1`, `2D`의 signed permutation unit minor를 명시한다. d0의 diagonal constant kernel과 d1의 영행으로 rank 상한이 일치한다. 최종 cohomology 결론은 rank 계산만으로 얻지 않고 다음 integral strong deformation retract를 사용한다.

## 3. 모든 nonzero Laurent weight를 제거하는 homotopy

각 nonzero weight k의 복합체는 `A → A² → A`이다. 두 chart에서 변환한 부호를 포함하면 다음 공식이 된다. 이 항등식에는 k의 역원이 없다.

| weight | a(x) | b(u,v) | h1(u,v) | h2(w) |
|---|---|---|---|---|
| k>0 | `(kx,-x)` | `-u-kv` | `-v` | `(-w,0)` |
| k<0 | `(-kx,x)` | `-u-kv` | `v` | `(-w,0)` |

양의 경우 `h1*a(x)=x`, `b*h2(w)=w`이며

```text
a*h1(u,v) + h2*b(u,v)
  = (-kv,v) + (u+kv,0)
  = (u,v).
```

음의 경우에도 `a*h1(u,v)=(-kv,v)`이므로 같은 중간 항등식이 성립한다. 또한 두 경우 모두 `b*a=0`이다. Lean의 `positive_weight_contractible`과 `negative_weight_contractible`은 임의 commutative ring과 임의 ring element k에서 이 항등식을 증명한다. 따라서 p|k인 경우도 포함된다.

weight 0의 함수 부분은 `(a,b) → b-a`이다. `i0(a)=(a,a)`, `r0(a,b)=a`, `h1(c)=(0,c)`를 사용하면 diagonal constant 한 개가 남는다. overlap의 `dt/t`는 degree 2에서 살아남는다. 따라서 영미분 complex

```text
K: A[degree 0] ⊕ A[degree 2]
basis: 1, [dt/t]
```

에 대해 `r*i=id_K` 및 `id_C-i*r=d*h+h*d`이다. 유한 D의 i/r/h는 코드에 sparse matrix로 저장되어 정수와 각 mod p^N에서 검사된다. 이 구성은 underlying A-module complex를 다룬다. product에 닫히지 않는 cutoff를 사용했으므로 별도 인증 없이 multiplicative 또는 E-infinity formality를 주장하지 않는다.

## 4. 유한 cutoff에서 completed model로 가는 이유

polynomial/Laurent coefficient direct sum의 p-adic completion은 다음 성질을 가진 restricted coefficient family다: **모든 N에 대해 mod p^N에서 비영인 weight가 유한 개**다. chart마다 위 공식을 weight별로 적용한다.

h/i/r의 계수는 항상 0,1,−1이다. d는 ±k를 곱할 수 있으나 정수 k의 p-adic valuation은 음수가 아니다. 따라서 이 연산들은 모든 N에 대해 p^N으로 나누어지는 꼬리를 p^N으로 나누어지는 꼬리로 보낸다. 제한된 계수 family를 보존하므로 p-adic completion에 연속적으로 확장된다. 각 mod p^N에서 공식을 유한하게 확인할 수 있고, 항등식은 각 coefficient에서 성립하므로 separated inverse limit에서 성립한다. 이로써 D 밖에 있는 전체 weight도 contractible이다.

Lean은 restricted integer coefficient family에 대한 음수·합·정수 weight 곱·선택의 닫힘과 각 precision layer에서의 항등식이 family equality를 준다는 정리를 포함한다. 실제 Z_p의 completed formal-scheme complex 전체와 S01/S02 비교의 Lean 형식화는 별도 작업이다. **현재 수학적 완료 모델 인증은 명시된 연속 확장 논증과 원문 비교정리를 포함하며, 그 전체를 커널 정리 하나로 표시하지 않는다.**

D=1,2,5에서 Betti 수가 같다는 실험은 이 완료 논증의 대체물이 아니다. 구현은 전체 contraction certificate가 삭제되면 P¹ 비교 모델 승인을 거부한다.

## 5. Frobenius는 C(D)에서 C(pD)로 간다

두 chart에서 t↦t^p, s↦s^p를 사용한다. 함수와 1-form의 pullback은 다음과 같다.

```text
F(t^j)    = t^(p*j)
F(t^j dt) = p*t^(p*(j+1)-1) dt
```

이는 overlap Laurent 지수에도 적용된다. 입력의 |weight|≤D가 |weight|≤pD로 이동하므로 target은 C(pD)이다. `d_target F = F d_source`를 정수에서 검사하고, 계수 semilinearity는 현재 base의 `phi_A=id`에 대해 기록한다. 일반 coefficient Frobenius는 이 backend의 지원 범위에 포함되지 않는다.

transported endomorphism `r_target F i_source`는 degree 0에서 1, degree 2에서 p이다. `F(dt/t)=p dt/t`와 일치한다. Frobenius는 정수 계수이므로 p-adic 입력 자릿수를 소비하지 않는다. H² generator에 p를 곱하는 것은 p-adic valuation을 올리는 동작이다.

모든 crop이 반드시 chain-map 항등식을 깨뜨리는 것은 아니다. whole-weight projection은 chain map으로 남을 수 있다. 따라서 잘못된 동일-D map은 **기하 pullback의 source/target 계약**에서 먼저 거부한다. 별도로 chart의 image 일부만 삭제하는 비대칭 crop 음성 fixture는 실제 chain-map 항등식도 깨뜨린다.

## 6. derived precision에서 꼭 보존하는 반례

`delta(a)=(a-a^p)/p`를 mod p^N으로 출력하려면 입력 numerator를 mod p^(N+1)으로 알아야 한다. p=3,N=3에서 a=0과 a=27은 mod27에서 같지만 delta mod27은 각각 0과 9다. 추가 digit 없이 delta의 N자리 답을 결정할 수 없다. 정확한 정수 원본이 있을 때만 그 원본과 기존 residue의 일치를 검사하고 N+1자리로 올린다.

`C=[Z_p --p→ Z_p]`는 bounded free complex다. 이를 derived mod p로 내리면 미분이 0인 `[F_p → F_p]`가 되어 H⁰와 H¹이 모두 F_p다. 원래 H⁰=0을 먼저 tensor하면 degree 0의 기여를 잃는다. 일반 free complex의 base change도 cohomology를 먼저 계산하지 않고 termwise tensor한다. 원본 d²와 대상 d²를 각각 원래 coefficient ring에서 확인한다.

## 7. 국소 인자와 소수 집합의 연결

P¹의 두 surviving Frobenius determinant는 `(1-T)`와 `(1-pT)`이므로 scheme zeta local factor는 `1/((1-T)(1-pT))`다. 작은 p에서 nonzero F_p²의 scalar orbit을 직접 세어 `p+1=Tr(F|H⁰)+Tr(F|H²)`와 비교한다. trace/determinant의 cohomological convention은 S07의 (1.5.1)–(1.5.4)에 따른다.

타원곡선 good fiber에서는 직접 점계수로 `a_p=p+1-#E(F_p)`를 얻고 S08의 good Euler factor `1/(1-a_pT+pT²)`를 기록한다. 이 값은 직접 계산한 integral prismatic matrix가 아니므로 그 구별을 결과에 명시한다. singular nonminimal model과 curve bad reduction의 구별은 S14의 Weierstrass coordinate transformation을 사용한다.

소수 p는 family의 지표이며 각 p에서 계수환이 다르다. 요청한 유한 prime 목록에 대한 국소 인자와 N별 tower를 제공할 뿐, 미계산 소수·bad factors·conductor를 채운 무한 전역 L 함수를 인증하지 않는다. 이 구현은 finite-field trace 관계를 classical RH나 일반 BSD의 증명으로 이동시키지 않는다.

## 원전

1. **S01** Bhatt–Scholze, *Prisms and Prismatic Cohomology*, Definition 1.1, Example 1.3(1), Definition 1.4, Theorem 1.8(1), Theorem 5.2. https://people.mpim-bonn.mpg.de/scholze/prisms.pdf
2. **S02** Bhatt–de Jong, *Crystalline cohomology and de Rham cohomology*, Theorem 3.6, Corollary 3.8. https://arxiv.org/html/1110.5001v1
3. **S07** Deligne, *La conjecture de Weil I*, (1.5.1)–(1.5.4), pp.275–276. https://www.numdam.org/item/PMIHES_1974__43__273_0.pdf
4. **S08** Wiles, *The Birch and Swinnerton-Dyer Conjecture*, pp.1–2. https://www.claymath.org/wp-content/uploads/2022/05/birchswin.pdf
5. **S14** SageMath, *Isomorphisms between Weierstrass models*. https://doc.sagemath.org/html/en/reference/arithmetic_curves/sage/schemes/elliptic_curves/weierstrass_morphism.html
