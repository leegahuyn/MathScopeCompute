import Mathlib.Analysis.Calculus.Deriv.Inv
import Mathlib.Analysis.SpecialFunctions.Exp
import Mathlib.Analysis.SpecialFunctions.Integrals.Basic
import Mathlib.MeasureTheory.Integral.IntervalIntegral.FundThmCalculus
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.FunProp
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.Positivity
import Mathlib.Tactic.NormNum
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

/-- The native implicit slow chart differentiates with denominator
`1 - 2 * h * eta^2` on the admitted image. -/
theorem five_map_slow_chart_denominator {h eta : ℝ}
    (hh : 0 ≤ h) (hSmall : h ≤ 1 / 16) (hEta : eta ^ 2 ≤ 1) :
    7 / 8 ≤ 1 - 2 * h * eta ^ 2 ∧ 1 - 2 * h * eta ^ 2 ≤ 1 := by
  have hNonneg : 0 ≤ 2 * h * eta ^ 2 := by positivity
  have hBound := mul_le_mul_of_nonneg_left hEta (show 0 ≤ 2 * h by positivity)
  constructor <;> linarith

/-- The weighted mean radial density in the axial pressure moment retains
both original boundary terms. -/
theorem five_map_weighted_radial_density
    (U dU : ℝ → ℝ) (a b : ℝ)
    (hU : ∀ x ∈ Set.uIcc a b, HasDerivAt U (dU x) x)
    (hdU : IntervalIntegrable dU volume a b)
    (hDerivWeight : IntervalIntegrable (fun x => x ^ 2 * dU x) volume a b)
    (hValueWeight : IntervalIntegrable (fun x => x * U x) volume a b) :
    (∫ x in a..b, -(x ^ 2 * dU x) - x * U x) =
      a ^ 2 * U a - b ^ 2 * U b + (∫ x in a..b, x * U x) := by
  have hNeg : (∫ x in a..b, -(x ^ 2 * dU x) - x * U x) =
      (∫ x in a..b, -(x ^ 2 * dU x + x * U x)) := by
    apply intervalIntegral.integral_congr
    intro x _
    ring
  rw [hNeg, intervalIntegral.integral_neg, intervalIntegral.integral_add hDerivWeight hValueWeight]
  have hPoly : ∀ x ∈ Set.uIcc a b,
      HasDerivAt (fun y : ℝ => y ^ 2) (2 * x) x := by
    intro x _
    simpa using (hasDerivAt_pow 2 x)
  have hDiff : IntervalIntegrable (fun x : ℝ => 2 * x) volume a b :=
    (by fun_prop : Continuous (fun x : ℝ => 2 * x)).intervalIntegrable a b
  have hParts := intervalIntegral.integral_mul_deriv_eq_deriv_mul hPoly hU hDiff hdU
  have hFactor : (fun x : ℝ => (2 * x) * U x) = (fun x => 2 * (x * U x)) := by
    funext x
    ring
  rw [hFactor, intervalIntegral.integral_const_mul] at hParts
  linarith

