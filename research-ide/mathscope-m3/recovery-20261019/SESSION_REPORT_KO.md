# MathScope 현재 ChatGPT 복구·구현·검증 보고서

**이 문서는 현재 남아 있는 GitHub 파일, 복원 ZIP, 실제 실행·게시·브라우저 영수증을 다시 읽어 작성한 새 재구성본입니다.** 소실된 이전 보고서 원문과 동일하다고 주장하지 않습니다. 파일명이나 과거 문서의 Gemini 표기는 현재 작업 주체의 지정으로 사용하지 않았습니다. 작성 주체는 현재 ChatGPT입니다.

최초 재구성 시각: `2026-10-18T23:22:13.742748+00:00`. 게시·후속 QA 갱신 시각: `2026-10-18T23:29:26.455632+00:00`. 원격 저장 기준은 PR30의 `cf98ec1e832d88317f0c07072b5053a88866c904`이며, 이후 caller·A.13·로그 반경·운영 UI 변경의 두 번째 저장은 아래 PENDING 절에서 별도로 관리합니다.

## 1. 현재 결과와 완료 범위


| 대상 | 현재 결과 | 판정 범위 |
| --- | --- | --- |
| M3 원64개 | 62개 기존 범위 승계 / N7-06·N8-05 OPEN | 새로 닫은 원 인수 항목0개 |
| actual global last-resolved τ | `null` | 실제 전역장 평가의 마지막 해결 시각이 확인되지 않음 |
| M4 원16개 | 14 PARTIAL / 2 OPEN; 전16개 원 인수 UNCONFIRMED | 전체 RELEASE HOLD 유지 |
| 첫 저장 | `cf98ec1e832d88317f0c07072b5053a88866c904` | cutoff/native/M4 계약 및 원장·인수 기록 저장 |
| 첫 저장 CI | 5개 workflow·12개 check 모두 success | cf98와 실제 checkout/tree 결속; 수학적 완료 수 불변 |
| 후속 scalar 단위 | caller, 원 A.13 binding, Qb→wait→로그 반경 구현·검증 | 보존 ZIP에서 복구, 두 번째 원격 commit은 PENDING |
| 기존 운영 URL | v118 / `9a0eebc5` 게시, followup2 fragment 수정 및 실제 제한 검수 확인 | 기존39개 바깥 script·원 data 보존; desktop launcher·과거 상태 안내 수정 확인 |
| website followup2 | layout v2 / `460012fd`, runtime v2 / `fa62da96`; HTTP200·예정 공개 바이트 일치 | 제한된 게시 후 desktop/keyboard/source 검수 수행; 실제 mobile/touch·성능/메모리 인수 미확인 |


코드 실행 성공, 유한 비교, 조건부 상계, 원 수학적 전역 의무 완료, GitHub 저장, CI, 게시와 화면 검수는 각각 별개입니다. 62개 승계는 기존 기록의 정확한 적용 범위를 유지한다는 뜻이며, 이번 보고서 작성에서 그 연구 전체를 새로 증명·재실행했다는 뜻이 아닙니다. 근거: [M3 원64개 원장](M3_CURRENT_ORIGINAL_LEDGER.json), [M4 원16개 matrix](../../mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json).

## 2. 자료 인수와 실행 환경 소실 후 복구

### 2.1 최초15개 인수 ZIP의 보존 기록

다음 목록은 첫 저장 cf98에 보존된 실제 인수 영수증에서 읽었습니다. 현재 재개에서 원15개를 다시 내려받거나 전체 생산 계산을 반복한 결과가 아닙니다. 각 원 ZIP은20,000,000바이트 미만이며 파일명·크기·SHA와 원 member 수가 [SOURCE_ARCHIVES_SHA256.json](intake/SOURCE_ARCHIVES_SHA256.json)에 있습니다.


| 원 파일명 | 바이트 | member 수 | SHA-256 |
| --- | --- | --- | --- |
| MathScope_Gemini_Handoff_Part_01(2).zip | 8756563 | 23 | `89501c4056040c4003f138cb0ea1bced9a8f391d70f07cfef286069bd78d9dee` |
| MathScope_Gemini_Handoff_Part_02(2).zip | 11699101 | 1 | `3690d670957f3ebbe923e1aae9f4c8a112ac18956262dafc89141f9b769f7cd0` |
| MathScope_Gemini_Handoff_Part_03(2).zip | 11916492 | 1 | `dced7e6099e508b166c5addb6a9d1f00ab2928c138e37d3ad0e8ae0933a0f81a` |
| MathScope_Gemini_Handoff_Part_04(2).zip | 11709227 | 1 | `aa387353f941c1ea55c3973d178b69957a706b030953227ba5f96f3cc5b6e793` |
| MathScope_Gemini_Handoff_Part_05(2).zip | 11761448 | 1 | `a65e5597ae3dc202b404d95e6b846009e74853f2968e96a335d321599a43cc7f` |
| MathScope_Gemini_Handoff_Part_06(2).zip | 12003939 | 1 | `a280d7a210a22aaded34d0833467fc73d06a7e699c915a797c404366c1c90bfb` |
| MathScope_Gemini_Handoff_Part_07(2).zip | 16352924 | 203 | `fa3f137f18b3b7f43fb22cae6c85036eeb1680663edaab68dc0901de57854044` |
| MathScope_Gemini_Handoff_Part_08(2).zip | 14681073 | 769 | `e954d8473edeca132fee0b5e306bf4bf11f83acdc9847fded8829487973e716b` |
| MathScope_Gemini_Handoff_Part_09(2).zip | 11498279 | 1 | `701e0f8fc1f0c790c2ac6d70493fb911aa433ee69fccc4100d701d228cdbbe99` |
| MathScope_Gemini_Handoff_Part_10(2).zip | 11683196 | 1 | `db02bded4fdefffc35c574b1256ded4b7ea10aa411f0864def1b51178beb4ed9` |
| MathScope_Gemini_Handoff_Part_11(2).zip | 16304442 | 427 | `9f83e39f7d8b9851511abbb8a4841f77311154489c74a3720d8c3b203f10693f` |
| MathScope_Gemini_Handoff_Part_12(2).zip | 16618524 | 451 | `1574b736a2ee4f0e64378f285e74345556fa2129e459df7c33435cf8f4be7e7f` |
| MathScope_Gemini_Handoff_Part_13(2).zip | 18557770 | 908 | `a66eb41a2932c2b8141a98fc3c8b426e63166b69003e8e7ab7046c662034e489` |
| MathScope_Gemini_Handoff_Part_14(2).zip | 18890751 | 805 | `57c6a13f9e10f83fc65d861fcd76b8230a0775343faf914ab9398029b34a09cb` |
| MathScope_Gemini_Handoff_Part_15(2).zip | 8734776 | 152 | `24e973cf1a0b75c619441632874166b2ce78e66ca4664e4a40c4fc85a894b4ac` |


보존된 최초 인수 감사는 Part01의 안내·인덱스·복원 스크립트 검사 후 별도 복원 경로에서 경로 이탈·충돌·CRC·파일 해시를 확인한 범위를 기록합니다. baseline 인덱스1,230개, continuation156개, CI checkpoint65개 및 전체 part member3,745개가 해당 인덱스와 일치했습니다. FILE_INVENTORY의18,314개 논리 경로는 검증 payload로 표현되어 있으며, 오래된 모든 archive container의 바이트를 새로 복구했다는 뜻은 아닙니다. 최초 감사는 historical container bytes retained=0을 그대로 기록합니다. 근거: [최초 최종 인수 감사](intake/FINAL_ATTACHMENT_INTAKE_AUDIT.json), [원 archive 복원 결과](intake/EXACT_ARCHIVE_RESTORE_RESULTS.json).

최초 감사에는 `00_READ_FIRST_KO.txt`, `FILE_INVENTORY.json`, `ARCHIVE_PROVENANCE.json`, 원 설계도·논문, 최신 상태 원장 및 `MathScope_Latest_Shared_Status_20261018.json`, `MathScope_Late_Code_Recovery_Limits.txt` 등의 존재·해시가 남아 있습니다. 저장 이후의 stage1–4·pressure/cutoff·slow inverse 진행 설명은 실제 코드·출력·해시가 없던 부분까지 완료 근거로 승격하지 않았습니다. 새로 구현한 단위는5절에서 별도로 표시합니다.

### 2.2 현재 재개의7개 ZIP 복구

이어서 작업할 때 이전 transient 실행 경로가 실제로 비어 있음을 확인했습니다. 보존된7개 checkpoint를 다시 가져와 SHA·CRC·안전한 경로·유일한 이름·symlink 부재 및 manifest를 검사했습니다. 실제 복구 결과는 `work_20261019/environment_recovery/CHECKPOINT_RESTORE.json`입니다. 이 보고서 작성에서도 현재7개 ZIP의 바이트와 SHA를 이 영수증에 독립 대조해 모두 일치했습니다.


| 복구 ZIP | 바이트 | 복원 파일 | manifest 검증 항목 | SHA-256 |
| --- | --- | --- | --- | --- |
| MathScope_Checkpoint_01_Intake_20261019.zip | 1288356 | 37 | 36 | `7bb0adec4ec1e3a980c4b8efdfc13c44711d9704fa77c69fc5ed94d55953463d` |
| MathScope_Checkpoint_02_Implementation_20261019.zip | 9236008 | 202 | 201 | `82dfa2fd9edc689e497d04d596e0584b2d2054e76515520ec8f057e5ecd74e14` |
| MathScope_Checkpoint_03_Publication_20261019.zip | 785705 | 58 | 57 | `a0df77d2d929fd450b92c5455ce1b219e14952a18a17e23ae6c19b044aab7608` |
| MathScope_Checkpoint_03B_Fragment_Publication_20261019.zip | 1184802 | 101 | 100 | `afb795a66d4fc833f458771a3ffbfb1d7e8d2a43fb3d2f8adfa2a24d8941e6c0` |
| MathScope_Actual_Band_Caller_Checkpoint.zip | 94571 | 34 | 33 | `9349bb3825c413f46569801611915a6e95a4137b112a014a37b11628921de7cf` |
| MathScope_Recovered_A13_Binding_Checkpoint_v2.zip | 125570 | 51 | 50 | `b790aa457be4f7ae444c96ad80bd003e75d8418b0b332a22b71daeb17d8c46e9` |
| MathScope_Original_LogRadius_Connection_Checkpoint.zip | 110854 | 40 | 39 | `d71733c0cb596ba2137b285381e35a7b828d8b60bbcad6fc7841290ead7102d0` |


총523개 복원 파일은 manifest 내용516개와 manifest 자체7개로 구성됩니다. 그중 저장소 파일222개를 먼저 복원했습니다. 이 숫자는 원 M3 인수 개수나 과거 N8 source manifest의 수를 뜻하지 않습니다. 동일한 비싼700/3,407 기록 생산 계산은 반복하지 않았습니다. 이후 GitHub의 실제 cf98 checkout으로 전체17,677개 추적파일을 재구성하고, 이미 복구한 추가 파일을 보존했습니다.

격리 stage의 실제 HEAD/tree와 바로 이전333d commit/tree를 읽었습니다. 일반 clone의 proxy 연결 실패128, 승인된 공개 HTTPS clone 성공0, cf98 정확 SHA depth2 fetch 성공0을 구분했습니다. 생성 중 남은 부분 임시파일2개는 원래 경로·바이트·SHA를 기록하여 별도 폴더에 이동 보존했고, 대응하는 완전한 추적파일의 바이트가 HEAD Git blob과 일치함을 확인했습니다. stage 준비 시점에는 git status가 clean이었습니다. 근거: `work_20261019/environment_recovery/remote/STAGE_READY_RECEIPT.json`, `CLONE_CANONICAL_FILES_VERIFIED.json`, `LOCAL_RECURSIVE_HEAD_TREE.json`.

현재 재개에서 Python·셸·Node.js·Git·파일 읽기/쓰기·압축 자료 읽기 및 GitHub connector를 실제 사용했습니다. 앞선 실행 영수증에는 Python3.12, SymPy1.14.0, mpmath1.3.0과 Node의 실제 버전이 들어 있습니다. 브라우저 공유 공간에 남아 있던 v118 QA·Worker 결과·화면·source 방문·옛 counter 위치의 원본5개도 소실 전 SHA와5/5 일치하게 회수했습니다. 이것은 새로 작성한 브라우저 로그가 아닙니다. 근거: [브라우저 원본 파일 복구](../../mathscope-m4/recovery-ui-20261019/evidence/BROWSER_ORIGINAL_FILES_RECOVERED.json).

