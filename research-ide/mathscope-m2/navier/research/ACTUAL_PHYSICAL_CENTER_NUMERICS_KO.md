# 실제 물리점의 270개 도함수: 수치 계산과 원본 연결

## 현재 상태

2026-10-11의 원문 지수 교정을 반영한 원본 실행 **attempt4가 8/8, 관측 exit 0, timeout 없이 완료**됐다. 이 원본으로 설치·빌드한 runtime **`0.3.12`**에서 module **9/9**, 실제 Worker **11/11**과 같은 결과·replay를 확인했다. 공개 **v80 / `4831474d`**의 새 작업도 **COMPLETED, 10/10**을 반환했고 수학 결과 해시는 module·Worker와 같다. 아래 실행 표에 각각의 원본 기록을 연결한다.

공개 열한 표의 **676행·4210개 원본 값 셀·36개 표시 항목명**을 대조한 별도 검사 **8/8**, 저장과 내보내기를 확인했다. 교정된 common physical source6도 **8/8, 관측 exit 0**으로 완료됐다. 원래 요구와 source·수학 검토를 함께 집계하여 **현재 정의한 M2 수학 관문은 완료**했으며, M3로 진행할 선행 조건을 충족했다. M3의 실제 P7 구현·실행은 이 문서의 완료 근거에 포함하지 않는다.

브라우저의 파일 선택·재가져오기 직접 조작은 자동화 도구의 300초 gateway timeout 두 번으로 확인하지 못했다. 이를 앱의 가져오기 실패나 성공으로 판정하지 않는다. module·실제 Worker의 import/replay MATCH, 공개 저장·내보내기 및 실제 replay 파일 확보와 이 도구상 미확인을 구분한다.

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

도함수 270개와 별도로 **원래 coupled 진폭 값 네 개**도 표시한다. 새 물리점의 slow 좌표와 허용 대표점에서 각 원래 결합계를 `v=Ls/2`로 평가하여, 양·음 두 부호 가족마다 `wPlus`와 `wMinus`를 하나씩 계산한다. 선택한 실제 torus 점에서는 양의 가족 rectangle이 활성화되며 음의 가족 rectangle은 제외된다. 따라서 음의 가족의 합성 fast 좌표까지 이 중앙과 같다고 주장하지 않는다. 같은 부호 가족의 `wMinus`는 음의 부호 가족과 다른 개념이다. 값 자체에는 Ac·u·A0·Rsharp 인자를 곱하지 않는다.

`wPlus`는 이번 요청으로 다시 구한 정확한 유리수 구간이다. 같은 원본의 `B>=2^128`, `S>=B^1024`, `|wMinus/wPlus|<=B^260/S`와 `0<wPlus<1/2`를 결합하면 `|wMinus|<2^-97793`이다. 작은 양의 반경을 정확한 0으로 바꾸지 않고 요청한 bits의 dyadic 격자로 외향 반올림하여 `[-2^-bits, 2^-bits]`를 표시한다. 실제 원본 certificate의 네 성분 ID, 두 가족의 순서, typed 지수와 불변 원뿔 전제를 설치 단계에서 확인한다. [두 진폭 값의 상세 경계](ACTUAL_PHYSICAL_CENTER_NEGATIVE_MODE_VALUES_KO.md)는 계산된 값과 원본 인증의 역할을 따로 명시한다.

각 행의 기본 수치 표현은 `positiveExactScale × coefficient`다. 기본 요청의 계수 구간 폭은 정확한 유리수 허용오차 `1/1000000000000`과 비교한다. 비교식에서 계수가 0인 항도 실제 원본의 차이를 정확한 0으로 버리지 않고 양의 해석학적 오차 반경을 포함한다.

원본 단계는 완전한 covariance·Gaussian·Riccati·target·phase 경계와 실제 cutoff 적분, 유지한 tail, 조건수 및 산술 오차를 연결한다. 선택식에는 원래 FTC 상수와 첫 selector의 전체 source expression이 들어간다. 작은 지수함수를 계산 편의를 위해 정확한 0으로 바꾸지 않는다.

