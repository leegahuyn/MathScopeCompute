# M3 P8 — 계산 구조, 가정, 유한 인증과 독립 검토

완료된 M2를 승계하고 P7의 8개 3D 화면을 공개한 뒤 이어가는 작업입니다.
M0–M2 원본과 P7 수학 계산 소스는 변경하지 않습니다. P8 계산은 별도 소스
목록과 SHA-256으로 결속됩니다. P7의 미해결 수학 조건은 그대로 남습니다.

## 실행과 저장

기존 `v0.3.1.html`의 P8 화면은 실제 계산을 요청할 때 정적 Worker를 실행합니다.
GitHub가 소스와 검증 기록의 저장소이며, 브라우저 계산에는 패키지 설치가
필요하지 않습니다. Worker는 한 번에 하나의 요청을 처리하고 90초에 종료됩니다.
요청은 256 KiB, 저장된 실행 기록은 32 MiB로 제한합니다.

19개 예제에는 객체 계약, 네 좌표 보기, ordinary/supersingular 비교,
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
