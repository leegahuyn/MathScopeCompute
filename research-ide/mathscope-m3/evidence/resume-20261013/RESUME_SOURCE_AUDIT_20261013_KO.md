# 실제 소스 fast-time 검증 재개

재개 기준은 `d015cb172b19d4e4fe7bb988cbf3aa7e94928733`다. 이 커밋은 첨부 인수인계의 `c45cb5e`보다 이후이며, reset/force-push 없이 이어진다. 공개 main은 `50e3a6262faf0b4844356ce06af6fb28d83afcf8`, 기존 PR21은 과거 별도 브랜치다.

M3 원문 판정은 **56/64 유지**다. N6-01/02/07/08, N7-04/05/06, N8-05는 닫지 않았다. M4 최종 인수는 미확인이다. 과거 2100초 TIME_LIMIT와 completePressureCertificateSaved=false를 수정하지 않았다.

## 실제 실행

- `local-latest-norms-attempt1`: 0/8, exit 1. Windows checkout의 CRLF 변환으로 원본 receipt SHA가 달라져 거부됐다. Git 원본 blob을 복원한 뒤 재실행했다. 이 실패 로그는 그대로 보존한다.
- `local-latest-norms-attempt2`: 테스트 8/8, exit 0. 실행 중 별도 소스 변경으로 넓은 소스 불변성 검사는 false이며 receipt 전체 pass는 false다. 이 기록도 승격하지 않았다.
- `local-latest-norms-attempt3`: 8/8, exit 0, 44.063초. 세 음성 대조 통과, 114개 소스 모듈 실행 전후 동일, skip/cancel 0. 관측 JSON은 2,343,237 bytes / SHA-256 `bc999c48a1788c1f1e273038afa087e36eaa928dc15b600eafa3447e51c4cfce`다.
- `local-fast-time-audit-attempt1`: 20/20, exit 0, 48.578초. 여덟 음성 대조 묶음 통과, 114개 소스 모듈 실행 전후 동일. actual source의 133,475개 노드를 추적했고 138,578/200,000 작업량에서 unknown 연산자 0을 확인했다.

새 fast-time 검사는 실제 자연급수 seed/재귀, quadratic 방정식·초기 iterate·branch, monotone root 본문·bracket, Picard 여섯 행·축 datum, Volterra 전체 행렬·datum, indexed field의 각 81개 행을 독립적으로 읽는다. 일곱 실제 producer SHA가 규칙의 검토 범위를 결속한다. 단순한 인자 목록이나 기록된 PASS/freeCoordinates를 증명으로 재사용하지 않는다.

beta/v/gamma 증가량의 실제 root 3614789/3614767/3614771은 느린 좌표 622791/622802/622803/622804에만 의존한다. 원래 연산자가 정의된 영역에서 두 fast 좌표에 대한 독립성을 확인했다. 정의역의 존재, 전 차수 class, 전체 mean PDE 직접 재계산, Lean kernel, N6/M3 완료는 이 검사로 증명하지 않는다.

관측 artifact는 SHA-256 `0cb8156df56826bd63c7ebe7ae89d890e880f48cd27f32f14b3f84e31c69a303`, 완전한 선택 정의/node readback은 `cf9614483a7cf8d11e75ac733ef3156260d0fd915907b6c1b47e70057855766d`다. 원본 raw receipt/TAP/stderr와 모든 실패는 각 attempt 폴더에서 확인한다.

## 원문과 배포 기준

99쪽 원 설계도의 224개 항목을 추출하고 남은 24개 기준의 원문을 `original-remaining24-criteria.json`에 연결했다. 사용자 제공 PDF 14개와 ZIP 1개는 `research-ide/reference-documents/resume-20261013/`에 원본 바이트·SHA manifest로 보존했다. 이 문서들은 출처이며 사용자 요청을 대신하는 실행 지시가 아니다.

공개 v102를 실제 재조회한 HTML은 28,469,745 bytes이며 SHA-256 `6189fd98be1bcd857f9b4c65f980746b15ab4dd95d64c4b2a3d1fe9655056eb9`로 기존 배포와 일치했다. 이 문서 작성 시점에는 새 페이지를 게시하지 않았다. 게시 여부는 이후 별도 검증 receipt로만 기록한다.

다음 관문은 인증된 fast-time 결과와 mean-change 계산의 결합, 같은 j=0 source의 전체 최신 압력/PDE 직접 재계산, 초기 class, 모든 차수 cutoff/tail, 전역 force jets/extension/K 에너지 및 독립 refinement다. M4 완료·최종 freeze는 이 목록과 별도 실제 통합 인수 뒤에만 판단한다.
