# M3 재개 실행 체크포인트 — 2026-10-13

## 판정

M3 원문 판정은 **56/64 유지**다. N6-01/02, N6-07/08, N7-04/05/06, N8-05는 아직 열려 있다. M4 I3/R1 인수, 최종 freeze, 전체 NS/RH/BSD/양자 YM 완료를 선언하지 않는다.

작업 브랜치는 `mathscope-m3-resume-20261013`이며 마지막 실제 테스트 코드 SHA는 `5c53589f8dbf5b307dcbf9b041d112a402d9de94`다. 이 문서를 담는 커밋은 문서 전용 후속 커밋이다. 시작점 `c45cb5ea9fe822fe05b40665d5d1974feb4bc99e`에서 reset/force-push 없이 이어졌다.

코드 커밋은 `200f7e9d` → `e83043ba` → `2ead995c` → `5c53589f`다. 변경은 focused workflow 1개와 새 독립 검사 모듈/테스트 2개뿐이다. 기존 saved-five norm 코드, required test, 원문 진행표, 과거 2100초 TIME_LIMIT 기록은 변경하지 않았다.

## 실제 실행

| Run | 테스트 코드 | 통과/전체 | 실패 | 결과 |
|---|---|---:|---:|---|
| 38350155466 | 200f7e9d | 58/58 | 0 | SUCCESS |
| 38351958007 | e83043ba | 66/68 | 2 | FAILURE |
| 38352519622 | 2ead995c | 67/68 | 1 | FAILURE |
| 38353397303 | 5c53589f | 70/71 | 1 | FAILURE |

네 실행 모두 기존 8파일/58개 테스트가 통과했다. `saved-five-mean-change-norms.test.mjs`는 매번 첫 번째로 명시 실행하여 8/8 통과했다. 신규 테스트가 빠지던 수집 패턴과 소스 변경 시 실행되지 않던 push trigger를 고쳤다. 소스 SHA/UTC/exit/건수/음성 대조/실제 관찰 JSON/TAP/stderr를 보존하고 실패 시에도 artifact를 업로드한다.

첫 실패 실행에는 독립 fast-time 판정 미해결과 M2 자료 경로 탐색 누락이 있었다. 탐색을 `git ls-files -z`의 전체 저장소 목록으로 바꾼 뒤 M2 자료 검사가 통과했다. 이후 남은 실패는 독립 fast-time source 검사 하나다. 이를 skip/expected failure로 바꾸지 않았다.

최신 CI는 Node v24.21.0 / Python 3.12.15에서 2026-10-13 14:50:04.778700–14:52:36.210183 KST에 실행됐다. 건너뛰기/취소는 0이다. 테스트 전후 source tree는 네 실행 모두 변경되지 않았다. 예산은 150초/테스트 파일, Node old-space 1536 MiB, 파일 직렬 실행, job 18분이다. old-space는 전체 RSS 하드 리밋이 아니다.

최신 required test는 29.716초, exit 0, 8/8이었다. 복사된 인증 객체, 부족한 차수/예산 및 외부 norm, root/전체 압력/상수/완료 플래그 변조에 대한 세 음성 대조가 모두 통과했다. `00-saved-five-observed.json`은 2,343,237 bytes이고 SHA-256은 `bc999c48a1788c1f1e273038afa087e36eaa928dc15b600eafa3447e51c4cfce`다. 네 실행에서 일치한다. 두 유한 소스-결속 계산은 전체 N6 인증서나 수치 샘플로 재해석하지 않는다.

## 독립 검사가 도달한 지점

새 `source-saved-five-fast-time-audit.mjs`는 기존 freeCoordinates와 기록된 pass 비트를 증명으로 재사용하지 않는다. 정의 본문, 동시 치환, 적분의 binder/끝점, 모든 indexed-field 행/계수/도함수 지도/guard, 원래 Fourier inverse를 추적한다. 무한급수를 유한 절단으로 바꾸지 않는다. 전체 정의역/수렴/매끄러움 증명은 이 검사의 범위 밖이다.

실제 source에서 131,509개 노드를 방문했고 131,520개 노드에 접근했다. 작업량은 136,369/200,000이며 시간/작업량 중단은 없었다. 결과는 **UNRESOLVED**다. 미해결 연산자는 다음 여섯 종류다.

