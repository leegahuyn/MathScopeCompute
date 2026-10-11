# 실제 물리점의 270개 도함수: 수치 계산과 원본 연결

## 현재 상태

2026-10-11의 원문 지수 교정을 반영한 원본 실행 **attempt4를 검증 중**이다. 이 문서는 준비된 구현의 계산 의미를 설명한다. 아직 새 실행의 완료, 공개 사이트의 새 Worker 검증 또는 M2 전체 완료를 주장하지 않는다. 공개 사이트의 확인된 버전은 `0.3.11/v79`이며, 아래 새 실행 종류는 준비 중인 `0.3.12`에 속한다.

실행 종류는 `ns.actual-physical-center-certified-numerics`다. 전체 식을 구성한 외부 원본 실행과, 브라우저가 그 증거에 연결하여 새로 수행하는 외향 수치 계산을 구분한다. 사용자가 가져온 JSON 결과는 원본 인증을 생성하거나 복원할 수 없다.

## 원문의 같은 물리점

원문 NS p.63, (6.2)의 식은

\[
d_r=2((1+h)\rho_g-h\kappa_s),\qquad
\rho_g=\frac{\log(4-\sqrt2)}{\log(4+\sqrt2)},\qquad
\kappa_s=\frac1{100000}.
\]

[공통 정의와 독립 식 검사](../source-radial-phase-exponent.mjs)는 실제 소스 그래프의 양수 `h`, 원래 `Tg`, `Lambda`, `rho`, `dr`와 `h → T → Md` 정의를 대조한다. 물리점 생성부는 검사한 같은 `dr`를 역지도에 전달하고 이 식의 기록을 `point.originalTorusMapBinding`에 포함한다. 역지도로 얻은 새 물리점에서 H, 역가중치, 두 coupled variation, 모든 도함수·배율의 소스 ID를 생성한다.

이전 구현은 마지막 항에 바깥 계수 2를 적용하지 않았다. 새 값과 이전 값의 비가 `M_new/M_old=epsilon^(-1/200000)`이므로 작은 `h`만으로 같은 물리점이라고 취급할 수 없다. 구 지도 attempt3의 **8/8·exit 0**은 [별도 범위 기록](evidence/physical-full-jets-20261011/physical-full-jet-attempt3-original-map-limitation.json)에 보존하며, 새 원문의 설치 근거로 사용하지 않는다.

## 270개 행의 의미

| 묶음 | 행 수 | 계산 대상 |
|---|---:|---|
| 가중 pulse | 84 | 두 부호의 세 성분, R/Z/T 1차·대칭 2차와 v·vv·Rv·Zv·Tv |
| 원래 pulse와 두 진폭 | 90 | 두 부호의 pulse 세 성분 및 a/wMinus 두 진폭, 각각 아홉 slow 도함수 |
| 공분산과 역가중치 | 54 | 두 부호에 대응하는 H의 두 성분 및 y, 각각 아홉 slow 도함수 |
| 실제 전체 curl | 42 | 세 벡터 성분, 네 방향의 1차 12개와 대칭 2차 30개 |

Slow 아홉 도함수는 `R, Z, T, RR, RZ, RT, ZZ, ZT, TT`다. 원래 함수와 고정한 대표점 변수를 구분하여 먼저 미분하고, 해당 물리점에서 값을 평가한다. 가중 pulse에는 공분산 역행렬, 역가중치의 양의 제곱근, 움직이는 진폭과 frame의 미분이 포함된다.

Slow 행에서 R이 r번 등장하면 표현 대상은 `Rsharp^r`를 **미분 후에 곱한 값**이다. 이를 무배율의 일반 R 편미분이라고 바꾸어 표시하지 않는다. 화면의 배율 적용 표에는 각 행의 `normalizedRadialPower`와 `derivativeInterpretation`을 함께 둔다.

전체 curl은 원래 potential의 sine·phase·cutoff를 완전히 미분한 뒤 지정한 phase 값을 적용한다. 각도 방향은 원통 직교 기저의 방향 미분이며, 단순한 각도 좌표 편미분과 같지 않다. 각도 혼합 Hessian에는 벡터 기저의 회전과 미분 방향 기저의 회전항을 모두 남긴다. 이 42개 행의 `physicalValue`는 원래 Q의 물리 좌표 인자까지 포함한다.

## 구간, 양의 배율과 오차

