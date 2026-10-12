# M3 P8 — 계산 구조, 가정, 유한 인증과 독립 검토

완료된 M2를 승계하고 P7의 8개 3D 화면을 공개한 뒤 이어가는 작업입니다.
M0–M2 원본과 P7 수학 계산 소스는 변경하지 않습니다. P8 계산은 별도 소스
목록과 SHA-256으로 결속됩니다. P7의 미해결 수학 조건은 그대로 남습니다.

## 실행과 저장

기존 `v0.3.1.html`의 P8 화면은 실제 계산을 요청할 때 정적 Worker를 실행합니다.
GitHub가 소스와 검증 기록의 저장소이며, 브라우저 계산에는 패키지 설치가
필요하지 않습니다. Worker는 한 번에 하나의 요청을 처리하고 90초에 종료됩니다.
요청은 256 KiB, 저장된 실행 기록은 32 MiB로 제한합니다.

20개 예제에는 객체 계약, 네 좌표 보기, ordinary/supersingular 비교,
다섯 비교 사상, 유한 F5/F7 인증서, 조건부 가정, 변조 검사, 후보 비교와
독립 검토 자료가 포함됩니다. 예제를 불러오는 것과 계산을 실행하는 것은 별도입니다.
실행 JSON을 가져오면 해시·소스·입력을 검사하고 새로 계산합니다.
가져온 `FORMAL_COMPLETE` 등의 권한은 채택하지 않습니다.

## P8-01–P8-08 범위

| 조건 | 구현 | 해석 경계 |
|---|---|---|
| 01 | 객체 종류·정확도·증거 방법의 독립 스키마, 입력·환경·가정 결속 | 스키마 통과는 정리 증명이 아님 |
| 02 | 차수–기저–valuation, Hodge/Newton, 소수–차수–weight, refinement tower | 실제 M2 계산을 표시하며 투영·카메라는 증명 권한 없음 |
| 03 | 계수환·base·순서·필요 가정을 명시한 비교 diagram | 외부 정리 적용은 새 Lean 증명과 구별 |
| 04 | 정수 미분·contraction·trace·유한 점계수·residue·Euler 소비자 | 고정 Lean 환경에서 실제 컴파일한 정확한 명제만 인정 |
| 05 | 고유 ID의 가정 장부, 목표 명제를 가정한 조건부 결과 | 장부 삭제만으로 무조건 정리가 되지 않음; 새 컴파일 필요 |
| 06 | bad prime·Frobenius 계수·truncation·비교 조건의 실제 재실행 | P7 영점·산술 rank의 수학 검증은 별도 Python/FLINT 경로 |
| 07 | 유리수 행렬의 특성다항식·rank·trace·정규화·유한 반례 | 동일한 유한 불변량은 무한 연산자 동일성의 증명이 아님 |
| 08 | P1–P3, P4, P5–P6, P7, P8의 독립 검토 자료 | 출시 검토와 RH/BSD 등의 해결은 별도 상태 |

후보 최소화는 명시한 동일 인덱스 principal compression 영역에서, 원래 실패한
불변량을 보존하며 작은 차원부터 탐색합니다. 정규화 차이는 별도의 정확한
형식 계수 증거로 표시합니다. 모든 가능한 수학적 반례 중 최소라는 뜻은 아닙니다.

## 3D 표시와 WebGL을 사용할 수 없는 환경

WebGL 렌더러가 생성되지 않거나 모듈을 가져오지 못하면 Canvas2D가 같은
유한 점과 선을 직교 투영합니다. 네 좌표 보기와 비교 사상 모두 축마다
독립적으로 정규화하며, 표시용 좌표를 새로운 수학적 데이터로 저장하지 않습니다.
HTML 축 설명·선택 목록·원본 표는 두 렌더러에서 같은 데이터를 읽습니다.

Canvas2D는 화면에 실제로 그린 점과 선분을 이용해 클릭을 판정합니다.
선택 결과에는 원래 chain basis, matrix column, map, source theorem과
출처가 남습니다. 점 표시 상한은 200개 또는 1,000개, 선은 최대 200개이며,
화면에서 생략한 항목도 선택 목록에서 정확한 원본을 확인할 수 있습니다.
화살표·점선·선택 십자는 표시 기호이며 수학적 인증서가 아닙니다.

