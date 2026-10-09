# 원문 B.22/B.26 및 C.1 후속 연산

이 디렉터리의 후속 구현은 입력으로 고른 유한 axis 후보에 원문의 **실제 reference continuation과 shear ODE**를 적용하고, 별도의 명시적 cone 상태에는 원문의 **실제 지수 tilt, 분산 근, 위상 재매개화**를 적용한다. 후속 검토에서 발견한 식 (4.16)의 전사 오류를 교정했으며, 수정 전 소스·결과·검증 기록은 `history/ns-wu-scaling-v1/`에 바이트와 SHA를 보존했다. v50 기존 릴리스의 원본 기록도 유지한다. 원문 전체 leading profile 또는 Navier–Stokes 해의 인증으로 승격하지 않는다.

원전은 첨부 `01-navier-stokes.pdf` 166쪽, SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. 아래 쪽수는 PDF 쪽수와 일치한다. 해당 수치 실행은 새 Lean kernel 증명이 아니다. 기존 v50의 13개 local target 및 별도 rc2 C/D 두 정리 검증을 변경하지 않는다.

## 1. API와 계산 범위

```js
import {
  runControlledContinuation,
  validateContinuationInput,
  getContinuationExamples
} from './controlled-continuation.mjs';
import {
  runAdmissibleLoop,
  validateLoopInput,
  getLoopExamples
} from './admissible-loop.mjs';

const continuation = await runControlledContinuation(input, budget);
const loop = runAdmissibleLoop(input, budget);
```

`budget`은 기존 `numerics.mjs`의 `makeBudget`이 만든 객체 또는 `maxOperations`, `maxMilliseconds`, `maxPoints`를 가진 예산 JSON이다. 취소 hook은 공통 엔진이 만든 budget을 통해 전달한다. 사용자 입력에 실행 가능한 함수나 callback을 넣는 통로는 없다. 수학 결과에는 현재 시각·경과 시간이 들어가지 않는다.

성공적인 후보 계산은 `status: 'PARTIAL'`을 반환한다. 상수·계수 범위를 벗어나면 `PRECISION_REQUIRED`, 조건을 위반하면 `FAILED`, 미지원 자료 계열은 `UNSUPPORTED`, 예산 초과와 취소는 각각 `BUDGET_EXCEEDED`, `CANCELLED`이다. 원래 세부 상태는 `domainStatus`에 보존한다. 안전한 정수 범위를 벗어나는 정수 모양의 Float64 값은 `{kind:'FLOAT64',value:'...',precisionBits:53}`로 기록한다.

두 결과 모두 `sourceReferences`, `certifiedConditions`, `missingConditions`, `fullProfileCertified:false`, 실제 표본에 근거한 `visualization`을 포함한다. `certifiedConditions`의 **scope**를 읽어야 한다. C.1의 모든 위상 인증은 제공한 고정 cone 상태별 명제이며, 원문 전체 `(X,η)` 직사각형에 대한 명제가 아니다.

## 2. Controlled continuation의 실제 연산

입력 예:

```json
{
  "etaValues": [0, 0.2],
  "pressure": {"family": "rational", "K": 10},
  "axis": {"Lambda": 48, "logC": 16, "axisOrder": 10},
  "etaJetOrder": 4,
  "t1": 0.004,
  "axialWidth": 0.02,
  "shearWidth": 0.02,
  "referenceSteps": 48,
  "transitionSteps": 24,
  "radialSteps": 192,
  "samples": 161
}
```

지원하는 범위는 `-1≤η≤1`, η 값 1–9개, axis 차수 4–20, 표시 η jet 차수 2–6, `0<h<0.01`, `0<j0≤0.05`, `Λ>1`, `0≤log C≤600`이다. `4 exp(2t1)<4.1` 및 두 마지막 전이 폭의 합이 `log(110/100)`보다 작아야 한다. 이 입력 검사는 **원문의 sufficiently large/small 상수 선택 인증을 대신하지 않는다**.

