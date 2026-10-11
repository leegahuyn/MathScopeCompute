# 공개 v80 표값의 독립 정확 일치 검증

검토자: `/root/sensitivity_kernel`  
범위: 원래 실제 source4에서 파생한 v80 수치 기능의 저장된 실제 DOM과 완료된 브라우저 결과  
판정: **PASS — 8개 검사, 실제 관측 exit 0**

11개 패널의 676행에서 **원본 값 셀 4,210개와 표시용 라벨 36개가 전부 정확히 일치**했다. 도함수 식을 새로 생성하거나 수치 작업을 재실행하지 않았다. 이미 완료된 Module/Worker 실행, 실제 공개 페이지의 브라우저 job 및 그 job으로 표시한 DOM을 교차 비교했다.

## 실제 관측 자료

- 페이지: `https://project29770.websitepublisher.ai/v0.3.1.html#research-m2/ns`
- 공개 버전: **v80**, version hash `4831474d`
- DOM 수집 시각: `2026-10-11T15:13:03.338Z`
- 브라우저 job: `m2-job:mv3ybxev:1`
- 입력: 원래 profile, 192 bits, tolerance `1/1000000000000`, cutoff 4096 cells, target 1024 cells
- 경량 검증: Node heap 한도 384 MiB; 실제 peak RSS **121,913,344 bytes**

DOM은 부모 agent가 브라우저에서 각 패널을 선택해 수집한 자료다. 이 검증 스크립트가 새 브라우저를 열었다고 기록하지 않는다. 화면 픽셀이나 모든 화면 크기를 다시 시각 검사한 기록도 아니다.

## 값과 경로의 삼중 대조

각 실제 `<td>`의 `textContent`를 다음 세 경로와 모두 비교했다.

1. 완료된 Module/Worker 실행 기록의 동일 `panelRows` 값
2. 동일 browser job을 읽기 전용으로 투영한 현재 표의 값
3. 각 `cellSourcePaths`로 browser job의 원래 필드를 직접 찾아 얻은 값

문자열 생성은 실제 renderer의 `scalarText` 규칙을 썼다. 유리수와 exp/neg 끝점을 binary64로 계산하거나, 긴 문자열을 자르거나, 공백을 정규화해서 맞추지 않았다. 원본 경로가 없는 36개 셀은 scope 항목의 **표시용 이름**으로 별도 집계했으며 원본 수치 증거로 세지 않았다.

| 패널 | 행 | 원본 값 셀 | 표시 라벨 |
|---|---:|---:|---:|
| physical-center-weighted | 84 | 504 | 0 |
| physical-center-raw | 90 | 540 | 0 |
| physical-center-covariance | 54 | 324 | 0 |
| physical-center-physical | 42 | 252 | 0 |
| physical-center-positive-scales | 22 | 154 | 0 |
| physical-center-selector-scales | 44 | 308 | 0 |
| physical-center-coarse-point-factors | 2 | 10 | 0 |
| physical-center-absolute-values | 28 | 168 | 0 |
| physical-center-unscaled-derivatives | 270 | 1890 | 0 |
| physical-center-coupled-mode-values | 4 | 24 | 0 |
| physical-center-evidence | 36 | 36 | 36 |

각 패널의 열 이름과 순서, 행 순서, 행의 `sourcePath`, 표의 `sourceJobId` 및 `inputHash`도 일치했다. 270행짜리 배율 적용 도함수 표를 포함해 모든 표의 `displayedRows=totalRows`, `truncated=false`였다. 수집된 11개 선택 상태 각각에서 문서 너비와 scrollWidth는 1348로 같았고, 표 너비는 문서 안에 있었다. 수집된 각 표 첫 셀의 `white-space:pre-wrap`, `overflow-wrap:anywhere`도 확인했다. 이 관측을 수집하지 않은 모든 셀·화면 폭에 대한 CSS 검증으로 확대하지 않는다.

