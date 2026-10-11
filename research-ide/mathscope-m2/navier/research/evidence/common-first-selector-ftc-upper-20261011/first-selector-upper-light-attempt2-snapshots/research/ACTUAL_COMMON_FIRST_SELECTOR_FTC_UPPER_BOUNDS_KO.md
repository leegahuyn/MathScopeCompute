# 원래 첫 공통 선택 상수의 별도 FTC 상계

## 결론과 현재 범위

`actual-common-first-selector-ftc-upper-bounds.mjs`는 원래 공통 family의 첫 행에 있는 여덟 조건에 대해 별도의 상계를 만든다. 각 행은 원래 `bound`, 원래 `requiredLog`, 새 `upperBound`, 새 `upperRequiredLog`를 함께 보존한다.

관계는

\[
B_{1,m}^{\rm original}\leq \widehat B_{1,m},\qquad
\frac{\log2+\log B_{1,m}^{\rm original}}h
\leq\frac{\log2+\log\widehat B_{1,m}}h
\]

이다. 두 쌍의 값이 같다는 주장이 아니다. 새 상계로 원래 `b_1`, 그 다음 `b_n`, `ellA`, 계수, cutoff 또는 물리점을 다시 선택하지 않는다. `h`는 원래 양의 값이다.

이 문서를 쓰는 시점에는 새 경량 검사를 실행했으며, 같은 private 원본 물리점의 추가 실제 실행은 root의 staged source에 연결하는 단계다. 실제 source 실행의 성공 여부는 그 실행 기록으로 별도 확인해야 한다. 이 모듈만으로 G-NUM이나 M2 관문을 변경하지 않는다.

## 원래 조건과 상계의 입력

| 원래 첫 행의 조건 | 미분 차수 | 사용하는 원래 FTC |
|---|---:|---|
| velocity-potential-physical | 0, 1 | Cartesian 두 좌표와 eta의 모든 면 |
| pressure-stress-physical | 0, 1 | 같은 3차원 FTC, 원래 Pi/Ttheta/Tz |
| normalized-pressure | 0, 1 | X, eta의 모든 면 |
| first-stress-direct-zeta-with-endpoint-pole | 0, 1 | 원래 interior quotient와 완전한 terminal B |

입력은 `constructActualPhysicalCenterFiniteJetBodies`가 만든 private `bodies`다. 그 안의 `physicalCenter.family`에서 원래 prepared 계수, 여덟 조건, 기존 FTC 행과 각 면의 실제 미분·적분 root를 읽는다. 수치 bound, root 또는 source flag를 호출자가 공급하는 입력은 없다.

원래 첫 행은 `byOrder[j]`, `j<=m<=1`만 합한다. 원래 물리 미분 재귀 한 번은 profile 좌표 한 개 또는 Euler 차수 한 개를 올린다. 각 FTC 면은 각 좌표를 최대 한 번 더 미분한다. 따라서 실제로 필요한 Cartesian 도함수는 공간 합계 최대 3, eta 최대 2, 총합 최대 4다. 추가로 생성되어 있던 `m=2` 행을 `m<=1` 상계의 가정으로 쓰지 않는다.

## 왜 n=1의 5차 상계가 필요한가

원래 angular residual에는 `-2*(X*F1_XX+2*F1_X)`, axial residual에는 `-2*(X*U1_XX+U1_X)`가 있다. 응력의 양의 방사형 미분을 취하면 적분이 한 차수를 줄이지만, 원래 점성항의 방사형 두 차수 중 하나는 남는다. Cartesian 첫 물리 도함수와 모든 FTC 면을 합치면 `F1_X4_eta`, `U1_X3_eta2` 등 총 5차가 필요할 수 있다.

따라서 추가 producer는 정확히 다음 호출이다.

```js
attachActualInductionNorms(prepared, {
  throughOrder: 1,
  derivativeOrder: 5
}, context)
```

이 producer의 leading demand는 `(radialOrder, etaOrder)=(11,24)`다. 원래 첫 선택 상수를 만든 낮은 차수의 norm이나 원래 common family를 덮어쓰지 않는다. 새 함수는 기존 계수와 같은 source norm의 상계만 계산한다.

원래 normalized `E1=sqrt(2X)*F1` norm의 선언 구간은 `X>=Xa/2`이다. 그 구간에서는 모든 Leibniz 항을 포함해 `F1=E1/sqrt(2X)`를 사용한다. 축을 포함한 `0<=X<=Xa/2`에서는 cutoff 이전의 실제/auxiliary 해의 일치와 실제 analytic auxiliary norm으로

