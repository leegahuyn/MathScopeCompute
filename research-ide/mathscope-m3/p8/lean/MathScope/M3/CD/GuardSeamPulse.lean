import Mathlib

open Set MeasureTheory

namespace MathScope.M3.CD

/-- An ordinarily smooth cutoff and all of its finite jets vanish on the
closed lower zero region. The upper analogue is used for the opposite face. -/
theorem finite_jet_zero_on_closed_lower_cutoff {f : ℝ → ℝ} {a x : ℝ}
    (hf : ContDiff ℝ ⊤ f) (hzero : EqOn f (fun _ => 0) (Iio a))
    (hx : x ≤ a) (n : ℕ) : iteratedDeriv n f x = 0 := by
  have hopen : EqOn (iteratedDeriv n f) (fun _ => 0) (Iio a) := by
    induction n with
    | zero => simpa using hzero
    | succ n ih =>
      rw [iteratedDeriv_succ]
      simpa using (ih.deriv isOpen_Iio)
  have hclosed := hopen.closure (hf.continuous_iteratedDeriv n le_top) continuous_const
  rw [closure_Iio] at hclosed
  exact hclosed hx

private theorem zero_integral_on_admitted_pulse {f : ℝ → ℂ} {x L : ℝ}
    (hx : x ∈ Icc 0 L) (hzero : ∀ w ∈ Icc 0 L, f w = 0) :
    (∫ w in 0..x, f w) = 0 := by
  calc
    (∫ w in 0..x, f w) = (∫ _ in 0..x, (0 : ℂ)) := by
      apply intervalIntegral.integral_congr
      intro w hw
      rw [uIcc_of_le hx.1] at hw
      exact hzero w ⟨hw.1, hw.2.trans hx.2⟩
    _ = 0 := by simp

/-- When the actual projected forcing is zero on the admitted closed
pulse, every term of the original ordered linear recurrence vanishes
there. Matrix entries are interpreted only on that same pulse. A finite
packet of differentiated equations can also be represented by its block
matrix, once differentiation and the zero differentiated seed are proved. -/
theorem zero_ordered_forced_pulse_terms {d : ℕ} {L : ℝ}
    (terms : ℕ → ℝ → Fin d → ℂ) (matrix : ℝ → Fin d → Fin d → ℂ)
    (forcing : ℝ → Fin d → ℂ)
    (hzero : ∀ w ∈ Icc 0 L, ∀ j, forcing w j = 0)
    (hseed : ∀ x ∈ Icc 0 L, ∀ j, terms 0 x j = ∫ w in 0..x, forcing w j)
    (hnext : ∀ n x, x ∈ Icc 0 L → ∀ j,
      terms (n + 1) x j = ∫ w in 0..x, ∑ k : Fin d, matrix w j k * terms n w k) :
    ∀ n x, x ∈ Icc 0 L → ∀ j, terms n x j = 0 := by
  intro n
  induction n with
  | zero =>
    intro x hx j
    rw [hseed x hx j]
    exact zero_integral_on_admitted_pulse hx (fun w hw => hzero w hw j)
  | succ n ih =>
    intro x hx j
    rw [hnext n x hx j]
    apply zero_integral_on_admitted_pulse hx
    intro w hw
    simp [ih w hw]

/-- The ordered infinite sum retains the face trace of its zero terms. -/
theorem zero_ordered_forced_pulse_sum {d : ℕ} {L : ℝ}
    (terms : ℕ → ℝ → Fin d → ℂ)
    (hterms : ∀ n x, x ∈ Icc 0 L → ∀ j, terms n x j = 0)
    (x : ℝ) (hx : x ∈ Icc 0 L) (j : Fin d) :
    (∑' n, terms n x j) = 0 := by
  simp [fun n => hterms n x hx j]

#print axioms finite_jet_zero_on_closed_lower_cutoff
#print axioms zero_ordered_forced_pulse_terms
#print axioms zero_ordered_forced_pulse_sum

end MathScope.M3.CD
