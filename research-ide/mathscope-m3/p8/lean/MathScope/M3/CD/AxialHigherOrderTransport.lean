import Mathlib.Algebra.BigOperators.Group.Finset.Basic
import Mathlib.Basic.Real.Basic
import Mathlib.Tactic.Ring

/-!
Normalized axial transport in the original (X, eta) chart. The separate source
replay identifies these coefficients and the signed integration bounds and
establishes the assumptions under which the symbols denote ordinary jets.
-/

namespace MathScope.M3.CD.AxialHigherOrderTransport
noncomputable section

private def axial (X eta d L w f fx fe : ℝ) : ℝ :=
  (2 * eta * (w * f - X * fx) + d * fe) / L

private def axialMoment (eta d L w f fe : ℝ) : ℝ :=
  (2 * eta * w * f + d * fe) / L

private def velocityWeight (h : ℝ) (i : ℕ) : ℝ :=
  -(1 / 2 + h) + 2 * (i : ℝ) * h

private def fluxWeight (h : ℝ) (n : ℕ) : ℝ :=
  -2 * (1 / 2 + h) + 2 * (n : ℝ) * h

/-- Each ordered pair uses the axial derivative weight of the second factor. -/
theorem source_ordered_pair_flux
    (X eta d L wi wj v vx ui uix uie uj ujx uje : ℝ) :
    X * v * ujx + ui * axial X eta d L wj uj ujx uje =
      (v + X * vx) * uj + X * v * ujx
      + axial X eta d L (wi + wj) (ui * uj)
          (uix * uj + ui * ujx) (uie * uj + ui * uje)
      - uj * (v + X * vx + axial X eta d L wi ui uix uie) := by
  simp only [axial, div_eq_mul_inv]
  ring

/-- The radial stream primitive (M_X=U) gives the same continuity scalar
at any order, including order zero. Its eta derivative uses (M_{X,eta}=U_eta). -/
theorem source_stream_continuity
    (X eta d L h u ux ue : ℝ) (i : ℕ) :
    (2 * eta * (u + X * ux) - 2 * eta * (1 / 2 - h + 2 * (i : ℝ) * h) * u
      - d * ue) / L + axial X eta d L (velocityWeight h i) u ux ue = 0 := by
  simp only [axial, velocityWeight, div_eq_mul_inv]
  ring

/-- Every finite order uses the same axial flux weight for all ordered pairs.
The source convention (j=n-i) and the first-factor continuity identities
give the conservative sum without symmetrizing the individual terms. -/
theorem source_axial_convection_all_orders
    (n : ℕ) (X eta d L h : ℝ) (V Vx U Ux Ue : ℕ → ℝ)
    (continuity : ∀ i ≤ n, V i + X * Vx i
        + axial X eta d L (velocityWeight h i) (U i) (Ux i) (Ue i) = 0) :
    (∑ i ∈ Finset.range (n + 1),
      (X * V i * Ux (n - i)
        + U i * axial X eta d L (velocityWeight h (n - i))
            (U (n - i)) (Ux (n - i)) (Ue (n - i)))) =
    (∑ i ∈ Finset.range (n + 1),
      ((V i + X * Vx i) * U (n - i) + X * V i * Ux (n - i)
        + axial X eta d L (fluxWeight h n) (U i * U (n - i))
            (Ux i * U (n - i) + U i * Ux (n - i))
            (Ue i * U (n - i) + U i * Ue (n - i)))) := by
  apply Finset.sum_congr rfl
  intro i hi
  have hle : i ≤ n := Nat.le_of_lt_succ (Finset.mem_range.mp hi)
  have hw : velocityWeight h i + velocityWeight h (n - i) = fluxWeight h n := by
    unfold velocityWeight fluxWeight
    rw [Nat.cast_sub hle]
    ring
  rw [source_ordered_pair_flux X eta d L (velocityWeight h i) (velocityWeight h (n - i))
    (V i) (Vx i) (U i) (Ux i) (Ue i) (U (n - i)) (Ux (n - i)) (Ue (n - i)),
    hw, continuity i hle, mul_zero, sub_zero]

/-- The ordinary radial boundary derivative in the axial moment conversion. -/
theorem source_axial_to_moment
    (X eta d L w f fx fe : ℝ) :
    axial X eta d L w f fx fe =
      axialMoment eta d L (w + 1) f fe - 2 * eta * (f + X * fx) / L := by
  simp only [axial, axialMoment, div_eq_mul_inv]
  ring

/-- The ordinary radial boundary derivative in the time moment conversion. -/
theorem source_time_to_moment
    (X eta D L w f fx fe : ℝ) :
    (-w * f + X * fx + D * eta * fe) / L =
      (-(w + 1) * f + D * eta * fe) / L + (f + X * fx) / L := by
  simp only [div_eq_mul_inv]
  ring

/-- The native eta derivative of the moving stress operator differentiates
the eta coefficient of the axial drift. -/
theorem source_stress_eta_drift_commutator
    (q X D eta alpha fe fqe fxe fee : ℝ) :
    (q * fqe - X * fxe - D * (fe + eta * fee) - alpha * fe)
      - (q * fqe - X * fxe - D * eta * fee - alpha * fe) = -D * fe := by
  ring

/-- The two successive logarithmic time derivatives of the original
positive-order cutoff retain the second derivative of chi. -/
theorem source_cutoff_second_euler
    (n : ℕ) (h σ χ χ₁ χ₂ : ℝ) :
    (2 * (n : ℝ) * h) * ((2 * (n : ℝ) * h) * χ + σ * χ₁) +
        σ * ((2 * (n : ℝ) * h) * χ₁ + χ₁ + σ * χ₂) =
      (2 * (n : ℝ) * h)^2 * χ + (4 * (n : ℝ) * h + 1) * σ * χ₁ + σ^2 * χ₂ := by
  ring

end
end MathScope.M3.CD.AxialHigherOrderTransport

#print axioms MathScope.M3.CD.AxialHigherOrderTransport.source_ordered_pair_flux
#print axioms MathScope.M3.CD.AxialHigherOrderTransport.source_stream_continuity
#print axioms MathScope.M3.CD.AxialHigherOrderTransport.source_axial_convection_all_orders
#print axioms MathScope.M3.CD.AxialHigherOrderTransport.source_axial_to_moment
#print axioms MathScope.M3.CD.AxialHigherOrderTransport.source_time_to_moment
#print axioms MathScope.M3.CD.AxialHigherOrderTransport.source_stress_eta_drift_commutator
#print axioms MathScope.M3.CD.AxialHigherOrderTransport.source_cutoff_second_euler
