import Mathlib.Analysis.Fourier.AddCircle

open scoped BigOperators InnerProductSpace ComplexConjugate

namespace MathScope.M3.CD

variable {P : ℝ} [Fact (0 < P)]

/-- The finite Hermitian pairing for the normalized Haar measure on the circle. -/
theorem finite_circle_fourier_pairing (frequencies : Finset ℤ) (a b : ℤ → ℂ) :
    ⟪∑ n ∈ frequencies, a n • fourierLp (T := P) 2 n,
      ∑ n ∈ frequencies, b n • fourierLp (T := P) 2 n⟫_ℂ =
        ∑ n ∈ frequencies, conj (a n) * b n := by
  exact (orthonormal_fourier (T := P)).inner_sum a b frequencies

/-- Several source labels can have the same signed physical frequency.
Their complex amplitudes add before the Haar pairing. -/
theorem finite_circle_group_by_carrier {Label : Type*} (labels : Finset Label)
    (frequencies : Finset ℤ) (carrier : Label → ℤ) (a : Label → ℂ)
    (covers : ∀ j ∈ labels, carrier j ∈ frequencies) :
    (∑ j ∈ labels, a j • fourierLp (T := P) 2 (carrier j)) =
      ∑ n ∈ frequencies, (∑ j ∈ labels, if carrier j = n then a j else 0) •
        fourierLp (T := P) 2 n := by
  classical
  symm
  simp_rw [Finset.sum_smul]
  rw [Finset.sum_comm]
  refine Finset.sum_congr rfl fun j hj => ?_
  calc
    _ = ∑ n ∈ frequencies, if carrier j = n then
          a j • fourierLp (T := P) 2 n else 0 := by
      refine Finset.sum_congr rfl fun n _ => ?_
      split <;> simp_all
    _ = _ := by simp [covers j hj]

/-- The localized mean and the localized waves are orthogonal whenever the
cutoff and the commutator preserve their respective frequency supports. -/
theorem finite_circle_fourier_disjoint (frequencies : Finset ℤ) (a b : ℤ → ℂ)
    (disjoint : ∀ n ∈ frequencies, a n = 0 ∨ b n = 0) :
    ⟪∑ n ∈ frequencies, a n • fourierLp (T := P) 2 n,
      ∑ n ∈ frequencies, b n • fourierLp (T := P) 2 n⟫_ℂ = 0 := by
  rw [finite_circle_fourier_pairing]
  apply Finset.sum_eq_zero
  intro n hn
  rcases disjoint n hn with h | h <;> simp [h]

#print axioms finite_circle_fourier_pairing
#print axioms finite_circle_group_by_carrier
#print axioms finite_circle_fourier_disjoint

end MathScope.M3.CD
