import Mathlib

namespace MathScope.M3.CD

open MeasureTheory

/-- The two exact terms left by multiplication of the principal forced
equation by a scalar cutoff. The four inputs are the original derivative,
linear term, force and pressure, before multiplication by the cutoff. -/
theorem forced_principal_cutoff_terms
    (ψ dψ t dt linear force pressure : ℂ)
    (principal : dt + linear + force + pressure = 0) :
    (dψ * t + ψ * dt) + ψ * linear + force + ψ * pressure =
      (1 - ψ) * force + dψ * t := by
  calc
    (dψ * t + ψ * dt) + ψ * linear + force + ψ * pressure =
        ψ * (dt + linear + force + pressure) + (1 - ψ) * force + dψ * t := by
          ring
    _ = (1 - ψ) * force + dψ * t := by rw [principal, mul_zero, zero_add]

/-- For the original pair of step arguments the derivative of the
longitudinal cutoff vanishes outside the two open transition intervals.
The hypothesis is the flat endpoint rule for the source step derivative. -/
theorem pulse_cutoff_derivative_outside_transitions
    (step dstep : ℝ → ℝ) {v L : ℝ} (hL : 0 < L)
    (hflat : ∀ x : ℝ, x ≤ 0 ∨ 1 ≤ x → dstep x = 0)
    (hfirst : v ≤ L / 5 ∨ L / 4 ≤ v)
    (hsecond : v ≤ 3 * L / 4 ∨ 4 * L / 5 ≤ v) :
    20 / L * (dstep (20 * v / L - 4) * step (16 - 20 * v / L) -
      step (20 * v / L - 4) * dstep (16 - 20 * v / L)) = 0 := by
  have ha : dstep (20 * v / L - 4) = 0 := by
    apply hflat
    rcases hfirst with h | h
    · left
      have bound : 20 * v / L ≤ 4 := (div_le_iff₀ hL).2 (by linarith)
      linarith
    · right
      have bound : 5 ≤ 20 * v / L := (le_div_iff₀ hL).2 (by linarith)
      linarith
  have hb : dstep (16 - 20 * v / L) = 0 := by
    apply hflat
    rcases hsecond with h | h
    · right
      have bound : 20 * v / L ≤ 15 := (div_le_iff₀ hL).2 (by linarith)
      linarith
    · left
      have bound : 16 ≤ 20 * v / L := (le_div_iff₀ hL).2 (by linarith)
      linarith
  rw [ha, hb]
  ring

/-- For Q=2^(-ell) and S=ell^2, an explicit band threshold absorbs
Q^(-M) S^P exp(-c S) into Q^N. The actual uniform coefficient estimate is
the input to this inequality. -/
theorem gaussian_dyadic_flat {ell c M N P : ℝ}
    (hell : 1 ≤ ell) (hP : 0 ≤ P)
    (hthreshold : (M + N) * Real.log 2 + 2 * P ≤ c * ell) :
    Real.exp ((M * Real.log 2) * ell + 2 * P * Real.log ell - c * ell ^ 2) ≤
      Real.exp (-(N * Real.log 2) * ell) := by
  have hpos : 0 < ell := by linarith
  have hlog : Real.log ell ≤ ell := by
    linarith [Real.log_le_sub_one_of_pos hpos]
  have hp := mul_le_mul_of_nonneg_left hlog (show 0 ≤ 2 * P by positivity)
  have hs := mul_le_mul_of_nonneg_right hthreshold hpos.le
  apply Real.exp_le_exp.mpr
  nlinarith

