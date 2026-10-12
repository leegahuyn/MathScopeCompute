# 실제 background의 물리 미분 상수와 강화 cutoff 선택식

## 이번 구현의 정확한 범위

`actual-background-physical-seminorms.mjs`는 실제로 생성되고 moment 보정까지 끝난 양의 차수 계수에서 다음 두 종류의 **유한한 정확 적분 상수**를 만든다.

1. Cartesian 공간 변수와 실제 시간으로 미분한 physical tuple의 계수별 상수.
2. `n>=2`에 한하여, 원래 가중치 `ζ`로 나눈 실제 응력 `T_n/ζ`의 정규화 미분 상수.

이 상수들을 기존 정규화 조건과 함께 만족시키는 별도의 cutoff 선택식도 제공한다. 현재 실행 중인 background의 기존 canonical cutoff는 바꾸지 않는다. 새로운 선택식을 적용한 전체 background의 재조립, 잔차 상쇄, `n=1`의 경계 추정, 실제 해석학적 Lean 인스턴스는 이 결과에서 따라오지 않는다.

기준 원문은 저장된 `navier-stokes.pdf`의 명제 5.3, 보조정리 5.4, 명제 5.5 및 식 (5.23), (5.26), (5.27), (5.37), (5.40), (5.45), (5.46)이다. 원문 SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. 이는 이 문서가 원문의 전체 결론을 검증했다는 의미가 아니다.

## 1. 이름만 붙인 norm을 입력받지 않는 FTC 구성

직사각형 `B=∏[a_i,b_i]`에서 충분히 매끄러운 함수 `f`는 반복된 미적분학의 기본정리에 의해

\[
f(x)=\sum_{S\subseteq\{1,\ldots,d\}}
\int_{a_S}^{x_S}\partial_S f(t_S,a_{S^c})\,dt_S
\]

를 만족한다. 빈 집합의 항은 `f(a)`이다. 각 절댓값을 `sqrt(1+v²)`로 감싸고, 비음수 적분의 위끝을 `b_i`로 넓히면

\[
\|f\|_{L^\infty(B)}\le
\sum_{S\subseteq\{1,\ldots,d\}}
\int_{a_S}^{b_S}\sqrt{1+|\partial_S f(t_S,a_{S^c})|^2}\,dt_S.
\]

`rectangularSourceFTC`는 이 합의 모든 항을 원래 함수의 실제 미분으로 만든다. 3차원에서는 8개 항, 2차원에서는 4개 항을 모두 보존한다. 상수 결과에 자유 좌표가 남으면 거부한다. 실제 source adapter가 계수·지원 구간·미분 본문을 결정하므로 사용자가 임의의 상계 숫자를 대신 넣을 수 없다.

상수의 유한성에는 닫힌 직사각형에서 해당 혼합 미분이 연속이라는 해석학적 전제가 필요하다. 이 전제는 원래 coefficient 구성과 매끄러운 영 연장에 연결하여 명시한다. 그래프의 미분 연산을 실행했다는 사실을 새로운 Lean 연속성 증명으로 표현하지 않는다. `m`차 미분 상수를 만들 때 FTC에서 추가되는 최대 3개의 서로 다른 좌표 미분도 원래 본문에서 생성한다.

## 2. 축을 포함하는 Cartesian 대표식

`ξ=(x_1,x_2)/sqrt(q)`, `X=|ξ|²/2`, `a_n=M_n/X`, `A=1/2+h`, `D=1/2-h`로 쓴다. `a_n`은 실제 moment 보정된 smooth average이다. 다른 차수의 average를 대용하지 않는다.

공통으로 `q^(2nh)`를 뺀 대표식은 다음과 같다.

| 성분 | Cartesian 대표식 | 추가 `q` 인자 |
|---|---|---|
| Stokes potential | `(-ξ₂, ξ₁) a_n/2` | `q^(-h)` |
| 방위 속도 | `(-ξ₂, ξ₁) F_n` | `q^(-A)` |
| 방사 속도 | `(ξ₁, ξ₂) v_n/2` | `q^(-1/2)` |
| cutoff 미분의 방사 추가항 | `-(ξ₁,ξ₂) η a_n/L` | `q^(-1/2)` 및 `(c_n q)χ'(c_n q)` |
| 축방향 속도 | `U_n` | `q^(-A)` |
| 압력 | `Π_n` | `q^(-2A)` |
| 두 응력 성분 | `T_n` | `q^(-A-1/2)` |

