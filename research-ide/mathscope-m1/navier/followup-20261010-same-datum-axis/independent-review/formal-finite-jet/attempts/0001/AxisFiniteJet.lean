import NavierStokes.AxisReference
import Mathlib.Tactic

/-! The original complete coefficient space, its actual finite truncations,
and separately quantified arithmetic error. No new analytic hypothesis is
substituted for the original coefficient-space identities. -/

set_option maxHeartbeats 2000000
noncomputable section

namespace MathScope.AxisFiniteJet

open Set
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates
open NavierStokes.AxisEvaluation
open scoped BigOperators Topology

theorem coefficient_jet_error (I : Window) {epsilon E : ℝ} (hepsilon : 0 < epsilon)
    (A B : AxisSpace I epsilon) (herror : ‖A - B‖ ≤ E) (n m : ℕ)
    {eta : ℝ} (heta : eta ∈ Ioo I.left I.right) :
    |iteratedDeriv m (coefficient I (weight epsilon) A n) eta -
      iteratedDeriv m (coefficient I (weight epsilon) B n) eta| ≤
        E * weight epsilon n m := by
  rw [coefficient_iteratedDeriv I epsilon A n m heta,
    coefficient_iteratedDeriv I epsilon B n m heta]
  have hb := NavierStokes.AxisResolvent.axis_abs_jet_le I hepsilon (A - B) n m eta
  simp only [Submodule.coe_sub, jet_sub] at hb
  exact hb.trans (mul_le_mul_of_nonneg_right herror (weight_pos hepsilon n m).le)

theorem coefficient_jet_interval (I : Window) {epsilon E lo hi : ℝ} (hepsilon : 0 < epsilon)
    (A B : AxisSpace I epsilon) (herror : ‖A - B‖ ≤ E) (n m : ℕ)
    {eta : ℝ} (heta : eta ∈ Ioo I.left I.right)
    (hlo : lo ≤ iteratedDeriv m (coefficient I (weight epsilon) B n) eta)
    (hhi : iteratedDeriv m (coefficient I (weight epsilon) B n) eta ≤ hi) :
    lo - E * weight epsilon n m ≤ iteratedDeriv m (coefficient I (weight epsilon) A n) eta ∧
    iteratedDeriv m (coefficient I (weight epsilon) A n) eta ≤ hi + E * weight epsilon n m := by
  have hb := abs_le.mp (coefficient_jet_error I hepsilon A B herror n m heta)
  constructor <;> linarith [hb.1, hb.2]

theorem normalized_coefficient_jet_error (I : Window) {epsilon E scale : ℝ}
    (hepsilon : 0 < epsilon) (hscale : 0 ≤ scale)
    (A B : AxisSpace I epsilon) (herror : ‖A - B‖ ≤ E) (n m : ℕ)
    {eta : ℝ} (heta : eta ∈ Ioo I.left I.right) :
    |scale * iteratedDeriv m (coefficient I (weight epsilon) A n) eta -
      scale * iteratedDeriv m (coefficient I (weight epsilon) B n) eta| ≤
        scale * E * weight epsilon n m := by
  rw [← mul_sub, abs_mul, abs_of_nonneg hscale]
  simpa only [mul_assoc] using mul_le_mul_of_nonneg_left
    (coefficient_jet_error I hepsilon A B herror n m heta) hscale

def finiteJet (I : Window) (epsilon : ℝ) (A : AxisSpace I epsilon)
    (N k m : ℕ) (p : ℝ × ℝ) : ℝ :=
  ∑ n ∈ Finset.range N, term I epsilon A k m n p

def tailMajorant (epsilon C R : ℝ) (N k m : ℕ) : ℝ :=
  ∑' n : ℕ, majorant epsilon C R k m (n + N)

