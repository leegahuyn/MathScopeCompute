# 같은 실제 물리점의 원본 선택식과 양의 수치 스케일

## 범위와 검증 상태

이 확장은 이미 구성한 실제 물리점, 그 점의 고정 대표점, 원래 공통 수열 `b_n`, 첫 허용 band, 원래 `H`와 목표값을 유지한다. 원본 `h=exp(-8002*(exp(1048576)+10))`도 양의 값 그대로 유지한다.

새 기능은 두 종류의 수치를 구분한다.

1. 기존 정규화 도함수 계수는 유리수 끝점을 가진 보통의 절대오차 구간이다.
2. 이번 확장이 제공하는 원래 양의 스케일은 유리수·`exp`·부호만으로 끝까지 닫힌 수치 끝점이다. 각 행은 어느 반복 로그 좌표에서 폭을 측정했는지 함께 기록한다. 원래 값의 상대오차를 `1e-12`라고 주장하지 않는다.

`T#`와 실제 `eta_beta`는 별도 표시한 거친 양의 구간이다. 이 두 개의 개별 정밀도 상태는 `false`이다. 이를 포함하는 전체 물리 스케일의 반복 로그 폭은 다시 계산하여 요청값과 비교한다. 저장한 기호 root만을 숫자로 부르는 방식은 사용하지 않는다.

새 코드의 경량 검사는 27/27, 관측 종료값은 0이다. 이 중 42개의 모든 공간·각도·시간 1차 및 2차 스케일을 독립적으로 전개한 유한 통제값과 비교했다. 저장된 실제 270개 body 행의 서로 다른 정규화식과 기본 스케일을 사용하는 조건부 형태 검사 192건도 통과했다. 이 형태 검사는 `ell=ellMinimum+12`, sigmoid 제곱 적분 `1/3`을 **가정한 산술 검사**이며 실제 선택된 `ell`의 수치 인증으로 세지 않는다.

실제 원본의 추가 `n=1,m=5` 상계와 첫 선택식을 소비하는 통합 source 실행은 별도 영수증으로 판정한다. 통합 attempt2는 원래 270개 body와 source bound 8개까지 만든 뒤, 추가 upper producer가 선택적 `global.localBodies` metadata의 `undefined` 값을 canonical JSON으로 직렬화하는 지점에서 종료값 1로 끝났다. 이번 scale 산술에는 진입하지 않았다. 이 실패와 초기·late import snapshot을 보존한다. 이 문서는 source 실행 전의 경량 통과만으로 G-NUM 또는 M3 상태를 변경하지 않는다.

## 1. 닫힌 수치 끝점의 의미

`actual-numerical-exponential-arithmetic.mjs`의 끝점은 유한한 다음 문법을 사용한다.

```text
endpoint = rational | exp(endpoint) | neg(endpoint)
```

`rational`의 값은 정확한 정수 또는 정수의 비이다. 원본 매개변수 이름, AST root, 적분, 암묵식 또는 수치 oracle은 이 문법에 없다. 작은 양수를 유한 dyadic 화면에 투영하면 아래 끝점이 0이 될 수 있지만, 그 화면은 실제 닫힌 양의 끝점을 대체하지 않는다.

덧셈과 뺄셈은 부호를 나눈 log-sum 및 log-difference 공식으로 계산한다. 지수의 비가 작다는 사실을 증명한 경우에도 잔여비는 `[0,양의 상한]`으로 남긴다. 반대인 **정확히 같은** 끝점의 상쇄와, 조금 다른 두 끝점의 차이는 별도로 처리한다. 제곱근·역수·로그에는 필요한 부호 검사를 한다. 비교가 결정되지 않는 경우 외향 구간을 넓히거나 요청된 정밀도를 거부한다.

캐시는 유한 크기에서 회전한다. 캐시 epoch와 재사용하지 않는 식별자를 함께 사용하므로, 내부 재귀 중 회전이 일어나도 이전 key의 값이 새 식에 잘못 귀속되지 않는다. 캐시가 없는 실행, 큰 캐시, 17개 항목마다 회전하는 실행을 같은 정확한 통제식으로 대조했다. `maxDepth`는 재귀 호출 깊이만이 아니라 실제 생성된 끝점 트리의 깊이도 검사한다.

원래 63개 매개변수 정의는 `actual-closed-parameter-arithmetic.mjs`가 고정된 정의 DAG에서 다시 계산한다. 순환, 모르는 참조, 적분 또는 허용하지 않은 연산은 오류이며 0으로 처리하지 않는다.

## 2. 원래 A.13의 세 적분

선택식의 순수 산술 부분을 끝까지 따라가면 원래 A.13의 세 적분이 남는다. `actual-original-a13-numerical-enclosure.mjs`는 세 integrand, 적분 변수, 양 끝점, `Qb`, `Qp`, `wait`를 원본 식과 문자 그대로 대조한다. 빠진 source node가 새로 생성된 기대식의 ID와 우연히 같아지는 경우를 막기 위해 원래 typed closure를 먼저 검사한다.