셀 문자열, 행 source path, 행 순서, truncated metadata를 바꾼 독립 메모리 복사본 4종은 모두 거부됐다. 원본 DOM 파일은 변경하지 않았다.

## 브라우저 결과와 Module·Worker 수치 해시

브라우저 job JSON의 전체 result, mathematical body, 결과 certificate와 입력의 SHA를 직접 다시 계산했다. 완료된 Module·Worker 기록의 certificate SHA와 mathematical hash가 브라우저의 재계산된 값과 일치한다.

- mathematical hash: `c65a77812b1d85a6530998004f763e6fc02cf52591f8970ab520ecf96664e28f`
- certificate SHA-256: `2c6c2b329f6d011217a24108e860b8be7f274a888b2f1e9c13677b1afe1e6d71`
- input SHA-256: `38f706b5b2858a3147678fee155d9a6652f6fab15a2624a807e1cc2db1baa5eb`
- 고정된 원래 source4 수치 certificate SHA-256: `46860eb0f5b4c4b891a4b2f1463e23d2e2ad75390ec12fe6cfb9751a5ed1266c`

완료된 Module과 Worker의 `panelRows` 및 runtime 파일 목록이 서로 같고, 목록의 현재 15개 파일도 해당 해시와 일치한다. 브라우저와 Node의 환경 hash는 동일해야 한다고 가정하지 않았다. 서로 다른 환경에서 이 동일 입력의 정확 수치 결과가 일치한다는 관측이다.

## 수학 증거와 현재 표시 범위

이 검증은 원본 actual source4의 전체 그래프를 재구성하거나 새로운 private 인증을 만들지 않는다. 고정된 원본 실행, 현재 수치 계수·구간 곱, 공개 DOM의 표시 값은 구분된다. 설치된 세 source 값 패널의 `PINNED_EXECUTED_SOURCE_VALUES`, 새 곱셈 표의 `FRESH_INTERVAL_PRODUCTS_WITH_PINNED_SCALES` 정책은 현재 presentation 코드에서 별도로 확인했다. 이 numerical-origin 정책을 DOM attribute로 직접 수집한 것이라고 주장하지 않는다.

Pulse 도함수의 고정 R# 거듭제곱, 반복 로그 좌표의 폭, 원래 값의 상대오차가 보장되지 않는다는 설명은 출력 문자열 자체와 함께 대조됐다. 두 raw 모드 값은 새 slow 좌표·대표점에서 각 결합계의 v=Ls/2 값을 뜻한다. 음의 가족 rectangle도 실제 물리점에서 중앙이라고 주장하지 않는다.

`wholeGNUMComplete`, `userRequestedM2Complete`, `globalResidualNumericallyEnclosed`, `newLeanKernelProof`, `M3Started`는 모두 false임을 확인했다. 이 공개 표값 검증만으로 그 범위를 완료로 변경하지 않는다. 앞서 봉인한 36/36 source4 독립 검토 기록도 수정하지 않았다.

## 불변 결과물

- `verify-browser-v80-panel-value-parity.mjs`: `8f4b42ccc868af5ea48abc68ff9da0ec739635b21e8fed0d9f17f02f1de5378e`
- `browser-v80-panel-value-parity.json`: `93cc1fcd3b7139461f4d6f89ee25db792ec28f09037368d3518b2c875b31b0c3`
- `browser-v80-panel-value-parity.log`: `405afd677e2d377375846d4f3279556ef1478d5ec04cb165fced14b70aa6953b`
- `browser-v80-panel-value-parity-process.json`: `d92fde2cd0be03b5196d5afca16c76fdedde9889ab8dad688b49b77716a021e4`

원본 DOM/브라우저 job/Module/Worker 파일의 SHA는 결과 JSON에 모두 포함돼 있다. 출력이 이미 있으면 스크립트는 덮어쓰지 않는다. 실제 검증은 첫 실행에서 8/8 통과했다.
