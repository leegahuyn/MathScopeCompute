# 원래 보호 Comparator 실행: 취소 결과와 재개 기록

**N1-06은 미완료(PARTIAL)입니다.** 보호 실행 `37979127351`, Comparator job `113984853927`의 최종 GitHub 결론은 `cancelled`입니다. 본 묶음은 실제 실패·미실행 증거를 보존합니다. 원래 70개 기준, 기존 **69 PASS / 1 PARTIAL / 0 BLOCKED** 판정, 기존 15쪽 PDF와 영문 보고서는 바꾸지 않았습니다. 전체 9개 및 70개 조건의 완료 플래그는 계속 `false`입니다.

최종 관측 시점은 **2026-10-10 10:09:15.456 KST** (원시 UTC `2026-10-10T01:09:15.456Z`)입니다. 이 보존 감사는 **10:19:44.538 KST** (UTC `2026-10-10T01:19:44.538179+00:00`)에 완료했습니다. 실제 관측·기록의 원문 바이트와 시각은 아래 `raw/`에 그대로 있습니다.

## 실제로 어디까지 실행되었는가

| 지점 | 보존된 실제 결과 |
| --- | --- |
| 환경·의존성 준비 | controller의 30개 stage 중 앞선 29개가 종료 코드 0으로 완료됨. Comparator 도구, nanoda 실행 파일을 **빌드한 것**은 제출 해의 수용 검사를 실행한 것과 구별함. |
| 마지막 시작 stage | `guard-preflight`, **10월 10일 04:20:20.282990 KST** (UTC `2026-10-09T19:20:20.282990+00:00`). |
| 마지막 stage 출력 | systemd unit 시작 줄과 TTY 연결 안내 줄, 총 131바이트. 이 stage의 종료 코드와 완료 시각은 없음. |
| 실제 취소 메시지 | **10월 10일 10:07:03.240601 KST** (원시 UTC `2026-10-10T01:07:03.2406010Z`). 시작 기록에서 취소 메시지까지 **20,802.957611초 = 5시간 46분 42.957611초**. 이는 두 기록 사이의 경과 시간이며 자식 프로세스의 측정된 종료 시간이 아님. |
| 후속 검증 | `landlock-preflight`, `protected-comparator`, `submitted-type-and-axiom-audit`, `source-status-after`가 실행 stage 목록에 없음. |
| 최종 수용·보존 | nanoda/Lean의 제출 해 수용 결과, 두 제출 정리의 type/axiom 감사, `source-hashes-after.json`이 없음. controller의 마지막 저장 상태는 `RUNNING`, 종료 코드는 `null`. |
| 실패 증거 수집 | GitHub의 증거 수집 단계와 artifact 업로드 단계는 성공. ZIP 34개 파일을 실제로 확보함. |

근거는 [실제 controller 결과](raw/final-artifact-0001/extracted/result.json), [마지막 preflight 로그](raw/final-artifact-0001/extracted/guard-preflight.log), [전체 job 로그](raw/final-artifact-0001/job-113984853927.log), [최종 API 관측](raw/github-observation-025.json)입니다. 원래 [휴대 가능한 Comparator 감사](raw/final-artifact-0001/comparator-portable-audit.json)는 **138/163**, 상태 `FAIL_OR_INCOMPLETE`, `N106Completed=false`입니다. 25개 미충족 검사는 기록 부재·미완료를 포함합니다. 이것을 25개의 정리 반례, 실제 원문 변경 또는 nanoda의 거절로 해석해서는 안 됩니다.

기록된 첫 preflight 명령은 원래 `systemd-run --user --pty --wait --collect --property=RestrictAddressFamilies=~AF_UNIX`와 `probe.py unix-socket`을 사용합니다. 실제 AF_UNIX 차단 성공 메시지는 없습니다. 이 로그만으로 TTY/systemd/probe 중 어느 내부 원인이 정체를 일으켰는지 확정할 수 없습니다. 과거의 마지막 Git 상태 검사 경고 문제와도 다른 중단 지점입니다.

## 보존 범위와 독립 대조

[경로 매핑](source-mapping.json)은 원본 scratch 절대 경로, 원본 상대 경로, 저장소 내 상대 경로, 크기, SHA-256을 각각 기록합니다. **62개 파일, 790,215바이트**를 `raw/` 아래에 원래 상대 계층과 바이트 그대로 복사했습니다.

