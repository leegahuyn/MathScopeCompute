# 지정 사이트 읽기 전용 인수 · 2026-10-18

대상은 **project29770의 기존 `v0.3.1.html`**이다. 사이트 변경·게시·페이지/자산 추가·유료 변경은 실행하지 않았다. 기존 페이지와 공개 자산을 읽고 로컬 복사본만 분석했다. 현재 작업의 M3 전제는 root가 전달한 **61/64**이며, 이 보고서는 그 수학적 인수를 재판정하거나 M4 완료를 발급하지 않는다.

## 1. 확보한 현재 원문

| 항목 | 확인값 |
|---|---|
| URL | https://project29770.websitepublisher.ai/v0.3.1.html |
| API 페이지 버전 | 117 · `d7474dd6` · 수정 2026-10-16T09:04:29Z |
| 실제 공개 HTML | HTTP 200 · `text/html; charset=UTF-8` · 29,006,502 bytes |
| HTML SHA-256 | `600703e1bf0d40d901c4cae1cb40e48822935b11b430bf8ce1fc601eea9200b1` |
| 요금제 한도 | Free · 페이지 5/5 · 자산 37/25 · entity 0/0 |
| API 상태 | published; project의 last_published는 2026-10-06이며 페이지 updated_at과 다른 필드 |
| 렌더링 검증 | 수행하지 않음. 연결 가능한 승인된 브라우저가 확보되지 않음 |

WebsitePublisher skill main과 필수 네 section, 자산·기존 페이지 수정 지침을 읽고 `list_pages`, `list_assets`, `get_project_status`, `list_integrations`, 공개 JS/CSS와 보조 감사 페이지 `get_page`를 읽었다. 대상 `get_page` 및 content 포함 목록은 `Transport closed`였고, 읽기 전용 versioning 조회는 Free 계획의 이력 기능 402를 반환했다. 업그레이드하지 않았다. 이후 **자격증명 없는 일반 공개 HTTPS GET**으로 HTML 원문을 확보했다. 브라우저나 Playwright는 사용하지 않았다. 약 29 MB 크기는 API transport 실패의 가능한 원인이지 확인된 원인은 아니다.

`SOURCE_MANIFEST.json`은 원문, 정확한 inline 추출본, API 인수 기록의 경로·bytes·전체 SHA-256을 고정한다. 플랫폼의 8자리 version_hash와 콘텐츠 전체 SHA-256은 별개이다. 37개 자산 목록은 확보했지만 모든 자산의 내용을 내려받은 것은 아니다. 직접 확인한 파일은 전체 대상 HTML, 보조 감사 HTML, JS 3개와 CSS 3개이다. 파생 inline 파일은 실행하지 않았다.

## 2. 보존해야 할 기존 기능과 재사용 지점

| 기존 구성 | 확인한 구현 | 후속 연결에서 보존할 점 |
|---|---|---|
| Three.js 장면군 | HTML import map의 Three.js **0.180.0**, 같은 버전 addons/OrbitControls; `source/js/mathscope-app.js` 324–365, 410–433 | 기존 S3·basis·PDE·geometry·AdapterC·perfectoid 등의 라우트·카메라·선택 상태를 유지. WebGL 실패 안내, 장면 dispose, pixel ratio 상한을 재사용 |
| 원문 결속 3D | `source/inline/script-18.js` 719–728, 869–963, 1156: `SourceBoundScene`, CPU Canvas2D/WebGL marks, `MathScopeM2Visualization` | 정확한 원본 표와 sourcePath를 보존. GPU float32는 표시 좌표. 장면 1개·6000 marks 이하·DPR 1.5·이벤트 기반 redraw를 유지 |
| 실제 M3 작업창 | `source/inline/script-30.js` 3–19, 44, 88–99, 152–171 | `MathScopeM3ViewContract`, 실제 result/request/source digest, 원본 artifact 링크, stale 판정, import 후 replay를 유지. 현재 CPU 투영 3D도 유효한 기존 기능이므로 일괄 교체하지 않음 |
| source-only M3 모드 | 같은 파일 54, 96, 116, 152, 159 | signed/pressure DAG node ID는 속도값이 아님. `sourceForcedCurrentPanel`은 공간 칼럼을 숨김. 수치 공간 표본이 없는 모드의 정직한 빈 장면·식/표를 유지 |
| M4 기준 패널 | `source/inline/script-33.js` 78–100 및 `source/data/ms-m4-data.json` | 원 설계도 I3/R1 기준, 고정 SHA, 영수증 링크를 유지. 가져온 증거는 `QUARANTINED_REASSESSMENT_REQUIRED`; 현재 보기를 바꿔도 판정 승격 불가 |
| R1 실행실 | `source/inline/script-35.js` 150, 177–183, 201–213 | fresh Worker, 취소·재개, hash 결속 export/import/replay, 표본 역추적, `wholeM3Complete:false`, `wholeM4Complete:false` 유지 |
| 증거 기반층 | `source/inline/script-04.js` 401, 1183–1258 | source/env freshness, evidence 등급 경계, 실제 verifier 전용 승격 경로 유지. 일반 수치 결과는 FORMAL PASS가 아님 |
| 접근성 | app.js 318–365; script-30.js 124, 137–155, 179–180 | 키보드 회전·확대·Home·점 선택, tabs 이동, 표 대안, aria label, reduced-motion, WebGL fallback 유지 |

