# Report v2 compatibility assessment for the actual terminal auditor

The frozen v2 preparation correctly rejects the new terminal audit as unsupported. It must remain unchanged. A separate v3 can integrate the actual schema without changing any acceptance criterion or manufacturing a result.

| Contract point | Frozen v2 | Actual corrected-run auditor / required v3 |
| --- | --- | --- |
| Independent audit schema | `MathScope.OriginalProtectedComparatorPortableAudit/1` | Add a separate `MathScope.OriginalProtectedComparatorTerminalAudit/1` branch; retain the old branch's rules. |
| Historical audit inputs | v2 requires manifest `mathscopeCommit == gate.headCommit` | The original eight-file TRUST manifest intentionally retains historical commit `8c4271aa5a35b1d34c30279fb306a099944e4823`. Preserve its exact manifest SHA and eight file hashes. It is not the new runtime-source manifest. |
| Actual runtime binding | No separate field | Require `gateExecution.actualRunBinding` with exact file/SHA. Bind its `mathscopeCommit`, `runId`, `jobId` to the actual gate, and its SHA to the audit's `actualRunBindingSHA256`. Hash all eight runtime files, their Git blob identities and actual matching artifact bytes. |
| Accepted final outcome | Old schema has a narrowly proven postcheck-only exception | The terminal schema requires actual GitHub job `completed/success`, controller `PASS` / exit 0, protected Comparator exit 0 and `postcheckOnlyFailure=false`. The old exception cannot cross into this branch. |
| Current candidate | v2 has null future IDs | v3 may fill the observed run/job/head and actual binding now. Actual final status, conclusion, artifact, final audit and new assessment remain absent until observed. Finalization remains refused. |

Read-only source review confirmed these actual frozen identities:

- Terminal auditor SHA-256: `81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef`.
- Historical TRUST manifest SHA-256: `48341732c4eac4a991ed5b65b786beedc9f1d7098a97698ce99c89dead22a273`.
- Actual runtime binding SHA-256: `5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab`.
- Actual run/job/head: `38014602021` / `114101981614` / `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`.

The terminal auditor also checks all 35 recorded stages in exact order and the unit argument's position. This note reads its source interface; it does not run the auditor and does not claim a successful execution artifact. The runtime-binding file itself records `in_progress`, null conclusion and `N106CompletedAtBinding=false`.

The actual submitted theorem axioms, unchanged original source/kernel/configuration/guard evidence, exact artifact member hashes, complete run/job/auditor bindings and a new unchanged-criteria assessment remain necessary before any new 70/0 report. Neither the successful diagnostic nor implementation/publication PASS is accepted as that result. `.3` remains a separately frozen publication record; an actual `.4` may be supplied later only through new observed publication/download/CI receipts.

한국어 판정: **v2의 거부는 정상이며, 새 v3에서 과거 원문 입력과 실제 새 실행 입력을 분리 연결해야 한다.** 실제 후속 audit가 완료되기 전에는 70/0이나 최종 PDF를 만들 수 없다. 이 문서는 v2·원래 기준·기존 판정·PDF를 변경하지 않았다.
