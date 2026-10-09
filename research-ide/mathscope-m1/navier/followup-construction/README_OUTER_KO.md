# 원문 외곽 구성의 추가 계산 모듈

이 디렉터리의 `outer.mjs`는 동결된 v50 뒤에 추가한 **원문 Appendix A.2–A.7의 유한·점별 수치 연산**입니다. 기존 v50 파일, 71개 로컬 Lean 목표, 원래 rc2 C/D 정리 검사 결과를 변경하지 않습니다. 이 추가 계산에는 새로운 Lean 커널 인증을 주장하지 않습니다.

## 실제로 계산하는 것

| 원문 위치 | 구현된 연산 | 결과의 범위 |
|---|---|---|
| A.5–A.13, pp.129–130 | 원래 매끄러운 계단 함수, 각 로그 반경 구간, (U,E), 네 예약 패치, terminal QODE와 기다리는 길이 | 지정한 유한 매개변수의 원문 schedule |
| A.15, p.131 | 축방향 펄스의 두 폭 0.3 bump 계수를 Amp의 affine 함수로 계산 | M/J의 정규화 잔차와 물리 잔차를 함께 기록 |
| A.11, pp.130–132 | 상대적인 E bump 두 개로 angular moment와 pressure increment 연립식 계산 | 정확한 등식 인증은 없음 |
| A.19, p.133 | 앞뒤 E 구간과 모든 끝 보정을 반영한 전체 S 식, [0.9,1.2] 근 찾기, 전체 미분 검사 | 표본 η의 수치 근; 전 구간 유일성·매끄러움 인증 아님 |
| A.21–A.23, pp.133–134 | θ가 변하는 interpolation을 포함한 실제 압력 datum과 Taylor 계수 | 무한꼬리는 해석적 지수 적분; 임의 cutoff나 rational fit 사용 안 함 |
| A.32–A.43, pp.138–140 | 원래 gamma 적분의 유한 Taylor 공식과 나머지, terminal 열 보정의 세 모멘트, I2 패치의 additive E bump 세 개 | 차원이 다른 Cp/S/I 잔차를 공통 로그 크기로 계산 |
| A.37, Lemma A.8, pp.138,140 | 열 다항식의 실제 ODE 잔차, bump·heat 지지 위치 검사, exterior stress 조건 목록 | 전체 stress 재구성·지지 정리의 인증은 없음 |

진폭 식은 원문의

\[
F(A,\eta)=\frac{\lambda S(\infty)}{X_p e_b^2 f(\eta)^2}
=c_0(\eta)+c_1(\eta)A+c_2(\eta)A^2
\]

를 사용합니다. 원문의 0.36 하한은 먼저 주항의 미분에 대한 값입니다. 구현은 전체 식의 두 끝 부호와 미분을 별도로 검사하고, 조건을 확인하지 못하면 근을 만들지 않습니다.

## 공용 API

```js
import {
  outerExampleInput, validateOuterInput, runOuterConstruction,
  prepareOuterSchedule, solveOuterSlice, evaluateOuterSlice,
  pressureDatum, pressureJet
} from './outer.mjs';
import { makeBudget } from '../numerics.mjs';

const input = outerExampleInput();
const validation = validateOuterInput(input, { maxPoints: 4096 });
const result = runOuterConstruction(input, makeBudget({
  maxOperations: 2_000_000, maxMilliseconds: 20_000, maxPoints: 4096
}));
```

`validateOuterInput`은 적분이나 ODE 풀이 없이 JSON 구조, 지원 범위, 표본 예산을 검사합니다. 공용 입력에는 함수를 넣을 수 없습니다. `runOuterConstruction`의 결과에는 함수, Map, NaN, Infinity, 실행 시간 값이 없으며 같은 입력으로 결과 JSON을 재현할 수 있습니다. Node와 브라우저 Worker에서 사용하는 계산 코드가 같습니다.

```json
{
  "parameters": {
    "Md": 1, "logP": 14, "lambda": 0.0002,
    "h": 1e-8, "logXR": 20, "Tf": 64, "co": 0.005
  },
  "etas": [-0.5, 0, 0.5],
  "samplesPerEta": 48,
  "pressureOrder": 4,
  "tolerance": 2e-8,
  "heatOrder": 3
}
```

`logP`와 `logXR`는 자연로그입니다. 각각 (P_*=e^{\mathrm{logP}}), (X_R=e^{\mathrm{logXR}})입니다. `pressureOrder`는 (\Pi_0^{(k)}(\eta)/k!\)를 반환하는 Taylor 차수이며 최대 54입니다. 최대 차수에는 기본 2M보다 큰 계산 예산이 필요합니다. 실제 최고차 실행은 약 5.35M tick이었습니다. 범위를 넘기거나 예산·취소 조건에 걸리면 해당 오류를 반환합니다.

지원 범위는 (0.2\le M_d\le4), (0\le\log P_*,\log X_R\le100), (5\cdot10^{-5}\le\lambda\le0.005), (10^{-12}\le h\le0.001), (2h<\lambda), (64\le T_f\le512), (10^{-5}\le c_o\le0.01)입니다. 이는 연산이 지원되는 범위입니다. 원문의 “충분히 작다/크다” 조건 전체를 인증하는 범위가 아닙니다. η는 [-1,1]의 1–16개 표본, 표본당 24–256점, 열 Taylor 차수는 1–5를 받습니다.

`prepareOuterSchedule`과 `solveOuterSlice`는 내부 계산을 위한 객체를 반환합니다. 외부 저장과 Worker 결과 전송에는 JSON만 반환하는 고수준 함수를 사용합니다. `pressureJet(schedule, eta, order)`는 실제 A.21 압력으로 축방향 Taylor 계산과 연결할 수 있습니다. 공통 복소 근방, 해석적 꼬리, 전체 축 결합 인증은 별도입니다.

