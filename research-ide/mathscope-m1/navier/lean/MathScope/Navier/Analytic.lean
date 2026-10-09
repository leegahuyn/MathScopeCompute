import Mathlib.Analysis.Calculus.UniformLimitsDeriv
import Mathlib.Analysis.SpecialFunctions.Exp
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.Ring

/-! Concrete analytical hypotheses used by the NS adapters.
These lemmas do not prove the paper profile's hypotheses from sampled arrays.
The exact domains, norms, eventual quantifiers, and limiting hypotheses stay in each type.
-/
open Filter Topology
namespace MathScope.Navier.Analytic

theorem scale_exponents (h : ℝ) : (1 / 2 + h) + (1 / 2 - h) = 1 := by ring

theorem core_energy_exponent (h : ℝ) :
    (1+(1/2-h))-2*(1/2+h) = 1/2-3*h := by ring

theorem coordinate_denominator_positive (h eta : ℝ) (hh : 0 ≤ h)
    (hh' : h < 1 / 2) (heta : |eta| ≤ 1) : 0 < 1 - 2*h*eta^2 := by
  have he : eta^2 ≤ 1 := by nlinarith [sq_nonneg eta, (abs_le.mp heta).1, (abs_le.mp heta).2]
  nlinarith [mul_nonneg hh (sub_nonneg.mpr he)]

/-- Actual uniform derivative/limit exchange, on an open real domain. -/
theorem uniform_derivative_exchange (f fp : ℕ → ℝ → ℝ) (g gp : ℝ → ℝ)
    (s : Set ℝ) (hs : IsOpen s)
    (hfp : TendstoUniformlyOn fp gp atTop s)
    (hf : ∀ᶠ n in atTop, ∀ x ∈ s, HasDerivAt (f n) (fp n x) x)
    (hfg : ∀ x ∈ s, Tendsto (fun n => f n x) atTop (𝓝 (g x)))
    (x : ℝ) (hx : x ∈ s) : HasDerivAt g (gp x) x := by
  exact hasDerivAt_of_tendstoUniformlyOn hs hfp hf hfg hx

/-- Diffusion Fourier-mode semigroup is contractive for a nonnegative rate and time. -/
theorem diffusion_semigroup_bound (rate time : ℝ) (hr : 0 ≤ rate) (ht : 0 ≤ time) :
    Real.exp (-rate*time) ≤ 1 := by
  exact Real.exp_le_one_iff.mpr (by nlinarith [mul_nonneg hr ht])

/-- A residual estimate becomes an error estimate only with a supplied stability bound. -/
theorem stable_residual_budget (err residual C epsilon : ℝ)
    (hC : 0 ≤ C) (hr : residual ≤ epsilon)
    (hStability : |err| ≤ C*residual) : |err| ≤ C*epsilon := by
  exact hStability.trans (mul_le_mul_of_nonneg_left hr hC)

/-- A whole rational cone strip with bs=ps2=0; this is not a paper profile. -/
theorem rational_cone_strip (a p : ℝ) (ha0 : 29/10 ≤ a) (ha1 : a ≤ 31/10)
    (hp0 : 49/10 ≤ p) (hp1 : p ≤ 51/10) :
    2 < a ∧ a < p ∧ (a-2)*(0:ℝ)^2 < 2*(p-a)^2 := by
  constructor
  · linarith
  constructor
  · linarith
  have hgap : 0 < p-a := by linarith
  nlinarith [sq_pos_of_pos hgap]

/-- Algebra after the average identities d_X(X A_X U)=U and their eta derivatives.
This proves cancellation, not those analytic identities for a sampled array. -/
theorem solenoidal_reconstruction_cancellation
    (U UX Ueta eta X A D d q L : ℝ) (hAD : A+D=1) :
    (2*eta*U+2*eta*X*UX-2*D*eta*U-d*Ueta)/(q*L) +
    (-2*A*eta*U+d*Ueta-2*eta*X*UX)/(q*L) = 0 := by
  have hD : D=1-A := by linarith
  rw [hD]
  ring

set_option pp.fullNames true
#check scale_exponents
#print axioms scale_exponents
#check core_energy_exponent
#print axioms core_energy_exponent
#check coordinate_denominator_positive
#print axioms coordinate_denominator_positive
#check uniform_derivative_exchange
#print axioms uniform_derivative_exchange
#check diffusion_semigroup_bound
#print axioms diffusion_semigroup_bound
#check stable_residual_budget
#print axioms stable_residual_budget
#check rational_cone_strip
#print axioms rational_cone_strip
#check solenoidal_reconstruction_cancellation
#print axioms solenoidal_reconstruction_cancellation
end MathScope.Navier.Analytic
