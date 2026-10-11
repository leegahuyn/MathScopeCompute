# M2 추가 수학 범위: 실제 검증 결과와 M3 진입 조건

## 현재 판정

**M2의 이번 추가 구현과 검증은 진행됐지만, 사용자가 요청한 모든 수학 범위는 아직 완료되지 않았다. M3는 시작하지 않았다.** 연결이 끊기기 전의 최신 저장점 `8a0046c5`에서 이어서 작업했으며, 현재 실행 코드의 버전은 `0.3.9`이다.

이번에 원래 cutoff 적분의 엄밀한 수치 구간, 실제 고정 label의 물리 curl, 배경 1·2차 계수의 물리 미분 상수와 강화 cutoff 선택식을 추가했다. 또한 표시용 `ell=1` 확장의 지정된 점에서는 **비음수 공분산 가중치 쌍이 존재하지 않는다는 원본 결속 서면 증명**을 얻었다. 따라서 이 표시 확장을 그대로 전체 양성 구성으로 승격할 수 없다. 전체 M2 목표에는 **원문이 허용하는 작은 q 영역에서의 후속 구성**이 필요하다.

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
| G-POS | 선택한 인증 영역의 비멤버십과 ell=1 지정점의 비음수 해 부존재 | 원문 허용 영역의 실제 양성 weight, 비영 determinant·inverse 안정성, 필요한 sqrt 경계 연장 |
| G-NUM | 원래 cutoff 질량과 Ls의 엄밀 구간 | 실제 pulse·도함수·H·weight·curl의 합산 truncation/heat/quadrature/rounding 오차 |
| G-CURL | 원래 cutoff·physical map을 포함한 실제 fixed label의 조건부 curl | 원래 허용 bands의 모든 label, support·경계 연장·전역 divergence |
| G-N4 | 실제 1·2차 물리 미분 상수, n=2 weighted stress, 강화 selector 후보 | n=1 경계, selector 적용, 모든 차수의 실제 배경 잔차·점근·flat tail 연결 |
| G-N5 | 기존 2차 변분계와 실제 fixed-label 물리 curl | 공간 2차 velocity에 필요한 potential 3차 또는 동등한 정리, 공통 Gaussian·모든 label의 summable tail, 직접 PDE 잔차와 N6 interface |
| 실제 해석학 Lean | 이전 조건부 대수 kernel 보조정리 | 실제 함수 공간·적분·극한·양성·smoothness 가정을 해소한 source 인스턴스 |

N5의 `div(δu tensor δu)`, 교차 mode, `(1-ψ)f + ψ' t`, nonzero eikonal remainder를 생략하지 않는다. 불완전한 양성 정의역에서 sqrt나 inverse를 계산한 뒤 전체 결과라고 표시하지 않는다.

## 8. M3 진행 순서와 실행 화면

`userRequestedM2Complete=false`, `m3MayStart=false`이다. 위 실제 의무가 해소된 뒤에 사용자 요청 순서대로 다음 tracks를 시작한다.

- 산술: **P7 → P8**.
- 게이지: **Y5 → Y6 → Y7**.
- NS: **N6 → N7 → N8**.

이는 작업 순서다. 원문에서 P8의 선행 조건이 P1–P4라는 사실을 P7 의존성으로 바꾸지 않는다. N8의 일반적인 별도 계산 branch가 N2 뒤 시작할 수 있다는 원문 구분도 보존하되, 이번에는 사용자의 M2 우선 순서를 따른다. N6의 전체 correction cycle, N7의 global force·energy, N8의 near-terminal 재구성을 M2로 이름만 바꿔 완료 처리하지 않는다.

기존 [M2 화면](https://project29770.websitepublisher.ai/v0.3.1.html#research-m2/ns)의 **배경 · Pulse** 예제에서 다음 두 작업을 사용한다.

1. **N5 · 원래 cutoff 적분 · 엄밀한 수치 구간과 분리 오차**.
2. **N5 · 표시 band의 양성 정리 적용 범위 검사**.

실행 결과의 JSON과 원본 경로가 있는 표에서 구간·오차·적용 범위를 함께 볼 수 있다. 예전 환경의 실행 기록은 **저장한 M2 실행 기록 가져오기 → 입력만 불러오기**로 새 작업을 만들 수 있다. 기존 환경과 다른 Worker hash의 결과를 현재 검증으로 자동 채택하지 않는다.

물리 curl·physical seminorm·ell=1 obstruction의 무거운 source 검사는 저장소의 별도 재현 명령과 원본 receipt로 제공한다. 이 세 작업이 모두 새 브라우저 예제로 설치되었다고 주장하지 않는다. 공개 페이지의 실제 게시·원본 바이트·브라우저 확인 범위는 이번 evidence의 publication 및 browser 기록으로 별도 확인한다.
