# M2 Navier–Stokes N4/N5: 유한 구성요소와 명시한 미완료 기준

기존 N3의 `same-profile-2026-10-10.3` identity, commit 및 assessment SHA-256을 유지합니다. 이 디렉터리는 기존 N3 파일을 변경하지 않고 추가한 코드입니다. 현재 실행 가능한 것은 아래의 여덟 가지 유한 구성요소입니다. 원문 전체 N4/N5 구성의 완성을 주장하지 않습니다.

| 요청 kind | 실제 실행하는 내용 | 남은 범위 |
| --- | --- | --- |
| `ns.background-recursion` | 모든 ordered `i+j=n` 항, 원문 지수, `n-1` viscosity·pressure 항 및 양의 차수의 영 axis datum을 생성 | 동일 N3 프로파일의 계수함수 풀이, 원래 PDE에 독립 대입 |
| `ns.background-cutoffs` | 명시한 상수에 대해 cutoff 경계의 outward log 구간과 도함수 부호를 검사하고, 단조성으로 전체 `0<q≤1/a_j` 구간을 상계 | 원래 프로파일에서의 도함수 상수 산출, 모든 차수의 무한 구성 |
| `ns.potential-curl` | 명시한 C3 compact potential의 전체 curl, Cartesian divergence의 단계 축소 검사, `grad(χ)×A` 누락 음성 대조군 | 원문의 C∞ 합성과 실제 pulse remainder |
| `ns.dyadic-charts` | 선택한 dyadic band의 물리·scaled 좌표 및 인접 chart의 동일점 비교 | 원래 프로파일의 모든 label·slow data |
| `ns.pulse-support` | 주어진 finite slow-overlap graph의 모든 active pair를 보조 지지구간으로 분리, `det Jg=14` 및 Haar 계수 기록 | 원문 전체 support 집합과 evaluated chain-rule 도함수 |
| `ns.pulse-ode` | 주어진 frozen local shear의 projected ODE를 접평면 좌표로 실제 적분하고 log 진폭을 유지 | 엄밀한 ODE 오차 구간, 동일 프로파일의 slow derivative·Gaussian 상계 |
| `ns.pulse-covariance` | 두 명시한 polarization의 공분산, angular `1/2`, Haar `1/14`, target 가중치 계산 | 원래 nonconstant stress와의 전역 matching·curl remainder |
| `ns.pulse-tail` | 고정 미분 차수의 outward log tail 및 그 이후 모든 label에 대한 scalar 단조성 조건 | 실제 ODE에서 도출한 상수와 모든 차수의 구성 |

## pulse ODE 계산 방식

법선이 `n(v)=(a(v),b,c)`이고 `a`가 affine일 때, `q=√(b²+c²)`, `r=|n|`에 대해

```
E1 = (q/r, -a*b/(q*r), -a*c/(q*r))
E2 = (0, c/q, -b/q)
```

를 사용합니다. 이 basis는 `EᵀE=I`, `Eᵀn=0`, `EᵀE′=0`을 만족합니다. 원래 projected ODE는 `t=exp(-D) E y`, `y′=-(Eᵀ K E)y`로 정확하게 환원됩니다. scalar damping의 적분 `D`는 affine normal에 대한 다항식 원시함수를 binary64로 평가하고, 2성분 방정식에 RK4를 적용합니다. 입력 polarization은 처음부터 접평면에 있어야 하며, 다른 초기값으로 바꾸는 사후 투영을 하지 않습니다.

이 방식은 역방향 RK4에서 작은 법선 오차가 scalar damping으로 증폭되던 문제를 제거합니다. 기본 예제의 `n·t` 정규화 잔차는 약 `4e-16`, 원래 Cartesian RHS의 energy identity 잔차는 약 `2.5e-14`입니다. 단계 수를 32→64→128→256으로 늘리면 log 진폭 차이가 약 16배씩 감소합니다. 이것은 경험적 수렴 진단입니다. 엄밀한 적분 오차 상계 필드는 `null`입니다.

테스트는 별도의 Cartesian RK4로 짧은 비강성 구간에서 원래 3성분 방정식을 직접 적분하여 같은 해가 나오는지 확인합니다. scalar shear의 해석해, 양쪽 sign, 비영 `GR`, tangent 초기값 거부 및 일반 float가 underflow하는 log 진폭도 검사합니다.

## 입력·결과 계약

- 지원하지 않는 입력 키·잘못된 배열·비유한 수·odd step 수를 명시적으로 거부합니다.
- 기본 backend는 binary64입니다. `EXACT`, `FORMAL`, 53bit 초과 요청으로 계산 등급을 바꾸지 않습니다. 사용자가 지정한 임의 tolerance는 현재 구현하지 않아 `UNSUPPORTED`입니다.
- `OUTWARD_FLOAT64` 요청은 cutoff 및 tail의 scalar interval 계산에만 허용합니다. ODE 해의 구간 인증으로 해석하지 않습니다.
- 큰 근삿값 정수는 `{ "kind": "FLOAT64", "value": ... }`로 표시합니다. 큰 cutoff 상수 입력도 이 표기를 지원합니다. 정확한 정수 계산으로 위장하지 않습니다.
- `τ=0`은 `UNSUPPORTED`이고, 양의 dyadic 좌표가 underflow하는 요청은 `PRECISION_REQUIRED`입니다. 수치의 0을 유효한 singular-boundary 표본으로 만들지 않습니다.
- operation/item 예산은 static preflight 추정과 비교합니다. 실행 시간과 결과 byte 예산은 공용 engine에서 제한합니다. 추정값을 실제 측정 operation 수로 주장하지 않습니다.
- covariance target이 양의 cone 밖에 있으면 음의 가중치와 실패 check를 그대로 반환합니다. 해당 `PARTIAL` 진단도 원본 수치와 함께 시각화됩니다.

## 체크리스트와 재현

`checklist.mjs`는 사용자 Blueprint의 N4/N5 원문 16개 기준을 그대로 보관합니다. 상태는 **13개 PARTIAL, 3개 OPEN, 0개 PASS**입니다. 기준의 원문 전체와 유한 구성요소의 테스트 통과를 분리합니다. N4-03/04/05는 구현하지 않은 핵심 풀이 단계이므로 `NOT_IMPLEMENTED`입니다.

```sh
node --test research-ide/mathscope-m2/navier/tests/navier.test.mjs
node research-ide/mathscope-m2/navier/tests/generate-evidence.mjs
```

15개의 회귀·독립 검사는 여덟 예제, 모든 q 구간의 cutoff 조건, tangent ODE와 독립 Cartesian 참조, curl 음성 대조군, support pairs, covariance cone 실패, precision/경계/자원/취소 상태, 실제 local engine export→recompute replay 및 변조 거부를 포함합니다. `evidence/acceptance.json`에는 원문·소스 해시, 실행별 입력/결과 해시, 실제 진단 및 체크리스트 상태를 보관합니다. 브라우저 및 번들 Worker 검증은 페이지 build의 별도 검증 범위입니다.
