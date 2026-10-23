# MathScope M3 원본 확장 native 의미론적 의존성 — 2026-10-24 KST

## 증거 기반 현재 상태

- 원본 PR #30 HEAD: `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60`; 변경/병합 없음.
- 성공한 최초 전체 그래프 원본 CI [#39977528137](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39977528137), artifact #12515234307, 4,420,257 nodes. Node SHA256 `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`.
- 최초 아카이브는 raw base native registry만 포함하여 원본 11루트의 결합장/보조장/forced 정의 본문 전체의 의미론적 계산에 불충분.
- 확장된 함수 정의를 담으려는 재계산 [#39988632325](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39988632325) (source HEAD `f8cb4034e86d7b669d52a6f2248aebba156b51b5`)은 마지막 확인 시 **in_progress**, `Run full original Signed Temporal FiveMap full3D and independent direct-split roots`. 현재 artifact 없음. 성공 여부를 추정하지 말 것.
- 현재 메인 원장의 M3 62/64, M4 0/16, original final 67=0/67, RELEASE HOLD 유지.

## 이번 턴의 새 기능

1. `original_native_semantic_definitions.mjs`: actual SourceCoupledExpressions/SourceAuxiliaryExpressions/ForcedPulseExpressions source registries를 해독하여 coupled expression, indexed, Fourier inverse, auxiliary expression/field/inverse, global expression/field/pulse, forced zero-data 3x3 ODE의 **실제 정의 body, localBody, coefficients, guards, matrix 및 forcing** 노드 참조를 확인한다. 인덱스와 미분차수를 node ID와 혼동하지 않는다.
2. `audit_original_native_semantic_closure.mjs`: 11 물리장 루트의 직접 그래프 간선뿐 아니라 함수 ID에 대응하는 본문 루트를 worklist로 추적하고 중복 호출을 같은 원본 정의 ID로 묶는다. 원본 장의 시간/공간 도함수 값까지 계산하거나 ODE/Fourier 무한합을 증명하는 도구는 아니다.
3. 원본의 `quadraticCount, monotoneCount, picardCount`를 원래 별도 raw source registry와 대조하고, implicit quadratic, monotone implicit root, even-profile Picard의 원본 `rhs, linear, quadraticDiagonal, scale, body, left/right, derivative bounds, A0/A1, forcing` 참조를 구조적으로 복원한다. 근 수렴 및 정칙성은 미증명 상태로 유지한다.
4. `actual_covariance_volterra`의 실제 2x2 `covarianceSystems`는 coupled facade nested registry에 포함되지 않음. `export_original_source_graph.mjs`가 **원본 G.covarianceSystems**를 분리된 `original-source-covariance-systems.json`로 저장하고 SHA-256과 개수를 증명 매니페스트에 남기도록 수정. `audit_original_source_graph_replay.mjs`는 2x2 행렬, normUpper, length 원본 참조를 감사한다. 해당 보존본이 실제로 존재할 때만 `nativeSemanticDefinitionEdges`가 `actual_covariance_volterra`를 해석하며, 누락 시 OPEN blocker. **현재 진행 중인 #39988632325는 위 수정 이전의 고정 HEAD로 실행되므로 새 covariance sidecar가 자동 생성되지 않는다.**
5. 원본 registered coupled-field `row.localSystem`과 `row.localBody`가 동일한 원본 정의를 가리키는지 교차검증. 소스 변조 및 빠진 관계는 검사 실패.
6. 원본 zero-data forced 3x3 선형계의 조건부 Picard tail 은 유리수 계산기로 따로 검증. 단, 실제 원본 행렬 M, 강제항 g, 도함수 전체의 구간값·상계는 아직 OPEN.

## CI

- 기존 함수 정의/타입·body 교차검증: #39990704306, #39991329121, #39991837649, #39991837743 — PASS.
- 조건부 ODE Picard tail 10검사 #39992228957 — PASS.
- covariance 원본 2x2 sidecar SHA/변조 검사: #39993811474 — PASS.
- quadratic/monotone/even Picard + covariance semantic native 테스트: #39994300081 — PASS, #39994300281 — PASS.

## 다음 실제 작업

1. #39988632325 completed/success 및 artifacts 여부 확인. 실패 시 job 단계/stacktrace를 먼저 확인.
2. 성공 시 artifact `authenticated-first-fivemap-full-source-dag-replay-not-final-67`를 내려받고 node-stream 및 extended-registries SHA256, 등록된 function-body counts 검증.
3. `postprocess_original_full_graph.mjs`를 완성된 아카이브에 실행하여 11개 physical roots별 semantic native body reachable nodes, ODE/Volterra/Fourier calls 및 first unresolved `system` 확정. 이때 covariance runtime sidecar가 없는 경우 그 결과는 OPEN으로 남긴다.
4. 처음 발견되는 미해결 원본 시스템의 실제 계수 함수/모드·분기·오차 상계를 소스와 연결하되, 일반 보조정리만으로 수치 67개나 N6/N7 전체를 완료로 올려서는 안 된다.

이 문서는 코드 시험 성공과 실제 4.4M-node 원본 실행 성공을 혼동하지 않는 감사 인수인계 문서다.
