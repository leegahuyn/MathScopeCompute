# M2 추가 수학 범위: 실제 검증 결과와 M3 진입 조건

## 현재 판정

**M2의 추가 구현과 검증을 계속 진행 중이며, 사용자가 요청한 모든 수학 범위의 완료 판정과 M3 시작은 아직 하지 않았다.** 최초 복구점 `8a0046c5` 이후의 저장 기록을 이어가고 있다. 현재 실제 source·생성된 Worker·공개 v79 브라우저에서 확인한 실행 코드의 버전은 **`0.3.11`**이다. 원래 terminal F와 아홉 도함수의 새 실행을 [terminal F runtime 기록](ACTUAL_TERMINAL_FIELD_RUNTIME_KO.md)에, 이전 `0.3.10/v77` 실행은 [heat runtime 기록](evidence/heat-runtime-20261011/HEAT_RUNTIME_RELEASE_KO.md)에 각각 보존한다. 아래 각 절의 이전 공개 버전은 해당 저장 시점의 기록이다.

표시용 `ell=1` 확장의 지정점에는 비음수 공분산 가중치 쌍이 존재하지 않는다는 원본 결속 서면 증명이 있으므로, 원래 양의 h를 유지한 실제 작은 q 영역에서 양성을 구성한다. 공통 family·모든 유한 차수 구성과 실제 유한 물리 잔차에 더해, 두 부호의 가중 radial pulse의 **R/Z/T 1차·2차·혼합 미분 18개**를 원래 중심에서 수치 구간으로 감쌌다. 전체 물리 curl·전역 잔차 통합 및 fast·물리 수치 구간은 계속 검증한다. 원래 terminal F의 공개 실행과 다른 pulse·공분산 source 결과의 공개 실행을 혼동하지 않는다.

기계 판독 판단은 [M2_COMPLETION_GATE.json](M2_COMPLETION_GATE.json), 이번 실행·배포 기록은 [continuation evidence](evidence/m2-continuation-20261011/)에 있다. 이 문서와 JSON은 **범위가 명시된 감사 판단**이다. 상태값·파일명·테스트 개수·hash만으로 모든 해석학적 명제가 자동 증명되는 것은 아니다.

## 1. 복구한 저장점과 이전 결과

