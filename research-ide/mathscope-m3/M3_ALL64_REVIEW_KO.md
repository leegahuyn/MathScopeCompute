# MathScope M3 전체 64개 원문 기준 누적 검토

**현재 원문 기준 완료는 56/64개이며, 실질 잔여는 8개다.** 원문의 제목·본문·쪽수·출처는 보존했다. 개별 연산자 또는 관측 요구의 완료와 전체 Navier 장의 재구성은 별도 판정한다.

검토 기준 시각: `2026-10-12T19:46:11.227064+00:00`. 이 보고서는 연결 복구 뒤 실제 추가한 소스 연산·검증·표시 연결을 반영한다. 공개 사이트와 GitHub의 최종 배포 검증은 별도 릴리스 기록에서 확인한다.

## 1. 원문별 현재 집계

| 묶음 | 원문 수 | 완료 | 실질 잔여 | 진행표 |
|---|---:|---:|---:|---|
| P7 | 8 | 8 | 0 | [P7_PROGRESS.json](P7_PROGRESS.json) |
| P8 | 8 | 8 | 0 | [P8_PROGRESS.json](P8_PROGRESS.json) |
| Y5 | 8 | 8 | 0 | [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json) |
| Y6 | 8 | 8 | 0 | [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json) |
| Y7 | 8 | 8 | 0 | [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json) |
| N6 | 8 | 4 | 4 | [N6_PROGRESS.json](N6_PROGRESS.json) |
| N7 | 8 | 5 | 3 | [N7_PROGRESS.json](N7_PROGRESS.json) |
| N8 | 8 | 7 | 1 | [N8_PROGRESS.json](N8_PROGRESS.json) |
| **전체** | **64** | **56** | **8** | |

완료 수는 `originalCriterionComplete === true`만 센다. 실행 성공, 그래프 해시 일치, 조건부 명제, 유한 모형 결과를 다른 원문 요구의 완료로 바꾸지 않는다. M2의 보존된 64개와 M4의 별도 16개는 이번 집계에 합산하지 않는다.

## 2. 이전 판정과 이번 추가 승인

이전 45/64 진행표와 전체 보고서의 정확한 바이트는 [보존 manifest](evidence/all64-20261012/assessment-before-source-domain46/manifest.json)에 있다. 당시 31→45 승인 및 실제 CI/API/UI 기록은 [이전 승인 receipt](evidence/all64-20261012/assessment-public-acceptance45/receipt.json)에 유지했다. 과거 실행 receipt의 판정 플래그는 새 검토에 맞춰 덮어쓰지 않았다.

| 새 완료 항목 | 원문 요구에 대한 추가 검토 | 실제 관문 |
|---|---|---|
| N6-03 | 원래 source의 10개 부호·정수 덮개 행과 20개 비영 역연산, cutoff 뒤 전체 curl, 갱신 평균·각도 압력 및 새 m+m′ 모드를 실제 11개 저장 그래프에서 검증했다. 540개 PDE 계수·2,320개 식·213개 독립 검사와 네 음성 대조가 통과했다. 원래 통합 생성자의 시간 제한 실패는 유지하며 전체 PDE·순서 있는 j=0·모든 차수 class는 N6-02/01/07의 별도 요구다. | forced-snapshot-replay |
| N6-04 | 고정 H/a와 전체 81개 label의 B(W0,LΣ)=Σ, 세 종류 remainder를 실제 source에서 검증했다. j=0 초기화·모든 차수 class는 별도 N6-01/07 요구다. 과거 receipt의 false 판정은 그대로 남겼다. | global-signed |
| N6-05 | 전체 원문 current/pressure의 실제 zero-mean Fourier 역연산과 N 항등식, m+4 도함수·전체 꼬리·각 느린 도함수별 bound를 구성했다. 원래 ci·T1·A1·느린 시간 항을 유지한다. 이후 pressure/moment/j0는 별도 N6-01 조건이다. | global-temporal |
| N6-06 | 같은 원래 source에서 다섯 적분·두 보존량을 보정한 뒤 전체 보조 토러스 압력과 비선형(8.26)/(8.27)을 재계산했다. 원래 작은 양의 λ의 조건수 배율도 유지했다. | global-moment-full-pressure |
| N7-01 | 원래 공통 초기 조건·양의 mean map·고정 역연산자를 실행한 뒤 같은 qBig에 원문 domain 정리를 적용했다. support, 초기 zero interval, 고정 K와 unit plateau를 확인했다. | domain-exterior |
| N7-02 | 원문 cutoff와 계수에 연결한 전체 curl·10개 교차항을 직접 residual 계산과 대조했다. 모든 다항식 계수가 일치하고 div u=0을 구조적으로 확인했다. | localization-operator, domain-exterior |
| N7-03 | 같은 원문의 압력과 전체 force로 Poisson 항등식을 검증했다. 실제 외부 영역의 비영 div f를 유지하고 Leray projection 없이 cutoff·압력 조건을 보존했다. | localization-operator, domain-exterior |
| N7-07 | 같은 열린 내부 영역에서 모든 원문 보정 연산의 지지가 사라지는 증명을 새로 실행해 실제 경로를 식별했다. 양의 e0 하한과 전체 Cτ^(2h) 꼬리를 모든 충분히 작은 양의 τ에 연결했다. | core-restriction, domain-exterior |
| N7-08 | 원문은 비교·배율·지지 분리 주기화를 검토하고 같은 force/data·주기적 압력·에너지 가정을 유지하도록 요구한다. 실제 source cutoff의 정확한 배율·미분·전체 PDE와 간격을 검증했으며 미완료 전역 가정을 보존한다. 별도 N7-06 계산이나 무조건 C/D 발급을 추가 조건으로 붙이지 않는다. | periodization-review, localization-operator, domain-exterior |
| N8-04 | 같은 최종 장의 내부 경로에 세 성분 구간을 연결하고, 정확한 양의 τ·s=-logτ·물리 배율·요청한 소수 예시와 더 작은 시간의 재현을 확인했다. | core-restriction, near-terminal |
| N8-08 | 실제 공개 유동 selected run과 원문 core fixture 두 개를 다른 GitHub 환경의 원본 Node 모듈·배포 Worker로 재실행하고 각 기록을 재생했다. 총105713개 수치가 같은 허용오차로 일치했으며, 14개 독립 NumPy 계산과 6개 변조 방지 검사도 통과했다. 판본·commit·전체 소스·상수·기저·영역·시간표·적분·절단·정밀도·tail·실제 residual/energy·camera·build logs를 하나의 검증 manifest와 원본 CI ZIP으로 묶었다. 원문의 재현 요구는 충족하며, 전체 원문장의 에너지·전역 잔차 및 N8-05 적응 요구는 이 판정으로 대체하지 않는다. | n8-public-selected-reproduction |

### 실제 새 소스 관문

| 관문 | Node 검사 | 독립 검사 | 실행 중 불변 소스 | 실행 시간(초) | 원본 receipt |
|---|---:|---:|---:|---:|---|
| global-signed | 13 | — | 230 | 361.164 | [receipt](navier/evidence/global-signed-20261012/attempt1/receipt.json) |
| domain-exterior | 11 | 52 | 101 | 456.432 | [receipt](navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json) |
| global-moment | 12 | — | 117 | 296.599 | [receipt](navier/evidence/global-moment-20261012/attempt1/receipt.json) |
| near-terminal | 10 | 38 | 117 | 270.408 | [receipt](navier/evidence/source-near-terminal-20261012/attempt2/receipt.json) |
| global-moment-full-pressure | 10 | — | 121 | 526.077 | [receipt](navier/evidence/global-moment-pressure-20261012/attempt1/receipt.json) |
| core-restriction | 16 | 41 | 156 | 6.687 | [receipt](navier/evidence/source-core-restriction-20261012/attempt1/receipt.json) |
| localization-operator | 10 | 55 | 13 | 2.992 | [receipt](navier/evidence/source-localization-operator-20261012/attempt1/receipt.json) |
| periodization-review | 5 | 33 | 17 | 2.040 | [receipt](navier/evidence/source-periodization-review-20261012/attempt2/receipt.json) |
| global-temporal | 15 | — | 123 | 423.506 | [receipt](navier/evidence/global-temporal-20261012/attempt3/receipt.json) |
| n8-public-selected-reproduction | 6 | 14 | 523 | 10.228 | [receipt](navier/evidence/n8-reproduction-20261012/manifest.json) |
| forced-snapshot-replay | — | 213 | 9 | 332.551 | [receipt](navier/evidence/forced-snapshot-replay-20261012/attempt1/receipt.json) |

관문별 실행 횟수는 서로 합산해 새 전체 테스트 수로 표시하지 않는다. 원본 생성자 실행과 작은 기록 검증·새 재생·표시 검증은 서로 다른 동작이다. signed 대형 원본은 [무손실 압축 manifest](navier/evidence/packed-evidence.json)의 원본 SHA와 정확히 일치하도록 복원 가능하다.

### 전체 재구성과 개별 요구의 경계

원래 전체 공통 cover, fixed signed covariance, 전체 보조 토러스의 pressure, 실제 다섯 radial moment, 고정 localization domain과 세 성분 near-terminal 구간을 소스에서 계산했다. 공개 UI의 기록 소비자는 그 생성자를 새로 실행했다고 표시하지 않는다.
새 내부 경로 지지 증명은 기록된 초기 소스·정의역·양의 core 구간에 결속되어 있다. 원래 연산자별 열린 zero 영역과 전체 cutoff curl을 확인해 실제 최종 장의 내부 경로를 식별했다. 비영 보정항의 값을 모두 계산하거나 새 Lean 정리를 발급했다는 뜻은 아니다.
원문 국소화 연산 증명은 같은 cutoff·계수에 전체 직접 PDE와 모든 교차항·압력 항등식을 대조한다. 미완료인 비영 영역의 모든 수치값을 이 개별 연산 항등식의 추가 전제로 붙이지 않는다. 전역 force jets·extension·에너지 완료와는 구분한다.
비영 angular 보정의 원문 연산과 저장된 실제 식 검증은 N6-03으로 완료했다. 최신 압력을 사용한 전체 current PDE·순서 있는 j=0 초기화·모든 finite stage의 class·shrinking cutoff 합은 남아 있다. 전체 공간 force jets/extension 및 활동 구간의 전체 K 에너지를 core 계산이나 manufactured fixture로 대신하지 않는다.
원래 논문의 연산자·정리를 실제 검증된 소스 조건에 적용한 분석적 범위와, 새 Lean kernel 증명·독립 수치 enclosure·화면 관찰은 서로 다른 증거 층이다. universal RH/BSD, continuum Yang–Mills 및 전체 원문 Navier 재구성의 완료를 주장하지 않는다.
- N8-08은 실제 selected run과 원문 fixture의 다른 환경 재현으로 승인했다. 원문 p.66에 없는 매 selected run의 브라우저 import 의무나 전체 N6 완성을 이 항목에 덧붙이지 않았다. 실제 periodic/subregion energy와 step residual을 재현한 유동 run, 원문 core 관측 두 개, 공개 export·core import·near-terminal replay는 각자의 범위를 유지한다. 이후 배포도 해당 판본의 fresh CI 재현을 통과해야 한다.
N6-03의 실제 저장 그래프 재생은 332.551초에 통과했고, 35분 제한으로 실패한 원래 생성자 receipt는 수정하지 않았다. 155개 원래 source와 9개 새 재생 source의 바이트를 확인했다. 전체 pressure 식·원래 private current certificate를 복원했다고 주장하지 않는다. 재생 receipt의 2 MB RSS 관측은 launcher 값이며 실제 Node 표본 최대 2,568,454,144 bytes와 구분한다. 이 관측을 전체 과정의 엄격한 peak memory 상한 증명으로 사용하지 않는다.

## 3. 원문 64개와 현재 판정

다음 원문 블록은 [원문 카탈로그](ORIGINAL_M3_M4_CRITERIA.json)의 제목·본문을 그대로 사용한다. PDF 추출에 따른 원래 줄바꿈과 띄어쓰기를 유지한다. 진행표의 기존 원문 필드 역시 이전 45개 승인 시점의 값에서 바뀌지 않았다.

### P7

#### P7-01 — 전역 정규화와 모든 국소 인자를 완성한다

원문: 34쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
ζ의 completed ξ와 E의 Λ_E=N_E^{s/2}(2 π)^{-s}Γ(s)L(E,s)를 각각 명세한다. minimum model/Tate reduction, root
number, bad factors의 certificate를 묶는다. 합격: good-only product는 L^S라고 표시한다. ζ↔ξ 또는 L↔ Λ의 영점·극
점·trivial zero 차이가 자동 변환 기록에 남는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Exact supported rational models, pinned CAS Tate/minimal algorithms and independently checked exported arithmetic; no rank database or hidden Manin constant.

**증거와 구현:**

- [p7/elliptic_arithmetic.py](p7/elliptic_arithmetic.py)
- [p7/pari_backend.py](p7/pari_backend.py)
- [p7/normalization.py](p7/normalization.py)
- [p7/elliptic_complex.py](p7/elliptic_complex.py)
- [p7/euler_product.py](p7/euler_product.py)
- [p7/tests/test_elliptic_arithmetic.py](p7/tests/test_elliptic_arithmetic.py)
- [p7/evidence/arithmetic-20261012/unit-tests.json](p7/evidence/arithmetic-20261012/unit-tests.json)
- [p7/evidence/final-all64-20261012/attempt1/manifest.json](p7/evidence/final-all64-20261012/attempt1/manifest.json)
- [p7/evidence/final-all64-20261012/attempt1/arithmetic-11a1.json.gz](p7/evidence/final-all64-20261012/attempt1/arithmetic-11a1.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/arithmetic-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/arithmetic-37a1.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/complex-additive-32.json.gz](p7/evidence/final-all64-20261012/attempt1/complex-additive-32.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/euler-finite.json.gz](p7/evidence/final-all64-20261012/attempt1/euler-finite.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/zeta-2.json.gz](p7/evidence/final-all64-20261012/attempt1/zeta-2.json.gz)
- [evidence/all64-20261012/public-p7-execution-acceptance.json](evidence/all64-20261012/public-p7-execution-acceptance.json)
- [evidence/all64-20261012/public-api-semantic-review/review.json](evidence/all64-20261012/public-api-semantic-review/review.json)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)
- [evidence/all64-20261012/ci-c971/p7-job-114802713677.log](evidence/all64-20261012/ci-c971/p7-job-114802713677.log)
- [evidence/all64-20261012/public-v95/p7-ui-cases.json](evidence/all64-20261012/public-v95/p7-ui-cases.json)
- [evidence/all64-20261012/public-v96/p7-ui-acceptance.json](evidence/all64-20261012/public-v96/p7-ui-acceptance.json)
- [evidence/all64-20261012/p7-final-gate-attempt3/receipt.json](evidence/all64-20261012/p7-final-gate-attempt3/receipt.json)

#### P7-02 — 해석적 연장 backend와 Euler-product 영역을 분리한다

원문: 34쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
유한 Euler product는 ζ에서 Re(s)>1, E good-factor product에서 Re(s)>3/2의 탐색으로 제한한다. critical strip 계산은
certified analytic continuation과 complex balls를 사용한다. 합격: s=1/2+it에서 finite Euler product를 ζ의 인증값으로
반환하면 실패한다. 반올림·series truncation·tail error를 각각 포함한 ball을 내보낸다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Certified analytic continuation with explicit finite truncation and infinite tail ledgers, distinct from finite Euler exploration.

**증거와 구현:**