/-- The original pulse's quarter-width tail yields a fixed Gaussian in
the band index when the pulse length grows at least quadratically. -/
theorem pulse_gaussian_tail_exponent {v L ell g Lmin : ℝ}
    (hL : 0 < L) (hg : 0 ≤ g) (hLength : Lmin * ell ^ 2 ≤ L)
    (hTail : L / 4 ≤ |v - L / 2|) :
    (g * Lmin / 16) * ell ^ 2 ≤ g * (v - L / 2) ^ 2 / L := by
  have hd : (L / 4) ^ 2 ≤ (v - L / 2) ^ 2 := by
    have hmul := mul_nonneg (sub_nonneg.mpr hTail)
      (show 0 ≤ |v - L / 2| + L / 4 by positivity)
    nlinarith [sq_abs (v - L / 2)]
  calc
    _ ≤ g * L / 16 := by nlinarith [mul_le_mul_of_nonneg_left hLength hg]
    _ ≤ _ := (le_div_iff₀ hL).2 (by
      nlinarith [mul_le_mul_of_nonneg_left hd hg])

/-- Complete the Gaussian square to retain a single constant on the
entire admitted band range, for every prescribed flatness order. -/
theorem gaussian_uniform_dyadic_flat {ell c M N P : ℝ}
    (hell : 1 ≤ ell) (hc : 0 < c) (hP : 0 ≤ P) :
    Real.exp ((M * Real.log 2) * ell + 2 * P * Real.log ell - c * ell ^ 2) ≤
      Real.exp (((M + N) * Real.log 2 + 2 * P) ^ 2 / (2 * c)) *
        Real.exp (-(N * Real.log 2) * ell) := by
  let K := (M + N) * Real.log 2 + 2 * P
  have hpos : 0 < ell := by linarith
  have hlog : Real.log ell ≤ ell := by
    linarith [Real.log_le_sub_one_of_pos hpos]
  have hp := mul_le_mul_of_nonneg_left hlog (show 0 ≤ 2 * P by positivity)
  have hsq :
      c * ell ^ 2 / 2 + K ^ 2 / (2 * c) - K * ell =
        (c * ell - K) ^ 2 / (2 * c) := by
    field_simp
    <;> ring
  have hn : 0 ≤ (c * ell - K) ^ 2 / (2 * c) := by positivity
  have hc' : 0 ≤ c * ell ^ 2 := by positivity
  have hbound : K * ell - c * ell ^ 2 ≤ K ^ 2 / (2 * c) := by linarith
  rw [← Real.exp_add]
  apply Real.exp_le_exp.mpr
  dsimp [K] at hbound
  nlinarith

/-- Two translated closed coordinate intervals stay disjoint when the
center gap exceeds the sum of the two allowed displacements. -/
theorem strict_gap_excludes_overlap {x y u v r s : ℝ}
    (hgap : r + s < |x - y|) (hu : |u| ≤ r) (hv : |v| ≤ s) :
    x + u ≠ y + v := by
  intro h
  obtain ⟨hul, huu⟩ := abs_le.mp hu
  obtain ⟨hvl, hvu⟩ := abs_le.mp hv
  have bound : |x - y| ≤ r + s := abs_le.mpr ⟨by linarith, by linarith⟩
  exact (not_lt_of_ge bound) hgap

/-- Every centre whose closed bump support can reach x belongs to the
three-centre stencil of any nearest integer, including either tie choice. -/
theorem nearest_stencil_covers_closed_support {x : ℝ} {j n : ℤ}
    (hj : |x - (j : ℝ)| ≤ 3 / 4)
    (hn : |x - (n : ℝ)| ≤ 1 / 2) :
    n - 1 ≤ j ∧ j ≤ n + 1 := by
  obtain ⟨hjl, hju⟩ := abs_le.mp hj
  obtain ⟨hnl, hnu⟩ := abs_le.mp hn
  have lo : (n : ℝ) - 2 < (j : ℝ) := by linarith
  have hi : (j : ℝ) < (n : ℝ) + 2 := by linarith
  have loInt : n - 2 < j := by exact_mod_cast lo
  have hiInt : j < n + 2 := by exact_mod_cast hi
  omega

