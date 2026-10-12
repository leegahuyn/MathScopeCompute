# N7 원본 정의역·외력 jet 재검토 — 2026-10-12

## 판정의 범위

이 검토는 Blueprint 원본 p64의 N7 8개 항목과 Navier–Stokes 원문 pp111–125, p138을 그대로 사용한다. 원문 PDF SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. 기준 JSON과 기존 M2 자료, 이미 저장된 localization/near-terminal 실행 자료는 수정하지 않았다.

새 자료는 다음 세 가지다.

- `source-localization-domain.mjs`: 같은 private common6/localization 객체에서 Lemma 9.7의 **초기 고정 조건**을 확인하고, 실제 원본 평균 보정 역연산을 실행해서 사용할 수 있는 최종 공통 정의역을 선택한다.
- `source-exterior-force-jets.mjs`: 동일한 원본 heat matching의 계수와 cutoff로 양의 반지름 외곽의 종단 외력·압력 jet을 정확한 식으로 구성한다. 전체 최종 N6 장을 대신하지 않는다.
- `source-core-restriction.mjs`: 이미 검증한 동일 source의 초기 정의역·고정 support·실제 core와 tail을 결합하고, 원래 보정 연산자의 열린 core 지지 귀납을 새로 실행한다. 최종 국소화 장의 **core 제한**을 실제 기록된 세 성분과 식별한다. 비영 N6 장의 전체 수치 구성이나 새 Lean 증명이 아니다.

외곽 계산의 유한 차수 기본값은 `j=0,1,2,3,4`이며 최대 12차까지 같은 정수 다항식 생성기를 사용할 수 있다. 유한 차수를 계산한 사실을 전역 모든 차수의 force extension이나 원점의 완전한 flatness 인증으로 바꾸지 않는다.

실행 상태: 2026-10-12 13:29:14 UTC에 별도 `source-exterior-force-jets-20261012/attempt2`가 **11/11 Node 검사와 52/52 독립 exact Fraction 검사를 통과**했다. 101개 dependency의 실행 전후 바이트가 모두 일치했고, 전체 실행은 456.43초, Node의 최대 RSS는 3,995,627,520바이트였다. 원문 Lemma 9.7과 Proposition 9.9에 대한 N6 담당자의 독립 검토도 초기 고정 조건과 정확한 1/64·1/4 정의역 여유를 확인했다. 원본 기준 완료 여부의 변경 권한은 상위 통합 assessment에 있다.

이전 `attempt1`은 10/11 통과 후 **FAIL로 보존**한다. 정의역·외력·압력 식과 private 변경 방지 검사는 통과했지만 새 exterior certificate에서 `parameterExpressionSHA256` 메타데이터가 누락된 것을 첫 source 검사가 잡았다. 원래 private source는 바뀌지 않았고 101개 dependency 바이트가 모두 일치했다. 전체 원본 `sourceBinding`을 상속하도록 수정한 뒤 새 폴더에서 전체 원본 생성기를 다시 실행한 것이 성공한 `attempt2`이다.

## N7-01: 원래 합격 문구와 정확히 맞는 범위

Blueprint p64는 다음 작업과 합격 조건을 요구한다.

> q≤C0(τ+|z|^(1/D))로 support를 q<q*/2 안에 놓고 c=χxχt를 선택한다. χx는 r²,z에 smooth하게 둔다. 합격: u=p=0인 초기 시간 구간과 고정 compact K가 존재한다. t가 1에 가까울 때 원점 근방에서 cutoff가 정확히 1이어야 한다.

이 항목의 대상은 cutoff 선택, 실제 source 정의역 안의 지지, 초기 영 구간과 unit plateau이다. 비영 최종 속도·압력의 수치 값이나 전체 force residual을 요구하는 다음 항목과 혼동하지 않는다. 그렇더라도 임의로 선택한 작은 숫자를 최종 source의 q*라고 부를 수는 없다. 다음과 같이 **동일한 source의 초기 조건에서 허용되는 qbig을 선택하는 연결**이 필요하다.

### 공통 정의역의 source 의존 관계

