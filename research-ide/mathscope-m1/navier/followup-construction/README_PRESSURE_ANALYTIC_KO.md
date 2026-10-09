# A.21 원문 목표 압력의 해석적 상계 producer

## 완료 범위

`pressure-analytic.mjs`는 Appendix A.21의 **수정 전 이상적 스케줄 압력**을 입력 매개변수에서 직접 정의하고, 양의 혼합 측도에 대한 해석적 부등식으로 전체 실수 구간 및 복소 근방의 압력·압력 도함수 상계를 계산한다. 사용자에게 총질량·노름·참이라는 플래그를 받지 않는다. 수치 적분값도 인증 입력으로 사용하지 않는다.

핵심 결과는 양쪽 무한 꼬리를 포함하는 유한 양의 질량의 유리수 포위, 정확한 입력 `h` 결속, 정수가 아닌 지수에 사용할 복소 로그 가지, 적분 아래 미분을 허용하는 공통 우세함수, 모든 매개변수 미분 차수의 Cauchy 상계다. 실제 계산은 JavaScript `BigInt` 유리수와 나머지 항을 포함한 지수함수 포위로 수행한다.

**이 기록은 새로 생성한 전체 해석적 전제 묶음의 Lean 커널 증명이 아니다.** 기존 Lean 스칼라 타깃이나 외부 원문 C/D 선언을 이 매개변수별 인증서의 증명으로 자동 연결하지 않는다. 보정된 수치 `E`가 A.21 목표 압력과 정확히 같은 총압력 증가량을 갖는다는 모멘트 항등식, 모든 원문 매개변수 선택 조건, 전체 Navier–Stokes witness는 계속 미인증이다.

| 구분 | 이 producer의 상태 |
|---|---|
| 입력에서 질량 상·하계 계산 | 구현·검사 완료. caller norm/질량을 받지 않음 |
| 로그 반경의 두 무한 끝 | 해석적 지수 포락선에 포함 |
| 전체 실수 구간의 `P`, `Pprime` | 정확 유리수 구간 전파와 혼합 부등식 |
| 복소 tube 및 정수가 아닌 지수 | 우반평면에서 principal Log 사용, 분모 분리 |
| 적분 아래 미분·모든 차수의 Cauchy 상계 | 아래 해석적 논증 및 유리수 상수 계산 |
| 숫자 `h`와 축 `h` | 실제 binary64 값의 정확 유리수 일치 검사 |
| 17점 시각화 | 목표 압력의 포위 구간 표시. 점의 정확한 압력값을 계산했다는 뜻이 아님 |
| 보정된 `E`와의 정확 압력 일치 | 미인증 |
| 기존 유한 η jet과 실제 해석적 고정점의 일치 | 미인증 |
| 새 전제 묶음의 Lean 증명 | 미구현, 신규 Lean 타깃 0개 |
| 전역 witness·전체 원문 N3 완료 | 주장하지 않음 |

## 1. 원문과 대상 함수

