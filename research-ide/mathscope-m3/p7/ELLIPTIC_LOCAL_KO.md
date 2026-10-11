# P7 일반 Weierstrass 정확 국소 산술

## 완료 범위와 실행 결과

`elliptic_local.py`는 일반 다섯 계수의 Weierstrass 식

\[
y^2+a_1xy+a_3y=x^3+a_2x^2+a_4x+a_6
\]

에서 정확한 유리수 산술, 유리점 군법, 실제 유한체 점 수와 유한 Dirichlet 계수를 계산한다. `11a1`과 `37a1`은 각각 다섯 정수 계수의 별칭이다. 아래 결과는 데이터베이스의 conductor·rank·점 수를 읽어 채운 값이 아니다.

| 계산 항목 | 11a1 | 37a1 |
|---|---:|---:|
| 입력 `[a1,a2,a3,a4,a6]` | `[0,-1,1,-10,-20]` | `[0,0,1,-1,0]` |
| \(c_4\) | 496 | 48 |
| \(c_6\) | 20008 | −216 |
| \(\Delta\) | \(-161051=-11^5\) | 37 |
| 유일한 나쁜 소수 | 11 | 37 |
| 그 소수에서 \(v_p(c_4)\) | 0 | 0 |
| Kodaira 형식 | \(I_5\), split | \(I_1\), nonsplit |
| 나쁜 Euler 분모, \(T=p^{-s}\) | \(1-T\) | \(1+T\) |
| Tamagawa 수 \(c_p\) | 5 | 1 |
| conductor \(N_E\) | 11 | 37 |
| global root number \(w(E)\) | +1 | −1 |
| 검사한 유리점 | \((5,5)\) | \((0,0)\) |
| 그 점의 위수 | 정확히 5 | 무한 |
| 전체 유리 torsion | \(\mathbf Z/5\mathbf Z\) | 0 |
| 산술 rank 하계 | 0 | 1 |
| 산술 rank 상계 / 확정 rank | 계산하지 않음 | 계산하지 않음 |

이 범위는 원래 Blueprint의 **P7-01과 P7-07 일부**다. 일반 Tate 알고리즘, 일반 최소 모형 변환, descent/Selmer 상계, saturation, canonical height, regulator, period, Sha, analytic rank 및 BSD equality는 이 모듈에서 완료하지 않았다. 전체 P7·RH·BSD·Lean 완료 플래그를 만들지 않는다.

## 정확 입력과 출력 계약

입력 모형은 `"11a1"`, `"37a1"`, 또는 정확히 다섯 `int`/`Fraction`/유리수 문자열이다. 문자열은 `"-7"`, `"3/8"`처럼 정수나 정수의 비여야 한다. `float`, `bool`, 소수점 문자열, 영 분모, 길이가 다른 모형, \(\Delta=0\)인 특이 모형은 거부한다. 유한체 감소는 현재 표시한 식이 해당 소수에서 p-integral일 때만 실행한다.

Python 산술 함수는 `Fraction`과 `int`를 반환한다. certificate 함수는 결정적인 plain JSON이다. 모든 유리수와 Dirichlet 계수는 정확 문자열이고, JavaScript 안전 범위를 넘는 정수도 문자열이다. timestamp가 없으며 입력 모형이나 입력 소수 목록을 변경하지 않는다. Python의 전역 정수·문자열 변환 제한도 변경하지 않는다. 큰 정확 중간 불변량은 9자리 정수 덩어리로 안전하게 직렬화한다.

```python
from p7.elliptic_local import (
    curve_certificate, coefficients, dirichlet_coefficients,
    weierstrass_invariants, point_add, point_multiply,
)

certificate = curve_certificate(
    "11a1", (2, 3, 5, 7, 11, 13), coefficient_limit=32
)
integer_coefficients = coefficients("37a1", 64)
assert integer_coefficients[0] == 1      # a_1, not a_0
coefficient_record = dirichlet_coefficients("37a1", 64)
five_P = point_multiply("11a1", 5, (5, 5))
assert five_P is None                   # O, the point at infinity
```