방향키와 드래그로 회전하고 +/− 또는 버튼으로 확대합니다. Home은 시점을
초기화하며 대괄호 키는 항목을 선택합니다. Canvas2D의 터치 세로 스크롤과
핀치는 브라우저가 처리합니다. 화면 픽셀 비율은 최대 1.5로 제한하고,
변경이 있을 때만 한 프레임을 그립니다. 다른 경로로 이동하면 장면을 해제하고
돌아올 때 카메라를 복원합니다. 검사 기록에는 렌더러 종류, 실제 프레임,
카메라와 LOD가 표시됩니다. 계산 기록의 해시는 이 표시 조작으로 바뀌지 않습니다.

`evidence/p8-renderer-local-20261012.json`은 실제 mount 경로와 기록용
Canvas2D context를 사용한 7개 회귀 검사 및 전체 JavaScript 101개 검사의
성공 기록입니다. 이 로컬 검사는 공개 브라우저의 그림·클릭 검수와 구별합니다.

## 개발 검증

저장소 루트에서 다음 명령을 실행합니다.

```text
python research-ide/mathscope-m3/p8/tools/build_browser.py
node --test research-ide/mathscope-m3/tests/p8-*.test.mjs research-ide/mathscope-m3/p8/tests/*.test.mjs
python -m unittest discover -s research-ide/mathscope-m3/p8/tools -p 'test_*.py'
python research-ide/mathscope-m3/p8/tools/audit_lean.py --check-static
```

마지막 정적 검사는 Lean 실행이 아닙니다. `.github/workflows/p8-verification.yml`이
GitHub 실행 환경에서 고정 Lean/mathlib를 설치하고 실제 소비자와 음성 대조를
컴파일합니다. 실패한 실행도 로그와 함께 보존합니다. 저장된 감사 결과를 화면에
표시할 때는 `RECORDED_KERNEL_CHECK_MATCH`로 구분하며 브라우저에서 새로 Lean을
실행했다고 표시하지 않습니다.

`build_browser.py`는 원본 모듈의 정적 의존성만 묶습니다. `.lake`와 mathlib 설치
산출물은 브라우저 배포 목록에 포함하지 않습니다. 새 페이지나 외부 사이트
자산을 만들지 않고 기존 페이지의 고유 앵커에만 P8 화면을 추가합니다.

P8 및 M3 전체 완료는 아직 선언하지 않습니다. 원문 조건, 실제 실행 결과,
해결되지 않은 증명은 각각 독립적으로 검토해야 합니다.

## 2026-10-12 이어받은 구현과 새 검증

`P8_PROGRESS.json`의 원래 합격 문구를 유지하면서 실제 항목별 평가를 정적
빌드에 연결했습니다. 빌드가 모든 항목을 무조건 `IN_PROGRESS`로 덮어쓰던
부분을 수정했습니다. 완료된 항목에는 구체적인 증거 경로가 필요하고 원래
문구·순서·ID를 바꾸면 빌드가 거부됩니다.

실제 GitHub 실행 `38213076249`에서 유한 Lean 소비자와 조건부 감사가 모두 성공했습니다.
12개 정확한 명제, 8개 거짓 명제의 의미적 거부, 2,308개 import의 소스/산출물
폐포가 기록되어 있습니다. 압축파일의 SHA-256, 실제 로그, 현재 소스 바이트,
정확한 F5 입력을 대조하여 `evidence/lean-release.json`에 결속했습니다.
브라우저는 같은 입력에만 `RECORDED_KERNEL_CHECK_MATCH`를 표시합니다.
F7의 새 입력은 새 유한 계산과 Lean 소스를 만들지만 해당 입력의 컴파일을
주장하지 않습니다. 실제 실행은 PR #15의 merge checkout `4410aa76760a...`이고 head는
`b82d03727231...`입니다. 두 SHA를 원본 회수 기록에서 구별합니다.

