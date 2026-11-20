import Mathlib.Analysis.Calculus.Deriv.Inv
import Mathlib.Analysis.SpecialFunctions.Exp
import Mathlib.MeasureTheory.Integral.IntervalIntegral.FundThmCalculus
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.Positivity
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

/-- The two axial FiveMap exponential nodes have a quantitative gap. -/
theorem five_map_axial_gap_lower {lam : ℝ} (hLam : 0 < lam)
    (hSmall : lam ≤ 1) : lam / 5 ≤ 1 - Real.exp (-(2 * lam / 5)) := by
  let t : ℝ := 2 * lam / 5
  have ht : 0 < t := by dsimp [t]; positivity
  have htUpper : t ≤ 1 := by dsimp [t]; linarith
  have hDen : 0 < 1 + t := by linarith
  have hExp : 1 + t ≤ Real.exp t := by
    simpa only [add_comm] using Real.add_one_le_exp t
  have hInv : Real.exp (-t) ≤ 1 / (1 + t) := by
    rw [Real.exp_neg, ← one_div]
    exact one_div_le_one_div_of_le hDen hExp
  have hHalf : t / 2 ≤ t / (1 + t) :=
    div_le_div_of_nonneg_left ht.le hDen (by linarith)
  have hBalance : t / (1 + t) = 1 - 1 / (1 + t) := by
    field_simp [hDen.ne'] <;> ring
  change lam / 5 ≤ 1 - Real.exp (-t)
  calc
    lam / 5 = t / 2 := by dsimp [t]; ring
    _ ≤ t / (1 + t) := hHalf
    _ = 1 - 1 / (1 + t) := hBalance
    _ ≤ 1 - Real.exp (-t) := by linarith

/-- A uniform separation for the angular FiveMap nodes ordered by exponent. -/
theorem five_map_angular_gap_lower {lo hi : ℝ} (hBase : 1 / 3 ≤ Real.exp lo)
    (hGap : 2 / 5 ≤ hi - lo) : 1 / 8 < Real.exp hi - Real.exp lo := by
  have hRel : 2 / 5 ≤ Real.exp (hi - lo) - 1 := by
    have h := Real.add_one_le_exp (hi - lo)
    linarith
  have hProduct : (1 / 3 : ℝ) * (2 / 5) ≤
      Real.exp lo * (Real.exp (hi - lo) - 1) :=
    mul_le_mul hBase hRel (by norm_num) (Real.exp_pos lo).le
  have hFactor : Real.exp hi = Real.exp lo * Real.exp (hi - lo) := by
    rw [← Real.exp_add]
    congr 1
    ring
  rw [hFactor, ← mul_sub_one]
  linarith

end

#print axioms five_map_radial_primitive_curl
#print axioms five_map_axial_primitive_curl
#print axioms five_map_axial_cutoff_commutator
#print axioms five_map_axial_gap_lower
#print axioms five_map_angular_gap_lower

end MathScope.M3.CD
