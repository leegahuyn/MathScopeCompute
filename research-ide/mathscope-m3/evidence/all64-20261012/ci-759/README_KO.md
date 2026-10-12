# 최종 head 759의 CI 상태·단계 기록

대상은 PR #15의 head `759d1a0b35a6e1952663ee6486e8de534d7fcb66`이다. 이 폴더는 실제 GitHub run/jobs 응답을 읽기 전용으로 보존한다. 기존 source·진행표·빌드·manifest·git/ref를 변경하거나 테스트를 새로 실행하지 않았다.

| Workflow | 실제 run | 최종 상태 | Jobs / 단계 |
|---|---|---|---:|
| M3 gauge and fluid execution workspaces | [38235952354](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38235952354) | completed / success | 1 / 26 |
| MathScope research IDE checks | [38235952396](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38235952396) | completed / success | 1 / 16 |
| MathScopeCompute CI | [38235952276](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38235952276) | completed / success | 1 / 8 |
| M3 P8 finite certificate verification | [38235952467](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38235952467) | completed / success | 2 / 25 |
| M3 Y7 real finite spectral verification | [38235952534](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38235952534) | completed / success | 1 / 11 |

위 5개 workflow의 6개 job과 86개 보고된 단계는 모두 completed/success다. 각 run과 job의 GitHub `head_sha`를 대상 head와 대조했다. run/jobs JSON은 실제 단계 이름·결론·시각을 포함한다. `retrievals.json`에는 도구·GET URL·조회 시각, `receipt.json`에는 저장된 파일의 SHA-256과 범위를 기록한다.

## P7 실패는 별도 기록으로 유지

[P7 run 38235952230](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38235952230)은 실패했다. 담당 agent가 보존한 [실패 receipt](../../../p8/evidence/p7-ci-arithmetic-attempt1-38235952230/receipt.json)에 연결하며, 이 폴더의 성공 목록에 포함하지 않는다. 해당 receipt SHA-256은 `5561031dba56253669a55475a8e51ed747b029c06d7a10552b02bb5d4d505ddd`다. 임시 테스트 ROOT의 필수 PARI recipe 누락으로 독립 pytest exit 1이 발생했고, 내부 audit의 PASS만으로 실패한 CI를 수용하지 않았다. 연결 receipt 및 artifact/process/report/log의 실제 bytes와 hash를 이 수집에서 대조한다.

## 증거의 적용 범위

이는 CI 단계의 실제 통과 기록이다. GitHub의 `head_sha`와 runner가 실제 checkout한 PR merge commit은 별개이므로, 로그를 가져오지 않은 이 5개 job의 checkout commit은 새로 확인했다고 하지 않는다. 이 폴더는 compiler 로그나 Lean audit artifact를 내려받아 독립 검산한 자료가 아니다. 원문 64개 합격조건의 완료 여부, 아직 구성하지 않은 N6/N7 장, 무한 tail·전역 해석 증명, 새 source head의 CI 통과를 자동으로 결론내리지 않는다. 후속 head는 별도 새 관찰을 요구하며 이 snapshot은 덮어쓰지 않는다.
