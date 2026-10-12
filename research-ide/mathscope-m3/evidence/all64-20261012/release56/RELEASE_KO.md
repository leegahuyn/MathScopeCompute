# M3 원문 56/64 검증 판본 배포 기록

지정 페이지 `https://project29770.websitepublisher.ai/v0.3.1.html`에 version 102를 적용했다. GitHub PR20의 검증 head는 `787bc6a7a20069c96f6bee4ae3c82b9de2d61829`, 기본 브랜치 병합 commit은 `50e3a6262faf0b4844356ce06af6fb28d83afcf8`다.

## 원문 판정

이번 추가 완료 항목은 N6-03이다. 원래 10개 부호·덮개 행의 모든 비영 역연산, cutoff 이후 전체 curl, 갱신 평균·각도 압력과 새 각도 모드를 11개 저장 그래프에 연결했다. 실제 재생에서 PDE 계수 540개, 식 2,320개, 독립 검사 213개와 네 음성 대조가 통과했다. 원래 통합 생성자의 시간 제한 실패 receipt는 보존했다.

원문 64개의 제목·본문·쪽수·출처와 이전 45개 판정을 보존한 심사는 151개 검사를 통과했다. 누적 완료는 **56/64**다. N6-01, N6-02, N6-07, N6-08, N7-04, N7-05, N7-06, N8-05는 아직 완료하지 않았다. 전체 M3 완료 플래그는 false다.

## 배포 전 실제 검증

검증 head에서 다음 다섯 workflow가 모두 통과했다.

- [계산 엔진 CI](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38300260610)
- [연구 IDE·영문 원본 manifest CI](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38300260606)
- [P7 CI](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38300260656)
- [유체·게이지 통합 및 일곱 원본 소스 실행 CI](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38300260655)
- [실제 Chromium 데스크톱·모바일 CI](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38300248613)

Chromium 151.0.7922.34에서 1440×1050 및 390×844 화면으로 실행했다. 10개 원본 행과 20개 역연산 연결, 마우스·키보드 행 선택, 동일 해시 유지, 새 Worker 재생 MATCH, 원본 GitHub 링크, 가로 스크롤 범위를 확인했다. 두 화면 모두 페이지·콘솔 오류가 없었다. 원본 식 화면은 빈 공간 canvas 대신 검증 표를 먼저 표시한다. 정확한 관측값과 캡처는 `browser-ci38300248613/receipt.json` 및 PNG에 있다.

초기 판본에서 발생한 심사 allowlist·영문 artifact manifest 오류와 첫 번째 브라우저 검증은 각각 `initial-ci/`, `browser-ci38298527842/`에 그대로 남겼다. 기존 원본과 실제 실패 실행을 나중의 성공 상태로 고쳐 쓰지 않았다.

## 공개 페이지 확인

2026-10-12 20:02:04 UTC에 공개 URL을 다시 읽어 HTTP 200을 확인했다. 공개 페이지 전체 **28,469,745 bytes**가 실제 브라우저로 검증한 `candidate-v031-attempt2.html.gz`의 원본과 바이트 단위로 일치했다.

- version: `102`
- version hash: `22764e0e`
- 공개 페이지 SHA-256: `6189fd98be1bcd857f9b4c65f980746b15ab4dd95d64c4b2a3d1fe9655056eb9`
- 실행 소스 manifest SHA-256: `ff3488e8df105c133be7e63c7e7c78d726df4bc648cb8b31053a90b06f4d9e78`

큰 페이지를 전송할 때 기존 실행 엔진을 보존한 채 새 코드를 먼저 실행되지 않는 상태로 저장했다. 그 중간 페이지의 정확한 바이트를 확인한 뒤 새 판본을 활성화하고 임시 코드를 제거했다. 최종 결과의 전체 해시 일치가 이 배포 경로도 확인한다. 상세 기록은 `staged-publication.json`과 `public-readback.json`에 있다.