방사 추가항은 원문 (5.45)의 `-2η(c_nq)χ' M_n/L`을 그대로 Cartesian 변수로 바꾼 것이다. 이 항을 빼면 cutoff 전이 구간에서 원래 potential curl과 일치하지 않는다.

적분 직사각형은 `|ξ_i|<=sqrt(2X_b)`, `|η|<=1`이다. 실제 양의 차수 계수의 지원을 포함하며 `X=0`도 포함한다. 축에서 `1/r`을 수치적으로 나누거나 각도를 표본화하지 않는다. 속도 성분이 방위·방사·추가항의 합이므로, 각 성분 상계의 **합**을 사용한다.

## 3. 실제 시간·공간 연쇄법칙과 차수와 무관한 손실

`E=q∂q`, `d=1-η²`, `L=1-2hη²`라 두면 실제 physical 미분은

\[
\partial_{x_i}=q^{-1/2}\partial_{\xi_i},\qquad
\partial_z=\frac{q^{-D}}{L}\left(2\eta E-\eta\xi\cdot\nabla_\xi+d\partial_\eta\right),
\]

\[
\partial_t=\frac{q^{-1}}{L}\left(-E+\tfrac12\xi\cdot\nabla_\xi+D\eta\partial_\eta\right).
\]

`a`회 횡방향, `k`회 축방향, `l`회 시간 미분의 정확한 손실은 `a/2+Dk+l`이다. 이는 총 미분 횟수 `j=a+k+l` 이하이다. 구현은 각 실제 미분 단어의 정확한 지수를 유지한 상태에서 계수 미분을 상계한다. 이미 넓힌 부등식을 다시 미분하지 않는다.

`q^(-b)`에서 생기는 Euler 계수의 절댓값은 `b+a/2+Dk+l<=b+j`이다. 네 방향 `E,∂ξ₁,∂ξ₂,∂η`의 양의 jet 재귀가 모든 Leibniz 계수를 포함한다. `L^-1`의 η 미분에는 `2 s! 8^s`를 사용한다. 이는 원래 `0<h<1/16`과 복소 반지름 `1/2`에서 `|L|>1/2`라는 Cauchy 상계보다도 큰 값이다.

원래 cutoff의 Euler 미분 다항식은 기존 `sourceNormalizedCutoffWeights`에서 가져온다. 방사 추가항에는 반드시 한 차수 높은 cutoff Euler 미분을 쓴다. 따라서 각 실제 양의 차수 `n`과 유한 `m`에 대해 구성된 `B_nm>=1`은

\[
|U_n^{\mathrm{cut}}|_m\le B_{nm}\,q^{2nh-(2A+m)},\qquad 0<q\le1
\]

을 준다. 여기서 상수는 `n,m`에 의존하지만 지수 손실 `2A+m`은 `n`과 무관하다. 이것이 전역 합에 필요한 부분이다. `h`를 0으로 바꾸지 않는다.

## 4. `n>=2`의 가중 응력 상수

원래 source의 `actualSupportOrderProof`를 실행하여 다음 끝점 관계를 결속한다.

\[
X_-=X_a e^{t_1/128}>X_a,\quad X_+=X_v e<X_b,\quad \log(X_b/X_+)>127.
\]

실제 고차 응력의 공통 지원은 `[X_-,X_+]`이다. 원래 가중치는

\[
\zeta(X)=\exp\left[-\frac{t_1^2}{\log^2(X/X_a)}-\frac4{\log^2(X_b/X)}\right].
\]

이 닫힌 내부 지원에서 `ζ>0`이므로 실제 quotient `T_n/ζ`를 먼저 만들고 그 `X,η` 미분에 2차원 FTC를 적용한다. 지원 밖에서는 원래 smooth zero extension을 사용한다. 순서를 뒤집어 표본 값으로 나누거나, 원래 응력을 임의의 norm 함수로 교체하지 않는다.

`n=1`은 `X_b`에 닿을 수 있으므로 이 논리를 적용하지 않는다. 이 항에는 원문의 별도 경계 추정 (5.22)와 유한한 `δ` 역멱이 필요하다. 관련 완료 flag는 `false`이다.

## 5. 강화된 cutoff 선택식

