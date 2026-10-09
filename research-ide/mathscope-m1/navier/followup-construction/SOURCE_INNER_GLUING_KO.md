# 원문 B.34/B.8의 실제 inner–outer 접합 계산

이 모듈은 별도의 외부 discrepancy를 심어 놓는 예제 대신, 실제 `runControlledContinuation`의 B.26 종점에서 출발한다. 원문은 첨부된 166쪽 논문의 154–157쪽이며, attachment SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. 원문 28쪽의 다섯 누적 모멘트와 (4.16), 155쪽의 (B.35)를 사용한다.

현재 결과의 지위는 **실제 원문 연산을 실행하는 수치적 컴포넌트 후보**다. 출력이 `SOURCE_INNER_GLUING_COMPUTED`여도 `status`는 `PARTIAL`이며, `fullProfileCertified`, `fullNavierStokesSolution`, `formalPass`는 모두 `false`다. 원래 N3-05 인수 조건에 포함된 연속 적분 오차의 enclosure와 모든 η에 대한 interval Newton/implicit-function 검증은 아직 통과하지 않았다.

## 1. 입출력과 계산 순서

정적 모듈 `source-inner-gluing.mjs`가 다음 함수를 제공한다.

- `validateInnerGluingInput(input)`: JSON·지원 범위·공통 h·원래 반지름 순서만 검사한다. ODE나 모멘트 적분을 실행하지 않는다.
- `runInnerGluing(input, budget)`: 실제 upstream continuation과 뒤따르는 모든 수치 연산을 실행한다.
- `getInnerGluingExamples()`: IDE 작업 종류 `ns.source-inner-gluing`의 기본 입력을 반환한다.
- `assessInnerGluingDebtRepresentation(values)`: 내부 Newton 단계의 부호/로그 표현 변환 가능성만 검사한다. 이 함수가 임의의 모멘트를 실제 작업에 주입하도록 허용하지는 않는다.

실행 순서는 다음과 같다.

1. 같은 입력의 A.21 압력과 B.12–B.15의 유한 비선형 축 계수에서 B.22/B.26 연장을 계산한다. 중심 η와 양쪽 finite-difference 점은 한 번의 작업에 들어가며 같은 κ₀를 사용한다.
2. 각 단면의 실제 `X_i=110` 종점에서 `E`, `U`, `M`, `I`, `J`, `S`, `C_p`, 압력 및 필요한 η-jet을 읽는다. 사용자가 종점 또는 모멘트 debt를 교체할 수 없다.
3. `ell_i=log(C E(X_i,η))`, `G_i=U(X_i,η)`로 원문 (B.34)의 로그 전이를 실행한다.
4. `log X_R=log X_i+10(log C+log P_*)`를 계산한다. `x_sep=X_sep/X_R<exp(-8)`이 아니면 입력 단계에서 실패한다.
5. 실제 다섯 누적 모멘트를 정규화하여 전이 전체에서 적분하고, A.7의 기준 프로파일 모멘트와의 차이를 측정한다.
6. `-8<log x<-7`에서 `U=G_i+(4η-G_i)σ(log x+8)`로 축 방향 값을 복원한다. E는 이미 A.7의 기준 멱함수다. 이 연산이 추가하는 실제 모멘트 차이도 누적한다.
7. `-6<log x<-5` 안의 서로 겹치지 않는 고정 지지 다섯 곳에 U의 bump 두 개와 E의 bump 세 개를 놓는다. 측정한 실제 차이를 상쇄하는 5변수 이차 방정식을 풀고 더 높은 차수의 별도 적분으로 재검사한다.
8. 같은 후보에서 (B.35)의 `W`, `Q_s`, `N_s`, 압력, 모멘트, a와 b_s, 표시된 지점의 relaxed-cone 판정을 계산한다. 실패 지점도 출력에 남긴다.

## 2. 실제 수학 대상과 정규화

