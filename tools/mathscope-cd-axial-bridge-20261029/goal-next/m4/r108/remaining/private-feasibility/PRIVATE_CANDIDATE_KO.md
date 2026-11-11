# R1-08 소유자 전용 후보 게시 경로

2026-11-11 UTC 읽기 전용 조회에서 연결된 Sites의 소유 프로젝트 수와
소유·편집 가능 프로젝트 수가 각각 0이었다. 두 조회에 다음 페이지가 없었다.
기존 운영 프로젝트 밖에서 바로 사용할 수 있는 후보 목적지는 확인되지 않았다.
Sites의 새 소유자 전용 프로젝트는 이 계정에서 사용할 수 있는 별도 게시 경로다.
별도 프로젝트 생성, 소스 업로드, 게시, 접근 설정 변경은 이번 조회에서 수행하지 않았다.

## 최소 게시 패키지

1. 사용자가 별도 Sites 프로젝트에 후보를 올릴 범위를 확정하면 그 프로젝트
   전용 작업 디렉터리와 Sites 관리 원격 소스를 사용한다. 이 프로젝트에만
   `create_site`를 한 번 호출하고 발급된 `project_id`를 `.openai/hosting.json`에
   저장한다. 작업 브랜치는 Sites 전용 원격의 반환 브랜치를 사용한다.
   WebsitePublisher 프로젝트 29770과 `leegahuyn/MathScopeCompute`의 운영 소스는
   게시 대상에 포함하지 않는다.
