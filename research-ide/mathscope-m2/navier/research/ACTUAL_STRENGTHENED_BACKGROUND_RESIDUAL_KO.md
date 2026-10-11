# 실제 강화 cutoff 배경과 유한 잔차 연결 — 2026-10-11

이 묶음은 원래 정규화 cutoff `c_n`을 보존하면서 별도의 강화 cutoff `a_n`을 **실제 배경의 식에 적용**한다. 이어서 원래 양의 차수 스트레스의 signed primitive를 실제 본문에서 미분하고, 유한 절단의 모든 잔차 계수와 고차 꼬리의 물리 미분 경계 상수를 만든다.

실행한 범위는 실제 계수 `n=1,2`, anchor `1`, 물리 미분 차수 `m=1`이다. 낮은 차수 잔차를 0이라고 선언하지 않았다. 전역 `M_X=U`, 모든 전역 압력 재구성, 이 항등식의 전 차수 귀납, 전역 flat-error 및 새 Lean 증명은 이 묶음의 완료 주장에 포함하지 않는다.

## 원문과 원래 source

- 원문: [Navier–Stokes 원문 PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), PDF SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
- 실제 압력과 leading stress: PDF 27–28쪽의 (4.11), (4.16), `actual-covariance-sensitivity.mjs:actualLeadingTargetOnSensitivityGraph`가 유지하는 원래 `I,J,S,Cp,Pi0` 및 두 shear 항.
- 양의 차수 방정식: (5.6), (5.9), `actual-residual-order-induction-source.mjs`의 실제 계수와 원래 `buildActualOmegaCoefficientOverX`.
- 유한 잔차와 물리 좌표: PDF 55–56쪽의 (5.25), (5.26).
- 물리 seminorm과 선택: PDF 57–59쪽 Lemma 5.4의 (5.37), (5.40).
- `n=1`의 weighted 경계는 별도로 완료한 `actual-order-one-weighted-stress.mjs`를 재사용한다. 이 배경의 새 `a_1`을 원래 `c_1`과 같은 값으로 간주하지 않는다.

원래 source 모듈, 원래 selector, runtime, bundle, 원본 64개 판정은 변경하지 않았다. 검증 프로세스가 읽은 기존 의존 파일 57개의 SHA는 실행 전후 및 최종 봉인 시 일치한다.

## 1. 강화 선택을 실제 식에 적용

새 수열은

\[
\log a_n=\max\{\log c_n,\log a_n^{\rm physical},\log a_{n-1}+\log2\},\qquad a_0=1
\]

이다. `c_n`은 기존 canonical 규칙으로 독립적으로 계산한다. `a_n^{physical}`은 실제 Cartesian/time seminorm 및 `n≥2`의 실제 `T_n/ζ` 경계에서 나온다. 모든 최대값의 피연산자와 정확한 적분 상수를 graph에 남긴다.

새 수열은 기존 정규화 조건과 실제 물리 조건을 동시에 만족하도록 더 크게 선택된다. 실제 source가 만든 각 상수 `B_nm≥1`에 대해 `q≤1/a_n`이면

\[
B_{nm}q^{nh}\le 2^{-n},\qquad
\lvert D^\alpha Z_n^{\rm cutoff}\rvert\le 2^{-n}q^{nh-(2A+m)}
\]

인 선택식을 사용한다. 여기서 `Z_n`은 potential, angular/radial/axial velocity, pressure, signed stress 및 cutoff 미분에서 생기는 항을 모두 포함한다. `a_n`이 실제로 `χ(a_nq)`의 인자에 들어가는지를 실행 검사한다.

원래 time cutoff는 `χ(s)=1-σ_1(2s-1)`이다. 배경의 radial Cartesian 계수는 각 양의 차수에서