/-- The compact Haar square identity with a radial monomial weight.
The endpoint values vanish because the two co-moving profiles are compact. -/
theorem five_map_compact_square_weight
    (f df : ℝ → ℝ) (m : ℕ) {a b : ℝ}
    (hf : Continuous f) (hdf : Continuous df)
    (hF : ∀ x ∈ Set.uIcc a b, HasDerivAt f (df x) x)
    (ha : f a = 0) (hb : f b = 0) :
    (∫ x in a..b, x ^ m * f x * (f x + x * df x)) =
      (1 - ((m : ℝ) + 1) / 2) * (∫ x in a..b, x ^ m * f x ^ 2) := by
  have hSquare (x : ℝ) (hx : x ∈ Set.uIcc a b) :
      HasDerivAt (fun y => f y ^ 2) (2 * f x * df x) x := by
    convert (hF x hx).pow 2 using 1 <;> norm_num <;> ring
  have hPower (x : ℝ) :
      HasDerivAt (fun y : ℝ => y ^ (m + 1)) (((m : ℝ) + 1) * x ^ m) x := by
    simpa [Nat.cast_add] using (hasDerivAt_pow (m + 1) x)
  have hProd (x : ℝ) (hx : x ∈ Set.uIcc a b) :
      HasDerivAt (fun y => y ^ (m + 1) * f y ^ 2)
        (((m : ℝ) + 1) * (x ^ m * f x ^ 2) + 2 * (x ^ (m + 1) * f x * df x)) x := by
    convert (hPower x).mul (hSquare x hx) using 1 <;> ring
  have hA : IntervalIntegrable (fun x : ℝ => ((m : ℝ) + 1) * (x ^ m * f x ^ 2)) volume a b :=
    (by fun_prop : Continuous (fun x : ℝ => ((m : ℝ) + 1) * (x ^ m * f x ^ 2))).intervalIntegrable a b
  have hB : IntervalIntegrable (fun x : ℝ => 2 * (x ^ (m + 1) * f x * df x)) volume a b :=
    (by fun_prop : Continuous (fun x : ℝ => 2 * (x ^ (m + 1) * f x * df x))).intervalIntegrable a b
  have hMain : IntervalIntegrable (fun x : ℝ => x ^ m * f x ^ 2) volume a b :=
    (by fun_prop : Continuous (fun x : ℝ => x ^ m * f x ^ 2)).intervalIntegrable a b
  have hCross : IntervalIntegrable (fun x : ℝ => x ^ (m + 1) * f x * df x) volume a b :=
    (by fun_prop : Continuous (fun x : ℝ => x ^ (m + 1) * f x * df x)).intervalIntegrable a b
  have hFTC := intervalIntegral.integral_eq_sub_of_hasDerivAt hProd (hA.add hB)
  rw [intervalIntegral.integral_add hA hB] at hFTC
  simp [intervalIntegral.integral_const_mul, ha, hb] at hFTC
  have hIntegrands : (fun x : ℝ => x ^ m * f x * (f x + x * df x)) =
      (fun x : ℝ => x ^ m * f x ^ 2 + x ^ (m + 1) * f x * df x) := by
    funext x
    rw [pow_succ]
    ring
  rw [hIntegrands, intervalIntegral.integral_add hMain hCross]
  linarith only [hFTC]

/-- The original compact pure-axial witness has the two signed radial moments
shown here, after taking the normalized Haar square of the co-moving mode. -/
theorem five_map_compact_pressure_witness
    (f df : ℝ → ℝ) {a b : ℝ}
    (hf : Continuous f) (hdf : Continuous df)
    (hF : ∀ x ∈ Set.uIcc a b, HasDerivAt f (df x) x)
    (ha : f a = 0) (hb : f b = 0) :
    ((1 / 2 : ℝ) * (∫ x in a..b, f x * (f x + x * df x)) =
      (1 / 4 : ℝ) * (∫ x in a..b, f x ^ 2)) ∧
    ((-1 / 4 : ℝ) * (∫ x in a..b, x ^ 2 * f x * (f x + x * df x)) =
      (1 / 8 : ℝ) * (∫ x in a..b, x ^ 2 * f x ^ 2)) := by
  constructor
  · have h := five_map_compact_square_weight f df 0 hf hdf hF ha hb
    simp only [pow_zero, one_mul, Nat.cast_zero, zero_add] at h
    rw [h]
    ring
  · have h := five_map_compact_square_weight f df 2 hf hdf hF ha hb
    rw [h]
    norm_num <;> ring

end

#print axioms five_map_radial_primitive_curl
#print axioms five_map_axial_primitive_curl
#print axioms five_map_axial_cutoff_commutator
#print axioms five_map_axial_gap_lower
#print axioms five_map_angular_gap_lower
#print axioms five_map_slow_chart_denominator
#print axioms five_map_weighted_radial_density
#print axioms five_map_compact_square_weight
#print axioms five_map_compact_pressure_witness

end MathScope.M3.CD