새 3D 라이브러리는 필요하지 않다. 현재 import map과 OrbitControls를 그대로 사용하거나, 이미 구현된 SourceBoundScene/M3 ViewContract를 확장하면 된다. Three.js CDN은 런타임 외부 의존성이다. 이 인수에서는 CDN 로딩·CORS·브라우저 렌더 성공을 관측하지 않았다.

## 3. 현재 문제와 정확한 영향

1. **과거 인수 상태가 여러 패널에 남아 있다.** 전체 HTML에는 `56/64` 21회, `57/64` 2회, `61/64` 0회가 있다. 이는 문자열 개수이며 판정 검사가 아니다. script-38의 integrated view는 57 완료, N6-02 `PARTIAL_DEFERRED`를 고정하며 export도 57/64를 쓴다. M4 패널은 역사적 56/64와 M4 `UNCONFIRMED`를 보존한다. 후속 61/64는 현재 고정 assessment receipt를 별도 연결하고 과거 기록은 날짜·범위를 명시해야 한다. 현재 상태를 기존 문구 전체 치환으로 갱신하면 역사와 증거가 섞인다.

2. **Integrated view의 실제 원본 장부는 기본 상태에서 미탑재다.** `source/inline/script-38.js`의 `original_rows:null` 때문에 1260개 ID 선택은 파일 입력 대기다. import는 SHA `14f5d2edbaed921c97dcfd42a3a5be3485be83b671cbdffafe5101197718cf10`, 1260 rows, 64 기준, 완료 57을 요구한다. 현재 증거를 수용하려면 새로운 버전의 명시적 데이터 schema/manifest 연결이 필요하며, 이 고정 검사를 삭제해서는 안 된다. 5개 norm의 SVG 지수 비교는 실제 장의 3D 수치 표본이 아니다.

3. **일부 증거 경로는 다운로드 링크가 아니다.** script-38의 `inherited/.../evidence/*.json`은 JSON 안의 패키지 상대 경로 문자열이다. 웹에 그 파일이 제공된다는 증거가 없다. 보조 `m3-picard-audit.html`에는 `<a>`가 없고 원본 SHA 필드 일부가 `[REDACTED]`이며, 같은 표기가 총 253회 있다. 다른 패널에는 고정 commit/run 링크 및 mutable main/branch 링크가 공존한다. 후속 현재 판정에는 공개 가능한 최소 영수증과 고정 commit/path/SHA를 연결하고 링크 접근성은 실제 브라우저에서 확인해야 한다. root의 GitHub 검사와 연계하되 여기서는 원격 artifact 내용의 동일성을 확인한 것으로 표시하지 않는다.

4. **전달 크기와 메인 스레드 비용이 크다.** 단일 HTML이 약 29 MB이며 M3 engine inline 약 12.26 MB, M2 engine 약 8.63 MB 등을 포함한다. 기존 기능 보존을 위해 이번 연결에서 전체 번들을 재작성하거나 새 자산을 늘리지 않는다. 무거운 실제 장 평가를 rendering callback에 넣지 않고 기존 bounded Worker의 결과를 읽는다. app.js의 renderBudget에는 targetFps 30이 있지만 실제 loop 제한은 maxInteractiveFps 60을 사용한다(322, 354–363). 이 값만으로 30 fps 성능 충족을 주장할 수 없다.

5. **증거 승격의 인접 강건성 문제.** `source/js/mathscope-stage6.js` 115–116에서 optional `canPromoteEvidence`가 없으면 `if(!guard||guard.ok)`가 통과한다. 현재 foundation에 guard가 있으므로 실제 오승격이 관측되었다는 뜻은 아니다. 새 M3 adapter에 이 패턴을 복제하지 말고 guard가 존재하고 성공할 때만 승격하도록 해야 한다. app.js 2305의 B3 `safeText?'PASS':'CHECK'`는 함수 참조가 truthy이면 PASS인 장식성 검사이다. 해당 UI PASS 개수는 M3/M4 완료 증거로 사용할 수 없다.

6. **접근성 기능의 코드 존재와 실제 인수는 구분한다.** 키보드·표·fallback 구현은 확인했지만 desktop/mobile 화면, focus 이동, long Korean/math overflow, reduced-motion, WebGL context loss, CPU/GPU 비교 및 Worker replay를 브라우저에서 실행하지 않았다. R1-05/08 완료로 세지 않는다.

## 4. 원 설계도에 맞춘 연결 계약

