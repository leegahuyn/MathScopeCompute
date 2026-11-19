# R1-08 운영 페이지 역변환 대조

2026-11-19 21:52 UTC에 공급자 메타데이터와 서빙 HTTP를 다시 조회했다. 프로젝트 29770의 `v0.3.1.html`은 버전 137, 짧은 버전 해시 `9171eb0c`, 저장 크기 29,580,450바이트였다. 새 HTTP 200 응답 30,707,818바이트의 SHA-256은 이전 운영 응답과 같다. 비교 페이지의 내용도 소유자 읽기 권한에서 조회했다. [운영 페이지](https://project29770.websitepublisher.ai/v0.3.1.html) · [비교 페이지](https://project29770.websitepublisher.ai/desktop-source.html)

## VERIFIED

같은 공급자의 `desktop-source.html` 버전 6에서 인증된 편집 본문 10,777바이트와 공개 응답 13,873바이트를 정확히 비교했다. 관측된 공개 변환은 머리 시작·끝과 본문 끝에 공급자 문자열 세 구간을 삽입하고 원래의 `<title>`과 description 태그를 제거한다. 세 구간을 제거하고 두 태그를 복원했을 때 인증 편집 본문 SHA-256 `d60acd517cc4ea509b80c619601400d36d3e0dd59ebb50ce934b922f93567892`와 바이트 단위로 일치한다. 역순 적용으로 원래 공개 바이트도 복원된다.

원래 제목의 `Desktop`을 같은 길이의 `desktop`으로 바꾼 로컬 대조군은 다른 편집 본문 SHA-256을 가지며, 공급자 SEO 메타데이터와 관측된 제거 규칙을 고정하면 같은 공개 바이트를 준다. 공개 왕복과 같은 바이트 길이만으로 편집 원본을 식별할 수 없음을 이 대조군이 보여준다.

운영 후보에는 기존 인증 fragment 14개의 관측 범위와 SHA-256을 재대조했다. 공개 구간 1,125,144바이트를 역사적으로 고정된 923바이트의 14개 포함 표식으로 되돌렸다. 비교 페이지로 보정한 플랫폼 구간을 제거하고 역사적 v0.3.1 Git 원본의 title·description 366바이트를 넣으면 두 경계 개행 해석 모두 공급자 저장 크기 29,580,450바이트를 얻는다. 두 후보를 공개 바이트로 정확히 왕복할 수 있다. 후보의 해시 접두어는 `02aba9d5`와 `a65b607e`이며 공급자 식별값 `9171eb0c`와 모두 다르다. 편집 원본 결속에 실패했다.

## OPEN

운영 편집 본문의 독립 증거와 공급자의 실제 공개 변환 전체, 운영 범위에 결속된 검토 패치·테스트·복구 자료, 같은 후보의 실제 게시 후 화면 및 동작이 남았다. 원래 설계도 68쪽의 R1-08은 지원 범위 및 모듈 상태, 패치·테스트·되돌리기 자료와 실제 게시 후 화면을 요구한다. 운영 복구를 실제로 실행하라는 조항은 없다. 격리한 소유자 후보의 16/16은 기존에 수락된 범위다. 운영 R1-08 OPEN 및 RELEASE HOLD를 유지한다.

## 로컬 재현

`verify_provider_transform.py`는 두 공개 응답, `provider-observation.json`, `control-witness.json`, C50 `m4/r108-fragment-provenance-20261119/fragment-public-binding.json` 및 Git 원본 두 개를 받는다. Git 원본은 `research-ide/mathscope-m0/baseline/v031.html`과 `research-ide/mathscope-m4/recovery-ui-20261019/generated/fragments/stored-block.html`이며 두 Git blob ID를 검사한다. 최초 실행은 공급자 `get_page`의 비교 페이지 바이트를 포함했고, 두 번째는 보존한 2개 태그와 인증 본문의 SHA만 사용했다. 두 실행 결과가 일치했다. 공개·편집 HTML 본문은 패키지에 포함하지 않았다.

```powershell
python -B verify_provider_transform.py --observation provider-observation.json --control-witness control-witness.json --control-http CONTROL_PUBLIC --production-http PRODUCTION_PUBLIC --fragment-receipt C50_FRAGMENT_RECEIPT --baseline HISTORICAL_BASELINE --markers HISTORICAL_MARKERS --out replay.json
```

이번 확인은 두 개의 읽기 전용 HTTP 조회와 공급자 읽기, Git blob 읽기로 진행했다. 운영 게시 및 되돌리기 요청은 전송하지 않았다.
