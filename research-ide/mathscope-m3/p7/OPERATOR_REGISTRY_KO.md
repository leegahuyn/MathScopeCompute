# P7 연산자 reference 및 미해결 RH bridge 계약

`operator_registry.py`는 실제 유한행렬과 정규화 계약을 계산하는 reference audit이다.
`audit_operator({})`의 `REFERENCE_CONTRACT_AUDITED`는 이 유한 검증과 음성대조가
성공했다는 의미이다. RH 연구 상태 `researchStatus`는 계속 `RESEARCH_OPEN`이다.

## 정확히 정의한 무한 reference

복소 Hilbert 공간 `l2(N)`에서 `D e_n=n e_n`으로 정의한다.

```text
Dom(D) = {a in l2 : sum n^2 |a_n|^2 < infinity}
form domain = {a in l2 : sum n |a_n|^2 < infinity}
```

유한 지지 벡터가 조밀하다. 각 기저벡터와 adjoint 조건을 검사하면 `D*`의 domain도
`(n a_n) in l2` 조건과 같으므로 이 domain에서 self-adjoint이다.
`<a,Da>=sum n|a_n|^2 >= ||a||^2`. inverse의 대각성분 `1/n`은 0으로 가므로 compact이고,
`sum 1/n^2`가 수렴하므로 Hilbert–Schmidt이다. `sum 1/n`은 발산하므로 inverse 자체는
trace class가 아니다. 이 성질을 유한 예제에서 추측하여 무한 정리로 승격하지 않는다.
위와 같은 명시적인 diagonal-operator 논증을 외부 정리와 함께 기록한다.

## determinant, trace, duality

`Re(s)>1`에서 spectral zeta는 `Tr(D^-s)=sum n^-s=zeta(s)`이다. 하지만 spectrum은
양의 정수이고 각 multiplicity는 1이다. reciprocal Gamma의 Weierstrass product로

```text
det2(I-z D^-1) = product_(n>=1) (1-z/n) exp(z/n)
               = exp(EulerGamma*z)/Gamma(1-z).
Tr(D^-2) = zeta(2).
log det2(I-z D^-1) = -sum_(k>=2) zeta(k) z^k/k, |z|<1.
```

det2의 값과 일차 도함수는 원점에서 각각 1과 0이다. finite compression에서는
counterterm가 `z*sum_(n<=N)1/n`으로 고정된다. 이 counterterm를 없애거나 바꾸면
검증이 실패하고, 두 probe에서 실제 ball 차이도 0을 배제하는지 계산한다.
dual 계약은 Hermitian adjoint와 conjugation 관계이다. 이를 xi 함수방정식의
연산자적 실현이라고 부르지 않는다.

모든 `|z|<=r<1`에 대해 생략된 log-product는

```text
sum_(n>N) sum_(k>=2) |z|^k/(k n^k)
 <= r^2 / [2 N (1-r/(N+1))]
```

로 제어된다. `1/k<=1/2`, 기하급수, `sum_(n>N)1/n^2<=1/N`을 순서대로 쓴 결과다.
audit는 `z=+/-1/4`의 finite product에 이 tail를 더한 밴드가 Gamma reference를
포함하는지 검산한다. trace tail도 관측 잔차와 독립적인
`1/(N+1)<=sum_(n>N)1/n^2<=1/N`을 사용한다.

## 계산되는 유한 계약과 음성대조

`make_reference_fixture(N)`는 `diag(1,...,N)`과 검증 대상 claim을 만든다.
`validate_finite_fixture`는 matrix의 대각성/adjoint, 실제 고유값과 multiplicity,
정확한 characteristic polynomial, trace inverse 및 inverse square,
positivity, determinant counterterm, domain을 검사한다. 구간 overlap만으로
대수적 항등식을 증명했다고 취급하지 않는다. 해당 항등식은 정확한 유리수 계산으로
검사하고 ball probe는 수치 구현 검산으로 구분한다.

실행되는 변조 control은 counterterm, multiplicity, 생략한 determinant zero,
틀린 trace, 음의 eigenvalue, 깨진 adjoint, domain, RH 승격, zero-spectrum 승격의 9종이다.

더 근본적인 음성대조도 계산한다. `2`는 D의 eigenvalue이며 `det2(I-2D^-1)=0`이다.
그러나 `zeta(2)>0`, `xi(1/2+2i)`는 0을 배제한다. 따라서 spectral zeta가 Riemann
zeta와 같고 연산자가 positive self-adjoint라는 조건만으로 비자명 zero 또는
그 ordinate가 spectrum이라는 결론은 나오지 않는다.

## 미해결 bridge

`candidate="rh-research-open"`에는 실제 후보 연산자나 domain을 발명하지 않는다.
domain/self-adjoint extension, compact resolvent, multiplicity를 보존하는 zero
correspondence, xi determinant 정규화, explicit-formula trace, xi duality,
positivity에서 RH로 가는 함의를 별도 `OP-*` ID의 미해결 의무로 기록한다.
reference audit가 PASS여도 이 bridge들은 미해결 상태를 유지한다.

출처: [DLMF 5.8.2 Gamma product](https://dlmf.nist.gov/5.8.E2),
[DLMF 25.2.1 zeta series](https://dlmf.nist.gov/25.2.E1),
[DLMF 25.8 zeta/Gamma series](https://dlmf.nist.gov/25.8).
형식 커널 증명이나 P7/M3 전체 완료는 주장하지 않는다.
