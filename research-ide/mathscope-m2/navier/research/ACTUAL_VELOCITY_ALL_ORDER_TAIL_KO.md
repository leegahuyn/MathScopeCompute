# 실제 속도·벡터 퍼텐셜의 모든 고정 차수별 물리 합산

이 기록은 `actual-velocity-all-order-tail.mjs`의 정확한 범위와 2026-10-11 실제 실행을 설명한다. 원래 normalized cutoff (c_n)을 보존하는 **별도의 속도용 선택자** (a_n^{(v)})를 정의하고, 그 선택자를 원래 양의 차수 계수에 실제로 적용한다. 이전 `actual-strengthened-background.mjs`의 (a_n), 다른 admissible-band 선택자, 공개 runtime의 절단값을 교체하거나 서로 동일시하지 않는다. 아래 식에서는 이 새 (a_n^{(v)})를 간단히 (a_n)으로 쓴다.

이번 결과는 원문의 물리 미분 변환 (5.26), Lemma 5.4의 대각 합산 (5.37), tail 비교 (5.35)를 **원래 양의 차수 속도·벡터 퍼텐셜 성분**에 연결한다. 압력·응력까지 포함한 증강 잔차 (5.24)의 모든 저차 계수 소거와 평탄성 (5.36)은 별도 의무다. 따라서 `wholeGN4Complete`, `fullPhysicalResidualAndFlatErrorPackageComplete`, `newLeanKernelProof`, `m3MayStart`는 모두 `false`다.

## 1. 결속한 원본

입력은 이전에 봉인한 `ActualGlobalPositivePrimitives`의 살아 있는 객체다. 공개 함수는 사용자 계수, 도함수, 적분값, norm, cutoff body, positivity flag를 받지 않는다.

| 항목 | 실제 원본 |
| --- | --- |
| profile | `same-profile-2026-10-10.3` |
| parameter expression SHA-256 | `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152` |
| 계수 생성 | `actual-residual-order-induction-source.mjs:prepareActualOrderInduction / completeOrder` |
| 1차 원래 전역 확장 | `actual-continuation-exact-order-one.mjs:attachActualFirstOrderExtension` |
| 전역 질량 원시함수 | `actual-global-positive-primitives.mjs`의 실제 (M_{n,X}=U_n), 두 radial bump, 첫 질량 moment와 닫힌 영 분기 |
| cutoff Euler 경계 | `actual-residual-order-induction-kernels.mjs:sourceNormalizedCutoffWeights` |
| 원래 normalized 수열 | `actual-residual-order-induction-cutoffs.mjs:attachActualCanonicalCutoffs` |

원문 근거는 *Finite Time Blowup for Navier–Stokes* 55–59쪽의 (5.23)–(5.26), Lemma 5.4, (5.35), (5.37)이다. 원문 PDF SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다. 실제 모든 성분을 포함해야 하는 원문 전체 tuple과 이 구현의 속도·퍼텐셜 부분을 구별한다.

원래 (h)는 그대로 둔다. 같은 원본의 (0<h<2^{-4096}), (A=1/2+h), (D=1/2-h), (L=1-2h\eta^2)를 사용한다. 매우 작은 양의 (h)를 부동소수점 0으로 바꾸지 않는다.

## 2. 실제 아홉 성분

(y=x_\perp/\sqrt q), (X=(y_1^2+y_2^2)/2), (B_n=M_n/X)로 쓴다. (B_n)의 구현은 축에서 나누지 않는다. 실제 전역 질량·평균의 분기를 열어 다음을 확인한다.

- 같은 (X), 같은 두 접합점을 사용한다.
- 안쪽에서는 실제 짝함수 평균을 사용하고 (M_n=XB_n)이다.
- 가운데에서는 양의 (X)에서만 실제 (M_n/X)를 사용한다.
- 바깥쪽 영 분기는 실제 질량 moment의 소거로 부드럽게 이어진다.