이 보고서의 문장은 새 재구성입니다. 반면 위 checkpoint 코드·검사 산출물 및 회수된 브라우저 파일은 해시가 일치한 실제 원본 바이트입니다. 복구되지 않은 이전 보고서 초안, 미회수 followup1 실행 로그, 확인되지 않은 앞선 게시 응답은 확인됨으로 바꾸지 않았습니다. followup2의 별도 성공 응답과 게시 후 관찰은7절에 기록합니다.

복구 이후 새로 만든 `MathScope_Checkpoint_03C_Interface_Fix_20261019.zip`은8,851,985바이트·164 members이며 SHA-256은 `906aec12be58ab8013e7884d28735b030abdd261df82f4dc563aed93baa88f50`입니다. 현재 파일의 SHA와 ZIP CRC를 다시 확인했습니다. 이 파일은 위7개 복구 ZIP/523개 복원 파일 집계와 별개의 후속 게시 전 체크포인트입니다.

공유 대화 URL은 실제 Exa fetch1회에서 `isError=true`, structured `INVALID_ARGUMENT`, 메시지 `CRAWL_EMPTY_CONTENT`를 반환했습니다. 회수한 원 대화 본문0자·코드0개·독립 실행 영수증0개이며 계속 **원문 미회수**입니다. 이 응답은 대화 삭제·로그인 필요·이전 GitHub 쓰기 실패의 증거가 아닙니다. 근거는 `work_20261019/shared_chat_read/SHARED_CHAT_READ_RECEIPT.json` 및 같은 폴더의 원 응답·4파일 manifest입니다.

## 3. 실제 GitHub 저장과 CI


| 단계 | SHA / 상태 | 의미 |
| --- | --- | --- |
| 이전 수학 작업 저장본 | `a78e0f97d37d07f65a977bf675b03043ce2a8e64` | 기존 수학 코드와 scoped 검증·인수 기록 |
| manifest 수정 기준 | `333d6095d4a2d2d69ceec9b25c44e1d3381e36d2` | 릴리스 파일 목록 수정; 수학적 완료 commit으로 해석하지 않음 |
| 첫 새 구현 저장 | `cf98ec1e832d88317f0c07072b5053a88866c904` | cutoff/native/M4 독립 준비와 기존 원장·인수 기록 |
| 첫 새 tree | `55a83b4d5eed485cf69124d8d67aca64b9a9a797` | 실제 commit tree와 branch ref readback 일치 |
| 바로 이전 tree | `341d08d0560cb14d7cec923a20814d362ca6e1dc` | 333d의 실제 Git tree |
| PR30 | open / draft / merged=false | head branch=mathscope-m3-n6-cloud-20261014 |
| 두 번째 저장 | PENDING | caller/A.13/logradius/UI 및 이 재구성 보고서의 후속 저장을 따로 결속 |


새 재개의 GitHub ref·PR head·최신 commit 응답은 모두cf98였습니다. 실제 parent333d와 tree를 성공 응답 및 로컬 Git 객체로 확인했습니다. 큰 recursive tree GET의 `Transport closed` 실패는 별도 보존했고, 작은 root tree GET과 로컬 전체 tree 추출은 성공했습니다. 불명확한 쓰기 요청은 재전송하지 않았습니다. blob SHA, tree 생성, commit 생성과 ref 갱신은 다른 단계이며 이번 재조회에는 원격 쓰기가 없습니다. 근거: `work_20261019/environment_recovery/remote/REMOTE_READBACK_SUMMARY.json` 및 같은 폴더의 원 응답들.

첫 저장 CI의 실제 최종 결과는 checkpoint03의 `first_saved_commit/FINAL_CI_SUMMARY.json`에 보존되어 있고, 이번 GitHub readback도 같은5개 workflow·12개 check의 completed/success를 확인했습니다.


| workflow | run ID / 링크 | event | 결과 |
| --- | --- | --- | --- |
| MathScopeCompute CI | [39159593540](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39159593540) | pull_request | completed / success |
| M3 P7 continuation verification | [39159593307](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39159593307) | pull_request | completed / success |
| MathScope research IDE checks | [39159593431](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39159593431) | pull_request | completed / success |
| M3 gauge and fluid execution workspaces | [39159593297](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39159593297) | pull_request | completed / success |
| MathScope current recovery scoped checks | [39159585966](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39159585966) | push | completed / success |


새 scoped push workflow는 cf98 자체를 checkout했습니다. 기존 PR workflow들은 GitHub 임시 PR merge commit `168c136ef02c248c082984901b26aa24904f8725`를 사용했고, 부모는 `c143b5d8093b724d2509f8fc0ab5746c531d9e0c`와cf98입니다. 그 tree가cf98의55a83…와 정확히 같습니다. 이는 main 병합이 아닙니다. checkout 로그와 tree 비교는 checkpoint03의 `first_saved_commit/CI_CHECKOUT_COMMIT_BINDING.json`에 있습니다. 첫 CI를 다시 실행하지 않았으며, 이 성공을 아직 저장되지 않은 caller·A.13·logradius·UI의 두 번째 commit CI로 사용하지 않습니다.

## 4. M3 원64개 항목별 결과

