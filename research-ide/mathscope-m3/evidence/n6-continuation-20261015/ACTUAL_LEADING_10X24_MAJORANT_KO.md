# 현재 원본 n1 노름에 들어가는 실제 leading 10×24 jet

대상은 원본 `actual-leading-all-order-jets.mjs`의 동일한 함수와 동일한
양의 식이다. 요청은 X 차수10, η 차수24, 전체 Taylor 차수34이며 실제
square-seed 미분은42까지 생성된다. 원래 C, S, R, N, root, cutoff 폭,
주파수 또는 Bnorm을 재선택하지 않는다. 이 문서는 그 중간 scalar
majorant의 정당성을 다룬다. n1 계수 노름과 원래 Bnorm의 지배 관계 및
Volterra/H 오차·cone 적용은 별도 의무이다.

## 실제 함수와 유한 Taylor 규칙

실수 좌표 y=log X와 η에 대해 전체 차수 k의 factorial Taylor 노름을
`sum_(|alpha|<=k) sup |D^alpha f|/alpha!`로 쓴다. 각 양의 그래프 식은
이 노름의 상계이다. 실제 값의 양의 하계는 별도로 유지한다.

곱은 다중 Leibniz 공식과 Cauchy 곱으로 submultiplicative이다. `f>=c>0`
이면 f의 비상수 Taylor 다항식을 h라 두고 정확한 유한 reciprocal
급수에서 `c^-1 sum_(j=0)^k (F/c)^j`를 얻는다. log의 값은
`|log f|<=F+1/c`, 나머지는 `sum_(j=1)^k (F/c)^j/j`로 지배한다.
exp는 실제 값의 상계 V와 `V sum_(j=0)^k F^j/j!`를 사용한다.
sqrt에는 `|binom(1/2,j)|<=1`과 `sqrt(F) sum_(j=0)^k (F/c)^j`를 쓴다.
복소 해석성을 가정하지 않는 유한 실수 Taylor 규칙이다.

고차 입력의 한 보통 미분을 취하면 목표 k차 노름은 `(k+1) F_(k+1)`
이하이다. 합성과 moving-upper primitive에는 각각 유한 기하급수와
FTC를 적용한다. 고정 η 적분 endpoint가 새 η 미분항을 만들지는 않는다.
실제 physical-X prefix를 y로 미분하는 경우 X 자체의 전체 Taylor
노름은 `X sum 1/j!<3X`이며 prefix 값의 길이도 Xmax 이하이므로
원본의 `4Xmax` 인자가 충분하다. 원의 0..θ prefix는 실제 |θ|<8에서
원래 `(1+8)` 인자를 그대로 쓴다.

실제 implicit equation의 선형 unknown 항을 실제 Jacobian으로 먼저
역전한다. 외부 변수와 unknown 변수의 모든 나머지 계수를 A로
지배하면 양의 collapsed 식은

```
w <= A*(1/((1-t)*(1-w))-1-w),
w = A*t/(1-t)+(1+A)*w².
```

따라서 m차 계수는 모든 j=1..m에 대한
`Cat(j-1)*binom(m-1,j-1)*A^j*(1+A)^(j-1)`의 합으로 지배된다.
현재 식은 가변 선형 계수, 모든 `t*w^j`와 순수 `w^j`를 유지한다.
원본 A에는 dimension과 실제 inverse Jacobian 노름이 포함된다.
이것은 C^34 작은 공의 존재 주장이 아니다. 기존 실제 C0 root를
유한 차수로 미분하는 정리이다.

독립 checker는 원본 scalar DAG를 수정하거나 누락 노드를 생성하지
않는다. 원래 reduction과 유리수 규칙을 별도로 구현하고 모든 ledger
행의 출력 노드를 위 식으로 다시 구성하여 동일성을 확인한다.
natural의 unsigned Stirling 변환, 모든 implicit Catalan 항, source
cutoff 계수, 모든 열적 Gamma 인자도 같은 방식으로 확인한다.

