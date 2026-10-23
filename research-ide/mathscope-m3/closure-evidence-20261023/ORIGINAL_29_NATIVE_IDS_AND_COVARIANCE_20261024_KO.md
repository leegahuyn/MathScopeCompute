# 2026-10-24 · 실제 원본 11루트 native 함수 ID / covariance 수치화 인수인계

## 검증 원천

- 최초 원본 첫 FiveMap 소스 그래프 #39977528137, artifact #12515234307, `4,420,257` 노드와 `9,749,737` 직접 AST 간선.
- 노드 그래프 SHA-256 `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`. 원본 PR #30 `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60` 변경 없음.
- 최초 아카이브는 **기본** 함수 정의만 있으므로, 확장 registry 본문까지의 **의미론적 도달 개수**를 최초 아카이브로 확정해서는 안 된다.
- 11개 물리장/잔차 루트에서 직접 도달하는 AST union은 2036 노드, **등록된 native 시스템 ID는 고유 29개** (native call AST occurrence 287). 실제 정의의 전 미분과 원본 함수 내부까지 포함한 수치 연산량은 미계산.

## 원본 직접 참조 고유 source system 구성

| op | 고유 system IDs |
|---|---:|
| `m3_aux_expression_partial` | 4 |
| `m3_coupled_expression_partial` | 10 |
| `m3_coupled_indexed_partial` | 8 |
| `m3_aux_inverse_partial` | 1 |
| `m3_coupled_inverse_partial` | 1 |
| `actual_expression_partial` | 4 |
| `actual_monotone_root` | 1 |
| **합계** | **29** |

- 원본 ID 단위 top repeated: `coupled-expression:1297` 40, auxiliary expression `-13` 40, `coupled-field:9,10,11,16,17,18` 각 15, Fourier inverse `coupled-inverse:0` 13, auxiliary inverse `0` 13.
- 출처에 따른 고유 native source ID 검사기를 `audit_original_root_native_closure.mjs`에 구현하고 [#39997159634](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39997159634) CI 성공.
- 실제 전체 원본 그래프의 11루트 기준 직접 함수 호출을 설명할 뿐, 원본 함수 본문을 모두 재귀적으로 추적한 29개라는 뜻은 아니다.

## 이번의 실제 새 기능

1. `export_original_source_graph.mjs`에서 기본 AST `G.covarianceSystems`를 JSON+SHA256 sidecar로 보존하는 **새 코드** 구현. 이 sidecar가 없으면 `actual_covariance_volterra`의 본문 의미론적 처리가 완료되었다고 판정하지 않음.
2. 원본 `m3_global_pulse_jet`가 `covariance` 시스템 ID를 갖는 경우 역시 원래 2x2 covariance system의 행렬, normUpper, 구간 길이를 참조하도록 의미론적 추적기 확장. 등록부가 없다면 명확한 OPEN blocker.
3. `m3_global_indexed_partial`의 각 지역 row에 실수식 chart label `Q,ell,grid`가 들어 있다면 source node root로 포함하되 signs·차수·메타데이터를 잘못 node로 읽지 않음.
4. `conditional_covariance_volterra_tail.py`: 원본 비동차 forced 3x3과 구분되는, **동차 2x2 초기값 Volterra**의 엄밀한 Picard tail `Y (AL)^(N+1) exp(AL)/(N+1)!`. 조건 `A>=sup||M||,Y>=||y0||, L>=length`이 실제 원본으로 입증되어야 인증 가능. 10-case [CI #39996805642](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39996805642) **PASS**.
5. Source native semantic CI [#39996545142](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39996545142) **PASS**.

## 중요한 보류 항목

- 수정 이전 원본 HEAD `f8cb4034e86d7b669d52a6f2248aebba156b51b5`로 진행 중인 #39988632325는 **확장 coupled/aux/forced 함수 정의 보존**을 목표로 하지만, 이 추가 runtime covariance sidecar 커밋은 포함하지 않는다. 아카이브를 받고 SHA와 내부 정의 목록을 대조하되 Volterra 누락을 마치 완료된 것처럼 취급하지 말 것.
- 해당 CI의 `status`, `conclusion`, artifacts를 먼저 조회. 종료 성공 시 실제 원본 확장 registry에 `audit_original_native_semantic_closure.mjs` 및 `postprocess_original_full_graph.mjs`를 실행해 **11루트별 의미론적 ODE/Volterra/Fourier 도달 수**와 미해결 원본 시스템 ID를 확정.
- `source_parameter` 일부에 대한 제한적 양성 상계와 유한 Fourier/ODE/Volterra 조건부 보조정리는 **최종 전체 반복 물리장의 함수값 또는 67제트 인증서가 아님**.
- N6-07 공통 전역 정의역, N6-08 cutoff 무한합, 종단 외력 정칙성·전체 PDE 증명, 192 whole-K cell, A–D 끝점 반복장 전부 OPEN.

**RELEASE HOLD · M3=62/64 · M4=0/16 · 실제 최종 67제트=0/67.**