기준 각방향 프로파일은 `E_0=P_* f x^(1/10)`, `f=(1+η²)^(-1)`, `U_0=4η`이다. 정규화된 모멘트는 다음과 같다.

| 이름 | x 좌표의 적분 | 물리 X 좌표와의 관계 |
|---|---|---|
| M-hat | ∫ U dx | M=X_R M-hat |
| I-hat | ∫ sqrt(2x) E dx | I=X_R^(3/2) I-hat |
| J-hat | ∫ U sqrt(2x) E dx | J=X_R^(3/2) J-hat |
| S-hat | ∫ (U²−E²/2) dx | S=X_R S-hat |
| C_p | ∫ E²/(2x) dx | C_p의 수치 자체는 불변 |

기준 적분은 닫힌 식으로 평가한다. 예를 들어 `I_0=sqrt(2)P_*f x^(8/5)/(8/5)`, `C_{p,0}=(5/2)P_*²f² x^(1/5)`다. 전이의 모멘트를 이 기준값으로 대체하지 않고 둘의 차이를 실제로 계산한다.

기본 예제에서 `log X_R≈804.70048`이므로 X_R 자체는 Float64의 표현 범위를 넘는다. 물리 반지름과 아주 작은 중간 모멘트는 `SIGNED_LOG`의 부호와 `logAbs`로 보존한다. 비영 모멘트 debt가 Newton 좌표로 변환되는 순간 0으로 underflow하거나 무한대로 overflow하면 `PRECISION_REQUIRED`를 반환한다. 이러한 행을 0으로 버리고 접합 성공으로 표시하지 않는다.

## 3. 다섯 변수의 실제 이차 모멘트 지도

`δU=c_0 b_0+c_1 b_1`, `δE=c_2 b_2+c_3 b_3+c_4 b_4`로 놓는다. `b_j(x)=σ′((x-a_j)/(b_j-a_j))`이며 각 지지 구간은 고정되어 있다. 함수 적분은 지지 구간의 폭과 같아서 모멘트 적분기의 독립 검사가 된다.

다섯 모멘트의 변화량은 다음 밀도를 적분한다.

| 행 | 실제 변화량의 밀도 |
|---|---|
| M | δU |
| I | sqrt(2x) δE |
| J | sqrt(2x)(U₀δE+E₀δU+δUδE) |
| S | 2U₀δU−E₀δE+δU²−δE²/2 |
| C_p | (2E₀δE+δE²)/(2x) |

따라서 차이는 정확히 이차 다항식 구조이며, 수치 계산은 그 선형 행렬 L과 이차 텐서 Q를 적분한다. 원문과 같은 `J−4ηI`, `S−8ηM` 행 변환을 적용하면 미분의 두 블록이 분리된다. 출력에는 원래 L과 Q, 행 변환 뒤 L, 실제 최종 Jacobian, 정규화된 Jacobian, 역행렬 ∞-norm 진단, Newton 이력, 재적분 잔차가 모두 들어 있다.

모멘트 지도는 최소 128점 Gauss 규칙으로, 다른 192점 규칙으로 최종 결과를 재적분한다. 이는 **수치 일치 검사**이며 연속 적분의 구간 enclosure를 대신하지 않는다. 실제 수치 Jacobian이 가역이어도 모든 η에서의 interval-Newton 정리를 통과했다고 표시하지 않는다.

## 4. B.35와 원뿔 계산의 범위

`N_s`의 `−WU` 항은 1/x로 나누는 모멘트 분수 **밖에** 놓인다. 원래 continuation/C.12 구현에서 발견된 이 항의 잘못된 스케일은 별도 이력 `history/ns-wu-scaling-v1/`에 보존한 뒤 교정되었다. 이 모듈은 교정된 upstream API를 사용한다.

모멘트의 η 미분은 A.7 기준 모멘트의 해석적 미분에 실제 discrepancy의 중심 차분을 더한다. 중심 차분은 3개의 별도 실제 접합 결과를 사용하지만, 그 오차는 모든 η에서 인증되지 않았다.