- [p7/zeta_em.py](p7/zeta_em.py)
- [p7/euler_product.py](p7/euler_product.py)
- [p7/elliptic_complex.py](p7/elliptic_complex.py)
- [p7/normalization.py](p7/normalization.py)
- [p7/tests/test_zeta_em.py](p7/tests/test_zeta_em.py)
- [p7/tests/test_elliptic_complex.py](p7/tests/test_elliptic_complex.py)
- [p7/COMPLEX_CONTINUATION_KO.md](p7/COMPLEX_CONTINUATION_KO.md)
- [p7/evidence/pari-runtime-20261012/receipt.json](p7/evidence/pari-runtime-20261012/receipt.json)
- [p7/evidence/final-all64-20261012/attempt1/manifest.json](p7/evidence/final-all64-20261012/attempt1/manifest.json)
- [p7/evidence/final-all64-20261012/attempt1/zeta-em-critical.json.gz](p7/evidence/final-all64-20261012/attempt1/zeta-em-critical.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/euler-finite.json.gz](p7/evidence/final-all64-20261012/attempt1/euler-finite.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/complex-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/complex-37a1.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/complex-additive-32.json.gz](p7/evidence/final-all64-20261012/attempt1/complex-additive-32.json.gz)
- [evidence/all64-20261012/public-p7-execution-acceptance.json](evidence/all64-20261012/public-p7-execution-acceptance.json)
- [evidence/all64-20261012/public-api-semantic-review/review.json](evidence/all64-20261012/public-api-semantic-review/review.json)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)
- [evidence/all64-20261012/ci-c971/p7-job-114802713677.log](evidence/all64-20261012/ci-c971/p7-job-114802713677.log)
- [evidence/all64-20261012/public-v95/p7-ui-cases.json](evidence/all64-20261012/public-v95/p7-ui-cases.json)
- [evidence/all64-20261012/public-v96/p7-ui-acceptance.json](evidence/all64-20261012/public-v96/p7-ui-acceptance.json)
- [evidence/all64-20261012/p7-final-gate-attempt3/receipt.json](evidence/all64-20261012/p7-final-gate-attempt3/receipt.json)

#### P7-03 — 영점 고립·개수·중복도를 인증한다

원문: 34쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
N(T)는 0<Imρ≤T인 strip 전체 영점의 중복도 포함 개수로 정의한다. Hardy Z의 실수 영점 고립으로 Re ρ=1/2를 인증하고 독
립 zero counter와 비교한다. T=20,30의 endpoint exclusion도 확인한다. 합격: N(20)=1, N(30)=3을 count certificate
로 재확인한다. 임계선에서 찾은 영점 수와 전체 strip의 count가 다르면 RH_VERIFIED_TO_T를 주지 않는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The two original finite heights and algorithmic independence; a common FLINT arithmetic backend is disclosed.

**증거와 구현:**

- [p7/zero_certificate.py](p7/zero_certificate.py)
- [p7/tests/test_result_claims.py](p7/tests/test_result_claims.py)
- [p7/evidence/arithmetic-20261012/unit-tests.json](p7/evidence/arithmetic-20261012/unit-tests.json)
- [evidence/p7-release-20261011/attempt3/zeros-to-20.json](evidence/p7-release-20261011/attempt3/zeros-to-20.json)
- [evidence/p7-release-20261011/attempt3/zeros-to-30.json](evidence/p7-release-20261011/attempt3/zeros-to-30.json)
- [p7/evidence/final-all64-20261012/attempt1/manifest.json](p7/evidence/final-all64-20261012/attempt1/manifest.json)
- [p7/evidence/final-all64-20261012/attempt1/zeros-20.json.gz](p7/evidence/final-all64-20261012/attempt1/zeros-20.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/zeros-30.json.gz](p7/evidence/final-all64-20261012/attempt1/zeros-30.json.gz)
- [evidence/all64-20261012/public-p7-execution-acceptance.json](evidence/all64-20261012/public-p7-execution-acceptance.json)
- [evidence/all64-20261012/public-api-semantic-review/review.json](evidence/all64-20261012/public-api-semantic-review/review.json)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)
- [evidence/all64-20261012/ci-c971/p7-job-114802713677.log](evidence/all64-20261012/ci-c971/p7-job-114802713677.log)
- [evidence/all64-20261012/public-v95/p7-ui-cases.json](evidence/all64-20261012/public-v95/p7-ui-cases.json)
- [evidence/all64-20261012/public-v96/p7-ui-acceptance.json](evidence/all64-20261012/public-v96/p7-ui-acceptance.json)
- [evidence/all64-20261012/p7-final-gate-attempt3/receipt.json](evidence/all64-20261012/p7-final-gate-attempt3/receipt.json)

#### P7-04 — 명시적 공식의 유한 잘림 오차를 계산한다

원문: 34쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
우선 x를 half-integer로 제한한 ψ(x)와 symmetric zero sum을 제공한다. 숫자 오차 밴드는 선택한 truncated/smoothed
formula의 명시 상수·가정·tail bound가 있을 때만 인증한다. 합격: x=10.5의 prime side=log2520. ψ 또는 ψ₀ endpoint
convention을 기록한다. 이름만 있는 O(·)나 수치 residual을 rigorous tail bound로 쓰면 실패한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The original half-integer finite acceptance case with a rigorous but coarse smoothed band.

**증거와 구현:**

- [p7/explicit_formula.py](p7/explicit_formula.py)
- [evidence/resume-20261012/attempt2/explicit-psi.json.gz](evidence/resume-20261012/attempt2/explicit-psi.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/manifest.json](p7/evidence/final-all64-20261012/attempt1/manifest.json)
- [p7/evidence/final-all64-20261012/attempt1/explicit-psi.json.gz](p7/evidence/final-all64-20261012/attempt1/explicit-psi.json.gz)
- [evidence/all64-20261012/public-p7-execution-acceptance.json](evidence/all64-20261012/public-p7-execution-acceptance.json)
- [evidence/all64-20261012/public-api-semantic-review/review.json](evidence/all64-20261012/public-api-semantic-review/review.json)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)
- [evidence/all64-20261012/ci-c971/p7-job-114802713677.log](evidence/all64-20261012/ci-c971/p7-job-114802713677.log)
- [evidence/all64-20261012/public-v95/p7-ui-cases.json](evidence/all64-20261012/public-v95/p7-ui-cases.json)
- [evidence/all64-20261012/public-v96/p7-ui-acceptance.json](evidence/all64-20261012/public-v96/p7-ui-acceptance.json)
- [evidence/all64-20261012/p7-final-gate-attempt3/receipt.json](evidence/all64-20261012/p7-final-gate-attempt3/receipt.json)

#### P7-05 — global operator 후보를 반증 가능한 입력으로 만든다

원문: 34쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
사용자가 operator/domain, spectrum-zero 대응, regularized determinant, trace formula, duality/positivity 가설을 등
록하게 한다. truncation별 spectrum·극점·중복도·정규화·functional-equation residual을 비교한다. 합격: 누락 영점, 잘못
된 trivial-zero factor, determinant의 상수/선형 exponential normalization 차이, multiplicity 불일치는 counterexample
후보로 저장한다. 유한 통과가 전체 operator의 존재나 RH 증명이 되지 않는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Editable research registration and falsifiable finite comparisons; finite matrix success is never a global existence theorem.

**증거와 구현:**

- [p7/operator_candidates.py](p7/operator_candidates.py)
- [p7/operator_registry.py](p7/operator_registry.py)
- [p7/examples/registered-operator.json](p7/examples/registered-operator.json)
- [p7/tests/test_operator_candidates.py](p7/tests/test_operator_candidates.py)
- [p7/evidence/arithmetic-20261012/unit-tests.json](p7/evidence/arithmetic-20261012/unit-tests.json)
- [p7/OPERATOR_REGISTRY_KO.md](p7/OPERATOR_REGISTRY_KO.md)
- [p7/evidence/final-all64-20261012/attempt1/manifest.json](p7/evidence/final-all64-20261012/attempt1/manifest.json)
- [p7/evidence/final-all64-20261012/attempt1/operator-reference.json.gz](p7/evidence/final-all64-20261012/attempt1/operator-reference.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/operator-registered.json.gz](p7/evidence/final-all64-20261012/attempt1/operator-registered.json.gz)
- [evidence/all64-20261012/public-p7-execution-acceptance.json](evidence/all64-20261012/public-p7-execution-acceptance.json)
- [evidence/all64-20261012/public-api-semantic-review/review.json](evidence/all64-20261012/public-api-semantic-review/review.json)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)
- [evidence/all64-20261012/ci-c971/p7-job-114802713677.log](evidence/all64-20261012/ci-c971/p7-job-114802713677.log)
- [evidence/all64-20261012/public-v95/p7-ui-cases.json](evidence/all64-20261012/public-v95/p7-ui-cases.json)
- [evidence/all64-20261012/public-v96/p7-ui-acceptance.json](evidence/all64-20261012/public-v96/p7-ui-acceptance.json)
- [evidence/all64-20261012/p7-final-gate-attempt3/receipt.json](evidence/all64-20261012/p7-final-gate-attempt3/receipt.json)

#### P7-06 — analytic rank를 증명 범위별로 계산한다

원문: 34쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
root-number 대칭으로 강제되는 vanishing과 exact modular-symbol vanishing, 도함수의 rigorous nonzero ball을 구분
한다. completed Λ의 Taylor parity를 사용한다. 합격: w=−1이면 Λ(1)=0의 정확한 이유를 기록하고 0∉ Λ′(1)의 인증구간
이 있어야 rank=1. 0을 포함하는 작은 interval은 vanishing 증명이 아니다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The original root-number -1 acceptance condition and rigorous central derivative, with exact vanishing mechanisms distinguished.

**증거와 구현:**

- [p7/elliptic_analytic.py](p7/elliptic_analytic.py)
- [p7/result_claims.py](p7/result_claims.py)
- [p7/tests/test_result_claims.py](p7/tests/test_result_claims.py)
- [p7/evidence/arithmetic-20261012/unit-tests.json](p7/evidence/arithmetic-20261012/unit-tests.json)
- [evidence/resume-20261012/attempt2/central-37a1.json.gz](evidence/resume-20261012/attempt2/central-37a1.json.gz)
- [p7/modular_symbols.py](p7/modular_symbols.py)
- [p7/tests/test_modular_symbols.py](p7/tests/test_modular_symbols.py)
- [p7/evidence/modular-symbols-20261012/receipt.json](p7/evidence/modular-symbols-20261012/receipt.json)
- [p7/MODULAR_SYMBOLS_KO.md](p7/MODULAR_SYMBOLS_KO.md)
- [p7/evidence/final-all64-20261012/attempt1/manifest.json](p7/evidence/final-all64-20261012/attempt1/manifest.json)
- [p7/evidence/final-all64-20261012/attempt1/central-11a1.json.gz](p7/evidence/final-all64-20261012/attempt1/central-11a1.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/central-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/central-37a1.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/modular-11a1.json.gz](p7/evidence/final-all64-20261012/attempt1/modular-11a1.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/modular-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/modular-37a1.json.gz)
- [evidence/all64-20261012/public-p7-execution-acceptance.json](evidence/all64-20261012/public-p7-execution-acceptance.json)
- [evidence/all64-20261012/public-api-semantic-review/review.json](evidence/all64-20261012/public-api-semantic-review/review.json)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)
- [evidence/all64-20261012/ci-c971/p7-job-114802713677.log](evidence/all64-20261012/ci-c971/p7-job-114802713677.log)
- [evidence/all64-20261012/public-v95/p7-ui-cases.json](evidence/all64-20261012/public-v95/p7-ui-cases.json)
- [evidence/all64-20261012/public-v96/p7-ui-acceptance.json](evidence/all64-20261012/public-v96/p7-ui-acceptance.json)
- [evidence/all64-20261012/p7-final-gate-attempt3/receipt.json](evidence/all64-20261012/p7-final-gate-attempt3/receipt.json)

#### P7-07 — arithmetic rank와 leading BSD data를 독립 인증한다

원문: 34쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
독 립 유 리 점 ·height/ regulator 로 lower bound, descent/ Selmer certificate 로 upper bound 를 얻 는 다. tor-
sion·saturation·Tamagawa·period·Sha 의 known/ conditional/ unknown 을 각 각 저 장 한 다. 합 격: rank interval
[r_min,r_max]가 한 점일 때만 해당 곡선 rank 확정. Sage L_ratio() 등의 숨은 Manin-constant 가정이 충족되지 않으면 조
건부로 표시한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Exact supported arithmetic computations plus standard height theorems and pinned CAS descent dependencies; the full finite witness and raw GP output remain inspectable.

**증거와 구현:**

- [p7/elliptic_arithmetic.py](p7/elliptic_arithmetic.py)
- [p7/height_certificate.py](p7/height_certificate.py)
- [p7/period_certificate.py](p7/period_certificate.py)
- [p7/pari_backend.py](p7/pari_backend.py)
- [p7/tests/test_elliptic_arithmetic.py](p7/tests/test_elliptic_arithmetic.py)
- [p7/evidence/arithmetic-20261012/unit-tests.json](p7/evidence/arithmetic-20261012/unit-tests.json)
- [p7/evidence/pari-runtime-20261012/receipt.json](p7/evidence/pari-runtime-20261012/receipt.json)
- [p7/ARITHMETIC_CERTIFICATES_KO.md](p7/ARITHMETIC_CERTIFICATES_KO.md)
- [p7/evidence/final-all64-20261012/attempt1/manifest.json](p7/evidence/final-all64-20261012/attempt1/manifest.json)
- [p7/evidence/final-all64-20261012/attempt1/arithmetic-11a1.json.gz](p7/evidence/final-all64-20261012/attempt1/arithmetic-11a1.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/arithmetic-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/arithmetic-37a1.json.gz)
- [evidence/all64-20261012/public-p7-execution-acceptance.json](evidence/all64-20261012/public-p7-execution-acceptance.json)
- [evidence/all64-20261012/public-api-semantic-review/review.json](evidence/all64-20261012/public-api-semantic-review/review.json)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)
- [evidence/all64-20261012/ci-c971/p7-job-114802713677.log](evidence/all64-20261012/ci-c971/p7-job-114802713677.log)
- [evidence/all64-20261012/public-v95/p7-ui-cases.json](evidence/all64-20261012/public-v95/p7-ui-cases.json)
- [evidence/all64-20261012/public-v96/p7-ui-acceptance.json](evidence/all64-20261012/public-v96/p7-ui-acceptance.json)
- [evidence/all64-20261012/p7-final-gate-attempt3/receipt.json](evidence/all64-20261012/p7-final-gate-attempt3/receipt.json)

#### P7-08 — RH·BSD 연구 결과를 제한된 범위로 내보낸다

원문: 34쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
finite-height zero certificate, 특정 curve의 rank equality, refined leading-term 검증, universal conjecture를 별도 결
과 타입으로 제공한다. coefficient/prime/zero completeness의 빠진 항을 자동 목록화한다. 합격: 한 E에서 두 rank가 같
다고 universal BSD를 표시하지 않는다. finite-field RH theorem을 classical RH axiom으로 복사하는 요청은 거부한다. 연
구가설은 Lean 가정 목록과 함께 내보낸다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Typed finite/research results, complete finite inventories, scope rejection and transparent assumption export; no natural-language-to-Lean mathematical formalization is claimed.

**증거와 구현:**

