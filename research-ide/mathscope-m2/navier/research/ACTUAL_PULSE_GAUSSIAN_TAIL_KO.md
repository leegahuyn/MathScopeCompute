# 원래 homogeneous pulse의 Gaussian 꼬리와 실제 시간 도함수

## 1. 완료 범위

`actual-pulse-gaussian-tail.mjs`는 별도 작은 q 선택으로 구성한 **원래 terminal pulse의 전체 Volterra 해**에 다음 결과를 연결한다.

- 원래 moving-normal pressure와 B′를 포함하는 2×2 방정식의 안정한 정규화.
- 원래 Gaussian 인자 P의 적분 본문과 FTC.
- 원래 cutoff ψ의 잔차 `ψ′t` 및 그 0·1·2차 v 미분.
- 양수 상수 a에 대한 `C_m exp(−a ell²)` 상계와 정확한 양수 무한합 tail.
- 원래 정수 mesh의 band별 `ell^18` 개수, 한 점의 양수 β label 최대 16개 및 두 sign의 최대 32개 항.

**이 결과는 bare homogeneous pulse의 fast-v 도함수 상계이다.** 모든 label의 진폭을 같은 상계로 결속하는 작업, sqrt weight·slow cutoff 미분, 전체 물리 미분의 손실 및 원래 비선형 잔차는 별도로 연결해야 한다. 수치 pulse 구간이나 M2 전체 완료로 세지 않는다.

## 2. 원래 source와 변하지 않는 양수 척도

입력은 기존 `prepareActualAdmissibleTerminalCovariance`의 private source뿐이다. 표시용 `terms:0/1`은 진폭으로 사용하지 않는다. 원래 source의 h, k, ε, Ls, 두 실제 carrier, 대표점, 실제 F·F_R·G_R와 초기값 w(0)=(1,0)을 그대로 유지한다.

B는 기존 원본에 정의된 고정 norm 합이며 B≥2^128, B≥Renv^4096이다. 기존 source bounds가 주는 작은 q 조건에서 다음 primitive 범위를 사용한다.

\[
|F|,|F_R|,|G_R|,R,|c_0|,\lambda_0\le B,
\quad |n_j|\le B^4,\quad |n'_j|\le B^{12}/S,
\]

\[
|n_{tan}|,|n|\ge B^{-2},\quad |c_0|\ge B^{-1},
\quad 1\le\epsilon k^2\le4,\quad L_s\ge1.
\]

여기서 S=ell²이다. n은 고정 slow 좌표에서 v의 affine 함수이므로 n의 2차 이상 v 미분은 정확히 0이다. 원래 source norm의 primitive 유도는 `actual-covariance-operator-bounds.mjs`의 `primitiveDerivation`과 `actualOperatorPowerAudit`에 있다. 큰 양수 척도는 실수 expression graph로 보존하고 binary64의 0으로 바꾸지 않는다.

## 3. 안정한 normalized Volterra 계

원래 source는

\[
t(v)=B_{frame}(v)P(v)w(v),\qquad
P(v)=\exp\!\left[\int_{L_s/2}^{v}(\lambda-d_{ref})(u)\,du\right]
\]

를 사용한다. 실제 방정식의 moving-frame 행렬은 정확히

\[
M=\begin{pmatrix}0&0\\0&-2\lambda\end{pmatrix}
+E_{actual}-(d-d_{ref})I,
\quad\lambda>0.
\]

source bounds의 `E=Ed=B^256`에서 각 error entry는 E/S, damping error는 Ed/S 이하이다. 무한 norm의 logarithmic norm은 각 행에서 대각 원소와 비대각 절댓값의 합을 취하므로

\[
\mu_\infty(M)\le(2E+E_d)/S.
\]

둘째 행의 −2λ는 음수이므로 이 상계에서 버릴 수 있다. 실제 interval 길이는 `Lmin*S≤Ls≤Lmax*S`, `Lmin=2r0`, `Lmax=2r0*Tg`이다. 따라서 전체 해와 propagator는

\[
\|w(v)\|_\infty\le W:=e^{(2E+E_d)L_{max}}
\]

로 감싸진다. W는 band와 slow point에 무관한 양수 source 식이다. k나 Ls의 큰 행렬 절댓값을 그대로 Gronwall 지수에 넣지 않는다. 전체 Volterra limit을 쓰며 finite partial sum을 exact solution으로 선언하지 않는다.

각 sign의 source 검사는 실제 projected-error 항등식 네 개, stable matrix 항등식 네 개, P의 원래 integrand·midpoint·upper endpoint·FTC 네 개를 확인한다.

