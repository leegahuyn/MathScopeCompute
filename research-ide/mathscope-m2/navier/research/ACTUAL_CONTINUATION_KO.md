# 같은 N3 소스의 코어 적분·B.22 기준 구간·실제 축방향 연속

이 추가 모듈은 `same-profile-2026-10-10.3`의 실제 비선형 코어를 전체 방사 구간에서 적분하고, B.22 기준 연속과 실제 B.26/B.34/B.8 연속을 구별하여 연결한다. 실제 함수와 명시적 A.2 비교 함수 사이의 **0이 아닌 오차**를 유지한다. 현재 실행한 구간들과 전개한 함수 프로그램은 아래와 같다.

| 결과 | 현재 실행/표현 | 뜻 |
| --- | --- | --- |
| 코어의 일곱 적분, η 차수 0–2 | 21개 BigInt 유리 구간 | 실제 Φ, u의 전 구간 적분. 비교함수와 실제함수의 Banach 오차를 포함한다. |
| B.22 끝점과 다섯 모멘트 | 양의 폭을 유지한 구간 | 실제 B.22 **기준** 함수. B.26 물리적 연속으로 바꾸어 부르지 않는다. |
| B.22 정규 Ω 적분 | 10개 구간 | 여섯 적분과 필요한 η 미분. 누적 모멘트의 상수항과 로그항을 포함한다. |
| 실제 내측 U, M/X, V/X 및 관련 값 | 10개 전 방사 셀 구간 | 실제 B.26/B.34/B.8 오차와 C.12/I1 보정 오차를 모두 포함한다. |
| A.2 축→외부 펄스→Xv | 4,070개 노드의 명시적 프로그램 | 적분변수·적분구간·피적분함수·진폭근·보정근·η 미분을 전개했다. 전역 적분값은 아직 수치 구간으로 계산하지 않았다. |
| 실제 전역 Ω 모멘트와 A.2의 차이 | 전 η에 균일한 값 오차 | 정규화한 두 함수값의 오차는 각각 `2^-2040+2^-260` 이하이다. 이 구간은 정확한 차이 값 자체를 생성하는 수렴 이름은 아니다. |

현재 Node 검사는 **15/15**, 별도 Python Fraction·Decimal 검산은 **226/226** 통과했다. 이는 아래 새 모듈과 수학적 연결에 대한 로컬 검사다. Worker 동등성, 새 공개 버전, 실제 브라우저 결과는 이 문서에서 주장하지 않는다. 그 결과는 루트 통합/릴리스 증거를 따른다.

## 1. 공개 API와 데이터 결속

```js
import {actualContinuationConstruction}
  from './actual-continuation-construction.mjs';

const result = actualContinuationConstruction({
  sourceProfile: 'same-profile-2026-10-10.3',
  eta: '1/4',
  XInterval: ['1', '100'],
  bits: 192,
  degree: 48,
}, context);
```

`eta`와 방사 끝점은 정확한 유리수 문자열이다. 공개 조합 API는 `-1≤eta≤1`, `1/1024≤Xleft≤Xright≤110`, 96–512비트, 비교 다항식 차수 32–64를 받는다. 취소는 `context.checkCancelled()`로 검사한다. 소스 변경, 잔여 오차 0 지정, 다음 차수 허용 플래그를 입력으로 넣으면 거절한다.

| 반환 경로 | 내용 |
| --- | --- |
| `coreMoments.rows[i].actualInterval` | 실제 코어 적분 구간 |
| `coreMoments.normalizedMomentRows` | 양의 g, Λ 배율을 복원하기 전 다섯 모멘트 계수 |
| `reference.regularIntegrals.values` | 실제 B.22 기준 함수의 정규 적분 |
| `actualAxialCell.rows[i].actualInterval` | 실제 최종 소스의 내측 축방향 셀 구간 |
| `globalComparison.weightedRemainder` | 실제/A.2 차이에 대한 비영 오차 |
| `a2Program.nodes`, `a2Program.roots` | 명시적인 A.2 함수 프로그램 |
| `nextOrderGate` | 실제 total debt가 닫히기 전 다음 차수 생성을 막는 조건 |

