# 원래 보호 명령의 외부 PTY 진단: 실제 증거 보존

**진단은 성공했고, N1-06은 계속 미완료입니다.** 실제 진단 run `38013278865`, job `114097893399`는 `completed/success`입니다. 실행 commit은 `d0543504ab3d923490f2e3cf94c968f3739558d8`입니다. 최종 API 관측은 **2026-10-10 10:32:34.295 KST** (원시 UTC `2026-10-10T01:32:34.295Z`)에 확보했습니다. [관측 원문](raw/remote-diagnostic-0001/observation-004.json)과 [진단 결과](raw/remote-diagnostic-0001/extracted/result.json)를 보존했습니다.

## 확인된 현상과 해석의 범위

원래 `systemd-run --user --pty --wait --collect --property=RestrictAddressFamilies=~AF_UNIX` 및 원래 negative probe를 유지하고, 바깥쪽 입출력 전달만 PIPE와 실제 outer PTY로 비교했습니다.

| 실제 case | client timeout | 정리 전 client exit | 실제 probe 결과 |
| --- | --- | --- | --- |
| `af-pipe` | 25.0174초 후 발생 | 기록 없음 | JSON 출력 없음 |
| `af-outer-pty` | 없음; 약 0.0544초 | 0 | AF_UNIX 생성 차단, errno 97, uid 1002 |
| `landlock-pipe` | 25.0177초 후 발생 | 기록 없음 | JSON 출력 없음 |
| `landlock-outer-pty` | 없음; 약 0.0531초 | 0 | 허용 경로 밖 쓰기 차단, errno 13, uid 1002 |

추가 metadata case도 정상 종료했고 실제 fd 0/1/2의 TTY, uid/euid 1002, effective capabilities 0, `NoNewPrivileges=1` 및 원래 probe SHA를 기록했습니다. 두 PIPE case에서는 정리 전에 서비스가 이미 `inactive/dead`, `ExecMainStatus=0`인데 client 완료와 probe JSON 전달이 지연되었습니다. **이 재현에서는 client의 전달·완료 경로가 정체되었고 outer PTY가 이를 해결했다는 근거**입니다. 과거 취소 실행 내부의 unit 상태가 정확히 같았다고 소급하거나 특정 systemd 내부 함수가 원인이라고 단정하지 않습니다.

[주 감사](raw/remote-diagnostic-0001/actual-diagnostic-audit.json)는 **136/136 `DIAGNOSTIC_EVIDENCE_PASS`**, [별도 독립 검토](raw/independent-remote-review/reviewer-receipt-0001.json)는 **135/135 PASS**입니다. **둘 모두 `N106Completed=false`**입니다. 이 진단에서 원래 Comparator 본체, nanoda 제출 해 수용, Lean 제출 해 수용을 실행한 것은 아닙니다. 전체 수용 검사는 후속 실제 보호 실행과 별도 artifact로 판정해야 합니다.

## 보존 범위

| 경로 | 내용 |
| --- | --- |
| `raw/remote-diagnostic-0001/` | 원본 디렉터리 37개 파일 전체: ZIP과 25개 추출 파일, 관측 4개, 두 job 로그, API 응답, 다운로드·newline receipt, 주 감사·감사기 |
| `raw/independent-remote-review/` | 독립 검토 receipt와 원래 verifier, 총 2개 파일 |
| `raw/reviewer-source-inputs/` | 독립 검토가 repo 절대 경로로 참조한 probe/pins/diagnose/transport/metadata_probe 5개 파일의 동일 바이트 snapshot |

총 **44개 원시 파일, 435,692바이트**, 생략 파일 0개입니다. [경로 매핑](source-mapping.json)은 원본 절대 경로와 저장 경로·크기·SHA를 대응시키며, 독립 검토의 38개 입력 참조를 모두 해석할 수 있습니다. 주 감사기는 상대 경로를 사용합니다. 독립 검토기의 원래 절대 repo 경로는 원문대로 보존했으며, 보존한 별도 source snapshot이 해당 바이트를 제공합니다.

canonical job 로그는 [job-114097893399.raw.log](raw/remote-diagnostic-0001/job-114097893399.raw.log), **28,233바이트**로 실제 API content와 정확히 일치합니다. 초기 표시용 `.log`는 끝에 newline 1바이트가 더 있는 **28,234바이트**입니다. 두 파일과 [차이 receipt](raw/remote-diagnostic-0001/job-log-byte-receipt.json)를 모두 그대로 보존했습니다.

[보존 감사](preservation-receipt.json)는 **222/222 `PRESERVATION_PASS`**입니다. ZIP 25개 member, 복사된 입력과 두 기존 감사의 해시, 로그의 1바이트 차이를 한 차례 대조했습니다. 기존 136/135 진단 검사는 재실행하지 않았으며, 기존 old-run-0001의 67개 파일도 변경하지 않았습니다. 이 222개 보존 검사를 수학 정리나 N1-06 수용 검사 수에 합산하지 않습니다.

| 항목 | SHA-256 |
| --- | --- |
| 실제 원래 ZIP, 44,015바이트 | `b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba` |
| 주 감사 136/136 | `ee855668fcd77dbe4d2304454a743f8cb3732872437729eafbf8779a6b60f0f7` |
| 독립 검토 135/135 | `fafd7b37117fdf81fda6bdf6e9ce4b7328ea50bd998306775ccba4fd8c058cad` |
| 보존 감사 222/222 | `ede01828c9bb040e49268b72869f5bbdb1b34eef4add21d27426db2d2579debe` |

현재 원래 기준 판정은 **69 PASS / 1 PARTIAL / 0 BLOCKED**, 전체 완료는 `false`입니다. 기존 판정·원문·PDF를 수정하거나, 새 보호 본실행·새 PDF·게시를 수행하지 않았습니다. 필요하면 이 디렉터리에서 `python -B verify_preserved_diagnostic.py`로 보존 바이트만 다시 검사할 수 있습니다.