## 4. 원래 pulse의 실제 v 도함수

`actual-pulse-gaussian-power-kernel.mjs`는 n, normalized tangent frame, pressure projection, J, Bframe, Bleft, Bframe′, M, λ−dref의 모든 필요한 v 미분 상수를 순서대로 만든다. 절댓값 상계에서만 부호를 버리며, 나눗셈의 양수 하계와 모든 binomial 계수를 유지한다.

\[
w^{(m+1)}=\sum_{j=0}^{m}\binom mj M^{(j)}w^{(m-j)},
\qquad
P^{(m+1)}=\sum_{j=0}^{m}\binom mj(\lambda-d_{ref})^{(j)}P^{(m-j)}.
\]

그 뒤 실제 `t=Bframe*P*w`에 Leibniz를 적용한다. 이번 2차 source 실행에서 계산된 exponent는 다음과 같다.

| 상계 `B^p`의 p | 0차 | 1차 | 2차 |
|---|---:|---:|---:|
| M의 행렬 norm | 50 | 77 | 104 |
| Bframe의 행렬 norm | 14 | 38 | 64 |
| w/W | 0 | 50 | 101 |
| P^(j)/P | 0 | 7 | 15 |
| t^(j)/(W P) | 14 | 66 | 119 |

즉 `||D_v^j t||≤B^{p_j} W P`, `p=(14,66,119)`이다. ledger는 요청한 임의 유한 차수의 recurrence를 가지며 명시한 arithmetic resource budget을 넘으면 결과를 중단한다. 17차 generic 검사와 실제 source 2차 실행은 서로 다른 범위이다.

## 5. cutoff 잔차를 전부 유지한 Gaussian 추정

원래 cutoff는

\[
\psi(v)=\sigma_2(20v/L_s-4)\sigma_2(16-20v/L_s).
\]

support는 `[Ls/5,4Ls/5]`, plateau는 `[Ls/4,3Ls/4]`이다. 원문 (7.40)의 잔차

\[
(1-\psi)f+\psi't
\]

에서 현재 homogeneous source는 f=0이므로 첫 항만 정확히 0이다. 두 번째 항은 유지한다. 모든 m에서