1. 기존 유한 B.12–B.15 recurrence로 실제 비선형 axis 계수를 만든다. `F=E/√(2X)=gΦ`와 `U=U*+u/Λ`를 유한 다항식으로 평가한다. `X0=4/Λ`에서 다섯 초기 모멘트는 해당 유한 다항식의 해석적 원시함수로 계산한다.
2. PDF 150쪽 (B.22)의 `y=log(X/X0)` 좌표에서, `y≤t1`에는 원래 유한 axis를 유지한다. `t1<y<2t1`에는 `1−σ((y−t1)/t1)`를 원래 `D_X log F`, `D_X U`에 곱한다. 이 짧은 구간은 RK4로 적분하며, 그 뒤의 `F_r,U_r`는 상수다. 이후 모멘트는 상수 profile의 정확한 유한 원시함수 식으로 전진시킨다. 짧은 구간의 Hermite 보간에는 별도의 연속 오차 인증이 없다.
3. PDF 28쪽 (4.15)의 `M,I,J,S,Cp`와 1차 η 미분으로 (4.16)을 계산한다. `H=√(2X)E`, `W=1−(2DηM+dMη)/X`, `Π=Π_axis+Cp`를 사용한다. `(p1,p2)=(X Qs/L, X Ns/(L E))`를 실제 모멘트에서 복원한다.
4. PDF 152쪽 (B.26)의 `κ=κ0+(1−κ0)(1−σ(y/t1))`, `a=κ p1,r`, `D_X U=−κ X ns,r/2`, `D_X log F=−κ p1,r/2`를 전진 적분한다. 아주 작은 양의 `κ0`를 `1−(1−κ0)·1`로 계산하면 0으로 반올림될 수 있어, 위의 양의 가중합 식을 쓴다.
5. 다섯 모멘트도 같은 실제 field를 사용해 전진시킨다. 로그 좌표의 미분식은 `M_y=XU`, `I_y=XH`, `J_y=XUH`, `S_y=X(U²−E²/2)`, `Cp_y=E²/2`이다. 이 과정은 field 값을 임의로 이어 붙이는 방식이 아니다.
6. PDF 153쪽의 순서대로 `Xb=100` 이후 axial shear를 부드럽게 0으로 만든 뒤 `a`를 `0.8`로 보간한다. 두 전이는 `Xi=110` 전에 끝난다. 끝점에서 실제 `a=0.8`, `D_X U=0`을 반환한다.

기본 `κ0`는 제공한 유한 η 값과 반경 검사점의 reference `Vmax`, `p1max`로 고른 **후보값**이다. `uniformBoundCertified:false`로 기록한다. 원문 Lemma B.4/B.5는 모든 η 및 일정한 reference 폭 가족에 대한 상계를 먼저 요구한다. 이 전체 상계와 오차 상수가 아직 연결되지 않았으므로, 후보값을 증명된 원문 선택으로 표시하지 않는다.

`slices[].constructionCheckpoints`는 좁은 초기 활성화 구간, reference cutoff, 마지막 두 전이의 실제 상태를 별도로 제공한다. 전체 로그 축 표본에서 좁은 구간이 사라지는 문제를 피하기 위한 계산 자료다. `momentEtaJets`에는 실제 모멘트의 저차 η Taylor 계수가 있고, 표시 좌표 `(log X,η,log E)`는 물리 공간의 세 좌표가 아니다.

### 실제 A.21 pressure datum 연결

`pressure.family='source-outer-A21'`이면 같은 폴더의 `outer.mjs`를 호출한다.

```json
{
  "etaValues": [0],
  "pressure": {
    "family": "source-outer-A21",
    "parameters": {
      "Md": 1, "logP": 0, "lambda": 0.0002,
      "h": 1e-8, "logXR": 20, "Tf": 64, "co": 0.005
    }
  },
  "axis": {"Lambda": 48, "logC": 2, "axisOrder": 10},
  "samples": 161
}
```

이는 A.21 전체 schedule의 실제 수치 η jet을 recurrence에 넣는다. axis의 `h`는 외곽과 같아야 한다. 이 예는 유한 계산 연결을 보여 주며, `P*`가 원문 요구만큼 충분히 큰 선택이라는 인증은 없다. 이 후보의 X0 각도 기울기 결함은 약 `2.20e−12`이다. 같은 작은 Λ에 `logP=14`의 큰 외곽 datum을 그대로 넣는 음성 사례는 axis 양성 조건 실패로 거부된다.

별도 `axis-certificates.mjs`가 구한 `Λ≈5.27248e92`, `log C≈1.24605e104`의 analytic tuple과 이 Float64 후보는 **동일한 수치 witness가 아니다**. `log C>600`은 `PRECISION_REQUIRED`로 반환한다. 해당 무한 고정점과 표시한 유한 계수의 동일성·계수 오차·스케일 표현을 별도로 연결해야 한다.

