import Mathlib.Analysis.SpecialFunctions.Integrals.Basic
import Mathlib.Tactic.FunProp
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.Ring

/-!
# Axial conservative moment bridge: explicit conditional obligations

These are real-valued operator, interval-integral, boundary, and derivative lemmas.
They do not identify the source AST's clipped integrand with the manuscript's
unclipped residual. In particular, neither support nor differentiation under an
improper integral is inferred from a zero branch in an expression graph.
-/

open MeasureTheory Set Filter
open scoped Topology

namespace MathScope.M3.CD
noncomputable section

/-- The conservative expansion has an exact divergence defect. The already
weighted radial Laplacian is `r * urrz + urz`, so no division at the axis is used. -/
theorem axial_conservative_defect
    (r ur uz urr urz uzz uzt pz urrz previousZZ : ℝ) :
    (r * uzt + (ur + r * urr) * uz + r * ur * urz
      + r * (2 * uz * uzz + pz) - (urz + r * urrz) - r * previousZZ)
      - (r * uzt + r * ur * urz + r * uz * uzz + r * pz
        - (r * urrz + urz) - r * previousZZ)
      = uz * (ur + r * urr + r * uzz) := by
  ring

/-- The pointwise conservative identity requires the divergence equation. -/
theorem axial_conservative_of_divergence
    (r ur uz urr urz uzz uzt pz urrz previousZZ : ℝ)
    (hdiv : ur + r * urr + r * uzz = 0) :
    r * uzt + (ur + r * urr) * uz + r * ur * urz
      + r * (2 * uz * uzz + pz) - (urz + r * urrz) - r * previousZZ
      = r * uzt + r * ur * urz + r * uz * uzz + r * pz
        - (r * urrz + urz) - r * previousZZ := by
  have h := axial_conservative_defect r ur uz urr urz uzz uzt pz urrz previousZZ
  rw [hdiv, mul_zero] at h
  linarith

/-- Every coefficient of the convolution defect vanishes when each lower
coefficient satisfies its divergence equation. This covers arbitrary `n`. -/
theorem axial_all_order_divergence_defect_zero
    (n : ℕ) (r : ℝ) (U V Vr Uz : ℕ → ℝ)
    (hdiv : ∀ i, i ≤ n → V i + r * Vr i + r * Uz i = 0) :
    (∑ i ∈ Finset.range (n + 1),
      U (n - i) * (V i + r * Vr i + r * Uz i)) = 0 := by
  apply Finset.sum_eq_zero
  intro i hi
  rw [hdiv i (Nat.le_of_lt_succ (Finset.mem_range.mp hi)), mul_zero]

/--
An explicit all-order conservative-to-advective transport equality.  The two
axial-flux Leibniz summands are deliberately kept distinct: the indices are
not swapped by an unproved reindexing rule.  This is the polynomial coefficient
identity only; the source AST, cylindrical coordinate transform, support,
differentiation and integration remain separate obligations.
-/
theorem axial_all_order_conservative_transport
    (n : ℕ) (r : ℝ) (U V Vr Ur Uz : ℕ → ℝ)
    (hdiv : ∀ i, i ≤ n → V i + r * Vr i + r * Uz i = 0) :
    (∑ i ∈ Finset.range (n + 1),
      (U (n - i) * (V i + r * Vr i)
        + r * V i * Ur (n - i)
        + r * U (n - i) * Uz i
        + r * U i * Uz (n - i))) =
    (∑ i ∈ Finset.range (n + 1),
      (r * V i * Ur (n - i) + r * U i * Uz (n - i))) := by
  apply Finset.sum_congr rfl
  intro i hi
  have h := hdiv i (Nat.le_of_lt_succ (Finset.mem_range.mp hi))
  calc
    _ = (r * V i * Ur (n - i) + r * U i * Uz (n - i))
          + U (n - i) * (V i + r * Vr i + r * Uz i) := by ring
    _ = _ := by rw [h]; ring

