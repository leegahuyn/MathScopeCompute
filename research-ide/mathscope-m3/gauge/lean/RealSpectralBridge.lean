import Mathlib.Analysis.SpecialFunctions.Log.Basic
import Mathlib.Algebra.Order.BigOperators.Group.Finset
import Mathlib.Tactic.FinCases
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.NormNum

/-!
Real finite spectral bounds for a declared, finite model. The model name and
cutoff index the certificate and its conclusions. The transfer certificate
enumerates the full finite spectrum and the full vacuum set. It does not assert
that an arbitrary numerical matrix output supplies these proof fields, or that
the finite cutoff has a continuum or infinite-volume limit.
-/

namespace MathScope.M3.Gauge.RealSpectral

open scoped BigOperators

structure FiniteSpectralModel where
  modelId : String
  cutoff : String
  dimension : Nat

noncomputable def spectralSum (model : FiniteSpectralModel)
    (weight excess : Fin model.dimension → ℝ) (delta time : ℝ) : ℝ :=
  ∑ j, weight j * Real.exp (-(delta + excess j) * time)

/-- Positive gap, nonnegative weights and excess energies, and forward real time
are explicit premises. The conclusion retains the finite model and its cutoff. -/
theorem finite_weighted_exp_envelope (model : FiniteSpectralModel)
    (weight excess : Fin model.dimension → ℝ) (delta time : ℝ)
    (hDelta : 0 < delta) (hTime : 0 ≤ time)
    (hWeight : ∀ j, 0 ≤ weight j) (hExcess : ∀ j, 0 ≤ excess j) :
    0 < delta ∧ spectralSum model weight excess delta time ≤
      Real.exp (-delta * time) * ∑ j, weight j := by
  refine ⟨hDelta, ?_⟩
  unfold spectralSum
  calc
    (∑ j, weight j * Real.exp (-(delta + excess j) * time)) ≤
        ∑ j, weight j * Real.exp (-delta * time) := by
      apply Finset.sum_le_sum
      intro j _
      apply mul_le_mul_of_nonneg_left _ (hWeight j)
      apply Real.exp_le_exp.mpr
      exact mul_le_mul_of_nonneg_right
        (neg_le_neg (le_add_of_nonneg_right (hExcess j))) hTime
    _ = (∑ j, weight j) * Real.exp (-delta * time) := by
      rw [Finset.sum_mul]
    _ = Real.exp (-delta * time) * ∑ j, weight j := mul_comm _ _

theorem log_ratio_lower_bound (spacing ratio r : ℝ)
    (hAt : 0 < spacing) (hRatio : 0 < ratio) (hUpper : ratio ≤ r) :
    -Real.log r / spacing ≤ -Real.log ratio / spacing := by
  exact div_le_div_of_nonneg_right
    (neg_le_neg (Real.log_le_log hRatio hUpper)) hAt.le

theorem log_gap_positive (spacing r : ℝ)
    (hAt : 0 < spacing) (hRatioPositive : 0 < r) (hRatioBelowOne : r < 1) :
    0 < -Real.log r / spacing :=
  div_pos (neg_pos.mpr (Real.log_neg hRatioPositive hRatioBelowOne)) hAt

theorem conservative_log_lower_bound (spacing r : ℝ)
    (hAt : 0 < spacing) (hRatioPositive : 0 < r) :
    (1 - r) / spacing ≤ -Real.log r / spacing := by
  apply div_le_div_of_nonneg_right _ hAt.le
  have hLog := Real.log_le_sub_one_of_pos hRatioPositive
  linarith

/-- All eigenvalues here belong to the explicitly declared finite diagonal
spectral model. `vacuumExact` prevents removing only one vector from a degenerate
vacuum. Every index outside that entire set needs a positive enclosed ratio. -/
structure TransferEnclosure (model : FiniteSpectralModel) where
  timeStep : ℝ
  timePositive : 0 < timeStep
  groundValue : ℝ
  groundPositive : 0 < groundValue
  eigenvalue : Fin model.dimension → ℝ
  vacuum : Finset (Fin model.dimension)
  vacuumNonempty : vacuum.Nonempty
  excitedNonempty : (Finset.univ \ vacuum).Nonempty
  vacuumExact : ∀ j, j ∈ vacuum ↔ eigenvalue j = groundValue
  ratio : ℝ
  ratioPositive : 0 < ratio
  ratioBelowOne : ratio < 1
  eigenvalueRatioPositive : ∀ j, 0 < eigenvalue j / groundValue
  nonvacuumRatioEnclosed : ∀ j, j ∉ vacuum → eigenvalue j / groundValue ≤ ratio

noncomputable def TransferEnclosure.excited {model : FiniteSpectralModel}
    (certificate : TransferEnclosure model) : Finset (Fin model.dimension) :=
  Finset.univ \ certificate.vacuum

noncomputable def TransferEnclosure.gap {model : FiniteSpectralModel}
    (certificate : TransferEnclosure model) : ℝ :=
  -Real.log certificate.ratio / certificate.timeStep

noncomputable def TransferEnclosure.energy {model : FiniteSpectralModel}
    (certificate : TransferEnclosure model) (j : Fin model.dimension) : ℝ :=
  -Real.log (certificate.eigenvalue j / certificate.groundValue) / certificate.timeStep