/-- The dropped and inserted centres on a nearest-integer switch both
have a strict collar around the switch, beyond the closed bump support. -/
theorem nearest_stencil_switch_collar {x : ℝ} (n : ℤ)
    (hx : |x - ((n : ℝ) + 1 / 2)| < 3 / 4) :
    3 / 4 < |x - ((n : ℝ) - 1)| ∧ 3 / 4 < |x - ((n : ℝ) + 2)| := by
  obtain ⟨hl, hu⟩ := abs_lt.mp hx
  have hp : 0 ≤ x - ((n : ℝ) - 1) := by linarith
  have hq : x - ((n : ℝ) + 2) ≤ 0 := by linarith
  rw [abs_of_nonneg hp, abs_of_nonpos hq]
  constructor <;> linarith

/-- A partitioned residual agrees locally across a stencil switch if
the exiting and entering rows vanish on their support collars. -/
theorem nearest_stencil_switch_sum {α : Type*} [AddCommMonoid α]
    (common departing entering : α) (hd : departing = 0) (he : entering = 0) :
    common + departing = common + entering := by
  rw [hd, he]

/-- A mixed derivative word of length at most three has at most eight
Leibniz terms. This bounds their half-sum for the uncut amplitude and
the differentiated longitudinal cutoff with a common pointwise weight. -/
theorem uncut_pulse_half_product_bound {ι : Type*}
    (terms : Finset ι) (cutoff amplitude : ι → ℝ) {C L N W : ℝ}
    (hC : 0 ≤ C) (hL : 0 < L) (hN : 0 ≤ N) (hW : 0 ≤ W)
    (hcount : terms.card ≤ 8)
    (hcutoff : ∀ i ∈ terms, |cutoff i| ≤ C / L)
    (hamp : ∀ i ∈ terms, |amplitude i| ≤ N * W) :
    |∑ i ∈ terms, cutoff i * amplitude i / 2| ≤ 4 * C * N * W / L := by
  have hstep : 0 ≤ (C / L) * (N * W) / 2 := by positivity
  have hterm (i : ι) (hi : i ∈ terms) :
      |cutoff i * amplitude i / 2| ≤ (C / L) * (N * W) / 2 := by
    rw [abs_div, abs_mul, abs_of_nonneg (by norm_num : (0 : ℝ) ≤ 2)]
    exact div_le_div_of_nonneg_right
      (mul_le_mul (hcutoff i hi) (hamp i hi) (abs_nonneg _)
        (div_nonneg hC hL.le)) (by norm_num)
  have hcard : (terms.card : ℝ) ≤ 8 := by exact_mod_cast hcount
  calc
    _ ≤ ∑ i ∈ terms, |cutoff i * amplitude i / 2| :=
      Finset.abs_sum_le_sum_abs _ _
    _ ≤ ∑ _i ∈ terms, (C / L) * (N * W) / 2 := Finset.sum_le_sum hterm
    _ = (terms.card : ℝ) * ((C / L) * (N * W) / 2) := by
      simp [Finset.sum_const, nsmul_eq_mul]
    _ ≤ 8 * ((C / L) * (N * W) / 2) :=
      mul_le_mul_of_nonneg_right hcard hstep
    _ = _ := by ring

/-- The original pulse length lower bound supplies an additional inverse
band power in a longitudinal cutoff derivative. -/
theorem pulse_inverse_length_band_gain {L S r : ℝ}
    (hS : 0 < S) (hr : 0 < r) (hL : 2 * r * S ≤ L) :
    1 / L ≤ 1 / (2 * r * S) := by
  exact one_div_le_one_div_of_le (by positivity) hL

/-- The normal rank-one term vanishes in the energy of a tangent vector.
The two rotational coefficients cancel in the symmetric energy form. -/
theorem forced_tangent_energy_cancellation
    (u₀ u₁ u₂ n₀ n₁ n₂ F a b correction damping : ℝ)
    (htangent : n₀ * u₀ + n₁ * u₁ + n₂ * u₂ = 0) :
    u₀ * (2 * F * u₁ + n₀ * correction - damping * u₀) +
      u₁ * (-(2 * F + a) * u₀ + n₁ * correction - damping * u₁) +
      u₂ * (-b * u₀ + n₂ * correction - damping * u₂) =
        -a * u₀ * u₁ - b * u₀ * u₂ - damping * (u₀ ^ 2 + u₁ ^ 2 + u₂ ^ 2) := by
  calc
    _ = (n₀ * u₀ + n₁ * u₁ + n₂ * u₂) * correction -
          a * u₀ * u₁ - b * u₀ * u₂ -
          damping * (u₀ ^ 2 + u₁ ^ 2 + u₂ ^ 2) := by ring
    _ = _ := by rw [htangent]; ring

