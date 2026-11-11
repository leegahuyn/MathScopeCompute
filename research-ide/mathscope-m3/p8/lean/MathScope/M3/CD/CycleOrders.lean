import Mathlib

namespace MathScope.M3.CD

noncomputable def waveOrder (j : ℕ) : ℝ := 7 / 10 + (j : ℝ) / 10
noncomputable def meanOrder (j : ℕ) : ℝ := 6 / 5 + (j : ℝ) / 10

/-- The arithmetic needed to lower the initialization estimates to
the stage-zero orders. The source class estimates are separate premises. -/
theorem initial_cycle_order_arithmetic (κ : ℝ) (hκ : κ ≤ 1 / 100000) :
    waveOrder 0 ≤ 1 - 3 * κ ∧
    9 / 10 ≤ 1 - κ ∧
    19 / 10 ≤ (1 - κ) + 1 ∧
    meanOrder 0 ≤ 149 / 100 ∧
    meanOrder 0 ≤ (1 - κ) + 4 / 5 := by
  norm_num [waveOrder, meanOrder]
  refine ⟨?_, ?_, ?_, ?_⟩ <;> linarith

/-- The four Supported Forced gains and the four Signed gains in
Proposition 9.6, for every finite correction index. -/
theorem forced_and_signed_gain_arithmetic (j : ℕ) (κ : ℝ)
    (hκ : κ ≤ 1 / 100000) :
    2 / 5 ≤ 1 / 2 - 3 * κ ∧
    2 / 5 ≤ 1 / 2 - κ ∧
    2 / 5 ≤ waveOrder j - κ ∧
    2 / 5 - κ ≤ 1 / 2 - 4 * κ ∧
    2 / 5 - κ ≤ 1 / 2 - 2 * κ ∧
    2 / 5 - κ ≤ waveOrder j - 3 * κ := by
  have hj : 0 ≤ (j : ℝ) := Nat.cast_nonneg j
  unfold waveOrder
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_⟩ <;> linarith

/-- The retained stress remainders each admit the common gain 0.17. -/
theorem signed_stress_remainder_arithmetic (j : ℕ) (κ : ℝ)
    (hκ : κ ≤ 1 / 100000) :
    17 / 100 ≤ 18 / 100 - 2 * κ ∧
    17 / 100 ≤ (1 / 5 + (j : ℝ) / 10) - 3 * κ := by
  have hj : 0 ≤ (j : ℝ) := Nat.cast_nonneg j
  constructor <;> linarith

/-- Given the stated class estimates, the remaining mean and moment
errors and the cumulative increment floors have the required exponents. -/
theorem mean_and_defect_cycle_arithmetic (j : ℕ) (κ : ℝ)
    (hκ : κ ≤ 1 / 100000) :
    let H := meanOrder j - 2 * κ
    waveOrder (j + 1) ≤ H ∧
    meanOrder (j + 1) ≤ meanOrder j + 17 / 100 ∧
    meanOrder (j + 1) ≤ H + 1 - 2 * κ ∧
    meanOrder (j + 1) ≤ H + 9 / 10 - 2 * κ ∧
    68 / 100 ≤ waveOrder j - κ ∧
    9 / 10 ≤ H ∧
    19 / 10 ≤ H + 1 := by
  have hj : 0 ≤ (j : ℝ) := Nat.cast_nonneg j
  norm_num [waveOrder, meanOrder, Nat.cast_add]
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> linarith

#print axioms initial_cycle_order_arithmetic
#print axioms forced_and_signed_gain_arithmetic
#print axioms signed_stress_remainder_arithmetic
#print axioms mean_and_defect_cycle_arithmetic

/-- The centered axial cutoff contribution uses the raw centered source
once the cutoff operator commutes with the torus derivative. -/
theorem centered_axial_cutoff_cancels_inverse
    {V : Type*} [AddCommGroup V] [Module ℝ V]
    (N A : V →ₗ[ℝ] V) (c : ℝ) (gamma f : V)
    (commute : ∀ x, N (A x) = A (N x))
    (source : (-c) • N gamma = f) :
    (-c) • N (A gamma) = A f := by
  rw [commute, ← A.map_smul, source]

#print axioms centered_axial_cutoff_cancels_inverse

end MathScope.M3.CD