theorem TransferEnclosure.nonvacuum_lower_bound {model : FiniteSpectralModel}
    (certificate : TransferEnclosure model) (j : Fin model.dimension)
    (hNonvacuum : j ∈ certificate.excited) :
    0 < certificate.gap ∧
      (1 - certificate.ratio) / certificate.timeStep ≤ certificate.gap ∧
      certificate.gap ≤ certificate.energy j := by
  have hOutside : j ∉ certificate.vacuum := by
    simpa only [TransferEnclosure.excited, Finset.mem_sdiff, Finset.mem_univ,
      true_and] using hNonvacuum
  exact ⟨log_gap_positive _ _ certificate.timePositive
      certificate.ratioPositive certificate.ratioBelowOne,
    conservative_log_lower_bound _ _ certificate.timePositive certificate.ratioPositive,
    log_ratio_lower_bound _ _ _ certificate.timePositive
      (certificate.eigenvalueRatioPositive j)
      (certificate.nonvacuumRatioEnclosed j hOutside)⟩

/-- A result type carries the original model and cutoff in its index. Its last
field ranges over every nonvacuum index of that finite model. -/
structure CertifiedFiniteGap (model : FiniteSpectralModel)
    (certificate : TransferEnclosure model) : Prop where
  positive : 0 < certificate.gap
  conservative : (1 - certificate.ratio) / certificate.timeStep ≤ certificate.gap
  everyNonvacuum : ∀ j ∈ certificate.excited, certificate.gap ≤ certificate.energy j

theorem TransferEnclosure.certified_gap (model : FiniteSpectralModel)
    (certificate : TransferEnclosure model) : CertifiedFiniteGap model certificate where
  positive := log_gap_positive _ _ certificate.timePositive
    certificate.ratioPositive certificate.ratioBelowOne
  conservative := conservative_log_lower_bound _ _ certificate.timePositive
    certificate.ratioPositive
  everyNonvacuum j hj := (certificate.nonvacuum_lower_bound j hj).2.2

/-- The real-time bridge applies to the whole certified nonvacuum subspace.
Vacuum vectors cannot be included while retaining the positive decay rate. -/
theorem TransferEnclosure.nonvacuum_exp_envelope {model : FiniteSpectralModel}
    (certificate : TransferEnclosure model) (weight : Fin model.dimension → ℝ)
    (time : ℝ) (hTime : 0 ≤ time)
    (hWeight : ∀ j ∈ certificate.excited, 0 ≤ weight j) :
    0 < certificate.gap ∧
      (∑ j ∈ certificate.excited, weight j * Real.exp (-certificate.energy j * time)) ≤
        Real.exp (-certificate.gap * time) * ∑ j ∈ certificate.excited, weight j := by
  refine ⟨(TransferEnclosure.certified_gap model certificate).positive, ?_⟩
  calc
    (∑ j ∈ certificate.excited, weight j * Real.exp (-certificate.energy j * time)) ≤
        ∑ j ∈ certificate.excited, weight j * Real.exp (-certificate.gap * time) := by
      apply Finset.sum_le_sum
      intro j hj
      apply mul_le_mul_of_nonneg_left _ (hWeight j hj)
      apply Real.exp_le_exp.mpr
      exact mul_le_mul_of_nonneg_right
        (neg_le_neg (certificate.nonvacuum_lower_bound j hj).2.2) hTime
    _ = (∑ j ∈ certificate.excited, weight j) * Real.exp (-certificate.gap * time) := by
      rw [Finset.sum_mul]
    _ = Real.exp (-certificate.gap * time) * ∑ j ∈ certificate.excited, weight j :=
      mul_comm _ _

def fourStateModel : FiniteSpectralModel :=
  ⟨"Y7-exact-diagonal-four-state",
    "complete finite four-state diagonal model; no uncut lattice or continuum identification", 4⟩

noncomputable def fourStateEigenvalue (j : Fin 4) : ℝ :=
  if j.val = 0 then 8 else if j.val = 1 then 4 else if j.val = 2 then 2 else 1

noncomputable def fourStateEnclosure : TransferEnclosure fourStateModel where
  timeStep := 1
  timePositive := by norm_num
  groundValue := 8
  groundPositive := by norm_num
  eigenvalue := fourStateEigenvalue
  vacuum := {(0 : Fin 4)}
  vacuumNonempty := ⟨(0 : Fin 4), by simp⟩
  excitedNonempty := ⟨(1 : Fin 4), by norm_num⟩
  vacuumExact j := by
    fin_cases j <;> norm_num [fourStateEigenvalue]
  ratio := 1 / 2
  ratioPositive := by norm_num
  ratioBelowOne := by norm_num
  eigenvalueRatioPositive j := by
    fin_cases j <;> norm_num [fourStateEigenvalue]
  nonvacuumRatioEnclosed j hj := by
    fin_cases j <;> norm_num [fourStateEigenvalue] at *

theorem four_state_certified_gap : CertifiedFiniteGap fourStateModel fourStateEnclosure :=
  TransferEnclosure.certified_gap fourStateModel fourStateEnclosure

end MathScope.M3.Gauge.RealSpectral