- [p7/result_claims.py](p7/result_claims.py)
- [p7/tests/test_result_claims.py](p7/tests/test_result_claims.py)
- [p7/evidence/arithmetic-20261012/unit-tests.json](p7/evidence/arithmetic-20261012/unit-tests.json)
- [p7/evidence/research-export-20261012/audit.json](p7/evidence/research-export-20261012/audit.json)
- [p7/examples/](p7/examples/)
- [p7/RESULT_CLAIMS_KO.md](p7/RESULT_CLAIMS_KO.md)
- [p7/evidence/final-all64-20261012/attempt1/manifest.json](p7/evidence/final-all64-20261012/attempt1/manifest.json)
- [p7/evidence/final-all64-20261012/attempt1/typed-finite-20.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-finite-20.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/typed-rank-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-rank-37a1.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/typed-refined-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-refined-37a1.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/typed-universal-open.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-universal-open.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/typed-omitted-coefficient-prime.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-omitted-coefficient-prime.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/typed-omitted-zero.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-omitted-zero.json.gz)
- [p7/evidence/final-all64-20261012/attempt1/typed-finite-field-copy.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-finite-field-copy.json.gz)
- [evidence/all64-20261012/public-p7-execution-acceptance.json](evidence/all64-20261012/public-p7-execution-acceptance.json)
- [evidence/all64-20261012/public-api-semantic-review/review.json](evidence/all64-20261012/public-api-semantic-review/review.json)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)
- [evidence/all64-20261012/ci-c971/p7-job-114802713677.log](evidence/all64-20261012/ci-c971/p7-job-114802713677.log)
- [evidence/all64-20261012/public-v95/p7-ui-cases.json](evidence/all64-20261012/public-v95/p7-ui-cases.json)
- [evidence/all64-20261012/public-v96/p7-ui-acceptance.json](evidence/all64-20261012/public-v96/p7-ui-acceptance.json)
- [evidence/all64-20261012/p7-final-gate-attempt3/receipt.json](evidence/all64-20261012/p7-final-gate-attempt3/receipt.json)

### P8

#### P8-01 — 객체 정체성과 증거 등급을 직교화한다

원문: 36쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
CW_TOY, DERIVED_MODEL, PRISMATIC_VIA_COMPARISON, NATIVE_PRISMATIC을 object kind로 둔다. exact/
ball/approximate와 Lean-checked/external-theorem/hypothesis를 별도로 관리한다. 합격: PRISMATIC_VIA_COMP
ARISON이어도 Lean dependency가 외부면 FORMAL_COMPLETE가 아니다. 숫자 grade 값을 크게 바꾸어 theorem 상태
로 승격시키는 schema fixture가 실패한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Object kind, exactness and proof method remain independent; forged numerical grades and serialized proof authority are rejected.

**증거와 구현:**

- [tests/p8-contracts.test.mjs](tests/p8-contracts.test.mjs)
- [p8/evidence/p8-local-acceptance-20261012.json](p8/evidence/p8-local-acceptance-20261012.json)

#### P8-02 — 3D 구조의 좌표 계약을 고정한다

원문: 36쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
degree-basis-valuation, Hodge/Newton polygons, prime-degree-Frobenius weight, refinement tower를 각 view로
제공한다. 클릭하면 chain basis·matrix column·map·source theorem을 보이게 한다. 합격: view matrix·camera·LOD 변
경은 수학 결과를 바꾸지 않는다. 3D projection을 원래 공간과의 동형·차원 축소 증명으로 저장할 수 없다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** All four actual M2 structural views render on the public v87 page using source-bound Canvas2D when WebGL is unavailable. Actual point selection exposes the original basis/matrix column/map/theorem, Newton slopes, Frobenius eigenvalue and finite refinement. Camera/LOD and route return preserve the mathematical record; the single scene restores camera state. The 7 mounted-renderer tests and independent model tests preserve exact source data and deny projection proof authority. Execution JSON does not export presentation state.

**증거와 구현:**

- [tests/p8-visual-models.test.mjs](tests/p8-visual-models.test.mjs)
- [tests/p8-visualization.test.mjs](tests/p8-visualization.test.mjs)
- [p8/evidence/p8-renderer-local-20261012.json](p8/evidence/p8-renderer-local-20261012.json)
- [p8/evidence/p8-live-v87-20261012.json](p8/evidence/p8-live-v87-20261012.json)
- [evidence/live-ui/p8-refinement-v87.jpg](evidence/live-ui/p8-refinement-v87.jpg)

#### P8-03 — 비교 diagram의 조건을 클릭해서 검사한다

원문: 36쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
노드는 계수환과 base를, 화살표는 tensor/twist/completion/inversion/fixed-point 또는 quasi-isomorphism을 명세한
다. 잘못된 base-change 순서는 composability 검사로 막는다. 합격: bounded/smooth/proper/perfect 등 각 edge의 필
요한 가정이 표시된다. 조건을 제거한 replay에서는 edge가 유효하지 않다는 이유를 반환한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Actual M2 typed comparison routes reject reordered operations, missing assumptions and rehashed altered diagrams.

**증거와 구현:**

- [tests/p8-contracts.test.mjs](tests/p8-contracts.test.mjs)
- [p8/evidence/p8-local-acceptance-20261012.json](p8/evidence/p8-local-acceptance-20261012.json)

#### P8-04 — Lean은 작은 인증 정리부터 쌓는다

원문: 36쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
정수 d², unit contraction, chain equivalence, point counts, trace recurrence, bounded residue reconstruction, finite
Euler identity를 우선 구현 후보로 둔다. 고급 비교정리의 현재 라이브러리 범위를 별도 조사한다. 합격: 각 후보에는
theorem statement·입력 타입·핵심 lemma·certificate 소비 방식·추가 axiom이 명시된다. 컴파일되지 않은 코드를 형식화
완료라고 표시하지 않는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Seven requested candidate categories now include statement, type, lemmas, consumer and extra-axiom policy. The exact finite F5 input has 12 recorded compiled targets and 8 semantic negative controls. The dedicated chain-equivalence consumer remains a declared future candidate, consistent with the original backlog criterion.

**증거와 구현:**

- [p8/theorem-backlog.mjs](p8/theorem-backlog.mjs)
- [p8/evidence/lean-release.json](p8/evidence/lean-release.json)
- [p8/evidence/lean-release-provenance.json](p8/evidence/lean-release-provenance.json)

#### P8-05 — 조건부 corollary의 의존성을 숨기지 않는다

원문: 36쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
새 operator/trace/duality 가정은 고유 ID와 정확한 수학 명제를 갖는다. theorem의 실제 의존 axiom을 출력하고 그 axiom
을 지운 상태의 재검증을 지원한다. 합격: Lean #print axioms와 입력 assumption ledger가 일치한다. target conjecture
자체를 가정하고 얻은 corollary는 CONDITIONAL_ON_TARGET으로 명확히 분류한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Actual official Lean CI run 38213076249 compiled the conditional source and fresh import (exit 0,0), printed the exact assumedTarget dependency and rejected deletion of that axiom from source (exit 1). The source-matched release is attached to the browser. Public v87 displayed the matching unique-ID input ledger, exact literal proposition, actual #print axioms and source-removal rejection as RECORDED_CI_SOURCE_MATCH / CONDITIONAL_ON_TARGET, explicitly without a fresh browser Lean run.

**증거와 구현:**

- [p8/evidence/conditional-lean-release.json](p8/evidence/conditional-lean-release.json)
- [p8/evidence/lean-attempt7-38213076249.zip](p8/evidence/lean-attempt7-38213076249.zip)
- [p8/evidence/lean-release-provenance.json](p8/evidence/lean-release-provenance.json)
- [p8/evidence/conditional-local-20261012/receipt.json](p8/evidence/conditional-local-20261012/receipt.json)
- [p8/tools/test_conditional_audit.py](p8/tools/test_conditional_audit.py)
- [p8/evidence/p8-live-v87-20261012.json](p8/evidence/p8-live-v87-20261012.json)

#### P8-06 — 반증용 mutation과 재현 bundle을 만든다

원문: 36쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
bad prime 하나, Frobenius coefficient 하나, truncation bound 하나, zero box 하나, rank upper certificate 하나를 제
거·변조하여 관문을 다시 실행한다. 합격: 변조된 입력은 해당 단계에서 실패하고 후속 theorem badge가 취소된다. session
저장은 입력 해시·정밀도·비교 근거를 보존하며 재계산 결과와 일치한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Bad-prime, Frobenius, truncation and comparison mutations execute in the current browser. The separate source-bound /2 CI receipt contains actual fresh P7 child runs deleting a valid arithmetic descent upper certificate and corrupting a zero box. Successful CI artifact bytes/current source hashes and public downstream badge revocation, replay/import and forged-import rejection are verified. The /1 audit, failed first /2 CI and the packaging-time publishedResultVerified=false remain historical; currentReleaseAcceptance supplies the later positive public gate. Browser replay does not claim fresh P7 execution or a whole-application claim graph.

**증거와 구현:**

- [tests/p8-mutation-audit.test.mjs](tests/p8-mutation-audit.test.mjs)
- [p8/evidence/p7-mutation-release.json](p8/evidence/p7-mutation-release.json)
- [p8/evidence/p8-local-acceptance-20261012.json](p8/evidence/p8-local-acceptance-20261012.json)
- [p7/evidence/arithmetic-20261012/unit-tests.json](p7/evidence/arithmetic-20261012/unit-tests.json)
- [p8/tools/audit_p7_mutations.py](p8/tools/audit_p7_mutations.py)
- [tests/test_p8_p7_mutations.py](tests/test_p8_p7_mutations.py)
- [p8/evidence/p7-mutation-arithmetic-20261012-attempt1/process.json](p8/evidence/p7-mutation-arithmetic-20261012-attempt1/process.json)
- [p8/evidence/p7-mutation-arithmetic-20261012-attempt1/report.json](p8/evidence/p7-mutation-arithmetic-20261012-attempt1/report.json)
- [p8/evidence/p7-ci-arithmetic-attempt2-38237430568/receipt.json](p8/evidence/p7-ci-arithmetic-attempt2-38237430568/receipt.json)
- [p8/evidence/p7-ci-arithmetic-attempt2-38237430568/github-observation.json](p8/evidence/p7-ci-arithmetic-attempt2-38237430568/github-observation.json)
- [p8/evidence/p7-ci-arithmetic-attempt2-38237430568/report.json](p8/evidence/p7-ci-arithmetic-attempt2-38237430568/report.json)
- [p8/evidence/p7-ci-arithmetic-attempt2-38237430568/process.json](p8/evidence/p7-ci-arithmetic-attempt2-38237430568/process.json)
- [p8/evidence/p7-ci-arithmetic-attempt2-38237430568/consumer-validation.json](p8/evidence/p7-ci-arithmetic-attempt2-38237430568/consumer-validation.json)
- [tests/p8-recorded-arithmetic.test.mjs](tests/p8-recorded-arithmetic.test.mjs)
- [p8/evidence/p7-mutation-release-historical-v1.json](p8/evidence/p7-mutation-release-historical-v1.json)
- [evidence/all64-20261012/public-v95/p8-acceptance.json](evidence/all64-20261012/public-v95/p8-acceptance.json)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)

#### P8-07 — 새 연구를 위한 구체적인 탐색 도구를 제공한다

원문: 36쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
global operator 후보의 finite compression, determinant normalization quotient, trace moment matching, func-
tional equation·duality consistency, zero multiplicity coverage를 자동 비교한다. 반례는 재현 가능한 최소 입력으로 줄
인다. 합격: 후보 A와 B가 같은 그림을 내어도 다른 characteristic polynomial·trace·rank이면 구별된다. 미증명 bridge는
각각 RESEARCH OPEN이며 실패/통과한 유한 테스트를 나란히 표시한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Exact rational finite compressions compare characteristic polynomials, rank, traces, normalization quotients, reflection/duality and multiplicities. Counterexample minimization preserves the original failed predicate within explicitly bounded principal compressions.

**증거와 구현:**

- [tests/p8-candidate-search.test.mjs](tests/p8-candidate-search.test.mjs)
- [p8/evidence/p8-local-acceptance-20261012.json](p8/evidence/p8-local-acceptance-20261012.json)

#### P8-08 — 마일스톤 review packet으로 승인 기준을 고정한다

원문: 36쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
P1-P3 기본 계산, P4 실제 zeta 연결, P5-P6 고급 base, P7 분석 인증, P8 통합을 각각 독립 review packet으로 작성한다.
지원범위·fixture 결과·미완료 증명·새 연구 질문을 담는다. 합격: 출시 준비와 수학적 난제 해결을 다른 체크박스로 둔다. 이
번 산출물은 설계도이며 구현·컴파일·배포가 완료되었다는 상태를 생성하지 않는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Five independent review packets retain supported inputs, current original criteria, explicitly historical recorded fixture references, open proofs and research questions; release review and conjecture resolution remain different. The user now includes P7; older fixture records are not relabeled as new execution.

**증거와 구현:**

- [p8/review-packets.mjs](p8/review-packets.mjs)
- [p8/review-fixture-evidence.json](p8/review-fixture-evidence.json)
- [p8/evidence/p8-local-acceptance-20261012.json](p8/evidence/p8-local-acceptance-20261012.json)

### Y5

#### Y5-01 — Δ 모드와 변경 효과 선언

원문: 46쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
declared lower bound / units-rescaling / explicit effective model / empirical ensemble estimate의 4모드를 둔다. 합
격: 가정 모드에서는 A와 샘플 hash가 유지되고 axiom revision만 바뀐다. Δ≤0·단위 없음·다른 모드 자료 혼합은 거부한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/field-family.mjs](research-ide/mathscope-m3/gauge/field-family.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)

#### Y5-02 — 실제로 변하는 유효 4D 장족

원문: 46쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
자연단위에서 ℓ Δ=1/Δ, ρΔ=κℓΔ를 모델 규칙으로 지정한다. A Δ=ιA_BPST(ρΔ)+εℓΔ⁻¹Σcφ((x−x₀)/ℓΔ)Ta를 생성한다. 합
격: Δ₁≠Δ₂이면 고정 관측 좌표의 A/F·길이 척도·투영이 규칙대로 변한다. ε≠0의 장은 off-shell일 수 있으며 ρΔ=κ/Δ는 양자
YM 정리가 아니다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/field-family.mjs](research-ide/mathscope-m3/gauge/field-family.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)

#### Y5-03 — 명시적인 유효 스펙트럼 연결

원문: 46쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Ej(Δ)=Δ+εj, εj≥0 및 wj≥0의 유한 모형으로 C Δ(t)=Σwj exp( −Ej t)를 만든다. ε₀=0,w₀>0이면 이 모형의 최저 에너지는
Δ다. 합격: CΔ(t)≤exp(−Δt)Σwj를 정확한 가정 아래 검증한다. Y5-02 장과 이 스펙트럼의 연결은 model assumption ID를
가져야 한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/spectral.mjs](research-ide/mathscope-m3/gauge/spectral.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)

#### Y5-04 — 단위 변환과 실제 dilation 구별

원문: 46쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Δphysical=(ℏc/at)(atΔ)의 단위를 고정한다. A λ(x)=λA(λx)의 고전 scaling과 단순 표시 단위 변경을 구별한다. 합격: 4D 고
전 작용의 scaling 불변과 ρ→ρ/λ를 확인한다. quantum gap scaling은 H λ=λUHU⁻¹ 등 별도 가정 없이는 유도하지 않는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/field-family.mjs](research-ide/mathscope-m3/gauge/field-family.mjs)
- [research-ide/mathscope-m3/gauge/spectral.mjs](research-ide/mathscope-m3/gauge/spectral.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)

#### Y5-05 — Δ 타깃에 대한 양자 격자 앙상블족

