# MathScope M1 · Navier–Stokes 구성요소 실험실

이 디렉터리는 첨부된 OpenAI **Finite Time Blowup for Navier–Stokes**의 원문 좌표와 외곽 heat flow, 실제 비선형 축 계수 재귀, 다섯 모멘트 수리와 radial modulation 연산을 실행한다. 완성된 논문 해와 같은 모양을 갖춘 도식만 생성하는 방식이 아니다. 다만 아직 증명 조건을 충족하지 않은 접합은 **미인증 후보**로 남긴다. 전체 원문 해와 Theorem 4.6의 인증된 leading profile은 현재 생성되지 않는다.

배포되는 모든 job의 `fullCertifiedProfile`, `fullNavierStokesSolution`은 `false`다. 원문은 smooth compact force가 있는 C/D 명제를 다루며, 이 실험실이 unforced A/B를 해결했다는 주장은 없다. 원문 p.118은 국소화된 force의 발산이 일반적으로 0이 아닐 수 있음을 명시한다.

## 실행 API

```js
import { getCapabilities, getExamples, validateRequest, runJob }
  from './navier/index.mjs';

const example = getExamples().find(x => x.id === 'ns-leading-candidate');
const result = await runJob(example.request, {
  isCancelled: () => false,
  progress: event => console.log(event)
});
```

`runJob(request, hooks)`는 Promise로 JSON 직렬화 가능한 결과를 반환한다. root의 공통 job worker 안에서 실행하며, 독립 worker를 추가하지 않는다.

| kind | 주요 입력 | 실제 반환 내용 | 정상 상태 |
|---|---|---|---|
| `ns.provenance` | 없음 | 첨부·commit pin, 166쪽 지도, 원문 정리 계약, 해석 가정, 좁은 Lean 검사 | `COMPLETED` |
| `ns.coordinates` | `tau,h,viscosity,X,eta,theta` | 실제 similarity 정·역변환, 다항 도함수, FD 교차검사 | `COMPLETED` |
| `ns.heat` | `Z,h,derivativeOrder,taylorOrder` | 적분과 도함수 interval, 분모·절단·반올림 오차, 유한 Taylor remainder | `COMPLETED` 또는 정밀도 거부 |
| `ns.exterior` | `tau,h,viscosity,cInfinity,rmin,rmax,radialCount` | 원문 외곽 속도·pressure gradient·vorticity 표본 | `COMPLETED` |
| `ns.benchmark` | `time,viscosity` | 별도의 정확한 주기 Taylor–Green 흐름과 에너지 지표 | `COMPLETED` |
| `ns.axis-series` | `eta,axisOrder,Lambda,logC,Ymax` 및 상수 | 실제 nonlinear radial/eta 계수와 유한 합, 별도 f0 comparison | `PARTIAL` |
| `ns.moments` | `eta,PStar,lambda,patch,discrepancy,iterations` | 5 bump quadratic map, Jacobian, Newton, 독립 재적분 | `PARTIAL` 또는 `FAILED` |
| `ns.cone` | `a,bs,ps,N,amplitude,Xa,Xb,box` | 실제 cone inequality, whole parameter-box interval 인증, C.12 연산 fixture | `PARTIAL` 또는 `FAILED` |
| `ns.leading-profile` | 상수, `tau,viscosity,etaCount,radialCount,axisOrder` | 실제 축·원문 raw outer schedule 및 **명시적 diagnostic continuation**의 3D 표본 | `PARTIAL` |
| `ns.validate` | 선택적 기본 좌표 값 | FD·FFT·고정밀·발산·모멘트·음성 대조군 | `COMPLETED` 또는 `FAILED` |

엔진의 최상위 `status`는 `COMPLETED / PARTIAL / FAILED / CANCELLED / PRECISION_REQUIRED / UNSUPPORTED / BUDGET_EXCEEDED`만 사용한다. 원래 계산 단계의 상태는 `domainStatus`에 보존한다. 예를 들어 `NUMERICAL_MOMENT_MATCH`는 `PARTIAL`, 누락 quadratic term으로 인한 `REJECTED_MOMENT_MATCH`는 `FAILED`다. `COMPLETED`도 그 job이 제공하는 유한 계산이나 정리 참조가 완료되었다는 뜻이며 논문 전체 증명 인증을 뜻하지 않는다.

## 입력 정밀도와 자원 예산