\[
|\partial_X^r\partial_\eta^k f|
\le r!k!\Lambda^r(2/\mathrm{strip})^k\,\mathrm{solutionNorm}
\]

을 쓴다. 이는 F1, U1 및 Pi1의 실제 여섯 성분 정칙 해에 적용한다. 축에서 `E1/sqrt(X)`를 계산하지 않는다. 평균은 원래 `M1_X=U1` 및 zero axis datum으로부터 `integral_0^1 U1(sX) ds`이며, 그 도함수 상계에는 정확한 `1/(r+1)`를 유지한다.

## 완전한 leading과 n=1 stress

새 n=1 norm의 leading root는 active 구간의 완전한 F0 및 전 구간의 U0를 공급한다. F0의 active support 바깥에서는 원래 열 함수와 열 보상 식을 별도로 다룬다.

`firstSelectorOuterHeatMajorant`는 기존 source의 실제 E 높이 `<CSelected^2`를 시작값으로 쓴다. 원래 열두 outer stage의 모든 slope, interpolation, angular 두 bump, terminal fo와 heat cutoff를 보존한다. 높은 도함수는 기존 값 상계의 차수를 바꾸어 부르지 않고 원래 square-seed cutoff bounds, 유한 reciprocal/log 재귀와 Bell 수로 새로 상계한다. angular root는 기존 증명된 복소 eta tube 반지름 1/4와 높이 `65536*lambda^29`의 Cauchy 상계로 미분한다. 여기서 lambda를 0으로 두지 않는다.

완전한 Gamma heat에 대해서는 `z>=0`에서

\[
|H^{(j)}(z)|\le(h)_j(1+h)_j\le j!(j+1)!,\quad 0<h<1
\]

을 사용한다. 열 함수가 실제로 활성인 `X>=XK>1`에서는 `z=2(1-eta^2)/X`의 필요한 logX/eta 미분을 직접 상계한다. 마지막으로 unsigned Stirling 변환과 `(2X)^(-1/2)`를 포함해 보통 X 도함수로 옮긴다. 이 별도 outer 재귀의 범위는 총 5차이며, 그보다 높은 요청은 거부한다.

`firstSelectorStressMajorants`는 원래 시간, 대류, 압력, 방사형 점성 및 leading axial viscosity 항을 모두 더한다. 부호는 절댓값을 취할 때만 없앤다. 특히 n=1의 leading heat viscosity를 버리지 않는다. 원래 signed primitive는 다음과 같이 상계한다.

\[
T_{1\theta}=-\frac1{2X}\int_{X_-}^{X}2s\,R_\theta(s)\,ds,
\qquad
T_{1z}=-\frac1{\sqrt{2X}}\int_{X_-}^{X}R_z(s)\,ds.
\]

방사형 차수가 0이면 원래 전 지지 길이를 쓰고, 양의 차수이면 적분의 FTC로 피적분함수 차수를 하나 줄인다. 접두 인자들의 모든 Leibniz 항을 유지한다. stress가 0인 `X<Xminus`에서는 양의 반지름 분모를 사용하지 않는다. 원래 보존 모멘트와 모든 endpoint jet 접합은 private positive-stress producer가 이미 인증한 동일한 source다.

## n=1의 weighted interior와 terminal

원래 interior 구간은 `[Xminus,Xedge]`, `Xedge=Xb*exp(-1/4)`다. 거기서

\[
\log(X/X_a)\ge t_1/128,\qquad \log(X_b/X)\ge1/4
\]

이므로

\[
\zeta^{-1}\le e^{16448},\qquad
|(\zeta^{-1})_X|
\le e^{16448}X_-^{-1}\left(\frac{4194304}{t_1}+512\right).
\]

FTC의 추가 X 미분은 `T_(r,k)/zeta`의 두 인자에 모두 작용한다. eta에 대해 zeta는 상수다. 원래 endpoint pole `3+3r`는 그대로 남는다.

Terminal B는 `exp(-2delta)`에 원래 heat/factorization coefficient를 곱한 함수다. factor의 첫째와 둘째 도함수, az 및 bz 항을 모두 보존한다. 그 분모는

\[
e^{-4/\delta^2}+e^{-4/(2-\delta)^2}\ge e^{-64/49}
\quad(0\le\delta\le1/4)
\]