원전은 OpenAI의 [Finite time blowup for Navier–Stokes](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)다. 사용한 PDF의 SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이며, 저장소는 [고정 커밋 f9e8bc5…](https://github.com/openai/NavierStokesAndEuler/tree/f9e8bc5b38b6e212696e8a30e3e91517af887bbd)이다.

| 원문 위치 | 사용한 내용 |
|---|---|
| 129쪽 A.5–A.9 | smooth step, inner power, 초기 전이, 매개변수 선택 순서 |
| 130쪽 A.10–A.13 | θ 보간, pressure-preserving 수정, 외부 전이, terminal Q 식 |
| 133–134쪽 Lemma A.5 / A.21–A.23 | 수정 생략 목표 압력, 양의 혼합 구조, 복소 해석성, η 도함수 부호 |
| 145쪽 B.4 | 해석적 계수 공간의 가중치 |

Lemma A.5는 총압력 증가량을 보존하는 각도 방향 `E` 수정을 생략하되 다른 전이 길이는 유지한 `E_id,sched`를 사용한다. 전역 로그 반경을 `y=log(X/XR)`로 두면

\[
P(z)=-\frac12\int_{\mathbb R}E_{\mathrm{id,sched}}(y,z)^2\,dy
     =-\int_{\mathbb R}(1+z^2)^{-2\theta(y)}\,d\mu(y),
\quad d\mu(y)=\frac12E_{\mathrm{id,sched}}(y,0)^2\,dy,
\quad 0\leq\theta(y)\leq1.
\]

`mu`는 양의 측도다. θ는 inner·초기 전이·중간 power·axial pulse에서 1이며, A.10에서 0으로 내려간 뒤 외부 구간에서는 0이다. 이 압력은 `XR`에 의존하지 않는다. terminal 기다림의 스케줄은 A.11에서 예정한 초기 비율에 따른 `Q0=(lambda-h)/(1-lambda)`에서 정의한다. 이 정의와 아래 Q 비교는 수치 각도 bump가 A.11을 정확히 실현했다는 별도 주장을 포함하지 않는다.

## 2. 입력 계약과 정확한 h

```js
import {
  sourcePressureAnalyticExampleInput,
  validateSourcePressureAnalyticInput,
  createSourcePressureAnalyticProducer,
  certifySourcePressureAnalytic
} from './pressure-analytic.mjs';

const input = {
  parameters: {
    Md: 1, logP: 14, lambda: 0.0002, h: 1e-8,
    logXR: 20, Tf: 64, co: 0.005
  },
  boundBits: 128,
  realWindow: '11/10',
  tubeRadius: '1/64',
  coefficientRadiusRatio: '1/16'
};

const checked = validateSourcePressureAnalyticInput(input);
const producer = createSourcePressureAnalyticProducer(input, budget);
const real = producer.realBounds(['-1/2', '1/2']);
const complex = producer.complexBounds({tubeRadius: '1/64'});
const binding = producer.bindAxisH(producer.parameterHExact);
// certificate와 certifySourcePressureAnalytic의 반환은 함수 없는 JSON이다.
```

매개변수 객체의 부분 입력은 공개된 기본값과 병합한다. 숫자는 `DataView`로 부호·지수·가수를 읽어 **그 binary64 값 자체**를 유리수로 바꾼다. 유리수·십진수 문자열은 문자열이 나타내는 정확한 수로 읽는다. 따라서 기본 숫자 `1e-8`의 값은

\[
h=\frac{3022314549036573}{302231454903657293676544}
\]

이며 문자열 `1/100000000`과 정확히 같지 않다. 축 소비자는 반환된 `parameterHExact`를 사용해야 하며 다른 h는 `AXIS_H_MISMATCH`로 거부된다. `inputBinding`에 원래 입력 종류, 정확 유리수, 표시용 숫자 근사, 두 값의 정확 일치 여부를 남긴다.

지원 범위는 `Md∈[0.2,4]`, `logP,logXR∈[0,100]`, `lambda∈[0.00005,0.005]`, `h∈[10^-12,0.001]`, `Tf∈[64,512]`, `co∈[0.00001,0.01]`이며, 추가로 실제 논증에 쓰는 `0<h<lambda/2`, `lambda<1/100`, `h<1/100`, `0<co*h<1/100`을 정확 비교한다. 쓰인 십진수 경계와 그 경계의 실제 binary64 표현을 모두 수용한다. `boundBits`는 64–256, `1≤realWindow≤2`, `0<tubeRadius<1/2`, `0<coefficientRadiusRatio≤1/2`다.

`validateSourcePressureAnalyticInput`는 구조·지원 범위·정확 스칼라 비교만 수행한다. 지수함수 평가, ODE, 적분, 전체 인증 실행은 하지 않는다. 계산 및 Euclidean gcd 반복은 실행 budget으로 제한한다. 17점과 두 경계 곡선의 총 51개 표시 꼭짓점보다 작은 `maxPoints`, 연산 초과, 취소를 명시적으로 거부한다.

이 유한 입력 범위는 원문의 모든 “충분히 작다/크다” 상수를 해결했다는 뜻이 아니다. `logP>Td`, `h<exp(-Td)` 두 필요조건을 별도 정확 포위로 비교하여 `PROVED`, `DISPROVED`, `UNDECIDED`로 기록한다. 전체 A.6 순서 인증은 항상 별도 미완료다. 예컨대 `logP=0`에서도 이 명시적 목표 압력은 정의되고 해석적 상계가 존재하지만, A.6의 큰 압력 조건은 `DISPROVED`로 남는다.

## 3. 두 무한 끝을 포함한 질량 포위

`P*=exp(logP)`, `rho_o=co*h`로 놓자. inner 구간에서

\[
E(y,0)=P_*e^{y/10}\quad(y\leq0),\qquad
C_{\mathrm{inner}}=\frac12\int_{-\infty}^0E(y,0)^2dy=\frac52P_*^2>0.
\]

초기 `0≤y≤1` 구간의 실제 식은

\[
E(y,0)=P_*\exp\left(\frac y{10}-\frac35\int_0^y\sigma(t)dt\right).
\]

`0≤sigma≤1`이고 A.5의 대칭성 `sigma(t)+sigma(1-t)=1`로 `integral_0^1 sigma=1/2`다. 따라서 `E(1,0)=P* exp(-1/5)`이며 초기 적분은 `P*² exp(y/5)`로 제어된다. 이후 terminal collar 이전의 모든 전이는 `y=0` 압력 기준에서 로그 E 기울기가 `-1/2` 이하이다. collar의 단 한 번의 비율 증가도 `1/(1-rho_o)` 이하이다. 모든 `y≥1`에 대해

\[
E(y,0)^2\leq
\frac{P_*^2e^{-2/5}e^{-(y-1)}}{(1-\rho_o)^2}.
\]

그러므로 `C=mu(R)`는 다음의 명시적 포위에 들어간다.

\[
\boxed{
\frac52P_*^2\leq C\leq
P_*^2\left(\frac52e^{1/5}
+\frac{e^{-2/5}}{2(1-\rho_o)^2}\right).
}
\]

무한 끝을 유한 절단점으로 잘라내지 않는다. 기본 입력에서 오른쪽 정규화 상계는 약 `3.38866691845176`이고, 별도 고정밀 진단 적분의 pulse까지 정규화 질량은 약 `3.31462272977049`다. **그 진단 적분은 검증되지 않은 수치 대조 값이며 상계를 만드는 입력이 아니다.**

`innerThetaOneMass.exactExpression`은 `(5/2)*exp(2logP)`다. 그 아래 `lower`, `upper`는 각각 정확 유리수이지만 초월적인 질량 자체가 그 유리수 중 하나와 같다는 주장은 아니다. `isRationalValueClaim:false`가 이 차이를 표시한다.

### Terminal 스케줄의 유한 길이

Q의 선형 방정식 `Q'+(1+l)Q=-l-h`에 적분 인자 비교를 적용한다. 첫 전이에서

\[
e^{-(1-\lambda)}Q_0\leq Q_1\leq Q_0+1-h.
\]

`h<1/100` 및 `2<e<3`에서 `16<4log(1/h)≤4(1/h-1)`를 얻는다. 다음 flatten 전이의 감소율 적분은 `(1-h)/2` 이하이며 원천항은 음수가 아니다. 한편 A.13의 `fo`를 약분하면

\[
Q_p=\int_1^3e^{(1-h)t}\frac{f_o'(t)}{1-\rho_o}dt,
\quad
\frac{\rho_o e^{1-h}}{1-\rho_o}\leq Q_p\leq
\frac{\rho_o e^{3(1-h)}}{1-\rho_o}.
\]

계산기는 정확히 `Q_before,lower>Qp,upper>0`을 확인한다. 따라서 기다림

\[
0<\frac{\log(Q_{\mathrm{before}}/Q_p)}{1-h}
\leq\frac{Q_{\mathrm{before},u}/Q_{p,l}-1}{1-h}<\infty
\]

이 성립한다. 이 거친 길이 상계는 수치 QODE 결과에 의존하지 않는다. 이 단계가 각도 bump의 정확 모멘트 복원까지 증명하지는 않는다.

## 4. 전체 η 구간과 작은 혼합 꼬리

`F=1+eta²`이고 질량 포위를 `Cl≤C≤Cu`라 쓰자. 양의 혼합 구조에서

\[
P\in[-C_u,-C_l/F_{\max}^2],\qquad
P'=4\eta I,\quad
I=\int\theta F^{-2\theta-1}\,d\mu
\in[C_{\mathrm{inner},l}/F_{\max}^3,C_u/F_{\min}].
\]

임의의 입력 유리수 구간 `[etaLower,etaUpper]` 전체에 대해 제곱·곱셈을 정확 구간 연산으로 전파한다. `eta=0`에서 도함수는 정확히 0이고, 0을 지나지 않는 양·음 구간에서는 inner 질량 때문에 엄격한 부호가 보존된다.

θ가 1을 벗어나는 것은 길이 `13/lambda`인 axial pulse 이후다. 그 시점의 `E²`는 `P*² exp(-13/lambda)` 이하이므로 혼합 suffix의 질량 `T`는

\[
0<T\leq\frac{P_*^2e^{-13/\lambda}}{2(1-\rho_o)^2}
\leq\frac{P_*^2 2^{-k}}{2(1-\rho_o)^2},
\quad k=\min(\lfloor13/\lambda\rfloor,512).
\]

유리수 `2^-k`는 매우 작아도 양수로 보존한다. cap 512는 포위를 넓힐 뿐, 꼬리를 없애지 않는다. 이 정보로 더 좁은 포위

\[
P=-C/F^2-R,\quad0\leq R\leq T(1-F^{-2}),
\]

\[
P'=4\eta C/F^3+R',\quad |R'|\leq4|\eta|T/F
\]

를 얻고, 기본 양의 혼합 포위와 교차시킨다. 실제 압력은 θ=1 항 하나로 된 단순 유리함수와 동일하다고 선언하지 않는다.

## 5. 복소 로그 가지, 적분 아래 미분, 전 차수 노름

실수 구간 `[-W,W]`에서 거리 `r` 미만인 복소 tube를 사용한다. 코드의 지원 범위는 `r<1/2`이며 아래 부등식 자체는 `r<1`이면 성립한다. `z=x+iv`에 대해

\[
\Re(1+z^2)=1+x^2-v^2>1-r^2=:\delta>0,
\qquad |z|<W+r.
\]

정수가 아닌 θ에 대해서는 우반평면의 **principal Log**로

\[
(1+z^2)^{-2\theta}
=\exp[-2\theta\operatorname{Log}(1+z^2)]
\]

를 정의한다. `0≤theta≤1`에서 적분 integrand와 첫 도함수의 절댓값은 각각 `delta^-2`, `4(W+r)delta^-3` 이하이다. 이 상수들은 y에 독립적이며 유한한 양의 μ에 대해 적분 가능하다. 따라서 holomorphic integral 정리와 적분 아래 미분의 우세 조건이 충족되고,

\[
\boxed{|P(z)|\leq C_u\delta^{-2},\qquad
|P'(z)|\leq4(W+r)C_u\delta^{-3}.}
\]

`complexBounds`는 분모의 실수부 하계, modulus 하계, 이 두 상계, principal Log 규약, 공통 우세함수를 모두 반환한다. 이는 복소수 격자의 점검 결과를 전체 tube의 성질로 승격한 것이 아니다. 복소 표본은 위 해석적 논증에 대한 별도 구현 점검으로만 사용된다.

실수 계수 구간의 각 점에 반경 `rC=r/2`인 Cauchy 원판을 놓으면 모든 정수 `m≥0`에 대해

\[
|P^{(m)}(\eta)|\leq m!M/r_C^m.
\]

`rho=q rC`, `0<q≤1/2`를 선택한다. B.4에서 반경 차수 0인 압력의 노름은

\[
\|P\|_\rho\leq
M\sum_{m=0}^{\infty}(m+1)^2q^m
=M\frac{1+q}{(1-q)^3}
\]

로 제한된다. `Pprime`도 그 함수의 복소 상계에 같은 논증을 적용한다. 계수 공간 정의는 supremum이지만 양의 급수 합은 그 supremum의 유효한 상계다. 출력은 실제 도함수 규약을 쓰며 Taylor 계수와 `m!`를 혼동하지 않는다.

## 6. 지수함수 포위와 시각화

지수함수 계산에서 `Math.exp`, `Math.log`, 수치 적분을 쓰지 않는다. `x/2^k=t≤1/8`로 줄여 24차까지의 양의 Taylor 합을 정확 유리수로 구한다. 첫 생략항은 `t^25/25!`이고 이후 연속항의 비율은 `t/26` 이하이므로 전체 나머지는

\[
\frac{t^{25}/25!}{1-t/26}
\]

로 포위된다. 하계는 아래쪽, 상계는 위쪽 dyadic 반올림을 적용하고, 제곱을 되풀이할 때마다 같은 방향 반올림을 수행한다. 음의 지수는 양의 지수 포위의 정확 역수로 처리한다. `exponentialAudit`에 유한합·첫 생략항·비율·tail·각 제곱 단계를 남긴다. `boundBits`는 dyadic 격자의 비트 수이며, 전체 결과가 그 비트 수만큼 좁다는 정밀도 보증은 아니다. 유한 Taylor 나머지도 그대로 반영된다.

화면의 17개 관측은 `eta=-1,-7/8,...,1`에서 압력의 정확 유리수 포위를 구한다. `P*²=exp(2logP)`도 별도 양의 포위로 계산한 다음 **구간 나눗셈**으로 `P/P*²` 포위를 얻는다. raw `P`, `Pprime`, 정규화 구간, 중점, 반폭은 모두 문자열 유리수로 원본 표에 남는다.

3차원 좌표는 `[eta, 정규화 구간 중점, 정규화 구간 반폭]`이며 두 경계 곡선은 높이 0에 그린다. 이는 실제 유체 공간의 투영이 아니라 인증 구간의 함수 그래프다. 표시용 binary64 좌표를 증명 입력으로 사용하지 않는다. 전체 η 성질의 근거는 17점의 보간이 아니라 앞의 균일한 해석적 부등식이다.

## 7. 실제 검증과 재현

새 모듈 자체의 Node 실행·거부 검사 **70/70**, 별도 Python `Fraction` 및 mpmath 120자리 대조 **306/306**가 통과했다. 이 수는 원문 70개 체크리스트나 기존 Lean 71개 타깃의 개수가 아니다. 신규 Lean 타깃은 0개다.

Node 검사는 exact h 일치/불일치, 잘못된 구조·caller norm·NaN·Infinity 거부, 취소·예산, 동일 원본 입력의 JSON 결정성, 64·128·256비트 및 지원 범위 끝값, 구간 시각화, 전역 증명 플래그 분리를 포함한다. `Math.exp/log/log2/pow`를 예외 발생 함수로 바꾼 상태에서도 정규화와 실제 producer 실행이 성공하는 것을 확인했다.

Python 검사는 모든 저장된 지수함수 trace를 독립 Fraction 연산으로 재구성하고 120자리 `exp`와 대조한다. 질량·Q·실수 포위·복소 분리·정규화·노름 계수도 별도로 다시 계산한다. 다음 다섯 음성 대조가 거부된다.

1. Taylor 나머지 생략.
2. inner 질량만을 전체 질량의 상계로 사용.
3. 복소 분모가 1보다 작아지는 효과 생략.
4. 압력 도함수의 계수 4를 2로 변경.
5. 작지만 양수인 혼합 꼬리를 0으로 처리.

Node 24와 Python 3 + mpmath로 다음을 실행한다. 로컬 작업공간에 arithmetic의 기존 mpmath 사본이 있으면 reference가 이를 읽으며, 독립 배포본에서는 Python 환경에 mpmath가 필요하다.

```sh
node mathscope-m1/navier/followup-construction/pressure-analytic.verify.mjs
python mathscope-m1/navier/followup-construction/pressure-analytic-reference.py
```

검증 파일은 `pressure-analytic-fixture.json`, `pressure-analytic-cases.json`, `pressure-analytic-validation.json`, `pressure-analytic-independent.json`이며 실행 로그와 스크립트를 함께 보존한다. 생산 함수의 JSON에는 날짜·실행시간·nonce를 넣지 않는다. 실행 원장의 시간 정보는 인증 대상의 수학적 결과에서 분리된다. 숫자/문자 입력의 종류까지 메타데이터에 보존하므로 재현 해시는 **같은 원본 입력**끼리 비교한다.

생산 소스 SHA-256은 `3481258e834a6220476eac870568becf4cb9aa88e16a0c67f7057ad54634e59e`, fixture SHA-256은 `a9fdad0a470b6b933ac4fff2b889a5b4227ddce90fa351d83c161f4529c439de`이다. frozen `outer.mjs`의 SHA-256 `4c0213f892a32611c79655fbe065cebbaca0fc9acdd0cf2dd057d2506a10c087`는 유지됐다. 상세 파일 목록과 해시는 `pressure-analytic-manifest.json`에 기록한다.

소비자 주의: 256비트 질량 상계 문자열은 기본 매개변수에서도 약 642자로, 외부 소비자의 600자 입력 parser를 넘을 수 있다. 이는 producer의 실패가 아니다. 소비자는 내부에서 생성된 bound를 명시적인 더 큰 파싱 예산으로 읽거나, 지원 불가를 반환해야 한다. 사용자 제공 bound를 허용하거나 조용히 숫자로 축약하는 방식으로 우회해서는 안 된다.