각 행의 `averageBinding`에 원래 두 root, 실제 분기 body, 검사를 보존한다. 원래 (v_n)도 원래 완성된 전역 계수다.

| 성분 | Cartesian profile | (q)의 지수 | cutoff |
| --- | --- | --- | --- |
| potential (x_1) | (-y_2B_n/2) | (2nh-h) | (chi(a_nq)) |
| potential (x_2) | (y_1B_n/2) | (2nh-h) | (chi(a_nq)) |
| angular (x_1) | (-y_2F_n) | (2nh-A) | (chi(a_nq)) |
| angular (x_2) | (y_1F_n) | (2nh-A) | (chi(a_nq)) |
| radial (x_1) | (y_1v_n/2) | (2nh-1/2) | (chi(a_nq)) |
| radial (x_2) | (y_2v_n/2) | (2nh-1/2) | (chi(a_nq)) |
| extra radial (x_1) | (-y_1\eta B_n/L) | (2nh-1/2) | (a_nq\chi'(a_nq)) |
| extra radial (x_2) | (-y_2\eta B_n/L) | (2nh-1/2) | (a_nq\chi'(a_nq)) |
| axial | (U_n) | (2nh-A) | (chi(a_nq)) |

시간 cutoff는 원래 선형 seed인 (chi(s)=1-\sigma_1(2s-1))다. `exp(-1/t)`를 사용하며 (s\le 1/2)에서 1, (s\ge1)에서 0인 실제 평탄한 분기를 만든다. 공간 cutoff의 제곱 seed를 대신 사용하지 않는다. extra radial 두 항은 원래 퍼텐셜에 cutoff를 곱할 때 생기는 미분 항이다. 이 항을 생략한 expression이 같은 속도라고 판정하지 않는다.

새 선택자는 각 norm 행의 **같은 실제 source profile body**를 공통 좌표로 재결속한 뒤 위 인자를 곱한다. `application.selectedComponents`가 source norm body, original roots, 좌표 대응, 선택 scale, (sigma=a_nq), cutoff 인자와 최종 값을 보존한다. 유한 양의 차수 퍼텐셜 3성분과 속도 3성분도 실제 합으로 생성한다. leading order는 이 유한 tuple에 포함하지 않았으며, 생성하지 않은 높은 차수를 0으로 취급하지 않는다.

## 3. 모든 고정 차수에 대한 실제 상수의 구성

### 3.1 실제 Cartesian FTC 적분

각 profile은 고정 상자

\[
[-\sqrt{2X_b},\sqrt{2X_b}]^2\times[-1,1]
\]

에서 직접 미분한다. 이 상자가 덮는 (X) 범위는 ([0,2X_b])다. 원래 공통 지지집합을 포함하며 축도 포함한다. (X^{-1})로만 표현한 profile을 축에 대입하는 방식은 사용하지 않는다.

각 미분 (f)에 대해 `rectangularSourceFTC`는 세 좌표의 8개 anchored face를 모두 생성한다. FTC 전개에서 나오는 모든 부분집합의 mixed derivative를 실제로 구하고, 각 절댓값을 (\sqrt{1+f^2})로 감싼 뒤 상자 전체의 유한 적분으로 올린다. 빈 부분집합의 꼭짓점 값도 포함한다. 따라서 실제 (\sup |f|)를 감싸는 유한 정확식이 생긴다.

이 상수는 원래 함수의 실제 도함수와 적분에서 생성된다. 십진수 quadrature 결과가 아니며 유저가 제공한 상수도 아니다. 유한값과 도함수의 존재는 실제 Picard/자연 계수, 원래 평탄 cutoff, 연속 moment correction, 전역 (M_{n,X}=U_n)과 실제 평균 분기에서 온다. 각 finite order에서 필요한 미분은 유한 개다. 차수가 증가할 때 같은 norm 상수가 유지된다는 주장은 하지 않는다.

### 3.2 물리 미분의 손실은 (n)에 의존하지 않는다

원문의 좌표 변환은 다음과 같다.

\[
\partial_{x_i}=q^{-1/2}\partial_{y_i},\qquad
\partial_z={q^{-D}\over L}\left(2\eta E-\eta y\cdot\nabla_y+d\partial_\eta\right),
\]

\[
\partial_t={q^{-1}\over L}\left(-E+\tfrac12 y\cdot\nabla_y+D\eta\partial_\eta\right),
\qquad E=q\partial_q,\quad d=1-\eta^2.
\]

길이 (j)인 물리 미분 word의 정확한 추가 지수 손실은 (ell=a/2+Db+c\le j)다. 구현은 (q^{2nh})를 cutoff Euler 경계 안에 먼저 남겨 둔다. 각 word에서 생기는 (q^{-b-\ell})의 미분 계수를 상수화할 때에만 (b+\ell\le b+j)로 올린다. (2nh)를 (-n)과 같은 손실로 바꾸지 않는다.

`physicalPositiveJetCalculus`는 ((E,y_1,y_2,\eta))의 보통 도함수 majorant를 다룬다. 곱셈은 네 좌표 각각의 모든 이항 계수와 모든 분할을 포함한다. (y_i,\eta,d)의 유한 차수 계수와 (1/L)의 모든 고정 차수 경계도 곱의 미분 안에 둔다. (h<1/16)이면 실수 (|\eta|\le1)를 중심으로 반지름 (1/2)인 복소 원판에서 (|1-2hz^2|>1/2)다. Cauchy 경계 (2j!2^j)보다 큰 (2j!8^j)를 사용한다.

그 결과 실제 source 상수 (B_{n,m}\ge1)을 생성하여 아홉 성분을 합한 tuple의 모든 물리 미분 (|\alpha|\le m)에 대해

\[
|\partial^\alpha Z_n^{\mathrm{cut}}|
\le B_{n,m}q^{2nh-(2A+m)},\qquad 0<q\le1
\]

를 얻는다. 공통 손실 (2A+m)은 의도적으로 넉넉한 경계이며 (n)과 독립이다. (n,m)에 따른 크기 증가는 실제 (B_{n,m})에 들어간다.

## 4. 실제 대각 선택과 합산 논증

(a_0=1)로 두고

\[
\log a_n=\max\left\{
\log c_n,\ \log a_{n-1}+\log2,\
\max_{0\le m\le n}{n\log2+\log B_{n,m}\over nh}
\right\},\qquad a_n=\exp(\log a_n)
\]

를 **원래 정확식 그래프**에서 만든다. 실제 (h>0), 실제 (B_{n,m}\ge1)이며 각 단계에 유한 개의 항만 있다. 원래 (c_n)은 별도의 lower bound로 보존된다. scale의 십진수 값은 계산하지 않는다.

cutoff 또는 그 도함수가 0이 아닐 수 있는 영역은 (q\le1/a_n)이다. 그 영역에서

\[
B_{n,m}q^{nh}\le B_{n,m}a_n^{-nh}\le2^{-n}\quad(m\le n).
\]

따라서 고정 (m)에 대해 (n\ge m)이면 실제 절단 항의 미분이 (2^{-n}q^{nh-(2A+m)})으로 제어된다. (a_{n+1}\ge2a_n)이므로 (q\ge\delta>0)인 compact 구간마다 실제로 활성인 항은 유한 개다. 이로써 (q>0)에서의 국소 유한 합과 매끄러움이 따라온다.

고정 (J\ge\max(1,m))에 대해 (q<1/(2a_J))이면 앞의 (J)개 cutoff가 모두 실제로 1이고 양의 도함수는 0이다. 원래 절단 전의 양의 유한합과의 차이는 다음과 같다.

\[
\left|Z-\sum_{n=1}^{J}Z_n\right|_m
\le\sum_{n>J}2^{-n}q^{nh-(2A+m)}
\le2^{-J}q^{(J+1)h-(2A+m)}.
\]

(\sum_{n>J}2^{-n}=2^{-J})는 정확한 기하급수 계산이다. 원하는 고정 미분 차수 (m)와 원하는 지수 (N)을 정한 뒤 ((J+1)h>2A+m+N)인 유한 (J)를 선택할 수 있다. 원래 (h)가 극도로 작으므로 필요한 (J)가 매우 클 수 있다. 구현은 이를 작은 정수로 반올림하지 않는다.

이 문장은 **각 요구 지수마다 충분히 높은 유한 절단을 선택하는 asymptotic tail**이다. 하나의 고정된 (J)의 차이가 자동으로 모든 차수에서 평탄하다는 뜻이 아니며, 선도장이나 Navier–Stokes 잔차의 평탄성을 뜻하지도 않는다. 원문 (5.39)로 잔차를 비교하려면 압력·응력의 같은 수준의 경계와 실제 유한 잔차 소거를 추가해야 한다.

기존 original coefficient constructor는 과거에 완성한 모든 하위 계수의 실제 moment를 소비하며 이후 계수를 읽지 않는다. (n\ge2)의 동일한 여섯 성분 재귀, 원래 다섯 moment, 전역 질량 primitive 논증은 각 고정된 유한 (n)에 적용된다. 위 norm과 max도 각 단계에 유한 개만 요구하므로 **무한 수열의 수학적 정의**와 **특정 prefix의 표현 실행**을 구분할 수 있다. 모든 무한 그래프를 한 번에 생성하거나 검사했다는 주장은 없다.

## 5. API와 표현 예산

| 함수 | 범위 |
| --- | --- |
| `physicalPositiveJetCalculus` | source 권한이 없는 독립 양의 jet 곱·합·shift 커널 |
| `positiveSourceDiagonalTailArithmetic` | 고정 (m,J)의 정확한 dyadic tail 논증; 자체 source 인증 없음 |
| `attachActualVelocityPhysicalSeminorms` | 살아 있는 실제 primitive 객체에서 지정 prefix의 실제 Cartesian jet/FTC 생성 |
| `attachActualVelocityDiagonalSelector` | 각 (n)에서 `(throughOrder,derivativeOrder)=(n,n)` norm을 생성하고 새 (a_n)과 실제 cutoff tuple을 구성 |
| `assertActualVelocityPhysicalSeminorms` / `assertActualVelocityDiagonalSelector` | private 객체, 그래프 prefix, 함수 정의, 실제 데이터, 고정 program의 변경 거부 |
| `actualVelocityPhysicalSeminormCertificate` / `actualVelocityDiagonalSelectorCertificate` | 고정 compile prefix SHA를 포함한 실행 인증서 |

새 물리 미분 커널에는 의미상의 차수 16 상한이 없다. 그러나 모든 질의는 유한한 `maxProfileJets`, `maxJetRequests`와 원래 source graph/도함수 materializer 예산을 지킨다. 기본 profile budget은 20,000개, jet query budget은 200,000개다. 실제 상자의 mixed face 도함수를 만들 수 없는 요청은 `RESOURCE_LIMIT`으로 끝난다. 누락한 도함수를 0으로 넣거나, generic fixture의 도함수를 실제 원본의 결과로 채우지 않는다.

원래 materializer에는 별도 유한 표현 제한이 남아 있다. `mathematicalDerivativeOrderCap:null`은 임의 차수 실제 질의가 자원 제한 없이 반드시 성공한다는 뜻이 아니다. 수학적 모든 고정 차수의 존재·재귀와 이번에 구체적으로 생성한 차수를 분리한 필드다.

## 6. 실제 검증과 범위

### 실행 결과

| 실행 | 결과 | 벽시계 시간 | peak child RSS |
| --- | --- | --- | --- |
| 독립 kernel | 5/5 PASS, exit 0 | 0.276초 | 76,120,064 bytes |
| 원래 source attempt 1 | 7/7 PASS, exit 0 | 26.243초 | 2,291,625,984 bytes |

source 실행은 원래 constructor를 **한 번** 사용했다. Node heap limit은 3,072 MiB, timeout은 150초였다. 실행 중 37개 frozen dependency의 SHA가 모두 유지되었다.

실제 생성 내용은 다음과 같다.

- diagonal (n=1,m\le1): 실제 Cartesian FTC 36개, 각각 8개 face.
- diagonal (n=2,m\le2): 원래 (n=1,2)에서 실제 Cartesian FTC 180개, 각각 8개 face.
- 두 norm 실행 합계 216개 실제 FTC, 1,728개 face, 실제 cutoff 조건 5개.
- 실제 선택 cutoff 성분 18개와 유한 합성 vector roots 6개.
- 실제 (M/X) 평균 분기의 축 정칙성과 닫힌 바깥쪽 분기, 사용자 상수 거부, 인증 데이터 변경 거부, append-only 작업 이후 고정 SHA 보존.

독립 커널은 (e^{2t}e^{3t})의 실제 17차 도함수 (5^{17}), 네 좌표 mixed Leibniz, 예산 소진, 원래 (chi)의 17차 Euler 경계와 extra derivative, 고정 (m=17,J=20) dyadic tail을 검사했다. **전체 실제 source의 17차 물리 jet을 실행한 것은 아니다.** 실제 source에 17차/불충분 예산을 요구하면 `RESOURCE_LIMIT`으로 거부하는 음성 대조도 포함했다.

### 고정 그래프 영수증

| 그래프 | SHA-256 | nodes |
| --- | --- | --- |
| 원래 positive primitive | `f163d4cfc24827b86f551208770d757955d00e282aea2a0594499882014bb839` | 121,025 |
| 실제 (n=1,m=1) norm | `6ac37afbfa757483b13df6c9dab4980d3e240f53190f928cc5396fdc62b55dbb` | 184,329 |
| 실제 (n\le2,m=2) norm | `a39c409a97faafeb0065ee3856deb41a60b8dc9cb29907cac243c5f155bd1850` | 332,025 |
| 실제 선택자와 cutoff tuple | `2d1288a9f408c95dadc2033ac2362840a2f1597493e3e90b57772ac1daa7357a` | 332,656 |

TAP, 실제 process 종료·RSS·dependency hash, source certificate와 전체 파일 SHA는 `evidence/velocity-all-order-tail-20261011/`에 있다. 이 패킷은 기존 원문 64개 판정의 개수나 뜻을 변경하지 않는다.

## 7. 남아 있는 정확한 의무

1. leading (M_{0,X}=U_0), 원래 (v_0) 재구성 및 leading global/core 동일시를 실제 bootstrap 전 구간에 연결해야 한다.
2. positive (\Pi_{n,X})와 원래 독립 `pressureDerivative`의 동일성에서, 실제 전체 ordered-pair (F_iF_j)와 (\Omega_{n-1}/(2X)) 식으로 가는 마지막 동일시를 완료해야 한다. (n=1)의 leading (Omega) 원시함수도 같은 소스 의무를 갖는다.
3. 실제 모든 고정 차수의 압력·stress와 그 경계 가중치를 속도와 같은 diagonal 수열에 결합해야 한다. 앞선 (n=1) weighted stress 증거를 모든 차수 전체 패키지로 확대하지 않는다.
4. 원래 leading stress를 포함한 retained 모든 차수의 전역 coefficient cancellation, 실제 증강 유한 잔차 경계, 그 뒤의 polynomial residual 비교가 필요하다. 이번 속도 tail만으로 (5.36)을 선언하지 않는다.
5. 원래 (q_0) 및 covariance admissibility의 추가 support 조건을 이 새 선택자의 조건으로 실제 결합하는 작업은 별도다. 조건을 max에 추가하는 수학적 가능성과 이미 적용한 실행 증거를 구별한다.
6. primary-wave의 모든 label/partition 물리 curl, 전역 stress cancellation과 flat-error, 새 Lean kernel proof 및 원문 M3 N6–N8은 이 모듈의 완료 범위에 포함되지 않는다.