## 3. 실제 C.1 loop

입력은 `{a,bs,ps:[p1,p2],eta,X,boundary,phaseSamples}` 또는 1–32개의 `points` 배열이다. `a>0` 및 PDF 38쪽의 strict relaxed cone 조건을 outward interval로 검사한다. 표시 표본 수는 32–2048이다. `boundary:true`는 그 고정 입력이 이미 `v_s>2`라는 interval 근거가 있을 때만 허용한다.

PDF 159쪽 (C.4)–(C.7)을 그대로 사용한다.

\[
M_e(z)=I_0(z),\qquad
t=t_s+d_0\frac{e^{\mu p_2\sin\theta'}/I_0(\mu p_2)-1}{p_2}.
\]

`p2=0`에서는 `t=t_s+d0 μ sin θ'`를 직접 쓴다. 작은 `p2`에서는 `expm1`과 `log1p(I0−1)`를 사용한다. I0의 unit constant를 먼저 더해 버린 뒤 log를 취하지 않는다.

분산 인증에서는 상쇄를 일으키는 `I0(2z)/I0(z)^2−1` 대신 다음 **양의 급수 항등식**을 쓴다.

\[
V=\frac{d_0^2\mu^2}{I_0(z)^2}
\sum_{n\ge1}\left(1-\frac{\binom{2n}{n}}{4^n}\right)
\frac{z^{2n-2}}{(n!)^2},\qquad z=\mu p_2.
\]

모든 항이 양수이며 뒤쪽 항비의 상계가 1보다 작아지는 지점부터 기하급수 remainder를 넣는다. I0도 독립적인 양의 급수와 remainder로 enclosure를 만든다. 초월 함수 인증에는 `numerics.mjs`의 outward 급수 구간 연산을 사용한다. 현재 scaled-exponent evaluator가 없으므로 `|z|` 구간이 300을 넘으면 정밀도 요구를 반환한다.

하나의 `d0`, 하나의 `μmax`를 제공된 상태 가족 전체에 고르며 `V(μmax,p2)>3/min a`를 검사한다. 이후 전체 `0≤μ≤μmax`의 t 범위를 잡고, C.8의 작은 근과 2의 간격을 안정적인 유리화 식으로 하계한다. **δL은 이 단계 뒤에 정한다.** C.9의 cutoff와 ρ를 만든 다음 C.10의 유일한 분산 근을 outward bracket으로 감싼다.

표시 Float64 cutoff가 underflow 또는 반올림 때문에 0이 되는 것과 원문 cutoff가 정확히 0인 것은 다르다. `certifiedZeroBranch`는 `rhoBox=[0,0]`가 확인될 때만 참이다. 음성 fixture `a=2.002702622456615, ps=[5,0]`는 표시 `zeta=rho=0`이어도 이 인증값이 거짓이며, 전체 가족의 gap 하계를 계속 사용한다.

PDF 160쪽의 가중 재매개화는

\[
\frac{d\phi}{d\theta'}=\frac{a(1+t^2)}{2\pi v},\qquad
(a_L,-b_L)=\frac{v(1,t)}{1+t^2}.
\]

따라서 정확한 분산 근에서는 φ 평균이 `(a,−bs)`다. 균일한 θ′ 평균과 혼동하지 않는다. 실제 표본에서는 θ′ quadrature, 역함수 보간, φ quadrature 오차가 남으므로 원래 lift period 결함, 평균 결함, primitive closure를 각각 반환한다. 표시용 lift를 1주기로 정규화했다는 사실도 기록한다. `phaseCertificate`는 정확한 source root와 모든 위상에 관한 명제이며, 표시 표본의 평균을 오차 없이 같다고 선언하지 않는다.

C.12에 사용되는 평균 0 primitive A와 B/E의 수치 배열은 제공하지만, 전역 `(X,η)` 미분, `N log X` modulation, 실제 변경된 `ps` 및 첫 patch 모멘트 복구는 아직 이 모듈의 결과가 아니다.

## 4. 독립 확인과 수용기준 판정

실행:

```sh
node mathscope-m1/navier/followup-construction/test-continuation-loop.mjs
python mathscope-m1/navier/followup-construction/independent-loop-reference.py
```

첫 검사는 **109/109**를 통과했다. 독립 Gauss quadrature로 다섯 초기 모멘트를 확인하고, 전진 모멘트의 로그 반경 미분을 독립 finite difference로 확인했다. η scalar contraction으로 (4.16)을 재계산했고 단계 폭을 절반으로 줄여 결과를 비교했다. 실제 A.21 연결, 잘못된 h·support·t1·pressure-axis 조합, 예산·취소·큰 상수 정밀도 거부를 포함한다.

### 원문 (4.16)의 전사 오류와 교정 기록

초기 후속 소스는 `Ns`의 `−W U` 항까지 `X`로 나누었다. 초기 scalar 검사 역시 같은 전사를 반복해 기존 109개 검사만으로는 이 오류를 발견하지 못했다. 원문 28쪽의 유도식은 적분 경계항이 `−X W U`이고, 최종식은

\[
N_s=-WU+\frac{D(M-\eta M_\eta)+4h\eta S-dS_\eta}{X}+4A\eta\Pi-d\Pi_\eta
\]

이다. 따라서 `−WU`는 분모 밖에 남아야 한다. 이 오류는 출력만의 문제가 아니라 B.26의 축 방향 ODE와 누적 모멘트에 영향을 주므로, 소스를 교정하고 결과를 다시 생성했다. 같은 이유로 C.12의 변경 후 잔차 계산도 함께 교정했다.

새 `independent-continuation-formula.py`는 생산 helper를 가져오지 않고 저장된 실제 필드와 다섯 모멘트·η jet에서 원문을 재구성한다. 수정 전 243개 표본은 **243개 모두 FAIL**, 최대 오차 `67.01080019077068`이며 모두 잘못된 `−WU/X` 식과 일치했다. 수정 후 같은 원문 검사는 **243/243 PASS**, 최대 차이 `2.84e−14`다. 그 뒤 109개 실행 검사를 다시 수행하여 모두 통과했다. 수정 전 실패 기록은 `continuation-historical-formula-failure.json`, 수정 후 독립 대조는 `continuation-source-formula-independent.json`에 분리되어 있다. 역사적 PASS 수치를 현재 버전의 증거로 재사용하지 않는다.

두 번째 검사는 별도 mpmath **160자리** Bessel 함수와 각도 적분을 사용하며 **39/39**를 통과했다. 입력·Float64 interval 끝점을 정확히 고정밀 수로 변환해 enclosure 포함을 검사했다. 이 자료는 양의 급수 엔진과 독립된 계산 경로다. 조밀한 표본이 무한 위상이나 무한 시간의 증명을 대신한다는 판정은 하지 않는다.

| 원래 기준 | 이번에 실제 추가한 연산 | 아직 남은 수용 조건 | 판정 |
|---|---|---|---|
| N3-05 | B.22 reference, B.26 actual ODE, 실제 다섯 전진 모멘트, Xi 끝점 shear | B.34 outer transition, 같은 analytic witness의 오차 연결, 원문 B.8/B.35–B.40의 실제 5×5 Jacobian 및 interval Newton 접합 | PARTIAL |
| N3-06 | C.1 지수 tilt·분산 root·재매개화, 고정 상태마다 모든 위상 gap 하계, C.12 primitive 표본 | 전체 `(X,η)` input contract, 충분한 유한 N 선택과 C.12 미분, 첫 patch 모멘트 복원, 전 영역 strict κ 인증 | PARTIAL |
| N3-07 관련 | 두 마지막 transition의 support/끝점 순서, 잘못된 지지 거부, 축 기울기 결함 공개 | 정확한 axis와 continuation의 flat stress factor, 내부 비영 stress 및 양쪽 edge limit, 예약 patch 보존 | PARTIAL |

여기서 남은 것은 두 종류다. B.34·C.12의 field 연산, source bump 배치와 오차 원장 연결은 추가 코드로 진행할 수 있다. 반면 실제 선택한 무한 profile에 대한 전역 Ck/복소근방 상계, Jacobian 역행렬과 비선형 remainder, 모든 η·반경의 strict cone 하계는 **그 선택을 수치적으로 인증하는 수학 작업**이 필요하다. 원문 존재 정리가 있다고 해서 임의 Float64 후보의 이 조건들이 자동으로 참이 되지는 않는다.

특히 유한 axis의 기울기 결함이 작다는 이유로 이를 0으로 설정하면 B.30의 무한차 flatness를 잘못 주장하게 된다. 이 구현은 결함을 그대로 반환하며 `fullStressFlatFactorCertified:false`를 유지한다. `fullProfileCertified`와 `fullNavierStokesSolution`은 모두 거짓이다.