/-- Pressure integration by parts on a finite interval retains both endpoint
terms. To obtain the paper's zero-boundary formula they must separately vanish
or agree. Passing to `(0, infinity)` requires additional integrability and limits. -/
theorem pressure_moment_boundary_identity
    (P dP : ℝ → ℝ) (a b : ℝ)
    (hP : ∀ x ∈ uIcc a b, HasDerivAt P (dP x) x)
    (hdP : IntervalIntegrable dP volume a b) :
    (∫ x in a..b, x * P x) =
      (b ^ 2 * P b - a ^ 2 * P a) / 2
        - (∫ x in a..b, x ^ 2 * dP x) / 2 := by
  have hpoly : ∀ x ∈ uIcc a b,
      HasDerivAt (fun y : ℝ => y ^ 2) (2 * x) x := by
    intro x hx
    simpa using (hasDerivAt_pow 2 x)
  have hint : IntervalIntegrable (fun x : ℝ => 2 * x) volume a b :=
    (by fun_prop : Continuous (fun x : ℝ => 2 * x)).intervalIntegrable a b
  have h := intervalIntegral.integral_mul_deriv_eq_deriv_mul hpoly hP hint hdP
  have heq : (fun x : ℝ => (2 * x) * P x) = (fun x => 2 * (x * P x)) := by
    funext x
    ring
  rw [heq, intervalIntegral.integral_const_mul] at h
  linarith

/-- The pressure moment reduction with the endpoint obligation made explicit. -/
theorem pressure_moment_zero_boundary
    (P dP : ℝ → ℝ) (a b : ℝ)
    (hP : ∀ x ∈ uIcc a b, HasDerivAt P (dP x) x)
    (hdP : IntervalIntegrable dP volume a b)
    (hboundary : b ^ 2 * P b = a ^ 2 * P a) :
    (∫ x in a..b, x * P x) = -(∫ x in a..b, x ^ 2 * dP x) / 2 := by
  rw [pressure_moment_boundary_identity P dP a b hP hdP, hboundary]
  ring

/-- A zero total integral gives the backward primitive only after actual
interval integrability has been provided. -/
theorem axial_backward_primitive
    (f : ℝ → ℝ) (a x b : ℝ)
    (hleft : IntervalIntegrable f volume a x)
    (hright : IntervalIntegrable f volume x b)
    (hzero : (∫ y in a..b, f y) = 0) :
    -(∫ y in a..x, f y) = ∫ y in x..b, f y := by
  have h := intervalIntegral.integral_add_adjacent_intervals hleft hright
  rw [hzero] at h
  linarith

/--
Finite-interval bridge for the *actual cutoff shape* of axial native1:
source body 117047 is an interior selection of raw body 117045 between
Xminus 28814 and Xplus 28824.  The manuscript integrates the full raw
physical residual after the Jacobian R dR = dX.

This does not prove the two exterior integrals vanish, the middle source AST
identity, or the improper-limit passage; those are explicit hypotheses.
No endpoint ordering is required for signed interval integrals.
-/
theorem axial_cutoff_full_residual_bridge_finite
    (raw supported : ℝ → ℝ) (c a b d : ℝ)
    (hca : IntervalIntegrable raw volume c a)
    (hab : IntervalIntegrable raw volume a b)
    (hcb : IntervalIntegrable raw volume c b)
    (hbd : IntervalIntegrable raw volume b d)
    (hleft : (∫ x in c..a, raw x) = 0)
    (hright : (∫ x in b..d, raw x) = 0)
    (hmiddle : (∫ x in a..b, supported x) =
      (∫ x in a..b, raw x)) :
    (∫ x in c..d, raw x) =
      (∫ x in a..b, supported x) := by
  have hfirst := intervalIntegral.integral_add_adjacent_intervals hca hab
  have hsecond := intervalIntegral.integral_add_adjacent_intervals hcb hbd
  rw [hleft] at hfirst
  rw [hright] at hsecond
  rw [← hmiddle] at hfirst
  linarith

/--
A genuine zero total raw moment transfers to the actual supported source
only when both excluded tails and the middle integral have been bound.
-/
theorem axial_cutoff_zero_moment_transfer_finite
    (raw supported : ℝ → ℝ) (c a b d : ℝ)
    (hca : IntervalIntegrable raw volume c a)
    (hab : IntervalIntegrable raw volume a b)
    (hcb : IntervalIntegrable raw volume c b)
    (hbd : IntervalIntegrable raw volume b d)
    (hleft : (∫ x in c..a, raw x) = 0)
    (hright : (∫ x in b..d, raw x) = 0)
    (hmiddle : (∫ x in a..b, supported x) =
      (∫ x in a..b, raw x))
    (hwhole : (∫ x in c..d, raw x) = 0) :
    (∫ x in a..b, supported x) = 0 := by
  have hbridge := axial_cutoff_full_residual_bridge_finite
    raw supported c a b d hca hab hcb hbd hleft hright hmiddle
  rw [hwhole] at hbridge
  exact hbridge.symm

