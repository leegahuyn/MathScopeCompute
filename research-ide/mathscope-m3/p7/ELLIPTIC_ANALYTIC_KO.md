# P7 두 타원곡선의 중앙 L값과 해석적 rank 인증

`elliptic_analytic.py`는 기존 `elliptic_local.py`가 계산하는 **정확한 11a1·37a1
계수 모델**의 conductor, root number, 완전한 Euler 계수를 승계한다. 중앙점
`s=1`에서 `L, L', Lambda, Lambda'`를 python-flint 0.9.0 / FLINT 3.6.0 ball과
명시적인 무한 꼬리 경계로 둘러싼다. 데이터베이스의 rank나 L값은 계산 입력이 아니다.

## 정규화와 수식

산술 정규화를 사용한다. `c=2*pi/sqrt(N)`, `w=globalRootNumber`라 두면

```text
Lambda(s) = c^(-s) Gamma(s) L(s)
Lambda(s) = w Lambda(2-s)
g(t) = f(i*t/sqrt(N)) = sum_(n>=1) a_n exp(-c*n*t)
Lambda(s) = integral_1^infinity g(t) (t^(s-1) + w*t^(1-s)) dt.
```

마지막 식은 Mellin 적분을 1에서 나누고 `g(1/t)=w*t^2*g(t)`를 적용한 것이다.
중앙 Dirichlet 급수 자체를 잘라서 해석적 연속이라고 부르지 않는다.
중앙점과 일차 도함수에서는

```text
Lambda(1)  = (1+w) sum_(n>=1) a_n exp(-c*n)/(c*n)
Lambda'(1) = (1-w) sum_(n>=1) a_n E1(c*n)/(c*n)
E1(x) = integral_x^infinity exp(-u)/u du = Gamma(0,x), x>0.
```

일차 도함수 식은 `integral_1^infinity exp(-x*t)*log(t) dt=E1(x)/x`를
부분적분으로 얻는다. 지수적 감쇠와 아래 계수 경계는 compact한 s영역에서의
적분/합/미분 교환을 정당화한다. 구현은 이 연속함수의 중앙값과 일차 도함수만 노출한다.

완성된 함수에서 원래 함수로의 변환에는 Gamma 인자의 도함수가 필요하다.

```text
L(1)  = c Lambda(1)
L'(1) = c [Lambda'(1) + (log(c)+EulerGamma) Lambda(1)].
```

따라서 11a1의 짝대칭은 `Lambda'(1)=0`을 주지만 `L'(1)=0`을 주지 않는다.
37a1의 홀대칭은 `Lambda(1)=L(1)=0`을 **정확하게** 준다.

## 명시적 꼬리 경계의 도출

좋은 소수의 Hasse 경계와 Euler 이차 재귀에서
`|a_(p^r)| <= (r+1)*p^(r/2)`를 얻는다. 승법적 나쁜 소수의 계수는
`a_(p^r)=(+/-1)^r`이므로 같은 부등식을 만족한다. 서로소 승법성과 약수쌍을 세면

```text
|a_n| <= d(n)*sqrt(n) <= 2*n, n>=1.
```

이는 계산된 앞부분만 점검해서 추정한 수치 가설이 아니라 모든 생략항에 적용하는
표준 정리와 초등적인 부등식이다. `K>=1`, `q=exp(-c)`, `0<q<1`이고
`E1(x)<=exp(-x)/x`이므로 `n>K`인 항의 총합에 대해

```text
B0 = 2*abs(1+w)/c * q^(K+1)/(1-q)
B1 = 2*abs(1-w)/(c^2*(K+1)) * q^(K+1)/(1-q)
|Lambda(1)  - finiteLambda | <= B0
|Lambda'(1) - finiteLambda'| <= B1.
```

`B0`는 `|a_n|<=2*n`을 대입하고 기하급수를 합한 결과이다.
`B1`은 추가로 `1/n <= 1/(K+1)`을 적용한 결과이다. 두 경계의 각 연산도
FLINT ball로 계산하고 상단의 정확한 dyadic endpoint를 반지름으로 사용한다.
무한 생략항 각각을 계산했다는 주장은 하지 않는다.

`errorBudget.finiteSumBalls`는 유한 합의 산술 및 특수함수 내부 계산을 합친
enclosure이다. `analyticTailUpperBounds`는 이와 별도로 기록한 외부 급수 꼬리의
정확한 dyadic 상계이다. FLINT 내부의 반올림과 내부 특수함수 절단 오차를 서로
분리해서 보고했다고 주장하지 않는다. 최종 `values`의 실제 전체 구간 폭과 요청
`tolerance`를 비교한다. 부족한 K 또는 precision은 `toleranceMet=false`로 드러난다.

## 인증 의미와 남은 범위

11a1은 `L(1)` 구간이 0을 배제하여 해석적 rank 0을 인증한다. 37a1은
함수방정식의 정확한 중앙 영점과 `L'(1)` 구간의 0 배제를 함께 사용하여 해석적
rank 1을 인증한다. 폭 요청 충족과 rank 판정은 별도 조건이다. 넓은 구간도
0을 배제할 수 있지만 요청한 정밀도를 충족했다고 표시해서는 안 된다.

이 인증은 Wiles의 semistable modularity 등 명시된 수학 정리에 의존하며,
그 정리를 Lean으로 새로 증명한 실행 결과가 아니다. modular-symbol 계산,
descent/Selmer 상계, 대수적 rank 등식, period/regulator/Sha, BSD 선도항,
일반 복소 입력과 유한 변위 Taylor 나머지는 여기서 구현하지 않았다.
P7-01/02/06의 실제 진전이며 P7 전체나 M3 전체 완료를 뜻하지 않는다.

재실행은 `replay_elliptic_central_certificate(record)`로 수행한다. 요청으로부터
local data, 계수, ball, tail, rank, source hash를 새로 계산한 뒤 전체 canonical
JSON을 비교한다. 숫자나 claim을 수정하고 hash만 다시 붙여도 거절한다.

## 1차 출처와 구현 문서

- [Wiles, Modular elliptic curves and Fermat's Last Theorem, Theorem 0.4](https://annals.math.princeton.edu/1995/141-3/p01): semistable modularity.
- [Milne, Elliptic Curves](https://www.jmilne.org/math/Books/EC2.pdf): Hasse 경계와 Euler 계수의 정규화.
- [SageMath elliptic L-series 공식 문서](https://doc.sagemath.org/html/en/reference/arithmetic_curves/sage/schemes/elliptic_curves/lseries_ell.html): 중앙 exp/E1 공식 및 독립 구현의 37a1 검산값.
- [python-flint arb 공식 문서](https://python-flint.readthedocs.io/en/latest/arb.html): `expint`, `gamma_upper`, outward endpoints.

검증은 두 중앙값 예제, E1와 불완전 Gamma의 동일성, 다른 K/precision의 포함 관계,
실제 생략된 유한 block과 tail 비교, 정규화 도함수, 짧은 K/낮은 precision,
나쁜 소수/계수 생략·가짜 tail·rank/BSD/P7 승격·source 변조 negative control을 포함한다.
