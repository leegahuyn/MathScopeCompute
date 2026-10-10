# M2 NS 미분 확장 사용법과 검증 범위

M2 runtime `0.3.8`은 기존의 실제 1차 pulse sensitivity에 공분산·가중치 1차 미분, R/Z/T의 2차·혼합 pulse 미분, 조건부 local full curl을 추가한다. **사용자가 요청한 M2 추가 수학 범위의 전체 완료는 아직 아니다. M3는 대기 상태다.** 완료 판정은 [M2 완료 관문](M2_COMPLETION_GATE_KO.md)을 따른다.

## 화면에서 실행하기

기존 [MathScope M2](https://project29770.websitepublisher.ai/v0.3.1.html#research-m2/ns)를 열고 M2의 NS 분야에서 예제를 선택한다. 새 예제는 다음 세 kind에 대응한다.

| Kind | 제공하는 결과 | 현재 실행 범위 |
| --- | --- | --- |
| `ns.actual-covariance-sensitivity` | 원래 두 sign의 theta/z/mass 적분, 전체 leading target, inverse weight의 1차 미분식과 적분 잔여항 | `ell=1`, R/Z/T 중 한 방향, `terms:0` |
| `ns.actual-pulse-jet` | 두 sign의 R/Z/T 1차 및 RR/RZ/RT/ZZ/ZT/TT 2차·혼합 미분, 움직이는 끝점, 실제 coefficient로 만든 FTC norm과 수렴 tail | `ell=1`, 전체 R/Z/T, `terms:0` 또는 `terms:1`; 기본값은 1 |
| `ns.actual-full-curl` | 원래 phase·pulse·covariance weight·cutoff·원통 기저항과 `sqrt(epsilon)`을 보존한 local potential의 전체 curl | `ell=1`, `terms:0`, 양의 weight와 비영 분모를 갖는 열린 정의역에 조건부 |

결과 패널은 각각 5개, 4개, 3개다. 표의 각 셀은 실제 certificate의 source path와 연결된다. `ns.actual-pulse-jet`의 `terms:1`은 첫 ordered-integral 보정항까지의 **정확한 적분식**을 뜻한다. 적분을 정밀한 십진수로 계산했다는 뜻은 아니다. 수치로 평가하지 않은 식에 물리 그래프의 숫자 좌표를 만들어 붙이지 않는다.

상단의 **「NS 추가 구현 범위 · M3 진행 조건」**에서 완료 조건을 확인할 수 있다. **「저장한 M2 실행 기록 가져오기」**는 실행 기록의 JSON을 검사하고 재실행하는 기능이다. 새 기능을 처음 실행할 때는 NS 예제를 선택하면 된다. 이전 버전의 실행 기록은 환경 해시가 달라질 수 있으므로, 동일 환경의 재현 비교와 입력만 불러오기를 구분한다. 가져온 파일의 검증 등급은 자동으로 신뢰하지 않는다.

## 실제로 검증한 것

[실행 기록](evidence/differential-extension-20261011/release-validation.json)에 명령, 소스·worker·compiler·결과 해시와 적용 범위를 연결했다.

- 실제 공분산 R source 검사 5개, 실제 전체 R/Z/T `terms:1` pulse jet 검사 7개, 실제 local full curl source 검사 5개가 통과했다.
- 세 새 kind를 배포용 worker bytes로 실행했고, 각각의 compiler hash가 독립 source 실행과 일치했다. 공분산은 source/worker의 수학 결과와 certificate hash도 일치했다.
- 집중 회귀 검사 43개, 실행 기록 가져오기·Foundation 세션 결합 검사 26개, WebMCP/request 사전 검사 2개가 통과했다. 이 수를 원문 기준 64개에 더하지 않는다. 별도로 보관한 로그들에는 중복 검사도 있다.
- [Lean 감사](../lean/evidence/audit.json)는 공식 pinned Lean `4.34.0-rc2`에서 14개 주정리를 컴파일하고 fresh import 및 선언별 공리 감사를 수행했다. 잘못된 `False` 주장, 혼합 교차항 누락, 원통 기저항 누락은 모두 거절됐다. 양성 소스에는 `sorry`나 새 공리를 넣지 않았다.

Lean 결과는 미분·행렬 inverse·혼합 변분·curl/divergence의 보편적인 대수 보조정리다. 원래 source의 모든 해석학적 가정, covariance 양성, 전역 NS 잔차를 Lean으로 증명했다는 결과가 아니다. 실제 공개 브라우저의 검사·게시 상태는 위 실행 기록의 `publication`과 `browserQA`를 함께 확인한다.

## M3로 넘어가기 전에 남은 것

1. **G-POS:** 실행한 member의 실제 covariance 정의역, 비영 determinant, 양의 weight와 제곱근 경계의 smooth extension.
2. **G-NUM:** 원래 적분·Volterra tail·quadrature·반올림·inverse 조건수를 모두 포함한 엄밀한 도함수/weight/curl 수치 구간.
3. **G-CURL:** local curl을 모든 slow partition과 label, physical map에 걸쳐 조립하고 support 경계까지 연결하는 증거.
4. **G-N4:** 같은 source의 background·stress와 실제 물리 잔차를 연결하는 모든 필요한 차수의 flat-error 및 점근 잔여항 경계.
5. **G-N5:** 실제 primary wave의 모든 교차항·harmonic·Gaussian label tail을 유지한 잔차와 N6에 넘길 입력.

기존 원문 64개 항목의 범위가 명시된 PASS는 유지한다. 위 다섯 조건이 닫히면 M3를 원문의 선행 조건에 맞춰 `P7→P8`, `Y5→Y6→Y7`, `N6→N7→N8` 순으로 진행한다. M2의 조건부 결과를 전체 완료로 표시해 이 관문을 건너뛰지 않는다.
