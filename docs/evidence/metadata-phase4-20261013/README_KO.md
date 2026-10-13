# Phase 4 메타데이터와 Worker 후보 검증

기준 Git checkpoint는 `486b6e19e0ad85142a31a84ffdfee0d02fc35cb3`이다. 이 폴더의 기록은 소스 바이트·릴리스 목록·기존 Worker 실행을 검증하며 수학 기준을 승격하지 않는다. 공개 v103에 새 Worker를 배포했다는 기록도 아니다.

## 구현 핀과 불변 자료

`pin-update/`는 이전 115행 구현 핀을 보존하고 현재 118개 루트 Navier 모듈 중 핀 자체를 제외한 117행으로 재생성한 기록이다. 현재 핀 집계 SHA-256은 `af3b228423340a1711fc1a6729b88912063b22e8c9067b767ffef5e0fc1ebdd1`, 핀 파일 SHA-256은 `d9de0c6360de87d32b0fbef7b0b1eb0efb7bb61844bc16dcdc7a800fbb0ba7e9`이다. 원래 155개 saved-source 캡처, source-inheritance, M2 최종·공통 물리 패키지·full-jet 영수증의 원본 바이트는 모두 일치했다. 핀은 원래 155개 캡처에 포함되지 않는다.

`focused88-preservation.json`은 이전 CI 38369365001의 ZIP·index·raw 40개 파일을 바이트 변경 없이 연구 증거 폴더로 복사한 기록이다. 원래 ZIP은 2,234,333바이트, SHA-256 `e200bcd0a712f4bfa9d217fd0955ded1b6616d869e7010558dc684d1222be22c`다. 기존 English verifier는 ZIP을 별도 배포 아카이브로 제외한다. 이 제외 규칙은 변경하지 않았고 ZIP의 바이트 결속은 복사 영수증과 원래 archive index에 남긴다.

## Linux 생성과 독립 재생

Linux 생성자의 실제 명령·환경·성공·로그는 `linux-generated-assets/` 아래의 별도 root 작성 영수증에 있다. 독립 검증은 후보의 785개 소스 결속 행, 117행 핀, 이전 원본 캡처, M2 영수증, Linux 명령 로그의 SHA를 다시 읽었다. 이전 후보와 바뀐 sourceBinding 행은 구현 핀과 생성자의 브랜치 이름 한 곳뿐이다. 생성자 바이트는 기존 코드의 `'branch':'mathscope-m3-continuation55-20261012'`를 `'branch':'mathscope-m3-resume-20261013'`로 치환한 값과 정확히 같았다. 48개 수학 기준, 예제, 계산 환경은 이전 값과 같다.

- engine 후보: 12,261,640바이트, SHA-256 `0102abd3a05a5f756f126f0c6972b9fbf7f916043171c91722394bf9b4198205`
- build data 후보: 344,699바이트, SHA-256 `5f95dce24158487843eb19cf5459a4b3de002823279b21b946fdf8764ebb5223`
- source manifest: `192762b641188525167acb2c827d6933e66e7274a72b93e03508425b163e72a9`

`worker-replay/attempt-20261013T115121973146Z`는 첫 독립 검사 실패를 보존한다. 구현 핀 한 행만 변경된다는 검사 기대가 브랜치 이름을 바꾼 생성자 행을 거부했다. 당시 Worker 테스트는 시작하지 않았으며, 827개 검사 대상 파일은 안정적이었다. 실패 raw 로그와 당시 검사 코드 스냅샷은 수정하지 않았다.

정확한 브랜치 치환을 별도로 검토한 뒤 `worker-replay/attempt-20261013T115238846487Z`에서 독립 검증과 변경하지 않은 `extended-worker.test.mjs` 11개가 모두 exit 0으로 통과했다. Worker 실행 시간은 26.078초, skip/fail/cancelled/todo는 0이며 827개 소스·자산·테스트 파일의 실행 전후 바이트와 구성은 같았다. 실제 Worker 계산/재생, 자기 일관적 위조 digest의 fresh recomputation 거부, source/authority 변경 거부, 선택점 재계산, 취소, 표시 계약과 원본 링크 검사 등이 포함된다. 이것은 기존 finite Worker 계약의 검증이며 새 Lean 증명이나 미해결 수학 도메인의 증명이 아니다.

`portable-asset-check/`는 독립 검사 코드의 기존 자료 조회를 관찰 당시의 고정 Git checkpoint로 결속해 다음 commit 이후에도 실행할 수 있게 한 추가 재생이다. 기록된 이전 검사·Worker 영수증은 그대로 보존했다. 새 검사는 exit 0, 결과 stdout SHA가 앞선 성공 검사와 같다. 다음 명령은 저장소 루트에서 실행한다.

```
node docs/evidence/metadata-phase4-20261013/check-generated-assets.mjs
```

## English 릴리스 목록

`english-manifest/attempt-20261013T115411517593Z`에는 이전 목록, 작성 전 예상 목록, 182개 추가와 10개 변경의 정확한 review, generator/read-only 재생과 공격 검사 raw 로그를 보존했다. 이전 9,835개 목록 항목은 모두 남았고 이전 별도 addon 1,528개는 바이트와 구성이 그대로다. 새 목록은 10,017개이며 원래 693개 파일과 50개 소스 핀도 검증했다.

현재 `research-ide/SOURCE_TRANSLATION_MANIFEST.json` SHA-256은 `ea63602094824ac6badaf5a3d89a2ecf34032168268e6967b8ad608b61da8117`이다. 작성 후 읽기 전용 재생은 같은 결과였고, Git-visible/standalone 목록 공격 검사 6개와 addon 경계 검사 4개, 현재 핀/원래 캡처 재검사, 후보 자산 재검사, 선택 파일 `git diff --check`가 모두 통과했다. 새/변경한 실행 코드의 LF를 확인했으며 원본 실패 증거의 줄바꿈은 변경하지 않았다.

M3는 여전히 원문 56/64이다. 초기 class, analytic domain/전역 존재, all-order/tail, N6-01/02/07/08, N7-04/05/06, N8-05, M4 최종 인수의 미충족 범위는 이 메타데이터 검증으로 닫히지 않는다.
