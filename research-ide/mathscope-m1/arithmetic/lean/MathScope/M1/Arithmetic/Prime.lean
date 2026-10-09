import Mathlib.Data.Nat.Prime.Basic
import Mathlib.Order.Interval.Finset.Nat
import Mathlib.NumberTheory.LucasPrimality
import Mathlib.Tactic.NormNum

namespace MathScope.M1.Arithmetic
def PrimeSet : Set ℕ := {n | Nat.Prime n}
def primesIn (a b : ℕ) : Finset ℕ := (Finset.Icc a b).filter Nat.Prime

theorem prime_interval_complete (a b n : ℕ) :
    n ∈ primesIn a b ↔ a ≤ n ∧ n ≤ b ∧ n.Prime := by
  simp [primesIn, and_assoc]

theorem sieve_square_root_guard (n : ℕ) (hn : 2 ≤ n)
    (guard : ∀ d, 2 ≤ d → d ≤ Nat.sqrt n → ¬d ∣ n) : n.Prime :=
  Nat.prime_def_le_sqrt.mpr ⟨hn,guard⟩

theorem prime_only_square_root_guard (n : ℕ) (hn : 2 ≤ n)
    (guard : ∀ q, q.Prime → q ≤ Nat.sqrt n → ¬q ∣ n) : n.Prime := by
  apply sieve_square_root_guard n hn
  intro d hd hbound hdiv
  have hd1 : d ≠ 1 := by
    intro h
    rw [h] at hd
    norm_num at hd
  have hdpos : 0 < d := lt_of_lt_of_le (by decide : 0 < 2) hd
  exact guard d.minFac (Nat.minFac_prime hd1)
    (le_trans (Nat.minFac_le hdpos) hbound) ((Nat.minFac_dvd d).trans hdiv)

/-- The mathematical marking rule used by the segmented implementation.
The complete prime base through sqrt(b), not a probable-prime list, is required.
-/
theorem segmented_sieve_complete_on_interval (a b n : ℕ) (base : Finset ℕ)
    (hn : n ≤ b) (sound : ∀ q ∈ base, q.Prime)
    (complete : ∀ q, q.Prime → q ≤ Nat.sqrt b → q ∈ base) :
    (a ≤ n ∧ 2 ≤ n ∧ ∀ q ∈ base, q ≤ Nat.sqrt n → ¬q ∣ n) ↔
      a ≤ n ∧ n.Prime := by
  constructor
  · rintro ⟨ha,h2,guard⟩
    refine ⟨ha,prime_only_square_root_guard n h2 ?_⟩
    intro q hq hbound
    exact guard q (complete q hq (le_trans hbound (Nat.sqrt_le_sqrt hn))) hbound
  · rintro ⟨ha,hp⟩
    refine ⟨ha,hp.two_le,?_⟩
    intro q hq hbound
    exact (Nat.prime_def_le_sqrt.mp hp).2 q (sound q hq).two_le hbound

/-- Exact library adapter, not an assertion that JavaScript ran in the kernel. -/
theorem lucas_certificate_sound (p : ℕ) (a : ZMod p)
    (ha : a^(p-1)=1)
    (hd : ∀ q : ℕ, q.Prime → q ∣ p-1 → a^((p-1)/q) ≠ 1) : p.Prime :=
  lucas_primality p a ha hd

theorem pi_ten : (primesIn 2 10).card = 4 := by decide
theorem pi_hundred : (primesIn 2 100).card = 25 := by decide
theorem composite_controls : ¬Nat.Prime 341 ∧ ¬Nat.Prime 561 ∧ ¬Nat.Prime 1105 := by
  constructor
  · intro h
    have hd := (Nat.prime_def_lt'.mp h).2 11 (by decide) (by decide)
    exact hd (by decide)
  constructor
  · intro h
    have hd := (Nat.prime_def_lt'.mp h).2 3 (by decide) (by decide)
    exact hd (by decide)
  · intro h
    have hd := (Nat.prime_def_lt'.mp h).2 5 (by decide) (by decide)
    exact hd (by decide)

set_option pp.fullNames true
#check prime_interval_complete
#print axioms prime_interval_complete
#check sieve_square_root_guard
#print axioms sieve_square_root_guard
#check prime_only_square_root_guard
#print axioms prime_only_square_root_guard
#check segmented_sieve_complete_on_interval
#print axioms segmented_sieve_complete_on_interval
#check lucas_certificate_sound
#print axioms lucas_certificate_sound
#check pi_ten
#print axioms pi_ten
#check pi_hundred
#print axioms pi_hundred
#check composite_controls
#print axioms composite_controls
end MathScope.M1.Arithmetic