Worker 결과가 `job.result.results`에 놓이면 위 경로 앞에 `result.results.`를 붙인다. 구간은 `{lower, upper, denominatorPowerOfTwo, displayEnclosure}` 형식이다. `lower/upper`가 검증에 쓰는 정확한 유리수이며, `displayEnclosure`는 방향 반올림한 유한 표시 좌표다.

각 세부 API도 별도로 호출할 수 있다.

- `evaluateActualCoreMoments({Y, eta:{kind,value}, etaOrder,bits,degree})`: 실제 자연 해의 `0≤Y≤4.1`. `Y>4` 부분은 B.26 입력용 자연 해석 연장이고 실제 물리적 collar가 아니다. 기존 코어 평가기의 `DIRECT_RATIONAL`, `J_SCALED`, `RHO_SCALED` 좌표를 유지한다.
- `evaluateActualB22Reference({eta,etaOrder,X|XInterval,bits,degree})`: 자연 해를 B.22로 평탄화한 기준 구간과 모멘트.
- `evaluateActualAxialContinuationCell({eta,XInterval,bits})`: `0≤X≤110`의 실제 최종 축방향 소스 구간. 방사 미분이나 E는 제공하지 않는다.
- `actualContinuationOmegaComparison({sourceProfile})`: 실제 함수와 A.2 사이의 검증된 오차.
- `compileActualA2AxialProgram({profileId})`: 정확한 A.2 축방향 프로그램. 이 프로그램의 숫자 진단기는 실제 인증기가 아니다.

## 2. 실제 코어를 전체 구간에서 적분하는 방법

같은 실제 소스는

\[
Y=\Lambda X,\qquad F=g\Phi(Y,\eta),\qquad
U=4\eta+j_0+(K/\Lambda)(u/K),\qquad E=\sqrt{2X}F
\]

이다. \(g=\exp(\Lambda\psi)/C\)는 양수인 원래 함수로 남겨 둔다. `g=0`, `h=0`, `j0=0`인 다른 소스를 도입하지 않는다.

기존 코어 평가기의 비교 다항식, 실제 χ 구간, 실제 A.21 압력 구간을 사용하되, 비교 다항식 절단 오차와 실제 비선형 해의 양의 `29 Q^-53` 계열 오차를 모두 유지한다. 유한 점들을 연결한 면적으로 적분을 증명하지 않는다.

적분변수를 먼저 \(t=y/Y\in[0,1]\)로 바꾼다. 이렇게 배율을 먼저 옮겨야 다항식을 제곱할 때 계수 반올림 오차에 \(Y^{2N}\)가 불필요하게 곱해지지 않는다. 각 항은 정확한 유리수 원시함수로 적분한다. 제곱과 곱의 오차에는 `p e_q`, `q e_p`, `e_p e_q`를 모두 넣는다. η Taylor 계수의 계승도 복원한다.

일곱 적분은 \(\int\Phi\), \(\int y\Phi\), \(\int\Phi^2\), \(\int y\Phi^2\), \(\int u/K\), \(\int(u/K)^2\), \(\int y(u/K)\Phi\)이다. `SAME_DATUM_ANALYTIC_AXIS.md` §10, 식 (25)에 따라 다섯 모멘트의 배율은

\[
M=\Lambda^{-1}M_c,\quad I=g\Lambda^{-2}I_c,\quad
J=g\Lambda^{-2}J_c,
\]
\[
S=\Lambda^{-1}S_U-g^2\Lambda^{-2}S_E,\qquad
C_p=g^2\Lambda^{-1}(C_p)_c.
\]

`normalizedMomentRows`의 η 미분은 **배율을 떼어 낸 계수**에 대한 미분이다. η에 의존하는 g까지 미분한 물리적 모멘트 미분으로 읽으면 안 된다. 복원식과 이 제한을 결과에도 기록한다.

## 3. B.22의 양의 cutoff 폭

실제 폭은 \(t_1=C^{-120}>0\), 끝점은 \(Y_c=4e^{2t_1}\)이다. `4`로 바꾸지 않고 끝점과 추가 적분을 구간으로 묶는다.

