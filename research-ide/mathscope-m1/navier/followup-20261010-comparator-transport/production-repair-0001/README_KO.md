# 실제 보호 Comparator 전송 수정·게시 증거 보존

이 디렉터리는 **검토된 실제 수정본, 로컬 실행 로그, 독립 검토, Git 객체 게시와 후속 작업 시작**의 원시 증거를 보존한다. N1-06의 실제 최종 실행 결과는 포함하지 않는다. **`N106Completed=false`이며 기존 별도 판정 69 PASS / 1 PARTIAL / 0 BLOCKED를 유지한다.**

## 실제 보존 범위

| 원시 자료 | 기록된 결과와 연결 |
| --- | --- |
| [로컬 검증 영수증](raw/ns-guard-repair-20261010/protected-controller-local-0001/receipt.json), 원래 stdout/stderr, 10개 소스 스냅샷과 diff | 실제 로컬 테스트 12개, exit 0. 이 로컬 실행은 실제 보호 Comparator를 실행하지 않았다. |
| [독립 구현 검토](raw/ns-guard-repair-20261010/independent-production-review/reviewer-receipt-0001.json), 검토 스크립트·보고서와 모든 참조 입력 | 73/73 PASS. 검토자는 테스트·guard·Comparator를 재실행하지 않았다. 원래 `--pty`, AF_UNIX, Landlock와 원문/커널 보존 조건을 유지한 구현 검토다. |
| [workflow 문법 검증](raw/ns-guard-repair-20261010/production-workflow-syntax-001.json) | 실제 workflow와 4개 shell block의 문법 검증 성공. |
| [Git 객체 게시](raw/github-protected-transport-upload-20261010/receipts/object-publication.json)와 [main 게시](raw/github-protected-transport-upload-20261010/receipts/publication.json) | 검토된 5개 파일의 원문 바이트 → Git blob → 실제 게시 tree/commit을 결속했다. 2026-10-10 10:48:36 KST (원시 UTC `2026-10-10T01:48:36.227Z`)에 main 게시가 기록됐다. |
| [로컬 정렬 기록](raw/github-protected-transport-upload-20261010/receipts/local-alignment.json) | 로컬 `a2130ba9…`와 원격 `55dacb89…`의 tree가 동일하다. 최초 로컬 main 예상값 오류와 이후 조상이 확인된 fast-forward를 원시 영수증 그대로 보존했다. |
| [후속 실행 최초 관측](raw/ns-guard-repair-20261010/protected-run-0001/observation-002.json), [실제 run metadata](raw/ns-guard-repair-20261010/protected-run-0001/run-metadata-001.json) | run `38014602021` / job `114101981614`, 실제 commit `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`. 10:51:42 KST (UTC `2026-10-10T01:51:42.233Z`)에는 step 6 `in_progress`, conclusion null, artifact 없음. 이후 결과를 이 관측에 소급하지 않는다. |

새 전송 구현은 원래 내부 `--pty`와 AF_UNIX 보호 명령을 유지하며 바깥 터미널에서 stdout/stderr와 실제 EOF·종료를 관측한다. timeout 이후 cleanup의 exit 0을 성공으로 바꾸지 않는다. 위 실제 검토와 테스트의 범위는 구현 및 전송 처리에 한정되고, 실제 전체 Comparator의 성공은 별도 후속 artifact가 입증해야 한다.

원격 게시 commit은 `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`, tree는 `95a671fe81b64ed2303da01c4f6c887691fa8287`이다. Git 메타데이터 정렬 전에 로컬 commit이 `a2130ba975891e62dacba7572f137e704551341a`였다는 기록도 바꾸지 않았다. 로컬 main의 실제 이전 값은 `0056147e90bdd4fd4f575aa4df08aa5f937301fd`이고, 원격 main 이전 값 `c61d35806bb3579131eb7ff8c55187ae26209ade`와 서로 다르다. 해당 assertion 실패를 성공 기록으로 덮지 않고 원래 설명문을 그대로 보존했다.

## 경로·해시 재현

[source-mapping.json](source-mapping.json)은 원시 **30개 파일 / 254,339 bytes**와 검토 원본 alias 10개의 대응을 기록한다. 별도 동일 파일 복제를 요구하지 않고, 검토 영수증의 절대 경로 29개 모두를 이 디렉터리의 실제 스냅샷으로 해석할 수 있다. 요청한 자료와 연결된 업로드 payload·root-tree request, 진단 검토 영수증, 최초 실행 관측을 함께 보존했고 누락은 없다. 복사 시 원본과 대상의 실제 바이트 및 SHA-256을 대조했다.

[preservation-receipt.json](preservation-receipt.json)은 **252/252 `PRESERVATION_PASS`**다. 그중 기존 old-run 67개, diagnostic-run 49개, 부록 v2 8개, 합계 124개 동결 파일의 바이트·해시 불변을 포함한다. **252개는 보존 검사 수이며 수학 정리나 Comparator 통과 항목 수가 아니다.** 원래 로컬 테스트와 검토를 다시 실행하지 않았다.

```bash
python -B verify_preserved_production.py
```

이 명령은 현재 디렉터리의 보존 자료만 읽는 portable 검증이다. 기록된 원래 절대 경로가 없어도 동작한다. `--verify-frozen-inputs`는 원래 작업공간에 있을 때 기존 동결 파일 124개도 읽어 대조한다. 새 영수증을 남기려면 `--output`에 이 디렉터리 안의 **새** 파일명을 지정해야 하며 기존 증거는 덮어쓰지 않는다.

| 파일 | SHA-256 |
| --- | --- |
| source-mapping.json | `150f8d74887097c6f7e1e16ce038d890558f7c878d43beb920af45e556ed63cd` |
| preservation-receipt.json | `6bdd8620599c54efb9bb95704b125c135036fd232afdd2fef04dda56df1dc689` |
| verify_preserved_production.py | `23a8ef9966a409889d429dfa92c197a829ec5f606688a88420f1d9c4be2cf3cc` |

기존 실패·진단·수학 증거, 원래 70개 기준, 69/1 판정, 15쪽 PDF와 공개 `.3` 릴리스는 변경하지 않았다. 보고서의 새 실제 결과 schema 연결은 [V2_COMPATIBILITY_READONLY.md](V2_COMPATIBILITY_READONLY.md)에 정리했다. 이 보존 작업에서는 commit·게시·새 Comparator·PDF 생성을 수행하지 않았다.
