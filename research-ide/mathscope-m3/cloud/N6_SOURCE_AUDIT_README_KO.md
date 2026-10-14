# N6-01 / N6-02 원본 소스 감사와 클라우드 실행

이 작업의 코드는 `mathscope-m3-n6-source-audit-20261014`에 저장한다. 기준 커밋은 PR #25의 `bdaf007e2de1cb8bf310ef0efb1b799e6c977711`이다. 이 커밋은 `mathscope-m3-m4-20261014`의 `11c4803d1f59b6ad480261ddda23450b70f0faea`에서 클라우드 실행 파일 세 개만 추가한 상태다.

원래 Navier-Stokes 생산자, 과거 실패 기록과 original 인수 장부를 변경하지 않는다. 새 해석 가정, 급수 항별 미분, 분기 선택과 임계값 조건은 독립적으로 기록한다. 테스트 실행 성공과 N6 원본 인수 완료는 서로 다른 결과다.

## 먼저 확인한 이전 실행

- [run #38480202315](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38480202315)는 **failure**였다. 8개 묶음 중 7개가 유한 테스트에 통과했다.
- N7-04는 `1536 MiB` Node 힙 한도에서 `SIGABRT`로 중단됐다. 마지막 기록은 622781 nodes이며 로그에 `Allocation failed - JavaScript heap out of memory`가 있다.
- N6-02의 11개 테스트는 감사 절차 실행을 검사했다. 실제 whole mean 감사는 `maximum@539400`에서 멈췄고 `UNRESOLVED`다. 논문의 full Cartesian PDE 잔차 인증은 생성되지 않았다.
- [이전 원본 ZIP](../evidence/n6-source-audit-20261014/prior-run-38480202315.zip)은 GitHub artifact ID `11856923712`에서 받은 그대로 보존한다. SHA-256은 `6ac5553867251d75d270bdc235dd4490efb3850c0be12586b794a922991dd4bc`다. [관찰 기록](../evidence/n6-source-audit-20261014/PRIOR_RUN_OBSERVATION.json)에 각 테스트의 범위와 결과가 있다.

## 이번 구현과 검증 범위

- [해석적 조건 감사](N6_ANALYTICAL_CONDITIONS_KO.md): PDF의 Proposition 9.5, Appendix A.2, signed variance root, circle lift, 공통 역좌표와 updated mean / residual을 실제 소스와 대조한다.
- `source-saved-radius-monotone-audit.mjs`: 원본 `maximum` 반지름 노드와 monotone systems 0/1/2의 실제 정의, 조건과 미입증 의무를 보존한다.
- `source-saved-quadratic-series-audit.mjs`: 실제 natural-series 호출과 quadratic implicit derivative를 독립 감사하며, 급수 수렴·항별 미분과 implicit-domain 조건을 유지한다.
- `source-saved-whole-mean-conditional-audit.mjs`: 감사한 strict-radius branch를 가정으로 남겨 정확한 source operand에 적용하고, 새 급수 규칙과 함께 최신 temporal/moments의 전체 평균 재구성을 시도한다. 다음 실제 미해결 연산과 노드를 기록한다. 기존 무조건 감사 결과는 그대로 유지한다.
- `n6_source_audit.py`: `full`은 이전 8개 테스트와 기존 monotone/quadratic 감사 및 새 세 테스트, 총 13개 묶음을 **순차** 실행한다. 기본 `n6`는 이전 N6-01/N6-02 두 묶음 및 5개 추가 source audit, 총 7개 묶음에 집중한다. 테스트별 600초, 전체 실행 2400초와 Node 힙 4096 MiB를 적용하고, timeout/OOM을 원본 인수 실패와 구별해 기록한다. 이 힙 설정은 전체 RSS 제한이 아니다. 첫 full 실행을 별도 보존하고 수정 뒤 같은 N7/N8 검사를 반복하지 않는다.
- 새 workflow는 코드 SHA, 실제 소스 SHA-256, TAP, stderr, 개별 receipt와 partial/final JSON을 저장한다. 원본 장부가 전후 동일한지 확인하며 어느 테스트도 원본 criterion을 승격하지 않는다. Actions artifact는 90일 보관하며 실제로 확인한 결과 ZIP은 이 브랜치에도 보존한다.

## 입력 자료와 재현

[입력 manifest](../../reference-documents/n6-audit-20261014/MANIFEST.json)에 사용자가 지정한 두 첨부파일의 SHA-256을 저장했다. 첨부 `navier-stokes(5).pdf`는 기존 [논문 PDF](../../reference-documents/ns-primary-20261013/navier-stokes.pdf)와 바이트가 동일해 재사용한다. 최신 [설계도 PDF](../../reference-documents/n6-audit-20261014/blueprint.pdf)는 추가 저장했다.

GitHub의 `M3 N6 original source audit` workflow에서 해당 브랜치를 선택해 실행하거나, 저장소를 받은 환경에서 Node 24 / Python 3.12로 아래 명령을 실행한다. 출력 폴더는 저장소 **밖**의 절대 경로여야 한다.

```text
python -B research-ide/mathscope-m3/cloud/n6_source_audit.py --profile n6 --output <absolute-output-directory> --wall-seconds 600 --node-heap-mib 4096
```

실제 전체 원본 graph와 155개 소스는 기존 저장소의 immutable snapshot에서 검증한다. 작은 fixture 또는 독립 형식 미분의 통과는 `B0=0.7`, `C0*=1.2`, uniform C^m bounds, signed branch smoothness, 최신 full pressure, nonzero-angular physical PDE와 명시적 수치 오차 예산을 대신하지 않는다.

## 상태

original M3 56/64, N6-01 OPEN / N6-02 PARTIAL을 유지한다. 최종 [N6 실행 38489754794](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38489754794)에서 7묶음/64개 유한 테스트가 모두 통과했다. 실제 temporal mean은 root 633815를 가져오다가 maxWork=400000에 도달해 미해결이며 내부 실패 subnode는 특정되지 않았다. [상세 결과와 원본 ZIP](../evidence/n6-source-audit-20261014/RESULTS_KO.md), [모든 실행·SHA 기록](../evidence/n6-source-audit-20261014/CLOUD_EXECUTION_OBSERVATION.json)을 보존한다. 기존 8묶음 재실행도 8/8 통과했으며 이는 원본 수학 완료가 아니다. 공개 사이트를 게시하거나 `main`을 갱신하는 단계는 이 작업에 없다.