```json
{
  "kind": "ns.heat",
  "input": { "Z": 1, "h": 0.005, "derivativeOrder": 2 },
  "precision": {
    "bits": 53,
    "absoluteTolerance": 1e-8,
    "relativeTolerance": 1e-8
  },
  "budget": {
    "maxOperations": 20000000,
    "maxMilliseconds": 60000,
    "maxPoints": 480
  }
}
```

브라우저 실행기는 binary64를 사용한다. Heat 및 scalar comparison에서는 outward interval arithmetic을 사용하지만, 비선형 축의 η-jets와 continuation은 일반 binary64 계산이다. `bits > 53`, 지나치게 작은 목표 오차, interval 분모의 0 포함, 범위 초과, quadrature subdivision 고갈은 `PRECISION_REQUIRED`를 반환한다. 100자리 mpmath fixture는 별도의 검증 자료이며 브라우저 임의 정밀도 계산 능력으로 표시하지 않는다.

최대 예산은 계산 work unit 5천만, 120초, 16,384점이다. `maxOperations`는 정의된 수치 루프의 work unit이며 CPU의 모든 부동소수점 명령 개수와 같지 않다. 취소 callback과 제한 시간을 수치 루프에서 검사한다. root worker의 독립 timeout/termination도 유지한다.

큰 실수가 정수처럼 표현되어 JavaScript safe integer 범위를 벗어나면 다음과 같이 보존한다.

```json
{ "kind": "FLOAT64", "value": "1.00000000000000000e+20", "precisionBits": 53 }
```

결과를 NaN/Infinity를 포함한 성공으로 승격하지 않는다. 타이밍과 실제 work-unit 사용량은 최상위 `executionMetrics`에만 기록된다. 수학 결과의 반복 실행 해시에 wall-clock 시간이나 캐시 hit 수가 섞이지 않는다.

## 수학적 구성

### 실제 similarity 좌표

원문 pp.24–25, (4.1)–(4.2)의

\[
\tau=q(1-\eta^2),\qquad z=q^{1/2-h}\eta,\qquad X=r^2/(2q)
\]

를 사용한다. 역변환은 단조 방정식 `q − z²q^(2h) = tau`를 bracketed bisection으로 풀고 부호 있는 η를 복원한다. `L=1−2hη² ≥ 1−2h >0`는 좁은 Lean 항등식/부등식 어댑터로 확인되며, 수치 root bracket 자체는 interval root proof로 표시하지 않는다. ν 재척도화에는 좌표와 속도에 √ν, pressure에 ν를 적용한다.

시간과 축 미분은 원문의 `T_b`, `Z_b`를 사용한다. q·X·η를 서로 독립적인 Cartesian 상수로 취급하지 않는다. 고정된 similarity 창에서 형식적인 스케일은 `r∼tau^(1/2)`, `z∼tau^(1/2−h)`, `u∼tau^(−1/2−h)`이고, 유한한 core profile의 에너지 지수는 `1/2−3h`다. 이 지수 항등식은 Lean으로 검사하지만, 미완성 후보가 원문의 blowup 정리를 증명한다는 뜻은 아니다.

### Heat factor와 외곽

원문 p.138 (A.32)–(A.38)의 적분을 직접 사용한다.

\[
H(Z)=\Gamma(1+h)^{-1}\int_0^\infty e^{-v}v^h(1+Zv)^{-h}\,dv.
\]

`heatIntegralCertificate`는 `v=exp(y)`를 사용해 `y∈[-40,6]`를 적분한다. 분자와 Γ 분모를 각각 interval quadrature로 계산하고 두 꼬리를 추가한다. exp/log는 단순 `Math.exp/log`의 값을 증명으로 취급하지 않고, range reduction과 Taylor/atanh remainder로 둘러싼다. Simpson remainder에는 interval로 구한 4차 도함수 상계를 사용한다. 도함수는 integrand의 실제 미분 적분에서 계산한다.

\[
H^{(m)}(Z)=\frac{(-1)^m(h)_m}{\Gamma(1+h)}
\int_0^\infty e^{-v}v^{h+m}(1+Zv)^{-h-m}\,dv.
\]

원문의 무한 Taylor 급수는 h>0일 때 수렴반경이 0이다. `heatTaylorFinite`는 유한 합과 remainder bound를 반환하며 이를 수렴 무한급수라고 부르지 않는다. 별도의 fast path는 adaptive Simpson의 수치 추정값이며 rigorously enclosed output과 구분한다.

외곽 K에 대해서는 원문식을 r>0에서만 평가하고, centrifugal pressure `p_r=K²/r`를 포함한다. `cInfinity=1`은 임의 표시 정규화다. 이 z독립 성분은 단독으로 R³ 전체 유한 에너지 해가 아니며 실제 core와 자동 접합하지 않는다.