| 원문 조건 | 실제 사용한 source 근거 | 범위 |
|---|---|---|
| 고정 배경장과 pulse 추정, Lemma 9.7 p111 | authenticated common6의 완전한 배경장 norm, 원본 common selector, `thresholdFromOriginal`의 모든 concentration 조건 | 일부 표시 점의 가정을 대신 사용하지 않는다. |
| 고정된 양의 \(|n_\Phi|\) 하한 | 같은 common6 `primitiveProof`의 \(|n_{\mathrm{tangent}}|\ge B^{-2}>0\), 완전한 normal/frame 계수, 원래 pressure 항과 frame derivative | 원본 인수와 원래 parameter DAG를 유지한다. |
| fundamental pulse 추정 | 실제 \(B^{256}/S\) operator/damping/frame/slope 오차 및 고정된 logarithmic-norm/forward-propagator bound | Lemma 9.7 p111의 (7.18)에 따라 다른 harmonic은 크기 ≤1인 forward damping 인자만 더한다. |
| 원래 primary covariance와 signed 분모 | 같은 source의 determinant lower bound, positive target/weight 및 Gaussian endpoint factor | signed update의 분모는 새 누적값이 아니라 원래 \(2\sqrt{y_\sigma}\)이다. |
| 고정 mean-correction profile 지지와 역행렬 | 실제 실행한 `sourceMeanMomentBridge`: 원래 Imean power law, 양의 원본 λ, 다섯 양의 moment, 분리된 angular determinant 및 factored axial gap | 임의 target을 현재 P/J로 받지 않는다. 이 실행은 역연산의 고정 의존 조건만 확인한다. |
| 나머지 pressure, temporal inverse, radial maps | Lemma 9.7 p112가 이들을 고정 계수의 선형 map으로 명시한다. | 뒤의 source 크기나 단계별 미분 상수가 커져도 새로운 q-threshold를 요구하지 않는다. 해당 map 전체 구현이 완료되었다는 뜻은 아니다. |

공통 source의 threshold는 모든 concentration 조건에 더하여 \(B^{512}\), \(R_{\mathrm{env}}^{1024}\), \((64/h)^2\)를 포함한다. 코드가 선택한 정수는

\[
\ell_{\min}=\left\lceil\max(8,S_{\min},(64/h)^2)\right\rceil,
\qquad \ell_0=\ell_{\min}+6.
\]

공통 source threshold와 localization에 사용한 더 작은 정의역은 각각

\[
q_{\mathrm{common}}=2^{-(\ell_{\min}+4)},\qquad
q_{\mathrm{big}}=2^{-(\ell_0+4)}
=q_{\mathrm{common}}/64.
\]

원문 Lemma 9.7 pp111–112는 **초기에** 위 고정 pulse/배경장/primary covariance/mean support 조건으로 qbig을 정한 뒤 모든 유한 단계가 그 정의역을 유지함을 설명한다. Proposition 9.9 p114는 최종 summation에서 `q*=qbig`을 사용한다고 명시한다. 따라서 위 source 조건으로 선택한 더 작은 qbig을 사용할 수 있다. 값이 주어지지 않은 과거 Γ와 수치 비교하는 문제가 아니다. 새로운 독립 Lean 증명으로 표시하지 않으며, 원문의 정리를 실행된 동일 source 조건에 적용한 것으로 표시한다.

고정 mean profile의 지지도 별도의 q-dependent 가정이 아니다. 원본 지원 구간은

\[
1<\log(X/X_{0,\mathrm{Imean}})
<1+4/5+2\log(11/10)<2<5.
\]

여기서 \(\log(1+x)<x\)로 엄밀한 유리수 여유를 얻는다. λ는 원래의 `exp(-1000*T)>0`을 유지한다. 따라서 axial gap \(1-e^{-2\lambda/5}>0\)을 이진 부동소수점의 0으로 대체하지 않는다. 역행렬의 단계별 미분 상수는 크더라도 고정된 양수이며 qbig의 추가 축소 조건이 아니다.

### 실제 cutoff 결론

