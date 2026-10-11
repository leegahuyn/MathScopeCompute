# 실제 양의 차수 전역 원시함수와 leading Ω 결함식

이 문서는 원래 계수 생성기를 바꾸지 않고 추가한 수학 검증을 설명한다. 실제 실행은 원래 (n=1,2) 계수 한 묶음에 대해 수행했다. 원문 전체 M2 G-N4, 전역 NS 잔차·flat-error 또는 새로운 Lean 증명을 완료했다는 문서가 아니다.

## 1. 이번에 원문 함수에 직접 연결한 결론

| 항목 | 이번 결과 | 실제 연결 대상 |
|---|---|---|
| (\partial_X M_1=U_1\) | 실제 원문 확인 | 원래 축의 적분 평균, local cutoff 원시함수, 두 Ipos bump, 실제 첫 번째 moment 식 |
| (\partial_X M_2=U_2\) | 실제 원문 확인 | 원래 Picard (U,K) 행, local cutoff 원시함수, 두 Ipos bump, 실제 첫 번째 moment 식 |
| (\partial_X\Pi_2=\texttt{pressureDerivative}_2\) | 실제 원문 확인 | 원래 Picard 압력 행, local pressure 적분, 세 angular bump, 전체 lower-pressure 적분, 실제 세 번째 moment 식 |
| (\partial_X\Pi_1=\texttt{pressureDerivative}_1\) | 별도 source 연결 필요 | 원래 leading (\Omega_0/(2X)) 원시함수와 (M_{0,X}=U_0\) |
| `pressureDerivative` = 실제 전체 global pair 식 | 미완료 | leading (F_0\)의 core/Ipos 제한식, global/core (v_0\), 같은 (\Omega\) 함수의 연결 |
| 모든 고정 차수의 NS 잔차 flatness | 미완료 | 보존형 전체 stress 적분·접합 및 pressure/global pair 연결 뒤에 수행 |

특히 세 번째 행은 원래 생성기에서 **독립적으로 만든 `pressureDerivative`** 에 대한 등식이다. 이를 곧바로 전체 전역 압력 방정식으로 바꾸지 않는다. 프로그램은 그 차이를 실제 식

\[
\mathrm{pressureDerivative}_n-
\left(\sum_{i+j=n}F_i^{\rm global}F_j^{\rm global}
-\frac12\frac{\Omega_{n-1}^{\rm global}}{X}\right)
\]

으로 구성하고 `remainingDifference`에 보존한다. 원래 모든 ordered pair ((0,n),\ldots,(n,0)\)를 포함한다. 이 차이를 0으로 지정하지 않는다.

## 2. 원래 질량 원시함수

원래 (n\ge2\) Picard 계의 행을 직접 확인한다. (\xi=\sqrt X\), (K_n=\operatorname{Avg}(U_n)-U_n\)라 하면

\[
\partial_\xi U_n=W_5,\qquad
\xi\partial_\xi K_n=-2K_n-\xi W_5.
\]

따라서

\[
\partial_X\bigl[X(U_n+K_n)\bigr]=U_n.
\]

(n=1\)의 원래 구현은 축에서 다른 표현을 사용한다. 그 원시함수는

\[
X\int_0^1 U_1(tX,\eta)\,dt
=\int_0^X U_1(s,\eta)\,ds.
\]

새 모듈은 두 표현을 혼동하지 않고 각 원래 AST 본문에 맞는 규칙을 적용한다. 일반 Picard 행의 부호를 바꾸는 독립 negative control은 실패한다.

안쪽 cutoff 뒤에는 실제 local (U_n\)의 적분을 사용한다. 적분 변수 이름과 명시적 0차 공유 함수의 이름만 무시한 본문 비교로 원래 local 적분과 같은지를 확인한다. 미분은 실제 원래 `definite_integral` 노드에 시행하고, 실제 움직이는 오른쪽 끝점의 FTC 항을 확인한다.

반지름 bump에서는 (R=\sqrt{2X}\), (u=R/R_b\)이므로

\[
\frac{du}{dX}=\frac1{R_bR},\qquad
\partial_X\left[R_b\alpha_j\int_{\ell_j}^{u}s b_j(s)\,ds\right]
=\frac{\alpha_j}{R_b}b_j(u).
\]