이다. 원래 flat Gaussian의 도함수 다항식을 재귀로 만들고, `u^n*exp(-u^2)<=ceil(n/2)!`로 닫힌 유한 상계를 만든다. 완전한 Gamma heat를 곱한 뒤 실제 필요한 `delta<=2`, `eta<=2`, 총 3차까지의 B 도함수를 상계한다. flat endpoint에서 음의 거듭제곱을 평가하지 않는다.

## 원래 FTC 적분을 포함하는 부등식

원래 FTC는 각 면에서 `sqrt(1+mixedDerivative^2)`를 적분한다. 그 면 전체에서 실제 도함수의 절댓값이 M 이하이면

\[
\mathrm{faceIntegral}\le(1+M)\prod_{j\in S}(b_j-a_j).
\]

빈 면의 곱은 1이다. 원래 면의 mask, 도함수 root, 적분 root, 좌표와 두 끝점을 함께 기록한다. 이는 그 FTC 값의 수치 동등식이 아니라 상계다.

상위 원래 표현에는 이 면 상계만 적용한다. 모든 실제 cutoff Euler weight, geometry factor 및 `maximum` 구조를 유지한다. 바뀐 피연산자의 역수나 음의 거듭제곱을 통과하려 하면 거부한다. 이미 닫힌 순수 산술값으로 단순화된 면은 그대로 남겨, 공통 유리상수 1이나 2를 전역으로 치환하지 않는다.

상계의 typed arithmetic trace에는 원래 A.13의 세 적분을 제외한 다른 functional boundary가 없어야 한다. 해당 조건이 실패하면 성공 receipt를 내지 않는다. 이후 별도 numerical arithmetic producer가 원래 A.13 값 및 이 상계를 소비해 원래 selector의 수치 포함 구간을 만들 수 있다.

## 그래프 동일성, 자원 및 출력

새 norm은 원래 private `prepared.G=family.G`에 append한다. 그 새 산술 노드는 연산별로 `bodies.G`에 복사한다. 복제된 원래 prefix의 ID는 node bytes를 확인한 뒤 재사용하고, 새 sibling ID는 같은 정수라고 해석하지 않는다. `integer_power`의 지수 등 literal metadata는 child ID로 걷지 않는다.

기존 모든 private assertion을 그대로 유지한다. body assertion은 원래 physical point, band, family 및 coefficient-prefix assertion을 재귀적으로 호출한다. 새 upper DAG는 typed trace의 각 node와 현재 node를 대조하고, 새 norms 객체 identity도 고정한다. 어느 기존 객체도 재봉인하지 않는다. 추가 source와 target 노드는 합계 100000개로 제한하고 취소 hook을 전파한다.

공개 출력은 다음 함수로 얻는다.

```js
const upper = attachActualCommonFirstSelectorFTCUpperBounds(bodies, context);
const json = projectActualCommonFirstSelectorFTCUpperBounds(upper);
```

`upper`는 같은 실행에서만 유효한 private object다. `json`은 `sourceBinding`, `roots`, `upperRows`, `checks`, `proof`, `diagnostics`, `scope` 등을 포함하며 G, p, bodies, family, prepared, norms 객체를 포함하지 않는다. 이 JSON을 읽는 것만으로 private authority가 복원되지는 않는다.
# 2026-10-11 추가: 원래 튜플의 typed snapshot

실제 통합 source attempt2는 상계 도함수 계산에 들어가기 전 `canonicalStringify(prepared.records)`에서 멈췄다. 원래 producer는 n1의 `global.localBodies`를 값이 `undefined`인 **존재하는 필드**로 남긴다. n1의 `stress.Z`, `stress.T`도 원래 함수 객체다. `JSON.stringify`로 이 항목들을 지우거나 전역 canonical 규칙을 완화하는 방법은 사용하지 않는다. 당시 실행물과 snapshots는 보존한다.

새 `actual-common-first-selector-source-snapshot.mjs`는 원래 records 전체의 typed snapshot을 만든다. 다음 항목은 서로 다르게 기록한다.

- 존재하는 `undefined`, 필드 없음, `null`, 배열 구멍, 배열 안의 `undefined`.
- 유리수 식을 가리키는 정수 ID를 포함한 모든 실제 값과 object property descriptor.
- 원래 배열/객체의 공유 참조 및 cycle, Map의 typed key/value, Set의 값.
- 함수의 표시 본문과 **실제 원래 함수 객체 identity**. 같은 문자열의 새 함수를 넣어도 비교가 실패한다.

