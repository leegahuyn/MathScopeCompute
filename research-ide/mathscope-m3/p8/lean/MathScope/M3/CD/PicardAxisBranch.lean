import Mathlib

open Filter
open scoped Topology

namespace MathScope.M3.CD

private theorem hasDerivAt_id_mul_at_zero (f : ℝ → ℝ) (hf : ContinuousAt f 0) :
    HasDerivAt (fun x => x * f x) (f 0) 0 := by
  apply hasDerivAt_iff_tendsto_slope_zero.mpr
  apply (hf.tendsto.mono_left nhdsWithin_le_nhds).congr'
  filter_upwards [self_mem_nhdsWithin] with t ht
  have hne : t ≠ 0 := ht
  simp [smul_eq_mul, inv_mul_cancel_left₀ hne]

/-- Evaluate the original regular-singular equation and its differentiated
identity at zero. The derivatives on a neighborhood include the axis. -/
theorem picardAxisBranchCoefficients
    (w dw ddw g dg : ℝ → ℝ) (c : ℝ) (hc : 0 ≤ c)
    (hw : ∀ x, HasDerivAt w (dw x) x)
    (hdw : ∀ x, HasDerivAt dw (ddw x) x)
    (hg : ∀ x, HasDerivAt g (dg x) x)
    (hddw : ContinuousAt ddw 0) (hdg : ContinuousAt dg 0)
    (heq : ∀ x, x * dw x + c * w x = x * g x) :
    dw 0 = g 0 / (1 + c) ∧ ddw 0 / 2 = dg 0 / (2 + c) := by
  have heq' (x : ℝ) : dw x + x * ddw x + c * dw x = g x + x * dg x := by
    have hleft : HasDerivAt (fun y => y * dw y + c * w y)
        (dw x + x * ddw x + c * dw x) x := by
      simpa only [id_eq, one_mul] using
        ((hasDerivAt_id x).mul (hdw x)).add ((hw x).const_mul c)
    have hright : HasDerivAt (fun y => y * g y) (g x + x * dg x) x := by
      simpa only [id_eq, one_mul] using (hasDerivAt_id x).mul (hg x)
    have same : (fun x => x * dw x + c * w x) = (fun x => x * g x) := by
      funext y
      exact heq y
    rw [same] at hleft
    exact hleft.unique hright
  have hs : dw 0 + c * dw 0 = g 0 := by simpa using heq' 0
  have hleft : HasDerivAt (fun x => dw x + x * ddw x + c * dw x)
      (ddw 0 + ddw 0 + c * ddw 0) 0 :=
    ((hdw 0).add (hasDerivAt_id_mul_at_zero ddw hddw)).add ((hdw 0).const_mul c)
  have hright : HasDerivAt (fun x => g x + x * dg x) (dg 0 + dg 0) 0 :=
    (hg 0).add (hasDerivAt_id_mul_at_zero dg hdg)
  have same : (fun x => dw x + x * ddw x + c * dw x) = (fun x => g x + x * dg x) := by
    funext y
    exact heq' y
  rw [same] at hleft
  have ht : ddw 0 + ddw 0 + c * ddw 0 = dg 0 + dg 0 := by
    exact hleft.unique hright
  constructor
  · apply (eq_div_iff (by positivity : 1 + c ≠ 0)).2
    linarith only [hs, show dw 0 * (1 + c) = dw 0 + c * dw 0 by ring]
  · apply (eq_div_iff (by positivity : 2 + c ≠ 0)).2
    linarith only [ht, show ddw 0 / 2 * (2 + c) = (ddw 0 + ddw 0 + c * ddw 0) / 2 by ring]

#print axioms picardAxisBranchCoefficients

end MathScope.M3.CD