원문: 46쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
PΔ(U)∝exp[−Sβ(Δ),G(U)]의 생성 규칙을 지정한다. β·a·L·T를 바꾸는 calibration table와 독립 scale-setting으로 타깃을
찾는다. 합격: 모든 Δ 결과는 실제 새 chain 또는 검증된 재가중 경로에 연결된다. 타깃 Δ와 추정 mchannel±오차를 나란히
표시하고 동일성을 미리 강제하지 않는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/SCALE_STUDY_KO.md](research-ide/mathscope-m3/gauge/SCALE_STUDY_KO.md)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz](research-ide/mathscope-m3/gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json](research-ide/mathscope-m3/gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json)
- [research-ide/mathscope-m3/gauge/experiments/verify-study-numerics.py](research-ide/mathscope-m3/gauge/experiments/verify-study-numerics.py)
- [research-ide/mathscope-m3/gauge/study-record.mjs](research-ide/mathscope-m3/gauge/study-record.mjs)
- [research-ide/mathscope-m3/gauge/su2-kernel.mjs](research-ide/mathscope-m3/gauge/su2-kernel.mjs)
- [research-ide/mathscope-m3/gauge/scale-study.mjs](research-ide/mathscope-m3/gauge/scale-study.mjs)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/live-scale-replay-attempt1.json](research-ide/mathscope-m3/gauge/evidence/scale-expansion/live-scale-replay-attempt1.json)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/matched-public-example-attempt2.json](research-ide/mathscope-m3/gauge/evidence/scale-expansion/matched-public-example-attempt2.json)
- [evidence/all64-20261012/public-v93/gauge-ui-audit.json](evidence/all64-20261012/public-v93/gauge-ui-audit.json)
- [evidence/all64-20261012/public-v93/gauge-spacing-ui-audit.json](evidence/all64-20261012/public-v93/gauge-spacing-ui-audit.json)

#### Y5-06 — 상관함수와 유효질량 추정

원문: 46쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
전체 진공 공간을 제거한 gauge-invariant 관측 벡터의 C(t)를 측정한다. 유일한 진공이면 평균 제거를 사용하며, 주기 시간
에는 finite-T/cosh와 operator channel을 명시한다. 합격: C(t)≤0 또는 cosh 역함수의 불가능 입력을 abs/clip으로 숨기지
않는다. 양의 스펙트럼 가정에서 gapglobal≤Echannel≤meff 방향을 표시한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/SCALE_STUDY_KO.md](research-ide/mathscope-m3/gauge/SCALE_STUDY_KO.md)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz](research-ide/mathscope-m3/gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json](research-ide/mathscope-m3/gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json)
- [research-ide/mathscope-m3/gauge/experiments/verify-study-numerics.py](research-ide/mathscope-m3/gauge/experiments/verify-study-numerics.py)
- [research-ide/mathscope-m3/gauge/study-record.mjs](research-ide/mathscope-m3/gauge/study-record.mjs)
- [research-ide/mathscope-m3/gauge/vacuum.mjs](research-ide/mathscope-m3/gauge/vacuum.mjs)
- [research-ide/mathscope-m3/gauge/scale-analysis.mjs](research-ide/mathscope-m3/gauge/scale-analysis.mjs)
- [research-ide/mathscope-m3/gauge/tests/scale-analysis.test.mjs](research-ide/mathscope-m3/gauge/tests/scale-analysis.test.mjs)
- [research-ide/mathscope-m3/gauge/tests/su2-study-kernel.test.mjs](research-ide/mathscope-m3/gauge/tests/su2-study-kernel.test.mjs)
- [evidence/all64-20261012/public-v93/gauge-ui-audit.json](evidence/all64-20261012/public-v93/gauge-ui-audit.json)
- [evidence/all64-20261012/public-v93/gauge-spacing-ui-audit.json](evidence/all64-20261012/public-v93/gauge-spacing-ui-audit.json)

#### Y5-07 — 전달 연산자·GEVP·인증 경계

원문: 46쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
양의 self-adjoint T에서 En −E0=−at⁻¹log(λn/λ0)를 사용한다. GEVP는 관측량 기저와 excited-state 오염을 함께 기록한
다. 합격: 수치 eigenvalue는 추정이다. 전체 진공 공간을 제외한 최대 λexc/λ₀≤r<1과 전체 비진공 공간의 제어가 있을 때만
해당 모델 gap 하한 −log(r)/at를 인증한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/spectral.mjs](research-ide/mathscope-m3/gauge/spectral.mjs)
- [research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean](research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean)
- [research-ide/mathscope-m3/gauge/evidence/lean-audit.json](research-ide/mathscope-m3/gauge/evidence/lean-audit.json)
- [research-ide/mathscope-m3/gauge/lean/RealSpectralBridge.lean](research-ide/mathscope-m3/gauge/lean/RealSpectralBridge.lean)
- [research-ide/mathscope-m3/gauge/evidence/real-lean-release.json](research-ide/mathscope-m3/gauge/evidence/real-lean-release.json)
- [research-ide/mathscope-m3/gauge/evidence/real-lean-audit/audit.json](research-ide/mathscope-m3/gauge/evidence/real-lean-audit/audit.json)

#### Y5-08 — 한계 순서와 불확실성 비교

원문: 46쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
통계·operator overlap·T·L·a·표현 cutoff 오차를 구분한다. 일정 물리량 조건에서 a→0,L→∞,T→∞를 비교한다. 합격: 한
operator channel의 양의 질량이나 유한 격자의 양의 gap을 continuum의 양의 하한으로 표시하지 않는다. 외삽 그래프에
는 사용한 가정·fit window·데이터를 공개한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/SCALE_STUDY_KO.md](research-ide/mathscope-m3/gauge/SCALE_STUDY_KO.md)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz](research-ide/mathscope-m3/gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json](research-ide/mathscope-m3/gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json)
- [research-ide/mathscope-m3/gauge/experiments/verify-study-numerics.py](research-ide/mathscope-m3/gauge/experiments/verify-study-numerics.py)
- [research-ide/mathscope-m3/gauge/study-record.mjs](research-ide/mathscope-m3/gauge/study-record.mjs)
- [research-ide/mathscope-m3/gauge/scale-analysis.mjs](research-ide/mathscope-m3/gauge/scale-analysis.mjs)
- [research-ide/mathscope-m3/gauge/study-review.mjs](research-ide/mathscope-m3/gauge/study-review.mjs)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/production-L8-attempt1/result.json](research-ide/mathscope-m3/gauge/evidence/scale-expansion/production-L8-attempt1/result.json)
- [research-ide/mathscope-m3/gauge/evidence/scale-expansion/production-T24-attempt1/result.json](research-ide/mathscope-m3/gauge/evidence/scale-expansion/production-T24-attempt1/result.json)
- [evidence/all64-20261012/public-v93/gauge-ui-audit.json](evidence/all64-20261012/public-v93/gauge-ui-audit.json)
- [evidence/all64-20261012/public-v93/gauge-spacing-ui-audit.json](evidence/all64-20261012/public-v93/gauge-spacing-ui-audit.json)

### Y6

#### Y6-01 — 원본·표현·근거를 연결

원문: 48쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Original에는 A/F 또는 links/ensemble, Representation에는 slice·marginal·LOD, Evidence에는 source·오차·proof를 보
관한다. 합격: 3D selection은 원본 4D 좌표·configuration·관측 연산자로 이동한다. 화면 mesh나 색상으로 원본의 새 물리
상태를 생성하지 않는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/field-family.mjs](research-ide/mathscope-m3/gauge/field-family.mjs)
- [research-ide/mathscope-m3/gauge/index.mjs](research-ide/mathscope-m3/gauge/index.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)
- [research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json](research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json)
- [research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json](research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json)

#### Y6-02 — x ₄=c 절단

원문: 48쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
q(y,c), energy density, 선택된 invariant observable을 3D에 표시하고 c를 연속/격자 index로 조절한다. 합격: 기존 SU(2)
BPST slice의 해석식을 회귀검사한다. interpolated slice는 보간 방식과 오차를 표시하고 실제 격자면과 구별한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/field-family.mjs](research-ide/mathscope-m3/gauge/field-family.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)
- [research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json](research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json)
- [research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json](research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json)

#### Y6-03 — x ₄ 방향 적분·평균 구별

원문: 48쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
marginal at Σn q(y,n at), 평균 (1/Nt) Σn q, 한 표본과 ensemble 평균을 서로 다른 연산자로 둔다. 합격: marginal의 단위
가 q×length로 바뀐다. BPST 무한 방향 해석식과 finite window tail을 확인하고 at 누락·합/평균 혼동을 잡는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/field-family.mjs](research-ide/mathscope-m3/gauge/field-family.mjs)
- [research-ide/mathscope-m3/gauge/lattice-observation.mjs](research-ide/mathscope-m3/gauge/lattice-observation.mjs)
- [research-ide/mathscope-m3/gauge/tests/lattice-observation-flow.test.mjs](research-ide/mathscope-m3/gauge/tests/lattice-observation-flow.test.mjs)
- [research-ide/mathscope-m3/gauge/evidence/lattice-flow-tests.tap](research-ide/mathscope-m3/gauge/evidence/lattice-flow-tests.tap)
- [research-ide/mathscope-m3/gauge/evidence/lattice-chain-marginal-mean.json](research-ide/mathscope-m3/gauge/evidence/lattice-chain-marginal-mean.json)
- [research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json](research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json)
- [research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json](research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json)

#### Y6-04 — 안전한 게이지 불변 기본 화면

원문: 48쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
plaquette energy·Wilson character·정규화된 density·correlation을 기본 채널로 둔다. A/F 성분은 gauge를 고정한 진단
모드에 둔다. 합격: gauge transformation 전후 기본 채널은 같고 성분 채널에는 gauge ID가 보인다. gauge-dependent
arrow의 형태에서 질량 간극을 추론하지 않는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/field-family.mjs](research-ide/mathscope-m3/gauge/field-family.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)
- [research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json](research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json)
- [research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json](research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json)

#### Y6-05 — Flow와 투영된 loop의 의미 보존

원문: 48쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
gradient flow time을 독립 매개변수로 둔다. 4D loop를 3D에 그릴 때 원래 경로와 x ₄ 이동을 함께 보관한다. 합격: flowed
density를 원본 density로 덮어쓰지 않는다. 원래 loop holonomy와 projected path에서 다시 계산한 holonomy를 동일시
하지 않는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/wilson-flow.mjs](research-ide/mathscope-m3/gauge/wilson-flow.mjs)
- [research-ide/mathscope-m3/gauge/field-family.mjs](research-ide/mathscope-m3/gauge/field-family.mjs)
- [research-ide/mathscope-m3/gauge/tests/lattice-observation-flow.test.mjs](research-ide/mathscope-m3/gauge/tests/lattice-observation-flow.test.mjs)
- [research-ide/mathscope-m3/gauge/evidence/lattice-flow-tests.tap](research-ide/mathscope-m3/gauge/evidence/lattice-flow-tests.tap)
- [research-ide/mathscope-m3/gauge/evidence/wilson-flow-su2.json](research-ide/mathscope-m3/gauge/evidence/wilson-flow-su2.json)
- [research-ide/mathscope-m3/gauge/evidence/wilson-flow-g2.json](research-ide/mathscope-m3/gauge/evidence/wilson-flow-g2.json)
- [research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json](research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json)
- [research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json](research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json)

#### Y6-06 — Δ별 상태 비교

원문: 48쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
같은 좌표 범위·단위·color scale로 Δ₁,Δ₂의 field family와 상관함수를 비교한다. 독립 정규화는 선택적으로 표시한다. 합격:
색상 auto-normalization으로 가려지는 밀도 크기 차이를 확인할 수 있다. assumed/effective/estimated 상태가 모든 비교
패널에 나타난다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/field-family.mjs](research-ide/mathscope-m3/gauge/field-family.mjs)
- [research-ide/mathscope-m3/gauge/spectral.mjs](research-ide/mathscope-m3/gauge/spectral.mjs)
- [research-ide/mathscope-m3/gauge/ensemble-family.mjs](research-ide/mathscope-m3/gauge/ensemble-family.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)
- [research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json](research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json)
- [research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json](research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json)

#### Y6-07 — 그림에서 Lean 명제로 연결

원문: 48쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
관측을 선택하면 정확한 observable·domain·projection·claim type을 내보낸다. proof 후보는 fibre 조건과 reconstruction
certificate를 요구한다. 합격: 같은 3D 투영을 가진 다른 4D source를 반례 fixture로 제공한다. projection 그림의 동일성
만으로 4D 성질·spectral gap을 복원하는 명제를 거부한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/proof.mjs](research-ide/mathscope-m3/gauge/proof.mjs)
- [research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean](research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean)
- [research-ide/mathscope-m3/gauge/evidence/lean-audit.json](research-ide/mathscope-m3/gauge/evidence/lean-audit.json)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)
- [research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json](research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json)
- [research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json](research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json)

#### Y6-08 — 세션 재현·접근성·stale 확인

원문: 48쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
수치 테이블·키보드·색각 독립 표식과 원본 데이터를 제공한다. scene/model/proof revision을 분리하여 저장한다. 합격: 재
열기 시 같은 source·관측·가정을 복원한다. G· Δ 모형·경계·proof source 변경은 관련 결과를 stale로 만들고 단순 카메라 이
동은 만들지 않는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/index.mjs](research-ide/mathscope-m3/gauge/index.mjs)
- [research-ide/mathscope-m3/gauge/proof.mjs](research-ide/mathscope-m3/gauge/proof.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)
- [research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json](research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json)
- [research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json](research-ide/mathscope-m3/gauge/evidence/ui-criterion-assessment.json)

### Y7

#### Y7-01 — 기존 검증 범위를 고정

원문: 50쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Core와 Mathlib scaffold의 실제 source hash·toolchain·axiom audit를 유지한다. 기존 선언형 quantum model을 full
QFT로 오인하지 않는다. 합격: 기존 Core 10개의 axiom-free 보조정리와 사용자 axiom 의존 corollary를 분리한다.
Mathlib 표준 axiom과 사용자 YM axiom도 별도 표시한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/legacy/MathScopeConditionalYM_Core.lean](research-ide/mathscope-m3/gauge/legacy/MathScopeConditionalYM_Core.lean)
- [research-ide/mathscope-m3/gauge/legacy/MathScopeConditionalYM.lean](research-ide/mathscope-m3/gauge/legacy/MathScopeConditionalYM.lean)
- [research-ide/mathscope-m3/gauge/legacy/original-validation.json](research-ide/mathscope-m3/gauge/legacy/original-validation.json)
- [research-ide/mathscope-m3/gauge/evidence/lean-audit.json](research-ide/mathscope-m3/gauge/evidence/lean-audit.json)
- [research-ide/mathscope-m3/gauge/proof-data.mjs](research-ide/mathscope-m3/gauge/proof-data.mjs)

#### Y7-02 — 유한 대수 인증서를 Lean에 연결

원문: 50쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Y1 bracket table·Y2 embedding·Y3 path/Wilson 항등식의 정확 데이터를 import하고 kernel에서 검사한다. 합격: 생성
기의 성공 로그 대신 Lean certificate와 source hash가 필요하다. 잘못된 Jacobi·경로 순서·embedding index fixture가 실
제 거부된다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/verify_lean.py](research-ide/mathscope-m3/gauge/verify_lean.py)
- [research-ide/mathscope-m3/gauge/evidence/lean-audit.json](research-ide/mathscope-m3/gauge/evidence/lean-audit.json)
- [research-ide/mathscope-m3/gauge/evidence/lean/NegativeJacobi.log](research-ide/mathscope-m3/gauge/evidence/lean/NegativeJacobi.log)
- [research-ide/mathscope-m3/gauge/evidence/lean/NegativeEmbeddingIndex.log](research-ide/mathscope-m3/gauge/evidence/lean/NegativeEmbeddingIndex.log)
- [research-ide/mathscope-m3/gauge/evidence/lean/m1-NegativeWilson.log](research-ide/mathscope-m3/gauge/evidence/lean/m1-NegativeWilson.log)