/-- A sum-of-squares bound for the symmetric part of the actual shear.
It can be applied separately to the real and imaginary tangent vectors. -/
theorem forced_shear_energy_bound
    (u₀ u₁ u₂ a b rate : ℝ) (hrate : 0 < rate)
    (hshear : a ^ 2 + b ^ 2 ≤ 4 * rate ^ 2) :
    -a * u₀ * u₁ - b * u₀ * u₂ ≤ rate * (u₀ ^ 2 + u₁ ^ 2 + u₂ ^ 2) := by
  have hidentity :
      (2 * rate * u₀ + a * u₁ + b * u₂) ^ 2 +
        (4 * rate ^ 2 - a ^ 2 - b ^ 2) * (u₁ ^ 2 + u₂ ^ 2) +
        (a * u₂ - b * u₁) ^ 2 =
      4 * rate * (rate * (u₀ ^ 2 + u₁ ^ 2 + u₂ ^ 2) + a * u₀ * u₁ + b * u₀ * u₂) := by ring
  have hpositive : 0 ≤
      4 * rate * (rate * (u₀ ^ 2 + u₁ ^ 2 + u₂ ^ 2) + a * u₀ * u₁ + b * u₀ * u₂) := by
    rw [← hidentity]
    have hgap : 0 ≤ 4 * rate ^ 2 - a ^ 2 - b ^ 2 := by linarith
    positivity
  by_contra! hfail
  have hnegative :
      4 * rate * (rate * (u₀ ^ 2 + u₁ ^ 2 + u₂ ^ 2) + a * u₀ * u₁ + b * u₀ * u₂) < 0 :=
    mul_neg_of_pos_of_neg (by positivity) (by linarith)
  exact (not_lt_of_ge hpositive) hnegative

/-- The scalar damping remains subtractive in the actual tangent energy.
Numeric bounds and the solution's tangent constraint are separate inputs. -/
theorem forced_tangent_energy_growth
    (u₀ u₁ u₂ n₀ n₁ n₂ F a b correction damping rate : ℝ)
    (htangent : n₀ * u₀ + n₁ * u₁ + n₂ * u₂ = 0)
    (hrate : 0 < rate) (hshear : a ^ 2 + b ^ 2 ≤ 4 * rate ^ 2) :
    u₀ * (2 * F * u₁ + n₀ * correction - damping * u₀) +
      u₁ * (-(2 * F + a) * u₀ + n₁ * correction - damping * u₁) +
      u₂ * (-b * u₀ + n₂ * correction - damping * u₂) ≤
        (rate - damping) * (u₀ ^ 2 + u₁ ^ 2 + u₂ ^ 2) := by
  rw [forced_tangent_energy_cancellation _ _ _ _ _ _ _ _ _ _ _ htangent]
  have h := forced_shear_energy_bound u₀ u₁ u₂ a b rate hrate hshear
  nlinarith