### 실제 비선형 축 계수

`axis-series.mjs`는 원문 pp.144–148 (B.12)–(B.16)의 Φ,u,p를 계수 재귀로 계산한다. η 미분은 유한 Taylor jets, radial nonlinear product는 실제 Cauchy product로 구성한다. pressure primitive는 계산된 Φ 전체 제곱의 degree `2N`까지 보존한다. `f0(Yχ)`는 comparison이며 Φ 대신 대입하지 않는다.

Degree4→8 fixture에서 angular leading residual은 약 `4.19e-4 → 7.32e-11`로 줄었고, 실제 Φ 약 `0.899593`은 scalar comparison 약 `0.907725`와 다르다. Cartesian axis 표현은 F와 V0/X를 사용해 r=0에서 직접 나눗셈을 피한다. 원문 평균 항등식을 가정했을 때의 solenoidal cancellation은 Lean으로 확인하고, 실제 유한 core의 Cartesian FD normalized divergence는 약 `4.34e-11`이었다.

Bρ의 invariant ball·contraction constant·common complex domain·nonlinear tail은 아직 인증되지 않았다. 따라서 위 결과는 원문 nonlinear recurrence의 **유한 계산**이다. Scalar f0의 entire-series tail을 nonlinear Φ의 tail로 재사용하지 않는다.

### 외곽 일정·다섯 모멘트·cone

`radial.mjs`는 원문의 smooth step, raw E radial schedule, terminal wait와 heat exterior를 실제 계산한다. 극단적으로 큰 반경은 log radius/log normalization으로 보존한다. 예약 patch는 서로 분리된 구조로 출력한다. 압력 datum은 아직 완성된 A.7/A.8/A.11 보상을 포함하지 않는 유한 reference integral이며 quadrature difference 및 tail 가정의 미인증 여부를 출력한다.

다섯 모멘트 `M,I,J,S,Cp`의 변화에는 `du²`, `dE²`, `du*dE`를 포함한다. 다섯 disjoint C∞ bump의 5×5 Jacobian을 계산하고 Newton을 실행한 다음 다른 3201점 적분으로 다시 확인한다. 작은 planted fixture의 normalized residual은 약 `6.24e-9`로 목표 `1e-8`을 통과했다. Quadratic term을 빼면 약 `8.24e-5`가 남아 거부된다.

실제 candidate의 diagnostic continuation이 만든 더 큰 모멘트 차이는 수리되지 않았으며, 이를 성공으로 바꾸지 않는다. Source B.5 controlled continuation, continuous interval Newton과 η 전구간 조건은 아직 필요하다.

C.12 modulation 연산은 명시적 periodic primitive로 실행하여 값 변화와 radial derivative 변화를 따로 출력한다. 작은 parameter box의 **모든 실수 tuple**에 대해 cone 부등식을 outward interval로 확인하는 별도 인증도 제공한다. 그러나 이 box는 actual profile의 모든 (X,η) 값을 포함한다는 증명도, C.1 admissible loop의 존재 증명도 아니다. 전체 source cone gate는 여전히 막혀 있다.

## 검증 결과와 증거 등급

`node mathscope-m1/navier/verify.mjs`는 현재 **90/90** 검사를 통과한다. 검사는 실제 예제, 100자리 기준값 포함 여부, 원문 외곽 PDE 잔차, 실제 core 발산, nonlinear refinement, FFT/direct convolution, energy cancellation, 다섯 모멘트 재적분, whole-box cone, 잘못된 부호·누락·지지·정밀도·취소·예산 및 replay hash를 포함한다.

주요 독립 경로는 다음과 같다.

- 7점 Cartesian FD와 원문 analytic jets.
- Binary64의 log-variable 적분과 mpmath100자리의 원래 v-variable 적분/미분.
- Mixed-radix3DFFT + 3/2 padding과 coefficient-space direct convolution.
- 801점 Newton 구성과 3201점 독립 moment 재적분.
- JS scalar comparison과 Lean의 정확한 rational finite partial sum.

전체 PDE 잔차가 작은 것을 solution-error bound로 반환하지 않는다. 실제 leading core의 full NS residual에는 source leading equation이 생략한 axial viscosity 등이 남는다. 별도 fixture의 normalized full residual은 약 `.995`였고 이것을 실패한 Navier–Stokes 해로 숨기거나 0으로 만들지 않았다.

## Lean과 출처