같은 source의 \(D=1/2-h\in(1/4,1/2)\)에서 원문의 두 경우 나눔은

\[
q\le4(\tau+|z|^{1/D})
\]

를 준다. 기존 코드가 실제 선택한 값은 \(\tau_0=q_{\mathrm{big}}/32\), \(z_0=\tau_0^D\), \(r_0=1\)이며,

\[
4(\tau_0+z_0^{1/D})=q_{\mathrm{big}}/4<q_{\mathrm{big}}/2.
\]

`source-localization-domain.mjs`는 이 1/4 support ratio와 1/4 strict gap을 정확한 유리수 식으로 검사한다. 기존 Cartesian cutoff는

\[
c=\chi(2(x_1^2+x_2^2)/r_0^2)
\chi(2x_3^2/z_0^2)\chi((1-t)/\tau_0)
\]

이며 \(\chi=1\) on \(( -\infty,1/2]\), \(\chi=0\) on \([1,\infty)\)이다. 원점 축에서도 Cartesian smoothness를 유지한다. `curl(c*A)+c*B_e_theta`, `c*p_loc`라는 **같은 source field operand의 전체 operator**와 실제 영 확장 정의가 보존된다. 정의역 밖의 미정 field 값을 0과 곱해 평가하지 않는다.

- 초기 영 구간: \(0\le t\le1-\tau_0\).
- 고정 compact K: \(r^2\le r_0^2/2\), \(z^2\le z_0^2/2\).
- unit plateau: \(r\le r_0/2\), \(|z|\le z_0/2\), \(0<\tau\le\tau_0/2\).

실행 gate와 독립 검토를 통과한 이 증거는 N7-01의 원래 cutoff 조건을 닫는 근거를 제공한다. 최종 N6의 비영 A/B/p, 전체 force 또는 전체 에너지까지 완료했다는 결론은 따라오지 않는다.

## N7-07과 N8-04: 열린 core에서 원래 최종 장의 제한을 식별

Blueprint p64의 N7-07은 \(X_{\mathrm{in}}=X_a/2\), \(\eta=0\)의 원래 경로에서 양의 \(e_0\) 하한과 명시적 remainder를 요구한다. Blueprint p66의 N8-04는 양의 \(\tau\), \(s=-\log\tau\), 정규화한 세 속도 성분과 이후의 물리 배율, 지정 소수 입력 및 더 작은 입력의 precision 재현을 요구한다. 두 항목 모두 이 경로를 식별하기 위해 경로 밖의 비영 N6 값을 전부 나열하라고 요구하지는 않는다. 따라서 원래 연산자의 지지 성질을 실제 source에 묶어서 증명하면 되는 부분을 전체 수치 구성이 없다는 이유만으로 보류하지 않는다.

새 proof는 실제 source DAG에서 \(X_a=4/\Lambda\), \(X_{\mathrm{in}}=2/\Lambda=X_a/2\)를 정확한 유리함수 항등식으로 확인한다. 모든 보정에 공통으로

\[
X_a/4<X<3X_a/4<X_a
\]

라는 열린 collar를 사용한다. 원래 평균 보정의 다섯 profile과 potential hull은 더 바깥의 \(I_{\mathrm{mean}}\) 안에 있다. 실제 17개 parameter 정의와 9개 정수 부호·순서 검사는

\[
0<X_a<1<X_R<X_{0,\mathrm{Imean}}<X_{0,\mathrm{Imean}}e
\]

를 준다. \(X_{0,\mathrm{Imean}}=X_R\exp(60001T-6)\), \(T>11\), \(X_R>110\)을 사용하므로 미정 support 크기를 새 숫자로 정하지 않는다.

### 검사한 원래 연산자와 누락 방지