| 저장 위치 | 내용 |
| --- | --- |
| `raw/final-artifact-0001/` | 원래 수신 receipt, Comparator 감사, 전체 job 로그와 API 응답, 원래 ZIP, ZIP에서 추출한 34개 파일 모두 |
| `raw/github-observation-016.json` … `025.json` | 공개 후 보존한 실제 관측 시계열 |
| `raw/root-observation-001.json`, `raw/root-run-metadata-001.json` | 당시 원시 관측과 실행 메타데이터 |
| `raw/stage-analysis-001/` | 최종 취소 전에 작성된 분석 및 원래 controller/probe/workflow/configuration 입력. 그 시점의 문서를 그대로 보존하며, 최종 실행 결과는 위 artifact와 관측 025를 우선함. |

원래 ZIP **135,397바이트**를 재압축 없이 보존했습니다. 같은 ZIP의 base64 사본만 중복 저장하지 않았고, 생략한 사본의 크기·SHA 및 디코딩 바이트의 완전한 일치를 매핑에 기록했습니다. 원래 receipt에 남아 있는 base64 경로는 의도적 생략 기록으로 해석할 수 있습니다.

[독립 보존 감사](preservation-receipt.json)는 **252/252 `PRESERVATION_PASS`**입니다. 원본→복사 파일 대조, ZIP 34개 member→추출 바이트 대조, 기존 receipt의 모든 해시, API 응답→전체 job 로그 대조, 원래 취소 결과와 미완료 상태를 별도 reader로 검사했습니다. 기존 기준·판정·영문·감사기 입력 10개 파일과 기존 PDF의 불변도 확인했습니다. **252는 보존 검사의 수이며, N1-06의 163개 수용 검사나 수학 정리 수에 합산하지 않습니다.**

| 파일 | SHA-256 |
| --- | --- |
| 원래 artifact ZIP | `1af31713f8f021605af509bab4634fed7ab041636f6f1670be2bd3e3c61788d2` |
| 실제 수신 receipt | `1bfa73d215a287183fc554c0d1a965ed2955b08eabe8475b0f737b8920e28715` |
| 원래 Comparator 감사 | `d63ee66217a2b4dea4a81c7b91cb7e762ac7c2b52c48828960c4fca3cbfbbbbe` |
| 최종 관측 025 | `e93a2f3205c12b2aa4a200724f7ca1d2d6119d1ed34354270b062303f1442fa3` |
| 경로 매핑 | `be8fdbe37d5c26117c2f0d348f6d356d87a4be3bf1a8e967eaff1a8fc8730a2e` |
| 독립 보존 감사 | `4feddf1cbbda6b42b56123783fb73432d6d191227d3e498ed6a213f6ff6c0166` |

보존 바이트를 다시 검사하려면 이 디렉터리에서 다음 명령을 실행합니다. 원래 scratch가 없어도 실행되며 새 파일을 쓰지 않습니다.

```sh
python verify_preserved_evidence.py
```

원본 scratch까지 독립 대조하려면 다음 옵션을 더합니다. 기존 receipt를 덮어쓰지 않습니다.

```sh
python verify_preserved_evidence.py \
  --source-root /workspace/scratch/9a6c38c54c2e/tmp/n106-live-after-freeze
```

## 정확한 재개 지점

원래 N1-06 수용 문구는 “실제 제출 정리의 #print axioms와 Comparator 결과를 저장한다. challenge의 의도된 sorry placeholder와 proof root 의존성을 혼동하지 않는다.”입니다. 사용자에게 남아 있던 조건은 **원문 보호 조건을 유지한 독립 Comparator 실행**입니다. 기존 [69/1 판정](../../followup-20261010-final-stress-audit/ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_3.json)은 이 실행의 최종 결과만으로 승격되지 않습니다.

재개 작업은 첫 preflight의 외부 TTY 전달과 systemd 사용자 세션 동작을 진단하고, 원래 `--pty`, AF_UNIX 제한, 비특권 사용자, Landlock, 원문·커널·의존성 pin을 유지한 채 새 실행 증거를 별도 시도에 기록해야 합니다. 원래 Comparator 및 nanoda/Lean 수용, 실제 제출 정리의 type/axiom 감사, 최종 원문 보존 검사가 모두 기록된 새 artifact를 기준으로 다시 판정합니다. 이번 보존 작업은 그러한 새 실행을 수행하거나 그 성공을 주장하지 않습니다.

관측 025에서 corrected run `37992645347`의 두 job `114093554886` / `114093555036`은 이미 `in_progress`였습니다. 이것은 **그 관측 시각의 상태**이며, 성공 증거가 아닙니다. 이후 진단과 실행 결과는 새 경로와 새 receipt에 추가합니다. 이 묶음은 향후 `.4` 후속 증거를 위해 작성했으며, 이미 공개된 `.3` ZIP에 포함되어 있다고 주장하지 않습니다. 기존 15쪽 PDF의 수정이나 최종 합본 PDF 생성은 수행하지 않았습니다.