원뿔 판정에서 `p_1`, `p_2`가 매우 커도 `exp(log X_R+log x)/L`를 공통 인수로 분리하여 비교한다. 물리 값을 직접 계산하다가 Infinity가 되어 통과시키는 방식을 사용하지 않는다. 출력의 `relaxedConePassingSamples`는 표시된 유한 지점의 수다.

## 5. 기본 예제, 실제 실패 및 남은 조건

기본값은 `j_0=10^(-6)`, `Λ=1024`, `log C=80`, `T_sh=640`, `log P_*=0`, `η=0`과 양쪽 차분점이다. 이는 A.21의 실제 압력 식을 사용하는 수치 컴포넌트다. `log P_*>T_d`의 큰 진폭 조건은 만족하지 않는다. 따라서 논문 전체 매개변수 계층을 구현했다고 주장하지 않는다.

- 원래 `j_0=.03`, `Λ=48`의 후보는 실제 Newton 일치 및 원뿔 검사에서 실패했다. `source-inner-gluing-initial.json`과 후속 trial 파일에 결과가 보존되어 있다.
- 초기 32점 Gauss 계산은 flat bump 적분을 충분히 해상하지 못했다. 함수의 정확한 적분값과 독립 적분으로 이를 검출하여 128/192점 계산으로 교정했다. 원래 실패 기록을 제거하지 않았다.
- `log P_*=14`를 넣은 가지에서는 현재 유한 축 계수가 양성을 잃어 `INVALID_PROFILE`로 거부되었다. 이는 원문의 무한 축 정리가 실패했다는 뜻이 아니라 이 유한 수치 근사가 그 가지를 제공하지 못한다는 뜻이다.

원래 N3-05를 닫기 위해 남은 조건은 실제 무한 축 해와 유한 계수·반올림 오차의 결속, B.33/B.40의 균일한 상수와 선택 순서, 연속 적분 enclosure, 같은 전역 매개변수 영역의 interval Newton/implicit-function 포함 조건이다. 이후 C.12 연산 역시 이 **같은** 완성 프로파일에 연결되어야 한다. 별도 annulus 예제의 C.12 성공으로 대체하지 않는다.

## 6. 재현

| 검증 집합 | 결과 | 검증 범위 |
|---|---|---|
| Node 검증 | 26/26 통과 | 실제 계산·거부 경로·취소·예산·입력 변조 차단·결정적 재실행 |
| 독립 Python 검사 | 691/691 통과 | 90자리 계산으로 원문 모멘트 스케일·B.34·복원 debt·L/Q·Jacobian·원문 블록 구조·수치 잔차 대조 |
| 초기 32점 Gauss 후보의 독립 검사 | 616개 중 130개 실패 | 해상도 부족의 실제 실패 이력을 보존 |

여기서 691은 각각의 스칼라 등식·부등식·행렬 원소 등의 검사 수다. 원래 설계도의 691개 인수 조건을 완료했다는 뜻이 아니다. 독립 검사기는 아주 작은 B.34 integrand를 지수 인자로 재정규화하며, 처음의 절대오차 조기 종료 문제와 교정 전 보고서도 이력에 보존한다.

```bash
node --test mathscope-m1/navier/followup-construction/source-inner-gluing.test.mjs
python mathscope-m1/navier/followup-construction/source-inner-gluing-reference.py
```

기본 JSON 입력과 전체 결과는 `source-inner-gluing-fixture.json`, 원문/버전/검증 범위는 `source-inner-gluing-contract.json`, 해시 목록은 `source-inner-gluing-manifest.json`에 둔다. 입력 whitelist의 상속 이름 거부 교정 전후에는 실제 결과가 완전히 같음을 확인했으며, 독립 검사 파일과 최종 입력·결과·소스의 결속도 별도 기록에 둔다. 독립 검증이 통과해도 그 결과는 수치 컴포넌트의 검증이며 새로운 Lean 전역 증명이 아니다.