| 공개 함수 | 실제 반환/제한 |
|---|---|
| `as_curve(model)` | 불변인 `WeierstrassCurve`; 다섯 `Fraction`, 계수에 결속된 model hash |
| `weierstrass_invariants(model)` | `b2,b4,b6,b8,c4,c6,Delta,j`의 정확 `Fraction` |
| `point_add`, `point_negate`, `point_multiply` | 일반 다섯 계수의 정확 유리점 군법; `None`은 무한원점 |
| `count_good_prime(model,p)` | p의 실제 소수 확인, 일반 식의 점 수, \(a_p\), Euler 분모와 Hasse 검사; 나쁜 p는 거부 |
| `local_reduction(model,p)` | good 또는 실제 unit-c4 승법적 분기를 인증; 그 외에는 명시적 unsupported 결과 |
| `semistable_minimal_certificate(model)` | 적분 모형의 판별식을 완전히 인수분해하고 모든 나쁜 소수를 승인한 경우에만 전역 conductor·root number 제공 |
| `torsion_reduction_bound(model,primes)` | 각 torsion 소수 \(\ell\)에 대해 \(p\ne\ell\)인 좋은 감소만 쓰는 실제 위수 나눗셈 상계 |
| `point_order_certificate(model,P,n)` | \(nP=O\), 모든 소인수 \(\ell\mid n\)에 대해 \((n/\ell)P\ne O\)를 실제 계산 |
| `point_nontorsion_certificate(model,P,primes)` | 증명된 torsion 위수 상계 B에 대해 \(BP\ne O\)이면 비틀림이 아님을 증명; rank 상계는 제공하지 않음 |
| `coefficients(model,K,good_only=False)` | 정확한 `(a_1,...,a_K)` 정수 tuple |
| `dirichlet_coefficients(model,K,good_only=False)` | 같은 계수의 JSON과 실제 소수별 recurrence·함수 정규화·누락 소수 목록 |
| `curve_certificate(model,primes,coefficient_limit=K)` | 위 항목의 결정적 JSON 연결; 현재 complete coefficient 옵션은 실제 모든 bad factors가 승인된 경우만 허용 |

유리 모형의 불변량과 군법은 지원한다. 전역 최소성/모든 bad factors 및 Dirichlet 계수 분기는 현재 **적분인 표시 모형**을 요구한다. 임의 유리 모형을 몰래 다른 모형으로 바꾸거나, 그 최소 모형을 이미 찾았다고 주장하지 않는다.

## 산술 및 국소 증명

표준 \(b_i,c_i,\Delta\) 식을 직접 계산한 뒤 다음 두 항등식을 별도로 대조한다. [1, II.2]

\[
c_4^3-c_6^2=1728\Delta,\qquad b_2b_6-b_4^2=4b_8.
\]

좋은 홀수 p에서 각 \(x\in\mathbf F_p\) 위의 y 개수는

\[
1+\left(\frac{(a_1x+a_3)^2+4(x^3+a_2x^2+a_4x+a_6)}p\right)
\]