#### Y7-03 — 유한 spectral certificate

원문: 50쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
유한 양의 가중치·spectral sum·전달행렬 enclosure를 각각 formalize한다. 숫자 고유값 출력과 enclosing proof를 구분한
다. 합격: 계수 sign·at>0·r<1·비진공 subspace 조건을 빠뜨리면 해당 하한 정리를 사용할 수 없다. certificate의 모델 cutoff
를 결론에 남긴다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean](research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean)
- [research-ide/mathscope-m3/gauge/evidence/lean-audit.json](research-ide/mathscope-m3/gauge/evidence/lean-audit.json)
- [research-ide/mathscope-m3/gauge/lean/RealSpectralBridge.lean](research-ide/mathscope-m3/gauge/lean/RealSpectralBridge.lean)
- [research-ide/mathscope-m3/gauge/verify_real_lean.py](research-ide/mathscope-m3/gauge/verify_real_lean.py)
- [research-ide/mathscope-m3/gauge/evidence/real-lean-release.json](research-ide/mathscope-m3/gauge/evidence/real-lean-release.json)
- [research-ide/mathscope-m3/gauge/evidence/real-lean-audit/audit.json](research-ide/mathscope-m3/gauge/evidence/real-lean-audit/audit.json)
- [research-ide/mathscope-m3/gauge/package_lean.py](research-ide/mathscope-m3/gauge/package_lean.py)

#### Y7-04 — 사용자 존재·간극 axiom의 출처 저장

원문: 50쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
고정된 모델 의미·G·단위· Δ·quantifier를 갖는 가정을 등록한다. user/paper/heuristic 출처와 source revision, 의존 정리를
기록한다. 합격: 상충하는 spectrum/Δ 가정을 감지하면 중단한다. 임의 Prop P 모두를 참으로 선언하는 식의 광범위 axiom
은 금지하고 YM 의미 술어를 고정한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/proof.mjs](research-ide/mathscope-m3/gauge/proof.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)

#### Y7-05 — 투영 뒤 corollary의 정확한 계약

원문: 50쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
projection observation이 fibre-constant인지, reconstruction이 어느 집합에서 성립하는지, spectrum 전달은 어떤 포함
가정인지 요구한다. 합격: 그림을 다시 Lean 형태로 적었다는 사실만으로 새 정리를 승인하지 않는다. conditional theorem
에는 필요한 reconstruction/transfer 가정과 사용자 axiom 목록이 남는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/proof.mjs](research-ide/mathscope-m3/gauge/proof.mjs)
- [research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean](research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean)
- [research-ide/mathscope-m3/gauge/evidence/lean-audit.json](research-ide/mathscope-m3/gauge/evidence/lean-audit.json)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)

#### Y7-06 — OS/transfer 재구성 의무 분리

원문: 50쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Schwinger functions/observable algebra, regularity, Euclidean symmetry, reflection positivity, clustering·vacuum
조건과 재구성 정리 적용을 독립 작업으로 둔다. 합격: 특정 lattice 외부 정리의 가정이 매핑되어도 continuum 재구성 완료
로 체크하지 않는다. gauge-invariant observable의 재구성 문제를 gauge potential positivity와 구별한다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/contracts.mjs](research-ide/mathscope-m3/gauge/contracts.mjs)
- [research-ide/mathscope-m3/gauge/proof.mjs](research-ide/mathscope-m3/gauge/proof.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)

#### Y7-07 — 새 continuum YM 구성의 연구 목표

원문: 50쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
일정 물리량 조건의 continuum·무한 부피 극한, 비자명성, 필요한 QFT axioms, uniform positive gap을 서로 다른 proof
obligation으로 둔다. 합격: 각 극한의 존재·모형 식별·uniform bound 근거 없이는 OPEN CONTINUUM을 유지한다. 격자
simulation·유효모형·사용자 존재 axiom으로 Clay 완료 상태를 만들지 않는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/contracts.mjs](research-ide/mathscope-m3/gauge/contracts.mjs)
- [research-ide/mathscope-m3/gauge/proof.mjs](research-ide/mathscope-m3/gauge/proof.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)

#### Y7-08 — 최종 회귀검사와 증거 bundle

원문: 50쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
핀된 Lean/mathlib, no-sorry 검사, axiom audit, negative control, 소스·데이터 hash, 예측된 failure cases를 묶는다. 합
격: 변경된 소스는 새 kernel 결과가 나올 때까지 unverified다. 보고서에는 유한 결과·조건부 결과·추정·열린 의무가 각각의
범위와 함께 표시된다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**증거와 구현:**

- [research-ide/mathscope-m3/gauge/verify_lean.py](research-ide/mathscope-m3/gauge/verify_lean.py)
- [research-ide/mathscope-m3/gauge/package_lean.py](research-ide/mathscope-m3/gauge/package_lean.py)
- [research-ide/mathscope-m3/gauge/evidence/lean-audit.json](research-ide/mathscope-m3/gauge/evidence/lean-audit.json)
- [research-ide/mathscope-m3/gauge/proof-data.mjs](research-ide/mathscope-m3/gauge/proof-data.mjs)
- [research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs](research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs)
- [research-ide/mathscope-m3/gauge/evidence/real-lean-release.json](research-ide/mathscope-m3/gauge/evidence/real-lean-release.json)
- [research-ide/mathscope-m3/gauge/evidence/source-transport-audit.json](research-ide/mathscope-m3/gauge/evidence/source-transport-audit.json)
- [research-ide/mathscope-m3/gauge/evidence/package-guard-audit.json](research-ide/mathscope-m3/gauge/evidence/package-guard-audit.json)
- [research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json](research-ide/mathscope-m3/gauge/evidence/live-ui-v85-v89-gauge.json)

### N6

#### N6-01 — 초기 finite state 구성

원문: 62쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
primary curls 뒤 temporal mean update와 다섯 moment correction을 수행하여 j=0 상태를 만든다. 합격: Proposition9.5
의 B0=0.7,C0*=1.2와 (9.9),(9.10) 명세를 충족한다. 명세의 상수 없이 경험적 power slope만으로 인증하지 않는다.
```

**판정:** `status=OPEN` · `originalCriterionComplete=false`.

**검증 범위:** All original bands/labels now contribute to the actual current; a separate passing12-test source gate applies the original five moments and recomputes nonlinear mean pressure. That gate is PRE-temporal and is not j0. The ordered temporal-then-moment construction and B0=0.7/C0*=1.2 remain required.

**남은 의무:**

- Apply the actual full-torus temporal mean inverse, then apply the five original moments to that updated current.
- Recompute full pressure after each ordered update and establish B0=0.7, C0*=1.2 and the exact(9.9)-(9.10) classes.

**증거와 구현:**

- [navier/source-inheritance.json](navier/source-inheritance.json)
- [navier/source-mean-map.mjs](navier/source-mean-map.mjs)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/evidence/source-current-20261012/current-state.json](navier/evidence/source-current-20261012/current-state.json)
- [navier/evidence/source-current-20261012/full-pressure.json](navier/evidence/source-current-20261012/full-pressure.json)
- [navier/evidence/source-current-20261012/higher-pulse-jets.json](navier/evidence/source-current-20261012/higher-pulse-jets.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-global-current.mjs](navier/source-global-current.mjs)
- [navier/source-global-signed.mjs](navier/source-global-signed.mjs)
- [navier/source-global-moment.mjs](navier/source-global-moment.mjs)
- [navier/evidence/global-current-20261012/attempt1/receipt.json](navier/evidence/global-current-20261012/attempt1/receipt.json)
- [navier/evidence/global-signed-20261012/attempt1/receipt.json](navier/evidence/global-signed-20261012/attempt1/receipt.json)
- [navier/evidence/global-moment-20261012/attempt1/receipt.json](navier/evidence/global-moment-20261012/attempt1/receipt.json)
- [navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md)

#### N6-02 — 전체 residual 재계산

원문: 62쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
R(u+δu,p+δp)=R(u,p)+Lu(δu,δp)+div(δu⊗δu)를 사용하며 매 substep 후 최신 압력을 복원한다. 합격: 독립 직접 PDE
평가와 decomposed residual이 오차 예산 내 일치한다. 기존 flat tail와 새 quadratic remainder를 장부에서 누락하지 않
는다.
```

**판정:** `status=PARTIAL` · `originalCriterionComplete=false`.

**검증 범위:** The full all-label current, signed update and separate five-moment update now recompute all six Haar covariances, full nonlinear mean residual and pressure. This does not yet compare the complete auxiliary/physical PDE after every ordered stage.

**남은 의무:**

- Construct full auxiliary pressure after the actual signed update and after every later correction substep.
- Compare independent complete physical PDE evaluation with the full decomposed source residual, including the old flat tail, every quadratic product and explicit error budgets.

**증거와 구현:**

- [navier/galerkin.mjs](navier/galerkin.mjs)
- [navier/evidence/acceptance.json](navier/evidence/acceptance.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/evidence/source-current-20261012/full-pressure.json](navier/evidence/source-current-20261012/full-pressure.json)
- [navier/evidence/source-current-20261012/current-signed-stress.json](navier/evidence/source-current-20261012/current-signed-stress.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-global-current.mjs](navier/source-global-current.mjs)
- [navier/source-global-signed.mjs](navier/source-global-signed.mjs)
- [navier/source-global-moment.mjs](navier/source-global-moment.mjs)
- [navier/evidence/global-current-20261012/attempt1/receipt.json](navier/evidence/global-current-20261012/attempt1/receipt.json)
- [navier/evidence/global-signed-20261012/attempt1/receipt.json](navier/evidence/global-signed-20261012/attempt1/receipt.json)
- [navier/evidence/global-moment-20261012/attempt1/receipt.json](navier/evidence/global-moment-20261012/attempt1/receipt.json)
- [navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md)

#### N6-03 — 비영 angular harmonics 보정

원문: 62쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
현재 source의 모든 nonzero harmonics를 (7.13) inverse로 풀고 source-supported potentials에 cutoff 후 curl한다.
합격: same-label 곱에서 m+m′ 신규 주파수가 생성된다. 단계별 최대 harmonic을 기록하고 조용한 truncation 대신
discarded-mode bound를 제공한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Every nonzero harmonic of the same actual updated source is solved by the original projected inverse and realized by the full supported cutoff curl. All current and new m+m-prime modes are retained with a complete finite angular inventory and zero discarded angular tail. The saved eleven source graphs were independently rebound and replayed for 540 PDE coefficients and 2320 scalar identities. The original combined construction remains timed out; no absent final current certificate, uniform all-order class, whole-field numeric enclosure, j0 initialization or full correction cycle is inferred.

**증거와 구현:**

- [navier/corrections.mjs](navier/corrections.mjs)
- [navier/evidence/N6-harmonic.json](navier/evidence/N6-harmonic.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/evidence/source-current-20261012/higher-pulse-jets.json](navier/evidence/source-current-20261012/higher-pulse-jets.json)
- [navier/source-higher-jets.mjs](navier/source-higher-jets.mjs)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-global-current.mjs](navier/source-global-current.mjs)
- [navier/source-global-signed.mjs](navier/source-global-signed.mjs)
- [navier/source-global-moment.mjs](navier/source-global-moment.mjs)
- [navier/evidence/global-current-20261012/attempt1/receipt.json](navier/evidence/global-current-20261012/attempt1/receipt.json)
- [navier/evidence/global-signed-20261012/attempt1/receipt.json](navier/evidence/global-signed-20261012/attempt1/receipt.json)
- [navier/evidence/global-moment-20261012/attempt1/receipt.json](navier/evidence/global-moment-20261012/attempt1/receipt.json)
- [navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md)
- [navier/source-global-forced-current-evidence.mjs](navier/source-global-forced-current-evidence.mjs)
- [navier/source-global-forced-current-evidence-data.mjs](navier/source-global-forced-current-evidence-data.mjs)
- [navier/tests/build-global-forced-current-evidence.py](navier/tests/build-global-forced-current-evidence.py)
- [navier/tests/replay-forced-current-snapshots.mjs](navier/tests/replay-forced-current-snapshots.mjs)
- [navier/tests/run-forced-snapshot-replay.py](navier/tests/run-forced-snapshot-replay.py)
- [navier/evidence/forced-snapshot-replay-20261012/attempt1/receipt.json](navier/evidence/forced-snapshot-replay-20261012/attempt1/receipt.json)
- [navier/evidence/forced-snapshot-replay-20261012/attempt1/replay.json](navier/evidence/forced-snapshot-replay-20261012/attempt1/replay.json)
- [navier/evidence/forced-snapshot-replay-20261012/attempt1/independent.json](navier/evidence/forced-snapshot-replay-20261012/attempt1/independent.json)
- [navier/evidence/global-forced-current-20261012/attempt382884203291/receipt.json](navier/evidence/global-forced-current-20261012/attempt382884203291/receipt.json)
- [web/navier-source-forced-current-view.mjs](web/navier-source-forced-current-view.mjs)
- [web/tests/navier-source-forced-current-view.test.mjs](web/tests/navier-source-forced-current-view.test.mjs)

#### N6-04 — Signed covariance increment

원문: 62쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
고정 positive a±에 대해 δa=(Hcov^−1(Σ/ε))/(2a)를 사용한다. 새 Σ는 signed일 수 있다. 합격: B(W0,LΣ)=Σ와 (7.41)의
세 remainder를 모두 검사한다. 앞 단계 a±를 새 residual에 맞춰 몰래 재선택하지 않는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The actual all-cover current U=W0+E supplies its own signed Sigma. The original H and positive a remain fixed; the exact complete81-label partition and chart law give B(W0,L Sigma)=Sigma. All six covariance components retain and check each of the three(7.41) remainder families. The observed13-test source gate and230 unchanged source dependencies establish this original operator criterion. The historical receipt retains originalN604Complete=false; this separate later assessment corrects its overly broad requirement for initializedj0 and all-stage(7.42) class bounds, which belong to N6-01/07 and package completion. No j0, all-stage class bound, numerical field enclosure or full N6 is claimed.

**증거와 구현:**

- [navier/corrections.mjs](navier/corrections.mjs)
- [navier/source-inheritance.json](navier/source-inheritance.json)
- [navier/evidence/N6-signed.json](navier/evidence/N6-signed.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/evidence/source-current-20261012/current-signed-stress.json](navier/evidence/source-current-20261012/current-signed-stress.json)
- [navier/source-signed-stress.mjs](navier/source-signed-stress.mjs)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-global-current.mjs](navier/source-global-current.mjs)
- [navier/source-global-signed.mjs](navier/source-global-signed.mjs)
- [navier/source-global-moment.mjs](navier/source-global-moment.mjs)
- [navier/evidence/global-current-20261012/attempt1/receipt.json](navier/evidence/global-current-20261012/attempt1/receipt.json)
- [navier/evidence/global-signed-20261012/attempt1/receipt.json](navier/evidence/global-signed-20261012/attempt1/receipt.json)
- [navier/evidence/global-moment-20261012/attempt1/receipt.json](navier/evidence/global-moment-20261012/attempt1/receipt.json)
- [navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md)
- [navier/tests/build-global-signed-evidence.py](navier/tests/build-global-signed-evidence.py)
- [navier/source-global-signed-evidence.mjs](navier/source-global-signed-evidence.mjs)
- [navier/tests/global-signed-archive.test.mjs](navier/tests/global-signed-archive.test.mjs)
- [navier/evidence/PACKED_EVIDENCE.md](navier/evidence/PACKED_EVIDENCE.md)