첨부 SHA는 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이며 공식 저장소 commit은 `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`다. 원래 manifest의 toolchain은 Lean4.34.0-rc2다.

M1의 좁은 kernel 검사에서는 **수정하지 않은** 외부 `NavierStokes.Flatness`, `NavierStokes.ProblemStatement`를 local Lean/mathlib4.34.1로 컴파일하고 adapter를 import했다. Local13개 target의 타입, 표준 공리 `[propext, Classical.choice, Quot.sound]`, source/log/olean hash를 보존했다. 거짓 `0=1`과 quadratic term 누락 proof는 실제로 거부되었다. 이 검사는 원래 rc2 전체 repository/C-D Comparator 결과와 구분한다.

추가로 원본 N1-05/06에 따라 **별도 isolated rc2 실행**을 완료했다. 원래 C/D 제출 target `NavierStokes.ComparatorSolution`은 2026-10-09 16:05:12 UTC에 9,371개 Lake 작업, 종료 0을 기록했다. 별도 원래 rc2의 타입·공리 출력 entry도 16:06:24 UTC에 종료 0이며, 두 exported declaration은 각각 `[propext, Classical.choice, Quot.sound]`만 보고했다. 표준 CLI의 경로 탐지 오류와, 공식 rc2 커널을 그대로 호출한 명시 경로 entry 실행을 별도 프로파일로 보존한다.

원래 전체 기본 `lake build`는 C/D를 우선하기 위해 실제 종료 -15로 중단했다. C/D local closure는 609/609인 반면 NS root source closure에는 61개, 전체 NS library에는 115개, Euler에는 1,817개 `.olean`이 미생성으로 남았다. 이 재고를 전체 default 성공으로 해석하지 않는다. 원래 보호된 Comparator 호출은 사용자 systemd bus에서 종료 1이며 독립 환경 조사도 활성 manager/DBus 및 cgroup 위임 부재를 확인했다. 가드는 변경하지 않았고 Comparator는 BLOCKED다.

정확한 타입, 공리, 원문 사본, 실제 명령·환경·로그·해시는 `official-validation/official-audit-summary.json`과 연결 파일에 있다. `provenance.generated.mjs`의 `officialValidation`은 이 결과의 간결한 별도 scope다. 기존 14:39 Lean 4.34.1의 13개 local target receipt, 브라우저의 source validation, 전체 수치 profile의 인증 상태를 자동으로 승격하지 않는다. N1-05/06은 전체 기본 빌드 및 독립 Comparator 기준 때문에 PARTIAL을 유지한다.

## 파일과 재현

| 파일 | 용도 |
|---|---|
| `index.mjs` | root 엔진 API와 JSON/status/precision 계약 |
| `numerics.mjs`, `heat.mjs`, `coordinates.mjs`, `axis-series.mjs`, `radial.mjs`, `profile.mjs` | 실제 계산 구성요소 |
| `checks.mjs`, `verify.mjs` | 독립 경로와 음성 대조군 |
| `generate-fixtures.py` | mpmath1.3.0,100자리 reference 생성 |
| `sources.lock.json`, `paper-reference-map.json`, `theorem-contract.json` | 첨부·공식 pin·166쪽 source map |
| `analytic-contracts.json`, `analytic-adapters.md` | 정확한 해석 가정과 검증 범위 |
| `formal-adapters.json`, `formal-import-map.json` | 참조와 실제 import/kernel 검사의 분리 |
| `lean/reproduce.py`, `evidence/lean-validation.json` | 좁은 kernel 재현과 로그 |
| `official-validation/official-audit-summary.json`, `official-validation/AUDIT.md` | 추가 원래 rc2 C/D 실제 실행과 독립 Comparator 차단 증거 |
| `evidence/numerical-validation.json` | 90개 유한 검사 결과 |
| `evidence/leading-profile-candidate.json` | 실제 실행된 candidate 표본과 모든 차단 조건 |
| `checklist-status.json`, `CHECKLIST.md` | 원본24개 결과와 I1/I3 교차 항목 |

원본24개 기준은 현재 **PASS15 / PARTIAL7 / BLOCKED2**다. N3-05와 N3-06은 원문 접합·cone 기준으로 BLOCKED이며, N3-01/02/03/04/07은 구체적인 미해결 조건이 있다. N3-08의 PASS는 모든 profile 증거/미해결 사유를 일관되게 묶고 full-grade를 차단하는 **데이터 계약**을 뜻한다. N4–N8의 background/Borel, pulse, 잔차 보정, compact force 및 최종 construction은 구현 범위에 포함하지 않는다.