| 연산자 | 열린 core에서 0이 유지되는 이유 | 유지한 항·음성 검사 |
|---|---|---|
| primary wave와 full curl | 원래 \(X_a<X<X_b\)의 smooth zero extension을 body 평가 전에 선택한다. | shell 밖의 inverse·square root·pulse body를 먼저 평가하지 않는다. |
| 비선형 residual increment | \(R(u+\delta u,p+\delta p)-R(u,p)\)를 Cartesian 미분 다항식으로 전개하면 모든 항이 보정 또는 그 미분을 포함한다. | 원래 base flat residual \(R(u,p)\)은 별도로 보존한다. 0이라고 가정하지 않으며 \(\delta u\cdot\nabla\delta u\)도 삭제하지 않는다. |
| pulse inverse | 원래 전진 ODE는 모든 느린 좌표와 transverse 좌표를 고정하고 초기값이 0이다. 전체 경로의 source가 0이면 해도 0이다. | 느린 좌표 고정 또는 zero initial data를 제거하면 실패한다. |
| signed correction | 원래 양의 primary 분모로 shell 내부에서만 나눈 뒤 원래 zero extension을 적용한다. | 밖에서 0/0을 평가하거나 새 누적 amplitude를 분모로 사용하는 대체는 허용하지 않는다. |
| pressure·meridional·stress의 \(I_c\) | 물리 \((z,t)\)를 고정하면 q는 r과 독립이다. \(0\le r'\le r\)의 전체 전진 경로에서 \(X'\le X<X_a\)이고, 모든 shifted Y에서 source가 0이다. | \(I_c g=I g-\chi_m Jg\)의 **전체** \(Jg\)를 미정·비영 가능 항으로 보존한다. \(I g=0\), \(\chi_m=0\)에서만 결과 0을 얻는다. |
| temporal inverse | 역연산은 Y의 Fourier 계수에만 작용하고 R/Z/T를 고정한다. 모든 Fourier 계수가 0이고 원래 zero Haar mode도 0이다. | 공간 inverse, 임의 homogeneous constant, 유한 Fourier cutoff를 무한 inverse로 바꾸는 조작을 거부한다. |
| 다섯 moment 보정 | 현재 P/J가 비영이어도 그 계수와 \(I_{\mathrm{mean}}\) 안의 고정 profile/potential을 곱한 항은 core에서 0이다. | global moment 자체를 0으로 버리는 증명은 거부한다. |
| 최종 potential cutoff와 합 | 모든 단계의 A와 미분이 같은 열린 collar에서 0이다. \(\operatorname{curl}(\chi A)=\chi\operatorname{curl}A+\nabla\chi\times A\)의 모든 항이 0이다. | 각 성분의 네 항을 미분 다항식으로 확인한다. commutator 누락, 단계별로 공통 collar를 잃는 조작을 거부한다. |

이것은 원문의 Definitions 6.4–6.5/Proposition 6.6(pp69–71), Propositions 7.2/7.6(pp77–78,84–85), (8.3)–(8.14)(pp89–93), Lemmas 8.6–8.7(pp95–98), Propositions 9.3/9.5/9.6/9.9(pp103–116)의 **원래 연산자 정의와 유한 구성/realization 정리**를 같은 실행 source에 적용한 support induction이다. 각 미정 계수의 크기나 shell 경계의 모든 도함수 bound를 새로 계산한 증명은 아니다. 선택한 collar는 경계에서 엄밀히 떨어져 있고, 모든 유한 partial sum이 그 같은 열린 집합에서 항등적으로 0이므로 원래 realization의 제한도 0이다. 다른 곳에서의 global convergence 또는 비영 field 수치를 계산했다는 뜻은 아니다.

### 양의 선도항과 모든 더 작은 시간의 명시 하한

기존 actual inner gate에서 다시 계산한 \(\Phi(2,0)\)의 유리수 포함 구간은 엄밀히 \(1/2\)보다 크다. 새 proof는 같은 양의 scale과 모든 차수 tail을 그대로 사용한다.

\[
e_{\mathrm{scale}}=\frac{2}{C_{\mathrm{Selected}}\sqrt\Lambda},\qquad
e_0=e_{\mathrm{scale}}\Phi(2,0)
>e_{\mathrm{lower}}=\frac{1}{C_{\mathrm{Selected}}\sqrt\Lambda}>0,
\]

