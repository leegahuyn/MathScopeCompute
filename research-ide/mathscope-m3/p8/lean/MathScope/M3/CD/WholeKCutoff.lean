import Mathlib.Analysis.Complex.ExponentialBounds
import Mathlib.Tactic

/-!
# Physical chart and cutoff scope on the N7 transition slab

The accompanying exact replay pins the source cutoff recurrences and slab.
These lemmas concern their real arguments. They require the original
functions to supply the stated recurrences and do not construct their fields.
-/

namespace MathScope.M3.CD

/-- The two terms in the exact log-scale maximum absorb the source
logarithmic factor and the positive cutoff-curl coefficient. -/
theorem actual_shrinking_log_threshold {x γ P C j : ℝ}
    (hx : 0 ≤ x) (hγ : 0 < γ) (hP : 0 ≤ P) (hC : 0 < C)
    (hlog : Real.log (1 + x) ≤ Real.sqrt x)
    (hPscale : (2 * P / γ) ^ 2 ≤ x)
    (hCscale : 2 * (C + j) / γ ≤ x) :
    Real.exp (Real.log C + P * Real.log (1 + x) - γ * x) ≤ Real.exp (-j) := by
  have ht : 2 * P / γ ≤ Real.sqrt x := by
    have hsq := Real.sq_sqrt hx
    have hp : 0 ≤ 2 * P / γ := by positivity
    have hr : 0 ≤ Real.sqrt x := Real.sqrt_nonneg _
    by_contra! h
    have hpos := mul_pos (sub_pos.mpr h) (show 0 < 2 * P / γ + Real.sqrt x by linarith)
    nlinarith
  have hmul : 2 * P ≤ γ * Real.sqrt x := by
    simpa only [mul_comm] using (div_le_iff₀ hγ).mp ht
  have hlogMul := mul_le_mul_of_nonneg_left hlog hP
  have hhalf := mul_le_mul_of_nonneg_right hmul (Real.sqrt_nonneg x)
  have hsq := Real.sq_sqrt hx
  have hhalf' : 2 * (P * Real.sqrt x) ≤ γ * x := by
    calc
      2 * (P * Real.sqrt x) = (2 * P) * Real.sqrt x := by ring
      _ ≤ (γ * Real.sqrt x) * Real.sqrt x := hhalf
      _ = γ * x := by rw [mul_assoc, ← pow_two, hsq]
  have hc := (div_le_iff₀ hγ).mp hCscale
  exact Real.exp_le_exp.mpr (by linarith [Real.log_le_sub_one_of_pos hC])

