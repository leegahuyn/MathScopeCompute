# M3·M4 원문·증거 시각화 패널

원 설계도의 M3 잔여 8개와 M4 I3/R1 16개를 선택하여 원문 문장, 쪽수, 원 설계도 SHA, 선행 조건, 필요한 증거, GitHub 소스·영수증을 확인하는 추가 패널이다. 공개 인수는 M3 56/64, M4 최종 인수는 UNCONFIRMED로 유지한다. 새 유한 Lean 실행, 실패한 조건부 해석 replay, 기존 소스·로그 바이트 검사를 서로 다른 범위로 표시한다.

## 표시 계약

- 분석 작업: 원래 수학 의무의 의존성·증거 추적. 과학 측정값이나 수렴 plot을 생성하지 않는다.
- 렌더러: 인스턴스 하나의 semantic DOM, native dialog, 일반 버튼·목록·상세 inspector. WebGL이나 추가 라이브러리를 요구하지 않는다.
- 상태: 선택한 원래 criterion ID만 표시한다. 원문·공개 baseline hash가 맞는 가져오기도 QUARANTINED 상태이며 완료 판정을 변경하지 않는다.
- 입력: `original-criteria.json`의 원문 문장 + 부모 `criteria.mjs`의 인수 검사 ID + 부모 실제 실행 영수증. 외부 JSON의 PASS 비트는 인수 권한이 없다.
- 모바일: 줄바꿈되는 의존 순서, 44px 이상 버튼, tap 선택, 선택 뒤 inspector 초점. 데스크톱은 목록과 inspector의 두 열이다. 키보드 Enter/Tab/Escape와 닫은 뒤 launcher 초점을 지원한다.
- 비용: 현재 fragment 약 78KB, 24개 criterion. 원래 28MB 페이지의 엔진·모델·Worker는 수정하지 않는다.

## 파일

- `panel.css`, `panel.js`: `ms-m4-` 접두사로 소유 범위를 제한한 화면·동작.
- `original-criteria.json`: 원 설계도 p.20/62/64/66/68에서 추출한 원래 24개 문장. 원본 PDF SHA `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.
- `build-web-patch.mjs`: 부모 M4 계약을 읽어 `panel-model.json`, `patch-fragment.html`과 build receipt를 생성한다.
- `test-browser.mjs`: 실제 Chromium으로 desktop 1440×1050 / mobile 390×844에서 독립 패널과 원래 페이지에 삽입한 candidate를 검사한다.
- `verify-live-panel.mjs`: 게시 후 실제 운영 문서를 대체 없이 읽어 candidate SHA와 두 viewport의 선택·export/import·위조 상태 거부·초점·콘솔을 검사한다. 성공 receipt가 있어야 공개 검증을 주장한다.
- `evidence/`: 실제 성공·실패 QA receipt, screenshot, 원래 baseline과의 바이트 보존 검사. `*-receipt.json`은 최신 포인터이며 timestamped receipt가 각 실행의 고정 기록이다.

## 로컬 빌드·검수

```powershell
node research-ide/mathscope-m4/web/build-web-patch.mjs --baseline <saved-v102-html>
node research-ide/mathscope-m4/web/test-browser.mjs --playwright <installed-playwright-module> --browser-executable <installed-chromium-or-chrome> --baseline <saved-v102-html> --candidate research-ide/mathscope-m4/web/evidence/local-candidate.html
```

Browser plugin 경로가 이용 불가했고 부모의 `cua.getState` 호출이 시간 초과하여, 허용된 Playwright 대체 경로로 이미 설치된 Chrome의 별도 headless context를 사용했다. candidate 검수는 운영 URL의 document 요청만 로컬 저장 바이트로 대체한다. 원격 페이지를 변경하거나 게시한 검사가 아니다.

기존 공개 HTML SHA가 `6189fd98be1bcd857f9b4c65f980746b15ab4dd95d64c4b2a3d1fe9655056eb9`와 다르면 빌드를 거부한다. CMS 소스와 실제 공개 문서에 공통인 마지막 M2 소유 script의 정확한 끝을 하나만 찾고 그 뒤에 `mathscope-m4-evidence-20261013` fragment를 삽입한다. WebsitePublisher가 추가하는 footer는 원래 위치와 바이트를 보존한다. closing body 자체에 원격 삽입하면 publisher footer와의 순서가 예측 candidate와 다를 수 있으므로 사용하지 않는다. 정확한 find 문자열은 build receipt의 `baselineCheck.insertionAnchor`에 기록한다. 추가 fragment를 제거한 바이트가 원래 baseline과 정확히 일치해야 한다. 중복 anchor는 거부한다.

## 실제 QA 범위

각 viewport에서 원래 24개 ID/문장의 일치, 원문 쪽수/hash, click/tap, keyboard/순서 선택, 실제 JSON download, valid view round-trip, 위조 PASS quarantine, wrong-source import 거부, 닫기·초점 복귀, 수평 clipping과 오류 overlay 부재를 확인한다. 콘솔 전체 warning/error를 기록하며 기존 페이지와 추가 패널의 문제를 구별한다. latency와 heap은 관측값으로 기록한다. 이것만으로 R1-05의 전체 제품 예산 검수나 전체 3D 장면/CPU fallback을 인수하지 않는다.

M3 잔여 수학 관문의 완료, M4 전체 원래 기준 인수, 외부 사용자의 walkthrough 재현, 실제 게시 후 확인은 별도 증거가 필요하다. 배포는 공통 책임자가 fresh CI와 현재 원격 page version/hash를 확인하고 수행한다.
