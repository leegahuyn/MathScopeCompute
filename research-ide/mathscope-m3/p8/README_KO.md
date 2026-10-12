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

새 로컬 검사 결과는 JavaScript 94개, Python 17개 모두 성공이며, 20개 실제
예제와 조건부 예제를 포함한 새 replay가 연결됩니다. 해당 숫자는 원래 체크리스트의
8개 항목과 별개입니다. 현재 공개 페이지의 P8 직접 조작 검수와 P7에서 아직 없는
유효한 rank-upper 인증서의 삭제 검사는 각각 남아
있습니다. P7은 이번 사용자 요청에서 제외되므로 그 rank 상계를 만들어 내거나
P7 상태를 수정하지 않습니다.