cutoff의42차 수열 자체도 독립적으로 재생성한다. 실제 seed
`exp(-1/t²)`의 k차 미분은 `exp(-z²)P_k(z)`, z=1/t이고
`P_(k+1)=2z³P_k−z²P'_k`이다. 각 monomial `z^j exp(-z²)`의 전역 최댓값을
`ceil(j/2)^ceil(j/2)`와1 중 큰 정수로 지배한다. 실제 denominator는
`a(t)+a(1−t)>=exp(-4)>1/64`이다. reciprocal과 quotient의 모든 보통
Leibniz 항을 재귀적으로 합하여 원본42차 수열과 정확히 비교한다.
양끝의 seed 미분은 모두0으로 가므로 실제 constant exterior의 모든
접합 차수도 포함된다. 과거12차 값을 고차로 외삽하지 않는다.

## 실제 분모와 root 상수

natural Banach 정리의 실제 해에 대해 실수 Y<=4.1에서 Phi>1/4이다.
실제 B22 reference는 이 범위의 log derivative를 0..1 cutoff로
줄이므로 `1/4<=Rr<2`가 유지된다. 실제 g와 pressure의 공통 η tube
Cauchy 경계가 원본 g/pressure jet 식을 지배한다. 여기서 pressure는
모든 outer stage, angular 수정과 무한 꼬리를 보유한 실제 압력이다.

이를 completed-leading의 C∞라는 사실만으로 추론하지 않는다. 별도로
독립 natural Banach majorant 영수증과 실제 kernel 재실행 영수증을
소비한다. 같은 fixed 정의, P0 root3451, g root3498 및 literal287개 압력
ancestor의 hash를 비교한다. 실제 pressure는 양의 측도 질량4K 이하의
`−int (1+eta²)^(-2theta) dmu`, 0<=theta<=1이므로
`|Im eta|<=1/16`에서 `|P0|<=4K(256/255)²<5K`이다.
실제 g는 거리 `sigmaStar²/2048`인 Ω tube에서 |g|<=exp(−1)이고
`rho=sigmaStar²/65536`이므로 반지름 rho의 모든 Cauchy 원이 Ω 안에
있다. 이 양적 경계와 모든 혼합 차수의 실제 B_rho 노름Q가 자연 입력
노름의 근거이다.

원래 loop에서 필요한 값의 하계는 다음과 같다.

```
E >= C^-3,      a >= C^-122,
Q(mu*p2) >= exp(-S^14),
(d_mu W)^-1 <= exp(S^14),
(d_theta phi)^-1 <= 16S².
```

첫 경계는 실제 B26의 EInverseUpper=C³와 B34의 동일 경계에서
시작한다. 다음 ideal/restoration 구간은 a=.8이므로 E가 증가한다.
B8 patch는 실제 root box와 bump 경계에서 E>Keta/4>=Pstar/9>1이다.
loop가 끝나는 outer prefix y<=T+3에서는
`E>=Pstar*f*exp(-T/2-2)>1`이다. 따라서 원본 full pre-loop rectangle에
동일한 C^-3 하계를 쓸 수 있다. 보수적으로 기록한 C^-4 상계만을
C^-3이라고 고쳐 부르는 방식은 사용하지 않는다.

a 하계와 실제 `a^-1,vs,|p2|<=S`는 기존 full pre-loop envelope이다.
기존 실제 C1 분산 정리에서 Z=S^13이면
`Q>=.5 exp(-4Z)`이고 `W_mu>=(d0/4) exp(-6Z)`이다.
`log(32S)+6S^13<S^14`와 S>=2^20으로 원래 Q 및 mu 상수를 얻는다.
실제 원 밀도는 `a(1+t²)/(2pi*vTarget)`이며
`a>=S^-1`, `vTarget<=2S`, `2pi<8`이므로 역기울기16S²가 유효하다.
정규화된 정확한 원 평균과 meanA/meanB도 기존 C1 정리와 같은 것이다.

실제 lazy r branch에서는 `vStar-vs>=delta/4`이고 a<=S이므로
sqrt 인자의 하계 `delta/(4S)`가 성립한다. 0 branch의 접합은 원본
flat cutoff와 이미 증명한 endpoint collar를 사용한다. `vTarget>=2`
역수 경계도 실제 cutoff 세 경우에서 성립한다. p2=0에서 Q는 실제
적분형으로 유지하며 p2로 나누지 않는다.