/-- The forward stress is zero at the outer endpoint if the full integral
vanishes. Its derivative jets still need independent smoothness/support. -/
theorem axial_outer_value
    (f : ℝ → ℝ) (a b : ℝ)
    (hzero : (∫ y in a..b, f y) = 0) :
    -(∫ y in a..b, f y) = 0 := by
  rw [hzero, neg_zero]

/-- Vanishing on a neighborhood, not just at one eta, cancels derivatives. -/
theorem eta_moment_two_derivatives_zero
    (M : ℝ → ℝ) (eta : ℝ)
    (hzero : M =ᶠ[𝓝 eta] (fun _ => (0 : ℝ))) :
    deriv M eta = 0 ∧ deriv (deriv M) eta = 0 := by
  constructor
  · simpa using hzero.deriv_eq
  · simpa using hzero.deriv.deriv_eq

/-- Uniform interior cancellation supplies the neighborhood condition.
No endpoint statement at eta = -1 or eta = 1 is claimed here. -/
theorem eta_interior_moment_two_derivatives_zero
    (M : ℝ → ℝ) (eta : ℝ) (heta : eta ∈ Ioo (-1 : ℝ) 1)
    (hzero : ∀ y ∈ Ioo (-1 : ℝ) 1, M y = 0) :
    deriv M eta = 0 ∧ deriv (deriv M) eta = 0 := by
  apply eta_moment_two_derivatives_zero
  filter_upwards [isOpen_Ioo.mem_nhds heta] with y hy
  exact hzero y hy

/-- Order one uses the leading axial flux; the positive-order induction
hypothesis alone cannot close this base case. -/
theorem axial_previous_order_split
    (M : ℕ → ℝ) (n : ℕ) (hn : 1 ≤ n)
    (hzero : M 0 = 0) (hpositive : ∀ k, 1 ≤ k → M k = 0) :
    M (n - 1) = 0 := by
  by_cases hn1 : n = 1
  · subst n
    simpa using hzero
  · apply hpositive
    omega

/-- Minimal omitted-boundary countermodel: constant pressure has zero
derivative, but the endpoint contribution on [0,1] is nonzero. This is a
counterexample to dropping the boundary hypothesis, not to the actual source. -/
theorem omitted_pressure_boundary_countermodel :
    (∫ x : ℝ in (0 : ℝ)..1, x * (1 : ℝ)) = (1 : ℝ) / 2 ∧
    (∫ x : ℝ in (0 : ℝ)..1, x ^ 2 * (0 : ℝ)) = 0 := by
  constructor
  · simp only [mul_one]
    rw [integral_id]
    norm_num
  · simp

/-- Pointwise zero does not imply a zero eta derivative. -/
theorem pointwise_zero_is_insufficient :
    (fun eta : ℝ => eta) 0 = 0 ∧ deriv (fun eta : ℝ => eta) 0 = 1 := by
  simp

end
end MathScope.M3.CD

#print axioms MathScope.M3.CD.axial_conservative_defect
#print axioms MathScope.M3.CD.axial_conservative_of_divergence
#print axioms MathScope.M3.CD.axial_all_order_divergence_defect_zero
#print axioms MathScope.M3.CD.axial_all_order_conservative_transport
#print axioms MathScope.M3.CD.pressure_moment_boundary_identity
#print axioms MathScope.M3.CD.pressure_moment_zero_boundary
#print axioms MathScope.M3.CD.axial_backward_primitive
#print axioms MathScope.M3.CD.axial_cutoff_full_residual_bridge_finite
#print axioms MathScope.M3.CD.axial_cutoff_zero_moment_transfer_finite
#print axioms MathScope.M3.CD.axial_outer_value
#print axioms MathScope.M3.CD.eta_moment_two_derivatives_zero
#print axioms MathScope.M3.CD.eta_interior_moment_two_derivatives_zero
#print axioms MathScope.M3.CD.axial_previous_order_split
#print axioms MathScope.M3.CD.omitted_pressure_boundary_countermodel
#print axioms MathScope.M3.CD.pointwise_zero_is_insufficient