theorem finite_truncation_error (I : Window) {epsilon R : ℝ} (hepsilon : 0 < epsilon)
    (hR : 1 ≤ R) (hR20 : R < 20) (A : AxisSpace I epsilon)
    (N k m : ℕ) {p : ℝ × ℝ} (hp : |p.1| ≤ R) :
    ‖mixedSeries I epsilon A k m p - finiteJet I epsilon A N k m p‖ ≤
      tailMajorant epsilon ‖A‖ R N k m := by
  have hs := (mixedSeries_summable I hepsilon A k m (hp.trans_lt hR20)).sum_add_tsum_nat_add N
  change finiteJet I epsilon A N k m p +
    (∑' n : ℕ, term I epsilon A k m (n + N) p) = mixedSeries I epsilon A k m p at hs
  have heq : mixedSeries I epsilon A k m p - finiteJet I epsilon A N k m p =
      ∑' n : ℕ, term I epsilon A k m (n + N) p := by linarith
  rw [heq]
  exact tsum_of_norm_bounded
    (((summable_nat_add_iff N).mpr (summable_majorant hR hR20 k m)).hasSum)
    (fun n => term_bound I hepsilon hR A k m (n + N) hp)

def roundedJet (c : ℕ → ℝ) (N k : ℕ) (Y : ℝ) : ℝ :=
  ∑ n ∈ Finset.range N, polynomialJet n k Y * c n

def roundoffBound (delta : ℕ → ℝ) (N k : ℕ) (Y : ℝ) : ℝ :=
  ∑ n ∈ Finset.range N, |polynomialJet n k Y| * delta n

theorem finite_roundoff_error (I : Window) (epsilon : ℝ) (B : AxisSpace I epsilon)
    (N k m : ℕ) (p : ℝ × ℝ) (c delta : ℕ → ℝ)
    (hround : ∀ n ∈ Finset.range N, |jet I (weight epsilon) B.1 n m p.2 - c n| ≤ delta n) :
    ‖finiteJet I epsilon B N k m p - roundedJet c N k p.1‖ ≤
      roundoffBound delta N k p.1 := by
  rw [finiteJet, roundedJet, ← Finset.sum_sub_distrib]
  calc
    _ ≤ ∑ n ∈ Finset.range N,
        ‖term I epsilon B k m n p - polynomialJet n k p.1 * c n‖ := norm_sum_le _ _
    _ ≤ _ := by
      apply Finset.sum_le_sum
      intro n hn
      rw [term, ← mul_sub, norm_mul, Real.norm_eq_abs, Real.norm_eq_abs]
      exact mul_le_mul_of_nonneg_left (hround n hn) (abs_nonneg _)

/-- The errors of the nonlinear comparison, infinite truncation and finite
arithmetic remain separate in the final bound. -/
theorem mixed_jet_truncation_and_roundoff (I : Window) {epsilon R E : ℝ}
    (hepsilon : 0 < epsilon) (hR : 1 ≤ R) (hR20 : R < 20)
    (A B : AxisSpace I epsilon) (herror : ‖A - B‖ ≤ E)
    (N k m : ℕ) {p : ℝ × ℝ} (hp : |p.1| ≤ R) (c delta : ℕ → ℝ)
    (hround : ∀ n ∈ Finset.range N, |jet I (weight epsilon) B.1 n m p.2 - c n| ≤ delta n) :
    ‖mixedSeries I epsilon A k m p - roundedJet c N k p.1‖ ≤
      jetBound epsilon R k m * E +
        tailMajorant epsilon ‖B‖ R N k m + roundoffBound delta N k p.1 := by
  have hnonlinear := (mixedSeries_sub_bound I hepsilon hR hR20 A B k m hp).trans
    (mul_le_mul_of_nonneg_left herror (jetBound_nonneg hepsilon hR k m))
  have htail := finite_truncation_error I hepsilon hR hR20 B N k m hp
  have hround' := finite_roundoff_error I epsilon B N k m p c delta hround
  have htri1 := norm_sub_le (mixedSeries I epsilon A k m p)
    (mixedSeries I epsilon B k m p) (roundedJet c N k p.1)
  have htri2 := norm_sub_le (mixedSeries I epsilon B k m p)
    (finiteJet I epsilon B N k m p) (roundedJet c N k p.1)
  linarith

theorem actual_derivative_truncation_and_roundoff (I : Window) {epsilon R E Y eta : ℝ}
    (hepsilon : 0 < epsilon) (hR : 1 ≤ R) (hR20 : R < 20)
    (A B : AxisSpace I epsilon) (herror : ‖A - B‖ ≤ E)
    (N k m : ℕ) (hY : |Y| ≤ R) (heta : eta ∈ Ioo I.left I.right)
    (c delta : ℕ → ℝ)
    (hround : ∀ n ∈ Finset.range N,
      |iteratedDeriv m (coefficient I (weight epsilon) B n) eta - c n| ≤ delta n) :
    ‖iteratedDeriv m (fun x => iteratedDeriv k
        (fun y => profile I epsilon A (y, x)) Y) eta - roundedJet c N k Y‖ ≤
      jetBound epsilon R k m * E +
        tailMajorant epsilon ‖B‖ R N k m + roundoffBound delta N k Y := by
  rw [mixed_derivative_profile I hepsilon A k m (abs_lt.mp (hY.trans_lt hR20)) heta]
  apply mixed_jet_truncation_and_roundoff I hepsilon hR hR20 A B herror N k m hY c delta
  intro n hn
  simpa only [coefficient_iteratedDeriv I epsilon B n m heta] using hround n hn

/-! A computable factorial tail for the actual reference series. -/

theorem bessel_tail_step {k N : ℕ} (hk : 1 ≤ k) (hN : 2 ≤ N)
    {t : ℝ} (ht : |t| ≤ 3) (n : ℕ) :
    ‖NavierStokes.AxisSeries.term k (n + N + 1) t‖ ≤
      (1 / 2 : ℝ) * ‖NavierStokes.AxisSeries.term k (n + N) t‖ := by
  rw [NavierStokes.AxisSeries.term_succ_ratio, norm_mul, Real.norm_eq_abs, abs_div, abs_neg]
  have hnn : (2 : ℝ) ≤ ((n + N : ℕ) : ℝ) := by exact_mod_cast (show 2 ≤ n + N by omega)
  have hkk : (1 : ℝ) ≤ (k : ℝ) := by exact_mod_cast hk
  have hd : 0 < (((n + N : ℕ) : ℝ) + 1) * (((n + N : ℕ) : ℝ) + k + 1) := by positivity
  rw [abs_of_pos hd]
  apply mul_le_mul_of_nonneg_right _ (norm_nonneg _)
  apply (div_le_iff₀ hd).mpr
  have hm := mul_le_mul
    (show (3 : ℝ) ≤ ((n + N : ℕ) : ℝ) + 1 by linarith)
    (show (4 : ℝ) ≤ ((n + N : ℕ) : ℝ) + k + 1 by linarith)
    (by norm_num : (0 : ℝ) ≤ 4) (by positivity : 0 ≤ ((n + N : ℕ) : ℝ) + 1)
  linarith

theorem bessel_tail_geometric {k N : ℕ} (hk : 1 ≤ k) (hN : 2 ≤ N)
    {t : ℝ} (ht : |t| ≤ 3) (n : ℕ) :
    ‖NavierStokes.AxisSeries.term k (n + N) t‖ ≤
      ‖NavierStokes.AxisSeries.term k N t‖ * (1 / 2 : ℝ) ^ n := by
  induction n with
  | zero => simp
  | succ n ih =>
      have hs := bessel_tail_step hk hN ht n
      rw [show n + 1 + N = n + N + 1 by omega]
      calc
        _ ≤ (1 / 2 : ℝ) * ‖NavierStokes.AxisSeries.term k (n + N) t‖ := hs
        _ ≤ (1 / 2 : ℝ) * (‖NavierStokes.AxisSeries.term k N t‖ * (1 / 2 : ℝ) ^ n) := by gcongr
        _ = _ := by rw [pow_succ]; ring

theorem bessel_finite_tail_error {k N : ℕ} (hk : 1 ≤ k) (hN : 2 ≤ N)
    {t : ℝ} (ht : |t| ≤ 3) :
    ‖NavierStokes.AxisSeries.bessel k t -
      ∑ n ∈ Finset.range N, NavierStokes.AxisSeries.term k n t‖ ≤
        2 * (3 : ℝ) ^ N / ((N.factorial : ℝ) * ((N + k).factorial : ℝ)) := by
  have hs := (NavierStokes.AxisSeries.summable_term k t).sum_add_tsum_nat_add N
  have heq : NavierStokes.AxisSeries.bessel k t -
      (∑ n ∈ Finset.range N, NavierStokes.AxisSeries.term k n t) =
        ∑' n : ℕ, NavierStokes.AxisSeries.term k (n + N) t := by
    change (∑ n ∈ Finset.range N, NavierStokes.AxisSeries.term k n t) +
      (∑' n : ℕ, NavierStokes.AxisSeries.term k (n + N) t) =
        NavierStokes.AxisSeries.bessel k t at hs
    linarith
  rw [heq]
  have hb : ‖∑' n : ℕ, NavierStokes.AxisSeries.term k (n + N) t‖ ≤
      ∑' n : ℕ, ‖NavierStokes.AxisSeries.term k N t‖ * (1 / 2 : ℝ) ^ n :=
    tsum_of_norm_bounded
      (((summable_geometric_of_lt_one (by norm_num : (0 : ℝ) ≤ 1 / 2)
        (by norm_num : (1 / 2 : ℝ) < 1)).mul_left _).hasSum)
      (bessel_tail_geometric hk hN ht)
  have hterm : ‖NavierStokes.AxisSeries.term k N t‖ ≤
      (3 : ℝ) ^ N / ((N.factorial : ℝ) * ((N + k).factorial : ℝ)) := by
    simp only [NavierStokes.AxisSeries.term, norm_div, norm_pow, Real.norm_eq_abs,
      abs_neg, abs_mul, abs_of_nonneg (Nat.cast_nonneg (N.factorial)),
      abs_of_nonneg (Nat.cast_nonneg ((N + k).factorial))]
    gcongr
  rw [tsum_mul_left, tsum_geometric_of_lt_one
    (by norm_num : (0 : ℝ) ≤ 1 / 2) (by norm_num : (1 / 2 : ℝ) < 1)] at hb
  norm_num at hb
  linarith

end MathScope.AxisFiniteJet

#print axioms MathScope.AxisFiniteJet.coefficient_jet_error
#print axioms MathScope.AxisFiniteJet.coefficient_jet_interval
#print axioms MathScope.AxisFiniteJet.normalized_coefficient_jet_error
#print axioms MathScope.AxisFiniteJet.finite_truncation_error
#print axioms MathScope.AxisFiniteJet.finite_roundoff_error
#print axioms MathScope.AxisFiniteJet.mixed_jet_truncation_and_roundoff
#print axioms MathScope.AxisFiniteJet.actual_derivative_truncation_and_roundoff
#print axioms MathScope.AxisFiniteJet.bessel_finite_tail_error
