# v103 원문·증거 패널의 실제 공개 검증

운영 주소 <https://project29770.websitepublisher.ai/v0.3.1.html>에 M3 잔여 8개와 M4 I3/R1 16개의 원문·쪽수·증거를 선택하는 패널을 추가했다. WebsitePublisher v103/hash `34a95b22`이며, 실제 공개 문서 SHA-256은 `e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784`이다. 공개 수학 인수는 M3 56/64, M4 UNCONFIRMED로 유지한다.

실제 Chrome 154의 운영 URL 응답을 대체 없이 읽었다. 1440×1050 데스크톱과 390×844 모바일/touch context에서 24개 원문 선택, 키보드 조작, 실제 JSON 다운로드, 위조 완료 quarantine, 잘못된 소스 import 거부, 초점 복귀, clipping 및 콘솔을 검사했다. 모바일 화면 검수이며 물리적 모바일 기기·OS 검수는 아니다. 두 앞선 실패 receipt도 변경 없이 보존한다. 실행과 screenshot은 `research-ide/mathscope-m4/web/evidence/live-20261013095417465/`에 있다.

CMS는 inline JSON의 `\\u003c` 한 개를 `<`로 직렬화했다. 두 JSON은 같은 원문 모델로 파싱되며 실행 script 종료 문자열이 없다. 게시 후보와 실제 전달 fragment를 각각 고정했다. 전달 fragment를 정확히 제거하면 기존 v102의 모든 바이트와 SHA `6189fd98be1bcd857f9b4c65f980746b15ab4dd95d64c4b2a3d1fe9655056eb9`가 복구된다. 기존 수학 엔진과 Worker는 그대로 보존된다.

`PUBLICATION.json`은 실제 공개·fragment·모델·검증 소스·압축 snapshot·각 실행 파일의 hash와 범위를 기록한다. `capture_publication.py --readback <관측한 HTML>`은 기존 Git snapshot과 판본·모델·고정 hash를 확인하고 이 패키지를 재구성한다. 생성 환경은 실행 기록과 구별되며 새 수학 인수 권한을 만들지 않는다.

이 게시로 전체 M3/M4 완료, Lean 새 replay 성공, 전체 CI 성공, 최종 freeze를 선언하지 않는다. 원문 수학 작업과 통합 검수는 계속 진행한다.

## 검토 가능한 rollback 절차

rollback은 실행하지 않았다. 현재 remote version/hash가 `103 / 34a95b22`인지 먼저 확인한다. CAS expected_version_hash `34a95b22`에서 `delivered-fragment.html`의 정확한 전체 문자열 하나만 빈 문자열로 바꾸는 patch가 검토 대상이다. find가 하나가 아니거나 remote hash가 바뀌면 중단하고 새 판본을 먼저 대조한다. patch 후 실제 공개 문서를 다시 내려받아 v102 SHA와 모든 바이트 일치를 확인해야 한다. 이전 판본을 무조건 업로드하거나 다른 작업자의 변경을 덮어쓰지 않는다.