원 설계도 SHA-256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`입니다. 표의 쪽수와 ID·제목은 [원64행](M3_CURRENT_ORIGINAL_LEDGER.json)의 원문 추출을 따릅니다. `승계`는 `INHERITED_COMPLETE_WITHIN_RECORDED_SCOPE`이며 새로운 전역 증명을 뜻하지 않습니다. 기록된 초기1,260/1,260과 Guard/Jet/PDE0 [0,0]도 초기 구성 범위에 한정합니다.


| 원 ID | 원 제목 | 원문 위치 | 결과 | 승계·미해결 범위 | 실제 근거 |
| --- | --- | --- | --- | --- | --- |
| P7-01 | 전역 정규화와 모든 국소 인자를 완성한다 | 34쪽 | 승계 | 지원 유리 모델, 고정 CAS Tate/minimal 계산과 내보낸 산술의 독립 검사를 승계. rank DB·숨은 Manin 상수 없음. | [기준 원장](../P7_PROGRESS.json) · [개별 근거](../p7/evidence/arithmetic-20261012/unit-tests.json) |
| P7-02 | 해석적 연장 backend와 Euler-product 영역을 분리한다 | 34쪽 | 승계 | 해석적 연장과 complex ball의 반올림·유한 절단·무한 tail을 승계. finite Euler 탐색 범위는 별도. | [기준 원장](../P7_PROGRESS.json) · [개별 근거](../p7/evidence/pari-runtime-20261012/receipt.json) |
| P7-03 | 영점 고립·개수·중복도를 인증한다 | 34쪽 | 승계 | 원 두 유한 높이의 영점 고립·개수 및 알고리즘 독립성. 공통 FLINT 산술 사용은 공개. | [기준 원장](../P7_PROGRESS.json) · [개별 근거](../p7/evidence/arithmetic-20261012/unit-tests.json) |
| P7-04 | 명시적 공식의 유한 잘림 오차를 계산한다 | 34쪽 | 승계 | 원 half-integer 유한 인수 예제와 엄밀하지만 거친 smoothed band 범위. | [기준 원장](../P7_PROGRESS.json) · [개별 근거](../evidence/resume-20261012/attempt2/explicit-psi.json.gz) |
| P7-05 | global operator 후보를 반증 가능한 입력으로 만든다 | 34쪽 | 승계 | 수정 가능한 연구 후보 등록·유한 반증 비교. 유한 행렬 성공으로 전역 존재를 발급하지 않음. | [기준 원장](../P7_PROGRESS.json) · [개별 근거](../p7/evidence/arithmetic-20261012/unit-tests.json) |
| P7-06 | analytic rank를 증명 범위별로 계산한다 | 34쪽 | 승계 | 원 root number −1 예제와 엄밀 중심 도함수. 정확 소거와 유한 수치 범위를 구분. | [기준 원장](../P7_PROGRESS.json) · [개별 근거](../p7/evidence/arithmetic-20261012/unit-tests.json) |
| P7-07 | arithmetic rank와 leading BSD data를 독립 인증한다 | 34쪽 | 승계 | 지원 산술·높이 정리·고정 CAS descent 및 원 finite witness/GP 출력 범위. | [기준 원장](../P7_PROGRESS.json) · [개별 근거](../p7/evidence/arithmetic-20261012/unit-tests.json) |
| P7-08 | RH·BSD 연구 결과를 제한된 범위로 내보낸다 | 34쪽 | 승계 | 유한/연구 결과 형식, 가정·범위 내보내기. 자연어의 수학적 Lean 형식화는 주장하지 않음. | [기준 원장](../P7_PROGRESS.json) · [개별 근거](../p7/evidence/arithmetic-20261012/unit-tests.json) |
| P8-01 | 객체 정체성과 증거 등급을 직교화한다 | 36쪽 | 승계 | 객체 kind·정확성·증명 방식의 분리와 위조 수치 등급·직렬화 인증 거절. | [기준 원장](../P8_PROGRESS.json) · [개별 근거](../p8/evidence/p8-local-acceptance-20261012.json) |
| P8-02 | 3D 구조의 좌표 계약을 고정한다 | 36쪽 | 승계 | 기록된 v87 네 M2 구조 화면의 원 데이터·점 선택·Canvas2D 대체 표시. 표시 투영은 증명 권한 없음. | [기준 원장](../P8_PROGRESS.json) · [개별 근거](../p8/evidence/p8-renderer-local-20261012.json) |
| P8-03 | 비교 diagram의 조건을 클릭해서 검사한다 | 36쪽 | 승계 | 실제 M2 비교 route의 순서·가정·변조 diagram 거절. | [기준 원장](../P8_PROGRESS.json) · [개별 근거](../p8/evidence/p8-local-acceptance-20261012.json) |
| P8-04 | Lean은 작은 인증 정리부터 쌓는다 | 36쪽 | 승계 | 일곱 후보 범주와 유한 F5의 기록된12 compile target·8 semantic controls. chain-equivalence 미래 후보 유지. | [기준 원장](../P8_PROGRESS.json) · [개별 근거](../p8/evidence/lean-release.json) |
| P8-05 | 조건부 corollary의 의존성을 숨기지 않는다 | 36쪽 | 승계 | 공식 Lean CI의 정확 assumedTarget 의존성과 삭제 실패. CONDITIONAL_ON_TARGET이며 브라우저 새 Lean 실행 아님. | [기준 원장](../P8_PROGRESS.json) · [개별 근거](../p8/evidence/conditional-lean-release.json) |
| P8-06 | 반증용 mutation과 재현 bundle을 만든다 | 36쪽 | 승계 | 유효 인증서 삭제·zero-box 변조의 source-bound child 실행과 공개 badge 철회. 과거 실패·포장 상태 보존. | [기준 원장](../P8_PROGRESS.json) · [개별 근거](../p8/evidence/p7-mutation-release.json) |
| P8-07 | 새 연구를 위한 구체적인 탐색 도구를 제공한다 | 36쪽 | 승계 | 유리 유한 compression의 다항식·rank·trace·duality 및 정해진 반례 축소 범위. | [기준 원장](../P8_PROGRESS.json) · [개별 근거](../p8/evidence/p8-local-acceptance-20261012.json) |
| P8-08 | 마일스톤 review packet으로 승인 기준을 고정한다 | 36쪽 | 승계 | 지원 입력·원 기준·열린 증명·연구 질문을 유지한 다섯 review packet. 연구 추측 해결과 구분. | [기준 원장](../P8_PROGRESS.json) · [개별 근거](../p8/evidence/p8-local-acceptance-20261012.json) |
| Y5-01 | Δ 모드와 변경 효과 선언 | 46쪽 | 승계 | 원 Δ 모드와 변경 효과 선언 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/field-family.mjs) |
| Y5-02 | 실제로 변하는 유효 4D 장족 | 46쪽 | 승계 | 원 실제로 변하는 유효 4D 장족 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/field-family.mjs) |
| Y5-03 | 명시적인 유효 스펙트럼 연결 | 46쪽 | 승계 | 원 명시적인 유효 스펙트럼 연결 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/spectral.mjs) |
| Y5-04 | 단위 변환과 실제 dilation 구별 | 46쪽 | 승계 | 원 단위 변환과 실제 dilation 구별 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/field-family.mjs) |
| Y5-05 | Δ 타깃에 대한 양자 격자 앙상블족 | 46쪽 | 승계 | 원 Δ 타깃에 대한 양자 격자 앙상블족 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz) |
| Y5-06 | 상관함수와 유효질량 추정 | 46쪽 | 승계 | 원 상관함수와 유효질량 추정 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz) |
| Y5-07 | 전달 연산자·GEVP·인증 경계 | 46쪽 | 승계 | 원 전달 연산자·GEVP·인증 경계 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/lean-audit.json) |
| Y5-08 | 한계 순서와 불확실성 비교 | 46쪽 | 승계 | 원 한계 순서와 불확실성 비교 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz) |
| Y6-01 | 원본·표현·근거를 연결 | 48쪽 | 승계 | 원 원본·표현·근거를 연결 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/live-ui-v85-v89-gauge.json) |
| Y6-02 | x ₄=c 절단 | 48쪽 | 승계 | 원 x ₄=c 절단 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/live-ui-v85-v89-gauge.json) |
| Y6-03 | x ₄ 방향 적분·평균 구별 | 48쪽 | 승계 | 원 x ₄ 방향 적분·평균 구별 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/lattice-chain-marginal-mean.json) |
| Y6-04 | 안전한 게이지 불변 기본 화면 | 48쪽 | 승계 | 원 안전한 게이지 불변 기본 화면 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/live-ui-v85-v89-gauge.json) |
| Y6-05 | Flow와 투영된 loop의 의미 보존 | 48쪽 | 승계 | 원 Flow와 투영된 loop의 의미 보존 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/wilson-flow-su2.json) |
| Y6-06 | Δ별 상태 비교 | 48쪽 | 승계 | 원 Δ별 상태 비교 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/live-ui-v85-v89-gauge.json) |
| Y6-07 | 그림에서 Lean 명제로 연결 | 48쪽 | 승계 | 원 그림에서 Lean 명제로 연결 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/lean-audit.json) |
| Y6-08 | 세션 재현·접근성·stale 확인 | 48쪽 | 승계 | 원 세션 재현·접근성·stale 확인 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/live-ui-v85-v89-gauge.json) |
| Y7-01 | 기존 검증 범위를 고정 | 50쪽 | 승계 | 원 기존 검증 범위를 고정 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/lean-audit.json) |
| Y7-02 | 유한 대수 인증서를 Lean에 연결 | 50쪽 | 승계 | 원 유한 대수 인증서를 Lean에 연결 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/lean-audit.json) |
| Y7-03 | 유한 spectral certificate | 50쪽 | 승계 | 원 유한 spectral certificate 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/lean-audit.json) |
| Y7-04 | 사용자 존재·간극 axiom의 출처 저장 | 50쪽 | 승계 | 원 사용자 존재·간극 axiom의 출처 저장 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/proof.mjs) |
| Y7-05 | 투영 뒤 corollary의 정확한 계약 | 50쪽 | 승계 | 원 투영 뒤 corollary의 정확한 계약 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/lean-audit.json) |
| Y7-06 | OS/transfer 재구성 의무 분리 | 50쪽 | 승계 | 원 OS/transfer 재구성 의무 분리 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/contracts.mjs) |
| Y7-07 | 새 continuum YM 구성의 연구 목표 | 50쪽 | 승계 | 원 새 continuum YM 구성의 연구 목표 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/contracts.mjs) |
| Y7-08 | 최종 회귀검사와 증거 bundle | 50쪽 | 승계 | 원 최종 회귀검사와 증거 bundle 기능·유한 대수/수치/조건부 증거 기준을 해당 GAUGE_PROGRESS 범위에서 승계. continuum quantum 구성은 OPEN_CONTINUUM. | [기준 원장](../GAUGE_PROGRESS.json) · [개별 근거](../gauge/evidence/lean-audit.json) |
| N6-01 | 초기 finite state 구성 | 62쪽 | 승계 | 같은 j=0 초기 상태의 curl·temporal·다섯 moment·pressure 및 정규화 class. B0=0.7, C0*=1.2 유지. | [기준 원장](../evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json) · [개별 근거](../evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base/work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json) |
| N6-02 | 전체 residual 재계산 | 62쪽 | 승계 | 구현된 각 substep의 동일 전체 current에서 직접 PDE와 정확 분해 비교. 최신 pressure·old flat tail·quadratic remainder 포함. | [기준 원장](../evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json) · [개별 근거](../evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base/work/n602_continuation/ACTUAL_FINITE_CYCLE_RECEIPT.json) |
| N6-03 | 비영 angular harmonics 보정 | 62쪽 | 승계 | 동일 current의 모든 비영 조화항·새 mode·supported curl. 기록된11 그래프,540 PDE계수·2320 항등식. combined timeout 범위는 유지. | [기준 원장](../N6_PROGRESS.json) · [개별 근거](../navier/evidence/N6-harmonic.json) |
| N6-04 | Signed covariance increment | 62쪽 | 승계 | 고정 H·양의 a,81-label partition의 signed covariance와 세 remainder family. 개별 operator 기준 승계; 전체 수치장 범위 아님. | [기준 원장](../N6_PROGRESS.json) · [개별 근거](../navier/evidence/N6-signed.json) |
| N6-05 | Zero auxiliary mean Fourier inverse | 62쪽 | 승계 | 원 방향·zero mode 제거·ci 역수·slow-time 도함수와 각각의 Fourier tail.466 derivative program의162행. 개별 temporal operator 범위. | [기준 원장](../N6_PROGRESS.json) · [개별 근거](../navier/evidence/N6-workbench.json) |
| N6-06 | 다섯 radial equations와 압력 | 62쪽 | 승계 | 전체 label의 원 다섯 radial 식, 정확 두 보존 적분, 고정 profile map과 업데이트 pressure. 개별 operator와 전체 cycle을 구분. | [기준 원장](../N6_PROGRESS.json) · [개별 근거](../navier/evidence/N6-source-mean.json) |
| N6-07 | 고정 도메인과 차수 향상 | 62쪽 | 승계 | 공통 qbig의 finite states와 stage 독립 미분 손실·stage 의존 유효 상수/log power. 수치잔차는 별도. | [기준 원장](../evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json) · [개별 근거](../evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base/work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json) |
| N6-08 | 최종 local 합성 | 62쪽 | 승계 | 같은 finite correction sequence의 potential-cutoff local 합성과 평가 window의 active index·omitted tail 범위. | [기준 원장](../evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json) · [개별 근거](../evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base/work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json) |
| N7-01 | 시간·공간 cutoff 선택 | 64쪽 | 승계 | 원 초기 source와 Lemma9.7/Proposition9.9, qBig=qCommon/64, 원 r²/z cutoff·양의 초기 zero 구간·고정 K. | [기준 원장](../N7_PROGRESS.json) · [개별 근거](../navier/evidence/N7-workbench.json) |
| N7-02 | Localization 교차항 보존 | 64쪽 | 승계 | 원 curl(cA)+cB, cp의 열 cutoff commutator family와 직접 PDE의 정확 다항식 비교. annulus의 비영 수치값 미열거. | [기준 원장](../N7_PROGRESS.json) · [개별 근거](../navier/evidence/source-current-20261012/source-current-execution.json) |
| N7-03 | Force의 발산과 압력 계약 | 64쪽 | 승계 | 원 비투영 force와 cp의 pressure-Poisson 항등식. div f·cutoff·원통 정규화 생략 실패를 유지. | [기준 원장](../N7_PROGRESS.json) · [개별 근거](../navier/evidence/N8-acceptance.json) |
| N7-04 | Terminal force jets | 64쪽 | 승계 | 동일 localized force의 terminal jets. 유한 수치 차수와 모든 차수 smooth-extension 정리 구분. | [기준 원장](../evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json) · [개별 근거](../evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base/work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json) |
| N7-05 | t>1 force extension | 64쪽 | 승계 | 같은 terminal force jet의 미분 tail 제어 cutoff 합으로 t=2까지 compact extension. velocity 연장이 아님. | [기준 원장](../evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json) · [개별 근거](../evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base/work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json) |
| N7-06 | 전역 에너지 balance | 64쪽 | OPEN | 전체 K의 실제 같은 최종장·force 적분 및 독립 공간/시간 energy-defect 감소·ν=1 (10.13) 비교가 미완료. | [기준 원장](../evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json) · [개별 근거](../evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base/work/integrated_verifier/evidence/INTEGRATION_RUN_RECEIPT.json) |
| N7-07 | 실제 blowup 경로와 오차 | 64쪽 | 승계 | 원 Xin=Xa/2=2/Λ 내부 경로와 같은 최종장의 restriction. support induction과 양의 하한·Cτ^(2h) 나머지 범위. | [기준 원장](../N7_PROGRESS.json) · [개별 근거](../navier/evidence/N8-nearT.json) |
| N7-08 | 비교 정리·주기화· ν 확인 | 64쪽 | 승계 | 원 localization의 ν 배율·unit torus support gap·압력/에너지 Jacobian 비교 검토. C/D 결론의 에너지·정칙성 가정 유지. | [기준 원장](../N7_PROGRESS.json) · [개별 근거](../navier/evidence/N7-periodic.json) |
| N8-01 | Divergence-free Fourier 기저 | 66쪽 | 승계 | 별도2π-periodic Fourier Galerkin의 발산·켤레대칭·zero mode와 div f pressure 계약. 논문의 whole-space와 구분. | [기준 원장](../N8_PROGRESS.json) · [개별 근거](../navier/evidence/N8-acceptance.json) |
| N8-02 | 비선형 convolution과 dealiasing | 66쪽 | 승계 | 유지 direct convolution과 독립 padded FFT, high-mode aliasing 실패 및 기록된 NumPy 대조. | [기준 원장](../N8_PROGRESS.json) · [개별 근거](../navier/evidence/acceptance.json) |
| N8-03 | 시간 적응과 에너지 안정성 | 66쪽 | 승계 | 기존 IMEX의 CFL·step doubling·energy defect와 Taylor–Green2차 시간 수렴. 경로 오차와 solver 인수 구분. | [기준 원장](../N8_PROGRESS.json) · [개별 근거](../navier/evidence/N8-acceptance.json) |
| N8-04 | τ 기반 near-terminal sampling | 66쪽 | 승계 | 원 core restriction의3성분 near-terminal 구간과 양의 내부τ·s=−logτ. 임의 annular 좌표·전역 평가를 뜻하지 않음. | [기준 원장](../N8_PROGRESS.json) · [개별 근거](../navier/evidence/N8-nearT.json) |
| N8-05 | 공간·급수·정밀도 적응 | 66쪽 | OPEN | 같은 최종장에서 grid/Fourier cutoff/coefficient order/arithmetic precision의 독립2배와 별도 tail이 미완료. | [기준 원장](../evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json) · [개별 근거](../evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base/work/integrated_verifier/evidence/INTEGRATION_RUN_RECEIPT.json) |
| N8-06 | 시각화·물리량 연결 | 66쪽 | 승계 | 유한 periodic81점·벡터·물리 bounds, 유선/입자 이력, periodic/core 에너지와 선택·카메라 계약. | [기준 원장](../N8_PROGRESS.json) · [개별 근거](../navier/evidence/N8-TG.json) |
| N8-07 | Claim-test-proof 연결 | 66쪽 | 승계 | 각 유한 관측의 source/test metadata와 null analytic/Lean proof. 오차 지시자를 인증 enclosure로 바꾸지 않음. | [기준 원장](../N8_PROGRESS.json) · [개별 근거](../navier/evidence/acceptance.json) |
| N8-08 | 재현 패키지와 최종 체크 | 66쪽 | 승계 | 기록된 유한 periodic flow와 원 source core2개 fixture의 별도 환경 재현105,713값. 전체 최종장·all-scale 적응은 별도. | [기준 원장](../N8_PROGRESS.json) · [개별 근거](../navier/evidence/acceptance.json) |


원장에는 후속 근거41회 참조가 있으며 고유 파일은20개입니다. 보고서 작성 중 그20개 파일의 실제 바이트·크기·SHA를 원장 pin에 다시 비교해 모두 일치했습니다. 동일 파일을41개의 독립 증명으로 세지 않았습니다. 초기 원장 일부의56/64, 이전 공개 패널의57/64 및 개별 operator의 과거 false 상태는 각 시점·가정 범위를 보존하며, 최신62/64 원장의 출처와 함께 읽습니다.

### 4.1 N7-06의 원 인수 조건과 현재 실패 지점

원 설계도64쪽의 조건은 전체 compact support K에서

$$\frac{d}{dt}\frac{\|u\|_2^2}{2}+\nu\|\nabla u\|_2^2=\langle f,u\rangle$$

를 다루고, **정규화 energy defect가 독립 공간·시간 세분화에서 감소**하며, ν=1에서 원(10.13)

$$\|u(t)\|_2^2+2\int\|\nabla u\|_2^2\leq\left(\int\|f\|_2\right)^2$$

와 모순되지 않아야 한다는 것입니다. 감소는 원문에 있는 energy-defect 조건입니다. 장 자체의 새 단조성이나 임의 tolerance를 추가하지 않았습니다.



| 독립 비교 | 기록된 실행 요청 | 실제 defect / 원(10.13) | 현재 결과 |
| --- | --- | --- | --- |
| 공간 | grid8→16; 시간 조건 별도 고정 | null / null | 실제 비영 최종장 평가 전에 중단 |
| 시간 | time cells4→8; 공간 조건 별도 고정 | null / null | 실제 비영 최종장 평가 전에 중단 |


전체 K의 에너지·dissipation·force work, 적분 오차와 각각의 tail이 아직 없습니다. cutoff 셀의 exact-zero 분류나 core/주기 기준장의 에너지로 이를 대신하지 않았습니다. 실패 요청·원인·null 값은 [실제 에너지 비교 중단 영수증](evidence/ACTUAL_ENERGY_REFINEMENT_ATTEMPTS.json)에 저장되어 있습니다.

### 4.2 N8-05의 원 네 축

원 설계도66쪽은 core radius·axial length·pulse wavelength·active cutoff orders를 같은 실제 최종장에서 해결하고 아래 네 축을 각각 독립2배로 비교하며 별도 tail bound를 저장하도록 요구합니다. 네 좌표 x₁·x₂·x₃·t로 바꾸지 않았습니다. 아래8/16/4/80은 실행 요청 예산이며 원 인수 임계값을 새로 정의하지 않습니다.


| 원 독립 축 | 기준→2배; 다른 세 축 고정 | 비교 결과 | 별도 tail |
| --- | --- | --- | --- |
| grid | 8→16 | null / BLOCKED_BEFORE_ACTUAL_FIELD_EVALUATION | null |
| Fourier cutoff | 16→32 | null / BLOCKED_BEFORE_ACTUAL_FIELD_EVALUATION | null |
| coefficient order | 4→8 | null / BLOCKED_BEFORE_ACTUAL_FIELD_EVALUATION | null |
| arithmetic precision | 80→160 | null / BLOCKED_BEFORE_ACTUAL_FIELD_EVALUATION | null |


stage j≥5의 zero 판정은 보존된 ρ∈[1/2,1] 적용 범위에서만 승계합니다. finite prefix1–4의 실제 값, slow-base coefficient tail, Fourier tail와 quadrature tail은 별도입니다. last-resolved τ는 실제 전역 계산이 끝난 적이 확인되지 않아null입니다.

## 5. 이번에 새로 구현하고 실제 검증한 단위

아래 결과는 전역 의무의 일부 선행 계산·계약을 해결한 것입니다. 복구된 과거 코드와 새 작성 코드를 각 README 및 실행 영수증이 구분합니다. 파일명이 같다는 이유로 이전 대화의 미확인 후반 코드를 복구했다고 주장하지 않습니다.


| 새 단위 | 실제 구현 | 실행 결과 | 검증 범위 | 명령·종료코드·해시 영수증 |
| --- | --- | --- | --- | --- |
| 원 outer cutoff | [outer_cutoff.py](outer_cutoff.py) | 9개 회귀 검사 / 독립383개 대조 PASS | 닫힌 셀의 원 cutoff0..3 도함수·13 jets, 물리 z₀/τ₀ 배율·time 부호, seam·정확 zero 우선 처리 | [실행 영수증](evidence/cutoff-validation-attempt3/EXECUTION.json) |
| 원 scalar slow inverse | [slow_inverse_native.py](native/slow_inverse_native.py) | 19 native boxes / 22 endpoint certificates / 5 implicit identities / 16 부정 대조 PASS | 원 source call의 값·1/2차 미분과 양의 h. 실제 외부 caller 좌표 인증은 미완료 | [실행 영수증](native/EXECUTION_RECEIPT.json) |
| 원 band caller | [band_caller.py](../caller-recovery-20261019/band_caller.py) | 233 검사 +13 부정 대조; 별도497 대조 PASS | 원 label offset·strict support·공변성·axial exponential envelope,22 formal chart runs | [실행 영수증](../caller-recovery-20261019/EXECUTION_RECEIPT.json) |
| 원 A.13 binding | [bind_original_a13.mjs](../radial-recovery-20261019/bind_original_a13.mjs) | 27 검사 +13 부정 대조; 별도9 대조 PASS | 원77기록·13원코드 pin과 기존 세 적분 전제·공통 h의 정규화 역수 | [실행 영수증](../radial-recovery-20261019/EXECUTION_RECEIPT.json) |
| 원 Qb→wait→로그 반경 | [bind_logradius.mjs](../logradius-recovery-20261019/bind_logradius.mjs) | 35 검사 +25 부정 대조; 별도9검사+5부정 PASS | 57실행 기록·3해석 link·기존 A.13밖의21기록,6개 양의 닫힌 결과 | [실행 영수증](../logradius-recovery-20261019/EXECUTION_RECEIPT.json) |


### 5.1 cutoff와 native 선행 계산

원 cutoff의 exp tail, quotient 도함수 recurrence와 경계 seam을 구현했습니다. 독립 검토에서 public4096-bit 입력의 내부 guard 한계를 발견해 public4096·internal4128로 수정하고 실제 active-transition 회귀를 추가했습니다.383개 고정밀 대조는 유한 점/box의 독립 검사이며 모든 입력에 대한 새 형식 증명은 아닙니다. 이전 mpmath·SymPy 미설치 실패와 수정 후 성공을 숨기지 않았습니다.


| 정규화 지원영역의 grid | 셀 수 | exact-zero 셀 | 실제 field-jets 미완료 셀 | 물리량 결과 |
| --- | --- | --- | --- | --- |
| 8³ | 512 | 320 | 192 | whole-K energy=null |
| 16³ | 4096 | 2656 | 1440 | whole-K energy=null |


이 격자는 정규화된[-1,1]³ 지원영역의 닫힌 셀 분할입니다. 셀 수·zero 체적은 전역 에너지의 계산 비율이 아닙니다. 셀마다13개의 cutoff jet을 얻었고 해당 localization gate의 A/b/p 요구에는67개의 실제 field jet이 남습니다. 이13/67 목록을 전체138개 native 경계의 개수나 일부8개 미분과 동일시하지 않습니다. 원 scalar record700개와 추가 의존3,407개는 이미 기록·재현된 범위에서 승계하며 다시 전부 누락으로 분류하지 않습니다.

native inverse는 저장 source capsule의 원19개 기록과 call622820·623935를 사용합니다.32/64/128-bit에서 값과 implicit 미분 검사를 했으며 양의 h를0으로 치환하지 않았습니다. 아직 실제 전역 caller 좌표의 원 lexical frame·membership을 대신 제공하지 않습니다. 이 구분은 [native 최종 summary](native/evidence/SUMMARY.json)와 [cutoff 최종 summary](evidence/OUTER_CUTOFF_RUN.json)의 false/null 상태에도 남아 있습니다.

### 5.2 실제 band caller에서 해결한 관계

원 $s\in[1/2,2]$에서 $\lfloor 1/2-\log_2s\rfloor$의 경계와 tie 규칙을 정확히 유지합니다. $s^2\leq1/2$이면1, $1/2<s^2\leq2$이면0, $s^2>2$이면−1입니다. 닫힌 입력 box가 경계를 가로지르면 OPEN으로 남깁니다. 원 strict support는

$$|\log_2(rs)|<3/4\iff 1/8<(rs)^4<8$$

이고, 원 slow inverse의 상관된 transport는

$$F(rs;r^{1/2-h}Z,rT)=rF(s;Z,T)$$

를 유지합니다. 이 공변성은 동일 원 입력점의 상관된 이동에 관한 것이며, 반환된 주변 구간의 모든 독립 Cartesian 조합에 대한 주장이 아닙니다. $\ell\geq\ell_0$, 실제 외부 R/Z/T, coefficient window, radial guard, 원 적분과 mesh 대표점은 아직 별도 인증이 필요합니다. 두 정수 label을 고정한 도함수 multiplier와 nearest-label map 자체의 미분도 구분합니다.


근거: [caller 수학·범위 설명](../caller-recovery-20261019/README_KO.md), [497개 독립 대조](../caller-recovery-20261019/evidence/INDEPENDENT_BAND_CALLER_REVIEW.json).233개에는 이후 source-byte 안정성 검사1개가 포함되며, 앞선232개 결과와 소스 snapshot은 보존되어 있습니다.

### 5.3 원 A.13 상계의 승계와 새 source binding

원 논문 A.5의 square-seed $\sigma_2$와 A.12–A.13의 원 적분을 유지했습니다. 원239/257/275의 기존 소비자는 이미

$$I_{239}\in[1/4,3],\qquad I_{257}\in[1/4,3/2],\qquad Q_p\in[h/256,54h/256]$$

를 제공했습니다. 이번 작업은 이 증명이 없었다고 분류하지 않고 원77-record 저장 부분 그래프와 고정 code bytes에 연결합니다. 공통 $h>0$를 보존하면

$$Q_p=hK,\qquad K\in[1/256,27/128],\qquad h/Q_p\in[128/27,256].$$

원 source-form audit의 parent 인증 요구와 새 저장 부분 그래프의 private authority는 별개입니다. `sourceAuthenticated=true`는 현재 실제 물리점이나 whole-K 전체 그래프의 인증을 뜻하지 않습니다. 더 날카로운 진단 상계를 기존factor54 소비자의 실행 결과로 바꾸지 않았습니다.


검토에서 mutable report를 두 번 읽는 projection의 alternating-getter 결함을 실제로 재현했습니다. 수정 후 검증은 private serialized snapshot에서 projection을 만들며 원 실패와 수정 후9개 대조를 모두 보존합니다. 현재 runtime SHA는 `591b33d6882fe7cd00dd624b6df64cbbd0b9ee70954e45bc8b78bf09e51119ad`입니다. 근거: [수정 후 독립 검토](../radial-recovery-20261019/evidence/peer-review/radial-binding-attempt2/RADIAL_BINDING_REVIEW.json).

### 5.4 원 Qb·wait·로그 반경의 실제 전파

기존 원 A.13의239/257/275 구간과 기존 traced arithmetic evaluator를 연결해 원259,277,278,279,280,319를 실행했습니다. 원 매개변수는

$$T=e^{1048576}+10,\quad\lambda=e^{-1000T},\quad h=e^{-8002T}>0,\quad L=-4\log h=32008T.$$

$a=1-\lambda$, $b=1-h$라 두면 원 식은

$$Q_b=e^{-b/2}\left[e^{-a/2}\left(\frac{\lambda-h}{a}+I_{239}\right)+bL+I_{257}\right],\quad W=\frac{\log(Q_b/Q_p)}{1-h}.$$

원319의 정확한 affine wrapper는

$$T+90B_{Outer}+13/\lambda+T_f-4\log h+7+W=13e^{1000T}+122009T+135+W.$$

원 link28825=`exp(319)`,28826=`XR*28825`를 인증했으므로319는 `log(Xb/XR)`입니다. XR와28825·28826의 전체 수치 실행은 이 모듈에 포함하지 않았습니다. 원 source parameter T는 외부 slow-time 좌표622804를 대신하지 않습니다.


256-bit 원 AST 전파와 같은 기존 적분 전제를 쓰는 별도512-bit 순서의 recurrence가 겹치는 것을 확인했습니다. 이는 N8-05의 원 네 축 인수가 아닙니다. 원 정규화 K의 log 폭`log(54)`와 추가 산술 확대를 구분합니다. 반복 log 좌표의 작은 관측 폭으로 전체 Xb 상대오차를 보장하지 않았습니다. 보고서의 수치 endpoint는 rational/exp/neg로 닫혀 있고 h를0으로 두지 않습니다. 반환 report는 재귀 동결하고 projection은 private snapshot에서 읽습니다. 근거: [원 식·오차·다음 단계](../logradius-recovery-20261019/README_KO.md), [35+25 결과](../logradius-recovery-20261019/evidence/validation-attempt1/LOGRADIUS_VALIDATION.json), [독립 source·계수·authority 검토](../logradius-recovery-20261019/evidence/peer-review/logradius-binding-attempt1/LOGRADIUS_BINDING_REVIEW.json).

### 5.5 실행 명령의 재현 위치

아래는 실제 실행 영수증의 저장소 기준 명령 형태입니다. 이 보고서 작성 중 생산 계산을 다시 실행한 것은 아닙니다. 기존 산출물을 유지하려면 새 검증 출력 폴더 또는 별도의 disposable checkout을 사용해야 하며, native/caller의 원 command·환경·출력 SHA는 각각의 EXECUTION_RECEIPT에 있습니다.


| 단위 | 명령 | 기대·관찰 |
| --- | --- | --- |
| cutoff | `python -m unittest discover -s research-ide/mathscope-m3/recovery-20261019 -p test_outer_cutoff.py -v` | 9 tests / exit0 |
| native | `python research-ide/mathscope-m3/recovery-20261019/native/verify_slow_inverse.py --source-capsule research-ide/mathscope-m3/recovery-20261019/native/evidence/SOURCE_CAPSULE.json --output-dir NEW_OUTPUT_DIR` | 19boxes·22certificates·5identities·16controls / exit0 |
| caller | `python research-ide/mathscope-m3/caller-recovery-20261019/verify_band_caller.py` | 233checks·13controls / exit0; 원 출력 파일 정책 확인 |
| A.13 | `node research-ide/mathscope-m3/radial-recovery-20261019/verify_binding.mjs --output-dir NEW_OUTPUT_DIR` | 27checks·13controls / exit0 |
| logradius | `node research-ide/mathscope-m3/logradius-recovery-20261019/verify_logradius.mjs --output-dir NEW_OUTPUT_DIR` | 35checks·25controls / exit0 |


## 6. M4의 원16개 조건과 검증 연결

I3-01…08은 원 설계도20쪽, R1-01…08은68쪽입니다. 항목을 새로 발명하지 않았습니다. 원문·정확 구현 pin·명령·기대값·실행 결과·증거·남은 의무가 [기계 판독 matrix](../../mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json)에 있으며, 현재26개 고유 구현 파일의 바이트·SHA를 matrix와 다시 비교해 모두 일치했습니다.

matrix는19:05:23 UTC에 생성된 source333d snapshot입니다. 그 안의 githubSaved=false, sitePublished=false, currentBrowserInspection=false는 작성 당시 상태이며 그대로 보존합니다. 이후 첫cf98 저장·CI·v118 게시·제한 검수는3절과7절의 별도 영수증으로 연결합니다. 이 후속 사실이 M4 전체16개 원 인수 완료를 뜻하지 않습니다.

### 6.1 실제 명령·기대값·결과와 증거


| 검사 참조 | 실제 명령 | 기대값 | 실제 결과 | 원 실행 증거 |
| --- | --- | --- | --- | --- |
| S1 inherited-acceptance | `node --test-reporter=tap research-ide/mathscope-m4/tests/acceptance.test.mjs` | exit 0; 13 registered assertions pass; no skipped cases | PASS / exit0 | [inherited-acceptance.tap](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-acceptance.tap) |
| S2 inherited-kernel-contract | `node --test-reporter=tap research-ide/mathscope-m4/tests/pinned-kernel-contract.test.mjs` | exit 0; 4 registered assertions pass; no skipped cases | PASS / exit0 | [inherited-kernel-contract.tap](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-kernel-contract.tap) |
| S3 inherited-kernel-evidence | `node --test-reporter=tap research-ide/mathscope-m4/tests/kernel-evidence.test.mjs` | exit 0; 9 registered assertions pass; no skipped cases | PASS / exit0 | [inherited-kernel-evidence.tap](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-kernel-evidence.tap) |
| S4 inherited-runtime | `node --test-reporter=tap research-ide/mathscope-m4/release-lab/runtime.test.mjs` | exit 0; 9 registered assertions pass; no skipped cases | PASS / exit0 | [inherited-runtime.tap](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-runtime.tap) |
| S5 semantic-session | `node --test-reporter=tap research-ide/mathscope-m4/recovery-20261019/tests/evidence-session.test.mjs` | exit 0; 10 registered assertions pass; no skipped cases | PASS / exit0 | [semantic-session.tap](../../mathscope-m4/recovery-20261019/evidence/attempt5/semantic-session.tap) |
| S6 observation-inspection | `node --test-reporter=tap research-ide/mathscope-m4/recovery-20261019/tests/inspect-evidence.test.mjs` | exit 0; 6 registered assertions pass; no skipped cases | PASS / exit0 | [observation-inspection.tap](../../mathscope-m4/recovery-20261019/evidence/attempt5/observation-inspection.tap) |


서로 중복 인용되는 여섯 suite의 고유 test 합계는51개입니다. 새 semantic10개·inspection6개와 기존 guard/contract35개로 이루어집니다. item마다 같은 suite를 참조한다고51개를 반복 합산하지 않습니다. `S1…S6`는 원 인수 ID가 아니라 위 실제 명령을 가리키는 보고서 내부 참조입니다.

### 6.2 원16개 항목별 인수·구현·실행·남은 의무


| 원 ID | 원문 위치·원 인수 조건 | 구현 파일 | 실제 명령 연결 | 실행 결과 | 증거 | 상태·남은 원 의무 |
| --- | --- | --- | --- | --- | --- | --- |
| I3-01 | 정의와 연구가설의 파일 분리; 20쪽. Defs, Finite, Analytic, Comparison, Conditional, Open 모듈을 나누고 Open은 axiom-free theorem import 경로에 넣 지 않는다. 합격: unconditional target의 dependency closure에 사용자 공리가 있으면 해당 등급의 build가 실패한다. | [Defs.lean](../../mathscope-m4/lean/MathScope/M4/Defs.lean); [Finite.lean](../../mathscope-m4/lean/MathScope/M4/Finite.lean); [Analytic.lean](../../mathscope-m4/lean/MathScope/M4/Analytic.lean); [Comparison.lean](../../mathscope-m4/lean/MathScope/M4/Comparison.lean); [Conditional.lean](../../mathscope-m4/lean/MathScope/M4/Conditional.lean); [Open.lean](../../mathscope-m4/lean/MathScope/M4/Open.lean); [kernel-evidence.mjs](../../mathscope-m4/kernel-evidence.mjs) | S3 / S1 (기대값은6.1) | S3:9/9 PASS, exit0; S1:13/13 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-kernel-evidence.tap) · [승계 자료](../../mathscope-m4/evidence/formal-audit-20261014.json) | PARTIAL / 원 인수UNCONFIRMED. 현재 선택 연구 target의 전체 원 인수는 미검토. 사용자 공리가 unconditional closure에 들어오면 실패해야 함. |
| I3-02 | 유한 대수 정리부터 형식화; 20쪽. delta identities의 허용 정밀도, d²=0, semilinear chain map, 유한 소수 구간 인증, Lie bracket, lattice holonomy를 작은 정리로 나눈다. 합격: 자체 fixture와 일부러 잘못된 certificate가 각각 수락·거부된다. 숫자 예시와 전칭 정리의 범위가 구분 된다. | [Finite.lean](../../mathscope-m4/lean/MathScope/M4/Finite.lean); [kernel-evidence.mjs](../../mathscope-m4/kernel-evidence.mjs) | S3 / S2 (기대값은6.1) | S3:9/9 PASS, exit0; S2:4/4 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-kernel-evidence.tap) · [승계 자료](../../mathscope-m4/evidence/formal-audit-20261014.json) | PARTIAL / 원 인수UNCONFIRMED. p=2·고정 정수·identity endomorphism·[2,30) 소수·2×2 bracket·shear plaquette 범위. 일반 p/Frobenius/holonomy로 확대하지 않음. |
| I3-03 | 해석적 가정의 구체화; 20쪽. 완비성, uniform convergence, 미분과 극한의 교환, semigroup bounds, spectral measure, stability constants의 정확 한 진술을 저장한다. 합격: 무한 합의 미분이나 continuum limit를 쓰는 lemma마다 필요한 norm·정의역·양화 범위가 표시 된다. | [analytic-obligations.json](../../mathscope-m4/analytic-obligations.json); [Defs.lean](../../mathscope-m4/lean/MathScope/M4/Defs.lean); [Analytic.lean](../../mathscope-m4/lean/MathScope/M4/Analytic.lean); [formal-claims.mjs](../../mathscope-m4/formal-claims.mjs) | S3 (기대값은6.1) | S3:9/9 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-kernel-evidence.tap) · [승계 자료](../../mathscope-m4/evidence/formal-audit-20261014.json) | PARTIAL / 원 인수UNCONFIRMED. Real/Banach/Hilbert의 미분-limit·semigroup·spectral measure·stability adapter는 SPECIFICATION_LEAN_IMPORT_MISSING. 최종장 실제 적용 별도. |
| I3-04 | 외부 비교 정리의 adapter; 20쪽. 프리즘 비교·trace formula·BSD의 알려진 경우·NS 원문 정리를 인용 레벨과 실제 Lean import 레벨로 구분한다. 합격: 문헌 링크만 연결된 결과는 THEOREM REFERENCE이며, 정확한 exported Lean theorem을 import한 경우에만 kernel 결과와 연결된다. | [analytic-obligations.json](../../mathscope-m4/analytic-obligations.json); [Comparison.lean](../../mathscope-m4/lean/MathScope/M4/Comparison.lean); [formal-claims.mjs](../../mathscope-m4/formal-claims.mjs); [acceptance.mjs](../../mathscope-m4/acceptance.mjs) | S3 / S1 (기대값은6.1) | S3:9/9 PASS, exit0; S1:13/13 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-kernel-evidence.tap) · [승계 자료](../../mathscope-m4/evidence/formal-audit-20261014.json) | PARTIAL / 원 인수UNCONFIRMED. Prism/trace/BSD/원 NS는 THEOREM REFERENCE. 해당 정확 exported Lean import를 이번에 새로 만들지 않음. |
| I3-05 | 소스 생성과 재검사; 20쪽. 사용자가 G·Δ·p·정밀도·계수식·가정을 바꾸면 새로운 ProofJob을 만들고, 이전 검사 결과는 hash 불일치로 분리한다. 합격: 기본 시나리오 소스를 한 글자 바꾸는 negative test에서 과거 PASS가 재사용되지 않는다. | [proof-jobs.mjs](../../mathscope-m4/proof-jobs.mjs); [evidence-session.mjs](../../mathscope-m4/recovery-20261019/evidence-session.mjs) | S3 / S5 (기대값은6.1) | S3:9/9 PASS, exit0; S5:10/10 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-kernel-evidence.tap) · [승계 자료](../../mathscope-m4/evidence/formal-audit-20261014.json) | PARTIAL / 원 인수UNCONFIRMED. 새 parameter별 실제 수학 target의 kernel 실행과 생산 UI ProofJob 연결 미확인. |
| I3-06 | 커널·공리·빌드 감사; 20쪽. Lean/mathlib commit, compile exit, warnings, sorry 여부, #print axioms, target theorem type, 소요 시간을 기록한다. 합격: 0=1을 rfl로 제출하는 통제 사례가 실패한다. kernel PASS가 UI에서 사용자 공리 의존성을 가리지 않는다. | [kernel-evidence.mjs](../../mathscope-m4/kernel-evidence.mjs); [pinned-kernel-contract.mjs](../../mathscope-m4/tools/pinned-kernel-contract.mjs); [pinned-kernel-replay.mjs](../../mathscope-m4/tools/pinned-kernel-replay.mjs); [formal-claims.mjs](../../mathscope-m4/formal-claims.mjs) | S2 / S3 / S1 (기대값은6.1) | S2:4/4 PASS, exit0; S3:9/9 PASS, exit0; S1:13/13 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-kernel-contract.tap) · [승계 자료](../../mathscope-m4/evidence/formal-audit-20261014.json) | PARTIAL / 원 인수UNCONFIRMED. 새 Lean kernel 실행 없음. 과거 compiler/axiom/type/실패 기록을 source 범위에 연결. |
| I3-07 | 연구 관문의 완료 조건; 20쪽. RH global bridge, 전칭 BSD, 일반 G continuum quantum construction은 RESEARCH OPEN으로 관리한다. 알려진 prism 비교의 구현은 MODEL DEVELOPMENT로, 새로운 비교정리가 필요한 경우는 RESEARCH OPEN으로 구분한다. 합 격: 가정 자체를 결론으로 다시 쓰는 순환 증명과 대수적 이름만 붙인 의미 인터페이스가 연구 관문을 닫지 못한다. | [acceptance.mjs](../../mathscope-m4/acceptance.mjs); [formal-claims.mjs](../../mathscope-m4/formal-claims.mjs); [analytic-obligations.json](../../mathscope-m4/analytic-obligations.json) | S1 / S3 (기대값은6.1) | S1:13/13 PASS, exit0; S3:9/9 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-acceptance.tap) · [승계 자료](../../mathscope-m4/evidence/formal-audit-20261014.json) | PARTIAL / 원 인수UNCONFIRMED. 전체 연구 graph/UI 인수 미확인. RH·전칭 BSD·일반G continuum·새 비교정리 OPEN 유지. |
| I3-08 | 교육용 설명과 전문가 감사 동기화; 20쪽. 학생에게는 문장과 예제를, 연구자에게는 동일 claim의 정확한 Lean type·가정·출처·반례 조건을 보여준다. 합격: 두 모드가 같은 claim ID를 사용하고, 쉬운 설명에서 양화사·조건·근사 범위가 빠지지 않는다. | [formal-claims.mjs](../../mathscope-m4/formal-claims.mjs); [inspect-evidence.mjs](../../mathscope-m4/recovery-20261019/inspect-evidence.mjs) | S3 / S6 (기대값은6.1) | S3:9/9 PASS, exit0; S6:6/6 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-kernel-evidence.tap) · [승계 자료](../../mathscope-m4/evidence/formal-audit-20261014.json) | PARTIAL / 원 인수UNCONFIRMED. 동일 claim·범위·가정 inspection은 준비. 전체 학생/전문가 walkthrough 원 인수 미확인. |
| R1-01 | 기준 예제 전 구간 재현; 68쪽. 점·P1·좋은 소수의 E, SU2/SU3/G2 지원 예제, heat exterior/axis profile/기준 PDE를 clean worker에서 실행한다. 합격: 명시된 작은 fixture에서 입력 hash·출력 불변량·오차 범위가 acceptance manifest와 일치한다. | [catalog.json](../../mathscope-m4/release-lab/catalog.json); [verify-fixtures.mjs](../../mathscope-m4/release-lab/verify-fixtures.mjs); [runtime.mjs](../../mathscope-m4/release-lab/runtime.mjs) | S5 / S6 / S4 (기대값은6.1) | S5:10/10 PASS, exit0; S6:6/6 PASS, exit0; S4:9/9 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/semantic-session.tap) · [승계 자료](../../mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json) | PARTIAL / 원 인수UNCONFIRMED. P1·기준 TG·prism·delta 일부 실제 Worker 관측은 보존. 전체13 fixture의 새 원 인수 완료는 주장하지 않음. |
| R1-02 | 정밀도와 해상도 수렴 표; 68쪽. p-adic M, series order J, spatial K, lattice a/L, sample count를 하나씩 바꾸고 관측의 변화와 예측 오차를 기록한다. 합격: 인증된 수치 경계 위반은 실패다. 앙상블 통계는 사전 유의수준·autocorrelation·독립 반복 기준으로 판정하며 신뢰구간은 결 정론적 보장과 구별한다. 수렴표만으로 무한 극한 정리를 발급하지 않는다. | [catalog.json](../../mathscope-m4/release-lab/catalog.json); [verify-fixtures.mjs](../../mathscope-m4/release-lab/verify-fixtures.mjs) | 새 자동 실행 없음 (기대값은6.1) | 기록된 과거 범위만 승계 | [승계 자료](../../mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json) | PARTIAL / 원 인수UNCONFIRMED. 과거 표의 정해진 유한/표시 범위만 승계. 통계 alpha·autocorrelation·독립 ensemble 반복 인수 및 N8-05는 미완료. |
| R1-03 | 출처에서 그림까지 추적; 68쪽. 모든 핵심 그림의 점 또는 패치를 선택하면 원식, 논문 위치, job, 오차, theorem/assumption ID를 열 수 있게 한다. 합격: NS의 원문 식과 생성 계수, prism 비교사상, Δ state generator 각각 하나를 end-to-end로 추적한다. | [release-lab.js](../../mathscope-m4/web/release-lab.js); [inspect-evidence.mjs](../../mathscope-m4/recovery-20261019/inspect-evidence.mjs) | S6 (기대값은6.1) | S6:6/6 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/observation-inspection.tap) · [승계 자료](../../mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json) · [v118 QA](../../mathscope-m4/recovery-ui-20261019/evidence/V118_BROWSER_QA_BEFORE_FOLLOWUP.json) | PARTIAL / 원 인수UNCONFIRMED. 고정 source bytes와 실제 선택 연결·실제3개 source 방문은 확인. 원 최종장 계수/prism/delta 전체 생산 end-to-end는 미확인. |
| R1-04 | 세션·가정 변경 회귀; 68쪽. p·G·Δ·τ·cutoff·계수체 변경 후 정확한 downstream node만 STALE이 되는지 검사한다. 합격: 계산 중 입력 변경, 취소, 재 개, 내보내기/가져오기 후 다른 입력의 증거가 연결되지 않는다. | [runtime.mjs](../../mathscope-m4/release-lab/runtime.mjs); [evidence-session.mjs](../../mathscope-m4/recovery-20261019/evidence-session.mjs) | S4 / S5 (기대값은6.1) | S4:9/9 PASS, exit0; S5:10/10 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-runtime.tap) · [승계 자료](../../mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json) | PARTIAL / 원 인수UNCONFIRMED. 선언된 downstream graph·ABA·취소/재개·import격리 검사. 실제 전체 생산 graph 의존성을 스스로 증명하지 않음. |
| R1-05 | 화면·접근성·성능 검수; 68쪽. 데스크톱과 모바일 한 종류 이상, 키보드, WebGL/CPU fallback, 긴 한국어·수식, 색 범위와 샘플 선택을 확인한다. 합격: 클 리핑·빈 3D·오류 overlay가 없고, 문서에 정한 표본 예산에서 조작 지연과 메모리 상한을 만족한다. | [panel.js](../../mathscope-m4/web/panel.js); [release-lab.js](../../mathscope-m4/web/release-lab.js); [panel.css](../../mathscope-m4/web/panel.css); [release-lab.css](../../mathscope-m4/web/release-lab.css); [test-browser.mjs](../../mathscope-m4/web/test-browser.mjs); [verify-live-panel.mjs](../../mathscope-m4/web/verify-live-panel.mjs) | 새 자동 실행 없음 (기대값은6.1) | v118 제한 수동 검수; 원 전체 인수 미충족 | [승계 자료](../../mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json) · [v118 QA](../../mathscope-m4/recovery-ui-20261019/evidence/V118_BROWSER_QA_BEFORE_FOLLOWUP.json) | OPEN / 원 인수UNCONFIRMED. v118 desktop·일부 keyboard·CPU/SVG 검수 수행. 수정 전 launcher overlap 실패를 기록했고 followup2 뒤 desktop 클릭·위치 수정을 확인. 실제 mobile·touch·성능/메모리 인수 미검수. |
| R1-06 | 증거 경계 공격 테스트; 68쪽. 조작된 PASS, 잘못된 소스 hash, 원문과 다른 theorem type, 조작된 prime certificate, 잘못된 force/cutoff를 주입한다. 합격: 각 사례가 기대하는 이유로 거부되고 기존 유효 관측은 보존된다. 로그는 사용자가 원인을 이해할 수 있다. | [acceptance.mjs](../../mathscope-m4/acceptance.mjs); [kernel-evidence.mjs](../../mathscope-m4/kernel-evidence.mjs); [runtime.mjs](../../mathscope-m4/release-lab/runtime.mjs); [evidence-session.mjs](../../mathscope-m4/recovery-20261019/evidence-session.mjs); [inspect-evidence.mjs](../../mathscope-m4/recovery-20261019/inspect-evidence.mjs) | S1 / S2 / S3 / S4 / S5 / S6 (기대값은6.1) | S1:13/13 PASS, exit0; S2:4/4 PASS, exit0; S3:9/9 PASS, exit0; S4:9/9 PASS, exit0; S5:10/10 PASS, exit0; S6:6/6 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-acceptance.tap) · [승계 자료](../../mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json) | PARTIAL / 원 인수UNCONFIRMED. 위조 PASS/hash/type/axioms/prime/foreign binding 거절. 실제 전체 force/cutoff 수학 반례 인수는 M3 source 의무와 별도. |
| R1-07 | 연구·교육 시나리오 완료; 68쪽. 학생용 계수체 실험, 연구용 Frobenius/local-factor 감사, Δ 상태족 비교, NS 근사/잔차 비교의 네 walkthrough를 수행한 다. 합격: 설명만 보고 다른 사람이 같은 입력과 결과를 재현할 수 있다. 결과의 의미와 미해결 가정을 직접 확인한다. | [README_KO.md](../../mathscope-m4/release-lab/README_KO.md); [catalog.json](../../mathscope-m4/release-lab/catalog.json); [release-lab.js](../../mathscope-m4/web/release-lab.js) | S5 / S6 (기대값은6.1) | S5:10/10 PASS, exit0; S6:6/6 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/semantic-session.tap) · [승계 자료](../../mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json) | PARTIAL / 원 인수UNCONFIRMED. 네 walkthrough 문서·fixture 보존. 다른 사람이 현재 문서/UI로 전 네 시나리오를 재현한 최종 인수는 미확인. |
| R1-08 | 범위별 릴리스 판정; 68쪽. 지원 대상을 명시한 기능만 배포 후보로 묶고, 기존 전체 RELEASE HOLD와 구분해 모듈별 상태를 보고한다. 합격: 패치·테스 트·되돌리기 자료가 준비되고 실제 게시 후 화면을 확인한 시점에만 배포 완료를 기록한다. | [acceptance.mjs](../../mathscope-m4/acceptance.mjs); [criteria.mjs](../../mathscope-m4/criteria.mjs) | S1 (기대값은6.1) | S1:13/13 PASS, exit0 | [실제 TAP](../../mathscope-m4/recovery-20261019/evidence/attempt5/inherited-acceptance.tap) · [승계 자료](../../mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json) · [v118 QA](../../mathscope-m4/recovery-ui-20261019/evidence/V118_BROWSER_QA_BEFORE_FOLLOWUP.json) | OPEN / 원 인수UNCONFIRMED. v118와 followup2의 실제 게시·제한 검수는 확인. 두 번째 commit·CI 및 원 조건 전체의 범위별 릴리스 판정은 미완료, 전체 HOLD 유지. |


새 `evidence-session.mjs`는 입력/소스 revision·의존 DAG·epoch로 ABA 및 진행 중 변경을 차단하고, presentation revision을 계산 증거와 분리합니다. `inspect-evidence.mjs`는 첫 await 이전에 selection path를 고정하고 supplied raw bytes를 해시하여 UTF-8 BOM을 지우는 오류를 막습니다. 독립 검토의 원 실패와 수정 후 거절 결과를 보존했습니다. 이는 공급된 의존성 선언을 검사하는 소프트웨어 기능이며 원 물리장·Lean 정리를 새로 증명하는 기능은 아닙니다. STARTING 취소의 전체 생산 UI 인수와 새 Lean 실행도 완료로 표시하지 않습니다.

## 7. 기존 운영 페이지의 업데이트와 실제 검수

운영 대상은 [기존 v0.3.1 페이지](https://project29770.websitepublisher.ai/v0.3.1.html)입니다. 별도 새 데모 페이지로 대체하지 않았습니다. v117의 기존 경로·외부 script39개를 보존한 상태에서 원80개 ID와 실제 source/evidence를 탐색하는 panel을 통합했습니다. 데이터·선택·슬라이더는 고정된 저장 자료와 같은 코드 출처를 사용하고, 장식용 임의 값을 실제 수치장으로 제공하지 않습니다.

### 7.1 실제 게시 영수증


| 단계 | 확인 결과 | 근거 |
| --- | --- | --- |
| 준비 | 19개 UI/data tests, runtime 구문, 정적 검사 exit0; source path353개 Git object 검증 | FRAGMENT_EXECUTION.json / PINNED_PREPUBLICATION.json |
| 앞선 큰 patch2회 | SENT_RESULT_UNKNOWN; 중단·readback 기록 보존 | PUBLICATION_ATTEMPT_1/2.json과 POST_INTERRUPTION* |
| fragment 준비 | layout1·data12·runtime1의14개 fragment create/read gate | ROOT_FRAGMENT_CREATE_00…13.json / ROOT_ACTIVATION_READ_GATE.json |
| 기존 page activation | 응답 success, live v118 /9a0eebc5, patch1개 | ROOT_PAGE_ACTIVATION.json |
| version 시각 | 서버 page updated_at=2026-10-18T21:02:53Z | PUBLISHED_PAGE_INDEX_READBACK.json; 응답 수신시각과 구분 |
| 재개 후 수정 전 HTTP | 200,29,172,293 bytes; 후속 수정 전v118 전체 HTML SHA 일치 | website_audit/PUBLIC_RESUME_READBACK_ESCALATED.json |
| followup2 사전 실행 | UI/data23/23 PASS, builder 및 양쪽 runtime 구문 exit0 | evidence/followup-2/execution.json / 2.stdout.log |
| followup2 layout patch | 응답 success; fragment v2 /460012fd, patch2개 | FOLLOWUP2_LAYOUT_PATCH_RESULT.json |
| followup2 runtime patch | 응답 success; fragment v2 /fa62da96, patch2개 | FOLLOWUP2_RUNTIME_PATCH_RESULT.json |
| followup2 공개 HTTP | 200,29,173,684 bytes; 예정 전체 SHA 및 layout/runtime/data 바이트 일치 | FOLLOWUP2_PUBLIC_BYTE_AUDIT.json |
| followup2 page 목록 | page metadata v118/9a0eebc5 유지, 다른 page 변경 없음 | FOLLOWUP2_PAGE_INDEX_READBACK.json |
| followup2 게시 후 제한 검수 | desktop launcher·과거 상태 안내3곳·주요 저장자료 조작 확인 | postpublication-followup-2/mathscope-followup2-browser-qa.json |


후속 수정 전v118 공개 HTML의 SHA-256은 `bade76b34a07352e7cdce793ddc4af18e75e031976357bc6e030bd101a1187bb`였습니다. followup2 게시 뒤2026-10-18T23:16:27.871432+00:00부터23:16:38.985600+00:00까지 실제 공개 URL을 읽은 결과는 HTTP200,29,173,684바이트, SHA-256 `3436ed76a985ee554c889ebabddae758a09b5b385b12bc2908fd0d4f32c90135`로 사전 계획과 정확히 일치했습니다. 삽입 marker 밖의39개 script를 포함한 원문은v117 및v118와 동일하고,12개 data fragment를 해독한1,139,222바이트도 원 SHA `a0aece9bfb60d7ca3d7632c5e61c3d4f32b5a2bd495642b9517a3c0e03e23e85`와 동일합니다. 변경된 것은 layout/runtime fragment의 version2이며 page 목록의 version118/9a0eebc5와 구분합니다.

14개 fragment 준비의 published=false는 그 준비 시점의 기록이며 이후 성공 응답과 함께 읽습니다. activation21,290-byte 요청은 기존 두 불명확한 큰 요청의 무작정 재전송이 아니며, 이전 상태와 새 fragment의 실제 read gate를 거친 별도 작업입니다. followup2 역시 layout2,423바이트·runtime3,177바이트의 각각 다른 현재 fragment version guard를 적용한 두 요청이며 각 성공 응답을 보존했습니다.

원 응답: [page activation](../../mathscope-m4/recovery-ui-20261019/evidence/ROOT_PAGE_ACTIVATION.json), [page 목록 readback](../../mathscope-m4/recovery-ui-20261019/evidence/PUBLISHED_PAGE_INDEX_READBACK.json), [준비 실행 영수증](../../mathscope-m4/recovery-ui-20261019/evidence/FRAGMENT_EXECUTION.json). 재개 HTTP 파일은 `website_audit/PUBLIC_RESUME_READBACK_ESCALATED.json`이며 수정 전 실제 공개 바이트를 읽은 기록입니다. 후속 원 응답은 [layout patch](../../mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_LAYOUT_PATCH_RESULT.json), [runtime patch](../../mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_RUNTIME_PATCH_RESULT.json), [공개 바이트 검사](../../mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_PUBLIC_BYTE_AUDIT.json), [page metadata readback](../../mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_PAGE_INDEX_READBACK.json), [23개 test와 구문 검사](../../mathscope-m4/recovery-ui-20261019/evidence/followup-2/execution.json)입니다.

### 7.2 표시 기능과 실제 원 데이터의 연결


| 기능 | 실제 연결·표시 | 범위 |
| --- | --- | --- |
| 원 기준 검색/상태 | M3원64+M4원16;62/64,14PARTIAL·2OPEN,τ=null | 원 item의 문서 쪽수·구현·로그·미해결 의무 |
| native 저장구간 탐색 | 원 root/caller ID,η0/1/2차 균일 구간·source pin | 저장된 원 함수 구간; 전역 caller 실제값의 완료로 표시하지 않음 |
| cutoff 셀·slice | 실제512셀·13jets; EXACT_ZERO/MISSING_ACTUAL_FIELD_JETS | 정규화 절단/표시 bounds와 원 물리 domain 배율을 구분 |
| N7/N8 비교표 | 독립 space/time 및 원 네 축의 요청·중단원인·null 비교/tail | cutoff8→16 지원영역 비교를 에너지 검증으로 올리지 않음 |
| 노름·force-extension 자료 | 원 지수·노름 상수 미평가, 원 heat exterior 식·차수·alias 실패 | 조건부 상계와 유한 표본·원 theorem 적용 범위 노출 |
| 원문·증거 연결 | 고정 cf98 원장·M4 matrix·cutoff source 링크와原PDF SHA | 시각화는 증거를 탐색하는 도구; 증명 대체 아님 |
| 오류/빈값 | 빈검색, 로딩/미수입, 잘못된 원 파일 SHA 거절, null 유지 | 없거나 미확인인 값에0·임의τ·PASS를 넣지 않음 |


적절한2D/SVG·표를 사용한 구간/상태 자료와 기존 실제 finite flow 화면을 구분합니다. 전체 전역장의 값이 없는 에너지/잔차/tail을 새3D 장처럼 표시하지 않습니다.3D가 필요 없는 table·interval data를 억지로3D로 바꾸지 않았습니다.

### 7.3 실제 v118 브라우저 QA와 후속 수정의 검수 범위


| 검수 항목 | 실제 결과 | 미완료·한계 |
| --- | --- | --- |
| desktop | 1363×936 환경에서 panel 동작, 실제 dialog/선택과 가로 overflow 확인 | 다른 화면 크기의 전체 인수는 미확인 |
| 원 상태·검색 | 80개 원ID,62/null,14PARTIAL·2OPEN,빈검색 표시 확인 | 완료 수 승격 없음 |
| keyboard | Enter 열기·Escape 닫기·focus 복귀 기록 | 전체 제품 keyboard 순회 인수는 별도 |
| native/cutoff/refinement controls | 실제 root/caller·셀·slice·2배 요청·실패사례 조작 확인 | 관찰은 표시된 저장 자료 범위 |
| 잘못된 import | 원 파일 SHA mismatch 거절 후62/null 상태 유지 | 정확 legacy UI_DATA.json의 양성 import는 미검수 |
| source links | M4matrix·cutoff512cells·M3ledger3개 실제 GitHub 방문 | 353개 링크 전부를 브라우저에서 방문한 것은 아님 |
| 기존 회귀 | 실제 WebMCP 시각 회귀29/29 PASS | 해당 finite/model 기능의 회귀 범위 |
| 기존 fluid Worker | N8 reference TG:cutoff2,endTime0.5,initialStep0.1,ν1;81점 실제 실행·결과해시 재현 | 주기 기준장의 유한 실행; N7-06 whole-K 결과 아님 |
| WebGL 불가 대체 | 기존 Canvas와 새SVG·표의 실제 표시 확인 | 기존 Three.js WebGL-disabled 오류3개와 extension 오류 존재; 콘솔 전체 clean 아님 |
| mouse launcher | 수정 전 새 버튼 가림·옛 right button/footer overlap 발견; followup2 후3개 버튼의 독립 hit와 실제 클릭 확인 | 실제1363×936 desktop 범위; mobile/touch 인수는 미검수 |
| 옛 상태 안내 | 수정 전 과거56/64 범위 안내 부족 발견; followup2 후 두 dialog와 main Picard에 각1개 안내 확인 | 과거 수치를 보존하고 현재62/64·OPEN·null 범위를 알림; 재열기 후 중복 없음 |
| mobile/touch | 직접 검사하지 못함 | 도구의 실제 viewport resize 미제공; 추측 통과 없음 |
| 성능/메모리 | 원 예산별 조작 latency·메모리 상한 전체 인수 미검수 | R1-05 OPEN 유지 |


QA 원본은 [v118 실제 조작/콘솔 기록](../../mathscope-m4/recovery-ui-20261019/evidence/V118_BROWSER_QA_BEFORE_FOLLOWUP.json), [실제 reference Worker 출력](../../mathscope-m4/recovery-ui-20261019/evidence/V118_FLUID_REFERENCE_RESULT.json), [3개 원문 방문](../../mathscope-m4/recovery-ui-20261019/evidence/V118_SOURCE_LINK_VISITS.json), [재개 후 관찰](../../mathscope-m4/recovery-ui-20261019/evidence/BROWSER_RESUME_OBSERVATION.json)입니다. 화면은 [v118 실제 Canvas/SVG 화면](../../mathscope-m4/recovery-ui-20261019/evidence/v118-fluid-reference.jpg)에 있습니다. 원 UI history의56/57/62를 같은 시점·같은 범위의 완료 수로 합치지 않았습니다. 내보내기 동작 기록과 실제 다운로드 파일의 바이트 검증도 구분합니다.

게시 후 후속 QA는2026-10-18T23:17:02.218Z부터23:26:28.948Z까지 실제 운영 URL에서 수행했습니다. [새 QA 원본](../../mathscope-m4/recovery-ui-20261019/evidence/postpublication-followup-2/mathscope-followup2-browser-qa.json)은48,008바이트·SHA `6631bba485cabb566e64bd4461c4ac9568283cf9b00a897307a369d97c86bdfb`이며, screenshot3개와 함께 [원본 바이트 보존 manifest](../../mathscope-m4/recovery-ui-20261019/evidence/postpublication-followup-2/ARTIFACT_MANIFEST.json)에 연결되어 있습니다. 새 launcher를 실제 클릭하여 dialog가 열리고, M4 filter가16개 원 ID와14PARTIAL/2OPEN을 보이는 것을 확인했습니다. Tab 이동이 열린 dialog 안에 있고 Escape 후 launcher로 focus가 복귀했습니다. 과거 두 dialog도 실제 클릭해 열었으며, 탭 전환·재열기 후 안내는 세 host에 각각1개로 유지됐습니다.

같은 새 QA에서 native 저장구간과 cutoff slice/cell을 조작하고, cf98의512셀 원본 GitHub 페이지를 다시 열어320 exact-zero·192 missing·energy=null·τ=null·N7/N8 미종료를 직접 읽었습니다. 전체80개 기준과 data SHA는 변하지 않았고 가로 overflow는 관측되지 않았습니다. 이 후속 관찰에서 새 recovery runtime 오류0개, 기존 Three.js WebGL 불가 오류3개와 확장 metadata 오류가 기록됐습니다. 따라서 콘솔 전체가 깨끗하다고 보고하지 않습니다. 이전 Taylor–Green Worker 결과 원본을 보존했으며 후속 QA에서는 같은 입력의 계산을 다시 실행하지 않았습니다. 실제 mobile viewport·touch 및 원문 성능/메모리 인수는 여전히 미검수입니다. 이 제한된 게시 후 검사로 R1-05/R1-08의 전체 원 인수 상태를 승격하지 않습니다.

## 8. 해결되지 않은 의무와 정확한 다음 재개 지점

1. **XR와 전체 Xb의 source-bound 산술 연결.** 원 XR는 `110*(CSelected*Pstar)^10`입니다. 원 profile의13개 named arithmetic closure에 unknown ref가 없다는 읽기 진단까지 있습니다. 현재logradius 실행은319까지만이므로 XR→28825→28826 값을 새로 연결하고, log-radius 구간 전체를 exp로 전달해야 합니다. 작은 반복-log 폭으로 전체 Xb 상대오차를 보장하지 않아야 합니다.


2. **실제 외부 frame과 domain membership.** 원622802/622803/622804의 R/Z/T,622791의ell에 실제 같은 전역점·source invocation·lexical frame을 결속해야 합니다. 원ell≥ell0, coefficient window와 strict support를 평가하고, 경계 교차·부호 미분리는 OPEN으로 보존해야 합니다.


3. **정수 mesh와 대표 입력.** 원623855/623856/623857 ceiling 연결, 동일ell/box의 active 교집합,623914 negativeWidth 부호,623921/623934 대표 입력을 순서대로 실행해야 합니다. 임의 반올림으로 정수 결정을 확정하지 않습니다.


4. **동일 최종장의 finite prefix와 slow-base·원 적분.** stage1–4의 실제 활성 값·A/b/p와 필요한 미분, cutoff·force·pressure의 연결, 원sigma nested primitive229/249와 세 적분의 필요한 엄밀 정밀도·오차, slow-base coefficient tail을 계속 해결해야 합니다. 이미 확보한700/3,407 기록, scalar inverse, band transport와 Qp/Qb/wait/logradius 연결을 다시 전부 미해결로 돌리지 않습니다.


5. **N7-06와 N8-05의 실제 원 인수 실행.** 같은 whole-K 최종장에 대해 에너지·dissipation·force-work의 독립 공간/시간 오차 비교와ν1(10.13), 네 축 독립2배 및 별도 tails를 수행해야 합니다. 실제 완료 근거가 생긴 경우에만62/64를 변경할 수 있습니다.


6. **독립 가능한 M4와 제품 인수.** 현재 준비된 provenance·mutation·invalidation 계약을 실제 생산 graph·UI에 연결하고, 새 정확 Lean target/import의 실행을 해당 항목에 결속해야 합니다. 원16개의 mobile·성능·walkthrough·범위별 release 인수를 별도 확인해야 합니다.


7. **작업 보존·원격 저장·게시 마무리.** 소실 복구 뒤의 코드·이 보고서·실제 QA·새 명령 결과를 작은 checkpoint에 보존하고, 기존 cf98의 정확한 descendant로 두 번째 commit/tree/ref를 각각 확인해야 합니다. 그 정확 SHA의 CI를 별도로 결속해야 합니다. followup2 실제 운영 반영·공개 바이트·제한된 게시 후 브라우저 검수는7절 및 다음 절에 기록했고, 원 전체 mobile·성능/메모리 인수는 남아 있습니다. main 병합·강제 push·다른 저장소 전송·비밀정보 업로드·유료 변경·기존 자산 삭제 권한은 사용하지 않습니다.


## 9. 후속 실제 응답을 위한 예약 상태

아래에서 두 번째 GitHub 저장·CI는 PENDING으로 동결합니다. 실제 후속 commit/tree/ref 및 정확 SHA의 CI 영수증은 최종 checkpoint에 별도로 추가해야 합니다. website followup2는 실제 두 성공 응답·공개 HTTP 바이트·제한된 게시 후 QA 원본으로 확인된 필드만 채웠습니다. 요청 준비·예상 SHA·로컬 test를 실제 저장·게시 결과로 채우지 않습니다.

```json
{
  "second_save": {
    "status": "PENDING",
    "commit": null,
    "tree": null,
    "branch_ref_readback": null,
    "CI": null,
    "evidence": null
  },
  "website_followup_2": {
    "status": "PUBLISHED_PUBLIC_BYTES_VERIFIED_SCOPED_BROWSER_QA_RECORDED",
    "request_receipts": [
      "research-ide/mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_LAYOUT_PATCH_RESULT.json",
      "research-ide/mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_RUNTIME_PATCH_RESULT.json"
    ],
    "page_metadata_version": 118,
    "page_metadata_version_hash": "9a0eebc5",
    "fragment_versions": {
      "layout": {"version": 2, "version_hash": "460012fd"},
      "runtime": {"version": 2, "version_hash": "fa62da96"}
    },
    "public_http_status": 200,
    "public_bytes": 29173684,
    "public_sha256": "3436ed76a985ee554c889ebabddae758a09b5b385b12bc2908fd0d4f32c90135",
    "public_byte_receipt": "research-ide/mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_PUBLIC_BYTE_AUDIT.json",
    "post_publication_browser_receipt": "research-ide/mathscope-m4/recovery-ui-20261019/evidence/postpublication-followup-2/mathscope-followup2-browser-qa.json",
    "post_publication_browser_sha256": "6631bba485cabb566e64bd4461c4ac9568283cf9b00a897307a369d97c86bdfb",
    "actual_mobile_viewport": "UNVERIFIED",
    "actual_mobile_touch": "UNVERIFIED",
    "original_performance_memory_acceptance": "UNVERIFIED"
  },
  "M3": {
    "accepted_inherited": 62,
    "total": 64,
    "newly_closed": 0,
    "open": [
      "N7-06",
      "N8-05"
    ],
    "actual_global_last_resolved_tau": null
  },
  "M4_original16_acceptance": "UNCONFIRMED",
  "overall_completion": false
}
```

<!-- ROOT_FINAL_APPEND: 두 번째 실제 commit/tree/ref/CI는 최종 checkpoint의 별도 영수증으로 결속합니다. 이 보고서의 후속 website 게시·제한 검수 원본은 위 경로와 해시로 동결합니다. -->

## 10. 재구성에 사용한 핵심 파일의 해시


| 실제 파일 | 바이트 | SHA-256 |
| --- | --- | --- |
| [M3_CURRENT_ORIGINAL_LEDGER.json](M3_CURRENT_ORIGINAL_LEDGER.json) | 454759 | `b1c491d968f5aa3a91088f4e2a2cb931bea1a5ef94b5d16681da09bfd3b7be47` |
| [M4_ORIGINAL_ACCEPTANCE_MATRIX.json](../../mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json) | 88714 | `ef56f18cedfe50618800bbff6e41bed912171bf0df9b8596cc48bc85c401c68b` |
| [FINAL_ATTACHMENT_INTAKE_AUDIT.json](intake/FINAL_ATTACHMENT_INTAKE_AUDIT.json) | 5743 | `e3d8726d0598a6c269ac438793cb2ab6af373db73763915bf534c4e60b8e5e64` |
| [outer_cutoff.py](outer_cutoff.py) | 10628 | `535e1126c6450627bd61cf0e5a94c33938b12e71886a995175493dddfe6b8ced` |
| [slow_inverse_native.py](native/slow_inverse_native.py) | 11908 | `efb7f304a98820b0da7450b4acfe88d52f10e5bf82b1bde0564121dab5391609` |
| [band_caller.py](../caller-recovery-20261019/band_caller.py) | 7965 | `77f839095664636cdfd428e9b1c8338539c31c2213a77ba7661c94623d074503` |
| [bind_original_a13.mjs](../radial-recovery-20261019/bind_original_a13.mjs) | 9859 | `591b33d6882fe7cd00dd624b6df64cbbd0b9ee70954e45bc8b78bf09e51119ad` |
| [bind_logradius.mjs](../logradius-recovery-20261019/bind_logradius.mjs) | 14245 | `bfb9896adbe915a2eb37c3a829d4368d4d7fbf9b28bfd3bdb798b6405241c173` |
| [evidence-session.mjs](../../mathscope-m4/recovery-20261019/evidence-session.mjs) | 11267 | `61ff5f80e483eb9dbb45187d4fe39ae925e86f9cdacd43716b657ac2339fceac` |
| [inspect-evidence.mjs](../../mathscope-m4/recovery-20261019/inspect-evidence.mjs) | 5364 | `601086941fc28b08e613f6e108aee622fd87fe35008b3ea8a532576cf80fd6ca` |
| [ROOT_PAGE_ACTIVATION.json](../../mathscope-m4/recovery-ui-20261019/evidence/ROOT_PAGE_ACTIVATION.json) | 1520 | `62df99d737bdea78bb40ee119c42cbe12d6f02d296428fbf2315ed950a563bd6` |
| [V118_BROWSER_QA_BEFORE_FOLLOWUP.json](../../mathscope-m4/recovery-ui-20261019/evidence/V118_BROWSER_QA_BEFORE_FOLLOWUP.json) | 68663 | `0df800859b48b56c32123d8321b4f58b4a0f6cacc5adc7601ddd5b340d937a7f` |
| [V118_FLUID_REFERENCE_RESULT.json](../../mathscope-m4/recovery-ui-20261019/evidence/V118_FLUID_REFERENCE_RESULT.json) | 962023 | `f3e5badba07f21683f561b5e755e55f60a816fe07de432dc695d4e94992535df` |
| [FOLLOWUP2_LAYOUT_PATCH_RESULT.json](../../mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_LAYOUT_PATCH_RESULT.json) | 1599 | `25de3ab7dd168a26159d8894cb2769f13485d692253d74819d62ce3999a7d843` |
| [FOLLOWUP2_RUNTIME_PATCH_RESULT.json](../../mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_RUNTIME_PATCH_RESULT.json) | 1649 | `64452b19736e0334a63c45876b15c1239905e20a8a2efe8cd0d4f94c13460ca1` |
| [FOLLOWUP2_PUBLIC_BYTE_AUDIT.json](../../mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_PUBLIC_BYTE_AUDIT.json) | 1529 | `5a5e4fece4a6e9a91f83217a2c0e3f3ce218c65e446f26849eca575138c2ec6e` |
| [FOLLOWUP2_PAGE_INDEX_READBACK.json](../../mathscope-m4/recovery-ui-20261019/evidence/FOLLOWUP2_PAGE_INDEX_READBACK.json) | 2317 | `2c90c499b6f7803efd6bac9af741140370e24d04c4ea9f1268040350df0f8bc0` |
| [followup-2/execution.json](../../mathscope-m4/recovery-ui-20261019/evidence/followup-2/execution.json) | 4845 | `76402144ce4c2d8189952a7bd084ec397bbd5dd31389926eb9164e4b1a535a19` |
| [postpublication-followup-2/mathscope-followup2-browser-qa.json](../../mathscope-m4/recovery-ui-20261019/evidence/postpublication-followup-2/mathscope-followup2-browser-qa.json) | 48008 | `6631bba485cabb566e64bd4461c4ac9568283cf9b00a897307a369d97c86bdfb` |
| [postpublication-followup-2/ARTIFACT_MANIFEST.json](../../mathscope-m4/recovery-ui-20261019/evidence/postpublication-followup-2/ARTIFACT_MANIFEST.json) | 1985 | `7507c64a1ee27de32dd316f040e62103ae81eb774f23d1d12d4fc8fdb4e7cea0` |


보고서 작성은 원장·코드·저장 산출물·실행 영수증의 읽기와 위 해시 대조로 수행했습니다. 이미 성공한 동일 입력의 비싼 수학 계산을 재실행하지 않았습니다. 구현·검증·GitHub 저장·배포·브라우저 인수 중 남은 단계를 전체 완료로 묶지 않습니다.