\[
|\tau^A u_\theta-e_0|\le C\tau^{2h},\qquad A=\tfrac12+h>0.
\]

C는 같은 원래 cutoff sequence의 실제 n=1,2 계수와 n≥3의 무한 tail을 모두 포함한다. \(h>0\)을 기계 부동소수점의 0으로 바꾸지 않는다. 같은 source에서 실제 선택한 depth 0의 시간은

\[
\tau_*={\rm plateau}\,
\exp\!\left[-\frac{\log(1+4C/e_{\mathrm{scale}})}{2h}\right]>0.
\]

독립 exact 검사는 source DAG의 plateau, logarithm과 이 동일한 tau root를 직접 다시 확인한다. \(0<\mathrm{plateau}<1\)이고

\[
\frac{e_{\mathrm{scale}}}{4}
-\frac{C}{1+4C/e_{\mathrm{scale}}}
=\frac{e_{\mathrm{scale}}^2}{4(e_{\mathrm{scale}}+4C)}>0
\]

이므로 **모든** \(0<\tau\le\tau_*\)에서

\[
C\tau^{2h}<e_{\mathrm{scale}}/4=e_{\mathrm{lower}}/2,
\quad
u_\theta(x_\tau,1-\tau)\ge(e_{\mathrm{lower}}/2)\tau^{-A}.
\]

이것이 \(\tau\downarrow0\)의 analytic growth certificate이다. 저장된 다섯 막대나 유한 plot 증가를 무한대의 증명으로 사용하지 않는다. 원래 cutoff는 이 경로의 모든 더 작은 시간에서 정확히 1이고 그 미분은 0이다.

N8의 같은 source record도 새 private core proof와 source binding/qStar/Xin/Y/eta 및 모든 component row의 plateau를 대조한다. 반지름 성분의 3h tail, 나머지 두 성분의 2h tail과 서로 다른 실제 물리 배율을 유지한다. 원래 요청된 10^-2,10^-4,10^-8,10^-12 및 10^-40,10^-1000은 이 극도로 작은 원래 tau0보다 크므로 **원래 초기 영 확장**의 정확한 값 0을 표시한다. source domain 밖의 미정 field를 0으로 채운 것이 아니다. 더 작은 active source 시간은 정확한 양의 수식으로 계산되며 표시 t가 1이어도 내부 tau를 표시값에서 복원하지 않는다.

### 관측된 proof gate와 보존 범위

`evidence/source-core-restriction-20261012/attempt1/`의 새 경량 gate는 2026-10-12 13:57:31 UTC에 **16/16 Node 검사, 41/41 독립 exact 검사**를 통과했다. 156개 파일의 실행 전후 바이트가 동일하며 원래 inner/domain/near-terminal archive builder가 전체 원본 dependency와 artifact를 전후로 재검증했다. 실제 gate는 6.687초였다. `freshSourceConstructorExecuted:false`, `newSupportProofExecuted:true`, `newLeanExecuted:false`를 구분한다. N6 담당자의 별도 원문/code 검토도 위 support 결론을 승인했다.

| 새 자료 | SHA-256 |
|---|---|
| 관측 `receipt.json` | `7c344632700bc9f168bfc5a8b722864e9416fbfc42cff2ad2c042e7c923928b5` |
| 전체 `core-restriction.json` | `a669b4bad5cde239954f445a131f4d967f090a252fe1ae4cd5d047df7eb6d4f5` |
| canonical proof 내용 | `19f0b3976e9a616372ea6f515c0cdeefcc65946a2afb48e69cd4cf1898d25839` |

`tests/build-core-restriction-evidence.py`는 고정 receipt/artifact/proof SHA와 156개 source 바이트, raw TAP, 41개 independent 결과를 확인한다. 생성된 64,384바이트 archive의 파일 SHA는 `9cc243fa5faca656591a924443a93a4d9b572a644e27b19793cc343afc4d0537`이다. 원래 기록의 conditional flag는 그 역사적 실행 당시 상태로 그대로 남겨 두고, 새 식별 근거를 별도로 붙였다. 이 증거는 N7-07과 N8-04의 원래 제한 경로 조건을 닫는 근거를 제공한다. 총개수/완료 표시의 변경은 상위 assessment만 수행한다.

