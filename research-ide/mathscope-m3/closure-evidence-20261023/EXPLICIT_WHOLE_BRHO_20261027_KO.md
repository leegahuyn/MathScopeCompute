# 명시 구간 I′ 위 원본 natural 급수 전체의 Bρ majorant

이 문서는 첫 Phi₁·u₁만의 상한을 넘어, 원본 B.14–B.15 재귀의 **모든 radial 차수**를 다루는 해석적 증명과 정확한 유리수 상수 검사를 기록한다. 영역은 명시적으로 I′=[−2,2]다. 원본 부록의 미지정 I와 I′를 같다고 가정하지 않는다. native 호출 인자·지지집합, 최종 all-cycle A–D 장, 전역 에너지 또는 M4 합격을 주장하지 않는다.

## 1. 원본과 전제

`original_pressure_u1_coefficients.py`의 전체 graph/registry/producer SHA 검사를 다시 수행한다. 압력 실행 `148b63ed06fa43fad880d8c4f5aedaf3a480bdd4a56f21746e3c0acbdc7697f9`와 원본 JSON bytes를 검사한다. 전체 N3 식의 독립 digest도 검사한다. source는 첫 post-signed FiveMap이며 최종 all-cycle A,b,p와 구분한다.

정확한 양수 h,K,σ,Q,Λ,ρ에 대해 원본 식은 다음과 같다.

`0<h<2^-4096`, `K=Pstar²>1`, `σ=h⁴/2000`, `ρ=σ²/65536`,
`Q=C K/σ²`, `Λ=Q^64`, `C>2^240`,
`CSelected=exp(Q^200)*(1+Q^300)^10`.

C의 원본 정수값을 그대로 검사한다. 따라서 Q>2^32768이고, 20480/ρ<Q, 648/σ²<Q, 4·655360K<Q다. h 또는 σ를 0으로 놓거나 이들을 포함하는 구간을 역수로 취하지 않는다. 위 부등식은 양의 기호식으로 처리한다.

## 2. 공통 복소 tube와 scalar 계수의 norm

기존 Phi₁ 증명의 명시 tube Ω₄={z:dist(z,I′)<4ρ}를 사용한다. 이 집합은 볼록하고 0을 포함한다. 그 폐포에서 |z|<17/8, |H*|≤54, |H*′|≤63, 실수 I′에서 |H*|≤28이다. 고정한 x∈I′에 대해

`|(H*(z)²+σ²)−(H*(x)²+σ²)| < 6000·4ρ < σ²/2`.

H*(x)는 실수이므로 |H*(z)²+σ²|>σ²/2다. 또한 |L−1|<1/2, |L^-1|<2, |L|<2다. 이들은 기존 source polynomial 검사와 유리수 margin으로 확인된다.

핵심 개선은 `χ=1−σ²/(H*²+σ²)`다. 그러므로 Ω₄에서 |χ|<3이다. ζ*=−LH*/(H*²+σ²)이므로 |ζ*|<216/σ²다. 다른 계수는 다음 tube modulus 상한을 갖는다.

| 계수 | 상한 |
|---|---:|
| η | 17/8 |
| d=1−η² | 353/64 |
| U*=4η+j₀ | 19/2 |
| W* | 128 |
| H* | 54 |
| α=A(1−4ηU*)+4d | 256 |
| A,D,h | 1 |

scalar f가 Ω₄에서 |f|≤M이면 Cauchy 부등식으로 `|f^(m)(x)|≤M m!/(4ρ)^m`다. `(m+1)²≤4^m`는 m=0에서 시작하여 다음 비율이 `((m+2)/(m+1))²/4≤1`임을 이용한 귀납으로 모든 m≥0에 성립한다. 따라서 radial degree0 함수의 Bρ norm은 M 이하이다. χ의 scalar norm은 3 이하이고 위 모든 source scalar norm은 Q 이하이다.

## 3. 실제 g의 복소 상한

