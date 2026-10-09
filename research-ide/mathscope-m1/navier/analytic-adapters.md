# NS 해석 계약과 실제 Lean 어댑터

각 정리의 타입이 증명하는 범위와 수치 배열이 제공하지 않는 가정을 분리한다. 전체 증명 의존성은 `formal-adapters.json`과 `evidence/lean-validation.json`의 `target`, `type`, `axioms`, source/log hash를 확인한다. 현재 로컬13개 target은 커널을 통과했으며 추가된 사용자 공리나 `sorry`는 없다.

## 1. Bρ의 완비성과 nonlinear axis convergence

원문 p.145 식 (B.4)는 `F(Y,η)=Σα Fα(η)Y^α`에 대해

\[
a_{\alpha\beta}=\frac{20^{-\alpha}\rho^{-\beta}\beta!
\binom{\alpha+\beta}{\beta}}{(\alpha+1)^2(\beta+1)^2},\qquad
\|F\|_\rho=\sup_{\alpha,\beta\ge0}\sup_{\eta\in I}
\frac{|\partial_\eta^\beta F_\alpha(\eta)|}{a_{\alpha\beta}}
\]

를 정의한다. 여기서 β는 η에 대한 **실제 도함수 차수**이며 코드의 η-Taylor coefficient를 그대로 raw derivative로 읽으면 안 된다. 코드 jet의 β번째 항은 β!로 나누어진 coefficient다. `analytic-contracts.json`의 coefficient-index 표기는 이 derivative-weighted norm을 가리킨다.

Bρ는 이 norm이 유한한 smooth coefficient sequence로 구성된다. 완비성 논증에는 모든 고정 (α,β)의 uniform convergence, 연속한 derivative order 사이에서 limit를 derivative로 식별하는 정리가 필요하다. 복소 Ω는 초기 자료의 holomorphy와 Cauchy derivative bounds를 확보하는 별도 입력 조건이다. 특히 (B.16)의 `C ≥ supΩ |φ*|`는 real interval에서 `φ*/C≤1`인 것을 검사하는 것과 다르다.

원문의 nonlinear map은 Jν radial inverse와 Cauchy products를 포함한다. Actual contraction certificate는 다음을 모두 요구한다.

1. 정확히 선택한 ρ>0와 weighted Banach ball의 반경 R.
2. 모든 input coefficient와 Ω의 denominator separation.
3. 그 ball의 모든 원소에 대한 self-map bound.
4. 모든 두 원소에 대한 Lipschitz constant k<1.
5. 유한 coefficient cut 뒤의 nonlinear tail와 η/radial derivative tail.

현재 JS는 실제 nonlinear finite recursion을 계산하지만 이 다섯 조건을 증명하지 않는다. Scalar f0의 entire-series remainder나 finite residual 감소는 이를 대체하지 않는다.

## 2. Uniform derivative/limit exchange

실제 target은 `MathScope.Navier.Analytic.uniform_derivative_exchange`다. 정의역 s⊂ℝ는 open이고, fₙ,f′ₙ,g,g′는 ℝ→ℝ 함수다. 다음 가정들이 타입에 그대로 남아 있다.

- `TendstoUniformlyOn fp gp atTop s`.
- 충분히 큰 모든 n에 대해 s의 모든 x에서 `HasDerivAt (f n) (fp n x) x`.
- s의 모든 x에서 fₙ(x)가 g(x)로 수렴.

그러면 각 x∈s에서 `HasDerivAt g (gp x) x`가 따른다. 단일 격자나 몇 개 cutoff에서의 차이가 작다는 관측으로 위 모든 양화된 가정을 자동 생성하지 않는다. ℝ의 완비성과 해당 mathlib 정리의 hypotheses는 실제 import된 타입에 포함된다.

## 3. Heat 적분의 항별 미분과 finite Taylor

Z≥0,0<h<.01이고 m은 고정된 비음이 아닌 정수다. 미분된 적분 함수는

\[
\left|\partial_Z^m\{e^{-v}v^h(1+Zv)^{-h}\}\right|
\le (h)_m e^{-v}v^{h+m}
\]

으로 지배된다. 오른쪽은 `(0,∞)`에서 L¹이며 Z에 무관하다. 따라서 각 고정 m의 적분 미분과 유한 Taylor remainder를 정당화할 수 있다. 브라우저가 구현한 m은0..4다. Γ(1+h)>0 분모 조건과 quadrature/tail/rounding 손실은 interval 데이터로 전파된다.