매우 크거나 작은 원래 양의 인자는 유리수와 중첩 exp로 이루어진 닫힌 수치 끝점으로 표시한다. **반복 로그 좌표의 폭**, **정규화 계수 구간 폭**, **원래 값의 절대·상대오차**는 서로 다른 계약이다. 화면에는 어느 좌표에서 폭을 검사했는지를 함께 표시한다. 원래 값의 균일 상대오차를 보장한다고 쓰지 않는다.

실행은 22개 profile/target 양의 인자를 다시 계산하고, 따로 원본 실행으로 고정한 selector·geometry·270개 정규화 배율의 구간을 확인한다. T와 slow cutoff 자체는 명시된 양의 보조 구간을 유지한다. 두 개별 인자가 요청 정밀도에 도달했다는 주장은 하지 않으며, 최종 배율의 별도 로그 좌표 폭을 검사한다.

마지막으로 새 계수 구간과 고정된 원래 양의 배율 구간을 외향 곱셈한다. 이 270개 곱 구간은 새로 계산한 결과이며, 음수 및 0을 가로지르는 구간도 부호를 유지한다. 모든 행을 기본 표에서 표시하고, 별도로 행 수를 줄이면 선택한 행과 원본 경로를 함께 줄인다.

관측 화면은 11개 표다. module·Worker 검사와 공개 DOM 대조에서 원본 경로가 있는 값 셀 4210개를 확인했으며, 표시용 항목명 36개는 이 수에 포함하지 않는다. 공개 표의 총 행 수는 676개다. 두 진폭의 값 네 개는 도함수 270개 수를 변경하지 않고 별도 표에서 확인한다.

## 실행 근거의 연결

원본 검증은 하나의 private source process에서 물리점·두 변분계·270개 body·오차·선택식·배율을 구성한다. 시작 및 나중에 가져오는 모듈의 해시를 따로 기록하고, 실행 종료 때 두 집합이 그대로인지 확인한다. 외부 observer가 정상 종료와 시간 제한 여부를 기록한다.

설치 단계는 원문 식 기록, 같은 physical certificate의 inverse `dr`, 모든 원본 도함수·배율 ID, certificate 파일과 소스 해시를 확인한다. 이전 식의 실행이나 바뀐 소스로 설치물을 만들 수 없다. 빌드 검사는 원본과 수치 알고리즘의 호환 바이트를 다시 확인한다.

각 브라우저 실행은 입력 정밀도에서 계수의 수치 전제와 조건수, 22개 인자 및 270개 외향 곱을 다시 계산한다. 원래 큰 source graph를 브라우저가 다시 구성했다거나 private token을 복구했다고 표시하지 않는다. 결과에는 고정된 원본 증거와 이번 새 계산의 범위를 각각 보존한다.

검증 경로는 [원본 실행](../tests/actual-physical-center-full-jet-staged-source-check.mjs), [설치](../tests/pin-physical-center-executed-evidence.mjs), [빌드 검사](../tests/verify-physical-center-installed-evidence.mjs), [실제 module·Worker·재현 검사](../../tests/physical-center-runtime-case.mjs)다. 현재 확인한 결과는 다음과 같다.

