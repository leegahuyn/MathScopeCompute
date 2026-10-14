# N6-01 / N6-02 원본 계산 실행 결과

2026-10-14. 별도 브랜치 `mathscope-m3-n6-source-audit-20261014`, [Draft PR #26](https://github.com/leegahuyn/MathScopeCompute/pull/26). 원본 M3 **56/64 유지**, N6-01 **OPEN**, N6-02 **PARTIAL**이다.

최종 [N6 run #38489754794](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38489754794)은 **7개 묶음 / 64개 유한 테스트 모두 통과**했다. 이것은 감사 구현과 명시적 중단 기록의 실행 성공이다. 최신 전체 mean 자체는 **UNRESOLVED_AFTER_CONDITIONAL_FTC_SELECTION**이며 원본 수학 인수를 완료하지 않는다. 테스트한 코드 커밋은 [`b242a9895116ab8d4f00626faf798bdfa6b8f25c`](https://github.com/leegahuyn/MathScopeCompute/commit/b242a9895116ab8d4f00626faf798bdfa6b8f25c)이다.

## 실제 실행과 실패 보존

| 실행 | 실제 결과 | 보존 파일 |
| --- | --- | --- |
| 기존 [38480202315](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38480202315) | 8묶음 중 7통과. N7-04는 1536 MiB 힙 OOM / SIGABRT | [원본 ZIP](prior-run-38480202315.zip), [관찰 JSON](PRIOR_RUN_OBSERVATION.json) |
| 전체 재실행 [38488267028](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38488267028) | 기존 8묶음 모두 통과, 56개 유한 테스트 통과. 전체 13묶음에서는 97/99 통과, 새 mean 파일의 fixture 및 한도 후 diagnostics 2실패 | [원본 ZIP](full-run-38488267028.zip) |
| 수정 전 집중 실행 [38489311816](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38489311816) | 7묶음 중 6통과, 61/62 테스트 통과. 한도 후 diagnostics 실패가 남음 | [원본 ZIP](n6-run-38489311816.zip) |
| 최종 집중 실행 [38489754794](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38489754794) | 7묶음 모두 통과, 64/64 유한 테스트. 실제 mean의 RESOURCE_LIMIT와 원본 root를 artifact로 보존 | [원본 ZIP](final-n6-run-38489754794.zip) |
| 저장용 패키지 [38489944959](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38489944959) | 생성 후 `--check` 통과, 785개 source bindings. 원본 criteria/progress 해시 전후 동일. 게시 없음 | [원본 ZIP](package-run-38489944959.zip) |

N7-04 재실행은 **476.217초**, Node 힙 4096 MiB로 유한 테스트 5개를 통과했다. 범위는 exterior-only이며 전 공간의 최종 force jets나 원본 N7-04 완료를 인증하지 않는다. pending run `38488427865`는 새 집중 프로필 실행으로 GitHub concurrency queue에서 교체돼 실행되지 않았다.

첫 실패는 숨기지 않았다. `maximum`이 없는 root에서는 기존 적분 변수를 유지하도록 좁힌 importer에 맞춰 fixture를 수정했다. 작업 한도 초과 후 diagnostics가 다시 source-binding work를 소비하던 문제는 read-only diagnostics 및 원본 stop 보존으로 고쳤다. **원본 RESOURCE_LIMIT를 없앤 것이 아니다.**

## 원본 노드에서 실제로 얻은 결과

| 원본 | 계산 결과 | 미입증 조건 / 남은 범위 |
| --- | --- | --- |
| `539400 = max(1,539399)` | 155개 원본 의존성 해시 및 3,892,594-node 전체 스트림 검증. 24 FTC 얼굴 중 3개 anchor가 각각 `sqrt(1+f²)>=1`. 조건 아래 B≥3, strict gap≥2 | 실제 face의 실수성, 적분 존재, 구간 순서, 전체 capture closure와 요청된 C^m neighborhood. 전역 smoothness 완료 아님 |
| `4483 = actual_natural_series('average',474,2,0,0)` | 원본 B.14/B.15 재귀를 보존하는 독립 연쇄미분과 정확한 양의 tail 구현. 유한 부분합을 무한 함수로 대체하지 않음 | B_rho fixed-point 존재, coefficient norm, rho/complex domain 및 항별 미분 tail 조건 |
| `5029 = actual_quadratic_root(0,4,2)` | 새 natural rule과 실제 5차원 연속 시스템을 연결해 **CONDITIONAL_QUADRATIC_DERIVATIVE_CONSTRUCTED**, stop=null | Lemma A.2 smallness, 실제 Jacobian nonsingularity, branch와 uniform source classes는 미입증 |
| monotone 0/1/2 | signed variance surrogate, circle inverse lift, 공통 slow inverse의 실제 body/bracket/derivative bounds 보존. system2 image+h 조건 아래 `1/2<F_s<=1` 해석 추정 | system0 Q positivity/endpoint/envelope, system1 positive density/periodicity/upstream0, system2 실제 argument image와 `0<h<1/16` binding. 세 시스템의 전체 해석 조건 완료 아님 |

## 최신 전체 mean의 정확한 중단

최종 artifact `evidence-06/conditional-whole-mean/whole-mean-conditional-20261014002434628.json`의 결과:

```text
stage: temporal
status: UNRESOLVED_AFTER_CONDITIONAL_FTC_SELECTION
code: RESOURCE_LIMIT
reason: Independent whole-mean replay exhausted its work budget.
declared maxWork: 400000
last attempted original root: 633815
node: multiply(633763, 633814)
node SHA-256: 156a40d895fd0d021930d81142fc7070852e10a00469fca54cfd3d00aba2524b
lastImportStatus: import-started
exactInnerFailingNodeKnown: false
```

`633815`는 실제 마지막으로 가져오려던 root다. 예산을 소진한 내부 subnode는 확인되지 않았으므로 임의로 특정하지 않았다. 이는 수학적 반례가 아니다. 완전한 temporal/moment mean 비교, full nonzero-angular Cartesian PDE 및 수치 오차 enclosure는 생성되지 않았다. 오래된 flat tail, 최신 pressure/cutoff와 비선형 remainder를 0으로 바꾸거나 제거하지 않았다.

현재 rational verifier는 alpha-equivalent 적분을 서로 다른 atomic node로 취급할 수 있다. 따라서 예산 관문을 넘더라도 표현상의 nonmatch와 PDE 반례를 구별해야 한다. 이 한계 역시 artifact에 남겼다.

## N6 원본 인수에 남은 것

1. Prop 9.5의 원본 순서: primary full curls → 최신 full covariance/pressure → (8.20) temporal update → pressure/full means/defects 재계산 → 새 defects에 (8.25) five equations → pressure/full means/defects 재계산.
2. B0=0.7, C0*=1.2와 (9.8)–(9.10)의 실제 uniform W/M/S classes, 양 보존 모멘트, 같은 도메인의 constants와 미분 손실. 몇 개 slopes나 형식 미분으로 완료하지 않는다.
3. 위 implicit / natural / FTC 조건의 실제 source-domain 증거와 정의 body closure.
4. `633815`에서 멈춘 실제 mean의 bounded-work 재구성, integral alpha-equivalence, 최신 전체 압력, 모든 mixed/square/cutoff/flat/Fourier tail 및 독립 3D PDE/error-budget 비교.

[상세 PDF–소스 조건 대조](../../cloud/N6_ANALYTICAL_CONDITIONS_KO.md), [재현 방법](../../cloud/N6_SOURCE_AUDIT_README_KO.md), [기계 판독 가능한 모든 실행·SHA 기록](CLOUD_EXECUTION_OBSERVATION.json), [입력 PDF manifest](../../../reference-documents/n6-audit-20261014/MANIFEST.json).

모든 ZIP은 GitHub가 제공한 원본 archive이며 공식 digest와 일치한다. 소스·입력 PDF·성공/실패 artifact를 이 브랜치에 저장했다. implementation/file manifests와 저장용 bundle metadata만 새 소스에 맞춰 갱신했다. 공개 사이트 배포, main 변경, 원본 56/64 승격은 수행하지 않았다.