`a=1-lambda`, `b=1-h`, `rho_o=h/256`라 하면 실제 프로필에서 `1/2<a,b<1`, `0<h<lambda<1/16`이다. 원래 sigmoid의 반사 대칭과 단조성으로 다음 외향 경계를 얻는다.

| 원래 적분 | 사용한 양의 구간 | 근거 |
|---|---|---|
| steep 적분 | `[1/4,3]` | `0<=S(t)<=t`, 지수인자 `[1,e]`, sigmoid 적분 `1/2` |
| flatten 적분 | `[1/4,3/2]` | 같은 지수 경계와 `integral(1-sigma)=1/2` |
| terminal `Qp` | `[rho_o,54 rho_o]` | 치환 후 `rho_o/(1-rho_o)` 곱하기 `exp(b(1+2t))*sigma'(t)`의 적분 |

여기서 `e<3`은 양의 팩토리얼 급수와 그 꼬리로 증명한다. 세 구간은 개별 적분의 높은 상대정밀도 구간이 아니다. 그 양의 하한과 유한 상한을 원래 모든 후속 산술식에 실제로 전달한다.

## 3. 원래 첫 선택값의 하한과 상한

원래 첫 선택식은 다음 구조다.

\[
\log b_1=\max\{L_{\rm historical},(\ell_{\min}+10)\log2,L_0,\ldots,L_7\},
\qquad
\ell_A=\left\lceil\frac{\log4+\log b_1}{\log2}\right\rceil.
\]

추가 source producer는 기존 FTC 적분값을 새 값으로 바꾸지 않는다. 같은 원래 `n=1` 계수에 대한 별도 `m=5` 상계로 여덟 개의 부등식 `L_j<=U_j`를 증명한다. 기존 `b_n`, cutoff, 계수, 실제 물리점은 그대로다. 이 상계는 `actual-common-first-selector-ftc-upper-bounds.mjs`의 private assertion을 통과한 객체에서만 가져온다.

따라서

\[
\ell_{\min}+12\le\ell_A\le
\left\lceil\frac{\log4+\max\{L_{\rm historical},(\ell_{\min}+10)\log2,U_0,\ldots,U_7\}}{\log2}\right\rceil.
\]

역사적 항도 상한의 `max`에 남긴다. 그 항의 독립 구간이 보통의 반복 로그 정밀도를 충족하지 못하더라도, 유한 상한을 포함한 최종 선택값의 구간을 계산한다. 역사적 항을 0으로 바꾸거나 나머지 항보다 작다고 가정하지 않는다.

`Bnorm`, `E`, `Sminimum`, `ellMinimum`은 실제 공통 family에서 얻은 전체 산술 DAG를 사용한다. 특히 `Bnorm<=Renv^K` 같은 임의의 고정 거듭제곱 주장을 넣지 않는다. 원래 norm producer는 `Renv`보다 높은 지수 층을 실제로 만들 수 있다.

## 4. palette와 주파수의 상관관계

독립적으로 넓어진 지수 구간을 마지막에 곱하면 원래 정확한 상쇄를 잃을 수 있다. 다음 식은 구간화 **전에** 원래 식에서 정리한다.

`S=ell_A^2`, `Q=2^-ell_A`이고 원래 palette 정수가

\[
i=\left\lfloor\frac{(1+h)\ell_A\log2-2\log\ell_A}{\log T_g}\right\rfloor
\]

이므로

\[
\frac1{T_g S}<c_i\le\frac1S,
\qquad 2r_0S\le L_s<2r_0T_gS.
\]

원래 floor의 불확실한 구간과 `Q^(1+h)`를 별개로 계산하여 곱하지 않는다. 이 부등식에는 원래 floor 값의 모든 가능성이 포함된다.

`epsilon=Q^h`, `k=ceil(epsilon^-1/2)`도 원래 양의 값 그대로 수치 구간을 만든다. 동시에

\[
1\le\epsilon k^2<(1+\sqrt\epsilon)^2<4
\]

를 사용할 수 있다. 따라서 `Bs`를 계산할 때 실제 `k`를 1로 두지 않고, 원래 결합인자 `epsilon*k^2`에 대한 양의 구간을 사용한다.

원래 Haar 인자는 `J=(Dgeom/2)*ci*transverseMass`이고 `transverseMass=r0*(1/2+I_sigma)`이다. `I_sigma`는 같은 private 물리점 패킷의 실제 cutoff quadrature 구간을 사용한다.

## 5. 270개 정규화식의 반복 인자

원래 양의 인자를

\[
m=\frac{r_0^2}{\sqrt{gL_s}},\qquad
A_0=\frac{\tau^{1/2}g^{1/4}L_s^{1/4}}{r_0}
\]

로 먼저 정리한다. 예를 들어 가중 pulse의 `v` 정규화는 `A0*sqrt(g/Ls)`이므로, `Ls`의 서로 다른 구간 사본을 곱하는 대신