각 행의 기본 수치 표현은 `positiveExactScale × coefficient`다. 기본 요청의 계수 구간 폭은 정확한 유리수 허용오차 `1/1000000000000`과 비교한다. 비교식에서 계수가 0인 항도 실제 원본의 차이를 정확한 0으로 버리지 않고 양의 해석학적 오차 반경을 포함한다.

원본 단계는 완전한 covariance·Gaussian·Riccati·target·phase 경계와 실제 cutoff 적분, 유지한 tail, 조건수 및 산술 오차를 연결한다. 선택식에는 원래 FTC 상수와 첫 selector의 전체 source expression이 들어간다. 작은 지수함수를 계산 편의를 위해 정확한 0으로 바꾸지 않는다.

매우 크거나 작은 원래 양의 인자는 유리수와 중첩 exp로 이루어진 닫힌 수치 끝점으로 표시한다. **반복 로그 좌표의 폭**, **정규화 계수 구간 폭**, **원래 값의 절대·상대오차**는 서로 다른 계약이다. 화면에는 어느 좌표에서 폭을 검사했는지를 함께 표시한다. 원래 값의 균일 상대오차를 보장한다고 쓰지 않는다.

실행은 22개 profile/target 양의 인자를 다시 계산하고, 따로 원본 실행으로 고정한 selector·geometry·270개 정규화 배율의 구간을 확인한다. T와 slow cutoff 자체는 명시된 양의 보조 구간을 유지한다. 두 개별 인자가 요청 정밀도에 도달했다는 주장은 하지 않으며, 최종 배율의 별도 로그 좌표 폭을 검사한다.

마지막으로 새 계수 구간과 고정된 원래 양의 배율 구간을 외향 곱셈한다. 이 270개 곱 구간은 새로 계산한 결과이며, 음수 및 0을 가로지르는 구간도 부호를 유지한다. 모든 행을 기본 표에서 표시하고, 별도로 행 수를 줄이면 선택한 행과 원본 경로를 함께 줄인다.

## 실행 근거의 연결

원본 검증은 하나의 private source process에서 물리점·두 변분계·270개 body·오차·선택식·배율을 구성한다. 시작 및 나중에 가져오는 모듈의 해시를 따로 기록하고, 실행 종료 때 두 집합이 그대로인지 확인한다. 외부 observer가 정상 종료와 시간 제한 여부를 기록한다.

설치 단계는 원문 식 기록, 같은 physical certificate의 inverse `dr`, 모든 원본 도함수·배율 ID, certificate 파일과 소스 해시를 확인한다. 이전 식의 실행이나 바뀐 소스로 설치물을 만들 수 없다. 빌드 검사는 원본과 수치 알고리즘의 호환 바이트를 다시 확인한다.

각 브라우저 실행은 입력 정밀도에서 계수의 수치 전제와 조건수, 22개 인자 및 270개 외향 곱을 다시 계산한다. 원래 큰 source graph를 브라우저가 다시 구성했다거나 private token을 복구했다고 표시하지 않는다. 결과에는 고정된 원본 증거와 이번 새 계산의 범위를 각각 보존한다.

현재 준비된 검증 경로는 [원본 실행](../tests/actual-physical-center-full-jet-staged-source-check.mjs), [설치](../tests/pin-physical-center-executed-evidence.mjs), [빌드 검사](../tests/verify-physical-center-installed-evidence.mjs), [실제 module·Worker·재현 검사](../../tests/physical-center-runtime-case.mjs)다. 원본·Worker·공개 브라우저·저장 후 재현이 끝나면 관측한 결과를 이 문서에 추가한다.

## M2와 M3 범위

이 계산은 원래 허용 band에서 선택한 실제 물리점에 관한 수치 구간이다. 모든 label의 수치 표본, 전역 잔차의 수치 적분, 새 Lean 해석학 증명 또는 NS 전체 해법을 주장하지 않는다. 전체 curl·전역 공분산·배경 잔차와 flat-error의 원본 정리 연결은 별도의 common physical package 검증에 남긴다. 실제 N6 보정 전의 전체 NS 잔차를 flat하다고 바꾸지 않는다.

[M2 완료 판단](M2_COMPLETION_GATE_KO.md)은 이 새 수치 실행과 교정된 common physical source, 공개 runtime 및 재현 증거를 함께 검토한다. 이전 원문 64개 PASS와 새 검사 수를 합산하지 않으며, 완료 조건을 확인한 후 M3의 P7 → P8, Y5 → Y6 → Y7, N6 → N7 → N8 순서로 진행한다.