ζ*는 볼록 Ω₄에서 정칙이므로 ψ(z)=∫₀ᶻ ζ*는 단일값 정칙 primitive이다. 0→x→z 경로의 길이는 2+4ρ<3이고 경로는 Ω₄ 안에 있으므로 |ψ|<648/σ²<Q다. 이 primitive는 원본 실수 적분의 유일한 정칙 확장과 일치한다.

원본 g=exp(Λψ)/CSelected에 대해

`|g|≤exp(Q^65−Q^200)/(1+Q^300)^10<1`.

따라서 같은 tube에서 g가 정칙이고 Bρ scalar norm≤1이다. 실수축에서만 작은 g를 가정한 것이 아니다. 이는 양수 g를 0으로 대체하지 않으며 모든 pressure primitive에서 g²를 유지한다.

## 4. 모든 지수의 연산자 부등식

원본 가중치는

`a(n,m)=20^-n ρ^-m m! binom(n+m,m)/[(n+1)²(m+1)²]`.

각 정수 N≥0에 대해 convolution 합을 i≤N/2와 반대쪽으로 나누면

`sum_i (N+1)²/[(i+1)²(N−i+1)²] ≤8 sum_(j≥1) j^-2 ≤16`.

마지막 부등식은 첫 항1과 integral₁^∞ x^-2 dx=1로 얻는다. Leibniz 계수의 factorial을 소거하고

`binom(i+k,k) binom(n−i+m−k,m−k) ≤ binom(n+m,m)`

를 사용한다. 왼쪽은 크기 i+k와 n−i+m−k의 두 블록으로 나눈 n+m개 원소 중, 첫 블록에서 k개·둘째에서 m−k개를 고른 m-부분집합 수이므로 오른쪽보다 크지 않다. 두 convolution 지수에 위16 상한을 적용하면 **곱셈 상수256**을 얻는다. 이는 유한 샘플만의 검사가 아니다.

`JνF_(n+1)=F_n/[(n+1)(n+ν)]`, ν∈{1,2}이다. 직접 weight 비를 취하면

`a(n,m)/a(n+1,m)≤80`,
`a(i,k+1)/a(i+1,k)≤(80/ρ)(i+1)`.

첫 식은 Jν,I,Y 곱셈 norm≤80을 준다. averaging Aₓ의 norm은1 이하이다. 둘째 식에서 integration divisor i+1을 소거하면 ∂ηI norm≤80/ρ다. Jν∂η도 이보다 크지 않고 JνDX norm≤80이다.

혼합항 Jν[(∂ηF)(DXG)]에서는 extra radial degree를 ∂ηF에 할당한다. N=n+1, I₁=i+1, J₁=n−i로 두면 Leibniz·weight 소거 뒤 추가 비율은

`I₁ J₁/[N(n+ν)]≤1`.

I₁≤N, J₁≤n+ν이므로 모든 endpoint를 포함해 성립한다. 나머지 radial/η convolution 합은 각각16 이하이다. 따라서 혼합 상수는 `20480/ρ`다. DX를 생략하면 J₁ 대신1이며 여전히 비율≤1이다. η 미분만 생략하면 첫 weight 비와 J divisor로 ≤20480이고 ρ<1이므로 같은 상수가 적용된다. 두 미분 모두 생략한 bilinear J 곱도 ≤80·256≤20480/ρ다. averaging이 있는 factor는 그 양의 divisor가 상한을 늘리지 않는다.

이 증명은 서로 다른 factor에 미분이 작용하는 경우다. 아래 원본 재귀에는 같은 factor에 ∂η와 DX가 동시에 걸리는 monomial이 없다. 원래 미분을 raw bounded operator로 취급하지 않는다.

## 5. order-one χ 항의 역연산자

χ 곱셈 상수 Mχ≤256·3=768이다. T=J₂χ/2로 놓는다. radial degree b 미만이 없는 F에 대해

`||J₂F||≤80||F||/[(b+1)(b+2)]`.

χ 곱셈은 최소 degree를 유지하고 J₂는1 증가시키므로

`||T^k||≤(40·768)^k/[k!(k+1)!]`.

