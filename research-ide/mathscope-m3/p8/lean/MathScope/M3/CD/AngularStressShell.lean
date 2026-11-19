import Mathlib

open MeasureTheory

namespace MathScope.M3.CD

/-- Transport the conservative angular primitive through the actual slow-chart
radius. The multiplier is fixed in the radial direction. -/
theorem angular_stress_radial_flux {R s X K stress stressX residual : ℝ}
    (hR : 0 < R) (hs : 0 < s) (hX : X = R ^ 2 / (2 * s))
    (hflux : stress + X * stressX = -X * residual) :
    -(K * (stressX * (R / s) + 2 * stress / R)) = K * (R / s) * residual := by
  have hscale : R ^ 2 = 2 * s * X := by
    rw [hX]
    field_simp [hs.ne']
  have hnum : R ^ 2 * stressX + 2 * s * stress = -R ^ 2 * residual := by
    rw [hscale]
    linear_combination (2 * s) * hflux
  have hderiv : stressX * (R / s) + 2 * stress / R = -(R / s) * residual := by
    field_simp [hR.ne', hs.ne']
    linear_combination hnum
  rw [hderiv]
  ring

/-- The exact difference between the source's signed forward angular
primitive and the backward primitive is the unscaled whole moment. -/
theorem angular_stress_forward_backward_gap {f : ℝ → ℝ} {a b X : ℝ}
    (hleft : IntervalIntegrable f volume a X) (hright : IntervalIntegrable f volume X b) :
    -(∫ y in a..X, f y) / (2 * X) - (∫ y in X..b, f y) / (2 * X) =
      -(∫ y in a..b, f y) / (2 * X) := by
  rw [← intervalIntegral.integral_add_adjacent_intervals hleft hright]
  ring

/-- Identifying the two native angular primitives requires exactly the
whole angular moment. The local conservative derivative uses the preceding
flux lemma independently of this whole-moment condition. -/
theorem angular_stress_forward_eq_backward_iff {f : ℝ → ℝ} {a b X : ℝ}
    (hX : 0 < X) (hleft : IntervalIntegrable f volume a X)
    (hright : IntervalIntegrable f volume X b) :
    (-(∫ y in a..X, f y) / (2 * X) = (∫ y in X..b, f y) / (2 * X)) ↔
      (∫ y in a..b, f y) = 0 := by
  have hgap := angular_stress_forward_backward_gap hleft hright
  constructor
  · intro h
    have hz : -(∫ y in a..b, f y) / (2 * X) = 0 := by
      rw [← hgap, h, sub_self]
    field_simp [hX.ne'] at hz
    linarith only [hz]
  · intro h
    apply sub_eq_zero.mp
    rw [hgap, h]
    simp

#print axioms angular_stress_radial_flux
#print axioms angular_stress_forward_backward_gap
#print axioms angular_stress_forward_eq_backward_iff

end MathScope.M3.CD