/-- A radial characteristic primitive has a local value bound. The source
FTC identity and its uniform bound along the characteristic are inputs. -/
theorem mean_radial_characteristic_primitive_bound
    (g : ℝ → ℝ) (a r M psi : ℝ)
    (ha : 0 ≤ a) (har : a ≤ r) (hr : 0 < r) (hM : 0 ≤ M)
    (hbound : ∀ t ∈ Set.Ioc a r, |g t| ≤ M)
    (hprimitive : psi = (∫ t in a..r, t * g t) / r) :
    |psi| ≤ M * r / 2 ∧ |psi / r| ≤ M / 2 := by
  have hint : IntervalIntegrable (fun t : ℝ => t * M) volume a r :=
    (continuous_id.mul continuous_const).intervalIntegrable a r
  have hnorm := intervalIntegral.norm_integral_le_of_norm_le
    (a := a) (b := r) (f := fun t => t * g t) (g := fun t => t * M) har
    (Filter.Eventually.of_forall (fun t ht => by
      have ht₀ : 0 ≤ t := ha.trans ht.1.le
      rw [Real.norm_eq_abs, abs_mul, abs_of_nonneg ht₀]
      exact mul_le_mul_of_nonneg_left (hbound t ht) ht₀)) hint
  have hid : (∫ t in a..r, t) = (r ^ 2 - a ^ 2) / 2 := by
    have hp : (∫ t in a..r, t ^ 1) = (r ^ 2 - a ^ 2) / 2 := by
      rw [integral_pow]
      norm_num
    simpa only [pow_one] using hp
  rw [intervalIntegral.integral_mul_const, hid, Real.norm_eq_abs] at hnorm
  have hupper : |∫ t in a..r, t * g t| ≤ M * r ^ 2 / 2 := by
    have hnonneg := mul_nonneg hM (sq_nonneg a)
    nlinarith
  have hpsi : |psi| ≤ M * r / 2 := by
    rw [hprimitive, abs_div, abs_of_pos hr]
    apply (div_le_iff₀ hr).2
    nlinarith
  refine ⟨hpsi, ?_⟩
  rw [abs_div, abs_of_pos hr]
  apply (div_le_iff₀ hr).2
  nlinarith

/-- The physical potential derivative identities eliminate its separate
first-derivative norm from the radial cutoff commutator. -/
theorem mean_cutoff_radial_derivative
    (C Cz betaR gamma psi psiR r : ℝ)
    (hpsi : psiR = gamma - psi / r) :
    C * betaR - Cz * psiR = C * betaR - Cz * gamma + Cz * psi / r := by
  rw [hpsi]
  ring

theorem mean_cutoff_axial_derivative
    (C Cz Czz beta betaZ psi psiZ : ℝ)
    (hpsi : psiZ = -beta) :
    C * betaZ + Cz * beta - Czz * psi - Cz * psiZ =
      C * betaZ + 2 * Cz * beta - Czz * psi := by
  rw [hpsi]
  ring

/-- On the radial plateau the exact potential cutoff retains the mean
divergence equation. Both source curl and source divergence are explicit. -/
theorem mean_cutoff_divergence
    (C Cz beta betaR gamma gammaZ psi psiR r : ℝ)
    (hdiv : betaR + beta / r + gammaZ = 0)
    (hpsi : gamma = psiR + psi / r) :
    (C * betaR - Cz * psiR) + (C * beta - Cz * psi) / r +
      C * gammaZ + Cz * gamma = 0 := by
  calc
    _ = C * (betaR + beta / r + gammaZ) +
          Cz * (gamma - psiR - psi / r) := by ring
    _ = 0 := by rw [hdiv, hpsi]; ring

#print axioms mean_radial_characteristic_primitive_bound
#print axioms mean_cutoff_radial_derivative
#print axioms mean_cutoff_axial_derivative
#print axioms mean_cutoff_divergence
#print axioms forced_tangent_energy_cancellation
#print axioms forced_shear_energy_bound
#print axioms forced_tangent_energy_growth
#print axioms forced_principal_cutoff_terms
#print axioms pulse_cutoff_derivative_outside_transitions
#print axioms gaussian_dyadic_flat
#print axioms pulse_gaussian_tail_exponent
#print axioms gaussian_uniform_dyadic_flat
#print axioms strict_gap_excludes_overlap
#print axioms nearest_stencil_covers_closed_support
#print axioms nearest_stencil_switch_collar
#print axioms nearest_stencil_switch_sum
#print axioms uncut_pulse_half_product_bound
#print axioms pulse_inverse_length_band_gain

end MathScope.M3.CD