각 `n`에서 필요한 상수를 `throughOrder=n`, `derivativeOrder=n`으로 구성한다. 필요한 유한 목록은 기존 정규화 coefficient 조건, 새 physical 조건, `n>=2`의 weighted stress 조건이다. 각 `B>=1`에 대해

\[
\log a_n\ge\frac{n\log2+\log B}{nh}
\]

를 추가하고 `log a_n>=log a_(n-1)+log2`도 유지한다. 그러면

\[
Bq^{nh}\le2^{-n},\qquad 0<q\le a_n^{-1}.
\]

`q>=a_n^-1`에서는 cutoff와 모든 미분이 정확히 0이다. 따라서 원문 (5.37), (5.40)의 해당 유한 조건을 같은 선택식으로 만족시킬 수 있다. 여기서 summation domain은 `q0=1`로 명시한다. `a1>=2`이므로 첫 cutoff의 지원은 이 domain 내부에 있다. 별도의 더 작은 `q_*` 경계에서 지원이 사라진다고 주장하지 않는다.

각 단계의 상수는 그 단계까지의 원래 coefficient에만 의존한다. 이후 차수를 더 생성하면서 앞선 cutoff를 재선택하는 방식은 사용하지 않는다. 다만 이 선택식은 **새 후보**이며 기존 canonical background에 이미 적용됐다는 의미가 아니다.

## 6. 실행 및 변조 방어

공개 진입점은 `attachActualBackgroundPhysicalSeminorms`, `actualBackgroundPhysicalSeminormCertificate`, `attachActualPhysicalCutoffSelector`이다. 실제 `prepareActualOrderInduction`의 같은 프로세스 내 인증 객체가 필요하다. 호출자가 복사한 결과, 임의의 norm, 변경한 graph 노드·함수 정의·FTC 항·scope·program metadata는 거부한다.

완료된 유한 program은 별도 prefix snapshot을 유지한다. 이후 source work가 노드와 함수 정의를 추가해도 기존 certificate의 SHA가 바뀌지 않는다. 이와 달리 기존 노드를 바꾸면 거부한다.

저장소 루트에서 실행하는 검증 명령:

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-background-physical-seminorms-kernel.test.mjs
python research-ide/mathscope-m2/navier/tests/run-physical-seminorm-source.py
```

첫 검사는 실제 다항식의 모든 anchored face 합을 정확한 유리식 항등식으로 검사하고, 혼합 face 또는 빈 face를 빼면 실패하는지 확인한다. 둘째 검사는 원래 1·2차 coefficient를 생성하여 physical 2차 미분 상수, 실제 내부 응력 지원, 강화 selector 및 변조 거부를 검사한다. 실제 실행 결과와 소스 해시는 `evidence/m2-continuation-20261011/`에 별도로 기록한다.

2026-10-11 실제 실행에서 kernel **5/5**, source **8/8**이 통과했다. source 실행은 28.30초, 최대 RSS 2,176,122,880 bytes였으며, 실행 전후의 literal import source SHA가 일치했다. 실제 `n=1,2`, `m<=2`의 240개 FTC 상수, `n=2`의 별도 가중 응력 상수, 두 단계 강화 selector를 생성했다. 유한 physical norm program은 380,253 nodes이고 SHA-256은 `1afb7abcea193057e4893dcec92f6975c7c0da4de9e27ab75ef74dc2b66dfa01`이다.

[실제 실행 및 소스 SHA 기록](evidence/m2-continuation-20261011/actual-background-physical-seminorms-validation.json)과 [생성된 certificate 요약](evidence/m2-continuation-20261011/actual-background-physical-seminorms-source.json)을 함께 보관한다. kernel 5개는 새 화면 검사 5개와 함께 재실행한 별도 10개 검사 기록에도 포함되므로, 두 기록의 개수를 합산하지 않는다.

## 아직 이 결과로 완료되지 않는 항목

이 모듈의 `COMPLETED`는 **실제 유한 계수의 위 정확 적분 상수 구성**을 가리킨다. 정밀한 norm 수치 평가, 새 cutoff를 적용한 전체 background, 전 차수 finite residual의 source-bound 상쇄, `n=1` 가중 경계 추정, 모든 physical label에 대한 wave 잔차와 전역 flat-error, 실제 해석학적 Lean 정리를 가리키지 않는다. M2의 전체 완료 gate 및 M3 진입 여부는 이 유한 certificate와 별도로 판정한다.