2. 후보 입력은 `work/goal-next/r107/built/candidate.html` 28,928,002바이트,
   SHA-256 `0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735`다.
   정적 Sites는 `static.directory=dist`와 `dist/index.html`을 지원한다.
   문서상 Sites 서버 실행 환경인 Cloudflare Workers의 정적 파일 한도는
   25 MiB다. 해당 한도가 Sites 정적 경로에도 적용되는지는 이 계정에서
   확인되지 않았으므로, 원본 HTML 바이트를 그대로 응답하는 ESM Worker를
   로컬에서 검증했다. [Cloudflare 파일 한도](https://developers.cloudflare.com/workers/platform/limits/)
3. Worker 방식의 tar에는 실제 발급된 ID가 들어간 `.openai/hosting.json`과
   `dist/server/index.js`를 넣는다. 매니페스트에 `static`을 넣지 않는다.
   `verify_exact_worker_transport.py`의 `render_worker`는 후보를 gzip으로
   저장하고 요청 때 압축을 풀어 원본 HTML을 반환한다. 로컬 테스트는 `/`와
   `/v0.3.1.html`의 응답 길이와 해시가 원본과 같은지 확인했다. 이 로컬
   Worker는 9,206,797바이트다. 원본에 포함된 WebsitePublisher CDN의 네
   스크립트와 세 스타일시트, 기존 외부 연결을 응답 CSP로 제한했다. 이 정책을
   사용한 로컬 Chromium에서 원문 정리 화면, M1 `su2`, M2 `point`를 확인했고
   두 작업 모두 `COMPLETED`였다. 외부 HTTP 요청 시도와 브라우저 스크립트
   오류는 각각 0건이었다. 실제 Sites 빌드/시작 제한과 동일 호스트 응답 정책은
   게시 후 확인이 필요하다. [Worker gzip 스트림](https://developers.cloudflare.com/workers/runtime-apis/web-standards/#compression-streams)
4. 후보, 생성기, 검증 기록을 새 Sites 원격 소스의 커밋과 연결한다. Sites
   소스 도우미가 반환한 전체 `commit_sha`, 실제 `project_id`, 절대 tar 경로를
   `save_version_and_deploy_private`에 전달한다. 따로 저장하는 경우에는
   `save_site_version`이 반환한 `version_id`로 `deploy_private_site_version`을
   실행한다. 완료 응답의 `status=succeeded`, 반환된 게시 URL 및 그 버전의
   소유자 전용 정책을 읽는다. 게시 상태가 `pending`, `building`, `publishing`이면
   동일 `deployment_id`를 조회한다. 생성 도구에서 미리 주는 `expected_url`에는
   게시 완료 증거를 부여하지 않는다.
5. 게시 후 실제 URL을 소유자 인증 브라우저에서 열어 화면을 검증한다. 브라우저
   요청 가로채기와 로컬 후보 파일은 이 단계에서 사용하지 않는다. 별도 미인증
   세션에서 후보 HTML에 접근할 수 없는지 확인한다. 게시 전후 운영 버전과
   원본 HTTP 해시를 다시 읽어 운영 프로젝트 보존을 기록한다. 출처가 다른
   서비스 호출이나 브라우저 Worker 제한으로 기존 기능이 실패하면 해당 검증은
   OPEN으로 기록한다.

## 독립 검토에 필요한 R1-08 증거

| 원래 검사 | 기록할 필드 |
| --- | --- |
| `DECLARED_CAPABILITIES_SCOPE` | 설계도 68쪽, 기준 ID, 정확한 후보 소스 커밋과 HTML SHA-256/바이트 수, 지원하는 fixture ID·kind·engine·claim ID, 대응하는 정리 ID와 조건, 실행 결과·입력·Worker SHA-256. 지원 범위의 원본은 기존 `current-patch-readback.json`의 `scopedFixtures`와 `formalClaims`다. |
| `MODULE_STATUS_GLOBAL_HOLD_DISTINCTION` | 게시 화면에서 실제 관찰한 모듈별 상태와 검토 시점의 독립 상태 자료. M3 62/64, 열린 N7-06·N8-05, 게시 전 M4 15/16, 열린 R1-08, 최종 jet 0/67, 전체 `RELEASE HOLD`, `canFreeze=false`. 별도 후보의 게시 사실을 전체 판정과 구분한다. |
| `PATCH_TEST_ROLLBACK` | 적용한 4개 패치 SHA-256, 순방향 후보와 역방향 기준본 SHA-256, 원래 Worker 브리지 SHA-256, 재실행 명령 및 테스트 로그·화면 해시, 별도 Sites용 롤백 대상/재게시 절차. 운영 137/`9171eb0c` 및 HTTP 원본 SHA-256의 게시 전후 대조. |
| `ACTUAL_POST_PUBLICATION_SCREEN_RECEIPT` | Sites `project_id`, saved `version_id`, `deployment_id`, `provider_deployment_id`(반환 시), `status`, `publication_stage`(반환 시), 성공 시간과 최종 URL, 게시 소스 `commit_sha`, tar 해시/바이트 수, owner-private 정책 및 미인증 차단 확인, 실제 HTTP 응답 상태/Content-Type/바이트 수/SHA-256, 소유자 인증 브라우저 종류·화면 크기·시각·URL·동작·스크린샷 해시. 실제 화면에 나타난 지원 기능, 결과 해시, 모듈 상태, HOLD와 네트워크/브라우저 오류를 기록한다. |

인증 쿠키, 쓰기 토큰, 인증 우회 헤더는 증거에 보존하지 않는다. HTML 전체는
평가기의 개별 파일 제한 16 MiB보다 크다. 평가기용
`mathscope.m4.criterion-evidence/1`에 `criterionId=R1-08`, 원래 증거 소스의
`sourceCommit`, 고유 상대 경로와 SHA-256을 가진 `artifacts`를 기록한다. 게시
영수증의 Sites `commit_sha`는 별도 필드다. 영수증, 해시 기록, 화면 캡처,
실행 기록의 각 파일을 16 MiB 이내로 유지하고, 독립 검토 후 원래 평가기의
reviewed criterion digest에 결속한다. 현재 원래 평가기에는 R1-08 검토 digest가
없고 M3 완료도 승인되지 않았다.

## 재현

작업공간에서 `python work/goal-next/r108-private-feasibility/verify_exact_worker_transport.py work/goal-next/r107/built/candidate.html`을 실행한다.
Node.js에서 응답 바이트와 SHA-256을 검증하며 임시 Worker를 정리한다.
Playwright가 설치된 경로와 Chrome 실행 경로를 `MATHSCOPE_PLAYWRIGHT_PATH`,
`MATHSCOPE_CHROME_PATH`에 설정하고 `--browser-check`를 추가하면 실제 로컬
HTTP 응답으로 브라우저 검증도 실행한다. 실행 결과는
`local-transport-receipt.json`에 있다. `R1-08`의 실제 게시 화면 증거는 OPEN이다.