`REFERENCE_DERIVATIVE_BOUNDS.md` §2에서 자연 해의 η 미분, \(\Phi\ge1/4\), 몫/로그 미분으로 얻은 \(Q^{31}\) 상계를 사용한다. B.22 cutoff는 η와 독립이므로 η 미분에 \(t_1^{-1}\) 손실이 생기지 않는다. 유한 Bell·Leibniz 전개와 이 일곱 적분의 오차를 모두 \(t_1Q^{2000}\)으로 보수적으로 묶을 수 있다.

\[
C=(1+Q^{300})^{10}e^{Q^{200}}>Q^{10000},
\]
\[
t_1Q^{2000}<Q^{-1198000}
\le 2^{-311480000}<2^{-2048}.
\]

첫 부등식은 \(e^{Q^{200}}\ge Q^{8000}/40!\), \(40!<2^{260}\le Q\)에서 나온다. 코드는 이 정수 비교를 실제로 실행한다. 사용한 `2^-2048` 오차는 양수이며 내부 dyadic 정밀도보다 작아도 외측 방향으로 올려 포함한다.

B.22 cutoff 이후 U는 X에 상수이고 \(M/X=U+B/(\Lambda X)\)이다. 따라서

\[
v=V/X=a(\eta)+b(\eta)/X.
\]

여섯 정규 적분과 필요한 η 미분을 상수·X·\(X^{-1}\)·\(X^{-2}\)의 원시함수로 계산한다. \(\log(X_b/X_a)\), 누적 모멘트 상수 B, \(U_\eta v+Uv_\eta\)를 모두 유지한다. 코드의 비영 B 대조에서 이 항들을 빼면 실패한다.

## 4. 실제 B.26/B.34/B.8와 A.2의 차이

이 비교는 실제 함수값을 정당하게 감싸는 계산 경로다. B.8의 입력이 임의 프로브였다는 가정을 쓰지 않는다. 실제 incoming debt 증명과 같은 유일근의 미분 상계를 함께 읽는다.

실제 코어/기준/연속은 \(U_*=4\eta+j_0\)에서 \(2Q^{-58}+Q^{-200}\) 이내다. B.34는 이 축방향 끝점 Gi를 유지한다. `-8<log(X/XR)<-7`의 η 독립 cutoff가 Gi를 4η로 복원한다. 실제 B.8에서는

\[
\delta U=P_*f\mu\sum_{j=0}^1z_jb_j,
\quad |z_j^{(m)}|<10^{-6}\ (m\le4).
\]