이다. 이를 실제로 모든 x에서 더하고 무한원점 하나를 넣는다. p=2에서는 y=0,1을 원래 일반식에 직접 대입한다. 계산된 \(a_p=p+1-\#E(\mathbf F_p)\)로 \(1-a_pT+pT^2\)를 만든다. Hasse 검사는 정수식 \(a_p^2\le4p\)이므로 부동소수점 제곱근이 필요 없다. [1, IV.9–IV.10]

판별식이 p의 단위면 그 적분 모형은 p에서 최소다. 나쁜 p에서 \(v_p(c_4)=0\)인 경우에도 최소성은 정확한 scaling weight로 판정한다. 더 작은 적분 판별식을 얻으려면 \(v_p(u)>0\), \(c_4^{\min}=c_4/u^4\)여야 하는데, 이는 적분 불변량의 valuation이 음수가 되는 모순을 준다. 이 단위 분기는 Kodaira \(I_n\), \(n=v_p(\Delta)\)인 승법적 감소다. [1, II.7–II.8; 2]

분해 여부는 실제 감소 식의 유일한 특이점 \((x_0,y_0)\)을 찾은 후

\[
Y^2+a_1XY-(3x_0+a_2)X^2
\]

의 서로 다른 유리 사영 접선이 두 개인지 검사한다. 수직 방향 \((0,1)\)의 값도 1로 남겨 빠진 방향이 없음을 확인한다. p≥5에서는 이 결과를 \((-c_6/p)\)와 다시 대조한다. p=2,3 분기는 접선 원식을 직접 쓰므로 2나 3으로 나누지 않는다. 별도로 특이 사영 cubic의 모든 점을 다시 세어 승법적 \(a_p=\pm1\)와 맞춘다.

그 결과로 conductor 지수 1, split/nonsplit local root number −1/+1, Tamagawa 수 \(n\) 또는 홀짝에 따른 1/2를 계산한다. 무한소 자리의 root number −1을 곱해 global sign을 얻는다. 여기에는 명시한 표준 국소 정리가 사용되며, 그 정리 자체를 새 Lean 실행으로 증명한 것은 아니다. [2–3]

`c4`가 p의 단위가 아닌 나쁜 분기는 **additive 또는 비최소 모형 중 무엇인지 일반적으로 해결하지 않는다**. \(v_p(\Delta)<12\)이면 최소성만 별도로 인증할 수 있지만, additive Euler 인자·conductor·root number·Tamagawa는 여전히 `None`이다. 나쁜 인자를 임의로 1로 두거나 \(a_p=0\)으로 채우는 fallback은 없다.

## torsion과 rank 하계의 근거

11a1의 원래 \(P=(5,5)\)에 대해 실제 군법은 다음을 준다.

\[
2P=(16,-61),\quad3P=(16,60),\quad4P=(5,-6),\quad5P=O.
\]

P가 무한원점이 아니고 5가 소수이므로 위수는 정확히 5다. p=2,3의 실제 좋은 감소는 모두 5개의 점을 갖는다.

37a1의 \(P=(0,0)\)는 실제 곡선 위의 유한점이다. 두 좋은 감소의 점 수는

\[
\#E(\mathbf F_2)=5,\qquad\#E(\mathbf F_3)=7
\]

이다. 코드가 쓰는 정리는 **p와 서로소인 torsion의 감소 단사성**이다. p=2에서 전체 torsion이 항상 단사라고 가정하지 않는다. 각 \(\ell\)에 대해 p≠ℓ인 감소들의 cardinality에서만 ℓ-valuation의 최솟값을 취한다. [1, II.4, Cor.4.2]

37a1의 2-primary torsion은 p=3의 홀수 cardinality로, 3-primary torsion은 p=2의 cardinality 5로 배제된다. 나머지 ℓ도 두 cardinality 5와 7의 해당 valuation으로 배제된다. 따라서 전체 유리 torsion은 자명하고 P는 무한 위수다. 이것은 rank≥1의 증명이다. rank≤1, P의 saturation, canonical height, regulator 또는 Sha를 이 논증으로 대신하지 않는다.

11a1에는 같은 계산이 torsion 위수의 약수 상계 5를 주고, 위수 5인 실제 점이 있으므로 전체 torsion이 \(\mathbf Z/5\mathbf Z\)임을 확정한다. 이 결과가 산술 rank=0을 증명하지는 않는다.

## 후속 analytic L 모듈과의 계약

좋은 p의 recurrence는

\[
a_{p^0}=1,\quad a_{p^1}=a_p,\quad
a_{p^r}=a_pa_{p^{r-1}}-p\,a_{p^{r-2}},
\]

승법적 나쁜 p에서는 \(a_{p^r}=a_p^r\)이다. 서로소 지수에는 곱셈성을 쓴다. `coefficients(model,K)`의 0번 원소가 \(a_1\)이며 \(a_0\)은 반환하지 않는다. 계수를 \(n^{1/2}\)로 나누지 않는다.

완전한 함수의 정규화는

\[
L(E,s)=\sum_{n\ge1}a_n n^{-s},\qquad
\Lambda(E,s)=N_E^{s/2}(2\pi)^{-s}\Gamma(s)L(E,s),
\quad \Lambda(E,s)=w(E)\Lambda(E,2-s).
\]

이는 후속 analytic 모듈에 넘기는 정규화 계약이다. 이 모듈이 해석적 연속이나 함수방정식의 새 modularity 증명을 실행했다는 뜻은 아니다. [1, IV.10]

`good_only=True`에서는 표시된 적분 판별식을 나누는 모든 p를 명시적으로 제외한다. 이 결과는 \(L^S\)이며 완전한 L이 아니다. 비최소 모형이면 S에 추가 좋은 소수가 들어갈 수 있다는 사실도 metadata에 남긴다. 계수의 해당 소수 배수 항을 0으로 만드는 것은 **인자를 생략한 정식 급수의 계수**이지, 미구현 additive 인자 계산이 아니다.

좋은 elliptic L의 Euler 곱 절대수렴 반평면은 \(\Re(s)>3/2\)다. numerical certificate에는 그 정의역에 맞는 독립 꼬리 상계와 ball 연산이 추가로 필요하다. 기존 elliptic scheme zeta의 \(\Re(s)>2\) 계약이나 ζ의 \(\Re(s)>1\) 계약을 이 L에 대입하지 않는다. 이번 반환에는 `infiniteTailComputed:false`, `analyticContinuationComputed:false`가 남는다.

## 검증과 재생

저장소 루트에서 다음 명령을 실행한다. Python 표준 라이브러리만 필요하다.

```sh
python -m unittest discover -s research-ide/mathscope-m3/tests -p test_elliptic_local.py -v
```

최종 전용 실행 `elliptic-local-unittest-attempt2`는 **24/24 PASS, 관측 exit 0**, 외부 경과 0.234475519초, 최대 RSS 16,400,384바이트다. 같은 디렉터리의 attempt1은 이전 23/23 성공 바이트와 별도로 보존했다. 이후 입력 resource limit의 실제 적용과 큰 정확 정수의 변환 경계 검사를 추가했으며, 수학 식을 바꾸지 않았다.

검증은 다음 독립 비교를 포함한다.

- p≤23의 여러 일반 다섯 계수 식에서 최적화된 점 수와 독립적인 모든 (x,y) 전수 대입의 일치.
- 모든 다섯 계수가 0이 아닌 식으로의 실제 좌표변환 아래 군법·\(c_4,c_6,\Delta,j\)의 일치. \(b_i\)는 이 좌표변환의 불변량이라고 가정하지 않는다.
- 정확한 11a1의 5-cycle, 일반 역점과 수직 접선, 잘못된 점·잘못된 위수의 거부.
- split \(I_5\), nonsplit \(I_1\), nonsplit 짝수 \(I_2\)의 Tamagawa 분기와 작은 특성의 접선 계산.
- 37a1의 torsion 제약에서 각 \(\ell\)에 대해 p≠ℓ인 실제 감소만 사용함을 검사.
- 첫 80개 계수를 독립적인 유한 Euler 다항식 역급수의 형식적 곱과 비교하고, 나쁜 소수의 제곱 계수까지 선형 인자를 확인.
- additive/비최소 모형의 완전한 L 거부, 명시적 \(L^S\), 합성수를 소수로 입력한 경우, resource limit, JSON 재현성·입력 불변성.

기본 자원 한도는 입력 계수 4096비트, p≤100003, 요청 계수 K≤10000, trial division 1,000,000회, 점 수/노드 단계 10,000,000회다. 값이 한도를 넘으면 정확한 분해나 점 수를 부분 결과로 승인하지 않고 `RESOURCE_LIMIT`으로 종료한다. 자원 제어는 무한 차수나 일반 곡선 정리의 증명이 아니다.

실행물은 `../evidence/p7-elliptic-local-20261011/`에 있다. root의 별도 CLI·source hash·재생 packet은 이 전용 unit 기록과 구별한다.

## 표준 정리 출처

1. J. S. Milne, *Elliptic Curves*, 2nd ed., II.2, II.4, II.7–II.8, IV.9–IV.10. 저자 제공 원문: <https://www.jmilne.org/math/Books/EC2.pdf>.
2. D. Lorenzini, *Torsion and Tamagawa numbers*, Annales de l'Institut Fourier 61 (2011), multiplicative reduction 및 split/nonsplit component group. 출판 원문: <https://www.numdam.org/item/10.5802/aif.2664.pdf>. 일반 Tate algorithm의 구현 범위는 공식 Sage 문서 <https://doc.sagemath.org/html/en/reference/arithmetic_curves/sage/schemes/elliptic_curves/ell_local_data.html>와도 대조했지만, 그 전체 구현을 이 모듈에서 실행하지 않는다.
3. *On a BSD-type formula for L-values of Artin twists of elliptic curves*, DOI 10.1515/crelle-2020-0036, semistable local root numbers와 \(I_n\)의 Tamagawa 수: <https://www.degruyterbrill.com/document/doi/10.1515/crelle-2020-0036/html>.

표준 정리의 사용과 이번 exact Python 실행, 외부 analytic 계산, 이후 Lean proof는 각각 독립된 증거 수준으로 유지한다.