원 설계도 SHA는 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이다. 페이지의 ms-m4-data도 같은 SHA를 기록한다. 로컬 `work/m4_criteria/concept_blueprint.txt`의 객체/표현/주장 분리와 `historical_m3_m4_resume_20261013.md` 202–228의 I3 및 R1 인수 항목을 함께 따른다. 역사적 resume의 56/64를 현재 판정으로 재사용하지 않는다.

연결은 `ObjectSpec/TypedMathIR → 실제 Worker/evaluator 결과 → Artifact/Diagnostic → RepresentationSpec/ViewContract → 장면+정확한 표`로 한다. 별도로 `ClaimSpec → source/environment/dependency hash가 고정된 EvidenceRecord → 현재 ledger`를 연결한다. 그림의 존재나 float32 렌더는 수학적 증거 승격 경로가 아니다.

표본 계약에는 적어도 다음이 필요하다: claim ID, object/representation revision, input/source/environment/result hash, 실제 공간 좌표와 시간, 좌표계·단위·원래 field 이름, 성분값 또는 엄밀 구간, 절단 order/active indices/정밀도, error/tail 범위, originalPointId/sourcePath, source artifact SHA/공개 URL, 적용 가정과 유한/전역 범위. 미계산 값은 누락 또는 `UNAVAILABLE`로 보존한다. node ID, bound exponent, 그림용 궤적을 실제 u/p/f 표본으로 변환하지 않는다.

카메라·색·점 선택·LOD는 representationRevision만 변경한다. 수학 입력·정의·환경 변경은 의존 증거를 STALE로 만들고 늦게 도착한 결과가 현재 판정을 덮어쓰지 못하게 한다. 같은 점을 누르면 원식·논문 위치·job·오차·정리/가정 ID가 열리고, 정확한 표와 export는 LOD로 잘라내지 않는다. 이 계약은 I3-03/04/07/08 및 R1-03/04의 기존 설계와 일치한다.

## 5. 후속 패치 순서와 인수 경계

1. root가 고정한 현재 M3 assessment와 미완료 항목을 수용할 schema/adapter를 **로컬에서** 만든다. 61/64는 전제일 뿐 M3 완료가 아니다. 기존 56/57 자료는 historical snapshot으로 유지한다. 전체 64 인수 여부와 실제 현행 3개 의무의 충족은 담당 수학 평가자가 결정한다.
2. 기존 M3 작업창에 결과 adapter를 붙이고 필요시 같은 SourceBoundScene/Three.js 장면을 추가한다. 실제 공간 값이 없는 source-only 모드는 식/표 그대로 유지한다. 기존 모든 route, P7/P8/Y5–Y7/N6–N8, M4/R1, 단축키·export/import·replay를 보존한다.
3. I3-05/06의 source 변조·toolchain/axiom 검사와 R1-01/02/04/06의 재실행·독립 해상도·stale·위조증거 거부를 현행 candidate에서 확인한다. 현재 페이지의 정적 PASS나 과거 run만으로 통과시키지 않는다.
4. M3 전제와 M4 인수에 대한 root의 게시 gate가 충족된 뒤에만 기존 페이지를 patch한다. 직전 `version_hash`를 다시 읽어 동시 변경 충돌을 막고, v117의 전체 로컬 원문을 rollback 기준으로 보존한다. 새 페이지/새 자산/유료 변경은 이 계획에 포함하지 않는다. 계정 한도 때문에 기존 자산 교체가 가능하다고 단정하지 않으며 API 거절 시 우회하지 않는다.
5. 연결 가능한 승인된 브라우저로 desktop/mobile, 키보드·표·fallback, 실제 renderer, point 역추적, 취소/재개·replay, stale, 공개 증거 링크를 확인한 뒤 게시 후 원문/hash와 UI를 기록한다. R1-07 외부 사용자의 문서만으로 재현 및 R1-08 rollback/게시 후 관측을 대체하지 않는다. root가 관리하는 PR30 브랜치에 candidate·테스트·source manifest·배포 diff·readback을 함께 저장한다.

## 6. 비공개 정보와 이번 인수의 한계

외부 서비스로 로컬 수학 원본·개인정보·secret을 전송하지 않았다. 공개 HTML 2개와 자산 6개에 대해 private key, GitHub token, AWS key, OpenAI key, literal bearer, JWT 형태를 로컬 검사했고 0 match였다(`PUBLIC_SOURCE_SECRET_SCAN.json`). 이는 제한된 패턴 검사이며 포괄적 개인정보 인증은 아니다. API integration catalog는 읽었지만 그 안의 business integration을 실행하거나 credentials를 조회하지 않았다.

이번 결과는 **현행 공개 원문을 근거로 한 보존·연결 설계**다. 사이트의 수학적 정리 전체, 원격 GitHub artifact의 진위, 실제 런타임 성능, 현행 M3 61 항목 자체, M4 완료나 게시 완료를 인증하지 않는다.