\[
q^{2nh}\left[\frac{\chi(a_nq)v_n}{2}
-\frac{\eta\,(a_nq)\chi'(a_nq)}{L}\frac{M_n}{X}\right]
\]

를 사용한다. 두 번째 항은 원래 stream에 cutoff를 곱한 뒤 curl을 취할 때 생기는 항이다. 독립적인 비상수 generic 함수의 직접 curl 계산에서 이 항을 제거하면 등식 검사가 실패한다.

압력은 `Pi0+Σq^(2nh)χ(a_nq)Pi_n`, signed stress는 `T0+Σq^(2nh)χ(a_nq)T_n`으로 함께 조립한다. leading target은 실제 full heat와 모든 원래 moments를 유지한 기존 helper에서 가져온다. covariance matrix, supplied target 또는 양의 weight를 가정하지 않는다.

### 실제 완전한 한 band

anchor `j`에 대해

\[
\frac1{4a_j}\le q\le\frac1{2a_j}
\]

에서는 `n≤j`의 cutoff가 1이고 `n≥j+2`의 cutoff와 모든 미분이 0이다. 따라서 `j+1`까지 실제 계수를 구성하면, 모든 doubling continuation에 대해 이 band의 배경 본문을 완전히 알 수 있다. 생성하지 않은 높은 계수를 0으로 정의한 결과가 아니다. 이 band를 모든 `q`, 다른 pulse band, 원래 `ell=1` admissibility의 증명으로 확장하지 않는다.

## 2. 실제 물리 미분과 운동량

프로필 좌표를 `(q,y1,y2,η)`, `y=x_perp/√q`로 둔다. `E=q∂q`, `D=1/2-h`, `d=1-η²`, `L=1-2hη²`일 때

\[
\partial_{x_i}=q^{-1/2}\partial_{y_i},\qquad
\partial_z=\frac{q^{-D}}L(2\eta E-\eta y\cdot\nabla_y+d\partial_\eta),
\]
\[
\partial_t=\frac1{qL}(-E+\tfrac12y\cdot\nabla_y+D\eta\partial_\eta).
\]

`actualStrengthenedPhysicalMomentum`는 이 연산자로 실제 새 velocity의 시간 미분, 전체 공간 Laplacian, 실제 pressure gradient, 모든 quadratic transport, signed stress divergence를 계산한다. 계수의 미분도 유지한다. stress의 cylindrical 나눗셈은 `X>0`에서만 사용하며, 축에서 그 나눗셈을 수치 평가하거나 새로운 축의 stress 정칙성을 주장하지 않는다.

`physicalMonomialDerivativeWords`는 `q^a f(y,η)`의 각 물리 미분 단어를 정확히 생성한다. `x1,x2`는 `1/2`, `z`는 `D`, `t`는 `1`의 지수 손실을 남긴다. 길이가 `m`인 단어의 손실은 최대 `m`이며 계수 차수 `n`과 독립이다. 먼저 느슨하게 만든 부등식을 다시 미분하지 않는다.

일반적인 비선형 차이식도 독립적인 62개 함수 jet를 사용한 정확 유리 다항식 항등식으로 검사했다.

\[
F(u+e,p+\pi,T+S)-F(u,p,T)
=e_t-\Delta e+\nabla\pi+\operatorname{div}S
+(u\cdot\nabla)e+(e\cdot\nabla)u+(e\cdot\nabla)e.
\]

마지막 quadratic 항을 빼면 검사가 실패한다. 이 generic 항등식은 실제 무한 꼬리의 경계나 flatness 자체를 공급하지 않는다.

## 3. 원래 signed stress를 실제 미분

각 실제 `T_n,theta`, `T_n,z`에서 원래 forward integral을 찾아, 분모와 곱한 뒤 `G.derivative`로 미분한다. 미분 전 원래 잔차 본문은 독립적으로 존재하며, 기대하는 도함수를 주입하지 않는다.

실제 적분의 열린 지지구간에서

\[
\partial_X(2XT_{n,\theta})=-2X(r_{n,\theta}/R),\qquad
\partial_X(\sqrt{2X}T_{n,z})=-r_{n,z}
\]

를 검사했다. `n=1`의 theta 지지구간 끝은 `Xb`, 나머지는 원래 `Xplus`다. 고정 label 끝점과 앞뒤의 원래 0 branch가 그대로 있는지도 확인한다. 부호를 바꾼 식은 네 경우 모두 실패한다.

이 검사는 내부의 FTC를 닫는다. 내부 Picard 식과 전역 식의 restriction, 전체 적분 moments를 이용한 양끝 접합까지 이 FTC 검사만으로 닫았다고 주장하지 않는다.

### 보존한 첫 실패와 수정

첫 source 실행은 새 배경 관련 3건 PASS 후 `n=2`의 FTC 비교에서 멈췄다. 원인은 직접 integrand를 미분할 때 남는 `∫smooth_piecewise(0,0,0)`이었다. 원래 AD는 이 정확한 0을 즉시 하나의 `G.zero`로 축약하지 않는다.

새 `reduceLiteralZeroDerivatives`는 문자 그대로 0인 산술식, 모든 branch가 0인 함수, 그 함수의 적분만 0으로 증명해 정리한다. 지지가 compact라는 이유로 0이 아닌 적분을 없애지 않는다. 독립 fixture가 첫 실패를 재현하며, 이 수정 후 등식이 통과하고 0이 아닌 primitive는 남는 것을 확인한다. 원래 source의 함수 본문과 AD 규칙은 바꾸지 않았다.

## 4. 유한 절단의 모든 계수와 실제 고차 꼬리 경계

실제 `0..N` 계수로 구성한 유한 uncut tuple을 (5.6)/(5.9)의 전체 형식으로 전개한다. 모든 ordered pair `(i,j)`를 보존한다. axial viscosity가 한 차수 이동하는 규칙도 그대로 남긴다. 유한 다항식의 `n>N` 피연산자만 그 **유한 절단의 정의상** 0으로 사용한다.

- theta와 axial의 높은 계수는 `N+1..2N`이다.
- radial은 `Omega_(n-1)/X` 때문에 `N+1..2N+1`까지 남는다.
- `n≤N`의 실제 pressure/stress defects는 root로 남기며 `declaredZero:false`다.

높은 차수 계수를 Cartesian 프로필로 옮긴 뒤 모든 요청한 물리 미분 단어를 생성한다. 각 단어에 세 좌표의 anchored FTC **8개 face 전체**를 적용한다. `sqrt(1+f²)≥|f|`를 사용해 실제 적분 본문의 정확한 상수를 만든다. 상수는 수치 midpoint나 공급한 norm이 아니다.

따라서 높은 차수 꼬리만을 `H_N`이라 쓰면 실행한 `m`에 대해

\[
\lvert D^\alpha H_N\rvert
\le C_{N,m}\,q^{2(N+1)h-(2A+1+m)},\qquad |\alpha|\le m,
\]

인 source-bound 상수가 있다. 이 상수는 원래 계수의 smooth Cartesian axis 및 compact extension이라는 분석적 source 성질을 사용한다. 새로운 Lean 해석학 정리를 실행했다는 뜻은 아니다.

이 경계는 **보존한 낮은 차수 defects를 포함하지 않는다.** 따라서 아직 `F(U^[N])` 전체의 위 경계를 증명했다고 말할 수 없다. 이를 알리는 `fullFiniteResidualBoundEstablished:false`를 certificate에도 남겼다.

## API와 봉인

| 파일 | API | 실제 반환 범위 |
|---|---|---|
| `actual-strengthened-background.mjs` | `prepareActualStrengthenedBackground`, `attachActualStrengthenedBackground` | 원래 source에서 선택·적용한 별도 강화 배경, 한 anchor band |
| 같은 파일 | `actualStrengthenedPhysicalMomentum` | 실제 전체 물리 운동량 expression, zero/flat 선언 없음 |
| `actual-background-residual-bridge.mjs` | `actualPositiveStressFTC` | 실제 양의 차수 signed primitive의 내부 FTC |
| 같은 파일 | `attachActualFiniteResidualBridge` | 전체 유한 잔차 계수, 보존한 low defects, 고차 꼬리 FTC 상수 |
| 각 source module | `assert...`, `...CertificateFromProgram` | private live binding, 고정 graph prefix, 변조 거부, SHA |

상수·원래 필드·미분을 입력으로 받지 않는다. source prefix와 실행예산만 받는다. 각 certificate는 고정된 node prefix를 사용하므로 이후 source 작업의 append가 이전 hash를 바꾸지 않는다.

## 검증 결과

```bash
python tests/run-strengthened-background-validation.py kernel
python tests/run-strengthened-background-validation.py source 2
```

최종 generic 검사는 8/8 PASS다. 최종 genuine source는 실제 constructor 한 번으로 7/7 PASS, exit 0, 43.86초, peak child RSS `2,688,294,912` bytes였다. 첫 실패의 TAP와 프로세스 기록도 보존했다.

최종 source는 `a1,a2`, 네 signed primitive, 세 높은 차수의 계수, 75개 FTC 상수와 총 600개 face, 실제 물리 momentum, 변조 거부 및 고정 hash를 검증했다. 세부 명령·프로세스 시간·실행 당시 모듈 SHA·graph SHA는 `evidence/strengthened-background-20261011/validation.json`과 인접 원본 기록에 있다. 값의 정밀 수치 enclosure나 브라우저 UI 작업은 이 묶음에 포함되지 않는다.

## 다음에 실제로 닫아야 하는 연결

1. 실제 full leading stream 및 각 양의 차수 stream의 전역 `M_X=U`를 원래 모든 branch의 적분 본문과 접합 moments에 결속한다.
2. 원래 `Pi0=P0+∫F0²`와 각 전역 `Pi_n`을 미분하여 `Pi_n,X=Σ_(i+j=n)F_iF_j−Omega_(n−1)/(2X)`를 실제 전체 지지구간에서 증명한다.
3. 위 전역 항등식과 원래 stress의 내부·외부 접합을 이용해 보존한 `n≤N` defects를 정확히 0으로 만든다. 그때 이 묶음의 고차 꼬리 경계를 유한 잔차 전체에 적용할 수 있다.
4. 임의의 고정 `m`에 대해 전 차수의 실제 norm recipe와 selector summability를 증명한다. 현재 물리 selector의 `16`은 실행 representation의 경계로 보고되며, 모든 정수 차수의 theorem과 동일시하지 않는다.
5. 유한 잔차 경계와 실제 무한합의 tail을 위 비선형 차이식에 넣어 전역 flat-error를 얻는다. global curl/모든 label/primary wave 및 Lean 의무는 별도 게이트다.

이 묶음은 `wholeGN4Complete`, `fullPhysicalResidualAndFlatErrorPackageComplete`, `m3MayStart`를 모두 `false`로 유지한다.