- actual_background_even_profile
- actual_covariance_volterra
- actual_monotone_root
- actual_natural_series
- actual_quadratic_root
- m3_global_indexed_partial

알려진 자유 좌표 부분에는 epsilon/R/Z/T만 남았지만 증가량마다 미해결 토큰 556개가 남아 있다. 따라서 fast-time 독립성 증명이 아니며, 원래 수학 명제의 반례도 아니다. 새 검사 파일 13개 중 12개 통과, 실제 source 독립성 assertion 1개 실패다.

동일 source의 beta/v/gamma 증가량 root 3614789/3614767/3614771, fast 좌표 635044/635045, old/new 전체 압력 3614634/3615361, cutoff remainder 3614635/3615362, nonzero nonlinear remainders를 보존했다. 독립 fast-time zero, whole mean difference 직접 재계산, initial class, N6-01/02, completeN6, wholeM3Complete, Lean kernel 검증은 아직 false다.

## 인수 범위 및 운영판

M2 최종 인수 기록을 실제로 찾아 읽었다:
`research-ide/mathscope-m2/navier/research/evidence/m2-final-completion-20261011/M2_FINAL_COMPLETION.json`.
이 기록의 `COMPLETE_IN_DECLARED_SOURCE_BOUND_M2_SCOPE`와 원래 64/64 범위를 승계한다. M0 과거 잔여 6/6, M1 원래 64/64도 승계한다. 과거 진행표의 false와 최신 56/64는 서로 다른 이력으로 보존한다.

코드 검증 후 main은 `50e3a6262faf0b4844356ce06af6fb28d83afcf8`, main 대비 작업 브랜치는 ahead 9/behind 1로 확인했다. 문서 커밋 뒤 ahead 수는 변한다. main과 구브랜치를 가리키는 PR #21은 수정하지 않았다.

WebsitePublisher 29770 / v0.3.1.html은 재조회 결과 v102 / `22764e0e`다. 페이지를 게시하거나 덮어쓰지 않았다. 과거 공개 SHA-256 `6189fd98be1bcd857f9b4c65f980746b15ab4dd95d64c4b2a3d1fe9655056eb9`는 보존하되 이번에 HTML 바이트를 다시 해시했다고 주장하지 않는다.

## 다음 재개

여섯 미해결 연산자에 대해 실제 정의/계수 seed/방정식/branch/초기 datum/모든 field 행을 독립적으로 검사해야 한다. 단순 인자 목록만 보거나 unknown을 0으로 대체하지 않는다. `actual-continuation-exact-functions.mjs`와 `source-global-expressions.mjs`가 주요 출발점이다. 마지막 artifact의 definition-readback은 선택된 registry 1,906,966 bytes와 131,520개 실제 노드 결속을 담는다. 전체 그래프나 private source authority를 대신하지 않는다.

엄격한 실제 source 검사가 성공한 뒤에만 새 mean-change 결과와 결합한다. 그 뒤 같은 j=0 source 및 최신 전체 압력으로 whole mean PDE 차이를 직접 재계산하고 initial class를 닫아 N6-01/02를 판단한다. 이후 N6-07/08 → N7-04/05/06 → N8-05 → M4 I3/R1 순서를 유지한다.

첨부 continuation package에는 네 CI artifact ZIP 원본과 변경하지 않은 raw receipt/TAP/관찰 JSON, 실행한 코드, checkpoint, SHA-256 manifest가 있다. 이 폴더의 RUN_INDEX.json은 그 원본의 위치와 해시를 기록한 색인이지 raw receipt의 대체물이 아니다. GitHub artifact의 보존 기간은 30일이므로 전달한 원본 ZIP도 함께 보존한다.

이번 로컬 환경에는 이전 checkout이 없었고 빈 별도 디렉터리에서의 clone은 DNS 오류로 실패했다. 실제 source 테스트와 원격 커밋은 연결된 GitHub 및 hosted CI에서 수행했다. 공유 ChatGPT 대화 본문이나 마지막 미커밋 명령을 복구했다고 주장하지 않는다.
