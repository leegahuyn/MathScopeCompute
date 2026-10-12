# 최종 head 529의 CI 상태·단계 기록

대상은 PR #15/main의 head `529e864c8b2ed19399bab8bbc53a08721873d5d4`다. 이 폴더는 담당 5개 workflow의 실제 GitHub run/jobs 응답을 읽기 전용으로 보존한다. 같은 head의 P7 성공은 별도 담당 자료에 연결한다. 기존 source·진행표·빌드·manifest·git/ref를 변경하거나 테스트를 새로 실행하지 않았다.

| Workflow | 실제 run | 최종 상태 | Jobs / 단계 |
|---|---|---|---:|
| M3 gauge and fluid execution workspaces | [38237430621](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38237430621) | completed / success | 1 / 26 |
| MathScope research IDE checks | [38237430743](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38237430743) | completed / success | 1 / 16 |
| MathScopeCompute CI | [38237430565](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38237430565) | completed / success | 1 / 8 |
| M3 P8 finite certificate verification | [38237430653](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38237430653) | completed / success | 2 / 25 |
| M3 Y7 real finite spectral verification | [38237430668](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38237430668) | completed / success | 1 / 11 |

위 5개 workflow의 6개 job과 86개 보고된 단계는 모두 completed/success다. 각 run과 job의 GitHub `head_sha`를 대상 head와 대조했다. `head-workflow-status.json`에는 P7을 포함한 최신 6개 workflow 모두의 terminal success 조회도 보존한다. run/jobs JSON에는 실제 단계 이름·결론·시각이 있고, `retrievals.json`에는 도구·GET URL·조회 시각, `receipt.json`에는 저장 파일 SHA-256과 범위가 있다.

run 원문의 `pull_requests` 배열은 이 수집 시점에 비어 있었다. 따라서 이를 복원·추정하지 않고 별도로 조회한 `pull-15.json`의 head와 base를 대조한다. 해당 응답은 같은 head, `main` 대상 및 실제 merge commit `3eb8427c6031dddded7d6d1b6527221cdb292017`을 기록한다.

## P7 새 성공과 이전 실패의 분리

새 [P7 run 38237430568](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38237430568)은 completed/success다. 담당자가 보존한 [실제 process receipt](../../../p8/evidence/p7-ci-arithmetic-attempt2-38237430568/process.json)는 독립 pytest exit 0과 실제 checkout `eb2bc3a4a14d05a88248e85167286bb4f46a6ef5`를 기록한다. artifact 11741622609의 6,814 bytes ZIP SHA-256은 `067e231cfaefde97e165121f87bffafa7d7bf963eb01ee8ece859d885961a596`다. 이 수집은 해당 raw artifact/process/report/log/관찰 파일의 실제 bytes를 해시하여 연결한다. 최종 P8 consumer 포장 receipt는 초기 조회 당시 작성 중이었다. 이후 담당자가 동결한 [포장 receipt](../../../p8/evidence/p7-ci-arithmetic-attempt2-38237430568/receipt.json)의 SHA-256 `e812c0d18b3f292ffc82823cd968eddcdb51050da09205677ffe4f6285713893`도 읽기 전용으로 해시 대조하여 별도 연결한다. 그 receipt의 추가 local 포장 검사 횟수를 CI 통과 횟수에 합치지 않으며, 이 수집에서 consumer를 다시 실행했다고 하지 않는다.

이전 head 759의 [CI 기록](../ci-759/receipt.json)과 [P7 실패 receipt](../../../p8/evidence/p7-ci-arithmetic-attempt1-38235952230/receipt.json)는 그대로 유지한다. 이전 실패의 독립 pytest exit 1을 이번 성공으로 덮어쓰지 않는다.

## 증거의 적용 범위

이 자료는 CI 단계의 실제 통과 기록이다. GitHub `head_sha`와 실제 checkout한 PR merge commit은 다르다. 담당 5개 job의 compiler 로그나 Lean audit artifact를 이 수집에서 내려받아 독립 검산하지 않았으며, 그 checkout commit도 직접 확인했다고 하지 않는다. 원문 64개 기준의 완료 여부, 아직 구성하지 않은 N6/N7 장과 무한 tail·전역 해석 증명을 자동으로 결론내리지 않는다. 후속 head는 별도 새 관찰이 필요하며 기존 snapshot은 덮어쓰지 않는다.