#### N6-05 — Zero auxiliary mean Fourier inverse

원문: 62쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(8.19)의 1/(2 πi vt·k) multiplier로 (8.20)을 풀고 axial increment는 (8.14)의 potential로 실현한다. 합격: zero mode가
0이고 Nφ=F가 맞는다. |vt·k|^ −1≤C(1+|k|) 및 4개 추가 도함수를 포함한 Fourier tail를 기록한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The zero-auxiliary-mean Fourier inverse is now constructed from the same authenticated complete original current and full auxiliary pressure on all81 boxes and both signs. Actual Fourier coefficients use the original direction (sqrt(2)-1,1), retain the exact nonzero quadratic integer divisor norm, remove rather than divide the zero mode, and satisfy the directly differentiated N identity. The infinite inverse remains an exact limit: C0/C1 tails include four extra source derivatives, and each requested slow/torus derivative has its own actual differentiated source bound. All466 indexed derivative programs retain162 rows and materialize their genuine local derivatives. The original T1 meridional potential retains ci^-1, the axial A1 remainder and slow-time derivatives while preserving incompressibility. Actual attempt3 passed15 tests with123 source files unchanged; independent kernel5 tests plus662 exact checks and both prior resource failures are preserved. The complete24,527,857-byte artifact is distributed by verified lossless gzip. The individual temporal operator is complete; post-temporal nonlinear pressure, new five moments, j0 and all-order class bounds remain separate pending requirements.

**증거와 구현:**

- [navier/corrections.mjs](navier/corrections.mjs)
- [navier/evidence/N6-workbench.json](navier/evidence/N6-workbench.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/evidence/source-current-20261012/full-pressure.json](navier/evidence/source-current-20261012/full-pressure.json)
- [navier/evidence/source-current-20261012/higher-pulse-jets.json](navier/evidence/source-current-20261012/higher-pulse-jets.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-global-current.mjs](navier/source-global-current.mjs)
- [navier/source-global-signed.mjs](navier/source-global-signed.mjs)
- [navier/source-global-moment.mjs](navier/source-global-moment.mjs)
- [navier/evidence/global-current-20261012/attempt1/receipt.json](navier/evidence/global-current-20261012/attempt1/receipt.json)
- [navier/evidence/global-signed-20261012/attempt1/receipt.json](navier/evidence/global-signed-20261012/attempt1/receipt.json)
- [navier/evidence/global-moment-20261012/attempt1/receipt.json](navier/evidence/global-moment-20261012/attempt1/receipt.json)
- [navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md)
- [navier/source-global-temporal.mjs](navier/source-global-temporal.mjs)
- [navier/source-temporal-potential.mjs](navier/source-temporal-potential.mjs)
- [navier/source-auxiliary-derivative-closure.mjs](navier/source-auxiliary-derivative-closure.mjs)
- [navier/source-global-temporal-evidence.mjs](navier/source-global-temporal-evidence.mjs)
- [navier/tests/global-source-temporal.test.mjs](navier/tests/global-source-temporal.test.mjs)
- [navier/tests/global-temporal-archive.test.mjs](navier/tests/global-temporal-archive.test.mjs)
- [navier/tests/build-global-temporal-evidence.py](navier/tests/build-global-temporal-evidence.py)
- [navier/evidence/global-temporal-20261012/attempt3/receipt.json](navier/evidence/global-temporal-20261012/attempt3/receipt.json)
- [navier/evidence/global-temporal-20261012/attempt3/global-temporal.json.gz](navier/evidence/global-temporal-20261012/attempt3/global-temporal.json.gz)
- [navier/evidence/global-temporal-20261012/attempt3/source-bytes.json](navier/evidence/global-temporal-20261012/attempt3/source-bytes.json)
- [navier/evidence/auxiliary-fourier-kernel-20261012/attempt1/receipt.json](navier/evidence/auxiliary-fourier-kernel-20261012/attempt1/receipt.json)

#### N6-06 — 다섯 radial equations와 압력

원문: 62쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(8.25)로 두 보존 모멘트와 P,J θ,Jz를 보정하고 (8.12)로 pressure를 다시 계산한다. 합격: 두 보존 적분은 0으로 유지되고 새
결함은 (8.26),(8.27)의 nonlinear remainder와 일치한다. λ의 작은 값에 따른 condition number를 통제한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The original all-label current is supplied to the five authentic radial equations. Both conserved integrals remain exactly zero; P/Jtheta/Jz targets are corrected using the fixed original five-profile map. Full auxiliary pressure(8.12) is restored after the actual update, including every nonzero auxiliary mode, and independent complete angular-mean PDE checks agree with the full nonlinear(8.26)/(8.27) remainder. The lambda-scaled and logarithmic inverse bounds retain the original tiny positive lambda and all positive row factors. The actual10-test gate has17 source checks and121 unchanged source files. This completes the individual operator criterion; the separate temporal ordering, initializedj0, B0/C0*, all-order classes and full N6 remain incomplete.

**증거와 구현:**

- [navier/source-mean-map.mjs](navier/source-mean-map.mjs)
- [navier/evidence/N6-source-mean.json](navier/evidence/N6-source-mean.json)
- [navier/evidence/N6-moments.json](navier/evidence/N6-moments.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/evidence/source-current-20261012/current-state.json](navier/evidence/source-current-20261012/current-state.json)
- [navier/evidence/source-current-20261012/current-signed-stress.json](navier/evidence/source-current-20261012/current-signed-stress.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-global-current.mjs](navier/source-global-current.mjs)
- [navier/source-global-signed.mjs](navier/source-global-signed.mjs)
- [navier/source-global-moment.mjs](navier/source-global-moment.mjs)
- [navier/evidence/global-current-20261012/attempt1/receipt.json](navier/evidence/global-current-20261012/attempt1/receipt.json)
- [navier/evidence/global-signed-20261012/attempt1/receipt.json](navier/evidence/global-signed-20261012/attempt1/receipt.json)
- [navier/evidence/global-moment-20261012/attempt1/receipt.json](navier/evidence/global-moment-20261012/attempt1/receipt.json)
- [navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md)
- [navier/evidence/global-moment-pressure-20261012/attempt1/receipt.json](navier/evidence/global-moment-pressure-20261012/attempt1/receipt.json)
- [navier/source-global-moment-pressure.mjs](navier/source-global-moment-pressure.mjs)
- [navier/source-full-mean-equations.mjs](navier/source-full-mean-equations.mjs)
- [navier/source-global-moment-pressure-evidence.mjs](navier/source-global-moment-pressure-evidence.mjs)
- [navier/tests/build-global-moment-pressure-evidence.py](navier/tests/build-global-moment-pressure-evidence.py)
- [navier/tests/global-moment-pressure-archive.test.mjs](navier/tests/global-moment-pressure-archive.test.mjs)
- [navier/evidence/global-moment-pressure-20261012/attempt1/global-moment-pressure.json.gz](navier/evidence/global-moment-pressure-20261012/attempt1/global-moment-pressure.json.gz)
- [navier/evidence/packed-evidence.json](navier/evidence/packed-evidence.json)

#### N6-07 — 고정 도메인과 차수 향상

원문: 62쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
σj=1/5+j/10, gj=hj/10 및 (9.17),(9.18)의 Km,ℓm,log powers를 추적한다. 합격: 모든 finite stage가 같은 q<qbig 도메
인을 사용한다. 단 한 번의 step에서 샘플 잔차가 늘면 정밀도/범위/상수부터 조사하고 차수 theorem과 혼동하지 않는다.
```

**판정:** `status=PARTIAL` · `originalCriterionComplete=false`.

**검증 범위:** The separate successful original domain bridge establishes one permitted common qBig from executed initial source conditions and Lemma9.7. It does not supply all-stage Km,ell_m/log-power bounds, differentiated tails or the order improvement for a complete iteration.

**남은 의무:**

- Establish all-stage Km,ell_m/log-power constants on the now justified fixed original qBig.
- Carry every physical derivative loss and differentiated tail; sample residual slopes are not the order theorem.

**증거와 구현:**

- [navier/corrections.mjs](navier/corrections.mjs)
- [navier/evidence/N6-workbench.json](navier/evidence/N6-workbench.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/evidence/source-current-20261012/higher-pulse-jets.json](navier/evidence/source-current-20261012/higher-pulse-jets.json)
- [navier/evidence/source-current-20261012/current-signed-stress.json](navier/evidence/source-current-20261012/current-signed-stress.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-global-current.mjs](navier/source-global-current.mjs)
- [navier/source-global-signed.mjs](navier/source-global-signed.mjs)
- [navier/source-global-moment.mjs](navier/source-global-moment.mjs)
- [navier/evidence/global-current-20261012/attempt1/receipt.json](navier/evidence/global-current-20261012/attempt1/receipt.json)
- [navier/evidence/global-signed-20261012/attempt1/receipt.json](navier/evidence/global-signed-20261012/attempt1/receipt.json)
- [navier/evidence/global-moment-20261012/attempt1/receipt.json](navier/evidence/global-moment-20261012/attempt1/receipt.json)
- [navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md)

#### N6-08 — 최종 local 합성

원문: 62쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(9.21)에서 Aj,Bj,pj에 shrinking cutoff를 적용하고 curl하여 local field를 만든다. finite residual의 flat terms를 무조건 합
산하지 않는다. 합격: Lemma5.4의 tail 비교로 (9.20)을 연결한다. 평가 구간의 active indices와 생략 tail의 bound를 저장
하고 없으면 finite-stage approximation으로 제한한다.
```

**판정:** `status=OPEN` · `originalCriterionComplete=false`.

**검증 범위:** Actual all-cover current/signed/moment expressions are retained, but the full ordered finite correction sequence and shrinking-cutoff final sum with Lemma5.4 tail are not yet constructed.

**남은 의무:**

- Construct the complete finite correction sequence from the actual j=0 state.
- Choose and differentiate the shrinking cutoffs, prove their summable tails and perform the fixed-stage Lemma5.4 comparison.
- Store the actual active indices and rigorously omitted tail for every evaluation domain.

**증거와 구현:**

- [navier/index.mjs](navier/index.mjs)
- [navier/source-inheritance.json](navier/source-inheritance.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/evidence/source-current-20261012/current-signed-stress.json](navier/evidence/source-current-20261012/current-signed-stress.json)
- [navier/source-current-evidence.mjs](navier/source-current-evidence.mjs)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-global-current.mjs](navier/source-global-current.mjs)
- [navier/source-global-signed.mjs](navier/source-global-signed.mjs)
- [navier/source-global-moment.mjs](navier/source-global-moment.mjs)
- [navier/evidence/global-current-20261012/attempt1/receipt.json](navier/evidence/global-current-20261012/attempt1/receipt.json)
- [navier/evidence/global-signed-20261012/attempt1/receipt.json](navier/evidence/global-signed-20261012/attempt1/receipt.json)
- [navier/evidence/global-moment-20261012/attempt1/receipt.json](navier/evidence/global-moment-20261012/attempt1/receipt.json)
- [navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N6_SOURCE_SCOPE_REVIEW_2026_10_12.md)

### N7

#### N7-01 — 시간·공간 cutoff 선택

원문: 64쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
q≤C0(τ+|z|^(1/D))로 support를 q<q*/2 안에 놓고 c= χxχt를 선택한다. χx는 r²,z에 smooth하게 둔다. 합격: u=p=0인
초기 시간구간과 고정 compact K가 존재한다. t가 1에 가까울 때 원점 근방에서 cutoff가 정확히 1이어야 한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The actual unchanged common6 initial source premises, original positive mean-map inverses, pulse/frame estimates and fixed covariance denominators were executed and bound to Lemma9.7. Proposition9.9 permits the same qStar=qBig; the exact choice qBig=qCommon/64 gives support q<=qBig/4<qBig/2. The same smooth r^2/z cutoff operator has a positive initial zero interval, fixed compact K and exact unit plateau near the origin. The observed source gate passed11/11 with52 independent Fraction checks and101 unchanged dependency files. This completes the original cutoff/domain criterion. The source-theorem application is explicit; no new Lean proof, nonzero final N6 field, full localized force or whole-K active energy is claimed.

**증거와 구현:**

- [navier/localization.mjs](navier/localization.mjs)
- [navier/evidence/N7-workbench.json](navier/evidence/N7-workbench.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-localization-domain.mjs](navier/source-localization-domain.mjs)
- [navier/source-exterior-force-jets.mjs](navier/source-exterior-force-jets.mjs)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json)
- [navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md)

#### N7-02 — Localization 교차항 보존

원문: 64쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(10.4)의 curl(cA), 특히 ∇c×A를 포함하고 f를 전체 PDE residual로 정의한다. 합격: 직접 계산된 f와 cutoff 전 residual+모
든 commutator 전개의 일치 여부를 검사한다. ∇·u=0은 구조적으로 유지한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The exact original curl(cA)+cB and cp coefficient rows are authenticated to the observed original localization source and verified qBig domain. A fresh BigInt differential-polynomial calculation directly evaluates the complete physical PDE residual and independently expands all ten cutoff commutator families, including gradient-c cross A, all quadratic terms and the unmodified local residual. All coefficient maps agree exactly and structural divergence vanishes. Eighteen captured cutoff derivative identities, eight operator identities, fourteen nonzero omission/symmetry controls, ten Node tests and fifty-five independent exact Python checks pass. The original final fields remain universal operands of this proven operator identity; their nonzero annular values are not numerically enumerated and original source smoothness theorems remain declared.

**증거와 구현:**

- [navier/localization.mjs](navier/localization.mjs)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-localization-domain.mjs](navier/source-localization-domain.mjs)
- [navier/source-exterior-force-jets.mjs](navier/source-exterior-force-jets.mjs)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json)
- [navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md)
- [navier/source-localization-operator.mjs](navier/source-localization-operator.mjs)
- [navier/localization-jet-algebra.mjs](navier/localization-jet-algebra.mjs)
- [navier/source-localization-operator-evidence.mjs](navier/source-localization-operator-evidence.mjs)
- [navier/tests/source-localization-operator.test.mjs](navier/tests/source-localization-operator.test.mjs)
- [navier/tests/build-localization-operator-evidence.py](navier/tests/build-localization-operator-evidence.py)
- [navier/tests/localization-operator-archive.test.mjs](navier/tests/localization-operator-archive.test.mjs)
- [navier/evidence/source-localization-operator-20261012/attempt1/receipt.json](navier/evidence/source-localization-operator-20261012/attempt1/receipt.json)
- [navier/evidence/source-localization-operator-20261012/attempt1/localization-operator.json](navier/evidence/source-localization-operator-20261012/attempt1/localization-operator.json)
- [navier/evidence/source-localization-operator-20261012/attempt1/independent-exact.json](navier/evidence/source-localization-operator-20261012/attempt1/independent-exact.json)
- [navier/SOURCE_LOCALIZATION_OPERATOR.md](navier/SOURCE_LOCALIZATION_OPERATOR.md)

#### N7-03 — Force의 발산과 압력 계약