`s` 인자를 빼는 잘못된 Jacobian은 독립 검사에서 실패한다. (\alpha_j\), 실제 continuous matrix, 실제 유한 적분을 모두 유지한다.

마지막 (U\) bump 뒤에서 질량 원시함수를 0으로 닫는 것은 compact support만으로 정당화하지 않는다. 원래 실제 첫 번째 moment 식

\[
\text{actual local mass}+R_b\sum_j\alpha_j\,U_{0j}=0
\]

을 분모를 유지한 정확한 유리식 검사로 확인한다. cutoff 및 bump의 원래 평탄한 끝점 jet과 이 moment 식이 접합값과 모든 접합 미분을 정한다. 축은 원래 smooth even 표현의 연속적 극한을 사용한다.

## 3. (n\ge2\) 압력 원시함수

원래 계수 생성기의 압력은 core Picard 해, local pressure prefix, Ipos pressure correction, 전체 lower-pressure prefix로 구성된다. 이번 비교는 단순히 그 이름을 조회하지 않고 원래 pressure AST의 각 본문을 재구성한 식과 비교한다.

Picard의 실제 세 번째 행은

\[
\partial_\xi\Pi_n=4\xi F_0^{\rm actual}F_n+2\xi p_n^{\rm known},
\]

이며 나머지 압력 행 항이 원래 0인지도 확인한다. 따라서 core에서

\[
\partial_X\Pi_n=2F_0^{\rm actual}F_n+p_n^{\rm known}.
\]

그 밖의 local cutoff·lower-pressure 항은 원래 적분 노드의 literal FTC로 확인한다. lower-pressure는 이미 완료한 양의 차수 계수들의 전체 support와 원래 (\Omega\) branch를 포함한다. 이를 작은 core 적분으로 교체하지 않는다.

압력 bump의 원래 지수 (p=-2-2\lambda\)를 유지한다. 그 미분은

\[
\partial_X\left[2e_f R_b^p\beta_j
\int_{\ell_j}^{u}s^p b_j(s)\,ds\right]
=\frac{2e_f R_b^p\beta_j u^p b_j(u)}{R_bR}.
\]

실제 (X>0\), (R_b>0\)에서 (R=R_bu\)이므로 (R_b^pu^p=R^p\)는 양의 실수 로그의 곱셈식으로 성립한다. 원래 작은 양의 (\lambda\)를 0이나 특정 유리수로 교체하지 않는다. 따라서 이는 원래 `F0pos*dF` 항과 같다.

core 접합은 앞선 양의 차수 (F_i\)가 (X<X_{\rm keep}\)에서 자기 원래 Picard 해로 제한되는지 직접 branch 검사한 뒤 확인한다. 이 단계는 leading (F_0\)의 **global** 제한식을 가정하지 않는다. 원래 `pressureDerivative`의 local/positive-patch 분할 자체를 비교하기 때문이다.

오른쪽 압력 접합은 실제 전체 세 번째 moment

\[
\text{local pressure mass}+\int_0^{X_+}\mathrm{lowerPressure}_n\,dX
+2e_fR_b^p\sum_j\beta_j E_{1j}=0
\]

을 확인한다. 실제 leading (U_0,v_0\) 및 양의 차수 (F_i,U_i,v_i\)의 끝점은 (X_+\)보다 앞에 있으므로 그 압력 미분 밀도는 (X_+\) 이전의 열린 collar에서 이미 0이다. 원래 source support 증명과 원래 leading의 zero exterior 검사를 함께 소비한다.

## 4. leading Ω의 정확한 결함식

`actual-leading-omega-prefix-kernel.mjs`는 source authority가 없는 독립 대수 검사이다. 이는 root가 실제 leading 질량 원시함수를 결속할 때 사용할 정확한 연결식을 제공한다.

원래 정의 (J_X=v\), (H_X=Uv\), (K_X=v^2\)와 그 (\eta\) 미분을 사용하고, 원래 pressure prefix의 열 항을 모두 유지하면

\[
\partial_XP_\Omega-\frac{\Omega_0}{2X}
=\frac{v}{2L}\left[L(v+Xv_X)+dU_\eta-2A\eta U-2\eta XU_X\right].
\]

또한 원래