\[
\frac{\tau^{1/2}g^{3/4}L_s^{-1/4}}{r_0}
\]

를 계산한다. 나머지 slow·혼합·fast 스케일에도 같은 원칙을 사용한다. 실제 source graph에서는 기존 270개 `positiveExactScale`을 독립적인 정확한 연산 recipe로 재생성하여 문자 그대로 대조한다.

실제 물리 정규화는 추가로 다음 관계를 사용한다.

\[
B_s=\frac{\sqrt{2F\gamma}\,u^{-3/2}}
{(k\sqrt\epsilon)(1+u^{-2})^{3/4}},
\quad A_c=\gamma u\sqrt{1+u^{-2}},
\quad g_{\rm abs}=2F(1+\gamma^2).
\]

각 물리 도함수 방향의 `Omega`에는 `Bs`가 하나씩 있으므로 `k^n`과 정확히 상쇄된다. `epsilon`과 전체 물리 `Q` 인자를 합친 나머지 지수는

\[
-\frac{1+n_{\rm spatial}+2n_t}{2}
-\frac{h(1+n+2n_t)}2
\]

이다. `1+u^-2`, `1+gamma^2`는 `[1,2]`에 있고 실제 sigmoid partition 값은 `[2^-30,1]`에 있다. 이 양의 부등식들로 얻은 명시적인 유리상수 구간도 함께 곱한다. 원래 반올림된 carrier나 실제 `k`의 값이 바뀌는 것은 아니다.

이 상쇄는 조건부 작은 통제값에서 원래 `Bs`, `k`, `V`, `Omega`, 각 coordinate scale을 각각 직접 계산한 42개 결과와 별도로 대조했다. 시간 방향의 반정수 지수도 정확한 `a/b` 입력으로 유지한다.

## 6. 인증 객체와 출력

동기 API는 다음과 같다.

```js
attachActualCommonPositiveScaleEnclosure(target, upperProof, controls, context)
assertActualCommonPositiveScaleEnclosure(result)
projectActualCommonPositiveScaleEnclosure(result)
```

attachment는 같은 private 물리점·target·270개 body·여덟 upper comparison인지 검사한다. 공개 projection에는 private graph나 원래 authority 객체가 들어가지 않는다. `rowScales`는 각 `rowKey`, 원래 `positiveExactScale`, 닫힌 끝점, 좌표 정의와 폭을 기록한다. 기존 정규화 coefficient 구간을 이 양의 구간에 다시 곱하면 원래 정규화 방향 도함수 값의 닫힌 수치 구간을 만들 수 있다.

독립 검토에서 child assertion의 별도 범위 문제도 발견됐다. 이전 버전에서 `absoluteValues`의 새 determinant product root가 child의 `ownedRoots` 목록 밖에 있었다. 통합 adapter는 attachment 뒤 **전체 `G.nodes`와 함수 정의**를 다시 봉인하므로 그 통합 보호 범위에는 해당 root도 들어간다. 그 사실을 standalone child assertion의 완전성으로 확대하지 않았다.

attempt2가 종료한 뒤 별도 순수 guard 보강을 적용했다. `actual-numerical-scale-root-seal.mjs`는 모든 absolute value root와 attachment 중 추가된 **전체 node 구간**을 보존한다. 새 determinant, 새 square root, 표시하지 않은 중간 dependency 및 공개 snapshot metadata의 변조를 각각 거부한다. 무관한 후속 append는 허용한다. 추가된 guard 자체는 수치를 계산하지 않는다. 이전 실행 snapshot과 실제 산술·source 생성 함수 본문의 바이트가 완전히 같음을 SHA256 `27603cd0adf68ffb48c46174de0a82db8502b09efa11c3409f7c139acb0f5c6d`로 대조했다. 새 guard 4개와 기존 scale kernel 5개를 합한 9개 검사도 종료값 0으로 통과했다.

## 증거 위치

- `evidence/closed-selection-arithmetic-20261011/positive-scale-kernel.json` 및 `.log`: 27개 경량 검사와 실행 파일 해시.
- 같은 디렉터리의 `conditional-scale-shape-smoke.json`: 위에서 명시한 조건부 산술 형태 검사. 실제 선택값 인증 아님.
- 같은 디렉터리의 `positive-scale-standalone-seal-guard.json` 및 `.log`: 원래 snapshot과 산술 본문 동일성, 별도 guard 보강 및 9개 검사. 기존 5개 scale kernel 검사와 겹치므로 이를 27개에 다시 모두 더하지 않는다.
- `evidence/physical-full-jets-20261011/`: 실제 물리점과 원래 270개 body의 실행 기록, 그리고 새 late attachment를 포함하는 통합 실행 기록.

기존 경계값·source module·실행 기록을 조용히 덮어쓰지 않는다. 표시용 `ell=1`의 부호 장애와 원래 허용 영역의 이 구성은 별개의 결과이다.