\[
D_v^m[(1-\psi)f+\psi't]
=\sum_{j=0}^m\binom mj\left[D_v^j(1-\psi)f^{(m-j)}
+\psi^{(j+1)}t^{(m-j)}\right].
\]

독립 generic 검사는 비영 f와 rational/full-Volterra t에서도 이 식과 ψ의 마지막 미분항을 빠뜨린 음성 대조를 확인한다.

실제 t의 큰 본문은 명시적 공유 함수로 보관한다. 모든 free coordinate를 매개변수에 포함하고, 각 shared v jet를 **다시 materialize하여 원래 t를 직접 미분한 본문과 같은 node인지 확인**한다. 공유 함수는 미지 oracle이나 caller jet가 아니다. Leibniz 비교를 공유 상태에서 한 뒤 원래 도함수의 본문을 보존하므로 큰 denominator의 불필요한 전개를 피할 수 있다.

`s_ref=±u(1/2+v/Ls)`, u≥2이고

\[
\rho=\lambda-d_{ref}
=\frac{\lambda_0}{\sqrt{1+s_{ref}^2}}
-\frac{\lambda_0(1+s_{ref}^2)}{(1+u^2)^{3/2}}.
\]

ρ(Ls/2)=0이며, `u²/(1+u²)^(3/2)≥1/(2u)`에서

\[
\rho'(v)\le-\frac{\lambda_{lower}}{2uL_s},
\qquad \log P(v)\le-\frac{\lambda_{lower}}{4uL_s}(v-L_s/2)^2.
\]

여기서 `lambdaLower=Renv^-31>0`이다. 잔차의 모든 미분항은 양의 차수 ψ 미분을 포함하므로 `|v−Ls/2|≥Ls/4`에서만 비영일 수 있다. 따라서

\[
P(v)\le e^{-a\ell^2},\qquad
 a=\frac{r_0 R_{env}^{-31}}{32u}>0.
\]

원래 step의 상수는 `C0=1`, `Cj=1+∫_0^1(σ2^(j+1))²`로 잡는다. FTC와 Cauchy–Schwarz가 이 도함수 supremum을 감싸며, ψ의 m차 상수는 `Bm=20^m Σ_j binom(m,j) Cj C_(m-j)`이다. 따라서

\[
\|D_v^m(\psi't)\|\le
\left[\sum_{j=0}^m\binom mj B_{j+1} B^{p_{m-j}}W\right]e^{-a\ell^2}.
\]

더 작은 실제 상계의 `Ls^(-j-1)` 인자도 별도 root에 남긴다. 위 균일식에서 그 인자를 버릴 수 있는 이유는 원래 선택 조건 `Ls≥1`이다. 잔차 support는 양 끝점과 떨어져 있으므로 모든 시간 미분은 zero extension과 맞는다. bare t 자체를 시간 끝점에서 zero extension한다고 주장하지 않는다.

## 6. mesh 수와 양수 무한합 경계

원래 annulus를 지나는 mesh box에서 `|R|≤2sqrt(Xb)`, `|Z|,|T|≤2`이다. 각 정수 중심 좌표는 `|a_j|≤M_j ell^6+3/4`를 만족한다. 따라서 band별 두 sign을 포함한 개수는

\[
2(4\sqrt{X_b}+3)\cdot7\cdot7\,\ell^{18}
\]

이하이다. 한 점에서는 원래 한 차원 bump의 strict support 폭이 3/2이므로 양수 중심이 최대 둘이다. band 한 축과 mesh 세 축에서 β label은 최대 16개이며 두 sign을 포함하면 32개이다. 원래 81개 local 후보를 81개의 독립 pulse 실행으로 세지 않는다.

`q∈[2^(-ell-1),2^(-ell+1)]`, a>0, b,p,N≥0일 때

\[
\ell^b2^{p\ell}e^{-a\ell^2}
\le C_N q^N e^{-a\ell^2/2},\quad
C_N=2^N\exp\frac{[b+(p+N)\log2]^2}{2a}.
\]

이는 log ell≤ell과 완성 제곱 부등식으로부터 나온다. 정수 J≥1에 대한 전체 band 합은

\[
\sum_{\ell\ge J}\ell^b2^{p\ell}e^{-a\ell^2}
\le\exp\frac{(b+p\log2)^2}{2a}\,
\frac{e^{-aJ^2/2}}{1-e^{-a(2J+1)/2}}.
\]

이 tail은 양수이며 0으로 바꾸지 않는다. N은 상수만 바꾸고 원래 작은 q threshold는 바꾸지 않는다. 이 계산만으로 모든 label 진폭의 source authentication이 생기지 않는다. 실제 sqrt weight 및 물리 미분을 곱한 경우에는 그 추가 상계를 먼저 연결해야 한다.

## 7. 실제 실행과 보존한 실패

| 실행 | 결과 | 관측 시간·메모리 |
|---|---|---|
| scalar cutoff/Leibniz/flat kernel attempt3 | 7/7 PASS, exit 0 | 0.923초, 107,253,760 bytes |
| fast derivative power kernel attempt5 | 4/4 PASS, exit 0 | 0.283초, 69,525,504 bytes |
| actual source attempt3 | 8/8 PASS, 내부 source check 12개, exit 0 | 33.617초, 2,319,081,472 bytes |

최종 source graph는 `e6c442d56c029fdf12ee873a94a9542d445b0c3e059efb438689442dd6c4c73a`, 237,138 nodes, canonical 9,538,575 bytes이다. 원래 private source graph는 `8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a`이다. 실행 전후 58개 기존 import와 새 모듈의 byte가 일치했다.

source attempt1·2는 각 180초 제한으로 종료되어 완료 certificate를 만들지 못했다. attempt2에서 normalized matrix와 원래 P의 FTC까지 끝났고 첫 temporal tail 비교에서 멈춘 것을 progress log로 확인했다. 공유 본문과 원래 v jet의 exact materialization을 도입한 attempt3만 현재 성공 실행이다. timeout 후 process의 작은 RSS 값은 test supervisor 관측일 수 있으므로 전체 worker의 peak라고 사용하지 않는다.

이전 generic 실패도 삭제하지 않았다. endpoint test의 평가 규칙, retained integral fixture, over-atomized matrix 비교의 세 원인을 각각 재현·수정했다. source 수식이나 검증기의 원래 대수 규칙을 완화하지 않았다.

## 8. 현재 남은 연결

이 packet의 `actualSlowDerivativeGaussianBounds`, `allLabelAmplitudeBoundsAuthenticated`, `covarianceWeightDerivativesInTail`, `physicalPullbackDerivativeLossesIncluded`, `globalPhysicalResidualFlatness`, `wholeGN5Complete`, `wholeGNUMComplete`, `m3MayStart`는 모두 false이다. 원래 source가 다른 조건을 요구하는 f≠0 pulse나 auxiliary correction으로 결론을 자동 확대하지 않는다. 현재 공개 Worker/browser 0.3.10/v77에서 이 새 source packet을 실행했다고 기록하지 않는다.
