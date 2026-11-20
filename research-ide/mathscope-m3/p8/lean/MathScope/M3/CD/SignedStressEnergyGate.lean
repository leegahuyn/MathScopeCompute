import Mathlib

open MeasureTheory Set

namespace MathScope.M3.CD

/-- Integrate the radial divergence before estimating the centered Signed
primitive. Both radial endpoint values remain in the identity. -/
theorem signed_centered_radial_flux
    (F dF g : ℝ → ℝ) (a r b chi : ℝ)
    (hLeft : ∀ x ∈ uIcc a r, HasDerivAt F (dF x) x)
    (hWhole : ∀ x ∈ uIcc a b, HasDerivAt F (dF x) x)
    (hdLeft : IntervalIntegrable dF volume a r)
    (hdWhole : IntervalIntegrable dF volume a b)
    (hgLeft : IntervalIntegrable g volume a r)
    (hgWhole : IntervalIntegrable g volume a b) :
    (∫ x in a..r, dF x + g x) - chi * (∫ x in a..b, dF x + g x) =
      F r - F a - chi * (F b - F a) +
        ((∫ x in a..r, g x) - chi * (∫ x in a..b, g x)) := by
  rw [intervalIntegral.integral_add hdLeft hgLeft,
    intervalIntegral.integral_add hdWhole hgWhole,
    intervalIntegral.integral_eq_sub_of_hasDerivAt hLeft hdLeft,
    intervalIntegral.integral_eq_sub_of_hasDerivAt hWhole hdWhole]
  ring

/-- Time differentiation of the centered primitive keeps the derivative of
the original cutoff times the whole primitive. -/
theorem signed_centered_time_cutoff
    (left whole chi : ℝ → ℝ) {t leftT wholeT chiT : ℝ}
    (hLeft : HasDerivAt left leftT t)
    (hWhole : HasDerivAt whole wholeT t)
    (hChi : HasDerivAt chi chiT t) :
    leftT - chi t * wholeT =
      deriv (fun x => left x - chi x * whole x) t + chiT * whole t := by
  have hCentered : HasDerivAt (fun x => left x - chi x * whole x)
      (leftT - (chiT * whole t + chi t * wholeT)) t := by
    exact hLeft.sub (hChi.mul hWhole)
  rw [hCentered.deriv]
  ring

/-- After the Corollary 8.5 radial integration, the axial and time fluxes and
the target product carry an explicit factor of the fixed source epsilon.
The inputs already include the positive radial weights and inverse weight. -/
theorem cor85_weighted_flux_cap
    {eps radial time axial target cR cT cZ cM : ℝ}
    (heps : 0 ≤ eps)
    (hR : |radial| ≤ cR) (hT : |time| ≤ cT)
    (hZ : |axial| ≤ cZ) (hM : |target| ≤ cM) :
    |-radial + eps * (time - axial + target)| ≤ cR + eps * (cT + cZ + cM) := by
  have hdiff : |time - axial| ≤ |time| + |axial| := by
    simpa only [sub_eq_add_neg, abs_neg] using abs_add_le time (-axial)
  have hsum : |time - axial + target| ≤ cT + cZ + cM := by
    have h := abs_add_le (time - axial) target
    linarith only [h, hdiff, hT, hZ, hM]
  have hout := abs_add_le (-radial) (eps * (time - axial + target))
  rw [abs_neg, abs_mul, abs_of_nonneg heps] at hout
  exact le_trans hout (add_le_add hR (mul_le_mul_of_nonneg_left hsum heps))