이전 실행 `38209288204`의 조건부 감사 단계는 Lean 4.34.1의
`error(lean.unknownIdentifier)` 형식을 기존 파서가 읽지 못해 실패했습니다.
거짓 명제나 가정 제거 자체가 통과한 것으로 바꾸지 않고 그 실패 압축파일을
보존했습니다. 파서는 허용한 진단만 정확히 읽도록 수정했으며 다른 종류의
오류가 하나 더 있으면 계속 거부합니다. 변경하지 않은 공식 Lean 공유
라이브러리로 조건부 원본, 새 import, 정확한 axiom 한 줄 삭제를 재실행한
실제 종료 코드는 `0, 0, 1`입니다. 이 로컬 실행은 별도
`evidence/conditional-local-20261012/receipt.json`에 저장했으며 CI 기록과
혼합하지 않습니다. 이후 새 CI `38213076249`가 같은 수정 소스로 실제 조건부
원본·fresh import·axiom 삭제를 다시 실행하여 모두 기대한 결과를 냈습니다.
원본 artifact `11729803795`의 압축파일 해시는
`b2373daa628b2bd736f7a45ef6970b9c473e5b06841a0ab514aeb6a8f7635b91`입니다.
`evidence/conditional-lean-release.json`에는 이 변경하지 않은 CI 보고서가
결속되어 있습니다. 새 예제 `p8-conditional-ci`의 실제 엔진 결과는
`CONDITIONAL_ON_TARGET`과 `RECORDED_CI_SOURCE_MATCH`이며, 실제 `#print axioms`의
`MathScope.P8.Conditional.assumedTarget`과 장부가 일치합니다. 재실행 기록의
replay도 `MATCH`입니다. 이는 이미 기록된 공식 Lean 실행의 소스 일치 검사이며
브라우저에서 새 Lean을 실행하는 것은 아닙니다.

`theorem-backlog.mjs`는 원래 요구한 일곱 종류의 작은 인증 정리에 대해 명제,
입력 타입, 핵심 lemma, 인증서 소비 방식, 추가 axiom 정책과 실제 컴파일 상태를
제공합니다. P8 전용 chain-equivalence 소비자는 향후 후보로 남습니다.
현재 공식 문서에서 확인한 Witt-vector 및 homotopy/quasi-isomorphism 기반과
현재 배포 pin에서 확인하지 못한 고급 prismatic 비교정리를 구별합니다.

이어받기에서 검사한 Python 17개와 새 Canvas2D 검사를 포함한 JavaScript
101개가 모두 성공했습니다. 20개 실제 예제와 조건부 예제를 포함한 새 replay가
연결됩니다. 검사 개수는 원래 체크리스트의 8개 항목과 별개입니다.

공개 v87의 P8 직접 조작 검수 6개도 통과했습니다. 실제 Canvas 클릭에서
H⁴의 행렬 열 `['9']`, Newton의 정확한 slopes, p=7의 고유값 `49`,
refinement의 분모 `81`이 원본 출처와 함께 표시됐습니다. 카메라·LOD 조작과
M2 화면을 거쳐 돌아오는 동안 계산 기록 해시가 같고, 캔버스 한 개와 시점이
복구됐습니다. 조건부 예제는 실제 기록된 `#print axioms`, 가정 장부,
정확한 source axiom 삭제의 실패를 `CONDITIONAL_ON_TARGET`으로 표시했습니다.
이때 새 브라우저 Lean 실행을 주장하지 않는 것도 확인했습니다.

원래 P8 합격 기준은 이제 **7개 PASS, 1개 PARTIAL**입니다.
`evidence/p8-live-v87-20261012.json`은 다른 모듈의 감사 기록에서 P8 6개
검사를 변경 없이 복사하고, 검사 당시 파일 해시와 screenshot 해시를 결속합니다.
그 뒤 진척도 메타데이터를 갱신하면 전체 Worker 소스 목록의 해시는 바뀌지만,
검수한 렌더러와 수학 모듈은 바뀌지 않습니다.

남은 P8-06 조건은 P7에서 아직 없는 **유효한 rank-upper 인증서를 삭제하는
검사**입니다. 위조 인증서의 거부 기록을 이 조건의 통과로 바꾸지 않습니다.
P7은 이번 사용자 요청에서 제외되므로 그 rank 상계를 만들어 내거나 P7 상태를
수정하지 않았습니다. 이 의존성이 남아 있어 P8 및 M3 전체 완료는 선언하지 않습니다.
