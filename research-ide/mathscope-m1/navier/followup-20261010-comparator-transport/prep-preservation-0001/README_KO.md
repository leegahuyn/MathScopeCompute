# 판정 준비 기록의 원시 바이트 보존 — 0001

이 묶음은 패키지 ZIP 선택 코드의 좁은 검토, 실제 취소 입력을 거부한 판정 도구 실행, 판정 도구의 독립 소스 검토를 보존합니다. **N1-06 완료를 판정하지 않으며 `N106Completed: false`와 기존 69 PASS / 1 PARTIAL / 0 BLOCKED 판정을 유지합니다.**

보존 검증 시각은 **2026-10-10 11:32:57 KST**입니다. 원시 감사 시각은 `2026-10-10T02:32:57.851829+00:00`입니다. 본 실행의 기록된 대상은 commit `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`, run `38014602021`, job `114101981614`입니다. 이 보존 작업은 해당 실행의 최종 결과를 추가하지 않습니다.

## 보존한 원본과 각 결과의 범위

| 원시 디렉터리 | 파일 / 바이트 | 원래 결과와 의미 |
| --- | ---: | --- |
| [package-archive-review](raw/package-archive-review/) | 10 / 66,837 | 37/37. 고정 바이트·SHA의 원본 CI ZIP 두 개만 패키지에 포함하는 선택 코드 검토. 전체 릴리스 검증·패키지 생성은 수행하지 않았습니다. |
| [terminal-assessment-local-0001](raw/terminal-assessment-local-0001/) | 4 / 60,351 | 5/5 `PREPARATION_PASS`. 실제로 취소된 과거 실행의 감사 입력을 판정 도구가 **exit 1**로 거부했습니다. |
| [terminal-assessment-review-0001](raw/terminal-assessment-review-0001/) | 18 / 521,720 | 468/468 `PASS_SOURCE_REVIEW_ONLY`. 고정된 판정 도구의 소스와 실제 거부 기록을 검토한 결과입니다. 새 Comparator·Lean·판정 도구 실행은 없습니다. |

원본 **32개 파일, 648,908바이트**를 모두 변경 없이 복사했습니다. [보존 receipt](preservation-receipt.json)의 **480/480 `PRESERVATION_PASS`**는 파일·해시·기록 연결 검증의 결과입니다. 수학 정리나 본 실행 성공 횟수로 합산하지 않습니다.

판정 도구의 고정 SHA-256은 `d471135f614fb3ec9d18020c7744433eb4646ad7793ba720a7f127fe9eceb314`입니다. 실제 거부 로그에는 `Actual terminal artifact audit did not pass`가 남아 있고 표준 출력은 비어 있습니다. 명령에 기록됐던 `PENDING_ACTUAL_INDEPENDENT_REVIEW.json`과 `MUST_NOT_EXIST.json`은 당시 존재하지 않았으며, 이 보존 작업도 생성하지 않았습니다.

## 경로와 과거 바이트의 연결

[source-mapping.json](source-mapping.json)은 원래 절대 경로를 그대로 기록하고, 저장소 내부의 정확한 바이트 버전으로 연결하는 상대 경로를 별도로 제공합니다. **201개 참조를 저장소에서 재검증할 수 있습니다.** 동일 경로의 파일이 나중에 바뀐 경우에는 경로와 SHA를 함께 사용해 당시 캡처된 바이트를 선택합니다.

과거 N1 README는 원래 판정이 참조했던 Git 객체와 같은 **5,543바이트**로 연결합니다. 이후의 README나 과거 판정 문서는 수정하지 않습니다. 패키지 검토에 기록된 manifest 상태 역시 검토 당시의 기록이며, 이후 생성된 manifest에 과거 상태를 다시 요구하지 않습니다.

사용자가 제공한 PDF **3개**는 원래 경로·크기·SHA 참조만 유지합니다. 참조의 중복 출현은 8개이며, PDF 본문은 이 디렉터리에 복사하거나 공개하지 않았습니다. 기본 보존 검증기는 해당 외부 PDF를 읽지 않습니다.

## 재검증

전체 `research-ide` 저장소에서 이 디렉터리로 이동한 뒤 실행합니다.

```bash
python -B verify_preserved_preparation.py
```

새 보존 receipt가 필요하면 아직 존재하지 않는 파일명만 지정합니다.

```bash
python -B verify_preserved_preparation.py --output preservation-receipt-recheck-0001.json
```

검증기는 복사된 원시 바이트, 정확한 저장소 참조, 기존 결과의 범위를 확인합니다. 원래 검토기·판정 도구·Comparator·Lean·패키지 생성기를 재실행하지 않습니다. 외부 scratch 경로는 원래 실행 기록의 일부로 보존되며, 내부 참조 검증에는 저장소 상대 경로를 사용합니다.

새 최종 판정과 최종 PDF는 생성하지 않았습니다. 원래 70개 기준, 과거 68/2 및 69/1 판정, 기존 15쪽 PDF, 공개된 `.3` 릴리스는 이 보존 작업으로 변경되지 않습니다.