원문: 64쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
원문 p118에 따라 f는 divergence-free일 필요가 없다. −Δp=∂i∂j(uiuj)−div f를 검사한다. 합격: div f≠0을 실패로 처리하
지 않는다. 임의 Leray projection으로 f를 바꿔 compact support/pressure 조건을 훼손하지 않는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The same original cp pressure and unprojected full force satisfy -Delta p = partial_i partial_j(u_i u_j) - div f as an exact differential-polynomial identity. The source-bound actual exterior heat record retains strictly nonzero negative force divergence; independent exact arithmetic verifies its pressure identity and rejects omission of div f, cutoff terms and incorrect cylindrical normalization. No Leray projection changes the force. Compact support and pressure normalization are inherited from the authenticated original operator/domain. This completes the individual force/pressure operator contract without claiming complete all-space force values, terminal jets, extension or active whole-K energy.

**증거와 구현:**

- [navier/localization.mjs](navier/localization.mjs)
- [navier/galerkin.mjs](navier/galerkin.mjs)
- [navier/evidence/N8-acceptance.json](navier/evidence/N8-acceptance.json)
- [navier/evidence/source-current-20261012/full-pressure.json](navier/evidence/source-current-20261012/full-pressure.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-localization-domain.mjs](navier/source-localization-domain.mjs)
- [navier/source-exterior-force-jets.mjs](navier/source-exterior-force-jets.mjs)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json)
- [navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md)
- [navier/source-localization-operator.mjs](navier/source-localization-operator.mjs)
- [navier/localization-jet-algebra.mjs](navier/localization-jet-algebra.mjs)
- [navier/source-localization-operator-evidence.mjs](navier/source-localization-operator-evidence.mjs)
- [navier/tests/source-localization-operator.test.mjs](navier/tests/source-localization-operator.test.mjs)
- [navier/tests/build-localization-operator-evidence.py](navier/tests/build-localization-operator-evidence.py)
- [navier/tests/localization-operator-archive.test.mjs](navier/tests/localization-operator-archive.test.mjs)
- [navier/evidence/source-localization-operator-20261012/attempt1/receipt.json](navier/evidence/source-localization-operator-20261012/attempt1/receipt.json)
- [navier/evidence/source-localization-operator-20261012/attempt1/localization-operator.json](navier/evidence/source-localization-operator-20261012/attempt1/localization-operator.json)
- [navier/evidence/source-localization-operator-20261012/attempt1/independent-exact.json](navier/evidence/source-localization-operator-20261012/attempt1/independent-exact.json)
- [navier/SOURCE_LOCALIZATION_OPERATOR.md](navier/SOURCE_LOCALIZATION_OPERATOR.md)

#### N7-04 — Terminal force jets

원문: 64쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Fj(x)=lim(t↑1)∂t^j f(x,t), ∂x^ αFj(0)=0을 (10.6)-(10.10)에 맞춰 구축한다. 합격: 유한 jet order M의 수치 근사와 ∀order
smooth-extension 정리의 의존성을 분리한다. 몇 개 finite differences가 작다는 이유로 C∞ force라 표시하지 않는다.
```

**판정:** `status=PARTIAL` · `originalCriterionComplete=false`.

**검증 범위:** The actual original exterior heat amplitude produces exact terminal force and pressure jets j=0..4. The infinite radial pressure integral is retained analytically; positive h and nonzero div f survive exact polynomial arithmetic. These are exterior restrictions, not whole-space Fj or all-order flatness at the origin.

**남은 의무:**

- Construct whole-space Fj from the complete final localized residual.
- Certify all required terminal/spatial derivatives, their origin flatness and the complete source endpoint bounds.

**증거와 구현:**

- [navier/localization.mjs](navier/localization.mjs)
- [navier/evidence/N7-workbench.json](navier/evidence/N7-workbench.json)
- [navier/evidence/source-current-20261012/higher-pulse-jets.json](navier/evidence/source-current-20261012/higher-pulse-jets.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-localization-domain.mjs](navier/source-localization-domain.mjs)
- [navier/source-exterior-force-jets.mjs](navier/source-exterior-force-jets.mjs)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json)
- [navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md)

#### N7-05 — t>1 force extension

원문: 64쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(10.11)의 Σχ0(bjσ)σ^jFj/j!, σ=t−1≥0를 사용하며 (10.12)의 differentiated tail constraints로 bj를 선택한다. 합격:
force는 t≤2에서 compact support를 갖고 모든 인증된 jets가 접합된다. 이는 velocity를 t=1 이후 smooth하게 연장하는
알고리즘이 아니다.
```

**판정:** `status=PARTIAL` · `originalCriterionComplete=false`.

**검증 범위:** The finite conditional bj schedule remains separate from the new genuine exterior jet sequence. The exterior calculation does not supply global Fj derivative norms or the complete differentiated infinite extension tail.

**남은 의무:**

- Supply global terminal Fj and quantitative derivative bounds from the same complete field.
- Choose bj from those bounds and certify differentiated tails, support through t=2 and every certified jet join.

**증거와 구현:**

- [navier/localization.mjs](navier/localization.mjs)
- [navier/evidence/N7-workbench.json](navier/evidence/N7-workbench.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-localization-domain.mjs](navier/source-localization-domain.mjs)
- [navier/source-exterior-force-jets.mjs](navier/source-exterior-force-jets.mjs)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json)
- [navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md)

#### N7-06 — 전역 에너지 balance

원문: 64쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
d(∥u∥²₂/2)/dt+ν∥∇u∥²₂=⟨f,u⟩를 전체 K에서 적분한다. core만의 에너지와 구분한다. 합격: 정규화 energy defect가
독립 space/time refinement에서 감소한다. ν=1에서 (10.13)의 ∥u(t)∥² ₂+2∫∥∇u∥²₂≤(∫∥f∥₂)² 상계와 모순 없어야
한다.
```

**판정:** `status=PARTIAL` · `originalCriterionComplete=false`.

**검증 범위:** The actual compact cutoff has a verified initial zero interval, where whole-K energy, dissipation and force work vanish exactly. The nontrivial active whole-K balance has not been integrated. Neither this zero branch nor a core/periodic energy is substituted for the original global criterion.

**남은 의무:**

- Integrate energy, dissipation and forcing work on all K during active original-source times.
- Independently refine space and time and verify consistency with the nu=1 bound(10.13).

**증거와 구현:**

- [navier/galerkin.mjs](navier/galerkin.mjs)
- [navier/evidence/N8-TG.json](navier/evidence/N8-TG.json)
- [navier/flow-observations.mjs](navier/flow-observations.mjs)
- [navier/tests/flow-observations.test.mjs](navier/tests/flow-observations.test.mjs)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-localization-domain.mjs](navier/source-localization-domain.mjs)
- [navier/source-exterior-force-jets.mjs](navier/source-exterior-force-jets.mjs)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json)
- [navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md)

#### N7-07 — 실제 blowup 경로와 오차

원문: 64쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
xτ=(√(2Xinτ),0,0), η=0에서 τ^A u θ=e0+O(τ^(2h)), e0>0를 측정한다. 합격: e0의 양의 하한과 remainder의 explicit
bound가 있어야 해석적 성장 certificate로 연결한다. 유한 값 plot의 증가만으로 τ→0의 무한대를 증명하지 않는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The fixed actual original inner path Xin=Xa/2=2/Lambda is now identified with the restriction of the original final localized field by a newly executed support induction. All original wave, signed, radial, temporal, five-moment and potential-cutoff/curl operators preserve the same open zero collar; the unchanged base flat residual is kept separate and full radial moments are never assigned zero. The proof is bound to the executed original initial/domain and inner source records. It carries the measured positive e0 lower bound and the entire explicit C*tau^(2h) remainder to every sufficiently small positive tau, establishing u_theta >= (eLower/2)*tau^(-A), A>0. The actual16-test proof gate plus41 independent exact checks retained156 source files. This is an analytic source-operator restriction proof, not a finite plot or a new Lean proof. Nonzero annular correction values, an all-space evaluator, whole localized force and whole-K energy remain unconstructed.

**증거와 구현:**

- [navier/localization.mjs](navier/localization.mjs)
- [navier/evidence/N8-nearT.json](navier/evidence/N8-nearT.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-inner-growth.mjs](navier/source-inner-growth.mjs)
- [navier/source-inner-growth-evidence.mjs](navier/source-inner-growth-evidence.mjs)
- [web/navier-inner-growth-view.mjs](web/navier-inner-growth-view.mjs)
- [evidence/all64-20261012/public-v97/n7-ui-acceptance.json](evidence/all64-20261012/public-v97/n7-ui-acceptance.json)
- [navier/evidence/inner-growth-20261012/attempt2/receipt.json](navier/evidence/inner-growth-20261012/attempt2/receipt.json)
- [navier/evidence/inner-growth-20261012/attempt2/inner-growth.json](navier/evidence/inner-growth-20261012/attempt2/inner-growth.json)
- [evidence/all64-20261012/public-v97/n7-exported-execution-record.json.gz](evidence/all64-20261012/public-v97/n7-exported-execution-record.json.gz)
- [evidence/all64-20261012/ci-c971/receipt.json](evidence/all64-20261012/ci-c971/receipt.json)
- [evidence/all64-20261012/ci-c971/inner-growth-job-114802714578.log](evidence/all64-20261012/ci-c971/inner-growth-job-114802714578.log)
- [navier/evidence/source-core-restriction-20261012/attempt1/receipt.json](navier/evidence/source-core-restriction-20261012/attempt1/receipt.json)
- [navier/evidence/source-core-restriction-20261012/attempt1/core-restriction.json](navier/evidence/source-core-restriction-20261012/attempt1/core-restriction.json)
- [navier/evidence/source-core-restriction-20261012/attempt1/independent-exact.json](navier/evidence/source-core-restriction-20261012/attempt1/independent-exact.json)
- [navier/source-core-restriction.mjs](navier/source-core-restriction.mjs)
- [navier/tests/core-restriction-proof.test.mjs](navier/tests/core-restriction-proof.test.mjs)
- [navier/tests/build-core-restriction-evidence.py](navier/tests/build-core-restriction-evidence.py)

#### N7-08 — 비교 정리·주기화· ν 확인

원문: 64쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Lemma10.5의 동일 force/data 비교, (10.22)의 ν rescaling, Corollary10.6의 지지 축소 후 disjoint translate를 검토한다.
합격: C/D 결론에 필요한 energy·periodic pressure·same forcing가 모두 남는다. periodization을 arbitrary overlapping
copies의 합으로 대체하면 nonlinear cross terms 때문에 실패다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The literal comparison-review requirement is completed for the same authenticated original localization operator. Actual original cutoff coefficients and all spatial/time derivatives are pulled back at exact nu=9/4, lambda=4; the momentum, pressure-Poisson and whole space/time energy Jacobians are independently verified by full Cartesian polynomial coefficient maps. The original unit torus and a strict support gap retain all eighteen mixed advection terms before disjointness removes them; overlapping divergence-free copies give a nonzero counterexample. Lemma10.5 pressure-gradient identification in H^-3, weighted pressure-flux absorption and Gronwall, plus periodic pressure and same force/data, remain attached. Bounded whole-space energy, source smoothness and the global force extension remain explicitly required hypotheses; no C/D conclusion or whole-K energy computation is issued. The original row asks to review these constructions while preserving their hypotheses, and does not independently require the N7-06 integration. Actual5-test/33-independent-check gate retained17 source files; successful attempt2 additionally verifies JSON proof identity. Attempt1 serialization issue and historical artifacts are preserved.

**증거와 구현:**

- [navier/localization.mjs](navier/localization.mjs)
- [navier/evidence/N7-periodic.json](navier/evidence/N7-periodic.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-localization-domain.mjs](navier/source-localization-domain.mjs)
- [navier/source-exterior-force-jets.mjs](navier/source-exterior-force-jets.mjs)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/receipt.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/source-domain.json)
- [navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json](navier/evidence/source-exterior-force-jets-20261012/attempt2/independent-fraction.json)
- [navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md](navier/N7_SOURCE_SCOPE_REVIEW_2026_10_12.md)
- [navier/source-periodization-review.mjs](navier/source-periodization-review.mjs)
- [navier/source-periodization-review-evidence.mjs](navier/source-periodization-review-evidence.mjs)
- [navier/tests/source-periodization-review.test.mjs](navier/tests/source-periodization-review.test.mjs)
- [navier/tests/run-periodization-review.py](navier/tests/run-periodization-review.py)
- [navier/tests/build-periodization-review-evidence.py](navier/tests/build-periodization-review-evidence.py)
- [navier/tests/periodization-review-archive.test.mjs](navier/tests/periodization-review-archive.test.mjs)
- [navier/evidence/source-periodization-review-20261012/attempt2/receipt.json](navier/evidence/source-periodization-review-20261012/attempt2/receipt.json)
- [navier/evidence/source-periodization-review-20261012/attempt2/periodization-review.json](navier/evidence/source-periodization-review-20261012/attempt2/periodization-review.json)
- [navier/evidence/source-periodization-review-20261012/attempt2/independent-exact.json](navier/evidence/source-periodization-review-20261012/attempt2/independent-exact.json)
- [navier/evidence/source-periodization-review-20261012/history/attempt1-canonical-issue.json](navier/evidence/source-periodization-review-20261012/history/attempt1-canonical-issue.json)

### N8

#### N8-01 — Divergence-free Fourier 기저

원문: 66쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
2π 주기 영역에서 k· ûk=0, û−k=conj(ûk), Pk=I −kkᵀ/|k|²를 사용한다. k=0은 별도 mean equation이다. 합격: 제약이 초
기·각 accepted step에서 유지되고 pressure 회복에 div f가 포함된다. 이 branch의 periodic domain을 whole-space 논문
해와 혼동하지 않는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The independent 2pi-periodic Fourier Galerkin branch still validates divergence, conjugate symmetry and zero mode initially and at each accepted step, with div f in pressure recovery. The new bounded accepted-state history is independently checked to leave the final integrator coefficients bit-for-bit unchanged. This domain is explicitly separate from the paper whole-space field.

**증거와 구현:**

- [navier/galerkin.mjs](navier/galerkin.mjs)
- [navier/evidence/N8-acceptance.json](navier/evidence/N8-acceptance.json)
- [navier/evidence/N8-TG.json](navier/evidence/N8-TG.json)
- [navier/tests/flow-observations.test.mjs](navier/tests/flow-observations.test.mjs)

#### N8-02 — 비선형 convolution과 dealiasing

원문: 66쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
모든 p+q=k 상호작용을 계산한다. quadratic product는 3/2 padding 또는 그와 동등한 정확한 retained-mode convolu-
tion을 사용한다. 합격: 작은 random solenoidal fixture에서 direct convolution과 FFT product가 정규화 10^ −11 이내
일치한다. high-mode aliasing negative control이 검출된다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** All retained direct convolution interactions and the separately implemented padded FFT remain compared below1e-11. The high-mode aliasing omission is rejected, and independent NumPy output is preserved. The observation changes do not alter this numerical kernel.

**증거와 구현:**

- [navier/galerkin.mjs](navier/galerkin.mjs)
- [navier/evidence/acceptance.json](navier/evidence/acceptance.json)
- [navier/evidence/independent-numpy.json](navier/evidence/independent-numpy.json)

#### N8-03 — 시간 적응과 에너지 안정성

원문: 66쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
diffusion integrating factor/IMEX 등으로 stiff linear term을 처리하고 advection CFL·embedded local error·energy
defect로 step을 승인한다. 합격: Taylor-Green의 amplitude/energy를 시간 반분에서 설계 차수로 수렴시킨다. dt를 줄여
도 사라지지 않는 energy defect는 spatial/aliasing 오류로 조사한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The existing IMEX method retains advection CFL, embedded step doubling and energy-defect acceptance. Taylor-Green amplitude and energy show the intended second-order time refinement, independently checked with NumPy. New path integration has its own distinct error estimate and does not substitute for the solver acceptance gate.

**증거와 구현:**

- [navier/galerkin.mjs](navier/galerkin.mjs)
- [navier/evidence/N8-acceptance.json](navier/evidence/N8-acceptance.json)
- [navier/evidence/independent-numpy.json](navier/evidence/independent-numpy.json)
- [navier/flow-observations.mjs](navier/flow-observations.mjs)

#### N8-04 — τ 기반 near-terminal sampling

원문: 66쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
s=−logτ를 주 변수로 쓰고 τ>0만 평가한다. normalized coordinates와 velocity를 계산한 뒤 physical scaling을 적용한다.
합격: τ=10^−2,10^−4,10^−8,10^−12 예시와 더 작은 값의 precision mode가 재현된다. 표시 t가 1로 반올림돼도 내
부 τ>0 계약은 유지한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** The original three-component near-terminal intervals are now bound to the same final localized field on the checked original core restriction. The consumer independently revalidates the recorded inner/domain/near-terminal sources and executes the new support induction, matching source binding, Xin/Y/eta, qStar and all five unit-plateau rows. The exact identity s=-log(tau), strictly positive internal tau, three separate physical scale formulas, source depths0/2/4/8/12 and the requested decimal examples plus smaller precision examples are retained. Decimal examples in the genuine initial zero interval are explicitly distinguished from the nonzero source-depth intervals. A displayed t rounded to1 never sets internal tau to0. The original10-test/38-check near-terminal gate and new16-test/41-check source-core proof reproduce these values. This completes near-terminal sampling on the original core path; it does not complete an arbitrary-coordinate annular evaluator or the independent N8-05 adaptation/tail requirements.

**증거와 구현:**

- [navier/localization.mjs](navier/localization.mjs)
- [navier/evidence/N8-nearT.json](navier/evidence/N8-nearT.json)
- [navier/flow-observations.mjs](navier/flow-observations.mjs)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-near-terminal.mjs](navier/source-near-terminal.mjs)
- [navier/source-near-terminal-evidence.mjs](navier/source-near-terminal-evidence.mjs)
- [navier/source-core-refinement.mjs](navier/source-core-refinement.mjs)
- [navier/evidence/source-near-terminal-20261012/attempt2/receipt.json](navier/evidence/source-near-terminal-20261012/attempt2/receipt.json)
- [navier/evidence/source-core-refinement-20261012/attempt2/receipt.json](navier/evidence/source-core-refinement-20261012/attempt2/receipt.json)
- [navier/SOURCE_NEAR_TERMINAL_N8.md](navier/SOURCE_NEAR_TERMINAL_N8.md)
- [navier/evidence/source-core-restriction-20261012/attempt1/receipt.json](navier/evidence/source-core-restriction-20261012/attempt1/receipt.json)
- [navier/source-core-restriction.mjs](navier/source-core-restriction.mjs)
- [navier/tests/near-terminal-archive.test.mjs](navier/tests/near-terminal-archive.test.mjs)
- [navier/tests/build-core-restriction-evidence.py](navier/tests/build-core-restriction-evidence.py)
- [web/navier-near-terminal-view.mjs](web/navier-near-terminal-view.mjs)
- [web/tests/navier-near-terminal-view.test.mjs](web/tests/navier-near-terminal-view.test.mjs)

#### N8-05 — 공간·급수·정밀도 적응

원문: 66쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
core radius, axial length, pulse wavelength, active cutoff orders를 함께 해결한다. 각 refinement 축을 독립 증가시킨
다. 합격: 2배 grid, Fourier cutoff, coefficient order, arithmetic precision 비교표와 별도 tail bound를 저장한다. 예산
초과 시 last-resolved τ와 원인을 표시한다.
```

