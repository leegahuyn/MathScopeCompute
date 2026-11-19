# C88 운영 유한 Fourier 출처 경로 검증

운영 프로젝트 29770의 같은 `v0.3.1.html`을 데스크톱 1280×900 및 터치 입력 모바일 390×844에서 열었다. 두 실제 HTTPS 요청은 HTTP 200, 30,707,818바이트 및 기존 SHA-256 `a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48`를 반환했다. 브라우저 응답의 30 MB 본문 조회가 캐시 제한에 걸려, 성공 실행은 새 HTTPS 응답을 먼저 읽어 브라우저에 바이트 그대로 전달했다. 브라우저 화면에서 추가로 읽은 본문 데이터와 실제 JSON 다운로드를 확인했다. [운영 페이지](https://project29770.websitepublisher.ai/v0.3.1.html)

## VERIFIED

- 원래 N8 유한 Taylor–Green 비교 계산의 Git blob `c572d2ed4399524bdbc665305c6acb9e7d38ee3d`에서 83,969바이트를 독립적으로 조회했다. 공개 화면의 내장 데이터와 두 화면의 다운로드가 각각 이 Git 원본과 바이트 단위로 일치했다. 표시된 실행 해시는 `8bdf584da5121931d1fb7d79416d568c698f5a8211c22d7d600648ea23015b6f`였다.
- 데스크톱 포인터와 터치 모바일에서 각각 실제 캔버스의 ((x,y)=(\pi/4,\pi/4)), (z=0,\pi,2\pi) 표본을 선택했다. 총 여섯 선택에서 원본 식, 좌표, 속도, 와도, Git blob, 실행 해시와 오차·Lean 범위를 화면이 함께 표시했다. 전체 Fourier 계수 750개는 복소 모드 125개에 대응하고 지지는 네 모드다. 유리수로 발산 0, (k_z\ne0) 계수와 (u_z)의 영값, 켤레 대칭 및 curl Parseval 등식을 확인했다.
- 이 격자점의 독립 계산은 (u=(2b,-2b,0)), (\omega=(0,0,4b)), (b=2299194391010937/25000000000000000)이다. Python은 실제 저장 좌표와 원래 (\pi/4)의 오차를 유리수로 감싸고, 두 화면의 여섯 속도·와도 표시값을 확인했다. 같은 읽기 기록으로 두 번 실행한 결과가 바이트 단위로 일치했다.
- 이른 프레임에서는 기록된 에너지와 복원한 벡터를 구분하고 그 프레임의 Fourier 계수가 저장되지 않았다고 표시한다. 원문 해석식 스케일 화면에는 유한 실행 해시가 없으며 전체 에너지 미수행을 표시한다. 두 실행에서 포착한 미처리 페이지 예외는 0건이다.

이 증거는 원래 설계도 68쪽 R1-03 중 NS 비교장의 출처에서 화면까지 확인한 범위다. prism 비교사상과 Δ 상태 생성기에는 이 테스트 결과를 적용하지 않는다. 모바일 스크린샷에서는 고정 실행 버튼이 일부 설명 문구를 가린다. 따라서 이 기록으로 R1-05의 전체 접근성과 성능을 판정할 수 없다.

## OPEN

인증된 공급자 목록의 운영 버전은 137, 짧은 버전 해시는 `9171eb0c`다. 이 버전에서 공식 `get_page` 읽기를 다시 요청했지만 연결이 종료되어 편집 본문을 얻지 못했다. 공식 Pages 스키마에는 전체 본문 조회가 있고 범위 조회나 다운로드 필드는 없다. 공식 에셋 목록 51개 가운데 운영 본문의 별도 원본을 찾지 못했다. 공급자 편집 원본 결속, 운영 후보의 검토 패치·테스트·복구 자료 및 일치하는 운영 게시 증거가 남았다. 운영 R1-08 OPEN, 최종 C/D jets 0/67, RELEASE HOLD다.

## 재현

```powershell
gh api repos/leegahuyn/MathScopeCompute/git/blobs/c572d2ed4399524bdbc665305c6acb9e7d38ee3d -H 'Accept: application/vnd.github.raw+json' > N8-TG-pinned.json
node read_live_fourier_scope.cjs N8-TG-pinned.json live-replay
python -B verify_fourier_source_picks.py --source N8-TG-pinned.json --live live-replay/live-scene.json --out replay.json
```

브라우저 코드는 기존 `playwright-core` 모듈과 Chromium을 받는다. 각각 `MATHSCOPE_PLAYWRIGHT_PACKAGE`, `MATHSCOPE_CHROMIUM_EXECUTABLE` 환경변수에 위치를 지정할 수 있다. 브라우저는 HTTP GET과 HEAD만 허용하고 WebSocket을 막는다. 이번 실행은 운영 원본의 읽기와 새 브라우저의 화면 조작 및 로컬 다운로드였다.
