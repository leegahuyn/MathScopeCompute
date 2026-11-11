import Mathlib

namespace MathScope.M3.CD

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
