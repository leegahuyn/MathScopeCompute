# MathScope 원본 4,420,257노드 native 함수 정의 의존성 검증 — 2026-10-24 인수인계

## 실제로 완료한 사항

- **기준 원본 아카이브**: Actions #39977528137, artifact #12515234307, 4,420,257 SourceExpressions, 33연산, 원본 PR30 commit `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60`. 노드 SHA-256 `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`.
- 이 최초 아카이브는 **raw base registry만** 보존했으며 coupled/aux/forced 원본 함수 본문이 누락됐음. 유효한 SHA-256이 전체 의미론적 증명을 의미하지 않음.
- **확장 원본 함수 내보내기**를 PR30을 수정하지 않고 감사 브랜치에서 수정 후 Actions #39988632325로 실행. `definitionGraph=forced.G`를 통해 원래 확장 함수의 5종 registry + auxiliary + global base 보존. 아직 아티팩트가 생성되지 않았다면 status를 성공으로 표시하면 안 됨.
- `original_native_semantic_definitions.mjs`: 원본 coupled expression/field/inverse, auxiliary expression/field/inverse, forced expression/pulse, global expression/indexed/pulse/Picard의 시스템 ID→저장된 body·coefficient·guard·ODE matrix/forcing 실제 DAG 루트 연결. 이름만 같은 임의 함수로 대체하지 않음.
- `audit_original_native_semantic_closure.mjs`: 실제 DAG child와 native function body 참조를 *고정점 worklist*로 합산하여 물리장 11루트별 노드와 operation 종류를 집계. 반복 호출은 원본 system ID별 본문 캐시 사용. 원본 native function 정의가 누락되면 unresolved로 드러나며, `actual_covariance_volterra`를 평가했다고 주장하지 않음.
- 결합장 indexed `row.localSystem`이 지칭하는 source body와 `row.localBody`가 동일한지 교차검증. 변조된 본문은 즉시 거부. 타입/미분차수 정수 메타데이터를 AST id로 취급하지 않음.
- 구조적 본문 연결 unit tests: [#39990704306](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39990704306), [#39991329121](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39991329121), [#39991837649](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39991837649), [#39991837743](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39991837743) 모두 PASS.
- `conditional_forced_ode_picard_tail.py`: 사용자 제공 Navier–Stokes 원본 forced zero-data 3×3 시스템에 대한 finite partial Picard 잔차 상계. 테스트 10개 PASS [#39992228957](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39992228957). `A,B,L`의 원본 수치상계가 없으면 원본 인증서 생성 금지.

## 엄밀한 수학적 범위

**구조적 native 정의 참조 ≠ 미분식 실제 전개 ≠ 수치 함수 평가 ≠ 전역 PDE 증명.** 다음이 여전히 분리됨.

1. 원본 `m3_coupled_* / m3_aux_*`의 모든 고차 미분 materialization, 실제 파라미터 치환, branch guards, local gluing.
2. 原 본문 `actual_covariance_volterra` 원천 covariance system, 실제 ODE 행렬/forcing, 꼬리상계의 조건 `A,B,L`.
3. 원본 Fourier (N^{-1}) 각 소스 계수값 및 (m+4) 도함수 상계, 공통 정의역, 모든 단계 (j)에 균일한 추정.
4. Cutoff-before-curl 무한급수, 전역 외력 (f)의 compact support 및 (C^\infty) 정칙성, 정확한 전체 3D PDE 소거.
5. N6/N7 원본 반복 전체의 최종 `A_0,A_1,A_2,b,p`, 192개 원래 whole-K cell, 최종 제트 67개. **0/67 유지**.

## 바로 이어서 실행할 명령

1. [원본 확장 capture Actions #39988632325](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39988632325) 완료 여부, artifact, 실패시 첫 stack trace 확인.
2. 완료·성공 시 [후처리 Workflow](https://github.com/leegahuyn/MathScopeCompute/actions/workflows/mathscope-original-graph-postprocess-without-rerun-20261024.yml) `workflow_dispatch`에서 `original_run_id=39988632325`, 감사 브랜치 선택. workflow는 head sha `f8cb4034e86d7b669d52a6f2248aebba156b51b5`를 검증함.
3. 원본 artifact SHA/함수 정의 5종 registry count 확인 후 `semantic_body_reachable_unique_nodes`, `unresolved_native_semantic_blockers`, 각 11루트의 ODE·Volterra·Fourier 도달 수를 **실제 생성된 결과만** 기록.
4. 첫 unresolved **원본 native system**의 실제 definition body + derivative order + source-specific interval proof를 구현. 일반 보조정리만으로 모두 인증 표시 금지.

## 고정 상태
- M3 **62/64**, M4 **0/16**, 최종 실제 67제트 **0/67**.
- `last_resolved_tau=null`, `RELEASE=HOLD`.
- 原 PR30 head `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60`와 운영 v0.3.1.html 변경 없음.