## 실제 외곽 외력과 압력 jet

원문 p119 (10.7), p138 (A.32)–(A.35)의 heat field는

\[
K(r,\tau)=c_\infty s^{-A}H(2\tau/s),\qquad s=r^2/2,
\]

이다. 새 코드는 표시용 진폭을 선택하지 않는다. 실제 M2 heat matching의 `exteriorAmplitude`에서 \(c_\infty=\sqrt2\,\mathrm{exteriorAmplitude}\)를 취한다. `heat.Xb`와 같은 실제 외곽 시작점을 유지한다. 최종 N6의 모든 annular term이 사라지는 field 식별은 원문 Proposition 9.9와 Theorem 3.1의 별도 의존성으로 남는다.

\[
P_j(h)=(h)_j(1+h)_j,\quad
D_j(h)=\sum_{k=0}^j\binom jkP_k(h)P_{j-k}(h),
\]

\[
K_j=\partial_t^jK(r,0)=c_\infty2^jP_j(h)s^{-A-j},\quad
S_j=\partial_t^j(K^2)(r,0)=c_\infty^22^jD_j(h)s^{-2A-j}.
\]

이것은 \(\partial_t=-\partial_\tau\)와 (A.35)의 부호를 모두 유지한 식이다. 정수 다항식 계수로 만들기 때문에 극도로 작은 양의 h가 0으로 사라지지 않는다. \(n=2A+j>0\)라 두면 반지름 무한대에서 0인 압력은

\[
p_j=-\int_r^\infty S_j(\rho)\frac{d\rho}{\rho}
=-\frac{S_j(r)}{2n}.
\]

무한 적분 꼬리를 유한 반지름으로 잘라내지 않았다. z=0 부근의 axial/time cutoff plateau에서 radial cutoff를 c라고 쓰면

\[
F_{r,j}=c_rp_j+c(1-c)S_j/r,\qquad
F_{\theta,j}=-2c_r\partial_rK_j-(c_{rr}+c_r/r)K_j,
\qquad F_{z,j}=0.
\]

원래 cutoff의 중간점 \(r^2=3/8\)에서는 \(c=1/2\), \(c_r=-16r\), \(\Delta c=-32\)를 정확하게 계산한다. 결과는

\[
\frac{F_{r,j}}{S_j/r}=\frac14+\frac3n>0,
\qquad\frac{F_{\theta,j}}{K_j}=-64(h+j)<0,
\]

\[
\frac{\operatorname{div}F_j}{S_j}
=\frac{16}{n}-16-\frac43n<0.
\]

따라서 source force의 nonzero divergence를 실제 식으로 얻는다. `div f != 0`을 오류로 만들지 않으며 Leray projection으로 force를 바꾸지 않는다. 동시에

\[
\Delta(cp_j)+\partial_i\partial_k[\partial_t^j(u_i u_k)]
=\operatorname{div}F_j
\]

를 source expression 대수와 독립 exact Fraction 검사로 확인한다. pressure 부호, cutoff pressure 항, cylindrical Laplacian 항을 제거한 경우에는 검사가 실패한다.

## 8개 N7 항목의 정확한 잔여 의무