\[
v=\frac{2\eta U-(2D\eta M+dM_\eta)/X}{L},\qquad
\delta=M_X-U
\]

를 대입하면 대괄호는 정확히

\[
-2D\eta\delta-d\delta_\eta
\]

이다. 따라서 실제 (M_X=U\)와 그 (\eta\) 미분을 source에 결속하면 pressure prefix의 결함이 0이 된다. 이번 generic kernel은 그 source 결속을 자체적으로 주장하지 않는다. 특히 `axisVX`의 미분이 0이라는 사실과 원래 축에서 그 상수값이 올바르다는 별도 끝점 검사를 구분한다.

`-X*v_X` 경계항 생략, Ω 부호 변경, 질량 재구성의 (M_\eta\) 항 생략은 각각 실패하는 negative control을 갖는다.

## 5. 유한 실행과 모든 차수 명제의 구분

이번 actual source 실행 범위는 (n=1,2\)이다. 질량/Picard/bump/유한 moment 규칙은 (n\)에 관계없이 같은 원래 생성기에서 적용되는 구조이지만, 무한히 많은 차수를 실행했다는 뜻은 아니다.

기존 `actual-background-physical-seminorms.mjs`의 `derivativeOrder<=16`은 기존 유한 표현 API의 범위이다. 이것을 모든 차수의 수학적 불가능성이나, 자동으로 이미 증명된 모든 차수 명제로 바꾸지 않는다. 별도 후속 작업은 실제 velocity/potential Cartesian 계수에 대해 모든 고정 (m\)의 FTC 상수와 원래 cutoff Euler 재귀를 사용한 유한 조회 알고리즘을 만든다. 전체 pressure/stress의 접합과 전역 잔차 소거는 그 다음 필요한 독립 의무로 남는다.

## 6. 실행 증거

증거 위치: `research/evidence/global-positive-primitives-20261011/`.

| 검사 | 결과 |
|---|---|
| 독립 primitive kernel | 7/7 PASS |
| 독립 leading Ω/mass-defect kernel | 2/2 PASS |
| 원래 source 최종 attempt4 | 5/5 PASS, exit0 |
| 최종 source constructor 수 | 1 |
| 최종 source 시간 | 8.397900900999957초 |
| 최종 source peak RSS | 1,098,682,368 bytes |
| 원래 source 의존 파일 | 30개, 실행 전·후 동일 |
| 고정 프로그램 graph | 121,025 nodes, 4,786,883 canonical bytes |
| graph SHA256 | `f163d4cfc24827b86f551208770d757955d00e282aea2a0594499882014bb839` |

개발 중 실패도 보존한다. attempt1은 큰 공유 forcing을 불필요한 환경별로 다시 펼친 비교기의 visit 예산 초과였다. attempt2와 attempt3은 commutative AST의 순서를 각각 local/lower prefix 및 bump 역할의 순서로 오인한 구현 오류였다. 최종 구현은 실제 endpoint density로 primitive를 고유하게 찾는다. 이를 독립적인 순서 교환 검사로 재현·검증했다. 세 실패 실행을 최종 성공 실행으로 덮어쓰지 않는다.

새 모듈의 private live seal은 복사한 인증 객체, 변경된 derivative 식, 변경된 완료 flag를 거부한다. 고정 graph hash는 후속 append-only 노드 추가 뒤에도 같다. 최종 source 프로그램의 `wholeGN4Complete`, `fullPhysicalResidualAndFlatErrorPackageComplete`, `newLeanKernelProof`, `m3MayStart`는 모두 `false`이다.

## 7. 파일과 API

- `actual-global-positive-primitives.mjs`: `prepareActualGlobalPositivePrimitives`, `attachActualGlobalPositivePrimitives`, `assertActualGlobalPositivePrimitives`, `actualGlobalPositivePrimitivesCertificateFromProgram`.
- `actual-global-primitive-kernels.mjs`: 실제 본문의 alpha-equivalence, 실제 density에 따른 primitive 선택, 독립 bump/average 항등식.
- `actual-leading-omega-prefix-kernel.mjs`: `originalLeadingOmegaPrefixIdentity`, `originalLeadingMassContinuityDefect`.

기존 source 생성기, 원래 64개 기준의 의미, runtime/UI/build 및 기존 cutoff default는 수정하지 않았다.
