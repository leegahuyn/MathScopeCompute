import Mathlib.Analysis.Calculus.Deriv.Inv
import Mathlib.MeasureTheory.Integral.IntervalIntegral.FundThmCalculus
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.Ring

open MeasureTheory Filter
open scoped Topology

namespace MathScope.M3.CD

noncomputable section

/-- The ordinary axisymmetric axial curl of the original FiveMap primitive.
The radial lower endpoint is fixed on the chart. The integrand is continuous
at the upper endpoint and interval integrable along the full radial segment. -/
theorem five_map_radial_primitive_curl (gamma : ℝ → ℝ) {a R : ℝ}
    (hR : R ≠ 0)
    (hInt : IntervalIntegrable (fun s => s * gamma s) volume a R)
    (hMeas : StronglyMeasurableAtFilter (fun s => s * gamma s) (𝓝 R))
    (hCont : ContinuousAt (fun s => s * gamma s) R) :
    let psi : ℝ → ℝ := fun r => (∫ s in a..r, s * gamma s) / r
    deriv psi R + psi R / R = gamma R := by
  dsimp only
  have hPrimitive := intervalIntegral.integral_hasDerivAt_right hInt hMeas hCont
  have hQuot :
      HasDerivAt (fun r => (∫ s in a..r, s * gamma s) / r)
        ((R * gamma R * R - (∫ s in a..R, s * gamma s)) / R ^ 2) R := by
    simpa only [id_eq, mul_one] using hPrimitive.fun_div (hasDerivAt_id R) hR
  rw [hQuot.deriv]
  field_simp [hR] <;> ring

/-- The axial primitive differentiates at fixed radius. The derivative of its
integral is a separate hypothesis, supplied by differentiation under the
integral when the native chart meets the requisite regularity. -/
theorem five_map_axial_primitive_curl (primitive : ℝ → ℝ) {R Z eps integralZ : ℝ}
    (hPrimitive : HasDerivAt primitive integralZ Z) :
    -eps * deriv (fun z => primitive z / R) Z = -eps * (integralZ / R) := by
  rw [(hPrimitive.div_const R).deriv]

/-- Physical axial differentiation of the cutoff keeps the commutator
term. The chart conversion factor eps multiplies the full derivative. -/
theorem five_map_axial_cutoff_commutator (cutoff psi : ℝ → ℝ) {Z eps cutoffZ psiZ : ℝ}
    (hCutoff : HasDerivAt cutoff cutoffZ Z) (hPsi : HasDerivAt psi psiZ Z) :
    -eps * deriv (fun z => cutoff z * psi z) Z =
      cutoff Z * (-eps * psiZ) - eps * cutoffZ * psi Z := by
  have hProduct :
      HasDerivAt (fun z => cutoff z * psi z) (cutoffZ * psi Z + cutoff Z * psiZ) Z :=
    hCutoff.mul hPsi
  rw [hProduct.deriv]
  ring

end

#print axioms five_map_radial_primitive_curl
#print axioms five_map_axial_primitive_curl
#print axioms five_map_axial_cutoff_commutator

end MathScope.M3.CD