**판정:** `status=PARTIAL` · `originalCriterionComplete=false`.

**검증 범위:** The actual original core is freshly evaluated with independent grid[1,2,4], coefficient-order[32,48,64] and arithmetic-precision[128,192,256] axes. Common-coordinate intervals are compared with positive nonlinear/pressure errors retained; the bounded execution cache rejects over-budget unions, including a baseline omitted from requested grids.196 independent Fraction checks pass. Full annular Fourier, axial/pulse scales, active correction cutoffs and uniform source tails remain missing.

**남은 의무:**

- Add actual annular Fourier cutoff, axial length, pulse wavelength and all active correction orders as independent source refinement axes.
- Certify uniform omitted tails and a last-resolved positive tau with a precise resource or enclosure failure reason.

**증거와 구현:**

- [navier/galerkin.mjs](navier/galerkin.mjs)
- [navier/evidence/acceptance.json](navier/evidence/acceptance.json)
- [navier/evidence/independent-numpy.json](navier/evidence/independent-numpy.json)
- [navier/flow-observations.mjs](navier/flow-observations.mjs)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-near-terminal.mjs](navier/source-near-terminal.mjs)
- [navier/source-near-terminal-evidence.mjs](navier/source-near-terminal-evidence.mjs)
- [navier/source-core-refinement.mjs](navier/source-core-refinement.mjs)
- [navier/evidence/source-near-terminal-20261012/attempt2/receipt.json](navier/evidence/source-near-terminal-20261012/attempt2/receipt.json)
- [navier/evidence/source-core-refinement-20261012/attempt2/receipt.json](navier/evidence/source-core-refinement-20261012/attempt2/receipt.json)
- [navier/SOURCE_NEAR_TERMINAL_N8.md](navier/SOURCE_NEAR_TERMINAL_N8.md)

#### N8-06 — 시각화·물리량 연결

원문: 66쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
fixed physical bounds와 normalized view를 제공하고 instantaneous streamlines/particle paths, 속도/각속도, core/
global energy를 구분한다. 합격: 모든 scene은 실제 run hash·샘플 위치·단위·색 범위·vector scale를 갖는다. 자동 확대나
vector 정규화가 core 수축·성장을 숨기지 않는다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Actual finite-run observations preserve81 sample positions/vectors, fixed physical bounds, separately declared normalized periodic coordinates, fixed vector scale and common color bounds. Published v93 controls and exact selections verified instantaneous streamlines/coefficient-history particle paths, velocity/axis-dependent angular velocity (undefined on axis), and whole-box Parseval/fixed-core midpoint energy. Input/source/result and archive replay remain bound. This is the finite flow/display criterion; no original near-terminal field or complete source reconstruction is inferred. The earlier v85 liveVerification remains a historical receipt.

**증거와 구현:**

- [navier/index.mjs](navier/index.mjs)
- [navier/evidence/N8-TG.json](navier/evidence/N8-TG.json)
- [evidence/live-ui/acceptance.json](evidence/live-ui/acceptance.json)
- [web/extended-view-contract.mjs](web/extended-view-contract.mjs)
- [web/tests/extended-worker.test.mjs](web/tests/extended-worker.test.mjs)
- [navier/flow-observations.mjs](navier/flow-observations.mjs)
- [navier/tests/flow-interface.test.mjs](navier/tests/flow-interface.test.mjs)
- [navier/tests/flow-observations.test.mjs](navier/tests/flow-observations.test.mjs)
- [navier/evidence/source-current-20261012/fast-tests.log](navier/evidence/source-current-20261012/fast-tests.log)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [evidence/all64-20261012/public-v93/navier-flow-ui-audit.json](evidence/all64-20261012/public-v93/navier-flow-ui-audit.json)
- [evidence/all64-20261012/public-v93/navier-energy-ui-audit.json](evidence/all64-20261012/public-v93/navier-energy-ui-audit.json)

#### N8-07 — Claim-test-proof 연결

원문: 66쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
각 관 측 량 에 원 문 reference, numerical test, analytic certificate, Lean theorem 을 별 도 링 크 한 다. 합 격: arbitrary
sampled array를 axiom으로 놓고 PDE 해라고 결론 내리지 않는다. certified approximation 표시는 해당 구간의 error
enclosure와 조건을 요구한다.
```

**판정:** `status=PASS` · `originalCriterionComplete=true`.

**검증 범위:** Each new flow observation carries source-definition/finite-test metadata and explicit null analytic/Lean proof fields. Error indicators are not called certified enclosures. The N6 source summary separately exposes the actual recorded heavy execution, original hashes and remaining proof duties; browser replay only recreates this summary. Mutating paths, settings or claim authority is rejected.

**증거와 구현:**

- [navier/index.mjs](navier/index.mjs)
- [navier/evidence/acceptance.json](navier/evidence/acceptance.json)
- [navier/flow-observations.mjs](navier/flow-observations.mjs)
- [navier/source-current-evidence.mjs](navier/source-current-evidence.mjs)
- [navier/tests/flow-interface.test.mjs](navier/tests/flow-interface.test.mjs)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [evidence/all64-20261012/public-v93/navier-flow-ui-audit.json](evidence/all64-20261012/public-v93/navier-flow-ui-audit.json)
- [evidence/all64-20261012/public-v93/navier-source-archive-ui-audit.json](evidence/all64-20261012/public-v93/navier-source-archive-ui-audit.json)

#### N8-08 — 재현 패키지와 최종 체크

원문: 66쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
판본·commit·상수·기저·domain·time schedule·quadrature·truncations·precision·tails·residual·energy·camera·build
logs를 묶는다. 합격: 다른 환경에서 fixture와 selected run이 같은 허용오차로 재현된다. 이번 문서 작성 턴의 상태는 설계
완료이며 구현·사이트 변경·배포 완료로 표시하지 않는다.
```

**판정:** `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true`.

**검증 범위:** The original N8-08 metadata and independent-environment reproduction requirement is satisfied for the actually exported finite periodic selected flow and the two authenticated original-source core fixtures. All105713 numerical values match within their original declared tolerances; current source execution, the actual shipped Worker and each fresh replay agree. Actual hosted Node24.21/Python3.12.15/NumPy2.3.5, commit/tree, complete523-file source manifest, constants, modes, domain, every accepted/rejected step, quadrature, truncations, precision, tails, residual/energy scope, camera and logs are packaged. The selected finite flow retains its actual periodic and subregion energies and discrete residual; it does not substitute them for original whole-K energy or a full original-source residual. Final full-field construction and all-scale adaptation remain separate original criteria. Each subsequent shipped build must run the fresh reproduction CI gate.

**증거와 구현:**

- [navier/tests/build-source-inheritance.py](navier/tests/build-source-inheritance.py)
- [navier/tests/run.mjs](navier/tests/run.mjs)
- [navier/tests/independent_numpy.py](navier/tests/independent_numpy.py)
- [navier/source-inheritance.json](navier/source-inheritance.json)
- [navier/implementation-pin.mjs](navier/implementation-pin.mjs)
- [navier/evidence/acceptance.json](navier/evidence/acceptance.json)
- [evidence/live-ui/acceptance.json](evidence/live-ui/acceptance.json)
- [web/extended-view-contract.mjs](web/extended-view-contract.mjs)
- [web/tests/extended-worker.test.mjs](web/tests/extended-worker.test.mjs)
- [web/build_extended.py](web/build_extended.py)
- [web/tests/test_extended_build.py](web/tests/test_extended_build.py)
- [CI_EXECUTION_WORKSPACES.md](CI_EXECUTION_WORKSPACES.md)
- [navier/tests/build-source-current-evidence.py](navier/tests/build-source-current-evidence.py)
- [navier/tests/flow-interface.test.mjs](navier/tests/flow-interface.test.mjs)
- [navier/evidence/independent-numpy.json](navier/evidence/independent-numpy.json)
- [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json)
- [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md)
- [navier/source-near-terminal.mjs](navier/source-near-terminal.mjs)
- [navier/source-near-terminal-evidence.mjs](navier/source-near-terminal-evidence.mjs)
- [navier/source-core-refinement.mjs](navier/source-core-refinement.mjs)
- [navier/evidence/source-near-terminal-20261012/attempt2/receipt.json](navier/evidence/source-near-terminal-20261012/attempt2/receipt.json)
- [navier/evidence/source-core-refinement-20261012/attempt2/receipt.json](navier/evidence/source-core-refinement-20261012/attempt2/receipt.json)
- [navier/SOURCE_NEAR_TERMINAL_N8.md](navier/SOURCE_NEAR_TERMINAL_N8.md)
- [navier/N8_REPRODUCTION_PROTOCOL.md](navier/N8_REPRODUCTION_PROTOCOL.md)
- [navier/N8_LITERAL_ACCEPTANCE_REVIEW_2026_10_12.md](navier/N8_LITERAL_ACCEPTANCE_REVIEW_2026_10_12.md)
- [navier/evidence/n8-reproduction-20261012/manifest.json](navier/evidence/n8-reproduction-20261012/manifest.json)
- [navier/evidence/n8-reproduction-20261012/ci-a210590/github-observation.json](navier/evidence/n8-reproduction-20261012/ci-a210590/github-observation.json)
- [navier/evidence/n8-reproduction-20261012/ci-a210590/observed-ci.zip](navier/evidence/n8-reproduction-20261012/ci-a210590/observed-ci.zip)
- [navier/tests/build-n8-reproduction-evidence.py](navier/tests/build-n8-reproduction-evidence.py)
- [navier/tests/n8-reproduction-contract.test.mjs](navier/tests/n8-reproduction-contract.test.mjs)
- [navier/tools/reproduce-selected-runs.py](navier/tools/reproduce-selected-runs.py)
- [navier/tools/reproduce-selected-runs.mjs](navier/tools/reproduce-selected-runs.mjs)
- [navier/tools/n8-reproduction-contract.mjs](navier/tools/n8-reproduction-contract.mjs)
- [navier/tools/verify-selected-reference.py](navier/tools/verify-selected-reference.py)
- [evidence/all64-20261012/public-v99/flow-export.json](evidence/all64-20261012/public-v99/flow-export.json)
- [evidence/all64-20261012/public-v99/core-import-replay-state.json](evidence/all64-20261012/public-v99/core-import-replay-state.json)
- [evidence/all64-20261012/public-v99/near-terminal-replay.json](evidence/all64-20261012/public-v99/near-terminal-replay.json)

## 4. 현재 진행표 바이트와 검토 재현

| 진행표 | 바이트 | SHA-256 |
|---|---:|---|
| [P7_PROGRESS.json](P7_PROGRESS.json) | 57828 | `c06cb182f7dac442ff7bfcc678745f167e6d3714ddf39d75b31a71aac498a59b` |
| [P8_PROGRESS.json](P8_PROGRESS.json) | 19352 | `42248ed057895fb9f37142ffbdc6c3e0a3d1b3d00025c707751ff49a858b4ca1` |
| [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json) | 51288 | `b7386584873c9c9635efd2ee255ba7d42c28b83aa3bb1e547e4ea76d428b34ca` |
| [N6_PROGRESS.json](N6_PROGRESS.json) | 33830 | `bf50e58b376d5919e7e5e1a7509e005fc2938ce277ea843d2696dda9ee31ea63` |
| [N7_PROGRESS.json](N7_PROGRESS.json) | 38315 | `e15f0fa59481dbd5e06bc00c9d58d836e976095057931b2ca6ee6c6baff675db` |
| [N8_PROGRESS.json](N8_PROGRESS.json) | 28062 | `4d229d3844e2c2529a900c5dc754251db1901a246f5d669c61fac9c72c01ede4` |

```bash
python -B research-ide/mathscope-m3/evidence/all64-20261012/assessment-source-resume/build_review.py --check
```

이 명령은 원문 64개, 이전 기록, 승인 목록, 현재 진행표, 고정 receipt와 소스/아카이브의 바이트를 검증한다. 새 수학 생성자나 새 Lean 실행을 수행하지 않는다. 실제 생성자·CI 명령과 메모리 분리는 [CI 실행 가이드](CI_EXECUTION_WORKSPACES.md)에 있다.