사용자가 인용한 `0d846135`와 `479af296` 이후의 [구현 cc075ec6](https://github.com/leegahuyn/MathScopeCompute/commit/cc075ec661b573671ac43a88cf30ccdc2dbb9bd8), [검증 기록 8a0046c5](https://github.com/leegahuyn/MathScopeCompute/commit/8a0046c547af4cccdbecae81fe647d414dd75d3f)를 확인하여 그 지점에서 재개했다. `ell=1`, 1차 R/Z/T, `terms:0`만 있던 예전 단계로 되돌리지 않았다.

재개 시점에 이미 확보한 결과는 다음과 같다.

- 실제 공분산과 전체 target의 R/Z/T 1차 미분 및 조건부 inverse weight 미분.
- sign별 20성분 R/Z/T 변분계, RR/RZ/RT/ZZ/ZT/TT, 실제 FTC 상수, `terms:1` ordered-integral 보정과 별도의 수렴 tail.
- 원래 moving frame·weight·phase·cutoff·원통 기저항을 포함한 조건부 local full curl.
- 공식 Lean `4.34.0-rc2`에서 검증한 대수 보조정리 14개와 보조 선언 2개, fresh import·axiom 감사 및 음성 대조 3개.

이 실행들의 상세 provenance는 [재개 시점 JSON 원본](evidence/m2-continuation-20261011/at-resume-M2_COMPLETION_GATE.json)과 해당 [불변 커밋의 설명](https://github.com/leegahuyn/MathScopeCompute/blob/8a0046c547af4cccdbecae81fe647d414dd75d3f/research-ide/mathscope-m2/navier/research/M2_COMPLETION_GATE_KO.md)에 보존한다. 과거의 Worker·브라우저 hash를 현재 `0.3.9`의 새 실행 hash라고 기록하지 않는다.

원문 Blueprint의 SHA-256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`, Handoff는 `e5a3ff18db7c804ca972cf7105068b9f8c9ff49d4e5a3535184ac88fd5872cc5`이다. 원문 64개 항목의 기존 범위 내 `64 PASS`는 그대로 보존한다. 새 테스트·서면 증명·Lean 선언 수를 이 64개에 더하지 않는다.

## 2. 실제 cutoff 적분의 엄밀한 수치 구간

[actual-cutoff-mass-enclosure.mjs](../actual-cutoff-mass-enclosure.mjs)는 원래 smooth step σ를 유지하여

\[
I=\int_0^1\sigma(s)^2\,ds,\qquad
\int\chi^2=r_0(1/2+I),\qquad
\int\psi^2=L_s(1/2+I/10)
\]

를 계산한다. BigInt 외향 반올림, 8차 Taylor 적분, 끝점 tail, 구적과 반올림의 별도 오차 예산을 사용한다. 정밀도는 96–512 bits이며 허용오차는 정확한 유리수 문자열로 입력한다. 이 허용오차는 **정규화 σ² 적분 구간의 폭**에 적용된다.

실제 원본의 양수 h를 유지하면 ell=1에서

\[
2^{-32}<L_s=2^{-32+h}<2^{-32}(1+2^{-4095})
\]

이다. Ls를 한 점으로 대체하지 않고, 그 구간과 정규화 적분 구간의 정확한 유리수 곱으로 전체 종방향 질량도 감싼다. 고정 label에서 이 두 cutoff 질량 인자의 R/Z/T 1차·2차 미분은 정확히 0이다. 이는 전체 H나 pulse의 도함수가 0이라는 뜻이 아니다.

실제 source 검사에서 얻은 바깥쪽 표시 구간은 다음과 같다. 저장된 원본 certificate에는 더 정밀한 유리수 양 끝점이 있다.

| 계산량 | 외향 표시 구간 |
|---|---|
| I | [0.47059326157186788, 0.47059326157194201] |
| 횡방향 질량 | [5.6495963454471661, 5.6495963454475976] × 10⁻¹¹ |
| 종방향 질량 / Ls | [0.54705932615718678, 0.54705932615719421] |
| 전체 종방향 질량 | [1.2737217502602999, 1.2737217502603173] × 10⁻¹⁰ |

[전체 설명](ACTUAL_CUTOFF_MASS_ENCLOSURE_KO.md)과 [실제 source 검증](evidence/m2-continuation-20261011/actual-cutoff-mass-enclosure-validation.json)을 함께 읽는다. **전체 H, 실제 Volterra 진폭·도함수, inverse·sqrt weight, curl의 수치 구간은 아직 없다.** `wholeGNUMComplete=false`이다.

## 3. 표시 band와 원문 인증 영역의 차이

[band 판정](ACTUAL_COVARIANCE_BAND_ADMISSIBILITY_KO.md)은 원래 graph의 h와 실제 bounds producer를 직접 결속한다.

\[
h=\exp[-8002(\exp(1048576)+10)],\quad 0<h<2^{-4096},
\]

\[
\ell_{\min}=\left\lceil\max\{8,S_{\min},(64/h)^2\}\right\rceil
>2^{8204}>128,\qquad q_*=2^{-\ell_{\min}-4}.
\]

따라서 현재 지원하는 유한 표시 band `1..128`은 **이 bounds producer가 선택한 명시적 충분조건 영역 밖**이다. 이 일반 부등식을 한 source에서 결속했다고 128개 graph를 모두 실행한 것으로 세지 않는다. 지정되지 않은 원문의 ell₀·q_big을 이 구현의 선택식과 동일하다고 가정하지 않는다.

별도로 원래 canonical cutoff의 `log(c1) >= log(2)/h`, 모든 후속 cutoff의 doubling을 사용하면 표시 범위에서는 모든 양의 order 항과 그 미분이 정확히 소멸한다. 이 결론은 `terms:0`을 exact limit으로 해석한 것이 아니라, 원래 cutoff의 flat zero branch에서 나온다. 원래 h는 계속 양수다.

band 판정 자체는 determinant 또는 weight 부호를 결정하지 않는다. 그 항목은 `UNKNOWN`을 유지한다.

## 4. ell=1에서 실제로 확인한 양성 장애

[원본 결속 서면 증명](ACTUAL_COVARIANCE_ELL_ONE_OBSTRUCTION_KO.md)은 slow point와 대표점을 다음 값으로 함께 고정한다.

\[
\ell=1,\ s=1,\ \eta=0,\ X=X_be^{-1/4},\quad
R=\sqrt{2X},\ Z=0,\ T=1.
\]

원래 heat와 terminal field를 유지하면 `h/2 < α < h`, `0 < F < 1`을 얻는다. 원래 moving-normal pressure를 포함한 r/theta ODE의 정확한 2×2 환원, 실제 초기 frame, 짧은 원래 pulse 길이와 Gronwall을 사용하여 두 sign 모두 전체 pulse interval에서 `t_r > 0 > t_θ`를 얻는다. 원문 A.54의 같은 실제 terminal target은 `T_θ > 0`이다. 따라서

\[
H_{\theta,+}<0,\quad H_{\theta,-}<0,\quad T_\theta>0,
\]

\[
y_+,y_-\ge0\quad\Longrightarrow\quad
(Hy)_\theta\le0<T_\theta.
\]

즉 이 표시 확장의 지정점에서 `Hy=T`를 만족하는 비음수 weight 쌍은 존재하지 않는다. **det(H)의 비영성·부호와 각 inverse weight의 개별 부호는 결정하지 않았다.** 이는 전체 H의 정밀 수치 구간으로 얻은 반례나 Lean kernel 증명도 아니다.

이 점의 q는 1/2이다. 원문에는 `q < q_big <= 2^(-ell0)`가 있으므로 모든 `ell0 >= 1`에서 원문의 active 영역 밖이다. **원문 큰 band 정리의 반례가 아니다.** 전체 M2 목표를 부정하는 대신, 현재 표시용 ell=1을 그대로 양성 계산 영역으로 사용하는 경로가 성립하지 않음을 확인한다.

[12개 실제 source 검사](evidence/m2-continuation-20261011/actual-covariance-ell-one-obstruction-source-attempt1.json)는 56개 원본 결속, 10개 정확 ODE 항등식, 12개 유리수 부등식과 연결된다. 그 개수들을 서로 독립인 90개 수학 정리라고 합산하지 않는다. [최종 독립 검토](evidence/m2-continuation-20261011/ELL1_COVARIANCE_OBSTRUCTION_FINAL_INDEPENDENT_REVIEW_KO.md)는 원래 A.13의 scalar 계산과 실제 52개 import SHA도 대조했다.

## 5. 실제 물리 curl과 배경 미분 상수

### 고정 label의 물리 curl

[물리 curl 모듈](../actual-physical-full-curl.mjs)은 원래 potential에 **원래 slow cutoff를 먼저 곱하고** physical map을 거쳐 curl을 적용한다. 특히

\[
\operatorname{curl}(\eta_\beta C)
=\eta_\beta\operatorname{curl}C+\nabla\eta_\beta\times C
\]

의 두 항을 모두 보존한다. 원래 두 rectangle, 2,250색 palette, 켤레의 1/2 계수, pressure와 비영 eikonal defect를 유지한다. 고정 label의 cutoff는 원래 χ_j와 정확히 같은 세 이웃 항 및 flat zero guard로 표현하여 floor를 미분하지 않는다. 실제 R/Z/T cutoff 도함수 본문도 생성하고 대조했다.

결과는 **한 실제 고정 label의 조건부 물리 curl**, 6개 물리 성분과 2개 조건부 divergence 행이다. 모든 label의 합, 양의 weight 정의역, 원래 큰 band palette separation, 전역 divergence와 NS 잔차까지 완료된 것은 아니다. [설명](ACTUAL_PHYSICAL_FULL_CURL_KO.md), [실제 검증](evidence/physical-bridge-20261011/physical-curl-validation.json)을 보관한다.

### 실제 양의 order 배경의 물리 미분 상수

[physical seminorm 모듈](../actual-background-physical-seminorms.mjs)은 실제 moment 보정된 n=1,2 계수를 사용한다. Cartesian 축을 포함한 직사각형에서 모든 anchored face를 보존한 FTC를 적용하고, 실제 공간·시간 연쇄법칙의 Leibniz 항을 유지한다. 횡방향 a회·축방향 k회·시간 l회의 정확 지수 손실 `a/2 + Dk + l`을 미분 단계까지 보존한다.

실제 m≤2 실행은 240개의 FTC 상수와 n=2의 별도 weighted stress 상수를 생성했다. n≥2의 실제 내부 support에서는 원래 ζ가 양수이므로 `T_n/ζ`를 먼저 만들고 미분한다. n=1은 terminal 경계에 닿을 수 있어 이 방법으로 처리하지 않는다.

기존 정규화 조건, 새 physical 조건과 weighted 조건을 함께 만족시키는 **별도의 강화 cutoff 선택식**을 만들었다. 기존 canonical background에 이미 적용한 것으로 기록하지 않는다. 그 선택식의 실제 재조립, n=1 경계 추정, 무한합·미분·비선형 곱의 교환과 전역 잔차는 남아 있다. [상세 유도와 실행](ACTUAL_BACKGROUND_PHYSICAL_SEMINORMS_KO.md)을 참고한다.

## 6. 이번 검증의 개수와 범위

| 실제 실행 | 통과 결과 | 범위 |
|---|---:|---|
| cutoff 수치 kernel / 실제 source | 7/7 · 10/10 | 원래 두 cutoff 인자와 Ls의 엄밀 구간 |
| band seal + ell=1 obstruction 실제 source | 12/12 | 한 실제 graph의 원본 결속·정확 대수·서면 증명 연결 |
| obstruction kernel | 6/6 | ODE identity, 유리수 여유, source 비교 도구의 음성 대조 |
| physical seminorm kernel / 실제 source | 5/5 · 8/8 | 실제 n=1,2·m≤2, 강화 selector 두 단계 |
| physical curl kernel / 실제 source | 7/7 · 5/5 | 원래 cutoff·physical map·pressure의 고정 label 연결 |
| 기존 integer partition 회귀 | 8/8 | 기존 partition 보존 |
| 최종 Worker·기존/신규 화면·입력 경계 검사 | 24/24 | 현재 번들, replay 신뢰 경계, null·과대 tolerance, 표시 값 결속 |
| 신규 두 예제의 source·Worker 대조 | 4회 exit 0 | 각 예제의 mathematical hash 및 certificate hash 일치 |

두 신규 예제는 **5개 패널, 60개 원본 값 셀**을 가진다. 항목명 55개는 표시용이므로 `allCellsSourceBound=false`이다. 원본 경로가 있는 값 셀만 정확히 비교했다고 기록한다. 함수식 ID로 물리 수치 좌표를 생성하지 않는다.

source 실행은 별도 process에서 수행하고 실제 코드 SHA, 원본 graph SHA, 입력, 시간, peak RSS와 실패·음성 대조를 보관했다. 이전 실패·취소·timeout은 삭제하거나 의도한 음성 대조 PASS로 바꾸지 않았다. preflight 경계 두 건을 수정하면서 번들이 바뀌었으므로 정상 두 예제도 **최종 번들로 다시 실행**했다. 수정 전 runtime 기록은 `runtime-before-input-guards/`에 남긴다.

이 표의 일부 kernel 검사는 다른 회귀 묶음에도 포함된다. 행을 합쳐 총 수학 정리 수로 만들지 않는다. 원문 64개 기준과 과거 Lean 14개 선언 역시 별개다.

## 7. M2 전체 완료에 남은 관문

| 관문 | 현재 확보한 부분 | 남아 있는 의무 |
|---|---|---|
| G-POS | 표시 영역의 비멤버십·ell=1 장애, 새 작은 q 외측 양성 weight·flat sqrt 연장, 실제 n1이 남는 한 band 전체 annulus 배경 | 새 전체 annulus H, 안쪽 경계, 모든 box와 label, 최종 Γ 선택 |
| G-NUM | 원래 cutoff 질량·Ls, 지정점 heat 및 전체 terminal F와 아홉 slow jet의 엄밀 구간 | 전체 영역 F·pulse·도함수·공분산 H·weight·curl의 합산 truncation/heat/quadrature/rounding 오차 |
| G-CURL | 원래 cutoff·physical map을 포함한 실제 fixed label의 조건부 curl | 원래 허용 bands의 모든 label, support·경계 연장·전역 divergence |
| G-N4 | 실제 유한 physical·weighted 상수, 강화 selector 실제 유한 적용, 전역 M0/M1/M2 primitive, 모든 유한 차수의 양의 order 속도 tail 구성법 | 전체 pressure convolution·응력 취소, 모든 조건을 합친 selector와 전역 물리 잔차·flat tail |
| G-N5 | 실제 fixed-label 물리 curl, 원래 potential 계수와 전체 harmonic의 3차 slow 미분 | 공간 2차 velocity의 전체 물리 연쇄법칙, 공통 Gaussian·모든 label의 summable tail, 직접 PDE 잔차와 N6 interface |
| 실제 해석학 Lean | 이전에 실행한 조건부 대수 kernel 보조정리 14개 및 보조 선언 2개 | 실제 함수 공간·적분·극한·양성·smoothness의 전체 Lean 인스턴스. 이 추가 전체 형식화는 사용자가 요청한 M2 진입 gate와 별도이며 전체 해석학 Lean 증명 완료 주장을 막는다. |

N5의 `div(δu tensor δu)`, 교차 mode, `(1-ψ)f + ψ' t`, nonzero eikonal remainder를 생략하지 않는다. 불완전한 양성 정의역에서 sqrt나 inverse를 계산한 뒤 전체 결과라고 표시하지 않는다.

## 8. M3 진행 순서와 실행 화면

`userRequestedM2Complete=false`, `m3MayStart=false`이다. 위 실제 의무가 해소된 뒤에 사용자 요청 순서대로 다음 tracks를 시작한다.

- 산술: **P7 → P8**.
- 게이지: **Y5 → Y6 → Y7**.
- NS: **N6 → N7 → N8**.

이는 작업 순서다. 원문에서 P8의 선행 조건이 P1–P4라는 사실을 P7 의존성으로 바꾸지 않는다. N8의 일반적인 별도 계산 branch가 N2 뒤 시작할 수 있다는 원문 구분도 보존하되, 이번에는 사용자의 M2 우선 순서를 따른다. N6의 전체 correction cycle, N7의 global force·energy, N8의 near-terminal 재구성을 M2로 이름만 바꿔 완료 처리하지 않는다.

기존 [M2 화면](https://project29770.websitepublisher.ai/v0.3.1.html#research-m2/ns)의 **배경 · Pulse** 예제에서 다음 세 작업을 사용한다.

1. **N5 · 원래 cutoff 적분 · 엄밀한 수치 구간과 분리 오차**.
2. **N5 · 표시 band의 양성 정리 적용 범위 검사**.
3. **N5 · 원래 heat와 1차·2차 도함수의 엄밀한 수치 구간**.

실행 결과의 JSON과 원본 경로가 있는 표에서 구간·오차·적용 범위를 함께 볼 수 있다. 예전 환경의 실행 기록은 **저장한 M2 실행 기록 가져오기 → 입력만 불러오기**로 새 작업을 만들 수 있다. 기존 환경과 다른 Worker hash의 결과를 현재 검증으로 자동 채택하지 않는다.

물리 curl·physical seminorm·ell=1 obstruction의 무거운 source 검사는 저장소의 별도 재현 명령과 원본 receipt로 제공한다. 이 세 작업이 모두 새 브라우저 예제로 설치되었다고 주장하지 않는다. 공개 페이지의 실제 게시·원본 바이트·브라우저 확인 범위는 이번 evidence의 publication 및 browser 기록으로 별도 확인한다.


## 9. 재개 후 추가한 실제 heat·n=1 경계·작은 q 양성 결과

공개된 v76은 runtime `0.3.9`의 cutoff/domain 화면과 숫자 줄바꿈을 검증한 저장점이다. 아래 세 모듈의 최초 실행은 **별도 Node source 경로**다. 이를 v75/v76 Worker·브라우저에서 이미 실행한 결과로 기록하지 않는다. 이후 화면 연결은 해당 버전의 별도 실행 영수증으로 검증한다.

| 새 실제 source | 실행 | 얻은 결과 | 남아 있는 범위 |
|---|---:|---|---|
| 원래 heat와 slow jet 구간 | 12/12, exit 0 | 원래 양수 h·z를 유지한 지정점 heat와 R/Z/T 1차·대칭 2차 아홉 도함수 구간 | 전체 F·pulse·공분산·가중치·curl 수치 구간 |
| n=1 weighted stress | 6/6, exit 0 | 원래 (5.22)의 말단 적분 추정, 총 차수 2 이하 FTC 상수, 원래 c1의 (5.43) mixed 항 | 강화 selector의 모든 차수 적용과 전역 물리 잔차 |
| 새 작은 q terminal covariance | 13/13, 관측 exit 0 | 실제 새 pulse·H·target, 열린 외측 영역의 det H<0와 두 양의 weight 및 smooth sqrt | 내부 활성 보정, 모든 box·label, flat endpoint, 미지 Γ |

heat에서 `D0=(1−H)/(hz)`, `D1=−H′/h`, `D2=H″/[h(1+h)]`를 사용한다. 192-bit 산술에서 u=2⁻¹⁹²라 하면 실제 반환 구간은 D0∈[1−2u,1+u], D1∈[1−3u,1+u], D2∈[2−13u,2+4u]다. 완성된 slow 계수의 최대 구간 폭은 **35u≈5.57583×10⁻⁵⁷**이며 요청 폭 10⁻⁴⁰보다 작다. 실제 h, z와 양의 미분 인자는 source root로 유지한다. 이 수치는 원래 h의 상대 정밀도를 보증하지 않는다. [heat 수식·오차·실행](evidence/actual-heat-20261011/ACTUAL_HEAT_SCALED_ENCLOSURE_KO.md)을 참고한다.

n=1 응력에서는 δ=log(Xb/X)에 대해 원래 flat factor E=exp(−4/δ²)를 유지한다. `(E δ⁻³)′=E δ⁻⁶(8−3δ²)`에서 0<δ≤1/4이면 정확한 적분 계수 **16/125**를 얻는다. 원래 ζ는 바꾸지 않으며 ζ로 나누는 내부 직사각형에서 양수임을 확보하고 말단은 E/ζ의 별도 상계로 처리한다. [원래 signed stress와 가중 추정](ACTUAL_ORDER_ONE_WEIGHTED_STRESS_KO.md)에 증명과 실제 상수가 있다.

새 공분산은 **ell*=ellMinimum+8**의 실제 band다. 원래 작은 q 조건을 만족하는 새 carrier·길이·moving-frame pressure·두 Volterra 계를 다시 만들었다. 모든 양의 차수 보정이 공통 Xplus 뒤에서 정확히 사라지는 원래 support 귀납을 사용한다. 그 외측 열린 영역에서만 completed source와 leading source를 동일시한다. 실제 정규화 행렬의 determinant는 양수이고, 원래 좌표로 되돌린 **det H는 음수**다. 두 inverse weight는 실제 양의 target scale과 mass로 양쪽에서 감싼다. [작은 q 실제 구성과 남은 영역](ACTUAL_ADMISSIBLE_TERMINAL_COVARIANCE_KO.md)을 참고한다.

[독립 종합 검토](evidence/m2-math-progress-20261011/INDEPENDENT_COMPONENT_REVIEW_KO.md)와 [원본·실행 SHA 대조](evidence/m2-math-progress-20261011/review-validation.json)는 이 세 결과의 구체적인 근거와 경계를 기록한다. generic kernel, source 내부 항등 검사와 원문 64개 기준의 개수는 합산하지 않는다. 전체 M2와 M3 gate는 false를 유지한다.

## 10. 저장 커밋 92a5cdd5의 다섯 source 확장

[구현과 검증 저장점](https://github.com/leegahuyn/MathScopeCompute/commit/92a5cdd54d892df7ef0830e463de2e0f5722d038)에 다음 다섯 작업의 원본, 테스트, 실패 기록, 서면 증명과 독립 검토를 저장했다. 공개 runtime은 여전히 0.3.10/v77이다.

| 결과 | 실제 source 실행 | 정확한 완료 범위 |
|---|---:|---|
| [terminal potential 계수의 3차 jet](evidence/terminal-third-jets-20261011/terminal-third-jets-packet.json) | 11/11, exit 0 | 같은 원래 작은 q terminal source의 20개 R/Z/T multi-index, 실제 inverse·sqrt·cutoff와 변분 적분; 이 단계의 계수만으로 물리 velocity 2차를 주장하지 않음 |
| [외측 covariance flat 연장](evidence/outer-covariance-flat-20261011/actual-outer-covariance-flat-extension-validation.json) | 14/14, exit 0 | 원래 외측 target의 flat factor, inverse 양성, 모든 고정 유한 미분의 sqrt zero extension; 안쪽 경계는 별도 |
| [강화 배경과 잔차 조립](evidence/strengthened-background-20261011/validation.json) | 7/7, exit 0 | 실제 강화 selector의 유한 적용과 모든 ordered-pair 잔차 항; 낮은 차수의 pressure·stress 취소를 아직 0으로 두지 않음 |
| [양의 order 전역 primitive](evidence/global-positive-primitives-20261011/validation.json) | 5/5, exit 0 | 실제 M1/M2의 전체 prefix·mass join, n2 pressure derivative prefix; M0 및 전체 pressure convolution은 다음 작업 |
| [전체 terminal F의 엄밀 구간](evidence/terminal-field-20261011/validation.json) | 8/8, exit 0 | 원래 slow 정규화까지 유지한 지정점 F 및 아홉 1차·2차 도함수. 192-bit 정규화 계수 폭은 요청한 10^-40 이내 |

마지막 F 계산의 첫 시도는 소프트웨어 검사 8/8을 통과했지만 독립 검토에서 미분 전 원래 $s^{-A-1/2}$ 인자 누락이 발견되었다. 첫 시도는 **수학적 완료 증거로 거절**하고 원본 byte와 기록을 보존했다. 수정한 두 번째 source 실행 및 최종 독립 검토만 현재 결과에 사용한다. 특히 T, RT, TT, ZZ의 정규화 계수·부호는 원래 전체 slow F로부터 다시 유도했다. 원래 양수 h를 0으로 바꾸지 않았다.

## 11. 이어서 확정한 harmonic·annulus·속도 tail·M0

아래 네 결과는 독립 검토까지 완료한 별도 source packet이다. 단일 point나 유한 test count를 전체 band·무한 차수 실행으로 확대하지 않는다.

| 결과 | 실제 source 실행 | 얻은 연결과 남은 범위 |
|---|---:|---|
| [전체 harmonic 3차 미분](evidence/terminal-harmonic-third-jets-20261011/terminal-harmonic-third-jets-packet.json) | 11/11, exit 0 | 원래 $iC e^{ik\Phi}$의 실제 sine/cosine 본문을 직접 AD하여 phase와 coefficient의 모든 3차 slow 항을 결속. 물리 fast-chain 적용은 후속 |
| [한 band 전체 annulus 배경](evidence/admissible-annulus-background-20261011/actual-admissible-annulus-background-validation.json) | 12/12, exit 0 | distinct $b_1,b_2$와 16배 간격으로 원래 n1 보정을 유지하고 n≥2는 cutoff support로 정확히 소멸. 원래 C2 상수를 이전하고 R/Z/T 2차까지 구성. 새 H는 별도 |
| [모든 유한 차수의 양의 order 속도 tail](evidence/velocity-all-order-tail-20261011/validation.json) | 7/7, exit 0 | 원래 Cartesian potential·velocity·extra stream cutoff를 포함하는 미분/대각 선택/기하급수 tail 구성법. 실제 실행은 n1/m1과 n2/m2이며 17차 generic 검사와 구분 |
| [원래 전역 M0 primitive](evidence/leading-stream-primitive-20261011/validation.json) | 6/6, exit 0 | 자연 평균 급수부터 B26·B8·decay·outer의 두 실제 모멘트·C12 전체 위상·I1 보정을 거쳐 $M_{0,X}=U_0$, 원래 v 및 continuity를 결속. 전체 pressure·Ω prefix는 후속 |

M0 검증은 기존 원문 smoothness·contraction·support 계약을 사용한 source-bound 서면 증명이다. 각 접합의 원래 accumulated mass와 root 방정식을 남기며, compact integrand라는 이유만으로 primitive 상수를 지우지 않는다. 앞선 두 실제 실패는 본문/atom 비교와 strict JSON metadata 문제였고, 원래 계수·적분식을 변경하지 않은 수정 및 최종 source 6/6과 함께 보존한다.

새 cutoff 조건을 합칠 때는 단순한 pointwise max로 끝내지 않는다. 새로운 $b_1$을 먼저 선택하고 $b_2\ge16b_1$, 이후 $b_n\ge2b_{n-1}$를 각 단계의 max에 포함한다. 원래 normalized 조건과 새 physical·velocity·weighted 조건을 모두 한 수열에 결속해야 한다.

현재 다음 작업은 전체 pressure convolution과 stress 취소, 실제 전체 물리 velocity jet, 안쪽 양성·flat 경계, 모든 label의 Gaussian tail/물리 residual 연결이다. **M2 전체 완료와 M3 시작은 아직 false**이다. 새 source packet은 v77 Worker·브라우저의 실행 기록을 대체하지 않는다.

## 12. 전체 annulus H·실제 물리 미분·pressure 원본 연결

앞선 [fdf2ea19 저장점](https://github.com/leegahuyn/MathScopeCompute/commit/fdf2ea19d373e7bb280913db6403c4103af145c0)의 배경·harmonic·M0 결과 위에서 다음 세 원본 구성을 검증했다. 표의 실행 수는 각 source runner의 검사 수이며 서로 다른 generic 검사·내부 항등식 수를 합산하지 않는다.

| 결과 | 최종 source 실행 | 정확한 범위 |
|---|---:|---|
| [전체 annulus의 실제 H](evidence/admissible-annulus-covariance-20261011/actual-admissible-annulus-covariance-validation.json) | 14/14, exit 0; 63.348초 | 선택된 원래 band에서 n1을 유지한 F/G, 두 pulse, moving-frame pressure, 원래 full target과 각도 적분을 결속. 열린 Xa<X<Xb에서 det H<0와 두 양의 weight. 안쪽 flat 연장·모든 band의 단일 선택 수열은 별도 |
| [물리 velocity의 공간 2차·시간 1차](evidence/terminal-physical-jets-20261011/terminal-physical-velocity-jets-packet.json) | 12/12, exit 0; 89.726초 | 원래 Cartesian potential에 기저 회전·radial fast chain·Z/T slow chain·fast time을 모두 적용. 각 부호에서 133개 본문 편미분, 19개 교환/div-curl 항등식과 40개 물리 표현식. 한 canonical terminal member의 실제 식이며 수치 구간은 별도 |
| [양의 order 전역 pressure convolution](evidence/global-pressure-convolution-20261011/validation.json) | 9/9, exit 0; 13.084초 | 생성된 n1/n2 prefix에서 모든 ordered pair와 full F0를 유지. 원래 O=Ω/X를 두 번 나누지 않고 n1의 네 전역 Ω primitive와 M0 continuity를 결속. 다섯 최종 보존 모멘트와 n0 stress bridge는 별도 |

물리 미분은 먼저 potential을 Cartesian 성분으로 회전하고 그 본문에 실제 Dx, Dy, Dz, Dt를 작용시킨다. 따라서 원통 기저 미분이나 빠른 시간 미분을 빠뜨린 채 slow 미분 결과를 물리 도함수로 부르지 않는다. 초기 source 실패의 strict 좌표 tuple 문제와 해당 원본 snapshot을 보존했고, 수정 후 실제 원본을 다시 실행했다.

pressure에서는 compact integrand 뒤에서도 남는 원래 적분 질량을 유지한다. 원래 full F0의 양의 λ와 두 bump의 모멘트, 실제 Xv 항, axis 값 및 cut 이후의 상수를 모두 추적하여 pressure의 전체 prefix를 연결했다. [독립 pressure 검토](evidence/global-pressure-convolution-20261011/INDEPENDENT_GLOBAL_PRESSURE_CONVOLUTION_REVIEW_KO.md)는 37개 원본 import의 hash와 수식을 대조했으며 추가 source 실행으로 세지 않는다.

이 세 결과로 확인한 부분만 새 true 항목으로 추가했다. **M2 전체 완료·정밀 pulse 수치 계산·모든 label의 전역 잔차·M3 시작은 아직 false**이다. Gaussian 원본 시도의 제한 시간 종료는 통과 기록으로 사용하지 않는다. 공개 runtime 0.3.10/v77의 실행 범위도 그대로 유지한다.

## 13. 원래 Gaussian 꼬리·다섯 전역 모멘트·leading 응력 소거

앞선 [4f09dfbb 저장점](https://github.com/leegahuyn/MathScopeCompute/commit/4f09dfbbee1925e0b8d5d63e1943147a02144464)의 원본 위에서 다음 결과를 검증했다.

| 결과 | 최종 source 실행 | 수학적 범위 |
|---|---:|---|
| [원래 homogeneous Gaussian 꼬리](ACTUAL_PULSE_GAUSSIAN_TAIL_KO.md) | 8/8, 내부12개; exit0,33.617초 | 실제 full Volterra 해의 stable matrix와 원래 envelope/cutoff를 결속. fast v 미분2차까지 모든 Leibniz 항, 양의 Gaussian 지수, 전체 정수 mesh 계수와 양의 무한 tail. 모든 label의 amplitude·slow·weight·물리 미분 연결은 별도 |
| [다섯 전역 보존 모멘트](ACTUAL_GLOBAL_CONSERVATIVE_MOMENTS_KO.md) | 8/8; exit0,20.244초 | 실제 n1/n2의 다섯 전체 밀도, weighted Omega의 원래 다섯 적분,13개 continuous bump matrix entry와 모든 ordered pair. positive continuity 및 동일 원래 inverse equation을 소비 |
| [leading 압력·응력 소거](ACTUAL_LEADING_GLOBAL_STRESS_BRIDGE_KO.md) | 7/7, 내부9개; exit0,19.390초 | full F0/U0/M0, 비상수 pressure axis datum,4개 literal primitive와 두 shear를 유지한 실제 radial/angular/axial momentum 및 weighted stress 미분 소거 |

각 결과는 독립 읽기 검토와 현재 source/import hash 대조를 거쳤다. 검토나 hash 검사를 추가 source 실행 수로 합산하지 않는다. 첫 실패, 제한 시간 종료, 잘못된 test key와 정확한 수정 snapshot은 각 evidence 안에 남긴다. 원래 수학 생성기와 봉인된 기존 결과를 바꾸지 않는다.

Gaussian 꼬리에서는 stable matrix의 음의 대각 성분을 유지하여 ell에 독립인 propagator 상계를 얻는다. 원래 cutoff의 미분항 psi′t를 빠뜨리지 않으며 무한 tail을 수치0으로 대체하지 않는다. leading stress의 두 shear 중 하나를 빼면 실제 residual 검사에서 실패한다.

이 저장점의 공개 runtime은 0.3.10/v77이다. **전체 M2, 정밀 pulse/H/weight/curl 도함수의 수치 예산, 모든 label의 물리 flat-error와 M3 시작은 아직 false**다. 이 표의 source 결과를 전체 연구 증명 완료로 확대하지 않는다.

## 14. 안쪽 flat 경계·양의 전역 응력·모든 유한 norm·중심 수치

앞선 [edb69fd4 저장점](https://github.com/leegahuyn/MathScopeCompute/commit/edb69fd4f7e5330333e8e4bb819d0e6780466e88)의 원래 소스를 유지하면서 아래 결과를 추가했다.

| 결과 | 실제 source 실행 | 완료 범위 |
|---|---:|---|
| [안쪽 공분산 제곱근 연장](ACTUAL_INNER_COVARIANCE_FLAT_EXTENSION_KO.md) | 13/13, 내부18; exit0,84.854초 | 실제 n1 배경을 포함한 선택된 annulus H의 inner factor, regular Ka endpoint, 양의 정규화 계수와 모든 고정 차수 flat jet. attempt1–5의 실패 기록은 보존 |
| [양의 차수 전역 응력](../ACTUAL_POSITIVE_GLOBAL_STRESS_KO.md) | 8/8; exit0,33.317초 | 실제 n1/n2의 radial/angular/axial 계수 소거, 원래 부호의 forward/backward 응력과 양끝 접합. n1의 완전한 수렴 차감 모멘트를 사용 |
| [압력·응력의 모든 유한 차수 경계](../ACTUAL_PRESSURE_STRESS_ALL_ORDER_TAIL_KO.md) | 6/6; exit0,41.513초 | 실제 n1/n2,m1 실행, 모든 유한 m에 대한 같은 Gaussian/Leibniz/Stirling·FTC 알고리즘. n1의 원래 heat를 유지하고 quotient 미분과 직접 weighted 미분을 구분 |
| [중심 pulse/H/weight 수치](evidence/centered-pulse-20261011/ACTUAL_CENTERED_PULSE_ENCLOSURE_KO.md) | 11/11, 내부7; exit0,57.967초 | 지정된 실제 중심의 정규화 mass와 H·역가중치 계수에 192bit 외향 구간과 양의 Gaussian/cutoff 오차. 실제 a± 절대 척도는 별도 인자로 유지 |

각 packet의 현재 source/import 바이트와 실제 관측 exit code를 대조했다. 독립 읽기 검토는 source 실행 수에 포함하지 않는다. 유한 프로그램의 표현 예산은 유한 차수 정리의 수학적 제한과 구분한다.

이 단계에서는 하나의 최종 cutoff 수열로 모든 band/label을 구성하고, 그 같은 배경장의 물리 잔차 및 전체 curl에 위 경계를 연결해야 한다. 중심 정규화 수치만으로 절대 진폭·slow/mixed 도함수·전체 curl의 수치 완료를 선언하지 않는다. 공개 runtime은 **0.3.10/v77**이며, 전체 M2와 M3 시작은 아직 false이다.

## 15. 모든 band의 C_m와 실제 중심 진폭

[1c7c37eb 저장점](https://github.com/leegahuyn/MathScopeCompute/commit/1c7c37eb10287e60b6c430cdcaa3fbc3b1316577)의 source를 유지한 추가 검증이다.

| 결과 | 실제 관측 | 범위 |
|---|---:|---|
| [모든 band 배경장 C_m](ACTUAL_ALL_BAND_BACKGROUND_NORMS_KO.md) | source7/7, 내부11; exit0,20.621초 | Full heat/I2·양의 correction과 정확한 slow 계수 미분을 유지. 실제 생성은 C0,C1,C2이며 임의의 고정 유한 차수는 동일한 명시적 생성 절차로 제공 |
| [실제 중심 진폭 a±](ACTUAL_ADIABATIC_PULSE_CENTER_KO.md) | source12/12, 내부9와 양쪽7; exit0,106.340초 | 원래 전체 두 성분 행렬·반올림·이동 압력·Bprime에 직접 결속. a±는 0.3535533905932738 주변의 외향 유리 구간. 선택된 terminal 중심의 결과이며 임의의 점이나 ell=1로 확대하지 않음 |
| [혼합 미분·물리 잔차·Gaussian 계산 kernel](evidence/common-wave-calculus-20261011/INDEPENDENT_COMMON_WAVE_KERNEL_REVIEW_KO.md) | 일반 검사17/17; exit0,3.226초 | 역공분산·제곱근의 모든 곱 미분, 안정적인 mixed Duhamel, 원래 h의 물리 지수, 전체 mesh와 양의 무한 tail. 실제 공통 family에 대한 결속은 후속 source 작업 |

두 source packet, 실제 실행 import, 독립 검토의 현재 바이트를 확인했다. 진폭 설명 문서에는 독립 검토 링크 한 줄만 추가되었으며, 그 줄을 제거하면 검토 당시 문서 SHA가 정확히 복원됨을 별도로 확인했다. 보존된 진폭 첫 실패 및 generic test의 잘못된 metadata 경로 실패를 삭제하거나 성공으로 바꾸지 않았다.

공통 cutoff 수열·모든 label의 H·전체 curl·같은 배경장의 물리 잔차 결속과 slow/mixed/curl 수치 구간은 다음 단계에서 확인한다. 공개 runtime은 **0.3.10/v77**이고, 이 저장점의 전체 M2 완료 및 M3 시작 값은 false다.

## 16. 공통 family와 실제 유한 물리 잔차

[675a4139 저장점](https://github.com/leegahuyn/MathScopeCompute/commit/675a413968e964454bef1295fd35b0488f0e45df) 다음의 source 검증이다.

| 결과 | 실제 관측 | 완료 범위 |
|---|---:|---|
| [공통 선택 수열과 자체 band](ACTUAL_COMMON_ADMISSIBLE_FAMILY_KO.md) | source8/8, 내부9/16/9; exit0,271.441초 | 전체 C3, positive prepared3, n1/n2 모든 diagonal norm, 자체 두 Volterra/H, target N0..N2 및 같은 수열의 모든 유한 차수 양성·sqrt 미분 논증 |
| [실제 유한 물리 잔차](../ACTUAL_GLOBAL_FINITE_RESIDUAL_KO.md) | source5/5, 내부6; exit0,48.557초; generic7/7 | 원래 전체 leading 및 n1/n2의 pressure·두 stress·운동량 결속, 실제 고차 n3..n5 잔여항과165개 FTC 항 보존 |

공통 sourceRefs124개, 유한 잔차의 실제 import72개와 최종 코드·문서7개를 현재 바이트와 다시 비교했다. 독립 검토는 공통 family의 수학 귀납을 읽고, 유한 잔차와 후속 같은 수열 비교 초안을 구별한다.

전체 curl/잔차 통합의 첫 시도는 **2/8, exit1**이었다. 큰 그래프의 표현-변수 의존성 캐시가 Map 한도를 넘었고, 같은 leading stress를 두 source 표현으로 결속하는 비교에서 차이가 발견되었다. 실제 실패 snapshot과 로그를 그대로 보존했으며, 통과로 바꾸지 않았다. 입력 역공분산의 auxiliary 좌표 제한 및 후속 W_(1/2) 가정도 별도 보완 중이다.

이 저장점에서는 공통 family를 실제 물리 전체 curl·전역 Gaussian 합·E_B에 연결하는 최종 통합과 수치 도함수 관문을 계속 검증한다. 공개 runtime은 **0.3.10/v77**이며, 전체 M2 완료와 M3 시작은 여전히 false다.

## 17. 중심 slow 수치 미분과 공개 terminal F 실행

[중심 slow-jet 패킷](evidence/centered-slow-jets-20261011/centered-slow-jet-enclosure-packet.json)은 두 원래 부호의 radial 가중 pulse에 대해 R/Z/T 1차와 대칭 2차 미분 18개를 계산했다. 실제 source 실행은 **12/12**, 내부 source 검사 **11/11**, 관측 exit **0**, **82.389초**였다. 68개 실제 import 바이트와 구현·시험·실행·독립 검토 26개 파일을 최종 패킷과 대조했다. 공분산 역원·양의 제곱근·움직이는 중심의 미분 및 양의 Gaussian 오차를 유지한다. 자세한 정규화와 도함수의 의미는 [설명](ACTUAL_CENTERED_SLOW_JET_ENCLOSURE_KO.md)에 있다.

독립 검토 파일명이 겹쳐 한 검토의 옛 바이트를 복구할 수 없었던 사실도 패킷에 남겼다. 두 검토는 서로 다른 파일명으로 보존했고, 재발행 검토는 현재 68개 import를 새로 확인했다. 원래 수학 코드와 성공한 source 실행 기록은 이 재발행에서 변경하지 않았다.

terminal F의 runtime `0.3.11`은 실제 source와 Worker를 각각 실행해 같은 원본 certificate와 수학 결과 해시를 얻었다. 두 프로세스의 관측 exit은 **0/0**이었다. 공개 **v79 / `596b9751`**에서도 새 실행이 `COMPLETED`와 **10/10**을 반환했다. 네 표의 값 셀 **129개**, 10·10·17·12행은 원본과 일치했고, 긴 유리수의 줄바꿈 및 가로 폭을 실제 화면에서 확인했다. 29개 항목명은 표시용이다. [공개 검증](evidence/terminal-field-runtime-20261011/browser-v79-verification.json)과 [실행·범위 설명](ACTUAL_TERMINAL_FIELD_RUNTIME_KO.md)을 함께 보관한다.

중심 slow 결과의 나머지 fast·절대 a/H/y 미분, 실제 물리 curl의 수치 구간과 원래 양의 geometry/target 인자는 별도 후속 검증이다. G-POS·G-NUM·G-CURL·G-N4·G-N5 전체 관문은 최종 통합 결과를 확인하기 전까지 false이며, 원문 64개 PASS와 이 추가 완료 판정을 합치지 않는다.