실제 B8, I1, I2는 기존의 진짜 debt에 대한 C0 contraction과 point
Jacobian 역노름2를 사용한다. 원본의 작은 box를 가정하여 존재를
추론하지 않는다. I1의 lambda^-2 행, I2의 모든 improper heat debt와
정확한 연속 matrix도 기존 source-bound 영수증과 같은 것이다.
실제 outer amplitude 정리는 원본 [.9,1.2] branch, 기울기7/20,
계수 C32, 복소 η tube1/4 및 Cauchy 여유1/8을 그대로 정당화한다.

## 동일한 source 조립과 모든 차수

원본 reference p1/ns의 모든 항과 실제 B26, B34, B8 prefix의 다섯
moment를 위 곱·적분 규칙으로 지배한다. 이상 비교 F가 축에서
발산하는 경우에는 원본처럼 다섯 정확한 ideal primitive만 사용한다.
발산 density의 유한 sup을 끌어오지 않는다.

정규화 tilt는 |mu*p2|<=S13에서 실제 지수 원적분과 M의 양의 하계를
사용한다. k차 Q는 R의 k+2차 jet에서 얻는다. 모든 외부 변수와 root
unknown의 Taylor 미분이 implicit norm에 포함된다. theta의 0차 값은
한 period에서16 이하이고, 원본의 정확한 zero-mean primitive를 합성한다.

원본 유한 주파수 phase=N*y를 대입하면 각 r차 보통 미분에 모든
`binom(r,j) N^j D_y^(r-j) D_phase^j`가 존재한다. 그 합을 원래
`(1+N)^k`로 지배한다. N의 크기를 바꾸거나 fast 미분을 삭제하지 않는다.
E의 exp 변화와 U 변화는 실제 C12 density의 모든 cross 및 square
항을 유지하여 I1 incoming jet를 만든다. 이후 실제 continuous I1 root를
같은 implicit recurrence로 미분한다.

I2에서 heat Laplace 인자는 물리적 |η|<=1, Z=2(1−η²)/X>=0에서만 쓴다.
Gamma의 정확한 두 rising-factor recurrence가 j차 loss 미분을
지배한다. 비상수 η Taylor 합은6/X 이하이다. 모든 차수에 1/X를
보존하므로 실제 I, S, Cp improper radial 적분이 수렴한다.
I 적분의 1/h와 loss의 h를 모두 유지한다. η=±1의 모든 고정 one-sided
jet는 이 integrable majorant로 연속이고, 음의 Z나 양끝 바깥의 복소
heat 확장은 주장하지 않는다.

마지막으로 원래 physical 변환
`dX^r=X^-r product_(j=0)^(r-1)(D_y-j)`의 모든 unsigned Stirling 항과
factorial을 포함한다. 축은 실제 natural analytic-X 부분을 따로 쓴다.
이렇게 얻은 원래 세 scalar 식은 U0의 전체 support, F0의 common
inner collar, F0의 active 0..Xplus 영역에서 X<=10, η<=24의 모든 보통
혼합 미분을 지배한다. 이는 finite C∞만으로 주어진 숫자식을 승인하는
논리가 아니라, 동일한 실제 함수의 각 연산에 유한 차수 규칙을 적용한
귀납 증명이다.

## 증거 범위

fresh probe는 원본 파일과 U0 root를 확인하고 scalar norm DAG와 ledger만
내보낸다. 원본 물리 함수의 거대한 전체 graph는 내려받지 않는다.
checker의 `--source-only`는 scalar 조립과 실제 상수 동일성만 검증한다.
전체 옵션은 같은 hash chain의 completed-leading, C1, 실제 I1/I2,
outer amplitude, pre-loop envelope, B26/B34 및 loop proof를 소비한다.
독립 natural Banach 증명과 실제 kernel 재실행 영수증도 필수 입력이다.
다른 식의 majorant, 원래 Bnorm threshold 적용, H determinant와 양의
weight 또는 원본 Guard/Jet/PDE 새 소거를 이 결과에서 주장하지 않는다.