원래 bump는 affine 인수에 대한 \(\sigma'\)이며 질량 1로 재정규화한 bump가 아니다. `|sigma'|≤9`, `|f|≤1`, `|f'|≤2`, `|f''|≤8`을 써 보수적으로 두 지지를 모두 더해도 \(234\cdot10^{-6}P_*\mu<P_*\mu\)다. 따라서

\[
\|U_{preC12}-U_{A2}\|_{C_\eta^2}
\le2j_0+P_*\mu<2^{-16000}<\delta:=2^{-2048}.
\]

차이는 \(X\le\ell=X_Re^{-5}\)에만 남는다. **ΔM가 지지 밖에서 0인 근거는 B.8이 다섯 모멘트 중 M를 정확히 일치시켰다는 식**이다. U 차이의 지지가 유한하다는 사실만으로 ΔM=0을 추론하지 않는다. 내부에서는 평균값 정의로

\[
|\partial_\eta^m\Delta(M/X)|\le\delta\quad(m=0,1,2)
\]

이다. 축은 평균의 정칙 극한으로 처리한다. 이후 heat compensation은 E만 바꾸므로 이 U/M 비교를 훼손하지 않는다.

원래 \(v=(2\eta U-2D\eta M/X-d(M/X)_\eta)/L\)에 대입하여 실제 소스 범위 `h≤1/1024`, `|eta|≤1`에서

\[
|\Delta v|\le5\delta,\quad|\Delta v_\eta|\le16\delta,
\quad|\Delta(Uv)|\le40\delta,
\]
\[
|\Delta(Uv)_\eta|\le256\delta,\qquad
|\Delta(v^2)|\le128\delta
\]

를 얻는다. 코드와 별도 Fraction 검산이 상수를 유리수로 대조한다.

## 5. 전역 Ω 환원과 축 경계항

\(J_{-1}=\int v\), \(J_0=\int Xv\), \(H_{-1}=\int Uv\), \(H_0=\int XUv\), \(K_{-2}=\int v^2\), \(K_{-1}=\int Xv^2\)로 두면

\[
P:=\int_0^{X_v}\Omega_0/(2X)
=\frac{D\eta J_{-1}'+dH_{-1}'-2A\eta H_{-1}}{2L}
+K_{-2}/4+V_X(0),
\]
\[
F:=\int_0^{X_v}\Omega_0/2
=\frac{D\eta J_0'-J_0+dH_0'+2D\eta H_0}{2L}-K_{-1}/4.
\]

실제 축 경계는 \([2A\eta(4\eta+j_0)-4d]/L\)이고 A.2와의 차이는 \(2A\eta j_0/L\)이다. 이를 유지하여

\[
|P_{preC12}-P_{A2}|/X_R\le256\delta,
\quad |F_{preC12}-F_{A2}|/X_R^2\le256\delta
\]

를 얻는다. `C12_FREQUENCY_CONTRACT.md`의 같은 R, N, I1 복구를 사용한 실제 값 오차 \(2^{-260}\)를 더한다. XR>1이므로 정규화 후에도 이 상계는 유효하다.

이 결론은 **함수값에 대한 전 η 균일 오차**다. P/F 자체의 η 미분계열, 다음 차수의 모든 source derivative, N5의 방사 shear·위상으로 승격하지 않는다. 해당 미분에는 더 높은 실제 U/M 및 C12 미분 상계가 필요하다.

같은 원리로 `actualAxialCell`은 `0≤X≤110`의 실제 최종 U/M/V를 감싼다. C12에서 `R≥8192`, `N>R^50`, 차이 지지의 `X≥R^-1`이므로 primitive average의 오차는 `R^-27≤2^-351`이다. 그 결과는 4η를 중심으로 `2^-2048+2^-351`를 유지하는 구간이며, 실제 U=4η라고 주장하지 않는다.

## 6. 정확한 함수 프로그램과 아직 없는 값 생성기

A.2 프로그램은 축에서 `U=4eta, M=4eta X`, 축 cutoff에서 실제 `k(log(X/(e XR)))`, 그 후 실제 누적 mConst, 외부 펄스에서 원래 진폭근과 두 M/J 보정, 끝점 Xv 이후 U=M=V=0을 연결한다. 모든 적분 노드는 피적분함수·변수·두 끝점을 갖는다. 고립된 실제 진폭근은 기존의 명시적 이차근 분기를 재사용한다. E² 에너지의 이름은 **literal A.2 reference energy**를 유지한다. B.8이 개별 U²/E²가 아닌 그 조합 S를 보존한다는 점도 유지한다.

`evaluateSourceProgramDiagnostic`는 유한 파라미터에서 알고리즘을 검사한다. 이 진단에서 actual source certificate는 항상 false다. 실제 `exp(13/lambda)`는 binary64로 표현할 수 없으면 명시적으로 실패한다.

다음 두 문제를 구별해야 한다.

1. **A.2 center 적분의 값**: integrand와 근은 모두 주어졌다. `xi=lambda log(X/Xp)`에서 지수 배율을 분리한 검증 적분이나 같은 프로그램의 computable-real 실행기가 필요하다. 거대 수를 실제 decimal로 전부 펼치는 것은 수학적 요구조건이 아니다.
2. **실제/A.2 차이의 정확한 값**: 이 모듈은 충분히 작은 비영 구간을 증명했다. 하지만 그 구간을 midpoint나 0으로 골라 정확한 actual moment라고 할 수 없다. 정확한 n=1 cancellation에는 실제 B26/B34/B8 및 C12/I1 displacement의 수렴하는 functional name도 필요하다.

원문 N4-04는 Lemma 5.2의 다섯 **total** moments를 0으로 복구하고, 복구 전에 다음 source를 생성하지 않으며, n=1/n≥2의 서로 다른 지지를 확인하라고 한다. 현재 개선은 그 입력의 상당 부분을 실행하지만 이 마지막 exact cancellation을 완료했다고 표시하지 않는다. 별도 실제 n=1 Picard/cutoff 제품 적분도 total debt에 포함해야 한다. 양의 작은 오차를 무시한 보정계수는 정확한 다섯 모멘트 0의 증인이 아니다.

원문 N4-05의 실제 N별 잔차 감소, CN,m/Km 및 독립 정밀도·격자 추적도 아직 이 모듈의 결과가 아니다. 잔차 증거는 실제 복구된 차수별 소스가 준비된 뒤 계산해야 한다. 이 문서는 원문보다 강한 모든 차수의 일반 정리나 전체 숫자의 물질화를 합격 조건으로 추가하지 않는다.

## 7. 파일과 재현

모두 `research-ide/mathscope-m2/navier/` 아래의 추가 파일이다.

- `actual-continuation-arithmetic.mjs`: 방향 반올림 BigInt 연산, 정확 로그 구간, η Taylor 연산.
- `actual-continuation-moments.mjs`: 실제 코어 전 구간 적분.
- `actual-continuation-reference.mjs`: B.22 양의 폭과 정규 적분.
- `actual-continuation-comparison.mjs`: 실제 B26/B34/B8 비교와 C12를 포함한 실제 내측 셀.
- `actual-continuation-a2-program.mjs`: 전체 A.2 축방향 프로그램.
- `actual-continuation-construction.mjs`: JSON 공개 API와 다음 차수 gate.
- `tests/actual-continuation.test.mjs`: 15개의 source/negative/operator 검사.
- `tests/actual-continuation-independent.py`: 별도 Fraction/Decimal oracle 226개.
- `tests/actual-continuation-independent.json`, `tests/actual-continuation-manifest.json`: 결과와 해시.

저장소 루트에서 실행한다.

```bash
node --test research-ide/mathscope-m2/navier/tests/actual-continuation.test.mjs
python research-ide/mathscope-m2/navier/tests/actual-continuation-independent.py
```

Fraction 검산의 정확한 구간 내부 테스트점은 연산자를 검사하기 위한 값이다. 이를 실제 N3 datum으로 다시 분류하지 않는다. 실제 소스의 결속은 아래 원문/수학 증명의 정확한 해시와 남겨 둔 오차에서 온다.

## 8. 근거 파일

주 논문 B.22, B.26, B.34, B.8와 (4.7), (4.15), (5.6), (5.10)–(5.16)을 사용한다. 원문 N4-04/05 체크리스트 문언은 `evidence/original-m2-criteria.json`, 청사진 58쪽에 보존되어 있다.

같은 source의 실제 입력은 다음 문서에 결속된다. 해시는 런타임과 테스트에 함께 보존되어 있으며, 숫자값으로 대체하지 않는다.

| 근거 | 사용 내용 |
| --- | --- |
| `followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md` §§7–10 | 실제 비선형 오차, source recurrence, 실제 core/moment identities |
| `REFERENCE_DERIVATIVE_BOUNDS.md` §§2, 6–7 | B22 도함수와 실제 B8 incoming debt 미분 |
| `CONTINUATION_AND_NEW_DEBT.md` §§1–4, 8–9 | 양의 폭, 실제 Gi, 복원, exact M 등 다섯 모멘트 일치 |
| `.../inputs/27-GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md` §§3–4 | 같은 실제 B8 root 및 도함수 상계, 원래 외부 소스와 일치 |
| `C12_FREQUENCY_CONTRACT.md` §§1–4 | 실제 N/R, ΔU/ΔM 지지, I1 복구, Cη² 오차 |
| `WEIGHTED_OMEGA_REDUCTION_KO.md` | 정규 적분 환원, 축 경계항, 독립 부정 대조 |

이 추가 모듈의 peer 검토는 B22 폭 흡수, 실제 B8 M 일치, 실제 root의 η 미분, Ω 비교의 유리 상수와 범위를 확인했다. 새로운 Lean kernel 증명이나 모든 남은 N4/N5 항목의 완료는 주장하지 않는다.