| 항목 | 현재 실제 source 증거 | 남은 작업과 판정 |
|---|---|---|
| N7-01 시간·공간 cutoff | 실제 source cutoff/미분/operator/영 구간/K/plateau. 새 고정 초기 조건 → qbig → 최종 q* 연결. 원본 gate 11/11, exact Fraction 52/52 및 원문 독립 검토 통과. | 원래 항목의 cutoff 조건을 닫는 근거가 준비되었다. 전체 N6 값은 이 항목의 추가 요구가 아니다. 완료 표시와 총개수의 변경은 상위 assessment에서만 한다. |
| N7-02 localization 교차항 | `curl(cA)`의 모든 일차 product 항이 보존됨. 실제 heat 외곽에서 전체 force의 cutoff 항과 zero uncut residual을 계산함. | 실제 최종 A/B/p의 전체 비영 영역에서 직접 PDE residual과 cutoff 전 residual+모든 commutator의 일치를 실행해야 한다. 외곽 제한 계산은 그 전체 검사를 대신하지 않는다. |
| N7-03 force 발산/압력 | 동일 원본 heat 외곽에서 엄밀히 nonzero div f와 pressure Poisson 관계를 계산함. 압력 normalization과 cutoff 누락을 거부함. | 아직 구성되지 않은 최종 전체 field의 pressure/force 계약까지 검증할 수 없다. 원래 pressure와 compact support를 보존한 전체 source 검사를 남긴다. |
| N7-04 terminal force jets | j=0…4의 실제 heat 외곽 종단 force/pressure 식, 양의 반지름에서의 정확한 적분 꼬리와 미분, 유한 차수/모든 차수의 scope 분리. | K 전체의 Fj 및 공간 미분 호환성, 원점의 모든 차수 flatness, 전체 N6 residual과의 동일성 및 전역 endpoint bound가 필요하다. 원문의 정리 의존성을 finite difference 실험으로 바꾸지 않는다. |
| N7-05 t>1 force extension | (10.11)–(10.12)의 정확한 의존 사항을 별도로 유지함. 외곽 jet만으로 전역 Fj를 대체하지 않음. | 실제 전역 Fj의 C^a norm과 cutoff derivative bound로 증가 정수 bj를 선택하고 differentiated tail을 인증해야 한다. t≤2 compact support와 인증된 jet 접합을 확인해야 한다. velocity의 t=1 이후 연장이 아니다. |
| N7-06 전체 K 에너지 | 정확한 초기 영 확장에서 전체 K의 energy/dissipation/forcing work는 0. | 활성 시간대의 전체 K에서 E, dissipation, forcing work를 적분하고 독립 공간·시간 refinement에서 정규화 defect 감소를 보여야 한다. 0인 초기 구간이나 core/periodic 예제는 이를 대신하지 않는다. ν=1의 (10.13) 상계와도 비교해야 한다. |
| N7-07 실제 blowup 경로 | 실제 common6 core의 양의 선도항, 원래 모든 차수 cutoff tail에서 유도한 명시 remainder, 정확한 active tau와 unit plateau. 새 source support induction은 같은 최종 localized core restriction을 식별하고 모든 0<τ≤τ*의 explicit 성장 하한을 준다. | 16/16 Node·41/41 independent exact 및 독립 N6 검토가 원래 경로 조건을 닫는 근거를 제공한다. 비영 전체 field 값이나 whole-K energy의 완료를 주장하지 않는다. 상태 변경은 상위 assessment에서 수행한다. |
| N7-08 비교/주기화/ν | 기존 source periodization의 원래 unit torus, ν와 support shrink, strict disjoint translate margin 및 pressure/force scaling. | 최종 whole-field의 same data/force, 전체 energy, periodic pressure를 원문 결론에 함께 연결해야 한다. 겹치는 복사본의 비선형 교차항을 무시할 수 없다. |

이 중 N7-04/05/06의 미완료는 전체 source 입력과 전역 정량 bound의 재구성이 남았다는 뜻이다. 존재 정리의 서술을 다시 쓰거나 기준 제목을 바꾸는 것으로 닫을 수 없다. RH/BSD/continuum gauge의 미해결 문제 추적 기능과 달리, 이 N7 항목들은 원문에 명시된 source 계산·적분·오차 인증을 실제로 제공해야 한다.

## 검증과 실패 기록

빠른 kernel 검사 6개는 완료되었다. 독립 Gamma ratio, 원래 cutoff의 flat seam과 중간점 도함수, 정확한 radial/pressure/Poisson 식, 틀린 pressure 부호 및 gauge, 삭제한 cutoff/cylindrical 항, private source 권한 위조 거부를 포함한다.