## 작은 보정과 실제 잔차를 보존하는 방법

기본 예제에서 \(\log X_{\rm tail}\approx65966.48\)입니다. X, E, 여러 모멘트는 Float64로 직접 표현할 수 없습니다. 따라서 부호와 자연로그를 저장하는 `SIGNED_LOG`와 `logScale + mantissa` 표현을 사용합니다. `float64:null`은 원래 값이 0이라는 뜻이 아닙니다.

열 보정은 단순히 반올림된 두 E 값을 빼서 계산하지 않습니다.

\[
(E+\delta E)^2-E^2=2E\,\delta E+(\delta E)^2
\]

를 직접 적분합니다. 모멘트별 정규화, 공통 로그 크기의 잔차, 실제 물리 크기의 잔차, 반올림 진단 크기를 모두 기록합니다. 그 진단 크기는 구간 산술 오차 상한이나 인증값이 아닙니다.

원래 열 인자는 A.32의 gamma 적분입니다. 구현의 수치 표본은 A.35에서 얻는 **유한** Taylor 다항식과

\[
|H(Z)-H_N(Z)|\le
\frac{(h)_{N+1}(1+h)_{N+1}}{(N+1)!}Z^{N+1},\qquad Z\ge0
\]

를 함께 사용합니다. 수렴하는 무한 Taylor 급수를 가정하지 않습니다. 세 열 모멘트는 상수 꼬리를 해석적으로 적분하여, angular 행에 나타나는 (1/h) 기여도 잘라 버리지 않습니다. 원래 열 인자의 값에 대한 (0\le1-H(2(1-\eta^2)/X)\le2h(1+h)/X) 공식도 출처와 평가 범위를 기록합니다.

유한 다항식의 원래 heat ODE 잔차는

\[
L H_N=-(N+1)a_{N+1}Z^N,
\quad L=Z^2\partial_Z^2+(1+2(1+h)Z)\partial_Z+h(1+h)
\]

로 남습니다. 이 비영 잔차도 로그 형태로 저장합니다. 따라서 화면에서 외곽 stress가 정확히 0이라고 판정하지 않습니다.

M/J 펄스 끝 적분은 작은 λ 때문에 예민합니다. 독립 검증에서 최초 오차가 목표보다 컸고, 이를 기준 변경 없이 수정했습니다. [0.02,10]의 (R_0=\xi-0.01)은 해석적으로 적분하고, [10,11]은 (t=\xi-10)와 peak에 대한 log ratio로 재척도화했습니다. 수정 전 실패와 수정 사유는 `outer-precision-history.json`에 보존합니다.

## 시각화 의미

`visualization.points`와 `lines`는 실제 계산 표본

\[
(\log(X/X_R),\eta,\log(E/P_*))
\]

의 그래프입니다. 물리적 공간의 Cartesian 3차원 유동 투영이라고 표시하지 않습니다. 각 원본 표본에는 physical X/E/U와 열·angular 보정의 `SIGNED_LOG`가 남습니다. 큰 구간 안의 좁은 bump를 보려면 표본 위치를 늘리거나 원본 JSON을 확인해야 합니다.

## 독립 검증과 재현

```sh
node mathscope-m1/navier/followup-construction/outer.verify.mjs --prepare-fixture
python mathscope-m1/navier/followup-construction/outer-reference.py
node mathscope-m1/navier/followup-construction/outer.verify.mjs
```

Node 24에서 실행했습니다. Python 검증에는 `mpmath`가 필요합니다. 설치된 mpmath가 없으면 기존 작업 공간의 arithmetic vendored 사본을 읽지만, 소스 ZIP 사용자는 mpmath를 별도로 설치할 수 있습니다. 원문 전체 PDF나 대형 Lean 도구체인을 이 모듈이 요구하지 않습니다.

Python 참조는 70자리 연산과 96점 Gauss–Legendre 적분을 사용합니다. JavaScript의 adaptive Simpson 및 RK4와 다른 방법으로 terminal QODE를 적분인자로 계산하고, M/J의 원문 적분, S 진폭, 압력 Taylor 계수, A.11과 A.7 모멘트를 재적분합니다. 열 bump는 x 적분 대신 log(x) 변수로 적분합니다. 진폭·bump 계수를 고의로 바꾸거나 끝 보정을 없애는 음성 대조도 포함합니다. 이것은 유한 fixture의 독립 수치 검증이며 전 구간 인증이 아닙니다.

최종 상태와 정확한 검사 수, 파일 SHA는 `outer-validation.json` 및 `outer-independent-reference.json`을 따릅니다. `outer-fixture.json`에는 η=0, 0.5, 1의 실제 계산 결과가 있습니다.

## 원래 N3 요구에서 여전히 필요한 것

N3-02와 N3-07은 계속 **PARTIAL**입니다. 다음을 구현된 표본으로 대체하지 않습니다.

- 원문 선택 순서에 맞는 상류 상수와 전 η 구간의 정량적 작은/큰 매개변수 인증
- 모든 η에 대한 정확한 다섯 모멘트, 그 매개변수 미분과 비선형 보정의 인증
- 실제 원문 압력에 결합된 정칙 축, 공통 복소 근방과 해석적 꼬리
- strict stress cone, 전체 controlled continuation 및 admissible loop
- 원래 stress 재구성의 정확한 지지·끝점 평탄성·원문 전체 witness

이 구분은 원래 요구를 낮추기 위한 것이 아닙니다. 추가 구현 가능한 원문 연산을 실제로 계산하되, 아직 증명되지 않은 수학적 인증을 결과와 별도로 남기는 것입니다.