이 식은 위 norm 전체를 사용하므로 임의 η 미분도 포함한다. t_k를 우변이라 하면 t_(k+1)/t_k=30720/[(k+1)(k+2)]이며 감소한다. 실행은 k≤256을 정확한 유리수로 합산하고 첫 미포함 항/(1−후속 ratio)로 나머지 **전체 무한합**을 감싼다. 그 값이 2^704보다 작음을 검사한다.

따라서 ∑(-T)^k가 연산자 norm에서 절대 수렴한다. (1+T)와 부분합의 곱의 잔여는 T^(k+1)로0에 수렴하므로 이 합은 양쪽 역연산자이고 norm<2^704<Q다. 비교급수 Φ₀=(1+T)^−1 1=f₀(Yχ)의 norm도 이 상한보다 작다.

## 6. 실제 비선형 재귀의 monomial 목록

ε=Λ^-1, Av=Aₓu, B=−2DηAv−d∂ηAv, W=W*+εB, Hc=H*+εdu, U=U*+εu, p=I(g²Φ²)다. 원본 producer의 식은

`LR1=[W+h(1−2ηU)+duζ*]Φ+W DXΦ+Hc ∂ηΦ`,

`LR2=αu−2Aηεu²+W DXu+H*∂ηu+dεu∂ηu−4Aηp+d∂ηp−2ηDXp`.

Jν를 적용하고, source scalar는 radial-independent이므로 Jν와 교환시킨다. 코드 R1 목록의12개 항은 순서대로 다음과 같다(각 행에는 L^-1이 공통으로 곱해진다).

`W*Φ`, `−2εDη Av Φ`, `−εd(∂ηAv)Φ`, `hΦ`, `−2hηU*Φ`, `−2hηεuΦ`, `duζ*Φ`, `W*DXΦ`, `−2εDηAv DXΦ`, `−εd(∂ηAv)DXΦ`, `H*∂ηΦ`, `εdu∂ηΦ`.

R2의10개 항도 같은 순서로

`αu`, `−2Aηεu²`, `W*DXu`, `−2εDηAv DXu`, `−εd(∂ηAv)DXu`, `H*∂ηu`, `εdu∂ηu`, `−4AηI(g²Φ²)`, `d∂ηI(g²Φ²)`, `−2ηYg²Φ²`.

마지막 식에는 정확한 DXp=Yg²Φ²를 사용한다. p 또는 g를 버리지 않는다. producer SHA를 고정하고 위 전개를 독립 monomial 목록으로 저장한다.

모든 source scalar factor norm≤Q, 모든 algebra256·J/I/Y80·혼합20480/ρ≤Q다. ||Φ||,||u||≤Q인 max ball을 생각한다. r개 scalar factor의 곱 norm은 Q^(2r−1) 이하이고 나머지 J kernel과 곱할 때 Q를 하나 더 사용한다.

한 unknown의 integrated kernel은 Q² 이하, 두 unknown의 mixed kernel은 Q³ 이하이다. 압력의 nested kernel JI(g²Φ²), J∂ηI(g²Φ²), J(Yg²Φ²)는 g,g,Φ,Φ의 곱 Q⁷, inner operation Q, outer J Q로 **Q⁹ 이하**이다. J∂ηI는 ∂ηI의 boundedness를 사용하며 raw ∂η를 bound하지 않는다.

이 규칙으로 코드가 각 monomial의 Q 지수를 계산한다. R1의 최대 지수13, 합 전체14; R2의 최대17, 합 전체18이다. 합의 항 개수≤16<Q를 사용했다. 두 remainder 모두 보수적으로 **Q²⁰** 이하이다.

각 항은 unknown에 대한 degree1 또는2다. 두 입력의 차이를 factor 하나씩 바꿔 빼면 한 unknown의 Q 대신 δ=max pair distance가 들어간다. 항마다 최대2번이므로 Lipschitz 상수는 2Q^(e−1)≤Q^e이고, 같은 합 규칙을 적용해 **Q²⁰**이다. 무한 derivative 차수를 유한차수로 잘라낸 것이 아니다.

## 7. invariant ball과 contraction

u₀=−YZ*/(2L)=Yu₁이다. 이전 실제 압력 tube 증명으로 ||u₀||≤655360K<Q/4이며, ||Φ₀||<2^704<Q/4다.

