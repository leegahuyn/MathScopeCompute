import Mathlib

/-!
Conditional algebraic part of the first even-X error estimate.

The source Picard tail, eta Cauchy bound, and coefficient-xi suprema are
inputs. The normalized averaging identity is derived from the derivative
of the odd first derivative and its vanishing at zero.
-/

open MeasureTheory

namespace MathScope.M3.CD

/-- Away from the axis, rescale the interval before applying FTC to the
first radial derivative. The vanishing at zero comes from even parity. -/
theorem evenAxisFirstDerivativeAverage
    (first second : ℝ → ℝ) (x : ℝ) (hx : x ≠ 0)
    (hzero : first 0 = 0)
    (hderiv : ∀ t ∈ Set.uIcc (0 : ℝ) 1, HasDerivAt first (second (t * x)) (t * x))
    (hint : IntervalIntegrable (fun t => second (t * x) * x) volume 0 1) :
    first x / (2 * x) = (1 / 2 : ℝ) * (∫ t in (0 : ℝ)..1, second (t * x)) := by
  have hscaled (t : ℝ) (ht : t ∈ Set.uIcc (0 : ℝ) 1) :
      HasDerivAt (fun u => first (u * x)) (second (t * x) * x) t := by
    have hlinear : HasDerivAt (fun u : ℝ => u * x) x t := by
      simpa only [id_eq, one_mul] using (hasDerivAt_id t).mul_const x
    exact (hderiv t ht).comp t hlinear
  have hFTC := intervalIntegral.integral_eq_sub_of_hasDerivAt hscaled hint
  rw [intervalIntegral.integral_mul_const] at hFTC
  simp only [one_mul, zero_mul, hzero, sub_zero] at hFTC
  set average : ℝ := (∫ t in (0 : ℝ)..1, second (t * x)) at hFTC ⊢
  rw [← hFTC]
  field_simp <;> ring

/-- A pointwise bound on the integrand gives the same bound divided by two
for its normalized average, including the constant integrand at the axis. -/
theorem evenAxisIntegralBound
    (f : ℝ → ℝ) (B : ℝ)
    (hbound : ∀ t ∈ Set.uIoc (0 : ℝ) 1, |f t| ≤ B) :
    |(1 / 2 : ℝ) * (∫ t in (0 : ℝ)..1, f t)| ≤ B / 2 := by
  have hi := intervalIntegral.norm_integral_le_of_norm_le_const
    (a := (0 : ℝ)) (b := (1 : ℝ)) (C := B) (f := f) (by
      intro t ht
      simpa only [Real.norm_eq_abs] using hbound t ht)
  have habs : |∫ t in (0 : ℝ)..1, f t| ≤ B := by
    simpa [Real.norm_eq_abs] using hi
  calc
    |(1 / 2 : ℝ) * (∫ t in (0 : ℝ)..1, f t)| =
        (1 / 2 : ℝ) * |∫ t in (0 : ℝ)..1, f t| := by
          rw [abs_mul, abs_of_nonneg (by norm_num : 0 ≤ (1 / 2 : ℝ))]
    _ ≤ (1 / 2 : ℝ) * B := mul_le_mul_of_nonneg_left habs (by norm_num)
    _ = B / 2 := by ring

/-- Combine a first-xi derivative tail, a second-xi Volterra error estimate,
and a bound obtained from the regular even-axis averaging identity. -/
theorem evenAxisErrorBound
    (s C D T V Z gamma error : ℝ)
    (hs : 0 < s) (hC : 0 ≤ C)
    (hgamma : 0 ≤ gamma)
    (hfirst : V ≤ C * (1 + 4 / s) * T)
    (hsecond : Z ≤ 2 * (1 + 4 / s) * (D * T + (C / 2) * V))
    (haxis : |error| ≤ (gamma / 2) * Z) :
    |error| ≤ gamma * (1 + 4 / s) *
      (D + (C ^ 2 / 2) * (1 + 4 / s)) * T := by
  have hhalfC : 0 ≤ C / 2 := by positivity
  have htwoq : 0 ≤ (2 : ℝ) * (1 + 4 / s) := by positivity
  have hhalfgamma : 0 ≤ gamma / 2 := by positivity
  have hv : (C / 2) * V ≤ (C / 2) * (C * (1 + 4 / s) * T) :=
    mul_le_mul_of_nonneg_left hfirst hhalfC
  have hi : D * T + (C / 2) * V ≤
      D * T + (C / 2) * (C * (1 + 4 / s) * T) :=
    add_le_add (le_refl (D * T)) hv
  have hz : Z ≤ 2 * (1 + 4 / s) *
      (D * T + (C / 2) * (C * (1 + 4 / s) * T)) :=
    le_trans hsecond (mul_le_mul_of_nonneg_left hi htwoq)
  calc
    |error| ≤ (gamma / 2) * Z := haxis
    _ ≤ (gamma / 2) * (2 * (1 + 4 / s) *
        (D * T + (C / 2) * (C * (1 + 4 / s) * T))) :=
      mul_le_mul_of_nonneg_left hz hhalfgamma
    _ = gamma * (1 + 4 / s) *
        (D + (C ^ 2 / 2) * (1 + 4 / s)) * T := by ring

/-- The source geometric tail and the m-th eta-Cauchy factor specialize the
abstract conditional estimate. The natural k is the tail exponent N-2. -/
theorem evenAxisGeometricTail
    (s C D V Z error : ℝ) (k m : ℕ)
    (hs : 0 < s) (hC : 0 ≤ C)
    (hfirst : V ≤ C * (1 + 4 / s) * (1 / (3 * (4 : ℝ) ^ k)))
    (hsecond : Z ≤ 2 * (1 + 4 / s) *
      (D * (1 / (3 * (4 : ℝ) ^ k)) + (C / 2) * V))
    (haxis : |error| ≤ ((Nat.factorial m : ℝ) * (2 / s) ^ m / 2) * Z) :
    |error| ≤ (Nat.factorial m : ℝ) * (2 / s) ^ m * (1 + 4 / s) *
      (D + (C ^ 2 / 2) * (1 + 4 / s)) * (1 / (3 * (4 : ℝ) ^ k)) := by
  have hgamma : 0 ≤ (Nat.factorial m : ℝ) * (2 / s) ^ m := by positivity
  exact evenAxisErrorBound s C D (1 / (3 * (4 : ℝ) ^ k)) V Z
    ((Nat.factorial m : ℝ) * (2 / s) ^ m) error hs hC hgamma
    hfirst hsecond haxis

#print axioms evenAxisFirstDerivativeAverage
#print axioms evenAxisIntegralBound
#print axioms evenAxisErrorBound
#print axioms evenAxisGeometricTail

end MathScope.M3.CD