| 단계 | 관측 결과 | 실제 기록 |
|---|---|---|
| 교정된 원본 source4 | 8/8, exit 0, timeout 없음; 외부 관측 1600.967초 | [source4](evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt4.json), [process](evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt4-process.json) |
| 원문 물리 지도 | 바깥 계수 2와 같은 inverse의 `dr`를 직접 대조 | [식 (6.2) 기록](evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt4-original-torus-map-equation.json) |
| source4 설치·0.3.12 빌드 | 각각 관측 exit 0 | [설치](evidence/physical-center-runtime-20261011/physical-center-install-attempt1.json), [빌드](evidence/physical-center-runtime-20261011/physical-center-build-attempt1.json) |
| 새 module 수치 실행 | 9/9, 관측 exit 0 | [module](evidence/physical-center-runtime-20261011/physical-center-attempt1-module-runtime.json), [process](evidence/physical-center-runtime-20261011/physical-center-attempt1-module-process.json) |
| 실제 Worker·재현 | 11/11, 관측 exit 0; module과 동일한 결과, replay MATCH | [Worker](evidence/physical-center-runtime-20261011/physical-center-attempt1-worker-runtime.json), [process](evidence/physical-center-runtime-20261011/physical-center-attempt1-worker-process.json), [replay](evidence/physical-center-runtime-20261011/physical-center-attempt1-worker-replay.json) |
| 공개 v80 새 작업 | COMPLETED, 10/10; 같은 수학 결과 해시 | [게시 응답](evidence/physical-center-runtime-20261011/provider-publication-v80.json), [실제 공개 작업](evidence/physical-center-runtime-20261011/browser-v80-job.json) |
| 공개 열한 표의 원본 대조 | 8/8; 676행·4210개 원본 값 셀·36개 항목명 | [공개 DOM 대조](evidence/physical-center-runtime-20261011/browser-v80-panel-value-parity.json), [외부 관측](evidence/physical-center-runtime-20261011/browser-v80-panel-value-parity-process.json) |
| 공개 저장·내보내기 | 각각 `ok:true`; 실제 replay 파일 확보 | [저장 응답](evidence/physical-center-runtime-20261011/browser-v80-save-result.json), [내보내기 응답](evidence/physical-center-runtime-20261011/browser-v80-export-response.json), [M2-physical-center-v80-replay.json](evidence/physical-center-runtime-20261011/M2-physical-center-v80-replay.json) |
| 브라우저 파일 선택·재가져오기 직접 조작 | 도구 미확인: gateway timeout 두 번 | 앱 성공·실패로 해석하지 않음. module·실제 Worker의 import/replay MATCH는 별도 관측 |

source4 실행의 시작 119개와 late 131개 import를 구분하여 보존한다. numerical certificate SHA는 `46860eb0f5b4c4b891a4b2f1463e23d2e2ad75390ec12fe6cfb9751a5ed1266c`이고, module·Worker·공개 작업의 수학 결과 해시는 모두 `c65a77812b1d85a6530998004f763e6fc02cf52591f8970ab520ecf96664e28f`다. 원래 source와 새 계산의 해시는 서로 다른 역할을 가진다.

[최종 요구 대조](evidence/m2-final-requirements-20261011/M2_FINAL_GNUM_REQUIREMENTS_NS_AUDIT_KO.md)는 재개 시점의 w·pulse·H·weight·curl 요구와 현재 네 VALUE·270개 도함수를 비교하고, 정확한 구간 폭 및 원본 배율 결속을 확인했다. 이 읽기 검토를 추가 source 실행이나 전체 증명으로 합산하지 않는다.

## M2와 M3 범위

이 계산은 원래 허용 band에서 선택한 실제 물리점에 관한 수치 구간이다. 모든 label의 수치 표본, 전역 잔차의 수치 적분, 새 Lean 해석학 증명 또는 NS 전체 해법을 주장하지 않는다. 전체 curl·전역 공분산·배경 잔차와 flat-error의 원본 정리 연결은 별도의 [교정된 common source6](evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json)와 [완료 검토](evidence/common-physical-package-20261011/CORRECTED_COMMON6_COMPLETION_REVIEW_POSITIVE_STRESS_20261011_KO.md)에 결속됐다. 실제 N6 보정 전의 전체 NS 잔차를 flat하다고 바꾸지 않는다.

[M2 완료 판단](M2_COMPLETION_GATE_KO.md)은 이 새 수치 실행과 교정된 common physical source, 공개 runtime 및 재현 증거를 함께 검토해 현재 M2 수학 관문을 닫는다. 브라우저 파일 선택 도구의 미확인 한계는 따로 남긴다. 이전 원문 64개 PASS와 새 검사 수를 합산하지 않으며, 완료한 M2 다음에 M3의 **P7 → P8, Y5 → Y6 → Y7, N6 → N7 → N8** 순서로 진행한다. 각 패킷이 자체적으로 전체 M2 완료를 발급하지 않는다는 범위와 전체 집계의 완료 판단도 구별한다.