/-- The same literal core stress branch applies at the clipped
representative even when its normalized time is slightly below one. -/
theorem whole_k_representative_core_stress {s w r a t : ℝ}
    (ha : 0 < a) (hw : 0 < w) (hwHalf : w < 1 / 2)
    (hwt : 4 * w < t / 128) (hs : 1 - w < s)
    (hr : r ^ 2 < 2 * a * (1 + w)) :
    r ^ 2 / (2 * s) < a * Real.exp (t / 128) := by
  have hstep : 1 + w < (1 + 4 * w) * (1 - w) := by
    nlinarith [mul_pos hw (show 0 < 2 - 4 * w by linarith)]
  have hbound : 1 + w < (1 + 4 * w) * s :=
    lt_trans hstep (mul_lt_mul_of_pos_left hs (by positivity))
  have hs' : 0 < 2 * s := by linarith
  have hr' : r ^ 2 / (2 * s) < a * (1 + 4 * w) := by
    apply (div_lt_iff₀ hs').mpr
    have hm := mul_lt_mul_of_pos_left hbound (show 0 < 2 * a by positivity)
    nlinarith
  have hexp : 1 + 4 * w < Real.exp (t / 128) := by
    linarith [Real.add_one_le_exp (t / 128)]
  exact lt_trans hr' (mul_lt_mul_of_pos_left hexp ha)

/-- The fourth selected correction has no support in the outer axial
transition of the whole-K slab. The normalized bound follows from
`a4 * qBig ≥ exp 4 > 54` and the original cutoff endpoint at one. -/
theorem whole_k_fourth_correction_axial_plateau {Q ρ η D : ℝ}
    (hQ : 0 < Q) (hupper : Q < 16 / 27) (hρ : 1 / 2 ≤ ρ)
    (hD : 0 < D) (hroot : ρ = Q * (1 - η ^ 2)) :
    ρ < 16 / 27 ∧ |η * Q ^ D| < 1 / 2 := by
  have hQ₁ : Q < 1 := by linarith
  have heta₀ : 0 < 1 - η ^ 2 := by
    by_contra! h
    have hprod := mul_nonpos_of_nonneg_of_nonpos hQ.le h
    linarith
  have hetaSq : η ^ 2 < 5 / 32 := by
    have hmul := mul_lt_mul_of_pos_right hupper heta₀
    linarith
  have hetaAbs : |η| < 1 / 2 := by
    by_contra! h
    have hsq := pow_le_pow_left₀ (show (0 : ℝ) ≤ 1 / 2 by norm_num) h 2
    rw [sq_abs] at hsq
    linarith
  have hpower : Q ^ D < 1 := by
    simpa only [Real.rpow_zero] using
      (Real.rpow_lt_rpow_of_exponent_gt hQ hQ₁ hD)
  have hp : 0 ≤ Q ^ D := Real.rpow_nonneg hQ.le _
  constructor
  · have hle := mul_le_mul_of_nonneg_left (show 1 - η ^ 2 ≤ 1 by nlinarith [sq_nonneg η]) hQ.le
    linarith
  · rw [abs_mul, abs_of_nonneg hp]
    calc
      |η| * Q ^ D ≤ |η| * 1 := mul_le_mul_of_nonneg_left hpower.le (abs_nonneg η)
      _ < 1 / 2 := by simpa using hetaAbs

/-- Every positive root of the normalized physical chart lies in the
source bracket on the whole cutoff slab. The root equation is obtained by
substituting `q = tau0 * Q`, `z = tau0^D * zeta`, `tau = tau0 * rho`,
and `sigma = zeta^2`. -/
theorem whole_k_normalized_q_bounds {Q rho sigma alpha : ℝ}
    (hQ : 0 < Q) (hrho₀ : 1 / 2 ≤ rho) (hrho₁ : rho ≤ 1)
    (hsigma₀ : 0 ≤ sigma) (hsigma₁ : sigma ≤ 1 / 2)
    (halpha : alpha < 1) (hroot : Q - sigma * Q ^ alpha = rho) :
    1 / 2 ≤ Q ∧ Q < 2 := by
  have hp : 0 ≤ Q ^ alpha := Real.rpow_nonneg hQ.le _
  constructor
  · linarith [mul_nonneg hsigma₀ hp]
  · by_contra! h
    have hpow : Q ^ alpha < Q := by
      simpa only [Real.rpow_one] using
        (Real.rpow_lt_rpow_of_exponent_lt (show 1 < Q by linarith) halpha)
    have hmul : sigma * Q ^ alpha ≤ (1 / 2) * Q ^ alpha :=
      mul_le_mul_of_nonneg_right hsigma₁ hp
    linarith

private theorem exp_five_gt_sixtyfour : (64 : ℝ) < Real.exp 5 := by
  have hbase : (5 / 2 : ℝ) < Real.exp 1 :=
    lt_trans (by norm_num) Real.exp_one_gt_d9
  have hpow : (5 / 2 : ℝ) ^ (5 : ℕ) < Real.exp 1 ^ (5 : ℕ) :=
    pow_lt_pow_left₀ hbase (by norm_num) (by decide)
  have hnat : Real.exp 5 = Real.exp 1 ^ (5 : ℕ) := by
    simpa using Real.exp_nat_mul 1 5
  rw [hnat]
  exact lt_trans (by norm_num) hpow

/-- With the actual initial log-scale and unit growth, all stage arguments
from five onward lie strictly inside the zero branch throughout the slab. -/
theorem whole_k_correction_cutoff_argument {qBig q : ℝ} (L : ℕ → ℝ)
    (hqBig : 0 < qBig) (hq : qBig / 64 ≤ q)
    (hL₀ : L 0 = Real.log (1 / qBig)) (hL : ∀ j, L j + 1 ≤ L (j + 1))
    {j : ℕ} (hj : 5 ≤ j) :
    1 < Real.exp (L j) * q := by
  have hlinear : ∀ n : ℕ, Real.log (1 / qBig) + (n : ℝ) ≤ L n := by
    intro n
    induction n with
    | zero => simp [hL₀]
    | succ n ih =>
      rw [Nat.cast_succ]
      linarith [hL n]
  have hcast : (5 : ℝ) ≤ (j : ℝ) := by exact_mod_cast hj
  have hlog : Real.log (1 / qBig) + 5 ≤ L j := by linarith [hlinear j]
  have hExp : Real.exp (Real.log (1 / qBig) + 5) ≤ Real.exp (L j) :=
    Real.exp_le_exp.mpr hlog
  rw [Real.exp_add, Real.exp_log (by positivity : 0 < 1 / qBig)] at hExp
  have hDiv : (1 / qBig) * (64 : ℝ) < (1 / qBig) * Real.exp 5 :=
    mul_lt_mul_of_pos_left exp_five_gt_sixtyfour (by positivity)
  calc
    1 = ((1 / qBig) * 64) * (qBig / 64) := by field_simp [hqBig.ne'] <;> ring
    _ < ((1 / qBig) * Real.exp 5) * (qBig / 64) :=
      mul_lt_mul_of_pos_right hDiv (by positivity)
    _ ≤ Real.exp (L j) * (qBig / 64) :=
      mul_le_mul_of_nonneg_right hExp (by positivity)
    _ ≤ Real.exp (L j) * q := mul_le_mul_of_nonneg_left hq (Real.exp_pos _).le

/-- The pinned common-background selector anchors b1 and gives a factor
16 at order two, then at least two. At order four equality at the
cutoff seam is allowed. -/
theorem whole_k_background_cutoff_argument {qBig q : ℝ} (b : ℕ → ℝ)
    (hqBig : 0 < qBig) (hq : qBig / 64 ≤ q)
    (hb₁ : 1 ≤ b 1 * qBig) (hb₂ : 16 * b 1 ≤ b 2)
    (hb₃ : 2 * b 2 ≤ b 3) (hb₄ : 2 * b 3 ≤ b 4)
    (hb : ∀ n : ℕ, 4 ≤ n → b 4 ≤ b n) {n : ℕ} (hn : 4 ≤ n) :
    1 ≤ b n * q := by
  have h₂ := mul_le_mul_of_nonneg_right hb₂ hqBig.le
  have h₃ := mul_le_mul_of_nonneg_right hb₃ hqBig.le
  have h₄ := mul_le_mul_of_nonneg_right hb₄ hqBig.le
  have hbound : 64 ≤ b 4 * qBig := by nlinarith
  have hbnonneg : 0 ≤ b 4 := by
    by_contra! h
    have hnegative : b 4 * qBig < 0 := mul_neg_of_neg_of_pos h hqBig
    linarith
  have hq₀ : 0 ≤ q := le_trans (by positivity : 0 ≤ qBig / 64) hq
  calc
    1 ≤ b 4 * (qBig / 64) := by linarith
    _ ≤ b 4 * q := mul_le_mul_of_nonneg_left hq hbnonneg
    _ ≤ b n * q := mul_le_mul_of_nonneg_right (hb n hn) hq₀

/-- At rho=1/2 the axis has Q=1/2 and zeta=2/3 has Q>7/8. Even a
window [a,exp(1/2)*a] that covers both of these interior spatial points
would contradict the source's narrow-window width. -/
theorem whole_k_narrow_q_window_obstruction {Q a alpha : ℝ}
    (hQ : 0 < Q) (halpha : alpha < 1)
    (hroot : Q - (4 / 9) * Q ^ alpha = 1 / 2) :
    ¬ (a ≤ 1 / 2 ∧ Q ≤ Real.exp (1 / 2) * a) := by
  have hQlarge : 7 / 8 < Q := by
    by_contra! h
    have hpow : Q < Q ^ alpha := by
      simpa only [Real.rpow_one] using
        (Real.rpow_lt_rpow_of_exponent_gt hQ (show Q < 1 by linarith) halpha)
    linarith
  have heSquare : (Real.exp (1 / 2)) ^ (2 : ℕ) = Real.exp 1 := by
    rw [pow_two, ← Real.exp_add]
    norm_num
  have he : Real.exp (1 / 2) < 7 / 4 := by
    by_contra! h
    have hp := pow_le_pow_left₀ (by norm_num : 0 ≤ (7 / 4 : ℝ)) h 2
    rw [heSquare] at hp
    linarith [Real.exp_one_lt_three]
  intro hcover
  have hm := mul_le_mul_of_nonneg_left hcover.1 (Real.exp_pos (1 / 2)).le
  linarith [hcover.2]

/-- At viscosity one, the full outer cutoff on an angle-independent
heat swirl leaves the displayed time, Laplacian and pressure terms.
The inputs are the cylindrical product-rule terms in the exterior. -/
theorem whole_k_heat_exterior_cutoff_force
    (C Ct Cr Cz lapC K Kr Kt lapK p pr r : ℝ)
    (heat : Kt = lapK) (centrifugal : pr = K ^ 2 / r) :
    (Ct * K + C * Kt - (lapC * K + 2 * Cr * Kr + C * lapK),
      -(C * K) ^ 2 / r + Cr * p + C * pr, Cz * p) =
    ((Ct - lapC) * K - 2 * Cr * Kr,
      C * (1 - C) * K ^ 2 / r + Cr * p, Cz * p) := by
  rw [heat, centrifugal]
  apply Prod.ext
  · dsimp
    ring
  · apply Prod.ext
    · dsimp
      ring
    · rfl

#print axioms whole_k_normalized_q_bounds
#print axioms whole_k_correction_cutoff_argument
#print axioms whole_k_background_cutoff_argument
#print axioms whole_k_narrow_q_window_obstruction
#print axioms whole_k_heat_exterior_cutoff_force

/-- The fifth original selector has a factor-two margin even at the
smallest physical q in the whole-K slab. -/
theorem whole_k_fifth_selector_margin {qBig q : ℝ} (b : ℕ → ℝ)
    (hqBig : 0 < qBig) (hq : qBig / 64 ≤ q)
    (hb₁ : 1 ≤ b 1 * qBig) (hb₂ : 16 * b 1 ≤ b 2)
    (hb₃ : 2 * b 2 ≤ b 3) (hb₄ : 2 * b 3 ≤ b 4)
    (hb₅ : 2 * b 4 ≤ b 5) (hmono : Monotone b) :
    2 ≤ b 5 * q := by
  have h4 := whole_k_background_cutoff_argument b hqBig hq hb₁ hb₂ hb₃ hb₄
    (fun _ hn => hmono hn) (n := 4) (by decide)
  have hqpos : 0 ≤ q := le_trans (by positivity : 0 ≤ qBig / 64) hq
  nlinarith [mul_le_mul_of_nonneg_right hb₅ hqpos]

/-- Given the original log-scale growth and fifth margin, select an
actual integer reference in one of the five finite coefficient windows. -/
theorem whole_k_margin_prefix_selector (a : ℕ → ℝ) {t : ℝ} {base : ℤ}
    (hbase : (base : ℝ) ≤ t) (h5 : t + 1 ≤ a 5)
    (growth : ∀ n, 1 ≤ n → n ≤ 4 → a n + 1 ≤ a (n + 1)) :
    ∃ n : ℕ, n ≤ 4 ∧ ∃ j : ℤ, base ≤ j ∧
      (n = 0 ∨ ⌊a n⌋ ≤ j) ∧ j < ⌊a (n + 1)⌋ ∧
      t - 1 < (j : ℝ) ∧ (j : ℝ) < t + 1 ∧ t + 1 ≤ a (n + 1) := by
  have floor_lt_of_add {j : ℤ} {x : ℝ} (h : (j : ℝ) + 1 ≤ x) : j < ⌊x⌋ := by
    by_contra! hle
    have hcast : (⌊x⌋ : ℝ) ≤ (j : ℝ) := by exact_mod_cast hle
    linarith [Int.lt_floor_add_one x]
  have htbase : base ≤ ⌊t⌋ := Int.le_floor.mpr hbase
  have htleft : t - 1 < (⌊t⌋ : ℝ) := by linarith [Int.lt_floor_add_one t]
  have htright : (⌊t⌋ : ℝ) < t + 1 := by linarith [Int.floor_le t]
  have make (n : ℕ) (hn₁ : 1 ≤ n) (hn₄ : n ≤ 4)
      (hprev : a n < t + 1) (hnext : t + 1 ≤ a (n + 1)) :
      ∃ j : ℤ, base ≤ j ∧ (n = 0 ∨ ⌊a n⌋ ≤ j) ∧ j < ⌊a (n + 1)⌋ ∧
        t - 1 < (j : ℝ) ∧ (j : ℝ) < t + 1 ∧ t + 1 ≤ a (n + 1) := by
    by_cases h : ⌊a n⌋ ≤ ⌊t⌋
    · exact ⟨⌊t⌋, htbase, Or.inr h, floor_lt_of_add (by linarith [Int.floor_le t]),
        htleft, htright, hnext⟩
    · have hge : ⌊t⌋ ≤ ⌊a n⌋ := le_of_lt (lt_of_not_ge h)
      have hc : (⌊t⌋ : ℝ) ≤ (⌊a n⌋ : ℝ) := by exact_mod_cast hge
      have hu := floor_lt_of_add
        (x := a (n + 1)) (j := ⌊a n⌋)
        (by linarith [growth n hn₁ hn₄, Int.floor_le (a n)])
      exact ⟨⌊a n⌋, htbase.trans hge, Or.inr le_rfl, hu,
        lt_of_lt_of_le htleft hc, lt_of_le_of_lt (Int.floor_le _) hprev, hnext⟩
  by_cases h1 : t + 1 ≤ a 1
  · exact ⟨0, by decide, ⌊t⌋, htbase, Or.inl rfl,
      floor_lt_of_add (by linarith [Int.floor_le t]), htleft, htright, h1⟩
  by_cases h2 : t + 1 ≤ a 2
  · exact ⟨1, by decide, make 1 (by decide) (by decide) (lt_of_not_ge h1) h2⟩
  by_cases h3 : t + 1 ≤ a 3
  · exact ⟨2, by decide, make 2 (by decide) (by decide) (lt_of_not_ge h2) h3⟩
  by_cases h4 : t + 1 ≤ a 4
  · exact ⟨3, by decide, make 3 (by decide) (by decide) (lt_of_not_ge h3) h4⟩
  exact ⟨4, by decide, make 4 (by decide) (by decide) (lt_of_not_ge h4) h5⟩

/-- Only three original integer labels can be active on the whole-K slab. -/
theorem whole_k_active_labels {c j : ℤ} {t : ℝ}
    (hlo : (c : ℝ) + 14 < t) (hhi : t ≤ (c : ℝ) + 16)
    (guard : |t - (j : ℝ)| < 3 / 4) : c + 14 ≤ j ∧ j ≤ c + 16 := by
  obtain ⟨ha, hb⟩ := abs_lt.mp guard
  have lower : ((c + 13 : ℤ) : ℝ) < (j : ℝ) := by push_cast; linarith
  have upper : (j : ℝ) < ((c + 17 : ℤ) : ℝ) := by push_cast; linarith
  have lowerInt : c + 13 < j := by exact_mod_cast lower
  have upperInt : j < c + 17 := by exact_mod_cast upper
  omega

#print axioms whole_k_fifth_selector_margin
#print axioms whole_k_margin_prefix_selector
#print axioms whole_k_active_labels

/-- A relative-time strip at the bottom of the whole-K slab bounds both slow coordinates. -/
theorem whole_k_bottom_strip_eta_time {ρ η δ : ℝ}
    (hρ : 1 / 2 ≤ ρ) (hη : 0 < 1 - η ^ 2) (hδ : 0 ≤ δ)
    (hstrip : 2 * ρ / (1 - η ^ 2) < 1 + δ) :
    η ^ 2 < δ / (1 + δ) ∧ ρ < (1 + δ) / 2 := by
  have hprod := (div_lt_iff₀ hη).mp hstrip
  have hd : 0 < 1 + δ := by linarith
  constructor
  · apply (lt_div_iff₀ hd).mpr
    nlinarith only [hprod, hρ]
  · have hnon : 0 ≤ η ^ 2 * (1 + δ) := mul_nonneg (sq_nonneg η) hd.le
    nlinarith only [hprod, hnon]

/-- Clipping the original time interval can only increase this lower midpoint margin. -/
theorem whole_k_time_midpoint_floor {w center left right : ℝ}
    (hc : 1 ≤ center) (hleft : center - w ≤ left) (hopen : left < right) :
    1 - w < (left + right) / 2 := by
  linarith

/-- One authenticated lower comparison on the omitted scale closes the representative margin. -/
theorem whole_k_bottom_strip_selector_margin {qMin w b qRep : ℝ}
    (hq : 0 < qMin) (hw : w < 1)
    (hscale : 1 ≤ b * qMin * (1 - w)) (hrep : qMin * (1 - w) < qRep) :
    1 < b * qRep := by
  have hf : 0 < qMin * (1 - w) := mul_pos hq (sub_pos.mpr hw)
  have hs : 1 ≤ b * (qMin * (1 - w)) := by simpa only [mul_assoc] using hscale
  have hb : 0 < b := by
    by_contra! h
    have hn := mul_nonpos_of_nonpos_of_nonneg h hf.le
    linarith
  exact lt_of_le_of_lt hs (mul_lt_mul_of_pos_left hrep hb)

#print axioms actual_shrinking_log_threshold
#print axioms whole_k_representative_core_stress
#print axioms whole_k_fourth_correction_axial_plateau
#print axioms whole_k_bottom_strip_eta_time
#print axioms whole_k_time_midpoint_floor
#print axioms whole_k_bottom_strip_selector_margin

/-- The exact third-scale seam has a direct physical-coordinate test.
The monotonicity is supplied by the original inverse on its admitted bracket. -/
theorem whole_k_third_background_physical_split {Q ρ ζ h : ℝ}
    (hQ : Q ∈ Set.Icc (1 / 2 : ℝ) 2)
    (hmono : StrictMonoOn (fun x : ℝ => x - ζ ^ 2 * x ^ (2 * h))
      (Set.Icc (1 / 2 : ℝ) 2))
    (hroot : Q - ζ ^ 2 * Q ^ (2 * h) = ρ) :
    (Q < 1 ↔ ρ + ζ ^ 2 < 1) ∧
      (Q = 1 ↔ ρ + ζ ^ 2 = 1) := by
  have hOne : (1 : ℝ) ∈ Set.Icc (1 / 2 : ℝ) 2 := ⟨by norm_num, by norm_num⟩
  have hforward : Q < 1 → ρ + ζ ^ 2 < 1 := by
    intro hlt
    have hs := hmono hQ hOne hlt
    simp only [Real.one_rpow] at hs
    linarith
  have hbackward : 1 < Q → 1 < ρ + ζ ^ 2 := by
    intro hlt
    have hs := hmono hOne hQ hlt
    simp only [Real.one_rpow] at hs
    linarith
  have hseam : Q = 1 → ρ + ζ ^ 2 = 1 := by
    intro hEq
    rw [hEq, Real.one_rpow] at hroot
    linarith
  constructor
  · refine ⟨hforward, ?_⟩
    intro hlt
    rcases lt_trichotomy Q 1 with h | h | h
    · exact h
    · linarith [hseam h]
    · linarith [hbackward h]
  · refine ⟨hseam, ?_⟩
    intro hEq
    rcases lt_trichotomy Q 1 with h | h | h
    · linarith [hforward h]
    · exact h
    · linarith [hbackward h]

#print axioms whole_k_third_background_physical_split

/-- The original fourth selector's finite-frequency exponential may use
two exponential layers at this intermediate step. -/
theorem fourth_selector_frequency_atom {R N A B : ℝ} {k : ℕ}
    (hR : 2 < R) (hN : 1 ≤ N) (hk : k ≤ 72)
    (hfreq : 1 + N ≤ R ^ 51) (hA : A ≤ Real.exp R)
    (hB : R ^ 4096 ≤ B) :
    Real.exp ((1 + N) ^ k * A / N) ≤ Real.exp (Real.exp B) := by
  have hR₀ : 0 ≤ R := by linarith
  have hR₁ : 1 ≤ R := by linarith
  have hN₀ : 0 < N := by linarith
  have hP : (1 + N) ^ k ≤ R ^ 3672 := by
    calc
      _ ≤ (1 + N) ^ 72 := pow_le_pow_right₀ (by linarith) hk
      _ ≤ (R ^ 51) ^ 72 := pow_le_pow_left₀ (by linarith) hfreq 72
      _ = R ^ 3672 := by simpa only [← pow_mul]
  have hpower : R ^ 3672 + R ≤ R ^ 4096 := by
    have hbase : R ≤ R ^ 3672 := by
      simpa only [pow_one] using (pow_le_pow_right₀ hR₁ (show 1 ≤ 3672 by decide))
    calc
      _ ≤ R ^ 3672 + R ^ 3672 := add_le_add (le_refl _) hbase
      _ = R ^ 3672 * 2 := by rw [mul_two]
      _ ≤ R ^ 3672 * R := mul_le_mul_of_nonneg_left hR.le (pow_nonneg hR₀ _)
      _ = R ^ 3673 := (pow_succ R 3672).symm
      _ ≤ R ^ 4096 := pow_le_pow_right₀ hR₁ (by decide)
  apply Real.exp_le_exp.mpr
  calc
    (1 + N) ^ k * A / N ≤ (1 + N) ^ k * Real.exp R / N :=
      div_le_div_of_nonneg_right (mul_le_mul_of_nonneg_left hA (by positivity)) hN₀.le
    _ ≤ (1 + N) ^ k * Real.exp R := div_le_self (by positivity) hN
    _ ≤ R ^ 3672 * Real.exp R := mul_le_mul_of_nonneg_right hP (Real.exp_pos R).le
    _ ≤ Real.exp (R ^ 3672) * Real.exp R :=
      mul_le_mul_of_nonneg_right (by linarith [Real.add_one_le_exp (R ^ 3672)]) (Real.exp_pos R).le
    _ = Real.exp (R ^ 3672 + R) := (Real.exp_add _ _).symm
    _ ≤ Real.exp B := Real.exp_le_exp.mpr (hpower.trans hB)

#print axioms fourth_selector_frequency_atom

/-- A smooth cutoff zero on the open upper interval has zero finite jets
at the closed cutoff boundary as well. -/
theorem finite_jet_zero_on_closed_upper_cutoff {f : ℝ → ℝ} {a x : ℝ}
    (hf : ContDiff ℝ ⊤ f) (hzero : Set.EqOn f (fun _ => 0) (Set.Ioi a))
    (hx : a ≤ x) (n : ℕ) : iteratedDeriv n f x = 0 := by
  have hopen : Set.EqOn (iteratedDeriv n f) (fun _ => 0) (Set.Ioi a) := by
    induction n with
    | zero => simpa using hzero
    | succ n ih =>
      rw [iteratedDeriv_succ]
      simpa using (ih.deriv isOpen_Ioi)
  have hclosed := hopen.closure (hf.continuous_iteratedDeriv n le_top) continuous_const
  rw [closure_Ioi] at hclosed
  exact hclosed hx

/-- The actual fourth-scale identity puts the entire physical slab in
the closed zero region, including its lower time face. -/
theorem fourth_cutoff_physical_finite_jet {f : ℝ → ℝ} {b Q q : ℝ}
    (hf : ContDiff ℝ ⊤ f) (hzero : Set.EqOn f (fun _ => 0) (Set.Ioi (1 : ℝ)))
    (hQ : 0 < Q) (hscale : b * Q = 64) (hq : Q / 64 ≤ q) (n : ℕ) :
    iteratedDeriv n f (b * q) = 0 := by
  have hb : 0 < b := by
    by_contra! h
    have hbad := mul_nonpos_of_nonpos_of_nonneg h hQ.le
    rw [hscale] at hbad
    norm_num at hbad
  have hface : b * (Q / 64) = 1 := by
    rw [mul_div_assoc, hscale]
    norm_num
  have hq' := mul_le_mul_of_nonneg_left hq hb.le
  rw [hface] at hq'
  exact finite_jet_zero_on_closed_upper_cutoff hf hzero hq' n

#print axioms fourth_cutoff_physical_finite_jet

end MathScope.M3.CD