원본 생성기 gate는 `tests/run-exterior-force-jets.py`가 새 attempt 폴더에서 실행한다. 전체 import closure의 실행 전/후 SHA-256, 원시 Node 출력, 관측 RSS/address-space, 별도 Fraction 결과와 두 source certificate를 보존한다. 실패하면 그 attempt도 보존하며, 실패한 자료를 통과한 실행처럼 재표시하지 않는다.

기존 `source-localization.mjs`, `source-periodization.mjs`, M2 구현과 이미 저장된 source receipt의 바이트는 이 작업에서 수정하지 않았다. 새 domain bridge는 기존 보수적인 scope 표시를 원래 파일 안에서 조용히 덮어쓰지 않고, 날짜가 있는 별도 근거로 제공한다.

### 성공한 원본 실행과 브라우저 기록

성공한 원본 실행의 자료는 `evidence/source-exterior-force-jets-20261012/attempt2/`에 있다.

| 자료 | SHA-256 | 의미 |
|---|---|---|
| `receipt.json` | `90300bc80176119ab93e1613aeb7071702f7724244f14eb21e8078c18129a0c7` | 11개 통과, 0개 실패/skip, 101개 source 불변, 52개 독립 검사 통과의 관측 기록 |
| `source-domain.json` | `1350acb65cae056f094e8d90dd557d0b44d1c5f51d55149b2aa1089f9ed2ae5c` | 5개 초기 고정 조건, 실제 mean-map 실행, 12개 같은 source 정의역 검사 |
| `exterior-force-jets.json` | `c02ef50a4dd56571b2c8a63cc8f18185386516970b529c6f4a07a0847ac980da` | 전체 inherited scalar DAG와 실제 외곽 jet의 새 scalar root를 모두 포함하는 3,652,495바이트 원본 |
| `independent-fraction.json` | `d994106c183472f26633e1864f5797aa5bfc7cabd1bc1bd3c8b814d46a3b261b` | 52개의 독립 정확한 유리수·다항식 검사 및 잘못된 항을 거부하는 검사 |

`tests/build-exterior-force-evidence.py`는 성공한 attempt2의 receipt/전체 두 certificate SHA를 고정하고 모든 실행 source와 artifact 바이트를 다시 확인한다. `build(root, check=False)`로 기록을 생성하며 `build(root, check=True)` 또는 CLI `--check`는 변경 없이 정확히 같은 생성 결과인지 검사한다. `source_paths(root)`는 이 검증에 필요한 전체 파일을 제공한다. 실패한 실행으로 자동 교체하거나 source gate를 재실행한 것으로 표시하지 않는다.

생성된 `source-exterior-force-evidence-data.mjs`는 95,440바이트이며 파일 SHA-256은 `8eb4731e1838be232365bad062d15ca1e5c2d39afaefa911700636d7de0bc9d9`이다. 내부 canonical archive SHA-256은 `7dd8e216a7bdccd6cbb7b64a323d53e891560d999f87e13b92a1add2a0df5d5e`이다. 전체 수백만 바이트의 기존 scalar DAG는 중복 삽입하지 않고, 위 전체 원본 artifact의 경로·SHA와 scalar-program SHA를 연결한다.

`source-exterior-force-evidence.mjs`의 `recordedSourceN7DomainExterior({})`는 브라우저에서 canonical record를 다시 해시하고 scope와 고정 조건을 검사한다. `recordedSourceLocalizationDomain({})`는 N8이 별도로 이 정의역 근거를 소비하도록 제공한다. 둘 다 `recordedOnly:true`, `freshSourceConstructorExecuted:false`이며 전체 최종 field/force/활성 K 에너지/전역 force extension 완료는 false이다. `sourceExteriorForceObservations(result)`는 변경되지 않은 private 검증 결과만 받아 정확한 정의역 비와 5개 normalized jet을 제공한다. 임의 속도 곡선이나 미정 전체 field 값은 생성하지 않는다.

브라우저 consumer 검사 3/3과 archive `--check`도 통과했다. 기록 변조, 초기 고정 조건 삭제, 입력으로 qStar/h/force를 바꾸려는 시도, 검증 후 발산 부호를 바꾼 객체는 거부한다.