h>0에서 coefficient ratio는 무한히 커지므로 H의 Z=0 무한 Taylor series의 radius는0이다. 코드는 finiteN마다

\[
|R_N(Z)|\le \frac{(h)_{N+1}(1+h)_{N+1}}{(N+1)!}Z^{N+1}
\]

를 사용한다. 이 계산에는 infinite-series convergence를 가정하지 않는다.

## 4. Radial primitive와 divergence 항등식

원문의 `A_X U = X⁻¹∫₀ˣ U`에는 U가 충분히 smooth하고 integral/differentiation이 정의되는 조건이 필요하다. 그러면 `∂X(X A_X U)=U`이며 적절한 uniform derivative 조건 아래 η 미분과 적분을 교환할 수 있다.

실제 target `solenoidal_reconstruction_cancellation`은 이 평균 항등식을 적용한 **뒤** radial/axial divergence의 대수적 cancellation을 증명한다. A+D=1이 필요하며 physical calculation은 q>0,L>0 영역에서 수행한다. 이 target은 모든 candidate continuation의 η 미분이 존재한다는 정리가 아니다. Finite core는 smooth coefficient polynomial을 사용하고 별도의 Cartesian FD 경로로 확인한다. Moment repair의 accepted/rejected branch switch는 uniform smooth gluing으로 인정하지 않는다.

## 5. Semigroup과 stability

`diffusion_semigroup_bound`는 `rate≥0,time≥0`이면 `exp(-rate*time)≤1`이라는 정확한 실수 정리다. Fourier PDE에서는 rate=ν|k|²로 넣을 수 있다. 이 scalar result를 무한차원 L² contraction으로 읽으려면 mode summability와 Parseval/spectral representation이 별도로 필요하다. 임의의 operator에는 정의역·self-adjointness·nonnegativity도 추가로 필요하다.

`stable_residual_budget`에는 `|err|≤C*residual`이라는 **stability hypothesis 자체**가 들어 있다. C≥0와 residual≤epsilon이면 error≤C*epsilon을 증명한다. 현재 candidate의 전역 안정성 상수 C를 계산하지 않았으므로 NS residual을 global solution-error로 바꾸지 않는다.

## 6. Borel, 무한 correction과 Galerkin 한계

원문의 §5/§9와 Lemma10.3(p.120)은 각 고정 derivative seminorm에서 summable한 tail가 되도록 cutoff를 선택한다. 필요 조건은 모든 m에 대해 충분히 큰 k의 항에 `||term_k||_Cm ≤2^-k` 같은 bound를 확보하는 것이다. 각 derivative order에 대해 common domain/support 및 uniform convergence도 보존해야 한다. 이러한 무한 단계는 N4–N8 범위이며 M1이 완성했다고 표시하지 않는다.

Mixed-radix FFT/direct convolution의 일치는 **유한 차원** statement다. Continuum Galerkin limit에는 cutoff에 무관한 안정성·compactness·nonlinear convergence가 필요하다. 예컨대 3차원 Hˢ product와 classical derivative control을 쓰는 경우 s>5/2 및 적절한 time regularity를 명시해야 한다. 해당 무한차원 조건은 유한 FFT 오차 약1e-16에서 자동으로 따라오지 않는다.

## 7. 실제 외부 source imports

`NavierStokes.Flatness.PowerFlat.div_pow`의 adapter는 filter l, q,f와 PowerFlat의 모든 power-order bound, 그리고 eventually q≠0를 가정한다. 고정된 자연수 loss만큼 q의 거듭제곱으로 나누어도 power-flat임을 실제 외부 theorem에 적용해 증명한다. 이 타입은 임의로 선택한 candidate force가 PowerFlat이라는 가정을 제공하지 않는다.

`NavierStokes.ProblemStatement.zero_velocity_not_unbounded`의 adapter는 identically zero velocity가 `SpeedUnboundedAtOne` 조건을 만족하지 않음을 실제 import한다. Source의 PDE residual와 `CandidateProperties` 타입도 실제 `#check`로 기록한다.

이 외부 두 파일은 pinned source 그대로이며 local4.34.1에서 compatibility component check를 했다. 원래 rc2 전체 C/D 제출 theorem 및 Comparator 결과는 `official-validation/`의 별도 기록을 따라야 한다.