/-- A quarter-power gain in the source stress leaves one positive quarter
power after the worst signed spatial-gradient loss. Here `x^4 = eps = Q^h`
and `t = tau0^h`. The two original Q references both satisfy `t ≤ 2 * eps`.
The premise `x^3 * cap ≤ B` includes all required source coefficients. -/
theorem correction_quarter_power_cap
    {x t Xb B cap : ℝ}
    (hx : 0 ≤ x) (hcap : 0 ≤ cap)
    (ht : t ≤ 2 * x^4) (hB : x^3 * cap ≤ B)
    (hsmall : 2^29 * Xb^2 * B * x ≤ 1) :
    Xb^2 * (t * cap) ≤ 1 / 2^28 := by
  have htc : t * cap ≤ 2 * x * B := calc
    t * cap ≤ (2 * x^4) * cap := mul_le_mul_of_nonneg_right ht hcap
    _ = (2 * x) * (x^3 * cap) := by ring
    _ ≤ (2 * x) * B := mul_le_mul_of_nonneg_left hB (by positivity)
  calc
    Xb^2 * (t * cap) ≤ Xb^2 * (2 * x * B) := mul_le_mul_of_nonneg_left htc (sq_nonneg Xb)
    _ = (2^29 * Xb^2 * B * x) * (1 / 2^28) := by ring
    _ ≤ 1 * (1 / 2^28) := mul_le_mul_of_nonneg_right hsmall (by norm_num)
    _ = 1 / 2^28 := one_mul _

/-- Transfer the verified reference-dependent energy brackets to the
original per-stage allocation. The bracket constant here bounds both
source reference pieces. -/
theorem correction_energy_of_quarter_power
    {x t Xb B cap bracket ratio : ℝ}
    (hx : 0 ≤ x) (ht0 : 0 ≤ t) (hcap : 0 ≤ cap)
    (ht : t ≤ 2 * x^4) (hB : x^3 * cap ≤ B)
    (hsmall : 2^29 * Xb^2 * B * x ≤ 1)
    (hbracket : 96 * bracket ≤ 2^30 * cap^2)
    (hRatio : ratio ≤ 96 * Xb^4 * t^2 * bracket) :
    ratio ≤ 1 / 2^26 := by
  have hbound := correction_quarter_power_cap hx hcap ht hB hsmall
  have hscaled : 0 ≤ Xb^2 * (t * cap) := by positivity
  have hdenom : (0 : ℝ) ≤ 1 / 2^28 := by norm_num
  have hsq : (Xb^2 * (t * cap))^2 ≤ (1 / 2^28)^2 := by
    simpa only [pow_two] using mul_le_mul hbound hbound hscaled hdenom
  calc
    ratio ≤ 96 * Xb^4 * t^2 * bracket := hRatio
    _ = (Xb^4 * t^2) * (96 * bracket) := by ring
    _ ≤ (Xb^4 * t^2) * (2^30 * cap^2) := mul_le_mul_of_nonneg_left hbracket (by positivity)
    _ = 2^30 * (Xb^2 * (t * cap))^2 := by ring
    _ ≤ 2^30 * (1 / 2^28)^2 := mul_le_mul_of_nonneg_left hsq (by norm_num)
    _ = 1 / 2^26 := by norm_num

/-- The radial centered integral can also be read from the backward endpoint.
This keeps the cutoff times the whole moment even when the moment is nonzero. -/
theorem signed_centered_tail_primitive
    (f : ℝ → ℝ) {a r b chi : ℝ}
    (hLeft : IntervalIntegrable f volume a r)
    (hRight : IntervalIntegrable f volume r b) :
    (∫ x in a..r, f x) - chi * (∫ x in a..b, f x) =
      (1 - chi) * (∫ x in a..b, f x) - (∫ x in r..b, f x) := by
  rw [← intervalIntegral.integral_add_adjacent_intervals hLeft hRight]
  ring

/-- On a true exterior interval the higher centered stress vanishes at any
radial weight. Both the original whole moment and the backward support
condition occur as independent hypotheses. -/
theorem signed_centered_stress_exterior_zero
    (f : ℝ → ℝ) {a r b chi w : ℝ}
    (hLeft : IntervalIntegrable f volume a r)
    (hRight : IntervalIntegrable f volume r b)
    (hWhole : (∫ x in a..b, f x) = 0)
    (hExterior : ∀ x ∈ uIcc r b, f x = 0) :
    ((∫ x in a..r, f x) - chi * (∫ x in a..b, f x)) / w = 0 := by
  have hTail : (∫ x in r..b, f x) = 0 := by
    calc
      (∫ x in r..b, f x) = ∫ _x in r..b, (0 : ℝ) :=
        intervalIntegral.integral_congr hExterior
      _ = 0 := by simp
  rw [signed_centered_tail_primitive f hLeft hRight, hWhole, hTail]
  simp