중심 (Φ₀,u₀), max norm 반경 Q/4의 닫힌 ball은 전체 max norm Q/2 안에 있다. 원본 방정식은 다음 map의 fixed point와 같다.

`M(Φ,u)=(Φ₀+(1+T)^−1 J₂R1/(2Λ), u₀+J₁R2/(2Λ))`.

위에서 역연산자 norm<Q, JRi와 그 Lipschitz 상수≤Q²⁰, Λ=Q⁶⁴이므로 map의 중심으로부터 변위와 Lipschitz 상수는 모두

`1/(2Q^43)` 이하이다.

Q>2이므로 이는 Q/4보다 작고 1/2보다 작다. 따라서 ball은 invariant이고 map은 strict contraction이다. Bρ의 completeness는 각 (n,m)에서 균등수렴하고 연속인 차수 m+1 미분의 극한을 차수 m의 도함수로 식별하는 표준 적분 argument로 얻는다. product space도 complete하다. Banach fixed-point 정리에 의해 원본 재귀를 만족하는 유일한 fixed point가 이 ball에 있다. 실제 해의 각 component Bρ norm은 **Q/2 이하**이다.

또한 radial n+1 계수는 앞의0..n 계수와 그 η 도함수로 유일하게 정해지므로 이 fixed point는 원본 exact coefficient generator의 모든 유한 prefix와 일치한다. 단순 비교급수를 실제 비선형 해로 바꿔 부른 것이 아니다.

## 8. 공통 정칙성과 모든 차수 tail

x∈I′에서 η Taylor 전개를 하면 coefficient bound의 절댓값 합은

`Q sum_(n,m≥0) binom(n+m,m)(|Y|/20)^n(|η−x|/ρ)^m`보다 작다.

분모 (n+1)²(m+1)²는 상한에서 제거했다. |Y|≤5, |η−x|≤ρ/2에서는 두 비율의 합이3/4라서 합은4이다. 따라서 열린 disk |Y|<5, |η−x|<ρ/2에서 공통 정칙성이 성립한다. weighted derivative bounds는 먼저 각 계수의 실수 Taylor expansion과 일치하고, 절대 수렴에 의해 합·미분을 교환할 수 있다. 실수 데이터와 유일성으로 실수 영역에서 해는 실수다.

실수 0<Y≤4.1, x∈I′의 radial k·η m 미분 tail은

`Q ρ^-m m!/(m+1)² * sum_(n>N) binom(n+m,m)(n)_k Y^(n-k)/(20^n(n+1)²)`

이하이다. N≥k일 때 양의 연속 항 비는

`(Y/20)*(n+1+m)/(n+1−k)*((n+1)/(n+2))²`

이고 전체 tail의 ratio 상한으로 `(Y/20)*(N+2+m)/(N+2−k)`를 사용할 수 있다. 이 값이1보다 작으면 첫 미포함 항/(1−ratio)가 전체 무한 tail 상한이다. 실행은 네 (k,m) 쌍에 이 유리수 값을 생성한다. **Q와 ρ 스케일을 복원해야 하므로 이 값만을 작은 절대 오차라고 해석하지 않는다.** source Q가 매우 커서 실제 원하는 오차의 유한 prefix 길이와 값 계산은 별도 과제다.

## 9. 증거 경계

이 증명은 **명시 I′ 위 원본 natural 급수 전체의 written analytic proof + executed exact scalar majorants**다. Python이 Cauchy·Banach 정리를 kernel로 증명한 것은 아니다. Lean은 별도 파일에서 일부 대수·상수 부등식만 다루며 복소해석·공간 완비성·contraction 정리 전체는 아직 형식화하지 않았다.

원본 미지정 I의 equality, 실제 native 인자·지지집합 결속, 490개 개별 native 결과의 소비, 최종장 jet·전역 잔차·에너지·N8 네 축·M4 16개는 별도 OPEN이다. 그러므로 공식 M3 62/64, M4 0/16, 최종0/67, Y33/523과 RELEASE HOLD를 유지한다.