snapshot 자체도 private WeakMap의 저장 내용과 대조한다. 실제 추가 n1,m5 norm 생성 전후에 이 snapshot을 비교하며, 기존 `assertActualInductionNorms`, 원래 finite bodies 및 그 모든 predecessor assertion을 그대로 실행한다. source graph의 새 arithmetic 상계에 대한 consumed-DAG 봉인도 유지한다. source root·계수·선택적 필드를 바꾸거나 삭제하면 통과하지 않는다. accessor를 평가하지 않고, 뜻하지 않은 source producer class 또는 지원하지 않는 metadata type은 명시적으로 거부한다.

공개 진단에는 field별 undefined/function 경로와 비교 결과를 포함하는 작은 plain audit만 넣는다. 함수 객체나 WeakMap, private snapshot token은 공개 JSON에 들어가지 않는다. 이것은 기록 방식의 교정이며 원래 norm·stress·FTC 부등식·선택 순서·cutoff·source parameter를 바꾸지 않는다.

## 공개 projection의 producer별 직렬화 점검

| 공개 필드 | 확인한 원래 producer와 기록 범위 |
|---|---|
| `sourceBinding` | `prepared.program.profileId`, `parameterExpressionSHA256`, 원래 selector 식 ID. 원래 norm의 입력 일치 검사에서도 실제 존재를 확인한다. |
| `upperRows`, `proof.originalRows` | 공통 family가 이미 strict canonical로 봉인한 원래 constraints. 선택적 pole은 새 행에서 `null`로 명시하며 원래 객체는 바꾸지 않는다. |
| `proof.selection.componentRoots` | 실제 velocity component의 `sourceRoots` 배열과 pressure/stress component의 `sourceRoot`; 각각 원래 component 생성식의 명명 필드다. |
| `proof.n1Norm` | 실제 normalized norm의 domain·`actualSourceRoots`, 새로 생성한 정수 식 ID, 원래 coreAgreement의 domain/reason. `get()` 계산기는 넣지 않는다. |
| `proof.leading` | 실제 `actualLeadingHighJetBounds()`의 plain 반환값, 새 outer ledger의 명시 문자열/정수, 원래 heat의 `finalF`, `stageFields`, `heatArgument`. |
| `proof.cartesian`, `proof.stress` | Cartesian bound의 식 ID/유한 derivative 요청/usage 숫자와 원래 n1 `angular`, `axial`, `Ttheta`, `Tz` 식 ID. `Z`, `T`, `get`, cache Map은 공개하지 않는다. |
| `proof.terminal` | 새 terminal 계산기의 `flat`, denominator 및 inverse bound IDs, `heatConstant`, proof 문자열만 추출한다. 원래 terminal 부분은 pressure/stress producer가 이미 strict canonical로 봉인한 반환값이다. |
| `proof.imported`, `diagnostics.*Trace` | typed arithmetic copier와 read-only trace가 명시적으로 만든 plain row/operand ID 목록. integer-power exponent는 root ID로 걷지 않는다. |

실제 경량 검증은 새로운 typed optional/function/root-mutation 대조 외에도 `actualLeadingHighJetBounds()`와 원래 사용 방식 그대로의 새 terminal/outer 공개 projection을 생성해 strict canonical 및 `structuredClone`을 실행했다. 실제 준비된 source에만 존재하는 필드는 producer 정의와 이미 봉인된 부모 projection을 직접 대조했다. 최종 실제 source3의 실행 성공은 별도로 관측해야 한다.

## terminal heat의 eta 인자

원래 `actual-continuation-exact-heat.mjs`는

`exteriorAmplitude = Etail*exp(A*log(Xtail))/(sqrt(2)*(1-rho))`

전체와 `Xb`가 eta-independent임을 원래 graph 미분으로 검사한다. `actual-order-one-weighted-stress.mjs`의 `heatAtDelta`는 바로 그 원래 `exteriorF`에 `Xdelta=Xb*exp(-delta)`를 대입한 값이다. 그러므로 terminal eta 미분에 누락된 `Etail` 계수 미분을 가정하지 않는다. eta 미분은 complete Gamma와 `z=2*(1-eta^2)/Xdelta`에 작용하고, delta 미분은 `Xdelta^b`와 Gamma 양쪽에 작용한다. 원래 `Xdelta>1`, `|b|<1`, `|z`의 필요한 jets`|<=8`, eta-independent 원래 height와 complete Gamma의 factorial 상계를 함께 기존 `heatConstant*C^2`가 덮는다. 이 설명을 추가하며 수치 상수나 kernel 식을 바꾸지 않는다.