/-- The endpoint-zero primitive is fixed by radial centering of its derivative. -/
theorem late_centered_radial_derivative
    (psi dPsi : ℝ → ℝ) {a r b chi : ℝ}
    (hLeft : ∀ x ∈ uIcc a r, HasDerivAt psi (dPsi x) x)
    (hWhole : ∀ x ∈ uIcc a b, HasDerivAt psi (dPsi x) x)
    (hdLeft : IntervalIntegrable dPsi volume a r)
    (hdWhole : IntervalIntegrable dPsi volume a b)
    (ha : psi a = 0) (hb : psi b = 0) :
    (∫ x in a..r, dPsi x) - chi * (∫ x in a..b, dPsi x) = psi r := by
  rw [intervalIntegral.integral_eq_sub_of_hasDerivAt hLeft hdLeft,
    intervalIntegral.integral_eq_sub_of_hasDerivAt hWhole hdWhole, ha, hb]
  ring

/-- The late centered inverse removes the fast derivative of the preceding
mean when the projection commutes at the input and the inverse is anchored. -/
theorem late_centered_fast_time_cancel {V : Type*} [AddCommGroup V]
    (fast project anchoredInv : V →+ V) (u : V)
    (hCommute : project (fast u) = fast (project u))
    (hAnchoredInverse : anchoredInv (fast (project u)) = project u) :
    anchoredInv (project (-fast u)) = -project u := by
  calc
    anchoredInv (project (-(fast u))) = -(anchoredInv (project (fast u))) := by simp
    _ = -project u := by rw [hCommute, hAnchoredInverse]

#print axioms late_centered_radial_derivative
#print axioms late_centered_fast_time_cancel
#print axioms signed_centered_tail_primitive
#print axioms signed_centered_stress_exterior_zero
#print axioms cor85_weighted_flux_cap
#print axioms signed_centered_radial_flux
#print axioms signed_centered_time_cutoff
#print axioms correction_quarter_power_cap
#print axioms correction_energy_of_quarter_power

/-- A later covariance factor pair keeps a uniform exponential rate
after the two independent coefficient charges have been spent. -/
theorem post_signed_covariance_pair_rate
    {x y a b H r₁ r₂ c₁ c₂ q : ℝ}
    (hH : 0 ≤ H) (ha : 0 ≤ a) (hb : 0 ≤ b)
    (hx : |x| ≤ a * Real.exp ((c₁ - r₁) * H))
    (hy : |y| ≤ b * Real.exp ((c₂ - r₂) * H))
    (hRate : q + c₁ + c₂ ≤ r₁ + r₂) :
    |x * y| ≤ (a * b) * Real.exp (-q * H) := by
  have hLog : c₁ + c₂ - r₁ - r₂ ≤ -q := by linarith
  calc
    |x * y| = |x| * |y| := abs_mul x y
    _ ≤ (a * Real.exp ((c₁ - r₁) * H)) *
        (b * Real.exp ((c₂ - r₂) * H)) :=
      mul_le_mul hx hy (abs_nonneg y) (mul_nonneg ha (Real.exp_pos _).le)
    _ = (a * b) * (Real.exp ((c₁ - r₁) * H) * Real.exp ((c₂ - r₂) * H)) := by
      ring
    _ = (a * b) * Real.exp ((c₁ + c₂ - r₁ - r₂) * H) := by
      rw [← Real.exp_add]
      congr 2 <;> ring
    _ ≤ (a * b) * Real.exp (-q * H) :=
      mul_le_mul_of_nonneg_left
        (Real.exp_le_exp.mpr (mul_le_mul_of_nonneg_right hLog hH)) (mul_nonneg ha hb)

#print axioms post_signed_covariance_pair_rate

end MathScope.M3.CD
